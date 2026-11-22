---
name: opsec-and-cleanup
description: "Use when running or closing an authorized engagement that needs attribution, deconfliction with defenders, a recorded artefact inventory, and verified removal of every change made, without touching logs or client data."
allowed-tools: Read Write Bash(sha256sum:*) Bash(stat:*) Bash(date:*)
---

# Operational security and cleanup

Keeps an authorized engagement attributable, observable by the client, and
reversible. OPSEC here means controlling your own footprint so defenders can
recognise it and the report can explain it, not hiding from detection. Cleanup
means returning the environment to its recorded baseline and proving it.

Log tampering, agent disabling, timestomping, and history clearing are
anti-forensic actions and are prohibited outright. They destroy the evidence
the client paid for and are outside any acceptable rules of engagement.

## Preconditions

- A change log exists before the first change, with fields for time, operator,
  target, action, approval, and rollback.
- A baseline capture is stored for every object class that testing may touch.
- Evidence storage is encrypted and access is limited to the named team.
- The team knows which controls are expected to alert, so an alert is treated
  as expected unless it is not.
- A communication channel is agreed for stop and recall messages.

## Workflow

### Phase 1: Plan the footprint

Write down the source addresses, user agents, account names, resource names,
and file naming convention that will identify the team. Send the plan to the
deconfliction contact and record the acknowledgement.

Verify: the acknowledgement is stored, and every identifier in the plan sits
inside the scope record. Any identifier that cannot be explained to a defender
is redesigned before use.

### Phase 2: Capture the baseline

For each area that may change, record the current state before touching it:
accounts and group membership, DNS records, firewall rules, scheduled tasks,
services, cloud resources, and file locations used for uploads. Hash the
baseline exports.

Verify: the baseline covers every planned change target, and the engagement
owner has signed off on the restore expectations. A target without a baseline
cannot be changed.

### Phase 3: Control every change

Log each state change before executing it, including the exact rollback step
and the approver. Keep the log append-only during the engagement. Batch related
changes so rollback is a single ordered operation.

Verify: every executed change has a matching log entry with an approver and a
tested rollback. Changes without an entry are reverted immediately.

### Phase 4: Review the observed footprint

Read only, confirm what the defenders saw: which alerts fired, which log
sources captured the activity, and whether the deconfliction code appeared.
Collect the defender view as an evidence artefact for the report.

Verify: the control coverage table lists each expected detection, its observed
state, and the log source. Gaps become report findings, not reasons to test
the controls harder.

### Phase 5: Tear down in reverse order

Remove what the engagement created, newest first: uploaded files, scheduled
tasks, services, accounts and group memberships, keys and tokens, DNS records,
firewall rules, and cloud resources. Use the change log as the checklist, not
memory. Where a change altered an existing object, restore the baseline value
rather than deleting the object.

Verify: re-run the phase 2 queries and diff against the baseline. Every
difference is either zero or explained in the change log. Absence is shown by
the same query that showed presence.

### Phase 6: Seal evidence and return data

Hash the final evidence package, record the manifest, and hand it over through
the agreed channel. Return or destroy client data copies according to the
contract, and record the destruction method, date, and witness.

Verify: the manifest hash matches the delivered package, the data inventory
shows no unreturned copies, and the destruction record is signed.

### Phase 7: Close out

Deliver a residual risk list, the detection improvements observed, the final
baseline diff, and a statement of any change that could not be fully reverted.
Schedule the post-engagement review while the team still has context.

Verify: the owner accepts the close-out, and the change log, baseline diff,
and evidence manifest are linked from the engagement record.

## Evidence

Store under `<engagement>/opsec/<UTC timestamp>/`. Keep the change log,
baseline exports and hashes, deconfliction acknowledgements, the detection
coverage table, and the final diff. Hash each artefact with SHA-256 at creation
and again at handover. Redact credentials and personal data, and never place a
recovered secret in the change log; reference the vault entry instead.

## Failure handling

- Rollback fails: stop testing, escalate to the owner, and document the exact
  state rather than attempting improvised repairs.
- Baseline drift from unrelated change: capture the new state, attribute it,
  and exclude it from the restore diff with the owner's approval.
- Lost log entry: reconstruct from shell history and timestamps, mark it
  reconstructed, and have the owner countersign.
- Deconfliction channel down: pause state-changing work and use the emergency
  contact; never continue silently.
- Destruction cannot be completed: record the retained copies and the reason,
  and escalate to legal or the owner.

## References

- NIST SP 800-115, Technical Guide to Information Security Testing: <https://csrc.nist.gov/pubs/sp/800/115/final>
- NIST SP 800-92, Guide to Computer Security Log Management: <https://csrc.nist.gov/pubs/sp/800/92/final>
- PTES, Pre-engagement Interactions: <https://pentest-standard.org/>
- MITRE ATT&CK v15, T1070 Indicator Removal (defensive reading): <https://attack.mitre.org/versions/v15/techniques/T1070/>

## Original content

Authored for WMC NEXUS. No third-party text reproduced.
