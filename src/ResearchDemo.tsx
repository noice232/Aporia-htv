import { useEffect, useState } from 'react'
import {
  Activity,
  ArrowRight,
  BookOpen,
  BrainCircuit,
  Check,
  ChevronRight,
  CircleHelp,
  Compass,
  ExternalLink,
  FlaskConical,
  GitBranch,
  GitFork,
  Globe2,
  Layers3,
  MessageSquareText,
  Network,
  Play,
  Scale,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
  WandSparkles,
} from 'lucide-react'

type StageId =
  | 'intake'
  | 'corpus'
  | 'plan'
  | 'experiment'
  | 'frontier'
  | 'guidance'
  | 'fork'
  | 'parallax'
  | 'team'
  | 'meta'
type Stage = { id: StageId; name: string; detail: string; icon: typeof Compass; group: string }
type SavedSession = { id: string; title: string; goal: string; domain: string | null; updated_at: string }
type SavedDetail = SavedSession & {
  steps: { id: string; title: string; status: string; data_mode: string; sequence: number }[]
  checkpoints: {
    id: string
    prompt: string
    answer: string | null
    guidance_weight: number | null
    sequence: number
    answer_sequence: number | null
  }[]
}

const stages: Stage[] = [
  { id: 'intake', name: 'Research intake', detail: 'State the question', icon: Compass, group: 'DISCOVER' },
  { id: 'corpus', name: 'Papiers & corpus', detail: 'Ground the context', icon: BookOpen, group: 'DISCOVER' },
  {
    id: 'plan',
    name: 'Scientific compiler',
    detail: 'Hypotheses and protocol',
    icon: WandSparkles,
    group: 'INVESTIGATE',
  },
  {
    id: 'experiment',
    name: 'Experiment lab',
    detail: 'Run and inspect evidence',
    icon: FlaskConical,
    group: 'INVESTIGATE',
  },
  {
    id: 'frontier',
    name: 'FRONTIER graph',
    detail: 'Discover dependencies',
    icon: Network,
    group: 'INVESTIGATE',
  },
  {
    id: 'guidance',
    name: 'Human judgment',
    detail: 'CFG experiment policy',
    icon: BrainCircuit,
    group: 'COLLABORATE',
  },
  { id: 'fork', name: 'FORK explorer', detail: 'Compare two paths', icon: GitFork, group: 'COLLABORATE' },
  { id: 'parallax', name: 'PARALLAX court', detail: 'Challenge claims', icon: Scale, group: 'COLLABORATE' },
  { id: 'team', name: 'River & memory', detail: 'Review reusable skills', icon: Users, group: 'COMPOUND' },
  { id: 'meta', name: 'Meta research', detail: 'Improve the policy', icon: Activity, group: 'COMPOUND' },
]

const systemModules: { code: string; name: string; description: string; stage: StageId }[] = [
  {
    code: 'M01',
    name: 'Research spaces',
    description: 'Projects, sessions, roles and durable decisions',
    stage: 'intake',
  },
  {
    code: 'M02',
    name: 'Papiers & corpus',
    description: 'Sourced papers, personal notes and access scope',
    stage: 'corpus',
  },
  {
    code: 'M03',
    name: 'Scientific compiler',
    description: 'Hypotheses, protocols and approval',
    stage: 'plan',
  },
  {
    code: 'M04',
    name: 'Autoresearch runner',
    description: 'Bounded runs, metrics and artifacts',
    stage: 'experiment',
  },
  { code: 'M05', name: 'FRONTIER', description: 'Executable questions and dependencies', stage: 'frontier' },
  {
    code: 'M06',
    name: 'Judgment & CFG',
    description: 'Dual scores and guided action selection',
    stage: 'guidance',
  },
  { code: 'M07', name: 'PARALLAX', description: 'Evidence-backed disagreement', stage: 'parallax' },
  {
    code: 'M08',
    name: 'Expert routing',
    description: 'Human questions and scoped intervention',
    stage: 'guidance',
  },
  { code: 'M09', name: 'FORK', description: 'Matched counterfactual experiments', stage: 'fork' },
  { code: 'M10', name: 'River sessions', description: 'Authorized team research activity', stage: 'team' },
  {
    code: 'M11',
    name: 'Transfer & truth',
    description: 'Reviewed skills and claim maintenance',
    stage: 'team',
  },
  { code: 'M12', name: 'Meta research', description: 'Trials of research policies', stage: 'meta' },
  {
    code: 'M13',
    name: 'Model provider',
    description: 'Grounded plan proposals through an adapter',
    stage: 'plan',
  },
  {
    code: 'M14',
    name: 'Data platform',
    description: 'Events, analytics and durable provenance',
    stage: 'meta',
  },
  {
    code: 'M15',
    name: 'Paper universe',
    description: 'Sourced semantic graph and scene viewer',
    stage: 'frontier',
  },
  {
    code: 'M16',
    name: 'Operations',
    description: 'Health, tests, deployment and ownership',
    stage: 'intake',
  },
]

