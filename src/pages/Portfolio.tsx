import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Briefcase, TrendingUp, Zap, ArrowRight, Lock
} from 'lucide-react';
import { useProjectStore } from '../stores/projects';
import '../styles/portfolio.css';

const BASE = import.meta.env.VITE_API_BASE_URL || '';

interface PortfolioItem {
  rank: number;
  title: string;
  status: 'active' | 'planned' | 'completed' | 'blocked';
  allocation: number;
  impact: 'high' | 'medium' | 'low';
  impactScore: string;
  unlocks: string[];
}

export default function Portfolio() {
  const { projectId: paramId } = useParams();
  const storeId = useProjectStore((s) => s.currentId);
  const projectId = paramId || storeId;

  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!projectId) { setLoading(false); return; }

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [strategiesRes, prioritiesRes] = await Promise.all([
          fetch(`${BASE}/api/v1/projects/${projectId}/strategies`),
          fetch(`${BASE}/api/v1/projects/${projectId}/priorities`),
        ]);
        const strategies = strategiesRes.ok ? await strategiesRes.json() : [];
        const priorities = prioritiesRes.ok ? await prioritiesRes.json() : [];

        const priorityMap = new Map<string, any>();
        for (const p of priorities) priorityMap.set(p.strategy_id || p.agenda_item_id, p);

        const mapped: PortfolioItem[] = strategies.map((s: any, i: number) => {
          const priority = priorityMap.get(s.id);
          return {
            rank: priority?.rank ?? i + 1,
            title: s.name,
            status: s.status === 'active' ? 'active' : s.status === 'retired' ? 'completed' : 'planned',
            allocation: priority ? Math.round(priority.score * 25) : Math.max(5, 25 - i * 3),
            impact: priority?.score >= 0.8 ? 'high' : priority?.score >= 0.5 ? 'medium' : 'low',
            impactScore: priority?.rationale?.slice(0, 20) || `v${s.version}`,
            unlocks: [],
          };
        });

        mapped.sort((a, b) => a.rank - b.rank);
        setItems(mapped);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load portfolio');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [projectId]);

  if (loading) return <div className="page-content" style={{display:'flex',alignItems:'center',justifyContent:'center'}}><p style={{color:'var(--fg-dim)'}}>Loading...</p></div>;
  if (error) return <div className="page-content" style={{display:'flex',alignItems:'center',justifyContent:'center'}}><p style={{color:'var(--accent-red)'}}>{error}</p></div>;

  if (!projectId) {
    return (
      <div className="pf-page">
        <div className="pf-header">
          <div className="pf-label">Strategy</div>
          <h1>Research Portfolio</h1>
          <div className="pf-subtitle">Select a project to view portfolio</div>
        </div>
      </div>
    );
  }

  const totalAlloc = items.reduce((s, i) => s + i.allocation, 0);
  const activeCount = items.filter(i => i.status === 'active').length;
  const completedCount = items.filter(i => i.status === 'completed').length;
  const spentPct = totalAlloc > 0 ? (completedCount / items.length) * 100 : 0;

  return (
    <div className="pf-page">
      <div className="pf-header">
        <div className="pf-label">Strategy</div>
        <h1>Research Portfolio</h1>
        <div className="pf-subtitle">
          Budget allocation, priority ranking, and impact projections for the current research program
        </div>
      </div>

      <div className="pf-budget">
        <div className="pf-budget-top">
          <div>
            <div className="pf-budget-title">Research Strategies</div>
            <div className="pf-budget-amount">{items.length} strategies</div>
          </div>
          <div className="pf-budget-stats">
            <div className="pf-budget-stat">
              <span className="pf-budget-stat-value spent">{activeCount}</span>
              <span className="pf-budget-stat-label">Active</span>
            </div>
            <div className="pf-budget-stat">
              <span className="pf-budget-stat-value remaining">{completedCount}</span>
              <span className="pf-budget-stat-label">Completed</span>
            </div>
          </div>
        </div>
        <div className="pf-budget-bar">
          <div className="pf-budget-bar-spent" style={{ width: `${spentPct}%` }} />
          <div className="pf-budget-bar-remaining" />
        </div>
        <div className="pf-budget-legend">
          <span><span className="pf-budget-legend-dot spent" /> Completed ({spentPct.toFixed(0)}%)</span>
          <span><span className="pf-budget-legend-dot remaining" /> Remaining ({(100 - spentPct).toFixed(0)}%)</span>
        </div>
      </div>

      <div className="pf-table-wrap">
        <div className="pf-table-header">
          <h2>
            <Briefcase size={14} style={{ display: 'inline', verticalAlign: '-2px', marginRight: 6 }} />
            Research Initiatives
          </h2>
          <span>{items.length} items · {activeCount} active</span>
        </div>
        <table className="pf-table">
          <thead>
            <tr>
              <th className="num">#</th>
              <th>Initiative</th>
              <th>Status</th>
              <th className="hide-mobile">Allocation</th>
              <th className="num hide-mobile">Impact</th>
              <th className="hide-mobile">Unlocks</th>
            </tr>
          </thead>
          <tbody>
            {items.map(item => (
              <tr key={item.rank}>
                <td className="num">
                  <span className={`pf-rank ${item.rank <= 3 ? `rank-${item.rank}` : ''}`}>
                    {item.rank}
                  </span>
                </td>
                <td>
                  <span className="pf-item-title">{item.title}</span>
                </td>
                <td>
                  <span className={`pf-status ${item.status}`}>{item.status}</span>
                </td>
                <td className="hide-mobile">
                  <span className="pf-alloc-bar">
                    <span className="pf-alloc-fill" style={{ width: `${(item.allocation / 25) * 100}%` }} />
                  </span>
                  <span className="pf-alloc-text">{item.allocation}%</span>
                </td>
                <td className="num hide-mobile">
                  <span className={`pf-impact ${item.impact}`}>{item.impactScore}</span>
                </td>
                <td className="hide-mobile">
                  {item.unlocks.map(u => (
                    <span className="pf-unlock-badge" key={u}>
                      <Lock size={9} /> {u}
                    </span>
                  ))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {items.length > 0 && (
        <>
          <div className="pf-section-title">
            <TrendingUp size={13} style={{ display: 'inline', verticalAlign: '-2px', marginRight: 4 }} />
            Strategy Overview
          </div>
          <div className="pf-projections">
            <div className="pf-projection-card">
              <div className="pf-projection-value">{items.length}</div>
              <div className="pf-projection-label">Total Strategies</div>
              <div className="pf-projection-desc">Across all research directions</div>
            </div>
            <div className="pf-projection-card">
              <div className="pf-projection-value">{activeCount}</div>
              <div className="pf-projection-label">Active</div>
              <div className="pf-projection-desc">Currently being explored</div>
            </div>
            <div className="pf-projection-card">
              <div className="pf-projection-value">{completedCount}</div>
              <div className="pf-projection-label">Completed</div>
              <div className="pf-projection-desc">Successfully retired</div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
