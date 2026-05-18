import React, { useState, useEffect } from 'react'
import { useT } from '../i18n/useT'
import { version } from '../../package.json'

type Page = 'dashboard' | 'calculator' | 'comparator' | 'sensitivity' | 'builds' | 'logreader' | 'rotation' | 'settings' | 'pullranking' | 'skillsdb' | 'masterytrees'

interface NavItem {
  id:    Page
  icon:  string
  group: 'overview' | 'manage' | 'analysis' | 'preferences'
}

const WIP_PAGES: Set<Page> = new Set(['skillsdb', 'masterytrees', 'rotation'])

const NAV: NavItem[] = [
  { id: 'dashboard',    icon: '⚡', group: 'overview'     },
  { id: 'builds',       icon: '📁', group: 'manage'       },
  { id: 'calculator',   icon: '⚔',  group: 'analysis'     },
  { id: 'comparator',   icon: '🕷',  group: 'analysis'     },
  { id: 'sensitivity',  icon: '📡', group: 'analysis'     },
  { id: 'rotation',     icon: '🔄', group: 'analysis'     },
  { id: 'logreader',    icon: '📄', group: 'analysis'     },
  { id: 'pullranking',  icon: '🏆', group: 'analysis'     },
  { id: 'skillsdb',     icon: '📚', group: 'analysis'     },
  { id: 'masterytrees', icon: '🌿', group: 'analysis'     },
  { id: 'settings',     icon: '⚙',  group: 'preferences'  },
]

const NAV_KEYS: Record<Page, string> = {
  dashboard:    'sidebar.nav.dashboard',
  builds:       'sidebar.nav.builds',
  calculator:   'sidebar.nav.calculator',
  comparator:   'sidebar.nav.comparator',
  sensitivity:  'sidebar.nav.sensitivity',
  rotation:     'sidebar.nav.rotation',
  logreader:    'sidebar.nav.logreader',
  settings:     'sidebar.nav.settings',
  pullranking:  'nav.pullranking',
  skillsdb:     'sidebar.nav.skillsdb',
  masterytrees: 'sidebar.nav.masterytrees',
}

const GROUP_KEYS: Array<{ key: 'overview' | 'manage' | 'analysis' | 'preferences'; tKey: string }> = [
  { key: 'overview',    tKey: 'sidebar.groups.overview'    },
  { key: 'manage',      tKey: 'sidebar.groups.manage'      },
  { key: 'analysis',    tKey: 'sidebar.groups.analysis'    },
  { key: 'preferences', tKey: 'sidebar.groups.preferences' },
]

const GROUPS = [...new Set(NAV.map((n) => n.group))]

interface Props {
  active:   Page
  onChange: (page: Page) => void
}

type CheckState = 'idle' | 'checking' | 'upToDate' | 'available'

export function Sidebar({ active, onChange }: Props): React.ReactElement {
  const t = useT()
  const [checkState, setCheckState] = useState<CheckState>('idle')

  useEffect(() => {
    if (!window.updateAPI) return
    const api = window.updateAPI
    api.onNotAvailable(() => {
      setCheckState('upToDate')
      setTimeout(() => setCheckState('idle'), 4000)
    })
    api.onAvailable(() => { setCheckState('available') })
    api.onError(() => { setCheckState('idle') })
  }, [])

  function handleCheckUpdate() {
    if (checkState === 'checking') return
    setCheckState('checking')
    const guard = setTimeout(() => {
      setCheckState(prev => prev === 'checking' ? 'idle' : prev)
    }, 35_000)
    const cleanup = () => clearTimeout(guard)
    window.updateAPI?.onNotAvailable(cleanup)
    window.updateAPI?.onAvailable(cleanup)
    window.updateAPI?.onError(cleanup)
    window.updateAPI?.checkNow()
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
      <nav style={{ flex: 1, overflowY: 'auto', padding: '0 0 1rem' }}>
        {GROUPS.map((groupKey) => {
          const groupTKey = GROUP_KEYS.find((g) => g.key === groupKey)?.tKey ?? groupKey
          return (
            <div key={groupKey}>
              <div style={{
                fontSize: 'var(--fs-xs)', textTransform: 'uppercase', letterSpacing: '0.14em',
                color: 'var(--text-muted)', fontWeight: 700, padding: '0.7rem 1rem 0.3rem',
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
                      background: isActive ? 'var(--act-bg, rgba(124,92,252,0.12))' : 'transparent',
                      border: 'none', borderLeftWidth: 2, borderLeftStyle: 'solid',
                      borderLeftColor: isActive ? 'var(--act-border, var(--gold))' : 'transparent',
                      color: isActive ? 'var(--gold-l)' : 'var(--text-soft)',
                      fontSize: 'var(--fs-sm)', fontWeight: isActive ? 600 : 400,
                      cursor: 'pointer', transition: 'all 0.15s', textAlign: 'left',
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.background = 'rgba(124,92,252,0.08)'
                        e.currentTarget.style.color = 'var(--text)'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.background = 'transparent'
                        e.currentTarget.style.color = 'var(--text-soft)'
                      }
                    }}
                  >
                    <span style={{ fontSize: 'var(--fs-md)', opacity: 0.9, lineHeight: 1 }}>{item.icon}</span>
                    <span style={{ flex: 1 }}>{t(NAV_KEYS[item.id])}</span>
                    {WIP_PAGES.has(item.id) && (
                      <span style={{
                        fontSize: 9, fontWeight: 700, letterSpacing: '0.06em',
                        textTransform: 'uppercase', color: '#f97316',
                        border: '1px solid rgba(249,115,22,0.4)',
                        borderRadius: 3, padding: '1px 4px', lineHeight: 1.4, flexShrink: 0,
                      }}>dev</span>
                    )}
                  </button>
                )
              })}
            </div>
          )
        })}
      </nav>

      {/* Footer */}
      <div style={{ borderTop: '1px solid var(--border)', padding: '0.6rem 1rem' }}>
        <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)', textAlign: 'center' }}>
          v{version} · {t('sidebar.footer')}
        </div>
      </div>
    </aside>
  )
}
