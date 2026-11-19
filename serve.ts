// A tiny static server for app/ (Node 22, standard library only), so an entry can be tried
// locally without a build step: `node serve.ts` serves app/ on http://localhost:8080.
// It sends the MIME types an offline web app needs, refuses any path outside app/, and otherwise
// does nothing clever: this is a development convenience, not a web server for the internet.
import { createReadStream, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('./app', import.meta.url)));

function pickPort(): number {
  const args = process.argv.slice(2);
  const flagAt = args.indexOf('--port');
  // --port wins; otherwise PORT (handy for screenshot runs on a fixed port),
  // otherwise the default 8080.
  const wanted = flagAt === -1
    ? Number(process.env.PORT ?? 8080)
    : Number(args[flagAt + 1]);
  return Number.isInteger(wanted) && wanted > 0 && wanted < 65536 ? wanted : 8080;
}

const TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.bin': 'application/octet-stream',
  '.wasm': 'application/wasm',
  '.wav': 'audio/wav',
  '.mp3': 'audio/mpeg',
  '.ogg': 'audio/ogg',
  '.txt': 'text/plain; charset=utf-8',
};

function contentType(file: string): string {
  return TYPES[extname(file).toLowerCase()] ?? 'application/octet-stream';
}

function resolveInside(requestPath: string): { file: string } | { error: number } {
  let pathname: string;
  try {
    pathname = decodeURIComponent(requestPath);
  } catch {
    return { error: 400 };
  }
  if (pathname.endsWith('/')) pathname += 'index.html';
  const file = resolve(join(root, normalize(pathname)));
  if (file !== root && !file.startsWith(root + sep)) return { error: 403 };
  return { file };
}

const port = pickPort();

createServer((request, response) => {
  const resolved = resolveInside(new URL(request.url ?? '/', 'http://localhost').pathname);
  if ('error' in resolved) {
    response.writeHead(resolved.error).end(resolved.error === 403 ? 'forbidden' : 'bad request');
    return;
  }
  const file = resolved.file;
  let size: number;
  try {
    const stats = statSync(file);
    if (!stats.isFile()) throw new Error('not a file');
    size = stats.size;
  } catch {
    response.writeHead(404).end('not found');
    return;
  }
  response.writeHead(200, {
    'content-type': contentType(file),
    'content-length': size,
    'cache-control': 'no-store',
  });
  createReadStream(file).pipe(response);
}).listen(port, '127.0.0.1', () => {
  console.log(`app/ is on http://localhost:${port}`);
});
