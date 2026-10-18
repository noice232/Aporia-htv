import { useState, useMemo, useCallback } from 'react'
import { Search, BookOpen } from 'lucide-react'
import '../styles/library.css'

interface MockPaper {
  id: string
  title: string
  authors: string[]
  year: number
  venue: string
  citations: number
  provenance: 'arxiv' | 'papier' | 'openalex' | 'manual'
  cluster: string
  abstract: string
}

const MOCK_PAPERS: MockPaper[] = [
  { id: 'p1', title: '3D Gaussian Splatting for Real-Time Radiance Field Rendering', authors: ['Kerbl, B.', 'Kopanas, G.', 'Leimkühler, T.', 'Drettakis, G.'], year: 2023, venue: 'SIGGRAPH', citations: 1847, provenance: 'arxiv', cluster: 'computer_vision', abstract: 'We introduce three-dimensional Gaussian Splatting, a rasterization approach for real-time radiance field rendering that achieves state-of-the-art visual quality while training and rendering significantly faster than previous methods.' },
  { id: 'p2', title: 'Instant Neural Graphics Primitives with a Multiresolution Hash Encoding', authors: ['Müller, T.', 'Evans, A.', 'Schied, C.', 'Keller, A.'], year: 2022, venue: 'SIGGRAPH', citations: 2341, provenance: 'arxiv', cluster: 'computer_vision', abstract: 'Neural graphics primitives, parameterized by fully connected neural networks, can be costly to train and evaluate. We reduce this cost with a versatile new input encoding.' },
  { id: 'p3', title: 'NeRF: Representing Scenes as Neural Radiance Fields for View Synthesis', authors: ['Mildenhall, B.', 'Srinivasan, P.P.', 'Tancik, M.', 'Barron, J.T.', 'Ramamoorthi, R.', 'Ng, R.'], year: 2020, venue: 'ECCV', citations: 8932, provenance: 'papier', cluster: 'computer_vision', abstract: 'We present a method that achieves state-of-the-art results for synthesizing novel views of complex scenes by optimizing an underlying continuous volumetric scene function.' },
  { id: 'p4', title: 'Mip-NeRF 360: Unbounded Anti-Aliased Neural Radiance Fields', authors: ['Barron, J.T.', 'Mildenhall, B.', 'Verbin, D.', 'Srinivasan, P.P.', 'Hedman, P.'], year: 2022, venue: 'CVPR', citations: 1256, provenance: 'arxiv', cluster: 'computer_vision', abstract: 'We present an extension of mip-NeRF that uses a non-linear scene parameterization, online distillation, and a novel distortion-based regularizer to handle unbounded scenes.' },
  { id: 'p5', title: 'SuGaR: Surface-Aligned Gaussian Splatting for Efficient 3D Mesh Reconstruction', authors: ['Guédon, A.', 'Lepetit, V.'], year: 2024, venue: 'CVPR', citations: 89, provenance: 'papier', cluster: 'computer_vision', abstract: 'We propose a method to extract accurate meshes from 3D Gaussian Splatting by aligning Gaussians with the surface of the scene.' },
  { id: 'p6', title: 'Depth Anything: Unleashing the Power of Large-Scale Unlabeled Data', authors: ['Yang, L.', 'Kang, B.', 'Huang, Z.', 'Xu, X.', 'Feng, J.', 'Zhao, H.'], year: 2024, venue: 'CVPR', citations: 456, provenance: 'openalex', cluster: 'computer_vision', abstract: 'We present Depth Anything, a foundation model for monocular depth estimation trained on a dataset of 62 million images.' },
  { id: 'p7', title: 'DreamGaussian: Generative Gaussian Splatting for Efficient 3D Content Creation', authors: ['Tang, J.', 'Ren, J.', 'Zhou, H.', 'Liu, Z.', 'Zeng, G.'], year: 2024, venue: 'ICLR', citations: 234, provenance: 'arxiv', cluster: 'generative_models', abstract: 'We propose DreamGaussian, a novel framework that combines 3D Gaussian Splatting with generative models for efficient 3D content creation.' },
  { id: 'p8', title: 'LRM: Large Reconstruction Model for Single Image to 3D', authors: ['Hong, Y.', 'Zhang, K.', 'Gu, J.', 'Bi, S.', 'Zhou, Y.', 'Liu, D.', 'Liu, F.', 'Sunkavalli, K.', 'Bui, T.', 'Tan, H.'], year: 2024, venue: 'ICLR', citations: 178, provenance: 'openalex', cluster: 'multimodal', abstract: 'We propose the first Large Reconstruction Model that predicts the 3D model of an object from a single input image within 5 seconds.' },
  { id: 'p9', title: 'GaussianEditor: Swift and Controllable 3D Editing with Gaussian Splatting', authors: ['Chen, Y.', 'Chen, Z.', 'Zhang, C.', 'Wang, F.', 'Yang, X.', 'Wang, Y.', 'Cai, Z.', 'Yang, L.', 'Liu, H.', 'Lin, G.'], year: 2024, venue: 'CVPR', citations: 67, provenance: 'papier', cluster: 'generative_models', abstract: 'We present GaussianEditor, an innovative 3D editing algorithm based on Gaussian Splatting that achieves delicate and controllable editing.' },
  { id: 'p10', title: 'Zip-NeRF: Anti-Aliased Grid-Based Neural Radiance Fields', authors: ['Barron, J.T.', 'Mildenhall, B.', 'Verbin, D.', 'Srinivasan, P.P.', 'Hedman, P.'], year: 2023, venue: 'ICCV', citations: 543, provenance: 'arxiv', cluster: 'computer_vision', abstract: 'Neural radiance field training can be accelerated through the use of grid-based representations. We combine the ideas of mip-NeRF and grid-based models.' },
  { id: 'p11', title: 'GOF: Gaussian Opacity Fields for Efficient Mesh Reconstruction', authors: ['Yu, Z.', 'Shen, S.'], year: 2024, venue: 'NeurIPS', citations: 42, provenance: 'manual', cluster: 'computer_vision', abstract: 'We propose Gaussian Opacity Fields for efficient and high-quality mesh reconstruction from multi-view images using 3D Gaussian Splatting.' },
  { id: 'p12', title: 'NerfAcc: Efficient Sampling Accelerates NeRFs', authors: ['Li, R.', 'Gao, H.', 'Tancik, M.', 'Kanazawa, A.'], year: 2023, venue: 'ICCV', citations: 312, provenance: 'openalex', cluster: 'computer_vision', abstract: 'We propose NerfAcc, a flexible toolbox for accelerating NeRF training through efficient ray sampling strategies.' },
]

