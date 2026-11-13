import { Body, Controller, Param, Query } from '@nestjs/common';
import { buildEndpoint } from '@vyapti/core/custom_api';
import {
    apiSuccess,
    buildPaginationMeta,
    type ApiSuccessResponse,
} from '@vyapti/core/custom_api_response';
import { RequirePermission } from '../guards/require-permission.decorator.js';
import { RBAC_ROUTE_PATHS } from '../rbac.config.js';
import {
    API_METHOD_TYPES,
    HTTP_STATUS_CODES,
    RBAC_MESSAGES,
    RBAC_TAGS,
} from '../rbac.constants.js';
import { ReplaceGrantListRequestDto } from '../schema/replace-permissions.schema.js';
import { ReplaceRoleBundlesRequestDto } from '../schema/replace-role-bundles.schema.js';
import { ListRolesQueryDto } from '../schema/list-roles-query.schema.js';
import { RoleIdParamsDto } from '../schema/role-id-params.schema.js';
import {
    CreateRoleRequestDto,
    UpdateRoleRequestDto,
} from '../schema/role.schema.js';
import {
    serializeBundleIds,
    serializePermissions,
    serializeRole,
    serializeRoleDetail,
    serializeRoles,
    type PermissionResponse,
    type RoleDetailResponse,
    type RoleResponse,
} from '../serializers/rbac.serializer.js';
import { RolesService } from '../services/roles.service.js';

@Controller()
class RolesController {
    constructor(private readonly rolesService: RolesService) {}

    @RequirePermission('rbac', 'list')
    @buildEndpoint({
        method: API_METHOD_TYPES.GET,
        path: RBAC_ROUTE_PATHS.ROLES,
        tags: RBAC_TAGS,
        responses: {
            [HTTP_STATUS_CODES.OK]: RBAC_MESSAGES.ROLES_FETCHED,
            [HTTP_STATUS_CODES.NOT_FOUND]: RBAC_MESSAGES.ACCESS_DENIED,
        },
    })
    async list(
        @Query() query: ListRolesQueryDto,
    ): Promise<ApiSuccessResponse<RoleResponse[]>> {
        const result = await this.rolesService.list({
            page: query.page,
            limit: query.limit,
            search: query.search ?? null,
            sortBy: query.sortBy,
            sortOrder: query.sortOrder,
        });
        return apiSuccess(serializeRoles(result.rows), {
            message: RBAC_MESSAGES.ROLES_FETCHED,
            meta: buildPaginationMeta(result.page, result.limit, result.total),
        });
    }

    @RequirePermission('rbac', 'create')
    @buildEndpoint({
        method: API_METHOD_TYPES.POST,
        path: RBAC_ROUTE_PATHS.ROLES,
        tags: RBAC_TAGS,
        responses: {
            [HTTP_STATUS_CODES.CREATED]: RBAC_MESSAGES.ROLE_CREATED,
            [HTTP_STATUS_CODES.NOT_FOUND]: RBAC_MESSAGES.ACCESS_DENIED,
            [HTTP_STATUS_CODES.CONFLICT]: RBAC_MESSAGES.ROLE_NAME_TAKEN,
        },
    })
    async create(
        @Body() payload: CreateRoleRequestDto,
    ): Promise<ApiSuccessResponse<RoleResponse>> {
        const role = await this.rolesService.create({
            name: payload.name,
            label: payload.label,
            hint: payload.hint,
        });
        return apiSuccess(serializeRole(role), {
            message: RBAC_MESSAGES.ROLE_CREATED,
        });
    }

    @RequirePermission('rbac', 'view')
    @buildEndpoint({
        method: API_METHOD_TYPES.GET,
        path: RBAC_ROUTE_PATHS.ROLE_BY_ID,
        tags: RBAC_TAGS,
        responses: {
            [HTTP_STATUS_CODES.OK]: RBAC_MESSAGES.ROLE_FETCHED,
            [HTTP_STATUS_CODES.NOT_FOUND]: RBAC_MESSAGES.ROLE_NOT_FOUND,
        },
    })
    async get(
        @Param() params: RoleIdParamsDto,
    ): Promise<ApiSuccessResponse<RoleDetailResponse>> {
        const role = await this.rolesService.get({ roleId: params.roleId });
        return apiSuccess(serializeRoleDetail(role), {
            message: RBAC_MESSAGES.ROLE_FETCHED,
        });
    }

