import { type AggFn } from '../constants/agg-fn.constants';
import { HEATMAP_CELL_LIMIT } from '../constants/viz-limits.constants';
import { applyAgg } from './apply-agg.util';
import { NonNumericMeasureValueError } from './aggregate.util';
import { stringifyFieldValue } from './stringify-field-value.util';

class HeatmapCellLimitExceededError extends Error {
    constructor(
        readonly xField: string,
        readonly yField: string,
        readonly cellCount: number,
        readonly limit: number,
    ) {
        super(
            `${xField} × ${yField} would produce ${cellCount} cells (limit ${limit}). Pick lower-cardinality fields.`,
        );
        this.name = 'HeatmapCellLimitExceededError';
    }
}

type HeatmapCell = { x: string; y: string; value: number };

function aggregate2d(
    rows: Record<string, unknown>[],
    xField: string,
    yField: string,
    valueField: string,
    agg: AggFn,
): { x_labels: string[]; y_labels: string[]; cells: HeatmapCell[] } {
    const groups = new Map<string, number[]>();
    const xSet = new Set<string>();
    const ySet = new Set<string>();

    for (const row of rows) {
        const xVal = stringifyFieldValue(row[xField]);
        const yVal = stringifyFieldValue(row[yField]);
        xSet.add(xVal);
        ySet.add(yVal);

        const rawValue = row[valueField];
        if (rawValue === null || rawValue === undefined) {
            continue;
        }

        const numericValue = Number(rawValue);
        if (!Number.isFinite(numericValue)) {
            throw new NonNumericMeasureValueError(valueField, rawValue);
        }

        const key = `${xVal}|${yVal}`;
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key)!.push(numericValue);
    }

    const x_labels = Array.from(xSet);
    const y_labels = Array.from(ySet);
    const cellCount = x_labels.length * y_labels.length;

    if (cellCount > HEATMAP_CELL_LIMIT) {
        throw new HeatmapCellLimitExceededError(
            xField,
            yField,
            cellCount,
            HEATMAP_CELL_LIMIT,
        );
    }

    const cells: HeatmapCell[] = [];

    for (const x of x_labels) {
        for (const y of y_labels) {
            const nums = groups.get(`${x}|${y}`);
            if (nums) {
                cells.push({ x, y, value: applyAgg(nums, agg) });
            }
        }
    }

    return { x_labels, y_labels, cells };
}

export { aggregate2d, HeatmapCellLimitExceededError, type HeatmapCell };
