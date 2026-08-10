const Busboy = require('busboy');
const crypto = require('node:crypto');
const fsNative = require('node:fs');
const fs = require('node:fs/promises');
const path = require('node:path');
const { pipeline } = require('node:stream/promises');
const { Readable } = require('node:stream');

const MAX_UPLOAD_BYTES = 50 * 1024 * 1024;
const MAX_UPLOAD_FILES = 8;
const MAX_UPLOAD_TOTAL_BYTES = 100 * 1024 * 1024;
const MAX_JSON_BODY_BYTES = 64 * 1024;
const MAX_MULTIPART_OVERHEAD_BYTES = 2 * 1024 * 1024;
const DEFAULT_LIBRARY_QUOTA_BYTES = 10 * 1024 * 1024 * 1024;
const DEFAULT_MIN_FREE_BYTES = 1024 * 1024 * 1024;
const STATUS_VALUES = new Set(['active', 'discarded']);
const ALLOWED_UPLOADS = new Map([
  ['.jpg', new Set(['image/jpeg'])],
  ['.jpeg', new Set(['image/jpeg'])],
  ['.png', new Set(['image/png'])],
  ['.webp', new Set(['image/webp'])],
  ['.mp4', new Set(['video/mp4'])],
  ['.webm', new Set(['video/webm'])],
  ['.mov', new Set(['video/quicktime'])],
  ['.mp3', new Set(['audio/mpeg'])],
  ['.wav', new Set(['audio/wav', 'audio/x-wav'])],
  ['.m4a', new Set(['audio/mp4', 'audio/x-m4a'])],
  ['.pdf', new Set(['application/pdf'])],
]);

let writeQueue = Promise.resolve();

function httpError(message, status) {
  return Object.assign(new Error(message), { status });
}

function configuredBytes(name, fallback) {
  const parsed = Number.parseInt(process.env[name] || '', 10);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function getRoot(customRoot) {
  return path.resolve(/* turbopackIgnore: true */ customRoot || process.env.CREATIVITY_ASSET_ROOT || '/asset-store');
}

function cleanText(value, maxLength = 180) {
  return String(value || '').replace(/[\u0000-\u001f\u007f]/gu, '').trim().slice(0, maxLength);
}

function safeFilename(filename) {
  const basename = path.basename(cleanText(filename, 220));
  const normalized = basename.normalize('NFKD').replace(/[\u0300-\u036f]/gu, '');
  const safe = normalized.replace(/[^A-Za-z0-9._-]+/gu, '-').replace(/-+/gu, '-').replace(/^[-.]+|[-.]+$/gu, '');
  return safe || 'archivo';
}

function uploadKind(contentType) {
  if (contentType.startsWith('image/')) return 'image';
  if (contentType.startsWith('video/')) return 'video';
  if (contentType.startsWith('audio/')) return 'audio';
  return 'document';
}

function validateUpload({ name, type, size }) {
  const extension = path.extname(String(name || '')).toLowerCase();
  const allowedTypes = ALLOWED_UPLOADS.get(extension);
  if (!allowedTypes || !allowedTypes.has(String(type || '').toLowerCase())) {
    return { ok: false, error: 'Tipo de archivo no permitido.' };
  }
  if (!Number.isInteger(size) || size < 1) return { ok: false, error: 'El archivo está vacío.' };
  if (size > MAX_UPLOAD_BYTES) return { ok: false, error: 'El archivo supera el límite de 50 MB.' };
  return { ok: true, extension, kind: uploadKind(type) };
}

function hasSignature(extension, bytes) {
  const ascii = (start, end) => bytes.subarray(start, end).toString('ascii');
  if (extension === '.jpg' || extension === '.jpeg') return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (extension === '.png') return bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  if (extension === '.webp') return ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP';
  if (extension === '.wav') return ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WAVE';
  if (extension === '.pdf') return ascii(0, 5) === '%PDF-';
  if (extension === '.webm') return bytes.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3]));
  if (extension === '.mp4' || extension === '.mov' || extension === '.m4a') return ascii(4, 8) === 'ftyp';
  if (extension === '.mp3') return ascii(0, 3) === 'ID3' || (bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0);
  return false;
}

