#!/usr/bin/env node
// Check a built site before it is published. Exits non-zero on any failure.
//
//   node tools/verify.mjs <build dir> [--forbid <text>]... [--complete]
//
// --forbid   fail if <text> appears in any file (tools/check-default uses this)
// --complete fail if any tool is still a "not ported yet" placeholder
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';

const args = process.argv.slice(2);
const dir = args.find((a, i) => !a.startsWith('--') && args[i - 1] !== '--forbid');
const forbidden = args.flatMap((a, i) => (args[i - 1] === '--forbid' ? [a] : []));
const complete = args.includes('--complete');
if (!dir || !existsSync(dir)) {
  console.error('usage: node tools/verify.mjs <build dir> [--forbid <text>]... [--complete]');
  process.exit(2);
}

const failures = [];
const warnings = [];
const fail = (file, msg) => failures.push(`${relative(dir, file) || file}: ${msg}`);

const walk = (d) =>
  readdirSync(d).flatMap((name) => {
    const p = join(d, name);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
const files = walk(dir);
const html = files.filter((f) => f.endsWith('.html'));

// 1. Nothing inline. The CSP is script-src/style-src 'self' with no unsafe-inline.
for (const file of html) {
  const text = readFileSync(file, 'utf8');
  for (const tag of text.match(/<[a-zA-Z][^>]*>/g) ?? []) {
    if (/^<script\b/i.test(tag) && !/\ssrc=/i.test(tag)) fail(file, `inline script: ${tag}`);
    if (/^<style\b/i.test(tag)) fail(file, 'inline <style> block');
    if (/\sstyle=/i.test(tag)) fail(file, `style attribute: ${tag.slice(0, 80)}`);
    const handler = tag.match(/\s(on[a-z]+)=/i);
    if (handler) fail(file, `inline event handler ${handler[1]}: ${tag.slice(0, 80)}`);
  }
}

// 2. Exactly the enabled tools have pages, and the sitemap lists every page.
const indexPath = join(dir, 'search.json');
const tools = existsSync(indexPath) ? JSON.parse(readFileSync(indexPath, 'utf8')) : null;
if (!tools) fail(indexPath, 'missing');
else {
  const ids = new Set(tools.map((t) => t.id));
  for (const id of ids) {
    const page = join(dir, id, 'index.html');
    if (!existsSync(page)) fail(page, `enabled tool "${id}" has no page`);
    else if (readFileSync(page, 'utf8').includes('class="warn" data-placeholder')) {
      (complete ? failures : warnings).push(`${id}: not ported yet`);
    }
  }
  for (const name of readdirSync(dir)) {
    if (existsSync(join(dir, name, 'index.html')) && !ids.has(name)) {
      fail(join(dir, name), 'page for a tool that is not enabled');
    }
  }
  const sitemaps = files.filter((f) => /sitemap-\d+\.xml$/.test(f));
  const listed = sitemaps.map((f) => readFileSync(f, 'utf8')).join('');
  for (const id of ids) {
    if (!listed.includes(`/${id}/</loc>`)) fail(join(dir, 'sitemap-0.xml'), `missing /${id}/`);
  }
}

// 3. Strings that must not be in this build.
for (const needle of forbidden) {
  for (const file of files.filter((f) => /\.(html|js|css|json|txt|xml|svg|webmanifest)$/.test(f))) {
    if (readFileSync(file, 'utf8').includes(needle)) fail(file, `contains "${needle}"`);
  }
}

for (const w of warnings) console.warn(`warning: ${w}`);
if (failures.length) {
  for (const f of failures) console.error(`FAIL ${f}`);
  console.error(`\n${failures.length} problem(s) in ${dir}`);
  process.exit(1);
}
const pending = warnings.length ? `, ${warnings.length} tool(s) not ported yet` : '';
console.log(`Verified ${dir}: ${html.length} pages${pending}.`);
