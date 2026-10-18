import { createRoot } from 'react-dom/client'
import App from './App'
import Poc from './Poc'
import ResearchDemo from './ResearchDemo'
import './styles.css'
import './poc.css'
import './demo.css'

const path = window.location.pathname
createRoot(document.getElementById('root')!).render(
  path === '/poc' ? <Poc /> : path === '/demo' ? <ResearchDemo /> : <App />,
)
