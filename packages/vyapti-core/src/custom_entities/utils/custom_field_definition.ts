import { type FieldKind, type ModelField } from '../types.js';

export class CustomFieldDefinition implements ModelField {
    constructor(
        public readonly kind: FieldKind,
        public readonly options: Record<string, unknown> = {},
    ) {}
}

export function isFieldDefinition(value: unknown): value is ModelField {
    return value instanceof CustomFieldDefinition;
}
