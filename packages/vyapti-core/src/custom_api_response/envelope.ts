import type {
    ApiErrorBody,
    ApiErrorResponse,
    ApiSuccessResponse,
    PaginationMeta,
} from './types.js';

export type ApiSuccessOptions = {
    message?: string | null;
    meta?: PaginationMeta | null;
};

export function apiSuccess<T>(
    data: T,
    options?: ApiSuccessOptions,
): ApiSuccessResponse<T> {
    return {
        success: true,
        message: options?.message ?? null,
        data,
        meta: options?.meta ?? null,
        error: null,
    };
}

export function apiFailure(
    message: string,
    error: ApiErrorBody,
): ApiErrorResponse {
    return {
        success: false,
        message,
        data: null,
        meta: null,
        error,
    };
}

export function buildPaginationMeta(
    page: number,
    limit: number,
    total: number,
): PaginationMeta {
    const safeLimit = limit > 0 ? limit : 1;
    return {
        page,
        limit: safeLimit,
        total,
        totalPages: Math.ceil(total / safeLimit),
    };
}
