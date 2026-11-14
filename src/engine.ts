import cql from 'cql-execution';
import elm from './Hecatron.elm.json' with { type: 'json' };
import manifest from './knowledge-manifest.json' with { type: 'json' };
import { z } from 'zod';
import { basicRanges, catalogById, catalogInputs } from './input-catalog.ts';
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
  if (workspace.engineFault) throw new Error('Scenario fault: the inference engine is intentionally unavailable. Use Restore engine in the replay controls and retry.');
  const sleep = latest(workspace, 'sleep');
  const strength = latest(workspace, 'strength');
  const fluid = latest(workspace, 'fluid');
  const fatigue = latest(workspace, 'fatigue');
  const mood = latest(workspace, 'mood');
  const bowel = latest(workspace, 'bowel');
  const assessment = workspace.tasks.find(task => task.kind === 'assessment');
  if (!assessment) throw new Error('The plan is missing its assessment task.');
  const duration = numeric(sleep);
  const illustrativeReadings = workspace.observations.flatMap(observation => {
    const item = catalogById.get(observation.indicator);
    const range = item?.range ?? basicRanges[observation.indicator];
    if (!range) return [];
    const value = numeric(observation);
    return value === null ? [] : [{
      Id: observation.id, Indicator: observation.indicator, IsCurrent: latest(workspace, observation.indicator)?.id === observation.id,
      Scope: item?.scope ?? 'basic', InputGroup: item?.group ?? '', ObservedAt: dateTime(observation.observedAt),
      Value: value, Lower: range[0], Upper: range[1],
    }];
  });
  const catalogEntries = catalogInputs.map(item => {
    const observation = latest(workspace, item.id);
    const present = observation?.availability === 'recorded';
    return {
      Id: item.id, Scope: item.scope, Kind: item.kind, Present: present,
      ObservedAt: present ? dateTime(observation.observedAt) : null,
    };
  });
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
    CheckInAt: observedAt(bowel),
    AbdominalDiscomfort: bowel?.availability === 'recorded' ? bowel.value === 'discomfort' : null,
    MoodLow: mood?.availability === 'recorded' ? mood.value === 'low' : null,
    AssessmentDueAt: dateTime(assessment.dueAt),
    AssessmentPending: assessment.status === 'pending',
    IllustrativeReadings: illustrativeReadings,
    CatalogInputs: catalogEntries,
  }).exec(new cql.PatientSource([]), dateTime(at));
  const { ReadingsBelowIllustrativeRange, ReadingsAboveIllustrativeRange, PhysiologyOutsideRange, WellbeingOutsideRange, MissionOutsideRange } = result.unfilteredResults;
  const listResults = new Set([
    'ReadingsBelowIllustrativeRange', 'ReadingsAboveIllustrativeRange',
    'RecordedCatalogInputs', 'MissingCatalogInputs', 'RecordedPersonalInputs', 'RecordedMissionInputs',
    'RecordedKnowledgeInputs', 'RecordedNumericInputs', 'RecordedTextInputs', 'RecentlyRecordedInputs', 'FutureDatedInputs',
    'FreshCurrentCatalogReadings', 'FreshCatalogBelowRange', 'FreshCatalogAboveRange', 'FreshCatalogOutsideRange',
    'PhysiologyOutsideRange', 'WellbeingOutsideRange', 'MissionOutsideRange',
  ]);
  const primitiveResults = Object.fromEntries(Object.entries(result.unfilteredResults).filter(([key]) => !listResults.has(key)));
  const below = z.array(z.string()).parse(ReadingsBelowIllustrativeRange);
  const above = z.array(z.string()).parse(ReadingsAboveIllustrativeRange);
  const values = evaluationSchema.shape.values.parse({
    ...primitiveResults,
    ...Object.fromEntries(below.map(id => [`IllustrativeBelow:${id}`, true])),
    ...Object.fromEntries(above.map(id => [`IllustrativeAbove:${id}`, true])),
  });
  function truth(name: string) {
    const value = values[name];
    if (value === null || typeof value === 'boolean') return value;
    throw new Error(`Unsupported or invalid CQL expression result: ${name}`);
  }
  const ratio = values['StrengthRatio'];
  if (ratio !== null && (typeof ratio !== 'number' || !Number.isFinite(ratio))) throw new Error('Invalid strength-ratio result.');
  const findings: Finding[] = [];
  function add(item: Finding) { findings.push(item); }
  const sleepProof = [proof('Recorded sleep', sleep), { label: 'Reference target', value: '8 h · reference plan v1', recordIds: [] }, proof('Perceived fatigue', fatigue)];
  if (truth('SleepBelowPlan') === true) {
    add({
      id: 'sleep-plan', title: truth('SleepAndFatigue') === true ? 'Make room for recovery' : 'Sleep differs from your plan',
      summary: truth('SleepAndFatigue') === true
        ? 'Recorded sleep is below the reference target, and fatigue was reported.'
        : 'Recorded sleep is below the 8-hour reference target. Fatigue may be absent or not shared.',
      level: 'review', region: 'whole', association: 'whole-person context', expression: 'SleepBelowPlan / SleepAndFatigue',
      evidenceId: 'sleep-plan', nextStep: 'Review your recorded sleep and planned rest opportunity. Follow your applicable mission plan.',
      limits: 'A plan difference is not a sleep disorder, a medication indication, or a fitness-for-duty decision.',
      private: false, proof: sleepProof,
    });
  } else if (truth('SleepBelowPlan') === null) {
    add({
      id: 'sleep-data', title: 'Sleep comparison unavailable', summary: 'A current sleep record is missing or outside the 24-hour freshness window.',
      level: 'gap', region: 'whole', association: 'whole-person context', expression: 'SleepFresh / SleepBelowPlan',
      evidenceId: 'sleep-plan', nextStep: 'Review the observation time or record a check-in when available.',
      limits: 'Missing data does not establish a healthy or unhealthy state.', private: false, proof: sleepProof,
    });
  }
  const strengthProof = [proof('Like-for-like handgrip assessment', strength), { label: 'Fixed reference baseline', value: '40 kgf · same assessment and method', recordIds: [] }];
  if (truth('StrengthBelowReference') === true) {
    add({
      id: 'strength-reference', title: 'Physical performance needs review',
      summary: `${Math.round(Number(ratio) * 100)}% of the fixed handgrip reference baseline; below the cited 80% strength-maintenance reference.`,
      level: 'review', region: 'arms', association: 'system association', expression: 'StrengthRatio / StrengthBelowReference',
      evidenceId: 'nasa-strength', nextStep: 'Review this assessment and the applicable countermeasure plan with authorized support.',
      limits: 'One handgrip result is not a measure of whole-body muscle health or permission to change exercise intensity.',
      private: false, proof: strengthProof,
    });
  } else if (truth('StrengthBelowReference') === null) {
    add({
      id: 'strength-data', title: 'A current assessment is needed',
      summary: 'No eligible handgrip result is available within the 24-hour assessment window.',
      level: 'gap', region: 'arms', association: 'system association', expression: 'StrengthFresh / StrengthRatio',
      evidenceId: 'nasa-strength', nextStep: 'Inspect the source status and historical result times. Only use an authorized assessment procedure.',
      limits: 'A failed source is a data limitation, not evidence of physical decline.', private: false, proof: strengthProof,
    });
  }
  if (truth('FluidLogIncomplete')) add({
    id: 'fluid-coverage', title: 'A current fluid entry is needed',
    summary: 'No recorded fluid amount is available within the current logging period.',
    level: 'gap', region: 'whole', association: 'whole-person context', expression: 'FluidLogIncomplete', evidenceId: 'daily-plan',
    nextStep: 'Review the recorded intake when convenient. Any intake instructions must come from an applicable personal plan.',
    limits: 'Recorded intake does not determine hydration status. No intake quantity or dehydration diagnosis is generated.',
    private: false, proof: [proof('Recorded intake', fluid)],
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
    id: 'private-context', title: 'Low mood and digestive discomfort reported',
    summary: 'Low mood and digestive discomfort were both reported in this check-in.',
    level: 'context', region: 'whole', association: 'whole-person context', expression: 'CombinedPrivateContext', evidenceId: 'context',
    nextStep: 'Review the linked private reports and prepare questions for appropriate support if wanted.',
    limits: 'Co-occurrence does not establish a cause, a deficiency, or a reason to start vitamin D or another treatment.',
    private: true, proof: [proof('Optional mood check-in', mood), proof('Optional digestive check-in', bowel)],
  });
  if (truth('AssessmentDue')) add({
    id: 'assessment-task', title: 'Assessment completion is not recorded',
    summary: 'A task in the measurement plan is due and still marked pending.',
    level: 'context', region: 'arms', association: 'system association', expression: 'AssessmentDue', evidenceId: 'daily-plan',
    nextStep: 'Review the existing task. Mark it complete only if the planned activity was actually performed.',
    limits: 'No completion record does not prove that the activity was missed or that the astronaut is unwell.',
    private: false, proof: [{ label: 'Assessment task', value: `Pending · due ${assessment.dueAt}`, recordIds: [] }],
  });
  const rangeGroups = [
    { id: 'physiology-demo-range', title: 'Physiology readings outside example ranges', expression: 'PhysiologyOutsideRange', ids: z.array(z.string()).parse(PhysiologyOutsideRange) },
    { id: 'wellbeing-demo-range', title: 'Wellbeing readings outside example ranges', expression: 'WellbeingOutsideRange', ids: z.array(z.string()).parse(WellbeingOutsideRange) },
    { id: 'mission-demo-range', title: 'Mission readings outside example ranges', expression: 'MissionOutsideRange', ids: z.array(z.string()).parse(MissionOutsideRange) },
  ];
  for (const group of rangeGroups) {
    if (!group.ids.length) continue;
    const records = group.ids.map(id => {
      const observation = workspace.observations.find(item => item.id === id);
      if (!observation) throw new Error(`CQL returned an unknown observation: ${id}`);
      const definition = catalogById.get(observation.indicator);
      if (!definition?.range) throw new Error(`CQL returned an observation without a catalog range: ${id}`);
      return { label: `${definition.label} · example range ${definition.range[0]}–${definition.range[1]} ${definition.unit}`, value: displayValue(observation), recordIds: [id] };
    });
    const sleepAndStress = group.id === 'wellbeing-demo-range' && truth('SleepBelowPlanAndStressAboveRange') === true;
    if (sleepAndStress) records.push(proof('Recorded sleep', sleep));
    add({
      id: group.id, title: group.title,
      summary: `${group.ids.length} current ${group.ids.length === 1 ? 'reading is' : 'readings are'} outside demonstration ranges.${sleepAndStress ? ' Recorded sleep is also below the example target; co-occurrence does not establish a cause.' : ''}`,
      level: 'review', region: 'whole', association: 'whole-person context',
      expression: sleepAndStress ? `${group.expression} / SleepBelowPlanAndStressAboveRange` : group.expression,
      evidenceId: 'demo-ranges', nextStep: 'Review the recorded values, timestamps, and applicable sources.',
      limits: 'These example ranges are not validated clinical or vehicle safety limits. A comparison is not a diagnosis or operational instruction.',
      private: true, proof: records,
    });
  }
  return evaluationSchema.parse({
    workspaceId: workspace.id, dataRevision: workspace.dataRevision, evaluatedAt: at,
    knowledgeVersion: `${manifest.library}@${manifest.version}`, sourceSha256: manifest.sourceSha256,
    values, findings,
  });
}
