---
name: c2-operations
description: "Use when standing up and operating an authorized command-and-control capability for a red-team exercise, covering scoping, owned infrastructure, logging, deconfliction, evidence and teardown."
allowed-tools: Read Write Bash(dig:*) Bash(openssl:*)
---

# C2 operations

Plans and runs a command-and-control tier for an authorized red-team exercise.
The work is infrastructure ownership, scoping, logging, and control, not
malware development. Every session must trace to an in-scope host and to a
written approval for that phase of the exercise.

## Authorization gate

Do not provision, register, configure, or connect anything until the
engagement workspace holds all of the following:

- written authorization that names command-and-control activity and the
  testing window;
- an approved asset list with every host, domain, and CIDR that may call back
  or be accessed;
- a named exercise owner and a stop contact reachable for the full window;
- an approved infrastructure owner, cloud account, and payment route for every
  domain and server;
- agreed data limits: what may be collected, what must never be collected, and
  the retention period;
- written deconfliction with the defending team, including how exercise
  traffic is identified and who declares an incident;
- a tested kill switch and a teardown plan approved by the owner.

If any item is missing, stop and report the gap. A live target without a
deconflicted defender is not an authorized exercise.

## Preconditions

- A framework is selected from the approved list and pinned to a version.
  Commercial platforms and maintained open-source frameworks are acceptable;
  unmaintained or repackaged builds are not.
- Every domain and server is owned by the engagement, with expiry dates and
  renewal owners recorded.
- Operator access uses individual accounts, MFA, and an out-of-band management
  path separate from the C2 channel.
- A logging sink exists outside the C2 server, with time synchronization.
- Certificates are issued for engagement-owned names and tracked to expiry.
- The team has a written check-in cadence, a kill date, and a rotation plan
  for any long-running listener.
- The lab has at least one disposable host for the dry run.

## Workflow

1. **Freeze the scope and the call-back plan.** Record every approved target,
   the allowed source ranges, the listener inventory, and the check-in
   schedule. Map each planned listener to a purpose and an owner.
   Verify: every listener and target appears on the approved asset list, and
   the owner signs the inventory before provisioning starts.

2. **Design the tiering.** Separate operator access, team server, redirectors,
   and egress. Define which tier terminates TLS, where logs are written, and
   how the kill switch reaches every component. Keep management plane and
   payload plane on different paths.
   Verify: a diagram and an asset table exist, each host has one stated
   purpose, and no single component is both the only log store and the only
   access path.

3. **Provision owned infrastructure.** Register domains through the approved
   account, create servers in the approved tenancy, and configure DNS with
   explicit records. Apply provider MFA, restrict management access by source,
   disable password login, patch the base image, and enable host firewalls.
   Verify: WHOIS and DNS match the engagement records, only intended ports are
   reachable from the internet, and default accounts are removed. Confirm
   certificate validity with `openssl s_client`.

4. **Configure the framework within policy.** Set the listener addresses,
   check-in interval, jitter, kill date, and logging destinations. Do not
   enable features that exceed the approved technique list. Export the
   configuration and hash it.
   Verify: a second operator reviews the configuration against the approval,
   the hash is recorded, and the kill date is earlier than the domain and
   certificate expiry.

5. **Instrument logging and deconfliction.** Ship framework logs, auth logs,
   DNS logs, and proxy logs to the external sink. Confirm timestamps use UTC.
   Share the exercise identifiers with the defending team through the agreed
   channel and test their alert path with a benign event.
   Verify: a synthetic event appears in the sink and the defender confirms
   receipt. A log gap is a blocker, not a note.

6. **Dry run in the lab.** Start one listener, connect one disposable lab host
   with a benign check-in, and perform no post-exploitation. Exercise the kill
   switch and confirm the callback stops.
   Verify: the session appears in the console, the event correlates across
   logs, the kill switch stops the callback within the agreed time, and the
   lab host is removed from the inventory.

7. **Operate inside the window.** Before each host action, confirm the host is
   on the approved list and the action is on the approved technique list. Prefer
   read-only collection. Record the operator, host, action, timestamp, and
   result for every task. Keep at least two operators reachable during active
   hours.
   Verify: at every shift handover the active session list reconciles with the
   scope record, and every recorded action has an approval reference where one
   is required.

