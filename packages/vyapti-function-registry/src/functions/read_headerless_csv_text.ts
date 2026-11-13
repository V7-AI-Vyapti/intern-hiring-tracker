import type { FunctionDefinition } from '../types.js';

export const readHeaderlessCsvTextDefinition = {
    function_name: 'read_headerless_csv_text',
    function_description:
        'Prepend a CSV header row to headerless CSV text before parsing.',
    function_attributes: [
        {
            attribute_name: 'text',
            attribute_data_type: 'string',
            order: 1,
            required: true,
        },
        {
            attribute_name: 'headers',
            attribute_data_type: 'string[]',
            order: 2,
            required: true,
        },
    ],
    function_returns: [
        {
            attribute_name: 'text',
            attribute_data_type: 'string',
            order: 1,
        },
    ],
} satisfies FunctionDefinition;

export function read_headerless_csv_text(args: {
    text: string;
    headers: readonly string[];
}): string {
    return [args.headers.join(','), args.text].join('\n');
}
