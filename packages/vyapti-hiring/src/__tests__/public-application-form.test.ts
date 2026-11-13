import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { z } from 'zod';
import {
    PUBLIC_APPLICATION_FIELD_KEYS,
    PUBLIC_APPLICATION_FORM_CONFIG,
    PUBLIC_APPLICATION_FORM_HTTP_SEED,
    PUBLIC_APPLICATION_FORM_KEY,
    PUBLIC_APPLICATION_LOCATION_ID,
} from '../forms/public-application-form.js';
import {
    INTERNAL_HIRING_FIELD_KEYS,
    mapPublicApplicationAnswers,
    publicApplicationAnswersContainInternalFields,
} from '../utils/map-public-application-answers.util.js';
import { buildHiringHarness } from './hiring-harness.js';

const PublicApplyBodySchema = z.strictObject({
    opening_id: z.string().trim().min(1),
    name: z.string().trim().min(1),
    email: z.string().trim().min(1),
    college: z.string().trim().min(1),
    degree: z.string().trim().min(1),
    graduation_year: z.number().int(),
    source: z.string().trim().min(1),
    resume_link: z.string().trim().min(1),
});

describe('public application form configuration', () => {
    it('registers Forms-compatible config with applicant field keys only', () => {
        assert.equal(PUBLIC_APPLICATION_FORM_KEY, 'intern_hiring_public_apply');
        assert.equal(PUBLIC_APPLICATION_LOCATION_ID, 'careers.public_apply');
        assert.equal(PUBLIC_APPLICATION_FORM_CONFIG.status, 'published');
        assert.equal(PUBLIC_APPLICATION_FORM_CONFIG.kind, 'single_page');
        assert.deepEqual(
            [...PUBLIC_APPLICATION_FORM_CONFIG.fieldKeys],
            [...PUBLIC_APPLICATION_FIELD_KEYS],
        );
        const keys = PUBLIC_APPLICATION_FORM_CONFIG.structure.fields.map(
            (field) => field.key,
        );
        assert.deepEqual(keys, [...PUBLIC_APPLICATION_FIELD_KEYS]);
        assert.ok(
            PUBLIC_APPLICATION_FORM_CONFIG.structure.fields.every(
                (field) => field.required && field.enabled,
            ),
        );
        assert.equal(
            PUBLIC_APPLICATION_FORM_HTTP_SEED.form_key,
            PUBLIC_APPLICATION_FORM_KEY,
        );
        assert.equal(
            PUBLIC_APPLICATION_FORM_HTTP_SEED.location.location_id,
            PUBLIC_APPLICATION_LOCATION_ID,
        );
    });

    it('exposes the same config from PublicApplyService without auth', () => {
        const { apply } = buildHiringHarness();
        const config = apply.getApplicationFormConfig();
        assert.equal(config.key, PUBLIC_APPLICATION_FORM_KEY);
        assert.equal(config.locationId, PUBLIC_APPLICATION_LOCATION_ID);
    });
});

