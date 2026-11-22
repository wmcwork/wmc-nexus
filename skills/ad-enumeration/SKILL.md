---
name: ad-enumeration
description: "Use when mapping an authorized Active Directory domain without changing it: forest and trust layout, directory objects, privileged group nesting, delegation settings, and ACL paths toward Tier-0 assets."
allowed-tools: Read Write Bash(ldapsearch:*) Bash(bloodhound-python:*) Bash(dig:*) Bash(jq:*)
---

# Active Directory enumeration

Builds a defensible picture of an AD forest from directory reads alone. Every
phase here is read-only. Anything that authenticates as another principal,
modifies an object, or recovers secret material is out of scope and needs a
separately gated approval with its own written scope entry.

## Authorization gate

Do not begin until the engagement record contains all of:

- domain and forest names, plus the domain controllers to query;
- the low-privilege identity issued for collection, referenced by vault path,
  never by password;
- the approved window, time zone, and query budget per hour;
- written confirmation that LDAP enumeration and BloodHound-style collection
  are permitted;
- a named blue-team contact and a deconfliction procedure.

If the record names only a parent company or brand, resolve the exact domains
with the owner before the first query. A domain that appears in DNS but not in
the record is out of scope, even if a trust points at it.

## Preconditions

- Collector version pinned and recorded; note the exact version of every
  collector used.
- Output written to the engagement evidence directory on encrypted storage.
- DNS resolution pointed at the in-scope domain controller.
- Bind material read from the vault into a protected file at run time, never
  placed on a command line or in shell history.
- A note of whether the issued identity is a plain user or holds elevated
  rights; this changes what the collector can see and belongs in limitations.

## Prohibited actions

- Password guessing, spraying, or any authentication attempt that could lock
  an account.
- Requesting or cracking Kerberos service tickets (Kerberoast, AS-REP roast).
- DCSync, NTDS.dit copies, registry hive, LSA or SAM extraction.
- Reading LAPS passwords, gMSA managed passwords, or any attribute whose value
  is a secret.
- Creating, modifying, or deleting objects, ACLs, GPO links, or group
  memberships.
- SMB relay, name resolution poisoning, or authentication coercion.
- Querying naming contexts, trusts, or domains outside the approved record.
- Retrying a failed bind more than once.

## Workflow

### Phase 1: Confirm directory identity

Read the rootDSE and the domain object:

```
ldapsearch -H ldap://<dc> -D <bind-dn> -y <vault-file> -b "" -s base \
  "(objectClass=*)" defaultNamingContext rootDomainNamingContext \
  configurationNamingContext
```

Record the DNS domain, NetBIOS name, domain SID, and functional levels.

Verify: rootDomainNamingContext and the domain SID match the engagement
record. On any mismatch, stop.

### Phase 2: Map trusts and reachable domains

Query `_ldap._tcp.dc._msdcs` SRV records and the trustedDomain objects under
the System container. Record direction, transitivity, and SID filtering state
as reported by the directory.

Verify: every domain named by a trust is either in the record or explicitly
marked third-party and excluded from later phases.

### Phase 3: Inventory directory objects

Use paged queries (page size 500 or lower) for users, groups, computers, OUs,
and GPO objects. Request only the attributes needed: distinguished name,
objectClass, sAMAccountName, userAccountControl, servicePrincipalName,
memberOf, whenCreated, lastLogonTimestamp, operatingSystem.

Verify: counts per object class are recorded; paging completed; no query
touched a naming context outside the record.

### Phase 4: Map privilege and delegation

Build group nesting toward Domain Admins, Enterprise Admins, Schema Admins,
and Administrators. Flag accounts with adminCount set, accounts with
unconstrained delegation, accounts trusted for constrained delegation, and
resource-based delegation attributes. Interpret flags only from documented
Microsoft semantics, and cite the raw attribute value beside each finding.

Verify: each row carries the object DN, attribute, raw value, and query time.
Interpretations without a cited attribute are removed.

### Phase 5: Analyse ACL paths

Run the pinned collector in directory-only mode against the in-scope domain
controller, writing its archive into the evidence directory. Confirm each
interesting edge with a targeted read of the object security descriptor and a
review of the ACE (trustee, rights, inheritance). Do not perform any action
the ACE would allow.

Verify: every reported edge has both collector output and a manual ACE
confirmation. Unconfirmed edges are marked unverified and kept out of the
findings list.

### Phase 6: Link GPO and configuration context

Record GPO links per OU and the security-relevant settings that explain
exposure, such as local administrator membership delivered by GPO, delegated
logon rights, and script assignments. Read SYSVOL for script names and paths
only; never open files that may hold credentials.

Verify: each GPO statement cites the GPO GUID, the linked OU, and the setting
path.

### Phase 7: Prioritise and hand off

Rank paths by distance to Tier-0, privilege required, and whether the path is
already available to the issued identity. Write defensive actions beside each
finding: tiering, ACL cleanup, delegation removal, service account hygiene.

Verify: a defender can reproduce every finding from the evidence index alone,
and no step in the report is an exploitation instruction.

## Evidence

Store under `<engagement>/ad/<UTC timestamp>/`. Keep LDIF output, the
collector archive, ACE confirmations, and a command log. Hash each artefact
with SHA-256 and record the hash in the index. Redact personal data in
description, telephoneNumber, and info attributes. If a password or key
appears, stop, redact, and escalate. Evidence leaves the engagement only
through the agreed channel.

## Stop conditions

- Account lockout or repeated invalid credential errors.
- The identity holds rights beyond those recorded for it.
- A query returns objects from an out-of-scope domain.
- Secret material appears in any attribute.
- The domain controller shows load or replication delay attributable to
  collection.
- The blue-team contact requests a pause.
- Any next step would need a write, a ticket request, or a session as another
  user.

## Failure handling

- Size limit or admin limit exceeded: lower the page size, re-run that page,
  and record the gap.
- Referral chasing stays disabled; skipped referrals are listed as
  limitations rather than chased.
- Collector fails on some hosts: finish with directory-only collection and
  name the missed hosts.
- Throttling: exponential backoff with jitter, then continue with the next
  phase.
- Never retry a failed bind, and never switch identity to make a query work.

## References

- RFC 4511, Lightweight Directory Access Protocol (LDAP): <https://www.rfc-editor.org/rfc/rfc4511>
- MITRE ATT&CK v15, T1482 Domain Trust Discovery: <https://attack.mitre.org/versions/v15/techniques/T1482/>
- MS-ADTS, Active Directory Technical Specification: <https://learn.microsoft.com/en-us/openspecs/windows_protocols/ms-adts/>
- CIS Microsoft Windows Server 2022 Benchmark v2.0.0: <https://www.cisecurity.org/benchmark/microsoft_windows_server>
- NIST SP 800-115, Technical Guide to Information Security Testing: <https://csrc.nist.gov/pubs/sp/800/115/final>

## Original content

Authored for WMC NEXUS. No third-party text reproduced.
