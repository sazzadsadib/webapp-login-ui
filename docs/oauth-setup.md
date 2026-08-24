# Supabase OAuth setup

Enable only providers your product actually offers. For every provider, first copy the callback URL from Supabase Dashboard → Authentication → Providers. It normally has this form:

```text
https://<project-ref>.supabase.co/auth/v1/callback
```

Also add your application return URL (for example `https://app.example.com/auth/callback`) to Supabase Authentication → URL Configuration → Redirect URLs. It must match the `oauthRedirectTo` value passed to `AuthCard`.

## Google

1. Create a Google Cloud project and OAuth client of type **Web application**.
2. Add the application origin (for example `https://app.example.com`) to Authorized JavaScript origins.
3. Add the copied Supabase callback URL to Authorized redirect URIs.
4. Copy the Google Client ID and Client Secret into the Google provider settings in Supabase, then enable the provider.

Read the current [Supabase Google login guide](https://supabase.com/docs/guides/auth/social-login/auth-google) before production, especially if Google consent-screen verification is required.

## GitHub

1. In GitHub Settings → Developer settings → OAuth Apps, create a New OAuth App.
2. Set the homepage to the application URL and the Authorization callback URL to the copied Supabase callback URL.
3. Generate a client secret.
4. Copy the Client ID and Client Secret into the GitHub provider settings in Supabase, then enable the provider.

See the [Supabase GitHub login guide](https://supabase.com/docs/guides/auth/social-login/auth-github).

## Facebook

1. Create an app in Meta for Developers and add the Facebook Login product.
2. Add the copied Supabase callback URL as the Valid OAuth Redirect URI.
3. Ensure the app has the email permission and is in an appropriate test/live state.
4. Copy the App ID and App Secret into the Facebook provider settings in Supabase, then enable the provider.

See the [Supabase Facebook login guide](https://supabase.com/docs/guides/auth/social-login/auth-facebook).

## Apple

1. In Apple Developer, create/configure an App ID with Sign in with Apple and create a web Services ID.
2. Set the Services ID website domain to the Supabase project domain and use the copied Supabase callback URL as its return URL.
3. Create and protect an Apple signing key; revoke and replace it if it is exposed.
4. Add the Services ID, Team ID, Key ID, and generated client secret to the Apple provider settings in Supabase, then enable the provider.

Apple generally provides a user's full name only on first sign-in and not through the OAuth flow. Collect a name during onboarding if your application requires it. See the [Supabase Apple login guide](https://supabase.com/docs/guides/auth/social-login/auth-apple).

## Test before release

Test each enabled provider using both local and production return URLs. A provider needs both its own callback URL configuration and the matching Supabase Redirect URLs configuration.
