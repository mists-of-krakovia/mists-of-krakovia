// Cálculo de atributos derivados a partir dos 6 atributos base.
//
// Referência: docs/mists_of_krakovia_gameplay_v1.pdf (Volume III — Atributos
// Derivados). Sanidade é atributo base (6º) e alimenta Resistência Mental e
// Resistência à Névoa.
//
// Terminologia do documento:
//   MP (Modificador Pequeno): o próprio valor do atributo, 1..21.
//   MG (Modificador Grande):  a "letra" do grau, 1..7. Ex.: E-/E/E+ => 2.

// Converte um valor de atributo (1..21) no seu Modificador Grande (1..7).
function mgOf(value) {
  return Math.max(1, Math.ceil(value / 3));
}

// Recebe os 6 atributos base e retorna os derivados calculados.
function calculateDerived(attrs) {
  const strength   = attrs.strength   ?? 5;
  const agility    = attrs.agility    ?? 5;
  const resistance = attrs.resistance ?? 5;
  const intellect  = attrs.intellect  ?? 5;
  const perception = attrs.perception ?? 5;
  const sanity     = attrs.sanity     ?? 5;

  const hpMax      = 20 + (resistance * 5);
  const staminaMax = 100 + (resistance * 5);

  return {
    hp_max:            hpMax,
    hp_current:        hpMax,
    stamina_max:       staminaMax,
    stamina_current:   staminaMax,
    accuracy:          perception * 3,
    attack_melee:      strength * 2,
    attack_ranged:     perception * 2,
    defense:           resistance,
    evasion:           agility * 3,
    speed:             agility * 2,
    crit_chance:       3 + (perception * 0.5),
    crit_damage:       1.5 + (strength * 0.05),
    mental_resistance: sanity * 3,
    mist_resistance:   sanity * 2,
    observation:       perception + intellect,
    carry_capacity:    mgOf(strength) * 10,
    mist_exposure:     0
  };
}

// ─── Bônus de derivados por nível, por classe (Spec 2, ajuste pós-teste) ──────
// Ao subir de nível, além dos pontos de atributo/perícia, a classe ganha bônus
// fixos em derivados, refletindo os atributos secundários favorecidos (Volume V).
// Guardados separados (character_derived.level_bonus) e somados por cima da
// fórmula base. O jogador vê só o total.
const LEVEL_UP_BONUS_BY_CLASS = {
  //                 HP  ATK DEF SPD STM ACC EVA RMENTAL CARGA
  vagante_nevoas:  { hp_max: 3,  attack_melee: 2, attack_ranged: 2, defense: 1, speed: 3, stamina_max: 5, accuracy: 2, evasion: 3, mental_resistance: 1, carry_capacity: 2 },
  arauto_conclave: { hp_max: 6,  attack_melee: 2, attack_ranged: 2, defense: 1, speed: 1, stamina_max: 5, accuracy: 2, evasion: 1, mental_resistance: 2, carry_capacity: 3 },
  exilado_ferro:   { hp_max: 10, attack_melee: 3, attack_ranged: 3, defense: 3, speed: 1, stamina_max: 6, accuracy: 1, evasion: 1, mental_resistance: 2, carry_capacity: 5 },
  confessor_veu:   { hp_max: 6,  attack_melee: 1, attack_ranged: 1, defense: 1, speed: 2, stamina_max: 5, accuracy: 1, evasion: 2, mental_resistance: 3, carry_capacity: 2 },
  cronista_ruinas: { hp_max: 6,  attack_melee: 2, attack_ranged: 2, defense: 1, speed: 2, stamina_max: 5, accuracy: 3, evasion: 2, mental_resistance: 2, carry_capacity: 2 },
};

// Campos de derivado que recebem bônus de nível (os "max"/base; nunca crit_*).
const BONUS_KEYS = [
  'hp_max', 'attack_melee', 'attack_ranged', 'defense', 'speed',
  'stamina_max', 'accuracy', 'evasion', 'mental_resistance', 'carry_capacity',
];

// Soma os ganhos de UM nível ao objeto de bônus acumulado (retorna novo objeto).
function addLevelBonus(currentBonus, classKey) {
  const gain = LEVEL_UP_BONUS_BY_CLASS[classKey] || {};
  const next = { ...(currentBonus || {}) };
  for (const key of BONUS_KEYS) {
    if (gain[key]) next[key] = (next[key] || 0) + gain[key];
  }
  return next;
}

// Aplica o bônus acumulado por cima dos derivados calculados pela fórmula.
// Retorna um novo objeto de derivados (não muta o argumento). hp_current/
// stamina_current NÃO são tocados aqui (quem chama decide se cura).
function applyLevelBonus(derived, levelBonus) {
  const out = { ...derived };
  const bonus = levelBonus || {};
  for (const key of BONUS_KEYS) {
    if (bonus[key]) out[key] = (out[key] || 0) + bonus[key];
  }
  return out;
}

module.exports = {
  calculateDerived, mgOf,
  LEVEL_UP_BONUS_BY_CLASS, BONUS_KEYS,
  addLevelBonus, applyLevelBonus,
};
