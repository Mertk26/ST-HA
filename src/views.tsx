import { useEffect, useRef, useState } from 'react';
import {
  Activity, ArrowRight, BookOpen, Brain, CalendarDays, Check, ChevronDown, ClipboardList, CloudSun, Download, Droplets, Dumbbell,
  ExternalLink, Eye, FileText, FlaskConical, Heart, Lightbulb, ListFilter, MapPin, Moon, Orbit, Pill, Radio, Radiation, RefreshCw, Scan,
  ShieldCheck, Thermometer, UserRound, Users, Utensils, Watch, WifiOff, Wind, Wrench,
} from 'lucide-react';
import {
  evidence, indicatorIds, indicators, latest, personas, type Finding, type Indicator, type PersonaId, type Region, type Workspace,
} from './domain.ts';
import { retrieveSensors, type CheckIn, type Retrieval } from './fixtures.ts';
import { Badge, BodyMap, dateLabel, Empty, Findings, MetricDetails, Metrics, Modal, Trend, utc } from './components.tsx';
import { isAndroid } from './native.ts';
import { currentScenarioInputs, makeScenarioPreview, type ScenarioInputs } from './scenario.ts';
import { analyse } from './worker-client.ts';
import { basicRanges, catalogById, catalogInputs, type CatalogIndicator, type CatalogInput } from './input-catalog.ts';

export function Login({ onSignIn, busy }: { onSignIn: (id: PersonaId) => void; busy: string }) {
  const [selected, setSelected] = useState<PersonaId>('alex');
  const [aboutOpen, setAboutOpen] = useState(false);
  const [apkError, setApkError] = useState('');
  const [checkingApk, setCheckingApk] = useState(false);
  async function downloadAndroid() {
    setCheckingApk(true);
    setApkError('');
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    try {
      const response = await fetch(`${import.meta.env.BASE_URL}app-debug.apk`, { method: 'HEAD', signal: controller.signal });
      if (!response.ok || response.headers.get('content-type')?.includes('text/html')) {
        throw new Error('The Android package is not available yet.');
      }
      const link = document.createElement('a');
      link.href = `${import.meta.env.BASE_URL}app-debug.apk`;
      link.download = 'app-debug.apk';
      link.click();
    } catch (reason) {
      console.error(reason);
      setApkError(controller.signal.aborted ? 'Checking the Android package timed out.' : reason instanceof Error ? reason.message : String(reason));
    } finally {
      clearTimeout(timeout);
      setCheckingApk(false);
    }
  }
  return <main className="login">
    <section className="login-story">
      <a className="brand login-brand" href="#home" aria-label="Space Tiger Health Assistant home"><span className="brand-mark"><Orbit size={25} /></span><span className="brand-name">ST-HA</span></a>
      <p className="product-name">Space Tiger Health Assistant</p>
      <div className="login-orbit" aria-hidden="true"><div className="orbit o1" /><div className="orbit o2" /><div className="orbit o3" /><span className="orbit-core" /><span className="orbit-moon" /><i className="star s1" /><i className="star s2" /><i className="star s3" /></div>
      <div className="login-message"><p className="eyebrow">BUILT FOR THE HUMAN EXPLORER</p><h1>Far from Earth.<br /><em>Closer to yourself.</em></h1><p>A clearer view of your health, the context behind your data, and the next step that makes sense.</p></div>
      <div className="login-story-footer"><ArchitectureLink compact /><span>EARTH / BEYOND</span></div>
    </section>
    <section className="login-access">
      <div className="login-access-inner">
        <h2>Welcome aboard.</h2><p className="muted">Choose a profile to open your health workspace.</p>
        <div className="profile-options">{personas.map(profile => <button key={profile.id} className={`profile-option ${selected === profile.id ? 'chosen' : ''}`} onClick={() => setSelected(profile.id)} aria-pressed={selected === profile.id}>
          <span className={`avatar ${profile.id}`}>{profile.initials}</span><span><strong>{profile.name}</strong><span>{profile.role}</span></span><span className="profile-selected">{selected === profile.id && <Check size={14} />}</span>
        </button>)}</div>
        <button className="primary login-enter" disabled={!!busy} onClick={() => onSignIn(selected)}>{busy || 'Enter mission workspace'}<ArrowRight size={17} /></button>
      </div>
      <footer><button className="text-button" onClick={() => setAboutOpen(true)}>About & credits</button><button className="secondary android-download" disabled={checkingApk} onClick={() => void downloadAndroid()}><Download size={16} />{checkingApk ? 'Checking package…' : 'Download Android app'}</button></footer>
      {apkError && <p className="small" role="alert">{apkError}</p>}
    </section>
    {aboutOpen && <Modal title="About & credits" wide onClose={() => setAboutOpen(false)}><AboutView /></Modal>}
  </main>;
}

