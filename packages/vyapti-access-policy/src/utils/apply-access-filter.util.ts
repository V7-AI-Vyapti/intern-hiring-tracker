import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ACCESS_POLICY_MESSAGES } from '../access-policy.constants.js';
import type { AccessFilter } from '../types/access-policy.types.js';

type AccessFilterClause =
    | { kind: 'none' }
    | { kind: 'empty' }
    | { kind: 'in'; field: string; values: string[] };

function applyAccessFilter(filter: AccessFilter): AccessFilterClause {
    if ('unrestricted' in filter) {
        return { kind: 'none' };
    }
    if ('deny' in filter || filter.values.length === 0) {
        return { kind: 'empty' };
    }
    return {
        kind: 'in',
        field: filter.field,
        values: filter.values,
    };
}

function prepareCreateBody(args: {
    filter: AccessFilter;
    body: object;
}): Record<string, unknown> {
    const body = copyBody(args.body);
    if ('unrestricted' in args.filter) {
        return body;
    }
    if ('deny' in args.filter) {
        throw new BadRequestException(ACCESS_POLICY_MESSAGES.SCOPE_NOT_ALLOWED);
    }
    const current = body[args.filter.field];
    if (isMissingScopeValue(current)) {
        if (args.filter.values.length !== 1) {
            throw new BadRequestException(
                ACCESS_POLICY_MESSAGES.SCOPE_NOT_ALLOWED,
            );
        }
        body[args.filter.field] = coerceScopeValue(args.filter.values[0]);
        return body;
    }
    if (!scopeValueAllowed(args.filter.values, current)) {
        throw new BadRequestException(ACCESS_POLICY_MESSAGES.SCOPE_NOT_ALLOWED);
    }
    return body;
}

function assertUpdateScope(args: { filter: AccessFilter; body: object }): void {
    if ('unrestricted' in args.filter) {
        return;
    }
    if ('deny' in args.filter) {
        throw new NotFoundException(ACCESS_POLICY_MESSAGES.ROW_NOT_FOUND);
    }
    const body = args.body as Record<string, unknown>;
    if (!Object.prototype.hasOwnProperty.call(body, args.filter.field)) {
        return;
    }
    const current = body[args.filter.field];
    if (
        isMissingScopeValue(current) ||
        !scopeValueAllowed(args.filter.values, current)
    ) {
        throw new BadRequestException(ACCESS_POLICY_MESSAGES.SCOPE_NOT_ALLOWED);
    }
}

function copyBody(body: object): Record<string, unknown> {
    const copy: Record<string, unknown> = {};
    for (const key of Object.keys(body)) {
        copy[key] = (body as Record<string, unknown>)[key];
    }
    return copy;
}

function isMissingScopeValue(value: unknown): boolean {
    return value == null || value === '';
}

function scopeValueAllowed(values: readonly string[], value: unknown): boolean {
    if (typeof value === 'number' && Number.isFinite(value)) {
        return values.includes(String(value));
    }
    if (typeof value === 'string') {
        return values.includes(value.trim());
    }
    return false;
}

function coerceScopeValue(scopeId: string): string | number {
    if (!/^[1-9]\d*$/.test(scopeId)) {
        return scopeId;
    }
    const parsed = Number(scopeId);
    if (!Number.isSafeInteger(parsed)) {
        return scopeId;
    }
    return parsed;
}

export {
    applyAccessFilter,
    assertUpdateScope,
    prepareCreateBody,
    type AccessFilterClause,
};