async function validateStagedFile(file) {
  const validation = validateUpload(file);
  if (!validation.ok) throw httpError(validation.error, 415);
  const handle = await fs.open(file.temporaryPath, 'r');
  try {
    const header = Buffer.alloc(16);
    const { bytesRead } = await handle.read(header, 0, header.length, 0);
    if (!hasSignature(validation.extension, header.subarray(0, bytesRead))) {
      throw httpError('El contenido no coincide con el tipo de archivo declarado.', 415);
    }
  } finally {
    await handle.close();
  }
  return validation;
}

async function ensureStore(root) {
  await Promise.all([
    fs.mkdir(path.join(root, 'uploads'), { recursive: true }),
    fs.mkdir(path.join(root, '.staging'), { recursive: true }),
  ]);
}

async function readIndex(customRoot) {
  const root = getRoot(customRoot);
  await ensureStore(root);
  try {
    const value = JSON.parse(await fs.readFile(path.join(root, 'index.json'), 'utf8'));
    if (!value || value.version !== 1 || !Array.isArray(value.assets)) {
      throw httpError('El índice de archivos tiene una estructura inválida; se detuvo la escritura para proteger los datos.', 500);
    }
    return value.assets;
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    if (error instanceof SyntaxError) throw httpError('El índice de archivos está dañado; se detuvo la escritura para proteger los datos.', 500);
    throw error;
  }
}

async function writeIndex(root, assets) {
  const target = path.join(root, 'index.json');
  const temporary = path.join(root, `index.${process.pid}.${crypto.randomUUID()}.tmp`);
  try {
    await fs.writeFile(
      temporary,
      `${JSON.stringify({ version: 1, assets }, null, 2)}\n`,
      { encoding: 'utf8', flag: 'wx', mode: 0o600 },
    );
    await fs.rename(temporary, target);
  } catch (error) {
    await fs.unlink(temporary).catch(() => undefined);
    throw error;
  }
}

function queued(operation) {
  const next = writeQueue.then(operation);
  writeQueue = next.catch(() => undefined);
  return next;
}

function mutateIndex(customRoot, operation) {
  const root = getRoot(customRoot);
  return queued(async () => {
    const assets = await readIndex(root);
    const result = await operation(assets, root);
    await writeIndex(root, assets);
    return result;
  });
}

async function assertCapacity(root, assets, incomingBytes) {
  const usedBytes = assets.reduce((total, asset) => total + (asset.source === 'upload' && Number.isFinite(asset.size) ? asset.size : 0), 0);
  const quotaBytes = configuredBytes('CREATIVITY_ASSET_QUOTA_BYTES', DEFAULT_LIBRARY_QUOTA_BYTES);
  if (usedBytes + incomingBytes > quotaBytes) throw httpError('La biblioteca alcanzó su cuota de almacenamiento.', 507);
  const disk = await fs.statfs(root);
  const freeBytes = Number(disk.bavail) * Number(disk.bsize);
  const minimumFreeBytes = configuredBytes('CREATIVITY_ASSET_MIN_FREE_BYTES', DEFAULT_MIN_FREE_BYTES);
  if (freeBytes - incomingBytes < minimumFreeBytes) throw httpError('No hay espacio seguro suficiente para guardar el lote.', 507);
}

