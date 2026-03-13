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
npm run release:version -- 1.0.1
npm run release:check
npm run publish:npm:dry-run
npm run publish:npm
```

`release:version` updates:

1. the root package version
2. all wrapper package versions
3. each wrapper's `@qredex/agent` dependency range

`publish:npm` publishes in this order:

1. `@qredex/agent`
2. `@qredex/react`
3. `@qredex/vue`
4. `@qredex/svelte`
5. `@qredex/angular`

The publish script is rerunnable. If a package version is already on npm, the script skips it and continues with the remaining packages.

## GitHub Release Automation

The automated release path is:

1. run `npm run release:version -- <x.y.z>`
2. commit and push the version change to `main`
3. GitHub Actions creates tag `v<x.y.z>`
4. the tag triggers npm publish and CDN release workflows

### Auto Tag Workflow

GitHub Actions runs `.github/workflows/tag-release-on-version-change.yml` on pushes to `main` that change any package version file.

It:

1. verifies all workspace package versions match the root package version
2. creates `v<x.y.z>` if it does not already exist

### NPM Publish Workflow

GitHub Actions runs `.github/workflows/publish-npm.yml` on pushed version tags:

```bash
git tag v1.0.0
git push origin v1.0.0
```

The npm publish workflow:

1. verifies the tag matches the root package version
2. installs dependencies
3. runs `npm run publish:npm`
4. publishes npm packages with provenance via Trusted Publishing
5. creates a GitHub Release with generated notes after npm publish succeeds

### CDN Release Workflow

GitHub Actions runs `.github/workflows/release.yml` on pushed version tags:

```bash
git tag v1.0.0
git push origin v1.0.0
```

The release workflow:

1. verifies the tag matches `package.json`
2. runs lint and browser smoke coverage
3. runs the final production release checks (`test`, `build`, tarball verification, export verification)
4. prepares first-party CDN assets from the production build
5. uploads versioned CDN assets to Cloudflare R2

### Required GitHub Configuration

Production environment secrets:

- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_API_TOKEN`

Production environment variables:

- `CLOUDFLARE_R2_BUCKET`

The CDN release workflow runs in the `production` GitHub Actions environment.
If you also create a `staging` environment, keep it for a separate staging
workflow or manual non-production release path.

Today, `production` and `staging` are used for CDN workflows:

- `production` is used by `.github/workflows/release.yml`
- `staging` is used by `.github/workflows/staging.yml`

The npm publish workflow currently does not use a GitHub Actions environment.
That keeps npm Trusted Publishing configured against the workflow file only.

NPM trusted publishing must be configured for:

- `@qredex/agent`
- `@qredex/react`
- `@qredex/vue`
- `@qredex/svelte`
- `@qredex/angular`

Trusted publishing should point at:

- repository: `Qredex/qredex-agent`
- workflow: `publish-npm.yml`
- environment: leave blank unless the publish workflow is later moved into a GitHub Actions environment

If npm publish is later moved into the `production` environment, npm trusted
publishing must be updated to use:

- repository: `Qredex/qredex-agent`
- workflow: `publish-npm.yml`
- environment: `production`

With that setup, a release tag would still trigger npm publish, but the job
would pause for any `production` environment protection rules before npm
publishing proceeds.

## First Publish

Use this order for the first public npm release:

1. Confirm the `@qredex` npm scope is owned by the Qredex org and your admin account has publish rights.
2. Try to add a GitHub Actions trusted publisher for each package with:
   - repository: `Qredex/qredex-agent`
   - workflow: `publish-npm.yml`
   - environment: blank
3. If npm does not let you configure trusted publishing before the package exists, do one bootstrap publish from an org owner account with 2FA:
   - `npm run release:check`
   - `node scripts/publish-packages.mjs`
4. Immediately after the bootstrap publish, add trusted publishers for:
   - `@qredex/agent`
   - `@qredex/react`
   - `@qredex/vue`
   - `@qredex/svelte`
   - `@qredex/angular`
5. After trusted publishing is live, use the version bump + `main` merge flow for all subsequent releases.

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

If staging should hit a real non-production lock API, set the `staging`
environment variable `QREDEX_AGENT_LOCK_ENDPOINT` in GitHub Actions before
running the staging workflow. The staging build bakes that endpoint into the
bundle at build time. Production ignores this override and always uses the
canonical Qredex production lock endpoint.

Caching policy:

- pinned version path: `Cache-Control: public, max-age=31536000, immutable`
- moving major alias and manifest: `Cache-Control: public, max-age=300, must-revalidate`

## Checks

`release:check` verifies:

- tests pass
- builds succeed
- npm tarballs contain the expected files
- built package entrypoints expose the expected public exports
