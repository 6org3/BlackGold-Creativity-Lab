'use client';

import Image from 'next/image';
import { useState } from 'react';
import WorkflowIcon from './WorkflowIcon';

function artifact(job, filename) {
  return filename ? `/api/system-os/artifacts/${job.job_id}/${encodeURIComponent(filename)}` : '';
}

export default function JobReviewPanel({ busy, job, onMutate }) {
  const [revision, setRevision] = useState('');
  if (!job) return null;
  const preview = artifact(job, job.preview_file || job.variants?.[0]?.file);
  return (
    <section className="linked-render" aria-labelledby={`render-${job.job_id}`}>
      <header><span className="eyebrow">Render vinculado</span><h3 id={`render-${job.job_id}`}>{job.state === 'review' ? 'Revisión visual' : 'Trabajo local'}</h3><small>{job.job_id}</small></header>
      <div className="inspector-preview">{preview ? <Image alt={`Vista previa de ${job.title}`} fill sizes="310px" src={preview} unoptimized/> : <div className="empty-preview"><WorkflowIcon name="image" size={26}/><span>{job.state === 'failed' ? job.error || 'El render falló' : 'Atlas está preparando las variantes'}</span></div>}</div>
      {job.variants?.length > 0 && <div className="variant-list"><div className="rail-label"><span>Variantes</span><b>{job.selected_variant ? `${job.selected_variant} elegida` : 'Elige una'}</b></div><div>{job.variants.map((variant) => <button aria-label={`Elegir variante ${variant.key}`} className={job.selected_variant === variant.key ? 'is-selected' : ''} disabled={busy || job.state !== 'review'} key={variant.key} onClick={() => onMutate(job.job_id, { action: 'select_variant', variant: variant.key }, `Variante ${variant.key} seleccionada`)} type="button"><Image alt="" fill sizes="90px" src={artifact(job, variant.file)} unoptimized/><span>{variant.key}</span></button>)}</div></div>}
      {job.state === 'review' && <div className="review-actions"><button className="button-approval full" disabled={busy || (job.variants_requested > 1 && !job.selected_variant)} onClick={() => onMutate(job.job_id, { action: 'approve' }, 'Pieza aprobada; publicación aún pendiente')} type="button"><WorkflowIcon name="check" size={18}/>Aprobar pieza</button><label className="revision-field"><span>Pedir un cambio</span><textarea maxLength="500" onChange={(event) => setRevision(event.target.value)} placeholder="Mueve al jugador a la derecha…" rows="3" value={revision}/></label><button className="button-secondary full" disabled={busy || revision.trim().length < 3} onClick={() => { onMutate(job.job_id, { action: 'revise', instruction: revision }, 'Revisión enviada a Atlas'); setRevision(''); }} type="button">Crear revisión</button></div>}
      <dl className="job-meta"><div><dt>Estado</dt><dd>{job.state}</dd></div><div><dt>Workflow</dt><dd>{job.selected_workflow}</dd></div><div><dt>Entrega</dt><dd>{job.content_item_id ? 'Solo Lab' : 'Flujo anterior'}</dd></div></dl>
    </section>
  );
}
