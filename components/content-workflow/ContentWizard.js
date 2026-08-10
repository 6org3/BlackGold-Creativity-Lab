'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import workflow from '../../lib/content-workflow';
import BriefFields from './BriefFields';
import WorkflowIcon from './WorkflowIcon';

const { CONTENT_FORMAT_LABELS, FORMAT_LABELS, OBJECTIVES, PILLARS, PLATFORM_LABELS, seedBrief, sortTemplates, strategyFor } = workflow;
const STEPS = ['Estrategia', 'Plantilla', 'Canales', 'Brief'];

function BriefAssistant({ assets, busy, info, onAssetToggle, onComplete, onReference, onSource, reference, selectedAssets, source }) {
  return <section className="brief-assistant"><header><span><WorkflowIcon name="spark" size={19}/></span><div><b>Completar brief desde una idea</b><small>Pega un resumen, guion, escaleta o nota atómica. El servidor llena la plantilla para que tú corrijas y supervises.</small></div></header><label className="field field-wide"><span>Idea, guion o contenido de referencia</span><textarea maxLength="8000" onChange={(event) => onSource(event.target.value)} placeholder="Ej. Carrusel que explique que Black Gold no es solo entrenar: el sistema acompaña, mide y organiza el progreso…" rows="5" value={source}/><small className="field-help">No pegues nombres, teléfonos ni datos individuales de atletas o menores.</small></label><label className="field field-wide"><span>Nombre de la referencia · opcional</span><input maxLength="180" onChange={(event) => onReference(event.target.value)} placeholder="Nota atómica · lanzamiento de entrenamientos" value={reference}/></label>{assets.length > 0 && <fieldset className="assist-assets"><legend>Archivos propios para considerar · opcional</legend><div>{assets.map((asset) => <label key={asset.asset_id}><input checked={selectedAssets.includes(asset.asset_id)} onChange={() => onAssetToggle(asset.asset_id)} type="checkbox"/><span><b>{asset.name}</b><small>{asset.kind} · permanece privado</small></span></label>)}</div></fieldset>}<div className="assist-action"><button className="button-secondary" disabled={busy || source.trim().length < 12} onClick={onComplete} type="button"><WorkflowIcon name="spark" size={17}/>{busy ? 'Completando…' : 'Completar toda la plantilla'}</button><small>No consulta PII ni publica. Solo propone un borrador editable.</small></div>{info && <div className="assist-result" role="status"><WorkflowIcon name="check" size={17}/><span><b>Plantilla completada.</b> Contexto {info.mode === 'server_snapshot' ? 'actualizado en el servidor privado' : 'seguro integrado'} · {info.updatedAt ? new Date(info.updatedAt).toLocaleDateString('es') : 'sin fecha'}.</span></div>}</section>;
}

function initialize(initial, templates) {
  const item = initial?.item;
  const objective = item?.objective || initial?.objective || 'educate';
  const pillar = item?.pillar || initial?.pillar || 'technique';
  const ranked = sortTemplates(templates.filter((template) => template.status === 'active'), objective, pillar);
  const template = item?.template_snapshot
    || templates.find((candidate) => candidate.template_id === (item?.template_id || initial?.templateId))
    || ranked[0];
  if (!template) return { step: 0, form: null };
  return {
    step: item ? 3 : initial?.templateId ? 2 : 0,
    form: {
      objective, pillar, templateId: template.template_id, title: item?.title || '',
      audience: item?.audience || 'Atletas y familias Black Gold',
      platforms: item?.platforms || [template.platforms[0]],
      format: item?.format || template.formats[0], plannedFor: item?.planned_for || '',
      brief: item?.brief || seedBrief(template, objective, pillar),
    },
  };
}

