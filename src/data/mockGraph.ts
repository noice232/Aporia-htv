import type { GraphNode, GraphEdge } from '../stores/graph'

const CLUSTERS: Record<string, {
  color: string
  papers: string[]
  paperCount: number
}> = {
  'Computer Vision': {
    color: 'rgba(87, 221, 246, 0.9)',
    paperCount: 214302,
    papers: [
      'DINOv2: Learning Robust Visual Features',
      'Segment Anything Model (SAM)',
      'ViT-22B: Scaling Vision Transformers',
      'InternImage: Exploring Large-Scale Vision Foundation',
      'EVA-02: A Visual Representation for Neon Genesis',
      'Florence-2: Advancing Unified Representation',
      'Depth Anything: Unleashing the Power of Large-Scale',
      'Grounding DINO: Marrying DINO with Grounded Pre-Training',
      'RAM: Recognize Anything Model',
      'Co-DETR: DETRs with Collaborative Hybrid Assignments',
      'YOLO-World: Real-Time Open-Vocabulary Object Detection',
      'SAM 2: Segment Anything in Images and Videos',
      'OWLv2: Scaling Open-Vocabulary Object Detection',
      'Mask2Former: Masked-attention Mask Transformer',
      'BEVFormer: Learning Bird Eye View Representation',
    ],
  },
  'Generative Models': {
    color: 'rgba(233, 144, 238, 0.9)',
    paperCount: 387611,
    papers: [
      'Stable Diffusion 3: Scaling Rectified Flow Transformers',
      'DALL-E 3: Improving Image Generation with Better Captions',
      'Consistency Models: Direct Distillation of Diffusion',
      'PixArt-α: Fast Training of Diffusion Transformer',
      'SDXL: Improving Latent Diffusion for High-Resolution',
      'LCM: Latent Consistency Models',
      'Playground v2.5: Three Insights towards Enhancing',
      'EMU Edit: Precise Image Editing via Recognition',
      'IP-Adapter: Text Compatible Image Prompt Adapter',
      'InstantID: Zero-shot Identity-Preserving Generation',
      'FLUX.1: Black Forest Labs Rectified Flow Transformer',
      'Sora: Creating Video from Text',
      'Imagen 3: Better Photorealism with DeepMind',
    ],
  },
  'Natural Language Processing': {
    color: 'rgba(78, 232, 186, 0.9)',
    paperCount: 298421,
    papers: [
      'LLaMA 3: Open Foundation and Fine-Tuned Models',
      'Mixtral of Experts: Efficient Sparse Transformer',
      'Phi-3: Small Language Models with Strong Reasoning',
      'GPT-4 Technical Report',
      'Gemini: A Family of Highly Capable Multimodal Models',
      'RWKV: Reinventing RNNs for the Transformer Era',
      'Mamba: Linear-Time Sequence Modeling with Selective',
      'Retrieval-Augmented Generation for Knowledge-Intensive',
      'Constitutional AI: Harmlessness from AI Feedback',
      'Direct Preference Optimization: Your Language Model',
      'Zephyr: Direct Distillation of LM Alignment',
      'Qwen2: Alibaba Technical Report',
      'DeepSeek-V2: A Strong Open-Source MoE Language Model',
      'Command R+: Scalable RAG-Optimized LLM',
    ],
  },
  'Reinforcement Learning': {
    color: 'rgba(185, 154, 255, 0.9)',
    paperCount: 176843,
    papers: [
      'Decision Transformer: Reinforcement Learning via Seq',
      'RLHF: Training Language Models to Follow Instructions',
      'PPO-Max: Scalable Proximal Policy Optimization',
      'DreamerV3: Mastering Diverse Domains through World',
      'TD-MPC2: Scalable, Robust World Models',
      'METRA: Scalable Unsupervised RL with Metric-Aware',
      'Eureka: Human-Level Reward Design via Coding LLMs',
      'Q-Transformer: Scalable Offline Reinforcement Learning',
      'RT-2: Vision-Language-Action Models Transfer Web',
      'Gato: A Generalist Agent',
    ],
  },
  'Multimodal': {
    color: 'rgba(245, 166, 35, 0.9)',
    paperCount: 298421,
    papers: [
      'LLaVA-1.5: Improved Baselines with Visual Instruction',
      'CogVLM: Visual Expert for Pretrained Language Models',
      'InternVL: Scaling up Vision Foundation Models',
      'Qwen-VL: A Versatile Vision-Language Model',
      'BLIP-3: A Family of Fully Open Multimodal Models',
      'Cambrian-1: A Fully Open, Vision-Centric Exploration',
      'Video-LLaMA: An Instruction-tuned Audio-Visual LLM',
      'ImageBind: One Embedding Space To Bind Them All',
      'NExT-GPT: Any-to-Any Multimodal LLM',
      'Ferret: Refer and Ground Anything Anywhere at Any',
      'MiniGPT-4: Enhancing Vision-Language Understanding',
    ],
  },
}

function seededRandom(seed: number) {
  let s = seed
  return () => {
    s = (s * 16807 + 0) % 2147483647
    return (s - 1) / 2147483646
  }
}

