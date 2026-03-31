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

# Changelog

All notable changes to the Qredex Agent project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.5] - 2026-03-31

### Changed

- Adopted Ota as the canonical repo task runner and aligned the agent contract, task guidance, and local workflow docs ([0a021d6](https://github.com/Qredex/qredex-agent/commit/0a021d6), [620b714](https://github.com/Qredex/qredex-agent/commit/620b714), [f0ecacc](https://github.com/Qredex/qredex-agent/commit/f0ecacc))
- Migrated CI and release workflows to validate and execute Ota tasks, including Node.js 18/20/22 coverage and workflow updates for release and publish paths ([6b30afc](https://github.com/Qredex/qredex-agent/commit/6b30afc))
- Updated release scripts to accept `OTA_INPUT_*` environment variables and improved release task usage guidance ([fe340fd](https://github.com/Qredex/qredex-agent/commit/fe340fd))
- Removed the Bun-only test task from the Ota contract after standardizing on the npm-backed workflow ([326fe3d](https://github.com/Qredex/qredex-agent/commit/326fe3d))
- Added npm keywords to the wrapper packages and kept package versions and dependency ranges aligned at `1.1.5` ([171c2a1](https://github.com/Qredex/qredex-agent/commit/171c2a1))

### Fixed

- Fixed the README link to the local development guide so it uses a repo-relative path instead of a workstation-specific filesystem path ([ce2113b](https://github.com/Qredex/qredex-agent/commit/ce2113b))

## [1.1.4] - 2026-03-17

### Changed

- Updated lint scripts and tested against Node.js 18-22 ([0902541](https://github.com/Qredex/qredex-agent/commit/0902541))
- Added keywords to all package.json files ([1c42bc1](https://github.com/Qredex/qredex-agent/commit/1c42bc1))

### Fixed

- Fixed relative path in README link ([ce2113b](https://github.com/Qredex/qredex-agent/commit/ce2113b))

## [1.1.3] - 2026-03-17

### Changed

- Added Apache-2.0 license headers to all files ([a8a5173](https://github.com/Qredex/qredex-agent/commit/a8a5173), [baf55eb](https://github.com/Qredex/qredex-agent/commit/baf55eb))
- Updated README title formatting ([1670f51](https://github.com/Qredex/qredex-agent/commit/1670f51), [5c1ea9a](https://github.com/Qredex/qredex-agent/commit/5c1ea9a))

## [1.1.2] - 2026-03-17

### Changed

- Migrated license from MIT to Apache-2.0 ([18d129e](https://github.com/Qredex/qredex-agent/commit/18d129e))

## [1.1.1] - 2026-03-17

### Added

- Added development guide for local Core E2E testing ([e9d0547](https://github.com/Qredex/qredex-agent/commit/e9d0547))

### Changed

- Clarified event listeners documentation and added usage guidance ([9004ef3](https://github.com/Qredex/qredex-agent/commit/9004ef3), [1e7d24f](https://github.com/Qredex/qredex-agent/commit/1e7d24f), [18b7f3a](https://github.com/Qredex/qredex-agent/commit/18b7f3a), [e8ee6ed](https://github.com/Qredex/qredex-agent/commit/e8ee6ed), [454a264](https://github.com/Qredex/qredex-agent/commit/454a264))

---

## Release Notes

### Version 1.1.4

This release focuses on infrastructure improvements and documentation fixes:

- **Node.js Compatibility**: Verified lint scripts work across Node.js 18-22
- **Package Discovery**: Added keywords to improve npm discoverability
- **Documentation**: Fixed broken relative path links in README

### Version 1.1.5

This release focused on repo workflow standardization and release hygiene:

- **Ota Adoption**: Standardized the repo task contract and task runner guidance around Ota
- **CI and Release Workflow**: Validated Ota tasks in CI and aligned release/publish workflows with the task contract
- **Release Inputs**: Added `OTA_INPUT_*` support for release scripts and clarified task usage
- **Package Metadata**: Bumped all manifests to `1.1.5`, aligned wrapper dependency ranges, and added npm keywords
- **Docs Cleanup**: Fixed the README local docs link to stay repo-relative

### Version 1.1.3

This release standardizes licensing across the codebase:

- **License Headers**: Added Apache-2.0 copyright headers to all source files
- **README Improvements**: Enhanced title formatting for better readability

### Version 1.1.2

This release updates the project license:

- **License Migration**: Changed from MIT to Apache-2.0 for better patent protection and compatibility

### Version 1.1.1

This release improves developer experience and documentation:

- **Development Guide**: Added comprehensive guide for local Core E2E testing
- **Event Listener Docs**: Clarified usage patterns and added guidance for merchant integrations
