# Custom REST authentication contract

Use this adapter when an application already has its own server and database. Do not put database passwords, service keys, or admin tokens in browser code.

`createRestAuthAdapter()` calls HTTPS POST endpoints and sends cookies by default (`credentials: 'include'`). The application owns password hashing, sessions, rate limits, database uniqueness, and authorization.

## Required endpoints

All responses are JSON. Error responses use a generic message:

```json
{ "error": "Invalid email or password." }
```

| Endpoint | Request | Successful response |
| --- | --- | --- |
| `POST /auth/sign-in` | `{ "email", "password" }` | `{ "user": { "id", "email" }, "session": { "user": { "id", "email" } } }` and an HttpOnly session cookie |
| `POST /auth/sign-up` | `{ "email", "password", "data" }` | same shape; `session` may be `null` when email confirmation is required |
| `POST /auth/password-reset` | `{ "email", "redirectTo" }` | `204` or `{}`; always return the same public message to avoid account enumeration |
| `POST /auth/update-password` | `{ "password" }` | `204` or `{}`; verify the recovery session on the server |
| `POST /auth/oauth` | `{ "provider", "redirectTo" }` | `{ "redirectUrl": "https://provider.example/..." }` |

## Server requirements

1. Validate and canonicalize email again on the server using `webapp-login-ui/server` or `core`.
2. Hash passwords with a dedicated password-hashing library; never store the submitted password text.
3. Rate-limit by a trusted client IP plus account identifier. The package's memory limiter is for a single process only; use Redis, a database, or your platform's rate limiter in multi-instance production deployments.
4. Use secure, HttpOnly, `SameSite` cookies for browser sessions whenever possible. Do not put long-lived tokens in URLs or local storage.
5. Enforce user ownership and roles in every database query.