function ArchitectureLink({ compact = false }: { compact?: boolean }) {
  const [open, setOpen] = useState(false);
  return <>
    <button className={compact ? 'architecture-link compact' : 'architecture-link'} onClick={() => setOpen(true)}>
      {compact && <span className="live-dot" />}{compact ? 'EXPLAINABLE BY DESIGN' : 'Explore how ST-HA works'}{!compact && <ArrowRight size={16} />}
    </button>
    {open && <Modal title="How ST-HA works" wide onClose={() => setOpen(false)}>
      <p className="architecture-intro">Follow the path from health observations to explained findings and next steps.</p>
      <div className="architecture-image-container" tabIndex={0} aria-label="Scrollable system overview diagram">
        <img className="architecture-image" src={`${import.meta.env.BASE_URL}st-ha-how-it-works.svg`} alt="Health measurements, daily wellbeing, personal and mission context flow through a NASA-informed knowledge base and CQL inference engine to dashboard insights, routines, mobile and wearable experiences, and history. Scenario Lab previews changes without saving." />
      </div>
      <p className="architecture-scope-note">The diagram summarizes the input landscape. Some inputs are captured as free-text context rather than evaluated by CQL, sensor readings are simulated, and wearable reminder delivery depends on the device and configuration.</p>
    </Modal>}
  </>;
}

export function AboutView({ onOpenEvidence }: { onOpenEvidence?: () => void }) {
  const [evidenceOpen, setEvidenceOpen] = useState(false);
  return <section className="card about-card" aria-label="About Space Tiger Health Assistant">
    <figure className="team-identity">
      <img src={`${import.meta.env.BASE_URL}space-tiger-team.jpg`} alt="Space Tigers team logo: a space-suited tiger above the team name" width="300" height="250" />
      <figcaption>Space Tigers team</figcaption>
    </figure>
    <div className="about-copy">
      <p className="eyebrow">BUILT BY SPACE TIGERS</p>
      <h2>Space Tiger Health Assistant <span>(ST-HA)</span></h2>
      <p>Mission health, understood. An explainable astronaut-health workspace connecting observations, evidence, and understandable next steps.</p>
      <ArchitectureLink />
      <h3>Team & artwork</h3>
      <p>Created by the Space Tigers team for the NASA Space Apps Challenge. The team logo was supplied for this project and is bundled locally without modification.</p>
      <a className="architecture-link" href="https://assets.spaceappschallenge.org/media/images/1000065244.2e16d0ba.fill-300x250.jpg" target="_blank" rel="noreferrer">Original team logo<ExternalLink size={16} /></a>
      <h3>Research & technology credits</h3>
      <p>NASA human-performance requirements, medical-operations references, and Human Research Program resources inform the application. React, TypeScript, CQL/ELM, Capacitor, and Lucide support the application; the body illustration is original SVG artwork.</p>
      <button className="architecture-link" onClick={() => onOpenEvidence ? onOpenEvidence() : setEvidenceOpen(true)}>Evidence library<ArrowRight size={16} /></button>
      <p className="callout">This is a demonstration: profiles, example sensor readings, and plans are fictional. Some reference ranges are illustrative estimates, not validated medical or safety limits. Sign-in is local and unauthenticated; no sensors or backend are connected. ST-HA is not a medical device, a clinical recommendation service, or a NASA-endorsed product. Research citations do not establish clinical authorization.</p>
    </div>
    {evidenceOpen && <Modal title="Evidence library" wide onClose={() => setEvidenceOpen(false)}><EvidenceView /></Modal>}
  </section>;
}

