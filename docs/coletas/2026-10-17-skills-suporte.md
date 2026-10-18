# Habilidades de preparação e contribuição indireta

Análise do reteste V11 em 120 s. Percentuais abaixo são apenas dano direto registrado, sem atribuir a essas skills o dano habilitado em outras fontes.

| Habilidade | Tecla | Dano direto | Função |
|---|---|---:|---|
| Golpe Sombrio | 4 | 0.53% | preparação de dano e posicionamento |
| Arremesso de Relâmpago | 8 | 0.59% | debuff e ativação de bônus de Controle |
| Dança da Espada Frenética | 7 | 1.98% | posicionamento, Nuvens e janela de ataques pelas costas |
| Fenda Enluarada | 6 | 5.59% | aplicação recorrente de Nuvens e dano |
| Injeção Letal | 9 | 3.70% | habilitador de Veneno, procs e dano condicional |
| Lança Perfurante | passiva | 0.58% | proc de maestria geral sem tecla própria |

## Golpe Sombrio

- Ativa Emboscada: ramo de +35% de dano crítico por 3 s quando crítico >= 3000; status capturado de 3042 sugere esse ramo, a confirmar durante a luta.
- Especialização ativa aplica Nuvens de Trovão por 6 s, até 20 acúmulos; texto indica redução de Tolerância 21,2 por acúmulo.
- Tooltip previamente coletado: mover-se atrás do alvo concede ataques pelas costas por 2 s.

Anteceder ataques de maior valor quando Emboscada/posição forem úteis; avaliar dano coberto na janela, não apenas dano próprio.

Validar: critério de crítico avaliado pela arma e aplicação conforme arma ativa; duração efetiva com vantagem; regra de empilhamento e renovação de Nuvens entre fontes.

## Arremesso de Relâmpago

- Ataque classificado Controle; causa dano e aplica redução de Tolerância de 155 por 6 s.
- Pode ativar Mandíbulas do Predador: Dano Base +4% por 3 s ao causar dano com habilidade de Controle.
- Causa dano encadeado sob condição de alvo Encharcado ou com Nuvens de Trovão.

Testar aplicação antes do conjunto principal de dano e renovação do debuff; não relegar ao fim por ter pouco dano direto.

Validar: confirmar renovação de Mandíbulas e duração efetiva; empilhamento da redução de Tolerância com Nuvens; não confundir redução de Tolerância com redução de Defesa; efeito no alvo de teste.

## Dança da Espada Frenética

- Especialização ativa: 3 ataques e mais um uso em até 3 s.
- Concede janela de ataques pelas costas por 2 s após movimento.
- Especialização ativa aplica Nuvens de Trovão por 6 s, até 20 acúmulos; redução de Tolerância de 20,4 por acúmulo.

Intercalar com ataques principais para aproveitar reposicionamento, acúmulos e janela de costas; segundo uso não precisa ser imediato.

Validar: validar acúmulos por golpe/uso e regra compartilhada com Fenda/Golpe; comparar espaçamento do segundo uso com tempo de animação e buffs.

## Fenda Enluarada

- Uso adicional em até 3 s.
- Especialização ativa aplica Nuvens por 6 s e reduz Tolerância em 20,8 por acúmulo, até 20.
- Nuvens contribuem para o dano condicional de Massacre e a ativação de Presas Destrutivas.

Manter efeitos e encaixar usos adicionais na janela; não pressupor proc de Chamado do Trovão na arma atual.

Validar: reconciliar coeficientes de Nuvens entre fontes; medir manutenção real e contribuição em Massacre.

## Injeção Letal

- Habilita Limite Venenoso em alvos com Injeção Letal ao ocorrer ataque pesado corpo a corpo; +3% de dano do proc por acúmulo de Veneno.
- Veneno contribui para Massacre e Presas Destrutivas/Mordida Perfurante.
- Alvo envenenado participa da geração de ataques adicionais de Espírito Umbral.
- Reativação descrita na habilidade pode consumir Veneno; não modelar todo pressionamento como renovação gratuita.

Priorizar cobertura e acúmulos ao redor dos ataques principais; não reduzir prioridade por dano direto baixo.

Validar: separar aplicação e reativação; validar consumo, dano e renovação no vídeo/log; medir cobertura de Veneno e sincronia com Umbral.

## Lança Perfurante

- Após acertar 10 Habilidades de Ataque, causa 600% do Dano Base. Máximo de 1 acúmulo por habilidade; recarga de 12 s.
- Espírito Umbral e Espírito do Trovão estão explicitamente entre as exclusões.

Otimizar indiretamente pela sequência de habilidades elegíveis; não criar tecla nem contar cada golpe múltiplo como acúmulo garantido.

Validar: reconstruir contador de ativações elegíveis e recarga; não inferir por volume de hits.

## Como avaliar a próxima prioridade

Usar uma ordem por dependências: aplicação/manutenção de Veneno e dos debuffs; janelas de Dano Base e dano crítico; ataques principais e procs; segundo uso de habilidades dentro da janela. A ordem exata depende de efeitos já ativos e de CD; não é uma sequência fixa obrigatória.

Não somar os 35% de Emboscada, 4% de Mandíbulas e 3% de Preparativos como se fossem a mesma grandeza. Não aplicar Duração da Vantagem a todo debuff. Não somar novamente status passivos já incluídos nos totais.

Métrica principal continua sendo dano em 120 s. Métricas auxiliares: dano causado dentro de Emboscada/Mandíbulas/Umbral, cobertura de Veneno e Nuvens, intensidade de acúmulos no momento de Massacre, e aproveitamento de ataques pelas costas. São necessárias ativações/estados do vídeo para atribuir contribuição indireta; o CSV de dano sozinho não identifica tudo.

A queda da V12 é compatível com perda de sinergia, mas este par de amostras não prova a causa. Não reduzir a frequência das teclas 4, 6, 7, 8 ou 9 apenas porque aparecem abaixo no ranking.


## Candidata V13: distribuição de Arremesso

O diagnóstico do reteste V11 encontra mediana de 14,995 s entre grupos de dano de Arremesso, usando separação de 750 ms para agrupar hits. Isso não comprova número de conjurações nem uptime do debuff. A recarga anteriormente capturada era 7,3 s, mas a barra de combate precisa ser reconciliada com a coleta.

Na macro V11, as 3 tentativas de tecla 8 ocorrem aos 1150, 1173 e 1196 ms. A candidata V13 redistribui as mesmas tentativas para 138, 851 e 1564 ms. Mantém 93 tentativas, ciclo de 2139 ms, pressionamento de 20 ms, intervalo de 3 ms, contagem de todas as teclas e ordem relativa das teclas diferentes de 8.

Hipótese: melhorar chance de execução quando uma janela fica disponível, sem retirar tentativas de Garras, Tempestade ou buffs. É um experimento de distribuição de inputs, não uma simulação comprovada de aumento de DPS. Candidata gerada e validada estruturalmente, ainda não instalada/testada.
