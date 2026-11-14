import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import {
  Activity, Check, ChevronRight, Clock3, Droplets,
  Dumbbell, Heart, Moon, ShieldCheck, Sparkles, X,
} from 'lucide-react';
import {
  displayValue, indicators, latest, numeric, type Finding, type Indicator, type Region, type Task, type Workspace,
} from './domain.ts';
import { basicRanges, catalogById, catalogInputs } from './input-catalog.ts';

export function utc(value: string) {
  return new Date(value).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' });
}
export function dateLabel(value: string) {
  return new Date(value).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', timeZone: 'UTC' });
}
export const regionNames: Record<Region, string> = { whole: 'Whole-person context', arms: 'Physical performance', abdomen: 'Digestive report' };

export function Badge({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'mint' | 'amber' | 'rose' }) {
  return <span className={`badge ${tone}`}>{children}</span>;
}
export function Empty({ title, children }: { title: string; children: ReactNode }) {
  return <div className="empty"><ShieldCheck size={30} /><h3>{title}</h3><p>{children}</p></div>;
}
export function Modal({ title, children, onClose, wide = false }: { title: string; children: ReactNode; onClose: () => void; wide?: boolean }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const id = useId();
  useEffect(() => {
    const node = dialog.current;
    node?.showModal();
    return () => node?.close();
  }, []);
  return <dialog ref={dialog} className={wide ? 'modal wide' : 'modal'} aria-labelledby={id}
    onCancel={event => { event.preventDefault(); onClose(); }}
    onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
    <div className="modal-head"><h2 id={id}>{title}</h2><button className="icon-button" autoFocus aria-label="Close dialog" onClick={onClose}><X size={20} /></button></div>
    <div className="modal-content">{children}</div>
  </dialog>;
}