export const CLUSTER_LABELS: Record<string, string> = {
  'Computer Vision': 'Computer Vision',
  'Generative Models': 'Generative Models',
  'Natural Language Processing': 'Natural Language Processing',
  'Reinforcement Learning': 'Reinforcement Learning',
  'Multimodal': 'Multimodal',
}

export const CLUSTER_COLORS: Record<string, string> = {
  'Computer Vision': 'rgba(87, 221, 246, 0.9)',
  'Generative Models': 'rgba(233, 144, 238, 0.9)',
  'Natural Language Processing': 'rgba(78, 232, 186, 0.9)',
  'Reinforcement Learning': 'rgba(185, 154, 255, 0.9)',
  'Multimodal': 'rgba(245, 166, 35, 0.9)',
}

export const CLUSTER_PAPER_COUNTS: Record<string, number> = Object.fromEntries(
  Object.entries(CLUSTERS).map(([k, v]) => [k, v.paperCount])
)

export interface CosmographPoint {
  id: string
  label: string
  cluster: string
  color: string
  size: number
  venue: string
  year: number
  citations: number
}

export interface CosmographLink {
  source: string
  target: string
  type: string
  weight: number
}

export function generateCosmographData(): { points: CosmographPoint[]; links: CosmographLink[] } {
  const rand = seededRandom(42)
  const points: CosmographPoint[] = []
  const links: CosmographLink[] = []

  const venues = ['NeurIPS', 'ICML', 'ICLR', 'CVPR', 'ECCV', 'ACL', 'EMNLP', 'SIGGRAPH', 'AAAI', 'IJCAI']

  for (const [cluster, data] of Object.entries(CLUSTERS)) {
    for (let i = 0; i < data.papers.length; i++) {
      points.push({
        id: `${cluster}_named_${i}`,
        label: data.papers[i],
        cluster,
        color: data.color,
        size: 2 + rand() * 4,
        venue: venues[Math.floor(rand() * venues.length)],
        year: 2023 + Math.floor(rand() * 2),
        citations: Math.floor(rand() * 800) + 50,
      })
    }

    const fillCount = 2800 + Math.floor(rand() * 400)
    for (let i = 0; i < fillCount; i++) {
      const alpha = (0.3 + rand() * 0.7).toFixed(2)
      points.push({
        id: `${cluster}_fill_${i}`,
        label: '',
        cluster,
        color: data.color.replace('0.9)', `${alpha})`),
        size: 0.2 + rand() * 0.8,
        venue: venues[Math.floor(rand() * venues.length)],
        year: 2018 + Math.floor(rand() * 7),
        citations: Math.floor(rand() * 100),
      })
    }
  }

  // Intra-cluster links (dense)
  for (const cluster of Object.keys(CLUSTERS)) {
    const clusterPoints = points.filter((p) => p.cluster === cluster)
    const namedPoints = clusterPoints.filter((p) => p.label)
    // Each named node links to 3-5 others
    for (const np of namedPoints) {
      const linkCount = 3 + Math.floor(rand() * 3)
      for (let j = 0; j < linkCount; j++) {
        const target = clusterPoints[Math.floor(rand() * clusterPoints.length)]
        if (target.id !== np.id) {
          links.push({
            source: np.id,
            target: target.id,
            type: 'citation',
            weight: 0.4 + rand() * 0.6,
          })
        }
      }
    }
    // Fill nodes: only ~30% get a link to keep the graph sparse
    for (let i = 0; i < clusterPoints.length; i++) {
      if (clusterPoints[i].label) continue
      if (rand() > 0.3) continue
      const target = clusterPoints[Math.floor(rand() * clusterPoints.length)]
      if (target.id !== clusterPoints[i].id) {
        links.push({
          source: clusterPoints[i].id,
          target: target.id,
          type: 'citation',
          weight: 0.05 + rand() * 0.2,
        })
      }
    }
  }

  // Inter-cluster links (more substantial bridging)
  const allClusters = Object.keys(CLUSTERS)
  for (let i = 0; i < 80; i++) {
    const c1 = allClusters[Math.floor(rand() * allClusters.length)]
    const c2 = allClusters[Math.floor(rand() * allClusters.length)]
    if (c1 === c2) continue
    const p1 = points.filter((p) => p.cluster === c1)
    const p2 = points.filter((p) => p.cluster === c2)
    links.push({
      source: p1[Math.floor(rand() * p1.length)].id,
      target: p2[Math.floor(rand() * p2.length)].id,
      type: 'citation',
      weight: 0.05 + rand() * 0.25,
    })
  }

  return { points, links }
}

// Legacy types for stores
export function generateMockGraph(): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const { points, links } = generateCosmographData()
  const nodes: GraphNode[] = points.filter((p) => p.label).map((p) => ({
    id: p.id,
    label: p.label,
    type: 'paper' as const,
    cluster: p.cluster,
    position: [0, 0, 0] as [number, number, number],
    color: [0, 0, 0] as [number, number, number],
    size: p.size,
    metadata: { venue: p.venue, year: p.year, citations: p.citations },
  }))
  const edges: GraphEdge[] = links.slice(0, 100).map((l, i) => ({
    id: `edge_${i}`,
    source: l.source,
    target: l.target,
    type: 'citation' as const,
    weight: l.weight,
  }))
  return { nodes, edges }
}
