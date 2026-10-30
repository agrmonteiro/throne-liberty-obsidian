"""Verifica integridade dos exports, SQLite, PNGs e vínculos conhecidos de IDs."""
import argparse
from collections import Counter
import hashlib
import json
from pathlib import Path
import sqlite3
import struct
import zlib


def read(path):
    return json.loads(path.read_text(encoding='utf-8-sig'))


def sha(path):
    with path.open('rb') as stream:
        return hashlib.file_digest(stream, 'sha256').hexdigest()


def png(path):
    data = path.read_bytes()
    assert data[:8] == b'\x89PNG\r\n\x1a\n', path
    offset, compressed = 8, bytearray()
    width = height = 0
    ended = False
    while offset < len(data):
        size = struct.unpack_from('>I', data, offset)[0]
        kind = data[offset+4:offset+8]
        payload = data[offset+8:offset+8+size]
        assert len(payload) == size, path
        assert zlib.crc32(kind+payload) & 0xffffffff == struct.unpack_from('>I', data, offset+8+size)[0], path
        if kind == b'IHDR':
            width, height, depth, color, _, _, _ = struct.unpack('>IIBBBBB', payload)
            assert depth == 8 and color == 6, path
        if kind == b'IDAT':
            compressed.extend(payload)
        if kind == b'IEND':
            ended = True
        offset += 12+size
    assert ended and offset == len(data), path
    assert len(zlib.decompress(compressed)) == height*(1+width*4), path
    return width, height


parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--build', required=True)
parser.add_argument('--root', type=Path)
args = parser.parse_args()
root = (args.root or Path(__file__).resolve().parent/'exports'/args.build).resolve()
index = read(root/'reference-index.json')
counts = Counter()
for report_name in ('tl-full-extraction.json', 'tl-icon-extraction.json'):
    report = read(root/report_name)
    for record in report['exports']:
        assert not record['error'], record
        outputs = record.get('outputs') or [dict(path=record['output'], sha256=record['sha256'])]
        for output in outputs:
            path = (root/output['path']).resolve()
            assert path.is_relative_to(root), path
            assert path.is_file(), path
            if output.get('sha256'):
                assert sha(path) == output['sha256'], path
            if path.suffix == '.png':
                assert png(path) == (record['width'], record['height']), path
                counts['png'] += 1
            counts['files'] += 1
    counts[report_name] = len(report['exports'])
db_path = root/index['database']
assert sha(db_path) == index['databaseSha256']
with sqlite3.connect(db_path.as_uri()+'?mode=ro', uri=True) as db:
    assert db.execute('PRAGMA integrity_check').fetchone()[0] == 'ok'
    for table in ('records', 'texts', 'source_strings', 'assets', 'links'):
        assert db.execute(f'SELECT count(*) FROM {table}').fetchone()[0] == index['counts'][table]
    assert db.execute("SELECT count(*) FROM records WHERE table_name='TLSkill'").fetchone()[0] == index['counts']['skills']
    if args.build == '26231302':
        assert db.execute("SELECT count(*) FROM records WHERE table_name='TLPerkOption'").fetchone()[0] == 305
expected = {968441375:'Serial Fire Bombs',968472498:'Frenzied Lightning Wave',968448884:'Judgment Lightning',
    968604762:'Serial Fire Bombs',968670316:'Serial Fire Bombs',967030853:'Corrupted Obliteration',
    967227745:'Corrupted Obliteration',968801679:'Frenzied Lightning Wave',966375907:'Corrupted Obliteration'}
catalog = read(root/'skill-reference.json')['skills']
if args.build != '26231302':
    expected = {}  # fixtures de IDs pertencem à build validada, não são identidade universal
for uid, name in expected.items():
    matches = [row for row in catalog if row['skillId'] == uid]
    assert len(matches) == 1 and matches[0]['nameEn'] == name and matches[0]['namePt'], (uid, matches)
if args.build == '26231302':
    assert next(row for row in catalog if row['skillId'] == 968448884)['iconPath'].endswith('S_WP_ST_PowerAttack_SP.S_WP_ST_PowerAttack_SP')
report = dict(build=args.build, status='passed', checks=dict(counts), knownIds=len(expected),
    sqliteIntegrity='ok', limitation='Checks confirm extraction integrity and exact static joins, not all server-side combat behavior.')
(root/'verification.json').write_text(json.dumps(report, indent=2)+'\n', encoding='utf-8')
print(json.dumps(report, ensure_ascii=True), flush=True)