export function BodyMap({ workspace, selected, onSelect, onOpen }: {
  workspace: Workspace; selected: Region | null; onSelect: (region: Region | null) => void; onOpen: (finding: Finding) => void;
}) {
  const findings = workspace.evaluation?.findings ?? [];
  const ordered = [...findings.filter(item => item.level === 'review'), ...findings.filter(item => item.level === 'gap'), ...findings.filter(item => item.level === 'context')];
  const counts = (region: Region) => workspace.evaluation?.findings.filter(item => item.region === region).length ?? 0;
  const female = workspace.figure === 'female';
  const marker = (region: Region, x: number, y: number) => counts(region) > 0 && <g
    className={`body-marker ${selected === region ? 'selected' : ''}`} role="button" tabIndex={0}
    aria-label={`${regionNames[region]}: ${counts(region)} findings`} aria-pressed={selected === region}
    onClick={() => onSelect(selected === region ? null : region)}
    onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onSelect(selected === region ? null : region); } }}>
    <circle cx={x} cy={y} r="23" className="marker-halo" />
    <circle cx={x} cy={y} r="13" className="marker-core" />
    <path d={`M${x - 4},${y}h8M${x},${y - 4}v8`} stroke="var(--marker-symbol)" strokeWidth="1.5" />
    <circle cx={x + 13} cy={y - 13} r="8" className="marker-count" />
    <text x={x + 13} y={y - 10} textAnchor="middle">{counts(region)}</text>
  </g>;
  return <section className="card body-card" aria-label="Body navigator">
    <div className="section-top"><div><p className="eyebrow">THE HUMAN PICTURE</p><h2>Your body, in context</h2></div><Activity size={19} /></div>
    <svg viewBox="0 0 320 440" className="body-drawing" role="group" aria-label="Original Da Vinci-inspired body navigator">
      <defs><pattern id="paper-grid" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M20 0H0V20" fill="none" stroke="var(--figure-grid)" strokeWidth=".35" /></pattern></defs>
      <rect x="10" y="12" width="300" height="410" fill="url(#paper-grid)" />
      <g fill="none" stroke="var(--figure-construction)" strokeWidth=".9">
        <circle cx="160" cy="218" r="143" /><rect x="42" y="82" width="236" height="284" />
        <path d="M160 28V403M17 218H303M42 82L278 366M278 82L42 366" strokeDasharray="3 5" />
      </g>
      <g fill="none" stroke="var(--figure-lines)" strokeWidth="1.1" opacity=".55" strokeLinejoin="round">
        <path d="M143 134L112 129L64 88L55 91L75 119L126 165M177 134L208 129L256 88L265 91L245 119L194 165" />
        <path d="M139 256L111 321L79 371L84 377L99 371L137 318L154 275M181 256L209 321L241 371L236 377L221 371L183 318L166 275" />
      </g>
      <g fill="var(--figure-fill)" fillOpacity=".56" stroke="var(--figure-lines)" strokeWidth="1.4" strokeLinejoin="round" strokeLinecap="round">
        <ellipse cx="160" cy="105" rx="16" ry="22" />
        <path d={female
          ? 'M153 125L151 134Q136 131 126 145L105 177L69 186L50 185L48 190L68 197L115 188L139 161Q145 182 140 203Q129 223 134 251L143 269L140 326L142 371L134 391L139 396L154 392L157 324L160 277L163 324L166 392L181 396L186 391L178 371L180 326L177 269L186 251Q191 223 180 203Q175 182 181 161L205 188L252 197L272 190L270 185L251 186L215 177L194 145Q184 131 169 134L167 125'
          : 'M153 125L151 134Q134 132 124 146L104 177L69 186L50 185L48 190L68 197L116 188L139 160L142 204L137 246L144 269L140 326L142 371L134 391L139 396L154 392L157 324L160 276L163 324L166 392L181 396L186 391L178 371L180 326L176 269L183 246L178 204L181 160L204 188L252 197L272 190L270 185L251 186L216 177L196 146Q186 132 169 134L167 125'} />
      </g>
      <g fill="none" stroke="var(--figure-lines)" strokeWidth=".8" opacity=".75">
        <path d="M149 98L153 97M167 97L171 98M160 101L158 111L163 111M155 118Q160 120 165 118M152 139L160 147L168 139M145 153Q153 160 160 155Q168 160 176 153M160 148V229M144 173Q153 178 158 173M162 173Q168 178 177 173M146 191Q153 195 158 190M162 190Q168 195 175 191M145 213Q160 224 175 213M140 241Q149 239 160 253Q171 239 180 241M148 273L147 318M172 273L173 318M145 337L148 369M175 337L172 369" />
        <ellipse cx="160" cy="228" rx="2" ry="3" /><path d="M127 151L111 179M193 151L209 179M79 190L105 185M215 185L241 190" />
      </g>
      {marker('whole', 267, 54)}{marker('arms', 112, 175)}{marker('abdomen', 161, 220)}
      <text x="160" y="424" textAnchor="middle" className="figure-caption">FIG. 01 / HUMAN SYSTEMS</text>
    </svg>
    <div className="body-legend" role="group" aria-label="Current inference findings">
      {ordered.map(finding => <button key={finding.id} onClick={() => onOpen(finding)}>
        <span className={`legend-dot ${finding.level === 'review' ? 'lit' : ''}`} />{finding.title}<span className="count">{finding.level === 'review' ? 'For review' : finding.level === 'gap' ? 'Data gap' : 'Context'}</span>
      </button>)}
      {!ordered.length && <p className="muted small">{workspace.evaluation ? 'No current findings. This is not a health clearance.' : 'Complete a daily check-in to see findings.'}</p>}
    </div>
  </section>;
}

