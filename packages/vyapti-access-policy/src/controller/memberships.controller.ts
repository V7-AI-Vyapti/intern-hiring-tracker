import { Body, Controller, Param, Query } from '@nestjs/common';
import { buildEndpoint } from '@vyapti/core/custom_api';
import {
    apiSuccess,
    buildPaginationMeta,
    type ApiSuccessResponse,
} from '@vyapti/core/custom_api_response';
import { RequirePermission } from '@vyapti/rbac';
import { ACCESS_POLICY_ROUTE_PATHS } from '../access-policy.config.js';
import {
    ACCESS_POLICY_MESSAGES,
    ACCESS_POLICY_RESOURCE,
    ACCESS_POLICY_TAGS,
    API_METHOD_TYPES,
    HTTP_STATUS_CODES,
} from '../access-policy.constants.js';
import { MembershipIdParamsDto } from '../schema/id-params.schema.js';
import {
    CreateMembershipRequestDto,
    CreateMembershipsRequestDto,
} from '../schema/membership.schema.js';
import { ListMembershipsQueryDto } from '../schema/page-query.schema.js';
import {
    serializeMembership,
    serializeMemberships,
    type MembershipResponse,
} from '../serializers/access-policy.serializer.js';
import { MembershipsService } from '../services/memberships.service.js';

@Controller()
class MembershipsController {
    constructor(private readonly membershipsService: MembershipsService) {}

    @RequirePermission(ACCESS_POLICY_RESOURCE, 'list')
    @buildEndpoint({
        method: API_METHOD_TYPES.GET,
        path: ACCESS_POLICY_ROUTE_PATHS.MEMBERSHIPS,
        tags: ACCESS_POLICY_TAGS,
        responses: {
            [HTTP_STATUS_CODES.OK]: ACCESS_POLICY_MESSAGES.MEMBERSHIPS_FETCHED,
            [HTTP_STATUS_CODES.NOT_FOUND]: ACCESS_POLICY_MESSAGES.ROW_NOT_FOUND,
        },
    })
    async list(
        @Query() query: ListMembershipsQueryDto,
    ): Promise<ApiSuccessResponse<MembershipResponse[]>> {
        const result = await this.membershipsService.list({
            page: query.page,
            limit: query.limit,
            search: query.search ?? null,
            userId: query.user_id ?? null,
            scopeKey: query.scope_key ?? null,
            sortBy: query.sortBy,
            sortOrder: query.sortOrder,
        });
        return apiSuccess(serializeMemberships(result.rows), {
            message: ACCESS_POLICY_MESSAGES.MEMBERSHIPS_FETCHED,
            meta: buildPaginationMeta(result.page, result.limit, result.total),
        });
    }

    @RequirePermission(ACCESS_POLICY_RESOURCE, 'create')
    @buildEndpoint({
        method: API_METHOD_TYPES.POST,
        path: ACCESS_POLICY_ROUTE_PATHS.MEMBERSHIPS,
        tags: ACCESS_POLICY_TAGS,
        responses: {
            [HTTP_STATUS_CODES.CREATED]:
                ACCESS_POLICY_MESSAGES.MEMBERSHIP_CREATED,
            [HTTP_STATUS_CODES.CONFLICT]:
                ACCESS_POLICY_MESSAGES.MEMBERSHIP_TAKEN,
            [HTTP_STATUS_CODES.NOT_FOUND]: ACCESS_POLICY_MESSAGES.ROW_NOT_FOUND,
        },
    })
    async create(
        @Body() payload: CreateMembershipRequestDto,
    ): Promise<ApiSuccessResponse<MembershipResponse>> {
        const membership = await this.membershipsService.create({
            userId: payload.user_id,
            scopeKey: payload.scope_key,
            scopeId: payload.scope_id,
        });
        return apiSuccess(serializeMembership(membership), {
            message: ACCESS_POLICY_MESSAGES.MEMBERSHIP_CREATED,
        });
    }

    @RequirePermission(ACCESS_POLICY_RESOURCE, 'create')
    @buildEndpoint({
        method: API_METHOD_TYPES.POST,
        path: ACCESS_POLICY_ROUTE_PATHS.MEMBERSHIPS_BULK,
        tags: ACCESS_POLICY_TAGS,
        responses: {
            [HTTP_STATUS_CODES.CREATED]:
                ACCESS_POLICY_MESSAGES.MEMBERSHIPS_CREATED,
            [HTTP_STATUS_CODES.BAD_REQUEST]:
                ACCESS_POLICY_MESSAGES.DUPLICATE_SCOPE_IDS,
            [HTTP_STATUS_CODES.CONFLICT]:
                ACCESS_POLICY_MESSAGES.MEMBERSHIP_TAKEN,
            [HTTP_STATUS_CODES.NOT_FOUND]: ACCESS_POLICY_MESSAGES.ROW_NOT_FOUND,
        },
    })
    async createMany(
        @Body() payload: CreateMembershipsRequestDto,
    ): Promise<ApiSuccessResponse<MembershipResponse[]>> {
        const memberships = await this.membershipsService.createMany({
            userId: payload.user_id,
            scopeKey: payload.scope_key,
            scopeIds: payload.scope_ids,
        });
        return apiSuccess(serializeMemberships(memberships), {
            message: ACCESS_POLICY_MESSAGES.MEMBERSHIPS_CREATED,
        });
    }

    @RequirePermission(ACCESS_POLICY_RESOURCE, 'delete')
    @buildEndpoint({
        method: API_METHOD_TYPES.DELETE,
        path: ACCESS_POLICY_ROUTE_PATHS.MEMBERSHIP_BY_ID,
        tags: ACCESS_POLICY_TAGS,
        responses: {
            [HTTP_STATUS_CODES.OK]: ACCESS_POLICY_MESSAGES.MEMBERSHIP_DELETED,
            [HTTP_STATUS_CODES.NOT_FOUND]:
                ACCESS_POLICY_MESSAGES.MEMBERSHIP_NOT_FOUND,
        },
    })
    async remove(
        @Param() params: MembershipIdParamsDto,
    ): Promise<ApiSuccessResponse<null>> {
        await this.membershipsService.delete({
            membershipId: params.membershipId,
        });
        return apiSuccess(null, {
            message: ACCESS_POLICY_MESSAGES.MEMBERSHIP_DELETED,
        });
    }
}

export { MembershipsController };
