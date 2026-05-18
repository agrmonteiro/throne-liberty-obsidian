# Estrutura de Maestrias de Armas (Weapon Mastery)
Este documento detalha a estrutura de Maestria de Armas extraída do tlcodex.com para ser implementada no aplicativo.

## Resumo do Sistema
- **Armas Disponíveis**: Existem 9 tipos de armas no sistema.
- **Estrutura da Árvore**: Cada arma possui uma árvore com diferentes `ramos` (paths/branches). Tradicionalmente são 3 ramos (índices 1, 2 e 3), mas atualizações recentes adicionaram novos nós especiais (índices 5).
- **Colunas/Níveis**: Os nós progridem da coluna 1 até a coluna 8 (ou mais) ao longo do ramo.
- **Tipos de Nós**:
  - **Nós de Status Simples**: Oferecem aumentos fixos de atributos (ex: Aumento de Velocidade de Ataque).
  - **Nós de Habilidade/Passiva (Skill Nodes)**: São nós maiores que possuem níveis que escalam conforme você investe pontos. Estes estão detalhados em uma estrutura separada (`nodeskills`).

## Modelo de Dados para o App
```typescript
interface MasteryNode {
  id: string;
  column: number; // A posição horizontal do nó
  branch: number; // O ramo ao qual pertence (1, 2, 3...)
  stat_index: number; // Índice interno do status
  name: string; // Nome do nó (ex: Lesser Attack Speed Augment)
  description: string; // Descrição base do nó
  cost_category: number;
  skill_levels?: Record<number, string>; // Se for uma passiva que sobe de nível, mapa de Nível -> Descrição do Efeito
}

interface WeaponMasteryTree {
  weapon_id: string;
  weapon_name: string;
  nodes: MasteryNode[];
}
```

## Árvore de Maestria por Arma

### Longbow (ID: 1)
#### Ramo 1
- **Col 1** | Lesser Attack Range Augment (ID: 10121)
  - *Increases Attack Range.*
- **Col 1** | Ranged Critical Hit Intensity (ID: 10122)
  - *Increases Ranged Critical Hit Chance, but decreases Melee Heavy Attack Evasion.*
- **Col 1** | Far Sight (ID: 20037)
  - *Sniper's Sense now increases the Magic, Melee, and Ranged Critical Hit Chance by 20% on targets at least 6m away, but the effect no longer applies to attacking targets under 6m.*
- **Col 2** | Base Damage Expertise (ID: 10123)
  - *Increases Base Damage and Mana Cost Efficiency. Base Damage increases from Lv. 5.*
- **Col 3** | Lesser Mana Regen Augment (ID: 10124)
  - *Increases Mana Regen.*
- **Col 3** | Focus on Skill Healing over Time (ID: 10125)
  - *Increases Skill Healing over Time, but decreases Weaken Resistance.*
- **Col 3** | Wind Rush (ID: 20038)
  - *Whirlpool's Cooldown Speed additionally increases by 10%, but the total amount of Healing decreases by 8%.*
- **Col 4** | Magic Defense Expertise (ID: 10126)
  - *Increases Buff Duration and Magic Defense.*
- **Col 5** | Lesser Debuff Duration Augment (ID: 10127)
  - *Decreases Debuff Duration.*
- **Col 5** | Max Health Intensity (ID: 10128)
  - *Increases Max Health, but decreases Ranged Hit Chance.*
- **Col 5** | Life Ward (ID: 20039)
  - *Devoted Shield now additionally increases Health Regen by 5000 for 3s on effect activation.*
- **Col 6** | Skill Damage Resistance Expertise (ID: 10129)
  - *Increases Skill Damage Resistance and Bind Chance.*
- **Col 7** | Lesser Cooldown Speed Augment (ID: 10130)
  - *Increases Cooldown Speed.*
- **Col 7** | Movement Speed Intensity (ID: 10131)
  - *Increases Movement Speed, but decreases Targeted Skill Healing over Time.*
- **Col 7** | Combat Sanctuary (ID: 20040)
  - *Distorted Sanctuary now increases Magic, Melee, and Ranged Hit Chance by 40 and increases Attack Range by 0.7%, instead of the Endurance and Continuous Health Recovery effects of the skill.*
- **Col 8** | Ranged Hit Expertise (ID: 10132)
  - *Increases Ranged Hit Chance and Bonus Damage.*


#### Ramo 2
- **Col 1** | Ranged Critical Hit Augment (ID: 10133)
  - *Increases Ranged Critical Hit Chance.*
- **Col 1** | Critical Damage Intensity (ID: 10134)
  - *Increases Critical Damage, but decreases Melee Endurance.*
- **Col 1** | Roxie's Arrow Storm (ID: 20041)
  - *Roxie's Arrowhead now has a base activation chance of 10%, and will shoot additional arrows at up to 2 targets within 3m around the user when activated.<br><br><c=@UI_TXT_Red_Disable>Does not apply additional effects from the additional projectiles.</span>*
- **Col 2** | Ranged Heavy Attack Expertise (ID: 10135)
  - *Increases Ranged Heavy Attack Chance and Mana Regen.*
- **Col 3** | Mana Cost Efficiency Augment (ID: 10136)
  - *Increases Mana Cost Efficiency.*
- **Col 3** | Max Stamina Intensity (ID: 10137)
  - *Increases Max Stamina, but decreases Bind Chance.*
- **Col 3** | Survival Mend (ID: 20042)
  - *Earth's Blessing now restores Health by 28% of Base Damage + 4 Damage for 5s when using Longbow Survival skills.*
- **Col 4** | Damage Resistance Expertise (ID: 10138)
  - *Increases Skill Damage Resistance and Health Regen.*
- **Col 5** | Critical Damage Resistance Augment (ID: 10139)
  - *Increases Critical Damage Resistance.*
- **Col 5** | Magic Evasion Intensity (ID: 10140)
  - *Increases Magic Evasion, but decreases Ranged Critical Hit Chance.*
- **Col 5** | Sniper's Trap (ID: 20043)
  - *Steady Aim now has a 10% chance to Bind opponents from Longbow Active Skills for 3s if the user stands still for 3s. Applies Oppression instead to Boss monsters for the same duration. Can be activated up to 3 times per skill and has a 20-second cooldown.*
- **Col 6** | Heavy Attack Evasion Expertise (ID: 10141)
  - *Increases Magic, Melee, and Ranged Heavy Attack Evasion and Stun Resistance.*
- **Col 7** | CC Resistance Augment (ID: 10142)
  - *Increases all CC Resistance.*
- **Col 7** | Collision Intensity (ID: 10143)
  - *Increases Collision Chance, but decreases Health Regen.*
- **Col 7** | Battle Tempo (ID: 20044)
  - *Rapidfire Stance's Attack Speed increase is boosted by 20%, but activates after 4s of being stationary.*
- **Col 8** | Max Damage Expertise (ID: 10144)
  - *Increases Max Damage and Max Mana. Max Damage increases from Lv. 4. *


#### Ramo 3
- **Col 1** | Greater Attack Speed Augment (ID: 10145)
  - *Increases Attack Speed.*
- **Col 1** | Skill Damage Boost Intensity (ID: 10146)
  - *Increases Skill Damage Boost, but decreases Max Health. *
- **Col 1** | Bullseye Hunter (ID: 20045)
  - *Every time you apply Bullseye, Ranged Critical Hit Chance increases by 30 for 3s. Stacks up to 10 times. The Critical Hit Chance Increase effect is removed on Bullseye consumption.*
- **Col 2** | Ranged Hit Expertise (ID: 10147)
  - *Increases Ranged Hit Chance and Health Regen.*
- **Col 3** | Greater Cooldown Speed Augment (ID: 10148)
  - *Increases Cooldown Speed.*
- **Col 3** | Buff Duration Intensity (ID: 10149)
  - *Increases Buff Duration, but decreases Silence Resistance.*
- **Col 3** | Blessing of Wisdom (ID: 20046)
  - *Cooldown Speed increases by 10% when the user's Wisdom is 80 or higher.<br>However, Healing increases by 10% when the user's Wisdom is below 80.*
- **Col 4** | Max Health Expertise (ID: 10150)
  - *Increases Max Health and Mana Regen.*
- **Col 5** | Greater Evasion Augment (ID: 10151)
  - *Increases Magic, Melee, and Ranged Evasion.*
- **Col 5** | Skill Damage Resistance Intensity (ID: 10152)
  - *Increases Skill Damage Resistance, but decreases Attack Speed.*
- **Col 5** | Keen Reflexes (ID: 20047)
  - *Increases Melee Evasion by 24 and Melee Endurance by 24 for every 10 Perception.*
- **Col 6** | Magic Endurance Expertise (ID: 10153)
  - *Increases Magic Endurance and Bind Chance.*
- **Col 7** | Greater Bind Duration Augment (ID: 10154)
  - *Bind Duration increases by <span class="light_green_text">0.08s</span>.*
  - **Níveis da Passiva**: O efeito melhora por nível (1 ao 16+).
- **Col 7** | CC Resistance Intensity (ID: 10155)
  - *Increases all CC Resistances, but decreases Amitoi Heal.*
- **Col 7** | Archer's Surge (ID: 20048)
  - *Longbow Survival skills now add 5 Base Damage to their effects to their targets for 6s. Stacks up to 3 times.*
- **Col 8** | Ranged Critical Expertise (ID: 10156)
  - *Increases Ranged Critical Hit Chance and Attack Range.*


#### Ramo 5
- **Col 1** | Lethal Stacks (ID: 10157)
  - *Deadly Marker now applies 10 stacks of Bullseye to the target. Consuming Bullseye now has a <span class="light_green_text">11%</span> chance of reapplying the consumed number of Bullseye stacks to the target. *
  - **Níveis da Passiva**: O efeito melhora por nível (1 ao 16+).
- **Col 3** | Rhythmical Shooting (ID: 10158)
  - *Every time you use the different skill from the skill that you used right before, the main weapon damage increases by <span class="light_green_text">3</span> for 3 seconds. Stacks up to 5 times. *
  - **Níveis da Passiva**: O efeito melhora por nível (1 ao 16+).
