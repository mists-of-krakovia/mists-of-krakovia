// Motor de combate por turnos — Spec 2, Sub-parte A.
// Ver .kiro/specs/combate/design.md §2.1-2.2.
// Referência: docs/mists_of_krakovia_gameplay_v1.pdf (Volume III — Combate).
//
// Este módulo é o núcleo de regras (funções em sua maioria puras). A persistência
// (ler/gravar sessão, participantes, turnos) fica em routes/combat.js. Aqui
// operamos sobre objetos JS que espelham as linhas de combat_participants.
//
// Terminologia:
//   MP (Modificador Pequeno): valor do atributo, 1..21.
//   Snapshot: os stats do combatente congelados no início do combate; buffs e
//   debuffs de combate mexem só no snapshot, nunca em character_derived.

const { mgOf } = require('./character');

// ─── Constantes de balanceamento (calibráveis) ────────────────────────────
const QUICK_DAMAGE_MULT = 0.85;   // Ataque Rápido: -15% dano
const QUICK_ACCURACY_BONUS = 0.10; // +10% acerto
const STRONG_DAMAGE_MULT = 1.25;  // Ataque Forte: +25% dano
const STRONG_SPEED_PENALTY = 3;   // -3 Velocidade na próxima rodada
const COUNTER_MULT = 1.5;         // Contra-ataque: dano normal x1.5
const HIT_MIN = 0.05;
const HIT_MAX = 0.95;
const HIT_SLOPE = 0.03;           // hitChance = 0.5 + (acc-eva)*0.03

// Classes que têm o recurso de Contra-Ataque. Fase de teste: todas true.
// Meta de design (Volume V): exclusivo do Vagante das Névoas.
const COUNTER_ATTACK_BY_CLASS = {
  vagante_nevoas:  true,
  arauto_conclave: true,
  exilado_ferro:   true,
  confessor_veu:   true,
  cronista_ruinas: true,
};

function counterAttackEnabled(classKey) {
  return COUNTER_ATTACK_BY_CLASS[classKey] === true;
}

