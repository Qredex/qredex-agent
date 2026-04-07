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

import { readFileSync, writeFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, '..');

const versionInput = process.env.OTA_INPUT_VERSION ?? process.argv[2];

if (!versionInput) {
  console.error('Usage: ota run release:version --version major|minor|patch|<x.y.z>');
  console.error('Or: npm run release:version -- <major|minor|patch|x.y.z>');
  process.exit(1);
}

const rootPackagePath = resolve(rootDir, 'package.json');
const rootPackageJson = JSON.parse(readFileSync(rootPackagePath, 'utf8'));
const currentVersion = rootPackageJson.version;

const bumpVersion = (current, selector) => {
  const [major, minor, patchWithSuffix = '0'] = current.split('.');
  const patch = Number.parseInt(patchWithSuffix, 10);

  switch (selector) {
    case 'major':
      return `${Number.parseInt(major, 10) + 1}.0.0`;
    case 'minor':
      return `${major}.${Number.parseInt(minor, 10) + 1}.0`;
    case 'patch':
      return `${major}.${minor}.${patch + 1}`;
    default:
      return selector;
  }
};

const version = ['major', 'minor', 'patch'].includes(versionInput)
  ? bumpVersion(currentVersion, versionInput)
  : versionInput.replace(/^v/, '');

if (!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/.test(version)) {
  console.error(`Invalid semver version: ${versionInput}`);
  process.exit(1);
}

const packagePaths = [
  'package.json',
  'packages/react/package.json',
  'packages/vue/package.json',
  'packages/svelte/package.json',
  'packages/angular/package.json',
];

for (const packagePath of packagePaths) {
  const absolutePath = resolve(rootDir, packagePath);
  const packageJson = JSON.parse(readFileSync(absolutePath, 'utf8'));

  packageJson.version = version;

  if (packageJson.dependencies?.['@qredex/agent']) {
    packageJson.dependencies['@qredex/agent'] = `^${version}`;
  }

  writeFileSync(absolutePath, `${JSON.stringify(packageJson, null, 2)}\n`);
  console.log(`✓ Updated ${packagePath} to ${version}`);
}
