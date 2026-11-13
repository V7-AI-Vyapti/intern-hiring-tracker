import { FieldKind } from '../types.js';
import { ModelField } from '../types.js';
import { isCollectingModelFields } from './field_collection_context.js';
import { CustomFieldDefinition } from './custom_field_definition.js';

export function defineField(
    kind: FieldKind,
    options: Record<string, unknown>,
): ModelField | undefined {
    if (!isCollectingModelFields()) return undefined;
    return new CustomFieldDefinition(kind, options);
}
