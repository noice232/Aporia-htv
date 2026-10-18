import createClient from 'openapi-fetch'
import type { components, paths } from './generated'

export type Schema<Name extends keyof components['schemas']> = components['schemas'][Name]

// ── Existing types ──
export type Project = Schema<'ProjectOut'>
export type Health = Schema<'HealthStatus'>
export type GoalResult = Schema<'GoalResult'>
export type Run = Schema<'RunSummary'>
export type PolicyRun = Schema<'PolicyRunOut'>
export type Candidate = Schema<'CandidateScoreOut'>
export type Principle = Schema<'PrincipleOut'>
export type Profile = Schema<'ProfileOut'>
export type ProfileVersion = Schema<'ProfileVersionOut'>
export type Fork = Schema<'ForkOut'>
export type ForkSummary = Schema<'ForkSummaryOut'>
export type Event = Schema<'EventOut'>
export type EventPage = Schema<'EventPage'>
export type AgendaItem = Schema<'AgendaItemOut'>

// ── New types ──
export type ProjectState = Schema<'ProjectStateOut'>
export type GraphOut = Schema<'GraphOut'>
export type GraphNode = Schema<'GraphNode'>
export type GraphEdge = Schema<'GraphEdge'>
export type ExperimentSpec = Schema<'ExperimentSpecOut'>
export type ExperimentOut = Schema<'ExperimentOut'>
export type NodeOut = Schema<'NodeOut'>
export type EdgeOut = Schema<'EdgeOut'>
export type BlockerDetection = Schema<'BlockerDetectionOut'>
export type SubgraphOut = Schema<'SubgraphOut'>
export type Disagreement = Schema<'DisagreementOut'>
export type ClaimOut = Schema<'ClaimOut'>
export type EvidenceOut = Schema<'EvidenceOut'>
export type InvalidateResult = Schema<'InvalidateResult'>
export type DisputeOut = Schema<'DisputeOut'>
export type UserOut = Schema<'UserOut'>
export type WorkspaceOut = Schema<'WorkspaceOut'>
export type WorkspaceMember = Schema<'WorkspaceMemberOut'>
export type TeamSession = Schema<'TeamSessionOut'>
export type ParticipantOut = Schema<'ParticipantOut'>
export type CommentOut = Schema<'CommentOut'>
export type StrategyOut = Schema<'StrategyOut'>
export type StrategyVersion = Schema<'StrategyVersionOut'>
export type AgendaPriority = Schema<'AgendaPriorityOut'>
export type SuggestionOut = Schema<'SuggestionOut'>
export type MetaTrial = Schema<'MetaTrialOut'>
export type PlanOut = Schema<'PlanOut'>
export type PlanSummary = Schema<'PlanSummaryOut'>
export type PlanVersion = Schema<'PlanVersionOut'>
export type ChooseResult = Schema<'ChooseResult'>
export type SnapshotOut = Schema<'SnapshotOut'>
export type PolicyComparison = Schema<'PolicyComparisonOut'>
export type ResearchStart = Schema<'ResearchStartOut'>
export type ResearchStep = Schema<'ResearchStepOut'>
export type ResearchStatus = Schema<'ResearchStatusOut'>
export type ResearchControl = Schema<'ResearchControlOut'>
export type FeedbackResult = Schema<'FeedbackResult'>
export type PaperOut = Schema<'PaperOut'>
export type PaperDetail = Schema<'PaperDetail'>
export type PapiersStatus = Schema<'PapiersStatusOut'>
export type PapiersResult = Schema<'PapiersResultOut'>
export type SourceOut = Schema<'SourceOut'>
export type QuestionOut = Schema<'QuestionOut'>
export type RunOut = Schema<'RunOut'>
export type ArtifactOut = Schema<'ArtifactOut'>
export type SkillOut = Schema<'SkillOut'>
export type ReviewOut = Schema<'ReviewOut'>
export type LessonOut = Schema<'LessonOut'>
export type AnalyticsOut = Schema<'AnalyticsOut'>
export type IntegrationStatus = Schema<'IntegrationStatus'>
export type TimelineEntry = Schema<'TimelineEntry'>
export type DemoSeed = Schema<'DemoSeedOut'>
export type CorpusSyncResponse = Schema<'CorpusSyncResponse'>
export type CheckpointOut = Schema<'CheckpointOut'>

