import type {
    AssessmentRow,
    CandidateRow,
    HiringPersistenceAdapter,
    InterviewRow,
    OpeningRow,
    TeamMemberRow,
} from '@vyapti/hiring';
import {
    GENERATED_HIRING_BUSINESS_ID_FIELDS,
    GENERATED_HIRING_ID_PAD,
    GENERATED_HIRING_ID_PREFIX,
} from '../hiring.constants';
import {
    mapAssessmentRow,
    mapCandidateRow,
    mapInterviewRow,
    mapOpeningRow,
    mapTeamMemberRow,
} from '../utils/map-hiring-record.util';
import { nextBusinessId } from '../utils/next-business-id.util';
import { readString } from '../utils/record-readers.util';
import type { HiringEntityBundle, HiringEntityOps } from './hiring-entity-ops';

const OPENING_RELATIONS = { owner: true } as const;
const CANDIDATE_RELATIONS = { opening: true } as const;
const ASSESSMENT_RELATIONS = { candidate: true, reviewer: true } as const;
const INTERVIEW_RELATIONS = { candidate: true, interviewer: true } as const;

/**
 * Only request relations that exist on the generated entity.
 * Passing a scalar property (e.g. job_candidate.opening when FK map is
 * incomplete) as `relations: { opening: true }` makes TypeORM throw.
 */
const pickRelations = (
    ops: HiringEntityOps,
    wanted: Record<string, boolean>,
): Record<string, boolean> | undefined => {
    const picked: Record<string, boolean> = {};
    for (const [propertyName, enabled] of Object.entries(wanted)) {
        if (enabled && ops.isRelation(propertyName)) {
            picked[propertyName] = true;
        }
    }
    return Object.keys(picked).length > 0 ? picked : undefined;
};

const missing = (kind: string, id: string): never => {
    throw new Error(`missing ${kind} ${id}`);
};

const requireRelated = async (
    ops: HiringEntityOps,
    businessField: string,
    businessId: string,
    kind: string,
): Promise<unknown> => {
    const row = await ops.one({ [businessField]: businessId });
    if (!row) {
        return missing(kind, businessId);
    }
    return row;
};

/**
 * Assign either a related entity (FK relation) or the business-id string
 * (scalar column) based on runtime entity metadata.
 */
const assignRef = (
    ops: HiringEntityOps,
    propertyName: string,
    related: unknown,
    businessId: string,
): unknown => (ops.isRelation(propertyName) ? related : businessId);

