#!/usr/bin/env node
/**
 * Throne & Liberty — Agent Dispatcher Hook
 *
 * PostToolUse hook: detecta o arquivo editado e injeta um systemMessage
 * dizendo a Claude qual agente especializado deve ser consultado.
 *
 * Formato de entrada (stdin): JSON do tool_input do Claude Code
 * Formato de saída (stdout): JSON com { systemMessage: string }
 */

const AGENT_ROUTES = [
  {
    agent: 'ipc-security',
    label: '🔒 IPC Security',
    patterns: [
      /electron[/\\]main[/\\]index\.ts/,
      /electron[/\\]preload[/\\]index\.ts/,
    ],
    hint: 'Arquivo IPC modificado. Verificar: assertInsideDir(), sanitizeDataFilename(), handlers combatlog:* e data:* seguem as regras de segurança.',
  },
  {
    agent: 'gear-scorer',
    label: '⚔️ Gear Scorer',
    patterns: [
      /src[/\\]engine[/\\]gearScorer\.ts/,
      /src[/\\]engine[/\\]types\.ts/,
      /src[/\\]store[/\\]useGear\.ts/,
      /src[/\\]pages[/\\]GearAdvisor\.tsx/,
    ],
    hint: 'Engine de gear modificado. Verificar: applyItemStats() não muta char original, STAT_WEIGHTS cobre todos os campos de ItemStats, rankItemUpgrades() é determinístico.',
  },
  {
    agent: 'rotation-builder',
    label: '🔄 Rotation Builder',
    patterns: [
      /src[/\\]engine[/\\]skillsDB\.ts/,
      /src[/\\]pages[/\\]Rotation\.tsx/,
      /src[/\\]components[/\\]SkillPicker\.tsx/,
      /src[/\\]components[/\\]MasteryPicker\.tsx/,
    ],
    hint: 'Rotação ou banco de skills modificado. Verificar: cooldowns são BASE (sem CDR), hits = impactos por cast, skills dot vão para a tabela correta.',
  },
  {
    agent: 'log-parser',
    label: '📋 Log Parser',
    patterns: [
      /src[/\\]pages[/\\]LogReader\.tsx/,
      /src[/\\]engine[/\\]logParser\.ts/,
      /src[/\\]store[/\\]useLogTimeline\.ts/,
    ],
    hint: 'Parser de log modificado. Verificar: linhas malformadas são ignoradas silenciosamente, timestamps são absolutos e ordenados, itens importados têm slot mapeado para ItemSlot válido.',
  },
]

function detectAgents(filePath) {
  if (!filePath) return []
  const normalized = filePath.replace(/\\/g, '/')
  return AGENT_ROUTES.filter(route =>
    route.patterns.some(pattern => pattern.test(normalized))
  )
}

function buildSystemMessage(matchedAgents) {
  if (matchedAgents.length === 0) return null

  const lines = [
    '⚡ **Agente(s) especializado(s) acionado(s):**',
    '',
  ]

  for (const a of matchedAgents) {
    lines.push(`**${a.label}** (\`.claude/agents/${a.agent}.md\`)`)
    lines.push(`→ ${a.hint}`)
    lines.push('')
  }

  lines.push('Consulte os agentes acima antes de finalizar esta tarefa.')
  return lines.join('\n')
}

async function main() {
  let input = ''
  for await (const chunk of process.stdin) input += chunk

  let toolInput = {}
  try { toolInput = JSON.parse(input) } catch { /* ignore */ }

  // PostToolUse: file_path pode estar em tool_input ou tool_response
  const filePath =
    toolInput?.tool_input?.file_path ||
    toolInput?.tool_response?.file_path ||
    toolInput?.file_path ||
    null

  const matched = detectAgents(filePath)
  const message = buildSystemMessage(matched)

  if (message) {
    process.stdout.write(JSON.stringify({ systemMessage: message }))
  }

  process.exit(0)
}

main().catch(() => process.exit(0))