const api = createClient<paths>({ baseUrl: import.meta.env.VITE_API_BASE_URL || '' })

type Result<T> = { data?: T; error?: unknown; response: Response }

function unwrap<T>(result: Result<T>): T {
  if (result.data !== undefined) return result.data
  const error = result.error
  if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
    throw new Error(error.message)
  }
  throw new Error(`Request failed (${result.response.status || 'network error'})`)
}

// ── Health ──
export const getHealth = async () => unwrap(await api.GET('/api/v1/health'))

// ── Projects ──
export const createProject = async (title: string, objective: string) =>
  unwrap(await api.POST('/api/v1/projects', { body: { title, objective: objective || null } }))
export const patchProject = async (projectId: string, body: { title?: string; objective?: string | null; status?: string }) =>
  unwrap(await api.PATCH('/api/v1/projects/{project_id}', { params: { path: { project_id: projectId } }, body }))
export const getProjectState = async (projectId: string) =>
  unwrap(await api.GET('/api/v1/projects/{project_id}/state', { params: { path: { project_id: projectId } } }))
export const getProjectGraph = async (projectId: string) =>
  unwrap(await api.GET('/api/v1/projects/{project_id}/graph', { params: { path: { project_id: projectId } } }))
export const getGraphNode = async (projectId: string, nodeId: string) =>
  unwrap(await api.GET('/api/v1/projects/{project_id}/graph/node/{node_id}', { params: { path: { project_id: projectId, node_id: nodeId } } }))
export const listHypotheses = async (projectId: string) =>
  unwrap(await api.GET('/api/v1/projects/{project_id}/hypotheses', { params: { path: { project_id: projectId } } }))

// ── Goals / Runs ──
export const submitGoal = async (projectId: string, threshold: number, seed: number) =>
  unwrap(
    await api.POST('/api/v1/projects/{project_id}/goals', {
      params: { path: { project_id: projectId } },
      body: { threshold, seed },
    }),
  )
export const listRuns = async (projectId: string) =>
  unwrap(await api.GET('/api/v1/projects/{project_id}/runs', { params: { path: { project_id: projectId } } }))
export const getRun = async (runId: string) =>
  unwrap(await api.GET('/api/v1/runs/{run_id}', { params: { path: { run_id: runId } } }))
export const cancelRun = async (runId: string) =>
  unwrap(await api.POST('/api/v1/runs/{run_id}/cancel', { params: { path: { run_id: runId } }, body: {} }))
export const listRunArtifacts = async (projectId: string, runId: string) =>
  unwrap(await api.GET('/api/v1/projects/{project_id}/runs/{run_id}/artifacts', { params: { path: { project_id: projectId, run_id: runId } } }))

// ── Experiments ──
export const listExperimentSpecs = async (projectId: string) =>
  unwrap(await api.GET('/api/v1/projects/{project_id}/experiment-specs', { params: { path: { project_id: projectId } } }))
export const createExperimentSpec = async (projectId: string, body: { hypothesis: string; method: string; metrics: string[] }) =>
  unwrap(await api.POST('/api/v1/projects/{project_id}/experiment-specs', { params: { path: { project_id: projectId } }, body }))
export const listExperiments = async (projectId: string) =>
  unwrap(await api.GET('/api/v1/projects/{project_id}/experiments', { params: { path: { project_id: projectId } } }))
export const createExperiment = async (projectId: string, body: { spec_id: string; config?: Record<string, unknown> }) =>
  unwrap(await api.POST('/api/v1/projects/{project_id}/experiments', { params: { path: { project_id: projectId } }, body }))
export const getExperiment = async (projectId: string, expId: string) =>
  unwrap(await api.GET('/api/v1/projects/{project_id}/experiments/{exp_id}', { params: { path: { project_id: projectId, exp_id: expId } } }))
export const evaluateExperiment = async (projectId: string, expId: string, body: { human_evaluation?: { score: number; notes?: string } }) =>
  unwrap(await api.POST('/api/v1/projects/{project_id}/experiments/{exp_id}/evaluate', { params: { path: { project_id: projectId, exp_id: expId } }, body }))
export const proposeExperiment = async (projectId: string) =>
  unwrap(await api.POST('/api/v1/projects/{project_id}/experiments/propose', { params: { path: { project_id: projectId } } }))

