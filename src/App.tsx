import { useEffect, useRef, useState } from 'react';
import {
  Activity, ArrowLeft, ArrowRight, Bell, Check, ChevronRight, ClipboardList, Download,
  FlaskConical, Info, LayoutDashboard, LogOut, Menu, Orbit, Pause, Play, Plus, RefreshCw, RotateCcw,
  Settings, ShieldCheck, SkipForward, WifiOff, X,
} from 'lucide-react';
import {
  attachEvaluation, clockOf, evidence, exportReport, indicators, mergeObservations, observationSchema, persona,
  updateTask, type Evaluation, type Finding, type Indicator, type PersonaId, type Region, type Task, type Workspace,
} from './domain.ts';
import { commitCheckIn, defaultCheckIn, makeWorkspace, retrieveSensors, type CheckIn, type Retrieval } from './fixtures.ts';
import { loadWorkspace, removeWorkspace, saveWorkspace } from './storage.ts';
import { analyse } from './worker-client.ts';
import { clearNativeReminders, isAndroid, listenToNativeActions, syncNativeReminders, testWatchReminder } from './native.ts';
import { Badge, BodyMap, dateLabel, Empty, Findings, findingText, MetricDetails, Metrics, Modal, Routine, Trend, utc } from './components.tsx';
import { AboutView, CheckInView, EvidenceView, Login, ScenariosView, SettingsView, TimelineView } from './views.tsx';
import manifest from './knowledge-manifest.json' with { type: 'json' };
import { catalogById, type CatalogIndicator } from './input-catalog.ts';

type View = 'overview' | 'checkin' | 'timeline' | 'routine' | 'evidence' | 'scenarios' | 'settings' | 'about';
const navigation = [
  { id: 'overview', label: 'Health overview', icon: LayoutDashboard },
  { id: 'timeline', label: 'Observation timeline', icon: Activity },
  { id: 'routine', label: 'Your routine', icon: ClipboardList },
  { id: 'scenarios', label: 'Scenario lab', icon: FlaskConical },
  { id: 'about', label: 'About & credits', icon: Info },
] as const;
const pageTitles: Record<View, string> = {
  overview: 'Health overview', checkin: 'Daily check-in', timeline: 'Observation timeline',
  routine: 'Your routine', evidence: 'Evidence library', scenarios: 'Scenario lab', settings: 'Workspace settings', about: 'About & credits',
};

