import type { BuildStats } from './types'

/**
 * Texto de ajuda para cada atributo de BuildStats — explicação + onde achar no jogo.
 * Compartilhado entre a Calculadora e o editor de Builds para manter consistência.
 */
export interface StatHelp {
  /** O que é o campo */
  help: string
  /** Onde achar o valor no jogo */
  where?: string
}

export const STAT_HELP: Partial<Record<keyof BuildStats, StatHelp>> = {
  skillBaseDamagePct: {
    help: 'Dano base da habilidade em porcentagem (ex: 595 = 595%). É o percentual que a própria skill aplica sobre o dano da arma.',
    where: 'Tooltip da habilidade no jogo, ou na aba de Skills do Questlog.',
  },
  skillBonusBaseDmg: {
    help: 'Parcela plana (fixa) somada ao dano base da habilidade, além do percentual.',
    where: 'Tooltip da habilidade / Questlog. Se não tiver, deixe 0.',
  },
  monsterDmgBoostPct: {
    help: 'Multiplicador de dano contra monstros (PvE). Padrão 120 = ×1,2. Inclui bônus de dano em masmorras e contra monstros.',
    where: 'Personagem → Atributos → seção de dano PvE / "Dano contra Monstros".',
  },
  dmgBuffPct: {
    help: 'Soma dos buffs de dano ativos (comida, poções, bênçãos). Padrão 120. Use 100 para neutro (sem buff).',
    where: 'Some os buffs temporários ativos durante o combate que quer simular.',
  },
  skillCooldown: {
    help: 'Recarga base da habilidade em segundos, antes de qualquer redução de cooldown.',
    where: 'Tooltip da habilidade no jogo.',
  },
  skillCastTime: {
    help: 'Tempo de conjuração da habilidade em segundos, antes da velocidade de ataque.',
    where: 'Tooltip da habilidade. Skills instantâneas usam 0.',
  },
  minWeaponDmg: {
    help: 'Dano mínimo da sua arma principal.',
    where: 'Personagem → Atributos → "Dano da Arma" (o primeiro número do intervalo Min–Max).',
  },
  maxWeaponDmg: {
    help: 'Dano máximo da sua arma principal.',
    where: 'Personagem → Atributos → "Dano da Arma" (o segundo número do intervalo Min–Max).',
  },
  cdrPct: {
    help: 'Redução de recarga em %. Cap de 120%. Ex: 30 = recargas 30% mais rápidas.',
    where: 'Personagem → Atributos → "Velocidade de Recarga".',
  },
  attackSpeedPct: {
    help: 'Velocidade de ataque adicional em %. Cap de 150%. Reduz o tempo de cast das habilidades.',
    where: 'Personagem → Atributos → "Velocidade de Ataque".',
  },
  critHitChance: {
    help: 'Seu atributo BRUTO de Acerto Crítico (o número, não a %). O app converte em chance real automaticamente.',
    where: 'Personagem → Atributos → seção Ofensiva → "Acerto Crítico".',
  },
  bossCritChance: {
    help: 'Bônus EXTRA de crítico apenas contra Chefes — insira só a diferença (valor vs-Chefe menos o crítico normal). Ex: quest log mostra 700 contra chefe e 500 normal → digite 200.',
    where: 'Compare "Acerto Crítico" normal e vs-Chefe no quest log. Sem esse dado, deixe 0.',
  },
  heavyAttackChance: {
    help: 'Seu atributo BRUTO de Ataque Pesado (o número, não a %). O app converte em chance real.',
    where: 'Personagem → Atributos → "Ataque Pesado".',
  },
  bossHeavyChance: {
    help: 'Bônus EXTRA de ataque pesado apenas contra Chefes — insira só a diferença. Ex: quest log mostra 400 contra chefe e 300 normal → digite 100.',
    where: 'Compare "Ataque Pesado" normal e vs-Chefe no quest log. Sem esse dado, deixe 0.',
  },
  heavyAttackDmgComp: {
    help: 'Dano extra do Ataque Pesado ACIMA de 100%. Digite só o complemento: se o jogo mostra 114%, digite 14.',
    where: 'Personagem → Atributos → "Dano de Ataque Pesado".',
  },
  skillDmgBoost: {
    help: 'Atributo "Ampliação de Dano de Habilidade". Aumenta o dano das skills (com retornos decrescentes).',
    where: 'Personagem → Atributos → "Ampliação de Dano de Habilidade".',
  },
  bonusDmg: {
    help: 'Dano bônus plano somado ao final do cálculo (com retornos decrescentes).',
    where: 'Personagem → Atributos → "Bônus de Dano".',
  },
  critDmgPct: {
    help: 'Dano crítico adicional em %. Ex: 50 = +50% de dano nos acertos críticos.',
    where: 'Personagem → Atributos → "Dano Crítico".',
  },
  speciesDmgBoost: {
    help: 'Bônus de dano contra a espécie do alvo (Humanoide, Besta, Morto-vivo, etc.).',
    where: 'Vem de equipamentos e runas com "Dano contra [espécie]". Sem isso, deixe 0.',
  },
  targetDefense: {
    help: 'Defesa do alvo. Use 0 para um manequim de teste; aumente para simular a defesa de um chefe.',
    where: 'Estimativa do alvo. Se não souber, deixe 0 para um teste puro.',
  },
  targetEvasion: {
    help: 'Esquiva do alvo. Use 0 para um manequim de teste.',
    where: 'Estimativa do alvo. Deixe 0 se não souber.',
  },
  targetEndurance: {
    help: 'Endurance do alvo — reduz a sua chance de crítico efetiva. Chefes têm Endurance alta.',
    where: 'Estimativa do alvo. Deixe 0 para medir seu potencial puro de crítico.',
  },
}
