---
name: phishing-simulation
description: "Use when planning or running an authorized phishing simulation that measures human reporting behaviour and mail-control resilience without capturing credentials or delivering malware."
allowed-tools: Read Write Bash(dig:*) Bash(openssl:*)
---

# Phishing simulation

Measures how people and mail controls respond to a realistic but benign lure.
The deliverable is aggregate behaviour and process findings, never an account,
a session, or a foothold. Every campaign runs on approved infrastructure,
against an approved recipient list, with a named owner who can stop it.

## Preconditions

- An approved simulation platform is available, with per-campaign metrics
  export and an immediate stop control.
- A dedicated simulation domain is registered and owned by the engagement,
  separate from the client's primary brand domain.
- SPF, DKIM, and DMARC are configured for that domain and aligned.
- The domain and sending IPs are allowlisted by the client mail team for the
  campaign window.
- A test mailbox set exists across the client's mail clients and mobile
  devices.
- Recipient data is held as pseudonymous identifiers, with the mapping stored
  separately under the engagement data rules.
- The operator has read the client policy on acceptable simulation content and
  the local privacy constraints.

## Workflow

1. **Build the campaign record.** Capture objective, success measures,
   recipient count, approved sender, approved domain, window, batch plan, stop
   contact, and data retention. Reconcile the recipient list against the
   approval and hash it.
   Verify: the record is versioned and signed off, the recipient count matches
   the approved count, and every exclusion is listed.

2. **Prepare mail authentication.** Check the simulation domain with
   `dig +short TXT`, the DKIM selector, and the DMARC record. Confirm the
   certificate chain and expiry with `openssl s_client`.
   Verify: SPF and DKIM align, DMARC is present, the certificate is valid for
   the full window, and the domain is not a lookalike of the client brand.

3. **Design the pretext at category level.** Agree the theme, sender display
   name, subject category, landing behaviour, and the exact fields collected
   (none beyond an optional non-sensitive acknowledgement). Do not write
   content that induces fear, impersonates authority, or references real
   events.
   Verify: the owner approves each element in writing, and the landing page is
   reviewed with no input fields other than the approved acknowledgement.

4. **Pilot in the lab.** Send to the test mailbox set only. Check rendering,
   link rewriting, quarantine behaviour, reporting-button handling, and mobile
   display.
   Verify: a pilot matrix is recorded per client and device, every defect is
   fixed, and no live recipient has been contacted.

5. **Execute in throttled waves.** Send approved batches with the agreed delay.
   Monitor delivery, bounce, complaint, click, and report counts. Keep the stop
   contact reachable for the whole window.
   Verify: sends equal the approved batch total, the rate stayed within limit,
   and no message reached a non-approved address.

6. **Triage responses without collecting secrets.** Treat a click or a form
   submission as an event, not an intrusion. If anyone submits real
   credentials, stop, notify the owner, and do not use or store them. Route
   confused employees to the agreed support desk.
   Verify: the event export contains only timestamps, pseudonymous IDs, and
   event types, with no free text or credential fields, and the row count
   reconciles with sends.

7. **Debrief and report.** Present aggregate metrics, control observations,
   and process gaps. Separate technical findings from people-related findings
   and avoid language that blames individuals or teams.
   Verify: the report is reviewed for re-identification risk, small groups are
   merged, and no individual is named.

8. **Close out.** Retire or park the simulation domain, remove allowlist
   entries with owner approval, and destroy or return the recipient mapping
   under the retention rule.
   Verify: the owner confirms in writing that infrastructure is retired and
   personal data is destroyed or returned.

## Evidence

| Artifact | Content | Handling |
| --- | --- | --- |
| Campaign record | Scope, approvals, window, batch plan | Engagement store, access list |
| Domain checks | SPF, DKIM, DMARC, certificate output | Store output, redact mailboxes |
| Pretext approval | Approved theme and landing description | Store with sign-off |
| Pilot matrix | Client, device, rendering, report button | No recipient identities |
| Metrics export | Counts by event type and batch | Aggregates, pseudonymous IDs |
| Debrief deck | Aggregate findings and recommendations | Reviewed before release |
| Close-out record | Domain, allowlist, data destruction | Signed by owner |

Name files with the engagement ID, campaign ID, and UTC date. Store the
recipient mapping separately from metrics, encrypt at rest, and never place
addresses or message bodies in the report. A recipient list is represented by
a hash and a count, not by its contents.

## Failure handling

- Rendering or link failures: fix in the pilot and resend only to test
  mailboxes; never resend to live recipients as a test.
- Domain reputation or blocklisting: pause and report. Do not rotate domains,
  change sending IPs, or alter authentication to evade a filter.
- Low response rate: record it as a result. Do not escalate pretext intensity
  without a new approval.
- Metrics mismatch: pause analysis and reconcile at the platform. Never hand
  edit an export.
- Platform outage: stop sending, record the last successful batch, and resume
  only after the owner confirms.
- Do not repeat a failed wave until the root cause is documented and the owner
  approves a revised plan.

## References

- NIST SP 800-115, Technical Guide to Information Security Testing and
  Assessment: <https://csrc.nist.gov/pubs/sp/800/115/final>
- MITRE ATT&CK T1566, Phishing (v18):
  <https://attack.mitre.org/versions/v18/techniques/T1566/>
- MITRE ATT&CK T1598, Phishing for Information (v18):
  <https://attack.mitre.org/versions/v18/techniques/T1598/>
- OWASP Web Security Testing Guide: <https://owasp.org/www-project-web-security-testing-guide/>
- RFC 7208, Sender Policy Framework: <https://www.rfc-editor.org/rfc/rfc7208>
- RFC 6376, DomainKeys Identified Mail: <https://www.rfc-editor.org/rfc/rfc6376>
- RFC 7489, DMARC: <https://www.rfc-editor.org/rfc/rfc7489>

## Original content

Authored for WMC NEXUS. No third-party text reproduced.
