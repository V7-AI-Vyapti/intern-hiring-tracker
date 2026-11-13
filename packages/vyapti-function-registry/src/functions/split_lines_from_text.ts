import type { FunctionDefinition } from '../types.js';

export const splitLinesFromTextDefinition = {
    function_name: 'split_lines_from_text',
    function_description: 'Split text into trimmed non-empty lines.',
    function_attributes: [
        {
            attribute_name: 'text',
            attribute_data_type: 'string',
            order: 1,
        },
    ],
    function_returns: [
        {
            attribute_name: 'lines',
            attribute_data_type: 'string[]',
            order: 1,
        },
    ],
} satisfies FunctionDefinition;

export function split_lines_from_text(args: { text: string }): string[] {
    return args.text
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);
}
