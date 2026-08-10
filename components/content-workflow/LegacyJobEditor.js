'use client';

import { useEffect, useState } from 'react';
import JobReviewPanel from './JobReviewPanel';
import WorkflowIcon from './WorkflowIcon';

const TERMINAL_STATES = new Set(['failed', 'approved', 'superseded']);
const WORKFLOWS = [
  ['auto', 'Automático'],
  ['hero_editorial', 'Hero editorial'],
  ['quote_manifesto', 'Manifiesto'],
  ['training_tactical', 'Entrenamiento táctico'],
  ['carousel_cover', 'Portada de carrusel'],
  ['event_poster', 'Promoción de evento'],
  ['carousel_system', 'Carrusel · flujo anterior'],
  ['training_education', 'Educativo · flujo anterior'],
  ['event_promo', 'Promoción · flujo anterior'],
];

function formFrom(job) {
  return {
    title: job?.title || '',
    subtitle: job?.subtitle || '',
    prompt: job?.prompt || '',
    intent: job?.intent || job?.title || '',
    format: job?.format || 'portrait',
    variants: String(job?.variants_requested || job?.variants || 1),
    workflow: job?.selected_workflow || job?.workflow || 'auto',
    subjectAnchor: job?.subject_anchor || 'auto',
  };
}

export default function LegacyJobEditor({ busy, job, onManageAssets, onMutate, onRelaunch }) {
  const [detail, setDetail] = useState(job);
  const [form, setForm] = useState(() => formFrom(job));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const editable = TERMINAL_STATES.has(job.state);

  useEffect(() => {
    let active = true;
    fetch(`/api/system-os/jobs/${job.job_id}`, { cache: 'no-store' })
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok || !payload.ok) throw new Error(payload.error || 'No se pudo abrir el trabajo');
        return payload.job || payload;
      })
      .then((value) => { if (active) { setDetail(value); setForm(formFrom(value)); } })
      .catch((reason) => { if (active) setError(reason.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [job.job_id]);

  const update = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  const submit = async (event) => {
    event.preventDefault();
    if (form.title.trim().length < 3 || form.prompt.trim().length < 12) {
      setError('Completa un título y una dirección visual más específica.');
      return;
    }
    setError('');
    try { await onRelaunch(detail, form); }
    catch (reason) { setError(reason.message); }
  };

  return (
    <div className="legacy-job-editor">
      <div className="dialog-note legacy-note"><WorkflowIcon name="archive" size={18}/><span>Trabajo anterior conservado como historial. Los cambios crean una versión nueva; no eliminan ni sobrescriben este registro.</span></div>
      <JobReviewPanel busy={busy} job={job} onManageAssets={onManageAssets} onMutate={onMutate}/>
      {loading && <p className="inline-status" role="status">Cargando dirección y metadatos…</p>}
      {error && <p className="form-error" role="alert">{error}</p>}
      {!loading && editable && <form className="legacy-edit-form" onSubmit={submit}>
        <div className="rail-label"><span>Nueva versión editable</span><b>Atlas · Windows</b></div>
        <div className="field-grid"><label className="field"><span>Título</span><input maxLength="100" name="title" onChange={update} value={form.title}/></label><label className="field"><span>Subtítulo</span><input maxLength="220" name="subtitle" onChange={update} value={form.subtitle}/></label></div>
        <label className="field field-wide"><span>Dirección visual</span><textarea maxLength="3000" name="prompt" onChange={update} rows="5" value={form.prompt}/></label>
        <label className="field field-wide"><span>Objetivo de la pieza</span><textarea maxLength="500" name="intent" onChange={update} rows="2" value={form.intent}/></label>
        <div className="field-grid"><label className="field"><span>Formato</span><select name="format" onChange={update} value={form.format}><option value="portrait">Retrato · 4:5</option><option value="story">Vertical · 9:16</option><option value="square">Cuadrado · 1:1</option><option value="landscape">Horizontal · 16:9</option></select></label><label className="field"><span>Variantes</span><select name="variants" onChange={update} value={form.variants}><option value="1">1 variante</option><option value="2">2 variantes</option><option value="3">3 variantes</option></select></label><label className="field"><span>Workflow</span><select name="workflow" onChange={update} value={form.workflow}>{WORKFLOWS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label className="field"><span>Composición</span><select name="subjectAnchor" onChange={update} value={form.subjectAnchor}><option value="auto">Automática</option><option value="left">Personaje a la izquierda</option><option value="right">Personaje a la derecha</option></select></label></div>
        <button className="button-primary full" disabled={busy} type="submit"><WorkflowIcon name="refresh" size={18}/>{busy ? 'Creando versión…' : 'Crear nueva versión'}</button>
      </form>}
      {!loading && !editable && job.state !== 'review' && <div className="dialog-note"><WorkflowIcon name="queue" size={18}/><span>Este trabajo está activo. Podrás editar una nueva versión cuando Atlas termine; durante la revisión puedes pedir un cambio desde este mismo panel.</span></div>}
    </div>
  );
}