const PROVENANCE_LABELS: Record<string, string> = {
  all: 'All',
  arxiv: 'arXiv',
  papier: 'Papier',
  openalex: 'OpenAlex',
  manual: 'Manual',
}

const CLUSTER_META: Record<string, { label: string; color: string }> = {
  computer_vision: { label: 'Computer Vision', color: '#0891B2' },
  generative_models: { label: 'Generative Models', color: '#C026D3' },
  nlp: { label: 'NLP', color: '#0FAF82' },
  reinforcement_learning: { label: 'RL', color: '#7C3AED' },
  multimodal: { label: 'Multimodal', color: '#D97706' },
}

type SortKey = 'relevance' | 'year' | 'citations'

function formatAuthors(authors: string[]): string {
  if (authors.length <= 3) return authors.join(', ')
  return `${authors.slice(0, 3).join(', ')} et al.`
}

export default function Library() {
  const [query, setQuery] = useState('')
  const [provenanceFilter, setProvenanceFilter] = useState('all')
  const [sortBy, setSortBy] = useState<SortKey>('citations')
  const [expandedAbstracts, setExpandedAbstracts] = useState<Set<string>>(new Set())

  const toggleAbstract = useCallback((id: string) => {
    setExpandedAbstracts((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const filtered = useMemo(() => {
    let papers = MOCK_PAPERS

    if (provenanceFilter !== 'all') {
      papers = papers.filter((p) => p.provenance === provenanceFilter)
    }

    if (query.trim()) {
      const q = query.toLowerCase()
      papers = papers.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.authors.some((a) => a.toLowerCase().includes(q)) ||
          p.abstract.toLowerCase().includes(q),
      )
    }

    const sorted = [...papers]
    if (sortBy === 'year') sorted.sort((a, b) => b.year - a.year)
    else if (sortBy === 'citations') sorted.sort((a, b) => b.citations - a.citations)

    return sorted
  }, [query, provenanceFilter, sortBy])

  const clusterBreakdown = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const p of MOCK_PAPERS) counts[p.cluster] = (counts[p.cluster] || 0) + 1
    return counts
  }, [])

  const yearBreakdown = useMemo(() => {
    const counts: Record<number, number> = {}
    for (const p of MOCK_PAPERS) counts[p.year] = (counts[p.year] || 0) + 1
    const years = Object.keys(counts).map(Number).sort()
    const max = Math.max(...Object.values(counts))
    return { counts, years, max }
  }, [])

  const provenanceBreakdown = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const p of MOCK_PAPERS) counts[p.provenance] = (counts[p.provenance] || 0) + 1
    return counts
  }, [])

  const provenanceBadgeColors: Record<string, string> = {
    arxiv: '#DC2626',
    papier: '#0FAF82',
    openalex: '#D97706',
    manual: '#8F99A8',
  }

  return (
    <div className="library-container">
      <div className="library-header">
        <div className="library-label">Paper Library</div>
        <h1 className="library-title">Source Library</h1>
        <div className="library-stats">
          <span><span className="stat-val">{MOCK_PAPERS.length}</span> papers</span>
          <span><span className="stat-val">{Object.keys(clusterBreakdown).length}</span> clusters</span>
          <span><span className="stat-val">{Object.keys(provenanceBreakdown).length}</span> sources</span>
        </div>
      </div>

      <div className="library-sync-panel">
        <div className="sync-status">
          <span className="sync-dot connected" />
          <span style={{ color: 'var(--accent-green)' }}>Papier Connected</span>
        </div>
        <span className="sync-meta">Last sync: 2 min ago &middot; 847 papers</span>
        <button className="sync-btn">Sync Now</button>
      </div>

      <div className="library-toolbar">
        <div className="library-search-row">
          <div className="library-search-wrap">
            <Search size={14} />
            <input
              type="text"
              className="library-search-input"
              placeholder="Search papers by title, author, topic..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <select
            className="library-sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortKey)}
          >
            <option value="relevance">Sort: Relevance</option>
            <option value="year">Sort: Year</option>
            <option value="citations">Sort: Citations</option>
          </select>
        </div>

        <div className="library-filter-chips">
          {Object.entries(PROVENANCE_LABELS).map(([key, label]) => (
            <button
              key={key}
              className={`library-chip ${provenanceFilter === key ? 'active' : ''}`}
              onClick={() => setProvenanceFilter(key)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="library-body">
        <div className="library-papers">
          {filtered.length === 0 && (
            <div className="library-empty">
              <BookOpen size={24} style={{ marginBottom: 8, opacity: 0.4 }} />
              <div>No papers match your search.</div>
            </div>
          )}

          {filtered.map((paper) => {
            const clusterMeta = CLUSTER_META[paper.cluster]
            const expanded = expandedAbstracts.has(paper.id)

            return (
              <div key={paper.id} className="paper-card">
                <div className="paper-card-top">
                  <div className="paper-title">{paper.title}</div>
                  <button className="paper-add-btn">+ Project</button>
                </div>

                <div className="paper-authors">{formatAuthors(paper.authors)}</div>

                <div className="paper-meta">
                  <span className="paper-badge year">{paper.year}</span>
                  <span className="paper-badge venue">{paper.venue}</span>
                  <span className="paper-badge citations">{paper.citations.toLocaleString()} cit.</span>
                  <span className={`paper-badge provenance provenance-${paper.provenance}`}>
                    {paper.provenance}
                  </span>
                  {clusterMeta && (
                    <span
                      className="paper-badge cluster-tag"
                      style={{
                        borderColor: `${clusterMeta.color}44`,
                        color: clusterMeta.color,
                      }}
                    >
                      {clusterMeta.label}
                    </span>
                  )}
                </div>

                <div
                  className={`paper-abstract ${expanded ? 'expanded' : 'collapsed'}`}
                  onClick={() => toggleAbstract(paper.id)}
                >
                  {paper.abstract}
                </div>
                {paper.abstract.length > 100 && (
                  <span className="paper-abstract-toggle" onClick={() => toggleAbstract(paper.id)}>
                    {expanded ? 'Show less' : 'Show more'}
                  </span>
                )}
              </div>
            )
          })}
        </div>

        <div className="library-sidebar">
          <div className="sidebar-card">
            <div className="sidebar-card-title">By Cluster</div>
            {Object.entries(CLUSTER_META).map(([key, meta]) => (
              <div key={key} className="sidebar-row">
                <span className="sidebar-row-label">
                  <span className="sidebar-row-dot" style={{ background: meta.color }} />
                  {meta.label}
                </span>
                <span className="sidebar-row-count">{clusterBreakdown[key] || 0}</span>
              </div>
            ))}
          </div>

          <div className="sidebar-card">
            <div className="sidebar-card-title">By Year</div>
            {yearBreakdown.years.map((year) => (
              <div key={year} className="year-bar-row">
                <span className="year-bar-label">{year}</span>
                <div className="year-bar-track">
                  <div
                    className="year-bar-fill"
                    style={{ width: `${(yearBreakdown.counts[year] / yearBreakdown.max) * 100}%` }}
                  />
                </div>
                <span className="year-bar-count">{yearBreakdown.counts[year]}</span>
              </div>
            ))}
          </div>

          <div className="sidebar-card">
            <div className="sidebar-card-title">By Source</div>
            {Object.entries(provenanceBreakdown).map(([key, count]) => (
              <div key={key} className="sidebar-row">
                <span className="sidebar-row-label">
                  <span className="sidebar-row-dot" style={{ background: provenanceBadgeColors[key] }} />
                  {PROVENANCE_LABELS[key] || key}
                </span>
                <span className="sidebar-row-count">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
