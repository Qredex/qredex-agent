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
    // Always minify for production builds
    minify: mode === 'development' ? false : 'terser',
    sourcemap: mode !== 'development',
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
        // Drop console.debug in production
        pure_funcs: ['console.log', 'console.info', 'console.warn', 'console.error'],
        drop_console: true,
        drop_debugger: true,
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
