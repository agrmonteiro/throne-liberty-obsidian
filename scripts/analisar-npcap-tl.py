"""Análise offline experimental do fluxo local observado; não acessa o jogo."""
import argparse
import bisect
from collections import Counter, defaultdict
import csv
from datetime import datetime, timedelta, timezone
import json
from pathlib import Path
import struct


def packets(path):
    raw = path.read_bytes()
    assert raw[:4] == b'\xd4\xc3\xb2\xa1', 'PCAP esperado: microssegundos little endian.'
    link = struct.unpack_from('<I', raw, 20)[0]
    assert link in (0, 1), 'Linktype não implementado.'
    offset = 24
    while offset < len(raw):
        sec, usec, size, wire = struct.unpack_from('<IIII', raw, offset)
        packet = raw[offset+16:offset+16+size]
        assert len(packet) == size
        offset += 16+size
        if link == 1:
            if len(packet) < 14 or packet[12:14] != b'\x08\x00':
                continue
            ip = packet[14:]
        else:
            ip = packet[4:]
        if len(ip) < 20 or ip[0] >> 4 != 4 or ip[9] != 6:
            continue
        if struct.unpack_from('!H', ip, 6)[0] & 0x3fff:
            continue
        tcp = ip[(ip[0] & 15)*4:struct.unpack_from('!H', ip, 2)[0]]
        if len(tcp) < 20:
            continue
        source, dest, sequence = struct.unpack_from('!HHI', tcp)
        payload = tcp[(tcp[12] >> 4)*4:]
        if payload:
            yield dict(time=sec+usec/1e6, source=source, dest=dest, sequence=sequence, payload=payload)


def varint(data, offset):
    value = shift = 0
    while offset < len(data) and shift < 70:
        byte = data[offset]
        offset += 1
        value |= (byte & 127) << shift
        if byte < 128:
            return value, offset
        shift += 7
    raise ValueError('Varint inválido')


def protobuf(data):
    result = defaultdict(list)
    offset = 0
    while offset < len(data):
        tag, offset = varint(data, offset)
        field, wire = tag >> 3, tag & 7
        if not field:
            raise ValueError('Campo zero')
        if wire == 0:
            value, offset = varint(data, offset)
        elif wire == 2:
            length, offset = varint(data, offset)
            value = data[offset:offset+length]
            if len(value) != length:
                raise ValueError('Campo truncado')
            offset += length
        elif wire in (1, 5):
            length = 8 if wire == 1 else 4
            value = data[offset:offset+length]
            if len(value) != length:
                raise ValueError('Campo fixo truncado')
            offset += length
        else:
            raise ValueError('Wire type não implementado')
        result[field].append(value)
    return result


def lz4(data):
    output, offset = bytearray(), 0
    while offset < len(data):
        token = data[offset]
        offset += 1
        literal = token >> 4
        if literal == 15:
            while True:
                value = data[offset]
                offset += 1
                literal += value
                if value != 255:
                    break
        if offset+literal > len(data):
            raise ValueError('Literal truncado')
        output.extend(data[offset:offset+literal])
        offset += literal
        if offset == len(data):
            break
        distance = struct.unpack_from('<H', data, offset)[0]
        offset += 2
        length = token & 15
        if length == 15:
            while True:
                value = data[offset]
                offset += 1
                length += value
                if value != 255:
                    break
        length += 4
        if not distance or distance > len(output) or len(output)+length > 1048576:
            raise ValueError('Referência LZ4 inválida ou limite excedido')
        for _ in range(length):
            output.append(output[-distance])
    return bytes(output)


FRAME_LENGTH_KEYS = (0xb06c4908, 0xb06c484e)


def frame_key(data, offset=0):
    """Confirma uma cadeia completa: literais LZ4 podem conter cabeçalhos internos."""
    if offset + 8 > len(data):
        return None
    encoded, opcode = struct.unpack_from('<II', data, offset)
    if opcode >> 16 != 0x1234:
        return None
    for key in FRAME_LENGTH_KEYS:
        cursor, count = offset, 0
        while cursor + 8 <= len(data):
            encoded, opcode = struct.unpack_from('<II', data, cursor)
            length = encoded ^ key
            if not 8 <= length <= 1048576 or opcode >> 16 != 0x1234 or cursor + length > len(data):
                break
            cursor += length
            count += 1
        if cursor == len(data) and count >= 2:
            return key
    return None


