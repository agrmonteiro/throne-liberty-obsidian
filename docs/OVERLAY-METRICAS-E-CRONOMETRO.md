# Métricas, identidade e cronômetro — 30/10/2026

## Comportamento implementado

- O total continua sendo dano causado. O botão **Restaurar total no topo** mostra
  o painel e ancora sua posição no topo central da janela do TL.
- A barra superior dourada, com indicador de arraste, move cada janela. No total
  e no gráfico ela mostra um cadeado quando travada (`Ctrl+Shift+F9` para liberar).
  O gráfico mantém essa barra em todas as páginas; botões e listas ficam fora
  da região de arraste. O controle de ajustes continua podendo ser movido.
- Pausar nos overlays ou no app congela valores e tempo de todos os medidores.
  Os eventos da pausa são descartados, inclusive os que chegam atrasados.
  A captura e a identificação continuam conectadas. Pausa não usa parar/iniciar.
- O botão de pausa recebe cliques mesmo com o painel travado; o restante continua
  passando cliques ao jogo. O controle de ajustes permanece interativo.
- **Página do medidor / Página do gráfico** seleciona dano causado, dano recebido
  por fonte, dano recebido por habilidade, cura feita ou cura recebida. A seleção
  é compartilhada pelo app e pelo overlay do gráfico.
- Dano recebido usa `targetId == personagem selecionado`, com agregados separados
  por atacante e habilidade. Não soma o dano que outros atacantes causam a outros
  alvos. As duas distribuições precisam somar o mesmo total.
- Cura é **bruta, experimental e parcial**: autocuras periódicas/instantâneas cujo
  efeito está classificado como cura e cuja habilidade existe no catálogo local,
  nos formatos confirmados `0x12344a63` e `0x12344a70`. Inclui Toque de Cura,
  Bênção da Natureza e Buscador de Sangue. Não mede HP efetivamente recuperado,
  escudos, formatos ainda não reconhecidos ou cura entre jogadores. Autocura aparece em feita e recebida;
  esses dois totais não devem ser somados como se fossem eventos diferentes.

## Ocultar fora de combate

Opção disponível nos Ajustes do app e no controle flutuante, desativada por padrão.
Quando ligada, total e gráfico somem após 10 s sem dano causado/recebido pela
origem selecionada; o intervalo é ajustável entre 3 e 60 s. O próximo dano local
os revela, inclusive com medição pausada, sem alterar os valores congelados.
A captura continua ativa e as opções de visibilidade/posições são preservadas.

É uma inferência por dano observado, não uma flag nativa de combate. Dano de
terceiros e autocura periódica não prolongam a visibilidade. O controle de
ajustes não é ocultado por essa regra; durante edição (inclusive listas/popups),
histórico, reprodução ou cronômetro ativo, os painéis permanecem visíveis.
A regra geral de acompanhar o foco/janela do TL continua valendo.

O backend verifica a expiração a cada 250 ms; não depende de chegar outro pacote.
`lastCombatDamageAt` é separado do tempo/pausa/reset da medição e não é persistido
entre capturas/conexões. `overlayCombatVisible` concentra a política testável;
os testes do backend verificam também chamadas reais de mostrar/ocultar sobre
janelas Electron simuladas, sem introduzir eventos artificiais na leitura do usuário.

## Teste com cronômetro

Preparação configurável de 0–60 s; duração de 1–3.600 s. O padrão é 5 s + 60 s.
**Iniciar teste** salva a medição anterior e prepara outra com origem já selecionada.
Somente timestamps no intervalo `[início, fim)` entram nos totais. Dano durante a
preparação e a partir do instante final não entra. O denominador do DPS começa no
sinal de início, mesmo se o primeiro ataque demorar. O relógio e o resultado ficam
congelados no fim, mesmo sem chegar outro pacote.

**Interromper teste** encerra antes do prazo. **Medição livre** salva o resultado e
abre outra medição sem cronômetro. Reiniciar teste também salva o anterior.
Pausa manual fica desativada enquanto existe um teste: usar Interromper teste ou
Medição livre. Trocar de origem, resetar ou reiniciar captura cancela a janela.
Teste cronometrado exige leitura ao vivo; reprodução não arma cronômetro.

## Correção da hipótese de identidade

