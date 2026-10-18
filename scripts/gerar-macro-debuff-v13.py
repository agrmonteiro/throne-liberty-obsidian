"""Candidata controlada: espalha Arremesso, sem reduzir tentativas das outras skills."""
from collections import Counter
from copy import deepcopy
from pathlib import Path
from uuid import uuid4
import json
import xml.etree.ElementTree as ET

source = Path.home() / "Downloads/TL_MA_BUFF_V11.xml"
destination = Path.home() / "Downloads/TL_MA_DEBUFF_V13.xml"
original = ET.parse(source).getroot()
root = deepcopy(original)
root.find("Name").text = "TL_MA_DEBUFF_V13"
root.find("Guid").text = str(uuid4())
container = root.find("MacroEvents")
downs = [e for e in container if e.findtext("Type") == "1" and e.findtext("KeyEvent/State") == "0"]
keys = [e.findtext("KeyEvent/Makecode") for e in downs]
assert len(keys) == 93 and keys.count("56") == 3
assert keys[50:53] == ["56", "56", "56"], "Fonte diferente da V11 analisada."
others = iter(k for k in keys if k != "56")
# Tentativas aos 138, 851 e 1564 ms: espaçamento de 713 ms entre elas.
slots = {6, 37, 68}
replacement = ["56" if i in slots else next(others) for i in range(93)]
assert Counter(replacement) == Counter(keys)
new_key_by_id = {e.findtext("Id"): key for e, key in zip(downs, replacement, strict=True)}
scan_by_key = {e.findtext("KeyEvent/Makecode"): e.findtext("ScanCode") for e in downs}
active = {}
for e in container:
    if e.findtext("Type") != "1":
        continue
    pair = e.findtext("Id")
    make = new_key_by_id[pair]
    e.find("KeyEvent/Makecode").text = make
    e.find("ScanCode").text = scan_by_key[make]
    if e.findtext("KeyEvent/State") == "0":
        assert pair not in active
        active[pair] = make
    else:
        assert active.pop(pair) == make
assert not active
for before, after in zip(original.find("MacroEvents"), container, strict=True):
    assert before.findtext("Type") == after.findtext("Type")
    assert before.findtext("Number") == after.findtext("Number")
    assert before.findtext("KeyEvent/State") == after.findtext("KeyEvent/State")
assert [k for k in replacement if k != "56"] == [k for k in keys if k != "56"]
ET.indent(root, space="   ")
ET.ElementTree(root).write(destination, encoding="unicode")
audit = {
    "status": "experimental_nao_instalada_nao_testada",
    "source": str(source), "output": str(destination),
    "pressCount": 93, "cycleDurationMs": 2139, "holdMs": 20, "gapMs": 3,
    "arremessoAttemptsMs": [138, 851, 1564],
    "preserved": "contagem de todas as teclas, ordem relativa das demais teclas, temporização e buffers da V11",
    "hypothesis": "Distribuir as mesmas 3 tentativas de Arremesso pode reduzir espera até uma tentativa aceita após animação/CD e melhorar aplicação dos efeitos.",
    "acceptance": "Comparar dano total em 120 s contra V11 reteste de 49680876; avaliar também espaçamento do dano de Arremesso. Mesmos buffs e condições. Não atribuir causalidade com uma única amostra.",
    "cautions": ["Dano observado não comprova uptime de debuff ou de Mandíbulas.", "Grupos de dano não equivalem a casts.", "Não há estimativa de ganho garantido de DPS."],
}
destination.with_suffix(".json").write_text(json.dumps(audit, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(json.dumps(audit, ensure_ascii=False))
