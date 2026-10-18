import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import AppShell from './AppShell'
import './styles/tokens.css'
import './styles/shell.css'

createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <AppShell />
  </BrowserRouter>,
)
