'use client';

import { useState } from 'react';
import workflow from '../../lib/content-workflow';
import WorkflowIcon from './WorkflowIcon';

const { FORMAT_LABELS, PLATFORM_LABELS, strategyFor } = workflow;

export default function ArchiveWorkspace({ busy, items, onRestore }) {
  const [selectedId, setSelectedId] = useState(null);
  const selected = items.find((item) => item.content_item_id === selectedId) || items[0];
  return <div className="archive-workspace"><section><header className="section-head"><div><span className="eyebrow">Historial recuperable</span><h2>Contenido archivado</h2></div><p>{items.length} piezas ocultas del flujo activo</p></header>{items.length ? <div className="archive-list">{items.map((item) => <button className={selected?.content_item_id === item.content_item_id ? 'is-selected' : ''} key={item.content_item_id} onClick={() => setSelectedId(item.content_item_id)} type="button"><WorkflowIcon name="archive" size={18}/><span><b>{item.title}</b><small>{strategyFor(item.objective,item.pillar).label} · {item.platforms.map((id) => PLATFORM_LABELS[id]).join(', ')}</small></span><span>{FORMAT_LABELS[item.format]}</span><WorkflowIcon name="chevron" size={16}/></button>)}</div> : <div className="empty-queue compact-empty"><WorkflowIcon name="archive" size={32}/><h3>El Archivo está vacío</h3><p>Ocultar una pieza la moverá aquí sin borrar su brief, renders ni auditoría.</p></div>}</section><aside className="template-detail">{selected ? <><span className="eyebrow">Pieza archivada</span><h2>{selected.title}</h2><p>{selected.brief.central_message || 'Brief conservado'}</p><dl className="content-meta"><div><dt>Etapa anterior</dt><dd>{selected.archived_from_stage}</dd></div><div><dt>Plantilla</dt><dd>{selected.template_snapshot?.name || selected.template_id} · v{selected.template_version}</dd></div><div><dt>Trabajos vinculados</dt><dd>{selected.job_ids.length}</dd></div><div><dt>Publicación</dt><dd>Bloqueada</dd></div></dl><button className="button-secondary full" disabled={busy} onClick={() => onRestore(selected)} type="button"><WorkflowIcon name="restore" size={17}/>Restaurar al flujo</button><details className="audit-panel"><summary>Auditoría · {selected.audit.length} eventos</summary><ol>{[...selected.audit].reverse().map((event,index) => <li key={`${event.at}-${index}`}><span/><div><b>{event.action.replaceAll('_',' ')}</b><small>{event.actor} · {new Date(event.at).toLocaleString('es')}</small></div></li>)}</ol></details></> : <p className="quiet-empty">Selecciona una pieza archivada.</p>}</aside></div>;
}
