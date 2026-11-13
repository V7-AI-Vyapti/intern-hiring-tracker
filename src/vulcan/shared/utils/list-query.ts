type ListQuerySortOrder = 'ASC' | 'DESC';

type ResolvePaginationArgs = {
    page?: number | null;
    limit?: number | null;
    defaultLimit?: number;
    maxLimit?: number;
};

type ResolvedPagination = {
    page: number;
    limit: number;
    skip: number;
    take: number;
};

type BuildAllowedOrderArgs<TColumns extends Record<string, string>> = {
    columns: TColumns;
    sortBy?: keyof TColumns | string | null;
    sortOrder?: string | null;
    defaultSortBy: keyof TColumns;
    defaultSortOrder?: ListQuerySortOrder;
};

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const DEFAULT_MAX_LIMIT = 100;
const DEFAULT_SORT_ORDER: ListQuerySortOrder = 'ASC';

function resolvePositiveInteger(
    value: number | null | undefined,
): number | null {
    if (!Number.isFinite(value) || value == null || value < 1) {
        return null;
    }

    return Math.floor(value);
}

function resolvePagination(args: ResolvePaginationArgs): ResolvedPagination {
    const defaultLimit = args.defaultLimit ?? DEFAULT_LIMIT;
    const maxLimit = args.maxLimit ?? DEFAULT_MAX_LIMIT;
    const page = resolvePositiveInteger(args.page) ?? DEFAULT_PAGE;
    const requestedLimit = resolvePositiveInteger(args.limit) ?? defaultLimit;
    const limit = Math.min(requestedLimit, maxLimit);

    return {
        page,
        limit,
        skip: (page - 1) * limit,
        take: limit,
    };
}

function normalizeSearch(search: string | null | undefined): string | null {
    const trimmedSearch = search?.trim();
    return trimmedSearch ? trimmedSearch : null;
}

function normalizeSortOrder(
    sortOrder: string | null | undefined,
    defaultSortOrder: ListQuerySortOrder,
): ListQuerySortOrder {
    const normalized =
        typeof sortOrder === 'string' ? sortOrder.toUpperCase() : sortOrder;

    return normalized === 'ASC' || normalized === 'DESC'
        ? normalized
        : defaultSortOrder;
}

function buildAllowedOrder<TColumns extends Record<string, string>>(
    args: BuildAllowedOrderArgs<TColumns>,
): Record<string, ListQuerySortOrder> {
    const sortBy =
        args.sortBy != null &&
        Object.prototype.hasOwnProperty.call(args.columns, args.sortBy)
            ? (args.sortBy as keyof TColumns)
            : args.defaultSortBy;
    const sortOrder = normalizeSortOrder(
        args.sortOrder,
        args.defaultSortOrder ?? DEFAULT_SORT_ORDER,
    );

    return {
        [args.columns[sortBy]]: sortOrder,
    };
}

type PaginatedListResult<T> = {
    items: T;
    total: number;
    pagination: ResolvedPagination;
};

export {
    buildAllowedOrder,
    normalizeSearch,
    resolvePagination,
    type ListQuerySortOrder,
    type PaginatedListResult,
    type ResolvedPagination,
};
