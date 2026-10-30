"""Separa eventos fora da janela para não tratar ausência de captura como falha."""
import argparse
from datetime import datetime
from hashlib import sha256
import json
from pathlib import Path

parser = argparse.ArgumentParser()
parser.add_argument('--folder', type=Path, required=True)
args = parser.parse_args()
manifest = json.loads((args.folder/'manifest.json').read_text(encoding='utf-8'))
analysis = json.loads((args.folder/'analise-offline.json').read_text(encoding='utf-8'))
if analysis['log'] is None:
    raise ValueError('Validação exige log associado.')
start = datetime.fromisoformat(manifest['startedAtUtc']).timestamp()
end = datetime.fromisoformat(manifest['endedAtUtc']).timestamp()
matched = [e for e in analysis['matched'] if start <= e['time'] <= end]
missing = [e for e in analysis['unmatched'] if start <= e['time'] <= end]
before = [e for e in analysis['matched']+analysis['unmatched'] if e['time'] < start]
after = [e for e in analysis['matched']+analysis['unmatched'] if e['time'] > end]
result = dict(status='validacao_temporal', capture=args.folder.name,
              captureStartUtc=manifest['startedAtUtc'], captureEndUtc=manifest['endedAtUtc'],
              logEventsFull=analysis['logDamageEvents'], logDamageFull=analysis['logDamage'],
              eventsInside=len(matched)+len(missing), matchedInside=len(matched), missingInside=len(missing),
              logDamageInside=sum(e['damage'] for e in matched+missing),
              packetMatchedDamageInside=sum(e['damage'] for e in matched),
              eventsBefore=len(before), eventsAfter=len(after), damageAfter=sum(e['damage'] for e in after),
              criticalAgreementInside=sum(e['criticalCandidate']==bool(e['crit']) for e in matched),
              heavyAgreementInside=sum(bool(e['heavyCandidate'])==bool(e['heavy']) for e in matched),
              decoderSha256=sha256((Path(__file__).parent/'analisar-npcap-tl.py').read_bytes()).hexdigest(),
              limitations=['Janela usa início/fim do capturador; não é duração de combate ou janela de DPS.',
                           'Cobertura desta amostra não garante outras habilidades ou versões do protocolo.',
                           'Mensagens secundárias ainda inferem normal/sem pesado como na referência.'])
(args.folder/'validacao-janela.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps(result,ensure_ascii=True,indent=2))