export function Sparkline({ values, color = 'var(--accent)' }: { values: number[]; color?: string }) {
  if (values.length < 2) return <span className="muted small">Not enough history</span>;
  const min = Math.min(...values) - 1;
  const max = Math.max(...values) + 1;
  const points = values.map((value, index) => `${index * 100 / (values.length - 1)},${35 - ((value - min) / (max - min)) * 30}`).join(' ');
  return <svg viewBox="0 0 100 40" className="sparkline" aria-hidden="true"><polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" /></svg>;
}
export function Metrics({ workspace, onSelect }: { workspace: Workspace; onSelect: (id: Indicator) => void }) {
  const ratio = workspace.evaluation?.values['StrengthRatio'];
  const specs = [
    { id: 'heartRate', title: 'Resting heart rate', icon: Heart, value: numeric(latest(workspace, 'heartRate')), unit: 'bpm', detail: 'Local reading · at rest', className: 'pulse' },
    { id: 'sleep', title: 'Sleep last recorded', icon: Moon, value: numeric(latest(workspace, 'sleep')), unit: 'h', detail: '8 h reference target', className: 'sleep' },
    { id: 'strength', title: 'Strength / baseline', icon: Dumbbell, value: typeof ratio === 'number' ? Math.round(ratio * 100) : null, unit: '%', detail: 'Like-for-like handgrip assessment', className: 'strength' },
    { id: 'fluid', title: 'Fluid intake logged', icon: Droplets, value: numeric(latest(workspace, 'fluid')), unit: 'mL', detail: 'Recorded intake · not hydration status', className: 'fluid' },
  ] satisfies { id: Indicator; title: string; icon: typeof Heart; value: number | null; unit: string; detail: string; className: string }[];
  return <div className="metrics-grid">{specs.map(({ id, title, icon: Icon, value, unit, detail, className }) => {
    const observation = latest(workspace, id);
    const history = workspace.observations.filter(item => item.indicator === id && typeof item.value === 'number')
      .sort((a, b) => a.observedAt.localeCompare(b.observedAt)).slice(-8).map(item => Number(item.value));
    return <button className={`card metric ${className}`} key={id} onClick={() => onSelect(id)}>
      <div className="metric-label"><Icon size={17} /><span>{title}</span></div>
      <div className="metric-number">{value ?? '—'}<span>{value === null ? '' : unit}</span></div>
      <div className="metric-bottom"><span>{detail}</span><Sparkline values={history} /></div>
      <span className="metric-time">{observation ? `${dateLabel(observation.observedAt)} · ${utc(observation.observedAt)} UTC` : 'Not recorded'}</span>
    </button>;
  })}</div>;
}

export function findingText(text: string) {
  return text.replace('Illustrative plan target', 'Reference target')
    .replace('Illustrative baseline', 'Fixed reference baseline')
    .replace('illustrative target', 'reference target')
    .replace('illustrative 8-hour target', '8-hour reference target')
    .replace('illustrative handgrip baseline', 'fixed handgrip reference baseline');
}

export function Findings({ findings, region, onClear, onOpen }: {
  findings: Finding[]; region: Region | null; onClear: () => void; onOpen: (finding: Finding) => void;
}) {
  const filtered = region ? findings.filter(item => item.region === region) : findings;
  const ordered = [...filtered.filter(item => item.level === 'review'), ...filtered.filter(item => item.level !== 'review')];
  return <section className="card findings-card">
    <div className="section-top"><div><p className="eyebrow">EXPLAINABLE INSIGHTS</p><h2>{region ? regionNames[region] : 'Worth a closer look'}</h2></div>
      {region ? <button className="text-button" onClick={onClear}>Show all</button> : <Badge tone="amber">{findings.filter(item => item.level === 'review').length} for review</Badge>}
    </div>
    {!filtered.length && <Empty title="No mapped finding">This is not an overall health clearance. Uninterpreted or missing information may remain.</Empty>}
    {ordered.map(finding => <button className="finding-row" key={finding.id} onClick={() => onOpen(finding)}>
      <span className={`finding-icon ${finding.level}`}>{finding.level === 'gap' ? <Clock3 size={18} /> : finding.level === 'review' ? <Activity size={18} /> : <Sparkles size={18} />}</span>
      <span className="finding-copy"><strong>{finding.title}{finding.private && <span className="private-tag">PRIVATE</span>}</strong><span>{findingText(finding.summary)}</span></span>
      <ChevronRight size={17} />
    </button>)}
  </section>;
}

