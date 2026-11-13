const MEMBER_ROLES = ['Recruiter', 'Interviewer'] as const;
const MEMBER_STATUSES = ['Active', 'Left'] as const;
const OPENING_STATUSES = ['Draft', 'Open', 'On hold', 'Closed'] as const;
const WORK_LOCATIONS = ['Bengaluru office', 'Remote', 'Hybrid'] as const;
const STAGES = [
    'Applied',
    'Shortlisted',
    'Assessment sent',
    'Assessment submitted',
    'Interview 1',
    'Interview 2',
    'Offer made',
    'Hired',
    'Rejected',
    'Withdrawn',
] as const;
const SOURCES = [
    'Careers page form',
    'LinkedIn',
    'Internshala',
    'Referral',
    'Campus drive',
] as const;
const ASSESSMENT_RESULTS = ['Pending', 'Pass', 'Fail'] as const;
const INTERVIEW_STATUSES = ['Scheduled', 'Done', 'No-show', 'Cancelled'] as const;
const INTERVIEW_MODES = ['Video call', 'In person'] as const;
const RECOMMENDATIONS = ['Hire', 'Next round', 'Reject'] as const;

export {
    ASSESSMENT_RESULTS,
    INTERVIEW_MODES,
    INTERVIEW_STATUSES,
    MEMBER_ROLES,
    MEMBER_STATUSES,
    OPENING_STATUSES,
    RECOMMENDATIONS,
    SOURCES,
    STAGES,
    WORK_LOCATIONS,
};
