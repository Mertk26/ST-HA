import assert from 'node:assert/strict';
import test from 'node:test';
import {
  attachEvaluation, exportReport, latest, mergeObservations, observationSchema, updateTask,
} from './domain.ts';
import { commitCheckIn, defaultCheckIn, makeWorkspace, retrieveSensors } from './fixtures.ts';
import { evaluate } from './engine.ts';
import { plannedReminders } from './native.ts';

const at = '2026-11-14T10:00:00.000Z';
async function prepared(scenario: 'attention' | 'recovery' | 'source-gap' | 'engine-fault' = 'attention') {
  const workspace = makeWorkspace('alex', 'replay', scenario, at);
  const sources = await retrieveSensors(workspace, new AbortController().signal);
  return commitCheckIn(workspace, defaultCheckIn(workspace), sources, at);
}

test('saved synthetic records produce multi-domain CQL findings and distinct body associations', async () => {
  const workspace = await prepared();
  const result = await evaluate(workspace, at);
  assert.equal(result.values['SleepAndFatigue'], true);
  assert.equal(result.values['StrengthRatio'], 0.78);
  assert.equal(result.findings.filter(item => item.region === 'arms').length, 2);
  assert.ok(result.findings.some(item => item.region === 'whole'));
  assert.ok(result.findings.some(item => item.region === 'abdomen' && item.association === 'reported location'));
  assert.ok(result.findings.every(item => item.proof.length && item.limits && item.evidenceId));
});

test('same snapshot/clock/knowledge gives identical results, independent of figure presentation', async () => {
  const workspace = await prepared();
  assert.deepEqual(await evaluate(workspace, at), await evaluate({ ...workspace, figure: 'female' }, at));
});

test('corrections retain original records and withdraw dependent notices without losing history', async () => {
  let workspace = await prepared();
  workspace = attachEvaluation(workspace, await evaluate(workspace, at));
  const original = latest(workspace, 'sleep')!;
  const corrected = commitCheckIn(workspace, {
    ...defaultCheckIn(workspace), sleep: 8.2, fatigue: false, mood: 'steady', bowel: 'none', fluidComplete: true,
  }, { observations: [], sources: workspace.sources }, '2026-11-14T10:01:00.000Z');
  const next = attachEvaluation(corrected, await evaluate(corrected, '2026-11-14T10:01:00.000Z'));
  assert.ok(next.observations.some(item => item.id === original.id));
  assert.equal(latest(next, 'sleep')?.supersedes, original.id);
  assert.equal(latest(next, 'sleep')?.revision, 2);
  assert.ok(next.notices.find(item => item.findingId === 'sleep-plan')?.withdrawnAt);
  assert.ok(!next.evaluation?.findings.some(item => item.id === 'sleep-plan'));
});

test('notices deduplicate while active; acknowledgement does not clear a finding', async () => {
  let workspace = await prepared();
  const evaluation = await evaluate(workspace, at);
  workspace = attachEvaluation(workspace, evaluation);
  const count = workspace.notices.length;
  workspace.notices = workspace.notices.map(item => ({ ...item, acknowledgedAt: at }));
  const next = attachEvaluation(workspace, evaluation);
  assert.equal(next.notices.length, count);
  assert.deepEqual(next.evaluation?.findings, evaluation.findings);
  assert.ok(next.notices.every(item => item.acknowledgedAt === at));
});

test('withdrawn-to-active creates a new explicit notice occurrence, not a render duplicate', async () => {
  let workspace = await prepared();
  const result = await evaluate(workspace, at);
  workspace = attachEvaluation(workspace, result);
  workspace = attachEvaluation(workspace, { ...result, findings: result.findings.filter(item => item.id !== 'sleep-plan') });
  workspace = attachEvaluation(workspace, result);
  const notices = workspace.notices.filter(item => item.findingId === 'sleep-plan');
  assert.equal(notices.length, 2);
  assert.equal(notices[1]?.occurrence, 2);
  assert.equal(notices.filter(item => !item.withdrawnAt).length, 1);
});

test('missing and declined values remain explicit; optional reports never become negative findings', async () => {
  const initial = await prepared();
  const workspace = commitCheckIn(initial, {
    sleep: null, fluid: null, fatigue: null, mood: null, bowel: null, fluidComplete: false,
  }, { observations: [], sources: initial.sources }, '2026-11-14T10:01:00.000Z');
  const result = await evaluate(workspace, '2026-11-14T10:01:00.000Z');
  assert.equal(latest(workspace, 'mood')?.availability, 'declined');
  assert.equal(latest(workspace, 'sleep')?.availability, 'missing');
  assert.equal(result.values['SleepAndFatigue'], null);
  assert.equal(result.values['CombinedPrivateContext'], null);
  assert.ok(!result.findings.some(item => item.private));
  assert.ok(result.findings.some(item => item.id === 'sleep-data'));
});

test('source outage retains original history and does not manufacture a current result', async () => {
  const workspace = await prepared('source-gap');
  const result = await evaluate(workspace, at);
  assert.equal(workspace.sources.heart.status, 'retrieved');
  assert.equal(workspace.sources.strength.status, 'failed');
  assert.equal(latest(workspace, 'strength')?.method, 'seed');
  assert.equal(result.values['StrengthRatio'], null);
  assert.ok(result.findings.some(item => item.id === 'strength-data'));
});

