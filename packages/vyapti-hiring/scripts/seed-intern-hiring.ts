/**
 * Seed a generated Intern Hiring Tracker app from the five CSV files.
 *
 * Follows apps/vyapti/scripts/seed_india_vision_slice.ts patterns:
 * login → roles/users → access policies → idempotent entity POSTs (FK order)
 * → Interviewer access-policy memberships.
 *
 * Dry-run (no HTTP / no DB writes):
 *   HIRING_SEED_DRY_RUN=true npm run seed:intern-hiring --workspace=@vyapti/hiring
 *   # or
 *   node --import tsx packages/vyapti-hiring/scripts/seed-intern-hiring.ts --dry-run
 *
 * Live seed:
 *   HIRING_APP_BASE=https://intern-hiring-tracker.v7ai.org/api/v1 \
 *   HIRING_ADMIN_EMAIL=... HIRING_ADMIN_PASSWORD=... \
 *   node --import tsx packages/vyapti-hiring/scripts/seed-intern-hiring.ts
 *
 * Defaults:
 *   HIRING_APP_BASE=http://127.0.0.1:3000/api/v1
 *   CSV_DIR=<repo>/generated/intern-hiring-tracker-seed
 *   DEMO_PASSWORD=Demo@1234
 */

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { HIRING_ACCESS_POLICY_HTTP_SEEDS } from '../src/hiring.access-policy.ts';
import {
    HIRING_SEED_IMPORT_ORDER,
    parseHiringCsv,
    planInterviewerMembershipsForUsers,
    validateHiringSeedTables,
    type HiringCsvRow,
    type HiringSeedTables,
    type HiringSeedValidationReport,
} from '../src/seed/index.ts';

const API_BASE =
    process.env.HIRING_APP_BASE ?? 'http://127.0.0.1:3000/api/v1';
const DEMO_PASSWORD = process.env.DEMO_PASSWORD ?? 'Demo@1234';
const ADMIN_EMAIL =
    process.env.HIRING_ADMIN_EMAIL ?? process.env.APP_BOOTSTRAP_ADMIN_EMAIL;
const ADMIN_PASSWORD =
    process.env.HIRING_ADMIN_PASSWORD ??
    process.env.APP_BOOTSTRAP_ADMIN_PASSWORD;

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_CSV_DIR = path.resolve(
    SCRIPT_DIR,
    '../../../generated/intern-hiring-tracker-seed',
);
const CSV_DIR = process.env.CSV_DIR ?? DEFAULT_CSV_DIR;

const DRY_RUN =
    process.env.HIRING_SEED_DRY_RUN === 'true' ||
    process.argv.includes('--dry-run');

type ApiRow = Record<string, unknown>;

let accessToken = '';

const emptyToNull = (value: string): string | null =>
    value === '' ? null : value;

const emptyToUndefined = (value: string): string | undefined =>
    value === '' ? undefined : value;

const toIntOrNull = (value: string): number | null =>
    value === '' ? null : Number(value);

async function api<T>(
    method: string,
    route: string,
    body?: unknown,
): Promise<T> {
    const response = await fetch(`${API_BASE}${route}`, {
        method,
        headers: {
            'content-type': 'application/json',
            ...(accessToken
                ? { authorization: `Bearer ${accessToken}` }
                : {}),
        },
        body: body === undefined ? undefined : JSON.stringify(body),
    });
    const json = (await response.json()) as {
        success?: boolean;
        message?: string;
        data?: T;
        error?: unknown;
    };
    if (!response.ok || json.success === false) {
        throw new Error(
            `${method} ${route} failed (${response.status}): ${json.message ?? JSON.stringify(json.error ?? json)}`,
        );
    }
    return json.data as T;
}

async function login(email: string, password: string): Promise<void> {
    const data = await api<{ access_token: string }>('POST', '/auth/login', {
        email,
        password,
    });
    accessToken = data.access_token;
}

async function listAllRows(route: string): Promise<ApiRow[]> {
    const rows: ApiRow[] = [];
    let page = 1;
    const limit = 100;
    for (;;) {
        const separator = route.includes('?') ? '&' : '?';
        const data = await api<unknown>(
            'GET',
            `${route}${separator}page=${page}&limit=${limit}`,
        );
        const batch = Array.isArray(data)
            ? (data as ApiRow[])
            : Array.isArray((data as { items?: unknown })?.items)
              ? ((data as { items: ApiRow[] }).items)
              : [];
        rows.push(...batch);
        if (batch.length < limit) {
            break;
        }
        page += 1;
        if (page > 500) {
            throw new Error(`Pagination safety stop on ${route}`);
        }
    }
    return rows;
}

