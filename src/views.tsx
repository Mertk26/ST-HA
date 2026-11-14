import { useEffect, useRef, useState } from 'react';
import {
  ArrowRight, BookOpen, Check, ExternalLink, FlaskConical,
  Orbit, Radio, RefreshCw, ShieldCheck, Watch, WifiOff,
} from 'lucide-react';
import {
  evidence, indicators, personas, type PersonaId, type Scenario, type Workspace,
} from './domain.ts';
import { retrieveSensors, type CheckIn, type Retrieval } from './fixtures.ts';
import { Badge, dateLabel, Empty, Modal, utc } from './components.tsx';
import { isAndroid } from './native.ts';

export function Login({ onSignIn, busy }: { onSignIn: (id: PersonaId) => void; busy: string }) {
  const [selected, setSelected] = useState<PersonaId>('alex');
  const [aboutOpen, setAboutOpen] = useState(false);
  return <main className="login">
    <section className="login-story">
      <a className="brand login-brand" href="#home" aria-label="Space Tiger Health Assistant home"><span className="brand-mark"><Orbit size={25} /></span><span className="brand-name">ST-HA</span></a>
      <p className="product-name">Space Tiger Health Assistant</p>
      <div className="login-orbit" aria-hidden="true"><div className="orbit o1" /><div className="orbit o2" /><div className="orbit o3" /><span className="orbit-core" /><span className="orbit-moon" /><i className="star s1" /><i className="star s2" /><i className="star s3" /></div>
      <div className="login-message"><p className="eyebrow">BUILT FOR THE HUMAN EXPLORER</p><h1>Far from Earth.<br /><em>Closer to yourself.</em></h1><p>A clearer view of your health, the context behind your data, and the next step that makes sense.</p></div>
      <div className="login-story-footer"><span><span className="live-dot" />EXPLAINABLE BY DESIGN</span><span>EARTH / BEYOND</span></div>
    </section>
    <section className="login-access">
      <div className="login-access-inner">
        <Badge tone="mint"><FlaskConical size={13} />SYNTHETIC MISSION DEMO</Badge>
        <h2>Welcome aboard.</h2><p className="muted">Choose a fictional crew profile to explore your mission health workspace.</p>
        <div className="profile-options">{personas.map(profile => <button key={profile.id} className={`profile-option ${selected === profile.id ? 'chosen' : ''}`} onClick={() => setSelected(profile.id)} aria-pressed={selected === profile.id}>
          <span className={`avatar ${profile.id}`}>{profile.initials}</span><span><strong>{profile.name}</strong><span>{profile.role}</span></span><span className="profile-selected">{selected === profile.id && <Check size={14} />}</span>
        </button>)}</div>
        <button className="primary login-enter" disabled={!!busy} onClick={() => onSignIn(selected)}>{busy || 'Enter mission workspace'}<ArrowRight size={17} /></button>
        <p className="login-disclaimer"><ShieldCheck size={17} /><span>Simulated sign-in. No password, backend, or real astronaut records. Your demo data stays on this device unless you export it.</span></p>
        <div className="mission-preview"><div className="mission-icon"><Orbit size={23} /></div><div><span className="eyebrow">ACTIVE DEMONSTRATION</span><strong>Asteria / Deep-space transit</strong><span>Mission day 42 · Microgravity context</span></div></div>
      </div>
      <footer><button className="text-button" onClick={() => setAboutOpen(true)}>About & credits</button><span>Not a medical device</span></footer>
    </section>
    {aboutOpen && <Modal title="About & credits" wide onClose={() => setAboutOpen(false)}><AboutView /></Modal>}
  </main>;
}

