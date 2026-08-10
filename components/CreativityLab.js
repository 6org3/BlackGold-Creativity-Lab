'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import BrandMark from './BrandMark';

const STATE = {
  queued: { label: 'En cola', tone: 'idle' },
  pending: { label: 'En cola', tone: 'idle' },
  running: { label: 'Generando', tone: 'working' },
  review: { label: 'Por revisar', tone: 'review' },
  superseded: { label: 'Reemplazada', tone: 'idle' },
  approved: { label: 'Aprobada', tone: 'success' },
  failed: { label: 'Falló', tone: 'danger' },
};

const WORKFLOW_LABELS = {
  hero_editorial: 'Hero editorial',
  quote_manifesto: 'Manifiesto',
  carousel_system: 'Carrusel',
  training_education: 'Educativo',
  event_promo: 'Promoción',
};

function Icon({ name, size = 20 }) {
  const paths = {
    lab: <><path d="M9 3v5l-4.5 8a3 3 0 0 0 2.6 4.5h9.8a3 3 0 0 0 2.6-4.5L15 8V3"/><path d="M7 13h10M8 3h8"/></>,
    queue: <><path d="M4 6h16M4 12h16M4 18h10"/><circle cx="18" cy="18" r="2"/></>,
    archive: <><path d="M4 7h16v13H4zM3 3h18v4H3zM9 11h6"/></>,
    settings: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1a1.7 1.7 0 0 0 1.9.3A1.7 1.7 0 0 0 10 3V2.8h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z"/></>,
    plus: <path d="M12 5v14M5 12h14"/>,
    refresh: <><path d="M20 7v5h-5M4 17v-5h5"/><path d="M6.1 9a7 7 0 0 1 11.5-2.6L20 9M4 15l2.4 2.6A7 7 0 0 0 18 15"/></>,
    arrow: <><path d="M5 12h14M14 7l5 5-5 5"/></>,
    check: <path d="m5 12 4 4L19 6"/>,
    close: <path d="m6 6 12 12M18 6 6 18"/>,
    chevron: <path d="m9 18 6-6-6-6"/>,
    spark: <path d="m12 3 1.3 4.2a5 5 0 0 0 3.3 3.3L21 12l-4.4 1.5a5 5 0 0 0-3.3 3.3L12 21l-1.3-4.2a5 5 0 0 0-3.3-3.3L3 12l4.4-1.5a5 5 0 0 0 3.3-3.3Z"/>,
  };
  return <svg aria-hidden="true" fill="none" height={size} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" viewBox="0 0 24 24" width={size}>{paths[name]}</svg>;
}

function artifact(job, filename) {
  return filename ? `/api/system-os/artifacts/${job.job_id}/${encodeURIComponent(filename)}` : '';
}

function relativeTime(value) {
  if (!value) return 'Ahora';
  const seconds = Math.max(0, Math.round((Date.now() - new Date(value).getTime()) / 1000));
  if (seconds < 60) return 'Ahora';
  if (seconds < 3600) return `Hace ${Math.floor(seconds / 60)} min`;
  if (seconds < 86400) return `Hace ${Math.floor(seconds / 3600)} h`;
  return new Intl.DateTimeFormat('es', { day: '2-digit', month: 'short' }).format(new Date(value));
}

function ServicePulse({ label, detail, active = false, warning = false }) {
  return <div className="service-pulse"><span className={`status-dot ${active ? 'is-active' : ''} ${warning ? 'is-warning' : ''}`} /><span><b>{label}</b><small>{detail}</small></span></div>;
}

function EmptyPreview({ state }) {
  return <div className="empty-preview"><Icon name={state === 'running' ? 'spark' : 'lab'} size={28}/><span>{state === 'running' ? 'Atlas está preparando las variantes' : 'La vista aparecerá cuando el render termine'}</span></div>;
}

function JobCard({ job, active, onSelect }) {
  const status = STATE[job.state] || STATE.queued;
  const image = artifact(job, job.preview_file || job.variants?.[0]?.file);
  return (
    <button className={`job-card ${active ? 'is-active' : ''}`} onClick={() => onSelect(job.job_id)} type="button">
      <div className="job-visual">{image ? <Image alt={`Vista previa de ${job.title}`} fill sizes="(max-width: 560px) 42vw, (max-width: 1180px) 40vw, 24vw" src={image} unoptimized/> : <EmptyPreview state={job.state}/>}<span className={`state-badge ${status.tone}`}>{status.label}</span></div>
      <div className="job-copy"><span>{WORKFLOW_LABELS[job.selected_workflow] || 'Imagen social'}</span><h3>{job.title}</h3><p>{job.subtitle || `Revisión ${job.revision || 0}`}</p><footer><span>{relativeTime(job.completed_at || job.created_at)}</span><Icon name="chevron" size={17}/></footer></div>
    </button>
  );
}

