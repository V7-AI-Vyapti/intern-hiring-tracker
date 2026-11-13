import { S3Client } from '@aws-sdk/client-s3';

export function getS3Client(): S3Client {
    const endpoint = process.env.AWS_S3_ENDPOINT;
    const region = process.env.AWS_REGION ?? 'us-east-1';
    return new S3Client({
        region,
        endpoint: endpoint || undefined,
        forcePathStyle: Boolean(endpoint),
        credentials:
            process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
                ? {
                      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
                  }
                : undefined,
    });
}

export function signedUrlTtlSeconds(): number {
    const raw = process.env.FILE_STORAGE_SIGNED_URL_TTL_SECONDS;
    if (raw === undefined || raw === '') return 3600;
    const n = Number.parseInt(raw, 10);
    return Number.isFinite(n) && n > 0 ? n : 3600;
}

/** Encode each path segment for use in a URL path (S3 object keys may contain spaces, etc.). */
export function encodeKeyForUrl(storagePath: string): string {
    return storagePath
        .split('/')
        .filter((s) => s.length > 0)
        .map((s) => encodeURIComponent(s))
        .join('/');
}