- **Col 5** | Punishing Grip (ID: 10159)
  - *Taking Melee Damage has a(n) <span class="light_green_text">8.8%</span> chance to Bind the opponent for 3s. Applies Oppression instead to Boss monsters for the same duration. Has a 60-second cooldown.*
  - **Níveis da Passiva**: O efeito melhora por nível (1 ao 16+).
- **Col 7** | Range Reducer (ID: 10160)
  - *Successfully hitting a target with a Longbow Control Skill decreases the target's Attack Range by 2.5% for <span class="light_green_text">2.2s</span>. Does not apply to monsters.*
  - **Níveis da Passiva**: O efeito melhora por nível (1 ao 16+).


### Greatsword (ID: 3)
#### Ramo 1
- **Col 1** | Lesser Greatsword Max Damage Augment (ID: 10081)
  - *Increases Greatsword Max Damage.*
- **Col 1** | Melee Critical Hit Intensity (ID: 10082)
  - *Increases Melee Critical Hit Chance, but decreases Magic Endurance.*
- **Col 1** | Power Grip (ID: 20013)
  - *Robust Constitution now increases Base Damage by up to 24 proportional to the skill's growth tier, but decreases the Health Increase of the skill by 50%.*
- **Col 2** | Melee Hit Expertise (ID: 10083)
  - *Increases Melee Hit Chance and Stamina Regen.*
- **Col 3** | Lesser Mana Regen Augment (ID: 10084)
  - *Increases Mana Regen.*
- **Col 3** | Cooldown Speed Intensity (ID: 10085)
  - *Increases Skill Cooldown Speed, but decreases Mana Cost Efficiency.*
- **Col 3** | Force Capacity (ID: 20014)
  - *Increases Vital Force's maximum Health limit to 36,000.*
- **Col 4** | Melee Endurance Expertise (ID: 10086)
  - *Increases Melee Endurance and Mana Regen.*
- **Col 5** | Lesser Melee Defense Augment (ID: 10087)
  - *Increases Melee Defense.*
- **Col 5** | Damage Resistance Intensity (ID: 10088)
  - *Increases Skill Damage Resistance, but decreases Melee Critical Hit Chance.*
- **Col 5** | Steel Sacrifice (ID: 20015)
  - *The increased Defense from Indomitable Armor is boosted by 50%, but Melee Heavy Attack Chance decreases by 100.*
- **Col 6** | Collision Resistance Expertise (ID: 10089)
  - *Increases Collision Resistance and Ranged Defense.*
- **Col 7** | Lesser Stun Augment (ID: 10090)
  - *Increases Stun Chance.*
- **Col 7** | Collision Intensity (ID: 10091)
  - *Increases Collision Chance, but decreases Mana Regen.*
- **Col 7** | Steadfast Rush (ID: 20016)
  - *Barbarian's Dash now increases all CC Resistance by 120 while the effect is active.*
- **Col 8** | Collision Chance Offensive (ID: 10092)
  - *Increases Collision Chance and Melee Hit Chance.*


#### Ramo 2
- **Col 1** | Melee Critical Hit Augment (ID: 10093)
  - *Increases Melee Critical Hit Chance.*
- **Col 1** | Melee Damage Intensity (ID: 10094)
  - *Increases Greatsword Melee Damage, but decreases Melee Defense.*
- **Col 1** | Reckless Assault (ID: 20017)
  - *Raging Frenzy now increases the Skill Damage Boost Efficiency by 50%, but decreases Defense by 200.*
- **Col 2** | Melee Heavy Attack Expertise (ID: 10095)
  - *Increases Melee Heavy Attack Chance and Buff Duration.*
- **Col 3** | Health Regen Augment (ID: 10096)
  - *Increases Health Regen.*
- **Col 3** | Buff Duration Intensity (ID: 10097)
  - *Increases Debuff Duration, but decreases Weaken Chance.*
- **Col 3** | Dauntless Recovery (ID: 20018)
  - *Victor's Morale now restores 1% of the Skill Damage as Health.*
- **Col 4** | CC Resistance Expertise (ID: 10098)
  - *Increases CC Resistance and Ranged Defense.*
- **Col 5** | Healing Received Augment (ID: 10099)
  - *Increases Healing Received.*
- **Col 5** | Damage Reduction Intensity (ID: 10100)
  - *Increases Damage Reduction, but decreases Attack Range.*
- **Col 5** | Vital Conversion (ID: 20019)
  - *Converts Vital Force's effects into defensive bonuses, granting Evasion, Stun Resistance, and Skill Damage Resistance. Granted Evasion is equal to 43% of Vital Force's increased Hit Chance.*
- **Col 6** | Max Health Expertise (ID: 10101)
  - *Increases Max Stamina and Max Health. Max Stamina increases from Lv. 3.*
- **Col 7** | Stun Duration Augment (ID: 10102)
  - *Increases <span class="yellow_text">Stun</span> Duration by 0.04s.*
  - **Níveis da Passiva**: O efeito melhora por nível (1 ao 16+).
- **Col 7** | Collision Resistance Intensity (ID: 10103)
  - *Increases Collision Resistance, but decreases Potion Healing.*
- **Col 7** | Binding Warrior (ID: 20020)
  - *Cold Warrior now also applies to Bound targets.*
- **Col 8** | Bind Expertise (ID: 10104)
  - *Increases Bind Resistance and Magic, Melee, and Ranged Critical Hit Chance.*


#### Ramo 3
- **Col 1** | Greater Melee Hit Augment (ID: 10105)
  - *Increases Melee Hit Chance.*
- **Col 1** | Melee Heavy Attack Intensity (ID: 10106)
  - *Increases Melee Heavy Attack Chance, but decreases Magic, Melee, and Ranged Endurance.*
- **Col 1** | Far Strike (ID: 20021)
  - *Increases the AOE range of Devastating Smash, Frost Cleaving, and Ice Tornado by 2m.*
- **Col 2** | Heavy Attack Expertise (ID: 10107)
  - *Increases Magic, Melee, and Ranged Heavy Attack, and Mana Cost Efficiency.*
- **Col 3** | Greater Species Damage Augment (ID: 10108)
  - *Increases all Species Damage Boost.*
- **Col 3** | Buff Duration Intensity (ID: 10109)
  - *Increases Buff Duration, but decreases Petrification Resistance.*
- **Col 3** | Extended Reach (ID: 20022)
  - *Increases the range of Precision Dash, Charging Slash, and Devastating Smash by 20%.*
- **Col 4** | Ranged Endurance Expertise (ID: 10110)
  - *Increases Ranged Endurance and Mana Regen.*
- **Col 5** | Greater Evasion Augment (ID: 10111)
  - *Increases Magic, Melee, and Ranged Evasion.*
- **Col 5** | Evasion Intensity (ID: 10112)
  - *Increases Magic, Melee, and Ranged Heavy Attack Evasion, but decreases Melee Hit Chance.*
- **Col 5** | Fortified Unity (ID: 20023)
  - *DaVinci's Courage, DaVinci's Chill, Blood Devotion, and Devoted Sanctuary increase all Defense of their targets by 300.*
- **Col 6** | Bind Resistance Expertise (ID: 10113)
  - *Increases Bind Resistance and Max Health.*
- **Col 7** | Greater Stun Augment (ID: 10114)
  - *Increases Stun Chance.*
- **Col 7** | Attack Speed Intensity (ID: 10115)
  - *Increases Attack Speed, but decreases CC Resistance.*
- **Col 7** | Swift Execution (ID: 20024)
  - *Death Blow and Willbreaker can now be used while moving.*
- **Col 8** | Damage Increase Expertise (ID: 10116)
  - *Increases Skill Damage Boost and Buff Duration.*


#### Ramo 5
- **Col 1** | Critical Equilibrium (ID: 10117)
  - *Critical Damage increases by <span class="light_green_text">6.6%</span> when your Health is 50% or higher.<br>However, Critical Damage Resistance increases by <span class="light_green_text">6.6%</span> when your Health is below 50%.*
  - **Níveis da Passiva**: O efeito melhora por nível (1 ao 16+).
- **Col 3** | Unstoppable Rush (ID: 10118)
  - *Increases Collision and Stun Resistance by <span class="light_green_text">330</span> while using Greatsword Charge skills.*
  - **Níveis da Passiva**: O efeito melhora por nível (1 ao 16+).
- **Col 5** | Blade Harvest (ID: 10119)
  - *Restores <span class="light_green_text">5.5%</span> of damage dealt as Health for 3s after using Movement skills with a Greatsword. Has a 10-sec cooldown.*
  - **Níveis da Passiva**: O efeito melhora por nível (1 ao 16+).
- **Col 7** | Perception Balance (ID: 10120)
  - *Stun and Collision Hit Chance increase by <span class="light_green_text">110</span> when the user's Perception is 70 or higher.<br>However, Stun and Collision Resistance increase by <span class="light_green_text">110</span> when the user's Perception is below 70.*
  - **Níveis da Passiva**: O efeito melhora por nível (1 ao 16+).


### Crossbows (ID: 4)
#### Ramo 1
- **Col 1** | Lesser Attack Speed Augment (ID: 10161)
  - *Increases Attack Speed.*
- **Col 1** | Ranged Critical Hit Intensity (ID: 10162)
  - *Increases Ranged Critical Hit Chance, but decreases Melee Defense.*
- **Col 1** | Bloodlust Acceleration (ID: 20049)
  - *Crossbows Basic Attacks have a 5% chance to stack <span class="yellow_text">Bloodlust</span> once and increase Attack Speed by 5% for 3s.*
- **Col 2** | Base Damage Expertise (ID: 10163)
  - *Increases Base Damage and Mana Cost Efficiency. Base Damage increases from Lv. 5.*
- **Col 3** | Lesser Stamina Augment (ID: 10164)
  - *Increases Stamina Regen.*
- **Col 3** | Mana Regen Intensity (ID: 10165)
  - *Increases Mana Regen, but decreases Debuff Duration.*
- **Col 3** | Predator's Focus (ID: 20050)
  - *Eagle Vision now increases Magic, Melee, and Ranged Hit Chance by 100 when there are opponents within 15m. Magic, Melee, Ranged Critical Hit Chance increase by 100 when there are opponents within 10m. *
- **Col 4** | Magic Defense Expertise (ID: 10166)
  - *Increases Magic Defense and Buff Duration.*
- **Col 5** | Lesser Debuff Duration Augment (ID: 10167)
  - *Decreases Debuff Duration.*
