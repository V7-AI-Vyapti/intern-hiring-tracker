type HiringCaller = {
    email: string;
    roles: string[];
    /** Auth principal id when available (used for optional role resolution). */
    userId?: string;
};

type TeamMemberRow = {
    member_id: string;
    name: string;
    email: string;
    role: string;
    team: string;
    status: string;
};

type OpeningRow = {
    opening_id: string;
    title: string;
    team: string;
    location: string;
    stipend_inr: number;
    positions: number;
    posted_on: string | null;
    closes_on: string | null;
    status: string;
    interview_rounds: number;
    assessment_name: string;
    assessment_days: number;
    owner: string;
};

type CandidateRow = {
    candidate_id: string;
    opening: string;
    name: string;
    email: string;
    college: string;
    degree: string;
    graduation_year: number;
    source: string;
    resume_link: string;
    applied_on: string;
    stage: string;
    stage_updated_on: string;
    rejected_reason: string | null;
    joining_on: string | null;
    notes: string | null;
};

type AssessmentRow = {
    assessment_id: string;
    candidate: string;
    reviewer: string;
    sent_on: string;
    due_on: string;
    submitted_on: string | null;
    submission_link: string | null;
    score: number | null;
    result: string;
    reviewed_on: string | null;
};

type InterviewRow = {
    interview_id: string;
    candidate: string;
    round: number;
    interviewer: string;
    scheduled_at: string;
    mode: string;
    status: string;
    rating: number | null;
    recommendation: string | null;
    feedback: string | null;
    feedback_on: string | null;
};

type NeedsAttentionKey =
    | 'not_reviewed'
    | 'assessment_not_sent'
    | 'assessment_overdue'
    | 'review_pending'
    | 'interview_not_scheduled'
    | 'feedback_missing'
    | 'offer_pending';

type NeedsAttentionCounts = Record<NeedsAttentionKey, number>;
type NeedsAttentionIds = Record<NeedsAttentionKey, string[]>;

type DashboardSummary = {
    open_positions: number;
    applicants: number;
    in_progress: number;
    hired: number;
    avg_days_to_hire: number;
    assessments: {
        sent: number;
        submitted: number;
        passed: number;
    };
    interviews_done: number;
    /** Spec sample JSON uses numeric counts here. */
    needs_attention: NeedsAttentionCounts;
    /** Id lists for each alert (candidate_id, or interview_id for feedback_missing). */
    needs_attention_ids: NeedsAttentionIds;
    openings: Array<{
        opening_id: string;
        status: string;
        positions: number;
        applicants: number;
        in_progress: number;
        hired: number;
    }>;
    by_source: Record<
        string,
        {
            applicants: number;
            hired: number;
        }
    >;
};

type HiringPersistenceAdapter = {
    withTransaction<T>(work: () => Promise<T>): Promise<T>;
    findTeamMemberByEmail(email: string): Promise<TeamMemberRow | null>;
    findTeamMemberById(memberId: string): Promise<TeamMemberRow | null>;
    findOpeningById(openingId: string): Promise<OpeningRow | null>;
    findCandidateById(candidateId: string): Promise<CandidateRow | null>;
    findAssessmentByCandidate(
        candidateId: string,
    ): Promise<AssessmentRow | null>;
    findInterviewById(interviewId: string): Promise<InterviewRow | null>;
    listCandidates(): Promise<CandidateRow[]>;
    listOpenings(): Promise<OpeningRow[]>;
    listAssessments(): Promise<AssessmentRow[]>;
    listInterviews(): Promise<InterviewRow[]>;
    listInterviewsForCandidate(candidateId: string): Promise<InterviewRow[]>;
    countHiredForOpening(openingId: string): Promise<number>;
    nextCandidateId(): Promise<string>;
    nextAssessmentId(): Promise<string>;
    nextInterviewId(): Promise<string>;
    createCandidate(row: CandidateRow): Promise<CandidateRow>;
    updateCandidate(
        candidateId: string,
        patch: Partial<CandidateRow>,
    ): Promise<CandidateRow>;
    createAssessment(
        row: Omit<AssessmentRow, never>,
    ): Promise<AssessmentRow>;
    updateAssessment(
        assessmentId: string,
        patch: Partial<AssessmentRow>,
    ): Promise<AssessmentRow>;
    createInterview(row: InterviewRow): Promise<InterviewRow>;
    updateInterview(
        interviewId: string,
        patch: Partial<InterviewRow>,
    ): Promise<InterviewRow>;
    cancelScheduledInterviews(candidateId: string): Promise<number>;
};

type HiringModuleRootOptions = {
    routePrefix?: string;
    persistence: HiringPersistenceAdapter;
    today?: () => string;
    nowIso?: () => string;
    /**
     * Optional role resolver for generated apps where `@vyapti/auth` does not
     * attach `roles` on `req.user`. Host bootstrap typically looks up
     * `user.role_id` → `role.name`.
     */
    resolveRoles?: (args: {
        userId: string;
        email: string;
    }) => Promise<string[]> | string[];
};

export type {
    AssessmentRow,
    CandidateRow,
    DashboardSummary,
    HiringCaller,
    HiringModuleRootOptions,
    HiringPersistenceAdapter,
    InterviewRow,
    NeedsAttentionCounts,
    NeedsAttentionIds,
    NeedsAttentionKey,
    OpeningRow,
    TeamMemberRow,
};
