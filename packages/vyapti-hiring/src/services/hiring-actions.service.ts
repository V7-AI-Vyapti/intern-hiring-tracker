import { Inject, Injectable } from '@nestjs/common';
import { PASS_SCORE, TERMINAL_STAGES } from '../hiring.constants.js';
import { INTERVIEW_MODES, RECOMMENDATIONS } from '../hiring.enums.js';
import { HIRING_MODULE_OPTIONS, HIRING_PERSISTENCE } from '../hiring.tokens.js';
import type {
    HiringCaller,
    HiringModuleRootOptions,
    HiringPersistenceAdapter,
} from '../types/hiring.types.js';
import {
    conflict,
    forbidden,
    unprocessable,
} from '../utils/hiring-errors.util.js';
import {
    callerMayPerformHiringAction,
    isRecruiter,
} from '../utils/hiring-rbac.util.js';
import { addDays, datePart } from '../utils/kolkata-date.util.js';

@Injectable()
class HiringActionsService {
    private assertAction(caller: HiringCaller, action: string): void {
        if (!callerMayPerformHiringAction(caller, action)) {
            forbidden();
        }
    }

    constructor(
        @Inject(HIRING_PERSISTENCE)
        private readonly persistence: HiringPersistenceAdapter,
        @Inject(HIRING_MODULE_OPTIONS)
        private readonly options: HiringModuleRootOptions,
    ) {}

    private today(): string {
        return this.options.today!();
    }

    private async requireCandidate(candidateId: string) {
        const candidate =
            await this.persistence.findCandidateById(candidateId);
        if (!candidate) {
            conflict(`Unknown candidate ${candidateId}`);
        }
        return candidate!;
    }

    private assertActive(stage: string, candidateId: string, action: string) {
        if ((TERMINAL_STAGES as readonly string[]).includes(stage)) {
            conflict(
                `${candidateId} is ${stage}, so ${action} can't be done`,
            );
        }
    }

    async shortlist(caller: HiringCaller, candidateId: string) {
        this.assertAction(caller, 'shortlist');
        return this.persistence.withTransaction(async () => {
            const candidate = await this.requireCandidate(candidateId);
            if (candidate.stage !== 'Applied') {
                conflict(
                    `${candidateId} is ${candidate.stage}, so it can't be shortlisted`,
                );
            }
            return this.persistence.updateCandidate(candidateId, {
                stage: 'Shortlisted',
                stage_updated_on: this.today(),
            });
        });
    }

    async reject(
        caller: HiringCaller,
        candidateId: string,
        reason: string | undefined,
    ) {
        this.assertAction(caller, 'reject');
        if (!reason?.trim()) {
            unprocessable('reason', 'Give a reason');
        }
        return this.persistence.withTransaction(async () => {
            const candidate = await this.requireCandidate(candidateId);
            this.assertActive(candidate.stage, candidateId, 'reject');
            await this.persistence.cancelScheduledInterviews(candidateId);
            return this.persistence.updateCandidate(candidateId, {
                stage: 'Rejected',
                rejected_reason: reason!.trim(),
                stage_updated_on: this.today(),
            });
        });
    }

    async withdraw(
        caller: HiringCaller,
        candidateId: string,
        reason: string | undefined,
    ) {
        this.assertAction(caller, 'withdraw');
        if (!reason?.trim()) {
            unprocessable('reason', 'Give a reason');
        }
        return this.persistence.withTransaction(async () => {
            const candidate = await this.requireCandidate(candidateId);
            this.assertActive(candidate.stage, candidateId, 'withdraw');
            await this.persistence.cancelScheduledInterviews(candidateId);
            return this.persistence.updateCandidate(candidateId, {
                stage: 'Withdrawn',
                rejected_reason: reason!.trim(),
                stage_updated_on: this.today(),
            });
        });
    }

