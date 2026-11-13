import {
    DeleteObjectCommand,
    GetObjectCommand,
    HeadObjectCommand,
    PutObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

import {
    encodeKeyForUrl,
    getS3Client,
    signedUrlTtlSeconds,
} from './s3-client.js';

import type {
    CreateSignedDownloadUrlParams,
    CreateSignedDownloadUrlResult,
    CreateSignedUploadUrlParams,
    CreateSignedUploadUrlResult,
    CreateSignedPreviewUrlParams,
    CreateSignedPreviewUrlResult,
    DeleteStorageObjectParams,
    DownloadFileBufferParams,
    GetPermanentPublicUrlParams,
    GetPermanentPublicUrlResult,
    UploadFileBufferParams,
} from './types.js';

/**
 * Public object URL used as `file_url` / preview when the bucket is readable publicly,
 * or as a stable identifier when clients use signed URLs for actual access.
 * Set `FILE_STORAGE_PUBLIC_BASE_URL` (no trailing slash) for MinIO, R2, or a CDN origin.
 */
export function getPermanentPublicUrl(
    params: GetPermanentPublicUrlParams,
): GetPermanentPublicUrlResult {
    const { storagePath, bucketName } = params;

    const customBase = process.env.FILE_STORAGE_PUBLIC_BASE_URL?.replace(
        /\/$/,
        '',
    );

    const keyPath = encodeKeyForUrl(storagePath);

    const publicUrl = customBase
        ? `${customBase}/${keyPath}`
        : `https://${bucketName}.s3.${process.env.AWS_REGION ?? 'us-east-1'}.amazonaws.com/${keyPath}`;

    return { publicUrl };
}

export async function uploadFileBuffer(
    params: UploadFileBufferParams,
): Promise<void> {
    const {
        storagePath,
        fileBuffer,
        bucketName,
        contentType,
    } = params;

    const client = getS3Client();

    await client.send(
        new PutObjectCommand({
            Bucket: bucketName,
            Key: storagePath,
            Body: fileBuffer,
            ContentType: contentType,
        }),
    );
}

export async function createSignedUploadUrl(
    params: CreateSignedUploadUrlParams,
): Promise<CreateSignedUploadUrlResult> {
    const {
        storagePath,
        bucketName,
        contentType,
    } = params;

    const expiresIn = signedUrlTtlSeconds();
    const client = getS3Client();

    const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: storagePath,
        ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(
        client,
        command,
        { expiresIn },
    );

    return {
        uploadUrl,
        expiresInSeconds: expiresIn,
    };
}

export async function getObjectMetadata(
    params: {
        storagePath: string;
        bucketName: string;
    },
): Promise<{ size: number; etag?: string }> {
    const {
        storagePath,
        bucketName,
    } = params;

    const client = getS3Client();

    const result = await client.send(
        new HeadObjectCommand({
            Bucket: bucketName,
            Key: storagePath,
        }),
    );

    return {
        size: result.ContentLength ?? 0,
        etag: result.ETag,
    };
}

export async function createSignedDownloadUrl(
    params: CreateSignedDownloadUrlParams,
): Promise<CreateSignedDownloadUrlResult> {
    const {
        storagePath,
        bucketName,
    } = params;

    const expiresIn = signedUrlTtlSeconds();
    const client = getS3Client();

    const command = new GetObjectCommand({
        Bucket: bucketName,
        Key: storagePath,
    });

    const downloadUrl = await getSignedUrl(
        client,
        command,
        { expiresIn },
    );

    return { downloadUrl };
}


export async function createSignedPreviewUrl(
    params: CreateSignedPreviewUrlParams,
): Promise<CreateSignedPreviewUrlResult> {
    const {
        storagePath,
        bucketName,
    } = params;

    const expiresIn = signedUrlTtlSeconds();
    const client = getS3Client();

    const command = new GetObjectCommand({
        Bucket: bucketName,
        Key: storagePath,
    });

    const previewUrl = await getSignedUrl(
        client,
        command,
        { expiresIn },
    );

    return { previewUrl };
}


export async function deleteStorageObject(
    params: DeleteStorageObjectParams,
): Promise<void> {
    const {
        storagePath,
        bucketName,
    } = params;

    const client = getS3Client();

    await client.send(
        new DeleteObjectCommand({
            Bucket: bucketName,
            Key: storagePath,
        }),
    );
}

export async function downloadFileBuffer(
    params: DownloadFileBufferParams,
): Promise<Buffer> {
    const {
        storagePath,
        bucketName,
    } = params;

    const client = getS3Client();

    const response = await client.send(
        new GetObjectCommand({
            Bucket: bucketName,
            Key: storagePath,
        }),
    );

    if (!response.Body) {
        throw new Error(
            `Empty object body for storagePath=${storagePath} bucket=${bucketName}`,
        );
    }

    return Buffer.from(
        await response.Body.transformToByteArray(),
    );
}