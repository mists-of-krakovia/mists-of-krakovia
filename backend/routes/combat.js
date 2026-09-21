// Rotas de combate — Spec 2, Sub-parte A. Ver .kiro/specs/combate/design.md §2.3.
//
// Fluxo geral:
//   POST /combat/hunt            -> inicia combate (Caçar, 100% por ora)
//   GET  /combat/:sessionId      -> estado atual
//   POST /combat/:sessionId/action -> ação do jogador no seu turno
//   POST /combat/:sessionId/react  -> resposta ao prompt de reação
//   POST /combat/:sessionId/flee   -> tentativa de fuga
//
// Modelo de reação pendente (design §2.2): quando chega a vez de um inimigo que
// vai atacar o jogador, o backend NÃO resolve — grava session.pending e devolve
// ao cliente pedindo a reação. O cliente chama /react. "Uma reação por ciclo":
// ao reagir uma vez, reaction_used=true e os inimigos seguintes resolvem sem
// oferecer reação. reaction_used reseta quando volta a vez do jogador.

const express = require('express');
const router = express.Router();
const { supabase } = require('../server');
const { authenticateToken } = require('../services/auth');
const combat = require('../services/combat');
const progression = require('../services/progression');
const loot = require('../services/loot');

router.use(authenticateToken);

// ─── Helpers de persistência ────────────────────────────────────────────────

// Carrega sessão + participantes + linhas de enemy_catalog envolvidas.
async function loadSession(sessionId, userId) {
  const { data: session, error } = await supabase
    .from('combat_sessions')
    .select('*')
    .eq('id', sessionId)
    .single();
  if (error || !session) return { error: 'Sessão não encontrada.' };

  const { data: participants } = await supabase
    .from('combat_participants')
    .select('*')
    .eq('session_id', sessionId);

  // Propriedade: o jogador precisa ter um participante seu cujo character lhe pertence.
  const allyChar = participants.find((p) => p.side === 'ally' && p.character_id);
  if (allyChar) {
    const { data: owned } = await supabase
      .from('characters')
      .select('id')
      .eq('id', allyChar.character_id)
      .eq('account_id', userId)
      .single();
    if (!owned) return { error: 'Sessão não pertence a este usuário.' };
  }

  return { session, participants };
}

// Grava um participante (campos mutáveis).
async function saveParticipant(p) {
  await supabase
    .from('combat_participants')
    .update({
      hp_current: p.hp_current,
      stats: p.stats,
      effects: p.effects,
      cooldowns: p.cooldowns,
      initiative: p.initiative,
      extra_actions: p.extra_actions,
      reaction_used: p.reaction_used,
      is_defeated: p.is_defeated,
    })
    .eq('id', p.id);
}

async function saveAllParticipants(participants) {
  for (const p of participants) await saveParticipant(p);
}

async function saveSession(session) {
  await supabase
    .from('combat_sessions')
    .update({
      status: session.status,
      round_number: session.round_number,
      turn_order: session.turn_order,
      active_index: session.active_index,
      pending: session.pending,
      ended_at: session.ended_at || null,
    })
    .eq('id', session.id);
}

async function logTurn(sessionId, round, turnNo, actorId, targetId, actionType, result) {
  await supabase.from('combat_turns').insert({
    session_id: sessionId,
    round_number: round,
    turn_number: turnNo,
    actor_id: actorId,
    target_id: targetId || null,
    action_type: actionType,
    result: result || {},
  });
}

function byId(participants, id) {
  return participants.find((p) => p.id === id);
}

// Carrega as linhas de enemy_catalog dos inimigos presentes (para xp_reward/loot).
async function loadEnemyRows(participants) {
  const slugs = [...new Set(participants.filter((p) => p.enemy_slug).map((p) => p.enemy_slug))];
  if (slugs.length === 0) return [];
  const { data } = await supabase.from('enemy_catalog').select('*').in('slug', slugs);
  return data || [];
}

