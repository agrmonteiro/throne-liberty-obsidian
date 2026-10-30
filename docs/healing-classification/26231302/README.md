# Classificação das descrições de cura

Build: 26231302. Texto PT/EN do cliente, sem validação adicional de valores em combate.

Analisados 3860 registros de apresentação; 2857 com descrição traduzida. 102 candidatos a cura/regeneração. Contagens incluem variantes e especializações.

| Categoria | Registros |
| --- | ---: |
| Cura direta | 46 |
| Cura periódica | 13 |
| Vampirismo | 22 |
| Regeneração de Vida | 25 |
| Modificador de cura | 123 |
| Redução de cura | 91 |
| Escudo/barreira | 44 |
| Ressurreição | 16 |
| Recuperação de Mana | 114 |
| Consumo de Vida | 8 |

## Exemplos conferidos

| Registro | Classificação pela descrição |
| --- | --- |
| Toque de Cura (963905802) | Cura periódica |
| Cura Célere (951412222) | Cura direta, Modificador de cura |
| Buscador de Sangue (939721573) | Vampirismo |
| Bênção da Natureza (963774787) | Regeneração de Vida, Recuperação de Mana |
| Vigoroso (especialização sem UID de habilidade) | Regeneração de Vida, Cura periódica |

Bênção da Natureza permanece regeneração na descrição base. Vigoroso descreve cura periódica enquanto Bênção da Natureza e Toque de Cura estão ativos juntos; essa condição não é fundida à base.

A cobertura também registra as 16558 linhas de TLSkill: 2335 têm descrição traduzida associada por símbolo exato. As demais permanecem sem classificação textual.

As categorias podem se sobrepor. Modificadores, redução de cura, escudos, mana e consumo de Vida são classes separadas; não geram totais de cura por si só.

Consulte `skills.csv` para nomes, IDs, textos e vínculos. O snapshot completo preserva também os registros sem classificação em `reference/datamine/26231302/healing-descriptions.json.gz`.

Classificação baseada em texto é candidata. Só os vínculos de fórmula apresentados são exatos; isso não comprova a especialização ativa nem o comportamento do servidor.
