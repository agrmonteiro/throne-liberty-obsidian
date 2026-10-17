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
   do app. O teste de entrada virtual no TL não acionou os menus nesta sessão;
   por isso o fluxo de coleta usa o vídeo e não afirma navegação automática.
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

O menu foi capturado, mas a entrada virtual não abriu essas telas nesta sessão.
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
  aplicado. O controle automático do mouse fica fora do fluxo enquanto o jogo
  rejeitar a entrada virtual.
- O app deve explicar por skill a diferença entre número planejado, observado
  e parcela ainda não explicada.
