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

import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname, join } from 'node:path';

const rootDir = process.cwd();
const port = Number(process.env.PORT || 3000);

const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
};

function getContentType(filePath) {
  return contentTypes[extname(filePath)] || 'application/octet-stream';
}

function toFilePath(urlPathname) {
  const pathname = urlPathname === '/' ? '/examples/index.html' : decodeURIComponent(urlPathname);
  const resolvedPath = resolve(rootDir, `.${pathname}`);
  if (!resolvedPath.startsWith(rootDir)) {
    return null;
  }
  return resolvedPath;
}

const server = createServer(async (request, response) => {
  try {
    const requestUrl = new URL(request.url || '/', `http://${request.headers.host || '127.0.0.1'}`);
    let filePath = toFilePath(requestUrl.pathname);

    if (!filePath) {
      response.writeHead(403);
      response.end('Forbidden');
      return;
    }

    const fileStat = await stat(filePath).catch(() => null);
    if (fileStat?.isDirectory()) {
      filePath = join(filePath, 'index.html');
    }

    const body = await readFile(filePath);
    response.writeHead(200, {
      'Content-Type': getContentType(filePath),
      'Cache-Control': 'no-store',
    });
    response.end(body);
  } catch {
    response.writeHead(404, {
      'Content-Type': 'text/plain; charset=utf-8',
    });
    response.end('Not Found');
  }
});

server.listen(port, '127.0.0.1', () => {
  process.stdout.write(`Static server listening on http://127.0.0.1:${port}\n`);
});
