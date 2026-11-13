import { Body, Controller, Injectable, Req } from '@nestjs/common';
import { buildEndpoint } from '@vyapti/core/custom_api';
import {
    apiSuccess,
    type ApiSuccessResponse,
} from '@vyapti/core/custom_api_response';
import { JobCandidate } from '@entities/job_candidate.entity';
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

export const CreateJobCandidateRequestSchema = z.object({
    name: z.string(),
    email: z.string(),
    candidate_id: z.string(),
    opening: z.number().int().positive(),
    college: z.string(),
    degree: z.string(),
    graduation_year: z.number().int(),
    source: z.string(),
    resume_link: z.string(),
    applied_on: z.string(),
    stage: z.string(),
    stage_updated_on: z.string(),
    rejected_reason: z.string(),
    joining_on: z.string(),
    notes: z.string(),
});

export class CreateJobCandidateRequestDto extends createZodDto(
    CreateJobCandidateRequestSchema,
) {}

@Injectable()
export class CreateJobCandidateService {
    constructor(private readonly accessPolicy: AccessPolicyFilterService) {}
    async create(
        body: CreateJobCandidateRequestDto,
        access: { userId: string; isSystemAdmin: boolean },
    ) {
        const accessFilter = await this.accessPolicy.resolveFilter({
            userId: access.userId,
            entityName: 'job_candidate',
            isSystemAdmin: access.isSystemAdmin,
        });
        const parsed = CreateJobCandidateRequestSchema.parse(body);
        const scoped = prepareCreateBody({
            filter: accessFilter,
            body: parsed,
        });
        return await JobCandidate.createOne(scoped);
    }
}

@Controller({
    path: VULCAN_API_CONFIG.path,
    version: VULCAN_API_CONFIG.version,
})
export class CreateJobCandidateController {
    constructor(private readonly service: CreateJobCandidateService) {}

    @RequirePermission('job_candidate', 'create')
    @buildEndpoint({
        method: API_METHOD_TYPES.POST,
        path: '/job_candidate',
        tags: ['job_candidate'],
        responses: {
            [HTTP_STATUS_CODES.CREATED]: 'job_candidate created',
            [HTTP_STATUS_CODES.UNAUTHORIZED]: AUTH_MESSAGES.UNAUTHORIZED,
        },
        decorators: AUTH_BEARER_DECORATORS,
    })
    async createJobCandidate(
        @Body() body: CreateJobCandidateRequestDto,
        @Req() request: { user?: { id: string; isSystemAdmin?: boolean } },
    ): Promise<ApiSuccessResponse<unknown>> {
        const accessUser = requireRequestUser(request);
        const access = {
            userId: accessUser.id,
            isSystemAdmin: accessUser.isSystemAdmin === true,
        };
        const data = await this.service.create(body, access);
        return apiSuccess(data, {
            message: 'job_candidate created',
        });
    }
}
