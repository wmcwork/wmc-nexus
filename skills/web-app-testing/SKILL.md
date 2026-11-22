---
name: web-app-testing
description: "Use when testing an authorized web application for configuration, access control, input handling and business logic weaknesses with a live test account and an agreed impact budget."
allowed-tools: Read Write Bash(curl:*) Bash(jq:*) Bash(playwright:*)
---

# Web application testing

Structured, evidence-first testing of a running web application. The skill
assumes active reconnaissance is complete and a map of routes, parameters and
roles exists. Confirm weaknesses one at a time, prove them with the smallest
safe action, and never leave the application in a changed state.

## Authorization gate

Do not begin until the following are recorded and acknowledged:

- an approved engagement scope record, linked in the task;
- the specific application, environment and base URL, including whether it is
  production, staging or a dedicated test instance;
- test accounts provisioned for the engagement, with their roles written down;
- written permission for state-changing tests, if any are planned;
- the impact budget: request rate, data volume, and which records may be
  created or modified;
- the testing window and the deconfliction contact.

If test accounts are not available, testing is limited to unauthenticated
surface review and must be reported as such.

## Preconditions

- Route and parameter map from `api-recon` or `active-recon`, with confidence
  notes.
- At least two accounts with distinct roles when access control is in scope.
- A proxy or recorded browser session for replayable evidence.
- Clock synchronised, so timestamps in evidence line up with server logs.
- A scratch directory and a naming convention agreed before the first request.
- A lab run of the toolchain completed.

## Workflow

### Phase 1 - Map the application with a test account

1. Walk every reachable feature with the lowest-privilege account.
2. Record routes, methods, parameters, and the UI action that triggers each.
3. Note where the client and server appear to disagree about validation.
4. Build a feature list ordered by business value.

Verification: every feature in the client's description is either mapped or
explicitly listed as unreachable, with the reason.

### Phase 2 - Baseline behaviour

1. Capture normal requests and responses for each feature.
2. Record status codes, headers, body shape and timing.
3. Save the baseline for later diffing.

Verification: a replay of the baseline reproduces the same status and body shape
from a clean session.

### Phase 3 - Configuration and transport review

1. Review security headers, cache directives, CORS policy and cookie
   attributes.
2. Check TLS configuration and HTTP to HTTPS enforcement.
3. Review exposed files, default pages, directory behaviour and verbose errors.
4. Note HTTP methods the server accepts where the application does not need
   them.

Verification: each finding cites an observed response, and each header claim is
checked on more than one route.

### Phase 4 - Authentication and session handoff

1. Confirm the login, recovery, MFA and logout flows exist as mapped.
2. Hand detailed session and credential-flow testing to
   `auth-session-testing`.
3. Record only the entry points and the observed protections here.

Verification: the handoff note lists each flow and what remains untested.

### Phase 5 - Access control

1. With two accounts, replay account A's requests using account B's session.
2. Test horizontal boundaries on objects, then vertical boundaries on
   functions.
3. Change one variable at a time and diff the response against the baseline.
4. Treat a difference as a lead, not a finding, until the boundary is proven
   with a second pair of accounts or a second object.

Verification: every access control finding includes both sessions, both
responses, and a statement of which boundary was crossed. Unproven differences
are recorded as observations.

### Phase 6 - Input handling

Methodology only; use the least invasive probe that answers the question.

1. Identify reflection points and encoding context with a benign unique marker.
2. Observe error behaviour for type and length confusion, using malformed but
   non-destructive input.
3. For injection classes, confirm with a lab-validated technique on a disposable
   parameter, and stop at proof of execution. Do not extract data beyond the
   minimum.
4. Test file handling with a harmless file type first, and only in an upload area
   designated for testing.
5. Check server-side request handling by pointing a URL parameter at a
   controlled listener you own.

Verification: each confirmed issue has a request, a response, and a control
request showing the behaviour is caused by the input and not by the baseline.

### Phase 7 - Business logic

1. Walk each multi-step flow out of order, repeated, and with boundary values.
2. Test quantity, price, coupon and state transitions on disposable records.
3. Check whether server-side checks repeat the client-side ones.
4. Stop before any step that would move real money or notify a real person.

Verification: the logic flaw is demonstrated with a complete before and after
state on a designated test record, and the record is restored or abandoned per
the impact budget.

### Phase 8 - Client-side review

1. Inspect delivered JavaScript for secrets, hidden routes and trust decisions.
2. Check postMessage handlers, storage of sensitive values, and DOM sinks that
   accept attacker-controlled data.
3. Confirm each client-side issue has a server-side consequence before rating
   it.

Verification: every client-side finding states the server behaviour that makes
it exploitable, or is downgraded to hardening advice.

### Phase 9 - Gated confirmation

Any test that changes state beyond disposable records, affects availability, or
touches another user requires a separate written approval naming the exact
action. Record the approval reference in the evidence package before running it.

Verification: the approval reference exists and matches the action performed.

### Phase 10 - Reporting handoff

1. Package each finding per `evidence-and-reporting`.
2. Include retest steps that a developer can follow without the test tooling.
3. List untested areas and why.

Verification: a reviewer can reproduce the top findings from the package alone.

## Evidence

Per finding: exact request and response, both sessions where relevant, UTC
timestamps, the account used, and the scope reference. Store HTTP artefacts as
text plus a hash. Screenshots only where the UI state matters. Redact cookies,
tokens, personal data and third-party content by default; keep unredacted
originals only in the access-controlled store.

## Stop conditions

- A test would touch real user data or a non-designated record.
- The application shows degradation, error spikes or queue backlogs.
- The client reports that defenders or customers noticed the test.
- A credential, key or personal data set is encountered outside the test
  accounts.
- The impact budget or window is exhausted.
- A required approval is missing or ambiguous.

## Failure handling

- Session expiry mid-test: re-authenticate with the provisioned account and
  re-baseline before continuing; do not reuse stale evidence.
- Inconsistent responses: repeat three times with delays and record variance
  before drawing a conclusion.
- WAF blocking: slow down, narrow the probe, and report the block; do not tune
  payloads to evade it.
- Tool failure: record the version and error, retry once, then switch method.
- A test causes an unintended change: stop, record the state, notify the
  contact, and follow their restoration instruction.

## References

- OWASP WSTG v4.2: <https://owasp.org/www-project-web-security-testing-guide/v42/>
- OWASP ASVS v4.0.3: <https://github.com/OWASP/ASVS/tree/v4.0.3>
- OWASP Top 10 2021: <https://owasp.org/Top10/>
- NIST SP 800-115: <https://csrc.nist.gov/pubs/sp/800/115/final>
- RFC 9110 (HTTP semantics): <https://www.rfc-editor.org/rfc/rfc9110>

## Original content

Authored for WMC NEXUS. No third-party text reproduced.
