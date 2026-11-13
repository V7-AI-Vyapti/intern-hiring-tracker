import {
    GEO_CHART_TYPES,
    HEATMAP_MATRIX_CHART_TYPE,
    STANDARD_CHART_TYPES,
    type SupportedChartType,
} from '../constants/chart-types.constants';

function getSupportedCharts(args: {
    dimCount: number;
    measureCount: number;
    hasGeo?: boolean;
}): SupportedChartType[] {
    const charts: SupportedChartType[] = [];

    if (args.dimCount >= 1 && args.measureCount >= 1) {
        charts.push(...STANDARD_CHART_TYPES);
    }

    if (args.dimCount >= 1) {
        charts.push('pie');
    }

    if (args.dimCount >= 2 && args.measureCount >= 1) {
        charts.push(HEATMAP_MATRIX_CHART_TYPE);
    }

    if (args.hasGeo) {
        charts.push(...GEO_CHART_TYPES);
    }

    return [...new Set(charts)];
}

export { getSupportedCharts };
