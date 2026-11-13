import { Body, Controller, Param, Query } from '@nestjs/common';
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
import { Public } from '../guards/public.decorator.js';
import { CreateUserRequestDto } from '../schema/create-user.schema.js';
import { ForcePasswordResetRequestDto } from '../schema/force-password-reset.schema.js';
import { ListUsersQueryDto } from '../schema/list-users-query.schema.js';
import { PasswordResetRequestDto } from '../schema/password-reset.schema.js';
import { UpdateUserRequestDto } from '../schema/update-user.schema.js';
import { UserIdParamsDto } from '../schema/user-id-params.schema.js';
import {
    serializeCreatedStaffUser,
    serializeResetToken,
    serializeStaffUser,
    serializeStaffUsers,
    type CreatedStaffUserResponse,
    type ResetTokenResponse,
    type StaffUserResponse,
} from '../serializers/user.serializer.js';
import { UsersService } from '../services/users.service.js';
import { AUTH_BEARER_DECORATORS } from '../swagger/auth-bearer.decorators.js';

@Controller()
class UsersController {
    constructor(private readonly usersService: UsersService) {}

    @buildEndpoint({
        method: API_METHOD_TYPES.GET,
        path: AUTH_ROUTE_PATHS.USERS,
        tags: AUTH_TAGS,
        responses: {
            [HTTP_STATUS_CODES.OK]: AUTH_MESSAGES.USERS_FETCHED,
            [HTTP_STATUS_CODES.UNAUTHORIZED]: AUTH_MESSAGES.UNAUTHORIZED,
        },
        decorators: AUTH_BEARER_DECORATORS,
    })
    async list(
        @Query() query: ListUsersQueryDto,
    ): Promise<ApiSuccessResponse<StaffUserResponse[]>> {
        const result = await this.usersService.list({
            page: query.page,
            limit: query.limit,
            search: query.search,
            sortBy: query.sortBy,
            sortOrder: query.sortOrder,
        });
        return apiSuccess(serializeStaffUsers(result.rows), {
            message: AUTH_MESSAGES.USERS_FETCHED,
            meta: buildPaginationMeta(result.page, result.limit, result.total),
        });
    }

    @buildEndpoint({
        method: API_METHOD_TYPES.GET,
        path: AUTH_ROUTE_PATHS.USER_BY_ID,
        tags: AUTH_TAGS,
        responses: {
            [HTTP_STATUS_CODES.OK]: AUTH_MESSAGES.USER_FETCHED,
            [HTTP_STATUS_CODES.UNAUTHORIZED]: AUTH_MESSAGES.UNAUTHORIZED,
            [HTTP_STATUS_CODES.NOT_FOUND]: AUTH_MESSAGES.USER_NOT_FOUND,
        },
        decorators: AUTH_BEARER_DECORATORS,
    })
    async get(
        @Param() params: UserIdParamsDto,
    ): Promise<ApiSuccessResponse<StaffUserResponse>> {
        const user = await this.usersService.get({ userId: params.userId });
        return apiSuccess(serializeStaffUser(user), {
            message: AUTH_MESSAGES.USER_FETCHED,
        });
    }

    @buildEndpoint({
        method: API_METHOD_TYPES.POST,
        path: AUTH_ROUTE_PATHS.USERS,
        tags: AUTH_TAGS,
        responses: {
            [HTTP_STATUS_CODES.CREATED]: AUTH_MESSAGES.USER_CREATED,
            [HTTP_STATUS_CODES.UNAUTHORIZED]: AUTH_MESSAGES.UNAUTHORIZED,
            [HTTP_STATUS_CODES.CONFLICT]: AUTH_MESSAGES.EMAIL_TAKEN,
        },
        decorators: AUTH_BEARER_DECORATORS,
    })
    async create(
        @Body() payload: CreateUserRequestDto,
    ): Promise<ApiSuccessResponse<CreatedStaffUserResponse>> {
        const created = await this.usersService.create({
            email: payload.email,
            displayName: payload.display_name,
            roleId: payload.role_id,
            password: payload.password,
            otp: payload.otp,
        });
        return apiSuccess(serializeCreatedStaffUser(created), {
            message: AUTH_MESSAGES.USER_CREATED,
        });
    }

    @buildEndpoint({
        method: API_METHOD_TYPES.PATCH,
        path: AUTH_ROUTE_PATHS.USER_BY_ID,
        tags: AUTH_TAGS,
        responses: {
            [HTTP_STATUS_CODES.OK]: AUTH_MESSAGES.USER_UPDATED,
            [HTTP_STATUS_CODES.UNAUTHORIZED]: AUTH_MESSAGES.UNAUTHORIZED,
            [HTTP_STATUS_CODES.NOT_FOUND]: AUTH_MESSAGES.USER_NOT_FOUND,
        },
        decorators: AUTH_BEARER_DECORATORS,
    })
    async update(
        @Param() params: UserIdParamsDto,
        @Body() payload: UpdateUserRequestDto,
    ): Promise<ApiSuccessResponse<StaffUserResponse>> {
        const user = await this.usersService.update({
            userId: params.userId,
            roleId: payload.role_id,
            isActive: payload.is_active,
        });
        return apiSuccess(serializeStaffUser(user), {
            message: AUTH_MESSAGES.USER_UPDATED,
        });
    }

    @buildEndpoint({
        method: API_METHOD_TYPES.POST,
        path: AUTH_ROUTE_PATHS.USER_FORCE_PASSWORD_RESET,
        tags: AUTH_TAGS,
        responses: {
            [HTTP_STATUS_CODES.OK]: AUTH_MESSAGES.PASSWORD_RESET_STARTED,
            [HTTP_STATUS_CODES.UNAUTHORIZED]: AUTH_MESSAGES.UNAUTHORIZED,
            [HTTP_STATUS_CODES.NOT_FOUND]: AUTH_MESSAGES.USER_NOT_FOUND,
        },
        decorators: AUTH_BEARER_DECORATORS,
    })
    async forcePasswordReset(
        @Param() params: UserIdParamsDto,
        @Body() payload: ForcePasswordResetRequestDto,
    ): Promise<ApiSuccessResponse<ResetTokenResponse>> {
        const resetToken = await this.usersService.forcePasswordReset({
            userId: params.userId,
            otp: payload.otp,
        });
        return apiSuccess(serializeResetToken(resetToken), {
            message: AUTH_MESSAGES.PASSWORD_RESET_STARTED,
        });
    }

    @Public()
    @buildEndpoint({
        method: API_METHOD_TYPES.POST,
        path: AUTH_ROUTE_PATHS.PASSWORD_RESET,
        tags: AUTH_TAGS,
        responses: {
            [HTTP_STATUS_CODES.OK]: AUTH_MESSAGES.PASSWORD_UPDATED,
            [HTTP_STATUS_CODES.UNAUTHORIZED]: AUTH_MESSAGES.INVALID_TOKEN,
        },
    })
    async resetPassword(
        @Body() payload: PasswordResetRequestDto,
    ): Promise<ApiSuccessResponse<null>> {
        await this.usersService.resetPassword({
            token: payload.token,
            password: payload.password,
        });
        return apiSuccess(null, { message: AUTH_MESSAGES.PASSWORD_UPDATED });
    }
}

export { UsersController };
