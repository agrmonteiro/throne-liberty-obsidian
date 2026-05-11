import { useEffect, useState, useCallback } from 'react'
import type { Skill, SkillEnhancement, WeaponMastery } from './types'
import { api } from './api'
import SkillsTab        from './tabs/SkillsTab'
import MasteriesTab     from './tabs/MasteriesTab'
import EnhancementsTab  from './tabs/EnhancementsTab'
import HierarchyTab     from './tabs/HierarchyTab'

type Tab = 'skills' | 'traits' | 'masteries' | 'hierarchy'

export default function App() {
  const [tab, setTab]                 = useState<Tab>('skills')
  const [skills, setSkills]           = useState<Skill[]>([])
  const [enhancements, setEnhancements] = useState<SkillEnhancement[]>([])
  const [masteries, setMasteries]     = useState<WeaponMastery[]>([])
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState<string | null>(null)
  const [dirty, setDirty]             = useState(false)
  const [saving, setSaving]           = useState(false)
  const [toast, setToast]             = useState<string | null>(null)

  useEffect(() => {
    Promise.all([api.skills(), api.enhancements(), api.masteries()])
      .then(([s, e, m]) => { setSkills(s); setEnhancements(e); setMasteries(m) })
      .catch(err => setError(String(err)))
      .finally(() => setLoading(false))
  }, [])

  const showToast = useCallback((msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }, [])

  async function handleSave() {
    setSaving(true)
    try {
      const result = await api.save()
      setDirty(false)
      showToast(`Salvo! ${result.saved.skills} skills · ${result.saved.enhancements} traits · ${result.saved.masteries} maestrias`)
    } catch (e) {
      showToast('Erro ao salvar: ' + String(e))
    } finally {
      setSaving(false)
    }
  }

  const updateSkill = useCallback((s: Skill) => {
    setSkills(prev => prev.map(x => x.id === s.id ? s : x))
  }, [])
  const updateEnhancement = useCallback((e: SkillEnhancement) => {
    setEnhancements(prev => prev.map(x => x.id === e.id ? e : x))
  }, [])
  const updateMastery = useCallback((m: WeaponMastery) => {
    setMasteries(prev => prev.map(x => x.id === m.id ? m : x))
  }, [])
  const markDirty = useCallback(() => setDirty(true), [])

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'var(--muted)' }}>
      Carregando catálogo…
    </div>
  )

  if (error) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: 12 }}>
      <span style={{ color: 'var(--accent2)', fontSize: 14, fontWeight: 600 }}>Erro ao conectar com a API</span>
      <code style={{ fontSize: 11, color: 'var(--muted)' }}>{error}</code>
      <span style={{ fontSize: 12, color: 'var(--muted)' }}>Certifique-se de rodar <code>npm run dev</code> na pasta catalog-manager.</span>
    </div>
  )

  return (
    <div id="root" style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      {/* Topbar */}
      <header className="topbar">
        <h1>Catalog Manager</h1>
        <nav className="tabs">
          {([
            ['skills',    `Skills (${skills.length})`],
            ['traits',    `Traits (${enhancements.length})`],
            ['masteries', `Maestrias (${masteries.length})`],
            ['hierarchy', 'Hierarquia'],
          ] as [Tab, string][]).map(([id, label]) => (
            <button key={id} className={`tab ${tab === id ? 'active' : ''}`} onClick={() => setTab(id)}>
              {label}
            </button>
          ))}
        </nav>
        {dirty && <span className="dirty-dot" title="Há alterações não salvas" />}
        <button className="save-btn" disabled={!dirty || saving} onClick={handleSave}>
          {saving ? 'Salvando…' : 'Salvar nos arquivos TS'}
        </button>
      </header>

      {/* Conteúdo */}
      {tab === 'skills' && (
        <SkillsTab skills={skills} enhancements={enhancements} onUpdate={updateSkill} markDirty={markDirty} />
      )}
      {tab === 'traits' && (
        <EnhancementsTab skills={skills} enhancements={enhancements} onUpdate={updateEnhancement} markDirty={markDirty} />
      )}
      {tab === 'masteries' && (
        <MasteriesTab masteries={masteries} onUpdate={updateMastery} markDirty={markDirty} />
      )}
      {tab === 'hierarchy' && (
        <HierarchyTab skills={skills} enhancements={enhancements} masteries={masteries} />
      )}

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24,
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 8, padding: '10px 16px', fontSize: 12,
          color: 'var(--text)', boxShadow: '0 4px 20px rgba(0,0,0,.5)',
          zIndex: 200, maxWidth: 360,
        }}>
          {toast}
        </div>
      )}
    </div>
  )
}
