# Pendências do overlay

## Registro automático de eventos — solicitado em 21/10/2026

- [ ] Gravar localmente cada evento aceito: horário, origem, habilidade, dano,
  crítico, pesado e categoria exclusiva do gráfico empilhado.
- [ ] Registrar início de sessão, reset manual, reset por inatividade,
  troca de origem, parada e erro da captura.
- [x] Consultar resumo e habilidades dos últimos 20 acumulados depois de fechar
  o app (`overlay-encounters.json`, implementado em 22/10). Não recupera cada
  evento de combate nem retoma a medição da sessão anterior.
- [ ] Definir rotação/tamanho máximo dos arquivos e retenção configurável.
- [ ] Distinguir eventos ao vivo de reprodução; impedir mistura de dados.
- [ ] Validar recuperação, soma por habilidade, gráfico empilhado e total
  contra o mesmo arquivo, sem duplicação após reabrir.

Estado: histórico completo de combate **pendente**. O acumulado continua em memória.
Foi implementado apenas o log auxiliar dos IDs sem nome, descrito abaixo.
Em 22/10 também foi implementada a persistência dos resumos dos últimos 20
encontros, com total e detalhe por habilidade. Histórico bruto completo permanece pendente.

## Log de habilidades sem nome — implementado em 21/10/2026

- Eventos JSONL com horário do jogo/recebimento, ID, origem, dano, crítico,
  pesado, categoria exclusiva, captura, modo live/replay e se entrou no medidor.
- Resumo JSON por ID e modo: eventos, dano recebido/contado, intervalo,
  mínimo/máximo, origens e categorias. Não atribui nome automaticamente.
- Pasta por execução em `%APPDATA%/tier2-command-lab/logs/dps-meter/unknown-skills`.
- Flush a cada segundo, a cada 250 eventos e ao parar/fechar normalmente.
  Arquivos de eventos divididos em partes de até 5 MiB; não remove históricos.
- Erro de escrita aparece no app e não encerra o medidor. Uma interrupção
  abrupta pode perder o último lote ainda em memória.
- Snapshot anterior preserva o ID 944646552 (2 acertos, 6.639 dano), sem
  reconstruir horários/flags individuais indisponíveis. Não somar esse snapshot
  novamente como se fossem eventos novos.

## Revisão em andamento

- [ ] Confirmar leitura ao vivo em combate prolongado contra um log completo.
- [ ] Validar comportamento após trocar de personagem/instância e reconectar.
- [x] Melhorar o aviso quando há captura ativa, mas origem não selecionada
  ou selecionada sem eventos enquanto outras origens causam dano; removido ID antigo fixo.
  Em 30/10, a seleção automática passou a usar o sinal de entidade local, com separação por conexão e rejeição de conexões aposentadas. Ver `overlay-tracking-qa.md` e `overlay-reference-index.json`.
- [ ] Avaliar nomes dos IDs ainda não catalogados.
  Atualização em 21/10: 147 IDs adicionados por logs exatos (180 no mapa),
  2 dos 11 desconhecidos registrados resolvidos; 9 pendentes e 2 conflitos.
  Evidências em `coletas/2026-10-21-mapeamento-habilidades-overlay.md`.
- [ ] Verificar perda de conexão e lacunas de captura sem acumular dados errados.
- [ ] Confirmar que os overlays não geram entradas na barra de tarefas, tanto
  travados quanto destravados, mantendo botões e redimensionamento utilizáveis.

Manter testes e evidências em `docs/overlay-qa.md`. Não confundir uma rodada
sem erros com garantia de cobertura de todas as habilidades/versões do jogo.
