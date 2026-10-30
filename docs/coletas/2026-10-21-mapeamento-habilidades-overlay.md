# Atualização dos nomes do medidor

Objetivo: localizar IDs sem nome por correspondência exata em logs de combate,
sem inferir nomes a partir de dano, ordem de uso ou semelhança de IDs.

Foram lidos 30 arquivos de combate locais. O mapa passou de 33 para 180 IDs
(147 adições). Nomes incluem habilidades, efeitos, ataques e variantes; não
representam 180 habilidades únicas. Tags de formatação do jogo foram removidas.

Dos 11 IDs registrados como desconhecidos, confirmados:

| ID | Nome explícito no log |
|---|---|
| 953371309 | Marca de Detonação |
| 968554562 | Disparo no Ponto Fraco |

Permanecem sem correspondência exata: 944646552, 948220364, 964225722,
964291252, 964356779, 964684477, 986899323, 987161441, 988210195.
É necessário um log de combate que contenha esses eventos para confirmar nomes.

Conflitos: 940591022 e 941039175 aparecem como Acerto Crítico e Espetada Rápida.
O processo não escolhe por maioria nem substitui cadastros existentes nesses casos.
O nome anterior de 941039175 foi mantido para revisão; 940591022 continua pendente.

Auditoria por ID, quantidade de eventos e arquivos em
`resultados/overlay-skill-mapping.json`. Script repetível:
`scripts/atualizar-nomes-overlay.py --logs <pasta> --unknown <pasta> --apply`.
Não altera atributos, cooldowns ou coeficientes do catálogo de builds.

## Validação planejada

- Correspondência exata e ausência de substituição nos conflitos.
- Reexecutar o cruzamento sem gerar novas adições ou duplicar o mapa.
- Manter total, acertos e categorias ao atualizar nomes no acumulado aberto.
- Agrupar variantes que recebam o mesmo nome; preservar IDs ainda pendentes.
- Reprodução pela interface em perfil de QA: nomes novos e pendentes visíveis.
- Prévia e janela de habilidades sem corte de nomes/números; captura visual.
- Cenários adicionais: ID sem correspondência continua visível e nenhum
  evento de QA entra no perfil normal; acumulado normal preservado no reload.

## Resultado da validação

Build e testes do motor passaram. Reexecução: zero novas adições, 180 IDs,
dois conflitos. Testes cobriram agrupamento de variantes, ID sem nome e ausência
de alteração do total/estado original ao aplicar nomes novos.

Reprodução pela interface em perfil isolado mostrou Marca de Detonação (100),
Disparo no Ponto Fraco (200) e Habilidade 944646552 (50), total 350 e 3 acertos.
Nomes, barras e números revisados em `capturas_treinamento/overlay-nomes-atualizados.png`;
sem corte horizontal, largura de 700 px na prévia. O perfil de QA foi fechado.
Renderers normais recarregados sem reiniciar captura; o acumulado nessa hora
era zero e permaneceu zero. O helper também permite resolver IDs já acumulados.
O cadastro numérico embarcado passa a ser usado pelo processo principal no
próximo início; a exibição aberta já usa o mapa novo, sem necessidade de reset.
