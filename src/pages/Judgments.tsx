import { useState, useMemo, useCallback } from 'react'
import { useParams } from 'react-router-dom'
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

const MOCK_CANDIDATES: Candidate[] = [
  { id: 'c1', action: 'Train 3DGS on Mip-NeRF 360 scenes', s_u: 0.82, s_c: 0.91 },
  { id: 'c2', action: 'Implement depth regularization loss', s_u: 0.75, s_c: 0.88 },
  { id: 'c3', action: 'Benchmark on Tanks & Temples dataset', s_u: 0.89, s_c: 0.72 },
  { id: 'c4', action: 'Add per-pixel confidence weighting', s_u: 0.68, s_c: 0.95 },
  { id: 'c5', action: 'Explore neural opacity fields', s_u: 0.91, s_c: 0.65 },
  { id: 'c6', action: 'Multi-scale hash encoding ablation', s_u: 0.78, s_c: 0.83 },
]

const MOCK_PRINCIPLES: Principle[] = [
  { id: 'pr1', text: 'Prioritize real-time rendering (< 30ms per frame)', status: 'approved' },
  { id: 'pr2', text: 'Prefer methods with open-source implementations', status: 'approved' },
  { id: 'pr3', text: 'Weight novel architectures over incremental improvements', status: 'approved' },
  { id: 'pr4', text: 'Ensure reproducibility on consumer GPUs (RTX 3060+)', status: 'pending' },
]

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
  const [principles, setPrinciples] = useState(MOCK_PRINCIPLES)

  const handleSlider = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setW(parseFloat(e.target.value))
  }, [])

  const autonomousRanks = useMemo(
    () => getRankMap(MOCK_CANDIDATES, (c) => c.s_u),
    [],
  )

  const scoredCandidates = useMemo(() => {
    const withScores = MOCK_CANDIDATES.map((c) => ({
      ...c,
      s_g: computeGuided(c.s_u, c.s_c, w),
    }))
    withScores.sort((a, b) => b.s_g - a.s_g)
    return withScores
  }, [w])

  const guidedRanks = useMemo(
    () => getRankMap(MOCK_CANDIDATES, (c) => computeGuided(c.s_u, c.s_c, w)),
    [w],
  )

  const handleSubmit = useCallback(() => {
    if (!judgment.trim()) return
    setPrinciples((prev) => [
      ...prev,
      { id: `pr${prev.length + 1}`, text: judgment.trim(), status: 'pending' },
    ])
    setJudgment('')
  }, [judgment])

  const activeLabel = getActiveLabel(w)

  const maxScore = Math.max(...MOCK_CANDIDATES.map((c) => Math.max(c.s_u, c.s_c))) * 2

  return (
    <div className="page-content">
      <div className="judgments-page">
        <div>
          <div className="judgments-label">Judgment Compiler</div>
          <h1 className="judgments-title">CFG Dual-Score Policy</h1>
          <p className="judgments-project">
            Project: <code>{projectId}</code>
          </p>
        </div>

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

        {/* Distribution Viz */}
        <div className="dist-row">
          <div className="dist-card">
            <h3>Without CFG (w=0)</h3>
            {[...MOCK_CANDIDATES]
              .sort((a, b) => b.s_u - a.s_u)
              .map((c) => (
                <div key={c.id} className="dist-bar-row">
                  <span className="dist-bar-label">{c.id.replace('c', '#')}</span>
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
                <span className="dist-bar-label">{c.id.replace('c', '#')}</span>
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

        {/* Principles */}
        <div className="principles-panel">
          <h2>
            Human Principles <span className="count">{principles.length} active</span>
          </h2>
          {principles.map((p) => (
            <div key={p.id} className="principle-item">
              <span className={`principle-badge ${p.status}`}>{p.status}</span>
              <span className="principle-text">{p.text}</span>
            </div>
          ))}
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
            disabled={!judgment.trim()}
          >
            Submit Judgment
          </button>
        </div>
      </div>
    </div>
  )
}