    async sendAssessment(
        caller: HiringCaller,
        candidateId: string,
        reviewerMemberId: string,
    ) {
        this.assertAction(caller, 'send_assessment');
        return this.persistence.withTransaction(async () => {
            const candidate = await this.requireCandidate(candidateId);
            if (candidate.stage !== 'Shortlisted') {
                conflict(
                    `${candidateId} is ${candidate.stage}, so the assessment can't be sent yet`,
                );
            }
            const existing =
                await this.persistence.findAssessmentByCandidate(candidateId);
            if (existing) {
                conflict('An assessment was already sent');
            }
            const reviewer =
                await this.persistence.findTeamMemberById(reviewerMemberId);
            if (!reviewer || reviewer.status !== 'Active') {
                unprocessable(
                    'reviewer',
                    `${reviewer?.name ?? reviewerMemberId} is not an active team member`,
                );
            }
            const opening = await this.persistence.findOpeningById(
                candidate.opening,
            );
            if (!opening) {
                conflict(`Unknown opening ${candidate.opening}`);
            }
            const sentOn = this.today();
            const assessment = await this.persistence.createAssessment({
                assessment_id: await this.persistence.nextAssessmentId(),
                candidate: candidateId,
                reviewer: reviewerMemberId,
                sent_on: sentOn,
                due_on: addDays(sentOn, opening!.assessment_days),
                submitted_on: null,
                submission_link: null,
                score: null,
                result: 'Pending',
                reviewed_on: null,
            });
            const updated = await this.persistence.updateCandidate(
                candidateId,
                {
                    stage: 'Assessment sent',
                    stage_updated_on: sentOn,
                },
            );
            return { assessment, candidate: updated };
        });
    }

    async recordSubmission(
        caller: HiringCaller,
        candidateId: string,
        submissionLink: string,
    ) {
        this.assertAction(caller, 'record_submission');
        if (!submissionLink?.trim()) {
            unprocessable('submission_link', 'Add a submission link');
        }
        return this.persistence.withTransaction(async () => {
            const candidate = await this.requireCandidate(candidateId);
            if (candidate.stage !== 'Assessment sent') {
                conflict(
                    `${candidateId} is ${candidate.stage}, so a submission can't be recorded`,
                );
            }
            const assessment =
                await this.persistence.findAssessmentByCandidate(candidateId);
            if (!assessment) {
                conflict('No assessment exists for this candidate');
            }
            const submittedOn = this.today();
            const updatedAssessment = await this.persistence.updateAssessment(
                assessment!.assessment_id,
                {
                    submitted_on: submittedOn,
                    submission_link: submissionLink.trim(),
                },
            );
            const updatedCandidate = await this.persistence.updateCandidate(
                candidateId,
                {
                    stage: 'Assessment submitted',
                    stage_updated_on: submittedOn,
                },
            );
            return {
                assessment: updatedAssessment,
                candidate: updatedCandidate,
            };
        });
    }

    async reviewAssessment(
        caller: HiringCaller,
        candidateId: string,
        score: number,
    ) {
        this.assertAction(caller, 'review_assessment');
        if (!Number.isInteger(score) || score < 0 || score > 100) {
            unprocessable('score', 'Score must be 0 to 100');
        }
        return this.persistence.withTransaction(async () => {
            const candidate = await this.requireCandidate(candidateId);
            if (candidate.stage !== 'Assessment submitted') {
                conflict(
                    `${candidateId} is ${candidate.stage}, so the assessment can't be reviewed`,
                );
            }
            const assessment =
                await this.persistence.findAssessmentByCandidate(candidateId);
            if (!assessment) {
                conflict('No assessment exists for this candidate');
            }
            const self = await this.persistence.findTeamMemberByEmail(
                caller.email,
            );
            // Recruiter: any assessment. Interviewer: only assigned reviewer.
            const allowed =
                isRecruiter(caller) ||
                (self && self.member_id === assessment!.reviewer);
            if (!allowed) {
                forbidden();
            }
            const result = score >= PASS_SCORE ? 'Pass' : 'Fail';
            const reviewedOn = this.today();
            const updatedAssessment = await this.persistence.updateAssessment(
                assessment!.assessment_id,
                {
                    score,
                    result,
                    reviewed_on: reviewedOn,
                },
            );
            const updatedCandidate =
                result === 'Pass'
                    ? await this.persistence.updateCandidate(candidateId, {
                          stage: 'Interview 1',
                          stage_updated_on: reviewedOn,
                      })
                    : await this.persistence.updateCandidate(candidateId, {
                          stage: 'Rejected',
                          rejected_reason: 'Assessment score below 60',
                          stage_updated_on: reviewedOn,
                      });
            return {
                assessment: updatedAssessment,
                candidate: updatedCandidate,
            };
        });
    }

