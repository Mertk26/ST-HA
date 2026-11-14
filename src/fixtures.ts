import {
  clockOf, latest, mergeObservations, observationSchema, persona, workspaceSchema,
  type Indicator, type Observation, type PersonaId, type Scenario, type Workspace,
} from './domain.ts';

export interface CheckIn {
  sleep: number | null;
  fluid: number | null;
  fatigue: boolean | null;
  mood: 'steady' | 'low' | null;
  bowel: 'none' | 'discomfort' | null;
  fluidComplete: boolean;
}
const hour = 3_600_000;
export function makeWorkspace(personaId: PersonaId, mode: Workspace['mode'] = 'standard', scenario: Scenario = 'attention', at = new Date().toISOString()): Workspace {
  const profile = persona(personaId);
  const id = mode === 'standard' ? `${personaId}/standard` : `${personaId}/replay/${crypto.randomUUID()}`;
  const observationTime = (days: number) => new Date(Date.parse(at) - days * 24 * hour).toISOString();
  const observations: Observation[] = [];
  const history: { indicator: Indicator; values: number[]; unit: string }[] = [
    { indicator: 'heartRate', values: [68, 72, 70, 73, 71, 74, 72], unit: 'bpm' },
    { indicator: 'sleep', values: [7.6, 7.2, 7.8, 6.9, 7.1, 6.6, 6.8], unit: 'h' },
    { indicator: 'strength', values: [38, 37.6, 36.8, 36, 35, 34, 33], unit: 'kgf' },
  ];
  for (const series of history) {
    series.values.forEach((value, index) => {
      const observedAt = observationTime(8 - index);
      observations.push({
        id: `${id}/history/${series.indicator}/${index}`, seriesId: `${id}/history/${series.indicator}/${index}`,
        revision: 1, supersedes: null, indicator: series.indicator, value, unit: series.unit,
        availability: 'recorded', observedAt, recordedAt: observedAt,
        sourceId: 'synthetic-history', method: 'seed', origin: 'synthetic',
      });
    });
  }
  return workspaceSchema.parse({
    schemaVersion: 1, id, personaId, mode, scenario, clock: mode === 'replay' ? at : null,
    revision: 0, dataRevision: 0, createdAt: at, updatedAt: at, figure: profile.figure,
    autoRefresh: true, nativeReminders: false, fluidCoverageComplete: false, engineFault: scenario === 'engine-fault',
    sources: {
      heart: { status: 'not-started', retrievedAt: null, error: null },
      strength: { status: 'not-started', retrievedAt: null, error: null },
    },
    observations, notices: [], evaluation: null,
    tasks: [
      { id: `${id}/assessment`, kind: 'assessment', title: 'Log your physical assessment', detail: 'Record the result of the fictional, like-for-like handgrip test. Do not perform an unsupported test.', dueAt: new Date(Date.parse(at) - 5 * 60_000).toISOString(), status: 'pending', respondedAt: null },
      { id: `${id}/movement`, kind: 'movement', title: 'Planned movement session', detail: 'Review the recorded fictional countermeasure plan. This app does not set intensity or replace a prescribed session.', dueAt: new Date(Date.parse(at) + 35 * 60_000).toISOString(), status: 'pending', respondedAt: null },
      { id: `${id}/checkin`, kind: 'checkin', title: 'Evening health check-in', detail: 'Review your recorded day and optionally update private check-ins.', dueAt: new Date(Date.parse(at) + 4 * hour).toISOString(), status: 'pending', respondedAt: null },
    ],
  });
}

