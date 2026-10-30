"""Indexa PCAPs do TL sem transformar coocorrências numéricas em identidades."""
import argparse
from collections import Counter, defaultdict
from datetime import datetime, timezone
import importlib.util
import json
from pathlib import Path
import struct

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
spec = importlib.util.spec_from_file_location('worker', HERE/'npcap-overlay-worker.py')
worker = importlib.util.module_from_spec(spec)
spec.loader.exec_module(worker)

def stamp(value):
    return datetime.fromtimestamp(value, timezone.utc).isoformat()

def records(path):
    with path.open('rb') as file:
        header = file.read(24)
        if len(header) != 24 or header[:4] != b'\xd4\xc3\xb2\xa1':
            raise ValueError(f'PCAP little endian esperado: {path}')
        link = struct.unpack_from('<I', header, 20)[0]
        if link not in (0, 1):
            raise ValueError(f'Linktype não suportado: {link}')
        while header := file.read(16):
            if len(header) != 16:
                raise ValueError('Cabeçalho PCAP parcial')
            sec, usec, size, wire = struct.unpack('<IIII', header)
            raw = file.read(size)
            if len(raw) != size:
                raise ValueError('Pacote PCAP parcial')
            at = sec + usec / 1e6
            ip = raw[4:] if link == 0 else raw[14:] if raw[12:14] == b'\x08\x00' else b''
            packet = dict(time=at, captured=size, wire=wire)
            if len(ip) >= 20 and ip[0] >> 4 == 4 and ip[9] == 6:
                tcp = ip[(ip[0] & 15)*4:struct.unpack_from('!H', ip, 2)[0]]
                if len(tcp) >= 20:
                    a, b, seq = struct.unpack_from('!HHI', tcp)
                    packet.update(source=('.'.join(map(str, ip[12:16])), a), dest=('.'.join(map(str, ip[16:20])), b),
                                  sequence=seq, flags=tcp[13], payload=tcp[(tcp[12] >> 4)*4:])
            yield packet

