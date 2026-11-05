"""Preserva rótulos PT/EN, símbolos e formatação da ficha; IDs de rede exigem evidência separada."""
import argparse
import gzip
import hashlib
import json
from pathlib import Path

def build(build_id):
    root = Path(__file__).resolve().parents[2]
    folder = root/'tools/unreal/exports'/build_id
    props = folder/'skill-data/properties'
    looks = json.loads((props/'TLStatAttrLooks.json').read_text(encoding='utf-8'))[0]['Rows']
    stats = json.loads((props/'TLStats.json').read_text(encoding='utf-8'))[0]['Rows']
    locales = {lang: json.loads((folder/f'skill-data/localization/{lang}.json').read_text(encoding='utf-8')) for lang in ('pt','en')}
    namespaces = {}
    def text(value, lang):
        if not isinstance(value, dict): return None
        if value.get('CultureInvariantString') is not None: return value['CultureInvariantString']
        table = value.get('TableId', '').rsplit('/',1)[-1].split('.')[0]
        if table not in namespaces:
            file = props/f'{table}.json'
            namespaces[table] = json.loads(file.read_text(encoding='utf-8'))[0].get('StringTable', {}).get('TableNamespace') if file.exists() else None
        return locales[lang].get(namespaces[table], {}).get(value.get('Key'))
    rows = []
    for key, row in looks.items():
        rows.append(dict(row=key, symbol=row.get('PcStatsType'), itemSymbol=row.get('ItemAttrType'),
                         namePt=text(row.get('CharacterUIName'), 'pt'), nameEn=text(row.get('CharacterUIName'), 'en'),
                         formatPt=text(row.get('ValueFormat'), 'pt'), formatEn=text(row.get('ValueFormat'), 'en'),
                         multiply=row.get('Multiply'), inversely=row.get('Inversely'), useSign=row.get('UseSign'),
                         sort=row.get('UISortPriority'), properties=row))
    result = dict(schemaVersion=1, build=build_id, looks=rows, itemStats=stats,
                  limitations=['TLStats.num belongs to EItemStats, not a universal wire ID.',
                               'List ordinals are candidates for EPcStatsType until validated against packets/UI.',
                               'Static metadata does not contain the equipped character values.'])
    out = root/'reference/datamine'/build_id/'character-stat-reference.json.gz'
    out.parent.mkdir(parents=True,exist_ok=True)
    out.write_bytes(gzip.compress(json.dumps(result,ensure_ascii=False,separators=(',', ':')).encode(),mtime=0))
    metadata = dict(schemaVersion=1,build=build_id,file=out.name,sha256=hashlib.sha256(out.read_bytes()).hexdigest(),
                    counts=dict(looks=len(rows),namedPt=sum(bool(row['namePt']) for row in rows),itemStats=len(stats)),limitations=result['limitations'])
    out.with_name('character-stat-reference-index.json').write_text(json.dumps(metadata,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    by_symbol = {row['symbol'].split('::')[-1]: row for row in rows if row['symbol'] != 'EPcStatsType::kNone'}
    projection = {}
    for ordinal, (key, item) in enumerate(stats.items(), 1):
        symbol = item['stat_enum'].split('::')[-1]
        look = by_symbol.get(symbol)
        projection[str(ordinal)] = dict(symbol=symbol, itemNumber=item['num'],
            namePt=(look or {}).get('namePt'), nameEn=(look or {}).get('nameEn'),
            multiply=(look or {}).get('multiply', 1),
            format=((look or {}).get('properties', {}).get('ValueFormat', {}).get('SourceString') or '{0}'),
            mapping='static-ordinal', row=key)
    (root/'src/data/characterStatReference.json').write_text(json.dumps(dict(schemaVersion=1,build=build_id,stats=projection),ensure_ascii=False,separators=(',',':'))+'\n',encoding='utf-8')
    print(json.dumps(metadata,ensure_ascii=True))
    return result

if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--build',required=True)
    build(parser.parse_args().build)