export function CheckInView({ workspace, input, onChange, onSave, onError, busy }: {
  workspace: Workspace; input: CheckIn; onChange: (input: CheckIn) => void;
  onSave: (input: CheckIn, retrieval: Retrieval, partial: boolean) => void;
  onError: (message: string) => void; busy: string;
}) {
  const [retrieval, setRetrieval] = useState<Retrieval | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [partial, setPartial] = useState(false);
  const controller = useRef<AbortController | null>(null);
  useEffect(() => () => controller.current?.abort(), []);
  const sources = retrieval?.sources ?? workspace.sources;
  const failed = retrieval?.sources.strength.status === 'failed';
  const guidance = syncing ? 'Loading readings…'
    : busy ? busy
      : !retrieval ? 'Load readings before saving your check-in.'
        : failed && !partial ? 'Confirm how to proceed with incomplete source data.'
          : 'Saved locally before analysis · UTC timestamps';
  const patch = (change: Partial<CheckIn>) => onChange({ ...input, ...change });
  async function sync() {
    controller.current?.abort();
    const active = new AbortController();
    controller.current = active;
    setSyncing(true);
    try { setRetrieval(await retrieveSensors(workspace, active.signal)); }
    catch (error) { if (!active.signal.aborted) onError(error instanceof Error ? error.message : String(error)); }
    finally { if (!active.signal.aborted) setSyncing(false); }
  }
  return <form className="card checkin-layout checkin-group" aria-label="Daily check-in and source readings" onSubmit={event => { event.preventDefault(); if (!retrieval) { onError('Load readings before analysis.'); return; } onSave(input, retrieval, partial); }}>
    <section className="checkin-form"><div className="section-top"><div><p className="eyebrow">01 / YOUR DAILY CHECK-IN</p><h2>A few details. A better picture.</h2></div></div>
      <p className="muted">Review your entries before saving; leave a value blank if unavailable.</p>
      <div className="form-grid">
        <label>Sleep in the last 24 hours<span className="input-unit"><input name="sleep" aria-label="Sleep hours" type="number" min="0" max="24" step="0.1" value={input.sleep ?? ''} onChange={event => patch({ sleep: event.target.value === '' ? null : event.target.valueAsNumber })} /><span>hours</span></span><small>Self-reported · 8-hour reference target</small></label>
        <label>Fluid intake logged<span className="input-unit"><input aria-label="Fluid intake" type="number" min="0" step="50" value={input.fluid ?? ''} onChange={event => patch({ fluid: event.target.value === '' ? null : event.target.valueAsNumber })} /><span>mL</span></span><small>A record of intake, not hydration status</small></label>
        <label>Perceived fatigue<select aria-label="Perceived fatigue" value={input.fatigue === null ? 'declined' : String(input.fatigue)} onChange={event => patch({ fatigue: event.target.value === 'declined' ? null : event.target.value === 'true' })}><option value="true">Fatigue reported</option><option value="false">No fatigue reported</option><option value="declined">Prefer not to share</option></select><small>Optional self-report</small></label>
        <label>Private mood check-in<select aria-label="Private mood" value={input.mood ?? 'declined'} onChange={event => patch({ mood: event.target.value === 'low' ? 'low' : event.target.value === 'steady' ? 'steady' : null })}><option value="steady">Feeling steady</option><option value="low">Feeling low</option><option value="declined">Prefer not to share</option></select><small>Optional · no psychiatric diagnosis</small></label>
        <label className="span-two">Private digestive check-in<select aria-label="Private digestive check-in" value={input.bowel ?? 'declined'} onChange={event => patch({ bowel: event.target.value === 'discomfort' ? 'discomfort' : event.target.value === 'none' ? 'none' : null })}><option value="none">No abdominal / bowel discomfort reported</option><option value="discomfort">Abdominal / bowel discomfort reported</option><option value="declined">Prefer not to share</option></select><small>Self-report, not a laboratory measurement</small></label>
      </div>
    </section>
    <aside className="checkin-aside">
      <section><p className="eyebrow">02 / YOUR SOURCES</p><h2>Source readings</h2>
        {([['heart', 'Pulse telemetry', 'Resting heart rate'], ['strength', 'Assessment recorder', 'Like-for-like handgrip result']] as const).map(([id, title, detail]) => <div className="source-row" key={id}><span className={`source-symbol ${retrieval && sources[id].status === 'failed' ? 'failed' : ''}`}>{retrieval && sources[id].status === 'failed' ? <WifiOff size={19} /> : <Radio size={19} />}</span><div><strong>{title}</strong><span>{detail}</span><span className="source-state">{syncing ? 'Loading…' : !retrieval ? 'Not loaded' : sources[id].status === 'failed' ? 'Unavailable' : 'Ready'}{retrieval && sources[id].retrievedAt && ` · ${utc(sources[id].retrievedAt)} UTC`}</span></div></div>)}
        <button className="secondary full-width" type="button" disabled={syncing || !!busy} onClick={() => void sync()}><RefreshCw size={15} className={syncing ? 'spinning' : ''} />{syncing ? 'Loading readings' : retrieval ? 'Reload readings' : 'Load readings'}</button>
      </section>
    </aside>
    <div className="checkin-actions">
      {failed && <div className="partial-confirm"><p role="alert">{sources.strength.error}</p><label className="checkbox-row"><input type="checkbox" checked={partial} onChange={event => setPartial(event.target.checked)} />Continue with incomplete source data; show interpretation limits.</label></div>}
      <div className="form-footer"><span id="checkin-guidance" role="status"><ShieldCheck size={14} />{guidance}</span><button className="primary" type="submit" aria-describedby="checkin-guidance" disabled={!retrieval || syncing || !!busy || (!!failed && !partial)}>{busy || 'Save & analyse'}<ArrowRight size={16} /></button></div>
    </div>
  </form>;
}

