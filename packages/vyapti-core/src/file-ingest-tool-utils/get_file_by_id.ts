import { NotFoundException } from '@nestjs/common';
import type { DataSource } from 'typeorm';
import {
    CustomTypeormEntityBase,
    getEntityWithName,
} from '../custom_entities/custom_typeorm_entities.js';
import { FILE_INGEST_DEFAULT_ENTITY_NAMES } from './constants.js';

export async function getFileById(args: {
    fileId: number;
    dataSource: DataSource;
    fileEntityName?: string;
}): Promise<CustomTypeormEntityBase> {
    const entityName =
        args.fileEntityName ?? FILE_INGEST_DEFAULT_ENTITY_NAMES.FILE;
    const fileEntity = getEntityWithName(entityName, args.dataSource);
    const file = await fileEntity.getByPk(args.fileId);
    if (!file) {
        throw new NotFoundException(`File not found: fileId=${args.fileId}`);
    }

    return file;
}
