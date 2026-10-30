# Ícones nas barras de habilidades — 30/10/2026

## Inventário de validação

- Ícone local ao lado do nome na tabela/gráfico de habilidades do overlay, dashboard e histórico (componente compartilhado).
- Associação por nome/alias normalizado, compatível com o agrupamento atual de variantes por nome.
- Não importar o catálogo completo de habilidades no renderer; usar manifesto compacto e imagens locais.
- Preservar colunas numéricas, barras, totais, tooltip do nome completo e leitura em andamento.
- Verificar imagens carregadas, dimensões e ausência de overflow na largura atual do painel.
- Habilidade desconhecida ou imagem com falha deve usar marcador neutro, sem imagem quebrada e sem atribuir ícone incorreto.
- Ícones decorativos com alt vazio; nomes continuam acessíveis no texto.

## Assets

Catálogo público de habilidades do Questlog, consultado pelo mesmo endpoint do
importador existente. `scripts/cache-overlay-skill-icons.mjs` baixa e valida
arquivos WebP; `docs/overlay-skill-icon-sources.json` registra URLs e correspondências.

Foram armazenados 57 ícones, com 527.606 bytes no total. Variantes com o mesmo nome
recebem o mesmo ícone do grupo. Nomes sem correspondência segura permanecem com
marcador neutro; a lista está no arquivo de fontes. Não há requisição remota de
ícones durante a partida.

## Resultado

- Checagem TypeScript dos componentes e build passaram.
- Ícones reais carregaram a partir dos assets locais no renderer (`naturalWidth=200`), incluindo Raio em Cadeia, Raio do Julgamento, Toque de Desespero, Maldição Explosiva, Barragem de Bola de Fogo e Raio do Desastre.
- No gráfico real, os ícones ficaram com 16×16 px na escala atual e a tabela permaneceu com 434 px de largura, sem overflow horizontal.
- Habilidades ainda exibidas como `Habilidade <ID>` e nomes sem correspondência segura mostram o marcador neutro; os nomes completos continuam no tooltip da célula.
- Aplicação somente por reload dos renderers: captura e UUID de encontro preservados, leitura ao vivo continuou e o dano acumulado avançou de 6.274.081 para 6.532.718 durante a atualização.
- Mantida uma única instância, sem reiniciar o backend de captura. Evidência visual: `capturas_treinamento/overlay-skill-icons.png`.
