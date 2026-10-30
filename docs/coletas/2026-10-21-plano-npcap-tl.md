# Teste de viabilidade — Npcap e TL

Objetivo: verificar se a captura do tráfego do TL permite reconhecer dados
adicionais aos logs, especialmente ativação de Umbral/Luar e tentativas
rejeitadas. A existência de pacotes correlacionados não prova seu significado.

## Pré-voo executado

Em 21/10, Npcap 1.89 carregado por Python, serviço ativo; processo TL
identificado. Encontradas cinco conexões TCP estabelecidas e 27 endpoints
UDP locais naquele instante. Filtro compilado em handle offline e interfaces
enumeradas. **Nenhum pacote foi capturado nesta preparação.**

Script: `scripts/teste-npcap-tl.py` (Python padrão, sem instalar pacotes).
Sem argumentos, somente prepara e valida o filtro. `--capture` realiza
captura passiva durante 100 segundos, sem modo promíscuo e sem injetar dados.
O script lê os endpoints novamente a cada execução; não fixa IPs da sessão.
Os arquivos locais ficam em `capturas_treinamento/npcap_tl/` (ignorada pelo Git).

Atualização: usuário preferiu execução automática pelo Razer. Importar
`C:\Users\admin\Downloads\TL_TESTE_REDE_V1.xml` e atribuir ao botão de teste
com **executar uma vez**, sem alternância nem repetição enquanto pressionado.
XML gerado e validado; não instalado nem executado. Gerador:
`scripts/gerar-teste-npcap-razer.py`. Cada tecla fica pressionada por 80 ms.

## Preparação do personagem

1. Boneco de treino, mesmo equipamento e barra da build Manopla + Adaga.
2. Macro desligada e ataque automático desligado. Não usar outros ataques.
3. Ativar Eclipse manualmente antes da coleta para disponibilizar Luar em `=`.
   Confirmar visualmente a transformação. Não alternar `0` no roteiro.
4. Esperar Luar, Umbral, Golpe Sombrio e Fenda ficarem prontos.
5. Selecionar o boneco sem iniciar ataque automático; ficar parado ao alcance.
6. Ativar o log de combate. Iniciar vídeo e captura no mesmo computador.
   Usar o relógio comum e os marcadores de início dos arquivos para alinhamento;
   não assumir que o primeiro dano é o início da coleta, pois há buffs antes.

## Roteiro automático de 110 segundos

Os tempos são desde o botão físico da macro, não desde o início da captura
nem desde o primeiro dano. O Razer executa as teclas e pausas; o usuário não
precisa acompanhar cronômetro. Os primeiros 10 s são preparação, seguidos
de 15 s de referência sem habilidades. O vídeo documentará o momento real
e a entrada em recarga. Tempos programados não provam aceitação pelo jogo.

| Tempo | Ação manual |
|---|---|
| 0–24 s | Parado, sem pressionar habilidades |
| 25 s | `=` uma vez (Luar) |
| 26 s | `=` novamente; observar recarga/mensagem |
| 45 s | `-` uma vez (Umbral) |
| 46 s | `-` novamente; observar recarga/mensagem |
| 65 s | `4` uma vez (Golpe Sombrio) |
| 66 s | `4` novamente; observar recarga/mensagem |
| 85 s | `6` uma vez (Fenda) |
| 86 s | `6` novamente; pode ser uso consecutivo válido |
| 87–110 s | Parado, sem outras habilidades |
| Fim | Encerrar o log para descarregar os dados e avisar "fim" |

Não classificar automaticamente a segunda tentativa como rejeitada: se a
primeira falhou, a segunda pode ser a ativação válida. Fenda possui uso
consecutivo e deve ser interpretada separadamente. Registrar autoataques e
procs que ocorram mesmo assim; não os confundir com teclas extras.

## Captura e validação

Comando de preparação: `python scripts/teste-npcap-tl.py`.
Comando para o teste: `python scripts/teste-npcap-tl.py --capture`.
Saídas: um PCAP por interface, manifest com filtro/endpoints, contagem de
pacotes e marcadores UTC. A captura usa 180 s por padrão, com limite de
25 MiB por interface, para acomodar a espera pelo acionamento da macro.
O cronograma manual antigo permanece no manifest como referência explícita,
não como eventos executados ou marcadores de tecla.
Os dados permanecem locais. Vídeo e cópia do log serão associados ao manifest.

O filtro usa as conexões TCP identificadas e portas UDP locais do processo TL.
Não é atribuição perfeita por processo, especialmente para UDP/portas
compartilhadas. Novas conexões durante o teste podem ficar fora da captura.
Há ExitLag ativo: encapsulamento ou caminho diferente pode impedir visibilidade
útil na interface física. Nenhum resultado vazio comprova ausência de eventos.
Não alterar ExitLag durante a primeira rodada; registrar essa condição.

Critérios:

- Confirmar tráfego capturado e interfaces úteis, evitando contar duplicatas.
- Separar TCP/UDP, direção, fluxos e dados de aplicação; reconstruir mensagens
  antes de procurar campos. Um pacote não equivale a um ataque.
- Comparar eventos reais do vídeo/log com a janela ociosa e com cada ação.
- Só tratar um campo como dano após reproduzir valores variáveis e conferir
  correspondência com o log em outra captura. Tamanho/horário não bastam.
- Só tratar uma mensagem como buff/recusa após repetição e confirmação visual.
- Se os dados forem opacos por cifra/compressão/protocolo desconhecido,
  registrar a limitação; não afirmar decodificação nem concluir cifra por
  aparência aleatória. Não haverá extração de chaves, injeção ou alteração
  do processo do jogo nesta etapa.

Se houver indício verificável, repetir o mesmo roteiro antes de integrar ao app.
Este teste não é uma medição comparativa de DPS das macros V14/V16.

Referências técnicas:

- [Enumeração de interfaces Npcap](https://npcap.com/guide/wpcap/pcap_findalldevs.html)
- [Compilação do filtro](https://npcap.com/guide/wpcap/pcap_compile.html)
- [Leitura dos pacotes](https://npcap.com/guide/wpcap/pcap_next_ex.html)
