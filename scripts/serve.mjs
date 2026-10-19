import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {resolve, extname, sep} from 'node:path';

const base = fileURLToPath(new URL('../dist/', import.meta.url));
const port = Number(process.env.PORT || 4173);
const types = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml'};
const server = createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    const path = resolve(base, `.${pathname === '/' ? '/index.html' : pathname}`);
    if (!path.startsWith(base.endsWith(sep) ? base : base + sep)) { res.writeHead(403).end(); return; }
    const data = await readFile(path);
    res.writeHead(200, {'Content-Type': types[extname(path)] || 'application/octet-stream',
      'Cache-Control':'no-store','X-Content-Type-Options':'nosniff',
      'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self'; connect-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'"}).end(data);
  } catch { res.writeHead(404).end('Not found'); }
});
server.listen(port, '127.0.0.1', () => console.log(`Local: http://127.0.0.1:${port}/?preview=1`));
process.on('SIGTERM', () => server.close());
