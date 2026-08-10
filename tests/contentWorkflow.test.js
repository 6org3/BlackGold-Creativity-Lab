const test = require('node:test');
const assert = require('node:assert/strict');

const {
  CONTENT_FORMAT_LABELS,
  OBJECTIVES,
  PILLARS,
  groupItemsByStage,
  seedBrief,
  sortTemplates,
  strategyFor,
} = require('../lib/content-workflow');

test('the catalog exposes the four canonical content formats', () => {
  assert.deepEqual(Object.keys(CONTENT_FORMAT_LABELS), ['static', 'carousel', 'short_video', 'long_video']);
});

test('the 4x4 strategy matrix always supplies a usable recipe', () => {
  for (const objective of OBJECTIVES) {
    for (const pillar of PILLARS) {
      const strategy = strategyFor(objective.id, pillar.id);
      assert.ok(strategy.label);
      assert.ok(strategy.hook.length > 10);
      assert.ok(strategy.cta.length > 10);
      assert.ok(strategy.visual.length > 10);
      assert.ok(strategy.assets.length > 10);
    }
  }
});

test('brief seeds only safe strategic defaults and leaves authored copy empty', () => {
  const template = { fields: [
    { key: 'central_message' }, { key: 'hook' }, { key: 'visual_direction' }, { key: 'cta' },
  ] };
  const brief = seedBrief(template, 'educate', 'technique');
  assert.equal(brief.central_message, '');
  assert.equal(brief.hook, '');
  assert.match(brief.visual_direction, /Entrenamiento real/);
  assert.match(brief.cta, /Guarda/);
});

test('production grouping preserves every canonical stage', () => {
  const groups = groupItemsByStage([
    { content_item_id: 'a', stage: 'brief' },
    { content_item_id: 'b', stage: 'ready_to_schedule' },
  ]);
  assert.equal(groups.length, 6);
  assert.equal(groups.find((group) => group.id === 'brief').items.length, 1);
  assert.equal(groups.find((group) => group.id === 'ready_to_schedule').items.length, 1);
});

test('template recommendations are stable and highest score first', () => {
  const sorted = sortTemplates([
    { template_id: 'b', name: 'B', recommendation_score: 2 },
    { template_id: 'a', name: 'A', recommendation_score: 9 },
  ]);
  assert.equal(sorted[0].template_id, 'a');
});
