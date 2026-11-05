"""Fluxo de dano somente leitura para o overlay; não envia pacotes."""
import argparse
from collections import Counter, deque
import ctypes as C
import importlib.util
import json
from pathlib import Path
import struct
import time
from threading import Event, Thread
from uuid import uuid4

HERE = Path(__file__).resolve().parent


def module(name, file):
    spec = importlib.util.spec_from_file_location(name, HERE/file)
    result = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(result)
    return result


decoder = module('tl_decoder', 'analisar-npcap-tl.py')
capture = module('tl_capture', 'teste-npcap-tl.py')
HEALING_EFFECTS = {'963250776': {'group': 'Continuous_Heal'}, '939538607': {'group': 'Instant_Heal'}}
HEALING_SKILLS = {963905802, 963351634, 939721573}


def load_healing_reference(file):
    global HEALING_EFFECTS, HEALING_SKILLS
    data = json.loads(Path(file).read_text(encoding='utf-8'))
    if data.get('schemaVersion') != 1 or not isinstance(data.get('effects'), dict) or not isinstance(data.get('skillIds'), list):
        raise ValueError('Referência de cura inválida.')
    if not all(isinstance(row, dict) and row.get('group') in ('Continuous_Heal', 'Intervallic_Heal', 'Instant_Heal') for row in data['effects'].values()):
        raise ValueError('Classificação de efeitos de cura inválida.')
    HEALING_EFFECTS = data['effects']
    HEALING_SKILLS = {uid for uid in data['skillIds'] if isinstance(uid, int) and 0 < abs(uid) < 2**53}


_local_healing_reference = HERE.parent/'src/data/overlayHealingEffects.json'
if _local_healing_reference.is_file():
    load_healing_reference(_local_healing_reference)


def emit(value):
    print(json.dumps(value, ensure_ascii=True), flush=True)


def player_identity(body, opcode=0x1234787f):
    return decoder.player_identity(body, opcode)


def packet_details(opcode, body, server_to_client):
    """Dados brutos locais; inteiros grandes permanecem strings no JSON."""
    def fields(data, depth=0):
        try:
            parsed = decoder.protobuf(data)
        except (ValueError, TypeError, IndexError):
            return {}
        result = {}
        for key, values in list(parsed.items())[:128]:
            items = []
            for value in values[:32]:
                if isinstance(value, int):
                    items.append(value if abs(value) <= 2**53-1 else str(value))
                else:
                    item = dict(hex=value[:256].hex(), bytes=len(value), hexTruncated=len(value)>256)
                    if depth < 3 and 0 < len(value) <= 4096:
                        nested = fields(value, depth+1)
                        if nested: item['fields'] = nested
                    items.append(item)
            result[str(key)] = items
        return result
    return dict(opcode=hex(opcode), bytes=len(body), bodyHex=body[:16384].hex(), truncated=len(body)>16384,
                direction='server-to-client' if server_to_client else 'client-to-server', fields=fields(body[:16384]))


def entity_state(body):
    """Delta da entidade. Estado 2 + campo 5 vazio é um candidato de morte, ainda experimental."""
    try:
        f = decoder.protobuf(body)
        if len(f.get(1, [])) != 1 or not isinstance(f[1][0], int) or not 0 < f[1][0] < 2**53:
            return None
        if len(f.get(2, [])) != 1 or not isinstance(f[2][0], bytes):
            return None
        delta = decoder.protobuf(f[2][0])
        state = None
        if len(delta.get(4, [])) == 1 and isinstance(delta[4][0], bytes):
            code = decoder.protobuf(delta[4][0]).get(1, [])
            if len(code) == 1 and isinstance(code[0], int): state = code[0]
        return dict(targetId=f[1][0], stateCode=state,
                    deathCandidate=state == 2 and delta.get(5) == [b''])
    except (ValueError, TypeError, IndexError, KeyError):
        return None


def damage_life_signal(fields):
    """Flag 7=1: acerto fatal observado em NPCs e na morte informada de 31/10.

    O campo 9 positivo só rearma após um novo acerto contra o personagem;
    não expõe HP como métrica validada nem estima cura efetiva.
    """
    alive = False
    values = fields.get(9, [])
    if len(values) == 1 and isinstance(values[0], bytes) and values[0]:
        try:
            nested = decoder.protobuf(values[0]).get(1, [])
            alive = len(nested) == 1 and isinstance(nested[0], int) and 0 < decoder.zigzag(nested[0]) < 2**53
        except (ValueError, TypeError, IndexError):
            pass
    dead = fields.get(7) == [1]
    return dict(deathCandidate=dead, aliveCandidate=alive and not dead)


