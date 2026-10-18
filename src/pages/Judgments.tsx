import { useState, useEffect, useMemo, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { getPolicyComparison, listPrinciples, compileJudgment } from '../api/client'
import type { PolicyComparison, Principle as ApiPrinciple } from '../api/client'
import '../styles/judgments.css'

interface Candidate {
  id: string
  action: string
  s_u: number
  s_c: number
}

interface Principle {
  id: string
  text: string
  status: 'approved' | 'pending'
}

function mapPrinciple(p: ApiPrinciple): Principle {
  return {
    id: p.id,
    text: p.text,
    status: (p.status === 'approved' ? 'approved' : 'pending') as Principle['status'],
  }
}

function computeGuided(s_u: number, s_c: number, w: number): number {
  return s_u + w * (s_c - s_u)
}

function getRankMap(candidates: Candidate[], scoreFn: (c: Candidate) => number): Map<string, number> {
  const sorted = [...candidates].sort((a, b) => scoreFn(b) - scoreFn(a))
  const map = new Map<string, number>()
  sorted.forEach((c, i) => map.set(c.id, i + 1))
  return map
}

function getModeDescription(w: number): string {
  if (w === 0) return 'Pure autonomous decisions — no human influence on scoring'
  if (w < 0.5) return 'Lightly guided — agent leads with subtle human nudges'
  if (w === 1) return 'Balanced blend of autonomous and human-guided scoring'
  if (w < 1.5) return 'Human-favored — principles steer most decisions'
  if (w === 2) return 'Strong CFG — human principles dominate research direction'
  return `Guidance weight: ${w.toFixed(1)}`
}

function getActiveLabel(w: number): 0 | 1 | 2 {
  if (w < 0.7) return 0
  if (w < 1.4) return 1
  return 2
}

export default function Judgments() {
  const { projectId } = useParams()
  const [w, setW] = useState(1.0)
  const [judgment, setJudgment] = useState('')
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [principles, setPrinciples] = useState<Principle[]>([])
  const [dataMode, setDataMode] = useState<string>('mock')
  const [serverW, setServerW] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const fetchData = useCallback(async () => {
    if (!projectId) return
    setLoading(true)
    setError(null)
    try {
      const [comparison, principleResult] = await Promise.all([
        getPolicyComparison(projectId),
        listPrinciples(projectId),
      ])

      const comp = comparison as PolicyComparison
      const branch = comp.with_cfg ?? comp.without_cfg
      if (branch?.candidates) {
        setCandidates(
          branch.candidates.map((c) => ({
            id: c.candidate_id,
            action: c.label,
            s_u: c.s_u,
            s_c: c.s_c,
          })),
        )
      }
      setDataMode(comp.data_mode ?? 'mock')
      if (comp.with_cfg?.w != null) {
        setServerW(comp.with_cfg.w)
        setW(comp.with_cfg.w)
      }

      setPrinciples((principleResult as ApiPrinciple[]).map(mapPrinciple))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load judgment data')
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => { fetchData() }, [fetchData])

  const handleSlider = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setW(parseFloat(e.target.value))
  }, [])

  const autonomousRanks = useMemo(
    () => getRankMap(candidates, (c) => c.s_u),
    [candidates],
  )

  const scoredCandidates = useMemo(() => {
    const withScores = candidates.map((c) => ({
      ...c,
      s_g: computeGuided(c.s_u, c.s_c, w),
    }))
    withScores.sort((a, b) => b.s_g - a.s_g)
    return withScores
  }, [candidates, w])

  const guidedRanks = useMemo(
    () => getRankMap(candidates, (c) => computeGuided(c.s_u, c.s_c, w)),
    [candidates, w],
  )

  const handleSubmit = useCallback(async () => {
    if (!judgment.trim() || !projectId) return
    setSubmitting(true)
    try {
      const result = await compileJudgment(projectId, judgment.trim())
      const p = mapPrinciple(result as ApiPrinciple)
      setPrinciples((prev) => [...prev, p])
      setJudgment('')
    } catch {
      setPrinciples((prev) => [
        ...prev,
        { id: `pr${prev.length + 1}`, text: judgment.trim(), status: 'pending' },
      ])
      setJudgment('')
    } finally {
      setSubmitting(false)
    }
  }, [judgment, projectId])

  if (!projectId) {
    return (
      <div className="page-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: 'var(--fg-dim)', fontSize: 13 }}>
          Select a project to view the Judgment Compiler
        </div>
      </div>
    )
  }

  if (loading && candidates.length === 0) {
    return (
      <div className="page-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'var(--fg-dim)', fontSize: 13 }}>Loading judgment data...</div>
      </div>
    )
  }

  const activeLabel = getActiveLabel(w)
  const maxScore = candidates.length > 0
    ? Math.max(...candidates.map((c) => Math.max(c.s_u, c.s_c))) * 2
    : 2

  return (
    <div className="page-content">
      <div className="judgments-page">
        <div>
          <div className="judgments-label">
            Judgment Compiler
            <span className={`data-mode-badge ${dataMode}`}>{dataMode}</span>
          </div>
          <h1 className="judgments-title">CFG Dual-Score Policy</h1>
          <p className="judgments-project">
            Project: <code>{projectId}</code>
            {serverW != null && (
              <span style={{ marginLeft: 12, fontSize: 12, color: 'var(--fg-dim)' }}>
                Server w={serverW.toFixed(1)}
              </span>
            )}
          </p>
        </div>

        {error && (
          <div style={{ background: 'rgba(220,38,38,0.08)', border: '1px solid var(--accent-red)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', fontSize: 13, color: 'var(--accent-red)' }}>
            {error}
          </div>
        )}

        {/* CFG Hero */}
        <div className="cfg-hero">
          <div className="cfg-hero-header">
            <div className="cfg-hero-left">
              <h2>Classifier-Free Guidance</h2>
              <div className="cfg-formula">
                <span className="sym-guided">s<sub>g</sub></span>
                <span>=</span>
                <span className="sym-uncond">s<sub>u</sub></span>
                <span>+</span>
                <span className="sym-w">w</span>
                <span>&middot; (</span>
                <span className="sym-cond">s<sub>c</sub></span>
                <span>-</span>
                <span className="sym-uncond">s<sub>u</sub></span>
                <span>)</span>
              </div>
            </div>
            <div className="cfg-w-display">
              <div className="cfg-w-value">{w.toFixed(1)}</div>
              <div className="cfg-w-label">Weight</div>
            </div>
          </div>

          <div className="cfg-slider-wrap">
            <div className="cfg-slider-labels">
              <span className={`cfg-slider-label ${activeLabel === 0 ? 'active' : ''}`}>
                Autonomous
              </span>
              <span className={`cfg-slider-label ${activeLabel === 1 ? 'active' : ''}`}>
                Guided
              </span>
              <span className={`cfg-slider-label ${activeLabel === 2 ? 'active' : ''}`}>
                Strong CFG
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="2"
              step="0.1"
              value={w}
              onChange={handleSlider}
              className="cfg-slider"
            />
            <div className="cfg-mode-desc">{getModeDescription(w)}</div>
          </div>
        </div>

        {/* Score Table */}
        {candidates.length > 0 ? (
          <div className="score-table-wrap">
            <div className="score-table-header">
              <h2>Candidate Scoring</h2>
              <span>Sorted by guided score (s<sub>g</sub>)</span>
            </div>
            <table className="score-table">
              <thead>
                <tr>
                  <th style={{ width: 44 }}>#</th>
                  <th>Candidate Action</th>
                  <th className="num hide-mobile">
                    s<sub>u</sub>
                  </th>
                  <th className="num hide-mobile">
                    s<sub>c</sub>
                  </th>
                  <th className="num">
                    s<sub>g</sub>
                  </th>
                  <th className="num">Shift</th>
                </tr>
              </thead>
              <tbody>
                {scoredCandidates.map((c) => {
                  const guidedRank = guidedRanks.get(c.id) ?? 0
                  const autoRank = autonomousRanks.get(c.id) ?? 0
                  const rankDiff = autoRank - guidedRank

                  return (
                    <tr key={c.id}>
                      <td>
                        <span
                          className={`score-rank ${guidedRank <= 3 ? `rank-${guidedRank}` : ''}`}
                        >
                          {guidedRank}
                        </span>
                      </td>
                      <td className="score-action">{c.action}</td>
                      <td className="num hide-mobile score-su">{c.s_u.toFixed(2)}</td>
                      <td className="num hide-mobile score-sc">{c.s_c.toFixed(2)}</td>
                      <td className="num score-sg">{c.s_g.toFixed(2)}</td>
                      <td className="num">
                        {rankDiff > 0 && (
                          <span className="rank-change up">&#9650; {rankDiff}</span>
                        )}
                        {rankDiff < 0 && (
                          <span className="rank-change down">&#9660; {Math.abs(rankDiff)}</span>
                        )}
                        {rankDiff === 0 && <span className="rank-change same">&mdash;</span>}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : !loading && (
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 40, textAlign: 'center', color: 'var(--fg-dim)', fontSize: 13 }}>
            No candidates scored yet. Run a policy scoring pass to populate this table.
          </div>
        )}

        {/* Distribution Viz */}
        {candidates.length > 0 && (
          <div className="dist-row">
            <div className="dist-card">
              <h3>Without CFG (w=0)</h3>
              {[...candidates]
                .sort((a, b) => b.s_u - a.s_u)
                .map((c) => (
                  <div key={c.id} className="dist-bar-row">
                    <span className="dist-bar-label">{c.id.slice(0, 4)}</span>
                    <div className="dist-bar-track">
                      <div
                        className="dist-bar-fill"
                        style={{
                          width: `${(c.s_u / maxScore) * 100}%`,
                          background: 'var(--accent-cyan)',
                        }}
                      />
                    </div>
                    <span className="dist-bar-score">{c.s_u.toFixed(2)}</span>
                  </div>
                ))}
            </div>

            <div className="dist-card">
              <h3>With CFG (w={w.toFixed(1)})</h3>
              {scoredCandidates.map((c) => (
                <div key={c.id} className="dist-bar-row">
                  <span className="dist-bar-label">{c.id.slice(0, 4)}</span>
                  <div className="dist-bar-track">
                    <div
                      className="dist-bar-fill"
                      style={{
                        width: `${(c.s_g / maxScore) * 100}%`,
                        background: 'var(--accent-lavender)',
                      }}
                    />
                  </div>
                  <span className="dist-bar-score">{c.s_g.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Principles */}
        <div className="principles-panel">
          <h2>
            Human Principles <span className="count">{principles.length} active</span>
          </h2>
          {principles.length === 0 ? (
            <div style={{ color: 'var(--fg-dim)', fontSize: 13, padding: '10px 0' }}>
              No principles yet. Submit a judgment below to create one.
            </div>
          ) : (
            principles.map((p) => (
              <div key={p.id} className="principle-item">
                <span className={`principle-badge ${p.status}`}>{p.status}</span>
                <span className="principle-text">{p.text}</span>
              </div>
            ))
          )}
        </div>

        {/* Judgment Input */}
        <div className="judgment-input-wrap">
          <h2>Submit New Judgment</h2>
          <textarea
            className="judgment-textarea"
            placeholder="Add a research principle or constraint to guide the agent..."
            value={judgment}
            onChange={(e) => setJudgment(e.target.value)}
          />
          <button
            className="judgment-submit"
            onClick={handleSubmit}
            disabled={!judgment.trim() || submitting}
          >
            {submitting ? 'Submitting...' : 'Submit Judgment'}
          </button>
        </div>
      </div>
    </div>
  )
}
