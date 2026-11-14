export type InputScope = 'personal' | 'mission' | 'knowledge';
export interface CatalogInput {
  id: string;
  label: string;
  group: string;
  scope: InputScope;
  kind: 'number' | 'text';
  unit: string;
  range?: readonly [number, number];
}

// Ranges are illustrative comparisons for fictional data, not medical or safety limits.
export const catalogInputs = [
  { id: 'crewAssignment', label: 'Identity and assignment', group: 'Astronaut & baseline', scope: 'personal', kind: 'text', unit: '' },
  { id: 'baselineContext', label: 'Individual baseline and method', group: 'Astronaut & baseline', scope: 'personal', kind: 'text', unit: '' },
  { id: 'medicalContext', label: 'Relevant medical context', group: 'Astronaut & baseline', scope: 'personal', kind: 'text', unit: '' },
  { id: 'individualPlan', label: 'Individual plan', group: 'Astronaut & baseline', scope: 'personal', kind: 'text', unit: '' },
  { id: 'accessibilityPreferences', label: 'Preferences and accessibility', group: 'Astronaut & baseline', scope: 'personal', kind: 'text', unit: '' },
  { id: 'systolicPressure', label: 'Systolic blood pressure', group: 'Physiology & medical', scope: 'personal', kind: 'number', unit: 'mmHg', range: [90, 120] },
  { id: 'diastolicPressure', label: 'Diastolic blood pressure', group: 'Physiology & medical', scope: 'personal', kind: 'number', unit: 'mmHg', range: [60, 80] },
  { id: 'bodyTemperature', label: 'Body temperature', group: 'Physiology & medical', scope: 'personal', kind: 'number', unit: '°C', range: [36, 37.5] },
  { id: 'bloodGlucose', label: 'Blood glucose', group: 'Physiology & medical', scope: 'personal', kind: 'number', unit: 'mg/dL', range: [70, 100] },
  { id: 'oxygenSaturation', label: 'Oxygen saturation', group: 'Physiology & medical', scope: 'personal', kind: 'number', unit: '%', range: [95, 100] },
  { id: 'respiratoryRate', label: 'Respiratory rate', group: 'Physiology & medical', scope: 'personal', kind: 'number', unit: 'breaths/min', range: [12, 20] },
  { id: 'symptoms', label: 'Symptoms and functional changes', group: 'Physiology & medical', scope: 'personal', kind: 'text', unit: '' },
  { id: 'vision', label: 'Eye and vision observations', group: 'Physiology & medical', scope: 'personal', kind: 'text', unit: '' },
  { id: 'balance', label: 'Balance, motion sickness and coordination', group: 'Physiology & medical', scope: 'personal', kind: 'text', unit: '' },
  { id: 'aerobicCapacity', label: 'Aerobic capacity', group: 'Physiology & medical', scope: 'personal', kind: 'number', unit: 'mL/kg/min', range: [30, 60] },
  { id: 'imaging', label: 'Imaging and exam reference', group: 'Physiology & medical', scope: 'personal', kind: 'text', unit: '' },
  { id: 'biomarkers', label: 'Lab and biomarker result', group: 'Physiology & medical', scope: 'personal', kind: 'text', unit: '' },
  { id: 'bodyMass', label: 'Body mass', group: 'Physiology & medical', scope: 'personal', kind: 'number', unit: 'kg', range: [50, 100] },
  { id: 'bodyComposition', label: 'Bone and body composition assessment', group: 'Physiology & medical', scope: 'personal', kind: 'text', unit: '' },
  { id: 'interventions', label: 'Medication, supplement and intervention log', group: 'Physiology & medical', scope: 'personal', kind: 'text', unit: '' },
  { id: 'sleepQuality', label: 'Sleep quality and interruptions', group: 'Daily life & wellbeing', scope: 'personal', kind: 'text', unit: '' },
  { id: 'stress', label: 'Perceived stress', group: 'Daily life & wellbeing', scope: 'personal', kind: 'number', unit: '/10', range: [0, 4] },
  { id: 'cognition', label: 'Cognition and attention assessment', group: 'Daily life & wellbeing', scope: 'personal', kind: 'text', unit: '' },
  { id: 'workload', label: 'Workload and schedule', group: 'Daily life & wellbeing', scope: 'personal', kind: 'text', unit: '' },
  { id: 'exerciseDuration', label: 'Exercise duration', group: 'Daily life & wellbeing', scope: 'personal', kind: 'number', unit: 'min', range: [30, 120] },
  { id: 'exerciseContext', label: 'Activity and exercise context', group: 'Daily life & wellbeing', scope: 'personal', kind: 'text', unit: '' },
  { id: 'nutrition', label: 'Food and nutrition', group: 'Daily life & wellbeing', scope: 'personal', kind: 'text', unit: '' },
  { id: 'hydrationSymptoms', label: 'Hydration-related symptoms', group: 'Daily life & wellbeing', scope: 'personal', kind: 'text', unit: '' },
  { id: 'socialContext', label: 'Social connection and crew interaction', group: 'Daily life & wellbeing', scope: 'personal', kind: 'text', unit: '' },
  { id: 'adherence', label: 'Measurement and task adherence', group: 'Daily life & wellbeing', scope: 'personal', kind: 'text', unit: '' },
  { id: 'missionPhase', label: 'Mission phase and location', group: 'Mission & environment', scope: 'mission', kind: 'text', unit: '' },
  { id: 'gravity', label: 'Gravity and transitions', group: 'Mission & environment', scope: 'mission', kind: 'text', unit: '' },
  { id: 'isolation', label: 'Isolation and confinement', group: 'Mission & environment', scope: 'mission', kind: 'text', unit: '' },
  { id: 'communications', label: 'Communication and support availability', group: 'Mission & environment', scope: 'mission', kind: 'text', unit: '' },
  { id: 'personalRadiation', label: 'Personal radiation exposure', group: 'Mission & environment', scope: 'personal', kind: 'number', unit: 'mSv/day', range: [0.1, 0.3] },
  { id: 'environmentalRadiation', label: 'Environmental radiation and neutron monitoring', group: 'Mission & environment', scope: 'mission', kind: 'number', unit: 'mSv/day', range: [0.2, 0.5] },
  { id: 'spaceWeather', label: 'Space-weather events', group: 'Mission & environment', scope: 'mission', kind: 'text', unit: '' },
  { id: 'cabinTemperature', label: 'Cabin temperature', group: 'Mission & environment', scope: 'mission', kind: 'number', unit: '°C', range: [18, 26] },
  { id: 'cabinPressure', label: 'Cabin pressure', group: 'Mission & environment', scope: 'mission', kind: 'number', unit: 'kPa', range: [95, 105] },
  { id: 'cabinOxygen', label: 'Cabin oxygen', group: 'Mission & environment', scope: 'mission', kind: 'number', unit: '%', range: [19, 23] },
  { id: 'cabinCarbonDioxide', label: 'Cabin carbon dioxide', group: 'Mission & environment', scope: 'mission', kind: 'number', unit: 'ppm', range: [400, 2000] },
  { id: 'cabinHumidity', label: 'Cabin relative humidity', group: 'Mission & environment', scope: 'mission', kind: 'number', unit: '%', range: [30, 60] },
  { id: 'lightNoise', label: 'Light, noise and habitability', group: 'Mission & environment', scope: 'mission', kind: 'text', unit: '' },
  { id: 'environmentalSamples', label: 'Microbial and environmental observations', group: 'Mission & environment', scope: 'mission', kind: 'text', unit: '' },
  { id: 'spacewalk', label: 'Spacewalk and suit context', group: 'Mission & environment', scope: 'mission', kind: 'text', unit: '' },
  { id: 'equipment', label: 'Equipment, supplies and support', group: 'Mission & environment', scope: 'mission', kind: 'text', unit: '' },
  { id: 'scientificEvidence', label: 'Scientific evidence', group: 'Knowledge & interaction', scope: 'knowledge', kind: 'text', unit: '' },
  { id: 'procedures', label: 'Procedures and guidance', group: 'Knowledge & interaction', scope: 'knowledge', kind: 'text', unit: '' },
  { id: 'definitions', label: 'Definitions and rules', group: 'Knowledge & interaction', scope: 'knowledge', kind: 'text', unit: '' },
  { id: 'reminderConfiguration', label: 'Alert and reminder configuration', group: 'Knowledge & interaction', scope: 'knowledge', kind: 'text', unit: '' },
  { id: 'userFeedback', label: 'User actions and feedback', group: 'Knowledge & interaction', scope: 'knowledge', kind: 'text', unit: '' },
  { id: 'consent', label: 'Consent and access preferences', group: 'Knowledge & interaction', scope: 'knowledge', kind: 'text', unit: '' },
  { id: 'deviceState', label: 'Device and source state', group: 'Knowledge & interaction', scope: 'knowledge', kind: 'text', unit: '' },
] as const satisfies readonly CatalogInput[];

export type CatalogIndicator = typeof catalogInputs[number]['id'];
export const catalogById: ReadonlyMap<string, CatalogInput> = new Map(catalogInputs.map(input => [input.id, input]));
export const basicRanges: Readonly<Record<string, readonly [number, number]>> = {
  heartRate: [60, 100],
  strength: [32, 48],
  sleep: [7, 9],
  fluid: [0, 5000],
};
