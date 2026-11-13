import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
    HIRING_INTERVIEWER_ACTIONS,
    HIRING_PERMISSION_CATALOG,
    HIRING_RECRUITER_ACTIONS,
    HIRING_RESOURCE,
    HIRING_ROLE_GRANTS,
    callerMayPerformHiringAction,
    roleHasGrant,
} from '../index.js';
import {
    aarav,
    buildHiringHarness,
    interviewer,
    karan,
    recruiter,
} from './hiring-harness.js';

const unauthorized = {
    email: 'outsider@example.com',
    roles: [],
};

describe('Hiring RBAC catalog and grants', () => {
    it('registers hiring workflow actions and entity CRUD verbs', () => {
        const hiring = HIRING_PERMISSION_CATALOG.find(
            (entry) => entry.resource === HIRING_RESOURCE,
        );
        assert.ok(hiring);
        assert.ok(hiring.actions.includes('shortlist'));
        assert.ok(hiring.actions.includes('review_assessment'));
        assert.ok(hiring.actions.includes('dashboard_summary'));
        assert.ok(
            HIRING_PERMISSION_CATALOG.some(
                (entry) => entry.resource === 'job_candidate',
            ),
        );
    });

    it('gives Recruiter all hiring actions and Interviewer only assigned-row actions', () => {
        for (const action of HIRING_RECRUITER_ACTIONS) {
            assert.equal(
                roleHasGrant('Recruiter', HIRING_RESOURCE, action),
                true,
                `Recruiter missing ${action}`,
            );
        }
        for (const action of HIRING_INTERVIEWER_ACTIONS) {
            assert.equal(
                roleHasGrant('Interviewer', HIRING_RESOURCE, action),
                true,
            );
        }
        assert.equal(
            roleHasGrant('Interviewer', HIRING_RESOURCE, 'shortlist'),
            false,
        );
        assert.equal(
            roleHasGrant('Interviewer', HIRING_RESOURCE, 'dashboard_summary'),
            false,
        );
        assert.equal(
            HIRING_ROLE_GRANTS.Interviewer.some(
                (grant) =>
                    grant.resource === 'job_assessment' &&
                    grant.action === 'view',
            ),
            true,
        );
        assert.equal(
            HIRING_ROLE_GRANTS.Interviewer.some(
                (grant) =>
                    grant.resource === 'job_assessment' &&
                    grant.action === 'update',
            ),
            false,
        );
    });

    it('callerMayPerformHiringAction mirrors role grants', () => {
        assert.equal(
            callerMayPerformHiringAction(recruiter, 'shortlist'),
            true,
        );
        assert.equal(
            callerMayPerformHiringAction(interviewer, 'shortlist'),
            false,
        );
        assert.equal(
            callerMayPerformHiringAction(interviewer, 'review_assessment'),
            true,
        );
        assert.equal(
            callerMayPerformHiringAction(unauthorized, 'record_feedback'),
            false,
        );
        assert.equal(
            callerMayPerformHiringAction(
                { email: 'admin@example.com', roles: ['Admin'] },
                'dashboard_summary',
            ),
            true,
        );
    });
});

describe('Hiring RBAC enforcement', () => {
    it('allows Recruiter workflow actions and dashboard', async () => {
        const { actions, dashboard } = buildHiringHarness();
        const shortlisted = await actions.shortlist(recruiter, 'CAN-0376');
        assert.equal(shortlisted.stage, 'Shortlisted');
        const summary = await dashboard.summarize();
        assert.ok(summary.applicants >= 1);
        assert.equal(
            callerMayPerformHiringAction(recruiter, 'dashboard_summary'),
            true,
        );
    });

    it('allows Interviewer review/feedback only on assigned records', async () => {
        const { actions } = buildHiringHarness();
        const reviewed = await actions.reviewAssessment(
            interviewer,
            'CAN-0354',
            70,
        );
        assert.equal(reviewed.assessment.result, 'Pass');

        const feedback = await actions.recordFeedback(karan, {
            interview_id: 'INT-086',
            rating: 5,
            recommendation: 'Hire',
            feedback: 'Excellent.',
        });
        assert.equal(feedback.interview.status, 'Done');
    });

    it('denies Interviewer on unassigned assessment and interview', async () => {
        const { actions } = buildHiringHarness();
        await assert.rejects(
            () => actions.reviewAssessment(aarav, 'CAN-0354', 80),
            (error: Error) =>
                error.name === 'ForbiddenException' ||
                /Forbidden/i.test(String(error)),
        );
        await assert.rejects(
            () =>
                actions.recordFeedback(aarav, {
                    interview_id: 'INT-086',
                    rating: 3,
                    recommendation: 'Reject',
                    feedback: 'No',
                }),
            (error: Error) =>
                error.name === 'ForbiddenException' ||
                /Forbidden/i.test(String(error)),
        );
    });

    it('denies Interviewer recruiter-only actions', async () => {
        const { actions } = buildHiringHarness();
        await assert.rejects(
            () => actions.shortlist(interviewer, 'CAN-0376'),
            (error: Error) =>
                error.name === 'ForbiddenException' ||
                /Forbidden/i.test(String(error)),
        );
        await assert.rejects(
            () =>
                actions.scheduleInterview(interviewer, {
                    candidate_id: 'CAN-0324',
                    interviewer: 'TM-08',
                    scheduled_at: '2026-11-16T11:00',
                    mode: 'Video call',
                }),
            (error: Error) =>
                error.name === 'ForbiddenException' ||
                /Forbidden/i.test(String(error)),
        );
        await assert.rejects(
            () => actions.makeOffer(interviewer, 'CAN-0235'),
            (error: Error) =>
                error.name === 'ForbiddenException' ||
                /Forbidden/i.test(String(error)),
        );
        assert.equal(
            callerMayPerformHiringAction(interviewer, 'dashboard_summary'),
            false,
        );
    });

    it('denies callers with no hiring roles', async () => {
        const { actions } = buildHiringHarness();
        await assert.rejects(
            () => actions.shortlist(unauthorized, 'CAN-0376'),
            (error: Error) =>
                error.name === 'ForbiddenException' ||
                /Forbidden/i.test(String(error)),
        );
        await assert.rejects(
            () => actions.reviewAssessment(unauthorized, 'CAN-0354', 70),
            (error: Error) =>
                error.name === 'ForbiddenException' ||
                /Forbidden/i.test(String(error)),
        );
    });

    it('allows public apply without authentication roles', async () => {
        const { apply, adapter } = buildHiringHarness();
        const created = await apply.apply({
            opening_id: 'OPN-04',
            name: 'Public Applicant',
            email: 'public-applicant@example.com',
            college: 'Test College',
            degree: 'B.E.',
            graduation_year: 2027,
            source: 'Careers page form',
            resume_link: 'https://drive.example.com/r/public.pdf',
        });
        assert.equal(created.stage, 'Applied');
        assert.equal(created.opening, 'OPN-04');
        assert.ok(
            adapter.candidates.some(
                (row) => row.email === 'public-applicant@example.com',
            ),
        );
    });
});
