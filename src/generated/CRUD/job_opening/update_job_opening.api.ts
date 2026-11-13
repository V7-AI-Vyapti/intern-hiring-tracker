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
    assertUpdateScope,
} from '@vyapti/access-policy';

export const UpdateJobOpeningRequestSchema = z
    .object({
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
    })
    .partial();

export class UpdateJobOpeningRequestDto extends createZodDto(
    UpdateJobOpeningRequestSchema,
) {}

export const JobOpeningIdParamsSchema = z.object({
    id: z.coerce.number().int().positive(),
});

export class JobOpeningIdParamsDto extends createZodDto(
    JobOpeningIdParamsSchema,
) {}

@Injectable()
export class UpdateJobOpeningService {
    constructor(private readonly accessPolicy: AccessPolicyFilterService) {}
    async update(
        id: number,
        body: UpdateJobOpeningRequestDto,
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
        const accessFilter = await this.accessPolicy.resolveFilter({
            userId: access.userId,
            entityName: 'job_opening',
            isSystemAdmin: access.isSystemAdmin,
        });
        const parsed = UpdateJobOpeningRequestSchema.parse(body);
        assertUpdateScope({
            filter: accessFilter,
            body: parsed,
        });
        await JobOpening.updateByPk(id, parsed);
        return await JobOpening.getByPk(id);
    }
}

@Controller({
    path: VULCAN_API_CONFIG.path,
    version: VULCAN_API_CONFIG.version,
})
export class UpdateJobOpeningController {
    constructor(private readonly service: UpdateJobOpeningService) {}

    @RequirePermission('job_opening', 'update')
    @buildEndpoint({
        method: API_METHOD_TYPES.PATCH,
        path: '/job_opening/:id',
        tags: ['job_opening'],
        responses: {
            [HTTP_STATUS_CODES.OK]: 'job_opening updated',
            [HTTP_STATUS_CODES.NOT_FOUND]: 'job_opening not found',
            [HTTP_STATUS_CODES.UNAUTHORIZED]: AUTH_MESSAGES.UNAUTHORIZED,
        },
        decorators: AUTH_BEARER_DECORATORS,
    })
    async updateJobOpening(
        @Param() params: JobOpeningIdParamsDto,
        @Body() body: UpdateJobOpeningRequestDto,
        @Req() request: { user?: { id: string; isSystemAdmin?: boolean } },
    ): Promise<ApiSuccessResponse<unknown>> {
        const accessUser = requireRequestUser(request);
        const access = {
            userId: accessUser.id,
            isSystemAdmin: accessUser.isSystemAdmin === true,
        };
        const data = await this.service.update(params.id, body, access);
        return apiSuccess(data, {
            message: 'job_opening updated',
        });
    }
}
