import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProjectStore } from '../stores/projects';
import '../styles/home.css';

const BASE = import.meta.env.VITE_API_BASE_URL || '';

export default function JoinProject() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const addProject = useProjectStore((s) => s.addProject);
  const setCurrent = useProjectStore((s) => s.setCurrent);
  const [status, setStatus] = useState<'joining' | 'success' | 'error'>('joining');
  const [errorMsg, setErrorMsg] = useState('');
  const attempted = useRef(false);

  useEffect(() => {
    if (!projectId || attempted.current) return;
    attempted.current = true;

    (async () => {
      try {
        const res = await fetch(`${BASE}/api/v1/projects/${projectId}/join`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        });

        if (res.ok) {
          const project = await res.json();
          if (project?.id) {
            addProject(project);
            setCurrent(project.id);
          } else {
            setCurrent(projectId);
          }
          setStatus('success');
          setTimeout(() => navigate(`/projects/${projectId}/lab`), 800);
        } else if (res.status === 409) {
          setCurrent(projectId);
          setStatus('success');
          setTimeout(() => navigate(`/projects/${projectId}/lab`), 400);
        } else {
          throw new Error(`Server returned ${res.status}`);
        }
      } catch (err) {
        setErrorMsg(err instanceof Error ? err.message : 'Failed to join');
        setStatus('error');
      }
    })();
  }, [projectId, navigate, addProject, setCurrent]);

  return (
    <div className="home-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
      {status === 'joining' && (
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', color: 'var(--accent-cyan)', textTransform: 'uppercase', marginBottom: 12 }}>
            Joining Project
          </div>
          <p style={{ color: 'var(--fg-muted)', fontSize: 14 }}>Connecting you to the research team...</p>
        </div>
      )}
      {status === 'success' && (
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', color: 'var(--accent-green)', textTransform: 'uppercase', marginBottom: 12 }}>
            Joined
          </div>
          <p style={{ color: 'var(--fg-muted)', fontSize: 14 }}>Redirecting to the research lab...</p>
        </div>
      )}
      {status === 'error' && (
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', color: 'var(--accent-red)', textTransform: 'uppercase', marginBottom: 12 }}>
            Could Not Join
          </div>
          <p style={{ color: 'var(--fg-muted)', fontSize: 14, marginBottom: 16 }}>{errorMsg}</p>
          <button
            className="home-submit"
            style={{ width: 'auto', padding: '8px 24px' }}
            onClick={() => navigate('/')}
          >
            Go Home
          </button>
        </div>
      )}
    </div>
  );
}
