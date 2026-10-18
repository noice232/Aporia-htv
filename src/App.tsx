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
function displayLabel(text: string) {
  const value = readable(text)
  return value.charAt(0).toUpperCase() + value.slice(1)
}
function timeLabel(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}
function eventForEntity(events: Event[], entityId: string | null | undefined) {
  return entityId ? [...events].reverse().find((item) => item.entity_id === entityId) : undefined
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
    : /pending|partial|unavailable|unknown|unguided_only|not_evaluated/i.test(status)
      ? 'amber'
      : 'green'
  return <span className={`status-badge ${kind}`}>{readable(status)}</span>
}

function ActionNotice({
  kind,
  message,
  action,
  onAction,
}: {
  kind: 'success' | 'warning' | 'error'
  message: string
  action?: string
  onAction?: () => void
}) {
  return (
    <div className={`action-notice ${kind}`} role={kind === 'error' ? 'alert' : 'status'}>
      <span>{message}</span>
      {action && onAction && (
        <button className="notice-action" type="button" onClick={onAction}>
          {action} <ArrowRight size={14} />
        </button>
      )}
    </div>
  )
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
  if (!score.feasible)
    return (
      <span className="infeasible-explanation">
        {score.infeasibility_reason || 'Backend marked this candidate infeasible.'}
      </span>
    )
  const groups = [
    { label: 'Independent', value: score.rubric_u },
    { label: 'Human-aligned', value: score.rubric_c },
  ]
  const hasRubric = groups.some((group) => group.value && Object.keys(group.value).length)
  if (!hasRubric) return <span className="muted">No rationale returned.</span>
  return (
    <details className="rubric-details">
      <summary>View rationale</summary>
      <div className="rubric-popover">
        {groups.map((group) => (
          <div className="rubric-group" key={group.label}>
            <strong>{group.label}</strong>
            {group.value ? (
              <ul>
                {Object.entries(group.value).map(([key, value]) => (
                  <li key={key}>
                    <span>{displayLabel(key)}</span>
                    <b>
                      {typeof value === 'object' && value !== null
                        ? Object.entries(value)
                            .map(([name, item]) => `${displayLabel(name)} ${String(item)}`)
                            .join(', ')
                        : String(value)}
                    </b>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No rationale returned.</p>
            )}
          </div>
        ))}
      </div>
    </details>
  )
}

function JudgmentView({
  policy,
  w,
  setW,
  busy,
  error,
  onRetry,
  onOpenProfile,
}: {
  policy: PolicyRun | null
  w: number
  setW: (value: number) => void
  busy: boolean
  error: string | null
  onRetry: () => void
  onOpenProfile: () => void
}) {
  const selected = policy?.scores.find((item) => item.candidate_id === policy.selected_candidate_id)
  const guidanceInert = policy?.fallback_reason === 'no_human_context'
  return (
    <section className="view-stack">
      <div className="view-intro">
        <div>
          <span className="eyebrow">
            <Scale size={14} /> POLICY / JUDGMENTS
          </span>
          <h1>Compare the next experiments.</h1>
          <p>
            Change the guidance weight to see which experiment the server would select. Scores are
            predictions, not outcomes.
          </p>
        </div>
        <span className="intro-mark">02 / 04</span>
      </div>
      {guidanceInert && (
        <ActionNotice
          kind="warning"
          message="Guidance inert — no approved principles yet. Approve a judgment to make the slider move the decision. Conditioned context is missing (backend fallback: no_human_context)."
          action="Open researcher profile"
          onAction={onOpenProfile}
        />
      )}
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
          disabled={guidanceInert}
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
          <span className="request-state" role="status">
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
      {error && (
        <ActionNotice
          kind="error"
          message={`Scoring failed: ${error}`}
          action="Retry score"
          onAction={onRetry}
        />
      )}
      <div className="table-panel">
        <div className="panel-header">
          <div>
            <span className="section-kicker">CANDIDATE DECISION TABLE</span>
            <h2>Score breakdown</h2>
            <p className="score-key">
              s<sub>u</sub> independent · s<sub>c</sub> human-aligned · Δ change · s<sub>g</sub> guided
            </p>
          </div>
          <div className="panel-meta">
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
                          <span className="candidate-name" title={score.label}>
                            {displayLabel(score.label)}
                          </span>
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
                : error
                  ? 'Retry the score request to load the candidate table.'
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
          <h3>
            {selected
              ? displayLabel(selected.label)
              : policy?.selected_label
                ? displayLabel(policy.selected_label)
                : 'No candidate selected'}
          </h3>
          <p>
            {guidanceInert
              ? 'Unguided selection. Approve a principle to enable human-aligned scoring. Predicted selection — not yet executed.'
              : policy?.fallback_reason
                ? readable(policy.fallback_reason)
                : selected
                  ? `Selected by the backend at w = ${policy?.w.toFixed(2)}. This is a prediction, not an executed experiment.`
                  : 'A selection will appear when the server returns a feasible candidate.'}
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
  onOpenJudgments,
}: {
  projectId: string
  principles: Principle[]
  history: ProfileVersion[]
  profile: Profile | null
  loadError: string | null
  refresh: () => Promise<void>
  onApproved: () => void
  onOpenJudgments: () => void
}) {
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [approving, setApproving] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [failedPrinciple, setFailedPrinciple] = useState<string | null>(null)
  async function submit(event: React.FormEvent) {
    event.preventDefault()
    if (!text.trim()) return
    setBusy(true)
    setError(null)
    setSuccess(null)
    try {
      await submitJudgment(projectId, text.trim())
      setText('')
      setSuccess('Judgment submitted. It is pending until you approve it below.')
      try {
        await refresh()
      } catch {
        setError('Judgment submitted, but the profile could not be refreshed. Retry loading profile.')
      }
    } catch (cause) {
      setError(messageOf(cause))
    } finally {
      setBusy(false)
    }
  }
  async function approve(id: string) {
    setApproving(id)
    setError(null)
    setSuccess(null)
    setFailedPrinciple(null)
    try {
      await approvePrinciple(projectId, id)
      setSuccess('Principle approved. The server is updating the decision preview.')
      onApproved()
      try {
        await refresh()
      } catch {
        setError('Principle approved, but the profile could not be refreshed. Retry loading profile.')
      }
    } catch (cause) {
      setError(messageOf(cause))
      setFailedPrinciple(id)
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
          <h1>Teach the policy what matters.</h1>
          <p>
            Write one research preference, then approve it. Only approved principles affect the server's
            human-aligned score.
          </p>
        </div>
        <span className="intro-mark">01 / 04</span>
      </div>
      {loadError && (
        <ActionNotice
          kind="error"
          message={loadError}
          action="Retry loading profile"
          onAction={() => {
            refresh().catch(() => {})
          }}
        />
      )}
      {success ? (
        <ActionNotice
          kind="success"
          message={success}
          action={active.length ? 'Compare decisions' : undefined}
          onAction={active.length ? onOpenJudgments : undefined}
        />
      ) : active.length > 0 ? (
        <ActionNotice
          kind="success"
          message={`${active.length} approved principle${active.length === 1 ? '' : 's'} can guide the next decision.`}
          action="Compare decisions"
          onAction={onOpenJudgments}
        />
      ) : (
        <ActionNotice
          kind="warning"
          message="Guidance is inactive until you submit and approve a judgment."
        />
      )}
      <form className="editor-panel" onSubmit={submit}>
        <div className="panel-header">
          <div>
            <span className="section-kicker">NEW JUDGMENT</span>
            <h2>Capture a research preference</h2>
          </div>
          <span className="status-badge amber">Approval required</span>
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
            {busy ? 'Submitting…' : error && text.trim() ? 'Retry submission' : 'Submit judgment'}
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
                    {approving === item.id
                      ? 'Approving…'
                      : failedPrinciple === item.id
                        ? 'Retry approval'
                        : 'Approve'}{' '}
                    <ArrowRight size={14} />
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
  loading,
  loadError,
  onCreated,
  onSelect,
  onReload,
}: {
  projectId: string
  w: number
  fork: Fork | null
  forks: ForkSummary[]
  loading: boolean
  loadError: string | null
  onCreated: (fork: Fork) => void
  onSelect: (id: string) => Promise<void>
  onReload: () => Promise<void>
}) {
  const [busy, setBusy] = useState(false)
  const [selecting, setSelecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectError, setSelectError] = useState<string | null>(null)
  const [failedSelectionId, setFailedSelectionId] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [retryKey, setRetryKey] = useState<string | null>(null)
  useEffect(() => {
    setRetryKey(null)
    setError(null)
  }, [w])
  async function create() {
    setBusy(true)
    setError(null)
    setSuccess(null)
    const key = retryKey ?? crypto.randomUUID()
    setRetryKey(key)
    try {
      const result = await createFork(projectId, w, key)
      onCreated(result)
      setSuccess(
        `Fork ${shortId(result.id)} created. Comparison status: ${readable(result.comparison.status)}.`,
      )
      setRetryKey(null)
    } catch (cause) {
      setError(messageOf(cause))
    } finally {
      setBusy(false)
    }
  }
  async function select(id: string) {
    setSelecting(true)
    setSelectError(null)
    try {
      await onSelect(id)
      setFailedSelectionId(null)
    } catch (cause) {
      setSelectError(messageOf(cause))
      setFailedSelectionId(id)
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
  const delta = comparison?.coverage_delta
  const deltaText = delta == null ? 'Awaiting results' : `${delta > 0 ? '+' : ''}${(delta * 100).toFixed(2)}%`
  const winnerText = !comparison?.winner
    ? 'No winner reported'
    : comparison.winner === 'tie'
      ? 'Tie'
      : `${displayLabel(comparison.winner)} branch leads`
  return (
    <section className="view-stack">
      <div className="view-intro">
        <div>
          <span className="eyebrow">
            <GitFork size={14} /> EVIDENCE / FORKS
          </span>
          <h1>See what changed in the fork.</h1>
          <p>
            The backend runs independent and guided branches from the same checkpoint, then reports coverage
            and the limits of the comparison.
          </p>
        </div>
        <span className="intro-mark">03 / 04</span>
      </div>
      {loadError && (
        <ActionNotice
          kind="error"
          message={loadError}
          action="Retry loading forks"
          onAction={() => onReload().catch(() => {})}
        />
      )}
      <div className="fork-toolbar">
        <div>
          <span className="section-kicker">COUNTERFACTUAL EXPERIMENT</span>
          <h2>Compare at w = {w.toFixed(2)}</h2>
          <p>The backend chooses both branches and reports the comparison.</p>
        </div>
        <button className="primary-button" type="button" onClick={create} disabled={busy}>
          <GitFork size={16} />
          {busy ? 'Creating fork…' : error ? 'Retry fork' : 'Create fork'}
        </button>
      </div>
      {error && (
        <ActionNotice kind="error" message={`Fork failed: ${error}`} action="Retry fork" onAction={create} />
      )}
      {selectError && failedSelectionId && (
        <ActionNotice
          kind="error"
          message={`Could not open saved fork: ${selectError}`}
          action="Retry opening fork"
          onAction={() => select(failedSelectionId)}
        />
      )}
      {success && <ActionNotice kind="success" message={success} />}
      {selecting && <ActionNotice kind="warning" message="Loading saved fork…" />}
      {fork && comparison && (
        <>
          <div className="fork-heading">
            <div>
              <span className="section-kicker">FORK {shortId(fork.id)}</span>
              <h2>Matched branch results</h2>
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
            </div>
          </div>
          <div className="fork-outcome" role="status">
            <div className={`fork-delta ${delta == null ? 'pending' : ''}`}>
              <span className="section-kicker">COVERAGE DELTA</span>
              <strong className={delta == null ? 'muted' : delta < 0 ? 'negative-text' : 'positive-text'}>
                {deltaText}
              </strong>
              <small>
                {delta == null
                  ? 'Both branches need coverage results.'
                  : comparison.status === 'complete'
                    ? 'Percentage-point difference: guided minus independent.'
                    : 'Provisional percentage-point difference; comparison incomplete.'}
              </small>
            </div>
            <div className="fork-verdict">
              <span className="section-kicker">REPORTED VERDICT</span>
              <h3>
                {comparison.status === 'complete'
                  ? winnerText
                  : comparison.winner
                    ? `Provisional: ${winnerText}`
                    : 'Awaiting both branches'}
              </h3>
              <p>
                {comparison.status === 'complete'
                  ? 'Both branch results are available.'
                  : comparison.status === 'partial'
                    ? 'Only part of the comparison is available. This is not a final result.'
                    : 'The comparison is pending. No outcome is claimed yet.'}
              </p>
            </div>
          </div>
          <div className="branch-panel" aria-label="Branch coverage">
            {branches.map((branch) => (
              <div
                className={`branch-card ${branch.data.status === 'not_evaluated' ? 'not-evaluated' : ''}`}
                key={branch.kind}
              >
                <div className="branch-card-top">
                  <span className={`branch-symbol ${branch.kind}`}>
                    <FlaskConical size={17} />
                  </span>
                  <div>
                    <strong>{branch.label}</strong>
                    <small>{branch.sub}</small>
                  </div>
                  <StatusBadge status={branch.data.status} />
                </div>
                <p className="branch-candidate">{displayLabel(branch.data.candidate_label)}</p>
                <div className="branch-metric">
                  <strong>
                    {branch.data.status === 'evaluated'
                      ? formatPercent(branch.data.coverage_fraction)
                      : 'Not evaluated'}
                  </strong>
                  <span>coverage</span>
                </div>
                <div className="bar-track" aria-hidden="true">
                  <div
                    className={`bar-fill ${branch.kind}`}
                    style={{
                      width: `${branch.data.status === 'evaluated' ? Math.max(0, Math.min(100, (branch.data.coverage_fraction ?? 0) * 100)) : 0}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="comparison-grid">
            <div className="verdict-panel">
              <span className="section-kicker">SHARED CONTROLS</span>
              <h2>What both branches used</h2>
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
            Status: <strong>{comparison.status}</strong>. Fork provenance is not specified by this response;
            event badges show their own data modes.
          </p>
        </>
      )}
      {!fork && loading ? (
        <EmptyState title="Loading forks" detail="Checking the backend for saved comparisons." />
      ) : (
        !fork && (
          <EmptyState
            title={loadError ? 'Saved forks unavailable' : 'No fork created yet'}
            detail={
              loadError
                ? 'Retry loading forks, or create a new comparison at the current guidance weight.'
                : 'Create a fork to compare independent and human-guided branches at the current guidance weight.'
            }
          />
        )
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
  const [view, setView] = useState<View>('profile')
  const [mobileNav, setMobileNav] = useState(false)
  const [health, setHealth] = useState<Health | null>(null)
  const [healthError, setHealthError] = useState(false)
  const [runs, setRuns] = useState<Run[]>([])
  const [runsLoading, setRunsLoading] = useState(false)
  const [runLoadError, setRunLoadError] = useState<string | null>(null)
  const [goal, setGoal] = useState<GoalResult | null>(null)
  const [hasGoal, setHasGoal] = useState(false)
  const [projectBusy, setProjectBusy] = useState(false)
  const [goalBusy, setGoalBusy] = useState(false)
  const [setupError, setSetupError] = useState<string | null>(null)
  const [setupSuccess, setSetupSuccess] = useState<string | null>(null)
  const [w, setW] = useState(1)
  const [policy, setPolicy] = useState<PolicyRun | null>(null)
  const [scoreBusy, setScoreBusy] = useState(false)
  const [scoreError, setScoreError] = useState<string | null>(null)
  const [scoreAttempt, setScoreAttempt] = useState(0)
  const [profileRevision, setProfileRevision] = useState(0)
  const [principles, setPrinciples] = useState<Principle[]>([])
  const [profile, setProfile] = useState<Profile | null>(null)
  const [history, setHistory] = useState<ProfileVersion[]>([])
  const [profileLoadError, setProfileLoadError] = useState<string | null>(null)
  const [forks, setForks] = useState<ForkSummary[]>([])
  const [fork, setFork] = useState<Fork | null>(null)
  const [forksLoading, setForksLoading] = useState(false)
  const [forkLoadError, setForkLoadError] = useState<string | null>(null)
  const [events, setEvents] = useState<Event[]>([])
  const [nextSequence, setNextSequence] = useState<number | null>(null)
  const [eventsBusy, setEventsBusy] = useState(false)
  const [eventsError, setEventsError] = useState<string | null>(null)
  const [agenda, setAgenda] = useState<AgendaItem[]>([])

  const refreshHealth = useCallback(async () => {
    try {
      const result = await getHealth()
      setHealth(result)
      setHealthError(false)
    } catch {
      setHealth(null)
      setHealthError(true)
    }
  }, [])
  useEffect(() => {
    refreshHealth()
    const timer = window.setInterval(refreshHealth, 30000)
    return () => window.clearInterval(timer)
  }, [refreshHealth])

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

  async function retryRuns() {
    if (!project) return
    setRunsLoading(true)
    setRunLoadError(null)
    try {
      const result = await listRuns(project.id)
      setRuns(result)
      setHasGoal(result.length > 0)
    } catch (cause) {
      setRunLoadError(`Could not load project runs: ${messageOf(cause)}`)
    } finally {
      setRunsLoading(false)
    }
  }

  async function retryForks() {
    if (!project) return
    setForksLoading(true)
    setForkLoadError(null)
    try {
      const result = await listForks(project.id)
      setForks(result)
      if (result.length && !fork) setFork(await getFork(project.id, result[result.length - 1].id))
    } catch (cause) {
      setForkLoadError(`Could not load forks: ${messageOf(cause)}`)
    } finally {
      setForksLoading(false)
    }
  }

  useEffect(() => {
    if (!project) return
    let live = true
    const id = project.id
    setHasGoal(false)
    setGoal(null)
    setRuns([])
    setRunsLoading(true)
    setRunLoadError(null)
    setPolicy(null)
    setFork(null)
    setForks([])
    setForksLoading(true)
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
          setRunLoadError(null)
        }
      })
      .catch((cause) => {
        if (live) setRunLoadError(`Could not load project runs: ${messageOf(cause)}`)
      })
      .finally(() => {
        if (live) setRunsLoading(false)
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
      .finally(() => {
        if (live) setForksLoading(false)
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
        if (live) {
          setPolicy(result)
          loadEventPage(0, true)
        }
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
  }, [project?.id, hasGoal, w, profileRevision, scoreAttempt, loadEventPage])

  async function create(event: React.FormEvent) {
    event.preventDefault()
    if (!projectTitle.trim()) return
    setProjectBusy(true)
    setSetupError(null)
    setSetupSuccess(null)
    try {
      const created = await createProject(projectTitle.trim(), objective.trim())
      const shortcut = { id: created.id, title: created.title }
      localStorage.setItem(storageKey, JSON.stringify(shortcut))
      setProject(shortcut)
      setView('profile')
      setSetupSuccess('Project created. Set a coverage goal to begin the research flow.')
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
    setSetupSuccess(null)
    try {
      const result = await submitGoal(project.id, numericThreshold, numericSeed)
      setGoal(result)
      setRuns(result.runs)
      setHasGoal(true)
      setView('profile')
      setSetupSuccess('Goal run returned. Next, submit and approve a researcher judgment.')
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
    setView('profile')
    setSetupSuccess(null)
    setHasGoal(false)
    setGoal(null)
    setPolicy(null)
    setFork(null)
    setForksLoading(false)
    setEvents([])
    setRunsLoading(false)
    setRunLoadError(null)
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
  const selectedPolicyLabel =
    policy?.selected_label ??
    policy?.scores.find((item) => item.candidate_id === policy.selected_candidate_id)?.label
  const policyModeEvent = eventForEntity(events, policy?.id)
  const coverageRunId = goal
    ? goal.runs.find((run) => run.coverage_fraction === goal.best_coverage)?.id
    : runs[runs.length - 1]?.id
  const coverageModeEvent = eventForEntity(events, coverageRunId)

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
            <div className="rail-label">RESEARCH FLOW</div>
            {(
              [
                ['profile', ShieldCheck, 'Researcher profile'],
                ['judgments', Scale, 'Judgments'],
                ['forks', GitFork, 'Fork comparison'],
                ['events', Activity, 'Event log'],
              ] as const
            ).map(([target, Icon, label], index) => (
              <button
                key={target}
                type="button"
                className={`nav-item ${view === target ? 'active' : ''}`}
                disabled={!project || !hasGoal}
                onClick={() => {
                  setView(target)
                  setSetupSuccess(null)
                  setMobileNav(false)
                }}
              >
                <Icon size={17} />
                <small className="nav-step">{index + 1}</small>
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
            <button
              className={`api-pill ${healthError || !health ? 'offline' : /^(ok|healthy)$/i.test(health.status) ? 'online' : 'degraded'}`}
              type="button"
              onClick={refreshHealth}
              title="Refresh backend status"
            >
              <span className="connection-dot" />
              {healthError ? 'Backend offline' : health ? `Backend ${readable(health.status)}` : 'Connecting'}
              <RefreshCw size={12} />
            </button>
            {health && <ModeBadge mode={health.database_mode} />}
          </div>
        </header>
        <div className="work-content">
          <main className="main-content">
            {healthError && project && (
              <ActionNotice
                kind="warning"
                message="Backend unreachable. Showing the last fetched project data; new actions may fail."
                action="Retry connection"
                onAction={refreshHealth}
              />
            )}
            {setupSuccess && <ActionNotice kind="success" message={setupSuccess} />}
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
                    {projectBusy ? 'Creating…' : setupError ? 'Retry create project' : 'Create project'}{' '}
                    <ArrowRight size={16} />
                  </button>
                  <ErrorNote error={setupError} onDismiss={() => setSetupError(null)} />
                </form>
              </section>
            ) : runsLoading ? (
              <section className="setup-view">
                <EmptyState
                  title="Loading project"
                  detail="Checking the backend for prior runs before showing the next step."
                />
              </section>
            ) : runLoadError ? (
              <section className="setup-view">
                <h1>Project could not be loaded.</h1>
                <ActionNotice
                  kind="error"
                  message={runLoadError}
                  action="Retry loading project"
                  onAction={retryRuns}
                />
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
                    {goalBusy ? 'Running goal…' : setupError ? 'Retry goal' : 'Submit goal'}{' '}
                    <ArrowRight size={16} />
                  </button>
                  <ErrorNote error={setupError} onDismiss={() => setSetupError(null)} />
                </form>
              </section>
            ) : view === 'judgments' ? (
              <JudgmentView
                policy={policy}
                w={w}
                setW={setW}
                busy={scoreBusy}
                error={scoreError}
                onRetry={() => setScoreAttempt((attempt) => attempt + 1)}
                onOpenProfile={() => setView('profile')}
              />
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
                onOpenJudgments={() => {
                  setView('judgments')
                  setSetupSuccess(null)
                }}
              />
            ) : view === 'forks' ? (
              <ForkView
                projectId={project.id}
                w={w}
                fork={fork}
                forks={forks}
                loading={forksLoading}
                loadError={forkLoadError}
                onCreated={onForkCreated}
                onSelect={selectFork}
                onReload={retryForks}
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
              <span className="section-kicker">RESEARCH SUMMARY</span>
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
                {selectedPolicyLabel ? displayLabel(selectedPolicyLabel) : 'Awaiting score'}
              </strong>
              <p>
                {policy
                  ? `Predicted at w = ${policy.w.toFixed(2)}. No experiment has been executed by this slider.`
                  : 'The server-selected experiment appears after a goal and policy score.'}
              </p>
              {policy && (
                <small className="result-source">
                  Policy run {shortId(policy.id)} · {timeLabel(policy.computed_at)}
                </small>
              )}
              {policyModeEvent && (
                <div className="matched-mode">
                  <ModeBadge mode={policyModeEvent.data_mode} />
                  <small>Matching event #{policyModeEvent.sequence}</small>
                </div>
              )}
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
                  : reportedCoverage == null
                    ? 'No coverage result returned yet.'
                    : 'Coverage reported by the latest run.'}
              </p>
              <small className="result-source">
                {goal ? 'Goal result from backend' : 'Latest run from backend'}
              </small>
              {coverageModeEvent && (
                <div className="matched-mode">
                  <ModeBadge mode={coverageModeEvent.data_mode} />
                  <small>Matching run event #{coverageModeEvent.sequence}</small>
                </div>
              )}
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
                    ? 'The API is unreachable. Retry connection or check the backend on the Vite host.'
                    : 'Checking /api/v1/health…'}
                </p>
              )}
            </div>
            <p className="rail-provenance">
              Result badges use events matching the policy or run ID. Without a matching event, the response
              provides no record-level data mode.
            </p>
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
