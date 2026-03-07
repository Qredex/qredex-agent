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
          return 'qredex-agent.js';
        }
        if (format === 'umd') {
          return 'qredex-agent.umd.cjs';
        }
        return 'qredex-agent.js';
      },
      formats: ['es', 'umd'],
    },
    // Always minify with terser
    minify: 'terser',
    sourcemap: true,
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        globals: {
          // No external dependencies, but this ensures proper UMD wrapping
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
