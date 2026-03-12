<!--
    ▄▄▄▄
  ▄█▀▀███▄▄              █▄
  ██    ██ ▄             ██
  ██    ██ ████▄▄█▀█▄ ▄████ ▄█▀█▄▀██ ██▀
  ██  ▄ ██ ██   ██▄█▀ ██ ██ ██▄█▀  ███
   ▀█████▄▄█▀  ▄▀█▄▄▄▄█▀███▄▀█▄▄▄▄██ ██▄
        ▀█

  Copyright (C) 2026 — 2026, Qredex, LTD. All Rights Reserved.

  DO NOT ALTER OR REMOVE COPYRIGHT NOTICES OR THIS FILE HEADER.

  This file is part of the Qredex Agent SDK and is licensed under the MIT License. See LICENSE.
  Redistribution and use are permitted under that license.

  If you need additional information or have any questions, please email: copyright@qredex.com
-->

# Release

## CI

GitHub Actions runs `.github/workflows/ci.yml` on every pull request and on pushes to `main`.

It verifies:

- `npm run lint`
- `npm run release:check`
- `npm run test:browser`

## NPM

```bash
npm run release:check
npm run publish:npm:dry-run
npm run publish:npm
```

`publish:npm` publishes in this order:

1. `@qredex/agent`
2. `@qredex/react`
3. `@qredex/vue`
4. `@qredex/svelte`
5. `@qredex/angular`

The publish script is rerunnable. If a package version is already on npm, the script skips it and continues with the remaining packages.

## GitHub Release Workflow

GitHub Actions runs `.github/workflows/release.yml` on pushed version tags:

```bash
git tag v1.0.0
git push origin v1.0.0
```

The release workflow:

1. verifies the tag matches `package.json`
2. runs lint and browser smoke coverage
3. runs the final production release checks (`test`, `build`, tarball verification, export verification)
4. publishes npm packages with provenance
5. prepares first-party CDN assets from the production build
6. uploads versioned CDN assets to Cloudflare R2

### Required GitHub Configuration

Production environment secrets:

- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_API_TOKEN`

Production environment variables:

- `CLOUDFLARE_R2_BUCKET`

The release workflow runs in the `production` GitHub Actions environment.
If you also create a `staging` environment, keep it for a separate staging
workflow or manual non-production release path.

NPM trusted publishing must be configured for:

- `@qredex/agent`
- `@qredex/react`
- `@qredex/vue`
- `@qredex/svelte`
- `@qredex/angular`

Use the same `production` environment in npm trusted publishing so the GitHub
job, environment protection rules, and npm publisher trust all align.

## First Publish

Use this order for the first public npm release:

1. Confirm the `@qredex` npm scope is owned by the Qredex org and your admin account has publish rights.
2. Try to add a GitHub Actions trusted publisher for each package with:
   - repository: `Qredex/qredex-agent`
   - workflow: `release.yml`
   - environment: `production`
3. If npm does not let you configure trusted publishing before the package exists, do one bootstrap publish from an org owner account with 2FA:
   - `npm run release:check`
   - `node scripts/publish-packages.mjs`
4. Immediately after the bootstrap publish, add trusted publishers for:
   - `@qredex/agent`
   - `@qredex/react`
   - `@qredex/vue`
   - `@qredex/svelte`
   - `@qredex/angular`
5. After trusted publishing is live, use the GitHub `release.yml` workflow for all subsequent releases.

## CDN

```bash
npm run release:cdn
npm run release:cdn:upload
```

That prepares first-party CDN assets under:

- `release/agent/v<full-version>/`
- `release/agent/v<major>/`
- uploads them to `agent/v<full-version>/` and `agent/v<major>/` in the configured R2 bucket

Current production CDN asset:

- `qredex-agent.iife.min.js`
- `qredex-agent.iife.min.js.map`

## Staging CDN

```bash
npm run release:cdn:staging
npm run release:cdn:staging:upload
```

That prepares and uploads the staging bundle to:

- `agent/staging/qredex-agent.iife.min.js`
- `agent/staging/qredex-agent.iife.min.js.map`
- `agent/staging/manifest.json`

Staging uses the staging build policy and is intentionally isolated from the
production versioned CDN paths.

Caching policy:

- pinned version path: `Cache-Control: public, max-age=31536000, immutable`
- moving major alias and manifest: `Cache-Control: public, max-age=300, must-revalidate`

## Checks

`release:check` verifies:

- tests pass
- builds succeed
- npm tarballs contain the expected files
- built package entrypoints expose the expected public exports