export default function App() {
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const current = useRef<Workspace | null>(null);
  const [view, setView] = useState<View>('overview');
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [draft, setDraft] = useState<CheckIn | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);
  const [findingSelection, setFinding] = useState<{ item: Finding; evaluation: Evaluation } | null>(null);
  const [evidenceOpen, setEvidenceOpen] = useState(false);
  const [metric, setMetric] = useState<Indicator | null>(null);
  const [noticesOpen, setNoticesOpen] = useState(false);
  const [report, setReport] = useState<Workspace | null>(null);
  const [privateExport, setPrivateExport] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [narrow, setNarrow] = useState(() => matchMedia('(max-width:680px)').matches);
  const [playing, setPlaying] = useState(false);
  const [nativeStatus, setNativeStatus] = useState('');
  const controller = useRef<AbortController | null>(null);
  const running = useRef<Promise<void> | null>(null);
  const menuButton = useRef<HTMLButtonElement>(null);
  const sidebar = useRef<HTMLElement>(null);
  const pageHeading = useRef<HTMLHeadingElement>(null);

  function adopt(value: Workspace | null) { current.current = value; setWorkspace(value); }
  function reportError(message: string) { setError(message); }
  async function run(label: string, action: (signal: AbortSignal) => Promise<void>) {
    if (running.current) return;
    const active = new AbortController();
    controller.current = active;
    setBusy(label);
    setError('');
    const operation = (async () => {
      try { await action(active.signal); }
      catch (reason) {
        if (!active.signal.aborted) {
          console.error(reason);
          setError(reason instanceof Error ? reason.message : String(reason));
        }
      } finally {
        running.current = null;
        if (controller.current === active) controller.current = null;
        setBusy('');
      }
    })();
    running.current = operation;
    await operation;
  }
  async function cancelCurrent() { controller.current?.abort(); await running.current; }
  function required() {
    if (!current.current) throw new Error('Open a profile before changing a workspace.');
    return current.current;
  }
  async function persist(value: Workspace, signal: AbortSignal) {
    signal.throwIfAborted();
    const saved = await saveWorkspace(value);
    signal.throwIfAborted();
    adopt(saved);
    return saved;
  }
  async function evaluateSaved(value: Workspace, signal: AbortSignal) {
    setBusy('Analysing saved snapshot…');
    const result = await analyse(value, clockOf(value), signal);
    signal.throwIfAborted();
    return persist(attachEvaluation(value, result), signal);
  }
  function go(next: View) { setView(next); setMobileMenu(false); }

  function signIn(id: PersonaId) {
    void run('Opening local session…', async signal => {
      await Promise.resolve();
      signal.throwIfAborted();
      let value = await loadWorkspace(`${id}/standard`);
      if (!value) value = await saveWorkspace(makeWorkspace(id));
      signal.throwIfAborted();
      adopt(value);
      setDraft(defaultCheckIn(value));
      setSelectedRegion(null);
      go(value.evaluation ? 'overview' : 'checkin');
      if (value.evaluation && (value.evaluation.sourceSha256 !== manifest.sourceSha256
        || Date.now() - Date.parse(value.evaluation.evaluatedAt) > 60_000
        || value.dataRevision !== value.evaluation.dataRevision)) value = await evaluateSaved(value, signal);
      await syncNativeReminders(value);
    });
  }
  async function signOut() {
    setPlaying(false);
    await cancelCurrent();
    await run('Closing local session…', async () => {
      await clearNativeReminders();
      adopt(null); setDraft(null); setFinding(null); setMetric(null); setNoticesOpen(false); setReport(null);
    });
  }
  function saveCheckIn(input: CheckIn, retrieval: Retrieval, partial: boolean) {
    void run('Saving observations…', async signal => {
      if (retrieval.sources.strength.status === 'failed' && !partial) throw new Error('Explicitly confirm continuation with incomplete source data.');
      const saved = await persist(commitCheckIn(required(), input, retrieval), signal);
      const evaluated = await evaluateSaved(saved, signal);
      setSelectedRegion(null);
      go('overview');
      await syncNativeReminders(evaluated);
    });
  }
  function edit(update: (value: Workspace) => Workspace, reevaluate = false, native = false) {
    void run('Saving workspace…', async signal => {
      let saved = await persist(update(required()), signal);
      if (reevaluate) saved = await evaluateSaved(saved, signal);
      if (native) {
        await syncNativeReminders(saved);
        setNativeStatus(saved.nativeReminders ? 'Future reminders requested on Android. Watch delivery remains device-dependent.' : 'Device reminder requests cleared.');
      }
    });
  }
  function refresh(fetchSources = true) {
    void run(fetchSources ? 'Refreshing readings…' : 'Reassessing current records…', async signal => {
      let value = required();
      if (fetchSources) {
        const retrieval = await retrieveSensors(value, signal);
        value = await persist({
          ...value, observations: mergeObservations(value.observations, retrieval.observations),
          sources: retrieval.sources, dataRevision: value.dataRevision + 1, updatedAt: clockOf(value),
        }, signal);
      }
      await evaluateSaved(value, signal);
    });
  }
  function retryAnalysis() {
    void run('Retrying saved analysis…', async signal => { await evaluateSaved(required(), signal); go('overview'); });
  }
  function restoreEngine() {
    void run('Restoring scenario engine…', async signal => {
      const value = required();
      const saved = await persist({ ...value, engineFault: false, dataRevision: value.dataRevision + 1 }, signal);
      await evaluateSaved(saved, signal);
      go('overview');
    });
  }
  function changeTask(id: string, status: Task['status']) {
    edit(value => updateTask(value, id, status, clockOf(value)), true, true);
  }
  async function addCatalogObservation(indicator: CatalogIndicator, result: number | string): Promise<boolean> {
    let saved = false;
    await run('Saving observation…', async signal => {
      const value = required();
      const definition = catalogById.get(indicator);
      if (!definition) throw new Error('Unknown input.');
      const at = clockOf(value);
      const observation = observationSchema.parse({
        id: crypto.randomUUID(), seriesId: `manual/${crypto.randomUUID()}`, revision: 1, supersedes: null,
        indicator, value: result, unit: definition.unit, availability: 'recorded',
        observedAt: at, recordedAt: at, sourceId: 'manual-checkin', method: 'manual', origin: 'synthetic',
      });
      const next = await persist({ ...value, observations: mergeObservations(value.observations, [observation]), dataRevision: value.dataRevision + 1, evaluation: null }, signal);
      saved = true;
      await evaluateSaved(next, signal);
    });
    return saved;
  }
  async function exitReplay() {
    setPlaying(false);
    await cancelCurrent();
    await run('Returning to standard workspace…', async signal => {
      const previous = required();
      const value = await loadWorkspace(`${previous.personaId}/standard`);
      if (!value) throw new Error('The standard workspace is missing. Sign out and open the profile again.');
      const stored = await loadWorkspace(previous.id);
      if (stored) await removeWorkspace(stored);
      signal.throwIfAborted();
      adopt(value); setDraft(defaultCheckIn(value)); setSelectedRegion(null);
      go(value.evaluation ? 'overview' : 'checkin');
      await syncNativeReminders(value);
    });
  }
  function advanceReplay() {
    edit(value => ({ ...value, clock: new Date(Date.parse(clockOf(value)) + 12 * 3_600_000).toISOString(), dataRevision: value.dataRevision + 1 }), true);
  }
  function reset() {
    if (!window.confirm('Reset only this workspace and its correction/notice history? This cannot be undone.')) return;
    void run('Resetting selected workspace…', async signal => {
      const previous = required();
      await clearNativeReminders();
      await removeWorkspace(previous);
      const value = await persist(makeWorkspace(previous.personaId, previous.mode, previous.scenario,
        previous.mode === 'replay' ? previous.createdAt : new Date().toISOString()), signal);
      setPlaying(false); setDraft(defaultCheckIn(value)); setSelectedRegion(null); go('checkin');
    });
  }

  useEffect(() => {
    return listenToNativeActions(scope => {
      if (current.current?.id !== scope) { reportError('This notification belongs to a different or closed workspace. No task was changed.'); return; }
      go('routine');
    }, reportError);
  }, []);
  useEffect(() => () => controller.current?.abort(), []);
  useEffect(() => {
    const query = matchMedia('(max-width:680px)');
    const changed = () => { setNarrow(query.matches); setMobileMenu(false); };
    query.addEventListener('change', changed);
    return () => query.removeEventListener('change', changed);
  }, []);
  useEffect(() => {
    if (!mobileMenu) return;
    sidebar.current?.querySelector<HTMLAnchorElement>('.brand')?.focus();
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { setMobileMenu(false); menuButton.current?.focus(); }
    };
    document.addEventListener('keydown', escape);
    return () => document.removeEventListener('keydown', escape);
  }, [mobileMenu]);
  useEffect(() => {
    pageHeading.current?.focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }, [view, workspace?.id]);
  useEffect(() => {
    if (!workspace || workspace.mode !== 'standard' || view === 'checkin' || view === 'scenarios') return;
    const reassess = () => { if (document.visibilityState === 'visible' && !running.current) refresh(current.current?.autoRefresh ?? false); };
    const interval = setInterval(reassess, 60_000);
    const visible = () => { if (document.visibilityState === 'visible') reassess(); };
    document.addEventListener('visibilitychange', visible);
    return () => { clearInterval(interval); document.removeEventListener('visibilitychange', visible); };
  }, [workspace?.id, view]);
  useEffect(() => {
    if (!playing || workspace?.mode !== 'replay' || view === 'scenarios') return;
    const interval = setInterval(() => {
      if (document.visibilityState !== 'visible' || running.current) return;
      const value = current.current;
      if (!value || Date.parse(clockOf(value)) - Date.parse(value.createdAt) >= 72 * 3_600_000) { setPlaying(false); return; }
      advanceReplay();
    }, 3000);
    return () => clearInterval(interval);
  }, [playing, workspace?.id, view]);

  const errorBanner = error && <div className="error-banner" role="alert"><div><strong>That operation did not complete.</strong><p>{error}</p></div><div className="error-actions">{workspace && <button onClick={() => void run('Reloading saved state…', async signal => {
    const value = await loadWorkspace(required().id);
    if (!value) throw new Error('Workspace no longer exists. Sign out to start again.');
    signal.throwIfAborted(); adopt(value); setDraft(defaultCheckIn(value));
  })} disabled={!!busy}>Reload saved state</button>}{workspace && <button disabled={!!busy} onClick={retryAnalysis}>Retry saved analysis</button>}<button aria-label="Dismiss error" onClick={() => setError('')}><X size={17} /></button></div></div>;

  if (!workspace) return <>{errorBanner}<Login onSignIn={signIn} busy={busy} /></>;
  const profile = persona(workspace.personaId);
  const findings = workspace.evaluation?.findings ?? [];
  const unread = workspace.notices.filter(item => !item.withdrawnAt && !item.acknowledgedAt).length;
  const stale = workspace.evaluation && (workspace.evaluation.dataRevision !== workspace.dataRevision
    || workspace.evaluation.sourceSha256 !== manifest.sourceSha256
    || Date.parse(clockOf(workspace)) - Date.parse(workspace.evaluation.evaluatedAt) > 60_000);
  const navigate = (next: View) => { if (!workspace.evaluation && next === 'overview') { go('checkin'); return; } go(next); };
  const finding = findingSelection?.item;
  const findingSnapshot = findingSelection?.evaluation;
  const findingEvidence = finding ? evidence.find(item => item.id === finding.evidenceId) : null;
  const exportData = report ? exportReport(report, privateExport) : null;

  return <div className="app-shell">
    <aside ref={sidebar} id="workspace-navigation" inert={narrow && !mobileMenu} className={`sidebar ${mobileMenu ? 'mobile-open' : ''}`}>
      <a className="brand" aria-label="Space Tiger Health Assistant home" href="#overview" onClick={event => { event.preventDefault(); navigate('overview'); }}><span className="brand-mark"><Orbit size={23} /></span><span className="brand-name">ST-HA</span></a>
      <p className="nav-heading">YOUR WORKSPACE</p>
      <nav aria-label="Main navigation">{navigation.map(({ id, label, icon: Icon }) => <button key={id} aria-label={label} className={view === id || (id === 'about' && view === 'evidence') ? 'active' : ''} onClick={() => navigate(id)}><Icon size={18} /><span>{label}</span>{id === 'scenarios' && <span className="nav-new">LAB</span>}</button>)}</nav>
      <div className="sidebar-bottom">
        <button aria-label="Settings & devices" className={`settings-nav ${view === 'settings' ? 'active' : ''}`} onClick={() => go('settings')}><Settings size={17} /><span>Settings & devices</span></button>
        <div className="crew-profile"><span className={`avatar small-avatar ${profile.id}`}>{profile.initials}</span><div><strong>{profile.name}</strong><span>Crew profile</span></div><button aria-label="Sign out" className="icon-button" onClick={() => void signOut()}><LogOut size={17} /></button></div>
      </div>
    </aside>
    {mobileMenu && <button className="nav-scrim" aria-label="Close navigation" onClick={() => setMobileMenu(false)} />}
    <div className="app-main" inert={mobileMenu}>
      <header className="topbar"><div className="breadcrumb"><button ref={menuButton} className="icon-button mobile-menu" aria-label="Open navigation" aria-expanded={mobileMenu} aria-controls="workspace-navigation" onClick={() => setMobileMenu(!mobileMenu)}><Menu size={21} /></button><span>My mission</span><ChevronRight size={13} /><strong>{pageTitles[view]}</strong></div>
        <div className="topbar-actions"><span className="sync-status" role="status">{busy ? <><RefreshCw size={13} className="spinning" />{busy}</> : <><ShieldCheck size={13} />{workspace.evaluation ? `Analysed ${utc(workspace.evaluation.evaluatedAt)} UTC` : 'Not analysed yet'}</>}</span>{workspace.mode === 'replay' && <Badge tone="amber">ISOLATED REPLAY</Badge>}
          <button className="icon-button notification-button" aria-label={`Notifications, ${unread} unread`} onClick={() => setNoticesOpen(true)}><Bell size={20} />{unread > 0 && <span className="notification-dot" />}</button>
          <span className={`avatar top-avatar ${profile.id}`} aria-label={profile.name}>{profile.initials}</span>
          <button className="icon-button mobile-signout" aria-label="Sign out" onClick={() => void signOut()}><LogOut size={17} /></button>
        </div>
      </header>
      <main className="workspace-main">
        {errorBanner}
        {workspace.mode === 'replay' && <section className="replay-bar" aria-label="Replay controls"><div><FlaskConical size={18} /><span><strong>Isolated scenario · {workspace.scenario}</strong><small>{dateLabel(clockOf(workspace))} {utc(clockOf(workspace))} UTC · no device reminders or standard-record changes</small></span></div>
          <div className="replay-actions">{workspace.engineFault && <button disabled={!!busy} onClick={restoreEngine}>Restore engine</button>}
            <button disabled={!!busy || !workspace.evaluation} onClick={() => setPlaying(!playing)}>{playing ? <Pause size={14} /> : <Play size={14} />}{playing ? 'Pause' : 'Play'}</button>
            <button disabled={!!busy || !workspace.evaluation} onClick={advanceReplay}><SkipForward size={14} />+12 h</button>
            <button disabled={!!busy} onClick={reset}><RotateCcw size={14} />Reset</button><button onClick={() => void exitReplay()}>Exit replay<X size={14} /></button></div></section>}
        <section className="page-heading"><div><p className="eyebrow">{view === 'overview' ? 'MISSION HEALTH, UNDERSTOOD.' : 'YOUR MISSION / YOUR CONTEXT'}</p><h1 ref={pageHeading} tabIndex={-1}>{view === 'overview' ? `A clearer picture, ${profile.name.split(' ')[0]}.` : pageTitles[view]}</h1><p>{view === 'overview' ? 'Your observations, connected. Your next steps, explained.' : 'Clear context. Transparent reasoning. You stay in control.'}</p></div>
          <div className="heading-actions"><button className="secondary" disabled={!!busy} onClick={() => { setReport(structuredClone(workspace)); setPrivateExport(false); }}><Download size={15} />Export summary</button>{view !== 'checkin' && <button className="primary" disabled={!!busy} onClick={() => go('checkin')}><Plus size={16} />Daily check-in</button>}</div>
        </section>
        {stale && <div className="stale-banner" role="status">Previous analysis is displayed. Time, saved observations, or knowledge have changed.<button className="text-button" disabled={!!busy} onClick={retryAnalysis}>Analyse saved snapshot</button></div>}
        <fieldset className="workspace-controls" disabled={!!busy}>
          {view === 'checkin' && <CheckInView key={workspace.id} workspace={workspace} input={draft ?? defaultCheckIn(workspace)} onChange={setDraft} onSave={saveCheckIn} onError={reportError} busy={busy} />}
          {view === 'overview' && <div className="dashboard-grid"><div className="dashboard-left"><BodyMap workspace={workspace} selected={selectedRegion} onSelect={setSelectedRegion} onOpen={item => { if (workspace.evaluation) setFinding({ item, evaluation: workspace.evaluation }); }} /><Routine workspace={workspace} onTask={changeTask} /></div><div className="dashboard-right"><Metrics workspace={workspace} onSelect={setMetric} /><Findings findings={findings} region={selectedRegion} onClear={() => setSelectedRegion(null)} onOpen={item => { if (workspace.evaluation) setFinding({ item, evaluation: workspace.evaluation }); setSelectedRegion(item.region); }} /><Trend workspace={workspace} />
                <div className="source-footer"><span>{workspace.sources.strength.status === 'failed' && <><WifiOff size={14} />Assessment source unavailable<span className="divider">/</span></>}Last refresh {workspace.sources.heart.retrievedAt ? `${utc(workspace.sources.heart.retrievedAt)} UTC` : 'not yet'}</span><button className="text-button" onClick={() => refresh()}><RefreshCw size={13} />Refresh readings</button></div>
              </div></div>}
          {view === 'timeline' && <TimelineView workspace={workspace} onAdd={addCatalogObservation} />}
          {view === 'routine' && <><div className="view-intro"><div><p className="eyebrow">A LITTLE STRUCTURE, A LITTLE LESS EFFORT</p><h2>Your day, with room for health.</h2><p>Tasks are not treatment recommendations.</p></div></div><Routine workspace={workspace} onTask={changeTask} full /></>}
          {view === 'evidence' && <><button className="text-button" onClick={() => go('about')}><ArrowLeft size={15} />Back to About & credits</button><EvidenceView /></>}
          {view === 'about' && <AboutView onOpenEvidence={() => go('evidence')} />}
          {view === 'scenarios' && <ScenariosView key={workspace.id} workspace={workspace} />}
          {view === 'settings' && <SettingsView workspace={workspace} onEdit={change => edit(value => ({ ...value, ...change }), false, change.nativeReminders !== undefined)} onReset={reset} nativeStatus={nativeStatus} onTest={() => void run('Requesting Android reminder…', async () => { await testWatchReminder(required()); setNativeStatus('Reminder requested for approximately 10 seconds from now. Observe the paired watch separately; delivery is not confirmed.'); })} />}
        </fieldset>
        <footer className="workspace-footer"><span>ST-HA / {manifest.version}</span></footer>
      </main>
    </div>
    {finding && <Modal title={finding.title} onClose={() => setFinding(null)}><div className="detail-badges"><Badge tone={finding.level === 'review' ? 'amber' : 'mint'}>{finding.level === 'gap' ? 'Data limitation' : finding.level === 'review' ? 'For review' : 'Context'}</Badge><Badge>{finding.association}</Badge>{finding.private && <Badge>Private</Badge>}</div><p className="detail-summary">{findingText(finding.summary)}</p><h3>Why this appears</h3><dl className="proof-list">{finding.proof.map((item, index) => <div key={index}><dt>{findingText(item.label)}</dt><dd>{item.value}</dd>{item.recordIds.map(id => <small className="mono" key={id}>{id}</small>)}</div>)}</dl><h3>An applicable next step</h3><p>{finding.nextStep}</p><div className="callout"><strong>What this does not mean</strong><p>{finding.limits}</p></div><h3>Evidence & trace</h3><p>{findingEvidence?.summary}</p>{findingEvidence?.url && <a className="source-link" href={findingEvidence.url} target="_blank" rel="noreferrer">Read original source<ArrowRight size={14} /></a>}<button className="text-button" onClick={() => { setFinding(null); setEvidenceOpen(true); }}>View evidence library<ArrowRight size={14} /></button><dl className="details-grid"><dt>CQL expression</dt><dd className="mono">{finding.expression}</dd><dt>Knowledge</dt><dd>{findingSnapshot?.knowledgeVersion}</dd><dt>Input snapshot</dt><dd>data revision {findingSnapshot?.dataRevision}</dd><dt>Evaluated</dt><dd>{findingSnapshot?.evaluatedAt}</dd><dt>Source hash</dt><dd className="mono">{findingSnapshot?.sourceSha256}</dd></dl><p className="fine-print">Explanation metadata is authored and linked to inputs; it is not an automatically generated ELM proof tree.</p></Modal>}
    {evidenceOpen && <Modal title="Evidence library" wide onClose={() => setEvidenceOpen(false)}><EvidenceView /></Modal>}
    {metric && <Modal title={indicators[metric].label} onClose={() => setMetric(null)}><MetricDetails workspace={workspace} indicator={metric} /><button className="secondary" onClick={() => { setMetric(null); go('timeline'); }}>Open observation timeline<ArrowRight size={14} /></button></Modal>}
    {noticesOpen && <Modal title="Your notification inbox" onClose={() => setNoticesOpen(false)}><p className="muted small">Acknowledging a notice does not complete a task or clear a finding.</p>{!workspace.notices.length && <Empty title="No notices yet">Complete a check-in to generate traceable findings.</Empty>}{[...workspace.notices].reverse().map(notice => <div className={`inbox-row ${notice.withdrawnAt ? 'withdrawn' : ''}`} key={notice.id}><div><strong>{notice.title}</strong><small>{notice.withdrawnAt ? 'Withdrawn after reassessment' : notice.acknowledgedAt ? 'Acknowledged · finding may still apply' : 'New'} · {utc(notice.createdAt)} UTC</small></div>{!notice.withdrawnAt && !notice.acknowledgedAt && <button className="secondary small-button" disabled={!!busy} onClick={() => edit(value => ({ ...value, notices: value.notices.map(item => item.id === notice.id ? { ...item, acknowledgedAt: clockOf(value) } : item) }))}><Check size={14} />Acknowledge</button>}</div>)}</Modal>}
    {report && exportData && <Modal title="Preview your summary" onClose={() => setReport(null)} wide><p className="muted">Frozen snapshot of the selected workspace. Export creates a file, not delivery to medical support.</p><label className="checkbox-row"><input type="checkbox" checked={privateExport} onChange={event => setPrivateExport(event.target.checked)} />Include private mood and digestive check-ins and their findings</label><pre className="export-preview">{JSON.stringify(exportData, null, 2)}</pre>{isAndroid && <p className="callout">File download is available in the browser. Native file sharing is not included in this Android build.</p>}<button className="primary" disabled={isAndroid} onClick={() => {
      const url = URL.createObjectURL(new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' }));
      const anchor = document.createElement('a'); anchor.href = url; anchor.download = `st-ha-${report.personaId}-${report.mode}-summary.json`; anchor.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }}><Download size={16} />Download JSON summary</button></Modal>}
  </div>;
}
