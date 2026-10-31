"""Gera a projeção compacta do catálogo de estados usada pelo app, sem escolher variantes."""
import argparse
import gzip
import json
from pathlib import Path

root = Path(__file__).resolve().parents[2]
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--build', default='26231302')
args = parser.parse_args()
catalog = json.loads(gzip.decompress((root/'reference/datamine'/args.build/'buff-reference.json.gz').read_bytes()))
effects = {}
for uid, row in catalog['effects'].items():
    names = list(dict.fromkeys(row.get('namesPt') or row.get('namesEn') or []))
    if names or row['kind'] != 'unknown':
        effects[uid] = dict(kind=row['kind'], names=names)
out = root/'src/data/overlayBuffEffects.json'
out.write_text(json.dumps(dict(schemaVersion=1, build=args.build, effects=effects), ensure_ascii=False, separators=(',', ':'))+'\n', encoding='utf-8')
print(f'{len(effects)} efeitos, {out.stat().st_size} bytes: {out}')
