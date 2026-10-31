"""Nomes de NPCs: template duplicado, direção, TCP, catálogo e capturas reais."""
from collections import Counter
import importlib.util
import json
from pathlib import Path
import struct

root = Path(__file__).resolve().parent.parent
spec = importlib.util.spec_from_file_location('npc_names_reference', root/'scripts/build-overlay-reference.py')
reference = importlib.util.module_from_spec(spec)
spec.loader.exec_module(reference)
worker = reference.worker
catalog = json.loads((root/'src/data/overlayNpcReference.json').read_text(encoding='utf-8'))

def varint(value):
    out = bytearray()
    while value >= 128:
        out.append((value & 127) | 128); value >>= 7
    return bytes(out) + bytes([value])

def field(key, value):
    return varint(key * 8) + varint(value)

body = field(3, 7) + field(4, 10212035*2) + field(32, 10212035*2)
assert worker.npc_identity(body) == dict(sourceId=7, npcId=10212035)
for invalid in (field(3, 7)+field(4, 20), body+field(3, 8), body+field(32, 20),
                field(3, 0)+field(4, 20)+field(32, 20), field(3, 7)+field(4, 21)+field(32, 21)):
    assert worker.npc_identity(invalid) is None
messages = []
worker.emit = messages.append
frame = struct.pack('<II', (len(body)+8)^worker.decoder.FRAME_LENGTH_KEYS[1], 0x12346f68)+body
worker.Stream('outbound', False).feed(0, frame*2, 1000)
assert not messages
stream = worker.Stream('inbound', True)
stream.feed(0, frame*2, 1000); stream.feed(0, frame*2, 1001)
assert len(messages) == 2 and all(row['type']=='npc' and row['connectionId']=='inbound' for row in messages)
assert not any(row['type'] in ('identity','local-player') for row in messages)
assert catalog['npcs']['10212035']['name'] == 'Guarda do Apóstolo'
assert 'Arremesso de Pedra' in catalog['skills']['948585679']['name']
assert 'Gosma' in catalog['skills']['948116900']['name']
assert 'Cadeia' in catalog['skills']['971845187']['name']
assert 'Investida' in catalog['skills']['971498355']['name']
assert 'Garrada Dupla' in catalog['skills']['954987931']['name']
assert all(row['name'].strip() and row['nameOrigin'] in ('descriptive','localized') for row in catalog['skills'].values())
assert len(catalog['npcs'])>10000 and len(catalog['skills'])>7000
print('OK: template 4/32 consistente, entidade válida, direção servidor, retransmissão, sem selecionar jogador e catálogo de NPCs/ataques.')

for name in ('20261030-094453-reference','20261030-184651-reference','20261030-191646-reference'):
    folder = root/'capturas_treinamento/npcap_tl'/name
    if not (folder/'manifest.json').exists():
        continue
    clients = set()
    for line in (folder/'endpoint-snapshots.jsonl').read_text(encoding='utf-8').splitlines():
        for row in json.loads(line)['endpoints']['tcp']:
            clients.add((row['LocalAddress'], int(row['LocalPort'])))
    messages.clear(); streams = {}
    for part in json.loads((folder/'manifest.json').read_text(encoding='utf-8'))['parts']:
        for packet in reference.records(folder/part['file']):
            if not packet.get('payload'): continue
            key = packet['source'],packet['dest']
            streams.setdefault(key, worker.Stream(str(key), packet['dest'] in clients)).feed(packet['sequence'],packet['payload'],packet['time'])
    npcs = [row for row in messages if row['type']=='npc']
    known = {(row['connectionId'], row['sourceId']):row['npcId'] for row in npcs if str(row['npcId']) in catalog['npcs']}
    damage = [row for row in messages if row['type']=='damage']
    matched = [row for row in damage if (row['connectionId'], row['event']['sourceId']) in known]
    assert npcs and len(known)>10 and matched
    # Um atacante confirmado nesta amostra usa ataques do mesmo arquétipo do template.
    if name=='20261030-191646-reference':
        knights = [row for row in matched if known[(row['connectionId'],row['event']['sourceId'])]==10212035]
        assert knights and any(row['event']['skillId'] in (949022150,949153221) for row in knights)
    print(f'OK: {name}: {len(npcs)} spawns, {len(known)} entidades nomeadas e {len(matched)} danos com fonte nomeada; {len(damage)} eventos de dano preservados.')
