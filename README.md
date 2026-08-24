# WebApp Login UI

> **Early release (0.1.0):** this package is ready to try in a real project, but it is not a complete hosted authentication service. Review the security checklist below before a production launch.

Reusable React login UI and authentication helpers for two practical cases:

1. Add a ready-made login, signup, OAuth, and password-recovery screen to an existing app.
2. Keep an existing custom login design and reuse the package's validation, adapter, and server-security helpers.

It supports Supabase directly and any existing backend through a documented HTTPS REST contract. It does not connect a browser directly to a database.

## Choose the right path first

Answer these two questions before installing anything.

### Do you already have a login page?

- **No - I need a login page:** use **Path A** below. The guided setup creates ready-made `/login` and password-update pages for a Next.js App Router project.
- **Yes - my login page/design is already ready:** use **Path B** below. **Do not run `npx webapp-login-ui@beta@beta`**. Keep your existing design and connect its submit button to this package's validation and authentication adapter.

### Where are user accounts stored?

- **I do not have an authentication backend:** choose **Supabase**. It is the simplest option.
- **I already have a backend/API and database:** choose the **custom REST adapter**. Your API stays responsible for passwords, sessions, database access, and rate limits.

| Your situation | What to use |
| --- | --- |
| No login page + Next.js App Router | **Path A** - run `npx webapp-login-ui@beta@beta` |
| Ready login page + Supabase | **Path B** - use the Supabase adapter in your existing form |
| Ready login page + existing backend | **Path B** - use the REST adapter in your existing form |
| No Next.js App Router project | Do not run the wizard; use the manual component examples instead |

## Path A: I do not have a login page

Use this path only when you need the package to create a login page for you.

If you have a **Next.js App Router** project (it has an `app/` or `src/app/` folder), open a terminal in that project folder and run:

```bash
npx webapp-login-ui@beta
```

The wizard then asks normal, short questions:

1. Do you want to use Supabase or an existing login API?
2. What is your app's web address? It suggests `http://localhost:3000` for local work.
3. Which page should open after login? It suggests `/dashboard`.
4. Do you want Google, GitHub, Facebook, or Apple login buttons?
5. For Supabase: the Project URL and anon/publishable key.
6. For an existing backend: its public HTTPS API address.

It never asks for a database password, Supabase service-role key, or admin key.

After you confirm, it installs the package, writes the required `.env.local` values, creates `/login` and `/auth/update-password`, and adds `WEBAPP_LOGIN_SETUP.md` to your project. If `.env.local` already exists, it creates a timestamped backup and keeps unrelated values. Existing page files are never replaced without asking first.

### What you need before running the wizard

- Node.js 20 or newer
- A Next.js App Router project
- For the easiest path: a Supabase project
- Or, for an existing database: a working HTTPS login API that follows the [custom REST contract](docs/custom-rest-contract.md)

For a non-Next.js React project, use the manual component examples below. The wizard deliberately does not guess your router or overwrite files in an unfamiliar project structure.

## What is included

- Ready React components: `AuthCard`, `SocialAuthRow`, `ForgotPasswordModal`, and `UpdatePasswordForm`
- Supabase authentication adapter
- Custom REST authentication adapter for an existing backend/database
- Gmail and Googlemail dot/plus canonicalization
- Disposable-email, multi-address, whitespace, and email-header-injection checks
- Server helper for login-rate limiting, with clear single-process limitations
- Optional Supabase profile/RLS SQL template with canonical-email uniqueness
- A setup CLI that preserves unrelated `.env.local` values
- Scoped CSS, TypeScript declarations, CommonJS, and ESM builds

## Important security boundary

This package is not an authentication server and cannot secure a database by itself. The browser must never receive a database password, Supabase `service_role` key, or any admin key.

Rate limits, password hashing, session cookies, account authorization, database uniqueness, and Row Level Security must run in a trusted server/database. The provided utilities and templates make those steps easier; they do not silently add security to an existing application.

## Requirements

- Node.js 20 or newer
- React 18 or 19
- For the ready UI: React, `react-dom`, and optionally Next.js
- Either a Supabase project or a secure HTTPS backend API

## Install

While the package is in beta, install the beta channel explicitly:

```bash
npm install webapp-login-ui@beta @supabase/supabase-js
```

Before the first npm release, install this repository after the current code has been pushed to GitHub:

```bash
npm install github:sazzadsadib/webapp-login-ui
```

Import the package stylesheet once in a client-side root layout or application entry point:

```tsx
import 'webapp-login-ui/styles.css';
```