    async scheduleInterview(
        caller: HiringCaller,
        input: {
            candidate_id: string;
            interviewer: string;
            scheduled_at: string;
            mode: string;
        },
    ) {
        this.assertAction(caller, 'schedule_interview');
        return this.persistence.withTransaction(async () => {
            const candidate = await this.requireCandidate(input.candidate_id);
            if (
                candidate.stage !== 'Interview 1' &&
                candidate.stage !== 'Interview 2'
            ) {
                conflict(
                    `${input.candidate_id} is ${candidate.stage}, so an interview can't be scheduled`,
                );
            }
            const round = candidate.stage === 'Interview 1' ? 1 : 2;
            const opening = await this.persistence.findOpeningById(
                candidate.opening,
            );
            if (!opening) {
                conflict(`Unknown opening ${candidate.opening}`);
            }
            if (round > opening!.interview_rounds) {
                unprocessable(
                    'round',
                    'This role has only one interview round',
                );
            }
            if (!(INTERVIEW_MODES as readonly string[]).includes(input.mode)) {
                unprocessable('mode', 'mode is not valid');
            }
            const interviewer = await this.persistence.findTeamMemberById(
                input.interviewer,
            );
            if (!interviewer || interviewer.status !== 'Active') {
                unprocessable(
                    'interviewer',
                    `${interviewer?.name ?? input.interviewer} is not an active team member`,
                );
            }
            const existing = await this.persistence.listInterviewsForCandidate(
                input.candidate_id,
            );
            if (round === 2) {
                const round1 = existing.find(
                    (interview) =>
                        interview.round === 1 && interview.status === 'Done',
                );
                if (!round1 || round1.recommendation !== 'Next round') {
                    conflict(
                        `${input.candidate_id} is not cleared for interview round 2`,
                    );
                }
            }
            const booked = existing.find(
                (interview) =>
                    interview.round === round &&
                    (interview.status === 'Scheduled' ||
                        interview.status === 'Done'),
            );
            if (booked) {
                // V9 / T16 → 422 { field, message }
                unprocessable(
                    'round',
                    `Round ${round} is already booked`,
                );
            }
            const interview = await this.persistence.createInterview({
                interview_id: await this.persistence.nextInterviewId(),
                candidate: input.candidate_id,
                round,
                interviewer: input.interviewer,
                scheduled_at: input.scheduled_at,
                mode: input.mode,
                status: 'Scheduled',
                rating: null,
                recommendation: null,
                feedback: null,
                feedback_on: null,
            });
            return interview;
        });
    }

    async recordFeedback(
        caller: HiringCaller,
        input: {
            interview_id: string;
            rating: number;
            recommendation: string;
            feedback: string;
        },
    ) {
        this.assertAction(caller, 'record_feedback');
        if (
            !Number.isInteger(input.rating) ||
            input.rating < 1 ||
            input.rating > 5 ||
            !input.recommendation ||
            !input.feedback?.trim()
        ) {
            unprocessable(
                'feedback',
                'Add rating, recommendation and feedback',
            );
        }
        if (
            !(RECOMMENDATIONS as readonly string[]).includes(
                input.recommendation,
            )
        ) {
            unprocessable('recommendation', 'recommendation is not valid');
        }
        return this.persistence.withTransaction(async () => {
            const interview = await this.persistence.findInterviewById(
                input.interview_id,
            );
            if (!interview) {
                conflict(`Unknown interview ${input.interview_id}`);
            }
            if (interview!.status !== 'Scheduled') {
                conflict(
                    `${input.interview_id} is ${interview!.status}, so feedback can't be recorded`,
                );
            }
            if (datePart(interview!.scheduled_at) > this.today()) {
                conflict('Interview has not happened yet');
            }
            const self = await this.persistence.findTeamMemberByEmail(
                caller.email,
            );
            // Recruiter: any interview. Interviewer: only assigned interviewer.
            const allowed =
                isRecruiter(caller) ||
                (self && self.member_id === interview!.interviewer);
            if (!allowed) {
                forbidden();
            }
            const candidate = await this.requireCandidate(interview!.candidate);
            const opening = await this.persistence.findOpeningById(
                candidate.opening,
            );
            if (
                input.recommendation === 'Next round' &&
                (!opening || opening.interview_rounds < 2)
            ) {
                unprocessable(
                    'recommendation',
                    'This role has only one interview round',
                );
            }
            const feedbackOn = this.today();
            const updatedInterview = await this.persistence.updateInterview(
                input.interview_id,
                {
                    status: 'Done',
                    rating: input.rating,
                    recommendation: input.recommendation,
                    feedback: input.feedback.trim(),
                    feedback_on: feedbackOn,
                },
            );
            let updatedCandidate = candidate;
            if (input.recommendation === 'Reject') {
                updatedCandidate = await this.persistence.updateCandidate(
                    candidate.candidate_id,
                    {
                        stage: 'Rejected',
                        rejected_reason: `Interview round ${interview!.round}`,
                        stage_updated_on: feedbackOn,
                    },
                );
            } else if (
                input.recommendation === 'Next round' &&
                interview!.round === 1 &&
                opening &&
                opening.interview_rounds === 2
            ) {
                updatedCandidate = await this.persistence.updateCandidate(
                    candidate.candidate_id,
                    {
                        stage: 'Interview 2',
                        stage_updated_on: feedbackOn,
                    },
                );
            }
            return {
                interview: updatedInterview,
                candidate: updatedCandidate,
            };
        });
    }

