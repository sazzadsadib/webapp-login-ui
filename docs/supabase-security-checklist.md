# Supabase production security checklist

Use this checklist in the Supabase project that backs your application.

## Authentication

- Use the public anon or publishable key in the browser. Never expose a service-role or secret key.
- Set the production Site URL and use exact allowed Redirect URLs for OAuth and password recovery.
- Enable email confirmation when the application requires verified email ownership.
- Set a suitable password minimum and enable leaked-password protection when available.
- Review Auth rate limits and email sending limits for the expected traffic.
- Enable CAPTCHA for public sign-up, sign-in, and password-recovery flows when abuse risk warrants it.
- Configure custom SMTP for production delivery and monitor bounce/complaint rates.

## Data authorization

- Enable RLS on every table reachable through the Data API.
- Write policies using `auth.uid()` and the application's actual ownership or membership model.
- Test each policy as an unauthenticated user, an owner, and a different authenticated user.
- Keep service-role operations on a trusted server only.
- Re-check authorization inside Server Actions, route handlers, and API endpoints.

## Abuse prevention

- Browser-side disposable-email and Gmail-alias checks are advisory because direct API calls bypass the UI.
- Use a trusted server or Supabase Auth hook when these rules must be enforced.
- Apply server-side rate limiting to valuable or costly application actions in addition to provider limits.

## Operations

- Keep dependencies updated and run `npm audit --omit=dev` in CI.
- Monitor Auth logs for repeated failed sign-ins, recovery flooding, and unusual signup volume.
- Rotate any credential that was accidentally committed or logged.
