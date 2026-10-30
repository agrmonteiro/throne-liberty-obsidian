"""Buscador de Sangue: parser restrito, captura real e identidade por log/perfil."""
from collections import Counter
import csv
from datetime import datetime, timedelta, timezone
import importlib.util
import json
import os
from pathlib import Path
import struct

here = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location('reference', here/'build-overlay-reference.py')
reference = importlib.util.module_from_spec(spec)
spec.loader.exec_module(reference)
worker = reference.worker


def vint(value):
    out = bytearray()
    while value >= 128:
        out.append((value & 127) | 128); value >>= 7
    return bytes(out) + bytes([value])


def field(key, value):
    return vint(key * 8) + vint(value)


def body(amount=360, effect=939538607, skill=939721573, source=7, target=7):
    return field(1, effect*2) + field(2, target) + field(3, source) + field(5, amount*2) + field(10, skill*2)


assert worker.vampiric_healing(body())['healing'] == 360
for invalid in (body(effect=1), body(skill=1), body(amount=0), body(target=8), body()+field(5, 10)):
    assert worker.vampiric_healing(invalid) is None
messages = []
worker.emit = messages.append
payload = body()
frame = struct.pack('<II', (len(payload)+8) ^ worker.decoder.FRAME_LENGTH_KEYS[1], 0x12344a70) + payload
worker.Stream('client', False).feed(0, frame*2, 1000)
assert not messages
stream = worker.Stream('server', True)
stream.feed(0, frame*2, 1000); stream.feed(0, frame*2, 1001)
assert len(messages) == 2 and all(e['type'] == 'healing' for e in messages)

folder = here.parent/'capturas_treinamento/npcap_tl/20261030-184651-reference'
clients = set()
for line in (folder/'endpoint-snapshots.jsonl').read_text(encoding='utf-8').splitlines():
    for row in json.loads(line)['endpoints']['tcp']:
        clients.add((row['LocalAddress'], int(row['LocalPort'])))
manifest = json.loads((folder/'manifest.json').read_text(encoding='utf-8'))
messages.clear(); streams = {}
for part in manifest['parts']:
    for packet in reference.records(folder/part['file']):
        if not packet.get('payload'):
            continue
        key = packet['source'], packet['dest']
        streams.setdefault(key, worker.Stream(str(key), packet['dest'] in clients)).feed(packet['sequence'], packet['payload'], packet['time'])
heals = [row['event'] for row in messages if row['type'] == 'healing' and row['event']['coverage'] == 'self-lifesteal']
damage = [row['event'] for row in messages if row['type'] == 'damage']
profile = [row for row in messages if row['type'] == 'identity' and row['name'] == 'AgrMonteiro']
assert profile and len({row['sourceId'] for row in profile}) == 1
own = profile[0]['sourceId']
assert len(heals) == 142 and all(e['sourceId'] == e['targetId'] for e in heals)
heals = [e for e in heals if e['sourceId'] == own]
assert len(heals) == 121 and sum(e['healing'] for e in heals) == 111439
assert all(e['effectId'] == 939538607 and e['skillId'] == 939721573 for e in heals)
log = Path(os.environ['LOCALAPPDATA'])/'TL/Saved/CombatLogs/TLCombatLog-261030_184501.txt'
matched = []
if log.exists():
    for row in csv.reader(log.read_text(encoding='utf-8-sig').splitlines()):
        if len(row) < 10 or row[1] != 'DamageDone' or row[8] != 'AgrMonteiro':
            continue
        stamp = datetime.strptime(row[0], '%Y%m%d-%H:%M:%S:%f').replace(tzinfo=timezone(timedelta(hours=-3))).timestamp()
        choices = [e for e in damage if e['skillId'] == int(row[3]) and e['damage'] == int(row[4]) and abs(e['time']-stamp) <= .5]
        if choices:
            assert all(e['sourceId'] == own for e in choices)
            matched.append(row)
    assert matched
print(f'OK: vampirismo real: {len(heals)} eventos / {sum(e["healing"] for e in heals)} de cura bruta; perfil confirma a entidade e {len(matched)} acertos correspondem ao log independente.')
print('OK: efeito/UID, autocura, direção do servidor, retransmissão e separação entre cura e dano.')
