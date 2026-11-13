/**
 * Local record readers for the hiring host adapter.
 * Kept self-contained so host unit tests do not depend on @vulcan/shared paths.
 */

const fail = (message: string): never => {
    throw new Error(message);
};

const readValue = (record: unknown, fieldName: string): unknown => {
    if (!record || typeof record !== 'object') {
        return fail(`Expected object while reading '${fieldName}'`);
    }
    const value = (record as Record<string, unknown>)[fieldName];
    if (typeof value === 'undefined') {
        return fail(`Missing field '${fieldName}'`);
    }
    return value;
};

const readNumber = (record: unknown, fieldName: string): number => {
    const value = readValue(record, fieldName);
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
        return fail(`Expected numeric field '${fieldName}'`);
    }
    return parsed;
};

const readString = (record: unknown, fieldName: string): string => {
    const value = readValue(record, fieldName);
    if (typeof value !== 'string') {
        return fail(`Expected string field '${fieldName}'`);
    }
    return value;
};

const readNullableString = (
    record: unknown,
    fieldName: string,
): string | null => {
    if (!record || typeof record !== 'object') {
        return null;
    }
    const value = (record as Record<string, unknown>)[fieldName];
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
    return null;
};

const readNullableNumber = (
    record: unknown,
    fieldName: string,
): number | null => {
    if (!record || typeof record !== 'object') {
        return null;
    }
    const value = (record as Record<string, unknown>)[fieldName];
    if (value == null) {
        return null;
    }
    if (typeof value === 'object') {
        return null;
    }
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
        return null;
    }
    return parsed;
};

/**
 * Read a hiring FK as the related row's business id string.
 * Supports: related object, bare business-id string, or missing (error).
 * Numeric AutoPK without a loaded relation cannot be mapped — callers must
 * load relations or resolve via lookup before mapping.
 */
const readBusinessForeignKey = (
    record: unknown,
    fieldName: string,
    relatedBusinessIdField: string,
): string => {
    const value = readValue(record, fieldName);
    if (typeof value === 'string') {
        return value;
    }
    if (value && typeof value === 'object') {
        return readString(value, relatedBusinessIdField);
    }
    return fail(
        `Hiring FK '${fieldName}' is not a business id or loaded related row ` +
            `(cannot map raw AutoPK without relation metadata)`,
    );
};

export {
    readBusinessForeignKey,
    readNullableNumber,
    readNullableString,
    readNumber,
    readString,
    readValue,
};
