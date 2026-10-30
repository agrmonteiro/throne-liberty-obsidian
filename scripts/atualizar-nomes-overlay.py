"""Cruza IDs de dano com nomes explícitos dos logs locais, sem adivinhar por dano."""
import argparse
from collections import Counter, defaultdict
import csv
from datetime import datetime, timezone
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def collect(folder):
    index = defaultdict(lambda: defaultdict(lambda: dict(events=0, files=set())))
    files = sorted(folder.glob('*.txt')) + sorted(folder.glob('*.log'))
    for file in files:
        with file.open(encoding='utf-8-sig', errors='replace', newline='') as stream:
            for row in csv.reader(stream):
                if len(row) < 5 or row[1] not in ('DamageDone', 'DamageTaken'):
                    continue
                try:
                    skill_id = int(row[3])
                except ValueError:
                    continue
                name = re.sub(r'\^?<[^>]+>', '', row[2]).strip()
                if skill_id <= 0 or not name or name.startswith('Habilidade '):
                    continue
                item = index[str(skill_id)][name]
                item['events'] += 1
                item['files'].add(file.name)
    return index, len(files)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--logs', type=Path, required=True)
    parser.add_argument('--unknown', type=Path)
    parser.add_argument('--apply', action='store_true')
    args = parser.parse_args()
    target = ROOT/'src/data/overlaySkillNames.json'
    current = {key: re.sub(r'\^?<[^>]+>', '', name).strip()
               for key, name in json.loads(target.read_text(encoding='utf-8')).items()}
    index, file_count = collect(args.logs)
    additions, conflicts = {}, {}
    evidence = {}
    for skill_id, names in index.items():
        if len(names) != 1:
            conflicts[skill_id] = {name: item['events'] for name, item in names.items()}
            continue
        name, info = next(iter(names.items()))
        if skill_id in current and current[skill_id] != name:
            conflicts[skill_id] = dict(existing=current[skill_id], log=name)
            continue
        evidence[skill_id] = dict(name=name, events=info['events'], files=sorted(info['files']))
        if skill_id not in current:
            additions[skill_id] = name
    observed = Counter()
    if args.unknown and args.unknown.exists():
        # JSONL é a fonte de eventos; snapshots não são somados como eventos.
        for file in args.unknown.rglob('events-*.jsonl'):
            with file.open(encoding='utf-8') as stream:
                for line in stream:
                    try:
                        event = json.loads(line)
                    except json.JSONDecodeError:
                        continue
                    if event.get('mode') == 'live':
                        observed[str(event['skillId'])] += 1
        for file in args.unknown.glob('previous-snapshot-*.json'):
            snapshot = json.loads(file.read_text(encoding='utf-8'))
            for row in snapshot.get('skills', []):
                observed.setdefault(str(row['key']), 0)
    merged = current | additions
    report = dict(generatedAt=datetime.now(timezone.utc).isoformat(), filesScanned=file_count,
                  previous=len(current), total=len(merged), additions=additions, evidence=evidence,
                  conflicts=conflicts,
                  observed=[dict(skillId=int(key), events=count, name=merged.get(key),
                                 status='mapped' if key in merged else 'pending')
                            for key, count in observed.most_common()])
    output = ROOT/'docs/coletas/resultados/overlay-skill-mapping.json'
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(report, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
    if args.apply:
        target.write_text(json.dumps(dict(sorted(merged.items(), key=lambda row:int(row[0]))), ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
    print(json.dumps(dict(files=file_count, previous=len(current), added=len(additions),
                         total=len(merged), conflicts=len(conflicts),
                         observed=report['observed'], report=str(output)), ensure_ascii=True))


if __name__ == '__main__':
    main()
