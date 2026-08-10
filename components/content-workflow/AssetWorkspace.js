'use client';

import Image from 'next/image';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import WorkflowIcon from './WorkflowIcon';

const FILTERS = [
  { id: 'active', label: 'Activos' },
  { id: 'uploads', label: 'Propios' },
  { id: 'generated', label: 'Generados' },
  { id: 'discarded', label: 'Descartados' },
];

function artifactUrl(jobId, filename) {
  return `/api/system-os/artifacts/${jobId}/${encodeURIComponent(filename)}`;
}

function contentType(filename = '') {
  const extension = filename.split('.').at(-1)?.toLowerCase();
  return extension === 'webp' ? 'image/webp' : extension === 'jpg' || extension === 'jpeg' ? 'image/jpeg' : 'image/png';
}

function generatedFiles(job) {
  const files = [];
  for (const variant of job.variants || []) {
    if (variant.file) files.push({ filename: variant.file, variant: variant.key });
  }
  if (job.preview_file && !files.some((entry) => entry.filename === job.preview_file)) {
    files.push({ filename: job.preview_file, variant: null });
  }
  return files;
}

function buildGeneratedAssets(jobs, overlays) {
  const overlaysByKey = new Map(overlays.filter((asset) => asset.source === 'generated').map((asset) => [asset.asset_key, asset]));
  const records = [];
  const seen = new Set();
  for (const job of jobs) {
    for (const file of generatedFiles(job)) {
      const key = `generated:${job.job_id}:${file.filename}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const overlay = overlaysByKey.get(key);
      records.push({
        ...overlay,
        asset_key: key,
        source: 'generated',
        status: overlay?.status || (job.state === 'superseded' ? 'discarded' : 'active'),
        name: file.variant ? `${job.title} · variante ${file.variant}` : job.title,
        filename: file.filename,
        content_type: contentType(file.filename),
        kind: 'image',
        content_item_id: job.content_item_id || overlay?.content_item_id || null,
        job_id: job.job_id,
        job_state: job.state,
        created_at: overlay?.created_at || job.created_at,
        url: artifactUrl(job.job_id, file.filename),
      });
    }
  }
  for (const overlay of overlaysByKey.values()) {
    if (!seen.has(overlay.asset_key)) records.push({ ...overlay, url: artifactUrl(overlay.job_id, overlay.filename) });
  }
  return records;
}

function sizeLabel(size) {
  if (!Number.isFinite(size)) return 'Tamaño gestionado por System OS';
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function kindLabel(kind) {
  return { image: 'Imagen', video: 'Video', audio: 'Audio', document: 'Documento' }[kind] || 'Archivo';
}

async function request(url, options) {
  const response = await fetch(url, { cache: 'no-store', ...options });
  const payload = await response.json().catch(() => ({ ok: false, error: 'Respuesta inválida.' }));
  if (!response.ok || !payload.ok) throw new Error(payload.error || 'No se pudo completar la acción.');
  return payload;
}

function AssetPreview({ asset }) {
  if (asset.kind === 'image') {
    return <Image alt={`Vista previa de ${asset.name}`} fill sizes="(max-width: 650px) 100vw, 280px" src={asset.url} unoptimized/>;
  }
  return <div className="asset-kind-preview"><WorkflowIcon name={asset.kind === 'video' ? 'film' : asset.kind === 'audio' ? 'audio' : 'files'} size={32}/><span>{kindLabel(asset.kind)}</span></div>;
}

export default function AssetWorkspace({ items, jobs, onMessage }) {
  const inputRef = useRef(null);
  const [records, setRecords] = useState([]);
  const [filter, setFilter] = useState('active');
  const [files, setFiles] = useState([]);
  const [contentItemId, setContentItemId] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [busyKey, setBusyKey] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const payload = await request('/api/assets');
      setRecords(payload.assets || []);
      setError('');
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const initial = window.setTimeout(load, 0);
    return () => window.clearTimeout(initial);
  }, [load]);

  const uploaded = useMemo(() => records.filter((asset) => asset.source === 'upload').map((asset) => ({ ...asset, url: `/api/assets/${asset.asset_id}/file` })), [records]);
  const generated = useMemo(() => buildGeneratedAssets(jobs, records), [jobs, records]);
  const assets = useMemo(() => [...uploaded, ...generated].sort((a, b) => String(b.created_at || '').localeCompare(String(a.created_at || ''))), [uploaded, generated]);
  const visible = assets.filter((asset) => {
    if (filter === 'discarded') return asset.status === 'discarded';
    if (asset.status === 'discarded') return false;
    if (filter === 'uploads') return asset.source === 'upload';
    if (filter === 'generated') return asset.source === 'generated';
    return true;
  });
  const counts = {
    active: assets.filter((asset) => asset.status !== 'discarded').length,
    uploads: assets.filter((asset) => asset.source === 'upload' && asset.status !== 'discarded').length,
    generated: assets.filter((asset) => asset.source === 'generated' && asset.status !== 'discarded').length,
    discarded: assets.filter((asset) => asset.status === 'discarded').length,
  };

  const upload = async (event) => {
    event.preventDefault();
    if (!files.length) return setError('Selecciona al menos un archivo.');
    if (files.length > 8) return setError('Sube un máximo de 8 archivos por lote.');
    if (files.some((file) => file.size > 50 * 1024 * 1024)) return setError('Cada archivo puede pesar hasta 50 MB.');
    if (files.reduce((total, file) => total + file.size, 0) > 100 * 1024 * 1024) return setError('El lote completo puede pesar hasta 100 MB.');
    setBusyKey('upload'); setError('');
    try {
      const body = new FormData();
      files.forEach((file) => body.append('files', file));
      body.append('content_item_id', contentItemId);
      body.append('note', note);
      const payload = await request('/api/assets', { method: 'POST', body });
      setFiles([]); setNote('');
      if (inputRef.current) inputRef.current.value = '';
      onMessage(`${payload.assets.length} archivo${payload.assets.length === 1 ? '' : 's'} propio${payload.assets.length === 1 ? '' : 's'} guardado${payload.assets.length === 1 ? '' : 's'} en la biblioteca`);
      await load();
    } catch (uploadError) {
      setError(uploadError.message);
    } finally {
      setBusyKey('');
    }
  };

  const changeStatus = async (asset, status) => {
    setBusyKey(asset.asset_key); setError('');
    try {
      if (asset.asset_id) {
        await request(`/api/assets/${asset.asset_id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
      } else {
        await request('/api/assets', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
          asset_key: asset.asset_key,
          content_item_id: asset.content_item_id,
          content_type: asset.content_type,
          created_at: asset.created_at,
          filename: asset.filename,
          job_id: asset.job_id,
          kind: asset.kind,
          name: asset.name,
          source: 'generated',
          status,
        }) });
      }
      onMessage(status === 'discarded' ? 'Archivo movido a Descartados; sigue siendo recuperable' : 'Archivo restaurado a la biblioteca activa');
      await load();
    } catch (statusError) {
      setError(statusError.message);
    } finally {
      setBusyKey('');
    }
  };

  return (
    <div className="asset-workspace">
      <section className="asset-main">
        <header className="section-head"><div><span className="eyebrow">Control de archivos</span><h2>Biblioteca del Lab</h2></div><p><b>{counts.active}</b> activos · <b>{counts.discarded}</b> descartados</p></header>
        <form className="asset-uploader" onSubmit={upload}>
          <div className="asset-upload-heading"><span><WorkflowIcon name="upload" size={20}/></span><div><h3>Subir archivos propios</h3><p>Referencias, fotos, video, audio o PDF. Quedan dentro del Lab y no inician ningún render.</p></div></div>
          <label className="field field-wide"><span>Archivos · máximo 8, 50 MB cada uno y 100 MB por lote</span><input accept=".jpg,.jpeg,.png,.webp,.mp4,.webm,.mov,.mp3,.wav,.m4a,.pdf" multiple onChange={(event) => setFiles([...event.target.files])} ref={inputRef} type="file"/></label>
          <div className="field-grid"><label className="field"><span>Vincular a una pieza · opcional</span><select onChange={(event) => setContentItemId(event.target.value)} value={contentItemId}><option value="">Biblioteca general</option>{items.map((item) => <option key={item.content_item_id} value={item.content_item_id}>{item.title}</option>)}</select></label><label className="field"><span>Nota · opcional</span><input maxLength="500" onChange={(event) => setNote(event.target.value)} placeholder="Ej. Foto propia autorizada" value={note}/></label></div>
          <footer><span>{files.length ? `${files.length} seleccionado${files.length === 1 ? '' : 's'}` : 'Formatos seguros: imagen, video, audio y PDF'}</span><button className="button-primary" disabled={!files.length || busyKey === 'upload'} type="submit"><WorkflowIcon name="upload" size={17}/>{busyKey === 'upload' ? 'Subiendo…' : 'Guardar en biblioteca'}</button></footer>
        </form>
        {error && <p className="form-error" role="alert">{error}</p>}
        <div aria-label="Filtrar archivos" className="filter-bar" role="group">{FILTERS.map((entry) => <button aria-pressed={filter === entry.id} className={filter === entry.id ? 'is-active' : ''} key={entry.id} onClick={() => setFilter(entry.id)} type="button">{entry.label}<span>{counts[entry.id]}</span></button>)}</div>
        {loading ? <div aria-busy="true" className="asset-loading" role="status">Cargando biblioteca…</div> : visible.length ? <div className="asset-grid">{visible.map((asset) => {
          const linked = items.find((item) => item.content_item_id === asset.content_item_id);
          return <article className="asset-card" key={asset.asset_key}><div className="asset-preview"><AssetPreview asset={asset}/><span className="asset-source">{asset.source === 'upload' ? 'Propio' : asset.job_state === 'approved' ? 'Generado · aprobado' : 'Generado'}</span></div><div className="asset-copy"><span>{kindLabel(asset.kind)} · {sizeLabel(asset.size)}</span><h3>{asset.name}</h3><p>{linked ? `Vinculado a: ${linked.title}` : asset.job_id || 'Biblioteca general'}</p><footer><a className="asset-download" download href={asset.url}><WorkflowIcon name="download" size={15}/>Descargar</a><button disabled={busyKey === asset.asset_key} onClick={() => changeStatus(asset, asset.status === 'discarded' ? 'active' : 'discarded')} type="button"><WorkflowIcon name={asset.status === 'discarded' ? 'restore' : 'archive'} size={15}/>{asset.status === 'discarded' ? 'Restaurar' : 'Descartar'}</button></footer></div></article>;
        })}</div> : <div className="empty-queue compact-empty"><WorkflowIcon name={filter === 'discarded' ? 'restore' : 'files'} size={32}/><h3>{filter === 'discarded' ? 'No hay archivos descartados' : 'Esta vista está vacía'}</h3><p>{filter === 'discarded' ? 'Cuando descartes una variante aparecerá aquí y podrás restaurarla.' : 'Sube un archivo propio o genera una pieza para verla aquí.'}</p></div>}
      </section>
      <aside className="asset-policy"><span className="eyebrow">Política de control</span><h2>Descartar no es borrar</h2><p>El Lab conserva el archivo y registra tu decisión. Puedes restaurarlo sin reconstruir el trabajo.</p><dl className="content-meta"><div><dt>Propios</dt><dd>Persisten en el volumen del Lab</dd></div><div><dt>Generados</dt><dd>Siguen vinculados a su trabajo</dd></div><div><dt>Descartados</dt><dd>Ocultos, pero recuperables</dd></div><div><dt>Borrado físico</dt><dd>Bloqueado en esta versión</dd></div></dl><div className="dialog-note"><WorkflowIcon name="check" size={18}/><span>Primero archivar y verificar; después liberar espacio. La biblioteca nunca publica ni envía archivos.</span></div></aside>
    </div>
  );
}
