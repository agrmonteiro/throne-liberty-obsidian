# Phase 11: Build Specialization Data - Pattern Map

**Mapped:** 2026-04-25
**Files analyzed:** 3
**Analogs found:** 3 / 3

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `src/engine/types.ts` | model | transform | `src/engine/types.ts` (self — extend) | exact |
| `src/store/useBuilds.ts` | store/service | request-response + transform | `src/store/useBuilds.ts` (self — extend) | exact |
| `../throne_and_liberty_agent/scraper/questlog_scraper_standalone.py` | scraper/utility | request-response (Playwright) | `../throne_and_liberty_agent/scraper/questlog_scraper_standalone.py` (self — extend) | exact |

---

## Pattern Assignments

### `src/engine/types.ts` (model, transform)

**Analog:** `src/engine/types.ts` — interface `Build` (lines 60–73)

**Current Build interface** (lines 60–73):
```typescript
export interface Build {
  id:             string
  name:           string
  weaponCombo:    string
  stats:          BuildStats
  notes:          string
  importedAt:     string  // ISO date
  editedAt?:      string
  sourceUrl?:     string
  screenshotFile?: string  // filename inside data dir (e.g. "build_xxx_screenshot.png")
  // All raw fields from the scraper (preserved for display + editing)
  rawAttributes?: Record<string, { total: number; display: string }>
  rawStats?:      Record<string, string>
}
```

**Extension pattern** — append after `rawStats?:` following the same optional-field convention:
```typescript
  // Phase 11 — dados de especialização do Questlog Build Editor
  specialization?: Array<{ id: string; lvl: number }>
  weaponMain?:     string   // ex: "staff" (lowercase, formato Questlog)
  weaponOff?:      string   // ex: "wand" (lowercase, formato Questlog)
```

**Existing optional-field precedent** (lines 67–72): `editedAt?`, `sourceUrl?`, `screenshotFile?`, `rawAttributes?`, `rawStats?` — all declared with `?` and no default value. Follow the identical pattern for the three new fields.

**Key constraint (D-06):** `weaponMain`/`weaponOff` are distinct from `RotationCharacter.weaponMainType`/`weaponOffType` (lines 83–86). The new fields mirror Questlog's lowercase strings (`"staff"`, `"wand"`); the Rotation engine uses capitalized strings (`"Staff"`, `"Wand & Tome"`). Do not conflate.

---

### `src/store/useBuilds.ts` (store/service, request-response + transform)

**Analog:** `src/store/useBuilds.ts` — functions `parseNewScraperFormat`, `loadFromDisk`, `validateScraperOutput`

#### Core pattern: `parseNewScraperFormat` return object (lines 332–343)

This is the exact insertion point for the new fields. Current return:
```typescript
return {
  id:            newId(),
  name,
  weaponCombo:   '',
  stats,
  notes:         '',
  importedAt:    new Date().toISOString(),
  sourceUrl,
  rawStats:      rawStatsIn,
  rawAttributes,
}
```

**New fields to add** (append to this return, before closing `}`):
```typescript
  specialization: (() => {
    const rawSpec = raw.specialization
    if (!Array.isArray(rawSpec) || rawSpec.length === 0) return undefined
    const filtered = (rawSpec as unknown[]).reduce<Array<{ id: string; lvl: number }>>((acc, item) => {
      if (
        item !== null && typeof item === 'object' &&
        typeof (item as any).id === 'string' &&
        typeof (item as any).lvl === 'number'
      ) {
        acc.push({ id: (item as any).id, lvl: (item as any).lvl })
      }
      return acc
    }, [])
    return filtered.length ? filtered : undefined
  })(),
  weaponMain: typeof raw.weaponMain === 'string' ? raw.weaponMain : undefined,
  weaponOff:  typeof raw.weaponOff  === 'string' ? raw.weaponOff  : undefined,
```

**Style note:** The RESEARCH.md shows an alternative with an inline IIFE or extracted variable — both are valid. The codebase uses inline expressions for simple extractions (see `sourceUrl` at line 330: `typeof meta.source_url === 'string' ? meta.source_url : undefined`). Use the same one-liner style for `weaponMain`/`weaponOff`. For `specialization` (array type guard), an IIFE or a variable before the return keeps the return object readable — match the existing `statNum` helper pattern (lines 263–275) which defines helpers inline above the return.

#### Migration pattern: `loadFromDisk` (lines 82–99)

