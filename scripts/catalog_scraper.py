"""
catalog_scraper.py
==================
Scraper do catálogo de skills, enhancements e weapon masteries do questlog.gg.

Coleta dados nas versões /en/ e /pt/ e gera arquivos TypeScript em src/data/.

Dependências: `playwright` (pip install playwright && playwright install chromium)

Uso:
    python scripts/catalog_scraper.py [--out <pasta_src_data>] [--skip-skills] [--skip-enhancements] [--skip-masteries]

Saída:
    <out>/skills.ts
    <out>/skillEnhancements.ts
    <out>/weaponMasteries.ts
    <out>/catalog.ts
"""
from __future__ import annotations

import argparse
import io
import json
import re
import sys
import time
from pathlib import Path
from typing import Any

# ─── UTF-8 stdout/stderr (PyInstaller / Windows cp1252) ──────────────────────
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

# ─── Constantes ───────────────────────────────────────────────────────────────

BASE = "https://questlog.gg/throne-and-liberty"
LOCALES = ["en", "pt"]
DELAY = 0.8   # segundos entre requests para não sobrecarregar o servidor

# Nível máximo consultado por tipo
SKILL_LEVEL = 15
MASTERY_LEVEL = 10

# Pasta de saída padrão: scripts/ está em throne_and_liberty_node/scripts/
DEFAULT_OUT = Path(__file__).resolve().parent.parent / "src" / "data"

# Cache intermediário para retomar scraping interrompido
CACHE_FILE = Path(__file__).resolve().parent / "catalog_cache.json"

# ─── Helpers ─────────────────────────────────────────────────────────────────

def log(msg: str) -> None:
    print(f"[catalog] {msg}", flush=True)

def warn(msg: str) -> None:
    print(f"[catalog] WARN: {msg}", file=sys.stderr, flush=True)

