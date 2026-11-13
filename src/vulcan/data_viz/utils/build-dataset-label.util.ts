import { type AggFn } from '../constants/agg-fn.constants';

function buildDatasetLabel(agg: AggFn, yField?: string): string {
    if (agg === 'count') return 'Count';
    const capitalized = agg.charAt(0).toUpperCase() + agg.slice(1);
    return `${capitalized} ${yField}`;
}

export { buildDatasetLabel };
