import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { getEntityWithName } from '@vyapti/core';
import { DataSource } from 'typeorm';
import { Entity } from '@system-entities/entity.entity';
import { readString } from '@vulcan/shared/utils/record-readers';
import { classifyEntityModelFields } from '../utils/field-classifier.util';
import { detectGeoPairFromModelFields } from '../utils/geo-field-detector.util';
import { resolveFkDimensionMetas } from '../utils/fk-display-resolver.util';
import { getSupportedCharts } from '../utils/get-supported-charts.util';
import { DATA_VIZ_MESSAGES } from '../data-viz.constants';
import { VizConfigResponseSchema } from '../schema/viz-config-response.schema';

@Injectable()
export class VizConfigService {
    constructor(
        @Inject(DataSource)
        private readonly dataSource: DataSource,
    ) {}

    async getVizConfig(entityId: number) {
        const entity = await Entity.getByPk(entityId);

        if (!entity) {
            throw new NotFoundException(DATA_VIZ_MESSAGES.ENTITY_NOT_FOUND);
        }

        const entityName = readString(entity, 'entity_name');
        const entityModel = getEntityWithName(entityName, this.dataSource);
        const modelFields = entityModel.getModelFields();
        const { dimensions, measures } = classifyEntityModelFields(modelFields);
        const geoFields = detectGeoPairFromModelFields(modelFields);
        const fkDimensions = resolveFkDimensionMetas({
            modelFields,
            dimensionFields: dimensions,
            dataSource: this.dataSource,
        });
        const supportedCharts = getSupportedCharts({
            dimCount: dimensions.length,
            measureCount: measures.length,
            hasGeo: geoFields !== null,
        });

        return VizConfigResponseSchema.parse({
            entity_id: entityId,
            entity_name: entityName,
            dimensions,
            measures,
            supported_charts: supportedCharts,
            geo_fields: geoFields,
            fk_dimensions: fkDimensions,
        });
    }
}