export function EvidenceView() {
  const [query, setQuery] = useState('');
  const matches = evidence.filter(item => `${item.label} ${item.summary} ${item.source}`.toLowerCase().includes(query.toLowerCase()));
  return <><div className="view-intro"><div><p className="eyebrow">THE KNOWLEDGE BEHIND THE NUMBERS</p><h2>Evidence, not a black box.</h2><p>Sources retain their original scope. Research relevance is not clinical authorization.</p></div><label className="search-label">Find evidence<input type="search" placeholder="Search sleep, strength…" value={query} onChange={event => setQuery(event.target.value)} /></label></div>
    <div className="evidence-grid">{matches.map(item => <article className="card evidence-card" key={item.id}><BookOpen size={23} /><Badge>Reference</Badge><h3>{item.label}</h3><p className="eyebrow">{item.source}</p><p>{item.summary}</p><div className="callout">{item.limits}</div>{item.url ? <a href={item.url} target="_blank" rel="noreferrer">Read original source<ExternalLink size={14} /></a> : <span className="muted small">ST-HA reference plan.</span>}</article>)}</div>
    {!matches.length && <Empty title="No matching source">Try a different search term.</Empty>}
  </>;
}

function CatalogIcon({ item }: { item: CatalogInput }) {
  const icons: Record<string, typeof Heart> = {
    systolicPressure: Activity, diastolicPressure: Activity, bodyTemperature: Thermometer,
    bloodGlucose: Droplets, oxygenSaturation: Wind, respiratoryRate: Wind, vision: Eye,
    balance: Activity, aerobicCapacity: Heart, imaging: Scan, biomarkers: FlaskConical,
    bodyMass: UserRound, interventions: Pill, sleepQuality: Moon, stress: Brain,
    cognition: Brain, workload: CalendarDays, exerciseDuration: Dumbbell, exerciseContext: Dumbbell,
    nutrition: Utensils, hydrationSymptoms: Droplets, socialContext: Users, missionPhase: MapPin,
    personalRadiation: Radiation, environmentalRadiation: Radiation, spaceWeather: CloudSun,
    cabinTemperature: Thermometer, cabinOxygen: Wind, cabinCarbonDioxide: Wind, cabinHumidity: Droplets,
    lightNoise: Lightbulb, environmentalSamples: FlaskConical, equipment: Wrench,
    scientificEvidence: BookOpen, procedures: FileText, consent: ShieldCheck, deviceState: Watch,
  };
  const Icon = icons[item.id] ?? (item.scope === 'mission' ? Orbit : item.scope === 'knowledge' ? ClipboardList : Heart);
  return <Icon size={18} aria-hidden="true" />;
}

function IndicatorIcon({ indicator }: { indicator: Indicator }) {
  const definition = catalogById.get(indicator);
  if (definition) return <CatalogIcon item={definition} />;
  const icons: Record<string, typeof Heart> = {
    heartRate: Heart, strength: Dumbbell, sleep: Moon, fluid: Droplets,
    fatigue: Brain, mood: Heart, bowel: Activity,
  };
  const Icon = icons[indicator] ?? Activity;
  return <Icon size={18} aria-hidden="true" />;
}

