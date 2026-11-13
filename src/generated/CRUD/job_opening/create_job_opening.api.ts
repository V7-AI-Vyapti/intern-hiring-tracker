import { Body, Controller, Injectable, Req } from '@nestjs/common';
import { buildEndpoint } from '@vyapti/core/custom_api';
import {
    apiSuccess,
    type ApiSuccessResponse,
} from '@vyapti/core/custom_api_response';
import { JobOpening } from '@entities/job_opening.entity';
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

export const CreateJobOpeningRequestSchema = z.object({
    title: z.string(),
    team: z.string(),
    status: z.string(),
    opening_id: z.string(),
    location: z.string(),
    stipend_inr: z.number().int(),
    positions: z.number().int(),
    posted_on: z.string(),
    closes_on: z.string(),
    interview_rounds: z.number().int(),
    assessment_name: z.string(),
    assessment_days: z.number().int(),
    owner: z.number().int().positive(),
});

export class CreateJobOpeningRequestDto extends createZodDto(
    CreateJobOpeningRequestSchema,
) {}

@Injectable()
export class CreateJobOpeningService {
    constructor(private readonly accessPolicy: AccessPolicyFilterService) {}
    async create(
        body: CreateJobOpeningRequestDto,
        access: { userId: string; isSystemAdmin: boolean },
    ) {
        const accessFilter = await this.accessPolicy.resolveFilter({
            userId: access.userId,
            entityName: 'job_opening',
            isSystemAdmin: access.isSystemAdmin,
        });
        const parsed = CreateJobOpeningRequestSchema.parse(body);
        const scoped = prepareCreateBody({
            filter: accessFilter,
            body: parsed,
        });
        return await JobOpening.createOne(scoped);
    }
}

@Controller({
    path: VULCAN_API_CONFIG.path,
    version: VULCAN_API_CONFIG.version,
})
export class CreateJobOpeningController {
    constructor(private readonly service: CreateJobOpeningService) {}

    @RequirePermission('job_opening', 'create')
    @buildEndpoint({
        method: API_METHOD_TYPES.POST,
        path: '/job_opening',
        tags: ['job_opening'],
        responses: {
            [HTTP_STATUS_CODES.CREATED]: 'job_opening created',
            [HTTP_STATUS_CODES.UNAUTHORIZED]: AUTH_MESSAGES.UNAUTHORIZED,
        },
        decorators: AUTH_BEARER_DECORATORS,
    })
    async createJobOpening(
        @Body() body: CreateJobOpeningRequestDto,
        @Req() request: { user?: { id: string; isSystemAdmin?: boolean } },
    ): Promise<ApiSuccessResponse<unknown>> {
        const accessUser = requireRequestUser(request);
        const access = {
            userId: accessUser.id,
            isSystemAdmin: accessUser.isSystemAdmin === true,
        };
        const data = await this.service.create(body, access);
        return apiSuccess(data, {
            message: 'job_opening created',
        });
    }
}
