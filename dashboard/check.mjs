// Pemeriksaan CRUD pada folder sementara; konten proyek asli tidak diubah.
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, copyFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
const source = fileURLToPath(new URL('../', import.meta.url));
const fixture = await mkdtemp(path.join(tmpdir(), 'napdev-dashboard-check-'));
let child;
try {
  await mkdir(path.join(fixture, 'dashboard'));
  for (const file of ['dashboard/server.mjs', 'dashboard/index.html', 'content.json']) await copyFile(path.join(source, file), path.join(fixture, file));
  child = spawn(process.execPath, ['dashboard/server.mjs'], { cwd: fixture, stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true });
  await new Promise((resolve, reject) => { child.stdout.once('data', resolve); child.once('exit', code => reject(new Error('Server exited: ' + code))); });
  const origin = 'http://127.0.0.1:4310';
  const request = (url, method = 'GET', data, originHeader = origin) => fetch(origin + url, { method, headers: { Origin: originHeader }, body: data });
  let response = await request('/api/content'); assert.equal(response.status, 200); const content = await response.json();
  assert.equal((await request('/api/content', 'POST', JSON.stringify(content), 'https://other.example')).status, 403);
  const original = JSON.stringify(content); content.carousel[0].title = 'Edited through dashboard';
  response = await request('/api/content', 'POST', JSON.stringify(content));
  assert.equal(response.status, 200, await response.text());
  assert.equal(JSON.parse(await readFile(path.join(fixture, 'content.json'), 'utf8')).carousel[0].title, 'Edited through dashboard');
  assert.equal((await request('/api/content', 'POST', JSON.stringify({}))).status, 400);
  assert.equal((await request('/api/upload?name=unsafe.html', 'POST', 'bad')).status, 400);
  response = await request('/api/upload?name=test.png', 'POST', Buffer.from('89504e470d0a1a0a', 'hex')); assert.equal(response.status, 200); const file = (await response.json()).path;
  content.carousel[0].src = file; assert.equal((await request('/api/content', 'POST', JSON.stringify(content))).status, 200);
  assert.equal((await request('/api/media?path=' + encodeURIComponent(file), 'DELETE')).status, 400);
  assert.equal((await request('/api/content', 'POST', original)).status, 200);
  assert.equal((await request('/api/media?path=' + encodeURIComponent(file), 'DELETE')).status, 200);
  assert.equal((await request('/api/media?path=content.json', 'DELETE')).status, 400);
  assert.equal((await request('/dashboard/server.mjs')).status, 404);
  assert.equal((await request('/dashboard')).status, 200);
  assert.equal((await request('/api/media')).status, 200);
  console.log('PASS: load/save, validation, origin protection, upload, referenced-file protection, delete, static route restrictions.');
} finally {
  if (child && child.exitCode === null) { const closed = new Promise(resolve => child.once('exit', resolve)); child.kill(); await closed; }
  assert.ok(path.resolve(fixture).startsWith(path.resolve(tmpdir()) + path.sep));
  assert.ok(path.basename(fixture).startsWith('napdev-dashboard-check-'));
  await rm(fixture, { recursive: true, force: true });
}
