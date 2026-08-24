# Release guide

This repository is configured for the public package `webapp-login-ui`. The name was available in the npm registry when it was selected; availability must be checked again immediately before the first publish.

## One-time setup

1. Create or sign in to the npm account that will publish `webapp-login-ui`.
2. Enable two-factor authentication on the npm account.
3. Confirm that `npm view webapp-login-ui` still returns not found before the first release.
4. Configure npm trusted publishing for this GitHub repository, or add an automation token as the `NPM_TOKEN` GitHub Actions secret.
5. Protect the GitHub `main` branch and require the CI workflow.

## Release

For a local release without provenance:

```bash
npm ci
npm run verify
npm audit --omit=dev
npm pack --dry-run
npm publish --access public
```

The preferred flow is to create a signed tag and GitHub Release. The included publish workflow then uses npm trusted publishing and provenance automatically.
