# Hecatron: technology and application architecture

This document describes Hecatron's technology foundation, architectural responsibilities, and operating constraints. It is an architecture reference, not a record of delivered features.

## 1. Technology foundation

- React and TypeScript.
- Frontend-only application for the initial prototype.
- A browser-accessible experience; mobile and tablet usability matter.
- An Android package sharing the React/TypeScript application, with native phone notifications mirrored to a compatible Samsung Galaxy Watch running Wear OS.
- Scientific interpretation separated from data capture/storage and presentation.

The demonstration journey uses simulated identity-provider and sensor-source calls plus manual input, as defined in the [interface specification](./hecatron-ui.md). These adapters do not provide real authentication or external-device synchronization.

Android packaging and phone-to-watch notification delivery are part of the target architecture. This does not imply offline operation, real identity-provider authentication, cloud synchronization, watch-sensor access, a separate watch application, or native packaging for other platforms.

The [first release](../README.md) uses Vite, React state, Zod contracts, IndexedDB via `idb`, authored SVG charts/body artwork, and CQL/ELM in a Web Worker. Capacitor 8.6.2 and local-notifications 8.3.1 are selected for the generated Android project. Native build/device acceptance remains open; dependency selection is not proof of watch delivery.

## 2. Application layers

| Area | Foundation or requirement | Purpose / boundary |
|---|---|---|
| Client | React and TypeScript | Browser-based application with no required application backend. |
| Presentation | Responsive React components | Usable on desktop, tablet, and mobile screen sizes. |
| Charts | Accessible visualizations with numerical alternatives | Preserve units, context, gaps, and provenance. |
| State | Explicit observation, task, notice, and interface state | Keep original observations distinct from computed results. |
| Persistence | Browser-local structured storage | Handle schema changes, quota, failures, and browser eviction. Local persistence is not a secure clinical record system. |
| Preferences | Preferences separated from clinical observations | Avoid sensitive records in URLs or casual preference storage. |
| Computation | Framework-independent TypeScript orchestration with a replaceable expression evaluator | The first release uses the pinned parameter-only CQL/ELM profile described in the engine reference. Do not duplicate the same clinical rule in TypeScript and CQL. Broader artifact compatibility is a separate gate. |
| Data interchange | Versioned JSON with validation | Export/import supports portability; imported values must be checked, not trusted as TypeScript types. |
| Validation | Engine behavior tests and browser workflow checks | Verify calculations, data handling, and user-visible outcomes. |
| Deployment | Static web hosting | Judges should be able to access the demo without credentials; publish only fictional/synthetic data. |
| Android delivery | Shared web UI/domain logic plus native platform adapters | Capacitor project/plugin synchronization is verified. A compiled test APK and paired-watch presentation still require native build and device validation. |

This table defines responsibilities and constraints; it is not a dependency manifest or a feature-completion checklist.

## 3. Responsibility boundaries

```text
Manual entry / validated import / isolated simulator
                         |
              validation and persistence
                         |
         versioned observations and context
                         |
            knowledge/recommendation engine
                         |
           structured, traceable results
                         |
     dashboards / notices / history / exports
```

User actions such as correction, acknowledgement, and task completion feed back as explicit events. Computed results must remain distinguishable from original observations.

- **Input/storage boundary:** uses the definitions in the [input landscape](./hecatron-inputs.md); preserves source, units, time, quality, and corrections.
- **Engine boundary:** follows the [knowledge-engine responsibilities](./hecatron-knowledge-engine.md); no dependence on React or hidden browser-global state.
- **Presentation boundary:** implements the [output functions](./hecatron-outputs.md); does not create independent clinical rules.
- **Replay boundary:** isolates replay records, clock, results, notices, and resets from the standard demo workspace. Both workspaces use synthetic records.

These are logical boundaries, not a requirement for multiple services, packages, or elaborate abstractions.

## 4. Frontend-only constraints

