const test = require('node:test');
const assert = require('node:assert/strict');
const { generateBrief, redactPrivateData } = require('../lib/brief-assistant');

const fields = [
  { key: 'central_message', label: 'Mensaje central' },
  { key: 'hook', label: 'Gancho' },
  { key: 'slide_structure', label: 'Estructura' },
  { key: 'visual_direction', label: 'Dirección visual' },
  { key: 'cta', label: 'CTA' },
];

test('a short source completes every requested template field', () => {
  const result = generateBrief({
    source_text: 'Mostrar cómo el entrenamiento y la plataforma ayudan a sostener el progreso del atleta.',
    source_reference: 'Nota atómica · lanzamiento', objective: 'educate', pillar: 'progress',
    audience: 'Atletas y familias', asset_ids: ['ast-12345678-abcd'], template: { fields },
  });
  assert.equal(Object.keys(result.brief).length, fields.length);
  assert.ok(Object.values(result.brief).every((value) => value.length > 10));
  assert.match(result.brief.visual_direction, /ast-12345678-abcd/u);
  assert.match(result.provenance.privacy, /sin PII/u);
});

test('direct private contact data is redacted before drafting', () => {
  const result = redactPrivateData('Escribe a atleta@example.com o +593 99 123 4567');
  assert.equal(result.includes('atleta@example.com'), false);
  assert.equal(result.includes('593'), false);
});
