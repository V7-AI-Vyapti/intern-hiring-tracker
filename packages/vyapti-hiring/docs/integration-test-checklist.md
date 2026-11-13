# Integration / live acceptance checklist

These cases require a **generated Intern Hiring Tracker app**, loaded seed CSVs, and working auth/RBAC/access-policy. They are **not** executed in `@vyapti/hiring` unit CI.

Constraints for this repo workstream: no project generation, no migrations, no live seed, no office DB.

## Blocked live cases (map to T1–T22)

| Case | Spec | Prerequisite |
|------|------|--------------|
| Login Recruiter / bad password | T1, T2 | Generated `@vyapti/auth` |
| Interviewer CRUD list counts 36/30/10 | T3 | Seed + memberships + APOL-03 |
| Interviewer shortlist HTTP 403 | T4 | Live JWT + RBAC guard |
| Dashboard HTTP equals seed JSON | T5 | Seed + today=2026-11-12 |
| Public apply / Draft-Closed HTTP | T6, T7 | Deployed `/hiring/apply` |
| Workflow chain T8–T21 over HTTP | T8–T21 | Seed + actions + today fixed |
| CRUD delete refused HTTP | T22 | Generated CRUD with delete disabled |
| Pagination / counts on CRUD lists | — | Generated list endpoints |
| Access-policy empty membership empty page | — | Live membership rows |
| Transaction rollback on mid-action failure | — | Live DB + adapter ALS |

## Unit vs integration

| Layer | Location | Runs in CI without DB |
|-------|----------|------------------------|
| Workflow / dashboard / apply / RBAC / policy / seed validation | `packages/vyapti-hiring/src/__tests__/*` | Yes |
| APOL-03 codegen emit | `packages/vyapti-codegen` | Yes |
| HTTP against generated app | Postman / future e2e | **No** (blocked) |

## Suggested live order (when unblocked)

1. Dry-run seed: `npm run seed:intern-hiring:dry-run` (package `@vyapti/hiring`)
2. Generate + deploy app; live seed with admin credentials
3. Run T1 → T22 in order on fresh seed with today = 12 Nov 2026
4. Confirm Swagger/Postman matches `docs/api-reference.md`
