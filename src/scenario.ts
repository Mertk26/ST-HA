import { clockOf, latest, mergeObservations, numeric, observationSchema, type Indicator, type Observation, type Workspace } from './domain.ts';
import { catalogInputs, type CatalogIndicator } from './input-catalog.ts';

export interface ScenarioInputs {
  heartRate: number | null;
  strength: number | null;
  sleep: number | null;
  fluid: number | null;
  fatigue: boolean | null;
  mood: 'steady' | 'low' | null;
  bowel: 'none' | 'discomfort' | null;
  extra: Record<CatalogIndicator, string | number | null>;
}

export function currentScenarioInputs(workspace: Workspace): ScenarioInputs {
  const fatigue = latest(workspace, 'fatigue');
  const mood = latest(workspace, 'mood');
  const bowel = latest(workspace, 'bowel');
  return {
    heartRate: numeric(latest(workspace, 'heartRate')),
    strength: numeric(latest(workspace, 'strength')),
    sleep: numeric(latest(workspace, 'sleep')),
    fluid: numeric(latest(workspace, 'fluid')),
    fatigue: fatigue?.availability === 'recorded' && typeof fatigue.value === 'boolean' ? fatigue.value : null,
    mood: mood?.availability === 'recorded' && (mood.value === 'steady' || mood.value === 'low') ? mood.value : null,
    bowel: bowel?.availability === 'recorded' && (bowel.value === 'none' || bowel.value === 'discomfort') ? bowel.value : null,
    extra: Object.fromEntries(catalogInputs.map(item => {
      const observation = latest(workspace, item.id);
      return [item.id, observation?.availability === 'recorded' ? observation.value : null];
    })) as Record<CatalogIndicator, string | number | null>,
  };
}

export function makeScenarioPreview(workspace: Workspace, inputs: ScenarioInputs): { workspace: Workspace; at: string } {
  const current = currentScenarioInputs(workspace);
  const latestTime = workspace.observations.reduce((time, item) => Math.max(time, Date.parse(item.observedAt)), 0);
  const at = new Date(Math.max(Date.parse(clockOf(workspace)), latestTime + 1)).toISOString();
  const definitions: { indicator: Indicator; unit: string; optional: boolean }[] = [
    { indicator: 'heartRate', unit: 'bpm', optional: false },
    { indicator: 'strength', unit: 'kgf', optional: false },
    { indicator: 'sleep', unit: 'h', optional: false },
    { indicator: 'fluid', unit: 'mL', optional: false },
    { indicator: 'fatigue', unit: 'boolean', optional: true },
    { indicator: 'mood', unit: 'scale', optional: true },
    { indicator: 'bowel', unit: 'scale', optional: true },
  ];
  const observations: Observation[] = definitions.flatMap(({ indicator, unit, optional }) => {
    if (indicator !== 'heartRate' && indicator !== 'strength' && indicator !== 'sleep' && indicator !== 'fluid' && indicator !== 'fatigue' && indicator !== 'mood' && indicator !== 'bowel') return [];
    const value = inputs[indicator];
    if (value === current[indicator]) return [];
    return [observationSchema.parse({
      id: crypto.randomUUID(), seriesId: `scenario/${crypto.randomUUID()}`, revision: 1, supersedes: null,
      indicator, value, unit, availability: value === null ? optional ? 'declined' : 'missing' : 'recorded',
      observedAt: at, recordedAt: at, sourceId: 'manual-checkin', method: 'manual', origin: 'synthetic',
    })];
  });
  for (const item of catalogInputs) {
    const value = inputs.extra[item.id];
    if (value === current.extra[item.id]) continue;
    observations.push(observationSchema.parse({
      id: crypto.randomUUID(), seriesId: `scenario/${crypto.randomUUID()}`, revision: 1, supersedes: null,
      indicator: item.id, value, unit: item.unit, availability: value === null ? 'missing' : 'recorded',
      observedAt: at, recordedAt: at, sourceId: 'manual-checkin', method: 'manual', origin: 'synthetic',
    }));
  }
  return {
    workspace: {
      ...workspace,
      observations: mergeObservations(workspace.observations, observations),
      dataRevision: workspace.dataRevision + 1,
      fluidCoverageComplete: inputs.fluid === current.fluid ? workspace.fluidCoverageComplete : false,
      evaluation: null,
    },
    at,
  };
}
