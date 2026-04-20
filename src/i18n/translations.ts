export type Lang = 'pt-BR' | 'en'

export interface Translations {
  // Sidebar
  sidebar: {
    eyebrow: string
    title: string
    tagline: string
    groups: { overview: string; manage: string; analysis: string; preferences: string }
    nav: { dashboard: string; builds: string; calculator: string; comparator: string; sensitivity: string; rotation: string; logreader: string; settings: string }
    footer: string
  }
  // Páginas
  common: {
    saved: string; best: string; active: string; noBuilds: string; selectBuild: string
    cancel: string; save: string; delete: string; import: string; export: string
    dps: string; crit: string; heavy: string; weapon: string; skill: string
  }
  dashboard: {
    title: string; subtitle: string
    kpi: { savedBuilds: string; bestDps: string; critActive: string; heavyActive: string; dpsActive: string }
    chart: string; activeBuild: string; switchBuild: string; noBuild: string
    features: { calc: string; calcSub: string; comp: string; compSub: string; sens: string; sensSub: string }
  }
  calculator: {
    title: string; subtitle: string
    sections: { skill: string; build: string; target: string }
    labels: { castTime: string; cooldown: string; critChance: string; heavyChance: string; critDmg: string; heavyDmg: string; skillBoost: string; bonusDmg: string; species: string; minWeapon: string; maxWeapon: string; targetDef: string; targetEvasion: string; monsterBoost: string; dmgBuff: string; skillBasePct: string; skillBonusBase: string; bossCrit: string; bossHeavy: string; cdrPct: string; atkSpeedPct: string }
    results: { damagePerCast: string; total60s: string; dpsPerSec: string; bestBuild: string }
    elasticity: { title: string; additive: string; swap: string; step: string; iterations: string }
  }
  comparator: {
    title: string; subtitle: string
    select: string; noBuilds: string; needTwo: string
    charts: { stats: string; dps: string }
    table: string
  }
  sensitivity: {
    title: string; subtitle: string
    source: string; manual: string; dpsBase: string
    recommendation: string; prioritize: string; chart: string; ranking: string; deltas: string
  }
  builds: {
    title: string; subtitle: string
    newBuild: string; import: string; export: string; delete: string
    stats: { dps: string; crit: string; heavy: string; critDmg: string; weapon: string; skillBoost: string }
    editor: { title: string; name: string; weapon: string; save: string; cancel: string }
  }
  rotation: {
    title: string; subtitle: string
  }
  logreader: {
    title: string; subtitle: string
  }
  settings: {
    title: string; subtitle: string
    language: string; languageLabel: string
    theme: string; version: string
  }
}

