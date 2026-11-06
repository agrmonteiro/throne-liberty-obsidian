import importlib.util
import json
from pathlib import Path
import tempfile

root = Path(__file__).resolve().parent.parent
spec = importlib.util.spec_from_file_location('group_analysis', root/'scripts/analyze-group-overlay.py')
module = importlib.util.module_from_spec(spec); spec.loader.exec_module(module)
folder = Path(tempfile.mkdtemp(prefix='throne-group-analysis-'))
source, output = folder/'events.jsonl', folder/'result.json'
def hit(conn, actor, target, skill, damage, direction='server-to-client'):
    return {'type':'damage', 'connectionId':conn, 'raw':{'direction':direction},
            'event':{'sourceId':actor,'targetId':target,'skillId':skill,'damage':damage,'time':1000}}
events = [hit('A',7,8,10,100), hit('A',7,8,11,200), hit('A',7,9,10,50),
          hit('A',7,None,10,25), hit('A',8,7,12,80), hit('A',7,8,10,999,'client-to-server'),
          {'type':'identity','connectionId':'A','sourceId':7,'name':'Jogador A'},
          {'type':'identity','connectionId':'B','sourceId':7,'name':'Jogador B'}, hit('B',7,8,10,33),
          {'type':'npc','connectionId':'A','sourceId':8,'npcId':10212035}]
source.write_text(''.join(json.dumps(row)+'\n' for row in events),encoding='utf8')
module.analyze(source,output)
result = json.loads(output.read_text(encoding='utf8'))
conns = {row['connectionId']:row for row in result['connections']}
a = next(row for row in conns['A']['sources'] if row['id']==7)
b = conns['B']['sources'][0]
assert (a['name'],a['damage'],a['hits']) == ('Jogador A',375,4)
assert (b['name'],b['damage']) == ('Jogador B',33)
assert sum(row['damage'] for row in a['skills']) == 375
assert sum(row['damage'] for row in a['targets']) == 375
assert next(row for row in a['targets'] if row['id']==8)['name'] == 'Guarda do Apóstolo'
assert len(next(row for row in a['targets'] if row['id']==8)['skills']) == 2
assert next(row for row in a['targets'] if row['id'] is None)['damage'] == 25
assert result['counts']['damageExcludedDirection'] == 1
assert not result['errors']
print('OK: origens e nomes por conexão; alvos, habilidades, perfis tardios, direção e valores desconhecidos.')
