"""Pré-voo e captura passiva filtrada; sem escrever na rede ou no jogo."""
import argparse
import ctypes as C
import ipaddress
import json
import os
from pathlib import Path
import subprocess
import time
from datetime import datetime, timezone

ROOT = Path(__file__).resolve().parents[1]
SCHEDULE = [(0, 'Parado, alvo selecionado, ataque automático desligado'),
            (15, 'Pressione = uma vez (Luar)'), (16, 'Pressione = novamente, durante a recarga se ativou'),
            (35, 'Pressione - uma vez (Umbral)'), (36, 'Pressione - novamente, durante a recarga se ativou'),
            (55, 'Pressione 4 uma vez (Golpe Sombrio)'), (56, 'Pressione 4 novamente'),
            (75, 'Pressione 6 uma vez (Fenda)'), (76, 'Pressione 6 novamente: pode ser uso consecutivo válido'),
            (95, 'Não pressione mais habilidades'), (100, 'Fim: encerre o log de combate')]


class Interface(C.Structure):
    pass


Interface._fields_ = [('next', C.POINTER(Interface)), ('name', C.c_char_p),
                     ('description', C.c_char_p), ('addresses', C.c_void_p), ('flags', C.c_uint)]


class Program(C.Structure):
    _fields_ = [('length', C.c_uint), ('instructions', C.c_void_p)]


def load_api():
    folder = Path(os.environ['WINDIR']) / 'System32/Npcap'
    directory = os.add_dll_directory(str(folder))
    api = C.CDLL(str(folder / 'wpcap.dll'))
    specs = {
        'pcap_lib_version': (C.c_char_p, []),
        'pcap_findalldevs': (C.c_int, [C.POINTER(C.POINTER(Interface)), C.c_char_p]),
        'pcap_freealldevs': (None, [C.POINTER(Interface)]),
        'pcap_open_live': (C.c_void_p, [C.c_char_p, C.c_int, C.c_int, C.c_int, C.c_char_p]),
        'pcap_open_dead': (C.c_void_p, [C.c_int, C.c_int]),
        'pcap_close': (None, [C.c_void_p]),
        'pcap_compile': (C.c_int, [C.c_void_p, C.POINTER(Program), C.c_char_p, C.c_int, C.c_uint]),
        'pcap_setfilter': (C.c_int, [C.c_void_p, C.POINTER(Program)]),
        'pcap_freecode': (None, [C.POINTER(Program)]),
        'pcap_setnonblock': (C.c_int, [C.c_void_p, C.c_int, C.c_char_p]),
        'pcap_geterr': (C.c_char_p, [C.c_void_p]),
        'pcap_next_ex': (C.c_int, [C.c_void_p, C.POINTER(C.c_void_p), C.POINTER(C.c_void_p)]),
        'pcap_dump_open': (C.c_void_p, [C.c_void_p, C.c_char_p]),
        'pcap_dump': (None, [C.c_void_p, C.c_void_p, C.c_void_p]),
        'pcap_dump_close': (None, [C.c_void_p]),
        'pcap_dump_flush': (C.c_int, [C.c_void_p]),
    }
    for name, (result, arguments) in specs.items():
        fn = getattr(api, name)
        fn.restype, fn.argtypes = result, arguments
    return api, directory


def interfaces(api):
    head = C.POINTER(Interface)()
    error = C.create_string_buffer(256)
    if api.pcap_findalldevs(C.byref(head), error):
        raise RuntimeError(error.value.decode(errors='replace'))
    result = []
    try:
        pointer = head
        while pointer:
            item = pointer.contents
            result.append(dict(name=item.name.decode(), description=(item.description or b'').decode(errors='replace'), flags=item.flags))
            pointer = item.next
    finally:
        api.pcap_freealldevs(head)
    return result


def endpoints():
    script = """
$ErrorActionPreference='Stop'
$taskPids=@(Get-Process -Name TL -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Id)
if ($taskPids.Count -eq 0) { throw 'Abra o TL no personagem antes do pre-voo.' }
$taskTcp=@(Get-NetTCPConnection -State Established | Where-Object { $_.OwningProcess -in $taskPids } | Select-Object LocalAddress,LocalPort,RemoteAddress,RemotePort)
$taskUdp=@(Get-NetUDPEndpoint | Where-Object { $_.OwningProcess -in $taskPids } | Select-Object LocalAddress,LocalPort)
@{pids=$taskPids;tcp=$taskTcp;udp=$taskUdp} | ConvertTo-Json -Depth 4 -Compress
"""
    r = subprocess.run(['powershell', '-NoProfile', '-NonInteractive', '-Command', script], capture_output=True, text=True,
                       creationflags=getattr(subprocess, 'CREATE_NO_WINDOW', 0))
    if r.returncode:
        raise RuntimeError(r.stderr.strip())
    return json.loads(r.stdout)


def filter_expression(data):
    terms = []
    for e in data['tcp']:
        remote = ipaddress.ip_address(e['RemoteAddress'].split('%')[0])
        terms.append(f"(tcp and host {remote} and port {int(e['LocalPort'])} and port {int(e['RemotePort'])})")
    for e in data['udp']:
        # UDP: Windows expõe porta local, mas não o destino remoto por processo.
        terms.append(f"(udp and port {int(e['LocalPort'])})")
    if not terms:
        raise RuntimeError('TL sem conexões identificadas; não será usada captura ampla como alternativa.')
    return ' or '.join(sorted(set(terms)))


