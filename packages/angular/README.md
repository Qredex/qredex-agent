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

  This is proprietary and confidential. Unauthorized copying, redistributing
  and/or modification of this file via any medium is inexorably prohibited.

  If you need additional information or have any questions, please email: copyright@qredex.com
-->

# @qredex/angular

Thin Angular bindings for `@qredex/agent`.

## Install

```bash
npm install @qredex/angular @qredex/agent @angular/core
```

## Usage

```ts
import { bootstrapApplication } from '@angular/platform-browser';
import { provideQredex } from '@qredex/angular';

bootstrapApplication(AppComponent, {
  providers: [
    provideQredex(),
  ],
});
```
