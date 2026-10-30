# Menu lateral

As ferramentas ficam agrupadas por uso em `src/components/Sidebar.tsx`:

| Categoria | Ferramentas |
| --- | --- |
| Builds e atributos | Builds, Calculadora PvE, Comparador, Sensibilidade |
| Combate e logs | Overlays de dano, Leitor de Logs, Pull Ranking |
| Treino e rotação | Rotação, Laboratório de combate, Macro Razer |
| Biblioteca | Banco de Skills, Maestrias |

War Room fica acima das categorias. Configurações permanece fixa no rodapé.
As categorias podem ser recolhidas; a escolha é salva no armazenamento local do
renderer em `commandlab.sidebar.collapsed-groups.v1`. A categoria da página se
abre ao navegar por um atalho externo, como os atalhos da War Room.

Os IDs de páginas e as rotas em `src/App.tsx` permanecem os mesmos. Novas
ferramentas devem entrar na categoria correspondente em `NAV`; seus rótulos e
os títulos das categorias são traduzidos em `src/i18n/translations.ts`.
O visual e o foco de teclado ficam em `src/styles/sidebar.css`.

Validação: agrupamento dos 14 destinos, abrir/recolher por clique e Enter,
persistência após recarregar, atalho da War Room para Builds abrindo a categoria,
acesso às configurações e captura do overlay mantida durante a atualização visual.
