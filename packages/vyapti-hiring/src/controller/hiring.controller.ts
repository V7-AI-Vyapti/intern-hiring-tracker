import {
    Body,
    Controller,
    Get,
    Inject,
    Post,
    Req,
    UnauthorizedException,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Public } from '@vyapti/auth';
import { RequirePermission } from '@vyapti/rbac';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { HIRING_RESOURCE } from '../hiring.constants.js';
import { HIRING_MODULE_OPTIONS } from '../hiring.tokens.js';
import { DashboardSummaryService } from '../services/dashboard-summary.service.js';
import { HiringActionsService } from '../services/hiring-actions.service.js';
import { PublicApplyService } from '../services/public-apply.service.js';
import type {
    HiringCaller,
    HiringModuleRootOptions,
} from '../types/hiring.types.js';
import { callerMayPerformHiringAction } from '../utils/hiring-rbac.util.js';
import { forbidden } from '../utils/hiring-errors.util.js';

const CandidateIdBodySchema = z.object({
    candidate_id: z.string().trim().min(1),
});

const ReasonBodySchema = CandidateIdBodySchema.extend({
    reason: z.string().optional(),
});

const SendAssessmentBodySchema = CandidateIdBodySchema.extend({
    reviewer: z.string().trim().min(1),
});

const SubmissionBodySchema = CandidateIdBodySchema.extend({
    submission_link: z.string().trim().min(1),
});

const ReviewBodySchema = CandidateIdBodySchema.extend({
    score: z.number().int(),
});

const ScheduleBodySchema = CandidateIdBodySchema.extend({
    interviewer: z.string().trim().min(1),
    scheduled_at: z.string().trim().min(1),
    mode: z.string().trim().min(1),
});

const FeedbackBodySchema = z.object({
    interview_id: z.string().trim().min(1),
    rating: z.number().int(),
    recommendation: z.string().trim().min(1),
    feedback: z.string().trim().min(1),
});

const InterviewIdBodySchema = z.object({
    interview_id: z.string().trim().min(1),
});

const OfferAnswerBodySchema = CandidateIdBodySchema.extend({
    accepted: z.boolean(),
    joining_on: z.string().trim().min(1).optional(),
});

/** Applicant fields only — unknown/internal keys are rejected (Zod strict). */
const PublicApplyBodySchema = z.strictObject({
    opening_id: z.string().trim().min(1),
    name: z.string().trim().min(1),
    email: z.string().trim().min(1),
    college: z.string().trim().min(1),
    degree: z.string().trim().min(1),
    graduation_year: z.number().int(),
    source: z.string().trim().min(1),
    resume_link: z.string().trim().min(1),
});

class CandidateIdBody extends createZodDto(CandidateIdBodySchema) {}
class ReasonBody extends createZodDto(ReasonBodySchema) {}
class SendAssessmentBody extends createZodDto(SendAssessmentBodySchema) {}
class SubmissionBody extends createZodDto(SubmissionBodySchema) {}
class ReviewBody extends createZodDto(ReviewBodySchema) {}
class ScheduleBody extends createZodDto(ScheduleBodySchema) {}
class FeedbackBody extends createZodDto(FeedbackBodySchema) {}
class InterviewIdBody extends createZodDto(InterviewIdBodySchema) {}
class OfferAnswerBody extends createZodDto(OfferAnswerBodySchema) {}
class PublicApplyBody extends createZodDto(PublicApplyBodySchema) {}

type AuthRequestUser = {
    id?: string;
    email?: string;
    roles?: string[];
};

@ApiTags('hiring')
@ApiBearerAuth('bearerAuth')
@Controller()
class HiringController {
    constructor(
        private readonly actions: HiringActionsService,
        private readonly dashboard: DashboardSummaryService,
        private readonly publicApply: PublicApplyService,
        @Inject(HIRING_MODULE_OPTIONS)
        private readonly options: HiringModuleRootOptions,
    ) {}

    private async readCaller(req: {
        user?: AuthRequestUser;
    }): Promise<HiringCaller> {
        const email = req.user?.email;
        if (!email) {
            throw new UnauthorizedException();
        }
        const userId = req.user?.id;
        let roles = req.user?.roles ?? [];
        if (
            roles.length === 0 &&
            userId &&
            this.options.resolveRoles
        ) {
            roles = await this.options.resolveRoles({ userId, email });
        }
        return { email, roles, userId };
    }

    @Get('dashboard_summary')
    @RequirePermission(HIRING_RESOURCE, 'dashboard_summary')
    async dashboardSummary(@Req() req: { user?: AuthRequestUser }) {
        const caller = await this.readCaller(req);
        if (!callerMayPerformHiringAction(caller, 'dashboard_summary')) {
            forbidden();
        }
        return this.dashboard.summarize();
    }

