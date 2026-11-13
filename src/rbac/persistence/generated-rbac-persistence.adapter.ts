import { ILike, In, type DataSource } from 'typeorm';
import { getEntityWithName } from '@vyapti/core';
import { readForeignKeyId } from '@vulcan/shared/utils/record-readers';
import type {
    BundleCreateInput,
    BundleListArgs,
    BundleRecord,
    BundleUpdateInput,
    CatalogResourceRecord,
    Grant,
    PermissionRecord,
    RbacContext,
    RbacPersistenceAdapter,
    RoleCreateInput,
    RoleListArgs,
    RoleRecord,
    RoleUpdateInput,
} from '@vyapti/rbac';
import { parsePositiveId } from '@auth/utils/parse-positive-id.util';
import { Permission } from '../entities/permission.entity';
import { RbacBundle } from '../entities/rbac_bundle.entity';
import { RbacBundlePermission } from '../entities/rbac_bundle_permission.entity';
import { RbacCatalog } from '../entities/rbac_catalog.entity';
import { RbacRoleBundle } from '../entities/rbac_role_bundle.entity';
import { Role } from '../entities/role.entity';
import { GENERATED_RBAC_ENTITY_NAMES } from '../rbac.constants';
import {
    BundleCreateSchema,
    BundlePermissionCreateSchema,
    BundleUpdateSchema,
    RoleBundleCreateSchema,
} from '../schema/bundle-write.schema';
import { PermissionCreateSchema } from '../schema/permission-write.schema';
import { RoleCreateSchema, RoleUpdateSchema } from '../schema/role-write.schema';
import {
    mapBundleRecord,
    mapCatalogRecord,
    mapGrant,
    mapPermissionRecord,
    mapRoleRecord,
} from '../utils/map-rbac-record.util';
import { readNullableNumber } from '../utils/read-nullable-number.util';

let rbacDataSource: DataSource | undefined;

function bindGeneratedRbacDataSource(value: DataSource): void {
    rbacDataSource = value;
}

function requireRbacDataSource(): DataSource {
    if (!rbacDataSource) {
        throw new Error('RBAC DataSource is not bound');
    }
    return rbacDataSource;
}

class GeneratedRbacPersistenceAdapter implements RbacPersistenceAdapter {
    async findRolesForUser(args: {
        userId: string;
        context?: RbacContext;
    }): Promise<RoleRecord[]> {
        const userId = parsePositiveId(args.userId);
        if (userId == null) {
            return [];
        }
        const user = await this.userEntity().getByPk(userId);
        if (!user) {
            return [];
        }
        const roleId = readNullableNumber(user, 'role_id');
        if (roleId == null) {
            return [];
        }
        const role = await Role.getByPk(roleId);
        return role ? [mapRoleRecord(role)] : [];
    }

    async findRole(args: { roleId: string }): Promise<RoleRecord | null> {
        const roleId = parsePositiveId(args.roleId);
        if (roleId == null) {
            return null;
        }
        const role = await Role.getByPk(roleId);
        return role ? mapRoleRecord(role) : null;
    }

    async findRoleByName(args: { name: string }): Promise<RoleRecord | null> {
        const role = await Role.one({ name: args.name });
        return role ? mapRoleRecord(role) : null;
    }

    async listRoles(
        args: RoleListArgs,
    ): Promise<{ rows: RoleRecord[]; total: number }> {
        const where = args.search
            ? { name: ILike(`%${args.search}%`) }
            : {};
        const [rows, total] = await Promise.all([
            Role.filter(where, {
                skip: args.skip,
                take: args.take,
                order: { name: args.sortOrder },
            }),
            Role.countOf(where),
        ]);
        return {
            rows: mapRows(rows, mapRoleRecord),
            total,
        };
    }

    async createRole(args: { input: RoleCreateInput }): Promise<RoleRecord> {
        const payload = RoleCreateSchema.parse({
            name: args.input.name,
            label: args.input.label,
            hint: args.input.hint ?? null,
            is_system: args.input.isSystem ?? false,
            full_access: args.input.fullAccess ?? false,
        });
        const created = await Role.createOne(payload);
        return mapRoleRecord(created);
    }

