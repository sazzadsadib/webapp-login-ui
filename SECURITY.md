# Security policy

## Supported versions

Security fixes are provided for the latest published version.

## Reporting a vulnerability

Please use GitHub's **Security → Report a vulnerability** feature for private disclosure:

https://github.com/sazzadsadib/webapp-login-ui/security/advisories/new

Do not include working exploits, credentials, tokens, or private user data in a public issue.

Include the affected version, impact, reproduction steps, and any suggested mitigation. Maintainers should acknowledge a report within seven days and coordinate disclosure after a fix is available.

## Important boundaries

- Supabase anon/publishable keys are intended for browser use; service-role and secret keys are not.
- This package does not provide database RLS, application authorization, CAPTCHA, or a distributed rate limiter.
- Client-side validation can be bypassed and must not be the only enforcement for a hard business rule.
- OAuth and recovery redirect URLs must be explicitly allow-listed in Supabase.
- Consumers are responsible for protecting their server routes and application data with verified sessions and RLS.