// Sincroniza o HP do participante-jogador de volta para character_derived, para
// que o HP perdido na luta persista fora do combate. Chamado quando o combate
// termina. O level-up (em grantVictoryRewards) sobrescreve com cura, se houver.
async function syncPlayerHp(participants) {
  const player = participants.find((p) => p.side === 'ally' && p.character_id);
  if (!player) return;
  // Persiste o HP em que a luta terminou. Piso de 1: ainda não há sistema de
  // morte/reanimação, então deixar o personagem com 0 HP travaria o jogo.
  // (Quando o fluxo de derrota existir, remover o piso.)
  const hp = Math.max(1, player.hp_current);
  await supabase
    .from('character_derived')
    .update({ hp_current: hp })
    .eq('character_id', player.character_id);
}

// Aplica o fluxo de derrota: respawn no ponto salvo (ou Ironfall), penalidades e
// revive com 50% do HP. Popula session._reward com o resumo do respawn.
async function handleDefeat(session, participants) {
  const player = participants.find((p) => p.side === 'ally' && p.character_id);
  if (!player) return;

  const { data: character } = await supabase
    .from('characters')
    .select('id, xp, xp_to_next, respawn_points, character_derived (*)')
    .eq('id', player.character_id)
    .single();
  if (!character) return;

  const derived = Array.isArray(character.character_derived)
    ? character.character_derived[0] : character.character_derived;

  // Ponto de respawn: mais recente salvo, ou Ironfall (nó inicial), ou fica onde está.
  let respawnNodeId = null;
  const rp = Array.isArray(character.respawn_points) ? character.respawn_points : [];
  if (rp.length > 0) respawnNodeId = rp[0].node_id;
  if (!respawnNodeId) {
    const { data: ironfall } = await supabase
      .from('world_nodes').select('id').eq('description_key', 'ironfall_central').maybeSingle();
    if (ironfall) respawnNodeId = ironfall.id;
  }

  // Penalidade de XP: -10% da XP necessária para o próximo nível. Piso 0 no XP do
  // nível; NÃO regride de nível.
  const xpPenalty = Math.round((character.xp_to_next || 0) * 0.10);
  const newXp = Math.max(0, (character.xp || 0) - xpPenalty);

  // Penalidade de estamina: -20 (piso 0). Revive com 50% do HP máximo.
  const staminaMax = derived?.stamina_max ?? 0;
  const staminaCur = derived?.stamina_current ?? 0;
  const newStamina = Math.max(0, Math.min(staminaCur, staminaMax) - 20);
  const reviveHp = Math.max(1, Math.floor((derived?.hp_max ?? 2) * 0.5));

  // Grava character (xp + respawn de nó) e derived (HP/estamina).
  const charPatch = { xp: newXp };
  if (respawnNodeId) charPatch.current_node_id = respawnNodeId;
  await supabase.from('characters').update(charPatch).eq('id', character.id);
  await supabase.from('character_derived')
    .update({ hp_current: reviveHp, stamina_current: newStamina })
    .eq('character_id', character.id);

  // Marca presença no nó de respawn (sessão de local), se mudou.
  if (respawnNodeId) {
    await supabase.from('character_sessions')
      .update({ node_id: respawnNodeId, last_active: new Date().toISOString() })
      .eq('character_id', character.id);
  }

  pushEvent(session, `Você foi derrotado. Perdeu ${xpPenalty} de XP e 20 de estamina.`);
  pushEvent(session, 'Você desperta de volta em segurança, com metade da vida.');

  session._reward = {
    defeat: true,
    xpLost: xpPenalty,
    staminaLost: Math.min(20, staminaCur),
    reviveHp,
    respawnNodeId,
  };
}

