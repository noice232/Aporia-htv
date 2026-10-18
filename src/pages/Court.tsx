import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Scale, FileText, AlertTriangle, CheckCircle2,
  ChevronDown, Eye, FlaskConical,
  Gavel, Shield
} from 'lucide-react';
import { useProjectStore } from '../stores/projects';
import '../styles/court.css';

const BASE = import.meta.env.VITE_API_BASE_URL || '';

interface Dispute {
  id: string;
  title: string;
  status: 'active' | 'resolved' | 'escalated';
  date: string;
  claimant: string;
  respondent: string;
  claim: string;
  evidenceCount: number;
}

interface Test {
  name: string;
  hypothesis: string;
  metric: string;
  cost: string;
  resolves: string;
}

const PROTOCOL_STEPS = [
  'Claimant files dispute with quantitative claim and supporting evidence.',
  'Respondent submits counter-evidence within 48 hours.',
  'Discriminating test is proposed by neutral agent or PI.',
  'Test executed in isolated environment; results logged immutably.',
  'Ruling issued. If unresolved, escalation to PI with veto power.',
];

export default function Court() {
  const { projectId: paramId } = useParams();
  const storeId = useProjectStore((s) => s.currentId);
  const projectId = paramId || storeId;

  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showResolved, setShowResolved] = useState(false);

  useEffect(() => {
    if (!projectId) { setLoading(false); return; }

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [courtRes, disputesRes, claimsRes] = await Promise.all([
          fetch(`${BASE}/api/v1/projects/${projectId}/court`),
          fetch(`${BASE}/api/v1/projects/${projectId}/disputes`),
          fetch(`${BASE}/api/v1/projects/${projectId}/claims`),
        ]);
        const courtData = courtRes.ok ? await courtRes.json() : [];
        const disputesData = disputesRes.ok ? await disputesRes.json() : [];
        const claimsData = claimsRes.ok ? await claimsRes.json() : [];

        const claimMap = new Map<string, any>();
        for (const c of claimsData) claimMap.set(c.id, c);

        const mapped: Dispute[] = [
          ...courtData.map((d: any) => ({
            id: d.id,
            title: d.notes || `Disagreement ${d.id.slice(0, 8)}`,
            status: d.status || 'active',
            date: d.created_at?.slice(0, 10) || '',
            claimant: d.claim_ids?.[0] ? (claimMap.get(d.claim_ids[0])?.claim_type || 'Claimant') : 'Claimant',
            respondent: d.claim_ids?.[1] ? (claimMap.get(d.claim_ids[1])?.claim_type || 'Respondent') : 'Respondent',
            claim: d.claim_ids?.map((cid: string) => claimMap.get(cid)?.text).filter(Boolean).join(' vs. ') || 'No claims',
            evidenceCount: d.claim_ids?.reduce((sum: number, cid: string) => sum + (claimMap.get(cid)?.evidence?.length || 0), 0) || 0,
          })),
          ...disputesData.map((d: any) => ({
            id: d.id,
            title: d.resolution || `Dispute ${d.id.slice(0, 8)}`,
            status: d.status || 'active',
            date: d.created_at?.slice(0, 10) || '',
            claimant: claimMap.get(d.claim_a_id)?.text?.slice(0, 60) || 'Claim A',
            respondent: claimMap.get(d.claim_b_id)?.text?.slice(0, 60) || 'Claim B',
            claim: [claimMap.get(d.claim_a_id)?.text, claimMap.get(d.claim_b_id)?.text].filter(Boolean).join(' vs. ') || 'Dispute',
            evidenceCount: (claimMap.get(d.claim_a_id)?.evidence?.length || 0) + (claimMap.get(d.claim_b_id)?.evidence?.length || 0),
          })),
        ];

        setDisputes(mapped);

        const testItems: Test[] = courtData
          .filter((d: any) => d.discriminating_experiment_json)
          .map((d: any) => {
            const exp = typeof d.discriminating_experiment_json === 'string'
              ? JSON.parse(d.discriminating_experiment_json)
              : d.discriminating_experiment_json;
            return {
              name: exp.name || 'Test',
              hypothesis: exp.hypothesis || '',
              metric: exp.metric || '',
              cost: exp.cost || '',
              resolves: d.id.slice(0, 8),
            };
          });
        setTests(testItems);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load court data');
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
      <div className="court-page">
        <div className="court-header">
          <div className="court-label">Deliberation</div>
          <h1>Adversarial Court</h1>
          <div className="court-subtitle">Select a project to view disputes</div>
        </div>
      </div>
    );
  }

  const activeDisputes = disputes.filter(d => d.status === 'active' || d.status === 'escalated');
  const resolvedDisputes = disputes.filter(d => d.status === 'resolved');
  const escalatedCount = disputes.filter(d => d.status === 'escalated').length;

  const STATS = [
    { label: 'Active', value: activeDisputes.length, icon: Scale, cls: 'active' },
    { label: 'Resolved', value: resolvedDisputes.length, cls: 'resolved', icon: CheckCircle2 },
    { label: 'Evidence Items', value: disputes.reduce((s, d) => s + d.evidenceCount, 0), cls: 'evidence', icon: FileText },
    { label: 'Escalated', value: escalatedCount, cls: 'escalated', icon: AlertTriangle },
  ];

  return (
    <div className="court-page">
      <div className="court-header">
        <div className="court-label">Deliberation</div>
        <h1>Adversarial Court</h1>
        <div className="court-subtitle">
          Structured dispute resolution · claim → evidence → discriminating test → ruling
        </div>
      </div>

      <div className="court-stats">
        {STATS.map(s => {
          const Icon = s.icon;
          return (
            <div className="court-stat" key={s.label}>
              <div className={`court-stat-icon ${s.cls}`}>
                <Icon size={18} />
              </div>
              <div className="court-stat-info">
                <span className="court-stat-value">{s.value}</span>
                <span className="court-stat-label">{s.label}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="court-body">
        <div>
          <div className="court-section-title">
            Active Disputes <span className="count">{activeDisputes.length}</span>
          </div>

          <div className="court-disputes">
            {activeDisputes.map(d => (
              <DisputeCard key={d.id} dispute={d} />
            ))}
            {activeDisputes.length === 0 && (
              <div style={{ padding: 20, color: 'var(--fg-dim)', fontSize: 13 }}>No active disputes</div>
            )}
          </div>

          <button
            className="court-resolved-toggle"
            onClick={() => setShowResolved(v => !v)}
          >
            <ChevronDown size={14} className={`chevron ${showResolved ? 'open' : ''}`} />
            Resolved Disputes ({resolvedDisputes.length})
          </button>

          {showResolved && (
            <div className="court-resolved">
              {resolvedDisputes.map(d => (
                <DisputeCard key={d.id} dispute={d} />
              ))}
            </div>
          )}
        </div>

        <div className="court-sidebar">
          <div className="tests-panel">
            <div className="tests-panel-title">
              <FlaskConical size={12} style={{ display: 'inline', verticalAlign: '-2px', marginRight: 4 }} />
              Discriminating Tests
            </div>
            {tests.length === 0 && (
              <div style={{ padding: 12, color: 'var(--fg-dim)', fontSize: 12 }}>No tests proposed yet</div>
            )}
            {tests.map(t => (
              <div className="test-item" key={t.name}>
                <div className="test-name">{t.name}</div>
                <div className="test-hypothesis">{t.hypothesis}</div>
                <div className="test-meta">
                  <span className="test-meta-item metric">{t.metric}</span>
                  <span className="test-meta-item">{t.cost}</span>
                  <span className="test-meta-item">{t.resolves}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="protocol-panel">
            <div className="protocol-panel-title">
              <Gavel size={12} style={{ display: 'inline', verticalAlign: '-2px', marginRight: 4 }} />
              Resolution Protocol
            </div>
            {PROTOCOL_STEPS.map((step, i) => (
              <div className="protocol-step" key={i}>
                <span className="protocol-num">{i + 1}</span>
                <span className="protocol-text">{step}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function DisputeCard({ dispute: d }: { dispute: Dispute }) {
  return (
    <div className="dispute-card">
      <div className="dispute-card-top">
        <span className={`dispute-status ${d.status}`}>{d.status}</span>
        <span className="dispute-date">{d.date}</span>
      </div>
      <div className="dispute-title">{d.title}</div>
      <div className="dispute-parties">
        <span>{d.claimant}</span>
        <span className="dispute-vs">VS</span>
        <span>{d.respondent}</span>
      </div>
      <div className="dispute-claim">{d.claim}</div>
      <div className="dispute-footer">
        <span className="dispute-evidence-badge">
          <Eye size={12} /> {d.evidenceCount} evidence items
        </span>
        {d.status === 'active' && (
          <button className="dispute-propose-btn">Propose Test</button>
        )}
        {d.status === 'escalated' && (
          <span className="dispute-evidence-badge" style={{ color: 'var(--accent-red)', background: 'rgba(239,83,80,0.08)' }}>
            <Shield size={12} /> PI Review Required
          </span>
        )}
      </div>
    </div>
  );
}
