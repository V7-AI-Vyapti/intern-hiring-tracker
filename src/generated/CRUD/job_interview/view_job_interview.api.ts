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
} from '@vyapti/access-policy';

export const JobInterviewIdParamsSchema = z.object({
    id: z.coerce.number().int().positive(),
});

export class JobInterviewIdParamsDto extends createZodDto(
    JobInterviewIdParamsSchema,
) {}

@Injectable()
export class ViewJobInterviewService {
    constructor(private readonly accessPolicy: AccessPolicyFilterService) {}
    async getById(
        id: number,
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
        return record;
    }
}

@Controller({
    path: VULCAN_API_CONFIG.path,
    version: VULCAN_API_CONFIG.version,
})
export class ViewJobInterviewController {
    constructor(private readonly service: ViewJobInterviewService) {}

    @RequirePermission('job_interview', 'view')
    @buildEndpoint({
        method: API_METHOD_TYPES.GET,
        path: '/job_interview/:id',
        tags: ['job_interview'],
        responses: {
            [HTTP_STATUS_CODES.OK]: 'job_interview fetched',
            [HTTP_STATUS_CODES.NOT_FOUND]: 'job_interview not found',
            [HTTP_STATUS_CODES.UNAUTHORIZED]: AUTH_MESSAGES.UNAUTHORIZED,
        },
        decorators: AUTH_BEARER_DECORATORS,
    })
    async getJobInterview(
        @Param() params: JobInterviewIdParamsDto,
        @Req() request: { user?: { id: string; isSystemAdmin?: boolean } },
    ): Promise<ApiSuccessResponse<unknown>> {
        const accessUser = requireRequestUser(request);
        const access = {
            userId: accessUser.id,
            isSystemAdmin: accessUser.isSystemAdmin === true,
        };
        const data = await this.service.getById(params.id, access);
        return apiSuccess(data, {
            message: 'job_interview fetched',
        });
    }
}
