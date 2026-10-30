"""O sinal de entidade local deve coincidir com o atacante validado pelos logs."""
import importlib.util
from pathlib import Path
import struct

here = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location('worker', here/'npcap-overlay-worker.py')
worker = importlib.util.module_from_spec(spec)
spec.loader.exec_module(worker)
messages = []
worker.emit = messages.append
for folder, own in [('20261021-170507-516139', 26790374), ('20261022-085801-488648', 17375758)]:
    root = here.parent/'capturas_treinamento/npcap_tl'/folder
    messages.clear()
    streams = {}
    loop = root/('interface-4.pcap' if own == 26790374 else 'interface-0.pcap')
    for packet in worker.decoder.packets(loop):
        key = packet['source'], packet['dest']
        streams.setdefault(key, worker.Stream(folder, packet['source'] == 54633)).feed(packet['sequence'], packet['payload'], packet['time'])
    signals = [row for row in messages if row['type'] == 'local-player']
    assert signals and {row['sourceId'] for row in signals} == {own}
    assert all(row['connectionId'] == folder for row in signals)
    assert len(signals) == (1 if own == 26790374 else 11)
    print(f'OK: {len(signals)} sinais locais da captura {folder} coincidem com atacante {own} validado pelo log.')

def vint(value):
    out = bytearray()
    while value >= 128:
        out.append((value & 127) | 128); value >>= 7
    return bytes(out) + bytes([value])

def field(key, value):
    return vint(key * 8) + vint(value)

for flag in (b'', field(2, 0), field(2, 1)):
    assert worker.decoder.local_player_entity(field(1, 8075232) + flag) == 8075232
for bad in (b'', field(1, 0), field(1, 2**54), field(1, 8) + field(2, 2), field(1, 8) + field(3, 1), field(1, 8) * 2):
    assert worker.decoder.local_player_entity(bad) is None
body = field(1, 8075232) + field(2, 1)
frame = struct.pack('<II', (len(body) + 8) ^ worker.decoder.FRAME_LENGTH_KEYS[1], 0x1234444a) + body
messages.clear()
worker.Stream('client', False).feed(0, frame * 2, 100)
assert not messages, 'Somente mensagens servidor -> cliente podem identificar o jogador local'
print('OK: flags não definem sessões, mensagem inválida e direção do cliente não identificam jogador.')
