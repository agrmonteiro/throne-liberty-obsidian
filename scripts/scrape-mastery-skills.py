"""
scrape-mastery-skills.py
========================
Re-coleta somente os nós _Skill de WeaponMastery, que ficaram com description vazia
no scraper original (pois ele usava ?level=10, mas _Skill nodes não têm nível).

Extrai a description completa — que cita o nome da skill-alvo que é modificada —
e grava um campo extra `linkedSkillName` para futura vinculação com skills.ts.

Uso:
    python scripts/scrape-mastery-skills.py [--dry-run]

Saída:
    src/data/weaponMasteries.ts  (descriptions + linkedSkillName atualizados)
    scripts/mastery-skills-result.json  (raw para inspeção)
"""
from __future__ import annotations

import argparse
import io
import json
import re
import sys
import time
from pathlib import Path

if hasattr(sys.stdout, 'buffer'):
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace', line_buffering=True)
if hasattr(sys.stderr, 'buffer'):
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace', line_buffering=True)

import os as _os
_appdata = _os.environ.get('APPDATA') or _os.path.expanduser('~')
_browsers_dir = _os.environ.get('PLAYWRIGHT_BROWSERS_PATH') or _os.path.join(_appdata, 'tier2-command-lab', 'playwright-browsers')
_os.makedirs(_browsers_dir, exist_ok=True)
_os.environ['PLAYWRIGHT_BROWSERS_PATH'] = _browsers_dir

from playwright.sync_api import sync_playwright, Page, TimeoutError as PWTimeout

# ─── Config ───────────────────────────────────────────────────────────────────

BASE    = "https://questlog.gg/throne-and-liberty"
LOCALES = ["en", "pt"]
DELAY   = 0.8

ROOT    = Path(__file__).resolve().parent.parent
SRC_TS  = ROOT / "src" / "data" / "weaponMasteries.ts"
OUT_JSON = Path(__file__).resolve().parent / "mastery-skills-result.json"

def log(msg: str) -> None:
    print(f"[mastery-skills] {msg}", flush=True)

