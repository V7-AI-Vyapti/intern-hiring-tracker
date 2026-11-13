# Intern Hiring Tracker — API reference (`@vyapti/hiring`)

Host route prefix (generated): **`/api/v1/hiring`**  
(`GENERATED_HIRING_CONFIG.ROUTE_PREFIX` / `HiringModule.forRoot({ routePrefix })`)

Auth: JWT Bearer unless marked **Public**.  
RBAC: `@RequirePermission('hiring', '<action>')` plus in-service role checks.  
Row scope (Interviewers): `@vyapti/access-policy` on generated CRUD; workflow ownership in `HiringActionsService`.

Success responses follow the generated Nest envelope (`data` / `success`) unless noted. Validation failures from hiring actions use Nest exceptions:

| Exception | HTTP | Body shape |
|-----------|------|------------|
| `UnprocessableEntityException` | **422** | `{ field, message }` (or Nest wrapper containing that) |
| `ConflictException` | **409** | plain message string (stage / capacity conflicts) |
| `ForbiddenException` | **403** | Forbidden |
| `UnauthorizedException` | **401** | missing/invalid session |

---

## Public (no login)

### `GET /api/v1/hiring/application_form`

| | |
|--|--|
| Auth | None (`@Public`) |
| Role | — |
| Response | `PUBLIC_APPLICATION_FORM_CONFIG` (Forms-compatible schema + field keys) |
| Notes | `@vyapti/forms` has no anonymous capture GET; careers FE uses this |

### `GET /api/v1/hiring/openings`

| | |
|--|--|
| Auth | None |
| Role | — |
| Response | Array of eligible Open openings: `opening_id`, `title`, `team`, `location`, `stipend_inr`, `positions`, `posted_on`, `closes_on` |
| Rules | Omits Draft / Closed / On hold / past `closes_on`; no `owner` / assessment internals |

### `POST /api/v1/hiring/apply`

| | |
|--|--|
| Auth | None |
| Role | — |
| Body (strict) | `opening_id`, `name`, `email`, `college`, `degree`, `graduation_year` (int), `source`, `resume_link` |
| Success | `CandidateRow` with `stage: Applied`, `applied_on` = today (Asia/Kolkata) |
| 422 | Opening not Open / closed by date: `opening` / “This opening is not accepting applications”; missing/invalid fields; **duplicate** email on opening: `email` / “Already applied to this opening” |
| Security | Unknown keys rejected (`z.strictObject`); stage/notes/reviewer etc. never writable |

---

## Recruiter workflow (authenticated)

All require JWT + Recruiter (or Admin) grant unless noted. Interviewer-only actions listed separately.

### `GET /api/v1/hiring/dashboard_summary`

| | |
|--|--|
| Permission | `hiring` / `dashboard_summary` |
| Role | Recruiter |
| Body | none |
| Response | Live metrics: `open_positions`, `applicants`, `in_progress`, `hired`, `avg_days_to_hire`, `assessments`, `interviews_done`, `needs_attention`, `needs_attention_ids`, `openings[]`, `by_source` |
| Spec | Exact seed snapshot for 2026-11-12 in Backend Specification p.11 / `validation-report.json` |

### `POST /api/v1/hiring/shortlist`

| | |
|--|--|
| Permission | `hiring` / `shortlist` |
| Body | `{ candidate_id }` |
| When | stage Applied |
| Writes | stage Shortlisted, `stage_updated_on` today |
| 403 | Interviewer / unauthorized |
| 409 | Wrong stage |

### `POST /api/v1/hiring/reject`

| | |
|--|--|
| Body | `{ candidate_id, reason? }` |
| When | active stage |
| Writes | Rejected + `rejected_reason`; Scheduled interviews → Cancelled |
| 422 | missing reason → `reason` / “Give a reason” |

### `POST /api/v1/hiring/withdraw`

