# Laboratório de combate — Manopla + Adaga

## Objetivo e limites da evidência

Comparar uma prioridade de uso planejada com pulls reais, separando o que foi
medido no log do que foi estimado a partir de telas, build e modelo de dano.
`DamageDone` confirma dano e horário do acerto; não confirma tecla pressionada,
falha de input, buff ativo, alvo fora de alcance ou momento exato do cast.
Esses estados precisam vir de captura visual revisada ou permanecer como hipótese.

## Etapas verificáveis

1. **Inventário por build.** Associar build, duas armas, atributos, itens,
   poderes, maestrias, passivas, especializações e barra. Cada entrada tem origem
   (`build`, catálogo, OCR, log ou manual), print/texto de evidência, data e
   estado (`pendente`/`revisado`). Nunca aplicar bônus pendentes ao cálculo.
2. **Coleta visual.** O caminho preferido é gravar um vídeo curto percorrendo
   armas, itens, skills, passivas, maestrias e atributos, mantendo cada tooltip
   aberto por pelo menos 2 segundos. O laboratório abre o vídeo local, amostra
   quadros em intervalo ajustável, mostra uma galeria e deixa salvar os quadros
   úteis. O OCR pode ser limitado ao retângulo do tooltip. Também é possível
   detectar a janela do jogo e dimensões e capturar a tela sem a sobreposição
   do app. A entrada virtual comum não acionou os menus, mas uma macro Razer
   Synapse acionada no mouse físico abriu as telas de personagem e habilidades.
   A navegação por coordenadas exige calibração; preferir atalhos confirmados.
   Nunca aplicar OCR ao cálculo sem revisão.
3. **Linha do tempo observada.** Reaproveitar parser de log e segmentação de
   pulls; agrupar hits em casts somente quando a janela de agrupamento for
   conhecida. Exibir dano e DPS por skill e residual de itens/procs.
4. **Modelo planejado.** Reaproveitar `calcSkillAvgDamage`, mas calcular
   disponibilidade por cooldown, duração de vantagem, buffs, tempo de animação,
   latência de 100 ms e probabilidade de falha de pressionamento. Modelar
   pressão de prioridade alta como 5 tentativas para 1 de prioridade baixa;
   tentativas não são casts garantidos.
5. **Refinamento.** Comparar DPS, dano/cast, frequência de cast e uptime entre
   plano e log. Ajustar apenas parâmetros identificáveis; mostrar erro residual
   e lacunas de evidência. Não atribuir todo residual a uma única skill/buff.

## Protocolo de comparação entre builds

Gravar um combate contínuo de 2 minutos por build contra o mesmo alvo, com a
mesma configuração de grupo e condições. Importar cada log, selecionar o
personagem e salvar o pull. O app separa dano e DPS de 0–60 s e 60–120 s; a
ordenação final usa o dano total acumulado nos primeiros 120 s. A janela começa
no primeiro hit registrado, não no comando de iniciar a macro. O log registra
somente `DamageDone`; teclas, buffs ativos e falhas de input são inferências.

## Mapa inicial do menu F11 (observado em 17/10/2026)

| Dados | Entrada visível no menu | Verificação pendente |
| --- | --- | --- |
| Armas, itens e núcleos | Inventário | Confirmar tela de equipamento e tooltip de cada núcleo |
| Skills e especializações | Habilidades (K) | Confirmar abas de evolução/especialização |
| Passivas e alocação | Habilidades (K) | Confirmar lista e níveis atuais |
| Maestria | Maestria de Armas | Confirmar nós ativos e pontos |
| Atributos e substatus | Inf. de Personagem (P), Característica | Confirmar painel completo de status |
| Opções que alteram combate | Configurações de Combate | Confirmar se afetam a medição |

### Validação do roteiro Razer (17/10/2026)

- `TL_MENU_TESTE`: abriu Informações de Personagem, confirmado pelo usuário.
- `TL_COLETA_NAV_V1`: abriu Passe de Batalha em vez de Habilidades. Roteiro
  reprovado; não reutilizar os cliques sem calibrar a sequência de movimentos.
- `TL_COLETA_NAV_V2`: Escape seguido de K fechou o Passe de Batalha e abriu
  Habilidades, confirmado pelo usuário e pela captura da tela.
- `TL_COLETA_SKILLS_V3`: percurso dos 12 slots ativos e 8 passivos do preset
  `manopla_farm`, com pausa de 3 s por tooltip, terminando na aba de
  especializações. Execução confirmada pelo usuário; vídeo gravado e 20
  quadros separados em `capturas_treinamento/skills_v3`, com recortes e OCR.
  O manifesto `coleta.json` associa cada slot à evidência. A amostragem visual
  confirmou tooltips legíveis; valores numéricos continuam pendentes de revisão.
  O preset está fora do Eclipse: registrar também as formas transformadas.
