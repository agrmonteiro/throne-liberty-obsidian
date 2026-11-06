"""Agrega eventos observados por conexão, origem, habilidade e alvo, sem inferir grupo."""
import argparse
from collections import Counter
import json
import math
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def analyze(input_file, output_file):
    skill_names = json.loads((ROOT/'src/data/overlaySkillNames.json').read_text(encoding='utf8'))
    catalog = json.loads((ROOT/'src/data/overlayDataminedSkills.json').read_text(encoding='utf8'))
    npc_catalog = json.loads((ROOT/'src/data/overlayNpcReference.json').read_text(encoding='utf8'))['npcs']
    counters, connections, errors = Counter(), {}, []
    def get_connection(key):
        return connections.setdefault(key, {'profiles': {}, 'npcs': {}, 'sources': {}, 'first': None, 'last': None})
    def observe_name(table, key, name):
        names = table.setdefault(key, set())
        names.add(name)
    with input_file.open(encoding='utf-8-sig', errors='replace') as stream:
        for line_number, line in enumerate(stream, 1):
            try:
                row = json.loads(line)
                kind = row.get('type')
                counters[kind or 'unknown'] += 1
                connection = row.get('connectionId') or row.get('event', {}).get('connectionId')
                if not isinstance(connection, str) or not connection:
                    continue
                state = get_connection(connection)
                if kind == 'identity':
                    actor, name = row.get('sourceId'), row.get('name')
                    if isinstance(actor, int) and actor > 0 and isinstance(name, str) and name.strip():
                        observe_name(state['profiles'], actor, name.strip())
                elif kind == 'npc':
                    actor, npc = row.get('sourceId'), row.get('npcId')
                    if isinstance(actor, int) and actor > 0 and isinstance(npc, int) and npc > 0:
                        observe_name(state['npcs'], actor, npc)
                elif kind == 'damage':
                    event = row.get('event', {})
                    if row.get('raw', {}).get('direction') != 'server-to-client':
                        counters['damageExcludedDirection'] += 1
                        continue
                    actor, target, skill, amount, at = (event.get(k) for k in ('sourceId', 'targetId', 'skillId', 'damage', 'time'))
                    if not all(isinstance(x, int) and not isinstance(x, bool) and 0 < x < 2**53 for x in (actor, amount)):
                        counters['damageInvalid'] += 1; continue
                    if not isinstance(skill, int) or isinstance(skill, bool) or not isinstance(at, (int, float)) or not math.isfinite(at):
                        counters['damageInvalid'] += 1; continue
                    target = target if isinstance(target, int) and not isinstance(target, bool) and 0 < target < 2**53 else 0
                    state['first'] = at if state['first'] is None else min(state['first'], at)
                    state['last'] = at if state['last'] is None else max(state['last'], at)
                    source = state['sources'].setdefault(actor, {'damage': 0, 'hits': 0, 'skills': {}, 'targets': {}})
                    source['damage'] += amount; source['hits'] += 1
                    skill_row = source['skills'].setdefault(skill, {'damage': 0, 'hits': 0})
                    skill_row['damage'] += amount; skill_row['hits'] += 1
                    target_row = source['targets'].setdefault(target, {'damage': 0, 'hits': 0, 'skills': {}})
                    target_row['damage'] += amount; target_row['hits'] += 1
                    target_skill = target_row['skills'].setdefault(skill, {'damage': 0, 'hits': 0})
                    target_skill['damage'] += amount; target_skill['hits'] += 1
            except (ValueError, TypeError, AttributeError) as error:
                if len(errors) < 20: errors.append({'line': line_number, 'error': str(error)})
    def name_for(state, actor):
        profiles, npcs = state['profiles'].get(actor, set()), state['npcs'].get(actor, set())
        if len(profiles) == 1 and not npcs: return next(iter(profiles)), 'player-profile'
        if len(npcs) == 1 and not profiles:
            row = npc_catalog.get(str(next(iter(npcs))), {})
            return row.get('name'), 'npc-template'
        return None, 'conflict' if len(profiles) > 1 or len(npcs) > 1 or profiles and npcs else 'unknown'
    def skills(rows):
        result = []
        for skill, values in rows.items():
            name = skill_names.get(str(skill)) or catalog.get(str(skill), {}).get('name')
            result.append({'skillId': skill, 'name': name, **values})
        return sorted(result, key=lambda item: -item['damage'])
    result = []
    for connection, state in connections.items():
        rows = []
        for actor, values in state['sources'].items():
            name, classification = name_for(state, actor)
            target_rows = []
            for target, data in values['targets'].items():
                target_name, target_kind = name_for(state, target)
                target_rows.append({'id': target or None, 'name': target_name, 'classification': target_kind,
                                    'damage': data['damage'], 'hits': data['hits'], 'skills': skills(data['skills'])})
            rows.append({'id': actor, 'name': name, 'classification': classification, 'damage': values['damage'], 'hits': values['hits'],
                         'skills': skills(values['skills']), 'targets': sorted(target_rows, key=lambda item: -item['damage'])})
        result.append({'connectionId': connection, 'firstDamageAt': state['first'], 'lastDamageAt': state['last'],
                       'sources': sorted(rows, key=lambda item: -item['damage'])})
    output_file.parent.mkdir(parents=True, exist_ok=True)
    output_file.write_text(json.dumps({'schemaVersion': 1, 'input': str(input_file), 'counts': counters,
        'connections': result, 'errors': errors,
        'limitations': ['Jogador observado não comprova participação no grupo.', 'Cobertura depende dos pacotes recebidos.',
                        'Conexões são separadas; IDs e nomes não são deduzidos por frequência.']}, ensure_ascii=False, indent=2)+'\n', encoding='utf8')
    print(json.dumps({'output': str(output_file), 'connections': len(result), 'damageEvents': counters['damage'],
                      'sources': sum(len(row['sources']) for row in result), 'errors': len(errors)}))


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--input', required=True, type=Path)
    parser.add_argument('--output', required=True, type=Path)
    args = parser.parse_args()
    analyze(args.input, args.output)
