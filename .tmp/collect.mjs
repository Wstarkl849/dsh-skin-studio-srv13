import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const dir = path.resolve('.tmp/logs');
fs.mkdirSync(dir, { recursive: true });
const cmdFile = path.resolve('.tmp/cmd.json');
let n = 0;

const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://127.0.0.1');
  const cors = {
    'access-control-allow-origin': '*',
    'access-control-allow-methods': 'GET,POST,OPTIONS',
    'access-control-allow-headers': 'content-type',
    'cache-control': 'no-store',
  };
  if (req.method === 'OPTIONS') {
    res.writeHead(204, cors);
    res.end();
    return;
  }
  if (url.pathname === '/cmd') {
    let text = '{}';
    try { text = fs.readFileSync(cmdFile, 'utf8'); } catch (e) { text = '{}'; }
    res.writeHead(200, Object.assign({ 'content-type': 'application/json' }, cors));
    res.end(text);
    return;
  }
  if (url.pathname === '/cmd-write') {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => {
      fs.writeFileSync(cmdFile, Buffer.concat(chunks).toString('utf8'));
      res.writeHead(200, cors);
      res.end('ok');
    });
    return;
  }
  if (url.pathname === '/ping') {
    res.writeHead(200, Object.assign({ 'content-type': 'text/plain' }, cors));
    res.end('ok');
    return;
  }
  const chunks = [];
  req.on('data', (c) => chunks.push(c));
  req.on('end', () => {
    const body = Buffer.concat(chunks).toString('utf8');
    n += 1;
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const tag = url.searchParams.get('tag') || 'x';
    const name = `${String(n).padStart(3, '0')}-${tag}-${stamp}.txt`;
    fs.writeFileSync(path.join(dir, name), body);
    console.log(`[${n}] ${req.method} ${url.pathname} ${body.length}B -> ${name}`);
    res.writeHead(200, Object.assign({ 'content-type': 'text/plain' }, cors));
    res.end('ok');
  });
});
server.listen(18799, '127.0.0.1', () => console.log('collector listening on 18799'));
