import { Body, Controller, Injectable, Req } from '@nestjs/common';
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
    prepareCreateBody,
} from '@vyapti/access-policy';

export const CreateJobInterviewRequestSchema = z.object({
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
});

export class CreateJobInterviewRequestDto extends createZodDto(
    CreateJobInterviewRequestSchema,
) {}

@Injectable()
export class CreateJobInterviewService {
    constructor(private readonly accessPolicy: AccessPolicyFilterService) {}
    async create(
        body: CreateJobInterviewRequestDto,
        access: { userId: string; isSystemAdmin: boolean },
    ) {
        const accessFilter = await this.accessPolicy.resolveFilter({
            userId: access.userId,
            entityName: 'job_interview',
            isSystemAdmin: access.isSystemAdmin,
        });
        const parsed = CreateJobInterviewRequestSchema.parse(body);
        const scoped = prepareCreateBody({
            filter: accessFilter,
            body: parsed,
        });
        return await JobInterview.createOne(scoped);
    }
}

@Controller({
    path: VULCAN_API_CONFIG.path,
    version: VULCAN_API_CONFIG.version,
})
export class CreateJobInterviewController {
    constructor(private readonly service: CreateJobInterviewService) {}

    @RequirePermission('job_interview', 'create')
    @buildEndpoint({
        method: API_METHOD_TYPES.POST,
        path: '/job_interview',
        tags: ['job_interview'],
        responses: {
            [HTTP_STATUS_CODES.CREATED]: 'job_interview created',
            [HTTP_STATUS_CODES.UNAUTHORIZED]: AUTH_MESSAGES.UNAUTHORIZED,
        },
        decorators: AUTH_BEARER_DECORATORS,
    })
    async createJobInterview(
        @Body() body: CreateJobInterviewRequestDto,
        @Req() request: { user?: { id: string; isSystemAdmin?: boolean } },
    ): Promise<ApiSuccessResponse<unknown>> {
        const accessUser = requireRequestUser(request);
        const access = {
            userId: accessUser.id,
            isSystemAdmin: accessUser.isSystemAdmin === true,
        };
        const data = await this.service.create(body, access);
        return apiSuccess(data, {
            message: 'job_interview created',
        });
    }
}
