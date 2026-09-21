// Habilidades de classe — Spec 2, Sub-parte B. Ver .kiro/specs/combate/design.md §2.6.
// Resolve o efeito de cada habilidade usando as primitivas de services/combat.js.
// Referência: docs/mists_of_krakovia_classes_v2.pdf (Volume V).

const combat = require('./combat');
const { mgOf } = require('./character');

const MAX_CD_REDUCTION = 0.40;      // teto de redução por Velocidade (habilidades)
const MAX_CD_REDUCTION_ULT = 0.20;  // teto para ultimates

// Redução de cooldown por Velocidade: MP_AGI x 2%, teto 40% (20% ultimate).
// MP_AGI aproximado por speed/2 (speed = AGI x 2 na fórmula base).
function effectiveCooldown(base, mpAgi, isUltimate) {
  if (!base || base <= 0) return 0;
  const cap = isUltimate ? MAX_CD_REDUCTION_ULT : MAX_CD_REDUCTION;
  const reduction = Math.min(cap, (mpAgi || 0) * 0.02);
  return Math.max(1, Math.floor(base * (1 - reduction)));
}

// Valor de um atributo do personagem para escalar habilidades (MP).
// O snapshot guarda mp_agi; para outros, derivamos de forma aproximada a partir
// dos stats disponíveis. Preferimos usar o atributo real quando presente.
function mpOfAttr(participant, attr) {
  // participant.stats guarda derivados; o atributo base vem em stats._attrs se disponível.
  const attrs = participant.stats._attrs;
  if (attrs && attrs[attr] != null) return attrs[attr];
  // fallback grosseiro por derivado
  if (attr === 'intellect') return Math.round((participant.stats.observation || 10) / 2);
  if (attr === 'strength')  return Math.round((participant.stats.attack_melee || 10) / 2);
  if (attr === 'perception') return Math.round((participant.stats.accuracy || 10) / 3);
  return 5;
}

// Aplica as PASSIVAS de combate no snapshot do jogador (chamado ao montar o
// participante). abilities: linhas do abilities_catalog da classe, já filtradas
// por nível desbloqueado. Modifica participant.stats in-place.
function applyPassives(participant, abilities, level) {
  for (const ab of abilities) {
    if (!ab.is_passive) continue;
    if (level < ab.unlock_level) continue;
    const eff = ab.effect || {};
    if (eff.type === 'passive' && eff.mods) {
      for (const k of Object.keys(eff.mods)) {
        participant.stats[k] = (participant.stats[k] || 0) + eff.mods[k];
      }
    }
    if (eff.type === 'passive_defense_res') {
      // Pele de Aço: +MP_RES x factor de defesa.
      const mpRes = mpOfAttr(participant, 'resistance');
      participant.stats.defense = (participant.stats.defense || 0) + Math.round(mpRes * (eff.factor || 0.5));
    }
    // passive_heal_bonus / passive_info / passive_reveal / passive_trigger_*:
    // registradas; efeito aplicado em pontos específicos (cura, início de combate,
    // gatilho de HP baixo) tratados no motor onde fizer sentido.
  }
}

// Quais habilidades o personagem TEM disponíveis (desbloqueadas por nível e com
// requisito de perícia atendido). Retorna as linhas ativas (não-passivas).
function availableAbilities(abilities, level, skillLevels) {
  return abilities.filter((ab) => {
    if (ab.is_passive) return false;
    if (level < ab.unlock_level) return false;
    if (ab.req_skill) {
      const lvl = skillLevels[ab.req_skill] || 0;
      if (lvl < (ab.req_skill_level || 0)) return false;
    }
    return true;
  });
}

