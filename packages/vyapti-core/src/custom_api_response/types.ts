export type PaginationMeta = {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
};

export type ApiErrorDetail = {
    field: string;
    message: string;
};

export type ApiErrorBody = {
    code: string;
    details?: ApiErrorDetail[];
};

export type ApiSuccessResponse<T> = {
    success: true;
    message: string | null;
    data: T;
    meta: PaginationMeta | null;
    error: null;
};

export type ApiErrorResponse = {
    success: false;
    message: string;
    data: null;
    meta: null;
    error: ApiErrorBody;
};

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;