A captura `20261030-184651-reference` contém sinais `0x1234444a` de mais de uma
entidade na mesma conexão. Portanto, as duas capturas antigas em que esse sinal
coincidia com o jogador **não provavam exclusividade local**. Não usar o sinal
isoladamente como confirmação do personagem em ambientes com terceiros.

O campo configurável `playerName` permite vincular a seleção automática ao perfil
`0x1234787f`, cujo nome deve coincidir exatamente. Com esse nome configurado,
outros sinais `0x1234444a` não podem selecionar nem trocar a entidade. Sem nome
configurado, o app aguarda configuração/seleção manual. O método
aparece como `profile-name` no estado. A identificação continua limitada à conexão;
nenhum ID numérico desta documentação pode virar identidade permanente.

Após reiniciar, pode ser necessário abrir a ficha no jogo para o perfil reaparecer.
A interface explica isso e permite selecionar uma origem confirmada manualmente.
Nunca selecionar automaticamente o primeiro atacante ou o atacante com maior dano.

## Evidência de cura e limites

| Evento | Vínculo estático e campos observados |
| --- | --- |
| `0x12344a63` | Campo 1 zigzag = efeito `963250776`, `TLEffectProperty.WP_BO_S_RegenHeal_ContinuousHeal`, grupo `Continuous_Heal`. Campo 5 zigzag = habilidade `963905802` (Toque de Cura); variante de apresentação `963351634` admitida pelo catálogo. Campo 3 zigzag = valor candidato. Campos 2/4 são iguais na autocura. |
| `0x12344a70` | Campo 1 zigzag = efeito `939538607`, `WP_DA_Mastery_Normal_Assist_InstantHeal`, grupo `Instant_Heal`. Campo 10 zigzag = habilidade `939721573`, Buscador de Sangue. Campo 5 zigzag = valor candidato. Campos 2/3 são iguais na autocura. |
| `0x12344a63` / Bênção da Natureza | Efeito `963467735`, `WP_BO_RegenAura_Trait1_ContinuousHeal`, grupo `Continuous_Heal`. Variante heroica `963774787`; nome e ícone obtidos do catálogo completo. |

O decoder exige efeito classificado como cura, habilidade existente no catálogo
e origem igual ao alvo. O catálogo versionado `src/data/overlayHealingEffects.json`
contém 442 efeitos (55 contínuos, 40 intervalados e 347 instantâneos) e 16.556 UIDs
únicos/não nulos de habilidades. Isso classifica os efeitos; não prova que todos
os 442 já foram observados nos dois formatos de pacote reconhecidos.

Gerar com `python tools/unreal/build-healing-reference.py --build 26231302`.
`tools/unreal/update-data.ps1 -SyncOverlayCatalog` também regenera essa referência.
O main embarca o JSON e grava `data/overlay-healing-effects-reference.json` no perfil
antes de iniciar o worker com `--healing-reference`. Não depende do SQLite no
computador do usuário nem de alterar a lista de recursos do instalador.

Não classifica números negativos genéricos como cura e não estima vampirismo
simplesmente multiplicando o dano por 5%. A fórmula estática
`TLFormulaParameterNew.DA_Mastery_Normal_Assist_Buff` tem `tooltip1 = 5`, mas isso
não valida todos os modificadores de cura aplicados pelo servidor.

- Amostra de 10 min `20261030-094453-reference`: 6.173 acertos / 20.146.692 de dano
  causado e 215 acertos / 213.047 recebidos pelo personagem de referência.
- Nessa amostra, o decoder de autocura encontra 655 aplicações / 1.243.462 de cura
  bruta candidata do Toque de Cura, sem alterar os 6.392 eventos de dano globais.
- Amostra de 5 min `20261030-161705-reference`: usuário indicou Toque de Cura e HP
  cheio. Existem aplicações com valor candidato 521. Não houve confirmação visual
  independente do valor; o usuário autorizou prosseguir com a evidência encontrada.
- Amostra de 5 min `20261030-184651-reference`: 142 aplicações de Buscador de Sangue
  em duas entidades. O perfil confirma AgrMonteiro; seus 121 eventos somam 111.439.
  Os outros 21 são excluídos do seu medidor. O log `TLCombatLog-261030_184501.txt`
  fornece 500 correspondências de dano para confirmar o atacante; não é validação
  independente dos valores de cura.
