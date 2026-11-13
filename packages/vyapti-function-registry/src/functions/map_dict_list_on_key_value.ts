import type { FunctionDefinition } from '../types.js';

export const mapDictListOnKeyValueDefinition = {
    function_name: 'map_dict_list_on_key_value',
    function_description:
        'Remap each record in a list using a JSON object of target_key -> source_key pairs.',
    function_attributes: [
        {
            attribute_name: 'records',
            attribute_data_type: 'object[]',
            order: 1,
        },
        {
            attribute_name: 'field_mapping',
            attribute_data_type: 'string',
            order: 2,
        },
    ],
    function_returns: [
        {
            attribute_name: 'records',
            attribute_data_type: 'object[]',
            order: 1,
        },
    ],
} satisfies FunctionDefinition;

function parseFieldMapping(fieldMapping: string): Record<string, string> {
    const parsed: unknown = JSON.parse(fieldMapping);

    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        throw new Error(
            'map_dict_list_on_key_value field_mapping must be a JSON object',
        );
    }

    const mapping: Record<string, string> = {};

    for (const [targetKey, sourceKey] of Object.entries(parsed)) {
        if (typeof sourceKey !== 'string' || sourceKey.trim().length === 0) {
            throw new Error(
                `map_dict_list_on_key_value field_mapping values must be non-empty strings (target=${targetKey})`,
            );
        }

        mapping[targetKey] = sourceKey;
    }

    return mapping;
}

export function map_dict_list_on_key_value(args: {
    records: Record<string, unknown>[];
    field_mapping: string;
}): Record<string, unknown>[] {
    const mapping = parseFieldMapping(args.field_mapping);

    return args.records.map((record) => {
        const mapped: Record<string, unknown> = {};

        for (const [targetKey, sourceKey] of Object.entries(mapping)) {
            mapped[targetKey] = record[sourceKey];
        }

        return mapped;
    });
}
