import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
    aarav,
    buildHiringHarness,
    interviewer,
    karan,
    recruiter,
} from './hiring-harness.js';

describe('HiringActionsService', () => {
    it('shortlist moves Applied to Shortlisted for recruiters only', async () => {
        const { actions, adapter } = buildHiringHarness();
        await assert.rejects(
            () => actions.shortlist(aarav, 'CAN-0376'),
            (error: Error & { status?: number }) =>
                error.name === 'ForbiddenException' ||
                /Forbidden/i.test(String(error.message)),
        );
        const updated = await actions.shortlist(recruiter, 'CAN-0376');
        assert.equal(updated.stage, 'Shortlisted');
        assert.equal(updated.stage_updated_on, '2026-11-12');
        assert.equal(
            adapter.candidates.find((row) => row.candidate_id === 'CAN-0376')
                ?.stage,
            'Shortlisted',
        );
    });

    it('reject and withdraw require a reason and cancel scheduled interviews', async () => {
        const { actions, adapter } = buildHiringHarness();
        await assert.rejects(
            () => actions.reject(recruiter, 'CAN-0235', ''),
            (error: { response?: { message?: { message?: string } } }) =>
                String(error).includes('Give a reason') ||
                error.response?.message?.message === 'Give a reason',
        );
        const rejected = await actions.reject(
            recruiter,
            'CAN-0235',
            'Not a fit',
        );
        assert.equal(rejected.stage, 'Rejected');
        assert.equal(
            adapter.interviews.find((row) => row.interview_id === 'INT-086')
                ?.status,
            'Cancelled',
        );

        const { actions: actions2, adapter: adapter2 } = buildHiringHarness();
        const withdrawn = await actions2.withdraw(
            recruiter,
            'CAN-0376',
            'Candidate withdrew',
        );
        assert.equal(withdrawn.stage, 'Withdrawn');
        assert.equal(
            adapter2.candidates.find((row) => row.candidate_id === 'CAN-0376')
                ?.rejected_reason,
            'Candidate withdrew',
        );
    });

    it('send_assessment creates due_on from assessment_days and blocks wrong stage', async () => {
        const { actions } = buildHiringHarness();
        await assert.rejects(() =>
            actions.sendAssessment(recruiter, 'CAN-0376', 'TM-07'),
        );
        const result = await actions.sendAssessment(
            recruiter,
            'CAN-0248',
            'TM-07',
        );
        assert.equal(result.candidate.stage, 'Assessment sent');
        assert.equal(result.assessment.due_on, '2026-11-15');
        assert.equal(result.assessment.result, 'Pending');
        assert.equal(result.assessment.reviewer, 'TM-07');
    });

    it('record_submission and review_assessment pass/fail paths', async () => {
        const { actions, adapter } = buildHiringHarness();
        const submitted = await actions.recordSubmission(
            recruiter,
            'CAN-0177',
            'https://drive.example.com/s/CAN-0177.zip',
        );
        assert.equal(submitted.candidate.stage, 'Assessment submitted');
        assert.equal(submitted.assessment.submitted_on, '2026-11-12');

        const passed = await actions.reviewAssessment(
            interviewer,
            'CAN-0354',
            72,
        );
        assert.equal(passed.assessment.result, 'Pass');
        assert.equal(passed.candidate.stage, 'Interview 1');

        const failed = await actions.reviewAssessment(
            recruiter,
            'CAN-0361',
            45,
        );
        assert.equal(failed.assessment.result, 'Fail');
        assert.equal(failed.candidate.stage, 'Rejected');
        assert.equal(
            failed.candidate.rejected_reason,
            'Assessment score below 60',
        );

        await assert.rejects(() =>
            actions.reviewAssessment(aarav, 'CAN-0354', 80),
        );
        assert.equal(
            adapter.assessments.find((row) => row.candidate === 'CAN-0354')
                ?.score,
            72,
        );
    });

    it('schedule_interview books round and rejects duplicates', async () => {
        const { actions } = buildHiringHarness();
        const created = await actions.scheduleInterview(recruiter, {
            candidate_id: 'CAN-0324',
            interviewer: 'TM-08',
            scheduled_at: '2026-11-16T11:00',
            mode: 'Video call',
        });
        assert.equal(created.round, 1);
        assert.equal(created.status, 'Scheduled');

        await assert.rejects(() =>
            actions.scheduleInterview(recruiter, {
                candidate_id: 'CAN-0235',
                interviewer: 'TM-08',
                scheduled_at: '2026-11-16T11:00',
                mode: 'Video call',
            }),
        );
    });

    it('record_feedback / mark_no_show / cancel_interview / make_offer / offer answer', async () => {
        const { actions, adapter } = buildHiringHarness();

        const feedback = await actions.recordFeedback(karan, {
            interview_id: 'INT-086',
            rating: 4,
            recommendation: 'Hire',
            feedback: 'Strong fundamentals.',
        });
        assert.equal(feedback.interview.status, 'Done');
        assert.equal(feedback.candidate.stage, 'Interview 1');
        assert.equal(feedback.interview.feedback_on, '2026-11-12');

        const offered = await actions.makeOffer(recruiter, 'CAN-0235');
        assert.equal(offered.stage, 'Offer made');

        const hired = await actions.recordOfferAnswer(recruiter, {
            candidate_id: 'CAN-0232',
            accepted: true,
            joining_on: '2026-12-01',
        });
        assert.equal(hired.stage, 'Hired');
        assert.equal(hired.joining_on, '2026-12-01');

        // Fill remaining OPN-03 seats so a later offer fails.
        adapter.candidates.push(
            {
                candidate_id: 'CAN-H1',
                opening: 'OPN-03',
                name: 'H1',
                email: 'h1@example.com',
                college: 'X',
                degree: 'B.E.',
                graduation_year: 2027,
                source: 'LinkedIn',
                resume_link: 'https://drive.example.com/r/h1.pdf',
                applied_on: '2026-09-01',
                stage: 'Hired',
                stage_updated_on: '2026-10-01',
                rejected_reason: null,
                joining_on: '2026-11-01',
                notes: null,
            },
            {
                candidate_id: 'CAN-H2',
                opening: 'OPN-03',
                name: 'H2',
                email: 'h2@example.com',
                college: 'X',
                degree: 'B.E.',
                graduation_year: 2027,
                source: 'LinkedIn',
                resume_link: 'https://drive.example.com/r/h2.pdf',
                applied_on: '2026-09-01',
                stage: 'Hired',
                stage_updated_on: '2026-10-01',
                rejected_reason: null,
                joining_on: '2026-11-01',
                notes: null,
            },
            {
                candidate_id: 'CAN-H3',
                opening: 'OPN-03',
                name: 'H3',
                email: 'h3@example.com',
                college: 'X',
                degree: 'B.E.',
                graduation_year: 2027,
                source: 'LinkedIn',
                resume_link: 'https://drive.example.com/r/h3.pdf',
                applied_on: '2026-09-01',
                stage: 'Hired',
                stage_updated_on: '2026-10-01',
                rejected_reason: null,
                joining_on: '2026-11-01',
                notes: null,
            },
        );
        await assert.rejects(() => actions.makeOffer(recruiter, 'CAN-0235'));

        const { actions: actions2, adapter: adapter2 } = buildHiringHarness();
        adapter2.interviews.push({
            interview_id: 'INT-091',
            candidate: 'CAN-0324',
            round: 1,
            interviewer: 'TM-08',
            scheduled_at: '2026-11-10T11:00',
            mode: 'Video call',
            status: 'Scheduled',
            rating: null,
            recommendation: null,
            feedback: null,
            feedback_on: null,
        });
        const noShow = await actions2.markNoShow(recruiter, 'INT-091');
        assert.equal(noShow.interview.status, 'No-show');
        assert.equal(noShow.candidate.stage, 'Withdrawn');

        const { actions: actions3, adapter: adapter3 } = buildHiringHarness();
        const cancelled = await actions3.cancelInterview(recruiter, 'INT-086');
        assert.equal(cancelled.status, 'Cancelled');
        assert.equal(
            adapter3.interviews.find((row) => row.interview_id === 'INT-086')
                ?.status,
            'Cancelled',
        );
    });

    it('public apply accepts Open openings and rejects Draft', async () => {
        const { apply, adapter } = buildHiringHarness();
        const created = await apply.apply({
            opening_id: 'OPN-04',
            name: 'New Applicant',
            email: 'new.applicant@example.com',
            college: 'Test College',
            degree: 'B.E.',
            graduation_year: 2027,
            source: 'Careers page form',
            resume_link: 'https://drive.example.com/r/new.pdf',
        });
        assert.equal(created.stage, 'Applied');
        assert.equal(created.applied_on, '2026-11-12');
        assert.ok(
            adapter.candidates.some(
                (row) => row.email === 'new.applicant@example.com',
            ),
        );

        await assert.rejects(() =>
            apply.apply({
                opening_id: 'OPN-06',
                name: 'Draft Applicant',
                email: 'draft@example.com',
                college: 'Test College',
                degree: 'B.E.',
                graduation_year: 2027,
                source: 'Careers page form',
                resume_link: 'https://drive.example.com/r/draft.pdf',
            }),
        );
    });
});
