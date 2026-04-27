import React, { useState, useRef } from 'react'
import { MASTERY_TREES } from '../data/masteryTrees'
import type { MasteryNode } from '../data/masteryTrees'

// ─── Layout constants ────────────────────────────────────────────────────────

const SIZE = 620
const CX   = SIZE / 2
const CY   = SIZE / 2

// Branch 3 = inner, Branch 2 = mid, Branch 1 = outer, Branch 5 = hero ring
// Espaçamento uniforme: de 88 (interno) a 295 (hero), 3 intervalos de 69px
const RING_R: Record<number, number> = { 3: 88, 2: 157, 1: 226, 5: 295 }

// Nós bônus (cols pares) ficam 50% mais afastados do centro (innermost 88→132),
// mantendo o mesmo intervalo de 69px entre eles
const BONUS_RING_R: Record<number, number> = { 3: 132, 2: 201, 1: 270 }

const BRANCH_COLOR: Record<number, string> = {
  1: '#3b82f6',
  2: '#22c55e',
  3: '#ef4444',
  5: '#d4af37',
}

const BRANCH_LABEL: Record<number, string> = {
  1: 'Ramo I',
  2: 'Ramo II',
  3: 'Ramo III',
  5: 'Hero',
}

// ─── Weapon config ───────────────────────────────────────────────────────────

const WEAPON_INFO: Record<number, { label: string; icon: string; color: string }> = {
  1:  { label: 'Arco Longo', icon: '🏹', color: '#4ade80' },
  3:  { label: 'Espadão',    icon: '⚔️',  color: '#ef4444' },
  4:  { label: 'Besta',      icon: '🎯',  color: '#86efac' },
  5:  { label: 'Cajado',     icon: '🔮',  color: '#a78bfa' },
  6:  { label: 'Adagas',     icon: '🗡️',  color: '#f97316' },
  7:  { label: 'Espada',     icon: '🛡️',  color: '#f59e0b' },
  9:  { label: 'Varinha',    icon: '✨',  color: '#60a5fa' },
  25: { label: 'Lança',      icon: '🔱',  color: '#ec4899' },
  34: { label: 'Orbe',       icon: '🔵',  color: '#22d3ee' },
}

// ─── Math helpers ────────────────────────────────────────────────────────────

// Col 1 = topo (270°), sentido horário, passo 45°
function colToAngle(col: number): number {
  return 270 + (col - 1) * 45
}

function polar(r: number, deg: number): { x: number; y: number } {
  const rad = (deg * Math.PI) / 180
  return { x: CX + r * Math.cos(rad), y: CY + r * Math.sin(rad) }
}

interface NodePos { node: MasteryNode; x: number; y: number }

function computePositions(nodes: MasteryNode[]): NodePos[] {
  // Group nodes by (branch, column)
  const map = new Map<string, MasteryNode[]>()
  for (const n of nodes) {
    const k = `${n.branch}_${n.column}`
    const arr = map.get(k) ?? []
    arr.push(n)
    map.set(k, arr)
  }

  const result: NodePos[] = []
  for (const grp of map.values()) {
    const branch = grp[0].branch
    const col    = grp[0].column
    const isEven = col % 2 === 0
    const r      = isEven ? (BONUS_RING_R[branch] ?? RING_R[branch]) : RING_R[branch]
    // Branch 5 (hero) vai para posições ordinais (cantos): NE=315°, SE=45°, SW=135°, NW=225°
    const base   = branch === 5
      ? 315 + ((col - 1) / 2) * 90
      : colToAngle(col)
    const count  = grp.length
    const spread = 25

    // Skill node (isSkillNode) sempre no centro do grupo → offset 0 = ângulo cardinal exato
    const sorted = count === 1 ? grp : [...grp].sort((a, b) => {
      if (a.isSkillNode && !b.isSkillNode) return 0  // skill → posição central
      if (!a.isSkillNode && b.isSkillNode) return -1
      return 0
    })
    // Reordenar: skill node vai para o índice central
    if (count === 3) {
      const skillIdx = sorted.findIndex(n => n.isSkillNode)
      if (skillIdx !== -1 && skillIdx !== 1) {
        const [skill] = sorted.splice(skillIdx, 1)
        sorted.splice(1, 0, skill)
      }
    }

    sorted.forEach((node, i) => {
      const offset = count === 1 ? 0 : (i - (count - 1) / 2) * spread
      const { x, y } = polar(r, base + offset)
      result.push({ node, x, y })
    })
  }
  return result
}

// ─── SVG rings + spokes ──────────────────────────────────────────────────────

