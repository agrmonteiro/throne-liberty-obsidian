---
phase: 11
slug: build-specialization-data
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-25
---

# Phase 11 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Nenhum framework de teste configurado — validação via TypeScript compiler |
| **Config file** | `tsconfig.json` |
| **Quick run command** | `npx tsc --noEmit` |
| **Full suite command** | `npx tsc --noEmit && npm run build` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx tsc --noEmit`
- **After every plan wave:** Run `npx tsc --noEmit && npm run build`
- **Before `/gsd-verify-work`:** Full suite must be green + smoke test manual de importação
- **Max feedback latency:** ~30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 11-01-01 | 01 | 1 | ROT-01 (infra) | — | Campos opcionais não quebram TypeScript | type-check | `npx tsc --noEmit` | ✅ | ⬜ pending |
| 11-01-02 | 01 | 1 | D-04/D-05 | — | Build com specialization undefined compila | type-check | `npx tsc --noEmit` | ✅ | ⬜ pending |
| 11-02-01 | 02 | 1 | D-09 | T-V5 | Type guards em parseNewScraperFormat() rejeitam objetos malformados | type-check | `npx tsc --noEmit` | ✅ | ⬜ pending |
| 11-03-01 | 03 | 2 | D-01/D-02 | — | Scraper retorna sem crash se export falhar | manual-only | — | ❌ Wave 0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Nenhum arquivo de teste precisa ser criado — a infraestrutura TypeScript já existe. O único gap é o smoke test manual do fluxo Playwright completo.

*Existing infrastructure covers all phase requirements para verificação automatizada.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| `builds.json` persiste `specialization` após re-importar URL com maestrias | D-09 | Requer scraper Playwright rodando ao vivo contra Questlog real | 1. Abrir app em dev (`npm run dev`) 2. Importar URL do Questlog com maestrias configuradas 3. Verificar `builds.json` em AppData/Roaming/Tier2 Command Lab/data/ — o build deve ter `specialization: [...]`, `weaponMain`, `weaponOff` |
| Scraper retorna sem specialization quando export falha | D-01 fallback | Requer DOM do Questlog ao vivo para simular falha | 1. Usar URL de build sem maestrias configuradas 2. Verificar que importação completa sem erro e build.specialization é undefined |
| `.exe` bundled captura specialization em produção | Pitfall 5 | Requer recompilação manual do PyInstaller | Após changes no .py: `pyinstaller questlog_scraper.spec` → testar build de produção |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
