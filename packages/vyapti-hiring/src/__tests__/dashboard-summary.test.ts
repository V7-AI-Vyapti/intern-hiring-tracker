import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it } from 'node:test';
import { parse } from 'node:path';
import { DashboardSummaryService } from '../services/dashboard-summary.service.js';
import type {
    AssessmentRow,
    CandidateRow,
    InterviewRow,
    OpeningRow,
} from '../types/hiring.types.js';
import { InMemoryHiringPersistenceAdapter } from './in-memory-hiring.adapter.js';
import { buildHiringHarness } from './hiring-harness.js';

const repoSeedDir = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    '../../../../generated/intern-hiring-tracker-seed',
);

const parseCsv = <T extends Record<string, string>>(fileName: string): T[] => {
    const text = readFileSync(path.join(repoSeedDir, fileName), 'utf8');
    const [headerLine, ...lines] = text.trim().split(/\r?\n/);
    const headers = headerLine.split(',');
    return lines.map((line) => {
        const values: string[] = [];
        let current = '';
        let inQuotes = false;
        for (const char of line) {
            if (char === '"') {
                inQuotes = !inQuotes;
                continue;
            }
            if (char === ',' && !inQuotes) {
                values.push(current);
                current = '';
                continue;
            }
            current += char;
        }
        values.push(current);
        const row: Record<string, string> = {};
        headers.forEach((header, index) => {
            row[header] = values[index] ?? '';
        });
        return row as T;
    });
};

describe('DashboardSummaryService', () => {
    it('computes alert buckets on the harness fixture', async () => {
        const { dashboard, adapter, actions } = buildHiringHarness();
        const recruiterCaller = {
            email: 'fatima@kiranbyte.example',
            roles: ['Recruiter'],
        };

        const before = await dashboard.summarize();
        assert.equal(before.needs_attention.not_reviewed, 1);
        assert.deepEqual(before.needs_attention_ids.not_reviewed, [
            'CAN-0376',
        ]);
        assert.equal(before.needs_attention.assessment_not_sent, 1);
        assert.equal(before.needs_attention.assessment_overdue, 1);
        assert.equal(before.needs_attention.review_pending, 2);
        assert.equal(before.needs_attention.interview_not_scheduled, 1);
        assert.equal(before.needs_attention.feedback_missing, 1);
        assert.equal(before.needs_attention.offer_pending, 1);

        await actions.shortlist(recruiterCaller, 'CAN-0376');
        const after = await dashboard.summarize();
        assert.equal(after.needs_attention.not_reviewed, 0);
        assert.ok(adapter.candidates.length >= 8);
    });

    it('matches seed-data dashboard numbers for 2026-11-12', async () => {
        const adapter = new InMemoryHiringPersistenceAdapter();
        const openings = parseCsv<Record<string, string>>('openings.csv');
        const candidates = parseCsv<Record<string, string>>('candidates.csv');
        const assessments = parseCsv<Record<string, string>>(
            'assessments.csv',
        );
        const interviews = parseCsv<Record<string, string>>('interviews.csv');

        adapter.openings = openings.map(
            (row): OpeningRow => ({
                opening_id: row.opening_id,
                title: row.title,
                team: row.team,
                location: row.location,
                stipend_inr: Number(row.stipend_inr),
                positions: Number(row.positions),
                posted_on: row.posted_on || null,
                closes_on: row.closes_on || null,
                status: row.status,
                interview_rounds: Number(row.interview_rounds),
                assessment_name: row.assessment_name,
                assessment_days: Number(row.assessment_days),
                owner: row.owner,
            }),
        );
        adapter.candidates = candidates.map(
            (row): CandidateRow => ({
                candidate_id: row.candidate_id,
                opening: row.opening,
                name: row.name,
                email: row.email,
                college: row.college,
                degree: row.degree,
                graduation_year: Number(row.graduation_year),
                source: row.source,
                resume_link: row.resume_link,
                applied_on: row.applied_on,
                stage: row.stage,
                stage_updated_on: row.stage_updated_on,
                rejected_reason: row.rejected_reason || null,
                joining_on: row.joining_on || null,
                notes: row.notes || null,
            }),
        );
        adapter.assessments = assessments.map(
            (row): AssessmentRow => ({
                assessment_id: row.assessment_id,
                candidate: row.candidate,
                reviewer: row.reviewer,
                sent_on: row.sent_on,
                due_on: row.due_on,
                submitted_on: row.submitted_on || null,
                submission_link: row.submission_link || null,
                score: row.score === '' ? null : Number(row.score),
                result: row.result,
                reviewed_on: row.reviewed_on || null,
            }),
        );
        adapter.interviews = interviews.map(
            (row): InterviewRow => ({
                interview_id: row.interview_id,
                candidate: row.candidate,
                round: Number(row.round),
                interviewer: row.interviewer,
                scheduled_at: row.scheduled_at,
                mode: row.mode,
                status: row.status,
                rating: row.rating === '' ? null : Number(row.rating),
                recommendation: row.recommendation || null,
                feedback: row.feedback || null,
                feedback_on: row.feedback_on || null,
            }),
        );

        const dashboard = new DashboardSummaryService(adapter, {
            persistence: adapter,
            today: () => '2026-11-12',
        });
        const summary = await dashboard.summarize();

        assert.equal(summary.open_positions, 10);
        assert.equal(summary.applicants, 445);
        assert.equal(summary.in_progress, 57);
        assert.equal(summary.hired, 8);
        assert.equal(summary.avg_days_to_hire, 27.9);
        assert.deepEqual(summary.assessments, {
            sent: 176,
            submitted: 139,
            passed: 82,
        });
        assert.equal(summary.interviews_done, 98);
        assert.equal(summary.needs_attention.not_reviewed, 9);
        assert.equal(summary.needs_attention.assessment_not_sent, 2);
        assert.equal(summary.needs_attention.assessment_overdue, 9);
        assert.equal(summary.needs_attention.review_pending, 2);
        assert.equal(summary.needs_attention.interview_not_scheduled, 1);
        assert.equal(summary.needs_attention.feedback_missing, 2);
        assert.equal(summary.needs_attention.offer_pending, 1);
        assert.equal(summary.needs_attention_ids.not_reviewed.length, 9);
        assert.deepEqual(summary.needs_attention_ids.feedback_missing, [
            'INT-086',
            'INT-090',
        ]);
        assert.ok(parse(repoSeedDir).base === 'intern-hiring-tracker-seed');
    });
});
