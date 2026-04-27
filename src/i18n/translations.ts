export type Lang = 'pt-BR' | 'en'

export interface Translations {
  // Sidebar
  sidebar: {
    eyebrow: string
    title: string
    tagline: string
    groups: { overview: string; manage: string; analysis: string; preferences: string }
    nav: { dashboard: string; builds: string; calculator: string; comparator: string; sensitivity: string; rotation: string; logreader: string; settings: string; skillsdb: string; masterytrees: string }
    footer: string
    checking: string
    upToDate: string
    checkUpdate: string
  }
  // Componentes globais
  common: {
    saved: string; best: string; active: string; noBuilds: string; selectBuild: string
    cancel: string; save: string; delete: string; import: string; export: string
    dps: string; crit: string; heavy: string; weapon: string; skill: string
  }
  migration: {
    title: string; description: string; understood: string
  }
  update: {
    available: string; downloading: string; ready: string; restart: string
  }
  // Páginas
  dashboard: {
    title: string; subtitle: string
    kpi: { savedBuilds: string; bestDps: string; critActive: string; heavyActive: string; dpsActive: string }
    chart: string; activeBuild: string; switchBuild: string; noBuild: string
    features: { calc: string; calcSub: string; comp: string; compSub: string; sens: string; sensSub: string }
    chartTooltipDps: string
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
    visibility: { show: string; hide: string }
    kpi: { best: string; hidden: string; base: string }
    detail: { pointSelected: string; normalized: string; realValue: string }
    chart: { maximizeTooltip: string; maximizeBtn: string; showValues: string }
    fullscreen: { closeHint: string; closeBtn: string }
  }
  sensitivity: {
    title: string; subtitle: string
    source: string; manual: string; dpsBase: string
    recommendation: string; prioritize: string; chart: string; ranking: string; deltas: string
    manualPlaceholder: string
    statInfo: string; statInfoTotal: string
    noStats: string
    deltaLabel: string
    tooltipWeight: string
  }
  builds: {
    title: string; subtitle: string
    newBuild: string; import: string; export: string; delete: string
    stats: { dps: string; crit: string; heavy: string; critDmg: string; weapon: string; skillBoost: string }
    editor: {
      title: string; name: string; weapon: string; save: string; cancel: string
      statsTab: string; calcTab: string; attributes: string; filterStats: string; other: string; notes: string
      calc: { hint: string; replicate: string; replicateTitle: string }
    }
    weaponHint: string
    empty: string
    questlog: { title: string; placeholder: string; button: string; importing: string }
    create: { name: string; placeholder: string; weapons: string; weaponsPlaceholder: string; button: string }
    pending: { title: string; save: string; discard: string; weaponsPlaceholder: string; statsExtracted: string }
    status: {
      saved: string; importing: string; imported: string; importCancelled: string
      cancelled: string; discarded: string; deleted: string; exported: string
      reimporting: string; reimported: string; created: string
      downloading: string; starting: string; extracting: string
    }
    cancel: { error: string }
    queue: { title: string; buildSingular: string; buildPlural: string; start: string; pause: string; clear: string }
    card: {
      active: string; edited: string; stats: string; attributes: string
      activate: string; activateStatus: string; edit: string; close: string
      reimport: string; queueAdd: string; queueRemove: string
      queueAddTitle: string; queueRemoveTitle: string; export: string; deleteBtn: string
    }
    delete: { confirm: string }
  }
  rotation: {
    title: string; subtitle: string
    empty: string
    autoSave: { saving: string; saved: string }
    card: {
      dpsTotal: string; timeline: string; seconds: string
      skillsActive: string; skillsActivePlural: string
      dots: string; dotsPlural: string
      buffs: string; buffsPlural: string
    }
    character: {
      title: string; importButton: string; importTooltip: string
      weapons: string; weaponMain: string; autoAttack: string
      min: string; max: string
      weaponSpeed: string; weaponSpeedTooltip: string
      weaponSecondary: string; skillsOnly: string
      stellarite: string; stellariteNone: string; stellariteCommon: string; stellariteRare: string
      combatStats: string
      cooldownReduction: string; cooldownCap: string
      attackSpeed: string; attackSpeedCap: string
      advantageDuration: string
      critChance: string; critChanceBoss: string; critDamage: string
      heavyChance: string; heavyDamage: string
      modifiers: string
      skillDmgBoost: string; skillDmgBoostTooltip: string
      speciesBoost: string; speciesBoostTooltip: string
      bonusDamage: string; bonusDamageTooltip: string
      itemBoost: string; itemBoostTooltip: string
      target: string; targetDefense: string; targetEndurance: string; enduranceNote: string
    }
    skills: { title: string; addButton: string; emptyState: string; skillName: string; toggleTooltip: string; toggleTooltipInactive: string; removeTooltip: string }
    dots: { title: string; addButton: string; emptyState: string; dotName: string }
    buffs: { title: string; addButton: string; emptyState: string; buffName: string; toggleTooltip: string; toggleTooltipInactive: string; removeTooltip: string }
    rules: { title: string; addButton: string; emptyState: string; removeTooltip: string }
    timeline: {
      title: string; instruction: string
      clearAllButton: string; clearAllTooltip: string; clearColumnTooltip: string
      noSkills: string; planned: string; realLog: string
      importButton: string; updateButton: string
    }
    importModal: { title: string; description: string; emptyState: string; emptyStateNote: string }
    sidebar: { newRotation: string; rotationName: string; deleteTooltip: string }
  }
  logreader: {
    title: string; subtitle: string
    sidebar: { character: string; weaponAnalysis: string; logfiles: string; targets: string; allTargets: string; folderButton: string }
    header: { characterLabel: string; detectedWeapons: string; analyzing: string; splitViewTitle: string; splitViewOpen: string; splitViewClose: string; changeFolder: string; refreshList: string }
    main: { processing: string; selectLog: string }
    pulls: { title: string; clearCuts: string; sendToRanking: string; sentToRanking: string; allCombat: string; fullLogData: string; pullNumber: string; splitPull: string }
    split: { title: string; before: string; after: string; hits: string; confirm: string; cancel: string }
    stats: { normalizationLabel: string; pullIsolated: string; pullIsolatedSuffix: string; totalDamage: string; dpsLabel: string; duration: string }
    chart: { title: string; byWeapon: string; bySkill: string; stacked: string; individual: string; enableAll: string; disableAll: string; damagePerWeapon: string; movingAvg: string }
    unmapped: { title: string; skillsLabel: string; description: string }
    breakdown: { title: string; selectSkill: string }
    timeline: { title: string; show: string; hide: string; fullViewTitle: string; fullViewLabel: string; export: string; exportAlert: string; exportSkills: string; exportCasts: string }
    table: { title: string; weapon: string; totalDamage: string; dps: string; ratio: string; hits: string; averageInterval: string; crit: string; heavy: string; critHeavy: string; undefinedWeapon: string; intervalTooltip: string }
    renderbox: { min: string; max: string; average: string; ratio: string; dps: string }
    error: { folderSelection: string; folderSelectionDetails: string; folderPrompt: string }
    delete: { confirm: string; error: string; buttonTitle: string }
  }
  pullranking: {
    title: string; subtitle: string
    filter: { target: string; targetAll: string; weapons: string; weaponsAll: string; duration: string; durationAll: string; durationShort: string; durationLong: string; sortBy: string; sortDmg: string; sortDps: string }
    empty: { title: string; description: string }
    noResults: string
    comment: { placeholder: string }
    dps: { label: string }
  }
  nav: {
    pullranking: string; pullrankingSub: string
  }
  settings: {
    title: string; subtitle: string
    language: string; languageLabel: string
    theme: string; version: string
    scraper: {
      title: string; checking: string; configured: string; notConfigured: string; description: string
      python: { label: string; found: string; notFound: string; downloadLink: string; downloadHint: string }
      playwright: { reinstall: string; reinstalling: string; success: string }
      script: { label: string; found: string; notFound: string; hint: string }
      autoDetect: string; autoDetecting: string; selectFile: string; saved: string
      bannerMessage: string; bannerConfigure: string
      howToSetup: string
      setup: { step1: string; step2: string; step3: string; step4: string }
    }
    themeSection: { title: string; description: string; darkMode: string; lightMode: string }
    uiScale: { title: string; description: string; auto: string; detected: string; fullHd: string; qhd: string; qhdPlus: string; fourK: string }
    accessibility: { title: string; description: string; fontSize: string; preview: string; previewText: string }
  }
  skillsdb: {
    header: { title: string; count: string }
    search: { placeholder: string }
    filter: { allWeapons: string; allCategories: string }
    button: { addSkill: string; resetDefault: string; confirmReset: string }
    table: {
      loading: string; emptyState: string; noResults: string
      nameEn: string; weapon: string; category: string; grade: string
      castTooltip: string; cooldownTooltip: string; manaTooltip: string
      dmgPercentTooltip: string; bonusBaseDmgTooltip: string; hitsTooltip: string
      mobPercentTooltip: string; dmgBonusTooltip: string; description: string; removeTooltip: string
    }
    footer: { damageFieldsNote: string }
  }
}

