import type { ApiKeyListRecord } from '../types/auth.types.js';
import type { IssueApiKeyResult } from '../services/api-key.service.js';

type IssuedApiKeyResponse = {
    id: string;
    prefix: string;
    name: string | null;
    created_at: string;
    api_key: string;
};

type ApiKeyListItemResponse = {
    id: string;
    prefix: string;
    name: string | null;
    created_at: string;
};

function serializeIssuedApiKey(result: IssueApiKeyResult): IssuedApiKeyResponse {
    return {
        id: result.id,
        prefix: result.prefix,
        name: result.name,
        created_at: result.createdAt.toISOString(),
        api_key: result.rawKey,
    };
}

function serializeApiKeyListItem(row: ApiKeyListRecord): ApiKeyListItemResponse {
    return {
        id: String(row.id),
        prefix: row.prefix,
        name: row.name,
        created_at: row.createdAt.toISOString(),
    };
}

export { serializeApiKeyListItem, serializeIssuedApiKey };
export type { ApiKeyListItemResponse, IssuedApiKeyResponse };