def npc_identity(body):
    """Spawn 0x12346f68: entidade em 3; UID de template duplicado em 4/32 (zigzag)."""
    try:
        fields = decoder.protobuf(body)
        if any(key not in fields or len(fields[key]) != 1 or not isinstance(fields[key][0], int) for key in (3, 4, 32)):
            return None
        source, uid = fields[3][0], decoder.zigzag(fields[4][0])
        if not 0 < source < 2**53 or not 0 < uid < 2**53 or decoder.zigzag(fields[32][0]) != uid:
            return None
        return dict(sourceId=source, npcId=uid)
    except (ValueError, TypeError, IndexError, KeyError):
        return None


def periodic_healing(body):
    """Cura periódica bruta; origem e alvo são preservados separadamente."""
    fields = decoder.protobuf(body)
    if any(key not in fields or len(fields[key]) != 1 or not isinstance(fields[key][0], int) for key in (1, 2, 3, 4, 5)):
        return None
    effect = decoder.zigzag(fields[1][0])
    skill = decoder.zigzag(fields[5][0])
    amount = decoder.zigzag(fields[3][0])
    if HEALING_EFFECTS.get(str(effect), {}).get('group') not in ('Continuous_Heal', 'Intervallic_Heal') or skill not in HEALING_SKILLS or amount <= 0:
        return None
    source, target = fields[4][0], fields[2][0]
    if not 0 < source < 2**53 or not 0 < target < 2**53:
        return None
    return dict(healing=amount, effectId=effect, skillId=skill, sourceId=source, targetId=target,
                coverage='self-periodic' if source == target else 'external-periodic')


def effect_observation(body, opcode):
    """Conserva efeitos sem classificação, sem somá-los como cura ou dano."""
    f = decoder.protobuf(body)
    source_key, amount_key, skill_key = (4, 3, 5) if opcode == 0x12344a63 else (3, 5, 10)
    keys = (1, 2, source_key, amount_key, skill_key)
    if any(len(f.get(k, [])) != 1 or not isinstance(f[k][0], int) for k in keys):
        return None
    if not 0 < f[source_key][0] < 2**53 or not 0 < f[2][0] < 2**53:
        return None
    return dict(sourceId=f[source_key][0], targetId=f[2][0], effectId=decoder.zigzag(f[1][0]),
                skillId=decoder.zigzag(f[skill_key][0]), observedAmount=decoder.zigzag(f[amount_key][0]))


def vampiric_healing(body):
    """Cura instantânea, incluindo vampirismo: valor observado, sem estimar dano."""
    fields = decoder.protobuf(body)
    if any(key not in fields or len(fields[key]) != 1 or not isinstance(fields[key][0], int) for key in (1, 2, 3, 5, 10)):
        return None
    effect = decoder.zigzag(fields[1][0])
    skill = decoder.zigzag(fields[10][0])
    amount = decoder.zigzag(fields[5][0])
    if HEALING_EFFECTS.get(str(effect), {}).get('group') != 'Instant_Heal' or skill not in HEALING_SKILLS or amount <= 0:
        return None
    source, target = fields[3][0], fields[2][0]
    if not 0 < source < 2**53 or not 0 < target < 2**53 or (effect == 939538607 and source != target):
        return None
    return dict(healing=amount, effectId=effect, skillId=skill, sourceId=source, targetId=target,
                coverage='external-instant' if source != target else 'self-lifesteal' if effect == 939538607 else 'self-instant')


