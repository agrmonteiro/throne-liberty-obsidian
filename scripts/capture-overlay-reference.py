"""Coleta passiva filtrada do TL, com PCAP bruto e eventos, para referência local."""
import argparse
from collections import Counter
import ctypes as C
from datetime import datetime, timezone
import importlib.util
import json
from pathlib import Path
import struct
import time

HERE = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location('worker', HERE/'npcap-overlay-worker.py')
worker = importlib.util.module_from_spec(spec)
spec.loader.exec_module(worker)

class Finished(Exception):
    pass

def utc():
    return datetime.now(timezone.utc).isoformat()

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--duration', type=int, default=600, choices=range(10, 1801))
    args = parser.parse_args()
    out = HERE.parent/'capturas_treinamento/npcap_tl'/datetime.now().strftime('%Y%m%d-%H%M%S-reference')
    out.mkdir(parents=True)
    start = time.monotonic()
    deadline = start + args.duration
    manifest = dict(status='capturando', startedAtUtc=utc(), requestedDurationSec=args.duration,
                    scope='Somente Npcap Loopback e endpoints TCP locais pertencentes ao TL.exe; filtro atualizado a cada inventário.',
                    parts=[], packets=0, capturedBytes=0, messageTypes={}, interruptions=[], decoderErrors=[],
                    limitations=['Sem log de combate atual: totais ainda não são validação independente.',
                                 'PCAP preservado mesmo quando o decoder experimental falha.'])
    events = (out/'events.jsonl').open('w', encoding='utf-8')
    counts = Counter()
    load_api = worker.capture.load_api
    original_endpoints = worker.capture.endpoints
    def recorded_endpoints():
        snapshot = original_endpoints()
        with (out/'endpoint-snapshots.jsonl').open('a', encoding='utf-8') as file:
            file.write(json.dumps(dict(timeUtc=utc(), endpoints=snapshot), ensure_ascii=False)+'\n')
        return snapshot
    worker.capture.endpoints = recorded_endpoints
    last_heartbeat = start
    def save():
        manifest.update(elapsedSec=time.monotonic()-start, messageTypes=dict(counts))
        (out/'manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding='utf-8')
        events.flush()
    def emit(message):
        counts[message['type']] += 1
        events.write(json.dumps(dict(receivedAtUtc=utc(), **message), ensure_ascii=False)+'\n')
    class API:
        def __init__(self, raw):
            self.raw, self.dump, self.part = raw, None, None
        def __getattr__(self, name):
            return getattr(self.raw, name)
        def close_dump(self):
            if self.dump:
                self.raw.pcap_dump_flush(self.dump); self.raw.pcap_dump_close(self.dump)
                self.part['bytes'] = (out/self.part['file']).stat().st_size
                self.dump = None
        def open_dump(self, handle):
            self.close_dump()
            file = f'loopback-{len(manifest["parts"]):03d}.pcap'
            self.dump = self.raw.pcap_dump_open(handle, str(out/file).encode())
            if not self.dump:
                raise RuntimeError('Não foi possível gravar o PCAP de referência.')
            self.part = dict(file=file, packets=0, capturedBytes=0)
            manifest['parts'].append(self.part)
        def pcap_next_ex(self, handle, header_out, packet_out):
            nonlocal last_heartbeat
            now = time.monotonic()
            if now >= deadline:
                raise Finished()
            result = self.raw.pcap_next_ex(handle, header_out, packet_out)
            if result == 1:
                if not self.dump or self.part['capturedBytes'] >= 32*1024*1024:
                    self.open_dump(handle)
                header = C.cast(header_out, C.POINTER(C.c_void_p)).contents.value
                packet = C.cast(packet_out, C.POINTER(C.c_void_p)).contents.value
                size = struct.unpack('<IIII', C.string_at(header, 16))[2]
                self.raw.pcap_dump(self.dump, header, packet)
                self.part['packets'] += 1; self.part['capturedBytes'] += size
                manifest['packets'] += 1; manifest['capturedBytes'] += size
            if now-last_heartbeat >= 30:
                last_heartbeat = now
                if self.dump:
                    self.raw.pcap_dump_flush(self.dump)
                save()
                print(json.dumps(dict(elapsedSec=round(now-start), packets=manifest['packets'], messageTypes=dict(counts))), flush=True)
            return result
        def pcap_close(self, handle):
            self.close_dump(); self.raw.pcap_close(handle)
    def wrapped_load():
        raw, directory = load_api()
        return API(raw), directory
    original_feed = worker.Stream.feed
    def feed(stream, sequence, payload, at):
        try:
            return original_feed(stream, sequence, payload, at)
        except (ValueError, AssertionError, IndexError) as error:
            manifest['decoderErrors'].append(dict(time=at, connectionId=stream.connection_id, error=str(error)))
            stream.__init__(stream.connection_id, stream.server_to_client)
    worker.capture.load_api = wrapped_load
    worker.emit = emit
    worker.Stream.feed = feed
    save()
    print(json.dumps(dict(output=str(out), durationSec=args.duration, startedAtUtc=manifest['startedAtUtc'])), flush=True)
    try:
        while time.monotonic() < deadline:
            try:
                worker.live()
            except Finished:
                break
            except Exception as error:
                manifest['interruptions'].append(dict(timeUtc=utc(), error=str(error)))
                save(); time.sleep(min(2, max(0, deadline-time.monotonic())))
        manifest['status'] = 'captura_concluida'
    except BaseException:
        manifest['status'] = 'captura_interrompida'
        raise
    finally:
        manifest['endedAtUtc'] = utc()
        save(); events.close()
        print(json.dumps(dict(output=str(out), status=manifest['status'], packets=manifest['packets'], elapsedSec=manifest['elapsedSec'])), flush=True)

if __name__ == '__main__':
    main()
