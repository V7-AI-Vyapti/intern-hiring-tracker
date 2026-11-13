import { BadRequestException } from '@nestjs/common';
import {
    ACCESS_POLICY_MESSAGES,
    ACCESS_POLICY_MODES,
} from '../access-policy.constants.js';
import type {
    AccessPolicyMode,
    MembershipRecord,
} from '../types/access-policy.types.js';

function blankToNull(value: string | null | undefined): string | null {
    const trimmed = value?.trim() ?? '';
    if (trimmed.length === 0) {
        return null;
    }
    return trimmed;
}

function assertFilterConstraint(args: {
    mode: AccessPolicyMode;
    constraintField: string | null;
    scopeKey: string | null;
}): void {
    if (args.mode !== ACCESS_POLICY_MODES.FILTER) {
        return;
    }
    if (!args.constraintField || !args.scopeKey) {
        throw new BadRequestException(
            ACCESS_POLICY_MESSAGES.FILTER_FIELDS_REQUIRED,
        );
    }
}

function uniqueSorted(values: readonly string[]): string[] {
    return [...new Set(values)].sort();
}

function groupScopeIds(
    rows: readonly MembershipRecord[],
): Record<string, string[]> {
    const scopes: Record<string, string[]> = {};
    for (const row of rows) {
        const existing = scopes[row.scopeKey] ?? [];
        existing.push(row.scopeId);
        scopes[row.scopeKey] = existing;
    }
    const grouped: Record<string, string[]> = {};
    for (const key of Object.keys(scopes).sort()) {
        grouped[key] = uniqueSorted(scopes[key] ?? []);
    }
    return grouped;
}

function readRowValue(row: object, field: string): string | null {
    const value = (row as Record<string, unknown>)[field];
    if (typeof value === 'string' || typeof value === 'number') {
        const text = String(value).trim();
        return text.length === 0 ? null : text;
    }
    return null;
}

export {
    assertFilterConstraint,
    blankToNull,
    groupScopeIds,
    readRowValue,
    uniqueSorted,
};
