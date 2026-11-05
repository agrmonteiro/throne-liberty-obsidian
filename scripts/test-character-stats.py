"""Regressão dos atributos conferidos na ficha e do início de conexão retido até validar o TL."""
import importlib.util,json,struct
from pathlib import Path
root=Path(__file__).resolve().parent.parent
spec=importlib.util.spec_from_file_location('character_worker',root/'scripts/npcap-overlay-worker.py')
w=importlib.util.module_from_spec(spec);spec.loader.exec_module(w)
fixture=json.loads((root/'scripts/fixtures/character-stats.json').read_text(encoding='utf-8'))
values={}
for row in fixture['events']:
    parsed=w.decoder.character_stats(int(row['opcode'],16),bytes.fromhex(row['bodyHex']))
    assert parsed
    values.update({key:value['total'] for key,value in parsed['values'].items()})
assert {key:values[key] for key in fixture['expected']}==fixture['expected']
assert values['1']==67 and values['2']==130 and values['3']==114 and values['4']==90 and values['253']==22
assert values['14']==32380 and values['28']==20320
assert values['20']==4510 and values['21']==4508 and values['22']==4400
assert values['11']==14903 and values['196']==10170 and values['98']==5498 and values['111']==59
messages=[];w.emit=messages.append
sample=max(fixture['events'],key=lambda r:len(r['bodyHex']))
payload=bytes.fromhex(sample['bodyHex'])
frame=struct.pack('<II',(len(payload)+8)^w.decoder.FRAME_LENGTH_KEYS[1],int(sample['opcode'],16))+payload
frame += struct.pack('<II',8^w.decoder.FRAME_LENGTH_KEYS[1],0x1234746b)
for server in (False,True):
    messages.clear();stream=w.Stream('A',server);stream.feed(0,frame,1000);stream.feed(0,frame,1001)
    assert len([r for r in messages if r['type']=='character-stats'])==(1 if server else 0)
pending=w.PendingConnections((61731,));pending.offer(61731,50000,0,frame[:12],1000);pending.offer(61731,50000,12,frame[12:],1000.2)
pending.offer(60001,50001,0,b'unrelated',1000)
assert not pending.drain((50001,60001))
messages.clear();assert not messages
stream=w.Stream('validated',True)
for a,b,seq,payload,at in pending.drain((50000,61731)):stream.feed(seq,payload,at)
assert len([r for r in messages if r['type']=='character-stats'])==1
assert not pending.rows and pending.size==0
pending.offer(61731,50000,0,frame,1000);pending.expire(1006);assert not pending.rows
try:w.PendingConnections((61731,),1).offer(61731,50000,0,b'xx',1000)
except ValueError:pass
else:raise AssertionError('Buffer sem limite')
assert w.decoder.character_stats(0x12346e77,b'\xff') is None
assert w.decoder.character_stats(0x12344a7f,payload) is None
print(f'OK: {len(fixture["events"])} frames reais -> {len(values)} status; ficha, escalas, servidor/TCP, reconexão validada, expiração e limite do buffer.')

def uint(value):
    out=bytearray()
    while value>127:out.append((value&127)|128);value>>=7
    out.append(value);return bytes(out)
def field(key,value):
    return uint(key<<3)+uint(value) if isinstance(value,int) else uint((key<<3)|2)+uint(len(value))+value
# Estruturas observadas na mesma captura: perfil 1.1 e perfil de entrada 1.5.1.
profile=field(1,1896177)+field(2,b'AgrMonteiro')+field(19,fixture['sourceId'])+field(26,b'tribe.Pc')
for opcode,body in [(0x1234787f,field(1,field(1,profile))),(0x1234787d,field(1,field(5,field(1,profile))))]:
    assert w.player_identity(body,opcode)==dict(sourceId=fixture['sourceId'],name='AgrMonteiro')
    identity_frame=struct.pack('<II',(len(body)+8)^w.decoder.FRAME_LENGTH_KEYS[1],opcode)+body
    identity_frame+=struct.pack('<II',8^w.decoder.FRAME_LENGTH_KEYS[1],0x1234746b)
    for server in (False,True):
        messages.clear();w.Stream('profile',server).feed(0,identity_frame,1000)
        assert len([m for m in messages if m['type']=='identity'])==(1 if server else 0)
assert w.player_identity(field(1,field(5,field(1,profile))),0x1234787f) is None
assert w.player_identity(field(1,field(1,profile+field(19,7)))) is None
assert w.player_identity(field(1,field(1,profile.replace(b'tribe.Pc',b'tribe.Np')))) is None
print('OK: perfil nominal nos dois envelopes observados, somente servidor, sem campos duplicados nem entidade de NPC.')

# Exercita o loop real de captura: o filtro antigo não acompanhava outro túnel/PID.
class EndCapture(Exception): pass
class Function:
    def __init__(self, fn): self.fn=fn
    def __call__(self,*args): return self.fn(*args)
class TestEvent:
    def __init__(self): self.calls=0
    def wait(self,_): self.calls+=1;return self.calls>1
    def set(self): pass
class TestThread:
    def __init__(self,target,daemon): self.target=target
    def start(self): self.target()
class Directory:
    def close(self): pass
def endpoint(local,remote):return dict(LocalAddress='127.0.0.1',RemoteAddress='127.0.0.1',LocalPort=local,RemotePort=remote)
def filter_case(new_pid,new_remote):
    filters=[];emitted=[]
    created_pending=[]
    pending_class=w.PendingConnections
    def pending_factory(ports):
        value=pending_class(ports)
        if not created_pending:value.offer(61731,50001,0,frame,1000)
        created_pending.append(value)
        return value
    class Api:
        pcap_datalink=Function(lambda *_:0)
        pcap_open_live=Function(lambda *_:1)
        pcap_compile=Function(lambda _h,_p,expression,*_:filters.append(expression.decode()) or 0)
        pcap_setfilter=Function(lambda *_:0)
        pcap_freecode=Function(lambda *_:None)
        pcap_setnonblock=Function(lambda *_:0)
        pcap_close=Function(lambda *_:None)
        pcap_next_ex=Function(lambda *_:(_ for _ in ()).throw(EndCapture()))
    snapshots=iter([dict(pids=[1],tcp=[endpoint(50000,61731)]),dict(pids=[new_pid],tcp=[endpoint(50001,new_remote)])])
    saved=(w.capture.load_api,w.capture.endpoints,w.capture.interfaces,w.Event,w.Thread,w.emit,w.PendingConnections)
    try:
        w.capture.load_api=lambda:(Api(),Directory())
        w.capture.endpoints=lambda:next(snapshots)
        w.capture.interfaces=lambda _:[dict(name='Loopback test')]
        w.Event,w.Thread,w.emit=TestEvent,TestThread,emitted.append
        w.PendingConnections=pending_factory
        try:w.live((61731,))
        except EndCapture:pass
    finally:w.capture.load_api,w.capture.endpoints,w.capture.interfaces,w.Event,w.Thread,w.emit,w.PendingConnections=saved
    assert sum(row['type']=='connection-closed' for row in emitted)==1
    if new_remote!=61731:
        assert len(filters)==2 and f'port {new_remote}' in filters[-1] and '61731' not in filters[-1]
    else:
        assert any(row['type']=='character-stats' for row in emitted), 'Preservar início do fluxo até validar o novo PID'
filter_case(1,49793)
filter_case(2,61731)
print('OK: loop real troca a porta do túnel e aposenta conexões ao mudar o PID do TL.')
