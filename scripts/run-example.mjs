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

import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..');
const port = 3000;
const url = `http://localhost:${port}/examples/index.html`;
const shouldOpen = !process.argv.includes('--no-open');

function getNpmCommand() {
  return process.platform === 'win32' ? 'npm.cmd' : 'npm';
}

function getOpenCommand(targetUrl) {
  if (process.platform === 'darwin') {
    return ['open', [targetUrl]];
  }

  if (process.platform === 'win32') {
    return ['cmd', ['/c', 'start', '', targetUrl]];
  }

  return ['xdg-open', [targetUrl]];
}

function runCommand(command, args, label) {
  return new Promise((resolvePromise, rejectPromise) => {
    const child = spawn(command, args, {
      cwd: repoRoot,
      stdio: 'inherit',
    });

    child.once('error', rejectPromise);
    child.once('exit', (code) => {
      if (code === 0) {
        resolvePromise();
        return;
      }

      rejectPromise(new Error(`${label} failed with exit code ${code ?? 'unknown'}`));
    });
  });
}

async function waitForServer(targetUrl) {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    if (await isServerReady(targetUrl)) {
      return;
    }

    await delay(250);
  }

  throw new Error(`Examples server did not become ready at ${targetUrl}`);
}

async function isServerReady(targetUrl) {
  try {
    const response = await fetch(targetUrl, { method: 'GET' });
    return response.ok;
  } catch {
    return false;
  }
}

async function openBrowser(targetUrl) {
  if (!shouldOpen) {
    return;
  }

  const [command, args] = getOpenCommand(targetUrl);
  try {
    await runCommand(command, args, 'Browser open');
  } catch {
    process.stdout.write(`Open this URL manually: ${targetUrl}\n`);
  }
}

async function main() {
  await runCommand(getNpmCommand(), ['run', 'build:dev'], 'Development build');

  if (await isServerReady(url)) {
    await openBrowser(url);
    process.stdout.write(`Example ready at ${url}\n`);
    return;
  }

  const server = spawn(getNpmCommand(), ['run', 'example:serve'], {
    cwd: repoRoot,
    stdio: 'inherit',
  });

  const shutdown = () => {
    if (!server.killed) {
      server.kill('SIGINT');
    }
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
  process.on('exit', shutdown);

  await waitForServer(url);
  await openBrowser(url);
  process.stdout.write(`Example ready at ${url}\n`);

  await new Promise((resolvePromise, rejectPromise) => {
    server.once('exit', (code, signal) => {
      if (signal === 'SIGINT' || code === 0 || code === 130) {
        resolvePromise();
        return;
      }

      rejectPromise(new Error(`Examples server exited unexpectedly (${signal ?? code ?? 'unknown'})`));
    });
  });
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
