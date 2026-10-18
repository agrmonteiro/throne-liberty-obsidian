"""Preserva e compara a repetição da V13 em janela fixa de 120 segundos."""
import csv
import json
import shutil
import statistics
from collections import defaultdict
from datetime import datetime
from pathlib import Path

root = Path(__file__).resolve().parents[1]
out = root / 'capturas_treinamento/combate_v13_t2_2026-10-17'
out.mkdir(parents=True, exist_ok=True)
source = Path(r'C:\Users\admin\AppData\Local\TL\Saved\CombatLogs\TLCombatLog-261017_223020.txt')
shutil.copy2(source, out / source.name)
rows = []
for row in csv.reader(source.open(encoding='utf-8-sig')):
    if len(row) >= 10 and row[1] == 'DamageDone' and row[8:10] == ['AgrMonteiro', 'Boneco para Prática']:
        rows.append((datetime.strptime(row[0], '%Y%m%d-%H:%M:%S:%f'), row))
rows.sort()
assert rows, 'Log sem dano do personagem no boneco.'
start = rows[0][0]
assert (rows[-1][0] - start).total_seconds() >= 119, 'Combate curto: revisar janela.'
window = [((t-start).total_seconds(), r) for t, r in rows if (t-start).total_seconds() < 120]
skills = defaultdict(lambda: dict(damage=0, damageEvents=0, critEvents=0, heavyEvents=0))
for elapsed, row in window:
    s = skills[row[2]]
    s['damage'] += int(row[4])
    s['damageEvents'] += 1
    s['critEvents'] += row[5] == '1'
    s['heavyEvents'] += row[6] == '1'
total = sum(s['damage'] for s in skills.values())
previous = json.loads((root / 'capturas_treinamento/combate_v13_2026-10-17/analise-120s.json').read_text(encoding='utf-8'))
baseline = json.loads((root / 'capturas_treinamento/comparacao_v11_v12_2026-10-17/comparacao-120s.json').read_text(encoding='utf-8'))['baseline']
diagnostics = {}
for name in ['Arremesso de Relâmpago', 'Golpe Sombrio', 'Dança da Espada Frenética', 'Fenda Enluarada']:
    groups = []
    for t, r in window:
        if r[2] != name:
            continue
        if not groups or t - groups[-1][-1] > .75:
            groups.append([])
        groups[-1].append(t)
    intervals = [b[0]-a[0] for a, b in zip(groups, groups[1:])]
    diagnostics[name] = dict(damageGroups=len(groups), groupStartSec=[g[0] for g in groups],
                            medianGroupIntervalSec=statistics.median(intervals) if intervals else None,
                            maxGroupIntervalSec=max(intervals) if intervals else None)
result = dict(macro='V13', attempt=2, sourceLog=str(source),
              video=r'C:\Users\admin\Downloads\TL_COMBATE_V13_T2_2026-10-17.mp4',
              windowStartLogTime=start.isoformat(), windowDurationSec=120,
              fullLogSpanSec=(rows[-1][0]-start).total_seconds(), lastWindowDamageSec=window[-1][0],
              totalDamage=total, dps=total/120, damageEvents=len(window), skills=dict(skills),
              damageByMinute=[sum(int(r[4]) for t, r in window if a <= t < a+60) for a in (0,60)],
              cumulativeDamageBySec={str(e): sum(int(r[4]) for t, r in window if t < e) for e in (15,30,60,90,120)},
              supportDiagnostics=diagnostics,
              deltaPctVsV11=(total/baseline['totalDamage']-1)*100,
              deltaPctVsV13T1=(total/previous['totalDamage']-1)*100,
              meanV13Damage=(total+previous['totalDamage'])/2)
result['meanV13DeltaPctVsV11'] = (result['meanV13Damage']/baseline['totalDamage']-1)*100
result['limitations'] = ['V13 com duas amostras e V11 controle com uma; condições de buffs não certificadas.',
                        'Grupos de dano por intervalo de 0,75 s não equivalem a usos ou duração real de debuffs.',
                        'Janela de 120 s desde o primeiro dano, limite final exclusivo; danos posteriores excluídos.']
