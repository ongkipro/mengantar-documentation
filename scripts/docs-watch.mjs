#!/usr/bin/env node
// docs-watch — change detector for the official Mengantar Public API docs (v2, Markdown per page).
// Source of truth: https://api-public.mengantar.com/docs/llms.txt (production host). The sandbox host is compared
// as information only (it can lag or differ). Snapshot: docs/official-snapshot/{llms.txt,en/*.md,id/*.md}.
//   node scripts/docs-watch.mjs            exit 0 = unchanged, 1 = changed (list printed), 2 = fetch/format failure
//   node scripts/docs-watch.mjs --update   download everything first, validate, then rewrite the snapshot (all-or-nothing)
import { readFile, writeFile, mkdir, readdir, rm } from 'node:fs/promises';
import { dirname } from 'node:path';
import { createHash } from 'node:crypto';

const BASE = 'https://api-public.mengantar.com/docs';
const MIRROR = 'https://sandbox.mengantar.com/docs';
const SNAP = 'docs/official-snapshot';
const LANGS = ['en', 'id'];
const write = process.argv.includes('--update');
const sha = (s) => createHash('sha256').update(s).digest('hex').slice(0, 12);
const fail = (m) => { console.error(`FAIL  ${m}\nnothing was written`); process.exit(2); };

async function get(url, soft = false) {
  let res, text;
  try {
    res = await fetch(url, { signal: AbortSignal.timeout(20_000) });
    if (!res.ok) { if (soft) return null; fail(`${url}: HTTP ${res.status}`); }
    text = await res.text();
  } catch (e) { if (soft) return null; fail(`${url}: ${e.name}`); }
  if (!text.trim() || /^\s*<!doctype\s+html|^\s*<html/i.test(text)) { if (soft) return null; fail(`${url}: empty or HTML (expected Markdown)`); }
  return text;
}

const llms = await get(`${BASE}/llms.txt`);
const pages = new Set();
for (const [, link] of llms.matchAll(/\]\(([^)\s]+)\)/g)) {
  const m = /^\/docs\/(en|id)\/([a-z0-9-]+)\.md$/.exec(link);
  if (!m) fail(`unrecognised index link "${link}" (format changed? update scripts/docs-watch.mjs)`);
  pages.add(m[2]);
}
if (pages.size < 20) fail(`index lists only ${pages.size} pages`);

const remote = new Map([['llms.txt', llms]]);
for (const p of pages) for (const l of LANGS) remote.set(`${l}/${p}.md`, await get(`${BASE}/${l}/${p}.md`));

const changes = [];
for (const [f, live] of remote) {
  const local = await readFile(`${SNAP}/${f}`, 'utf8').catch(() => null);
  if (local !== live) changes.push(`${local === null ? 'NEW    ' : 'CHANGED'} ${f} ${local ? sha(local) : '-'} -> ${sha(live)}`);
}
for (const l of LANGS) for (const f of await readdir(`${SNAP}/${l}`).catch(() => [])) {
  if (!remote.has(`${l}/${f}`)) changes.push(`REMOVED ${l}/${f}`);
}

let mirror = 0;
for (const [f, live] of remote) { const t = await get(`${MIRROR}/${f}`, true); if (t !== live) mirror++; }
if (mirror) console.log(`note: ${mirror} file(s) differ on the sandbox host (informational)`);

changes.forEach((c) => console.log(c));
if (!changes.length) { console.log(`official docs = snapshot (${pages.size} pages × ${LANGS.length} languages)`); process.exit(0); }
if (!write) {
  console.log(`\nCHANGED: read the diff (node scripts/docs-watch.mjs --update, then git diff ${SNAP}), sync docs/ spec/ examples/ requests.http CHANGELOG.md.`);
  process.exit(1);
}
for (const l of LANGS) for (const f of await readdir(`${SNAP}/${l}`).catch(() => [])) if (!remote.has(`${l}/${f}`)) await rm(`${SNAP}/${l}/${f}`);
for (const [f, live] of remote) { await mkdir(dirname(`${SNAP}/${f}`), { recursive: true }); await writeFile(`${SNAP}/${f}`, live); }
console.log(`snapshot updated: ${changes.length} change(s). Review git diff ${SNAP}.`);
