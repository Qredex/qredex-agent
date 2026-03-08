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
 *  This is proprietary and confidential. Unauthorized copying, redistributing
 *  and/or modification of this file via any medium is inexorably prohibited.
 *
 *  If you need additional information or have any questions, please email: copyright@qredex.com
 */

import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import { resolve } from 'path';

export default defineConfig(({ mode }) => ({
  plugins: [
    dts({
      rollupTypes: true,
      entryRoot: 'src',
    }),
  ],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'QredexAgent',
      fileName: (format) => {
        if (format === 'es') {
          return 'qredex-agent.es.js';
        }
        if (format === 'iife') {
          return 'qredex-agent.iife.js';
        }
        return 'qredex-agent.js';
      },
      formats: ['es', 'iife'],
    },
    // Always minify with terser for production builds
    minify: 'terser',
    sourcemap: true,
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        globals: {
          // No external dependencies
        },
      },
    },
    terserOptions: {
      compress: {
        // Don't strip console - runtime guard handles it
        // This allows debug logging in production when enabled via config
        drop_console: false,
        drop_debugger: mode === 'production',
      },
      format: {
        comments: false,
      },
    },
  },
  define: {
    __DEV__: mode === 'development' ? 'true' : 'false',
    __VERSION__: JSON.stringify(process.env.npm_package_version || '1.0.0'),
  },
}));
