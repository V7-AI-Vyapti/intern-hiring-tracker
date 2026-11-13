import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { getEntityWithName } from '@vyapti/core';
import {
    HIRING_ACCESS_POLICY_DEFINITIONS,
    HIRING_PERMISSION_CATALOG,
    HIRING_ROLE_GRANTS,
} from '@vyapti/hiring';
import {
    GENERATED_HIRING_ENTITY_NAMES,
    GENERATED_HIRING_ROLES,
} from '../hiring.constants';
import { bindGeneratedHiringDataSource } from '../persistence/generated-hiring-persistence.adapter';
import { bindHiringResolveRoles } from '../utils/resolve-hiring-roles.util';

const readPositiveId = (record: unknown, fieldName: string): number => {
    if (!record || typeof record !== 'object') {
        throw new Error(`Expected object while reading '${fieldName}'`);
    }
    const value = Number((record as Record<string, unknown>)[fieldName]);
    if (!Number.isInteger(value) || value < 1) {
        throw new Error(`Expected positive id field '${fieldName}'`);
    }
    return value;
};

/**
 * Binds hiring DataSource and seeds RBAC catalog, Recruiter/Interviewer grants,
 * and access-policy rows for generated CRUD (forms/India Vision patterns).
 *
 * Interviewer memberships (user_id → member_id / assigned_candidate_id) are
 * deploy-time data — build with `buildInterviewerMemberships` and POST via
 * `/access-policy/memberships` (see seed script helpers).
 */
@Injectable()
class GeneratedHiringBootstrapService implements OnModuleInit {
    private readonly logger = new Logger(GeneratedHiringBootstrapService.name);

    constructor(
        @Inject(DataSource)
        private readonly dataSource: DataSource,
    ) {
        bindGeneratedHiringDataSource(dataSource);
        bindHiringResolveRoles(dataSource);
    }

    async onModuleInit(): Promise<void> {
        await this.upsertHiringCatalog();
        await this.upsertHiringRoles();
        await this.upsertHiringAccessPolicies();
    }

    private async upsertHiringCatalog(): Promise<void> {
        const catalogEntity = getEntityWithName(
            GENERATED_HIRING_ENTITY_NAMES.RBAC_CATALOG,
            this.dataSource,
        );
        for (const entry of HIRING_PERMISSION_CATALOG) {
            const payload = {
                resource: entry.resource,
                actions: [...entry.actions],
            };
            const { entity, created } = await catalogEntity.getOrCreate({
                where: { resource: payload.resource },
                create: payload,
            });
            if (!created) {
                await catalogEntity.updateByPk(
                    readPositiveId(entity, 'rbac_catalog_id'),
                    { actions: payload.actions },
                );
            }
        }
        this.logger.log('Upserted hiring RBAC catalog resources');
    }

    private async upsertHiringRoles(): Promise<void> {
        const roleEntity = getEntityWithName(
            GENERATED_HIRING_ENTITY_NAMES.ROLE,
            this.dataSource,
        );
        const permissionEntity = getEntityWithName(
            GENERATED_HIRING_ENTITY_NAMES.PERMISSION,
            this.dataSource,
        );

        for (const roleName of [
            GENERATED_HIRING_ROLES.RECRUITER,
            GENERATED_HIRING_ROLES.INTERVIEWER,
        ] as const) {
            const { entity } = await roleEntity.getOrCreate({
                where: { name: roleName },
                create: {
                    name: roleName,
                    label: roleName,
                    hint: `${roleName} for Intern Hiring Tracker`,
                    is_system: false,
                    full_access: false,
                },
            });
            const roleId = readPositiveId(entity, 'role_id');
            await permissionEntity.deleteWhere({ role_id: roleId });

            const grants = HIRING_ROLE_GRANTS[roleName];
            for (const grant of grants) {
                await permissionEntity.createOne({
                    role_id: roleId,
                    entity_name: grant.resource,
                    operation: grant.action,
                });
            }
            this.logger.log(
                `Upserted ${grants.length} permissions for role ${roleName}`,
            );
        }
    }

    private async upsertHiringAccessPolicies(): Promise<void> {
        const policyEntity = getEntityWithName(
            GENERATED_HIRING_ENTITY_NAMES.ACCESS_POLICY,
            this.dataSource,
        );
        for (const policy of HIRING_ACCESS_POLICY_DEFINITIONS) {
            const payload = {
                entity_name: policy.entityName,
                mode: policy.mode,
                constraint_field: policy.constraintField,
                scope_key: policy.scopeKey,
            };
            const { entity, created } = await policyEntity.getOrCreate({
                where: { entity_name: payload.entity_name },
                create: payload,
            });
            if (!created) {
                await policyEntity.updateByPk(
                    readPositiveId(entity, 'access_policy_id'),
                    {
                        mode: payload.mode,
                        constraint_field: payload.constraint_field,
                        scope_key: payload.scope_key,
                    },
                );
            }
        }
        this.logger.log(
            `Upserted ${HIRING_ACCESS_POLICY_DEFINITIONS.length} hiring access policies`,
        );
    }
}

export { GeneratedHiringBootstrapService };
