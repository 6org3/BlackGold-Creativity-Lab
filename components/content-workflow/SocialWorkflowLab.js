'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import BrandMark from '../BrandMark';
import ArchiveWorkspace from './ArchiveWorkspace';
import AssetWorkspace from './AssetWorkspace';
import ConfirmDialog from './ConfirmDialog';
import ContentWizard from './ContentWizard';
import ProductionWorkspace from './ProductionWorkspace';
import StrategyPlanner from './StrategyPlanner';
import TemplateEditor from './TemplateEditor';
import TemplateWorkspace from './TemplateWorkspace';
import WorkflowIcon from './WorkflowIcon';

const VIEWS = {
  plan: { label: 'Planificar', eyebrow: 'Dirección editorial', title: 'Social Media Workflow', icon: 'plan' },
  production: { label: 'Producción', eyebrow: 'Cola canónica', title: 'Producción social', icon: 'queue' },
  assets: { label: 'Archivos', eyebrow: 'Biblioteca recuperable', title: 'Archivos del Lab', icon: 'files' },
  templates: { label: 'Plantillas', eyebrow: 'Playbooks Black Gold', title: 'Plantillas de contenido', icon: 'template' },
  archive: { label: 'Archivo', eyebrow: 'Historial recuperable', title: 'Archivo de contenido', icon: 'archive' },
};

async function api(url, options) {
  const response = await fetch(url, { cache: 'no-store', ...options, headers: options?.body ? { 'Content-Type': 'application/json', ...(options.headers || {}) } : options?.headers });
  const payload = await response.json().catch(() => ({ ok: false, error: 'Respuesta inválida' }));
  if (!response.ok || !payload.ok) throw new Error(payload.error || 'No se pudo completar la acción');
  return payload;
}

function currentView() {
  if (typeof window === 'undefined') return 'plan';
  const value = window.location.hash.replace('#', '');
  return VIEWS[value] ? value : value === 'lab' ? 'plan' : 'plan';
}

