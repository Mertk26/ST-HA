# Sample Data and CQL Inference Rules Expansion

## Overview
This document summarizes the enhancements made to the Hecatron Space Tiger Health Assistant (ST-HA) system to add more comprehensive sample data and inference rules for health monitoring in space environments.

## Changes Made

### 1. **Expanded CQL Inference Rules** (`knowledge/Hecatron.cql`)

#### Radiation Monitoring Rules
Added new inference rules to detect radiation exposure anomalies and dispatch warnings:
- `FreshRadiationAvailable`: Checks if radiation data is available
- `PersonalRadiationAboveRange`: Detects when personal radiation exceeds normal range
- `EnvironmentalRadiationAboveRange`: Detects when environmental radiation exceeds normal range
- `RadiationWarningRequired`: Compound rule - triggers when either personal or environmental radiation is elevated

**Use Case**: When radiation levels increase during solar particle events or Van Allen belt transits, warnings are automatically dispatched for crew safety monitoring.

#### Space Weather & Environmental Threat Assessment
- `SpaceWeatherAvailable`: Checks for space weather event data
- `CabinHumidityAboveRange` / `CabinHumidityBelowRange`: Monitors cabin humidity levels
- `EnvironmentalThreatsPresent`: Identifies when environmental parameters are outside safe ranges

#### Compound Physiological Stress Indicators
- `CardiovascularStressIndicators`: Detects elevated heart rate, systolic, or diastolic pressure
- `RespiratoryCompromise`: Identifies breathing abnormalities or low oxygen
- `CardiopulmonaryStress`: Compound stress (cardiovascular + respiratory)
- `TemperatureDeviation`: Flags abnormal body temperature
- `MetabolicStress`: Detects glucose level anomalies

#### Sleep & Recovery Assessment
- `InsomniaSuspected`: Identifies insufficient sleep patterns
- `SleepRecoveryOptimal`: Confirms healthy sleep status
- `DeepRecoveryNeeded`: Identifies when crew needs enhanced recovery

#### Movement & Deconditioning Risk
- `MovementCapacityCompromised`: Detects strength degradation
- `DeconitioningRisk`: Identifies combined strength loss with cardiovascular stress
- `AerobicFitnessAtRisk`: Monitors aerobic capacity and exercise adherence

#### Hydration & Fluid Balance
- `HydrationStatus`: Confirms adequate hydration
- `DehydrationRisk`: Identifies dehydration threats
- `FluidOverloadRisk`: Detects excessive fluid retention

#### Psychological & Cognitive Assessment
- `PsychologicalDistress`: Identifies mood issues combined with stress
- `CognitiveLoadHigh`: Detects when workload exceeds psychological capacity
- `IsolationRisk`: Monitors for isolation-related concerns

#### Integrated Health Status Summary
- `HealthConcernCount`: Aggregates number of active health concerns
- `HealthStatusCritical`: Flags critical conditions (3+ concerns)
- `HealthStatusWarning`: Flags warning conditions (2+ concerns)

### 2. **Enhanced Sample Data Generation** (`src/fixtures.ts`)

#### Comprehensive Daily Check Data
Expanded text-based observations from 4 categories to 18 categories:

1. **Sleep Quality** (5 options)
   - Uninterrupted, refreshed sleep
   - Interrupted sleep with multiple awakenings
   - Difficulty falling asleep
   - Early morning awakening
   - Good quality with normal duration

2. **Workload** (5 options)
   - Routine, manageable workload
   - Busy schedule with EVA prep
   - Light maintenance activities
   - High workload experiments
   - Nominal standard procedures

3. **Mission Phase** (5 options)
   - Transit phase cruising
   - Orbital operations
   - Proximity/docking operations
   - EVA preparation
   - In-flight maintenance

4. **Light & Noise** (5 options)
   - Quiet cabin, normal noise
   - Increased equipment noise
   - Low light levels, night cycle
   - Moderate operational noise
   - Normal lighting/acoustic levels

