import type { AuthUserRecord, StaffUserRecord } from '@vyapti/auth';
import {
    readBoolean,
    readNumber,
    readString,
} from '@vulcan/shared/utils/record-readers';
import { readNullableString } from './read-nullable-string.util';

function readOptionalRoleId(row: unknown): number | null {
    if (!row || typeof row !== 'object') {
        return null;
    }
    const value = (row as Record<string, unknown>).role_id;
    if (value == null || value === '') {
        return null;
    }
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
        return null;
    }
    return parsed;
}

function mapStaffUserRecord(row: unknown): StaffUserRecord {
    return {
        id: String(readNumber(row, 'user_id')),
        email: readString(row, 'email'),
        displayName: readNullableString(row, 'display_name'),
        isActive: readBoolean(row, 'is_active'),
        roleId: readOptionalRoleId(row),
    };
}

function mapAuthUserRecord(row: unknown): AuthUserRecord {
    return {
        id: String(readNumber(row, 'user_id')),
        email: readString(row, 'email'),
        passwordHash: readString(row, 'password_hash'),
        displayName: readNullableString(row, 'display_name'),
        isActive: readBoolean(row, 'is_active'),
    };
}

export { mapAuthUserRecord, mapStaffUserRecord };