// Se o combate terminou, persiste o HP e, em vitória, credita recompensas.
async function finalizeIfEnded(session, participants) {
  if (session.status === 'active') return;

  if (session.status === 'enemies_won') {
    // Derrota: respawn + penalidades + revive 50% (não persiste HP 0).
    await handleDefeat(session, participants);
    return;
  }

  // Vitória ou fuga: persiste o HP do fim da luta.
  await syncPlayerHp(participants);

  // Vitória: recompensas. Se subir de nível, o derivedPatch cura ao máximo.
  if (session.status === 'allies_won') {
    const enemyRows = await loadEnemyRows(participants);
    await grantVictoryRewards(session, participants, enemyRows);
  }
}

// Monta o payload de estado enviado ao cliente.
// session._events: linhas de narração acumuladas nesta requisição (log rico).
// session._reward: resumo de recompensa (XP, level-up, loot) quando o combate termina.
function statePayload(session, participants) {
  return {
    session: {
      id: session.id,
      node_id: session.node_id,
      status: session.status,
      round_number: session.round_number,
      turn_order: session.turn_order,
      active_index: session.active_index,
      pending: session.pending,
    },
    participants: participants.map((p) => ({
      id: p.id, side: p.side, display_name: p.display_name, level: p.level,
      hp_max: p.hp_max, hp_current: p.hp_current, is_defeated: p.is_defeated,
      character_id: p.character_id, enemy_slug: p.enemy_slug,
      effects: p.effects,
      // stats parciais visíveis (não expõe tudo do inimigo)
      speed: p.stats.speed,
    })),
    events: session._events || [],
    reward: session._reward || null,
  };
}

// Adiciona linha(s) de narração ao acumulador da requisição.
function pushEvent(session, ...lines) {
  if (!session._events) session._events = [];
  for (const l of lines) if (l) session._events.push(l);
}

// ─── Motor de progressão de turnos (orquestração) ────────────────────────────
// Processa os turnos dos INIMIGOS a partir do active_index atual, até:
//  - surgir uma reação pendente (retorna aguardando /react), ou
//  - voltar a vez de um aliado (retorna para o jogador agir), ou
//  - o combate terminar.
// Mutates participants/session in-memory; NÃO grava (o chamador grava).
async function runEnemyTurns(session, participants) {
  const order = session.turn_order;

  while (true) {
    const end = combat.checkEnd(participants);
    if (end !== 'active') { session.status = end; return { ended: true }; }

    // avança até o próximo ator vivo
    if (session.active_index >= order.length) {
      // fim da rodada: nova rodada, recomputa iniciativa e limpa penalidades
      startNewRound(session, participants);
    }
    const actorId = order[session.active_index];
    const actor = byId(participants, actorId);

    if (!actor || actor.is_defeated) { session.active_index += 1; continue; }

    if (actor.side === 'ally') {
      // vez do jogador: reseta reação e devolve o controle
      actor.reaction_used = false;
      return { ended: false, awaitingPlayer: true };
    }

    // ator inimigo: escolhe alvo/tipo
    const allies = participants.filter((p) => p.side === 'ally');
    const action = combat.enemyChooseAction(actor, allies);
    if (!action) { session.active_index += 1; continue; }

    const target = byId(participants, action.targetId);

    // Se o alvo é o jogador e ele ainda pode reagir → cria reação pendente.
    if (target.side === 'ally' && !target.reaction_used) {
      session.pending = {
        awaiting_reaction: true,
        enemy_id: actor.id,
        target_id: target.id,
        attack_type: action.type, // guardado no servidor; NÃO enviado ao cliente
      };
      return { ended: false, awaitingReaction: true };
    }

    // Sem reação possível: resolve direto.
    await resolveEnemyAttack(session, participants, actor, target, action.type, null);
    session.active_index += 1;

    const end2 = combat.checkEnd(participants);
    if (end2 !== 'active') { session.status = end2; return { ended: true }; }
  }
}