// ── Policy ──
export const scorePolicy = async (projectId: string, w: number, signal?: AbortSignal) =>
  unwrap(
    await api.POST('/api/v1/projects/{project_id}/policy/score', {
      params: { path: { project_id: projectId } },
      body: { w },
      signal,
    }),
  )
export const choosePolicy = async (projectId: string, candidateId: string) =>
  unwrap(await api.POST('/api/v1/projects/{project_id}/policy/choose', { params: { path: { project_id: projectId } }, body: { candidate_id: candidateId } }))
export const getPolicyRun = async (projectId: string, policyRunId: string) =>
  unwrap(await api.GET('/api/v1/projects/{project_id}/policy/runs/{policy_run_id}', { params: { path: { project_id: projectId, policy_run_id: policyRunId } } }))
export const getLatestSnapshot = async (projectId: string) =>
  unwrap(await api.GET('/api/v1/projects/{project_id}/policy/snapshots/latest', { params: { path: { project_id: projectId } } }))
export const createSnapshot = async (projectId: string) =>
  unwrap(await api.POST('/api/v1/projects/{project_id}/policy/snapshots', { params: { path: { project_id: projectId } }, body: {} }))
export const getPolicyComparison = async (projectId: string) =>
  unwrap(await api.GET('/api/v1/projects/{project_id}/policy/comparison', { params: { path: { project_id: projectId } } }))

// ── Principles / Profile ──
export const listPrinciples = async (projectId: string) =>
  unwrap(await api.GET('/api/v1/projects/{project_id}/principles', { params: { path: { project_id: projectId } } }))
export const updatePrinciple = async (projectId: string, principleId: string, body: { text?: string; status?: string }) =>
  unwrap(await api.PUT('/api/v1/projects/{project_id}/principles/{principle_id}', { params: { path: { project_id: projectId, principle_id: principleId } }, body }))
export const deletePrinciple = async (projectId: string, principleId: string) =>
  unwrap(await api.DELETE('/api/v1/projects/{project_id}/principles/{principle_id}', { params: { path: { project_id: projectId, principle_id: principleId } } }))
export const approvePrinciple = async (projectId: string, principleId: string) =>
  unwrap(await api.POST('/api/v1/projects/{project_id}/principles/{principle_id}/approve', { params: { path: { project_id: projectId, principle_id: principleId } } }))
export const getProfile = async (projectId: string) =>
  unwrap(await api.GET('/api/v1/projects/{project_id}/profile', { params: { path: { project_id: projectId } } }))
export const getProfileHistory = async (projectId: string) =>
  unwrap(await api.GET('/api/v1/projects/{project_id}/profile/history', { params: { path: { project_id: projectId } } }))

// ── Judgments ──
export const submitJudgment = async (projectId: string, judgment: string) =>
  unwrap(await api.POST('/api/v1/projects/{project_id}/judgments', { params: { path: { project_id: projectId } }, body: { text: judgment } }))
export const listJudgments = async (projectId: string) =>
  unwrap(await api.GET('/api/v1/projects/{project_id}/judgments', { params: { path: { project_id: projectId } } }))
export const compileJudgment = async (projectId: string, text: string) =>
  unwrap(await api.POST('/api/v1/projects/{project_id}/judgments/compile', { params: { path: { project_id: projectId } }, body: { text } }))
export const reviewJudgment = async (projectId: string, judgmentId: string, body: { verdict: string; notes?: string }) =>
  unwrap(await api.POST('/api/v1/projects/{project_id}/judgments/{judgment_id}/review', { params: { path: { project_id: projectId, judgment_id: judgmentId } }, body }))

// ── Forks ──
export const listForks = async (projectId: string) =>
  unwrap(await api.GET('/api/v1/projects/{project_id}/forks', { params: { path: { project_id: projectId } } }))
export const getFork = async (projectId: string, forkId: string) =>
  unwrap(await api.GET('/api/v1/projects/{project_id}/forks/{fork_id}', { params: { path: { project_id: projectId, fork_id: forkId } } }))
export const createFork = async (projectId: string, w: number, idempotencyKey: string) =>
  unwrap(await api.POST('/api/v1/projects/{project_id}/forks', { params: { path: { project_id: projectId } }, body: { w, idempotency_key: idempotencyKey } }))
export const replayFork = async (projectId: string, forkId: string) =>
  unwrap(await api.POST('/api/v1/projects/{project_id}/forks/{fork_id}/replay', { params: { path: { project_id: projectId, fork_id: forkId } }, body: {} }))

