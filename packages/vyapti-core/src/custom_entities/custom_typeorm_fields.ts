import {
    type CommonFieldOptions,
    type ForeignKeyFieldOptions,
    type ModelField,
    type TimestampsFieldOptions,
} from './types.js';
import { defineField } from './utils/define_field.js';
import {
    TYPE_ORM_FIELD_NAME_AUTO_PK,
    TYPE_ORM_FIELD_NAME_CHARACTER_STRING,
    TYPE_ORM_FIELD_NAME_TEXT,
    TYPE_ORM_FIELD_NAME_DECIMAL,
    TYPE_ORM_FIELD_NAME_INTEGER,
    TYPE_ORM_FIELD_NAME_JSON,
    TYPE_ORM_FIELD_NAME_BOOLEAN,
    TYPE_ORM_FIELD_NAME_TIMESTAMPS,
    TYPE_ORM_FIELD_NAME_FK,
    ON_DELETE_DEFAULT,
} from './constants.js';

export const CustomTypeormFields = {
    AutoPK(options: CommonFieldOptions = {}): ModelField | undefined {
        return defineField(TYPE_ORM_FIELD_NAME_AUTO_PK, options);
    },
    CharacterString(
        options: CommonFieldOptions & { max_length?: number } = {},
    ): ModelField | undefined {
        return defineField(TYPE_ORM_FIELD_NAME_CHARACTER_STRING, {
            max_length: 255,
            null: true,
            blank: true,
            ...options,
        });
    },
    Text(options: CommonFieldOptions = {}): ModelField | undefined {
        return defineField(TYPE_ORM_FIELD_NAME_TEXT, {
            null: true,
            blank: true,
            ...options,
        });
    },
    Decimal(
        options: CommonFieldOptions & {
            precision?: number;
            scale?: number;
        } = {},
    ): ModelField | undefined {
        return defineField(TYPE_ORM_FIELD_NAME_DECIMAL, {
            precision: 18,
            scale: 4,
            null: true,
            blank: true,
            ...options,
        });
    },
    Integer(options: CommonFieldOptions = {}): ModelField | undefined {
        return defineField(TYPE_ORM_FIELD_NAME_INTEGER, {
            null: true,
            blank: true,
            ...options,
        });
    },
    JSON(options: CommonFieldOptions = {}): ModelField | undefined {
        return defineField(TYPE_ORM_FIELD_NAME_JSON, {
            null: true,
            blank: true,
            ...options,
        });
    },
    Boolean(options: CommonFieldOptions = {}): ModelField | undefined {
        return defineField(TYPE_ORM_FIELD_NAME_BOOLEAN, {
            null: false,
            blank: false,
            default: false,
            ...options,
        });
    },
    Timestamps(options: TimestampsFieldOptions = {}): ModelField | undefined {
        const managed =
            options.create_date === true || options.update_date === true;
        return defineField(TYPE_ORM_FIELD_NAME_TIMESTAMPS, {
            null: !managed,
            blank: !managed,
            ...options,
        });
    },
    FK(options: ForeignKeyFieldOptions): ModelField | undefined {
        return defineField(TYPE_ORM_FIELD_NAME_FK, {
            null: true,
            blank: true,
            on_delete: ON_DELETE_DEFAULT,
            ...options,
        });
    },
};
