import React, { useState, useEffect } from 'react'
import { useT } from '../i18n/useT'
import { version } from '../../package.json'
import '../styles/sidebar.css'

type Page = 'dashboard' | 'calculator' | 'comparator' | 'sensitivity' | 'builds' | 'logreader' | 'rotation' | 'macro' | 'combatlab' | 'overlays' | 'settings' | 'pullranking' | 'skillsdb' | 'masterytrees'

type NavGroup = 'overview' | 'builds' | 'combat' | 'training' | 'library' | 'preferences'
interface NavItem {
  id:    Page
  icon:  string
  group: NavGroup
}

const WIP_PAGES: Set<Page> = new Set(['skillsdb', 'masterytrees', 'rotation', 'macro', 'overlays'])

const NAV: NavItem[] = [
  { id: 'dashboard',    icon: '⚡', group: 'overview'     },
  { id: 'builds',       icon: '📁', group: 'builds'       },
  { id: 'calculator',   icon: '⚔',  group: 'builds'       },
  { id: 'comparator',   icon: '🕷',  group: 'builds'       },
  { id: 'sensitivity',  icon: '📡', group: 'builds'       },
  { id: 'overlays',     icon: '◫',  group: 'combat'       },
  { id: 'logreader',    icon: '📄', group: 'combat'       },
  { id: 'pullranking',  icon: '🏆', group: 'combat'       },
  { id: 'rotation',     icon: '🔄', group: 'training'     },
  { id: 'combatlab',    icon: '🎯', group: 'training'     },
  { id: 'macro',        icon: '⌨',  group: 'training'     },
  { id: 'skillsdb',     icon: '📚', group: 'library'      },
  { id: 'masterytrees', icon: '🌿', group: 'library'      },
  { id: 'settings',     icon: '⚙',  group: 'preferences'  },
]

const NAV_KEYS: Record<Page, string> = {
  dashboard:    'sidebar.nav.dashboard',
  builds:       'sidebar.nav.builds',
  calculator:   'sidebar.nav.calculator',
  comparator:   'sidebar.nav.comparator',
  sensitivity:  'sidebar.nav.sensitivity',
  rotation:     'sidebar.nav.rotation',
  combatlab:    'sidebar.nav.combatlab',
  overlays:     'sidebar.nav.overlays',
  macro:        'sidebar.nav.macro',
  logreader:    'sidebar.nav.logreader',
  settings:     'sidebar.nav.settings',
  pullranking:  'nav.pullranking',
  skillsdb:     'sidebar.nav.skillsdb',
  masterytrees: 'sidebar.nav.masterytrees',
}

const GROUP_KEYS: Array<{ key: NavGroup; tKey: string }> = [
  { key: 'builds', tKey: 'sidebar.groups.builds' },
  { key: 'combat', tKey: 'sidebar.groups.combat' },
  { key: 'training', tKey: 'sidebar.groups.training' },
  { key: 'library', tKey: 'sidebar.groups.library' },
]
const COLLAPSED_KEY = 'commandlab.sidebar.collapsed-groups.v1'

interface Props {
  active:   Page
  onChange: (page: Page) => void
}

type CheckState = 'idle' | 'checking' | 'upToDate' | 'available'

