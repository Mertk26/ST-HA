# Hecatron: knowledge and recommendation engine

This document defines the responsibilities, result categories, and evidence boundaries of Hecatron's knowledge and recommendation engine. It does not establish a validated clinical algorithm, threshold, prediction model, or recommendation policy.

## 1. Role

The engine connects the [input landscape](./hecatron-inputs.md) to [user-facing outputs](./hecatron-outputs.md). Its job is to turn available observations and context into traceable summaries, supported insights, and, only where justified, applicable next steps.

The interface must not implement a separate interpretation policy. Storage preserves facts and provenance; the engine interprets them; the interface explains the result.

### 1.1. Architectural approach

Hecatron's design combines numerical analysis with explicit knowledge and action-selection policies. An explainable expert system is a useful analogy, not a commitment to MYCIN, its medical domain, its certainty-factor model, or any particular rule-engine library.

The engine must distinguish four questions:

1. **Observation:** What do the available records actually show?
2. **Interpretation:** What supported pattern or contextual relationship can be described?
3. **Applicability:** Is the relevant evidence or plan applicable to this person, mission phase, and time?
4. **Action:** Is there a justified next step, or should the engine request information or withhold a recommendation?

For example, an incomplete fluid-intake log supports a data-completeness finding, not a dehydration diagnosis. A difference from a sleep plan supports a comparison, not a fitness-for-duty decision.

## 2. Processing responsibilities

| Stage | Responsibility | Required boundary |
|---|---|---|
| Validate | Check required fields, value types, units, timestamps, and subject/source scope. | Syntactic validity does not establish clinical plausibility or measurement accuracy. Preserve rejected/import-error details without treating them as observations. |
| Normalize | Convert explicitly supported units and standardize identifiers/time representations. | Preserve original values and conversion history; reject unsupported conversions explicitly. |
| Consolidate | Identify duplicate source records, corrections, and conflicting observations. | Do not average away conflicts or collapse genuinely separate readings. |
| Aggregate | Calculate defined summaries over explicit windows, with coverage and sample counts. | Do not silently fill gaps or mix incompatible methods, people, environmental readings, or simulation modes. |
| Contextualize | Select applicable mission phase, individual baseline, measurement conditions, and plan. | Context may be missing; a baseline is not a safety limit. |
| Extract patterns | Describe changes or associations supported by the available data. | Pattern detection is not diagnosis or proof of causation. |
| Link evidence | Attach relevant reviewed sources, applicability, and limitations. | A general research article does not establish a clinical action rule. |
| Select next steps | Offer a relevant data action, educational explanation, or instruction from an applicable authorized plan. | If evidence or authorization is insufficient, produce no clinical recommendation and explain why. |
| Publish results | Return structured results for dashboards, notices, and exports. | Include provenance, versions, uncertainty, and computation time. |

## 3. Result categories

- **Summary:** descriptive aggregation, such as a mean with its time window and coverage.
- **Comparison:** difference from an explicitly identified, comparable baseline or plan.
- **Insight:** supported observation about a pattern, with source records and reasoning.
- **Data-quality finding:** an issue preventing or limiting interpretation.
- **Recommendation:** an applicable next step with an identified authority and evidence basis, or a clearly nonclinical data-management action.
- **No conclusion:** insufficient data, incompatible methods, missing context, or unsupported evidence.

An insight need not have a recommendation. A source may be relevant educationally without authorizing any action. Avoid an opaque combined "health score" unless its meaning and validation can be established.

## 4. Information carried by a result

Result information requirements, independent of storage schema:

- Stable identity, category, subject/scope, and simulation status.
- Statement, applicable period/context, and computation time.
- Supporting record IDs and relevant plan/baseline references.
- Calculation/rule identifier and version.
- Evidence citations, review status, and applicability.
- Data coverage, missingness, uncertainty, and limitations.
- Optional next step, action category, authority, and conditions.
- Optional body associations with mapping basis/version, or an explicit whole-person/unmapped category, following the [shared result contract](./hecatron-application.md#7-shared-data-contracts).
- Status, including superseded/withdrawn when source data or rules change.

Severity, confidence, and expiry must have explicit definitions before use. Do not invent numerical confidence or medical urgency for presentation purposes.

## 5. Engineering principles

Prefer small, deterministic, independently testable calculations and explicit rules over an unexplained model. Keep the engine independent of React components and browser storage APIs. Pass observations, context, rules, and the current time explicitly so the same logic can run in standard dashboard operation and isolated scenario playback.

If language models or other machine-learning models are considered later, first establish what they add, supported evidence, evaluation cases, privacy, package/runtime feasibility, and failure handling. They must not be presumed necessary or allowed to fabricate clinical recommendations. Browser code cannot safely conceal a third-party API secret.

Python is not part of the technology foundation. A scientific method that depends on Python libraries requires an explicit execution strategy, such as precomputed reference data or browser-compatible computation. A backend would change the frontend-only architecture and must not be introduced implicitly.

## 6. Correctness expectations

Behavioral tests must cover applicable cases involving missing/stale readings, insufficient baselines, unit conversion, duplicate imports, corrected observations, late data, context boundaries, and simulation isolation.

A correction must trigger recomputation of dependent results and update affected notices without erasing their history. The same input snapshot, clock, and rule versions should reproduce the same results. Scientific and clinical validation remain distinct from software tests.

## 7. Evidence boundary

The official research sources and their limitations are cataloged in the [input document](./hecatron-inputs.md#8-sources-and-traceability). They justify exploring input dimensions, but do not by themselves validate the engine or provide a complete decision-support protocol. Any future claim about a specific algorithm or recommendation needs its own supporting evidence.

## 8. Knowledge representation

Keep the knowledge base distinct from an astronaut's current records and from the inference machinery.

| Knowledge element | Contents | Purpose |
|---|---|---|
| Indicator definition | Meaning, units, compatible methods, value type, and relevant context. | Prevent comparisons between unlike measurements. |
| Feature definition | Calculation, window, inclusion/exclusion criteria, coverage requirements, and version. | Make numerical summaries reproducible. |
| Evidence entry | Citation, source date, population, setting, relevant claim, limitations, and review status. | Establish what a source actually supports. |
| Interpretation rule | Preconditions, required features, applicable context, exclusions, and permitted conclusion. | Produce a bounded, explainable finding. |
| Action policy | Eligible finding, permitted action type, authorization, applicability, and conflicts. | Separate noticing a pattern from recommending a response. |
| Individual plan | Subject, authorized instructions, schedule/targets, author/source, validity period, and version. | Support personalized routines without generating prescriptions. |
| Explanation template | Human-readable statement, substitutions, supporting references, and limitations. | Produce consistent explanations from structured results. |

Every interpretation rule and action policy needs an identity, version, evidence or plan basis, validity conditions, and review status. Educational, illustrative simulation, and clinically authorized content must be distinguishable. A research citation is not equivalent to clinical authorization.

Represent conditions with typed, supported operations rather than arbitrary application code. For CQL, validate against the pinned compiler/runtime capabilities instead of building a competing expression language. Unknown indicators, incompatible units, unsupported operators, broken references, and ambiguous rule versions must produce explicit errors.

## 9. Facts, features, and inference

### 9.1. Observation snapshot

Evaluate a consistent snapshot containing the subject, observations, context, applicable plans, knowledge versions, evaluation time, and workspace mode. Use the [shared application contracts](./hecatron-application.md#7-shared-data-contracts): the public standard dashboard and isolated replay both use synthetic data, but do not share mutable records, clocks, or results.

Raw records remain immutable evidence for the evaluation. Consolidated records, numerical features, interpretations, and actions are separate layers with links back to their dependencies.

### 9.2. Numerical feature layer

Calculate only defined features: for example, observation counts, coverage, a summary over an explicit period, or a difference from a comparable baseline. Each feature reports its prerequisites, inclusion rules, and availability.

Do not treat unavailable features as zero. Sampling density, repeated measurements, late results, overlapping windows, incompatible methods, and incomplete logs can all change the meaning of a calculation.

### 9.3. Condition evaluation

Conditions have three outcomes: **satisfied**, **not satisfied**, or **unknown**. Missing, stale, conflicting, or inapplicable data cannot silently satisfy a condition or its negation.

- A rule fires only when its required conditions and applicability checks are satisfied.
- An unknown result records the unmet prerequisite and prevents conclusions that depend on it.
- A rule that does not fire does not establish that the astronaut is healthy.
- Exclusions, including an incompatible mission phase or expired plan, prevent the associated action.

Evaluate declared dependencies in a deterministic order, computing features before findings and findings before actions. Only rules with explicit dependencies may consume derived findings. Reject dependency cycles; arbitrary recursive reasoning is not required. Rule volume is addressed through domain packages and dependency indexing rather than one monolithic evaluation.

Event-driven evaluation can refresh results after a new observation, correction, plan update, context transition, or relevant time boundary. Time-based reevaluation matters even when no new reading arrives, because measurements and plans can become stale.

### 9.4. Focused information requests

When a relevant conclusion is blocked, the engine can identify a missing prerequisite and explain why it matters. The interface may offer a targeted question or a request to record an available measurement.

Ask only for information that could change an applicable result, respect consent and equipment availability, and avoid repeated prompts after a user declines. Do not instruct an astronaut to perform an unsupported test. A request for information is not a diagnosis.

## 10. Recommendation selection and conflicts

The action-selection layer applies after finding generation:

1. Check evidence, review status, scope, and plan validity.
2. Check required personal context, available equipment, and explicit exclusions.
3. Determine whether the output is a data-management action, educational information, a scheduled routine, or an instruction from an authorized protocol.
4. Detect incompatible actions, duplicate actions, superseded plans, and schedule conflicts.
5. Publish the permitted action with its explanation, or withhold it and report the blocking reason.

A recent source is not automatically more authoritative than an older applicable procedure. Do not use "last rule wins," an arbitrary rule priority, or a majority vote to resolve medical conflicts. Unresolved authority or applicability conflicts must be visible and block the affected recommendation.

Deduplicate shared next steps while retaining every supporting finding. Several findings based on the same measurement are not independent confirmations and must not inflate confidence.

Routine task ordering can use an explicit schedule and supplied priority. Clinical urgency requires an applicable reviewed protocol and cannot be inferred merely from a large deviation or a dashboard color.

## 11. Explanation and feedback

Each result should support:

- **Why this result?** Show the facts, context, calculations, and conditions that supported it.
- **Why this next step?** Identify the applicable plan or evidence and the action policy.
- **Why no recommendation?** Show missing prerequisites, conflicting guidance, or insufficient authorization.
- **What would change the result?** Identify relevant missing information or a corrected observation without suggesting that a user manipulate their records.
- **What changed?** Explain recomputation after a correction, new result, or plan update.

Separate evidence quality, measurement quality, applicability, and data coverage rather than compressing them into an unvalidated confidence score.

Acknowledgements and completion events are operational feedback, not proof of clinical benefit. An astronaut's correction should update dependent results; a dismissal must not rewrite the underlying observations. No automatic learning or rule changes should follow from user feedback without a separate reviewed process.

## 12. Illustrative reasoning traces

These traces describe behavior, not medical thresholds or validated clinical rules.

| Available information | Permitted reasoning and output | Withheld conclusion |
|---|---|---|
| An active fictional measurement plan, a due task, and no completion record. | Explain that completion has not been recorded and offer the scheduled task or a way to correct the record. | That the measurement was definitely missed or the astronaut is ill. |
| Comparable sleep records and a documented individual sleep-plan target. | Show the measured/reported difference, coverage, and applicable plan reference. | A diagnosis, medication suggestion, or duty restriction. |
| A partial fluid log without reliable coverage. | Explain that recorded intake is incomplete; allow completion of the log. | Hydration status or a prescribed intake quantity. |
| A recorded prescription schedule and a matching administration log. | Show the recorded completion and remaining scheduled items from that prescription. | A new dose, substitute medication, or invented missed-dose instruction. |
| A habitat radiation event without personal dosimetry. | Display the environmental event with its location, source, and exposure-data limitation. | Personal accumulated dose or a model-generated shelter instruction. |

## 13. Input-to-output bridge

The engine must connect observations across domains, not merely evaluate each dashboard metric independently. A connection is an evidence-backed relationship with prerequisites and limits, not permission to assume a common cause.

### 13.1. Cross-domain pathways

| Combined inputs | Intermediate reasoning | User-facing output |
|---|---|---|
| Mood reports, bowel symptoms, sleep, nutrition history, available lab results, medications, and applicable plans. | Establish which changes overlap in time; identify missing context and check separately reviewed evidence or plan pathways. Co-occurrence alone does not establish a nutritional deficiency or causal relationship. | A combined symptom timeline, focused follow-up questions, and a review summary. Supplement-specific actions require their own applicable clinical authorization; otherwise no supplement recommendation. |
| Sleep records, perceived fatigue, work schedule, and an individual sleep/rest plan. | Compare compatible observations with the plan and identify scheduling conflicts without inferring duty fitness. | An explained sleep-plan comparison, the relevant planned rest task, and a conflict notice when needed. |
| Exercise logs, reported discomfort, equipment status, and a prescribed exercise plan. | Identify incomplete planned sessions, discomfort associated in time, or unavailable required equipment. | A plan-progress view and a request to review the recorded difficulty or equipment conflict; no automatic exercise substitution. |
| Meal/intake logs, appetite, specimen results where available, and a nutrition plan. | Separate incomplete reporting from a documented plan difference or an independently interpreted lab result. | A nutrition summary, missing-information prompt, or an applicable plan task; no inferred deficiency from logs alone. |
| Medication schedule, administration logs, symptom reports, and authorized follow-up instructions. | Identify recorded schedule status and symptom timing; check whether the follow-up instruction applies. | A medication-history summary and the applicable follow-up task, without declaring causation or changing treatment. |

These are design pathways, not validated medical associations or an exhaustive knowledge base. Each pathway needs its own defined features, evidence, applicability checks, and tests before producing actionable output.

### 13.2. Recommendation package

Publish a structured package that the interface can present consistently:

- **Finding:** what the observations support, linked to the contributing domains and time period.
- **Next step:** a permitted action, a request for information, a review request, or an explicit statement that no recommendation is supported.
- **Basis:** observation IDs, derived features, rule/policy versions, sources, and applicable plan.
- **Limits:** missing or conflicting data, unmet conditions, and unsupported interpretations.
- **Presentation category:** dashboard insight, follow-up question, scheduled task, or notification candidate.
- **Reassessment:** what new information or time boundary requires reevaluation.

The engine supplies the meaning and action eligibility; the interface controls layout and interaction. A notification candidate still passes through notification deduplication and delivery rules. A review request must not be phrased as an instruction to start treatment.

### 13.3. Closing the loop

Recording a new observation, answering an optional question, correcting a record, or completing a plan task triggers reassessment of the dependent pathway. Update or withdraw the previous package with an explanation. This creates a traceable loop:

**inputs -> combined features/context -> supported finding -> permitted next step -> user response -> reassessment**

Completing an action does not prove that the finding resolved; improvement after an action does not prove the action caused it.

## 14. Knowledge lifecycle and verification

Knowledge changes require authoring, source review, applicability review, test cases, and versioned release. Demo-only knowledge must not enter a clinically authorized real-use package; standard demo operation and replay do not confer clinical authorization. Expired, withdrawn, or unsupported rules must not continue producing current recommendations.

Verification has separate layers:

- **Software correctness:** deterministic evaluation, unit/time handling, dependency ordering, corrections, unknown states, conflicts, and mode isolation.
- **Knowledge correctness:** a rule accurately represents its cited claim or authorized plan and respects its scope.
- **Clinical validity:** appropriately qualified evaluation of any medical claim or decision-support behavior; software tests do not provide this.
- **User comprehension:** astronauts or representative users can understand what the result means, what it does not mean, and why an action is offered.

At the same snapshot time, removing required evidence must not strengthen a conclusion. Replaying a scenario must not duplicate action notices within the same replay run. Unsupported rules, malformed knowledge, and engine failures must remain explicit rather than producing success-shaped fallbacks.

## 15. Knowledge acquisition: where rules come from

The knowledge base is a maintained body of sourced, reviewed artifacts, not a list of medical rules embedded in this document or React code. An inference interpreter does not supply medical knowledge or validate it.

| Source | Useful contribution | Restriction |
|---|---|---|
| [NASA HRR Evidence Reports][HRR] | Evidence about spaceflight risks, study populations, countermeasures, and knowledge gaps. | Narrative research is not an executable treatment protocol. Human, animal, ground-analog, and simulation evidence must remain distinguishable. |
| [NASA-STD-3001][STD] | Crew-health requirements and links to human performance, medical operations, and environmental requirements. | Requirements and design limits are not automatically personal diagnostic or treatment thresholds. Pin the applicable revision and section. |
| [NASA medical-care risk-assessment appendix][IMM] | Medical-condition scope and explanation of mission-level probabilistic risk assessment. | The Integrated Medical Model described here supports mission/system planning; incidence estimates are not an individual's diagnosis probability or symptom-to-treatment rules. |
| Current mission-approved procedures and individual care plans | Applicable instructions, constraints, schedules, and authorized actions. | Availability and reuse permission must be established. Do not assume operational checklists are publicly downloadable or current. |
| [WHO SMART Guidelines][WHO] and applicable professional clinical guidelines | A structured approach to translating narrative recommendations into digital decisions; domain-specific guidance where relevant. | Listed WHO domains are not an astronaut-health rule library. Terrestrial guidance requires applicability review, licensing checks, and expert adaptation. |
| [HL7 CPG examples][CPGEX] and shared CQL artifacts | Examples of computable guideline structures and potentially reusable technical patterns. | An example, screening rule, or quality measure is not automatically an appropriate care recommendation. Confirm intent, currency, dependencies, permissions, and population. |

This source review did not identify a complete, validated, openly reusable astronaut-care rule base. Absence of such a library must not be filled with invented clinical rules.

### 15.1. From source to executable knowledge

1. Select a bounded decision pathway and obtain the source document and its revision.
2. Record the exact recommendation or requirement locator, intended population, context, exceptions, and evidence basis. Link to source text rather than copying content without permission.
3. Write a clinician-readable decision table covering inclusion, exclusion, missing information, and permitted outcomes.
4. Resolve ambiguity with a suitably qualified domain reviewer. Unresolved clinical questions block actionable release.
5. Encode the reviewed table into the chosen rule representation and define each required feature.
6. Attach tests for applicable, inapplicable, boundary, unknown, and conflict cases; compare engine outputs with the reviewed table.
7. Release a versioned package with sources, review status, reuse terms, and dependencies.

Automatic extraction or a language model may assist discovery or prepare an authoring draft. Extracted content must not activate itself as medical knowledge.

## 16. Large input space and selective evaluation

A large input vector does not require enumerating every possible input combination. Most pathways use a small subset of observations and context. Shared features and intermediate findings allow reuse without creating one rule for every combination.

### 16.1. Boundaries are one trigger, not the entire model

Distinguish:

- **Invalid input:** wrong type, impossible timestamp, or incompatible unit; a validation issue.
- **Personal baseline difference:** a change from the individual's comparable history.
- **Plan difference:** a result or action differs from an applicable personal target or schedule.
- **Clinical/protocol limit:** a sourced, reviewed limit with explicit context and action authority.
- **Trend or combination:** a temporal pattern or joint condition even when individual values are inside their respective bounds.
- **Missingness or context event:** stale observations, a result becoming available, a plan expiring, or a mission transition.

Each boundary definition needs a source, scope, units, measurement method, time window, exact comparison semantics, and validity period. Do not create a universal "normal" interval for every input. Some inputs are categorical, contextual, or not interpretable in isolation.

### 16.2. Dependency-driven execution

```text
Observation / correction / time / plan / context event
                         |
              changed records and fact keys
                         |
       affected feature and pathway dependencies
                         |
        applicable rules + prerequisite resolution
                         |
            findings and explicit unknowns
                         |
         action eligibility and conflict checks
                         |
         explanation + output lifecycle updates
```

- Index pathways by the indicators, derived facts, plans, and context they depend on.
- Evaluate all dependencies of an affected pathway, not just the input that crossed a boundary.
- Use forward evaluation to refresh affected findings and goal-directed dependency traversal to identify missing prerequisites. This need not require two inference runtimes.
- Partition knowledge into domain packages, such as sleep, nutrition, exercise, and medication-plan support. Cross-domain pathways declare their package dependencies explicitly.
- Cache only against the complete relevant snapshot, including time, context, and knowledge versions. A corrected or expired prerequisite invalidates dependent results.
- Keep independent state dimensions separate:
  - **Knowledge review:** illustrative, reviewed for its declared scope, or rejected; never infer clinical authorization from publication alone.
  - **Knowledge availability:** enabled, withdrawn, or expired, independent of review status.
  - **Applicability:** applicable, not applicable, or unknown.
  - **Condition truth:** satisfied, not satisfied, or unknown.
  - **Action eligibility:** permitted, blocked, or awaiting information.
  - **Result lifecycle:** current, superseded, or withdrawn. "Current" identifies the latest evaluation, not guaranteed freshness of its underlying data.
  - **Execution:** completed, failed, or cancelled.
- Uncovered inputs remain visible as observations with "no applicable interpretation rule," not as evidence that the astronaut is healthy.

This structure reduces unnecessary work but does not guarantee performance or complete medical coverage. Measure evaluation cost against representative data and rule packages before choosing optimizations.

## 17. Rule representation and packaging

Use three distinct artifacts:

1. **Reviewable decision tables:** readable conditions, exceptions, and outcomes for knowledge review.
2. **Executable expressions:** typed, constrained logic interpreted by the selected runtime.
3. **Knowledge manifest:** provenance, versions, applicability, permissions, and tests surrounding that logic.

Decision tables alone do not fully express temporal relationships, so they reference named, tested features or temporal expressions. Expressions alone do not supply review authority or workflow.

### 17.1. Engine-independent contract

| Part | Required information |
|---|---|
| Identity | Package/rule ID, version, kind, schema version, and dependencies. |
| Authority | Source document/revision/locator, supported claim, reviewer status, and reuse terms. |
| Scope | Intended population, mission phase, subject, validity period, data authenticity, and permitted standard-dashboard/replay workspaces. |
| Inputs | Typed observation/feature references, units where relevant, time windows, freshness, method compatibility, and coverage requirements. |
| Conditions | Explicit operators and dependency bindings; no hidden application-state access. |
| Exclusions | Inapplicability, conflicts, and prerequisites that block the conclusion or action. |
| Consequence | Structured finding or action reference, not an arbitrary side effect. |
| Explanation | Traceable condition results, source links, and approved wording/template. |
| Lifecycle | Reevaluation triggers, result identity, supersession, and deduplication semantics. |
| Verification | Positive, negative, unknown, boundary, correction, and conflict fixtures. |

For a custom evaluator, JSON with a validated expression tree is a practical interchange format; YAML can serve as an authoring view. For CQL, the executable expression is ELM. For Prolog, a constrained predicate vocabulary and an explicit adapter supply the same surrounding metadata. These are alternative execution approaches, not a requirement to build three backends or promise automatic translation between them.

### 17.2. Illustrative rule artifact

The following YAML demonstrates structure only. It is not a supported file format, an implemented rule, or a medical protocol. Feature and source IDs refer to hypothetical synthetic fixtures, not NASA guidance.

```yaml
id: demo.measurement-completion-not-recorded
version: 1
kind: data-quality
dataOrigin: synthetic
permittedWorkspaces: [standard-demo, isolated-replay]
source:
  document: synthetic-measurement-plan
  revision: 1
  locator: scheduled-observation-task
  reviewStatus: illustrative
inputs:
  - feature: plan.isApplicable
    type: boolean
  - feature: task.isDue
    type: boolean
  - feature: task.completionStatus
    type: completion-status
  - feature: task.recordCoverageComplete
    type: boolean
when:
  all:
    - equals: [plan.isApplicable, true]
    - equals: [task.isDue, true]
    - equals: [task.recordCoverageComplete, true]
    - equals: [task.completionStatus, not-recorded]
then:
  finding: measurement-completion-not-recorded
  action: offer-record-review
onUnknown: explain-missing-prerequisites
explanation:
  template: completion-record-check
tests:
  fixtureSet: synthetic-measurement-task-cases
```

In this example, `not-recorded` is an explicit status derived from inspected records, not negation of an unknown value. It does not assert that the astronaut failed to perform the measurement.

### 17.3. Evaluation semantics

- Define three-valued logical operators explicitly: `all` is false if any operand is false, true if all are true, otherwise unknown; `any` is true if any operand is true, false if all are false, otherwise unknown; negating unknown remains unknown.
- Keep unknown facts separate from invalid rules or engine exceptions. A runtime failure is an error, not a medical unknown or a successful negative result.
- Match units, methods, subject, and time before numerical comparison; reject unsupported conversions.
- Treat evidence conflicts as structured findings; never silently replace a contradictory observation.
- Preserve proof dependencies for each emitted result; successful execution alone is not an explanation.
- Rules return data. Saving records, creating notices, or changing the UI occurs outside logical evaluation.

## 18. Runtime options

Representation, execution, and medical content are separate choices.

| Approach | Strength | Additional work / limitation |
|---|---|---|
| Typed JSON expressions with a TypeScript evaluator | Fits the application, permits a small auditable operator set, explicit unknown semantics, and direct result traces. | A custom language needs its own specification, validation, temporal features, tests, and authoring tools. It has no automatic clinical interoperability. |
| Restricted Datalog-style rules | Well suited to relationships and reusable derived facts with bounded data-driven inference. | A browser runtime, temporal/quantity support, conflict model, and provenance still need verification. Choosing a restricted subset limits expressiveness. |
| Embedded Prolog, such as [Tau Prolog][TAU] | Browser-compatible relational queries, unification, and goal-directed reasoning. | Missingness, temporal quantities, evidence metadata, termination, and explanations are application responsibilities; Prolog is not a medical knowledge base. |
| [HL7 CQL/ELM][CQL] with [FHIR CPG artifacts][CPG] where useful | Clinical logic representation, temporal/quantity semantics, and an established computable-guideline ecosystem. | More integration work: data/terminology adapters, supported language versions, artifact dependencies, and browser validation. FHIR does not require deploying a FHIR server just to evaluate a locally supplied artifact. |

### 18.1. Embedded Prolog considerations

Tau Prolog's documentation confirms JavaScript implementation and browser support. That establishes feasibility of embedding, not suitability or maintenance assurance for this application.

- A failed query or negation-as-failure must not mean a symptom is absent, a contraindication is excluded, or an intervention is safe. Represent known absence and unknown explicitly.
- Validate and construct terms through controlled interfaces; never concatenate user symptom text into executable queries.
- Restrict the predicate vocabulary and disable unnecessary capabilities, particularly DOM, OS, JavaScript bridging, and network operations. Prolog knowledge must not directly manipulate React or storage.
- Bound inference steps, time, and result counts; surface limit exhaustion distinctly from "no conclusion."
- Isolate evaluation in a worker where feasible and verify cancellation and resource behavior. A worker alone does not make arbitrary imported logic safe.
- Capture application-level proof records and failed prerequisites explicitly; do not assume the interpreter produces a useful clinical explanation.
- Keep numerical feature calculation and time/unit handling in tested modules rather than scattering them across predicates.

### 18.2. CQL execution considerations

HL7 defines CQL as an authoring language and ELM as its machine-readable representation. Its reference-implementation page links a JavaScript execution framework [CQLJS]. Translation can take place during development/build, with validated ELM bundled for local runtime execution; this does not intrinsically require a runtime backend.

The examined `cql-execution` documentation reports incomplete support for CQL 1.4/1.5, while the specification site publishes CQL 2.0. Do not assume compatibility with the latest specification or an arbitrary downloaded artifact. Pin compiler/runtime versions and verify every required operator and model. Browser bundling, package size, terminology availability, tracing, and performance remain acceptance checks, not demonstrated capabilities.

FHIR PlanDefinition/ActivityDefinition and CQL solve different parts of the problem: workflow/action representation versus expression logic. Adopting either does not supply complete clinical content, a conflict policy, or validated spaceflight recommendations.

## 19. Source-backed rule references

This catalog records paraphrased source content and its possible computational interpretation. It is not an activated knowledge package. NASA requirements retain their source scope; workflow adaptations below are Hecatron design interpretations, not NASA-issued software rules. Sources were checked on 14 November 2026.

### 19.1. NASA numerical requirement examples

The [human-performance chapter][PERF] identifies the following requirements in NASA-STD-3001 Volume 1, Revision C, linked from the standard's landing page. Numerical comparisons need suitable measurements, applicable context, freshness and comparability definitions, and qualified review before operational use.

| Reference ID | Source locator | Source requirement, paraphrased | Computational interpretation and output | Limits |
|---|---|---|---|---|
| NASA-AEROBIC-RELATIVE | Section 4.1.3, V1 4003 | Maintain in-mission aerobic capacity at or above 80% of pre-mission capacity. | Given comparable valid VO2max assessments and an applicable mission context, calculate current/pre-mission capacity; a value below 0.80 creates a requirement-comparison finding for review. | Pre-mission capacity must be positive and comparable. This does not select an exercise prescription or establish duty fitness. |
| NASA-AEROBIC-EVA | Sections 4.1.1 and 4.1.2, V1 4001/4002 | In-mission VO2max requirements differ: at least 32.9 mL/min/kg for missions with microgravity EVAs, and 36.5 mL/min/kg for missions with extraterrestrial surface EVAs. | Select requirements from applicable mission activities and compare an eligible assessment; report unmet requirements and their context. | Do not infer the EVA type from an unverified location or silently choose one rule when multiple requirements apply. The relative requirement above is additional, not replaced by this comparison. |
| NASA-MUSCLE-RELATIVE | Section 4.6.2, V1 4024 | Countermeasures maintain in-mission skeletal muscle strength at or above 80% of baseline. | Compare compatible assessments of the same strength metric and report a difference from the requirement. | Do not combine different muscle tests into one percentage or prescribe increased load from the finding. |
| NASA-NUTRIENT-PROVISION | Section 4.5.2, V1 4020 | Programs provide each crew member with 100% of calculated nutrient and energy requirements, individualized by relevant characteristics and activity. | Compare documented provision with authorized calculated requirements over an explicitly defined period; show a provision gap or unknown coverage. | This is a program provision requirement. Food provided, food consumed, nutrients absorbed, and nutritional status are different facts. The source does not supply a complete calculation algorithm or logging window here. |

These are examples of sourced requirement comparisons, not general screening thresholds for the population.

### 19.2. NASA preventive-care and workflow examples

| Reference ID | Source locator | Source content, paraphrased | Hecatron interpretation and permitted output | Missing information / boundary |
|---|---|---|---|---|
| NASA-VITAMIN-D-PLAN | [Health and Medical Care][CARE], sections 3.3/3.4, V1 3002/3003 | Vitamin D supplementation is included in pre-mission prevention and in-mission prevention; the latter names bone and immune function. | Include vitamin D in the preventive-plan review domain. When a current individual plan includes it, present the recorded instructions and scheduled reminders. If no plan is available, mark plan information unavailable for review rather than inventing instructions. | This source does not establish that low mood plus bowel symptoms indicates vitamin D deficiency, or specify an individualized dose, eligibility assessment, or treatment change. |
| NASA-SLEEP-OPPORTUNITY | [Medical Operations][OPS], section 6.1, V1 6001 rationale item 3 | The scheduling rationale recommends an 8.5-hour sleep period, with pre- and post-sleep time also considered. | Compare a proposed schedule's protected sleep opportunity with the applicable adopted plan/reference and explain any mismatch. | This is schedule guidance in a rationale, not a rule that 8.4 hours of reported sleep diagnoses a problem. The binding requirement and its explanatory rationale must be labeled separately. |
| NASA-CRITICAL-TASK-CONFLICT | [Medical Operations][OPS], section 6.1, V1 6001 rationale item 4 | Avoid scheduling critical tasks during the nominal sleep period. | Detect overlap of a documented critical-task interval with the individual's nominal sleep interval and create a schedule-review notice. | Handle dates, time zone/mission time, interval boundaries, and exceptions defined by operations. Do not autonomously move the critical task. |
| NASA-PRIVATE-MEDICAL-CONTACT | [Medical Operations][OPS], section 6.2.1, V1 6002 | Routine private medical communications are scheduled at a frequency determined by the Flight Surgeon for the mission. | Generate contact reminders from the supplied authorized schedule and explain an unrecorded scheduled contact. | The document does not supply a universal daily/weekly interval. No schedule means the engine cannot invent one; reminder display is not communication delivery. |
| NASA-PRIVATE-CONTENT | [Medical Operations][OPS], sections 6.2.2/6.3.2.2, V1 6003/6011 | Medical and psychological communications over spacecraft systems are private. | Treat these as privacy requirements informing access and export policies; suppress sensitive content in shared previews. | This is an application policy requirement, not a physiological inference rule. A frontend role selector cannot establish real multi-user security. |
| NASA-EVA-CLEARANCE-RECORD | [Medical Operations][OPS], section 6.4, V1 6006 | Ground medical support personnel medically clear each crew member before each EVA. | For the source's applicable context, show whether an authorized clearance record for the specific astronaut/EVA is available; missing documentation is a readiness-information gap. | Hecatron does not issue clearance. Lack of a record is not proof of clinical unfitness; deep-space adaptation of this operational requirement cannot be invented. |

### 19.3. WHO decision-table reference

The [WHO pregnancy blood-pressure self-monitoring DAK][WHODAK] publishes an actual [decision-support workbook][WHOTABLE] through its [decision-logic page][WHOLOGIC]. The workbook is versioned 1.0.0; its population is pregnancy, not a generic astronaut population.

**WHO-SMBP-CONTEXT:** table `SMBP.B4.DT.01`, row 1, uses averaged seated systolic and diastolic measurements with specified cutoffs to request additional information about measurement context. Other rows include relevant health-condition context.

The useful design pattern is **measurement condition -> context request -> subsequent interpretation**, not an automatic treatment. The row also illustrates measurement protocol and population-specific eligibility. Do not transplant its cutoffs or combine its columns using guessed AND/OR semantics; table interpretation and the intended guideline require review before encoding. This reference is excluded from an astronaut clinical rule set unless applicability is independently established.

The WHO publication displays a CC BY-NC-SA 3.0 IGO license; check the applicable artifact terms before distributing adapted content. The catalog links and summarizes the example rather than importing its workbook into Hecatron.

### 19.4. HL7 computable-logic references

The following artifacts are explicitly educational or experimental. They demonstrate representation; they are not ready-to-use astronaut-care recommendations.

| Reference ID | Source and locator | Actual logic or workflow, paraphrased | Reusable technical pattern / caution |
|---|---|---|---|
| CQL-SCREENING-ELIGIBILITY | [CQL screening example][SCREEN], expressions `InDemographic`, `SexuallyActive`, `NoScreening`, and `NeedScreening`; see the [example disclaimer][CQLEX]. | A demographic condition, evidence-based-on-records eligibility condition, and absence-of-screening/order/exception conditions combine into an eligibility expression. | Shows shared named expressions, temporal queries, exclusions, and a proposed request. The QUICK model, historical content, sensitive inferences, and incomplete-record assumptions make it unsuitable for direct reuse as astronaut care. |
| CQL-WEIGHT-CHANGE | [Experimental CHF library][CHFLIB], expressions `Current Body Weight`, `Previous Body Weight`, and `Current Body Weight Change`. | Select the most recent eligible weight issued today and the most recent one issued the prior day, then subtract the values. | Shows a temporal feature reusable as a design pattern, not a heart-failure diagnosis. Its use of `issued` time needs review: result-issuance time is not necessarily observation time. Missing values and quantity compatibility need explicit tests. |
| CQL-DAILY-SUMMARY | [Experimental CHF library][CHFLIB], expressions `Daily Body Weight` and `Daily Body Weight Change`. | Form per-day weights using a daily maximum and compare against an earlier available day's weight. | Demonstrates aggregation policy. It is not the same calculation as the current-versus-previous-day expression; naming, window gaps, and sample-selection policy materially change meaning. |
| FHIR-MEASURE-THEN-REPORT | [Experimental CHF PlanDefinition][CHFPLAN] and [ActivityDefinition][CHFACT]. | A periodic daily measurement-related action is followed by reporting after that action ends; the activity references the CQL-derived body-weight-change result. | Shows separation of timing/workflow, task definition, and feature calculation. The hospital CHF population and daily frequency must not be copied as an astronaut plan. |

The CHF library contains terminology comments and reference-resolution TODOs. Its package version is 2.0.0 while its displayed CQL library declares version 1.0.0. Record artifact versions separately; neither a published example nor successful compilation establishes semantic correctness.

### 19.5. Sources without transferable clinical rules

- **HRR evidence and the linked sleep-risk page:** support research context, such as relationships among workload, circadian disruption, and sleep. They do not define a complete numeric trigger and individual treatment. [Sleep-risk reference][SLEEPRISK].
- **NASA's IMM appendix:** supplies mission-level planning examples, not individual symptom-to-diagnosis probabilities.
- **WHO SMART and HL7 CPG approach pages:** describe knowledge engineering and representation; they do not themselves prescribe an astronaut's treatment.
- **CQL specification, compiler, and execution framework:** provide syntax and execution, not a medical knowledge base.
- **Tau Prolog:** provides an interpreter, not clinical rules.

These sources remain valuable references without being misrepresented as rule collections. Mission-specific care plans were not supplied or assumed to have been reviewed.

## 20. CQL integration boundary

CQL is available as a published HL7 specification, with an open-source CQL-to-ELM translator and a JavaScript/TypeScript ELM execution library linked from [HL7's implementation reference][CQLREF]. The engine tooling is Apache-2.0; individual guideline artifacts, terminologies, and value sets can have different terms.

The integration separates authoring/build work from application runtime:

```text
Reviewed decision tables + feature definitions
                         |
             CQL source + knowledge manifest
                         |
        pinned compiler + libraries + terminology
                         |
              validated ELM JSON + fixtures
                         |
                   static bundle
                         |
browser observations/context -> data adapter -> ELM evaluation
                                                    |
                                 findings + applicability results
                                                    |
                              action/conflict/explanation layer
                                                    |
                                      React output components
```

- CQL handles suitable clinical expressions; it does not automatically implement the action lifecycle, scheduling, notifications, or an entire FHIR PlanDefinition workflow.
- A data adapter maps the application records to the model the library expects. A FHIR R4-based library needs correct FHIR resources and terminology semantics; the adapter must not fabricate diagnoses or clinical results to satisfy its queries.
- CQL null handling does not replace completeness metadata. For example, `not exists` over an empty local collection can be true even when the relevant records were never available. Gate such conclusions on known data coverage and expose the reason for an unknown result.
- Compile at development/build time where practical. Bundle needed libraries and permitted terminology locally; no runtime compiler service, terminology credentials, or live guideline lookup is implied.
- Pin compiler, ELM, runtime, model, helper-library, and terminology versions together. The examined runtime documents partial CQL 1.4/1.5 support; the current specification version is not a compatibility guarantee.
- Treat compiler diagnostics, unsupported expressions, missing libraries, evaluation failures, and execution limits as explicit errors. Do not reinterpret them as negative clinical findings.
- Reconstruct user explanations from declared features and rule metadata with source links. Do not assume ELM evaluation yields a complete proof tree.
- Verify browser execution and cancellation against representative fixtures before accepting a runtime. The first release verifies its bounded parameter-only integration; broad library compatibility and clinical validity are not established.
- Apply the shared snapshot, finding, body-association, and notice contracts from the [application architecture](./hecatron-application.md#7-shared-data-contracts). Logical evaluation returns structured data; the application owns persistence, reminders, and notification side effects.

### 20.1. Isolated implementation evidence

The [concept proof](../poc/README.md) compiles authored, parameter-only CQL locally with `@cqframework/cql` 5.6.1 and executes its ELM with `cql-execution` 3.3.2 in Chromium. Tests cover quantity conversion, explicit time, unknowns, coverage-gated absence, and correction reevaluation. These versions are pinned for the spike, not approved for every production artifact.

This newer official JavaScript compiler target removes a Java dependency for the tested compilation path, but is described as beta upstream. The proof does not establish FHIR mapping, terminology coverage, worker cancellation, broad language compatibility, or clinical validity. Its fictional plan and freshness policy must not be mistaken for sourced medical rules.

### 20.2. Application execution profile

The [application](../README.md) adopts the same pinned compiler/runtime for the authored [Hecatron library](../knowledge/Hecatron.cql). Its parameters cover sleep/fatigue, a like-for-like strength comparison, fluid-log coverage, optional private context, and one fictional assessment task. No broad clinical rule catalog is activated.

The application compiles locally, validates primitive result contracts, and executes each saved snapshot in a separate worker with a five-second timeout and cancellation on sign-out. Browser tests exercise timeout/retry and cancellation, while domain tests exercise missing/declined data, freshness, exact threshold equality, corrections, notice retraction, deterministic results, and scoped result publication. These are engineering checks, not clinical validation, terminology support, or permission to import arbitrary CQL.

All emitted next steps are informational, data-management, review, or fictional-plan support. The combination of low mood and bowel discomfort never authorizes supplements. Larger knowledge packages, FHIR/terminology adapters, and clinical-action policies require their own reviewed fixtures and acceptance evidence.

## 21. Source references

Sources checked on 14 November 2026:

- [NASA Human Research Roadmap: Evidence][HRR] — research evidence and its categories.
- [NASA Spaceflight Human System Standard, Volume 1][STD] — requirements and revision links.
- [NASA health/medical-care risk-assessment appendix][IMM] — mission-risk planning context, not patient-specific inference rules.
- [WHO SMART Guidelines][WHO] — the narrative-to-computable knowledge approach and available domain scope.
- [HL7 Clinical Practice Guidelines, STU2][CPG] and [approach][CPGAPP] — computable guidelines and separation of case, plan, and workflow.
- [HL7 CPG examples][CPGEX] — illustrative computable artifacts, not blanket care authorization.
- [HL7 CQL specification][CQL] and [reference implementations][CQLREF] — logic language, ELM, and execution tooling.
- [CQL Execution Framework README][CQLJS] — reported runtime capabilities and limitations.
- [Tau Prolog README][TAU] — browser execution model and integration interfaces.
- [NASA Human Performance][PERF], [Health and Medical Care][CARE], and [Medical Operations][OPS] — exact requirement locators for the reference catalog.
- [WHO self-monitoring DAK][WHODAK], [decision-logic page][WHOLOGIC], and [versioned decision workbook][WHOTABLE] — a population-specific decision-table example.
- [CQL example disclaimer][CQLEX] and [screening artifact][SCREEN] — educational expressions.
- [Experimental CHF library][CHFLIB], [PlanDefinition][CHFPLAN], and [ActivityDefinition][CHFACT] — feature and workflow examples.

[HRR]: https://humanresearchroadmap.nasa.gov/evidence/
[STD]: https://www.nasa.gov/reference/nasa-std-3001v1/
[IMM]: https://www.nasa.gov/reference/appendix-e-health-and-medical-care-technical-requirements/
[WHO]: https://www.who.int/teams/digital-health-and-innovation/smart-guidelines
[CPG]: https://www.hl7.org/fhir/uv/cpg/STU2/index.html
[CPGAPP]: https://www.hl7.org/fhir/uv/cpg/STU2/approach.html
[CPGEX]: https://www.hl7.org/fhir/uv/cpg/STU2/examples.html
[CQL]: https://cql.hl7.org/
[CQLREF]: https://cql.hl7.org/10-c-referenceimplementations.html
[CQLJS]: https://github.com/cqframework/cql-execution
[TAU]: https://github.com/tau-prolog/tau-prolog
[PERF]: https://www.nasa.gov/reference/4-0-human-performance/
[CARE]: https://www.nasa.gov/reference/3-0-health-and-medical-care/
[OPS]: https://www.nasa.gov/reference/6-0-medical-operations/
[WHODAK]: https://www.who.int/publications/i/item/9789240110359
[WHOLOGIC]: https://smart.who.int/dak-smbp/decision-logic.html
[WHOTABLE]: https://smart.who.int/dak-smbp/v1.0.0/SMBP%20DAK_decision-support%20logic.xlsx
[CQLEX]: https://cql.hl7.org/examples.html
[SCREEN]: https://cql.hl7.org/examples/ChlamydiaScreeningCDS.cql
[CHFLIB]: https://www.hl7.org/fhir/uv/cpg/STU2/Library-CHF.html
[CHFPLAN]: https://www.hl7.org/fhir/uv/cpg/STU2/PlanDefinition-chf-bodyweight-change-pd.html
[CHFACT]: https://www.hl7.org/fhir/uv/cpg/STU2/ActivityDefinition-chf-bodyweight-change-ad.html
[SLEEPRISK]: https://www.nasa.gov/reference/risk-from-inadequate-sleep-and-irregular-schedules/