export function defaultCheckIn(workspace: Workspace): CheckIn {
  const recovery = workspace.scenario === 'recovery';
  const sleep = latest(workspace, 'sleep');
  const currentManual = sleep?.method === 'manual';
  return {
    sleep: currentManual ? (typeof sleep.value === 'number' ? sleep.value : null) : recovery ? 8.2 : 6.2,
    fluid: currentManual ? numericManual(workspace, 'fluid') : 1200,
    fatigue: currentManual ? booleanManual(workspace) : !recovery,
    mood: currentManual ? moodManual(workspace) : recovery ? 'steady' : 'low',
    bowel: currentManual ? bowelManual(workspace) : recovery ? 'none' : 'discomfort',
    fluidComplete: currentManual ? workspace.fluidCoverageComplete : recovery,
  };
}
function numericManual(w: Workspace, indicator: Indicator) {
  const item = latest(w, indicator);
  return typeof item?.value === 'number' ? item.value : null;
}
function booleanManual(w: Workspace) {
  const item = latest(w, 'fatigue');
  return typeof item?.value === 'boolean' ? item.value : null;
}
function moodManual(w: Workspace): CheckIn['mood'] {
  const value = latest(w, 'mood')?.value;
  return value === 'steady' || value === 'low' ? value : null;
}
function bowelManual(w: Workspace): CheckIn['bowel'] {
  const value = latest(w, 'bowel')?.value;
  return value === 'none' || value === 'discomfort' ? value : null;
}

export interface Retrieval {
  observations: Observation[];
  sources: Workspace['sources'];
}
export async function retrieveSensors(workspace: Workspace, signal: AbortSignal, failStrength = workspace.scenario === 'source-gap'): Promise<Retrieval> {
  signal.throwIfAborted();
  const at = clockOf(workspace);
  const bucket = Math.floor(Date.parse(at) / 60_000);
  const observedAt = new Date(bucket * 60_000).toISOString();
  const base = (indicator: 'heartRate' | 'strength', value: number, unit: string): Observation => ({
    id: `${workspace.id}/sensor/${indicator}/${bucket}`, seriesId: `${workspace.id}/sensor/${indicator}/${bucket}`,
    revision: 1, supersedes: null, indicator, value, unit, availability: 'recorded',
    observedAt, recordedAt: observedAt, sourceId: indicator === 'heartRate' ? 'heart-sensor' : 'strength-sensor',
    method: 'sensor', origin: 'synthetic',
  });
  await Promise.resolve();
  signal.throwIfAborted();
  const heart = base('heartRate', workspace.personaId === 'alex' ? 74 : 71, 'bpm');
  const strength = base('strength', workspace.scenario === 'recovery' ? 35.6 : 31.2, 'kgf');
  return {
    observations: failStrength ? [heart] : [heart, strength],
    sources: {
      heart: { status: 'retrieved', retrievedAt: at, error: null },
      strength: failStrength
        ? { ...workspace.sources.strength, status: 'failed', error: 'Simulated assessment source is unavailable. Historical records retain their original times.' }
        : { status: 'retrieved', retrievedAt: at, error: null },
    },
  };
}

export function commitCheckIn(workspace: Workspace, input: CheckIn, retrieval: Retrieval, at = clockOf(workspace)): Workspace {
  const values: { indicator: Indicator; value: Observation['value']; unit: string; optional: boolean }[] = [
    { indicator: 'sleep', value: input.sleep, unit: 'h', optional: false },
    { indicator: 'fluid', value: input.fluid, unit: 'mL', optional: false },
    { indicator: 'fatigue', value: input.fatigue, unit: 'boolean', optional: true },
    { indicator: 'mood', value: input.mood, unit: 'scale', optional: true },
    { indicator: 'bowel', value: input.bowel, unit: 'scale', optional: true },
  ];
  const records = values.map(({ indicator, value, unit, optional }) => {
    const seriesId = `${workspace.id}/daily/${at.slice(0, 10)}/${indicator}`;
    const previous = workspace.observations.filter(item => item.seriesId === seriesId).sort((a, b) => b.revision - a.revision)[0];
    return observationSchema.parse({
      id: crypto.randomUUID(), seriesId, revision: (previous?.revision ?? 0) + 1, supersedes: previous?.id ?? null,
      indicator, value, unit, availability: value === null ? optional ? 'declined' : 'missing' : 'recorded',
      observedAt: at, recordedAt: at, sourceId: 'manual-checkin', method: 'manual', origin: 'synthetic',
    });
  });
  return workspaceSchema.parse({
    ...workspace, observations: mergeObservations(workspace.observations, [...retrieval.observations, ...records]),
    sources: retrieval.sources, fluidCoverageComplete: input.fluidComplete,
    dataRevision: workspace.dataRevision + 1, updatedAt: at,
  });
}
