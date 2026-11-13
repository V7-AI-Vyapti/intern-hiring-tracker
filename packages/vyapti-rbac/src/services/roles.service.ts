import {
    BadRequestException,
    ConflictException,
    Inject,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { RBAC_MESSAGES } from '../rbac.constants.js';
import { RBAC_PERSISTENCE_ADAPTER } from '../rbac.tokens.js';
import type {
    Grant,
    PermissionRecord,
    RbacPersistenceAdapter,
    RoleGrantDetail,
    RoleRecord,
} from '../types/rbac.types.js';
import { assertRoleAcceptsGrants } from '../utils/assert-role-accepts-grants.util.js';
import { uniqueStrings } from '../utils/grants.util.js';
import {
    blankToNull,
    optionalHint,
    resolveLabel,
} from '../utils/resolve-label.util.js';
import { CatalogGrantsService } from './catalog-grants.service.js';
import { EffectiveGrantsService } from './effective-grants.service.js';
import { PermissionCacheService } from './permission-cache.service.js';

type NameSortedPage = {
    page: number;
    limit: number;
    search: string | null;
    sortBy: 'name';
    sortOrder: 'ASC' | 'DESC';
};

@Injectable()
class RolesService {
    constructor(
        @Inject(RBAC_PERSISTENCE_ADAPTER)
        private readonly persistence: RbacPersistenceAdapter,
        private readonly effectiveGrants: EffectiveGrantsService,
        private readonly catalogGrants: CatalogGrantsService,
        private readonly cache: PermissionCacheService,
    ) {}

    async list(args: NameSortedPage): Promise<{
        rows: RoleRecord[];
        total: number;
        page: number;
        limit: number;
    }> {
        const result = await this.persistence.listRoles({
            search: args.search,
            skip: (args.page - 1) * args.limit,
            take: args.limit,
            sortBy: args.sortBy,
            sortOrder: args.sortOrder,
        });
        return { ...result, page: args.page, limit: args.limit };
    }

    async create(args: {
        name: string;
        label?: string | null;
        hint?: string | null;
    }): Promise<RoleRecord> {
        const existing = await this.persistence.findRoleByName({
            name: args.name,
        });
        if (existing) {
            throw new ConflictException(RBAC_MESSAGES.ROLE_NAME_TAKEN);
        }

        const role = await this.persistence.createRole({
            input: {
                name: args.name,
                label: resolveLabel({ name: args.name, label: args.label }),
                hint: blankToNull(args.hint),
                isSystem: false,
                fullAccess: false,
            },
        });
        this.cache.clear();
        return role;
    }

    async get(args: { roleId: string }): Promise<RoleGrantDetail> {
        const role = await this.requireRole(args.roleId);
        const described = await this.effectiveGrants.describeRole({ role });
        return { role, ...described };
    }

    async update(args: {
        roleId: string;
        name?: string;
        label?: string;
        hint?: string | null;
    }): Promise<RoleRecord> {
        await this.assertNameAvailable(args);
        const role = await this.persistence.updateRole({
            roleId: args.roleId,
            input: {
                name: args.name,
                label: args.label,
                hint: optionalHint(args.hint),
            },
        });
        if (!role) {
            throw new NotFoundException(RBAC_MESSAGES.ROLE_NOT_FOUND);
        }

        this.cache.clear();
        return role;
    }

    async delete(args: { roleId: string }): Promise<void> {
        const role = await this.requireRole(args.roleId);
        if (role.isSystem) {
            throw new BadRequestException(
                RBAC_MESSAGES.SYSTEM_ROLE_DELETE_FORBIDDEN,
            );
        }

        const deleted = await this.persistence.deleteRole(args);
        if (!deleted) {
            throw new NotFoundException(RBAC_MESSAGES.ROLE_NOT_FOUND);
        }
        this.cache.clear();
    }

    async listPermissions(args: {
        roleId: string;
    }): Promise<PermissionRecord[]> {
        await this.requireRole(args.roleId);
        return this.persistence.listPermissions(args);
    }

    async replacePermissions(args: {
        roleId: string;
        grants: Grant[];
    }): Promise<PermissionRecord[]> {
        const role = await this.requireRole(args.roleId);
        assertRoleAcceptsGrants(role);

        const grants = await this.catalogGrants.acceptGrants({
            grants: args.grants,
        });
        const permissions = await this.persistence.replacePermissions({
            roleId: args.roleId,
            grants,
        });
        this.cache.clear();
        return permissions;
    }

    async replaceBundles(args: {
        roleId: string;
        bundleIds: string[];
    }): Promise<string[]> {
        const role = await this.requireRole(args.roleId);
        assertRoleAcceptsGrants(role);

        const bundleIds = uniqueStrings(args.bundleIds);
        await this.assertBundlesExist(bundleIds);
        const stored = await this.persistence.replaceRoleBundles({
            roleId: args.roleId,
            bundleIds,
        });
        this.cache.clear();
        return stored;
    }

    private async requireRole(roleId: string): Promise<RoleRecord> {
        const role = await this.persistence.findRole({ roleId });
        if (!role) {
            throw new NotFoundException(RBAC_MESSAGES.ROLE_NOT_FOUND);
        }
        return role;
    }

    private async assertNameAvailable(args: {
        roleId: string;
        name?: string;
    }): Promise<void> {
        if (args.name === undefined) {
            return;
        }

        const existing = await this.persistence.findRoleByName({
            name: args.name,
        });
        if (existing && String(existing.id) !== args.roleId) {
            throw new ConflictException(RBAC_MESSAGES.ROLE_NAME_TAKEN);
        }
    }

    private async assertBundlesExist(bundleIds: string[]): Promise<void> {
        for (const bundleId of bundleIds) {
            const bundle = await this.persistence.findBundle({ bundleId });
            if (!bundle) {
                throw new NotFoundException(RBAC_MESSAGES.BUNDLE_NOT_FOUND);
            }
        }
    }
}

export { RolesService };
