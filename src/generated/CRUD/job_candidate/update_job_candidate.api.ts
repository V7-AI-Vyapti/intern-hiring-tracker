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
    assertUpdateScope,
} from '@vyapti/access-policy';

export const UpdateJobCandidateRequestSchema = z
    .object({
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
    })
    .partial();

export class UpdateJobCandidateRequestDto extends createZodDto(
    UpdateJobCandidateRequestSchema,
) {}

export const JobCandidateIdParamsSchema = z.object({
    id: z.coerce.number().int().positive(),
});

export class JobCandidateIdParamsDto extends createZodDto(
    JobCandidateIdParamsSchema,
) {}

@Injectable()
export class UpdateJobCandidateService {
    constructor(private readonly accessPolicy: AccessPolicyFilterService) {}
    async update(
        id: number,
        body: UpdateJobCandidateRequestDto,
        access: { userId: string; isSystemAdmin: boolean },
    ) {
        const record = await JobCandidate.getByPk(id);
        if (!record) {
            throw new NotFoundException('job_candidate not found');
        }
        await this.accessPolicy.assertRow({
            userId: access.userId,
            entityName: 'job_candidate',
            isSystemAdmin: access.isSystemAdmin,
            row: record,
        });
        const accessFilter = await this.accessPolicy.resolveFilter({
            userId: access.userId,
            entityName: 'job_candidate',
            isSystemAdmin: access.isSystemAdmin,
        });
        const parsed = UpdateJobCandidateRequestSchema.parse(body);
        assertUpdateScope({
            filter: accessFilter,
            body: parsed,
        });
        await JobCandidate.updateByPk(id, parsed);
        return await JobCandidate.getByPk(id);
    }
}

@Controller({
    path: VULCAN_API_CONFIG.path,
    version: VULCAN_API_CONFIG.version,
})
export class UpdateJobCandidateController {
    constructor(private readonly service: UpdateJobCandidateService) {}

    @RequirePermission('job_candidate', 'update')
    @buildEndpoint({
        method: API_METHOD_TYPES.PATCH,
        path: '/job_candidate/:id',
        tags: ['job_candidate'],
        responses: {
            [HTTP_STATUS_CODES.OK]: 'job_candidate updated',
            [HTTP_STATUS_CODES.NOT_FOUND]: 'job_candidate not found',
            [HTTP_STATUS_CODES.UNAUTHORIZED]: AUTH_MESSAGES.UNAUTHORIZED,
        },
        decorators: AUTH_BEARER_DECORATORS,
    })
    async updateJobCandidate(
        @Param() params: JobCandidateIdParamsDto,
        @Body() body: UpdateJobCandidateRequestDto,
        @Req() request: { user?: { id: string; isSystemAdmin?: boolean } },
    ): Promise<ApiSuccessResponse<unknown>> {
        const accessUser = requireRequestUser(request);
        const access = {
            userId: accessUser.id,
            isSystemAdmin: accessUser.isSystemAdmin === true,
        };
        const data = await this.service.update(params.id, body, access);
        return apiSuccess(data, {
            message: 'job_candidate updated',
        });
    }
}
