import type { FunctionDefinition } from '../types.js';

export const createListOfDictFromListOfStringsDefinition = {
    function_name: 'create_list_of_dict_from_list_of_strings',
    function_description: 'Map each string to a single-key object.',
    function_attributes: [
        {
            attribute_name: 'listOfStrings',
            attribute_data_type: 'string[]',
            order: 1,
        },
        {
            attribute_name: 'key',
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

export function create_list_of_dict_from_list_of_strings(args: {
    listOfStrings: string[];
    key: string;
}): Record<string, string>[] {
    return args.listOfStrings.map((value) => ({ [args.key]: value }));
}
