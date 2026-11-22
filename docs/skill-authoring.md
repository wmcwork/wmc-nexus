# Skill authoring and review standard

Applies to every first-party Skill shipped with WMC NEXUS. The goal is a
catalog that is stable, auditable and safe to hand to a professional red team.

## 1. Ownership and licensing

- First-party Skills are original work authored for this repository and
  released under the project's AGPL-3.0 terms.
- Public standards (OWASP WSTG/ASVS, MITRE ATT&CK, PTES, NIST SP 800-115) are
  referenced by versioned link. Do not copy or closely paraphrase their text.
- Third-party content is not accepted unless it has a pinned upstream commit,
  an identified author, a compatible licence, preserved notices and a completed
  security review. Record it in `SOURCE.md` inside the skill directory.
- Never include credentials, customer data, internal hostnames or engagement
  artefacts in a Skill.

## 2. Required structure

```
skills/<skill-name>/
  SKILL.md          # required
  reference.md      # optional, loaded on demand
  scripts/          # optional, reviewed and deterministic
  SOURCE.md         # required only for third-party or adapted content
```

`SKILL.md` frontmatter:

```yaml
---
name: passive-recon
description: Use when mapping an authorized target's external attack surface without touching it.
allowed-tools: Bash(dig:*) Bash(whois:*) Read Write
---
```

- `name`: kebab-case, unique, matches the directory.
- `description`: one sentence, starts with "Use when ...", states the trigger.
- `allowed-tools`: the minimum set. No wildcard shells, no credential stores.

## 3. Required sections

1. **Authorization and scope** — what must be recorded before the first action
   (scope, window, contacts, exclusions, emergency stop).
2. **Preconditions** — access, tooling, environment, data handling.
3. **Workflow** — numbered phases. Each phase ends with a verification step.
4. **Evidence** — exactly what to capture, naming, storage and redaction.
5. **Stop conditions** — when to halt and escalate (out-of-scope host,
   production impact, detection, legal hold).
6. **Failure handling** — retries, fallbacks, what not to repeat.
7. **References** — versioned links to public standards.
8. **Original content statement** — "Authored for WMC NEXUS; no third-party
   text reproduced."

## 4. Safety rules

- Default to read-only. Any state-changing or exploitation step must be a
  separate, explicitly gated phase.
- No destructive payloads, persistence, credential dumping or data exfiltration
  in the default path.
- Respect rate limits and target availability; include backoff guidance.
- Redact secrets and personal data in evidence by default.
- Require an engagement scope record before a skill can run.

## 5. Review checklist

- [ ] Frontmatter valid; name matches directory; description is a clear trigger.
- [ ] Tool allowlist is least-privilege and sufficient.
- [ ] Authorization gate present and unambiguous.
- [ ] Every phase has a verification step.
- [ ] Evidence format defined and redaction covered.
- [ ] Stop conditions and escalation path defined.
- [ ] References are versioned links; no copied text.
- [ ] Original-content statement present.
- [ ] Dry-run completed against a lab/mock target and recorded.
- [ ] No secrets, customer data or internal identifiers.
- [ ] Reviewed by a second person; findings resolved.

## 6. Testing a Skill

1. Run the dry-run scenario in a disposable lab.
2. Confirm the skill stops at the authorization gate without a scope record.
3. Confirm gated phases require explicit approval.
4. Confirm evidence is produced in the documented format.
5. Record the run (date, target type, result, reviewer) in the PR.

## 7. Catalog metadata

Every catalog entry records:

- skill name, version, owner
- review status (draft / reviewed / approved)
- last review date and reviewer
- provenance (first-party or upstream URL + commit + licence)
- risk class (read-only / gated / destructive)
