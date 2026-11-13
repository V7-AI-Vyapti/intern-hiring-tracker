import { createZodDto } from 'nestjs-zod';
import { FolderResponseSchema } from './folder-response.schema';

/**
 * Create folder endpoint returns `FolderResponseDto`.
 * Keep this alias schema for clarity/organization.
 */
export const FolderCreateResponseSchema = FolderResponseSchema;
export class FolderCreateResponseDto extends createZodDto(
    FolderCreateResponseSchema,
) {}
