# Skill catalog

Status as of 2026-11-22. All entries are first-party or inherited from the
ARTEX upstream (AGPL-3.0); no third-party skill content has been imported.
Review status is independent of whether a file exists.

Legend: **risk** = read-only / gated / offensive. **status** = shipped
(inherited, usable), draft (needs second-person review and a lab dry-run),
approved (reviewed for this release).

| Skill | Purpose | Risk | Status | Provenance |
| --- | --- | --- | --- | --- |
| api-recon | Frontend/API surface discovery under scope | read-only | shipped | ARTEX upstream |
| api-security | API authorization and data-exposure testing | gated | shipped | ARTEX upstream |
| bbot-recon | Recursive recon with program-policy gates | read-only | shipped | ARTEX upstream |
| codeaudit | Source review workflow | read-only | shipped | ARTEX upstream |
| edr-bypass-re | EDR evasion research in a lab | offensive | shipped | ARTEX upstream |
| patch-diff | Patch and diff analysis | read-only | shipped | ARTEX upstream |
| php2shell | PHP code-path analysis in a lab | offensive | shipped | ARTEX upstream |
| playwright-cli | Browser automation for authorized testing | gated | shipped | ARTEX upstream |
| rea | Reverse-engineering analysis | read-only | shipped | ARTEX upstream |
| scopesentry | Scope enforcement and validation | read-only | shipped | ARTEX upstream |
| engagement-scoping | Scope, RoE, contacts, stop conditions | read-only | draft | first-party (2026-11-22) |
| passive-recon | External attack-surface mapping without target traffic | read-only | draft | first-party (2026-11-22) |
| evidence-and-reporting | Evidence, redaction, severity, reporting | read-only | draft | first-party (2026-11-22) |

## Planned catalog

The following are designed but not yet authored. Each needs the same review
and dry-run before it appears above.

- `active-recon` - approved active discovery with rate limits.
- `web-app-testing` - WSTG-aligned workflow with gated exploitation.
- `auth-session-testing` - authentication, MFA and session lifecycle.
- `ad-enumeration` - domain and ACL path analysis, read-only.
- `cloud-recon` - AWS/Azure/GCP read-only posture review.
- `phishing-simulation` - authorized campaign design and reporting.
- `c2-operations` - operator workflow and teardown, gated.
- `opsec-and-cleanup` - logging, artefact control, deconfliction.

## Review requirements

See `docs/skill-authoring.md`. A skill moves from draft to approved only after:

1. the frontmatter parses and the description is a clear trigger;
2. a second reviewer completes the checklist;
3. a dry-run in a disposable lab is recorded;
4. the authorization gate is proven to block without a scope record.

## Notes

- Inherited ARTEX skills have not been re-reviewed in this pass. They remain
  shipped, but a release review should assign an owner and date to each.
