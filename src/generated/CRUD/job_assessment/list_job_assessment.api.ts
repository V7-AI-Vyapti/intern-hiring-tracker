import { Controller, Injectable, Query, Req } from '@nestjs/common';
import { buildEndpoint } from '@vyapti/core/custom_api';
import {
    apiSuccess,
    type ApiSuccessResponse,
    buildPaginationMeta,
} from '@vyapti/core/custom_api_response';
import { JobAssessment } from '@entities/job_assessment.entity';
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

export const ListJobAssessmentQuerySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
    search: z.string().trim().optional().nullable(),
    sortBy: z
        .enum(['job_assessment_id', 'assessment_id'])
        .default('job_assessment_id'),
    sortOrder: z.preprocess(
        (value) => (typeof value === 'string' ? value.toUpperCase() : value),
        z.enum(['ASC', 'DESC']).default('DESC'),
    ),
    candidate: z.coerce.number().int().positive().optional(),
    reviewer: z.coerce.number().int().positive().optional(),
});

export class ListJobAssessmentQueryDto extends createZodDto(
    ListJobAssessmentQuerySchema,
) {}

const LIST_JOB_ASSESSMENT_SORT_COLUMNS = {
    job_assessment_id: 'job_assessment_id',
    assessment_id: 'assessment_id',
} as const;

@Injectable()
export class ListJobAssessmentService {
    constructor(private readonly accessPolicy: AccessPolicyFilterService) {}
    async list(
        query: ListJobAssessmentQueryDto,
        access: { userId: string; isSystemAdmin: boolean },
    ) {
        const pagination = resolvePagination(query);
        const search = normalizeSearch(query.search);
        const where: Record<string, unknown> = {};
        if (search) {
            where.assessment_id = ILike(`%${search}%`);
        }
        if (query.candidate != null) {
            where.candidate = query.candidate;
        }
        if (query.reviewer != null) {
            where.reviewer = query.reviewer;
        }
        const accessFilter = await this.accessPolicy.resolveFilter({
            userId: access.userId,
            entityName: 'job_assessment',
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
            columns: LIST_JOB_ASSESSMENT_SORT_COLUMNS,
            sortBy: query.sortBy,
            sortOrder: query.sortOrder,
            defaultSortBy: 'job_assessment_id',
            defaultSortOrder: 'DESC',
        });
        const [rows, total] = await Promise.all([
            JobAssessment.filter(where, {
                order,
                skip: pagination.skip,
                take: pagination.take,
            }),
            JobAssessment.countOf(where),
        ]);
        return { items: rows, total, pagination };
    }
}

@Controller({
    path: VULCAN_API_CONFIG.path,
    version: VULCAN_API_CONFIG.version,
})
export class ListJobAssessmentController {
    constructor(private readonly service: ListJobAssessmentService) {}

    @RequirePermission('job_assessment', 'list')
    @buildEndpoint({
        method: API_METHOD_TYPES.GET,
        path: '/job_assessment',
        tags: ['job_assessment'],
        responses: {
            [HTTP_STATUS_CODES.OK]: 'job_assessment list fetched',
            [HTTP_STATUS_CODES.UNAUTHORIZED]: AUTH_MESSAGES.UNAUTHORIZED,
        },
        decorators: AUTH_BEARER_DECORATORS,
    })
    async listJobAssessment(
        @Query() query: ListJobAssessmentQueryDto,
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
            message: 'job_assessment list fetched',
            meta: buildPaginationMeta(pagination.page, pagination.limit, total),
        });
    }
}