// ── Frontier ──
export const listFrontierNodes = async (projectId: string) =>
  unwrap(await api.GET('/api/v1/projects/{project_id}/frontier/nodes', { params: { path: { project_id: projectId } } }))
export const createFrontierNode = async (projectId: string, body: { label: string; type: string; metadata?: Record<string, unknown> }) =>
  unwrap(await api.POST('/api/v1/projects/{project_id}/frontier/nodes', { params: { path: { project_id: projectId } }, body }))
export const getFrontierNode = async (projectId: string, nodeId: string) =>
  unwrap(await api.GET('/api/v1/projects/{project_id}/frontier/nodes/{node_id}', { params: { path: { project_id: projectId, node_id: nodeId } } }))
export const updateFrontierNode = async (projectId: string, nodeId: string, body: { label?: string; status?: string }) =>
  unwrap(await api.PUT('/api/v1/projects/{project_id}/frontier/nodes/{node_id}', { params: { path: { project_id: projectId, node_id: nodeId } }, body }))
export const completeFrontierNode = async (projectId: string, nodeId: string) =>
  unwrap(await api.POST('/api/v1/projects/{project_id}/frontier/nodes/{node_id}/complete', { params: { path: { project_id: projectId, node_id: nodeId } } }))
export const listFrontierEdges = async (projectId: string) =>
  unwrap(await api.GET('/api/v1/projects/{project_id}/frontier/edges', { params: { path: { project_id: projectId } } }))
export const createFrontierEdge = async (projectId: string, body: { source_id: string; target_id: string; type?: string }) =>
  unwrap(await api.POST('/api/v1/projects/{project_id}/frontier/edges', { params: { path: { project_id: projectId } }, body }))
export const detectBlockers = async (projectId: string) =>
  unwrap(await api.POST('/api/v1/projects/{project_id}/frontier/detect-blockers', { params: { path: { project_id: projectId } } }))
export const getFrontierSubgraph = async (projectId: string) =>
  unwrap(await api.GET('/api/v1/projects/{project_id}/frontier/subgraph', { params: { path: { project_id: projectId } } }))

// ── Court ──
export const listCourt = async (projectId: string) =>
  unwrap(await api.GET('/api/v1/projects/{project_id}/court', { params: { path: { project_id: projectId } } }))
export const openCourtDispute = async (projectId: string, body: { title: string; claim: string; claimant?: string; respondent?: string }) =>
  unwrap(await api.POST('/api/v1/projects/{project_id}/court', { params: { path: { project_id: projectId } }, body }))
export const testDisagreement = async (projectId: string, disagreementId: string, body: { experiment_id?: string }) =>
  unwrap(await api.POST('/api/v1/projects/{project_id}/court/{disagreement_id}/test', { params: { path: { project_id: projectId, disagreement_id: disagreementId } }, body }))

// ── Claims / Disputes (PARALLAX) ──
export const listClaims = async (projectId: string) =>
  unwrap(await api.GET('/api/v1/projects/{project_id}/claims', { params: { path: { project_id: projectId } } }))
export const createClaim = async (projectId: string, body: { text: string; source_id?: string }) =>
  unwrap(await api.POST('/api/v1/projects/{project_id}/claims', { params: { path: { project_id: projectId } }, body }))
export const getClaim = async (projectId: string, claimId: string) =>
  unwrap(await api.GET('/api/v1/projects/{project_id}/claims/{claim_id}', { params: { path: { project_id: projectId, claim_id: claimId } } }))
export const addEvidence = async (projectId: string, claimId: string, body: { text: string; type: string }) =>
  unwrap(await api.POST('/api/v1/projects/{project_id}/claims/{claim_id}/evidence', { params: { path: { project_id: projectId, claim_id: claimId } }, body }))
export const invalidateClaim = async (projectId: string, claimId: string, body: { reason: string }) =>
  unwrap(await api.POST('/api/v1/projects/{project_id}/claims/{claim_id}/invalidate', { params: { path: { project_id: projectId, claim_id: claimId } }, body }))
export const listDisputes = async (projectId: string) =>
  unwrap(await api.GET('/api/v1/projects/{project_id}/disputes', { params: { path: { project_id: projectId } } }))
export const createDispute = async (projectId: string, body: { claim_id: string; counter_claim: string }) =>
  unwrap(await api.POST('/api/v1/projects/{project_id}/disputes', { params: { path: { project_id: projectId } }, body }))
