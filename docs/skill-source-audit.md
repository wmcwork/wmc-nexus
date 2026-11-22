# Skill source licensing pre-check

Initial repository-level review on 2026-11-21. This is not a legal opinion and does not approve
any individual Skill for import. Each selected Skill still needs provenance, content, and license
review.

| Source | License observed | Import decision |
| --- | --- | --- |
| [SecondSky Claude Skills](https://github.com/secondsky/claude-skills) | Repository `LICENSE`: MIT | Review the chosen Skill and its cited sources individually; preserve notices. Do not bulk-copy the collection. |
| [Agent Skills Hub](https://github.com/agent-skills-hub/agent-skills-hub) | Repository `LICENSE`: MIT. Its `ATTRIBUTION.md` identifies upstream collections with separate or unspecified licenses. | Repository MIT is not sufficient to clear all bundled Skills. Trace each candidate to its original source and retain attribution. |
| [BaaRai ARTEX](https://github.com/BaaRai/ARTEX) | `LICENSE`: GNU AGPL-3.0 | Preserve the upstream license and notices for this derived application. Review source-distribution obligations before publishing. |
| [OWASP WSTG](https://github.com/OWASP/wstg) | `LICENSE`: CC BY-SA 4.0 | Link to the standard by default. Do not copy or adapt substantial text into Skills until the ShareAlike and application-license implications are reviewed. |
| [OWASP ASVS](https://github.com/OWASP/ASVS) | `README.md` states CC BY-SA 4.0 | Link to a versioned release by default; review before adapting requirements or translations. |
| [OWASP Cheat Sheet Series](https://github.com/OWASP/CheatSheetSeries) | `LICENSE.md`: CC BY-SA 4.0 | Link to the source by default; do not bulk-import its text. |

## Source-specific findings

- The [SecondSky README](https://github.com/secondsky/claude-skills/blob/main/README.md) describes its
  `cybersecurity` skill as combining multiple community skills and covering live-target testing.
  It is **not approved for import**: the individual upstream authors, licenses, and included
  instructions have not been independently cleared. A repository-level MIT license does not
  establish the license of every incorporated contribution.
- SecondSky was also checked at pinned revision
  [`d07e5d0ff0a524874dc943eeeb7f58039541e5f1`](https://github.com/secondsky/claude-skills/commit/d07e5d0ff0a524874dc943eeeb7f58039541e5f1).
  Its root `LICENSE` is MIT. The README says the `cybersecurity` plugin fuses seven community
  Skills, but the inspected plugin/Skill directory listings contain no per-Skill license or
  source-attribution file. The `cybersecurity`, `xss-prevention`, and
  `security-headers-configuration` candidates therefore remain **unapproved**; no Skill content
  was copied.
- Agent Skills Hub's [attribution file](https://github.com/agent-skills-hub/agent-skills-hub/blob/main/ATTRIBUTION.md)
  names upstream collections whose licenses must be checked at their original repositories.
  No catalog entry is approved based only on the hub's root license.
- The Agent Skills Hub [`code-reviewer` Skill](https://github.com/agent-skills-hub/agent-skills-hub/blob/efc0b9639b83cf19aa73cc1b74844a6f302fe7ca/skills/code-reviewer/SKILL.md)
  was inspected at pinned repository revision `efc0b9639b83cf19aa73cc1b74844a6f302fe7ca`
  (file blob `98ddda1f84da8ee89546a69a793490843959b463`). Its attribution file names the
  `sickn33/antigravity-awesome-skills` collection but does not list a path. GitHub search locates
  matching core content at
  [`skills/code-reviewer/SKILL.md`](https://github.com/sickn33/agentic-awesome-skills/blob/f6f686855a672e3868d648cef056312392e3a417/skills/code-reviewer/SKILL.md)
  (blob `21f0cae6fe985790afca6127b8df4f3d71e0bc4f`). That source repository's `LICENSE` is MIT
  for code; `LICENSE-CONTENT` applies CC BY 4.0 to original non-code content unless a more
  specific upstream notice applies. The source file labels itself `community`, but neither it nor
  `docs/sources/sources.md` identifies the original author or upstream source for this Skill.
  The hub version also has additional sections beyond that match. No scripts were present in its
  directory listing. **Not approved for import** until authorship, upstream rights, and the
  applicable notices for the full hub version are established.
- OWASP materials are currently links only; no standard text or translated/adapted excerpts were copied.

## Result

No third-party Skill content is approved for import yet. OWASP is an organization, not a single
license: use a specific project and version for each reference. Before adding a Skill, record its
source URL and revision, original author, applicable license, required notices, and any adaptations.

## WMC NEXUS provenance record

The Skill creation form can write `SOURCE.md` when a GitHub repository URL, full 40-character
commit SHA, and license are provided. This records provenance only; it does not fetch, review, or
approve the source. ZIP uploads must include their own provenance record and still require an
individual review before distribution.

```text
# Skill source provenance

Repository: https://github.com/owner/repository
Revision: <full 40-character commit SHA>
License: <SPDX identifier or license name>
Original author(s): <author or maintaining organization>
License / notice details: <required notices or "Not recorded">

Adaptation and review notes: <changes and findings, or "Not recorded">
User attestation: source, license, and included content reviewed during skill creation.
Recorded: <UTC timestamp>
```