def build(folder, player_name=None):
    manifest = json.loads((folder/'manifest.json').read_text(encoding='utf-8'))
    names = json.loads((ROOT/'src/data/overlaySkillNames.json').read_text(encoding='utf-8'))
    known_clients = set()
    snapshots = folder/'endpoint-snapshots.jsonl'
    if snapshots.exists():
        for line in snapshots.read_text(encoding='utf-8').splitlines():
            for endpoint in json.loads(line)['endpoints']['tcp']:
                known_clients.add((endpoint['LocalAddress'], int(endpoint['LocalPort'])))
    connections, active, streams, entities, skills, edges = [], {}, {}, {}, {}, {}
    opcodes, fields, envelopes = {}, {}, Counter()
    errors, signals = [], []
    bins = defaultdict(Counter)
    packet_count = payload_bytes = retransmissions = 0
    current = None
    first_time = last_time = None
    def entity(value, role, at):
        if not isinstance(value, int) or not 0 < value <= 2**53 - 1:
            return None
        key = f'{current["id"]}:{value}'
        row = entities.setdefault(key, dict(key=key, connectionId=current['id'], entityId=str(value), roles=set(),
            firstSeen=at, lastSeen=at, outgoingDamage=0, incomingDamage=0, outgoingHits=0, incomingHits=0, skills=set(), names=set()))
        row['roles'].add(role); row['firstSeen'] = min(row['firstSeen'], at); row['lastSeen'] = max(row['lastSeen'], at)
        return row
    def message(item):
        kind = item['type']
        if kind == 'damage':
            event = item['event']; at = event['time']
            source = entity(event['sourceId'], 'attacker', at)
            target = entity(event.get('targetId'), 'target', at)
            if not source or not target:
                return
            amount, skill_id = event['damage'], str(event['skillId'])
            source['outgoingDamage'] += amount; source['outgoingHits'] += 1; source['skills'].add(skill_id)
            target['incomingDamage'] += amount; target['incomingHits'] += 1
            skill = skills.setdefault(skill_id, dict(skillId=skill_id, referenceName=names.get(skill_id), events=0, damage=0,
                attackers=set(), targets=set(), firstSeen=at, lastSeen=at, criticalEvents=0, heavyEvents=0))
            skill['events'] += 1; skill['damage'] += amount; skill['attackers'].add(source['key']); skill['targets'].add(target['key'])
            skill['firstSeen'] = min(skill['firstSeen'], at); skill['lastSeen'] = max(skill['lastSeen'], at)
            skill['criticalEvents'] += bool(event['criticalCandidate']); skill['heavyEvents'] += bool(event['heavyCandidate'])
            edge_key = source['key'], target['key'], skill_id
            edge = edges.setdefault(edge_key, dict(connectionId=current['id'], attacker=source['key'], target=target['key'],
                skillId=skill_id, events=0, damage=0, firstSeen=at, lastSeen=at))
            edge['events'] += 1; edge['damage'] += amount; edge['lastSeen'] = at
            bins[int((at-first_time)//30)][source['key']] += amount
        elif kind == 'local-player':
            row = entity(item['sourceId'], 'local-player-signal', item['time'])
            if row:
                signals.append(dict(time=item['time'], connectionId=current['id'], entity=row['key'], evidence='server opcode 0x1234444a, field 1'))
        elif kind == 'identity':
            row = entity(item['sourceId'], 'profile-identity', current['lastSeen'])
            if row:
                row['names'].add(item['name'])
    def inspect(opcode, body, path='', depth=0):
        try:
            parsed = worker.decoder.protobuf(body)
        except (ValueError, IndexError, TypeError):
            return False
        for key, values in parsed.items():
            field_path = f'{path}.{key}' if path else str(key)
            field_key = f'{opcode}:{field_path}'
            row = fields.setdefault(field_key, dict(opcode=opcode, field=field_path, occurrences=0, kinds=Counter(),
                numericValues=Counter(), samplesCapped=False, minBytes=None, maxBytes=None))
            for value in values:
                row['occurrences'] += 1
                if isinstance(value, int):
                    row['kinds']['varint'] += 1
                    number = str(value)
                    if number in row['numericValues'] or len(row['numericValues']) < 2048:
                        row['numericValues'][number] += 1
                    else:
                        row['samplesCapped'] = True
                else:
                    row['kinds']['bytes-or-fixed'] += 1
                    size = len(value)
                    row['minBytes'] = size if row['minBytes'] is None else min(row['minBytes'], size)
                    row['maxBytes'] = size if row['maxBytes'] is None else max(row['maxBytes'], size)
                    if depth < 3 and 0 < size <= 4096:
                        inspect(opcode, value, field_path, depth+1)
        return True
    original_frames = worker.decoder.frames
    def frames(data, counters, timestamp, depth=0, length_key=None):
        if depth == 0:
            envelopes[hex(struct.unpack_from('<I', data, 4)[0])] += 1
        for at, opcode, body in original_frames(data, counters, timestamp, depth, length_key):
            if depth == 0:
                code = hex(opcode)
                row = opcodes.setdefault(code, dict(opcode=code, messages=0, bodyBytes=0, minBodyBytes=len(body), maxBodyBytes=0,
                    firstSeen=at, lastSeen=at, directions=Counter(), protobufMessages=0))
                row['messages'] += 1; row['bodyBytes'] += len(body); row['minBodyBytes'] = min(row['minBodyBytes'], len(body))
                row['maxBodyBytes'] = max(row['maxBodyBytes'], len(body)); row['lastSeen'] = at
                row['directions'][current['direction']] += 1
                row['protobufMessages'] += inspect(code, body)
                if opcode == 0x1234444a:
                    parsed = worker.decoder.protobuf(body)
                    row.setdefault('flag2Values', Counter()).update(map(str, parsed.get(2, [0])))
            yield at, opcode, body
    worker.decoder.frames = frames
    worker.emit = message
    files = [folder/row['file'] for row in manifest.get('parts', [])]
    if not files:
        files = sorted(folder.glob('*.pcap'))
    for file in files:
        for packet in records(file):
            packet_count += 1; at = packet['time']
            first_time = at if first_time is None else first_time; last_time = at
            if 'payload' not in packet:
                continue
            a, b = packet['source'], packet['dest']
            pair = tuple(sorted((a, b)))
            syn = packet['flags'] & 2 and not packet['flags'] & 16
            current = active.get(pair)
            if current is None or (syn and current.get('synSequence') != packet['sequence']):
                client = a if syn or a in known_clients else b if b in known_clients else None
                current = dict(id=f'tcp-{len(connections)+1:03d}', endpoints=[list(x) for x in pair], client=list(client) if client else None,
                    directionEvidence='TCP SYN' if syn else 'TL endpoint inventory' if client else 'unknown',
                    firstSeen=at, lastSeen=at, packets=0, payloadBytes=0, closed=False, frameKeys=set(), synSequence=packet['sequence'] if syn else None)
                connections.append(current); active[pair] = current
            current['lastSeen'] = at; current['packets'] += 1
            current['direction'] = 'unknown' if current['client'] is None else 'client_to_server' if list(a) == current['client'] else 'server_to_client'
            payload = packet['payload']
            if payload:
                payload_bytes += len(payload); current['payloadBytes'] += len(payload)
                key = current['id'], a, b
                stream = streams.setdefault(key, worker.Stream(current['id'], current['direction'] == 'server_to_client'))
                if stream.expected is not None and packet['sequence'] + len(payload) <= stream.expected:
                    retransmissions += 1
                try:
                    stream.feed(packet['sequence'], payload, at)
                except (ValueError, AssertionError, IndexError) as error:
                    errors.append(dict(connectionId=current['id'], direction=current['direction'], time=at, error=str(error)))
                    stream.__init__(current['id'], current['direction'] == 'server_to_client')
                if stream.length_key:
                    current['frameKeys'].add(hex(stream.length_key))
            if packet['flags'] & 5:
                current['closed'] = True
    worker.decoder.frames = original_frames
    entity_values = defaultdict(list)
    for row in entities.values():
        entity_values[row['entityId']].append(row['key'])
        for key in ('roles', 'skills', 'names'):
            row[key] = sorted(row[key])
    for row in skills.values():
        row['attackers'] = sorted(row['attackers']); row['targets'] = sorted(row['targets'])
    for row in fields.values():
        row['entityValueCoincidences'] = [dict(value=value, observed=count, scopedEntities=entity_values[value])
            for value, count in row['numericValues'].items() if value in entity_values]
        row['frequentNumericValues'] = row.pop('numericValues').most_common(8)
    for row in connections:
        row['frameKeys'] = sorted(row['frameKeys']); row.pop('direction', None)
    semantics = {
        'framing': dict(length='uint32 little-endian XOR key, including the 8-byte header', keys=['0xb06c4908', '0xb06c484e'],
                        compressedOpcode='0x12343987', compression='LZ4 block; nested frames use the same key'),
        '0x12344a7f': dict(role='damage', evidence='older PCAP/combat-log comparisons', fields={
            '2': 'target entity ID', '3': 'attacker entity ID', '5.1': 'damage, zigzag decoded',
            '15': 'skill ID, zigzag decoded', '6': 'value 6 is the critical candidate', '19': 'nonzero is the heavy candidate'}),
        '0x12344a62': dict(role='secondary damage', evidence='older PCAP/combat-log comparisons', fields={
            '2': 'target entity ID', '3': 'damage, zigzag decoded', '4': 'attacker entity ID', '7': 'skill ID, zigzag decoded'},
            limitation='Critical/heavy fields not identified; normal defaults are inferred from the older reference.'),
        '0x1234787f': dict(role='profile identity', evidence='older profile and attacker/log correspondence', fields={
            '1.1.2': 'name, UTF-8', '1.1.19': 'player entity ID', '1.1.20': 'selected target, NOT player identity', '1.1.26': 'tribe.Pc discriminator'}),
        '0x1234444a': dict(role='local entity signal, experimental', evidence='matches the local attacker in two older captures with independent logs',
            fields={'1': 'local entity candidate; accept server -> client only', '2': 'state flag 0/1; full meaning unknown'},
            limitation='Flag changes inside an attack sequence; do not use as combat-session boundary.'),
    }
    coverage = [dict(connectionId=key[0], source=list(key[1]), dest=list(key[2]), aligned=stream.aligned,
                    key=hex(stream.length_key) if stream.length_key else None, pendingTcpSegments=len(stream.pending),
                    remainingBytes=len(stream.buffer)) for key, stream in streams.items()]
    entity_rows = sorted(entities.values(), key=lambda row: row['outgoingDamage'], reverse=True)
    skill_rows = sorted(skills.values(), key=lambda row: row['damage'], reverse=True)
    summary = dict(schemaVersion=1, captureFolder=str(folder), capturedAtUtc=manifest['startedAtUtc'],
        requestedDurationSec=manifest['requestedDurationSec'], elapsedSec=manifest['elapsedSec'], firstPacketUtc=stamp(first_time) if first_time else None,
        lastPacketUtc=stamp(last_time) if last_time else None, packetSpanSec=last_time-first_time if first_time else 0,
        packets=packet_count, tcpPayloadBytes=payload_bytes, duplicateOrRetransmittedSegments=retransmissions,
        decodedMessages=sum(row['messages'] for row in opcodes.values()), opcodes=len(opcodes), fields=len(fields),
        entities=len(entities), skills=len(skills), relations=len(edges), damageEvents=sum(row['events'] for row in skill_rows),
        damageCandidateSum=sum(row['damage'] for row in skill_rows), decoderErrors=errors,
        localPlayerEntities=sorted({row['entity'] for row in signals}), localPlayerSignals=len(signals), envelopes=dict(envelopes),
        evidence=dict(playerNameProvidedByUser=player_name, independentCombatLog=False,
            nativeCombatSessionId='not identified', localEntitySignal='0x1234444a field 1; validated against two older captures/logs',
            flag2='alternates during attack sequences; not a combat boundary'),
        rules=['Entity IDs are scoped to this TCP connection/capture; never persist them as permanent character IDs.',
            'Match local-player evidence; never choose the first/highest-damage attacker.',
            'An opcode/field numeric coincidence is a candidate reference, not a verified relationship.',
            'Keep capture ID, TCP generation and locally generated encounter ID separate.',
            'Integers in reference tables are strings to preserve values larger than 2^53.',
            'Skill names come from the existing reference dictionary; this capture has no independent damage log.'],
        streamCoverage=coverage, pcapDropStatistics='not collected; absence of decoder errors does not independently prove zero packet loss',
        files=dict(entities='entities.json', skills='skills.json', relations='relations.json', protocol='protocol-fields.json',
                   semantics='protocol-semantics.json', connections='connections.json', timeline='timeline.json'))
    def write(name, value):
        (folder/name).write_text(json.dumps(value, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
    write('entities.json', entity_rows); write('skills.json', skill_rows); write('relations.json', list(edges.values()))
    write('protocol-fields.json', dict(opcodes=sorted(opcodes.values(), key=lambda row: row['messages'], reverse=True), fields=list(fields.values())))
    write('connections.json', connections)
    write('protocol-semantics.json', semantics)
    write('timeline.json', dict(localPlayerSignals=signals, damagePer30Seconds=[dict(offsetSec=k*30, damageByEntity=dict(v)) for k,v in sorted(bins.items())]))
    write('reference.json', summary)
    display_date = datetime.fromisoformat(manifest['startedAtUtc']).strftime('%d/%m/%Y')
    lines = [f'# Referência de pacotes do TL — {display_date}', '',
        f'- Coleta solicitada: {summary["requestedDurationSec"]} s; duração registrada: {summary["elapsedSec"]:.2f} s.',
        f'- {packet_count:,} pacotes; {summary["decodedMessages"]:,} mensagens decodificadas; {len(opcodes)} opcodes; {len(fields)} caminhos de campos.',
        f'- {len(entities)} entidades, {len(skills)} habilidades e {len(edges)} relações atacante/alvo/habilidade.',
        f'- {summary["damageEvents"]:,} candidatos de dano; {len(errors)} falhas de enquadramento/decoder.', '',
        '## Identificação e sessões', '',
        'Não foi identificado um ID nativo de sessão de combate. O sinal 0x1234444a/campo 1 identifica a entidade local nas referências validadas; a flag 2 não define limites de combate.',
        f'Nome informado pelo usuário: {player_name or "não informado"}. Nomes vindos do protocolo só aparecem quando um perfil válido foi recebido.',
        'IDs de entidade são temporários e pertencem à conexão. A referência não deve fixar um ID de personagem entre instâncias ou reconexões.', '',
        '## Entidades com mais dano', '', '| Chave na coleta | Papéis observados | Dano causado | Acertos | Habilidades |', '|---|---|---:|---:|---:|']
    for row in entity_rows[:15]:
        lines.append(f'| {row["key"]} | {", ".join(row["roles"])} | {row["outgoingDamage"]:,} | {row["outgoingHits"]} | {len(row["skills"])} |')
    lines += ['', '## Habilidades com mais dano', '', '| ID | Nome da referência | Dano | Eventos |', '|---|---|---:|---:|']
    for row in skill_rows[:20]:
        lines.append(f'| {row["skillId"]} | {row["referenceName"] or "não mapeado"} | {row["damage"]:,} | {row["events"]} |')
    lines += ['', '## Como reutilizar', '',
        '1. Abra `reference.json` para os limites de validade e o índice dos arquivos.',
        '2. Consulte `protocol-fields.json` por opcode/caminho; coincidências numéricas continuam sendo hipóteses.',
        '3. Cruze entidades, habilidades e relações usando a chave `tcp-NNN:entityId`.',
        '4. Use `timeline.json` para encontrar transições e intervalos de interesse; confira a evidência nos PCAPs originais.',
        '5. Antes de promover uma hipótese a regra do decoder, compare outra captura e, quando possível, um log de combate independente.', '',
        'Sem log atual, os totais desta coleta são candidatos extraídos do protocolo, não comprovação independente do dano total do jogo.']
    (folder/'summary.md').write_text('\n'.join(lines)+'\n', encoding='utf-8')
    print(json.dumps({key:summary[key] for key in ('packets','decodedMessages','opcodes','entities','skills','relations','damageEvents','localPlayerEntities','localPlayerSignals')}, ensure_ascii=False))

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--folder', type=Path, required=True)
    parser.add_argument('--player-name')
    args = parser.parse_args()
    build(args.folder.resolve(), args.player_name)
