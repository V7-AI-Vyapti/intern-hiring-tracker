import {
    ON_DELETE_CASCADE,
    ON_DELETE_RESTRICT,
    ON_DELETE_SET_NULL,
    ON_DELETE_NO_ACTION,
    ON_DELETE_DO_NOTHING,
    TYPE_ORM_FIELD_NAME_AUTO_PK,
    TYPE_ORM_FIELD_NAME_CHARACTER_STRING,
    TYPE_ORM_FIELD_NAME_TEXT,
    TYPE_ORM_FIELD_NAME_DECIMAL,
    TYPE_ORM_FIELD_NAME_INTEGER,
    TYPE_ORM_FIELD_NAME_JSON,
    TYPE_ORM_FIELD_NAME_BOOLEAN,
    TYPE_ORM_FIELD_NAME_TIMESTAMPS,
    TYPE_ORM_FIELD_NAME_FK,
} from './constants.js';
import { CustomTypeormEntityBase } from './custom_typeorm_entities.js';

type OnDeleteOption =
    | typeof ON_DELETE_CASCADE
    | typeof ON_DELETE_RESTRICT
    | typeof ON_DELETE_SET_NULL
    | typeof ON_DELETE_NO_ACTION
    | typeof ON_DELETE_DO_NOTHING;

type FieldKind =
    | typeof TYPE_ORM_FIELD_NAME_AUTO_PK
    | typeof TYPE_ORM_FIELD_NAME_CHARACTER_STRING
    | typeof TYPE_ORM_FIELD_NAME_TEXT
    | typeof TYPE_ORM_FIELD_NAME_DECIMAL
    | typeof TYPE_ORM_FIELD_NAME_INTEGER
    | typeof TYPE_ORM_FIELD_NAME_JSON
    | typeof TYPE_ORM_FIELD_NAME_BOOLEAN
    | typeof TYPE_ORM_FIELD_NAME_TIMESTAMPS
    | typeof TYPE_ORM_FIELD_NAME_FK;

type CommonFieldOptions = {
    name?: string;
    help_text?: string;
    verbose_name?: string;
    db_column?: string;
    null?: boolean;
    blank?: boolean;
    default?: unknown;
    unique?: boolean;
};

type TimestampsFieldOptions = CommonFieldOptions & {
    /** TypeORM sets this column on insert. */
    create_date?: boolean;
    /** TypeORM sets this column on insert and update. */
    update_date?: boolean;
};

type ForeignKeyFieldOptions = CommonFieldOptions & {
    app_name?: string;
    model_name: string;
    db_column: string;
    on_delete?: OnDeleteOption;
    related_name?: string;
};

type FieldOptions = {
    name?: string;
    db_column?: string;
    null?: boolean;
    default?: unknown;
    max_length?: number;
    precision?: number;
    scale?: number;
    model_name?: string;
    unique?: boolean;
    on_delete?: OnDeleteOption;
    create_date?: boolean;
    update_date?: boolean;
};

type ModelClass = {
    new (): CustomTypeormEntityBase;
    name: string;
    entityName?: string;
    tableName?: string;
    uniques?: string[][];
    getModelFields(): Record<string, ModelField>;
};

type ModelField = {
    readonly kind: FieldKind;
    readonly options: Record<string, unknown>;
};

export type {
    OnDeleteOption,
    FieldKind,
    CommonFieldOptions,
    TimestampsFieldOptions,
    ForeignKeyFieldOptions,
    FieldOptions,
    ModelClass,
    ModelField,
};