def frames(data, counters, timestamp, depth=0, length_key=None):
    assert depth < 4
    length_key = length_key if length_key is not None else (frame_key(data) or FRAME_LENGTH_KEYS[0])
    offset = 0
    while offset < len(data):
        assert offset+8 <= len(data)
        length = struct.unpack_from('<I', data, offset)[0] ^ length_key
        opcode = struct.unpack_from('<I', data, offset+4)[0]
        assert 8 <= length <= len(data)-offset
        body = data[offset+8:offset+length]
        at = timestamp(offset+length-1)
        counters['frames'] += 1
        if opcode == 0x12343987:
            counters['compressedFrames'] += 1
            yield from frames(lz4(body), counters, lambda _: at, depth+1, length_key)
        else:
            yield at, opcode, body
        offset += length


def buff_state(opcode, body):
    """Aplicação/update/remoção observados; tempos e stacks permanecem candidatos."""
    action = {0x12344a7b: 'apply', 0x12344a7c: 'remove', 0x12344a7d: 'update'}.get(opcode)
    if not action:
        return None
    try:
        fields = protobuf(body)
        def scalar(key, required=True):
            values = fields.get(key, [])
            if not values and not required:
                return None
            if len(values) != 1 or not isinstance(values[0], int):
                raise ValueError('Campo ausente ou ambíguo')
            return values[0]
        shift = 3 if action == 'update' else 0
        effect = zigzag(scalar(1 + shift))
        source, target, cast = scalar(2 + shift), scalar(4 + shift), scalar(3 + shift)
        if not all(0 < value < 2**53 for value in (effect, source, target)):
            return None
        event = dict(action=action, effectId=effect, sourceId=source, targetId=target, castTokenRaw=str(cast),
                     opcode=hex(opcode), rawFieldNumbers=sorted(fields))
        if action == 'remove':
            serial = scalar(5, False)
            event['serialRaw'] = str(serial) if serial is not None else None
        else:
            duration, remaining, stacks = map(zigzag, (scalar(5 + shift), scalar(6 + shift), scalar(7 + shift)))
            if not -1 <= duration < 2**53 or not -1 <= remaining < 2**53 or not 0 <= stacks < 2**53:
                return None
            event.update(durationMsCandidate=duration, remainingMsCandidate=remaining, stackCountCandidate=stacks)
            skill = scalar(16 if action == 'update' else 12, False)
            event['skillIdCandidate'] = zigzag(skill) if skill is not None else None
            if action == 'apply':
                serial = scalar(10, False)
                event['serialRaw'] = str(serial) if serial is not None else None
            else:
                event.update(previousSerialRaw=str(scalar(13)), serialRaw=str(scalar(14)))
        return event
    except (ValueError, TypeError, IndexError, KeyError):
        return None


def zigzag(value):
    return (value >> 1) ^ -(value & 1)


def player_identity(body):
    """Perfil observado: campo 19 = jogador; campo 20 = alvo selecionado."""
    try:
        profile = protobuf(protobuf(protobuf(body)[1][0])[1][0])
        name = profile[2][0].decode('utf-8')
        source = profile[19][0]
        if profile[26][0] != b'tribe.Pc' or not isinstance(source, int) or not 0 < source <= 2**53-1:
            return None
        if not 1 <= len(name) <= 64 or not name.isprintable() or name != name.strip():
            return None
        return dict(sourceId=source, name=name)
    except (ValueError, TypeError, KeyError, IndexError, AttributeError):
        return None


