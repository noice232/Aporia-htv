import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Target, ShieldCheck, Clock, BarChart3,
  ArrowUpRight, ArrowDownRight, Minus
} from 'lucide-react';
import { useProjectStore } from '../stores/projects';
import '../styles/researcher-profile.css';

const BASE = import.meta.env.VITE_API_BASE_URL || '';

interface ResearcherData {
  id: string;
  display_name: string;
  email: string;
  bio: string | null;
  expertise_json: string | null;
  created_at: string;
}

interface PriorityData {
  text: string;
  weight: number;
}

interface PrincipleData {
  id: string;
  text: string;
  approved: boolean;
}

interface InterventionData {
  action: string;
  date: string;
  impact: 'positive' | 'negative' | 'neutral';
  impactLabel: string;
  context: string;
  color: string;
}

function getInitials(name: string): string {
  return name.split(' ').map(w => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();
}

export default function ResearcherProfile() {
  const { researcherId } = useParams();
  const currentId = useProjectStore((s) => s.currentId);

  const [researcher, setResearcher] = useState<ResearcherData | null>(null);
  const [priorities, setPriorities] = useState<PriorityData[]>([]);
  const [rules, setRules] = useState<PrincipleData[]>([]);
  const [interventions, setInterventions] = useState<InterventionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!researcherId) { setLoading(false); return; }

    let cancelled = false;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const res = await fetch(`${BASE}/api/v1/researchers/${researcherId}`);
        if (!res.ok) throw new Error(`Failed to load researcher (${res.status})`);
        const data: ResearcherData = await res.json();
        if (!cancelled) setResearcher(data);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load researcher');
      }

      if (currentId) {
        try {
          const profileRes = await fetch(`${BASE}/api/v1/projects/${currentId}/profile`);
          if (profileRes.ok) {
            const profile = await profileRes.json();
            if (!cancelled && profile.scoring_weights) {
              const entries = Object.entries(profile.scoring_weights as Record<string, number>);
              const maxW = Math.max(...entries.map(([, v]) => v), 1);
              setPriorities(entries.map(([text, weight]) => ({ text, weight: weight / maxW })));
            }
          }
        } catch { /* non-critical */ }

        try {
          const principlesRes = await fetch(`${BASE}/api/v1/projects/${currentId}/principles`);
          if (principlesRes.ok) {
            const principles: PrincipleData[] = await principlesRes.json();
            if (!cancelled) setRules(principles);
          }
        } catch { /* non-critical */ }

        try {
          const eventsRes = await fetch(`${BASE}/api/v1/projects/${currentId}/events?after=0&limit=50`);
          if (eventsRes.ok) {
            const page = await eventsRes.json();
            const events = page.items ?? page.events ?? [];
            const mapped: InterventionData[] = events
              .filter((e: { type?: string }) => e.type === 'intervention' || e.type === 'judgment' || e.type === 'policy_change')
              .slice(0, 10)
              .map((e: { description?: string; created_at?: string; type?: string }, i: number) => {
                const colors = ['var(--accent-mint)', 'var(--accent-cyan)', 'var(--accent-lavender)', 'var(--accent-amber)', 'var(--accent-fuchsia)'];
                return {
                  action: e.description ?? 'Research event',
                  date: e.created_at ? new Date(e.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '',
                  impact: 'neutral' as const,
                  impactLabel: e.type ?? '',
                  context: e.type ?? '',
                  color: colors[i % colors.length],
                };
              });
            if (!cancelled && mapped.length > 0) setInterventions(mapped);
          }
        } catch { /* non-critical */ }
      }

      if (!cancelled) setLoading(false);
    })();

    return () => { cancelled = true; };
  }, [researcherId, currentId]);

  if (!researcherId) {
    return (
      <div className="rp-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--fg-dim)', fontSize: 13 }}>Select a researcher to view their profile</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="rp-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--fg-dim)', fontSize: 13 }}>Loading profile...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rp-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--accent-red)', fontSize: 13 }}>{error}</p>
      </div>
    );
  }

  const name = researcher?.display_name ?? researcherId;
  const initials = getInitials(name);
  const expertise: string[] = researcher?.expertise_json ? (() => { try { return JSON.parse(researcher.expertise_json); } catch { return []; } })() : [];
  const bio = researcher?.bio ?? '';

  const maxWeight = Math.max(...priorities.map(p => p.weight), 1);

  const STYLE_METRICS = [
    { label: 'Intervention Freq', value: 72, color: 'var(--accent-fuchsia)' },
    { label: 'Evidence Reliance', value: 91, color: 'var(--accent-mint)' },
    { label: 'Risk Tolerance', value: 58, color: 'var(--accent-amber)' },
    { label: 'Agent Autonomy', value: 65, color: 'var(--accent-cyan)' },
    { label: 'Dispute Resolution', value: 84, color: 'var(--accent-lavender)' },
    { label: 'Exploration Bias', value: 47, color: 'var(--accent-icy)' },
  ];

  return (
    <div className="rp-page">
      <div className="rp-header">
        <div className="rp-label">Researcher</div>
        <h1>Investigator Profile</h1>
        <div className="rp-subtitle">
          Viewing <code>{researcherId}</code>
        </div>
      </div>

      <div className="rp-identity">
        <div className="rp-avatar">{initials}</div>
        <div className="rp-identity-info">
          <div className="rp-name">{name}</div>
          <div className="rp-role">{bio || 'Researcher'}</div>
          <div className="rp-affiliation">{researcher?.email ?? ''}</div>
          <div className="rp-tags">
            {expertise.map((t: string) => (
              <span className="rp-tag" key={t}>{t}</span>
            ))}
          </div>
        </div>
        <div className="rp-identity-stats">
          <div className="rp-identity-stat">
            <span className="rp-identity-stat-value">{rules.length}</span>
            <span className="rp-identity-stat-label">Principles</span>
          </div>
          <div className="rp-identity-stat">
            <span className="rp-identity-stat-value">{interventions.length}</span>
            <span className="rp-identity-stat-label">Interventions</span>
          </div>
        </div>
      </div>

      <div className="rp-grid">
        <div>
          <div className="rp-section-title">
            <Target size={13} style={{ display: 'inline', verticalAlign: '-2px', marginRight: 4 }} />
            Research Priorities
          </div>
          <div className="rp-priorities">
            {priorities.length === 0 && (
              <p style={{ color: 'var(--fg-dim)', fontSize: 13 }}>No priorities set yet</p>
            )}
            {priorities.map((p, i) => (
              <div className="priority-item" key={i}>
                <div className="priority-top">
                  <span className="priority-text">{p.text}</span>
                  <span className="priority-weight">{(p.weight * 100).toFixed(0)}%</span>
                </div>
                <div className="priority-bar">
                  <div
                    className="priority-bar-fill"
                    style={{ width: `${(p.weight / maxWeight) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="rp-section-title">
            <ShieldCheck size={13} style={{ display: 'inline', verticalAlign: '-2px', marginRight: 4 }} />
            Governance Rules
          </div>
          <div className="rp-rules">
            {rules.length === 0 && (
              <p style={{ color: 'var(--fg-dim)', fontSize: 13 }}>No governance rules defined</p>
            )}
            {rules.map((r) => (
              <div className="rule-item" key={r.id}>
                <span className={`rule-status ${r.approved ? 'approved' : 'pending'}`}>
                  {r.approved ? 'approved' : 'pending'}
                </span>
                <span className="rule-text">{r.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rp-section-title">
        <Clock size={13} style={{ display: 'inline', verticalAlign: '-2px', marginRight: 4 }} />
        Intervention History
      </div>
      <div className="rp-timeline">
        {interventions.length === 0 && (
          <p style={{ color: 'var(--fg-dim)', fontSize: 13 }}>No interventions recorded</p>
        )}
        {interventions.map((iv, i) => (
          <div className="intervention-item" key={i}>
            <div className="intervention-marker">
              <div className="intervention-dot" style={{ background: iv.color }} />
              {i < interventions.length - 1 && <div className="intervention-line" />}
            </div>
            <div className="intervention-content">
              <div className="intervention-action">{iv.action}</div>
              <div className="intervention-meta">
                <span>{iv.date}</span>
                <span>{iv.context}</span>
                <span className={`intervention-impact ${iv.impact}`}>
                  {iv.impact === 'positive' && <ArrowUpRight size={10} style={{ display: 'inline', verticalAlign: '-1px' }} />}
                  {iv.impact === 'negative' && <ArrowDownRight size={10} style={{ display: 'inline', verticalAlign: '-1px' }} />}
                  {iv.impact === 'neutral' && <Minus size={10} style={{ display: 'inline', verticalAlign: '-1px' }} />}
                  {' '}{iv.impactLabel}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="rp-section-title">
        <BarChart3 size={13} style={{ display: 'inline', verticalAlign: '-2px', marginRight: 4 }} />
        Research Style Metrics
      </div>
      <div className="rp-metrics">
        {STYLE_METRICS.map(m => (
          <div className="metric-item" key={m.label}>
            <span className="metric-label">{m.label}</span>
            <div className="metric-bar">
              <div className="metric-bar-fill" style={{ width: `${m.value}%`, background: m.color }} />
            </div>
            <span className="metric-value">{m.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
