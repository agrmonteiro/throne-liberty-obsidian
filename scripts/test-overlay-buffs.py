"""Estados: fixtures reais, escopo, timers candidatos e ausência de remoções inventadas."""
from collections import Counter
import gzip
import hashlib
import importlib.util
import json
from pathlib import Path

root = Path(__file__).resolve().parent.parent
def module(name, file):
    spec = importlib.util.spec_from_file_location(name, file)
    result = importlib.util.module_from_spec(spec); spec.loader.exec_module(result)
    return result
protocol = module('buff_protocol_test', root/'scripts/overlay-buff-protocol.py')
worker = module('buff_worker_test', root/'scripts/npcap-overlay-worker.py')
fixture = json.loads((root/'scripts/fixtures/overlay-buff-lifecycle.json').read_text(encoding='utf-8'))
catalog_file = root/'reference/datamine'/fixture['build']/'buff-reference.json.gz'
catalog = json.loads(gzip.decompress(catalog_file.read_bytes()))
index = json.loads(catalog_file.with_name('buff-reference-index.json').read_text(encoding='utf-8'))
assert len(catalog['effects']) == index['counts']['effects']
assert sum(len(row['states']) for row in catalog['abnormals'].values()) == index['counts']['states']
assert hashlib.sha256(catalog_file.read_bytes()).hexdigest() == index['sha256']
assert dict(Counter(row['kind'] for row in catalog['effects'].values())) == index['counts']['kinds']
parsed = []
for case in fixture['cases']:
    tracker = protocol.Tracker(); rows = []
    for sample in case['events']:
        row = protocol.parse(int(sample['opcode'], 16), bytes.fromhex(sample['bodyHex']), worker.decoder)
        assert row and all(row.get(key) == value for key, value in sample['expected'].items()), case['name']
        row.update(time=sample['time'], connectionId=sample['connectionId'])
        result = tracker.accept(row)
        assert result['link'] not in ('metadata-conflict', 'out-of-order', 'serial-unavailable')
        rows.append(row); parsed.append(row)
    assert not tracker.active and len(tracker.intervals) == 1
    assert tracker.intervals[0]['complete']
    if case['name'] == 'apply-remove-silent':
        assert len(rows) == 2 and abs(rows[-1]['time']-rows[0]['time']-rows[0]['durationMsCandidate']/1000) < .25
    if case['name'] == 'stack-updates':
        assert len({row.get('stackCountCandidate') for row in rows[:-1]}) > 1
        assert catalog['effects'][str(rows[0]['effectId'])]['kind'] == 'debuff'
        assert rows[0]['sourceId'] == 8075232 and rows[0]['targetId'] != 8075232
    if case['name'] == 'remaining-updates':
        assert any(0 <= row.get('remainingMsCandidate', -1) < row.get('durationMsCandidate', -1) for row in rows)
print(f'OK: {len(parsed)} quadros reais: aplicar/remover sem updates, stacks, tempo restante, renovacao e fonte/alvo distintos.')

apply = next(row for row in parsed if row['action'] == 'apply')
remove = next(row for row in parsed if row['action'] == 'remove')
tracker = protocol.Tracker(); tracker.accept(dict(apply, connectionId='A'))
assert tracker.accept(dict(remove, connectionId='B'))['link'] == 'start-not-observed'
assert len(tracker.active) == 1
tracker.retire('A'); assert not tracker.active and not tracker.intervals
update = next(row for row in parsed if row['action'] == 'update')
tracker.accept(dict(update, connectionId='C'))
assert next(iter(tracker.active.values()))['startedAt'] is None
assert not tracker.intervals, 'Uma duracao estimada nao e uma remocao observada'
old = dict(update, connectionId='C', time=update['time']-1, previousSerialRaw=update['serialRaw'])
assert tracker.accept(old)['link'] == 'out-of-order'

def vint(value):
    result = bytearray()
    while value >= 128:
        result.append((value & 127) | 128); value >>= 7
    return bytes(result)+bytes([value])
def field(key, value): return vint(key*8)+vint(value)
body = b''.join(field(key, value) for key, value in ((1, 950244781*2), (2, 7), (3, 2**63), (4, 8), (5, 4000), (6, 4000), (7, 2), (10, 2**64-1)))
row = protocol.parse(0x12344a7b, body, worker.decoder)
assert row['serialRaw'] == str(2**64-1) and row['castTokenRaw'] == str(2**63)
assert protocol.parse(0x12344a7b, body+field(2, 9), worker.decoder) is None
assert protocol.parse(0x12344a7b, field(1, 2), worker.decoder) is None
assert protocol.parse(0x12344a7f, body, worker.decoder) is None
assert protocol.parse(0x12344a7b, b'\xff', worker.decoder) is None
print('OK: catalogo/hash, namespaces por conexao, captura parcial, sem expiracao inventada, campos ambiguos e IDs de 64 bits sem perda.')