// Aplica um ataque inimigo (com ou sem reação já resolvida do jogador).
async function resolveEnemyAttack(session, participants, enemy, target, type, reactionInput) {
  let reaction = null;
  let counterInfo = null;

  if (reactionInput && (reactionInput === 'block' || reactionInput === 'dodge')) {
    reaction = combat.resolveReaction(type, reactionInput, target.stats);
    target.reaction_used = true;
  }

  const atk = combat.resolveAttack({ attacker: enemy, defender: target, type, reaction });
  if (atk.damage > 0) {
    target.hp_current = Math.max(0, target.hp_current - atk.damage);
    if (target.hp_current === 0) target.is_defeated = true;
  }

  // Narração: o ataque, a reação (se houve) e eventual queda do alvo.
  pushEvent(session, combat.narrateAttack(enemy, target, type, atk));
  if (reactionInput) {
    pushEvent(session, combat.narrateReaction(target, reactionInput, reaction, type));
  }
  if (target.is_defeated) pushEvent(session, combat.narrateDefeat(target));

  await logTurn(session.id, session.round_number, session.active_index, enemy.id, target.id,
    `enemy_attack_${type}`, { ...atk, reaction: reactionInput || null,
      matchupCorrect: reaction ? reaction.matchupCorrect : null });

  // Contra-ataque automático se a reação foi correta.
  if (reaction && reaction.matchupCorrect) {
    counterInfo = combat.resolveCounter({ defender: target, attacker: enemy });
    if (counterInfo) {
      enemy.hp_current = Math.max(0, enemy.hp_current - counterInfo.damage);
      if (enemy.hp_current === 0) enemy.is_defeated = true;
      pushEvent(session, combat.narrateCounter(target, enemy, counterInfo));
      if (enemy.is_defeated) pushEvent(session, combat.narrateDefeat(enemy));
      await logTurn(session.id, session.round_number, session.active_index, target.id, enemy.id,
        'counter', counterInfo);
    }
  }

  return { atk, counter: counterInfo, reaction };
}

// Concede recompensas na vitória: soma xp_reward dos inimigos derrotados, aplica
// progressão (level-up) e rola loot. Grava character/attributes. Idempotente por
// sessão: só credita se ainda não creditou (guarda em session.pending._rewarded).
// Popula session._reward com o resumo para o payload.
async function grantVictoryRewards(session, participants, enemyRows) {
  // guarda de idempotência
  const already = session.pending && session.pending._rewarded;
  if (already) return;

  const player = participants.find((p) => p.side === 'ally' && p.character_id);
  if (!player) return;

  const defeatedSlugs = participants
    .filter((p) => p.side === 'enemy' && p.is_defeated && p.enemy_slug)
    .map((p) => p.enemy_slug);

  const xpGained = combat.sumXpReward(enemyRows, defeatedSlugs);

  // Carrega estado atual do personagem para aplicar a progressão.
  const { data: character } = await supabase
    .from('characters')
    .select('id, class, level, xp, xp_to_next, character_attributes (*), character_derived (*)')
    .eq('id', player.character_id)
    .single();
  if (!character) return;

  const attributes = Array.isArray(character.character_attributes)
    ? character.character_attributes[0] : character.character_attributes;
  const derived = Array.isArray(character.character_derived)
    ? character.character_derived[0] : character.character_derived;

  const prog = progression.awardXp({ character, attributes, derived, amount: xpGained });

  // Grava characters (nível, xp, xp_to_next).
  await supabase.from('characters').update(prog.characterPatch).eq('id', character.id);
  // Grava pontos creditados e derivados (bônus de nível + cura) se houve level-up.
  if (prog.leveledUp) {
    await supabase.from('character_attributes').update(prog.attributesPatch).eq('character_id', character.id);
    if (prog.derivedPatch) {
      await supabase.from('character_derived').update(prog.derivedPatch).eq('character_id', character.id);
    }
  }

  // Loot (loop pronto; concessão inerte enquanto loot_table vazia).
  const drops = loot.rollLoot(enemyRows, defeatedSlugs);
  const grantedLoot = await loot.grantLoot(drops);

  // Narração da recompensa.
  pushEvent(session, `Vitória! Você ganhou ${xpGained} de XP.`);
  for (const line of prog.summary) pushEvent(session, line);
  if (grantedLoot.length) {
    pushEvent(session, `Espólio: ${grantedLoot.map((d) => `${d.quantity}× ${d.item_slug}`).join(', ')}.`);
  }

  session._reward = {
    xpGained,
    leveledUp: prog.leveledUp,
    levelsGained: prog.levelsGained,
    newLevel: prog.newLevel,
    newXp: prog.newXp,
    newXpToNext: prog.newXpToNext,
    levelUpSummary: prog.summary,
    loot: grantedLoot,
  };

  // marca creditado
  session.pending = { ...(session.pending || {}), _rewarded: true };
}

