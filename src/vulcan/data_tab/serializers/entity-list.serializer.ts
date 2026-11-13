import {
    DataTabEntityItemSchema,
    type DataTabEntityItem,
} from '@data-tab/schema/entity-list.schema';
import {
    readDescription,
    readNumber,
    readString,
} from '@vulcan/shared/utils/record-readers';

const readOptionalField = (
    record: unknown,
    fieldName: string,
): unknown | undefined => {
    if (!record || typeof record !== 'object') {
        return undefined;
    }

    const value = (record as Record<string, unknown>)[fieldName];
    return value === undefined ? undefined : value;
};

export const serializeEntityRow = (entity: unknown): DataTabEntityItem => {
    const payload: Record<string, unknown> = {
        entity_id: readNumber(entity, 'entity_id'),
        entity_name: readString(entity, 'entity_name'),
        description: readDescription(readOptionalField(entity, 'description')),
    };

    const fields = readOptionalField(entity, 'fields');
    if (fields !== undefined) {
        payload.fields = fields;
    }

    const entityTypeId = readOptionalField(entity, 'entity_type_id');
    if (entityTypeId !== undefined && entityTypeId !== null) {
        payload.entity_type_id = readNumber(entity, 'entity_type_id');
    }

    return DataTabEntityItemSchema.parse(payload);
};
