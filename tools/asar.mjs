// Minimal ASAR reader: list entries and extract files.
// Usage:
//   node tools/asar.mjs list <asar> [substring]
//   node tools/asar.mjs extract <asar> <entryPath> <outFile>
import fs from 'node:fs';
import path from 'node:path';

const [cmd, asarPath, ...rest] = process.argv.slice(2);

function readHeader(file) {
  const fd = fs.openSync(file, 'r');
  const head = Buffer.alloc(16);
  fs.readSync(fd, head, 0, 16, 0);
  const headerSize = head.readUInt32LE(4);
  const jsonSize = head.readUInt32LE(12);
  const json = Buffer.alloc(jsonSize);
  fs.readSync(fd, json, 0, jsonSize, 16);
  fs.closeSync(fd);
  return { header: JSON.parse(json.toString('utf8')), base: 8 + headerSize, jsonEnd: 16 + jsonSize };
}

function walk(node, prefix, out) {
  for (const [name, entry] of Object.entries(node.files || {})) {
    const p = prefix ? prefix + '/' + name : name;
    if (entry.files) walk(entry, p, out);
    else out.push({ path: p, size: entry.size, offset: entry.offset, unpacked: !!entry.unpacked });
  }
}

const { header, base } = readHeader(asarPath);
const files = [];
walk(header, '', files);

if (cmd === 'list') {
  const needle = (rest[0] || '').toLowerCase();
  const hits = files.filter((f) => f.path.toLowerCase().includes(needle));
  for (const f of hits) console.log(String(f.size).padStart(9), f.unpacked ? 'U' : ' ', f.path);
  console.log(`total ${files.length} entries, ${hits.length} matched`);
} else if (cmd === 'extract-all') {
  const outDir = rest[0];
  const filter = rest[1] ? rest[1].toLowerCase() : '';
  const fd = fs.openSync(asarPath, 'r');
  let n = 0;
  for (const f of files) {
    if (filter && !f.path.toLowerCase().includes(filter)) continue;
    if (f.unpacked) continue;
    const dest = path.join(outDir, f.path);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    const buf = Buffer.alloc(f.size);
    fs.readSync(fd, buf, 0, f.size, base + Number(f.offset));
    fs.writeFileSync(dest, buf);
    n++;
  }
  fs.closeSync(fd);
  console.log(`extracted ${n} files -> ${outDir}`);
} else if (cmd === 'extract') {
  const entry = rest[0].replace(/\\/g, '/');
  const out = rest[1];
  const f = files.find((x) => x.path === entry);
  if (!f) { console.error('not found: ' + entry); process.exit(2); }
  fs.mkdirSync(path.dirname(out), { recursive: true });
  if (f.unpacked) {
    const src = asarPath.replace(/app\.asar$/, 'app.asar.unpacked') + '/' + entry;
    fs.copyFileSync(src, out);
  } else {
    const fd = fs.openSync(asarPath, 'r');
    const buf = Buffer.alloc(f.size);
    fs.readSync(fd, buf, 0, f.size, base + Number(f.offset));
    fs.closeSync(fd);
    fs.writeFileSync(out, buf);
  }
  console.log(`extracted ${f.size} bytes -> ${out}`);
}
