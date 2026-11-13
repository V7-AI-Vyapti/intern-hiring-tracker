import { Body, Controller, Param, Query, Req } from '@nestjs/common';
import { buildEndpoint } from '@vyapti/core/custom_api';
import {
    apiSuccess,
    buildPaginationMeta,
    type ApiSuccessResponse,
} from '@vyapti/core/custom_api_response';
import { AUTH_ROUTE_PATHS } from '../auth.config.js';
import {
    API_METHOD_TYPES,
    AUTH_MESSAGES,
    AUTH_TAGS,
    HTTP_STATUS_CODES,
} from '../auth.constants.js';
import type { AuthRequest } from '../guards/auth.guard.js';
import { ApiKeyIdParamsDto } from '../schema/api-key-id-params.schema.js';
import { IssueApiKeyRequestDto } from '../schema/issue-api-key.schema.js';
import { ListApiKeysQueryDto } from '../schema/list-api-keys-query.schema.js';
import {
    serializeApiKeyListItem,
    serializeIssuedApiKey,
    type ApiKeyListItemResponse,
    type IssuedApiKeyResponse,
} from '../serializers/api-key.serializer.js';
import { ApiKeyService } from '../services/api-key.service.js';
import { AUTH_BEARER_DECORATORS } from '../swagger/auth-bearer.decorators.js';
import { requireRequestUser } from '../utils/require-request-user.util.js';

@Controller()
class ApiKeysController {
    constructor(private readonly apiKeyService: ApiKeyService) {}

    @buildEndpoint({
        method: API_METHOD_TYPES.GET,
        path: AUTH_ROUTE_PATHS.API_KEYS,
        tags: AUTH_TAGS,
        responses: {
            [HTTP_STATUS_CODES.OK]: AUTH_MESSAGES.API_KEYS_FETCHED,
            [HTTP_STATUS_CODES.UNAUTHORIZED]: AUTH_MESSAGES.UNAUTHORIZED,
            [HTTP_STATUS_CODES.NOT_FOUND]: AUTH_MESSAGES.API_KEY_AUTH_DISABLED,
        },
        decorators: AUTH_BEARER_DECORATORS,
    })
    async list(
        @Req() request: AuthRequest,
        @Query() query: ListApiKeysQueryDto,
    ): Promise<ApiSuccessResponse<ApiKeyListItemResponse[]>> {
        const result = await this.apiKeyService.list({
            userId: requireRequestUser(request).id,
            page: query.page,
            limit: query.limit,
            search: query.search,
            sortBy: query.sortBy,
            sortOrder: query.sortOrder,
        });
        return apiSuccess(result.rows.map(serializeApiKeyListItem), {
            message: AUTH_MESSAGES.API_KEYS_FETCHED,
            meta: buildPaginationMeta(result.page, result.limit, result.total),
        });
    }

    @buildEndpoint({
        method: API_METHOD_TYPES.POST,
        path: AUTH_ROUTE_PATHS.API_KEYS,
        tags: AUTH_TAGS,
        responses: {
            [HTTP_STATUS_CODES.OK]: AUTH_MESSAGES.API_KEY_ISSUED,
            [HTTP_STATUS_CODES.UNAUTHORIZED]: AUTH_MESSAGES.UNAUTHORIZED,
            [HTTP_STATUS_CODES.NOT_FOUND]: AUTH_MESSAGES.API_KEY_AUTH_DISABLED,
        },
        decorators: AUTH_BEARER_DECORATORS,
    })
    async issue(
        @Req() request: AuthRequest,
        @Body() payload: IssueApiKeyRequestDto,
    ): Promise<ApiSuccessResponse<IssuedApiKeyResponse>> {
        const issued = await this.apiKeyService.issue({
            userId: requireRequestUser(request).id,
            name: payload.name,
        });
        return apiSuccess(serializeIssuedApiKey(issued), {
            message: AUTH_MESSAGES.API_KEY_ISSUED,
        });
    }

    @buildEndpoint({
        method: API_METHOD_TYPES.DELETE,
        path: AUTH_ROUTE_PATHS.API_KEY_BY_ID,
        tags: AUTH_TAGS,
        responses: {
            [HTTP_STATUS_CODES.OK]: AUTH_MESSAGES.API_KEY_REVOKED,
            [HTTP_STATUS_CODES.UNAUTHORIZED]: AUTH_MESSAGES.UNAUTHORIZED,
            [HTTP_STATUS_CODES.NOT_FOUND]: AUTH_MESSAGES.API_KEY_NOT_FOUND,
        },
        decorators: AUTH_BEARER_DECORATORS,
    })
    async revoke(
        @Req() request: AuthRequest,
        @Param() params: ApiKeyIdParamsDto,
    ): Promise<ApiSuccessResponse<null>> {
        await this.apiKeyService.revoke({
            userId: requireRequestUser(request).id,
            apiKeyId: params.apiKeyId,
        });
        return apiSuccess(null, { message: AUTH_MESSAGES.API_KEY_REVOKED });
    }
}

export { ApiKeysController };
