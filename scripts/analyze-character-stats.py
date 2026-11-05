"""Consolida atributos observados por conexão e perfil nominal, sem preencher ausências com zero."""
import argparse
import importlib.util
import json
from pathlib import Path

HERE=Path(__file__).resolve().parent
def analyze(folder,player_name,output=None):
    spec=importlib.util.spec_from_file_location('character_reference',HERE/'build-overlay-reference.py')
    ref=importlib.util.module_from_spec(spec);spec.loader.exec_module(ref)
    worker=ref.worker;decoder=worker.decoder;original=decoder.frames
    clients=set()
    for line in (folder/'endpoint-snapshots.jsonl').read_text(encoding='utf-8').splitlines():
        for endpoint in json.loads(line)['endpoints']['tcp']:
            clients.add((endpoint['LocalAddress'],int(endpoint['LocalPort'])))
    streams,connections,active,states,profiles,errors,packets={},{},{},{},{},[],[]
    current=None;server=False
    def frames(data,counters,timestamp,depth=0,length_key=None):
        for at,opcode,body in original(data,counters,timestamp,depth,length_key):
            if depth==0 and server:
                if opcode in (0x1234787f,0x1234787d):
                    profile=decoder.player_identity(body,opcode)
                    if profile and profile['name']==player_name:
                        profiles.setdefault(current['id'],set()).add(profile['sourceId'])
                stats=decoder.character_stats(opcode,body)
                if stats:
                    state=states.setdefault(current['id'],dict(first=at,last=at,values={}))
                    for key,row in stats['values'].items():
                        if state['values'].get(key,{}).get('time',-1)<=at:state['values'][key]=dict(row,time=at)
                    state['last']=max(state['last'],at)
                    packets.append(dict(connectionId=current['id'],time=at,opcode=hex(opcode),path=stats['path'],bodyHex=body.hex()))
            yield at,opcode,body
    decoder.frames=frames;worker.emit=lambda _:None
    try:
        for part in json.loads((folder/'manifest.json').read_text(encoding='utf-8'))['parts']:
            try:
                for packet in ref.records(folder/part['file']):
                    if 'payload' not in packet:continue
                    a,b=packet['source'],packet['dest'];pair=tuple(sorted((a,b)))
                    syn=packet['flags']&2 and not packet['flags']&16
                    current=active.get(pair)
                    if current is None or syn and current.get('syn')!=packet['sequence']:
                        client=a if a in clients else b if b in clients else None
                        current=dict(id=f'tcp-{len(connections)+1:03d}',client=client,syn=packet['sequence'] if syn else None)
                        connections[current['id']]=current;active[pair]=current
                    server=current['client']==b
                    if current['client'] is not None and packet['payload']:
                        key=current['id'],a,b
                        stream=streams.setdefault(key,worker.Stream(current['id'],server))
                        try:stream.feed(packet['sequence'],packet['payload'],packet['time'])
                        except (ValueError,IndexError,AssertionError,TypeError) as error:
                            errors.append(dict(connectionId=current['id'],time=packet['time'],error=str(error)))
                            stream.__init__(current['id'],server)
                    if packet['flags']&5:active.pop(pair,None)
            except ValueError as error:errors.append(dict(error=str(error)))
    finally:decoder.frames=original
    snapshots=[]
    for connection,state in states.items():
        names=profiles.get(connection,set())
        if len(names)!=1:continue
        source=next(iter(names))
        snapshots.append(dict(id=f'{folder.name}:{connection}',captureId=folder.name,connectionId=connection,sourceId=source,playerName=player_name,
                              firstObservedAt=state['first'],observedAt=state['last'],values=state['values'],origin='pcap',observedOnly=True))
    snapshots.sort(key=lambda row:row['observedAt'],reverse=True)
    output=output or folder/'character-stats-analysis';output.mkdir(parents=True,exist_ok=True)
    result=dict(schemaVersion=1,snapshots=snapshots[:5])
    (output/'snapshots.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    with (output/'packets.jsonl').open('w',encoding='utf-8') as file:
        for row in packets:file.write(json.dumps(row)+'\n')
    summary=dict(output=str(output),packets=len(packets),snapshots=[dict(connectionId=row['connectionId'],sourceId=row['sourceId'],playerName=row['playerName'],fields=len(row['values'])) for row in snapshots],
                 unboundConnections=[key for key in states if len(profiles.get(key,set()))!=1],errors=errors)
    (output/'summary.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps(summary,ensure_ascii=True));return result

if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--folder',type=Path,required=True)
    parser.add_argument('--player-name',required=True);parser.add_argument('--output',type=Path)
    args=parser.parse_args();analyze(args.folder,args.player_name,args.output)
