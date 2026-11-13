import {
    Body,
    Controller,
    Injectable,
    NotFoundException,
    Param,
    Req,
} from '@nestjs/common';
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
    assertUpdateScope,
} from '@vyapti/access-policy';

export const UpdateTeamMemberRequestSchema = z
    .object({
        status: z.string(),
        team: z.string(),
        role: z.string(),
        email: z.string(),
        member_id: z.string(),
        name: z.string(),
    })
    .partial();

export class UpdateTeamMemberRequestDto extends createZodDto(
    UpdateTeamMemberRequestSchema,
) {}

export const TeamMemberIdParamsSchema = z.object({
    id: z.coerce.number().int().positive(),
});

export class TeamMemberIdParamsDto extends createZodDto(
    TeamMemberIdParamsSchema,
) {}

@Injectable()
export class UpdateTeamMemberService {
    constructor(private readonly accessPolicy: AccessPolicyFilterService) {}
    async update(
        id: number,
        body: UpdateTeamMemberRequestDto,
        access: { userId: string; isSystemAdmin: boolean },
    ) {
        const record = await TeamMember.getByPk(id);
        if (!record) {
            throw new NotFoundException('team_member not found');
        }
        await this.accessPolicy.assertRow({
            userId: access.userId,
            entityName: 'team_member',
            isSystemAdmin: access.isSystemAdmin,
            row: record,
        });
        const accessFilter = await this.accessPolicy.resolveFilter({
            userId: access.userId,
            entityName: 'team_member',
            isSystemAdmin: access.isSystemAdmin,
        });
        const parsed = UpdateTeamMemberRequestSchema.parse(body);
        assertUpdateScope({
            filter: accessFilter,
            body: parsed,
        });
        await TeamMember.updateByPk(id, parsed);
        return await TeamMember.getByPk(id);
    }
}

@Controller({
    path: VULCAN_API_CONFIG.path,
    version: VULCAN_API_CONFIG.version,
})
export class UpdateTeamMemberController {
    constructor(private readonly service: UpdateTeamMemberService) {}

    @RequirePermission('team_member', 'update')
    @buildEndpoint({
        method: API_METHOD_TYPES.PATCH,
        path: '/team_member/:id',
        tags: ['team_member'],
        responses: {
            [HTTP_STATUS_CODES.OK]: 'team_member updated',
            [HTTP_STATUS_CODES.NOT_FOUND]: 'team_member not found',
            [HTTP_STATUS_CODES.UNAUTHORIZED]: AUTH_MESSAGES.UNAUTHORIZED,
        },
        decorators: AUTH_BEARER_DECORATORS,
    })
    async updateTeamMember(
        @Param() params: TeamMemberIdParamsDto,
        @Body() body: UpdateTeamMemberRequestDto,
        @Req() request: { user?: { id: string; isSystemAdmin?: boolean } },
    ): Promise<ApiSuccessResponse<unknown>> {
        const accessUser = requireRequestUser(request);
        const access = {
            userId: accessUser.id,
            isSystemAdmin: accessUser.isSystemAdmin === true,
        };
        const data = await this.service.update(params.id, body, access);
        return apiSuccess(data, {
            message: 'team_member updated',
        });
    }
}
