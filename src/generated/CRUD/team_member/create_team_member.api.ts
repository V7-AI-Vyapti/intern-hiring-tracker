import { Body, Controller, Injectable, Req } from '@nestjs/common';
import { buildEndpoint } from '@vyapti/core/custom_api';
import {
    apiSuccess,
    type ApiSuccessResponse,
} from '@vyapti/core/custom_api_response';
import { TeamMember } from '@entities/team_member.entity';
import { API_METHOD_TYPES, HTTP_STATUS_CODES } from '@vulcan/shared/constants';
import { VULCAN_API_CONFIG } from '@vulcan/vulcan.config';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { AUTH_BEARER_DECORATORS, AUTH_MESSAGES } from '@vyapti/auth';
import { RequirePermission } from '@vyapti/rbac';
import {
    AccessPolicyFilterService,
    requireRequestUser,
    prepareCreateBody,
} from '@vyapti/access-policy';

export const CreateTeamMemberRequestSchema = z.object({
    status: z.string(),
    team: z.string(),
    role: z.string(),
    email: z.string(),
    member_id: z.string(),
    name: z.string(),
});

export class CreateTeamMemberRequestDto extends createZodDto(
    CreateTeamMemberRequestSchema,
) {}

@Injectable()
export class CreateTeamMemberService {
    constructor(private readonly accessPolicy: AccessPolicyFilterService) {}
    async create(
        body: CreateTeamMemberRequestDto,
        access: { userId: string; isSystemAdmin: boolean },
    ) {
        const accessFilter = await this.accessPolicy.resolveFilter({
            userId: access.userId,
            entityName: 'team_member',
            isSystemAdmin: access.isSystemAdmin,
        });
        const parsed = CreateTeamMemberRequestSchema.parse(body);
        const scoped = prepareCreateBody({
            filter: accessFilter,
            body: parsed,
        });
        return await TeamMember.createOne(scoped);
    }
}

@Controller({
    path: VULCAN_API_CONFIG.path,
    version: VULCAN_API_CONFIG.version,
})
export class CreateTeamMemberController {
    constructor(private readonly service: CreateTeamMemberService) {}

    @RequirePermission('team_member', 'create')
    @buildEndpoint({
        method: API_METHOD_TYPES.POST,
        path: '/team_member',
        tags: ['team_member'],
        responses: {
            [HTTP_STATUS_CODES.CREATED]: 'team_member created',
            [HTTP_STATUS_CODES.UNAUTHORIZED]: AUTH_MESSAGES.UNAUTHORIZED,
        },
        decorators: AUTH_BEARER_DECORATORS,
    })
    async createTeamMember(
        @Body() body: CreateTeamMemberRequestDto,
        @Req() request: { user?: { id: string; isSystemAdmin?: boolean } },
    ): Promise<ApiSuccessResponse<unknown>> {
        const accessUser = requireRequestUser(request);
        const access = {
            userId: accessUser.id,
            isSystemAdmin: accessUser.isSystemAdmin === true,
        };
        const data = await this.service.create(body, access);
        return apiSuccess(data, {
            message: 'team_member created',
        });
    }
}
