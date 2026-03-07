import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import { resolve } from 'path';

export default defineConfig({
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
        drop_console: false,
        pure_funcs: ['console.debug'],
      },
      format: {
        comments: false,
      },
    },
  },
  define: {
    __DEV__: 'true',
    __VERSION__: JSON.stringify(process.env.npm_package_version || '1.0.0'),
  },
});
