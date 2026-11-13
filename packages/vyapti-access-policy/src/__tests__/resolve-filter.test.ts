import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { CallHandler, ExecutionContext } from '@nestjs/common';
import {
    BadRequestException,
    NotFoundException,
    UnauthorizedException,
} from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR, Reflector } from '@nestjs/core';
import { of } from 'rxjs';
import {
    applyAccessFilter,
    assertUpdateScope,
    prepareCreateBody,
} from '../utils/apply-access-filter.util.js';
import { AccessPolicyModule } from '../access-policy.module.js';
import { ACCESS_POLICY_ENTITY_KEY } from '../decorators/access-policy-entity.decorator.js';
import { AccessPolicyInterceptor } from '../interceptors/access-policy.interceptor.js';
import type { AccessPolicyRequest } from '../types/access-policy.types.js';
import { InMemoryAccessPolicyAdapter } from './in-memory-access-policy.adapter.js';
import { buildAccessPolicyHarness } from './access-policy-harness.js';

const ENTITY = 'record';
const FIELD = 'owner_id';
const SCOPE = 'owner';

describe('resolveFilter', function filterTests() {
    it('returns unrestricted for a system admin', async function test() {
        const adapter = new InMemoryAccessPolicyAdapter();
        const harness = buildAccessPolicyHarness(adapter);
        await harness.policies.create({
            entityName: ENTITY,
            mode: 'deny',
        });

        const filter = await harness.filters.resolveFilter({
            userId: 'user-1',
            entityName: ENTITY,
            isSystemAdmin: true,
        });

        assert.deepEqual(filter, { unrestricted: true });
    });

    it('returns unrestricted when the entity has no policy', async function test() {
        const harness = buildAccessPolicyHarness(
            new InMemoryAccessPolicyAdapter(),
        );

        const filter = await harness.filters.resolveFilter({
            userId: 'user-1',
            entityName: ENTITY,
            isSystemAdmin: false,
        });

        assert.deepEqual(filter, { unrestricted: true });
    });

    it('returns the membership ids for a filter policy', async function test() {
        const adapter = new InMemoryAccessPolicyAdapter();
        const harness = buildAccessPolicyHarness(adapter);
        await seedFilterPolicy(harness);
        await harness.memberships.create({
            userId: 'user-1',
            scopeKey: SCOPE,
            scopeId: 'b',
        });
        await harness.memberships.create({
            userId: 'user-1',
            scopeKey: SCOPE,
            scopeId: 'a',
        });

        const filter = await harness.filters.resolveFilter({
            userId: 'user-1',
            entityName: ENTITY,
            isSystemAdmin: false,
        });

        assert.deepEqual(filter, {
            field: FIELD,
            op: 'in',
            values: ['a', 'b'],
        });
    });

    it('returns an empty value list when the user has no memberships', async function test() {
        const adapter = new InMemoryAccessPolicyAdapter();
        const harness = buildAccessPolicyHarness(adapter);
        await seedFilterPolicy(harness);

        const filter = await harness.filters.resolveFilter({
            userId: 'user-1',
            entityName: ENTITY,
            isSystemAdmin: false,
        });

        assert.deepEqual(filter, { field: FIELD, op: 'in', values: [] });
    });

    it('returns deny when the policy mode is deny', async function test() {
        const adapter = new InMemoryAccessPolicyAdapter();
        const harness = buildAccessPolicyHarness(adapter);
        await harness.policies.create({
            entityName: ENTITY,
            mode: 'deny',
        });

        const filter = await harness.filters.resolveFilter({
            userId: 'user-1',
            entityName: ENTITY,
            isSystemAdmin: false,
        });

        assert.deepEqual(filter, { deny: true });
    });

    it('throws 404 from assertRow when the row is outside the filter', async function test() {
        const adapter = new InMemoryAccessPolicyAdapter();
        const harness = buildAccessPolicyHarness(adapter);
        await seedFilterPolicy(harness);
        await harness.memberships.create({
            userId: 'user-1',
            scopeKey: SCOPE,
            scopeId: 'a',
        });

        await assert.rejects(
            harness.filters.assertRow({
                userId: 'user-1',
                entityName: ENTITY,
                isSystemAdmin: false,
                row: { owner_id: 'other' },
            }),
            NotFoundException,
        );
    });

    it('busts the filter cache after a membership write', async function test() {
        const adapter = new InMemoryAccessPolicyAdapter();
        const harness = buildAccessPolicyHarness(adapter);
        await seedFilterPolicy(harness);
        const args = {
            userId: 'user-1',
            entityName: ENTITY,
            isSystemAdmin: false,
        };

        assert.deepEqual(await harness.filters.resolveFilter(args), {
            field: FIELD,
            op: 'in',
            values: [],
        });

        await harness.memberships.create({
            userId: 'user-1',
            scopeKey: SCOPE,
            scopeId: 'a',
        });

        assert.deepEqual(await harness.filters.resolveFilter(args), {
            field: FIELD,
            op: 'in',
            values: ['a'],
        });
    });
});

