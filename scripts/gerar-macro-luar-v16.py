"""Triplica cada tentativa de Luar da V14 a pedido do usuário."""
from collections import Counter
from copy import deepcopy
from pathlib import Path
from uuid import uuid4
import json
import xml.etree.ElementTree as ET

repo = Path(__file__).resolve().parents[1]
source = repo / 'docs/coletas/macros/TL_MA_BUFF_V14.xml'
destination = repo / 'docs/coletas/macros/TL_MA_LUAR_V16.xml'
original = ET.parse(source).getroot()
root = deepcopy(original)
root.find('Name').text = 'TL_MA_LUAR_V16'
root.find('Guid').text = str(uuid4())
container = root.find('MacroEvents')
events = list(container)
used_ids = {e.findtext('Id') for e in events if e.findtext('Id')}
next_id = max(map(int, used_ids)) + 1
expanded = []
i = 0
inserted = 0
while i < len(events):
    e = events[i]
    if e.findtext('Type') == '1' and e.findtext('KeyEvent/State') == '0' and e.findtext('KeyEvent/Makecode') == '187':
        block = events[i:i+4]
        assert len(block) == 4
        assert block[1].findtext('Type') == '0' and float(block[1].findtext('Number')) == .02
        assert block[2].findtext('Id') == e.findtext('Id') and block[2].findtext('KeyEvent/State') == '1'
        assert block[3].findtext('Type') == '0' and float(block[3].findtext('Number')) == .003
        expanded.extend(block)
        for _ in range(2):
            clone = deepcopy(block)
            clone[0].find('Id').text = clone[2].find('Id').text = str(next_id)
            next_id += 1
            expanded.extend(clone)
            inserted += 1
        i += 4
    else:
        expanded.append(e)
        i += 1
assert inserted == 12
container[:] = expanded
active = {}
seen = set()
elapsed = 0
presses = []
for e in container:
    if e.findtext('Type') == '0':
        elapsed += round(float(e.findtext('Number'))*1000)
    elif e.findtext('Type') == '1':
        pair = e.findtext('Id')
        key = e.findtext('KeyEvent/Makecode')
        if e.findtext('KeyEvent/State') == '0':
            assert pair not in seen
            seen.add(pair)
            active[pair] = (key,elapsed)
            presses.append((key,elapsed))
        else:
            downkey, t = active.pop(pair)
            assert downkey == key and elapsed-t == 20
assert not active and elapsed == 2415 and len(presses) == 105
old_keys = [e.findtext('KeyEvent/Makecode') for e in events if e.findtext('Type') == '1' and e.findtext('KeyEvent/State') == '0']
new_keys = [key for key,t in presses]
expected = [key for key in old_keys for _ in range(3 if key == '187' else 1)]
assert new_keys == expected
assert Counter(new_keys)['187'] == 18 and '48' not in new_keys
# Os eventos originais continuam byte a byte, em ordem, intercalados às cópias.
remaining = iter(expanded)
for before in events:
    assert any(ET.tostring(before) == ET.tostring(after) for after in remaining)
ET.indent(root,space='   ')
ET.ElementTree(root).write(destination,encoding='unicode')
assert ET.parse(destination).getroot().findtext('Name') == 'TL_MA_LUAR_V16'
download = Path.home() / 'Downloads' / destination.name
download.write_bytes(destination.read_bytes())
audit = dict(status='experimental_nao_instalada_nao_testada', source=str(source), importFile=str(download),
             change='Cada uma das seis tentativas de = vira três consecutivas. Demais eventos preservados.',
             pressCount=105, luarPressCount=18, holdMs=20, gapMs=3, cycleDurationMs=2415,
             luarAttemptsMs=[t for key,t in presses if key == '187'],
             limitations=['Três tentativas ocupam 69 ms, incluindo o intervalo final.',
                          'Um bloqueio de animação mais longo pode rejeitar as três.',
                          'Ciclo mais longo desloca horários e reduz frequência das demais teclas por segundo; ganho não garantido.'])
destination.with_suffix('.json').write_text(json.dumps(audit,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
download.with_suffix('.json').write_bytes(destination.with_suffix('.json').read_bytes())
catalog_path = repo / 'docs/coletas/2026-10-17-manopla-adaga.json'
catalog = json.loads(catalog_path.read_text(encoding='utf-8'))
catalog['luarTripleExperiment'] = audit
catalog_path.write_text(json.dumps(catalog,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps(audit,ensure_ascii=True,indent=2))
