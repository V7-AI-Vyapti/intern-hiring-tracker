import { NotFoundException } from '@nestjs/common';
import {
    BaseEntity,
    IsNull,
    QueryFailedError,
    type DataSource,
    type DeepPartial,
    type FindManyOptions,
    type FindOneOptions,
    type FindOptionsRelations,
    type FindOptionsWhere,
    type QueryDeepPartialEntity,
    type Repository,
} from 'typeorm';
import { setCollectingModelFields } from './utils/field_collection_context.js';
import { isFieldDefinition } from './utils/custom_field_definition.js';
import { type ModelField } from './types.js';
import { TYPE_ORM_FIELD_NAME_AUTO_PK } from './constants.js';

type EntityCtor<T extends CustomTypeormEntityBase = CustomTypeormEntityBase> = {
    new (): T;
} & typeof CustomTypeormEntityBase;
export type EntityModelClass<
    T extends CustomTypeormEntityBase = CustomTypeormEntityBase,
> = EntityCtor<T>;

type WhereInput =
    | FindOptionsWhere<any>
    | FindOptionsWhere<any>[]
    | Record<string, unknown>
    | Array<Record<string, unknown>>;

type UpsertConflictArg = Parameters<Repository<any>['upsert']>[1];

const normalizeEntityName = (value: string): string => {
    return value.trim().toLowerCase().replace(/\s+/g, '_').replace(/-/g, '_');
};

export const getEntityWithName = <
    T extends CustomTypeormEntityBase = CustomTypeormEntityBase,
>(
    entityName: string,
    dataSource: DataSource,
): EntityModelClass<T> => {
    const normalizedInput = normalizeEntityName(entityName);
    const models = dataSource.entityMetadatas
        .map((metadata) => metadata.target)
        .filter((target): target is EntityModelClass<T> => {
            return typeof target === 'function';
        });

    for (const model of models) {
        const candidateNames = [
            model.name,
            model.tableName,
            model.entityName,
        ].filter((value): value is string => typeof value === 'string');

        for (const candidateName of candidateNames) {
            if (normalizeEntityName(candidateName) === normalizedInput) {
                return model;
            }
        }
    }

    throw new NotFoundException(
        `No registered runtime model found for entity '${entityName}'`,
    );
};

