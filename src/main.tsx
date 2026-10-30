import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { OverlayWindow } from './pages/OverlayWindow'
import { OverlayControls } from './pages/OverlayControls'
import { ErrorBoundary } from './components/ErrorBoundary'
import './styles/globals.css'

const overlay = new URLSearchParams(window.location.search).get('overlay')
if (overlay === 'total' || overlay === 'skills' || overlay === 'controls') {
  document.body.dataset.overlay = overlay
  document.documentElement.style.background = 'transparent'
}
ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <ErrorBoundary>
      {overlay === 'controls' ? <OverlayControls /> : overlay === 'total' || overlay === 'skills' ? <OverlayWindow panel={overlay} /> : <App />}
    </ErrorBoundary>
  </React.StrictMode>
)
