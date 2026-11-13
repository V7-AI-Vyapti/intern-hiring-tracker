function paginateRows<T>(args: {
    rows: readonly T[];
    page: number;
    limit: number;
}): { rows: T[]; total: number; page: number; limit: number } {
    const skip = (args.page - 1) * args.limit;
    return {
        rows: args.rows.slice(skip, skip + args.limit),
        total: args.rows.length,
        page: args.page,
        limit: args.limit,
    };
}

export { paginateRows };