    async updateRole(args: {
        roleId: string;
        input: RoleUpdateInput;
    }): Promise<RoleRecord | null> {
        const roleId = parsePositiveId(args.roleId);
        if (roleId == null) {
            return null;
        }
        const payload = RoleUpdateSchema.parse({
            ...(args.input.name !== undefined ? { name: args.input.name } : {}),
            ...(args.input.label !== undefined
                ? { label: args.input.label }
                : {}),
            ...(args.input.hint !== undefined ? { hint: args.input.hint } : {}),
        });
        if ((await Role.updateByPk(roleId, payload)) === 0) {
            return null;
        }
        return this.findRole({ roleId: String(roleId) });
    }

    async deleteRole(args: { roleId: string }): Promise<boolean> {
        const roleId = parsePositiveId(args.roleId);
        if (roleId == null) {
            return false;
        }
        await Permission.deleteWhere({ role_id: roleId });
        await RbacRoleBundle.deleteWhere({ role_id: roleId });
        return (await Role.deleteByPk(roleId)) > 0;
    }

    async listPermissions(args: {
        roleId: string;
    }): Promise<PermissionRecord[]> {
        const roleId = parsePositiveId(args.roleId);
        if (roleId == null) {
            return [];
        }
        const rows = await Permission.filter({ role_id: roleId });
        return mapRows(rows, function mapRow(row) {
            return mapPermissionRecord(row, roleId);
        });
    }

    async replacePermissions(args: {
        roleId: string;
        grants: Grant[];
    }): Promise<PermissionRecord[]> {
        const roleId = requirePositiveId(args.roleId, 'role id');
        await Permission.deleteWhere({ role_id: roleId });
        const payloads = parseGrantPayloads({
            ownerId: roleId,
            ownerField: 'role_id',
            grants: args.grants,
            schema: PermissionCreateSchema,
        });
        if (payloads.length > 0) {
            await Permission.createMany(payloads);
        }
        return this.listPermissions({ roleId: args.roleId });
    }

    async listCatalog(): Promise<CatalogResourceRecord[]> {
        const rows = await RbacCatalog.filter(
            {},
            { order: { resource: 'ASC' } },
        );
        return mapRows(rows, mapCatalogRecord);
    }

    async listBundles(
        args: BundleListArgs,
    ): Promise<{ rows: BundleRecord[]; total: number }> {
        const where = bundleSearchWhere(args.search);
        const [rows, total] = await Promise.all([
            RbacBundle.filter(where, {
                skip: args.skip,
                take: args.take,
                order: { name: args.sortOrder },
            }),
            RbacBundle.countOf(where),
        ]);
        return {
            rows: mapRows(rows, mapBundleRecord),
            total,
        };
    }

    async findBundle(args: {
        bundleId: string;
    }): Promise<BundleRecord | null> {
        const bundleId = parsePositiveId(args.bundleId);
        if (bundleId == null) {
            return null;
        }
        const bundle = await RbacBundle.getByPk(bundleId);
        return bundle ? mapBundleRecord(bundle) : null;
    }

    async findBundleByName(args: {
        name: string;
    }): Promise<BundleRecord | null> {
        const bundle = await RbacBundle.one({ name: args.name });
        return bundle ? mapBundleRecord(bundle) : null;
    }

    async createBundle(args: {
        input: BundleCreateInput;
    }): Promise<BundleRecord> {
        const payload = BundleCreateSchema.parse({
            name: args.input.name,
            label: args.input.label,
            hint: args.input.hint ?? null,
            is_system: args.input.isSystem ?? false,
        });
        const created = await RbacBundle.createOne(payload);
        return mapBundleRecord(created);
    }

    async updateBundle(args: {
        bundleId: string;
        input: BundleUpdateInput;
    }): Promise<BundleRecord | null> {
        const bundleId = parsePositiveId(args.bundleId);
        if (bundleId == null) {
            return null;
        }
        const payload = BundleUpdateSchema.parse({
            ...(args.input.label !== undefined
                ? { label: args.input.label }
                : {}),
            ...(args.input.hint !== undefined ? { hint: args.input.hint } : {}),
        });
        if ((await RbacBundle.updateByPk(bundleId, payload)) === 0) {
            return null;
        }
        return this.findBundle({ bundleId: String(bundleId) });
    }

    async deleteBundle(args: { bundleId: string }): Promise<boolean> {
        const bundleId = parsePositiveId(args.bundleId);
        if (bundleId == null) {
            return false;
        }
        await RbacBundlePermission.deleteWhere({ bundle_id: bundleId });
        await RbacRoleBundle.deleteWhere({ bundle_id: bundleId });
        return (await RbacBundle.deleteByPk(bundleId)) > 0;
    }

