import { NotFoundException } from '@nestjs/common';
import type { DataSource } from 'typeorm';
import {
    CustomTypeormEntityBase,
    getEntityWithName,
} from '../custom_entities/custom_typeorm_entities.js';
import { FILE_INGEST_DEFAULT_ENTITY_NAMES } from './constants.js';

export async function getFileMetaByFileId(args: {
    fileId: number;
    dataSource: DataSource;
    fileMetaEntityName?: string;
}): Promise<CustomTypeormEntityBase> {
    const entityName =
        args.fileMetaEntityName ??
        FILE_INGEST_DEFAULT_ENTITY_NAMES.FILE_META_DATA;
    const fileMetaDataEntity = getEntityWithName(entityName, args.dataSource);
    const [row] = await fileMetaDataEntity.filter(
        { file_id: args.fileId },
        { take: 1 },
    );
    if (!row) {
        throw new NotFoundException(
            `File metadata not found: fileId=${args.fileId}`,
        );
    }

    return row;
}
