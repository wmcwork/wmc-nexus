# Red, Blue and Purple modules

Design note for Milestone D. It reuses the existing engagement, task, finding,
traffic and evidence data instead of creating a second system of record.

## Goals

- One engagement workspace where an operator can plan, execute, evidence and
  report an authorized assessment.
- A defender view that maps the same activity to detections and coverage.
- A purple loop that measures whether a technique was actually detected, with
  reproducible evidence.
- Every gated action is approved, attributed and auditable.

## Non-goals

- A new scanner or exploitation engine. The platform orchestrates existing
  tools and skills.
- Replacing the client's SIEM. Blue ingests summaries and references.
- Storing raw customer data beyond the agreed evidence sample.

## Shared model

| Entity | Purpose |
| --- | --- |
| Engagement | Scope, owner, window, rules of engagement |
| Technique | ATT&CK id, tactic, test procedure, risk class |
| Run | One execution of a skill or technique against an asset |
| Detection | Rule/source reference, expected signal, owner |
| Validation | Run + detection + observed result + evidence |
| Finding | Weakness with severity, evidence and remediation |
| Approval | Who approved which gated action, when, and why |

All entities carry `engagement_id`; scope checks use the engagement record and
the existing scope-sentry logic.

## Roles

| Role | Capability |
| --- | --- |
| Viewer | Read findings, runs and reports for assigned engagements |
| Operator | Run read-only skills, create runs and evidence |
| Lead | Approve gated actions, change scope within an approved envelope |
| Admin | Manage users, integrations and retention |

Approvals are per action, not per role. A lead cannot approve their own
out-of-scope action.

## Red module

Routes: `/red`, `/red/engagements/[id]`, `/red/engagements/[id]/runs`.

- Engagement header: scope, window, contacts, stop control.
- Kill-chain board grouped by ATT&CK tactic; cards are techniques with status.
- Skill runner: pick an approved skill, asset, technique and impact budget;
  read-only runs start immediately, gated runs wait for approval.
- Findings and evidence link back to the run and the technique.
- Stop control records the time, actor and reason and blocks new runs.

## Blue module

Routes: `/blue`, `/blue/detections`, `/blue/alerts`.

- Log-source inventory with owner and health.
- Detection catalog mapped to techniques, with expected signal and severity.
- Alert triage queue; each alert can link to a red run for deconfliction.
- Coverage view: techniques with at least one healthy detection.

## Purple module

Routes: `/purple`, `/purple/matrix`.

- ATT&CK matrix colored by validation result: detected, missed, partial,
  not tested.
- Validation workflow: execute a technique in the lab, confirm the expected
  signal, attach evidence, record the result.
- Metrics: coverage percent, mean time to detect, false-positive rate, open
  gaps, trend by engagement.
- Export: matrix plus evidence index for the report.

## Audit and safety

- Every run, approval, scope change and export writes an audit record with
  actor, time, engagement, action and result.
- Gated actions require an approval record that references the run and the
  scope entry.
- A missing scope record blocks the run at the API layer, not only in the UI.
- Evidence is redacted by default; raw artefacts stay in the access-controlled
  store.

## Delivery phases

1. **P0 - read-only views.** Engagement workspace, runs, findings and technique
   mapping from existing data. No new execution paths.
2. **P1 - red runner.** Skill runner with approval gate and audit.
3. **P2 - blue catalog.** Detection inventory and technique mapping.
4. **P3 - purple validation.** Validation workflow and matrix.
5. **P4 - metrics and export.** Coverage, MTTD, false positives, report pack.

## Acceptance criteria

- A lab scenario runs end to end: scope, recon run, finding, detection,
  validation, report.
- Out-of-scope runs are rejected by the API and shown as blocked in the UI.
- Gated runs cannot start without an approval record.
- The purple matrix reflects validation records, not manual colouring.
- EN and TR copy is complete for every new route.
- Audit export contains every run and approval for the engagement.

## Open questions

- Should validations be scoped to a lab environment separate from production?
- Which SIEM/EDR integrations are required for v1, and which are CSV/JSON only?
- Is the kill-chain board per engagement or per task?
- Retention period for run output versus evidence samples.
