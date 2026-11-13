import type { Grant } from '../types/rbac.types.js';

function grantKey(grant: Grant): string {
    return `${grant.resource}\0${grant.action}`;
}

function uniqueGrants(grants: readonly Grant[]): Grant[] {
    const seen = new Set<string>();
    const unique: Grant[] = [];
    for (const grant of grants) {
        const key = grantKey(grant);
        if (seen.has(key)) {
            continue;
        }
        seen.add(key);
        unique.push({ resource: grant.resource, action: grant.action });
    }
    return unique;
}

function grantsInclude(grants: readonly Grant[], required: Grant): boolean {
    const key = grantKey(required);
    for (const grant of grants) {
        if (grantKey(grant) === key) {
            return true;
        }
    }
    return false;
}

function uniqueStrings(values: readonly string[]): string[] {
    const seen = new Set<string>();
    const unique: string[] = [];
    for (const value of values) {
        if (seen.has(value)) {
            continue;
        }
        seen.add(value);
        unique.push(value);
    }
    return unique;
}

export { grantKey, grantsInclude, uniqueGrants, uniqueStrings };
