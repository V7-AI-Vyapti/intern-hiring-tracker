import type {
    AssessmentRow,
    CandidateRow,
    InterviewRow,
    OpeningRow,
    TeamMemberRow,
} from '@vyapti/hiring';
import { GENERATED_HIRING_FK_BUSINESS_FIELDS } from '../hiring.constants';
import {
    readBusinessForeignKey,
    readNullableNumber,
    readNullableString,
    readNumber,
    readString,
} from './record-readers.util';

const mapTeamMemberRow = (row: unknown): TeamMemberRow => ({
    member_id: readString(row, 'member_id'),
    name: readString(row, 'name'),
    email: readString(row, 'email'),
    role: readString(row, 'role'),
    team: readString(row, 'team'),
    status: readString(row, 'status'),
});

const mapOpeningRow = (row: unknown): OpeningRow => ({
    opening_id: readString(row, 'opening_id'),
    title: readString(row, 'title'),
    team: readString(row, 'team'),
    location: readString(row, 'location'),
    stipend_inr: readNumber(row, 'stipend_inr'),
    positions: readNumber(row, 'positions'),
    posted_on: readNullableString(row, 'posted_on'),
    closes_on: readNullableString(row, 'closes_on'),
    status: readString(row, 'status'),
    interview_rounds: readNumber(row, 'interview_rounds'),
    assessment_name: readString(row, 'assessment_name'),
    assessment_days: readNumber(row, 'assessment_days'),
    owner: readBusinessForeignKey(
        row,
        'owner',
        GENERATED_HIRING_FK_BUSINESS_FIELDS.owner,
    ),
});

const mapCandidateRow = (row: unknown): CandidateRow => ({
    candidate_id: readString(row, 'candidate_id'),
    opening: readBusinessForeignKey(
        row,
        'opening',
        GENERATED_HIRING_FK_BUSINESS_FIELDS.opening,
    ),
    name: readString(row, 'name'),
    email: readString(row, 'email'),
    college: readString(row, 'college'),
    degree: readString(row, 'degree'),
    graduation_year: readNumber(row, 'graduation_year'),
    source: readString(row, 'source'),
    resume_link: readString(row, 'resume_link'),
    applied_on: readString(row, 'applied_on'),
    stage: readString(row, 'stage'),
    stage_updated_on: readString(row, 'stage_updated_on'),
    rejected_reason: readNullableString(row, 'rejected_reason'),
    joining_on: readNullableString(row, 'joining_on'),
    notes: readNullableString(row, 'notes'),
});

const mapAssessmentRow = (row: unknown): AssessmentRow => ({
    assessment_id: readString(row, 'assessment_id'),
    candidate: readBusinessForeignKey(
        row,
        'candidate',
        GENERATED_HIRING_FK_BUSINESS_FIELDS.candidate,
    ),
    reviewer: readBusinessForeignKey(
        row,
        'reviewer',
        GENERATED_HIRING_FK_BUSINESS_FIELDS.reviewer,
    ),
    sent_on: readString(row, 'sent_on'),
    due_on: readString(row, 'due_on'),
    submitted_on: readNullableString(row, 'submitted_on'),
    submission_link: readNullableString(row, 'submission_link'),
    score: readNullableNumber(row, 'score'),
    result: readString(row, 'result'),
    reviewed_on: readNullableString(row, 'reviewed_on'),
});

const mapInterviewRow = (row: unknown): InterviewRow => ({
    interview_id: readString(row, 'interview_id'),
    candidate: readBusinessForeignKey(
        row,
        'candidate',
        GENERATED_HIRING_FK_BUSINESS_FIELDS.candidate,
    ),
    round: readNumber(row, 'round'),
    interviewer: readBusinessForeignKey(
        row,
        'interviewer',
        GENERATED_HIRING_FK_BUSINESS_FIELDS.interviewer,
    ),
    scheduled_at: readString(row, 'scheduled_at'),
    mode: readString(row, 'mode'),
    status: readString(row, 'status'),
    rating: readNullableNumber(row, 'rating'),
    recommendation: readNullableString(row, 'recommendation'),
    feedback: readNullableString(row, 'feedback'),
    feedback_on: readNullableString(row, 'feedback_on'),
});

export {
    mapAssessmentRow,
    mapCandidateRow,
    mapInterviewRow,
    mapOpeningRow,
    mapTeamMemberRow,
};