const stageCopy: Record<StageId, { eyebrow: string; headline: string; explanation: string; action: string }> =
  {
    intake: {
      eyebrow: '01 / RESEARCH INTAKE',
      headline: 'A broad question becomes an investigation.',
      explanation:
        'Define the scientific objective, domain, source scope, budget and success criteria. The human approves the plan before expensive work begins.',
      action: 'Create a session',
    },
    corpus: {
      eyebrow: '02 / KNOWLEDGE RETRIEVAL',
      headline: 'Start with what researchers already know.',
      explanation:
        'Retrieve literature and authorized Papiers highlights with exact source references. Personal notes stay distinct from public papers and from scientific evidence.',
      action: 'Inspect source status',
    },
    plan: {
      eyebrow: '03 / SCIENTIFIC COMPILER',
      headline: 'Turn intent into falsifiable choices.',
      explanation:
        'A plan contains competing hypotheses, controlled protocols, explicit metrics, expected failure signals and a review checkpoint.',
      action: 'Review proposed plan',
    },
    experiment: {
      eyebrow: '04 / EXPERIMENT LAB',
      headline: 'Evidence changes the next step.',
      explanation:
        'An agent runs a bounded experiment, records the dataset and evaluator, then examines outputs and failures. The physical scene viewer is a separate, concrete workspace.',
      action: 'Open 3D scene lab',
    },
    frontier: {
      eyebrow: '05 / FRONTIER',
      headline: 'A blocker creates a child investigation.',
      explanation:
        'Evidence-backed problems become actionable nodes with dependencies, owners and completion criteria. Resolving a child can unblock its parent after verification.',
      action: 'Inspect dependency',
    },
    guidance: {
      eyebrow: '06 / HUMAN JUDGMENT',
      headline: 'Let expertise change the experiment choice.',
      explanation:
        'The same candidate actions are scored independently and with approved human context. A guidance weight changes the ranking, while measured outcomes remain separate.',
      action: 'Record judgment',
    },
    fork: {
      eyebrow: '07 / CONTROLLED FORK',
      headline: 'Test whether guidance helped.',
      explanation:
        'Run independent and guided choices against the same dataset, evaluator and resource budget. A comparison remains pending until both branches produce evidence.',
      action: 'Inspect branch design',
    },
    parallax: {
      eyebrow: '08 / PARALLAX',
      headline: 'Disagreement becomes a test.',
      explanation:
        'Competing claims preserve sources and uncertainty. The system proposes discriminating experiments instead of silently resolving a scientific dispute.',
      action: 'Inspect dispute',
    },
    team: {
      eyebrow: '09 / COLLECTIVE MEMORY',
      headline: 'A useful result can become a reviewed skill.',
      explanation:
        'An authorized team session exposes decisions and evidence. Reusable methods require review before another agent can apply them to a different project.',
      action: 'Inspect review path',
    },
    meta: {
      eyebrow: '10 / META RESEARCH',
      headline: 'Improve how research is done.',
      explanation:
        'Compare policies across matched evaluations, track when human intervention was useful, and propose versioned changes only after enough evidence exists.',
      action: 'Inspect policy study',
    },
  }

const cameraGoal =
  'Find a camera angle that reveals useful scene content while controlling missing-region artifacts.'
const candidateScores = [
  { id: 'A', name: 'Appearance-first view', unconditioned: 0.8, conditioned: 0.5, color: 'violet' },
  { id: 'B', name: 'Geometry-first view', unconditioned: 0.6, conditioned: 0.9, color: 'mint' },
]

function stageIndex(id: StageId) {
  return stages.findIndex((stage) => stage.id === id)
}