// Resolve o uso de uma habilidade ativa. Retorna { lines, ended? } e MUTA os
// participantes (dano, efeitos, cura). O chamador (rota) cuida de cooldown,
// checagem de fim e persistência.
//   actor: participante que usa. target: participante alvo (para 'enemy').
//   ability: linha do abilities_catalog. allies/enemies: listas de participantes.
function resolveAbility({ ability, actor, target }) {
  const eff = ability.effect || {};
  const lines = [];
  const who = actor.side === 'ally' ? 'Você' : actor.display_name;
  lines.push(`${who} usou ${ability.name}.`);

  const dealDamage = (t, amount) => {
    const dmg = Math.max(1, Math.round(amount));
    t.hp_current = Math.max(0, t.hp_current - dmg);
    if (t.hp_current === 0) t.is_defeated = true;
    return dmg;
  };

  switch (eff.type) {
    case 'multi_attack': {
      // Navalha Veloz: 2 golpes; 2º = secondRatio do dano.
      const hits = eff.hits || 2;
      for (let i = 0; i < hits; i++) {
        const r = combat.resolveAttack({ attacker: actor, defender: target, type: 'quick' });
        if (r.hit && r.damage > 0) {
          const scaled = i === 0 ? r.damage : Math.round(r.damage * (eff.secondRatio || 0.7));
          const d = dealDamage(target, scaled);
          lines.push(`Golpe ${i + 1}: ${d} de dano em ${target.display_name}.`);
        } else {
          lines.push(`Golpe ${i + 1}: errou.`);
        }
        if (target.is_defeated) break;
      }
      break;
    }
    case 'stealth': {
      // Passo Silencioso: entra em furtividade (bônus de evasão + habilita Emboscada).
      combat.addEffect(actor, { kind: 'stealth', name: 'Furtivo', turns: eff.turns || 2, evasionBonus: eff.evasionBonus || combat.STEALTH_EVASION_BONUS });
      lines.push('Você entra em furtividade: esquiva elevada e pronto para emboscar.');
      break;
    }
    case 'heavy_attack': {
      // Emboscada / Golpe Pesado. Emboscada exige estado furtivo.
      if (eff.requiresStealth && !combat.hasEffect(actor, 'stealth')) {
        lines.push('A emboscada exige estar em furtividade. Use Passo Silencioso antes.');
        return { lines, invalid: true };
      }
      const base = combat.effectiveStats(actor).attack_melee;
      let raw = base * (eff.damageMult || 2) + combat.rng(1, 10);
      if (eff.attrBonus) raw += mpOfAttr(actor, eff.attrBonus);
      const def = combat.effectiveStats(target).defense * (1 - (eff.ignoreDefense || 0));
      const d = dealDamage(target, raw - def);
      lines.push(`Golpe pesado: ${d} de dano em ${target.display_name}.`);
      if (eff.requiresStealth) combat.removeEffect(actor, 'stealth');
      if (eff.speedPenalty) actor.stats.speed_penalty_next = eff.speedPenalty;
      break;
    }
    case 'scaled_attack': {
      // Granada/Armadilha: dano = MP_attr x mult. Aplica efeitos secundários.
      const mp = mpOfAttr(actor, eff.attr || 'intellect');
      const raw = mp * (eff.mult || 2) + combat.rng(1, 6);
      const def = combat.effectiveStats(target).defense;
      const d = dealDamage(target, raw - def);
      lines.push(`${d} de dano em ${target.display_name}.`);
      for (const ap of eff.applies || []) {
        combat.addEffect(target, { ...ap });
        lines.push(`${target.display_name} sofre ${ap.name || 'um efeito'}.`);
      }
      break;
    }
    case 'attack_effect': {
      // Ataque com status (atordoar/paralisar/derrubar).
      const stats = combat.effectiveStats(actor);
      let raw;
      if (eff.attr) raw = mpOfAttr(actor, eff.attr) * (eff.attrMult || 2) + combat.rng(1, 8);
      else raw = (eff.ranged ? stats.attack_ranged : stats.attack_melee) * (eff.damageMult || 1) + combat.rng(1, 10);
      if (eff.attrBonus) raw += mpOfAttr(actor, eff.attrBonus);
      const def = combat.effectiveStats(target).defense;
      const d = dealDamage(target, raw - def);
      lines.push(`${d} de dano em ${target.display_name}.`);
      const statusChance = eff.statusChance != null ? eff.statusChance : 1;
      if (eff.status && !target.is_defeated && combat.chance(statusChance)) {
        combat.addEffect(target, { kind: eff.status.kind, name: eff.status.name, turns: eff.status.turns || 1 });
        lines.push(`${target.display_name}: ${eff.status.name}!`);
      }
      break;
    }
    case 'poison_attack': {
      // Ataque Envenenado: dano imediato (ataque normal) + veneno por turno.
      const r = combat.resolveAttack({ attacker: actor, defender: target, type: 'quick' });
      if (r.hit && r.damage > 0) { dealDamage(target, r.damage); lines.push(`${r.damage} de dano em ${target.display_name}.`); }
      else lines.push('O golpe errou.');
      if (!target.is_defeated) {
        const poison = Math.max(1, Math.round(mpOfAttr(actor, eff.attr || 'intellect') * (eff.poisonMult || 1.5)));
        combat.addEffect(target, { kind: 'poison', name: 'Veneno', turns: eff.turns || 3, damage: poison });
        lines.push(`${target.display_name} foi envenenado (${poison}/turno por ${eff.turns || 3} turnos).`);
      }
      break;
    }
    case 'next_attack_buff': {
      // Ponto Fraco: buff do próximo ataque.
      combat.addEffect(actor, { kind: 'next_attack', name: 'Ponto Fraco', turns: 3, damageMult: eff.damageMult || 1.3, ignoreDefense: eff.ignoreDefense || 0 });
      lines.push('Você mira um ponto fraco: o próximo ataque será mais letal.');
      break;
    }
    case 'self_buff': {
      // Provocação: +defesa (aggro latente para party).
      combat.addEffect(actor, { kind: 'buff', name: ability.name, turns: eff.turns || 2, mods: eff.mods || {} });
      lines.push('Você assume postura agressiva.' + (eff.taunt ? ' (provocação)' : ''));
      break;
    }
    case 'simple_attack': {
      // Tiro Rápido: ataque quick com multiplicador e bônus de acerto.
      const r = combat.resolveAttack({ attacker: actor, defender: target, type: 'quick', isRanged: !!eff.ranged });
      if (r.hit && r.damage > 0) {
        const scaled = Math.round(r.damage * (eff.damageMult || 1));
        const d = dealDamage(target, scaled);
        lines.push(`${d} de dano em ${target.display_name}.`);
      } else lines.push('O disparo errou.');
      break;
    }
    case 'heal': {
      // Poção em Área: cura o próprio usuário (sozinho). MP_attr x mult.
      const amount = Math.round(mpOfAttr(actor, eff.attr || 'intellect') * (eff.mult || 4));
      actor.hp_current = Math.min(actor.hp_max, actor.hp_current + amount);
      lines.push(`Você recupera ${amount} de PV.`);
      break;
    }
    default:
      lines.push('(A habilidade não teve efeito.)');
  }

  return { lines };
}

module.exports = {
  effectiveCooldown,
  applyPassives,
  availableAbilities,
  resolveAbility,
  mpOfAttr,
};