- **Col 5** | Max Health Intensity (ID: 10168)
  - *Increases Max Health, and decreases Ranged Hit Chance.*
- **Col 5** | Recovery Bolts (ID: 20051)
  - *Corrupt Nail now restores 5000 Health for 5s when attacking opponents while the user's Health is 30% of Max Health or less. Has a 60-second cooldown.*
- **Col 6** | Damage Resistance Expertise (ID: 10169)
  - *Increases Attack Range and Skill Damage Resistance.*
- **Col 7** | Lesser Weaken Augment (ID: 10170)
  - *Increases Weaken Chance.*
- **Col 7** | Movement Speed Intensity (ID: 10171)
  - *Increases Movement Speed, but decreases Amitoi Healing.*
- **Col 7** | Tactical Deflection (ID: 20052)
  - *Deflection now applies the same <span class="yellow_text">Collision: Push</span> effect as <span class="yellow_text">Rupturing Parry</span> to opponents when being hit by a Melee attack. While in the <span class="yellow_text">Collision</span> state, the most disadvantageous direction to the target will be applied. Has a 30s cooldown.*
- **Col 8** | Attack Speed Expertise (ID: 10172)
  - *Increases Attack Speed and Ranged Hit Chance.*


#### Ramo 2
- **Col 1** | Ranged Critical Hit Augment (ID: 10173)
  - *Increases Ranged Critical Hit Chance.*
- **Col 1** | Ranged Damage Intensity (ID: 10174)
  - *Increases Ranged Damage, but decreases Melee Endurance.*
- **Col 1** | Calculated Power (ID: 20053)
  - *Ambidexterity now increases Off-hand Weapon Max Damage by 30, but decreases Off-hand Double Attack Chance by 4%. *
- **Col 2** | Ranged Heavy Attack Expertise (ID: 10175)
  - *Increases Ranged Heavy Attack Chance and Health Regen.*
- **Col 3** | Healing Received Augment (ID: 10176)
  - *Increases Healing Received.*
- **Col 3** | Stamina Regen Intensity (ID: 10177)
  - *Increases Stamina Regen, but decreases Stun Resistance.*
- **Col 3** | Mayhem Burst (ID: 20054)
  - *When Mana is 30% of Max Mana or less, increases Off-hand Double Attack Chance by 20%. The Off-hand Crossbows attack consumes 10 Mana on activation.*
- **Col 4** | Skill Damage Resistance Expertise (ID: 10178)
  - *Increases Cooldown Speed and Skill Damage Resistance.*
- **Col 5** | Critical Damage Resistance Augment (ID: 10179)
  - *Increases Critical Damage Resistance.*
- **Col 5** | Magic Defense Intensity (ID: 10180)
  - *Increases Magic Defense, but decreases Ranged Critical Hit Chance.*
- **Col 5** | Nature's Gamble (ID: 20055)
  - *Using Nature's Power increases Magic and Ranged Evasion by 300 and additionally 150 more for the first 1s. However, Magic and Ranged Evasion permanently decrease by 150 when Nature's Power is not in use. *
- **Col 6** | Off-hand Double Attack Expertise (ID: 10181)
  - *Increases Off-hand Double Attack Chance and Stun Resistance.*
- **Col 7** | CC Resistance Augment (ID: 10182)
  - *Increases all CC Resistance.*
- **Col 7** | Weaken Intensity (ID: 10183)
  - *Increases Weaken Chance, but decreases Max Mana.*
- **Col 7** | Mana Break Point (ID: 20056)
  - *Piercing Strike now increases Ranged Hit Chance by 150 and Ranged Critical Hit Chance by 150 when the user's Mana is at 40% of Max Mana or less.*
- **Col 8** | Max Damage Expertise (ID: 10184)
  - *Increases Max Damage and Attack Range. Max Damage increases from Lv. 4.*


#### Ramo 3
- **Col 1** | Greater Ranged Hit Augment (ID: 10185)
  - *Increases Ranged Hit Chance.*
- **Col 1** | Skill Damage Boost Intensity (ID: 10186)
  - *Increases Skill Damage Boost, but decreases Skill Damage Resistance.*
- **Col 1** | Reaper's Call (ID: 20057)
  - *Crossbows Attack skills deal 5% more Damage to opponents for 3s when hitting a target with 30% or less of their Max Health.*
- **Col 2** | Ranged Heavy Attack Expertise (ID: 10187)
  - *Increases Ranged Heavy Attack Chance and Amitoi Healing.*
- **Col 3** | Greater Mana Regen Augment (ID: 10188)
  - *Increases Mana Regen.*
- **Col 3** | Cooldown Speed Intensity (ID: 10189)
  - *Increases Skill Cooldown Speed, but decreases Sleep Resistance.*
- **Col 3** | Deathstrike Pact (ID: 20058)
  - *Landing a Crossbows Basic Attack has a 5% chance to increase Magic, Melee, and Ranged Critical Hit Chance by 100 for party members within a 16m radius.*
- **Col 4** | Damage Resistance Expertise (ID: 10190)
  - *Increases Skill Damage Resistance and Health Regen.*
- **Col 5** | Greater Evasion Augment (ID: 10191)
  - *Increases Magic, Melee, and Ranged Evasion.*
- **Col 5** | Perception Survival Adept (ID: 10192)
  - *Increases Max Health, and decreases Attack Speed.*
- **Col 5** | Final Heartbeat (ID: 20059)
  - *Increases Magic, Melee, and Ranged Evasion by 600 for 3s when the user's current Health is 25% of Max Health or less. Has a 30-second cooldown.*
- **Col 6** | Collision Resistance Expertise (ID: 10193)
  - *Increases Collision Resistance and Melee Endurance.*
- **Col 7** | Greater Movement Speed Augment (ID: 10194)
  - *Increases Movement Speed.*
- **Col 7** | Mana Efficiency Intensity (ID: 10195)
  - *Increases Mana Cost Efficiency, but decreases Health Regen.*
- **Col 7** | Agile Strike (ID: 20060)
  - *Increases Movement Speed by 2% for 3s when applying Weaken. Stacks up to 3 times. Increases Magic, Melee, and Ranged Hit Chance by 30 for 3s when landing a Critical Hit. Stacks up to 3 times.*
- **Col 8** | Attack Range Expertise (ID: 10196)
  - *Increases Attack Range and decreases Debuff Duration.*


#### Ramo 5
- **Col 1** | Annihilator (ID: 10197)
  - *Increases Off-hand Double Attack Chance by <span class="light_green_text">11%</span> if any opponent is within a 10m radius.*
  - **Níveis da Passiva**: O efeito melhora por nível (1 ao 16+).
- **Col 3** | Endless Volley (ID: 10198)
  - *Increases Mana Regen by <span class="light_green_text">143</span> if the user's current Mana is 30% or less of Max Mana. However, Max Mana decreases by 1000.*
  - **Níveis da Passiva**: O efeito melhora por nível (1 ao 16+).
- **Col 5** | Mirage Dancer (ID: 10199)
  - *Evading an attack increases Movement Speed by <span class="light_green_text">4.4%</span> for 3s. Using a Mobility skill increases Magic and Ranged Evasion by <span class="light_green_text">110</span> for 3s.*
  - **Níveis da Passiva**: O efeito melhora por nível (1 ao 16+).
- **Col 7** | Archenemy (ID: 10200)
  - *Increases Movement Speed by <span class="light_green_text">4.4%</span>. However, taking a hit by Melee attacks decreases Movement Speed by <span class="light_green_text">15.5%</span> for 2s. *
  - **Níveis da Passiva**: O efeito melhora por nível (1 ao 16+).


### Staff (ID: 5)
#### Ramo 1
- **Col 1** | Lesser Max Damage Augment (ID: 10201)
  - *Increases Max Damage for Staves.*
- **Col 1** | Magic Critical Hit Intensity (ID: 10202)
  - *Increases Magic Critical Hit Chance, but decreases Magic, Melee, and Ranged Heavy Attack Evasion.*
- **Col 1** | Mana Shockwave (ID: 20061)
  - *Manaball Eruption deals the same damage to the target and a 3m area around it.*
- **Col 2** | Heavy Attack Expertise (ID: 10203)
  - *Increases Magic, Melee, and Ranged Heavy Attack Chance and Amitoi Healing.*
- **Col 3** | Lesser Mana Regen Augment (ID: 10204)
  - *Increases Mana Regen.*
- **Col 3** | Cooldown Speed Intensity (ID: 10205)
  - *Increases Cooldown Speed, but decreases Stamina Regen.*
- **Col 3** | Flame Discipline (ID: 20062)
  - *After using a skill, fires fireballs that deal 150% of Base Damage at up to 5 random targets within 5m every sec for 10s. The fireballs can only generate when Asceticism's In-Place effect is active.<br><br><c=@UI_TXT_Red_Disable>Does not apply additional effects from fireballs.</span>*
- **Col 4** | Melee Evasion Expertise (ID: 10206)
  - *Increases Melee Evasion and Mana Regen.*
- **Col 5** | Lesser Evasion Augment (ID: 10207)
  - *Increases Magic, Melee, and Ranged Evasion.*
- **Col 5** | Defense Intensity (ID: 10208)
  - *Increases Magic, Melee, and Ranged Defense, but decreases Magic Critical Hit Chance.*
- **Col 5** | Vitality Conversion (ID: 20063)
  - *Mana Amp's Max Health increases by 60%, but Max Mana decreases by 30%.*
- **Col 6** | Magic Heavy Attack Evasion Expertise (ID: 10209)
  - *Increases Magic Heavy Attack Evasion and Weaken Chance.*
- **Col 7** | Lesser Species Damage Augment (ID: 10210)
  - *Increases all Species Damage Boost.*
- **Col 7** | Max Mana Intensity (ID: 10211)
  - *Increases Max Mana, but decreases Amitoi Healing.*
- **Col 7** | Strategic Compromise (ID: 20064)
  - *Forbidden Sanctuary's Skill Damage Boost additionally increases by 75, but the Total Mana Cost Efficiency additionally decreases by 5%.*
- **Col 8** | Magic Hit Expertise (ID: 10212)
  - *Increases Buff Duration and Magic Hit Chance.*


