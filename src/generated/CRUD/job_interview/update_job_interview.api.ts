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
import { JobInterview } from '@entities/job_interview.entity';
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

export const UpdateJobInterviewRequestSchema = z
    .object({
        status: z.string(),
        candidate: z.number().int().positive(),
        interview_id: z.string(),
        round: z.number().int(),
        interviewer: z.number().int().positive(),
        scheduled_at: z.string(),
        mode: z.string(),
        rating: z.number().int(),
        recommendation: z.string(),
        feedback: z.string(),
        feedback_on: z.string(),
    })
    .partial();

export class UpdateJobInterviewRequestDto extends createZodDto(
    UpdateJobInterviewRequestSchema,
) {}

export const JobInterviewIdParamsSchema = z.object({
    id: z.coerce.number().int().positive(),
});

export class JobInterviewIdParamsDto extends createZodDto(
    JobInterviewIdParamsSchema,
) {}

@Injectable()
export class UpdateJobInterviewService {
    constructor(private readonly accessPolicy: AccessPolicyFilterService) {}
    async update(
        id: number,
        body: UpdateJobInterviewRequestDto,
        access: { userId: string; isSystemAdmin: boolean },
    ) {
        const record = await JobInterview.getByPk(id);
        if (!record) {
            throw new NotFoundException('job_interview not found');
        }
        await this.accessPolicy.assertRow({
            userId: access.userId,
            entityName: 'job_interview',
            isSystemAdmin: access.isSystemAdmin,
            row: record,
        });
        const accessFilter = await this.accessPolicy.resolveFilter({
            userId: access.userId,
            entityName: 'job_interview',
            isSystemAdmin: access.isSystemAdmin,
        });
        const parsed = UpdateJobInterviewRequestSchema.parse(body);
        assertUpdateScope({
            filter: accessFilter,
            body: parsed,
        });
        await JobInterview.updateByPk(id, parsed);
        return await JobInterview.getByPk(id);
    }
}

@Controller({
    path: VULCAN_API_CONFIG.path,
    version: VULCAN_API_CONFIG.version,
})
export class UpdateJobInterviewController {
    constructor(private readonly service: UpdateJobInterviewService) {}

    @RequirePermission('job_interview', 'update')
    @buildEndpoint({
        method: API_METHOD_TYPES.PATCH,
        path: '/job_interview/:id',
        tags: ['job_interview'],
        responses: {
            [HTTP_STATUS_CODES.OK]: 'job_interview updated',
            [HTTP_STATUS_CODES.NOT_FOUND]: 'job_interview not found',
            [HTTP_STATUS_CODES.UNAUTHORIZED]: AUTH_MESSAGES.UNAUTHORIZED,
        },
        decorators: AUTH_BEARER_DECORATORS,
    })
    async updateJobInterview(
        @Param() params: JobInterviewIdParamsDto,
        @Body() body: UpdateJobInterviewRequestDto,
        @Req() request: { user?: { id: string; isSystemAdmin?: boolean } },
    ): Promise<ApiSuccessResponse<unknown>> {
        const accessUser = requireRequestUser(request);
        const access = {
            userId: accessUser.id,
            isSystemAdmin: accessUser.isSystemAdmin === true,
        };
        const data = await this.service.update(params.id, body, access);
        return apiSuccess(data, {
            message: 'job_interview updated',
        });
    }
}
