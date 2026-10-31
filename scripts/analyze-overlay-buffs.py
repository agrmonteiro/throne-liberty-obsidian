"""Mapeia ciclo de estados em PCAP local, sem tocar no medidor ou no jogo."""
import argparse
from bisect import bisect_left
from collections import Counter, defaultdict
import gzip
import hashlib
import importlib.util
import json
from pathlib import Path

HERE = Path(__file__).resolve().parent


def module(name, path):
    spec = importlib.util.spec_from_file_location(name, path)
    result = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(result)
    return result


def analyze(folder, catalog_file, output=None, player_name=None):
    ref = module('buff_capture_reference', HERE/'build-overlay-reference.py')
    protocol = module('buff_protocol', HERE/'overlay-buff-protocol.py')
    worker = ref.worker
    compressed = catalog_file.read_bytes()
    catalog = json.loads(gzip.decompress(compressed))
    output = output or folder/'buff-analysis'
    output.mkdir(parents=True, exist_ok=True)
    manifest = json.loads((folder/'manifest.json').read_text(encoding='utf-8'))
    clients = set()
    for line in (folder/'endpoint-snapshots.jsonl').read_text(encoding='utf-8').splitlines():
        for endpoint in json.loads(line)['endpoints']['tcp']:
            clients.add((endpoint['LocalAddress'], int(endpoint['LocalPort'])))
    tracker = protocol.Tracker()
    counts, links, changes, kinds = Counter(), Counter(), Counter(), Counter()
    seen_by_entity, by_effect = defaultdict(Counter), defaultdict(Counter)
    names, players, damage_casts = {}, {}, defaultdict(list)
    events, errors, active, streams, connections = [], [], {}, {}, []
    current, current_direction = None, None
    def emit(item):
        if item['type'] == 'identity':
            names[(item['connectionId'], item['sourceId'])] = item['name']
            if player_name and item['name'] == player_name:
                players[(item['connectionId'], item['sourceId'])] = item['name']
    worker.emit = emit
    original = worker.decoder.frames
    def frames(data, counters, timestamp, depth=0, length_key=None):
        for at, opcode, body in original(data, counters, timestamp, depth, length_key):
            if depth == 0 and current_direction == 'server-to-client':
                if opcode == 0x12344a7f:
                    f = worker.decoder.protobuf(body)
                    if len(f.get(3, [])) == 1 and len(f.get(4, [])) == 1 and all(isinstance(f[k][0], int) for k in (3, 4)):
                        damage_casts[(current['id'], f[3][0], str(f[4][0]))].append(at)
                if opcode in protocol.OPCODES:
                    event = protocol.parse(opcode, body, worker.decoder)
                    if event:
                        effect = catalog['effects'].get(str(event['effectId']), {})
                        event.update(time=at, connectionId=current['id'], kind=effect.get('kind', 'unknown'),
                                     effectRow=effect.get('row'), abnormal=effect.get('abnormal'),
                                     namesPt=effect.get('namesPt', []), namesEn=effect.get('namesEn', []),
                                     iconPaths=effect.get('iconPaths', []), bodyHex=body.hex())
                        event['relation'] = tracker.accept(event)
                        events.append(event)
                        counts[event['action']] += 1
                        kinds[event['kind']] += 1
                        links[event['relation']['link']] += 1
                        if event['relation'].get('change'):
                            changes[event['relation']['change']] += 1
                        seen_by_entity[(current['id'], event['targetId'])][event['action']] += 1
                        by_effect[str(event['effectId'])][event['action']] += 1
                    else:
                        counts['invalid-schema'] += 1
            yield at, opcode, body
    worker.decoder.frames = frames
    try:
        for part in manifest['parts']:
            for packet in ref.records(folder/part['file']):
                if 'payload' not in packet:
                    continue
                a, b = packet['source'], packet['dest']
                pair = tuple(sorted((a, b)))
                syn = packet['flags'] & 2 and not packet['flags'] & 16
                current = active.get(pair)
                if current is None or (syn and current.get('syn') != packet['sequence']):
                    if current:
                        tracker.retire(current['id'])
                    client = a if syn or a in clients else b if b in clients else None
                    current = dict(id=f'tcp-{len(connections)+1:03d}', client=client, endpoints=[a, b], syn=packet['sequence'] if syn else None)
                    connections.append(current); active[pair] = current
                current_direction = 'unknown' if current['client'] is None else 'client-to-server' if a == current['client'] else 'server-to-client'
                if packet['payload']:
                    stream_key = current['id'], a, b
                    stream = streams.setdefault(stream_key, worker.Stream(current['id'], current_direction == 'server-to-client'))
                    try:
                        stream.feed(packet['sequence'], packet['payload'], packet['time'])
                    except (ValueError, AssertionError, IndexError) as error:
                        errors.append(dict(connectionId=current['id'], time=packet['time'], error=str(error)))
                        tracker.retire(current['id'])
                        stream.__init__(current['id'], current_direction == 'server-to-client')
                if packet['flags'] & 5:
                    tracker.retire(current['id']); active.pop(pair, None)
    finally:
        worker.decoder.frames = original
    correlated = 0
    for event in events:
        event['sourceName'] = names.get((event['connectionId'], event['sourceId']))
        event['targetName'] = names.get((event['connectionId'], event['targetId']))
        times = damage_casts.get((event['connectionId'], event['sourceId'], event['castTokenRaw']), [])
        index = bisect_left(times, event['time'])
        if any(abs(at-event['time']) <= 1 for at in times[max(0, index-1):index+1]):
            correlated += 1
    intervals = tracker.intervals
    duration_pairs = [row for row in intervals if row.get('remainingMsCandidate', -1) is not None and row.get('remainingMsCandidate', -1) >= 0]
    near_duration = sum(abs(row['endedAt']-row['lastUpdatedAt']-row['remainingMsCandidate']/1000) <= .25 for row in duration_pairs)
    entities = [dict(connectionId=connection, entityId=entity, name=names.get((connection, entity)), counts=dict(rows))
                for (connection, entity), rows in seen_by_entity.items()]
    summary = dict(schemaVersion=1, capture=folder.name, catalogBuild=catalog['build'], catalogSha256=hashlib.sha256(compressed).hexdigest(),
                   counts=dict(counts), kinds=dict(kinds), links=dict(links), changes=dict(changes),
                   distinctEffects=len(by_effect), entities=len(entities), connections=connections, errors=errors,
                   sourceCastMatchesDamageWithin1Sec=correlated,
                   intervals=dict(observedClosures=len(intervals), applyAndRemoveObserved=sum(row['complete'] for row in intervals),
                                  finiteRemainingPairs=len(duration_pairs), removalNearRemainingWithin250Ms=near_duration),
                   selectedPlayers=[dict(connectionId=c, entityId=e, name=n, counts=dict(seen_by_entity.get((c, e), {}))) for (c, e), n in players.items()],
                   openStatesAtCaptureEnd=len(tracker.active),
                   limitations=['No visual validation of every buff.', 'No full active-state snapshot established.',
                                'Apply can include automatic reapplication; it does not prove a key press.',
                                'Timer and stack fields remain candidates; early removal is not proof of a dispel.',
                                'Open intervals at capture start/end are incomplete; active state is never inferred from damage.'])
    def write(name, data):
        (output/name).write_text(json.dumps(data, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
    write('summary.json', summary)
    write('entities.json', entities)
    write('effects.json', [dict(effectId=int(uid), **catalog['effects'].get(uid, {}), counts=dict(rows)) for uid, rows in sorted(by_effect.items())])
    write('intervals.json', intervals)
    with (output/'events.jsonl').open('w', encoding='utf-8') as file:
        for event in events:
            file.write(json.dumps(event, ensure_ascii=False)+'\n')
    print(json.dumps(dict(output=str(output), **{key:summary[key] for key in ('counts','kinds','changes','links','intervals','selectedPlayers','errors')}), ensure_ascii=True))
    return summary


if __name__ == '__main__':
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('--folder', type=Path, required=True)
    p.add_argument('--catalog', type=Path, required=True)
    p.add_argument('--output', type=Path)
    p.add_argument('--player-name')
    args = p.parse_args()
    analyze(args.folder, args.catalog, args.output, args.player_name)