// Inicia nova rodada: recomputa iniciativa/ações extras, zera penalidades de velocidade.
function startNewRound(session, participants) {
  session.round_number += 1;
  session.active_index = 0;
  for (const p of participants) {
    if (p.stats.speed_penalty_next) p.stats.speed_penalty_next = 0;
  }
  session.turn_order = combat.rollInitiative(participants);
}

// ─── POST /combat/hunt — Caçar (100% por ora) ────────────────────────────────
router.post('/hunt', async (req, res) => {
  try {
    const { characterId } = req.body;
    if (!characterId) return res.status(400).json({ error: 'characterId obrigatório.' });

    const { data: character, error } = await supabase
      .from('characters')
      .select('*, character_derived (*), character_skills (*)')
      .eq('id', characterId)
      .eq('account_id', req.userId)
      .single();
    if (error || !character) return res.status(404).json({ error: 'Personagem não encontrado.' });

    const nodeId = character.current_node_id;
    if (!nodeId) return res.status(400).json({ error: 'Personagem não está em um nó.' });

    // Sorteia inimigo dos spawns do nó.
    const { data: spawns } = await supabase
      .from('node_spawns')
      .select('*')
      .eq('node_id', nodeId)
      .eq('is_active', true);
    if (!spawns || spawns.length === 0) {
      return res.status(404).json({ error: 'Não há presas para caçar neste local.' });
    }
    const picked = combat.pickSpawn(spawns);
    const { data: enemy } = await supabase
      .from('enemy_catalog').select('*').eq('slug', picked.enemy_slug).single();
    if (!enemy) return res.status(500).json({ error: 'Inimigo do spawn não encontrado no catálogo.' });

    // Cria a sessão.
    const { data: session, error: sErr } = await supabase
      .from('combat_sessions')
      .insert({ node_id: nodeId, initiator_id: characterId, status: 'active', round_number: 1 })
      .select().single();
    if (sErr) throw new Error('criar sessão: ' + sErr.message);

    // Monta participantes.
    const derived = Array.isArray(character.character_derived)
      ? character.character_derived[0] : character.character_derived;
    const skills = character.character_skills || [];

    const count = combat.rng(picked.min_count, picked.max_count);
    const playerP = combat.buildPlayerParticipant(character, derived, skills, 0);
    const enemyPs = [];
    for (let i = 0; i < count; i++) {
      enemyPs.push(combat.buildEnemyParticipant(enemy, i + 1, count > 1 ? String(i + 1) : ''));
    }

    const toInsert = [playerP, ...enemyPs].map((p) => ({ ...p, session_id: session.id }));
    const { data: inserted, error: pErr } = await supabase
      .from('combat_participants').insert(toInsert).select();
    if (pErr) throw new Error('criar participantes: ' + pErr.message);

    // Iniciativa.
    session.turn_order = combat.rollInitiative(inserted);
    session.active_index = 0;
    session.pending = {};
    await saveSession(session);
    await saveAllParticipants(inserted);

    // Se o primeiro a agir for inimigo, processa até a vez do jogador/reação.
    const step = await runEnemyTurns(session, inserted);
    if (step.ended) session.ended_at = new Date().toISOString();
    await finalizeIfEnded(session, inserted);
    await saveAllParticipants(inserted);
    await saveSession(session);

    res.json(statePayload(session, inserted));
  } catch (err) {
    console.error('[combat/hunt] EXCEPTION:', err && err.message);
    res.status(500).json({ error: 'Erro ao iniciar a caçada.' });
  }
});

