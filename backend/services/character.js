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

module.exports = { calculateDerived, mgOf };
