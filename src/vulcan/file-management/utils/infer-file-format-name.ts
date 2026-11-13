import {
    FILE_EXTENSION_TO_FORMAT_NAME,
    MIME_TYPE_TO_FORMAT_NAME,
} from '../file-format-inference.constants';

function extractFileExtension(fileName: string): string | null {
    const trimmed = fileName.trim();
    const lastDotIndex = trimmed.lastIndexOf('.');

    if (lastDotIndex <= 0 || lastDotIndex === trimmed.length - 1) {
        return null;
    }

    return trimmed.slice(lastDotIndex + 1).toLowerCase();
}

function normalizeMimeType(mimeType: string): string {
    return mimeType.trim().toLowerCase().split(';')[0]?.trim() ?? '';
}

function inferFileFormatName(args: {
    fileName: string;
    mimeType: string;
}): string | null {
    const extension = extractFileExtension(args.fileName);

    if (extension) {
        const formatFromExtension =
            FILE_EXTENSION_TO_FORMAT_NAME[
                extension as keyof typeof FILE_EXTENSION_TO_FORMAT_NAME
            ];

        if (formatFromExtension) {
            return formatFromExtension;
        }
    }

    const normalizedMimeType = normalizeMimeType(args.mimeType);
    if (!normalizedMimeType) {
        return null;
    }

    const formatFromMimeType =
        MIME_TYPE_TO_FORMAT_NAME[
            normalizedMimeType as keyof typeof MIME_TYPE_TO_FORMAT_NAME
        ];

    return formatFromMimeType ?? null;
}

export { extractFileExtension, inferFileFormatName, normalizeMimeType };
