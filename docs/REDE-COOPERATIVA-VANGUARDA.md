# Rede cooperativa de combate

## Objetivo

Unir leituras de várias instalações do Command Lab durante qualquer combate:
mundo aberto, party, guilda, Vanguarda ou boss. Cada instalação continua lendo
somente os pacotes que seu próprio cliente recebeu; a rede não inventa eventos
ausentes. Quanto mais participantes usarem o app, maior será a cobertura do
grupo que estiver no mesmo encontro.

## Chave de encontro: não misturar combates

A rede é permanente, mas a consolidação não é global. O relay compara uma
impressão de encontro com dados que não dependem dos IDs locais de entidade:

- build do jogo;
- hash efêmero de zona/instância, quando esse pacote estiver decodificado;
- template confirmado do alvo principal;
- horário de início corrigido pelo relógio do relay.

Somente `mesma instância + mesmo template + início próximo` permite união
automática. Instância ou template diferentes separam os encontros. Se faltar
instância, o resultado é **ambíguo** — mesmo boss e horário não bastam — e as
leituras ficam separadas até haver uma confirmação explícita de sala. Assim,
um Daigon em outra instância nunca entra por engano no seu consolidado.

## Regra que evita duplicação

O consolidado **não soma todas as observações de grupo**. Um mesmo acerto pode
ser visto por mais de um cliente e seria duplicado. A fonte autoritativa de
cada linha é a telemetria de saída do próprio personagem do participante:

```
cliente A (personagem A) ──> contribuição autoritativa de A
cliente B (personagem B) ──> contribuição autoritativa de B
observações cruzadas         ──> nomes, templates, cobertura e diagnóstico
```

Uma origem só entra no total consolidado uma vez por sala. Se duas instalações
reivindicarem o mesmo personagem, a origem fica em conflito até o usuário
resolver a duplicidade; nunca somamos ambas automaticamente.

## MVP: relay temporário via WebSocket

O primeiro serviço será um relay WSS, não uma conexão WebRTC direta. Clientes
domésticos normalmente podem abrir uma saída WSS; WebRTC ainda exigiria
sinalização e, em muitos casos, TURN para atravessar NAT/firewalls. O relay:

- cria salas privadas por código aleatório e com expiração;
- encaminha atualizações, sem persistir combate por padrão;
- valida tamanho, frequência, esquema e identidade da conexão;
- permite reconexão com credencial efêmera e snapshot atual da sala.

O relay não interpreta pacotes do jogo e nunca recebe PCAP/corpo bruto. Em
trânsito, o transporte usa TLS/WSS. Criptografia ponta a ponta de payload é uma
extensão posterior, caso o relay seja hospedado fora de ambiente controlado.

## Dados mínimos compartilhados

Cada atualização contém somente:

- ID efêmero de sala, participante e sessão;
- apelido escolhido para a sala e consentimento ativo;
- identidade autoritativa do personagem: nome somente quando o perfil do
  protocolo confirmou o vínculo nesta conexão;
- intervalo relativo do encontro, total, acertos, habilidades e alvos;
- IDs de habilidade e template de NPC quando confirmados, com versão do
  catálogo/evidência;
- origem/segmento local somente para diagnóstico, nunca como chave global.

Não compartilhar: IP entre participantes, IDs persistentes de conta,
chat, corpo de pacote, PCAP, ficha completa, credenciais ou logs locais.

## Alvos, chefes e adds

Alvos só são fundidos entre clientes quando possuírem o mesmo template de NPC
confirmado. Entidades temporárias sem template permanecem locais ou aparecem
como alvos pendentes; uma anotação da sala pode nomear a fase, mas não altera
o dado bruto. Chefe e add continuam distintos.

## Controles da sala

- Salas privadas, sem busca pública.
- Código de convite de alta entropia, expirável e revogável; o servidor guarda
  apenas hash do código.
- Consentimento explícito antes de transmitir e botão para parar/sair.
- Anfitrião pode remover participante e encerrar a sala.
- Limites de participantes, mensagens por segundo, bytes e duração.
- Dados inválidos, fora de ordem ou que tentem declarar outro participante são
  rejeitados pelo relay.

## Entregas incrementais

1. **Motor local:** esquema, impressão conservadora de encontro, validação,
   consolidação autoritativa e conflitos; testes com participantes simulados.
   Não exige rede.
2. **UI local:** criar/entrar/sair da sala, consentimento e visão de cobertura.
3. **Relay WSS:** serviço temporário, convite, presença, reconexão e limites.
   Exige decidir a hospedagem e publicar infraestrutura.
4. **Campo:** dois participantes reais na mesma luta, seguido de três;
   comparar o consolidado com os totais individuais e revisar cobertura.
5. **Extensões:** observações cruzadas para enriquecer nomes/templates e,
   somente após validação, heurísticas de fallback claramente rotuladas.

## Critérios de aceite do MVP

- Dois participantes com personagens distintos aparecem uma vez cada e o
  total consolidado é a soma exata das duas contribuições autoritativas.
- Reentrada não duplica o participante nem seus eventos.
- Sair/revogar consentimento interrompe atualizações imediatamente.
- Mesmo ID local em instalações diferentes não é usado como identidade global.
- Conflito de personagem fica visível e excluído do total até resolução.
- Dois combates semelhantes, mas sem hash de instância, não são unidos
  automaticamente.