export const getDispute = async (projectId: string, disputeId: string) =>
  unwrap(await api.GET('/api/v1/projects/{project_id}/disputes/{dispute_id}', { params: { path: { project_id: projectId, dispute_id: disputeId } } }))
export const proposeDisputeExperiment = async (projectId: string, disputeId: string) =>
  unwrap(await api.POST('/api/v1/projects/{project_id}/disputes/{dispute_id}/propose-experiment', { params: { path: { project_id: projectId, dispute_id: disputeId } } }))
export const resolveDispute = async (projectId: string, disputeId: string, body: { resolution: string; winner?: string }) =>
  unwrap(await api.POST('/api/v1/projects/{project_id}/disputes/{dispute_id}/resolve', { params: { path: { project_id: projectId, dispute_id: disputeId } }, body }))

// ── Events / Agenda ──
export const listEvents = async (projectId: string, after: number, limit = 20) =>
  unwrap(await api.GET('/api/v1/projects/{project_id}/events', { params: { path: { project_id: projectId }, query: { after, limit } } }))
export const listAgenda = async (projectId: string) =>
  unwrap(await api.GET('/api/v1/projects/{project_id}/agenda', { params: { path: { project_id: projectId } } }))

// ── Plans ──
export const listPlans = async (projectId: string) =>
  unwrap(await api.GET('/api/v1/projects/{project_id}/plans', { params: { path: { project_id: projectId } } }))
export const createPlan = async (projectId: string, body: { title: string; description?: string }) =>
  unwrap(await api.POST('/api/v1/projects/{project_id}/plans', { params: { path: { project_id: projectId } }, body }))
export const getPlan = async (projectId: string, planId: string) =>
  unwrap(await api.GET('/api/v1/projects/{project_id}/plans/{plan_id}', { params: { path: { project_id: projectId, plan_id: planId } } }))
export const updatePlan = async (projectId: string, planId: string, body: { title?: string; steps?: unknown[] }) =>
  unwrap(await api.PUT('/api/v1/projects/{project_id}/plans/{plan_id}', { params: { path: { project_id: projectId, plan_id: planId } }, body }))
export const approvePlan = async (projectId: string, planId: string) =>
  unwrap(await api.POST('/api/v1/projects/{project_id}/plans/{plan_id}/approve', { params: { path: { project_id: projectId, plan_id: planId } } }))
export const getPlanHistory = async (projectId: string, planId: string) =>
  unwrap(await api.GET('/api/v1/projects/{project_id}/plans/{plan_id}/history', { params: { path: { project_id: projectId, plan_id: planId } } }))

// ── Strategies / Portfolio ──
export const listStrategies = async (projectId: string) =>
  unwrap(await api.GET('/api/v1/projects/{project_id}/strategies', { params: { path: { project_id: projectId } } }))
export const createStrategy = async (projectId: string, body: { name: string; description?: string }) =>
  unwrap(await api.POST('/api/v1/projects/{project_id}/strategies', { params: { path: { project_id: projectId } }, body }))
export const getStrategy = async (projectId: string, strategyId: string) =>
  unwrap(await api.GET('/api/v1/projects/{project_id}/strategies/{strategy_id}', { params: { path: { project_id: projectId, strategy_id: strategyId } } }))
export const updateStrategy = async (projectId: string, strategyId: string, body: { name?: string; description?: string; status?: string }) =>
  unwrap(await api.PUT('/api/v1/projects/{project_id}/strategies/{strategy_id}', { params: { path: { project_id: projectId, strategy_id: strategyId } }, body }))
export const getStrategyHistory = async (projectId: string, strategyId: string) =>
  unwrap(await api.GET('/api/v1/projects/{project_id}/strategies/{strategy_id}/history', { params: { path: { project_id: projectId, strategy_id: strategyId } } }))
export const compareStrategies = async (projectId: string, body: { strategy_ids: string[] }) =>
  unwrap(await api.POST('/api/v1/projects/{project_id}/strategies/compare', { params: { path: { project_id: projectId } }, body }))
export const listPriorities = async (projectId: string) =>
  unwrap(await api.GET('/api/v1/projects/{project_id}/priorities', { params: { path: { project_id: projectId } } }))
