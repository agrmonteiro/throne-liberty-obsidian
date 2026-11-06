"""Distribui tentativas de Umbral e Luar sem mudar os tempos da V13."""
from collections import Counter
from copy import deepcopy
from hashlib import sha256
from pathlib import Path
from uuid import uuid4
import json
import xml.etree.ElementTree as ET

repo = Path(__file__).resolve().parents[1]
source = repo / 'docs/coletas/macros/TL_MA_DEBUFF_V13.xml'
destination = repo / 'docs/coletas/macros/TL_MA_BUFF_V14.xml'
original = ET.parse(source).getroot()
root = deepcopy(original)
root.find('Name').text = 'TL_MA_BUFF_V14'
root.find('Guid').text = str(uuid4())
events = root.find('MacroEvents')
downs = [e for e in events if e.findtext('Type') == '1' and e.findtext('KeyEvent/State') == '0']
keys = [e.findtext('KeyEvent/Makecode') for e in downs]
assert len(keys) == 93
assert Counter(keys)['187'] == Counter(keys)['189'] == 6
assert [i for i, key in enumerate(keys) if key == '56'] == [6, 37, 68]

# Luar: primeira tentativa aos 23 ms. Umbral: primeira aos 115 ms.
# Depois, repete cada buff a aproximadamente 368 ms, com ataques entre eles.
# Não é uma abertura de execução única: este mesmo ciclo se repete no Synapse.
fixed = {i: '187' for i in (1, 16, 32, 48, 64, 80)}
fixed.update({i: '189' for i in (5, 21, 39, 55, 71, 87)})
fixed.update({i: '56' for i in (6, 37, 68)})
remaining = iter(key for key in keys if key not in {'187', '189', '56'})
replacement = [fixed[i] if i in fixed else next(remaining) for i in range(93)]
assert list(remaining) == []
assert Counter(replacement) == Counter(keys)
assert replacement[0] == keys[0] == '52'
assert '48' not in replacement, 'Não alternar Eclipse automaticamente.'
assert [k for k in replacement if k not in {'187', '189', '56'}] == [k for k in keys if k not in {'187', '189', '56'}]
new_key_by_id = {e.findtext('Id'): key for e, key in zip(downs, replacement, strict=True)}
scans = {e.findtext('KeyEvent/Makecode'): e.findtext('ScanCode') for e in downs}
active = {}
elapsed_ms = 0
press_ms = []
holds = []
for event in events:
    if event.findtext('Type') == '0':
        elapsed_ms += round(float(event.findtext('Number')) * 1000)
    elif event.findtext('Type') == '1':
        pair = event.findtext('Id')
        key = new_key_by_id[pair]
        event.find('KeyEvent/Makecode').text = key
        event.find('ScanCode').text = scans[key]
        if event.findtext('KeyEvent/State') == '0':
            assert pair not in active
            active[pair] = (key, elapsed_ms)
            press_ms.append(elapsed_ms)
        else:
            down_key, when = active.pop(pair)
            assert down_key == key
            holds.append(elapsed_ms - when)
assert not active
assert elapsed_ms == 2139 and set(holds) == {20}
assert press_ms == list(range(0, 2139, 23))
for before, after in zip(original.find('MacroEvents'), events, strict=True):
    assert before.findtext('Type') == after.findtext('Type')
    assert before.findtext('Number') == after.findtext('Number')
    assert before.findtext('KeyEvent/State') == after.findtext('KeyEvent/State')
    assert before.findtext('Id') == after.findtext('Id')
ET.indent(root, space='   ')
ET.ElementTree(root).write(destination, encoding='unicode')
assert ET.parse(destination).getroot().findtext('Name') == 'TL_MA_BUFF_V14'
downloads = Path.home() / 'Downloads' / destination.name
downloads.write_bytes(destination.read_bytes())
audit = dict(
    status='experimental_nao_instalada_nao_testada',
    source=str(source), output=str(destination), importFile=str(downloads),
    sourceSha256=sha256(source.read_bytes()).hexdigest(),
    outputSha256=sha256(destination.read_bytes()).hexdigest(),
    pressCount=93, holdMs=20, gapMs=3, cycleDurationMs=2139,
    luarAttemptsMs=[press_ms[i] for i, key in enumerate(replacement) if key == '187'],
    umbralAttemptsMs=[press_ms[i] for i, key in enumerate(replacement) if key == '189'],
    arremessoAttemptsMs=[press_ms[i] for i, key in enumerate(replacement) if key == '56'],
    preserved=['Contagem de cada tecla da V13', 'Tempos e pares de pressionamento/soltura',
               'Ordem das teclas exceto Umbral, Luar e Arremesso', 'Horários de Arremesso'],
    hypothesis='Espaçar as tentativas pode permitir registro dos buffs após bloqueios de animação; ganho não garantido.',
    validation=['XML relido', '93 pares equilibrados', 'Tempos idênticos aos da V13', 'Sem tecla 0'],
    nextTest='Mesma build, buffs e alvo; 120 s desde o primeiro dano. Filmar a abertura e conferir ativação de - e =.',
    limitations=['Sem detecção de cooldown, ativação ou fim de animação.',
                 'Primeira tentativa antecipada não garante que o buff ative antes do dano.',
                 'A mudança vale para cada repetição do ciclo, não só o início do combate.'])
destination.with_suffix('.json').write_text(json.dumps(audit, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
downloads.with_suffix('.json').write_bytes(destination.with_suffix('.json').read_bytes())
catalog_path = repo / 'docs/coletas/2026-10-17-manopla-adaga.json'
catalog = json.loads(catalog_path.read_text(encoding='utf-8-sig'))
catalog['buffExperiment'] = audit
catalog_path.write_text(json.dumps(catalog, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
print(json.dumps(audit, ensure_ascii=True, indent=2))
