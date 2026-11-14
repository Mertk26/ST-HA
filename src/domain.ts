import { z } from 'zod';

export const indicatorIds = ['heartRate', 'strength', 'sleep', 'fluid', 'fatigue', 'mood', 'bowel'] as const;
export type Indicator = typeof indicatorIds[number];
export const regionSchema = z.enum(['whole', 'arms', 'abdomen']);
export type Region = z.infer<typeof regionSchema>;
const time = z.iso.datetime({ offset: true });

export const observationSchema = z.object({
  id: z.string().min(1),
  seriesId: z.string().min(1),
  revision: z.number().int().positive(),
  supersedes: z.string().nullable(),
  indicator: z.enum(indicatorIds),
  value: z.union([z.number().finite(), z.boolean(), z.string()]).nullable(),
  unit: z.string(),
  availability: z.enum(['recorded', 'missing', 'declined']),
  observedAt: time,
  recordedAt: time,
  sourceId: z.enum(['heart-sensor', 'strength-sensor', 'manual-checkin', 'synthetic-history']),
  method: z.enum(['sensor', 'manual', 'seed']),
  origin: z.literal('synthetic'),
}).strict().superRefine((item, ctx) => {
  if (item.availability !== 'recorded') {
    if (item.value !== null) ctx.addIssue({ code: 'custom', message: 'Unavailable observations cannot contain a value.' });
    return;
  }
  const numeric = { heartRate: 'bpm', strength: 'kgf', sleep: 'h', fluid: 'mL' };
  if (item.indicator in numeric) {
    const unit = Object.entries(numeric).find(([key]) => key === item.indicator)?.[1];
    if (typeof item.value !== 'number' || item.value < 0 || item.unit !== unit) {
      ctx.addIssue({ code: 'custom', message: `Invalid value/unit for ${item.indicator}.` });
    }
    if (item.indicator === 'sleep' && typeof item.value === 'number' && item.value > 24) {
      ctx.addIssue({ code: 'custom', message: 'A daily sleep duration cannot exceed 24 hours.' });
    }
  } else if (item.indicator === 'fatigue') {
    if (typeof item.value !== 'boolean') ctx.addIssue({ code: 'custom', message: 'Fatigue must be a Boolean.' });
  } else if (item.indicator === 'mood') {
    if (item.value !== 'steady' && item.value !== 'low') ctx.addIssue({ code: 'custom', message: 'Unknown mood response.' });
  } else if (item.value !== 'none' && item.value !== 'discomfort') {
    ctx.addIssue({ code: 'custom', message: 'Unknown bowel response.' });
  }
});
export type Observation = z.infer<typeof observationSchema>;

const sourceSchema = z.object({
  status: z.enum(['not-started', 'retrieved', 'failed']),
  retrievedAt: time.nullable(),
  error: z.string().nullable(),
});
export const findingSchema = z.object({
  id: z.string(),
  title: z.string(),
  summary: z.string(),
  level: z.enum(['review', 'gap', 'context']),
  region: regionSchema,
  association: z.enum(['reported location', 'system association', 'whole-person context']),
  expression: z.string(),
  evidenceId: z.string(),
  nextStep: z.string(),
  limits: z.string(),
  private: z.boolean(),
  proof: z.array(z.object({ label: z.string(), value: z.string(), recordIds: z.array(z.string()) })),
});
export type Finding = z.infer<typeof findingSchema>;

