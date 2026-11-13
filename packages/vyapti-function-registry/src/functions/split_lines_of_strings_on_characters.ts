import type { FunctionDefinition } from '../types.js';

export const splitLinesOfStringsOnCharactersDefinition = {
    function_name: 'split_lines_of_strings_on_characters',
    function_description: 'Split each line on the given characters.',
    function_attributes: [
        {
            attribute_name: 'lines',
            attribute_data_type: 'string[]',
            order: 1,
        },
        {
            attribute_name: 'characters',
            attribute_data_type: 'string[]',
            order: 2,
        },
    ],
    function_returns: [
        {
            attribute_name: 'sentences',
            attribute_data_type: 'string[]',
            order: 1,
        },
    ],
} satisfies FunctionDefinition;

export function split_lines_of_strings_on_characters(args: {
    lines: string[];
    characters: string[];
}): string[] {
    const splitPattern = new RegExp(`[${args.characters.join('')}]`);
    return args.lines
        .flatMap((line) => line.split(splitPattern))
        .map((line) => line.trim())
        .filter(Boolean);
}