- `TL_COLETA_ITENS_V4`: roteiro preparado para abrir P e consultar as duas armas
  e os 13 slots de equipamento, com 4 s por tooltip. Usuário relatou que nem
  todos os tooltips apareceram. Cobertura incompleta; não tratar como validado.
- `TL_ITENS_V5`: acrescenta duas oscilações de 8 px para cada lado dentro de
  cada ícone, com 2 s de pausa após cada oscilação. Mantém o centro ao terminar.
  Usuário confirmou que apenas um anel não mostrou tooltip; cobertura incompleta.
- `TL_ITENS_V6`: mantém a primeira passagem e desloca a segunda 6 px para cima,
  preservando as oscilações laterais. Execução gravada; os dois tooltips dos anéis
  foram confirmados visualmente aos 65 s (Crepúsculo Submerso) e 70 s (Amanhecer).
  Evidências em `capturas_treinamento/itens_v6/coleta.json`. Atributos numéricos
  e cobertura dos demais itens ainda precisam de revisão. O preset de equipamento
  visível é `manopla_plat`; manter separado do nome do preset de habilidades.
- Gerador: `scripts/gerar-coleta-razer.py`. Coordenadas absolutas do ambiente
  observado (janela 2560 × 990); mover ou redimensionar exige nova calibração.
  Execução única por botão físico do mouse. Não altera a alocação da build.

### Catálogo revisado desta captura

`docs/coletas/2026-10-17-manopla-adaga.json` registra 12 recargas observadas e
os textos conferidos de Emboscada, Batalha, Nove Vidas e Massacre. A adaga do
vídeo usa Emboscada; não aplicar Chamado do Trovão da arma anterior a esse snapshot.
Recargas vistas no personagem não devem ser tratadas automaticamente como base
e reduzidas novamente pelo status de recarga. As formas de Eclipse e as regras
de empilhamento continuam pendentes; os efeitos condicionais ainda não entram
numericamente no cálculo.

O painel esquerdo de Habilidades reúne efeitos de material, de equipamento,
pedra preciosa, guardião e transcendência. `TL_NUC_V8` foi preparado para esses
12 ícones, complementar luvas/calças e tentar abrir os detalhes do personagem.
Instalação e execução ainda pendentes. `TL_MEST_V7` também está preparado para
consulta das maestrias das duas armas; ainda não foi instalado ou executado.

`TL_COLETA_V9` reúne o painel de efeitos e as especializações das duas categorias
equipadas: I (Manoplas) e II (Adagas). Registra uma visão geral de cada arma e
consulta os tooltips das opções vistas como selecionadas nas capturas do preset
`manopla_farm`. Clique somente na aba, categoria e título da skill; os círculos
de especialização recebem hover, sem alteração de alocação. Se a seleção mudar,
revisar o roteiro. A duração nominal é 248,5 s. XML conferido; instalação e teste
no jogo pendentes. Não confundir essa etapa com Maestria de Armas.

As associações além dos nomes visíveis precisam ser verificadas no vídeo de
coleta antes de alimentar o cálculo.

## Modelo de cálculo

- Cooldown efetivo = cooldown base / (1 + velocidade de recarga / 100),
  sujeito às regras já usadas pelo motor de rotação.
- Duração efetiva de vantagem = duração base × (1 + duração da vantagem / 100).
- Tentativas são espaçadas por pelo menos 100 ms. Uma tentativa só vira cast
  quando a skill está pronta, o personagem não está ocupado e o input registra.
- Buffs, passivas e poderes entram em camadas explícitas. Bônus que não têm
  fórmula verificada permanecem anotados sem contribuição numérica.
- O comparativo usa o mesmo pull, alvo e duração. Proc/DoT tem linha própria
  para evitar somar seu dano duas vezes.

## Critérios de validação

- Um perfil incompleto não produz um “DPS exato”: deve mostrar intervalo ou
  resultado provisório e a lista de entradas pendentes.
- Alterar um cooldown, buff ou taxa de falha deve mudar somente as projeções
  dependentes dele; os números do log permanecem imutáveis.
- A captura mostra o print obtido e o texto OCR antes de qualquer valor ser
  aplicado. O roteiro Razer só avança para coleta completa depois de validar
  coordenadas, foco e legibilidade; entrada virtual comum continua sem validação.
- O app deve explicar por skill a diferença entre número planejado, observado
  e parcela ainda não explicada.
