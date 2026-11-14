library Hecatron version '0.1.0'

parameter EvaluationTime DateTime
parameter SleepAt DateTime
parameter SleepDuration Quantity
parameter SleepTarget Quantity
parameter Fatigue Boolean
parameter StrengthAt DateTime
parameter CurrentStrength Decimal
parameter BaselineStrength Decimal
parameter AbdominalDiscomfort Boolean
parameter MoodLow Boolean
parameter CheckInAt DateTime
parameter FluidAt DateTime
parameter AssessmentDueAt DateTime
parameter AssessmentPending Boolean
parameter IllustrativeReadings List<Tuple { Id String, Indicator String, IsCurrent Boolean, Scope String, InputGroup String, ObservedAt DateTime, Value Decimal, Lower Decimal, Upper Decimal }>
parameter CatalogInputs List<Tuple { Id String, Scope String, Kind String, Present Boolean, ObservedAt DateTime }>

context Unfiltered

define SleepFresh:
  SleepAt is not null and SleepAt in Interval[EvaluationTime - 24 hours, EvaluationTime]
define SleepBelowPlan:
  if SleepFresh then SleepDuration < SleepTarget else null as Boolean
define SleepAndFatigue:
  SleepBelowPlan and Fatigue
define StrengthFresh:
  StrengthAt is not null and StrengthAt in Interval[EvaluationTime - 24 hours, EvaluationTime]
define StrengthRatio:
  if StrengthFresh and BaselineStrength > 0.0 then CurrentStrength / BaselineStrength else null as Decimal
define StrengthBelowReference:
  if StrengthRatio is not null then StrengthRatio < 0.8 else null as Boolean
define FluidLogIncomplete:
  if FluidAt is null then true
  else not (FluidAt in Interval[EvaluationTime - 24 hours, EvaluationTime])
define CheckInFresh:
  CheckInAt is not null and CheckInAt in Interval[EvaluationTime - 24 hours, EvaluationTime]
define AbdominalReport:
  if CheckInFresh then AbdominalDiscomfort else null as Boolean
define CombinedPrivateContext:
  if CheckInFresh then MoodLow and AbdominalDiscomfort else null as Boolean
define AssessmentDue:
  AssessmentDueAt <= EvaluationTime and AssessmentPending

// Illustrative comparisons only. These are not clinical or vehicle safety limits.
define ReadingsBelowIllustrativeRange:
  IllustrativeReadings R where R.Value < R.Lower return R.Id
define ReadingsAboveIllustrativeRange:
  IllustrativeReadings R where R.Value > R.Upper return R.Id
define IllustrativeReadingCount:
  Count(IllustrativeReadings)
define ReadingsOutsideIllustrativeRangeCount:
  Count(ReadingsBelowIllustrativeRange) + Count(ReadingsAboveIllustrativeRange)

define function LatestBelowIllustrativeRange(indicator String):
  if exists (IllustrativeReadings R where R.Indicator = indicator and R.IsCurrent)
  then exists (IllustrativeReadings R where R.Indicator = indicator and R.IsCurrent and R.Value < R.Lower)
  else null as Boolean

define function LatestAboveIllustrativeRange(indicator String):
  if exists (IllustrativeReadings R where R.Indicator = indicator and R.IsCurrent)
  then exists (IllustrativeReadings R where R.Indicator = indicator and R.IsCurrent and R.Value > R.Upper)
  else null as Boolean