#### Ramo 2
- **Col 1** | Burning Damage Augment (ID: 10213)
  - *Increases Burning Damage by 1%.*
  - **Níveis da Passiva**: O efeito melhora por nível (1 ao 16+).
- **Col 1** | Magic Damage Intensity (ID: 10214)
  - *Increases Magic Damage Boost, but decreases Ranged Evasion.*
- **Col 1** | Arctic Thunder (ID: 20065)
  - *Frost Master now increases Staff Lightning Skill Damage by 10% for 3s when applying Frost.*
- **Col 2** | Magic Critical Hit Expertise (ID: 10215)
  - *Increases Magic Critical Hit Chance and Mana Regen.*
- **Col 3** | Silence Resistance Augment (ID: 10216)
  - *Increases Silence Resistance.*
- **Col 3** | Max Stamina Intensity (ID: 10217)
  - *Increases Max Stamina, but decreases Attack Range.*
- **Col 3** | Resonant Barrier (ID: 20066)
  - *Echoic Barrier's Silence Duration Reduction effect changes to an effect that grants Silence immunity when the user is Silenced. Has a 45-second cooldown.*
- **Col 4** | Endurance Expertise (ID: 10218)
  - *Increases Magic, Melee, and Ranged Endurance and Cooldown Speed.*
- **Col 5** | Melee Defense Augment (ID: 10219)
  - *Increases Melee Defense.*
- **Col 5** | Melee Evasion Intensity (ID: 10220)
  - *Increases Melee Evasion, but decreases Magic Hit Chance.*
- **Col 5** | Spirit of Perseverance (ID: 20067)
  - *Decreases Debuff Duration by 0.3% per 100 of Max Mana, up to 30,000 of Max Mana.*
- **Col 6** | Attack Range Expertise (ID: 10221)
  - *Increases Attack Range and Ranged Heavy Attack Evasion.*
- **Col 7** | Burning Augment (ID: 10222)
  - *Increases Burning Chance by 0.5%.*
  - **Níveis da Passiva**: O efeito melhora por nível (1 ao 16+).
- **Col 7** | Species Damage Reduction Intensity (ID: 10223)
  - *Increases all Species Damage Reduction, but decreases Fear Resistance.*
- **Col 7** | Infernal Aftermath (ID: 20068)
  - *Flame Condensation now activates Inferno Wave if the target of the user's Burning from a Staff skill dies. Deals the same damage as the Inferno Wave skill, without Specialization or Mastery effects.*
- **Col 8** | Attack Speed Expertise (ID: 10224)
  - *Increases Attack Speed and Max Mana.*


#### Ramo 3
- **Col 1** | Greater Bonus Damage Augment (ID: 10225)
  - *Increases Bonus Damage.*
- **Col 1** | Skill Damage Boost Intensity (ID: 10226)
  - *Increases Skill Damage Boost, but decreases Ranged Endurance.*
- **Col 1** | Fire Wave Amplifier (ID: 20069)
  - *Increases the AOE range of Serial Fire Bombs and Inferno Wave by 5m.*
- **Col 2** | Base Damage Expertise (ID: 10227)
  - *Increases Base Damage and Mana Regen. Base Damage increases from Lv. 4.*
- **Col 3** | Greater Cooldown Speed Augment (ID: 10228)
  - *Increases Cooldown Speed.*
- **Col 3** | Mana Efficiency Intensity (ID: 10229)
  - *Increases Mana Cost Efficiency, but decreases Buff Duration.*
- **Col 3** | Manaball Salvo (ID: 20070)
  - *Staves now fires 2 projectiles, but decreases damage to 70%. Fires at the target and a random target within 3m of the target.*
- **Col 4** | Damage Reduction Expertise (ID: 10230)
  - *Increases Damage Reduction and Silence Resistance.*
- **Col 5** | Greater Max Health Augment (ID: 10231)
  - *Increases Max Health.*
- **Col 5** | Skill Damage Resistance Intensity (ID: 10232)
  - *Increases Skill Damage Resistance, but decreases Magic Heavy Attack Chance.*
- **Col 5** | Mana Overflow (ID: 20071)
  - *When Mana is 15,000 or higher, Max Health increases by 1500.*
- **Col 6** | Endurance Expertise (ID: 10233)
  - *Increases Magic, Melee, and Ranged Endurance and Max Mana.*
- **Col 7** | Greater Damage Over Time Augment (ID: 10234)
  - *Increases damage over time by 0.5%.*
  - **Níveis da Passiva**: O efeito melhora por nível (1 ao 16+).
- **Col 7** | Attack Range Intensity (ID: 10235)
  - *Increases Attack Range, but decreases Healing Received.*
- **Col 7** | Heat Fusion (ID: 20072)
  - *Increases Burning Duration by 1.5s. Converts Ice Spear Bombardment into Detonator Bombardment.*
- **Col 8** | Critical Hit Expertise (ID: 10236)
  - *Increases Magic, Melee, and Ranged Critical Hit Chance, and Stamina Regen.*


#### Ramo 5
- **Col 1** | Power Surge (ID: 10237)
  - *Max Damage increases by <span class="light_green_text">8.8%</span> per 1,000 of Max Mana, up to 30,000 of Max Mana.*
  - **Níveis da Passiva**: O efeito melhora por nível (1 ao 16+).
- **Col 3** | Burning Ripple (ID: 10238)
  - *Attacking a victim of the user's Burning has a <span class="light_green_text">4.4%</span> chance to inflict Burning in a 3m radius.*
  - **Níveis da Passiva**: O efeito melhora por nível (1 ao 16+).
- **Col 5** | Mana Shield (ID: 10239)
  - *Increases Defense equal to <span class="light_green_text">20% of Mana Regen (up to 3,500) + 15</span>.*
  - **Níveis da Passiva**: O efeito melhora por nível (1 ao 16+).
- **Col 7** | Mana Spring (ID: 10240)
  - *Increases Mana Regen by <span class="light_green_text">33%</span> when the user's Mana is 30% of Max Mana or less.*
  - **Níveis da Passiva**: O efeito melhora por nível (1 ao 16+).


### Daggers (ID: 6)
#### Ramo 1
- **Col 1** | Lesser Attack Speed Augment (ID: 10001)
  - *Increases Attack Speed.*
- **Col 1** | Attack Speed Intensity (ID: 10002)
  - *Increases Attack Speed, but decreases Critical Damage Resistance.*
- **Col 1** | Piercing Bite (ID: 20001)
  - *The effect created by Destructive Fang now also decreases the target's Damage Reduction by 14.*
- **Col 2** | Movement Speed Expertise (ID: 10003)
  - *Increases Movement Speed and Base Damage. Base Damage increases from Lv. 5.*
- **Col 3** | Lesser Buff Duration Augment (ID: 10004)
  - *Increases Buff Duration.*
- **Col 3** | Stamina Regen Intensity (ID: 10005)
  - *Increases Stamina Regen, but decreases Collision Resistance.*
- **Col 3** | Blood Seeker (ID: 20002)
  - *Assassin's Instincts now restores Health by 5% of Melee Critical hits, but Critical Damage is decreased by 5%*
- **Col 4** | Ranged Defense Expertise (ID: 10006)
  - *Increases Ranged Defense and Healing Received.*
- **Col 5** | Lesser Magic Heavy Attack Evasion Augment (ID: 10007)
  - *Increases Magic Heavy Attack Evasion.*
- **Col 5** | Damage Reduction Intensity (ID: 10008)
  - *Increases Damage Reduction, but decreases Attack Range.*
- **Col 5** | Umbral Toughness (ID: 20003)
  - *Shadow Walker now increases Magic and Ranged Endurance, instead of Magic and Ranged Evasion.*
- **Col 6** | Skill Damage Resistance Expertise (ID: 10009)
  - *Increases Skill Damage Resistance and Bind Chance.*
- **Col 7** | Lesser Silence Augment (ID: 10010)
  - *Increases Silence Chance.*
- **Col 7** | Buff Duration Intensity (ID: 10011)
  - *Increases Debuff Duration, but decreases Health Regen.*
- **Col 7** | Potent Toxicity (ID: 20004)
  - *Murderous Energy now enhances Poison and Thundercloud effects from Daggers by 50%, but decreases their duration by 5s.*
- **Col 8** | Weaken Chance Offensive (ID: 10012)
  - *Increases Weaken Chance and Bonus Damage.*


#### Ramo 2
- **Col 1** | Critical Hit Augment (ID: 10013)
  - *Increases Magic, Melee, and Ranged Critical Hit Chance.*
- **Col 1** | Melee Critical Hit Intensity (ID: 10014)
  - *Increases Melee Critical Hit Chance, but decreases Melee Defense.*
- **Col 1** | Venomous Edge (ID: 20005)
  - *Wrathful Edge now deals 70% of Base Damage + 10 Damage to all targets of your Inject Venom within 3m of the user's target when it lands with a Melee Heavy Attack. Damage increases by 3% per Poison stack.<br><br><c=@UI_TXT_Red_Disable>Does not apply additional effects.</span>*
- **Col 2** | Max Damage Expertise (ID: 10015)
  - *Increases Mana Regen and Max Damage. Max Damage increases from Lv. 4.*
- **Col 3** | Off-hand Weapon Augment (ID: 10016)
  - *Increases Off-hand Weapon Chance.*
- **Col 3** | Off-hand Weapon Damage Intensity (ID: 10017)
  - *Increases Off-hand Weapon Max Damage, but decreases all CC Resistance.*
- **Col 3** | Fatal Fatigue (ID: 20006)
  - *Murderous Energy now decreases Magic Heavy Attack of the user's Inject Venom targets by 175.*
- **Col 4** | Cooldown Speed Expertise (ID: 10018)
  - *Increases Cooldown Speed and Magic Evasion.*
- **Col 5** | Evasion Augment (ID: 10019)
  - *Increases Magic, Melee, and Ranged Evasion.*
- **Col 5** | Max Health Intensity (ID: 10020)
  - *Increases Max Health, but decreases Attack Speed.*
- **Col 5** | Phantom Timer (ID: 20007)
  - *Assassination Stance now also decreases Phantom Smokescreen's cooldown.*
- **Col 6** | Ranged Evasion Expertise (ID: 10021)
  - *Increases Ranged Evasion and Bind Resistance.*
