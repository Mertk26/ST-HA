# Hecatron interim discussion notes

Working notepad for our discussion; remove before publication. The release profile records implementation choices; older proposals and audit questions below it are retained as discussion history.

## First-release implementation profile

- User authorized application coding after the browser/CQL proofs; native hardware gates remain explicitly open.
- Vite + React/TypeScript, React state, Zod, IndexedDB via `idb`, Lucide icons, original SVG body artwork/charts, Node tests, and Playwright are selected.
- Two fictional personas in Asteria deep-space transit, mission day 42. Inputs: simulated resting pulse/handgrip and manual sleep, intake, fatigue, optional mood/digestive reports.
- The pinned CQL compiler/runtime use the parameter-only System model. No FHIR adapter, Prolog, arbitrary rule import, terminology package, or treatment-selection system is included.
- UTC is used throughout. Standard sessions refresh every 60 seconds while visible, pause source polling during check-in, and use revision-safe saves; isolated replay advances its own clock.
- Corrections retain prior records; notice acknowledgement and task completion do not clear medical findings. Private records/findings are opt-in for browser export.
- Capacitor Android project generation/plugin sync passes. Generic native task previews include a UTC due time, not private measurements. Native file sharing is excluded.
- Android SDK platform 36 is still missing, so no APK or paired-watch proof is delivered. Hosting and submission presentation remain separate delivery work.
- [Application README](../README.md) contains reproducible commands, implemented scope, attribution, and device acceptance steps.

## Suggested first prototype input slice

1. One fictional astronaut and mission phase, with a small documented synthetic history.
2. Manual heart rate, blood pressure, sleep duration, and optional mood; each with time, source, units or scale, and missing-data state.
3. A simple user-entered activity or work/rest context and an illustrative baseline made from synthetic data.
4. A fictional preconfigured measurement reminder and its completion/skip action.
5. A cited educational explanation for the selected spaceflight risk, with clearly labeled illustrative trend logic rather than clinical alert thresholds.

This slice demonstrates collection, storage, longitudinal comparison, explanation, and user response without pretending to integrate medical devices or diagnose. More advanced inputs—radiation instruments, imaging, lab tests, live feeds, and validated protocols—can be explored only after choosing a use case and verifying feasibility and permissions.

## Questions for design discussion

- Which astronaut scenario and mission phase do we want to support first?
- Which decisions should the astronaut be able to make, and which actions must remain outside the prototype?
- Which few indicators can we explain credibly with available evidence and a simulated dataset?
- Is the product a private self-monitor, a crew medical officer's tool, or a shared system? What should each person be allowed to see?
- Which measurements are manual, simulated, imported, or actually available from equipment? What happens when they are missing?
- Which scientific calculations are needed, what evidence supports them, and do they require Python?
- Which sources define safe, authorized guidance for the chosen scenario? If none are available, what should remain informational only?



## Presude IDP

## Health Simulator

## Earlier tooling proposals (superseded by the release profile)

- Vite is the proposed build tool; only React and TypeScript are selected.
- Evaluate IndexedDB for structured local observations and history.
- Start with React state/context unless workflow complexity justifies another state library.
- Choose chart and UI libraries after checking representative interactions, accessibility, and compatibility.
- Versioned JSON interchange and static delivery are architecture requirements; exact import/export scope, hosting provider, and validation tooling remain implementation choices to confirm.
- Android packaging and mirrored notifications to a compatible Samsung Wear OS watch are delivery targets. Packaging tooling remains unselected; offline support, real authentication, cloud synchronization, and real sensor integrations are not committed features. Simulated IDP/sensor calls and active-session refresh belong to the supplied primary journey.

## Documentation convention

All research documents except this notepad use publication-ready reference language. Keep brainstorming, pending choices, and discussion history here. Public documentation must distinguish architectural requirements from verified functionality and must not imply clinical validation.

## Knowledge-engine design discussion