export function TimelineView({ workspace, onAdd }: { workspace: Workspace; onAdd: (indicator: CatalogIndicator, value: number | string) => Promise<boolean> }) {
  const [history, setHistory] = useState(false);
  const [filter, setFilter] = useState<Indicator | 'all'>('all');
  const filterMenu = useRef<HTMLDetailsElement>(null);
  const [selected, setSelected] = useState<CatalogIndicator>(catalogInputs[0].id);
  const [entry, setEntry] = useState('');
  const definition = catalogById.get(selected)!;
  const rows = workspace.observations.filter(item => (filter === 'all' || filter === item.indicator)
    && (history || !workspace.observations.some(other => other.supersedes === item.id)))
    .sort((a, b) => b.observedAt.localeCompare(a.observedAt) || b.revision - a.revision);
  return <section className="card timeline-card"><div className="section-top"><div><p className="eyebrow">THE RECORD, WITH CONTEXT</p><h2>Your observation timeline</h2></div><Badge>{rows.length} records</Badge></div>
    <details className="catalog-entry"><summary>Add an input</summary><p className="small muted">Enter fictional values only. Mission context and knowledge entries are not personal measurements.</p>
      <div className="table-controls"><label>Input<select value={selected} onChange={event => { setSelected(event.target.value as CatalogIndicator); setEntry(''); }}>{[...new Set(catalogInputs.map(item => item.group))].map(group => <optgroup label={group} key={group}>{catalogInputs.filter(item => item.group === group).map(item => <option value={item.id} key={item.id}>{item.label}</option>)}</optgroup>)}</select></label>
      <label>Value {definition.unit && `(${definition.unit})`}<input type={definition.kind === 'number' ? 'number' : 'text'} step={definition.kind === 'number' ? 'any' : undefined} value={entry} onChange={event => setEntry(event.target.value)} /></label>
      <button className="secondary" disabled={!entry.trim() || (definition.kind === 'number' && !Number.isFinite(Number(entry)))} onClick={() => void onAdd(selected, definition.kind === 'number' ? Number(entry) : entry.trim()).then(saved => { if (saved) setEntry(''); })}>Save input</button></div>
      <p className="small muted">Scope: {definition.scope}. {definition.range ? `Range: ${definition.range[0]}–${definition.range[1]} ${definition.unit}.` : 'No numeric range applies.'}</p>
    </details>
    <p className="small muted">Ranges are demonstration estimates, not medical or safety limits.</p>
    <div className="table-controls"><div className="indicator-filter"><span id="indicator-filter-label">Indicator</span>
      <details ref={filterMenu} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) event.currentTarget.open = false; }} onKeyDown={event => { if (event.key === 'Escape') { event.currentTarget.open = false; event.currentTarget.querySelector('summary')?.focus(); } }}>
        <summary aria-labelledby="indicator-filter-label indicator-filter-value"><span id="indicator-filter-value">{filter === 'all' ? <ListFilter size={18} aria-hidden="true" /> : <IndicatorIcon indicator={filter} />}{filter === 'all' ? 'All indicators' : indicators[filter].label}</span><ChevronDown size={16} aria-hidden="true" /></summary>
        <div className="indicator-options" role="group" aria-label="Indicator options">
          {(['all', ...indicatorIds] as const).map(id => <button key={id} type="button" aria-pressed={filter === id} onClick={() => { setFilter(id); if (filterMenu.current) { filterMenu.current.open = false; filterMenu.current.querySelector('summary')?.focus(); } }}>{id === 'all' ? <ListFilter size={18} aria-hidden="true" /> : <IndicatorIcon indicator={id} />}<span>{id === 'all' ? 'All indicators' : indicators[id].label}</span></button>)}
        </div>
      </details>
    </div><label className="checkbox-row"><input type="checkbox" checked={history} onChange={event => setHistory(event.target.checked)} />Include original / corrected revisions</label></div>
    <div className="table-scroll"><table><thead><tr><th>Observation (UTC)</th><th>Indicator</th><th>Recorded value</th><th>Source / revision</th></tr></thead><tbody>{rows.map(item => {
      const definition = catalogById.get(item.indicator);
      const range = definition?.range ?? basicRanges[item.indicator];
      const outside = workspace.evaluation?.values[`IllustrativeBelow:${item.id}`] ? 'Below range' : workspace.evaluation?.values[`IllustrativeAbove:${item.id}`] ? 'Above range' : null;
      return <tr key={item.id}><td>{dateLabel(item.observedAt)}<small>{utc(item.observedAt)} UTC</small></td><td><span className="timeline-indicator"><IndicatorIcon indicator={item.indicator} /><span>{indicators[item.indicator].label}{(item.indicator === 'mood' || item.indicator === 'bowel' || definition?.scope === 'personal') && <span className="private-tag">PRIVATE</span>}{definition && <small>{definition.scope}</small>}</span></span></td><td>{item.availability !== 'recorded' ? item.availability : `${String(item.value)} ${item.unit === 'scale' || item.unit === 'boolean' ? '' : item.unit}`}{range && <small>Range: {range[0]}–{range[1]} {item.unit}</small>}{outside && <strong className="range-indicator">{outside}</strong>}</td><td>{item.method === 'sensor' ? 'Generated reading' : item.id.includes('/demo/') ? 'Generated demo data' : item.method === 'seed' ? 'Generated history' : 'Manual check-in'}<small>r{item.revision}{item.supersedes ? ' · correction' : ''}</small></td></tr>;
    })}</tbody></table></div>
    <p className="fine-print">Source IDs, observation times, and correction lineage are retained in the export.</p>
  </section>;
}