export const suggestNext = async (projectId: string) =>
  unwrap(await api.POST('/api/v1/projects/{project_id}/suggest-next', { params: { path: { project_id: projectId } }, body: {} }))

// ── Research / Demo ──
export const startResearch = async (projectId: string) =>
  unwrap(await api.POST('/api/v1/projects/{project_id}/research/start', { params: { path: { project_id: projectId } } }))
export const listResearchSteps = async (projectId: string) =>
  unwrap(await api.GET('/api/v1/projects/{project_id}/research/steps', { params: { path: { project_id: projectId } } }))
export const submitStepFeedback = async (projectId: string, stepId: string, body: { feedback: string }) =>
  unwrap(await api.POST('/api/v1/projects/{project_id}/research/steps/{step_id}/feedback', { params: { path: { project_id: projectId, step_id: stepId } }, body }))
export const getResearchStatus = async (projectId: string) =>
  unwrap(await api.GET('/api/v1/projects/{project_id}/research/status', { params: { path: { project_id: projectId } } }))
export const controlResearch = async (projectId: string, body: { action: string }) =>
  unwrap(await api.POST('/api/v1/projects/{project_id}/research/control', { params: { path: { project_id: projectId } }, body }))
export const listResearchCheckpoints = async (projectId: string) =>
  unwrap(await api.GET('/api/v1/projects/{project_id}/research/checkpoints', { params: { path: { project_id: projectId } } }))
export const getTimeline = async (projectId: string) =>
  unwrap(await api.GET('/api/v1/projects/{project_id}/timeline', { params: { path: { project_id: projectId } } }))

// ── Papers / Sources ──
export const listPapers = async () =>
  unwrap(await api.GET('/api/v1/papers'))
export const getPaper = async (paperId: string) =>
  unwrap(await api.GET('/api/v1/papers/{paper_id}', { params: { path: { paper_id: paperId } } }))
export const searchProjectPapers = async (projectId: string, body: { query: string }) =>
  unwrap(await api.POST('/api/v1/projects/{project_id}/papers/search', { params: { path: { project_id: projectId } }, body }))
export const retrieveProjectPapers = async (projectId: string, body: { paper_ids: string[] }) =>
  unwrap(await api.POST('/api/v1/projects/{project_id}/papers/retrieve', { params: { path: { project_id: projectId } }, body }))
export const getPapiersStatus = async () =>
  unwrap(await api.GET('/api/v1/papiers/status'))
export const searchPapiers = async (body: { query: string }) =>
  unwrap(await api.POST('/api/v1/papiers/search', { body }))
export const readPapier = async (body: { paper_id: string }) =>
  unwrap(await api.POST('/api/v1/papiers/read', { body }))
export const listSources = async (projectId: string) =>
  unwrap(await api.GET('/api/v1/projects/{project_id}/sources', { params: { path: { project_id: projectId } } }))
export const createSource = async (projectId: string, body: { title: string; url?: string; type?: string }) =>
  unwrap(await api.POST('/api/v1/projects/{project_id}/sources', { params: { path: { project_id: projectId } }, body }))
export const searchSources = async (projectId: string, body: { query: string }) =>
  unwrap(await api.POST('/api/v1/projects/{project_id}/sources/search', { params: { path: { project_id: projectId } }, body }))
export const getSource = async (sourceContextId: string) =>
  unwrap(await api.GET('/api/v1/sources/{source_context_id}', { params: { path: { source_context_id: sourceContextId } } }))

// ── Questions ──
export const listQuestions = async (projectId: string) =>
  unwrap(await api.GET('/api/v1/projects/{project_id}/questions', { params: { path: { project_id: projectId } } }))
export const createQuestion = async (projectId: string, body: { text: string }) =>
  unwrap(await api.POST('/api/v1/projects/{project_id}/questions', { params: { path: { project_id: projectId } }, body }))
export const answerQuestion = async (questionId: string, body: { answer: string }) =>
  unwrap(await api.POST('/api/v1/questions/{question_id}/answer', { params: { path: { question_id: questionId } }, body }))
export const requestExpert = async (projectId: string, body: { question: string; domain?: string }) =>
  unwrap(await api.POST('/api/v1/projects/{project_id}/experts/request', { params: { path: { project_id: projectId } }, body }))

// ── Skills ──
export const listProjectSkills = async (projectId: string) =>
  unwrap(await api.GET('/api/v1/projects/{project_id}/skills', { params: { path: { project_id: projectId } } }))
