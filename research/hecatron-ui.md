# Hecatron: interface and user journey

This document defines the primary screen flow and dashboard interactions. It describes interface requirements, not implemented screens. Output semantics are defined in the [functional catalog](./hecatron-outputs.md), interpretation in the [knowledge engine](./hecatron-knowledge-engine.md), and execution constraints in the [application architecture](./hecatron-application.md).

For implemented screens and run instructions, see the [application README](../README.md). The first slice provides the primary journey, body-map dashboard, timeline, routine, evidence, isolated scenarios, settings, and export preview. JSON file download is a browser feature; native file sharing and physical watch presentation are outside the verified release profile.

The public interface is branded **Space Tiger Health Assistant (ST-HA)** with dark-navy surfaces, blue accents, and light text. Amber remains a comparison/review cue rather than an overall medical severity score. **About & credits** is available before sign-in and within workspace navigation, showing the locally bundled Space Tigers logo, its source, technology/research credits, and demonstration limits. Original SVG body artwork and charts use the same palette without changing finding meanings.

## 1. Primary journey

```text
Demo sign-in
     |
Input synchronization and manual check-in
     |
Validate and save an observation snapshot
     |
Evaluate applicable knowledge
     |
Health dashboard
     |
Inspect a body region, finding, measurement, or next step
```

The experience must make the transition from information collection to explanation visible. It must not present staged sensor calls or a local identity simulation as a connection to real spacecraft systems. All public-demo data, including manual entries and individual plans, is synthetic; a standard dashboard session is separate from isolated scenario replay.

## 2. Demo sign-in

- Present fictional astronaut profiles and a clearly labeled simulated sign-in action.
- Use a pseudo identity-provider adapter to establish the selected local persona; do not collect real passwords or fabricate third-party login screens.
- Show the selected astronaut and mission context consistently in the application header.
- Scope observations, pending operations, and results to the selected persona and scenario.
- On sign-out or persona change, cancel pending work and remove the previous persona's information from the visible interface.

This establishes a demonstration session, not a security boundary or authenticated access to medical records. Local data retention and scenario reset are separate controls; signing out must not silently erase history.

## 3. Input synchronization and check-in

### 3.1. Source-aware collection

Display inputs by their actual collection method rather than requiring users to enter the full input vector.

| Source | Interface behavior | Required identification |
|---|---|---|
| Simulated sensor | Show the source, progress, returned records, and any failure; allow an explicit retry. | "Simulated sensor," observation time, last successful retrieval, and scenario. |
| Manual entry | Show the requested indicator, unit or scale, relevant measurement context, validation, and save confirmation. | "Self-reported" or "Manually entered," as appropriate. |
| Imported record | Where supported, preview the file's records and validation issues before committing them. | Source document/device, original timestamps, and import time. |
| Profile or mission context | Display preconfigured information and indicate whether it is editable or scenario-controlled. | Origin and effective period. |
| Derived result | Do not request it as a sensor input; produce it through the engine. | Calculation, contributing records, and rule/version. |

Show source-level status independently: not started, retrieving, retrieved, failed, or unavailable. A failed source must not appear successful because another source completed.

### 3.2. Manual work and continuation

- Identify which information is needed for the selected pathways and which questions are optional.
- Keep optional sensitive check-ins skippable; preserve the distinction between declined, missing, and not applicable.
- Allow users to review what was retrieved and entered before analysis.
- If a source is unavailable, explain what interpretation will be limited. When the workflow permits continuation, require an explicit choice to continue with incomplete data.
- Prevent duplicate submissions while saving or starting an evaluation.
- Do not trigger analysis against unsaved form values or silently mix them with a previous saved snapshot.

The collection screen summarizes what is available; it must not claim that every possible health domain was measured.

## 4. Evaluation and transition

After committing the observation snapshot:

1. Show an analysis state and the snapshot's time and data coverage.
2. Evaluate features, applicable rules, and permitted next steps.
3. Keep the results tied to the same persona, scenario, snapshot, and knowledge version.
4. Open the dashboard when evaluation completes, including when the honest result is "insufficient data."

An engine error is not an insufficient-data conclusion. Show a failure message and retry action; any route to a previous dashboard must clearly identify those results as previous, not newly computed. Avoid fabricated progress percentages or a mandatory artificial delay.

## 5. Dashboard composition

The desktop/tablet dashboard has a persistent context header and two complementary areas:

```text
+--------------------------------------------------------------------+
| Hecatron | Astronaut / mission | Demo mode | Data and analysis times |
+---------------------------+----------------------------------------+
|                           | Attention and next steps               |
| Da Vinci-inspired         +----------------------------------------+
| human figure              | Selected health widgets and trends     |
|                           |                                        |
| Selectable body regions   +----------------------------------------+
| and finding markers       | Notifications and scheduled tasks      |
|                           |                                        |
| Legend / related findings | Selected finding / evidence details    |
+---------------------------+----------------------------------------+
```

The left area is the body navigator; the right area contains health widgets, actionable findings, notifications, and their explanations. Exact proportions, typography, palette, and final widget arrangement are visual-design concerns.

