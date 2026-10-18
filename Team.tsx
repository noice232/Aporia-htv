import { useState, useEffect } from 'react';
import {
  Users, MessageSquare, Clock, FlaskConical, UserPlus, Copy, Check
} from 'lucide-react';
import { useProjectStore } from '../stores/projects';
import '../styles/team.css';

const BASE = import.meta.env.VITE_API_BASE_URL || '';

const GRADIENT_POOL = [
  'linear-gradient(135deg, var(--accent-fuchsia), var(--accent-lavender))',
  'linear-gradient(135deg, var(--accent-cyan), var(--accent-mint))',
  'linear-gradient(135deg, var(--accent-amber), var(--accent-fuchsia))',
  'linear-gradient(135deg, var(--accent-lavender), var(--accent-cyan))',
  'linear-gradient(135deg, var(--accent-mint), var(--accent-cyan))',
  'linear-gradient(135deg, var(--fg-dim), var(--fg-muted))',
];

interface Member {
  initials: string;
  name: string;
  role: string;
  spec: string;
  status: 'online' | 'away' | 'busy';
  contributions: number;
  gradient: string;
}

interface Session {
  name: string;
  topic: string;
  participants: { initials: string; gradient: string }[];
  status: 'live' | 'paused' | 'archived';
  started: string;
  messages: number;
}

interface Skill {
  name: string;
  proficiency: 'expert' | 'advanced' | 'intermediate';
  score: string;
}

interface Activity {
  actor: string;
  action: string;
  time: string;
  color: string;
}

