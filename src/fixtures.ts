import {
  clockOf, latest, mergeObservations, observationSchema, persona, workspaceSchema,
  type Indicator, type Observation, type PersonaId, type Scenario, type Workspace,
} from './domain.ts';
import { catalogInputs } from './input-catalog.ts';

export interface CheckIn {
  sleep: number | null;
  fluid: number | null;
  fatigue: boolean | null;
  mood: 'steady' | 'low' | null;
  bowel: 'none' | 'discomfort' | null;
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
      { id: `${id}/assessment`, kind: 'assessment', title: 'Log your physical assessment', detail: 'Review the handgrip assessment. Do not perform an unsupported assessment.', dueAt: new Date(Date.parse(at) - 5 * 60_000).toISOString(), status: 'pending', respondedAt: null },
      { id: `${id}/movement`, kind: 'movement', title: 'Planned movement session', detail: 'Review the countermeasure plan. This app does not set intensity or replace a prescribed session.', dueAt: new Date(Date.parse(at) + 35 * 60_000).toISOString(), status: 'pending', respondedAt: null },
      { id: `${id}/checkin`, kind: 'checkin', title: 'Evening health check-in', detail: 'Review your recorded day and optionally update private check-ins.', dueAt: new Date(Date.parse(at) + 4 * hour).toISOString(), status: 'pending', respondedAt: null },
    ],
  });
}

