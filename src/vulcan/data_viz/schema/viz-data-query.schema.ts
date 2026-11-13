import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { AGG_FNS } from '../constants/agg-fn.constants';
import {
    GEO_CHART_TYPES,
    HEATMAP_MATRIX_CHART_TYPE,
    STANDARD_CHART_TYPES,
    SUPPORTED_CHART_TYPES,
} from '../constants/chart-types.constants';
import {
    GEO_DEFAULT_LIMIT,
    GEO_MAX_LIMIT,
} from '../constants/viz-limits.constants';

const VizDataQuerySchema = z
    .object({
        chart_type: z.enum(SUPPORTED_CHART_TYPES),
        x_field: z.string().optional(),
        y_field: z.string().optional(),
        y_field_dimension: z.string().optional(),
        value_field: z.string().optional(),
        agg: z.enum(AGG_FNS).optional(),
        limit: z.coerce
            .number()
            .int()
            .min(1)
            .max(GEO_MAX_LIMIT)
            .default(GEO_DEFAULT_LIMIT)
            .optional(),
    })
    .superRefine((data, ctx) => {
        if (
            (STANDARD_CHART_TYPES as readonly string[]).includes(
                data.chart_type,
            )
        ) {
            if (!data.x_field) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: 'x_field is required',
                    path: ['x_field'],
                });
            }
            if (!data.agg) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: 'agg is required',
                    path: ['agg'],
                });
            }
            if (data.agg !== 'count' && !data.y_field) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: 'y_field is required unless agg is count',
                    path: ['y_field'],
                });
            }
            return;
        }

        if (data.chart_type === HEATMAP_MATRIX_CHART_TYPE) {
            if (!data.x_field) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: 'x_field is required',
                    path: ['x_field'],
                });
            }
            if (!data.y_field_dimension) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: 'y_field_dimension is required',
                    path: ['y_field_dimension'],
                });
            }
            if (!data.value_field) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: 'value_field is required',
                    path: ['value_field'],
                });
            }
            if (!data.agg) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: 'agg is required',
                    path: ['agg'],
                });
            }
            return;
        }

        if ((GEO_CHART_TYPES as readonly string[]).includes(data.chart_type)) {
            return;
        }
    });

type VizDataQuery = z.infer<typeof VizDataQuerySchema>;

type StandardVizDataQuery = VizDataQuery & {
    chart_type: (typeof STANDARD_CHART_TYPES)[number];
    x_field: string;
    agg: (typeof AGG_FNS)[number];
};

type HeatmapMatrixVizDataQuery = VizDataQuery & {
    chart_type: typeof HEATMAP_MATRIX_CHART_TYPE;
    x_field: string;
    y_field_dimension: string;
    value_field: string;
    agg: (typeof AGG_FNS)[number];
};

type GeoVizDataQuery = VizDataQuery & {
    chart_type: (typeof GEO_CHART_TYPES)[number];
    limit: number;
};

class VizDataQueryDto extends createZodDto(VizDataQuerySchema) {}

export {
    type GeoVizDataQuery,
    type HeatmapMatrixVizDataQuery,
    type StandardVizDataQuery,
    VizDataQueryDto,
    VizDataQuerySchema,
    type VizDataQuery,
};
