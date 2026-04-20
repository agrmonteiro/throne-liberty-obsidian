import React from 'react'
import { useT } from '../i18n/useT'

type Page = 'dashboard' | 'calculator' | 'comparator' | 'sensitivity' | 'builds' | 'logreader' | 'rotation' | 'settings'

interface NavItem {
  id:    Page
  icon:  string
  group: 'overview' | 'manage' | 'analysis' | 'preferences'
}

const NAV: NavItem[] = [
  { id: 'dashboard',   icon: '⚡', group: 'overview'     },
  { id: 'builds',      icon: '📁', group: 'manage'       },
  { id: 'calculator',  icon: '⚔',  group: 'analysis'     },
  { id: 'comparator',  icon: '🕷',  group: 'analysis'     },
  { id: 'sensitivity', icon: '📡', group: 'analysis'     },
  { id: 'rotation',    icon: '🔄', group: 'analysis'     },
  { id: 'logreader',   icon: '📄', group: 'analysis'     },
  { id: 'settings',    icon: '⚙',  group: 'preferences'  },
]

const NAV_KEYS: Record<Page, string> = {
  dashboard:   'sidebar.nav.dashboard',
  builds:      'sidebar.nav.builds',
  calculator:  'sidebar.nav.calculator',
  comparator:  'sidebar.nav.comparator',
  sensitivity: 'sidebar.nav.sensitivity',
  rotation:    'sidebar.nav.rotation',
  logreader:   'sidebar.nav.logreader',
  settings:    'sidebar.nav.settings',
}

const GROUP_KEYS: Array<{ key: 'overview' | 'manage' | 'analysis' | 'preferences'; tKey: string }> = [
  { key: 'overview',     tKey: 'sidebar.groups.overview'     },
  { key: 'manage',       tKey: 'sidebar.groups.manage'       },
  { key: 'analysis',     tKey: 'sidebar.groups.analysis'     },
  { key: 'preferences',  tKey: 'sidebar.groups.preferences'  },
]

// Maintain group order by first appearance in NAV
const GROUPS = [...new Set(NAV.map((n) => n.group))]

interface Props {
  active:   Page
  onChange: (page: Page) => void
}

export function Sidebar({ active, onChange }: Props): React.ReactElement {
  const t = useT()

  return (
    <aside
      style={{
        width: 200,
        minWidth: 200,
        background: 'var(--bg-panel)',
        borderRight: '1px solid rgba(124,92,252,0.2)',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        userSelect: 'none',
      }}
    >
      {/* Logo */}
      <div style={{ padding: '1.25rem 1rem 0.75rem' }}>
        <div style={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.15em', color: '#474f6b', marginBottom: 4 }}>
          {t('sidebar.eyebrow')}
        </div>
        <div style={{ fontFamily: 'Noto Serif, serif', fontSize: '1rem', color: '#f0cc55', fontWeight: 700, lineHeight: 1.2 }}>
          {t('sidebar.title')}
        </div>
        <div style={{ fontSize: '0.65rem', color: '#474f6b', marginTop: 2 }}>{t('sidebar.tagline')}</div>
      </div>

      <div style={{ borderTop: '1px solid rgba(124,92,252,0.18)', margin: '0.5rem 0' }} />

      {/* Nav */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '0 0 1rem' }}>
        {GROUPS.map((groupKey) => {
          const groupTKey = GROUP_KEYS.find((g) => g.key === groupKey)?.tKey ?? groupKey
          return (
            <div key={groupKey}>
              <div style={{
                fontSize: '0.58rem', textTransform: 'uppercase', letterSpacing: '0.14em',
                color: '#474f6b', fontWeight: 700, padding: '0.7rem 1rem 0.3rem',
              }}>
                {t(groupTKey)}
              </div>
              {NAV.filter((n) => n.group === groupKey).map((item) => {
                const isActive = active === item.id
                return (
                  <button
                    key={item.id}
                    onClick={() => onChange(item.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.6rem',
                      width: '100%', padding: '0.55rem 1rem',
                      background: isActive ? 'rgba(124,92,252,0.12)' : 'transparent',
                      borderLeft: `2px solid ${isActive ? '#d4af37' : 'transparent'}`,
                      border: 'none',
                      borderLeftWidth: 2,
                      borderLeftStyle: 'solid',
                      borderLeftColor: isActive ? '#d4af37' : 'transparent',
                      color: isActive ? '#f0cc55' : '#7a8099',
                      fontSize: '0.82rem',
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                      textAlign: 'left',
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.background = 'rgba(124,92,252,0.08)'
                        e.currentTarget.style.color = '#e2e4ec'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.background = 'transparent'
                        e.currentTarget.style.color = '#7a8099'
                      }
                    }}
                  >
                    <span style={{ fontSize: '0.9rem', opacity: 0.85 }}>{item.icon}</span>
                    {t(NAV_KEYS[item.id])}
                  </button>
                )
              })}
            </div>
          )
        })}
      </nav>

      {/* Footer */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '0.6rem 1rem' }}>
        <div style={{ fontSize: '0.62rem', color: '#474f6b', textAlign: 'center' }}>
          v1.0 · {t('sidebar.footer')}
        </div>
      </div>
    </aside>
  )
}