- Data is local to the browser/device unless the user explicitly exports it. No implied cloud backup, multi-device synchronization, or mission-control connection.
- Browser persistence can fail or be cleared; show failures, offer deliberate export, and explain retention limits.
- No genuine multi-user access enforcement or clinical privacy guarantee is supplied merely by separate screens or a local role selector.
- No secret keys in the browser bundle. External services require a separate feasibility and privacy decision.
- Browser timers do not guarantee closed-app reminders. The Android package can schedule supported local reminders through native APIs, subject to permissions, OS restrictions, and device verification; this does not provide continuous background inference.
- Offline availability requires explicit asset/data caching, update behavior, and disconnected testing; static hosting alone does not provide it.
- Lab/imaging imports depend on supported formats, file size, and parsing capabilities; no device connectivity should be implied without implementation.
- Real astronaut records and real medical use are outside the initial public demonstration.

## 5. Portability

Keeping calculations and domain records independent of UI libraries reduces migration cost but does not make stacks interchangeable.

- Android packaging must preserve the shared application and domain logic. Capacitor is installed and project/plugin synchronization is verified; native builds, permissions, and mobile testing remain separate acceptance work.
- Moving to Expo/React Native could reuse suitable TypeScript logic and data definitions, but web-specific UI, charts, and storage integration may need rewriting.
- Moving calculations to Python requires equivalent behavior, cross-language tests, and an explicit choice of execution environment.
- Versioned import/export preserves data portability even when storage or UI changes.

## 6. Documentation boundaries

- [Inputs](./hecatron-inputs.md): available information, dimensions, and evidence.
- [Outputs](./hecatron-outputs.md): functional behavior and user-facing results.
- [Knowledge engine](./hecatron-knowledge-engine.md): interpretation and recommendation responsibilities.
- [Interface](./hecatron-ui.md): screen flow, body-map navigation, and dashboard interaction.
- This document: stack, execution, persistence, deployment, and portability.

This architecture reference does not prescribe visual composition, branding, or screen layout.

## 7. Shared data contracts

These are logical record requirements, not a library choice or a finalized physical database schema. Definitions must remain consistent across collection, storage, inference, and presentation.

| Record | Shared information |
|---|---|
| Workspace scope | Persona, mission, workspace/scenario identity, data revision, and standard-dashboard versus isolated-replay mode. Public demonstration content remains synthetic in either mode. |
| Source descriptor | Stable source ID, collection method, simulated-versus-real origin, available indicator definitions, retrieval status, and last successful retrieval time. |
| Observation | Stable identity and revision, scope, indicator/value/unit, observation time or interval, recorded/import/result time where relevant, source record reference, method/context, quality, and correction lineage. |
| Availability/coverage | Indicator or source, relevant interval, available/missing/declined/not-applicable state, reason, and known coverage. Missingness is not a fabricated numeric observation. |
| Plan and task | Plan identity/version, scope, explicit authority or fictional-demo status, validity and schedule time basis; task identity, due interval, completion status, and completion evidence where applicable. |
| Evaluation snapshot | Input/context/plan revisions, knowledge manifest/version, explicit evaluation time, scope, and coverage. Results refer to the exact snapshot evaluated. |
| Finding and next step | Stable logical identity, result revision, category, supporting records/features, rule and evidence references, applicability/limitations, optional action, body associations, and reassessment conditions. |
| Body association | Versioned mapping to a reported region, related system, or whole-person/context category; mapping basis and finding reference. No inferred organ damage or clinical parameters from illustration choice. |
| Notice and response | Stable occurrence key, supporting finding/task, audience scope, category, lifecycle, user acknowledgement/postponement, and event times. |

Collection method and authenticity are independent: manual, sensor-adapter, import, or seed identifies how a record entered the app; synthetic versus real identifies its origin. All records in the public demo must be synthetic. References to real sources in the research catalog do not make a fictional observation or care plan real.

The standard dashboard is not a "live patient" mode. Replay has a separate workspace/run identity, clock, and storage scope. Demo-only knowledge can evaluate synthetic standard-dashboard or replay snapshots according to its declared applicability, but cannot become authorized knowledge for real patients.

## 8. Orchestration and lifecycle

