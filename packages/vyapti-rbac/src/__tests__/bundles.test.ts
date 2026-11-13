import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { BadRequestException } from '@nestjs/common';
import { BundlesService } from '../services/bundles.service.js';
import { RolesService } from '../services/roles.service.js';
import { SessionService } from '../services/session.service.js';
import type { Grant } from '../types/rbac.types.js';
import { InMemoryRbacPersistenceAdapter } from './in-memory-rbac.adapter.js';
import { buildRbacHarness } from './rbac-harness.js';

const DELIVERY_GRANTS: Grant[] = [
    { resource: 'site', action: 'list' },
    { resource: 'batch', action: 'list' },
];

async function seedDeliveryBundle(adapter: InMemoryRbacPersistenceAdapter) {
    const harness = buildRbacHarness(adapter);
    const bundle = await adapter.createBundle({
        input: {
            name: 'delivery',
            label: 'Delivery',
            isSystem: false,
        },
    });
    const bundles = new BundlesService(
        adapter,
        harness.catalogGrants,
        harness.cache,
    );
    const roles = new RolesService(
        adapter,
        harness.effectiveGrants,
        harness.catalogGrants,
        harness.cache,
    );
    await bundles.replaceGrants({
        bundleId: String(bundle.id),
        grants: DELIVERY_GRANTS,
    });
    return {
        harness,
        bundleId: String(bundle.id),
        bundles,
        roles,
        session: new SessionService(harness.effectiveGrants),
    };
}

describe('bundles', function bundleTests() {
    it('adds pack grants to a role that has no direct grants', async function test() {
        const adapter = new InMemoryRbacPersistenceAdapter();
        const seeded = await seedDeliveryBundle(adapter);
        await seeded.roles.replaceBundles({
            roleId: 'editor',
            bundleIds: [seeded.bundleId],
        });
        const detail = await seeded.roles.get({ roleId: 'editor' });

        const access = await seeded.session.get({ userId: 'user-1' });

        assert.deepEqual(access.grants, DELIVERY_GRANTS);
        assert.deepEqual(detail.directGrants, []);
        assert.deepEqual(detail.bundleIds, [seeded.bundleId]);
        assert.deepEqual(detail.effectiveGrants, DELIVERY_GRANTS);
    });

    it('updates every role that holds the pack', async function test() {
        const adapter = new InMemoryRbacPersistenceAdapter();
        const deputy = await adapter.createRole({
            input: {
                name: 'Deputy',
                label: 'Deputy',
                isSystem: false,
                fullAccess: false,
            },
        });
        adapter.userRoleIds.set('user-2', [String(deputy.id)]);
        const seeded = await seedDeliveryBundle(adapter);
        await seeded.roles.replaceBundles({
            roleId: 'editor',
            bundleIds: [seeded.bundleId],
        });
        await seeded.roles.replaceBundles({
            roleId: String(deputy.id),
            bundleIds: [seeded.bundleId],
        });

        assert.equal(
            await seeded.harness.checker.isAllowed({
                userId: 'user-1',
                grant: { resource: 'site', action: 'list' },
            }),
            true,
        );

        await seeded.bundles.replaceGrants({
            bundleId: seeded.bundleId,
            grants: [{ resource: 'site', action: 'view' }],
        });

        const editor = await seeded.session.get({ userId: 'user-1' });
        const deputyAccess = await seeded.session.get({ userId: 'user-2' });
        const siteView: Grant = { resource: 'site', action: 'view' };

        assert.deepEqual(editor.grants, [siteView]);
        assert.deepEqual(deputyAccess.grants, [siteView]);
        assert.equal(
            await seeded.harness.checker.isAllowed({
                userId: 'user-1',
                grant: { resource: 'site', action: 'list' },
            }),
            false,
        );
    });

    it('keeps a direct grant after the pack that duplicated it is revoked', async function test() {
        const adapter = new InMemoryRbacPersistenceAdapter();
        adapter.permissions.push({
            id: 'direct-site-list',
            roleId: 'editor',
            resource: 'site',
            action: 'list',
        });
        const seeded = await seedDeliveryBundle(adapter);
        await seeded.roles.replaceBundles({
            roleId: 'editor',
            bundleIds: [seeded.bundleId],
        });
        await seeded.roles.replaceBundles({ roleId: 'editor', bundleIds: [] });

        const access = await seeded.session.get({ userId: 'user-1' });

        assert.deepEqual(access.grants, [{ resource: 'site', action: 'list' }]);
    });

    it('rejects deleting a system bundle and drops a custom one from the role', async function test() {
        const adapter = new InMemoryRbacPersistenceAdapter();
        const system = await adapter.createBundle({
            input: { name: 'system-pack', label: 'System', isSystem: true },
        });
        const seeded = await seedDeliveryBundle(adapter);
        await seeded.roles.replaceBundles({
            roleId: 'editor',
            bundleIds: [seeded.bundleId],
        });

        await assert.rejects(
            seeded.bundles.delete({ bundleId: String(system.id) }),
            BadRequestException,
        );
        await seeded.bundles.delete({ bundleId: seeded.bundleId });

        const detail = await seeded.roles.get({ roleId: 'editor' });
        assert.deepEqual(detail.bundleIds, []);
        assert.deepEqual(detail.effectiveGrants, []);
    });

    it('rejects assigning a pack to a full-access role', async function test() {
        const adapter = new InMemoryRbacPersistenceAdapter();
        const seeded = await seedDeliveryBundle(adapter);

        await assert.rejects(
            seeded.roles.replaceBundles({
                roleId: 'admin',
                bundleIds: [seeded.bundleId],
            }),
            BadRequestException,
        );
    });
});
