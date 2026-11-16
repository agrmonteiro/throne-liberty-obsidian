"""Analisa contexto de sessão TL a partir de PCAPs já capturados.

Não decifra TLS/túneis e não atribui significado a portas, IPs ou picos de
tráfego. O objetivo é localizar transições e candidatos para investigação do
protocolo, preservando a diferença entre metadado local e ID compartilhável.
"""
import argparse
from collections import Counter, defaultdict
from datetime import datetime, timezone
import hashlib
import json
from math import log1p
from pathlib import Path
from statistics import median
import struct


def pcap_packets(path):
    with path.open('rb') as file:
        header = file.read(24)
        if len(header) != 24 or header[:4] != b'\xd4\xc3\xb2\xa1':
            return
        link = struct.unpack_from('<I', header, 20)[0]
        while record := file.read(16):
            if len(record) != 16:
                break
            second, microsecond, captured, _wire = struct.unpack('<IIII', record)
            raw = file.read(captured)
            if len(raw) != captured:
                break
            if link == 1:
                if len(raw) < 14 or raw[12:14] != b'\x08\x00':
                    continue
                ip = raw[14:]
            elif link == 0:
                ip = raw[4:]
            else:
                continue
            if len(ip) < 20 or ip[0] >> 4 != 4:
                continue
            header_size = (ip[0] & 15) * 4
            total = struct.unpack_from('!H', ip, 2)[0]
            if header_size < 20 or total < header_size or len(ip) < total:
                continue
            protocol = ip[9]
            src = '.'.join(map(str, ip[12:16]))
            dst = '.'.join(map(str, ip[16:20]))
            segment = ip[header_size:total]
            stamp = second + microsecond / 1_000_000
            if protocol == 6 and len(segment) >= 20:
                source_port, dest_port = struct.unpack_from('!HH', segment)
                tcp_size = (segment[12] >> 4) * 4
                if tcp_size < 20 or tcp_size > len(segment):
                    continue
                yield dict(time=stamp, protocol='tcp', source=src, destination=dst,
                           sourcePort=source_port, destinationPort=dest_port,
                           payloadBytes=len(segment) - tcp_size, flags=segment[13])
            elif protocol == 17 and len(segment) >= 8:
                source_port, dest_port, udp_size = struct.unpack_from('!HHH', segment)
                if udp_size < 8:
                    continue
                yield dict(time=stamp, protocol='udp', source=src, destination=dst,
                           sourcePort=source_port, destinationPort=dest_port,
                           payloadBytes=max(0, min(len(segment), udp_size) - 8), flags=None)


def endpoint_signature(snapshot):
    items = []
    for row in snapshot.get('endpoints', {}).get('tcp', []):
        try:
            items.append(('tcp', int(row['LocalPort']), int(row['RemotePort'])))
        except (KeyError, TypeError, ValueError):
            continue
    for row in snapshot.get('endpoints', {}).get('udp', []):
        try:
            items.append(('udp', int(row['LocalPort']), 0))
        except (KeyError, TypeError, ValueError):
            continue
    return frozenset(items)


def topology_changes(folder):
    source = folder / 'endpoint-snapshots.jsonl'
    if not source.exists():
        return []
    rows = []
    previous = frozenset()
    for line in source.read_text(encoding='utf-8').splitlines():
        row = json.loads(line)
        current = endpoint_signature(row)
        if current != previous:
            rows.append(dict(elapsedSec=round(float(row.get('elapsedSec', 0)), 3),
                             added=sorted(':'.join(map(str, item)) for item in current - previous),
                             removed=sorted(':'.join(map(str, item)) for item in previous - current),
                             tcp=sum(1 for item in current if item[0] == 'tcp'),
                             udp=sum(1 for item in current if item[0] == 'udp')))
        previous = current
    return rows


def change_points(bins):
    """Picos de variação multiescala com MAD; resultado é candidato, não evento do jogo."""
    if len(bins) < 4:
        return []
    values = [log1p(row['bytes']) for row in bins]
    deltas = [abs(values[index] - values[index - 1]) for index in range(1, len(values))]
    baseline = median(deltas)
    deviation = median(abs(value - baseline) for value in deltas) or 0.01
    threshold = baseline + 6 * deviation
    candidates = []
    for index, value in enumerate(deltas, 1):
        if value >= threshold:
            candidates.append(dict(elapsedSec=bins[index]['elapsedSec'], bytes=bins[index]['bytes'],
                                   previousBytes=bins[index - 1]['bytes'], score=round((value - baseline) / deviation, 2)))
    # Um burst pode produzir vários segundos próximos: conservar o de maior score por janela de 5 s.
    merged = []
    for row in candidates:
        if merged and row['elapsedSec'] - merged[-1]['elapsedSec'] <= 5:
            if row['score'] > merged[-1]['score']:
                merged[-1] = row
        else:
            merged.append(row)
    return merged


def anonymized_flow(row):
    identity = f"{row['protocol']}:{row['source']}:{row['sourcePort']}:{row['destination']}:{row['destinationPort']}"
    return hashlib.sha256(identity.encode()).hexdigest()[:12]


