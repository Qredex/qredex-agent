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

  Licensed under the Apache License, Version 2.0. See LICENSE for the full license text.
  You may not use this file except in compliance with that License.
  Unless required by applicable law or agreed to in writing, software distributed under the
  License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
  either express or implied. See the License for the specific language governing permissions
  and limitations under the License.

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
4. the completed tag workflow triggers npm publish and CDN release workflows

### Auto Tag Workflow

GitHub Actions runs `.github/workflows/tag-release-on-version-change.yml` on pushes to `main` that change any package version file.

It:

1. verifies all workspace package versions match the root package version
2. creates `v<x.y.z>` if it does not already exist

### NPM Publish Workflow

GitHub Actions runs `.github/workflows/publish-npm.yml` after `.github/workflows/tag-release-on-version-change.yml` completes successfully. It can also be run manually, and it still supports direct pushed version tags as a recovery path.

The npm publish workflow:

1. resolves `v<package.json version>` and verifies that the tag points at the release commit
2. installs Node.js and npm CLI versions that satisfy npm Trusted Publishing requirements
3. runs `npm run publish:npm`
4. publishes npm packages with provenance via Trusted Publishing
5. creates a GitHub Release with generated notes after npm publish succeeds

For manual recovery of an existing release tag after workflow-only changes, dispatch the workflow from `main` and pass the tag as `release_ref`:

```bash
gh workflow run publish-npm.yml --ref main -f release_ref=v1.0.2
```

### CDN Release Workflow

GitHub Actions runs `.github/workflows/release.yml` after `.github/workflows/tag-release-on-version-change.yml` completes successfully. It can also be run manually, and it still supports direct pushed version tags as a recovery path.

The release workflow:

1. resolves `v<package.json version>` and verifies that the tag points at the release commit
2. runs lint and browser smoke coverage
3. runs the final production release checks (`test`, `build`, tarball verification, export verification)
4. prepares first-party CDN assets from the production build
5. uploads versioned CDN assets to Cloudflare R2

If a `main` push changes `package.json` files without creating a new release tag,
the production npm/CDN workflows now exit cleanly as no-ops instead of failing.
That keeps `dev` and `staging` publishing on every `main` push without creating
false production release failures.

For manual recovery of an existing release tag after workflow-only changes, dispatch the workflow from `main` and pass the tag as `release_ref`:

```bash
gh workflow run release.yml --ref main -f release_ref=v1.0.2
```

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
npm run release:cdn:verify
```

That prepares first-party CDN assets under:

- `release/agent/v<full-version>/`
- `release/agent/v<major>/`
- uploads them to `agent/v<full-version>/` and `agent/v<major>/` in the configured R2 bucket
- updates `agent/releases.json` so production CDN history can be inspected after each successful upload

Current production CDN asset:

- `qredex-agent.iife.min.js`
- `qredex-agent.iife.min.js.map`

## Dev CDN

```bash
npm run release:cdn:dev
npm run release:cdn:dev:upload
```

That publishes an engineer-only dev script to:

- `agent/dev/qredex-agent.iife.min.js`
- `agent/dev/qredex-agent.iife.min.js.map`
- `agent/dev/manifest.json`

The dev bundle always bakes in this fixed local Core endpoint:

```text
http://127.0.0.1:8080/api/v1/agent/intents/lock
```

Use it only for same-machine local Core E2E. It is intentionally separate from
the hosted `staging` and `production` channels.

Use `npm run release:cdn:verify` to read back:

- `agent/manifest.json` for the current production version and major alias
- `agent/releases.json` for known pinned production releases

All channel manifests now include `updatedAt` so release freshness is visible
without relying on bucket UI caching behavior.

Release history is tracked from the first production CDN upload after this feature lands.
Older pinned versions are not inferred retroactively unless they are added back manually.

Because `release:cdn:verify` and `release:cdn:backfill` require the production
bucket environment, the easiest way to run them is in GitHub Actions:

- use the `Verify CDN` workflow for read-only verification
- optionally pass `backfill_versions`, for example `1.0.0,1.0.1`, to backfill
  older pinned versions only if their `agent/v<version>/...` objects still
  exist in R2

## Staging CDN

```bash
npm run release:cdn:staging
npm run release:cdn:staging:upload
```

## Dev CDN Workflow

GitHub Actions runs `.github/workflows/dev.yml` on pushes to `main` and on manual dispatch.

It:

1. runs lint, browser smoke, and unit tests
2. builds the fixed-localhost dev CDN bundle
3. uploads `agent/dev/...` assets to Cloudflare R2

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