- **Collection:** adapters stage validated records with source IDs. Repeated retrieval of the same source record/revision must not insert duplicates; changed revisions preserve correction lineage. Manual entries must not be overwritten merely because a sensor reports the same indicator.
- **Commit:** persist an accepted batch and its coverage/status changes consistently, then advance the data revision. Do not display "saved" or start analysis against a batch whose commit failed.
- **Partial collection:** retain previous records as historical observations with their original times, mark failed/missing source coverage, and require the check-in's explicit continuation policy. Do not relabel old values as newly measured.
- **Evaluation:** pass one committed snapshot and explicit clock to the evaluator. Before publishing, verify that its scope and input/knowledge revisions are still current. Discard outdated completions and schedule evaluation of the current snapshot.
- **Scheduling:** sensor retrieval, time-based rule reevaluation, and task reminders are separate jobs. Prevent overlapping jobs within a session, stop them on sign-out/persona change, and reassess on resume without inventing unseen measurements.
- **Results:** preserve a stable logical finding identity across reevaluations with a new result revision. Retract or supersede unsupported findings and dependent action candidates; retain an understandable history.
- **Notices:** deduplicate by workspace, supporting finding/task, and defined occurrence. A render, refresh, or repeated evaluation is not a new occurrence. Reopening or escalating a notice requires an explicit policy.
- **Reset/deletion:** require an explicit scoped action, cancel affected jobs, remove or recompute dependent results, and update visible notices. Correction history is retained until an explicit deletion/reset; no hidden retained medical history is implied.
- **Failure:** retrieval, validation, storage, and inference errors remain separate. Offer retry where meaningful without silently switching algorithms or substituting a successful synthetic conclusion.

Notice acknowledgement, task completion, finding validity, rule truth, and clinical authorization are independent dimensions. Shared storage accessed from multiple tabs requires explicit coordination or a documented single-writer restriction; a local session guard alone does not provide cross-tab consistency.

## 9. Release and verification boundaries

The [interface journey](./hecatron-ui.md#9-journey-verification) defines the primary acceptance path. Broader input/output catalogs do not automatically expand a release's feature scope.

- Use reproducible synthetic fixtures with explicit source assignments, timestamps, plan/rule versions, and expected findings. Exercise both supported and unknown/unavailable outcomes.
- Verify refresh persistence, same-record sync idempotency, scoped reset, and failure recovery in addition to the happy path.
- Validate the expression runtime in the target browser before activating its rule package. Unsupported CQL must produce a visible incompatibility error, not trigger an undisclosed fallback evaluator.
- Treat offline availability, OS notifications, exports/imports, device integrations, and scenario controls as available only when implemented and tested for that release.
- Verify responsive dashboard behavior, accessible body navigation, and user comprehension alongside numerical correctness.

## 10. Android and Wear OS delivery

The initial pairing is an Android phone and a compatible Samsung Galaxy Watch running Wear OS, not older Tizen-based watches. Declare and test the actual phone/watch models, OS versions, pairing setup, and notification settings before claiming compatibility.

```text
Shared React/TypeScript application and engine
                     |
       Android notification adapter
                     |
          Android OS notification
                     |
       Paired Wear OS watch mirroring
```

- Keep the engine on the main application side. The watch receives a minimal presentation of an existing task or result; it does not independently diagnose or recompute clinical logic.
- Use phone-local notifications for the initial backend-free implementation, not a Web Push sender service. Pre-scheduled reminders and newly evaluated findings have different execution requirements.
- A notification's eligible status content may include a selected synthetic measurement, unit, observation time, and freshness. Watch-face complications, persistent tiles, custom watch screens, and watch sensor retrieval require separate scope and implementation.
- Mirroring depends on pairing, connectivity, permission, and phone/watch settings. Posting on the phone is not proof of watch delivery; do not claim a delivery acknowledgement without evidence.
- The hosted browser demo and installed Android app have separate local storage. Shared code does not provide cross-installation data synchronization.
- Native scheduling must respect persona, workspace, plan version, and notice identity. Cancel or reconcile pending notifications after sign-out, persona change, plan correction, or reset; replay must not schedule device notifications.
- Verify denied permissions, disabled watch mirroring, disconnection, duplicate prevention, stale content, and navigation from a notification. A notification tap/dismissal must not silently complete a task.
- Deliver a test APK with installation instructions and device-verification evidence. A separate Wear OS package or app-store release is not required by this scope.

Platform reference: [Android notifications on Wear OS](https://developer.android.com/training/wearables/notifications). Packaging and notification adapters must be tested in the Android environment; browser tests alone cannot establish watch compatibility.