No change required. Existing spread pattern already handles new optional fields gracefully:
```typescript
loadFromDisk: async () => {
  set({ loading: true })
  const raw = await readBuilds()
  const builds: BuildMap = {}
  for (const [id, build] of Object.entries(raw)) {
    const merged = { ...DEFAULT_STATS, ...build.stats }
    if (!merged.monsterDmgBoostPct) merged.monsterDmgBoostPct = DEFAULT_STATS.monsterDmgBoostPct
    if (!merged.dmgBuffPct)         merged.dmgBuffPct         = DEFAULT_STATS.dmgBuffPct
    builds[id] = { ...build, stats: merged }   // <-- spread preserves unknown keys including new optional fields
  }
  // ...
}
```
Old builds lacking `specialization`/`weaponMain`/`weaponOff` will load as `undefined` automatically — no explicit normalization needed (D-05).

#### Validation pattern: `validateScraperOutput` (lines 207–236)

**No changes required.** Current validation only checks for presence of `stats` + name identifier. The new optional fields must NOT make validation more restrictive. The existing comment at line 207 says: "Retorna null se válido, ou string com mensagem de erro se inválido." New fields are additive-optional — a scraper result without them is still valid.

```typescript
function validateScraperOutput(obj: Record<string, unknown>): string | null {
  const hasStats = obj.stats != null
    && typeof obj.stats === 'object'
    && !Array.isArray(obj.stats)
    && Object.keys(obj.stats as Record<string, unknown>).length > 0
  if (!hasStats) {
    return 'Build importada com dados incompletos — campos obrigatórios ausentes'
  }
  // ... (formato novo / antigo checks unchanged)
  return null // válido
}
```

#### `parseOldFormat` (lines 346–434)

**No changes.** Old format builds never carry specialization data (D-08 / A3). Do not add extraction here.

---

### `../throne_and_liberty_agent/scraper/questlog_scraper_standalone.py` (scraper, request-response Playwright)

**Analog:** `questlog_scraper_standalone.py` — function `scrape()` (lines 186–248)

#### Current `scrape()` structure (lines 186–248):

```python
def scrape(url: str) -> dict[str, Any]:
    # 1. Validações iniciais
    slug, build_id = _parse_url(url)

    with sync_playwright() as pw:
        browser = pw.chromium.launch(headless=True)
        page = browser.new_page(user_agent="Mozilla/5.0 ...")

        # 2. Navega e verifica Cloudflare
        page.goto(url, wait_until="networkidle", timeout=60000)
        body_text = page.inner_text("body")
        if "unable to access" in body_text.lower():
            browser.close()
            return {"error": "Questlog bloqueou o acesso (Cloudflare)."}

        # 3. Extrai nome do personagem via h1
        char_name = slug
        try:
            h1 = page.query_selector("h1")
            ...
        except Exception:
            pass

        # 4. Rola painel e coleta stats
        panel_text = page.evaluate(_JS_SCROLL_AND_COLLECT)
        browser.close()   # <── INSERIR PASSO DE EXPORT ANTES DESTE CLOSE

    # 5. Parse do texto
    parsed = _parse_panel_text(source_text)

    # 6. Retorna JSON
    return {
        "meta": { "source_url": url, "slug": slug, "build_id": build_id, "character_name": char_name },
        "attributes": attributes,
        "stats": stats,
    }
```

#### Insertion point: before `browser.close()` on line 226

Add a call to a new helper `_try_export_specialization(page)` between the `panel_text = page.evaluate(...)` call and `browser.close()`. Assign its result and merge into the return dict.

**Helper pattern** — follows same try/except/fallback-None convention used in the `h1` extraction (lines 215–222):
```python
def _try_export_specialization(page) -> dict | None:
    """
    Tenta capturar o JSON de especialização via o botão "Export to Share"
    no Build Editor do Questlog. Retorna None se falhar — fallback gracioso.
    """
    try:
        # Seletores a confirmar via inspeção DOM ao vivo (A1 — assumption)
        export_btn = page.query_selector(
            '[aria-label="Export to Share"], [title="Export to Share"], button[data-export]'
        )
        if not export_btn:
            print("[scraper] Botão de export não encontrado — sem maestrias", flush=True)
            return None

        export_btn.click()
        page.wait_for_timeout(1500)

        # Tentar ler de um textarea/pre no modal (A2 — assumption)
        json_el = page.query_selector(
            'textarea[readonly], pre[data-export-json], .export-modal textarea'
        )
        if json_el:
            raw_json = json_el.input_value() or json_el.inner_text()
            parsed = json.loads(raw_json)
            # Garantir que retornamos apenas os campos esperados
            return {
                "mainHand": parsed.get("mainHand"),
                "offHand":  parsed.get("offHand"),
                "specialization": parsed.get("specialization", []),
            }
        return None
    except Exception as exc:
        print(f"[scraper] Export falhou (ignorando): {exc}", flush=True)
        return None
```

