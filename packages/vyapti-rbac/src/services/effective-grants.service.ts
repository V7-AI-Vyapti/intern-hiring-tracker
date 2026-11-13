import { Inject, Injectable } from '@nestjs/common';
import { RBAC_PERSISTENCE_ADAPTER } from '../rbac.tokens.js';
import type {
    Grant,
    RbacContext,
    RbacPersistenceAdapter,
    RoleRecord,
    SessionAccess,
} from '../types/rbac.types.js';
import { uniqueGrants } from '../utils/grants.util.js';

@Injectable()
class EffectiveGrantsService {
    constructor(
        @Inject(RBAC_PERSISTENCE_ADAPTER)
        private readonly persistence: RbacPersistenceAdapter,
    ) {}

    async forUser(args: {
        userId: string;
        context?: RbacContext;
    }): Promise<SessionAccess> {
        const roles = await this.persistence.findRolesForUser(args);
        const fullAccessRole = findFullAccessRole(roles);
        if (fullAccessRole) {
            return { role: fullAccessRole, fullAccess: true, grants: [] };
        }

        const grants: Grant[] = [];
        for (const role of roles) {
            const described = await this.describeRole({ role });
            grants.push(...described.effectiveGrants);
        }

        return {
            role: roles[0] ?? null,
            fullAccess: false,
            grants: uniqueGrants(grants),
        };
    }

    async describeRole(args: { role: RoleRecord }): Promise<{
        bundleIds: string[];
        directGrants: Grant[];
        effectiveGrants: Grant[];
    }> {
        const roleId = String(args.role.id);
        const permissions = await this.persistence.listPermissions({ roleId });
        const bundleIds = await this.persistence.listRoleBundleIds({ roleId });
        const directGrants = uniqueGrants(permissions);

        if (args.role.fullAccess) {
            return { bundleIds, directGrants, effectiveGrants: [] };
        }

        const bundledGrants = await this.persistence.listGrantsForBundles({
            bundleIds,
        });
        return {
            bundleIds,
            directGrants,
            effectiveGrants: uniqueGrants([...directGrants, ...bundledGrants]),
        };
    }
}

function findFullAccessRole(roles: RoleRecord[]): RoleRecord | undefined {
    for (const role of roles) {
        if (role.fullAccess) {
            return role;
        }
    }
    return undefined;
}

export { EffectiveGrantsService };