class Stream:
    def __init__(self, connection_id=None, server_to_client=False):
        self.connection_id = connection_id
        self.server_to_client = server_to_client
        self.expected = None
        self.pending = {}
        self.buffer = bytearray()
        self.aligned = False
        self.length_key = None
        self.gap_since = None

    def feed(self, sequence, payload, now):
        # TCP usa sequência de 32 bits; manter continuidade após o contador dar a volta.
        if self.expected is not None:
            sequence = self.expected + ((sequence - self.expected + 2**31) % 2**32) - 2**31
        self.expected = sequence if self.expected is None else self.expected
        if sequence+len(payload) <= self.expected:
            return
        self.pending[sequence] = payload
        for seq in sorted(list(self.pending)):
            if seq > self.expected:
                break
            chunk = self.pending.pop(seq)
            self.buffer.extend(chunk[max(0,self.expected-seq):])
            self.expected = max(self.expected, seq+len(chunk))
        if self.pending:
            if self.gap_since is None:
                self.gap_since = now
            if now-self.gap_since > 2:
                raise ValueError('Lacuna na captura TCP. Reinicie a leitura para evitar dados incompletos.')
        else:
            self.gap_since = None
        if len(self.buffer) > 2*1024*1024:
            raise ValueError('Buffer do protocolo excedeu o limite.')
        if not self.aligned:
            # A captura pode começar no meio de uma mensagem.
            for offset in range(max(0,len(self.buffer)-7)):
                key = decoder.frame_key(self.buffer, offset)
                if key is not None:
                    del self.buffer[:offset]
                    self.aligned = True
                    self.length_key = key
                    break
            if not self.aligned:
                if len(self.buffer) > 1048584:
                    raise ValueError('Protocolo local não reconhecido nesta conexão.')
                return
        while len(self.buffer) >= 8:
            encoded, opcode = struct.unpack_from('<II', self.buffer)
            length = encoded ^ self.length_key
            if not 8 <= length <= 1048576 or opcode >> 16 != 0x1234:
                raise ValueError('Mudança de formato no fluxo local. Captura interrompida.')
            if len(self.buffer) < length:
                break
            frame = bytes(self.buffer[:length]); del self.buffer[:length]
            for stamp,opcode,body in decoder.frames(frame,Counter(),lambda _:now, length_key=self.length_key):
                if opcode in (0x12346e77, 0x12347e7d, 0x12347e7f, 0x123444dd, 0x12344437) and self.server_to_client:
                    stats = decoder.character_stats(opcode, body)
                    if stats:
                        emit(dict(type='character-stats', time=stamp, connectionId=self.connection_id, **stats,
                                  raw=packet_details(opcode, body, self.server_to_client)))
                if opcode in (0x12344a7b, 0x12344a7c, 0x12344a7d) and self.server_to_client:
                    buff = decoder.buff_state(opcode, body)
                    if buff:
                        emit(dict(type='buff', event=dict(time=stamp, connectionId=self.connection_id, **buff),
                                  raw=packet_details(opcode, body, self.server_to_client)))
                    continue
                if opcode == 0x12346f6d and self.server_to_client:
                    state = entity_state(body)
                    if state:
                        emit(dict(type='entity-state', time=stamp, connectionId=self.connection_id, **state,
                                  raw=packet_details(opcode, body, self.server_to_client)))
                    continue
                if opcode in (0x12346f18, 0x12346f69, 0x12346f6b) and self.server_to_client:
                    f = decoder.protobuf(body)
                    entity = f.get(1, [])
                    if len(entity) == 1 and isinstance(entity[0], int) and 0 < entity[0] < 2**53:
                        emit(dict(type='entity-state', time=stamp, connectionId=self.connection_id, targetId=entity[0],
                                  raw=packet_details(opcode, body, self.server_to_client)))
                    continue
                if opcode == 0x12346f68 and self.server_to_client:
                    npc = npc_identity(body)
                    if npc:
                        emit(dict(type='npc', time=stamp, connectionId=self.connection_id, **npc))
                    continue
                if opcode == 0x1234444a and self.server_to_client:
                    source = decoder.local_player_entity(body)
                    if source is not None:
                        emit(dict(type='local-player', sourceId=source, time=stamp, connectionId=self.connection_id,
                                  raw=packet_details(opcode, body, self.server_to_client)))
                    continue
                if opcode in (0x1234787f, 0x1234787d) and self.server_to_client:
                    identity = player_identity(body, opcode)
                    if identity:
                        emit(dict(type='identity', time=stamp, connectionId=self.connection_id, **identity))
                    continue
                if opcode == 0x12344a63 and self.server_to_client:
                    healing = periodic_healing(body)
                    if healing:
                        emit(dict(type='healing', event=dict(time=stamp, **healing), connectionId=self.connection_id,
                                  raw=packet_details(opcode, body, self.server_to_client)))
                    else:
                        observation = effect_observation(body, opcode)
                        if observation:
                            emit(dict(type='effect-observation', event=dict(time=stamp, **observation), connectionId=self.connection_id,
                                      raw=packet_details(opcode, body, self.server_to_client)))
                    continue
                if opcode == 0x12344a70 and self.server_to_client:
                    healing = vampiric_healing(body)
                    if healing:
                        emit(dict(type='healing', event=dict(time=stamp, **healing), connectionId=self.connection_id,
                                  raw=packet_details(opcode, body, self.server_to_client)))
                    else:
                        observation = effect_observation(body, opcode)
                        if observation:
                            emit(dict(type='effect-observation', event=dict(time=stamp, **observation), connectionId=self.connection_id,
                                      raw=packet_details(opcode, body, self.server_to_client)))
                    continue
                if opcode not in (0x12344a7f,0x12344a62):
                    continue
                fields = decoder.protobuf(body)
                if opcode == 0x12344a7f and all(k in fields for k in (2,3,5,15)):
                    amount = decoder.protobuf(fields[5][0])
                    if 1 not in amount:
                        continue
                    event = dict(time=stamp,damage=decoder.zigzag(amount[1][0]),
                                 skillId=decoder.zigzag(fields[15][0]), sourceId=fields[3][0], targetId=fields[2][0],
                                 criticalCandidate=fields.get(6,[None])[0] == 6,
                                 heavyCandidate=fields.get(19,[0])[0])
                elif opcode == 0x12344a62 and all(k in fields for k in (2,3,4,7)):
                    event = dict(time=stamp,damage=decoder.zigzag(fields[3][0]),
                                 skillId=decoder.zigzag(fields[7][0]),sourceId=fields[4][0],targetId=fields[2][0],
                                 criticalCandidate=False,heavyCandidate=0)
                else:
                    continue
                life = damage_life_signal(fields) if opcode == 0x12344a7f and self.server_to_client else {}
                emit(dict(type='damage' if event['damage'] > 0 else 'combat-observation',event=event, connectionId=self.connection_id, **life,
                          raw=packet_details(opcode, body, self.server_to_client)))


