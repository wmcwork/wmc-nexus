---
name: engagement-scoping
description: "Use when opening a new authorized security engagement or reviewing an existing one: record scope, rules of engagement, exclusions, contacts, data handling and stop conditions before any active testing."
allowed-tools: Read Write
---

# Engagement scoping

Turns an informal request into a bounded, auditable engagement. No active
testing starts until the scope record exists and the engagement owner has
acknowledged it.

## Authorization gate

Stop and ask for the missing item if any of these is absent:

- a signed statement of work, contract, or written authorization reference;
- a named engagement owner who can approve scope changes;
- a testing window with time zone;
- a list of in-scope assets;
- an emergency contact and stop procedure.

Verbal approval alone is not sufficient for production-impacting tests.

## Scope record

Record these fields in the engagement workspace:

| Field | Content |
| --- | --- |
| Engagement | Name, client, ticket/contract reference |
| Owner | Name, role, contact, approval channel |
| Authorization | Document reference and date |
| Window | Start/end in UTC, blackout periods |
| In scope | Domains, IPs, CIDRs, applications, accounts, environments |
| Out of scope | Explicit exclusions and third-party dependencies |
| Techniques | Allowed, gated, prohibited |
| Impact limits | Rate limits, maintenance windows, data handling |
| Data class | What may be accessed, stored or reported |
| Contacts | Technical, escalation, emergency, legal |
| Deconfliction | How test traffic is identified to defenders |
| Evidence | Storage location, access list, retention period |

## Workflow

1. **Collect** the fields above from the owner; do not infer scope from asset
   names or previous engagements.
2. **Validate** that every asset belongs to the owner. Prefer a documented
   ownership source (DNS, certificate, cloud account, written confirmation).
3. **Classify** each allowed technique:
   - *passive*: third-party sources only, no target traffic;
   - *read-only*: safe requests that do not change state;
   - *gated*: requires explicit approval per action;
   - *prohibited*: never run in this engagement.
4. **Agree** on the stop phrase and the escalation tree.
5. **Publish** the scope record in the engagement workspace and link it from
   every task.
6. **Brief** operators and confirm they can see the current record.

## Verification after scoping

- Every in-scope asset maps to an owner-approved entry.
- The window and time zone are unambiguous.
- Contacts have been reached at least once.
- The stop procedure is understood by every operator.
- The record is versioned; changes require owner approval.

## Stop conditions

- An asset cannot be tied to the owner.
- A test would touch an excluded or third-party system.
- Production impact exceeds the agreed limit.
- The owner cannot be reached during the window.
- Evidence handling would violate the data-class rules.

## References

- PTES pre-engagement interactions: <https://pentest-standard.org/>
- NIST SP 800-115: <https://csrc.nist.gov/pubs/sp/800/115/final>
- OWASP WSTG (testing framework): <https://owasp.org/www-project-web-security-testing-guide/>

## Original content

Authored for WMC NEXUS. No third-party text reproduced.
