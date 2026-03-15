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
 *  Licensed under the Apache License, Version 2.0. See LICENSE for the full license text.
 *  You may not use this file except in compliance with that License.
 *  Unless required by applicable law or agreed to in writing, software distributed under the
 *  License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
 *  either express or implied. See the License for the specific language governing permissions
 *  and limitations under the License.
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