const scenarioNumbers = [
  { id: 'heartRate', label: 'Resting heart rate', icon: Heart, unit: 'bpm', max: 220, step: 1 },
  { id: 'strength', label: 'Handgrip strength', icon: Dumbbell, unit: 'kgf', max: 100, step: 0.1 },
  { id: 'sleep', label: 'Sleep duration', icon: Moon, unit: 'hours', max: 24, step: 0.1 },
  { id: 'fluid', label: 'Fluid intake', icon: Droplets, unit: 'mL', max: 5000, step: 50 },
] as const;

export function ScenariosView({ workspace }: { workspace: Workspace }) {
  const [baseline] = useState(() => structuredClone(workspace));
  const [current] = useState(() => currentScenarioInputs(baseline));
  const [inputs, setInputs] = useState<ScenarioInputs>(current);
  const [preview, setPreview] = useState<Workspace | null>(null);
  const [pending, setPending] = useState(true);
  const [error, setError] = useState('');
  const [region, setRegion] = useState<Region | null>(null);
  const [evidenceOpen, setEvidenceOpen] = useState(false);
  const [finding, setFinding] = useState<Finding | null>(null);
  const [metric, setMetric] = useState<Indicator | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setPending(true);
    setError('');
    setPreview(null);
    setFinding(null);
    setMetric(null);
    const timer = setTimeout(() => {
      void (async () => {
        try {
          const proposed = makeScenarioPreview(baseline, inputs);
          const evaluation = await analyse(proposed.workspace, proposed.at, controller.signal);
          if (!controller.signal.aborted) setPreview({ ...proposed.workspace, evaluation });
        } catch (reason) {
          if (!controller.signal.aborted) {
            console.error(reason);
            setError(reason instanceof Error ? reason.message : String(reason));
          }
        } finally {
          if (!controller.signal.aborted) setPending(false);
        }
      })();
    }, 250);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [baseline, inputs]);

  const patch = (change: Partial<ScenarioInputs>) => setInputs(value => ({ ...value, ...change }));
  const findings = preview?.evaluation?.findings ?? [];
  return <>
    <div className="view-intro"><div><p className="eyebrow">THE MISSION LAB</p><h2>Explore your next reading.</h2><p>Adjust your current values and see the dashboard update. Your saved records stay unchanged.</p></div><FlaskConical size={34} /></div>
    <section className="card scenario-controls" aria-label="Scenario readings">
      <div className="scenario-controls-head"><div><p className="eyebrow">YOUR NEXT READING</p><h2>Adjust the inputs</h2><p className="muted small">Slider limits are controls, not health thresholds.</p></div><button className="secondary" onClick={() => setInputs(current)}><RefreshCw size={15} />Reset values</button></div>
      <div className="scenario-sliders">{scenarioNumbers.map(({ id, label, icon: Icon, unit, max, step }) => {
        const value = inputs[id];
        const currentValue = current[id];
        const maximum = id === 'sleep' ? max : Math.max(max, Math.ceil(Math.max(value ?? 0, currentValue ?? 0) / step) * step);
        const valid = value !== null && Number.isFinite(value) && value >= 0 && (id !== 'sleep' || value <= 24);
        const range = basicRanges[id]!;
        const observation = preview && latest(preview, id);
        const flag = observation && (preview?.evaluation?.values[`IllustrativeBelow:${observation.id}`] ? 'Below range' : preview?.evaluation?.values[`IllustrativeAbove:${observation.id}`] ? 'Above range' : null);
        return <div className="scenario-slider" key={id}>
          <div className="scenario-slider-head"><label htmlFor={`scenario-${id}`}><Icon size={18} aria-hidden="true" /> {label}</label><span>Current: {currentValue === null ? 'Not recorded' : `${currentValue} ${unit}`}</span></div>
          <div className="scenario-slider-value"><input id={`scenario-${id}`} type="number" min="0" max={id === 'sleep' ? 24 : undefined} step="any" value={value ?? ''} onChange={event => patch({ [id]: event.target.value === '' ? null : event.target.valueAsNumber })} /><span>{unit}</span></div>
          {valid ? <input aria-label={`${label} slider`} type="range" min="0" max={maximum} step={step} value={value} onChange={event => patch({ [id]: event.target.valueAsNumber })} /> : <p className="scenario-range-hint">{value === null ? 'Enter a value to enable the slider.' : 'Enter a valid non-negative value within the supported range.'}</p>}
          <div className="scenario-scale"><span>0</span><span>{maximum} {unit}</span></div>
          <div className="scenario-scale"><span>Range: {range[0]}–{range[1]} {unit}</span>{flag && <strong className="range-indicator">{flag}</strong>}</div>
        </div>;
      })}</div>
      <div className="scenario-context">
        <label><span><Brain size={18} aria-hidden="true" /> Perceived fatigue</span><select value={inputs.fatigue === null ? 'declined' : String(inputs.fatigue)} onChange={event => patch({ fatigue: event.target.value === 'declined' ? null : event.target.value === 'true' })}><option value="declined">Not shared</option><option value="false">No fatigue reported</option><option value="true">Fatigue reported</option></select></label>
        <label><span><Heart size={18} aria-hidden="true" /> Mood check-in</span><select value={inputs.mood ?? 'declined'} onChange={event => patch({ mood: event.target.value === 'steady' ? 'steady' : event.target.value === 'low' ? 'low' : null })}><option value="declined">Not shared</option><option value="steady">Feeling steady</option><option value="low">Feeling low</option></select></label>
        <label><span><Activity size={18} aria-hidden="true" /> Digestive check-in</span><select value={inputs.bowel ?? 'declined'} onChange={event => patch({ bowel: event.target.value === 'none' ? 'none' : event.target.value === 'discomfort' ? 'discomfort' : null })}><option value="declined">Not shared</option><option value="none">No discomfort reported</option><option value="discomfort">Discomfort reported</option></select></label>
      </div>
      <div className="catalog-groups">
        <p className="muted small">Additional inputs are grouped by type. Ranges are demonstration estimates, not medical or safety limits.</p>
        {[...new Set(catalogInputs.map(item => item.group))].map(group => <details className="catalog-group" key={group}>
          <summary>{group} <span>{catalogInputs.filter(item => item.group === group).length} inputs</span></summary>
          <div className="scenario-sliders">{catalogInputs.filter(item => item.group === group).map(item => {
            const value = inputs.extra[item.id];
            const original = current.extra[item.id];
            const range = 'range' in item ? item.range : undefined;
            const observation = preview && latest(preview, item.id);
            const flag = observation && (preview?.evaluation?.values[`IllustrativeBelow:${observation.id}`] ? 'Below range' : preview?.evaluation?.values[`IllustrativeAbove:${observation.id}`] ? 'Above range' : null);
            const change = (next: number | string | null) => patch({ extra: { ...inputs.extra, [item.id]: next } });
            return <div className="scenario-slider catalog-input" key={item.id}>
              <div className="scenario-slider-head"><label htmlFor={`scenario-${item.id}`}><CatalogIcon item={item} /> {item.label}</label><span>Current: {original ?? 'Not recorded'}</span></div>
              <div className="scenario-slider-value"><input id={`scenario-${item.id}`} type={item.kind === 'number' ? 'number' : 'text'} step={item.kind === 'number' ? 'any' : undefined} value={value ?? ''} onChange={event => change(event.target.value === '' ? null : item.kind === 'number' ? event.target.valueAsNumber : event.target.value)} /><span>{item.unit}</span></div>
              {range && typeof value === 'number' && Number.isFinite(value) && <input aria-label={`${item.label} slider`} type="range" min={Math.min(0, range[0], value)} max={Math.max(range[1] * 1.5, value)} step="any" value={value} onChange={event => change(event.target.valueAsNumber)} />}
              {range && <div className="scenario-scale"><span>Range: {range[0]}–{range[1]} {item.unit}</span>{flag && <strong className="range-indicator">{flag}</strong>}</div>}
              <small className="muted">{item.scope} context{!range && ' · no numeric range'}</small>
            </div>;
          })}</div>
        </details>)}
      </div>
    </section>
    <section className="scenario-results" aria-label="Scenario dashboard">
      <div className="section-top"><div><p className="eyebrow">YOUR DASHBOARD</p><h2>What changes?</h2></div><span className="small" role="status">{pending ? 'Updating analysis…' : error ? 'Analysis unavailable' : 'Analysis updated'}</span></div>
      {error && <div className="error-banner" role="alert"><div><strong>Scenario analysis could not be completed.</strong><p>{error}</p></div></div>}
      {preview && <><p className="muted small">Current: {baseline.evaluation ? `${baseline.evaluation.findings.filter(item => item.level === 'review').length} for review` : 'Not analysed'} · Scenario: {findings.filter(item => item.level === 'review').length} for review</p>
        <section className="card scenario-catalog-results"><h3>Additional inputs</h3><p className="muted small">{preview.evaluation?.values['RecordedCatalogInputCount']} recorded or proposed · {preview.evaluation?.values['MissingCatalogInputCount']} not recorded. Text entries are shown as context, not interpreted.</p>
          <div className="catalog-result-grid">{catalogInputs.map(item => {
            const observation = latest(preview, item.id);
            if (!observation || observation.availability !== 'recorded') return null;
            const below = preview.evaluation?.values[`IllustrativeBelow:${observation.id}`];
            const above = preview.evaluation?.values[`IllustrativeAbove:${observation.id}`];
            return <div key={item.id}><CatalogIcon item={item} /><span><strong>{item.label}</strong><small>{String(observation.value)} {item.unit} · {item.scope}{below ? ' · Below range' : above ? ' · Above range' : ''}</small></span></div>;
          })}</div>
          {!catalogInputs.some(item => latest(preview, item.id)?.availability === 'recorded') && <p className="muted small">No additional inputs recorded or proposed.</p>}
        </section>
        <div className="dashboard-grid"><BodyMap workspace={preview} selected={region} onSelect={setRegion} onOpen={setFinding} /><div className="dashboard-right"><Metrics workspace={preview} onSelect={setMetric} /><Findings findings={findings} region={region} onClear={() => setRegion(null)} onOpen={setFinding} /><Trend workspace={preview} /></div></div>
      </>}
    </section>
    {metric && preview && <Modal title={indicators[metric].label} onClose={() => setMetric(null)}><MetricDetails workspace={preview} indicator={metric} /></Modal>}
    {finding && <Modal title={finding.title} onClose={() => setFinding(null)}><p>{finding.summary}</p><h3>Why this appears</h3><dl className="proof-list">{finding.proof.map((item, index) => <div key={index}><dt>{item.label}</dt><dd>{item.value}</dd></div>)}</dl><h3>Next step</h3><p>{finding.nextStep}</p><div className="callout">{finding.limits}</div><button className="text-button" onClick={() => { setFinding(null); setEvidenceOpen(true); }}>View evidence library<ArrowRight size={14} /></button></Modal>}
    {evidenceOpen && <Modal title="Evidence library" wide onClose={() => setEvidenceOpen(false)}><EvidenceView /></Modal>}
  </>;
}

