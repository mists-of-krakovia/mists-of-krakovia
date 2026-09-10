// Recebe os atributos base (sem sanidade) e retorna os derivados calculados
function calculateDerived(attrs) {
  const { strength, agility, resistance, intellect, perception } = attrs;

  // Sanidade é derivada de Intelecto e Percepção
  const sanity = (intellect + perception) * 2;

  return {
    hp_max:            20 + (resistance * 5),
    hp_current:        20 + (resistance * 5),
    stamina_max:       100 + (resistance * 5),
    stamina_current:   100 + (resistance * 5),
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
    carry_capacity:    Math.floor(resistance / 7) * 10,
    mist_exposure:     0
  };
}

module.exports = { calculateDerived };