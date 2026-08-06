// 本地预览 dist 的静态服务器。
// Astro 的 dev/preview 服务器在 Windows 上会把大小写敏感的 base（/DORIANs_DuoDash/）
// 小写归一化导致 404，本脚本将 base 前缀正确映射到 dist 目录，与 GitHub Pages 行为一致。
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const distDir = fileURLToPath(new URL('../dist', import.meta.url));
const port = Number(process.env.PORT || 4321);
const BASE_PATH = '/DORIANs_DuoDash/';

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url ?? '/', 'http://localhost').pathname);
    let relative = pathname.startsWith(BASE_PATH) ? pathname.slice(BASE_PATH.length) : null;
    if (!relative && pathname === '/') {
      relative = '';
    }
    if (relative === null) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404 Not Found');
      return;
    }
    let filePath = normalize(join(distDir, relative));
    if (!filePath.startsWith(distDir)) {
      res.writeHead(403);
      res.end('Forbidden');
      return;
    }
    if (filePath.endsWith('/') || extname(filePath) === '') {
      filePath = join(filePath, 'index.html');
    }
    const data = await readFile(filePath);
    res.writeHead(200, { 'Content-Type': MIME_TYPES[extname(filePath)] ?? 'application/octet-stream' });
    res.end(data);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('404 Not Found');
  }
}).listen(port, () => {
  console.log(`DuoDash 本地预览: http://localhost:${port}${BASE_PATH}`);
});
