#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..');

// Mapping de branch → grade
const BRANCH_TO_GRADE = {
  1: 'Rare',
  2: 'Uncommon',
  3: 'Common',
  5: 'Epic',
};

// Mapping de weapon_name → weapon ID
const WEAPON_NAME_MAP = {
  'Longbow': 1,
  'Greatsword': 3,
  'Crossbows': 4,
  'Staff': 5,
  'Daggers': 6,
  'Sword': 7,
  'Wand': 9,
  'Spear': 10,
  'Orb': 11,
};

// Mapping de weapon_name → weaponMasteries ID prefix
const WEAPON_MASTERY_PREFIX = {
  'Longbow': 'Bow',
  'Greatsword': 'Sword2h',
  'Crossbows': 'Crossbow',
  'Staff': 'Staff',
  'Daggers': 'Dagger',
  'Sword': 'Sword',
  'Wand': 'Wand',
  'Spear': 'Spear',
  'Orb': 'Orb',
};

// Read and parse masteryTrees.ts
function parseMasteryTrees() {
  const content = fs.readFileSync(
    path.join(projectRoot, 'src/data/masteryTrees.ts'),
    'utf8'
  );

  // Find the start of the array after the = sign
  const arrayStartIdx = content.indexOf('export const MASTERY_TREES: WeaponMasteryTree[] = [');
  if (arrayStartIdx === -1) throw new Error('MASTERY_TREES not found');

  const bracketIdx = content.indexOf('[', arrayStartIdx + 'export const MASTERY_TREES: WeaponMasteryTree[] = '.length);
  if (bracketIdx === -1) throw new Error('Array opening bracket not found');

  // Find the closing bracket, counting braces and brackets carefully
  let depth = 0;
  let arrayEndIdx = -1;
  for (let i = bracketIdx; i < content.length; i++) {
    const char = content[i];
    if (char === '[' || char === '{') depth++;
    else if (char === ']' || char === '}') {
      depth--;
      if (depth === 0 && char === ']') {
        arrayEndIdx = i;
        break;
      }
    }
  }

  if (arrayEndIdx === -1) throw new Error('Could not find closing bracket');

  let arrayStr = content.substring(bracketIdx, arrayEndIdx + 1);

  // Replace template literals with regular strings, escaping quotes inside
  arrayStr = arrayStr.replace(/`([^`]*)`/g, (match, content) => {
    // Escape double quotes and backslashes inside
    const escaped = content.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    return '"' + escaped + '"';
  });

  try {
    const masteryTrees = eval('(' + arrayStr + ')');
    return masteryTrees;
  } catch (err) {
    console.error('Parse error:', err.message);
    console.error('Near:', arrayStr.substring(0, 200));
    throw new Error(`Failed to parse masteryTrees: ${err.message}`);
  }
}

// Read and parse weaponMasteries.ts
function parseWeaponMasteries() {
  const content = fs.readFileSync(
    path.join(projectRoot, 'src/data/weaponMasteries.ts'),
    'utf8'
  );

  // Find the start of the array after the = sign
  const arrayStartIdx = content.indexOf('export const WEAPON_MASTERIES: WeaponMastery[] = [');
  if (arrayStartIdx === -1) throw new Error('WEAPON_MASTERIES not found');

  const bracketIdx = content.indexOf('[', arrayStartIdx + 'export const WEAPON_MASTERIES: WeaponMastery[] = '.length);
  if (bracketIdx === -1) throw new Error('Array opening bracket not found');

  // Find the closing bracket, counting braces and brackets carefully
  let depth = 0;
  let arrayEndIdx = -1;
  for (let i = bracketIdx; i < content.length; i++) {
    const char = content[i];
    if (char === '[' || char === '{') depth++;
    else if (char === ']' || char === '}') {
      depth--;
      if (depth === 0 && char === ']') {
        arrayEndIdx = i;
        break;
      }
    }
  }

  if (arrayEndIdx === -1) throw new Error('Could not find closing bracket');

  let arrayStr = content.substring(bracketIdx, arrayEndIdx + 1);

  // Replace template literals with regular strings, escaping quotes inside
  arrayStr = arrayStr.replace(/`([^`]*)`/g, (match, content) => {
    // Escape double quotes and backslashes inside
    const escaped = content.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    return '"' + escaped + '"';
  });

  try {
    const weaponMasteries = eval('(' + arrayStr + ')');
    return weaponMasteries;
  } catch (err) {
    console.error('Parse error:', err.message);
    console.error('Near:', arrayStr.substring(0, 200));
    throw new Error(`Failed to parse weaponMasteries: ${err.message}`);
  }
}

// Parse stat value string to extract number and isPercent
function parseStat(valueStr) {
  const trimmed = String(valueStr).trim();
  const isPercent = trimmed.endsWith('%');
  const numStr = isPercent ? trimmed.slice(0, -1) : trimmed;
  const value = parseFloat(numStr);
  return { value, isPercent };
}

// Extract level threshold from description (e.g., "from Lv. 4" → 4)
function extractLevelThreshold(description) {
  const match = String(description).match(/from Lv\.\s*(\d+)/i);
  return match ? parseInt(match[1], 10) : 0;
}

// Normalize name (trim, case-insensitive compare)
function normalizeName(name) {
  return String(name).trim().toLowerCase();
}