function buildUploadAsset(file, metadata, validation) {
  const now = new Date().toISOString();
  const assetId = `ast-${crypto.randomUUID()}`;
  return {
    asset_id: assetId,
    asset_key: `upload:${assetId}`,
    source: 'upload',
    status: 'active',
    name: cleanText(file.name, 220),
    safe_name: safeFilename(file.name),
    storage_name: `${assetId}${validation.extension}`,
    content_type: file.type,
    kind: validation.kind,
    size: file.size,
    content_item_id: cleanText(metadata.contentItemId, 120) || null,
    note: cleanText(metadata.note, 500),
    created_at: now,
    updated_at: now,
    discarded_at: null,
  };
}

async function commitStagedUploads(stagedFiles, metadata = {}, customRoot) {
  const root = getRoot(customRoot);
  await ensureStore(root);
  const validations = await Promise.all(stagedFiles.map(validateStagedFile));
  const incomingBytes = stagedFiles.reduce((total, file) => total + file.size, 0);
  try {
    return await queued(async () => {
      const assets = await readIndex(root);
      await assertCapacity(root, assets, incomingBytes);
      const created = stagedFiles.map((file, index) => buildUploadAsset(file, metadata, validations[index]));
      const finalized = [];
      try {
        for (let index = 0; index < stagedFiles.length; index += 1) {
          const target = path.join(root, 'uploads', created[index].storage_name);
          await fs.rename(stagedFiles[index].temporaryPath, target);
          finalized.push(target);
        }
        await writeIndex(root, [...created, ...assets]);
        return created;
      } catch (error) {
        await Promise.allSettled(finalized.map((target) => fs.unlink(target)));
        throw error;
      }
    });
  } finally {
    await Promise.allSettled(stagedFiles.map((file) => fs.unlink(file.temporaryPath)));
  }
}

async function createUpload({ bytes, contentItemId, name, note, size, type }, customRoot) {
  const validation = validateUpload({ name, type, size });
  if (!validation.ok) throw httpError(validation.error, 415);
  const buffer = Buffer.isBuffer(bytes) ? bytes : Buffer.from(bytes);
  if (buffer.length !== size) throw httpError('El archivo llegó incompleto.', 400);
  const root = getRoot(customRoot);
  await ensureStore(root);
  const temporaryPath = path.join(root, '.staging', `${crypto.randomUUID()}.upload`);
  await fs.writeFile(temporaryPath, buffer, { flag: 'wx', mode: 0o600 });
  const [asset] = await commitStagedUploads([{ name, size, temporaryPath, type }], { contentItemId, note }, root);
  return asset;
}

function normalizeMultipartError(error) {
  if (error?.status) return error;
  if (/Unexpected end of form|Malformed part header|Boundary not found/iu.test(error?.message || '')) {
    return httpError('El formulario de archivos está incompleto o es inválido.', 400);
  }
  return error;
}

