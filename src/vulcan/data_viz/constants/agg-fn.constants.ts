const AGG_FNS = ['sum', 'avg', 'count', 'min', 'max'] as const;

type AggFn = (typeof AGG_FNS)[number];

export { AGG_FNS, type AggFn };
