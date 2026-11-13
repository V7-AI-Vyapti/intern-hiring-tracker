const STANDARD_CHART_TYPES = ['bar', 'line', 'pie'] as const;
const HEATMAP_MATRIX_CHART_TYPE = 'heatmap_matrix' as const;
const GEO_CHART_TYPES = ['map', 'heatmap_geo'] as const;

const SUPPORTED_CHART_TYPES = [
    ...STANDARD_CHART_TYPES,
    HEATMAP_MATRIX_CHART_TYPE,
    ...GEO_CHART_TYPES,
] as const;

type StandardChartType = (typeof STANDARD_CHART_TYPES)[number];
type GeoChartType = (typeof GEO_CHART_TYPES)[number];
type SupportedChartType = (typeof SUPPORTED_CHART_TYPES)[number];

export {
    GEO_CHART_TYPES,
    HEATMAP_MATRIX_CHART_TYPE,
    STANDARD_CHART_TYPES,
    SUPPORTED_CHART_TYPES,
    type GeoChartType,
    type StandardChartType,
    type SupportedChartType,
};
