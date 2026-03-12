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

import { defineConfig } from 'vite';
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

export default defineConfig(({ mode }) => ({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/iife.ts'),
      name: 'QredexAgent',
      fileName: () => 'qredex-agent.iife.js',
      formats: ['iife'],
    },
    minify: 'terser',
    sourcemap: true,
    outDir: 'dist',
    emptyOutDir: false,
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
    __VERSION__: JSON.stringify(process.env.npm_package_version || '1.0.0'),
  },
}));
