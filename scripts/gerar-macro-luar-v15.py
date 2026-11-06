"""Teste isolado: primeiro pressionamento de Luar de cada ciclo dura 60 ms."""
from copy import deepcopy
from hashlib import sha256
from pathlib import Path
from uuid import uuid4
import json
import xml.etree.ElementTree as ET

repo = Path(__file__).resolve().parents[1]
source = repo / 'docs/coletas/macros/TL_MA_BUFF_V14.xml'
destination = repo / 'docs/coletas/macros/TL_MA_LUAR_V15.xml'
original = ET.parse(source).getroot()
root = deepcopy(original)
root.find('Name').text = 'TL_MA_LUAR_V15'
root.find('Guid').text = str(uuid4())
events = list(root.find('MacroEvents'))
first_luar = next(i for i,e in enumerate(events)
                  if e.findtext('Type') == '1' and e.findtext('KeyEvent/State') == '0'
                  and e.findtext('KeyEvent/Makecode') == '187')
delay = events[first_luar+1]
release = events[first_luar+2]
assert delay.findtext('Type') == '0' and float(delay.findtext('Number')) == .02
assert release.findtext('Id') == events[first_luar].findtext('Id')
assert release.findtext('KeyEvent/State') == '1'
delay.find('Number').text = '0.06'
changes = [i for i,(a,b) in enumerate(zip(original.find('MacroEvents'), events, strict=True))
           if ET.tostring(a) != ET.tostring(b)]
assert changes == [first_luar+1]
active = {}
elapsed = 0
presses = []
holds = []
for event in events:
    if event.findtext('Type') == '0':
        elapsed += round(float(event.findtext('Number'))*1000)
    elif event.findtext('Type') == '1':
        pair = event.findtext('Id')
        key = event.findtext('KeyEvent/Makecode')
        if event.findtext('KeyEvent/State') == '0':
            assert pair not in active
            active[pair] = (key, elapsed)
            presses.append((key,elapsed))
        else:
            oldkey, when = active.pop(pair)
            assert key == oldkey
            holds.append((key, elapsed-when))
assert not active and len(presses) == 93 and elapsed == 2179
assert sum(duration == 60 for key,duration in holds) == 1
assert all(duration == (60 if i == 1 else 20) for i,(key,duration) in enumerate(holds))
assert [time for key,time in presses if key == '56'] == [178,891,1604]
assert '48' not in [key for key,time in presses]
ET.indent(root,space='   ')
ET.ElementTree(root).write(destination,encoding='unicode')
assert ET.parse(destination).getroot().findtext('Name') == 'TL_MA_LUAR_V15'
download = Path.home() / 'Downloads' / destination.name
download.write_bytes(destination.read_bytes())
audit = dict(status='experimental_nao_instalada_nao_testada', source=str(source), output=str(destination),
             importFile=str(download), outputSha256=sha256(destination.read_bytes()).hexdigest(),
             pressCount=93, cycleDurationMs=2179, previousCycleDurationMs=2139,
             change='Somente o primeiro pressionamento de = por ciclo passa de 20 para 60 ms.',
             unchanged='Sequência, códigos, número de tentativas, demais holds e intervalos de 3 ms.',
             arremessoAttemptsMs=[178,891,1604],
             nominalAttemptFrequencyChangePct=(2139/2179-1)*100,
             limitations=['Pressionar por mais tempo não garante aceitar input durante animação.',
                          'Teste diagnóstico; não garante ganho de DPS.',
                          'Ciclo 40 ms mais longo desloca os eventos posteriores e reduz frequência nominal em cerca de 1,84%.'])
destination.with_suffix('.json').write_text(json.dumps(audit,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
download.with_suffix('.json').write_bytes(destination.with_suffix('.json').read_bytes())
print(json.dumps(audit,ensure_ascii=True,indent=2))
