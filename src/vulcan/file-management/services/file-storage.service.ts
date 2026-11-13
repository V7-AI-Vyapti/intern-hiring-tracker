import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
    createSignedDownloadUrl,
    createSignedUploadUrl,
    deleteStorageObject,
    downloadFileBuffer,
    getPermanentPublicUrl,
    uploadFileBuffer,
} from '@vyapti/file-storage';

type SignedUpload = { uploadUrl: string; expiresInSeconds: number };
type SignedDownload = { downloadUrl: string };

export type UploadPlan = {
    bucketName: string;
    mimeType: string;
    storageKey: string;
    originalName: string;
    storagePath: string;
    publicUrl: string;
};

@Injectable()
export class FileStorageService {
    private readonly logger = new Logger(FileStorageService.name);

    private readonly bucketName =
        process.env.FILE_MANAGEMENT_BUCKET_NAME ?? 'files';

    private safeStorageFileName(fileName: string): string {
        return fileName.replace(/[\\/]/g, '-').trim();
    }

    private storagePathFor(storageKey: string, fileName: string): string {
        const namespace =
            process.env.FILE_MANAGEMENT_STORAGE_NAMESPACE?.trim() || 'default';
        return `${namespace}/files/${storageKey}/${this.safeStorageFileName(fileName)}`;
    }

    buildUploadPlan(args: {
        providedFileName?: string | null;
        originalNameFromMultipart?: string | null;
        mimeType: string;
    }): UploadPlan {
        const storageKey = randomUUID();
        const originalName =
            args.providedFileName?.trim() ||
            args.originalNameFromMultipart?.trim() ||
            `${storageKey}.bin`;

        const storagePath = this.storagePathFor(storageKey, originalName);

        const { publicUrl } = getPermanentPublicUrl({
            storagePath,
            bucketName: this.bucketName,
        });

        return {
            bucketName: this.bucketName,
            mimeType: args.mimeType,
            storageKey,
            originalName,
            storagePath,
            publicUrl,
        };
    }

    async uploadMultipartOrThrow(args: {
        storagePath: string;
        fileBuffer: Buffer;
        contentType: string;
    }): Promise<void> {
        try {
            await uploadFileBuffer({
                storagePath: args.storagePath,
                fileBuffer: args.fileBuffer,
                bucketName: this.bucketName,
                contentType: args.contentType,
                upsert: false,
            });
        } catch (err) {
            const message =
                err instanceof Error
                    ? err.message
                    : typeof err === 'string'
                      ? err
                      : JSON.stringify(err);

            this.logger.error('Storage upload failed', message);
            throw new BadRequestException(`Failed to upload file: ${message}`);
        }
    }

    async createSignedUpload(args: {
        storagePath: string;
        contentType: string;
    }): Promise<SignedUpload> {
        return await createSignedUploadUrl({
            storagePath: args.storagePath,
            bucketName: this.bucketName,
            contentType: args.contentType,
            upsert: true,
        });
    }

    async createSignedDownload(args: {
        storagePath: string;
        bucketName: string;
    }): Promise<SignedDownload> {
        return await createSignedDownloadUrl({
            storagePath: args.storagePath,
            bucketName: args.bucketName,
        });
    }

    async deleteObjectIfPresent(args: {
        storagePath?: string;
        bucketName?: string;
    }): Promise<void> {
        if (!args.storagePath || !args.bucketName) return;
        await deleteStorageObject({
            storagePath: args.storagePath,
            bucketName: args.bucketName,
        });
    }

    async downloadObjectBuffer(args: {
        storagePath: string;
        bucketName: string;
    }): Promise<Buffer> {
        return downloadFileBuffer({
            storagePath: args.storagePath,
            bucketName: args.bucketName,
        });
    }
}
