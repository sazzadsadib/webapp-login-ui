# Changelog

## Unreleased

- Add an `AuthAdapter` contract so the ready UI and custom UI can use either Supabase or an existing HTTPS REST backend.
- Add `createRestAuthAdapter` with HTTPS enforcement, cookie-based requests, and an explicit backend contract.
- Add headless exports for custom login pages and a server-side memory rate-limit helper.
- Add an optional Supabase RLS/canonical-email SQL template and integration documentation.
- Replace unsupported security claims with implementation-backed setup and production guidance.

## 1.0.0

- Fail closed when Supabase configuration is missing or unsafe.
- Accept an existing Supabase client in all authentication components.
- Add verified-session callbacks and correct email-confirmation behavior.
- Add OAuth redirect configuration and password-update completion UI.
- Ship compiled JavaScript, TypeScript declarations, and scoped CSS.
- Preserve existing `.env.local` values in the setup CLI.
- Add expanded validation/configuration tests and public security documentation.
