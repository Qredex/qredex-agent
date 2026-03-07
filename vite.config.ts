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
        // Only drop console in production mode
        drop_console: mode === 'production',
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
