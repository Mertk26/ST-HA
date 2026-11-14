library Hecatron version '0.1.0'

parameter EvaluationTime DateTime
parameter SleepAt DateTime
parameter SleepDuration Quantity
parameter SleepTarget Quantity
parameter Fatigue Boolean
parameter StrengthAt DateTime
parameter CurrentStrength Decimal
parameter BaselineStrength Decimal
parameter FluidCoverageComplete Boolean
parameter AbdominalDiscomfort Boolean
parameter MoodLow Boolean
parameter CheckInAt DateTime
parameter FluidAt DateTime
parameter AssessmentDueAt DateTime
parameter AssessmentPending Boolean

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
  else not (FluidAt in Interval[EvaluationTime - 24 hours, EvaluationTime] and FluidCoverageComplete)
define CheckInFresh:
  CheckInAt is not null and CheckInAt in Interval[EvaluationTime - 24 hours, EvaluationTime]
define AbdominalReport:
  if CheckInFresh then AbdominalDiscomfort else null as Boolean
define CombinedPrivateContext:
  if CheckInFresh then MoodLow and AbdominalDiscomfort else null as Boolean
define AssessmentDue:
  AssessmentDueAt <= EvaluationTime and AssessmentPending
