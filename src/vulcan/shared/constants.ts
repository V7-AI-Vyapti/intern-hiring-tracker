const API_METHOD_TYPES = {
    POST: 'post',
    GET: 'get',
    PUT: 'put',
    PATCH: 'patch',
    DELETE: 'delete',
} as const;

const HTTP_STATUS_CODES = {
    OK: 200,
    CREATED: 201,
    NO_CONTENT: 204,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    INTERNAL_SERVER_ERROR: 500,
} as const;

type HttpStatusCode =
    (typeof HTTP_STATUS_CODES)[keyof typeof HTTP_STATUS_CODES];

const MIME_TYPE = {
    MULTIPART_FORM_DATA: 'multipart/form-data',
    APPLICATION_JSON: 'application/json',
    APPLICATION_OCTET_STREAM: 'application/octet-stream',
} as const;

export { API_METHOD_TYPES, HTTP_STATUS_CODES, MIME_TYPE, type HttpStatusCode };