async function createUploadsFromRequest(request, customRoot) {
  const contentLength = Number.parseInt(request.headers.get('content-length') || '', 10);
  if (Number.isFinite(contentLength) && contentLength > MAX_UPLOAD_TOTAL_BYTES + MAX_MULTIPART_OVERHEAD_BYTES) {
    throw httpError('El lote supera el límite total de 100 MB.', 413);
  }
  if (!request.body) throw httpError('Selecciona al menos un archivo.', 400);

  const root = getRoot(customRoot);
  await ensureStore(root);
  const fields = { contentItemId: '', note: '' };
  const stagedFiles = [];
  const writes = [];
  let totalBytes = 0;
  let parserError;
  let source;
  let parser;

  const fail = (error) => {
    if (parserError) return;
    parserError = error;
    parser.destroy(error);
    source.destroy(error);
  };

  try {
    parser = Busboy({
      headers: Object.fromEntries(request.headers.entries()),
      limits: { fieldNameSize: 80, fieldSize: 500, fields: 2, fileSize: MAX_UPLOAD_BYTES, files: MAX_UPLOAD_FILES, parts: MAX_UPLOAD_FILES + 2 },
    });
    source = Readable.fromWeb(request.body);

    parser.on('field', (fieldName, value, info) => {
      if (info.valueTruncated) return fail(httpError('Un campo del formulario supera el límite permitido.', 400));
      if (fieldName === 'content_item_id') fields.contentItemId = value;
      else if (fieldName === 'note') fields.note = value;
      else fail(httpError('El formulario contiene un campo no permitido.', 400));
    });
    parser.on('file', (fieldName, fileStream, info) => {
      if (fieldName !== 'files') {
        fileStream.resume();
        return fail(httpError('El formulario contiene un archivo no permitido.', 400));
      }
      const temporaryPath = path.join(root, '.staging', `${crypto.randomUUID()}.upload`);
      const staged = { name: info.filename, size: 0, temporaryPath, type: info.mimeType };
      stagedFiles.push(staged);
      fileStream.on('data', (chunk) => {
        staged.size += chunk.length;
        totalBytes += chunk.length;
        if (totalBytes > MAX_UPLOAD_TOTAL_BYTES) fail(httpError('El lote supera el límite total de 100 MB.', 413));
      });
      fileStream.once('limit', () => fail(httpError(`${safeFilename(info.filename)} supera el límite de 50 MB.`, 413)));
      const write = pipeline(fileStream, fsNative.createWriteStream(temporaryPath, { flags: 'wx', mode: 0o600 }))
        .catch((error) => {
          fail(normalizeMultipartError(error));
          throw error;
        });
      write.catch(() => undefined);
      writes.push(write);
    });
    parser.once('filesLimit', () => fail(httpError(`Sube un máximo de ${MAX_UPLOAD_FILES} archivos por lote.`, 400)));
    parser.once('fieldsLimit', () => fail(httpError('El formulario contiene demasiados campos.', 400)));
    parser.once('partsLimit', () => fail(httpError('El formulario contiene demasiadas partes.', 400)));

    await new Promise((resolve, reject) => {
      parser.once('close', resolve);
      parser.once('error', reject);
      source.once('error', reject);
      source.pipe(parser);
    });
    await Promise.all(writes);
    if (parserError) throw parserError;
    if (!stagedFiles.length) throw httpError('Selecciona al menos un archivo.', 400);
    return await commitStagedUploads(stagedFiles, fields, root);
  } catch (error) {
    await Promise.allSettled(writes);
    await Promise.allSettled(stagedFiles.map((file) => fs.unlink(file.temporaryPath)));
    throw normalizeMultipartError(parserError || error);
  }
}

async function readJsonRequest(request) {
  const contentLength = Number.parseInt(request.headers.get('content-length') || '', 10);
  if (Number.isFinite(contentLength) && contentLength > MAX_JSON_BODY_BYTES) {
    throw httpError('El cuerpo JSON supera el límite de 64 KB.', 413);
  }
  if (!request.body) throw httpError('El cuerpo JSON es inválido.', 400);
  const reader = request.body.getReader();
  const chunks = [];
  let totalBytes = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      totalBytes += value.byteLength;
      if (totalBytes > MAX_JSON_BODY_BYTES) {
        await reader.cancel();
        throw httpError('El cuerpo JSON supera el límite de 64 KB.', 413);
      }
      chunks.push(Buffer.from(value));
    }
    return JSON.parse(Buffer.concat(chunks, totalBytes).toString('utf8'));
  } catch (error) {
    if (error?.status) throw error;
    throw httpError('El cuerpo JSON es inválido.', 400);
  }
}

function validGeneratedPayload(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw httpError('Contenido generado inválido.', 400);
  const jobId = cleanText(value.job_id, 120);
  const filename = safeFilename(value.filename);
  const assetKey = cleanText(value.asset_key, 360);
  if (!/^img-[A-Za-z0-9TZ-]+$/u.test(jobId)) throw httpError('Trabajo generado inválido.', 400);
  if (!/^[A-Za-z0-9][A-Za-z0-9_.-]{2,180}$/u.test(filename)) throw httpError('Nombre generado inválido.', 400);
  if (assetKey !== `generated:${jobId}:${filename}`) throw httpError('Referencia generada inválida.', 400);
  if (value.status !== undefined && !STATUS_VALUES.has(value.status)) throw httpError('Estado inválido.', 400);
  return { assetKey, filename, jobId };
}

