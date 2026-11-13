import type {
    AssessmentRow,
    CandidateRow,
    HiringPersistenceAdapter,
    InterviewRow,
    OpeningRow,
    TeamMemberRow,
} from '../types/hiring.types.js';

const clone = <T>(value: T): T => structuredClone(value);

class InMemoryHiringPersistenceAdapter implements HiringPersistenceAdapter {
    teamMembers: TeamMemberRow[] = [];
    openings: OpeningRow[] = [];
    candidates: CandidateRow[] = [];
    assessments: AssessmentRow[] = [];
    interviews: InterviewRow[] = [];
    private candidateSeq = 500;
    private assessmentSeq = 200;
    private interviewSeq = 200;

    async withTransaction<T>(work: () => Promise<T>): Promise<T> {
        return work();
    }

    async findTeamMemberByEmail(email: string) {
        return (
            this.teamMembers.find(
                (row) => row.email.toLowerCase() === email.toLowerCase(),
            ) ?? null
        );
    }

    async findTeamMemberById(memberId: string) {
        return (
            this.teamMembers.find((row) => row.member_id === memberId) ?? null
        );
    }

    async findOpeningById(openingId: string) {
        return (
            this.openings.find((row) => row.opening_id === openingId) ?? null
        );
    }

    async findCandidateById(candidateId: string) {
        return (
            this.candidates.find((row) => row.candidate_id === candidateId) ??
            null
        );
    }

    async findAssessmentByCandidate(candidateId: string) {
        return (
            this.assessments.find((row) => row.candidate === candidateId) ??
            null
        );
    }

    async findInterviewById(interviewId: string) {
        return (
            this.interviews.find((row) => row.interview_id === interviewId) ??
            null
        );
    }

    async listCandidates() {
        return clone(this.candidates);
    }

    async listOpenings() {
        return clone(this.openings);
    }

    async listAssessments() {
        return clone(this.assessments);
    }

    async listInterviews() {
        return clone(this.interviews);
    }

    async listInterviewsForCandidate(candidateId: string) {
        return clone(
            this.interviews.filter((row) => row.candidate === candidateId),
        );
    }

    async countHiredForOpening(openingId: string) {
        return this.candidates.filter(
            (row) => row.opening === openingId && row.stage === 'Hired',
        ).length;
    }

    async nextCandidateId() {
        this.candidateSeq += 1;
        return `CAN-${String(this.candidateSeq).padStart(4, '0')}`;
    }

    async nextAssessmentId() {
        this.assessmentSeq += 1;
        return `ASM-${String(this.assessmentSeq).padStart(3, '0')}`;
    }

    async nextInterviewId() {
        this.interviewSeq += 1;
        return `INT-${String(this.interviewSeq).padStart(3, '0')}`;
    }

    async createCandidate(row: CandidateRow) {
        this.candidates.push(clone(row));
        return clone(row);
    }

    async updateCandidate(candidateId: string, patch: Partial<CandidateRow>) {
        const index = this.candidates.findIndex(
            (row) => row.candidate_id === candidateId,
        );
        if (index < 0) {
            throw new Error(`missing candidate ${candidateId}`);
        }
        this.candidates[index] = { ...this.candidates[index], ...patch };
        return clone(this.candidates[index]);
    }

    async createAssessment(row: AssessmentRow) {
        this.assessments.push(clone(row));
        return clone(row);
    }

    async updateAssessment(
        assessmentId: string,
        patch: Partial<AssessmentRow>,
    ) {
        const index = this.assessments.findIndex(
            (row) => row.assessment_id === assessmentId,
        );
        if (index < 0) {
            throw new Error(`missing assessment ${assessmentId}`);
        }
        this.assessments[index] = { ...this.assessments[index], ...patch };
        return clone(this.assessments[index]);
    }

    async createInterview(row: InterviewRow) {
        this.interviews.push(clone(row));
        return clone(row);
    }

    async updateInterview(interviewId: string, patch: Partial<InterviewRow>) {
        const index = this.interviews.findIndex(
            (row) => row.interview_id === interviewId,
        );
        if (index < 0) {
            throw new Error(`missing interview ${interviewId}`);
        }
        this.interviews[index] = { ...this.interviews[index], ...patch };
        return clone(this.interviews[index]);
    }

    async cancelScheduledInterviews(candidateId: string) {
        let count = 0;
        for (const interview of this.interviews) {
            if (
                interview.candidate === candidateId &&
                interview.status === 'Scheduled'
            ) {
                interview.status = 'Cancelled';
                count += 1;
            }
        }
        return count;
    }
}

export { InMemoryHiringPersistenceAdapter };
