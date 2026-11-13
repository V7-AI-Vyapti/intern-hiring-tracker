import { HTTP_STATUS_CODES, type HttpStatusCode } from '../shared/constants';

const FILE_FORMAT_MESSAGES = {
    FILE_FORMATS_FETCHED: 'File formats fetched',
} as const;

const FILE_MANAGEMENT_MESSAGES = {
    FILE_UPLOADED: 'File uploaded',
    FILES_FETCHED: 'Files fetched',
    FILE_TOOLS_FETCHED: 'File tools fetched',
    EXCEL_TO_CSV_TRIGGERED: 'Excel to CSV conversion triggered',
    EXCEL_CONVERTED_TO_CSV: 'Excel workbook converted to CSV files',
    EXCEL_FILE_REQUIRED: 'File must be an Excel workbook (XLS or XLSX)',
    EXCEL_WORKBOOK_HAS_NO_SHEETS: 'Excel workbook has no sheets to convert',
    FILE_NOT_FOUND: 'File not found',
    FILE_DELETED: 'File deleted',
    DOWNLOAD_URL_CREATED: 'Download URL created',
    PREVIEW_URL_CREATED: 'Preview URL created',
    FOLDER_CREATED: 'Folder created',
    FOLDERS_FETCHED: 'Folders fetched',
    FOLDER_UPDATED: 'Folder updated',
    FOLDER_DELETED: 'Folder deleted',
} as const;

type AllowedHttpStatusCode = HttpStatusCode;

type StatusCodeToMessage = Partial<Record<HttpStatusCode, string>>;

const FILE_MANAGEMENT_FILES_UPLOAD_RESPONSES = {
    [HTTP_STATUS_CODES.CREATED]: FILE_MANAGEMENT_MESSAGES.FILE_UPLOADED,
} satisfies StatusCodeToMessage;

const FILE_MANAGEMENT_FILES_DOWNLOAD_URL_RESPONSES = {
    [HTTP_STATUS_CODES.OK]: FILE_MANAGEMENT_MESSAGES.DOWNLOAD_URL_CREATED,
} satisfies StatusCodeToMessage;

const FILE_MANAGEMENT_FILES_PREVIEW_URL_RESPONSES = {
    [HTTP_STATUS_CODES.OK]: FILE_MANAGEMENT_MESSAGES.PREVIEW_URL_CREATED,
} satisfies StatusCodeToMessage;

const FILE_MANAGEMENT_FILES_DELETE_RESPONSES = {
    [HTTP_STATUS_CODES.OK]: FILE_MANAGEMENT_MESSAGES.FILE_DELETED,
} satisfies StatusCodeToMessage;

const FILE_MANAGEMENT_FILES_LIST_RESPONSES = {
    [HTTP_STATUS_CODES.OK]: FILE_MANAGEMENT_MESSAGES.FILES_FETCHED,
} satisfies StatusCodeToMessage;

const FILE_MANAGEMENT_FILE_META_DATA_GET_RESPONSES = {
    [HTTP_STATUS_CODES.OK]: 'File metadata fetched',
} satisfies StatusCodeToMessage;

const FILE_MANAGEMENT_FILE_META_DATA_LIST_RESPONSES = {
    [HTTP_STATUS_CODES.OK]: 'File metadata list fetched',
} satisfies StatusCodeToMessage;

const FILE_MANAGEMENT_FILE_META_DATA_UPDATE_RESPONSES = {
    [HTTP_STATUS_CODES.OK]: 'File metadata updated',
} satisfies StatusCodeToMessage;

const FILE_MANAGEMENT_FILE_META_DATA_DELETE_RESPONSES = {
    [HTTP_STATUS_CODES.OK]: 'File metadata deleted',
} satisfies StatusCodeToMessage;

const FILE_MANAGEMENT_FOLDERS_CREATE_RESPONSES = {
    [HTTP_STATUS_CODES.CREATED]: FILE_MANAGEMENT_MESSAGES.FOLDER_CREATED,
} satisfies StatusCodeToMessage;

const FILE_MANAGEMENT_FOLDERS_LIST_RESPONSES = {
    [HTTP_STATUS_CODES.OK]: FILE_MANAGEMENT_MESSAGES.FOLDERS_FETCHED,
} satisfies StatusCodeToMessage;

const FILE_MANAGEMENT_FOLDERS_UPDATE_RESPONSES = {
    [HTTP_STATUS_CODES.OK]: FILE_MANAGEMENT_MESSAGES.FOLDER_UPDATED,
} satisfies StatusCodeToMessage;

const FILE_MANAGEMENT_FOLDERS_DELETE_RESPONSES = {
    [HTTP_STATUS_CODES.OK]: FILE_MANAGEMENT_MESSAGES.FOLDER_DELETED,
} satisfies StatusCodeToMessage;

const FILE_UPLOAD_SCHEMA_FOR_SWAGGER = {
    type: 'object',
    required: [],
    properties: {
        /**
         * Back-compat: allow legacy single-file clients to continue sending `file`.
         * Prefer `files` for multi-file upload.
         */
        file: { type: 'string', format: 'binary' },
        files: {
            type: 'array',
            items: { type: 'string', format: 'binary' },
        },
        folderId: { type: 'integer', example: undefined },
        fileName: {
            type: 'string',
            example: '',
            nullable: true,
        },
    },
};

const EXCEL_TO_CSV_TOOL_TYPE = 'file_management';
const EXCEL_TO_CSV_TOOL_NAME = 'excel_to_csv';

export {
    FILE_FORMAT_MESSAGES,
    FILE_MANAGEMENT_MESSAGES,
    EXCEL_TO_CSV_TOOL_TYPE,
    EXCEL_TO_CSV_TOOL_NAME,
    FILE_MANAGEMENT_FILES_UPLOAD_RESPONSES,
    FILE_MANAGEMENT_FILES_DOWNLOAD_URL_RESPONSES,
    FILE_MANAGEMENT_FILES_PREVIEW_URL_RESPONSES,
    FILE_MANAGEMENT_FILES_DELETE_RESPONSES,
    FILE_MANAGEMENT_FILES_LIST_RESPONSES,
    FILE_MANAGEMENT_FILE_META_DATA_GET_RESPONSES,
    FILE_MANAGEMENT_FILE_META_DATA_LIST_RESPONSES,
    FILE_MANAGEMENT_FILE_META_DATA_UPDATE_RESPONSES,
    FILE_MANAGEMENT_FILE_META_DATA_DELETE_RESPONSES,
    FILE_MANAGEMENT_FOLDERS_CREATE_RESPONSES,
    FILE_MANAGEMENT_FOLDERS_LIST_RESPONSES,
    FILE_MANAGEMENT_FOLDERS_UPDATE_RESPONSES,
    FILE_MANAGEMENT_FOLDERS_DELETE_RESPONSES,
    type AllowedHttpStatusCode,
    type StatusCodeToMessage,
    FILE_UPLOAD_SCHEMA_FOR_SWAGGER,
};