export const createSkill = async (projectId: string, body: { name: string; description?: string; code?: string }) =>
  unwrap(await api.POST('/api/v1/projects/{project_id}/skills', { params: { path: { project_id: projectId } }, body }))
export const getSkill = async (projectId: string, skillId: string) =>
  unwrap(await api.GET('/api/v1/projects/{project_id}/skills/{skill_id}', { params: { path: { project_id: projectId, skill_id: skillId } } }))
export const reviewSkill = async (projectId: string, skillId: string, body: { verdict: string; notes?: string }) =>
  unwrap(await api.POST('/api/v1/projects/{project_id}/skills/{skill_id}/review', { params: { path: { project_id: projectId, skill_id: skillId } }, body }))
export const promoteSkill = async (projectId: string, skillId: string) =>
  unwrap(await api.POST('/api/v1/projects/{project_id}/skills/{skill_id}/promote', { params: { path: { project_id: projectId, skill_id: skillId } } }))
export const listGlobalSkills = async () =>
  unwrap(await api.GET('/api/v1/skills'))

// ── Workspace / Users ──
export const createUser = async (body: { name: string; email?: string }) =>
  unwrap(await api.POST('/api/v1/users', { body }))
export const getMe = async () =>
  unwrap(await api.GET('/api/v1/me'))
export const listWorkspaces = async () =>
  unwrap(await api.GET('/api/v1/workspaces'))
export const createWorkspace = async (body: { name: string }) =>
  unwrap(await api.POST('/api/v1/workspaces', { body }))
export const listWorkspaceMembers = async (workspaceId: string) =>
  unwrap(await api.GET('/api/v1/workspaces/{workspace_id}/members', { params: { path: { workspace_id: workspaceId } } }))
export const addWorkspaceMember = async (workspaceId: string, body: { user_id: string; role?: string }) =>
  unwrap(await api.POST('/api/v1/workspaces/{workspace_id}/members', { params: { path: { workspace_id: workspaceId } }, body }))
export const getResearcher = async (userId: string) =>
  unwrap(await api.GET('/api/v1/researchers/{user_id}', { params: { path: { user_id: userId } } }))
export const updateResearcher = async (userId: string, body: { name?: string; bio?: string; tags?: string[] }) =>
  unwrap(await api.PATCH('/api/v1/researchers/{user_id}', { params: { path: { user_id: userId } }, body }))

// ── Team Sessions ──
export const listWorkspaceSessions = async (workspaceId: string) =>
  unwrap(await api.GET('/api/v1/workspaces/{workspace_id}/sessions', { params: { path: { workspace_id: workspaceId } } }))
export const createTeamSession = async (projectId: string, body: { name: string; topic?: string }) =>
  unwrap(await api.POST('/api/v1/projects/{project_id}/sessions', { params: { path: { project_id: projectId } }, body }))
export const joinSession = async (sessionId: string, body: { user_id: string }) =>
  unwrap(await api.POST('/api/v1/sessions/{session_id}/join', { params: { path: { session_id: sessionId } }, body }))
export const getSession = async (sessionId: string) =>
  unwrap(await api.GET('/api/v1/sessions/{session_id}', { params: { path: { session_id: sessionId } } }))
export const listSessionComments = async (sessionId: string) =>
  unwrap(await api.GET('/api/v1/sessions/{session_id}/comments', { params: { path: { session_id: sessionId } } }))
export const createSessionComment = async (sessionId: string, body: { text: string }) =>
  unwrap(await api.POST('/api/v1/sessions/{session_id}/comments', { params: { path: { session_id: sessionId } }, body }))

// ── Research Sessions ──
export const listResearchSessions = async () =>
  unwrap(await api.GET('/api/v1/research-sessions'))
export const createResearchSession = async (body: { project_id: string; title?: string }) =>
  unwrap(await api.POST('/api/v1/research-sessions', { body }))
export const getResearchSession = async (sessionId: string) =>
  unwrap(await api.GET('/api/v1/research-sessions/{session_id}', { params: { path: { session_id: sessionId } } }))
export const addResearchStep = async (sessionId: string, body: { action: string; result?: string }) =>
  unwrap(await api.POST('/api/v1/research-sessions/{session_id}/steps', { params: { path: { session_id: sessionId } }, body }))