export function AboutView() {
  return <section className="card about-card" aria-label="About Space Tiger Health Assistant">
    <figure className="team-identity">
      <img src="/space-tiger-team.jpg" alt="Space Tigers team logo: a space-suited tiger above the team name" width="300" height="250" />
      <figcaption>Space Tigers team</figcaption>
    </figure>
    <div className="about-copy">
      <p className="eyebrow">BUILT BY SPACE TIGERS</p>
      <h2>Space Tiger Health Assistant <span>(ST-HA)</span></h2>
      <p>Mission health, understood. An explainable astronaut-health demonstration connecting observations, evidence, and understandable next steps.</p>
      <h3>Team & artwork</h3>
      <p>Created by the Space Tigers team for the NASA Space Apps Challenge. The team logo was supplied for this project and is bundled locally without modification.</p>
      <a className="source-link" href="https://assets.spaceappschallenge.org/media/images/1000065244.2e16d0ba.fill-300x250.jpg" target="_blank" rel="noreferrer">Original team logo<ExternalLink size={14} /></a>
      <h3>Research & technology credits</h3>
      <p>NASA human-performance requirements, medical-operations references, and Human Research Program resources inform the demonstration. React, TypeScript, CQL/ELM, Capacitor, and Lucide support the application; the body illustration is original SVG artwork.</p>
      <p className="callout">All profiles, records, and plans are fictional. ST-HA is not a medical device, a clinical recommendation service, or a NASA-endorsed product. Research citations do not establish clinical authorization.</p>
    </div>
  </section>;
}

