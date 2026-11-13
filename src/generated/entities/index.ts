import { buildEntitySchema } from '@vyapti/core';
import { JobAssessment } from './job_assessment.entity';
import { JobCandidate } from './job_candidate.entity';
import { JobInterview } from './job_interview.entity';
import { JobOpening } from './job_opening.entity';
import { TeamMember } from './team_member.entity';

export const entitySchemas = [
    buildEntitySchema(JobAssessment),
    buildEntitySchema(JobCandidate),
    buildEntitySchema(JobInterview),
    buildEntitySchema(JobOpening),
    buildEntitySchema(TeamMember),
];