export const TRANSLATIONS: Record<Lang, Translations> = {
  'pt-BR': {
    sidebar: {
      eyebrow: 'AgrMonteiro · Tier2',
      title: 'Command Lab',
      tagline: 'Análise de elite, na palma da sua mão',
      groups: { overview: 'Overview', manage: 'Gerenciar', analysis: 'Análise', preferences: 'Preferências' },
      nav: { dashboard: 'War Room', builds: 'Builds', calculator: 'Calculadora PvE', comparator: 'Comparador', sensitivity: 'Sensibilidade', rotation: 'Rotação', logreader: 'Leitor de Logs', settings: 'Configurações' },
      footer: 'Electron + React',
    },
    common: {
      saved: 'salvas', best: 'Melhor', active: 'ativo', noBuilds: 'Nenhuma build salva. Vá em Builds para importar.',
      selectBuild: 'Selecione uma build', cancel: 'Cancelar', save: 'Salvar', delete: 'Deletar',
      import: 'Importar', export: 'Exportar',
      dps: 'DPS', crit: 'Crit', heavy: 'Heavy', weapon: 'Arma', skill: 'Skill',
    },
    dashboard: {
      title: 'War Room',
      subtitle: 'Painel central do Tier2 Command Lab — DPS estimado, stats e comparação de builds salvas.',
      kpi: { savedBuilds: 'Builds salvas', bestDps: 'Melhor DPS', critActive: 'Crit (ativo)', heavyActive: 'Heavy (ativo)', dpsActive: 'DPS (ativo)' },
      chart: 'DPS Estimado por Build', activeBuild: 'Build Ativa', switchBuild: 'Trocar build ativa',
      noBuild: 'Selecione uma build em Builds',
      features: {
        calc: 'Calculadora PvE', calcSub: 'Compare 4 builds com fórmulas Maxroll. Crit, Heavy e Elasticidade.',
        comp: 'Comparador', compSub: 'Radar spider-chart normalizado entre builds salvas.',
        sens: 'Sensibilidade', sensSub: 'Qual stat dá mais DPS por unidade? Ranking e barras de impacto.',
      },
    },
    calculator: {
      title: 'Calculadora PvE',
      subtitle: 'Compare até 4 builds simultaneamente. Fórmulas Maxroll com crit, heavy e elasticidade de stat.',
      sections: { skill: 'Skill', build: 'Build', target: 'Alvo' },
      labels: {
        castTime: 'Tempo de Cast (s)', cooldown: 'Cooldown Base (s)', critChance: 'Crit Hit Chance',
        heavyChance: 'Heavy Attack Chance', critDmg: 'Crit Damage %', heavyDmg: 'Heavy Dmg Compl.',
        skillBoost: 'Skill Dmg Boost', bonusDmg: 'Bonus Damage', species: 'Species Boost',
        minWeapon: 'Min Weapon Dmg', maxWeapon: 'Max Weapon Dmg', targetDef: "Target's Defense",
        targetEvasion: "Target's Evasion", monsterBoost: 'Monster Dmg Boost %', dmgBuff: 'Damage Buff %',
        skillBasePct: 'Skill Base Dmg %', skillBonusBase: 'Skill Bonus Base Dmg',
        bossCrit: 'Boss Crit Chance (delta)', bossHeavy: 'Boss Heavy Chance (delta)',
        cdrPct: 'Cooldown Speed %', atkSpeedPct: 'Attack Speed %',
      },
      results: { damagePerCast: 'dano por cast', total60s: '60s total:', dpsPerSec: 'DPS/s:', bestBuild: 'MELHOR' },
      elasticity: { title: 'Elasticidade de Stat', additive: 'Aditivas', swap: 'Permuta', step: 'Step', iterations: 'Iterações' },
    },
    comparator: {
      title: 'Comparador de Builds', subtitle: 'Selecione até 6 builds · legenda ou card para ocultar série · barra para detalhes · ícone expand para maximizar',
      select: 'Selecionar Builds', noBuilds: 'Nenhuma build salva. Vá em Builds para importar.', needTwo: 'Selecione pelo menos 2 builds para comparar.',
      charts: { stats: '📊 Stats Comparados (normalizado 0–100)', dps: '📊 DPS Comparativo' },
      table: '📋 Tabela Detalhada',
    },
    sensitivity: {
      title: 'Análise de Sensibilidade',
      subtitle: 'Descubra qual stat aumenta mais o DPS por unidade investida. Ranking automático com pesos normalizados.',
      source: 'Build de referência', manual: 'Manual (DEFAULT)', dpsBase: 'DPS base',
      recommendation: 'Recomendação', prioritize: '↑ Priorizar:', chart: '📊 Impacto por Stat (% do ganho total)',
      ranking: '🏆 Ranking de Prioridade', deltas: 'Incrementos usados na simulação:',
    },
    builds: {
      title: 'Builds', subtitle: 'Gerencie suas builds. Importe do quest log ou edite manualmente.',
      newBuild: 'Nova Build', import: 'Importar', export: 'Exportar', delete: 'Deletar',
      stats: { dps: 'DPS', crit: 'Crit', heavy: 'Heavy', critDmg: 'Crit Dmg %', weapon: 'Max Weapon', skillBoost: 'Skill Boost' },
      editor: { title: 'Editar Build', name: 'Nome da Build', weapon: 'Combo de Armas', save: 'Salvar', cancel: 'Cancelar' },
    },
    rotation: { title: 'Rotação', subtitle: 'Monte e simule sua rotação de skills.' },
    logreader: { title: 'Leitor de Logs', subtitle: 'Analise seus combat logs do Throne & Liberty.' },
    settings: {
      title: 'Configurações', subtitle: 'Preferências do Tier2 Command Lab.',
      language: 'Idioma', languageLabel: 'Idioma da Interface',
      theme: 'Tema', version: 'Versão',
    },
  },
  'en': {
    sidebar: {
      eyebrow: 'AgrMonteiro · Tier2',
      title: 'Command Lab',
      tagline: 'Elite analysis, at your fingertips',
      groups: { overview: 'Overview', manage: 'Manage', analysis: 'Analysis', preferences: 'Preferences' },
      nav: { dashboard: 'War Room', builds: 'Builds', calculator: 'PvE Calculator', comparator: 'Comparator', sensitivity: 'Sensitivity', rotation: 'Rotation', logreader: 'Log Reader', settings: 'Settings' },
      footer: 'Electron + React',
    },
    common: {
      saved: 'saved', best: 'Best', active: 'active', noBuilds: 'No builds saved. Go to Builds to import.',
      selectBuild: 'Select a build', cancel: 'Cancel', save: 'Save', delete: 'Delete',
      import: 'Import', export: 'Export',
      dps: 'DPS', crit: 'Crit', heavy: 'Heavy', weapon: 'Weapon', skill: 'Skill',
    },
    dashboard: {
      title: 'War Room',
      subtitle: 'Tier2 Command Lab central panel — estimated DPS, stats and saved build comparison.',
      kpi: { savedBuilds: 'Saved builds', bestDps: 'Best DPS', critActive: 'Crit (active)', heavyActive: 'Heavy (active)', dpsActive: 'DPS (active)' },
      chart: 'Estimated DPS per Build', activeBuild: 'Active Build', switchBuild: 'Switch active build',
      noBuild: 'Select a build in Builds',
      features: {
        calc: 'PvE Calculator', calcSub: 'Compare 4 builds with Maxroll formulas. Crit, Heavy and Elasticity.',
        comp: 'Comparator', compSub: 'Normalized spider-chart radar between saved builds.',
        sens: 'Sensitivity', sensSub: 'Which stat gives the most DPS per unit? Ranking and impact bars.',
      },
    },
    calculator: {
      title: 'PvE Calculator',
      subtitle: 'Compare up to 4 builds simultaneously. Maxroll formulas with crit, heavy and stat elasticity.',
      sections: { skill: 'Skill', build: 'Build', target: 'Target' },
      labels: {
        castTime: 'Cast Time (s)', cooldown: 'Base Cooldown (s)', critChance: 'Crit Hit Chance',
        heavyChance: 'Heavy Attack Chance', critDmg: 'Crit Damage %', heavyDmg: 'Heavy Dmg Compl.',
        skillBoost: 'Skill Dmg Boost', bonusDmg: 'Bonus Damage', species: 'Species Boost',
        minWeapon: 'Min Weapon Dmg', maxWeapon: 'Max Weapon Dmg', targetDef: "Target's Defense",
        targetEvasion: "Target's Evasion", monsterBoost: 'Monster Dmg Boost %', dmgBuff: 'Damage Buff %',
        skillBasePct: 'Skill Base Dmg %', skillBonusBase: 'Skill Bonus Base Dmg',
        bossCrit: 'Boss Crit Chance (delta)', bossHeavy: 'Boss Heavy Chance (delta)',
        cdrPct: 'Cooldown Speed %', atkSpeedPct: 'Attack Speed %',
      },
      results: { damagePerCast: 'damage per cast', total60s: '60s total:', dpsPerSec: 'DPS/s:', bestBuild: 'BEST' },
      elasticity: { title: 'Stat Elasticity', additive: 'Additive', swap: 'Swap', step: 'Step', iterations: 'Iterations' },
    },
    comparator: {
      title: 'Build Comparator', subtitle: 'Select up to 6 builds · legend or card to hide series · bar for details · expand icon to maximize',
      select: 'Select Builds', noBuilds: 'No builds saved. Go to Builds to import.', needTwo: 'Select at least 2 builds to compare.',
      charts: { stats: '📊 Compared Stats (normalized 0–100)', dps: '📊 Comparative DPS' },
      table: '📋 Detailed Table',
    },
    sensitivity: {
      title: 'Sensitivity Analysis',
      subtitle: 'Discover which stat increases DPS the most per unit invested. Automatic ranking with normalized weights.',
      source: 'Reference build', manual: 'Manual (DEFAULT)', dpsBase: 'Base DPS',
      recommendation: 'Recommendation', prioritize: '↑ Prioritize:', chart: '📊 Impact per Stat (% of total gain)',
      ranking: '🏆 Priority Ranking', deltas: 'Increments used in simulation:',
    },
    builds: {
      title: 'Builds', subtitle: 'Manage your builds. Import from quest log or edit manually.',
      newBuild: 'New Build', import: 'Import', export: 'Export', delete: 'Delete',
      stats: { dps: 'DPS', crit: 'Crit', heavy: 'Heavy', critDmg: 'Crit Dmg %', weapon: 'Max Weapon', skillBoost: 'Skill Boost' },
      editor: { title: 'Edit Build', name: 'Build Name', weapon: 'Weapon Combo', save: 'Save', cancel: 'Cancel' },
    },
    rotation: { title: 'Rotation', subtitle: 'Build and simulate your skill rotation.' },
    logreader: { title: 'Log Reader', subtitle: 'Analyze your Throne & Liberty combat logs.' },
    settings: {
      title: 'Settings', subtitle: 'Tier2 Command Lab preferences.',
      language: 'Language', languageLabel: 'Interface Language',
      theme: 'Theme', version: 'Version',
    },
  },
}