export const evaluationSchema = z.object({
  workspaceId: z.string(),
  dataRevision: z.number().int().nonnegative(),
  evaluatedAt: time,
  knowledgeVersion: z.string(),
  sourceSha256: z.string(),
  values: z.record(z.string(), z.union([z.boolean(), z.number().finite()]).nullable()),
  findings: z.array(findingSchema),
});
export type Evaluation = z.infer<typeof evaluationSchema>;
export const taskSchema = z.object({
  id: z.string(),
  title: z.string(),
  detail: z.string(),
  dueAt: time,
  kind: z.enum(['assessment', 'movement', 'checkin']),
  status: z.enum(['pending', 'completed', 'skipped']),
  respondedAt: time.nullable(),
});
export type Task = z.infer<typeof taskSchema>;
const noticeSchema = z.object({
  id: z.string(),
  findingId: z.string(),
  title: z.string(),
  occurrence: z.number().int().positive(),
  createdAt: time,
  acknowledgedAt: time.nullable(),
  withdrawnAt: time.nullable(),
});
export const workspaceSchema = z.object({
  schemaVersion: z.literal(1),
  id: z.string(),
  personaId: z.enum(['alex', 'maya']),
  mode: z.enum(['standard', 'replay']),
  scenario: z.enum(['attention', 'recovery', 'source-gap', 'engine-fault']),
  clock: time.nullable(),
  revision: z.number().int().nonnegative(),
  dataRevision: z.number().int().nonnegative(),
  createdAt: time,
  updatedAt: time,
  figure: z.enum(['male', 'female']),
  autoRefresh: z.boolean(),
  nativeReminders: z.boolean(),
  fluidCoverageComplete: z.boolean(),
  engineFault: z.boolean(),
  sources: z.object({ heart: sourceSchema, strength: sourceSchema }),
  observations: z.array(observationSchema),
  tasks: z.array(taskSchema),
  notices: z.array(noticeSchema),
  evaluation: evaluationSchema.nullable(),
}).strict();
export type Workspace = z.infer<typeof workspaceSchema>;
export type PersonaId = Workspace['personaId'];
export type Scenario = Workspace['scenario'];

export const personas = [
  { id: 'alex', name: 'Alex Morgan', initials: 'AM', role: 'Mission specialist', assignment: 'Physiology & systems', figure: 'male' },
  { id: 'maya', name: 'Maya Chen', initials: 'MC', role: 'Flight engineer', assignment: 'Habitat & operations', figure: 'female' },
] as const;
export function persona(id: PersonaId) {
  return personas.find(item => item.id === id)!;
}

export const indicators: Record<Indicator, { label: string; unit: string }> = {
  heartRate: { label: 'Resting heart rate', unit: 'bpm' },
  strength: { label: 'Handgrip strength', unit: 'kgf' },
  sleep: { label: 'Sleep duration', unit: 'h' },
  fluid: { label: 'Recorded fluid intake', unit: 'mL' },
  fatigue: { label: 'Perceived fatigue', unit: '' },
  mood: { label: 'Private mood check-in', unit: '' },
  bowel: { label: 'Private digestive check-in', unit: '' },
};

export const evidence = [
  {
    id: 'nasa-strength', label: 'Maintaining physical performance', source: 'NASA-STD-3001 Vol. 1 Rev. C · V1 4024',
    url: 'https://www.nasa.gov/reference/4-0-human-performance/',
    summary: 'NASA requires maintaining in-mission skeletal muscle strength at or above 80% of baseline. This demo compares one synthetic, like-for-like handgrip assessment.',
    limits: 'One handgrip assessment cannot establish whole-body muscle health, prescribe exercise, or determine fitness for duty.',
  },
  {
    id: 'sleep-plan', label: 'Sleep, fatigue & mission schedules', source: 'NASA medical operations + fictional personal plan',
    url: 'https://www.nasa.gov/reference/6-0-medical-operations/',
    summary: 'NASA discusses protected sleep opportunity and avoiding critical tasks during sleep periods. Here, reported sleep is compared with a fictional 8-hour personal target.',
    limits: 'An 8-hour target and 24-hour freshness window are demo policies, not NASA diagnostic cutoffs. Sleep opportunity differs from measured sleep.',
  },
  {
    id: 'daily-plan', label: 'Daily routines & complete records', source: 'ST-HA synthetic plan v1',
    url: null,
    summary: 'Fictional tasks and record-coverage checks illustrate plan support. Completion, acknowledgement, and health outcomes are independent.',
    limits: 'No prescription, treatment selection, or missed-dose instructions are generated.',
  },
  {
    id: 'context', label: 'Looking at the whole person', source: 'NASA Human Research Program · research context',
    url: 'https://www.nasa.gov/hrp/risks/',
    summary: 'Spaceflight affects interacting physiological and behavioral systems. Timelines can help a person review co-occurring self-reports.',
    limits: 'Co-occurrence is not causation. Mood plus bowel changes does not diagnose a deficiency or justify starting supplements.',
  },
] as const;

