# Intern Hiring Tracker — T1–T22 acceptance traceability

**Source of truth:** *Intern Hiring Tracker on Vyapti: Backend Specification* (PDF), section “Acceptance tests” (today = 12 Nov 2026, fresh seed).

**Status legend**

| Status | Meaning |
|--------|---------|
| covered | Unit/mock test exists and has been executed in `@vyapti/hiring` |
| partial | Behaviour implemented and partially asserted; seed-exact or HTTP live check still needed |
| missing | No automated test yet |
| blocked | Requires generated app, live DB, seed load, and/or `@vyapti/auth` HTTP |

Do **not** treat “covered” as live acceptance pass — T1–T22 on a deployed app are blocked until generate + seed.

---

## Matrix

| ID | Requirement (spec) | Endpoint / method | Implementation | Existing / new test | Status |
|----|--------------------|-------------------|----------------|---------------------|--------|
| T1 | Login `fatima@` + `Demo@1234` → 200, token, Recruiter | `POST /auth/login` | `@vyapti/auth` (generated host) | — | **blocked** (live auth) |
| T2 | Wrong password → 401 | `POST /auth/login` | `@vyapti/auth` | — | **blocked** (live auth) |
| T3 | As `aarav@`, list Candidates/Assessments/Interviews → 36 / 30 / 10 | Generated CRUD `GET /vulcan/job_*` + access-policy | APOL-03 + `buildInterviewerMemberships` | `hiring-access-policy.test.ts` (filter shape, not seed counts) | **blocked** (live seed + memberships); policy unit **covered** |
| T4 | As `aarav@`, `shortlist` → 403 | `POST /api/v1/hiring/shortlist` | `HiringActionsService.shortlist` + RBAC | `hiring-actions.test.ts`, `hiring-rbac.test.ts` | **covered** |
| T5 | `dashboard_summary` matches seed JSON | `GET /api/v1/hiring/dashboard_summary` | `DashboardSummaryService.summarize` | `dashboard-summary.test.ts` (full CSV seed in-memory) | **covered** (unit with seed CSVs) |
| T6 | Public apply OPN-04 → Applied, `applied_on` today | `POST /api/v1/hiring/apply` | `PublicApplyService.apply` | `hiring-actions.test.ts`, `public-application-form.test.ts` | **covered** |
| T7 | Public apply Draft/Closed → 422 opening message | `POST /api/v1/hiring/apply` | `PublicApplyService.apply` | `public-application-form.test.ts`, `hiring-actions.test.ts` | **covered** |
| T8 | `shortlist` CAN-0376 → Shortlisted; `not_reviewed` 9→8 | `POST …/shortlist` + dashboard | `HiringActionsService` + `DashboardSummaryService` | `hiring-actions.test.ts`; alert drop on harness in `dashboard-summary.test.ts` | **partial** (harness 1→0; seed 9→8 needs full seed mutate) |
| T9 | `send_assessment` CAN-0376 while Applied → 409 | `POST …/send_assessment` | `HiringActionsService.sendAssessment` | `hiring-actions.test.ts` | **covered** |
| T10 | `send_assessment` CAN-0248, TM-07 → due_on 15 Nov; Assessment sent | `POST …/send_assessment` | same | `hiring-actions.test.ts` | **covered** |
| T11 | `record_submission` CAN-0177 → submitted today; Assessment submitted; overdue↓ | `POST …/record_submission` | `HiringActionsService.recordSubmission` | `hiring-actions.test.ts` (stage/date); overdue delta **partial** | **partial** |
| T12 | `review_assessment` CAN-0354 score 72 as meera@ → Pass, Interview 1 | `POST …/review_assessment` | `HiringActionsService.reviewAssessment` | `hiring-actions.test.ts` (harness reviewer) | **covered** |
| T13 | review CAN-0361 score 45 → Fail, Rejected, reason | same | same | `hiring-actions.test.ts` | **covered** |
| T14 | review CAN-0361 as aarav@ (not reviewer) → 403 | same | ownership + RBAC | `hiring-actions.test.ts`, `hiring-rbac.test.ts` | **covered** |
| T15 | `schedule_interview` CAN-0324, TM-08, 16 Nov 11:00 Video → Scheduled; alert↓ | `POST …/schedule_interview` | `HiringActionsService.scheduleInterview` | `hiring-actions.test.ts` (booking); alert ↓ **partial** | **partial** |
| T16 | schedule CAN-0235 (round 1 booked) → 422 “Round 1 is already booked” | same | V9 `unprocessable` | `hiring-actions.test.ts` + `acceptance-criteria.test.ts` | **covered** |
| T17 | `record_feedback` INT-086 as karan@ → Done; CAN-0235 stays Interview 1 | `POST …/record_feedback` | `HiringActionsService.recordFeedback` | `hiring-actions.test.ts` | **covered** |
| T18 | `make_offer` CAN-0235 after T17 → Offer made | `POST …/make_offer` | `HiringActionsService.makeOffer` | `hiring-actions.test.ts` | **covered** |
| T19 | `record_offer_answer` CAN-0232 accepted + joining → Hired; OPN-03 4/4; offer_pending↓ | `POST …/record_offer_answer` | `HiringActionsService.recordOfferAnswer` | `hiring-actions.test.ts` (Hired); seed 4/4 + alert **blocked**/partial | **partial** |
| T20 | After seats filled, `make_offer` CAN-0235 → 409 “All positions are filled” | `POST …/make_offer` | `conflict('All positions are filled')` | `hiring-actions.test.ts` + `acceptance-criteria.test.ts` | **covered** |
| T21 | `reject` without reason → 422 “Give a reason” | `POST …/reject` | `unprocessable('reason', …)` | `hiring-actions.test.ts` | **covered** |
| T22 | Delete any record, any role → refused | Generated CRUD delete disabled + catalog | `hiringEntityAllowsDelete`, RBAC | `hiring-access-policy.test.ts`, `hiring-rbac.test.ts` | **covered** (unit); live CRUD delete **blocked** |

---

## Related validation (V1–V12) used by acceptance

| Rule | Spec message / behaviour | Unit status |
|------|--------------------------|-------------|
| V1 duplicate apply | “Already applied to this opening” (422) | covered (`acceptance-criteria.test.ts`) |
| V2 Open-only apply | “This opening is not accepting applications” | covered |
| V3 reject/withdraw reason | “Give a reason” | covered |
| V5 positions filled | T20 uses **409**; V5 table says 422 — implementation follows **T20** | covered |
| V9 round booked | “Round {n} is already booked” (422) | covered |

---

## Files touched by this preparation

- `docs/acceptance-traceability-T1-T22.md` (this file)
- `docs/api-reference.md`
- `docs/integration-test-checklist.md`
- `src/__tests__/acceptance-criteria.test.ts`
