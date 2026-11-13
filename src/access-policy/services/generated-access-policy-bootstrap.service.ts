import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { getEntityWithName } from '@vyapti/core';
import { readNumber } from '@vulcan/shared/utils/record-readers';
import {
    GENERATED_ACCESS_POLICY_ACTIONS,
    GENERATED_ACCESS_POLICY_ENTITY_NAMES,
    GENERATED_ACCESS_POLICY_RESOURCE,
} from '../access-policy.constants';

@Injectable()
class GeneratedAccessPolicyBootstrapService implements OnModuleInit {
    private readonly logger = new Logger(
        GeneratedAccessPolicyBootstrapService.name,
    );

    constructor(
        @Inject(DataSource)
        private readonly dataSource: DataSource,
    ) {}

    async onModuleInit(): Promise<void> {
        await this.upsertAccessPolicyCatalog();
    }

    private async upsertAccessPolicyCatalog(): Promise<void> {
        const catalogEntity = getEntityWithName(
            GENERATED_ACCESS_POLICY_ENTITY_NAMES.CATALOG,
            this.dataSource,
        );
        const payload = {
            resource: GENERATED_ACCESS_POLICY_RESOURCE,
            actions: [...GENERATED_ACCESS_POLICY_ACTIONS],
        };
        const { entity, created } = await catalogEntity.getOrCreate({
            where: { resource: payload.resource },
            create: payload,
        });
        if (!created) {
            await catalogEntity.updateByPk(
                readNumber(entity, 'rbac_catalog_id'),
                { actions: payload.actions },
            );
        }
        if (created) {
            this.logger.log('Seeded access_policy catalog resource');
        }
    }
}

export { GeneratedAccessPolicyBootstrapService };
