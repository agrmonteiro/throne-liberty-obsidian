"""Observa por 45 s sinais candidatos de combate; não envia entradas ao jogo."""
from collections import Counter
import importlib.util
from pathlib import Path
import time

spec = importlib.util.spec_from_file_location('worker', Path(__file__).with_name('npcap-overlay-worker.py'))
worker = importlib.util.module_from_spec(spec)
spec.loader.exec_module(worker)
original_frames = worker.decoder.frames
original_feed = worker.Stream.feed
deadline = time.monotonic() + 45
damage = Counter()

class Done(Exception):
    pass

def frames(data, counters, timestamp, depth=0, length_key=None):
    for stamp, opcode, body in original_frames(data, counters, timestamp, depth, length_key):
        if depth == 0 and opcode == 0x1234444a:
            fields = worker.decoder.protobuf(body)
            print(dict(type='combat-state-candidate', time=stamp, sourceId=fields.get(1), flag=fields.get(2, [0])), flush=True)
        yield stamp, opcode, body

def feed(self, sequence, payload, now):
    if time.monotonic() >= deadline:
        raise Done()
    return original_feed(self, sequence, payload, now)

def emit(message):
    if message['type'] == 'damage':
        event = message['event']
        damage[event['sourceId']] += event['damage']
    elif message['type'] in ('identity', 'status'):
        print(message, flush=True)

worker.decoder.frames = frames
worker.Stream.feed = feed
worker.emit = emit
try:
    worker.live()
except Done:
    print(dict(type='summary', damage=damage.most_common(8)), flush=True)