export function latest(workspace: Workspace, indicator: Indicator): Observation | undefined {
  return workspace.observations.filter(item => item.indicator === indicator)
    .sort((a, b) => b.observedAt.localeCompare(a.observedAt) || b.revision - a.revision
      || b.recordedAt.localeCompare(a.recordedAt))[0];
}
export function numeric(item: Observation | undefined): number | null {
  return item?.availability === 'recorded' && typeof item.value === 'number' ? item.value : null;
}
export function displayValue(item: Observation | undefined): string {
  if (!item) return 'Not recorded';
  if (item.availability !== 'recorded') return item.availability === 'declined' ? 'Not shared' : 'Not recorded';
  if (typeof item.value === 'boolean') return item.value ? 'Reported' : 'Not reported';
  return `${item.value ?? '—'} ${item.unit === 'scale' || item.unit === 'boolean' ? '' : item.unit}`.trim();
}
export function clockOf(workspace: Workspace): string {
  return workspace.mode === 'replay' && workspace.clock ? workspace.clock : new Date().toISOString();
}
export function mergeObservations(previous: Observation[], incoming: Observation[]): Observation[] {
  const records = new Map(previous.map(item => [item.id, item]));
  for (const raw of incoming) {
    const item = observationSchema.parse(raw);
    const existing = records.get(item.id);
    if (existing && JSON.stringify(existing) !== JSON.stringify(item)) {
      throw new Error('A source record changed without a new revision/identity.');
    }
    records.set(item.id, item);
  }
  return [...records.values()];
}
export function attachEvaluation(workspace: Workspace, evaluation: Evaluation): Workspace {
  if (workspace.id !== evaluation.workspaceId || workspace.dataRevision !== evaluation.dataRevision) {
    throw new Error('Outdated analysis cannot replace the current snapshot.');
  }
  const ids = new Set(evaluation.findings.map(item => item.id));
  const notices = workspace.notices.map(item => ({
    ...item, withdrawnAt: !ids.has(item.findingId) && !item.withdrawnAt ? evaluation.evaluatedAt : item.withdrawnAt,
  }));
  for (const finding of evaluation.findings) {
    if (notices.some(item => item.findingId === finding.id && !item.withdrawnAt)) continue;
    const occurrence = 1 + Math.max(0, ...notices.filter(item => item.findingId === finding.id).map(item => item.occurrence));
    notices.push({
      id: `${workspace.id}/${finding.id}/${occurrence}`, findingId: finding.id, title: finding.title,
      occurrence, createdAt: evaluation.evaluatedAt, acknowledgedAt: null, withdrawnAt: null,
    });
  }
  return { ...workspace, evaluation, notices, updatedAt: evaluation.evaluatedAt };
}
export function updateTask(workspace: Workspace, id: string, status: Task['status'], at: string): Workspace {
  if (!workspace.tasks.some(item => item.id === id)) throw new Error('Unknown task.');
  return {
    ...workspace, dataRevision: workspace.dataRevision + 1,
    tasks: workspace.tasks.map(item => item.id === id
      ? { ...item, status, respondedAt: status === 'pending' ? null : at } : item),
  };
}

export function exportReport(workspace: Workspace, includePrivate: boolean) {
  const privateIndicators = new Set<Indicator>(['mood', 'bowel']);
  const findings = workspace.evaluation?.findings.filter(item => includePrivate || !item.private) ?? [];
  return {
    schemaVersion: 1, product: 'Space Tiger Health Assistant (ST-HA) synthetic demonstration', mode: workspace.mode,
    persona: persona(workspace.personaId).name, scope: workspace.id,
    dataRevision: workspace.dataRevision, exportedAt: new Date().toISOString(),
    evaluatedAt: workspace.evaluation?.evaluatedAt ?? null,
    knowledgeVersion: workspace.evaluation?.knowledgeVersion ?? null,
    sourceSha256: workspace.evaluation?.sourceSha256 ?? null,
    includesPrivateCheckIns: includePrivate,
    observations: workspace.observations.filter(item => includePrivate || !privateIndicators.has(item.indicator)),
    findings, tasks: workspace.tasks,
    limitations: 'Synthetic data. Not a diagnosis, clinical record, or evidence that a report was delivered.',
  };
}