const createHiringPersistenceFromOps = (
    bundle: HiringEntityBundle,
): HiringPersistenceAdapter => {
    const loadTeamMember = async (
        where: Record<string, unknown>,
    ): Promise<TeamMemberRow | null> => {
        const row = await bundle.teamMember.one(where);
        return row ? mapTeamMemberRow(row) : null;
    };

    const loadOpening = async (
        openingId: string,
    ): Promise<OpeningRow | null> => {
        const row = await bundle.opening.one(
            { [GENERATED_HIRING_BUSINESS_ID_FIELDS.JOB_OPENING]: openingId },
            {
                relations: pickRelations(bundle.opening, {
                    ...OPENING_RELATIONS,
                }),
            },
        );
        return row ? mapOpeningRow(row) : null;
    };

    const loadCandidate = async (
        candidateId: string,
    ): Promise<CandidateRow | null> => {
        const row = await bundle.candidate.one(
            {
                [GENERATED_HIRING_BUSINESS_ID_FIELDS.JOB_CANDIDATE]:
                    candidateId,
            },
            {
                relations: pickRelations(bundle.candidate, {
                    ...CANDIDATE_RELATIONS,
                }),
            },
        );
        return row ? mapCandidateRow(row) : null;
    };

    const loadAssessment = async (
        where: Record<string, unknown>,
    ): Promise<AssessmentRow | null> => {
        const row = await bundle.assessment.one(where, {
            relations: pickRelations(bundle.assessment, {
                ...ASSESSMENT_RELATIONS,
            }),
        });
        return row ? mapAssessmentRow(row) : null;
    };

    const loadInterview = async (
        where: Record<string, unknown>,
    ): Promise<InterviewRow | null> => {
        const row = await bundle.interview.one(where, {
            relations: pickRelations(bundle.interview, {
                ...INTERVIEW_RELATIONS,
            }),
        });
        return row ? mapInterviewRow(row) : null;
    };

    const candidateWritePayload = async (
        row: Partial<CandidateRow>,
    ): Promise<Record<string, unknown>> => {
        const payload: Record<string, unknown> = { ...row };
        if (row.opening !== undefined) {
            const related = await requireRelated(
                bundle.opening,
                GENERATED_HIRING_BUSINESS_ID_FIELDS.JOB_OPENING,
                row.opening,
                'opening',
            );
            payload.opening = assignRef(
                bundle.candidate,
                'opening',
                related,
                row.opening,
            );
        }
        return payload;
    };

    const assessmentWritePayload = async (
        row: Partial<AssessmentRow>,
    ): Promise<Record<string, unknown>> => {
        const payload: Record<string, unknown> = { ...row };
        if (row.candidate !== undefined) {
            const related = await requireRelated(
                bundle.candidate,
                GENERATED_HIRING_BUSINESS_ID_FIELDS.JOB_CANDIDATE,
                row.candidate,
                'candidate',
            );
            payload.candidate = assignRef(
                bundle.assessment,
                'candidate',
                related,
                row.candidate,
            );
        }
        if (row.reviewer !== undefined) {
            const related = await requireRelated(
                bundle.teamMember,
                GENERATED_HIRING_BUSINESS_ID_FIELDS.TEAM_MEMBER,
                row.reviewer,
                'team member',
            );
            payload.reviewer = assignRef(
                bundle.assessment,
                'reviewer',
                related,
                row.reviewer,
            );
        }
        return payload;
    };

    const interviewWritePayload = async (
        row: Partial<InterviewRow>,
    ): Promise<Record<string, unknown>> => {
        const payload: Record<string, unknown> = { ...row };
        if (row.candidate !== undefined) {
            const related = await requireRelated(
                bundle.candidate,
                GENERATED_HIRING_BUSINESS_ID_FIELDS.JOB_CANDIDATE,
                row.candidate,
                'candidate',
            );
            payload.candidate = assignRef(
                bundle.interview,
                'candidate',
                related,
                row.candidate,
            );
        }
        if (row.interviewer !== undefined) {
            const related = await requireRelated(
                bundle.teamMember,
                GENERATED_HIRING_BUSINESS_ID_FIELDS.TEAM_MEMBER,
                row.interviewer,
                'team member',
            );
            payload.interviewer = assignRef(
                bundle.interview,
                'interviewer',
                related,
                row.interviewer,
            );
        }
        return payload;
    };

    const updateByBusinessId = async (args: {
        ops: HiringEntityOps;
        businessField: string;
        businessId: string;
        kind: string;
        patch: Record<string, unknown>;
        reload: () => Promise<unknown | null>;
    }): Promise<unknown> => {
        const existing = await args.ops.one({
            [args.businessField]: args.businessId,
        });
        if (!existing) {
            return missing(args.kind, args.businessId);
        }
        const pk = args.ops.getPrimaryKey(existing);
        const affected = await args.ops.updateByPk(pk, args.patch);
        if (affected === 0) {
            return missing(args.kind, args.businessId);
        }
        const reloaded = await args.reload();
        if (!reloaded) {
            return missing(args.kind, args.businessId);
        }
        return reloaded;
    };

    return {
        withTransaction: (work) => bundle.withTransaction(work),

        findTeamMemberByEmail: async (email) => {
            const normalized = email.trim().toLowerCase();
            const exact = await loadTeamMember({ email: normalized });
            if (exact) {
                return exact;
            }
            // Fallback: case-sensitive store may keep original casing
            const rows = await bundle.teamMember.filter({});
            for (const row of rows) {
                const mapped = mapTeamMemberRow(row);
                if (mapped.email.toLowerCase() === normalized) {
                    return mapped;
                }
            }
            return null;
        },

        findTeamMemberById: async (memberId) =>
            loadTeamMember({
                [GENERATED_HIRING_BUSINESS_ID_FIELDS.TEAM_MEMBER]: memberId,
            }),

        findOpeningById: async (openingId) => loadOpening(openingId),

        findCandidateById: async (candidateId) => loadCandidate(candidateId),

        findAssessmentByCandidate: async (candidateId) => {
            if (bundle.assessment.isRelation('candidate')) {
                return loadAssessment({
                    candidate: {
                        [GENERATED_HIRING_BUSINESS_ID_FIELDS.JOB_CANDIDATE]:
                            candidateId,
                    },
                });
            }
            return loadAssessment({ candidate: candidateId });
        },

        findInterviewById: async (interviewId) =>
            loadInterview({
                [GENERATED_HIRING_BUSINESS_ID_FIELDS.JOB_INTERVIEW]:
                    interviewId,
            }),

        listCandidates: async () => {
            const rows = await bundle.candidate.filter(
                {},
                {
                    relations: pickRelations(bundle.candidate, {
                        ...CANDIDATE_RELATIONS,
                    }),
                },
            );
            return rows.map(mapCandidateRow);
        },

        listOpenings: async () => {
            const rows = await bundle.opening.filter(
                {},
                {
                    relations: pickRelations(bundle.opening, {
                        ...OPENING_RELATIONS,
                    }),
                },
            );
            return rows.map(mapOpeningRow);
        },

        listAssessments: async () => {
            const rows = await bundle.assessment.filter(
                {},
                {
                    relations: pickRelations(bundle.assessment, {
                        ...ASSESSMENT_RELATIONS,
                    }),
                },
            );
            return rows.map(mapAssessmentRow);
        },

        listInterviews: async () => {
            const rows = await bundle.interview.filter(
                {},
                {
                    relations: pickRelations(bundle.interview, {
                        ...INTERVIEW_RELATIONS,
                    }),
                },
            );
            return rows.map(mapInterviewRow);
        },

        listInterviewsForCandidate: async (candidateId) => {
            const relations = pickRelations(bundle.interview, {
                ...INTERVIEW_RELATIONS,
            });
            if (bundle.interview.isRelation('candidate')) {
                const viaRelation = await bundle.interview.filter(
                    {
                        candidate: {
                            [GENERATED_HIRING_BUSINESS_ID_FIELDS.JOB_CANDIDATE]:
                                candidateId,
                        },
                    },
                    { relations },
                );
                return viaRelation.map(mapInterviewRow);
            }
            const viaScalar = await bundle.interview.filter(
                { candidate: candidateId },
                { relations },
            );
            return viaScalar.map(mapInterviewRow);
        },

        countHiredForOpening: async (openingId) => {
            const candidates = await bundle.candidate.filter(
                {},
                {
                    relations: pickRelations(bundle.candidate, {
                        ...CANDIDATE_RELATIONS,
                    }),
                },
            );
            let count = 0;
            for (const row of candidates) {
                const mapped = mapCandidateRow(row);
                if (
                    mapped.opening === openingId &&
                    mapped.stage === 'Hired'
                ) {
                    count += 1;
                }
            }
            return count;
        },

        /**
         * Allocates the next business id from a max scan. Concurrent callers can
         * race; uniqueness must be enforced by a unique constraint on the
         * business-id column in the generated schema (integration dependency).
         */
        nextCandidateId: async () => {
            const rows = await bundle.candidate.filter({});
            return nextBusinessId({
                existingIds: rows.map((row) =>
                    readString(
                        row,
                        GENERATED_HIRING_BUSINESS_ID_FIELDS.JOB_CANDIDATE,
                    ),
                ),
                prefix: GENERATED_HIRING_ID_PREFIX.CANDIDATE,
                pad: GENERATED_HIRING_ID_PAD.CANDIDATE,
            });
        },

        nextAssessmentId: async () => {
            const rows = await bundle.assessment.filter({});
            return nextBusinessId({
                existingIds: rows.map((row) =>
                    readString(
                        row,
                        GENERATED_HIRING_BUSINESS_ID_FIELDS.JOB_ASSESSMENT,
                    ),
                ),
                prefix: GENERATED_HIRING_ID_PREFIX.ASSESSMENT,
                pad: GENERATED_HIRING_ID_PAD.ASSESSMENT,
            });
        },

        nextInterviewId: async () => {
            const rows = await bundle.interview.filter({});
            return nextBusinessId({
                existingIds: rows.map((row) =>
                    readString(
                        row,
                        GENERATED_HIRING_BUSINESS_ID_FIELDS.JOB_INTERVIEW,
                    ),
                ),
                prefix: GENERATED_HIRING_ID_PREFIX.INTERVIEW,
                pad: GENERATED_HIRING_ID_PAD.INTERVIEW,
            });
        },

        createCandidate: async (row) => {
            const payload = await candidateWritePayload(row);
            await bundle.candidate.createOne(payload);
            const created = await loadCandidate(row.candidate_id);
            if (!created) {
                return missing('candidate', row.candidate_id);
            }
            return created;
        },

        updateCandidate: async (candidateId, patch) => {
            const payload = await candidateWritePayload(patch);
            const reloaded = await updateByBusinessId({
                ops: bundle.candidate,
                businessField:
                    GENERATED_HIRING_BUSINESS_ID_FIELDS.JOB_CANDIDATE,
                businessId: candidateId,
                kind: 'candidate',
                patch: payload,
                reload: () =>
                    bundle.candidate.one(
                        {
                            [GENERATED_HIRING_BUSINESS_ID_FIELDS.JOB_CANDIDATE]:
                                candidateId,
                        },
                        {
                            relations: pickRelations(bundle.candidate, {
                                ...CANDIDATE_RELATIONS,
                            }),
                        },
                    ),
            });
            return mapCandidateRow(reloaded);
        },

        createAssessment: async (row) => {
            const payload = await assessmentWritePayload(row);
            await bundle.assessment.createOne(payload);
            const created = await loadAssessment({
                [GENERATED_HIRING_BUSINESS_ID_FIELDS.JOB_ASSESSMENT]:
                    row.assessment_id,
            });
            if (!created) {
                return missing('assessment', row.assessment_id);
            }
            return created;
        },

        updateAssessment: async (assessmentId, patch) => {
            const payload = await assessmentWritePayload(patch);
            const reloaded = await updateByBusinessId({
                ops: bundle.assessment,
                businessField:
                    GENERATED_HIRING_BUSINESS_ID_FIELDS.JOB_ASSESSMENT,
                businessId: assessmentId,
                kind: 'assessment',
                patch: payload,
                reload: () =>
                    bundle.assessment.one(
                        {
                            [GENERATED_HIRING_BUSINESS_ID_FIELDS.JOB_ASSESSMENT]:
                                assessmentId,
                        },
                        {
                            relations: pickRelations(bundle.assessment, {
                                ...ASSESSMENT_RELATIONS,
                            }),
                        },
                    ),
            });
            return mapAssessmentRow(reloaded);
        },

        createInterview: async (row) => {
            const payload = await interviewWritePayload(row);
            await bundle.interview.createOne(payload);
            const created = await loadInterview({
                [GENERATED_HIRING_BUSINESS_ID_FIELDS.JOB_INTERVIEW]:
                    row.interview_id,
            });
            if (!created) {
                return missing('interview', row.interview_id);
            }
            return created;
        },

        updateInterview: async (interviewId, patch) => {
            const payload = await interviewWritePayload(patch);
            const reloaded = await updateByBusinessId({
                ops: bundle.interview,
                businessField:
                    GENERATED_HIRING_BUSINESS_ID_FIELDS.JOB_INTERVIEW,
                businessId: interviewId,
                kind: 'interview',
                patch: payload,
                reload: () =>
                    bundle.interview.one(
                        {
                            [GENERATED_HIRING_BUSINESS_ID_FIELDS.JOB_INTERVIEW]:
                                interviewId,
                        },
                        {
                            relations: pickRelations(bundle.interview, {
                                ...INTERVIEW_RELATIONS,
                            }),
                        },
                    ),
            });
            return mapInterviewRow(reloaded);
        },

        cancelScheduledInterviews: async (candidateId) => {
            const interviews = await bundle.interview.filter(
                {},
                {
                    relations: pickRelations(bundle.interview, {
                        ...INTERVIEW_RELATIONS,
                    }),
                },
            );
            let count = 0;
            for (const row of interviews) {
                const mapped = mapInterviewRow(row);
                if (
                    mapped.candidate === candidateId &&
                    mapped.status === 'Scheduled'
                ) {
                    const pk = bundle.interview.getPrimaryKey(row);
                    await bundle.interview.updateByPk(pk, {
                        status: 'Cancelled',
                    });
                    count += 1;
                }
            }
            return count;
        },
    };
};

export { createHiringPersistenceFromOps };
export type { HiringEntityBundle };