define HeartRateBelowExample: LatestBelowIllustrativeRange('heartRate')
define HeartRateAboveExample: LatestAboveIllustrativeRange('heartRate')
define StrengthBelowExample: LatestBelowIllustrativeRange('strength')
define StrengthAboveExample: LatestAboveIllustrativeRange('strength')
define SleepBelowExample: LatestBelowIllustrativeRange('sleep')
define SleepAboveExample: LatestAboveIllustrativeRange('sleep')
define FluidBelowExample: LatestBelowIllustrativeRange('fluid')
define FluidAboveExample: LatestAboveIllustrativeRange('fluid')
define SystolicBelowExample: LatestBelowIllustrativeRange('systolicPressure')
define SystolicAboveExample: LatestAboveIllustrativeRange('systolicPressure')
define DiastolicBelowExample: LatestBelowIllustrativeRange('diastolicPressure')
define DiastolicAboveExample: LatestAboveIllustrativeRange('diastolicPressure')
define TemperatureBelowExample: LatestBelowIllustrativeRange('bodyTemperature')
define TemperatureAboveExample: LatestAboveIllustrativeRange('bodyTemperature')
define GlucoseBelowExample: LatestBelowIllustrativeRange('bloodGlucose')
define GlucoseAboveExample: LatestAboveIllustrativeRange('bloodGlucose')
define OxygenBelowExample: LatestBelowIllustrativeRange('oxygenSaturation')
define OxygenAboveExample: LatestAboveIllustrativeRange('oxygenSaturation')
define BreathingBelowExample: LatestBelowIllustrativeRange('respiratoryRate')
define BreathingAboveExample: LatestAboveIllustrativeRange('respiratoryRate')
define AerobicCapacityBelowExample: LatestBelowIllustrativeRange('aerobicCapacity')
define AerobicCapacityAboveExample: LatestAboveIllustrativeRange('aerobicCapacity')
define BodyMassBelowExample: LatestBelowIllustrativeRange('bodyMass')
define BodyMassAboveExample: LatestAboveIllustrativeRange('bodyMass')
define StressBelowExample: LatestBelowIllustrativeRange('stress')
define StressAboveExample: LatestAboveIllustrativeRange('stress')
define ExerciseDurationBelowExample: LatestBelowIllustrativeRange('exerciseDuration')
define ExerciseDurationAboveExample: LatestAboveIllustrativeRange('exerciseDuration')
define CabinTemperatureBelowExample: LatestBelowIllustrativeRange('cabinTemperature')
define CabinTemperatureAboveExample: LatestAboveIllustrativeRange('cabinTemperature')
define CabinPressureBelowExample: LatestBelowIllustrativeRange('cabinPressure')
define CabinPressureAboveExample: LatestAboveIllustrativeRange('cabinPressure')
define CabinOxygenBelowExample: LatestBelowIllustrativeRange('cabinOxygen')
define CabinOxygenAboveExample: LatestAboveIllustrativeRange('cabinOxygen')
define CabinCarbonDioxideBelowExample: LatestBelowIllustrativeRange('cabinCarbonDioxide')
define CabinCarbonDioxideAboveExample: LatestAboveIllustrativeRange('cabinCarbonDioxide')
define CabinHumidityBelowExample: LatestBelowIllustrativeRange('cabinHumidity')
define CabinHumidityAboveExample: LatestAboveIllustrativeRange('cabinHumidity')

// Only the latest eligible catalog readings contribute to these dashboard summaries.
define FreshCurrentCatalogReadings:
  IllustrativeReadings R
    where R.IsCurrent
      and R.Scope != 'basic'
      and R.ObservedAt in Interval[EvaluationTime - 24 hours, EvaluationTime]
define FreshCatalogBelowRange:
  FreshCurrentCatalogReadings R where R.Value < R.Lower
define FreshCatalogAboveRange:
  FreshCurrentCatalogReadings R where R.Value > R.Upper
define FreshCatalogOutsideRange:
  FreshCurrentCatalogReadings R where R.Value < R.Lower or R.Value > R.Upper
define PhysiologyOutsideRange:
  FreshCatalogOutsideRange R where R.InputGroup = 'Physiology & medical' return R.Id
define WellbeingOutsideRange:
  FreshCatalogOutsideRange R where R.InputGroup = 'Daily life & wellbeing' return R.Id
define MissionOutsideRange:
  FreshCatalogOutsideRange R where R.Scope = 'mission' return R.Id
define FreshCatalogRangeCount:
  Count(FreshCurrentCatalogReadings)
