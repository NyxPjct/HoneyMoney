# Security Policy

HoneyMoney stores users' AI provider keys, so we take security reports seriously.

## Reporting a vulnerability

**Please do not open a public issue.** Use GitHub's private vulnerability reporting:
**Security → Report a vulnerability** on this repository.

Include what you found, how to reproduce it and the impact you expect. We aim to acknowledge reports within 72 hours and to ship a fix or mitigation as fast as the severity requires. We are happy to credit you once a fix is released.

## Scope

Especially interesting:

- Any way to read, decrypt or exfiltrate another user's AI key (Vault, logs, errors, queue state, API responses).
- Bypassing Row Level Security or the column-level permissions (e.g. changing a project status, approving or publishing a page without the Sentinel).
- XSS or script execution on published pages, or a published page reading the app's cookies.
- Prompt injection that makes an agent leak data or take actions beyond producing its JSON deliverable.
- Open redirects in the auth flow.

Out of scope: denial of service by volume, findings that require a compromised device, and issues in third-party services (report those to the vendor).

## Supported versions

Only the latest release on the default branch receives security fixes.
