'use client';

import { useEffect, useRef, useState } from 'react';
import workflow from '../../lib/content-workflow';
import WorkflowIcon from './WorkflowIcon';

const { CONTENT_FORMAT_LABELS, FORMAT_LABELS, OBJECTIVES, PILLARS, PLATFORM_LABELS } = workflow;
const CONTENT_FORMAT_IDS = Object.keys(CONTENT_FORMAT_LABELS);
const FORMAT_IDS = Object.keys(FORMAT_LABELS);
const PLATFORM_IDS = Object.keys(PLATFORM_LABELS);
const emptyField = () => ({ key: '', label: '', type: 'textarea', required: true, placeholder: '' });

function initialize(initial) {
  if (!initial) {
    return {
      name: '', description: '', formats: ['portrait'], platforms: ['instagram'],
      contentFormat: 'static', executionMode: 'plan_only', objectives: OBJECTIVES.map((item) => item.id),
      pillars: PILLARS.map((item) => item.id), fields: [emptyField()], checklist: '',
      workflow: 'auto', variants: 3,
    };
  }
  return {
    name: initial.name, description: initial.description, formats: initial.formats,
    platforms: initial.platforms, contentFormat: initial.content_format || 'static', executionMode: initial.execution_mode,
    objectives: initial.recommendation.objectives, pillars: initial.recommendation.pillars,
    fields: initial.fields.map((field) => ({ ...field })), checklist: initial.checklist.join('\n'),
    workflow: initial.render_defaults?.workflow || 'auto', variants: initial.render_defaults?.variants || 3,
  };
}

function Checks({ choices, label, selected, onToggle }) {
  return <fieldset className="choice-fieldset"><legend>{label}</legend><div>{choices.map((choice) => { const id = choice.id || choice; const text = choice.label || choice; return <label key={id}><input checked={selected.includes(id)} onChange={() => onToggle(id)} type="checkbox"/><span>{text}</span></label>; })}</div></fieldset>;
}

