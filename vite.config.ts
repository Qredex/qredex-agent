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

import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import { resolve } from 'path';

function resolveRuntimeEnvironment(mode: string): 'development' | 'staging' | 'production' | 'test' {
  if (mode === 'development') {
    return 'development';
  }
  if (mode === 'staging') {
    return 'staging';
  }
  if (mode === 'test') {
    return 'test';
  }
  return 'production';
}

function resolveBuildTimeLockEndpoint(mode: string): string {
  if (resolveRuntimeEnvironment(mode) === 'production') {
    return '';
  }

  return process.env.QREDEX_AGENT_LOCK_ENDPOINT || '';
}

export default defineConfig(({ mode }) => {
  return {
    plugins: [
      dts({
        entryRoot: 'src',
      }),
    ],
    build: {
      lib: {
        entry: resolve(__dirname, 'src/index.ts'),
        fileName: () => 'qredex-agent.es.js',
        formats: ['es'],
      },
      minify: 'terser',
      sourcemap: true,
      outDir: 'dist',
      emptyOutDir: true,
      terserOptions: {
        compress: {
          drop_console: false,
          drop_debugger: mode === 'production',
        },
        format: {
          comments: false,
        },
      },
    },
    define: {
      __QDX_ENV__: JSON.stringify(resolveRuntimeEnvironment(mode)),
      __QDX_LOCK_ENDPOINT__: JSON.stringify(resolveBuildTimeLockEndpoint(mode)),
      __VERSION__: JSON.stringify(process.env.npm_package_version || '1.0.0'),
    },
  };
});