class PendingConnections:
    """Retém o início do túnel até o inventário confirmar que a porta cliente pertence ao TL."""
    def __init__(self, server_ports, limit=2*1024*1024):
        self.server_ports = set(server_ports)
        self.rows = {}
        self.size = 0
        self.limit = limit

    def offer(self, a, b, seq, payload, at):
        if not payload or (a not in self.server_ports and b not in self.server_ports): return
        pair = (b, a) if a in self.server_ports else (a, b)
        if pair not in self.rows and len(self.rows) >= 16 or self.size+len(payload) > self.limit:
            raise ValueError('Início de conexão excedeu o buffer de validação do TL.')
        self.rows.setdefault(pair, []).append((a,b,seq,payload,at))
        self.size += len(payload)

    def drain(self, pair):
        rows = self.rows.pop(pair, [])
        self.size -= sum(len(row[3]) for row in rows)
        return rows

    def expire(self, at):
        for pair, rows in list(self.rows.items()):
            if rows and at-rows[0][4] > 5: self.drain(pair)


def live(reference_server_ports=()):
    api,directory = capture.load_api()
    api.pcap_datalink.restype = C.c_int
    api.pcap_datalink.argtypes = [C.c_void_p]
    data = capture.endpoints()
    local = [e for e in data['tcp'] if e['RemoteAddress'] == '127.0.0.1']
    if not local and not reference_server_ports:
        raise ValueError('Conexão local do TL não encontrada. O caminho validado usa ExitLag.')
    if reference_server_ports and not all(isinstance(port, int) and 0 < port < 65536 for port in reference_server_ports):
        raise ValueError('Porta de referência inválida.')
    expression = ('tcp and host 127.0.0.1 and ('+' or '.join(f'port {port}' for port in reference_server_ports)+')') if reference_server_ports else capture.filter_expression(dict(tcp=local,udp=[]))
    device = next((d for d in capture.interfaces(api) if 'Loopback' in d['name']),None)
    if not device:
        raise ValueError('Npcap Loopback indisponível.')
    error = C.create_string_buffer(256)
    handle = api.pcap_open_live(device['name'].encode(),65535,0,100,error)
    if not handle:
        raise ValueError(error.value.decode(errors='replace'))
    try:
        program = capture.Program()
        if api.pcap_compile(handle,C.byref(program),expression.encode(),1,0xffffffff):
            raise ValueError(api.pcap_geterr(handle).decode(errors='replace'))
        try:
            if api.pcap_setfilter(handle,C.byref(program)):
                raise ValueError('Falha ao filtrar conexões do TL.')
        finally:
            api.pcap_freecode(C.byref(program))
        if api.pcap_setnonblock(handle,1,error):
            raise ValueError(error.value.decode(errors='replace'))
        link = api.pcap_datalink(handle)
        if link != 0:
            raise ValueError(f'Formato de interface não validado: {link}')
        streams = {}
        pending_connections = PendingConnections(reference_server_ports)
        connections = {(int(e['LocalPort']), int(e['RemotePort'])): uuid4().hex for e in local}
        game_pids = tuple(sorted(data['pids']))
        updates = deque(maxlen=1)
        stop_watch = Event()
        def watch_connections():
            while not stop_watch.wait(2):
                try:
                    snapshot = capture.endpoints()
                    updates.append((tuple(sorted(snapshot['pids'])), [e for e in snapshot['tcp'] if e['LocalAddress'] == e['RemoteAddress'] == '127.0.0.1']))
                except Exception:
                    # O encerramento real também é detectado por FIN/RST; repetir o inventário.
                    continue
        Thread(target=watch_connections, daemon=True).start()
        def retire(pair):
            connection = connections.pop(pair, None)
            streams.pop(pair, None); streams.pop(pair[::-1], None)
            if connection:
                emit(dict(type='connection-closed', connectionId=connection, time=time.time()))
        def consume(a, b, seq, payload, at):
            server_to_client = (b,a) in connections
            pair = (b,a) if server_to_client else (a,b)
            connection = connections.get(pair)
            if connection and payload:
                streams.setdefault((a,b),Stream(connection, server_to_client)).feed(seq,payload,at)
        emit(dict(type='status',state='live',message='Leitura experimental ativa.'))
        while True:
            if updates:
                refreshed_pids, refreshed = updates.pop()
                refreshed_ports = tuple(sorted({int(e['RemotePort']) for e in refreshed}))
                changed_process = refreshed_pids != game_pids
                changed_tunnel = bool(reference_server_ports and refreshed_ports and refreshed_ports != tuple(reference_server_ports))
                if changed_process or changed_tunnel:
                    for pair in list(connections): retire(pair)
                    streams.clear()
                    game_pids = refreshed_pids
                    if reference_server_ports and refreshed_ports: reference_server_ports = refreshed_ports
                    # Outro PID com a mesma porta pode já ter enviado o início
                    # do fluxo. Só drenar após validar o novo par no inventário.
                    if changed_tunnel:
                        pending_connections = PendingConnections(reference_server_ports)
                pairs = {(int(e['LocalPort']), int(e['RemotePort'])) for e in refreshed}
                if pairs != set(connections) or changed_process or changed_tunnel:
                    for pair in list(connections):
                        if pair not in pairs:
                            retire(pair)
                    if not refreshed and not reference_server_ports:
                        raise ValueError('Conexão local do TL não encontrada. Aguardando reconexão.')
                    if not reference_server_ports or changed_tunnel:
                        expression = ('tcp and host 127.0.0.1 and ('+' or '.join(f'port {port}' for port in reference_server_ports)+')') if reference_server_ports else capture.filter_expression(dict(tcp=refreshed, udp=[]))
                        program = capture.Program()
                        if api.pcap_compile(handle, C.byref(program), expression.encode(), 1, 0xffffffff):
                            raise ValueError(api.pcap_geterr(handle).decode(errors='replace'))
                        try:
                            if api.pcap_setfilter(handle, C.byref(program)):
                                raise ValueError('Falha ao atualizar conexões do TL.')
                        finally:
                            api.pcap_freecode(C.byref(program))
                    for pair in pairs:
                        connections.setdefault(pair, uuid4().hex)
                        for buffered in pending_connections.drain(pair): consume(*buffered)
            header,pointer = C.c_void_p(),C.c_void_p()
            result = api.pcap_next_ex(handle,C.byref(header),C.byref(pointer))
            if result == 0:
                time.sleep(.01)
                continue
            if result != 1:
                raise ValueError(api.pcap_geterr(handle).decode(errors='replace'))
            # pcap_pkthdr Windows: timeval com dois longs de 32 bits, seguido de caplen.
            seconds, micros, size, _wire = struct.unpack('<IIII',C.string_at(header,16))
            if not 4 <= size <= 65535:
                raise ValueError('Cabeçalho Npcap incompatível.')
            raw = C.string_at(pointer,size)[4:]
            if len(raw) < 20 or raw[0] >> 4 != 4 or raw[9] != 6:
                continue
            if struct.unpack_from('!H',raw,6)[0] & 0x3fff:
                raise ValueError('Fragmentação IP não implementada na leitura ao vivo.')
            tcp = raw[(raw[0]&15)*4:struct.unpack_from('!H',raw,2)[0]]
            if len(tcp) < 20:
                continue
            a,b,seq = struct.unpack_from('!HHI',tcp)
            if reference_server_ports and raw[12:20] != b'\x7f\x00\x00\x01'*2:
                continue
            server_to_client = (b, a) in connections
            pair = (b, a) if server_to_client else (a, b)
            if reference_server_ports and tcp[13] & 2 and not tcp[13] & 16:
                candidate_pair = (b,a) if a in reference_server_ports else (a,b)
                pending_connections.drain(candidate_pair)
                if candidate_pair in connections: retire(candidate_pair)
                pair = candidate_pair
            connection = connections.get(pair)
            if not connection:
                if reference_server_ports:
                    pending_connections.expire(seconds+micros/1e6)
                    if tcp[13] & 5:
                        pending_connections.drain((b,a) if a in reference_server_ports else (a,b))
                    else:
                        pending_connections.offer(a,b,seq,tcp[(tcp[12]>>4)*4:],seconds+micros/1e6)
                continue
            payload = tcp[(tcp[12]>>4)*4:]
            consume(a,b,seq,payload,seconds+micros/1e6)
            if tcp[13] & 5:
                retire(pair)
    finally:
        if 'stop_watch' in locals():
            stop_watch.set()
        api.pcap_close(handle)
        directory.close()


