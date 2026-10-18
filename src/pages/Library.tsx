import { useState, useEffect, useMemo, useCallback } from 'react'
import { Search, BookOpen } from 'lucide-react'
import '../styles/library.css'

const BASE = import.meta.env.VITE_API_BASE_URL || ''

interface Paper {
  id: string
  title: string
  authors: string[]
  year: number
  venue: string
  citations: number
  provenance: string
  cluster: string
  abstract: string
}

const PROVENANCE_LABELS: Record<string, string> = {
  all: 'All',
  arxiv: 'arXiv',
  papier: 'Papier',
  openalex: 'OpenAlex',
  manual: 'Manual',
  synthetic: 'Synthetic',
}

const CLUSTER_META: Record<string, { label: string; color: string }> = {
  computer_vision: { label: 'Computer Vision', color: '#57DDF6' },
  generative_models: { label: 'Generative Models', color: '#E790EE' },
  nlp: { label: 'NLP', color: '#4EE8BA' },
  reinforcement_learning: { label: 'RL', color: '#B99AFF' },
  multimodal: { label: 'Multimodal', color: '#F5A623' },
}

type SortKey = 'relevance' | 'year' | 'citations'

function formatAuthors(authors: string[]): string {
  if (!authors || authors.length === 0) return 'Unknown'
  if (authors.length <= 3) return authors.join(', ')
  return `${authors.slice(0, 3).join(', ')} et al.`
}

export default function Library() {
  const [papers, setPapers] = useState<Paper[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [query, setQuery] = useState('')
  const [provenanceFilter, setProvenanceFilter] = useState('all')
  const [sortBy, setSortBy] = useState<SortKey>('citations')
  const [expandedAbstracts, setExpandedAbstracts] = useState<Set<string>>(new Set())

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`${BASE}/api/v1/papers`)
        if (!res.ok) throw new Error(`Failed (${res.status})`)
        const data = await res.json()
        const mapped: Paper[] = data.map((p: any) => {
          let authors: string[] = []
          if (p.authors_json) {
            const parsed = typeof p.authors_json === 'string' ? JSON.parse(p.authors_json) : p.authors_json
            authors = Array.isArray(parsed) ? parsed : []
          }
          let cluster = ''
          if (p.topics_json) {
            const topics = typeof p.topics_json === 'string' ? JSON.parse(p.topics_json) : p.topics_json
            cluster = Array.isArray(topics) && topics.length > 0 ? topics[0] : ''
          }
          return {
            id: p.id,
            title: p.title,
            authors,
            year: p.publication_year || 0,
            venue: '',
            citations: p.citation_count || 0,
            provenance: p.data_mode || 'synthetic',
            cluster,
            abstract: p.abstract || '',
          }
        })
        setPapers(mapped)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load papers')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const toggleAbstract = useCallback((id: string) => {
    setExpandedAbstracts((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const filtered = useMemo(() => {
    let result = papers

    if (provenanceFilter !== 'all') {
      result = result.filter((p) => p.provenance === provenanceFilter)
    }

    if (query.trim()) {
      const q = query.toLowerCase()
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.authors.some((a) => a.toLowerCase().includes(q)) ||
          p.abstract.toLowerCase().includes(q),
      )
    }

    const sorted = [...result]
    if (sortBy === 'year') sorted.sort((a, b) => b.year - a.year)
    else if (sortBy === 'citations') sorted.sort((a, b) => b.citations - a.citations)

    return sorted
  }, [papers, query, provenanceFilter, sortBy])

  const clusterBreakdown = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const p of papers) if (p.cluster) counts[p.cluster] = (counts[p.cluster] || 0) + 1
    return counts
  }, [papers])

  const yearBreakdown = useMemo(() => {
    const counts: Record<number, number> = {}
    for (const p of papers) if (p.year) counts[p.year] = (counts[p.year] || 0) + 1
    const years = Object.keys(counts).map(Number).sort()
    const max = Math.max(...Object.values(counts), 1)
    return { counts, years, max }
  }, [papers])

  const provenanceBreakdown = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const p of papers) counts[p.provenance] = (counts[p.provenance] || 0) + 1
    return counts
  }, [papers])

  const provenanceBadgeColors: Record<string, string> = {
    arxiv: '#EF5350',
    papier: '#4EE8BA',
    openalex: '#F5A623',
    manual: '#556577',
    synthetic: '#8F99A8',
  }

  if (loading) return <div className="page-content" style={{display:'flex',alignItems:'center',justifyContent:'center'}}><p style={{color:'var(--fg-dim)'}}>Loading...</p></div>
  if (error) return <div className="page-content" style={{display:'flex',alignItems:'center',justifyContent:'center'}}><p style={{color:'var(--accent-red)'}}>{error}</p></div>

  return (
    <div className="library-container">
      <div className="library-header">
        <div className="library-label">Paper Library</div>
        <h1 className="library-title">Source Library</h1>
        <div className="library-stats">
          <span><span className="stat-val">{papers.length}</span> papers</span>
          <span><span className="stat-val">{Object.keys(clusterBreakdown).length}</span> clusters</span>
          <span><span className="stat-val">{Object.keys(provenanceBreakdown).length}</span> sources</span>
        </div>
      </div>

      <div className="library-sync-panel">
        <div className="sync-status">
          <span className="sync-dot connected" />
          <span style={{ color: 'var(--accent-green)' }}>Connected</span>
        </div>
        <span className="sync-meta">{papers.length} papers loaded</span>
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
                  {paper.year > 0 && <span className="paper-badge year">{paper.year}</span>}
                  {paper.venue && <span className="paper-badge venue">{paper.venue}</span>}
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

                {paper.abstract && (
                  <>
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
                  </>
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

          {yearBreakdown.years.length > 0 && (
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
          )}

          <div className="sidebar-card">
            <div className="sidebar-card-title">By Source</div>
            {Object.entries(provenanceBreakdown).map(([key, count]) => (
              <div key={key} className="sidebar-row">
                <span className="sidebar-row-label">
                  <span className="sidebar-row-dot" style={{ background: provenanceBadgeColors[key] || '#8F99A8' }} />
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