export default function SocialWorkflowLab() {
  const [view, setView] = useState('plan');
  const [items, setItems] = useState([]);
  const [archived, setArchived] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [health, setHealth] = useState({ dispatcher: false, drive: false });
  const [selection, setSelection] = useState({ objective: 'educate', pillar: 'technique' });
  const [wizardInitial, setWizardInitial] = useState(null);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [templateInitial, setTemplateInitial] = useState(null);
  const [templateOpen, setTemplateOpen] = useState(false);
  const [deleteTemplate, setDeleteTemplate] = useState(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const activeTemplates = useMemo(() => templates.filter((template) => template.status === 'active'), [templates]);

  const load = useCallback(async (includeCatalog = true) => {
    const requests = [
      fetch('/api/system-os/health', { cache: 'no-store' }).then((response) => response.json()),
      fetch('/api/system-os/jobs?limit=60', { cache: 'no-store' }).then((response) => response.json()),
      fetch('/api/system-os/content/items?view=active&limit=100', { cache: 'no-store' }).then((response) => response.json()),
      fetch('/api/system-os/content/items?view=archive&limit=100', { cache: 'no-store' }).then((response) => response.json()),
    ];
    if (includeCatalog) requests.push(fetch('/api/system-os/content/templates?status=all', { cache: 'no-store' }).then((response) => response.json()));
    const results = await Promise.allSettled(requests);
    const [healthResult, jobsResult, itemsResult, archiveResult, templateResult] = results;
    if (healthResult.status === 'fulfilled' && healthResult.value.ok) setHealth(healthResult.value);
    if (jobsResult.status === 'fulfilled' && jobsResult.value.ok) setJobs(jobsResult.value.jobs || []);
    if (itemsResult.status === 'fulfilled' && itemsResult.value.ok) setItems(itemsResult.value.items || []);
    if (archiveResult.status === 'fulfilled' && archiveResult.value.ok) setArchived(archiveResult.value.items || []);
    if (templateResult?.status === 'fulfilled' && templateResult.value.ok) setTemplates(templateResult.value.templates || []);
    const failed = results.find((result) => result.status === 'rejected' || (result.value && !result.value.ok));
    if (failed) setMessage('Una parte del workflow no respondió. Actualiza o revisa System OS.');
  }, []);

  useEffect(() => {
    const sync = () => setView(currentView());
    const initial = window.setTimeout(sync, 0);
    window.addEventListener('hashchange', sync);
    return () => { window.clearTimeout(initial); window.removeEventListener('hashchange', sync); };
  }, []);
  useEffect(() => {
    const initial = window.setTimeout(() => load(true), 0);
    const timer = window.setInterval(() => load(false), 8000);
    return () => { window.clearTimeout(initial); window.clearInterval(timer); };
  }, [load]);

  const navigate = (next) => { window.history.pushState({}, '', `#${next}`); setView(next); };
  const closeWizard = useCallback(() => setWizardOpen(false), []);
  const closeTemplate = useCallback(() => setTemplateOpen(false), []);
  const cancelDelete = useCallback(() => setDeleteTemplate(null), []);
  const openWizard = useCallback((initial) => {
    const next = initial || selection;
    if (!next?.item && !activeTemplates.length) {
      setMessage('El catálogo de plantillas todavía está cargando. Intenta de nuevo en unos segundos.');
      return;
    }
    setWizardInitial(next);
    setWizardOpen(true);
  }, [activeTemplates.length, selection]);
  const openTemplate = useCallback((initial = null) => { setTemplateInitial(initial); setTemplateOpen(true); }, []);
  const run = async (operation, success, { catalog = false } = {}) => {
    setBusy(true); setMessage('');
    try { await operation(); setMessage(success); await load(catalog); }
    catch (error) { setMessage(error.message); }
    finally { setBusy(false); }
  };

  const saveWizard = ({ item, mode, payload }) => run(async () => {
    if (item) {
      const editable = { title: payload.title, audience: payload.audience, platforms: payload.platforms, format: payload.format, brief: payload.brief, planned_for: payload.planned_for, checklist: item.checklist, expected_revision: item.revision };
      await api(`/api/system-os/content/items/${item.content_item_id}`, { method: 'PATCH', body: JSON.stringify(editable) });
    } else {
      const created = await api('/api/system-os/content/items', { method: 'POST', body: JSON.stringify(payload) });
      if (mode === 'render') await api(`/api/system-os/content/items/${created.item.content_item_id}/actions`, { method: 'POST', body: JSON.stringify({ action: 'send_to_production', expected_revision: created.item.revision }) });
    }
    setWizardOpen(false);
    if (mode !== 'draft') navigate('production');
  }, item ? 'Brief actualizado' : mode === 'render' ? 'Pieza enviada a producción local · sin mensajes' : mode === 'draft' ? 'Borrador guardado' : 'Plan creado', { catalog: !item });

  const itemAction = (item, action, stage) => run(
    () => api(`/api/system-os/content/items/${item.content_item_id}/actions`, { method: 'POST', body: JSON.stringify({ action, stage, expected_revision: item.revision }) }),
    action === 'archive' ? 'Pieza movida al Archivo' : action === 'send_to_production' ? 'Producción local iniciada · entrega desactivada' : action === 'mark_ready_to_schedule' ? 'Pieza lista para programar manualmente' : 'Etapa actualizada',
  );
  const checklist = (item, index) => {
    const next = item.checklist.map((entry, position) => position === index ? { ...entry, done: !entry.done } : entry);
    return run(() => api(`/api/system-os/content/items/${item.content_item_id}`, { method: 'PATCH', body: JSON.stringify({ checklist: next, expected_revision: item.revision }) }), 'Checklist actualizado');
  };
  const jobMutate = (jobId, body, success) => run(() => api(`/api/system-os/jobs/${jobId}/actions`, { method: 'POST', body: JSON.stringify(body) }), success);
  const relaunchJob = async (source, form) => {
    setBusy(true); setMessage('');
    try {
      const created = await api('/api/system-os/jobs', {
        method: 'POST',
        body: JSON.stringify({
          job_type: 'generate_image', content_id: `bg-${Date.now()}`, approved_by: 'jorge',
          title: form.title.trim(), subtitle: form.subtitle.trim(), prompt: form.prompt.trim(),
          format: form.format, variants: Number(form.variants), workflow: form.workflow,
          subject_anchor: form.subjectAnchor, content_type: source.content_type || 'social-image',
          intent: form.intent.trim() || form.title.trim(), parent_job_id: source.job_id,
          revision_instruction: `Nueva versión editada desde Creativity Lab a partir de ${source.job_id}`,
        }),
      });
      setMessage(`Nueva versión ${created.job_id} enviada a Atlas · el original se conserva`);
      await load(false);
      return created;
    } catch (error) {
      setMessage(error.message);
      throw error;
    } finally { setBusy(false); }
  };
  const saveTemplate = (payload) => run(async () => {
    const url = templateInitial ? `/api/system-os/content/templates/${templateInitial.template_id}` : '/api/system-os/content/templates';
    await api(url, { method: templateInitial ? 'PATCH' : 'POST', body: JSON.stringify(payload) });
    setTemplateOpen(false);
  }, templateInitial?.status === 'active' ? 'Nueva versión de plantilla creada' : 'Plantilla guardada como borrador', { catalog: true });
  const templateAction = (template, action) => {
    if (action === 'confirm_delete') return setDeleteTemplate(template);
    return run(() => api(`/api/system-os/content/templates/${template.template_id}/actions`, { method: 'POST', body: JSON.stringify({ action, expected_revision: template.revision }) }), action === 'publish' ? 'Plantilla activada' : action === 'retire' ? 'Plantilla retirada' : 'Plantilla restaurada', { catalog: true });
  };
  const confirmDelete = () => run(async () => {
    await api(`/api/system-os/content/templates/${deleteTemplate.template_id}/actions`, { method: 'POST', body: JSON.stringify({ action: 'delete', confirm: deleteTemplate.template_id, expected_revision: deleteTemplate.revision }) });
    setDeleteTemplate(null);
  }, 'Borrador eliminado; el recibo quedó auditado', { catalog: true });
  const restoreItem = (item) => run(() => api(`/api/system-os/content/items/${item.content_item_id}/actions`, { method: 'POST', body: JSON.stringify({ action: 'restore', expected_revision: item.revision }) }), 'Pieza restaurada al flujo');

  const productionCount = items.filter((item) => !['draft', 'ready_to_schedule'].includes(item.stage)).length + jobs.filter((job) => !job.content_item_id).length;
  const meta = VIEWS[view];
  return (
    <main className="lab-shell workflow-shell">
      <aside className="sidebar"><div className="brand-lockup"><div className="brand-mark"><BrandMark/></div><span><b>BLACK GOLD</b><small>Creativity Lab</small></span></div><nav aria-label="Navegación principal">{Object.entries(VIEWS).map(([id, entry]) => <button aria-current={view === id ? 'page' : undefined} className={`nav-item ${view === id ? 'is-active' : ''}`} key={id} onClick={() => navigate(id)} type="button"><WorkflowIcon name={entry.icon}/><span>{entry.label}</span>{id === 'production' && productionCount > 0 ? <em>{productionCount}</em> : id === 'archive' && archived.length > 0 ? <em>{archived.length}</em> : null}</button>)}</nav><div className="sidebar-foot"><span>Modo seguro</span><b>System OS · Local</b><small>Publicación manual</small><form action="/api/auth/logout" method="post"><button aria-label="Cerrar sesión" className="logout-button" type="submit"><WorkflowIcon name="logout" size={18}/><span>Cerrar sesión</span></button></form></div></aside>
      <section className="workspace"><header className="topbar"><div><span className="eyebrow">{meta.eyebrow}</span><h1>{meta.title}</h1></div><div className="top-actions"><button aria-label="Actualizar workflow" className="icon-button" onClick={() => load(true)} type="button"><WorkflowIcon name="refresh"/></button>{['plan', 'production', 'templates'].includes(view) && <button aria-label={view === 'templates' ? 'Nueva plantilla' : 'Nueva pieza'} className="button-primary" disabled={view !== 'templates' && !activeTemplates.length} onClick={() => view === 'templates' ? openTemplate() : openWizard()} type="button"><WorkflowIcon name="plus" size={18}/><span>{view === 'templates' ? 'Nueva plantilla' : 'Nueva pieza'}</span></button>}</div></header>
        <div className="safety-strip"><WorkflowIcon name="check" size={17}/><span>Planifica, produce y audita. <b>No publica, no envía mensajes y no abre inscripciones.</b></span></div>
        {message && <div className="notice" role="status"><span>{message}</span><button aria-label="Ocultar mensaje" onClick={() => setMessage('')} type="button"><WorkflowIcon name="close" size={16}/></button></div>}
        <div className="workflow-view">{view === 'plan' && <StrategyPlanner items={items} onSelection={setSelection} onStart={openWizard} selection={selection} templates={activeTemplates}/>} {view === 'production' && <ProductionWorkspace busy={busy} health={health} items={items} jobs={jobs} onAction={itemAction} onChecklist={checklist} onEdit={(item) => openWizard({ item })} onJobMutate={jobMutate} onManageAssets={() => navigate('assets')} onRelaunch={relaunchJob} templates={templates}/>} {view === 'assets' && <AssetWorkspace items={items} jobs={jobs} onMessage={setMessage}/>} {view === 'templates' && <TemplateWorkspace busy={busy} onAction={templateAction} onEdit={openTemplate} templates={templates}/>} {view === 'archive' && <ArchiveWorkspace busy={busy} items={archived} onRestore={restoreItem}/>}</div>
      </section>
      {wizardOpen && <ContentWizard busy={busy} initial={wizardInitial} onClose={closeWizard} onSave={saveWizard} open templates={templates}/>}
      {templateOpen && <TemplateEditor busy={busy} initial={templateInitial} onClose={closeTemplate} onSave={saveTemplate} open/>}
      {deleteTemplate && <ConfirmDialog busy={busy} confirmText={deleteTemplate.template_id} description="Solo se eliminará este borrador nunca usado. Las plantillas publicadas y piezas creadas no se tocan." key={deleteTemplate.template_id} onCancel={cancelDelete} onConfirm={confirmDelete} open title="Eliminar borrador de plantilla"/>}
    </main>
  );
}
