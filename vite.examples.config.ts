/**
 *    ▄▄▄▄
 *  ▄█▀▀███▄▄              █▄
 *  ██    ██ ▄             ██
 *  ██    ██ ████▄▄█▀█▄ ▄████ ▄█▀█▄▀██ ██▀
 *  ██  ▄ ██ ██   ██▄█▀ ██ ██ ██▄█▀  ███
 *   ▀█████▄▄█▀  ▄▀█▄▄▄▄█▀███▄▀█▄▄▄▄██ ██▄
 *        ▀█
 *
 *  Copyright (C) 2026 — 2026, Qredex, LTD. All Rights Reserved.
 *
 *  DO NOT ALTER OR REMOVE COPYRIGHT NOTICES OR THIS FILE HEADER.
 *
 *  This file is part of the Qredex Agent SDK and is licensed under the MIT License. See LICENSE.
 *  Redistribution and use are permitted under that license.
 *
 *  If you need additional information or have any questions, please email: copyright@qredex.com
 */

import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import vue from '@vitejs/plugin-vue';
import { svelte } from '@sveltejs/vite-plugin-svelte';

function resolveRuntimeEnvironment(mode: string): 'development' | 'staging' | 'production' | 'test' {
  if (mode === 'staging') {
    return 'staging';
  }
  if (mode === 'test') {
    return 'test';
  }
  if (mode === 'production') {
    return 'production';
  }
  return 'development';
}

function resolveBuildTimeLockEndpoint(mode: string): string {
  if (resolveRuntimeEnvironment(mode) === 'production') {
    return '';
  }

  return process.env.QREDEX_AGENT_LOCK_ENDPOINT || '';
}

export default defineConfig(({ mode }) => ({
  appType: 'mpa',
  plugins: [react(), vue(), svelte()],
  resolve: {
    alias: {
      '@qredex/agent': resolve(__dirname, 'src/index.ts'),
      '@qredex/react': resolve(__dirname, 'packages/react/src/index.ts'),
      '@qredex/vue': resolve(__dirname, 'packages/vue/src/index.ts'),
      '@qredex/svelte': resolve(__dirname, 'packages/svelte/src/index.ts'),
      '@qredex/angular': resolve(__dirname, 'packages/angular/src/index.ts'),
    },
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom/client',
      'vue',
      'svelte',
      '@angular/common',
      '@angular/compiler',
      '@angular/core',
      '@angular/platform-browser',
      'rxjs',
      'zone.js',
    ],
  },
  build: {
    rollupOptions: {
      input: {
        examples: resolve(__dirname, 'examples/index.html'),
        cdn: resolve(__dirname, 'examples/cdn/index.html'),
        react: resolve(__dirname, 'examples/wrappers/react/index.html'),
        vue: resolve(__dirname, 'examples/wrappers/vue/index.html'),
        svelte: resolve(__dirname, 'examples/wrappers/svelte/index.html'),
        angular: resolve(__dirname, 'examples/wrappers/angular/index.html'),
      },
    },
  },
  define: {
    __QDX_ENV__: JSON.stringify(resolveRuntimeEnvironment(mode)),
    __QDX_LOCK_ENDPOINT__: JSON.stringify(resolveBuildTimeLockEndpoint(mode)),
    __VERSION__: JSON.stringify(process.env.npm_package_version || '1.0.0'),
  },
  esbuild: {
    tsconfigRaw: {
      compilerOptions: {
        experimentalDecorators: true,
        useDefineForClassFields: false,
      },
    },
  },
}));
