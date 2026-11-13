import { Inject, Injectable } from '@nestjs/common';
import { PUBLIC_APPLICATION_FORM_CONFIG } from '../forms/public-application-form.js';
import { SOURCES } from '../hiring.enums.js';
import { HIRING_MODULE_OPTIONS, HIRING_PERSISTENCE } from '../hiring.tokens.js';
import type {
    CandidateRow,
    HiringModuleRootOptions,
    HiringPersistenceAdapter,
    OpeningRow,
} from '../types/hiring.types.js';
import { unprocessable } from '../utils/hiring-errors.util.js';
import { mapPublicApplicationAnswers } from '../utils/map-public-application-answers.util.js';

type PublicApplyInput = {
    opening_id: string;
    name: string;
    email: string;
    college: string;
    degree: string;
    graduation_year: number;
    source: string;
    resume_link: string;
};

type PublicOpeningSummary = {
    opening_id: string;
    title: string;
    team: string;
    location: string;
    stipend_inr: number;
    positions: number;
    posted_on: string | null;
    closes_on: string | null;
};

/**
 * Public application path (forms package schema + unauthenticated create).
 * Enforces Open-only openings, candidate uniqueness, and applicant-field allowlist.
 */
@Injectable()
class PublicApplyService {
    constructor(
        @Inject(HIRING_PERSISTENCE)
        private readonly persistence: HiringPersistenceAdapter,
        @Inject(HIRING_MODULE_OPTIONS)
        private readonly options: HiringModuleRootOptions,
    ) {}

    /** Forms-compatible schema for anonymous FE render (Forms GET is auth-only). */
    getApplicationFormConfig() {
        return PUBLIC_APPLICATION_FORM_CONFIG;
    }

    /**
     * Eligible openings for the public form dropdown.
     * Draft / Closed / On hold / past closes_on are omitted — never full opening rows.
     */
    async listEligibleOpenings(): Promise<PublicOpeningSummary[]> {
        const today = this.options.today!();
        const openings = await this.persistence.listOpenings();
        return openings
            .filter((opening) => this.isEligibleOpening(opening, today))
            .map((opening) => this.toPublicOpeningSummary(opening))
            .sort((left, right) =>
                left.opening_id.localeCompare(right.opening_id),
            );
    }

    /**
     * Accept form-style answer bags (may include ignored internal keys).
     * Only allowlisted applicant fields are forwarded to {@link apply}.
     */
    async applyFromAnswers(
        answers: Record<string, unknown>,
    ): Promise<CandidateRow> {
        return this.apply(mapPublicApplicationAnswers(answers));
    }

    async apply(input: PublicApplyInput): Promise<CandidateRow> {
        return this.persistence.withTransaction(async () => {
            const opening = await this.persistence.findOpeningById(
                input.opening_id,
            );
            if (!opening) {
                unprocessable(
                    'opening',
                    'This opening is not accepting applications',
                );
            }
            const today = this.options.today!();
            if (!this.isEligibleOpening(opening!, today)) {
                unprocessable(
                    'opening',
                    'This opening is not accepting applications',
                );
            }
            if (!(SOURCES as readonly string[]).includes(input.source)) {
                unprocessable('source', 'source is not valid');
            }
            if (
                !Number.isInteger(input.graduation_year) ||
                input.graduation_year < 2020 ||
                input.graduation_year > 2035
            ) {
                unprocessable(
                    'graduation_year',
                    'graduation_year is not valid',
                );
            }
            if (!input.resume_link?.trim()) {
                unprocessable('resume_link', 'resume_link is required');
            }
            if (!input.name?.trim()) {
                unprocessable('name', 'name is required');
            }
            if (!input.email?.trim()) {
                unprocessable('email', 'email is required');
            }
            if (!input.college?.trim()) {
                unprocessable('college', 'college is required');
            }
            if (!input.degree?.trim()) {
                unprocessable('degree', 'degree is required');
            }

            const existing = (await this.persistence.listCandidates()).find(
                (row) =>
                    row.opening === input.opening_id &&
                    row.email.toLowerCase() ===
                        input.email.trim().toLowerCase(),
            );
            if (existing) {
                // V1 uniqueness → 422 { field, message }
                unprocessable('email', 'Already applied to this opening');
            }

            const candidateId = await this.persistence.nextCandidateId();
            return this.persistence.createCandidate({
                candidate_id: candidateId,
                opening: input.opening_id,
                name: input.name.trim(),
                email: input.email.trim(),
                college: input.college.trim(),
                degree: input.degree.trim(),
                graduation_year: input.graduation_year,
                source: input.source,
                resume_link: input.resume_link.trim(),
                applied_on: today,
                stage: 'Applied',
                stage_updated_on: today,
                rejected_reason: null,
                joining_on: null,
                notes: null,
            });
        });
    }

    private isEligibleOpening(opening: OpeningRow, today: string): boolean {
        if (opening.status !== 'Open') {
            return false;
        }
        if (opening.closes_on && opening.closes_on < today) {
            return false;
        }
        return true;
    }

    private toPublicOpeningSummary(opening: OpeningRow): PublicOpeningSummary {
        return {
            opening_id: opening.opening_id,
            title: opening.title,
            team: opening.team,
            location: opening.location,
            stipend_inr: opening.stipend_inr,
            positions: opening.positions,
            posted_on: opening.posted_on,
            closes_on: opening.closes_on,
        };
    }
}

export { PublicApplyService };
export type { PublicApplyInput, PublicOpeningSummary };