export function SettingsView({ workspace, onEdit, onReset, onTest, nativeStatus }: {
  workspace: Workspace; onEdit: (change: Partial<Pick<Workspace, 'autoRefresh' | 'nativeReminders'>>) => void;
  onReset: () => void; onTest: () => void; nativeStatus: string;
}) {
  return <div className="settings-grid"><section className="card settings-card"><p className="eyebrow">YOUR WORKSPACE</p><h2>Preferences & local data</h2>
    <label className="setting-row"><span><strong>Active-session refresh</strong><small>Refresh local readings every 60 seconds while visible. Pause during check-in; reassess on return.</small></span><input type="checkbox" checked={workspace.autoRefresh} onChange={event => onEdit({ autoRefresh: event.target.checked })} /></label>
    <div className="setting-row"><span><strong>Local storage</strong><small>{workspace.observations.length} records · workspace revision {workspace.revision}. No cloud backup or cross-device synchronization.</small></span><Badge>IndexedDB</Badge></div>
    <p className="callout">Profiles do not protect access to records. Do not enter real health data; browser storage may be cleared or evicted.</p>
    <button className="danger-button" onClick={onReset}>Reset this workspace</button><p className="fine-print">Requires confirmation. Other personas and the standard workspace remain untouched when resetting replay.</p>
  </section>
  <section className="card settings-card"><Watch size={28} /><p className="eyebrow">A SMALLER SCREEN, THE SAME CONTEXT</p><h2>Android & your watch</h2>
    <p>Generic native reminders can mirror from an Android phone to a compatible Samsung Galaxy Watch running Wear OS. Pairing, permission, and settings determine presentation.</p>
    <label className="setting-row"><span><strong>Request device reminders</strong><small>{isAndroid ? 'Approximate reminders for upcoming tasks. No special exact-alarm permission.' : 'Available only in the Android package, not this browser session.'}</small></span><input type="checkbox" disabled={!isAndroid || workspace.mode === 'replay'} checked={workspace.nativeReminders} onChange={event => onEdit({ nativeReminders: event.target.checked })} /></label>
    <button className="secondary" disabled={!isAndroid || workspace.mode === 'replay'} onClick={onTest}><Watch size={16} />Send a reminder</button>
    <p className="small" role="status">{nativeStatus || 'Delivery depends on device pairing and notification settings.'}</p>
    <p className="callout">No watch sensor collection or custom watch app is included. Reminders are not medical alarms.</p>
  </section></div>;
}