- **Col 7** | Attack Range Augment (ID: 10022)
  - *Increases Attack Range.*
- **Col 7** | Crowd Control Intensity (ID: 10023)
  - *Increases CC Chance, but decreases Mana Cost Efficiency.*
- **Col 7** | Combat Velocity (ID: 20008)
  - *Assassin's Step now increases Attack Speed by 15% for the duration of its effect.*
- **Col 8** | Bonus Damage Expertise (ID: 10024)
  - *Increases Attack Speed and Weaken Chance.*


#### Ramo 3
- **Col 1** | Greater Hit Augment (ID: 10025)
  - *Increases Magic, Melee, and Ranged Hit Chance.*
- **Col 1** | Critical Damage Intensity (ID: 10026)
  - *Increases Critical Damage, but decreases Endurance.*
- **Col 1** | Primal Strike (ID: 20009)
  - *Increases dagger Basic Attack Damage by 150%, but consumes 10 Mana per attack. Deals 100% bonus damage to shielded targets.<br><br><c=@UI_TXT_Red_Disable>Does not apply additional effects from the bonus damage.</span>*
- **Col 2** | Critical Damage Expertise (ID: 10027)
  - *Increases Critical Damage and Amitoi Healing.*
- **Col 3** | Greater Potion Healing Augment (ID: 10028)
  - *Increases Potion Healing.*
- **Col 3** | Cooldown Speed Intensity (ID: 10029)
  - *Increases Skill Cooldown Speed, but decreases Stun Resistance.*
- **Col 3** | Fleeting Shadow (ID: 20010)
  - *Camouflage Cloak and Phantom Smokescreen increase All Evasion by 250, but decrease their duration by 1s.*
- **Col 4** | Magic Defense Expertise (ID: 10030)
  - *Increases Magic Defense and Max Stamina. Max Stamina increases from Lv. 2.*
- **Col 5** | Greater Ranged Defense Augment (ID: 10031)
  - *Increases Ranged Defense.*
- **Col 5** | Evasion Intensity (ID: 10032)
  - *Increases Magic, Melee, and Ranged Evasion, but decreases Critical Damage.*
- **Col 5** | Fluid Block (ID: 20011)
  - *Decreases Block Blade's Stamina cost by 10. Does not decrease Block Blade's minimum Stamina requirement.*
- **Col 6** | Ranged Defense Expertise (ID: 10033)
  - *Increases Ranged Defense and Bind Resistance.*
- **Col 7** | Greater CC Resistance Augment (ID: 10034)
  - *Increases all CC Resistance.*
- **Col 7** | Movement Speed Intensity (ID: 10035)
  - *Increases Movement Speed, but decreases Buff Duration.*
- **Col 7** | Strategic Exchange (ID: 20012)
  - *Decreases Base Damage for Inject Venom chain skills, Fatal Stigma, and Thundering Bomb by 40%, but increases Damage for Poison and Thunderclouds stacks by 16%.*
- **Col 8** | Skill Damage Boost Expertise (ID: 10036)
  - *Increases Skill Damage Boost and Weaken Resistance.*


#### Ramo 5
- **Col 1** | Merciless Form (ID: 10037)
  - *Increases Daggers Attack Skill Damage by <span class="light_green_text">2.2%.*
  - **Níveis da Passiva**: O efeito melhora por nível (1 ao 16+).
- **Col 3** | Off-hand Frenzy (ID: 10038)
  - *Increases the Off-hand Weapon's Base Damage by <span class="light_green_text">33</span> and boosts Off-hand Double Attack Chance by 15%, but decreases the Main Weapon's Base Damage by <span class="light_green_text">40</span> for 2s when using a Mobility skill.*
  - **Níveis da Passiva**: O efeito melhora por nível (1 ao 16+).
- **Col 5** | Ethereal Evasion (ID: 10039)
  - *Creates a shield to evade most magic attacks for <span class="light_green_text">0.55s</span> when hit by a Magic attack. Cooldown: 30s*
  - **Níveis da Passiva**: O efeito melhora por nível (1 ao 16+).
- **Col 7** | Dexterous Power (ID: 10040)
  - *Increases Critical Damage by <span class="light_green_text">4.4%</span> when Dexterity is 90 or higher.<br>Increases all Evasion by <span class="light_green_text"><span class="light_green_text">88</span> when Dexterity is below 90.*
  - **Níveis da Passiva**: O efeito melhora por nível (1 ao 16+).


### Sword (ID: 7)
#### Ramo 1
- **Col 1** | Lesser Melee Hit Augment (ID: 10041)
  - *Increases Melee Hit Chance.*
- **Col 1** | Melee Critical Hit Intensity (ID: 10042)
  - *Increases Melee Critical Hit Chance, but decreases Magic Defense.*
- **Col 1** | Roar Amplifier (ID: 20025)
  - *When active, Spectrum of Agony decreases all the caster's Defense by 7% and extends the duration of the caster's Provoking Roar or Cleaving Roar effects by 0.4s when damaging targets affected by the caster's Provoking Roar or Cleaving Roar. Provoke duration increases up to 3 times per sec.<br>When dealing melee attack damage, converts the effect to deal 30% of Base Damage + 9 damage to all targets within 3m even if a target is not affected by Provoking Roar or Cleaving Roar.<br><br><c=@UI_TXT_Red_Disable>Does not apply additional effects.</span>*
- **Col 2** | Base Damage Expertise (ID: 10043)
  - *Increases Mana Regen and Base Damage. Base Damage increases from Lv. 5.*
- **Col 3** | Lesser Health Regen Augment (ID: 10044)
  - *Increases Health Regen.*
- **Col 3** | Cooldown Speed Intensity (ID: 10045)
  - *Increases Cooldown Speed, but decreases Bind Resistance.*
- **Col 3** | Gerad's Resilience (ID: 20026)
  - *Gerad's Patience will additionally decrease your Debuff Duration by 0.8% for 3s, when evading an attack, shield blocking, or blocking with a Defense skill. Stacks up to 10 times.*
- **Col 4** | Damage Reduction Expertise (ID: 10046)
  - *Increases Amitoi Healing and Damage Reduction.*
- **Col 5** | Lesser Melee Defense Augment (ID: 10047)
  - *Increases Melee Defense.*
- **Col 5** | Max Health Intensity (ID: 10048)
  - *Increases Max Health, but decreases Melee Critical Hit Chance.*
- **Col 5** | Strategic Retreat (ID: 20027)
  - *Skillful Evasion now increases Magic and Ranged Evasion by 21 per 1m of distance from target, up to 210 and only applies to targets within 10m. (At Epic Lv. 5)*
- **Col 6** | Ranged Endurance Expertise (ID: 10049)
  - *Increases Ranged Endurance and Shield Block Chance.*
- **Col 7** | Lesser Collision Augment (ID: 10050)
  - *Greater Collision Augment*
- **Col 7** | Max Stamina Intensity (ID: 10051)
  - *Increases Max Stamina, but decreases Health Regen.*
- **Col 7** | Gerad's Precision (ID: 20028)
  - *Converts the effects from Gerad's Patience to increase all CC Hit Chance by 25 for 3s when attacking a target. Stacks up to 10 times. (At Epic Lv. 5)*
- **Col 8** | Weaken and Range Expertise (ID: 10052)
  - *Increases Weaken Chance and Attack Range.*


#### Ramo 2
- **Col 1** | Melee Critical Hit Augment (ID: 10053)
  - *Increases Melee Critical Hit Chance.*
- **Col 1** | Melee Hit Intensity (ID: 10054)
  - *Increases Melee Hit Chance, and decreases Ranged Defense.*
- **Col 1** | Power Breach (ID: 20029)
  - *Using Shield Strike, Piercing Strike, Witty Retort, A Shot at Victory, or Annihilation Blade increases the Skill Damage Boost of the next skill used within 5s by 150, and decreases all the caster's Defense by 7%.*
- **Col 2** | Max Damage Expertise (ID: 10055)
  - *Increases Max Mana and Max Damage. Max Damage increases from Lv. 4.*
- **Col 3** | Mana Regen Augment (ID: 10056)
  - *Increases Mana Regen.*
- **Col 3** | Healing Received Intensity (ID: 10057)
  - *Increases Healing Received, but decreases Movement Speed.*
- **Col 3** | Stamina Renewal (ID: 20030)
  - *Resilient Mind now has a 5% chance to recover Stamina by 35, when evading an attack. Has a 25-second cooldown.*
- **Col 4** | Mana Cost Efficiency Expertise (ID: 10058)
  - *Increases Mana Cost Efficiency and decreases Debuff Duration.*
- **Col 5** | Evasion Augment (ID: 10059)
  - *Increases Magic, Melee, and Ranged Evasion.*
- **Col 5** | Shield Block Intensity (ID: 10060)
  - *Increases Shield Block Chance, but decreases Melee Hit Chance.*
- **Col 5** | Unyielding Aegis (ID: 20031)
  - *Aegis Shield now increases Skill Damage Resistance by 150 but Melee Heavy Attack Chance decreases by 350.*
- **Col 6** | Damage Reduction Expertise (ID: 10061)
  - *Increases Movement Speed and Damage Reduction.*
- **Col 7** | Collision Resistance Augment (ID: 10062)
  - *Increases Collision Resistance.*
- **Col 7** | Boss Defense Intensity (ID: 10063)
  - *Increases Boss Damage Reduction, but decreases Stamina Regen.*
- **Col 7** | Bulwark Stance (ID: 20032)
  - *When there are more than 10 targets, Impenetrable now increases Magic, Melee, and Ranged Defense by 980.*
- **Col 8** | Weaken and Damage Expertise (ID: 10064)
  - *Increases Weaken Chance and Max Damage. Max Damage increases from Lv. 4.*


#### Ramo 3
- **Col 1** | Greater Heavy Attack Augment (ID: 10065)
  - *Increases Magic, Melee, and Ranged Heavy Attack Chance.*
- **Col 1** | Attack Speed Intensity (ID: 10066)
  - *Increases Attack Speed, and decreases Magic Endurance.*
- **Col 1** | Shredding Strike (ID: 20033)
  - *Increases Sword Active Skill Damage by 20% for 3s upon a successful Collision and decreases all the caster's Defense by 9%.*