export function CheckInView({ workspace, input, onChange, onSave, onError, busy }: {
  workspace: Workspace; input: CheckIn; onChange: (input: CheckIn) => void;
  onSave: (input: CheckIn, retrieval: Retrieval, partial: boolean) => void;
  onError: (message: string) => void; busy: string;
}) {
  const [retrieval, setRetrieval] = useState<Retrieval | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [failure, setFailure] = useState(workspace.scenario === 'source-gap');
  const [partial, setPartial] = useState(false);
  const controller = useRef<AbortController | null>(null);
  useEffect(() => () => controller.current?.abort(), []);
  const sources = retrieval?.sources ?? workspace.sources;
  const failed = retrieval?.sources.strength.status === 'failed';
  const patch = (change: Partial<CheckIn>) => onChange({ ...input, ...change });
  async function sync() {
    controller.current?.abort();
    const active = new AbortController();
    controller.current = active;
    setSyncing(true);
    try { setRetrieval(await retrieveSensors(workspace, active.signal, failure)); }
    catch (error) { if (!active.signal.aborted) onError(error instanceof Error ? error.message : String(error)); }
    finally { if (!active.signal.aborted) setSyncing(false); }
  }
  return <div className="checkin-layout">
    <section className="card checkin-form"><div className="section-top"><div><p className="eyebrow">01 / YOUR DAILY CHECK-IN</p><h2>A few details. A better picture.</h2></div><Badge>All inputs synthetic</Badge></div>
      <p className="muted">Scenario suggestions are pre-filled. They are fictional, not measurements about you. Review before saving; leave a value blank if unavailable.</p>
      <form onSubmit={event => { event.preventDefault(); if (!retrieval) { onError('Synchronize the simulated sources before analysis.'); return; } onSave(input, retrieval, partial); }}>
        <div className="form-grid">
          <label>Sleep in the last 24 hours<span className="input-unit"><input name="sleep" aria-label="Sleep hours" type="number" min="0" max="24" step="0.1" value={input.sleep ?? ''} onChange={event => patch({ sleep: event.target.value === '' ? null : event.target.valueAsNumber })} /><span>hours</span></span><small>Self-reported · fictional target 8 hours</small></label>
          <label>Fluid intake logged<span className="input-unit"><input aria-label="Fluid intake" type="number" min="0" step="50" value={input.fluid ?? ''} onChange={event => patch({ fluid: event.target.value === '' ? null : event.target.valueAsNumber })} /><span>mL</span></span><small>A record of intake, not hydration status</small></label>
          <label>Perceived fatigue<select aria-label="Perceived fatigue" value={input.fatigue === null ? 'declined' : String(input.fatigue)} onChange={event => patch({ fatigue: event.target.value === 'declined' ? null : event.target.value === 'true' })}><option value="true">Fatigue reported</option><option value="false">No fatigue reported</option><option value="declined">Prefer not to share</option></select><small>Optional self-report</small></label>
          <label>Private mood check-in<select aria-label="Private mood" value={input.mood ?? 'declined'} onChange={event => patch({ mood: event.target.value === 'low' ? 'low' : event.target.value === 'steady' ? 'steady' : null })}><option value="steady">Feeling steady</option><option value="low">Feeling low</option><option value="declined">Prefer not to share</option></select><small>Optional · no psychiatric diagnosis</small></label>
          <label className="span-two">Private digestive check-in<select aria-label="Private digestive check-in" value={input.bowel ?? 'declined'} onChange={event => patch({ bowel: event.target.value === 'discomfort' ? 'discomfort' : event.target.value === 'none' ? 'none' : null })}><option value="none">No abdominal / bowel discomfort reported</option><option value="discomfort">Abdominal / bowel discomfort reported</option><option value="declined">Prefer not to share</option></select><small>Self-report, not a stool or laboratory test</small></label>
        </div>
        <label className="checkbox-row"><input type="checkbox" checked={input.fluidComplete} onChange={event => patch({ fluidComplete: event.target.checked })} /><span>I confirm that this fictional fluid log covers the current logging period.</span></label>
        {failed && <div className="partial-confirm"><p role="alert">{sources.strength.error}</p><label className="checkbox-row"><input type="checkbox" checked={partial} onChange={event => setPartial(event.target.checked)} />Continue with incomplete source data; show interpretation limits.</label></div>}
        <div className="form-footer"><span><ShieldCheck size={14} />Saved locally before analysis · UTC timestamps</span><button className="primary" type="submit" disabled={!retrieval || syncing || !!busy || (!!failed && !partial)}>{busy || 'Save & analyse'}<ArrowRight size={16} /></button></div>
      </form>
    </section>
    <aside className="checkin-aside">
      <section className="card"><p className="eyebrow">02 / CONNECT YOUR CONTEXT</p><h2>Simulated sources</h2><p className="muted small">No hardware connection is made. Each adapter identifies its own records and retrieval state.</p>
        {([['heart', 'Pulse telemetry', 'Resting heart rate'], ['strength', 'Assessment recorder', 'Like-for-like handgrip result']] as const).map(([id, title, detail]) => <div className="source-row" key={id}><span className={`source-symbol ${sources[id].status === 'failed' ? 'failed' : ''}`}>{sources[id].status === 'failed' ? <WifiOff size={19} /> : <Radio size={19} />}</span><div><strong>{title}</strong><span>{detail}</span><span className="source-state">{syncing ? 'Retrieving…' : sources[id].status}{sources[id].retrievedAt && ` · ${utc(sources[id].retrievedAt)} UTC`}</span></div></div>)}
        <button className="secondary full-width" type="button" disabled={syncing || !!busy} onClick={() => void sync()}><RefreshCw size={15} className={syncing ? 'spinning' : ''} />{syncing ? 'Retrieving sources' : retrieval ? 'Retry simulated sync' : 'Sync simulated sensors'}</button>
        <label className="checkbox-row diagnostic"><input type="checkbox" checked={failure} onChange={event => { setFailure(event.target.checked); setRetrieval(null); setPartial(false); }} />Simulate an assessment-source outage</label>
      </section>
      <div className="checkin-note"><BookOpen size={22} /><h3>Context before conclusions.</h3><p>We connect your records to explicit rules, then explain both the finding and its limits. Missing information stays missing.</p><p>Corrections retain the original record. Optional declined questions are not treated as negative results.</p></div>
    </aside>
  </div>;
}