async function ensureHiringAccessPolicies(): Promise<void> {
    const existing = await listAllRows('/access-policy/policies').catch(
        () => [] as ApiRow[],
    );
    const names = new Set(
        existing
            .map((row) => String(row.entity_name ?? ''))
            .filter((name) => name.length > 0),
    );
    for (const policy of HIRING_ACCESS_POLICY_HTTP_SEEDS) {
        if (names.has(policy.entity_name)) {
            console.log(`skip access-policy ${policy.entity_name}`);
            continue;
        }
        await api('POST', '/access-policy/policies', policy);
        console.log(`access-policy ${policy.entity_name} (${policy.mode})`);
    }
}

async function ensureMembership(args: {
    userId: string;
    scopeKey: string;
    scopeId: string;
    existingKeys: Set<string>;
}): Promise<'created' | 'skipped'> {
    const key = `${args.userId}|${args.scopeKey}|${args.scopeId}`;
    if (args.existingKeys.has(key)) {
        return 'skipped';
    }
    await api('POST', '/access-policy/memberships', {
        user_id: args.userId,
        scope_key: args.scopeKey,
        scope_id: args.scopeId,
    });
    args.existingKeys.add(key);
    return 'created';
}

async function loadExistingBusinessIds(
    route: string,
    businessIdField: string,
): Promise<Set<string>> {
    const rows = await listAllRows(route);
    const ids = new Set<string>();
    for (const row of rows) {
        const value = row[businessIdField];
        if (value != null && String(value).trim().length > 0) {
            ids.add(String(value).trim());
        }
    }
    return ids;
}

async function ensureBusinessRow(args: {
    entityName: string;
    route: string;
    businessIdField: string;
    businessId: string;
    body: Record<string, unknown>;
    existingIds: Set<string>;
}): Promise<'created' | 'skipped'> {
    if (args.existingIds.has(args.businessId)) {
        return 'skipped';
    }
    try {
        await api('POST', args.route, args.body);
        args.existingIds.add(args.businessId);
        return 'created';
    } catch (error) {
        throw new Error(
            `${args.entityName} ${args.businessIdField}=${args.businessId} failed: ${String(error)}`,
        );
    }
}

async function ensureRolesAndUsers(
    teamMembers: HiringCsvRow[],
): Promise<Map<string, string>> {
    const roles = await listAllRows('/rbac/roles').catch(() => [] as ApiRow[]);
    const roleNames = new Set(
        roles
            .map((role) =>
                String(role.role_name ?? role.name ?? '').trim(),
            )
            .filter(Boolean),
    );

    for (const roleName of ['Recruiter', 'Interviewer']) {
        if (roleNames.has(roleName)) {
            continue;
        }
        await api('POST', '/rbac/roles', {
            role_name: roleName,
            description: `${roleName} for Intern Hiring Tracker`,
        }).catch(async () => {
            await api('POST', '/rbac/roles', {
                name: roleName,
                label: roleName,
                hint: `${roleName} for Intern Hiring Tracker`,
            });
        });
        console.log(`created role ${roleName}`);
    }

    const existingUsers = await listAllRows('/auth/users').catch(
        () => [] as ApiRow[],
    );
    const emailToUserId = new Map<string, string>();
    for (const user of existingUsers) {
        const email = String(user.email ?? '')
            .trim()
            .toLowerCase();
        const id = String(user.id ?? user.user_id ?? '').trim();
        if (email && id) {
            emailToUserId.set(email, id);
        }
    }

    for (const member of teamMembers) {
        const email = member.email.trim().toLowerCase();
        if (emailToUserId.has(email)) {
            console.log(`skip auth user ${member.email}`);
            continue;
        }
        try {
            const created = await api<ApiRow>('POST', '/auth/users', {
                email: member.email,
                display_name: member.name,
                password: DEMO_PASSWORD,
                role_name: member.role,
            });
            const id = String(created.id ?? created.user_id ?? '').trim();
            if (!id) {
                throw new Error('auth user create returned no id');
            }
            emailToUserId.set(email, id);
            console.log(`created auth user ${member.email} → ${id}`);
        } catch (error) {
            // Re-list in case create raced / already existed without id in response.
            const refreshed = await listAllRows('/auth/users').catch(
                () => [] as ApiRow[],
            );
            for (const user of refreshed) {
                const userEmail = String(user.email ?? '')
                    .trim()
                    .toLowerCase();
                const id = String(user.id ?? user.user_id ?? '').trim();
                if (userEmail && id) {
                    emailToUserId.set(userEmail, id);
                }
            }
            if (!emailToUserId.has(email)) {
                throw new Error(
                    `auth user ${member.email} missing after create attempt: ${String(error)}`,
                );
            }
            console.warn(
                `auth user ${member.email} resolved after create failure: ${emailToUserId.get(email)}`,
            );
        }
    }

    return emailToUserId;
}

