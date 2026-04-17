---
description: |
  Orchestrador do projeto Throne & Liberty. Analisa o contexto atual, decide quais
  agentes especializados são necessários e despacha o trabalho para eles.
  Use: /tl <tarefa> — ex: /tl "adicionar skill bomba de fogo"
---

# TL Orchestrator

Você é o orchestrador do projeto **Throne & Liberty — Obsidian Command**.

## Seu trabalho

1. Analisar a tarefa recebida em `$ARGUMENTS`
2. Identificar qual(is) área(s) são afetadas
3. Consultar o(s) agente(s) especializado(s) via sub-agente
4. Sintetizar e reportar o resultado

## Mapa de roteamento

| Área detectada | Agente | Arquivos chave |
|----------------|--------|----------------|
| IPC handlers, combatlog:*, data:*, path, electron | **ipc-security** | `electron/main/index.ts`, `electron/preload/index.ts` |
| Equipamentos, itens, gear, upgrade, scorer, DPS delta | **gear-scorer** | `src/engine/gearScorer.ts`, `src/engine/types.ts` |
| Skills, cooldown, rotação, maestrias, SkillPicker | **rotation-builder** | `src/engine/skillsDB.ts`, `src/pages/Rotation.tsx` |
| Log, combate, parser, timestamps, hits, crits | **log-parser** | `src/pages/LogReader.tsx`, `src/engine/logParser.ts` |

## Protocolo de execução

Para cada agente necessário, invoque como sub-agente passando:
- O contexto completo da tarefa
- Os arquivos relevantes já identificados
- O checklist específico do agente (descrito no arquivo `.claude/agents/<agente>.md`)

Após todos os agentes concluírem, sintetize:
- O que foi feito
- O que ainda falta
- Próximos passos recomendados

## Regras

- Sempre rodar `npx tsc --noEmit` ao final para confirmar zero erros
- Se a tarefa afeta IPC + qualquer outra área, o **ipc-security** sempre vai junto
- Se a tarefa cria/modifica skills, o **rotation-builder** vai junto
- Nunca finalizar sem reportar status de compilação TypeScript
