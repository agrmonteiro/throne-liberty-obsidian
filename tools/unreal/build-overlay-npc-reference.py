"""Catálogo de NPCs por UID e rótulos descritivos para ataques sem nome de UI."""
import argparse
from collections import Counter, defaultdict
import json
from pathlib import Path
import re
import sqlite3

ACTIONS = {
    'Attack': 'Ataque', 'NormalAttack': 'Ataque básico', 'MeleeAttack': 'Ataque corpo a corpo',
    'RangedAttack': 'Ataque à distância', 'DoubleSwing': 'Ataque Duplo', 'ThrowStone': 'Arremesso de Pedra',
    'SpitSlime': 'Cuspe de Gosma', 'SpitPoison': 'Cuspe Venenoso', 'Death': 'Ataque ao Morrer',
    'SlashA': 'Corte A', 'SlashB': 'Corte B', 'Slash': 'Corte', 'BlinkAttack': 'Ataque com Teleporte',
    'ChargeAttack': 'Investida', 'DashAttack': 'Avanço Ofensivo', 'Dash': 'Investida',
    'AxeSmash': 'Golpe de Machado', 'AxeSwing': 'Balanço de Machado', 'Claw': 'Garrada',
    'TwoHandClaw': 'Garrada Dupla', 'SoulOrb': 'Orbe Espiritual', 'BlackBulletA': 'Projétil Sombrio A',
    'BlackBulletB': 'Projétil Sombrio B', 'BlackMeteor': 'Meteoro Sombrio', 'Howl': 'Uivo',
    'Weeping': 'Lamento', 'BodySlam': 'Golpe Corporal', 'Butt': 'Cabeçada',
    'ChainLightning': 'Relâmpago em Cadeia', 'IceOrb': 'Orbe de Gelo', 'FireBall': 'Bola de Fogo',
    'Bite': 'Mordida', 'Breath': 'Sopro', 'TailAttack': 'Ataque de Cauda', 'JumpAttack': 'Ataque com Salto',
}

def readable(symbol):
    return re.sub(r'(?<=[a-z])(?=[A-Z])|(?<=[A-Z])(?=[A-Z][a-z])', ' ', symbol).replace('_', ' ').strip()

def build(root, output, report):
    index = json.loads((root/'reference-index.json').read_text(encoding='utf-8'))
    db = sqlite3.connect((root/index['database']).resolve().as_uri()+'?mode=ro', uri=True)
    namespaces = dict(db.execute('SELECT table_name,namespace FROM source_strings GROUP BY table_name,namespace'))
    texts = {(lang, ns, key): text for lang, ns, key, text in db.execute('SELECT lang,namespace,key,text FROM texts')}
    def translated(ref, lang):
        if not isinstance(ref, dict) or not ref.get('Key'):
            return None
        asset = ref.get('TableId', '').split('/')[-1].split('.')[0]
        ns = namespaces.get(asset, ref.get('Namespace', asset))
        value = texts.get((lang, ns, ref['Key']))
        return value.strip() if value and value.strip() and not value.startswith('#') else None
    races = {}
    for row, raw in db.execute("SELECT row_key,payload FROM records WHERE table_name='TLNpcRace'"):
        data = json.loads(raw)
        races[row.casefold()] = {lang: translated(data.get('NpcName'), lang) for lang in ('pt', 'en')}
    for (lang, namespace, key), text in texts.items():
        if namespace == 'TLNpcRace' and key.endswith('_NpcName') and text and not text.startswith('#'):
            names = races.setdefault(key[:-8].casefold(), {})
            if not names.get(lang): names[lang] = text
    candidates, npcs = defaultdict(list), {}
    for table, row, uid, raw in db.execute("SELECT table_name,row_key,uid,payload FROM records WHERE table_name LIKE 'TLNpc_%' AND uid>0 ORDER BY table_name,row_key"):
        data = json.loads(raw)
        race = data.get('Race', {}).get('RowName', '')
        pt, en = translated(data.get('UIName'), 'pt'), translated(data.get('UIName'), 'en')
        race_names = races.get(race.casefold(), {})
        name = pt or en or race_names.get('pt') or race_names.get('en')
        if not name or uid > 2**53-1:
            continue
        candidates[uid].append(dict(name=name, english=en or race_names.get('en'), row=row,
                                   nameOrigin='localized' if pt or en else 'race'))
    ambiguous = []
    for uid, rows in candidates.items():
        if len({row['name'] for row in rows}) > 1:
            ambiguous.append(uid)
        else:
            npcs[str(uid)] = rows[0]
    skills, missing = {}, Counter()
    looks_by_symbol, case_matches = defaultdict(list), []
    for symbol, payload in db.execute("SELECT row_key,payload FROM records WHERE table_name LIKE 'TLSkillLooks_%' ORDER BY table_name,row_key"):
        looks_by_symbol[symbol.casefold()].append((symbol, payload))
    for row, uid in db.execute("SELECT row_key,uid FROM records WHERE table_name='TLSkill' AND uid>0 ORDER BY row_key"):
        if not row.startswith('Skill_'):
            continue
        candidates = looks_by_symbol.get(row.casefold(), [])
        exact = next((payload for symbol, payload in candidates if symbol == row), None)
        if exact is None and len({symbol for symbol, _ in candidates}) == 1:
            exact = candidates[0][1]
            case_matches.append(dict(skillId=uid, skillRow=row, looksRow=candidates[0][0]))
        if exact is None:
            continue
        data = json.loads(exact)
        official_pt, official_en = translated(data.get('UIName'), 'pt'), translated(data.get('UIName'), 'en')
        parts = row.removeprefix('Skill_').split('_')
        family, action = parts[0], parts[1] if len(parts) > 1 else 'Attack'
        family_names = races.get(f'Race_{family}'.casefold(), {})
        family_name = family_names.get('pt') or family_names.get('en') or readable(family)
        label = ACTIONS.get(action, readable(action))
        if action not in ACTIONS:
            missing[action] += 1
        skills[str(uid)] = dict(name=official_pt or official_en or f'{label} · {family_name}', row=row,
                                nameOrigin='localized' if official_pt or official_en else 'descriptive')
    result = dict(schemaVersion=1, build=index['build'], npcs=npcs, skills=skills)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(result, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
    summary = dict(build=index['build'], npcs=len(npcs), skills=len(skills), ambiguousNpcUids=ambiguous,
                   caseInsensitiveLooksMatches=case_matches,
                   skillNames=dict(Counter(row['nameOrigin'] for row in skills.values())),
                   untranslatedActionCounts=dict(missing.most_common()),
                   rules=['NPC names require an exact template UID from a server spawn, scoped to its connection.',
                          'Descriptive attack labels are derived from exact TLSkill symbols; they are not official localized skill names.',
                          'This catalog never identifies the player or attributes an entity by its skill alone.'])
    report.parent.mkdir(parents=True, exist_ok=True)
    report.write_text(json.dumps(summary, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
    db.close()
    return {key: summary[key] for key in ('build', 'npcs', 'skills', 'skillNames')}

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--build', required=True)
    args = parser.parse_args()
    repo = Path(__file__).resolve().parents[2]
    print(json.dumps(build(repo/'tools/unreal/exports'/args.build,
                           repo/'src/data/overlayNpcReference.json', repo/'docs/overlay-npc-reference.json')))
