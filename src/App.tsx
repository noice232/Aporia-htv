import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Activity,
  ArrowRight,
  Check,
  ChevronDown,
  CircleHelp,
  FlaskConical,
  GitFork,
  History,
  Menu,
  Plus,
  RefreshCw,
  Scale,
  Send,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  X,
} from 'lucide-react'
import {
  approvePrinciple,
  createFork,
  createProject,
  getFork,
  getHealth,
  getProfile,
  getProfileHistory,
  listAgenda,
  listEvents,
  listForks,
  listPrinciples,
  listRuns,
  scorePolicy,
  submitGoal,
  submitJudgment,
} from './api/client'
import type {
  AgendaItem,
  Candidate,
  Event,
  Fork,
  ForkSummary,
  GoalResult,
  Health,
  PolicyRun,
  Principle,
  Profile,
  ProfileVersion,
  Project,
  Run,
} from './api/client'

type View = 'judgments' | 'profile' | 'forks' | 'events'
type SavedProject = Pick<Project, 'id' | 'title'>
const storageKey = 'aporia.project'

function savedProject(): SavedProject | null {
  try {
    const item = localStorage.getItem(storageKey)
    if (!item) return null
    const parsed: unknown = JSON.parse(item)
    if (
      parsed &&
      typeof parsed === 'object' &&
      'id' in parsed &&
      'title' in parsed &&
      typeof parsed.id === 'string' &&
      typeof parsed.title === 'string'
    )
      return parsed as SavedProject
  } catch {
    /* A corrupt shortcut should not prevent the app from opening. */
  }
  return null
}

function formatScore(value: number | null | undefined, signed = false) {
  if (value == null) return '—'
  return `${signed && value > 0 ? '+' : ''}${value.toFixed(3)}`
}

function formatPercent(value: number | null | undefined) {
  return value == null ? 'Not evaluated' : `${(value * 100).toFixed(2)}%`
}

