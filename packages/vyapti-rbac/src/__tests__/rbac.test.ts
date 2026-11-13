import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { ExecutionContext } from '@nestjs/common';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import type { Reflector } from '@nestjs/core';
import { PermissionsGuard } from '../guards/permissions.guard.js';
import { RbacModule } from '../rbac.module.js';
import { GrantListSchema } from '../schema/grant.schema.js';
import { RolesService } from '../services/roles.service.js';
import type { Grant } from '../types/rbac.types.js';
import { InMemoryRbacPersistenceAdapter } from './in-memory-rbac.adapter.js';
import { buildRbacHarness } from './rbac-harness.js';

function buildExecutionContext(userId = 'user-1'): ExecutionContext {
    const request = { user: { id: userId } };
    return {
        switchToHttp: function switchToHttp() {
            return {
                getRequest: function getRequest() {
                    return request;
                },
            };
        },
        getHandler: function getHandler() {
            return function handler() {};
        },
        getClass: function getClass() {
            return class TestController {};
        },
    } as unknown as ExecutionContext;
}

function buildReflector(grant: Grant | undefined): Reflector {
    return {
        getAllAndOverride: function getAllAndOverride() {
            return grant;
        },
    } as unknown as Reflector;
}

describe('PermissionsGuard', function permissionsGuardTests() {
    it('allows an operation granted to the user role', async function test() {
        const adapter = new InMemoryRbacPersistenceAdapter();
        adapter.permissions.push({
            id: 'permission-1',
            roleId: 'editor',
            resource: 'article',
            action: 'update',
        });
        const harness = buildRbacHarness(adapter);
        const guard = new PermissionsGuard(
            buildReflector({ resource: 'article', action: 'update' }),
            harness.checker,
        );

        assert.equal(await guard.canActivate(buildExecutionContext()), true);
    });

    it('returns 404 when the grant is missing', async function test() {
        const adapter = new InMemoryRbacPersistenceAdapter();
        const harness = buildRbacHarness(adapter);
        const guard = new PermissionsGuard(
            buildReflector({ resource: 'article', action: 'delete' }),
            harness.checker,
        );

        await assert.rejects(
            guard.canActivate(buildExecutionContext()),
            NotFoundException,
        );
    });

    it('does not block a route without a grant', async function test() {
        const adapter = new InMemoryRbacPersistenceAdapter();
        const harness = buildRbacHarness(adapter);
        const guard = new PermissionsGuard(
            buildReflector(undefined),
            harness.checker,
        );

        assert.equal(await guard.canActivate(buildExecutionContext()), true);
    });

    it('allows any catalog action when the role has full access', async function test() {
        const adapter = new InMemoryRbacPersistenceAdapter();
        adapter.userRoleIds.set('user-1', ['admin']);
        const harness = buildRbacHarness(adapter);
        const guard = new PermissionsGuard(
            buildReflector({ resource: 'form', action: 'publish' }),
            harness.checker,
        );

        assert.equal(await guard.canActivate(buildExecutionContext()), true);
    });
});

describe('permission replacement', function replaceTests() {
    it('is visible on the next check', async function test() {
        const adapter = new InMemoryRbacPersistenceAdapter();
        const harness = buildRbacHarness(adapter);
        const grant: Grant = { resource: 'article', action: 'view' };
        const roles = new RolesService(
            adapter,
            harness.effectiveGrants,
            harness.catalogGrants,
            harness.cache,
        );

        assert.equal(
            await harness.checker.isAllowed({ userId: 'user-1', grant }),
            false,
        );

        await roles.replacePermissions({ roleId: 'editor', grants: [grant] });

        assert.equal(
            await harness.checker.isAllowed({ userId: 'user-1', grant }),
            true,
        );
    });

    it('rejects a grant that is not in the catalog', async function test() {
        const adapter = new InMemoryRbacPersistenceAdapter();
        const harness = buildRbacHarness(adapter);
        const roles = new RolesService(
            adapter,
            harness.effectiveGrants,
            harness.catalogGrants,
            harness.cache,
        );

        await assert.rejects(
            roles.replacePermissions({
                roleId: 'editor',
                grants: [{ resource: 'site', action: 'teleport' }],
            }),
            BadRequestException,
        );
        assert.equal(adapter.permissions.length, 0);
    });

    it('rejects grants on a full-access role', async function test() {
        const adapter = new InMemoryRbacPersistenceAdapter();
        const harness = buildRbacHarness(adapter);
        const roles = new RolesService(
            adapter,
            harness.effectiveGrants,
            harness.catalogGrants,
            harness.cache,
        );

        await assert.rejects(
            roles.replacePermissions({
                roleId: 'admin',
                grants: [{ resource: 'article', action: 'list' }],
            }),
            BadRequestException,
        );
    });
});

describe('grant schema', function grantSchemaTests() {
    it('accepts an action outside the CRUD verbs', function test() {
        const parsed = GrantListSchema.parse({
            permissions: [{ resource: 'form', action: 'publish' }],
        });

        assert.equal(parsed.permissions[0]?.action, 'publish');
    });

    it('rejects a blank action', function test() {
        assert.throws(function parseBlankAction() {
            GrantListSchema.parse({
                permissions: [{ resource: 'form', action: '   ' }],
            });
        });
    });
});

describe('RolesService.delete', function deleteRoleTests() {
    it('rejects deletion of a system role', async function test() {
        const adapter = new InMemoryRbacPersistenceAdapter();
        const harness = buildRbacHarness(adapter);
        const roles = new RolesService(
            adapter,
            harness.effectiveGrants,
            harness.catalogGrants,
            harness.cache,
        );

        await assert.rejects(
            roles.delete({ roleId: 'admin' }),
            BadRequestException,
        );
    });
});

describe('RbacModule.forRoot', function rbacModuleTests() {
    it('registers the admin API only when enabled', function test() {
        const adapter = new InMemoryRbacPersistenceAdapter();
        const withAdminApi = RbacModule.forRoot({
            routePrefix: '/v1/vulcan/rbac',
            persistence: adapter,
            adminApi: true,
        });
        const withoutAdminApi = RbacModule.forRoot({
            routePrefix: '/rbac',
            persistence: adapter,
        });

        assert.equal(withAdminApi.global, false);
        assert.equal(withAdminApi.controllers?.length, 4);
        assert.equal(withoutAdminApi.controllers?.length, 0);
    });
});
