import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

const JsonObjectSchema = z.record(z.string(), z.unknown());

export const FileToolResponseSchema = z.object({
    availableToolId: z.number().int(),
    configuredToolName: z.string(),
    description: z.string().nullable(),
    toolTypeName: z.string(),
    apiEndpoint: JsonObjectSchema.nullable(),
    targetEntityName: z.string().nullable(),
    additionalJsonData: JsonObjectSchema,
});

export class FileToolResponseDto extends createZodDto(FileToolResponseSchema) {}
