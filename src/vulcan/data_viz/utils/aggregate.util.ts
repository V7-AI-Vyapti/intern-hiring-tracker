import { type AggFn } from '../constants/agg-fn.constants';
import { applyAgg } from './apply-agg.util';
import { stringifyFieldValue } from './stringify-field-value.util';

class NonNumericMeasureValueError extends Error {
    constructor(
        readonly field: string,
        readonly value: unknown,
    ) {
        super(`Non-numeric value in measure field '${field}'`);
        this.name = 'NonNumericMeasureValueError';
    }
}

function aggregate(
    rows: Record<string, unknown>[],
    xField: string,
    yField: string | null,
    agg: AggFn,
): { labels: string[]; values: number[] } {
    const groups = new Map<string, number[]>();

    for (const row of rows) {
        const key = stringifyFieldValue(row[xField]);
        if (!groups.has(key)) groups.set(key, []);

        if (yField) {
            const rawValue = row[yField];
            if (rawValue === null || rawValue === undefined) {
                continue;
            }

            const numericValue = Number(rawValue);
            if (!Number.isFinite(numericValue)) {
                throw new NonNumericMeasureValueError(yField, rawValue);
            }

            groups.get(key)!.push(numericValue);
            continue;
        }

        groups.get(key)!.push(1);
    }

    const labels = Array.from(groups.keys());
    const values = labels.map((key) => applyAgg(groups.get(key)!, agg));

    return { labels, values };
}

export { aggregate, NonNumericMeasureValueError };
