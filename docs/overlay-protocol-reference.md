# Referência de protocolo do overlay

Consulte primeiro `docs/overlay-reference-index.json`. Ele aponta para a amostra
passiva de 10 minutos solicitada em 30/10/2026 e seus arquivos de referência.

## Consulta rápida

- `reference.json`: resumo, integridade observada, limites de validade e índice.
- `protocol-semantics.json`: campos já interpretados e a evidência de cada interpretação.
- `protocol-fields.json`: frequência de opcodes, caminhos de campos, tipos e valores numéricos frequentes. Coincidências com entidades são candidatas, não ligações comprovadas.
- `entities.json`: entidades separadas por conexão, papéis observados, nomes de perfis válidos e dano recebido/causado.
- `skills.json`: IDs de habilidade, nomes do dicionário existente e agregados.
- `relations.json`: relações de dano entre atacante, alvo e habilidade.
- `connections.json`: transportes, endpoints, direção, intervalo e chaves de enquadramento.
- `timeline.json`: sinais de entidade local e dano em intervalos de 30 segundos.
- `events.jsonl` e `loopback-*.pcap`: evidência original para conferir ou reprocessar.

## Regras para implementar correções

1. IDs de entidade são temporários. Nunca fixe um ID desta amostra como identidade permanente do personagem.
2. Separe geração de captura, conexão TCP e ID de encontro criado pelo app.
3. Não selecione automaticamente o primeiro atacante nem o atacante com maior dano.
4. O opcode `0x1234444a`, campo 1, coincidia com o jogador nas duas capturas antigas, mas a amostra `20261030-184651-reference` mostrou também sinais de terceiros na mesma conexão. Não comprova exclusividade local. Com nome configurado, vincular pelo perfil correspondente; ver `OVERLAY-METRICAS-E-CRONOMETRO.md`. A flag do campo 2 não define uma sessão de combate.
5. Ainda não foi identificado um ID nativo de combate confiável. Valores grandes ou estáveis em campos desconhecidos não são prova de ID de sessão.
6. Preserve inteiros grandes como strings na referência; JSON consumido por JavaScript perde precisão acima de `2^53`.
7. A amostra atual não tem log de combate independente. Nomes de habilidades vêm do dicionário anterior; extração sem erro não prova cobertura total do jogo.

## Reproduzir a indexação

```powershell
python scripts/build-overlay-reference.py --folder capturas_treinamento/npcap_tl/20261030-094453-reference --player-name AgrMonteiro
```

Nova amostragem passiva, filtrada por endpoints locais do TL e sem entradas no jogo:

```powershell
python scripts/capture-overlay-reference.py --duration 600
```

Antes de usar uma hipótese nova no decoder, compare outra captura e, quando
possível, um log de combate independente. O gerador já foi conferido contra a
referência de 661 eventos / 2.986.995 de dano.

## Catálogo local de habilidades

### Linha do tempo e candidatos de morte

Consultar [OVERLAY-CAUSA-MORTIS.md](OVERLAY-CAUSA-MORTIS.md) antes de alterar
`0x12346f6d` ou interpretar estados/HP. A flag 7=1 do dano `0x12344a7f` foi
observada na morte informada pelo usuário e comparada com mortes de NPCs;
a detecção continua experimental. O documento lista
os campos preservados, limites e testes da aba de 50 eventos.

### Nomes de NPCs e dano recebido

O spawn `0x12346f68` liga a entidade do campo 3 ao UID de NPC duplicado em
4/32 (zigzag), somente servidor → cliente. Os dois templates precisam coincidir;
o vínculo é separado por conexão e não identifica o jogador. Consultar
[OVERLAY-NOMES-DANO-RECEBIDO.md](OVERLAY-NOMES-DANO-RECEBIDO.md) para a evidência em
três capturas, regras de conflito, catálogo de NPCs e nomes descritivos de ataques.

Em 30/10/2026, o datamining da build 26231302 confirmou os nove IDs pendentes
de cajado/varinha como valores `TLSkill.UID`, ligados por símbolo às linhas de
apresentação e aos textos PT/EN. Os caminhos e a coleta completa estão em
`docs/DATAMINING-REFERENCE.md`; o catálogo compacto fica em
`reference/datamine/26231302/skill-reference.json.gz`.
Esses são IDs de habilidade, não IDs de entidade ou de sessão de combate.
A coleta estática não valida todos os campos nem comportamentos do servidor.
