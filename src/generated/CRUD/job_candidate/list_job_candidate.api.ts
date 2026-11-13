import { Controller, Injectable, Query, Req } from '@nestjs/common';
import { buildEndpoint } from '@vyapti/core/custom_api';
import {
    apiSuccess,
    type ApiSuccessResponse,
    buildPaginationMeta,
} from '@vyapti/core/custom_api_response';
import { JobCandidate } from '@entities/job_candidate.entity';
import { API_METHOD_TYPES, HTTP_STATUS_CODES } from '@vulcan/shared/constants';
import { VULCAN_API_CONFIG } from '@vulcan/vulcan.config';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { ILike, In } from 'typeorm';
import {
    buildAllowedOrder,
    normalizeSearch,
    resolvePagination,
} from '@vulcan/shared/utils/list-query';
import { AUTH_BEARER_DECORATORS, AUTH_MESSAGES } from '@vyapti/auth';
import { RequirePermission } from '@vyapti/rbac';
import {
    AccessPolicyFilterService,
    requireRequestUser,
    applyAccessFilter,
} from '@vyapti/access-policy';

export const ListJobCandidateQuerySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
    search: z.string().trim().optional().nullable(),
    sortBy: z.enum(['job_candidate_id', 'name']).default('job_candidate_id'),
    sortOrder: z.preprocess(
        (value) => (typeof value === 'string' ? value.toUpperCase() : value),
        z.enum(['ASC', 'DESC']).default('DESC'),
    ),
    opening: z.coerce.number().int().positive().optional(),
});

export class ListJobCandidateQueryDto extends createZodDto(
    ListJobCandidateQuerySchema,
) {}

const LIST_JOB_CANDIDATE_SORT_COLUMNS = {
    job_candidate_id: 'job_candidate_id',
    name: 'name',
} as const;

@Injectable()
export class ListJobCandidateService {
    constructor(private readonly accessPolicy: AccessPolicyFilterService) {}
    async list(
        query: ListJobCandidateQueryDto,
        access: { userId: string; isSystemAdmin: boolean },
    ) {
        const pagination = resolvePagination(query);
        const search = normalizeSearch(query.search);
        const where: Record<string, unknown> = {};
        if (search) {
            where.name = ILike(`%${search}%`);
        }
        if (query.opening != null) {
            where.opening = query.opening;
        }
        const accessFilter = await this.accessPolicy.resolveFilter({
            userId: access.userId,
            entityName: 'job_candidate',
            isSystemAdmin: access.isSystemAdmin,
        });
        const accessClause = applyAccessFilter(accessFilter);
        if (accessClause.kind === 'empty') {
            return { items: [], total: 0, pagination };
        }
        if (accessClause.kind === 'in') {
            where[accessClause.field] = In(accessClause.values);
        }
        const order = buildAllowedOrder({
            columns: LIST_JOB_CANDIDATE_SORT_COLUMNS,
            sortBy: query.sortBy,
            sortOrder: query.sortOrder,
            defaultSortBy: 'job_candidate_id',
            defaultSortOrder: 'DESC',
        });
        const [rows, total] = await Promise.all([
            JobCandidate.filter(where, {
                order,
                skip: pagination.skip,
                take: pagination.take,
            }),
            JobCandidate.countOf(where),
        ]);
        return { items: rows, total, pagination };
    }
}

@Controller({
    path: VULCAN_API_CONFIG.path,
    version: VULCAN_API_CONFIG.version,
})
export class ListJobCandidateController {
    constructor(private readonly service: ListJobCandidateService) {}

    @RequirePermission('job_candidate', 'list')
    @buildEndpoint({
        method: API_METHOD_TYPES.GET,
        path: '/job_candidate',
        tags: ['job_candidate'],
        responses: {
            [HTTP_STATUS_CODES.OK]: 'job_candidate list fetched',
            [HTTP_STATUS_CODES.UNAUTHORIZED]: AUTH_MESSAGES.UNAUTHORIZED,
        },
        decorators: AUTH_BEARER_DECORATORS,
    })
    async listJobCandidate(
        @Query() query: ListJobCandidateQueryDto,
        @Req() request: { user?: { id: string; isSystemAdmin?: boolean } },
    ): Promise<ApiSuccessResponse<unknown>> {
        const accessUser = requireRequestUser(request);
        const access = {
            userId: accessUser.id,
            isSystemAdmin: accessUser.isSystemAdmin === true,
        };
        const { items, total, pagination } = await this.service.list(
            query,
            access,
        );
        return apiSuccess(items, {
            message: 'job_candidate list fetched',
            meta: buildPaginationMeta(pagination.page, pagination.limit, total),
        });
    }
}
