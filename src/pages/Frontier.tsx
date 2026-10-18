import { useEffect, useState, useRef, useCallback } from 'react'
import { TOPICS, initCosmos } from '../engine/cosmos'
import type { CosmosControls, AtlasNode, AtlasLink, ExternalData } from '../engine/cosmos'
import { useProjectStore } from '../stores/projects'
import '../styles/frontier.css'

const BASE = import.meta.env.VITE_API_BASE_URL || ''

const _FALLBACK_PAPERS: { id: string; title: string; topic: number; cluster: number }[] = [
  { id: 'p-001', title: 'Attention Is All You Need', topic: 0, cluster: 0 },
  { id: 'p-002', title: 'Scaling Laws for Neural Language Models', topic: 0, cluster: 0 },
  { id: 'p-003', title: 'Deep Residual Learning for Image Recognition', topic: 1, cluster: 1 },
  { id: 'p-004', title: 'Generative Adversarial Networks', topic: 2, cluster: 2 },
  { id: 'p-005', title: 'BERT: Pre-training of Deep Bidirectional Transformers', topic: 0, cluster: 0 },
  { id: 'p-006', title: 'Denoising Diffusion Probabilistic Models', topic: 2, cluster: 2 },
  { id: 'p-007', title: 'Variational Autoencoders for Collaborative Filtering', topic: 2, cluster: 3 },
  { id: 'p-008', title: 'High-Resolution Image Synthesis with Latent Diffusion Models', topic: 2, cluster: 2 },
  { id: 'p-009', title: 'An Image is Worth 16x16 Words: Transformers for Image Recognition', topic: 1, cluster: 1 },
  { id: 'p-010', title: 'Language Models are Few-Shot Learners (GPT-3)', topic: 0, cluster: 0 },
  { id: 'p-011', title: 'Masked Autoencoders Are Scalable Vision Learners', topic: 1, cluster: 1 },
  { id: 'p-012', title: 'Contrastive Learning of Visual Representations (SimCLR)', topic: 3, cluster: 4 },
  { id: 'p-013', title: 'CLIP: Learning Transferable Visual Models From Natural Language Supervision', topic: 3, cluster: 4 },
  { id: 'p-014', title: 'Segment Anything Model (SAM)', topic: 1, cluster: 5 },
  { id: 'p-015', title: 'Chain-of-Thought Prompting Elicits Reasoning in Large Language Models', topic: 4, cluster: 6 },
  { id: 'p-016', title: 'Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks', topic: 4, cluster: 6 },
  { id: 'p-017', title: 'Constitutional AI: Harmlessness from AI Feedback', topic: 4, cluster: 7 },
  { id: 'p-018', title: 'Proximal Policy Optimization Algorithms', topic: 5, cluster: 8 },
  { id: 'p-019', title: 'Reward Modeling for RLHF', topic: 5, cluster: 8 },
  { id: 'p-020', title: 'Direct Preference Optimization (DPO)', topic: 5, cluster: 8 },
  { id: 'p-021', title: 'Toolformer: Language Models Can Teach Themselves to Use Tools', topic: 4, cluster: 7 },
  { id: 'p-022', title: 'FlashAttention: Fast and Memory-Efficient Exact Attention', topic: 6, cluster: 9 },
  { id: 'p-023', title: 'Mixture of Experts Meets Instruction Tuning', topic: 6, cluster: 9 },
  { id: 'p-024', title: 'Adam: A Method for Stochastic Optimization', topic: 7, cluster: 10 },
  { id: 'p-025', title: 'Batch Normalization: Accelerating Deep Network Training', topic: 7, cluster: 10 },
  { id: 'p-026', title: 'Dropout: A Simple Way to Prevent Neural Networks from Overfitting', topic: 7, cluster: 10 },
  { id: 'p-027', title: 'Neural Ordinary Differential Equations', topic: 6, cluster: 9 },
  { id: 'p-028', title: 'Graph Neural Networks: A Review of Methods and Applications', topic: 3, cluster: 4 },
  { id: 'p-029', title: 'Self-Supervised Learning: Generalized Pretext Tasks', topic: 3, cluster: 5 },
  { id: 'p-030', title: 'Multi-Task Learning with Deep Neural Networks: A Survey', topic: 7, cluster: 10 },
]