function BackgroundSVG({ weaponIcon, weaponColor }: { weaponIcon: string; weaponColor: string }) {
  return (
    <svg
      width={SIZE} height={SIZE}
      style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}
    >
      {/* Outer glow background */}
      <circle cx={CX} cy={CY} r={RING_R[5] + 30} fill="rgba(10,12,24,0.85)" />

      {/* Concentric rings — branch colors */}
      {([3, 2, 1] as const).map(b => (
        <circle key={b} cx={CX} cy={CY} r={RING_R[b]}
          fill="none" stroke={BRANCH_COLOR[b]} strokeWidth={2} opacity={0.22} />
      ))}
      {/* Hero ring — dashed */}
      <circle cx={CX} cy={CY} r={RING_R[5]}
        fill="none" stroke={BRANCH_COLOR[5]} strokeWidth={1.5}
        opacity={0.28} strokeDasharray="6 8" />

      {/* Spoke lines at each column angle */}
      {[1,2,3,4,5,6,7,8].map(col => {
        const inner = polar(RING_R[3] - 18, colToAngle(col))
        const outer = polar(RING_R[5] + 22, colToAngle(col))
        return (
          <line key={col}
            x1={inner.x} y1={inner.y} x2={outer.x} y2={outer.y}
            stroke="rgba(124,92,252,0.07)" strokeWidth={1} />
        )
      })}

      {/* Center diamond */}
      <polygon
        points={`${CX},${CY - 32} ${CX + 32},${CY} ${CX},${CY + 32} ${CX - 32},${CY}`}
        fill={`${weaponColor}18`} stroke={weaponColor} strokeWidth={1.5}
      />
      {/* Center icon via foreignObject */}
      <foreignObject x={CX - 14} y={CY - 14} width={28} height={28}>
        <div style={{ fontSize: '1.1rem', textAlign: 'center', lineHeight: '28px', userSelect: 'none' }}>
          {weaponIcon}
        </div>
      </foreignObject>

      {/* Branch arcs — highlight segment at each occupied column */}
      {/* (visual polish: short arc segments instead of just dots) */}
    </svg>
  )
}

// Nó bônus = coluna par (2,4,6,8) — ativado automaticamente com 20 pts no quadrante
const isBonus = (node: MasteryNode) => node.column % 2 === 0

// ─── Node dot ────────────────────────────────────────────────────────────────

interface NodeDotProps {
  pos:      NodePos
  selected: boolean
  onSelect: (n: MasteryNode) => void
  onHover:  (pos: NodePos | null, e?: React.MouseEvent) => void
}

