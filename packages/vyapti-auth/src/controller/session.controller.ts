import { Body, Controller, Req, Res } from '@nestjs/common';
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
import { Public } from '../guards/public.decorator.js';
import { LoginRequestDto } from '../schema/login.schema.js';
import { RegisterRequestDto } from '../schema/register.schema.js';
import {
    serializeLogin,
    type LoginResponse,
} from '../serializers/login.serializer.js';
import { AuthSessionService } from '../services/auth-session.service.js';
import { RefreshCookieService } from '../services/refresh-cookie.service.js';
import { AUTH_BEARER_DECORATORS } from '../swagger/auth-bearer.decorators.js';

type CookieResponse = {
    setHeader(name: string, value: string): void;
};

@Controller()
class SessionController {
    constructor(
        private readonly authSessionService: AuthSessionService,
        private readonly refreshCookieService: RefreshCookieService,
    ) {}

    @Public()
    @buildEndpoint({
        method: API_METHOD_TYPES.POST,
        path: AUTH_ROUTE_PATHS.LOGIN,
        tags: AUTH_TAGS,
        responses: {
            [HTTP_STATUS_CODES.OK]: AUTH_MESSAGES.LOGGED_IN,
            [HTTP_STATUS_CODES.UNAUTHORIZED]: AUTH_MESSAGES.INVALID_CREDENTIALS,
        },
    })
    async login(
        @Body() payload: LoginRequestDto,
        @Res({ passthrough: true }) response: CookieResponse,
    ): Promise<ApiSuccessResponse<LoginResponse>> {
        const session = await this.authSessionService.login({
            email: payload.email,
            password: payload.password,
        });
        this.refreshCookieService.set(response, session.refreshToken);
        return apiSuccess(serializeLogin(session), {
            message: AUTH_MESSAGES.LOGGED_IN,
        });
    }

    @Public()
    @buildEndpoint({
        method: API_METHOD_TYPES.POST,
        path: AUTH_ROUTE_PATHS.REGISTER,
        tags: AUTH_TAGS,
        responses: {
            [HTTP_STATUS_CODES.OK]: AUTH_MESSAGES.REGISTERED,
            [HTTP_STATUS_CODES.UNAUTHORIZED]: AUTH_MESSAGES.UNAUTHORIZED,
            [HTTP_STATUS_CODES.NOT_FOUND]: AUTH_MESSAGES.REGISTER_DISABLED,
            [HTTP_STATUS_CODES.CONFLICT]: AUTH_MESSAGES.EMAIL_TAKEN,
        },
    })
    async register(
        @Body() payload: RegisterRequestDto,
        @Req() request: AuthRequest,
        @Res({ passthrough: true }) response: CookieResponse,
    ): Promise<ApiSuccessResponse<LoginResponse>> {
        const session = await this.authSessionService.register({
            email: payload.email,
            password: payload.password,
            displayName: payload.display_name,
            actor: request.user ?? null,
        });
        this.refreshCookieService.set(response, session.refreshToken);
        return apiSuccess(serializeLogin(session), {
            message: AUTH_MESSAGES.REGISTERED,
        });
    }

    @Public()
    @buildEndpoint({
        method: API_METHOD_TYPES.POST,
        path: AUTH_ROUTE_PATHS.REFRESH,
        tags: AUTH_TAGS,
        responses: {
            [HTTP_STATUS_CODES.OK]: AUTH_MESSAGES.TOKEN_REFRESHED,
            [HTTP_STATUS_CODES.UNAUTHORIZED]:
                AUTH_MESSAGES.REFRESH_TOKEN_INVALID,
        },
    })
    async refresh(
        @Req() request: AuthRequest,
        @Res({ passthrough: true }) response: CookieResponse,
    ): Promise<ApiSuccessResponse<LoginResponse>> {
        const session = await this.authSessionService.refresh({
            refreshToken: this.refreshCookieService.read(request.headers),
        });
        this.refreshCookieService.set(response, session.refreshToken);
        return apiSuccess(serializeLogin(session), {
            message: AUTH_MESSAGES.TOKEN_REFRESHED,
        });
    }

    @buildEndpoint({
        method: API_METHOD_TYPES.POST,
        path: AUTH_ROUTE_PATHS.LOGOUT,
        tags: AUTH_TAGS,
        responses: {
            [HTTP_STATUS_CODES.OK]: AUTH_MESSAGES.LOGGED_OUT,
            [HTTP_STATUS_CODES.UNAUTHORIZED]: AUTH_MESSAGES.UNAUTHORIZED,
        },
        decorators: AUTH_BEARER_DECORATORS,
    })
    async logout(
        @Req() request: AuthRequest,
        @Res({ passthrough: true }) response: CookieResponse,
    ): Promise<ApiSuccessResponse<null>> {
        await this.authSessionService.logout({
            refreshToken: this.refreshCookieService.read(request.headers),
        });
        this.refreshCookieService.clear(response);
        return apiSuccess(null, { message: AUTH_MESSAGES.LOGGED_OUT });
    }
}

export { SessionController };
