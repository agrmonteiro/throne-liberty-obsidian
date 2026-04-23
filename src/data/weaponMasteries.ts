// GERADO AUTOMATICAMENTE — não edite manualmente
// Fonte: questlog.gg — weapon masteries level 10 (en + pt)

import type { L10n } from './skills'

export interface MasteryStat {
  label: L10n
  value: string
}

export interface WeaponMastery {
  id: string
  name: L10n
  weapon: string
  category: L10n
  grade: 'Common' | 'Uncommon' | 'Rare' | 'Epic' | string
  stats: MasteryStat[]
  description: L10n
}

export const WEAPON_MASTERIES: WeaponMastery[] = [
  {
    id: "Bow_Hero_Attack_01",
    name: { en: "Lethal Stacks", pt: "Acúmulos Letais" },
    weapon: "Longbow",
    category: { en: "Attack", pt: "Ataque" },
    grade: "Epic",
    stats: [

    ],
    description: { en: "Deadly Marker now applies 10 stacks of Bullseye to the target. Consuming Bullseye now has a 20% chance of reapplying the consumed number of Bullseye stacks to the target.", pt: "Marcador Mortal agora aplica 10 acúmulos de Na Mosca no alvo. Consumir Na Mosca tem uma chance de 20% de reaplicar o número consumido de acúmulos de Na Mosca no alvo" },
  },
  {
    id: "Bow_Hero_Defense_03",
    name: { en: "Punishing Grip", pt: "Aderência Punitiva" },
    weapon: "Longbow",
    category: { en: "Defense", pt: "Defesa" },
    grade: "Epic",
    stats: [

    ],
    description: { en: "Taking Melee Damage has a(n) 16% chance to Bind the opponent for 3s. Applies Oppression instead to Boss monsters for the same duration. Has a 60-second cooldown.", pt: "Sofrer Dano Corpo a Corpo tem uma chance de 16% de Imobilizar o oponente por 3s. Aplica Opressão aos monstros Chefes pelo mesmo período. Tem uma recarga de 60s" },
  },
  {
    id: "Bow_Hero_Tactic_04",
    name: { en: "Range Reducer", pt: "Redutor de Alcance" },
    weapon: "Longbow",
    category: { en: "", pt: "" },
    grade: "Epic",
    stats: [

    ],
    description: { en: "Successfully hitting a target with a Longbow Control Skill decreases the target's Attack Range by 2.5% for 4s. Does not apply to monsters.", pt: "Acertar um alvo com Habilidade de Controle de Arco Longo reduz o Alcance de Ataque do alvo em 2.5% por 4s. Não se aplica a monstros" },
  },
  {
    id: "Bow_Hero_Util_02",
    name: { en: "Rhythmical Shooting", pt: "Tiroteio Rítmico" },
    weapon: "Longbow",
    category: { en: "Utility", pt: "Utilidade" },
    grade: "Epic",
    stats: [

    ],
    description: { en: "Every time you use the different skill from the skill that you used right before, the main weapon damage increases by 12 for 3 seconds. Stacks up to 5 times.", pt: "Cada vez que você utiliza uma habilidade diferente da utilizada logo antes, o dano da sua arma principal aumenta em 12 por 3 segundos. Acumulável até 5 vezes." },
  },
  {
    id: "Bow_High_Attack_01",
    name: { en: "Ranged Critical Hit Augment", pt: "Aumento de Acerto Crítico à Distância" },
    weapon: "Longbow",
    category: { en: "Attack", pt: "Ataque" },
    grade: "Uncommon",
    stats: [
      { label: { en: "Ranged Critical Hit Chance", pt: "Chance de Acerto Crítico à Distância" }, value: "40" },
    ],
    description: { en: "Increases Ranged Critical Hit Chance.", pt: "Aumento de Acerto Crítico à Distância" },
  },
  {
    id: "Bow_High_Attack_02",
    name: { en: "Critical Damage Intensity", pt: "Intensidade de Dano Crítico" },
    weapon: "Longbow",
    category: { en: "Attack", pt: "Ataque" },
    grade: "Uncommon",
    stats: [
      { label: { en: "Melee Endurance", pt: "Tolerância Corpo a Corpo" }, value: "-45" },
      { label: { en: "Critical Damage", pt: "Dano Crítico" }, value: "3%" },
    ],
    description: { en: "Increases Critical Damage, but decreases Melee Endurance.", pt: "Aumenta o Dano Crítico, mas reduz a Tolerância Corpo a Corpo" },
  },
  {
    id: "Bow_High_Attack_Skill",
    name: { en: "Roxie's Arrow Storm", pt: "Tempestade de Flechas de Roxie" },
    weapon: "Longbow",
    category: { en: "Attack", pt: "Ataque" },
    grade: "Uncommon",
    stats: [

    ],
    description: { en: "", pt: "" },
  },
  {
    id: "Bow_High_AttackUtil_03",
    name: { en: "Ranged Heavy Attack Expertise", pt: "Especialização em Ataque Pesado à Distância" },
    weapon: "Longbow",
    category: { en: "", pt: "" },
    grade: "Uncommon",
    stats: [
      { label: { en: "Mana Regen", pt: "Regeneração de Mana" }, value: "15" },
      { label: { en: "Ranged Heavy Attack Chance", pt: "Chance de Ataque Pesado à Distância" }, value: "20" },
    ],
    description: { en: "Increases Ranged Heavy Attack Chance and Mana Regen.", pt: "Especialização em Ataque Pesado à Distância" },
  },
  {
    id: "Bow_High_Defense_07",
    name: { en: "Critical Damage Resistance Augment", pt: "Aumento de Resistência a Dano Crítico" },
    weapon: "Longbow",
    category: { en: "Defense", pt: "Defesa" },
    grade: "Uncommon",
    stats: [
      { label: { en: "Critical Damage Resistance", pt: "Resistência a Dano Crítico" }, value: "2.7%" },
    ],
    description: { en: "Critical Damage Resistance Augment", pt: "Aumento de Resistência a Dano Crítico" },
  },
  {
    id: "Bow_High_Defense_08",
    name: { en: "Magic Evasion Intensity", pt: "Intensidade de Esquiva Mágica" },
    weapon: "Longbow",
    category: { en: "Defense", pt: "Defesa" },
    grade: "Uncommon",
    stats: [
      { label: { en: "Magic Evasion", pt: "Esquiva Mágica" }, value: "90" },
      { label: { en: "Ranged Critical Hit Chance", pt: "Chance de Acerto Crítico à Distância" }, value: "-30" },
    ],
    description: { en: "Increases Magic Evasion, but decreases Ranged Critical Hit Chance.", pt: "Chance de Acerto Crítico à Distância" },
  },
  {
    id: "Bow_High_DefenseTactic_09",
    name: { en: "Heavy Attack Evasion Expertise", pt: "Especialização em Esquiva de Ataque Pesado" },
    weapon: "Longbow",
    category: { en: "", pt: "" },
    grade: "Uncommon",
    stats: [
      { label: { en: "Stun Resistance", pt: "Resistência a Atordoamento" }, value: "25" },
      { label: { en: "Magic Heavy Attack Evasion", pt: "Esquiva de Ataque Pesado Mágico" }, value: "20" },
      { label: { en: "Melee Heavy Attack Evasion", pt: "Esquiva de Ataque Pesado Corpo a Corpo" }, value: "20" },
      { label: { en: "Ranged Heavy Attack Evasion", pt: "Esquiva de Ataque Pesado à Distância" }, value: "20" },
    ],
    description: { en: "Increases Magic, Melee, and Ranged Heavy Attack Evasion and Stun Resistance.", pt: "Especialização em Esquiva de Ataque Pesado" },
  },
  {
    id: "Bow_High_Def_Skill",
    name: { en: "Sniper's Trap", pt: "Armadilha de Franco-atirador" },
    weapon: "Longbow",
    category: { en: "Defense", pt: "Defesa" },
    grade: "Uncommon",
    stats: [

    ],
    description: { en: "", pt: "" },
  },
  {
    id: "Bow_High_Tac_Skill",
    name: { en: "Battle Tempo", pt: "Tempo de Batalha" },
    weapon: "Longbow",
    category: { en: "", pt: "" },
    grade: "Uncommon",
    stats: [

    ],
    description: { en: "", pt: "" },
  },
  {
    id: "Bow_High_Tactic_10",
    name: { en: "CC Resistance Augment", pt: "Aumento de Resistência a CM" },
    weapon: "Longbow",
    category: { en: "", pt: "" },
    grade: "Uncommon",
    stats: [
      { label: { en: "Bind Resistance", pt: "Resistência a Imobilização" }, value: "33.25" },
      { label: { en: "Stun Resistance", pt: "Resistência a Atordoamento" }, value: "33.25" },
      { label: { en: "Fear Resistance", pt: "Resistência a Medo" }, value: "33.25" },
      { label: { en: "Sleep Resistance", pt: "Resistência a Sono" }, value: "33.25" },
      { label: { en: "Weaken Resistance", pt: "Resistência a Fraqueza" }, value: "33.25" },
      { label: { en: "Silence Resistance", pt: "Resistência a Silêncio" }, value: "33.25" },
      { label: { en: "Collision Resistance", pt: "Resistência a Colisão" }, value: "33.25" },
      { label: { en: "Petrification Resistance", pt: "Resistência a Petrificação" }, value: "33.25" },
    ],
    description: { en: "", pt: "Aumenta a Resistência de CM Total" },
  },
  {
    id: "Bow_High_Tactic_11",
    name: { en: "Collision Intensity", pt: "Intensidade de Colisão" },
    weapon: "Longbow",
    category: { en: "", pt: "" },
    grade: "Uncommon",
    stats: [
      { label: { en: "Health Regen", pt: "Regeneração de Vida" }, value: "-30" },
      { label: { en: "Collision Chance", pt: "Chance de Colisão" }, value: "75" },
    ],
    description: { en: "Increases Collision Chance, but decreases Health Regen.", pt: "Aumenta a Chance de Colisão, mas reduz a Regeneração de Vida" },
  },
  {
    id: "Bow_High_TacticAttack_12",
    name: { en: "Max Damage Expertise", pt: "Especialista em Dano Máximo" },
    weapon: "Longbow",
    category: { en: "", pt: "" },
    grade: "Uncommon",
    stats: [
      { label: { en: "Max Mana", pt: "Mana Máxima" }, value: "160" },
      { label: { en: "Max Damage", pt: "Dano Máx." }, value: "3" },
    ],
    description: { en: "Increases Max Damage and Max Mana. Max Damage increases from Lv. 4.", pt: "Aumenta o Dano Máximo e a Mana Máxima. Aumenta o Dano Máximo a partir do Nv.4" },
  },
  {
    id: "Bow_High_Util_04",
    name: { en: "Mana Cost Efficiency Augment", pt: "Aumento de Eficiência do Custo de Mana" },
    weapon: "Longbow",
    category: { en: "Utility", pt: "Utilidade" },
    grade: "Uncommon",
    stats: [
      { label: { en: "Mana Cost Efficiency", pt: "Eficiência do Custo de Mana" }, value: "4%" },
    ],
    description: { en: "Increases Mana Cost Efficiency.", pt: "Aumento de Eficiência do Custo de Mana" },
  },
  {
    id: "Bow_High_Util_05",
    name: { en: "Max Stamina Intensity", pt: "Intensidade de Vigor Máximo" },
    weapon: "Longbow",
    category: { en: "Utility", pt: "Utilidade" },
    grade: "Uncommon",
    stats: [
      { label: { en: "Max Stamina", pt: "Vigor Máximo" }, value: "12" },
      { label: { en: "Bind Chance", pt: "Chance de Imobilização" }, value: "-37.5" },
    ],
    description: { en: "Increases Max Stamina, but decreases Bind Chance.", pt: "Aumenta o Vigor Máximo, mas reduz a Chance de Imobilização" },
  },
  {
    id: "Bow_High_UtilDefense_06",
    name: { en: "Damage Resistance Expertise", pt: "Especialização em Resistência a Dano" },
    weapon: "Longbow",
    category: { en: "", pt: "" },
    grade: "Uncommon",
    stats: [
      { label: { en: "Health Regen", pt: "Regeneração de Vida" }, value: "20" },
      { label: { en: "Skill Damage Resistance", pt: "Resistência a Dano de Habilidade" }, value: "10" },
    ],
    description: { en: "Increases Skill Damage Resistance and Health Regen.", pt: "Especialização em Resistência a Dano" },
  },
  {
    id: "Bow_High_Util_Skill",
    name: { en: "Survival Mend", pt: "Reparo de Sobrevivência" },
    weapon: "Longbow",
    category: { en: "Utility", pt: "Utilidade" },
    grade: "Uncommon",
    stats: [

    ],
    description: { en: "", pt: "" },
  },
  {
    id: "Bow_Normal_Attack_01",
    name: { en: "Lesser Attack Range Augment", pt: "Aumento Inferior de Alcance de Ataque" },
    weapon: "Longbow",
    category: { en: "Attack", pt: "Ataque" },
    grade: "Common",
    stats: [
      { label: { en: "Range", pt: "Alcance" }, value: "3.2%" },
    ],
    description: { en: "", pt: "Aumento Inferior de Alcance de Ataque" },
  },
  {
    id: "Bow_Normal_Attack_02",
    name: { en: "Ranged Critical Hit Intensity", pt: "Intensidade de Acerto Crítico à Distância" },
    weapon: "Longbow",
    category: { en: "Attack", pt: "Ataque" },
    grade: "Common",
    stats: [
      { label: { en: "Melee Heavy Attack Evasion", pt: "Esquiva de Ataque Pesado Corpo a Corpo" }, value: "-36" },
      { label: { en: "Ranged Critical Hit Chance", pt: "Chance de Acerto Crítico à Distância" }, value: "48" },
    ],
    description: { en: "Increases Ranged Critical Hit Chance, but decreases Melee Heavy Attack Evasion.", pt: "Intensidade de Acerto Crítico à Distância" },
  },
  {
    id: "Bow_Normal_Attack_Skill",
    name: { en: "Far Sight", pt: "Visão Distante" },
    weapon: "Longbow",
    category: { en: "Attack", pt: "Ataque" },
    grade: "Common",
    stats: [

    ],
    description: { en: "", pt: "" },
  },
  {
    id: "Bow_Normal_AttackUtil_03",
    name: { en: "Base Damage Expertise", pt: "Especialização em Dano Base" },
    weapon: "Longbow",
    category: { en: "", pt: "" },
    grade: "Common",
    stats: [
      { label: { en: "Mana Cost Efficiency", pt: "Eficiência do Custo de Mana" }, value: "1.6%" },
      { label: { en: "Base Damage", pt: "Dano Base" }, value: "2" },
    ],
    description: { en: "Increases Base Damage and Mana Cost Efficiency. Base Damage increases from Lv. 5.", pt: "Aumenta o Dano Base e a Eficiência do Custo de Mana. Aumenta o Dano Base a partir do Nv.5" },
  },
  {
    id: "Bow_Normal_Defense_07",
    name: { en: "Lesser Debuff Duration Augment", pt: "Aumento Inferior de Duração da Desvantagem" },
    weapon: "Longbow",
    category: { en: "Defense", pt: "Defesa" },
    grade: "Common",
    stats: [
      { label: { en: "Debuff Duration", pt: "Duração da Desvantagem" }, value: "-1.6%" },
    ],
    description: { en: "", pt: "Aumento Inferior de Duração da Desvantagem" },
  },
  {
    id: "Bow_Normal_Defense_08",
    name: { en: "Max Health Intensity", pt: "Intensidade de Vida Máxima" },
    weapon: "Longbow",
    category: { en: "Defense", pt: "Defesa" },
    grade: "Common",
    stats: [
      { label: { en: "Max Health", pt: "Vida Máxima" }, value: "384" },
      { label: { en: "Ranged Hit Chance", pt: "Chance de Acerto à Distância" }, value: "-24" },
    ],
    description: { en: "Increases Max Health, but decreases Ranged Hit Chance.", pt: "Aumenta a Vida Máxima, mas reduz a Chance de Acerto à Distância" },
  },
  {
    id: "Bow_Normal_DefenseTactic_09",
    name: { en: "Skill Damage Resistance Expertise", pt: "Especialização em Resistência a Dano de Habilidade" },
    weapon: "Longbow",
    category: { en: "", pt: "" },
    grade: "Common",
    stats: [
      { label: { en: "Bind Chance", pt: "Chance de Imobilização" }, value: "20" },
      { label: { en: "Skill Damage Resistance", pt: "Resistência a Dano de Habilidade" }, value: "8" },
    ],
    description: { en: "Skill Damage Resistance Expertise", pt: "Especialização em Resistência a Dano de Habilidade" },
  },
  {
    id: "Bow_Normal_Def_Skill",
    name: { en: "Life Ward", pt: "Ala da Vida" },
    weapon: "Longbow",
    category: { en: "Defense", pt: "Defesa" },
    grade: "Common",
    stats: [

    ],
    description: { en: "", pt: "" },
  },
  {
    id: "Bow_Normal_Tac_Skill",
    name: { en: "Combat Sanctuary", pt: "Santuário de Combate" },
    weapon: "Longbow",
    category: { en: "", pt: "" },
    grade: "Common",
    stats: [

    ],
    description: { en: "", pt: "" },
  },
  {
    id: "Bow_Normal_Tactic_10",
    name: { en: "Lesser Cooldown Speed Augment", pt: "Aumento Inferior de Velocidade de Recarga" },
    weapon: "Longbow",
    category: { en: "", pt: "" },
    grade: "Common",
    stats: [
      { label: { en: "Cooldown Speed", pt: "Velocidade de Recarga" }, value: "1.6%" },
    ],
    description: { en: "", pt: "Aumento Inferior de Velocidade de Recarga" },
  },
  {
    id: "Bow_Normal_Tactic_11",
    name: { en: "Movement Speed Intensity", pt: "Intensidade de Velocidade de Movimento" },
    weapon: "Longbow",
    category: { en: "", pt: "" },
    grade: "Common",
    stats: [
      { label: { en: "Movement Speed", pt: "Velocidade de Movimento" }, value: "3.2%" },
      { label: { en: "Targeted Skill Healing over Time", pt: "Cura Contínua de Habilidade direcionada" }, value: "-2%" },
    ],
    description: { en: "Targeted Skill Healing over Time", pt: "Intensidade de Velocidade de Movimento" },
  },
  {
    id: "Bow_Normal_TacticAttack_12",
    name: { en: "Ranged Hit Expertise", pt: "Especialização em Acerto à Distância" },
    weapon: "Longbow",
    category: { en: "", pt: "" },
    grade: "Common",
    stats: [
      { label: { en: "Ranged Hit Chance", pt: "Chance de Acerto à Distância" }, value: "16" },
      { label: { en: "Bonus Damage", pt: "Bônus de Dano" }, value: "6" },
    ],
    description: { en: "Increases Ranged Hit Chance and Bonus Damage.", pt: "Especialização em Acerto à Distância" },
  },
  {
    id: "Bow_Normal_Util_04",
    name: { en: "Lesser Mana Regen Augment", pt: "Aumento Inferior de Regeneração de Mana" },
    weapon: "Longbow",
    category: { en: "Utility", pt: "Utilidade" },
    grade: "Common",
    stats: [
      { label: { en: "Mana Regen", pt: "Regeneração de Mana" }, value: "24" },
    ],
    description: { en: "", pt: "Aumento Inferior de Regeneração de Mana" },
  },
  {
    id: "Bow_Normal_Util_05",
    name: { en: "Focus on Skill Healing over Time", pt: "Foco em Cura Contínua de Habilidade" },
    weapon: "Longbow",
    category: { en: "Utility", pt: "Utilidade" },
    grade: "Common",
    stats: [
      { label: { en: "Weaken Resistance", pt: "Resistência a Fraqueza" }, value: "-30" },
      { label: { en: "Skill Healing over Time", pt: "Cura Contínua de Habilidade" }, value: "6%" },
    ],
    description: { en: "Focus on Skill Healing over Time", pt: "Foco em Cura Contínua de Habilidade" },
  },
  {
    id: "Bow_Normal_UtilDefense_06",
    name: { en: "Magic Defense Expertise", pt: "Especialização em Defesa Mágica" },
    weapon: "Longbow",
    category: { en: "", pt: "" },
    grade: "Common",
    stats: [
      { label: { en: "Magic Defense", pt: "Defesa Mágica" }, value: "32" },
      { label: { en: "Buff Duration", pt: "Duração da Vantagem" }, value: "1.1%" },
    ],
    description: { en: "Increases Buff Duration and Magic Defense.", pt: "Especialização em Defesa Mágica" },
  },
  {
    id: "Bow_Normal_Util_Skill",
    name: { en: "Wind Rush", pt: "Investida de Vento" },
    weapon: "Longbow",
    category: { en: "Utility", pt: "Utilidade" },
    grade: "Common",
    stats: [

    ],
    description: { en: "", pt: "" },
  },
  {
    id: "Bow_Rare_Attack_01",
    name: { en: "Greater Attack Speed Augment", pt: "Aumento Superior de Velocidade de Ataque" },
    weapon: "Longbow",
    category: { en: "Attack", pt: "Ataque" },
    grade: "Rare",
    stats: [
      { label: { en: "Attack Speed", pt: "Velocidade de Ataque" }, value: "3.2%" },
    ],
    description: { en: "", pt: "Aumento Superior de Velocidade de Ataque" },
  },
  {
    id: "Bow_Rare_Attack_02",
    name: { en: "Skill Damage Boost Intensity", pt: "Intensidade de Ampliação de Dano de Habilidade" },
    weapon: "Longbow",
    category: { en: "Attack", pt: "Ataque" },
    grade: "Rare",
    stats: [
      { label: { en: "Dexterity", pt: "Destreza" }, value: "2" },
      { label: { en: "Max Health", pt: "Vida Máxima" }, value: "-288" },
      { label: { en: "Skill Damage Boost", pt: "Ampliação de Dano de Habilidade" }, value: "36" },
    ],
    description: { en: "Increases Skill Damage Boost, but decreases Max Health.", pt: "Intensidade de Ampliação de Dano de Habilidade" },
  },
  {
    id: "Bow_Rare_Attack_Skill",
    name: { en: "Bullseye Hunter", pt: "Caçada Certeira" },
    weapon: "Longbow",
    category: { en: "Attack", pt: "Ataque" },
    grade: "Rare",
    stats: [

    ],
    description: { en: "", pt: "" },
  },
  {
    id: "Bow_Rare_AttackUtil_03",
    name: { en: "Ranged Hit Expertise", pt: "Especialização em Acerto à Distância" },
    weapon: "Longbow",
    category: { en: "", pt: "" },
    grade: "Rare",
    stats: [
      { label: { en: "Health Regen", pt: "Regeneração de Vida" }, value: "24" },
      { label: { en: "Ranged Hit Chance", pt: "Chance de Acerto à Distância" }, value: "24" },
    ],
    description: { en: "Increases Ranged Hit Chance and Health Regen.", pt: "Especialização em Acerto à Distância" },
  },
  {
    id: "Bow_Rare_Defense_07",
    name: { en: "Greater Evasion Augment", pt: "Aumento Superior de Esquiva" },
    weapon: "Longbow",
    category: { en: "Defense", pt: "Defesa" },
    grade: "Rare",
    stats: [
      { label: { en: "Magic Evasion", pt: "Esquiva Mágica" }, value: "48" },
      { label: { en: "Melee Evasion", pt: "Esquiva Corpo a Corpo" }, value: "48" },
      { label: { en: "Ranged Evasion", pt: "Esquiva à Distância" }, value: "48" },
    ],
    description: { en: "Increases Magic, Melee, and Ranged Evasion.", pt: "Aumenta a Esquiva à Distância, Corpo a Corpo e Mágica" },
  },
  {
    id: "Bow_Rare_Defense_08",
    name: { en: "Skill Damage Resistance Intensity", pt: "Intensidade de Resistência a Dano de Habilidade" },
    weapon: "Longbow",
    category: { en: "Defense", pt: "Defesa" },
    grade: "Rare",
    stats: [
      { label: { en: "Perception", pt: "Percepção" }, value: "2" },
      { label: { en: "Attack Speed", pt: "Velocidade de Ataque" }, value: "-1.8%" },
      { label: { en: "Skill Damage Resistance", pt: "Resistência a Dano de Habilidade" }, value: "36" },
    ],
    description: { en: "Skill Damage Resistance Intensity", pt: "Intensidade de Resistência a Dano de Habilidade" },
  },
  {
    id: "Bow_Rare_DefenseTactic_09",
    name: { en: "Magic Endurance Expertise", pt: "Especialização em Tolerância Mágica" },
    weapon: "Longbow",
    category: { en: "", pt: "" },
    grade: "Rare",
    stats: [
      { label: { en: "Bind Chance", pt: "Chance de Imobilização" }, value: "30" },
      { label: { en: "Magic Endurance", pt: "Tolerância Mágica" }, value: "36" },
    ],
    description: { en: "Increases Magic Endurance and Bind Chance.", pt: "Especialização em Tolerância Mágica" },
  },
  {
    id: "Bow_Rare_Def_Skill",
    name: { en: "Keen Reflexes", pt: "Reflexos Aguçados" },
    weapon: "Longbow",
    category: { en: "Defense", pt: "Defesa" },
    grade: "Rare",
    stats: [

    ],
    description: { en: "", pt: "" },
  },
  {
    id: "Bow_Rare_Tac_Skill",
    name: { en: "Archer's Surge", pt: "Surto de Arqueiro" },
    weapon: "Longbow",
    category: { en: "", pt: "" },
    grade: "Rare",
    stats: [

    ],
    description: { en: "", pt: "" },
  },
  {
    id: "Bow_Rare_Tactic_10",
    name: { en: "Greater Bind Duration Augment", pt: "Aumento Superior da Duração da Imobilização" },
    weapon: "Longbow",
    category: { en: "", pt: "" },
    grade: "Rare",
    stats: [

    ],
    description: { en: "Bind Duration increases by 0.8s.", pt: "Aumento Superior da Duração da Imobilização" },
  },
  {
    id: "Bow_Rare_Tactic_11",
    name: { en: "CC Resistance Intensity", pt: "Intensidade de Resistência a CM" },
    weapon: "Longbow",
    category: { en: "", pt: "" },
    grade: "Rare",
    stats: [
      { label: { en: "Bind Resistance", pt: "Resistência a Imobilização" }, value: "60" },
      { label: { en: "Stun Resistance", pt: "Resistência a Atordoamento" }, value: "60" },
      { label: { en: "Fear Resistance", pt: "Resistência a Medo" }, value: "60" },
      { label: { en: "Sleep Resistance", pt: "Resistência a Sono" }, value: "60" },
      { label: { en: "Weaken Resistance", pt: "Resistência a Fraqueza" }, value: "60" },
      { label: { en: "Silence Resistance", pt: "Resistência a Silêncio" }, value: "60" },
      { label: { en: "Collision Resistance", pt: "Resistência a Colisão" }, value: "60" },
      { label: { en: "Petrification Resistance", pt: "Resistência a Petrificação" }, value: "60" },
      { label: { en: "Amitoi Healing", pt: "Cura do Amitoi" }, value: "-15%" },
    ],
    description: { en: "Increases all CC Resistances, but decreases Amitoi Heal.", pt: "Intensidade de Resistência a CM" },
  },
  {
    id: "Bow_Rare_TacticAttack_12",
    name: { en: "Ranged Critical Expertise", pt: "Especialização em Acerto Crítico à Distância" },
    weapon: "Longbow",
    category: { en: "", pt: "" },
    grade: "Rare",
    stats: [
      { label: { en: "Range", pt: "Alcance" }, value: "2.4%" },
      { label: { en: "Ranged Critical Hit Chance", pt: "Chance de Acerto Crítico à Distância" }, value: "24" },
    ],
    description: { en: "Increases Ranged Critical Hit Chance and Attack Range.", pt: "Especialização em Acerto Crítico à Distância" },
  },
  {
    id: "Bow_Rare_Util_04",
    name: { en: "Greater Cooldown Speed Augment", pt: "Aumento Superior de Velocidade de Recarga" },
    weapon: "Longbow",
    category: { en: "Utility", pt: "Utilidade" },
    grade: "Rare",
    stats: [
      { label: { en: "Cooldown Speed", pt: "Velocidade de Recarga" }, value: "2.4%" },
    ],
    description: { en: "", pt: "Aumento Superior de Velocidade de Recarga" },
  },
  {
    id: "Bow_Rare_Util_05",
    name: { en: "Buff Duration Intensity", pt: "Intensidade de Duração da Vantagem" },
    weapon: "Longbow",
    category: { en: "Utility", pt: "Utilidade" },
    grade: "Rare",
    stats: [
      { label: { en: "Silence Resistance", pt: "Resistência a Silêncio" }, value: "-45" },
      { label: { en: "Buff Duration", pt: "Duração da Vantagem" }, value: "4.8%" },
    ],
    description: { en: "Increases Buff Duration, but decreases Silence Resistance.", pt: "Intensidade de Duração da Vantagem" },
  },
  {
    id: "Bow_Rare_UtilDefense_06",
    name: { en: "Max Health Expertise", pt: "Especialização em Vida Máxima" },
    weapon: "Longbow",
    category: { en: "", pt: "" },
    grade: "Rare",
    stats: [
      { label: { en: "Max Health", pt: "Vida Máxima" }, value: "192" },
      { label: { en: "Mana Regen", pt: "Regeneração de Mana" }, value: "18" },
    ],
    description: { en: "Increases Max Health and Mana Regen.", pt: "Aumenta a Vida Máxima e a Regeneração de Mana" },
  },
  {
    id: "Bow_Rare_Util_Skill",
    name: { en: "Blessing of Wisdom", pt: "Bênção da Sabedoria" },
    weapon: "Longbow",
    category: { en: "Utility", pt: "Utilidade" },
    grade: "Rare",
    stats: [

    ],
    description: { en: "", pt: "" },
  },
  {
    id: "Crossbow_Hero_Attack_01",
    name: { en: "Annihilator", pt: "Aniquilador" },
    weapon: "Crossbow",
    category: { en: "Attack", pt: "Ataque" },
    grade: "Epic",
    stats: [

    ],
    description: { en: "Increases Off-hand Double Attack Chance by 20% if any opponent is within a 10m radius.", pt: "Aumenta a Chance de Ataque Duplo com Arma Secundária em 20% se qualquer oponente estiver em um raio de 10m" },
  },
  {
    id: "Crossbow_Hero_Defense_03",
    name: { en: "Mirage Dancer", pt: "Dançante das Ilusões" },
    weapon: "Crossbow",
    category: { en: "Defense", pt: "Defesa" },
    grade: "Epic",
    stats: [

    ],
    description: { en: "Evading an attack increases Movement Speed by 8% for 3s. Using a Mobility skill increases Magic and Ranged Evasion by 200 for 3s.", pt: "Esquivar um ataque aumenta a Velocidade de Movimento em 8% por 3s. Usar uma Habilidade de Movimento aumenta a Esquiva à Distância e Mágica em 200 por 3s" },
  },
  {
    id: "Crossbow_Hero_Tactic_04",
    name: { en: "Archenemy", pt: "Arqui-inimigo" },
    weapon: "Crossbow",
    category: { en: "", pt: "" },
    grade: "Epic",
    stats: [

    ],
    description: { en: "Increases Movement Speed by 8%. However, taking a hit by Melee attacks decreases Movement Speed by 20% for 2s.", pt: "Aumenta a Velocidade de Movimento em 8%. No entanto, sofrer um acerto por Ataque Corpo a Corpo reduz a Velocidade de Movimento em 20% por 2s" },
  },
  {
    id: "Crossbow_Hero_Util_02",
    name: { en: "Endless Volley", pt: "Salva Interminável" },
    weapon: "Crossbow",
    category: { en: "Utility", pt: "Utilidade" },
    grade: "Epic",
    stats: [

    ],
    description: { en: "Increases Mana Regen by 260 if the user's current Mana is 30% or less of Max Mana. However, Max Mana decreases by 1000.", pt: "Aumenta a Regeneração de Mana em 260 se a Mana atual do usuário for 30% ou menos da Mana Máxima. No entanto, a Mana Máxima reduz em 1000" },
  },
  {
    id: "Crossbow_High_Attack_01",
    name: { en: "Ranged Critical Hit Augment", pt: "Aumento de Acerto Crítico à Distância" },
    weapon: "Crossbow",
    category: { en: "Attack", pt: "Ataque" },
    grade: "Uncommon",
    stats: [
      { label: { en: "Ranged Critical Hit Chance", pt: "Chance de Acerto Crítico à Distância" }, value: "40" },
    ],
    description: { en: "Increases Ranged Critical Hit Chance.", pt: "Aumento de Acerto Crítico à Distância" },
  },
  {
    id: "Crossbow_High_Attack_02",
    name: { en: "Ranged Damage Intensity", pt: "Intensidade de Dano à Distância" },
    weapon: "Crossbow",
    category: { en: "Attack", pt: "Ataque" },
    grade: "Uncommon",
    stats: [
      { label: { en: "Melee Endurance", pt: "Tolerância Corpo a Corpo" }, value: "-45" },
      { label: { en: "Ranged Damage Boost", pt: "Ampliação de Dano à Distância" }, value: "3%" },
    ],
    description: { en: "Increases Ranged Damage, but decreases Melee Endurance.", pt: "Intensidade de Dano à Distância" },
  },
  {
    id: "Crossbow_High_Attack_Skill",
    name: { en: "Calculated Power", pt: "Poder Calculado" },
    weapon: "Crossbow",
    category: { en: "Attack", pt: "Ataque" },
    grade: "Uncommon",
    stats: [

    ],
    description: { en: "", pt: "" },
  },
  {
    id: "Crossbow_High_AttackUtil_03",
    name: { en: "Ranged Heavy Attack Expertise", pt: "Especialização em Ataque Pesado à Distância" },
    weapon: "Crossbow",
    category: { en: "", pt: "" },
    grade: "Uncommon",
    stats: [
      { label: { en: "Health Regen", pt: "Regeneração de Vida" }, value: "20" },
      { label: { en: "Ranged Heavy Attack Chance", pt: "Chance de Ataque Pesado à Distância" }, value: "20" },
    ],
    description: { en: "Increases Ranged Heavy Attack Chance and Health Regen.", pt: "Especialização em Ataque Pesado à Distância" },
  },
  {
    id: "Crossbow_High_Defense_07",
    name: { en: "Critical Damage Resistance Augment", pt: "Aumento de Resistência a Dano Crítico" },
    weapon: "Crossbow",
    category: { en: "Defense", pt: "Defesa" },
    grade: "Uncommon",
    stats: [
      { label: { en: "Critical Damage Resistance", pt: "Resistência a Dano Crítico" }, value: "2.7%" },
    ],
    description: { en: "Critical Damage Resistance Augment", pt: "Aumento de Resistência a Dano Crítico" },
  },
  {
    id: "Crossbow_High_Defense_08",
    name: { en: "Magic Defense Intensity", pt: "Intensidade de Defesa Mágica" },
    weapon: "Crossbow",
    category: { en: "Defense", pt: "Defesa" },
    grade: "Uncommon",
    stats: [
      { label: { en: "Magic Defense", pt: "Defesa Mágica" }, value: "120" },
      { label: { en: "Ranged Critical Hit Chance", pt: "Chance de Acerto Crítico à Distância" }, value: "-30" },
    ],
    description: { en: "Increases Magic Defense, but decreases Ranged Critical Hit Chance.", pt: "Chance de Acerto Crítico à Distância" },
  },
  {
    id: "Crossbow_High_DefenseTactic_09",
    name: { en: "Off-hand Double Attack Expertise", pt: "Especialização em Ataque Duplo com Arma Secundária" },
    weapon: "Crossbow",
    category: { en: "", pt: "" },
    grade: "Uncommon",
    stats: [
      { label: { en: "Stun Resistance", pt: "Resistência a Atordoamento" }, value: "25" },
      { label: { en: "Off-Hand Weapon Attack Chance", pt: "Chance de Ataque com Arma Sec." }, value: "0.8%" },
    ],
    description: { en: "Off-hand Double Attack Expertise", pt: "Especialização em Ataque Duplo com Arma Secundária" },
  },
  {
    id: "Crossbow_High_Def_Skill",
    name: { en: "Nature's Gamble", pt: "Aposta da Natureza" },
    weapon: "Crossbow",
    category: { en: "Defense", pt: "Defesa" },
    grade: "Uncommon",
    stats: [

    ],
    description: { en: "", pt: "" },
  },
  {
    id: "Crossbow_High_Tac_Skill",
    name: { en: "Mana Break Point", pt: "Ponto de Ruptura de Mana" },
    weapon: "Crossbow",
    category: { en: "", pt: "" },
    grade: "Uncommon",
    stats: [

    ],
    description: { en: "", pt: "" },
  },
  {
    id: "Crossbow_High_Tactic_10",
    name: { en: "CC Resistance Augment", pt: "Aumento de Resistência a CM" },
    weapon: "Crossbow",
    category: { en: "", pt: "" },
    grade: "Uncommon",
    stats: [
      { label: { en: "Bind Resistance", pt: "Resistência a Imobilização" }, value: "33.25" },
      { label: { en: "Stun Resistance", pt: "Resistência a Atordoamento" }, value: "33.25" },
      { label: { en: "Fear Resistance", pt: "Resistência a Medo" }, value: "33.25" },
      { label: { en: "Sleep Resistance", pt: "Resistência a Sono" }, value: "33.25" },
      { label: { en: "Weaken Resistance", pt: "Resistência a Fraqueza" }, value: "33.25" },
      { label: { en: "Silence Resistance", pt: "Resistência a Silêncio" }, value: "33.25" },
      { label: { en: "Collision Resistance", pt: "Resistência a Colisão" }, value: "33.25" },
      { label: { en: "Petrification Resistance", pt: "Resistência a Petrificação" }, value: "33.25" },
    ],
    description: { en: "", pt: "Aumenta a Resistência de CM Total" },
  },
  {
    id: "Crossbow_High_Tactic_11",
    name: { en: "Weaken Intensity", pt: "Intensidade de Fraqueza" },
    weapon: "Crossbow",
    category: { en: "", pt: "" },
    grade: "Uncommon",
    stats: [
      { label: { en: "Max Mana", pt: "Mana Máxima" }, value: "-240" },
      { label: { en: "Weaken Chance", pt: "Chance de Fraqueza" }, value: "75" },
    ],
    description: { en: "Increases Weaken Chance, but decreases Max Mana.", pt: "Aumenta a Chance de Fraqueza, mas reduz a Mana Máxima" },
  },
  {
    id: "Crossbow_High_TacticAttack_12",
    name: { en: "Max Damage Expertise", pt: "Especialista em Dano Máximo" },
    weapon: "Crossbow",
    category: { en: "", pt: "" },
    grade: "Uncommon",
    stats: [
      { label: { en: "Range", pt: "Alcance" }, value: "2%" },
      { label: { en: "Max Damage", pt: "Dano Máx." }, value: "3" },
    ],
    description: { en: "Increases Max Damage and Attack Range. Max Damage increases from Lv. 4.", pt: "Aumenta o Dano Máximo e o Alcance de Ataque. Aumenta o Dano Máximo a partir do Nv.4" },
  },
  {
    id: "Crossbow_High_Util_04",
    name: { en: "Healing Received Augment", pt: "Aumento de Cura Recebida" },
    weapon: "Crossbow",
    category: { en: "Utility", pt: "Utilidade" },
    grade: "Uncommon",
    stats: [
      { label: { en: "Healing Received", pt: "Cura Recebida" }, value: "3.3%" },
    ],
    description: { en: "", pt: "" },
  },
  {
    id: "Crossbow_High_Util_05",
    name: { en: "Stamina Regen Intensity", pt: "Intensidade de Regeneração de Vigor" },
    weapon: "Crossbow",
    category: { en: "Utility", pt: "Utilidade" },
    grade: "Uncommon",
    stats: [
      { label: { en: "Stamina Regen", pt: "Regeneração de Vigor" }, value: "6" },
      { label: { en: "Stun Resistance", pt: "Resistência a Atordoamento" }, value: "-37.5" },
    ],
    description: { en: "Increases Stamina Regen, but decreases Stun Resistance.", pt: "Intensidade de Regeneração de Vigor" },
  },
  {
    id: "Crossbow_High_UtilDefense_06",
    name: { en: "Skill Damage Resistance Expertise", pt: "Especialização em Resistência a Dano de Habilidade" },
    weapon: "Crossbow",
    category: { en: "", pt: "" },
    grade: "Uncommon",
    stats: [
      { label: { en: "Skill Damage Resistance", pt: "Resistência a Dano de Habilidade" }, value: "10" },
      { label: { en: "Cooldown Speed", pt: "Velocidade de Recarga" }, value: "1%" },
    ],
    description: { en: "Skill Damage Resistance Expertise", pt: "Especialização em Resistência a Dano de Habilidade" },
  },
  {
    id: "Crossbow_High_Util_Skill",
    name: { en: "Mayhem Burst", pt: "Explosão Caótica" },
    weapon: "Crossbow",
    category: { en: "Utility", pt: "Utilidade" },
    grade: "Uncommon",
    stats: [

    ],
    description: { en: "", pt: "" },
  },
  {
    id: "Crossbow_Normal_Attack_01",
    name: { en: "Lesser Attack Speed Augment", pt: "Aumento Inferior de Velocidade de Ataque" },
    weapon: "Crossbow",
    category: { en: "Attack", pt: "Ataque" },
    grade: "Common",
    stats: [
      { label: { en: "Attack Speed", pt: "Velocidade de Ataque" }, value: "2.1%" },
    ],
    description: { en: "", pt: "Aumento Inferior de Velocidade de Ataque" },
  },
  {
    id: "Crossbow_Normal_Attack_02",
    name: { en: "Ranged Critical Hit Intensity", pt: "Intensidade de Acerto Crítico à Distância" },
    weapon: "Crossbow",
    category: { en: "Attack", pt: "Ataque" },
    grade: "Common",
    stats: [
      { label: { en: "Melee Defense", pt: "Defesa Corpo a Corpo" }, value: "-48" },
      { label: { en: "Ranged Critical Hit Chance", pt: "Chance de Acerto Crítico à Distância" }, value: "48" },
    ],
    description: { en: "Increases Ranged Critical Hit Chance, but decreases Melee Defense.", pt: "Intensidade de Acerto Crítico à Distância" },
  },
  {
    id: "Crossbow_Normal_Attack_Skill",
    name: { en: "Bloodlust Acceleration", pt: "Aceleração de Sede de Sangue" },
    weapon: "Crossbow",
    category: { en: "Attack", pt: "Ataque" },
    grade: "Common",
    stats: [

    ],
    description: { en: "", pt: "" },
  },
  {
    id: "Crossbow_Normal_AttackUtil_03",
    name: { en: "Base Damage Expertise", pt: "Especialização em Dano Base" },
    weapon: "Crossbow",
    category: { en: "", pt: "" },
    grade: "Common",
    stats: [
      { label: { en: "Mana Cost Efficiency", pt: "Eficiência do Custo de Mana" }, value: "1.6%" },
      { label: { en: "Base Damage", pt: "Dano Base" }, value: "2" },
    ],
    description: { en: "Increases Base Damage and Mana Cost Efficiency. Base Damage increases from Lv. 5.", pt: "Aumenta o Dano Base e a Eficiência do Custo de Mana. Aumenta o Dano Base a partir do Nv.5" },
  },
  {
    id: "Crossbow_Normal_Defense_07",
    name: { en: "Lesser Debuff Duration Augment", pt: "Aumento Inferior de Duração da Desvantagem" },
    weapon: "Crossbow",
    category: { en: "Defense", pt: "Defesa" },
    grade: "Common",
    stats: [
      { label: { en: "Debuff Duration", pt: "Duração da Desvantagem" }, value: "-1.6%" },
    ],
    description: { en: "", pt: "Aumento Inferior de Duração da Desvantagem" },
  },
  {
    id: "Crossbow_Normal_Defense_08",
    name: { en: "Max Health Intensity", pt: "Intensidade de Vida Máxima" },
    weapon: "Crossbow",
    category: { en: "Defense", pt: "Defesa" },
    grade: "Common",
    stats: [
      { label: { en: "Max Health", pt: "Vida Máxima" }, value: "384" },
      { label: { en: "Ranged Hit Chance", pt: "Chance de Acerto à Distância" }, value: "-24" },
    ],
    description: { en: "Increases Max Health, and decreases Ranged Hit Chance.", pt: "Aumenta a Vida Máxima e reduz a Chance de Acerto à Distância" },
  },
  {
    id: "Crossbow_Normal_DefenseTactic_09",
    name: { en: "Damage Resistance Expertise", pt: "Especialização em Resistência a Dano" },
    weapon: "Crossbow",
    category: { en: "", pt: "" },
    grade: "Common",
    stats: [
      { label: { en: "Range", pt: "Alcance" }, value: "1.6%" },
      { label: { en: "Skill Damage Resistance", pt: "Resistência a Dano de Habilidade" }, value: "8" },
    ],
    description: { en: "Increases Attack Range and Skill Damage Resistance.", pt: "Especialização em Resistência a Dano" },
  },
  {
    id: "Crossbow_Normal_Def_Skill",
    name: { en: "Recovery Bolts", pt: "Virotes de Recuperação" },
    weapon: "Crossbow",
    category: { en: "Defense", pt: "Defesa" },
    grade: "Common",
    stats: [

    ],
    description: { en: "", pt: "" },
  },
  {
    id: "Crossbow_Normal_Tac_Skill",
    name: { en: "Tactical Deflection", pt: "Desvio Tático" },
    weapon: "Crossbow",
    category: { en: "", pt: "" },
    grade: "Common",
    stats: [

    ],
    description: { en: "", pt: "" },
  },
  {
    id: "Crossbow_Normal_Tactic_10",
    name: { en: "Lesser Weaken Augment", pt: "Aumento Inferior de Fraqueza" },
    weapon: "Crossbow",
    category: { en: "", pt: "" },
    grade: "Common",
    stats: [
      { label: { en: "Weaken Chance", pt: "Chance de Fraqueza" }, value: "40" },
    ],
    description: { en: "", pt: "" },
  },
  {
    id: "Crossbow_Normal_Tactic_11",
    name: { en: "Movement Speed Intensity", pt: "Intensidade de Velocidade de Movimento" },
    weapon: "Crossbow",
    category: { en: "", pt: "" },
    grade: "Common",
    stats: [
      { label: { en: "Movement Speed", pt: "Velocidade de Movimento" }, value: "3.2%" },
      { label: { en: "Amitoi Healing", pt: "Cura do Amitoi" }, value: "-10%" },
    ],
    description: { en: "Increases Movement Speed, but decreases Amitoi Healing.", pt: "Intensidade de Velocidade de Movimento" },
  },
  {
    id: "Crossbow_Normal_TacticAttack_12",
    name: { en: "Attack Speed Expertise", pt: "Especialização em Velocidade de Ataque" },
    weapon: "Crossbow",
    category: { en: "", pt: "" },
    grade: "Common",
    stats: [
      { label: { en: "Ranged Hit Chance", pt: "Chance de Acerto à Distância" }, value: "16" },
      { label: { en: "Attack Speed", pt: "Velocidade de Ataque" }, value: "1.1%" },
    ],
    description: { en: "Increases Attack Speed and Ranged Hit Chance.", pt: "Especialização em Velocidade de Ataque" },
  },
  {
    id: "Crossbow_Normal_Util_04",
    name: { en: "Lesser Stamina Augment", pt: "Aumento Inferior de Vigor" },
    weapon: "Crossbow",
    category: { en: "Utility", pt: "Utilidade" },
    grade: "Common",
    stats: [
      { label: { en: "Stamina Regen", pt: "Regeneração de Vigor" }, value: "3.2" },
    ],
    description: { en: "", pt: "" },
  },
  {
    id: "Crossbow_Normal_Util_05",
    name: { en: "Mana Regen Intensity", pt: "Intensidade de Regeneração de Mana" },
    weapon: "Crossbow",
    category: { en: "Utility", pt: "Utilidade" },
    grade: "Common",
    stats: [
      { label: { en: "Mana Regen", pt: "Regeneração de Mana" }, value: "36" },
      { label: { en: "Debuff Duration", pt: "Duração da Desvantagem" }, value: "1.2%" },
    ],
    description: { en: "Increases Mana Regen, but decreases Debuff Duration.", pt: "Intensidade de Regeneração de Mana" },
  },
  {
    id: "Crossbow_Normal_UtilDefense_06",
    name: { en: "Magic Defense Expertise", pt: "Especialização em Defesa Mágica" },
    weapon: "Crossbow",
    category: { en: "", pt: "" },
    grade: "Common",
    stats: [
      { label: { en: "Magic Defense", pt: "Defesa Mágica" }, value: "32" },
      { label: { en: "Buff Duration", pt: "Duração da Vantagem" }, value: "1.1%" },
    ],
    description: { en: "Increases Magic Defense and Buff Duration.", pt: "Especialização em Defesa Mágica" },
  },
  {
    id: "Crossbow_Normal_Util_Skill",
    name: { en: "Predator's Focus", pt: "Foco de Predador" },
    weapon: "Crossbow",
    category: { en: "Utility", pt: "Utilidade" },
    grade: "Common",
    stats: [

    ],
    description: { en: "", pt: "" },
  },
  {
    id: "Crossbow_Rare_Attack_01",
    name: { en: "Greater Ranged Hit Augment", pt: "Aumento Superior de Acerto à Distância" },
    weapon: "Crossbow",
    category: { en: "Attack", pt: "Ataque" },
    grade: "Rare",
    stats: [
      { label: { en: "Ranged Hit Chance", pt: "Chance de Acerto à Distância" }, value: "48" },
    ],
    description: { en: "", pt: "Aumento Superior de Acerto à Distância" },
  },
  {
    id: "Crossbow_Rare_Attack_02",
    name: { en: "Skill Damage Boost Intensity", pt: "Intensidade de Ampliação de Dano de Habilidade" },
    weapon: "Crossbow",
    category: { en: "Attack", pt: "Ataque" },
    grade: "Rare",
    stats: [
      { label: { en: "Dexterity", pt: "Destreza" }, value: "2" },
      { label: { en: "Skill Damage Resistance", pt: "Resistência a Dano de Habilidade" }, value: "-18" },
      { label: { en: "Skill Damage Boost", pt: "Ampliação de Dano de Habilidade" }, value: "36" },
    ],
    description: { en: "Increases Skill Damage Boost, but decreases Skill Damage Resistance.", pt: "Intensidade de Ampliação de Dano de Habilidade" },
  },
  {
    id: "Crossbow_Rare_Attack_Skill",
    name: { en: "Reaper's Call", pt: "Chamado de Ceifador" },
    weapon: "Crossbow",
    category: { en: "Attack", pt: "Ataque" },
    grade: "Rare",
    stats: [

    ],
    description: { en: "", pt: "" },
  },
  {
    id: "Crossbow_Rare_AttackUtil_03",
    name: { en: "Ranged Heavy Attack Expertise", pt: "Especialização em Ataque Pesado à Distância" },
    weapon: "Crossbow",
    category: { en: "", pt: "" },
    grade: "Rare",
    stats: [
      { label: { en: "Ranged Heavy Attack Chance", pt: "Chance de Ataque Pesado à Distância" }, value: "24" },
      { label: { en: "Amitoi Healing", pt: "Cura do Amitoi" }, value: "24%" },
    ],
    description: { en: "Increases Ranged Heavy Attack Chance and Amitoi Healing.", pt: "Especialização em Ataque Pesado à Distância" },
  },
  {
    id: "Crossbow_Rare_Defense_07",
    name: { en: "Greater Evasion Augment", pt: "Aumento Superior de Esquiva" },
    weapon: "Crossbow",
    category: { en: "Defense", pt: "Defesa" },
    grade: "Rare",
    stats: [
      { label: { en: "Magic Evasion", pt: "Esquiva Mágica" }, value: "48" },
      { label: { en: "Melee Evasion", pt: "Esquiva Corpo a Corpo" }, value: "48" },
      { label: { en: "Ranged Evasion", pt: "Esquiva à Distância" }, value: "48" },
    ],
    description: { en: "Increases Magic, Melee, and Ranged Evasion.", pt: "Aumenta a Esquiva à Distância, Corpo a Corpo e Mágica" },
  },
  {
    id: "Crossbow_Rare_Defense_08",
    name: { en: "Perception Survival Adept", pt: "Adepto de Sobrevivência Perceptiva" },
    weapon: "Crossbow",
    category: { en: "Defense", pt: "Defesa" },
    grade: "Rare",
    stats: [
      { label: { en: "Perception", pt: "Percepção" }, value: "2" },
      { label: { en: "Max Health", pt: "Vida Máxima" }, value: "576" },
      { label: { en: "Attack Speed", pt: "Velocidade de Ataque" }, value: "-1.8%" },
    ],
    description: { en: "Increases Max Health, and decreases Attack Speed.", pt: "Adepto de Sobrevivência Perceptiva" },
  },
  {
    id: "Crossbow_Rare_DefenseTactic_09",
    name: { en: "Collision Resistance Expertise", pt: "Especialização em Resistência a Colisão" },
    weapon: "Crossbow",
    category: { en: "", pt: "" },
    grade: "Rare",
    stats: [
      { label: { en: "Collision Resistance", pt: "Resistência a Colisão" }, value: "30" },
      { label: { en: "Melee Endurance", pt: "Tolerância Corpo a Corpo" }, value: "36" },
    ],
    description: { en: "Increases Collision Resistance and Melee Endurance.", pt: "Especialização em Resistência a Colisão" },
  },
  {
    id: "Crossbow_Rare_Def_Skill",
    name: { en: "Final Heartbeat", pt: "Batimento Cardíaco Final" },
    weapon: "Crossbow",
    category: { en: "Defense", pt: "Defesa" },
    grade: "Rare",
    stats: [

    ],
    description: { en: "", pt: "" },
  },
  {
    id: "Crossbow_Rare_Tac_Skill",
    name: { en: "Agile Strike", pt: "Golpe Ágil" },
    weapon: "Crossbow",
    category: { en: "", pt: "" },
    grade: "Rare",
    stats: [

    ],
    description: { en: "", pt: "" },
  },
  {
    id: "Crossbow_Rare_Tactic_10",
    name: { en: "Greater Movement Speed Augment", pt: "Aumento Superior da Velocidade de Movimento" },
    weapon: "Crossbow",
    category: { en: "", pt: "" },
    grade: "Rare",
    stats: [
      { label: { en: "Movement Speed", pt: "Velocidade de Movimento" }, value: "3.2%" },
    ],
    description: { en: "", pt: "Aumento Superior da Velocidade de Movimento" },
  },
  {
    id: "Crossbow_Rare_Tactic_11",
    name: { en: "Mana Efficiency Intensity", pt: "Intensidade de Eficiência de Mana" },
    weapon: "Crossbow",
    category: { en: "", pt: "" },
    grade: "Rare",
    stats: [
      { label: { en: "Health Regen", pt: "Regeneração de Vida" }, value: "-36" },
      { label: { en: "Mana Cost Efficiency", pt: "Eficiência do Custo de Mana" }, value: "7.2%" },
    ],
    description: { en: "Increases Mana Cost Efficiency, but decreases Health Regen.", pt: "Intensidade de Eficiência de Mana" },
  },
  {
    id: "Crossbow_Rare_TacticAttack_12",
    name: { en: "Attack Range Expertise", pt: "Especialização em Alcance de Ataque" },
    weapon: "Crossbow",
    category: { en: "", pt: "" },
    grade: "Rare",
    stats: [
      { label: { en: "Range", pt: "Alcance" }, value: "2.4%" },
      { label: { en: "Debuff Duration", pt: "Duração da Desvantagem" }, value: "-1.2%" },
    ],
    description: { en: "Increases Attack Range and decreases Debuff Duration.", pt: "Especialização em Alcance de Ataque" },
  },
  {
    id: "Crossbow_Rare_Util_04",
    name: { en: "Greater Mana Regen Augment", pt: "Aumento Superior de Regeneração de Mana" },
    weapon: "Crossbow",
    category: { en: "Utility", pt: "Utilidade" },
    grade: "Rare",
    stats: [
      { label: { en: "Mana Regen", pt: "Regeneração de Mana" }, value: "36" },
    ],
    description: { en: "", pt: "Aumento Superior de Regeneração de Mana" },
  },
  {
    id: "Crossbow_Rare_Util_05",
    name: { en: "Cooldown Speed Intensity", pt: "Intensidade de Velocidade de Recarga" },
    weapon: "Crossbow",
    category: { en: "Utility", pt: "Utilidade" },
    grade: "Rare",
    stats: [
      { label: { en: "Sleep Resistance", pt: "Resistência a Sono" }, value: "-45" },
      { label: { en: "Cooldown Speed", pt: "Velocidade de Recarga" }, value: "3.6%" },
    ],
    description: { en: "Increases Skill Cooldown Speed, but decreases Sleep Resistance.", pt: "Intensidade de Velocidade de Recarga" },
  },
  {
    id: "Crossbow_Rare_UtilDefense_06",
    name: { en: "Damage Resistance Expertise", pt: "Especialização em Resistência a Dano" },
    weapon: "Crossbow",
    category: { en: "", pt: "" },
    grade: "Rare",
    stats: [
      { label: { en: "Health Regen", pt: "Regeneração de Vida" }, value: "24" },
      { label: { en: "Skill Damage Resistance", pt: "Resistência a Dano de Habilidade" }, value: "12" },
    ],
    description: { en: "Increases Skill Damage Resistance and Health Regen.", pt: "Especialização em Resistência a Dano" },
  },
  {
    id: "Crossbow_Rare_Util_Skill",
    name: { en: "Deathstrike Pact", pt: "Pacto do Golpe Fatal" },
    weapon: "Crossbow",
    category: { en: "Utility", pt: "Utilidade" },
    grade: "Rare",
    stats: [

    ],
    description: { en: "", pt: "" },
  },
  {
    id: "Dagger_Hero_Attack_01",
    name: { en: "Merciless Form", pt: "Forma Impiedosa" },
    weapon: "",
    category: { en: "Attack", pt: "Ataque" },
    grade: "Epic",
    stats: [

    ],
    description: { en: "Increases Daggers Attack Skill Damage by 4%.", pt: "Aumenta o Dano das Habilidades de Ataque com Adagas em 4%" },
  },
  {
    id: "Dagger_Hero_Defense_03",
    name: { en: "Ethereal Evasion", pt: "Esquiva Etérea" },
    weapon: "",
    category: { en: "Defense", pt: "Defesa" },
    grade: "Epic",
    stats: [

    ],
    description: { en: "Creates a shield to evade most magic attacks for 1s when hit by a Magic attack. Cooldown: 30s", pt: "Cria um escudo para esquivar da maioria dos Ataques Mágicos por 1s, ao sofrer um acerto de um Ataque Mágico. Tem uma recarga de 30s" },
  },
  {
    id: "Dagger_Hero_Tactic_04",
    name: { en: "Dexterous Power", pt: "Poder Hábil" },
    weapon: "",
    category: { en: "", pt: "" },
    grade: "Epic",
    stats: [

    ],
    description: { en: "Increases Critical Damage by 8% when Dexterity is 90 or higher. Increases all Evasion by 160 when Dexterity is below 90.", pt: "Aumenta o Dano Crítico em 8% quando a Destreza for de 90 ou mais. Aumenta a Esquiva Total em 160 quando a Destreza estiver abaixo de 90." },
  },
  {
    id: "Dagger_Hero_Util_02",
    name: { en: "Off-hand Frenzy", pt: "Fúria Secundária" },
    weapon: "",
    category: { en: "Utility", pt: "Utilidade" },
    grade: "Epic",
    stats: [

    ],
    description: { en: "Increases the Off-hand Weapon's Base Damage by 60 and boosts Off-hand Double Attack Chance by 15%, but decreases the Main Weapon's Base Damage by 22 for 2s when using a Mobility skill.", pt: "Aumenta o Dano Base da Arma Secundária em 60 e amplia a Chance de Ataque Duplo com Arma Secundária em 15%, mas reduz o Dano Base da Arma Principal em 22 por 2s ao usar a Habilidade de Movimento" },
  },
  {
    id: "Dagger_High_Attack_01",
    name: { en: "Critical Hit Augment", pt: "Aumento de Acerto Crítico" },
    weapon: "",
    category: { en: "Attack", pt: "Ataque" },
    grade: "Uncommon",
    stats: [
      { label: { en: "Magic Critical Hit Chance", pt: "Chance de Acerto Crítico Mágico" }, value: "32" },
      { label: { en: "Melee Critical Hit Chance", pt: "Chance de Acerto Crítico Corpo a Corpo" }, value: "32" },
      { label: { en: "Ranged Critical Hit Chance", pt: "Chance de Acerto Crítico à Distância" }, value: "32" },
    ],
    description: { en: "Increases Magic, Melee, and Ranged Critical Hit Chance.", pt: "Chance de Acerto Crítico Mágico" },
  },
  {
    id: "Dagger_High_Attack_02",
    name: { en: "Melee Critical Hit Intensity", pt: "Intensidade do Acerto Crítico Corpo a Corpo" },
    weapon: "",
    category: { en: "Attack", pt: "Ataque" },
    grade: "Uncommon",
    stats: [
      { label: { en: "Melee Defense", pt: "Defesa Corpo a Corpo" }, value: "-60" },
      { label: { en: "Melee Critical Hit Chance", pt: "Chance de Acerto Crítico Corpo a Corpo" }, value: "60" },
    ],
    description: { en: "Increases Melee Critical Hit Chance, but decreases Melee Defense.", pt: "Intensidade do Acerto Crítico Corpo a Corpo" },
  },
  {
    id: "Dagger_High_Attack_Skill",
    name: { en: "Venomous Edge", pt: "Limite Venenoso" },
    weapon: "",
    category: { en: "Attack", pt: "Ataque" },
    grade: "Uncommon",
    stats: [

    ],
    description: { en: "", pt: "" },
  },
  {
    id: "Dagger_High_AttackUtil_03",
    name: { en: "Max Damage Expertise", pt: "Especialista em Dano Máximo" },
    weapon: "",
    category: { en: "", pt: "" },
    grade: "Uncommon",
    stats: [
      { label: { en: "Mana Regen", pt: "Regeneração de Mana" }, value: "15" },
      { label: { en: "Max Damage", pt: "Dano Máx." }, value: "3" },
    ],
    description: { en: "Increases Mana Regen and Max Damage. Max Damage increases from Lv. 4.", pt: "Aumenta a Regeneração de Mana e o Dano Máximo. Aumenta o Dano Máximo a partir do Nv.4" },
  },
  {
    id: "Dagger_High_Defense_07",
    name: { en: "Evasion Augment", pt: "Aumento de Esquiva" },
    weapon: "",
    category: { en: "Defense", pt: "Defesa" },
    grade: "Uncommon",
    stats: [
      { label: { en: "Magic Evasion", pt: "Esquiva Mágica" }, value: "40" },
      { label: { en: "Melee Evasion", pt: "Esquiva Corpo a Corpo" }, value: "40" },
      { label: { en: "Ranged Evasion", pt: "Esquiva à Distância" }, value: "40" },
    ],
    description: { en: "Increases Magic, Melee, and Ranged Evasion.", pt: "Aumenta a Esquiva à Distância, Corpo a Corpo e Mágica" },
  },
  {
    id: "Dagger_High_Defense_08",
    name: { en: "Max Health Intensity", pt: "Intensidade de Vida Máxima" },
    weapon: "",
    category: { en: "Defense", pt: "Defesa" },
    grade: "Uncommon",
    stats: [
      { label: { en: "Max Health", pt: "Vida Máxima" }, value: "480" },
      { label: { en: "Attack Speed", pt: "Velocidade de Ataque" }, value: "-1.5%" },
    ],
    description: { en: "Increases Max Health, but decreases Attack Speed.", pt: "Aumenta a Vida Máxima, mas reduz a Velocidade de Ataque" },
  },
  {
    id: "Dagger_High_DefenseTactic_09",
    name: { en: "Ranged Evasion Expertise", pt: "Especialização em Esquiva à Distância" },
    weapon: "",
    category: { en: "", pt: "" },
    grade: "Uncommon",
    stats: [
      { label: { en: "Ranged Evasion", pt: "Esquiva à Distância" }, value: "30" },
      { label: { en: "Bind Resistance", pt: "Resistência a Imobilização" }, value: "25" },
    ],
    description: { en: "Increases Ranged Evasion and Bind Resistance.", pt: "Especialização em Esquiva à Distância" },
  },
  {
    id: "Dagger_High_Def_Skill",
    name: { en: "Phantom Timer", pt: "Temporizador Fantasma" },
    weapon: "",
    category: { en: "Defense", pt: "Defesa" },
    grade: "Uncommon",
    stats: [

    ],
    description: { en: "", pt: "" },
  },
  {
    id: "Dagger_High_Tac_Skill",
    name: { en: "Combat Velocity", pt: "Velocidade de Combate" },
    weapon: "",
    category: { en: "", pt: "" },
    grade: "Uncommon",
    stats: [

    ],
    description: { en: "", pt: "" },
  },
  {
    id: "Dagger_High_Tactic_10",
    name: { en: "Attack Range Augment", pt: "Aumento de Alcance de Ataque" },
    weapon: "",
    category: { en: "", pt: "" },
    grade: "Uncommon",
    stats: [
      { label: { en: "Range", pt: "Alcance" }, value: "4%" },
    ],
    description: { en: "", pt: "" },
  },
  {
    id: "Dagger_High_Tactic_11",
    name: { en: "Crowd Control Intensity", pt: "Intensidade de CM" },
    weapon: "",
    category: { en: "", pt: "" },
    grade: "Uncommon",
    stats: [
      { label: { en: "Bind Chance", pt: "Chance de Imobilização" }, value: "50" },
      { label: { en: "Stun Chance", pt: "Chance de Atordoamento" }, value: "50" },
      { label: { en: "Fear Chance", pt: "Chance de Medo" }, value: "50" },
      { label: { en: "Sleep Chance", pt: "Chance de Sono" }, value: "50" },
      { label: { en: "Weaken Chance", pt: "Chance de Fraqueza" }, value: "50" },
      { label: { en: "Silence Chance", pt: "Chance de Silêncio" }, value: "50" },
      { label: { en: "Collision Chance", pt: "Chance de Colisão" }, value: "50" },
      { label: { en: "Petrification Chance", pt: "Chance de Petrificação" }, value: "50" },
      { label: { en: "Mana Cost Efficiency", pt: "Eficiência do Custo de Mana" }, value: "-2.6%" },
    ],
    description: { en: "Increases CC Chance, but decreases Mana Cost Efficiency.", pt: "Aumenta a Chance de CM, mas reduz a Eficiência do Custo de Mana" },
  },
  {
    id: "Dagger_High_TacticAttack_12",
    name: { en: "Bonus Damage Expertise", pt: "Especialização em Bônus de Dano" },
    weapon: "",
    category: { en: "", pt: "" },
    grade: "Uncommon",
    stats: [
      { label: { en: "Weaken Chance", pt: "Chance de Fraqueza" }, value: "25" },
      { label: { en: "Attack Speed", pt: "Velocidade de Ataque" }, value: "1.3%" },
    ],
    description: { en: "Increases Attack Speed and Weaken Chance.", pt: "Especialização em Bônus de Dano" },
  },
  {
    id: "Dagger_High_Util_04",
    name: { en: "Off-hand Weapon Augment", pt: "Aumento da Arma Secundária" },
    weapon: "",
    category: { en: "Utility", pt: "Utilidade" },
    grade: "Uncommon",
    stats: [
      { label: { en: "Off-Hand Weapon Attack Chance", pt: "Chance de Ataque com Arma Sec." }, value: "1.6%" },
    ],
    description: { en: "Increases Off-hand Weapon Chance.", pt: "Aumenta a Chance de Arma Secundária." },
  },
  {
    id: "Dagger_High_Util_05",
    name: { en: "Off-hand Weapon Damage Intensity", pt: "Intensidade do Dano da Arma Secundária" },
    weapon: "",
    category: { en: "Utility", pt: "Utilidade" },
    grade: "Uncommon",
    stats: [
      { label: { en: "Bind Resistance", pt: "Resistência a Imobilização" }, value: "-25" },
      { label: { en: "Stun Resistance", pt: "Resistência a Atordoamento" }, value: "-25" },
      { label: { en: "Fear Resistance", pt: "Resistência a Medo" }, value: "-25" },
      { label: { en: "Sleep Resistance", pt: "Resistência a Sono" }, value: "-25" },
      { label: { en: "Weaken Resistance", pt: "Resistência a Fraqueza" }, value: "-25" },
      { label: { en: "Silence Resistance", pt: "Resistência a Silêncio" }, value: "-25" },
      { label: { en: "Collision Resistance", pt: "Resistência a Colisão" }, value: "-25" },
      { label: { en: "Petrification Resistance", pt: "Resistência a Petrificação" }, value: "-25" },
      { label: { en: "Base Damage", pt: "Dano Base" }, value: "10" },
    ],
    description: { en: "Off-hand Weapon Damage Intensity", pt: "Intensidade do Dano da Arma Secundária" },
  },
  {
    id: "Dagger_High_UtilDefense_06",
    name: { en: "Cooldown Speed Expertise", pt: "Especialização em Velocidade de Recarga" },
    weapon: "",
    category: { en: "", pt: "" },
    grade: "Uncommon",
    stats: [
      { label: { en: "Magic Evasion", pt: "Esquiva Mágica" }, value: "30" },
      { label: { en: "Cooldown Speed", pt: "Velocidade de Recarga" }, value: "1%" },
    ],
    description: { en: "Increases Cooldown Speed and Magic Evasion.", pt: "Especialização em Velocidade de Recarga" },
  },
  {
    id: "Dagger_High_Util_Skill",
    name: { en: "Fatal Fatigue", pt: "Fadiga Fatal" },
    weapon: "",
    category: { en: "Utility", pt: "Utilidade" },
    grade: "Uncommon",
    stats: [

    ],
    description: { en: "", pt: "" },
  },
  {
    id: "Dagger_Normal_Attack_01",
    name: { en: "Lesser Attack Speed Augment", pt: "Aumento Inferior de Velocidade de Ataque" },
    weapon: "",
    category: { en: "Attack", pt: "Ataque" },
    grade: "Common",
    stats: [
      { label: { en: "Attack Speed", pt: "Velocidade de Ataque" }, value: "2.1%" },
    ],
    description: { en: "", pt: "Aumento Inferior de Velocidade de Ataque" },
  },
  {
    id: "Dagger_Normal_Attack_02",
    name: { en: "Attack Speed Intensity", pt: "Intensidade de Velocidade de Ataque" },
    weapon: "",
    category: { en: "Attack", pt: "Ataque" },
    grade: "Common",
    stats: [
      { label: { en: "Attack Speed", pt: "Velocidade de Ataque" }, value: "3.2%" },
      { label: { en: "Critical Damage Resistance", pt: "Resistência a Dano Crítico" }, value: "-1.6%" },
    ],
    description: { en: "Increases Attack Speed, but decreases Critical Damage Resistance.", pt: "Intensidade de Velocidade de Ataque" },
  },
  {
    id: "Dagger_Normal_Attack_Skill",
    name: { en: "Piercing Bite", pt: "Mordida Perfurante" },
    weapon: "",
    category: { en: "Attack", pt: "Ataque" },
    grade: "Common",
    stats: [

    ],
    description: { en: "", pt: "" },
  },
  {
    id: "Dagger_Normal_AttackUtil_03",
    name: { en: "Movement Speed Expertise", pt: "Especialização em Velocidade de Movimento" },
    weapon: "",
    category: { en: "", pt: "" },
    grade: "Common",
    stats: [
      { label: { en: "Movement Speed", pt: "Velocidade de Movimento" }, value: "1.1%" },
      { label: { en: "Base Damage", pt: "Dano Base" }, value: "2" },
    ],
    description: { en: "Increases Movement Speed and Base Damage. Base Damage increases from Lv. 5.", pt: "Especialização em Velocidade de Movimento" },
  },
  {
    id: "Dagger_Normal_Defense_07",
    name: { en: "Lesser Magic Heavy Attack Evasion Augment", pt: "Aumento Inferior de Esquiva de Ataque Pesado Mágico" },
    weapon: "",
    category: { en: "Defense", pt: "Defesa" },
    grade: "Common",
    stats: [
      { label: { en: "Magic Heavy Attack Evasion", pt: "Esquiva de Ataque Pesado Mágico" }, value: "48" },
    ],
    description: { en: "Lesser Magic Heavy Attack Evasion Augment", pt: "Aumento Inferior de Esquiva de Ataque Pesado Mágico" },
  },
  {
    id: "Dagger_Normal_Defense_08",
    name: { en: "Damage Reduction Intensity", pt: "Intensidade de Redução de Dano" },
    weapon: "",
    category: { en: "Defense", pt: "Defesa" },
    grade: "Common",
    stats: [
      { label: { en: "Damage Reduction", pt: "Redução de Dano" }, value: "20" },
      { label: { en: "Range", pt: "Alcance" }, value: "-2%" },
    ],
    description: { en: "Increases Damage Reduction, but decreases Attack Range.", pt: "Aumenta a Redução de Dano, mas reduz o Alcance de Ataque" },
  },
  {
    id: "Dagger_Normal_DefenseTactic_09",
    name: { en: "Skill Damage Resistance Expertise", pt: "Especialização em Resistência a Dano de Habilidade" },
    weapon: "",
    category: { en: "", pt: "" },
    grade: "Common",
    stats: [
      { label: { en: "Bind Chance", pt: "Chance de Imobilização" }, value: "20" },
      { label: { en: "Skill Damage Resistance", pt: "Resistência a Dano de Habilidade" }, value: "8" },
    ],
    description: { en: "Skill Damage Resistance Expertise", pt: "Especialização em Resistência a Dano de Habilidade" },
  },
  {
    id: "Dagger_Normal_Def_Skill",
    name: { en: "Umbral Toughness", pt: "Vigor Umbral" },
    weapon: "",
    category: { en: "Defense", pt: "Defesa" },
    grade: "Common",
    stats: [

    ],
    description: { en: "", pt: "" },
  },
  {
    id: "Dagger_Normal_Tac_Skill",
    name: { en: "Potent Toxicity", pt: "Toxicidade Potente" },
    weapon: "",
    category: { en: "", pt: "" },
    grade: "Common",
    stats: [

    ],
    description: { en: "", pt: "" },
  },
  {
    id: "Dagger_Normal_Tactic_10",
    name: { en: "Lesser Silence Augment", pt: "Aumento Inferior de Silêncio" },
    weapon: "",
    category: { en: "", pt: "" },
    grade: "Common",
    stats: [
      { label: { en: "Silence Chance", pt: "Chance de Silêncio" }, value: "40" },
    ],
    description: { en: "", pt: "" },
  },
  {
    id: "Dagger_Normal_Tactic_11",
    name: { en: "Buff Duration Intensity", pt: "Intensidade de Duração da Vantagem" },
    weapon: "",
    category: { en: "", pt: "" },
    grade: "Common",
    stats: [
      { label: { en: "Health Regen", pt: "Regeneração de Vida" }, value: "-24" },
      { label: { en: "Debuff Duration", pt: "Duração da Desvantagem" }, value: "-2.4%" },
    ],
    description: { en: "Increases Debuff Duration, but decreases Health Regen.", pt: "Intensidade de Duração da Vantagem" },
  },
  {
    id: "Dagger_Normal_TacticAttack_12",
    name: { en: "Weaken Chance Offensive", pt: "Chance Ofensiva de Fraqueza" },
    weapon: "",
    category: { en: "", pt: "" },
    grade: "Common",
    stats: [
      { label: { en: "Weaken Chance", pt: "Chance de Fraqueza" }, value: "20" },
      { label: { en: "Bonus Damage", pt: "Bônus de Dano" }, value: "6" },
    ],
    description: { en: "Increases Weaken Chance and Bonus Damage.", pt: "Aumenta a Chance de Fraqueza e o Bônus de Dano." },
  },
  {
    id: "Dagger_Normal_Util_04",
    name: { en: "Lesser Buff Duration Augment", pt: "Aumento Inferior de Duração da Vantagem" },
    weapon: "",
    category: { en: "Utility", pt: "Utilidade" },
    grade: "Common",
    stats: [
      { label: { en: "Buff Duration", pt: "Duração da Vantagem" }, value: "2.1%" },
    ],
    description: { en: "", pt: "Aumento Inferior de Duração da Vantagem" },
  },
  {
    id: "Dagger_Normal_Util_05",
    name: { en: "Stamina Regen Intensity", pt: "Intensidade de Regeneração de Vigor" },
    weapon: "",
    category: { en: "Utility", pt: "Utilidade" },
    grade: "Common",
    stats: [
      { label: { en: "Stamina Regen", pt: "Regeneração de Vigor" }, value: "4.8" },
      { label: { en: "Collision Resistance", pt: "Resistência a Colisão" }, value: "-30" },
    ],
    description: { en: "Increases Stamina Regen, but decreases Collision Resistance.", pt: "Intensidade de Regeneração de Vigor" },
  },
  {
    id: "Dagger_Normal_UtilDefense_06",
    name: { en: "Ranged Defense Expertise", pt: "Especialização em Defesa à Distância" },
    weapon: "",
    category: { en: "", pt: "" },
    grade: "Common",
    stats: [
      { label: { en: "Ranged Defense", pt: "Defesa à Distância" }, value: "32" },
      { label: { en: "Healing Received", pt: "Cura Recebida" }, value: "1.3%" },
    ],
    description: { en: "Increases Ranged Defense and Healing Received.", pt: "Especialização em Defesa à Distância" },
  },
  {
    id: "Dagger_Normal_Util_Skill",
    name: { en: "Blood Seeker", pt: "Buscador de Sangue" },
    weapon: "",
    category: { en: "Utility", pt: "Utilidade" },
    grade: "Common",
    stats: [

    ],
    description: { en: "", pt: "" },
  },
  {
    id: "Dagger_Rare_Attack_01",
    name: { en: "Greater Hit Augment", pt: "Aumento Superior de Acerto" },
    weapon: "",
    category: { en: "Attack", pt: "Ataque" },
    grade: "Rare",
    stats: [
      { label: { en: "Magic Hit Chance", pt: "Chance de Acerto Mágico" }, value: "38.4" },
      { label: { en: "Melee Hit Chance", pt: "Chance de Acerto Corpo a Corpo" }, value: "38.4" },
      { label: { en: "Ranged Hit Chance", pt: "Chance de Acerto à Distância" }, value: "38.4" },
    ],
    description: { en: "Increases Magic, Melee, and Ranged Hit Chance.", pt: "Aumenta a Chance de Acerto à Distância, Corpo a Corpo e Mágico" },
  },
  {
    id: "Dagger_Rare_Attack_02",
    name: { en: "Critical Damage Intensity", pt: "Intensidade de Dano Crítico" },
    weapon: "",
    category: { en: "Attack", pt: "Ataque" },
    grade: "Rare",
    stats: [
      { label: { en: "Dexterity", pt: "Destreza" }, value: "2" },
      { label: { en: "Magic Endurance", pt: "Tolerância Mágica" }, value: "-36" },
      { label: { en: "Melee Endurance", pt: "Tolerância Corpo a Corpo" }, value: "-36" },
      { label: { en: "Ranged Endurance", pt: "Tolerância à Distância" }, value: "-36" },
      { label: { en: "Critical Damage", pt: "Dano Crítico" }, value: "3.6%" },
    ],
    description: { en: "Increases Critical Damage, but decreases Endurance.", pt: "Aumenta o Dano Crítico e a Destreza, mas reduz a Tolerância" },
  },
  {
    id: "Dagger_Rare_Attack_Skill",
    name: { en: "Primal Strike", pt: "Ataque Primal" },
    weapon: "",
    category: { en: "Attack", pt: "Ataque" },
    grade: "Rare",
    stats: [

    ],
    description: { en: "", pt: "" },
  },
  {
    id: "Dagger_Rare_AttackUtil_03",
    name: { en: "Critical Damage Expertise", pt: "Especialização em Dano Crítico" },
    weapon: "",
    category: { en: "", pt: "" },
    grade: "Rare",
    stats: [
      { label: { en: "Amitoi Healing", pt: "Cura do Amitoi" }, value: "24%" },
      { label: { en: "Critical Damage", pt: "Dano Crítico" }, value: "1.2%" },
    ],
    description: { en: "Increases Critical Damage and Amitoi Healing.", pt: "Aumenta o Dano Crítico e a Cura do Amitoi" },
  },
  {
    id: "Dagger_Rare_Defense_07",
    name: { en: "Greater Ranged Defense Augment", pt: "Aumento Superior de Defesa à Distância" },
    weapon: "",
    category: { en: "Defense", pt: "Defesa" },
    grade: "Rare",
    stats: [
      { label: { en: "Ranged Defense", pt: "Defesa à Distância" }, value: "96" },
    ],
    description: { en: "", pt: "Aumento Superior de Defesa à Distância" },
  },
  {
    id: "Dagger_Rare_Defense_08",
    name: { en: "Evasion Intensity", pt: "Intensidade de Esquiva" },
    weapon: "",
    category: { en: "Defense", pt: "Defesa" },
    grade: "Rare",
    stats: [
      { label: { en: "Magic Evasion", pt: "Esquiva Mágica" }, value: "72" },
      { label: { en: "Melee Evasion", pt: "Esquiva Corpo a Corpo" }, value: "72" },
      { label: { en: "Ranged Evasion", pt: "Esquiva à Distância" }, value: "72" },
      { label: { en: "Critical Damage", pt: "Dano Crítico" }, value: "-1.5%" },
      { label: { en: "Critical Damage Resistance", pt: "Resistência a Dano Crítico" }, value: "10%" },
    ],
    description: { en: "Increases Magic, Melee, and Ranged Evasion, but decreases Critical Damage.", pt: "Aumenta a Esquiva à Distância, Corpo a Corpo e Mágica, mas reduz o Dano Crítico" },
  },
  {
    id: "Dagger_Rare_DefenseTactic_09",
    name: { en: "Ranged Defense Expertise", pt: "Especialização em Defesa à Distância" },
    weapon: "",
    category: { en: "", pt: "" },
    grade: "Rare",
    stats: [
      { label: { en: "Ranged Defense", pt: "Defesa à Distância" }, value: "48" },
      { label: { en: "Bind Resistance", pt: "Resistência a Imobilização" }, value: "30" },
    ],
    description: { en: "Increases Ranged Defense and Bind Resistance.", pt: "Especialização em Defesa à Distância" },
  },
  {
    id: "Dagger_Rare_Def_Skill",
    name: { en: "Fluid Block", pt: "Bloqueio Fluido" },
    weapon: "",
    category: { en: "Defense", pt: "Defesa" },
    grade: "Rare",
    stats: [

    ],
    description: { en: "", pt: "" },
  },
  {
    id: "Dagger_Rare_Tac_Skill",
    name: { en: "Strategic Exchange", pt: "Troca Estratégica" },
    weapon: "",
    category: { en: "", pt: "" },
    grade: "Rare",
    stats: [

    ],
    description: { en: "", pt: "" },
  },
  {
    id: "Dagger_Rare_Tactic_10",
    name: { en: "Greater CC Resistance Augment", pt: "Aumento Superior de Resistência a CM" },
    weapon: "",
    category: { en: "", pt: "" },
    grade: "Rare",
    stats: [
      { label: { en: "Bind Resistance", pt: "Resistência a Imobilização" }, value: "40" },
      { label: { en: "Stun Resistance", pt: "Resistência a Atordoamento" }, value: "40" },
      { label: { en: "Fear Resistance", pt: "Resistência a Medo" }, value: "40" },
      { label: { en: "Sleep Resistance", pt: "Resistência a Sono" }, value: "40" },
      { label: { en: "Weaken Resistance", pt: "Resistência a Fraqueza" }, value: "40" },
      { label: { en: "Silence Resistance", pt: "Resistência a Silêncio" }, value: "40" },
      { label: { en: "Collision Resistance", pt: "Resistência a Colisão" }, value: "40" },
      { label: { en: "Petrification Resistance", pt: "Resistência a Petrificação" }, value: "40" },
    ],
    description: { en: "", pt: "Aumento Superior de Resistência a CM" },
  },
  {
    id: "Dagger_Rare_Tactic_11",
    name: { en: "Movement Speed Intensity", pt: "Intensidade de Velocidade de Movimento" },
    weapon: "",
    category: { en: "", pt: "" },
    grade: "Rare",
    stats: [
      { label: { en: "Movement Speed", pt: "Velocidade de Movimento" }, value: "4.8%" },
      { label: { en: "Buff Duration", pt: "Duração da Vantagem" }, value: "-1.8%" },
    ],
    description: { en: "Increases Movement Speed, but decreases Buff Duration.", pt: "Intensidade de Velocidade de Movimento" },
  },
  {
    id: "Dagger_Rare_TacticAttack_12",
    name: { en: "Skill Damage Boost Expertise", pt: "Especialização em Ampliação de Dano de Habilidade" },
    weapon: "",
    category: { en: "", pt: "" },
    grade: "Rare",
    stats: [
      { label: { en: "Weaken Resistance", pt: "Resistência a Fraqueza" }, value: "30" },
      { label: { en: "Skill Damage Boost", pt: "Ampliação de Dano de Habilidade" }, value: "12" },
    ],
    description: { en: "Increases Skill Damage Boost and Weaken Resistance.", pt: "Especialização em Ampliação de Dano de Habilidade" },
  },
  {
    id: "Dagger_Rare_Util_04",
    name: { en: "Greater Potion Healing Augment", pt: "Aumento Superior de Cura de Poção" },
    weapon: "",
    category: { en: "Utility", pt: "Utilidade" },
    grade: "Rare",
    stats: [
      { label: { en: "Potion Healing", pt: "Cura de Poção" }, value: "24%" },
    ],
    description: { en: "", pt: "Aumento Superior de Cura de Poção" },
  },
  {
    id: "Dagger_Rare_Util_05",
    name: { en: "Cooldown Speed Intensity", pt: "Intensidade de Velocidade de Recarga" },
    weapon: "",
    category: { en: "Utility", pt: "Utilidade" },
    grade: "Rare",
    stats: [
      { label: { en: "Stun Resistance", pt: "Resistência a Atordoamento" }, value: "-45" },
      { label: { en: "Cooldown Speed", pt: "Velocidade de Recarga" }, value: "3.6%" },
    ],
    description: { en: "Increases Skill Cooldown Speed, but decreases Stun Resistance.", pt: "Intensidade de Velocidade de Recarga" },
  },
  {
    id: "Dagger_Rare_UtilDefense_06",
    name: { en: "Magic Defense Expertise", pt: "Especialização em Defesa Mágica" },
    weapon: "",
    category: { en: "", pt: "" },
    grade: "Rare",
    stats: [
      { label: { en: "Magic Defense", pt: "Defesa Mágica" }, value: "48" },
      { label: { en: "Max Stamina", pt: "Vigor Máximo" }, value: "5" },
    ],
    description: { en: "Increases Magic Defense and Max Stamina. Max Stamina increases from Lv. 2.", pt: "Especialização em Defesa Mágica" },
  },
  {
    id: "Dagger_Rare_Util_Skill",
    name: { en: "Fleeting Shadow", pt: "Sombra Fugaz" },
    weapon: "",
    category: { en: "Utility", pt: "Utilidade" },
    grade: "Rare",
    stats: [

    ],
    description: { en: "", pt: "" },
  },
  {
    id: "Spear_Hero_Attack_01",
    name: { en: "Explosive Force", pt: "Força Explosiva" },
    weapon: "Spear",
    category: { en: "Attack", pt: "Ataque" },
    grade: "Epic",
    stats: [

    ],
    description: { en: "Explosion Damage with Rising Slash or Slaughtering Slash increases by 20% per stack when causing a Burst or Ignite explosion.", pt: "Dano da explosão ao usar Corte Ascendente ou Corte de Abate aumenta em 20% por acúmulo de Explosão ou Incendiar" },
  },
  {
    id: "Spear_Hero_Defense_03",
    name: { en: "Victory Shield", pt: "Escudo da Vitória" },
    weapon: "Spear",
    category: { en: "Defense", pt: "Defesa" },
    grade: "Epic",
    stats: [

    ],
    description: { en: "Grants a shield with 6000 Health for 3s when defeating an opponent with a Spear skill. Has a 25-second cooldown.", pt: "Concede um escudo com 6000 de Vida por 3s ao derrotar um oponente com habilidade de Lança. Tem uma recarga de 25s" },
  },
  {
    id: "Spear_Hero_Tactic_04",
    name: { en: "Ruthlessness", pt: "Inabalável" },
    weapon: "Spear",
    category: { en: "", pt: "" },
    grade: "Epic",
    stats: [

    ],
    description: { en: "Increases Stun, Collision, and Fear Chance by 40 for every 10 Fortitude.", pt: "Aumenta a Chance de Atordoamento, Colisão e Medo em 40 a cada 10 de Fortaleza" },
  },
  {
    id: "Spear_Hero_Util_02",
    name: { en: "Tenacious Spirit", pt: "Espírito Tenaz" },
    weapon: "Spear",
    category: { en: "Utility", pt: "Utilidade" },
    grade: "Epic",
    stats: [

    ],
    description: { en: "Increases Cooldown Speed by 12% when the user's Fortitude is 50 or higher.", pt: "Aumenta a Velocidade de Recarga em 12% quando a Fortaleza do usuário for de 50 ou mais" },
  },
  {
    id: "Spear_High_Attack_01",
    name: { en: "Ignite Damage Augment", pt: "Aumenta o Dano por Incendiar" },
    weapon: "Spear",
    category: { en: "Attack", pt: "Ataque" },
    grade: "Uncommon",
    stats: [

    ],
    description: { en: "Increases Ignite damage over time by 10%.", pt: "Aumenta o Dano Contínuo por Incendiar em 10%" },
  },
  {
    id: "Spear_High_Attack_02",
    name: { en: "Critical Damage Intensity", pt: "Intensidade de Dano Crítico" },
    weapon: "Spear",
    category: { en: "Attack", pt: "Ataque" },
    grade: "Uncommon",
    stats: [
      { label: { en: "Melee Defense", pt: "Defesa Corpo a Corpo" }, value: "-60" },
      { label: { en: "Critical Damage", pt: "Dano Crítico" }, value: "3%" },
    ],
    description: { en: "Increases Critical Damage, but decreases Melee Defense.", pt: "Aumenta o Dano Crítico, mas reduz a Defesa Corpo a Corpo" },
  },
  {
    id: "Spear_High_Attack_Skill",
    name: { en: "Ultimate Impact", pt: "Impacto Supremo" },
    weapon: "Spear",
    category: { en: "Attack", pt: "Ataque" },
    grade: "Uncommon",
    stats: [

    ],
    description: { en: "", pt: "" },
  },
  {
    id: "Spear_High_AttackUtil_03",
    name: { en: "Melee Critical Hit Expertise", pt: "Especialização em Acerto Crítico Corpo a Corpo" },
    weapon: "Spear",
    category: { en: "", pt: "" },
    grade: "Uncommon",
    stats: [
      { label: { en: "Melee Critical Hit Chance", pt: "Chance de Acerto Crítico Corpo a Corpo" }, value: "20" },
      { label: { en: "Buff Duration", pt: "Duração da Vantagem" }, value: "1.3%" },
    ],
    description: { en: "Increases Melee Critical Hit Chance and Buff Duration.", pt: "Especialização em Acerto Crítico Corpo a Corpo" },
  },
  {
    id: "Spear_High_Defense_07",
    name: { en: "Evasion Augment", pt: "Aumento de Esquiva" },
    weapon: "Spear",
    category: { en: "Defense", pt: "Defesa" },
    grade: "Uncommon",
    stats: [
      { label: { en: "Magic Evasion", pt: "Esquiva Mágica" }, value: "40" },
      { label: { en: "Melee Evasion", pt: "Esquiva Corpo a Corpo" }, value: "40" },
      { label: { en: "Ranged Evasion", pt: "Esquiva à Distância" }, value: "40" },
    ],
    description: { en: "Increases Magic, Melee, and Ranged Evasion.", pt: "Aumenta a Esquiva à Distância, Corpo a Corpo e Mágica" },
  },
  {
    id: "Spear_High_Defense_08",
    name: { en: "Healing Received Intensity", pt: "Intensidade de Cura Recebida" },
    weapon: "Spear",
    category: { en: "Defense", pt: "Defesa" },
    grade: "Uncommon",
    stats: [
      { label: { en: "Attack Speed", pt: "Velocidade de Ataque" }, value: "-1.5%" },
      { label: { en: "Healing Received", pt: "Cura Recebida" }, value: "5%" },
    ],
    description: { en: "Increases Healing Received, but decreases Attack Speed.", pt: "Aumenta a Cura Recebida, mas reduz a Velocidade de Ataque" },
  },
  {
    id: "Spear_High_DefenseTactic_09",
    name: { en: "Magic Evasion Expertise", pt: "Especialização em Esquiva Mágica" },
    weapon: "Spear",
    category: { en: "", pt: "" },
    grade: "Uncommon",
    stats: [
      { label: { en: "Max Health", pt: "Vida Máxima" }, value: "160" },
      { label: { en: "Magic Evasion", pt: "Esquiva Mágica" }, value: "30" },
    ],
    description: { en: "Increases Magic Evasion and Max Health.", pt: "Especialização em Esquiva Mágica" },
  },
  {
    id: "Spear_High_Def_Skill",
    name: { en: "Sustaining Guard", pt: "Guarda Sustentadora" },
    weapon: "Spear",
    category: { en: "Defense", pt: "Defesa" },
    grade: "Uncommon",
    stats: [

    ],
    description: { en: "", pt: "" },
  },
  {
    id: "Spear_High_Tac_Skill",
    name: { en: "Malice Master", pt: "Mestre da Malícia" },
    weapon: "Spear",
    category: { en: "", pt: "" },
    grade: "Uncommon",
    stats: [

    ],
    description: { en: "", pt: "" },
  },
  {
    id: "Spear_High_Tactic_10",
    name: { en: "Sleep Resistance Augment", pt: "Aumento de Resistência a Sono" },
    weapon: "Spear",
    category: { en: "", pt: "" },
    grade: "Uncommon",
    stats: [
      { label: { en: "Sleep Resistance", pt: "Resistência a Sono" }, value: "50" },
    ],
    description: { en: "", pt: "" },
  },
  {
    id: "Spear_High_Tactic_11",
    name: { en: "Shield Block Penetration Intensity", pt: "Intensidade de Penetração de Bloqueio de Escudo" },
    weapon: "Spear",
    category: { en: "", pt: "" },
    grade: "Uncommon",
    stats: [
      { label: { en: "Amitoi Healing", pt: "Cura do Amitoi" }, value: "-13%" },
      { label: { en: "Shield Block Penetration Chance", pt: "Chance de Penetração de Bloqueio de Escudo" }, value: "6%" },
    ],
    description: { en: "Shield Block Penetration Intensity", pt: "Intensidade de Penetração de Bloqueio de Escudo" },
  },
  {
    id: "Spear_High_TacticAttack_12",
    name: { en: "Attack Speed Expertise", pt: "Especialização em Velocidade de Ataque" },
    weapon: "Spear",
    category: { en: "", pt: "" },
    grade: "Uncommon",
    stats: [
      { label: { en: "Melee Hit Chance", pt: "Chance de Acerto Corpo a Corpo" }, value: "20" },
      { label: { en: "Attack Speed", pt: "Velocidade de Ataque" }, value: "1.3%" },
    ],
    description: { en: "Increases Attack Speed and Melee Hit Chance.", pt: "Especialização em Velocidade de Ataque" },
  },
  {
    id: "Spear_High_Util_04",
    name: { en: "Cooldown Speed Augment", pt: "Aumento de Velocidade de Recarga" },
    weapon: "Spear",
    category: { en: "Utility", pt: "Utilidade" },
    grade: "Uncommon",
    stats: [
      { label: { en: "Cooldown Speed", pt: "Velocidade de Recarga" }, value: "2%" },
    ],
    description: { en: "", pt: "Aumento de Velocidade de Recarga" },
  },
  {
    id: "Spear_High_Util_05",
    name: { en: "Attack Range Intensity", pt: "Intensidade de Alcance de Ataque" },
    weapon: "Spear",
    category: { en: "Utility", pt: "Utilidade" },
    grade: "Uncommon",
    stats: [
      { label: { en: "Silence Resistance", pt: "Resistência a Silêncio" }, value: "-37.5" },
      { label: { en: "Range", pt: "Alcance" }, value: "6%" },
    ],
    description: { en: "Increases Attack Range, but decreases Silence Resistance.", pt: "Intensidade de Alcance de Ataque" },
  },
  {
    id: "Spear_High_UtilDefense_06",
    name: { en: "Endurance Expertise", pt: "Especialização em Tolerância" },
    weapon: "Spear",
    category: { en: "", pt: "" },
    grade: "Uncommon",
    stats: [
      { label: { en: "Max Stamina", pt: "Vigor Máximo" }, value: "4" },
      { label: { en: "Magic Endurance", pt: "Tolerância Mágica" }, value: "20" },
      { label: { en: "Melee Endurance", pt: "Tolerância Corpo a Corpo" }, value: "20" },
      { label: { en: "Ranged Endurance", pt: "Tolerância à Distância" }, value: "20" },
    ],
    description: { en: "Increases Magic, Melee, and Ranged Endurance and Max Stamina. Max Stamina increases from Lv. 3.", pt: "Aumenta a Tolerância à Distância, Corpo a Corpo e Mágica e o Vigor Máximo. Aumenta o Vigor Máximo a partir do Nv.3" },
  },
  {
    id: "Spear_High_Util_Skill",
    name: { en: "Unlimited Arsenal", pt: "Arsenal Ilimitado" },
    weapon: "Spear",
    category: { en: "Utility", pt: "Utilidade" },
    grade: "Uncommon",
    stats: [

    ],
    description: { en: "", pt: "" },
  },
  {
    id: "Spear_Normal_Attack_01",
    name: { en: "Lesser Melee Hit Augment", pt: "Aumento Inferior de Acerto Corpo a Corpo" },
    weapon: "Spear",
    category: { en: "Attack", pt: "Ataque" },
    grade: "Common",
    stats: [
      { label: { en: "Melee Hit Chance", pt: "Chance de Acerto Corpo a Corpo" }, value: "32" },
    ],
    description: { en: "", pt: "Aumento Inferior de Acerto Corpo a Corpo" },
  },
  {
    id: "Spear_Normal_Attack_02",
    name: { en: "Melee Critical Hit Intensity", pt: "Intensidade do Acerto Crítico Corpo a Corpo" },
    weapon: "Spear",
    category: { en: "Attack", pt: "Ataque" },
    grade: "Common",
    stats: [
      { label: { en: "Melee Evasion", pt: "Esquiva Corpo a Corpo" }, value: "-36" },
      { label: { en: "Melee Critical Hit Chance", pt: "Chance de Acerto Crítico Corpo a Corpo" }, value: "48" },
    ],
    description: { en: "Increases Melee Critical Hit Chance, and decreases Melee Evasion.", pt: "Intensidade do Acerto Crítico Corpo a Corpo" },
  },
  {
    id: "Spear_Normal_Attack_Skill",
    name: { en: "Perfect Tempo", pt: "Hora Perfeita" },
    weapon: "Spear",
    category: { en: "Attack", pt: "Ataque" },
    grade: "Common",
    stats: [

    ],
    description: { en: "", pt: "" },
  },
  {
    id: "Spear_Normal_AttackUtil_03",
    name: { en: "Attack Speed Expertise", pt: "Especialização em Velocidade de Ataque" },
    weapon: "Spear",
    category: { en: "", pt: "" },
    grade: "Common",
    stats: [
      { label: { en: "Attack Speed", pt: "Velocidade de Ataque" }, value: "1.1%" },
      { label: { en: "Base Damage", pt: "Dano Base" }, value: "2" },
    ],
    description: { en: "Increases Attack Speed and Base Damage. Base Damage increases from Lv. 5.", pt: "Especialização em Velocidade de Ataque" },
  },
  {
    id: "Spear_Normal_Defense_07",
    name: { en: "Lesser Skill Damage Augment", pt: "Aumento Inferior de Dano de Habilidade" },
    weapon: "Spear",
    category: { en: "Defense", pt: "Defesa" },
    grade: "Common",
    stats: [
      { label: { en: "Skill Damage Resistance", pt: "Resistência a Dano de Habilidade" }, value: "16" },
    ],
    description: { en: "Increases Skill Damage Resistance.", pt: "Aumento Inferior de Dano de Habilidade" },
  },
  {
    id: "Spear_Normal_Defense_08",
    name: { en: "Debuff Duration Intensity", pt: "Intensidade de Duração da Desvantagem" },
    weapon: "Spear",
    category: { en: "Defense", pt: "Defesa" },
    grade: "Common",
    stats: [
      { label: { en: "Range", pt: "Alcance" }, value: "-2.4%" },
      { label: { en: "Debuff Duration", pt: "Duração da Desvantagem" }, value: "-2.4%" },
    ],
    description: { en: "Increases Debuff Duration, but decreases Attack Range.", pt: "Intensidade de Duração da Desvantagem" },
  },
  {
    id: "Spear_Normal_DefenseTactic_09",
    name: { en: "Ranged Evasion Expertise", pt: "Especialização em Esquiva à Distância" },
    weapon: "Spear",
    category: { en: "", pt: "" },
    grade: "Common",
    stats: [
      { label: { en: "Ranged Evasion", pt: "Esquiva à Distância" }, value: "24" },
      { label: { en: "Buff Duration", pt: "Duração da Vantagem" }, value: "1.1%" },
    ],
    description: { en: "Increases Ranged Evasion and Buff Duration.", pt: "Especialização em Esquiva à Distância" },
  },
  {
    id: "Spear_Normal_Def_Skill",
    name: { en: "Universal Protection", pt: "Proteção Universal" },
    weapon: "Spear",
    category: { en: "Defense", pt: "Defesa" },
    grade: "Common",
    stats: [

    ],
    description: { en: "", pt: "" },
  },
  {
    id: "Spear_Normal_Tac_Skill",
    name: { en: "Swift Reaper", pt: "Ceifador Ágil" },
    weapon: "Spear",
    category: { en: "", pt: "" },
    grade: "Common",
    stats: [

    ],
    description: { en: "", pt: "" },
  },
  {
    id: "Spear_Normal_Tactic_10",
    name: { en: "Lesser Fear Augment", pt: "Aumento Inferior de Medo" },
    weapon: "Spear",
    category: { en: "", pt: "" },
    grade: "Common",
    stats: [
      { label: { en: "Fear Chance", pt: "Chance de Medo" }, value: "40" },
    ],
    description: { en: "", pt: "" },
  },
  {
    id: "Spear_Normal_Tactic_11",
    name: { en: "Crowd Control Intensity", pt: "Intensidade de CM" },
    weapon: "Spear",
    category: { en: "", pt: "" },
    grade: "Common",
    stats: [
      { label: { en: "Bind Chance", pt: "Chance de Imobilização" }, value: "40" },
      { label: { en: "Stun Chance", pt: "Chance de Atordoamento" }, value: "40" },
      { label: { en: "Fear Chance", pt: "Chance de Medo" }, value: "40" },
      { label: { en: "Sleep Chance", pt: "Chance de Sono" }, value: "40" },
      { label: { en: "Weaken Chance", pt: "Chance de Fraqueza" }, value: "40" },
      { label: { en: "Silence Chance", pt: "Chance de Silêncio" }, value: "40" },
      { label: { en: "Potion Healing", pt: "Cura de Poção" }, value: "-12%" },
      { label: { en: "Collision Chance", pt: "Chance de Colisão" }, value: "40" },
      { label: { en: "Petrification Chance", pt: "Chance de Petrificação" }, value: "40" },
    ],
    description: { en: "Increases all CC Chance, but decreases Potion Healing.", pt: "Aumenta a Chance de CM Total, mas reduz a Cura de Poção" },
  },
  {
    id: "Spear_Normal_TacticAttack_12",
    name: { en: "Movement Speed Expertise", pt: "Especialização em Velocidade de Movimento" },
    weapon: "Spear",
    category: { en: "", pt: "" },
    grade: "Common",
    stats: [
      { label: { en: "Movement Speed", pt: "Velocidade de Movimento" }, value: "1.1%" },
      { label: { en: "Base Damage", pt: "Dano Base" }, value: "2" },
    ],
    description: { en: "Increases Base Damage and Movement Speed. Base Damage increases from Lv. 5.", pt: "Especialização em Velocidade de Movimento" },
  },
  {
    id: "Spear_Normal_Util_04",
    name: { en: "Lesser Mana Regen Augment", pt: "Aumento Inferior de Regeneração de Mana" },
    weapon: "Spear",
    category: { en: "Utility", pt: "Utilidade" },
    grade: "Common",
    stats: [
      { label: { en: "Mana Regen", pt: "Regeneração de Mana" }, value: "24" },
    ],
    description: { en: "", pt: "Aumento Inferior de Regeneração de Mana" },
  },
  {
    id: "Spear_Normal_Util_05",
    name: { en: "Stamina Regen Intensity", pt: "Intensidade de Regeneração de Vigor" },
    weapon: "Spear",
    category: { en: "Utility", pt: "Utilidade" },
    grade: "Common",
    stats: [
      { label: { en: "Stamina Regen", pt: "Regeneração de Vigor" }, value: "4.8" },
      { label: { en: "Stun Resistance", pt: "Resistência a Atordoamento" }, value: "-30" },
    ],
    description: { en: "Increases Stamina Regen, but decreases Stun Resistance.", pt: "Intensidade de Regeneração de Vigor" },
  },
  {
    id: "Spear_Normal_UtilDefense_06",
    name: { en: "Cooldown Speed Expertise", pt: "Especialização em Velocidade de Recarga" },
    weapon: "Spear",
    category: { en: "", pt: "" },
    grade: "Common",
    stats: [
      { label: { en: "Melee Evasion", pt: "Esquiva Corpo a Corpo" }, value: "24" },
      { label: { en: "Cooldown Speed", pt: "Velocidade de Recarga" }, value: "0.8%" },
    ],
    description: { en: "Increases Cooldown Speed and Melee Evasion.", pt: "Especialização em Velocidade de Recarga" },
  },
  {
    id: "Spear_Normal_Util_Skill",
    name: { en: "Precise Brutality", pt: "Brutalidade Precisa" },
    weapon: "Spear",
    category: { en: "Utility", pt: "Utilidade" },
    grade: "Common",
    stats: [

    ],
    description: { en: "", pt: "" },
  },
  {
    id: "Spear_Rare_Attack_01",
    name: { en: "Greater Bonus Damage Augment", pt: "Aumento Superior de Bônus de Dano" },
    weapon: "Spear",
    category: { en: "Attack", pt: "Ataque" },
    grade: "Rare",
    stats: [
      { label: { en: "Bonus Damage", pt: "Bônus de Dano" }, value: "20" },
    ],
    description: { en: "", pt: "Aumento Superior de Bônus de Dano" },
  },
  {
    id: "Spear_Rare_Attack_02",
    name: { en: "Melee Heavy Attack Intensity", pt: "Intensidade de Ataque Pesado Corpo a Corpo" },
    weapon: "Spear",
    category: { en: "Attack", pt: "Ataque" },
    grade: "Rare",
    stats: [
      { label: { en: "Perception", pt: "Percepção" }, value: "2" },
      { label: { en: "Melee Heavy Attack Chance", pt: "Chance de Ataque Pesado Corpo a Corpo" }, value: "72" },
      { label: { en: "Melee Endurance", pt: "Tolerância Corpo a Corpo" }, value: "-54" },
    ],
    description: { en: "Increases Melee Heavy Attack Chance, but decreases Melee Endurance.", pt: "Intensidade de Ataque Pesado Corpo a Corpo" },
  },
  {
    id: "Spear_Rare_Attack_Skill",
    name: { en: "Supreme Burst", pt: "Explosão Suprema" },
    weapon: "Spear",
    category: { en: "Attack", pt: "Ataque" },
    grade: "Rare",
    stats: [

    ],
    description: { en: "", pt: "" },
  },
  {
    id: "Spear_Rare_AttackUtil_03",
    name: { en: "Skill Damage Boost Expertise", pt: "Especialização em Ampliação de Dano de Habilidade" },
    weapon: "Spear",
    category: { en: "", pt: "" },
    grade: "Rare",
    stats: [
      { label: { en: "Mana Cost Efficiency", pt: "Eficiência do Custo de Mana" }, value: "2.4%" },
      { label: { en: "Skill Damage Boost", pt: "Ampliação de Dano de Habilidade" }, value: "12" },
    ],
    description: { en: "Increases Skill Damage Boost and Mana Cost Efficiency.", pt: "Especialização em Ampliação de Dano de Habilidade" },
  },
  {
    id: "Spear_Rare_Defense_07",
    name: { en: "Greater Damage Reduction Augment", pt: "Aumento Superior de Redução de Dano" },
    weapon: "Spear",
    category: { en: "Defense", pt: "Defesa" },
    grade: "Rare",
    stats: [
      { label: { en: "Damage Reduction", pt: "Redução de Dano" }, value: "20" },
    ],
    description: { en: "Greater Damage Reduction Augment", pt: "Aumento Superior de Redução de Dano" },
  },
  {
    id: "Spear_Rare_Defense_08",
    name: { en: "Skill Damage Resistance Intensity", pt: "Intensidade de Resistência a Dano de Habilidade" },
    weapon: "Spear",
    category: { en: "Defense", pt: "Defesa" },
    grade: "Rare",
    stats: [
      { label: { en: "Fortitude", pt: "Fortaleza" }, value: "2" },
      { label: { en: "Melee Critical Hit Chance", pt: "Chance de Acerto Crítico Corpo a Corpo" }, value: "-36" },
      { label: { en: "Skill Damage Resistance", pt: "Resistência a Dano de Habilidade" }, value: "36" },
    ],
    description: { en: "Skill Damage Resistance Intensity", pt: "Intensidade de Resistência a Dano de Habilidade" },
  },
  {
    id: "Spear_Rare_DefenseTactic_09",
    name: { en: "Magic Heavy Attack Response", pt: "Resposta ao Ataque Pesado Mágico" },
    weapon: "Spear",
    category: { en: "", pt: "" },
    grade: "Rare",
    stats: [
      { label: { en: "Magic Heavy Attack Evasion", pt: "Esquiva de Ataque Pesado Mágico" }, value: "36" },
      { label: { en: "Cooldown Speed", pt: "Velocidade de Recarga" }, value: "1.2%" },
    ],
    description: { en: "Increases Magic Heavy Attack Evasion and Cooldown Speed.", pt: "Resposta ao Ataque Pesado Mágico" },
  },
  {
    id: "Spear_Rare_Def_Skill",
    name: { en: "Enduring Dash", pt: "Acelerada Duradoura" },
    weapon: "Spear",
    category: { en: "Defense", pt: "Defesa" },
    grade: "Rare",
    stats: [

    ],
    description: { en: "", pt: "" },
  },
  {
    id: "Spear_Rare_Tac_Skill",
    name: { en: "Precise Control", pt: "Controle Preciso" },
    weapon: "Spear",
    category: { en: "", pt: "" },
    grade: "Rare",
    stats: [

    ],
    description: { en: "", pt: "" },
  },
  {
    id: "Spear_Rare_Tactic_10",
    name: { en: "Greater Collision Augment", pt: "Aumento Superior de Colisão" },
    weapon: "Spear",
    category: { en: "", pt: "" },
    grade: "Rare",
    stats: [
      { label: { en: "Collision Chance", pt: "Chance de Colisão" }, value: "60" },
    ],
    description: { en: "", pt: "" },
  },
  {
    id: "Spear_Rare_Tactic_11",
    name: { en: "CC Resistance Intensity", pt: "Intensidade de Resistência a CM" },
    weapon: "Spear",
    category: { en: "", pt: "" },
    grade: "Rare",
    stats: [
      { label: { en: "Bind Resistance", pt: "Resistência a Imobilização" }, value: "60" },
      { label: { en: "Stun Resistance", pt: "Resistência a Atordoamento" }, value: "60" },
      { label: { en: "Fear Resistance", pt: "Resistência a Medo" }, value: "60" },
      { label: { en: "Sleep Resistance", pt: "Resistência a Sono" }, value: "60" },
      { label: { en: "Weaken Resistance", pt: "Resistência a Fraqueza" }, value: "60" },
      { label: { en: "Silence Resistance", pt: "Resistência a Silêncio" }, value: "60" },
      { label: { en: "Collision Resistance", pt: "Resistência a Colisão" }, value: "60" },
      { label: { en: "Petrification Resistance", pt: "Resistência a Petrificação" }, value: "60" },
      { label: { en: "Buff Duration", pt: "Duração da Vantagem" }, value: "-1.8%" },
    ],
    description: { en: "Increases all CC Resistances, but decreases Buff Duration.", pt: "Intensidade de Resistência a CM" },
  },
  {
    id: "Spear_Rare_TacticAttack_12",
    name: { en: "Melee Critical Hit Expertise", pt: "Especialização em Acerto Crítico Corpo a Corpo" },
    weapon: "Spear",
    category: { en: "", pt: "" },
    grade: "Rare",
    stats: [
      { label: { en: "Stun Chance", pt: "Chance de Atordoamento" }, value: "30" },
      { label: { en: "Melee Critical Hit Chance", pt: "Chance de Acerto Crítico Corpo a Corpo" }, value: "24" },
    ],
    description: { en: "Increases Melee Critical Hit Chance and Stun Chance.", pt: "Especialização em Acerto Crítico Corpo a Corpo" },
  },
  {
    id: "Spear_Rare_Util_04",
    name: { en: "Greater Attack Range Augment", pt: "Aumento Superior de Alcance de Ataque" },
    weapon: "Spear",
    category: { en: "Utility", pt: "Utilidade" },
    grade: "Rare",
    stats: [
      { label: { en: "Range", pt: "Alcance" }, value: "4.8%" },
    ],
    description: { en: "", pt: "Aumento Superior de Alcance de Ataque" },
  },
  {
    id: "Spear_Rare_Util_05",
    name: { en: "Max Health Intensity", pt: "Intensidade de Vida Máxima" },
    weapon: "Spear",
    category: { en: "Utility", pt: "Utilidade" },
    grade: "Rare",
    stats: [
      { label: { en: "Max Health", pt: "Vida Máxima" }, value: "576" },
      { label: { en: "Fear Chance", pt: "Chance de Medo" }, value: "-45" },
    ],
    description: { en: "Increases Max Health, but decreases Fear Chance.", pt: "Aumenta a Vida Máxima, mas reduz a Chance de Medo" },
  },
  {
    id: "Spear_Rare_UtilDefense_06",
    name: { en: "Ranged Endurance Expertise", pt: "Especialização em Tolerância à Distância" },
    weapon: "Spear",
    category: { en: "", pt: "" },
    grade: "Rare",
    stats: [
      { label: { en: "Ranged Endurance", pt: "Tolerância à Distância" }, value: "36" },
      { label: { en: "Skill Damage Resistance", pt: "Resistência a Dano de Habilidade" }, value: "12" },
    ],
    description: { en: "Increased Skill Damage Resistance and Ranged Endurance.", pt: "Especialização em Tolerância à Distância" },
  },
  {
    id: "Spear_Rare_Util_Skill",
    name: { en: "Repulsive Force", pt: "Força Repulsiva" },
    weapon: "Spear",
    category: { en: "Utility", pt: "Utilidade" },
    grade: "Rare",
    stats: [

    ],
    description: { en: "", pt: "" },
  },
  {
    id: "Staff_Hero_Attack_01",
    name: { en: "Power Surge", pt: "Surto de Poder" },
    weapon: "Staff",
    category: { en: "Attack", pt: "Ataque" },
    grade: "Epic",
    stats: [

    ],
    description: { en: "Max Damage increases by 0.16% per 1,000 of Max Mana, up to 30,000 of Max Mana.", pt: "Aumenta o Dano Máximo em 0.16% por 1.000 da Mana Máxima, até 30.000 da Mana Máxima" },
  },
  {
    id: "Staff_Hero_Defense_03",
    name: { en: "Mana Shield", pt: "Escudo de Mana" },
    weapon: "Staff",
    category: { en: "Defense", pt: "Defesa" },
    grade: "Epic",
    stats: [

    ],
    description: { en: "Increases Defense equal to 20% of Mana Regen (up to 3,500) + 150.", pt: "Aumenta a Defesa em 20% da Regeneração de Mana (até 3.500) + 150." },
  },
  {
    id: "Staff_Hero_Tactic_04",
    name: { en: "Mana Spring", pt: "Fonte de Mana" },
    weapon: "Staff",
    category: { en: "", pt: "" },
    grade: "Epic",
    stats: [

    ],
    description: { en: "Increases Mana Regen by 60% when the user's Mana is 30% of Max Mana or less.", pt: "Aumenta a Regeneração de Mana em 60% quando a Mana do usuário for de 30% da Mana Máxima ou menos" },
  },
  {
    id: "Staff_Hero_Util_02",
    name: { en: "Burning Ripple", pt: "Onda Ardente" },
    weapon: "Staff",
    category: { en: "Utility", pt: "Utilidade" },
    grade: "Epic",
    stats: [

    ],
    description: { en: "Attacking a victim of the user's Burning has a 8% chance to inflict Burning in a 3m radius.", pt: "Atacar um alvo afetado por Queimadura aplicada pelo usuário tem 8% de chance de infligir Queimadura em um raio de 3m" },
  },
  {
    id: "Staff_High_Attack_01",
    name: { en: "Burning Damage Augment", pt: "Aumento do Dano por Queimadura" },
    weapon: "Staff",
    category: { en: "Attack", pt: "Ataque" },
    grade: "Uncommon",
    stats: [

    ],
    description: { en: "Increases Burning Damage by 10%.", pt: "Aumenta o Dano por Queimadura em 10%." },
  },
  {
    id: "Staff_High_Attack_02",
    name: { en: "Magic Damage Intensity", pt: "Intensidade de Dano Mágico" },
    weapon: "Staff",
    category: { en: "Attack", pt: "Ataque" },
    grade: "Uncommon",
    stats: [
      { label: { en: "Ranged Evasion", pt: "Esquiva à Distância" }, value: "-45" },
      { label: { en: "Magic Damage Boost", pt: "Ampliação de Dano Mágico" }, value: "3%" },
    ],
    description: { en: "Increases Magic Damage Boost, but decreases Ranged Evasion.", pt: "Aumenta a Ampliação de Dano Mágico, mas reduz a Esquiva à Distância" },
  },
  {
    id: "Staff_High_Attack_Skill",
    name: { en: "Arctic Thunder", pt: "Trovoada Ártica" },
    weapon: "Staff",
    category: { en: "Attack", pt: "Ataque" },
    grade: "Uncommon",
    stats: [

    ],
    description: { en: "", pt: "" },
  },
  {
    id: "Staff_High_AttackUtil_03",
    name: { en: "Magic Critical Hit Expertise", pt: "Especialização em Acerto Crítico Mágico" },
    weapon: "Staff",
    category: { en: "", pt: "" },
    grade: "Uncommon",
    stats: [
      { label: { en: "Mana Regen", pt: "Regeneração de Mana" }, value: "15" },
      { label: { en: "Magic Critical Hit Chance", pt: "Chance de Acerto Crítico Mágico" }, value: "20" },
    ],
    description: { en: "Increases Magic Critical Hit Chance and Mana Regen.", pt: "Especialização em Acerto Crítico Mágico" },
  },
  {
    id: "Staff_High_Defense_07",
    name: { en: "Melee Defense Augment", pt: "Aumento de Defesa Corpo a Corpo" },
    weapon: "Staff",
    category: { en: "Defense", pt: "Defesa" },
    grade: "Uncommon",
    stats: [
      { label: { en: "Melee Defense", pt: "Defesa Corpo a Corpo" }, value: "80" },
    ],
    description: { en: "", pt: "Aumento de Defesa Corpo a Corpo" },
  },
  {
    id: "Staff_High_Defense_08",
    name: { en: "Melee Evasion Intensity", pt: "Intensidade de Esquiva Corpo a Corpo" },
    weapon: "Staff",
    category: { en: "Defense", pt: "Defesa" },
    grade: "Uncommon",
    stats: [
      { label: { en: "Melee Evasion", pt: "Esquiva Corpo a Corpo" }, value: "90" },
      { label: { en: "Magic Hit Chance", pt: "Chance de Acerto Mágico" }, value: "-30" },
    ],
    description: { en: "Increases Melee Evasion, but decreases Magic Hit Chance.", pt: "Intensidade de Esquiva Corpo a Corpo" },
  },
  {
    id: "Staff_High_DefenseTactic_09",
    name: { en: "Attack Range Expertise", pt: "Especialização em Alcance de Ataque" },
    weapon: "Staff",
    category: { en: "", pt: "" },
    grade: "Uncommon",
    stats: [
      { label: { en: "Ranged Heavy Attack Evasion", pt: "Esquiva de Ataque Pesado à Distância" }, value: "30" },
      { label: { en: "Range", pt: "Alcance" }, value: "2%" },
    ],
    description: { en: "Increases Attack Range and Ranged Heavy Attack Evasion.", pt: "Especialização em Alcance de Ataque" },
  },
  {
    id: "Staff_High_Def_Skill",
    name: { en: "Spirit of Perseverance", pt: "Espírito de Perseverança" },
    weapon: "Staff",
    category: { en: "Defense", pt: "Defesa" },
    grade: "Uncommon",
    stats: [

    ],
    description: { en: "", pt: "" },
  },
  {
    id: "Staff_High_Tac_Skill",
    name: { en: "Infernal Aftermath", pt: "Consequências Infernais" },
    weapon: "Staff",
    category: { en: "", pt: "" },
    grade: "Uncommon",
    stats: [

    ],
    description: { en: "", pt: "" },
  },
  {
    id: "Staff_High_Tactic_10",
    name: { en: "Burning Augment", pt: "Aumento de Queimadura" },
    weapon: "Staff",
    category: { en: "", pt: "" },
    grade: "Uncommon",
    stats: [

    ],
    description: { en: "Increases Burning Chance by 5%.", pt: "Aumenta a Chance de Queimadura em 5%" },
  },
  {
    id: "Staff_High_Tactic_11",
    name: { en: "Species Damage Reduction Intensity", pt: "Intensidade de Redução de Dano de Espécies" },
    weapon: "Staff",
    category: { en: "", pt: "" },
    grade: "Uncommon",
    stats: [
      { label: { en: "Fear Resistance", pt: "Resistência a Medo" }, value: "-37.5" },
      { label: { en: "Daemonus Damage Reduction", pt: "악마류 피해량 경감" }, value: "20" },
      { label: { en: "Animalia Damage Reduction", pt: "동물류 피해량 경감" }, value: "20" },
      { label: { en: "Immortus Damage Reduction", pt: "불사류 피해량 경감" }, value: "20" },
      { label: { en: "Rankinus Damage Reduction", pt: "태인류 피해량 경감" }, value: "20" },
      { label: { en: "Construct Damage Reduction", pt: "피조류 피해량 경감" }, value: "20" },
    ],
    description: { en: "Species Damage Reduction Intensity", pt: "Intensidade de Redução de Dano de Espécies" },
  },
  {
    id: "Staff_High_TacticAttack_12",
    name: { en: "Attack Speed Expertise", pt: "Especialização em Velocidade de Ataque" },
    weapon: "Staff",
    category: { en: "", pt: "" },
    grade: "Uncommon",
    stats: [
      { label: { en: "Max Mana", pt: "Mana Máxima" }, value: "160" },
      { label: { en: "Attack Speed", pt: "Velocidade de Ataque" }, value: "1.3%" },
    ],
    description: { en: "Increases Attack Speed and Max Mana.", pt: "Especialização em Velocidade de Ataque" },
  },
  {
    id: "Staff_High_Util_04",
    name: { en: "Silence Resistance Augment", pt: "Aumento de Resistência a Silêncio" },
    weapon: "Staff",
    category: { en: "Utility", pt: "Utilidade" },
    grade: "Uncommon",
    stats: [
      { label: { en: "Silence Resistance", pt: "Resistência a Silêncio" }, value: "50" },
    ],
    description: { en: "", pt: "Aumento de Resistência a Silêncio" },
  },
  {
    id: "Staff_High_Util_05",
    name: { en: "Max Stamina Intensity", pt: "Intensidade de Vigor Máximo" },
    weapon: "Staff",
    category: { en: "Utility", pt: "Utilidade" },
    grade: "Uncommon",
    stats: [
      { label: { en: "Max Stamina", pt: "Vigor Máximo" }, value: "12" },
      { label: { en: "Range", pt: "Alcance" }, value: "-2.6%" },
    ],
    description: { en: "Increases Max Stamina, but decreases Attack Range.", pt: "Aumenta o Vigor Máximo, mas reduz o Alcance de Ataque" },
  },
  {
    id: "Staff_High_UtilDefense_06",
    name: { en: "Endurance Expertise", pt: "Especialização em Tolerância" },
    weapon: "Staff",
    category: { en: "", pt: "" },
    grade: "Uncommon",
    stats: [
      { label: { en: "Magic Endurance", pt: "Tolerância Mágica" }, value: "20" },
      { label: { en: "Melee Endurance", pt: "Tolerância Corpo a Corpo" }, value: "20" },
      { label: { en: "Ranged Endurance", pt: "Tolerância à Distância" }, value: "20" },
      { label: { en: "Cooldown Speed", pt: "Velocidade de Recarga" }, value: "1%" },
    ],
    description: { en: "Increases Magic, Melee, and Ranged Endurance and Cooldown Speed.", pt: "Aumenta a Tolerância à Distância, Corpo a Corpo e Mágica e a Velocidade de Recarga." },
  },
  {
    id: "Staff_High_Util_Skill",
    name: { en: "Resonant Barrier", pt: "Barreira Ressonante" },
    weapon: "Staff",
    category: { en: "Utility", pt: "Utilidade" },
    grade: "Uncommon",
    stats: [

    ],
    description: { en: "", pt: "" },
  },
  {
    id: "Staff_Normal_Attack_01",
    name: { en: "Lesser Max Damage Augment", pt: "Aumento Inferior de Dano Máximo" },
    weapon: "Staff",
    category: { en: "Attack", pt: "Ataque" },
    grade: "Common",
    stats: [
      { label: { en: "Max Damage", pt: "Dano Máx." }, value: "10" },
    ],
    description: { en: "Increases Max Damage for Staves.", pt: "Aumento Inferior de Dano Máximo" },
  },
  {
    id: "Staff_Normal_Attack_02",
    name: { en: "Magic Critical Hit Intensity", pt: "Intensidade de Acerto Crítico Mágico" },
    weapon: "Staff",
    category: { en: "Attack", pt: "Ataque" },
    grade: "Common",
    stats: [
      { label: { en: "Magic Heavy Attack Evasion", pt: "Esquiva de Ataque Pesado Mágico" }, value: "-24" },
      { label: { en: "Melee Heavy Attack Evasion", pt: "Esquiva de Ataque Pesado Corpo a Corpo" }, value: "-24" },
      { label: { en: "Ranged Heavy Attack Evasion", pt: "Esquiva de Ataque Pesado à Distância" }, value: "-24" },
      { label: { en: "Magic Critical Hit Chance", pt: "Chance de Acerto Crítico Mágico" }, value: "48" },
    ],
    description: { en: "Increases Magic Critical Hit Chance, but decreases Magic, Melee, and Ranged Heavy Attack Evasion.", pt: "Intensidade de Acerto Crítico Mágico" },
  },
  {
    id: "Staff_Normal_Attack_Skill",
    name: { en: "Mana Shockwave", pt: "Onda de Choque de Mana" },
    weapon: "Staff",
    category: { en: "Attack", pt: "Ataque" },
    grade: "Common",
    stats: [

    ],
    description: { en: "", pt: "" },
  },
  {
    id: "Staff_Normal_AttackUtil_03",
    name: { en: "Heavy Attack Expertise", pt: "Especialização em Ataque Pesado" },
    weapon: "Staff",
    category: { en: "", pt: "" },
    grade: "Common",
    stats: [
      { label: { en: "Magic Heavy Attack Chance", pt: "Chance de Ataque Pesado Mágico" }, value: "12.8" },
      { label: { en: "Melee Heavy Attack Chance", pt: "Chance de Ataque Pesado Corpo a Corpo" }, value: "12.8" },
      { label: { en: "Ranged Heavy Attack Chance", pt: "Chance de Ataque Pesado à Distância" }, value: "12.8" },
      { label: { en: "Amitoi Healing", pt: "Cura do Amitoi" }, value: "16%" },
    ],
    description: { en: "Increases Magic, Melee, and Ranged Heavy Attack Chance and Amitoi Healing.", pt: "Especialização em Ataque Pesado" },
  },
  {
    id: "Staff_Normal_Defense_07",
    name: { en: "Lesser Evasion Augment", pt: "Aumento Inferior de Esquiva" },
    weapon: "Staff",
    category: { en: "Defense", pt: "Defesa" },
    grade: "Common",
    stats: [
      { label: { en: "Magic Evasion", pt: "Esquiva Mágica" }, value: "32" },
      { label: { en: "Melee Evasion", pt: "Esquiva Corpo a Corpo" }, value: "32" },
      { label: { en: "Ranged Evasion", pt: "Esquiva à Distância" }, value: "32" },
    ],
    description: { en: "Increases Magic, Melee, and Ranged Evasion.", pt: "Aumenta a Esquiva à Distância, Corpo a Corpo e Mágica" },
  },
  {
    id: "Staff_Normal_Defense_08",
    name: { en: "Defense Intensity", pt: "Intensidade de Defesa" },
    weapon: "Staff",
    category: { en: "Defense", pt: "Defesa" },
    grade: "Common",
    stats: [
      { label: { en: "Magic Defense", pt: "Defesa Mágica" }, value: "48" },
      { label: { en: "Melee Defense", pt: "Defesa Corpo a Corpo" }, value: "48" },
      { label: { en: "Ranged Defense", pt: "Defesa à Distância" }, value: "48" },
      { label: { en: "Magic Critical Hit Chance", pt: "Chance de Acerto Crítico Mágico" }, value: "-24" },
    ],
    description: { en: "Increases Magic, Melee, and Ranged Defense, but decreases Magic Critical Hit Chance.", pt: "Chance de Acerto Crítico Mágico" },
  },
  {
    id: "Staff_Normal_DefenseTactic_09",
    name: { en: "Magic Heavy Attack Evasion Expertise", pt: "Especialização em Esquiva de Ataque Pesado Mágico" },
    weapon: "Staff",
    category: { en: "", pt: "" },
    grade: "Common",
    stats: [
      { label: { en: "Weaken Chance", pt: "Chance de Fraqueza" }, value: "20" },
      { label: { en: "Magic Heavy Attack Evasion", pt: "Esquiva de Ataque Pesado Mágico" }, value: "24" },
    ],
    description: { en: "Magic Heavy Attack Evasion Expertise", pt: "Especialização em Esquiva de Ataque Pesado Mágico" },
  },
  {
    id: "Staff_Normal_Def_Skill",
    name: { en: "Vitality Conversion", pt: "Conversão de Vitalidade" },
    weapon: "Staff",
    category: { en: "Defense", pt: "Defesa" },
    grade: "Common",
    stats: [

    ],
    description: { en: "", pt: "" },
  },
  {
    id: "Staff_Normal_Tac_Skill",
    name: { en: "Strategic Compromise", pt: "Compromisso Estratégico" },
    weapon: "Staff",
    category: { en: "", pt: "" },
    grade: "Common",
    stats: [

    ],
    description: { en: "", pt: "" },
  },
  {
    id: "Staff_Normal_Tactic_10",
    name: { en: "Lesser Species Damage Augment", pt: "Aumento Inferior de Dano de Espécies" },
    weapon: "Staff",
    category: { en: "", pt: "" },
    grade: "Common",
    stats: [
      { label: { en: "Demon Damage Boost", pt: "Ampliação de Dano contra Demônios" }, value: "12.8" },
      { label: { en: "Wildkin Damage Boost", pt: "Ampliação de Dano contra Selvagens" }, value: "12.8" },
      { label: { en: "Undead Damage Boost", pt: "Ampliação de Dano contra Mortos-vivos" }, value: "12.8" },
      { label: { en: "Humanoid Damage Boost", pt: "Ampliação de Dano contra Humanoides" }, value: "12.8" },
      { label: { en: "Construct Damage Boost", pt: "Ampliação de Dano contra Construtos" }, value: "12.8" },
    ],
    description: { en: "Increases all Species Damage Boost.", pt: "Aumento Inferior de Dano de Espécies" },
  },
  {
    id: "Staff_Normal_Tactic_11",
    name: { en: "Max Mana Intensity", pt: "Intensidade de Mana Máxima" },
    weapon: "Staff",
    category: { en: "", pt: "" },
    grade: "Common",
    stats: [
      { label: { en: "Max Mana", pt: "Mana Máxima" }, value: "384" },
      { label: { en: "Amitoi Healing", pt: "Cura do Amitoi" }, value: "-10%" },
    ],
    description: { en: "Increases Max Mana, but decreases Amitoi Healing.", pt: "Aumenta a Mana Máxima, mas reduz a Cura do Amitoi" },
  },
  {
    id: "Staff_Normal_TacticAttack_12",
    name: { en: "Magic Hit Expertise", pt: "Especialização em Acerto Mágico" },
    weapon: "Staff",
    category: { en: "", pt: "" },
    grade: "Common",
    stats: [
      { label: { en: "Magic Hit Chance", pt: "Chance de Acerto Mágico" }, value: "16" },
      { label: { en: "Buff Duration", pt: "Duração da Vantagem" }, value: "1.1%" },
    ],
    description: { en: "Increases Buff Duration and Magic Hit Chance.", pt: "Especialização em Acerto Mágico" },
  },
  {
    id: "Staff_Normal_Util_04",
    name: { en: "Lesser Mana Regen Augment", pt: "Aumento Inferior de Regeneração de Mana" },
    weapon: "Staff",
    category: { en: "Utility", pt: "Utilidade" },
    grade: "Common",
    stats: [
      { label: { en: "Mana Regen", pt: "Regeneração de Mana" }, value: "24" },
    ],
    description: { en: "", pt: "Aumento Inferior de Regeneração de Mana" },
  },
  {
    id: "Staff_Normal_Util_05",
    name: { en: "Cooldown Speed Intensity", pt: "Intensidade de Velocidade de Recarga" },
    weapon: "Staff",
    category: { en: "Utility", pt: "Utilidade" },
    grade: "Common",
    stats: [
      { label: { en: "Stamina Regen", pt: "Regeneração de Vigor" }, value: "-2.4" },
      { label: { en: "Cooldown Speed", pt: "Velocidade de Recarga" }, value: "2.4%" },
    ],
    description: { en: "Increases Cooldown Speed, but decreases Stamina Regen.", pt: "Intensidade de Velocidade de Recarga" },
  },
  {
    id: "Staff_Normal_UtilDefense_06",
    name: { en: "Melee Evasion Expertise", pt: "Especialização em Esquiva Corpo a Corpo" },
    weapon: "Staff",
    category: { en: "", pt: "" },
    grade: "Common",
    stats: [
      { label: { en: "Mana Regen", pt: "Regeneração de Mana" }, value: "12" },
      { label: { en: "Melee Evasion", pt: "Esquiva Corpo a Corpo" }, value: "24" },
    ],
    description: { en: "Increases Melee Evasion and Mana Regen.", pt: "Especialização em Esquiva Corpo a Corpo" },
  },
  {
    id: "Staff_Normal_Util_Skill",
    name: { en: "Flame Discipline", pt: "" },
    weapon: "Staff",
    category: { en: "Utility", pt: "" },
    grade: "Common",
    stats: [

    ],
    description: { en: "", pt: "" },
  },
  {
    id: "Staff_Rare_Attack_02",
    name: { en: "Skill Damage Boost Intensity", pt: "Intensidade de Ampliação de Dano de Habilidade" },
    weapon: "Staff",
    category: { en: "Attack", pt: "Ataque" },
    grade: "Rare",
    stats: [
      { label: { en: "Wisdom", pt: "Sabedoria" }, value: "2" },
      { label: { en: "Ranged Endurance", pt: "Tolerância à Distância" }, value: "-54" },
      { label: { en: "Skill Damage Boost", pt: "Ampliação de Dano de Habilidade" }, value: "36" },
    ],
    description: { en: "Increases Skill Damage Boost, but decreases Ranged Endurance.", pt: "Intensidade de Ampliação de Dano de Habilidade" },
  },
  {
    id: "Staff_Rare_Attack_Skill",
    name: { en: "Fire Wave Amplifier", pt: "Amplificador de Onda Flamejante" },
    weapon: "Staff",
    category: { en: "Attack", pt: "Ataque" },
    grade: "Rare",
    stats: [

    ],
    description: { en: "", pt: "Amplificador de Onda Flamejante" },
  },
  {
    id: "Staff_Rare_AttackUtil_03",
    name: { en: "Base Damage Expertise", pt: "Especialização em Dano Base" },
    weapon: "Staff",
    category: { en: "", pt: "" },
    grade: "Rare",
    stats: [
      { label: { en: "Mana Regen", pt: "Regeneração de Mana" }, value: "18" },
      { label: { en: "Base Damage", pt: "Dano Base" }, value: "3" },
    ],
    description: { en: "Increases Base Damage and Mana Regen. Base Damage increases from Lv. 4.", pt: "Aumenta o Dano Base e a Regeneração de Mana. Aumenta o Dano Base a partir do Nv.4" },
  },
  {
    id: "Staff_Rare_Defense_07",
    name: { en: "Greater Max Health Augment", pt: "Aumento Superior de Vida Máxima" },
    weapon: "Staff",
    category: { en: "Defense", pt: "Defesa" },
    grade: "Rare",
    stats: [
      { label: { en: "Max Health", pt: "Vida Máxima" }, value: "384" },
    ],
    description: { en: "", pt: "Aumento Superior de Vida Máxima" },
  },
  {
    id: "Staff_Rare_Defense_08",
    name: { en: "Skill Damage Resistance Intensity", pt: "Intensidade de Resistência a Dano de Habilidade" },
    weapon: "Staff",
    category: { en: "Defense", pt: "Defesa" },
    grade: "Rare",
    stats: [
      { label: { en: "Strength", pt: "Força" }, value: "2" },
      { label: { en: "Magic Heavy Attack Chance", pt: "Chance de Ataque Pesado Mágico" }, value: "-36" },
      { label: { en: "Skill Damage Resistance", pt: "Resistência a Dano de Habilidade" }, value: "36" },
    ],
    description: { en: "Skill Damage Resistance Intensity", pt: "Intensidade de Resistência a Dano de Habilidade" },
  },
  {
    id: "Staff_Rare_DefenseTactic_09",
    name: { en: "Endurance Expertise", pt: "Especialização em Tolerância" },
    weapon: "Staff",
    category: { en: "", pt: "" },
    grade: "Rare",
    stats: [
      { label: { en: "Max Mana", pt: "Mana Máxima" }, value: "192" },
      { label: { en: "Magic Endurance", pt: "Tolerância Mágica" }, value: "24" },
      { label: { en: "Melee Endurance", pt: "Tolerância Corpo a Corpo" }, value: "24" },
      { label: { en: "Ranged Endurance", pt: "Tolerância à Distância" }, value: "24" },
    ],
    description: { en: "Increases Magic, Melee, and Ranged Endurance and Max Mana.", pt: "Aumenta a Tolerância à Distância, Corpo a Corpo e Mágica e a Mana Máxima." },
  },
  {
    id: "Staff_Rare_Def_Skill",
    name: { en: "Mana Overflow", pt: "Mana Abundante" },
    weapon: "Staff",
    category: { en: "Defense", pt: "Defesa" },
    grade: "Rare",
    stats: [

    ],
    description: { en: "", pt: "" },
  },
  {
    id: "Staff_Rare_Tac_Skill",
    name: { en: "Heat Fusion", pt: "Fusão Térmica" },
    weapon: "Staff",
    category: { en: "", pt: "" },
    grade: "Rare",
    stats: [

    ],
    description: { en: "", pt: "" },
  },
  {
    id: "Staff_Rare_Tactic_10",
    name: { en: "Greater Damage Over Time Augment", pt: "Aumento Superior de Dano Contínuo" },
    weapon: "Staff",
    category: { en: "", pt: "" },
    grade: "Rare",
    stats: [

    ],
    description: { en: "Greater Damage Over Time Augment", pt: "Aumento Superior de Dano Contínuo" },
  },
  {
    id: "Staff_Rare_Tactic_11",
    name: { en: "Attack Range Intensity", pt: "Intensidade de Alcance de Ataque" },
    weapon: "Staff",
    category: { en: "", pt: "" },
    grade: "Rare",
    stats: [
      { label: { en: "Range", pt: "Alcance" }, value: "7.2%" },
      { label: { en: "Healing Received", pt: "Cura Recebida" }, value: "-3%" },
    ],
    description: { en: "Increases Attack Range, but decreases Healing Received.", pt: "Intensidade de Alcance de Ataque" },
  },
  {
    id: "Staff_Rare_TacticAttack_12",
    name: { en: "Critical Hit Expertise", pt: "Especialização em Acerto Crítico" },
    weapon: "Staff",
    category: { en: "", pt: "" },
    grade: "Rare",
    stats: [
      { label: { en: "Stamina Regen", pt: "Regeneração de Vigor" }, value: "2.4" },
      { label: { en: "Magic Critical Hit Chance", pt: "Chance de Acerto Crítico Mágico" }, value: "19.2" },
      { label: { en: "Melee Critical Hit Chance", pt: "Chance de Acerto Crítico Corpo a Corpo" }, value: "19.2" },
      { label: { en: "Ranged Critical Hit Chance", pt: "Chance de Acerto Crítico à Distância" }, value: "19.2" },
    ],
    description: { en: "Increases Magic, Melee, and Ranged Critical Hit Chance, and Stamina Regen.", pt: "Especialização em Acerto Crítico" },
  },
  {
    id: "Staff_Rare_Util_04",
    name: { en: "Greater Cooldown Speed Augment", pt: "" },
    weapon: "Staff",
    category: { en: "Utility", pt: "" },
    grade: "Rare",
    stats: [
      { label: { en: "Cooldown Speed", pt: "Cooldown Speed" }, value: "2.4%" },
    ],
    description: { en: "", pt: "" },
  },
  {
    id: "Staff_Rare_Util_05",
    name: { en: "Mana Efficiency Intensity", pt: "Intensidade de Eficiência de Mana" },
    weapon: "Staff",
    category: { en: "Utility", pt: "Utilidade" },
    grade: "Rare",
    stats: [
      { label: { en: "Mana Cost Efficiency", pt: "Eficiência do Custo de Mana" }, value: "7.2%" },
      { label: { en: "Buff Duration", pt: "Duração da Vantagem" }, value: "-1.8%" },
    ],
    description: { en: "Increases Mana Cost Efficiency, but decreases Buff Duration.", pt: "Intensidade de Eficiência de Mana" },
  },
  {
    id: "Staff_Rare_UtilDefense_06",
    name: { en: "Damage Reduction Expertise", pt: "Especialização em Redução de Dano" },
    weapon: "Staff",
    category: { en: "", pt: "" },
    grade: "Rare",
    stats: [
      { label: { en: "Damage Reduction", pt: "Redução de Dano" }, value: "10" },
      { label: { en: "Silence Resistance", pt: "Resistência a Silêncio" }, value: "30" },
    ],
    description: { en: "Increases Damage Reduction and Silence Resistance.", pt: "Especialização em Redução de Dano" },
  },
  {
    id: "Staff_Rare_Util_Skill",
    name: { en: "Manaball Salvo", pt: "Rajada de Esferas de Mana" },
    weapon: "Staff",
    category: { en: "Utility", pt: "Utilidade" },
    grade: "Rare",
    stats: [

    ],
    description: { en: "", pt: "" },
  },
  {
    id: "Sword2h_Hero_Attack_01",
    name: { en: "Critical Equilibrium", pt: "Equilíbrio Crítico" },
    weapon: "Greatsword",
    category: { en: "Attack", pt: "Ataque" },
    grade: "Epic",
    stats: [

    ],
    description: { en: "Critical Damage increases by 12% when your Health is 50% or higher. However, Critical Damage Resistance increases by 12% when your Health is below 50%.", pt: "Dano Crítico aumenta em 12% quando a Vida do usuário estiver em 50% ou mais. No entanto, a Resistência a Dano Crítico aumenta em 12% quando a Vida do usuário estiver abaixo de 50%" },
  },
  {
    id: "Sword2h_Hero_Defense_03",
    name: { en: "Blade Harvest", pt: "Ceifada da Lâmina" },
    weapon: "Greatsword",
    category: { en: "Defense", pt: "Defesa" },
    grade: "Epic",
    stats: [

    ],
    description: { en: "Restores 10% of damage dealt as Health for 3s after using Movement skills with a Greatsword. Has a 10-sec cooldown.", pt: "Restaura 10% do dano causado como Vida por 3s após usar Habilidades de Movimento com um Montante. Tem uma recarga de 10s" },
  },
  {
    id: "Sword2h_Hero_Tactic_04",
    name: { en: "Perception Balance", pt: "Equilíbrio da Percepção" },
    weapon: "Greatsword",
    category: { en: "", pt: "" },
    grade: "Epic",
    stats: [

    ],
    description: { en: "Stun and Collision Hit Chance increase by 200 when the user's Perception is 70 or higher. However, Stun and Collision Resistance increase by 200 when the user's Perception is below 70.", pt: "A Chance de Acerto de Atordoamento e Colisão aumenta em 200 quando a Percepção do usuário for de 70 ou mais. No entanto, a Resistência a Atordoamento e Colisão aumenta em 200 quando a Percepção do usuário estiver abaixo de 70" },
  },
  {
    id: "Sword2h_Hero_Util_02",
    name: { en: "Unstoppable Rush", pt: "Investida Imparável" },
    weapon: "Greatsword",
    category: { en: "Utility", pt: "Utilidade" },
    grade: "Epic",
    stats: [

    ],
    description: { en: "Increases Collision and Stun Resistance by 600 while using Greatsword Charge skills.", pt: "Aumenta a Resistência a Atordoamento e Colisão em 600 ao usar Habilidades Carregáveis de Montante" },
  },
  {
    id: "Sword2h_High_Attack_01",
    name: { en: "Melee Critical Hit Augment", pt: "Aumento de Acerto Crítico Corpo a Corpo" },
    weapon: "Greatsword",
    category: { en: "Attack", pt: "Ataque" },
    grade: "Uncommon",
    stats: [
      { label: { en: "Melee Critical Hit Chance", pt: "Chance de Acerto Crítico Corpo a Corpo" }, value: "40" },
    ],
    description: { en: "Increases Melee Critical Hit Chance.", pt: "Aumento de Acerto Crítico Corpo a Corpo" },
  },
  {
    id: "Sword2h_High_Attack_02",
    name: { en: "Melee Damage Intensity", pt: "Intensidade de Dano Corpo a Corpo" },
    weapon: "Greatsword",
    category: { en: "Attack", pt: "Ataque" },
    grade: "Uncommon",
    stats: [
      { label: { en: "Melee Defense", pt: "Defesa Corpo a Corpo" }, value: "-60" },
      { label: { en: "Melee Damage Boost", pt: "Ampliação de Dano Corpo a Corpo" }, value: "3%" },
    ],
    description: { en: "Increases Greatsword Melee Damage, but decreases Melee Defense.", pt: "Intensidade de Dano Corpo a Corpo" },
  },
  {
    id: "Sword2h_High_Attack_Skill",
    name: { en: "Reckless Assault", pt: "Ataque Imprudente" },
    weapon: "Greatsword",
    category: { en: "Attack", pt: "Ataque" },
    grade: "Uncommon",
    stats: [

    ],
    description: { en: "", pt: "" },
  },
  {
    id: "Sword2h_High_AttackUtil_03",
    name: { en: "Melee Heavy Attack Expertise", pt: "Especialização em Ataque Pesado Corpo a Corpo" },
    weapon: "Greatsword",
    category: { en: "", pt: "" },
    grade: "Uncommon",
    stats: [
      { label: { en: "Melee Heavy Attack Chance", pt: "Chance de Ataque Pesado Corpo a Corpo" }, value: "20" },
      { label: { en: "Buff Duration", pt: "Duração da Vantagem" }, value: "1.3%" },
    ],
    description: { en: "Increases Melee Heavy Attack Chance and Buff Duration.", pt: "Especialização em Ataque Pesado Corpo a Corpo" },
  },
  {
    id: "Sword2h_High_Defense_07",
    name: { en: "Healing Received Augment", pt: "Aumento de Cura Recebida" },
    weapon: "Greatsword",
    category: { en: "Defense", pt: "Defesa" },
    grade: "Uncommon",
    stats: [
      { label: { en: "Healing Received", pt: "Cura Recebida" }, value: "3.3%" },
    ],
    description: { en: "", pt: "" },
  },
  {
    id: "Sword2h_High_Defense_08",
    name: { en: "Damage Reduction Intensity", pt: "Intensidade de Redução de Dano" },
    weapon: "Greatsword",
    category: { en: "Defense", pt: "Defesa" },
    grade: "Uncommon",
    stats: [
      { label: { en: "Damage Reduction", pt: "Redução de Dano" }, value: "24" },
      { label: { en: "Range", pt: "Alcance" }, value: "-2.6%" },
    ],
    description: { en: "Increases Damage Reduction, but decreases Attack Range.", pt: "Aumenta a Redução de Dano, mas reduz o Alcance de Ataque" },
  },
  {
    id: "Sword2h_High_DefenseTactic_09",
    name: { en: "Max Health Expertise", pt: "Especialização em Vida Máxima" },
    weapon: "Greatsword",
    category: { en: "", pt: "" },
    grade: "Uncommon",
    stats: [
      { label: { en: "Max Health", pt: "Vida Máxima" }, value: "160" },
      { label: { en: "Max Stamina", pt: "Vigor Máximo" }, value: "4" },
    ],
    description: { en: "Increases Max Stamina and Max Health. Max Stamina increases from Lv. 3.", pt: "Aumenta o Vigor Máximo e a Vida Máxima. Aumenta o Vigor Máximo a partir do Nv.3" },
  },
  {
    id: "Sword2h_High_Def_Skill",
    name: { en: "Vital Conversion", pt: "Conversão Vital" },
    weapon: "Greatsword",
    category: { en: "Defense", pt: "Defesa" },
    grade: "Uncommon",
    stats: [

    ],
    description: { en: "", pt: "" },
  },
  {
    id: "Sword2h_High_Tac_Skill",
    name: { en: "Binding Warrior", pt: "Combatente Imobilizador" },
    weapon: "Greatsword",
    category: { en: "", pt: "" },
    grade: "Uncommon",
    stats: [

    ],
    description: { en: "", pt: "" },
  },
  {
    id: "Sword2h_High_Tactic_10",
    name: { en: "Stun Duration Augment", pt: "Aumento da Duração do Atordoamento" },
    weapon: "Greatsword",
    category: { en: "", pt: "" },
    grade: "Uncommon",
    stats: [

    ],
    description: { en: "Increases Stun Duration by 0.4s.", pt: "Aumento da Duração do Atordoamento" },
  },
  {
    id: "Sword2h_High_Tactic_11",
    name: { en: "Collision Resistance Intensity", pt: "Intensidade de Resistência a Colisão" },
    weapon: "Greatsword",
    category: { en: "", pt: "" },
    grade: "Uncommon",
    stats: [
      { label: { en: "Collision Resistance", pt: "Resistência a Colisão" }, value: "75" },
      { label: { en: "Potion Healing", pt: "Cura de Poção" }, value: "-15%" },
    ],
    description: { en: "Increases Collision Resistance, but decreases Potion Healing.", pt: "Intensidade de Resistência a Colisão" },
  },
  {
    id: "Sword2h_High_Util_04",
    name: { en: "Health Regen Augment", pt: "Aumento de Regeneração de Vida" },
    weapon: "Greatsword",
    category: { en: "Utility", pt: "Utilidade" },
    grade: "Uncommon",
    stats: [
      { label: { en: "Health Regen", pt: "Regeneração de Vida" }, value: "40" },
    ],
    description: { en: "", pt: "" },
  },
  {
    id: "Sword2h_High_Util_05",
    name: { en: "Buff Duration Intensity", pt: "Intensidade de Duração da Vantagem" },
    weapon: "Greatsword",
    category: { en: "Utility", pt: "Utilidade" },
    grade: "Uncommon",
    stats: [
      { label: { en: "Weaken Chance", pt: "Chance de Fraqueza" }, value: "-37.5" },
      { label: { en: "Debuff Duration", pt: "Duração da Desvantagem" }, value: "-3%" },
    ],
    description: { en: "Increases Debuff Duration, but decreases Weaken Chance.", pt: "Intensidade de Duração da Vantagem" },
  },
  {
    id: "Sword2h_High_UtilDefense_06",
    name: { en: "CC Resistance Expertise", pt: "Especialização em Resistência a CM" },
    weapon: "Greatsword",
    category: { en: "", pt: "" },
    grade: "Uncommon",
    stats: [
      { label: { en: "Ranged Defense", pt: "Defesa à Distância" }, value: "40" },
      { label: { en: "Bind Resistance", pt: "Resistência a Imobilização" }, value: "16.75" },
      { label: { en: "Stun Resistance", pt: "Resistência a Atordoamento" }, value: "16.75" },
      { label: { en: "Fear Resistance", pt: "Resistência a Medo" }, value: "16.75" },
      { label: { en: "Sleep Resistance", pt: "Resistência a Sono" }, value: "16.75" },
      { label: { en: "Weaken Resistance", pt: "Resistência a Fraqueza" }, value: "16.75" },
      { label: { en: "Silence Resistance", pt: "Resistência a Silêncio" }, value: "16.75" },
      { label: { en: "Collision Resistance", pt: "Resistência a Colisão" }, value: "16.75" },
      { label: { en: "Petrification Resistance", pt: "Resistência a Petrificação" }, value: "16.75" },
    ],
    description: { en: "Increases CC Resistance and Ranged Defense.", pt: "Especialização em Resistência a CM" },
  },
  {
    id: "Sword2h_High_Util_Skill",
    name: { en: "Dauntless Recovery", pt: "Recuperação Destemida" },
    weapon: "Greatsword",
    category: { en: "Utility", pt: "Utilidade" },
    grade: "Uncommon",
    stats: [

    ],
    description: { en: "", pt: "" },
  },
  {
    id: "Sword2h_Normal_Attack_01",
    name: { en: "Lesser Greatsword Max Damage Augment", pt: "Aumento Inferior de Dano Máximo com Montante" },
    weapon: "Greatsword",
    category: { en: "Attack", pt: "Ataque" },
    grade: "Common",
    stats: [
      { label: { en: "Max Damage", pt: "Dano Máx." }, value: "10" },
    ],
    description: { en: "Lesser Greatsword Max Damage Augment", pt: "Aumento Inferior de Dano Máximo com Montante" },
  },
  {
    id: "Sword2h_Normal_Attack_02",
    name: { en: "Melee Critical Hit Intensity", pt: "Intensidade do Acerto Crítico Corpo a Corpo" },
    weapon: "Greatsword",
    category: { en: "Attack", pt: "Ataque" },
    grade: "Common",
    stats: [
      { label: { en: "Melee Critical Hit Chance", pt: "Chance de Acerto Crítico Corpo a Corpo" }, value: "48" },
      { label: { en: "Magic Endurance", pt: "Tolerância Mágica" }, value: "-36" },
    ],
    description: { en: "Increases Melee Critical Hit Chance, but decreases Magic Endurance.", pt: "Intensidade do Acerto Crítico Corpo a Corpo" },
  },
  {
    id: "Sword2h_Normal_Attack_Skill",
    name: { en: "Power Grip", pt: "Apreensão Poderosa" },
    weapon: "Greatsword",
    category: { en: "Attack", pt: "Ataque" },
    grade: "Common",
    stats: [

    ],
    description: { en: "", pt: "" },
  },
  {
    id: "Sword2h_Normal_AttackUtil_03",
    name: { en: "Melee Hit Expertise", pt: "Especialização em Acerto Corpo a Corpo" },
    weapon: "Greatsword",
    category: { en: "", pt: "" },
    grade: "Common",
    stats: [
      { label: { en: "Stamina Regen", pt: "Regeneração de Vigor" }, value: "1.6" },
      { label: { en: "Melee Hit Chance", pt: "Chance de Acerto Corpo a Corpo" }, value: "16" },
    ],
    description: { en: "Increases Melee Hit Chance and Stamina Regen.", pt: "Especialização em Acerto Corpo a Corpo" },
  },
  {
    id: "Sword2h_Normal_Defense_07",
    name: { en: "Lesser Melee Defense Augment", pt: "Aumento Inferior de Defesa Corpo a Corpo" },
    weapon: "Greatsword",
    category: { en: "Defense", pt: "Defesa" },
    grade: "Common",
    stats: [
      { label: { en: "Melee Defense", pt: "Defesa Corpo a Corpo" }, value: "64" },
    ],
    description: { en: "", pt: "Aumento Inferior de Defesa Corpo a Corpo" },
  },
  {
    id: "Sword2h_Normal_Defense_08",
    name: { en: "Damage Resistance Intensity", pt: "Intensidade de Resistência a Dano" },
    weapon: "Greatsword",
    category: { en: "Defense", pt: "Defesa" },
    grade: "Common",
    stats: [
      { label: { en: "Melee Critical Hit Chance", pt: "Chance de Acerto Crítico Corpo a Corpo" }, value: "-24" },
      { label: { en: "Skill Damage Resistance", pt: "Resistência a Dano de Habilidade" }, value: "24" },
    ],
    description: { en: "Increases Skill Damage Resistance, but decreases Melee Critical Hit Chance.", pt: "Intensidade de Resistência a Dano" },
  },
  {
    id: "Sword2h_Normal_DefenseTactic_09",
    name: { en: "Collision Resistance Expertise", pt: "Especialização em Resistência a Colisão" },
    weapon: "Greatsword",
    category: { en: "", pt: "" },
    grade: "Common",
    stats: [
      { label: { en: "Ranged Defense", pt: "Defesa à Distância" }, value: "32" },
      { label: { en: "Collision Resistance", pt: "Resistência a Colisão" }, value: "20" },
    ],
    description: { en: "Increases Collision Resistance and Ranged Defense.", pt: "Especialização em Resistência a Colisão" },
  },
  {
    id: "Sword2h_Normal_Def_Skill",
    name: { en: "Steel Sacrifice", pt: "Sacrifício de Aço" },
    weapon: "Greatsword",
    category: { en: "Defense", pt: "Defesa" },
    grade: "Common",
    stats: [

    ],
    description: { en: "", pt: "" },
  },
  {
    id: "Sword2h_Normal_Tac_Skill",
    name: { en: "Steadfast Rush", pt: "Corrida Inabalável" },
    weapon: "Greatsword",
    category: { en: "", pt: "" },
    grade: "Common",
    stats: [

    ],
    description: { en: "", pt: "" },
  },
  {
    id: "Sword2h_Normal_Tactic_10",
    name: { en: "Lesser Stun Augment", pt: "Aumento Inferior de Atordoamento" },
    weapon: "Greatsword",
    category: { en: "", pt: "" },
    grade: "Common",
    stats: [
      { label: { en: "Stun Chance", pt: "Chance de Atordoamento" }, value: "40" },
    ],
    description: { en: "", pt: "Aumento Inferior de Atordoamento" },
  },
  {
    id: "Sword2h_Normal_Tactic_11",
    name: { en: "Collision Intensity", pt: "Intensidade de Colisão" },
    weapon: "Greatsword",
    category: { en: "", pt: "" },
    grade: "Common",
    stats: [
      { label: { en: "Mana Regen", pt: "Regeneração de Mana" }, value: "-18" },
      { label: { en: "Collision Chance", pt: "Chance de Colisão" }, value: "60" },
    ],
    description: { en: "Increases Collision Chance, but decreases Mana Regen.", pt: "Aumenta a Chance de Colisão, mas reduz a Regeneração de Mana" },
  },
  {
    id: "Sword2h_Normal_TacticAttack_12",
    name: { en: "Collision Chance Offensive", pt: "Ofensiva de Chance de Colisão" },
    weapon: "Greatsword",
    category: { en: "", pt: "" },
    grade: "Common",
    stats: [
      { label: { en: "Melee Hit Chance", pt: "Chance de Acerto Corpo a Corpo" }, value: "16" },
      { label: { en: "Collision Chance", pt: "Chance de Colisão" }, value: "20" },
    ],
    description: { en: "Increases Collision Chance and Melee Hit Chance.", pt: "Aumenta a Chance de Colisão e a Chance de Acerto Corpo a Corpo" },
  },
  {
    id: "Sword2h_Normal_Util_04",
    name: { en: "Lesser Mana Regen Augment", pt: "Aumento Inferior de Regeneração de Mana" },
    weapon: "Greatsword",
    category: { en: "Utility", pt: "Utilidade" },
    grade: "Common",
    stats: [
      { label: { en: "Mana Regen", pt: "Regeneração de Mana" }, value: "24" },
    ],
    description: { en: "", pt: "Aumento Inferior de Regeneração de Mana" },
  },
  {
    id: "Sword2h_Normal_Util_05",
    name: { en: "Cooldown Speed Intensity", pt: "Intensidade de Velocidade de Recarga" },
    weapon: "Greatsword",
    category: { en: "Utility", pt: "Utilidade" },
    grade: "Common",
    stats: [
      { label: { en: "Cooldown Speed", pt: "Velocidade de Recarga" }, value: "2.4%" },
      { label: { en: "Mana Cost Efficiency", pt: "Eficiência do Custo de Mana" }, value: "-2%" },
    ],
    description: { en: "Increases Skill Cooldown Speed, but decreases Mana Cost Efficiency.", pt: "Intensidade de Velocidade de Recarga" },
  },
  {
    id: "Sword2h_Normal_UtilDefense_06",
    name: { en: "Melee Endurance Expertise", pt: "Especialização em Tolerância Corpo a Corpo" },
    weapon: "Greatsword",
    category: { en: "", pt: "" },
    grade: "Common",
    stats: [
      { label: { en: "Mana Regen", pt: "Regeneração de Mana" }, value: "12" },
      { label: { en: "Melee Endurance", pt: "Tolerância Corpo a Corpo" }, value: "24" },
    ],
    description: { en: "Increases Melee Endurance and Mana Regen.", pt: "Especialização em Tolerância Corpo a Corpo" },
  },
  {
    id: "Sword2h_Normal_Util_Skill",
    name: { en: "Force Capacity", pt: "Capacidade de Força" },
    weapon: "Greatsword",
    category: { en: "Utility", pt: "Utilidade" },
    grade: "Common",
    stats: [

    ],
    description: { en: "", pt: "" },
  },
  {
    id: "Sword2h_Rare_Attack_01",
    name: { en: "Greater Melee Hit Augment", pt: "Aumento Superior de Acerto Corpo a Corpo" },
    weapon: "Greatsword",
    category: { en: "Attack", pt: "Ataque" },
    grade: "Rare",
    stats: [
      { label: { en: "Melee Hit Chance", pt: "Chance de Acerto Corpo a Corpo" }, value: "48" },
    ],
    description: { en: "", pt: "Aumento Superior de Acerto Corpo a Corpo" },
  },
  {
    id: "Sword2h_Rare_Attack_02",
    name: { en: "Melee Heavy Attack Intensity", pt: "Intensidade de Ataque Pesado Corpo a Corpo" },
    weapon: "Greatsword",
    category: { en: "Attack", pt: "Ataque" },
    grade: "Rare",
    stats: [
      { label: { en: "Perception", pt: "Percepção" }, value: "2" },
      { label: { en: "Melee Heavy Attack Chance", pt: "Chance de Ataque Pesado Corpo a Corpo" }, value: "72" },
      { label: { en: "Magic Endurance", pt: "Tolerância Mágica" }, value: "-36" },
      { label: { en: "Melee Endurance", pt: "Tolerância Corpo a Corpo" }, value: "-36" },
      { label: { en: "Ranged Endurance", pt: "Tolerância à Distância" }, value: "-36" },
    ],
    description: { en: "Increases Melee Heavy Attack Chance, but decreases Magic, Melee, and Ranged Endurance.", pt: "Intensidade de Ataque Pesado Corpo a Corpo" },
  },
  {
    id: "Sword2h_Rare_Attack_Skill",
    name: { en: "Far Strike", pt: "Golpe Distante" },
    weapon: "Greatsword",
    category: { en: "Attack", pt: "Ataque" },
    grade: "Rare",
    stats: [

    ],
    description: { en: "", pt: "" },
  },
  {
    id: "Sword2h_Rare_AttackUtil_03",
    name: { en: "Heavy Attack Expertise", pt: "Especialização em Ataque Pesado" },
    weapon: "Greatsword",
    category: { en: "", pt: "" },
    grade: "Rare",
    stats: [
      { label: { en: "Magic Heavy Attack Chance", pt: "Chance de Ataque Pesado Mágico" }, value: "19.2" },
      { label: { en: "Melee Heavy Attack Chance", pt: "Chance de Ataque Pesado Corpo a Corpo" }, value: "19.2" },
      { label: { en: "Ranged Heavy Attack Chance", pt: "Chance de Ataque Pesado à Distância" }, value: "19.2" },
      { label: { en: "Mana Cost Efficiency", pt: "Eficiência do Custo de Mana" }, value: "2.4%" },
    ],
    description: { en: "Increases Magic, Melee, and Ranged Heavy Attack, and Mana Cost Efficiency.", pt: "Especialização em Ataque Pesado" },
  },
  {
    id: "Sword2h_Rare_Defense_07",
    name: { en: "Greater Evasion Augment", pt: "Aumento Superior de Esquiva" },
    weapon: "Greatsword",
    category: { en: "Defense", pt: "Defesa" },
    grade: "Rare",
    stats: [
      { label: { en: "Magic Evasion", pt: "Esquiva Mágica" }, value: "48" },
      { label: { en: "Melee Evasion", pt: "Esquiva Corpo a Corpo" }, value: "48" },
      { label: { en: "Ranged Evasion", pt: "Esquiva à Distância" }, value: "48" },
    ],
    description: { en: "Increases Magic, Melee, and Ranged Evasion.", pt: "Aumenta a Esquiva à Distância, Corpo a Corpo e Mágica" },
  },
  {
    id: "Sword2h_Rare_Defense_08",
    name: { en: "Evasion Intensity", pt: "Intensidade de Esquiva" },
    weapon: "Greatsword",
    category: { en: "Defense", pt: "Defesa" },
    grade: "Rare",
    stats: [
      { label: { en: "Max Health", pt: "Vida Máxima" }, value: "2,400" },
      { label: { en: "Melee Hit Chance", pt: "Chance de Acerto Corpo a Corpo" }, value: "-36" },
      { label: { en: "Magic Heavy Attack Evasion", pt: "Esquiva de Ataque Pesado Mágico" }, value: "72" },
      { label: { en: "Melee Heavy Attack Evasion", pt: "Esquiva de Ataque Pesado Corpo a Corpo" }, value: "72" },
      { label: { en: "Ranged Heavy Attack Evasion", pt: "Esquiva de Ataque Pesado à Distância" }, value: "72" },
    ],
    description: { en: "Increases Magic, Melee, and Ranged Heavy Attack Evasion, but decreases Melee Hit Chance.", pt: "Esquiva de Ataque Pesado Mágico" },
  },
  {
    id: "Sword2h_Rare_DefenseTactic_09",
    name: { en: "Bind Resistance Expertise", pt: "Especialização em Resistência a Imobilização" },
    weapon: "Greatsword",
    category: { en: "", pt: "" },
    grade: "Rare",
    stats: [
      { label: { en: "Max Health", pt: "Vida Máxima" }, value: "192" },
      { label: { en: "Bind Resistance", pt: "Resistência a Imobilização" }, value: "30" },
    ],
    description: { en: "Increases Bind Resistance and Max Health.", pt: "Especialização em Resistência a Imobilização" },
  },
  {
    id: "Sword2h_Rare_Def_Skill",
    name: { en: "Fortified Unity", pt: "Unidade Fortificada" },
    weapon: "Greatsword",
    category: { en: "Defense", pt: "Defesa" },
    grade: "Rare",
    stats: [

    ],
    description: { en: "", pt: "" },
  },
  {
    id: "Sword2h_Rare_Tac_Skill",
    name: { en: "Swift Execution", pt: "Execução Ágil" },
    weapon: "Greatsword",
    category: { en: "", pt: "" },
    grade: "Rare",
    stats: [

    ],
    description: { en: "", pt: "" },
  },
  {
    id: "Sword2h_Rare_Tactic_10",
    name: { en: "Greater Stun Augment", pt: "Aumento Superior de Atordoamento" },
    weapon: "Greatsword",
    category: { en: "", pt: "" },
    grade: "Rare",
    stats: [
      { label: { en: "Stun Chance", pt: "Chance de Atordoamento" }, value: "60" },
    ],
    description: { en: "", pt: "Aumento Superior de Atordoamento" },
  },
  {
    id: "Sword2h_Rare_Tactic_11",
    name: { en: "Attack Speed Intensity", pt: "Intensidade de Velocidade de Ataque" },
    weapon: "Greatsword",
    category: { en: "", pt: "" },
    grade: "Rare",
    stats: [
      { label: { en: "Bind Resistance", pt: "Resistência a Imobilização" }, value: "-30" },
      { label: { en: "Stun Resistance", pt: "Resistência a Atordoamento" }, value: "-30" },
      { label: { en: "Fear Resistance", pt: "Resistência a Medo" }, value: "-30" },
      { label: { en: "Sleep Resistance", pt: "Resistência a Sono" }, value: "-30" },
      { label: { en: "Weaken Resistance", pt: "Resistência a Fraqueza" }, value: "-30" },
      { label: { en: "Silence Resistance", pt: "Resistência a Silêncio" }, value: "-30" },
      { label: { en: "Collision Resistance", pt: "Resistência a Colisão" }, value: "-30" },
      { label: { en: "Attack Speed", pt: "Velocidade de Ataque" }, value: "4.8%" },
      { label: { en: "Petrification Resistance", pt: "Resistência a Petrificação" }, value: "-30" },
    ],
    description: { en: "Increases Attack Speed, but decreases CC Resistance.", pt: "Intensidade de Velocidade de Ataque" },
  },
  {
    id: "Sword2h_Rare_TacticAttack_12",
    name: { en: "Damage Increase Expertise", pt: "Especialização em Aumento de Dano" },
    weapon: "Greatsword",
    category: { en: "", pt: "" },
    grade: "Rare",
    stats: [
      { label: { en: "Skill Damage Boost", pt: "Ampliação de Dano de Habilidade" }, value: "12" },
      { label: { en: "Buff Duration", pt: "Duração da Vantagem" }, value: "1.6%" },
    ],
    description: { en: "Increases Skill Damage Boost and Buff Duration.", pt: "Especialização em Aumento de Dano" },
  },
  {
    id: "Sword2h_Rare_Util_04",
    name: { en: "Greater Species Damage Augment", pt: "Aumento Superior de Dano de Espécies" },
    weapon: "Greatsword",
    category: { en: "Utility", pt: "Utilidade" },
    grade: "Rare",
    stats: [
      { label: { en: "Demon Damage Boost", pt: "Ampliação de Dano contra Demônios" }, value: "19.2" },
      { label: { en: "Wildkin Damage Boost", pt: "Ampliação de Dano contra Selvagens" }, value: "19.2" },
      { label: { en: "Undead Damage Boost", pt: "Ampliação de Dano contra Mortos-vivos" }, value: "19.2" },
      { label: { en: "Humanoid Damage Boost", pt: "Ampliação de Dano contra Humanoides" }, value: "19.2" },
      { label: { en: "Construct Damage Boost", pt: "Ampliação de Dano contra Construtos" }, value: "19.2" },
    ],
    description: { en: "Increases all Species Damage Boost.", pt: "Aumento Superior de Dano de Espécies" },
  },
  {
    id: "Sword2h_Rare_Util_05",
    name: { en: "Buff Duration Intensity", pt: "Intensidade de Duração da Vantagem" },
    weapon: "Greatsword",
    category: { en: "Utility", pt: "Utilidade" },
    grade: "Rare",
    stats: [
      { label: { en: "Petrification Resistance", pt: "Resistência a Petrificação" }, value: "-45" },
      { label: { en: "Buff Duration", pt: "Duração da Vantagem" }, value: "4.8%" },
    ],
    description: { en: "Increases Buff Duration, but decreases Petrification Resistance.", pt: "Intensidade de Duração da Vantagem" },
  },
  {
    id: "Sword2h_Rare_UtilDefense_06",
    name: { en: "Ranged Endurance Expertise", pt: "Especialização em Tolerância à Distância" },
    weapon: "Greatsword",
    category: { en: "", pt: "" },
    grade: "Rare",
    stats: [
      { label: { en: "Mana Regen", pt: "Regeneração de Mana" }, value: "18" },
      { label: { en: "Ranged Endurance", pt: "Tolerância à Distância" }, value: "36" },
    ],
    description: { en: "Increases Ranged Endurance and Mana Regen.", pt: "Especialização em Tolerância à Distância" },
  },
  {
    id: "Sword2h_Rare_Util_Skill",
    name: { en: "Extended Reach", pt: "Alcance Estendido" },
    weapon: "Greatsword",
    category: { en: "Utility", pt: "Utilidade" },
    grade: "Rare",
    stats: [

    ],
    description: { en: "", pt: "" },
  },
  {
    id: "Sword_Hero_Attack_01",
    name: { en: "Blade Momentum", pt: "Impulso da Lâmina" },
    weapon: "",
    category: { en: "Attack", pt: "Ataque" },
    grade: "Epic",
    stats: [

    ],
    description: { en: "Using Shield Throw, Whirling Shield, or Annihilating Slash increases Sword Active Skill Damage by 30% and decreases all the caster's Defense by 14% for 6s.", pt: "Usar Arremesso de Escudo, Escudo Giratório ou Corte Aniquilador aumenta o Dano de Habilidade Ativa de Espada em 30% e reduz a Defesa Total do usuário em 14% por 6s" },
  },
  {
    id: "Sword_Hero_Defense_03",
    name: { en: "Life's Bargain", pt: "Barganha da Vida" },
    weapon: "",
    category: { en: "Defense", pt: "Defesa" },
    grade: "Epic",
    stats: [

    ],
    description: { en: "Increases Melee and Ranged Endurance by 2 and decreases Base Damage by 16% per 100 Max Health, up to 40,000.", pt: "Aumenta a Tolerância à Distância e Corpo a Corpo em 2 e reduz o Dano Base em 16, a cada 100 de Vida Máxima, até 40.000" },
  },
  {
    id: "Sword_Hero_Tactic_04",
    name: { en: "Wisdom's Path", pt: "Caminho da Sabedoria" },
    weapon: "",
    category: { en: "", pt: "" },
    grade: "Epic",
    stats: [

    ],
    description: { en: "Healing and Healing Received increase by 10% when the user's Wisdom is 60 or higher. However, Max Mana increases by 1600 instead when the user's Wisdom is below 60.", pt: "Aumenta a Cura e a Cura Recebida em 10% quando a Sabedoria do usuário for de 60 ou mais. No entanto, a Mana Máxima aumenta em 1600 quando a Sabedoria do usuário estiver abaixo de 60" },
  },
  {
    id: "Sword_High_Attack_01",
    name: { en: "Melee Critical Hit Augment", pt: "Aumento de Acerto Crítico Corpo a Corpo" },
    weapon: "",
    category: { en: "Attack", pt: "Ataque" },
    grade: "Uncommon",
    stats: [
      { label: { en: "Melee Critical Hit Chance", pt: "Chance de Acerto Crítico Corpo a Corpo" }, value: "40" },
    ],
    description: { en: "Increases Melee Critical Hit Chance.", pt: "Aumento de Acerto Crítico Corpo a Corpo" },
  },
  {
    id: "Sword_High_Attack_02",
    name: { en: "Melee Hit Intensity", pt: "Intensidade de Acerto Corpo a Corpo" },
    weapon: "",
    category: { en: "Attack", pt: "Ataque" },
    grade: "Uncommon",
    stats: [
      { label: { en: "Ranged Defense", pt: "Defesa à Distância" }, value: "-60" },
      { label: { en: "Melee Hit Chance", pt: "Chance de Acerto Corpo a Corpo" }, value: "60" },
    ],
    description: { en: "Increases Melee Hit Chance, and decreases Ranged Defense.", pt: "Intensidade de Acerto Corpo a Corpo" },
  },
  {
    id: "Sword_High_Attack_Skill",
    name: { en: "Power Breach", pt: "Violação de Poder" },
    weapon: "",
    category: { en: "Attack", pt: "Ataque" },
    grade: "Uncommon",
    stats: [

    ],
    description: { en: "", pt: "" },
  },
  {
    id: "Sword_High_AttackUtil_03",
    name: { en: "Max Damage Expertise", pt: "Especialista em Dano Máximo" },
    weapon: "",
    category: { en: "", pt: "" },
    grade: "Uncommon",
    stats: [
      { label: { en: "Max Mana", pt: "Mana Máxima" }, value: "160" },
      { label: { en: "Max Damage", pt: "Dano Máx." }, value: "3" },
    ],
    description: { en: "Increases Max Mana and Max Damage. Max Damage increases from Lv. 4.", pt: "Aumenta a Mana Máxima e o Dano Máximo. Aumenta o Dano Máximo a partir do Nv.4" },
  },
  {
    id: "Sword_High_Defense_07",
    name: { en: "Evasion Augment", pt: "Aumento de Esquiva" },
    weapon: "",
    category: { en: "Defense", pt: "Defesa" },
    grade: "Uncommon",
    stats: [
      { label: { en: "Magic Evasion", pt: "Esquiva Mágica" }, value: "40" },
      { label: { en: "Melee Evasion", pt: "Esquiva Corpo a Corpo" }, value: "40" },
      { label: { en: "Ranged Evasion", pt: "Esquiva à Distância" }, value: "40" },
    ],
    description: { en: "Increases Magic, Melee, and Ranged Evasion.", pt: "Aumenta a Esquiva à Distância, Corpo a Corpo e Mágica" },
  },
  {
    id: "Sword_High_Defense_08",
    name: { en: "Shield Block Intensity", pt: "Intensidade do Bloqueio de Escudo" },
    weapon: "",
    category: { en: "Defense", pt: "Defesa" },
    grade: "Uncommon",
    stats: [
      { label: { en: "Melee Hit Chance", pt: "Chance de Acerto Corpo a Corpo" }, value: "-30" },
      { label: { en: "Shield Block Chance", pt: "Chance de Bloqueio do Escudo" }, value: "8.1%" },
    ],
    description: { en: "Increases Shield Block Chance, but decreases Melee Hit Chance.", pt: "Intensidade do Bloqueio de Escudo" },
  },
  {
    id: "Sword_High_DefenseTactic_09",
    name: { en: "Damage Reduction Expertise", pt: "Especialização em Redução de Dano" },
    weapon: "",
    category: { en: "", pt: "" },
    grade: "Uncommon",
    stats: [
      { label: { en: "Damage Reduction", pt: "Redução de Dano" }, value: "8" },
      { label: { en: "Movement Speed", pt: "Velocidade de Movimento" }, value: "1.3%" },
    ],
    description: { en: "Increases Movement Speed and Damage Reduction.", pt: "Especialização em Redução de Dano" },
  },
  {
    id: "Sword_High_Def_Skill",
    name: { en: "Unyielding Aegis", pt: "Égide Implacável" },
    weapon: "",
    category: { en: "Defense", pt: "Defesa" },
    grade: "Uncommon",
    stats: [

    ],
    description: { en: "", pt: "" },
  },
  {
    id: "Sword_High_Tac_Skill",
    name: { en: "Bulwark Stance", pt: "Postura de Defesa" },
    weapon: "",
    category: { en: "", pt: "" },
    grade: "Uncommon",
    stats: [

    ],
    description: { en: "", pt: "" },
  },
  {
    id: "Sword_High_Tactic_10",
    name: { en: "Collision Resistance Augment", pt: "Aumento de Resistência a Colisão" },
    weapon: "",
    category: { en: "", pt: "" },
    grade: "Uncommon",
    stats: [
      { label: { en: "Collision Resistance", pt: "Resistência a Colisão" }, value: "50" },
    ],
    description: { en: "Increases Collision Resistance.", pt: "Aumento de Resistência a Colisão" },
  },
  {
    id: "Sword_High_Tactic_11",
    name: { en: "Boss Defense Intensity", pt: "Intensidade de Defesa Contra Chefes" },
    weapon: "",
    category: { en: "", pt: "" },
    grade: "Uncommon",
    stats: [
      { label: { en: "Stamina Regen", pt: "Regeneração de Vigor" }, value: "-3" },
      { label: { en: "Boss Damage Reduction", pt: "Redução de Dano de Chefes" }, value: "48" },
    ],
    description: { en: "Increases Boss Damage Reduction, but decreases Stamina Regen.", pt: "Intensidade de Defesa Contra Chefes" },
  },
  {
    id: "Sword_High_TacticAttack_12",
    name: { en: "Weaken and Damage Expertise", pt: "Especialização em Fraqueza e Dano" },
    weapon: "",
    category: { en: "", pt: "" },
    grade: "Uncommon",
    stats: [
      { label: { en: "Weaken Chance", pt: "Chance de Fraqueza" }, value: "25" },
      { label: { en: "Max Damage", pt: "Dano Máx." }, value: "3" },
    ],
    description: { en: "Increases Weaken Chance and Max Damage. Max Damage increases from Lv. 4.", pt: "Especialização em Fraqueza e Dano" },
  },
  {
    id: "Sword_High_Util_04",
    name: { en: "Mana Regen Augment", pt: "Aumento de Regeneração de Mana" },
    weapon: "",
    category: { en: "Utility", pt: "Utilidade" },
    grade: "Uncommon",
    stats: [
      { label: { en: "Mana Regen", pt: "Regeneração de Mana" }, value: "30" },
    ],
    description: { en: "", pt: "" },
  },
  {
    id: "Sword_High_Util_05",
    name: { en: "Healing Received Intensity", pt: "Intensidade de Cura Recebida" },
    weapon: "",
    category: { en: "Utility", pt: "Utilidade" },
    grade: "Uncommon",
    stats: [
      { label: { en: "Movement Speed", pt: "Velocidade de Movimento" }, value: "-1.7%" },
      { label: { en: "Healing Received", pt: "Cura Recebida" }, value: "5%" },
    ],
    description: { en: "Increases Healing Received, but decreases Movement Speed.", pt: "Aumenta a Cura Recebida, mas reduz a Velocidade de Movimento" },
  },
  {
    id: "Sword_High_UtilDefense_06",
    name: { en: "Mana Cost Efficiency Expertise", pt: "Especialização em Eficiência do Custo de Mana" },
    weapon: "",
    category: { en: "", pt: "" },
    grade: "Uncommon",
    stats: [
      { label: { en: "Mana Cost Efficiency", pt: "Eficiência do Custo de Mana" }, value: "2%" },
      { label: { en: "Debuff Duration", pt: "Duração da Desvantagem" }, value: "-1%" },
    ],
    description: { en: "Increases Mana Cost Efficiency and decreases Debuff Duration.", pt: "Especialização em Eficiência do Custo de Mana" },
  },
  {
    id: "Sword_High_Util_Skill",
    name: { en: "Stamina Renewal", pt: "Restauração de Vigor" },
    weapon: "",
    category: { en: "Utility", pt: "Utilidade" },
    grade: "Uncommon",
    stats: [

    ],
    description: { en: "", pt: "" },
  },
  {
    id: "Sword_Normal_Attack_01",
    name: { en: "Lesser Melee Hit Augment", pt: "Aumento Inferior de Acerto Corpo a Corpo" },
    weapon: "",
    category: { en: "Attack", pt: "Ataque" },
    grade: "Common",
    stats: [
      { label: { en: "Melee Hit Chance", pt: "Chance de Acerto Corpo a Corpo" }, value: "32" },
    ],
    description: { en: "", pt: "Aumento Inferior de Acerto Corpo a Corpo" },
  },
  {
    id: "Sword_Normal_Attack_02",
    name: { en: "Melee Critical Hit Intensity", pt: "Intensidade do Acerto Crítico Corpo a Corpo" },
    weapon: "",
    category: { en: "Attack", pt: "Ataque" },
    grade: "Common",
    stats: [
      { label: { en: "Magic Defense", pt: "Defesa Mágica" }, value: "-48" },
      { label: { en: "Melee Critical Hit Chance", pt: "Chance de Acerto Crítico Corpo a Corpo" }, value: "48" },
    ],
    description: { en: "Increases Melee Critical Hit Chance, but decreases Magic Defense.", pt: "Intensidade do Acerto Crítico Corpo a Corpo" },
  },
  {
    id: "Sword_Normal_Attack_Skill",
    name: { en: "Roar Amplifier", pt: "Amplificador de Rugido" },
    weapon: "",
    category: { en: "Attack", pt: "Ataque" },
    grade: "Common",
    stats: [

    ],
    description: { en: "", pt: "" },
  },
  {
    id: "Sword_Normal_AttackUtil_03",
    name: { en: "Base Damage Expertise", pt: "Especialização em Dano Base" },
    weapon: "",
    category: { en: "", pt: "" },
    grade: "Common",
    stats: [
      { label: { en: "Mana Regen", pt: "Regeneração de Mana" }, value: "12" },
      { label: { en: "Base Damage", pt: "Dano Base" }, value: "2" },
    ],
    description: { en: "Increases Mana Regen and Base Damage. Base Damage increases from Lv. 5.", pt: "Aumenta a Regeneração de Mana e o Dano Base. Aumenta o Dano Base a partir do Nv.5" },
  },
  {
    id: "Sword_Normal_Defense_07",
    name: { en: "Lesser Melee Defense Augment", pt: "Aumento Inferior de Defesa Corpo a Corpo" },
    weapon: "",
    category: { en: "Defense", pt: "Defesa" },
    grade: "Common",
    stats: [
      { label: { en: "Melee Defense", pt: "Defesa Corpo a Corpo" }, value: "64" },
    ],
    description: { en: "", pt: "Aumento Inferior de Defesa Corpo a Corpo" },
  },
  {
    id: "Sword_Normal_Defense_08",
    name: { en: "Max Health Intensity", pt: "Intensidade de Vida Máxima" },
    weapon: "",
    category: { en: "Defense", pt: "Defesa" },
    grade: "Common",
    stats: [
      { label: { en: "Max Health", pt: "Vida Máxima" }, value: "384" },
      { label: { en: "Melee Critical Hit Chance", pt: "Chance de Acerto Crítico Corpo a Corpo" }, value: "-24" },
    ],
    description: { en: "Increases Max Health, but decreases Melee Critical Hit Chance.", pt: "Chance de Acerto Crítico Corpo a Corpo" },
  },
  {
    id: "Sword_Normal_DefenseTactic_09",
    name: { en: "Ranged Endurance Expertise", pt: "Especialização em Tolerância à Distância" },
    weapon: "",
    category: { en: "", pt: "" },
    grade: "Common",
    stats: [
      { label: { en: "Shield Block Chance", pt: "Chance de Bloqueio do Escudo" }, value: "2.2%" },
      { label: { en: "Ranged Endurance", pt: "Tolerância à Distância" }, value: "24" },
    ],
    description: { en: "Increases Ranged Endurance and Shield Block Chance.", pt: "Especialização em Tolerância à Distância" },
  },
  {
    id: "Sword_Normal_Def_Skill",
    name: { en: "Strategic Retreat", pt: "Retirada Estratégica" },
    weapon: "",
    category: { en: "Defense", pt: "Defesa" },
    grade: "Common",
    stats: [

    ],
    description: { en: "", pt: "" },
  },
  {
    id: "Sword_Normal_Tac_Skill",
    name: { en: "Gerad's Precision", pt: "Precisão de Gerad" },
    weapon: "",
    category: { en: "", pt: "" },
    grade: "Common",
    stats: [

    ],
    description: { en: "", pt: "" },
  },
  {
    id: "Sword_Normal_Tactic_10",
    name: { en: "Lesser Collision Augment", pt: "Aumento Inferior de Colisão" },
    weapon: "",
    category: { en: "", pt: "" },
    grade: "Common",
    stats: [
      { label: { en: "Collision Chance", pt: "Chance de Colisão" }, value: "40" },
    ],
    description: { en: "", pt: "" },
  },
  {
    id: "Sword_Normal_Tactic_11",
    name: { en: "Max Stamina Intensity", pt: "Intensidade de Vigor Máximo" },
    weapon: "",
    category: { en: "", pt: "" },
    grade: "Common",
    stats: [
      { label: { en: "Health Regen", pt: "Regeneração de Vida" }, value: "-24" },
      { label: { en: "Max Stamina", pt: "Vigor Máximo" }, value: "10" },
    ],
    description: { en: "Increases Max Stamina, but decreases Health Regen.", pt: "Aumenta o Vigor Máximo, mas reduz a Regeneração de Vida" },
  },
  {
    id: "Sword_Normal_TacticAttack_12",
    name: { en: "Weaken and Range Expertise", pt: "Especialização em Fraqueza e Alcance" },
    weapon: "",
    category: { en: "", pt: "" },
    grade: "Common",
    stats: [
      { label: { en: "Weaken Chance", pt: "Chance de Fraqueza" }, value: "20" },
      { label: { en: "Range", pt: "Alcance" }, value: "1.6%" },
    ],
    description: { en: "Increases Weaken Chance and Attack Range.", pt: "Especialização em Fraqueza e Alcance" },
  },
  {
    id: "Sword_Normal_Util_04",
    name: { en: "Lesser Health Regen Augment", pt: "Aumento Inferior de Regeneração de Vida" },
    weapon: "",
    category: { en: "Utility", pt: "Utilidade" },
    grade: "Common",
    stats: [
      { label: { en: "Health Regen", pt: "Regeneração de Vida" }, value: "32" },
    ],
    description: { en: "", pt: "Aumento Inferior de Regeneração de Vida" },
  },
  {
    id: "Sword_Normal_Util_05",
    name: { en: "Cooldown Speed Intensity", pt: "Intensidade de Velocidade de Recarga" },
    weapon: "",
    category: { en: "Utility", pt: "Utilidade" },
    grade: "Common",
    stats: [
      { label: { en: "Bind Resistance", pt: "Resistência a Imobilização" }, value: "-30" },
      { label: { en: "Cooldown Speed", pt: "Velocidade de Recarga" }, value: "2.4%" },
    ],
    description: { en: "Increases Cooldown Speed, but decreases Bind Resistance.", pt: "Intensidade de Velocidade de Recarga" },
  },
  {
    id: "Sword_Normal_UtilDefense_06",
    name: { en: "Damage Reduction Expertise", pt: "Especialização em Redução de Dano" },
    weapon: "",
    category: { en: "", pt: "" },
    grade: "Common",
    stats: [
      { label: { en: "Damage Reduction", pt: "Redução de Dano" }, value: "6" },
      { label: { en: "Amitoi Healing", pt: "Cura do Amitoi" }, value: "16%" },
    ],
    description: { en: "Increases Amitoi Healing and Damage Reduction.", pt: "Especialização em Redução de Dano" },
  },
  {
    id: "Sword_Normal_Util_Skill",
    name: { en: "Gerad's Resilience", pt: "Resiliência de Gerad" },
    weapon: "",
    category: { en: "Utility", pt: "Utilidade" },
    grade: "Common",
    stats: [

    ],
    description: { en: "", pt: "" },
  },
  {
    id: "Sword_Rare_Attack_01",
    name: { en: "Greater Heavy Attack Augment", pt: "Aumento Superior de Ataque Pesado" },
    weapon: "",
    category: { en: "Attack", pt: "Ataque" },
    grade: "Rare",
    stats: [
      { label: { en: "Magic Heavy Attack Chance", pt: "Chance de Ataque Pesado Mágico" }, value: "38.4" },
      { label: { en: "Melee Heavy Attack Chance", pt: "Chance de Ataque Pesado Corpo a Corpo" }, value: "38.4" },
      { label: { en: "Ranged Heavy Attack Chance", pt: "Chance de Ataque Pesado à Distância" }, value: "38.4" },
    ],
    description: { en: "Increases Magic, Melee, and Ranged Heavy Attack Chance.", pt: "Aumento Superior de Ataque Pesado" },
  },
  {
    id: "Sword_Rare_Attack_02",
    name: { en: "Attack Speed Intensity", pt: "Intensidade de Velocidade de Ataque" },
    weapon: "",
    category: { en: "Attack", pt: "Ataque" },
    grade: "Rare",
    stats: [
      { label: { en: "Attack Speed", pt: "Velocidade de Ataque" }, value: "4.8%" },
      { label: { en: "Magic Endurance", pt: "Tolerância Mágica" }, value: "-54" },
    ],
    description: { en: "Increases Attack Speed, and decreases Magic Endurance.", pt: "Intensidade de Velocidade de Ataque" },
  },
  {
    id: "Sword_Rare_Attack_Skill",
    name: { en: "Shredding Strike", pt: "Golpe Retalhador" },
    weapon: "",
    category: { en: "Attack", pt: "Ataque" },
    grade: "Rare",
    stats: [

    ],
    description: { en: "", pt: "" },
  },
  {
    id: "Sword_Rare_AttackUtil_03",
    name: { en: "Damage Increase Expertise", pt: "Especialização em Aumento de Dano" },
    weapon: "",
    category: { en: "", pt: "" },
    grade: "Rare",
    stats: [
      { label: { en: "Mana Cost Efficiency", pt: "Eficiência do Custo de Mana" }, value: "2.4%" },
      { label: { en: "Skill Damage Boost", pt: "Ampliação de Dano de Habilidade" }, value: "12" },
    ],
    description: { en: "Increases Skill Damage Boost and Mana Cost Efficiency.", pt: "Especialização em Aumento de Dano" },
  },
  {
    id: "Sword_Rare_Defense_07",
    name: { en: "Greater Shield Block Augment", pt: "Aumento Superior de Bloqueio de Escudo" },
    weapon: "",
    category: { en: "Defense", pt: "Defesa" },
    grade: "Rare",
    stats: [
      { label: { en: "Shield Block Chance", pt: "Chance de Bloqueio do Escudo" }, value: "6.5%" },
    ],
    description: { en: "", pt: "Aumento Superior de Bloqueio de Escudo" },
  },
  {
    id: "Sword_Rare_Defense_08",
    name: { en: "Critical Damage Intensity", pt: "Intensidade de Dano Crítico" },
    weapon: "",
    category: { en: "Defense", pt: "Defesa" },
    grade: "Rare",
    stats: [
      { label: { en: "Skill Damage Boost", pt: "Ampliação de Dano de Habilidade" }, value: "-18" },
      { label: { en: "Critical Damage Resistance", pt: "Resistência a Dano Crítico" }, value: "4.8%" },
    ],
    description: { en: "Increases Critical Damage Resistance, but decreases Skill Damage Boost.", pt: "Ampliação de Dano de Habilidade" },
  },
  {
    id: "Sword_Rare_DefenseTactic_09",
    name: { en: "Skill Damage Resistance Expertise", pt: "Especialização em Resistência a Dano de Habilidade" },
    weapon: "",
    category: { en: "", pt: "" },
    grade: "Rare",
    stats: [
      { label: { en: "Skill Damage Resistance", pt: "Resistência a Dano de Habilidade" }, value: "12" },
      { label: { en: "Cooldown Speed", pt: "Velocidade de Recarga" }, value: "1.2%" },
    ],
    description: { en: "Skill Damage Resistance Expertise", pt: "Especialização em Resistência a Dano de Habilidade" },
  },
  {
    id: "Sword_Rare_Def_Skill",
    name: { en: "Unshakeable Will", pt: "Vontade Inabalável" },
    weapon: "",
    category: { en: "Defense", pt: "Defesa" },
    grade: "Rare",
    stats: [

    ],
    description: { en: "", pt: "" },
  },
  {
    id: "Sword_Rare_Tac_Skill",
    name: { en: "Tactical Breaker", pt: "Quebra-Tática" },
    weapon: "",
    category: { en: "", pt: "" },
    grade: "Rare",
    stats: [

    ],
    description: { en: "", pt: "" },
  },
  {
    id: "Sword_Rare_Tactic_10",
    name: { en: "Greater Boss Bonus Damage Augment", pt: "Aumento Superior de Bônus de Dano contra Chefes" },
    weapon: "",
    category: { en: "", pt: "" },
    grade: "Rare",
    stats: [
      { label: { en: "Boss Bonus Damage", pt: "Bônus de Dano contra Chefes" }, value: "48" },
    ],
    description: { en: "Greater Boss Bonus Damage Augment", pt: "Aumento Superior de Bônus de Dano contra Chefes" },
  },
  {
    id: "Sword_Rare_Tactic_11",
    name: { en: "Collision Intensity", pt: "Intensidade de Colisão" },
    weapon: "",
    category: { en: "", pt: "" },
    grade: "Rare",
    stats: [
      { label: { en: "Perception", pt: "Percepção" }, value: "2" },
      { label: { en: "Mana Regen", pt: "Regeneração de Mana" }, value: "-27" },
      { label: { en: "Collision Chance", pt: "Chance de Colisão" }, value: "90" },
    ],
    description: { en: "Increases Collision Chance, but decreases Mana Regen.", pt: "Aumenta a Chance de Colisão e a Percepção, mas reduz a Regeneração de Mana" },
  },
  {
    id: "Sword_Rare_TacticAttack_12",
    name: { en: "Stun Resistance and Damage Expertise", pt: "Especialização em Resistência a Atordoamento e Dano" },
    weapon: "",
    category: { en: "", pt: "" },
    grade: "Rare",
    stats: [
      { label: { en: "Stun Resistance", pt: "Resistência a Atordoamento" }, value: "30" },
      { label: { en: "Base Damage", pt: "Dano Base" }, value: "3" },
    ],
    description: { en: "Stun Resistance and Damage Expertise", pt: "Especialização em Resistência a Atordoamento e Dano" },
  },
  {
    id: "Sword_Rare_Util_04",
    name: { en: "Greater Buff Duration Augment", pt: "Aumento Superior de Duração da Vantagem" },
    weapon: "",
    category: { en: "Utility", pt: "Utilidade" },
    grade: "Rare",
    stats: [
      { label: { en: "Buff Duration", pt: "Duração da Vantagem" }, value: "3.2%" },
    ],
    description: { en: "", pt: "Aumento Superior de Duração da Vantagem" },
  },
  {
    id: "Sword_Rare_Util_05",
    name: { en: "CC Resistance Intensity", pt: "Intensidade de Resistência a CM" },
    weapon: "",
    category: { en: "Utility", pt: "Utilidade" },
    grade: "Rare",
    stats: [
      { label: { en: "Strength", pt: "Força" }, value: "2" },
      { label: { en: "Bind Resistance", pt: "Resistência a Imobilização" }, value: "60" },
      { label: { en: "Stun Resistance", pt: "Resistência a Atordoamento" }, value: "60" },
      { label: { en: "Fear Resistance", pt: "Resistência a Medo" }, value: "60" },
      { label: { en: "Sleep Resistance", pt: "Resistência a Sono" }, value: "60" },
      { label: { en: "Weaken Resistance", pt: "Resistência a Fraqueza" }, value: "60" },
      { label: { en: "Silence Resistance", pt: "Resistência a Silêncio" }, value: "60" },
      { label: { en: "Collision Resistance", pt: "Resistência a Colisão" }, value: "60" },
      { label: { en: "Range", pt: "Alcance" }, value: "-3.1%" },
      { label: { en: "Petrification Resistance", pt: "Resistência a Petrificação" }, value: "60" },
    ],
    description: { en: "Increases all CC Resistances, but decreases Attack Range.", pt: "Intensidade de Resistência a CM" },
  },
  {
    id: "Sword_Rare_UtilDefense_06",
    name: { en: "Melee Defense Expertise", pt: "Especialização em Defesa Corpo a Corpo" },
    weapon: "",
    category: { en: "", pt: "" },
    grade: "Rare",
    stats: [
      { label: { en: "Melee Defense", pt: "Defesa Corpo a Corpo" }, value: "48" },
      { label: { en: "Stamina Regen", pt: "Regeneração de Vigor" }, value: "2.4" },
    ],
    description: { en: "Increases Melee Defense and Stamina Regen.", pt: "Especialização em Defesa Corpo a Corpo" },
  },
  {
    id: "Sword_Rare_Util_Skill",
    name: { en: "Replenishment", pt: "Reabastecimento" },
    weapon: "",
    category: { en: "Utility", pt: "Utilidade" },
    grade: "Rare",
    stats: [

    ],
    description: { en: "", pt: "" },
  },
  {
    id: "Wand_Hero_Attack_01",
    name: { en: "Abyssal Burst", pt: "Explosão Abissal" },
    weapon: "",
    category: { en: "Attack", pt: "Ataque" },
    grade: "Epic",
    stats: [

    ],
    description: { en: "Upon hitting a target affected by the user's Curse Damage over time, has a(n) 8% chance to apply the Curse Explosion effect to the target, dealing 12% of the remaining damage over time. The damage over time effect is not consumed by the Curse Explosion effect. Does not apply additional effects from Curse Explosion.", pt: "Ao acertar um alvo afetado pelo Dano Contínuo por Maldição do usuário, tem 8% de chance de aplicar o efeito de Maldição Explosiva no alvo, causando 12% do dano contínuo restante. O efeito de dano contínuo não é consumido pelo efeito de Maldição Explosiva. Não aplica efeitos adicionais da Maldição Explosiva." },
  },
  {
    id: "Wand_Hero_Defense_03",
    name: { en: "Blessed Haste", pt: "Pressa Abençoada" },
    weapon: "",
    category: { en: "Defense", pt: "Defesa" },
    grade: "Epic",
    stats: [

    ],
    description: { en: "Decreases healing skill cooldowns by 14%.", pt: "Reduz a recarga de Habilidade de Cura em 14%" },
  },
  {
    id: "Wand_Hero_Tactic_04",
    name: { en: "Nightmare", pt: "Pesadelo" },
    weapon: "",
    category: { en: "", pt: "" },
    grade: "Epic",
    stats: [

    ],
    description: { en: "Applying Touch of Despair, Corrupted Magic Circle, Time for Corruption, or Time for Punishment to monsters has a 20% chance to apply the Dream Demon effect for 3s. the effect is the same as Sleep, but persists through being attacked. Does not stack with the Karmic Haze effect.", pt: "Aplicar Toque de Desespero, Círculo Mágico Corrompido, Tempo de Corrupção ou Hora da Punição em monstros tem uma chance de 20% de aplicar o efeito de Demônio dos Sonhos por 3s. O efeito é o mesmo que o Sono, mas persiste mesmo ao sofrer ataque. Não é acumulável com o efeito Névoa Cármica" },
  },
  {
    id: "Wand_Hero_Util_02",
    name: { en: "Divine Choice", pt: "Escolha Divina" },
    weapon: "",
    category: { en: "Utility", pt: "Utilidade" },
    grade: "Epic",
    stats: [

    ],
    description: { en: "Increases Healing effectiveness by 14%, but decreases Curse Damage over time by 14%.", pt: "Aumenta a eficácia da Cura em 14%, mas reduz o Dano Contínuo por Maldição em 14%" },
  },
  {
    id: "Wand_High_Attack_01",
    name: { en: "Curse Duration Augment", pt: "Aumento da Duração da Maldição" },
    weapon: "",
    category: { en: "Attack", pt: "Ataque" },
    grade: "Uncommon",
    stats: [

    ],
    description: { en: "Increases Curse Duration by 1s.", pt: "Aumenta a Duração da Maldição em 1s." },
  },
  {
    id: "Wand_High_Attack_02",
    name: { en: "Attack Speed Intensity", pt: "Intensidade de Velocidade de Ataque" },
    weapon: "",
    category: { en: "Attack", pt: "Ataque" },
    grade: "Uncommon",
    stats: [
      { label: { en: "Ranged Defense", pt: "Defesa à Distância" }, value: "-60" },
      { label: { en: "Attack Speed", pt: "Velocidade de Ataque" }, value: "4%" },
    ],
    description: { en: "Increases Attack Speed, but decreases Ranged Defense.", pt: "Intensidade de Velocidade de Ataque" },
  },
  {
    id: "Wand_High_Attack_Skill",
    name: { en: "Warrior's Gambit", pt: "Gambito de Combatente" },
    weapon: "",
    category: { en: "Attack", pt: "Ataque" },
    grade: "Uncommon",
    stats: [

    ],
    description: { en: "", pt: "" },
  },
  {
    id: "Wand_High_AttackUtil_03",
    name: { en: "Max Damage Expertise", pt: "Especialista em Dano Máximo" },
    weapon: "",
    category: { en: "", pt: "" },
    grade: "Uncommon",
    stats: [
      { label: { en: "Max Mana", pt: "Mana Máxima" }, value: "160" },
      { label: { en: "Max Damage", pt: "Dano Máx." }, value: "3" },
    ],
    description: { en: "Increases Max Damage and Max Mana. Max Damage increases from Lv. 4.", pt: "Aumenta o Dano Máximo e a Mana Máxima. Aumenta o Dano Máximo a partir do Nv.4" },
  },
  {
    id: "Wand_High_Defense_07",
    name: { en: "Melee Defense Augment", pt: "Aumento de Defesa Corpo a Corpo" },
    weapon: "",
    category: { en: "Defense", pt: "Defesa" },
    grade: "Uncommon",
    stats: [
      { label: { en: "Melee Defense", pt: "Defesa Corpo a Corpo" }, value: "80" },
    ],
    description: { en: "", pt: "Aumento de Defesa Corpo a Corpo" },
  },
  {
    id: "Wand_High_Defense_08",
    name: { en: "Magic Heavy Attack Evasion Intensity", pt: "Intensidade de Esquiva de Ataque Pesado Mágico" },
    weapon: "",
    category: { en: "Defense", pt: "Defesa" },
    grade: "Uncommon",
    stats: [
      { label: { en: "Magic Heavy Attack Evasion", pt: "Esquiva de Ataque Pesado Mágico" }, value: "90" },
      { label: { en: "Magic Critical Hit Chance", pt: "Chance de Acerto Crítico Mágico" }, value: "-30" },
    ],
    description: { en: "Magic Heavy Attack Evasion Intensity", pt: "Intensidade de Esquiva de Ataque Pesado Mágico" },
  },
  {
    id: "Wand_High_DefenseTactic_09",
    name: { en: "Damage Reduction Expertise", pt: "Especialização em Redução de Dano" },
    weapon: "",
    category: { en: "", pt: "" },
    grade: "Uncommon",
    stats: [
      { label: { en: "Weaken Chance", pt: "Chance de Fraqueza" }, value: "25" },
      { label: { en: "Damage Reduction", pt: "Redução de Dano" }, value: "8" },
    ],
    description: { en: "Increases Damage Reduction and Weaken Chance.", pt: "Especialização em Redução de Dano" },
  },
  {
    id: "Wand_High_Def_Skill",
    name: { en: "Celestial Boost", pt: "Ampliação Celestial" },
    weapon: "",
    category: { en: "Defense", pt: "Defesa" },
    grade: "Uncommon",
    stats: [

    ],
    description: { en: "", pt: "" },
  },
  {
    id: "Wand_High_Tac_Skill",
    name: { en: "Shadow Oath", pt: "Juramento Sombrio" },
    weapon: "",
    category: { en: "", pt: "" },
    grade: "Uncommon",
    stats: [
      { label: { en: "Any1 have the description of these new skills?", pt: "Any1 have the description of these new skills?" }, value: "0" },
    ],
    description: { en: "Any1 have the description of these new skills?", pt: "" },
  },
  {
    id: "Wand_High_Tactic_10",
    name: { en: "Species Damage Augment", pt: "Aumento de Dano de Espécies" },
    weapon: "",
    category: { en: "", pt: "" },
    grade: "Uncommon",
    stats: [
      { label: { en: "Demon Damage Boost", pt: "Ampliação de Dano contra Demônios" }, value: "16" },
      { label: { en: "Wildkin Damage Boost", pt: "Ampliação de Dano contra Selvagens" }, value: "16" },
      { label: { en: "Undead Damage Boost", pt: "Ampliação de Dano contra Mortos-vivos" }, value: "16" },
      { label: { en: "Humanoid Damage Boost", pt: "Ampliação de Dano contra Humanoides" }, value: "16" },
      { label: { en: "Construct Damage Boost", pt: "Ampliação de Dano contra Construtos" }, value: "16" },
    ],
    description: { en: "Increases all Species Damage Boost.", pt: "Ampliação de Dano contra Demônios" },
  },
  {
    id: "Wand_High_Tactic_11",
    name: { en: "Buff Duration Intensity", pt: "Intensidade de Duração da Vantagem" },
    weapon: "",
    category: { en: "", pt: "" },
    grade: "Uncommon",
    stats: [
      { label: { en: "Mana Regen", pt: "Regeneração de Mana" }, value: "-22.5" },
      { label: { en: "Buff Duration", pt: "Duração da Vantagem" }, value: "4%" },
    ],
    description: { en: "Increases Buff Duration, but decreases Mana Regen.", pt: "Intensidade de Duração da Vantagem" },
  },
  {
    id: "Wand_High_TacticAttack_12",
    name: { en: "Skill Damage Boost Expertise", pt: "Especialização em Ampliação de Dano de Habilidade" },
    weapon: "",
    category: { en: "", pt: "" },
    grade: "Uncommon",
    stats: [
      { label: { en: "Skill Damage Boost", pt: "Ampliação de Dano de Habilidade" }, value: "10" },
      { label: { en: "Bonus Damage", pt: "Bônus de Dano" }, value: "8" },
    ],
    description: { en: "Increases Skill Damage Boost and Bonus Damage.", pt: "Especialização em Ampliação de Dano de Habilidade" },
  },
  {
    id: "Wand_High_Util_04",
    name: { en: "Healing Augment", pt: "Aumento de Cura" },
    weapon: "",
    category: { en: "Utility", pt: "Utilidade" },
    grade: "Uncommon",
    stats: [
      { label: { en: "Healing", pt: "Cura" }, value: "5%" },
    ],
    description: { en: "", pt: "" },
  },
  {
    id: "Wand_High_Util_05",
    name: { en: "Max Mana Intensity", pt: "Intensidade de Mana Máxima" },
    weapon: "",
    category: { en: "Utility", pt: "Utilidade" },
    grade: "Uncommon",
    stats: [
      { label: { en: "Max Mana", pt: "Mana Máxima" }, value: "480" },
      { label: { en: "Health Regen", pt: "Regeneração de Vida" }, value: "-30" },
    ],
    description: { en: "Increases Max Mana, but decreases Health Regen.", pt: "Aumenta a Mana Máxima, mas reduz a Regeneração de Vida" },
  },
  {
    id: "Wand_High_UtilDefense_06",
    name: { en: "Magic Defense Expertise", pt: "Especialização em Defesa Mágica" },
    weapon: "",
    category: { en: "", pt: "" },
    grade: "Uncommon",
    stats: [
      { label: { en: "Magic Defense", pt: "Defesa Mágica" }, value: "40" },
      { label: { en: "Stun Resistance", pt: "Resistência a Atordoamento" }, value: "25" },
    ],
    description: { en: "Increases Magic Defense and Stun Resistance.", pt: "Especialização em Defesa Mágica" },
  },
  {
    id: "Wand_High_Util_Skill",
    name: { en: "Eye of Emptiness", pt: "Olho do Vazio" },
    weapon: "",
    category: { en: "Utility", pt: "Utilidade" },
    grade: "Uncommon",
    stats: [

    ],
    description: { en: "", pt: "" },
  },
  {
    id: "Wand_Normal_Attack_01",
    name: { en: "Lesser Attack Range Augment", pt: "Aumento Inferior de Alcance de Ataque" },
    weapon: "",
    category: { en: "Attack", pt: "Ataque" },
    grade: "Common",
    stats: [
      { label: { en: "Range", pt: "Alcance" }, value: "3.2%" },
    ],
    description: { en: "", pt: "Aumento Inferior de Alcance de Ataque" },
  },
  {
    id: "Wand_Normal_Attack_02",
    name: { en: "Hit Intensity", pt: "Intensidade de Acerto" },
    weapon: "",
    category: { en: "Attack", pt: "Ataque" },
    grade: "Common",
    stats: [
      { label: { en: "Healing", pt: "Cura" }, value: "-1.8%" },
      { label: { en: "Magic Hit Chance", pt: "Chance de Acerto Mágico" }, value: "38.4" },
      { label: { en: "Melee Hit Chance", pt: "Chance de Acerto Corpo a Corpo" }, value: "38.4" },
      { label: { en: "Ranged Hit Chance", pt: "Chance de Acerto à Distância" }, value: "38.4" },
    ],
    description: { en: "Increases Magic, Melee, and Ranged Hit Chance, but decreases Healing.", pt: "Aumenta a Chance de Acerto à Distância, Corpo a Corpo e Mágico, mas reduz a Cura" },
  },
  {
    id: "Wand_Normal_Attack_Skill",
    name: { en: "Vampiric Onslaught", pt: "Ataque Vampírico" },
    weapon: "",
    category: { en: "Attack", pt: "Ataque" },
    grade: "Common",
    stats: [

    ],
    description: { en: "", pt: "" },
  },
  {
    id: "Wand_Normal_AttackUtil_03",
    name: { en: "Bonus Damage Expertise", pt: "Especialização em Bônus de Dano" },
    weapon: "",
    category: { en: "", pt: "" },
    grade: "Common",
    stats: [
      { label: { en: "Mana Regen", pt: "Regeneração de Mana" }, value: "12" },
      { label: { en: "Bonus Damage", pt: "Bônus de Dano" }, value: "6" },
    ],
    description: { en: "Increases Bonus Damage and Mana Regen.", pt: "Especialização em Bônus de Dano" },
  },
  {
    id: "Wand_Normal_Defense_07",
    name: { en: "Lesser Melee Heavy Attack Evasion Augment", pt: "Aumento de Esquiva de Ataque Pesado Corpo a Corpo Menor" },
    weapon: "",
    category: { en: "Defense", pt: "Defesa" },
    grade: "Common",
    stats: [
      { label: { en: "Melee Heavy Attack Evasion", pt: "Esquiva de Ataque Pesado Corpo a Corpo" }, value: "48" },
    ],
    description: { en: "Lesser Melee Heavy Attack Evasion Augment", pt: "Aumento de Esquiva de Ataque Pesado Corpo a Corpo Menor" },
  },
  {
    id: "Wand_Normal_Defense_08",
    name: { en: "Healing Received Intensity", pt: "Intensidade de Cura Recebida" },
    weapon: "",
    category: { en: "Defense", pt: "Defesa" },
    grade: "Common",
    stats: [
      { label: { en: "Magic Hit Chance", pt: "Chance de Acerto Mágico" }, value: "-24" },
      { label: { en: "Healing Received", pt: "Cura Recebida" }, value: "4%" },
    ],
    description: { en: "Increases Healing Received, but decreases Magic Hit Chance.", pt: "Aumenta a Cura Recebida, mas reduz a Chance de Acerto Mágico" },
  },
  {
    id: "Wand_Normal_DefenseTactic_09",
    name: { en: "Evasion Expertise", pt: "Especialização em Esquiva" },
    weapon: "",
    category: { en: "", pt: "" },
    grade: "Common",
    stats: [
      { label: { en: "Max Health", pt: "Vida Máxima" }, value: "128" },
      { label: { en: "Magic Evasion", pt: "Esquiva Mágica" }, value: "16" },
      { label: { en: "Melee Evasion", pt: "Esquiva Corpo a Corpo" }, value: "16" },
      { label: { en: "Ranged Evasion", pt: "Esquiva à Distância" }, value: "16" },
    ],
    description: { en: "Increases Magic, Melee, and Ranged Evasion and Max Health.", pt: "Aumenta a Esquiva à Distância, Corpo a Corpo e Mágica, e a Vida Máxima" },
  },
  {
    id: "Wand_Normal_Def_Skill",
    name: { en: "Light of Devotion", pt: "Luz da Devoção" },
    weapon: "",
    category: { en: "Defense", pt: "Defesa" },
    grade: "Common",
    stats: [

    ],
    description: { en: "", pt: "" },
  },
  {
    id: "Wand_Normal_Tac_Skill",
    name: { en: "Malicious Focus", pt: "Foco Malévolo" },
    weapon: "",
    category: { en: "", pt: "" },
    grade: "Common",
    stats: [

    ],
    description: { en: "", pt: "" },
  },
  {
    id: "Wand_Normal_Tactic_10",
    name: { en: "Lesser Species Resistance Augment", pt: "Aumento Inferior de Resistência de Espécies" },
    weapon: "",
    category: { en: "", pt: "" },
    grade: "Common",
    stats: [
      { label: { en: "Demon Damage Resistance", pt: "Resistência a Dano contra Demônios" }, value: "12.8" },
      { label: { en: "Wildkin Damage Resistance", pt: "Resistência a Dano contra Selvagens" }, value: "12.8" },
      { label: { en: "Undead Damage Resistance", pt: "Resistência a Dano contra Mortos-vivos" }, value: "12.8" },
      { label: { en: "Humanoid Damage Resistance", pt: "Resistência a Dano contra Humanoides" }, value: "12.8" },
      { label: { en: "Construct Damage Resistance", pt: "Resistência a Dano contra Construtos" }, value: "12.8" },
    ],
    description: { en: "Lesser Species Resistance Augment", pt: "Aumento Inferior de Resistência de Espécies" },
  },
  {
    id: "Wand_Normal_Tactic_11",
    name: { en: "Cooldown Speed Intensity", pt: "Intensidade de Velocidade de Recarga" },
    weapon: "",
    category: { en: "", pt: "" },
    grade: "Common",
    stats: [
      { label: { en: "Cooldown Speed", pt: "Velocidade de Recarga" }, value: "2.4%" },
      { label: { en: "Mana Cost Efficiency", pt: "Eficiência do Custo de Mana" }, value: "-2%" },
    ],
    description: { en: "Increases Skill Cooldown Speed, but decreases Mana Cost Efficiency.", pt: "Intensidade de Velocidade de Recarga" },
  },
  {
    id: "Wand_Normal_TacticAttack_12",
    name: { en: "Base Damage Expertise", pt: "Especialização em Dano Base" },
    weapon: "",
    category: { en: "", pt: "" },
    grade: "Common",
    stats: [
      { label: { en: "Weaken Chance", pt: "Chance de Fraqueza" }, value: "20" },
      { label: { en: "Base Damage", pt: "Dano Base" }, value: "2" },
    ],
    description: { en: "Increases Weaken Chance and Base Damage. Base Damage increases from Lv. 5.", pt: "Aumenta a Chance de Fraqueza e o Dano Base. Aumenta o Dano Base a partir do Nv.5" },
  },
  {
    id: "Wand_Normal_Util_04",
    name: { en: "Lesser Mana Efficiency Augment", pt: "Aumento Inferior de Eficiência de Mana" },
    weapon: "",
    category: { en: "Utility", pt: "Utilidade" },
    grade: "Common",
    stats: [
      { label: { en: "Mana Cost Efficiency", pt: "Eficiência do Custo de Mana" }, value: "3.2%" },
    ],
    description: { en: "Increases Mana Cost Efficiency.", pt: "Aumento Inferior de Eficiência de Mana" },
  },
  {
    id: "Wand_Normal_Util_05",
    name: { en: "Healing Intensity I", pt: "Intensidade de Cura I" },
    weapon: "",
    category: { en: "Utility", pt: "Utilidade" },
    grade: "Common",
    stats: [
      { label: { en: "Healing", pt: "Cura" }, value: "6%" },
      { label: { en: "Sleep Chance", pt: "Chance de Sono" }, value: "-30" },
    ],
    description: { en: "Increases Healing, but decreases Sleep Chance.", pt: "Aumenta a Cura, mas reduz a Chance de Sono" },
  },
  {
    id: "Wand_Normal_UtilDefense_06",
    name: { en: "Damage Reduction Expertise", pt: "Especialização em Redução de Dano" },
    weapon: "",
    category: { en: "", pt: "" },
    grade: "Common",
    stats: [
      { label: { en: "Damage Reduction", pt: "Redução de Dano" }, value: "6" },
      { label: { en: "Silence Resistance", pt: "Resistência a Silêncio" }, value: "20" },
    ],
    description: { en: "Increases Silence Resistance and Damage Reduction.", pt: "Especialização em Redução de Dano" },
  },
  {
    id: "Wand_Normal_Util_Skill",
    name: { en: "Battle Spirit", pt: "Espírito de Batalha" },
    weapon: "",
    category: { en: "Utility", pt: "Utilidade" },
    grade: "Common",
    stats: [

    ],
    description: { en: "", pt: "" },
  },
  {
    id: "Wand_Rare_Attack_01",
    name: { en: "Greater Damage Over Time Augment", pt: "Aumento Superior de Dano Contínuo" },
    weapon: "",
    category: { en: "Attack", pt: "Ataque" },
    grade: "Rare",
    stats: [

    ],
    description: { en: "Greater Damage Over Time Augment", pt: "Aumento Superior de Dano Contínuo" },
  },
  {
    id: "Wand_Rare_Attack_02",
    name: { en: "Magic Heavy Attack Intensity", pt: "Intensidade de Ataque Pesado Mágico" },
    weapon: "",
    category: { en: "Attack", pt: "Ataque" },
    grade: "Rare",
    stats: [
      { label: { en: "Magic Heavy Attack Chance", pt: "Chance de Ataque Pesado Mágico" }, value: "72" },
      { label: { en: "Ranged Heavy Attack Evasion", pt: "Esquiva de Ataque Pesado à Distância" }, value: "-54" },
    ],
    description: { en: "Increases Magic Heavy Attack Chance, but decreases Ranged heavy Attack Evasion.", pt: "Intensidade de Ataque Pesado Mágico" },
  },
  {
    id: "Wand_Rare_Attack_Skill",
    name: { en: "Malicious Intent", pt: "Intenção Maliciosa" },
    weapon: "",
    category: { en: "Attack", pt: "Ataque" },
    grade: "Rare",
    stats: [

    ],
    description: { en: "", pt: "" },
  },
  {
    id: "Wand_Rare_AttackUtil_03",
    name: { en: "Silence Chance Response", pt: "Resposta à Chance de Silêncio" },
    weapon: "",
    category: { en: "", pt: "" },
    grade: "Rare",
    stats: [
      { label: { en: "Silence Resistance", pt: "Resistência a Silêncio" }, value: "30" },
      { label: { en: "Magic Critical Hit Chance", pt: "Chance de Acerto Crítico Mágico" }, value: "19.2" },
      { label: { en: "Melee Critical Hit Chance", pt: "Chance de Acerto Crítico Corpo a Corpo" }, value: "19.2" },
      { label: { en: "Ranged Critical Hit Chance", pt: "Chance de Acerto Crítico à Distância" }, value: "19.2" },
    ],
    description: { en: "Increases Critical Hit Chance and Silence Resistance.", pt: "Chance de Acerto Crítico Mágico" },
  },
  {
    id: "Wand_Rare_Defense_07",
    name: { en: "Greater Melee Evasion Augment", pt: "Aumento Superior de Esquiva Corpo a Corpo" },
    weapon: "",
    category: { en: "Defense", pt: "Defesa" },
    grade: "Rare",
    stats: [
      { label: { en: "Melee Evasion", pt: "Esquiva Corpo a Corpo" }, value: "72" },
    ],
    description: { en: "", pt: "Aumento Superior de Esquiva Corpo a Corpo" },
  },
  {
    id: "Wand_Rare_Defense_08",
    name: { en: "Endurance Intensity", pt: "Intensidade da Tolerância" },
    weapon: "",
    category: { en: "Defense", pt: "Defesa" },
    grade: "Rare",
    stats: [
      { label: { en: "Magic Heavy Attack Chance", pt: "Chance de Ataque Pesado Mágico" }, value: "-36" },
      { label: { en: "Magic Endurance", pt: "Tolerância Mágica" }, value: "72" },
      { label: { en: "Melee Endurance", pt: "Tolerância Corpo a Corpo" }, value: "72" },
      { label: { en: "Ranged Endurance", pt: "Tolerância à Distância" }, value: "72" },
    ],
    description: { en: "Increases Magic, Melee, and Ranged Endurance, but decreases Magic Heavy Attack.", pt: "Aumenta a Tolerância à Distância, Corpo a Corpo e Mágica, mas reduz o Ataque Pesado Mágico." },
  },
  {
    id: "Wand_Rare_DefenseTactic_09",
    name: { en: "Skill Damage Resistance Expertise", pt: "Especialização em Resistência a Dano de Habilidade" },
    weapon: "",
    category: { en: "", pt: "" },
    grade: "Rare",
    stats: [
      { label: { en: "Skill Damage Resistance", pt: "Resistência a Dano de Habilidade" }, value: "12" },
      { label: { en: "Buff Duration", pt: "Duração da Vantagem" }, value: "1.6%" },
    ],
    description: { en: "Skill Damage Resistance Expertise", pt: "Especialização em Resistência a Dano de Habilidade" },
  },
  {
    id: "Wand_Rare_Def_Skill",
    name: { en: "Spectral Defense", pt: "Defesa Espectral" },
    weapon: "",
    category: { en: "Defense", pt: "Defesa" },
    grade: "Rare",
    stats: [

    ],
    description: { en: "", pt: "" },
  },
  {
    id: "Wand_Rare_Tac_Skill",
    name: { en: "Dark Apostasy", pt: "" },
    weapon: "",
    category: { en: "", pt: "" },
    grade: "Rare",
    stats: [
      { label: { en: "Any idea of what these skills do?", pt: "Any idea of what these skills do?" }, value: "0" },
    ],
    description: { en: "Any idea of what these skills do?", pt: "" },
  },
  {
    id: "Wand_Rare_Tactic_11",
    name: { en: "Stamina Regen Intensity", pt: "Intensidade de Regeneração de Vigor" },
    weapon: "",
    category: { en: "", pt: "" },
    grade: "Rare",
    stats: [
      { label: { en: "Perception", pt: "Percepção" }, value: "2" },
      { label: { en: "Max Mana", pt: "Mana Máxima" }, value: "-288" },
      { label: { en: "Stamina Regen", pt: "Regeneração de Vigor" }, value: "7.2" },
    ],
    description: { en: "Increases Stamina Regen, but decreases Max Mana.", pt: "Intensidade de Regeneração de Vigor" },
  },
  {
    id: "Wand_Rare_TacticAttack_12",
    name: { en: "Skill Damage Expertise", pt: "Especialização em Dano de Habilidade" },
    weapon: "",
    category: { en: "", pt: "" },
    grade: "Rare",
    stats: [
      { label: { en: "Skill Damage Boost", pt: "Ampliação de Dano de Habilidade" }, value: "12" },
      { label: { en: "Buff Duration", pt: "Duração da Vantagem" }, value: "1.6%" },
    ],
    description: { en: "Increases Buff Duration and Skill Damage Boost.", pt: "Especialização em Dano de Habilidade" },
  },
  {
    id: "Wand_Rare_Util_04",
    name: { en: "Greater Mana Regen Augment", pt: "Aumento Superior de Regeneração de Mana" },
    weapon: "",
    category: { en: "Utility", pt: "Utilidade" },
    grade: "Rare",
    stats: [
      { label: { en: "Mana Regen", pt: "Regeneração de Mana" }, value: "36" },
    ],
    description: { en: "", pt: "Aumento Superior de Regeneração de Mana" },
  },
  {
    id: "Wand_Rare_Util_05",
    name: { en: "Healing Intensity II", pt: "Intensidade de Cura II" },
    weapon: "",
    category: { en: "Utility", pt: "Utilidade" },
    grade: "Rare",
    stats: [
      { label: { en: "Wisdom", pt: "Sabedoria" }, value: "2" },
      { label: { en: "Healing", pt: "Cura" }, value: "9%" },
      { label: { en: "Sleep Chance", pt: "Chance de Sono" }, value: "-45" },
    ],
    description: { en: "Increases Healing, but decreases Sleep Chance.", pt: "Aumenta a Duração da Desvantagem, a Sabedoria e a Cura de Habilidade" },
  },
  {
    id: "Wand_Rare_UtilDefense_06",
    name: { en: "Debuff Duration Defense", pt: "Defesa contra Duração da Desvantagem" },
    weapon: "",
    category: { en: "", pt: "" },
    grade: "Rare",
    stats: [
      { label: { en: "Healing", pt: "Cura" }, value: "3%" },
      { label: { en: "Debuff Duration", pt: "Duração da Desvantagem" }, value: "-1.2%" },
    ],
    description: { en: "Increases Debuff Duration and Healing.", pt: "Defesa contra Duração da Desvantagem" },
  },
  {
    id: "Wand_Rare_Util_Skill",
    name: { en: "Corrupting Hit", pt: "Acerto Corrompido" },
    weapon: "",
    category: { en: "Utility", pt: "Utilidade" },
    grade: "Rare",
    stats: [

    ],
    description: { en: "", pt: "" },
  },
  {
    id: "WM_Common_SKILL_001",
    name: { en: "Overcome Crisis", pt: "Superar a Crise" },
    weapon: "",
    category: { en: "", pt: "" },
    grade: "Uncommon",
    stats: [

    ],
    description: { en: "", pt: "" },
  },
  {
    id: "WM_Common_SKILL_002",
    name: { en: "Destruction Spear", pt: "Lança Destruidora" },
    weapon: "",
    category: { en: "", pt: "" },
    grade: "Uncommon",
    stats: [

    ],
    description: { en: "", pt: "" },
  },
  {
    id: "WM_Common_SKILL_003",
    name: { en: "Spirit of Defiance", pt: "Espírito de Desafio" },
    weapon: "",
    category: { en: "", pt: "" },
    grade: "Uncommon",
    stats: [

    ],
    description: { en: "", pt: "" },
  },
  {
    id: "WM_Common_SKILL_004",
    name: { en: "Deadly Survival Instinct", pt: "Instinto Mortal de Sobrevivência" },
    weapon: "",
    category: { en: "", pt: "" },
    grade: "Uncommon",
    stats: [
      { label: { en: "wtf is a survival skill? and what does \"when defeating an enemy\" mean?", pt: "wtf is a survival skill? and what does \"when defeating an enemy\" mean?" }, value: "1" },
    ],
    description: { en: "wtf is a survival skill? and what does \"when defeating an enemy\" mean?", pt: "Instinto Mortal de Sobrevivência" },
  },
  {
    id: "WM_Common_SKILL_005",
    name: { en: "Fountain of Revitalization", pt: "Fonte de Revitalização" },
    weapon: "",
    category: { en: "", pt: "" },
    grade: "Rare",
    stats: [
      { label: { en: "Does not work with Wand heals. Only procs off of other weapon's heals.", pt: "Does not work with Wand heals. Only procs off of other weapon's heals." }, value: "0" },
    ],
    description: { en: "Does not work with Wand heals. Only procs off of other weapon's heals.", pt: "" },
  },
  {
    id: "WM_Common_SKILL_006",
    name: { en: "Deadly Viper", pt: "Víbora Mortal" },
    weapon: "",
    category: { en: "", pt: "" },
    grade: "Rare",
    stats: [

    ],
    description: { en: "", pt: "" },
  },
  {
    id: "WM_Common_SKILL_007",
    name: { en: "Potential", pt: "Potencial" },
    weapon: "",
    category: { en: "", pt: "" },
    grade: "Rare",
    stats: [

    ],
    description: { en: "", pt: "" },
  },
  {
    id: "WM_Common_SKILL_008",
    name: { en: "Dragon Ascent", pt: "Ascensão Dracônica" },
    weapon: "",
    category: { en: "", pt: "" },
    grade: "Rare",
    stats: [

    ],
    description: { en: "", pt: "" },
  },
  {
    id: "WM_Common_SKILL_009",
    name: { en: "Falling Flower", pt: "Flor que Cai" },
    weapon: "",
    category: { en: "", pt: "" },
    grade: "Epic",
    stats: [

    ],
    description: { en: "", pt: "" },
  },
  {
    id: "WM_Common_SKILL_010",
    name: { en: "Indomitable Stance", pt: "Postura Indomável" },
    weapon: "",
    category: { en: "", pt: "" },
    grade: "Epic",
    stats: [

    ],
    description: { en: "", pt: "" },
  },
  {
    id: "WM_Common_SKILL_011",
    name: { en: "Lightning Speed", pt: "Velocidade da Luz" },
    weapon: "",
    category: { en: "", pt: "" },
    grade: "Epic",
    stats: [

    ],
    description: { en: "", pt: "" },
  },
  {
    id: "WM_Common_SKILL_012",
    name: { en: "Time Bomb", pt: "Bomba Relógio" },
    weapon: "",
    category: { en: "", pt: "" },
    grade: "Epic",
    stats: [

    ],
    description: { en: "", pt: "" },
  },
  {
    id: "Orb_Hero_Attack_01",
    name: { en: "Light of Annihilation", pt: "Luz da Aniquilação" },
    weapon: "Orb",
    category: { en: "Attack", pt: "Ataque" },
    grade: "Epic",
    stats: [

    ],
    description: { en: "Using an Orb increases Critical Damage of the next Active Skill used in 6s by 14%. Stacks up to 3 times.", pt: "Usar um Orbe aumenta o Dano Crítico da próxima Habilidade Ativa usada em 6s em 14%. Acumulável até 3 vezes." },
  },
  {
    id: "Orb_Hero_Defense_03",
    name: { en: "Breath of Infinity", pt: "Sopro do Infinito" },
    weapon: "Orb",
    category: { en: "Defense", pt: "Defesa" },
    grade: "Epic",
    stats: [

    ],
    description: { en: "When the Shield effect is applied, restores the Shielded target's Health by 100% of Base Damage + 300. Using Shield on yourself restores your Health one more time.", pt: "Ao aplicar o efeito Escudo, restaura a Vida do alvo que recebeu o Escudo em 100% do Dano Base + 300. Usar Escudo em si recupera sua Vida mais uma vez." },
  },
  {
    id: "Orb_Hero_Tactic_04",
    name: { en: "Dark Erosion", pt: "Erosão Sombria" },
    weapon: "Orb",
    category: { en: "", pt: "" },
    grade: "Epic",
    stats: [

    ],
    description: { en: "When Collision or Stun is applied with an Orb Skill, reduces the duration of all player buffs on the target by 2s.", pt: "Ao aplicar Colisão ou Atordoamento com uma Habilidades de Orbe, reduz a duração de todas as vantagens de jogador no alvo em 2s." },
  },
  {
    id: "Orb_Hero_Util_02",
    name: { en: "Seer", pt: "Vidência" },
    weapon: "Orb",
    category: { en: "Utility", pt: "Utilidade" },
    grade: "Epic",
    stats: [

    ],
    description: { en: "When both Wisdom and Perception is 70 or above, applies an effect that increases Heavy Attack Damage by 20% to the Satellite effect.", pt: "Quando tanto Sabedoria quanto Percepção estiverem em 70 ou mais, aplica um efeito que aumenta o Dano de Ataque Pesado em 20% ao efeito Satélite." },
  },
  {
    id: "Orb_High_Attack_01",
    name: { en: "Increase Attack Range", pt: "Aumento de Alcance de Ataque" },
    weapon: "Orb",
    category: { en: "Attack", pt: "Ataque" },
    grade: "Uncommon",
    stats: [
      { label: { en: "Range", pt: "Alcance" }, value: "4%" },
    ],
    description: { en: "", pt: "" },
  },
  {
    id: "Orb_High_Attack_02",
    name: { en: "Magic Heavy Attack Concentration", pt: "Concentração de Ataque Pesado Mágico" },
    weapon: "Orb",
    category: { en: "Attack", pt: "Ataque" },
    grade: "Uncommon",
    stats: [
      { label: { en: "Shield Health", pt: "Vida do Escudo" }, value: "-3%" },
      { label: { en: "Magic Heavy Attack Chance", pt: "Chance de Ataque Pesado Mágico" }, value: "60" },
    ],
    description: { en: "Magic Heavy Attack Concentration", pt: "Concentração de Ataque Pesado Mágico" },
  },
  {
    id: "Orb_High_Attack_Skill",
    name: { en: "Stacking Echo", pt: "Eco Cumulativo" },
    weapon: "Orb",
    category: { en: "Attack", pt: "Ataque" },
    grade: "Uncommon",
    stats: [

    ],
    description: { en: "", pt: "" },
  },
  {
    id: "Orb_High_AttackUtil_03",
    name: { en: "Max Mana Mastery", pt: "Maestria de Mana Máximo" },
    weapon: "Orb",
    category: { en: "", pt: "" },
    grade: "Uncommon",
    stats: [
      { label: { en: "Max Mana", pt: "Mana Máxima" }, value: "160" },
      { label: { en: "Bonus Damage", pt: "Bônus de Dano" }, value: "8" },
    ],
    description: { en: "Increases Bonus Damage and Max Mana.", pt: "Aumenta o Bônus de Dano e Mana Máxima." },
  },
  {
    id: "Orb_High_Defense_07",
    name: { en: "Increase Melee Evasion", pt: "Aumento de Esquiva Corpo a Corpo" },
    weapon: "Orb",
    category: { en: "Defense", pt: "Defesa" },
    grade: "Uncommon",
    stats: [
      { label: { en: "Melee Evasion", pt: "Esquiva Corpo a Corpo" }, value: "60" },
    ],
    description: { en: "", pt: "Aumento de Esquiva Corpo a Corpo" },
  },
  {
    id: "Orb_High_Defense_08",
    name: { en: "Shield Damage Reduction Concentration", pt: "Concentração de Redução de Dano com Escudo" },
    weapon: "Orb",
    category: { en: "Defense", pt: "Defesa" },
    grade: "Uncommon",
    stats: [
      { label: { en: "Magic Critical Hit Chance", pt: "Chance de Acerto Crítico Mágico" }, value: "-30" },
      { label: { en: "Shield Damage Reduction", pt: "Redução de Dano do Escudo" }, value: "3%" },
    ],
    description: { en: "Shield Damage Reduction Concentration", pt: "Concentração de Redução de Dano com Escudo" },
  },
  {
    id: "Orb_High_DefenseTactic_09",
    name: { en: "Damage Reduction Expertise", pt: "Especialização em Redução de Dano" },
    weapon: "Orb",
    category: { en: "", pt: "" },
    grade: "Uncommon",
    stats: [
      { label: { en: "Weaken Chance", pt: "Chance de Fraqueza" }, value: "25" },
      { label: { en: "Damage Reduction", pt: "Redução de Dano" }, value: "8" },
    ],
    description: { en: "Increases Damage Reduction and Weaken Chance.", pt: "Especialização em Redução de Dano" },
  },
  {
    id: "Orb_High_Def_Skill",
    name: { en: "Celestial Guard", pt: "Guarda Celestial" },
    weapon: "Orb",
    category: { en: "Defense", pt: "Defesa" },
    grade: "Uncommon",
    stats: [

    ],
    description: { en: "", pt: "" },
  },
  {
    id: "Orb_High_Tac_Skill",
    name: { en: "Eternal Body", pt: "Corpo Eterno" },
    weapon: "Orb",
    category: { en: "", pt: "" },
    grade: "Uncommon",
    stats: [

    ],
    description: { en: "", pt: "" },
  },
  {
    id: "Orb_High_Tactic_10",
    name: { en: "All Species Defense", pt: "Defesa de Todas as Espécies" },
    weapon: "Orb",
    category: { en: "", pt: "" },
    grade: "Uncommon",
    stats: [
      { label: { en: "Demon Damage Resistance", pt: "Resistência a Dano contra Demônios" }, value: "16" },
      { label: { en: "Wildkin Damage Resistance", pt: "Resistência a Dano contra Selvagens" }, value: "16" },
      { label: { en: "Undead Damage Resistance", pt: "Resistência a Dano contra Mortos-vivos" }, value: "16" },
      { label: { en: "Humanoid Damage Resistance", pt: "Resistência a Dano contra Humanoides" }, value: "16" },
      { label: { en: "Construct Damage Resistance", pt: "Resistência a Dano contra Construtos" }, value: "16" },
    ],
    description: { en: "Increases all Species Damage Resistance.", pt: "Resistência a Dano contra Demônios" },
  },
  {
    id: "Orb_High_Tactic_11",
    name: { en: "Attack Range Concentration", pt: "Concentração em Alcance de Ataque" },
    weapon: "Orb",
    category: { en: "", pt: "" },
    grade: "Uncommon",
    stats: [
      { label: { en: "Mana Regen", pt: "Regeneração de Mana" }, value: "-22.5" },
      { label: { en: "Range", pt: "Alcance" }, value: "6%" },
    ],
    description: { en: "Increases Attack Range and decreases Mana Regen.", pt: "Concentração em Alcance de Ataque" },
  },
  {
    id: "Orb_High_TacticAttack_12",
    name: { en: "Relentless Stamina Regen", pt: "Regeneração de Vigor Implacável" },
    weapon: "Orb",
    category: { en: "", pt: "" },
    grade: "Uncommon",
    stats: [
      { label: { en: "Stamina Regen", pt: "Regeneração de Vigor" }, value: "2" },
      { label: { en: "Max Damage", pt: "Dano Máx." }, value: "3" },
    ],
    description: { en: "Increases Stamina Regen and Max Damage. Max Damage increases from Lv. 4.", pt: "Regeneração de Vigor Implacável" },
  },
  {
    id: "Orb_High_Util_04",
    name: { en: "Increase Shield Health", pt: "Aumento de Vida do Escudo" },
    weapon: "Orb",
    category: { en: "Utility", pt: "Utilidade" },
    grade: "Uncommon",
    stats: [
      { label: { en: "Shield Health", pt: "Vida do Escudo" }, value: "4%" },
    ],
    description: { en: "", pt: "" },
  },
  {
    id: "Orb_High_Util_05",
    name: { en: "Mana Efficiency Concentration", pt: "Concentração em Eficiência de Mana" },
    weapon: "Orb",
    category: { en: "Utility", pt: "Utilidade" },
    grade: "Uncommon",
    stats: [
      { label: { en: "Mana Cost Efficiency", pt: "Eficiência do Custo de Mana" }, value: "6%" },
      { label: { en: "Buff Duration", pt: "Duração da Vantagem" }, value: "-2%" },
    ],
    description: { en: "Increases Mana Cost Efficiency and decreases Buff Duration.", pt: "Concentração em Eficiência de Mana" },
  },
  {
    id: "Orb_High_UtilDefense_06",
    name: { en: "Debuff Duration Expertise", pt: "Especialização em Duração da Desvantagem" },
    weapon: "Orb",
    category: { en: "", pt: "" },
    grade: "Uncommon",
    stats: [
      { label: { en: "Max Health", pt: "Vida Máxima" }, value: "160" },
      { label: { en: "Debuff Duration", pt: "Duração da Desvantagem" }, value: "-1%" },
    ],
    description: { en: "Increases Debuff Duration and Max Health", pt: "Especialização em Duração da Desvantagem" },
  },
  {
    id: "Orb_High_Util_Skill",
    name: { en: "Cosmic Cycle", pt: "Ciclo Cósmico" },
    weapon: "Orb",
    category: { en: "Utility", pt: "Utilidade" },
    grade: "Uncommon",
    stats: [

    ],
    description: { en: "", pt: "" },
  },
  {
    id: "Orb_Normal_Attack_01",
    name: { en: "Orb Max Damage Increase", pt: "Aumento de Dano Máximo de Orbe" },
    weapon: "Orb",
    category: { en: "Attack", pt: "Ataque" },
    grade: "Common",
    stats: [
      { label: { en: "Max Damage", pt: "Dano Máx." }, value: "10" },
    ],
    description: { en: "", pt: "Aumenta o dano máximo de Orbes." },
  },
  {
    id: "Orb_Normal_Attack_02",
    name: { en: "Attack Speed Concentration", pt: "Concentração em Velocidade de Ataque" },
    weapon: "Orb",
    category: { en: "Attack", pt: "Ataque" },
    grade: "Common",
    stats: [
      { label: { en: "Ranged Defense", pt: "Defesa à Distância" }, value: "-48" },
      { label: { en: "Attack Speed", pt: "Velocidade de Ataque" }, value: "3.2%" },
    ],
    description: { en: "Increases Attack Speed and decreases Ranged Defense.", pt: "Concentração em Velocidade de Ataque" },
  },
  {
    id: "Orb_Normal_Attack_Skill",
    name: { en: "Resonant Heavy Attack", pt: "Ataque Pesado Ressonante" },
    weapon: "Orb",
    category: { en: "Attack", pt: "Ataque" },
    grade: "Common",
    stats: [

    ],
    description: { en: "", pt: "" },
  },
  {
    id: "Orb_Normal_AttackUtil_03",
    name: { en: "Relentless Mana Cost Efficiency", pt: "Eficiência do Custo de Mana Implacável" },
    weapon: "Orb",
    category: { en: "", pt: "" },
    grade: "Common",
    stats: [
      { label: { en: "Mana Cost Efficiency", pt: "Eficiência do Custo de Mana" }, value: "1.6%" },
      { label: { en: "Base Damage", pt: "Dano Base" }, value: "2" },
    ],
    description: { en: "Relentless Mana Cost Efficiency", pt: "Eficiência do Custo de Mana Implacável" },
  },
  {
    id: "Orb_Normal_Defense_07",
    name: { en: "Melee Defense Augment", pt: "Aumento de Defesa Corpo a Corpo" },
    weapon: "Orb",
    category: { en: "Defense", pt: "Defesa" },
    grade: "Common",
    stats: [
      { label: { en: "Melee Defense", pt: "Defesa Corpo a Corpo" }, value: "64" },
    ],
    description: { en: "", pt: "Aumento de Defesa Corpo a Corpo" },
  },
  {
    id: "Orb_Normal_Defense_08",
    name: { en: "Shield Health Concentration", pt: "Concentração em Vida do Escudo" },
    weapon: "Orb",
    category: { en: "Defense", pt: "Defesa" },
    grade: "Common",
    stats: [
      { label: { en: "Hit Chance", pt: "Chance de Acerto" }, value: "-20" },
      { label: { en: "Shield Health Received", pt: "Vida do Escudo Recebido" }, value: "4%" },
    ],
    description: { en: "Increases Shield Health Received and decreases All Hit Chance.", pt: "Aumenta a Vida do Escudo Recebido e reduz a Chance de Acerto Total." },
  },
  {
    id: "Orb_Normal_DefenseTactic_09",
    name: { en: "Max Health Expertise", pt: "Especialização em Vida Máxima" },
    weapon: "Orb",
    category: { en: "", pt: "" },
    grade: "Common",
    stats: [
      { label: { en: "Max Health", pt: "Vida Máxima" }, value: "128" },
      { label: { en: "Magic Endurance", pt: "Tolerância Mágica" }, value: "16" },
      { label: { en: "Melee Endurance", pt: "Tolerância Corpo a Corpo" }, value: "16" },
      { label: { en: "Ranged Endurance", pt: "Tolerância à Distância" }, value: "16" },
    ],
    description: { en: "Increases Max Health and All Endurance.", pt: "Aumenta a Vida Máxima e a Tolerância Total." },
  },
  {
    id: "Orb_Normal_Def_Skill",
    name: { en: "Stellar Flare", pt: "Fogo Estelar" },
    weapon: "Orb",
    category: { en: "Defense", pt: "Defesa" },
    grade: "Common",
    stats: [

    ],
    description: { en: "", pt: "" },
  },
  {
    id: "Orb_Normal_Tac_Skill",
    name: { en: "Galactic Acceleration", pt: "Aceleração Galáctica" },
    weapon: "Orb",
    category: { en: "", pt: "" },
    grade: "Common",
    stats: [

    ],
    description: { en: "", pt: "" },
  },
  {
    id: "Orb_Normal_Tactic_10",
    name: { en: "Increase Movement Speed", pt: "Aumento de Velocidade de Movimento" },
    weapon: "Orb",
    category: { en: "", pt: "" },
    grade: "Common",
    stats: [
      { label: { en: "Movement Speed", pt: "Velocidade de Movimento" }, value: "2.1%" },
    ],
    description: { en: "", pt: "Aumento de Velocidade de Movimento" },
  },
  {
    id: "Orb_Normal_Tactic_11",
    name: { en: "Cooldown Speed Concentration", pt: "Concentração em Velocidade de Recarga" },
    weapon: "Orb",
    category: { en: "", pt: "" },
    grade: "Common",
    stats: [
      { label: { en: "Cooldown Speed", pt: "Velocidade de Recarga" }, value: "2.4%" },
      { label: { en: "Mana Cost Efficiency", pt: "Eficiência do Custo de Mana" }, value: "-2%" },
    ],
    description: { en: "Increases Skill Cooldown Speed and decreases Mana Cost Efficiency.", pt: "Concentração em Velocidade de Recarga" },
  },
  {
    id: "Orb_Normal_TacticAttack_12",
    name: { en: "Enhance Skill Damage", pt: "Aprimoramento de Dano de Habilidade" },
    weapon: "Orb",
    category: { en: "", pt: "" },
    grade: "Common",
    stats: [
      { label: { en: "Skill Damage Boost", pt: "Ampliação de Dano de Habilidade" }, value: "8" },
      { label: { en: "Buff Duration", pt: "Duração da Vantagem" }, value: "1.1%" },
    ],
    description: { en: "Increases Buff Duration and Skill Damage Boost.", pt: "Aprimoramento de Dano de Habilidade" },
  },
  {
    id: "Orb_Normal_Util_04",
    name: { en: "Mana Regen Augment", pt: "Aumento de Regeneração de Mana" },
    weapon: "Orb",
    category: { en: "Utility", pt: "Utilidade" },
    grade: "Common",
    stats: [
      { label: { en: "Mana Regen", pt: "Regeneração de Mana" }, value: "24" },
    ],
    description: { en: "", pt: "" },
  },
  {
    id: "Orb_Normal_Util_05",
    name: { en: "Shield Health Concentration", pt: "Concentração em Vida do Escudo" },
    weapon: "Orb",
    category: { en: "Utility", pt: "Utilidade" },
    grade: "Common",
    stats: [
      { label: { en: "Shield Health", pt: "Vida do Escudo" }, value: "4.8%" },
      { label: { en: "Weaken Chance", pt: "Chance de Fraqueza" }, value: "-30" },
    ],
    description: { en: "Increases Shield Health and decreases Weaken Chance.", pt: "Aumenta a Vida do Escudo e reduz a Chance de Fraqueza." },
  },
  {
    id: "Orb_Normal_UtilDefense_06",
    name: { en: "Enhance Silence Resistance", pt: "Aprimoramento da Resistência a Silêncio" },
    weapon: "Orb",
    category: { en: "", pt: "" },
    grade: "Common",
    stats: [
      { label: { en: "Melee Evasion", pt: "Esquiva Corpo a Corpo" }, value: "24" },
      { label: { en: "Silence Resistance", pt: "Resistência a Silêncio" }, value: "20" },
    ],
    description: { en: "Increases Melee Evasion and Silence Resistance.", pt: "Aprimoramento da Resistência a Silêncio" },
  },
  {
    id: "Orb_Normal_Util_Skill",
    name: { en: "Coordinated Fracture", pt: "Fratura Coordenada" },
    weapon: "Orb",
    category: { en: "Utility", pt: "Utilidade" },
    grade: "Common",
    stats: [

    ],
    description: { en: "", pt: "" },
  },
  {
    id: "Orb_Rare_Attack_01",
    name: { en: "Shielded Target Damage Augment", pt: "Aumento de Dano a Alvos com Escudo" },
    weapon: "Orb",
    category: { en: "Attack", pt: "Ataque" },
    grade: "Rare",
    stats: [
      { label: { en: "Shielded Target Damage Increase", pt: "Aumento de Dano a Alvos com Escudo" }, value: "2.4%" },
    ],
    description: { en: "Shielded Target Damage Increase", pt: "Aumento de Dano a Alvos com Escudo" },
  },
  {
    id: "Orb_Rare_Attack_02",
    name: { en: "Magic Critical Hit Chance Concentration", pt: "Concentração em Chance de Acerto Crítico Mágico" },
    weapon: "Orb",
    category: { en: "Attack", pt: "Ataque" },
    grade: "Rare",
    stats: [
      { label: { en: "Ranged Evasion", pt: "Esquiva à Distância" }, value: "-54" },
      { label: { en: "Magic Critical Hit Chance", pt: "Chance de Acerto Crítico Mágico" }, value: "72" },
    ],
    description: { en: "Magic Critical Hit Chance Concentration", pt: "Concentração em Chance de Acerto Crítico Mágico" },
  },
  {
    id: "Orb_Rare_Attack_Skill",
    name: { en: "Flow Shift", pt: "Deslocamento de Fluxo" },
    weapon: "Orb",
    category: { en: "Attack", pt: "Ataque" },
    grade: "Rare",
    stats: [

    ],
    description: { en: "", pt: "" },
  },
  {
    id: "Orb_Rare_AttackUtil_03",
    name: { en: "Relentless Mana Regen", pt: "Regeneração de Mana Implacável" },
    weapon: "Orb",
    category: { en: "", pt: "" },
    grade: "Rare",
    stats: [
      { label: { en: "Mana Regen", pt: "Regeneração de Mana" }, value: "18" },
      { label: { en: "Attack Speed", pt: "Velocidade de Ataque" }, value: "1.6%" },
    ],
    description: { en: "Increases Attack Speed and Mana Regen.", pt: "Aumenta a Velocidade de Ataque e a Regeneração de Mana." },
  },
  {
    id: "Orb_Rare_Defense_07",
    name: { en: "Max Health Augment", pt: "Aumento de Vida Máxima" },
    weapon: "Orb",
    category: { en: "Defense", pt: "Defesa" },
    grade: "Rare",
    stats: [
      { label: { en: "Max Health", pt: "Vida Máxima" }, value: "384" },
    ],
    description: { en: "", pt: "" },
  },
  {
    id: "Orb_Rare_Defense_08",
    name: { en: "Heavy Attack Resistance Concentration", pt: "Concentração em Resistência a Ataque Pesado" },
    weapon: "Orb",
    category: { en: "Defense", pt: "Defesa" },
    grade: "Rare",
    stats: [
      { label: { en: "Magic Heavy Attack Chance", pt: "Chance de Ataque Pesado Mágico" }, value: "-36" },
      { label: { en: "Heavy Attack Damage Resistance", pt: "Resistência a Dano de Ataque Pesado" }, value: "4.8%" },
    ],
    description: { en: "Heavy Attack Resistance Concentration", pt: "Concentração em Resistência a Ataque Pesado" },
  },
  {
    id: "Orb_Rare_DefenseTactic_09",
    name: { en: "Skill Damage Resistance Expertise", pt: "Especialização em Resistência a Dano de Habilidade" },
    weapon: "Orb",
    category: { en: "", pt: "" },
    grade: "Rare",
    stats: [
      { label: { en: "Skill Damage Resistance", pt: "Resistência a Dano de Habilidade" }, value: "12" },
      { label: { en: "Buff Duration", pt: "Duração da Vantagem" }, value: "1.6%" },
    ],
    description: { en: "Skill Damage Resistance Expertise", pt: "Especialização em Resistência a Dano de Habilidade" },
  },
  {
    id: "Orb_Rare_Def_Skill",
    name: { en: "Dimensional Seal", pt: "Selo Dimensional" },
    weapon: "Orb",
    category: { en: "Defense", pt: "Defesa" },
    grade: "Rare",
    stats: [

    ],
    description: { en: "", pt: "" },
  },
  {
    id: "Orb_Rare_Tac_Skill",
    name: { en: "Spatial Rush", pt: "Corrida Espacial" },
    weapon: "Orb",
    category: { en: "", pt: "" },
    grade: "Rare",
    stats: [

    ],
    description: { en: "", pt: "" },
  },
  {
    id: "Orb_Rare_Tactic_10",
    name: { en: "Relentless All Species Damage", pt: "Dano de Todas as Espécies Implacável" },
    weapon: "Orb",
    category: { en: "", pt: "" },
    grade: "Rare",
    stats: [
      { label: { en: "Demon Damage Boost", pt: "Ampliação de Dano contra Demônios" }, value: "19.2" },
      { label: { en: "Wildkin Damage Boost", pt: "Ampliação de Dano contra Selvagens" }, value: "19.2" },
      { label: { en: "Undead Damage Boost", pt: "Ampliação de Dano contra Mortos-vivos" }, value: "19.2" },
      { label: { en: "Humanoid Damage Boost", pt: "Ampliação de Dano contra Humanoides" }, value: "19.2" },
      { label: { en: "Construct Damage Boost", pt: "Ampliação de Dano contra Construtos" }, value: "19.2" },
    ],
    description: { en: "Increases all Species Damage Boost.", pt: "Dano de Todas as Espécies Implacável" },
  },
  {
    id: "Orb_Rare_Tactic_11",
    name: { en: "Dexterity Enchantment Sage", pt: "Sábio de Encantamento de Destreza" },
    weapon: "Orb",
    category: { en: "", pt: "" },
    grade: "Rare",
    stats: [
      { label: { en: "Dexterity", pt: "Destreza" }, value: "2" },
      { label: { en: "Max Mana", pt: "Mana Máxima" }, value: "-288" },
      { label: { en: "Buff Duration", pt: "Duração da Vantagem" }, value: "4.8%" },
    ],
    description: { en: "Increases Buff Duration and decreases Max Mana.", pt: "Sábio de Encantamento de Destreza" },
  },
  {
    id: "Orb_Rare_TacticAttack_12",
    name: { en: "Skill Damage Expertise", pt: "Especialização em Dano de Habilidade" },
    weapon: "Orb",
    category: { en: "", pt: "" },
    grade: "Rare",
    stats: [
      { label: { en: "Range", pt: "Alcance" }, value: "2.4%" },
      { label: { en: "Skill Damage Boost", pt: "Ampliação de Dano de Habilidade" }, value: "12" },
    ],
    description: { en: "Increases Attack Range and Skill Damage Boost.", pt: "Especialização em Dano de Habilidade" },
  },
  {
    id: "Orb_Rare_Util_04",
    name: { en: "Distortion Veil Time Increase", pt: "Aumento de Tempo de Véu de Distorção" },
    weapon: "Orb",
    category: { en: "Utility", pt: "Utilidade" },
    grade: "Rare",
    stats: [

    ],
    description: { en: "Increases Distortion Veil duration by 1s.", pt: "Aumento de Tempo de Véu de Distorção" },
  },
  {
    id: "Orb_Rare_Util_05",
    name: { en: "True Sage's Shield of Wisdom", pt: "Escudo da Sabedoria do Verdadeiro Sábio" },
    weapon: "Orb",
    category: { en: "Utility", pt: "Utilidade" },
    grade: "Rare",
    stats: [
      { label: { en: "Wisdom", pt: "Sabedoria" }, value: "2" },
      { label: { en: "Stun Chance", pt: "Chance de Atordoamento" }, value: "-45" },
      { label: { en: "Shield Health", pt: "Vida do Escudo" }, value: "7.2%" },
    ],
    description: { en: "Increases Shield Health and decreases Stun Chance.", pt: "Escudo da Sabedoria do Verdadeiro Sábio" },
  },
  {
    id: "Orb_Rare_UtilDefense_06",
    name: { en: "Regen Augment", pt: "Aumento de Regeneração" },
    weapon: "Orb",
    category: { en: "", pt: "" },
    grade: "Rare",
    stats: [
      { label: { en: "Health Regen", pt: "Regeneração de Vida" }, value: "24" },
      { label: { en: "Mana Regen", pt: "Regeneração de Mana" }, value: "18" },
    ],
    description: { en: "Increases Health Regen and Mana Regen.", pt: "Aumenta a Regeneração de Vida e a Regeneração de Mana." },
  },
  {
    id: "Orb_Rare_Util_Skill",
    name: { en: "Tranquil Will", pt: "Vontade Tranquila" },
    weapon: "Orb",
    category: { en: "Utility", pt: "Utilidade" },
    grade: "Rare",
    stats: [

    ],
    description: { en: "", pt: "" },
  },
  {
    id: "WM_Common_SKILL_013",
    name: { en: "Battle Prep", pt: "Preparativos de Batalha" },
    weapon: "",
    category: { en: "", pt: "" },
    grade: "Epic",
    stats: [

    ],
    description: { en: "", pt: "" },
  },
  {
    id: "WM_Common_SKILL_014",
    name: { en: "Guardian's Awakening", pt: "Despertar do Guardião" },
    weapon: "",
    category: { en: "", pt: "" },
    grade: "Epic",
    stats: [

    ],
    description: { en: "", pt: "" },
  },
  {
    id: "WM_Common_SKILL_015",
    name: { en: "Windy Veil", pt: "Véu Ventoso" },
    weapon: "",
    category: { en: "", pt: "" },
    grade: "Epic",
    stats: [

    ],
    description: { en: "", pt: "" },
  },
  {
    id: "WM_Common_SKILL_016",
    name: { en: "Survival Enhancement", pt: "Aprimoramento de Sobrevivência" },
    weapon: "",
    category: { en: "", pt: "" },
    grade: "Epic",
    stats: [

    ],
    description: { en: "", pt: "" },
  },
  {
    id: "WM_Common_SKILL_017",
    name: { en: "Fighting Instincts", pt: "Instintos de Luta" },
    weapon: "",
    category: { en: "", pt: "" },
    grade: "Epic",
    stats: [

    ],
    description: { en: "", pt: "" },
  },
  {
    id: "WM_Common_SKILL_018",
    name: { en: "Overcoming Pain", pt: "Superando a Dor" },
    weapon: "",
    category: { en: "", pt: "" },
    grade: "Epic",
    stats: [

    ],
    description: { en: "", pt: "" },
  },
  {
    id: "WM_Common_SKILL_019",
    name: { en: "Duelist", pt: "Duelista" },
    weapon: "",
    category: { en: "", pt: "" },
    grade: "Epic",
    stats: [

    ],
    description: { en: "", pt: "" },
  },
  {
    id: "WM_Common_SKILL_020",
    name: { en: "Shielded by Unity", pt: "Escudo da Unidade" },
    weapon: "",
    category: { en: "", pt: "" },
    grade: "Epic",
    stats: [

    ],
    description: { en: "", pt: "" },
  },
  {
    id: "WM_Common_SKILL_021",
    name: { en: "Defense Null", pt: "Defesa Nula" },
    weapon: "",
    category: { en: "", pt: "" },
    grade: "Epic",
    stats: [

    ],
    description: { en: "", pt: "" },
  },
  {
    id: "WM_Common_SKILL_022",
    name: { en: "Guardian's Blessing", pt: "Bênção do Guardião" },
    weapon: "",
    category: { en: "", pt: "" },
    grade: "Epic",
    stats: [

    ],
    description: { en: "", pt: "" },
  },
]