    @RequirePermission('rbac', 'update')
    @buildEndpoint({
        method: API_METHOD_TYPES.PATCH,
        path: RBAC_ROUTE_PATHS.ROLE_BY_ID,
        tags: RBAC_TAGS,
        responses: {
            [HTTP_STATUS_CODES.OK]: RBAC_MESSAGES.ROLE_UPDATED,
            [HTTP_STATUS_CODES.NOT_FOUND]: RBAC_MESSAGES.ROLE_NOT_FOUND,
            [HTTP_STATUS_CODES.CONFLICT]: RBAC_MESSAGES.ROLE_NAME_TAKEN,
        },
    })
    async update(
        @Param() params: RoleIdParamsDto,
        @Body() payload: UpdateRoleRequestDto,
    ): Promise<ApiSuccessResponse<RoleResponse>> {
        const role = await this.rolesService.update({
            roleId: params.roleId,
            name: payload.name,
            label: payload.label,
            hint: payload.hint,
        });
        return apiSuccess(serializeRole(role), {
            message: RBAC_MESSAGES.ROLE_UPDATED,
        });
    }

    @RequirePermission('rbac', 'delete')
    @buildEndpoint({
        method: API_METHOD_TYPES.DELETE,
        path: RBAC_ROUTE_PATHS.ROLE_BY_ID,
        tags: RBAC_TAGS,
        responses: {
            [HTTP_STATUS_CODES.OK]: RBAC_MESSAGES.ROLE_DELETED,
            [HTTP_STATUS_CODES.BAD_REQUEST]:
                RBAC_MESSAGES.SYSTEM_ROLE_DELETE_FORBIDDEN,
            [HTTP_STATUS_CODES.NOT_FOUND]: RBAC_MESSAGES.ROLE_NOT_FOUND,
        },
    })
    async remove(
        @Param() params: RoleIdParamsDto,
    ): Promise<ApiSuccessResponse<null>> {
        await this.rolesService.delete({ roleId: params.roleId });
        return apiSuccess(null, { message: RBAC_MESSAGES.ROLE_DELETED });
    }

    @RequirePermission('rbac', 'view')
    @buildEndpoint({
        method: API_METHOD_TYPES.GET,
        path: RBAC_ROUTE_PATHS.ROLE_PERMISSIONS,
        tags: RBAC_TAGS,
        responses: {
            [HTTP_STATUS_CODES.OK]: RBAC_MESSAGES.PERMISSIONS_FETCHED,
            [HTTP_STATUS_CODES.NOT_FOUND]: RBAC_MESSAGES.ROLE_NOT_FOUND,
        },
    })
    async listPermissions(
        @Param() params: RoleIdParamsDto,
    ): Promise<ApiSuccessResponse<PermissionResponse[]>> {
        const permissions = await this.rolesService.listPermissions({
            roleId: params.roleId,
        });
        return apiSuccess(serializePermissions(permissions), {
            message: RBAC_MESSAGES.PERMISSIONS_FETCHED,
        });
    }

    @RequirePermission('rbac', 'update')
    @buildEndpoint({
        method: API_METHOD_TYPES.PUT,
        path: RBAC_ROUTE_PATHS.ROLE_PERMISSIONS,
        tags: RBAC_TAGS,
        responses: {
            [HTTP_STATUS_CODES.OK]: RBAC_MESSAGES.PERMISSIONS_REPLACED,
            [HTTP_STATUS_CODES.BAD_REQUEST]: RBAC_MESSAGES.UNKNOWN_GRANT,
            [HTTP_STATUS_CODES.NOT_FOUND]: RBAC_MESSAGES.ROLE_NOT_FOUND,
        },
    })
    async replacePermissions(
        @Param() params: RoleIdParamsDto,
        @Body() payload: ReplaceGrantListRequestDto,
    ): Promise<ApiSuccessResponse<PermissionResponse[]>> {
        const permissions = await this.rolesService.replacePermissions({
            roleId: params.roleId,
            grants: payload.permissions,
        });
        return apiSuccess(serializePermissions(permissions), {
            message: RBAC_MESSAGES.PERMISSIONS_REPLACED,
        });
    }

    @RequirePermission('rbac', 'update')
    @buildEndpoint({
        method: API_METHOD_TYPES.PUT,
        path: RBAC_ROUTE_PATHS.ROLE_BUNDLES,
        tags: RBAC_TAGS,
        responses: {
            [HTTP_STATUS_CODES.OK]: RBAC_MESSAGES.ROLE_BUNDLES_REPLACED,
            [HTTP_STATUS_CODES.BAD_REQUEST]:
                RBAC_MESSAGES.FULL_ACCESS_GRANTS_FORBIDDEN,
            [HTTP_STATUS_CODES.NOT_FOUND]: RBAC_MESSAGES.ROLE_NOT_FOUND,
        },
    })
    async replaceBundles(
        @Param() params: RoleIdParamsDto,
        @Body() payload: ReplaceRoleBundlesRequestDto,
    ): Promise<ApiSuccessResponse<{ bundle_ids: string[] }>> {
        const bundleIds = await this.rolesService.replaceBundles({
            roleId: params.roleId,
            bundleIds: payload.bundle_ids,
        });
        return apiSuccess(serializeBundleIds(bundleIds), {
            message: RBAC_MESSAGES.ROLE_BUNDLES_REPLACED,
        });
    }
}

export { RolesController };
