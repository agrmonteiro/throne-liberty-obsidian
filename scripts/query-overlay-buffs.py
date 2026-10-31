"""Consulta nomes PT/EN, símbolos e IDs no catálogo de estados preservado no Git."""
import argparse
import gzip
import json
from pathlib import Path

p = argparse.ArgumentParser(description=__doc__)
p.add_argument('term')
p.add_argument('--catalog', type=Path, required=True)
p.add_argument('--limit', type=int, default=10)
p.add_argument('--full', action='store_true', help='Inclui as propriedades originais completas')
args = p.parse_args()
catalog = json.loads(gzip.decompress(args.catalog.read_bytes()))
term = args.term.casefold()
rows = []
for uid, effect in catalog['effects'].items():
    if term == uid or term in json.dumps(effect, ensure_ascii=False).casefold():
        related = catalog['abnormals'].get(effect.get('abnormal'), {})
        states, looks = related.get('states', []), related.get('looks', [])
        if not args.full:
            states = [dict(table=row['table'], **{key: row['properties'].get(key) for key in ('GoodOrBad', 'StackCap', 'ModifyGroup')}) for row in states]
            looks = [dict(table=row['table'], **{key: row['properties'].get(key) for key in ('ShowExpireTime', 'ShowOverlapCount', 'HideAllUI', 'ShowSelf', 'ShowTargetUI')}) for row in looks]
        rows.append(dict(effectId=int(uid), **effect, states=states, looks=looks))
        if len(rows) >= max(1, min(100, args.limit)):
            break
print(json.dumps(dict(build=catalog['build'], effects=rows), ensure_ascii=True, indent=2))