- Amostra de 5 min `20261030-191646-reference`: usuário indicou Bênção da Natureza;
  82 aplicações / 135.462 de autocura bruta candidata usam o efeito `963467735` e a variante heroica
  `963774787`, no formato periódico já observado. A referência antiga das 09:44
  também tem 171 aplicações desse efeito, somando 280.443 de cura bruta candidata.

O atributo Bônus de Dano continua embutido no valor de dano observado: ainda não
há campo validado que permita decompor sua contribuição em cada acerto. Efeitos
com IDs próprios são outro caso; não apresentar uma estimativa como parcela medida.

## Ferramentas e recuperação

Consultar também `DATAMINING-REFERENCE.md` e `RECUPERACAO-DESENVOLVIMENTO.md`.
As evidências completas ficam em `capturas_treinamento/npcap_tl/` (ignoradas no Git).
Os scripts/código e este resumo ficam no Git; PCAPs e logs exigem backup separado.

```powershell
python scripts/capture-overlay-reference.py --duration 300
python scripts/audit-overlay-combat-fields.py --folder CAMINHO --name "Toque de Cura"
python scripts/audit-overlay-combat-fields.py --folder CAMINHO --name "Buscador de Sangue" --uid 939538607
node scripts/test-overlay-meter.mjs
node scripts/test-overlay-capture.mjs
node scripts/test-overlay-history.mjs
node scripts/test-overlay-layout.mjs
python scripts/test-overlay-healing.py
python scripts/test-overlay-vampirism.py
python scripts/test-overlay-framing.py
python scripts/test-overlay-decoder.py
```

O coletor agora preserva `endpoint-snapshots.jsonl`; a amostra das 16:17 não tinha
esse inventário. O auditor a marca como direção desconhecida, sem inventar direção.
O relatório de auditoria limita amostras por opcode e distingue candidatos de
validação. Os testes de PCAP precisam das respectivas capturas locais.

## Inventário de QA

- Testes de pausa longa: tempo/DPS congelados, nenhum backlog da pausa restaurado,
  reset/troca de origem sem retomar involuntariamente.
- Cronômetro: preparação excluída, início incluso, fim exclusivo, primeiro ataque
  atrasado, término sem novo pacote, cancelamento e volta à medição livre.
- Regressão de identidade: primeiro atacante indevido e sinais de terceiros não
  roubam a seleção configurada por nome; perfil correspondente autoriza seleção.
- Recebidos: distribuição por fonte/habilidade soma o mesmo total da amostra.
- Cura: pares permitidos, direção do servidor, somente autocura, retransmissão,
  pausa e isolamento de dano/DPS.
- Conferência visual/funcional no Electron: campos do cronômetro, estados de
  preparação/contagem/resultado, botões de pausa, troca de páginas, ícones,
  restauração do total e ausência de duplicação da instância principal.

## Classificação pelas descrições

Relatório e CSV em `docs/healing-classification/26231302/`. O gerador é
`tools/unreal/classify-healing-descriptions.py --build 26231302`; sua validação é
`python scripts/test-healing-description-classification.py`.

As categorias distinguem cura direta/periódica, vampirismo, regeneração,
modificadores de cura, redução de cura, escudos, ressurreição, mana e consumo de
Vida. Textos de especialização/estado e rank não são tratados como efeitos
incondicionais da habilidade base. Nomes de parâmetros internos são removidos
antes de procurar palavras no texto para evitar falsos positivos com `Heal`.

O snapshot gzip guarda os textos localizados, namespace/chaves, fórmulas,
vínculos de efeito e a cobertura das 16.558 linhas de TLSkill, incluindo as sem
descrição. Ele pode ser consultado a partir do Git sem o SQLite local; regenerar
a extração exige a base completa. Os tooltips do gráfico de cura usam o recorte
`overlayHealingSkillClasses.json` como sugestão, preservando os totais medidos.
O decoder continua exigindo os eventos e a classificação de efeitos já tratados.

Exemplos conferidos: Toque de Cura é periódica; Cura Célere é direta com redução
por uso consecutivo; Buscador de Sangue converte dano em cura. Bênção da Natureza
fala em regeneração na base; Vigoroso descreve a cura por segundo condicionada
à presença simultânea de Bênção da Natureza e Toque de Cura.
