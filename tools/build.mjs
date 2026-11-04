import { readFile, readdir, writeFile, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const srcDir = join(root, 'src');
const outFile = join(root, 'plugin', 'client.js');

const names = (await readdir(srcDir)).filter((n) => n.endsWith('.js')).sort();
const parts = [];
for (const name of names) {
  const text = await readFile(join(srcDir, name), 'utf8');
  parts.push('/* ==== ' + name + ' ==== */\n' + text.replace(/\s+$/, '') + '\n');
}
const out = parts.join('\n');
await mkdir(dirname(outFile), { recursive: true });
await writeFile(outFile, out, 'utf8');
console.log('built ' + outFile + ' from ' + names.length + ' sources (' + out.length + ' chars)');
