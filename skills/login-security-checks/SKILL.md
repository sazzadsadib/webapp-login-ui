---
name: login-security-checks
description: Review authentication UI and application integrations without treating client-side checks as a security boundary.
---

# Login security checks

When reviewing authentication code:

1. Fail closed when provider configuration is missing. Never simulate successful authentication in production code.
2. Keep service-role and secret keys on trusted servers. Browser code may use only anon/publishable keys.
3. Treat client-side email normalization and disposable-domain checks as user-experience controls. Enforce hard business rules on a trusted server or Auth hook.
4. Use provider and server-side rate limits for sign-in, sign-up, recovery, and valuable application actions.
5. Call authenticated callbacks only after a verified session exists.
6. Use exact allow-listed OAuth and recovery redirect URLs.
7. Enable and test RLS for every application table exposed through Supabase.
8. Never store raw passwords in the application database. Use a managed identity provider or an established password-hashing implementation.
9. Keep recovery responses generic to avoid revealing whether an account exists.
10. Test keyboard access, dialog focus, error states, package installation, and production builds.
