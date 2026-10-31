"""Exporta o mapa estático de efeitos, buffs/debuffs e apresentação do SQLite local."""
import argparse
from collections import Counter, defaultdict
import gzip
import hashlib
import json
from pathlib import Path
import sqlite3


def build(build_id, output=None):
    tool = Path(__file__).resolve().parent
    folder = tool/'exports'/build_id
    index = json.loads((folder/'reference-index.json').read_text(encoding='utf-8'))
    db = sqlite3.connect((folder/index['database']).as_uri()+'?mode=ro', uri=True)
    abnormals = defaultdict(lambda: dict(states=[], looks=[]))
    for table, row, pt, en, payload in db.execute("SELECT table_name,row_key,name_pt,name_en,payload FROM records WHERE table_name LIKE 'TLAbnormalState_%' OR table_name LIKE 'TLAbnormalLooks_%' ORDER BY table_name,row_key"):
        target = 'states' if table.startswith('TLAbnormalState_') else 'looks'
        abnormals[row][target].append(dict(table=table, namePt=pt, nameEn=en, properties=json.loads(payload)))
    skills = {str(uid): dict(row=row, namePt=pt, nameEn=en) for row, uid, pt, en in db.execute("SELECT row_key,uid,name_pt,name_en FROM records WHERE table_name='TLSkill' AND uid>0 ORDER BY uid")}
    effects = {}
    for row, uid, payload in db.execute("SELECT row_key,uid,payload FROM records WHERE table_name='TLEffectProperty' AND uid>0 ORDER BY uid"):
        if str(uid) in effects:
            raise ValueError(f'UID ambíguo: {uid}')
        data = json.loads(payload)
        abnormal = data.get('Abnormal')
        abnormal = abnormal if abnormal and abnormal != 'None' else None
        related = abnormals.get(abnormal, dict(states=[], looks=[]))
        dispositions = {item['properties'].get('GoodOrBad') for item in related['states']}
        kind = {'EAbnormalGoodOrBad::kGood': 'buff', 'EAbnormalGoodOrBad::kBad': 'debuff',
                'EAbnormalGoodOrBad::kNone': 'neutral'}.get(next(iter(dispositions)), 'unknown') if len(dispositions) == 1 else 'unknown'
        names = lambda key: sorted({item[key] for item in related['looks'] if item.get(key)})
        icons = sorted({item['properties'].get('AbnormalIconPath', {}).get('AssetPathName') for item in related['looks']
                        if item['properties'].get('AbnormalIconPath', {}).get('AssetPathName') not in (None, 'None')})
        effects[str(uid)] = dict(row=row, group=data.get('Group', '').removeprefix('EEffectGroup::'),
                                abnormal=abnormal, kind=kind, namesPt=names('namePt'), namesEn=names('nameEn'), iconPaths=icons)
    db.close()
    result = dict(schemaVersion=1, build=build_id, sourceDatabase=index['database'], sourceDatabaseSha256=index['databaseSha256'],
                  scope='Static symbol links; wire fields and runtime presence require packet evidence.',
                  limitations=['Unknown is not a buff.', 'Conflicting/conditional names and icons remain arrays.',
                               'No static duration or runtime identity is inferred from this catalog.'],
                  effects=effects, abnormals=dict(sorted(abnormals.items())), skills=skills)
    output = output or tool.parents[1]/'reference/datamine'/build_id/'buff-reference.json.gz'
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_bytes(gzip.compress(json.dumps(result, ensure_ascii=False, separators=(',', ':')).encode('utf-8'), mtime=0))
    counts = dict(effects=len(effects), abnormals=len(abnormals), skills=len(skills),
                  states=sum(len(v['states']) for v in abnormals.values()), looks=sum(len(v['looks']) for v in abnormals.values()),
                  kinds=dict(Counter(row['kind'] for row in effects.values())))
    metadata = dict(schemaVersion=1, build=build_id, file=output.name, bytes=output.stat().st_size,
                    sha256=hashlib.sha256(output.read_bytes()).hexdigest(), sourceDatabase=index['database'], counts=counts, scope=result['scope'], limitations=result['limitations'])
    output.with_name('buff-reference-index.json').write_text(json.dumps(metadata, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
    print(json.dumps(dict(output=str(output), **metadata), ensure_ascii=True))
    return result


if __name__ == '__main__':
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('--build', required=True)
    p.add_argument('--output', type=Path)
    args = p.parse_args()
    build(args.build, args.output)
