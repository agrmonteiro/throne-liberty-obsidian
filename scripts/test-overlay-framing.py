"""Regressão da chave de comprimento observada em 30/10/2026."""
import importlib.util
from pathlib import Path
import struct

spec = importlib.util.spec_from_file_location('worker', Path(__file__).with_name('npcap-overlay-worker.py'))
worker = importlib.util.module_from_spec(spec)
spec.loader.exec_module(worker)
events = []
worker.emit = events.append

def vint(value):
    output = bytearray()
    while value >= 128:
        output.append((value & 127) | 128)
        value >>= 7
    return bytes(output) + bytes([value])

def field(key, value):
    return vint(key * 8) + vint(value)

def frame(key, damage=500):
    body = field(2, 8) + field(3, damage * 2) + field(4, 7) + field(7, 20)
    return struct.pack('<II', (len(body) + 8) ^ key, 0x12344a62) + body

for key in worker.decoder.FRAME_LENGTH_KEYS:
    events.clear()
    data = frame(key) + frame(key, 700)
    stream = worker.Stream()
    # Começo no meio da conexão; cabeçalhos e mensagens divididos em segmentos.
    data = b'\xff\x00\x01' + data
    sequence = 100
    for offset in range(0, len(data), 5):
        payload = data[offset:offset+5]
        stream.feed(sequence+offset, payload, 1000)
    assert stream.length_key == key
    assert [row['event']['damage'] for row in events] == [500, 700]
    assert all(row['event']['sourceId'] == 7 for row in events)
    stream.feed(sequence, data, 1001)
    assert len(events) == 2, 'Retransmissão não pode duplicar dano'
    try:
        stream.feed(sequence + len(data), b'\x00' * 8, 1002)
    except ValueError as error:
        assert 'formato' in str(error)
    else:
        raise AssertionError('Corrupção real não pode ser ignorada')

# Cabeçalho único ambíguo não pode selecionar a chave antiga por engano.
modern = struct.pack('<II', 0xb06c487c, 0x12347a78) + b'\x00' * 42
stream = worker.Stream()
stream.feed(0, modern, 0)
assert not stream.aligned
stream.feed(50, struct.pack('<II', 0xb06c486b, 0x12347a7b), 1)
assert not stream.aligned, 'Cabeçalhos internos ou mensagens parciais não confirmam a fronteira'
stream.feed(58, b'\x00' * 29, 2)
assert stream.aligned and stream.length_key == 0xb06c484e
# Dois cabeçalhos aparentes no meio de um bloco LZ4 não são uma fronteira confiável.
assert worker.decoder.frame_key(modern + struct.pack('<II', 37 ^ 0xb06c484e, 0x12347a7b) + b'\x00' * 29 + b'\x02\x00') is None
print('OK: chaves antiga/atual, segmentação TCP, alinhamento, retransmissão e rejeição de corrupção.')

from collections import Counter
for key in worker.decoder.FRAME_LENGTH_KEYS:
    nested = frame(key)
    # Bloco LZ4 com literais: verifica também a chave no conteúdo comprimido.
    packed = bytes([min(15, len(nested)) << 4])
    if len(nested) >= 15:
        packed += bytes([len(nested) - 15])
    packed += nested
    compressed = struct.pack('<II', (len(packed) + 8) ^ key, 0x12343987) + packed
    decoded = list(worker.decoder.frames(compressed, Counter(), lambda _: 1000, length_key=key))
    assert len(decoded) == 1 and decoded[0][1] == 0x12344a62
    assert list(worker.decoder.frames(frame(key) + frame(key), Counter(), lambda _: 1000))
print('OK: quadros comprimidos e detecção offline das duas chaves.')

# Conexões longas não podem congelar quando a sequência TCP passa de 2^32.
events.clear()
data = frame(worker.decoder.FRAME_LENGTH_KEYS[1]) + frame(worker.decoder.FRAME_LENGTH_KEYS[1], 700)
stream = worker.Stream()
start = 2**32 - 12
stream.feed(start, data[:12], 1000)
stream.feed(0, data[12:], 1001)
assert [row['event']['damage'] for row in events] == [500, 700]
stream.feed(start, data[:12], 1002)
stream.feed(0, data[12:], 1003)
assert len(events) == 2
assert stream.expected == start + len(data)
print('OK: continuidade e retransmissões na virada de sequência TCP de 32 bits.')
