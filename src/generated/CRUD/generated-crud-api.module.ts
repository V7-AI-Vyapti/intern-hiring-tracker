import { Module } from '@nestjs/common';
import { GeneratedAccessPolicyModule } from '../../access-policy/access-policy.module';
import {
    CreateJobAssessmentController,
    CreateJobAssessmentService,
} from '@generated-crud/job_assessment/create_job_assessment.api';
import {
    CreateJobCandidateController,
    CreateJobCandidateService,
} from '@generated-crud/job_candidate/create_job_candidate.api';
import {
    CreateJobInterviewController,
    CreateJobInterviewService,
} from '@generated-crud/job_interview/create_job_interview.api';
import {
    CreateJobOpeningController,
    CreateJobOpeningService,
} from '@generated-crud/job_opening/create_job_opening.api';
import {
    CreateTeamMemberController,
    CreateTeamMemberService,
} from '@generated-crud/team_member/create_team_member.api';
import {
    ListJobAssessmentController,
    ListJobAssessmentService,
} from '@generated-crud/job_assessment/list_job_assessment.api';
import {
    ListJobCandidateController,
    ListJobCandidateService,
} from '@generated-crud/job_candidate/list_job_candidate.api';
import {
    ListJobInterviewController,
    ListJobInterviewService,
} from '@generated-crud/job_interview/list_job_interview.api';
import {
    ListJobOpeningController,
    ListJobOpeningService,
} from '@generated-crud/job_opening/list_job_opening.api';
import {
    ListTeamMemberController,
    ListTeamMemberService,
} from '@generated-crud/team_member/list_team_member.api';
import {
    UpdateJobAssessmentController,
    UpdateJobAssessmentService,
} from '@generated-crud/job_assessment/update_job_assessment.api';
import {
    UpdateJobCandidateController,
    UpdateJobCandidateService,
} from '@generated-crud/job_candidate/update_job_candidate.api';
import {
    UpdateJobInterviewController,
    UpdateJobInterviewService,
} from '@generated-crud/job_interview/update_job_interview.api';
import {
    UpdateJobOpeningController,
    UpdateJobOpeningService,
} from '@generated-crud/job_opening/update_job_opening.api';
import {
    UpdateTeamMemberController,
    UpdateTeamMemberService,
} from '@generated-crud/team_member/update_team_member.api';
import {
    ViewJobAssessmentController,
    ViewJobAssessmentService,
} from '@generated-crud/job_assessment/view_job_assessment.api';
import {
    ViewJobCandidateController,
    ViewJobCandidateService,
} from '@generated-crud/job_candidate/view_job_candidate.api';
import {
    ViewJobInterviewController,
    ViewJobInterviewService,
} from '@generated-crud/job_interview/view_job_interview.api';
import {
    ViewJobOpeningController,
    ViewJobOpeningService,
} from '@generated-crud/job_opening/view_job_opening.api';
import {
    ViewTeamMemberController,
    ViewTeamMemberService,
} from '@generated-crud/team_member/view_team_member.api';

@Module({
    imports: [GeneratedAccessPolicyModule],
    controllers: [
        CreateJobAssessmentController,
        CreateJobCandidateController,
        CreateJobInterviewController,
        CreateJobOpeningController,
        CreateTeamMemberController,
        ListJobAssessmentController,
        ListJobCandidateController,
        ListJobInterviewController,
        ListJobOpeningController,
        ListTeamMemberController,
        UpdateJobAssessmentController,
        UpdateJobCandidateController,
        UpdateJobInterviewController,
        UpdateJobOpeningController,
        UpdateTeamMemberController,
        ViewJobAssessmentController,
        ViewJobCandidateController,
        ViewJobInterviewController,
        ViewJobOpeningController,
        ViewTeamMemberController,
    ],
    providers: [
        CreateJobAssessmentService,
        CreateJobCandidateService,
        CreateJobInterviewService,
        CreateJobOpeningService,
        CreateTeamMemberService,
        ListJobAssessmentService,
        ListJobCandidateService,
        ListJobInterviewService,
        ListJobOpeningService,
        ListTeamMemberService,
        UpdateJobAssessmentService,
        UpdateJobCandidateService,
        UpdateJobInterviewService,
        UpdateJobOpeningService,
        UpdateTeamMemberService,
        ViewJobAssessmentService,
        ViewJobCandidateService,
        ViewJobInterviewService,
        ViewJobOpeningService,
        ViewTeamMemberService,
    ],
})
export class GeneratedCrudApiModule {}
