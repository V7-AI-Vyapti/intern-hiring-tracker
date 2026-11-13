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
import { PolicyIdParamsDto } from '../schema/id-params.schema.js';
import { ListPoliciesQueryDto } from '../schema/page-query.schema.js';
import {
    CreatePolicyRequestDto,
    UpdatePolicyRequestDto,
} from '../schema/policy.schema.js';
import {
    serializePolicies,
    serializePolicy,
    type PolicyResponse,
} from '../serializers/access-policy.serializer.js';
import { PoliciesService } from '../services/policies.service.js';

@Controller()
class PoliciesController {
    constructor(private readonly policiesService: PoliciesService) {}

    @RequirePermission(ACCESS_POLICY_RESOURCE, 'list')
    @buildEndpoint({
        method: API_METHOD_TYPES.GET,
        path: ACCESS_POLICY_ROUTE_PATHS.POLICIES,
        tags: ACCESS_POLICY_TAGS,
        responses: {
            [HTTP_STATUS_CODES.OK]: ACCESS_POLICY_MESSAGES.POLICIES_FETCHED,
            [HTTP_STATUS_CODES.NOT_FOUND]: ACCESS_POLICY_MESSAGES.ROW_NOT_FOUND,
        },
    })
    async list(
        @Query() query: ListPoliciesQueryDto,
    ): Promise<ApiSuccessResponse<PolicyResponse[]>> {
        const result = await this.policiesService.list({
            page: query.page,
            limit: query.limit,
            search: query.search ?? null,
            sortBy: query.sortBy,
            sortOrder: query.sortOrder,
        });
        return apiSuccess(serializePolicies(result.rows), {
            message: ACCESS_POLICY_MESSAGES.POLICIES_FETCHED,
            meta: buildPaginationMeta(result.page, result.limit, result.total),
        });
    }

    @RequirePermission(ACCESS_POLICY_RESOURCE, 'create')
    @buildEndpoint({
        method: API_METHOD_TYPES.POST,
        path: ACCESS_POLICY_ROUTE_PATHS.POLICIES,
        tags: ACCESS_POLICY_TAGS,
        responses: {
            [HTTP_STATUS_CODES.CREATED]: ACCESS_POLICY_MESSAGES.POLICY_CREATED,
            [HTTP_STATUS_CODES.BAD_REQUEST]:
                ACCESS_POLICY_MESSAGES.FILTER_FIELDS_REQUIRED,
            [HTTP_STATUS_CODES.CONFLICT]:
                ACCESS_POLICY_MESSAGES.POLICY_ENTITY_TAKEN,
            [HTTP_STATUS_CODES.NOT_FOUND]: ACCESS_POLICY_MESSAGES.ROW_NOT_FOUND,
        },
    })
    async create(
        @Body() payload: CreatePolicyRequestDto,
    ): Promise<ApiSuccessResponse<PolicyResponse>> {
        const policy = await this.policiesService.create({
            entityName: payload.entity_name,
            mode: payload.mode,
            constraintField: payload.constraint_field,
            scopeKey: payload.scope_key,
        });
        return apiSuccess(serializePolicy(policy), {
            message: ACCESS_POLICY_MESSAGES.POLICY_CREATED,
        });
    }

    @RequirePermission(ACCESS_POLICY_RESOURCE, 'view')
    @buildEndpoint({
        method: API_METHOD_TYPES.GET,
        path: ACCESS_POLICY_ROUTE_PATHS.POLICY_BY_ID,
        tags: ACCESS_POLICY_TAGS,
        responses: {
            [HTTP_STATUS_CODES.OK]: ACCESS_POLICY_MESSAGES.POLICY_FETCHED,
            [HTTP_STATUS_CODES.NOT_FOUND]:
                ACCESS_POLICY_MESSAGES.POLICY_NOT_FOUND,
        },
    })
    async get(
        @Param() params: PolicyIdParamsDto,
    ): Promise<ApiSuccessResponse<PolicyResponse>> {
        const policy = await this.policiesService.get({
            policyId: params.policyId,
        });
        return apiSuccess(serializePolicy(policy), {
            message: ACCESS_POLICY_MESSAGES.POLICY_FETCHED,
        });
    }

    @RequirePermission(ACCESS_POLICY_RESOURCE, 'update')
    @buildEndpoint({
        method: API_METHOD_TYPES.PATCH,
        path: ACCESS_POLICY_ROUTE_PATHS.POLICY_BY_ID,
        tags: ACCESS_POLICY_TAGS,
        responses: {
            [HTTP_STATUS_CODES.OK]: ACCESS_POLICY_MESSAGES.POLICY_UPDATED,
            [HTTP_STATUS_CODES.BAD_REQUEST]:
                ACCESS_POLICY_MESSAGES.FILTER_FIELDS_REQUIRED,
            [HTTP_STATUS_CODES.NOT_FOUND]:
                ACCESS_POLICY_MESSAGES.POLICY_NOT_FOUND,
        },
    })
    async update(
        @Param() params: PolicyIdParamsDto,
        @Body() payload: UpdatePolicyRequestDto,
    ): Promise<ApiSuccessResponse<PolicyResponse>> {
        const policy = await this.policiesService.update({
            policyId: params.policyId,
            mode: payload.mode,
            constraintField: payload.constraint_field,
            scopeKey: payload.scope_key,
        });
        return apiSuccess(serializePolicy(policy), {
            message: ACCESS_POLICY_MESSAGES.POLICY_UPDATED,
        });
    }

    @RequirePermission(ACCESS_POLICY_RESOURCE, 'delete')
    @buildEndpoint({
        method: API_METHOD_TYPES.DELETE,
        path: ACCESS_POLICY_ROUTE_PATHS.POLICY_BY_ID,
        tags: ACCESS_POLICY_TAGS,
        responses: {
            [HTTP_STATUS_CODES.OK]: ACCESS_POLICY_MESSAGES.POLICY_DELETED,
            [HTTP_STATUS_CODES.NOT_FOUND]:
                ACCESS_POLICY_MESSAGES.POLICY_NOT_FOUND,
        },
    })
    async remove(
        @Param() params: PolicyIdParamsDto,
    ): Promise<ApiSuccessResponse<null>> {
        await this.policiesService.delete({ policyId: params.policyId });
        return apiSuccess(null, {
            message: ACCESS_POLICY_MESSAGES.POLICY_DELETED,
        });
    }
}

export { PoliciesController };
