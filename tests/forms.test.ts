import test from 'node:test';
import assert from 'node:assert/strict';
import {
  blankForm,
  csvCell,
  definitionSchema,
  makeField,
  validateAnswers,
  visibleFields,
} from '../src/lib/forms';
import { templates } from '../src/lib/templates';
test('all shipped templates are publishable', () => {
  for (const template of templates)
    assert.equal(definitionSchema.safeParse(template.build()).success, true, template.id);
});
test('conditional chains hide stale answers and skip hidden required questions', () => {
  const first = { ...makeField('choice'), options: ['Yes', 'No'] };
  const second = { ...makeField('text'), condition: { field: first.id, equals: 'Yes' } };
  const third = { ...makeField('text'), condition: { field: second.id, equals: 'Secret' } };
  const def = { ...blankForm(), fields: [first, second, third] };
  const stale = { [first.id]: 'No', [second.id]: 'Secret', [third.id]: 'Must be dropped' };
  assert.deepEqual(
    visibleFields(def, stale).map((f) => f.id),
    [first.id],
  );
  assert.deepEqual(validateAnswers(def, stale), { answers: { [first.id]: 'No' }, errors: {} });
});
test('required visible fields, valid choices, finite numbers, dates, and files are enforced', () => {
  const fields = [
    makeField('email'),
    makeField('number'),
    makeField('multi'),
    makeField('date'),
    makeField('file'),
  ];
  const def = { ...blankForm(), fields };
  const bad = {
    [fields[0].id]: 'bad',
    [fields[1].id]: Infinity,
    [fields[2].id]: ['unknown'],
    [fields[3].id]: '2026-02-31',
    [fields[4].id]: { token: 'bad', name: 'x', size: 1, type: 'text/plain' },
  };
  assert.equal(Object.keys(validateAnswers(def, bad).errors).length, 5);
  assert.equal(Object.keys(validateAnswers(def, {}).errors).length, 5);
  const good = {
    [fields[0].id]: 'student@example.org',
    [fields[1].id]: 2,
    [fields[2].id]: ['Option 1'],
    [fields[3].id]: '2026-11-01',
    [fields[4].id]: { token: crypto.randomUUID(), name: 'brief.txt', size: 20, type: 'text/plain' },
  };
  assert.deepEqual(validateAnswers(def, good).errors, {});
});
test('definitions reject backwards logic, duplicate IDs and duplicate choices', () => {
  const def = blankForm();
  def.fields[0].condition = { field: def.fields[1].id, equals: 'x' };
  assert.equal(definitionSchema.safeParse(def).success, false);
  const f = makeField('choice');
  f.options = ['Same', 'Same'];
  assert.equal(definitionSchema.safeParse({ ...blankForm(), fields: [f] }).success, false);
  const a = makeField('text');
  assert.equal(definitionSchema.safeParse({ ...blankForm(), fields: [a, a] }).success, false);
});
test('CSV escapes quotes, line breaks, and spreadsheet formulas', () => {
  assert.equal(csvCell('hello, "friend"'), '"hello, ""friend"""');
  assert.equal(csvCell('=IMPORTXML("x")'), '"\'=IMPORTXML(""x"")"');
  assert.equal(csvCell('  +1'), '"\'  +1"');
  assert.equal(csvCell('\t=1'), '"\'\t=1"');
  assert.equal(csvCell('ordinary'), '"ordinary"');
  for (const input of ['\u0000=1', '\u0001 +1', '＝1', '＋1', '－1', '＠SUM(1)', '\n=1']) {
    assert.ok(
      csvCell(input).startsWith('"\''),
      'neutralizes control characters and full-width formula prefixes',
    );
  }
});
