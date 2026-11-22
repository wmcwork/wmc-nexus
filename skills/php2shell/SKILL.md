---
name: php2shell
description: "Invoke this skill when a task holds an LFI/file-inclusion finding on a PHP target (or needs to assess one) and the target may run PHP 5.4-8.5.11 with default session.upload_progress settings: turns a read-only LFI into verified RCE via the session-file-injection chain (CVE-2026-109618/109619), lab-first. Also covers passive detection of the vulnerable configuration."
---

# php2shell: session.upload_progress LFI-to-RCE (CVE-2026-109618/109619)

This skill upgrades an existing LFI/unsafe-include finding on a PHP target
into RCE, or classifies the target as not affected, using the vendored PoCs
under `scripts/poc/php2shell/` (upstream: ikow/php2shell-poc, MIT; see the
LICENSE there).

## Pre-flight

1. **Fingerprint first**: check response headers, error pages, and
   X-Powered-By. Targets on PHP 5.4.0-8.5.11 (any build with
   session.upload_progress enabled, the default) are candidates.
2. **Lab first**: run chain 1 against the local lab (`lab/setup.sh` builds a
   vulnerable PHP 8.2 FPM+nginx environment) until the mechanism is
   understood, then verify on the target.
3. **One-shot verification** on the target: prove execution once (a marker
   echo), capture evidence, stop.

## Chain 1 workflow (session file injection + LFI -> RCE)

1. Start with the task's LFI finding: note the include path parameter and its
   constraints (prefix/suffix, truncation, wrapper filters).
2. Confirm the session path is reachable through that LFI: with
   `session.upload_progress.enabled=On` (default), an in-flight multipart POST
   with an attacker-named file field writes a session file under the session
   save path containing the raw filename.
3. Inject PHP into the uploaded **filename** (not the file content):
   `verify_session_injection.py` demonstrates the full mechanics (session
   fixation via POST body PHPSESSID, raw filename storage, inclusion).
4. Race the session file's lifetime: include it through the LFI while the
   upload is still in flight (or keep the upload connection open).
5. Verify RCE with a single marker command; record the request sequence as
   evidence.

## Detection without an LFI

The chains need an app-level file-inclusion primitive; without one the
configuration is hardening-relevant, not exploitable. Report posture only.

## Vendored artifacts

- `poc/verify_session_injection.py` - chain 1 end-to-end against a lab URL
- `poc/verify_handler_mismatch.py` - chain 3
- `poc/verify_uaf_asan.php` - chain 2 under an ASAN PHP build
- `lab/setup.sh` - builds the vulnerable docker lab locally
- `docs/ANALYSIS.md`, `README.upstream.md` - the upstream technical writeup