**Merge into return dict** (line 236 equivalent — after adding the export step):
```python
        panel_text = page.evaluate(_JS_SCROLL_AND_COLLECT)
        export_data = _try_export_specialization(page)  # <── NOVO
        browser.close()

    # ... parse stats ...

    result = {
        "meta": { "source_url": url, "slug": slug, "build_id": build_id, "character_name": char_name },
        "attributes": attributes,
        "stats": stats,
    }
    # Merges export data only if present (graceful fallback — D-01, D-02)
    if export_data:
        result["specialization"] = export_data.get("specialization") or []
        result["weaponMain"]     = export_data.get("mainHand")
        result["weaponOff"]      = export_data.get("offHand")

    return result
```

**Cloudflare guard pattern** (lines 208–211) — replicate for the Build Editor navigation if a separate goto is needed:
```python
body_text = page.inner_text("body")
if "unable to access" in body_text.lower() and "questlog.gg" in body_text.lower():
    browser.close()
    return {"error": "Questlog bloqueou o acesso (Cloudflare)."}
```

**Output to stdout** (lines 310–311) — the IPC handler in `electron/main/index.ts` parses `stdout.slice(stdout.indexOf('{'))`, so the final `print(json.dumps(data, ...))` call in `main()` automatically includes the new fields when present.

---

## Shared Patterns

### Graceful Optional-Field Migration
**Source:** `src/store/useBuilds.ts` lines 82–99 (`loadFromDisk`)
**Apply to:** `types.ts` extension, `useBuilds.ts` return in `parseNewScraperFormat`

The project's standard for adding optional fields is: (1) mark as `?` in the interface, (2) rely on `{ ...build }` spread in `loadFromDisk` to carry them forward without normalization, (3) no explicit migration needed unless a default value differs from `undefined`. The three new fields all default to `undefined` in old builds — zero migration code needed.

### Type Guard Inline (no Zod)
**Source:** `src/store/useBuilds.ts` lines 259–260, 330, 420–423 (typeof checks)
**Apply to:** `specialization`/`weaponMain`/`weaponOff` extraction in `parseNewScraperFormat`

```typescript
// Pattern used throughout the file — replicate exactly:
const sourceUrl = typeof meta.source_url === 'string' ? meta.source_url : undefined
const name = String(meta.character_name || meta.slug || 'Build importada')
```

For the array field `specialization`, use `Array.isArray()` + `reduce` with a type guard (no Zod — per RESEARCH.md standard stack notes).

### Python Scraper Fallback Pattern
**Source:** `questlog_scraper_standalone.py` lines 215–222 (h1 extraction)
**Apply to:** `_try_export_specialization()` helper

```python
try:
    h1 = page.query_selector("h1")
    if h1:
        text = h1.inner_text().strip()
        lines = [l.strip() for l in text.splitlines() if l.strip()]
        char_name = lines[-1] if lines else slug
except Exception:
    pass
```

Pattern: `try / query_selector / check None / extract / except Exception: pass`. The export helper follows this exact shape — if anything fails, return `None` and let the caller merge nothing.

### IPC stdout JSON Output
**Source:** `electron/main/index.ts` lines 560–568
**Apply to:** `questlog_scraper_standalone.py` `main()` — no changes needed

The IPC handler does `stdout.slice(stdout.indexOf('{'))` to extract JSON. The scraper's `main()` already prints the full result dict via `print(json.dumps(data, indent=2, ensure_ascii=False))`. Adding new top-level keys to the returned dict is transparently forwarded — no IPC changes needed.

---

## No Analog Found

None. All three files have exact self-analogs (they are modifications to existing files).

---

## Metadata

**Analog search scope:** `src/engine/`, `src/store/`, `../throne_and_liberty_agent/scraper/`, `electron/main/`
**Files scanned:** 4
**Pattern extraction date:** 2026-04-25

**Key open questions (executor must resolve before writing selectors):**
- A1: DOM selector for "Export to Share" button — inspect Questlog DOM with `headless=False` before committing selector string
- A2: Whether button produces a modal/textarea in DOM or clipboard-only — check Network tab to detect XHR alternative
- A3: Whether Build Editor URL requires authentication — if yes, `_try_export_specialization` returns `None` immediately and stats-only path continues unchanged
