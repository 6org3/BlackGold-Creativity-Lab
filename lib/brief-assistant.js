const fs = require('node:fs/promises');
const path = require('node:path');
const workflow = require('./content-workflow');
const fallbackContext = require('./creative-context-default.json');

const MAX_SOURCE_LENGTH = 8000;
const FIELD_KEY = /^[a-z][a-z0-9_]{1,63}$/;

function clean(value, limit = MAX_SOURCE_LENGTH) {
  return String(value || '').replace(/\s+/gu, ' ').trim().slice(0, limit);
}

function redactPrivateData(value) {
  return clean(value)
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/giu, '[dato privado]')
    .replace(/(?:\+?\d[\s().-]*){7,}/gu, '[dato privado]');
}

function sentences(value) {
  return redactPrivateData(value).split(/(?<=[.!?])\s+|\n+/u).map((entry) => entry.trim()).filter(Boolean).slice(0, 8);
}

function shortTitle(value, fallback) {
  const firstLine = redactPrivateData(value).split(/[.!?\n]/u)[0].replace(/^[-–—\d.\s]+/u, '').trim();
  const title = firstLine || fallback;
  return title.length > 88 ? `${title.slice(0, 85).trim()}…` : title;
}

function carouselStructure(parts, context) {
  const material = [...parts, ...context.approved_facts].slice(0, 4);
  return [
    `1. PORTADA — ${shortTitle(parts[0], context.campaign.slogan)}`,
    ...material.map((entry, index) => `${index + 2}. ${entry}`),
    `${material.length + 2}. CIERRE — ${context.campaign.core_message}`,
  ].join('\n');
}

function script(parts, hook, cta, context) {
  const body = parts.slice(0, 3).map((entry, index) => `ESCENA ${index + 2} · Voz: ${entry}`).join('\n');
  return `ESCENA 1 · Gancho en pantalla: ${hook}\n${body}\nESCENA FINAL · ${context.campaign.slogan}\nCTA · ${cta}`;
}

function fieldValue(field, draft) {
  const key = field.key;
  const values = {
    central_message: draft.central,
    key_message: draft.central,
    message: draft.central,
    hook: draft.hook,
    headline: draft.title,
    cover: `${draft.title}\n${draft.context.campaign.slogan}`,
    caption: `${draft.hook}\n\n${draft.central}\n\n${draft.context.campaign.core_message}\n\n${draft.cta}`,
    copy: `${draft.hook}\n\n${draft.central}\n\n${draft.cta}`,
    cta: draft.cta,
    visual_direction: `${draft.strategy.visual} Estética Black Gold sobria y premium. ${draft.assetLine}`,
    assets: draft.assetLine,
    references: draft.assetLine,
    slide_structure: draft.carousel,
    slides: draft.carousel,
    carousel_structure: draft.carousel,
    script: draft.script,
    voiceover: draft.script,
    shot_list: `1. Plano de apertura del entorno Black Gold.\n2. Acción técnica o gesto observable.\n3. Detalle de seguimiento en la plataforma.\n4. Cierre con ${draft.context.campaign.slogan}.\n${draft.assetLine}`,
    outline: `1. Problema: ${draft.hook}\n2. Método: ${draft.central}\n3. Sistema: ${draft.context.campaign.system_role}\n4. Evidencia y siguiente paso humano.\n5. Cierre: ${draft.cta}`,
    thumbnail_concept: `Atleta en acción con contraste oscuro y dorado; texto corto: “${draft.title}”. Sin datos personales visibles.`,
    derivatives: `Reel de 30 s con el gancho; carrusel de 5 láminas; post estático con “${draft.context.campaign.slogan}”; historia con CTA humano.`,
    on_screen_text: `${draft.hook}\n${draft.context.campaign.slogan}`,
    description: `${draft.central} ${draft.cta}`,
  };
  return values[key] || `${field.label || key}: ${draft.central}\nEnfoque: ${draft.strategy.angle}\n${draft.assetLine}`;
}

function generateBrief(input, context = fallbackContext) {
  const source = redactPrivateData(input.source_text);
  if (source.length < 12) throw new Error('Escribe una idea, guion o nota de al menos 12 caracteres.');
  const fields = Array.isArray(input.template?.fields) ? input.template.fields.slice(0, 16) : [];
  if (!fields.length || fields.some((field) => !FIELD_KEY.test(field.key))) throw new Error('La plantilla no contiene campos válidos.');
  const strategy = workflow.strategyFor(input.objective, input.pillar);
  const parts = sentences(source);
  const title = shortTitle(source, context.campaign.slogan);
  const central = parts.slice(0, 3).join(' ') || context.campaign.core_message;
  const hook = parts[0] || strategy.hook;
  const assetIds = Array.isArray(input.asset_ids) ? input.asset_ids.filter((id) => /^ast-[A-Za-z0-9-]{8,80}$/u.test(id)).slice(0, 8) : [];
  const assetLine = assetIds.length
    ? `Referencias internas seleccionadas: ${assetIds.join(', ')}. Supervisar permisos y elección antes de renderizar.`
    : strategy.assets;
  const draft = {
    assetLine, central, context, hook, strategy, title,
    cta: strategy.cta,
  };
  draft.carousel = carouselStructure(parts, context);
  draft.script = script(parts, hook, draft.cta, context);
  return {
    title,
    audience: clean(input.audience, 160) || 'Atletas y familias Black Gold',
    brief: Object.fromEntries(fields.map((field) => [field.key, fieldValue(field, draft)])),
    provenance: {
      context_updated_at: context.updated_at,
      source_reference: clean(input.source_reference, 180) || 'Entrada directa',
      sources: context.sources,
      privacy: 'Contexto agregado y saneado; sin PII del CRM.',
    },
  };
}

async function loadCreativeContext() {
  const configured = process.env.CREATIVITY_CONTEXT_PATH;
  if (!configured) return { context: fallbackContext, mode: 'embedded_safe_fallback' };
  try {
    const parsed = JSON.parse(await fs.readFile(path.resolve(configured), 'utf8'));
    if (!parsed?.campaign?.core_message || !parsed.campaign.slogan || !Array.isArray(parsed.sources) || !Array.isArray(parsed.guardrails) || !Array.isArray(parsed.approved_facts)) throw new Error('invalid_context');
    return { context: parsed, mode: 'server_snapshot' };
  } catch {
    return { context: fallbackContext, mode: 'embedded_safe_fallback' };
  }
}

module.exports = { generateBrief, loadCreativeContext, redactPrivateData };