function upsertGeneratedAsset(payload, customRoot) {
  const generated = validGeneratedPayload(payload);
  const status = payload.status || 'active';
  return mutateIndex(customRoot, async (assets) => {
    const now = new Date().toISOString();
    let asset = assets.find((candidate) => candidate.asset_key === generated.assetKey);
    if (!asset) {
      asset = {
        asset_id: `gen-${crypto.randomUUID()}`,
        asset_key: generated.assetKey,
        source: 'generated',
        status,
        name: cleanText(payload.name || generated.filename, 220),
        safe_name: generated.filename,
        filename: generated.filename,
        content_type: cleanText(payload.content_type, 100) || 'image/png',
        kind: cleanText(payload.kind, 30) || 'image',
        size: null,
        content_item_id: cleanText(payload.content_item_id, 120) || null,
        job_id: generated.jobId,
        note: cleanText(payload.note, 500),
        created_at: cleanText(payload.created_at, 40) || now,
        updated_at: now,
        discarded_at: status === 'discarded' ? now : null,
      };
      assets.unshift(asset);
    } else {
      asset.status = status;
      asset.updated_at = now;
      asset.discarded_at = status === 'discarded' ? now : null;
    }
    return asset;
  });
}

function updateAsset(assetId, changes, customRoot) {
  if (!/^(ast|gen)-[0-9a-f-]{36}$/u.test(String(assetId || ''))) throw httpError('Archivo inválido.', 400);
  if (!changes || typeof changes !== 'object' || Array.isArray(changes)) throw httpError('Cambios inválidos.', 400);
  return mutateIndex(customRoot, async (assets) => {
    const asset = assets.find((candidate) => candidate.asset_id === assetId);
    if (!asset) throw httpError('Archivo no encontrado.', 404);
    const now = new Date().toISOString();
    if (changes.status !== undefined) {
      if (!STATUS_VALUES.has(changes.status)) throw httpError('Estado inválido.', 400);
      asset.status = changes.status;
      asset.discarded_at = changes.status === 'discarded' ? now : null;
    }
    if (changes.content_item_id !== undefined) asset.content_item_id = cleanText(changes.content_item_id, 120) || null;
    if (changes.note !== undefined) asset.note = cleanText(changes.note, 500);
    asset.updated_at = now;
    return asset;
  });
}

async function getUploadedFile(assetId, customRoot) {
  if (!/^ast-[0-9a-f-]{36}$/u.test(String(assetId || ''))) throw httpError('Archivo inválido.', 400);
  const root = getRoot(customRoot);
  const assets = await readIndex(root);
  const asset = assets.find((candidate) => candidate.asset_id === assetId && candidate.source === 'upload');
  if (!asset) throw httpError('Archivo no encontrado.', 404);
  const uploadRoot = path.resolve(root, 'uploads');
  const target = path.resolve(uploadRoot, asset.storage_name);
  if (path.dirname(target) !== uploadRoot) throw httpError('Ruta inválida.', 400);
  const stat = await fs.stat(target);
  if (!stat.isFile()) throw httpError('Archivo no encontrado.', 404);
  return { asset, path: target, size: stat.size };
}

module.exports = {
  MAX_UPLOAD_BYTES,
  MAX_UPLOAD_FILES,
  MAX_UPLOAD_TOTAL_BYTES,
  commitStagedUploads,
  createUpload,
  createUploadsFromRequest,
  getUploadedFile,
  readIndex,
  readJsonRequest,
  safeFilename,
  updateAsset,
  upsertGeneratedAsset,
  validateUpload,
};
