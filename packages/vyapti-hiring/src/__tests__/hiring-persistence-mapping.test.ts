import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
    mapAssessmentRow,
    mapCandidateRow,
    mapInterviewRow,
    mapOpeningRow,
    mapTeamMemberRow,
} from '../../host/utils/map-hiring-record.util.ts';
import { nextBusinessId } from '../../host/utils/next-business-id.util.ts';
import { readBusinessForeignKey } from '../../host/utils/record-readers.util.ts';

describe('hiring persistence mapping', () => {
    it('maps team_member scalar fields', () => {
        assert.deepEqual(
            mapTeamMemberRow({
                member_id: 'TM-01',
                name: 'Asha',
                email: 'asha@example.com',
                role: 'Recruiter',
                team: 'Talent',
                status: 'Active',
            }),
            {
                member_id: 'TM-01',
                name: 'Asha',
                email: 'asha@example.com',
                role: 'Recruiter',
                team: 'Talent',
                status: 'Active',
            },
        );
    });

    it('maps opening owner from related team_member row', () => {
        const mapped = mapOpeningRow({
            opening_id: 'OPN-03',
            title: 'Intern',
            team: 'Eng',
            location: 'Remote',
            stipend_inr: 25000,
            positions: 2,
            posted_on: '2026-01-01',
            closes_on: null,
            status: 'Open',
            interview_rounds: 2,
            assessment_name: 'Take-home',
            assessment_days: 5,
            owner: { member_id: 'TM-01', name: 'Asha' },
        });
        assert.equal(mapped.owner, 'TM-01');
        assert.equal(mapped.opening_id, 'OPN-03');
        assert.equal(mapped.closes_on, null);
    });

    it('maps candidate opening from business-id string (scalar / incomplete FK map)', () => {
        const mapped = mapCandidateRow({
            candidate_id: 'CAN-0001',
            opening: 'OPN-03',
            name: 'Riya',
            email: 'riya@example.com',
            college: 'IIT',
            degree: 'BTech',
            graduation_year: 2027,
            source: 'Campus',
            resume_link: 'https://example.com/r',
            applied_on: '2026-02-01',
            stage: 'Applied',
            stage_updated_on: '2026-02-01',
            rejected_reason: null,
            joining_on: null,
            notes: null,
        });
        assert.equal(mapped.opening, 'OPN-03');
    });

    it('maps assessment and interview FK business ids from related rows', () => {
        const assessment = mapAssessmentRow({
            assessment_id: 'ASM-001',
            candidate: { candidate_id: 'CAN-0001' },
            reviewer: { member_id: 'TM-07' },
            sent_on: '2026-02-02',
            due_on: '2026-02-07',
            submitted_on: null,
            submission_link: null,
            score: null,
            result: 'Pending',
            reviewed_on: null,
        });
        assert.equal(assessment.candidate, 'CAN-0001');
        assert.equal(assessment.reviewer, 'TM-07');

        const interview = mapInterviewRow({
            interview_id: 'INT-001',
            candidate: { candidate_id: 'CAN-0001' },
            round: 1,
            interviewer: { member_id: 'TM-08' },
            scheduled_at: '2026-02-10T10:00:00+05:30',
            mode: 'Video',
            status: 'Scheduled',
            rating: null,
            recommendation: null,
            feedback: null,
            feedback_on: null,
        });
        assert.equal(interview.interviewer, 'TM-08');
        assert.equal(interview.round, 1);
    });

    it('rejects raw numeric AutoPK FK without loaded relation', () => {
        assert.throws(
            () => readBusinessForeignKey({ owner: 12 }, 'owner', 'member_id'),
            /cannot map raw AutoPK/,
        );
    });

    it('increments business ids with correct padding', () => {
        assert.equal(
            nextBusinessId({
                existingIds: ['CAN-0001', 'CAN-0445', 'SKIP'],
                prefix: 'CAN',
                pad: 4,
            }),
            'CAN-0446',
        );
        assert.equal(
            nextBusinessId({
                existingIds: [],
                prefix: 'ASM',
                pad: 3,
            }),
            'ASM-001',
        );
        assert.equal(
            nextBusinessId({
                existingIds: ['INT-099'],
                prefix: 'INT',
                pad: 3,
            }),
            'INT-100',
        );
    });
});
