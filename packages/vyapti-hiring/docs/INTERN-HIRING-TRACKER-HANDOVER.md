# Intern Hiring Tracker — Technical Handover

**Package:** `@vyapti/hiring`  
**Spec source:** *Intern Hiring Tracker on Vyapti: Backend Specification* + *Project Overview* (PDF; not vendored in this git tree)  
**Document status:** Local implementation and unit/mock verification are substantially complete. **Live generate, seed, and HTTP acceptance have not been executed** in this workstream.

### Related docs in this package

| Doc | Purpose |
|-----|---------|
| [api-reference.md](./api-reference.md) | Hiring HTTP contracts |
| [acceptance-traceability-T1-T22.md](./acceptance-traceability-T1-T22.md) | Spec ↔ code ↔ tests |
| [integration-test-checklist.md](./integration-test-checklist.md) | Live/blocked cases |

---

## 1. Project overview and architecture

Intern Hiring Tracker is a Vyapti-generated Nest backend:

- **Generated layer:** Five entity CRUD APIs (`/vulcan/...`), auth, RBAC, access-policy, optional Forms studio.
- **Client package `@vyapti/hiring`:** Stage workflow actions, dashboard alerts, public apply, seed helpers, host glue for a generated app.
- **Frontend:** Built separately; talks only to APIs.

```text
Browser / careers page
    │
    ├─ Public  GET/POST /api/v1/hiring/*   (@Public apply / openings / form schema)
    ├─ Auth    POST /auth/login
    ├─ CRUD    /vulcan/{entity}            (APOL-03 filters on protected routes)
    └─ Hiring  /api/v1/hiring/{action}     (RBAC + ownership)
                    │
                    └─ HiringPersistenceAdapter → getEntityWithName + ALS transactions
```

**Completed locally:** package services/controllers, host persistence/bootstrap/guards, seed dry-run validation, APOL-03 codegen wiring in `@vyapti/codegen`, 64 hiring unit tests.  
**Not completed live:** project generation, deploy, CSV HTTP seed, T1–T22 against a running app.

---

## 2. Five entities and relationships

| Entity name | Domain | Links |
|-------------|--------|--------|
| `team_member` | Recruiters / Interviewers | — |
| `job_opening` | Internship openings | `owner` → team_member |
| `job_candidate` | Applications | `opening` → job_opening |
| `job_assessment` | Take-home | `candidate` → job_candidate; `reviewer` → team_member |
| `job_interview` | Interviews | `candidate` → job_candidate; `interviewer` → team_member |

Stages (candidate): Applied → Shortlisted → Assessment sent → Assessment submitted → Interview 1 / 2 → Offer made → Hired | Rejected | Withdrawn.

---

## 3. Business IDs, AutoPKs, and foreign keys

Evidence: `host/hiring.constants.ts`, `generated/intern-hiring-tracker-seed/validation-report.json`.

| Entity | Business ID | AutoPK |
|--------|-------------|--------|
| team_member | `member_id` | `team_member_id` |
| job_opening | `opening_id` | `job_opening_id` |
| job_candidate | `candidate_id` | `job_candidate_id` |
| job_assessment | `assessment_id` | `job_assessment_id` |
| job_interview | `interview_id` | `job_interview_id` |

| FK property | Related business ID |
|-------------|---------------------|
| `owner` | `member_id` |
| `opening` | `opening_id` |
| `candidate` | `candidate_id` |
| `reviewer` | `member_id` |
| `interviewer` | `member_id` |

**Note:** `job_candidate.opening` may be a scalar CharacterString when foreign_key_map is incomplete; host persistence uses `pickRelations` / `isRelation` so TypeORM is not asked for relations on scalar FKs.

---

## 4. Hiring package structure and responsibilities

```text
packages/vyapti-hiring/
  src/
    controller/hiring.controller.ts     HTTP actions + public routes
    services/                           workflow, dashboard, public apply
    hiring.catalog.ts / .access-policy.ts / .enums.ts / .constants.ts
    forms/public-application-form.ts    Forms-compatible public schema
    seed/                               CSV parse + dry-run validation
    utils/                              RBAC, memberships, errors, dates
  host/                                 Copied into generated app (GeneratedHiringModule)
  scripts/seed-intern-hiring.ts         HTTP seed (+ --dry-run)
  docs/                                 This handover + API / T1–T22 / integration
```

