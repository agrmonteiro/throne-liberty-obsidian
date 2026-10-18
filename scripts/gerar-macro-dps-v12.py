"""Gera uma candidata A/B a partir da V11, preservando tempos e buffs."""
from collections import Counter
from copy import deepcopy
from pathlib import Path
from uuid import uuid4
import json
import xml.etree.ElementTree as ET

source = Path.home() / "Downloads/TL_MA_BUFF_V11.xml"
destination = Path.home() / "Downloads/TL_MA_DPS_V12.xml"
original = ET.parse(source).getroot()
root = deepcopy(original)
root.find("Name").text = "TL_MA_DPS_V12"
root.find("Guid").text = str(uuid4())
events = list(root.find("MacroEvents"))
downs = [e for e in events if e.findtext("Type") == "1" and e.findtext("KeyEvent/State") == "0"]
keys = [e.findtext("KeyEvent/Makecode") for e in downs]
# Cada bloco 4,5,5,2,2 passa a 4,5,5,5,2. Mesmo total de tentativas.
changed_ids = set()
for i in range(len(keys) - 4):
    if keys[i:i + 5] == ["52", "53", "53", "50", "50"]:
        changed_ids.add(downs[i + 3].findtext("Id"))
assert len(changed_ids) == 10, "Fonte não corresponde à V11 analisada; não gerar silenciosamente."
for e in events:
    if e.findtext("Type") == "1" and e.findtext("Id") in changed_ids:
        e.find("KeyEvent/Makecode").text = "53"
        e.find("ScanCode").text = "6"
# Verificação: cada par continua equilibrado e toda a temporização é idêntica.
active = {}
for before, after in zip(original.find("MacroEvents"), events, strict=True):
    assert before.findtext("Type") == after.findtext("Type")
    assert before.findtext("Number") == after.findtext("Number")
    if after.findtext("Type") != "1":
        continue
    pair = after.findtext("Id")
    key = after.findtext("KeyEvent/Makecode")
    if after.findtext("KeyEvent/State") == "0":
        assert pair not in active
        active[pair] = key
    else:
        assert active.pop(pair) == key
    if pair not in changed_ids:
        assert ET.tostring(before) == ET.tostring(after)
assert not active
ET.indent(root, space="   ")
ET.ElementTree(root).write(destination, encoding="unicode")
counts_before = Counter(keys)
counts_after = Counter(e.findtext("KeyEvent/Makecode") for e in downs)
assert counts_after["53"] == 30 and counts_after["50"] == 10
assert sum(counts_before.values()) == sum(counts_after.values()) == 93
audit = {
    "status": "experimental_aguarda_teste_AB",
    "source": str(source), "output": str(destination),
    "baselineDamage120Sec": 52495055, "baselineDps120Sec": 437458.7916666667,
    "cycleDurationMs": round(sum(float(e.findtext("Number")) * 1000 for e in events if e.findtext("Type") == "0")),
    "pressCount": 93, "holdMs": 20, "gapMs": 3,
    "changedPressPairs": len(changed_ids),
    "before": {"Garras_5": 20, "Tempestade_2": 20},
    "after": {"Garras_5": 30, "Tempestade_2": 10},
    "preserved": "demais teclas, sequência de buffs, tempos, total de eventos; V11 original preservada",
    "limitations": ["Participação no dano não prova ganho marginal de frequência.", "Não estima DPS da candidata.", "Não altera a tecla 0: Eclipse não deve ser alternado indiscriminadamente.", "Não altera Injeção Letal: reativação pode consumir acúmulos.", "Macro experimental não instalada ou executada por este script."],
}
destination.with_suffix(".json").write_text(json.dumps(audit, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(json.dumps(audit, ensure_ascii=False))
