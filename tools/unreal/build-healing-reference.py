"""Gera a classificação estática de efeitos de cura para o decoder do overlay."""
import argparse
from collections import Counter
import json
from pathlib import Path
import sqlite3

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--build', required=True)
args = parser.parse_args()
tool = Path(__file__).resolve().parent
root = tool/'exports'/args.build
index = json.loads((root/'reference-index.json').read_text(encoding='utf-8'))
db = sqlite3.connect((root/index['database']).as_uri()+'?mode=ro', uri=True)
effects = {}
for row, uid, payload in db.execute("SELECT row_key,uid,payload FROM records WHERE table_name='TLEffectProperty' ORDER BY uid"):
    data = json.loads(payload)
    group = data.get('Group', '').removeprefix('EEffectGroup::')
    if group not in ('Continuous_Heal', 'Intervallic_Heal', 'Instant_Heal'):
        continue
    if not isinstance(uid, int) or not 0 < abs(uid) < 2**53:
        raise ValueError(f'UID inválido no efeito {row}')
    if str(uid) in effects:
        raise ValueError(f'UID de efeito ambíguo: {uid}')
    effects[str(uid)] = dict(row=row, group=group)
skills = sorted({uid for (uid,) in db.execute("SELECT uid FROM records WHERE table_name='TLSkill'")
                 if isinstance(uid, int) and 0 < abs(uid) < 2**53})
db.close()
result = dict(schemaVersion=1, build=args.build, sourceDatabase=index['database'],
              scope='Static effect classification; packet schema and attribution still require validation.',
              effects=effects, skillIds=skills)
output = tool.parents[1]/'src/data/overlayHealingEffects.json'
output.write_text(json.dumps(result, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
print(json.dumps(dict(output=str(output), effects=len(effects), skills=len(skills), groups=dict(Counter(row['group'] for row in effects.values())))))
