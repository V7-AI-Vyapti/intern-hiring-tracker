import { createZodDto } from 'nestjs-zod';
import { nowSeconds } from '@file-management/utils/time';
import { z } from 'zod';

export const FolderResponseSchema = z.object({
    folderId: z.coerce.number().int(),
    folderName: z.string().max(200),
    description: z.string().max(200),
    parentFolderId: z.coerce.number().int().nullable(),
    createdAt: z.number().int().default(nowSeconds()),
    updatedAt: z.number().int().default(nowSeconds()),
});
export class FolderResponseDto extends createZodDto(FolderResponseSchema) {
    static fromEntity(entity: Record<string, unknown>): FolderResponseDto {
        const parent = entity.parent_folder_id;
        let parentFolderId: number | null = null;
        if (parent === null || parent === undefined) {
            parentFolderId = null;
        } else if (typeof parent === 'number') {
            parentFolderId = parent;
        } else if (
            typeof parent === 'object' &&
            parent !== null &&
            'folder_id' in parent
        ) {
            parentFolderId = (parent as { folder_id: number }).folder_id;
        }

        return {
            folderId: entity.folder_id as number,
            folderName: entity.folder_name as string,
            description: (entity.description as string) ?? '',
            parentFolderId,
            createdAt: entity.created_at as number,
            updatedAt: entity.updated_at as number,
        };
    }
}
