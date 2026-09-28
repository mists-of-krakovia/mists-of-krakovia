// Camada de equipamento — Spec 3 (Inventário), Sub-partes C/D.
// Ver .kiro/specs/inventario/design.md §2.
//
// Funções PURAS. A persistência (ler inventário, gravar is_equipped) fica nas
// rotas. Aqui só calculamos as camadas de bônus/penalidade e validamos requisitos.
//
// Princípio (Volume III): character_derived = base(fórmula) + level_bonus. O
// equipamento NÃO é persistido lá; entra como CAMADA calculada on-the-fly, para que
// a origem de cada ponto (base / nível / equipamento / sobrepeso) seja legível.

const { mgOf } = require('./character');

// Derivados que um item pode somar (chaves de items.stats). Equipamento normal só
// soma (nunca reduz). 'heal' e afins de consumível NÃO entram aqui (não são bônus
// de equipamento).
const EQUIP_STAT_KEYS = [
  'hp_max', 'attack_melee', 'attack_ranged', 'defense', 'accuracy',
  'evasion', 'speed', 'crit_chance', 'crit_damage',
  'mental_resistance', 'mist_resistance', 'observation',
];

// ─── Bônus de equipamento ─────────────────────────────────────────────────────
// equippedItems: linhas de character_inventory equipadas, cada uma com o item
// embutido (row.items = { slug, name, stats, ... }). Retorna:
//   { totals: { <derivado>: soma }, bySource: [{ slot, item_slug, name, mods }] }
function equipmentBonus(equippedItems) {
  const totals = {};
  const bySource = [];
  for (const row of equippedItems || []) {
    const item = row.items || row.item || {};
    const stats = item.stats || {};
    const mods = {};
    for (const key of EQUIP_STAT_KEYS) {
      if (stats[key]) {
        totals[key] = (totals[key] || 0) + stats[key];
        mods[key] = stats[key];
      }
    }
    if (Object.keys(mods).length > 0) {
      bySource.push({
        slot: row.equipped_slot || item.equipment_slot || null,
        item_slug: item.slug || null,
        name: item.name || null,
        mods,
      });
    }
  }
  return { totals, bySource };
}

// ─── Requisitos para equipar ──────────────────────────────────────────────────
// item.requirements: { str_mg?, agi_mg?, ..., skill?, level? }.
//   *_mg  -> Modificador Grande mínimo do atributo (str/agi/res/int/per/san).
//   skill -> slug de perícia; level -> nível mínimo dessa perícia.
// attributes: linha de character_attributes. skillLevels: { slug: nível }.
// Retorna { ok, reason }.
const MG_ATTR = {
  str_mg: 'strength', agi_mg: 'agility', res_mg: 'resistance',
  int_mg: 'intellect', per_mg: 'perception', san_mg: 'sanity',
};

function canEquip(item, attributes, skillLevels) {
  if (!item) return { ok: false, reason: 'Item inexistente.' };
  if (!item.is_equippable) return { ok: false, reason: 'Este item não pode ser equipado.' };
  const req = item.requirements || {};

  for (const [reqKey, attrKey] of Object.entries(MG_ATTR)) {
    if (req[reqKey]) {
      const have = mgOf(attributes?.[attrKey] ?? 0);
      if (have < req[reqKey]) {
        return { ok: false, reason: `Requer ${attrKey} MG ${req[reqKey]} (você tem ${have}).` };
      }
    }
  }

  if (req.skill) {
    const have = (skillLevels || {})[req.skill] || 0;
    const need = req.level || 1;
    if (have < need) {
      return { ok: false, reason: `Requer perícia ${req.skill} nível ${need} (você tem ${have}).` };
    }
  }

  return { ok: true, reason: null };
}

// ─── Peso e sobrepeso ─────────────────────────────────────────────────────────
// totalWeight: soma de items.weight × quantity de TODO o inventário.
function totalWeight(inventoryRows) {
  let w = 0;
  for (const row of inventoryRows || []) {
    const item = row.items || row.item || {};
    w += (Number(item.weight) || 0) * (row.quantity || 1);
  }
  return Math.round(w * 100) / 100;
}

// Penalidade de sobrepeso (R7): PESADA acima da capacidade. Camada negativa
// aplicada a Velocidade e Evasão, proporcional ao excesso; acima de ~150% da
// capacidade, bloqueia ações de mobilidade (fuga) em combate.
// Constantes calibráveis.
const OVERWEIGHT_SPEED_PER_10PCT   = 2;  // -2 Velocidade por 10% de excesso
const OVERWEIGHT_EVASION_PER_10PCT = 3;  // -3 Evasão por 10% de excesso
const OVERWEIGHT_IMMOBILE_RATIO    = 1.5; // >150% da capacidade: sem mobilidade

// Retorna { level: 'ok'|'over'|'immobile', excessPct, mods: { speed, evasion },
//           blockMobility }.
function weightPenalty(total, carryCapacity) {
  const cap = Math.max(1, carryCapacity || 0);
  if (total <= cap) {
    return { level: 'ok', excessPct: 0, mods: {}, blockMobility: false };
  }
  const ratio = total / cap;
  const excessPct = Math.round((ratio - 1) * 100);
  const steps = excessPct / 10;
  const mods = {
    speed:   -Math.round(steps * OVERWEIGHT_SPEED_PER_10PCT),
    evasion: -Math.round(steps * OVERWEIGHT_EVASION_PER_10PCT),
  };
  const immobile = ratio >= OVERWEIGHT_IMMOBILE_RATIO;
  return {
    level: immobile ? 'immobile' : 'over',
    excessPct,
    mods,
    blockMobility: immobile,
  };
}

// Combina bônus de equipamento (positivo) e penalidade de sobrepeso (negativo)
// numa única camada de derivados, para somar aos stats. Útil para o snapshot de
// combate (Sub-parte D).
function combinedLayer(equippedItems, inventoryRows, carryCapacity) {
  const { totals } = equipmentBonus(equippedItems);
  const wp = weightPenalty(totalWeight(inventoryRows), carryCapacity);
  const layer = { ...totals };
  for (const k of Object.keys(wp.mods)) {
    layer[k] = (layer[k] || 0) + wp.mods[k];
  }
  return { layer, weight: wp };
}

module.exports = {
  EQUIP_STAT_KEYS,
  equipmentBonus,
  canEquip,
  totalWeight,
  weightPenalty,
  combinedLayer,
};