- **Col 2** | Damage Increase Expertise (ID: 10067)
  - *Increases Skill Damage Boost and Mana Cost Efficiency.*
- **Col 3** | Greater Buff Duration Augment (ID: 10068)
  - *Increases Buff Duration.*
- **Col 3** | CC Resistance Intensity (ID: 10069)
  - *Increases all CC Resistances, but decreases Attack Range.*
- **Col 3** | Replenishment (ID: 20034)
  - *Restores Stamina by 10 upon using Counter Barrier, Concentrated Barrier, Immortal Pride, or Stalwart Bastion. (Effect only applies to your skills.)*
- **Col 4** | Melee Defense Expertise (ID: 10070)
  - *Increases Melee Defense and Stamina Regen.*
- **Col 5** | Greater Shield Block Augment (ID: 10071)
  - *Increases Shield Block Chance.*
- **Col 5** | Critical Damage Intensity (ID: 10072)
  - *Increases Critical Damage Resistance, but decreases Skill Damage Boost.*
- **Col 5** | Unshakeable Will (ID: 20035)
  - *All CC Resistance +200, Damage Reduction +20, and Base Damage -13% upon using Counter Barrier, Concentrated Barrier, or Stalwart Bastion.*
- **Col 6** | Skill Damage Resistance Expertise (ID: 10073)
  - *Increases Skill Damage Resistance and Cooldown Speed.*
- **Col 7** | Greater Boss Bonus Damage Augment (ID: 10074)
  - *Increases Boss Bonus Damage.*
- **Col 7** | Collision Intensity (ID: 10075)
  - *Increases Collision Chance, but decreases Mana Regen.*
- **Col 7** | Tactical Breaker (ID: 20036)
  - *A successful Collision from Strategic Rush, Fierce Clash, and Desperate Clash has a 80% chance to decrease all the target's Defense by 250 for 5s. However, the user's Mana Cost for those skills increases by 100%.*
- **Col 8** | Stun Resistance and Damage Expertise (ID: 10076)
  - *Increases Stun Resistance and Base Damage.*


#### Ramo 5
- **Col 1** | Blade Momentum (ID: 10077)
  - *Using Shield Throw, Whirling Shield, or Annihilating Slash increases Sword Active Skill Damage by <span class="light_green_text">16.5%</span> and decreases all the caster's Defense by 7.7% for 6s.*
  - **Níveis da Passiva**: O efeito melhora por nível (1 ao 16+).
- **Col 3** | Resistance Scale (ID: 10078)
  - *Critical Damage Resistance increases by <span class="yellow_text">0.039%</span> per 100 of Max Health, up to 20,000 of Max Health. *
  - **Níveis da Passiva**: O efeito melhora por nível (1 ao 16+).
- **Col 5** | Life's Bargain (ID: 10079)
  - *Increases Melee and Ranged Endurance by <span class="yellow_text">1.1</span> and decreases Base Damage by 8.8% per 100 Max Health, up to 40,000.*
  - **Níveis da Passiva**: O efeito melhora por nível (1 ao 16+).
- **Col 7** | Wisdom's Path (ID: 10080)
  - *Healing and Healing Received increase by <span class="light_green_text">5.5%</span> when the user's Wisdom is 60 or higher.<br>However, Max Mana increases by <span class="light_green_text">880</span> instead when the user's Wisdom is below 60.*
  - **Níveis da Passiva**: O efeito melhora por nível (1 ao 16+).


### Wand (ID: 9)
#### Ramo 1
- **Col 1** | Lesser Attack Range Augment (ID: 10241)
  - *Increases Attack Range.*
- **Col 1** | Hit Intensity (ID: 10242)
  - *Increases Magic, Melee, and Ranged Hit Chance, but decreases Healing.*
- **Col 1** | Vampiric Onslaught (ID: 20073)
  - *Vampiric Contract now additionally deals the same amount of Damage to the user's target, instead of restoring an ally's Health.*
- **Col 2** | Bonus Damage Expertise (ID: 10243)
  - *Increases Bonus Damage and Mana Regen.*
- **Col 3** | Lesser Mana Efficiency Augment (ID: 10244)
  - *Increases Mana Cost Efficiency.*
- **Col 3** | Healing Intensity I (ID: 10245)
  - *Increases Healing, but decreases Sleep Chance.*
- **Col 3** | Battle Spirit (ID: 20074)
  - *Selfless Soul is now activated by landing hits with Attack-type skills on an opponent, and it now boosts Base Damage by 1.4% instead of Healing. (Epic Lv. 5)*
- **Col 4** | Damage Reduction Expertise (ID: 10246)
  - *Increases Silence Resistance and Damage Reduction.*
- **Col 5** | Lesser Melee Heavy Attack Evasion Augment (ID: 10247)
  - *Increases Melee Heavy Attack Evasion.*
- **Col 5** | Healing Received Intensity (ID: 10248)
  - *Increases Healing Received, but decreases Magic Hit Chance.*
- **Col 5** | Light of Devotion (ID: 20075)
  - *The Day effect of Devotion and Emptiness improves by 20%, but the Night effect is reduced by 50%. Applying together with Eye of Emptiness in Wand Mastery always retains the 20% improved effect.*
- **Col 6** | Evasion Expertise (ID: 10249)
  - *Increases Magic, Melee, and Ranged Evasion and Max Health.*
- **Col 7** | Lesser Species Resistance Augment (ID: 10250)
  - *Increases all Species Damage Resistance.*
- **Col 7** | Cooldown Speed Intensity (ID: 10251)
  - *Increases Skill Cooldown Speed, but decreases Mana Cost Efficiency.*
- **Col 7** | Malicious Focus (ID: 20076)
  - *Full of Corruption is now activated by landing Wand skills on a victim of the user's Weaken, which increases Magic Damage by 2.4% instead of increasing Bonus Damage.*
- **Col 8** | Base Damage Expertise (ID: 10252)
  - *Increases Weaken Chance and Base Damage. Base Damage increases from Lv. 5.*


#### Ramo 2
- **Col 1** | Curse Duration Augment (ID: 10253)
  - *Increases Curse Duration by 0.1s.*
  - **Níveis da Passiva**: O efeito melhora por nível (1 ao 16+).
- **Col 1** | Attack Speed Intensity (ID: 10254)
  - *Increases Attack Speed, but decreases Ranged Defense.*
- **Col 1** | Warrior's Gambit (ID: 20077)
  - *When Noble Revival is active, the Healing decreases by 30%. Base Damage is increased by 25% of Noble Revival's healing bonus.*
- **Col 2** | Max Damage Expertise (ID: 10255)
  - *Increases Max Damage and Max Mana. Max Damage increases from Lv. 4. *
- **Col 3** | Healing Augment (ID: 10256)
  - *Increases Healing.*
- **Col 3** | Max Mana Intensity (ID: 10257)
  - *Increases Max Mana, but decreases Health Regen.*
- **Col 3** | Eye of Emptiness (ID: 20078)
  - *The Night effect of Devotion and Emptiness improves by 20%, but the Day effect is reduced by 50%. Applying together with Light of Devotion in Wand Mastery always retains the 20% improved effect.*
- **Col 4** | Magic Defense Expertise (ID: 10258)
  - *Increases Magic Defense and Stun Resistance.*
- **Col 5** | Melee Defense Augment (ID: 10259)
  - *Increases Melee Defense.*
- **Col 5** | Magic Heavy Attack Evasion Intensity (ID: 10260)
  - *Increases Magic Heavy Attack Evasion, but decreases Magic Critical Hit Chance.*
- **Col 5** | Celestial Boost (ID: 20079)
  - *The Wraith's Beckon effect disappears and changes to boost the effect of Clay's Salvation, Invincible Wall, and Fountain of Life by 15%. (Epic Lv. 5)*
- **Col 6** | Damage Reduction Expertise (ID: 10261)
  - *Increases Damage Reduction and Weaken Chance.*
- **Col 7** | Species Damage Augment (ID: 10262)
  - *Increases all Species Damage Boost.*
- **Col 7** | Buff Duration Intensity (ID: 10263)
  - *Increases Buff Duration, but decreases Mana Regen.*
- **Col 7** | Shadow Oath (ID: 20080)
  - *Saint's Oath changes to increase Skill Damage Boost and Damage over time by the same amount.*
- **Col 8** | Skill Damage Boost Expertise (ID: 10264)
  - *Increases Skill Damage Boost and Bonus Damage.*


#### Ramo 3
- **Col 1** | Greater Damage Over Time Augment (ID: 10265)
  - *Increases damage over time by 0.5%.*
  - **Níveis da Passiva**: O efeito melhora por nível (1 ao 16+).
- **Col 1** | Magic Heavy Attack Intensity (ID: 10266)
  - *Increases Magic Heavy Attack Chance, but decreases Ranged heavy Attack Evasion.*
- **Col 1** | Malicious Intent (ID: 20081)
  - *Boosts Curse Damage over time by 15%, but decreases Healing effectiveness by 20%.*
- **Col 2** | Silence Chance Response (ID: 10267)
  - *Increases Critical Hit Chance and Silence Resistance.*
- **Col 3** | Greater Mana Regen Augment (ID: 10268)
  - *Increases Mana Regen.*
- **Col 3** | Healing Intensity II (ID: 10269)
  - *Increases Healing, but decreases Sleep Chance.*
- **Col 3** | Corrupting Hit (ID: 20082)
  - *A successful Basic Attack hit has a 15% chance to apply Touch of Despair, Decaying Touch, or Time for Punishment to a monster.*
- **Col 4** | Debuff Duration Defense (ID: 10270)
  - *Increases Debuff Duration and Healing.*
- **Col 5** | Greater Melee Evasion Augment (ID: 10271)
  - *Increases Melee Evasion.*
- **Col 5** | Endurance Intensity (ID: 10272)
  - *Increases Magic, Melee, and Ranged Endurance, but decreases Magic Heavy Attack.*
- **Col 5** | Spectral Defense (ID: 20083)
  - *Applying Enchanting Time enables the user to pass through the target and grants a Shield with Health equal to 400% of Base Damage. Lasts for 6s.*
- **Col 6** | Skill Damage Resistance Expertise (ID: 10273)
  - *Increases Skill Damage Resistance and Buff Duration.*
- **Col 7** | Greater Crowd Control Augment (ID: 10274)
  - *Increases all CC Chance.*