const _FALLBACK_EDGES: [string, string][] = [
  ['p-001', 'p-002'], ['p-001', 'p-005'], ['p-001', 'p-009'], ['p-001', 'p-010'],
  ['p-001', 'p-015'], ['p-001', 'p-022'], ['p-001', 'p-023'], ['p-010', 'p-015'],
  ['p-010', 'p-016'], ['p-010', 'p-021'], ['p-003', 'p-009'], ['p-003', 'p-011'],
  ['p-004', 'p-006'], ['p-004', 'p-007'], ['p-006', 'p-008'],
  ['p-012', 'p-013'], ['p-013', 'p-014'], ['p-012', 'p-029'],
  ['p-005', 'p-010'], ['p-005', 'p-013'], ['p-018', 'p-019'], ['p-019', 'p-020'],
  ['p-015', 'p-017'], ['p-016', 'p-021'], ['p-022', 'p-023'],
  ['p-024', 'p-025'], ['p-024', 'p-026'], ['p-025', 'p-003'],
  ['p-028', 'p-012'], ['p-027', 'p-024'], ['p-030', 'p-003'], ['p-014', 'p-011'],
]

function makeFallbackData(): ExternalData {
  const R = 40
  const nodeMap = new Map<string, number>()
  const nodes: AtlasNode[] = _FALLBACK_PAPERS.map((p, i) => {
    nodeMap.set(p.id, i)
    const angle = (i / _FALLBACK_PAPERS.length) * Math.PI * 2 + p.cluster * 0.5
    const r = R * (0.5 + p.cluster * 0.12) + (i % 3) * 6
    return {
      id: p.id,
      x: Math.cos(angle) * r + (Math.random() - 0.5) * 8,
      y: Math.sin(angle) * r + (Math.random() - 0.5) * 8,
      z: (p.topic - 3) * 10 + (Math.random() - 0.5) * 5,
      topic: p.topic,
      cluster: p.cluster,
      size: p.id === 'p-001' ? 3 : p.id === 'p-010' ? 2.5 : 1 + Math.random() * 0.5,
      kind: 'paper',
      title: p.title,
    }
  })
  const links: AtlasLink[] = _FALLBACK_EDGES
    .map(([s, t]) => {
      const src = nodeMap.get(s)
      const dst = nodeMap.get(t)
      if (src === undefined || dst === undefined) return null
      return { source: s, target: t, src, dst }
    })
    .filter((e): e is AtlasLink => e !== null)
  return { nodes, links }
}

async function fetchFrontierData(projectId: string): Promise<ExternalData | null> {
  try {
    const [nodesRes, edgesRes] = await Promise.all([
      fetch(`${BASE}/api/v1/projects/${projectId}/frontier/nodes`),
      fetch(`${BASE}/api/v1/projects/${projectId}/frontier/edges`),
    ])
    if (!nodesRes.ok || !edgesRes.ok) return null
    const rawNodes: any[] = await nodesRes.json()
    const rawEdges: any[] = await edgesRes.json()
    if (!rawNodes.length) return null
    const nodeMap = new Map<string, number>()
    const nodes: AtlasNode[] = rawNodes.map((n: any, i: number) => {
      nodeMap.set(n.id, i)
      let extra: any = {}
      try { if (n.detail) extra = JSON.parse(n.detail) } catch {}
      return {
        id: n.id,
        x: extra.x ?? n.x ?? (Math.cos(i * 0.7) * (3 + i % 5)),
        y: extra.y ?? n.y ?? (Math.sin(i * 0.7) * (3 + i % 5)),
        z: extra.z ?? n.z ?? ((i % 7 - 3) * 0.8),
        topic: extra.topic_index ?? n.topic_index ?? (i % 8),
        cluster: extra.cluster_index ?? n.cluster_index ?? (i % 10),
        size: extra.size ?? n.size ?? 1,
        kind: n.node_type ?? n.kind ?? 'paper',
        title: n.label ?? n.title ?? n.id,
      }
    })
    const links: AtlasLink[] = rawEdges
      .map((e) => {
        const srcId = e.source_node_id ?? e.source_id ?? e.source ?? ''
        const dstId = e.target_node_id ?? e.target_id ?? e.target ?? ''
        const src = nodeMap.get(srcId)
        const dst = nodeMap.get(dstId)
        if (src === undefined || dst === undefined) return null
        return { source: srcId, target: dstId, src, dst }
      })
      .filter((e): e is AtlasLink => e !== null)
    return { nodes, links }
  } catch {
    return null
  }
}