- **Library (`src/`):** Nest module `HiringModule.forRoot`, no generated entity imports.
- **Host (`host/`):** Persistence adapter, bootstrap (RBAC + policies), Recruiter access-policy bypass guard, fixtures.

---

## 5. Persistence adapter and transactions

| Piece | Path | Role |
|-------|------|------|
| Ops contract | `host/persistence/hiring-entity-ops.ts` | Entity class + `isRelation` |
| Factory | `host/persistence/create-hiring-persistence-from-ops.ts` | Maps rows ↔ business IDs; `withTransaction` |
| Generated wiring | `host/persistence/generated-hiring-persistence.adapter.ts` | `getEntityWithName` |

- Transactions use the platform ALS / Unit of Work pattern already used by other client packages.
- Workflow actions wrap multi-write steps in `persistence.withTransaction`.
- Business IDs for new assessments/interviews/candidates use padded prefixes (`CAN`/`ASM`/`INT`).

---

## 6. Recruiter and Interviewer roles and permissions

Evidence: `src/hiring.catalog.ts`, `host/fixtures/hiring-rbac.fixture.ts`.

| Role | Workflow actions | Entity CRUD grants | Delete |
|------|------------------|--------------------|--------|
| **Recruiter** | All `HIRING_ACTIONS` (incl. `dashboard_summary`) | list/view/create/update on five entities | **Off** |
| **Interviewer** | `review_assessment`, `record_feedback` only | list/view only | **Off** |
| **Public** | apply / openings / application_form | no CRUD login | — |

Unauthorized hiring actions → **403**. Wrong stage → **409**. Field validation → **422** `{ field, message }`.

Seed logins (spec): one user per team member, password `Demo@1234`. Fatima (`TM-01`) and Vikram (`TM-02`) = Recruiter; other six = Interviewer.

---

## 7. Access-policy rules and interviewer memberships

Evidence: `src/hiring.access-policy.ts`, `src/utils/hiring-access-policy-membership.util.ts`, host bypass guard.

| Entity | Mode | Constraint | Scope key |
|--------|------|------------|-----------|
| team_member | filter | `member_id` | `member_id` |
| job_opening | unrestricted | — | — |
| job_candidate | filter | `candidate_id` | `assigned_candidate_id` |
| job_assessment | filter | `reviewer` | `member_id` |
| job_interview | filter | `interviewer` | `member_id` |

- **Recruiter/Admin bypass:** `request.user.isSystemAdmin === true` (host `GeneratedHiringAccessPolicyBypassGuard` marks Recruiters).
- **Interviewer memberships:** `buildInterviewerMemberships({ userId, memberId, assessments, interviews })` emits:
  - one `member_id` membership
  - `assigned_candidate_id` for each candidate where reviewer or interviewer = that member  
  (materializes OR that access-policy cannot express as a single filter).
- Policies upsert on host bootstrap; memberships are created by the **seed script after** auth users and assignment rows exist (not on bootstrap alone).

Dry-run membership plan on repo CSVs: **6 interviewers, 215 memberships**.

---

## 8. APOL-03 shared generated CRUD enforcement

Evidence: `packages/vyapti-codegen` CRUD emitters (`build_service_lines.ts`, `build_controller_lines.ts`, `build_crud_module_lines.ts`).

On protected CRUD (`auth_required !== false`):

| Op | Enforcement |
|----|-------------|
| list / count | `resolveFilter` → `applyAccessFilter`; empty/deny → empty page; `IN (...)` before `filter`/`countOf` |
| view / update / delete | `assertRow` → out-of-scope **404** |
| create | `prepareCreateBody` |
| update | `assertRow` + `assertUpdateScope` |
| public | no policy calls |

`GeneratedCrudApiModule` imports `GeneratedAccessPolicyModule`.  
**Requires regenerate** of a project to emit into that app’s CRUD sources. Codegen unit tests cover emit; live CRUD HTTP not run here.

---

## 9. Public application form and API flow

Evidence: `src/forms/public-application-form.ts`, `PublicApplyService`, hiring controller.

**Limitation (do not work around):** `@vyapti/forms` has **no** public submit API and **no** anonymous location GET in v1. Hiring owns capture.

| Step | API |
|------|-----|
| Schema | `GET /api/v1/hiring/application_form` (`@Public`) |
| Open openings | `GET /api/v1/hiring/openings` (`@Public`) |
| Submit | `POST /api/v1/hiring/apply` (`@Public`, strict body) |