def utc():
    return datetime.now(timezone.utc).isoformat()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--capture', action='store_true', help='Sem esta opção, somente prepara: não captura pacotes.')
    parser.add_argument('--duration', type=int, default=180, choices=range(110,301), metavar='110..300', help='Janela de captura; a macro Razer dura 110 s após o botão.')
    parser.add_argument('--device', action='append', help='Nome exato retornado no pré-voo; repetir para várias interfaces.')
    args = parser.parse_args()
    api, directory = load_api()
    devices = interfaces(api)
    data = endpoints()
    expression = filter_expression(data)
    # Compilar em handle offline verifica a sintaxe sem abrir interface de rede.
    dead = api.pcap_open_dead(1, 65535)
    if not dead:
        raise RuntimeError('Não foi possível criar validador offline.')
    program = Program()
    try:
        if api.pcap_compile(dead, C.byref(program), expression.encode(), 1, 0xffffffff):
            raise RuntimeError(api.pcap_geterr(dead).decode(errors='replace'))
        api.pcap_freecode(C.byref(program))
    finally:
        api.pcap_close(dead)
    out = ROOT / 'capturas_treinamento/npcap_tl' / datetime.now().strftime('%Y%m%d-%H%M%S-%f')
    out.mkdir(parents=True)
    manifest = dict(status='preparado_sem_captura', preparedAtUtc=utc(),
                    npcapVersion=api.pcap_lib_version().decode(), endpoints=data,
                    filter=expression, interfaces=devices, manualScheduleReference=SCHEDULE,
                    captureDurationSec=args.duration, macroTriggerUtc=None,
                    limitations=['Filtro por endpoints, não atribuição perfeita de pacotes por processo.',
                                 'Conexões novas após o pré-voo podem ficar fora do filtro.',
                                 'ExitLag pode encapsular tráfego e impedir sua visibilidade na interface física.',
                                 'Pacotes duplicados entre interfaces não equivalem a eventos duplicados.'])
    path = out / 'manifest.json'
    path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding='utf-8')
    print(json.dumps(dict(output=str(out), status=manifest['status'], interfaces=devices,
                          tcpEndpoints=len(data['tcp']), udpEndpoints=len(data['udp']), filterValidated=True), ensure_ascii=True), flush=True)
    if not args.capture:
        return
    selected = [d for d in devices if d['name'] in args.device] if args.device else [
        d for d in devices if d['flags'] & 2 and (not d['flags'] & 32 or d['flags'] & 1)]
    if not selected or (args.device and len(selected) != len(set(args.device))):
        raise RuntimeError('Interface solicitada não encontrada.')
    opened = []
    error = C.create_string_buffer(256)
    manifest['startedAtUtc'] = utc()
    try:
        for index, d in enumerate(selected):
            handle = api.pcap_open_live(d['name'].encode(), 65535, 0, 100, error)
            if not handle:
                manifest.setdefault('interfaceErrors', []).append(dict(name=d['name'], error=error.value.decode(errors='replace')))
                continue
            try:
                program = Program()
                if api.pcap_compile(handle, C.byref(program), expression.encode(), 1, 0xffffffff):
                    raise RuntimeError(api.pcap_geterr(handle).decode(errors='replace'))
                try:
                    if api.pcap_setfilter(handle, C.byref(program)):
                        raise RuntimeError(api.pcap_geterr(handle).decode(errors='replace'))
                finally:
                    api.pcap_freecode(C.byref(program))
                if api.pcap_setnonblock(handle, 1, error):
                    raise RuntimeError(error.value.decode(errors='replace'))
                file = out / f'interface-{index}.pcap'
                dump = api.pcap_dump_open(handle, os.fsencode(file))
                if not dump:
                    raise RuntimeError(api.pcap_geterr(handle).decode(errors='replace'))
            except Exception:
                api.pcap_close(handle)
                raise
            opened.append(dict(handle=handle, dump=dump, file=file, name=d['name'], packets=0))
        if not opened:
            raise RuntimeError('Nenhuma interface disponível. Não haverá captura sem filtro.')
        manifest['status'] = 'capturando'
        start = time.monotonic()
        markers = []
        print('Captura ativa. Acione a macro Razer uma vez; alinhar o disparo real pelo video.', flush=True)
        while time.monotonic()-start < args.duration:
            for item in opened:
                for _ in range(100):
                    header, payload = C.c_void_p(), C.c_void_p()
                    status = api.pcap_next_ex(item['handle'], C.byref(header), C.byref(payload))
                    if status == 0:
                        break
                    if status != 1:
                        raise RuntimeError(api.pcap_geterr(item['handle']).decode(errors='replace'))
                    api.pcap_dump(item['dump'], header, payload)
                    item['packets'] += 1
                api.pcap_dump_flush(item['dump'])
                if item['file'].stat().st_size > 25*1024*1024:
                    raise RuntimeError('Limite de 25 MiB por interface atingido; coleta encerrada.')
            time.sleep(.01)
        markers.append(dict(elapsedSec=time.monotonic()-start, utc=utc(), cue='Fim da janela de captura; nao e o horario do fim da macro'))
        print(json.dumps(markers[-1], ensure_ascii=True), flush=True)
        manifest.update(status='captura_concluida', markers=markers, elapsedSec=time.monotonic()-start)
    except BaseException as e:
        manifest.update(status='captura_interrompida', error=str(e))
        raise
    finally:
        manifest['endedAtUtc'] = utc()
        manifest['files'] = []
        for item in opened:
            api.pcap_dump_close(item['dump'])
            api.pcap_close(item['handle'])
            manifest['files'].append(dict(name=item['name'], file=str(item['file']), packets=item['packets'], bytes=item['file'].stat().st_size))
        path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding='utf-8')
        directory.close()


if __name__ == '__main__':
    main()