def analyze(folder):
    manifest = json.loads((folder / 'manifest.json').read_text(encoding='utf-8'))
    packets = []
    for pcap in sorted(folder.glob('*.pcap')):
        packets.extend(pcap_packets(pcap) or [])
    packets.sort(key=lambda row: row['time'])
    if not packets:
        raise ValueError('Nenhum pacote IPv4 TCP/UDP elegível foi encontrado.')
    started = packets[0]['time']
    bin_map = defaultdict(lambda: Counter())
    flows = {}
    protocol = Counter()
    payload = Counter()
    for row in packets:
        second = int(row['time'] - started)
        bin_map[second]['packets'] += 1
        bin_map[second]['bytes'] += row['payloadBytes']
        bin_map[second][row['protocol']] += 1
        protocol[row['protocol']] += 1
        payload[row['protocol']] += row['payloadBytes']
        key = (row['protocol'], row['source'], row['sourcePort'], row['destination'], row['destinationPort'])
        flow = flows.setdefault(key, dict(protocol=row['protocol'], first=row['time'], last=row['time'], packets=0, bytes=0,
                                          sourcePort=row['sourcePort'], destinationPort=row['destinationPort']))
        flow['last'] = row['time']
        flow['packets'] += 1
        flow['bytes'] += row['payloadBytes']
    bins = [dict(elapsedSec=second, packets=bin_map[second]['packets'], bytes=bin_map[second]['bytes'],
                 tcpPackets=bin_map[second]['tcp'], udpPackets=bin_map[second]['udp'])
            for second in range(int(packets[-1]['time'] - started) + 1)]
    top_flows = []
    for key, row in sorted(flows.items(), key=lambda item: item[1]['bytes'], reverse=True)[:20]:
        top_flows.append(dict(flowHash=anonymized_flow(dict(protocol=key[0], source=key[1], sourcePort=key[2], destination=key[3], destinationPort=key[4])),
                              protocol=row['protocol'], sourcePort=row['sourcePort'], destinationPort=row['destinationPort'],
                              elapsedStartSec=round(row['first'] - started, 3), elapsedEndSec=round(row['last'] - started, 3),
                              packets=row['packets'], bytes=row['bytes']))
    changes = topology_changes(folder)
    bursts = change_points(bins)
    nearby = []
    for burst in bursts:
        linked = [change for change in changes if abs(change['elapsedSec'] - burst['elapsedSec']) <= 5]
        if linked:
            nearby.append(dict(burst=burst, endpointChanges=linked))
    result = dict(schemaVersion=1, generatedAtUtc=datetime.now(timezone.utc).isoformat(), capture=folder.name,
                  durationSec=round(packets[-1]['time'] - started, 3), packets=len(packets), protocolPackets=dict(protocol),
                  payloadBytes=dict(payload), flows=len(flows), topologyChanges=changes, trafficChangePoints=bursts,
                  correlatedCandidates=nearby, topFlows=top_flows,
                  evidence=[
                      'Mudanças de endpoint e picos são candidatos de transição de rede, não IDs de dungeon, grupo ou instância.',
                      'Portas, fluxos 5-tupla e hashes de fluxo são locais à instalação e nunca servem como chave cooperativa.',
                      'Payload cifrado/encapsulado não é interpretado por este relatório.'
                  ],
                  nextStep='Comparar o mesmo relatório em dois clientes na mesma dungeon e em instâncias distintas; somente um valor do payload decodificado com comportamento consistente pode virar chave automática.')
    (folder / 'session-context-analysis.json').write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    lines = [f'# Contexto de sessão — {folder.name}', '', f'- Duração observada: {result["durationSec"]:.2f} s.',
             f'- Pacotes: {result["packets"]:,}; fluxos: {result["flows"]:,}.',
             f'- TCP: {protocol["tcp"]:,}; UDP: {protocol["udp"]:,}.',
             f'- Alterações de endpoint: {len(changes)}; pontos de mudança de tráfego: {len(bursts)}.', '',
             '## Limite de interpretação', '',
             'Este relatório mede transições locais de rede. Ele não encontrou nem afirma um ID de instância; portas e fluxos não são compartilháveis entre instalações.', '',
             '## Próximos candidatos correlacionados', '']
    if nearby:
        for row in nearby[:12]:
            lines.append(f'- {row["burst"]["elapsedSec"]} s: variação de tráfego (score {row["burst"]["score"]}) próxima a alteração de endpoint.')
    else:
        lines.append('- Nenhuma correlação temporal forte; não inferir sessão a partir disso.')
    (folder / 'session-context-analysis.md').write_text('\n'.join(lines) + '\n', encoding='utf-8')
    print(json.dumps(dict(capture=result['capture'], packets=result['packets'], flows=result['flows'],
                          topologyChanges=len(changes), trafficChangePoints=len(bursts), correlatedCandidates=len(nearby)), ensure_ascii=False))


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--folder', type=Path, required=True)
    args = parser.parse_args()
    analyze(args.folder.resolve())