Applicant fields only: `opening_id`, `name`, `email`, `college`, `degree`, `graduation_year`, `source`, `resume_link`.  
Creates candidate at **Applied**; Open-only / not past `closes_on`; duplicate email → 422 “Already applied to this opening”.  
Optional Forms studio seed: `PUBLIC_APPLICATION_FORM_HTTP_SEED` / host fixture (definition only).

---

## 10. Hiring workflow actions and transitions

Controller prefix: **`/api/v1/hiring`**. Each action is transactional.

| Action | Allowed when (summary) | Principal writes |
|--------|------------------------|------------------|
| shortlist | Applied | Shortlisted |
| reject / withdraw | active stage + reason | Rejected/Withdrawn; cancel Scheduled interviews |
| send_assessment | Shortlisted | Assessment + Assessment sent |
| record_submission | Assessment sent | submitted_on + Assessment submitted |
| review_assessment | Assessment submitted; reviewer or Recruiter | Pass→Interview 1 / Fail→Rejected |
| schedule_interview | Interview 1/2, round free | Interview Scheduled |
| record_feedback | Scheduled, time passed; interviewer or Recruiter | Done; Hire/Reject/Next round rules |
| mark_no_show | Scheduled, time passed | No-show; Withdrawn |
| cancel_interview | Scheduled | Cancelled |
| make_offer | Done+Hire; hired &lt; positions | Offer made |
| record_offer_answer | Offer made | Hired or Declined/Withdrawn |
| dashboard_summary | Recruiter | read-only |

---

## 11. Dashboard metrics and attention categories

Evidence: `DashboardSummaryService`, `ALERT_THRESHOLDS`, seed `validation-report.json` (today = **2026-11-12**).

**Needs attention keys:** `not_reviewed` (Applied &gt;5d), `assessment_not_sent` (Shortlisted &gt;2d), `assessment_overdue`, `review_pending`, `interview_not_scheduled`, `feedback_missing`, `offer_pending`.

**Also returned:** `open_positions`, `applicants`, `in_progress`, `hired`, `avg_days_to_hire`, assessment counts, `interviews_done`, per-opening rows, `by_source`, plus ID lists per alert key.

Unit test loads full CSVs in-memory and matches expected seed dashboard numbers. Live HTTP T5 not run.

---

## 12. CSV import, counts, and seed commands

CSV directory: `v7-backend/generated/intern-hiring-tracker-seed/`

| File | Count |
|------|------:|
| team_members.csv | 8 |
| openings.csv | 6 |
| candidates.csv | 445 |
| assessments.csv | 176 |
| interviews.csv | 107 |
| **Total** | **742** |

**Import order:** TeamMember → JobOpening → JobCandidate → JobAssessment → JobInterview.

```bash
# Dry-run only (no HTTP / no DB) — validated OK in this workstream
cd v7-backend/packages/vyapti-hiring
npm run seed:intern-hiring:dry-run

# Live seed — NOT executed here; needs generated app + admin credentials
HIRING_APP_BASE=https://<host>/api/v1 \
HIRING_ADMIN_EMAIL=... HIRING_ADMIN_PASSWORD=... \
npm run seed:intern-hiring
```

Live seed behaviour (implemented, unverified against a real host): idempotent skip of existing business IDs; ensure roles/users; upsert policies; POST entities; plan + dedupe Interviewer memberships via `buildInterviewerMemberships`.

---

## 13. API endpoint reference

See **[api-reference.md](./api-reference.md)** for full request/response/validation detail.

**Hiring module (host prefix `api/v1/hiring`):**

| Method | Path | Auth |
|--------|------|------|
| GET | `/application_form` | Public |
| GET | `/openings` | Public |
| POST | `/apply` | Public |
| GET | `/dashboard_summary` | Recruiter |
| POST | `/shortlist`, `/reject`, `/withdraw`, `/send_assessment`, `/record_submission`, `/review_assessment`, `/schedule_interview`, `/record_feedback`, `/mark_no_show`, `/cancel_interview`, `/make_offer`, `/record_offer_answer` | JWT + permission |

**Generated CRUD:** `/vulcan/team_member`, `/vulcan/job_opening`, `/vulcan/job_candidate`, `/vulcan/job_assessment`, `/vulcan/job_interview` (list/view/create/update; delete off).

