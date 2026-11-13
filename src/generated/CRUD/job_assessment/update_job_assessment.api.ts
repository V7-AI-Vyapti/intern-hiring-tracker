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
    assertUpdateScope,
} from '@vyapti/access-policy';

export const UpdateJobAssessmentRequestSchema = z
    .object({
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
    })
    .partial();

export class UpdateJobAssessmentRequestDto extends createZodDto(
    UpdateJobAssessmentRequestSchema,
) {}

export const JobAssessmentIdParamsSchema = z.object({
    id: z.coerce.number().int().positive(),
});

export class JobAssessmentIdParamsDto extends createZodDto(
    JobAssessmentIdParamsSchema,
) {}

@Injectable()
export class UpdateJobAssessmentService {
    constructor(private readonly accessPolicy: AccessPolicyFilterService) {}
    async update(
        id: number,
        body: UpdateJobAssessmentRequestDto,
        access: { userId: string; isSystemAdmin: boolean },
    ) {
        const record = await JobAssessment.getByPk(id);
        if (!record) {
            throw new NotFoundException('job_assessment not found');
        }
        await this.accessPolicy.assertRow({
            userId: access.userId,
            entityName: 'job_assessment',
            isSystemAdmin: access.isSystemAdmin,
            row: record,
        });
        const accessFilter = await this.accessPolicy.resolveFilter({
            userId: access.userId,
            entityName: 'job_assessment',
            isSystemAdmin: access.isSystemAdmin,
        });
        const parsed = UpdateJobAssessmentRequestSchema.parse(body);
        assertUpdateScope({
            filter: accessFilter,
            body: parsed,
        });
        await JobAssessment.updateByPk(id, parsed);
        return await JobAssessment.getByPk(id);
    }
}

@Controller({
    path: VULCAN_API_CONFIG.path,
    version: VULCAN_API_CONFIG.version,
})
export class UpdateJobAssessmentController {
    constructor(private readonly service: UpdateJobAssessmentService) {}

    @RequirePermission('job_assessment', 'update')
    @buildEndpoint({
        method: API_METHOD_TYPES.PATCH,
        path: '/job_assessment/:id',
        tags: ['job_assessment'],
        responses: {
            [HTTP_STATUS_CODES.OK]: 'job_assessment updated',
            [HTTP_STATUS_CODES.NOT_FOUND]: 'job_assessment not found',
            [HTTP_STATUS_CODES.UNAUTHORIZED]: AUTH_MESSAGES.UNAUTHORIZED,
        },
        decorators: AUTH_BEARER_DECORATORS,
    })
    async updateJobAssessment(
        @Param() params: JobAssessmentIdParamsDto,
        @Body() body: UpdateJobAssessmentRequestDto,
        @Req() request: { user?: { id: string; isSystemAdmin?: boolean } },
    ): Promise<ApiSuccessResponse<unknown>> {
        const accessUser = requireRequestUser(request);
        const access = {
            userId: accessUser.id,
            isSystemAdmin: accessUser.isSystemAdmin === true,
        };
        const data = await this.service.update(params.id, body, access);
        return apiSuccess(data, {
            message: 'job_assessment updated',
        });
    }
}
