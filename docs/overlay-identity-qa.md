# Identidade e atribuição — 22/10/2026

## Verificações

- Comparar o PCAP de mundo aberto com cada acerto positivo do log: atacante único, múltiplos alvos, total e flags.
- Reproduzir a captura anterior com perfil real: nome associado ao atacante, nunca ao alvo selecionado.
- Verificar nomes/IDs e busca na aba Origens; fallback numérico quando não houver perfil.
- Verificar persistência do nome no histórico e aviso de atribuição antiga.
- Confirmar que início de captura limpa associações e que perfil inválido não vira identidade.
- Não atribuir nomes de chat/guilda às entidades de combate sem uma ligação comprovada.

## Descoberta que invalida a atribuição anterior

No opcode `0x12344a7f`, o atacante está no campo 3 e o alvo no campo 2. No secundário `0x12344a62`, o atacante está no campo 4 e o alvo no campo 2. O primeiro medidor usava o alvo como origem. O combate contra um único boneco não evidenciava a inversão.

Mundo aberto: captura `20261022-085801-488648`, 4.266 pacotes completos, cerca de 142,6 s. Os 127 acertos positivos do log correspondem a 557.501 de dano, atacante 17375758 e seis alvos. As nove linhas sem correspondência são dano zero. Crítico e pesado coincidem em todos os 127 acertos.

Perfil `0x1234787f`, caminho `1.1`: nome no campo 2, entidade do jogador no campo 19, alvo selecionado no campo 20. A associação anterior de AgrMonteiro com 31320168 estava errada: esse era o alvo. A captura de referência confirma o atacante 26790374 nos 661 acertos e no campo 19 do perfil.

A captura nova também traz nomes em outros tipos de mensagem, incluindo chat e listas; essas ocorrências não bastam para atribuir uma entidade de combate. Nenhum perfil `0x1234787f` foi recebido nessa rodada. Não há identificação completa dos demais jogadores validada.

## Compatibilidade

Análises novas usam `damageSchemaVersion: 2`. O replay migra análises antigas que preservaram ambos os IDs; rejeita as que não guardaram o atacante. Históricos antigos permanecem intactos, com aviso de atribuição potencialmente incorreta. Nomes são associados somente na captura atual e conflitos retiram a identificação.

## Resultado da validação

`python scripts/test-overlay-decoder.py`, `node scripts/test-overlay-meter.mjs`, `node scripts/test-overlay-history.mjs` e `npm run build` passaram. O teste inclui perfil truncado, nome inválido, entidade zero/fora do intervalo e perfil que não é de jogador.

Em instância Electron isolada, a reprodução real de 661 eventos mostrou AgrMonteiro / 26790374 com 2.986.995 de dano. Busca por nome encontrou a linha; busca inexistente deixou zero linhas. Histórico persistiu nome e versão 2. Evidência visual: `capturas_treinamento/overlay-identity-qa.png`.

O app normal foi reaberto, preservando layout, opacidade e visibilidade. O endpoint local continuava o mesmo da captura; a origem foi ajustada para 17375758, validada pelo log desta rodada. Esse ID não foi gravado como identidade permanente nem recebeu nome inferido do chat.
