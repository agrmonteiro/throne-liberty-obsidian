"""Auditoria offline do vínculo nome/ID; não promove candidatos a identidade ao vivo."""
import argparse
from collections import Counter
import importlib.util
import json
from pathlib import Path
import re

HERE = Path(__file__).resolve().parent


def audit(folder, name, local_config=None, output=None):
    spec = importlib.util.spec_from_file_location('identity_reference', HERE/'build-overlay-reference.py')
    ref = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(ref)
    worker, decoder = ref.worker, ref.worker.decoder
    original = decoder.frames
    clients = set()
    for line in (folder/'endpoint-snapshots.jsonl').read_text(encoding='utf-8').splitlines():
        for endpoint in json.loads(line)['endpoints']['tcp']:
            clients.add((endpoint['LocalAddress'], int(endpoint['LocalPort'])))
    local_ids = set()
    if local_config:
        # Somente o sufixo de personagem dos nomes de seção; nenhum valor de conta/chat.
        text = local_config.read_text(encoding='utf-8-sig')
        local_ids = {int(value, 16) for value in re.findall(r'^\[TLAGS\.CHARACTER\.[^\]\r\n]+\.([0-9A-Fa-f]+)\]\s*$', text, re.M)}
    stats, named, local_signals = Counter(), Counter(), Counter()
    profiles, embedded_profiles, embedded_stats, matches, errors, active, streams = [], [], [], Counter(), [], {}, {}
    current, server = None, False
    connection_count = 0
    needles = [name.casefold().encode('utf-8'), name.casefold().encode('utf-16-le')]

    def scalar_matches(body, prefix='', depth=0):
        if depth > 8 or len(body) > 2_000_000:
            return
        try:
            fields = decoder.protobuf(body)
        except (ValueError, TypeError, IndexError):
            return
        for key, values in fields.items():
            path = f'{prefix}.{key}' if prefix else str(key)
            for value in values[:4096]:
                if isinstance(value, int):
                    if value in local_ids:
                        yield path, value, 'unsigned'
                    if decoder.zigzag(value) in local_ids:
                        yield path, decoder.zigzag(value), 'zigzag'
                elif isinstance(value, bytes) and value:
                    yield from scalar_matches(value, path, depth+1)

    def named_profiles(body, prefix='', depth=0):
        if depth > 8 or len(body) > 2_000_000:
            return
        try:
            fields = decoder.protobuf(body)
        except (ValueError, TypeError, IndexError):
            return
        if fields.get(2) == [name.encode('utf-8')] and fields.get(26) == [b'tribe.Pc']:
            yield dict(path=prefix, persistentIdCandidate=fields.get(1, [None])[0], sourceId=fields.get(19, [None])[0])
        if fields.get(98):
            totals = {}
            try:
                for raw in fields[98]:
                    row = decoder.protobuf(raw)
                    if len(row.get(1, [])) != 1 or not isinstance(row[1][0], int):
                        raise ValueError('Linha sem ID')
                    totals[str(row[1][0])] = decoder.zigzag(row.get(6, [0])[0])
                embedded_stats.append(dict(connectionId=current, path=f'{prefix}.98', fields=len(totals),
                                           checkedTotals={key:totals[key] for key in ('1','2','3','4','14','28','253') if key in totals}))
            except (ValueError, TypeError, IndexError):
                pass
        for key, values in fields.items():
            for value in values[:4096]:
                if isinstance(value, bytes) and name.encode('utf-8') in value:
                    yield from named_profiles(value, f'{prefix}.{key}' if prefix else str(key), depth+1)

    def frames(data, counters, timestamp, depth=0, length_key=None):
        for at, opcode, body in original(data, counters, timestamp, depth, length_key):
            if depth == 0:
                direction = 'server-to-client' if server else 'client-to-server'
                if any(needle in body.lower() for needle in needles):
                    named[(current, hex(opcode), direction)] += 1
                    if server:
                        embedded_profiles.extend(dict(connectionId=current, opcode=hex(opcode), time=at, **profile) for profile in named_profiles(body))
                if server:
                    if decoder.character_stats(opcode, body):
                        stats[(current, hex(opcode))] += 1
                    if opcode == 0x1234444a:
                        actor = decoder.local_player_entity(body)
                        if actor:
                            local_signals[(current, actor)] += 1
                    if opcode in (0x1234787f, 0x1234787d):
                        profile = decoder.player_identity(body, opcode)
                        if profile and profile['name'] == name:
                            fields = decoder.protobuf(body)
                            for key in ((1, 1) if opcode == 0x1234787f else (1, 5, 1)):
                                fields = decoder.protobuf(fields[key][0])
                            profiles.append(dict(connectionId=current, opcode=hex(opcode), time=at, **profile, persistentIdCandidate=fields.get(1, [None])[0]))
                for field, uid, encoding in scalar_matches(body):
                    matches[(current, hex(opcode), direction, field, uid, encoding)] += 1
            yield at, opcode, body

    decoder.frames, worker.emit = frames, lambda _: None
    try:
        for part in json.loads((folder/'manifest.json').read_text(encoding='utf-8'))['parts']:
            for packet in ref.records(folder/part['file']):
                if 'payload' not in packet:
                    continue
                a, b = packet['source'], packet['dest']
                pair = tuple(sorted((a, b)))
                syn = packet['flags'] & 2 and not packet['flags'] & 16
                connection = active.get(pair)
                if connection is None or syn and connection['syn'] != packet['sequence']:
                    connection_count += 1
                    connection = dict(id=f'tcp-{connection_count:03d}', client=a if a in clients else b if b in clients else None,
                                      syn=packet['sequence'] if syn else None)
                    active[pair] = connection
                current, server = connection['id'], connection['client'] == b
                if connection['client'] is not None and packet['payload']:
                    stream = streams.setdefault((current, a, b), worker.Stream(current, server))
                    try:
                        stream.feed(packet['sequence'], packet['payload'], packet['time'])
                    except (ValueError, IndexError, AssertionError, TypeError) as error:
                        if len(errors) < 100:
                            errors.append(dict(connectionId=current, time=packet['time'], error=str(error)))
                        stream.__init__(current, server)
                if packet['flags'] & 5:
                    active.pop(pair, None)
    finally:
        decoder.frames = original
    result = dict(schemaVersion=1, capture=folder.name, playerName=name, profiles=profiles, embeddedProfiles=embedded_profiles, profileEnvelopeStats=embedded_stats,
                  statFrames=[dict(connectionId=c, opcode=op, count=count) for (c, op), count in stats.items()],
                  nameFrames=[dict(connectionId=c, opcode=op, direction=d, count=count) for (c, op, d), count in named.items()],
                  localSignals=[dict(connectionId=c, sourceId=actor, count=count, confirmedIdentity=False) for (c, actor), count in local_signals.items()],
                  localCharacterIds=sorted(local_ids),
                  localIdMatches=[dict(connectionId=c, opcode=op, direction=d, field=field, persistentIdCandidate=uid, encoding=enc, count=count)
                                  for (c, op, d, field, uid, enc), count in matches.items()],
                  errors=errors, limitations=['IDs de seções locais podem ser históricos; nomes em abas de conversa não identificam o jogador.',
                                             'Coincidência numérica, sinal local isolado e primeiro atacante não confirmam identidade.'])
    output = output or folder/'identity-audit.json'
    output.write_text(json.dumps(result, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
    print(json.dumps(dict(output=str(output), profiles=len(profiles), statFrames=sum(stats.values()), nameFrames=sum(named.values()),
                         localIdMatches=len(matches), errors=len(errors))))
    return result


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--folder', type=Path, required=True)
    parser.add_argument('--player-name', required=True)
    parser.add_argument('--local-config', type=Path)
    parser.add_argument('--output', type=Path)
    args = parser.parse_args()
    audit(args.folder, args.player_name, args.local_config, args.output)