describe('applyAccessFilter', function clauseTests() {
    it('leaves an unrestricted filter off the query', function test() {
        assert.deepEqual(applyAccessFilter({ unrestricted: true }), {
            kind: 'none',
        });
    });

    it('returns an empty page for deny and for an empty membership list', function test() {
        assert.deepEqual(applyAccessFilter({ deny: true }), { kind: 'empty' });
        assert.deepEqual(
            applyAccessFilter({ field: 'centre_id', op: 'in', values: [] }),
            { kind: 'empty' },
        );
    });

    it('returns the field and membership ids for a filter', function test() {
        assert.deepEqual(
            applyAccessFilter({
                field: 'centre_id',
                op: 'in',
                values: ['9', '4'],
            }),
            { kind: 'in', field: 'centre_id', values: ['9', '4'] },
        );
    });
});

describe('create and update scope', function writeScopeTests() {
    const allowed = {
        field: 'centre_id',
        op: 'in' as const,
        values: ['4'],
    };

    it('defaults the only membership id on create', function test() {
        assert.deepEqual(
            prepareCreateBody({
                filter: allowed,
                body: { name: 'Ravi' },
            }),
            { name: 'Ravi', centre_id: 4 },
        );
    });

    it('rejects a create outside the membership ids', function test() {
        assert.throws(function reject() {
            prepareCreateBody({
                filter: allowed,
                body: { centre_id: 9 },
            });
        }, BadRequestException);
    });

    it('rejects an update that moves the row outside the membership ids', function test() {
        assert.throws(function reject() {
            assertUpdateScope({
                filter: allowed,
                body: { centre_id: 9 },
            });
        }, BadRequestException);
    });

    it('leaves an update that omits the constraint field', function test() {
        assert.doesNotThrow(function allow() {
            assertUpdateScope({
                filter: allowed,
                body: { name: 'Ravi' },
            });
        });
    });
});

describe('module wiring', function moduleTests() {
    it('does not register a global guard or interceptor', function test() {
        const dynamic = AccessPolicyModule.forRoot({
            routePrefix: '/access-policy',
            persistence: new InMemoryAccessPolicyAdapter(),
            adminApi: true,
        });
        const tokens = readProviderTokens(dynamic.providers ?? []);

        assert.equal(dynamic.global, false);
        assert.equal(dynamic.controllers?.length, 3);
        assert.equal(tokens.includes(APP_GUARD), false);
        assert.equal(tokens.includes(APP_INTERCEPTOR), false);
    });

    it('leaves a route without the entity decorator unchanged', async function test() {
        const adapter = new InMemoryAccessPolicyAdapter();
        const harness = buildAccessPolicyHarness(adapter);
        const interceptor = new AccessPolicyInterceptor(
            new Reflector(),
            harness.filters,
            {
                routePrefix: 'access-policy',
                forbiddenAs: '404',
                adminApi: true,
                cacheTtlMs: 30_000,
                readIsSystemAdmin: function notAdmin() {
                    return false;
                },
            },
        );
        let continued = false;
        const next: CallHandler = {
            handle: function handle() {
                continued = true;
                return of('ok');
            },
        };

        await interceptor.intercept(
            buildContext({ user: { id: 'user-1' } }),
            next,
        );

        assert.equal(continued, true);
        assert.equal(adapter.policies.length, 0);
    });

    it('requires a signed-in user on an opted-in route', async function test() {
        const adapter = new InMemoryAccessPolicyAdapter();
        const harness = buildAccessPolicyHarness(adapter);
        const reflector = {
            getAllAndOverride: function getAllAndOverride() {
                return ENTITY;
            },
        } as unknown as Reflector;
        const interceptor = new AccessPolicyInterceptor(
            reflector,
            harness.filters,
            {
                routePrefix: 'access-policy',
                forbiddenAs: '404',
                adminApi: true,
                cacheTtlMs: 30_000,
                readIsSystemAdmin: function notAdmin() {
                    return false;
                },
            },
        );

        await assert.rejects(
            interceptor.intercept(buildContext({}), {
                handle: function handle() {
                    return of('ok');
                },
            }),
            UnauthorizedException,
        );
        assert.equal(
            Reflect.getMetadata(ACCESS_POLICY_ENTITY_KEY, function marked() {}),
            undefined,
        );
    });
});

async function seedFilterPolicy(harness: {
    policies: {
        create(args: {
            entityName: string;
            mode: 'filter';
            constraintField: string;
            scopeKey: string;
        }): Promise<unknown>;
    };
}): Promise<void> {
    await harness.policies.create({
        entityName: ENTITY,
        mode: 'filter',
        constraintField: FIELD,
        scopeKey: SCOPE,
    });
}

function readProviderTokens(providers: unknown[]): unknown[] {
    const tokens: unknown[] = [];
    for (const provider of providers) {
        if (provider && typeof provider === 'object' && 'provide' in provider) {
            tokens.push(provider.provide);
        }
    }
    return tokens;
}

function buildContext(request: AccessPolicyRequest): ExecutionContext {
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
