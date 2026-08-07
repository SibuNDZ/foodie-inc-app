/**
 * Checks every photo id in the image manifest still resolves to a real image.
 *
 * External CDN links rot. This turns that into a fast, explicit check rather than
 * something a customer discovers as a broken tile on the home page.
 *
 * Usage: npm run verify:images
 */
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const manifestPath = join(here, '..', 'src', 'assets', 'images', 'manifest.ts');

const source = await readFile(manifestPath, 'utf8');
const ids = [...source.matchAll(/id:\s*'(photo-[\w-]+)'/g)].map(m => m[1]);

if (!ids.length) {
  console.error('No photo ids found in the manifest. Has its shape changed?');
  process.exit(1);
}

const check = async id => {
  const url = `https://images.unsplash.com/${id}?w=400&q=70&auto=format&fit=crop`;
  try {
    const res = await fetch(url, { method: 'HEAD', redirect: 'follow' });
    const type = res.headers.get('content-type') ?? '';
    return { id, ok: res.ok && type.startsWith('image/'), detail: `${res.status} ${type}` };
  } catch (err) {
    return { id, ok: false, detail: err.message };
  }
};

const results = await Promise.all(ids.map(check));
const bad = results.filter(r => !r.ok);

for (const r of results) {
  console.log(`${r.ok ? 'ok  ' : 'FAIL'}  ${r.id}  ${r.detail}`);
}

console.log(`\n${results.length - bad.length}/${results.length} image URLs healthy`);

if (bad.length) {
  console.error(`\n${bad.length} image URL(s) no longer resolve. Replace them in the manifest.`);
  process.exit(1);
}
