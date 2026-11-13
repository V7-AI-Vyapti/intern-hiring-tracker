import { Controller, Injectable, Query, Req } from '@nestjs/common';
import { buildEndpoint } from '@vyapti/core/custom_api';
import {
    apiSuccess,
    type ApiSuccessResponse,
    buildPaginationMeta,
} from '@vyapti/core/custom_api_response';
import { TeamMember } from '@entities/team_member.entity';
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

export const ListTeamMemberQuerySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
    search: z.string().trim().optional().nullable(),
    sortBy: z.enum(['team_member_id', 'status']).default('team_member_id'),
    sortOrder: z.preprocess(
        (value) => (typeof value === 'string' ? value.toUpperCase() : value),
        z.enum(['ASC', 'DESC']).default('DESC'),
    ),
});

export class ListTeamMemberQueryDto extends createZodDto(
    ListTeamMemberQuerySchema,
) {}

const LIST_TEAM_MEMBER_SORT_COLUMNS = {
    team_member_id: 'team_member_id',
    status: 'status',
} as const;

@Injectable()
export class ListTeamMemberService {
    constructor(private readonly accessPolicy: AccessPolicyFilterService) {}
    async list(
        query: ListTeamMemberQueryDto,
        access: { userId: string; isSystemAdmin: boolean },
    ) {
        const pagination = resolvePagination(query);
        const search = normalizeSearch(query.search);
        const where: Record<string, unknown> = {};
        if (search) {
            where.status = ILike(`%${search}%`);
        }
        const accessFilter = await this.accessPolicy.resolveFilter({
            userId: access.userId,
            entityName: 'team_member',
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
            columns: LIST_TEAM_MEMBER_SORT_COLUMNS,
            sortBy: query.sortBy,
            sortOrder: query.sortOrder,
            defaultSortBy: 'team_member_id',
            defaultSortOrder: 'DESC',
        });
        const [rows, total] = await Promise.all([
            TeamMember.filter(where, {
                order,
                skip: pagination.skip,
                take: pagination.take,
            }),
            TeamMember.countOf(where),
        ]);
        return { items: rows, total, pagination };
    }
}

@Controller({
    path: VULCAN_API_CONFIG.path,
    version: VULCAN_API_CONFIG.version,
})
export class ListTeamMemberController {
    constructor(private readonly service: ListTeamMemberService) {}

    @RequirePermission('team_member', 'list')
    @buildEndpoint({
        method: API_METHOD_TYPES.GET,
        path: '/team_member',
        tags: ['team_member'],
        responses: {
            [HTTP_STATUS_CODES.OK]: 'team_member list fetched',
            [HTTP_STATUS_CODES.UNAUTHORIZED]: AUTH_MESSAGES.UNAUTHORIZED,
        },
        decorators: AUTH_BEARER_DECORATORS,
    })
    async listTeamMember(
        @Query() query: ListTeamMemberQueryDto,
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
            message: 'team_member list fetched',
            meta: buildPaginationMeta(pagination.page, pagination.limit, total),
        });
    }
}