test('time alone expires evidence, including old completed fluid coverage', async () => {
  const workspace = await prepared('recovery');
  const result = await evaluate(workspace, '2026-11-15T10:00:00.001Z');
  assert.equal(result.values['SleepBelowPlan'], null);
  assert.equal(result.values['StrengthRatio'], null);
  assert.equal(result.values['FluidLogIncomplete'], true);
  assert.equal(result.values['AbdominalReport'], null);
});

test('exact reference equality is not below reference; future evidence is ineligible', async () => {
  const workspace = await prepared();
  const strength = latest(workspace, 'strength')!;
  const equal = { ...workspace, observations: workspace.observations.map(item => item.id === strength.id ? { ...item, value: 32 } : item) };
  assert.equal((await evaluate(equal, at)).values['StrengthBelowReference'], false);
  assert.equal((await evaluate(workspace, '2026-11-14T09:00:00.000Z')).values['StrengthRatio'], null);
});

test('task completion updates its own finding, not unrelated physical-performance evidence', async () => {
  const workspace = await prepared();
  const assessment = workspace.tasks.find(item => item.kind === 'assessment')!;
  const next = updateTask(workspace, assessment.id, 'completed', at);
  const result = await evaluate(next, at);
  assert.equal(result.values['AssessmentDue'], false);
  assert.equal(result.values['StrengthBelowReference'], true);
  assert.throws(() => updateTask(workspace, 'unknown', 'completed', at), /Unknown task/);
});

test('outdated or cross-persona evaluations cannot be published', async () => {
  const workspace = await prepared();
  const result = await evaluate(workspace, at);
  assert.throws(() => attachEvaluation({ ...workspace, dataRevision: workspace.dataRevision + 1 }, result), /Outdated/);
  assert.throws(() => attachEvaluation({ ...workspace, id: 'maya/standard' }, result), /Outdated/);
});

test('repeated source records are idempotent; changed content needs a new revision identity', async () => {
  const workspace = await prepared();
  const again = await retrieveSensors(workspace, new AbortController().signal);
  assert.equal(mergeObservations(workspace.observations, again.observations).length, workspace.observations.length);
  const record = again.observations[0]!;
  assert.throws(() => mergeObservations(workspace.observations, [{ ...record, value: 999 }]), /without a new revision/);
});

test('record validation rejects malformed units/values and preserves missing versus zero', () => {
  const workspace = makeWorkspace('alex', 'replay', 'attention', at);
  const sample = workspace.observations[0]!;
  assert.throws(() => observationSchema.parse({ ...sample, unit: 'kg' }));
  assert.throws(() => observationSchema.parse({ ...sample, value: Number.NaN }));
  assert.throws(() => observationSchema.parse({ ...sample, availability: 'missing', value: 0 }));
  assert.equal(observationSchema.parse({ ...sample, value: 0 }).value, 0);
});

test('default export excludes private inputs and dependent findings, not just their labels', async () => {
  const workspace = await prepared();
  const evaluated = attachEvaluation(workspace, await evaluate(workspace, at));
  const report = exportReport(evaluated, false);
  assert.ok(!report.observations.some(item => item.indicator === 'mood' || item.indicator === 'bowel'));
  assert.ok(!report.findings.some(item => item.private));
  assert.ok(exportReport(evaluated, true).observations.some(item => item.indicator === 'mood'));
});

test('engine failure is an error, not insufficient data or a successful fallback', async () => {
  await assert.rejects(evaluate(await prepared('engine-fault'), at), /intentionally unavailable/);
});

test('replay has a separate identity and clock; cancelling retrieval has no side effects', async () => {
  const standard = makeWorkspace('alex', 'standard', 'attention', at);
  const replay = makeWorkspace('alex', 'replay', 'recovery', at);
  assert.notEqual(standard.id, replay.id);
  assert.equal(standard.clock, null);
  assert.equal(replay.clock, at);
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(retrieveSensors(replay, controller.signal), { name: 'AbortError' });
  assert.equal(replay.sources.heart.status, 'not-started');
});

test('native planning uses stable persona-scoped IDs, future pending tasks, and generic UTC previews', () => {
  const workspace = { ...makeWorkspace('alex', 'standard', 'attention', at), nativeReminders: true };
  const reminders = plannedReminders(workspace, Date.parse(at));
  assert.equal(reminders.length, 2);
  assert.deepEqual(plannedReminders(workspace, Date.parse(at)), reminders);
  assert.ok(reminders.every(item => item.isExactNotification === false && item.body?.includes('UTC')));
  assert.ok(reminders.every(item => !/Alex|mood|strength|31\.2|78%/i.test(item.body ?? '')));
  const maya = plannedReminders({ ...workspace, personaId: 'maya' }, Date.parse(at));
  assert.ok(maya.every(item => !reminders.some(other => other.id === item.id)));
  const movement = workspace.tasks.find(task => task.kind === 'movement')!;
  assert.equal(plannedReminders(updateTask(workspace, movement.id, 'completed', at), Date.parse(at)).length, 1);
  assert.deepEqual(plannedReminders({ ...workspace, mode: 'replay' }, Date.parse(at)), []);
  assert.deepEqual(plannedReminders({ ...workspace, nativeReminders: false }, Date.parse(at)), []);
});
