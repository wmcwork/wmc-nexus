---
name: active-recon
description: "Use when enumerating an authorized target's live hosts, services, web surface and content with direct traffic, after passive recon and before any exploitation."
allowed-tools: Read Write Bash(dig:*) Bash(curl:*) Bash(openssl:*) Bash(nmap:*) Bash(jq:*)
---

# Active reconnaissance

Sends traffic to the target to confirm and extend the passive inventory: which
hosts answer, which services listen, what the web tier exposes, and which paths
exist. Everything here is discovery. Exploitation, authentication bypass and
state changes belong to later skills and to their own approvals.

## Authorization gate

Do not send the first packet until all of the following are recorded:

- an approved engagement scope record from `engagement-scoping`, linked in the
  task;
- explicit written permission for active scanning, not only passive collection;
- the in-scope hostnames, IPs and CIDRs, with a documented ownership source for
  each;
- the testing window in UTC, including blackout periods;
- rate and concurrency limits agreed with the owner;
- the source egress addresses, shared with the client for deconfliction;
- a named technical contact and the emergency stop procedure.

If any item is missing, stop and request it. A previous engagement's scope does
not carry over, and an asset that merely looks related is not in scope.

## Preconditions

- Scope record reviewed within the last working day.
- Tool versions and wordlists recorded; prefer a list already approved for the
  engagement over an arbitrary download.
- Egress IP confirmed and stable for the duration of the run.
- A resolver choice agreed, typically the client's or a public resolver, never
  the target's authoritative servers for bulk queries.
- A scratch directory outside the repository for raw output.
- A dry run completed against a lab or mock target in the same tool versions.

## Workflow

Each phase ends with a verification step. Do not start the next phase until the
verification passes, and record the result in the run log.

### Phase 1 - Scope binding and resolution

1. Normalise every in-scope name to a canonical form.
2. Resolve names to addresses and map each address back to the scope record.
3. Identify CDN, WAF and anycast fronting from DNS, certificates and headers.
4. Separate origin addresses from edge addresses where the client provided both.

Verification: every address either appears in the scope record or is marked
third-party and excluded. No shared-hosting neighbour is queued for scanning.

### Phase 2 - Network and service discovery

1. Host discovery only within the declared ranges, at the agreed rate.
2. Port scan with modest timing and a documented port set; widen only on
   confirmed hosts.
3. Service and version detection on open ports; TLS parameters with
   `openssl s_client` where TLS is offered.
4. Record banners, certificate subjects and any protocol oddity.

Verification: the open-port set is internally consistent with the services the
client described. An unexpected service is reported, not probed further, and
the escalation contact decides whether it stays in scope.

### Phase 3 - HTTP surface mapping

1. Request each root and each known vhost, following redirects manually so the
   chain is visible.
2. Capture status, headers, cookies, body length and a body hash.
3. Collect `robots.txt`, `sitemap.xml`, `security.txt`, `.well-known`
   entries and default error pages.
4. Note technology hints only as hypotheses; confirm before recording.

Verification: every responding vhost is mapped to a scope entry, and each
technology claim is backed by at least one observed response artefact.

### Phase 4 - Content and path discovery

1. Enumerate with one documented wordlist and a fixed request rate.
2. Calibrate against soft 404 behaviour before trusting any hit.
3. Use HEAD where the body is irrelevant, and GET only for confirmed paths.
4. Stop at directory index level; do not mirror content.

Verification: the false positive rate is estimated from baseline sampling, and
every reported path was manually re-requested and produced a stable response.

### Phase 5 - Virtual hosts and name confirmation

1. Test Host header variation only against in-scope addresses.
2. Confirm candidate names from the passive inventory rather than guessing at
   scale.
3. Record which names share an address and which present distinct content.

Verification: each confirmed name resolves to an in-scope address and its
content difference from the default vhost is reproducible.

### Phase 6 - Authentication surface inventory

1. Locate login, registration, recovery, MFA and SSO entry points.
2. Record methods, parameters and visible flow steps without submitting
   credentials.
3. Note client-side validation and any pre-auth API the page calls.

Verification: the inventory lists entry points with methods and parameters, and
no credential was submitted. Testing of these flows is handed to
`auth-session-testing`.

### Phase 7 - Handoff package

1. Merge the active inventory with the passive baseline.
2. Produce counts by asset type and a change list since the last run.
3. List gaps, blocked areas and assumptions.

Verification: a second reviewer can reproduce the inventory from the recorded
commands, and the diff against the passive baseline is explained.

## Evidence

For each action capture: UTC timestamp, operator, exact command, target, source
address, raw response saved before analysis, and a SHA-256 of the artefact.
Store raw output in the access-controlled evidence directory, never in the
repository. Redact session cookies, tokens, personal data and any internal
hostname that is not needed to prove the point.

## Stop conditions

- A host resolves outside the scope record or into a shared platform.
- Response times or error rates indicate production impact.
- The client's defenders report an incident or ask for a pause.
- Sensitive personal data or credentials appear in a response; stop, redact,
  escalate.
- Rate limits are reached and the owner will not raise them.
- The window closes or the technical contact becomes unreachable.

## Failure handling

- Rate limited: back off exponentially with jitter, lower concurrency, and
  record the limit. Never rotate egress addresses to continue.
- DNS failure: retry once against a second agreed resolver, then record and move
  on.
- Wildcard responses: calibrate with random paths; if calibration is
  inconclusive, mark results as unreliable instead of reporting them.
- Tool crash or timeout: record it, retry at most twice with reduced scope, then
  switch method or mark the area uncovered.
- Any sign of impact: stop the current phase, notify the contact, and do not
  resume without written approval.

## References

- PTES intelligence gathering: <https://pentest-standard.org/>
- NIST SP 800-115: <https://csrc.nist.gov/pubs/sp/800/115/final>
- OWASP WSTG v4.2, information gathering: <https://owasp.org/www-project-web-security-testing-guide/v42/>
- MITRE ATT&CK v14, reconnaissance: <https://attack.mitre.org/versions/v14/tactics/TA0043/>
- RFC 8446 (TLS 1.3): <https://www.rfc-editor.org/rfc/rfc8446>

## Original content

Authored for WMC NEXUS. No third-party text reproduced.