function CreatePiece({ open, busy, onClose, onCreate }) {
  const [form, setForm] = useState({ title: '', subtitle: '', prompt: '', format: 'portrait', variants: '3', workflow: 'auto', subject_anchor: 'auto' });
  const dialogRef = useRef(null);
  const update = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  const submit = (event) => { event.preventDefault(); onCreate(form); };
  useEffect(() => {
    if (!open) return undefined;
    const previous = document.activeElement;
    const dialog = dialogRef.current;
    const focusable = () => [...dialog.querySelectorAll('button:not(:disabled), input, textarea, select, [href]')];
    focusable()[0]?.focus();
    const onKeyDown = (event) => {
      if (event.key === 'Escape' && !busy) {
        event.preventDefault();
        onClose();
      }
      if (event.key === 'Tab') {
        const items = focusable();
        const first = items[0];
        const last = items.at(-1);
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      previous?.focus?.();
    };
  }, [busy, onClose, open]);
  if (!open) return null;
  return (
    <div className="dialog-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section aria-labelledby="new-piece-title" aria-modal="true" className="create-dialog" ref={dialogRef} role="dialog">
        <header><div><span className="eyebrow">System OS · Atlas</span><h2 id="new-piece-title">Nueva pieza visual</h2></div><button aria-label="Cerrar" className="icon-button" onClick={onClose} type="button"><Icon name="close"/></button></header>
        <form onSubmit={submit}>
          <label className="field field-wide"><span>Título de la pieza</span><input maxLength="100" name="title" onChange={update} placeholder="LA DISCIPLINA ANTES QUE LA MOTIVACIÓN" required value={form.title}/></label>
          <label className="field field-wide"><span>Dirección visual</span><textarea maxLength="3000" name="prompt" onChange={update} placeholder="Jugador de baloncesto en un túnel oscuro, fotografía editorial premium…" required rows="5" value={form.prompt}/></label>
          <label className="field field-wide"><span>Subtítulo opcional</span><input maxLength="220" name="subtitle" onChange={update} placeholder="El trabajo continúa cuando la emoción se acaba." value={form.subtitle}/></label>
          <div className="field-grid">
            <label className="field"><span>Formato</span><select name="format" onChange={update} value={form.format}><option value="portrait">Retrato · 4:5</option><option value="story">Historia · 9:16</option><option value="square">Cuadrado · 1:1</option><option value="landscape">Horizontal</option></select></label>
            <label className="field"><span>Variantes</span><select name="variants" onChange={update} value={form.variants}><option value="1">1 variante</option><option value="2">2 variantes</option><option value="3">3 variantes</option></select></label>
            <label className="field"><span>Workflow</span><select name="workflow" onChange={update} value={form.workflow}><option value="auto">Automático</option><option value="hero_editorial">Hero editorial</option><option value="quote_manifesto">Manifiesto</option><option value="carousel_system">Carrusel</option><option value="training_education">Educativo</option><option value="event_promo">Promoción</option></select></label>
            <label className="field"><span>Personaje</span><select name="subject_anchor" onChange={update} value={form.subject_anchor}><option value="auto">Composición automática</option><option value="right">A la derecha</option><option value="left">A la izquierda</option></select></label>
          </div>
          <div className="dialog-note"><Icon name="check" size={18}/><span>Atlas genera la imagen; el texto final se compone de forma determinista para conservar sintaxis y tipografía.</span></div>
          <footer><button className="button-secondary" onClick={onClose} type="button">Cancelar</button><button className="button-primary" disabled={busy} type="submit"><Icon name="spark" size={18}/>{busy ? 'Enviando…' : 'Crear con Atlas'}</button></footer>
        </form>
      </section>
    </div>
  );
}

export default function CreativityLab() {
  const [jobs, setJobs] = useState([]);
  const [health, setHealth] = useState({ dispatcher: false, drive: false, provider: 'System OS + ComfyUI' });
  const [activeId, setActiveId] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [revision, setRevision] = useState('');

  const load = useCallback(async () => {
    const [healthResult, jobsResult] = await Promise.allSettled([
      fetch('/api/system-os/health', { cache: 'no-store' }).then((response) => response.json()),
      fetch('/api/system-os/jobs?limit=30', { cache: 'no-store' }).then((response) => response.json()),
    ]);
    if (healthResult.status === 'fulfilled' && healthResult.value.ok) setHealth(healthResult.value);
    if (jobsResult.status === 'fulfilled' && jobsResult.value.ok) {
      setJobs(jobsResult.value.jobs || []);
      setActiveId((current) => current || jobsResult.value.jobs?.[0]?.job_id || null);
    }
  }, []);

  useEffect(() => {
    const initial = window.setTimeout(load, 0);
    const timer = window.setInterval(load, 8000);
    return () => { window.clearTimeout(initial); window.clearInterval(timer); };
  }, [load]);
  const active = useMemo(() => jobs.find((job) => job.job_id === activeId) || jobs[0], [jobs, activeId]);
  const running = jobs.filter((job) => ['running', 'queued', 'pending'].includes(job.state)).length;
  const review = jobs.filter((job) => job.state === 'review').length;
  const closeCreate = useCallback(() => { if (!busy) setCreateOpen(false); }, [busy]);

  const mutate = async (jobId, body, success) => {
    setBusy(true); setMessage('');
    try {
      const response = await fetch(`/api/system-os/jobs/${jobId}/actions`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const payload = await response.json();
      if (!response.ok || !payload.ok) throw new Error(payload.error || 'No se pudo completar la acción');
      setMessage(success); setRevision(''); await load();
    } catch (error) { setMessage(error.message); }
    finally { setBusy(false); }
  };

  const create = async (form) => {
    setBusy(true); setMessage('');
    try {
      const response = await fetch('/api/system-os/jobs', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job_type: 'generate_image', content_id: `bg-${Date.now()}`, approved_by: 'jorge',
          title: form.title.trim(), subtitle: form.subtitle.trim(), prompt: form.prompt.trim(),
          format: form.format, variants: Number(form.variants), workflow: form.workflow,
          subject_anchor: form.subject_anchor, content_type: 'social-image', intent: form.title.trim(),
        }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.ok) throw new Error(payload.error || 'No se pudo crear la pieza');
      setCreateOpen(false); setMessage(`Pieza ${payload.job_id} enviada a Atlas`); await load(); setActiveId(payload.job_id);
    } catch (error) { setMessage(error.message); }
    finally { setBusy(false); }
  };

  return (
    <main className="lab-shell" id="lab">
      <aside className="sidebar">
        <div className="brand-lockup"><div className="brand-mark"><BrandMark/></div><span><b>BLACK GOLD</b><small>Creativity Lab</small></span></div>
        <nav aria-label="Navegación principal"><a aria-current="page" className="nav-item is-active" href="#lab"><Icon name="lab"/><span>Laboratorio</span></a><a className="nav-item" href="#production"><Icon name="queue"/><span>Producción</span><em>{running + review}</em></a><a className="nav-item" href="#archive"><Icon name="archive"/><span>Archivo</span></a></nav>
        <div className="sidebar-foot"><span>Proveedor local</span><b>ComfyUI · RTX 4060</b><small>Premium desactivado</small><form action="/api/auth/logout" method="post"><button className="logout-button" type="submit">Cerrar sesión</button></form></div>
      </aside>

      <section className="workspace">
        <header className="topbar"><div><span className="eyebrow">Content OS · Imágenes</span><h1>Creativity Lab</h1></div><div className="top-actions"><button aria-label="Actualizar cola" className="icon-button" onClick={load} type="button"><Icon name="refresh"/></button><button className="button-primary" onClick={() => setCreateOpen(true)} type="button"><Icon name="plus" size={18}/><span>Nueva pieza</span></button></div></header>

        <div className="service-row" id="archive">
          <ServicePulse active={health.dispatcher} detail={health.dispatcher ? 'Cola disponible' : 'Sin respuesta'} label="Servidor"/>
          <ServicePulse active={health.dispatcher} detail={running ? `${running} tarea${running === 1 ? '' : 's'} activa${running === 1 ? '' : 's'}` : 'En espera'} label="Atlas + GPU"/>
          <ServicePulse active={health.drive} detail={health.drive ? 'Archivo conectado' : 'Falta autorizar'} label="Google Drive" warning={!health.drive}/>
          <span className="provider-note">Ruta actual: <b>{health.provider}</b></span>
        </div>

        <section aria-label="Flujo de producción" className="production-flow">
          {['Idea', 'Brief', 'Atlas', 'Revisión', 'Drive'].map((step, index) => <div className={index === 2 && running ? 'is-current' : ''} key={step}><span>{String(index + 1).padStart(2, '0')}</span><b>{step}</b>{index < 4 && <Icon name="arrow" size={16}/>}</div>)}
        </section>

        {message && <div className="notice" role="status"><span>{message}</span><button aria-label="Ocultar mensaje" onClick={() => setMessage('')} type="button"><Icon name="close" size={16}/></button></div>}

        <div className="content-grid">
          <section className="queue-panel" id="production"><header className="section-head"><div><span className="eyebrow">Cola canónica</span><h2>Producción visual</h2></div><p><b>{review}</b> por revisar · <b>{running}</b> en proceso</p></header><div className="job-grid">{jobs.length ? jobs.map((job) => <JobCard active={active?.job_id === job.job_id} job={job} key={job.job_id} onSelect={setActiveId}/>) : <div className="empty-queue"><BrandMark/><h3>La mesa está lista</h3><p>Crea la primera pieza para iniciar el circuito visual.</p><button className="button-secondary" onClick={() => setCreateOpen(true)}>Nueva pieza</button></div>}</div></section>

          <aside className="inspector">
            <div className="inspector-head"><span className="eyebrow">Pieza activa</span><h2>{active?.title || 'Sin selección'}</h2><p>{active?.job_id || 'Selecciona una pieza de la cola'}</p></div>
            {active && <>
              <div className="inspector-preview">{artifact(active, active.preview_file || active.variants?.[0]?.file) ? <Image alt={`Pieza activa: ${active.title}`} fill sizes="310px" src={artifact(active, active.preview_file || active.variants?.[0]?.file)} unoptimized/> : <EmptyPreview state={active.state}/>}</div>
              <div className="variant-list"><div className="rail-label"><span>Variantes</span><b>{active.selected_variant ? `${active.selected_variant} elegida` : 'Elige una'}</b></div><div>{active.variants?.map((variant) => <button aria-label={`Elegir variante ${variant.key}`} className={active.selected_variant === variant.key ? 'is-selected' : ''} disabled={busy || active.state !== 'review'} key={variant.key} onClick={() => mutate(active.job_id, { action: 'select_variant', variant: variant.key }, `Variante ${variant.key} seleccionada`)} type="button"><Image alt="" fill sizes="90px" src={artifact(active, variant.file)} unoptimized/><span>{variant.key}</span></button>)}</div></div>
              {active.state === 'review' && <div className="review-actions"><button className="button-approval full" disabled={busy || (active.variants_requested > 1 && !active.selected_variant)} onClick={() => mutate(active.job_id, { action: 'approve' }, 'Pieza aprobada; publicación aún pendiente')} type="button"><Icon name="check" size={18}/>Aprobar pieza</button><label className="revision-field"><span>Pedir un cambio</span><textarea maxLength="500" onChange={(event) => setRevision(event.target.value)} placeholder="Mueve al jugador a la derecha y deja el texto a la izquierda…" rows="3" value={revision}/></label><button className="button-secondary full" disabled={busy || revision.trim().length < 3} onClick={() => mutate(active.job_id, { action: 'revise', instruction: revision }, 'Revisión enviada a Atlas')} type="button">Crear revisión</button></div>}
              <dl className="job-meta"><div><dt>Workflow</dt><dd>{WORKFLOW_LABELS[active.selected_workflow] || active.selected_workflow}</dd></div><div><dt>Formato</dt><dd>{active.format}</dd></div><div><dt>Revisión</dt><dd>v{(active.revision || 0) + 1}</dd></div></dl>
            </>}
            <div className="agent-rail"><div className="rail-label"><span>Agentes del circuito</span><b>4 roles</b></div>{[['Edison','Dirección y brief',true],['Atlas','Imagen y composición',running > 0],['Hyperframes','Animación · siguiente etapa',false],['Archivista','Entrega a Drive',health.drive]].map(([name, role, activeAgent]) => <div className="agent-row" key={name}><span className={`agent-avatar ${activeAgent ? 'is-live' : ''}`}>{name[0]}</span><span><b>{name}</b><small>{role}</small></span><em>{activeAgent ? 'Activo' : 'En espera'}</em></div>)}</div>
          </aside>
        </div>
      </section>
      <CreatePiece busy={busy} onClose={closeCreate} onCreate={create} open={createOpen}/>
    </main>
  );
}
