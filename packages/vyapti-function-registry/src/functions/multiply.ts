import type { FunctionDefinition } from '../types.js';

export const multiplyDefinition = {
    function_name: 'multiply',
    function_description: 'Multiply two numbers.',
    function_attributes: [
        {
            attribute_name: 'a',
            attribute_data_type: 'float',
            order: 1,
        },
        {
            attribute_name: 'b',
            attribute_data_type: 'float',
            order: 2,
        },
    ],
    function_returns: [
        {
            attribute_name: 'result',
            attribute_data_type: 'float',
            order: 1,
        },
    ],
} satisfies FunctionDefinition;

export function multiply(args: { a: number; b: number }): number {
    return args.a * args.b;
}
