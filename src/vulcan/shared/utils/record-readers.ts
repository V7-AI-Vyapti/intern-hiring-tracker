import { InternalServerErrorException } from '@nestjs/common';

const throwInternalError = (message: string): never => {
    const error = new InternalServerErrorException(message) as unknown as Error;
    throw error;
};

const readValue = (record: unknown, fieldName: string): unknown => {
    if (!record || typeof record !== 'object') {
        throwInternalError(`Expected object while reading '${fieldName}'`);
    }

    const value = (record as Record<string, unknown>)[fieldName];
    if (typeof value === 'undefined') {
        throwInternalError(`Missing field '${fieldName}'`);
    }

    return value;
};

const readNumber = (record: unknown, fieldName: string): number => {
    const value = readValue(record, fieldName);
    const parsed = Number(value);

    if (!Number.isFinite(parsed)) {
        throwInternalError(`Expected numeric field '${fieldName}'`);
    }

    return parsed;
};

const readString = (record: unknown, fieldName: string): string => {
    const value = readValue(record, fieldName);

    if (typeof value !== 'string') {
        throwInternalError(`Expected string field '${fieldName}'`);
    }

    return value as string;
};

const readForeignKeyId = (
    record: unknown,
    fieldName: string,
    relatedPrimaryKeyFieldName: string,
): number => {
    const value = readValue(record, fieldName);

    if (value && typeof value === 'object') {
        return readNumber(value, relatedPrimaryKeyFieldName);
    }

    const scalarId = Number(value);
    if (!Number.isFinite(scalarId)) {
        throwInternalError(`Expected FK field '${fieldName}'`);
    }

    return scalarId;
};

const readDescription = (value: unknown): string | null => {
    if (value == null) {
        return null;
    }
    if (typeof value === 'string') {
        return value;
    }
    if (
        typeof value === 'number' ||
        typeof value === 'boolean' ||
        typeof value === 'bigint'
    ) {
        return `${value}`;
    }
    return JSON.stringify(value);
};

const readBoolean = (record: unknown, fieldName: string): boolean => {
    const value = readValue(record, fieldName);

    if (typeof value !== 'boolean') {
        throwInternalError(`Expected boolean field '${fieldName}'`);
    }

    return value as boolean;
};

export {
    readValue,
    readNumber,
    readString,
    readForeignKeyId,
    readDescription,
    readBoolean,
};
