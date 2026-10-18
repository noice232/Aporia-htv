import type { GraphNode, GraphEdge } from '../stores/graph'

const CLUSTERS: Record<string, { center: [number, number, number]; color: [number, number, number]; papers: string[] }> = {
  computer_vision: {
    center: [-12, 5, -8],
    color: [0.34, 0.87, 0.96],
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
    ],
  },
  generative_models: {
    center: [14, -3, 6],
    color: [0.91, 0.56, 0.93],
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
    ],
  },
  nlp: {
    center: [3, 10, 14],
    color: [0.31, 0.91, 0.73],
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
    ],
  },
  reinforcement_learning: {
    center: [-8, -10, -14],
    color: [0.73, 0.60, 1.0],
    papers: [
      'Decision Transformer: Reinforcement Learning via Seq',
      'RLHF: Training Language Models to Follow Instructions',
      'PPO-Max: Scalable Proximal Policy Optimization',
      'DreamerV3: Mastering Diverse Domains through World',
      'TD-MPC2: Scalable, Robust World Models',
      'METRA: Scalable Unsupervised RL with Metric-Aware',
      'Eureka: Human-Level Reward Design via Coding LLMs',
      'Q-Transformer: Scalable Offline Reinforcement Learning',
    ],
  },
  multimodal: {
    center: [10, 8, -12],
    color: [0.96, 0.65, 0.14],
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

export function generateMockGraph(): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const nodes: GraphNode[] = []
  const edges: GraphEdge[] = []
  const rand = seededRandom(42)

  for (const [cluster, data] of Object.entries(CLUSTERS)) {
    for (let i = 0; i < data.papers.length; i++) {
      const spread = 6
      const position: [number, number, number] = [
        data.center[0] + (rand() - 0.5) * spread * 2,
        data.center[1] + (rand() - 0.5) * spread * 2,
        data.center[2] + (rand() - 0.5) * spread * 2,
      ]
      const size = 0.15 + rand() * 0.35

      nodes.push({
        id: `${cluster}_${i}`,
        label: data.papers[i],
        type: 'paper',
        cluster,
        position,
        color: data.color,
        size,
        metadata: {
          year: 2023 + Math.floor(rand() * 2),
          venue: ['NeurIPS', 'ICML', 'ICLR', 'CVPR', 'ECCV', 'ACL', 'EMNLP'][Math.floor(rand() * 7)],
          citations: Math.floor(rand() * 500) + 10,
        },
      })
    }
  }

  const edgeTypes: GraphEdge['type'][] = ['citation', 'dependency', 'evidence', 'contradiction']

  for (const node of nodes) {
    const sameCluster = nodes.filter((n) => n.cluster === node.cluster && n.id !== node.id)
    const intraCount = Math.min(Math.floor(rand() * 3) + 1, sameCluster.length)
    for (let i = 0; i < intraCount; i++) {
      const target = sameCluster[Math.floor(rand() * sameCluster.length)]
      const edgeId = [node.id, target.id].sort().join('__')
      if (!edges.find((e) => e.id === edgeId)) {
        edges.push({
          id: edgeId,
          source: node.id,
          target: target.id,
          type: edgeTypes[Math.floor(rand() * 3)],
          weight: 0.3 + rand() * 0.7,
        })
      }
    }

    if (rand() > 0.6) {
      const otherNodes = nodes.filter((n) => n.cluster !== node.cluster)
      if (otherNodes.length > 0) {
        const target = otherNodes[Math.floor(rand() * otherNodes.length)]
        const edgeId = [node.id, target.id].sort().join('__')
        if (!edges.find((e) => e.id === edgeId)) {
          edges.push({
            id: edgeId,
            source: node.id,
            target: target.id,
            type: rand() > 0.7 ? 'contradiction' : 'citation',
            weight: 0.1 + rand() * 0.4,
          })
        }
      }
    }
  }

  return { nodes, edges }
}
