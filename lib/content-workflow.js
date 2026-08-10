const OBJECTIVES = [
  { id: 'educate', label: 'Educar', short: 'Enseñar algo aplicable', hook: 'Abre con el error o la mejora concreta.', cta: 'Guarda esta guía para tu próxima sesión.' },
  { id: 'authority', label: 'Autoridad', short: 'Demostrar criterio y método', hook: 'Abre con una postura clara respaldada por experiencia.', cta: 'Síguenos para entrenar con método.' },
  { id: 'community', label: 'Comunidad', short: 'Crear identificación y conversación', hook: 'Abre con una situación que el equipo reconoce.', cta: 'Cuéntanos cómo lo vive tu equipo.' },
  { id: 'conversion', label: 'Conversión', short: 'Mover a una acción concreta', hook: 'Abre con el resultado y la condición para conseguirlo.', cta: 'Escríbenos para conocer el siguiente paso.' },
];

const PILLARS = [
  { id: 'technique', label: 'Técnica', short: 'Entrenamiento y corrección', angle: 'Convierte el método en una demostración clara.', visual: 'Entrenamiento real, gesto técnico visible y espacio limpio para explicar.' },
  { id: 'mindset', label: 'Mentalidad', short: 'Disciplina, foco y presión', angle: 'Conecta una decisión mental con una conducta observable.', visual: 'Atmósfera sobria, protagonista humano y tensión contenida.' },
  { id: 'progress', label: 'Progreso', short: 'Evidencia, rangos y transformación', angle: 'Muestra el cambio con una referencia verificable.', visual: 'Evidencia de avance, contraste antes/después o marcador de logro.' },
  { id: 'process', label: 'Proceso', short: 'Cultura y detrás de escena', angle: 'Haz visible el trabajo que normalmente queda fuera de cámara.', visual: 'Momento documental, entorno del club y detalles auténticos de trabajo.' },
];

const STAGES = [
  { id: 'draft', label: 'Borradores' },
  { id: 'brief', label: 'Brief' },
  { id: 'production', label: 'Producción' },
  { id: 'review', label: 'Revisión' },
  { id: 'approved', label: 'Aprobado' },
  { id: 'ready_to_schedule', label: 'Listo para programar' },
];

const PLATFORM_LABELS = {
  instagram: 'Instagram', facebook: 'Facebook', tiktok: 'TikTok', youtube: 'YouTube',
};

const FORMAT_LABELS = {
  portrait: 'Retrato · 4:5', story: 'Vertical · 9:16', square: 'Cuadrado · 1:1', landscape: 'Horizontal · 16:9',
};

const CONTENT_FORMAT_LABELS = {
  static: 'Post / Story estático', carousel: 'Carrusel', short_video: 'Reel / Short / TikTok', long_video: 'Video largo',
};

function byId(collection, id) {
  return collection.find((item) => item.id === id);
}

function strategyFor(objectiveId, pillarId) {
  const objective = byId(OBJECTIVES, objectiveId) || OBJECTIVES[0];
  const pillar = byId(PILLARS, pillarId) || PILLARS[0];
  return {
    label: `${objective.label} × ${pillar.label}`,
    promise: objective.short,
    angle: pillar.angle,
    hook: objective.hook,
    cta: objective.cta,
    visual: pillar.visual,
    assets: pillarId === 'process' ? 'Material propio del club y permisos confirmados.' : 'Material propio o recurso con licencia registrada.',
  };
}

function seedBrief(template, objectiveId, pillarId) {
  const strategy = strategyFor(objectiveId, pillarId);
  return Object.fromEntries((template?.fields || []).map((field) => {
    const defaults = {
      cta: strategy.cta,
      visual_direction: strategy.visual,
      assets: strategy.assets,
    };
    return [field.key, defaults[field.key] || ''];
  }));
}

function groupItemsByStage(items) {
  return STAGES.map((stage) => ({
    ...stage,
    items: items.filter((item) => item.stage === stage.id),
  }));
}

function templateScore(template, objective = '', pillar = '', platform = '') {
  const recommendation = template.recommendation || {};
  let score = template.recommendation_score || 0;
  if (objective && (recommendation.objectives || []).includes(objective)) {
    score += (recommendation.objective_weights || {})[objective] || 3;
  }
  if (pillar && (recommendation.pillars || []).includes(pillar)) {
    score += (recommendation.pillar_weights || {})[pillar] || 3;
  }
  if (platform && (template.platforms || []).includes(platform)) score += 2;
  if (template.execution_mode === 'image_auto') score += 1;
  return score;
}

function sortTemplates(templates, objective = '', pillar = '', platform = '') {
  return [...templates].sort((a, b) => (
    templateScore(b, objective, pillar, platform) - templateScore(a, objective, pillar, platform)
    || a.name.localeCompare(b.name, 'es')
  ));
}

module.exports = {
  CONTENT_FORMAT_LABELS,
  FORMAT_LABELS,
  OBJECTIVES,
  PILLARS,
  PLATFORM_LABELS,
  STAGES,
  groupItemsByStage,
  seedBrief,
  sortTemplates,
  strategyFor,
  templateScore,
};