**Auth:** `POST /auth/login` (T1/T2 — outside this package).

---

## 14. Test coverage and actual results

**Executed in this workstream (no live DB):**

| Suite area | Location |
|------------|----------|
| Workflow actions | `src/__tests__/hiring-actions.test.ts` |
| RBAC | `hiring-rbac.test.ts` |
| Access-policy | `hiring-access-policy.test.ts` |
| Persistence | `hiring-persistence-*.test.ts` |
| Dashboard | `dashboard-summary.test.ts` |
| Public form | `public-application-form.test.ts` |
| Seed validation | `hiring-seed-validation.test.ts` |
| Acceptance subset | `acceptance-criteria.test.ts` |

**Latest local run:** `@vyapti/hiring` **64/64** tests passed; `tsc` build OK.

**Also related (codegen):** APOL-03 emit tests in `@vyapti/codegen` (executed earlier in the programme; not re-asserted in this doc-only task beyond hiring).

**Not executed:** Live seed, HTTP T1–T22, Postman e2e, generate.

---

## 15. T1–T22 acceptance traceability

Full matrix: **[acceptance-traceability-T1-T22.md](./acceptance-traceability-T1-T22.md)**.

| Bucket | IDs |
|--------|-----|
| Unit **covered** (executed) | T4, T5*, T6, T7, T9, T10, T12–T14, T16–T18, T20–T22 (*T5 via in-memory seed CSVs) |
| **Partial** | T8, T11, T15, T19 (logic covered; seed-exact deltas need live/full seed) |
| **Blocked** live | T1, T2, T3; all HTTP replays of covered cases |

Do **not** report unit “covered” as deployed acceptance pass.

**Known spec nuance:** Validation table V5 suggests 422 for “All positions are filled”; acceptance **T20** expects **409**. Implementation follows **T20** (`ConflictException`).

---

## 16. Known limitations and deployment blockers

1. **Project generation blocked** when control-plane `Project.deployment_environment` (and related revision columns) are missing or unset — generate must not be forced until the platform DB/schema supports it (`mac_mini` / `trooper`, etc.).
2. **Live seed and HTTP acceptance have not been run** (office DB / generate / migrate / reset deliberately avoided).
3. **`@vyapti/forms` cannot submit public applications** — hiring public APIs are the capture path; Forms is optional schema studio only.
4. **APOL-03** is in shared codegen; an already-generated app must be **regenerated** to emit filter/`assertRow` into its CRUD files.
5. **`@vyapti/hiring` may still need package-catalog injection** for automatic host copy on generate (confirm against `package-catalog.constants.ts` at deploy time).
6. Auth `/auth/users` response shapes can vary (`id` vs `user_id`); seed script handles both + re-list, but that is unverified live.
7. Unit harness team-member emails/names are a **subset fixture** for workflows; production seed CSVs are the authority for T3 counts and login emails.

---

## 17. Safe deployment and live verification sequence

1. Fix / verify control-plane `Project.deployment_environment` (and generate prerequisites).
2. Create/configure Intern Hiring Tracker project with five entities + auth/rbac/access-policy (+ forms if desired); select/include hiring host package.
3. Generate and deploy HTTPS app (CORS for FE). **Do not** reset unrelated environments.
4. `npm run seed:intern-hiring:dry-run` — expect `ok: true`, 742 rows, 0 issues.
5. Live seed with admin credentials against the new base URL (idempotent re-run safe for existing business IDs / memberships).
6. Confirm Swagger/Postman against [api-reference.md](./api-reference.md).
7. Run T1→T22 on **fresh seed**, today = **12 Nov 2026** (or recompute dashboard expectations if the calendar day differs).
8. Spot-check Interviewer CRUD row counts (T3), public apply (T6/T7), delete refused (T22).

---

## Handover checklist (local vs live)

| Item | Local | Live |
|------|-------|------|
| Entities / FKs / enums | Done in schemas + host constants | Verify after generate |
| Persistence + transactions | Unit tested | Verify under load |
| RBAC + access-policy defs | Done | Bootstrap + seed memberships |
| APOL-03 codegen | Done in `@vyapti/codegen` | Regenerate app |
| Public apply | Done | HTTP smoke |
| Workflow + dashboard | Done (64 tests) | T1–T22 |
| CSV dry-run | Done (742 OK) | Then live seed |
| Generate / deploy | **Blocked** (`deployment_environment`) | Unblock first |
