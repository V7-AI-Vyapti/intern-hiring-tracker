import {
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
} from '@vyapti/access-policy';

export const JobAssessmentIdParamsSchema = z.object({
    id: z.coerce.number().int().positive(),
});

export class JobAssessmentIdParamsDto extends createZodDto(
    JobAssessmentIdParamsSchema,
) {}

@Injectable()
export class ViewJobAssessmentService {
    constructor(private readonly accessPolicy: AccessPolicyFilterService) {}
    async getById(
        id: number,
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
        return record;
    }
}

@Controller({
    path: VULCAN_API_CONFIG.path,
    version: VULCAN_API_CONFIG.version,
})
export class ViewJobAssessmentController {
    constructor(private readonly service: ViewJobAssessmentService) {}

    @RequirePermission('job_assessment', 'view')
    @buildEndpoint({
        method: API_METHOD_TYPES.GET,
        path: '/job_assessment/:id',
        tags: ['job_assessment'],
        responses: {
            [HTTP_STATUS_CODES.OK]: 'job_assessment fetched',
            [HTTP_STATUS_CODES.NOT_FOUND]: 'job_assessment not found',
            [HTTP_STATUS_CODES.UNAUTHORIZED]: AUTH_MESSAGES.UNAUTHORIZED,
        },
        decorators: AUTH_BEARER_DECORATORS,
    })
    async getJobAssessment(
        @Param() params: JobAssessmentIdParamsDto,
        @Req() request: { user?: { id: string; isSystemAdmin?: boolean } },
    ): Promise<ApiSuccessResponse<unknown>> {
        const accessUser = requireRequestUser(request);
        const access = {
            userId: accessUser.id,
            isSystemAdmin: accessUser.isSystemAdmin === true,
        };
        const data = await this.service.getById(params.id, access);
        return apiSuccess(data, {
            message: 'job_assessment fetched',
        });
    }
}
