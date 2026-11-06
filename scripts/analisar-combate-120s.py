"""Extrai dano observado em janela fixa; não interpreta hits como casts."""
import argparse
import csv
import json
import shutil
import statistics
from collections import defaultdict
from datetime import datetime
from pathlib import Path

parser = argparse.ArgumentParser()
parser.add_argument('--log', type=Path, required=True)
parser.add_argument('--macro', required=True)
parser.add_argument('--video', required=True)
parser.add_argument('--out', type=Path, required=True)
args = parser.parse_args()
rows = []
for row in csv.reader(args.log.open(encoding='utf-8-sig')):
    if len(row) >= 10 and row[1] == 'DamageDone' and row[8:10] == ['AgrMonteiro', 'Boneco para Prática']:
        rows.append((datetime.strptime(row[0], '%Y%m%d-%H:%M:%S:%f'), row))
rows.sort()
assert rows, 'Sem dano do personagem no alvo esperado.'
assert all((b[0]-a[0]).total_seconds() <= 30 for a, b in zip(rows, rows[1:])), 'Separar as sessões antes de analisar.'
start = rows[0][0]
span = (rows[-1][0]-start).total_seconds()
assert span >= 119, 'Duração insuficiente para comparar 120 segundos.'
window = [((t-start).total_seconds(), row) for t, row in rows if (t-start).total_seconds() < 120]
skills = defaultdict(lambda: dict(damage=0, damageEvents=0, critEvents=0, heavyEvents=0))
for t, row in window:
    s = skills[row[2]]
    s['damage'] += int(row[4])
    s['damageEvents'] += 1
    s['critEvents'] += row[5] == '1'
    s['heavyEvents'] += row[6] == '1'
diagnostics = {}
for name in ['Arremesso de Relâmpago', 'Golpe Sombrio', 'Dança da Espada Frenética', 'Fenda Enluarada']:
    groups = []
    for t, row in window:
        if row[2] != name:
            continue
        if not groups or t-groups[-1][-1] > .75:
            groups.append([])
        groups[-1].append(t)
    intervals = [b[0]-a[0] for a,b in zip(groups, groups[1:])]
    diagnostics[name] = dict(damageGroups=len(groups), groupStartSec=[g[0] for g in groups],
                            medianGroupIntervalSec=statistics.median(intervals) if intervals else None,
                            maxGroupIntervalSec=max(intervals) if intervals else None)
total = sum(s['damage'] for s in skills.values())
result = dict(macro=args.macro, sourceLog=str(args.log), video=args.video,
              windowStartLogTime=start.isoformat(), windowDurationSec=120,
              fullLogSpanSec=span, lastWindowDamageSec=window[-1][0], totalDamage=total,
              dps=total/120, damageEvents=len(window), skills=dict(skills),
              damageByMinute=[sum(int(row[4]) for t,row in window if a <= t < a+60) for a in (0,60)],
              cumulativeDamageBySec={str(e): sum(int(row[4]) for t,row in window if t < e) for e in (15,30,60,90,120)},
              supportDiagnostics=diagnostics,
              limitations=['Hits e grupos de dano não equivalem a usos nem medem uptime.',
                           'Buffs e condições de teste não certificados.',
                           'Janela final exclusiva; danos após 120 s excluídos.'])
args.out.mkdir(parents=True, exist_ok=True)
shutil.copy2(args.log, args.out / args.log.name)
(args.out / 'analise-120s.json').write_text(json.dumps(result, ensure_ascii=False, indent=2)+'\n',encoding='utf-8')
print(json.dumps(result, ensure_ascii=True, indent=2))