5. **Symptoms** (5 options)
   - No symptoms
   - Mild headache (resolved)
   - Nasal congestion (normal for microgravity)
   - General fatigue
   - Muscle soreness from exercise

6. **Hydration Symptoms** (5 options)
   - Adequate hydration
   - Decreased thirst sensation
   - Below-plan intake (being addressed)
   - Adequate consumption
   - Within target monitoring

7. **Exercise Context** (5 options)
   - Treadmill session completed
   - Resistance exercises
   - Treadmill run specifics
   - Skipped (mission priority)
   - Countermeasure exercise performance

8. **Cognition** (5 options)
   - Alert with good concentration
   - Some difficulty focusing
   - Normal cognitive function
   - Slight fatigue toward day end
   - Sharp focus, productive

9. **Nutrition** (5 options)
   - Regular 3-meal intake
   - Good appetite, variety
   - Reduced appetite (2.5 meals)
   - High-protein for recovery
   - Scheduled meal consumption

10. **Social Context** (5 options)
    - Good crew interaction
    - Limited interaction
    - Team dinner, positive dynamics
    - Ground control communication
    - Strong crew cohesion

11. **Personal Radiation** (5 options)
    - Nominal dosimetry reading
    - Within expected range
    - **Elevated exposure (generates warning)**
    - Solar particle event caution
    - Van Allen belt transit

12. **Environmental Radiation** (5 options)
    - Normal baseline
    - **Space weather event, radiation elevation (generates warning)**
    - Neutron monitoring heightened
    - Nominal for trajectory
    - Solar flare activity monitoring

13. **Space Weather** (5 options)
    - Calm conditions
    - Moderate solar wind
    - **Solar particle event (triggers radiation rules)**
    - Geomagnetic activity normal
    - Stable solar wind

14. **Equipment Status** (5 options)
    - All systems nominal
    - Thermal system maintenance
    - Communications normal
    - Life support normal
    - Research equipment calibration

15. **Gravity Adaptation** (5 options)
    - Microgravity environment nominal
    - Weightlessness adaptation good
    - Zero-g affecting sleep
    - Normal zero-g tolerance
    - Continuous weightlessness adaptation

16. **Isolation Factors** (5 options)
    - Good psychological state
    - Crew morale maintained
    - Isolation manageable
    - No concerning symptoms
    - Strong crew cohesion

17. **Procedures** (5 options)
    - Per-protocol procedures
    - Modified for equipment
    - All safety procedures maintained
    - Standard operations
    - Procedures reviewed/validated

18. **Adherence** (5 options)
    - Full adherence
    - 95% adherence, one missed check-in
    - Excellent compliance
    - Nominal adherence
    - 100% adherence to program

#### Enhanced Numeric Data Ranges
Updated numeric indicators with mission-realistic ranges and occasional anomalies:

- **Radiation Indicators** (15% chance of elevation)
  - Personal: Normal 0.1-0.3 mSv/day, can spike to 0.4-0.6 mSv/day
  - Environmental: Normal 0.2-0.5 mSv/day, can spike to 0.7-1.0 mSv/day
  - **Triggers warning dispatch when elevated**

- **Cabin Atmosphere** (10% chance of deviation)
  - Cabin CO2: Can spike to 2100-2500 ppm
  - Cabin Oxygen: Can drop to 18-18.8%
  - **Triggers environmental threat assessment**

- **Cabin Pressure** (10% chance of instability)
  - Normal: 95-105 kPa
  - Can drop to 92-94 kPa during anomalies

- **Cabin Humidity** (15% chance of excess)
  - Normal: 30-60%
  - Can spike to 65-80% RH

- **Stress Levels**
  - Wide range reflecting mission variability
  - Correlates with workload patterns

### 3. **Updated Input Catalog** (`src/input-catalog.ts`)

#### Radiation Indicators Now Numeric
Changed radiation indicators from text to numeric with measurable ranges:

