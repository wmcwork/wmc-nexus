# WMC NEXUS — completion roadmap

Status: living document. Updated 2026-11-22.

Derived from ARTEX (AGPL-3.0). All upstream notices and source-distribution
obligations apply. This roadmap tracks the work needed to turn the current tree
into a stable, professional release.

## Principles

- **Authorized use only.** Every offensive skill and module assumes a signed
  scope/authorization. Default posture is read-only recon; exploitation steps
  require explicit, per-engagement approval.
- **First-party content.** Third-party skills are not imported without a pinned
  commit, identified author, compatible license, notice preservation and a
  security review. Public standards (OWASP, MITRE, PTES, NIST) are referenced
  by link, not copied.
- **Evidence over claims.** A milestone is done only when its acceptance checks
  pass in a clean environment and the result is reproducible from the repo.
- **No secrets in the repo.** `.env`, keys, tokens and engagement data stay out
  of git.

## Milestone A — Branding and i18n foundation (done)

- WMC NEXUS branding and EN/TR locale infrastructure.
- Core screens localized (findings, assets, notifications, LLM records, 404,
  agents, commands, traffic, task detail/flows).
- Turkish Windows setup guide and README links.

## Milestone B — Full Turkish UI (done, pending manual smoke)

Acceptance criteria:

- No user-visible English literals remain in `web/src/app/**` and shared
  components, except technical acronyms and protocol values.
- All `t()` keys resolve; `en` and `tr` key sets are identical and duplicate-free.
- `npx tsc --noEmit` passes for touched files; Biome reports no new findings.
- Manual smoke check of every route in TR and EN.

Remaining after the current sweep: verify dashboard/chat/auth/system edge cases,
error toasts, empty states, aria labels and date/number formatting.

## Milestone C — Red Team skill catalog v1

Status: v1 authored on 2026-11-22, 11 first-party skills. Dry-runs and second-person review remain.

Goal: a curated, stable catalog of first-party skills that a professional
engagement can rely on.

v1 catalog (authored; each entry stays draft until reviewed and dry-run):

| Skill | Purpose | Default mode |
| --- | --- | --- |
| `engagement-scoping` | Rules of engagement, scope capture, exclusions, contacts | planning |
| `passive-recon` | OSINT, DNS, certificates, leaked credentials, attack surface | read-only |
| `active-recon` | Port/service discovery, fingerprinting, safe enumeration | read-only |
| `web-app-testing` | WSTG-aligned workflow, evidence capture, severity mapping | read-only, exploit gated |
| `api-testing` | Authz matrix, schema abuse, rate limits, data exposure | read-only, exploit gated |
| `auth-session-testing` | Login, MFA, session lifecycle, token handling | gated |
| `ad-enumeration` | Domain/forest enumeration, ACL and path analysis | read-only |
| `cloud-recon` | AWS/Azure/GCP read-only posture and identity review | read-only |
| `phishing-simulation` | Authorized campaign design, landing pages, reporting | gated |
| `c2-operations` | Operator workflow, check-ins, tasking, cleanup | gated |
| `evidence-and-reporting` | Reproducible evidence, CVSS, remediation, exec summary | always |
| `opsec-and-cleanup` | Logging, artefact control, deconfliction, teardown | always |

Each skill must include:

1. YAML frontmatter: `name`, `description`, `allowed-tools` (least privilege).
2. Scope and authorization gate.
3. Step-by-step workflow with verification after each phase.
4. Evidence format and where to store it.
5. Failure handling and stop conditions.
6. References (versioned links) and an original-content statement.
7. A dry-run test against a lab target or mock, recorded in the PR.

Acceptance criteria:

- Catalog page lists every skill with provenance and review status.
- A skill cannot be enabled for an engagement without a scope record.
- Dry-run evidence exists for each skill; no skill executes destructive actions
  by default.
- Security review checklist completed for every entry.

## Milestone D — Red / Blue / Purple modules

- Red: engagement workspace, kill-chain view, findings linkage, skill runner.
- Blue: detection coverage, log sources, alert triage, hardening checks.
- Purple: ATT&CK technique mapping, detection validation loop, metrics.
- Shared: RBAC, audit trail, approval gates for gated actions.

Acceptance criteria:

- Navigation, empty states and permissions work in EN and TR.
- Actions produce audit records; gated actions require approval.
- End-to-end lab scenario passes: scope → recon → finding → detection → report.

## Milestone E — Windows local distribution

- Clean Windows 11 VM: install Go/Node/PostgreSQL, build backend and web,
  initialize the first admin, start, log in, run a lab task.
- No Docker dependency; scripts are idempotent and fail with actionable errors.
- Documented rollback and upgrade path.

Acceptance criteria:

- The documented steps work on a clean machine without undocumented manual fixes.
- `windows-local-setup.tr.md` matches the tested flow exactly.
- Smoke test script exits 0 and records versions.

## Milestone F — Release readiness

- AGPL-3.0 compliance: source offer, notices, upstream attribution, no
  incompatible third-party content.
- Reproducible build, versioning, changelog, signed artefacts.
- CI: lint, typecheck, Go tests, web tests, licence scan.
- Publish to the project's own GitHub repository with release notes.

Acceptance criteria:

- Clean clone builds and passes CI.
- Licence and notice review recorded.
- Release artefact installs and runs on the supported platforms.

## Immediate next actions

1. Finish the current TR sweep and verify it.
2. Write the skill authoring template and review checklist.
3. Author the first three skills: engagement-scoping, passive-recon,
   evidence-and-reporting.
4. Add catalog provenance fields and an authorization gate.
