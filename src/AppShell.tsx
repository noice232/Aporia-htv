import { useState, lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AppHeader } from './components/shell/AppHeader'
import { SideRail } from './components/shell/SideRail'
import { Inspector } from './components/shell/Inspector'
import { TimelineDock } from './components/shell/TimelineDock'
import { ErrorBoundary } from './components/shared/ErrorBoundary'
import { LoadingState } from './components/shared/LoadingState'

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

export default function AppShell() {
  const [railOpen, setRailOpen] = useState(false)

  return (
    <div className="app-shell">
      <AppHeader onMenuToggle={() => setRailOpen((o) => !o)} />
      <SideRail open={railOpen} onClose={() => setRailOpen(false)} />

      <main className="main-canvas">
        <ErrorBoundary>
          <Suspense fallback={<LoadingState />}>
            <Routes>
              <Route path="/" element={<Home />} />
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

      <Inspector />
      <TimelineDock />
    </div>
  )
}
