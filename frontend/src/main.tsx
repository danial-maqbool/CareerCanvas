import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import PrintView from './PrintView'
import './styles.css'
import './profile.css'
import './resume.css'
import './editor.css'
import './templates.css'
import './versions.css'
import './analysis.css'
import './responsive-overrides.css'
import './editor-polish.css'
import './ui-remodel.css'
import './ui-remodel-detail.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {window.location.pathname.startsWith('/print/') ? (
      <PrintView id={window.location.pathname.split('/')[2]} />
    ) : (
      <App />
    )}
  </React.StrictMode>
)