export function defaultCheckIn(workspace: Workspace): CheckIn {
  const recovery = workspace.scenario === 'recovery';
  const sleep = latest(workspace, 'sleep');
  const currentManual = sleep?.method === 'manual' || sleep?.id.includes('/demo/') === true;
  return {
    sleep: currentManual ? (typeof sleep.value === 'number' ? sleep.value : null) : recovery ? 8.2 : 6.2,
    fluid: currentManual ? numericManual(workspace, 'fluid') : 1200,
    fatigue: currentManual ? booleanManual(workspace) : !recovery,
    mood: currentManual ? moodManual(workspace) : recovery ? 'steady' : 'low',
    bowel: currentManual ? bowelManual(workspace) : recovery ? 'none' : 'discomfort',
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

function randomBetween(min: number, max: number, precision = 0): number {
  const scale = 10 ** precision;
  return Math.round((min + Math.random() * (max - min)) * scale) / scale;
}

function generateDailyReadings(workspace: Workspace, at: string): Observation[] {
  const values: { indicator: Indicator; value: number | string; unit: string }[] = [];
  
  for (const item of catalogInputs) {
    if (item.kind !== 'number' || !('range' in item)) continue;
    const [lower, upper] = item.range;
    const span = upper - lower;
    let value: number;
    
    // Radiation indicators - occasional spikes to generate warnings
    if (item.id === 'personalRadiation' || item.id === 'environmentalRadiation') {
      const hasSpike = Math.random() < 0.15; // 15% chance of elevated radiation
      value = hasSpike 
        ? randomBetween(upper + span * 0.2, upper + span * 0.5, 2)
        : randomBetween(Math.max(0, lower - span * 0.1), upper, 2);
    }
    // Cabin atmosphere - occasionally out of spec
    else if (item.id === 'cabinCarbonDioxide' || item.id === 'cabinOxygen') {
      const hasDeviation = Math.random() < 0.1; // 10% chance of deviation
      value = hasDeviation
        ? (item.id === 'cabinCarbonDioxide' ? randomBetween(2100, 2500) : randomBetween(18, 18.8, 1))
        : randomBetween(Math.max(0, lower - span * 0.2), upper + span * 0.1, 0);
    }
    // Cabin pressure - critical monitoring
    else if (item.id === 'cabinPressure') {
      const isStable = Math.random() < 0.9; // 90% normal
      value = isStable
        ? randomBetween(lower, upper, 1)
        : randomBetween(lower - 2, lower - 0.5, 1);
    }
    // Cabin humidity - can affect crew health
    else if (item.id === 'cabinHumidity') {
      const isComfortable = Math.random() < 0.85; // 85% in range
      value = isComfortable
        ? randomBetween(lower, upper, 0)
        : randomBetween(upper + 5, upper + 20, 0);
    }
    // Stress levels vary based on mission phase
    else if (item.id === 'stress') {
      value = randomBetween(Math.max(0, lower - 1), Math.min(10, upper + 2), 1);
    }
    else {
      const max = item.unit === '%' ? Math.min(100, upper + span * 0.3)
        : upper + span * 0.3;
      const precision = span <= 10 ? 1 : 0;
      value = randomBetween(Math.max(0, lower - span * 0.3), max, precision);
    }
    
    values.push({ indicator: item.id, value, unit: item.unit });
  }
  
  // Comprehensive text-based daily checks
  const textExamples = [
    { indicator: 'sleepQuality', values: [
      'Fictional: uninterrupted, felt refreshed',
      'Fictional: interrupted sleep, woke multiple times',
      'Fictional: difficulty falling asleep',
      'Fictional: early morning awakening',
      'Fictional: good sleep quality with normal duration'
    ]},
    { indicator: 'workload', values: [
      'Fictional: routine workload, manageable',
      'Fictional: busy schedule, multiple EVA prep tasks',
      'Fictional: light workload, maintenance activities',
      'Fictional: high workload, experiment operations',
      'Fictional: nominal workload, standard procedures'
    ]},
    { indicator: 'missionPhase', values: [
      'Fictional: transit phase, cruising',
      'Fictional: orbital operations, Earth observation',
      'Fictional: proximity operations, docking sequence',
      'Fictional: extravehicular activity preparation',
      'Fictional: in-flight maintenance phase'
    ]},
    { indicator: 'lightNoise', values: [
      'Fictional: quiet cabin, normal ambient noise',
      'Fictional: increased cabin noise, fan operation',
      'Fictional: low light levels, night cycle',
      'Fictional: moderate noise from equipment operation',
      'Fictional: normal lighting and acoustic levels'
    ]},
    { indicator: 'symptoms', values: [
      'Fictional: no symptoms reported',
      'Fictional: mild headache, resolved with rest',
      'Fictional: nasal congestion, typical of microgravity',
      'Fictional: general fatigue, expected after day',
      'Fictional: muscle soreness from exercise countermeasures'
    ]},
    { indicator: 'hydrationSymptoms', values: [
      'Fictional: adequate hydration, normal thirst cues',
      'Fictional: decreased thirst sensation',
      'Fictional: fluid intake below plan, addressed in check-in',
      'Fictional: adequate fluid consumption throughout day',
      'Fictional: monitoring fluid intake, within target'
    ]},
    { indicator: 'exerciseContext', values: [
      'Fictional: completed scheduled treadmill session',
      'Fictional: resistance exercise with lower body focus',
      'Fictional: treadmill run, 45 minutes, moderate intensity',
      'Fictional: skipped exercise, focused on mission tasks',
      'Fictional: completed countermeasure exercise, good performance'
    ]},
    { indicator: 'cognition', values: [
      'Fictional: alert, good concentration throughout day',
      'Fictional: some difficulty focusing, improved after rest',
      'Fictional: normal cognitive function, completed complex tasks',
      'Fictional: slight mental fatigue toward end of day',
      'Fictional: sharp focus, productive work session'
    ]},
    { indicator: 'nutrition', values: [
      'Fictional: regular meal intake, consumed 3 meals',
      'Fictional: good appetite, enjoyed variety in menu',
      'Fictional: reduced appetite, consumed 2.5 meals',
      'Fictional: focused on high-protein options for recovery',
      'Fictional: normal nutrition intake, meals consumed on schedule'
    ]},
    { indicator: 'socialContext', values: [
      'Fictional: good crew interaction, briefing completed',
      'Fictional: limited interaction, focused workday',
      'Fictional: positive crew dynamics, team dinner',
      'Fictional: routine communication with ground control',
      'Fictional: strong crew cohesion, recreational time together'
    ]},
    { indicator: 'spaceWeather', values: [
      'Fictional: calm space weather, minimal solar activity',
      'Fictional: moderate solar wind density',
      'Fictional: solar particle event in progress, crew advised',
      'Fictional: geomagnetic activity normal, no alerts',
      'Fictional: solar wind conditions stable'
    ]},
    { indicator: 'equipment', values: [
      'Fictional: all systems nominal',
      'Fictional: minor maintenance completed on habitat thermal system',
      'Fictional: communications system performing normally',
      'Fictional: life support systems within parameters',
      'Fictional: research equipment calibration successful'
    ]},
    { indicator: 'gravity', values: [
      'Fictional: microgravity environment, all systems nominal',
      'Fictional: weightlessness adaptation progressing well',
      'Fictional: zero-g adaptation affecting sleep, monitoring',
      'Fictional: microgravity tolerance good, normal functions',
      'Fictional: adapting to continuous weightlessness'
    ]},
    { indicator: 'isolation', values: [
      'Fictional: psychological state good, no isolation concerns',
      'Fictional: maintaining crew morale, team activities ongoing',
      'Fictional: isolation factor manageable, communication maintained',
      'Fictional: no concerning psychological symptoms observed',
      'Fictional: crew cohesion strong, minimal isolation impact'
    ]},
    { indicator: 'procedures', values: [
      'Fictional: procedures followed per protocol',
      'Fictional: modified procedure due to equipment limitation',
      'Fictional: all safety procedures maintained',
      'Fictional: standard operational procedures in effect',
      'Fictional: procedures reviewed and validated'
    ]},
    { indicator: 'adherence', values: [
      'Fictional: full adherence to measurement schedule',
      'Fictional: 95% adherence, one missed check-in',
      'Fictional: excellent compliance with all tasks',
      'Fictional: adherence nominal, task schedule maintained',
      'Fictional: 100% adherence to countermeasure program'
    ]},
  ] as const;
  
  for (const item of textExamples) {
    const selectedValue = item.values[Math.floor(Math.random() * item.values.length)]!;
    values.push({ indicator: item.indicator, value: selectedValue, unit: '' });
  }
  const batch = crypto.randomUUID();
  const observations = values.map(({ indicator, value, unit }) => observationSchema.parse({
    id: `${workspace.id}/demo/${batch}/${indicator}`, seriesId: `${workspace.id}/demo/${batch}/${indicator}`,
    revision: 1, supersedes: null, indicator, value, unit, availability: 'recorded',
    observedAt: at, recordedAt: at, sourceId: 'synthetic-history', method: 'seed', origin: 'synthetic',
  }));
  const numericInputs = [
    { id: 'fluid', unit: 'mL', range: [800, 3000] as const },
    ...catalogInputs.filter(item => item.kind === 'number'),
  ] as const;
  for (const item of numericInputs) {
    const hasHistory = workspace.observations.some(observation =>
      observation.indicator === item.id && observation.availability === 'recorded'
      && typeof observation.value === 'number' && observation.observedAt.slice(0, 10) < at.slice(0, 10));
    if (hasHistory) continue;
    const [lower, upper] = item.range;
    const precision = upper - lower < 1 ? 2 : upper - lower <= 10 ? 1 : 0;
    for (let days = 7; days >= 1; days--) {
      const observedAt = new Date(Date.parse(at) - days * 24 * hour).toISOString();
      const id = `${workspace.id}/history/${item.id}/${observedAt}`;
      observations.push(observationSchema.parse({
        id, seriesId: id, revision: 1, supersedes: null, indicator: item.id,
        value: randomBetween(lower, upper, precision), unit: item.unit, availability: 'recorded',
        observedAt, recordedAt: at, sourceId: 'synthetic-history', method: 'seed', origin: 'synthetic',
      }));
    }
  }
  return observations;
}

export async function retrieveSensors(workspace: Workspace, signal: AbortSignal, failStrength = workspace.scenario === 'source-gap'): Promise<Retrieval> {
  signal.throwIfAborted();
  const at = clockOf(workspace);
  const bucket = Math.floor(Date.parse(at) / 60_000);
  const observedAt = workspace.mode === 'replay' ? new Date(bucket * 60_000).toISOString() : at;
  const base = (indicator: 'heartRate' | 'strength', value: number, unit: string): Observation => {
    const id = `${workspace.id}/sensor/${indicator}/${workspace.mode === 'replay' ? bucket : crypto.randomUUID()}`;
    return {
      id, seriesId: id, revision: 1, supersedes: null, indicator, value, unit, availability: 'recorded',
      observedAt, recordedAt: observedAt, sourceId: indicator === 'heartRate' ? 'heart-sensor' : 'strength-sensor',
      method: 'sensor', origin: 'synthetic',
    };
  };
  await Promise.resolve();
  signal.throwIfAborted();
  const priorHeart = numericManual(workspace, 'heartRate');
  let pulse = workspace.mode === 'replay' ? workspace.personaId === 'alex' ? 74 : 71 : randomBetween(55, 110);
  if (workspace.mode === 'standard' && pulse === priorHeart) pulse = pulse === 110 ? 109 : pulse + 1;
  const heart = base('heartRate', pulse, 'bpm');
  const strength = base('strength', workspace.mode === 'replay'
    ? workspace.scenario === 'recovery' ? 35.6 : 31.2
    : randomBetween(27, 44, 1), 'kgf');
  return {
    observations: failStrength ? [heart] : [heart, strength],
    sources: {
      heart: { status: 'retrieved', retrievedAt: at, error: null },
      strength: failStrength
        ? { ...workspace.sources.strength, status: 'failed', error: 'Assessment source is unavailable. Historical records retain their original times.' }
        : { status: 'retrieved', retrievedAt: at, error: null },
    },
  };
}

export function commitCheckIn(workspace: Workspace, input: CheckIn, retrieval: Retrieval, at = clockOf(workspace)): Workspace {
  const dailyReadings = workspace.mode === 'standard' ? generateDailyReadings(workspace, at) : [];
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
    ...workspace, observations: mergeObservations(workspace.observations, [...dailyReadings, ...retrieval.observations, ...records]),
    sources: retrieval.sources, fluidCoverageComplete: input.fluid !== null,
    tasks: workspace.tasks.map(task => {
      const assessmentRecorded = task.kind === 'assessment' && retrieval.observations.some(item =>
        item.indicator === 'strength' && item.availability === 'recorded'
        && Date.parse(item.observedAt) <= Date.parse(at)
        && Date.parse(item.observedAt) >= Date.parse(at) - 24 * hour);
      return task.status === 'pending' && (task.kind === 'checkin' || assessmentRecorded)
        ? { ...task, status: 'completed', respondedAt: at } : task;
    }),
    dataRevision: workspace.dataRevision + 1, updatedAt: at, evaluation: null,
  });
}
