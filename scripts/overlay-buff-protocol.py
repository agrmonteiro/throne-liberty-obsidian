"""Candidatos de ciclo de estados, sem inferir presença por dano nem por ícone."""
MAX_SAFE = 2**53 - 1
OPCODES = {0x12344a7b: 'apply', 0x12344a7c: 'remove', 0x12344a7d: 'update'}


def parse(opcode, body, decoder):
    action = OPCODES.get(opcode)
    if not action:
        return None
    try:
        fields = decoder.protobuf(body)
        def scalar(key, required=True):
            values = fields.get(key, [])
            if not values and not required:
                return None
            if len(values) != 1 or not isinstance(values[0], int):
                raise ValueError('Campo ausente ou ambíguo')
            return values[0]
        shift = 3 if action == 'update' else 0
        effect = decoder.zigzag(scalar(1 + shift))
        source, target, cast = scalar(2 + shift), scalar(4 + shift), scalar(3 + shift)
        if not all(0 < value <= MAX_SAFE for value in (effect, source, target)):
            return None
        event = dict(action=action, effectId=effect, sourceId=source, targetId=target, castTokenRaw=str(cast),
                     opcode=hex(opcode), rawFieldNumbers=sorted(fields))
        if action == 'remove':
            serial = scalar(5, False)
            event['serialRaw'] = str(serial) if serial is not None else None
        else:
            duration, remaining, stacks = scalar(5 + shift), scalar(6 + shift), scalar(7 + shift)
            duration, remaining, stacks = map(decoder.zigzag, (duration, remaining, stacks))
            if not -1 <= duration <= MAX_SAFE or not -1 <= remaining <= MAX_SAFE or not 0 <= stacks <= MAX_SAFE:
                return None
            event.update(durationMsCandidate=duration, remainingMsCandidate=remaining, stackCountCandidate=stacks)
            skill = scalar(16 if action == 'update' else 12, False)
            event['skillIdCandidate'] = decoder.zigzag(skill) if skill is not None else None
            if action == 'apply':
                serial = scalar(10, False)
                event['serialRaw'] = str(serial) if serial is not None else None
            else:
                event.update(previousSerialRaw=str(scalar(13)), serialRaw=str(scalar(14)))
        return event
    except (ValueError, TypeError, IndexError, KeyError):
        return None


class Tracker:
    """Presença observada por conexão/alvo/serial; não expira timers inferidos."""
    def __init__(self):
        self.active = {}
        self.intervals = []

    def accept(self, event):
        key = (event['connectionId'], event['targetId'], event.get('serialRaw'))
        if key[2] is None:
            return dict(link='serial-unavailable')
        old_key = (key[0], key[1], event.get('previousSerialRaw', key[2]))
        old = self.active.get(old_key)
        matching = bool(old and old['effectId'] == event['effectId'] and old['sourceId'] == event['sourceId'])
        relation = 'matched' if matching else 'metadata-conflict' if old else 'new-application' if event['action'] == 'apply' else 'start-not-observed'
        if old and event['time'] < old['time']:
            return dict(link='out-of-order')
        if event['action'] == 'remove':
            if matching:
                self.active.pop(old_key)
                self.intervals.append(dict(connectionId=key[0], targetId=key[1], sourceId=event['sourceId'], effectId=event['effectId'],
                                           startedAt=old.get('startedAt'), endedAt=event['time'], lastUpdatedAt=old['time'],
                                           remainingMsCandidate=old.get('remainingMsCandidate'), complete=old.get('startedAt') is not None))
            return dict(link=relation)
        change = 'application' if event['action'] == 'apply' else 'update'
        if event['action'] == 'update' and matching:
            if event.get('stackCountCandidate') != old.get('stackCountCandidate'):
                change = 'stack-change-candidate'
            elif event.get('remainingMsCandidate', -1) >= 0:
                if event['remainingMsCandidate'] < event.get('durationMsCandidate', 0):
                    change = 'remaining-update-candidate'
                elif event['time'] - old['time'] > .25:
                    change = 'refresh-candidate'
        if old and event['action'] == 'update':
            self.active.pop(old_key)
        started = old.get('startedAt') if matching else event['time'] if event['action'] == 'apply' else None
        self.active[key] = dict(event, startedAt=started)
        return dict(link=relation, change=change, startedAt=started)

    def retire(self, connection_id):
        self.active = {key: value for key, value in self.active.items() if key[0] != connection_id}