At narrow widths, preserve the relationship using a stacked layout or a body/overview switch rather than shrinking the figure and controls below usable sizes. Essential notices must remain discoverable without relying on the figure.

## 6. Da Vinci-inspired body navigator

### 6.1. Figure and identity

- Use a Da Vinci-inspired human figure with male and female presentation variants.
- Treat the figure variant as a presentation preference; do not infer anatomy, sex-related clinical parameters, or medical history from it.
- Retain equivalent finding navigation and accessibility in either presentation.
- Use original, appropriately licensed, or verified public-domain artwork; the style reference is not permission to reuse a modern derivative image.

### 6.2. What a marker means

A marker means there is information to inspect about a body region or associated system. It does not by itself mean injury, disease, or measured tissue stress.

Distinguish:

- **Reported location:** the astronaut explicitly identified a symptom at that location.
- **System association:** a supported finding relates to a body system but does not localize pathology to an organ.
- **Data limitation:** assessment for a represented system is limited by unavailable or stale information.

Examples:

| Finding | Body-map treatment |
|---|---|
| Reported abdominal discomfort | Mark the reported abdominal region and label it as a symptom report. |
| A supported aerobic-capacity comparison | Associate with the cardiorespiratory system; do not display a damaged heart or diagnose heart disease. |
| Sleep-plan conflict | Keep a whole-person/sleep category available; do not imply a brain lesion or local neurological diagnosis. |
| Missing personal radiation data | Show an exposure-data limitation in a whole-person/context category, not a fabricated affected organ. |

Unmarked regions are **not assessed or have no mapped finding**, not "healthy." Environmental conditions, systemic findings, and routines may have no defensible anatomical location.

### 6.3. Linked interaction

- Select a marker or its equivalent list item to show the associated finding and evidence on the right.
- Selecting a finding/widget also identifies its associated region or system when one exists.
- When several findings map to one region, show a count and a selectable list rather than hiding all but one.
- A finding associated with several regions retains one identity and notification history.
- Provide labels, keyboard access, adequate touch targets, and a text-list alternative. Hover alone must not be required.
- Use text and symbols alongside visual emphasis. Any medical urgency comes from the engine's authorized policy, not from an illustrator's color choice.

Body associations must come from explicit symptom location or reviewed mapping metadata. The rendering layer must not infer them from free text or arbitrary indicator names.

## 7. Widgets, notices, and explanation

The right area serves three different needs:

1. **Measurements:** latest eligible readings, units, freshness, source, and historical context.
2. **Interpretations:** what the engine found, why, and what cannot be concluded.
3. **Actions:** applicable next steps, scheduled reminders, and unresolved application/data issues.

Selecting an item exposes its supporting records, applicable plan/reference, explanation, limitations, and permitted response. Medication and supplement items remain tied to authorized individual plans; a highlighted body region cannot independently generate a treatment.

Differentiate new, acknowledged, completed, withdrawn, and superseded items. Acknowledging a notice must not clear the anatomical finding as if the underlying issue resolved.

## 8. Repeated synchronization and refresh

The interface supports explicit refresh and scheduled retrieval while the application can execute. Collection scheduling, analysis scheduling, and reminder scheduling are distinct responsibilities.

- Show last successful retrieval separately from the latest observation time and latest completed analysis.
- Refresh applicable simulated sensor sources; do not invent new manual responses during polling.
- Preserve manual edits while retrieval/evaluation runs.
- Avoid overlapping sync operations and duplicate source records.
- Keep the dashboard visible during ordinary refresh; do not redirect to check-in after every poll.
- Mark the displayed analysis as previous while newer saved observations await evaluation.
- Publish a coherent result snapshot only if it still matches the active persona/scenario and relevant data revision; stale background completions must not overwrite newer results.
- On returning to the app after inactivity, reassess data freshness and relevant schedules. Do not claim polling continued while the browser suspended execution.
- Expose unavailable sources, retries, and analysis failures without replacing them with reassuring status.

Browser timers are not reliable closed-app or background scheduling guarantees. Polling intervals, visibility handling, cross-tab coordination, and retry policy require explicit implementation decisions.

## 9. Journey verification

The implemented journey must demonstrate:

- Fictional sign-in, source-labeled collection, manual input, analysis, and dashboard transition.
- Male/female figure presentation without changing clinical interpretation.
- Bidirectional selection between findings and body associations, plus an accessible list.
- A finding with no anatomical mapping and a region with multiple findings.
- Partial retrieval, declined optional input, insufficient data, and engine failure as distinct states.
- A manual correction followed by recomputation and updated explanations.
- A refresh that preserves edits and does not duplicate records or notices.
- Persona/scenario changes that prevent stale results from leaking into the new view.
- Reload persistence, explicit scoped reset, and a save failure that neither claims success nor starts inference on uncommitted inputs.

Shared record identities, snapshot publication, and correction/reset behavior follow the [application contracts](./hecatron-application.md#7-shared-data-contracts). The complete input inventory is not a required form; each release must identify its active collection fields and interpreted pathways.
