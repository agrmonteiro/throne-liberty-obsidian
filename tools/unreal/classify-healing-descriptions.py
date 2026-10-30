"""Classifica descrições PT/EN sem transformar texto em prova de cura medida."""
import argparse
from collections import Counter, defaultdict
import csv
from functools import lru_cache
import gzip
import html
import json
from pathlib import Path
import re
import sqlite3
import unicodedata

LABELS = {
    'direct_heal': 'Cura direta', 'periodic_heal': 'Cura periódica', 'lifesteal': 'Vampirismo',
    'health_regen': 'Regeneração de Vida', 'healing_modifier': 'Modificador de cura',
    'anti_heal': 'Redução de cura', 'shield': 'Escudo/barreira', 'revive': 'Ressurreição',
    'mana_recovery': 'Recuperação de Mana', 'health_cost': 'Consumo de Vida',
}
HEALING = {'direct_heal', 'periodic_heal', 'lifesteal', 'health_regen'}
FORMULA = re.compile(r'\$\[([A-Za-z0-9_]+)\.[^\]]+\]')


def plain(text):
    text = re.sub(r'\$\[[^\]]+\]', '[valor]', text or '')
    text = re.sub(r'\^?<[^>]*>', '', text)
    return re.sub(r'\s+', ' ', html.unescape(text)).strip()


def normalized(text):
    return ''.join(c for c in unicodedata.normalize('NFKD', plain(text).casefold()) if not unicodedata.combining(c))


def classify(texts, effect_groups=()):
    by_language = {}
    conditional = False
    for lang, value in texts.items():
        text = normalized(value)
        found = set()
        conditional |= bool(re.search(r'\b(if|when|while|upon|whenever|chance|se|quando|enquanto|caso)\b|\bao\s+(?:usar|utilizar|acertar|bloquear|curar|sofrer|receber|atingir|defender)\b', text))
        for clause in re.split(r'(?<=[.;])\s+|\n', text):
            hp = bool(re.search(r'\b(?:restor(?:e[sd]?|ing)|recover(?:s|ed|ing)?|restaura(?:m|r|ndo)?|recupera(?:m|r|ndo)?|regenera(?:m|r|ndo)?|regenerat(?:e[sd]?|ing))\b(?:(?!\b(?:mana|mp|dano|damage)\b).){0,75}\b(?:vida|health|hp|pv|saude)\b', clause)
                      or re.search(r'\bheals?\s+(?:(?:the|an?|all|nearby|party)\s+)*(?:target|allies|ally|members|you|self|yourself)\b', clause)
                      or re.search(r'(?:^|,\s*|\b(?:e|agora|tambem)\s+)cura(?:m)?\b.{0,65}\b(?:aliad\w*|alvo|vida)\b|\b(?:se cura|cura continuamente|continuously heals?|heals? continuously)\b', clause))
            periodic = bool(re.search(r'\b(?:por segundo|por seg|per sec(?:ond)?|over time|ao longo do tempo|healing over time|cura (?:continua|periodica))\b|\b(?:a cada|every)\s+(?:\[valor\]|[\d.,]+)\s*(?:s\b|sec|segundo)', clause))
            steal = hp and bool(re.search(r'\b(?:vampirismo|lifesteal|life.?steal|life.?leech|roubo de vida)\b|\b(?:drena|drains?)\b.{0,30}\b(?:vida|health)\b|%\s*(?:of|dos?|de)\s+(?:(?:your|the|seus?|acertos?|melee|ranged|magic|corpo a corpo|criticos?|critical)\s+)*(?:hits?|damage (?:dealt|taken)|dano(?:\s+\w+){0,2}\s+(?:causado|infligido|sofrido)|acertos? criticos?)\b', clause))
            if hp:
                if steal:
                    found.add('lifesteal')
                elif periodic:
                    found.add('periodic_heal')
                    if re.search(r'\b(?:instant\w*|imediat\w*)\b', clause):
                        found.add('direct_heal')
                else:
                    found.add('direct_heal')
            regen = bool(re.search(r'\b(?:regeneracao (?:de|da) vida|health regen(?:eration)?|regeneracao de saude)\b', clause))
            negative_regen = regen and bool(re.search(r'\b(?:reduz\w*|diminui\w*|reduces?|decreases?)\b.{0,60}(?:regeneracao|health regen)', clause))
            if regen:
                found.add('anti_heal' if negative_regen else 'health_regen')
            if re.search(r'\b(?:aument\w*|ampli\w*|reduz\w*|diminui\w*|increases?|decreases?|reduces?|boosts?|improves?)\b.{0,70}\b(?:cura|curas|healing)\b|\b(?:cura|healing)\b.{0,35}\b(?:aumentad\w*|amplificad\w*|increased|boosted)\b', clause):
                found.add('healing_modifier')
            if re.search(r'\b(?:reduz\w*|diminui\w*|reduces?|decreases?)\b.{0,65}(?:cura recebida|incoming healing|healing received|healing effects on (?:the target|enemies))', clause):
                found.add('anti_heal')
            if re.search(r'\b(?:concede\w*|cria\w*|gera\w*|aplica\w*|ergue\w*|ganha\w*|grants?|creates?|generates?|gives?|gains?|forms?)\b.{0,75}\b(?:escudo|barreira|shield|barrier)\b', clause):
                found.add('shield')
            if re.search(r'\b(?:ressuscita\w*|revives?|resurrects?)\b', clause) and not re.search(r'\b(?:nao|cannot|not)\b.{0,25}\b(?:ressuscita\w*|reviv\w*|resurrect\w*)\b', clause):
                found.add('revive')
            if re.search(r'\b(?:restor\w*|recover\w*|restaur\w*|recuper\w*|regener\w*|aument\w*|increas\w*)\b.{0,65}\b(?:mana|mp)\b|\bmana regen\w*\b', clause):
                found.add('mana_recovery')
            if re.search(r'\b(?:consom\w*|consum\w*|sacrific\w*|spends?)\b.{0,45}\b(?:vida|health|hp)\b|\b(?:cost|custo)\b.{0,20}\b(?:health|vida|hp)\b', clause):
                found.add('health_cost')
        by_language[lang] = sorted(found)
    categories = set().union(*(set(value) for value in by_language.values()))
    # Fórmulas referenciadas ajudam a desambiguar cura direta genérica de cura contínua.
    if 'direct_heal' in categories and 'Instant_Heal' not in effect_groups and any(group in effect_groups for group in ('Continuous_Heal', 'Intervallic_Heal')):
        categories.discard('direct_heal'); categories.add('periodic_heal')
    agreed = set(by_language.get('pt', [])) & set(by_language.get('en', []))
    return dict(categories=sorted(categories), byLanguage=by_language, conditional=conditional,
                evidence='description-and-effect' if effect_groups and categories & HEALING else 'description-only',
                agreement='pt-en' if agreed else 'single-language-or-review', producesHealing=bool(categories & HEALING))


