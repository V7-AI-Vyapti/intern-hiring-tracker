import { Controller, Injectable, Query, Req } from '@nestjs/common';
import { buildEndpoint } from '@vyapti/core/custom_api';
import {
    apiSuccess,
    type ApiSuccessResponse,
    buildPaginationMeta,
} from '@vyapti/core/custom_api_response';
import { JobOpening } from '@entities/job_opening.entity';
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

export const ListJobOpeningQuerySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
    search: z.string().trim().optional().nullable(),
    sortBy: z
        .enum(['job_opening_id', 'assessment_name'])
        .default('job_opening_id'),
    sortOrder: z.preprocess(
        (value) => (typeof value === 'string' ? value.toUpperCase() : value),
        z.enum(['ASC', 'DESC']).default('DESC'),
    ),
    owner: z.coerce.number().int().positive().optional(),
});

export class ListJobOpeningQueryDto extends createZodDto(
    ListJobOpeningQuerySchema,
) {}

const LIST_JOB_OPENING_SORT_COLUMNS = {
    job_opening_id: 'job_opening_id',
    assessment_name: 'assessment_name',
} as const;

@Injectable()
export class ListJobOpeningService {
    constructor(private readonly accessPolicy: AccessPolicyFilterService) {}
    async list(
        query: ListJobOpeningQueryDto,
        access: { userId: string; isSystemAdmin: boolean },
    ) {
        const pagination = resolvePagination(query);
        const search = normalizeSearch(query.search);
        const where: Record<string, unknown> = {};
        if (search) {
            where.assessment_name = ILike(`%${search}%`);
        }
        if (query.owner != null) {
            where.owner = query.owner;
        }
        const accessFilter = await this.accessPolicy.resolveFilter({
            userId: access.userId,
            entityName: 'job_opening',
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
            columns: LIST_JOB_OPENING_SORT_COLUMNS,
            sortBy: query.sortBy,
            sortOrder: query.sortOrder,
            defaultSortBy: 'job_opening_id',
            defaultSortOrder: 'DESC',
        });
        const [rows, total] = await Promise.all([
            JobOpening.filter(where, {
                order,
                skip: pagination.skip,
                take: pagination.take,
            }),
            JobOpening.countOf(where),
        ]);
        return { items: rows, total, pagination };
    }
}

@Controller({
    path: VULCAN_API_CONFIG.path,
    version: VULCAN_API_CONFIG.version,
})
export class ListJobOpeningController {
    constructor(private readonly service: ListJobOpeningService) {}

    @RequirePermission('job_opening', 'list')
    @buildEndpoint({
        method: API_METHOD_TYPES.GET,
        path: '/job_opening',
        tags: ['job_opening'],
        responses: {
            [HTTP_STATUS_CODES.OK]: 'job_opening list fetched',
            [HTTP_STATUS_CODES.UNAUTHORIZED]: AUTH_MESSAGES.UNAUTHORIZED,
        },
        decorators: AUTH_BEARER_DECORATORS,
    })
    async listJobOpening(
        @Query() query: ListJobOpeningQueryDto,
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
            message: 'job_opening list fetched',
            meta: buildPaginationMeta(pagination.page, pagination.limit, total),
        });
    }
}
