'use client';

import workflow from '../../lib/content-workflow';
import JobReviewPanel from './JobReviewPanel';
import WorkflowIcon from './WorkflowIcon';

const { CONTENT_FORMAT_LABELS, FORMAT_LABELS, PLATFORM_LABELS, strategyFor } = workflow;

function nextAction(item, template, job) {
  if (item.stage === 'draft') return { label: 'Editar y completar brief', edit: true };
  if (item.stage === 'brief') return template?.execution_mode === 'image_auto'
    ? { label: 'Enviar a producción local', action: 'send_to_production' }
    : { label: 'Iniciar producción manual', action: 'advance', stage: 'production' };
  if (item.stage === 'production' && template?.execution_mode === 'plan_only') return { label: 'Marcar en revisión', action: 'advance', stage: 'review' };
  if (item.stage === 'review' && template?.execution_mode === 'plan_only') return { label: 'Aprobar plan', action: 'advance', stage: 'approved' };
  if (item.stage === 'approved') return { label: 'Marcar listo para programar', action: 'mark_ready_to_schedule' };
  if (item.stage === 'ready_to_schedule') return { label: 'Archivar pieza', action: 'archive' };
  if (job?.state === 'failed') return { label: 'Editar dirección antes de reintentar', edit: true };
  return null;
}

export default function ContentInspector({ busy, item, job, onAction, onChecklist, onEdit, onJobMutate, onManageAssets, template }) {
  if (!item) return <aside className="inspector detail-rail"><div className="quiet-empty"><WorkflowIcon name="plan" size={28}/><p>Selecciona una pieza para ver su brief, siguiente acción y auditoría.</p></div></aside>;
  const strategy = strategyFor(item.objective, item.pillar);
  const primary = nextAction(item, template, job);
  const completed = item.checklist.filter((entry) => entry.done).length;
  const jobLocked = Boolean(item.active_job_id) && ['queued', 'pending', 'running', 'review'].includes(job?.state);
  return (
    <aside className="inspector detail-rail">
      <div className="inspector-head"><span className="eyebrow">Pieza activa</span><h2>{item.title}</h2><p>{item.content_item_id}</p></div>
      <div className="content-strategy-tag"><span>{strategy.label}</span><small>{strategy.promise}</small></div>
      <dl className="content-meta"><div><dt>Plantilla</dt><dd>{template?.name || item.template_id} · v{item.template_version}</dd></div><div><dt>Tipo</dt><dd>{CONTENT_FORMAT_LABELS[item.content_format] || item.content_format}</dd></div><div><dt>Canales</dt><dd>{item.platforms.map((id) => PLATFORM_LABELS[id]).join(', ')}</dd></div><div><dt>Formato</dt><dd>{FORMAT_LABELS[item.format] || item.format}</dd></div><div><dt>Fecha prevista</dt><dd>{item.planned_for || 'Sin fecha'}</dd></div></dl>
      <section className="brief-summary"><div className="rail-label"><span>Brief</span><button className="text-button" disabled={jobLocked} onClick={() => onEdit(item)} type="button"><WorkflowIcon name="edit" size={14}/>{jobLocked ? 'En proceso' : 'Editar'}</button></div>{template?.fields.map((field) => item.brief[field.key] ? <div key={field.key}><b>{field.label}</b><p>{item.brief[field.key]}</p></div> : null)}</section>
      <section className="checklist-panel"><div className="rail-label"><span>Checklist</span><b>{completed}/{item.checklist.length}</b></div>{item.checklist.map((entry, index) => <label key={entry.label}><input checked={entry.done} onChange={() => onChecklist(item, index)} type="checkbox"/><span>{entry.label}</span></label>)}</section>
      {job && <JobReviewPanel busy={busy} job={job} onManageAssets={onManageAssets} onMutate={onJobMutate}/>}
      <div className="detail-actions">{primary && <button className="button-primary full" disabled={busy || jobLocked} onClick={() => primary.edit ? onEdit(item) : onAction(item, primary.action, primary.stage)} type="button"><WorkflowIcon name="check" size={18}/>{primary.label}</button>}{item.stage !== 'archived' && item.stage !== 'ready_to_schedule' && <button className="button-secondary full" disabled={busy || Boolean(item.active_job_id)} onClick={() => onAction(item, 'archive')} type="button">Ocultar en Archivo</button>}</div>
      <details className="audit-panel"><summary>Auditoría · {item.audit.length} eventos</summary><ol>{[...item.audit].reverse().map((event, index) => <li key={`${event.at}-${index}`}><span/><div><b>{event.action.replaceAll('_', ' ')}</b><small>{event.actor} · {new Date(event.at).toLocaleString('es')}</small></div></li>)}</ol></details>
    </aside>
  );
}
