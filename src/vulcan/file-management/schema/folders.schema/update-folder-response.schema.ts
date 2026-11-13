import { createZodDto } from 'nestjs-zod';
import { FolderResponseSchema } from './folder-response.schema';

/**
 * Update folder endpoint returns `FolderResponseDto`.
 * Keep this alias schema for clarity/organization.
 */
export const FolderUpdateResponseSchema = FolderResponseSchema;
export class FolderUpdateResponseDto extends createZodDto(
    FolderUpdateResponseSchema,
) {}
