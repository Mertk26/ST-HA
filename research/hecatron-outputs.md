# Hecatron: output functionality

This document describes Hecatron's functional scope, user-facing outputs, and interaction requirements. It is a functional reference, not a feature-completion checklist or evidence of clinical validation. Visual style, layout, branding, and animation are outside its scope.

## 1. Purpose and boundaries

Outputs should help an astronaut answer:

1. What information do I have, and how current and reliable is it?
2. What has changed compared with my history or an applicable plan?
3. What needs my attention, and why?
4. What information or authorized next step is available?
5. What happened after I recorded an action or another measurement?

The [challenge](https://www.spaceappschallenge.org/2026/challenges/health-monitoring-software/) proposes visual health assessment, guidance, reminders, charts, color coding, interactive body views, and optional gamification. The functions below extend those ideas; they are not all challenge requirements.

Inputs are defined in the [input landscape](./hecatron-inputs.md). Interpretation belongs to the [knowledge engine](./hecatron-knowledge-engine.md); the interface presents its results without independently inventing diagnoses, urgency, or recommendations.

## 2. Dashboards

| Output | Functional content | Important behavior |
|---|---|---|
| Personal overview | Selected indicators, recent changes, tasks due, unresolved notices, and last measurement times. | Separate "no issue identified by this rule" from "insufficient data." Do not claim an overall healthy state from a few indicators. |
| Indicator detail | Latest result, history, units, measurement method, context, baseline comparison when applicable, and data coverage. | Drill down from a chart point to its source record; identify manual, device, imported, and simulated readings. |
| Body-system explorer | Selectable body regions or systems leading to relevant measurements, symptoms, and educational material, displayed alongside dashboard widgets and notices. | Navigation, not an anatomical diagnosis map. Multiple systems may share a measurement without duplicating its underlying record. |
| Routine and plan dashboard | Measurements and actions due, completed, missed, or postponed; applicable user-provided plan. | Distinguish planned, acknowledged, and actually completed actions. Explain which plan created each task. |
| Mission and environment | Mission phase, gravity context, available equipment, habitat readings, and relevant environmental events. | Keep personal health and environmental conditions distinct; show location, source, freshness, and applicability. |
| Data quality | Missing measurements, incomplete windows, stale data, conflicts, import failures, and unavailable sources. | Explain what cannot be concluded and offer an appropriate data-management action rather than a medical conclusion. |

A shared crew dashboard is a possible extension, not a default. In a small crew, even aggregate information can identify individuals. Any such view needs explicit access and sharing design; private mood and medical details must not appear automatically.

The [interface specification](./hecatron-ui.md) defines the sign-in, collection, analysis, and dashboard journey, including the left-hand Da Vinci-inspired body navigator and its linked right-hand content.

## 3. Trends, comparisons, and event history

- Time-series views with selectable periods, clear units, readable values, and a table alternative.
- Baseline overlays only when the engine considers the baseline and measurement methods comparable; show the baseline period and sample count.
- Distinguish a personal baseline, a user-provided plan target, an educational reference, and a validated clinical limit. Never render them as interchangeable "normal ranges."
- Context markers for mission transitions, activity, symptoms, medication logs, and environmental events.
- Side-by-side or aligned timelines for exploring co-occurring changes without labeling correlation as causation.
- Gaps and uncertain intervals remain visible; interpolation, if introduced, must be labeled and must not manufacture observed readings.
- A unified history of observations, insights, notices, corrections, and user actions, with filters and links to the original records.

## 4. Insights and recommendation presentation

An insight should communicate an observation, not just a colored status. Its presentation should include:

| Element | Purpose |
|---|---|
| Statement | Concise description of the observed pattern or data limitation. |
| Time and context | Relevant period, mission context, and when the result was computed. |
| Supporting data | Values, source records, comparison window, and data completeness. |
| Reasoning | Plain-language explanation of the rule or calculation and its version. |
| Evidence | Research or procedure citation and its applicability/limitations. |
| Possible next step | A data-quality action, educational link, or action from an applicable authorized plan. |
| Uncertainty | Why the conclusion may be limited, or why no recommendation can be produced. |
| Response | Inspect evidence, correct input, record a measurement, or record completion when appropriate. |

Recommendations require evidence and applicability checks by the engine. No automatic medication changes, treatment selection, psychiatric diagnosis, or fitness-for-duty decisions are implied. A confidence percentage must not be invented; "insufficient evidence" is a valid result.

### 4.1. Astronaut-centered daily support

From the astronaut's perspective, the application should reduce the effort of managing health alongside mission work: "What do I need to do now, what can wait, and what should I report?" The following functional areas make the general dashboards and reminders concrete without creating separate, competing notification systems.

| Need | Functional output | Boundary and dependency |
|---|---|---|
| Medication routine | Reminders from an existing prescription; display its recorded instructions, last logged administration, and upcoming scheduled item. Flag conflicting administration logs for review. | Require an applicable, current prescription record. Do not prescribe, change doses, suggest substitutions, or invent missed-dose instructions. A log conflict is not proof of an overdose. |
| Supplements | Track supplements already included in an authorized nutrition/medical plan, with scheduled reminders and completion history. | Do not recommend starting vitamins or supplements from symptoms, diet estimates, or a generic spaceflight risk. |
| Exercise and physical countermeasures | Show the prescribed session, equipment, planned duration, completion, and reported difficulty or discomfort; summarize progress against the plan. | Do not increase intensity, replace unavailable equipment with an invented alternative, or declare bone/muscle health from adherence. Surface plan constraints and reported symptoms for review. |
| Hydration routine | Offer reminders from an individual plan, logged intake summaries, and an explicit indication of incomplete logging. | Intake does not establish hydration status. Do not generate fluid quantities or infer dehydration from intake alone. |
| Meals and nutrition | Show scheduled meals, incomplete meal logs, appetite trends, and comparison with documented nutrition-plan targets when suitable data exists. | Explain estimated intake and missing nutrient information; avoid unsupported deficiency diagnoses or dietary prescriptions. |
| Sleep and rest | Upcoming sleep opportunity, wind-down reminders, reported sleep history, and notices about recorded differences from a documented sleep plan. | Do not label an astronaut unsafe for duty or prescribe sleep medication. Explain that self-reports and wearable estimates can differ. |
| Work/rest balance | Display scheduled breaks and conflicts between a health routine and mission duties; allow recording a deferral and its reason. | Do not automatically reschedule mission-critical duties or assume a postponed break caused a health change. |
| Symptoms and follow-up | A quick "I do not feel well" entry point, a symptom timeline, follow-up prompts from an applicable protocol, and a concise report the astronaut can review. | Not a diagnostic symptom checker. Unknown severity must not generate reassurance; present applicable authorized help instructions without making unsupported triage decisions. |
| Emotional well-being and social support | Optional private check-ins, user-selected relaxation or social-contact reminders, and access to reviewed support material. | No psychiatric diagnosis, covert monitoring, forced disclosure, or automatic sharing with the crew. |
| Vision, balance, and adaptation | Reminders for scheduled assessments and a clear way to report changes around gravity transitions or other mission events. | Use only applicable assessment procedures. Do not diagnose SANS or vestibular conditions or invent rehabilitation exercises. |
| Personal hygiene and infection-prevention routines | Reminders for tasks explicitly included in a mission or individual plan and links to the relevant hygiene procedure. | Do not infer infection from a habitat sample or prescribe disinfection/isolation measures without applicable authority. |
| Bowel and urinary changes | Optional prompts to record changes and display their history alongside separately identified laboratory results. | Self-reported bowel/urinary changes and stool/urine biomarker findings are different data. Do not infer a microbiome disorder or other diagnosis from symptoms alone. |
| Sample collection and health examinations | Upcoming collection/exam tasks, procedure and equipment references, collection confirmation, and separate "result pending" and "result available" states. | Collection does not imply onboard analysis or an available result. Scheduling and preparation instructions must come from the applicable protocol. |
| EVA and mission-transition preparation | A health-task checklist drawn from an authorized plan, with incomplete items and relevant records available for review. | Checklist completion is not medical clearance, authorization to start an EVA, or a replacement for vehicle/suit safety systems. |
| Radiation and habitat awareness | Display applicable sourced advisories, location/time context, and links to established mission procedures; distinguish personal exposure from environmental conditions. | Do not infer personal dose or recommend sheltering from a generic solar-event feed. The prototype is not a radiation or life-support alarm. |
| Supplies and equipment readiness | Show availability and expiry/service information when supplied, with reminders to review recorded shortages or maintenance tasks. | Requires maintained inventory/status data; unknown inventory must not appear available. Do not suggest medication or equipment substitutions. |
| Medical consultation preparation | Prepare a user-reviewed summary of symptoms, relevant measurements, current recorded medications, questions, and data limitations. Display known contact procedures and connectivity status. | No claim that help was contacted, that a report was delivered, or that someone is monitoring the astronaut. |
| Reviewing an action's outcome | Show the logged action and subsequent observations together, and prompt for follow-up when an applicable plan specifies it. | Temporal sequence alone does not demonstrate treatment benefit, harm, or causation. |

Each functional area depends on its supporting observations, plans, inventory, or procedures. Inclusion in this catalog does not establish availability in a particular release. Missing prerequisites should produce an explicit unavailable state, not a fabricated recommendation.

### 4.2. Daily briefing and task coordination

- **Start-of-day briefing:** summarize scheduled health tasks, unresolved notices, available recent observations, and relevant plan changes, with a clear time basis.
- **Next-action list:** order tasks by their explicit schedule and authorized priority; explain why an item appears. Keep clinical urgency separate from ordinary task order.
- **Combined routine reminders:** group compatible nonurgent reminders to reduce interruption; preserve individual completion states and any plan-specific timing constraints.
- **Schedule conflicts:** identify overlapping routines or unavailable equipment and present the conflict for review rather than silently changing the plan.
- **End-of-day review:** summarize recorded actions, deferred tasks, new symptoms, missing observations, and the next scheduled items without penalizing honest reporting.
- **Plan-change visibility:** show what changed, who or what supplied the update, when it becomes effective, and which future tasks it affects. Do not treat outdated instructions as current.

## 5. Notifications and reminders

Notifications communicate events; reminders communicate scheduled tasks. Neither is automatically a medical alarm.

| Category | Example purpose | Source |
|---|---|---|
| Scheduled reminder | A measurement or routine is due. | Explicit schedule or applicable plan. |
| Data-quality notice | A reading is stale or a required field is missing. | Validation and freshness rules. |
| Insight notice | A supported pattern has become available or changed. | Versioned engine result. |
| Application notice | A save, import, export, or storage operation failed. | Application state. |
| Clinical escalation | Display an applicable, externally authorized instruction. | Only a reviewed protocol; otherwise outside prototype scope. |

Functional behavior:

- An in-app inbox with timestamp, source, subject, category, explanation, and current state.
- Acknowledge, postpone where appropriate, open details, and mark the associated task complete only after an explicit completion event.
- Deduplicate repeated notices for the same condition; retain history and avoid repeated reminders on every render.
- Keep "acknowledged," "task completed," and "underlying condition resolved" separate.
- Recompute affected insight notices when source data changes; show when a notice was superseded or withdrawn.
- Allow control of routine reminder preferences without silently changing any authorized escalation policy.
- In the browser demo, guarantee only verified active-session behavior; do not assume closed-app delivery. Android-native scheduled reminders require separate permission, platform, and device checks as described below.
- Do not show sensitive measurement or mood details in device-level notification previews by default.

### 5.1. Android and Samsung Wear OS companion notifications

- Mirror eligible Android phone notifications to the selected paired Samsung Galaxy Watch running Wear OS; a separate watch application is not required for this initial scope.
- Present short reminders, next-task information, or a selected indicator with units, observation time, and freshness. Measurement details require an explicit preview preference; generic reminders remain the privacy-preserving default.
- Offer navigation back to the phone application's relevant task/finding where supported. Additional watch actions such as snooze require explicit implementation and device verification.
- Reuse the same underlying notice/task identity rather than generating independent phone and watch reminders. Watch dismissal is not task completion or finding resolution.
- Expose permission/setup limitations in the phone app. Do not equate phone posting with verified watch delivery or promise medical-alarm reliability.
- Persistent watch-face indicators, custom watch dashboards, and watch sensor collection are separate capabilities, not delivered by notification mirroring.

Scheduling, packaging, and device acceptance follow the [Android/Wear OS architecture](./hecatron-application.md#10-android-and-wear-os-delivery).

## 6. Simulations and scenario exploration

Simulation is an educational and demonstration mode, not a clinical forecast or a verified digital twin.

| Function | What it provides | Boundary |
|---|---|---|
| Scenario playback | A fictional time sequence of measurements, missed observations, tasks, and resulting interface changes. | Use synthetic records, a controllable clock, pause/step/reset, and reproducible scenarios. |
| Data-quality scenarios | Explore gaps, stale readings, conflicting sources, and corrected entries. | Show uncertainty and recomputation rather than defaulting to a reassuring state. |
| Mission-context scenarios | Demonstrate a fictional transition or environmental event alongside personal observations. | Do not imply the event caused a symptom or established personal exposure. |
| What-if comparison | Compare explicitly stated synthetic input assumptions and the resulting rule outputs. | Label outcomes as illustrative calculations, not predictions of an astronaut's physiology or advice to change behavior. |

All public-demo records are synthetic. Scenario playback is an isolated replay workspace with its own run identity, clock, records, notices, and results, separate from the standard demo dashboard. Every replay screen and export must identify that mode. Leaving or resetting replay must not overwrite standard-workspace history or create real-world notifications.

## 7. Other functional UI/UX components

| Component | Functional purpose |
|---|---|
| Guided check-in | Collect a small set of measurements and optional self-reports with units, method/context prompts, validation, and confirmation. |
| Measurement help | Explain what a measurement represents and link to an applicable procedure; distinguish educational instructions from approved procedures. |
| Source-record viewer | Inspect provenance and corrections, and edit an entry without silently erasing its history. |
| Evidence library | Browse source-backed explanations by indicator, body system, or spaceflight hazard; display review status and source dates. |
| Plan/calendar view | See upcoming tasks, the schedule's time basis, exceptions, and completion history. |
| Lab/imaging viewer | Display imported reports or supported images with collection/result times and source metadata; do not imply automated diagnostic interpretation. |
| Export and handover | Produce a user-previewed summary of a selected period, measurements, insights, limitations, and sources. Explicitly exclude private data unless selected. |
| Preferences and local-data controls | Change display/accessibility preferences, manage sharing/export choices, and explicitly clear selected local data. |

Export creates a file, not delivery to a physician or synchronization with mission control. Successful download is not evidence that a recipient received or reviewed it.

## 8. Functional interaction requirements

- Support quick overview followed by progressive detail rather than requiring users to inspect every chart.
- Provide understandable empty, loading, insufficient-data, stale, error, and unavailable states.
- Pair color with text/icons; charts need keyboard-accessible controls and numerical alternatives.
- Preserve entered data across ordinary navigation; confirm destructive actions and make save failures visible.
- Expose units, time basis, simulation mode, and data freshness wherever their absence could mislead.
- Make optional sensitive questions skippable without implying a negative clinical result.
- Preserve the [shared record and lifecycle meanings](./hecatron-application.md#7-shared-data-contracts): task completion, notice acknowledgement, and finding withdrawal/resolution are not interchangeable. Body markers reflect current supported findings and data limitations, not the unread-notice count.
- Avoid competitive health scoring, public adherence rankings, or rewards that pressure disclosure or hide symptoms.
- Validate responsiveness, keyboard navigation, and screen-reader labels during implementation; a visually attractive dashboard alone is not sufficient.

The functional backbone is **overview -> inspect evidence -> understand limitations -> take an applicable action -> review history**. This describes behavior, not a screen layout.