def local_player_entity(body):
    """0x1234444a: entidade local validada contra os logs de duas capturas.

    A flag 2 alterna durante ataques; não é tratada como início/fim de combate.
    """
    try:
        fields = protobuf(body)
        source = fields[1][0]
        flag = fields.get(2, [0])
        if (set(fields) - {1, 2} or len(fields[1]) != 1 or len(flag) != 1
                or not isinstance(source, int) or not 0 < source <= 2**53 - 1
                or flag[0] not in (0, 1)):
            return None
        return source
    except (ValueError, KeyError, IndexError, TypeError):
        return None


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--folder', type=Path, required=True)
    parser.add_argument('--log', type=Path, help='Opcional: sem log, os valores extraídos ficam sem confirmação.')
    parser.add_argument('--reference-analysis', type=Path, help='Análise anterior para rótulos de habilidades; não valida esta captura.')
    args = parser.parse_args()
    manifest = json.loads((args.folder/'manifest.json').read_text(encoding='utf-8'))
    loop_name = next(Path(item['file']) for item in manifest['files'] if 'Loopback' in item['name'])
    groups = defaultdict(list)
    for packet in packets(loop_name):
        groups[(packet['source'],packet['dest'])].append(packet)
    counters = Counter()
    candidates, stream_info, message_index, identities = [], [], [], []
    for direction, group in groups.items():
        stream, boundaries, timestamps = bytearray(), [], []
        end = None
        for packet in sorted(group, key=lambda item:item['sequence']):
            seq, payload = packet['sequence'],packet['payload']
            if end is not None and seq > end:
                raise ValueError('Lacuna TCP: análise não pode concatenar bytes ausentes.')
            cut = 0 if end is None else max(0,end-seq)
            if cut >= len(payload):
                continue
            stream.extend(payload[cut:])
            end = seq+len(payload)
            boundaries.append(len(stream))
            timestamps.append(packet['time'])
        local = Counter()
        opcode_counts = Counter()
        for timestamp,opcode,body in frames(bytes(stream),local,lambda i:timestamps[bisect.bisect_right(boundaries,i)]):
            opcode_counts[hex(opcode)] += 1
            if opcode == 0x1234787f:
                identity = player_identity(body)
                if identity:
                    identities.append(dict(time=timestamp, **identity))
            try:
                fields = protobuf(body)
                message_index.append(dict(time=timestamp, opcode=hex(opcode), direction=list(direction),
                                          numericFields={str(k):[v for v in values if isinstance(v,int)]
                                                         for k,values in fields.items() if any(isinstance(v,int) for v in values)},
                                          byteFieldLengths={str(k):[len(v) for v in values if isinstance(v,bytes)]
                                                            for k,values in fields.items() if any(isinstance(v,bytes) for v in values)}))
            except ValueError:
                if opcode in (0x12344a7f,0x12344a62):
                    raise
            if opcode not in (0x12344a7f,0x12344a62):
                continue
            fields = protobuf(body)
            if opcode == 0x12344a62:
                if not all(k in fields for k in [2,3,4,7]):
                    continue
                candidates.append(dict(time=timestamp, skillId=zigzag(fields[7][0]),
                                       damage=zigzag(fields[3][0]), flags=None,
                                       criticalCandidate=False, heavyCandidate=0,
                                       sourceId=fields[4][0], targetId=fields[2][0], opcode=hex(opcode),
                                       flagBasis='Normal/sem pesado nos 192 eventos de referência; flags não identificadas nesta mensagem.'))
                continue
            if 5 not in fields or 15 not in fields:
                continue
            damage = protobuf(fields[5][0])
            if 1 not in damage:
                continue
            candidates.append(dict(time=timestamp, skillId=zigzag(fields[15][0]),
                                   damage=zigzag(damage[1][0]), flags=fields.get(6,[None])[0],
                                   criticalCandidate=fields.get(6,[None])[0] == 6, opcode=hex(opcode),
                                   heavyCandidate=fields.get(19,[0])[0],
                                   sourceId=fields.get(3,[None])[0], targetId=fields.get(2,[None])[0]))
        counters.update(local)
        stream_info.append(dict(direction=list(direction), bytes=len(stream), **dict(local), opcodeCounts=dict(opcode_counts)))
    events = []
    log_rows = []
    if args.log:
        with args.log.open(encoding='utf-8-sig') as file:
            log_rows = list(csv.reader(file))
    for row in log_rows:
        if len(row) >= 10 and row[1] == 'DamageDone' and row[8] == 'AgrMonteiro':
            # Log desta instalação está em horário local UTC-3.
            timestamp = datetime.strptime(row[0],'%Y%m%d-%H:%M:%S:%f').replace(tzinfo=timezone(timedelta(hours=-3))).timestamp()
            events.append(dict(time=timestamp, skill=row[2], skillId=int(row[3]), damage=int(row[4]), crit=int(row[5]), heavy=int(row[6])))
    used, matched, missing, flags = set(), [], [], Counter()
    for event in events:
        choices = [(abs(c['time']-event['time']),index,c) for index,c in enumerate(candidates)
                   if index not in used and c['damage'] == event['damage'] and c['skillId'] == event['skillId']
                   and abs(c['time']-event['time']) <= .5]
        if not choices:
            missing.append(event)
            continue
        distance,index,candidate = min(choices, key=lambda item:item[0])
        used.add(index)
        flags[(candidate['flags'],event['crit'],event['heavy'])] += 1
        matched.append(dict(**event, packetTime=candidate['time'], delaySec=event['time']-candidate['time'],
                            flags=candidate['flags'],heavyCandidate=candidate['heavyCandidate'],
                            criticalCandidate=candidate['criticalCandidate'],opcode=candidate['opcode'],
                            sourceId=candidate['sourceId'],targetId=candidate['targetId']))
    names = {e['skillId']:e['skill'] for e in events}
    if args.reference_analysis:
        reference = json.loads(args.reference_analysis.read_text(encoding='utf-8'))
        names = {e['skillId']:e['skill'] for e in reference.get('matched',[])}
    aggregate = {}
    for candidate in candidates:
        key = str(candidate['skillId'])
        item = aggregate.setdefault(key, dict(skillId=candidate['skillId'], referenceName=names.get(candidate['skillId']),
                                              events=0, damageSum=0))
        item['events'] += 1
        item['damageSum'] += candidate['damage']
    summary = dict(damageSchemaVersion=2, identities=identities, status='experimental_uma_captura' if args.log else 'extraido_sem_log_nao_validado',
                   sourceFolder=str(args.folder), log=str(args.log) if args.log else None,
                   streams=stream_info, frameCounters=dict(counters), packetDamageCandidates=len(candidates),
                   logDamageEvents=len(events), matchedDamageEvents=len(matched), unmatchedLogEvents=len(missing),
                   matchedDamage=sum(e['damage'] for e in matched), logDamage=sum(e['damage'] for e in events),
                   criticalFieldAgreement=sum(e['criticalCandidate']==bool(e['crit']) for e in matched),
                   heavyFieldAgreement=sum(bool(e['heavyCandidate'])==bool(e['heavy']) for e in matched),
                   flagsCompared=[dict(flags=f,crit=c,heavy=h,count=n) for (f,c,h),n in flags.items()],
                   matched=matched, unmatched=missing,
                   damageCandidates=candidates, candidateDamageSum=sum(e['damage'] for e in candidates),
                   candidateBySkill=list(aggregate.values()),
                   limitations=['Uma captura, validação independente ainda pendente.',
                                'Mapeamento experimental de campos e framing; não é API oficial.',
                                'Tipo secundário: crítico/pesado ausentes são inferidos normais a partir da referência, não flags descobertas.',
                                'Buffs e recusa de input ainda não decodificados.',
                                'Campos de tempo do log assumidos UTC-3; janela de correspondência 0,5 s.'])
    if not args.log:
        for key in ['logDamageEvents','matchedDamageEvents','unmatchedLogEvents','matchedDamage','logDamage',
                    'criticalFieldAgreement','heavyFieldAgreement']:
            summary[key] = None
        summary['limitations'].append('Sem log: soma dos candidatos não comprova dano total, identidade do jogador, DPS ou cobertura.')
    (args.folder/'messages-index.json').write_text(json.dumps(message_index,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    (args.folder/'analise-offline.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps({k:v for k,v in summary.items() if k not in ['matched','unmatched','streams','damageCandidates']},ensure_ascii=True,indent=2))


if __name__ == '__main__':
    main()
