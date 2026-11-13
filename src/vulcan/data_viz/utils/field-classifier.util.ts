import {
    DIMENSION_KINDS,
    MEASURE_KINDS,
} from '../constants/field-role.constants';

type FieldRole = 'dimension' | 'measure' | 'excluded';

type ClassifiableField = {
    field_name: string;
    kind: string;
};

function classifyField(kind: string): FieldRole {
    if (DIMENSION_KINDS.has(kind)) return 'dimension';
    if (MEASURE_KINDS.has(kind)) return 'measure';
    return 'excluded';
}

function classifyFields(fields: ClassifiableField[]) {
    const dimensions: string[] = [];
    const measures: string[] = [];

    for (const field of fields) {
        const role = classifyField(field.kind);
        if (role === 'dimension') dimensions.push(field.field_name);
        if (role === 'measure') measures.push(field.field_name);
    }

    return { dimensions, measures };
}

function classifyEntityModelFields(fields: Record<string, { kind: string }>) {
    const fieldList = Object.entries(fields).map(([field_name, field]) => ({
        field_name,
        kind: field.kind,
    }));

    return classifyFields(fieldList);
}

export {
    classifyEntityModelFields,
    classifyField,
    classifyFields,
    type ClassifiableField,
    type FieldRole,
};
