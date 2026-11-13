export type GetPermanentPublicUrlParams = {
    storagePath: string;
    bucketName: string;
};

export type GetPermanentPublicUrlResult = {
    publicUrl: string;
};

export type UploadFileBufferParams = {
    storagePath: string;
    fileBuffer: Buffer;
    bucketName: string;
    contentType: string;
    upsert: boolean;
};

export type CreateSignedUploadUrlParams = {
    storagePath: string;
    bucketName: string;
    contentType: string;
    upsert: boolean;
};

export type CreateSignedUploadUrlResult = {
    uploadUrl: string;
    expiresInSeconds: number;
};

export type CreateSignedDownloadUrlParams = {
    storagePath: string;
    bucketName: string;
};

export type CreateSignedDownloadUrlResult = {
    downloadUrl: string;
};

export type CreateSignedPreviewUrlParams = {
    storagePath: string;
    bucketName: string;
};

export type CreateSignedPreviewUrlResult = {
    previewUrl: string;
};

export type DeleteStorageObjectParams = {
    storagePath: string;
    bucketName: string;
};

export type DownloadFileBufferParams = {
    storagePath: string;
    bucketName: string;
};
