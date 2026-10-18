"""Gera uma macro Razer Synapse 4 para mapear as telas de coleta do TL.

As coordenadas são absolutas para a janela atual do jogo em 2560 x 990.
Cada versão deve ser importada e validada no jogo antes de ampliar o roteiro.
"""

from __future__ import annotations

import argparse
from pathlib import Path
from uuid import uuid4
from xml.etree import ElementTree as ET
from itertools import count

PAIR_IDS = count(1792242407200)


def add(parent: ET.Element, tag: str, value: str | None = None) -> ET.Element:
    element = ET.SubElement(parent, tag)
    if value is not None:
        element.text = value
    return element


def event(parent: ET.Element, kind: str) -> ET.Element:
    item = add(parent, "MacroEvent")
    add(item, "Type", kind)
    return item


def pause(parent: ET.Element, seconds: float) -> None:
    item = event(parent, "0")
    add(item, "Number", f"{seconds:.3f}")
    add(item, "selected", "false")


def move(parent: ET.Element, x: int, y: int) -> None:
    item = event(parent, "3")
    add(item, "Id")
    add(item, "Number", "0.100")
    mouse = add(item, "MouseEvent")
    for timestamp in (0, 100):
        buffer = add(mouse, "Buffer")
        add(buffer, "x", str(x))
        add(buffer, "y", str(y))
        add(buffer, "time", str(timestamp))
    add(item, "selected", "false")


def click(parent: ET.Element, x: int, y: int) -> None:
    pair_id = str(next(PAIR_IDS))
    move(parent, x, y)
    pause(parent, 0.10)
    for state in (0, 1):
        item = event(parent, "2")
        add(item, "Id", pair_id)
        mouse = add(item, "MouseEvent")
        add(mouse, "MouseButton", "0")
        add(mouse, "State", str(state))
        add(item, "flag")
        add(item, "selected", "false")
        add(item, "isPairing", "false")
        if state == 0:
            pause(parent, 0.08)


def hover_item(parent: ET.Element, x: int, y: int) -> None:
    """Chega ao ícone e produz deslocamento real para atualizar o tooltip."""
    move(parent, x, y)
    pause(parent, 0.20)
    for pass_index in range(2):
        hover_y = y - 6 if pass_index == 1 else y
        item = event(parent, "3")
        add(item, "Id")
        add(item, "Number", "0.400")
        mouse = add(item, "MouseEvent")
        for timestamp, offset in ((0, 0), (100, -8), (250, 8), (400, 0)):
            buffer = add(mouse, "Buffer")
            add(buffer, "x", str(x + offset))
            add(buffer, "y", str(hover_y))
            add(buffer, "time", str(timestamp))
        add(item, "selected", "false")
        pause(parent, 2.0)


def key(parent: ET.Element, vk: int, scan: int) -> None:
    pair_id = str(next(PAIR_IDS))
    for state in (0, 1):
        item = event(parent, "1")
        add(item, "Id", pair_id)
        keyboard = add(item, "KeyEvent")
        add(keyboard, "Makecode", str(vk))
        add(keyboard, "State", str(state))
        if state == 1:
            add(keyboard, "flag", "1")
        add(item, "flag", str(state))
        add(item, "selected", "false")
        add(item, "isPairing", "false")
        add(item, "ScanCode", str(scan))
        if state == 0:
            pause(parent, 0.08)


