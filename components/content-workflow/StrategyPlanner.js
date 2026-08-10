'use client';

import { useMemo, useRef } from 'react';
import workflow from '../../lib/content-workflow';
import WorkflowIcon from './WorkflowIcon';

const { OBJECTIVES, PILLARS, sortTemplates, strategyFor } = workflow;

function StrategyMatrix({ objective, pillar, onChange }) {
  const cells = useRef([]);
  const move = (event, index) => {
    const row = Math.floor(index / OBJECTIVES.length);
    const column = index % OBJECTIVES.length;
    const next = {
      ArrowRight: row * 4 + ((column + 1) % 4),
      ArrowLeft: row * 4 + ((column + 3) % 4),
      ArrowDown: ((row + 1) % 4) * 4 + column,
      ArrowUp: ((row + 3) % 4) * 4 + column,
      Home: row * 4,
      End: row * 4 + 3,
    }[event.key];
    if (next === undefined) return;
    event.preventDefault();
    cells.current[next]?.focus();
  };

  return (
    <>
      <div aria-label="Matriz de objetivo y pilar" className="strategy-matrix matrix-desktop" role="grid">
        <span aria-hidden="true" className="matrix-corner">Pilar \ Objetivo</span>
        {OBJECTIVES.map((item) => <span className="matrix-column" key={item.id} role="columnheader">{item.label}</span>)}
        {PILLARS.map((pillarItem, row) => (
          <div className="matrix-row" key={pillarItem.id} role="row">
            <span className="matrix-row-label" role="rowheader"><b>{pillarItem.label}</b><small>{pillarItem.short}</small></span>
            {OBJECTIVES.map((objectiveItem, column) => {
              const selected = objective === objectiveItem.id && pillar === pillarItem.id;
              const index = row * 4 + column;
              return (
                <button
                  aria-label={`${objectiveItem.label} con ${pillarItem.label}`}
                  aria-selected={selected}
                  className={selected ? 'is-selected' : ''}
                  key={objectiveItem.id}
                  onClick={() => onChange(objectiveItem.id, pillarItem.id)}
                  onKeyDown={(event) => move(event, index)}
                  ref={(node) => { cells.current[index] = node; }}
                  role="gridcell"
                  tabIndex={selected || (!objective && index === 0) ? 0 : -1}
                  type="button"
                >
                  <span>{strategyFor(objectiveItem.id, pillarItem.id).promise}</span>
                </button>
              );
            })}
          </div>
        ))}
      </div>
      <div className="matrix-mobile">
        <fieldset><legend>Objetivo</legend>{OBJECTIVES.map((item) => <label key={item.id}><input checked={objective === item.id} name="matrix-objective" onChange={() => onChange(item.id, pillar)} type="radio"/><span><b>{item.label}</b><small>{item.short}</small></span></label>)}</fieldset>
        <fieldset><legend>Pilar</legend>{PILLARS.map((item) => <label key={item.id}><input checked={pillar === item.id} name="matrix-pillar" onChange={() => onChange(objective, item.id)} type="radio"/><span><b>{item.label}</b><small>{item.short}</small></span></label>)}</fieldset>
      </div>
    </>
  );
}

export default function StrategyPlanner({ items, templates, selection, onSelection, onStart }) {
  const strategy = strategyFor(selection.objective, selection.pillar);
  const recommended = useMemo(() => sortTemplates(templates, selection.objective, selection.pillar).slice(0, 4), [selection, templates]);
  const drafts = items.filter((item) => item.stage === 'draft').slice(0, 4);

  return (
    <div className="planner-layout">
      <section className="strategy-board" aria-labelledby="strategy-title">
        <header className="section-head"><div><span className="eyebrow">Dirección de contenido</span><h2 id="strategy-title">Objetivo × Pilar</h2></div><p>Elige una celda para definir la intención antes del formato.</p></header>
        <StrategyMatrix objective={selection.objective} onChange={(objective, pillar) => onSelection({ objective, pillar })} pillar={selection.pillar}/>
        <div className="strategy-readout" role="status">
          <div><span className="eyebrow">Combinación activa</span><h3>{strategy.label}</h3></div>
          <p><b>{strategy.promise}.</b> {strategy.angle}</p>
          <button className="button-primary" onClick={() => onStart(selection)} type="button"><WorkflowIcon name="plus" size={18}/>Crear con esta estrategia</button>
        </div>
      </section>

      <aside className="planner-side">
        <section><header><span className="eyebrow">Recomendadas</span><h2>Plantillas listas</h2></header><div className="recommendation-list">{recommended.map((template, index) => <button key={template.template_id} onClick={() => onStart({ ...selection, templateId: template.template_id })} type="button"><span>{String(index + 1).padStart(2, '0')}</span><span><b>{template.name}</b><small>{template.execution_mode === 'image_auto' ? 'Render local disponible' : 'Plan y checklist'}</small></span><WorkflowIcon name="chevron" size={16}/></button>)}</div></section>
        <section><header><span className="eyebrow">Continuar</span><h2>Borradores</h2></header>{drafts.length ? <div className="draft-list">{drafts.map((item) => <button key={item.content_item_id} onClick={() => onStart({ item })} type="button"><b>{item.title}</b><small>{strategyFor(item.objective, item.pillar).label}</small></button>)}</div> : <p className="quiet-empty">No hay borradores. Tu próximo brief puede empezar desde la matriz.</p>}</section>
      </aside>
    </div>
  );
}