def replay(path, speed):
    data = json.loads(Path(path).read_text(encoding='utf-8'))
    events = sorted(data.get('damageCandidates',[]),key=lambda e:e['time'])
    # Análises v1 tinham atacante/alvo invertidos; não reproduzir atribuição errada.
    if data.get('damageSchemaVersion', 1) < 2:
        if any('targetId' not in event for event in events):
            raise ValueError('Captura antiga sem ID do atacante. Reanalise o PCAP antes de reproduzir.')
        events = [dict(event, sourceId=event['targetId'], targetId=event['sourceId']) for event in events]
    if not events:
        raise ValueError('Arquivo sem damageCandidates para reproduzir.')
    emit(dict(type='status',state='replay',message='Reprodução de captura; não é dano ao vivo.'))
    emit(dict(type='sources',ids=sorted(set(e['sourceId'] for e in events)),time=events[0]['time']))
    for identity in data.get('identities', []):
        emit(dict(type='identity', sourceId=identity.get('sourceId'), name=identity.get('name')))
    time.sleep(3)
    previous = events[0]['time']
    for event in events:
        time.sleep(max(0,event['time']-previous)/speed)
        previous = event['time']
        emit(dict(type='damage',event=event))
    emit(dict(type='status',state='stopped',message='Reprodução concluída.'))


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--replay')
    parser.add_argument('--speed',type=float,default=1)
    parser.add_argument('--healing-reference', type=Path)
    parser.add_argument('--follow-loopback-server', action='store_true')
    args = parser.parse_args()
    try:
        if args.healing_reference:
            load_healing_reference(args.healing_reference)
        if args.replay:
            if not .1 <= args.speed <= 1000:
                raise ValueError('Velocidade de reprodução inválida.')
            replay(args.replay,args.speed)
        else:
            ports = tuple(sorted({int(e['RemotePort']) for e in capture.endpoints()['tcp'] if e['LocalAddress'] == e['RemoteAddress'] == '127.0.0.1'})) if args.follow_loopback_server else ()
            if args.follow_loopback_server and not ports: raise ValueError('Conexão do TL necessária para identificar a porta do túnel.')
            live(ports)
    except KeyboardInterrupt:
        pass
    except Exception as error:
        emit(dict(type='status',state='error',message=str(error)))
        raise SystemExit(1)
