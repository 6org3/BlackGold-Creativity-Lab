'use client';

import Image from 'next/image';
import { useCallback, useMemo, useState } from 'react';
import workflow from '../../lib/content-workflow';
import ProductionDetailDialog from './ProductionDetailDialog';
import WorkflowIcon from './WorkflowIcon';

const { STAGES, strategyFor } = workflow;
const STAGE_LABELS = Object.fromEntries(STAGES.map((stage) => [stage.id, stage.label]));

function jobStage(job) {
  if (['queued', 'pending', 'running', 'failed', 'superseded'].includes(job.state)) return 'production';
  if (job.state === 'review') return 'review';
  if (job.state === 'approved') return 'approved';
  return 'production';
}

function artifact(job) {
  const filename = job?.preview_file || job?.variants?.[0]?.file;
  return filename ? `/api/system-os/artifacts/${job.job_id}/${encodeURIComponent(filename)}` : '';
}

function ProductionCard({ active, job, item, onSelect, template }) {
  const preview = artifact(job);
  const title = item?.title || job?.title;
  const stage = item?.stage || jobStage(job);
  const strategy = item ? strategyFor(item.objective, item.pillar).label : 'Sin clasificar';
  const progress = item?.checklist?.length ? `${item.checklist.filter((entry) => entry.done).length}/${item.checklist.length} controles` : job?.state;
  return (
    <button className={`content-card ${active ? 'is-active' : ''}`} onClick={onSelect} type="button">
      <div className="content-card-visual">{preview ? <Image alt={`Vista previa de ${title}`} fill sizes="(max-width: 560px) 38vw, 220px" src={preview} unoptimized/> : <div><WorkflowIcon name={template?.execution_mode === 'plan_only' ? 'plan' : 'image'} size={28}/><span>{template?.execution_mode === 'plan_only' ? 'Plan de contenido' : 'Sin render todavía'}</span></div>}<span className="content-stage">{STAGE_LABELS[stage] || stage}</span></div>
      <div className="content-card-copy"><span>{strategy}</span><h3>{title}</h3><p>{template?.name || job?.selected_workflow || 'Trabajo anterior'}</p><footer><span>{progress}</span><WorkflowIcon name="chevron" size={16}/></footer></div>
    </button>
  );
}

export default function ProductionWorkspace({ busy, health, items, jobs, onAction, onChecklist, onEdit, onJobMutate, onManageAssets, onRelaunch, templates }) {
  const [stage, setStage] = useState('all');
  const [selectedId, setSelectedId] = useState(null);
  const closeDetail = useCallback(() => setSelectedId(null), []);
  const records = useMemo(() => {
    const linked = new Set(items.flatMap((item) => item.job_ids || []));
    return [
      ...items.filter((item) => item.stage !== 'draft').map((item) => {
        const job = jobs.find((candidate) => candidate.job_id === item.active_job_id)
          || [...(item.job_ids || [])].reverse().map((id) => jobs.find((candidate) => candidate.job_id === id)).find(Boolean);
        return { id: item.content_item_id, stage: item.stage, item, job, template: item.template_snapshot || templates.find((candidate) => candidate.template_id === item.template_id && candidate.version === item.template_version) || templates.find((candidate) => candidate.template_id === item.template_id) };
      }),
      ...jobs.filter((job) => !job.content_item_id && !linked.has(job.job_id)).map((job) => ({ id: job.job_id, stage: jobStage(job), job })),
    ];
  }, [items, jobs, templates]);
  const visible = stage === 'all' ? records : records.filter((record) => record.stage === stage);
  const groups = (stage === 'all' ? STAGES.filter((entry) => entry.id !== 'draft') : STAGES.filter((entry) => entry.id === stage))
    .map((entry) => ({ ...entry, records: records.filter((record) => record.stage === entry.id) }))
    .filter((entry) => entry.records.length);
  const active = records.find((record) => record.id === selectedId) || null;
  return (
    <>
      <div className="service-row workflow-service-row"><div className="service-pulse"><span className={`status-dot ${health.dispatcher ? 'is-active' : ''}`}/><span><b>System OS</b><small>{health.dispatcher ? 'Cola disponible' : 'Sin respuesta'}</small></span></div><div className="service-pulse"><span className={`status-dot ${jobs.some((job) => ['running', 'queued', 'pending'].includes(job.state)) ? 'is-active' : ''}`}/><span><b>Atlas + GPU</b><small>{jobs.filter((job) => ['running', 'queued', 'pending'].includes(job.state)).length || 'En espera'}</small></span></div><div className="service-pulse"><span className={`status-dot ${health.drive ? 'is-active' : 'is-warning'}`}/><span><b>Google Drive</b><small>{health.drive ? 'Archivo conectado' : 'Falta autorizar'}</small></span></div><span className="provider-note">Publicación: <b>siempre manual</b></span></div>
      <div className="stage-tabs" aria-label="Filtrar por etapa" role="group"><button aria-pressed={stage === 'all'} className={stage === 'all' ? 'is-active' : ''} onClick={() => setStage('all')} type="button">Todos <span>{records.length}</span></button>{STAGES.filter((entry) => entry.id !== 'draft').map((entry) => <button aria-pressed={stage === entry.id} className={stage === entry.id ? 'is-active' : ''} key={entry.id} onClick={() => setStage(entry.id)} type="button">{entry.label}<span>{records.filter((record) => record.stage === entry.id).length}</span></button>)}</div>
      <div className="production-workspace"><section className="queue-panel"><header className="section-head"><div><span className="eyebrow">Cola canónica</span><h2>Producción social</h2></div><p><b>{items.filter((item) => item.stage !== 'draft').length}</b> planes · <b>{jobs.length}</b> trabajos</p></header>{visible.length ? <div className="queue-stage-groups">{groups.map((group) => <section className="queue-stage-group" key={group.id}><header><h3>{group.label}</h3><span>{group.records.length}</span></header><div className="content-card-list">{group.records.map((record) => <ProductionCard active={active?.id === record.id} item={record.item} job={record.job} key={record.id} onSelect={() => setSelectedId(record.id)} template={record.template}/>)}</div></section>)}</div> : <div className="empty-queue compact-empty"><WorkflowIcon name="queue" size={32}/><h3>Sin piezas en esta etapa</h3><p>Cambia el filtro o crea un plan desde la matriz.</p></div>}</section></div>
      <ProductionDetailDialog busy={busy} onAction={onAction} onChecklist={onChecklist} onClose={closeDetail} onEdit={onEdit} onJobMutate={onJobMutate} onManageAssets={onManageAssets} onRelaunch={onRelaunch} record={active}/>
    </>
  );
}
