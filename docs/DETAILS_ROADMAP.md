# Roteiro: overlay de combate inspirado no Details

## Objetivo

Uma única janela ancorada ao Throne and Liberty para navegar a cadeia
`segmento -> grupo -> jogador -> habilidade -> alvo`, sem inferir nomes ou
misturar IDs de conexões diferentes.

## Princípios de dados

- A identidade de uma entidade é `connectionId + entityId + ciclo de vida`.
- Perfil nominal confirma jogador; template confirma NPC; catálogo confirma
  habilidade. Sem evidência, o ID continua pendente.
- A qualidade do NPC vem do campo explícito `CreatureRank` do template do
  cliente: Boss/BossWorld, PartyChampion, Solo/PartyElite ou sem qualidade
  especial. O identificador interno só é uma reserva para builds que não
  tragam esse campo, e aparece como **pista do template**.
- Um efeito ou buff não recebe o nome de uma habilidade sem vínculo explícito
  no protocolo.
- Histórico nunca funde conexões apenas por ID numérico ou por frequência.

## Marcos

### 1. Janela única — concluído

- O padrão agora abre somente a janela principal de combate.
- O modo inicial é **Grupo**; **Meu dano** preserva as métricas individuais.
- A janela de grupo expande cada origem por habilidades ou por alvos.
- O modo legado ainda existe apenas para compatibilidade e cobertura de testes.

### 2. Segmentos — em validação

- Registrar início/fim por sinal de combate e manter fallback por inatividade. **Concluído.**
- Exibir um seletor global de segmentos no topo. **Concluído:** cada segmento
  mantém seu próprio acumulado, sem reutilizar a leitura total.
- Separar trash, miniboss e chefe pelo alvo/template e pelo intervalo de combate.
  **Concluído para a classificação:** o alvo dominante usa `CreatureRank`;
  falta validar a apresentação em uma nova captura de campo.
- Não nomear fases automaticamente sem um sinal observável; aceitar marcador
  manual quando necessário.

### 3. Detalhe no estilo Details

- Ranking principal de jogadores confirmados.
- Navegação por clique: jogador, habilidade e alvo, com botão voltar.
- NPCs, pendências e conflitos em áreas próprias, fora do ranking de grupo.

### 4. Métricas unificadas

- Dano causado, cura feita, cura recebida e dano recebido na mesma estrutura.
- Buffs/debuffs e causa mortis associados ao segmento correto.

### 5. Validação de campo

- Grupo de 12, trash, miniboss e chefe de duas fases.
- Cura externa, vampirismo, reconexão e troca de mapa.
- Relatório de cobertura: nomes confirmados, templates, skills pendentes e conflitos.

## Critério de aceite final

Uma luta selecionada mostra totais consistentes por jogador, habilidade e alvo;
todos os rótulos indicam sua evidência, e dados sem confirmação permanecem
visíveis como IDs pendentes em vez de receberem nomes estimados.