def ftexts(value, path='', rank=None):
    if isinstance(value, dict):
        if value.get('Key') and value.get('TableId'):
            yield path, value, rank
        else:
            if isinstance(value.get('Key'), str) and value['Key'].startswith('ETLSkillOptionRank::'):
                rank = value['Key'].split('::')[-1]
            for key, item in value.items():
                yield from ftexts(item, f'{path}.{key}' if path else key, rank)
    elif isinstance(value, list):
        for index, item in enumerate(value):
            yield from ftexts(item, f'{path}[{index}]', rank)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--build', required=True)
    args = parser.parse_args()
    repo = Path(__file__).resolve().parents[2]
    root = repo/'tools/unreal/exports'/args.build
    index = json.loads((root/'reference-index.json').read_text(encoding='utf-8'))
    db = sqlite3.connect((root/index['database']).as_uri()+'?mode=ro', uri=True)
    namespaces = dict(db.execute('SELECT DISTINCT table_name,namespace FROM source_strings'))
    skill_uids = {row: uid for row, uid in db.execute("SELECT row_key,uid FROM records WHERE table_name='TLSkill'")}
    effects = defaultdict(list)
    for row, uid, payload in db.execute("SELECT row_key,uid,payload FROM records WHERE table_name='TLEffectProperty' AND json_extract(payload,'$.Group') IN ('EEffectGroup::Continuous_Heal','EEffectGroup::Intervallic_Heal','EEffectGroup::Instant_Heal')"):
        value = json.loads(payload)
        effects[value.get('formula_parameter')].append(dict(uid=uid, row=row, group=value['Group'].split('::')[-1]))

    @lru_cache(maxsize=None)
    def translated(lang, namespace, key):
        result = db.execute('SELECT text FROM texts WHERE lang=? AND namespace=? AND key=?', (lang, namespace, key)).fetchone()
        return result[0] if result else None

    records, missing = [], Counter()
    for table, row, name_pt, name_en, payload in db.execute("SELECT table_name,row_key,name_pt,name_en,payload FROM records WHERE table_name LIKE 'TLSkillPcLooks%' ORDER BY table_name,row_key"):
        data = json.loads(payload)
        descriptions = []
        for field, ref, rank in ftexts(data):
            if not any(part in field for part in ('RankDescription', 'UIDescription', 'SkillTraitDescription')):
                continue
            asset = ref['TableId'].split('/')[-1].split('.')[0]
            namespace = namespaces.get(asset, ref.get('Namespace', asset))
            texts = {}
            for lang in ('pt', 'en'):
                text = translated(lang, namespace, ref['Key'])
                if text:
                    texts[lang] = text
                else:
                    missing[lang] += 1
            if not texts:
                continue
            formulas = sorted(set(formula for text in texts.values() for formula in FORMULA.findall(text)))
            related = {item['uid']: item for formula in formulas for item in effects.get(formula, [])}
            scope = 'trait' if row.startswith('SkillSet_') or 'BySkillTrait' in field else 'state' if 'ByAbnormalState' in field else 'base'
            descriptions.append(dict(field=field, scope=scope, rank=rank, reference=dict(table=asset, namespace=namespace, key=ref['Key']),
                text={lang: plain(text) for lang, text in texts.items()}, formulas=formulas, effectEvidence=list(related.values()),
                classification=classify(texts, {item['group'] for item in related.values()})))
        categories = sorted({kind for desc in descriptions for kind in desc['classification']['categories']})
        base = sorted({kind for desc in descriptions if desc['scope'] == 'base' for kind in desc['classification']['categories']})
        trait = re.match(r'SkillSet_(.+)_Trait_\d+', row)
        records.append(dict(table=table, row=row, skillId=skill_uids.get(row), namePt=name_pt, nameEn=name_en,
            scope='trait' if row.startswith('SkillSet_') else 'skill', parentSymbolCandidate=trait[1] if trait else None,
            baseCategories=base, categories=categories, descriptions=descriptions,
            producesHealing=bool(set(categories) & HEALING)))
    db.close()
    described_symbols = {row['row'] for row in records if row['descriptions']}
    skill_coverage = [dict(row=row, skillId=uid, hasTranslatedDescription=row in described_symbols)
                      for row, uid in sorted(skill_uids.items())]
    counts = Counter(kind for row in records for kind in row['categories'])
    summary = dict(build=args.build, schemaVersion=1, records=len(records), withDescription=sum(bool(r['descriptions']) for r in records),
        relatedRecords=sum(bool(r['categories']) for r in records), healingCandidates=sum(r['producesHealing'] for r in records),
        healingCandidatesWithId=len({r['skillId'] for r in records if r['producesHealing'] and r['skillId'] is not None}),
        recordsWithEffectReference=sum(any(d['effectEvidence'] for d in r['descriptions']) for r in records),
        withNumericSkillId=sum(r['skillId'] is not None for r in records), skillRecords=len(skill_coverage),
        skillRecordsWithDescription=sum(r['hasTranslatedDescription'] for r in skill_coverage), categoryCounts=dict(counts), missingTranslations=dict(missing))
    result = dict(summary=summary, labels=LABELS, limitations=[
        'Description classification is heuristic and does not validate packet amounts or server behavior.',
        'Rank, specialization and state descriptions remain separate; parentSymbolCandidate is only a naming hint.',
        'Missing descriptions remain unclassified; support modifiers, mana and shields are not healing totals.',
        'Records may contain unused or test content; counts refer to client records, not unique obtainable abilities.'], records=records, skillCoverage=skill_coverage)
    local = root/'healing-description-classification.json'
    local.write_text(json.dumps(result, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
    snapshot = repo/'reference/datamine'/args.build/'healing-descriptions.json.gz'
    snapshot.parent.mkdir(parents=True, exist_ok=True)
    snapshot.write_bytes(gzip.compress(json.dumps(result, ensure_ascii=False, separators=(',', ':')).encode(), mtime=0))
    out = repo/'docs/healing-classification'/args.build
    out.mkdir(parents=True, exist_ok=True)
    (out/'summary.json').write_text(json.dumps(summary, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
    with (out/'skills.csv').open('w', encoding='utf-8-sig', newline='') as stream:
        writer = csv.writer(stream, delimiter=';')
        writer.writerow(['ID', 'Nome PT', 'Nome EN', 'Escopo', 'Categorias', 'Produz cura candidata', 'Base metodológica', 'Condições no texto', 'Tabela', 'Linha', 'Parente por símbolo (candidato)', 'Descrição PT', 'Descrição EN', 'Efeitos referenciados'])
        for row in records:
            if not row['categories']:
                continue
            writer.writerow([row['skillId'], row['namePt'], row['nameEn'], row['scope'], ' | '.join(LABELS[k] for k in row['categories']), 'Sim' if row['producesHealing'] else 'Não',
                'Texto com referência de efeito' if any(d['effectEvidence'] for d in row['descriptions']) else 'Texto', 'Sim' if any(d['classification']['conditional'] for d in row['descriptions']) else 'Não', row['table'], row['row'], row['parentSymbolCandidate'],
                '\n'.join(dict.fromkeys(f"[{d['scope']}/{d['rank'] or 'sem rank'}] {d['text'].get('pt', '')}" for d in row['descriptions'])), '\n'.join(dict.fromkeys(f"[{d['scope']}/{d['rank'] or 'no rank'}] {d['text'].get('en', '')}" for d in row['descriptions'])),
                ' | '.join(sorted({str(e['uid'])+':'+e['group'] for d in row['descriptions'] for e in d['effectEvidence']}))])
    compact = {}
    for row in records:
        if row['skillId'] is None or not row['baseCategories']:
            continue
        key = str(row['skillId'])
        entry = dict(categories=row['baseCategories'], description=next((d['text'].get('pt') or d['text'].get('en') for d in row['descriptions'] if d['scope'] == 'base'), ''),
                     conditional=any(d['classification']['conditional'] for d in row['descriptions']))
        if key in compact and compact[key] != entry:
            compact[key] = dict(categories=[], description='', conditional=True, review=True)
        else:
            compact[key] = entry
    (repo/'src/data/overlayHealingSkillClasses.json').write_text(json.dumps(dict(build=args.build, labels=LABELS, skills=compact), ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
    report = ['# Classificação das descrições de cura', '', f'Build: {args.build}. Texto PT/EN do cliente, sem validação adicional de valores em combate.', '',
        f"Analisados {summary['records']} registros de apresentação; {summary['withDescription']} com descrição traduzida. {summary['healingCandidates']} candidatos a cura/regeneração. Contagens incluem variantes e especializações.", '',
        '| Categoria | Registros |', '| --- | ---: |']
    report += [f'| {LABELS[key]} | {counts[key]} |' for key in LABELS]
    examples = {row['row']: row for row in records}
    report += ['', '## Exemplos conferidos', '', '| Registro | Classificação pela descrição |', '| --- | --- |']
    for symbol in ('WP_BO_S_RegenHeal', 'WP_WA_GR_S_Heal', 'WP_DA_Mastery_Normal_Assist', 'WP_BO_S_RegenAura_Hero', 'SkillSet_WP_BO_S_RegenAura_Trait_1'):
        row = examples.get(symbol)
        if row:
            report.append(f"| {row['namePt'] or symbol} ({row['skillId'] or 'especialização sem UID de habilidade'}) | {', '.join(LABELS[k] for k in row['categories'])} |")
    report += ['', 'Bênção da Natureza permanece regeneração na descrição base. Vigoroso descreve cura periódica enquanto Bênção da Natureza e Toque de Cura estão ativos juntos; essa condição não é fundida à base.', '',
        f"A cobertura também registra as {len(skill_coverage)} linhas de TLSkill: {summary['skillRecordsWithDescription']} têm descrição traduzida associada por símbolo exato. As demais permanecem sem classificação textual."]
    report += ['', 'As categorias podem se sobrepor. Modificadores, redução de cura, escudos, mana e consumo de Vida são classes separadas; não geram totais de cura por si só.', '',
        'Consulte `skills.csv` para nomes, IDs, textos e vínculos. O snapshot completo preserva também os registros sem classificação em `reference/datamine/'+args.build+'/healing-descriptions.json.gz`.', '',
        'Classificação baseada em texto é candidata. Só os vínculos de fórmula apresentados são exatos; isso não comprova a especialização ativa nem o comportamento do servidor.']
    (out/'README.md').write_text('\n'.join(report)+'\n', encoding='utf-8')
    print(json.dumps(summary, ensure_ascii=True))


if __name__ == '__main__':
    main()