define FreshCatalogBelowRangeCount:
  Count(FreshCatalogBelowRange)
define FreshCatalogAboveRangeCount:
  Count(FreshCatalogAboveRange)
define PhysiologyOutsideRangeCount:
  Count(PhysiologyOutsideRange)
define WellbeingOutsideRangeCount:
  Count(WellbeingOutsideRange)
define MissionOutsideRangeCount:
  Count(MissionOutsideRange)

define FreshSystolicAvailable:
  exists (FreshCurrentCatalogReadings R where R.Indicator = 'systolicPressure')
define FreshDiastolicAvailable:
  exists (FreshCurrentCatalogReadings R where R.Indicator = 'diastolicPressure')
define FreshBloodPressurePairAvailable:
  FreshSystolicAvailable and FreshDiastolicAvailable
define BloodPressurePairOutsideRange:
  if FreshBloodPressurePairAvailable then
    exists (FreshCatalogOutsideRange R where R.Indicator = 'systolicPressure' or R.Indicator = 'diastolicPressure')
  else null as Boolean
define FreshStressAvailable:
  exists (FreshCurrentCatalogReadings R where R.Indicator = 'stress')
define StressAboveRange:
  if FreshStressAvailable then
    exists (FreshCatalogAboveRange R where R.Indicator = 'stress')
  else null as Boolean
define SleepBelowPlanAndStressAboveRange:
  SleepBelowPlan and StressAboveRange
define FreshCabinAtmosphereAvailable:
  exists (FreshCurrentCatalogReadings R where R.Indicator = 'cabinOxygen' or R.Indicator = 'cabinCarbonDioxide' or R.Indicator = 'cabinPressure')
define CabinAtmosphereOutsideRange:
  if FreshCabinAtmosphereAvailable then
    exists (FreshCatalogOutsideRange R where R.Indicator = 'cabinOxygen' or R.Indicator = 'cabinCarbonDioxide' or R.Indicator = 'cabinPressure')
  else null as Boolean

// Radiation monitoring inference rules
define FreshRadiationAvailable:
  exists (FreshCurrentCatalogReadings R where R.Indicator = 'personalRadiation' or R.Indicator = 'environmentalRadiation')
define PersonalRadiationAboveRange:
  if exists (FreshCurrentCatalogReadings R where R.Indicator = 'personalRadiation')
  then exists (FreshCatalogAboveRange R where R.Indicator = 'personalRadiation')
  else null as Boolean
define EnvironmentalRadiationAboveRange:
  if exists (FreshCurrentCatalogReadings R where R.Indicator = 'environmentalRadiation')
  then exists (FreshCatalogAboveRange R where R.Indicator = 'environmentalRadiation')
  else null as Boolean
define RadiationWarningRequired:
  (PersonalRadiationAboveRange is true) or (EnvironmentalRadiationAboveRange is true)

// Space weather and environmental threat assessment
define SpaceWeatherAvailable:
  exists (FreshCurrentCatalogReadings R where R.Indicator = 'spaceWeather')
define CabinHumidityAboveRange:
  if exists (FreshCurrentCatalogReadings R where R.Indicator = 'cabinHumidity')
  then exists (FreshCatalogAboveRange R where R.Indicator = 'cabinHumidity')
  else null as Boolean
define CabinHumidityBelowRange:
  if exists (FreshCurrentCatalogReadings R where R.Indicator = 'cabinHumidity')
  then exists (FreshCatalogBelowRange R where R.Indicator = 'cabinHumidity')
  else null as Boolean
define EnvironmentalThreatsPresent:
  CabinAtmosphereOutsideRange is true or CabinHumidityAboveRange is true or CabinHumidityBelowRange is true

// Compound physiological stress indicators
define CardiovascularStressIndicators:
  (HeartRateAboveExample is true or SystolicAboveExample is true or DiastolicAboveExample is true)
define RespiratoryCompromise:
  BreathingAboveExample is true or OxygenBelowExample is true
