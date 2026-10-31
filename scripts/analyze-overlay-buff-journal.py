"""Reprocessa o JSONL de buffs do app sem PCAP; usa o corpo bruto e perfis da mesma captura/conexão."""
import argparse
from collections import Counter
import importlib.util
import json
from pathlib import Path

HERE = Path(__file__).resolve().parent
def module(name, file):
    spec = importlib.util.spec_from_file_location(name, HERE/file)
    result = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(result)
    return result

def analyze(journal, output=None, player_name=None):
    decoder = module('journal_decoder', 'analisar-npcap-tl.py')
    protocol = module('journal_tracker', 'overlay-buff-protocol.py')
    output = output or journal.with_name(journal.stem+'-analysis')
    if (output/'events.jsonl').resolve() == journal.resolve():
        raise ValueError('A saída não pode sobrescrever o journal original')
    output.mkdir(parents=True, exist_ok=True)
    names, conflicts, errors, error_lines = {}, set(), [], set()
    def records():
        with journal.open(encoding='utf-8') as file:
            for number, line in enumerate(file, 1):
                try:
                    row = json.loads(line)
                    if not isinstance(row, dict): raise ValueError('Registro inválido')
                    yield number, row
                except (ValueError, TypeError) as error:
                    if number not in error_lines and len(errors) < 100: errors.append(dict(line=number, error=str(error)))
                    error_lines.add(number)
    for _, row in records():
        if row.get('type') == 'profile-observation':
            key = row.get('captureId'), row.get('connectionId'), row.get('sourceId')
            name = row.get('name')
            if key in names and names[key] != name: conflicts.add(key)
            if isinstance(name, str): names[key] = name
    for key in conflicts: names.pop(key, None)
    trackers, counts, kinds = {}, Counter(), Counter()
    selected = {key: name for key, name in names.items() if player_name and name == player_name}
    player_counts = {key: Counter() for key in selected}
    with (output/'events.jsonl').open('w', encoding='utf-8') as file:
        for number, row in records():
            scope = row.get('captureId'), row.get('connectionId')
            if row.get('type') == 'connection-closed':
                if scope in trackers: trackers[scope].retire(scope[1])
                continue
            if row.get('type') != 'buff': continue
            try:
                raw = row['raw']
                if raw['direction'] != 'server-to-client': raise ValueError('Direção inválida')
                event = decoder.buff_state(int(raw['opcode'], 16), bytes.fromhex(raw['bodyHex']))
                if not event: raise ValueError('Formato de estado inválido')
                event.update(time=row['time'], connectionId=scope[1], captureId=scope[0],
                             kind=row.get('kind', 'unknown'), effectNames=row.get('effectNames', []), raw=raw)
                tracker = trackers.setdefault(scope, protocol.Tracker())
                event['relation'] = tracker.accept(event)
                counts[event['action']] += 1; kinds[event['kind']] += 1
                for side in ('source', 'target'):
                    key = (*scope, event[side+'Id'])
                    event[side+'Name'] = names.get(key)
                for key, counter in player_counts.items():
                    if key[:2] == scope and key[2] in (event['sourceId'], event['targetId']): counter[event['action']] += 1
                file.write(json.dumps(event, ensure_ascii=False)+'\n')
            except (ValueError, KeyError, TypeError) as error:
                if len(errors) < 100: errors.append(dict(line=number, error=str(error)))
    intervals = [dict(captureId=scope[0], **interval) for scope, tracker in trackers.items() for interval in tracker.intervals]
    summary = dict(schemaVersion=1, journal=str(journal), counts=dict(counts), kinds=dict(kinds),
                   intervals=len(intervals), completeIntervals=sum(row['complete'] for row in intervals),
                   openStatesAtEnd=sum(len(tracker.active) for tracker in trackers.values()),
                   selectedPlayers=[dict(captureId=k[0], connectionId=k[1], entityId=k[2], name=selected[k], counts=dict(v)) for k,v in player_counts.items()],
                   conflictingProfiles=len(conflicts), errors=errors,
                   limitations=['Cobertura parcial: sem snapshot completo dos efeitos ativos.', 'Timers e acúmulos são candidatos.',
                                'Estado aberto não comprova presença até o fim; silêncio não é remoção.'])
    for name, value in (('summary.json', summary), ('intervals.json', intervals)):
        (output/name).write_text(json.dumps(value, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
    print(json.dumps(dict(output=str(output), **summary), ensure_ascii=True))
    return summary

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--journal', type=Path, required=True)
    parser.add_argument('--output', type=Path)
    parser.add_argument('--player-name')
    args = parser.parse_args()
    analyze(args.journal, args.output, args.player_name)
