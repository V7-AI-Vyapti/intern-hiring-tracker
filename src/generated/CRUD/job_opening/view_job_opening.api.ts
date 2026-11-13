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
} from '@vyapti/access-policy';

export const JobOpeningIdParamsSchema = z.object({
    id: z.coerce.number().int().positive(),
});

export class JobOpeningIdParamsDto extends createZodDto(
    JobOpeningIdParamsSchema,
) {}

@Injectable()
export class ViewJobOpeningService {
    constructor(private readonly accessPolicy: AccessPolicyFilterService) {}
    async getById(
        id: number,
        access: { userId: string; isSystemAdmin: boolean },
    ) {
        const record = await JobOpening.getByPk(id);
        if (!record) {
            throw new NotFoundException('job_opening not found');
        }
        await this.accessPolicy.assertRow({
            userId: access.userId,
            entityName: 'job_opening',
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
export class ViewJobOpeningController {
    constructor(private readonly service: ViewJobOpeningService) {}

    @RequirePermission('job_opening', 'view')
    @buildEndpoint({
        method: API_METHOD_TYPES.GET,
        path: '/job_opening/:id',
        tags: ['job_opening'],
        responses: {
            [HTTP_STATUS_CODES.OK]: 'job_opening fetched',
            [HTTP_STATUS_CODES.NOT_FOUND]: 'job_opening not found',
            [HTTP_STATUS_CODES.UNAUTHORIZED]: AUTH_MESSAGES.UNAUTHORIZED,
        },
        decorators: AUTH_BEARER_DECORATORS,
    })
    async getJobOpening(
        @Param() params: JobOpeningIdParamsDto,
        @Req() request: { user?: { id: string; isSystemAdmin?: boolean } },
    ): Promise<ApiSuccessResponse<unknown>> {
        const accessUser = requireRequestUser(request);
        const access = {
            userId: accessUser.id,
            isSystemAdmin: accessUser.isSystemAdmin === true,
        };
        const data = await this.service.getById(params.id, access);
        return apiSuccess(data, {
            message: 'job_opening fetched',
        });
    }
}
