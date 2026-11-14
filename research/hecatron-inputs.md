# Hecatron: astronaut health input landscape

This document catalogs astronaut health inputs, their dimensions, sources, and interpretation limits. It is an input inventory, not an implementation specification or a clinical protocol.

## 1. Purpose and boundaries

The [challenge][C] asks for a visual tool that gathers health indicators and helps astronauts assess their health and understand potential treatments and improvements. It explicitly gives blood pressure, heart rate, blood sugar, temperature, sleep, and mood as examples; keyboard, mouse, and camera are example input methods. The examples below are **candidates**, not a claim that NASA requires every field, that every device exists on a mission, or that a given measurement is medically actionable.

Hecatron has several kinds of input:

1. **Personal observations:** measurements, symptoms, self-reports, and activities concerning one astronaut.
2. **Mission and environmental context:** gravity, mission phase, vehicle conditions, radiation events, and resources available to the crew.
3. **Historical and individual context:** baselines, relevant history, prescribed plans, and the circumstances under which a measurement was made.
4. **Knowledge and configuration:** reviewed research, procedures, measurement definitions, and versioned rules. These are evidence inputs, not live personal observations.
5. **Interaction and data-quality information:** acknowledgements, consent/sharing choices, device status, corrections, and missingness.

The same hazard can influence several systems, and several hazards can interact [H]. A correlation or a change from baseline is not proof of cause or diagnosis. We must not turn this inventory into automatic medical advice, clinical thresholds, or emergency decisions without appropriate medical validation.

### How to read the inventory

- **C**: directly named as an example in the challenge.
- **R**: supported by one or more cited NASA or CSA resources, often in a research context.
- **H**: motivated by the official spaceflight-hazard descriptions; this does not establish a sensor interface or personal exposure.
- **P**: application-specific input or extension; its inclusion is a design consideration, not a NASA requirement.
- **Manual / device / import** are possible capture methods, not promises of available integrations. Frequency suggestions are design candidates, not medical schedules.
- Personal inputs are associated with a pseudonymous astronaut and measurement time. Crew-wide inputs should not be treated as personal readings.
- Unknown, unavailable, not measured, declined, invalid, and delayed are different states. None means normal.

