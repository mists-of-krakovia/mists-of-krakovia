// Progressão de Nível/XP — Spec 2, Sub-parte C (+ ajuste pós-teste).
// Ver .kiro/specs/combate/design.md §2.5.
//
// Créditos por nível (ajustado): +3 atributo, +1 perícia de combate, +1 de campo.
// Além disso, cada nível concede bônus de DERIVADOS por classe (tabela em
// character.js), guardado em character_derived.level_bonus (separado da fórmula).
// Ao subir de nível, HP e estamina são restaurados ao máximo.
//
// Curva: XP para subir de N -> N+1 = round(100 * N^1.7). Nível máximo = 10.

const { calculateDerived, applyLevelBonus, addLevelBonus } = require('./character');

const MAX_LEVEL = 10;
const ATTR_POINTS_PER_LEVEL = 3;
const COMBAT_SKILL_POINTS_PER_LEVEL = 1;
const FIELD_SKILL_POINTS_PER_LEVEL = 1;

function xpToNext(level) {
  return Math.round(100 * Math.pow(level, 1.7));
}

// Aplica XP a um personagem e resolve todos os level-ups possíveis (até o teto).
//   character: { id, level, xp, xp_to_next, class }
//   attributes: linha de character_attributes
//   derived: linha de character_derived (inclui level_bonus atual)
//
// Retorna patches para characters, character_attributes e character_derived,
// além de um resumo textual.
function awardXp({ character, attributes, derived, amount }) {
  let level = character.level;
  let xp = character.xp + amount;
  let toNext = character.xp_to_next || xpToNext(level);

  let attrPts = attributes.points_available || 0;
  let combatPts = attributes.combat_skill_points || 0;
  let fieldPts = attributes.field_skill_points || 0;

  const classKey = character.class;
  let levelBonus = derived && derived.level_bonus ? { ...derived.level_bonus } : {};

  let levelsGained = 0;
  const summary = [];

  while (level < MAX_LEVEL && xp >= toNext) {
    xp -= toNext;
    level += 1;
    levelsGained += 1;
    attrPts += ATTR_POINTS_PER_LEVEL;
    combatPts += COMBAT_SKILL_POINTS_PER_LEVEL;
    fieldPts += FIELD_SKILL_POINTS_PER_LEVEL;
    levelBonus = addLevelBonus(levelBonus, classKey);
    toNext = xpToNext(level);
    summary.push(
      `Subiu para o nível ${level}! +${ATTR_POINTS_PER_LEVEL} atributo, ` +
      `+${COMBAT_SKILL_POINTS_PER_LEVEL} perícia de combate, +${FIELD_SKILL_POINTS_PER_LEVEL} de campo.`
    );
  }

  if (level >= MAX_LEVEL) {
    if (xp < 0) xp = 0;
    toNext = xpToNext(MAX_LEVEL);
  }

  const result = {
    leveledUp: levelsGained > 0,
    levelsGained,
    newLevel: level,
    xpGained: amount,
    newXp: xp,
    newXpToNext: toNext,
    characterPatch: { level, xp, xp_to_next: toNext },
    attributesPatch: {
      points_available: attrPts,
      combat_skill_points: combatPts,
      field_skill_points: fieldPts,
    },
    derivedPatch: null,
    summary,
  };

  // Se subiu de nível: recalcula derivados = fórmula(atributos) + novo level_bonus,
  // grava o level_bonus atualizado e RESTAURA HP/estamina ao máximo.
  if (levelsGained > 0) {
    const base = calculateDerived(attributes);
    const withBonus = applyLevelBonus(base, levelBonus);
    result.derivedPatch = {
      level_bonus: levelBonus,
      hp_max: withBonus.hp_max,
      hp_current: withBonus.hp_max,          // cura ao upar
      stamina_max: withBonus.stamina_max,
      stamina_current: withBonus.stamina_max, // restaura estamina ao upar
      attack_melee: withBonus.attack_melee,
      attack_ranged: withBonus.attack_ranged,
      defense: withBonus.defense,
      evasion: withBonus.evasion,
      speed: withBonus.speed,
      accuracy: withBonus.accuracy,
      mental_resistance: withBonus.mental_resistance,
      carry_capacity: withBonus.carry_capacity,
    };
  }

  return result;
}

module.exports = { xpToNext, awardXp, MAX_LEVEL };