const trendIndicators: Indicator[] = ['sleep', 'heartRate', 'strength', 'fluid', ...catalogInputs.filter(item => item.kind === 'number').map(item => item.id)];
function trendNumber(value: number) {
  return value !== 0 && (Math.abs(value) < 0.001 || Math.abs(value) >= 100_000)
    ? value.toExponential(2) : new Intl.NumberFormat(undefined, { maximumSignificantDigits: 4 }).format(value);
}

export function Trend({ workspace }: { workspace: Workspace }) {
  const [table, setTable] = useState(false);
  const [indicator, setIndicator] = useState<Indicator>('sleep');
  const { label, unit } = indicators[indicator];
  const superseded = new Set(workspace.observations.flatMap(item => item.supersedes ? [item.supersedes] : []));
  const records = workspace.observations.flatMap(item =>
    item.indicator === indicator && item.availability === 'recorded' && typeof item.value === 'number' && !superseded.has(item.id)
      ? [{ ...item, value: item.value }] : [])
    .sort((a, b) => a.observedAt.localeCompare(b.observedAt)).slice(-7);
  const range = indicator === 'sleep' ? [8, 8] as const
    : indicator === 'fluid' ? undefined : catalogById.get(indicator)?.range ?? basicRanges[indicator];
  const values = [...records.map(item => item.value), ...(range ?? [])];
  const min = values.length ? Math.min(...values) : 0;
  const max = values.length ? Math.max(...values) : 1;
  const padding = (max - min || Math.max(Math.abs(min) * 0.2, 1)) * 0.1;
  const lower = min - padding;
  const upper = max + padding;
  const y = (value: number) => 175 - (value - lower) / (upper - lower) * 145;
  const x = (index: number) => records.length === 1 ? 300 : 70 + index * 460 / Math.max(1, records.length - 1);
  const points = records.map((item, index) => `${x(index)},${y(item.value)}`).join(' ');
  const reference = range ? indicator === 'sleep' ? '8 h reference target'
    : `${range[0]}-${range[1]} ${unit} example range` : null;
  return <section className="card trend-card" aria-label="Numeric observation trends">
    <div className="section-top"><div><p className="eyebrow">YOUR PATTERNS</p><h2>{label}, over time</h2></div><button className="text-button" onClick={() => setTable(!table)}>{table ? 'Show chart' : 'View data'}</button></div>
    <label className="trend-selector">Indicator<select aria-label="Trend indicator" value={indicator} onChange={event => {
      const next = trendIndicators.find(id => id === event.target.value);
      if (!next) throw new Error('Unknown numeric trend indicator.');
      setIndicator(next);
    }}>{trendIndicators.map(id => <option key={id} value={id}>{indicators[id].label} ({indicators[id].unit})</option>)}</select></label>
    <div className="chart-legend"><span><i />Recorded {label.toLowerCase()} ({unit})</span>{reference && <span className="plan"><i />{reference}</span>}</div>
    {!records.length ? <Empty title="No recorded values">No numeric observations are available for {label.toLowerCase()}. Missing or declined entries are not plotted.</Empty>
      : table ? <div className="table-scroll"><table><caption className="sr-only">{label} history</caption><thead><tr><th>Observation (UTC)</th><th>Value ({unit})</th><th>Method</th></tr></thead><tbody>{records.map(item => <tr key={item.id}><td>{dateLabel(item.observedAt)} {utc(item.observedAt)}</td><td>{String(item.value)}</td><td>{item.method}</td></tr>)}</tbody></table></div>
        : <svg className="trend-chart" viewBox="0 0 560 215" role="img" aria-label={`${label} trend in ${unit}.${reference ? ` ${reference}.` : ''} Use View data for individual values.`}>
          {Array.from({ length: 5 }, (_, index) => lower + (upper - lower) * index / 4).map(value => <g key={value}><line x1="70" x2="530" y1={y(value)} y2={y(value)} stroke="var(--border)" /><text x="60" y={y(value) + 4} textAnchor="end">{trendNumber(value)}</text></g>)}
          {range && [...new Set(range)].map(value => <line key={value} x1="70" x2="530" y1={y(value)} y2={y(value)} stroke="var(--amber)" strokeDasharray="5 5" />)}
          <polyline points={points} fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinejoin="round" />
          {records.map((item, index) => <g key={item.id}><circle cx={x(index)} cy={y(item.value)} r="4" fill="var(--accent)" stroke="var(--surface)" strokeWidth="2"><title>{`${item.observedAt}: ${item.value} ${unit}`}</title></circle><text x={x(index)} y="200" textAnchor="middle">{dateLabel(item.observedAt)}</text></g>)}
        </svg>}
    <p className="fine-print">Points are individual records, not continuous sensor coverage. Reference ≠ diagnosis.</p>
  </section>;
}

