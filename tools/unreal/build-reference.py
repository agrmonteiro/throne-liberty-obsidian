"""Indexa exports locais em SQLite, preservando proveniência e nomes PT/EN."""
import argparse
from collections import Counter, defaultdict
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
import re
import sqlite3

VERSION = 1
ROOT = Path(__file__).resolve().parent


def read(path):
    return json.loads(path.read_text(encoding='utf-8-sig'))


def digest(path):
    with path.open('rb') as stream:
        return hashlib.file_digest(stream, 'sha256').hexdigest()


def leaves(value, prefix=''):
    if isinstance(value, dict):
        for key, item in value.items():
            yield from leaves(item, f'{prefix}.{key}' if prefix else key)
    elif isinstance(value, list):
        for index, item in enumerate(value):
            yield from leaves(item, f'{prefix}[{index}]')
    elif isinstance(value, str):
        yield prefix, value


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--build', required=True)
    parser.add_argument('--root', type=Path)
    args = parser.parse_args()
    root = args.root or ROOT/'exports'/args.build
    manifest_path = root/'tl-full-extraction.json'
    manifest = read(manifest_path)
    failures = [row for row in manifest['exports'] if row.get('error')]
    if failures:
        raise RuntimeError(f'Corrija os {len(failures)} erros de extração antes de indexar a coleta.')
    fingerprint = digest(manifest_path)
    db_path = root/f'reference-{fingerprint[:12]}.sqlite'
    if db_path.exists():
        db_path = root/f'reference-{fingerprint[:12]}-{datetime.now(timezone.utc):%Y%m%dT%H%M%S}.sqlite'
    properties = root/'skill-data'/'properties'
    files = sorted({root/output['path'] for row in manifest['exports'] for output in row['outputs']
                    if '/properties/' in output['path'].replace('\\', '/') and output['path'].endswith('.json')})
    locales = {lang: read(root/'skill-data'/'localization'/f'{lang}.json') for lang in ('pt', 'en')}
    namespaces = {}
    for file in files:
        with file.open(encoding='utf-8') as stream:
            if '"StringTable"' not in stream.read(2048):
                continue
        for obj in read(file):
            if table := obj.get('StringTable'):
                namespaces[obj['Name']] = table.get('TableNamespace')

    def translate(value, lang):
        if not isinstance(value, dict) or not value.get('Key'):
            return None
        table = str(value.get('TableId', '')).rsplit('/', 1)[-1].split('.')[0]
        namespace = namespaces.get(table, value.get('Namespace', table))
        return locales[lang].get(namespace, {}).get(value['Key'])

    db = sqlite3.connect(db_path)
    db.executescript('''
      CREATE TABLE metadata(key TEXT PRIMARY KEY,value TEXT NOT NULL);
      CREATE TABLE tables(name TEXT PRIMARY KEY,source TEXT,sha256 TEXT,class TEXT,row_count INTEGER,string_count INTEGER);
      CREATE TABLE records(table_name TEXT,row_key TEXT,uid INTEGER,name_pt TEXT,name_en TEXT,payload TEXT,PRIMARY KEY(table_name,row_key));
      CREATE INDEX records_uid ON records(uid);
      CREATE INDEX records_symbol ON records(row_key);
      CREATE TABLE texts(lang TEXT,namespace TEXT,key TEXT,text TEXT,PRIMARY KEY(lang,namespace,key));
      CREATE VIRTUAL TABLE text_search USING fts5(lang UNINDEXED,namespace UNINDEXED,key UNINDEXED,text);
      CREATE TABLE source_strings(table_name TEXT,namespace TEXT,key TEXT,text TEXT,PRIMARY KEY(table_name,key));
      CREATE TABLE assets(table_name TEXT,row_key TEXT,field_path TEXT,asset_path TEXT);
      CREATE INDEX assets_path ON assets(asset_path);
      CREATE TABLE links(source_table TEXT,source_row TEXT,field_path TEXT,target_symbol TEXT,target_count INTEGER);
      CREATE INDEX links_target ON links(target_symbol);
      CREATE INDEX links_source ON links(source_table,source_row);
    ''')
    db.executemany('INSERT INTO metadata VALUES(?,?)', [('build', args.build), ('indexVersion', str(VERSION)), ('extractionManifestSha256', fingerprint)])
    text_count = {}
    for lang, groups in locales.items():
        values = [(lang, namespace, key, text) for namespace, items in groups.items() for key, text in items.items()]
        db.executemany('INSERT INTO texts VALUES(?,?,?,?)', values)
        db.executemany('INSERT INTO text_search VALUES(?,?,?,?)', values)
        text_count[lang] = len(values)
    inventory = []
    looks = defaultdict(list)
    skills = {}
    classes = Counter()
    for count, file in enumerate(files, 1):
        for obj in read(file):
            table = obj.get('Name', file.stem)
            rows = obj.get('Rows') or {}
            strings = obj.get('StringTable') or {}
            entries = strings.get('KeysToEntries') or {}
            db.execute('INSERT INTO tables VALUES(?,?,?,?,?,?)', (table, obj.get('Package'), digest(file), obj.get('Type'), len(rows), len(entries)))
            inventory.append(dict(table=table, source=obj.get('Package'), rows=len(rows), strings=len(entries), sha256=digest(file)))
            classes[obj.get('Type')] += 1
            db.executemany('INSERT INTO source_strings VALUES(?,?,?,?)', [(table, strings.get('TableNamespace'), key, val if isinstance(val, str) else json.dumps(val, ensure_ascii=False)) for key, val in entries.items()])
            values, assets = [], []
            for key, row in rows.items():
                if not isinstance(row, dict):
                    row = {'value': row}
                uid = row.get('UID')
                uid = uid if isinstance(uid, int) and uid > 0 else None
                pt, en = translate(row.get('UIName'), 'pt'), translate(row.get('UIName'), 'en')
                values.append((table, key, uid, pt, en, json.dumps(row, ensure_ascii=False, separators=(',', ':'))))
                for field, value in leaves(row):
                    if value.startswith(('/Game/', '/Engine/')):
                        assets.append((table, key, field, value))
                if table == 'TLSkill':
                    skills[key] = dict(skillId=uid, row=key)
                if table.startswith('TLSkillPcLooks'):
                    looks[key].append(dict(table=table, namePt=pt, nameEn=en,
                        text=row.get('UIName'), iconPath=(row.get('IconPath') or {}).get('AssetPathName'),
                        conditionalIcons=row.get('SkillPcLooksBySkillTrait') or []))
            db.executemany('INSERT INTO records VALUES(?,?,?,?,?,?)', values)
            db.executemany('INSERT INTO assets VALUES(?,?,?,?)', assets)
        if count % 100 == 0:
            db.commit()
            print(f'Tabelas indexadas: {count}/{len(files)}', flush=True)
    db.commit()
    symbols = Counter(row[0] for row in db.execute('SELECT row_key FROM records'))
    links = []
    for table, key, payload in db.execute('SELECT table_name,row_key,payload FROM records'):
        for field, value in leaves(json.loads(payload)):
            if len(value) >= 4 and value != key and value != 'None' and value in symbols:
                links.append((table, key, field, value, symbols[value]))
        if len(links) >= 10000:
            db.executemany('INSERT INTO links VALUES(?,?,?,?,?)', links)
            links.clear()
    db.executemany('INSERT INTO links VALUES(?,?,?,?,?)', links)
    db.commit()
    catalog = []
    for key, skill in skills.items():
        matches = looks.get(key, [])
        identities = {(item['namePt'], item['nameEn'], item['iconPath']) for item in matches}
        if len(identities) == 1:
            skill.update(matches[0])
            skill['status'] = 'exact-uid-symbol-ui-localization'
        else:
            skill.update(status='no-unique-localized-ui', candidates=matches)
        catalog.append(skill)
    catalog.sort(key=lambda row: (row['skillId'] or 0, row['row']))
    counts = {name: db.execute(f'SELECT count(*) FROM {name}').fetchone()[0] for name in ('records', 'texts', 'source_strings', 'assets', 'links')}
    counts.update(tables=len(inventory), skills=len(catalog), localizedSkills=sum(bool(row.get('nameEn') or row.get('namePt')) for row in catalog))
    mastery = [dict(zip(('table', 'row', 'namePt', 'nameEn', 'payload'), row)) for row in db.execute("SELECT table_name,row_key,name_pt,name_en,payload FROM records WHERE table_name LIKE 'TLWeaponSpecialization%' OR table_name='TLTableWeaponSpecializationLooks'")]
    cores = [dict(zip(('table', 'row', 'namePt', 'nameEn', 'payload'), row)) for row in db.execute("SELECT table_name,row_key,name_pt,name_en,payload FROM records WHERE lower(row_key) LIKE '%perk%' OR lower(row_key) LIKE '%skillcore%' OR lower(name_en) LIKE '%skill core%'")]
    for items in (mastery, cores):
        for item in items:
            item['payload'] = json.loads(item['payload'])
    counts.update(masteryRecords=len(mastery), skillCoreRelatedRecords=len(cores))
    integrity = db.execute('PRAGMA integrity_check').fetchone()[0]
    db.close()
    def write(name, value):
        (root/name).write_text(json.dumps(value, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
    write('skill-reference.json', dict(build=args.build, schemaVersion=VERSION, skills=catalog))
    write('mastery-reference.json', dict(build=args.build, records=mastery))
    write('skill-core-reference.json', dict(build=args.build, records=cores,
        selection='Explicit Perk/SkillCore symbols or localized Skill Core labels; not proof that every record is obtainable.'))
    write('table-inventory.json', dict(build=args.build, tables=inventory, classes=dict(classes)))
    report = dict(schemaVersion=VERSION, build=args.build, database=db_path.name, databaseSha256=digest(db_path),
        extractionManifestSha256=fingerprint, integrityCheck=integrity, counts=counts, textCounts=text_count,
        limitations=['links are exact symbol matches, not validated combat semantics',
                    'client records can include unused/test/future content; presence does not prove availability',
                    'conditional icons require active trait/state information not inferred from a damage ID'])
    write('reference-index.json', report)
    print(json.dumps(report, ensure_ascii=True), flush=True)


if __name__ == '__main__':
    main()