export function Sidebar({ active, onChange }: Props): React.ReactElement {
  const t = useT()
  const [checkState, setCheckState] = useState<CheckState>('idle')
  const [collapsed, setCollapsed] = useState<NavGroup[]>(() => {
    try {
      const saved: unknown = JSON.parse(localStorage.getItem(COLLAPSED_KEY) ?? '[]')
      return Array.isArray(saved) ? GROUP_KEYS.filter(group => saved.includes(group.key)).map(group => group.key) : []
    } catch { return [] }
  })
  useEffect(() => {
    const group = NAV.find(item => item.id === active)?.group
    if (group) setCollapsed(current => current.includes(group) ? current.filter(key => key !== group) : current)
  }, [active])
  useEffect(() => {
    try { localStorage.setItem(COLLAPSED_KEY, JSON.stringify(collapsed)) } catch { /* navegação funciona sem persistência local */ }
  }, [collapsed])

  useEffect(() => {
    if (!window.updateAPI) return
    const api = window.updateAPI
    const unsubscribeNotAvailable = api.onNotAvailable(() => {
      setCheckState('upToDate')
      setTimeout(() => setCheckState('idle'), 4000)
    })
    const unsubscribeAvailable = api.onAvailable(() => { setCheckState('available') })
    const unsubscribeError = api.onError(() => { setCheckState('idle') })
    return () => {
      unsubscribeNotAvailable()
      unsubscribeAvailable()
      unsubscribeError()
    }
  }, [])

  function handleCheckUpdate() {
    if (checkState === 'checking') return
    setCheckState('checking')
    setTimeout(() => {
      setCheckState(prev => prev === 'checking' ? 'idle' : prev)
    }, 35_000)
    window.updateAPI?.checkNow()
  }

  function navItem(item: NavItem): React.ReactElement {
    return <button key={item.id} className="app-nav-item" aria-current={active === item.id ? 'page' : undefined}
      onClick={() => onChange(item.id)}>
      <span className="app-nav-icon" aria-hidden="true">{item.icon}</span>
      <span className="app-nav-label">{t(NAV_KEYS[item.id])}</span>
      {WIP_PAGES.has(item.id) && <span className="app-nav-dev">dev</span>}
    </button>
  }

  return (
    <aside style={{
      width: 200, minWidth: 200,
      background: 'var(--bg-panel)',
      borderRight: '1px solid var(--sb-border, rgba(124,92,252,0.2))',
      display: 'flex', flexDirection: 'column',
      height: '100%', userSelect: 'none',
    }}>
      {/* Logo */}
      <div style={{ padding: '1.25rem 1rem 0.75rem' }}>
        <div style={{ fontSize: 'var(--fs-xs)', textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--text-muted)', marginBottom: 4 }}>
          {t('sidebar.eyebrow')}
        </div>
        <div style={{ fontFamily: 'Noto Serif, serif', fontSize: 'var(--fs-lg)', color: 'var(--gold-l)', fontWeight: 700, lineHeight: 1.2 }}>
          {t('sidebar.title')}
        </div>
        <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)', marginTop: 3 }}>
          {t('sidebar.tagline')}
        </div>
      </div>

      <div style={{ borderTop: '1px solid var(--sb-border, rgba(124,92,252,0.18))', margin: '0.5rem 0' }} />

      {/* Update button */}
      <div style={{ padding: '0 0.6rem 0.5rem' }}>
        <button
          onClick={handleCheckUpdate}
          disabled={checkState === 'checking'}
          style={{
            width: '100%', padding: '0.45rem 0.75rem',
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            borderRadius: 6, cursor: checkState === 'checking' ? 'default' : 'pointer',
            fontSize: 'var(--fs-sm)', fontWeight: 600,
            border: `1px solid ${checkState === 'upToDate' ? 'rgba(61,214,140,0.4)' : checkState === 'available' ? 'rgba(124,92,252,0.5)' : 'rgba(212,175,55,0.25)'}`,
            background: checkState === 'upToDate' ? 'rgba(61,214,140,0.08)' : checkState === 'available' ? 'rgba(124,92,252,0.12)' : 'rgba(212,175,55,0.06)',
            color: checkState === 'upToDate' ? 'var(--green)' : checkState === 'checking' ? 'var(--text-muted)' : checkState === 'available' ? '#a78bfa' : 'var(--gold)',
            transition: 'all 0.2s',
          }}
        >
          <span style={{ fontSize: 'var(--fs-md)' }}>
            {checkState === 'checking' ? '⏳' : checkState === 'upToDate' ? '✓' : checkState === 'available' ? '⬆' : '↑'}
          </span>
          {checkState === 'checking' ? t('sidebar.checking')
            : checkState === 'upToDate' ? t('sidebar.upToDate')
            : checkState === 'available' ? t('sidebar.available')
            : t('sidebar.checkUpdate')}
        </button>
      </div>

      {/* Nav */}
      <nav className="app-sidebar-nav" aria-label={t('sidebar.navigation')}>
        <div className="app-nav-home">{navItem(NAV[0])}</div>
        {GROUP_KEYS.map(group => {
          const items = NAV.filter(item => item.group === group.key)
          const closed = collapsed.includes(group.key)
          return <section className="app-nav-group" key={group.key} aria-label={t(group.tKey)}>
            <button className="app-nav-group-heading" data-active={items.some(item => item.id === active)}
              aria-expanded={!closed} aria-controls={`nav-group-${group.key}`}
              title={t(closed ? 'sidebar.expandGroup' : 'sidebar.collapseGroup')}
              onClick={() => setCollapsed(current => closed ? current.filter(key => key !== group.key) : [...current, group.key])}>
              <span>{t(group.tKey)}</span>
              <svg viewBox="0 0 10 10" aria-hidden="true"><path d="m3 1 4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.4" /></svg>
            </button>
            <div id={`nav-group-${group.key}`} hidden={closed}>{items.map(navItem)}</div>
          </section>
        })}
      </nav>

      {/* Footer */}
      <div className="app-sidebar-footer">
        {navItem(NAV.find(item => item.id === 'settings')!)}
        <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)', textAlign: 'center', padding: '0.55rem 0.5rem' }}>
          v{version} · {t('sidebar.footer')}
        </div>
      </div>
    </aside>
  )
}
