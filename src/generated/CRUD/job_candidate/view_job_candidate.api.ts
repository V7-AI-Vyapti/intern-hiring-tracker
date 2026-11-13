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
} from '@vyapti/access-policy';

export const JobCandidateIdParamsSchema = z.object({
    id: z.coerce.number().int().positive(),
});

export class JobCandidateIdParamsDto extends createZodDto(
    JobCandidateIdParamsSchema,
) {}

@Injectable()
export class ViewJobCandidateService {
    constructor(private readonly accessPolicy: AccessPolicyFilterService) {}
    async getById(
        id: number,
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
        return record;
    }
}

@Controller({
    path: VULCAN_API_CONFIG.path,
    version: VULCAN_API_CONFIG.version,
})
export class ViewJobCandidateController {
    constructor(private readonly service: ViewJobCandidateService) {}

    @RequirePermission('job_candidate', 'view')
    @buildEndpoint({
        method: API_METHOD_TYPES.GET,
        path: '/job_candidate/:id',
        tags: ['job_candidate'],
        responses: {
            [HTTP_STATUS_CODES.OK]: 'job_candidate fetched',
            [HTTP_STATUS_CODES.NOT_FOUND]: 'job_candidate not found',
            [HTTP_STATUS_CODES.UNAUTHORIZED]: AUTH_MESSAGES.UNAUTHORIZED,
        },
        decorators: AUTH_BEARER_DECORATORS,
    })
    async getJobCandidate(
        @Param() params: JobCandidateIdParamsDto,
        @Req() request: { user?: { id: string; isSystemAdmin?: boolean } },
    ): Promise<ApiSuccessResponse<unknown>> {
        const accessUser = requireRequestUser(request);
        const access = {
            userId: accessUser.id,
            isSystemAdmin: accessUser.isSystemAdmin === true,
        };
        const data = await this.service.getById(params.id, access);
        return apiSuccess(data, {
            message: 'job_candidate fetched',
        });
    }
}