export const createCheckpoint = async (sessionId: string, body: { question: string }) =>
  unwrap(await api.POST('/api/v1/research-sessions/{session_id}/checkpoints', { params: { path: { session_id: sessionId } }, body }))
export const answerCheckpoint = async (sessionId: string, checkpointId: string, body: { answer: string }) =>
  unwrap(await api.POST('/api/v1/research-sessions/{session_id}/checkpoints/{checkpoint_id}/answer', { params: { path: { session_id: sessionId, checkpoint_id: checkpointId } }, body }))

// ── Workspace Portfolio ──
export const getWorkspacePortfolio = async (workspaceId: string) =>
  unwrap(await api.GET('/api/v1/workspaces/{workspace_id}/portfolio', { params: { path: { workspace_id: workspaceId } } }))
export const reprioritizePortfolio = async (workspaceId: string, body: { project_ids: string[] }) =>
  unwrap(await api.POST('/api/v1/workspaces/{workspace_id}/portfolio/reprioritize', { params: { path: { workspace_id: workspaceId } }, body }))
export const listWorkspaceStrategies = async (workspaceId: string) =>
  unwrap(await api.GET('/api/v1/workspaces/{workspace_id}/strategies', { params: { path: { workspace_id: workspaceId } } }))

// ── Meta ──
export const listMetaTrials = async (workspaceId: string) =>
  unwrap(await api.GET('/api/v1/workspaces/{workspace_id}/meta', { params: { path: { workspace_id: workspaceId } } }))
export const createMetaTrial = async (workspaceId: string, body: { strategy_a: string; strategy_b: string }) =>
  unwrap(await api.POST('/api/v1/workspaces/{workspace_id}/meta/trials', { params: { path: { workspace_id: workspaceId } }, body }))
export const rollbackMetaTrial = async (workspaceId: string, trialId: string) =>
  unwrap(await api.POST('/api/v1/workspaces/{workspace_id}/meta/{trial_id}/rollback', { params: { path: { workspace_id: workspaceId, trial_id: trialId } }, body: {} }))

// ── Lessons ──
export const listLessons = async (workspaceId: string) =>
  unwrap(await api.GET('/api/v1/workspaces/{workspace_id}/lessons', { params: { path: { workspace_id: workspaceId } } }))
export const createLesson = async (workspaceId: string, body: { title: string; body: string }) =>
  unwrap(await api.POST('/api/v1/workspaces/{workspace_id}/lessons', { params: { path: { workspace_id: workspaceId } }, body }))
export const reviewLesson = async (lessonId: string, body: { verdict: string }) =>
  unwrap(await api.POST('/api/v1/lessons/{lesson_id}/review', { params: { path: { lesson_id: lessonId } }, body }))
export const transferLesson = async (lessonId: string, body: { target_workspace_id: string }) =>
  unwrap(await api.POST('/api/v1/lessons/{lesson_id}/transfer', { params: { path: { lesson_id: lessonId } }, body }))

// ── Artifacts ──
export const listProjectArtifacts = async (projectId: string) =>
  unwrap(await api.GET('/api/v1/projects/{project_id}/artifacts', { params: { path: { project_id: projectId } } }))
export const createProjectArtifact = async (projectId: string, body: { title: string; content: string; type?: string }) =>
  unwrap(await api.POST('/api/v1/projects/{project_id}/artifacts', { params: { path: { project_id: projectId } }, body }))
export const getProjectArtifact = async (projectId: string, artifactId: string) =>
  unwrap(await api.GET('/api/v1/projects/{project_id}/artifacts/{artifact_id}', { params: { path: { project_id: projectId, artifact_id: artifactId } } }))
export const getArtifact = async (artifactId: string) =>
  unwrap(await api.GET('/api/v1/artifacts/{artifact_id}', { params: { path: { artifact_id: artifactId } } }))

// ── Analytics / Integrations ──
export const getAnalytics = async (projectId: string) =>
  unwrap(await api.GET('/api/v1/projects/{project_id}/analytics', { params: { path: { project_id: projectId } } }))
export const getIntegrationStatus = async () =>
  unwrap(await api.GET('/api/v1/integrations/status'))

// ── Corpus / Demo ──
export const syncCorpus = async (body: { project_id: string }) =>
  unwrap(await api.POST('/api/v1/corpus/sync', { body }))
export const seedDemo = async () =>
  unwrap(await api.POST('/api/v1/demo/seed'))