    /**
     * Forms-compatible public application schema (anonymous).
     * `@vyapti/forms` location GET stays authenticated in v1 — careers FE uses this.
     */
    @Public()
    @Get('application_form')
    applicationForm() {
        return this.publicApply.getApplicationFormConfig();
    }

    /**
     * Eligible Open openings for the public form dropdown (no internal hiring rows).
     */
    @Public()
    @Get('openings')
    listOpenings() {
        return this.publicApply.listEligibleOpenings();
    }

    /**
     * Public careers-page apply. AuthGuard skips via `@Public()`; no RBAC grant.
     * Body is applicant-field allowlist only; creation always starts at Applied.
     */
    @Public()
    @Post('apply')
    apply(@Body() body: PublicApplyBody) {
        return this.publicApply.apply(body);
    }

    @Post('shortlist')
    @RequirePermission(HIRING_RESOURCE, 'shortlist')
    async shortlist(
        @Req() req: { user?: AuthRequestUser },
        @Body() body: CandidateIdBody,
    ) {
        return this.actions.shortlist(
            await this.readCaller(req),
            body.candidate_id,
        );
    }

    @Post('reject')
    @RequirePermission(HIRING_RESOURCE, 'reject')
    async reject(
        @Req() req: { user?: AuthRequestUser },
        @Body() body: ReasonBody,
    ) {
        return this.actions.reject(
            await this.readCaller(req),
            body.candidate_id,
            body.reason,
        );
    }

    @Post('withdraw')
    @RequirePermission(HIRING_RESOURCE, 'withdraw')
    async withdraw(
        @Req() req: { user?: AuthRequestUser },
        @Body() body: ReasonBody,
    ) {
        return this.actions.withdraw(
            await this.readCaller(req),
            body.candidate_id,
            body.reason,
        );
    }

    @Post('send_assessment')
    @RequirePermission(HIRING_RESOURCE, 'send_assessment')
    async sendAssessment(
        @Req() req: { user?: AuthRequestUser },
        @Body() body: SendAssessmentBody,
    ) {
        return this.actions.sendAssessment(
            await this.readCaller(req),
            body.candidate_id,
            body.reviewer,
        );
    }

    @Post('record_submission')
    @RequirePermission(HIRING_RESOURCE, 'record_submission')
    async recordSubmission(
        @Req() req: { user?: AuthRequestUser },
        @Body() body: SubmissionBody,
    ) {
        return this.actions.recordSubmission(
            await this.readCaller(req),
            body.candidate_id,
            body.submission_link,
        );
    }

    @Post('review_assessment')
    @RequirePermission(HIRING_RESOURCE, 'review_assessment')
    async reviewAssessment(
        @Req() req: { user?: AuthRequestUser },
        @Body() body: ReviewBody,
    ) {
        return this.actions.reviewAssessment(
            await this.readCaller(req),
            body.candidate_id,
            body.score,
        );
    }

    @Post('schedule_interview')
    @RequirePermission(HIRING_RESOURCE, 'schedule_interview')
    async scheduleInterview(
        @Req() req: { user?: AuthRequestUser },
        @Body() body: ScheduleBody,
    ) {
        return this.actions.scheduleInterview(await this.readCaller(req), body);
    }

    @Post('record_feedback')
    @RequirePermission(HIRING_RESOURCE, 'record_feedback')
    async recordFeedback(
        @Req() req: { user?: AuthRequestUser },
        @Body() body: FeedbackBody,
    ) {
        return this.actions.recordFeedback(await this.readCaller(req), body);
    }

    @Post('mark_no_show')
    @RequirePermission(HIRING_RESOURCE, 'mark_no_show')
    async markNoShow(
        @Req() req: { user?: AuthRequestUser },
        @Body() body: InterviewIdBody,
    ) {
        return this.actions.markNoShow(
            await this.readCaller(req),
            body.interview_id,
        );
    }

    @Post('cancel_interview')
    @RequirePermission(HIRING_RESOURCE, 'cancel_interview')
    async cancelInterview(
        @Req() req: { user?: AuthRequestUser },
        @Body() body: InterviewIdBody,
    ) {
        return this.actions.cancelInterview(
            await this.readCaller(req),
            body.interview_id,
        );
    }

    @Post('make_offer')
    @RequirePermission(HIRING_RESOURCE, 'make_offer')
    async makeOffer(
        @Req() req: { user?: AuthRequestUser },
        @Body() body: CandidateIdBody,
    ) {
        return this.actions.makeOffer(
            await this.readCaller(req),
            body.candidate_id,
        );
    }

    @Post('record_offer_answer')
    @RequirePermission(HIRING_RESOURCE, 'record_offer_answer')
    async recordOfferAnswer(
        @Req() req: { user?: AuthRequestUser },
        @Body() body: OfferAnswerBody,
    ) {
        return this.actions.recordOfferAnswer(
            await this.readCaller(req),
            body,
        );
    }
}

export { HiringController };
