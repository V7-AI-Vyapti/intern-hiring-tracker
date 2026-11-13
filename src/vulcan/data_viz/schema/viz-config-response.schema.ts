import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { SUPPORTED_CHART_TYPES } from '../constants/chart-types.constants';

const GeoFieldsSchema = z.object({
    lat_field: z.string(),
    lon_field: z.string(),
});

const FkDimensionSchema = z.object({
    related_entity: z.string(),
    display_field: z.string(),
});

const VizConfigResponseSchema = z.object({
    entity_id: z.number(),
    entity_name: z.string(),
    dimensions: z.array(z.string()),
    measures: z.array(z.string()),
    supported_charts: z.array(z.enum(SUPPORTED_CHART_TYPES)),
    geo_fields: GeoFieldsSchema.nullable(),
    fk_dimensions: z.record(z.string(), FkDimensionSchema),
});

class VizConfigResponseDto extends createZodDto(VizConfigResponseSchema) {}

export {
    FkDimensionSchema,
    GeoFieldsSchema,
    VizConfigResponseDto,
    VizConfigResponseSchema,
};