export default function ResearchDemo() {
  const [activeStage, setActiveStage] = useState<StageId>('intake')
  const [goalDraft, setGoalDraft] = useState(cameraGoal)
  const [goal, setGoal] = useState(cameraGoal)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [sessionMode, setSessionMode] = useState<'preview' | 'persistent' | 'browser'>('preview')
  const [papiersConnected, setPapiersConnected] = useState(false)
  const [papiersChecked, setPapiersChecked] = useState(false)
  const [weight, setWeight] = useState(1)
  const [judgment, setJudgment] = useState('')
  const [savedJudgment, setSavedJudgment] = useState('')
  const [feedback, setFeedback] = useState('')
  const [recentSessions, setRecentSessions] = useState<SavedSession[]>([])
  const [sessionDetail, setSessionDetail] = useState<SavedDetail | null>(null)

  const isCamera = goal === cameraGoal
  const current = stageCopy[activeStage]
  const winner = candidateScores.reduce((best, item) =>
    item.unconditioned + weight * (item.conditioned - item.unconditioned) >
    best.unconditioned + weight * (best.conditioned - best.unconditioned)
      ? item
      : best,
  )
  const savedEvents = sessionDetail
    ? [
        ...sessionDetail.steps.map((step) => ({
          sequence: step.sequence,
          title: step.title,
          label: `${step.data_mode} · ${step.status}`,
        })),
        ...sessionDetail.checkpoints.map((checkpoint) => ({
          sequence: checkpoint.answer_sequence ?? checkpoint.sequence,
          title: checkpoint.answer ? `Human: ${checkpoint.answer}` : checkpoint.prompt,
          label: checkpoint.answer
            ? `Guidance w=${checkpoint.guidance_weight ?? 'unset'}`
            : 'Needs human input',
        })),
      ].sort((a, b) => a.sequence - b.sequence)
    : []

  useEffect(() => {
    document.title = 'APORIA · Research workspace'
    void fetch('/api/v1/papiers/status')
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        setPapiersConnected(data?.connected === true)
        setPapiersChecked(true)
      })
      .catch(() => setPapiersChecked(true))
    void refreshSessions()
  }, [])

  async function refreshSessions() {
    try {
      const response = await fetch('/api/v1/research-sessions')
      if (!response.ok) return
      setRecentSessions((await response.json()) as SavedSession[])
    } catch {
      /* Backend is optional in the browser preview. */
    }
  }

  async function openSession(id: string, resetStage = true) {
    try {
      const response = await fetch(`/api/v1/research-sessions/${id}`)
      if (!response.ok) throw new Error('Session unavailable')
      const data = (await response.json()) as SavedDetail
      setSessionId(data.id)
      setSessionDetail(data)
      setGoal(data.goal)
      setGoalDraft(data.goal)
      setSessionMode('persistent')
      if (resetStage) setActiveStage('intake')
      const latestAnswer = [...data.checkpoints].reverse().find((checkpoint) => checkpoint.answer)
      setSavedJudgment(latestAnswer?.answer ?? '')
      if (latestAnswer?.guidance_weight != null) setWeight(latestAnswer.guidance_weight)
      setFeedback('Saved research session reopened. Its checkpoints and recorded steps are shown below.')
    } catch {
      setFeedback('The saved session could not be opened.')
    }
  }

  async function createSession() {
    const nextGoal = goalDraft.trim()
    if (!nextGoal) return
    setGoal(nextGoal)
    setSessionId(null)
    setSessionDetail(null)
    setSavedJudgment('')
    setFeedback('')
    try {
      const response = await fetch('/api/v1/research-sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: nextGoal.length > 72 ? `${nextGoal.slice(0, 69)}...` : nextGoal,
          goal: nextGoal,
          domain: nextGoal === cameraGoal ? '3D scene research' : 'General research',
        }),
      })
      if (!response.ok) throw new Error('Session API unavailable')
      const data = (await response.json()) as { id: string }
      setSessionId(data.id)
      setSessionMode('persistent')
      await refreshSessions()
      await openSession(data.id)
      setFeedback(
        'Research session saved to the local backend. Workflow cards are a preview of the intended process.',
      )
    } catch {
      setSessionMode('browser')
      setFeedback('Goal opened in this browser. Start the backend to save research sessions.')
    }
  }

  async function recordJudgment() {
    const answer = judgment.trim()
    if (!answer) return
    setSavedJudgment(answer)
    setJudgment('')
    if (!sessionId) {
      setFeedback('Judgment recorded in this browser preview.')
      return
    }
    try {
      const opened = await fetch(`/api/v1/research-sessions/${sessionId}/checkpoints`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: 'What should matter in the next experiment?',
          reason: 'Human scientific judgment',
        }),
      })
      if (!opened.ok) throw new Error('Checkpoint unavailable')
      const checkpoint = (await opened.json()) as { id: string }
      const answered = await fetch(
        `/api/v1/research-sessions/${sessionId}/checkpoints/${checkpoint.id}/answer`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ answer, guidance_weight: weight }),
        },
      )
      if (!answered.ok) throw new Error('Answer unavailable')
      await openSession(sessionId, false)
      setFeedback(
        'Human checkpoint and guidance weight saved to the local backend. Policy scores below remain an illustrative example.',
      )
    } catch {
      setFeedback('Judgment is visible here, but the backend could not save it.')
    }
  }

  function nextStage() {
    setActiveStage(stages[Math.min(stageIndex(activeStage) + 1, stages.length - 1)].id)
  }

  function visual() {
    if (activeStage === 'intake')
      return (
        <div className="demo-intake-visual">
          <div className="demo-orbit orbit-a" />
          <div className="demo-orbit orbit-b" />
          <div className="demo-orbit orbit-c" />
          <div className="demo-central-node">
            <Sparkles size={29} />
            <span>
              RESEARCH
              <br />
              QUESTION
            </span>
          </div>
          <div className="demo-orbit-label one">Literature</div>
          <div className="demo-orbit-label two">Experiments</div>
          <div className="demo-orbit-label three">Human insight</div>
        </div>
      )
    if (activeStage === 'corpus')
      return (
        <div className="demo-source-list">
          <div className="demo-source-search">
            <Search size={16} />
            <span>{isCamera ? 'novel view synthesis · Gaussian splatting · completion' : goal}</span>
          </div>
          <div className="demo-source-card">
            <BookOpen size={20} />
            <span>
              <strong>Public literature</strong>
              <small>Search and cited paper records</small>
            </span>
            <b className="demo-badge planned">Planned</b>
          </div>
          <div className="demo-source-card">
            <Layers3 size={20} />
            <span>
              <strong>Papiers library</strong>
              <small>Authorized papers, notes and highlights</small>
            </span>
            <b className={`demo-badge ${papiersConnected ? 'live' : 'unavailable'}`}>
              {papiersConnected ? 'Connected' : papiersChecked ? 'Disconnected' : 'Checking'}
            </b>
          </div>
          <div className="demo-source-card">
            <ShieldCheck size={20} />
            <span>
              <strong>Researcher annotations</strong>
              <small>Approval is distinct from a highlight</small>
            </span>
            <b className="demo-badge planned">Review needed</b>
          </div>
        </div>
      )
    if (activeStage === 'plan')
      return (
        <div className="demo-plan-visual">
          <div className="demo-mini-heading">
            PROPOSED STUDY STRUCTURE <b className="demo-badge replay">Workflow preview</b>
          </div>
          {(isCamera
            ? [
                [
                  'H1',
                  'Coverage-first angle',
                  'A novel view exposes useful content while keeping unseen regions bounded.',
                ],
                [
                  'H2',
                  'Completion-assisted angle',
                  'An inpainting method may improve image continuity, subject to geometric checks.',
                ],
                [
                  'M',
                  'Common evaluator',
                  'Compare coverage, missing-region area and perceptual quality on the same scene.',
                ],
              ]
            : [
                ['H1', 'Competing hypothesis A', 'Define a testable explanation for the goal.'],
                ['H2', 'Competing hypothesis B', 'Define an alternative explanation.'],
                ['M', 'Common evaluator', 'Choose measurable outcomes and a shared baseline.'],
              ]
          ).map(([tag, title, detail]) => (
            <div className="demo-plan-row" key={tag}>
              <span>{tag}</span>
              <div>
                <strong>{title}</strong>
                <small>{detail}</small>
              </div>
            </div>
          ))}
        </div>
      )
    if (activeStage === 'experiment')
      return (
        <div className="demo-experiment-visual">
          <div className="demo-mini-heading">
            EXPERIMENT CANVAS{' '}
            <b className={`demo-badge ${isCamera ? 'live' : 'planned'}`}>
              {isCamera ? 'Local scene asset' : 'Awaiting artifact'}
            </b>
          </div>
          <div className="demo-scene-preview">
            <div className="demo-scene-mesh">
              <span />
              <span />
              <span />
              <span />
              <span />
              <span />
              <span />
              <span />
              <span />
              <span />
            </div>
            <div>
              <span>PHYSICAL ARTIFACT</span>
              <strong>{isCamera ? 'Real Gaussian splat scene' : 'Attach a research artifact'}</strong>
              <small>
                {isCamera
                  ? 'Interactive viewer and candidate camera poses'
                  : 'Protocol, dataset and evaluator attach here'}
              </small>
            </div>
          </div>
          {isCamera && (
            <a className="demo-action-link" href="/poc">
              Open scene lab <ExternalLink size={15} />
            </a>
          )}
        </div>
      )
    if (activeStage === 'frontier')
      return (
        <div className="demo-graph">
          <div className="demo-graph-line one" />
          <div className="demo-graph-line two" />
          <div className="demo-graph-node parent">
            <small>ORIGINAL OBJECTIVE</small>
            <strong>{isCamera ? 'Choose useful camera angle' : 'Pursue research goal'}</strong>
            <span>Blocked pending evidence</span>
          </div>
          <div className="demo-graph-node blocker">
            <CircleHelp size={20} />
            <strong>{isCamera ? 'Unobserved scene region' : 'New evidence gap'}</strong>
            <span>Potential blocker · preview</span>
          </div>
          <div className="demo-graph-node child">
            <GitBranch size={20} />
            <strong>{isCamera ? 'Test completion methods' : 'Open child investigation'}</strong>
            <span>Actionable question · planned</span>
          </div>
        </div>
      )
    if (activeStage === 'guidance')
      return (
        <div className="demo-cfg">
          <div className="demo-mini-heading">
            CFG-INSPIRED ACTION RANKING <b className="demo-badge replay">Illustrative scores</b>
          </div>
          <div className="demo-weight">
            <div>
              <strong>Human guidance weight</strong>
              <span>{weight.toFixed(1)} / 2.0</span>
            </div>
            <input
              aria-label="Human guidance weight"
              type="range"
              min="0"
              max="2"
              step="0.1"
              value={weight}
              onChange={(event) => setWeight(Number(event.target.value))}
            />
            <div className="demo-weight-scale">
              <span>Independent</span>
              <span>Human-aligned</span>
              <span>Extrapolated</span>
            </div>
          </div>
          <div className="demo-score-head">
            <span>Candidate experiment</span>
            <span>Independent</span>
            <span>Conditioned</span>
            <span>Guided</span>
          </div>
          {candidateScores.map((item) => {
            const guided = item.unconditioned + weight * (item.conditioned - item.unconditioned)
            return (
              <div className={`demo-score-row ${winner.id === item.id ? 'winner' : ''}`} key={item.id}>
                <strong>
                  <i className={item.color} />
                  {item.name}
                </strong>
                <span>{item.unconditioned.toFixed(2)}</span>
                <span>{item.conditioned.toFixed(2)}</span>
                <b>{guided.toFixed(2)}</b>
              </div>
            )
          })}
          <p>
            Scores demonstrate the formula only. They are not measured experiment results or calibrated
            probabilities.
          </p>
        </div>
      )
    if (activeStage === 'fork')
      return (
        <div className="demo-fork">
          <div className="demo-fork-top">
            <span>SHARED CHECKPOINT</span>
            <strong>Same scene · same evaluator · same budget</strong>
          </div>
          <div className="demo-fork-branches">
            <div>
              <b>BRANCH A · w = 0</b>
              <GitFork size={25} />
              <strong>Independent choice</strong>
              <small>Protocol and output pending</small>
              <span className="demo-badge planned">Not run</span>
            </div>
            <div>
              <b>BRANCH B · w = {weight.toFixed(1)}</b>
              <GitFork size={25} />
              <strong>Human-guided choice</strong>
              <small>Protocol and output pending</small>
              <span className="demo-badge planned">Not run</span>
            </div>
          </div>
          <p>Only completed matched runs can support a claim that guidance helped.</p>
        </div>
      )
    if (activeStage === 'parallax')
      return (
        <div className="demo-dispute">
          <div className="demo-dispute-side">
            <span>CLAIM A</span>
            <strong>
              {isCamera ? 'A visually coherent image is the priority.' : 'Method A is more useful.'}
            </strong>
            <small>Proponent · source required</small>
          </div>
          <div className="demo-versus">VS</div>
          <div className="demo-dispute-side">
            <span>CLAIM B</span>
            <strong>
              {isCamera ? 'Geometric consistency should dominate.' : 'Method B is more reliable.'}
            </strong>
            <small>Proponent · source required</small>
          </div>
          <div className="demo-dispute-test">
            <FlaskConical size={17} /> Design a discriminating experiment before resolving the dispute
          </div>
        </div>
      )
    if (activeStage === 'team')
      return (
        <div className="demo-team">
          <div className="demo-team-header">
            <span className="demo-avatar">Y</span>
            <div>
              <strong>Human researcher</strong>
              <small>Reviews an agent proposal</small>
            </div>
            <MessageSquareText size={19} />
          </div>
          <div className="demo-team-message">
            {savedJudgment || '“What evidence would make this method reusable for another scene?”'}
          </div>
          <div className="demo-team-flow">
            <span>Session evidence</span>
            <ChevronRight size={15} />
            <span>Skill candidate</span>
            <ChevronRight size={15} />
            <span>Human review</span>
            <ChevronRight size={15} />
            <span>Agent reuse</span>
          </div>
          <b className="demo-badge planned">Team sharing planned</b>
        </div>
      )
    return (
      <div className="demo-meta">
        <div className="demo-mini-heading">
          POLICY STUDY <b className="demo-badge planned">Awaiting trials</b>
        </div>
        <div className="demo-meta-bars">
          {[
            ['w = 0', 'Independent'],
            ['w = 0.5', 'Light guidance'],
            ['w = 1', 'Conditioned'],
            ['w = 1.5', 'Extrapolated'],
          ].map(([w, label], index) => (
            <div key={w}>
              <span>{w}</span>
              <div className="demo-meta-track">
                <i style={{ width: `${28 + index * 12}%` }} />
              </div>
              <small>{label}</small>
            </div>
          ))}
        </div>
        <p>
          Bars illustrate the study layout; their lengths are placeholders, not performance measurements. A
          policy update requires matched real trials.
        </p>
      </div>
    )
  }

  return (
    <div className="demo-shell">
      <aside className="demo-rail">
        <a className="demo-brand" href="/demo">
          <span className="demo-brand-symbol">
            <span />
            <span />
            <span />
          </span>
          <span>
            <strong>APORIA</strong>
            <small>Collective research intelligence</small>
          </span>
        </a>
        <div className="demo-rail-title">
          RESEARCH WORKSPACE <span className="demo-online-dot" />
        </div>
        <div className="demo-rail-scroll">
          {['DISCOVER', 'INVESTIGATE', 'COLLABORATE', 'COMPOUND'].map((group) => (
            <div className="demo-nav-group" key={group}>
              <small>{group}</small>
              {stages
                .filter((stage) => stage.group === group)
                .map((stage) => {
                  const Icon = stage.icon
                  return (
                    <button
                      className={activeStage === stage.id ? 'active' : ''}
                      type="button"
                      key={stage.id}
                      onClick={() => setActiveStage(stage.id)}
                    >
                      <Icon size={17} />
                      <span>
                        <strong>{stage.name}</strong>
                        <small>{stage.detail}</small>
                      </span>
                      {activeStage === stage.id && <span className="demo-active-line" />}
                    </button>
                  )
                })}
            </div>
          ))}
        </div>
        <div className="demo-rail-footer">
          <span>◉</span>
          <div>
            <strong>Prototype workspace</strong>
            <small>Live · replay · planned shown separately</small>
          </div>
        </div>
      </aside>
      <div className="demo-page">
        <header className="demo-topbar">
          <div>
            <span>Workspace</span>
            <ChevronRight size={14} />
            <strong>Research session</strong>
          </div>
          <div>
            <b className="demo-top-prototype">INTERACTIVE PROTOTYPE</b>
            <a href="/">
              Policy app <ArrowRight size={13} />
            </a>
          </div>
        </header>
        <main className="demo-content">
          <section className="demo-hero">
            <div className="demo-hero-glow" />
            <div className="demo-hero-content">
              <span className="demo-hero-kicker">
                <Sparkles size={14} /> AUTONOMOUS RESEARCH, HUMAN JUDGMENT
              </span>
              <h1>Research moves forward together.</h1>
              <p>
                Follow an investigation from a question to evidence, new dependencies and better decisions.
                Every stage stays inspectable.
              </p>
              <div className="demo-goal-form">
                <label htmlFor="demo-goal">RESEARCH GOAL</label>
                <div>
                  <input
                    id="demo-goal"
                    value={goalDraft}
                    onChange={(event) => setGoalDraft(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') void createSession()
                    }}
                  />
                  <button type="button" onClick={() => void createSession()} disabled={!goalDraft.trim()}>
                    <Play size={15} fill="currentColor" /> Start session
                  </button>
                </div>
              </div>
              <div className="demo-hero-meta">
                <span>
                  <span className="demo-online-dot" />{' '}
                  {sessionMode === 'persistent'
                    ? 'Saved session'
                    : sessionMode === 'browser'
                      ? 'Browser preview'
                      : 'Scenario preview'}
                </span>
                <span>
                  <Globe2 size={13} /> {isCamera ? '3D scene research' : 'Any research domain'}
                </span>
                <span>
                  <ShieldCheck size={13} /> Provenance visible
                </span>
              </div>
            </div>
            <div className="demo-hero-graphic">
              <div className="demo-hero-ring ring-one" />
              <div className="demo-hero-ring ring-two" />
              <div className="demo-hero-ring ring-three" />
              <div className="demo-hero-core">
                <Sparkles size={36} />
              </div>
              <i className="star one" />
              <i className="star two" />
              <i className="star three" />
              <i className="star four" />
            </div>
          </section>
          {feedback && (
            <div className="demo-feedback" role="status">
              <Check size={15} />
              {feedback}
            </div>
          )}
          <div className="demo-overview">
            <div>
              <span>ACTIVE QUESTION</span>
              <strong>{goal}</strong>
            </div>
            <div>
              <span>WORKFLOW</span>
              <strong>10 connected stages</strong>
            </div>
            <div>
              <span>REAL ARTIFACT</span>
              <strong>{isCamera ? 'Gaussian splat PLY' : 'Awaiting goal-specific data'}</strong>
            </div>
            <div>
              <span>CORPUS</span>
              <strong>{papiersConnected ? 'Papiers connected' : 'Papiers disconnected'}</strong>
            </div>
          </div>
          <section className="demo-session-panel">
            <div className="demo-session-heading">
              <div>
                <span className="demo-card-eyebrow">HUMAN-VISIBLE RESEARCH</span>
                <h2>Active sessions & decision log</h2>
              </div>
              <span className="demo-badge live">
                {sessionMode === 'persistent' ? 'Saved locally' : 'Preview'}
              </span>
            </div>
            <div className="demo-recent-sessions">
              {recentSessions.length ? (
                recentSessions.slice(0, 4).map((item) => (
                  <button
                    type="button"
                    key={item.id}
                    className={sessionId === item.id ? 'selected' : ''}
                    onClick={() => void openSession(item.id)}
                  >
                    <strong>{item.title}</strong>
                    <small>
                      {item.domain || 'General research'} · {new Date(item.updated_at).toLocaleDateString()}
                    </small>
                  </button>
                ))
              ) : (
                <p>
                  Start the backend to keep sessions and human decisions available after reload. The workflow
                  preview remains explorable.
                </p>
              )}
            </div>
            {sessionDetail && (
              <div className="demo-saved-events">
                <strong>Recorded activity</strong>
                {savedEvents.length ? (
                  savedEvents.map((item) => (
                    <div key={`${item.sequence}-${item.title}`}>
                      <span>{String(item.sequence).padStart(2, '0')}</span>
                      <p>
                        {item.title}
                        <small>{item.label}</small>
                      </p>
                    </div>
                  ))
                ) : (
                  <p>No experiment steps or human checkpoints recorded yet.</p>
                )}
              </div>
            )}
          </section>
          <div className="demo-section-heading">
            <div>
              <span className="demo-purple-dot" /> EXPLORE THE RESEARCH LOOP<h2>{current.headline}</h2>
            </div>
            <span>{String(stageIndex(activeStage) + 1).padStart(2, '0')} / 10</span>
          </div>
          <div className="demo-main-grid">
            <section className="demo-stage-panel">
              <div className="demo-stage-intro">
                <span>{current.eyebrow}</span>
                <h3>{stages[stageIndex(activeStage)].name}</h3>
                <p>{current.explanation}</p>
              </div>
              <div className="demo-stage-canvas">{visual()}</div>
              <div className="demo-stage-footer">
                <span>
                  <CircleHelp size={15} />{' '}
                  {activeStage === 'experiment' && isCamera
                    ? 'Real scene viewer available; evaluation pending.'
                    : 'Workflow preview; evidence status is shown at each step.'}
                </span>
                {activeStage === 'experiment' && isCamera ? (
                  <a href="/poc">
                    {current.action} <ArrowRight size={15} />
                  </a>
                ) : (
                  <button type="button" onClick={nextStage} disabled={activeStage === 'meta'}>
                    {activeStage === 'meta' ? 'End of preview' : 'Next stage'} <ArrowRight size={15} />
                  </button>
                )}
              </div>
            </section>
            <aside className="demo-inspector">
              <div className="demo-inspector-card">
                <span className="demo-card-eyebrow">THE AGENT'S NEXT STEP</span>
                <h3>
                  {activeStage === 'guidance'
                    ? 'Wait for your judgment'
                    : activeStage === 'experiment'
                      ? 'Inspect the scene'
                      : activeStage === 'frontier'
                        ? 'Open a child question'
                        : current.action}
                </h3>
                <p>
                  {activeStage === 'guidance'
                    ? 'Human input can change which experiment is selected. It does not alter measured data.'
                    : activeStage === 'experiment'
                      ? 'The local 3DGS artifact can be rendered and its candidate camera views captured.'
                      : 'This card shows how the system would proceed when the required sources and services are available.'}
                </p>
                <span
                  className={`demo-badge ${activeStage === 'experiment' && isCamera ? 'live' : 'planned'}`}
                >
                  {activeStage === 'experiment' && isCamera ? 'Local artifact' : 'Planned action'}
                </span>
              </div>
              <div className="demo-inspector-card">
                <span className="demo-card-eyebrow">HUMAN IN THE LOOP</span>
                <h3>Scientific guidance</h3>
                <p>
                  Your judgment is recorded as a checkpoint. A later policy run must show exactly how it
                  affected candidate ranking.
                </p>
                <textarea
                  aria-label="Scientific guidance"
                  value={judgment}
                  onChange={(event) => setJudgment(event.target.value)}
                  placeholder="What should the agent prioritize or question?"
                  rows={3}
                />
                <button type="button" onClick={() => void recordJudgment()} disabled={!judgment.trim()}>
                  <MessageSquareText size={15} /> Record guidance
                </button>
                {savedJudgment && (
                  <div className="demo-saved-note">
                    <Check size={14} />
                    <span>{savedJudgment}</span>
                  </div>
                )}
              </div>
              <div className="demo-inspector-card">
                <span className="demo-card-eyebrow">EVIDENCE LEGEND</span>
                <div className="demo-legend">
                  <b className="demo-badge live">Live / local</b>
                  <span>Actual available asset or stored action</span>
                </div>
                <div className="demo-legend">
                  <b className="demo-badge replay">Illustrative</b>
                  <span>Explains an intended decision</span>
                </div>
                <div className="demo-legend">
                  <b className="demo-badge planned">Planned</b>
                  <span>Requires service or experiment</span>
                </div>
                {isCamera && (
                  <a href="/poc">
                    Open physical scene viewer <ExternalLink size={13} />
                  </a>
                )}
              </div>
            </aside>
          </div>
          <section className="demo-map">
            <div>
              <span className="demo-card-eyebrow">ONE CONNECTED SYSTEM</span>
              <h2>From insight to a stronger research process</h2>
              <p>
                Explore any stage above. The same workflow can host a different scientific goal;
                domain-specific experiments and evaluators attach to the lab.
              </p>
            </div>
            <div className="demo-map-steps">
              <span>
                <Search size={17} /> Context
              </span>
              <ChevronRight size={14} />
              <span>
                <FlaskConical size={17} /> Evidence
              </span>
              <ChevronRight size={14} />
              <span>
                <Network size={17} /> New question
              </span>
              <ChevronRight size={14} />
              <span>
                <Users size={17} /> Human input
              </span>
              <ChevronRight size={14} />
              <span>
                <Activity size={17} /> Improvement
              </span>
            </div>
          </section>
          <details className="demo-systems">
            <summary>
              <span>
                <Layers3 size={17} /> Explore the 16 APORIA systems
              </span>
              <span>
                Full project map <ChevronRight size={15} />
              </span>
            </summary>
            <p>
              This map includes planned capabilities as well as the working prototype slices. Open a stage to
              see its current evidence status.
            </p>
            <div className="demo-systems-grid">
              {systemModules.map((module) => (
                <button
                  key={module.code}
                  type="button"
                  onClick={() => {
                    setActiveStage(module.stage)
                    window.scrollTo({ top: 420, behavior: 'smooth' })
                  }}
                >
                  <small>{module.code}</small>
                  <strong>{module.name}</strong>
                  <span>{module.description}</span>
                  <ArrowRight size={13} />
                </button>
              ))}
            </div>
          </details>
          <footer className="demo-footer">
            APORIA prototype · workflow previews are labeled · no unrun experiment is presented as measured
          </footer>
        </main>
      </div>
    </div>
  )
}
