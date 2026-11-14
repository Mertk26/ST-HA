import cql from 'cql-execution';
import elm from './HecatronPoc.elm.json' with { type: 'json' };
import manifest from './knowledge-manifest.json' with { type: 'json' };

export interface Snapshot {
  revision: number;
  observationId: string;
  observedAt: string | null;
  evaluationTime: string;
  sleep: { value: number; unit: string } | null;
  sleepPlan: { value: number; unit: string } | null;
  fatigue: boolean | null;
  completionCoverageKnown: boolean | null;
  completionRecorded: boolean | null;
  baselineStrength: number | null;
  currentStrength: number | null;
}

export const fixture: Snapshot = {
  revision: 1,
  observationId: 'synthetic-sleep-001',
  observedAt: '2026-11-14T06:00:00.000Z',
  evaluationTime: '2026-11-14T10:00:00.000Z',
  sleep: { value: 420, unit: 'min' },
  sleepPlan: { value: 8, unit: 'h' },
  fatigue: true,
  completionCoverageKnown: false,
  completionRecorded: false,
  baselineStrength: 100,
  currentStrength: 85,
};

function dateTime(value: string) {
  if (!/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}(Z|[+-]\d\d:\d\d)$/.test(value)
    || !Number.isFinite(Date.parse(value))) {
    throw new Error(`A complete ISO timestamp with offset is required: ${value}`);
  }
  const parsed = cql.DateTime.parse(value);
  if (!parsed || !parsed.toLuxonDateTime().isValid) throw new Error(`Invalid CQL DateTime: ${value}`);
  return parsed;
}

function duration(value: Snapshot['sleep']) {
  if (value === null) return null;
  if (!Number.isFinite(value.value) || value.value < 0 || !['h', 'min'].includes(value.unit)) {
    throw new Error('Sleep duration requires a finite nonnegative value in h or min.');
  }
  return new cql.Quantity(value.value, value.unit);
}

function nullableBoolean(value: unknown, name: string): boolean | null {
  if (value === null || typeof value === 'boolean') return value;
  throw new Error(`Unexpected CQL result type: ${name}`);
}

function nullableNumber(value: unknown, name: string): number | null {
  if (value === null || (typeof value === 'number' && Number.isFinite(value))) return value;
  throw new Error(`Unexpected CQL result type: ${name}`);
}

export async function evaluate(snapshot: Snapshot) {
  const clock = dateTime(snapshot.evaluationTime);
  for (const value of [snapshot.baselineStrength, snapshot.currentStrength]) {
    if (value !== null && (!Number.isFinite(value) || value < 0)) {
      throw new Error('Strength fixture values must be finite and nonnegative.');
    }
  }
  const executor = new cql.Executor(new cql.Library(elm), undefined, {
    SleepDuration: duration(snapshot.sleep),
    SleepPlan: duration(snapshot.sleepPlan),
    ObservedAt: snapshot.observedAt === null ? null : dateTime(snapshot.observedAt),
    EvaluationTime: clock,
    ReportedFatigue: snapshot.fatigue,
    CompletionCoverageKnown: snapshot.completionCoverageKnown,
    CompletionRecorded: snapshot.completionRecorded,
    BaselineStrength: snapshot.baselineStrength,
    CurrentStrength: snapshot.currentStrength,
  });
  const result = await executor.exec(new cql.PatientSource([]), clock);
  const values: Record<string, unknown> = result.unfilteredResults;
  const fresh = nullableBoolean(values['ObservationFresh'], 'ObservationFresh');
  const belowPlan = nullableBoolean(values['SleepBelowPlan'], 'SleepBelowPlan');
  const combinedReview = nullableBoolean(values['CombinedReview'], 'CombinedReview');
  return {
    snapshotRevision: snapshot.revision,
    observationId: snapshot.observationId,
    evaluatedAt: snapshot.evaluationTime,
    library: `${manifest.library}@${manifest.version}`,
    sourceSha256: manifest.sourceSha256,
    elmSha256: manifest.elmSha256,
    authority: manifest.authority,
    results: {
      clockMatchesSnapshot: nullableBoolean(values['ClockMatchesSnapshot'], 'ClockMatchesSnapshot'),
      fresh,
      belowPlan,
      combinedReview,
      completionNotRecorded: nullableBoolean(values['CompletionNotRecorded'], 'CompletionNotRecorded'),
      strengthRatio: nullableNumber(values['StrengthRatio'], 'StrengthRatio'),
    },
    explanation: {
      expression: 'CombinedReview',
      dependencies: ['ObservationFresh', 'SleepBelowPlan', 'ReportedFatigue'],
      plan: 'synthetic-sleep-plan-v1',
      statement: combinedReview === true
        ? 'Recorded sleep is below the fictional plan and fatigue was reported; review the records.'
        : combinedReview === null
          ? 'The combined pathway is unknown; inspect freshness, sleep/plan availability, and fatigue reporting.'
          : 'This combined review condition is not satisfied; this is not an overall health assessment.',
      limits: 'Manually declared explanation dependencies, not an automatic ELM proof tree. No treatment or duty decision.',
    },
  };
}
