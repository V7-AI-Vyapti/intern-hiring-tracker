import { Body, Controller, Req } from '@nestjs/common';
import { buildEndpoint } from '@vyapti/core/custom_api';
import {
    apiSuccess,
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
import { PatchMeRequestDto } from '../schema/patch-me.schema.js';
import {
    serializeUser,
    type UserResponse,
} from '../serializers/user.serializer.js';
import { AuthSessionService } from '../services/auth-session.service.js';
import { AUTH_BEARER_DECORATORS } from '../swagger/auth-bearer.decorators.js';
import { requireRequestUser } from '../utils/require-request-user.util.js';

@Controller()
class MeController {
    constructor(private readonly authSessionService: AuthSessionService) {}

    @buildEndpoint({
        method: API_METHOD_TYPES.GET,
        path: AUTH_ROUTE_PATHS.ME,
        tags: AUTH_TAGS,
        responses: {
            [HTTP_STATUS_CODES.OK]: AUTH_MESSAGES.PROFILE_FETCHED,
            [HTTP_STATUS_CODES.UNAUTHORIZED]: AUTH_MESSAGES.UNAUTHORIZED,
        },
        decorators: AUTH_BEARER_DECORATORS,
    })
    async get(
        @Req() request: AuthRequest,
    ): Promise<ApiSuccessResponse<UserResponse>> {
        const user = await this.authSessionService.getMe({
            userId: requireRequestUser(request).id,
        });
        return apiSuccess(serializeUser(user), {
            message: AUTH_MESSAGES.PROFILE_FETCHED,
        });
    }

    @buildEndpoint({
        method: API_METHOD_TYPES.PATCH,
        path: AUTH_ROUTE_PATHS.ME,
        tags: AUTH_TAGS,
        responses: {
            [HTTP_STATUS_CODES.OK]: AUTH_MESSAGES.PROFILE_UPDATED,
            [HTTP_STATUS_CODES.UNAUTHORIZED]: AUTH_MESSAGES.UNAUTHORIZED,
        },
        decorators: AUTH_BEARER_DECORATORS,
    })
    async update(
        @Req() request: AuthRequest,
        @Body() payload: PatchMeRequestDto,
    ): Promise<ApiSuccessResponse<UserResponse>> {
        const user = await this.authSessionService.patchMe({
            userId: requireRequestUser(request).id,
            displayName: payload.display_name,
            email: payload.email,
        });
        return apiSuccess(serializeUser(user), {
            message: AUTH_MESSAGES.PROFILE_UPDATED,
        });
    }
}

export { MeController };