// Find mastery match in weaponMasteries
function findMasteryMatch(node, weaponName, masteries) {
  const nodeName = normalizeName(node.name);
  const grade = BRANCH_TO_GRADE[node.branch];
  const prefix = WEAPON_MASTERY_PREFIX[weaponName];

  if (!prefix) return null;

  // Try exact match: weapon prefix + grade + name
  let match = masteries.find(m => {
    const mName = normalizeName(m.name.en);
    return (
      m.grade === grade &&
      mName === nodeName &&
      m.id.startsWith(prefix)
    );
  });

  if (match) return match;

  // Try match by name only (fallback)
  match = masteries.find(m => {
    const mName = normalizeName(m.name.en);
    return mName === nodeName;
  });

  return match || null;
}

// Build stat object
function buildStatFull(stat, description) {
  const { value, isPercent } = parseStat(stat.value);
  const perLevel = value / 10;
  const levelThreshold = extractLevelThreshold(description);

  return {
    labelEn: stat.label.en,
    labelPt: stat.label.pt,
    valueAtLv10: value,
    isPercent,
    perLevel,
    levelThreshold,
  };
}

// Main generation
async function generateMasteryIndex() {
  console.log('Parsing masteryTrees.ts...');
  const masteryTrees = parseMasteryTrees();

  console.log('Parsing weaponMasteries.ts...');
  const weaponMasteries = parseWeaponMasteries();

  const results = [];
  let matched = 0;
  let unmatched = [];

  console.log('Processing nodes...');

  // Flatten all nodes
  let treeId = 0;
  for (const tree of masteryTrees) {
    const weaponName = tree.weapon_name;
    const weaponId = WEAPON_NAME_MAP[weaponName] || 0;

    for (const node of tree.nodes) {
      const grade = BRANCH_TO_GRADE[node.branch];

      // Find match in weaponMasteries
      const match = findMasteryMatch(node, weaponName, weaponMasteries);

      if (match) {
        matched++;
      } else {
        unmatched.push({
          weaponName,
          nodeName: node.name,
          grade,
        });
      }

      // Build stat array
      const stats = match && match.stats ? match.stats.map(s =>
        buildStatFull(s, match.description.en)
      ) : [];

      results.push({
        treeId,
        column: node.column,
        branch: node.branch,
        weaponId,
        weaponName,
        isSkillNode: node.isSkillNode,
        hasPassiveLevels: node.hasPassiveLevels,
        masteryId: match ? match.id : '',
        nameEn: node.name,
        namePt: match ? match.name.pt : '',
        grade,
        descriptionEn: node.description,
        descriptionPt: match ? match.description.pt : '',
        stats,
      });

      treeId++;
    }
  }

  // Generate TypeScript file
  const tsContent = `// GERADO AUTOMATICAMENTE — não edite manualmente
// Regenerar: node scripts/gen-mastery-index.mjs

export interface MasteryStatFull {
  labelEn:        string
  labelPt:        string
  valueAtLv10:    number
  isPercent:      boolean
  perLevel:       number
  levelThreshold: number
}

export interface MasteryNodeFull {
  treeId:           number
  column:           number
  branch:           number
  weaponId:         number
  weaponName:       string
  isSkillNode:      boolean
  hasPassiveLevels: boolean
  masteryId:        string   // '' se sem match
  nameEn:           string
  namePt:           string
  grade:            'Common' | 'Uncommon' | 'Rare' | 'Epic'
  descriptionEn:    string
  descriptionPt:    string
  stats:            MasteryStatFull[]
}

export const MASTERY_INDEX: MasteryNodeFull[] = [
${results.map(node => `  {
    treeId: ${node.treeId},
    column: ${node.column},
    branch: ${node.branch},
    weaponId: ${node.weaponId},
    weaponName: '${node.weaponName}',
    isSkillNode: ${node.isSkillNode},
    hasPassiveLevels: ${node.hasPassiveLevels},
    masteryId: '${node.masteryId}',
    nameEn: \`${node.nameEn}\`,
    namePt: \`${node.namePt}\`,
    grade: '${node.grade}',
    descriptionEn: \`${node.descriptionEn}\`,
    descriptionPt: \`${node.descriptionPt}\`,
    stats: [
${node.stats.map(stat => `      {
        labelEn: '${stat.labelEn}',
        labelPt: '${stat.labelPt}',
        valueAtLv10: ${stat.valueAtLv10},
        isPercent: ${stat.isPercent},
        perLevel: ${stat.perLevel},
        levelThreshold: ${stat.levelThreshold},
      }`).join(',\n')}
    ],
  }`).join(',\n')}
]
`;

  fs.writeFileSync(
    path.join(projectRoot, 'src/data/masteryIndex.ts'),
    tsContent,
    'utf8'
  );

  // Print report
  console.log('\n=== RELATÓRIO ===');
  console.log(`Total de nós: ${results.length}`);
  console.log(`Nós com match: ${matched}`);
  console.log(`Nós sem match: ${unmatched.length}`);

  if (unmatched.length > 0) {
    console.log('\nNós sem match:');
    unmatched.forEach(item => {
      console.log(`  - ${item.weaponName} / ${item.nodeName} (${item.grade})`);
    });
  }

  console.log(`\n✓ Arquivo gerado: src/data/masteryIndex.ts`);
}

generateMasteryIndex().catch(err => {
  console.error('Erro:', err.message);
  process.exit(1);
});
