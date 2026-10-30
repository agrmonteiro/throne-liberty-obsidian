"""Compara o caminho incremental ao vivo com a captura validada offline."""
from collections import Counter
import importlib.util
import json
from pathlib import Path

here = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location('overlay_worker', here/'npcap-overlay-worker.py')
worker = importlib.util.module_from_spec(spec)
spec.loader.exec_module(worker)
folder = here.parent/'capturas_treinamento/npcap_tl/20261021-170507-516139'
reference = json.loads((folder/'analise-offline.json').read_text(encoding='utf-8'))
if reference.get('damageSchemaVersion', 1) < 2:
    reference['damageCandidates'] = [dict(e, sourceId=e['targetId'], targetId=e['sourceId']) for e in reference['damageCandidates']]
observed = []
identities = []
worker.emit = lambda message: (observed.append(message['event']) if message['type']=='damage' else identities.append(message) if message['type']=='identity' else None)
streams = {}
for packet in worker.decoder.packets(folder/'interface-4.pcap'):
    key = packet['source'],packet['dest']
    streams.setdefault(key,worker.Stream()).feed(packet['sequence'],packet['payload'],packet['time'])
signature = lambda e: (e['skillId'],e['damage'],e['sourceId'],e['criticalCandidate'],bool(e['heavyCandidate']))
assert Counter(map(signature,observed)) == Counter(map(signature,reference['damageCandidates']))
assert len(observed) == 661
assert sum(e['damage'] for e in observed) == 2986995
assert identities and all(e['sourceId']==26790374 and e['name']=='AgrMonteiro' for e in identities)
assert {e['sourceId'] for e in observed}=={26790374}
assert worker.player_identity(b'') is None
assert worker.player_identity(b'\x0a\x05x') is None
def vint(n):
    result=bytearray()
    while n>=128:
        result.append((n&127)|128);n>>=7
    return bytes(result)+bytes([n])
def field(k,v):
    return vint(k*8)+vint(v) if isinstance(v,int) else vint(k*8+2)+vint(len(v))+v
def profile(name=b'AgrMonteiro',source=26790374,kind=b'tribe.Pc'):
    inner=field(2,name)+field(19,source)+field(20,31320168)+field(26,kind)
    return field(1,field(1,inner))
assert worker.player_identity(profile())==dict(name='AgrMonteiro',sourceId=26790374)
for bad in (profile(name=b'bad\nname'),profile(name=b'\xff'),profile(source=0),profile(source=2**54),profile(kind=b'tribe.Npc')):
    assert worker.player_identity(bad) is None
# Retransmissões não podem duplicar eventos no caminho incremental.
seen_before = len(observed)
for packet in worker.decoder.packets(folder/'interface-4.pcap'):
    streams[(packet['source'],packet['dest'])].feed(packet['sequence'],packet['payload'],packet['time'])
assert len(observed) == seen_before
print('OK: decoder incremental reproduz os 661 eventos / 2.986.995 de dano; retransmissões ignoradas.')

observed.clear()
original_sleep=worker.time.sleep
try:
    worker.time.sleep=lambda _:None
    worker.replay(folder/'analise-offline.json',1000)
    assert len(observed)==661 and {e['sourceId'] for e in observed}=={26790374}
finally:
    worker.time.sleep=original_sleep
print('OK: reprodução de análise legada migra atacante/alvo sem alterar dano.')

# Um único boneco não revela troca entre atacante e alvo. Testar combate com seis alvos.
world = here.parent/'capturas_treinamento/npcap_tl/20261022-085801-488648'
if world.exists():
    import csv
    from datetime import datetime, timedelta, timezone
    observed.clear(); streams.clear()
    for packet in worker.decoder.packets(world/'interface-0.pcap'):
        key = packet['source'],packet['dest']
        streams.setdefault(key,worker.Stream()).feed(packet['sequence'],packet['payload'],packet['time'])
    with (world/'TLCombatLog-261022_085834.txt').open(encoding='utf-8-sig') as file:
        rows = [r for r in csv.reader(file) if len(r)>=10 and r[1]=='DamageDone' and r[8]=='AgrMonteiro' and int(r[4])>0]
    used=set(); matched=[]
    for row in rows:
        stamp=datetime.strptime(row[0],'%Y%m%d-%H:%M:%S:%f').replace(tzinfo=timezone(timedelta(hours=-3))).timestamp()
        choices=[(abs(e['time']-stamp),i,e) for i,e in enumerate(observed) if i not in used and e['damage']==int(row[4]) and e['skillId']==int(row[3]) and abs(e['time']-stamp)<=.5]
        assert choices, row
        _,i,e=min(choices,key=lambda x:x[0]); used.add(i); matched.append(e)
    assert len(matched)==127
    assert {e['sourceId'] for e in matched}=={17375758}
    assert len({e['targetId'] for e in matched})==6
    assert sum(e['damage'] for e in matched)==557501
    assert all(e['criticalCandidate']==bool(int(r[5])) and bool(e['heavyCandidate'])==bool(int(r[6])) for e,r in zip(matched,rows))
    print('OK: mundo aberto, 127/127 acertos, 557.501 de dano, um atacante e seis alvos; flags conferidas.')
