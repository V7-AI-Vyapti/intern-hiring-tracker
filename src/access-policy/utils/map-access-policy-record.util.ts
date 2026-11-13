import {
    readNumber,
    readString,
} from '@vulcan/shared/utils/record-readers';
import { readNullableString } from '@auth/utils/read-nullable-string.util';
import type {
    AccessPolicyMode,
    MembershipRecord,
    PolicyRecord,
} from '@vyapti/access-policy';

function mapPolicyRecord(row: unknown): PolicyRecord {
    return {
        id: readNumber(row, 'access_policy_id'),
        entityName: readString(row, 'entity_name'),
        mode: readPolicyMode(row),
        constraintField: readNullableString(row, 'constraint_field'),
        scopeKey: readNullableString(row, 'scope_key'),
    };
}

function mapMembershipRecord(row: unknown): MembershipRecord {
    return {
        id: readNumber(row, 'access_policy_membership_id'),
        userId: readString(row, 'user_id'),
        scopeKey: readString(row, 'scope_key'),
        scopeId: readString(row, 'scope_id'),
    };
}

function readPolicyMode(row: unknown): AccessPolicyMode {
    const mode = readString(row, 'mode');
    if (mode === 'unrestricted' || mode === 'filter' || mode === 'deny') {
        return mode;
    }
    throw new Error(`Unknown access policy mode '${mode}'`);
}

export { mapMembershipRecord, mapPolicyRecord };
