# Hecatron concept proofs

Two isolated engineering spikes, not the finished application or clinically validated knowledge. All observations, plans, rules, and notification content are synthetic. The small TypeScript interface deliberately avoids application scaffolding and React components until the integration risks are understood.

## Verification results

Verified on Windows with Node 22.20.0 on 14 November 2026.

| Gate | Result | What the evidence establishes |
|---|---|---|
| Authored CQL -> JSON ELM | Passed | Local compilation with `@cqframework/cql` 5.6.1 and the pinned System model; compiler diagnostics reject the artifact. No remote translation service or Java compiler is needed. |
| ELM execution | Passed | `cql-execution` 3.3.2 executes the compiled expressions, including quantities and temporal comparisons. |
| Unit/adapter tests | 11 passed | Unit conversion, clock injection, freshness boundaries, unknowns, coverage-gated absence, baseline validity, corrections, compiler rejection, and notification-adapter behavior. |
| TypeScript and production build | Passed | Browser bundle and plugin-facing TypeScript type-check successfully. |
| Production Chromium tests | 2 passed | Desktop and phone-sized viewport; four scenarios each, no external requests, no page errors, no horizontal overflow. Phone viewport is not a physical Android WebView test. |
| Browser first evaluation | Desktop 3.1 ms; phone viewport 4.5 ms | Latest local run of one small parameterized fixture, within the POC's 1,000 ms smoke budget. Not a large-rule-package or real-device performance claim. |
| Capacitor Android generation/sync | Passed | Generated native project includes the local-notifications plugin and bundled web assets. This is not an APK compilation test. |
| Native APK build | Blocked | Android SDK platform 36 is absent. Gradle distribution retrieval also failed with HTTP 403 after resolving Java certificate-store differences. No APK was produced. |
| Phone notification / Samsung watch mirroring | Not verified | No connected Android/Wear OS pairing has been tested. Adapter tests use a fake native port, not a notification emulator. |

The main production JavaScript chunk is approximately 603 kB minified / 140 kB gzipped. Vite reports its standard 500 kB chunk warning. The compiler stays out of the browser bundle; larger-package performance, worker isolation/cancellation, and final loading strategy remain separate acceptance work.

## Reproduce the browser proof

Run in this directory using PowerShell:

```powershell
npm ci
npm test
npm run build
npx playwright install chromium --only-shell
npm run test:browser
npm run dev
```

The last command starts the interactive POC at the local address printed by Vite; stop it with Ctrl+C. Browser tests start and stop their own production preview server on port 4173.

Choose below-plan, missing, stale, or corrected sleep and select **Evaluate CQL**. Results show the explicit snapshot clock/revision, observation reference, source/ELM hashes, named expressions, and an explanation. Native notification controls are disabled in the browser rather than pretending that a browser toast proves watch delivery.

## CQL boundary

- [CQL source](./knowledge/HecatronPoc.cql) is compiled by the [local script](./scripts/compile-cql.mjs). Generated ELM and its manifest are retained under the source directory and regenerated before tests/build.
- This is a **parameter-only System model** proof. It does not establish a FHIR R4 data adapter, terminology-service compatibility, or support for arbitrary CQL artifacts or CQL 2.0.
- The JavaScript compiler target is described as beta upstream; versions are pinned in the manifest and lockfile. Compatibility is established only for the tested expressions.
- Sleep targets and the 24-hour freshness window are fictional test policies, not NASA medical thresholds. Strength values demonstrate guarded arithmetic, not clinical advice.
- Known coverage is required before concluding that task completion was not recorded. Missing evidence is not silently converted to false or zero.
- Explanation dependencies are explicitly authored metadata, not a proof tree automatically recovered from ELM.
- The POC reevaluates corrected snapshots but does not implement production persistence, dependency indexing, notice reconciliation, or authorization.

## Android notification proof

The [generated Android project](./android/) uses Capacitor 8.6.2 and local-notifications 8.3.1. The [adapter](./src/notifications.ts) requests ordinary notification permission, creates a reminder channel, and schedules one approximate reminder about ten seconds ahead.

- Exact alarms are explicitly disabled and their inherited special permission is removed in the app manifest.
- One stable notification ID replaces the previous pending POC reminder. The clear control removes pending and posted POC notifications.
- The payload is generic, contains no measurement/mood details, and is labeled synthetic.
- Scheduling success is reported as **scheduled on phone**, never delivered to the watch.
- Tapping the notification opens the task section without completing a task. This native callback remains device-unverified.
- This single-persona spike has no production sign-in, background inference, replay, or lifecycle scheduler.

### Build prerequisites

Install/select JDK 21, Android SDK platform 36, the Android build tools required by Gradle, and platform-tools. Review and accept Android SDK licenses through Android Studio/SDK Manager; no script accepts them automatically.

```powershell
$env:JAVA_HOME = 'C:\path\to\jdk-21'
$env:ANDROID_HOME = 'C:\path\to\Android\Sdk'
npm run android:doctor
npm run android:build
```

The build command compiles/syncs the web assets before running Gradle. A successful debug build produces `android\app\build\outputs\apk\debug\app-debug.apk`. Set environment paths to real installations; the examples are placeholders.

This session also downloaded a checksum-verified Temurin JDK 21.0.13+9 into the ignored project-local tools directory. The Android script uses it if present and `JAVA_HOME` is unset; it is not redistributed or required at that path. No global Java configuration or trust store was modified. Do not disable TLS validation to work around Gradle download failures.

The application also reuses this helper with an explicit `-ProjectRoot`; omitting that argument continues to target this standalone POC. Its compiler entry point reuses the local `compileCql` function and vendored model without requiring a second compiler service.

### Physical acceptance checklist

1. Record the phone/watch models, Android/Wear OS versions, WebView version, pairing application, and build version.
2. Install the debug APK on the phone; pair a compatible Samsung Galaxy Watch running Wear OS and enable mirroring for Hecatron POC.
3. Grant notification permission and schedule the synthetic reminder. Verify phone posting, then separately observe watch presentation under settings that permit it. Approximate scheduling may be delayed by Android.
4. Repeat with permission denied, mirroring disabled, the watch disconnected, and the phone backgrounded/locked; record actual behavior rather than inferring delivery.
5. Schedule twice and confirm there is only one pending occurrence; clear it before firing and confirm cancellation.
6. Tap the posted notification and confirm navigation without task completion. Check that the small icon and generic preview display correctly.

A watch-shaped browser preview or passing fake-port tests cannot close this gate. No separate Wear OS app, sensor access, backend, or push service is included.

## Sources and licenses

- [Official CQL JavaScript compiler and examples, release 5.6.1](https://github.com/cqframework/clinical_quality_language/tree/v5.6.1/examples/js).
- The unmodified [System model](./knowledge/system-modelinfo.xml) comes from [this pinned source](https://github.com/cqframework/clinical_quality_language/blob/v5.6.1/cql/src/commonMain/resources/org/hl7/elm/r1/system-modelinfo.xml). Its Apache-2.0 [license is included](./knowledge/CQFRAMEWORK-LICENSE).
- [CQL execution framework](https://github.com/cqframework/cql-execution) and [Capacitor local notifications](https://capacitorjs.com/docs/apis/local-notifications) provide the respective runtime/plugin documentation.
- [Android notification bridging](https://developer.android.com/training/wearables/notifications) documents the intended phone-to-Wear-OS path; documentation establishes platform support, not successful Hecatron delivery.

Other dependencies retain their own licenses in their installed distributions. The POC does not settle the final application's license or medical review requirements.
