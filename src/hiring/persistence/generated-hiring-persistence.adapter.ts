import { AsyncLocalStorage } from 'node:async_hooks';
import type { DataSource, EntityManager, Repository } from 'typeorm';
import { getEntityWithName } from '@vyapti/core';
import type { HiringPersistenceAdapter } from '@vyapti/hiring';
import { GENERATED_HIRING_ENTITY_NAMES } from '../hiring.constants';
import { createHiringPersistenceFromOps } from './create-hiring-persistence-from-ops';
import type {
    FindOptions,
    HiringEntityBundle,
    HiringEntityOps,
} from './hiring-entity-ops';

/**
 * Host adapter for generated Intern Hiring Tracker apps.
 *
 * Uses getEntityWithName + a bound DataSource (RBAC pattern). Generated entity
 * classes are resolved at runtime — never hard-imported.
 *
 * Remaining generated-app dependencies:
 * - DataSource must be bound via GeneratedHiringBootstrapService (or
 *   bindGeneratedHiringDataSource) after Nest TypeORM init.
 * - Entity models TeamMember / JobOpening / JobCandidate / JobAssessment /
 *   JobInterview must be registered on that DataSource.
 * - job_candidate.opening may be a CharacterString if foreign_key_map is
 *   incomplete; isRelation() chooses string vs related-row assignment.
 * - TypeORM FK join columns default to the related AutoPK; business-id mapping
 *   therefore loads relations on read and resolves related rows on write.
 * - withTransaction uses DataSource.transaction + AsyncLocalStorage so
 *   repository calls inside the adapter participate in the same query runner.
 * - next*Id is max+1 (not locked); require unique business-id columns so
 *   concurrent allocate+create races surface as unique violations.
 */

let hiringDataSource: DataSource | undefined;
const hiringTxStorage = new AsyncLocalStorage<EntityManager>();

function bindGeneratedHiringDataSource(value: DataSource): void {
    hiringDataSource = value;
}

function requireHiringDataSource(): DataSource {
    if (!hiringDataSource) {
        throw new Error(
            'Hiring DataSource is not bound. Ensure GeneratedHiringBootstrapService is registered in the generated app module.',
        );
    }
    return hiringDataSource;
}

type EntityModel = {
    getRepository: <T = unknown>() => Repository<T>;
    getPrimaryKeyFieldName: () => string;
    name?: string;
};

function activeRepository(model: EntityModel): Repository<unknown> {
    const manager = hiringTxStorage.getStore();
    if (manager) {
        return manager.getRepository(model as never);
    }
    return model.getRepository();
}

/**
 * TypeORM find with nested relation where (e.g. candidate: { candidate_id })
 * works for .find/.findOne. Keep that path for DB-backed ops.
 */
function createTypeormEntityOps(entityName: string): HiringEntityOps {
    const modelOf = (): EntityModel =>
        getEntityWithName(entityName, requireHiringDataSource()) as EntityModel;

    return {
        async one(where, options) {
            const model = modelOf();
            const repo = activeRepository(model);
            return repo.findOne({
                where: where as never,
                relations: options?.relations as never,
            });
        },

        async filter(where, options) {
            const model = modelOf();
            const repo = activeRepository(model);
            return repo.find({
                where: where as never,
                relations: options?.relations as never,
                order: options?.order as never,
                take: options?.take,
            });
        },

        async createOne(data) {
            const model = modelOf();
            const repo = activeRepository(model);
            const entity = repo.create(data as never);
            return repo.save(entity);
        },

        async updateByPk(id, patch) {
            const model = modelOf();
            const repo = activeRepository(model);
            const pk = model.getPrimaryKeyFieldName();
            const result = await repo.update(
                { [pk]: id } as never,
                patch as never,
            );
            return result.affected ?? 0;
        },

        getPrimaryKey(row) {
            const model = modelOf();
            const pk = model.getPrimaryKeyFieldName();
            if (!row || typeof row !== 'object') {
                throw new Error(
                    `Cannot read primary key '${pk}' from non-object row`,
                );
            }
            const value = (row as Record<string, unknown>)[pk];
            if (typeof value !== 'string' && typeof value !== 'number') {
                throw new Error(
                    `Primary key '${pk}' missing or invalid on hiring entity '${entityName}'`,
                );
            }
            return value;
        },

        isRelation(propertyName) {
            const ds = requireHiringDataSource();
            const model = modelOf();
            try {
                const meta = ds.getMetadata(model as never);
                return meta.relations.some(
                    (relation) => relation.propertyName === propertyName,
                );
            } catch {
                /**
                 * INTEGRATION POINT: entity metadata unavailable (not yet
                 * generated / not registered). Treat unknown properties as
                 * scalar business-id columns rather than inventing relation
                 * behavior.
                 */
                return false;
            }
        },
    };
}

function createTypeormHiringBundle(): HiringEntityBundle {
    return {
        teamMember: createTypeormEntityOps(
            GENERATED_HIRING_ENTITY_NAMES.TEAM_MEMBER,
        ),
        opening: createTypeormEntityOps(
            GENERATED_HIRING_ENTITY_NAMES.JOB_OPENING,
        ),
        candidate: createTypeormEntityOps(
            GENERATED_HIRING_ENTITY_NAMES.JOB_CANDIDATE,
        ),
        assessment: createTypeormEntityOps(
            GENERATED_HIRING_ENTITY_NAMES.JOB_ASSESSMENT,
        ),
        interview: createTypeormEntityOps(
            GENERATED_HIRING_ENTITY_NAMES.JOB_INTERVIEW,
        ),
        async withTransaction<T>(work: () => Promise<T>): Promise<T> {
            const ds = requireHiringDataSource();
            return ds.transaction(async (manager) =>
                hiringTxStorage.run(manager, work),
            );
        },
    };
}

const createGeneratedHiringPersistenceAdapter =
    (): HiringPersistenceAdapter =>
        createHiringPersistenceFromOps(createTypeormHiringBundle());

export {
    bindGeneratedHiringDataSource,
    createGeneratedHiringPersistenceAdapter,
    createHiringPersistenceFromOps,
    requireHiringDataSource,
};

export type { FindOptions, HiringEntityBundle, HiringEntityOps };