| | |
|--|--|
| Body | `{ candidate_id, reason? }` |
| When | active stage |
| Writes | Withdrawn + reason; cancel Scheduled interviews |
| 422 | “Give a reason” |

### `POST /api/v1/hiring/send_assessment`

| | |
|--|--|
| Body | `{ candidate_id, reviewer }` |
| When | Shortlisted |
| Writes | Assessment (`sent_on` today, `due_on` = today + opening.assessment_days, Pending); stage Assessment sent |
| 409 | Wrong stage (e.g. still Applied — T9) |

### `POST /api/v1/hiring/record_submission`

| | |
|--|--|
| Body | `{ candidate_id, submission_link }` |
| When | Assessment sent |
| Writes | `submitted_on`, link; stage Assessment submitted |

### `POST /api/v1/hiring/review_assessment`

| | |
|--|--|
| Body | `{ candidate_id, score }` (0–100) |
| When | Assessment submitted; caller is reviewer **or** Recruiter |
| Writes | Pass (≥60) → Interview 1; Fail → Rejected + “Assessment score below 60” |
| 403 | Interviewer who is not the reviewer (T14) |

### `POST /api/v1/hiring/schedule_interview`

| | |
|--|--|
| Body | `{ candidate_id, interviewer, scheduled_at, mode }` |
| When | Interview 1/2 and round free |
| Writes | Interview Scheduled |
| 422 | “Round {n} is already booked” (T16 / V9) |

### `POST /api/v1/hiring/record_feedback`

| | |
|--|--|
| Body | `{ interview_id, rating, recommendation, feedback }` |
| When | Scheduled and time passed; caller interviewer **or** Recruiter |
| Writes | Done + feedback_on; Hire leaves stage for offer; Reject / Next round per rules |

### `POST /api/v1/hiring/mark_no_show`

| | |
|--|--|
| Body | `{ interview_id }` |
| Writes | No-show; candidate Withdrawn “Missed the interview” |

### `POST /api/v1/hiring/cancel_interview`

| | |
|--|--|
| Body | `{ interview_id }` |
| When | Scheduled |
| Writes | Cancelled (round rebookable) |

### `POST /api/v1/hiring/make_offer`

| | |
|--|--|
| Body | `{ candidate_id }` |
| When | latest Done interview recommends Hire; hired count &lt; positions |
| Writes | Offer made |
| 409 | “All positions are filled” (T20) |

### `POST /api/v1/hiring/record_offer_answer`

| | |
|--|--|
| Body | `{ candidate_id, accepted, joining_on? }` |
| When | Offer made |
| Writes | accepted → Hired + joining_on; declined → Withdrawn “Declined the offer” |
| 422 | accepted without joining_on → “Add the joining date” |

---

## Interviewer-only client actions

Allowed by RBAC catalog: **`review_assessment`**, **`record_feedback`** on own rows.  
All other hiring actions → **403** (T4).

---

## Generated CRUD (not this controller)

| Entity | Base path (typical) | Recruiter | Interviewer | Public | Delete |
|--------|---------------------|-----------|-------------|--------|--------|
| team_member | `/vulcan/team_member` | list/view/create/update | view own | — | **off** (T22) |
| job_opening | `/vulcan/job_opening` | CRUD- | list/view | view Open (via hiring openings/apply) | off |
| job_candidate | `/vulcan/job_candidate` | CRUD- | list/view assigned | create via apply only | off |
| job_assessment | `/vulcan/job_assessment` | CRUD- | list/view where reviewer=self | — | off |
| job_interview | `/vulcan/job_interview` | CRUD- | list/view where interviewer=self | — | off |

Protected list/get/create/update enforce `resolveFilter` / `assertRow` (APOL-03). Empty membership → empty list, not unrestricted.

---

## Auth / roles (outside hiring package)

| Endpoint | Notes |
|----------|--------|
| `POST /auth/login` | T1/T2 — email + password (`Demo@1234` for seed users) |
| RBAC roles | Recruiter, Interviewer linked by team member email |
