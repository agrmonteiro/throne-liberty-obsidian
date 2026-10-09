import type { RazerMacro, RazerMacroEvent } from './types'

export const MACRO_KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '=', '/', 'E', 'M3'] as const
const KEY_CODES: Record<string, { make: number; scan: number }> = Object.fromEntries([
  ...Array.from({ length: 10 }, (_, digit) => [String(digit), { make: 48 + digit, scan: digit === 0 ? 11 : digit + 1 }]),
  ['-', { make: 189, scan: 12 }],
  ['=', { make: 187, scan: 13 }],
  ['/', { make: 191, scan: 53 }],
  ['E', { make: 69, scan: 18 }],
])
const CODE_KEYS = Object.fromEntries(Object.entries(KEY_CODES).map(([key, code]) => [String(code.make), key]))

function childText(element: Element | undefined, tag: string): string {
  return element?.getElementsByTagName(tag)[0]?.textContent?.trim() ?? ''
}

function xmlText(value: string): string {
  const escapes: Record<string, string> = { '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' }
  return value.replace(/[<>&"']/g, ch => escapes[ch])
}

export function validateRazerMacro(macro: RazerMacro): void {
  if (!macro.name.trim()) throw new Error('Informe um nome para a macro.')
  if (!Number.isInteger(macro.durationMs) || macro.durationMs < 1 || macro.durationMs > 3_600_000) {
    throw new Error('O ciclo precisa ter entre 1 ms e 1 hora.')
  }
  if (macro.events.length === 0 || macro.events.length > 10000) throw new Error('A macro precisa ter entre 1 e 10.000 pressionamentos.')
  if (!Number.isInteger(macro.globalGapMs ?? 0) || (macro.globalGapMs ?? 0) < 0 || (macro.globalGapMs ?? 0) > 60000) {
    throw new Error('O intervalo geral deve estar entre 0 e 60.000 ms.')
  }
  for (const event of macro.events) {
    if (event.key !== 'M3' && !KEY_CODES[event.key]) throw new Error(`Tecla não suportada: ${event.key}`)
    if (!Number.isInteger(event.atMs) || event.atMs < 0) throw new Error('Tempo de início inválido.')
    if (!Number.isInteger(event.holdMs) || event.holdMs < 1) throw new Error('Duração do toque inválida.')
    if (!Number.isInteger(event.extraGapMs ?? 0) || (event.extraGapMs ?? 0) < 0 || (event.extraGapMs ?? 0) > 60000) {
      throw new Error('O acréscimo de intervalo deve estar entre 0 e 60.000 ms.')
    }
    if (event.atMs + event.holdMs > macro.durationMs) throw new Error('Um toque termina depois do fim do ciclo.')
  }
  const edges = macro.events.flatMap((event, index) => [
    { at: event.atMs, key: event.key, down: true, index },
    { at: event.atMs + event.holdMs, key: event.key, down: false, index },
  ]).sort((a, b) => a.at - b.at || Number(a.down) - Number(b.down) || a.index - b.index)
  const held = new Set<string>()
  for (const edge of edges) {
    if (edge.down) {
      if (held.has(edge.key)) throw new Error(`Toques da tecla ${edge.key} se sobrepõem.`)
      held.add(edge.key)
    } else {
      held.delete(edge.key)
    }
  }
}

/** Converte os ajustes de intervalo em tempos absolutos antes de exportar. */
export function scheduleRazerMacro(macro: RazerMacro): { events: RazerMacroEvent[]; durationMs: number; sourceIndices: number[] } {
  validateRazerMacro(macro)
  const ordered = macro.events.map((event, index) => ({ event, index }))
    .sort((a, b) => a.event.atMs - b.event.atMs || a.index - b.index)
  const events: RazerMacroEvent[] = []
  const sourceIndices: number[] = []
  let previousEnd = 0
  let previousBaseEnd = 0
  let shift = 0
  for (const { event, index } of ordered) {
    const extra = event.extraGapMs ?? 0
    const baseGap = event.atMs - previousBaseEnd
    const gap = events.length === 0
      ? event.atMs
      : (macro.globalGapMs ?? 0) > 0 ? Math.max(baseGap, macro.globalGapMs ?? 0) : baseGap
    const atMs = (events.length ? previousEnd : 0) + gap + extra
    shift = atMs - event.atMs
    previousEnd = atMs + event.holdMs
    previousBaseEnd = event.atMs + event.holdMs
    events.push({ ...event, atMs })
    sourceIndices.push(index)
  }
  const durationMs = macro.durationMs + shift
  return { events, durationMs, sourceIndices }
}

export function parseRazerMacro(xml: string): RazerMacro {
  const document = new DOMParser().parseFromString(xml, 'application/xml')
  if (document.querySelector('parsererror') || document.documentElement.tagName !== 'Macro') {
    throw new Error('Arquivo XML inválido ou não é uma macro do Synapse.')
  }
  const name = childText(document.documentElement, 'Name') || 'Macro importada'
  const container = document.getElementsByTagName('MacroEvents')[0]
  if (!container) throw new Error('O XML não contém eventos de macro.')
  let atMs = 0
  const active = new Map<string, { key: string; atMs: number }>()
  const events: RazerMacroEvent[] = []
  for (const item of Array.from(container.children)) {
    if (item.tagName !== 'MacroEvent') continue
    const type = childText(item, 'Type')
    if (type === 'actionBar') continue
    if (type === '0') {
      const seconds = Number(childText(item, 'Number'))
      if (!Number.isFinite(seconds) || seconds < 0) throw new Error('O XML contém um intervalo inválido.')
      atMs += Math.round(seconds * 1000)
      continue
    }
    let key: string
    let state: string
    let id: string
    if (type === '1') {
      const keyEvent = item.getElementsByTagName('KeyEvent')[0]
      key = CODE_KEYS[childText(keyEvent, 'Makecode')]
      if (!key) throw new Error('O XML contém uma tecla não suportada.')
      state = childText(keyEvent, 'State')
      id = childText(item, 'Id')
      if (!id) throw new Error('Um pressionamento está sem identificador.')
    } else if (type === '2') {
      const mouseEvent = item.getElementsByTagName('MouseEvent')[0]
      if (childText(mouseEvent, 'MouseButton') !== '3') throw new Error('O XML contém um botão do mouse não suportado.')
      key = 'M3'
      state = childText(mouseEvent, 'State')
      id = 'mouse:3'
    } else {
      throw new Error(`O XML contém um evento não suportado (tipo ${type}).`)
    }
    if (state === '0') {
      if (active.has(id)) throw new Error('O XML contém pressionamentos sem soltura.')
      active.set(id, { key, atMs })
    } else if (state === '1') {
      const down = active.get(id)
      if (!down || down.key !== key || atMs <= down.atMs) throw new Error('O XML contém uma soltura sem pressionamento correspondente.')
      events.push({ atMs: down.atMs, key, holdMs: atMs - down.atMs })
      active.delete(id)
    } else {
      throw new Error('Estado de tecla desconhecido no XML.')
    }
  }
  if (active.size) throw new Error('O XML termina com teclas pressionadas.')
  const macro: RazerMacro = {
    name,
    durationMs: atMs,
    globalGapMs: 0,
    events: events.sort((a, b) => a.atMs - b.atMs),
    keyLabels: {},
  }
  validateRazerMacro(macro)
  return macro
}

export function serializeRazerMacro(macro: RazerMacro): string {
  validateRazerMacro(macro)
  const scheduled = scheduleRazerMacro(macro)
  if (scheduled.durationMs > 3_600_000) throw new Error('O ciclo com intervalos ultrapassa 1 hora.')
  const edges = scheduled.events.flatMap((event, index) => [
    { at: event.atMs, key: event.key, state: 0, index },
    { at: event.atMs + event.holdMs, key: event.key, state: 1, index },
  ]).sort((a, b) => a.at - b.at || b.state - a.state || a.index - b.index)
  const lines = [
    '<Macro>',
    `   <Name>${xmlText(macro.name.trim())}</Name>`,
    '   <MacroEvents>',
    '      <MacroEvent><Type>actionBar</Type><recordProfile /><selected>false</selected></MacroEvent>',
  ]
  let cursor = 0
  const idBase = Date.now()
  for (const edge of edges) {
    if (edge.at > cursor) {
      lines.push(`      <MacroEvent><Type>0</Type><Number>${((edge.at - cursor) / 1000).toFixed(6)}</Number><selected>false</selected></MacroEvent>`)
      cursor = edge.at
    }
    if (edge.key === 'M3') {
      lines.push(`      <MacroEvent><Type>2</Type><MouseEvent><MouseButton>3</MouseButton><State>${edge.state}</State></MouseEvent></MacroEvent>`)
    } else {
      const { make, scan } = KEY_CODES[edge.key]
      const flag = edge.state === 1 ? '<flag>1</flag>' : ''
      lines.push(`      <MacroEvent><Type>1</Type><Id>${idBase + edge.index}</Id><KeyEvent><Makecode>${make}</Makecode><State>${edge.state}</State>${flag}</KeyEvent><flag>${edge.state}</flag><selected>false</selected><isPairing>false</isPairing><ScanCode>${scan}</ScanCode></MacroEvent>`)
    }
  }
  if (scheduled.durationMs > cursor) {
    lines.push(`      <MacroEvent><Type>0</Type><Number>${((scheduled.durationMs - cursor) / 1000).toFixed(6)}</Number><selected>false</selected></MacroEvent>`)
  }
  lines.push('   </MacroEvents>', '   <DelaySetting>0</DelaySetting>', `   <Guid>${crypto.randomUUID()}</Guid>`, '   <Version>4</Version>', '   <MouseMoveType>none</MouseMoveType>', '</Macro>')
  return lines.join('\n')
}