(out / 'analise-120s.json').write_text(json.dumps(result, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
report = ['# Repetição da V13', '', '| Tentativa | Dano em 120 s | DPS |', '|---|---:|---:|']
for label, item in [('V11 controle', baseline), ('V13 primeira', previous), ('V13 segunda', result)]:
    report.append(f"| {label} | {item['totalDamage']:,.0f} | {item['dps']:,.2f} |")
report += ['', f"Segunda V13 contra V11: {result['deltaPctVsV11']:+.2f}%; contra primeira V13: {result['deltaPctVsV13T1']:+.2f}%.",
           f"Média das duas V13: {result['meanV13Damage']:,.0f}, diferença de {result['meanV13DeltaPctVsV11']:+.2f}% contra a única V11 controle.", '',
           '| Habilidade | V11 | V13 primeira | V13 segunda |', '|---|---:|---:|---:|']
for name, value in sorted(skills.items(), key=lambda x: -x[1]['damage']):
    report.append(f"| {name} | {baseline['skills'].get(name,{}).get('damage',0):,.0f} | {previous['skills'].get(name,{}).get('damage',0):,.0f} | {value['damage']:,.0f} |")
report += ['', '## Interpretação', '',
           'As duas V13 superaram a única V11 controle, mas o ganho da repetição foi pequeno (+0,65%) e não demonstra superioridade estável. Manter V13 como candidata, sem promover o ganho médio a previsão garantida.', '',
           'Arremesso manteve intervalo mediano menor (10,81 s nesta repetição, 9,71 s na primeira V13 e aproximadamente 15 s na V11). Contudo, houve uma lacuna de 21,56 s, mostrando que a redistribuição não resolveu todas as oportunidades perdidas.', '',
           'O dano de Fenda recuperou-se para 2.723.866, perto dos 2.777.520 da V11; Dança atingiu 1.074.485, acima dos 982.057 da V11. O Estigma teve cinco eventos pesados nesta repetição, contra oito na primeira V13 e quatro na V11.', '',
           'A abertura continua inferior: aos 30 s as V13 chegaram a 9,76 M e 9,54 M, contra 11,27 M na V11. O próximo ponto de investigação é o alinhamento inicial dos buffs e habilidades, preservando a distribuição de Arremesso; nenhuma nova macro foi gerada nesta análise.', '',
           '## Regularidade das habilidades de suporte', '', '```json', json.dumps(diagnostics,ensure_ascii=False,indent=2), '```', '',
           '## Variação de acertos pesados do Estigma', '',
           f"Eventos de dano: V11 {baseline['skills']['Estigma Fatal']['damageEvents']}, V13 primeira {previous['skills']['Estigma Fatal']['damageEvents']}, V13 segunda {skills['Estigma Fatal']['damageEvents']}.",
           f"Eventos pesados: V11 {baseline['skills']['Estigma Fatal']['heavyEvents']}, V13 primeira {previous['skills']['Estigma Fatal']['heavyEvents']}, V13 segunda {skills['Estigma Fatal']['heavyEvents']}.", '',
           '## Limites', ''] + ['- '+x for x in result['limitations']]
(root / 'docs/coletas/2026-10-17-v13-repeticao.md').write_text('\n'.join(report)+'\n',encoding='utf-8')
catalog_path = root / 'docs/coletas/2026-10-17-manopla-adaga.json'
catalog = json.loads(catalog_path.read_text(encoding='utf-8-sig'))
catalog['debuffExperiment'].update(status='testado_duas_amostras', repeat120s=result,
                                 repeatReport='docs/coletas/2026-10-17-v13-repeticao.md')
catalog_path.write_text(json.dumps(catalog,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps(result,ensure_ascii=True,indent=2))