export function EvidenceView() {
  const [query, setQuery] = useState('');
  const matches = evidence.filter(item => `${item.label} ${item.summary} ${item.source}`.toLowerCase().includes(query.toLowerCase()));
  return <><div className="view-intro"><div><p className="eyebrow">THE KNOWLEDGE BEHIND THE NUMBERS</p><h2>Evidence, not a black box.</h2><p>Sources retain their original scope. Research relevance is not clinical authorization.</p></div><label className="search-label">Find evidence<input type="search" placeholder="Search sleep, strength…" value={query} onChange={event => setQuery(event.target.value)} /></label></div>
    <div className="evidence-grid">{matches.map(item => <article className="card evidence-card" key={item.id}><BookOpen size={23} /><Badge>Reference / demo scope</Badge><h3>{item.label}</h3><p className="eyebrow">{item.source}</p><p>{item.summary}</p><div className="callout">{item.limits}</div>{item.url ? <a href={item.url} target="_blank" rel="noreferrer">Read original source<ExternalLink size={14} /></a> : <span className="muted small">Fictional, versioned demo plan. No external authority claimed.</span>}</article>)}</div>
    {!matches.length && <Empty title="No matching source">Try a different search term.</Empty>}
  </>;
}

export function TimelineView({ workspace }: { workspace: Workspace }) {
  const [history, setHistory] = useState(false);
  const [filter, setFilter] = useState('all');
  const rows = workspace.observations.filter(item => (filter === 'all' || filter === item.indicator)
    && (history || !workspace.observations.some(other => other.supersedes === item.id)))
    .sort((a, b) => b.observedAt.localeCompare(a.observedAt) || b.revision - a.revision);
  return <section className="card timeline-card"><div className="section-top"><div><p className="eyebrow">THE RECORD, WITH CONTEXT</p><h2>Your observation timeline</h2></div><Badge>{rows.length} records</Badge></div>
    <div className="table-controls"><label>Indicator<select value={filter} onChange={event => setFilter(event.target.value)}><option value="all">All indicators</option>{Object.entries(indicators).map(([key, item]) => <option value={key} key={key}>{item.label}</option>)}</select></label><label className="checkbox-row"><input type="checkbox" checked={history} onChange={event => setHistory(event.target.checked)} />Include original / corrected revisions</label></div>
    <div className="table-scroll"><table><thead><tr><th>Observation (UTC)</th><th>Indicator</th><th>Recorded value</th><th>Source / revision</th></tr></thead><tbody>{rows.map(item => <tr key={item.id}><td>{dateLabel(item.observedAt)}<small>{utc(item.observedAt)} UTC</small></td><td>{indicators[item.indicator].label}{(item.indicator === 'mood' || item.indicator === 'bowel') && <span className="private-tag">PRIVATE</span>}</td><td>{item.availability !== 'recorded' ? item.availability : `${String(item.value)} ${item.unit === 'scale' || item.unit === 'boolean' ? '' : item.unit}`}</td><td>{item.method === 'sensor' ? 'Simulated sensor' : item.method === 'seed' ? 'Synthetic history' : 'Manual check-in'}<small>r{item.revision}{item.supersedes ? ' · correction' : ''}</small></td></tr>)}</tbody></table></div>
    <p className="fine-print">Synthetic records only. Source IDs, observation times, and correction lineage are retained in the export.</p>
  </section>;
}

