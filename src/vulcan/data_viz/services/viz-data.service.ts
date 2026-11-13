import {
    BadRequestException,
    Inject,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { getEntityWithName } from '@vyapti/core';
import { DataSource } from 'typeorm';
import { Entity } from '@system-entities/entity.entity';
import { readString } from '@vulcan/shared/utils/record-readers';
import { DATA_VIZ_MESSAGES, VIZ_DATA_ERRORS } from '../data-viz.constants';
import {
    type GeoVizDataQuery,
    type HeatmapMatrixVizDataQuery,
    type StandardVizDataQuery,
    VizDataQueryDto,
} from '../schema/viz-data-query.schema';
import {
    GeoDataResponseSchema,
    HeatmapMatrixResponseSchema,
    StandardVizDataResponseSchema,
} from '../schema/viz-data-response.schema';
import {
    aggregate2d,
    HeatmapCellLimitExceededError,
} from '../utils/aggregate-2d.util';
import {
    aggregate,
    NonNumericMeasureValueError,
} from '../utils/aggregate.util';
import { buildDatasetLabel } from '../utils/build-dataset-label.util';
import { classifyEntityModelFields } from '../utils/field-classifier.util';
import { detectGeoPairFromModelFields } from '../utils/geo-field-detector.util';
import {
    applyLabelMap,
    buildFkLabelMap,
    resolveFkDimensionMeta,
} from '../utils/fk-display-resolver.util';
import { throwInvalidVizField } from '../utils/throw-invalid-viz-field.util';

@Injectable()
export class VizDataService {
    constructor(
        @Inject(DataSource)
        private readonly dataSource: DataSource,
    ) {}

    async getVizData(entityId: number, query: VizDataQueryDto) {
        const entity = await Entity.getByPk(entityId);

        if (!entity) {
            throw new NotFoundException(DATA_VIZ_MESSAGES.ENTITY_NOT_FOUND);
        }

        const entityName = readString(entity, 'entity_name');
        const entityModel = getEntityWithName(entityName, this.dataSource);
        const modelFields = entityModel.getModelFields();
        const { dimensions, measures } = classifyEntityModelFields(modelFields);

        if (query.chart_type === 'heatmap_matrix') {
            return this.getHeatmapMatrixData({
                entityName,
                modelFields,
                dimensions,
                measures,
                query: query as HeatmapMatrixVizDataQuery,
            });
        }

        if (query.chart_type === 'map' || query.chart_type === 'heatmap_geo') {
            return this.getGeoData({
                entityName,
                modelFields,
                measures,
                entityModel,
                query: query as GeoVizDataQuery,
            });
        }

        return this.getStandardChartData({
            entityName,
            modelFields,
            dimensions,
            measures,
            entityModel,
            query: query as StandardVizDataQuery,
        });
    }

    private async getStandardChartData(args: {
        entityName: string;
        modelFields: Record<
            string,
            { kind: string; options: Record<string, unknown> }
        >;
        dimensions: string[];
        measures: string[];
        entityModel: ReturnType<typeof getEntityWithName>;
        query: StandardVizDataQuery;
    }) {
        const {
            query,
            entityName,
            dimensions,
            measures,
            modelFields,
            entityModel,
        } = args;

        if (!dimensions.includes(query.x_field)) {
            throwInvalidVizField(
                VIZ_DATA_ERRORS.INVALID_X_FIELD(query.x_field, entityName),
            );
        }

        if (query.y_field && !measures.includes(query.y_field)) {
            throwInvalidVizField(
                VIZ_DATA_ERRORS.INVALID_Y_FIELD(query.y_field, entityName),
            );
        }

        const rows = (await entityModel.all()) as unknown as Record<
            string,
            unknown
        >[];

        let labels: string[];
        let values: number[];

        try {
            ({ labels, values } = aggregate(
                rows,
                query.x_field,
                query.y_field ?? null,
                query.agg,
            ));
        } catch (error) {
            this.handleAggregationError(error);
        }

        labels = await this.resolveDimensionLabels({
            fieldName: query.x_field,
            labels,
            modelFields,
        });

        return StandardVizDataResponseSchema.parse({
            chart_type: query.chart_type,
            x_field: query.x_field,
            y_field: query.y_field ?? null,
            agg: query.agg,
            dataset_label: buildDatasetLabel(query.agg, query.y_field),
            labels,
            values,
        });
    }

    private async getHeatmapMatrixData(args: {
        entityName: string;
        modelFields: Record<
            string,
            { kind: string; options: Record<string, unknown> }
        >;
        dimensions: string[];
        measures: string[];
        query: HeatmapMatrixVizDataQuery;
    }) {
        const { query, entityName, dimensions, measures, modelFields } = args;

        if (!dimensions.includes(query.x_field)) {
            throwInvalidVizField(
                VIZ_DATA_ERRORS.INVALID_X_FIELD(query.x_field, entityName),
            );
        }

        if (!dimensions.includes(query.y_field_dimension)) {
            throwInvalidVizField(
                VIZ_DATA_ERRORS.INVALID_Y_FIELD_DIMENSION(
                    query.y_field_dimension,
                    entityName,
                ),
            );
        }

        if (!measures.includes(query.value_field)) {
            throwInvalidVizField(
                VIZ_DATA_ERRORS.INVALID_VALUE_FIELD(
                    query.value_field,
                    entityName,
                ),
            );
        }

        const entityModel = getEntityWithName(entityName, this.dataSource);
        const rows = (await entityModel.all()) as unknown as Record<
            string,
            unknown
        >[];

        let x_labels: string[];
        let y_labels: string[];
        let cells: { x: string; y: string; value: number }[];

        try {
            ({ x_labels, y_labels, cells } = aggregate2d(
                rows,
                query.x_field,
                query.y_field_dimension,
                query.value_field,
                query.agg,
            ));
        } catch (error) {
            if (error instanceof HeatmapCellLimitExceededError) {
                throw new BadRequestException(error.message);
            }
            this.handleAggregationError(error);
        }

        x_labels = await this.resolveDimensionLabels({
            fieldName: query.x_field,
            labels: x_labels,
            modelFields,
        });
        y_labels = await this.resolveDimensionLabels({
            fieldName: query.y_field_dimension,
            labels: y_labels,
            modelFields,
        });
        cells = await this.resolveHeatmapCellLabels({
            cells,
            xField: query.x_field,
            yField: query.y_field_dimension,
            modelFields,
        });

        return HeatmapMatrixResponseSchema.parse({
            chart_type: query.chart_type,
            x_field: query.x_field,
            y_field_dimension: query.y_field_dimension,
            value_field: query.value_field,
            agg: query.agg,
            x_labels,
            y_labels,
            cells,
        });
    }

    private async getGeoData(args: {
        entityName: string;
        modelFields: Record<string, { kind: string }>;
        measures: string[];
        entityModel: ReturnType<typeof getEntityWithName>;
        query: GeoVizDataQuery;
    }) {
        const { query, entityName, measures, modelFields, entityModel } = args;
        const geoPair = detectGeoPairFromModelFields(modelFields);

        if (!geoPair) {
            throw new BadRequestException(DATA_VIZ_MESSAGES.NO_GEO_FIELDS);
        }

        if (query.value_field && !measures.includes(query.value_field)) {
            throwInvalidVizField(
                VIZ_DATA_ERRORS.INVALID_GEO_VALUE_FIELD(
                    query.value_field,
                    entityName,
                ),
            );
        }

        const rows = (await entityModel.all({
            take: query.limit,
        })) as unknown as Record<string, unknown>[];

        const points = rows
            .map((row) => ({
                lat: Number(row[geoPair.lat_field]),
                lon: Number(row[geoPair.lon_field]),
                value: query.value_field
                    ? Number(row[query.value_field])
                    : undefined,
            }))
            .filter(
                (point) =>
                    Number.isFinite(point.lat) && Number.isFinite(point.lon),
            )
            .map((point) => ({
                lat: point.lat,
                lon: point.lon,
                ...(point.value !== undefined && Number.isFinite(point.value)
                    ? { value: point.value }
                    : {}),
            }));

        return GeoDataResponseSchema.parse({
            chart_type: query.chart_type,
            value_field: query.value_field ?? null,
            points,
        });
    }

    private async resolveDimensionLabels(args: {
        fieldName: string;
        labels: string[];
        modelFields: Record<
            string,
            { kind: string; options: Record<string, unknown> }
        >;
    }): Promise<string[]> {
        const field = args.modelFields[args.fieldName];
        if (!field) return args.labels;

        const meta = resolveFkDimensionMeta({
            fieldName: args.fieldName,
            field,
            dataSource: this.dataSource,
        });

        if (!meta) return args.labels;

        const labelMap = await buildFkLabelMap({
            dataSource: this.dataSource,
            meta,
        });

        return applyLabelMap(args.labels, labelMap);
    }

    private async resolveHeatmapCellLabels(args: {
        cells: { x: string; y: string; value: number }[];
        xField: string;
        yField: string;
        modelFields: Record<
            string,
            { kind: string; options: Record<string, unknown> }
        >;
    }) {
        const xMeta = resolveFkDimensionMeta({
            fieldName: args.xField,
            field: args.modelFields[args.xField],
            dataSource: this.dataSource,
        });
        const yMeta = resolveFkDimensionMeta({
            fieldName: args.yField,
            field: args.modelFields[args.yField],
            dataSource: this.dataSource,
        });

        const [xLabelMap, yLabelMap] = await Promise.all([
            xMeta
                ? buildFkLabelMap({ dataSource: this.dataSource, meta: xMeta })
                : Promise.resolve(new Map<string, string>()),
            yMeta
                ? buildFkLabelMap({ dataSource: this.dataSource, meta: yMeta })
                : Promise.resolve(new Map<string, string>()),
        ]);

        return args.cells.map((cell) => ({
            ...cell,
            x: xLabelMap.get(cell.x) ?? cell.x,
            y: yLabelMap.get(cell.y) ?? cell.y,
        }));
    }

    private handleAggregationError(error: unknown): never {
        if (error instanceof NonNumericMeasureValueError) {
            throw new BadRequestException(
                DATA_VIZ_MESSAGES.NON_NUMERIC_MEASURE_VALUE(error.field),
            );
        }

        throw error;
    }
}