```typescript
// Before: text-based reporting
{ id: 'personalRadiation', label: 'Personal radiation exposure', kind: 'text', unit: '' }
{ id: 'environmentalRadiation', label: 'Environmental radiation...', kind: 'text', unit: '' }

// After: numeric with warning ranges
{ id: 'personalRadiation', label: 'Personal radiation exposure', kind: 'number', unit: 'mSv/day', range: [0.1, 0.3] }
{ id: 'environmentalRadiation', label: 'Environmental radiation...', kind: 'number', unit: 'mSv/day', range: [0.2, 0.5] }
```

**Benefits**:
- Enables automated comparison against normal ranges
- Triggers inference rules for radiation warnings
- Supports quantitative health risk assessment

## Inference Rule Flow Example: Radiation Warning

```
Daily Check-in Data Received
    ↓
Data includes: personalRadiation = 0.45 mSv/day (exceeds 0.3 range)
    ↓
FreshRadiationAvailable = true
    ↓
PersonalRadiationAboveRange = true
    ↓
RadiationWarningRequired = true
    ↓
HealthConcernCount += 1
    ↓
If HealthConcernCount >= 2: HealthStatusWarning triggered
    ↓
Alert/Warning Dispatched to Crew & Ground Control
    ↓
Recommendation: Monitor cumulative exposure, adjust mission phase if needed
```

## Sample Scenarios Generated

### Scenario 1: Normal Operation
- All readings within range
- Sleep adequate, mood steady
- No environmental threats
- Radiation nominal
- Health status: Normal

### Scenario 2: Solar Particle Event
- Environmental radiation elevation (0.6-0.8 mSv/day)
- Space weather event detected
- Cabin oxygen may drop slightly
- PersonalRadiationAboveRange = true
- RadiationWarningRequired = true
- Health status: Warning

### Scenario 3: Multiple Stress Indicators
- Heart rate elevated (105 bpm)
- Systolic pressure high (135 mmHg)
- Oxygen saturation low (94%)
- Stress level high (7/10)
- Sleep below plan (6 hours)
- CardiopulmonaryStress = true
- HealthStatusCritical triggered

### Scenario 4: Recovery Phase
- Sleep above range (8.5+ hours)
- Strength improving
- Mood steady
- Stress normal
- All cabin parameters nominal
- SleepRecoveryOptimal = true
- DeepRecoveryNeeded = false

## Testing & Validation

The enhanced system:
1. ✅ Compiles without CQL diagnostics
2. ✅ Passes TypeScript type checking
3. ✅ Successfully builds with Vite
4. ✅ Generates realistic synthetic data patterns
5. ✅ Triggers compound inference rules correctly

## Next Steps & Recommendations

1. **Visualization Updates**: Create dashboard widgets for:
   - Radiation exposure trends
   - Environmental threat indicators
   - Health concern aggregation
   - Recovery status indicators

2. **Alert Customization**:
   - Configure radiation thresholds per mission phase
   - Set individual crew baseline adjustments
   - Define escalation procedures for critical status

3. **Data Integration**:
   - Connect to actual radiation monitoring systems
   - Integrate with space weather API feeds
   - Link to crew scheduling system

4. **Clinical Review**:
   - Have space medicine physicians validate inference thresholds
   - Adjust psychological stress weightings per mission profile
   - Fine-tune compound health concern rules

## Files Modified

- `knowledge/Hecatron.cql` - Added 25+ new inference rules
- `src/fixtures.ts` - Expanded sample data generation with 18 daily check categories
- `src/input-catalog.ts` - Changed radiation to numeric indicators with ranges

## Statistics

- **New CQL Rules**: 25+ inference definitions
- **Sample Data Categories**: 18 (expanded from 4)
- **Text Observation Options**: 5 choices each = 90+ combinations
- **Radiation Warnings**: 15% probability per check-in
- **Environmental Anomalies**: 10-15% base rates
- **Compound Health Rules**: 6 integrated assessments
