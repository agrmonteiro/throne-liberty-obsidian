---
plan: 11-03
status: complete
completed: 2026-04-26
wave: 2
---

## O que foi construído

Parser de screenshot de specialization + integração API direta.

**Descoberta crítica durante execução:** A API pública do Questlog (`weaponSpecialization.getWeaponSpecializationBySlug`) retorna dados de specialization SEM login — o endpoint não era conhecido antes desta fase.

## Artefatos criados

### `scraper/spec_coords.json`
- 52 nós do Bow + 52 nós do Staff com IDs reais do Questlog
- Coordenadas normalizadas (0.0–1.0) baseadas no layout circular da árvore
- IDs obtidos via API: `Bow_Hero_Attack_01`, `Bow_Normal_Tac_Skill`, etc.
- Fonte dos dados: `weaponSpecialization.getWeaponSpecializations` (tRPC público)

### `scraper/spec_screenshot_parser.py`
- `parse_spec_screenshot(image_path, weapon_main, weapon_off)` → `dict | None`
- Detecta nós ativos por saturação HSV vs threshold configurável
- Suporta Questlog e jogo (detecção automática por cor de fundo)
- Sem dependência de Tesseract — apenas Pillow
- Fallback gracioso: retorna None se nenhum nó detectado

### `scraper/questlog_importer_api.py` (enriquecido)
- `_match_spec_build()` — encontra o spec build correspondente às armas
- `import_build_from_url()` agora inclui `specialization`, `weaponMain`, `weaponOff`
- Fetcha dados via `weaponSpecialization.getWeaponSpecializationBySlug` (sem login)
- Fallback gracioso se o endpoint falhar (importação continua sem specialization)

### `electron/main/index.ts`
- Handler `questlog:import-screenshot` adicionado
- Valida `imagePath` (sem `..` path traversal, arquivo deve existir)
- Spawna `spec_screenshot_parser.py` com path + armas opcionais
- Retorna JSON ou `{ error: string }`

## Dados de referência descobertos

- Armas disponíveis: bow, staff, crossbow, dagger, orb, spear, sword2h, sword, wand
- Build Bow+Staff do usuário (id=112357): 42+ nós ativos confirmados via API
- Endpoint: `https://questlog.gg/throne-and-liberty/api/trpc/weaponSpecialization.getWeaponSpecializationBySlug`

## Checkpoint Task 5 (smoke test)

Pendente — requer screenshot real e execução manual:
```
python scraper/spec_screenshot_parser.py "caminho/screenshot.png" bow staff
```

## Self-Check: PASSED

key-files:
  created:
    - ../throne_and_liberty_agent/scraper/spec_screenshot_parser.py
    - ../throne_and_liberty_agent/scraper/spec_coords.json
  modified:
    - ../throne_and_liberty_agent/scraper/questlog_importer_api.py
    - electron/main/index.ts
