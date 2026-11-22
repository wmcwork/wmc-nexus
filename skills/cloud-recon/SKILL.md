---
name: cloud-recon
description: "Use when reviewing the read-only security posture of an AWS, Azure, or Google Cloud estate: identity, network exposure, storage configuration, and logging coverage, without changing cloud state."
allowed-tools: Read Write Bash(aws:*) Bash(az:*) Bash(gcloud:*) Bash(jq:*)
---

# Cloud reconnaissance

Collects configuration facts from cloud control planes using read-only API
calls, then ranks exposure by internet reachability, privilege, and data
sensitivity. The work is describe and get-configuration reads of configuration
metadata.

## Preconditions

- Provider CLI version pinned and recorded, with a named profile per account.
- Credentials loaded from the vault into the CLI session rather than exported
  into shell history or committed files.
- A working directory per account under the engagement evidence tree.
- Command logging enabled for the session, so the review can prove every call
  was a read.
- Console access, if any, uses the same principals and is recorded.

## Workflow

### Phase 1: Prove identity

Resolve the calling principal and its account:

```
aws sts get-caller-identity
az account show
gcloud config list
```

Record the principal ARN or object ID, account or subscription or project ID,
and the policies attached to the role. Confirm that the attached policies are
read-only; if any allow writes, stop before continuing.

Verify: every resolved account ID appears in the scope record, and the policy
set contains no write action. Record the exact policy version reviewed.

### Phase 2: Inventory the estate

Enumerate organizations, folders or management groups, accounts,
subscriptions, projects, and enabled regions. Capture tags and labels that
identify environment and owner, because they drive later prioritisation.

Verify: the count of accounts and projects matches the record, or the
difference is explained in the record. Unlisted regions are recorded as not
reviewed rather than sampled silently.

### Phase 3: Review identity and access

Collect identity posture per account: root or global administrator state and
MFA, human and machine identities, access key age, cross-account trusts,
federation, and privileged role assignments. For each provider note the
equivalent of an organization-level guardrail and whether it is enforced.

Verify: each finding cites the resource identifier, the API response field,
and the collection time. Statements about MFA or key age come from the API
response, not from a console impression.

### Phase 4: Map network exposure

Collect security groups, network ACLs, firewall rules, load balancer
listeners, public addresses, peering, VPN, and transit connections. Build a
path list from internet-facing entry points to the subnets and services they
reach.

Verify: every public entry point has an owner tag or an explicit unknown
marker, and each path statement names the rule that permits it.

### Phase 5: Review data plane configuration

Record public access settings, bucket or container policies, encryption
configuration, key ownership, versioning, soft delete, and access logging.
Use describe and get-configuration calls only.

Verify: the call log for this phase contains no object read. Any call that
would return content is removed and noted as a gap.

### Phase 6: Check logging and detection coverage

Record whether control plane audit trails, configuration recorders, threat
detection services, and log export sinks are enabled, centralized, and
retained for the contract period. Note coverage gaps by account and region.

Verify: each control has an observed state and a source field; disabled or
missing controls are listed as gaps, not as failures to fix during the review.

### Phase 7: Prioritise and report

Map findings to a named benchmark version, then rank by internet exposure,
privilege required, and data sensitivity. Write the remediation owner and the
expected effort beside each item.

Verify: every finding maps to at least one benchmark control or to a
documented client requirement, and the report states what was not reviewed.

## Evidence

Store per account under `<engagement>/cloud/<provider>/<account-id>/<UTC
timestamp>/`. Keep raw JSON responses, the sanitized report, the command log,
and a manifest with SHA-256 hashes. Redact account aliases, email addresses,
and any secret value returned unexpectedly; a secret in output triggers the
stop conditions.

## Failure handling

- Access denied: record the gap and the missing permission, then continue with
  the next control.
- Throttling: exponential backoff with jitter, reduce page size, and spread
  calls across regions.
- Disabled or unsupported region: skip it and list it as not reviewed.
- CLI profile confusion: stop, re-resolve the identity, and restart the phase
  rather than mixing accounts in one output directory.
- Partial pagination: re-run the page rather than extrapolating counts.

## References

- AWS Well-Architected Framework, Security Pillar (2024 edition): <https://docs.aws.amazon.com/wellarchitected/latest/security-pillar/welcome.html>
- CIS Amazon Web Services Foundations Benchmark v3.0.0: <https://www.cisecurity.org/benchmark/amazon_web_services>
- CIS Microsoft Azure Foundations Benchmark v2.1.0: <https://www.cisecurity.org/benchmark/azure>
- CIS Google Cloud Platform Foundation Benchmark v3.0.0: <https://www.cisecurity.org/benchmark/google_cloud_computing_platform>
- NIST SP 800-115, Technical Guide to Information Security Testing: <https://csrc.nist.gov/pubs/sp/800/115/final>

## Original content

Authored for WMC NEXUS. No third-party text reproduced.
