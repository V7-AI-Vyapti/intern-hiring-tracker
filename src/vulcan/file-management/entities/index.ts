import { buildEntitySchema } from '@vyapti/core';
import { File } from './file.entity';
import { FileFileFormatMap } from './file_file_format_map.entity';
import { FileFolderMap } from './file_folder_map.entity';
import { FileFormat } from './file_format.entity';
import { FileMetaData } from './file_meta_data.entity';
import { Folder } from './folder.entity';

export const entitySchemas = [
    buildEntitySchema(File),
    buildEntitySchema(FileFileFormatMap),
    buildEntitySchema(FileFolderMap),
    buildEntitySchema(FileFormat),
    buildEntitySchema(FileMetaData),
    buildEntitySchema(Folder),
];
