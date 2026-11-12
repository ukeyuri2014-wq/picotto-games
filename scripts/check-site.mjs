// Static publication checks. No network calls or game JavaScript execution.
// Missing static anchors are warnings: some game targets are created at runtime.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const base = new URL('https://ukeyuri2014-wq.github.io/picotto-games/');
const errors = [], warnings = [], cache = new Map(), checkedAssets = new Set();
const issue = (list, file, type, detail) => list.push({ file, type, detail });
const decode = value => value.replace(/&(?:amp|quot|apos|lt|gt|#\d+|#x[\da-f]+);/gi, entity => {
  const names = { '&amp;':'&', '&quot;':'"', '&apos;':"'", '&lt;':'<', '&gt;':'>' };
  if (names[entity.toLowerCase()]) return names[entity.toLowerCase()];
  const code = entity[2].toLowerCase() === 'x' ? parseInt(entity.slice(3), 16) : parseInt(entity.slice(2), 10);
  return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : entity;
});
function attrs(tag) {
  const result = {};
  for (const match of tag.matchAll(/([^\s=<>/]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g)) {
    result[match[1].toLowerCase()] = decode(match[2] ?? match[3] ?? match[4] ?? '');
  }
  return result;
}
function parse(file) {
  if (cache.has(file)) return cache.get(file);
  const source = fs.readFileSync(path.join(root, file), 'utf8');
  // Skip comments and script/style bodies, so generated HTML strings do not
  // masquerade as real links or IDs. Inline CSS is checked separately below.
  const markup = source.replace(/<!--[\s\S]*?-->/g, '').replace(/(<(?:script|style)\b[^>]*>)[\s\S]*?(<\/(?:script|style)\s*>)/gi, '$1$2');
  const tags = [...markup.matchAll(/<([a-z][\w:-]*)\b((?:[^>"']|"[^"]*"|'[^']*')*)>/gi)]
    .map(match => ({ name:match[1].toLowerCase(), a:attrs(match[2]) }));
  const ids = new Set(), duplicateIds = [];
  for (const { a } of tags) if (a.id) { if (ids.has(a.id)) duplicateIds.push(a.id); ids.add(a.id); }
  const emptyDefinitions = [...markup.matchAll(/<(dt|dd)\b[^>]*>([\s\S]*?)<\/\1\s*>/gi)]
    .filter(m => !decode(m[2].replace(/<[^>]*>/g, '')).replace(/&nbsp;|\u00a0/g, ' ').trim())
    .map(m => m[1].toLowerCase());
  const doc = { source, tags, ids, duplicateIds, emptyDefinitions, titles:[...markup.matchAll(/<title\b[^>]*>([\s\S]*?)<\/title>/gi)].map(m => decode(m[1]).trim()) };
  cache.set(file, doc);
  return doc;
}
function localTarget(raw, from) {
  if (!raw || /^(?:data|mailto|tel|javascript|blob):/i.test(raw)) return null;
  let url;
  try { url = new URL(raw, new URL(from, base)); } catch { return { invalid:raw }; }
  if (url.origin !== base.origin || !url.pathname.startsWith(base.pathname)) return null;
  let file;
  try { file = decodeURIComponent(url.pathname.slice(base.pathname.length)); } catch { return { invalid:raw }; }
  if (!file || file.endsWith('/')) file += 'index.html';
  const absolute = path.resolve(root, file);
  if (!absolute.startsWith(root + path.sep)) return { invalid:raw };
  let hash;
  try { hash = decodeURIComponent(url.hash.slice(1)); } catch { hash = url.hash.slice(1); }
  return { file, hash, url };
}
function checkRef(raw, from, kind) {
  const target = localTarget(raw, from);
  if (!target) return;
  if (target.invalid) { issue(errors, from, 'invalid-url', raw); return; }
  if (!fs.existsSync(path.join(root, target.file))) { issue(errors, from, 'missing-' + kind, raw); return; }
  if (target.hash && /\.html$/i.test(target.file)) {
    const doc = parse(target.file);
    if (!doc.ids.has(target.hash) && !doc.tags.some(t => t.name === 'a' && t.a.name === target.hash)) {
      issue(warnings, from, 'anchor-not-in-static-html', raw + ' (check runtime-created target)');
    }
  }
  if (/\.css$/i.test(target.file) && !checkedAssets.has(target.file)) {
    checkedAssets.add(target.file);
    checkCss(fs.readFileSync(path.join(root, target.file), 'utf8'), target.file);
  }
}
function checkCss(css, from) {
  for (const match of css.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/url\(\s*(?:"([^"]*)"|'([^']*)'|([^\s)]*))\s*\)/gi)) {
    const ref = match[1] ?? match[2] ?? match[3];
    if (ref && !ref.startsWith('#')) checkRef(ref, from, 'css-asset');
  }
}

const xml = fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8');
const locations = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => decode(match[1]));
const seenUrls = new Set(), seenTitles = new Map();
if (!locations.length) issue(errors, 'sitemap.xml', 'empty-sitemap', 'No loc entries');
for (const location of locations) {
  if (seenUrls.has(location)) issue(errors, 'sitemap.xml', 'duplicate-url', location);
  seenUrls.add(location);
  const target = localTarget(location, 'index.html');
  if (!target || target.invalid) { issue(errors, 'sitemap.xml', 'unexpected-url', location); continue; }
  const file = target.file;
  if (!fs.existsSync(path.join(root, file))) { issue(errors, 'sitemap.xml', 'missing-page', file); continue; }
  const doc = parse(file);
  if (doc.titles.length !== 1 || !doc.titles[0]) issue(errors, file, 'title', 'Expected one nonempty title');
  else if (seenTitles.has(doc.titles[0])) issue(warnings, file, 'duplicate-title', seenTitles.get(doc.titles[0]));
  else seenTitles.set(doc.titles[0], file);
  const descriptions = doc.tags.filter(t => t.name === 'meta' && t.a.name?.toLowerCase() === 'description');
  if (descriptions.length !== 1 || !descriptions[0]?.a.content?.trim()) issue(errors, file, 'description', 'Expected one nonempty description');
  const canonicals = doc.tags.filter(t => t.name === 'link' && t.a.rel?.toLowerCase().split(/\s+/).includes('canonical'));
  if (canonicals.length !== 1 || canonicals[0]?.a.href !== location) issue(errors, file, 'canonical', `Expected ${location}; found ${canonicals.map(t => t.a.href).join(', ')}`);
  for (const id of doc.duplicateIds) issue(errors, file, 'duplicate-id', id);
  for (const tag of doc.emptyDefinitions) issue(warnings, file, 'empty-definition-text', `Empty ${tag}; check FAQ/content or intentional visual-only markup`);
  for (const { name, a } of doc.tags) {
    if (['a','area','link'].includes(name) && a.href) checkRef(a.href, file, name === 'link' ? 'asset' : 'link');
    if (['img','script','iframe','audio','video','source','track','input','embed'].includes(name) && a.src) checkRef(a.src, file, 'asset');
    if (a.poster) checkRef(a.poster, file, 'poster');
    if (a.srcset && !a.srcset.includes('data:')) for (const candidate of a.srcset.split(',')) checkRef(candidate.trim().split(/\s+/)[0], file, 'srcset');
    if (a.style) checkCss(a.style, file);
  }
  for (const match of doc.source.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)) checkCss(match[1], file);
}
const report = { checkedPages:locations.length, checkedStylesheets:checkedAssets.size, errors, warnings,
  limits:['Static HTML only; runtime-generated links and JS assets are not executed.', 'External links are not requested.', 'Anchor warnings require runtime review; they are not automatically broken links.'] };
if (process.argv.includes('--json')) console.log(JSON.stringify(report, null, 2));
else {
  console.log(`Site check: ${report.checkedPages} sitemap pages, ${report.checkedStylesheets} stylesheets, ${errors.length} errors, ${warnings.length} warnings.`);
  for (const [label, list] of [['ERROR', errors], ['WARN', warnings]]) for (const item of list) console.log(`${label} ${item.file}: ${item.type}: ${item.detail}`);
}
process.exitCode = errors.length ? 1 : 0;