Collection method and data authenticity are separate: a manually entered demo observation is still synthetic, and a simulated sensor is not real hardware. Workspace/replay identity and source provenance follow the [shared application contracts](./hecatron-application.md#7-shared-data-contracts).

## 2. Astronaut and baseline context

These inputs allow interpretation in context, but they are particularly sensitive. Collect only what a chosen use case needs, with clear access and retention rules.

| Input dimension | Candidate fields and capture | Why it matters / limitations |
|---|---|---|
| Identity and assignment **P** | Pseudonymous crew ID; mission ID; assignment start/end. Set up before the scenario. | Associates observations with the right person and mission. A demo should use fictional people, not real astronaut records. |
| Individual baseline **R/P** | Indicator, baseline value or distribution, units, measurement method, period, and sample count; import or enter measurements collected before/during a mission. | NASA Standard Measures includes before-, during-, and after-flight data [SM]. Comparisons need like-for-like methods and adequate baseline data; a baseline is not automatically a safe range. |
| Relevant medical context **P** | Optional conditions, allergies, medication list, prior injuries, and relevant clinician-approved instructions; controlled import or entry. | Can change interpretation and care. Highly sensitive; out of initial scope unless a use case truly requires it. Do not assume astronaut selection eliminates individual differences. |
| Individual plan **P** | Prescribed exercise, sleep, measurement, nutrition, and medical plans; effective dates, author, and source. | Enables comparison with an authorized plan rather than a generic target. Demonstration plans must be explicitly fictional fixtures, never represented as real prescriptions or clinical approval. |
| Preferences and accessibility **P** | Units, preferred display language, accessibility needs, reminder preferences, mission time display, and body-figure presentation preference. | Makes inputs usable under time pressure and varied conditions. Preferences, including male/female illustration choice, are not clinical facts. |

Age, sex, and other demographic characteristics might be relevant for some medically reviewed models, but do not collect or use them by default, infer them from identity, or assume generic population norms apply to an individual astronaut.

## 3. Physiological and medical observations

Measurements are possible inputs, not diagnoses. Capture method, units, time, and conditions alongside each result. A spaceflight risk does not imply a corresponding test is available, appropriate, or self-performed in flight.

| Input dimension | Candidate values, source, and timing | Relevance / caution |
|---|---|---|
| Heart rate **C/R** | Beats/min; manual entry or wearable/device reading; at rest, during activity, or during a protocol. | Useful longitudinal cardiovascular context [R, TP]. Record rest/activity and device; one value cannot establish a cardiovascular diagnosis. |
| Blood pressure **C** | Systolic and diastolic in mmHg; cuff/manual entry when available. | Context for circulation; record posture, activity, repeated readings, and method where relevant. |
| Body temperature **C** | Temperature with unit and measurement site; manual/device entry. | Relevant to illness monitoring; record site and device, and do not infer infection from this alone. |
| Blood glucose **C** | Value with unit, timing relative to food, and device/test method. | Challenge example, not a requirement for every astronaut. Relevant interpretation depends on individual context and equipment. |
| Oxygen saturation and breathing **P/R** | Peripheral oxygen saturation, respiratory rate, symptoms, measurement method and conditions; manual/device input if supported. | Hypoxia is a NASA risk [R]. A pulse-oximeter value is not a direct measurement of tissue oxygenation and is affected by device and conditions. |
| Symptoms and functional changes **P/R** | Type, onset, duration, severity scale, body location, progression, and free-text note; astronaut entry when needed. | Examples include dizziness, nausea, rash, pain, fatigue, visual changes, and self-reported bowel/urinary changes. NASA describes immune and sensorimotor effects [R]. Reports are not diagnoses or specimen test results. |
| Eye/vision observations **R/P** | Reported vision changes; exam result or image reference and method if available. | SANS is a research risk [R]. A self-report or photograph cannot diagnose it. |
| Balance, motion sickness, and coordination **R/P** | Symptom report or result of an authorized, defined test; gravity-transition and task context. | NASA describes vestibular and sensorimotor changes; Artemis II Standard Measures includes balance and motion-sickness testing [R, AS]. Do not claim a homemade test is validated. |
| Strength and physical performance **R/P** | Named test, result, units, protocol, equipment, and date. | NASA's Standard Measures includes strength and sensorimotor tests [SM]. Tests may be infrequent and mission-specific. |
| Aerobic capacity **R/P** | VO2max, unit, direct/indirect assessment method, date, and comparable baseline where available. | NASA defines mission-specific aerobic requirements [PERF]. These are assessment results, not estimates inferred from a single heart-rate reading or exercise log. |
| Imaging and exam findings **C/R** | Ultrasound image or exam report, acquisition time, anatomical site, device, and qualified interpretation if available. | The challenge names ultrasound images; NASA studies medical imaging [TP]. Storage/display is not automated interpretation; large files and permissions matter. |
| Lab and biomarker results **R/P** | Named analyte or result, value, units, specimen (including blood, saliva, urine, or stool/feces), collection/result time, lab, method, and reference information if provided. | NASA research uses blood, saliva, and urine [AS, IB]; Standard Measures also collects fecal samples to study microorganism composition [SM]. Stool is a specimen, not itself a biomarker; record the specific test or microbiome finding. Sample collection does not mean results are immediately available onboard; do not infer health state from specimen collection alone. |
| Body mass, bone, and body composition **R/P** | Body mass with units and measurement method; validated bone/body-composition assessment results, test type, equipment, date, and conditions when available. | NASA discusses bone changes and individualized nutrition [R, PERF]. Exercise or symptoms alone cannot measure bone density; mass measurement in microgravity requires suitable methods. Strength tests are recorded under physical performance, not duplicated here. |
| Medication, supplement, and intervention logs **P** | Recorded item/action, time, dose/unit if applicable, taken/missed/unknown status, and reference to the individual plan. | May explain changes and support a user-provided plan. Supplements use the same administration-log model; never generate a dose or new treatment from unvalidated rules. |

## 4. Sleep, behavior, nutrition, and daily activity

Subjective and objective data should remain distinguishable. Optional behavioral inputs deserve particular privacy safeguards and should never be used for covert crew ranking or automatic psychiatric diagnosis.

| Input dimension | Candidate values and capture | Relevance / caution |
|---|---|---|
| Sleep **C/R** | Sleep start/end, reported duration and quality, interruptions, naps; manual log or actigraphy when available. | NASA studies sleep, activity, and light exposure [SM, AR]. Reported sleep and device estimates are different methods; time windows crossing midnight need care. |
| Mood and well-being **C/R** | Optional self-reported mood, stress, perceived fatigue, and short note using a clearly defined scale. | The challenge names mood; NASA studies behavioral health [R, AR]. Self-reports are sensitive and do not diagnose a disorder. |
| Cognition and attention **R/P** | Result and version of an authorized test, time, and relevant sleep/work context. | NASA research includes cognition tests [SM]. Test practice, fatigue, and environment affect results; a simple game is not a validated clinical assessment. |
| Workload and schedule **R/P** | Work/rest periods, duty type, schedule changes, and perceived workload. | Irregular schedules and operational demands are NASA concerns [R]. Avoid using workload as a substitute for medical data. |
| Physical activity and exercise **R/P** | Activity type, start/end, duration, perceived exertion, equipment, and completion of an authorized plan; manual or wearable. | NASA studies exercise and uses activity measurements [R, SM]. Completed exercise is not proof of maintained bone or cardiovascular health. |
| Food and nutrition **R/P** | Food provided, meals consumed, approximate intake, appetite, dietary restrictions, and nutrition-test results where available; record the kind, period, method, and completeness. | NASA identifies inadequate nutrition as a risk and studies diet [R, SM]. Food provision, consumption, absorption, and measured nutritional status are distinct. Self-reported intake is approximate and is not a validated nutrient analysis. |
| Fluid intake and hydration-related symptoms **P** | Intake amounts and units, timing, symptoms, or separately identified test results. | Useful context for a selected scenario, but intake alone does not establish hydration status. Avoid creating fluid-prescription rules. |
| Social connection and crew interaction **R/P** | Optional private self-report of isolation or social support, or aggregated schedule context. | NASA studies isolation and teamwork [H, AR]. Avoid monitoring private conversations or inferring team conflict from individual mood. |
| Measurement/task adherence **P** | Scheduled task, completion/skip reason, time, and who supplied the plan. | Helps identify missing measurements or an unfinished routine; missed tasks are not automatically a health problem. |

## 5. Spaceflight and environmental context

These describe *conditions around* a person, not a measurement of that person's health. Track where and when each applies and whether the astronaut was actually exposed.

| Input dimension | Candidate fields and source | Relevance / caution |
|---|---|---|
| Mission phase and location **H/P** | Mission elapsed time, phase, spacecraft/station/rover/habitat, and location when known; mission plan or user selection. | Changes what equipment and care are available and which hazards may apply [H]. Record transitions rather than assuming the phase is constant. |
| Gravity and transitions **H/R/P** | Environment or gravity regime, transition time, and relevant activity. | Gravity changes affect multiple body systems [H, R]. A mission phase is only a proxy, not a measured personal dose of mechanical loading. |
| Isolation and confinement **H/P** | Time away from Earth, habitat context, and optional self-report. | Context for behavioral health, not a diagnosis or direct measure of loneliness [H, R]. |
| Communication and support availability **H/P** | Connectivity state, expected communication delay if known, medical contact availability, and last update. | Distance can constrain assistance [H, CSA2, TP]. A frontend-only demo should not claim it can contact mission control. |
| Personal radiation exposure **H/R/P** | Dosimeter reading, exposure period, quantity and unit, device, calibration, and coverage; imported/simulated only unless a real integration exists. | Space radiation is a hazard [H, RAD]. Personal dose, dose rate, and different radiation quantities must not be conflated; no unsupported conversion or clinical threshold. |
| Environmental radiation / neutron monitoring **R/P** | Instrument, particle type or quantity, value/unit, location, time interval, and data coverage. | CSA describes the Canadian Active Neutron Spectrometer (CANS) as an instrument under development [CSA1]. Its environmental neutron measurements are not automatically an astronaut's total personal exposure. |
| Space-weather events **P** | Event type, time, source, region/trajectory if supplied, and confidence. | Potential mission context; a solar event record is not a personal dose, proof of exposure, or an instruction to shelter. No live feed is required by the challenge. |
| Cabin atmosphere **H/R/P** | Temperature, pressure, oxygen, CO2, humidity, and location/time if measured by habitat systems. | NASA identifies temperature and pressure as habitability factors and discusses hypoxia and EVA-related CO2 [H, R]. Exact sensors, units, and safe limits must be validated for the vehicle. |
| Light, noise, and habitability **H/R/P** | Light exposure, noise level, location, timestamp, or an astronaut's subjective report. | Habitat factors and light/activity measurements appear in NASA resources [H, SM]. Personal exposure and cabin readings are not interchangeable. |
| Microbial/environmental observations **H/R/P** | Habitat sample location (such as a surface), collection date, lab finding, and result status, if available. | NASA discusses habitat microbes [H]. This dimension covers environmental samples only; personal specimens belong under lab and biomarker results. Environmental samples are not proof that a crew member is infected. |
| Spacewalk / suit context **R/P** | EVA identity and planned/actual times, suit or activity context, relevant pressure/oxygen data if available, symptoms, and an external clearance-record reference when supplied. | NASA identifies EVA, decompression sickness, and hypoxia risks [R]. A clearance reference identifies the astronaut, specific EVA, issuer, and applicable validity conditions; the app does not issue it. Mission operations and established procedures take precedence over a demo. |
| Equipment, supplies, and support **H/P** | Available measurement devices, medical supplies, item identities, stock units/quantity, expiry/service dates when supplied, applicable procedures, status, and last verified time. | Distance makes resupply and medical support harder [H, CSA2]. Unknown stock is not available stock; availability is not permission or an instruction to use equipment. |

## 6. Reference knowledge and user interaction

| Input dimension | Candidate fields and source | Relevance / caution |
|---|---|---|
| Scientific evidence **R/P** | Citation, URL, publication/update date, population, study setting, measured variables, limitations, and review status. | Research pages support understanding but often do not establish clinical thresholds or real-time measurements. See section 8. |
| Procedures and guidance **P** | Document/version, authority, effective date, applicable context, permissions, and source link. | Keep mission-approved procedures distinct from educational text and demonstration content; only use guidance authorized for its context. |
| Definitions and rules **P** | Indicator definition, unit, method, reference source, rule version, applicability, and validation status. | Allows a derived insight to be traced to its data and logic. Prototype rules must be labeled illustrative, not NASA-approved clinical guidance. |
| Alert/reminder configuration **P** | Plan ID, due time, priority supplied by an authorized plan, user preferences, and quiet hours where applicable. | Provides input to reminders; do not make silent defaults look like medical decisions. |
| User actions and feedback **P** | Acknowledged, postponed, completed, declined, correction, and timestamp. | An acknowledgement is not proof that a measurement was taken or that an intervention worked. |
| Consent and access preferences **P** | Explicit sharing choice, scope, recipient, time, and revocation where applicable. | Especially important for mental-health and medical records. Browser-local storage alone is not a complete security or privacy solution. |
| Device and source state **P** | Device identity/type, connection, last successful reading, calibration/status if available, and import errors. | Helps distinguish no data from a normal reading; do not invent hardware connectivity. |

## 7. Cross-cutting dimensions of an input record

The inventory is not a database schema. These dimensions apply to storage, consolidation, and knowledge extraction:

1. **Subject and scope:** pseudonymous person, crew, device, or habitat; mission and location. A cabin reading should never silently become a personal one.
2. **Meaning:** named indicator or event, definition, body site or environmental location, protocol, and whether it is directly observed, self-reported, estimated, or derived.
3. **Value and units:** numerical, categorical, text, image reference, or event; units and conversion provenance. Preserve raw readings when normalizing units.
4. **Time:** observed time or interval, recorded/imported time, time zone or UTC offset, mission time if used, and time uncertainty. Measurements can arrive late; clock changes and sleep across midnight matter.
5. **Source:** manual, device, imported document, research dataset, or simulator; origin, collector/device, method, and simulated-vs-real label.
6. **Conditions:** rest/exercise, posture, meals, measurement site, equipment, gravity/mission phase, and other indicator-specific context when available.
7. **Quality:** missing/declined/not applicable, invalid, uncertain, incomplete, duplicate, stale, device status, and data coverage. Do not substitute zero or a normal value.
8. **Version and correction:** stable record ID, source record ID where present, correction history, superseded status, import/version, and who or what made the change.
9. **Sensitivity and access:** classification, permitted viewers, sharing decision, retention, and audit requirements appropriate to a real system. Do not put sensitive data in URLs or assume browser storage is secure.
10. **Derivation lineage:** source record IDs, algorithm/rule and version, aggregation window, baseline, uncertainty, time computed, and limitations. A derived trend must not be stored or presented as a raw measurement.

Consolidation should deduplicate without erasing genuinely separate readings, preserve conflicting sources, keep incompatible units/methods apart until a validated conversion is available, and show incomplete coverage. Aggregation windows and baseline definitions need explicit versioning. Missing data, stale data, and an unavailable reference must remain visible.

## 8. Sources and traceability

The five official challenge resources and their interpretation boundaries are listed below.

| ID | Official resource | What it contributes | What it does not establish |
|---|---|---|---|
| [H] | [NASA: 5 Hazards of Human Spaceflight][H] | Radiation, isolation/confinement, distance, gravity, and closed environments; interacting hazards and habitability. | Individual data feeds, diagnostic thresholds, or required app fields. |
| [R] | [NASA: Risks of Human Spaceflight][R] | Physiological, behavioral, and radiation risks including vision, sleep, nutrition, fitness, hypoxia, and EVA. | That an app can diagnose or measure each risk. |
| [HR] | [NASA: Ongoing HRP Research in Space][HR] | Studies including activity, sleep, biomarkers, imaging, and physiology. | Universal availability of every research test or dataset in flight. |
| [CSA1] | [CSA: Monitoring Radiation for Astronaut Health][CSA1] | Describes CANS, a neutron-monitoring instrument under development. | Personal total dose or a currently integrated Hecatron data feed. |
| [CSA2] | [CSA: Why Do We Conduct Science Experiments in Space?][CSA2] | Discusses microgravity, radiation, isolation, communication delays, and limited resupply/medical assistance. | Clinical thresholds or a specific app input schema. |

Additional NASA pages followed from those resources:

- [SM] [Spaceflight Standard Measures][SM]: activity/light sensors, sleep reports, fluid and saliva samples, fecal samples for microorganism composition, cognition, sensorimotor and strength tests; before/during/after mission.
- [AR] [ARCHeR][AR]: well-being, activity, sleep and interactions; actigraphy during missions and surveys before/after. This does not establish that those surveys were administered during a mission.
- [AS] [Artemis II Standard Measures][AS]: blood/saliva/urine, MRI, vestibular and performance studies at different mission phases. Do not assume all are performed onboard.
- [IB] [Immune Biomarkers][IB]: blood samples before/after and saliva also during the mission. Sample collection and lab-result availability are distinct.
- [TP] [Tempus Pro][TP]: research into integrated vital data and imaging; simulated medical scenarios and telemedicine capabilities.
- [RAD] [NASA: Hazard: Space Radiation][RAD]: radiation sources and monitoring context, not a personal exposure calculation.
- [C] [2026 health-monitoring challenge][C]: the challenge objective, example indicators, inputs, and optional features.
- [PERF] [NASA Human Performance][PERF]: mission-specific aerobic-capacity and strength requirements and individualized nutrient-provision requirements; see the [engine's reference catalog](./hecatron-knowledge-engine.md#19-source-backed-rule-references) for interpretation limits.

[C]: https://www.spaceappschallenge.org/2026/challenges/health-monitoring-software/
[H]: https://www.nasa.gov/hrp/hazards/
[R]: https://www.nasa.gov/hrp/risks/
[HR]: https://www.nasa.gov/hrp/ongoing-hrp-research/
[CSA1]: https://www.asc-csa.gc.ca/eng/news/articles/2026/2026-02-26-monitoring-radiation-astronaut-health.asp
[CSA2]: https://www.asc-csa.gc.ca/eng/iss/science/why-do-we-conduct-science-experiments-in-space.asp
[SM]: https://www.nasa.gov/reference/standard-measures/
[AR]: https://www.nasa.gov/reference/archer/
[AS]: https://www.nasa.gov/reference/artemis-ii-standard-measures/
[IB]: https://www.nasa.gov/reference/immune-biomarkers/
[TP]: https://www.nasa.gov/reference/tempus-pro/
[RAD]: https://www.nasa.gov/hrp/hazard-space-radiation/
[PERF]: https://www.nasa.gov/reference/4-0-human-performance/
