# Inscrição, dungeon e saída de grupo — 13/11/2026

## Objetivo

Investigar se a inscrição de dungeon, a entrada na instância ou a saída do
grupo expõem uma chave compartilhada que possa vincular automaticamente
instalações do Command Lab à mesma sala cooperativa.

## Coletas locais preservadas

| Janela | Ações relatadas | Pacotes | Bytes PCAP |
|---|---|---:|---:|
| `20261113-101122-550727` | inscrição, localização do grupo e entrada | 10.834 | 1.450.710 |
| `20261113-101636-236605` | dungeon, encerramento e saída do grupo | 21.653 | 4.687.070 |

As duas janelas duraram aproximadamente 300 s. Os PCAPs ficam somente em
`capturas_treinamento/npcap_tl/`, que não é publicado pelo Git.

## Resultado da leitura atual

**Nenhuma chave de instância, inscrição, dungeon ou grupo foi identificada com
evidência suficiente.** Isso é um resultado negativo útil: os dados atuais não
autorizam criar uma sala cooperativa automática com base em boss, horário ou
coincidência numérica.

Na primeira janela, o indexador incremental encontrou 11 envelopes, em sete
opcodes, no sentido observado do loopback:

- `0x12344a7d` (2 mensagens);
- `0x12347a7b` (1);
- `0x12347a78` (4);
- `0x12344c78` (1);
- `0x12347f74` (1);
- `0x12346878` (1);
- `0x12346849` (1).

Os corpos desses envelopes não validaram como Protobuf no ponto capturado.
Assim, não há campos numéricos ou textos que possam ser chamados de ID de
inscrição/instância. Os destinos físicos observados usavam TCP/443, e o
loopback estava entre portas locais do túnel; ambos podem transportar dados
encapsulados ou já cifrados pelo ExitLag.

O analisador offline legado também parou no início de um fluxo porque pressupõe
que o primeiro segmento do PCAP coincida com o início de um frame. Esta coleta
começou com conexões já abertas, portanto essa premissa não vale. O indexador
incremental ressincronizou alguns envelopes, mas ainda não decodificou seus
corpos.

## Conclusões seguras

- A inscrição continua sendo uma boa fonte para criar uma **sala candidata**,
  mas não é uma prova de mesma instância nesta coleta.
- Não usar IDs de porta, conexão TCP, entidade local, opcode ou horário como
  chave global de encontro.
- A rede cooperativa deve manter associação explícita/ambígua até surgir um
  identificador compartilhado validado entre pelo menos dois clientes.

## Próxima coleta recomendada

Iniciar a captura antes de abrir o jogo ou antes de o ExitLag estabelecer o
túnel, mantendo-a desde o login até a entrada na dungeon. Isso preserva o
handshake e os dois sentidos completos de cada fluxo. Comparar duas instalações
na mesma dungeon e, em seguida, duas instâncias simultâneas da mesma dungeon.

Campos candidatos só poderão ser promovidos se forem iguais entre clientes na
mesma instância e diferentes entre instâncias/pulls distintos.

## Coleta dinâmica pós-login (10 minutos)

A coleta `20261113-120608-806130` usou filtro de endpoints atualizado a cada
dois segundos: 6.637 pacotes, 29 fluxos e 117 alterações observadas no conjunto
de endpoints do processo TL. Ela começou logo após o login, portanto não inclui
o handshake de autenticação.

Uma análise de pontos de mudança robustos (mediana/MAD sobre volume por segundo)
e ciclo de vida dos fluxos encontrou duas conexões dominantes do túnel local:

| Intervalo desde início | Fluxo local observado | Dados |
|---|---|---:|
| 0,06–313,97 s | porta local 11000 para par local 62686 | 1.546.078 bytes |
| 334,27–599,62 s | porta local 11000 para par local 52048 | 240.866 bytes |

Há uma troca de par do túnel entre aproximadamente 314 e 334 s, acompanhada de
pico de tráfego e mudança de endpoints. Isso é **candidato de transição de
transporte/proxy**, não evidência de entrada, fim de dungeon, grupo ou instância.
As muitas conexões TCP/443 curtas são compatíveis com serviços auxiliares e não
devem ser usadas como identidade de encontro.

O PCAP observou essencialmente TCP encapsulado; o payload não expôs um campo de
sessão decodificável. Assim, a conclusão permanece: não criar nem unir salas
cooperativas a partir de portas, 5-tuplas, volume ou picos. O algoritmo e seus
artefatos locais ficam em `scripts/analyze-session-context.py` e
`session-context-analysis.{json,md}` dentro da pasta da captura.

## Comparação após reativar o ExitLag

Uma segunda dungeon, em `20261113-141043-135022`, foi registrada pelo mesmo
coletor dinâmico após a reativação do ExitLag. O algoritmo de fluxo e pontos de
mudança confirma uma variação material de transporte:

| Métrica | Coleta anterior | ExitLag reativado |
|---|---:|---:|
| Pacotes IP TCP/UDP analisados | 6.637 | 23.927 |
| Fluxos distintos | 29 | 89 |
| Pontos de mudança de tráfego | 33 | 52 |
| Fluxo dominante | porta 11000, 1,55 MB | porta 57206, 2,39 MB |

Na coleta com ExitLag reativado, o fluxo dominante aparece entre 51,62 e
275,66 s e é sucedido por outro par local entre 280,39 e 598,21 s. A troca é
mais curta que a observada antes, mas ainda é uma alteração do túnel local.
Ela demonstra que o coletor acompanha o transporte após a reativação; não
prova que a mudança seja início/fim de dungeon, grupo ou sessão compartilhada.

Conclusão: a topologia do ExitLag é variável entre execuções e não pode entrar
na chave cooperativa. Ela é útil somente para orientar onde procurar o payload
do protocolo, de preferência antes da encapsulação ou em uma captura iniciada
antes do login.
