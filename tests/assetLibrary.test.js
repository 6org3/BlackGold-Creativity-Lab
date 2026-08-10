const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');

const {
  createUpload,
  createUploadsFromRequest,
  getUploadedFile,
  readIndex,
  readJsonRequest,
  updateAsset,
  upsertGeneratedAsset,
  validateUpload,
} = require('../lib/asset-library');

const pngBytes = () => Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x42, 0x47]);

async function temporaryStore(t) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'bg-assets-'));
  t.after(async () => fs.rm(root, { recursive: true, force: true }));
  return root;
}

test('upload validation accepts production media and blocks executable formats', () => {
  assert.equal(validateUpload({ name: 'entreno.webp', type: 'image/webp', size: 128 }).ok, true);
  assert.equal(validateUpload({ name: 'video.mp4', type: 'video/mp4', size: 128 }).ok, true);
  assert.equal(validateUpload({ name: 'ataque.svg', type: 'image/svg+xml', size: 128 }).ok, false);
  assert.equal(validateUpload({ name: 'ataque.exe', type: 'application/octet-stream', size: 128 }).ok, false);
});

test('uploaded assets persist, can be discarded, restored and read without deletion', async (t) => {
  const root = await temporaryStore(t);
  const bytes = pngBytes();
  const asset = await createUpload({ bytes, name: 'Referencia cancha.png', type: 'image/png', size: bytes.length }, root);
  assert.equal((await readIndex(root)).length, 1);
  assert.deepEqual(await fs.readFile((await getUploadedFile(asset.asset_id, root)).path), bytes);
  assert.equal((await updateAsset(asset.asset_id, { status: 'discarded' }, root)).status, 'discarded');
  assert.equal((await getUploadedFile(asset.asset_id, root)).size, bytes.length);
  assert.equal((await updateAsset(asset.asset_id, { status: 'active' }, root)).status, 'active');
});

test('generated artifact decisions are idempotent overlays', async (t) => {
  const root = await temporaryStore(t);
  const payload = {
    asset_key: 'generated:img-20260810T053928Z-8771c4f6:variant-a.png',
    job_id: 'img-20260810T053928Z-8771c4f6',
    filename: 'variant-a.png',
    name: 'Variante A',
    status: 'discarded',
  };
  const first = await upsertGeneratedAsset(payload, root);
  const second = await upsertGeneratedAsset({ ...payload, status: 'active' }, root);
  assert.equal(first.asset_id, second.asset_id);
  assert.equal(second.status, 'active');
  assert.equal((await readIndex(root)).length, 1);
});

test('a damaged index blocks writes instead of losing the catalog', async (t) => {
  const root = await temporaryStore(t);
  await fs.writeFile(path.join(root, 'index.json'), '{incompleto', 'utf8');
  await assert.rejects(
    createUpload({ bytes: pngBytes(), name: 'foto.png', type: 'image/png', size: pngBytes().length }, root),
    /índice de archivos está dañado/u,
  );
  assert.equal(await fs.readFile(path.join(root, 'index.json'), 'utf8'), '{incompleto');
});

test('an index with an invalid schema is preserved instead of overwritten', async (t) => {
  const root = await temporaryStore(t);
  await fs.writeFile(path.join(root, 'index.json'), JSON.stringify({ assets: 'dañados' }), 'utf8');
  await assert.rejects(
    createUpload({ bytes: pngBytes(), name: 'foto.png', type: 'image/png', size: pngBytes().length }, root),
    /estructura inválida/u,
  );
  assert.equal(await fs.readFile(path.join(root, 'index.json'), 'utf8'), '{"assets":"dañados"}');
});

test('file signatures are checked instead of trusting the client MIME type', async (t) => {
  const root = await temporaryStore(t);
  const bytes = Buffer.from('not-a-real-png');
  await assert.rejects(
    createUpload({ bytes, name: 'foto.png', type: 'image/png', size: bytes.length }, root),
    /contenido no coincide/u,
  );
  assert.equal((await readIndex(root)).length, 0);
});

test('concurrent uploads keep every catalog entry and a valid index', async (t) => {
  const root = await temporaryStore(t);
  const bytes = pngBytes();
  await Promise.all(Array.from({ length: 12 }, (_, index) => createUpload({
    bytes,
    name: `foto-${index}.png`,
    type: 'image/png',
    size: bytes.length,
  }, root)));
  assert.equal((await readIndex(root)).length, 12);
  assert.equal(JSON.parse(await fs.readFile(path.join(root, 'index.json'), 'utf8')).version, 1);
});

test('multipart uploads stream a complete batch and reject invalid generated status', async (t) => {
  const root = await temporaryStore(t);
  const form = new FormData();
  form.append('files', new File([pngBytes()], 'uno.png', { type: 'image/png' }));
  form.append('files', new File([pngBytes()], 'dos.png', { type: 'image/png' }));
  form.append('content_item_id', 'cnt-entrenamientos');
  form.append('note', 'Material autorizado');
  const assets = await createUploadsFromRequest(new Request('http://lab.local/api/assets', { method: 'POST', body: form }), root);
  assert.equal(assets.length, 2);
  assert.equal((await readIndex(root)).length, 2);
  assert.throws(
    () => upsertGeneratedAsset({ asset_key: 'generated:img-20260810T053928Z-8771c4f6:variant-a.png', job_id: 'img-20260810T053928Z-8771c4f6', filename: 'variant-a.png', status: 'discard' }, root),
    /Estado inválido/u,
  );
});

test('library quota rejects a batch before adding files to the catalog', async (t) => {
  const root = await temporaryStore(t);
  const previous = process.env.CREATIVITY_ASSET_QUOTA_BYTES;
  process.env.CREATIVITY_ASSET_QUOTA_BYTES = '1';
  t.after(() => {
    if (previous === undefined) delete process.env.CREATIVITY_ASSET_QUOTA_BYTES;
    else process.env.CREATIVITY_ASSET_QUOTA_BYTES = previous;
  });
  const bytes = pngBytes();
  await assert.rejects(
    createUpload({ bytes, name: 'foto.png', type: 'image/png', size: bytes.length }, root),
    /cuota/u,
  );
  assert.equal((await readIndex(root)).length, 0);
});

test('JSON bodies are parsed with a hard streaming limit', async () => {
  const valid = new Request('http://lab.local/api/assets', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'active' }),
  });
  assert.deepEqual(await readJsonRequest(valid), { status: 'active' });
  const oversized = new Request('http://lab.local/api/assets', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ note: 'x'.repeat(70 * 1024) }),
  });
  await assert.rejects(readJsonRequest(oversized), /64 KB/u);
});