function NodeDot({ pos, selected, onSelect, onHover }: NodeDotProps): React.ReactElement {
  const { node, x, y } = pos
  const color   = BRANCH_COLOR[node.branch]
  const bonus   = isBonus(node)
  const isSkill = node.isSkillNode && !bonus
  const isHero  = node.branch === 5
  const size    = isHero ? 32 : isSkill ? 28 : 20
  const half    = size / 2

  if (bonus) {
    return (
      <div
        onClick={() => onSelect(node)}
        onMouseEnter={e => onHover(pos, e)}
        onMouseLeave={() => onHover(null)}
        style={{
          position: 'absolute',
          left: x - half, top: y - half,
          width: size, height: size,
          borderRadius: 5,
          background: selected ? `${color}25` : `${color}08`,
          border: `1.5px dashed ${selected ? color + 'cc' : color + '40'}`,
          opacity: selected ? 1 : 0.55,
          cursor: 'pointer',
          transition: 'all 0.12s',
          zIndex: selected ? 40 : 6,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        <span style={{ fontSize: '0.36rem', color: color + '80', userSelect: 'none', lineHeight: 1 }}>✦</span>
      </div>
    )
  }

  return (
    <div
      onClick={() => onSelect(node)}
      onMouseEnter={e => onHover(pos, e)}
      onMouseLeave={() => onHover(null)}
      style={{
        position: 'absolute',
        left: x - half,
        top:  y - half,
        width: size, height: size,
        borderRadius: isSkill ? 4 : isHero ? 5 : '50%',
        transform: isSkill ? 'rotate(45deg)' : undefined,
        background: selected ? `${color}40` : `${color}18`,
        border: `2px solid ${selected ? color : color + '65'}`,
        boxShadow: selected
          ? `0 0 12px ${color}90, 0 0 5px ${color}50`
          : `inset 0 0 4px ${color}20`,
        cursor: 'pointer',
        transition: 'all 0.12s',
        zIndex: selected ? 40 : isHero ? 20 : 10,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {node.hasPassiveLevels && (
        <span style={{
          fontSize: '0.42rem', color, fontWeight: 900, lineHeight: 1,
          transform: isSkill ? 'rotate(-45deg)' : undefined,
          userSelect: 'none',
        }}>↑</span>
      )}
    </div>
  )
}

// ─── Tooltip ─────────────────────────────────────────────────────────────────

interface TipState { pos: NodePos; sx: number; sy: number }

function Tooltip({ tip }: { tip: TipState }): React.ReactElement {
  const color = BRANCH_COLOR[tip.pos.node.branch]
  return (
    <div style={{
      position: 'fixed', left: tip.sx + 14, top: tip.sy - 12,
      zIndex: 9999, pointerEvents: 'none',
      background: 'rgba(8,10,20,0.97)',
      border: `1px solid ${color}55`,
      borderRadius: 6, padding: '5px 10px', maxWidth: 220,
    }}>
      <div style={{ fontSize: '0.72rem', fontWeight: 700, color, lineHeight: 1.35 }}>
        {tip.pos.node.name}
      </div>
      <div style={{ fontSize: '0.58rem', color: '#7a8099', marginTop: 2 }}>
        {BRANCH_LABEL[tip.pos.node.branch]} · Col {tip.pos.node.column}
        {tip.pos.node.isSkillNode ? ' · Skill Passive' : ''}
        {tip.pos.node.hasPassiveLevels ? ' · ↑ escala' : ''}
        {isBonus(tip.pos.node) ? ' · Bônus' : ''}
      </div>
      {isBonus(tip.pos.node) && (
        <div style={{ fontSize: '0.55rem', color: '#d4af37', marginTop: 3, display: 'flex', alignItems: 'center', gap: 3 }}>
          ✦ Ativado com 20 pts no quadrante
        </div>
      )}
    </div>
  )
}

// ─── Detail panel ────────────────────────────────────────────────────────────

function DetailPanel({ node, onClose }: { node: MasteryNode; onClose: () => void }): React.ReactElement {
  const color     = BRANCH_COLOR[node.branch]
  const isHero    = node.branch === 5
  const isSkill   = node.isSkillNode
  const bonus     = isBonus(node)
  const typeLabel = bonus ? 'Bônus' : isHero ? 'Hero Passive' : isSkill ? 'Skill Passive' : node.hasPassiveLevels ? 'Stat (escalável)' : 'Stat'

  return (
    <div style={{
      borderTop: '1px solid rgba(124,92,252,0.2)',
      background: 'rgba(0,0,0,0.38)',
      padding: '0.7rem 1.25rem',
      display: 'flex', gap: '1.25rem', alignItems: 'flex-start',
      flexShrink: 0,
    }}>
      <div style={{ minWidth: 86 }}>
        <div style={{ fontSize: '0.52rem', color: '#474f6b', textTransform: 'uppercase', letterSpacing: '0.1em' }}>ID</div>
        <div style={{ fontSize: '0.88rem', fontWeight: 700, color, lineHeight: 1 }}>{node.id}</div>
        <div style={{
          marginTop: 5, fontSize: '0.56rem', fontWeight: 700,
          color, background: `${color}18`, border: `1px solid ${color}30`,
          borderRadius: 3, padding: '1px 5px', display: 'inline-block',
          textTransform: 'uppercase', letterSpacing: '0.07em',
        }}>{typeLabel}</div>
        {node.hasPassiveLevels && (
          <div style={{ marginTop: 3, fontSize: '0.54rem', color: '#a78bfa' }}>↑ escala por nível</div>
        )}
        {bonus && (
          <div style={{ marginTop: 3, fontSize: '0.54rem', color: '#d4af37' }}>✦ 20 pts no quadrante</div>
        )}
      </div>
      <div style={{ minWidth: 155 }}>
        <div style={{ fontSize: '0.52rem', color: '#474f6b', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 2 }}>
          {BRANCH_LABEL[node.branch]} · Coluna {node.column}
        </div>
        <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#e2e4ec', lineHeight: 1.35 }}>
          {node.name}
        </div>
      </div>
      <div style={{ flex: 1, fontSize: '0.77rem', color: '#9aa0b8', lineHeight: 1.65, paddingTop: 2 }}>
        {node.description || '—'}
      </div>
      <button
        onClick={onClose}
        style={{ background: 'none', border: 'none', color: '#474f6b', cursor: 'pointer', fontSize: '1.1rem', padding: '0 4px', lineHeight: 1 }}
        onMouseEnter={e => (e.currentTarget.style.color = '#f87171')}
        onMouseLeave={e => (e.currentTarget.style.color = '#474f6b')}
      >×</button>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function MasteryTrees(): React.ReactElement {
  const [weaponId, setWeaponId] = useState<number>(MASTERY_TREES[0].weapon_id)
  const [selected, setSelected] = useState<MasteryNode | null>(null)
  const [tip, setTip]           = useState<TipState | null>(null)

  const tree      = MASTERY_TREES.find(t => t.weapon_id === weaponId)!
  const info      = WEAPON_INFO[weaponId]
  const positions = computePositions(tree.nodes)

  function handleSelect(n: MasteryNode) {
    setSelected(prev => prev?.id === n.id ? null : n)
  }

  function handleHover(pos: NodePos | null, e?: React.MouseEvent) {
    if (!pos || !e) { setTip(null); return }
    setTip({ pos, sx: e.clientX, sy: e.clientY })
  }

  function switchWeapon(id: number) {
    setWeaponId(id)
    setSelected(null)
    setTip(null)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', paddingTop: '2rem' }}>

      {/* Header */}
      <div style={{ padding: '0.6rem 1rem 0.4rem', flexShrink: 0 }}>
        <div style={{ fontSize: '0.58rem', color: '#7c5cfc', textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 2 }}>
          Maestrias
        </div>
        <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f0cc55' }}>
          Árvore de Maestrias de Armas
        </div>
      </div>

      {/* Weapon tabs */}
      <div style={{
        display: 'flex', gap: 4, padding: '0 1rem 0.5rem',
        overflowX: 'auto', flexShrink: 0,
        borderBottom: '1px solid rgba(124,92,252,0.18)',
      }}>
        {MASTERY_TREES.map(t => {
          const wi     = WEAPON_INFO[t.weapon_id]
          const active = t.weapon_id === weaponId
          return (
            <button
              key={t.weapon_id}
              onClick={() => switchWeapon(t.weapon_id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '5px 12px', borderRadius: 5, cursor: 'pointer',
                fontSize: '0.77rem', fontWeight: active ? 700 : 400, whiteSpace: 'nowrap',
                background: active ? `${wi.color}18` : 'transparent',
                border: `1px solid ${active ? wi.color : 'rgba(124,92,252,0.18)'}`,
                color: active ? wi.color : '#7a8099',
                transition: 'all 0.15s',
              }}
            >
              <span>{wi.icon}</span> {wi.label}
            </button>
          )
        })}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: '1rem', padding: '0.35rem 1rem', flexShrink: 0, alignItems: 'center', flexWrap: 'wrap' }}>
        {([1, 2, 3, 5] as const).map(b => (
          <div key={b} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 11, height: 11, borderRadius: '50%', background: BRANCH_COLOR[b] + '28', border: `2px solid ${BRANCH_COLOR[b]}` }} />
            <span style={{ fontSize: '0.62rem', color: '#7a8099' }}>{BRANCH_LABEL[b]}</span>
          </div>
        ))}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <div style={{ width: 10, height: 10, borderRadius: 2, transform: 'rotate(45deg)', background: '#3b82f620', border: '2px solid #3b82f6' }} />
          <span style={{ fontSize: '0.62rem', color: '#7a8099' }}>Skill Passive</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'rgba(124,92,252,0.05)', border: '1.5px dashed rgba(124,92,252,0.4)' }} />
          <span style={{ fontSize: '0.62rem', color: '#7a8099' }}>Bônus <span style={{ color: '#d4af3790' }}>✦ 20 pts</span></span>
        </div>
        <span style={{ fontSize: '0.58rem', color: '#474f6b', marginLeft: 2 }}>
          <span style={{ color: '#a78bfa', fontWeight: 700 }}>↑</span> = escala por nível · clique para ver detalhes
        </span>
      </div>

      {/* Canvas */}
      <div style={{
        flex: 1, overflow: 'auto',
        display: 'flex', justifyContent: 'center', alignItems: 'flex-start',
        padding: '0.5rem 0.5rem',
        background: 'radial-gradient(ellipse at center, rgba(20,22,40,0.6) 0%, transparent 70%)',
      }}>
        <div style={{ position: 'relative', width: SIZE, height: SIZE, flexShrink: 0 }}>
          <BackgroundSVG weaponIcon={info.icon} weaponColor={info.color} />

          {positions.map(pos => (
            <NodeDot
              key={pos.node.id}
              pos={pos}
              selected={selected?.id === pos.node.id}
              onSelect={handleSelect}
              onHover={handleHover}
            />
          ))}
        </div>
      </div>

      {/* Tooltip */}
      {tip && <Tooltip tip={tip} />}

      {/* Detail panel */}
      {selected && <DetailPanel node={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}
