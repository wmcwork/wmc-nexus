---
name: evidence-and-reporting
description: "Use when recording, preserving or reporting engagement evidence: reproducible steps, redaction, severity scoring, remediation guidance and executive summary."
allowed-tools: Read Write
---

# Evidence and reporting

Makes every claim reproducible and every artefact safe to share. This skill is
always allowed, including during passive and read-only phases.

## Prohibited actions

- No alteration of raw evidence; hash it before analysis.
- No unredacted secrets, credentials, or personal data in a report.
- No out-of-scope data in evidence or findings.
- No unreproducible or speculative finding presented as confirmed.
- No sharing outside the approved recipients.
- No deletion of originals before the retention period ends.

## Evidence package

Create one directory per engagement and one subdirectory per finding:

```
<engagement>/
  scope.md
  timeline.md
  findings/F-001/
    finding.md
    request.txt
    response.txt
    screenshot.png
    sha256.txt
```

For each action record:

- UTC timestamp, operator, target, and the exact command or request;
- raw output saved before analysis;
- SHA-256 of each artefact;
- the scope reference that authorized the action.

## Finding record

| Field | Content |
| --- | --- |
| ID | F-001, stable for the engagement |
| Title | Specific and actionable |
| Severity | CVSS vector and score; business impact in plain language |
| Assets | In-scope host/endpoint/account |
| Preconditions | Auth, network position, configuration |
| Reproduction | Numbered steps another operator can follow |
| Evidence | File references and hashes |
| Impact | What an attacker gains; data/availability/integrity |
| Remediation | Concrete fix, priority, verification step |
| References | CWE, OWASP, vendor advisory |

## Redaction

Remove or mask before sharing:

- passwords, tokens, session cookies, API keys;
- personal data not needed to prove the issue;
- internal hostnames and third-party data outside scope;
- customer content beyond the minimum proof.

Record that redaction happened and keep the unredacted original in the
access-controlled evidence store.

## Report structure

1. Executive summary: scope, dates, overall risk, top findings.
2. Methodology: standards used and phases performed.
3. Findings: ordered by severity, each with the record above.
4. Remediation roadmap: quick wins, structural fixes, verification.
5. Appendices: scope, timeline, tool versions, evidence index.

## Verification before delivery

- Every finding has reproducible steps and at least one artefact.
- Severity scores match the stated impact.
- Redaction checklist completed by a second reviewer.
- No secrets or out-of-scope data remain in the report.
- The client can verify each fix with the provided steps.

## Stop conditions

- Evidence would require storing prohibited data.
- A finding cannot be reproduced; downgrade it to an observation.
- Redaction cannot be completed safely; escalate before delivery.

## References

- CVSS: <https://www.first.org/cvss/>
- CWE: <https://cwe.mitre.org/>
- OWASP WSTG reporting: <https://owasp.org/www-project-web-security-testing-guide/>

## Original content

Authored for WMC NEXUS. No third-party text reproduced.
