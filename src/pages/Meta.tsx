import { useState, useEffect } from 'react';
import { FlaskConical, Plus } from 'lucide-react';
import '../styles/meta.css';

const BASE = import.meta.env.VITE_API_BASE_URL || '';

interface Strategy {
  id: string;
  name: string;
  description: string | null;
  version: number;
  status: string;
  created_at: string;
}

interface Trial {
  id: string;
  strategy_a_id: string;
  strategy_b_id: string;
  status: string;
  result_json: any;
  started_at: string;
  ended_at: string | null;
}

export default function Meta() {
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [trials, setTrials] = useState<Trial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showNewTrial, setShowNewTrial] = useState(false);
  const [trialA, setTrialA] = useState('');
  const [trialB, setTrialB] = useState('');
  const [creating, setCreating] = useState(false);

  const [showNewStrategy, setShowNewStrategy] = useState(false);
  const [newStratName, setNewStratName] = useState('');
  const [newStratDesc, setNewStratDesc] = useState('');
  const [creatingStrat, setCreatingStrat] = useState(false);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [metaRes, stratRes] = await Promise.all([
        fetch(`${BASE}/api/v1/workspaces/default/meta`),
        fetch(`${BASE}/api/v1/workspaces/default/strategies`),
      ]);
      if (!metaRes.ok || !stratRes.ok) throw new Error('Failed to fetch');
      setTrials(await metaRes.json());
      setStrategies(await stratRes.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateTrial() {
    if (!trialA || !trialB || trialA === trialB) return;
    setCreating(true);
    try {
      const res = await fetch(`${BASE}/api/v1/workspaces/default/meta/trials`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ strategy_a_id: trialA, strategy_b_id: trialB }),
      });
      if (!res.ok) throw new Error('Failed to create trial');
      const trial = await res.json();
      setTrials((prev) => [trial, ...prev]);
      setShowNewTrial(false);
      setTrialA('');
      setTrialB('');
    } catch {
      // silently handle — the trial list will refresh
    } finally {
      setCreating(false);
    }
  }

  async function handleCreateStrategy() {
    if (!newStratName.trim()) return;
    setCreatingStrat(true);
    try {
      const res = await fetch(`${BASE}/api/v1/workspaces/default/strategies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newStratName, description: newStratDesc || null }),
      });
      if (!res.ok) throw new Error('Failed');
      const strat = await res.json();
      setStrategies((prev) => [...prev, strat]);
      setShowNewStrategy(false);
      setNewStratName('');
      setNewStratDesc('');
    } catch {
      // silently handle
    } finally {
      setCreatingStrat(false);
    }
  }

  const stratMap = new Map(strategies.map((s) => [s.id, s]));

  function getStratName(id: string): string {
    return stratMap.get(id)?.name || id.slice(0, 8);
  }

  function trialResultLabel(t: Trial): string | null {
    if (t.status !== 'completed') return null;
    if (!t.result_json) return 'Inconclusive';
    if (typeof t.result_json === 'string') {
      if (t.result_json.includes('a_wins')) return `${getStratName(t.strategy_a_id)} wins`;
      if (t.result_json.includes('b_wins')) return `${getStratName(t.strategy_b_id)} wins`;
      return t.result_json;
    }
    const r = t.result_json;
    if (r.winner === 'a' || r.result === 'a_wins') return `${getStratName(t.strategy_a_id)} wins`;
    if (r.winner === 'b' || r.result === 'b_wins') return `${getStratName(t.strategy_b_id)} wins`;
    return 'Inconclusive';
  }

  if (loading)
    return (
      <div className="meta-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--fg-dim)' }}>Loading meta experiments...</p>
      </div>
    );

  if (error)
    return (
      <div className="meta-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--accent-red)' }}>{error}</p>
      </div>
    );

  return (
    <div className="meta-page">
      <div className="meta-label">Meta Experiments</div>
      <h1 style={{ marginBottom: 4 }}>Strategy Comparison</h1>
      <p className="meta-subtitle">
        Run A/B trials to compare research strategies. Test whether broad exploration or focused
        depth produces better results for your project.
      </p>

      {/* ── Strategies ── */}
      <div className="meta-section">
        <div className="meta-section-header">
          <h2 className="meta-section-title">
            Strategies <span className="meta-count">{strategies.length}</span>
          </h2>
          <button className="meta-action-btn" onClick={() => setShowNewStrategy((o) => !o)}>
            <Plus size={14} /> New Strategy
          </button>
        </div>

        {showNewStrategy && (
          <div className="meta-form-card">
            <input
              className="meta-input"
              value={newStratName}
              onChange={(e) => setNewStratName(e.target.value)}
              placeholder="Strategy name (e.g. Depth-First Exploration)"
            />
            <input
              className="meta-input"
              value={newStratDesc}
              onChange={(e) => setNewStratDesc(e.target.value)}
              placeholder="Description (optional)"
            />
            <div className="meta-form-actions">
              <button className="meta-cancel-btn" onClick={() => setShowNewStrategy(false)}>
                Cancel
              </button>
              <button
                className="meta-submit-btn"
                disabled={creatingStrat || !newStratName.trim()}
                onClick={handleCreateStrategy}
              >
                {creatingStrat ? 'Creating...' : 'Create Strategy'}
              </button>
            </div>
          </div>
        )}

        <div className="meta-strategy-grid">
          {strategies.map((s) => (
            <div key={s.id} className="meta-strategy-card">
              <div className="meta-strategy-header">
                <span className="meta-strategy-name">{s.name}</span>
                <span className={`meta-badge ${s.status}`}>{s.status}</span>
              </div>
              {s.description && <div className="meta-strategy-desc">{s.description}</div>}
              <div className="meta-strategy-meta">
                <span>v{s.version}</span>
                <span>{new Date(s.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
          {strategies.length === 0 && (
            <div className="meta-empty">
              <FlaskConical size={20} style={{ color: 'var(--fg-dim)', marginBottom: 8 }} />
              <div>No strategies configured yet.</div>
              <div style={{ fontSize: 12 }}>Create one to start A/B testing research approaches.</div>
            </div>
          )}
        </div>
      </div>

      {/* ── Trials ── */}
      <div className="meta-section">
        <div className="meta-section-header">
          <h2 className="meta-section-title">
            A/B Trials <span className="meta-count">{trials.length}</span>
          </h2>
          {strategies.length >= 2 && (
            <button className="meta-action-btn" onClick={() => setShowNewTrial((o) => !o)}>
              <Plus size={14} /> New Trial
            </button>
          )}
        </div>

        {showNewTrial && (
          <div className="meta-form-card">
            <div className="meta-trial-form-row">
              <div className="meta-trial-form-col">
                <label className="meta-form-label">Strategy A</label>
                <select className="meta-select" value={trialA} onChange={(e) => setTrialA(e.target.value)}>
                  <option value="">Select...</option>
                  {strategies.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <span className="meta-trial-form-vs">vs</span>
              <div className="meta-trial-form-col">
                <label className="meta-form-label">Strategy B</label>
                <select className="meta-select" value={trialB} onChange={(e) => setTrialB(e.target.value)}>
                  <option value="">Select...</option>
                  {strategies.filter((s) => s.id !== trialA).map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="meta-form-actions">
              <button className="meta-cancel-btn" onClick={() => setShowNewTrial(false)}>
                Cancel
              </button>
              <button
                className="meta-submit-btn"
                disabled={creating || !trialA || !trialB || trialA === trialB}
                onClick={handleCreateTrial}
              >
                {creating ? 'Starting...' : 'Start Trial'}
              </button>
            </div>
          </div>
        )}

        <div className="meta-trials-list">
          {trials.map((t) => {
            const result = trialResultLabel(t);
            return (
              <div key={t.id} className="meta-trial-card">
                <div className="meta-trial-header">
                  <span className="meta-trial-matchup">
                    <span className="meta-trial-a">{getStratName(t.strategy_a_id)}</span>
                    <span className="meta-trial-vs">vs</span>
                    <span className="meta-trial-b">{getStratName(t.strategy_b_id)}</span>
                  </span>
                  <span className={`meta-badge ${t.status}`}>{t.status}</span>
                </div>
                <div className="meta-trial-meta">
                  <span>Started {new Date(t.started_at).toLocaleDateString()}</span>
                  {t.ended_at && <span>Ended {new Date(t.ended_at).toLocaleDateString()}</span>}
                </div>
                {result && (
                  <div className="meta-trial-result">
                    <span className="meta-trial-result-label">Result:</span> {result}
                  </div>
                )}
              </div>
            );
          })}
          {trials.length === 0 && (
            <div className="meta-empty">
              <div>No trials have been run yet.</div>
              <div style={{ fontSize: 12 }}>
                {strategies.length < 2
                  ? 'Create at least two strategies to run a comparison.'
                  : 'Click "New Trial" to compare two strategies.'}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
