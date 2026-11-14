import assert from 'node:assert/strict';
import test from 'node:test';
import { evaluate, fixture } from './engine.ts';

test('compiled CQL converts minutes/hours and links a cross-domain finding to its snapshot', async () => {
  const result = await evaluate(fixture);
  assert.deepEqual(result.results, {
    clockMatchesSnapshot: true,
    fresh: true,
    belowPlan: true,
    combinedReview: true,
    completionNotRecorded: null,
    strengthRatio: 0.85,
  });
  assert.equal(result.observationId, 'synthetic-sleep-001');
  assert.equal(result.snapshotRevision, 1);
  assert.match(result.sourceSha256, /^[0-9a-f]{64}$/);
});

test('missing evidence stays unknown; false AND unknown remains false', async () => {
  assert.equal((await evaluate({ ...fixture, sleep: null })).results.combinedReview, null);
  assert.equal((await evaluate({ ...fixture, sleep: null, fatigue: false })).results.combinedReview, false);
  assert.equal((await evaluate({ ...fixture, fatigue: null })).results.combinedReview, null);
});

test('freshness includes the exact 24-hour boundary, excludes older and future readings', async () => {
  assert.equal((await evaluate({ ...fixture, observedAt: '2026-11-13T10:00:00.000Z' })).results.fresh, true);
  for (const observedAt of ['2026-11-13T09:59:59.999Z', '2026-11-14T10:00:00.001Z', null]) {
    const result = await evaluate({ ...fixture, observedAt });
    assert.equal(result.results.fresh, false);
    assert.equal(result.results.combinedReview, null);
  }
});

test('equivalent offset timestamps agree; explicit clock makes replay deterministic', async () => {
  assert.deepEqual(await evaluate(fixture), await evaluate(fixture));
  assert.equal((await evaluate({ ...fixture, observedAt: '2026-11-14T09:00:00.000+03:00' })).results.fresh, true);
});

test('plan equality is not below plan; corrections replace the derived result', async () => {
  const corrected = await evaluate({ ...fixture, revision: 2, sleep: { value: 480, unit: 'min' } });
  assert.equal(corrected.results.belowPlan, false);
  assert.equal(corrected.results.combinedReview, false);
  assert.equal(corrected.snapshotRevision, 2);
  assert.equal(corrected.observationId, fixture.observationId);
});

test('absence requires coverage; invalid baselines never produce a ratio', async () => {
  assert.equal((await evaluate({ ...fixture, completionCoverageKnown: true })).results.completionNotRecorded, true);
  assert.equal((await evaluate({ ...fixture, completionCoverageKnown: true, completionRecorded: true })).results.completionNotRecorded, false);
  assert.equal((await evaluate({ ...fixture, baselineStrength: 0 })).results.strengthRatio, null);
  assert.equal((await evaluate({ ...fixture, baselineStrength: null })).results.strengthRatio, null);
});

test('invalid input surfaces errors instead of a negative or unknown clinical result', async () => {
  await assert.rejects(evaluate({ ...fixture, sleep: { value: 7, unit: 'kg' } }), /h or min/);
  await assert.rejects(evaluate({ ...fixture, evaluationTime: 'not-a-date' }), /timestamp/);
  await assert.rejects(evaluate({ ...fixture, evaluationTime: '2026-02-31T10:00:00.000Z' }), /Invalid CQL DateTime/);
});
