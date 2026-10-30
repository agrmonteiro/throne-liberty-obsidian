"""Diagnóstico passivo de 20 s; publica somente contagens e chaves de formato."""
from collections import Counter
import struct
import importlib.util
from pathlib import Path
import time

spec = importlib.util.spec_from_file_location('worker', Path(__file__).with_name('npcap-overlay-worker.py'))
worker = importlib.util.module_from_spec(spec)
spec.loader.exec_module(worker)
original = worker.Stream.feed
deadline = time.monotonic() + 20
keys = Counter()
messages = Counter()

class Done(Exception):
    pass

def emit(message):
    messages[message['type']] += 1
    if message['type'] == 'status':
        print(message, flush=True)

def feed(self, sequence, payload, now):
    if time.monotonic() > deadline:
        raise Done()
    if not hasattr(self, 'sample'):
        self.sample = bytearray()
        self.sample_start = sequence
    offset = sequence - self.sample_start
    if 0 <= offset and offset + len(payload) < 131072:
        if len(self.sample) < offset + len(payload):
            self.sample.extend(b'\x00' * (offset + len(payload) - len(self.sample)))
        self.sample[offset:offset+len(payload)] = payload
    try:
        result = original(self, sequence, payload, now)
    except ValueError:
        headers = []
        for offset in range(len(self.buffer)-7):
            encoded, opcode = struct.unpack_from('<II', self.buffer, offset)
            if offset == 0 or opcode >> 16 == 0x1234:
                headers.append(dict(offset=offset, encoded=hex(encoded), opcode=hex(opcode)))
        print(dict(key=hex(self.length_key) if self.length_key else None, buffered=len(self.buffer), headers=headers[:12]), flush=True)
        destination = Path(__file__).resolve().parent.parent/'scratch/overlay-framing-diagnostic.bin'
        destination.write_bytes(self.sample)
        print(dict(saved=str(destination), bytes=len(self.sample)), flush=True)
        raise
    if self.length_key is not None:
        keys[hex(self.length_key)] += 1
    return result

worker.Stream.feed = feed
worker.emit = emit
try:
    worker.live()
except Done:
    print(dict(result='20 s sem erro de formato', keys=dict(keys), messages=dict(messages)))
