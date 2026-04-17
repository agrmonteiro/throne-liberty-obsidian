import React, { useState, useEffect } from 'react'
import { Sidebar } from './components/Sidebar'
import { Dashboard }   from './pages/Dashboard'
import { Calculator }  from './pages/Calculator'
import { Comparator }  from './pages/Comparator'
import { Sensitivity } from './pages/Sensitivity'
import { Builds }      from './pages/Builds'
import { LogReader }   from './pages/LogReader'
import { Rotation }    from './pages/Rotation'
import { Settings }    from './pages/Settings'
import { useBuilds }   from './store/useBuilds'
import { useSettings } from './store/useSettings'

type Page = 'dashboard' | 'calculator' | 'comparator' | 'sensitivity' | 'builds' | 'logreader' | 'rotation' | 'settings'

export default function App(): React.ReactElement {
  const [page, setPage]         = useState<Page>('dashboard')
  const [splitLogReader, setSplitLogReader] = useState(false)
  const { loadFromDisk }        = useBuilds()

  useEffect(() => {
    if (page !== 'logreader') setSplitLogReader(false)
  }, [page])

  useEffect(() => { loadFromDisk() }, [])

  const PageComponent = {
    dashboard:   Dashboard,
    calculator:  Calculator,
    comparator:  Comparator,
    sensitivity: Sensitivity,
    builds:      Builds,
    logreader:   LogReader,
    rotation:    Rotation,
    settings:    Settings,
  }[page]

  const settings = useSettings()
  const theme = settings?.theme || 'dark'
  const fontSize = settings?.fontSize || 14

  // Apply theme class and base font size to body/html
  useEffect(() => {
    // Only apply light theme class if selected; root is dark by default
    document.body.className = theme === 'light' ? 'theme-light' : ''
    document.documentElement.style.setProperty('--base-font-size', `${fontSize}px`)
  }, [theme, fontSize])

  return (
    <div 
      style={{ 
        display: 'flex', height: '100vh', overflow: 'hidden', 
        background: 'var(--bg)', color: 'var(--text)'
      }}
    >
      {/* Faixa de arraste da janela — 32px no topo, cobre toda a largura.
          Os botões nativos (fechar/min/max) do titleBarOverlay ficam no canto direito
          e sobrepõem esta faixa nativamente; não há conflito. */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, height: 32,
        zIndex: 9999,
        // @ts-ignore — WebkitAppRegion não está nos tipos do React mas funciona no Electron
        WebkitAppRegion: 'drag',
      }} />

      <Sidebar active={page} onChange={setPage} />
      <main style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: page === 'logreader' && splitLogReader ? 'row' : 'column' }}>
        {page === 'logreader' ? (
          <>
            <div style={{ flex: 1, overflow: 'hidden', minWidth: 0 }}>
              <LogReader onToggleSplit={() => setSplitLogReader(v => !v)} isSplitView={splitLogReader} />
            </div>
            {splitLogReader && (
              <div style={{ flex: 1, overflow: 'hidden', minWidth: 0, borderLeft: '1px solid rgba(255,255,255,0.08)' }}>
                <LogReader />
              </div>
            )}
          </>
        ) : (
          <PageComponent />
        )}
      </main>
    </div>
  )
}