export default function ContentWizard({ busy, initial, onClose, onSave, open, templates }) {
  const dialogRef = useRef(null);
  const headingRef = useRef(null);
  const [initialState] = useState(() => initialize(initial, templates));
  const [step, setStep] = useState(initialState.step);
  const [error, setError] = useState('');
  const [form, setForm] = useState(initialState.form);
  const [source, setSource] = useState('');
  const [sourceReference, setSourceReference] = useState('');
  const [assets, setAssets] = useState([]);
  const [selectedAssets, setSelectedAssets] = useState([]);
  const [assistBusy, setAssistBusy] = useState(false);
  const [assistInfo, setAssistInfo] = useState(null);
  const ready = Boolean(form);
  const editing = Boolean(initial?.item);

  useEffect(() => {
    if (!open || !ready) return undefined;
    const previous = document.activeElement;
    const dialog = dialogRef.current;
    headingRef.current?.focus();
    const onKeyDown = (event) => {
      if (event.key === 'Escape' && !busy) { event.preventDefault(); onClose(); }
      if (event.key !== 'Tab') return;
      const focusable = [...dialog.querySelectorAll('button:not(:disabled), input:not(:disabled), textarea:not(:disabled), select:not(:disabled)')];
      const first = focusable[0]; const last = focusable.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => { document.removeEventListener('keydown', onKeyDown); previous?.focus?.(); };
  }, [busy, onClose, open, ready]);

  useEffect(() => { if (open) headingRef.current?.focus(); }, [open, step]);

  useEffect(() => {
    if (!open) return undefined;
    let active = true;
    fetch('/api/assets', { cache: 'no-store' })
      .then((response) => response.json())
      .then((payload) => { if (active && payload.ok) setAssets((payload.assets || []).filter((asset) => asset.source === 'upload' && asset.status === 'active').slice(0, 12)); })
      .catch(() => {});
    return () => { active = false; };
  }, [open]);

  const template = useMemo(
    () => initial?.item?.template_snapshot || templates.find((candidate) => candidate.template_id === form?.templateId),
    [form?.templateId, initial?.item?.template_snapshot, templates],
  );
  const ranked = useMemo(() => form ? sortTemplates(templates.filter((candidate) => candidate.status === 'active'), form.objective, form.pillar) : [], [form, templates]);
  if (!open || !form || !template) return null;
  const strategy = strategyFor(form.objective, form.pillar);

  const chooseTemplate = (next) => setForm((current) => ({
    ...current,
    templateId: next.template_id,
    platforms: current.platforms.filter((platform) => next.platforms.includes(platform)).length ? current.platforms.filter((platform) => next.platforms.includes(platform)) : [next.platforms[0]],
    format: next.formats.includes(current.format) ? current.format : next.formats[0],
    brief: seedBrief(next, current.objective, current.pillar),
  }));
  const changeStrategy = (key, value) => setForm((current) => {
    const next = { ...current, [key]: value };
    return { ...next, brief: seedBrief(template, next.objective, next.pillar) };
  });
  const togglePlatform = (platform) => setForm((current) => ({
    ...current,
    platforms: current.platforms.includes(platform)
      ? current.platforms.filter((item) => item !== platform)
      : [...current.platforms, platform],
  }));
  const toggleAsset = (assetId) => setSelectedAssets((current) => current.includes(assetId) ? current.filter((id) => id !== assetId) : [...current, assetId]);
  const completeBrief = async () => {
    setAssistBusy(true); setError(''); setAssistInfo(null);
    try {
      const response = await fetch('/api/content-assist', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source_text: source, source_reference: sourceReference, objective: form.objective, pillar: form.pillar, audience: form.audience, asset_ids: selectedAssets, template: { template_id: template.template_id, name: template.name, content_format: template.content_format, fields: template.fields.map(({ key, label, required }) => ({ key, label, required })) } }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.ok) throw new Error(payload.error || 'No se pudo completar el brief.');
      setForm((current) => ({ ...current, title: payload.title, audience: payload.audience, brief: { ...current.brief, ...payload.brief } }));
      setAssistInfo({ mode: payload.context_mode, updatedAt: payload.provenance?.context_updated_at });
    } catch (reason) { setError(reason.message); }
    finally { setAssistBusy(false); }
  };

  const validate = () => {
    if (step === 2 && !form.platforms.length) return 'Elige al menos una plataforma.';
    if (step === 3) {
      if (form.title.trim().length < 3) return 'Escribe un título de al menos 3 caracteres.';
      if (form.audience.trim().length < 2) return 'Define la audiencia.';
      const missing = template.fields.find((field) => field.required && !String(form.brief[field.key] || '').trim());
      if (missing) return `Completa ${missing.label}.`;
    }
    return '';
  };
  const next = () => { const message = validate(); if (message) return setError(message); setError(''); setStep((current) => Math.min(3, current + 1)); };
  const submit = (mode) => {
    const message = validate();
    if (message) return setError(message);
    onSave({
      item: initial?.item,
      mode,
      payload: {
        template_id: template.template_id,
        template_version: template.version,
        title: form.title.trim(),
        objective: form.objective,
        pillar: form.pillar,
        audience: form.audience.trim(),
        platforms: form.platforms,
        format: form.format,
        brief: form.brief,
        planned_for: form.plannedFor,
        stage: mode === 'draft' ? 'draft' : 'brief',
      },
    });
  };

  return (
    <div className="dialog-backdrop" onMouseDown={(event) => event.target === event.currentTarget && !busy && onClose()}>
      <section aria-labelledby="workflow-wizard-title" aria-modal="true" className="create-dialog workflow-wizard" ref={dialogRef} role="dialog">
        <header><div><span className="eyebrow">Social Media Content Workflow</span><h2 id="workflow-wizard-title" ref={headingRef} tabIndex="-1">{editing ? 'Editar brief' : 'Nueva pieza'} · {STEPS[step]}</h2></div><button aria-label="Cerrar" className="icon-button" disabled={busy} onClick={onClose} type="button"><WorkflowIcon name="close"/></button></header>
        <ol aria-label="Progreso" className="wizard-progress">{STEPS.map((label, index) => <li aria-current={index === step ? 'step' : undefined} className={index === step ? 'is-current' : index < step ? 'is-complete' : ''} key={label}><span>{index + 1}</span><b>{label}</b></li>)}</ol>
        {error && <p className="form-error" role="alert">{error}</p>}
        <div className="wizard-body">
          {step === 0 && <><div className="field-grid"><label className="field"><span>Objetivo</span><select onChange={(event) => changeStrategy('objective', event.target.value)} value={form.objective}>{OBJECTIVES.map((item) => <option key={item.id} value={item.id}>{item.label} · {item.short}</option>)}</select></label><label className="field"><span>Pilar</span><select onChange={(event) => changeStrategy('pillar', event.target.value)} value={form.pillar}>{PILLARS.map((item) => <option key={item.id} value={item.id}>{item.label} · {item.short}</option>)}</select></label></div><div className="strategy-preview"><span className="eyebrow">{strategy.label}</span><h3>{strategy.promise}</h3><p>{strategy.angle}</p><dl><div><dt>Gancho</dt><dd>{strategy.hook}</dd></div><div><dt>Visual</dt><dd>{strategy.visual}</dd></div><div><dt>CTA sugerido</dt><dd>{strategy.cta}</dd></div></dl></div></>}
          {step === 1 && <div className="wizard-template-list">{ranked.map((candidate, index) => <button aria-pressed={form.templateId === candidate.template_id} className={form.templateId === candidate.template_id ? 'is-selected' : ''} key={candidate.template_id} onClick={() => chooseTemplate(candidate)} type="button"><span>{String(index + 1).padStart(2, '0')}</span><span><b>{candidate.name}</b><small>{candidate.description}</small></span><em>{candidate.execution_mode === 'image_auto' ? 'Render local' : 'Plan y checklist'}</em></button>)}</div>}
          {step === 2 && <><div className="dialog-note"><WorkflowIcon name={template.execution_mode === 'image_auto' ? 'image' : 'film'} size={18}/><span><b>{CONTENT_FORMAT_LABELS[template.content_format] || template.name}.</b> {template.execution_mode === 'image_auto' ? 'System OS puede crear este arte localmente; la entrega queda dentro del Lab y no envía mensajes.' : 'Crea un plan y checklist; no iniciará un render ni contactará servicios externos.'}</span></div><fieldset className="choice-fieldset"><legend>Plataformas</legend><div>{template.platforms.map((platform) => <label key={platform}><input checked={form.platforms.includes(platform)} onChange={() => togglePlatform(platform)} type="checkbox"/><span>{PLATFORM_LABELS[platform]}</span></label>)}</div></fieldset><fieldset className="choice-fieldset"><legend>Relación de aspecto</legend><div>{template.formats.map((format) => <label key={format}><input checked={form.format === format} name="output-format" onChange={() => setForm((current) => ({ ...current, format }))} type="radio"/><span>{FORMAT_LABELS[format]}</span></label>)}</div></fieldset></>}
          {step === 3 && <div className="brief-form"><BriefAssistant assets={assets} busy={assistBusy} info={assistInfo} onAssetToggle={toggleAsset} onComplete={completeBrief} onReference={setSourceReference} onSource={setSource} reference={sourceReference} selectedAssets={selectedAssets} source={source}/><div className="field-grid"><label className="field"><span>Título de trabajo</span><input maxLength="120" onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} placeholder="Tres claves para mejorar tu tiro" value={form.title}/></label><label className="field"><span>Audiencia</span><input maxLength="160" onChange={(event) => setForm((current) => ({ ...current, audience: event.target.value }))} value={form.audience}/></label></div><label className="field"><span>Fecha prevista · opcional</span><input onChange={(event) => setForm((current) => ({ ...current, plannedFor: event.target.value }))} type="date" value={form.plannedFor}/></label><BriefFields brief={form.brief} fields={template.fields} onChange={(key, value) => setForm((current) => ({ ...current, brief: { ...current.brief, [key]: value } }))}/><div className="dialog-note"><WorkflowIcon name="check" size={18}/><span>{template.execution_mode === 'image_auto' && !editing ? 'Al crear, se abrirá un trabajo local con entrega desactivada. La publicación seguirá bloqueada.' : 'El plan quedará auditado y podrá avanzar manualmente hasta Listo para programar.'}</span></div></div>}
        </div>
        <footer className="wizard-footer"><div>{step > 0 && !editing && <button className="button-secondary" disabled={busy} onClick={() => { setError(''); setStep((current) => current - 1); }} type="button"><WorkflowIcon name="back" size={17}/>Anterior</button>}</div><div>{!editing && step === 3 && <button className="button-secondary" disabled={busy} onClick={() => submit('draft')} type="button">Guardar borrador</button>}{step < 3 && !editing ? <button className="button-primary" onClick={next} type="button">Continuar<WorkflowIcon name="chevron" size={17}/></button> : <button className="button-primary" disabled={busy} onClick={() => submit(editing ? 'update' : template.execution_mode === 'image_auto' ? 'render' : 'plan')} type="button"><WorkflowIcon name="check" size={18}/>{busy ? 'Guardando…' : editing ? 'Guardar cambios' : template.execution_mode === 'image_auto' ? 'Crear y enviar a producción' : 'Crear plan'}</button>}</div></footer>
      </section>
    </div>
  );
}
