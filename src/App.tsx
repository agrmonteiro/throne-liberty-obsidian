import React, { useState, useEffect } from 'react'
import { Sidebar } from './components/Sidebar'
import { Dashboard }   from './pages/Dashboard'
import { Calculator }  from './pages/Calculator'
import { Comparator }  from './pages/Comparator'
import { Sensitivity } from './pages/Sensitivity'
import { Builds }      from './pages/Builds'
import { LogReader }    from './pages/LogReader'
import { Rotation }     from './pages/Rotation'
import { Settings }     from './pages/Settings'
import { PullRanking }  from './pages/PullRanking'
import { SkillsDB }     from './pages/SkillsDB'
import { MasteryTrees } from './pages/MasteryTrees'
import { useBuilds }       from './store/useBuilds'
import { useSettings }     from './store/useSettings'
import { UpdateNotifier }    from './components/UpdateNotifier'
import { MigrationNotifier } from './components/MigrationNotifier'
import { useAutoScale }      from './hooks/useAutoScale'
import { useT }              from './i18n/useT'

type Page = 'dashboard' | 'calculator' | 'comparator' | 'sensitivity' | 'builds' | 'logreader' | 'rotation' | 'settings' | 'pullranking' | 'skillsdb' | 'masterytrees'

export default function App(): React.ReactElement {
  const [page, setPage]                     = useState<Page>('dashboard')
  const [splitLogReader, setSplitLogReader] = useState(false)
  const [scraperMissing, setScraperMissing] = useState(false)
  const { loadFromDisk }                    = useBuilds()

  useEffect(() => {
    if (page !== 'logreader') setSplitLogReader(false)
  }, [page])

  useEffect(() => { loadFromDisk() }, [])

  // Selecionar conteúdo ao focar + aceitar vírgula como decimal
  useEffect(() => {
    function onFocus(e: FocusEvent) {
      const el = e.target as HTMLInputElement
      if (el.tagName === 'INPUT' && el.type !== 'checkbox' && el.type !== 'radio' && el.type !== 'number') {
        setTimeout(() => el.select(), 0)
      }
    }
    function onKeyDown(e: KeyboardEvent) {
      const el = e.target as HTMLInputElement
      if (el.tagName !== 'INPUT') return
      if (e.key === ',') {
        e.preventDefault()
        document.execCommand('insertText', false, '.')
      }
    }
    document.addEventListener('focus', onFocus, true)
    document.addEventListener('keydown', onKeyDown, true)
    return () => {
      document.removeEventListener('focus', onFocus, true)
      document.removeEventListener('keydown', onKeyDown, true)
    }
  }, [])

  // Check scraper on first load
  useEffect(() => {
    window.dataAPI.scraperDetect().then((result: any) => {
      if (!result?.scraperFound || !result?.pythonOk) setScraperMissing(true)
    }).catch(() => {})
  }, [])

  const PageComponent = {
    dashboard:   Dashboard,
    calculator:  Calculator,
    comparator:  Comparator,
    sensitivity: Sensitivity,
    builds:      Builds,
    logreader:    LogReader,
    rotation:     Rotation,
    settings:     Settings,
    pullranking:  PullRanking,
    skillsdb:     SkillsDB,
    masterytrees: MasteryTrees,
  }[page]

  const t = useT()
  const settings = useSettings()
  const theme = settings?.theme || 'dark'

  // Auto-scale + font-size override para Full HD → 4K (gerenciado inteiramente pelo hook)
  useAutoScale()

  // Apply theme class to body/html
  useEffect(() => {
    // Only apply light theme class if selected; root is dark by default
    document.body.className = theme === 'light' ? 'theme-light' : ''
  }, [theme])

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
      <main style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <UpdateNotifier />
        <MigrationNotifier />
        {/* Banner de setup do scraper */}
        {scraperMissing && page !== 'settings' && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '1rem',
            padding: '0.6rem 1.25rem', background: 'rgba(212,175,55,0.1)',
            borderBottom: '1px solid rgba(212,175,55,0.25)', flexShrink: 0
          }}>
            <span style={{ fontSize: '0.82rem', color: '#f0cc55' }}>
              {t('settings.scraper.bannerMessage')}
            </span>
            <button
              onClick={() => { setPage('settings'); setScraperMissing(false) }}
              style={{
                padding: '0.3rem 0.9rem', borderRadius: 5, border: '1px solid var(--gold)',
                background: 'rgba(212,175,55,0.15)', color: 'var(--gold)',
                cursor: 'pointer', fontSize: '0.78rem', fontWeight: 700, whiteSpace: 'nowrap'
              }}
            >
              {t('settings.scraper.bannerConfigure')}
            </button>
            <button
              onClick={() => setScraperMissing(false)}
              style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1rem' }}
            >×</button>
          </div>
        )}
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: page === 'logreader' && splitLogReader ? 'row' : 'column' }}>
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
        </div>
      </main>
    </div>
  )
}
