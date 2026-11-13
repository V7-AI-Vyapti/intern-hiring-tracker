import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { CatalogService } from '../services/catalog.service.js';
import { SessionService } from '../services/session.service.js';
import { requireRequestUser } from '../utils/require-request-user.util.js';
import { InMemoryRbacPersistenceAdapter } from './in-memory-rbac.adapter.js';
import { buildRbacHarness } from './rbac-harness.js';

describe('session access', function sessionTests() {
    it('returns full access and an empty grant list for Admin', async function test() {
        const adapter = new InMemoryRbacPersistenceAdapter();
        adapter.userRoleIds.set('user-1', ['admin']);
        const harness = buildRbacHarness(adapter);
        const session = new SessionService(harness.effectiveGrants);

        const access = await session.get({ userId: 'user-1' });

        assert.equal(access.fullAccess, true);
        assert.equal(access.role?.name, 'Admin');
        assert.deepEqual(access.grants, []);
        assert.equal(
            await harness.checker.isAllowed({
                userId: 'user-1',
                grant: { resource: 'site', action: 'approve' },
            }),
            true,
        );
    });

    it('returns only the grants stored on the role', async function test() {
        const adapter = new InMemoryRbacPersistenceAdapter();
        adapter.permissions.push({
            id: 'permission-1',
            roleId: 'editor',
            resource: 'site',
            action: 'list',
        });
        const harness = buildRbacHarness(adapter);
        const session = new SessionService(harness.effectiveGrants);

        const access = await session.get({ userId: 'user-1' });

        assert.equal(access.fullAccess, false);
        assert.deepEqual(access.grants, [{ resource: 'site', action: 'list' }]);
    });

    it('fails closed when the user has no role', async function test() {
        const adapter = new InMemoryRbacPersistenceAdapter();
        const harness = buildRbacHarness(adapter);
        const session = new SessionService(harness.effectiveGrants);

        const access = await session.get({ userId: 'missing-user' });

        assert.equal(access.role, null);
        assert.equal(access.fullAccess, false);
        assert.deepEqual(access.grants, []);
    });

    it('requires a signed-in user', function test() {
        assert.throws(function readUser() {
            requireRequestUser({});
        }, UnauthorizedException);
    });

    it('throws 404 from assertPermission when the grant is missing', async function test() {
        const adapter = new InMemoryRbacPersistenceAdapter();
        const harness = buildRbacHarness(adapter);

        await assert.rejects(
            harness.assertPermission.assertPermission({
                userId: 'user-1',
                resource: 'site',
                action: 'approve',
            }),
            NotFoundException,
        );
    });
});

describe('catalog', function catalogTests() {
    it('lists resources and can search by resource name', async function test() {
        const adapter = new InMemoryRbacPersistenceAdapter();
        const catalog = new CatalogService(adapter);

        const page = await catalog.list({
            page: 1,
            limit: 20,
            search: 'form',
            sortOrder: 'ASC',
        });

        assert.equal(page.total, 1);
        assert.equal(page.rows[0]?.resource, 'form');
        assert.deepEqual(page.rows[0]?.actions, [
            'create',
            'update',
            'publish',
        ]);
    });
});