## Path A option 1: ready login page with Supabase

Create a browser Supabase client and pass it to `AuthCard`:

```tsx
'use client';

import { createClient } from '@supabase/supabase-js';
import { AuthCard } from 'webapp-login-ui';
import 'webapp-login-ui/styles.css';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

export default function LoginPage() {
  return (
    <AuthCard
      client={supabase}
      oauthProviders={['google', 'github']}
      onSuccess={(user) => window.location.assign('/dashboard')}
      onSignUpConfirmationRequired={() => {
        // Tell the person to confirm the email before signing in.
      }}
    />
  );
}
```

Alternatively, set these browser-safe variables and render `<AuthCard />` without a `client` prop:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-or-publishable-key
```

Missing, placeholder, insecure, or service-role configuration fails closed. A fake/demo login is never created.

### Supabase setup required

1. Create a Supabase project and enable Email login.
2. Copy the Project URL and anon/publishable key into the variables above.
3. Set your local and production app URLs in Supabase Authentication → URL Configuration.
4. Add the exact password-recovery and OAuth return URLs to Redirect URLs.
5. Enable only the social providers you configure. Each provider needs the callback URL shown in its Supabase provider settings.
6. Apply the RLS template only after reviewing it: [Supabase RLS guide](docs/supabase-rls.md).

Never use `service_role` or `sb_secret_...` values in `NEXT_PUBLIC_...` variables.

## Path A option 2: ready login page with an existing backend

For an existing database, keep database access on the application's server. Point the REST adapter at that server:

```tsx
'use client';

import { AuthCard } from 'webapp-login-ui';
import { createRestAuthAdapter } from 'webapp-login-ui/rest';
import 'webapp-login-ui/styles.css';

const auth = createRestAuthAdapter({
  baseUrl: 'https://api.example.com',
});

export default function LoginPage() {
  return <AuthCard adapter={auth} oauthProviders={['google']} />;
}
```

The adapter uses HTTPS and includes cookies by default. Your backend must implement the five endpoints described in the [custom REST contract](docs/custom-rest-contract.md). It must hash passwords, verify recovery sessions, enforce authorization, and rate-limit requests.

> **Important:** installing this package does **not** make an existing backend secure. Before launch, a developer must verify secure password hashing, `HttpOnly`/`Secure`/`SameSite` session cookies, CSRF protection where cookies are used, server-side authorization on every protected route, recovery-token expiry, shared rate limiting for multi-server deployments, and database-level unique email rules. If you cannot verify those items, use Supabase or have a security-aware backend developer review the API.

## Path B: I already have a login page

**Do not run `npx webapp-login-ui@beta@beta` for this path.** Your login page, branding, fields, and dashboard redirect remain yours. Install the package and call its validation and adapter from your existing form's submit logic. No package UI is required.

Choose one adapter:

- **Supabase:** use this if Supabase stores your users.
- **Custom REST:** use this if your own HTTPS backend stores your users; follow the [custom REST contract](docs/custom-rest-contract.md).

Example with Supabase:

```tsx
import { createClient } from '@supabase/supabase-js';
import { validateAndSanitizeEmail } from 'webapp-login-ui/core';
import { createSupabaseAuthAdapter } from 'webapp-login-ui/supabase';

const client = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);
const auth = createSupabaseAuthAdapter(client);

export async function signIn(email: string, password: string) {
  const checked = validateAndSanitizeEmail(email, {
    canonicalizeGmail: true,
    blockDisposableEmail: true,
  });
  if (!checked.isValid) throw new Error(checked.error);

  const result = await auth.signInWithPassword({
    email: checked.canonicalEmail,
    password,
  });
  if (!result.session) throw new Error('No authenticated session was created.');
  return result.user;
}
```

For a custom backend, replace the Supabase import and `auth` setup above with this. The `signIn` function can stay the same:

```tsx
import { createRestAuthAdapter } from 'webapp-login-ui/rest';

const auth = createRestAuthAdapter({
  baseUrl: process.env.NEXT_PUBLIC_AUTH_API_URL!,
});
```

Your backend must follow the [custom REST contract](docs/custom-rest-contract.md). Run the same email policy again on the server; client-side checks can be bypassed. The REST adapter only connects your UI to your API; it cannot create password hashing, secure sessions, access control, or server-side rate limits for you.

## Password recovery

`AuthCard` opens a reset dialog. Create the page that receives the recovery link:

```tsx
// app/auth/update-password/page.tsx
'use client';