def clean(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip()

def load_cache() -> dict:
    if CACHE_FILE.exists():
        try:
            return json.loads(CACHE_FILE.read_text("utf-8"))
        except Exception:
            pass
    return {}

def save_cache(data: dict) -> None:
    CACHE_FILE.write_text(json.dumps(data, ensure_ascii=False, indent=2), "utf-8")

def get_page_text(page: Page, url: str, wait_selector: str = "main", timeout: int = 20000) -> str:
    """Navega para a URL e retorna o texto visível da página."""
    try:
        page.goto(url, timeout=timeout, wait_until="domcontentloaded")
        page.wait_for_selector(wait_selector, timeout=timeout)
        time.sleep(DELAY)
        return page.inner_text("main") or ""
    except PWTimeout:
        warn(f"timeout em {url}")
        return ""
    except Exception as e:
        warn(f"erro em {url}: {e}")
        return ""

def extract_name_from_title(page: Page) -> str:
    """Extrai o nome do item a partir do <title> da página.
    Formato: "Nome Do Item - Tipo | questlog.gg"
    """
    try:
        title = page.title()
        if " | questlog" in title:
            title = title[:title.index(" | questlog")]
        for suffix in [
            " - Weapon Specialization", " - Skill Enhancement",
            " - Skill Set", " - Especialização de Arma",
            " - Melhoria de Habilidade", " - Conjunto de Habilidades",
        ]:
            if title.endswith(suffix):
                return title[:-len(suffix)].strip()
        # Fallback: remove último segmento após " - "
        parts = title.rsplit(" - ", 1)
        return parts[0].strip() if len(parts) > 1 else title.strip()
    except Exception:
        return ""

# ─── LISTA: descobrir todos os IDs ───────────────────────────────────────────

def scrape_list_ids(page: Page, type_slug: str) -> list[dict]:
    """Busca IDs em uma página de listagem, percorrendo a paginação (?page=X)."""
    all_items = []
    seen_ids: set[str] = set()
    current_page = 1
    
    while True:
        base_url = f"https://questlog.gg/throne-and-liberty/en/db/{type_slug}"
        url = f"{base_url}?page={current_page}"
        log(f"  Página {current_page}: {url}")
        
        try:
            # wait_until="networkidle" garante que as requisições AJAX de dados terminaram
            page.goto(url, timeout=30000, wait_until="networkidle")
            page.wait_for_selector("tr", timeout=15000)
            time.sleep(1.5) # Tempo extra para o JS renderizar os links
        except PWTimeout:
            log(f"    Fim das páginas ou timeout na pág {current_page}")
            break


        # Coleta links de detalhes
        links = page.query_selector_all(f"a[href*='/db/skill-set/'], a[href*='/db/skill-trait/'], a[href*='/db/weapon-specialization/']")
        
        page_items = []
        for link in links:
            href = link.get_attribute("href") or ""
            m = re.search(r"/db/(?:skill-set|skill-trait|weapon-specialization)/([^/?#]+)", href)
            if not m: continue
            
            item_id = m.group(1)
            if item_id in seen_ids: continue
            
            seen_ids.add(item_id)
            row_text = clean(link.inner_text())
            page_items.append({"id": item_id, "rowText": row_text})

        if not page_items:
            log(f"    Nenhum item novo encontrado na página {current_page}")
            break
            
        all_items.extend(page_items)
        current_page += 1
        if current_page > 30: break # Segurança
        
    log(f"  → Total de {len(all_items)} IDs encontrados")
    return all_items


# ─── DETALHE: skills ──────────────────────────────────────────────────────────

def parse_skill_detail(text: str, locale: str, skill_id: str) -> dict:
    """Parseia o texto da página de detalhe de skill (level 15)."""
    lines = [clean(l) for l in text.splitlines() if clean(l)]
    result: dict[str, Any] = {
        "id": skill_id,
        "name": "",
        "weapon": "",
        "grade": "",
        "type": "",
        "cooldownSec": None,
        "manaCost": None,
        "skillType": "",
        "useFormat": "",
        "description": "",
        "enhancementIds": [],
    }

    # Nome: linha que contém "Lv. 15" ou o título do card
    for i, line in enumerate(lines):
        if "Lv. 15" in line or "Nv. 15" in line:
            result["name"] = re.sub(r"\s*Lv\.\s*15|\s*Nv\.\s*15", "", line).strip()
            break
    if not result["name"] and len(lines) > 2:
        # Fallback para o nome (geralmente linha 3 ou 4)
        for line in lines[:6]:
            if len(line) > 3 and not any(x in line.lower() for x in ["voltar", "habilidade", "set"]):
                result["name"] = line
                break

    # Weapon / Grade / Type
    grade_words = {"Epic", "Rare", "Uncommon", "Common", "Épico", "Raro", "Incomum", "Comum"}
    type_words = {"Active", "Passive", "Defensive", "Ativo", "Passivo", "Defensivo", "Activa", "Ativa"}
    weapons = {"Longbow", "Crossbow", "Staff", "Wand & Tome", "Dagger", "Spear",
               "Sword & Shield", "Greatsword", "Orb", "Arco Longo", "Besta", "Cajado",
               "Varinha e Tomo", "Adaga", "Lança", "Espada e Escudo", "Espadão", "Orbe", "Espada"}

    for line in lines[:15]:
        if line in grade_words: result["grade"] = line
        if line in type_words: result["type"] = line.lower()
        if line in weapons: result["weapon"] = line

    # Campos estruturados
    def find_val(pattern_en: str, pattern_pt: str) -> str:
        m = re.search(pattern_en + r"\s*[:\-]?\s*(.+)", text, re.IGNORECASE)
        if not m: m = re.search(pattern_pt + r"\s*[:\-]?\s*(.+)", text, re.IGNORECASE)
        if m and m.group(1):
            val = m.group(1).strip().split("\n")[0]
            return val
        return ""


    cd_str = find_val("Cooldown", "Recarga|Tempo de Recarga")
    if cd_str:
        cd_m = re.search(r"(\d+(?:[.,]\d+)?)", cd_str)
        if cd_m: result["cooldownSec"] = float(cd_m.group(1).replace(",", "."))

    mana_str = find_val("Mana Cost", "Custo de mana")
    if mana_str:
        mana_m = re.search(r"(\d+)", mana_str)
        if mana_m: result["manaCost"] = int(mana_m.group(1))

    result["skillType"] = find_val("Skill Type", "Tipo de Habilidade")
    result["useFormat"] = find_val("Use Format", "Formato de Uso|Utilizar formato")

    # Descrição
    desc_lines = []
    stop_labels = {
        "Unlocked at", "Desbloqueado em", "Unlocked at level", "Desbloqueado no nível",
        "Skill has Traits", "Habilidade possui Traços", "Comments", "Comentários",
        "Skill Specialization", "Especialização de Habilidade", "Skill Required Traits",
        "Habilidade Requer Traços", "Habilidade possui características", "Características Necessárias",
        "Especializações de Habilidade"
    }
    
    # Heurística: a descrição vem após o seletor de nível (1..15) e dos campos estruturados.
    # Vamos usar o "Use Format" como âncora de início se possível.
    anchor_idx = -1
    for i, line in enumerate(lines):
        if any(lbl.lower() in line.lower() for lbl in ["use format", "formato de uso", "utilizar formato"]):
            anchor_idx = i
            break
    
    # Se não achou âncora, tenta o seletor de nível
    if anchor_idx == -1:
        for i, line in enumerate(lines):
            if line == "15" and i > 0 and lines[i-1] == "14":
                anchor_idx = i
                break

    if anchor_idx != -1:
        for line in lines[anchor_idx+1:]:
            # Ignora o próprio valor do anchor se estiver na mesma linha ou logo após
            if any(x in line.lower() for x in ["active", "passive", "activa", "ativa"]):
                if len(line) < 10: continue

            # Ignora labels estruturados e números de nível
            if re.fullmatch(r"\d+", line) and int(line) <= 15: continue
            
            lower_line = line.lower()
            if any(lbl.lower() in lower_line for lbl in [
                "cooldown", "recarga", "mana cost", "custo de mana", 
                "skill type", "tipo de habilidade", "use format", "formato de uso", "utilizar formato",
                "level 15", "nível 15", "lv. 15", "nv. 15"
            ]) and len(line) < 30:
                continue

            if any(stop.lower() in lower_line for stop in stop_labels):
                break
            
            desc_lines.append(line)

    # Se falhou, fallback para o modo antigo (len > 50) mas filtrando headers
    if not desc_lines:
        in_desc = False
        for line in lines:
            if len(line) > 50 and not any(lbl.lower() in line.lower() for lbl in ["level", "nível", "habilidade"]):
                in_desc = True
            if in_desc:
                if any(stop.lower() in line.lower() for stop in stop_labels): break
                desc_lines.append(line)

    result["description"] = "\n".join(desc_lines).strip()
    return result




def scrape_skill_detail(page: Page, skill_id: str) -> dict | None:
    """Busca detalhe de skill em /en/ e /pt/, retorna objeto bilíngue."""
    data: dict[str, Any] = {"id": skill_id, "enhancementIds": []}

    for locale in LOCALES:
        url = f"{BASE}/{locale}/db/skill-set/{skill_id}?level={SKILL_LEVEL}"
        text = get_page_text(page, url)
        if not text:
            continue
        parsed = parse_skill_detail(text, locale, skill_id)

        if locale == "en":
            data["nameEn"] = parsed["name"]
            data["weapon"] = parsed["weapon"]
            data["grade"] = parsed["grade"]
            data["type"] = parsed["type"]
            data["cooldownSec"] = parsed["cooldownSec"]
            data["manaCost"] = parsed["manaCost"]
            data["skillTypeEn"] = parsed["skillType"]
            data["useFormatEn"] = parsed["useFormat"]
            data["descriptionEn"] = parsed["description"]
        else:
            data["namePt"] = parsed["name"]
            data["skillTypePt"] = parsed["skillType"]
            data["useFormatPt"] = parsed["useFormat"]
            data["descriptionPt"] = parsed["description"]

        # Coleta IDs de enhancements do tab "Skill has Traits"
        if locale == "en":
            enhancement_links = page.query_selector_all(
                "a[href*='/db/skill-trait/']"
            )
            for lnk in enhancement_links:
                href = lnk.get_attribute("href") or ""
                m = re.search(r"/db/skill-trait/([^/?#]+)", href)
                if m and m.group(1) not in data["enhancementIds"]:
                    data["enhancementIds"].append(m.group(1))

    return data if "nameEn" in data else None


# ─── DETALHE: skill enhancements ─────────────────────────────────────────────

def parse_enhancement_detail(text: str, enhancement_id: str) -> dict:
    lines = [clean(l) for l in text.splitlines() if clean(l)]
    result: dict[str, Any] = {
        "id": enhancement_id,
        "name": "",
        "baseSkillName": "",
        "grade": "",
        "effect": "",
        "unlockLevel": None,
        "requiredPoints": None,
        "description": "",
    }

    grade_words = {"Epic", "Rare", "Uncommon", "Common", "Épico", "Raro", "Incomum", "Comum"}
    for line in lines[:8]:
        if line in grade_words:
            result["grade"] = line
        if "Skill Enhancement" in line or "Melhoria de Habilidade" in line:
            continue

    # Nome: linha logo antes ou logo após "Skill Enhancement"
    for i, line in enumerate(lines):
        if "Skill Enhancement" in line or "Melhoria de Habilidade" in line:
            if i > 0:
                result["name"] = lines[i - 1]
            break

    # Base Skill
    base_m = re.search(r"Base Skill\s*[:\-]?\s*(.+)", text, re.IGNORECASE)
    if not base_m:
        base_m = re.search(r"Habilidade Base\s*[:\-]?\s*(.+)", text, re.IGNORECASE)
    if base_m:
        result["baseSkillName"] = base_m.group(1).strip().split("\n")[0]

    # Effect
    effect_m = re.search(r"Effect\s*[:\-]?\s*(.+)", text, re.IGNORECASE)
    if not effect_m:
        effect_m = re.search(r"Efeito\s*[:\-]?\s*(.+)", text, re.IGNORECASE)
    if effect_m:
        result["effect"] = effect_m.group(1).strip().split("\n")[0]

    # Unlock level
    unlock_m = re.search(r"Unlocked at level\s*[:\-]?\s*(\d+)", text, re.IGNORECASE)
    if not unlock_m:
        unlock_m = re.search(r"Desbloqueado no nível\s*[:\-]?\s*(\d+)", text, re.IGNORECASE)
    if unlock_m:
        result["unlockLevel"] = int(unlock_m.group(1))

    # Required Points
    pts_m = re.search(r"Required Points\s*[:\-]?\s*(\d+)", text, re.IGNORECASE)
    if not pts_m:
        pts_m = re.search(r"Pontos Necessários\s*[:\-]?\s*(\d+)", text, re.IGNORECASE)
    if pts_m:
        result["requiredPoints"] = int(pts_m.group(1))

    # Description (último parágrafo longo)
    desc_lines = [l for l in lines if len(l) > 40]
    result["description"] = desc_lines[-1] if desc_lines else ""

    return result

def scrape_enhancement_detail(page: Page, enhancement_id: str) -> dict | None:
    data: dict[str, Any] = {"id": enhancement_id}

    for locale in LOCALES:
        url = f"{BASE}/{locale}/db/skill-trait/{enhancement_id}"
        text = get_page_text(page, url)
        if not text:
            continue
        name = extract_name_from_title(page)
        parsed = parse_enhancement_detail(text, enhancement_id)

        if locale == "en":
            data["nameEn"] = name or parsed["name"]
            data["baseSkillNameEn"] = parsed["baseSkillName"]
            data["grade"] = parsed["grade"]
            data["effectEn"] = parsed["effect"]
            data["unlockLevel"] = parsed["unlockLevel"]
            data["requiredPoints"] = parsed["requiredPoints"]
            data["descriptionEn"] = parsed["description"]
        else:
            data["namePt"] = name or parsed["name"]
            data["baseSkillNamePt"] = parsed["baseSkillName"]
            data["effectPt"] = parsed["effect"]
            data["descriptionPt"] = parsed["description"]

    return data if "nameEn" in data else None

# ─── DETALHE: weapon masteries ────────────────────────────────────────────────

def parse_mastery_detail(text: str, mastery_id: str) -> dict:
    lines = [clean(l) for l in text.splitlines() if clean(l)]
    result: dict[str, Any] = {
        "id": mastery_id,
        "name": "",
        "weapon": "",
        "category": "",
        "grade": "",
        "stats": [],
        "description": "",
    }

    grade_words = {"Epic", "Rare", "Uncommon", "Common", "Épico", "Raro", "Incomum", "Comum"}
    weapons = {"Longbow", "Crossbow", "Staff", "Wand & Tome", "Dagger", "Spear",
               "Sword & Shield", "Greatsword", "Orb", "Arco Longo", "Besta", "Cajado",
               "Varinha e Tomo", "Adaga", "Lança", "Espada e Escudo", "Espadão", "Orbe"}
    categories_en = {"Attack", "Defense", "Support", "Utility"}
    categories_pt = {"Ataque", "Defesa", "Suporte", "Utilidade"}

    for line in lines[:12]:
        if line in grade_words:
            result["grade"] = line
        if line in weapons:
            result["weapon"] = line
        if line in categories_en or line in categories_pt:
            result["category"] = line

    # Nome: linha após grade/weapon header
    for i, line in enumerate(lines):
        if "Weapon Specialization" in line or "Especialização de Arma" in line:
            if i > 0:
                result["name"] = lines[i - 1]
            break
    if not result["name"]:
        # fallback: linha com "Lv. 10" ou título principal
        for line in lines:
            if "Lv. 10" in line or "Nv. 10" in line:
                result["name"] = re.sub(r"\s*Lv\.\s*10|\s*Nv\.\s*10", "", line).strip()
                break

    # Labels a ignorar nos stats (ruído de UI)
    _stat_noise = re.compile(
        r"^(Level\s*\d*|Nível\s*\d*|Lv\.\s*\d*|Nv\.\s*\d*|Back|Voltar|Needed|Needed items"
        r"|Desbloqueado|Unlock|Comments|Comentários|\d+\s*/\s*\d+)$",
        re.IGNORECASE,
    )

    # Stats: linhas com padrão "Label: +valor" ou "Label\n valor"
    stat_pattern = re.compile(r"^(.+?)\s{2,}([+\-]?\d+(?:[.,]\d+)?%?)\s*$")
    for line in lines:
        m = stat_pattern.match(line)
        if m:
            label = m.group(1).strip()
            value = m.group(2).strip()
            if len(label) > 2 and not re.search(r"\d{4,}", label) and not _stat_noise.match(label):
                result["stats"].append({"label": label, "value": value})

    # Também tenta pegar stats de linhas consecutivas label + valor
    for i, line in enumerate(lines):
        if re.fullmatch(r"[+\-]?\d+(?:[.,]\d+)?%?", line) and i > 0:
            label = lines[i - 1]
            if (len(label) > 3
                    and not _stat_noise.match(label)
                    and not any(s["label"] == label for s in result["stats"])):
                result["stats"].append({"label": label, "value": line})

    # Descrição
    desc_lines = [l for l in lines if len(l) > 30 and not re.search(r"^\d+x?$|Needed|Needed items|Desbloqueado|Unlock", l, re.IGNORECASE)]
    result["description"] = desc_lines[0] if desc_lines else ""

    return result

def scrape_mastery_detail(page: Page, mastery_id: str) -> dict | None:
    data: dict[str, Any] = {"id": mastery_id}

    for locale in LOCALES:
        url = f"{BASE}/{locale}/db/weapon-specialization/{mastery_id}?level={MASTERY_LEVEL}"
        text = get_page_text(page, url)
        if not text:
            continue
        name = extract_name_from_title(page)
        parsed = parse_mastery_detail(text, mastery_id)

        if locale == "en":
            data["nameEn"] = name or parsed["name"]
            data["weapon"] = parsed["weapon"]
            data["categoryEn"] = parsed["category"]
            data["grade"] = parsed["grade"]
            data["statsEn"] = parsed["stats"]
            data["descriptionEn"] = parsed["description"]
        else:
            data["namePt"] = name or parsed["name"]
            data["categoryPt"] = parsed["category"]
            data["statsPt"] = parsed["stats"]
            data["descriptionPt"] = parsed["description"]

    return data if "nameEn" in data else None

# ─── Gerador de TypeScript ────────────────────────────────────────────────────

def _ts_str(s: Any) -> str:
    if s is None:
        return "undefined"
    return json.dumps(str(s), ensure_ascii=False)

def _ts_num(n: Any) -> str:
    if n is None:
        return "undefined"
    return str(n)

def generate_skills_ts(skills: list[dict]) -> str:
    lines = [
        "// GERADO AUTOMATICAMENTE — não edite manualmente",
        "// Fonte: questlog.gg — skills level 15 (en + pt)",
        "",
        "export type L10n = { en: string; pt: string }",
        "",
        "export interface Skill {",
        "  id: string",
        "  name: L10n",
        "  weapon: string",
        "  grade: 'Common' | 'Uncommon' | 'Rare' | 'Epic' | string",
        "  type: 'active' | 'passive' | 'defensive' | string",
        "  cooldownSec?: number",
        "  manaCost?: number",
        "  skillType?: L10n",
        "  useFormat?: L10n",
        "  description: L10n",
        "  enhancementIds: string[]",
        "}",
        "",
        "export const SKILLS: Skill[] = [",
    ]
    for s in skills:
        enh_ids = json.dumps(s.get("enhancementIds", []), ensure_ascii=False)
        lines += [
            "  {",
            f"    id: {_ts_str(s.get('id'))},",
            f"    name: {{ en: {_ts_str(s.get('nameEn', ''))}, pt: {_ts_str(s.get('namePt', ''))} }},",
            f"    weapon: {_ts_str(s.get('weapon', ''))},",
            f"    grade: {_ts_str(s.get('grade', 'Common'))},",
            f"    type: {_ts_str(s.get('type', 'active'))},",
            f"    cooldownSec: {_ts_num(s.get('cooldownSec'))},",
            f"    manaCost: {_ts_num(s.get('manaCost'))},",
            f"    skillType: {{ en: {_ts_str(s.get('skillTypeEn', ''))}, pt: {_ts_str(s.get('skillTypePt', ''))} }},",
            f"    useFormat: {{ en: {_ts_str(s.get('useFormatEn', ''))}, pt: {_ts_str(s.get('useFormatPt', ''))} }},",
            f"    description: {{ en: {_ts_str(s.get('descriptionEn', ''))}, pt: {_ts_str(s.get('descriptionPt', ''))} }},",
            f"    enhancementIds: {enh_ids},",
            "  },",
        ]
    lines += ["]", ""]
    return "\n".join(lines)


def generate_enhancements_ts(enhancements: list[dict]) -> str:
    lines = [
        "// GERADO AUTOMATICAMENTE — não edite manualmente",
        "// Fonte: questlog.gg — skill enhancements (en + pt)",
        "",
        "import type { L10n } from './skills'",
        "",
        "export interface SkillEnhancement {",
        "  id: string",
        "  name: L10n",
        "  baseSkillName: L10n",
        "  grade: 'Common' | 'Uncommon' | 'Rare' | 'Epic' | string",
        "  effect: L10n",
        "  unlockLevel?: number",
        "  requiredPoints?: number",
        "  description: L10n",
        "}",
        "",
        "export const SKILL_ENHANCEMENTS: SkillEnhancement[] = [",
    ]
    for e in enhancements:
        lines += [
            "  {",
            f"    id: {_ts_str(e.get('id'))},",
            f"    name: {{ en: {_ts_str(e.get('nameEn', ''))}, pt: {_ts_str(e.get('namePt', ''))} }},",
            f"    baseSkillName: {{ en: {_ts_str(e.get('baseSkillNameEn', ''))}, pt: {_ts_str(e.get('baseSkillNamePt', ''))} }},",
            f"    grade: {_ts_str(e.get('grade', 'Common'))},",
            f"    effect: {{ en: {_ts_str(e.get('effectEn', ''))}, pt: {_ts_str(e.get('effectPt', ''))} }},",
            f"    unlockLevel: {_ts_num(e.get('unlockLevel'))},",
            f"    requiredPoints: {_ts_num(e.get('requiredPoints'))},",
            f"    description: {{ en: {_ts_str(e.get('descriptionEn', ''))}, pt: {_ts_str(e.get('descriptionPt', ''))} }},",
            "  },",
        ]
    lines += ["]", ""]
    return "\n".join(lines)

def generate_masteries_ts(masteries: list[dict]) -> str:
    lines = [
        "// GERADO AUTOMATICAMENTE — não edite manualmente",
        "// Fonte: questlog.gg — weapon masteries level 10 (en + pt)",
        "",
        "import type { L10n } from './skills'",
        "",
        "export interface MasteryStat {",
        "  label: L10n",
        "  value: string",
        "}",
        "",
        "export interface WeaponMastery {",
        "  id: string",
        "  name: L10n",
        "  weapon: string",
        "  category: L10n",
        "  grade: 'Common' | 'Uncommon' | 'Rare' | 'Epic' | string",
        "  stats: MasteryStat[]",
        "  description: L10n",
        "}",
        "",
        "export const WEAPON_MASTERIES: WeaponMastery[] = [",
    ]
    for m in masteries:
        stats_en: list[dict] = m.get("statsEn", [])
        stats_pt: list[dict] = m.get("statsPt", [])
        # Merge stats: usa label en + label pt pareado por índice
        merged_stats = []
        for i, se in enumerate(stats_en):
            sp = stats_pt[i] if i < len(stats_pt) else {}
            merged_stats.append({
                "labelEn": se.get("label", ""),
                "labelPt": sp.get("label", se.get("label", "")),
                "value": se.get("value", ""),
            })

        stats_ts_lines = []
        for st in merged_stats:
            stats_ts_lines.append(
                f"      {{ label: {{ en: {_ts_str(st['labelEn'])}, pt: {_ts_str(st['labelPt'])} }}, value: {_ts_str(st['value'])} }},"
            )
        stats_ts = "\n".join(stats_ts_lines)

        lines += [
            "  {",
            f"    id: {_ts_str(m.get('id'))},",
            f"    name: {{ en: {_ts_str(m.get('nameEn', ''))}, pt: {_ts_str(m.get('namePt', ''))} }},",
            f"    weapon: {_ts_str(m.get('weapon', ''))},",
            f"    category: {{ en: {_ts_str(m.get('categoryEn', ''))}, pt: {_ts_str(m.get('categoryPt', ''))} }},",
            f"    grade: {_ts_str(m.get('grade', 'Common'))},",
            "    stats: [",
            stats_ts,
            "    ],",
            f"    description: {{ en: {_ts_str(m.get('descriptionEn', ''))}, pt: {_ts_str(m.get('descriptionPt', ''))} }},",
            "  },",
        ]
    lines += ["]", ""]
    return "\n".join(lines)

def generate_catalog_ts() -> str:
    return "\n".join([
        "// GERADO AUTOMATICAMENTE — não edite manualmente",
        "// Re-export unificado do catálogo",
        "",
        "export type { L10n, Skill } from './skills'",
        "export { SKILLS } from './skills'",
        "",
        "export type { SkillEnhancement } from './skillEnhancements'",
        "export { SKILL_ENHANCEMENTS } from './skillEnhancements'",
        "",
        "export type { WeaponMastery, MasteryStat } from './weaponMasteries'",
        "export { WEAPON_MASTERIES } from './weaponMasteries'",
        "",
        "// Helpers de lookup por ID",
        "import { SKILLS } from './skills'",
        "import { SKILL_ENHANCEMENTS } from './skillEnhancements'",
        "import { WEAPON_MASTERIES } from './weaponMasteries'",
        "",
        "export const skillById = (id: string) => SKILLS.find(s => s.id === id)",
        "export const enhancementById = (id: string) => SKILL_ENHANCEMENTS.find(e => e.id === id)",
        "export const masteryById = (id: string) => WEAPON_MASTERIES.find(m => m.id === id)",
        "export const skillsByWeapon = (weapon: string) => SKILLS.filter(s => s.weapon === weapon)",
        "export const masteriesByWeapon = (weapon: string) => WEAPON_MASTERIES.filter(m => m.weapon === weapon)",
        "",
    ])

# ─── Orquestração principal ───────────────────────────────────────────────────

def main() -> None:
    parser = argparse.ArgumentParser(description="Scraper de catálogo questlog.gg")
    parser.add_argument("--out", default=str(DEFAULT_OUT), help="Pasta de saída (src/data)")
    parser.add_argument("--skip-skills", action="store_true")
    parser.add_argument("--skip-enhancements", action="store_true")
    parser.add_argument("--skip-masteries", action="store_true")
    parser.add_argument("--no-cache", action="store_true", help="Ignora cache intermediário")
    args = parser.parse_args()

    out_dir = Path(args.out)
    out_dir.mkdir(parents=True, exist_ok=True)
    log(f"Saída: {out_dir}")

    cache = {} if args.no_cache else load_cache()

    with sync_playwright() as pw:
        browser = pw.chromium.launch(headless=True)
        ctx = browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            locale="en-US",
        )
        page = ctx.new_page()
        page.set_default_timeout(20000)

        # ── 1. Skills ──────────────────────────────────────────────────────────
        skills: list[dict] = cache.get("skills", [])
        skill_ids_done: set[str] = {s["id"] for s in skills}
        enhancement_ids_all: set[str] = set()
        for s in skills:
            enhancement_ids_all.update(s.get("enhancementIds", []))

        if not args.skip_skills:
            log("=== SKILLS ===")
            list_items = scrape_list_ids(page, "skill-sets")

            for i, item in enumerate(list_items):
                skill_id = item["id"]
                if skill_id in skill_ids_done:
                    log(f"  [{i+1}/{len(list_items)}] {skill_id} (cache)")
                    continue
                log(f"  [{i+1}/{len(list_items)}] {skill_id}")
                detail = scrape_skill_detail(page, skill_id)
                if detail:
                    skills.append(detail)
                    skill_ids_done.add(skill_id)
                    enhancement_ids_all.update(detail.get("enhancementIds", []))
                    cache["skills"] = skills
                    save_cache(cache)

            log(f"Total skills: {len(skills)}")
            log(f"Enhancement IDs coletados via skills: {len(enhancement_ids_all)}")

        # ── 2. Skill Enhancements ──────────────────────────────────────────────
        enhancements: list[dict] = cache.get("enhancements", [])
        enh_ids_done: set[str] = {e["id"] for e in enhancements}

        if not args.skip_enhancements:
            log("=== SKILL ENHANCEMENTS ===")

            # Também tenta pegar IDs adicionais da lista própria
            extra_items = scrape_list_ids(page, "skill-enhancements")
            for item in extra_items:
                enhancement_ids_all.add(item["id"])

            enh_id_list = list(enhancement_ids_all)
            for i, enh_id in enumerate(enh_id_list):
                if enh_id in enh_ids_done:
                    log(f"  [{i+1}/{len(enh_id_list)}] {enh_id} (cache)")
                    continue
                log(f"  [{i+1}/{len(enh_id_list)}] {enh_id}")
                detail = scrape_enhancement_detail(page, enh_id)
                if detail:
                    enhancements.append(detail)
                    enh_ids_done.add(enh_id)
                    cache["enhancements"] = enhancements
                    save_cache(cache)

            log(f"Total enhancements: {len(enhancements)}")

        # ── 3. Weapon Masteries ────────────────────────────────────────────────
        masteries: list[dict] = cache.get("masteries", [])
        mastery_ids_done: set[str] = {m["id"] for m in masteries}

        if not args.skip_masteries:
            log("=== WEAPON MASTERIES ===")
            mastery_items = scrape_list_ids(page, "weapon-masteries")
            if not mastery_items:
                # Fallback URL alternativo
                mastery_items = scrape_list_ids(page, "weapon-specializations")

            for i, item in enumerate(mastery_items):
                mastery_id = item["id"]
                if mastery_id in mastery_ids_done:
                    log(f"  [{i+1}/{len(mastery_items)}] {mastery_id} (cache)")
                    continue
                log(f"  [{i+1}/{len(mastery_items)}] {mastery_id}")
                detail = scrape_mastery_detail(page, mastery_id)
                if detail:
                    masteries.append(detail)
                    mastery_ids_done.add(mastery_id)
                    cache["masteries"] = masteries
                    save_cache(cache)

            log(f"Total masteries: {len(masteries)}")

        browser.close()

    # ── Validar dados antes de gerar ──────────────────────────────────────────
    _PLACEHOLDER = re.compile(
        r"Conecte-se para deixar|Faça login|Entre para comentar"
        r"|Connect to leave|Log in to|Sign in to comment",
        re.IGNORECASE,
    )
    issues: list[str] = []
    for m in masteries:
        for field in ("descriptionEn", "descriptionPt"):
            val = m.get(field, "")
            if _PLACEHOLDER.search(val):
                issues.append(f"  mastery {m['id']}.{field}: contém placeholder de login")
    for e in enhancements:
        for field in ("descriptionEn", "descriptionPt"):
            val = e.get(field, "")
            if _PLACEHOLDER.search(val):
                issues.append(f"  enhancement {e['id']}.{field}: contém placeholder de login")
    if issues:
        warn("=== DADOS COM PLACEHOLDER DETECTADOS ===")
        for msg in issues:
            warn(msg)
        warn("Limpando automaticamente antes de gerar...")
        for m in masteries:
            for field in ("descriptionEn", "descriptionPt"):
                if _PLACEHOLDER.search(m.get(field, "")):
                    m[field] = ""
        for e in enhancements:
            for field in ("descriptionEn", "descriptionPt"):
                if _PLACEHOLDER.search(e.get(field, "")):
                    e[field] = ""

    # ── Gerar arquivos TypeScript ──────────────────────────────────────────────
    log("=== GERANDO TYPESCRIPT ===")

    (out_dir / "skills.ts").write_text(generate_skills_ts(skills), "utf-8")
    log(f"  → skills.ts ({len(skills)} skills)")

    (out_dir / "skillEnhancements.ts").write_text(generate_enhancements_ts(enhancements), "utf-8")
    log(f"  → skillEnhancements.ts ({len(enhancements)} enhancements)")

    (out_dir / "weaponMasteries.ts").write_text(generate_masteries_ts(masteries), "utf-8")
    log(f"  → weaponMasteries.ts ({len(masteries)} masteries)")

    (out_dir / "catalog.ts").write_text(generate_catalog_ts(), "utf-8")
    log(f"  → catalog.ts (re-exports + helpers)")

    log("Concluído!")
    if CACHE_FILE.exists():
        log(f"Cache salvo em: {CACHE_FILE}")
        log("Use --no-cache para forçar re-scraping completo.")


if __name__ == "__main__":
    main()
