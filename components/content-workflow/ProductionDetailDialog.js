'use client';

import { useEffect, useRef } from 'react';
import ContentInspector from './ContentInspector';
import LegacyJobEditor from './LegacyJobEditor';
import WorkflowIcon from './WorkflowIcon';

export default function ProductionDetailDialog({ busy, onAction, onChecklist, onClose, onEdit, onJobMutate, onManageAssets, onRelaunch, record }) {
  const dialogRef = useRef(null);
  const headingRef = useRef(null);
  const recordId = record?.id;

  useEffect(() => {
    if (!recordId) return undefined;
    const previous = document.activeElement;
    const dialog = dialogRef.current;
    headingRef.current?.focus();
    const onKeyDown = (event) => {
      if (event.key === 'Escape' && !busy) { event.preventDefault(); onClose(); }
      if (event.key !== 'Tab') return;
      const focusable = [...dialog.querySelectorAll('button:not(:disabled), input:not(:disabled), textarea:not(:disabled), select:not(:disabled), summary')];
      const first = focusable[0]; const last = focusable.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => { document.removeEventListener('keydown', onKeyDown); previous?.focus?.(); };
  }, [busy, onClose, recordId]);

  if (!record) return null;
  const title = record.item?.title || record.job?.title || 'Detalle de producción';
  const editItem = (item) => { onClose(); onEdit(item); };
  const relaunch = async (source, form) => { const created = await onRelaunch(source, form); onClose(); return created; };
  const manageAssets = () => { onClose(); onManageAssets(); };
  return (
    <div className="dialog-backdrop" onMouseDown={(event) => event.target === event.currentTarget && !busy && onClose()}>
      <section aria-labelledby="production-detail-title" aria-modal="true" className="create-dialog production-detail-dialog" ref={dialogRef} role="dialog">
        <header className="production-detail-head"><div><span className="eyebrow">Producción social · detalle</span><h2 id="production-detail-title" ref={headingRef} tabIndex="-1">{title}</h2></div><button aria-label="Cerrar detalle" className="icon-button" disabled={busy} onClick={onClose} type="button"><WorkflowIcon name="close"/></button></header>
        <div className="production-detail-body">
          {record.item ? <ContentInspector busy={busy} item={record.item} job={record.job} onAction={onAction} onChecklist={onChecklist} onEdit={editItem} onJobMutate={onJobMutate} onManageAssets={manageAssets} template={record.template}/> : <LegacyJobEditor busy={busy} job={record.job} onManageAssets={manageAssets} onMutate={onJobMutate} onRelaunch={relaunch}/>}
        </div>
      </section>
    </div>
  );
}
