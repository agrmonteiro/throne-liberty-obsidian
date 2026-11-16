# Roteiro: overlay de combate inspirado no Details

## Objetivo

Uma única janela ancorada ao Throne and Liberty para navegar a cadeia
`segmento -> grupo -> jogador -> habilidade -> alvo`, sem inferir nomes ou
misturar IDs de conexões diferentes.

## Princípios de dados

- A identidade de uma entidade é `connectionId + entityId + ciclo de vida`.
- Perfil nominal confirma jogador; template confirma NPC; catálogo confirma
  habilidade. Sem evidência, o ID continua pendente.
- A ficha de atributos é o gatilho natural de identidade da sessão: ao receber
  seus status, o app associa apenas o perfil nominal único do mesmo burst ao
  ID local. O vínculo é apagado em nova leitura, troca de conexão ou relogin;
  dois perfis no mesmo burst são tratados como ambíguos.
- Classificação provável não requer curadoria manual: um classificador
  bayesiano local aprende somente das origens que o protocolo confirmou por
  perfil/template e usa a distribuição de habilidades de arma e skills
  exclusivas de NPC. Com poucas amostras, o fallback conservador mantém o ID
  pendente em vez de inventar um rótulo.
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

### 6. Vanguarda e chefes com adds — próximo marco

- A expedição de 08/11 confirmou que o medidor recebe o dano de membros fora
  da party local, mas somente seis origens receberam perfil nominal. As demais
  devem permanecer no ranking como **origens observadas sem nome**; não são
  removidas nem recebem um nome inferido.
- Exibir cobertura de identidade por segmento: jogadores confirmados,
  atacantes sem nome, NPCs/template e conflitos.
- Investigar somente pacotes de roster/spawn/aliança que apresentem vínculo
  explícito entre ID e nome. Não usar OCR, chat, proximidade, ordem da lista
  ou volume de dano para relacionar jogador e entidade.
- Modelar chefe e add como alvos distintos dentro da mesma fase. O relatório
  da coleta Porfos/Manticus/Daigon está em
  [coletas/2026-11-08-vanguarda-manticus.md](coletas/2026-11-08-vanguarda-manticus.md).

### 7. Rede cooperativa de combate — em preparação

- A rede cobre qualquer combate (mundo aberto, party, guilda, Vanguarda e
  chefes), mas não mistura telemetria apenas por nome de chefe ou horário.
- Cada instalação compartilha exclusivamente o acumulado autoritativo do seu
  próprio personagem; observações de outros jogadores servem para cobertura e
  nomes, nunca para somar o mesmo acerto duas vezes.
- O pareamento automático exige build, hash efêmero de instância, template de
  alvo e janela de início compatíveis. Sem hash de instância o encontro fica
  ambíguo e separado até a sala receber confirmação explícita.
- O motor local e seus testes ficam descritos em
  [REDE-COOPERATIVA-VANGUARDA.md](REDE-COOPERATIVA-VANGUARDA.md). Antes de
  publicar o relay WSS, falta localizar e validar o sinal de zona/instância
  no protocolo.

## Critério de aceite final

Uma luta selecionada mostra totais consistentes por jogador, habilidade e alvo;
todos os rótulos indicam sua evidência, e dados sem confirmação permanecem
visíveis como IDs pendentes em vez de receberem nomes estimados.
