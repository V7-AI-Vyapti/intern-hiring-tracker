/**
 * Spec-aligned acceptance checks that can run without a generated app.
 * Source: Backend Specification PDF — T1–T22 / V1–V12.
 * Live HTTP cases remain blocked (see docs/integration-test-checklist.md).
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
    hiringEntityAllowsCrudWrite,
    hiringEntityAllowsDelete,
} from '../hiring.access-policy.js';
import {
    aarav,
    buildHiringHarness,
    karan,
    recruiter,
} from './hiring-harness.js';

const readUnprocessable = (
    error: unknown,
): { field?: string; message?: string } => {
    const err = error as {
        getResponse?: () => unknown;
        response?: unknown;
        message?: string;
    };
    const response =
        typeof err.getResponse === 'function'
            ? err.getResponse()
            : err.response;
    if (response && typeof response === 'object') {
        const outer = response as Record<string, unknown>;
        if (
            typeof outer.field === 'string' &&
            typeof outer.message === 'string'
        ) {
            return { field: outer.field, message: outer.message };
        }
        if (outer.message && typeof outer.message === 'object') {
            const inner = outer.message as Record<string, unknown>;
            return {
                field:
                    typeof inner.field === 'string' ? inner.field : undefined,
                message:
                    typeof inner.message === 'string'
                        ? inner.message
                        : undefined,
            };
        }
        if (typeof outer.message === 'string') {
            return { message: outer.message };
        }
    }
    return { message: String(err.message ?? error) };
};

describe('Acceptance criteria (unit / mock — Backend Spec T4–T22 subset)', () => {
    it('T4: Interviewer shortlist is forbidden', async () => {
        const { actions } = buildHiringHarness();
        await assert.rejects(
            () => actions.shortlist(aarav, 'CAN-0376'),
            (error: Error) =>
                error.name === 'ForbiddenException' ||
                /Forbidden/i.test(String(error)),
        );
    });

    it('T6/T7: public apply Open succeeds; Draft and Closed rejected', async () => {
        const { apply, adapter } = buildHiringHarness();
        const created = await apply.apply({
            opening_id: 'OPN-04',
            name: 'Accept Applicant',
            email: 'accept.t6@example.com',
            college: 'Test College',
            degree: 'B.E.',
            graduation_year: 2027,
            source: 'Careers page form',
            resume_link: 'https://drive.example.com/r/t6.pdf',
        });
        assert.equal(created.stage, 'Applied');
        assert.equal(created.applied_on, '2026-11-12');

        await assert.rejects(() =>
            apply.apply({
                opening_id: 'OPN-06',
                name: 'Draft',
                email: 'draft.t7@example.com',
                college: 'X',
                degree: 'B.E.',
                graduation_year: 2027,
                source: 'Careers page form',
                resume_link: 'https://drive.example.com/r/t7d.pdf',
            }),
        );

        adapter.openings.push({
            opening_id: 'OPN-01',
            title: 'Closed role',
            team: 'Engineering',
            location: 'Remote',
            stipend_inr: 10000,
            positions: 1,
            posted_on: '2026-01-01',
            closes_on: '2026-06-01',
            status: 'Closed',
            interview_rounds: 1,
            assessment_name: 'X',
            assessment_days: 3,
            owner: 'TM-01',
        });
        await assert.rejects(
            () =>
                apply.apply({
                    opening_id: 'OPN-01',
                    name: 'Closed',
                    email: 'closed.t7@example.com',
                    college: 'X',
                    degree: 'B.E.',
                    graduation_year: 2027,
                    source: 'Careers page form',
                    resume_link: 'https://drive.example.com/r/t7c.pdf',
                }),
            (error: unknown) => {
                const body = readUnprocessable(error);
                return (
                    body.message ===
                    'This opening is not accepting applications'
                );
            },
        );
    });

    it('V1: duplicate application to the same opening is rejected', async () => {
        const { apply } = buildHiringHarness();
        const input = {
            opening_id: 'OPN-04',
            name: 'Dup Applicant',
            email: 'dup.apply@example.com',
            college: 'Test College',
            degree: 'B.E.',
            graduation_year: 2027,
            source: 'Careers page form',
            resume_link: 'https://drive.example.com/r/dup.pdf',
        };
        await apply.apply(input);
        await assert.rejects(
            () => apply.apply(input),
            (error: unknown) => {
                const body = readUnprocessable(error);
                return (
                    body.field === 'email' &&
                    body.message === 'Already applied to this opening'
                );
            },
        );
    });

    it('T8/T9/T10: assessment gate while Applied, then shortlist and due_on', async () => {
        const { actions, dashboard } = buildHiringHarness();

        // T9 — still Applied
        await assert.rejects(() =>
            actions.sendAssessment(recruiter, 'CAN-0376', 'TM-07'),
        );

        const before = await dashboard.summarize();
        assert.ok(before.needs_attention.not_reviewed >= 1);

        // T8
        await actions.shortlist(recruiter, 'CAN-0376');
        const after = await dashboard.summarize();
        assert.equal(
            after.needs_attention.not_reviewed,
            before.needs_attention.not_reviewed - 1,
        );

        // T10 on a Shortlisted harness candidate
        const { actions: actions2 } = buildHiringHarness();
        const sent = await actions2.sendAssessment(
            recruiter,
            'CAN-0248',
            'TM-07',
        );
        assert.equal(sent.candidate.stage, 'Assessment sent');
        assert.equal(sent.assessment.due_on, '2026-11-15');
    });

    it('T11–T14: submission and review pass/fail/ownership', async () => {
        const { actions } = buildHiringHarness();
        const submitted = await actions.recordSubmission(
            recruiter,
            'CAN-0177',
            'https://drive.example.com/s/CAN-0177.zip',
        );
        assert.equal(submitted.candidate.stage, 'Assessment submitted');
        assert.equal(submitted.assessment.submitted_on, '2026-11-12');

        const { actions: passHarness } = buildHiringHarness();
        const passed = await passHarness.reviewAssessment(
            { email: 'meera@kiranbyte.example', roles: ['Interviewer'] },
            'CAN-0354',
            72,
        );
        assert.equal(passed.assessment.result, 'Pass');
        assert.equal(passed.candidate.stage, 'Interview 1');

        const { actions: failHarness } = buildHiringHarness();
        const failed = await failHarness.reviewAssessment(
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

        const { actions: ownershipHarness } = buildHiringHarness();
        await assert.rejects(
            () => ownershipHarness.reviewAssessment(aarav, 'CAN-0361', 80),
            (error: Error) =>
                error.name === 'ForbiddenException' ||
                /Forbidden/i.test(String(error)),
        );
    });

    it('T15/T16: schedule interview and reject booked round with V9 message', async () => {
        const { actions } = buildHiringHarness();
        const created = await actions.scheduleInterview(recruiter, {
            candidate_id: 'CAN-0324',
            interviewer: 'TM-08',
            scheduled_at: '2026-11-16T11:00',
            mode: 'Video call',
        });
        assert.equal(created.round, 1);
        assert.equal(created.status, 'Scheduled');

        await assert.rejects(
            () =>
                actions.scheduleInterview(recruiter, {
                    candidate_id: 'CAN-0235',
                    interviewer: 'TM-08',
                    scheduled_at: '2026-11-16T12:00',
                    mode: 'Video call',
                }),
            (error: unknown) => {
                const body = readUnprocessable(error);
                return (
                    body.field === 'round' &&
                    body.message === 'Round 1 is already booked'
                );
            },
        );
    });

    it('T17/T18/T20: feedback, offer, then positions-filled conflict', async () => {
        const { actions, adapter } = buildHiringHarness();
        const feedback = await actions.recordFeedback(karan, {
            interview_id: 'INT-086',
            rating: 4,
            recommendation: 'Hire',
            feedback: 'Strong fundamentals.',
        });
        assert.equal(feedback.interview.status, 'Done');
        assert.equal(feedback.candidate.stage, 'Interview 1');

        const offered = await actions.makeOffer(recruiter, 'CAN-0235');
        assert.equal(offered.stage, 'Offer made');

        const hiredOnOpening = adapter.candidates.filter(
            (row) => row.opening === 'OPN-03' && row.stage === 'Hired',
        ).length;
        const seats = 4 - hiredOnOpening;
        for (let i = 0; i < seats; i += 1) {
            adapter.candidates.push({
                candidate_id: `CAN-FILL-${i}`,
                opening: 'OPN-03',
                name: `Fill ${i}`,
                email: `fill${i}@example.com`,
                college: 'X',
                degree: 'B.E.',
                graduation_year: 2027,
                source: 'LinkedIn',
                resume_link: 'https://drive.example.com/r/fill.pdf',
                applied_on: '2026-09-01',
                stage: 'Hired',
                stage_updated_on: '2026-10-01',
                rejected_reason: null,
                joining_on: '2026-11-01',
                notes: null,
            });
        }

        await assert.rejects(
            () => actions.makeOffer(recruiter, 'CAN-0235'),
            (error: Error) =>
                error.name === 'ConflictException' ||
                String(error).includes('All positions are filled'),
        );
    });

    it('T19/T21: offer answer Hired; reject without reason → Give a reason', async () => {
        const { actions } = buildHiringHarness();
        const hired = await actions.recordOfferAnswer(recruiter, {
            candidate_id: 'CAN-0232',
            accepted: true,
            joining_on: '2026-12-01',
        });
        assert.equal(hired.stage, 'Hired');
        assert.equal(hired.joining_on, '2026-12-01');

        await assert.rejects(
            () => actions.reject(recruiter, 'CAN-0376', ''),
            (error: unknown) => {
                const body = readUnprocessable(error);
                return (
                    body.field === 'reason' && body.message === 'Give a reason'
                );
            },
        );
    });

    it('T22: delete is refused for every hiring entity', () => {
        assert.equal(hiringEntityAllowsDelete(), false);
        for (const entityName of [
            'team_member',
            'job_opening',
            'job_candidate',
            'job_assessment',
            'job_interview',
        ]) {
            assert.equal(
                hiringEntityAllowsCrudWrite({
                    roleName: 'Recruiter',
                    entityName,
                    action: 'delete',
                }),
                false,
            );
            assert.equal(
                hiringEntityAllowsCrudWrite({
                    roleName: 'Interviewer',
                    entityName,
                    action: 'delete',
                }),
                false,
            );
        }
    });
});
