import { useState, lazy, Suspense } from 'react'
<<<<<<< HEAD
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useSSE } from './hooks/useSSE'
=======
<<<<<<< HEAD
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useSSE } from './hooks/useSSE'
=======
import { Routes, Route, Navigate } from 'react-router-dom'
>>>>>>> 1885cb979ca2f151ae096480fa49370200518445
>>>>>>> a377f167c18d5544cd34a49a32bafb960e278948
import { AppHeader } from './components/shell/AppHeader'
import { SideRail } from './components/shell/SideRail'
import { Inspector } from './components/shell/Inspector'
import { TimelineDock } from './components/shell/TimelineDock'
import { ErrorBoundary } from './components/shared/ErrorBoundary'
import { LoadingState } from './components/shared/LoadingState'

const Landing = lazy(() => import('./pages/Landing'))
const Home = lazy(() => import('./pages/Home'))
const Frontier = lazy(() => import('./pages/Frontier'))
const Lab = lazy(() => import('./pages/Lab'))
const Agenda = lazy(() => import('./pages/Agenda'))
const Judgments = lazy(() => import('./pages/Judgments'))
const ForkExplorer = lazy(() => import('./pages/ForkExplorer'))
const Court = lazy(() => import('./pages/Court'))
const Team = lazy(() => import('./pages/Team'))
const ResearcherProfile = lazy(() => import('./pages/ResearcherProfile'))
const Portfolio = lazy(() => import('./pages/Portfolio'))
const Meta = lazy(() => import('./pages/Meta'))
const Library = lazy(() => import('./pages/Library'))
const SettingsPage = lazy(() => import('./pages/SettingsPage'))
const JoinProject = lazy(() => import('./pages/JoinProject'))

export default function AppShell() {
  const [railOpen, setRailOpen] = useState(false)
  const location = useLocation()
  const isLanding = location.pathname === '/'
  useSSE()

  return (
    <div className={`app-shell ${isLanding ? 'app-shell--landing' : ''}`}>
      {!isLanding && <AppHeader onMenuToggle={() => setRailOpen((o) => !o)} />}
      {!isLanding && <SideRail open={railOpen} onClose={() => setRailOpen(false)} />}

      <main className={isLanding ? 'main-canvas main-canvas--landing' : 'main-canvas'}>
        <ErrorBoundary>
          <Suspense fallback={<LoadingState />}>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/home" element={<Home />} />
              <Route path="/frontier" element={<Frontier />} />
              <Route path="/projects/:projectId/lab" element={<Lab />} />
              <Route path="/projects/:projectId/agenda" element={<Agenda />} />
              <Route path="/projects/:projectId/judgments" element={<Judgments />} />
              <Route path="/projects/:projectId/forks" element={<ForkExplorer />} />
              <Route path="/projects/:projectId/forks/:forkId" element={<ForkExplorer />} />
              <Route path="/projects/:projectId/court" element={<Court />} />
              <Route path="/team" element={<Team />} />
              <Route path="/researchers/:researcherId" element={<ResearcherProfile />} />
              <Route path="/portfolio" element={<Portfolio />} />
              <Route path="/meta" element={<Meta />} />
              <Route path="/library" element={<Library />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/join/:projectId" element={<JoinProject />} />

              {/* Legacy routes */}
              <Route path="/lab" element={<Navigate to="/" replace />} />
              <Route path="/agenda" element={<Navigate to="/" replace />} />
              <Route path="/judgments" element={<Navigate to="/" replace />} />
              <Route path="/forks" element={<Navigate to="/" replace />} />
              <Route path="/court" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </main>

      {!isLanding && <Inspector />}
      {!isLanding && <TimelineDock />}
    </div>
  )
}
