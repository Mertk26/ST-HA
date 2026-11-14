# Space Tiger Health Assistant (ST-HA)

**Mission health, understood.** A local-first, explainable astronaut-health demonstration for the [NASA Space Apps health-monitoring challenge](https://www.spaceappschallenge.org/2026/challenges/health-monitoring-software/).

ST-HA connects source-aware observations to explicit CQL rules, showing what triggered a finding, the supporting records, its source, and its limits. All profiles, observations, and individual plans are fictional. This is not a medical device, autonomous doctor, clinical clearance system, or NASA-endorsed product.

## Run locally

Requires Node **22.18+** and npm. From the project root:

```powershell
npm ci
npm run compile:cql
npm run dev
```

Open the address printed by Vite. Choose **Alex Morgan**, enter the workspace, select **Sync simulated sensors**, then **Save & analyse**. No real credentials or hardware are required. The dashboard presents an original Da Vinci-inspired body navigator alongside measurements, explained findings, history, and fictional tasks.

## Included in this release

- Fictional persona selection with separate local records; no actual IDP or authorization.
- Simulated pulse/handgrip retrieval and manual sleep, intake, fatigue, mood, and digestive check-ins.
- Locally compiled CQL/ELM, executed in a cancellable Web Worker with a five-second limit. No remote inference or custom-rule fallback.
- Male/female figure presentation, mapped findings, whole-person context, source-linked explanations, and historical trends with a table alternative.
- Observation correction lineage, separate finding/task/notice lifecycles, and privacy-filtered JSON export with a preview.
- IndexedDB persistence with revision checks that reject cross-tab overwrites.
- Visible-session refresh every 60 seconds, paused during check-in. With sensor refresh disabled, records are still reassessed as time passes.
- Isolated scenario workspaces: demanding day, recovery, source outage, and engine failure. Replay has its own clock and cannot change standard history.
- Responsive layouts, keyboard-operable region markers, native dialogs, reduced-motion support, and mobile navigation.
- A dark-blue space theme, with the supplied Space Tigers team logo in **About & credits**, accessible from sign-in and the workspace navigation.
- Generated Capacitor Android project and ordinary, inexact native reminder integration. Future pending tasks use stable persona-scoped IDs and generic UTC previews; no health values appear in those previews.

The broad research input/output catalogs are not a claim that every measurement or clinical pathway is implemented.

## Knowledge and data boundaries

The [CQL library](./knowledge/Hecatron.cql) uses a parameter-only System model. It is not a FHIR adapter or a validated astronaut-care knowledge base.

| Demonstrated pathway | Interpretation boundary |
|---|---|
| Sleep below a fictional 8-hour plan, optionally with reported fatigue | Plan review, not diagnosis or medication advice. |
| Handgrip below 80% of a fictional 40 kgf baseline | Illustration of the cited NASA strength-maintenance requirement, not whole-body assessment or fitness clearance. |
| Incomplete/stale fluid logging | Coverage limitation, not dehydration or an intake prescription. |
| Optional digestive discomfort and co-occurring low mood | Review context only; no inferred deficiency or supplement recommendation. |
| Pending assessment task due | Completion not recorded, not proof that the activity was missed. |

The inclusive 24-hour freshness windows are demo policies. Missing, stale, future, and declined records do not become reassuring negative results. Raw historical measurements remain timestamped and may still be displayed after their eligibility for inference expires.

Explanation metadata is authored and linked to observations, not an automatically generated ELM proof tree. Detail dialogs retain the selected evaluation snapshot across refreshes.

## Verify

```powershell
npm test
npm run build
npx playwright install chromium --only-shell
npm run test:browser
```

The browser-install command is needed only if Chromium is missing. Browser tests start/stop a production preview on port **4175**; no long-running server is required.

Verification covers CQL boundaries and unknowns, corrected records, stale-result rejection, notices, tasks, export privacy, native reminder planning, desktop/phone journeys, source/engine/storage failures, cross-tab conflicts, worker timeout/cancellation, and explanation-snapshot consistency. Phone-sized Chromium is not a physical Android/WebView test. The browser journey also checks for unexpected external requests and page errors.

The verified release passes **17 application tests**, **20 desktop/phone browser tests**, strict type-check/production build, and Android asset/plugin synchronization. All **11 existing POC tests** also pass. Desktop and phone dashboard layouts were visually inspected; these checks do not close the native build or hardware gates below.

`npm run build` compiles the authored CQL, rejects compiler diagnostics, type-checks strict TypeScript, and creates the static `dist` site. Current Vite output includes an upstream Lucide `"use client"` directive warning; this is a client-rendered application, not React Server Components.

## Android and Samsung Wear OS

The generated [Android project](./android/) uses Capacitor and local notifications. Install JDK **21**, Android SDK platform **36**, the required build tools, and platform-tools. Review SDK licenses yourself through Android Studio/SDK Manager.

```powershell
$env:JAVA_HOME = 'C:\path\to\jdk-21'
$env:ANDROID_HOME = 'C:\path\to\Android\Sdk'
npm run android:doctor
npm run android:sync
npm run android:build
```

These are Windows PowerShell helper commands. Other platforms can use `npm run android:sync` followed by their Gradle wrapper in the Android directory. A successful debug build produces `android\app\build\outputs\apk\debug\app-debug.apk`.

**Current native gate:** generation/plugin synchronization passes. APK compilation is blocked in the development environment by missing Android SDK platform 36. The corporate security filter explicitly blocked the official Android command-line tools ZIP; downloads were stopped at the user's request. The earlier POC also encountered HTTP 403 while downloading Gradle. No SDK licenses were accepted, and no APK or successful emulator/watch-delivery evidence is included.

On a built and installed Android application:

1. Pair a compatible Samsung Galaxy Watch running Wear OS; enable ST-HA notification mirroring.
2. Open **Settings & devices**, permit notifications, and request a test reminder.
3. Verify phone posting, then separately observe watch presentation. Scheduling success does not confirm delivery.
4. Repeat with permission denied, mirroring disabled, disconnection, and the phone backgrounded/locked.
5. Check tap-to-routine navigation without task completion; verify replacement/cancellation, completed/skipped-task cleanup, sign-out, reset, and replay isolation.

Record device models, OS/WebView versions, pairing settings, build version, and actual results. Reminders are approximate and OS-dependent, not medical alarms. No exact-alarm permission, watch sensors, custom Wear OS app, tiles, or complications are included. Native file sharing is excluded; JSON download is a browser feature, while the Android interface retains the preview. Native lifecycle and presentation behavior remain device-unverified.

## Move to another PC

The source transfer includes the application, pinned npm lockfiles, tests, research documents, logo, CQL sources/model/license, POC scripts, and both generated Android project scaffolds. Keep the `poc` directory: the main application uses its compiler and Android helper.

Dependencies, compiled web assets, downloaded tools, SDKs/JDKs, Gradle caches, emulator images, machine-specific SDK paths, signing keys, and test reports are excluded. Browser-local saved profiles and observations are not part of the source transfer. This is a source handoff, not an offline installer or an APK release; internet access is needed to restore dependencies and native tooling.

1. Extract the archive to a writable folder, for example `C:\dev\st-ha`, and open that folder in VS Code.
2. Install Node 22.18 or newer (the verified environment used 22.20.0) with npm. From the extracted project root:

   ```powershell
   npm ci
   npm test
   npm run build
   npm run dev -- --port 5173 --strictPort
   ```

   Open `http://127.0.0.1:5173`. Stop the server with Ctrl+C. A separate install inside `poc` is only needed to run that standalone proof's own commands, not to build the main app.
3. For browser acceptance, stop the interactive server if no longer needed, then run `npx playwright install chromium --only-shell` and `npm run test:browser` from the root after the production build.
4. For native development, install JDK 21 and Android Studio, SDK platform 36, the build tools requested by Gradle, platform-tools, Android Emulator, and compatible Google-enabled phone/Wear OS system images. Review and accept their licenses yourself. Set `JAVA_HOME` and `ANDROID_HOME` to the new PC's real paths, then use the Android commands above. Do not copy SDK paths from the old PC or disable TLS/security filtering.

### Resume the unfinished phone/watch request

The latest requested expansion is **two separate APKs**, running in paired phone and Wear OS emulators, with the phone loading the frontend development server. This expansion has **not been implemented or verified**; the current native app still uses bundled web assets and phone notifications with potential watch mirroring.

- Implement a minimal native Kotlin/Compose Wear OS companion: review-finding count, upcoming task, last update, and explicit no-data/stale/disconnected states. Keep CQL inference on the phone.
- Add the phone-to-watch Wearable Data Layer bridge for compact, nonprivate synthetic summaries. Use matching application IDs and signing certificates; clear summaries on sign-out/profile changes and isolate replay state.
- Add an explicit development-only Capacitor server configuration. The intended emulator route is `http://localhost:5173` with `adb -s PHONE_SERIAL reverse tcp:5173 tcp:5173` (replace `PHONE_SERIAL` with the actual phone emulator serial). The reverse command alone does not change the current bundled app. Preserve bundled assets for release builds and prevent a development URL/cleartext allowance from leaking into releases.
- Prefer this localhost route over plain HTTP to `10.0.2.2`: the app uses secure-context APIs such as `crypto.randomUUID()`. Verify the origin and live server loading inside the actual phone WebView.
- Build/install both APKs, pair the Google-enabled emulators, and verify real phone-to-watch updates and stale/disconnected behavior. Phone-sized browser tests do not establish native operation.

No watch module, Data Layer bridge, live-server configuration, APKs, or running emulator setup is hidden in excluded files. Start a new assistant session by asking it to read this README and the [research index](./research/README.md), then complete and verify the unfinished request above.

## Local data and deployment

- IndexedDB database: `hecatron-local-v1`. Sign-out closes the in-memory session and clears native reminder requests; it does not delete saved observations.
- Hecatron remains an internal codename in storage, CQL library identifiers, design filenames, and the Android package ID. Display branding is Space Tiger Health Assistant (ST-HA); the rebrand does not reset existing local data or change inference rules. Browser exports use the `st-ha` filename prefix, and the Android launcher label is `ST-HA`.
- **Reset this workspace** requires confirmation and only deletes/recreates the selected workspace. Other profiles and the standard workspace when resetting replay remain unchanged.
- Mood/digestive records and dependent findings are excluded from exports unless explicitly included. Export is a local download, not delivery to medical support.
- Profiles are not security boundaries. There is no application-level encryption, backend, cloud backup/sync, or supported real-patient workflow.
- Serve `dist` from a static HTTPS host. The site uses no CDN fonts, analytics, remote translation, or application API. External evidence links open only when selected.
- No service worker/offline-install guarantee or continuous closed-app inference is provided. Android bundles web assets, but notification behavior still depends on the OS.

Hosting, an Android APK, physical watch evidence, and the submission presentation/project page are separate delivery gates, not artifacts claimed by a passing browser build.

## Project map and attribution

- [Design and source catalog](./research/README.md): architecture, inputs, outputs, knowledge, and UI contracts.
- [Application source](./src/): domain/contracts, fixtures, persistence, worker, native adapter, and React interface.
- [Knowledge source](./knowledge/Hecatron.cql) and [compiler entry point](./scripts/compile-cql.mjs).
- [Browser acceptance tests](./browser-tests/journey.spec.ts) and [domain/inference tests](./src/domain.test.ts).
- [Concept proofs](./poc/README.md): standalone experiments and earlier compatibility/device evidence.

The application compiler and Android helper reuse the proven scripts under `poc`; retain that directory. The pinned System model and its [Apache-2.0 license](./poc/knowledge/CQFRAMEWORK-LICENSE) are vendored there from the official CQL project. The compiler stays out of the shipped application; the CQL runtime runs locally.

NASA references used include [human-performance requirements](https://www.nasa.gov/reference/4-0-human-performance/), [medical operations](https://www.nasa.gov/reference/6-0-medical-operations/), and [HRP risks](https://www.nasa.gov/hrp/risks/). They inform scoped explanations, not synthetic flight data or clinical authorization. Original body artwork is authored SVG, not copied imagery. Third-party dependencies retain their respective licenses; project licensing/publication must be settled before distributing a submission.

The [Space Tigers team logo](./public/space-tiger-team.jpg) was supplied for this project from [the provided Space Apps asset](https://assets.spaceappschallenge.org/media/images/1000065244.2e16d0ba.fill-300x250.jpg). It is bundled unchanged, with source attribution in About & credits; it is not a NASA endorsement.