def specializations(parent: ET.Element) -> None:
    """Consulta as opções vistas como selecionadas no preset das duas armas.

    Clica somente na aba, na categoria da arma e no título de cada skill.
    Os círculos de especialização recebem apenas movimentos do mouse.
    """
    click(parent, 890, 155)
    pause(parent, 2.0)
    weapons = [
        ("I — Manoplas", (496, 802), [
            (710, 266, [647, 730]),  # Golpe em Cadeia
            (710, 442, [730]),  # Espetada Rápida
            (710, 530, [647]),  # Eclipse
            (710, 618, [647, 730]),  # Ampliação
            (1005, 618, []),  # Êxtase: registrar também ausência de opções ativas
        ]),
        ("II — Adagas", (496, 358), [
            (710, 266, [647, 687]),  # Fenda
            (1005, 266, [1066]),  # Golpe Sombrio
            (710, 354, [687]),  # Injeção
            (1005, 442, [980, 1020]),  # Umbral
            (710, 530, [647, 687, 770]),  # Arremesso
            (1005, 618, [940, 980, 1066]),  # Massacre
            (1005, 706, [940, 980, 1020, 1066]),  # Dança
        ]),
    ]
    for _weapon, (nav_x, nav_y), skills in weapons:
        click(parent, nav_x, nav_y)
        move(parent, 1150, 900)
        pause(parent, 4.0)  # visão geral com os círculos selecionados
        for title_x, title_y, options in skills:
            click(parent, title_x, title_y)
            pause(parent, 1.0)
            if not options:
                pause(parent, 3.0)
            for option_x in options:
                move(parent, 1150, 900)
                pause(parent, 0.2)
                hover_item(parent, option_x, title_y + 34)
    move(parent, 1150, 900)
    pause(parent, 4.0)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--route", choices=("skills", "itens", "maestrias", "nucleos", "especializacoes", "coleta", "nucleo-teste"), default="skills")
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()
    name = {"skills": "TL_COLETA_SKILLS_V3", "itens": "TL_ITENS_V6", "maestrias": "TL_MEST_V7", "nucleos": "TL_NUC_V8", "especializacoes": "TL_ESP_V9", "coleta": "TL_COLETA_V9", "nucleo-teste": "TL_NUC_TESTE_V10"}[args.route]
    root = ET.Element("Macro")
    add(root, "Name", name)
    events = add(root, "MacroEvents")
    bar = event(events, "actionBar")
    add(add(bar, "recordProfile"), "mmtSetting", "1")
    add(bar, "selected", "false")

    if args.route == "nucleo-teste":
        # Calibração curta: já começa em Habilidades de Arma.
        # Apenas hover; nenhum clique ou tecla pode trocar a tela.
        pause(events, 5.0)
        for x, y in ((575, 407), (647, 407)):
            move(events, 1000, 900)
            pause(events, 0.3)
            hover_item(events, x, y)
        move(events, 1000, 900)
        pause(events, 2.0)
    elif args.route == "skills":
        # Começa em Habilidades, no preset ativo. Apenas consulta tooltips.
        pause(events, 5.0)
        for y in (747, 827):
            for x in (1035, 1102, 1168, 1237, 1302, 1379):
                move(events, x, y)
                pause(events, 3.0)
        for y in (748, 827):
            for x in (1733, 1807, 1880, 1953):
                move(events, x, y)
                pause(events, 3.0)
        click(events, 890, 155)  # abre a aba de especializações
        pause(events, 5.0)
    elif args.route == "itens":
        # Começa em Habilidades/especializações. Não equipa nem altera itens.
        pause(events, 5.0)
        key(events, 27, 1)  # Escape
        pause(events, 0.7)
        key(events, 80, 25)  # P: Informações de Personagem
        pause(events, 3.0)
        positions = [(970, 280), (795, 410)]  # armas principal e secundária
        positions += [(x, y) for y in (200, 286, 380, 464, 554, 648) for x in (1560, 1652)]
        positions += [(1652, 727)]
        for x, y in positions:
            hover_item(events, x, y)
        move(events, 1280, 900)
        pause(events, 4.0)
    elif args.route == "maestrias":
        # Começa na Maestria de Armas da Adaga. Somente hover nos nós;
        # o único clique seleciona a categoria Manoplas na barra lateral.
        pause(events, 5.0)
        move(events, 1000, 900)
        pause(events, 4.0)
        nodes = [(1225, 240), (1747, 240), (1360, 380), (1673, 313),
                 (1360, 620), (1676, 690), (1805, 177), (1805, 820)]
        for x, y in nodes:
            move(events, 1000, 900)
            pause(events, 0.2)
            hover_item(events, x, y)
        for x in (612, 690, 769, 842):
            move(events, 1000, 900)
            pause(events, 0.2)
            hover_item(events, x, 849)
        click(events, 496, 772)  # categoria Manoplas, fora da árvore
        move(events, 1000, 900)
        pause(events, 4.0)
        for x, y in nodes:
            move(events, 1000, 900)
            pause(events, 0.2)
            hover_item(events, x, y)
        move(events, 1000, 900)
        pause(events, 5.0)
    elif args.route == "especializacoes":
        pause(events, 5.0)
        specializations(events)
    else:
        # Começa em Habilidades, em qualquer uma das duas abas.
        pause(events, 5.0)
        click(events, 645, 155)  # Habilidades de Arma
        pause(events, 2.0)
        positions = [(575, 280), (647, 280),  # materiais
                     (575, 407), (647, 407), (575, 475), (647, 475),
                     (575, 597), (647, 597),  # pedra preciosa
                     (612, 711),  # guardião
                     (541, 848), (612, 848), (683, 848)]  # transcendência
        for x, y in positions:
            move(events, 1000, 900)
            pause(events, 0.25)
            hover_item(events, x, y)
        if args.route == "coleta":
            specializations(events)
        key(events, 27, 1)
        pause(events, 0.7)
        key(events, 80, 25)
        pause(events, 3.0)
        for x, y in ((1652, 269), (1560, 359)):
            move(events, 1280, 900)
            pause(events, 0.3)
            hover_item(events, x, y)
        move(events, 1280, 900)
        pause(events, 0.3)
        click(events, 713, 563)  # acesso visual aos detalhes do personagem
        pause(events, 8.0)

    add(root, "DelaySetting", "0")
    add(root, "Guid", str(uuid4()))
    add(root, "Version", "4")
    add(root, "MouseMoveType", "absolute")
    ET.indent(root, space="  ")
    destination = args.output or Path.home() / "Downloads" / f"{name}.xml"
    destination.parent.mkdir(parents=True, exist_ok=True)
    ET.ElementTree(root).write(destination, encoding="unicode", xml_declaration=False)
    print(destination)


if __name__ == "__main__":
    main()
