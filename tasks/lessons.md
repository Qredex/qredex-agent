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

  Licensed under the MIT License. See LICENSE for the full license text.
  Redistribution and use are permitted under that license.

  If you need additional information or have any questions, please email: copyright@qredex.com
-->

# Lessons

- 2026-03-13: Do not rely on Mermaid for npm-facing package READMEs. Use committed SVG assets instead.
- 2026-03-13: Do not expose internal endpoint selection or storage keys as public merchant runtime configuration.
- 2026-03-13: When npm Trusted Publishing has a documented npm CLI minimum, pin that npm version in CI instead of assuming the bundled npm from the chosen Node version is sufficient.
- 2026-03-13: CDN verification commands that depend on protected bucket configuration should have a first-class GitHub Actions path, not just a local npm script.
- 2026-03-13: In integration docs, do not phrase PIT as something Qredex "needs" in the order payload; Qredex creates PIT on lock, and the merchant/backend needs to forward that PIT with the order.
- 2026-03-13: When fixing SVG label overlap, check the actual text and box coordinates. If text baseline equals or nearly equals the box edge, move the whole lane farther away instead of making only tiny y-offset tweaks.
- 2026-03-13: In sequence diagrams, arrow origin is part of the product contract. If the merchant owns order submission, the order arrow must start from the merchant lane, not the QredexAgent lane.
- 2026-03-14: When documenting optional manual init for CDN/script-tag usage, explicitly state that auto-init and automatic IIT capture remain the default and recommended path. Do not let the docs imply merchants should manually capture IIT.