    async listBundleGrants(args: { bundleId: string }): Promise<Grant[]> {
        const bundleId = parsePositiveId(args.bundleId);
        if (bundleId == null) {
            return [];
        }
        const rows = await RbacBundlePermission.filter({
            bundle_id: bundleId,
        });
        return mapRows(rows, mapGrant);
    }

    async replaceBundleGrants(args: {
        bundleId: string;
        grants: Grant[];
    }): Promise<Grant[]> {
        const bundleId = requirePositiveId(args.bundleId, 'bundle id');
        await RbacBundlePermission.deleteWhere({ bundle_id: bundleId });
        const payloads = parseGrantPayloads({
            ownerId: bundleId,
            ownerField: 'bundle_id',
            grants: args.grants,
            schema: BundlePermissionCreateSchema,
        });
        if (payloads.length > 0) {
            await RbacBundlePermission.createMany(payloads);
        }
        return this.listBundleGrants({ bundleId: args.bundleId });
    }

    async listRoleBundleIds(args: { roleId: string }): Promise<string[]> {
        const roleId = parsePositiveId(args.roleId);
        if (roleId == null) {
            return [];
        }
        const rows = await RbacRoleBundle.filter(
            { role_id: roleId },
            { relations: { bundle_id: true } },
        );
        const bundleIds: string[] = [];
        for (const row of rows) {
            bundleIds.push(
                String(readForeignKeyId(row, 'bundle_id', 'rbac_bundle_id')),
            );
        }
        return bundleIds;
    }

    async replaceRoleBundles(args: {
        roleId: string;
        bundleIds: string[];
    }): Promise<string[]> {
        const roleId = requirePositiveId(args.roleId, 'role id');
        await RbacRoleBundle.deleteWhere({ role_id: roleId });
        const payloads: Array<Record<string, unknown>> = [];
        for (const bundleId of args.bundleIds) {
            payloads.push(
                RoleBundleCreateSchema.parse({
                    role_id: roleId,
                    bundle_id: requirePositiveId(bundleId, 'bundle id'),
                }),
            );
        }
        if (payloads.length > 0) {
            await RbacRoleBundle.createMany(payloads);
        }
        return this.listRoleBundleIds({ roleId: args.roleId });
    }

    async listGrantsForBundles(args: {
        bundleIds: string[];
    }): Promise<Grant[]> {
        const bundleIds = parseIdList(args.bundleIds);
        if (bundleIds.length === 0) {
            return [];
        }
        const rows = await RbacBundlePermission.filter({
            bundle_id: In(bundleIds),
        });
        return mapRows(rows, mapGrant);
    }

    private userEntity() {
        return getEntityWithName(
            GENERATED_RBAC_ENTITY_NAMES.USER,
            requireRbacDataSource(),
        );
    }
}

function mapRows<T>(
    rows: unknown[],
    mapRow: (row: unknown) => T,
): T[] {
    const mapped: T[] = [];
    for (const row of rows) {
        mapped.push(mapRow(row));
    }
    return mapped;
}

function bundleSearchWhere(
    search: string | null,
): Record<string, unknown> | Array<Record<string, unknown>> {
    if (!search) {
        return {};
    }
    const needle = ILike(`%${search}%`);
    return [{ name: needle }, { label: needle }];
}

function parseGrantPayloads(args: {
    ownerId: number;
    ownerField: 'role_id' | 'bundle_id';
    grants: Grant[];
    schema: { parse: (value: unknown) => Record<string, unknown> };
}): Array<Record<string, unknown>> {
    const payloads: Array<Record<string, unknown>> = [];
    for (const grant of args.grants) {
        payloads.push(
            args.schema.parse({
                [args.ownerField]: args.ownerId,
                entity_name: grant.resource,
                operation: grant.action,
            }),
        );
    }
    return payloads;
}

function parseIdList(values: string[]): number[] {
    const ids: number[] = [];
    for (const value of values) {
        const parsed = parsePositiveId(value);
        if (parsed != null) {
            ids.push(parsed);
        }
    }
    return ids;
}

function requirePositiveId(value: string, name: string): number {
    const parsed = parsePositiveId(value);
    if (parsed == null) {
        throw new Error(`Invalid ${name} '${value}'`);
    }
    return parsed;
}

function createGeneratedRbacPersistenceAdapter(): RbacPersistenceAdapter {
    return new GeneratedRbacPersistenceAdapter();
}

export {
    GeneratedRbacPersistenceAdapter,
    bindGeneratedRbacDataSource,
    createGeneratedRbacPersistenceAdapter,
};
