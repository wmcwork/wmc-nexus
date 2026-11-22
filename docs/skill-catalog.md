# Skill catalog

Status as of 2026-11-22. All entries are first-party or inherited from the
ARTEX upstream (AGPL-3.0); no third-party skill content has been imported.
Review status is independent of whether a file exists.

Legend: **risk** = read-only / gated / offensive. **status** = shipped
(inherited, usable), draft (needs second-person review and a lab dry-run),
approved (reviewed for this release).

| Skill | Purpose | Risk | Status | Provenance |
| --- | --- | --- | --- | --- |
| api-recon | Frontend/API surface discovery under scope | read-only | shipped | ARTEX upstream; modified 2026-11-22 |
| api-security | API authorization and data-exposure testing | gated | shipped | ARTEX upstream; modified 2026-11-22 |
| bbot-recon | Recursive recon with program-policy gates | read-only | shipped | ARTEX upstream; modified 2026-11-22 |
| codeaudit | Source review workflow | read-only | shipped | ARTEX upstream; modified 2026-11-22 |
| edr-bypass-re | EDR evasion research in a lab | offensive | shipped | ARTEX upstream; modified 2026-11-22 |
| patch-diff | Patch and diff analysis | read-only | shipped | ARTEX upstream; modified 2026-11-22 |
| php2shell | PHP code-path analysis in a lab | offensive | shipped | ARTEX upstream; modified 2026-11-22 |
| playwright-cli | Browser automation for authorized testing | gated | shipped | ARTEX upstream; modified 2026-11-22 |
| rea | Reverse-engineering analysis | read-only | shipped | ARTEX upstream; modified 2026-11-22 |
| scopesentry | Scope enforcement and validation | read-only | shipped | ARTEX upstream; modified 2026-11-22 |
| engagement-scoping | Scope, RoE and contacts | read-only | draft | first-party (2026-11-22) |
| passive-recon | External attack-surface mapping without target traffic | read-only | draft | first-party (2026-11-22) |
| evidence-and-reporting | Evidence, redaction, severity, reporting | read-only | draft | first-party (2026-11-22) |
| active-recon | Approved active discovery with rate limits | gated | draft | first-party (2026-11-22) |
| web-app-testing | WSTG-aligned web application testing | gated | draft | first-party (2026-11-22) |
| auth-session-testing | Authentication, MFA and session lifecycle | gated | draft | first-party (2026-11-22) |
| ad-enumeration | Domain and ACL path analysis | read-only | draft | first-party (2026-11-22) |
| cloud-recon | AWS/Azure/GCP read-only posture review | read-only | draft | first-party (2026-11-22) |
| phishing-simulation | Authorized campaign design and reporting | gated | draft | first-party (2026-11-22) |
| c2-operations | Operator workflow, logging and teardown | gated | draft | first-party (2026-11-22) |
| opsec-and-cleanup | Attribution, deconfliction, artefact cleanup | read-only | draft | first-party (2026-11-22) |

## Next wave

Designed but not yet authored. Each needs the same review and dry-run before
it appears above.

- `container-kubernetes-testing` - cluster and workload configuration review.
- `mobile-app-testing` - Android/iOS testing with provisioned builds.
- `purple-detection-validation` - ATT&CK mapping and detection checks.

## Review requirements

See `docs/skill-authoring.md`. A skill moves from draft to approved only after:

1. the frontmatter parses and the description is a clear trigger;
2. a second reviewer completes the checklist;
3. a dry-run in a disposable lab is recorded;

## Notes

- Inherited ARTEX skills have not been re-reviewed in this pass. They remain
  shipped, but a release review should assign an owner and date to each.
