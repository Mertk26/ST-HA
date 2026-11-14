library HecatronPoc version '0.1.0'

parameter SleepDuration Quantity
parameter SleepPlan Quantity
parameter ObservedAt DateTime
parameter EvaluationTime DateTime
parameter ReportedFatigue Boolean
parameter CompletionCoverageKnown Boolean
parameter CompletionRecorded Boolean
parameter BaselineStrength Decimal
parameter CurrentStrength Decimal

context Unfiltered

define ClockMatchesSnapshot:
  Now() = EvaluationTime

define ObservationFresh:
  ObservedAt is not null
    and ObservedAt in Interval[EvaluationTime - 24 hours, EvaluationTime]

define SleepBelowPlan:
  if ObservationFresh then SleepDuration < SleepPlan
  else null as Boolean

define CombinedReview:
  SleepBelowPlan and ReportedFatigue

define CompletionNotRecorded:
  if CompletionCoverageKnown then not CompletionRecorded
  else null as Boolean

define StrengthRatio:
  if BaselineStrength > 0.0 then CurrentStrength / BaselineStrength
  else null as Decimal