async function loadCsv(fileName: string): Promise<HiringCsvRow[]> {
    const text = await readFile(path.join(CSV_DIR, fileName), 'utf8');
    return parseHiringCsv(text);
}

async function loadTables(): Promise<HiringSeedTables> {
    return {
        teamMembers: await loadCsv('team_members.csv'),
        openings: await loadCsv('openings.csv'),
        candidates: await loadCsv('candidates.csv'),
        assessments: await loadCsv('assessments.csv'),
        interviews: await loadCsv('interviews.csv'),
    };
}

function printDryRunReport(report: HiringSeedValidationReport): void {
    console.log(
        JSON.stringify(
            {
                mode: 'dry-run',
                ok: report.ok,
                expectedTotal: report.expectedTotal,
                actualTotal: report.actualTotal,
                importOrder: report.importOrder,
                files: report.files,
                entityMappings: report.entityMappings,
                foreignKeys: report.foreignKeys,
                roles: {
                    recruiterCount: report.roles.recruiters.length,
                    interviewerCount: report.roles.interviewers.length,
                    recruiters: report.roles.recruiters,
                    interviewers: report.roles.interviewers.map((row) => ({
                        memberId: row.memberId,
                        email: row.email,
                    })),
                },
                membershipPlan: {
                    interviewerCount: report.membershipPlan.interviewerCount,
                    membershipCount: report.membershipPlan.membershipCount,
                    byInterviewer: report.membershipPlan.byInterviewer,
                },
                duplicateBusinessIds: report.duplicateBusinessIds,
                issueCount: report.issues.length,
                issues: report.issues,
            },
            null,
            2,
        ),
    );
}

async function seedEntities(tables: HiringSeedTables): Promise<{
    created: Record<string, number>;
    skipped: Record<string, number>;
}> {
    const created: Record<string, number> = {};
    const skipped: Record<string, number> = {};

    for (const step of HIRING_SEED_IMPORT_ORDER) {
        created[step.entityName] = 0;
        skipped[step.entityName] = 0;
        const existingIds = await loadExistingBusinessIds(
            step.route,
            step.businessIdField,
        );
        const rows =
            step.countKey === 'team_members'
                ? tables.teamMembers
                : step.countKey === 'openings'
                  ? tables.openings
                  : step.countKey === 'candidates'
                    ? tables.candidates
                    : step.countKey === 'assessments'
                      ? tables.assessments
                      : tables.interviews;

        for (const row of rows) {
            const businessId = row[step.businessIdField]?.trim() ?? '';
            const body = buildEntityBody(step.entityName, row);
            const result = await ensureBusinessRow({
                entityName: step.entityName,
                route: step.route,
                businessIdField: step.businessIdField,
                businessId,
                body,
                existingIds,
            });
            if (result === 'created') {
                created[step.entityName] += 1;
            } else {
                skipped[step.entityName] += 1;
            }
        }
        console.log(
            `${step.entityName}: created=${created[step.entityName]} skipped=${skipped[step.entityName]}`,
        );
    }

    return { created, skipped };
}

