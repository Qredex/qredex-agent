/**
 * Bun build script for qredex-agent.
 * Produces minified ESM and UMD bundles with type definitions.
 */

import { $ } from 'bun';
import { existsSync, mkdirSync, rmSync } from 'fs';
import { join } from 'path';

const __dirname = import.meta.dir;
const distDir = join(__dirname, 'dist');
const srcDir = join(__dirname, 'src');

// Clean dist directory
if (existsSync(distDir)) {
  rmSync(distDir, { recursive: true });
}
mkdirSync(distDir);

const mode = process.env.BUN_MODE || 'production';
const isDev = mode === 'development';

console.log(`Building qredex-agent in ${mode} mode...`);

// Build ESM bundle
console.log('Building ESM bundle...');
await $`bun build ${srcDir}/index.ts --target browser --format esm --minify --sourcemap --outfile ${distDir}/qredex-agent.js`.quiet();

// Build UMD bundle
console.log('Building UMD bundle...');
await $`bun build ${srcDir}/index.ts --target browser --format iife --minify --sourcemap --global-name QredexAgent --outfile ${distDir}/qredex-agent.umd.cjs`.quiet();

// Generate type definitions using tsc
console.log('Generating type definitions...');
await $`bun run tsc --project tsconfig.build.json`.quiet();

// Get file sizes
const { gzipSync } = await import('zlib');
const { readFileSync } = await import('fs');

function getFileStats(file: string) {
  const content = readFileSync(file);
  const gzipped = gzipSync(content);
  return {
    size: (content.length / 1024).toFixed(2),
    gzip: (gzipped.length / 1024).toFixed(2),
  };
}

const esmStats = getFileStats(join(distDir, 'qredex-agent.js'));
const umdStats = getFileStats(join(distDir, 'qredex-agent.umd.cjs'));

console.log('');
console.log('Build complete!');
console.log(`  qredex-agent.js       ${esmStats.size} KB │ gzip: ${esmStats.gzip} KB`);
console.log(`  qredex-agent.umd.cjs  ${umdStats.size} KB │ gzip: ${umdStats.gzip} KB`);
console.log('');
