import {
    EntitySchema,
    type EntitySchemaColumnOptions,
    type EntitySchemaRelationOptions,
} from 'typeorm';
import { ON_DELETE_NO_ACTION, ON_DELETE_DO_NOTHING } from './constants.js';
import { type FieldOptions, type ModelClass } from './types.js';
import { deriveEntityName } from './utils/derive_entity_name.js';
import { deriveTableName } from './utils/derive_table_name.js';

export function buildEntitySchema(modelClass: ModelClass): EntitySchema {
    const entityName = deriveEntityName(modelClass);
    const tableName = deriveTableName(modelClass, entityName);
    const fields = modelClass.getModelFields();

    const columns: Record<string, EntitySchemaColumnOptions> = {};
    const relations: Record<string, EntitySchemaRelationOptions> = {};

    for (const [propertyName, field] of Object.entries(fields)) {
        const options = (field.options ?? {}) as FieldOptions;

        if (field.kind === 'AutoPK') {
            columns[propertyName] = {
                type: Number,
                primary: true,
                generated: true,
                name: options.db_column ?? options.name ?? propertyName,
            };
        } else if (field.kind === 'CharacterString') {
            columns[propertyName] = {
                type: String,
                length: options.max_length ?? 255,
                nullable: options.null ?? true,
                default: options.default,
                unique: options.unique ?? false,
                name: options.db_column ?? options.name ?? propertyName,
            };
        } else if (field.kind === 'Text') {
            columns[propertyName] = {
                type: 'text',
                nullable: options.null ?? true,
                default: options.default,
                name: options.db_column ?? options.name ?? propertyName,
            };
        } else if (field.kind === 'Decimal') {
            columns[propertyName] = {
                type: 'decimal',
                precision: options.precision ?? 18,
                scale: options.scale ?? 4,
                nullable: options.null ?? true,
                default: options.default,
                name: options.db_column ?? options.name ?? propertyName,
            };
        } else if (field.kind === 'Integer') {
            columns[propertyName] = {
                type: Number,
                nullable: options.null ?? true,
                default: options.default,
                unique: options.unique ?? false,
                name: options.db_column ?? options.name ?? propertyName,
            };
        } else if (field.kind === 'JSON') {
            columns[propertyName] = {
                type: 'json',
                nullable: options.null ?? true,
                default: options.default,
                name: options.db_column ?? options.name ?? propertyName,
            };
        } else if (field.kind === 'Boolean') {
            columns[propertyName] = {
                type: Boolean,
                nullable: options.null ?? false,
                default: options.default ?? false,
                name: options.db_column ?? options.name ?? propertyName,
            };
        } else if (field.kind === 'Timestamps') {
            columns[propertyName] = {
                type: 'timestamp',
                nullable: options.null ?? true,
                default: options.default,
                createDate: options.create_date === true,
                updateDate: options.update_date === true,
                name: options.db_column ?? options.name ?? propertyName,
            };
        } else if (field.kind === 'FK') {
            if (!options.model_name) {
                throw new Error(
                    `FK field "${propertyName}" is missing model_name`,
                );
            }

            relations[propertyName] = {
                type: 'many-to-one',
                target: options.model_name,
                nullable: options.null ?? true,
                onDelete:
                    options.on_delete === ON_DELETE_DO_NOTHING
                        ? ON_DELETE_NO_ACTION
                        : (options.on_delete ?? ON_DELETE_NO_ACTION),
                joinColumn: { name: options.db_column ?? propertyName },
            };
        }
    }

    const uniques = (modelClass.uniques ?? [])
        .filter((columns) => Array.isArray(columns) && columns.length > 0)
        .map((columns) => ({ columns }));

    return new EntitySchema({
        target: modelClass,
        name: entityName,
        tableName,
        columns,
        relations,
        ...(uniques.length > 0 ? { uniques } : {}),
    });
}
