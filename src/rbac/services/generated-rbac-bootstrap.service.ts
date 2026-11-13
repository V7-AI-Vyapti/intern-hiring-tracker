import {
    Inject,
    Injectable,
    Logger,
    OnApplicationBootstrap,
    OnModuleInit,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { getEntityWithName } from '@vyapti/core';
import { GENERATED_AUTH_CONFIG } from '@auth/auth.config';
import { readNumber } from '@vulcan/shared/utils/record-readers';
import { Role } from '../entities/role.entity';
import { RbacCatalog } from '../entities/rbac_catalog.entity';
import { GENERATED_CATALOG_RESOURCES } from '../generated-catalog-resources';
import {
    GENERATED_RBAC_ACTIONS,
    GENERATED_RBAC_ADMIN,
    GENERATED_RBAC_ENTITY_NAMES,
    GENERATED_RBAC_RESOURCE,
} from '../rbac.constants';
import { CatalogCreateSchema } from '../schema/catalog-write.schema';
import { RoleCreateSchema } from '../schema/role-write.schema';
import { readNullableNumber } from '../utils/read-nullable-number.util';
import { bindGeneratedRbacDataSource } from '../persistence/generated-rbac-persistence.adapter';

@Injectable()
class GeneratedRbacBootstrapService
    implements OnModuleInit, OnApplicationBootstrap
{
    private readonly logger = new Logger(GeneratedRbacBootstrapService.name);

    constructor(
        @Inject(DataSource)
        private readonly dataSource: DataSource,
    ) {
        bindGeneratedRbacDataSource(dataSource);
    }

    async onModuleInit(): Promise<void> {
        await this.upsertAdminRole();
        await this.upsertRbacCatalog();
    }

    async onApplicationBootstrap(): Promise<void> {
        const admin = await Role.one({ name: GENERATED_RBAC_ADMIN.NAME });
        if (!admin) {
            return;
        }
        await this.assignBootstrapUser(readNumber(admin, 'role_id'));
    }

    private async upsertAdminRole() {
        const payload = RoleCreateSchema.parse({
            name: GENERATED_RBAC_ADMIN.NAME,
            label: GENERATED_RBAC_ADMIN.LABEL,
            hint: null,
            is_system: true,
            full_access: true,
        });
        const { entity, created } = await Role.getOrCreate({
            where: { name: GENERATED_RBAC_ADMIN.NAME },
            create: payload,
        });
        if (!created) {
            await Role.updateByPk(readNumber(entity, 'role_id'), {
                label: GENERATED_RBAC_ADMIN.LABEL,
                is_system: true,
                full_access: true,
            });
        }
        return entity;
    }

    private async upsertRbacCatalog(): Promise<void> {
        await this.upsertCatalogResource(
            GENERATED_RBAC_RESOURCE,
            GENERATED_RBAC_ACTIONS,
        );
        for (const entry of GENERATED_CATALOG_RESOURCES) {
            await this.upsertCatalogResource(entry.resource, entry.actions);
        }
    }

    private async upsertCatalogResource(
        resource: string,
        actions: readonly string[],
    ): Promise<void> {
        const payload = CatalogCreateSchema.parse({
            resource,
            actions: [...actions],
        });
        const { entity, created } = await RbacCatalog.getOrCreate({
            where: { resource },
            create: payload,
        });
        if (!created) {
            await RbacCatalog.updateByPk(readNumber(entity, 'rbac_catalog_id'), {
                actions: payload.actions,
            });
        }
    }

    private async assignBootstrapUser(adminRoleId: number): Promise<void> {
        const email = process.env[GENERATED_AUTH_CONFIG.BOOTSTRAP_EMAIL_ENV]
            ?.trim()
            .toLowerCase();
        if (!email) {
            return;
        }
        const userEntity = getEntityWithName(
            GENERATED_RBAC_ENTITY_NAMES.USER,
            this.dataSource,
        );
        const user = await userEntity.one({ email });
        if (!user) {
            return;
        }
        if (readNullableNumber(user, 'role_id') != null) {
            return;
        }
        await userEntity.updateByPk(readNumber(user, 'user_id'), {
            role_id: adminRoleId,
        });
        this.logger.log(
            `Assigned ${GENERATED_RBAC_ADMIN.NAME} to bootstrap user`,
        );
    }
}

export { GeneratedRbacBootstrapService };