describe('public application submission', () => {
    it('creates a candidate through the hiring persistence adapter', async () => {
        const { apply, adapter } = buildHiringHarness();
        const before = adapter.candidates.length;
        const created = await apply.apply({
            opening_id: 'OPN-04',
            name: 'Form Applicant',
            email: 'form.applicant@example.com',
            college: 'Test College',
            degree: 'B.Tech',
            graduation_year: 2027,
            source: 'Careers page form',
            resume_link: 'https://drive.example.com/r/form.pdf',
        });
        assert.equal(created.stage, 'Applied');
        assert.equal(created.opening, 'OPN-04');
        assert.equal(created.rejected_reason, null);
        assert.equal(created.notes, null);
        assert.equal(adapter.candidates.length, before + 1);
        assert.ok(
            adapter.candidates.some(
                (row) => row.email === 'form.applicant@example.com',
            ),
        );
    });

    it('applies form answers without authentication roles', async () => {
        const { apply } = buildHiringHarness();
        const created = await apply.applyFromAnswers({
            opening_id: 'OPN-03',
            name: 'Anon Applicant',
            email: 'anon.apply@example.com',
            college: 'Test College',
            degree: 'B.E.',
            graduation_year: 2026,
            source: 'Careers page form',
            resume_link: 'https://drive.example.com/r/anon.pdf',
        });
        assert.equal(created.stage, 'Applied');
        assert.equal(created.opening, 'OPN-03');
    });

    it('rejects closed and draft openings', async () => {
        const { apply, adapter } = buildHiringHarness();
        adapter.openings.push({
            opening_id: 'OPN-09',
            title: 'Closed intern',
            team: 'Engineering',
            location: 'Remote',
            stipend_inr: 10000,
            positions: 1,
            posted_on: '2026-01-01',
            closes_on: '2026-06-01',
            status: 'Closed',
            interview_rounds: 1,
            assessment_name: 'Closed',
            assessment_days: 3,
            owner: 'TM-01',
        });

        await assert.rejects(() =>
            apply.apply({
                opening_id: 'OPN-09',
                name: 'Closed Applicant',
                email: 'closed@example.com',
                college: 'Test College',
                degree: 'B.E.',
                graduation_year: 2027,
                source: 'Careers page form',
                resume_link: 'https://drive.example.com/r/closed.pdf',
            }),
        );

        await assert.rejects(() =>
            apply.apply({
                opening_id: 'OPN-06',
                name: 'Draft Applicant',
                email: 'draft2@example.com',
                college: 'Test College',
                degree: 'B.E.',
                graduation_year: 2027,
                source: 'Careers page form',
                resume_link: 'https://drive.example.com/r/draft2.pdf',
            }),
        );
    });

    it('rejects unknown opening ids', async () => {
        const { apply } = buildHiringHarness();
        await assert.rejects(() =>
            apply.apply({
                opening_id: 'OPN-MISSING',
                name: 'Ghost',
                email: 'ghost@example.com',
                college: 'Test College',
                degree: 'B.E.',
                graduation_year: 2027,
                source: 'Careers page form',
                resume_link: 'https://drive.example.com/r/ghost.pdf',
            }),
        );
    });

    it('rejects missing mandatory fields from form answers', async () => {
        const { apply } = buildHiringHarness();
        await assert.rejects(() =>
            apply.applyFromAnswers({
                opening_id: 'OPN-04',
                name: 'Missing Email',
                college: 'Test College',
                degree: 'B.E.',
                graduation_year: 2027,
                source: 'Careers page form',
                resume_link: 'https://drive.example.com/r/missing.pdf',
            }),
        );
        await assert.rejects(() =>
            apply.applyFromAnswers({
                opening_id: 'OPN-04',
                name: 'Missing Year',
                email: 'missing.year@example.com',
                college: 'Test College',
                degree: 'B.E.',
                source: 'Careers page form',
                resume_link: 'https://drive.example.com/r/missing-year.pdf',
            }),
        );
    });

    it('ignores injected internal hiring fields and keeps Applied stage', async () => {
        const { apply } = buildHiringHarness();
        const answers = {
            opening_id: 'OPN-04',
            name: 'Inject Attempt',
            email: 'inject@example.com',
            college: 'Test College',
            degree: 'B.E.',
            graduation_year: 2027,
            source: 'Careers page form',
            resume_link: 'https://drive.example.com/r/inject.pdf',
            stage: 'Hired',
            notes: 'should not persist',
            rejected_reason: 'should not persist',
            reviewer: 'TM-07',
            score: 100,
            interviewer: 'TM-08',
            feedback: 'leaked',
        };
        assert.equal(
            publicApplicationAnswersContainInternalFields(answers),
            true,
        );
        const mapped = mapPublicApplicationAnswers(answers);
        assert.equal(
            Object.keys(mapped).sort().join(','),
            [...PUBLIC_APPLICATION_FIELD_KEYS].slice().sort().join(','),
        );
        for (const key of INTERNAL_HIRING_FIELD_KEYS) {
            assert.equal(
                Object.prototype.hasOwnProperty.call(mapped, key),
                false,
            );
        }
        const created = await apply.applyFromAnswers(answers);
        assert.equal(created.stage, 'Applied');
        assert.equal(created.notes, null);
        assert.equal(created.rejected_reason, null);
    });

    it('rejects unknown keys on the HTTP apply body schema', () => {
        const result = PublicApplyBodySchema.safeParse({
            opening_id: 'OPN-04',
            name: 'Strict',
            email: 'strict@example.com',
            college: 'Test College',
            degree: 'B.E.',
            graduation_year: 2027,
            source: 'Careers page form',
            resume_link: 'https://drive.example.com/r/strict.pdf',
            stage: 'Hired',
        });
        assert.equal(result.success, false);
    });

    it('lists only eligible Open openings for the public form', async () => {
        const { apply, adapter } = buildHiringHarness();
        adapter.openings.push(
            {
                opening_id: 'OPN-10',
                title: 'Expired open',
                team: 'Engineering',
                location: 'Remote',
                stipend_inr: 10000,
                positions: 1,
                posted_on: '2026-01-01',
                closes_on: '2026-11-01',
                status: 'Open',
                interview_rounds: 1,
                assessment_name: 'Expired',
                assessment_days: 3,
                owner: 'TM-01',
            },
            {
                opening_id: 'OPN-11',
                title: 'On hold intern',
                team: 'Engineering',
                location: 'Remote',
                stipend_inr: 10000,
                positions: 1,
                posted_on: '2026-01-01',
                closes_on: '2026-12-01',
                status: 'On hold',
                interview_rounds: 1,
                assessment_name: 'Hold',
                assessment_days: 3,
                owner: 'TM-01',
            },
        );

        const openings = await apply.listEligibleOpenings();
        const ids = openings.map((row) => row.opening_id);
        assert.deepEqual(ids, ['OPN-03', 'OPN-04']);
        for (const row of openings) {
            assert.equal(
                Object.prototype.hasOwnProperty.call(row, 'owner'),
                false,
            );
            assert.equal(
                Object.prototype.hasOwnProperty.call(row, 'assessment_name'),
                false,
            );
        }
    });
});
