"""Candidatos de estado: não substitui validação de uma morte do jogador no jogo."""
import importlib.util
import struct
from pathlib import Path
here = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location('death_worker', here/'npcap-overlay-worker.py')
worker = importlib.util.module_from_spec(spec); spec.loader.exec_module(worker)

def vint(value):
    result = bytearray()
    while value >= 128:
        result.append((value & 127) | 128); value >>= 7
    return bytes(result) + bytes([value])

def field(key, value):
    return vint(key * 8 + (2 if isinstance(value, bytes) else 0)) + (vint(len(value)) + value if isinstance(value, bytes) else vint(value))

dead = field(1, 7) + field(2, field(4, field(1, 2)) + field(5, b''))
assert worker.entity_state(dead) == dict(targetId=7, stateCode=2, deathCandidate=True)
for body in (field(1, 7), dead + field(1, 8), field(1, 7) + field(2, field(4, field(1, 2))),
             field(1, 7) + field(2, field(4, field(1, 1)) + field(5, b'')),
             field(1, 7) + field(2, field(4, field(1, 2) + field(1, 1)) + field(5, b''))):
    assert not (worker.entity_state(body) or {}).get('deathCandidate')
raw = worker.packet_details(0x12346f6d, field(1, 2**64-1), True)
assert raw['fields']['1'] == [str(2**64-1)]
assert raw['bodyHex'] == field(1, 2**64-1).hex()
raw = worker.packet_details(1, b'x'*20000, True)
assert raw['truncated'] and len(raw['bodyHex']) == 32768 and raw['bytes'] == 20000
messages = []; worker.emit = messages.append
frame = struct.pack('<II', (len(dead)+8) ^ worker.decoder.FRAME_LENGTH_KEYS[1], 0x12346f6d) + dead
for server in (False, True):
    messages.clear(); stream = worker.Stream('A', server); stream.feed(0, frame*2, 1000)
    assert len(messages) == (2 if server else 0)
    stream.feed(0, frame*2, 1001)
    assert len(messages) == (2 if server else 0)
unknown = field(1, 2) + field(2, 7) + field(3, 100) + field(4, 8) + field(5, 4)
assert worker.periodic_healing(unknown) is None
assert worker.effect_observation(unknown, 0x12344a63)['observedAmount'] == 50
messages.clear()
frame = struct.pack('<II', (len(unknown)+8) ^ worker.decoder.FRAME_LENGTH_KEYS[1], 0x12344a63) + unknown
worker.Stream('A', True).feed(0, frame*2, 1000)
assert len(messages) == 2 and all(row['type'] == 'effect-observation' for row in messages)
print('OK: estado experimental estrito, direção/retransmissão, inteiro 64 bits, corpo limitado e efeito desconhecido separado da cura.')
