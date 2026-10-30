"""Preserva catálogos compactos no Git sem incluir todos os exports binários."""
import argparse
import gzip
import hashlib
import json
from pathlib import Path

p = argparse.ArgumentParser(description=__doc__)
p.add_argument('--build', required=True)
args = p.parse_args()
tool_root = Path(__file__).resolve().parent
source = tool_root/'exports'/args.build
destination = tool_root.parents[1]/'reference'/'datamine'/args.build
destination.mkdir(parents=True, exist_ok=True)
files = {}
for name in ('skill-reference.json', 'mastery-reference.json', 'skill-core-reference.json', 'table-inventory.json'):
    data = (source/name).read_bytes()
    compressed = gzip.compress(data, mtime=0)
    (destination/(name+'.gz')).write_bytes(compressed)
    files[name+'.gz'] = dict(bytes=len(compressed), sha256=hashlib.sha256(compressed).hexdigest(),
        uncompressedSha256=hashlib.sha256(data).hexdigest())
report = json.loads((source/'reference-index.json').read_text(encoding='utf-8'))
report['snapshots'] = files
report['verification'] = json.loads((source/'verification.json').read_text(encoding='utf-8'))
report['localDataRequired'] = ['full SQLite database', 'raw packages', 'all decoded tables', 'full PT/EN localization', 'all extracted images']
(destination/'index.json').write_text(json.dumps(report, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
print(json.dumps(dict(destination=str(destination), bytes=sum(item['bytes'] for item in files.values())),ensure_ascii=True))
