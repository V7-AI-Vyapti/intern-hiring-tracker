import { type AggFn } from '../constants/agg-fn.constants';

function round(n: number): number {
    return Math.round(n * 100) / 100;
}

function applyAgg(nums: number[], agg: AggFn): number {
    if (nums.length === 0) {
        return 0;
    }

    switch (agg) {
        case 'sum':
            return round(nums.reduce((a, b) => a + b, 0));
        case 'avg':
            return round(nums.reduce((a, b) => a + b, 0) / nums.length);
        case 'count':
            return nums.length;
        case 'min':
            return round(Math.min(...nums));
        case 'max':
            return round(Math.max(...nums));
    }
}

export { applyAgg, round };