    async markNoShow(caller: HiringCaller, interviewId: string) {
        this.assertAction(caller, 'mark_no_show');
        return this.persistence.withTransaction(async () => {
            const interview =
                await this.persistence.findInterviewById(interviewId);
            if (!interview) {
                conflict(`Unknown interview ${interviewId}`);
            }
            if (interview!.status !== 'Scheduled') {
                conflict(
                    `${interviewId} is ${interview!.status}, so it can't be marked no-show`,
                );
            }
            if (datePart(interview!.scheduled_at) > this.today()) {
                conflict('Interview has not happened yet');
            }
            const feedbackOn = this.today();
            const updatedInterview = await this.persistence.updateInterview(
                interviewId,
                {
                    status: 'No-show',
                    feedback_on: feedbackOn,
                },
            );
            const updatedCandidate = await this.persistence.updateCandidate(
                interview!.candidate,
                {
                    stage: 'Withdrawn',
                    rejected_reason: 'Missed the interview',
                    stage_updated_on: feedbackOn,
                },
            );
            return {
                interview: updatedInterview,
                candidate: updatedCandidate,
            };
        });
    }

    async cancelInterview(caller: HiringCaller, interviewId: string) {
        this.assertAction(caller, 'cancel_interview');
        return this.persistence.withTransaction(async () => {
            const interview =
                await this.persistence.findInterviewById(interviewId);
            if (!interview) {
                conflict(`Unknown interview ${interviewId}`);
            }
            if (interview!.status !== 'Scheduled') {
                conflict(
                    `${interviewId} is ${interview!.status}, so it can't be cancelled`,
                );
            }
            return this.persistence.updateInterview(interviewId, {
                status: 'Cancelled',
            });
        });
    }

    async makeOffer(caller: HiringCaller, candidateId: string) {
        this.assertAction(caller, 'make_offer');
        return this.persistence.withTransaction(async () => {
            const candidate = await this.requireCandidate(candidateId);
            const interviews =
                await this.persistence.listInterviewsForCandidate(candidateId);
            const latestDone = [...interviews]
                .filter((interview) => interview.status === 'Done')
                .sort((a, b) => b.round - a.round)[0];
            if (!latestDone || latestDone.recommendation !== 'Hire') {
                conflict(
                    `${candidateId} does not have a Hire recommendation ready for an offer`,
                );
            }
            const opening = await this.persistence.findOpeningById(
                candidate.opening,
            );
            if (!opening) {
                conflict(`Unknown opening ${candidate.opening}`);
            }
            const hired = await this.persistence.countHiredForOpening(
                candidate.opening,
            );
            if (hired >= opening!.positions) {
                conflict('All positions are filled');
            }
            return this.persistence.updateCandidate(candidateId, {
                stage: 'Offer made',
                stage_updated_on: this.today(),
            });
        });
    }

    async recordOfferAnswer(
        caller: HiringCaller,
        input: {
            candidate_id: string;
            accepted: boolean;
            joining_on?: string;
        },
    ) {
        this.assertAction(caller, 'record_offer_answer');
        return this.persistence.withTransaction(async () => {
            const candidate = await this.requireCandidate(input.candidate_id);
            if (candidate.stage !== 'Offer made') {
                conflict(
                    `${input.candidate_id} is ${candidate.stage}, so an offer answer can't be recorded`,
                );
            }
            if (input.accepted) {
                if (!input.joining_on) {
                    unprocessable('joining_on', 'Add the joining date');
                }
                return this.persistence.updateCandidate(input.candidate_id, {
                    stage: 'Hired',
                    joining_on: input.joining_on,
                    stage_updated_on: this.today(),
                });
            }
            return this.persistence.updateCandidate(input.candidate_id, {
                stage: 'Withdrawn',
                rejected_reason: 'Declined the offer',
                stage_updated_on: this.today(),
            });
        });
    }
}

export { HiringActionsService };