function isRecord(value: unknown): value is Record<string, unknown> {
    return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

const BULK_INSERT_BATCH_SIZE = 1000;

async function insertRowsInBatches<T extends CustomTypeormEntityBase>(args: {
    repo: Repository<T>;
    rows: Array<Record<string, unknown>>;
}): Promise<void> {
    for (
        let index = 0;
        index < args.rows.length;
        index += BULK_INSERT_BATCH_SIZE
    ) {
        const batch = args.rows.slice(index, index + BULK_INSERT_BATCH_SIZE);

        await args.repo.insert(batch as QueryDeepPartialEntity<T>[]);
    }
}

function normalizeBulkInsertRows(
    data: unknown,
): Array<Record<string, unknown>> {
    if (Array.isArray(data)) {
        if (data.every(isRecord)) {
            return data;
        }

        throw new Error('bulk_insert_entity_records data must contain objects');
    }

    if (isRecord(data)) {
        return [data];
    }

    throw new Error(
        'bulk_insert_entity_records data must be an object or array of objects',
    );
}

export async function bulk_insert_entity_records<
    T extends CustomTypeormEntityBase,
>(args: {
    entityName: string;
    dataSource: DataSource;
    data: unknown;
}): Promise<void> {
    const rows = normalizeBulkInsertRows(args.data);
    if (rows.length === 0) return;
    const entityModel = getEntityWithName<T>(args.entityName, args.dataSource);

    await insertRowsInBatches({
        repo: entityModel.getRepository<T>(),
        rows,
    });
}

function isUniqueConstraintError(error: unknown): boolean {
    if (!(error instanceof QueryFailedError)) return false;

    const driverError = (error as QueryFailedError & { driverError?: unknown })
        .driverError as
        | { code?: string | number; errno?: string | number; message?: string }
        | undefined;

    const code = String(driverError?.code ?? driverError?.errno ?? '');
    if (
        code === '23505' ||
        code === '1062' ||
        code === '19' ||
        code === 'SQLITE_CONSTRAINT' ||
        code === 'ER_DUP_ENTRY'
    ) {
        return true;
    }

    return /unique|duplicate/i.test(driverError?.message ?? '');
}

export abstract class CustomTypeormEntityBase extends BaseEntity {
    static entityName?: string;
    static tableName?: string;
    static uniques?: string[][];

    static getModelFields<T extends object>(
        this: new () => T,
    ): Record<string, ModelField> {
        setCollectingModelFields(true);
        let instance: T;
        try {
            instance = new this();
        } finally {
            setCollectingModelFields(false);
        }

        return Object.entries(instance as Record<string, unknown>).reduce<
            Record<string, ModelField>
        >((acc, [key, value]) => {
            if (isFieldDefinition(value)) acc[key] = value;
            return acc;
        }, {});
    }

    static getPrimaryKeyFieldName<T extends CustomTypeormEntityBase>(
        this: EntityCtor<T>,
    ): string {
        for (const [fieldName, field] of Object.entries(
            this.getModelFields(),
        )) {
            if (field.kind === TYPE_ORM_FIELD_NAME_AUTO_PK) return fieldName;
        }

        throw new Error(
            `${this.name} has no AutoPK field. Add CustomTypeormFields.AutoPK(...)`,
        );
    }

    static async all<T extends CustomTypeormEntityBase>(
        this: EntityCtor<T>,
        options: FindManyOptions<any> = {},
    ): Promise<T[]> {
        return this.getRepository<T>().find(options as FindManyOptions<T>);
    }

    static async filter<T extends CustomTypeormEntityBase>(
        this: EntityCtor<T>,
        where: WhereInput,
        options: Omit<FindManyOptions<any>, 'where'> = {},
    ): Promise<T[]> {
        return this.getRepository<T>().find({
            ...(options as FindManyOptions<T>),
            where: where as FindOptionsWhere<T> | FindOptionsWhere<T>[],
        });
    }

    static async isNull<T extends CustomTypeormEntityBase>(
        this: EntityCtor<T>,
        params: {
            field: string;
            where?: Record<string, unknown>;
        },
        options: Omit<FindManyOptions<any>, 'where'> = {},
    ): Promise<T[]> {
        const fieldName = params.field.trim();
        if (fieldName.length === 0) {
            throw new Error(`${this.name}.isNull requires a field name`);
        }
        const fields = this.getModelFields();
        if (!Object.hasOwn(fields, fieldName)) {
            throw new Error(`${this.name} has no field "${fieldName}"`);
        }
        return this.getRepository<T>().find({
            ...(options as FindManyOptions<T>),
            where: {
                ...(params.where ?? {}),
                [fieldName]: IsNull(),
            } as FindOptionsWhere<T>,
        });
    }

    static async one<T extends CustomTypeormEntityBase>(
        this: EntityCtor<T>,
        where: WhereInput,
        options: Omit<FindOneOptions<any>, 'where'> = {},
    ): Promise<T | null> {
        return this.getRepository<T>().findOne({
            ...(options as FindOneOptions<T>),
            where: where as FindOptionsWhere<T>,
        });
    }

    static async getByPk<T extends CustomTypeormEntityBase>(
        this: EntityCtor<T>,
        id: string | number,
        options: Omit<FindOneOptions<any>, 'where'> = {},
    ): Promise<T | null> {
        const pk = this.getPrimaryKeyFieldName();
        return this.getRepository<T>().findOne({
            ...(options as FindOneOptions<T>),
            where: { [pk]: id } as FindOptionsWhere<T>,
        });
    }

    static async countOf<T extends CustomTypeormEntityBase>(
        this: EntityCtor<T>,
        where?: WhereInput,
    ): Promise<number> {
        if (!where) return this.getRepository<T>().count();
        return this.getRepository<T>().count({
            where: where as FindOptionsWhere<T> | FindOptionsWhere<T>[],
        });
    }

    static async selectRelated<T extends CustomTypeormEntityBase>(
        this: EntityCtor<T>,
        where: WhereInput,
        relations: FindOptionsRelations<any> | Record<string, unknown>,
        options: Omit<
            FindManyOptions<any>,
            'where' | 'relations' | 'relationLoadStrategy'
        > = {},
    ): Promise<T[]> {
        return this.getRepository<T>().find({
            ...(options as FindManyOptions<T>),
            where: where as FindOptionsWhere<T> | FindOptionsWhere<T>[],
            relations: relations as FindOptionsRelations<T>,
            relationLoadStrategy: 'join',
        });
    }

    static async prefetchRelated<T extends CustomTypeormEntityBase>(
        this: EntityCtor<T>,
        where: WhereInput,
        relations: FindOptionsRelations<any> | Record<string, unknown>,
        options: Omit<
            FindManyOptions<any>,
            'where' | 'relations' | 'relationLoadStrategy'
        > = {},
    ): Promise<T[]> {
        return this.getRepository<T>().find({
            ...(options as FindManyOptions<T>),
            where: where as FindOptionsWhere<T> | FindOptionsWhere<T>[],
            relations: relations as FindOptionsRelations<T>,
            relationLoadStrategy: 'query',
        });
    }

    static async createOne<T extends CustomTypeormEntityBase>(
        this: EntityCtor<T>,
        data: Record<string, unknown>,
    ): Promise<T> {
        const repo = this.getRepository<T>();
        const entity = repo.create(data as DeepPartial<T>);
        return repo.save(entity);
    }

    static async createMany<T extends CustomTypeormEntityBase>(
        this: EntityCtor<T>,
        data: Array<Record<string, unknown>>,
    ): Promise<T[]> {
        if (data.length === 0) return [];
        const repo = this.getRepository<T>();
        const entities = repo.create(data as DeepPartial<T>[]);
        return repo.save(entities);
    }

    static async insertOne<T extends CustomTypeormEntityBase>(
        this: EntityCtor<T>,
        data: Record<string, unknown>,
    ): Promise<void> {
        await this.getRepository<T>().insert(data as QueryDeepPartialEntity<T>);
    }

    static async insertMany<T extends CustomTypeormEntityBase>(
        this: EntityCtor<T>,
        data: Array<Record<string, unknown>>,
    ): Promise<void> {
        if (data.length === 0) return;
        await insertRowsInBatches({
            repo: this.getRepository<T>(),
            rows: data,
        });
    }

    static async getOrCreate<T extends CustomTypeormEntityBase>(
        this: EntityCtor<T>,
        params: {
            where: Record<string, unknown>;
            create?: Record<string, unknown>;
            findOptions?: Omit<FindOneOptions<any>, 'where'>;
        },
    ): Promise<{ entity: T; created: boolean }> {
        const repo = this.getRepository<T>();

        const existing = await repo.findOne({
            ...(params.findOptions as FindOneOptions<T> | undefined),
            where: params.where as FindOptionsWhere<T>,
        });
        if (existing) return { entity: existing, created: false };

        const createPayload = params.create ?? params.where;

        try {
            const createdEntity = await repo.save(
                repo.create(createPayload as DeepPartial<T>),
            );
            return { entity: createdEntity, created: true };
        } catch (error) {
            if (!isUniqueConstraintError(error)) throw error;

            const winner = await repo.findOne({
                ...(params.findOptions as FindOneOptions<T> | undefined),
                where: params.where as FindOptionsWhere<T>,
            });
            if (winner) return { entity: winner, created: false };

            throw error;
        }
    }

    static async updateWhere<T extends CustomTypeormEntityBase>(
        this: EntityCtor<T>,
        where: WhereInput,
        patch: Record<string, unknown>,
    ): Promise<number> {
        const result = await this.getRepository<T>().update(
            where as FindOptionsWhere<T> | FindOptionsWhere<T>[],
            patch as QueryDeepPartialEntity<T>,
        );
        return result.affected ?? 0;
    }

    static async updateByPk<T extends CustomTypeormEntityBase>(
        this: EntityCtor<T>,
        id: string | number,
        patch: Record<string, unknown>,
    ): Promise<number> {
        const pk = this.getPrimaryKeyFieldName();
        const result = await this.getRepository<T>().update(
            { [pk]: id } as FindOptionsWhere<T>,
            patch as QueryDeepPartialEntity<T>,
        );
        return result.affected ?? 0;
    }

    static async upsertOne<T extends CustomTypeormEntityBase>(
        this: EntityCtor<T>,
        row: Record<string, unknown>,
        conflictPathsOrOptions: UpsertConflictArg,
    ): Promise<void> {
        await this.getRepository<T>().upsert(
            row as QueryDeepPartialEntity<T>,
            conflictPathsOrOptions as any,
        );
    }

    static async upsertMany<T extends CustomTypeormEntityBase>(
        this: EntityCtor<T>,
        rows: Array<Record<string, unknown>>,
        conflictPathsOrOptions: UpsertConflictArg,
    ): Promise<void> {
        if (rows.length === 0) return;
        await this.getRepository<T>().upsert(
            rows as QueryDeepPartialEntity<T>[],
            conflictPathsOrOptions as any,
        );
    }

    static async deleteWhere<T extends CustomTypeormEntityBase>(
        this: EntityCtor<T>,
        where: WhereInput,
    ): Promise<number> {
        const result = await this.getRepository<T>().delete(
            where as FindOptionsWhere<T> | FindOptionsWhere<T>[],
        );
        return result.affected ?? 0;
    }

    static async deleteByPk<T extends CustomTypeormEntityBase>(
        this: EntityCtor<T>,
        id: string | number,
    ): Promise<number> {
        const pk = this.getPrimaryKeyFieldName();
        const result = await this.getRepository<T>().delete({
            [pk]: id,
        } as FindOptionsWhere<T>);
        return result.affected ?? 0;
    }
}
