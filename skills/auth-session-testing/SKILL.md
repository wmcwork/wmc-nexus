---
name: auth-session-testing
description: "Use when assessing an authorized application's authentication, session lifecycle, credential recovery, MFA and single sign-on behaviour using provisioned test accounts."
allowed-tools: Read Write Bash(curl:*) Bash(jq:*)
---

# Authentication and session testing

Tests whether identities and sessions are established, carried and ended
correctly. The work is observational first: understand the intended lifecycle,
then look for places where the server trusts something it should not. All
actions use provisioned test accounts, and no real user is ever affected.

## Authorization gate

Do not start until these are recorded:

- an approved engagement scope record and the specific identity flows in scope;
- written permission for authentication testing, including lockout and MFA
  prompting;
- at least two provisioned test accounts, with roles and recovery addresses
  that belong to the engagement;
- the identity provider and any external SSO dependency named, with confirmation
  that testing it is permitted or excluded;
- the lockout policy and a safe attempt budget per account;
- the window, the technical contact and the emergency stop procedure.

If the only available accounts are real user accounts, stop. There is no safe
substitute for provisioned identities.

## Prohibited actions

- Testing against real accounts, real mailboxes or real phone numbers.
- Password guessing, spraying, stuffing, or any high-volume credential attempt.
- Phishing, social engineering, or collecting credentials from anyone.
- Stealing, borrowing or replaying another user's session token or cookie.
- Attempting to bypass a third-party identity provider's controls.
- Creating persistent accounts, backdoor credentials, or long-lived API tokens
  outside the agreed budget.
- Deleting or locking accounts that are not designated disposable.
- Recording secrets in plain text in notes, reports or chat.

## Preconditions

- Provisioned accounts, including at least one privileged and one unprivileged
  role where the application supports it.
- A private mailbox or inbox the engagement controls for recovery mail.
- A test phone number or authenticator seed issued for the engagement.
- The ability to clear cookies and storage between tests, or separate browser
  profiles.
- A recorded clock, since token lifetimes are measured against it.
- Knowledge of the lockout policy, so a test cannot lock a shared account.

## Workflow

### Phase 1 - Inventory the identity surface

1. List every entry point: login, logout, registration, recovery, MFA
   enrolment and reset, remember-me, API tokens, SSO start and callback.
2. Record methods, parameters and whether each is pre-auth or post-auth.
3. Note which flows cross a domain or provider boundary.

Verification: each flow is mapped to a route and an owner, and any flow the
client could not confirm is marked unknown rather than assumed.

### Phase 2 - Baseline the session lifecycle

1. Authenticate with a test account and capture the issued artefacts.
2. Record cookie attributes, token format and claims (names only, values
   redacted), issue time and stated lifetime.
3. Observe renewal, sliding expiry and idle timeout behaviour.
4. Record what the server returns on the first request after expiry.

Verification: the lifecycle is written down as a timeline with measured times,
and the timeline is reproducible on a second login.

### Phase 3 - Session establishment and fixation

1. Obtain a pre-authentication session, then authenticate and observe whether
   the identifier changes.
2. Check whether a pre-auth identifier remains valid after authentication.
3. Check whether identifiers are accepted from a different context than the one
   that issued them, such as a different path or scheme.

Verification: the result states whether rotation occurs at the authentication
boundary, with the before and after identifiers redacted but their difference
demonstrated by hash.

### Phase 4 - Logout and invalidation

1. Log out and replay the captured request; confirm server-side rejection.
2. Check other sessions of the same account after logout, after a password
   change, and after an MFA reset.
3. Check token revocation for API tokens and refresh tokens.
4. Check concurrent session limits and whether the oldest session is evicted.

Verification: each invalidation claim is backed by a replay attempt after the
trigger event, with the response recorded.

### Phase 5 - Transport and storage protections

1. Confirm Secure, HttpOnly, SameSite, path and domain scope on each cookie.
2. Confirm the session is not accepted over plain HTTP and that HSTS is set.
3. Check cache directives on authenticated responses.
4. Check whether tokens are exposed to script, to URLs, or to referrer headers.

Verification: every attribute finding cites a captured Set-Cookie or response
header, not a browser warning.

### Phase 6 - Credential recovery and MFA

1. Map the reset flow end to end with a controlled mailbox.
2. Check token entropy by inspection of format and length, single use, expiry,
   and binding to the account and to the request.
3. Check response uniformity so the flow does not reveal whether an account
   exists.
4. Check MFA enrolment, reset and recovery gating, and whether MFA can be
   removed without re-authentication.
5. Test rate limiting with a few attempts inside the agreed budget, never to the
   lockout threshold.

Verification: findings state the observed behaviour at each step, with counts
of attempts actually made, and no account is left locked.

### Phase 7 - Single sign-on and delegated authorization

1. Review the flow configuration: registered redirect targets, exact matching,
   state and nonce presence, PKCE for public clients.
2. Check token validation expectations: issuer, audience, signature algorithm
   handling, lifetime.
3. Check logout propagation to the provider and to other applications.
4. Review scope grants for excess privilege.

Verification: each observation is tied to a configuration value or a captured
redirect, and no authorization code or token is taken from another user.

### Phase 8 - Cross-session authorization checks

1. With two accounts, confirm whether a session from one role can reach the
   other role's authenticated functions.
2. Hand deeper object-level testing to `web-app-testing` under its own gates.

Verification: any boundary issue is proven with both sessions and both
responses, otherwise it stays an observation.

### Phase 9 - Retest and close

1. Re-run each confirmed issue after the fix.
2. Record the exact setup needed to reproduce it.
3. Mark one-shot tests, such as single-use token behaviour, as such.

Verification: the retest result is recorded per finding and matches the original
reproduction steps.

## Evidence

Record, per test: UTC time, account label (not the credential), flow step,
request, response, and the state of the session before and after. Store secrets
redacted, keep identifiers as salted hashes where a comparison must be shown,
and hold unredacted captures only in the access-controlled evidence store. Note
attempt counts against the agreed budget.

## Stop conditions

- A test would affect a real account, mailbox or phone number.
- An account approaches its lockout threshold, or a shared account is at risk.
- MFA prompts or recovery messages reach a real person.
- The identity provider returns errors that suggest impact on other tenants.
- A real credential or personal data set is encountered.
- The approval basis for a flow is unclear or the window has closed.

## Failure handling

- Account locked: stop that flow, notify the contact, and wait for an official
  unlock. Do not attempt to recover it yourself.
- Recovery mail delayed: record the delay, retry once after the documented
  interval, then mark the flow blocked.
- Token lifetime shorter than the test: reduce the test to a single request and
  record the constraint.
- Inconsistent responses across attempts: repeat a bounded number of times,
  record variance, and avoid concluding from a single sample.
- Provider or WAF throttling: back off, reduce attempts, and report the
  limitation rather than working around it.

## References

- OWASP WSTG v4.2, authentication and session management:
  <https://owasp.org/www-project-web-security-testing-guide/v42/>
- OWASP ASVS v4.0.3, chapters 2 and 3:
  <https://github.com/OWASP/ASVS/tree/v4.0.3>
- RFC 6265 (HTTP state management): <https://www.rfc-editor.org/rfc/rfc6265>
- RFC 6749 (OAuth 2.0): <https://www.rfc-editor.org/rfc/rfc6749>
- RFC 9700 (OAuth 2.0 security best current practice):
  <https://www.rfc-editor.org/rfc/rfc9700>
- RFC 7519 (JWT): <https://www.rfc-editor.org/rfc/rfc7519>

## Original content

Authored for WMC NEXUS. No third-party text reproduced.