8. **Capture evidence and hand over.** Export session logs, task history, and
   relevant screenshots. Redact secrets, tokens, and personal data. Hash each
   artifact and record the chain of custody.
   Verify: the evidence index lists every file with a hash, a reviewer confirms
   redaction, and the client receives only the agreed artifacts.

9. **Tear down.** Kill all sessions, revoke certificates, remove DNS records,
   destroy servers, release or park domains, and close provider accounts that
   were created only for the exercise.
   Verify: no callback arrives during the agreed observation period, DNS
   returns no engagement records, providers confirm deletion, and the owner
   signs the teardown record.

## Evidence

| Artifact | Content | Handling |
| --- | --- | --- |
| Scope and approval | Assets, techniques, window, contacts | Engagement store |
| Asset table | Domain, provider, purpose, owner, expiry | Versioned, access controlled |
| Listener inventory | Address, port, tier, certificate, owner | Hash and store |
| Configuration export | Framework settings and hash | Store, no secrets in clear |
| Deconfliction record | Identifiers shared and defender acknowledgement | Store with timestamp |
| Session and task log | Operator, host, action, UTC time, result | External sink, append only |
| Kill-switch test | Time to stop, observer | Recorded before operations |
| Evidence index | File, hash, description, custodian | Chain of custody |
| Teardown record | Components destroyed, confirmations | Signed by owner |

Store logs outside the C2 host. Never place credentials, tokens, or captured
personal data in the evidence set. Session identifiers and internal addresses
are redacted in the client report unless the client explicitly needs them.

## Stop conditions

- A callback arrives from a host that is not on the approved list: block it,
  do not task it, and notify the owner.
- Real credentials or personal data appear in a session: stop collection,
  redact, report, and do not use the material.
- A defender declares a live incident, or deconfliction fails.
- The client's infrastructure shows instability that correlates with exercise
  traffic.
- A provider, registrar, or abuse desk reports the infrastructure as malicious.
- Law enforcement, legal, or media contact occurs.
- The kill switch fails, the logging sink is unavailable, or operator access
  is lost.
- The owner pauses or withdraws authorization.

Escalate to the exercise owner and the client stop contact in parallel. Keep
the evidence intact. Do not delete logs, rotate infrastructure, or attempt to
argue with a provider while an incident is open.

## Failure handling

- Redirector or listener down: fail closed. Do not add an unapproved fallback
  channel or a new domain.
- Certificate expiry or mismatch: rotate before the next check-in window and
  record the change. Never disable verification.
- Log gap or clock drift: pause operations until the sink is healthy and time
  is synchronized.
- Session loss on an in-scope host: re-establish only through an approved
  listener, and only after confirming the host is still in scope.
- Framework defect or crash: snapshot the state, preserve logs, and report.
  Do not patch production infrastructure mid-exercise without approval.
- Provider suspension: stop, notify the owner, and follow the teardown plan
  rather than opening replacement infrastructure.
- Do not repeat a failed action more than twice without changing approach and
  recording why.

## References

- MITRE ATT&CK TA0011, Command and Control (v18):
  <https://attack.mitre.org/versions/v18/tactics/TA0011/>
- MITRE ATT&CK T1071, Application Layer Protocol (v18):
  <https://attack.mitre.org/versions/v18/techniques/T1071/>
- MITRE ATT&CK T1090, Proxy (v18):
  <https://attack.mitre.org/versions/v18/techniques/T1090/>
- MITRE ATT&CK T1573, Encrypted Channel (v18):
  <https://attack.mitre.org/versions/v18/techniques/T1573/>
- NIST SP 800-115, Technical Guide to Information Security Testing and
  Assessment: <https://csrc.nist.gov/pubs/sp/800/115/final>
- PTES 1.0, Penetration Testing Execution Standard: <https://pentest-standard.org/>
- RFC 8446, TLS 1.3: <https://www.rfc-editor.org/rfc/rfc8446>

## Original content

Authored for WMC NEXUS. No third-party text reproduced.