export default function Frontier() {
  const currentId = useProjectStore((s) => s.currentId)

  const stageRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const controlsRef = useRef<CosmosControls | null>(null)

  const [ready, setReady] = useState(false)
  const [filter, setFilter] = useState(-1)
  const [paused, setPaused] = useState(false)
  const [linksVisible, setLinksVisible] = useState(true)
  const [curvesOn, setCurvesOn] = useState(true)
  const [tooltip, setTooltip] = useState<{ node: AtlasNode; x: number; y: number } | null>(null)

  useEffect(() => {
    if (!currentId) {
      if (controlsRef.current) {
        controlsRef.current.destroy()
        controlsRef.current = null
      }
      setReady(false)
      return
    }
    const canvas = canvasRef.current
    if (!canvas) return

    let cancelled = false

    async function init() {
      const data = await fetchFrontierData(currentId!)
      if (cancelled) return
      const fallback = (!data || data.nodes.length === 0) ? makeFallbackData() : null
      const controls = initCosmos(canvas!, {
        onPick: (node, x, y) => { setTooltip(node ? { node, x, y } : null) },
        dark: false,
        externalData: data ?? fallback ?? undefined,
      })
      if (!controls || cancelled) { controls?.destroy(); return }
      controlsRef.current = controls
      setReady(true)
    }
    init()

    return () => {
      cancelled = true
      controlsRef.current?.destroy()
      controlsRef.current = null
    }
  }, [currentId])

  const handleFilterChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = Number(e.target.value)
    setFilter(val)
    controlsRef.current?.setFilter(val)
    setTooltip(null)
  }, [])

  const handleTogglePause = useCallback(() => {
    const p = controlsRef.current?.togglePause()
    if (p !== undefined) setPaused(p)
  }, [])

  const handleToggleLinks = useCallback(() => {
    const v = controlsRef.current?.toggleLinks()
    if (v !== undefined) setLinksVisible(v)
  }, [])

  const handleToggleCurves = useCallback(() => {
    const c = controlsRef.current?.toggleCurves()
    if (c !== undefined) setCurvesOn(c)
  }, [])

  const handleReset = useCallback(() => {
    controlsRef.current?.resetView()
    setTooltip(null)
  }, [])

  if (!currentId) {
    return (
      <div className="cosmos-root">
        <div className="cosmos-top">
          <div className="cosmos-brand">APORIA / COSMOS</div>
          <div className="cosmos-sub">Experimental research atlas &middot; interactive 3D</div>
        </div>
        <div className="cosmos-empty">
          <div className="cosmos-empty-title">Select a research project to explore the paper universe</div>
          <div className="cosmos-empty-hint">Papers will appear here based on your research scope</div>
        </div>
      </div>
    )
  }

  return (
    <div className="cosmos-root">
      <div className="cosmos-stage" ref={stageRef}>
        <canvas ref={canvasRef} id="cosmos-canvas" />
      </div>

      <div className="cosmos-top">
        <div className="cosmos-brand">APORIA / COSMOS</div>
        <div className="cosmos-sub">Experimental research atlas &middot; interactive 3D</div>
      </div>

      <div className="cosmos-tools">
        <select value={filter} onChange={handleFilterChange}>
          <option value={-1}>All research</option>
          {TOPICS.map((t, i) => (
            <option key={i} value={i}>{t.name}</option>
          ))}
        </select>
        <button onClick={handleTogglePause}>{paused ? 'Resume rotation' : 'Pause rotation'}</button>
        <button onClick={handleToggleLinks}>{linksVisible ? 'Hide links' : 'Show links'}</button>
        <button onClick={handleToggleCurves}>Curves: {curvesOn ? 'On' : 'Off'}</button>
        <button onClick={handleReset}>Reset view</button>
      </div>

      <div className="cosmos-instructions">Drag to orbit &middot; Scroll to zoom &middot; Click a paper</div>

      {tooltip && (
        <div
          className="cosmos-tooltip"
          style={{
            left: Math.min(tooltip.x + 16, window.innerWidth - 300),
            top: Math.min(tooltip.y + 18, window.innerHeight - 114),
          }}
        >
          <div className="cosmos-tooltip-tag" style={{ color: TOPICS[tooltip.node.topic]?.color }}>
            {TOPICS[tooltip.node.topic]?.name.toUpperCase()}
          </div>
          <div className="cosmos-tooltip-paper">{tooltip.node.title}</div>
          <div className="cosmos-tooltip-info">
            ID {tooltip.node.id} &middot; Cluster {tooltip.node.cluster}
          </div>
        </div>
      )}
    </div>
  )
}
