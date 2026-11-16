# Arquitetura do overlay de combate

## Limites de responsabilidade

| Módulo | Responsabilidade | Não faz |
| --- | --- | --- |
| `electron/main/overlay.ts` | Orquestra IPC, processo de captura, janelas, persistência de preferências e ciclo de vida da leitura. | Decodificar pacotes ou decidir nomes/IDs por conta própria. |
| `scripts/npcap-overlay-worker.py` | Lê o túnel local e emite eventos estruturados, com limites de tamanho e validação básica. | Escolher o personagem do usuário ou consolidar DPS. |
| `src/engine/overlayMeter.ts` | Acumula dano, cura, alvos, tempo e snapshots; mantém o medidor de grupo por conexão. | Persistir identidade de personagem ou metadados de conexão. |
| `src/engine/overlayIdentity.ts` | Mantém a identidade local da sessão e associa ficha + perfil nominal quando o burst não é ambíguo. | Inferir o personagem pelo volume de dano. |
| `src/engine/overlaySourceRegistry.ts` | Guarda nomes, rótulos e templates de NPC efêmeros por conexão. | Sobreviver a relogin, unir IDs de conexões distintas ou inventar nomes. |
| `src/components/*` e `src/pages/*` | Apresentam estado recebido por IPC e disparam ações explícitas. | Interpretar pacote, calcular total autoritativo ou escrever arquivos diretamente. |

## Regras que não podem ser quebradas

- Uma entidade é identificada por `connectionId + entityId`; o número isolado
  nunca é global.
- Perfil nominal confirma jogador; template confirmado associa NPC. Rótulo
  observado é apenas texto auxiliar.
- A ficha reconhece automaticamente o personagem somente se um único perfil
  nominal aparecer no mesmo burst. Dois candidatos permanecem pendentes.
- Toda troca de conexão, nova leitura ou relogin limpa ID/nome/template da
  sessão anterior.
- Classificação provável ajuda a leitura do grupo, mas não escolhe o personagem
  local nem substitui evidência do protocolo.

## Testes mínimos antes de alterar o fluxo

```powershell
node scripts/test-overlay-source-registry.mjs
node scripts/test-overlay-meter.mjs
node scripts/test-overlay-collaboration.mjs
npm run build
```

Os testes de motor não dependem de Electron nem de Npcap; cada um executa o
módulo TypeScript puro com eventos artificiais. Captura ao vivo continua sendo
validada em campo, sempre sem registrar tráfego bruto no estado do renderer.
