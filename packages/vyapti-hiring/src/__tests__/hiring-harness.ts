import { DashboardSummaryService } from '../services/dashboard-summary.service.js';
import { HiringActionsService } from '../services/hiring-actions.service.js';
import { PublicApplyService } from '../services/public-apply.service.js';
import type { HiringModuleRootOptions } from '../types/hiring.types.js';
import { InMemoryHiringPersistenceAdapter } from './in-memory-hiring.adapter.js';

const TODAY = '2026-11-12';

const buildHiringHarness = (
    today: string = TODAY,
): {
    adapter: InMemoryHiringPersistenceAdapter;
    actions: HiringActionsService;
    dashboard: DashboardSummaryService;
    apply: PublicApplyService;
    today: string;
} => {
    const adapter = new InMemoryHiringPersistenceAdapter();
    const options: HiringModuleRootOptions = {
        persistence: adapter,
        today: () => today,
        nowIso: () => `${today}T12:00:00+05:30`,
    };
    const actions = new HiringActionsService(adapter, options);
    const dashboard = new DashboardSummaryService(adapter, {
        ...options,
        today: () => today,
    });
    const apply = new PublicApplyService(adapter, options);
    seedBaseline(adapter);
    return { adapter, actions, dashboard, apply, today };
};

const seedBaseline = (adapter: InMemoryHiringPersistenceAdapter): void => {
    adapter.teamMembers = [
        {
            member_id: 'TM-01',
            name: 'Fatima Sheikh',
            email: 'fatima@kiranbyte.example',
            role: 'Recruiter',
            team: 'HR',
            status: 'Active',
        },
        {
            member_id: 'TM-07',
            name: 'Meera Iyer',
            email: 'meera@kiranbyte.example',
            role: 'Interviewer',
            team: 'Engineering',
            status: 'Active',
        },
        {
            member_id: 'TM-08',
            name: 'Karan Patel',
            email: 'karan@kiranbyte.example',
            role: 'Interviewer',
            team: 'Engineering',
            status: 'Active',
        },
        {
            member_id: 'TM-03',
            name: 'Aarav Shah',
            email: 'aarav@kiranbyte.example',
            role: 'Interviewer',
            team: 'Engineering',
            status: 'Active',
        },
    ];

    adapter.openings = [
        {
            opening_id: 'OPN-03',
            title: 'Backend intern',
            team: 'Engineering',
            location: 'Bengaluru office',
            stipend_inr: 25000,
            positions: 4,
            posted_on: '2026-09-01',
            closes_on: '2026-11-30',
            status: 'Open',
            interview_rounds: 2,
            assessment_name: 'API take-home',
            assessment_days: 3,
            owner: 'TM-01',
        },
        {
            opening_id: 'OPN-04',
            title: 'Frontend intern',
            team: 'Engineering',
            location: 'Remote',
            stipend_inr: 20000,
            positions: 1,
            posted_on: '2026-09-01',
            closes_on: '2026-11-30',
            status: 'Open',
            interview_rounds: 1,
            assessment_name: 'UI take-home',
            assessment_days: 4,
            owner: 'TM-01',
        },
        {
            opening_id: 'OPN-06',
            title: 'Draft intern',
            team: 'Engineering',
            location: 'Hybrid',
            stipend_inr: 15000,
            positions: 1,
            posted_on: null,
            closes_on: null,
            status: 'Draft',
            interview_rounds: 1,
            assessment_name: 'Draft assessment',
            assessment_days: 3,
            owner: 'TM-01',
        },
    ];

    adapter.candidates = [
        {
            candidate_id: 'CAN-0376',
            opening: 'OPN-04',
            name: 'Applied Candidate',
            email: 'applied@example.com',
            college: 'Test College',
            degree: 'B.E.',
            graduation_year: 2027,
            source: 'LinkedIn',
            resume_link: 'https://drive.example.com/r/CAN-0376.pdf',
            applied_on: '2026-10-01',
            stage: 'Applied',
            stage_updated_on: '2026-10-01',
            rejected_reason: null,
            joining_on: null,
            notes: null,
        },
        {
            candidate_id: 'CAN-0248',
            opening: 'OPN-03',
            name: 'Shortlisted Candidate',
            email: 'shortlisted@example.com',
            college: 'Test College',
            degree: 'B.E.',
            graduation_year: 2027,
            source: 'LinkedIn',
            resume_link: 'https://drive.example.com/r/CAN-0248.pdf',
            applied_on: '2026-10-01',
            stage: 'Shortlisted',
            stage_updated_on: '2026-11-01',
            rejected_reason: null,
            joining_on: null,
            notes: null,
        },
        {
            candidate_id: 'CAN-0177',
            opening: 'OPN-03',
            name: 'Assessment Sent Candidate',
            email: 'sent@example.com',
            college: 'Test College',
            degree: 'B.E.',
            graduation_year: 2027,
            source: 'Internshala',
            resume_link: 'https://drive.example.com/r/CAN-0177.pdf',
            applied_on: '2026-10-01',
            stage: 'Assessment sent',
            stage_updated_on: '2026-11-01',
            rejected_reason: null,
            joining_on: null,
            notes: null,
        },
        {
            candidate_id: 'CAN-0354',
            opening: 'OPN-03',
            name: 'Pass Review Candidate',
            email: 'pass@example.com',
            college: 'Test College',
            degree: 'B.E.',
            graduation_year: 2027,
            source: 'Referral',
            resume_link: 'https://drive.example.com/r/CAN-0354.pdf',
            applied_on: '2026-10-01',
            stage: 'Assessment submitted',
            stage_updated_on: '2026-11-05',
            rejected_reason: null,
            joining_on: null,
            notes: null,
        },
        {
            candidate_id: 'CAN-0361',
            opening: 'OPN-03',
            name: 'Fail Review Candidate',
            email: 'fail@example.com',
            college: 'Test College',
            degree: 'B.E.',
            graduation_year: 2027,
            source: 'Campus drive',
            resume_link: 'https://drive.example.com/r/CAN-0361.pdf',
            applied_on: '2026-10-01',
            stage: 'Assessment submitted',
            stage_updated_on: '2026-11-05',
            rejected_reason: null,
            joining_on: null,
            notes: null,
        },
        {
            candidate_id: 'CAN-0324',
            opening: 'OPN-03',
            name: 'Needs Interview Candidate',
            email: 'needs-interview@example.com',
            college: 'Test College',
            degree: 'B.E.',
            graduation_year: 2027,
            source: 'LinkedIn',
            resume_link: 'https://drive.example.com/r/CAN-0324.pdf',
            applied_on: '2026-10-01',
            stage: 'Interview 1',
            stage_updated_on: '2026-11-01',
            rejected_reason: null,
            joining_on: null,
            notes: null,
        },
        {
            candidate_id: 'CAN-0235',
            opening: 'OPN-03',
            name: 'Booked Interview Candidate',
            email: 'booked@example.com',
            college: 'Test College',
            degree: 'B.E.',
            graduation_year: 2027,
            source: 'LinkedIn',
            resume_link: 'https://drive.example.com/r/CAN-0235.pdf',
            applied_on: '2026-10-01',
            stage: 'Interview 1',
            stage_updated_on: '2026-11-10',
            rejected_reason: null,
            joining_on: null,
            notes: null,
        },
        {
            candidate_id: 'CAN-0232',
            opening: 'OPN-03',
            name: 'Offer Pending Candidate',
            email: 'offer@example.com',
            college: 'Test College',
            degree: 'B.E.',
            graduation_year: 2027,
            source: 'LinkedIn',
            resume_link: 'https://drive.example.com/r/CAN-0232.pdf',
            applied_on: '2026-09-01',
            stage: 'Offer made',
            stage_updated_on: '2026-11-01',
            rejected_reason: null,
            joining_on: null,
            notes: null,
        },
    ];

    adapter.assessments = [
        {
            assessment_id: 'ASM-177',
            candidate: 'CAN-0177',
            reviewer: 'TM-07',
            sent_on: '2026-11-01',
            due_on: '2026-11-04',
            submitted_on: null,
            submission_link: null,
            score: null,
            result: 'Pending',
            reviewed_on: null,
        },
        {
            assessment_id: 'ASM-354',
            candidate: 'CAN-0354',
            reviewer: 'TM-07',
            sent_on: '2026-11-01',
            due_on: '2026-11-04',
            submitted_on: '2026-11-05',
            submission_link: 'https://drive.example.com/s/CAN-0354.zip',
            score: null,
            result: 'Pending',
            reviewed_on: null,
        },
        {
            assessment_id: 'ASM-361',
            candidate: 'CAN-0361',
            reviewer: 'TM-07',
            sent_on: '2026-11-01',
            due_on: '2026-11-04',
            submitted_on: '2026-11-05',
            submission_link: 'https://drive.example.com/s/CAN-0361.zip',
            score: null,
            result: 'Pending',
            reviewed_on: null,
        },
    ];

    adapter.interviews = [
        {
            interview_id: 'INT-086',
            candidate: 'CAN-0235',
            round: 1,
            interviewer: 'TM-08',
            scheduled_at: '2026-11-10T11:00',
            mode: 'Video call',
            status: 'Scheduled',
            rating: null,
            recommendation: null,
            feedback: null,
            feedback_on: null,
        },
    ];
};

const recruiter = {
    email: 'fatima@kiranbyte.example',
    roles: ['Recruiter'],
};

const interviewer = {
    email: 'meera@kiranbyte.example',
    roles: ['Interviewer'],
};

const aarav = {
    email: 'aarav@kiranbyte.example',
    roles: ['Interviewer'],
};

const karan = {
    email: 'karan@kiranbyte.example',
    roles: ['Interviewer'],
};

export {
    TODAY,
    aarav,
    buildHiringHarness,
    interviewer,
    karan,
    recruiter,
};
