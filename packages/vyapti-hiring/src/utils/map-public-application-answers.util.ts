import { PUBLIC_APPLICATION_FIELD_KEYS } from '../forms/public-application-form.js';
import type { PublicApplyInput } from '../services/public-apply.service.js';
import { unprocessable } from './hiring-errors.util.js';

const INTERNAL_HIRING_FIELD_KEYS = [
    'candidate_id',
    'stage',
    'applied_on',
    'stage_updated_on',
    'rejected_reason',
    'joining_on',
    'notes',
    'reviewer',
    'score',
    'result',
    'submission_link',
    'interviewer',
    'recommendation',
    'feedback',
    'rating',
    'assessment_id',
    'interview_id',
] as const;

function readRequiredString(
    answers: Record<string, unknown>,
    key: string,
): string {
    const value = answers[key];
    if (typeof value !== 'string' || value.trim().length === 0) {
        unprocessable(key, `${key} is required`);
    }
    return (value as string).trim();
}

function readGraduationYear(answers: Record<string, unknown>): number {
    const value = answers.graduation_year;
    if (typeof value === 'number' && Number.isInteger(value)) {
        return value;
    }
    if (typeof value === 'string' && value.trim().length > 0) {
        const parsed = Number(value.trim());
        if (Number.isInteger(parsed)) {
            return parsed;
        }
    }
    unprocessable('graduation_year', 'graduation_year is required');
    return 0;
}

/**
 * Map form-style answers to {@link PublicApplyInput}.
 * Only allowlisted applicant fields are read; internal hiring keys are ignored.
 */
function mapPublicApplicationAnswers(
    answers: Record<string, unknown>,
): PublicApplyInput {
    const allowed = new Set<string>(PUBLIC_APPLICATION_FIELD_KEYS);
    const picked: Record<string, unknown> = {};
    for (const key of Object.keys(answers)) {
        if (allowed.has(key)) {
            picked[key] = answers[key];
        }
    }

    for (const key of PUBLIC_APPLICATION_FIELD_KEYS) {
        if (!(key in picked) || picked[key] == null || picked[key] === '') {
            unprocessable(key, `${key} is required`);
        }
    }

    return {
        opening_id: readRequiredString(picked, 'opening_id'),
        name: readRequiredString(picked, 'name'),
        email: readRequiredString(picked, 'email'),
        college: readRequiredString(picked, 'college'),
        degree: readRequiredString(picked, 'degree'),
        graduation_year: readGraduationYear(picked),
        source: readRequiredString(picked, 'source'),
        resume_link: readRequiredString(picked, 'resume_link'),
    };
}

function publicApplicationAnswersContainInternalFields(
    answers: Record<string, unknown>,
): boolean {
    return INTERNAL_HIRING_FIELD_KEYS.some((key) =>
        Object.prototype.hasOwnProperty.call(answers, key),
    );
}

export {
    INTERNAL_HIRING_FIELD_KEYS,
    mapPublicApplicationAnswers,
    publicApplicationAnswersContainInternalFields,
};
