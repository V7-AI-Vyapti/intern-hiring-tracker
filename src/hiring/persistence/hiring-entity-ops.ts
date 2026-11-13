/**
 * Entity access surface used by the hiring persistence adapter.
 * Production wires TypeORM via getEntityWithName; tests supply mocks.
 */
type FindOptions = {
    relations?: Record<string, boolean>;
    order?: Record<string, 'ASC' | 'DESC'>;
    take?: number;
};

type HiringEntityOps = {
    one(
        where: Record<string, unknown>,
        options?: FindOptions,
    ): Promise<unknown | null>;
    filter(
        where: Record<string, unknown>,
        options?: FindOptions,
    ): Promise<unknown[]>;
    createOne(data: Record<string, unknown>): Promise<unknown>;
    /**
     * Update by AutoPK. Returns affected row count.
     */
    updateByPk(id: string | number, patch: Record<string, unknown>): Promise<number>;
    getPrimaryKey(row: unknown): string | number;
    /**
     * True when the property is a ManyToOne (or similar) relation on the
     * generated entity. False when it is a scalar column (e.g. CharacterString).
     *
     * INTEGRATION: job_candidate.opening may be missing from foreign_key_map;
     * runtime metadata decides whether writes assign a related row or a string.
     */
    isRelation(propertyName: string): boolean;
};

type HiringEntityBundle = {
    teamMember: HiringEntityOps;
    opening: HiringEntityOps;
    candidate: HiringEntityOps;
    assessment: HiringEntityOps;
    interview: HiringEntityOps;
    withTransaction<T>(work: () => Promise<T>): Promise<T>;
};

export type { FindOptions, HiringEntityBundle, HiringEntityOps };
