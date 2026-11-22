---
name: engagement-scoping
description: "Use when opening a new security engagement or reviewing an existing one: record scope, rules of engagement, exclusions, contacts, data handling and stop conditions before active testing."
allowed-tools: Read Write
---

# Engagement scoping

Turns an informal request into a bounded, auditable engagement. The scope
record is written first, then testing starts.

## Scope record

Record these fields in the engagement workspace:

| Field | Content |
| --- | --- |
| Engagement | Name, client, ticket/contract reference |
| Owner | Name, role, contact |
| Scope basis | Document reference and date |
| Window | Start/end in UTC, blackout periods |
| In scope | Domains, IPs, CIDRs, applications, accounts, environments |
| Exclusions | Explicit exclusions and third-party dependencies |
| Techniques | Passive, read-only, active, state-changing |
| Impact limits | Rate limits, maintenance windows, data handling |
| Data class | Categories of data the engagement touches |
| Contacts | Technical, escalation, emergency, legal |
| Deconfliction | How test traffic is identified to defenders |
| Evidence | Storage location, access list, retention period |

## Workflow

1. **Collect** the fields above from the owner rather than from asset names or
   previous engagements.
2. **Validate** that every asset belongs to the owner. Prefer a documented
   ownership source (DNS, certificate, cloud account, written confirmation).
3. **Classify** each planned technique:
   - *passive*: third-party sources only, no target traffic;
   - *read-only*: safe requests that leave state unchanged;
   - *active*: direct requests that exercise the application;
   - *state-changing*: requests that modify data or configuration.
4. **Agree** on the stop phrase and the escalation tree.
5. **Publish** the scope record in the engagement workspace and link it from
   every task.
6. **Brief** operators and confirm they can see the current record.

## Verification after scoping

- Every in-scope asset maps to a documented entry from the owner.
- The window and time zone are unambiguous.
- Contacts have been reached at least once.
- The stop procedure is understood by every operator.
- The record is versioned, with a change history.

## References

- PTES pre-engagement interactions: <https://pentest-standard.org/>
- NIST SP 800-115: <https://csrc.nist.gov/pubs/sp/800/115/final>
- OWASP WSTG (testing framework): <https://owasp.org/www-project-web-security-testing-guide/>

## Original content

Authored for WMC NEXUS. No third-party text reproduced.