define CardiopulmonaryStress:
  CardiovascularStressIndicators and RespiratoryCompromise
define TemperatureDeviation:
  TemperatureBelowExample is true or TemperatureAboveExample is true
define MetabolicStress:
  GlucoseBelowExample is true or GlucoseAboveExample is true

// Sleep and recovery assessment
define InsomniaSuspected:
  SleepBelowExample is true and RecentlyRecordedInputs is not null
define SleepRecoveryOptimal:
  SleepAboveExample is false and SleepBelowExample is false
define DeepRecoveryNeeded:
  (SleepBelowPlan is true or CardiovascularStressIndicators is true) and StressAboveRange is true

// Movement and deconditioning risk
define MovementCapacityCompromised:
  StrengthBelowExample is true and StrengthRatio is not null
define DeconitioningRisk:
  StrengthBelowExample is true and (HeartRateAboveExample is true or OxygenBelowExample is true)
define AerobicFitnessAtRisk:
  AerobicCapacityBelowExample is true or ExerciseDurationBelowExample is true

// Hydration and fluid balance
define HydrationStatus:
  FluidBelowExample is false
define DehydrationRisk:
  FluidBelowExample is true or FluidLogIncomplete is true
define FluidOverloadRisk:
  FluidAboveExample is true and (BodyMassAboveExample is true or CabinHumidityAboveRange is true)

// Psychological and cognitive assessment
define PsychologicalDistress:
  MoodLow is true and StressAboveRange is true
define CognitiveLoadHigh:
  StressAboveRange is true and ExerciseDurationAboveExample is true
define IsolationRisk:
  MoodLow is true and RecentlyRecordedInputCount < RecordedPersonalInputCount

// Integrated health status summary
define HealthConcernCount:
  (if PersonalRadiationAboveRange is true then 1 else 0)
  + (if EnvironmentalRadiationAboveRange is true then 1 else 0)
  + (if CardiopulmonaryStress is true then 1 else 0)
  + (if TemperatureDeviation is true then 1 else 1)
  + (if DehydrationRisk is true then 1 else 0)
  + (if PsychologicalDistress is true then 1 else 0)
define HealthStatusCritical:
  HealthConcernCount >= 3
define HealthStatusWarning:
  HealthConcernCount >= 2

// Scope and data-availability summaries do not infer diagnoses or exposure.
define RecordedCatalogInputs:
  CatalogInputs I where I.Present
define MissingCatalogInputs:
  CatalogInputs I where not I.Present
define RecordedPersonalInputs:
  RecordedCatalogInputs I where I.Scope = 'personal'
define RecordedMissionInputs:
  RecordedCatalogInputs I where I.Scope = 'mission'
define RecordedKnowledgeInputs:
  RecordedCatalogInputs I where I.Scope = 'knowledge'
define RecordedNumericInputs:
  RecordedCatalogInputs I where I.Kind = 'number'
define RecordedTextInputs:
  RecordedCatalogInputs I where I.Kind = 'text'
define RecentlyRecordedInputs:
  RecordedCatalogInputs I where I.ObservedAt in Interval[EvaluationTime - 24 hours, EvaluationTime]
define FutureDatedInputs:
  RecordedCatalogInputs I where I.ObservedAt > EvaluationTime
define RecordedCatalogInputCount:
  Count(RecordedCatalogInputs)
define MissingCatalogInputCount:
  Count(MissingCatalogInputs)
define RecordedPersonalInputCount:
  Count(RecordedPersonalInputs)
define RecordedMissionInputCount:
  Count(RecordedMissionInputs)
define RecordedKnowledgeInputCount:
  Count(RecordedKnowledgeInputs)
define RecordedNumericInputCount:
  Count(RecordedNumericInputs)
define RecordedTextInputCount:
  Count(RecordedTextInputs)
define RecentlyRecordedInputCount:
  Count(RecentlyRecordedInputs)
define FutureDatedInputCount:
  Count(FutureDatedInputs)
