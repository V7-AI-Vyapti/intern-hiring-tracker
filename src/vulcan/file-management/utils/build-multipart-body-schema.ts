import { z } from 'zod';
import type { OpenAPIObject } from '@nestjs/swagger';

type ComponentsSchemas = NonNullable<
    NonNullable<OpenAPIObject['components']>['schemas']
>;
type SchemaObject = Exclude<ComponentsSchemas[string], { $ref: string }>;
type ReferenceObject = Extract<ComponentsSchemas[string], { $ref: string }>;

type FileFieldShape = 'single' | 'array' | 'both';

type SchemaProperty = SchemaObject | ReferenceObject;

type GeneratedJsonSchema = {
    properties?: Record<string, SchemaProperty>;
    required?: string[];
};

/**
 * Build an OpenAPI body schema for a `multipart/form-data` endpoint by deriving
 * the JSON parts from a Zod schema and appending binary file fields that Zod
 * cannot express.
 *
 * Keeps the Zod schema as the single source of truth for non-file body fields.
 */
export function buildMultipartBodySchema(
    schema: z.ZodObject,
    files: FileFieldShape = 'both',
): SchemaObject {
    const generated = z.toJSONSchema(schema) as GeneratedJsonSchema;

    const binaryProps: Record<string, SchemaProperty> = {};
    if (files === 'single' || files === 'both') {
        binaryProps.file = { type: 'string', format: 'binary' };
    }
    if (files === 'array' || files === 'both') {
        binaryProps.files = {
            type: 'array',
            items: { type: 'string', format: 'binary' },
        };
    }

    return {
        type: 'object',
        required: generated.required ?? [],
        properties: {
            ...binaryProps,
            ...(generated.properties ?? {}),
        },
    };
}