def clean(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip()

# ─── Extrai IDs _Skill do weaponMasteries.ts ─────────────────────────────────

def extract_skill_ids() -> list[str]:
    text = SRC_TS.read_text("utf-8")
    return re.findall(r'id:\s*"([^"]+_Skill)"', text)

# ─── Scraping ─────────────────────────────────────────────────────────────────

def get_page_text(page: Page, url: str) -> str:
    try:
        page.goto(url, timeout=25000, wait_until="domcontentloaded")
        page.wait_for_selector("main", timeout=20000)
        time.sleep(DELAY)
        return page.inner_text("main") or ""
    except PWTimeout:
        log(f"  TIMEOUT: {url}")
        return ""
    except Exception as e:
        log(f"  ERRO: {url} → {e}")
        return ""

def extract_name_from_title(page: Page) -> str:
    try:
        title = page.title()
        if " | questlog" in title:
            title = title[:title.index(" | questlog")]
        for suffix in [
            " - Weapon Specialization", " - Especialização de Arma",
        ]:
            if title.endswith(suffix):
                return title[:-len(suffix)].strip()
        parts = title.rsplit(" - ", 1)
        return parts[0].strip() if len(parts) > 1 else title.strip()
    except Exception:
        return ""

# Padrões que indicam ruído de UI (não são descrição real)
_NOISE = re.compile(
    r"^(Level|Nível|Lv\.|Nv\.|Back|Voltar|Needed|Desbloqueado|Unlock|Comments|Comentários|\d+\s*/\s*\d+)",
    re.IGNORECASE,
)

def parse_description(lines: list[str]) -> str:
    """
    Para nós _Skill a descrição costuma ser a linha mais longa que:
    - tem mais de 20 chars
    - não é ruído de UI
    - menciona uma skill (tem letra maiúscula no meio, ou aspas, ou 'skill' / 'ability')
    Tenta várias heurísticas.
    """
    candidates = [
        l for l in lines
        if len(l) > 20
        and not _NOISE.match(l)
        and not re.search(r"^\d+x?$", l)
    ]

    # Prioridade: linhas que mencionam aspas (nome da skill) ou palavras-chave
    priority_re = re.compile(r'["“”]|skill|ability|habilidade|activ|replac|substitui|modifica|altera', re.IGNORECASE)
    priority = [c for c in candidates if priority_re.search(c)]
    if priority:
        return max(priority, key=len)

    # Fallback: linha mais longa entre os candidatos
    return max(candidates, key=len) if candidates else ""

def extract_linked_skill_name(description: str) -> str:
    """
    Tenta extrair o nome da skill citada na descrição.
    Padrões esperados (questlog):
      - "... 'Arrow Storm' ..."
      - '... "Arrow Storm" ...'
      - "... Arrow Storm skill ..."
      - "... changes Arrow Storm ..."
    """
    # Aspas simples ou duplas
    m = re.search(r'["“‘]([^"”’]+)["”’]', description)
    if m:
        return m.group(1).strip()

    # "changes/replaces/modifies/activates X" — X até fim ou vírgula
    m = re.search(
        r'(?:changes?|replac(?:es?|ing)|modif(?:ies|y|ied)|activates?|substitui|altera)\s+([A-Z][^,\.]+)',
        description, re.IGNORECASE
    )
    if m:
        return m.group(1).strip()

    return ""

def scrape_skill_node(page: Page, mastery_id: str) -> dict:
    result: dict = {"id": mastery_id}
    for locale in LOCALES:
        # _Skill nodes: sem ?level=
        url = f"{BASE}/{locale}/db/weapon-specialization/{mastery_id}"
        log(f"  [{locale}] {url}")
        text = get_page_text(page, url)
        name = extract_name_from_title(page)
        lines = [clean(l) for l in text.splitlines() if clean(l)]
        description = parse_description(lines)

        if locale == "en":
            result["nameEn"]          = name
            result["descriptionEn"]   = description
            result["linkedSkillName"] = extract_linked_skill_name(description)
            result["rawLines"]        = lines[:30]  # debug
        else:
            result["namePt"]        = name
            result["descriptionPt"] = description

    return result

# ─── Patch weaponMasteries.ts ─────────────────────────────────────────────────

def patch_mastery_ts(results: list[dict]) -> None:
    text = SRC_TS.read_text("utf-8")
    patched = 0

    for r in results:
        mid   = r["id"]
        desc_en = r.get("descriptionEn", "")
        desc_pt = r.get("descriptionPt", "")
        linked  = r.get("linkedSkillName", "")

        if not desc_en and not desc_pt:
            log(f"  SKIP (sem desc): {mid}")
            continue

        # Localiza o bloco do ID no arquivo
        id_pat = re.compile(
            rf'(id:\s*"{re.escape(mid)}"[\s\S]*?description:\s*\{{\s*en:\s*)"[^"]*"(\s*,\s*pt:\s*)"[^"]*"'
        )
        def replacer(m):
            return (
                m.group(1) + json.dumps(desc_en, ensure_ascii=False)
                + m.group(2) + json.dumps(desc_pt, ensure_ascii=False)
            )
        new_text, count = id_pat.subn(replacer, text)
        if count:
            text = new_text
            patched += 1
            log(f"  ✓ {mid}: {desc_en[:80]}")

            # Injeta linkedSkillName após description se tiver
            if linked:
                link_pat = re.compile(
                    rf'(id:\s*"{re.escape(mid)}"[\s\S]*?description:\s*\{{[^}}]+\}},?)'
                )
                def inject_link(m):
                    block = m.group(1)
                    if "linkedSkillName" in block:
                        return block
                    return block.rstrip(",") + f',\n    linkedSkillName: {json.dumps(linked, ensure_ascii=False)}'
                text = link_pat.sub(inject_link, text, count=1)
        else:
            log(f"  MISS (regex não casou): {mid}")

    SRC_TS.write_text(text, "utf-8")
    log(f"\n✓ {patched}/{len(results)} nós atualizados em weaponMasteries.ts")

# ─── Main ─────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true", help="Apenas imprime, não grava")
    args = parser.parse_args()

    ids = extract_skill_ids()
    log(f"Nós _Skill encontrados: {len(ids)}")

    results: list[dict] = []

    with sync_playwright() as pw:
        browser = pw.chromium.launch(headless=True)
        page    = browser.new_page()
        page.set_extra_http_headers({"Accept-Language": "en-US,en;q=0.9"})

        for i, mid in enumerate(ids):
            log(f"\n[{i+1}/{len(ids)}] {mid}")
            data = scrape_skill_node(page, mid)
            results.append(data)

        browser.close()

    # Salva JSON de resultados
    OUT_JSON.write_text(json.dumps(results, ensure_ascii=False, indent=2), "utf-8")
    log(f"\nResultados salvos em {OUT_JSON}")

    # Exibe resumo
    with_desc  = [r for r in results if r.get("descriptionEn")]
    with_link  = [r for r in results if r.get("linkedSkillName")]
    log(f"Com descrição: {len(with_desc)}/{len(results)}")
    log(f"Com skill-alvo extraída: {len(with_link)}/{len(results)}")
    if with_link:
        log("\nVínculos encontrados:")
        for r in with_link:
            log(f"  {r['id']} → '{r['linkedSkillName']}'")

    if not args.dry_run:
        patch_mastery_ts(results)

if __name__ == "__main__":
    main()
