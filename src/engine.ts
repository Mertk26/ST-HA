import cql from 'cql-execution';
import elm from './Hecatron.elm.json' with { type: 'json' };
import manifest from './knowledge-manifest.json' with { type: 'json' };
import {
  displayValue, evaluationSchema, latest, numeric,
  type Evaluation, type Finding, type Observation, type Workspace,
} from './domain.ts';

function dateTime(value: string) {
  const parsed = cql.DateTime.parse(value);
  if (!parsed || !parsed.toLuxonDateTime().isValid) throw new Error('Analysis requires valid, offset-aware timestamps.');
  return parsed;
}
function observedAt(item: Observation | undefined) {
  return item?.availability === 'recorded' ? dateTime(item.observedAt) : null;
}
function proof(label: string, item: Observation | undefined): Finding['proof'][number] {
  return { label, value: displayValue(item), recordIds: item ? [item.id] : [] };
}
export async function evaluate(workspace: Workspace, at: string): Promise<Evaluation> {
  if (workspace.engineFault) throw new Error('Scenario fault: the inference engine is intentionally unavailable. Restore it in Scenario Lab and retry.');
  const sleep = latest(workspace, 'sleep');
  const strength = latest(workspace, 'strength');
  const fluid = latest(workspace, 'fluid');
  const fatigue = latest(workspace, 'fatigue');
  const mood = latest(workspace, 'mood');
  const bowel = latest(workspace, 'bowel');
  const assessment = workspace.tasks.find(task => task.kind === 'assessment');
  if (!assessment) throw new Error('The fictional plan is missing its assessment task.');
  const duration = numeric(sleep);
  const result = await new cql.Executor(new cql.Library(elm), undefined, {
    EvaluationTime: dateTime(at),
    SleepAt: observedAt(sleep),
    SleepDuration: duration === null ? null : new cql.Quantity(duration, 'h'),
    SleepTarget: new cql.Quantity(8, 'h'),
    Fatigue: fatigue?.availability === 'recorded' ? fatigue.value : null,
    StrengthAt: observedAt(strength),
    CurrentStrength: numeric(strength),
    BaselineStrength: 40,
    FluidAt: observedAt(fluid),
    FluidCoverageComplete: workspace.fluidCoverageComplete && numeric(fluid) !== null,
    CheckInAt: observedAt(bowel),
    AbdominalDiscomfort: bowel?.availability === 'recorded' ? bowel.value === 'discomfort' : null,
    MoodLow: mood?.availability === 'recorded' ? mood.value === 'low' : null,
    AssessmentDueAt: dateTime(assessment.dueAt),
    AssessmentPending: assessment.status === 'pending',
  }).exec(new cql.PatientSource([]), dateTime(at));
  const values = evaluationSchema.shape.values.parse(result.unfilteredResults);
  function truth(name: string) {
    const value = values[name];
    if (value === null || typeof value === 'boolean') return value;
    throw new Error(`Unsupported or invalid CQL expression result: ${name}`);
  }
  const ratio = values['StrengthRatio'];
  if (ratio !== null && (typeof ratio !== 'number' || !Number.isFinite(ratio))) throw new Error('Invalid strength-ratio result.');
  const findings: Finding[] = [];
  function add(item: Finding) { findings.push(item); }
  const sleepProof = [proof('Recorded sleep', sleep), { label: 'Fictional plan target', value: '8 h · individual demo plan v1', recordIds: [] }, proof('Perceived fatigue', fatigue)];
  if (truth('SleepBelowPlan') === true) {
    add({
      id: 'sleep-plan', title: truth('SleepAndFatigue') === true ? 'Make room for recovery' : 'Sleep differs from your plan',
      summary: truth('SleepAndFatigue') === true
        ? 'Your recorded sleep is below the fictional plan, and you reported fatigue.'
        : 'Recorded sleep is below the fictional 8-hour target. Fatigue may be absent or not shared.',
      level: 'review', region: 'whole', association: 'whole-person context', expression: 'SleepBelowPlan / SleepAndFatigue',
      evidenceId: 'sleep-plan', nextStep: 'Review your recorded sleep and planned rest opportunity. Follow your applicable mission plan.',
      limits: 'A plan difference is not a sleep disorder, a medication indication, or a fitness-for-duty decision.',
      private: false, proof: sleepProof,
    });
  } else if (truth('SleepBelowPlan') === null) {
    add({
      id: 'sleep-data', title: 'Sleep comparison unavailable', summary: 'A current sleep record is missing or outside the demo 24-hour freshness window.',
      level: 'gap', region: 'whole', association: 'whole-person context', expression: 'SleepFresh / SleepBelowPlan',
      evidenceId: 'sleep-plan', nextStep: 'Review the observation time or record a synthetic check-in when available.',
      limits: 'Missing data does not establish a healthy or unhealthy state.', private: false, proof: sleepProof,
    });
  }
  const strengthProof = [proof('Like-for-like handgrip assessment', strength), { label: 'Fictional pre-mission baseline', value: '40 kgf · same test and method', recordIds: [] }];
  if (truth('StrengthBelowReference') === true) {
    add({
      id: 'strength-reference', title: 'Physical performance needs review',
      summary: `${Math.round(Number(ratio) * 100)}% of the fictional handgrip baseline; below the cited 80% strength-maintenance reference.`,
      level: 'review', region: 'arms', association: 'system association', expression: 'StrengthRatio / StrengthBelowReference',
      evidenceId: 'nasa-strength', nextStep: 'Review this assessment and the applicable countermeasure plan with authorized support.',
      limits: 'One synthetic handgrip result is not a measure of whole-body muscle health or permission to change exercise intensity.',
      private: false, proof: strengthProof,
    });
  } else if (truth('StrengthBelowReference') === null) {
    add({
      id: 'strength-data', title: 'A current assessment is needed',
      summary: 'No eligible handgrip result is available within the demo 24-hour assessment window.',
      level: 'gap', region: 'arms', association: 'system association', expression: 'StrengthFresh / StrengthRatio',
      evidenceId: 'nasa-strength', nextStep: 'Inspect the source status and historical result times. Only use an authorized assessment procedure.',
      limits: 'A failed source is a data limitation, not evidence of physical decline.', private: false, proof: strengthProof,
    });
  }
  if (truth('FluidLogIncomplete')) add({
    id: 'fluid-coverage', title: 'Your fluid log is incomplete',
    summary: 'Recorded amounts do not cover a complete current logging period.',
    level: 'gap', region: 'whole', association: 'whole-person context', expression: 'FluidLogIncomplete', evidenceId: 'daily-plan',
    nextStep: 'Review the log and its coverage when convenient. Any intake instructions must come from an applicable personal plan.',
    limits: 'Recorded intake does not determine hydration status. No intake quantity or dehydration diagnosis is generated.',
    private: false, proof: [proof('Recorded intake', fluid), { label: 'Coverage confirmed by user', value: String(workspace.fluidCoverageComplete), recordIds: [] }],
  });
  if (truth('AbdominalReport')) add({
    id: 'abdominal-report', title: 'Digestive changes you reported',
    summary: 'Your optional check-in records abdominal or bowel discomfort.',
    level: 'context', region: 'abdomen', association: 'reported location', expression: 'AbdominalReport', evidenceId: 'context',
    nextStep: 'Review your timeline and any applicable, authorized follow-up instructions. Correct the record if needed.',
    limits: 'A self-report is not a diagnosis or a laboratory/stool biomarker result.',
    private: true, proof: [proof('Optional digestive check-in', bowel)],
  });
  if (truth('CombinedPrivateContext')) add({
    id: 'private-context', title: 'See the bigger picture',
    summary: 'Low mood and digestive discomfort were both reported in this check-in.',
    level: 'context', region: 'whole', association: 'whole-person context', expression: 'CombinedPrivateContext', evidenceId: 'context',
    nextStep: 'Review the linked private reports and prepare questions for appropriate support if wanted.',
    limits: 'Co-occurrence does not establish a cause, a deficiency, or a reason to start vitamin D or another treatment.',
    private: true, proof: [proof('Optional mood check-in', mood), proof('Optional digestive check-in', bowel)],
  });
  if (truth('AssessmentDue')) add({
    id: 'assessment-task', title: 'Assessment completion is not recorded',
    summary: 'A task in the fictional measurement plan is due and still marked pending.',
    level: 'context', region: 'arms', association: 'system association', expression: 'AssessmentDue', evidenceId: 'daily-plan',
    nextStep: 'Review the existing task. Mark it complete only if the planned activity was actually performed.',
    limits: 'No completion record does not prove that the activity was missed or that the astronaut is unwell.',
    private: false, proof: [{ label: 'Fictional assessment task', value: `Pending · due ${assessment.dueAt}`, recordIds: [] }],
  });
  return evaluationSchema.parse({
    workspaceId: workspace.id, dataRevision: workspace.dataRevision, evaluatedAt: at,
    knowledgeVersion: `${manifest.library}@${manifest.version}`, sourceSha256: manifest.sourceSha256,
    values, findings,
  });
}
