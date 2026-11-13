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
import { BundleIdParamsDto } from '../schema/bundle-id-params.schema.js';
import {
    CreateBundleRequestDto,
    UpdateBundleRequestDto,
} from '../schema/bundle.schema.js';
import { ListBundlesQueryDto } from '../schema/list-bundles-query.schema.js';
import { ReplaceGrantListRequestDto } from '../schema/replace-permissions.schema.js';
import {
    serializeBundle,
    serializeBundleDetail,
    serializeBundles,
    serializeGrants,
    type BundleDetailResponse,
    type BundleResponse,
    type GrantResponse,
} from '../serializers/rbac.serializer.js';
import { BundlesService } from '../services/bundles.service.js';

@Controller()
class BundlesController {
    constructor(private readonly bundlesService: BundlesService) {}

    @RequirePermission('rbac', 'list')
    @buildEndpoint({
        method: API_METHOD_TYPES.GET,
        path: RBAC_ROUTE_PATHS.BUNDLES,
        tags: RBAC_TAGS,
        responses: {
            [HTTP_STATUS_CODES.OK]: RBAC_MESSAGES.BUNDLES_FETCHED,
            [HTTP_STATUS_CODES.NOT_FOUND]: RBAC_MESSAGES.ACCESS_DENIED,
        },
    })
    async list(
        @Query() query: ListBundlesQueryDto,
    ): Promise<ApiSuccessResponse<BundleResponse[]>> {
        const result = await this.bundlesService.list({
            page: query.page,
            limit: query.limit,
            search: query.search ?? null,
            sortBy: query.sortBy,
            sortOrder: query.sortOrder,
        });
        return apiSuccess(serializeBundles(result.rows), {
            message: RBAC_MESSAGES.BUNDLES_FETCHED,
            meta: buildPaginationMeta(result.page, result.limit, result.total),
        });
    }

    @RequirePermission('rbac', 'create')
    @buildEndpoint({
        method: API_METHOD_TYPES.POST,
        path: RBAC_ROUTE_PATHS.BUNDLES,
        tags: RBAC_TAGS,
        responses: {
            [HTTP_STATUS_CODES.CREATED]: RBAC_MESSAGES.BUNDLE_CREATED,
            [HTTP_STATUS_CODES.NOT_FOUND]: RBAC_MESSAGES.ACCESS_DENIED,
            [HTTP_STATUS_CODES.CONFLICT]: RBAC_MESSAGES.BUNDLE_NAME_TAKEN,
        },
    })
    async create(
        @Body() payload: CreateBundleRequestDto,
    ): Promise<ApiSuccessResponse<BundleResponse>> {
        const bundle = await this.bundlesService.create({
            name: payload.name,
            label: payload.label,
            hint: payload.hint,
        });
        return apiSuccess(serializeBundle(bundle), {
            message: RBAC_MESSAGES.BUNDLE_CREATED,
        });
    }

    @RequirePermission('rbac', 'view')
    @buildEndpoint({
        method: API_METHOD_TYPES.GET,
        path: RBAC_ROUTE_PATHS.BUNDLE_BY_ID,
        tags: RBAC_TAGS,
        responses: {
            [HTTP_STATUS_CODES.OK]: RBAC_MESSAGES.BUNDLE_FETCHED,
            [HTTP_STATUS_CODES.NOT_FOUND]: RBAC_MESSAGES.BUNDLE_NOT_FOUND,
        },
    })
    async get(
        @Param() params: BundleIdParamsDto,
    ): Promise<ApiSuccessResponse<BundleDetailResponse>> {
        const bundle = await this.bundlesService.get({
            bundleId: params.bundleId,
        });
        return apiSuccess(serializeBundleDetail(bundle), {
            message: RBAC_MESSAGES.BUNDLE_FETCHED,
        });
    }

    @RequirePermission('rbac', 'update')
    @buildEndpoint({
        method: API_METHOD_TYPES.PATCH,
        path: RBAC_ROUTE_PATHS.BUNDLE_BY_ID,
        tags: RBAC_TAGS,
        responses: {
            [HTTP_STATUS_CODES.OK]: RBAC_MESSAGES.BUNDLE_UPDATED,
            [HTTP_STATUS_CODES.NOT_FOUND]: RBAC_MESSAGES.BUNDLE_NOT_FOUND,
        },
    })
    async update(
        @Param() params: BundleIdParamsDto,
        @Body() payload: UpdateBundleRequestDto,
    ): Promise<ApiSuccessResponse<BundleResponse>> {
        const bundle = await this.bundlesService.update({
            bundleId: params.bundleId,
            label: payload.label,
            hint: payload.hint,
        });
        return apiSuccess(serializeBundle(bundle), {
            message: RBAC_MESSAGES.BUNDLE_UPDATED,
        });
    }

    @RequirePermission('rbac', 'delete')
    @buildEndpoint({
        method: API_METHOD_TYPES.DELETE,
        path: RBAC_ROUTE_PATHS.BUNDLE_BY_ID,
        tags: RBAC_TAGS,
        responses: {
            [HTTP_STATUS_CODES.OK]: RBAC_MESSAGES.BUNDLE_DELETED,
            [HTTP_STATUS_CODES.BAD_REQUEST]:
                RBAC_MESSAGES.SYSTEM_BUNDLE_DELETE_FORBIDDEN,
            [HTTP_STATUS_CODES.NOT_FOUND]: RBAC_MESSAGES.BUNDLE_NOT_FOUND,
        },
    })
    async remove(
        @Param() params: BundleIdParamsDto,
    ): Promise<ApiSuccessResponse<null>> {
        await this.bundlesService.delete({ bundleId: params.bundleId });
        return apiSuccess(null, { message: RBAC_MESSAGES.BUNDLE_DELETED });
    }

    @RequirePermission('rbac', 'update')
    @buildEndpoint({
        method: API_METHOD_TYPES.PUT,
        path: RBAC_ROUTE_PATHS.BUNDLE_PERMISSIONS,
        tags: RBAC_TAGS,
        responses: {
            [HTTP_STATUS_CODES.OK]: RBAC_MESSAGES.BUNDLE_PERMISSIONS_REPLACED,
            [HTTP_STATUS_CODES.BAD_REQUEST]: RBAC_MESSAGES.UNKNOWN_GRANT,
            [HTTP_STATUS_CODES.NOT_FOUND]: RBAC_MESSAGES.BUNDLE_NOT_FOUND,
        },
    })
    async replaceGrants(
        @Param() params: BundleIdParamsDto,
        @Body() payload: ReplaceGrantListRequestDto,
    ): Promise<ApiSuccessResponse<GrantResponse[]>> {
        const grants = await this.bundlesService.replaceGrants({
            bundleId: params.bundleId,
            grants: payload.permissions,
        });
        return apiSuccess(serializeGrants(grants), {
            message: RBAC_MESSAGES.BUNDLE_PERMISSIONS_REPLACED,
        });
    }
}

export { BundlesController };