const scenarios: { id: Scenario; title: string; tag: string; description: string }[] = [
  { id: 'attention', title: 'A demanding mission day', tag: 'CROSS-DOMAIN', description: 'Shorter sleep, reported fatigue, a strength comparison, and optional digestive context.' },
  { id: 'recovery', title: 'Back to the plan', tag: 'CORRECTION & RECOVERY', description: 'Compare current records with the fictional plan without turning satisfied rules into a health clearance.' },
  { id: 'source-gap', title: 'When a source goes quiet', tag: 'INCOMPLETE DATA', description: 'An assessment adapter fails. Continue explicitly with limited data and inspect the unknown result.' },
  { id: 'engine-fault', title: 'An interrupted analysis', tag: 'EXPLICIT FAILURE', description: 'The engine is intentionally unavailable. Saved observations remain saved; no reassuring result is substituted.' },
];
export function ScenariosView({ onStart }: { onStart: (scenario: Scenario) => void }) {
  return <><div className="view-intro"><div><p className="eyebrow">THE MISSION LAB</p><h2>Explore the “what if”.</h2><p>Isolated, reproducible scenarios. No forecast, digital twin, or changes to your standard demo history.</p></div><FlaskConical size={34} /></div>
    <div className="scenario-grid">{scenarios.map((scenario, index) => <article className="card scenario-card" key={scenario.id}><span className="scenario-number">0{index + 1}</span><Badge>{scenario.tag}</Badge><h3>{scenario.title}</h3><p>{scenario.description}</p><button className="secondary" onClick={() => onStart(scenario.id)}>Open isolated scenario<ArrowRight size={16} /></button></article>)}</div>
  </>;
}

export function SettingsView({ workspace, onEdit, onReset, onTest, nativeStatus }: {
  workspace: Workspace; onEdit: (change: Partial<Pick<Workspace, 'autoRefresh' | 'nativeReminders'>>) => void;
  onReset: () => void; onTest: () => void; nativeStatus: string;
}) {
  return <div className="settings-grid"><section className="card settings-card"><p className="eyebrow">YOUR WORKSPACE</p><h2>Preferences & local data</h2>
    <label className="setting-row"><span><strong>Active-session refresh</strong><small>Refresh simulated sensors every 60 seconds while visible. Pause during check-in; reassess on return.</small></span><input type="checkbox" checked={workspace.autoRefresh} onChange={event => onEdit({ autoRefresh: event.target.checked })} /></label>
    <div className="setting-row"><span><strong>Time basis</strong><small>Observations, plan schedules, and analysis use UTC. Replay uses a separate controllable clock.</small></span><Badge>UTC</Badge></div>
    <div className="setting-row"><span><strong>Local storage</strong><small>{workspace.observations.length} records · workspace revision {workspace.revision}. No cloud backup or cross-device synchronization.</small></span><Badge>IndexedDB</Badge></div>
    <p className="callout">Profiles are not access-control boundaries. Use synthetic data only. Browser storage may be cleared or evicted.</p>
    <button className="danger-button" onClick={onReset}>Reset this workspace</button><p className="fine-print">Requires confirmation. Other personas and the standard workspace remain untouched when resetting replay.</p>
  </section>
  <section className="card settings-card"><Watch size={28} /><p className="eyebrow">A SMALLER SCREEN, THE SAME CONTEXT</p><h2>Android & your watch</h2>
    <p>Generic native reminders can mirror from an Android phone to a compatible Samsung Galaxy Watch running Wear OS. Pairing, permission, and settings determine presentation.</p>
    <label className="setting-row"><span><strong>Request device reminders</strong><small>{isAndroid ? 'Approximate future tasks from this fictional plan. No special exact-alarm permission.' : 'Available only in the Android package, not this browser session.'}</small></span><input type="checkbox" disabled={!isAndroid || workspace.mode === 'replay'} checked={workspace.nativeReminders} onChange={event => onEdit({ nativeReminders: event.target.checked })} /></label>
    <button className="secondary" disabled={!isAndroid || workspace.mode === 'replay'} onClick={onTest}><Watch size={16} />Test watch reminder</button>
    <p className="small" role="status">{nativeStatus || 'Phone posting is not proof of watch delivery. Physical device validation is still required.'}</p>
    <p className="callout">No watch sensor collection, custom watch app, or medical-alarm reliability is claimed. Native APK compilation remains an environment validation gate.</p>
  </section></div>;
}
