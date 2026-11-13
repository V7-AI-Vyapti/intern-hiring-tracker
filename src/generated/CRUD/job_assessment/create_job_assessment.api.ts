import { Body, Controller, Injectable, Req } from '@nestjs/common';
import { buildEndpoint } from '@vyapti/core/custom_api';
import {
    apiSuccess,
    type ApiSuccessResponse,
} from '@vyapti/core/custom_api_response';
import { JobAssessment } from '@entities/job_assessment.entity';
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

export const CreateJobAssessmentRequestSchema = z.object({
    assessment_id: z.string(),
    candidate: z.number().int().positive(),
    reviewer: z.number().int().positive(),
    sent_on: z.string(),
    due_on: z.string(),
    submitted_on: z.string(),
    submission_link: z.string(),
    score: z.number().int(),
    result: z.string(),
    reviewed_on: z.string(),
});

export class CreateJobAssessmentRequestDto extends createZodDto(
    CreateJobAssessmentRequestSchema,
) {}

@Injectable()
export class CreateJobAssessmentService {
    constructor(private readonly accessPolicy: AccessPolicyFilterService) {}
    async create(
        body: CreateJobAssessmentRequestDto,
        access: { userId: string; isSystemAdmin: boolean },
    ) {
        const accessFilter = await this.accessPolicy.resolveFilter({
            userId: access.userId,
            entityName: 'job_assessment',
            isSystemAdmin: access.isSystemAdmin,
        });
        const parsed = CreateJobAssessmentRequestSchema.parse(body);
        const scoped = prepareCreateBody({
            filter: accessFilter,
            body: parsed,
        });
        return await JobAssessment.createOne(scoped);
    }
}

@Controller({
    path: VULCAN_API_CONFIG.path,
    version: VULCAN_API_CONFIG.version,
})
export class CreateJobAssessmentController {
    constructor(private readonly service: CreateJobAssessmentService) {}

    @RequirePermission('job_assessment', 'create')
    @buildEndpoint({
        method: API_METHOD_TYPES.POST,
        path: '/job_assessment',
        tags: ['job_assessment'],
        responses: {
            [HTTP_STATUS_CODES.CREATED]: 'job_assessment created',
            [HTTP_STATUS_CODES.UNAUTHORIZED]: AUTH_MESSAGES.UNAUTHORIZED,
        },
        decorators: AUTH_BEARER_DECORATORS,
    })
    async createJobAssessment(
        @Body() body: CreateJobAssessmentRequestDto,
        @Req() request: { user?: { id: string; isSystemAdmin?: boolean } },
    ): Promise<ApiSuccessResponse<unknown>> {
        const accessUser = requireRequestUser(request);
        const access = {
            userId: accessUser.id,
            isSystemAdmin: accessUser.isSystemAdmin === true,
        };
        const data = await this.service.create(body, access);
        return apiSuccess(data, {
            message: 'job_assessment created',
        });
    }
}