- **Col 7** | Stamina Regen Intensity (ID: 10275)
  - *Increases Stamina Regen, but decreases Max Mana.*
- **Col 7** | Dark Apostasy (ID: 20084)
  - *Swift Healing changes to Corrupted Obliteration, which deals Damage to opponents. Clay's Salvation changes to Slothful Cage, dealing Damage every 1s in a 5m radius for 5s. Fountain of Life changes to Obliterating Swamp, which deals Damage to opponents within range.*
- **Col 8** | Skill Damage Expertise (ID: 10276)
  - *Increases Buff Duration and Skill Damage Boost.*


#### Ramo 5
- **Col 1** | Abyssal Burst (ID: 10277)
  - *Upon hitting a target affected by the user's Curse Damage over time, has a(n) 8% chance to apply the Curse Explosion effect to the target, dealing <span class="light_green_text">6.6%</span> of the remaining damage over time. The damage over time effect is not consumed by the Curse Explosion effect.<br><br><c=@UI_TXT_Red_Disable>Does not apply additional effects from Curse Explosion.</span>*
  - **Níveis da Passiva**: O efeito melhora por nível (1 ao 16+).
- **Col 3** | Divine Choice (ID: 10278)
  - *Increases Healing effectiveness by <span class="light_green_text">7.7%</span>, but decreases Curse Damage over time by <span class="light_green_text">7.7%</span>.*
  - **Níveis da Passiva**: O efeito melhora por nível (1 ao 16+).
- **Col 5** | Blessed Haste (ID: 10279)
  - *Decreases healing skill cooldowns by <span class="light_green_text">7.7%</span>.*
  - **Níveis da Passiva**: O efeito melhora por nível (1 ao 16+).
- **Col 7** | Nightmare (ID: 10280)
  - *Applying Touch of Despair, Corrupted Magic Circle, Time for Corruption, or Time for Punishment to monsters has a <span class="light_green_text">11%</span> chance to apply the Dream Demon effect for 3s. the effect is the same as Sleep, but persists through being attacked. Does not stack with the Karmic Haze effect.*
  - **Níveis da Passiva**: O efeito melhora por nível (1 ao 16+).


### Spear (ID: 25)
#### Ramo 1
- **Col 1** | Lesser Melee Hit Augment (ID: 10281)
  - *Increases Melee Hit Chance.*
- **Col 1** | Melee Critical Hit Intensity (ID: 10282)
  - *Increases Melee Critical Hit Chance, and decreases Melee Evasion.*
- **Col 1** | Perfect Tempo (ID: 20085)
  - *Nimble Steps now increases Melee Hit Chance by 336 and Attack Speed by 4.8% instead of granting CC Resistance and Ranged Evasion. (At Epic Lv. 5)*
- **Col 2** | Attack Speed Expertise (ID: 10283)
  - *Increases Attack Speed and Base Damage. Base Damage increases from Lv. 5.*
- **Col 3** | Lesser Mana Regen Augment (ID: 10284)
  - *Increases Mana Regen.*
- **Col 3** | Stamina Regen Intensity (ID: 10285)
  - *Increases Stamina Regen, but decreases Stun Resistance.*
- **Col 3** | Precise Brutality (ID: 20086)
  - *Retaliatory Strike now increases Critical Damage by 11%, but the Critical Hit Chance Increase is decreased by 50%. (At Epic Lv. 5)*
- **Col 4** | Cooldown Speed Expertise (ID: 10286)
  - *Increases Cooldown Speed and Melee Evasion.*
- **Col 5** | Lesser Skill Damage Augment (ID: 10287)
  - *Increases Skill Damage Resistance.*
- **Col 5** | Debuff Duration Intensity (ID: 10288)
  - *Increases Debuff Duration, but decreases Attack Range.*
- **Col 5** | Universal Protection (ID: 20087)
  - *Fatal Precision now increases Magic, Melee, and Ranged Defense by 270 instead of increasing Attack Speed. (At Epic Lv. 5)*
- **Col 6** | Ranged Evasion Expertise (ID: 10289)
  - *Increases Ranged Evasion and Buff Duration.*
- **Col 7** | Lesser Fear Augment (ID: 10290)
  - *Increases Fear Chance.*
- **Col 7** | Crowd Control Intensity (ID: 10291)
  - *Increases all CC Chance, but decreases Potion Healing.*
- **Col 7** | Swift Reaper (ID: 20088)
  - *Death Knell additionally increases Cooldown Speed by 15%. (At Epic Lv. 5)*
- **Col 8** | Movement Speed Expertise (ID: 10292)
  - *Increases Base Damage and Movement Speed. Base Damage increases from Lv. 5.*


#### Ramo 2
- **Col 1** | Ignite Damage Augment (ID: 10293)
  - *Increases Ignite damage over time by <span class="light_green_text">1%</span>.*
  - **Níveis da Passiva**: O efeito melhora por nível (1 ao 16+).
- **Col 1** | Critical Damage Intensity (ID: 10294)
  - *Increases Critical Damage, but decreases Melee Defense.*
- **Col 1** | Ultimate Impact (ID: 20089)
  - *Mortal Wrath Damage is boosted by 225%, but can only be activated 1 time per skill. Magic, Melee, and Ranged Defense decreases by 200.*
- **Col 2** | Melee Critical Hit Expertise (ID: 10295)
  - *Increases Melee Critical Hit Chance and Buff Duration.*
- **Col 3** | Cooldown Speed Augment (ID: 10296)
  - *Increases Cooldown Speed.*
- **Col 3** | Attack Range Intensity (ID: 10297)
  - *Increases Attack Range, but decreases Silence Resistance.*
- **Col 3** | Unlimited Arsenal (ID: 20090)
  - *Imposing Form now has a 7% of activation chance and is applied to all weapons.*
- **Col 4** | Endurance Expertise (ID: 10298)
  - *Increases Magic, Melee, and Ranged Endurance and Max Stamina. Max Stamina increases from Lv. 3.*
- **Col 5** | Evasion Augment (ID: 10299)
  - *Increases Magic, Melee, and Ranged Evasion.*
- **Col 5** | Healing Received Intensity (ID: 10300)
  - *Increases Healing Received, but decreases Attack Speed.*
- **Col 5** | Sustaining Guard (ID: 20091)
  - *Mortal Wrath restores Health equal to 29% of Base Damage + 4 damage, but decreases Damage Dealt by 20%. (At Epic Lv. 5)*
- **Col 6** | Magic Evasion Expertise (ID: 10301)
  - *Increases Magic Evasion and Max Health.*
- **Col 7** | Sleep Resistance Augment (ID: 10302)
  - *Increases Sleep Resistance.*
- **Col 7** | Shield Block Penetration Intensity (ID: 10303)
  - *Increases Shield Block Penetration, but decreases Amitoi Healing.*
- **Col 7** | Malice Master (ID: 20092)
  - *Increases Malice Surge activation chance by 7.5%.*
- **Col 8** | Attack Speed Expertise (ID: 10304)
  - *Increases Attack Speed and Melee Hit Chance.*


#### Ramo 3
- **Col 1** | Greater Bonus Damage Augment (ID: 10305)
  - *Increases Bonus Damage.*
- **Col 1** | Melee Heavy Attack Intensity (ID: 10306)
  - *Increases Melee Heavy Attack Chance, but decreases Melee Endurance.*
- **Col 1** | Supreme Burst (ID: 20093)
  - *The Damage Boost effect on targets with 5 Burst stacks is additionally boosted by 7%.*
- **Col 2** | Skill Damage Boost Expertise (ID: 10307)
  - *Increases Skill Damage Boost and Mana Cost Efficiency.*
- **Col 3** | Greater Attack Range Augment (ID: 10308)
  - *Increases Attack Range.*
- **Col 3** | Max Health Intensity (ID: 10309)
  - *Increases Max Health, but decreases Fear Chance.*
- **Col 3** | Repulsive Force (ID: 20094)
  - *All Spear skill cooldowns decrease by 3s when successfully defending a Fury Attack with Patient Block within 3s. Can only be activated once.*
- **Col 4** | Ranged Endurance Expertise (ID: 10310)
  - *Increased Skill Damage Resistance and Ranged Endurance.*
- **Col 5** | Greater Damage Reduction Augment (ID: 10311)
  - *Increases Damage Reduction.*
- **Col 5** | Skill Damage Resistance Intensity (ID: 10312)
  - *Increases Skill Damage Resistance, but decreases Melee Critical Hit Chance.*
- **Col 5** | Enduring Dash (ID: 20095)
  - *Increases Magic, Melee, and Ranged Endurance by 250 for 3s when using a Movement skill.*
- **Col 6** | Magic Heavy Attack Response (ID: 10313)
  - *Increases Magic Heavy Attack Evasion and Cooldown Speed.*
- **Col 7** | Greater Collision Augment (ID: 10314)
  - *Increases Collision Chance.*
- **Col 7** | CC Resistance Intensity (ID: 10315)
  - *Increases all CC Resistances, but decreases Buff Duration.*
- **Col 7** | Precise Control (ID: 20096)
  - *Increases Hit Chance by 15% for Spear Control skills.*
- **Col 8** | Melee Critical Hit Expertise (ID: 10316)
  - *Increases Melee Critical Hit Chance and Stun Chance.*


#### Ramo 5
- **Col 1** | Explosive Force (ID: 10317)
  - *Explosion Damage with Rising Slash or Slaughtering Slash increases by <span class="light_green_text">11%</span> per stack when causing a Burst or Ignite explosion.*
  - **Níveis da Passiva**: O efeito melhora por nível (1 ao 16+).
- **Col 3** | Tenacious Spirit (ID: 10318)
  - *Increases Cooldown Speed by <span class="light_green_text">6.6%</span> when the user's Fortitude is 50 or higher.*
  - **Níveis da Passiva**: O efeito melhora por nível (1 ao 16+).
- **Col 5** | Victory Shield (ID: 10319)
  - *Grants a shield with <span class="light_green_text">3300</span> Health for 3s when defeating an opponent with a Spear skill. Has a 25-second cooldown.*
  - **Níveis da Passiva**: O efeito melhora por nível (1 ao 16+).
