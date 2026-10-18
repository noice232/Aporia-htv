import {
  Briefcase, TrendingUp, Zap, ArrowRight, Lock
} from 'lucide-react';
import '../styles/portfolio.css';

/* ── mock data ── */
const BUDGET = {
  total: 240,
  spent: 156,
  remaining: 84,
  unit: 'GPU-hours',
};

interface PortfolioItem {
  rank: number;
  title: string;
  status: 'active' | 'planned' | 'completed' | 'blocked';
  allocation: number;
  impact: 'high' | 'medium' | 'low';
  impactScore: string;
  unlocks: string[];
}

const ITEMS: PortfolioItem[] = [
  {
    rank: 1,
    title: '3DGS Opacity Scheduling Overhaul',
    status: 'active',
    allocation: 22,
    impact: 'high',
    impactScore: '+1.4 dB',
    unlocks: ['Faster convergence', 'Reduced Gaussian count'],
  },
  {
    rank: 2,
    title: 'Mip-NeRF 360 Full Benchmark Suite',
    status: 'active',
    allocation: 18,
    impact: 'high',
    impactScore: 'Baseline',
    unlocks: ['Court evidence', 'Publication metrics'],
  },
  {
    rank: 3,
    title: 'Hybrid NeRF↔3DGS Distillation Pipeline',
    status: 'active',
    allocation: 15,
    impact: 'high',
    impactScore: '+2.1 dB',
    unlocks: ['Real-time rendering', 'Quality preservation'],
  },
  {
    rank: 4,
    title: 'Adaptive Density Control Threshold Sweep',
    status: 'planned',
    allocation: 12,
    impact: 'medium',
    impactScore: '-30% count',
    unlocks: ['Memory reduction'],
  },
  {
    rank: 5,
    title: 'Depth-Aware Floater Pruning v2',
    status: 'blocked',
    allocation: 10,
    impact: 'medium',
    impactScore: '-15% artifacts',
    unlocks: ['Cleaner geometry'],
  },
  {
    rank: 6,
    title: 'Specular Surface NeRF Extension',
    status: 'planned',
    allocation: 8,
    impact: 'medium',
    impactScore: '+0.8 dB',
    unlocks: ['Metal/glass rendering'],
  },
  {
    rank: 7,
    title: 'Camera Pose Refinement Stabilization',
    status: 'completed',
    allocation: 9,
    impact: 'low',
    impactScore: 'Done',
    unlocks: [],
  },
  {
    rank: 8,
    title: 'SH Degree Schedule Optimization',
    status: 'completed',
    allocation: 6,
    impact: 'low',
    impactScore: 'Done',
    unlocks: [],
  },
];

const PROJECTIONS = [
  { value: '31.2 dB', label: 'Projected PSNR', desc: 'Average across 9 scenes at convergence' },
  { value: '142 FPS', label: 'Render Speed', desc: 'Real-time at 1080p on RTX 4090' },
  { value: '1.8M', label: 'Gaussian Budget', desc: 'Target count per scene (down from 2.6M)' },
];

interface Unlock {
  source: string;
  targets: string[];
}

const UNLOCKS: Unlock[] = [
  { source: 'Opacity Scheduling', targets: ['Faster Convergence', 'Density Control', 'Memory Budget'] },
  { source: 'Full Benchmark', targets: ['Court Evidence', 'Publication', 'Comparison Baselines'] },
  { source: 'NeRF↔3DGS Distill', targets: ['Real-Time Demo', 'Quality Preservation', 'Deployment'] },
  { source: 'Depth-Aware Pruning', targets: ['Clean Geometry', 'Downstream 3D Tasks'] },
];

/* ── component ── */
export default function Portfolio() {
  const spentPct = (BUDGET.spent / BUDGET.total) * 100;

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
            <div className="pf-budget-title">Compute Budget</div>
            <div className="pf-budget-amount">{BUDGET.total} {BUDGET.unit}</div>
          </div>
          <div className="pf-budget-stats">
            <div className="pf-budget-stat">
              <span className="pf-budget-stat-value spent">{BUDGET.spent}</span>
              <span className="pf-budget-stat-label">Spent</span>
            </div>
            <div className="pf-budget-stat">
              <span className="pf-budget-stat-value remaining">{BUDGET.remaining}</span>
              <span className="pf-budget-stat-label">Remaining</span>
            </div>
          </div>
        </div>
        <div className="pf-budget-bar">
          <div className="pf-budget-bar-spent" style={{ width: `${spentPct}%` }} />
          <div className="pf-budget-bar-remaining" />
        </div>
        <div className="pf-budget-legend">
          <span><span className="pf-budget-legend-dot spent" /> Spent ({spentPct.toFixed(0)}%)</span>
          <span><span className="pf-budget-legend-dot remaining" /> Remaining ({(100 - spentPct).toFixed(0)}%)</span>
        </div>
      </div>

      <div className="pf-table-wrap">
        <div className="pf-table-header">
          <h2>
            <Briefcase size={14} style={{ display: 'inline', verticalAlign: '-2px', marginRight: 6 }} />
            Research Initiatives
          </h2>
          <span>{ITEMS.length} items · {ITEMS.filter(i => i.status === 'active').length} active</span>
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
            {ITEMS.map(item => (
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

      <div className="pf-section-title">
        <TrendingUp size={13} style={{ display: 'inline', verticalAlign: '-2px', marginRight: 4 }} />
        Impact Projections
      </div>
      <div className="pf-projections">
        {PROJECTIONS.map(p => (
          <div className="pf-projection-card" key={p.label}>
            <div className="pf-projection-value">{p.value}</div>
            <div className="pf-projection-label">{p.label}</div>
            <div className="pf-projection-desc">{p.desc}</div>
          </div>
        ))}
      </div>

      <div className="pf-section-title">
        <Zap size={13} style={{ display: 'inline', verticalAlign: '-2px', marginRight: 4 }} />
        Downstream Unlock Graph
      </div>
      <div className="pf-unlocks">
        {UNLOCKS.map(u => (
          <div className="pf-unlock-row" key={u.source}>
            <span className="pf-unlock-source">{u.source}</span>
            <ArrowRight size={14} className="pf-unlock-arrow" />
            <div className="pf-unlock-targets">
              {u.targets.map(t => (
                <span className="pf-unlock-target" key={t}>{t}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
