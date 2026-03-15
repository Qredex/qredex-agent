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

# Contributing

## Setup

```bash
npm ci
```

## Required Checks

Run these before opening a pull request:

```bash
npm run test
npm run build
```

Run this too when you change the examples or wrapper integration flow:

```bash
npm run test:browser
```

## Contribution Rules

- keep changes narrow and deterministic
- update docs when public behavior changes
- add regression tests for behavior fixes
- do not commit built secrets, tokens, or private credentials
- do not remove public API compatibility without documenting the break

## Release Notes

- npm publishing and CDN release flow are documented in [`docs/RELEASE.md`](docs/RELEASE.md)
- public package docs live in the package `README.md` files
