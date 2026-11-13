import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { AGG_FNS } from '../constants/agg-fn.constants';
import {
    GEO_CHART_TYPES,
    HEATMAP_MATRIX_CHART_TYPE,
    STANDARD_CHART_TYPES,
} from '../constants/chart-types.constants';

const StandardVizDataResponseSchema = z.object({
    chart_type: z.enum(STANDARD_CHART_TYPES),
    x_field: z.string(),
    y_field: z.string().nullable(),
    agg: z.enum(AGG_FNS),
    dataset_label: z.string(),
    labels: z.array(z.string()),
    values: z.array(z.number()),
});

const HeatmapMatrixResponseSchema = z.object({
    chart_type: z.literal(HEATMAP_MATRIX_CHART_TYPE),
    x_field: z.string(),
    y_field_dimension: z.string(),
    value_field: z.string(),
    agg: z.enum(AGG_FNS),
    x_labels: z.array(z.string()),
    y_labels: z.array(z.string()),
    cells: z.array(
        z.object({
            x: z.string(),
            y: z.string(),
            value: z.number(),
        }),
    ),
});

const GeoDataResponseSchema = z.object({
    chart_type: z.enum(GEO_CHART_TYPES),
    value_field: z.string().nullable(),
    points: z.array(
        z.object({
            lat: z.number(),
            lon: z.number(),
            value: z.number().optional(),
        }),
    ),
});

const VizDataResponseSchema = z.union([
    StandardVizDataResponseSchema,
    HeatmapMatrixResponseSchema,
    GeoDataResponseSchema,
]);

type VizDataResponse = z.infer<typeof VizDataResponseSchema>;

class StandardVizDataResponseDto extends createZodDto(
    StandardVizDataResponseSchema,
) {}
class HeatmapMatrixResponseDto extends createZodDto(
    HeatmapMatrixResponseSchema,
) {}
class GeoDataResponseDto extends createZodDto(GeoDataResponseSchema) {}

export {
    GeoDataResponseDto,
    GeoDataResponseSchema,
    HeatmapMatrixResponseDto,
    HeatmapMatrixResponseSchema,
    StandardVizDataResponseDto,
    StandardVizDataResponseSchema,
    VizDataResponseSchema,
    type VizDataResponse,
};
