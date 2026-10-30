"""Cria planos a partir do índice real dos arquivos, sem fixar apenas uma arma."""
import argparse
import json
from pathlib import Path
import sqlite3

p = argparse.ArgumentParser(description=__doc__)
p.add_argument('kind', choices=('tables', 'icons'))
p.add_argument('inventory', type=Path)
p.add_argument('output', type=Path)
p.add_argument('--reference', type=Path)
args = p.parse_args()
inventory = json.loads(args.inventory.read_text(encoding='utf-8-sig'))
available = set(inventory['paths'])
if args.kind == 'tables':
    paths = {x for x in available if '/Client/Table/' in x and x.endswith('.uasset')}
    if not paths:
        raise RuntimeError('Tabelas do cliente não estão acessíveis. Confira chave/preset/build antes de continuar.')
    paths.update(f'TL/Content/Localization/Game/{lang}/Game.locres' for lang in ('en', 'pt'))
else:
    paths = {x for x in available if x.startswith(('TL/Content/Image/Skill/', 'TL/Content/Image/Icon/')) and x.endswith('.uasset')}
    if args.reference:
        index = json.loads(args.reference.read_text(encoding='utf-8'))
        database = args.reference.parent/index['database']
        with sqlite3.connect(database.resolve().as_uri()+'?mode=ro', uri=True) as db:
            for (asset,) in db.execute("SELECT DISTINCT asset_path FROM assets WHERE lower(field_path) LIKE '%icon%' AND asset_path LIKE '/Game/Image/%'"):
                source = 'TL/Content/'+asset[6:].split('.')[0]+'.uasset'
                if source in available:
                    paths.add(source)
plan = dict(kind='textures' if args.kind == 'icons' else 'tables', paths=sorted(paths))
args.output.parent.mkdir(parents=True, exist_ok=True)
args.output.write_text(json.dumps(plan, indent=2)+'\n', encoding='utf-8')
print(json.dumps(dict(kind=args.kind, paths=len(paths), output=str(args.output)), ensure_ascii=True))
