// Server hanya berjalan di komputer klien. Website online tetap berupa file statis.
import http from 'node:http';
import { readFile, writeFile, rename, mkdir, readdir, unlink, realpath } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import { spawn } from 'node:child_process';

const root = fileURLToPath(new URL('../', import.meta.url));
const origin = 'http://127.0.0.1:4310';
const images = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif']);
const videos = new Set(['.mp4', '.webm']);
const mime = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.gif': 'image/gif', '.webp': 'image/webp', '.avif': 'image/avif', '.mp4': 'video/mp4', '.webm': 'video/webm' };
const fail = (message) => { throw new Error(message); };
function validate(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) fail('Format konten salah.');
  for (const key of ['heroVideo', 'aboutPhoto', 'aboutLogo', 'communityPhoto']) if (typeof data[key] !== 'string' || !data[key].trim()) fail('Data foto/video belum lengkap. Pilih media untuk setiap isian.');
  for (const key of ['carousel', 'featured', 'games', 'team']) {
    if (!Array.isArray(data[key]) || data[key].length > 200) fail('Daftar kartu tidak valid.');
    for (const item of data[key]) {
      if (!item || typeof item !== 'object' || Array.isArray(item)) fail('Kartu tidak valid.');
      for (const value of Object.values(item)) if (typeof value !== 'string' || value.length > 5000) fail('Isian kartu terlalu panjang atau tidak valid.');
      if (!item.title?.trim()) fail('Nama setiap kartu wajib diisi.');
      if (!item.src?.trim()) fail('Gambar setiap kartu wajib diisi.');
      if (key === 'games' && !['action', 'adventure', 'casual'].includes(item.category)) fail('Kategori game tidak valid.');
    }
  }
  const walk = (value, key = '') => {
    if (typeof value === 'string' && ['src', 'url', 'heroVideo', 'aboutPhoto', 'aboutLogo', 'communityPhoto'].includes(key)) {
      if (value && !/^(https?:\/\/|(?:img|videos)\/)/i.test(value)) fail('Alamat media/link harus berupa http(s) atau file img/videos.');
      if (value.split('/').includes('..')) fail('Path tidak diizinkan.');
    } else if (value && typeof value === 'object') for (const [k, v] of Object.entries(value)) walk(v, k);
  };
  walk(data);
}
async function body(req, limit) {
  const chunks = []; let size = 0;
  for await (const chunk of req) { size += chunk.length; if (size > limit) fail(`Data terlalu besar. Maksimum ${limit / 1024 / 1024} MB.`); chunks.push(chunk); }
  return Buffer.concat(chunks);
}
async function inside(relative) {
  const file = path.resolve(root, relative);
  const resolved = await realpath(file);
  if (!resolved.startsWith(path.resolve(root) + path.sep)) fail('Path tidak diizinkan.');
  return resolved;
}
const server = http.createServer(async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  const json = (data, status = 200) => { res.writeHead(status, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(data)); };
  try {
    if (req.headers.host !== '127.0.0.1:4310') return json({ error: 'Buka dashboard melalui 127.0.0.1:4310.' }, 403);
    const url = new URL(req.url, origin);
    if (!['GET', 'HEAD'].includes(req.method) && req.headers.origin !== origin) return json({ error: 'Permintaan harus berasal dari dashboard lokal.' }, 403);
    if (url.pathname === '/api/content' && req.method === 'GET') return json(JSON.parse(await readFile(path.join(root, 'content.json'), 'utf8')));
    if (url.pathname === '/api/content' && req.method === 'POST') {
      const data = JSON.parse((await body(req, 2 * 1024 * 1024)).toString()); validate(data);
      await writeFile(path.join(root, 'content.json.tmp'), JSON.stringify(data, null, 2) + '\n');
      await rename(path.join(root, 'content.json.tmp'), path.join(root, 'content.json'));
      return json({ saved: true });
    }
    if (url.pathname === '/api/upload' && req.method === 'POST') {
      const ext = path.extname(url.searchParams.get('name') || '').toLowerCase();
      if (!images.has(ext) && !videos.has(ext)) fail('Pilih JPG, PNG, GIF, WebP, AVIF, MP4, atau WebM.');
      const folder = videos.has(ext) ? 'videos' : 'img';
      await mkdir(path.join(root, folder), { recursive: true });
      await inside(folder);
      const data = await body(req, 90 * 1024 * 1024);
      if (!data.length) fail('File kosong.');
      const file = `${folder}/upload-${randomUUID()}${ext}`;
      await writeFile(path.join(root, file), data, { flag: 'wx' });
      return json({ path: file });
    }
    if (url.pathname === '/api/media' && req.method === 'GET') {
      const files = [];
      for (const folder of ['img', 'videos']) {
        try { for (const entry of await readdir(path.join(root, folder), { withFileTypes: true })) if (entry.isFile() && (images.has(path.extname(entry.name).toLowerCase()) || videos.has(path.extname(entry.name).toLowerCase()))) files.push(`${folder}/${entry.name}`); }
        catch (e) { if (e.code !== 'ENOENT') throw e; }
      }
      return json(files);
    }
    if (url.pathname === '/api/media' && req.method === 'DELETE') {
      const file = url.searchParams.get('path') || '';
      // Penghapusan hanya untuk file unggahan dashboard yang sudah tidak dipakai.
      if (!/^(img|videos)\/upload-[a-f0-9-]+\.(jpg|jpeg|png|gif|webp|avif|mp4|webm)$/.test(file)) fail('Hanya file unggahan dashboard yang dapat dihapus.');
      const content = JSON.parse(await readFile(path.join(root, 'content.json'), 'utf8'));
      if (JSON.stringify(content).includes(JSON.stringify(file))) fail('File masih dipakai. Ganti/hapus kontennya lalu simpan dahulu.');
      await unlink(await inside(file)); return json({ deleted: true });
    }
    if (!['GET', 'HEAD'].includes(req.method)) return json({ error: 'Alamat tidak tersedia.' }, 404);
    let relative = decodeURIComponent(url.pathname).replace(/^\/+/, '');
    if (!relative || relative.endsWith('/')) relative += 'index.html';
    if (relative === 'dashboard') relative = 'dashboard/index.html';
    if (!(relative === 'content.json' || /^[^/]+\.html$/.test(relative) || /^(css|js|img|videos|component|guide-project)\//.test(relative) || relative === 'dashboard/index.html')) return json({ error: 'File tidak tersedia.' }, 404);
    const data = await readFile(await inside(relative));
    res.writeHead(200, { 'Content-Type': mime[path.extname(relative).toLowerCase()] || 'application/octet-stream' });
    res.end(req.method === 'HEAD' ? undefined : data);
  } catch (e) { json({ error: e.code === 'ENOENT' ? 'File tidak ditemukan.' : e.message }, e.code === 'ENOENT' ? 404 : 400); }
});
server.on('error', (error) => { console.error(error.code === 'EADDRINUSE' ? `Dashboard mungkin sudah terbuka. Buka ${origin}/dashboard` : error.message); process.exitCode = 1; });
server.listen(4310, '127.0.0.1', () => {
  console.log(`Dashboard: ${origin}/dashboard\nPratinjau: ${origin}/\nBiarkan jendela ini terbuka. Tekan Ctrl+C untuk berhenti.`);
  if (process.argv.includes('--open')) {
    const child = process.platform === 'win32' ? spawn('explorer.exe', [`${origin}/dashboard`], { windowsHide: true }) : spawn(process.platform === 'darwin' ? 'open' : 'xdg-open', [`${origin}/dashboard`]);
    child.on('error', () => console.log('Buka alamat dashboard secara manual di browser.'));
  }
});
