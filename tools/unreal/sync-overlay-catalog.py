"""Gera o catálogo offline do overlay com vínculos exatos do datamining."""
import argparse
import hashlib
import json
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
from PIL import Image, __version__ as pillow_version

p = argparse.ArgumentParser(description=__doc__)
p.add_argument('--build', required=True)
args = p.parse_args()
tool = Path(__file__).resolve().parent
repo = tool.parents[1]
root = tool/'exports'/args.build
reference = json.loads((root/'skill-reference.json').read_text(encoding='utf-8'))
catalog, copied, missing, jobs = {}, {}, [], {}
destination = repo/'src/assets/skills'
destination.mkdir(parents=True, exist_ok=True)
for row in reference['skills']:
    uid = row.get('skillId')
    if not isinstance(uid, int) or uid <= 0 or not (row.get('namePt') or row.get('nameEn')):
        continue
    assert str(uid) not in catalog, f'UID ambíguo: {uid}'
    icon, icon_file = row.get('iconPath'), None
    if icon and icon.startswith('/Game/Image/'):
        relative = icon[6:].split('.')[0]+'.png'
        source = root/'icons'/relative
        if source.is_file():
            icon_file = 'Local__'+str(Path(relative.removeprefix('Image/')).with_suffix('.webp')).replace('\\', '__').replace('/', '__')
            target = destination/icon_file
            jobs[icon_file] = (source, target, icon)
        else:
            missing.append(dict(uid=uid, icon=icon))
    catalog[str(uid)] = dict(name=row.get('namePt') or row['nameEn'], english=row.get('nameEn'),
        row=row['row'], iconFile=icon_file)

def encode(entry):
    file, (source, target, icon) = entry
    with Image.open(source) as image:
        image = image.convert('RGBA')
        image.thumbnail((128, 128), Image.Resampling.LANCZOS)
        image.save(target, format='WEBP', quality=90, method=4)
    return file, dict(source=icon, sourcePngSha256=hashlib.sha256(source.read_bytes()).hexdigest(),
        sha256=hashlib.sha256(target.read_bytes()).hexdigest(), bytes=target.stat().st_size)

with ThreadPoolExecutor(max_workers=4) as pool:
    copied = dict(pool.map(encode, jobs.items()))
output = repo/'src/data/overlayDataminedSkills.json'
output.write_text(json.dumps(catalog, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
report = dict(build=args.build, skills=len(catalog), icons=len(copied), missing=missing,
    appImageEncoding=dict(format='WebP',maxSize=128,quality=90,pillow=pillow_version),
    source='Local TLSkill UID + exact symbolic TLSkillPcLooks row + PT/EN locres', assets=copied)
(repo/'docs/overlay-datamined-sources.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps(dict(skills=len(catalog),icons=len(copied),missingIcons=len(missing)),ensure_ascii=True))
