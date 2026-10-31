"""Cura periódica experimental: escopo restrito e regressão contra PCAP real."""
from collections import Counter
import importlib.util
import json
from pathlib import Path
import struct

here = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location('reference', here/'build-overlay-reference.py')
reference = importlib.util.module_from_spec(spec)
spec.loader.exec_module(reference)
worker = reference.worker
messages = []
worker.emit = messages.append


def vint(value):
    out = bytearray()
    while value >= 128:
        out.append((value & 127) | 128); value >>= 7
    return bytes(out) + bytes([value])


def field(key, value):
    return vint(key * 8) + vint(value)


def body(amount=521, effect=963250776, skill=963905802, source=7, target=7):
    return field(1, effect * 2) + field(2, target) + field(3, amount * 2) + field(4, source) + field(5, skill * 2)


expected = worker.periodic_healing(body())
assert expected['healing'] == 521 and expected['sourceId'] == expected['targetId'] == 7
assert worker.periodic_healing(body(target=8))['coverage'] == 'external-periodic'
for invalid in (body(effect=1), body(skill=10), body(amount=0), body(target=0), body(source=0), field(1, 2), body()+field(3, 100)):
    assert worker.periodic_healing(invalid) is None

payload = body()
frame = struct.pack('<II', (len(payload)+8) ^ worker.decoder.FRAME_LENGTH_KEYS[1], 0x12344a63) + payload
for server in (False, True):
    messages.clear()
    stream = worker.Stream('test', server)
    stream.feed(0, frame*2, 1000)
    assert len(messages) == (2 if server else 0)
    stream.feed(0, frame*2, 1001)
    assert len(messages) == (2 if server else 0), 'Retransmissão não pode duplicar aplicações'
print('OK: autocura, efeito/UID permitidos, valor positivo, direção do servidor e retransmissão.')

folder = here.parent/'capturas_treinamento/npcap_tl/20261030-094453-reference'
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
all_heals = [row['event'] for row in messages if row['type'] == 'healing']
heals = [row for row in all_heals if row['effectId'] == 963250776]
damage = [row['event'] for row in messages if row['type'] == 'damage']
assert len(damage) == 6392
assert heals and all(e['sourceId'] == e['targetId'] and e['effectId'] == 963250776 for e in heals)
assert len(heals) == 655 and sum(e['healing'] for e in heals) == 1243462
assert all(str(e['effectId']) in worker.HEALING_EFFECTS and e['skillId'] in worker.HEALING_SKILLS for e in all_heals)
blessing = [e for e in all_heals if e['effectId'] == 963467735]
assert len(blessing) == 171 and all(e['skillId'] == 963774787 for e in blessing)
assert all(e['skillId'] in (963905802, 963351634) and e['healing'] > 0 for e in heals)
print(f'OK: PCAP real: {len(heals)} aplicações / {sum(e["healing"] for e in heals)} de autocura bruta candidata; os 6.392 eventos de dano permanecem separados.')
print(f'OK: Bênção da Natureza heroica: {len(blessing)} aplicações / {sum(e["healing"] for e in blessing)} de cura bruta candidata, reconhecida pelo efeito extraído do cliente.')

folder = here.parent/'capturas_treinamento/npcap_tl/20261030-191646-reference'
clients.clear()
for line in (folder/'endpoint-snapshots.jsonl').read_text(encoding='utf-8').splitlines():
    for row in json.loads(line)['endpoints']['tcp']:
        clients.add((row['LocalAddress'], int(row['LocalPort'])))
manifest = json.loads((folder/'manifest.json').read_text(encoding='utf-8'))
messages.clear(); streams.clear()
for part in manifest['parts']:
    for packet in reference.records(folder/part['file']):
        if not packet.get('payload'):
            continue
        key = packet['source'], packet['dest']
        streams.setdefault(key, worker.Stream(str(key), packet['dest'] in clients)).feed(packet['sequence'], packet['payload'], packet['time'])
blessing = [row['event'] for row in messages if row['type'] == 'healing' and row['event']['effectId'] == 963467735]
assert len(blessing) == 82 and all(e['skillId'] == 963774787 and e['sourceId'] == e['targetId'] for e in blessing)
print(f'OK: nova captura de Bênção da Natureza: {len(blessing)} aplicações / {sum(e["healing"] for e in blessing)} de cura bruta candidata.')

fixture=json.loads((here/'fixtures/overlay-external-healing.json').read_text(encoding='utf-8'))
for sample in fixture['events']:
    payload=bytes.fromhex(sample['bodyHex']); opcode=int(sample['opcode'],16)
    parse=worker.periodic_healing if opcode==0x12344a63 else worker.vampiric_healing
    value=parse(payload)
    assert value and all(value[key]==sample[key] for key in ('sourceId','targetId','skillId','effectId','healing'))
    assert value['coverage'].startswith('external-')
    frame=struct.pack('<II',(len(payload)+8)^worker.decoder.FRAME_LENGTH_KEYS[1],opcode)+payload
    for server in (False,True):
        messages.clear(); stream=worker.Stream('external-fixture',server); stream.feed(0,frame*2,sample['time'])
        assert len(messages)==(2 if server else 0)
        assert all(row['type']=='healing' and row['event']['healing']==sample['healing'] for row in messages)
        stream.feed(0,frame*2,sample['time']+1)
        assert len(messages)==(2 if server else 0),'Retransmissão não duplica cura externa'
print('OK: 4 pacotes reais AliveS1 -> AgrMonteiro: cura externa instantânea/periódica, valores preservados, sentido e retransmissão.')