- MYCIN is an analogy for explicit knowledge and explanation, not a requested dependency or an algorithm to reproduce.
- Proposed approach: deterministic numerical features and a separate action-selection layer; evaluate CQL/ELM first given the preference for reusable clinical logic. Versions are now pinned for an isolated POC, not yet selected for unrestricted production use.
- Select one end-to-end scenario before implementing a broad knowledge base.
- Confirm which plans and procedures are fictional demonstration content and which evidence supports educational explanations.
- Decide feature windows, coverage and freshness requirements, baseline compatibility, and rule applicability for that scenario.
- Define the permitted recommendation categories and review requirements before authoring medical action policies.
- Demonstrate unknown/conflicting data and "why no recommendation" alongside a successful rule trace.

### Runtime and knowledge-acquisition evaluation

- The large input vector calls for domain packages and indexed dependencies, not all combinations of inputs or one generic threshold per indicator.
- Source discovery found research, standards, computable-guideline patterns, and runtimes, but not a complete validated open astronaut-care rule library.
- Acquire three representative decision tables before choosing the runtime: a temporal plan comparison, a cross-domain information/review pathway, and a plan-authorized action with exclusions.
- Evaluate CQL/ELM against representative rules before creating a custom expression language. Retain the engine-independent manifest and output contract either way.
- Prolog remains an option, not a selected dependency. Its value must outweigh explicit missing-data, time/unit, proof-trace, and execution-limit integration work.
- Run the same fixtures through any runtime spike; verify unknown vs false, conflicting evidence, expiry, correction retraction, deterministic explanation, cancellation, and browser performance.
- Verify rule-source reuse rights, clinical-review availability, and domain scope before building a large knowledge base.
- POC dependencies are isolated under `poc`; do not treat successful sample execution as approval for arbitrary clinical packages or add other scientific dependencies without a concrete need.

### Decisions before an implementation spike

1. **Operating scope:** information/review and existing-plan support, versus clinically reviewed new-action recommendations. Recommend the former for the public prototype.
2. **Demonstrated pathways:** select a small coherent set, not every input dimension. Candidates include sleep scheduling, measured fitness comparisons, and preventive-plan reminders.
3. **Data model:** FHIR R4 adapter for CQL reuse versus a custom model with less clinical artifact compatibility. Recommend testing a minimal FHIR R4 mapping before committing.
4. **CQL toolchain:** exact compatible compiler/runtime/helper/model versions; local terminology packaging, licenses, and build requirements.
5. **Temporal semantics:** observation versus issued time, mission day/time zone, freshness, coverage, baseline selection, and equality at thresholds.
6. **Recommendation authority:** who reviews content, allowed action categories, what needs an individual prescription/plan, and how conflicts block an action.
7. **Explanation and notices:** finding/recommendation contract, rule trace, deduplication, expiry, and how corrections withdraw results.
8. **Acceptance gate:** browser execution, deterministic replay, incomplete-data behavior, failed evaluation, and measurable responsiveness on the selected demo device.

The source-backed catalog in the engine document contains reference material, not activated rules. NASA explicitly mentions vitamin D in preventive care, but does not support a mood-plus-bowel-symptoms prescription rule.

## UI design and synchronization decisions

- Primary journey supplied by the user: pseudo-IDP login -> simulated sensor sync plus source-aware manual entries -> inference -> dashboard.
- Dashboard direction: Da Vinci-inspired male/female human figure on the left; health widgets and notifications on the right.
- Select the illustration treatment, original/licensed artwork, palette, typography, density, and exact responsive composition.
- Evaluate an interactive SVG for the figure; rendering technology is not selected.
- Define reviewed body-region/system mappings and representation of whole-person findings without implying organ damage.
- Confirm which manual fields appear in the initial check-in and whether entry happens before or alongside source retrieval.
- Define active-session polling intervals, visibility/resume behavior, retries, overlap prevention, source deduplication, and cross-tab coordination.
- Keep polling mechanics as a separate discussion; a service worker or timer must not be presented as reliable continuous background execution.
- Confirm local persona selection/session behavior and clarify that pseudo-IDP calls do not provide real security.

## Documentation audit and coding readiness

This audit covers all public research documents and this notepad.

### Aligned contracts

