'use client';

import { useEffect, useRef, useState } from 'react';
import WorkflowIcon from './WorkflowIcon';

export default function ConfirmDialog({ busy, confirmText, description, onCancel, onConfirm, open, title }) {
  const [value, setValue] = useState('');
  const inputRef = useRef(null);
  const dialogRef = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const previous = document.activeElement;
    const focusTimer = window.setTimeout(() => inputRef.current?.focus(), 0);
    const onKeyDown = (event) => {
      if (event.key === 'Escape' && !busy) { event.preventDefault(); onCancel(); return; }
      if (event.key !== 'Tab') return;
      const items = [...dialogRef.current.querySelectorAll('button:not(:disabled), input:not(:disabled)')];
      if (event.shiftKey && document.activeElement === items[0]) { event.preventDefault(); items.at(-1)?.focus(); }
      else if (!event.shiftKey && document.activeElement === items.at(-1)) { event.preventDefault(); items[0]?.focus(); }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => { window.clearTimeout(focusTimer); document.removeEventListener('keydown', onKeyDown); previous?.focus?.(); };
  }, [busy, onCancel, open]);
  if (!open) return null;
  return <div className="dialog-backdrop"><section aria-labelledby="confirm-title" aria-modal="true" className="create-dialog confirm-dialog" ref={dialogRef} role="alertdialog"><header><div><span className="eyebrow">Confirmación explícita</span><h2 id="confirm-title">{title}</h2></div><button aria-label="Cerrar" className="icon-button" disabled={busy} onClick={onCancel} type="button"><WorkflowIcon name="close"/></button></header><p>{description}</p><label className="field"><span>Escribe {confirmText} para confirmar</span><input ref={inputRef} onChange={(event) => setValue(event.target.value)} value={value}/></label><footer className="wizard-footer"><span/><div><button className="button-secondary" disabled={busy} onClick={onCancel} type="button">Cancelar</button><button className="button-danger" disabled={busy || value !== confirmText} onClick={onConfirm} type="button"><WorkflowIcon name="trash" size={17}/>Eliminar borrador</button></div></footer></section></div>;
}
