"""Roteiro de teste executado uma vez; não é macro de DPS."""
from copy import deepcopy
from pathlib import Path
from uuid import uuid4
import json
import xml.etree.ElementTree as ET

repo = Path(__file__).resolve().parents[1]
template = ET.parse(repo / 'docs/coletas/macros/TL_MA_BUFF_V14.xml').getroot()
root = deepcopy(template)
root.find('Name').text = 'TL_TESTE_REDE_V1'
root.find('Guid').text = str(uuid4())
container = root.find('MacroEvents')
container[:] = []
first = ET.SubElement(container, 'MacroEvent')
ET.SubElement(first, 'Type').text = 'actionBar'
ET.SubElement(first, 'recordProfile')
ET.SubElement(first, 'selected').text = 'false'
events = list(template.find('MacroEvents'))
actions = [(25000,'187','Luar'), (26000,'187','Luar repetido'),
           (45000,'189','Umbral'), (46000,'189','Umbral repetido'),
           (65000,'52','Golpe Sombrio'), (66000,'52','Golpe repetido'),
           (85000,'54','Fenda'), (86000,'54','Fenda consecutiva')]


def pause(ms):
    assert ms > 0
    item = ET.SubElement(container,'MacroEvent')
    ET.SubElement(item,'Type').text = '0'
    ET.SubElement(item,'Number').text = f'{ms/1000:.6f}'
    ET.SubElement(item,'selected').text = 'false'


clock = 0
for index,(when,key,label) in enumerate(actions):
    pause(when-clock)
    down = next(e for e in events if e.findtext('Type') == '1'
                and e.findtext('KeyEvent/Makecode') == key and e.findtext('KeyEvent/State') == '0')
    up = next(e for e in events if e.findtext('Type') == '1'
              and e.findtext('Id') == down.findtext('Id') and e.findtext('KeyEvent/State') == '1')
    down,up = deepcopy(down),deepcopy(up)
    down.find('Id').text = up.find('Id').text = str(1792600000000+index)
    container.append(down)
    pause(80)
    container.append(up)
    clock = when+80
pause(110000-clock)
# Conferir os tempos reais gerados e os pares, sem executar a macro.
clock, active, observed = 0, {}, []
for event in container:
    if event.findtext('Type') == '0':
        clock += round(float(event.findtext('Number'))*1000)
    elif event.findtext('Type') == '1':
        pair,key = event.findtext('Id'),event.findtext('KeyEvent/Makecode')
        if event.findtext('KeyEvent/State') == '0':
            assert pair not in active
            active[pair]=(key,clock)
            observed.append((clock,key))
        else:
            previous,t = active.pop(pair)
            assert previous == key and clock-t == 80
assert not active and clock == 110000
assert observed == [(t,k) for t,k,label in actions]
assert root.findtext('DelaySetting') == '0'
ET.indent(root,space='   ')
destination = repo / 'docs/coletas/macros/TL_TESTE_REDE_V1.xml'
ET.ElementTree(root).write(destination,encoding='unicode')
assert ET.parse(destination).getroot().findtext('Name') == 'TL_TESTE_REDE_V1'
download = Path.home()/'Downloads'/destination.name
download.write_bytes(destination.read_bytes())
audit=dict(status='gerada_validada_nao_instalada_nao_executada', importFile=str(download),
           durationMs=110000, holdMs=80, triggerMode='Executar uma vez: configurar na atribuição do botão no Synapse',
           initialIdleSec=25, explanation='10 s de preparação mais 15 s de referência sem habilidades.',
           plannedPresses=[dict(ms=t,key={'187':'=','189':'-','52':'4','54':'6'}[k],label=label) for t,k,label in actions],
           limitations=['Tempos relativos ao botão físico; sincronizar pelo vídeo, não pelo início da captura.',
                        'Tempo programado não confirma que o jogo aceitou a habilidade.',
                        'Ataque automático pode ocorrer após uma habilidade; documentar no vídeo/log.'])
destination.with_suffix('.json').write_text(json.dumps(audit,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps(audit,ensure_ascii=True,indent=2))
