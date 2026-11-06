# Tier2 Command Lab v1.0.4

## Novidades da build

- Novo medidor de combate unificado, ancorado à janela do Throne and Liberty.
- Leituras de dano individual e de grupo, com detalhamento por origem, habilidade e alvo.
- Cura feita, cura recebida, buffs/debuffs, contribuição estimada de efeitos e causa mortis.
- Histórico de encontros preserva também o ranking do grupo.
- Linha do tempo para as telas que possuem eventos com horário observado.
- Importação automática de atributos da ficha para builds e para a calculadora de DPS.
- Catálogo local de habilidades, ícones, NPCs e nomes observados nos pacotes — incluindo nomes recebidos em buffs/debuffs.

## Dependências do overlay (DEV)

O medidor de combate ainda é **DEV/experimental**. Para a leitura ao vivo, instale:

- [Python para Windows, 64 bits](https://www.python.org/downloads/windows/) — validado com Python 3.14.
- [Npcap com suporte a Loopback](https://npcap.com/#download) — validado com Npcap 1.89.

Também é necessário usar o ExitLag com o Throne and Liberty ativo. O instalador do Command Lab já inclui o restante dos arquivos do app; Node.js, Git e Razer não são requisitos de uso.

## Segurança e compatibilidade

- Dependências de produção atualizadas; auditoria de produção sem vulnerabilidades conhecidas.
- Atualizações de grande versão foram preservadas para uma migração específica, evitando risco de regressão nesta build.