import { UpdatePasswordForm } from 'webapp-login-ui';
import 'webapp-login-ui/styles.css';

export default function UpdatePasswordPage() {
  return <UpdatePasswordForm onSuccess={() => window.location.assign('/login')} />;
}
```

Add `https://your-domain.example/auth/update-password` to Supabase Redirect URLs. For a REST backend, that endpoint must verify the recovery session before accepting a new password.

## OAuth

Set `oauthProviders` to the providers actually enabled in Supabase or your REST backend:

```tsx
<AuthCard oauthProviders={['google', 'github']} oauthRedirectTo="https://your-domain.example/auth/callback" />
```

The redirect URL must be allow-listed in Supabase. Projects using server-side Supabase/PKCE should create a callback route that exchanges the returned code for a session; browser-only Supabase clients automatically detect redirect sessions.

For provider-by-provider setup, use [the OAuth setup guide](docs/oauth-setup.md).

## Server-side login protection

The package provides an in-memory limiter for a single long-running server process:

```ts
import {
  DEFAULT_LOGIN_RATE_LIMIT,
  MemoryRateLimiter,
  getRequestIp,
  validateAndSanitizeEmail,
} from 'webapp-login-ui/server';

const limiter = new MemoryRateLimiter();

export async function handleLogin(request: Request) {
  const ip = getRequestIp(request.headers) ?? 'unknown';
  const limit = limiter.check(`login:${ip}`, DEFAULT_LOGIN_RATE_LIMIT);
  if (!limit.allowed) {
    return Response.json({ error: 'Try again later.' }, { status: 429 });
  }

  const { email, password } = await request.json();
  const checked = validateAndSanitizeEmail(email);
  // Validate password, authenticate with a password-hash library, then reset
  // limiter.reset(`login:${ip}`) only after a successful login.
}
```

`MemoryRateLimiter` is not shared across server instances and resets after restart. For serverless or multi-server production apps, replace it with Redis, a database, or a platform rate-limiting service.

Only use `getRequestIp()` when a trusted proxy overwrites `x-forwarded-for`; otherwise supply the client address from your hosting platform's trusted request metadata.

## Supabase RLS and canonical email

The optional [SQL template](templates/supabase/webapp-login-rls.sql) creates a sample profile table, canonical-email unique constraint, and per-user Row Level Security policies. Review it before running it, especially if an application already has user data. It protects only the tables where policies are enabled.

## Setup CLI

While the package is in beta:

```bash
npx webapp-login-ui@beta
```

Run it from a Next.js App Router project. The wizard installs the package into that project, asks whether to use Supabase or an existing HTTPS REST backend, writes only browser-safe environment values, generates `/login` and `/auth/update-password` pages, and creates `WEBAPP_LOGIN_SETUP.md` with the remaining provider/backend checklist.

For Supabase, it writes these values automatically:

```env
NEXT_PUBLIC_APP_URL=https://your-app.example
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-or-publishable-key
```

For an existing backend, it writes:

```env
NEXT_PUBLIC_APP_URL=https://your-app.example
NEXT_PUBLIC_AUTH_API_URL=https://api.your-app.example
```

The API URL is public configuration, not a secret. The wizard never writes database credentials into `.env.local`.

### After the wizard finishes

1. Run your app with its usual development command, commonly `npm run dev`.
2. Open `http://localhost:3000/login` (or your app's address plus `/login`).
3. Open the generated `WEBAPP_LOGIN_SETUP.md` and complete its checklist.
4. For Supabase, add the listed URLs to Supabase Redirect URLs and enable the providers you selected.
5. For an existing backend, confirm its five authentication endpoints already work.
6. Test signup, sign-in, password reset, and every social provider before deploying.

## Public API

- Root package: UI components, `createSupabaseAuthAdapter`, Supabase configuration helpers
- `/core`: email validation and `AuthAdapter` types for custom UI
- `/supabase`: Supabase adapter and configuration helpers
- `/rest`: `createRestAuthAdapter` for an existing HTTPS backend
- `/server`: email validation plus `MemoryRateLimiter` and request-IP helper
- `/email`: email validation only
- `/styles.css`: package stylesheet

## Development and release

```bash
npm install
npm test
npm run build:demo
npm pack --dry-run
```

Before publishing, run `npm audit --omit=dev`, review the generated package, and test email login, signup confirmation, password recovery, every enabled OAuth provider, and production redirects in a real Supabase/backend project.

See [docs/releasing.md](docs/releasing.md) before publishing.

## License

MIT
