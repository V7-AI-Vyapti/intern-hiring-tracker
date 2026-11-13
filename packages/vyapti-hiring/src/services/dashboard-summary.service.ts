import { Inject, Injectable } from '@nestjs/common';
import { ALERT_THRESHOLDS, ACTIVE_STAGES } from '../hiring.constants.js';
import { HIRING_MODULE_OPTIONS, HIRING_PERSISTENCE } from '../hiring.tokens.js';
import type {
    DashboardSummary,
    HiringModuleRootOptions,
    HiringPersistenceAdapter,
    NeedsAttentionIds,
    NeedsAttentionKey,
} from '../types/hiring.types.js';
import {
    calendarDaysBetween,
    datePart,
} from '../utils/kolkata-date.util.js';

const ALERT_KEYS: NeedsAttentionKey[] = [
    'not_reviewed',
    'assessment_not_sent',
    'assessment_overdue',
    'review_pending',
    'interview_not_scheduled',
    'feedback_missing',
    'offer_pending',
];

const emptyIds = (): NeedsAttentionIds => ({
    not_reviewed: [],
    assessment_not_sent: [],
    assessment_overdue: [],
    review_pending: [],
    interview_not_scheduled: [],
    feedback_missing: [],
    offer_pending: [],
});

@Injectable()
class DashboardSummaryService {
    constructor(
        @Inject(HIRING_PERSISTENCE)
        private readonly persistence: HiringPersistenceAdapter,
        @Inject(HIRING_MODULE_OPTIONS)
        private readonly options: Required<
            Pick<HiringModuleRootOptions, 'today'>
        > &
            HiringModuleRootOptions,
    ) {}

    async summarize(): Promise<DashboardSummary> {
        const today = this.options.today!();
        const [candidates, openings, assessments, interviews] =
            await Promise.all([
                this.persistence.listCandidates(),
                this.persistence.listOpenings(),
                this.persistence.listAssessments(),
                this.persistence.listInterviews(),
            ]);

        const assessmentByCandidate = new Map(
            assessments.map((row) => [row.candidate, row]),
        );
        const ids = emptyIds();

        for (const candidate of candidates) {
            const age = calendarDaysBetween(candidate.stage_updated_on, today);
            if (
                candidate.stage === 'Applied' &&
                age > ALERT_THRESHOLDS.not_reviewed_days
            ) {
                ids.not_reviewed.push(candidate.candidate_id);
            }
            if (
                candidate.stage === 'Shortlisted' &&
                age > ALERT_THRESHOLDS.assessment_not_sent_days
            ) {
                ids.assessment_not_sent.push(candidate.candidate_id);
            }
            if (candidate.stage === 'Assessment sent') {
                const assessment = assessmentByCandidate.get(
                    candidate.candidate_id,
                );
                if (
                    assessment &&
                    !assessment.submitted_on &&
                    assessment.due_on < today
                ) {
                    ids.assessment_overdue.push(candidate.candidate_id);
                }
            }
            if (candidate.stage === 'Assessment submitted') {
                const assessment = assessmentByCandidate.get(
                    candidate.candidate_id,
                );
                if (
                    assessment &&
                    assessment.result === 'Pending' &&
                    assessment.submitted_on &&
                    calendarDaysBetween(assessment.submitted_on, today) >
                        ALERT_THRESHOLDS.review_pending_days
                ) {
                    ids.review_pending.push(candidate.candidate_id);
                }
            }
            if (
                (candidate.stage === 'Interview 1' ||
                    candidate.stage === 'Interview 2') &&
                age > ALERT_THRESHOLDS.interview_not_scheduled_days
            ) {
                const round = candidate.stage === 'Interview 1' ? 1 : 2;
                const hasBooked = interviews.some(
                    (interview) =>
                        interview.candidate === candidate.candidate_id &&
                        interview.round === round &&
                        (interview.status === 'Scheduled' ||
                            interview.status === 'Done'),
                );
                if (!hasBooked) {
                    ids.interview_not_scheduled.push(candidate.candidate_id);
                }
            }
            if (
                candidate.stage === 'Offer made' &&
                age > ALERT_THRESHOLDS.offer_pending_days
            ) {
                ids.offer_pending.push(candidate.candidate_id);
            }
        }

        for (const interview of interviews) {
            if (interview.status !== 'Scheduled') {
                continue;
            }
            const interviewDay = datePart(interview.scheduled_at);
            if (
                calendarDaysBetween(interviewDay, today) >
                ALERT_THRESHOLDS.feedback_missing_days
            ) {
                ids.feedback_missing.push(interview.interview_id);
            }
        }

        const needs_attention = Object.fromEntries(
            ALERT_KEYS.map((key) => [key, ids[key].length]),
        ) as DashboardSummary['needs_attention'];

        const hiredCandidates = candidates.filter(
            (candidate) => candidate.stage === 'Hired',
        );
        const hireDays = hiredCandidates.map((candidate) =>
            calendarDaysBetween(candidate.applied_on, candidate.stage_updated_on),
        );
        const avg_days_to_hire =
            hireDays.length === 0
                ? 0
                : Math.round(
                      (hireDays.reduce((sum, days) => sum + days, 0) /
                          hireDays.length) *
                          10,
                  ) / 10;

        const inProgressStages = new Set<string>(ACTIVE_STAGES);
        const openingsSummary = openings.map((opening) => {
            const rows = candidates.filter(
                (candidate) => candidate.opening === opening.opening_id,
            );
            return {
                opening_id: opening.opening_id,
                status: opening.status,
                positions: opening.positions,
                applicants: rows.length,
                in_progress: rows.filter((row) =>
                    inProgressStages.has(row.stage),
                ).length,
                hired: rows.filter((row) => row.stage === 'Hired').length,
            };
        });

        const by_source: DashboardSummary['by_source'] = {};
        for (const candidate of candidates) {
            const entry = by_source[candidate.source] ?? {
                applicants: 0,
                hired: 0,
            };
            entry.applicants += 1;
            if (candidate.stage === 'Hired') {
                entry.hired += 1;
            }
            by_source[candidate.source] = entry;
        }

        return {
            open_positions: openings
                .filter((opening) => opening.status === 'Open')
                .reduce((sum, opening) => sum + opening.positions, 0),
            applicants: candidates.length,
            in_progress: candidates.filter((candidate) =>
                inProgressStages.has(candidate.stage),
            ).length,
            hired: hiredCandidates.length,
            avg_days_to_hire,
            assessments: {
                sent: assessments.length,
                submitted: assessments.filter((row) => Boolean(row.submitted_on))
                    .length,
                passed: assessments.filter((row) => row.result === 'Pass')
                    .length,
            },
            interviews_done: interviews.filter(
                (interview) => interview.status === 'Done',
            ).length,
            needs_attention,
            needs_attention_ids: ids,
            openings: openingsSummary,
            by_source,
        };
    }
}

export { DashboardSummaryService };