// ─── GET /combat/:sessionId ──────────────────────────────────────────────────
router.get('/:sessionId', async (req, res) => {
  const { session, participants, error } = await loadSession(req.params.sessionId, req.userId);
  if (error) return res.status(404).json({ error });
  res.json(statePayload(session, participants));
});

// ─── POST /combat/:sessionId/action — ação do jogador ────────────────────────
router.post('/:sessionId/action', async (req, res) => {
  try {
    const { action, targetId, type } = req.body; // action: 'attack'|'pass'; type: 'quick'|'strong'
    const { session, participants, error } = await loadSession(req.params.sessionId, req.userId);
    if (error) return res.status(404).json({ error });
    if (session.status !== 'active') return res.status(409).json({ error: 'Combate encerrado.' });
    if (session.pending && session.pending.awaiting_reaction) {
      return res.status(409).json({ error: 'Há uma reação pendente. Use /react.' });
    }

    const actorId = session.turn_order[session.active_index];
    const actor = byId(participants, actorId);
    if (!actor || actor.side !== 'ally') {
      return res.status(409).json({ error: 'Não é a vez do jogador.' });
    }

    if (action === 'attack') {
      const target = byId(participants, targetId) ||
        participants.find((p) => p.side === 'enemy' && !p.is_defeated);
      if (!target || target.is_defeated) return res.status(400).json({ error: 'Alvo inválido.' });
      const atkType = type === 'strong' ? 'strong' : 'quick';
      const atk = combat.resolveAttack({ attacker: actor, defender: target, type: atkType });
      if (atk.damage > 0) {
        target.hp_current = Math.max(0, target.hp_current - atk.damage);
        if (target.hp_current === 0) target.is_defeated = true;
      }
      pushEvent(session, combat.narrateAttack(actor, target, atkType, atk));
      if (target.is_defeated) pushEvent(session, combat.narrateDefeat(target));
      await logTurn(session.id, session.round_number, session.active_index, actor.id, target.id,
        `attack_${atkType}`, atk);
    } else if (action === 'pass') {
      pushEvent(session, 'Você passou o turno e ficou em guarda.');
      await logTurn(session.id, session.round_number, session.active_index, actor.id, null, 'pass', {});
    } else {
      return res.status(400).json({ error: 'Ação inválida.' });
    }

    // consome a ação do jogador (ações adicionais: se tiver extra_actions, mantém a vez)
    if (actor.extra_actions > 0) {
      actor.extra_actions -= 1; // joga de novo neste turno
    } else {
      session.active_index += 1;
    }

    const endNow = combat.checkEnd(participants);
    if (endNow !== 'active') {
      session.status = endNow;
      session.ended_at = new Date().toISOString();
    } else {
      const step = await runEnemyTurns(session, participants);
      if (step.ended) session.ended_at = new Date().toISOString();
    }

    await finalizeIfEnded(session, participants);
    await saveAllParticipants(participants);
    await saveSession(session);
    res.json(statePayload(session, participants));
  } catch (err) {
    console.error('[combat/action] EXCEPTION:', err && err.message);
    res.status(500).json({ error: 'Erro ao processar ação.' });
  }
});