export default function TemplateEditor({ busy, initial, onClose, onSave, open }) {
  const dialogRef = useRef(null);
  const [error, setError] = useState('');
  const [form, setForm] = useState(() => initialize(initial));
  useEffect(() => {
    if (!open) return undefined;
    const previous = document.activeElement; const dialog = dialogRef.current;
    dialog.querySelector('input')?.focus();
    const keydown = (event) => {
      if (event.key === 'Escape' && !busy) { event.preventDefault(); onClose(); }
      if (event.key !== 'Tab') return;
      const items = [...dialog.querySelectorAll('button:not(:disabled), input:not(:disabled), textarea:not(:disabled), select:not(:disabled)')];
      if (event.shiftKey && document.activeElement === items[0]) { event.preventDefault(); items.at(-1)?.focus(); }
      else if (!event.shiftKey && document.activeElement === items.at(-1)) { event.preventDefault(); items[0]?.focus(); }
    };
    document.addEventListener('keydown', keydown);
    return () => { document.removeEventListener('keydown', keydown); previous?.focus?.(); };
  }, [busy, onClose, open]);
  if (!open) return null;
  const toggle = (key, value) => setForm((current) => ({ ...current, [key]: current[key].includes(value) ? current[key].filter((item) => item !== value) : [...current[key], value] }));
  const fieldChange = (index, key, value) => setForm((current) => ({ ...current, fields: current.fields.map((field, position) => position === index ? { ...field, [key]: value } : field) }));
  const submit = () => {
    if (form.name.trim().length < 3 || form.description.trim().length < 8) return setError('Completa nombre y descripción.');
    if (!form.formats.length || !form.platforms.length || !form.objectives.length || !form.pillars.length) return setError('Elige al menos un formato, plataforma, objetivo y pilar.');
    if (!form.fields.length || form.fields.some((field) => !/^[a-z][a-z0-9_]{1,39}$/.test(field.key) || field.label.trim().length < 2)) return setError('Cada campo necesita una clave segura y una etiqueta.');
    onSave({
      expected_revision: initial?.revision,
      name: form.name.trim(), description: form.description.trim(), formats: form.formats,
      platforms: form.platforms, content_format: form.contentFormat, execution_mode: form.executionMode,
      recommendation: { objectives: form.objectives, pillars: form.pillars, objective_weights: {}, pillar_weights: {} },
      fields: form.fields.map((field) => ({ ...field, key: field.key.trim(), label: field.label.trim(), placeholder: field.placeholder.trim() })),
      checklist: form.checklist.split('\n').map((item) => item.trim()).filter(Boolean),
      render_defaults: form.executionMode === 'image_auto' ? { workflow: form.workflow, variants: Number(form.variants), subject_anchor: 'auto' } : {},
    });
  };
  return (
    <div className="dialog-backdrop" onMouseDown={(event) => event.target === event.currentTarget && !busy && onClose()}>
      <section aria-labelledby="template-editor-title" aria-modal="true" className="create-dialog template-editor" ref={dialogRef} role="dialog">
        <header><div><span className="eyebrow">Editor del dueño</span><h2 id="template-editor-title">{initial ? initial.status === 'active' ? `Crear versión ${initial.version + 1}` : 'Editar borrador' : 'Nueva plantilla'}</h2></div><button aria-label="Cerrar" className="icon-button" disabled={busy} onClick={onClose} type="button"><WorkflowIcon name="close"/></button></header>
        {error && <p className="form-error" role="alert">{error}</p>}
        <div className="template-editor-body">
          <div className="field-grid"><label className="field"><span>Nombre</span><input maxLength="80" onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} value={form.name}/></label><label className="field"><span>Tipo de pieza</span><select onChange={(event) => setForm((current) => ({ ...current, contentFormat: event.target.value, executionMode: event.target.value === 'static' ? current.executionMode : 'plan_only' }))} value={form.contentFormat}>{CONTENT_FORMAT_IDS.map((id) => <option key={id} value={id}>{CONTENT_FORMAT_LABELS[id]}</option>)}</select></label><label className="field"><span>Modo</span><select onChange={(event) => setForm((current) => ({ ...current, executionMode: event.target.value }))} value={form.executionMode}><option value="plan_only">Plan y checklist</option>{form.contentFormat === 'static' && <option value="image_auto">Render local de imagen</option>}</select></label></div>
          <label className="field"><span>Descripción</span><textarea maxLength="400" onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} rows="3" value={form.description}/></label>
          <div className="template-choice-grid"><Checks choices={OBJECTIVES} label="Objetivos" onToggle={(value) => toggle('objectives', value)} selected={form.objectives}/><Checks choices={PILLARS} label="Pilares" onToggle={(value) => toggle('pillars', value)} selected={form.pillars}/><Checks choices={FORMAT_IDS.map((id) => ({ id, label: FORMAT_LABELS[id] }))} label="Formatos" onToggle={(value) => toggle('formats', value)} selected={form.formats}/><Checks choices={PLATFORM_IDS.map((id) => ({ id, label: PLATFORM_LABELS[id] }))} label="Plataformas" onToggle={(value) => toggle('platforms', value)} selected={form.platforms}/></div>
          {form.executionMode === 'image_auto' && <div className="field-grid"><label className="field"><span>Workflow visual</span><select onChange={(event) => setForm((current) => ({ ...current, workflow: event.target.value }))} value={form.workflow}><option value="auto">Automático</option><option value="hero_editorial">Hero editorial</option><option value="quote_manifesto">Manifiesto</option><option value="training_tactical">Entrenamiento táctico</option><option value="carousel_cover">Portada carrusel</option><option value="event_poster">Evento</option></select></label><label className="field"><span>Variantes</span><select onChange={(event) => setForm((current) => ({ ...current, variants: event.target.value }))} value={form.variants}><option value="1">1</option><option value="2">2</option><option value="3">3</option></select></label></div>}
          <section className="field-builder"><header><div><span className="eyebrow">Brief dinámico</span><h3>Campos</h3></div><button className="button-secondary" onClick={() => setForm((current) => ({ ...current, fields: [...current.fields, emptyField()] }))} type="button"><WorkflowIcon name="plus" size={16}/>Añadir campo</button></header>{form.fields.map((field, index) => <div className="field-builder-row" key={index}><input aria-label={`Clave del campo ${index + 1}`} onChange={(event) => fieldChange(index, 'key', event.target.value)} placeholder="central_message" value={field.key}/><input aria-label={`Etiqueta del campo ${index + 1}`} onChange={(event) => fieldChange(index, 'label', event.target.value)} placeholder="Mensaje central" value={field.label}/><select aria-label={`Tipo del campo ${index + 1}`} onChange={(event) => fieldChange(index, 'type', event.target.value)} value={field.type}><option value="text">Una línea</option><option value="textarea">Texto largo</option></select><label className="compact-check"><input checked={field.required} onChange={(event) => fieldChange(index, 'required', event.target.checked)} type="checkbox"/><span>Obligatorio</span></label><input aria-label={`Ayuda del campo ${index + 1}`} className="field-placeholder" onChange={(event) => fieldChange(index, 'placeholder', event.target.value)} placeholder="Ayuda visible para el operador" value={field.placeholder}/><button aria-label={`Eliminar campo ${index + 1}`} className="icon-button" disabled={form.fields.length === 1} onClick={() => setForm((current) => ({ ...current, fields: current.fields.filter((_, position) => position !== index) }))} type="button"><WorkflowIcon name="trash" size={16}/></button></div>)}</section>
          <label className="field"><span>Checklist · una línea por control</span><textarea onChange={(event) => setForm((current) => ({ ...current, checklist: event.target.value }))} rows="5" value={form.checklist}/></label>
          <div className="dialog-note"><WorkflowIcon name="check" size={18}/><span>Editar una plantilla activa crea una versión nueva. Las piezas anteriores conservan exactamente la versión usada.</span></div>
        </div>
        <footer className="wizard-footer"><span/><div><button className="button-secondary" disabled={busy} onClick={onClose} type="button">Cancelar</button><button className="button-primary" disabled={busy} onClick={submit} type="button"><WorkflowIcon name="check" size={18}/>{busy ? 'Guardando…' : initial?.status === 'active' ? 'Crear versión' : 'Guardar borrador'}</button></div></footer>
      </section>
    </div>
  );
}
