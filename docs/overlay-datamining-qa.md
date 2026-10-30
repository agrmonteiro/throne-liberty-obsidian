# Datamining e ícones por ID — 30/10/2026

Coleta da build 26231302: detalhes e caminhos em `DATAMINING-REFERENCE.md`.

- Chave pública da fonte fixada validada em 118 contêineres criptografados.
- Todas as 1.444 tabelas do cliente preservadas em raw e JSON; PT/EN decodificados.
- SQLite: 444.051 linhas de tabelas, 326.618 traduções, 609.542 referências por
  símbolo, 595.430 referências de recursos; `integrity_check = ok`.
- Foram preservados 11.662 PNGs e 1.414 recursos de metadados visuais.
- `verify-reference.py` passou: hashes, estruturas/CRCs/deflate de todos os PNGs,
  consistência das contagens e nove vínculos estáticos de IDs conhecidos.
- Snapshots gzip dos catálogos, maestrias, cores e inventário têm hashes no
  `reference/datamine/26231302/index.json`; consulta sem exports locais testada.
- Planos de recuperação reproduzem 1.446 fontes (tabelas + PT/EN) e 13.076
  recursos visuais. Fonte pública da chave e sintaxe PowerShell também testadas.

## Correção do ataque básico

O arquivo do jogo fornece `S_WP_BO_BasicShot` para arco e `S_WP_CR_BasicShot`
para besta, embora ambos se chamem Disparo Básico. Cajado e varinha têm ícones
próprios de Esfera de Mana. O importador anterior só consultava habilidades
do catálogo público e buscava ícone pelo nome; esses ataques ficavam sem mapa.

Agora o catálogo offline tem 3.091 IDs positivos com nomes PT/EN e 1.342 ícones
locais para as linhas com apresentação. Nomes curados têm prioridade por ID.
O motor conserva `skillIds` e `iconFile` e agrupa por nome + ícone, preservando
as somas sem fundir armas/variantes com ícones diferentes. Os totais por tipo de
dano, crítico/pesado, resets e identidade local mantêm o comportamento anterior.

Miniaturas do app: WebP até 128×128, qualidade 90, aproximadamente 9,1 MB para
os 1.342 ícones. PNGs originais completos permanecem no arquivo local.

## Verificação do app

- Testes do motor cobrem separação por arma, agrupamento de IDs da mesma
  apresentação, cópia defensiva dos IDs e atualização de nomes sem mudar total.
- Fixtures reais: arco 947551927, besta 947525562, varinha 951925391 e cajado
  968862069; quatro ícones próprios e arquivos locais existentes.
- Catálogo real confirma Raio do Julgamento/Uso consecutivo e os três ícones
  dos usos de Serial Fire Bombs; os nove IDs pendentes de cajado/varinha foram
  resolvidos pelo vínculo UID → símbolo → UI → tradução.
- Backend de produção em memória manteve a referência de 6.173 acertos e
  20.146.692 de dano local, sem incluir outros atacantes.
- Checagens TypeScript dos arquivos do overlay e build do Electron passaram.
- Histórico de 10.432.791 de dano salvo antes da atualização. Mantida uma única
  instância; leitura reiniciada para carregar os IDs de origem no backend.
- A conferência visual do ataque básico ao vivo depende de novos ataques do
  usuário; ainda sem eventos na primeira leitura após o reinício.

Registros antigos já agrupados por nome sem IDs não permitem reconstruir a
arma/variante de cada parcela. O novo agrupamento só pode ser exato quando os
IDs originais estão presentes; não adivinhar esses dados em históricos antigos.
