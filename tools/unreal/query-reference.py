"""Consulta somente leitura por ID, nome PT/EN, símbolo ou SQL SELECT."""
import argparse
import json
from pathlib import Path
import sqlite3
import gzip

p = argparse.ArgumentParser(description=__doc__)
p.add_argument('term', nargs='?', default='')
p.add_argument('--build', required=True)
p.add_argument('--root', type=Path)
p.add_argument('--limit', type=int, default=20)
p.add_argument('--sql')
args = p.parse_args()
root = (args.root or Path(__file__).resolve().parent/'exports'/args.build).resolve()
snapshot = Path(__file__).resolve().parents[2]/'reference'/'datamine'/args.build
if not (root/'reference-index.json').is_file() and (snapshot/'index.json').is_file():
    if args.sql:
        raise SystemExit('SQL requer o SQLite completo. Gere a coleta com update-data.ps1 ou restaure o backup dos exports.')
    catalog = json.loads(gzip.decompress((snapshot/'skill-reference.json.gz').read_bytes()))['skills']
    term = args.term.casefold()
    limit = max(1, min(1000, args.limit))
    matches = [row for row in catalog if term in str(row.get('skillId')) or any(term in str(row.get(key, '')).casefold() for key in ('row','namePt','nameEn'))]
    extra = []
    for name in ('mastery-reference.json.gz', 'skill-core-reference.json.gz'):
        data = json.loads(gzip.decompress((snapshot/name).read_bytes()))
        extra.extend(row for row in data['records'] if term in json.dumps(row,ensure_ascii=False).casefold())
    print(json.dumps(dict(build=args.build, mode='git-snapshot', skills=matches[:limit], records=extra[:limit]),ensure_ascii=True,indent=2))
    raise SystemExit(0)
index = json.loads((root/'reference-index.json').read_text(encoding='utf-8'))
db = sqlite3.connect((root/index['database']).as_uri()+'?mode=ro', uri=True)
db.row_factory = sqlite3.Row
if args.sql:
    rows = [dict(row) for row in db.execute(args.sql).fetchmany(max(1, min(1000, args.limit)))]
    result = dict(build=args.build, rows=rows)
else:
    catalog = json.loads((root/'skill-reference.json').read_text(encoding='utf-8'))['skills']
    term = args.term.casefold()
    skills = [row for row in catalog if term in str(row.get('skillId')) or any(term in str(row.get(key, '')).casefold() for key in ('row', 'namePt', 'nameEn'))]
    pattern = '%'+args.term+'%'
    records = [dict(row) for row in db.execute('SELECT table_name,row_key,uid,name_pt,name_en FROM records WHERE row_key LIKE ? OR name_pt LIKE ? OR name_en LIKE ? LIMIT ?', (pattern, pattern, pattern, max(1, min(1000, args.limit))))]
    result = dict(build=args.build, skills=skills[:args.limit], records=records)
print(json.dumps(result, ensure_ascii=True, indent=2))
db.close()