- The public README indexes document ownership and distinguishes the primary journey from the broader capability catalogs.
- Added missing aerobic-capacity, body-mass, supplement-log, food-provision, stock/expiry, and clearance-record details to the existing input dimensions.
- Collection method, synthetic origin, and standard-dashboard versus replay workspace are separate concepts. No real patient/clinician approval is implied by demo content.
- Knowledge review, applicability, condition truth, action eligibility, result lifecycle, and execution state are distinct.
- Shared source/record identities, committed snapshots, revision checks, body mappings, notice occurrence keys, correction/deletion, and explicit failures are documented.
- CQL/ELM remains the preferred evaluation candidate; TypeScript orchestrates it rather than duplicating clinical rules.

### Remaining choices before their dependent code

| Decision | Required before | Suggested direction, not confirmation |
|---|---|---|
| Initial synthetic scenario, active fields, source assignments, exact rules and expected findings | Fixtures and end-to-end inference integration | One coherent scenario that exercises the supplied journey, multiple body findings, and an unknown-data case. |
| CQL toolchain/model/helper versions and browser acceptance | Runtime dependency installation and rule compilation | A minimal representative CQL/ELM spike; no silent custom-engine fallback. |
| Build, storage, test, chart and UI tooling | The modules using those tools | Vite; evaluate IndexedDB; minimal testing and chart tooling suited to selected workflows. |
| Figure artwork/implementation, palette, typography, and responsive arrangement | Visual dashboard implementation | Original or correctly licensed artwork, accessible region navigation, equivalent male/female variants. |
| Active-session polling interval, time basis, retry and cross-tab strategy | Scheduler implementation | One controlled scheduler, explicit visibility/resume handling, no claims of continuous closed-app work. |
| Plan authority, permitted actions, and review status | Recommendation activation | Synthetic plan support and informational/review outputs; no invented treatment instructions. |
| Measurable browser/device, responsiveness, and accessibility acceptance targets | Final validation | Define the target environment and thresholds alongside the selected implementation slice. |

Architecture/UI scaffolding can begin after selecting its immediate tooling. Full inference integration must not be called ready until scenario semantics and the CQL compatibility gate are satisfied. These choices do not require resolving every item in the broad input/output catalogs.

## Android and Samsung watch implementation choices

- Target an Android phone with a compatible Samsung Galaxy Watch running Wear OS; do not assume older Tizen watches are supported.
- Initial watch scope: mirrored reminders and concise timestamped indicators in notifications. Persistent tiles, watch-face complications, a separate watch app, and watch-sensor retrieval are not included.
- Evaluate Capacitor for Android packaging and local notifications while keeping React/TypeScript and the shared engine. Do not install dependencies before selecting the packaging approach.
- Confirm available physical phone/watch models and OS versions before setting minimum support versions or delivery claims.
- Verify permissions, notification channels, mirroring settings, lock/connection states, background restrictions, and supported notification actions on that pairing.
- Use local Android notifications to preserve the no-application-backend scope. Native reminder scheduling does not imply continuous background inference.
- Resolve native notification identity/cancellation, device-preview privacy, and notification-to-screen navigation before implementation.
- Deliver the responsive hosted demo, Android test APK, source/docs/tests, submission presentation, and real-device notification verification evidence. No separate Wear OS package or store release is currently required.

## Concept proof results

- User authorized proof scripts before application development.
- CQL compilation is possible locally in JavaScript using the official beta-target `@cqframework/cql` 5.6.1 compiler; a Java compiler/service is not needed for this parameter-only path.
- `cql-execution` 3.3.2 ran the resulting ELM in production Chromium bundles. Eleven unit/adapter tests and two desktop/phone-viewport browser checks passed.
- Latest recorded first evaluation: 3.1 ms desktop, 4.5 ms phone viewport on the development machine. This is not physical-phone or broad-package performance.
- Capacitor 8.6.2 plus local-notifications 8.3.1 generated/synced the Android project. Explicitly inexact reminders avoid special exact-alarm permission.
- Native adapter tests use fakes. APK compilation remains blocked by missing Android SDK platform 36 and a Gradle download HTTP 403; physical phone/watch behavior is not verified.
- A portable JDK 21 was downloaded into ignored project-local tooling after the Java 8 build attempt failed; this does not supply the Android SDK or device.
- Reproduction commands, measured results, provenance, scope limits, and the physical acceptance checklist live in the [POC README](../poc/README.md).
- Next gates: complete native build/device proof, validate a representative FHIR/terminology mapping if selected, and establish worker cancellation/scale behavior before production engine adoption.