export const TRANSLATIONS: Record<Lang, Translations> = {
  'pt-BR': {
    sidebar: {
      eyebrow: 'AgrMonteiro · Tier2',
      title: 'Command Lab',
      tagline: 'Análise de elite, na palma da sua mão',
      groups: { overview: 'Visão Geral', manage: 'Gerenciar', analysis: 'Análise', preferences: 'Preferências' },
      nav: { dashboard: 'War Room', builds: 'Builds', calculator: 'Calculadora PvE', comparator: 'Comparador', sensitivity: 'Sensibilidade', rotation: 'Rotação', logreader: 'Leitor de Logs', settings: 'Configurações', skillsdb: 'Banco de Skills', masterytrees: 'Maestrias' },
      footer: 'Electron + React',
      checking: 'Verificando…',
      upToDate: 'Atualizado',
      checkUpdate: 'Verificar atualização',
    },
    common: {
      saved: 'salvas', best: 'Melhor', active: 'ativo', noBuilds: 'Nenhuma build salva. Vá em Builds para importar.',
      selectBuild: 'Selecione uma build', cancel: 'Cancelar', save: 'Salvar', delete: 'Deletar',
      import: 'Importar', export: 'Exportar',
      dps: 'DPS', crit: 'Crítico', heavy: 'Pesado', weapon: 'Arma', skill: 'Habilidade',
    },
    migration: {
      title: 'Dados migrados para o Tier2 Command Lab',
      description: 'Seus dados da versão anterior foram copiados automaticamente para o novo diretório do app. Nenhuma informação foi perdida.',
      understood: 'Entendido',
    },
    update: {
      available: '⬆ Nova versão disponível: v{version} — baixando em segundo plano…',
      downloading: '⬇ Baixando v{version}…',
      ready: '✅ v{version} pronta para instalar!',
      restart: 'Reiniciar e instalar →',
    },
    dashboard: {
      title: 'War Room',
      subtitle: 'Painel central do Tier2 Command Lab — DPS estimado, atributos e comparação de builds salvas.',
      kpi: { savedBuilds: 'Builds salvas', bestDps: 'Melhor DPS', critActive: 'Crítico (ativo)', heavyActive: 'Pesado (ativo)', dpsActive: 'DPS (ativo)' },
      chart: 'DPS Estimado por Build', activeBuild: 'Build Ativa', switchBuild: 'Trocar build ativa',
      noBuild: 'Selecione uma build em Builds',
      features: {
        calc: 'Calculadora PvE', calcSub: 'Compare 4 builds com fórmulas Maxroll. Crítico, Pesado e Elasticidade.',
        comp: 'Comparador', compSub: 'Gráfico radar normalizado entre builds salvas.',
        sens: 'Sensibilidade', sensSub: 'Qual atributo dá mais DPS por unidade? Classificação e barras de impacto.',
      },
      chartTooltipDps: 'DPS Real (/s)',
    },
    calculator: {
      title: 'Calculadora PvE',
      subtitle: 'Compare até 4 builds simultaneamente. Fórmulas Maxroll com crítico, pesado e elasticidade de atributo.',
      sections: { skill: 'Habilidade', build: 'Configuração', target: 'Alvo' },
      labels: {
        castTime: 'Tempo de Cast (s)', cooldown: 'Recarga Base (s)', critChance: 'Chance de Acerto Crítico',
        heavyChance: 'Chance de Ataque Pesado', critDmg: 'Dano Crítico %', heavyDmg: 'Dano de Ataque Pesado',
        skillBoost: 'Ampliação de Dano de Habilidade', bonusDmg: 'Bônus de Dano', species: 'Bônus por Espécie',
        minWeapon: 'Dano Mínimo de Arma', maxWeapon: 'Dano Máximo de Arma', targetDef: 'Defesa do Alvo',
        targetEvasion: 'Esquiva do Alvo', monsterBoost: 'Bônus de Dano vs Monstro %', dmgBuff: 'Buff de Dano %',
        skillBasePct: 'Dano Base da Habilidade %', skillBonusBase: 'Bônus de Dano Base da Habilidade',
        bossCrit: 'Chance de Acerto Crítico vs Chefe (delta)', bossHeavy: 'Chance de Ataque Pesado vs Chefe (delta)',
        cdrPct: 'Velocidade de Recarga %', atkSpeedPct: 'Velocidade de Ataque %',
      },
      results: { damagePerCast: 'dano por lançamento', total60s: '60s total:', dpsPerSec: 'DPS/s:', bestBuild: 'MELHOR' },
      elasticity: { title: 'Elasticidade de Atributo', additive: 'Aditivas', swap: 'Permuta', step: 'Passo', iterations: 'Iterações' },
    },
    comparator: {
      title: 'Comparador de Builds', subtitle: 'Selecione até 6 builds · legenda ou cartão para ocultar série · barra para detalhes · ícone expandir para maximizar',
      select: 'Selecionar Builds', noBuilds: 'Nenhuma build salva. Vá em Builds para importar.', needTwo: 'Selecione pelo menos 2 builds para comparar.',
      charts: { stats: '📊 Atributos Comparados (normalizado 0–100)', dps: '📊 DPS Comparativo' },
      table: '📋 Tabela Detalhada',
      visibility: { show: 'Clique para mostrar nos gráficos', hide: 'Clique para ocultar nos gráficos' },
      kpi: { best: 'MELHOR', hidden: 'oculto', base: 'BASE' },
      detail: { pointSelected: 'Ponto selecionado', normalized: 'Normalizado:', realValue: 'Valor real:' },
      chart: { maximizeTooltip: 'Maximizar gráfico (Esc para fechar)', maximizeBtn: 'Maximizar', showValues: 'Exibir valores nos gráficos' },
      fullscreen: { closeHint: 'Esc para fechar', closeBtn: '✕ Fechar' },
    },
    sensitivity: {
      title: 'Análise de Sensibilidade',
      subtitle: 'Descubra qual atributo aumenta mais o DPS por unidade investida. Classificação automática com pesos normalizados.',
      source: 'Build de referência', manual: 'Manual (PADRÃO)', dpsBase: 'DPS base',
      recommendation: 'Recomendação', prioritize: '↑ Priorizar:', chart: '📊 Impacto por Atributo (% do ganho total)',
      ranking: '🏆 Classificação de Prioridade', deltas: 'Incrementos usados na simulação:',
      manualPlaceholder: 'Manual',
      statInfo: 'Atributo com maior ganho de DPS por unidade investida. Peso relativo:',
      statInfoTotal: 'do ganho total simulado.',
      noStats: 'Selecione uma build com stats de arma para análise.',
      deltaLabel: 'Delta',
      tooltipWeight: 'Peso (delta: +',
    },
    builds: {
      title: 'Builds', subtitle: 'Gerencie suas builds. Importe do quest log ou edite manualmente.',
      newBuild: 'Nova Build', import: 'Importar', export: 'Exportar', delete: 'Deletar',
      stats: { dps: 'DPS', crit: 'Acerto Crítico', heavy: 'Ataque Pesado', critDmg: 'Dano Crítico %', weapon: 'Arma Máxima', skillBoost: 'Amp. de Habilidade' },
      editor: {
        title: 'Editar Build', name: 'Nome da Build', weapon: 'Combo de Armas', save: 'Salvar', cancel: 'Cancelar',
        statsTab: 'Stats completos (', calcTab: 'Calculadora DPS', attributes: 'Atributos',
        filterStats: 'Filtrar stats...', other: 'Outros (', notes: 'Notas',
        calc: {
          hint: 'Campos usados pelo motor de cálculo de DPS. Preenchidos automaticamente ao importar.',
          replicate: '⟳ Replicar Stats do Questlog',
          replicateTitle: 'Relê todos os campos possíveis dos rawStats do Questlog e preenche a calculadora',
        },
      },
      weaponHint: 'Use os atributos que correspondem à sua arma principal — Mágico: Cajado, Varinha & Tomo, Orbe · Distância: Arco Longo, Besta · Corpo a Corpo: Espada & Escudo, Espadão, Adaga, Lança',
      empty: 'Nenhuma build salva. Cole uma URL do Questlog acima para começar.',
      questlog: {
        title: 'Importar do Questlog',
        placeholder: 'https://questlog.gg/throne-and-liberty/en/character-builder/...',
        button: 'Importar',
        importing: 'Importando...',
      },
      create: {
        name: 'Nome', placeholder: 'Nova build...',
        weapons: 'Armas (ex: sword+wand)', weaponsPlaceholder: 'sword+wand', button: '+ Criar',
      },
      pending: {
        title: '✅ Build importada — confirme o nome antes de salvar',
        save: '💾 Salvar build', discard: 'Descartar',
        weaponsPlaceholder: 'sword+wand', statsExtracted: 'stats extraídos',
      },
      status: {
        saved: 'Build salva!', importing: 'Importando...', imported: 'Importado: ',
        importCancelled: 'Importação cancelada ou inválida.',
        cancelled: 'Importação cancelada.', discarded: 'Importação descartada.',
        deleted: 'Build removida.', exported: 'Arquivo exportado!',
        reimporting: '⏳ Reimportando ', reimported: 'reimportada com sucesso!',
        created: 'criada.',
        downloading: '📥 Baixando recursos — apenas na primeira vez, aguarde...',
        starting: '⏳ Iniciando...', extracting: '🔍 Extraindo stats...',
      },
      cancel: { error: 'Não foi possível cancelar — o processo pode continuar em segundo plano.' },
      queue: {
        title: '⟳ Fila de Reimportação — ',
        buildSingular: 'build', buildPlural: 'builds',
        start: '▶ Iniciar', pause: '⏹ Pausar', clear: '✕ Limpar',
      },
      card: {
        active: 'ATIVA', edited: 'editada', stats: 'stats', attributes: 'atributos',
        activate: 'Ativar', activateStatus: 'Build " ativa.',
        edit: '✏ Editar', close: 'Fechar',
        reimport: '⟳ Reimportar', queueAdd: '⊕ Fila', queueRemove: '✓ Na fila',
        queueAddTitle: 'Adicionar à fila de reimportação', queueRemoveTitle: 'Remover da fila',
        export: '⬇ Export', deleteBtn: '🗑',
      },
      delete: { confirm: 'Deletar esta build?' },
    },
    rotation: {
      title: 'Rotação', subtitle: 'Monte e simule sua rotação de habilidades.',
      empty: 'Selecione ou crie uma rotação na barra lateral',
      autoSave: { saving: 'Salvando...', saved: 'Salvo ✓' },
      card: {
        dpsTotal: 'DPS Total · ', timeline: 'Timeline', seconds: '60 segundos',
        skillsActive: 'skill', skillsActivePlural: 'skills ativas',
        dots: 'DoT', dotsPlural: 'DoTs',
        buffs: 'buff', buffsPlural: 'buffs',
      },
      character: {
        title: 'Personagem',
        importButton: '⬇ Importar de Build', importTooltip: 'Preenche os campos com dados de uma build salva no Quest Log',
        weapons: 'Armas', weaponMain: 'Principal ', autoAttack: '(auto-attack)',
        min: 'mín', max: 'máx',
        weaponSpeed: 'Vel.Atq', weaponSpeedTooltip: 'Velocidade de Ataque base da arma',
        weaponSecondary: 'Secundária ', skillsOnly: '(apenas skills)',
        stellarite: 'Stellarite', stellariteNone: 'Nenhuma', stellariteCommon: 'Comum +10%', stellariteRare: 'Rara +15%',
        combatStats: 'Stats de Combate',
        cooldownReduction: 'Redução de Cooldown %', cooldownCap: '⚠ cap 120',
        attackSpeed: 'Velocidade de Ataque %', attackSpeedCap: '⚠ cap 150',
        advantageDuration: 'Duração de Vantagem %',
        critChance: 'Chance Crítica\u00a0', critChanceBoss: '+ chefe', critDamage: 'Dano Crítico %',
        heavyChance: 'Chance Pesado\u00a0', heavyDamage: 'Dano Pesado %',
        modifiers: 'Modificadores',
        skillDmgBoost: 'Skill Dmg Boost', skillDmgBoostTooltip: 'Skill Damage Boost — stat flat, fórmula: SDB/(SDB+1000)',
        speciesBoost: 'Bônus de Espécie', speciesBoostTooltip: 'Species Damage Boost — mesma fórmula do SDB',
        bonusDamage: 'Bônus de Dano (flat)', bonusDamageTooltip: 'Dano verdadeiro — somado flat após todos os multiplicadores, não afeta DoT',
        itemBoost: 'Bônus de Item %', itemBoostTooltip: 'Bônus de item por elemento/tipo de skill (ex: +5% dano de raio)',
        target: 'Alvo', targetDefense: 'Defesa', targetEndurance: 'Resistência', enduranceNote: 'Resistência reduz a chance crítica efetiva',
      },
      skills: {
        title: 'Skills Ativas', addButton: '+ Skill', emptyState: 'Nenhuma skill. Clique em + Skill para adicionar.',
        skillName: 'Nome da skill', toggleTooltip: 'Desativar skill', toggleTooltipInactive: 'Ativar skill', removeTooltip: 'Remover skill',
      },
      dots: { title: 'DoT / Passivas', addButton: '+ DoT', emptyState: 'Nenhum DoT / passiva.', dotName: 'Nome do DoT' },
      buffs: {
        title: 'Buffs', addButton: '+ Buff', emptyState: 'Nenhum buff. Clique em + Buff para adicionar.',
        buffName: 'Nome do buff', toggleTooltip: 'Desativar buff', toggleTooltipInactive: 'Ativar buff', removeTooltip: 'Remover buff',
      },
      rules: {
        title: 'Regras de Encadeamento', addButton: '+ Regra',
        emptyState: 'Nenhuma regra. Adicione skills, DoTs ou buffs e clique em + Regra.',
        removeTooltip: 'Remover regra',
      },
      timeline: {
        title: 'Timeline', instruction: 'Clique ou arraste skills / DoTs / buffs para marcar o cast · 🟥 = cooldown não liberado',
        clearAllButton: 'Limpar tudo', clearAllTooltip: 'Limpar toda a timeline', clearColumnTooltip: 'Limpar coluna',
        noSkills: 'Habilite ao menos uma skill, DoT ou buff para usar a timeline.',
        planned: 'Planejado', realLog: 'Real (Log)',
        importButton: '📥 Importar Timeline do Log', updateButton: '📥 Atualizar do Log',
      },
      importModal: {
        title: 'Importar stats de Build',
        description: 'Preenche automaticamente os campos disponíveis. Campos exclusivos da rotação permanecem intactos.',
        emptyState: 'Nenhuma build importada ainda.',
        emptyStateNote: 'Use o Quest Log para importar uma build primeiro.',
      },
      sidebar: { newRotation: 'Nova Rotação', rotationName: 'Nome da rotação...', deleteTooltip: 'Deletar rotação' },
    },
    logreader: {
      title: 'Leitor de Logs', subtitle: 'Analise seus registros de combate do Throne & Liberty.',
      sidebar: { character: 'Personagem', weaponAnalysis: 'Análise de Classe', logfiles: 'Arquivos de Log', targets: 'Alvos Detectados', allTargets: 'Todos os Alvos', folderButton: 'Configurar Pasta' },
      header: { characterLabel: 'Personagem', detectedWeapons: 'Armas Detectadas', analyzing: 'Analisando...', splitViewTitle: 'Análise lado a lado', splitViewOpen: '⊞ Split View', splitViewClose: '✕ Fechar Split', changeFolder: 'Alterar Pasta', refreshList: 'Atualizar Lista' },
      main: { processing: 'Processando dados...', selectLog: 'Selecione um log e alvo para ver as estatísticas de combate.' },
      pulls: { title: 'Sessões de Combate (Pulls)', clearCuts: 'Limpar Cortes', sendToRanking: '↗ Enviar para Ranking', sentToRanking: '✓ Enviado para Ranking', allCombat: 'Todo o Combate', fullLogData: 'Dados completos do log para este alvo', pullNumber: 'Pull #', splitPull: '✂ Dividir Pull' },
      split: { title: '✂ Cortar Pull #', before: 'Antes', after: 'Depois', hits: 'hits', confirm: 'Confirmar Corte', cancel: 'Cancelar' },
      stats: { normalizationLabel: 'Normalização', pullIsolated: 'Pull #', pullIsolatedSuffix: 'Isolado', totalDamage: 'Dano Total', dpsLabel: 'DPS', duration: 'Duração' },
      chart: { title: 'Cronologia de Dano', byWeapon: 'POR ARMA', bySkill: 'POR HABILIDADE', stacked: 'EMPILHADO', individual: 'INDIVIDUAL', enableAll: 'Ativar Tudo', disableAll: 'Desativar Tudo', damagePerWeapon: 'Dano por Arma', movingAvg: 'Média Móvel (3s)' },
      unmapped: { title: '⚠️ ', skillsLabel: 'Habilidade(s) Não Mapeada(s)', description: 'Identificamos nomes que não estão no banco de dados. Informe o que são para catalogarmos:' },
      breakdown: { title: 'Detalhamento de Ataques', selectSkill: 'Selecione uma habilidade na tabela abaixo para ver a análise detalhada.' },
      timeline: { title: 'Timeline do Log', show: 'Mostrar', hide: 'Ocultar', fullViewTitle: 'Maximizar timeline', fullViewLabel: 'Timeline do Log — Visualização Completa', export: '📤 Enviar para Rotação', exportAlert: 'Timeline exportada com sucesso!\n', exportSkills: 'skills', exportCasts: 'casts' },
      table: { title: 'Habilidade', weapon: 'Arma', totalDamage: 'Dano Total', dps: 'DPS', ratio: 'Proporção', hits: 'Hits', averageInterval: 'Intervalo Médio', crit: 'Crítico', heavy: 'Pesado', critHeavy: 'Crit+Pesado', undefinedWeapon: 'Indefinido', intervalTooltip: 'Tempo médio entre usos da habilidade (threshold adaptativo detecta separação intra-cast vs inter-cast)' },
      renderbox: { min: 'Mín', max: 'Máx', average: 'Média', ratio: 'Proporção', dps: 'DPS' },
      error: { folderSelection: 'Erro técnico:', folderSelectionDetails: 'Isso pode ocorrer por falta de permissão ou se o sistema do seletor do Windows estiver ocupado.', folderPrompt: 'O seletor falhou. Deseja colar o caminho da pasta manualmente? (Ex: C:\\Users\\...\\Saved\\CombatLogs)' },
      delete: { confirm: 'Deletar permanentemente o arquivo:\n\n"{filename}"\n\nEsta ação não pode ser desfeita.', error: 'Erro ao deletar:', buttonTitle: 'Deletar arquivo permanentemente' },
    },
    pullranking: {
      title: 'Pull Ranking', subtitle: 'Classifique pulls reais por dano e DPS.',
      filter: { target: 'Alvo', targetAll: 'Todos', weapons: 'Armas', weaponsAll: 'Todas', duration: 'Duração', durationAll: 'Todos', durationShort: '<120s', durationLong: '≥120s', sortBy: 'Ordenar', sortDmg: 'DMG', sortDps: 'DPS' },
      empty: { title: 'Nenhum log enviado para o ranking ainda.', description: 'Abra o Leitor de Logs, carregue um arquivo e clique em "Enviar para Ranking".' },
      noResults: 'Nenhum pull encontrado com os filtros selecionados.',
      comment: { placeholder: 'Digite sua build ou referência (ex: Arco Longo/Adaga — set de open world)' },
      dps: { label: 'DPS' },
    },
    nav: { pullranking: 'Pull Ranking', pullrankingSub: 'Classifique pulls reais por dano e DPS' },
    settings: {
      title: 'Configurações', subtitle: 'Preferências do Tier2 Command Lab.',
      language: 'Idioma', languageLabel: 'Idioma da Interface',
      theme: 'Tema', version: 'Versão',
      scraper: {
        title: 'Importador de Builds', checking: 'verificando…', configured: '✓ Configurado', notConfigured: '⚠ Não configurado',
        description: 'O importador usa um script Python para extrair sua build do Questlog. Configure o caminho uma vez e o app cuida do resto.',
        python: { label: 'Python', found: '✓ Encontrado', notFound: '✗ Não encontrado', downloadLink: 'Baixar Python →', downloadHint: 'Após instalar, clique em Detectar automaticamente' },
        playwright: { reinstall: '🔄 Reinstalar Playwright', reinstalling: '⏳ Reinstalando…', success: '✓ Playwright reinstalado com sucesso!' },
        script: { label: 'Script do Scraper', found: '✓ Encontrado', notFound: '✗ Não encontrado', hint: 'Clique em "Detectar" ou selecione manualmente' },
        autoDetect: '🔍 Detectar automaticamente', autoDetecting: '⏳ Detectando…', selectFile: '📂 Selecionar arquivo…', saved: '✓ Salvo!',
        bannerMessage: '⚠ Importador não configurado — builds do Questlog não estão disponíveis.',
        bannerConfigure: 'Configurar agora →',
        howToSetup: 'Como configurar',
        setup: {
          step1: 'Instale o Python em python.org/downloads (se necessário)',
          step2: 'Baixe o scraper em github.com/agrmonteiro/throne_and_liberty_agent',
          step3: 'No terminal, execute: pip install playwright && playwright install chromium',
          step4: 'Clique em Detectar automaticamente — ou Selecionar arquivo para localizar o questlog_scraper_standalone.py',
        },
      },
      themeSection: { title: 'Tema Visual', description: 'Escolha entre o Modo Escuro clássico ou o Modo Claro.', darkMode: 'Dark Mode', lightMode: 'Light Mode' },
      uiScale: { title: 'Escala de Interface', description: 'Ajusta automaticamente tamanhos de fonte, espaçamento e tooltips dos gráficos conforme a resolução. Use Auto ou force um tier específico.', auto: 'Auto', detected: 'detectado:', fullHd: 'Full HD', qhd: 'QHD', qhdPlus: 'QHD+', fourK: '4K UHD' },
      accessibility: { title: 'Acessibilidade', description: 'Ajuste o tamanho global das fontes.', fontSize: 'Tamanho da Fonte', preview: 'Visualização:', previewText: 'Texto de exemplo para validação do tamanho de fonte.' },
    },
    skillsdb: {
      header: { title: 'Banco de Skills', count: 'skills cadastradas' },
      search: { placeholder: 'Buscar por nome...' },
      filter: { allWeapons: 'Todas as armas', allCategories: 'Todas as categorias' },
      button: { addSkill: '+ Nova Skill', resetDefault: 'Restaurar padrão', confirmReset: 'Confirmar reset' },
      table: {
        loading: 'Carregando...', emptyState: 'Nenhuma skill cadastrada.', noResults: 'Nenhuma skill encontrada com os filtros atuais.',
        nameEn: 'Nome EN', weapon: 'Arma', category: 'Categoria', grade: 'Grau',
        castTooltip: 'Cast em segundos', cooldownTooltip: 'Cooldown base em segundos', manaTooltip: 'Custo de mana',
        dmgPercentTooltip: 'Dmg % da skill', bonusBaseDmgTooltip: 'Bônus de dano base fixo', hitsTooltip: 'Hits por cast',
        mobPercentTooltip: 'Bônus vs monstros (%)', dmgBonusTooltip: 'Bônus condicional (%)', description: 'Descrição', removeTooltip: 'Remover skill',
      },
      footer: { damageFieldsNote: 'Campos de dano (Dmg %, +Base, Mob %, +Dano %) serão usados como padrão ao selecionar a skill na rotação. Edições são salvas automaticamente.' },
    },
  },
  'en': {
    sidebar: {
      eyebrow: 'AgrMonteiro · Tier2',
      title: 'Command Lab',
      tagline: 'Elite analysis, at your fingertips',
      groups: { overview: 'Overview', manage: 'Manage', analysis: 'Analysis', preferences: 'Preferences' },
      nav: { dashboard: 'War Room', builds: 'Builds', calculator: 'PvE Calculator', comparator: 'Comparator', sensitivity: 'Sensitivity', rotation: 'Rotation', logreader: 'Log Reader', settings: 'Settings', skillsdb: 'Skills DB', masterytrees: 'Masteries' },
      footer: 'Electron + React',
      checking: 'Checking…',
      upToDate: 'Up to date',
      checkUpdate: 'Check for update',
    },
    common: {
      saved: 'saved', best: 'Best', active: 'active', noBuilds: 'No builds saved. Go to Builds to import.',
      selectBuild: 'Select a build', cancel: 'Cancel', save: 'Save', delete: 'Delete',
      import: 'Import', export: 'Export',
      dps: 'DPS', crit: 'Crit', heavy: 'Heavy', weapon: 'Weapon', skill: 'Skill',
    },
    migration: {
      title: 'Data migrated to Tier2 Command Lab',
      description: 'Your data from the previous version has been automatically copied to the app\'s new directory. No information was lost.',
      understood: 'Got it',
    },
    update: {
      available: '⬆ New version available: v{version} — downloading in background…',
      downloading: '⬇ Downloading v{version}…',
      ready: '✅ v{version} ready to install!',
      restart: 'Restart and install →',
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
      chartTooltipDps: 'Real DPS (/s)',
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
      visibility: { show: 'Click to show in charts', hide: 'Click to hide in charts' },
      kpi: { best: 'BEST', hidden: 'hidden', base: 'BASE' },
      detail: { pointSelected: 'Selected point', normalized: 'Normalized:', realValue: 'Real value:' },
      chart: { maximizeTooltip: 'Maximize chart (Esc to close)', maximizeBtn: 'Maximize', showValues: 'Show values in charts' },
      fullscreen: { closeHint: 'Esc to close', closeBtn: '✕ Close' },
    },
    sensitivity: {
      title: 'Sensitivity Analysis',
      subtitle: 'Discover which stat increases DPS the most per unit invested. Automatic ranking with normalized weights.',
      source: 'Reference build', manual: 'Manual (DEFAULT)', dpsBase: 'Base DPS',
      recommendation: 'Recommendation', prioritize: '↑ Prioritize:', chart: '📊 Impact per Stat (% of total gain)',
      ranking: '🏆 Priority Ranking', deltas: 'Increments used in simulation:',
      manualPlaceholder: 'Manual',
      statInfo: 'Stat with highest DPS gain per unit invested. Relative weight:',
      statInfoTotal: 'of total simulated gain.',
      noStats: 'Select a build with weapon stats for analysis.',
      deltaLabel: 'Delta',
      tooltipWeight: 'Weight (delta: +',
    },
    builds: {
      title: 'Builds', subtitle: 'Manage your builds. Import from quest log or edit manually.',
      newBuild: 'New Build', import: 'Import', export: 'Export', delete: 'Delete',
      stats: { dps: 'DPS', crit: 'Crit', heavy: 'Heavy', critDmg: 'Crit Dmg %', weapon: 'Max Weapon', skillBoost: 'Skill Boost' },
      editor: {
        title: 'Edit Build', name: 'Build Name', weapon: 'Weapon Combo', save: 'Save', cancel: 'Cancel',
        statsTab: 'Full Stats (', calcTab: 'DPS Calculator', attributes: 'Attributes',
        filterStats: 'Filter stats...', other: 'Others (', notes: 'Notes',
        calc: {
          hint: 'Fields used by the DPS calculation engine. Auto-filled when importing.',
          replicate: '⟳ Replicate Stats from Questlog',
          replicateTitle: 'Re-read all possible fields from Questlog rawStats and fill the calculator',
        },
      },
      weaponHint: 'Use stats that match your main weapon — Magic: Staff, Wand & Tome, Orb · Ranged: Longbow, Crossbow · Melee: Sword & Shield, Greatsword, Dagger, Spear',
      empty: 'No saved builds. Paste a Questlog URL above to get started.',
      questlog: {
        title: 'Import from Questlog',
        placeholder: 'https://questlog.gg/throne-and-liberty/en/character-builder/...',
        button: 'Import',
        importing: 'Importing...',
      },
      create: {
        name: 'Name', placeholder: 'New build...',
        weapons: 'Weapons (e.g., sword+wand)', weaponsPlaceholder: 'sword+wand', button: '+ Create',
      },
      pending: {
        title: '✅ Build imported — confirm the name before saving',
        save: '💾 Save build', discard: 'Discard',
        weaponsPlaceholder: 'sword+wand', statsExtracted: 'stats extracted',
      },
      status: {
        saved: 'Build saved!', importing: 'Importing...', imported: 'Imported: ',
        importCancelled: 'Import cancelled or invalid.',
        cancelled: 'Import cancelled.', discarded: 'Import discarded.',
        deleted: 'Build removed.', exported: 'File exported!',
        reimporting: '⏳ Re-importing ', reimported: 're-imported successfully!',
        created: 'created.',
        downloading: '📥 Downloading resources — first time only, please wait...',
        starting: '⏳ Starting...', extracting: '🔍 Extracting stats...',
      },
      cancel: { error: 'Could not cancel — the process may continue in background.' },
      queue: {
        title: '⟳ Re-import Queue — ',
        buildSingular: 'build', buildPlural: 'builds',
        start: '▶ Start', pause: '⏹ Pause', clear: '✕ Clear',
      },
      card: {
        active: 'ACTIVE', edited: 'edited', stats: 'stats', attributes: 'attributes',
        activate: 'Activate', activateStatus: 'Build " active.',
        edit: '✏ Edit', close: 'Close',
        reimport: '⟳ Re-import', queueAdd: '⊕ Queue', queueRemove: '✓ In queue',
        queueAddTitle: 'Add to re-import queue', queueRemoveTitle: 'Remove from queue',
        export: '⬇ Export', deleteBtn: '🗑',
      },
      delete: { confirm: 'Delete this build?' },
    },
    rotation: {
      title: 'Rotation', subtitle: 'Build and simulate your skill rotation.',
      empty: 'Select or create a rotation in the sidebar',
      autoSave: { saving: 'Saving...', saved: 'Saved ✓' },
      card: {
        dpsTotal: 'Total DPS · ', timeline: 'Timeline', seconds: '60 seconds',
        skillsActive: 'skill', skillsActivePlural: 'active skills',
        dots: 'DoT', dotsPlural: 'DoTs',
        buffs: 'buff', buffsPlural: 'buffs',
      },
      character: {
        title: 'Character',
        importButton: '⬇ Import from Build', importTooltip: 'Fills fields with data from a build saved in the Quest Log',
        weapons: 'Weapons', weaponMain: 'Main ', autoAttack: '(auto-attack)',
        min: 'min', max: 'max',
        weaponSpeed: 'Atk Spd', weaponSpeedTooltip: 'Base Attack Speed of the weapon',
        weaponSecondary: 'Secondary ', skillsOnly: '(skills only)',
        stellarite: 'Stellarite', stellariteNone: 'None', stellariteCommon: 'Common +10%', stellariteRare: 'Rare +15%',
        combatStats: 'Combat Stats',
        cooldownReduction: 'Cooldown Reduction %', cooldownCap: '⚠ cap 120',
        attackSpeed: 'Attack Speed %', attackSpeedCap: '⚠ cap 150',
        advantageDuration: 'Advantage Duration %',
        critChance: 'Crit Chance\u00a0', critChanceBoss: '+ boss', critDamage: 'Crit Damage %',
        heavyChance: 'Heavy Chance\u00a0', heavyDamage: 'Heavy Damage %',
        modifiers: 'Modifiers',
        skillDmgBoost: 'Skill Dmg Boost', skillDmgBoostTooltip: 'Skill Damage Boost — flat stat, formula: SDB/(SDB+1000)',
        speciesBoost: 'Species Boost', speciesBoostTooltip: 'Species Damage Boost — same formula as SDB',
        bonusDamage: 'Bonus Dmg (flat)', bonusDamageTooltip: 'True Damage — added flat after all multipliers, does not affect DoT',
        itemBoost: 'Item Boost %', itemBoostTooltip: 'Item bonus per element/skill type (e.g. +5% lightning damage)',
        target: 'Target', targetDefense: 'Defense', targetEndurance: 'Endurance', enduranceNote: 'Endurance reduces effective crit chance',
      },
      skills: {
        title: 'Active Skills', addButton: '+ Skill', emptyState: 'No skills. Click + Skill to add.',
        skillName: 'Skill name', toggleTooltip: 'Disable skill', toggleTooltipInactive: 'Enable skill', removeTooltip: 'Remove skill',
      },
      dots: { title: 'DoT / Passives', addButton: '+ DoT', emptyState: 'No DoT / passive.', dotName: 'DoT name' },
      buffs: {
        title: 'Buffs', addButton: '+ Buff', emptyState: 'No buffs. Click + Buff to add.',
        buffName: 'Buff name', toggleTooltip: 'Disable buff', toggleTooltipInactive: 'Enable buff', removeTooltip: 'Remove buff',
      },
      rules: {
        title: 'Chaining Rules', addButton: '+ Rule',
        emptyState: 'No rules. Add skills, DoTs or buffs and click + Rule.',
        removeTooltip: 'Remove rule',
      },
      timeline: {
        title: 'Timeline', instruction: 'Click or drag skills / DoTs / buffs to mark cast · 🟥 = cooldown not available',
        clearAllButton: 'Clear all', clearAllTooltip: 'Clear entire timeline', clearColumnTooltip: 'Clear column',
        noSkills: 'Enable at least one skill, DoT or buff to use the timeline.',
        planned: 'Planned', realLog: 'Real (Log)',
        importButton: '📥 Import Timeline from Log', updateButton: '📥 Update from Log',
      },
      importModal: {
        title: 'Import Build stats',
        description: 'Automatically fills available fields. Rotation-exclusive fields remain unchanged.',
        emptyState: 'No builds imported yet.',
        emptyStateNote: 'Use the Quest Log to import a build first.',
      },
      sidebar: { newRotation: 'New Rotation', rotationName: 'Rotation name...', deleteTooltip: 'Delete rotation' },
    },
    logreader: {
      title: 'Log Reader', subtitle: 'Analyze your Throne & Liberty combat logs.',
      sidebar: { character: 'Character', weaponAnalysis: 'Class Analysis', logfiles: 'Log Files', targets: 'Detected Targets', allTargets: 'All Targets', folderButton: 'Setup Folder' },
      header: { characterLabel: 'Character', detectedWeapons: 'Detected Weapons', analyzing: 'Analyzing...', splitViewTitle: 'Side-by-side analysis', splitViewOpen: '⊞ Split View', splitViewClose: '✕ Close Split', changeFolder: 'Change Folder', refreshList: 'Refresh List' },
      main: { processing: 'Processing data...', selectLog: 'Select a log and target to see combat statistics.' },
      pulls: { title: 'Combat Sessions (Pulls)', clearCuts: 'Clear Cuts', sendToRanking: '↗ Send to Ranking', sentToRanking: '✓ Sent to Ranking', allCombat: 'All Combat', fullLogData: 'Full log data for this target', pullNumber: 'Pull #', splitPull: '✂ Split Pull' },
      split: { title: '✂ Cut Pull #', before: 'Before', after: 'After', hits: 'hits', confirm: 'Confirm Cut', cancel: 'Cancel' },
      stats: { normalizationLabel: 'Normalization', pullIsolated: 'Pull #', pullIsolatedSuffix: 'Isolated', totalDamage: 'Total Damage', dpsLabel: 'DPS', duration: 'Duration' },
      chart: { title: 'Damage Timeline', byWeapon: 'BY WEAPON', bySkill: 'BY SKILL', stacked: 'STACKED', individual: 'INDIVIDUAL', enableAll: 'Enable All', disableAll: 'Disable All', damagePerWeapon: 'Damage per Weapon', movingAvg: 'Moving Avg (3s)' },
      unmapped: { title: '⚠️ ', skillsLabel: 'Unmapped Skill(s)', description: 'We identified names that are not in the database. Tell us what they are so we can catalog them:' },
      breakdown: { title: 'Attack Breakdown', selectSkill: 'Select a skill from the table below to see detailed analysis.' },
      timeline: { title: 'Log Timeline', show: 'Show', hide: 'Hide', fullViewTitle: 'Maximize timeline', fullViewLabel: 'Log Timeline — Full View', export: '📤 Send to Rotation', exportAlert: 'Timeline exported successfully!\n', exportSkills: 'skills', exportCasts: 'casts' },
      table: { title: 'Skill', weapon: 'Weapon', totalDamage: 'Total Damage', dps: 'DPS', ratio: 'Ratio', hits: 'Hits', averageInterval: 'Avg Interval', crit: 'Crit', heavy: 'Heavy', critHeavy: 'Crit+Heavy', undefinedWeapon: 'Undefined', intervalTooltip: 'Average time between skill uses (adaptive threshold detects intra-cast vs inter-cast separation)' },
      renderbox: { min: 'Min', max: 'Max', average: 'Average', ratio: 'Ratio', dps: 'DPS' },
      error: { folderSelection: 'Technical error:', folderSelectionDetails: 'This can occur due to lack of permission or if the Windows selector system is busy.', folderPrompt: 'The selector failed. Do you want to paste the folder path manually? (Ex: C:\\Users\\...\\Saved\\CombatLogs)' },
      delete: { confirm: 'Permanently delete the file:\n\n"{filename}"\n\nThis action cannot be undone.', error: 'Error deleting:', buttonTitle: 'Permanently delete file' },
    },
    pullranking: {
      title: 'Pull Ranking', subtitle: 'Rank real pulls by damage and DPS.',
      filter: { target: 'Target', targetAll: 'All', weapons: 'Weapons', weaponsAll: 'All', duration: 'Duration', durationAll: 'All', durationShort: '<120s', durationLong: '≥120s', sortBy: 'Sort By', sortDmg: 'DMG', sortDps: 'DPS' },
      empty: { title: 'No logs submitted to ranking yet.', description: 'Open Log Reader, load a file and click "Send to Ranking".' },
      noResults: 'No pulls found with selected filters.',
      comment: { placeholder: 'Enter your build or reference (e.g., Longbow/Dagger — open world set)' },
      dps: { label: 'DPS' },
    },
    nav: { pullranking: 'Pull Ranking', pullrankingSub: 'Rank real pulls by damage and DPS' },
    settings: {
      title: 'Settings', subtitle: 'Tier2 Command Lab preferences.',
      language: 'Language', languageLabel: 'Interface Language',
      theme: 'Theme', version: 'Version',
      scraper: {
        title: 'Build Importer', checking: 'checking…', configured: '✓ Configured', notConfigured: '⚠ Not configured',
        description: 'The importer uses a Python script to extract your build from Questlog. Configure the path once and the app handles the rest.',
        python: { label: 'Python', found: '✓ Found', notFound: '✗ Not found', downloadLink: 'Download Python →', downloadHint: 'After installing, click Auto-detect' },
        playwright: { reinstall: '🔄 Reinstall Playwright', reinstalling: '⏳ Reinstalling…', success: '✓ Playwright reinstalled successfully!' },
        script: { label: 'Scraper Script', found: '✓ Found', notFound: '✗ Not found', hint: 'Click "Detect" or select manually' },
        autoDetect: '🔍 Auto-detect', autoDetecting: '⏳ Detecting…', selectFile: '📂 Select file…', saved: '✓ Saved!',
        bannerMessage: '⚠ Importer not configured — Questlog builds are unavailable.',
        bannerConfigure: 'Configure now →',
        howToSetup: 'How to set up',
        setup: {
          step1: 'Install Python from python.org/downloads (if needed)',
          step2: 'Download the scraper from github.com/agrmonteiro/throne_and_liberty_agent',
          step3: 'In terminal, run: pip install playwright && playwright install chromium',
          step4: 'Click Auto-detect — or Select file to locate questlog_scraper_standalone.py',
        },
      },
      themeSection: { title: 'Visual Theme', description: 'Choose between classic Dark Mode or Light Mode.', darkMode: 'Dark Mode', lightMode: 'Light Mode' },
      uiScale: { title: 'UI Scale', description: 'Automatically adjusts font sizes, spacing, and chart tooltips based on resolution. Use Auto or force a specific tier.', auto: 'Auto', detected: 'detected:', fullHd: 'Full HD', qhd: 'QHD', qhdPlus: 'QHD+', fourK: '4K UHD' },
      accessibility: { title: 'Accessibility', description: 'Adjust the global font size.', fontSize: 'Font Size', preview: 'Preview:', previewText: 'Sample text for font size validation.' },
    },
    skillsdb: {
      header: { title: 'Skills Bank', count: 'registered skills' },
      search: { placeholder: 'Search by name...' },
      filter: { allWeapons: 'All weapons', allCategories: 'All categories' },
      button: { addSkill: '+ New Skill', resetDefault: 'Reset to default', confirmReset: 'Confirm reset' },
      table: {
        loading: 'Loading...', emptyState: 'No skills registered.', noResults: 'No skills found with current filters.',
        nameEn: 'Name EN', weapon: 'Weapon', category: 'Category', grade: 'Grade',
        castTooltip: 'Cast in seconds', cooldownTooltip: 'Base cooldown in seconds', manaTooltip: 'Mana cost',
        dmgPercentTooltip: 'Skill Dmg %', bonusBaseDmgTooltip: 'Base damage bonus flat', hitsTooltip: 'Hits per cast',
        mobPercentTooltip: 'Monster bonus (%)', dmgBonusTooltip: 'Conditional bonus (%)', description: 'Description', removeTooltip: 'Remove skill',
      },
      footer: { damageFieldsNote: 'Damage fields (Dmg %, +Base, Mob %, +Dmg %) will be used as default when selecting the skill in rotation. Edits are saved automatically.' },
    },
  },
}