function shortId(id: string) {
  return id.length > 14 ? `${id.slice(0, 8)}…${id.slice(-4)}` : id
}
function readable(text: string) {
  return text.replaceAll('_', ' ').replaceAll('.', ' · ')
}
function timeLabel(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

function ModeBadge({ mode }: { mode?: string | null }) {
  const normalized = mode?.toLowerCase() ?? ''
  const kind =
    normalized.includes('fixture') || !mode
      ? 'neutral'
      : normalized.includes('fail')
        ? 'danger'
        : normalized.includes('pending')
          ? 'amber'
          : 'green'
  const label = mode ? readable(mode) : 'Mode unspecified'
  return (
    <span
      className={`mode-badge ${kind}`}
      title={mode ? `Backend data mode: ${mode}` : 'This API response does not include a data_mode field'}
    >
      {label}
    </span>
  )
}

function StatusBadge({ status }: { status: string }) {
  const kind = /fail|error|falsif|offline/i.test(status)
    ? 'danger'
    : /pending|partial|unavailable|unknown/i.test(status)
      ? 'amber'
      : 'green'
  return <span className={`status-badge ${kind}`}>{readable(status)}</span>
}

function EmptyState({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="empty-state">
      <span className="empty-orbit">
        <CircleHelp size={24} />
      </span>
      <h3>{title}</h3>
      <p>{detail}</p>
    </div>
  )
}

function ErrorNote({ error, onDismiss }: { error: string | null; onDismiss: () => void }) {
  if (!error) return null
  return (
    <div className="error-note" role="alert">
      <span>{error}</span>
      <button type="button" className="icon-button" onClick={onDismiss} aria-label="Dismiss error">
        <X size={16} />
      </button>
    </div>
  )
}

function Rubric({ score }: { score: Candidate }) {
  const makeLines = (value: Record<string, unknown> | null | undefined, heading: string) => {
    if (!value) return null
    const entries = Object.entries(value).filter(([, v]) => v != null)
    if (!entries.length) return null
    return (
      <div className="rubric-group">
        <span className="rubric-heading">{heading}</span>
        {entries.slice(0, 4).map(([key, item]) => (
          <span key={key} className="rubric-line">
            {key !== 'rationale' && <strong>{readable(key)}: </strong>}
            {typeof item === 'object'
              ? Object.entries(item as Record<string, unknown>)
                  .map(([name, detail]) => `${readable(name)}: ${String(detail)}`)
                  .join(' · ')
              : String(item)}
          </span>
        ))}
      </div>
    )
  }
  if (!score.feasible)
    return (
      <span className="infeasible-explanation">
        {score.infeasibility_reason || 'Backend marked this candidate infeasible.'}
      </span>
    )
  const u = makeLines(score.rubric_u, 'Independent')
  const c = makeLines(score.rubric_c, 'Human-aligned')
  return (
    <div className="rubric">
      {u}
      {c}
      {!u && !c && <span className="muted">No rationale returned.</span>}
    </div>
  )
}

function JudgmentView({
  policy,
  w,
  setW,
  busy,
  error,
}: {
  policy: PolicyRun | null
  w: number
  setW: (value: number) => void
  busy: boolean
  error: string | null
}) {
  const selected = policy?.scores.find((item) => item.candidate_id === policy.selected_candidate_id)
  return (
    <section className="view-stack">
      <div className="view-intro">
        <div>
          <span className="eyebrow">
            <Scale size={14} /> POLICY / JUDGMENTS
          </span>
          <h1>Make the human influence visible.</h1>
          <p>
            One candidate set, two scoring perspectives. The server recomputes every score when you change
            guidance.
          </p>
        </div>
        <span className="intro-mark">01 / 04</span>
      </div>
      <div className="slider-panel">
        <div className="slider-top">
          <div>
            <span className="section-kicker">GUIDANCE WEIGHT</span>
            <h2>How much should the researcher shape the choice?</h2>
          </div>
          <div className="weight-value">
            <small>w</small>
            <strong>{w.toFixed(2)}</strong>
          </div>
        </div>
        <input
          aria-label="Guidance weight w"
          className="weight-slider"
          type="range"
          min="0"
          max="2"
          step="0.05"
          value={w}
          onChange={(event) => setW(Number(event.target.value))}
        />
        <div className="slider-zones">
          <span>
            <i className="zone-dot independent" />
            Independent <b>0</b>
          </span>
          <span>
            <i className="zone-dot aligned" />
            Human-aligned <b>1</b>
          </span>
          <span>
            <i className="zone-dot extrapolate" />
            Extrapolate <b>&gt;1</b>
          </span>
        </div>
        <div className="slider-foot">
          <span>
            <Sparkles size={15} /> predicted selection — not yet executed.
          </span>
          <span className="request-state">
            {busy ? (
              <>
                <span className="spinner" /> Asking server…
              </>
            ) : policy ? (
              `Server run ${shortId(policy.id)}`
            ) : (
              'Awaiting server score'
            )}
          </span>
        </div>
      </div>
      <ErrorNote
        error={error}
        onDismiss={() => window.dispatchEvent(new Event('aporia:clear-score-error'))}
      />
      <div className="table-panel">
        <div className="panel-header">
          <div>
            <span className="section-kicker">CANDIDATE DECISION TABLE</span>
            <h2>Score breakdown</h2>
          </div>
          <div className="panel-meta">
            <ModeBadge />
            <StatusBadge status={policy?.status || (busy ? 'pending' : 'unavailable')} />
          </div>
        </div>
        {policy ? (
          <>
            <div className="table-scroll">
              <table className="score-table">
                <thead>
                  <tr>
                    <th>Experiment</th>
                    <th className="num independent-text">
                      s<sub>u</sub>
                    </th>
                    <th className="num aligned-text">
                      s<sub>c</sub>
                    </th>
                    <th className="num">Δ</th>
                    <th className="num guided-text">
                      s<sub>g</sub>
                    </th>
                    <th>Eligible</th>
                    <th>Why</th>
                  </tr>
                </thead>
                <tbody>
                  {policy.scores.map((score) => {
                    const isSelected = score.candidate_id === policy.selected_candidate_id
                    return (
                      <tr
                        key={score.candidate_id}
                        className={`${isSelected ? 'selected-row' : ''} ${!score.feasible ? 'infeasible-row' : ''}`}
                      >
                        <td className="candidate-cell">
                          <span className="candidate-name">{score.label}</span>
                          <small>{shortId(score.candidate_id)}</small>
                          {isSelected && (
                            <span className="choice-tag">
                              <Check size={12} /> Selected
                            </span>
                          )}
                        </td>
                        <td className="num independent-text">{formatScore(score.s_u)}</td>
                        <td className="num aligned-text">{formatScore(score.s_c)}</td>
                        <td
                          className={`num ${score.delta == null ? '' : score.delta >= 0 ? 'positive-text' : 'negative-text'}`}
                        >
                          {formatScore(score.delta, true)}
                        </td>
                        <td className="num guided-text score-guided">{formatScore(score.s_guided)}</td>
                        <td>
                          {score.feasible ? (
                            <span className="eligible">
                              <Check size={14} /> Yes
                            </span>
                          ) : (
                            <span className="ineligible">No</span>
                          )}
                        </td>
                        <td className="why-cell">
                          <Rubric score={score} />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <div className="table-footer">
              <span>
                {policy.scores.length} candidates · snapshot {shortId(policy.snapshot_id)}
              </span>
              <span>Computed {timeLabel(policy.computed_at)}</span>
            </div>
          </>
        ) : (
          <EmptyState
            title={busy ? 'Scoring candidates…' : 'No policy score yet'}
            detail={
              busy
                ? 'Waiting for the backend to return the candidate table.'
                : 'The candidate table appears when the backend completes a policy score.'
            }
          />
        )}
      </div>
      <div className="selection-strip">
        <div className="selection-icon">
          <SlidersHorizontal size={20} />
        </div>
        <div>
          <span className="section-kicker">SERVER ARGMAX</span>
          <h3>{selected ? selected.label : policy?.selected_label || 'No candidate selected'}</h3>
          <p>
            {policy?.fallback_reason ||
              (selected
                ? `Selected by the backend at w = ${policy?.w.toFixed(2)}. This is a prediction, not an executed experiment.`
                : 'A selection will appear when the server returns a feasible candidate.')}
          </p>
        </div>
        <span className="selection-aside">
          {policy?.selected_candidate_id ? shortId(policy.selected_candidate_id) : '—'}
        </span>
      </div>
    </section>
  )
}

function ProfileView({
  projectId,
  principles,
  history,
  profile,
  loadError,
  refresh,
  onApproved,
}: {
  projectId: string
  principles: Principle[]
  history: ProfileVersion[]
  profile: Profile | null
  loadError: string | null
  refresh: () => Promise<void>
  onApproved: () => void
}) {
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [approving, setApproving] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  async function submit(event: React.FormEvent) {
    event.preventDefault()
    if (!text.trim()) return
    setBusy(true)
    setError(null)
    try {
      await submitJudgment(projectId, text.trim())
      setText('')
      await refresh()
    } catch (cause) {
      setError(messageOf(cause))
    } finally {
      setBusy(false)
    }
  }
  async function approve(id: string) {
    setApproving(id)
    setError(null)
    try {
      await approvePrinciple(projectId, id)
      onApproved()
      await refresh()
    } catch (cause) {
      setError(messageOf(cause))
    } finally {
      setApproving(null)
    }
  }
  const pending = principles.filter((p) => !p.approved)
  const active = principles.filter((p) => p.approved && p.enabled)
  return (
    <section className="view-stack">
      <div className="view-intro">
        <div>
          <span className="eyebrow">
            <ShieldCheck size={14} /> RESEARCHER / PROFILE
          </span>
          <h1>Human judgment, with an approval trail.</h1>
          <p>
            Raw feedback starts pending. Only approved principles can shape server-side conditioned scoring.
          </p>
        </div>
        <span className="intro-mark">02 / 04</span>
      </div>
      {loadError && (
        <p className="inline-error" role="alert">
          {loadError}
        </p>
      )}
      <form className="editor-panel" onSubmit={submit}>
        <div className="panel-header">
          <div>
            <span className="section-kicker">NEW JUDGMENT</span>
            <h2>Capture a research preference</h2>
          </div>
          <ModeBadge />
        </div>
        <label htmlFor="judgment-text">What should the agent consider?</label>
        <textarea
          id="judgment-text"
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Prioritize geometric consistency over single-view appearance when choosing the next experiment."
          rows={3}
          maxLength={2000}
        />
        <div className="form-foot">
          <span>Submission creates a pending principle.</span>
          <button className="primary-button" type="submit" disabled={busy || !text.trim()}>
            <Send size={15} />
            {busy ? 'Submitting…' : 'Submit judgment'}
          </button>
        </div>
      </form>
      <ErrorNote error={error} onDismiss={() => setError(null)} />
      <div className="profile-grid">
        <div className="list-panel">
          <div className="panel-header">
            <div>
              <span className="section-kicker">APPROVAL QUEUE</span>
              <h2>
                Pending <em>{pending.length}</em>
              </h2>
            </div>
            <span className="subtle-icon">
              <History size={18} />
            </span>
          </div>
          {pending.length ? (
            pending.map((item) => (
              <article className="principle-item" key={item.id}>
                <div className="principle-top">
                  <span className="status-badge amber">Pending approval</span>
                  <small>{timeLabel(item.created_at)}</small>
                </div>
                <p>{item.text}</p>
                <div className="principle-foot">
                  <small>
                    {shortId(item.id)} · confidence {item.confidence.toFixed(2)}
                  </small>
                  <button
                    className="small-button"
                    type="button"
                    onClick={() => approve(item.id)}
                    disabled={approving === item.id}
                  >
                    {approving === item.id ? 'Approving…' : 'Approve'} <ArrowRight size={14} />
                  </button>
                </div>
              </article>
            ))
          ) : (
            <p className="inline-empty">No pending judgments.</p>
          )}
        </div>
        <div className="list-panel">
          <div className="panel-header">
            <div>
              <span className="section-kicker">ACTIVE PROFILE</span>
              <h2>
                Approved <em>{active.length}</em>
              </h2>
            </div>
            <span className="version-chip">{profile ? `v${profile.version}` : 'No version'}</span>
          </div>
          {active.length ? (
            active.map((item) => (
              <article className="principle-item active-principle" key={item.id}>
                <div className="principle-top">
                  <span className="status-badge green">
                    <Check size={12} /> Active
                  </span>
                  <small>{item.approved_at ? timeLabel(item.approved_at) : 'Approved'}</small>
                </div>
                <p>{item.text}</p>
                <small>
                  {shortId(item.id)} · {readable(item.scope)}
                </small>
              </article>
            ))
          ) : (
            <p className="inline-empty">Approved principles will appear here.</p>
          )}
        </div>
      </div>
      <div className="history-panel">
        <div className="panel-header">
          <div>
            <span className="section-kicker">VERSION HISTORY</span>
            <h2>How the profile evolved</h2>
          </div>
          <span className="history-count">{history.length} versions</span>
        </div>
        {history.length ? (
          <div className="version-track">
            {[...history]
              .sort((a, b) => a.version - b.version)
              .map((item) => (
                <div className="version-node" key={item.version}>
                  <span className="version-dot" />
                  <strong>v{item.version}</strong>
                  <small>{timeLabel(item.created_at)}</small>
                  <span>
                    {item.principles_snapshot.length} principle
                    {item.principles_snapshot.length === 1 ? '' : 's'}
                  </span>
                </div>
              ))}
          </div>
        ) : (
          <p className="inline-empty">The backend has not returned profile versions yet.</p>
        )}
      </div>
    </section>
  )
}

function ForkView({
  projectId,
  w,
  fork,
  forks,
  loadError,
  onCreated,
  onSelect,
}: {
  projectId: string
  w: number
  fork: Fork | null
  forks: ForkSummary[]
  loadError: string | null
  onCreated: (fork: Fork) => void
  onSelect: (id: string) => Promise<void>
}) {
  const [busy, setBusy] = useState(false)
  const [selecting, setSelecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  async function create() {
    setBusy(true)
    setError(null)
    try {
      onCreated(await createFork(projectId, w))
    } catch (cause) {
      setError(messageOf(cause))
    } finally {
      setBusy(false)
    }
  }
  async function select(id: string) {
    setSelecting(true)
    setError(null)
    try {
      await onSelect(id)
    } catch (cause) {
      setError(messageOf(cause))
    } finally {
      setSelecting(false)
    }
  }
  const comparison = fork?.comparison
  const branches = fork
    ? [
        {
          label: 'Independent branch',
          sub: `w = ${fork.w_unguided.toFixed(2)}`,
          data: fork.branch_unguided,
          kind: 'independent',
        },
        {
          label: 'Human-guided branch',
          sub: `w = ${fork.w_guided.toFixed(2)}`,
          data: fork.branch_guided,
          kind: 'guided',
        },
      ]
    : []
  return (
    <section className="view-stack">
      <div className="view-intro">
        <div>
          <span className="eyebrow">
            <GitFork size={14} /> EVIDENCE / FORKS
          </span>
          <h1>Two branches. One honest comparison.</h1>
          <p>
            Create a counterfactual fork at the current guidance weight and inspect reported coverage when
            each branch is evaluated.
          </p>
        </div>
        <span className="intro-mark">03 / 04</span>
      </div>
      {loadError && (
        <p className="inline-error" role="alert">
          {loadError}
        </p>
      )}
      <div className="fork-toolbar">
        <div>
          <span className="section-kicker">COUNTERFACTUAL EXPERIMENT</span>
          <h2>Compare at w = {w.toFixed(2)}</h2>
          <p>The backend chooses both branches and reports the comparison.</p>
        </div>
        <button className="primary-button" type="button" onClick={create} disabled={busy}>
          <GitFork size={16} />
          {busy ? 'Creating fork…' : 'Create fork'}
        </button>
      </div>
      <ErrorNote error={error} onDismiss={() => setError(null)} />
      {fork && comparison && (
        <>
          <div className="fork-heading">
            <div>
              <span className="section-kicker">FORK {shortId(fork.id)}</span>
              <h2>Coverage comparison</h2>
            </div>
            <div className="fork-controls">
              {forks.length > 1 && (
                <label className="select-wrap">
                  Previous forks{' '}
                  <select
                    aria-label="Select fork"
                    value={fork.id}
                    disabled={selecting}
                    onChange={(event) => select(event.target.value)}
                  >
                    {forks.map((item) => (
                      <option key={item.id} value={item.id}>
                        {shortId(item.id)} · {timeLabel(item.created_at)}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={15} />
                </label>
              )}
              <StatusBadge status={comparison.status} />
              <ModeBadge />
            </div>
          </div>
          <div className="branch-panel">
            {branches.map((branch) => (
              <div className="branch-row" key={branch.kind}>
                <div className="branch-label">
                  <span className={`branch-symbol ${branch.kind}`}>
                    <FlaskConical size={17} />
                  </span>
                  <div>
                    <strong>{branch.label}</strong>
                    <small>
                      {branch.sub} · {branch.data.candidate_label}
                    </small>
                  </div>
                </div>
                <div className="branch-visual">
                  <div className="bar-track">
                    <div
                      className={`bar-fill ${branch.kind}`}
                      style={{
                        width: `${Math.max(0, Math.min(100, (branch.data.coverage_fraction ?? 0) * 100))}%`,
                      }}
                    />
                  </div>
                  <strong>{formatPercent(branch.data.coverage_fraction)}</strong>
                </div>
                <div className="branch-status">
                  <StatusBadge status={branch.data.status} />
                </div>
              </div>
            ))}
          </div>
          <div className="comparison-grid">
            <div className="verdict-panel">
              <span className="section-kicker">COMPARISON VERDICT</span>
              <h2>
                {comparison.winner
                  ? `${readable(comparison.winner)} ${comparison.winner === 'tie' ? '' : 'branch leads'}`
                  : 'No verdict yet'}
              </h2>
              <p>
                Coverage delta{' '}
                <strong
                  className={
                    comparison.coverage_delta != null && comparison.coverage_delta < 0
                      ? 'negative-text'
                      : 'positive-text'
                  }
                >
                  {comparison.coverage_delta == null
                    ? 'Not available'
                    : `${comparison.coverage_delta >= 0 ? '+' : ''}${(comparison.coverage_delta * 100).toFixed(2)} percentage points`}
                </strong>
              </p>
              <div className="control-notes">
                <span>Evaluator: {fork.shared_evaluator_version}</span>
                <span>Dataset: {shortId(fork.shared_dataset_hash)}</span>
                {fork.shared_budget && <span>Budget: {fork.shared_budget}</span>}
              </div>
            </div>
            <div className="caveats-panel">
              <span className="section-kicker">INTERPRETATION NOTES</span>
              <h3>Confounds &amp; limitations</h3>
              <div className="caveat-list">
                <strong>Confounds</strong>
                {comparison.confounds.length ? (
                  comparison.confounds.map((item, index) => <p key={index}>{item}</p>)
                ) : (
                  <p>None reported by the backend.</p>
                )}
                <strong>Limitations</strong>
                {comparison.limitations.length ? (
                  comparison.limitations.map((item, index) => <p key={index}>{item}</p>)
                ) : (
                  <p>None reported by the backend.</p>
                )}
              </div>
            </div>
          </div>
          <p className="provenance-note">
            Comparison status: <strong>{comparison.status}</strong>. The fork response does not include a
            data_mode field, so the interface does not infer one.
          </p>
        </>
      )}
      {!fork && (
        <EmptyState
          title="No fork created yet"
          detail="Create a fork to compare independent and human-guided branches at the current guidance weight."
        />
      )}
    </section>
  )
}

function EventsView({
  events,
  nextSequence,
  loading,
  error,
  onMore,
  onRefresh,
}: {
  events: Event[]
  nextSequence: number | null
  loading: boolean
  error: string | null
  onMore: () => void
  onRefresh: () => void
}) {
  return (
    <section className="view-stack">
      <div className="view-intro">
        <div>
          <span className="eyebrow">
            <Activity size={14} /> PROVENANCE / EVENTS
          </span>
          <h1>Every step has a sequence.</h1>
          <p>Research events are ordered by the backend cursor. Data mode is shown for every event.</p>
        </div>
        <span className="intro-mark">04 / 04</span>
      </div>
      <div className="events-panel">
        <div className="panel-header">
          <div>
            <span className="section-kicker">EVENT LOG</span>
            <h2>{events.length} loaded events</h2>
          </div>
          <button className="quiet-button" type="button" onClick={onRefresh} disabled={loading}>
            <RefreshCw size={15} className={loading ? 'spin' : ''} /> Refresh
          </button>
        </div>
        {error && (
          <p className="inline-error" role="alert">
            {error}
          </p>
        )}
        {events.length ? (
          <div className="event-list">
            {events.map((item) => (
              <article className="event-row" key={item.id}>
                <span className="event-sequence">#{item.sequence}</span>
                <div>
                  <strong>{readable(item.type)}</strong>
                  <small>
                    {timeLabel(item.occurred_at)}
                    {item.entity_id ? ` · ${shortId(item.entity_id)}` : ''}
                  </small>
                </div>
                <ModeBadge mode={item.data_mode} />
              </article>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No events returned"
            detail="Events will appear here after the backend records project activity."
          />
        )}
        {nextSequence != null && (
          <button className="load-more" type="button" onClick={onMore} disabled={loading}>
            {loading ? 'Loading…' : `Load more after #${nextSequence}`} <ArrowRight size={15} />
          </button>
        )}
      </div>
    </section>
  )
}

function messageOf(error: unknown) {
  return error instanceof Error ? error.message : 'Something went wrong.'
}

export default function App() {
  const [project, setProject] = useState<SavedProject | null>(savedProject)
  const [projectTitle, setProjectTitle] = useState('Scene completion')
  const [objective, setObjective] = useState(
    'Improve coverage and geometric consistency in scene reconstruction.',
  )
  const [threshold, setThreshold] = useState('0.5')
  const [seed, setSeed] = useState('42')
  const [view, setView] = useState<View>('judgments')
  const [mobileNav, setMobileNav] = useState(false)
  const [health, setHealth] = useState<Health | null>(null)
  const [healthError, setHealthError] = useState(false)
  const [runs, setRuns] = useState<Run[]>([])
  const [goal, setGoal] = useState<GoalResult | null>(null)
  const [hasGoal, setHasGoal] = useState(false)
  const [projectBusy, setProjectBusy] = useState(false)
  const [goalBusy, setGoalBusy] = useState(false)
  const [setupError, setSetupError] = useState<string | null>(null)
  const [w, setW] = useState(1)
  const [policy, setPolicy] = useState<PolicyRun | null>(null)
  const [scoreBusy, setScoreBusy] = useState(false)
  const [scoreError, setScoreError] = useState<string | null>(null)
  const [profileRevision, setProfileRevision] = useState(0)
  const [principles, setPrinciples] = useState<Principle[]>([])
  const [profile, setProfile] = useState<Profile | null>(null)
  const [history, setHistory] = useState<ProfileVersion[]>([])
  const [profileLoadError, setProfileLoadError] = useState<string | null>(null)
  const [forks, setForks] = useState<ForkSummary[]>([])
  const [fork, setFork] = useState<Fork | null>(null)
  const [forkLoadError, setForkLoadError] = useState<string | null>(null)
  const [events, setEvents] = useState<Event[]>([])
  const [nextSequence, setNextSequence] = useState<number | null>(null)
  const [eventsBusy, setEventsBusy] = useState(false)
  const [eventsError, setEventsError] = useState<string | null>(null)
  const [agenda, setAgenda] = useState<AgendaItem[]>([])

  useEffect(() => {
    let live = true
    async function check() {
      try {
        const result = await getHealth()
        if (live) {
          setHealth(result)
          setHealthError(false)
        }
      } catch {
        if (live) {
          setHealth(null)
          setHealthError(true)
        }
      }
    }
    check()
    const timer = window.setInterval(check, 30000)
    return () => {
      live = false
      window.clearInterval(timer)
    }
  }, [])

  const refreshProfile = useCallback(async () => {
    if (!project) return
    const [p, h, current] = await Promise.allSettled([
      listPrinciples(project.id),
      getProfileHistory(project.id),
      getProfile(project.id),
    ])
    if (p.status === 'fulfilled') setPrinciples(p.value)
    if (h.status === 'fulfilled') setHistory(h.value)
    if (current.status === 'fulfilled') setProfile(current.value)
    if (p.status === 'rejected' || h.status === 'rejected') {
      const cause = p.status === 'rejected' ? p.reason : h.status === 'rejected' ? h.reason : null
      const detail = `Could not load researcher profile: ${messageOf(cause)}`
      setProfileLoadError(detail)
      throw new Error(detail)
    }
    setProfileLoadError(null)
  }, [project])

  const loadEventPage = useCallback(
    async (after: number, replace = false) => {
      if (!project) return
      setEventsBusy(true)
      setEventsError(null)
      try {
        const page = await listEvents(project.id, after, 20)
        setEvents((previous) => {
          const combined = replace ? page.events : [...previous, ...page.events]
          return [...new Map(combined.map((item) => [item.id, item])).values()].sort(
            (a, b) => a.sequence - b.sequence,
          )
        })
        setNextSequence(page.next_sequence ?? null)
      } catch (cause) {
        setEventsError(messageOf(cause))
      } finally {
        setEventsBusy(false)
      }
    },
    [project],
  )

  useEffect(() => {
    if (!project) return
    let live = true
    const id = project.id
    setHasGoal(false)
    setGoal(null)
    setRuns([])
    setPolicy(null)
    setFork(null)
    setForks([])
    setPrinciples([])
    setProfile(null)
    setHistory([])
    setProfileLoadError(null)
    setEvents([])
    setAgenda([])
    setSetupError(null)
    setForkLoadError(null)
    listRuns(id)
      .then((result) => {
        if (live) {
          setRuns(result)
          setHasGoal(result.length > 0)
        }
      })
      .catch((cause) => {
        if (live) setSetupError(`Could not load project runs: ${messageOf(cause)}`)
      })
    listAgenda(id)
      .then((result) => {
        if (live) setAgenda(result)
      })
      .catch(() => {})
    listForks(id)
      .then(async (result) => {
        if (!live) return
        setForks(result)
        if (result.length) {
          try {
            const detail = await getFork(id, result[result.length - 1].id)
            if (live) setFork(detail)
          } catch (cause) {
            if (live) setForkLoadError(`Could not load latest fork: ${messageOf(cause)}`)
          }
        }
      })
      .catch((cause) => {
        if (live) setForkLoadError(`Could not load forks: ${messageOf(cause)}`)
      })
    refreshProfile().catch(() => {})
    loadEventPage(0, true)
    return () => {
      live = false
    }
  }, [project?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!project || !hasGoal) return
    let live = true
    const controller = new AbortController()
    setPolicy(null)
    setScoreError(null)
    setScoreBusy(true)
    const timer = window.setTimeout(async () => {
      try {
        const result = await scorePolicy(project.id, w, controller.signal)
        if (live) setPolicy(result)
      } catch (cause) {
        if (live && !controller.signal.aborted) setScoreError(messageOf(cause))
      } finally {
        if (live) setScoreBusy(false)
      }
    }, 260)
    return () => {
      live = false
      controller.abort()
      window.clearTimeout(timer)
    }
  }, [project?.id, hasGoal, w, profileRevision])

  useEffect(() => {
    const clear = () => setScoreError(null)
    window.addEventListener('aporia:clear-score-error', clear)
    return () => window.removeEventListener('aporia:clear-score-error', clear)
  }, [])

  async function create(event: React.FormEvent) {
    event.preventDefault()
    if (!projectTitle.trim()) return
    setProjectBusy(true)
    setSetupError(null)
    try {
      const created = await createProject(projectTitle.trim(), objective.trim())
      const shortcut = { id: created.id, title: created.title }
      localStorage.setItem(storageKey, JSON.stringify(shortcut))
      setProject(shortcut)
      setView('judgments')
    } catch (cause) {
      setSetupError(messageOf(cause))
    } finally {
      setProjectBusy(false)
    }
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    if (!project) return
    const numericThreshold = Number(threshold),
      numericSeed = Number(seed)
    if (
      !Number.isFinite(numericThreshold) ||
      numericThreshold < 0 ||
      numericThreshold > 1 ||
      !Number.isInteger(numericSeed)
    ) {
      setSetupError('Enter a threshold from 0 to 1 and an integer seed.')
      return
    }
    setGoalBusy(true)
    setSetupError(null)
    try {
      const result = await submitGoal(project.id, numericThreshold, numericSeed)
      setGoal(result)
      setRuns(result.runs)
      setHasGoal(true)
      setView('judgments')
      listAgenda(project.id)
        .then(setAgenda)
        .catch(() => {})
      loadEventPage(0, true)
    } catch (cause) {
      setSetupError(messageOf(cause))
    } finally {
      setGoalBusy(false)
    }
  }

  function startNewProject() {
    localStorage.removeItem(storageKey)
    setProject(null)
    setView('judgments')
    setHasGoal(false)
    setGoal(null)
    setPolicy(null)
    setFork(null)
    setEvents([])
  }

  function onForkCreated(result: Fork) {
    setFork(result)
    setForkLoadError(null)
    if (project)
      listForks(project.id)
        .then(setForks)
        .catch(() => {})
    loadEventPage(0, true)
  }

  async function selectFork(id: string) {
    if (project) {
      setFork(await getFork(project.id, id))
      setForkLoadError(null)
    }
  }
  const latestEvents = useMemo(() => events.slice(-5), [events])
  const providerSummary = health?.providers ?? []
  const reportedCoverage = goal?.best_coverage ?? runs[runs.length - 1]?.coverage_fraction ?? null

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileNav ? 'open' : ''}`}>
        <div className="brand">
          <div className="brand-glyph">
            <span />
            <span />
            <span />
          </div>
          <div>
            <strong>APORIA</strong>
            <small>Research policy workspace</small>
          </div>
        </div>
        <div className="sidebar-scroll">
          <div className="rail-section">
            <div className="rail-label">PROJECT</div>
            {project ? (
              <div className="project-identity">
                <span className="project-symbol">
                  <FlaskConical size={18} />
                </span>
                <div>
                  <strong>{project.title}</strong>
                  <small>{shortId(project.id)}</small>
                </div>
              </div>
            ) : (
              <p className="rail-muted">No active project</p>
            )}
            {project && (
              <button className="rail-link" type="button" onClick={startNewProject}>
                <Plus size={15} /> New project
              </button>
            )}
          </div>
          <div className="rail-section">
            <div className="rail-label">WORKSPACE</div>
            {(
              [
                ['judgments', Scale, 'Judgments'],
                ['profile', ShieldCheck, 'Researcher profile'],
                ['forks', GitFork, 'Fork comparison'],
                ['events', Activity, 'Event log'],
              ] as const
            ).map(([target, Icon, label]) => (
              <button
                key={target}
                type="button"
                className={`nav-item ${view === target ? 'active' : ''}`}
                disabled={!project || !hasGoal}
                onClick={() => {
                  setView(target)
                  setMobileNav(false)
                }}
              >
                <Icon size={17} />
                <span>{label}</span>
                {view === target && <span className="nav-indicator" />}
              </button>
            ))}
          </div>
          <div className="rail-section">
            <div className="rail-label">RESEARCH AGENDA</div>
            {agenda.length ? (
              agenda.slice(0, 4).map((item) => (
                <div className="agenda-item" key={item.id}>
                  <span className="agenda-dot" />
                  <div>
                    <strong>{item.question}</strong>
                    <small>{readable(item.status)}</small>
                  </div>
                </div>
              ))
            ) : (
              <p className="rail-muted">Agenda items appear after a goal run.</p>
            )}
          </div>
        </div>
        <div className="sidebar-bottom">
          <div className={`connection-dot ${healthError || !health ? 'offline' : ''}`} />
          <span>
            {healthError ? 'Backend unreachable' : health ? `API ${health.api_version}` : 'Checking backend…'}
          </span>
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <button
            className="mobile-menu icon-button"
            type="button"
            aria-label={mobileNav ? 'Close navigation' : 'Open navigation'}
            onClick={() => setMobileNav(!mobileNav)}
          >
            {mobileNav ? <X size={20} /> : <Menu size={20} />}
          </button>
          <div className="breadcrumb">
            <span>Workspace</span>
            <span className="crumb-divider">/</span>
            <strong>
              {!project
                ? 'New project'
                : !hasGoal
                  ? 'Research goal'
                  : view === 'profile'
                    ? 'Researcher profile'
                    : view === 'forks'
                      ? 'Fork comparison'
                      : view === 'events'
                        ? 'Event log'
                        : 'Judgments'}
            </strong>
          </div>
          <div className="top-status">
            <span className={`api-pill ${healthError || !health ? 'offline' : 'online'}`}>
              <span className="connection-dot" />
              {healthError ? 'Backend offline' : health ? `Backend ${readable(health.status)}` : 'Connecting'}
            </span>
            {health && <ModeBadge mode={health.database_mode} />}
          </div>
        </header>
        <div className="work-content">
          <main className="main-content">
            {!project ? (
              <section className="setup-view">
                <span className="eyebrow">
                  <FlaskConical size={14} /> START A PROJECT
                </span>
                <h1>Begin with a research question.</h1>
                <p className="setup-lede">
                  Create a project in APORIA, then run a coverage goal before exploring server-scored
                  judgments.
                </p>
                <form className="setup-form" onSubmit={create}>
                  <label htmlFor="project-title">Project name</label>
                  <input
                    id="project-title"
                    value={projectTitle}
                    onChange={(event) => setProjectTitle(event.target.value)}
                    required
                    maxLength={120}
                  />
                  <label htmlFor="project-objective">
                    Objective <span>optional</span>
                  </label>
                  <textarea
                    id="project-objective"
                    rows={3}
                    value={objective}
                    onChange={(event) => setObjective(event.target.value)}
                  />
                  <button
                    className="primary-button"
                    type="submit"
                    disabled={projectBusy || !projectTitle.trim()}
                  >
                    {projectBusy ? 'Creating…' : 'Create project'} <ArrowRight size={16} />
                  </button>
                  <ErrorNote error={setupError} onDismiss={() => setSetupError(null)} />
                </form>
              </section>
            ) : !hasGoal ? (
              <section className="setup-view">
                <span className="eyebrow">
                  <FlaskConical size={14} /> PROJECT / GOAL
                </span>
                <h1>Set a measurable target.</h1>
                <p className="setup-lede">
                  Submit a coverage threshold and reproducible seed. The backend runs the experiment loop and
                  returns the results.
                </p>
                <div className="created-project">
                  <span className="project-symbol">
                    <Check size={18} />
                  </span>
                  <div>
                    <strong>{project.title}</strong>
                    <small>Project created · {shortId(project.id)}</small>
                  </div>
                </div>
                <form className="setup-form" onSubmit={submit}>
                  <div className="form-pair">
                    <div>
                      <label htmlFor="threshold">Coverage threshold</label>
                      <input
                        id="threshold"
                        type="number"
                        min="0"
                        max="1"
                        step="0.01"
                        value={threshold}
                        onChange={(event) => setThreshold(event.target.value)}
                        required
                      />
                      <small>Fraction, 0 to 1</small>
                    </div>
                    <div>
                      <label htmlFor="seed">Random seed</label>
                      <input
                        id="seed"
                        type="number"
                        step="1"
                        value={seed}
                        onChange={(event) => setSeed(event.target.value)}
                        required
                      />
                      <small>Integer for reproducibility</small>
                    </div>
                  </div>
                  <button className="primary-button" type="submit" disabled={goalBusy}>
                    {goalBusy ? 'Running goal…' : 'Submit goal'} <ArrowRight size={16} />
                  </button>
                  <ErrorNote error={setupError} onDismiss={() => setSetupError(null)} />
                </form>
              </section>
            ) : view === 'judgments' ? (
              <JudgmentView policy={policy} w={w} setW={setW} busy={scoreBusy} error={scoreError} />
            ) : view === 'profile' ? (
              <ProfileView
                projectId={project.id}
                principles={principles}
                history={history}
                profile={profile}
                loadError={profileLoadError}
                refresh={refreshProfile}
                onApproved={() => {
                  setProfileRevision((n) => n + 1)
                  loadEventPage(0, true)
                }}
              />
            ) : view === 'forks' ? (
              <ForkView
                projectId={project.id}
                w={w}
                fork={fork}
                forks={forks}
                loadError={forkLoadError}
                onCreated={onForkCreated}
                onSelect={selectFork}
              />
            ) : (
              <EventsView
                events={events}
                nextSequence={nextSequence}
                loading={eventsBusy}
                error={eventsError}
                onMore={() => nextSequence != null && loadEventPage(nextSequence)}
                onRefresh={() =>
                  loadEventPage(
                    events.length ? Math.max(...events.map((item) => item.sequence)) : 0,
                    !events.length,
                  )
                }
              />
            )}
          </main>
          <aside className="insights">
            <div className="insight-title">
              <span className="section-kicker">LIVE RESEARCH INSIGHTS</span>
              <span className={`live-indicator ${health ? '' : 'offline'}`}>
                <span />
                {health ? 'Connected' : 'Offline'}
              </span>
            </div>
            <div className="insight-section">
              <div className="insight-heading">
                <span className="insight-icon violet">
                  <Scale size={17} />
                </span>
                <span>Decision readout</span>
              </div>
              <strong className="insight-big">
                {policy?.selected_label ||
                  policy?.scores.find((item) => item.candidate_id === policy.selected_candidate_id)?.label ||
                  'Awaiting score'}
              </strong>
              <p>
                {policy
                  ? `Predicted at w = ${policy.w.toFixed(2)}. No experiment has been executed by this slider.`
                  : 'The server-selected experiment appears after a goal and policy score.'}
              </p>
              <ModeBadge />
            </div>
            <div className="insight-section">
              <div className="insight-heading">
                <span className="insight-icon green">
                  <Activity size={17} />
                </span>
                <span>{goal ? 'Goal best coverage' : 'Latest run coverage'}</span>
              </div>
              <strong className="insight-big metric">{formatPercent(reportedCoverage)}</strong>
              <p>
                {goal
                  ? goal.threshold_met
                    ? 'Submitted threshold met.'
                    : 'Submitted threshold not met.'
                  : 'Best coverage returned by the goal run.'}
              </p>
              <ModeBadge />
            </div>
            <div className="insight-section">
              <div className="insight-heading">
                <span className="insight-icon amber">
                  <ShieldCheck size={17} />
                </span>
                <span>Researcher profile</span>
              </div>
              <strong className="insight-big">
                {profile ? `Version ${profile.version}` : 'No profile version'}
              </strong>
              <p>
                {principles.filter((item) => item.approved && item.enabled).length} active principles ·{' '}
                {principles.filter((item) => !item.approved).length} pending approval
              </p>
            </div>
            <div className="insight-section provider-section">
              <div className="insight-heading">
                <span className="insight-icon blue">
                  <Activity size={17} />
                </span>
                <span>Backend &amp; providers</span>
              </div>
              {health ? (
                <>
                  <div className="provider-row">
                    <span>Database</span>
                    <ModeBadge mode={health.database_mode} />
                  </div>
                  {providerSummary.length ? (
                    providerSummary.map((item) => (
                      <div className="provider-row" key={item.provider}>
                        <span>
                          {item.provider}
                          {item.model_id && <small>{item.model_id}</small>}
                          {item.last_error && <small className="negative-text">{item.last_error}</small>}
                        </span>
                        <span className="provider-badges">
                          <span className={`status-badge ${item.connected ? 'green' : 'danger'}`}>
                            {item.connected ? 'Connected' : 'Disconnected'}
                          </span>
                          <ModeBadge mode={item.mode} />
                        </span>
                      </div>
                    ))
                  ) : (
                    <p>No providers reported.</p>
                  )}
                </>
              ) : (
                <p>
                  {healthError
                    ? 'Cannot reach http://localhost:8000. Start the backend and refresh.'
                    : 'Checking /api/v1/health…'}
                </p>
              )}
            </div>
          </aside>
        </div>
        <section className="timeline-dock">
          <div className="timeline-top">
            <div>
              <span className="section-kicker">EVENT TIMELINE</span>
              <span className="timeline-count">{events.length} loaded</span>
            </div>
            <button
              className="quiet-button"
              type="button"
              onClick={() => setView('events')}
              disabled={!project || !hasGoal}
            >
              View event log <ArrowRight size={15} />
            </button>
          </div>
          <div className="timeline-track">
            {latestEvents.length ? (
              latestEvents.map((item) => (
                <div className="timeline-event" key={item.id}>
                  <span className="timeline-node" />
                  <div>
                    <small>
                      #{item.sequence} · {timeLabel(item.occurred_at)}
                    </small>
                    <strong>{readable(item.type)}</strong>
                    <ModeBadge mode={item.data_mode} />
                  </div>
                </div>
              ))
            ) : (
              <div className="timeline-empty">
                {project
                  ? 'No project events returned yet.'
                  : 'Create a project to begin the research timeline.'}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
