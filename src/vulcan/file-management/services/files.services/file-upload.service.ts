import { BadRequestException, Injectable } from '@nestjs/common';
import { File as FileEntity } from '@file-management/entities/file.entity';
import { FileFileFormatMap as FileFileFormatMapEntity } from '@file-management/entities/file_file_format_map.entity';
import { FileFolderMap as FileFolderMapEntity } from '@file-management/entities/file_folder_map.entity';
import { FileMetaData as FileMetaDataEntity } from '@file-management/entities/file_meta_data.entity';
import { Folder as FolderEntity } from '@file-management/entities/folder.entity';
import { FileFormat as FileFormatEntity } from '@file-management/entities/file_format.entity';
import type { FileUploadMultipartPayload } from '@file-management/schema/file.schema/file-upload-multipart.schema';
import { FileMetaDataCreateSchema } from '@file-management/schema/file-meta.schema/create-file-meta-data.schema';
import { FileFileFormatMapCreateSchema } from '@file-management/schema/file-format.schema/create-file-file-format-map.schema';
import { FileFormatUpsertSchema } from '@file-management/schema/file-format.schema/upsert-file-format.schema';
import { FileUploadMetaDto } from '@file-management/schema/file.schema/file-upload-meta.schema';
import { FileUploadRequestDto } from '@file-management/schema/file.schema/file-upload-request.schema';
import { FileUploadResponseDto } from '@file-management/schema/file.schema/file-upload-response.schema';
import {
    FileStorageService,
    type UploadPlan,
} from '@file-management/services/file-storage.service';
import { inferFileFormatName } from '@file-management/utils/infer-file-format-name';
import { nowSeconds } from '@file-management/utils/time';
import { MIME_TYPE } from '@vulcan/shared/constants';
import { readNumber, readString } from '@vulcan/shared/utils/record-readers';

@Injectable()
export class FileUploadService {
    constructor(private readonly storage: FileStorageService) {}

    async loadFolderIfRequested(folderId: number | undefined) {
        if (folderId == null) return null;
        const folderObject = await FolderEntity.getByPk(folderId);
        if (!folderObject) {
            return null;
        }
        return folderObject;
    }

    async createFileAndMeta(args: {
        folder: Awaited<ReturnType<FileUploadService['loadFolderIfRequested']>>;
        plan: UploadPlan;
        fileSizeBytes: number;
    }): Promise<{ file: FileEntity; meta: FileMetaDataEntity }> {
        const fileEntityObject = await FileEntity.createOne({
            file_name: args.plan.originalName,
            description: '',
            file_url: args.plan.publicUrl,
        });
        const fileMetaDataSerialized = FileMetaDataCreateSchema.parse({
            file_meta_data_name: args.plan.originalName,
            description: '',
            mime_type: args.plan.mimeType,
            file_size_bytes: args.fileSizeBytes,
            bucket_name: args.plan.bucketName,
            storage_path: args.plan.storagePath,
            created_at: nowSeconds(),
            updated_at: nowSeconds(),
            file_id: fileEntityObject.file_id,
        });
        const metaEntityObject = await FileMetaDataEntity.createOne(
            fileMetaDataSerialized,
        );

        const fileId = readNumber(fileEntityObject, 'file_id');
        await this.linkFileToInferredFormat({
            fileId,
            plan: args.plan,
        });

        if (args.folder != null) {
            const folderId = readNumber(args.folder, 'folder_id');
            await FileFolderMapEntity.createOne({
                file_folder_map_name: args.plan.originalName,
                description: '',
                file_id: fileId,
                folder_id: folderId,
            });
        }

        return { file: fileEntityObject, meta: metaEntityObject };
    }

    private async linkFileToInferredFormat(args: {
        fileId: number;
        plan: UploadPlan;
    }): Promise<void> {
        const inferredFormatName = inferFileFormatName({
            fileName: args.plan.originalName,
            mimeType: args.plan.mimeType,
        });

        if (!inferredFormatName) {
            return;
        }

        const fileFormatPayload = FileFormatUpsertSchema.parse({
            file_format_name: inferredFormatName,
            description: null,
        });
        const { entity: fileFormat } = await FileFormatEntity.getOrCreate({
            where: { file_format_name: fileFormatPayload.file_format_name },
            create: fileFormatPayload,
        });

        const fileFormatMapPayload = FileFileFormatMapCreateSchema.parse({
            file_file_format_map_name: args.plan.originalName,
            description: '',
            file_id: args.fileId,
            file_format_id: readNumber(fileFormat, 'file_format_id'),
        });
        await FileFileFormatMapEntity.createOne(fileFormatMapPayload);
    }

    async uploadFile(
        dto: FileUploadRequestDto,
        file?: FileUploadMultipartPayload,
    ): Promise<FileUploadResponseDto> {
        const mimeType = file?.mimetype ?? MIME_TYPE.APPLICATION_OCTET_STREAM;
        const isMultipart = Boolean(file?.buffer?.length);

        if (!isMultipart && !dto.fileName?.trim()) {
            throw new BadRequestException(
                'file is required (or provide fileName to get a signed upload URL)',
            );
        }

        const folder = await this.loadFolderIfRequested(
            dto.folderId ?? undefined,
        );

        const plan = this.storage.buildUploadPlan({
            providedFileName: dto.fileName,
            originalNameFromMultipart: file?.originalname,
            mimeType,
        });

        const { file: savedFile } = await this.createFileAndMeta({
            folder,
            plan,
            fileSizeBytes: isMultipart ? (file?.size ?? 0) : 0,
        });

        if (isMultipart) {
            await this.storage.uploadMultipartOrThrow({
                storagePath: plan.storagePath,
                fileBuffer: file!.buffer,
                contentType: plan.mimeType,
            });

            const response = new FileUploadResponseDto();
            response.fileId = readNumber(savedFile, 'file_id');
            response.upload = Object.assign(new FileUploadMetaDto(), {
                url: readString(savedFile, 'file_url'),
                headers: { 'Content-Type': plan.mimeType },
                expiresIn: 0,
            });
            return response;
        }

        const signed = await this.storage.createSignedUpload({
            storagePath: plan.storagePath,
            contentType: plan.mimeType,
        });

        const response = new FileUploadResponseDto();
        response.fileId = readNumber(savedFile, 'file_id');
        response.upload = Object.assign(new FileUploadMetaDto(), {
            url: signed.uploadUrl,
            headers: { 'Content-Type': plan.mimeType },
            expiresIn: signed.expiresInSeconds,
        });
        return response;
    }

    async uploadFiles(
        dto: FileUploadRequestDto,
        files?: FileUploadMultipartPayload[],
    ): Promise<FileUploadResponseDto[]> {
        const list = (files ?? []).filter(Boolean);
        if (list.length === 0) {
            return [await this.uploadFile(dto, undefined)];
        }
        return Promise.all(list.map((f) => this.uploadFile(dto, f)));
    }
}