function routineDetail(detail: string) {
  return detail
    .replace('fictional, like-for-like handgrip test', 'handgrip assessment')
    .replace('unsupported test', 'unsupported assessment')
    .replace('recorded fictional countermeasure plan', 'countermeasure plan')
    .replace('example handgrip assessment', 'handgrip assessment')
    .replace('example countermeasure plan', 'countermeasure plan');
}

export function Routine({ workspace, onTask, full = false }: { workspace: Workspace; onTask: (id: string, status: Task['status']) => void; full?: boolean }) {
  const completed = workspace.tasks.filter(item => item.status === 'completed').length;
  return <section className="card routine-card">
    <div className="section-top"><div><p className="eyebrow">SMALL STEPS, EACH DAY</p><h2>Your health routine</h2></div><Badge>{completed}/{workspace.tasks.length} complete</Badge></div>
    <p className="muted small">All times UTC</p>
    {workspace.tasks.map(task => <div className={`task-row ${task.status}`} key={task.id}>
      <button className="task-check" aria-label={`${task.status === 'completed' ? 'Undo' : 'Complete'} ${task.title}`}
        aria-pressed={task.status === 'completed'} onClick={() => onTask(task.id, task.status === 'completed' ? 'pending' : 'completed')}>
        {task.status === 'completed' && <Check size={14} />}
      </button>
      <div className="task-copy"><span>{utc(task.dueAt)} <span className="muted">UTC</span></span><strong>{task.title}</strong>
        {full && <p>{routineDetail(task.detail)}</p>}<span className="task-status">{task.status === 'pending' ? 'Completion not recorded' : task.status}</span></div>
      {task.status === 'pending' && full && <button className="text-button" onClick={() => onTask(task.id, 'skipped')}>Skip</button>}
      {task.status === 'skipped' && <button className="text-button" onClick={() => onTask(task.id, 'pending')}>Restore</button>}
    </div>)}
    {full && <p className="fine-print">A completed task is not evidence that a health finding has resolved.</p>}
  </section>;
}

export function MetricDetails({ workspace, indicator }: { workspace: Workspace; indicator: Indicator }) {
  const item = latest(workspace, indicator);
  return <>
    <p className="metric-number detail-value">{displayValue(item)}</p>
    <dl className="details-grid">
      <dt>Indicator</dt><dd>{indicators[indicator].label}</dd><dt>Observed</dt><dd>{item?.observedAt ?? 'Unavailable'}</dd>
      <dt>Source</dt><dd>{!item ? 'Unavailable' : item.method === 'sensor' ? 'Generated reading' : item.method === 'seed' ? 'Generated history' : 'Manual check-in'}</dd><dt>Availability</dt><dd>{item?.availability ?? 'missing'}</dd>
      <dt>Record ID</dt><dd className="mono">{item?.id ?? 'None'}</dd><dt>Record revision</dt><dd>{item?.revision ?? '—'}</dd>
    </dl>
    <p className="callout">Raw observations and derived interpretations are different. A displayed value is not a diagnosis or assurance of normality.</p>
  </>;
}
