import { Controller, Query, Req } from '@nestjs/common';
import { buildEndpoint } from '@vyapti/core/custom_api';
import {
    apiSuccess,
    buildPaginationMeta,
    type ApiSuccessResponse,
} from '@vyapti/core/custom_api_response';
import { RBAC_ROUTE_PATHS } from '../rbac.config.js';
import {
    API_METHOD_TYPES,
    HTTP_STATUS_CODES,
    RBAC_MESSAGES,
    RBAC_TAGS,
} from '../rbac.constants.js';
import { ListCatalogQueryDto } from '../schema/list-catalog-query.schema.js';
import {
    serializeCatalog,
    type CatalogResourceResponse,
} from '../serializers/rbac.serializer.js';
import { CatalogService } from '../services/catalog.service.js';
import type { RbacRequest } from '../types/rbac.types.js';
import { requireRequestUser } from '../utils/require-request-user.util.js';

@Controller()
class CatalogController {
    constructor(private readonly catalogService: CatalogService) {}

    @buildEndpoint({
        method: API_METHOD_TYPES.GET,
        path: RBAC_ROUTE_PATHS.CATALOG,
        tags: RBAC_TAGS,
        responses: {
            [HTTP_STATUS_CODES.OK]: RBAC_MESSAGES.CATALOG_FETCHED,
            [HTTP_STATUS_CODES.UNAUTHORIZED]: RBAC_MESSAGES.UNAUTHORIZED,
        },
    })
    async list(
        @Req() request: RbacRequest,
        @Query() query: ListCatalogQueryDto,
    ): Promise<ApiSuccessResponse<CatalogResourceResponse[]>> {
        requireRequestUser(request);
        const result = await this.catalogService.list({
            page: query.page,
            limit: query.limit,
            search: query.search ?? null,
            sortOrder: query.sortOrder,
        });
        return apiSuccess(serializeCatalog(result.rows), {
            message: RBAC_MESSAGES.CATALOG_FETCHED,
            meta: buildPaginationMeta(result.page, result.limit, result.total),
        });
    }
}

export { CatalogController };