function buildEntityBody(
    entityName: string,
    row: HiringCsvRow,
): Record<string, unknown> {
    switch (entityName) {
        case 'team_member':
            return {
                member_id: row.member_id,
                name: row.name,
                email: row.email,
                role: row.role,
                team: row.team,
                status: row.status,
            };
        case 'job_opening':
            return {
                opening_id: row.opening_id,
                title: row.title,
                team: row.team,
                location: row.location,
                stipend_inr: Number(row.stipend_inr),
                positions: Number(row.positions),
                posted_on: emptyToNull(row.posted_on),
                closes_on: emptyToNull(row.closes_on),
                status: row.status,
                interview_rounds: Number(row.interview_rounds),
                assessment_name: row.assessment_name,
                assessment_days: Number(row.assessment_days),
                owner: row.owner,
            };
        case 'job_candidate':
            return {
                candidate_id: row.candidate_id,
                opening: row.opening,
                name: row.name,
                email: row.email,
                college: row.college,
                degree: row.degree,
                graduation_year: Number(row.graduation_year),
                source: row.source,
                resume_link: row.resume_link,
                applied_on: row.applied_on,
                stage: row.stage,
                stage_updated_on: row.stage_updated_on,
                rejected_reason: emptyToNull(row.rejected_reason),
                joining_on: emptyToNull(row.joining_on),
                notes: emptyToUndefined(row.notes),
            };
        case 'job_assessment':
            return {
                assessment_id: row.assessment_id,
                candidate: row.candidate,
                reviewer: row.reviewer,
                sent_on: row.sent_on,
                due_on: row.due_on,
                submitted_on: emptyToNull(row.submitted_on),
                submission_link: emptyToNull(row.submission_link),
                score: toIntOrNull(row.score),
                result: row.result,
                reviewed_on: emptyToNull(row.reviewed_on),
            };
        case 'job_interview':
            return {
                interview_id: row.interview_id,
                candidate: row.candidate,
                round: Number(row.round),
                interviewer: row.interviewer,
                scheduled_at: row.scheduled_at,
                mode: row.mode,
                status: row.status,
                rating: toIntOrNull(row.rating),
                recommendation: emptyToNull(row.recommendation),
                feedback: emptyToNull(row.feedback),
                feedback_on: emptyToNull(row.feedback_on),
            };
        default:
            throw new Error(`Unknown entity ${entityName}`);
    }
}

async function seedMemberships(
    tables: HiringSeedTables,
    emailToUserId: Map<string, string>,
): Promise<{ created: number; skipped: number }> {
    const planned = planInterviewerMembershipsForUsers({
        teamMembers: tables.teamMembers,
        assessments: tables.assessments,
        interviews: tables.interviews,
        emailToUserId,
    });
    const existing = await listAllRows('/access-policy/memberships').catch(
        () => [] as ApiRow[],
    );
    const existingKeys = new Set(
        existing.map(
            (row) =>
                `${String(row.user_id)}|${String(row.scope_key)}|${String(row.scope_id)}`,
        ),
    );
    let created = 0;
    let skipped = 0;
    for (const membership of planned) {
        const result = await ensureMembership({
            userId: membership.userId,
            scopeKey: membership.scopeKey,
            scopeId: membership.scopeId,
            existingKeys,
        });
        if (result === 'created') {
            created += 1;
            console.log(
                `membership ${membership.userId} ${membership.scopeKey}=${membership.scopeId}`,
            );
        } else {
            skipped += 1;
        }
    }
    return { created, skipped };
}

async function main(): Promise<void> {
    const tables = await loadTables();
    const report = validateHiringSeedTables(tables);

    if (DRY_RUN) {
        printDryRunReport(report);
        if (!report.ok) {
            throw new Error(
                `Dry-run validation failed with ${report.issues.length} issue(s)`,
            );
        }
        console.log('Dry-run OK — no database writes performed');
        return;
    }

    if (!report.ok) {
        printDryRunReport(report);
        throw new Error(
            `Seed aborted: CSV validation failed with ${report.issues.length} issue(s)`,
        );
    }

    if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
        throw new Error(
            'Set HIRING_ADMIN_EMAIL/HIRING_ADMIN_PASSWORD (or APP_BOOTSTRAP_ADMIN_*)',
        );
    }

    console.log('CSV validation OK', {
        total: report.actualTotal,
        importOrder: report.importOrder,
        membershipsPlanned: report.membershipPlan.membershipCount,
        csvDir: CSV_DIR,
        base: API_BASE,
    });

    await login(ADMIN_EMAIL, ADMIN_PASSWORD);
    const emailToUserId = await ensureRolesAndUsers(tables.teamMembers);

    try {
        await ensureHiringAccessPolicies();
    } catch (error) {
        console.warn(
            `access-policy seed skipped (admin API may be off): ${String(error)}`,
        );
    }

    const entityResult = await seedEntities(tables);
    const membershipResult = await seedMemberships(tables, emailToUserId);

    console.log('Seed import finished', {
        entities: entityResult,
        memberships: membershipResult,
        usersResolved: emailToUserId.size,
        base: API_BASE,
    });
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