// ─── POST /combat/:sessionId/react — resposta ao prompt de reação ────────────
router.post('/:sessionId/react', async (req, res) => {
  try {
    const { reaction } = req.body; // 'block' | 'dodge' | 'pass'
    const { session, participants, error } = await loadSession(req.params.sessionId, req.userId);
    if (error) return res.status(404).json({ error });
    if (!session.pending || !session.pending.awaiting_reaction) {
      return res.status(409).json({ error: 'Não há reação pendente.' });
    }

    const enemy = byId(participants, session.pending.enemy_id);
    const target = byId(participants, session.pending.target_id);
    const type = session.pending.attack_type;

    const reactionInput = (reaction === 'block' || reaction === 'dodge') ? reaction : null;
    if (!reactionInput) pushEvent(session, 'Você deixou o ataque passar.');
    await resolveEnemyAttack(session, participants, enemy, target, type, reactionInput);

    session.pending = {};
    session.active_index += 1;

    const endNow = combat.checkEnd(participants);
    if (endNow !== 'active') {
      session.status = endNow;
      session.ended_at = new Date().toISOString();
    } else {
      const step = await runEnemyTurns(session, participants);
      if (step.ended) session.ended_at = new Date().toISOString();
    }

    await finalizeIfEnded(session, participants);
    await saveAllParticipants(participants);
    await saveSession(session);
    res.json(statePayload(session, participants));
  } catch (err) {
    console.error('[combat/react] EXCEPTION:', err && err.message);
    res.status(500).json({ error: 'Erro ao processar reação.' });
  }
});

// ─── POST /combat/:sessionId/flee — tentativa de fuga ────────────────────────
router.post('/:sessionId/flee', async (req, res) => {
  try {
    const { session, participants, error } = await loadSession(req.params.sessionId, req.userId);
    if (error) return res.status(404).json({ error });
    if (session.status !== 'active') return res.status(409).json({ error: 'Combate encerrado.' });

    const player = participants.find((p) => p.side === 'ally' && !p.is_defeated);
    const enemies = participants.filter((p) => p.side === 'enemy' && !p.is_defeated);
    const fastest = enemies.reduce((a, b) => (b.stats.speed > (a?.stats.speed ?? -1) ? b : a), null);

    // Chance de fuga: Velocidade do jogador vs. inimigo mais rápido.
    const pSpeed = combat.effectiveSpeed(player);
    const eSpeed = fastest ? combat.effectiveSpeed(fastest) : 0;
    const fleeChance = combat.clamp(0.5 + (pSpeed - eSpeed) * 0.03, 0.1, 0.95);

    if (combat.chance(fleeChance)) {
      session.status = 'fled';
      session.ended_at = new Date().toISOString();
      pushEvent(session, 'Você conseguiu fugir do combate.');
      await logTurn(session.id, session.round_number, session.active_index, player.id, null, 'flee',
        { success: true, fleeChance });
      await saveSession(session);
      return res.json(statePayload(session, participants));
    }

    // Falhou: ataque de oportunidade do inimigo mais rápido.
    pushEvent(session, 'Você tentou fugir, mas falhou!');
    await logTurn(session.id, session.round_number, session.active_index, player.id, null, 'flee',
      { success: false, fleeChance });
    if (fastest) {
      await resolveEnemyAttack(session, participants, fastest, player, 'quick', null);
    }
    session.active_index += 1;
    const endNow = combat.checkEnd(participants);
    if (endNow !== 'active') {
      session.status = endNow;
      session.ended_at = new Date().toISOString();
    } else {
      const step = await runEnemyTurns(session, participants);
      if (step.ended) session.ended_at = new Date().toISOString();
    }
    await finalizeIfEnded(session, participants);
    await saveAllParticipants(participants);
    await saveSession(session);
    res.json(statePayload(session, participants));
  } catch (err) {
    console.error('[combat/flee] EXCEPTION:', err && err.message);
    res.status(500).json({ error: 'Erro ao tentar fugir.' });
  }
});

module.exports = router;
