import fs from 'node:fs';
import path from 'node:path';
const dir = 'C:/Users/Administrator/AppData/Roaming/@deepseek-ai/dsh-desktop/Local Storage/leveldb';
const files = fs.readdirSync(dir).filter((f) => f.endsWith('.log') || f.endsWith('.ldb'));
const key = Buffer.from('skin-studio-settings', 'utf8');
let best = null;
for (const f of files) {
  const buf = fs.readFileSync(path.join(dir, f));
  let idx = -1;
  while ((idx = buf.indexOf(key, idx + 1)) >= 0) {
    const tail = buf.subarray(idx + key.length, idx + key.length + 6000);
    const s1 = tail.toString('utf8');
    const s2 = tail.subarray(0, 12000).toString('utf16le');
    for (const s of [s1, s2]) {
      const start = s.indexOf('{"wallpaper');
      if (start < 0) continue;
      let depth = 0, end = -1, inStr = false, esc = false;
      for (let i = start; i < s.length; i++) {
        const ch = s[i];
        if (inStr) { if (esc) esc = false; else if (ch === '\\') esc = true; else if (ch === '"') inStr = false; continue; }
        if (ch === '"') inStr = true;
        else if (ch === '{') depth++;
        else if (ch === '}') { depth--; if (depth === 0) { end = i + 1; break; } }
      }
      if (end < 0) continue;
      try {
        const obj = JSON.parse(s.slice(start, end));
        if (!best || (obj.__seq || 0) >= 0) best = obj;
        globalThis.__last = obj;
      } catch (e) { /* ignore */ }
    }
  }
}
if (globalThis.__last) {
  const o = globalThis.__last;
  console.log(JSON.stringify({
    keys: Object.keys(o),
    wallpaper: o.wallpaper,
    music: { tracks: (o.music || {}).tracks, current: (o.music || {}).current, volume: (o.music || {}).volume, mini: (o.music || {}).mini },
    appearance: o.appearance,
    chat: o.chat,
    pet: o.pet,
    layout: o.layout,
  }, null, 1).slice(0, 2000));
} else {
  console.log('no settings found');
}