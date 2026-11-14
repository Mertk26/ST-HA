# Space Tiger Health Assistant documentation

Hecatron is designed as a frontend-only astronaut health-monitoring demonstration using React and TypeScript. Its primary journey is simulated sign-in, source-aware input collection, knowledge evaluation, and an interactive health dashboard.

The application's display name is **Space Tiger Health Assistant (ST-HA)**. Hecatron is its internal design/library codename. The interface uses a dark-blue space theme and credits the Space Tigers team with the supplied logo; see the [application README](../README.md) for branding and asset attribution.

These documents define design requirements and evidence boundaries. They do not establish that a feature is implemented, a device is integrated, or a medical function is clinically validated.

## Documentation map

| Document | Responsibility |
|---|---|
| [Application README](../README.md) | Implemented release scope, local run/test/build commands, data limits, and open deployment/device gates. |
| [Application architecture](./hecatron-application.md) | Technology foundation, shared data contracts, orchestration, persistence, and execution constraints. |
| [Input landscape](./hecatron-inputs.md) | Input meanings, provenance, measurement context, and supporting research. |
| [Knowledge engine](./hecatron-knowledge-engine.md) | Interpretation, action eligibility, rule representation, source-backed examples, and CQL integration requirements. |
| [Output functionality](./hecatron-outputs.md) | User-facing capabilities, notices, tasks, explanations, and simulation behavior. |
| [Interface and journey](./hecatron-ui.md) | Screen flow, body-map navigation, dashboard composition, and interaction states. |
| [Engineering concept proofs](../poc/README.md) | Reproducible CQL/browser checks, Android notification spike, measured results, and unverified device gates. |

Each document owns its subject; linked documents reference that definition rather than introducing a competing rule. Source-backed examples are reference material, not automatically enabled medical knowledge.

## Product and demonstration boundaries

- The core journey includes fictional personas, simulated sensor retrieval, manual entry, analysis, and a dashboard with a left-hand Da Vinci-inspired figure and right-hand findings/widgets.
- Delivery targets include the responsive web application and an Android phone application with notifications mirrored to a compatible Samsung Galaxy Watch running Wear OS. Initial watch indicators are concise status/measurement information in notifications, not a standalone watch dashboard or watch-face widget.
- The wider input and output catalogs describe supported design areas, not a requirement to implement every area in the first release.
- All public demonstration observations, profiles, and individual plans are synthetic. A fictional plan must not be presented as a real prescription or clinician approval.
- Standard dashboard operation and isolated scenario replay are separate workspaces; neither represents live medical use.
- Medical findings, task completion, notification acknowledgement, and application errors have different meanings and lifecycles.
- Research relevance, software correctness, and clinical authorization are distinct. Missing evidence cannot be replaced by an invented diagnosis, dose, or reassuring status.

## Implementation verification

The first application slice implements the primary browser journey using Vite, IndexedDB, CQL/ELM in a bounded worker, and original SVG visualizations. Capacitor Android generation/synchronization is implemented; native APK compilation and physical watch presentation are not verified. The [application README](../README.md) is the implementation-status reference; the wider catalogs remain design requirements rather than delivered-feature claims.

Implementations must demonstrate the [primary journey and its failure states](./hecatron-ui.md#9-journey-verification), preserve [shared contracts](./hecatron-application.md#7-shared-data-contracts), and satisfy the [engine's correctness requirements](./hecatron-knowledge-engine.md#6-correctness-expectations). Changes to behavior must update the document that owns that behavior.

## Challenge delivery

The submission must explain the project as well as demonstrate it; a happy-path recording alone is not the whole submission. Follow the [official project submission guide](https://www.spaceappschallenge.org/resources/project-submission-guide/) and the [challenge requirements](https://www.spaceappschallenge.org/2026/challenges/health-monitoring-software/).

- Provide a publicly accessible project/demo link without requiring judges to supply credentials.
- Prepare the required short demonstration: a video of no more than 30 seconds or a slide presentation of no more than seven slides.
- Explain the problem, implemented solution, use of spaceflight resources, and what the demo does not validate.
- For global-award eligibility, identify at least one NASA dataset/resource actually used and explain its contribution. Synthetic observations are not NASA flight data.
- Attribute research, reusable artifacts, software, and artwork with their applicable licenses; verify access to all submission links before delivery.

### Application artifacts

- Hosted responsive web demo.
- Installable Android test APK, with installation instructions and supported phone/watch configuration.
- Source code, versioned knowledge artifacts, synthetic fixtures, tests, and setup documentation.
- Device-verification evidence showing an Android notification on the selected paired watch, including permission/disconnection limitations.
- Submission presentation and project-page content.

A separate Wear OS application, Google Play publication, iOS build, and watch-sensor integration are outside this initial delivery scope.
