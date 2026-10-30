"""Inspeção offline de campos de combate: candidatos não viram eventos confirmados."""
import argparse
from collections import Counter, defaultdict
import importlib.util
import json
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--folder', type=Path, required=True)
    parser.add_argument('--name', default='Toque de Cura')
    parser.add_argument('--uid', type=int, action='append', default=[], help='UID adicional de efeito ou habilidade para localizar')
    args = parser.parse_args()
    spec = importlib.util.spec_from_file_location('reference_builder', HERE/'build-overlay-reference.py')
    reference = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(reference)
    worker = reference.worker
    catalog = json.loads((ROOT/'src/data/overlayDataminedSkills.json').read_text(encoding='utf-8'))
    ids = {int(key): row for key, row in catalog.items()
           if args.name.casefold() in ((row.get('name') or '')+' '+(row.get('english') or '')).casefold()}
    for uid in args.uid:
        ids.setdefault(uid, dict(name=f'UID de referência {uid}'))
    if not ids:
        raise SystemExit('Nome não encontrado no catálogo local.')
    folder = args.folder.resolve()
    manifest = json.loads((folder/'manifest.json').read_text(encoding='utf-8'))
    clients = set()
    snapshots = folder/'endpoint-snapshots.jsonl'
    for line in snapshots.read_text(encoding='utf-8').splitlines() if snapshots.exists() else []:
        for row in json.loads(line)['endpoints']['tcp']:
            clients.add((row['LocalAddress'], int(row['LocalPort'])))
    counts, matches, amounts, errors = Counter(), [], defaultdict(Counter), []
    match_counts = Counter()
    sample_counts = Counter()
    direction = 'unknown'
    original = worker.decoder.frames

    def inspect(data, prefix='', depth=0):
        try:
            fields = worker.decoder.protobuf(data)
        except (ValueError, IndexError, TypeError):
            return []
        rows = []
        for field, values in fields.items():
            key = f'{prefix}.{field}' if prefix else str(field)
            for value in values:
                if isinstance(value, int):
                    rows.append(dict(field=key, raw=str(value), zigzag=str(worker.decoder.zigzag(value))))
                elif depth < 3 and 0 < len(value) <= 4096:
                    rows.extend(inspect(value, key, depth+1))
        return rows

    def frames(data, counters, timestamp, depth=0, length_key=None):
        for at, opcode, body in original(data, counters, timestamp, depth, length_key):
            if depth == 0:
                counts[hex(opcode)] += 1
                fields = inspect(body)
                found = [row for row in fields if int(row['raw']) in ids or int(row['zigzag']) in ids]
                if found:
                    match_counts[(hex(opcode), direction)] += 1
                    if len(matches) < 240 and sample_counts[opcode] < 20:
                        sample_counts[opcode] += 1
                        matches.append(dict(time=at, opcode=hex(opcode), direction=direction,
                                            skillFields=found, fields=fields[:80]))
                if opcode in (0x12344a7f, 0x12344a62):
                    amount_field = '5.1' if opcode == 0x12344a7f else '3'
                    for row in fields:
                        if row['field'] == amount_field:
                            value = int(row['zigzag'])
                            amounts[hex(opcode)]['positive' if value > 0 else 'negative' if value < 0 else 'zero'] += 1
            yield at, opcode, body

    worker.decoder.frames = frames
    worker.emit = lambda _: None
    streams = {}
    try:
        for part in manifest['parts']:
            for packet in reference.records(folder/part['file']):
                if not packet.get('payload'):
                    continue
                a, b = packet['source'], packet['dest']
                direction = 'client_to_server' if a in clients else 'server_to_client' if b in clients else 'unknown'
                key = a, b
                stream = streams.setdefault(key, worker.Stream(str(key), direction == 'server_to_client'))
                try:
                    stream.feed(packet['sequence'], packet['payload'], packet['time'])
                except (ValueError, AssertionError, IndexError) as error:
                    errors.append(dict(time=packet['time'], error=str(error)))
                    streams[key] = worker.Stream(str(key), direction == 'server_to_client')
                if packet['flags'] & 5:
                    streams.pop(key, None); streams.pop((b, a), None)
    finally:
        worker.decoder.frames = original
    report = dict(schemaVersion=1, capture=str(folder), referenceName=args.name, referenceSkills=ids,
                  validatedHealing=False, limitations=[
                      'Direção fica unknown quando a captura não preservou inventário de endpoints.',
                      'Coincidência de UID não comprova valor de cura, curador ou alvo.',
                      'Cura bruta/HP cheio não deve ser confundida com cura efetiva.',
                      'Campos assinados negativos não são automaticamente cura.',
                      'Amostras limitadas a 240 mensagens e 20 por opcode; contagens cobrem o arquivo inteiro.'],
                  opcodes=dict(counts), damageAmountSigns=dict(amounts),
                  matchedOpcodes=[dict(opcode=key[0], direction=key[1], count=count) for key, count in match_counts.items()],
                  samples=matches, errors=errors)
    output = folder/'combat-field-audit.json'
    output.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding='utf-8')
    print(json.dumps(dict(output=str(output), matchingMessages=sum(match_counts.values()),
                          matchedOpcodes=report['matchedOpcodes'], damageAmountSigns=report['damageAmountSigns'], errors=len(errors)), ensure_ascii=True))


if __name__ == '__main__':
    main()