function getInitials(name: string): string {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr ago`;
  return `${Math.floor(hrs / 24)} days ago`;
}

export default function Team() {
  const [members, setMembers] = useState<Member[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [activity, setActivity] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const currentId = useProjectStore((s) => s.currentId);

  const inviteUrl = currentId
    ? `${window.location.origin}/join/${currentId}`
    : '';

  function handleCopy() {
    if (!inviteUrl) return;
    navigator.clipboard.writeText(inviteUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [membersRes, sessionsRes, skillsRes, lessonsRes] = await Promise.all([
          fetch(`${BASE}/api/v1/workspaces/default/members`),
          fetch(`${BASE}/api/v1/workspaces/default/sessions`),
          fetch(`${BASE}/api/v1/skills`),
          fetch(`${BASE}/api/v1/workspaces/default/lessons`),
        ]);
        const membersData = membersRes.ok ? await membersRes.json() : [];
        const sessionsData = sessionsRes.ok ? await sessionsRes.json() : [];
        const skillsData = skillsRes.ok ? await skillsRes.json() : [];
        const lessonsData = lessonsRes.ok ? await lessonsRes.json() : [];

        const mappedMembers: Member[] = membersData.map((m: any, i: number) => ({
          initials: getInitials(m.user_id || m.id || `U${i}`),
          name: m.user_id || m.id || `Member ${i + 1}`,
          role: m.role || 'agent',
          spec: m.role || 'Research',
          status: 'online' as const,
          contributions: 0,
          gradient: GRADIENT_POOL[i % GRADIENT_POOL.length],
        }));

        const mappedSessions: Session[] = sessionsData.map((s: any, i: number) => ({
          name: s.visibility || `Session ${i + 1}`,
          topic: s.state || 'Research session',
          participants: (s.participants || []).map((p: any, j: number) => ({
            initials: getInitials(p.user_id || p.id || `P${j}`),
            gradient: GRADIENT_POOL[j % GRADIENT_POOL.length],
          })),
          status: s.state === 'active' ? 'live' as const : s.state === 'closed' ? 'archived' as const : 'paused' as const,
          started: timeAgo(s.started_at),
          messages: s.comment_count || 0,
        }));

        const mappedSkills: Skill[] = skillsData.slice(0, 8).map((s: any) => ({
          name: s.title,
          proficiency: s.confidence >= 0.9 ? 'expert' as const : s.confidence >= 0.7 ? 'advanced' as const : 'intermediate' as const,
          score: Math.round(s.confidence * 100).toString(),
        }));

        const mappedActivity: Activity[] = lessonsData.slice(0, 6).map((l: any, i: number) => ({
          actor: l.reviewer_id || 'System',
          action: l.statement?.slice(0, 100) || l.title,
          time: timeAgo(l.created_at),
          color: GRADIENT_POOL[i % GRADIENT_POOL.length].includes('cyan') ? 'var(--accent-cyan)' : 'var(--accent-lavender)',
        }));

        setMembers(mappedMembers);
        setSessions(mappedSessions);
        setSkills(mappedSkills);
        setActivity(mappedActivity);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load team data');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <div className="page-content" style={{display:'flex',alignItems:'center',justifyContent:'center'}}><p style={{color:'var(--fg-dim)'}}>Loading...</p></div>;
  if (error) return <div className="page-content" style={{display:'flex',alignItems:'center',justifyContent:'center'}}><p style={{color:'var(--accent-red)'}}>{error}</p></div>;

  return (
    <div className="team-page">
      <div className="team-header">
        <div className="team-label">Collaboration</div>
        <h1>Research Team</h1>
        <div className="team-subtitle">
          Autonomous agents and human researchers coordinating on research investigation
        </div>
      </div>

      <div className="team-invite">
        <div className="team-invite-left">
          <UserPlus size={18} />
          <div>
            <div className="team-invite-title">Invite Collaborators</div>
            <div className="team-invite-desc">
              {inviteUrl ? 'Share this link to add researchers to your project' : 'Create a project first to invite collaborators'}
            </div>
          </div>
        </div>
        {inviteUrl && (
          <div className="team-invite-row">
            <input
              readOnly
              value={inviteUrl}
              className="team-invite-input"
              onClick={(e) => (e.target as HTMLInputElement).select()}
            />
            <button className="team-invite-copy" onClick={handleCopy}>
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        )}
      </div>

      <div className="team-section-title">
        <Users size={13} /> Roster <span className="count">{members.length}</span>
      </div>
      <div className="team-roster">
        {members.map(m => (
          <div className="member-card" key={m.name}>
            <div className="member-avatar" style={{ background: m.gradient }}>
              <span style={{ position: 'relative' }}>
                {m.initials}
                <span className={`member-status-dot ${m.status}`} />
              </span>
            </div>
            <span className="member-name">{m.name}</span>
            <span className={`member-role ${m.role}`}>{m.role}</span>
            <span className="member-spec">{m.spec}</span>
            <span className="member-contributions">{m.contributions} contributions</span>
          </div>
        ))}
        {members.length === 0 && (
          <div style={{ padding: 20, color: 'var(--fg-dim)', fontSize: 13 }}>No team members yet</div>
        )}
      </div>

      <div className="team-section-title">
        <MessageSquare size={13} /> Active Sessions <span className="count">{sessions.filter(s => s.status === 'live').length}</span>
      </div>
      <div className="team-sessions">
        {sessions.map(s => (
          <div className="session-card" key={s.name}>
            <div className="session-info">
              <div className="session-name">{s.name}</div>
              <div className="session-meta">
                <span>{s.topic}</span>
                <span>·</span>
                <span>{s.started}</span>
                <span>·</span>
                <span>{s.messages} msgs</span>
              </div>
            </div>
            <div className="session-participants">
              {s.participants.map((p, i) => (
                <div className="session-avatar" key={i} style={{ background: p.gradient }}>
                  {p.initials}
                </div>
              ))}
            </div>
            <span className={`session-status ${s.status}`}>
              <span className="session-status-dot" />
              {s.status}
            </span>
          </div>
        ))}
        {sessions.length === 0 && (
          <div style={{ padding: 20, color: 'var(--fg-dim)', fontSize: 13 }}>No sessions yet</div>
        )}
      </div>

      {skills.length > 0 && (
        <>
          <div className="team-section-title">
            <FlaskConical size={13} /> Collective Skill Library
          </div>
          <div className="team-skills">
            <div className="skill-chips">
              {skills.map(s => (
                <div className="skill-chip" key={s.name}>
                  {s.name}
                  <span className={`skill-proficiency ${s.proficiency}`}>{s.score}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {activity.length > 0 && (
        <>
          <div className="team-section-title" style={{ marginTop: 24 }}>
            <Clock size={13} /> Recent Activity
          </div>
          <div className="team-activity">
            {activity.map((a, i) => (
              <div className="activity-item" key={i}>
                <div className="activity-dot" style={{ background: a.color }} />
                <div className="activity-content">
                  <div className="activity-text">
                    <strong>{a.actor}</strong> {a.action}
                  </div>
                  <div className="activity-time">{a.time}</div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
