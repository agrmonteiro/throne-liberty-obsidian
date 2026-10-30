"""Regressões semânticas: descrição de suporte não vira cura por palavra isolada."""
import importlib.util
import json
from pathlib import Path

spec = importlib.util.spec_from_file_location('classifier', Path(__file__).resolve().parents[1]/'tools/unreal/classify-healing-descriptions.py')
classifier = importlib.util.module_from_spec(spec)
spec.loader.exec_module(classifier)


def kinds(text, language='en', groups=()):
    return set(classifier.classify({language: text}, groups)['categories'])


assert kinds('Increases Health Regen of allies by 100 for 12s.') == {'health_regen'}
assert kinds('Aumenta a Regeneração de Vida em 100.', 'pt') == {'health_regen'}
assert not kinds('Reduz a Regeneração de Vida dos inimigos em 20%.', 'pt') & classifier.HEALING
assert 'anti_heal' in kinds('Reduz a Regeneração de Vida dos inimigos em 20%.', 'pt')
assert not kinds('Restores Mana by consuming 10 Health.') & classifier.HEALING
assert kinds('Restores Mana by consuming 10 Health.') == {'mana_recovery', 'health_cost'}
assert not kinds('Increases Healing by 20%.') & classifier.HEALING
assert not kinds('Decreases incoming healing by 30%.') & classifier.HEALING
assert kinds('Grants a shield absorbing 20% of damage.') == {'shield'}
assert kinds('Restores an ally\'s Health equal to 100% of Base Damage.') == {'direct_heal'}
assert kinds('Restores Health by 5% of Melee Critical hits.') == {'lifesteal'}
assert kinds('Restaura Vida em 5% dos Acertos Críticos Corpo a Corpo.', 'pt') == {'lifesteal'}
assert kinds('Restores Health equal to 100% of Base Damage per sec for 6s.') == {'periodic_heal'}
assert kinds('Recupera Vida ao longo do tempo e aumenta a Regeneração de Vida.', 'pt') == {'periodic_heal', 'health_regen'}
assert kinds('Enquanto os dois efeitos estão ativos, o alvo se cura continuamente em 100% do Dano Base por segundo.', 'pt') == {'periodic_heal'}
assert kinds('While both effects are active, the target continuously heal 100% of Base Damage per sec.') == {'periodic_heal'}
assert kinds('Restaura Vida equivalente a $[Heal_Formula.tooltip1]% do Dano Base por segundo.', 'pt') == {'periodic_heal'}
assert not kinds('Reduz a recarga em $[Instant_Heal_Formula.tooltip1] segundos.', 'pt')
assert kinds('Restores Health.', groups={'Continuous_Heal'}) == {'periodic_heal'}
assert kinds('Restores Health.', groups={'Instant_Heal'}) == {'direct_heal'}
print('OK: regeneração, dano convertido em cura, cura direta/periódica, mana, consumo de Vida, escudos, modificadores e redução separados.')

catalog = Path(__file__).resolve().parents[1]/'tools/unreal/exports/26231302/healing-description-classification.json'
if catalog.exists():
    data = json.loads(catalog.read_text(encoding='utf-8'))
    records = {row['row']: row for row in data['records']}
    assert records['WP_BO_S_RegenHeal']['baseCategories'] == ['periodic_heal']
    assert records['WP_DA_Mastery_Normal_Assist']['baseCategories'] == ['lifesteal']
    assert 'direct_heal' in records['WP_WA_GR_S_Heal']['baseCategories']
    assert records['WP_BO_S_RegenAura_Hero']['baseCategories'] == ['health_regen', 'mana_recovery']
    assert records['SkillSet_WP_BO_S_RegenAura_Trait_1']['baseCategories'] == []
    assert 'periodic_heal' in records['SkillSet_WP_BO_S_RegenAura_Trait_1']['categories']
    assert records['SkillSet_WP_BO_S_RegenAura_Trait_1']['skillId'] is None
    assert len(data['skillCoverage']) == 16558
    print('OK: descrições reais PT/EN, referências de fórmula/efeito, especialização separada da base e cobertura explícita do catálogo completo.')
