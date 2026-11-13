const HIRING_ROUTE_PREFIX = '/hiring';

/** RBAC catalog resource for hiring workflow actions. */
const HIRING_RESOURCE = 'hiring';

const ACTIVE_STAGES = [
    'Applied',
    'Shortlisted',
    'Assessment sent',
    'Assessment submitted',
    'Interview 1',
    'Interview 2',
    'Offer made',
] as const;

const TERMINAL_STAGES = ['Hired', 'Rejected', 'Withdrawn'] as const;

const PASS_SCORE = 60;

const ALERT_THRESHOLDS = {
    not_reviewed_days: 5,
    assessment_not_sent_days: 2,
    review_pending_days: 2,
    interview_not_scheduled_days: 3,
    feedback_missing_days: 1,
    offer_pending_days: 5,
} as const;

const HIRING_ACTIONS = [
    'shortlist',
    'reject',
    'withdraw',
    'send_assessment',
    'record_submission',
    'review_assessment',
    'schedule_interview',
    'record_feedback',
    'mark_no_show',
    'cancel_interview',
    'make_offer',
    'record_offer_answer',
    'dashboard_summary',
] as const;

export {
    ACTIVE_STAGES,
    ALERT_THRESHOLDS,
    HIRING_ACTIONS,
    HIRING_RESOURCE,
    HIRING_ROUTE_PREFIX,
    PASS_SCORE,
    TERMINAL_STAGES,
};
