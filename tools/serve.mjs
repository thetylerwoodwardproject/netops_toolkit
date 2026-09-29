#!/usr/bin/env node
// A small static file server for a built NetOps Toolkit, with no dependencies.
//
//   node tools/serve.mjs [dist dir]        (default: ./dist)
//
//   PORT  listen port (default 4321)
//   HOST  listen address (default 127.0.0.1; the Docker image sets 0.0.0.0)
//
// It sends the same headers as deploy/nginx.conf.example, including the
// Content Security Policy the site is built for. TLS and HSTS belong to
// whatever sits in front of it (Caddy, nginx, a load balancer).
//
// The directory may be a symlink, as `dist` is after tools/publish. It is
// resolved on every request, so a new release is live as soon as the link
// moves, with no restart.
import { createServer } from 'node:http';
import {
  createReadStream,
  existsSync,
  readdirSync,
  readFileSync,
  realpathSync,
  statSync,
} from 'node:fs';
import { extname, join, resolve, sep } from 'node:path';
import { gzipSync } from 'node:zlib';

const PORT = Number(process.env.PORT ?? 4321);
const HOST = process.env.HOST ?? '127.0.0.1';
const LINK = resolve(process.argv[2] ?? 'dist');

if (!existsSync(LINK)) {
  console.error(`No build at ${LINK}. Run tools/publish first.`);
  process.exit(1);
}

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
};
const COMPRESSIBLE = /^(text\/|application\/(json|manifest\+json|xml)|image\/svg)/;

// The third-party services a tool may call. connect-src lists only the ones the
// build actually contains, so a site built with externalLookups off gets 'self'.
const LOOKUP_HOSTS = [
  'https://api.ipify.org',
  'https://api4.ipify.org',
  'https://api6.ipify.org',
  'https://ipapi.co',
  'https://dns.google',
];
const policies = new Map(); // real dist path -> CSP string
function policyFor(root) {
  let csp = policies.get(root);
  if (csp) return csp;
  const dir = join(root, '_astro');
  const code = existsSync(dir)
    ? readdirSync(dir)
        .filter((f) => f.endsWith('.js'))
        .map((f) => readFileSync(join(dir, f), 'utf8'))
        .join('\n')
    : '';
  const connect = ["'self'", ...LOOKUP_HOSTS.filter((h) => code.includes(h))].join(' ');
  csp =
    "default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; " +
    "form-action 'self'; script-src 'self'; style-src 'self'; font-src 'self'; " +
    `img-src 'self' data:; manifest-src 'self'; connect-src ${connect}`;
  policies.set(root, csp);
  return csp;
}

function fileFor(root, pathname) {
  let rel;
  try {
    rel = decodeURIComponent(pathname);
  } catch {
    return null;
  }
  if (rel.includes('\0')) return null;
  // Dotfiles and dot directories are never served.
  if (rel.split('/').some((part) => part.startsWith('.'))) return null;
  const file = resolve(root, '.' + rel);
  if (file !== root && !file.startsWith(root + sep)) return null;
  return file;
}

const isFile = (p) => {
  try {
    return statSync(p).isFile();
  } catch {
    return false;
  }
};
const isDir = (p) => {
  try {
    return statSync(p).isDirectory();
  } catch {
    return false;
  }
};

const server = createServer((req, res) => {
  const root = realpathSync(LINK);
  const headers = {
    'Content-Security-Policy': policyFor(root),
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
  };
  const send = (status, extra = {}, body = '') => {
    res.writeHead(status, { ...headers, ...extra });
    res.end(req.method === 'HEAD' ? undefined : body);
  };

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return send(405, { Allow: 'GET, HEAD' });
  }

  const url = new URL(req.url ?? '/', 'http://localhost');
  let file = fileFor(root, url.pathname);
  let status = 200;

  if (file && isDir(file)) {
    // trailingSlash is 'always' in the build, so /foo redirects to /foo/.
    if (!url.pathname.endsWith('/')) {
      return send(301, { Location: `${url.pathname}/${url.search}` });
    }
    file = join(file, 'index.html');
  }
  if (!file || !isFile(file)) {
    file = join(root, '404.html');
    status = 404;
  }
  if (!isFile(file)) return send(status, { 'Content-Type': 'text/plain' }, 'Not found\n');

  const info = statSync(file);
  const type = TYPES[extname(file).toLowerCase()] ?? 'application/octet-stream';
  const fingerprinted = url.pathname.startsWith('/_astro/');
  headers['Content-Type'] = type;
  headers['Cache-Control'] = fingerprinted ? 'public, max-age=31536000, immutable' : 'no-cache';
  headers['Vary'] = 'Accept-Encoding';

  if (status === 200) {
    const etag = `W/"${info.size.toString(16)}-${Math.floor(info.mtimeMs).toString(16)}"`;
    headers['ETag'] = etag;
    if (req.headers['if-none-match'] === etag) return send(304);
  }

  const gzip = COMPRESSIBLE.test(type) && /\bgzip\b/.test(req.headers['accept-encoding'] ?? '');
  if (gzip) {
    const body = gzipSync(readFileSync(file));
    headers['Content-Encoding'] = 'gzip';
    headers['Content-Length'] = body.length;
    res.writeHead(status, headers);
    return res.end(req.method === 'HEAD' ? undefined : body);
  }
  headers['Content-Length'] = info.size;
  res.writeHead(status, headers);
  if (req.method === 'HEAD') return res.end();
  createReadStream(file)
    .on('error', () => res.destroy())
    .pipe(res);
});

server.listen(PORT, HOST, () => {
  console.log(`NetOps Toolkit: http://${HOST}:${PORT}/ (serving ${LINK})`);
});

for (const signal of ['SIGINT', 'SIGTERM'])
  process.on(signal, () => server.close(() => process.exit(0)));