// ─── RNG ───────────────────────────────────────────────────────────────────
function rng(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function chance(prob) {
  return Math.random() < prob;
}
function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

// ─── Snapshots ───────────────────────────────────────────────────────────────
// Monta o participante-jogador a partir de character + derived + skills.
// bonuses de perícia de arma/armadura entram aqui (fiel ao Volume III).
function buildPlayerParticipant(character, derived, skills, slot = 0) {
  const skillLevel = (slug) => {
    const s = (skills || []).find((k) => k.skill_name === slug);
    return s ? s.level : 0;
  };
  // Bônus simples de perícia (ponto de partida; calibrável):
  //   Armas Brancas Leves: +1 acerto, +0.5 ataque C.C. por nível.
  //   Armaduras: +1 defesa por nível (leves) — simplificado aqui.
  const lightBlade = skillLevel('armas_brancas_leves');
  const blockSkill = skillLevel('escudos_bloqueio');
  const lightArmor = skillLevel('armaduras_leves');
  const heavyArmor = skillLevel('armaduras_pesadas');

  const stats = {
    class: character.class,
    attack_melee:  derived.attack_melee + Math.round(lightBlade * 0.5),
    attack_ranged: derived.attack_ranged,
    defense:       derived.defense + lightArmor + heavyArmor * 2,
    accuracy:      derived.accuracy + lightBlade,
    evasion:       derived.evasion,
    speed:         derived.speed,
    crit_chance:   Number(derived.crit_chance),
    crit_damage:   Number(derived.crit_damage),
    mist_resistance: derived.mist_resistance,
    mp_agi:        Math.round(derived.speed / 2), // MP_AGI ~ speed/2 (speed=AGI*2)
    block_skill:   blockSkill,
    speed_penalty_next: 0, // acumulador de penalidade (Ataque Forte)
  };

  return {
    side: 'ally',
    character_id: character.id,
    enemy_slug: null,
    display_name: character.name,
    level: character.level,
    hp_max: derived.hp_max,
    hp_current: derived.hp_current,
    stats,
    effects: [],
    cooldowns: {},
    initiative: stats.speed,
    extra_actions: 0,
    reaction_used: false,
    is_defeated: false,
    slot,
  };
}

// Monta um participante-inimigo a partir de uma linha do enemy_catalog.
function buildEnemyParticipant(enemy, slot = 0, indexSuffix = '') {
  const stats = {
    class: null,
    attack_melee:  enemy.attack,
    attack_ranged: enemy.attack,
    defense:       enemy.defense,
    accuracy:      enemy.accuracy,
    evasion:       enemy.evasion,
    speed:         enemy.speed,
    crit_chance:   Number(enemy.crit_chance),
    crit_damage:   Number(enemy.crit_damage) / 100, // catálogo guarda em %, motor usa mult
    mist_resistance: enemy.mist_resistance,
    mp_agi:        Math.round(enemy.speed / 2),
    attack_types:  enemy.attack_types || ['quick', 'strong'],
    ai_profile:    enemy.ai_profile || 'attacker_simple',
    speed_penalty_next: 0,
  };
  return {
    side: 'enemy',
    character_id: null,
    enemy_slug: enemy.slug,
    display_name: indexSuffix ? `${enemy.name} ${indexSuffix}` : enemy.name,
    level: enemy.level,
    hp_max: enemy.hp_max,
    hp_current: enemy.hp_max,
    stats,
    effects: [],
    cooldowns: {},
    initiative: stats.speed,
    extra_actions: 0,
    reaction_used: false,
    is_defeated: false,
    slot,
  };
}

// ─── Iniciativa e ordem ──────────────────────────────────────────────────────
// Ordena participantes por Velocidade (desc), empate por RNG.
// Calcula ações adicionais: quem tem Velocidade >= 1.5x da MENOR do combate
// ganha +1; >= 2x ganha +2; etc. (Volume III).
function rollInitiative(participants) {
  const alive = participants.filter((p) => !p.is_defeated);
  const speeds = alive.map((p) => effectiveSpeed(p));
  const minSpeed = Math.max(1, Math.min(...speeds));

  for (const p of alive) {
    const ratio = effectiveSpeed(p) / minSpeed;
    p.extra_actions = ratio >= 1.5 ? Math.floor(ratio / 0.5) - 2 : 0;
    if (p.extra_actions < 0) p.extra_actions = 0;
    p._tiebreak = Math.random();
  }
  // ordena por velocidade efetiva desc, empate por RNG
  const ordered = [...alive].sort((a, b) => {
    const d = effectiveSpeed(b) - effectiveSpeed(a);
    return d !== 0 ? d : b._tiebreak - a._tiebreak;
  });
  return ordered.map((p) => p.id);
}

// Velocidade considerando penalidade temporária (Ataque Forte).
function effectiveSpeed(p) {
  const pen = p.stats.speed_penalty_next || 0;
  return Math.max(1, p.stats.speed - pen);
}

// ─── Resolução de acerto ─────────────────────────────────────────────────────
function hitChance(attackerStats, defenderStats, type) {
  let base = 0.5 + (attackerStats.accuracy - defenderStats.evasion) * HIT_SLOPE;
  if (type === 'quick') base += QUICK_ACCURACY_BONUS;
  return clamp(base, HIT_MIN, HIT_MAX);
}

// ─── Resolução de reação (matchup às cegas) ──────────────────────────────────
// incomingType: 'quick' | 'strong'; reaction: 'block' | 'dodge'.
// Retorna { mitigation: 0..1 (fração do dano removida), matchupCorrect, note }.
function resolveReaction(incomingType, reaction, defenderStats) {
  if (reaction === 'dodge') {
    if (incomingType === 'quick') {
      return { mitigation: 1, matchupCorrect: true, note: 'Esquiva perfeita.' };
    }
    // desviar de um Forte: falha (tudo-ou-nada)
    return { mitigation: 0, matchupCorrect: false, note: 'Desvio falhou contra golpe pesado.' };
  }
  if (reaction === 'block') {
    if (incomingType === 'strong') {
      return { mitigation: 1, matchupCorrect: true, note: 'Bloqueio perfeito.' };
    }
    // bloquear um Rápido: ainda mitiga parte (perícia Escudos*2 + defesa).
    // Convertemos a mitigação absoluta numa fração aplicada no cálculo de dano.
    return {
      mitigation: 'partial',
      matchupCorrect: false,
      note: 'Bloqueio parcial.',
      partialFlat: (defenderStats.block_skill || 0) * 2 + defenderStats.defense,
    };
  }
  return { mitigation: 0, matchupCorrect: false, note: 'Sem reação.' };
}

// ─── Resolução de ataque ─────────────────────────────────────────────────────
// attacker/defender: participantes. type: 'quick'|'strong'. isRanged: bool.
// reaction (opcional): resultado de resolveReaction já calculado (defensor jogador).
// Retorna { hit, crit, damage, mitigated, blocked, note }.
function resolveAttack({ attacker, defender, type, reaction, isRanged = false }) {
  const aStats = attacker.stats;
  const dStats = defender.stats;
  const baseAttack = isRanged ? aStats.attack_ranged : aStats.attack_melee;

  const result = { hit: false, crit: false, damage: 0, mitigated: 0, blocked: false, type, note: '' };

  // 1. Acerto
  const hc = hitChance(aStats, dStats, type);
  if (!chance(hc)) {
    result.note = 'Errou o ataque.';
    return result;
  }
  result.hit = true;

  // 2. Modificador de tipo
  const typeMult = type === 'strong' ? STRONG_DAMAGE_MULT : QUICK_DAMAGE_MULT;
  if (type === 'strong') attacker.stats.speed_penalty_next = STRONG_SPEED_PENALTY;

  // 3. Crítico
  let critMult = 1;
  if (chance((aStats.crit_chance || 3) / 100)) {
    result.crit = true;
    critMult = aStats.crit_damage || 1.5;
  }

  // 4. Dano bruto
  let raw = baseAttack * typeMult * critMult + rng(1, 10);

  // 5. Reação do defensor (se houver)
  if (reaction) {
    if (reaction.mitigation === 1) {
      result.blocked = true;
      result.damage = 0;
      result.mitigated = Math.round(raw);
      result.note = reaction.note;
      return result;
    }
    if (reaction.mitigation === 'partial') {
      raw = Math.max(0, raw - (reaction.partialFlat || 0));
      result.blocked = true;
      result.note = reaction.note;
    }
  }

  // 6. Defesa do alvo + mínimo 1
  const dmg = Math.max(1, Math.round(raw - dStats.defense));
  result.damage = dmg;
  return result;
}

// ─── Contra-ataque ───────────────────────────────────────────────────────────
// Só quando o defensor reagiu corretamente E a classe tem o recurso.
// O defensor (que reagiu) devolve dano no atacante. Retorna null se não aplicável.
function resolveCounter({ defender, attacker }) {
  const classKey = defender.stats.class;
  if (!classKey || !counterAttackEnabled(classKey)) return null;

  const baseAttack = defender.stats.attack_melee;
  const raw = baseAttack * COUNTER_MULT + rng(1, 10);
  const dmg = Math.max(1, Math.round(raw - attacker.stats.defense));
  return { damage: dmg, note: 'Contra-ataque!' };
}

// ─── IA do inimigo ───────────────────────────────────────────────────────────
// attacker_simple: escolhe um alvo aliado vivo e um tipo dentre attack_types.
function enemyChooseAction(enemy, allies) {
  const targets = allies.filter((a) => !a.is_defeated);
  if (targets.length === 0) return null;
  const target = targets[rng(0, targets.length - 1)];
  const types = enemy.stats.attack_types || ['quick', 'strong'];
  const type = types[rng(0, types.length - 1)];
  return { targetId: target.id, type };
}

// ─── Fim de combate ──────────────────────────────────────────────────────────
function checkEnd(participants) {
  const alliesAlive = participants.some((p) => p.side === 'ally' && !p.is_defeated);
  const enemiesAlive = participants.some((p) => p.side === 'enemy' && !p.is_defeated);
  if (!enemiesAlive) return 'allies_won';
  if (!alliesAlive) return 'enemies_won';
  return 'active';
}

// Soma o xp_reward dos inimigos derrotados (para creditar na vitória).
function sumXpReward(enemyRows, defeatedSlugs) {
  return defeatedSlugs.reduce((acc, slug) => {
    const e = enemyRows.find((r) => r.slug === slug);
    return acc + (e ? e.xp_reward : 0);
  }, 0);
}

// ─── Narração (log rico) ──────────────────────────────────────────────────────
const ATTACK_TYPE_LABEL = { quick: 'Ataque Rápido', strong: 'Ataque Forte' };

// Descreve um ataque (quem, tipo, acerto/erro, crítico, dano, bloqueio).
// atk: retorno de resolveAttack. attacker/defender: participantes.
function narrateAttack(attacker, defender, type, atk) {
  const who = attacker.side === 'ally' ? 'Você' : attacker.display_name;
  const alvo = defender.side === 'ally' ? 'você' : defender.display_name;
  const verbUsou = attacker.side === 'ally' ? 'usou' : 'usou';
  const label = ATTACK_TYPE_LABEL[type] || 'Ataque';

  if (!atk.hit) {
    return `${who} ${verbUsou} ${label} em ${alvo}, mas errou.`;
  }
  if (atk.blocked && atk.damage === 0) {
    // reação perfeita já é narrada em narrateReaction; aqui só o ataque em si.
    return `${who} ${verbUsou} ${label} em ${alvo}.`;
  }
  const critTxt = atk.crit ? ' crítico' : '';
  return `${who} ${verbUsou} ${label}${critTxt} em ${alvo} e causou ${atk.damage} de dano.`;
}

// Descreve o resultado de uma reação do jogador.
function narrateReaction(defender, reactionInput, reaction, incomingType) {
  if (!reactionInput) return null;
  const acao = reactionInput === 'block' ? 'bloqueou' : 'desviou';
  if (reaction.matchupCorrect) {
    return `Você ${acao} no momento certo e anulou o ataque!`;
  }
  if (reactionInput === 'block') {
    return `Você bloqueou e reduziu parte do dano.`;
  }
  return `Você tentou desviar, mas o golpe acertou em cheio.`;
}

// Descreve um contra-ataque.
function narrateCounter(defender, attacker, counterInfo) {
  const who = defender.side === 'ally' ? 'Você' : defender.display_name;
  const alvo = attacker.side === 'ally' ? 'você' : attacker.display_name;
  return `${who} revidou com um contra-ataque em ${alvo}, causando ${counterInfo.damage} de dano!`;
}

function narrateDefeat(p) {
  return p.side === 'ally' ? 'Você caiu em combate.' : `${p.display_name} foi derrotado.`;
}

// ─── Sorteio de spawn ─────────────────────────────────────────────────────────
// Recebe linhas de node_spawns (com weight) e sorteia UMA por peso.
function pickSpawn(spawnRows) {
  const active = spawnRows.filter((s) => s.is_active);
  if (active.length === 0) return null;
  const total = active.reduce((acc, s) => acc + s.weight, 0);
  let roll = rng(1, total);
  for (const s of active) {
    roll -= s.weight;
    if (roll <= 0) return s;
  }
  return active[active.length - 1];
}

module.exports = {
  // constantes / config
  COUNTER_ATTACK_BY_CLASS,
  counterAttackEnabled,
  // snapshots
  buildPlayerParticipant,
  buildEnemyParticipant,
  // motor
  rollInitiative,
  effectiveSpeed,
  hitChance,
  resolveReaction,
  resolveAttack,
  resolveCounter,
  enemyChooseAction,
  checkEnd,
  sumXpReward,
  pickSpawn,
  // narração
  narrateAttack,
  narrateReaction,
  narrateCounter,
  narrateDefeat,
  ATTACK_TYPE_LABEL,
  // utils expostos p/ testes
  rng,
  chance,
  clamp,
};