- **Col 7** | Ruthlessness (ID: 10320)
  - *Increases Stun, Collision, and Fear Chance by <span class="light_green_text">22</span> for every 10 Fortitude.*
  - **Níveis da Passiva**: O efeito melhora por nível (1 ao 16+).


### Orb (ID: 34)
#### Ramo 1
- **Col 1** | Orb Max Damage Increase (ID: 10321)
  - *Increases max damage for Orbs.*
- **Col 1** | Attack Speed Concentration (ID: 10322)
  - *Increases Attack Speed and decreases Ranged Defense.*
- **Col 1** | Resonant Heavy Attack (ID: 20097)
  - *When <span class="light_green_text">Rift Fracture</span> is active, Heavy Attacks trigger <span class="light_green_text">Weaken: Rift Fracture</span> instead of Critical Hits, and damage is amplified by <span class="light_green_text">30%</span>.*
- **Col 2** | Relentless Mana Cost Efficiency (ID: 10323)
  - *Increases Base Damage and Mana Cost Efficiency. Base Damage increases from Lv. 5.*
- **Col 3** | Mana Regen Augment (ID: 10324)
  - *Increases Mana Regen.*
- **Col 3** | Shield Health Concentration (ID: 10325)
  - *Increases Shield Health and decreases Weaken Chance.*
- **Col 3** | Coordinated Fracture (ID: 20098)
  - *When <span class="light_green_text">Rift Fracture</span> is active, <span class="light_green_text">Weaken: Rift Fracture</span> can also be triggered by a party member's attack and deals damage.*
- **Col 4** | Enhance Silence Resistance (ID: 10326)
  - *Increases Melee Evasion and Silence Resistance.*
- **Col 5** | Melee Defense Augment (ID: 10327)
  - *Increases Melee Defense.*
- **Col 5** | Shield Health Concentration (ID: 10328)
  - *Increases Shield Health Received and decreases All Hit Chance.*
- **Col 5** | Stellar Flare (ID: 20099)
  - *Activating <span class="light_green_text">Constellation Link</span> now reduces damage taken while Shielded by an additional <span class="light_green_text">5%</span> but reduces effect duration by <span class="light_green_text">1.5s</span>.*
- **Col 6** | Max Health Expertise (ID: 10329)
  - *Increases Max Health and All Endurance.*
- **Col 7** | Increase Movement Speed (ID: 10330)
  - *Increases Movement Speed.*
- **Col 7** | Cooldown Speed Concentration (ID: 10331)
  - *Increases Skill Cooldown Speed and decreases Mana Cost Efficiency.*
- **Col 7** | Galactic Acceleration (ID: 20100)
  - *Activating <span class="light_green_text">Pulsating Galaxy</span> increases Attack Speed by <span class="light_green_text">10%</span> for <span class="light_green_text">2s</span> upon reaching the max number of stacks.*
- **Col 8** | Enhance Skill Damage (ID: 10332)
  - *Increases Buff Duration and Skill Damage Boost.*


#### Ramo 2
- **Col 1** | Increase Attack Range (ID: 10333)
  - *Increases Attack Range.*
- **Col 1** | Magic Heavy Attack Concentration (ID: 10334)
  - *Increases Magic Heavy Attack and decreases Shield Health.*
- **Col 1** | Stacking Echo (ID: 20101)
  - *When <span class="light_green_text">Stellar Echo</span> is activated, increases the number of additional projectiles launched from <span class="light_green_text">Stellar Echo</span> from 6 to 9.*
- **Col 2** | Max Mana Mastery (ID: 10335)
  - *Increases Bonus Damage and Max Mana.*
- **Col 3** | Increase Shield Health (ID: 10336)
  - *Increases Shield Health*
- **Col 3** | Mana Efficiency Concentration (ID: 10337)
  - *Increases Mana Cost Efficiency and decreases Buff Duration.*
- **Col 3** | Cosmic Cycle (ID: 20102)
  - *Activating <span class="light_green_text">Stellar Cycle</span> now increases Mana Recovery by <span class="light_green_text">0.5%</span> of Max Mana.*
- **Col 4** | Debuff Duration Expertise (ID: 10338)
  - *Increases Debuff Duration and Max Health*
- **Col 5** | Increase Melee Evasion (ID: 10339)
  - *Increases Melee Evasion.*
- **Col 5** | Shield Damage Reduction Concentration (ID: 10340)
  - *Increases Damage Reduction while Shielded and decreases Magic Critical Hit Chance.*
- **Col 5** | Celestial Guard (ID: 20103)
  - *Activating <span class="light_green_text">Astral Overseer</span> now increases Shield Health by <span class="light_green_text">3%</span> instead of increasing Critical Hit Chance. (based on Epic Lv. 5 values)*
- **Col 6** | Damage Reduction Expertise (ID: 10341)
  - *Increases Damage Reduction and Weaken Chance.*
- **Col 7** | All Species Defense (ID: 10342)
  - *Increases all Species Damage Resistance.*
- **Col 7** | Attack Range Concentration (ID: 10343)
  - *Increases Attack Range and decreases Mana Regen.*
- **Col 7** | Eternal Body (ID: 20104)
  - *Activating <span class="light_green_text">Eternal Veil</span> now increases Healing Received by <span class="light_green_text">12.5%</span> and Shield Health Received by <span class="light_green_text">7.5%</span> instead of increasing Shield Health. Shield Health Received further increases by <span class="light_green_text">0.4%</span> per <span class="light_green_text">1,000</span> Max Health, up to 50,000 (based on Epic Lv. 5 values).*
- **Col 8** | Relentless Stamina Regen (ID: 10344)
  - *Increases Stamina Regen and Max Damage. Max Damage increases from Lv. 4.*


#### Ramo 3
- **Col 1** | Shielded Target Damage Augment (ID: 10345)
  - *Increases damage to Shielded targets.*
- **Col 1** | Magic Critical Hit Chance Concentration (ID: 10346)
  - *Increases Magic Critical Hit Chance and decreases Ranged Evasion.*
- **Col 1** | Flow Shift (ID: 20105)
  - *Amplifies <span class="light_green_text">Orb Effect</span> damage by <span class="light_green_text">25%</span>. Reduces the Shield Health of <span class="light_green_text">Distortion Veil</span> by <span class="light_green_text">25%</span> and the Shield Health of <span class="light_green_text">Guardian Defensive Wall</span> by <span class="light_green_text">25%</span>.*
- **Col 2** | Relentless Mana Regen (ID: 10347)
  - *Increases Attack Speed and Mana Regen.*
- **Col 3** | Distortion Veil Time Increase (ID: 10348)
  - *Increases <span class="light_green_text">Distortion Veil</span> duration by 0.1s.*
  - **Níveis da Passiva**: O efeito melhora por nível (1 ao 16+).
- **Col 3** | True Sage's Shield of Wisdom (ID: 10349)
  - *Increases Shield Health and decreases Stun Chance.*
- **Col 3** | Tranquil Will (ID: 20106)
  - *Increases Mana Cost Efficiency by <span class="light_green_text">15%</span> when remaining Mana is 33% or less.*
- **Col 4** | Regen Augment (ID: 10350)
  - *Increases Health Regen and Mana Regen.*
- **Col 5** | Max Health Augment (ID: 10351)
  - *Increases Max Health.*
- **Col 5** | Heavy Attack Resistance Concentration (ID: 10352)
  - *Increases Heavy Attack Damage Resistance and decreases Magic Heavy Attack.*
- **Col 5** | Dimensional Seal (ID: 20107)
  - *<span class="light_green_text">Afterimage</span> applies the same Defense effect as <span class="light_green_text">Roll</span>.*
- **Col 6** | Skill Damage Resistance Expertise (ID: 10353)
  - *Increases Skill Damage Resistance and Buff Duration.*
- **Col 7** | Relentless All Species Damage (ID: 10354)
  - *Increases all Species Damage Boost.*
- **Col 7** | Dexterity Enchantment Sage (ID: 10355)
  - *Increases Buff Duration and decreases Max Mana.*
- **Col 7** | Spatial Rush (ID: 20108)
  - *Upon using a <span class="light_green_text">Movement</span> skill, increases <span class="light_green_text">Collision</span> and <span class="light_green_text">Weaken</span> Hit Chance by <span class="light_green_text">200</span> for 3s when <span class="light_green_text">Perception</span> is 80 or higher.<br><br>Upon using a <span class="light_green_text">Movement</span> skill, increases <span class="light_green_text">Collision</span> and <span class="light_green_text">Weaken</span> Resistance by <span class="light_green_text">200</span> when <span class="light_green_text">Fortitude</span> is 80 or higher.*
- **Col 8** | Skill Damage Expertise (ID: 10356)
  - *Increases Attack Range and Skill Damage Boost.*


#### Ramo 5
- **Col 1** | Light of Annihilation (ID: 10357)
  - *Using an <span class="light_green_text">Orb</span> increases Critical Damage of the next Active Skill used in <span class="light_green_text">6s</span> by <span class="light_green_text">7.7%</span>. Stacks up to 3 times.*
  - **Níveis da Passiva**: O efeito melhora por nível (1 ao 16+).
- **Col 3** | Seer (ID: 10358)
  - *When both <span class="light_green_text">Wisdom</span> and <span class="light_green_text">Perception</span> is 70 or above, applies an effect that increases Heavy Attack Damage by <span class="light_green_text">11%</span> to the <span class="light_green_text">Satellite</span> effect.*
  - **Níveis da Passiva**: O efeito melhora por nível (1 ao 16+).
- **Col 5** | Breath of Infinity (ID: 10359)
  - *When the <span class="light_green_text">Shield</span> effect is applied, restores the Shielded target's Health by <span class="light_green_text">55%</span> of Base Damage + <span class="light_green_text">165</span>. Using <span class="light_green_text">Shield</span> on yourself restores your Health one more time.*
  - **Níveis da Passiva**: O efeito melhora por nível (1 ao 16+).
- **Col 7** | Dark Erosion (ID: 10360)
  - *When <span class="light_green_text">Collision</span> or <span class="light_green_text">Stun</span> is applied with an <span class="light_green_text">Orb</span> Skill, reduces the duration of all <span class="light_green_text">player buffs</span> on the target by <span class="light_green_text">1.1s</span>.*
  - **Níveis da Passiva**: O efeito melhora por nível (1 ao 16+).

