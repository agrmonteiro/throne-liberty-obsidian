"""Analisa a segunda sessão anexada ao log da V11, sem misturar combates."""
import csv
import json
import shutil
import statistics
from collections import defaultdict
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'capturas_treinamento/combate_v13_2026-10-17'
SOURCE = Path(r'C:\Users\admin\AppData\Local\TL\Saved\CombatLogs\TLCombatLog-261017_220155.txt')
OUT.mkdir(parents=True, exist_ok=True)
shutil.copy2(SOURCE, OUT / SOURCE.name)
rows = []
for row in csv.reader(SOURCE.open(encoding='utf-8-sig')):
    if len(row) >= 10 and row[1] == 'DamageDone' and row[8:10] == ['AgrMonteiro', 'Boneco para Prática']:
        rows.append((datetime.strptime(row[0], '%Y%m%d-%H:%M:%S:%f'), row))
rows.sort()
sessions = []
for timestamp, row in rows:
    if not sessions or (timestamp - sessions[-1][-1][0]).total_seconds() > 30:
        sessions.append([])
    sessions[-1].append((timestamp, row))
assert len(sessions) == 2, 'Rever manualmente a separação de sessões.'
session = sessions[1]
start = session[0][0]
assert start.isoformat() == '2026-10-17T22:20:33.299000'
window = [((t - start).total_seconds(), r) for t, r in session if (t - start).total_seconds() < 120]
skills = defaultdict(lambda: dict(damage=0, damageEvents=0, critEvents=0, heavyEvents=0))
for elapsed, row in window:
    skill = skills[row[2]]
    skill['damage'] += int(row[4])
    skill['damageEvents'] += 1
    skill['critEvents'] += int(row[5] == '1')
    skill['heavyEvents'] += int(row[6] == '1')
total = sum(s['damage'] for s in skills.values())
result = dict(macro='V13', sourceLog=str(SOURCE), sessionIndex=1,
              video=r'C:\Users\admin\Downloads\TL_COMBATE_V13_2026-10-17.mp4',
              windowStartLogTime=start.isoformat(), windowDurationSec=120,
              totalDamage=total, dps=total / 120, damageEvents=len(window),
              fullSessionSpanSec=(session[-1][0] - start).total_seconds(),
              lastWindowDamageSec=window[-1][0], skills=dict(skills),
              damageByMinute=[sum(int(r[4]) for t, r in window if a <= t < a + 60) for a in (0, 60)],
              cumulativeDamageBySec={str(end): sum(int(r[4]) for t, r in window if t < end) for end in (15, 30, 60, 90, 120)})
baseline = json.loads((ROOT / 'capturas_treinamento/comparacao_v11_v12_2026-10-17/comparacao-120s.json').read_text(encoding='utf-8'))['baseline']
result['deltaDamageVsV11'] = total - baseline['totalDamage']
result['deltaPctVsV11'] = (total / baseline['totalDamage'] - 1) * 100
result['skillDeltasVsV11'] = [dict(skill=k, damage=v['damage'], baselineDamage=baseline['skills'].get(k, {}).get('damage', 0),
                                            deltaDamage=v['damage']-baseline['skills'].get(k, {}).get('damage', 0))
                                   for k, v in sorted(skills.items(), key=lambda x: -x[1]['damage'])]
diagnostics = {}
for name in ['Arremesso de Relâmpago', 'Golpe Sombrio', 'Dança da Espada Frenética', 'Fenda Enluarada']:
    times = [t for t, r in window if r[2] == name]
    groups = []
    for t in times:
        if not groups or t - groups[-1][-1] > .75:
            groups.append([])
        groups[-1].append(t)
    intervals = [b[0] - a[0] for a, b in zip(groups, groups[1:])]
    diagnostics[name] = dict(firstDamageSec=times[0] if times else None,
                            damageGroups=len(groups), medianGroupIntervalSec=statistics.median(intervals) if intervals else None,
                            maxGroupIntervalSec=max(intervals) if intervals else None,
                            groupStartSec=[g[0] for g in groups])
result['supportDiagnostics'] = diagnostics
result['limitations'] = ['Uma tentativa por versão; condições de buff não certificadas.',
                        'Grupos separados por 0,75 s são diagnósticos de dano, não contagem de usos.',
                        'O log não mede diretamente duração dos buffs/debuffs nem falhas de pressionamento.',
                        'A V13 está na segunda sessão do mesmo arquivo da V11; janela final exclusiva.']
(OUT / 'analise-120s.json').write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
report = ['# Comparação V13 com V11', '',
          f"Primeiros 120 segundos desde o primeiro dano: **{total:,}** de dano e **{total / 120:,.2f} DPS**.",
          f"V11 controle: {baseline['totalDamage']:,.0f}; diferença: **{result['deltaDamageVsV11']:+,.0f} ({result['deltaPctVsV11']:+.2f}%)**.", '',
          f"Minutos: {result['damageByMinute'][0]:,} / {result['damageByMinute'][1]:,}.", '',
          '| Habilidade | V11 | V13 | Diferença |', '|---|---:|---:|---:|']
for item in result['skillDeltasVsV11']:
    report.append(f"| {item['skill']} | {item['baselineDamage']:,.0f} | {item['damage']:,} | {item['deltaDamage']:+,.0f} |")
report += ['', '## Interpretação', '',
           'V13 redistribui as três tentativas de Arremesso no ciclo, mantendo frequências e tempos das demais teclas da V11. O resultado é descritivo e não estabelece causalidade ou estabilidade.', '',
           'Arremesso: intervalo mediano entre grupos de dano caiu de aproximadamente 15,00 s na V11 para 9,71 s na V13; maior intervalo caiu de 21,60 s para 12,85 s. São grupos de dano, não medição direta da duração do debuff.', '',
           'Estigma ganhou 1.199.915 de dano, aproximadamente 94,7% do ganho líquido total, com os mesmos 11 eventos, mas 8 eventos pesados contra 4 na V11. A variação de acertos pesados é um fator importante nesta amostra.', '',
           'Fenda perdeu 371.342 de dano e Dança perdeu 102.921. Aos 30 s a V13 estava atrás (9.759.819 contra 11.266.564); aos 60 s estava praticamente igual. O ganho final apareceu principalmente no segundo minuto.', '',
           'Próximo passo: repetir V11 e V13 com os mesmos buffs, equipamento e alvo, sem novas alterações, para avaliar repetibilidade antes de promover a V13.', '',
           '## Evidência e limites', '',
           f'Arquivo: `{SOURCE}`; sessão iniciada em `{start.isoformat()}`. A primeira sessão pertence à V11.',
           'Cópia preservada e diagnóstico por habilidade em `capturas_treinamento/combate_v13_2026-10-17/analise-120s.json`.', '']
report += ['- ' + note for note in result['limitations']]
(ROOT / 'docs/coletas/2026-10-17-comparacao-v11-v13.md').write_text('\n'.join(report) + '\n', encoding='utf-8')
catalog_path = ROOT / 'docs/coletas/2026-10-17-manopla-adaga.json'
catalog = json.loads(catalog_path.read_text(encoding='utf-8-sig'))
catalog.setdefault('debuffExperiment', {}).update(status='testado_uma_amostra', result120s=result,
                                               report='docs/coletas/2026-10-17-comparacao-v11-v13.md')
catalog_path.write_text(json.dumps(catalog, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(json.dumps(result, ensure_ascii=True, indent=2))
