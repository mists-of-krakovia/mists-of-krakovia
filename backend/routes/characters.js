const express = require('express');
const router = express.Router();
const { supabase } = require('../server');
const { calculateDerived, applyLevelBonus } = require('../services/character');
const { authenticateToken } = require('../services/auth');
const {
  INITIAL_SKILLS_BY_CLASS,
  INITIAL_SKILL_LEVEL,
  INITIAL_COMBAT_POINTS,
  MAX_SKILL_LEVEL,
  initialFieldPoints,
  validateAllocation,
} = require('../services/skills');

router.use(authenticateToken);

// GET /characters
router.get('/', async (req, res) => {
  const { data, error } = await supabase
    .from('characters')
    .select(`
      id, name, class, level, xp, avatar,
      current_node_id, created_at,
      character_attributes (
        strength, agility, resistance,
        intellect, perception, sanity, points_available
      ),
      character_derived (
        hp_current, hp_max, stamina_current, stamina_max
      )
    `)
    .eq('account_id', req.userId)
    .order('created_at', { ascending: true });

  if (error) {
    return res.status(500).json({ error: 'Erro ao buscar personagens.' });
  }

  res.json(data);
});

// POST /characters
router.post('/', async (req, res) => {
 try {
  const { name, characterClass, attributes } = req.body;

  const { count } = await supabase
    .from('characters')
    .select('id', { count: 'exact' })
    .eq('account_id', req.userId);

  if (count >= 5) {
    return res.status(400).json({ error: 'Limite de 5 personagens por conta atingido.' });
  }

  if (!name || name.length < 2 || name.length > 20) {
    return res.status(400).json({ error: 'Nome deve ter entre 2 e 20 caracteres.' });
  }

  const validClasses = [
    'vagante_nevoas', 'arauto_conclave',
    'exilado_ferro', 'confessor_veu', 'cronista_ruinas'
  ];
  if (!validClasses.includes(characterClass)) {
    return res.status(400).json({ error: 'Classe inválida.' });
  }

  // Sanidade é o 6º atributo base (Volume III). Distribuição: 5 pontos entre
  // os 6 atributos, cada um começando no grau E (valor 5). Nenhum pode passar
  // de D+ (valor 9) na criação -> no máximo +4 pontos num único atributo.
  const attrKeys = ['strength', 'agility', 'resistance', 'intellect', 'perception', 'sanity'];
  const spent = {};
  let totalSpent = 0;
  for (const key of attrKeys) {
    const v = attributes?.[key] || 0;
    if (!Number.isInteger(v) || v < 0) {
      return res.status(400).json({ error: `Valor inválido para o atributo ${key}.` });
    }
    if (v > 4) {
      return res.status(400).json({ error: 'Nenhum atributo pode começar acima de D+ (máximo +4 na criação).' });
    }
    spent[key] = v;
    totalSpent += v;
  }

  if (totalSpent > 5) {
    return res.status(400).json({ error: 'Pontos de atributo excedidos. Máximo: 5.' });
  }

  const finalAttributes = {
    strength:         5 + spent.strength,
    agility:          5 + spent.agility,
    resistance:       5 + spent.resistance,
    intellect:        5 + spent.intellect,
    perception:       5 + spent.perception,
    sanity:           5 + spent.sanity,
    points_available: 5 - totalSpent
  };

  // Nó inicial: Ironfall — Distrito Central. Buscado por description_key
  // (identificador estável), com fallback para o primeiro settlement seguro
  // da região. Evita depender de um UUID fixo hardcoded.
  let startNode = null;
  {
    const { data: byKey } = await supabase
      .from('world_nodes')
      .select('id')
      .eq('description_key', 'ironfall_central')
      .maybeSingle();
    startNode = byKey;

    if (!startNode) {
      const { data: fallback } = await supabase
        .from('world_nodes')
        .select('id')
        .eq('node_type', 'settlement')
        .eq('is_safe_zone', true)
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();
      startNode = fallback;
    }
  }

  if (!startNode) {
    return res.status(500).json({ error: 'Nó inicial do mundo não encontrado. O mundo pode não ter sido populado.' });
  }

  const startNodeId = startNode.id;

  const { data: character, error: charError } = await supabase
    .from('characters')
    .insert({
      account_id:         req.userId,
      name,
      class:              characterClass,
      level:              1,
      xp:                 0,
      xp_to_next:         100,
      current_node_id:    startNodeId,
      last_settlement_id: startNodeId,
      is_active:          false
    })
    .select()
    .single();

  if (charError) {
    console.error('[create] erro ao inserir personagem:', charError.message);
    return res.status(500).json({ error: 'Erro ao criar personagem.' });
  }

  // ── Perícias ────────────────────────────────────────────────────────
  // Criação simplificada: sem etapa de distribuição. O personagem começa apenas
  // com as 3 perícias de combate da classe (nível 2). Recebe os pontos de CAMPO
  // referentes ao Intelecto (1 + MG_INT) já disponíveis para gastar depois na
  // página de Perícias. Pontos de combate iniciais = 0 (só vêm ao subir de nível).
  const classInitial = INITIAL_SKILLS_BY_CLASS[characterClass] || [];
  const levels = {}; // slug -> nível
  const typeOf = {}; // slug -> 'combat' (as iniciais são todas de combate)
  for (const slug of classInitial) {
    levels[slug] = INITIAL_SKILL_LEVEL;
    typeOf[slug] = 'combat';
  }

  await supabase
    .from('character_attributes')
    .insert({
      character_id: character.id,
      ...finalAttributes,
      field_skill_points:  initialFieldPoints(finalAttributes.intellect),
      combat_skill_points: 0,
    });

  const derived = calculateDerived(finalAttributes);
  await supabase
    .from('character_derived')
    .insert({ character_id: character.id, ...derived });

  // Insere as perícias resultantes (iniciais + investidas).
  const skillRows = Object.keys(levels).map(slug => ({
    character_id: character.id,
    skill_name:   slug,
    skill_type:   typeOf[slug],
    level:        levels[slug],
    xp:           0,
  }));
  if (skillRows.length > 0) {
    await supabase.from('character_skills').insert(skillRows);
  }

  await supabase
    .from('character_discovered_nodes')
    .insert({
      character_id: character.id,
      node_id:      startNodeId,
      discovered_at: new Date().toISOString()
    });

  res.status(201).json({
    message: 'Personagem criado com sucesso.',
    character
  });
 } catch (err) {
   console.error('[create] EXCEPTION:', err && err.message, err && err.stack);
   res.status(500).json({ error: 'Erro ao criar personagem.' });
 }
});

// POST /characters/:characterId/enter
router.post('/:characterId/enter', async (req, res) => {
  const { characterId } = req.params;

  const { data: character, error } = await supabase
    .from('characters')
    .select(`
      *,
      character_attributes (*),
      character_derived (*),
      character_skills (*)
    `)
    .eq('id', characterId)
    .eq('account_id', req.userId)
    .single();

  if (error || !character) {
    return res.status(404).json({ error: 'Personagem não encontrado.' });
  }

  const isFirstLogin = character.first_login;

  if (isFirstLogin) {
    await supabase
      .from('characters')
      .update({ first_login: false })
      .eq('id', characterId);
  }

  const nodeId = character.current_node_id;

  const { data: node } = await supabase
    .from('world_nodes')
    .select('*')
    .eq('id', nodeId)
    .single();

  const { data: allConnections } = await supabase
    .from('node_connections')
    .select(`
      id, travel_cost, is_visible, direction_label, to_node_id,
      world_nodes!node_connections_to_node_id_fkey (
        name, node_type, is_safe_zone
      )
    `)
    .eq('from_node_id', nodeId);

  const { data: discoveredNodes } = await supabase
    .from('character_discovered_nodes')
    .select('node_id')
    .eq('character_id', characterId);

  const discoveredIds = new Set(discoveredNodes?.map(d => d.node_id) || []);

  const connections = (allConnections || []).filter(c =>
    c.is_visible || discoveredIds.has(c.to_node_id)
  );

  const { data: npcs } = await supabase
    .from('npcs')
    .select('id, name, description, is_quest_giver')
    .eq('node_id', nodeId);

  const { data: quests } = await supabase
    .from('character_quests')
    .select(`
      status, current_step, notes,
      quests (slug, title, description)
    `)
    .eq('character_id', characterId)
    .eq('status', 'active');

  const { data: clock } = await supabase
    .from('world_clock')
    .select('*')
    .single();

  await supabase
    .from('character_sessions')
    .upsert({
      character_id: characterId,
      node_id:      nodeId,
      last_active:  new Date().toISOString(),
      is_online:    true
    }, { onConflict: 'character_id' });

  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();

  const { data: sessions } = await supabase
    .from('character_sessions')
    .select('character_id, last_active')
    .eq('node_id', nodeId)
    .eq('is_online', true)
    .gte('last_active', fiveMinutesAgo)
    .neq('character_id', characterId);

  let onlinePlayers = [];
  if (sessions && sessions.length > 0) {
    const ids = sessions.map(s => s.character_id);
    const { data: onlineChars } = await supabase
      .from('characters')
      .select('id, name, level, class')
      .in('id', ids);

    onlinePlayers = (onlineChars || []).map(char => ({
      character_id: char.id,
      name:         char.name,
      level:        char.level,
      class:        char.class
    }));
  }

  const { data: inventory } = await supabase
    .from('character_inventory')
    .select(`
      id, quantity, durability, is_equipped, equipped_slot, acquired_at,
      items (
        name, item_type, description, weight, rarity, equipment_slot
      )
    `)
    .eq('character_id', characterId);

  // Calcula fase do relógio corretamente
  let currentPhase = 'morning';
  let secondsUntilNextPhase = 900;

  if (clock) {
    const now        = new Date();
    const cycleStart = new Date(clock.cycle_start);
    const elapsed    = (now - cycleStart) / 1000;
    const total      = clock.day_duration_seconds + clock.night_duration_seconds;
    const position   = elapsed % total;

    currentPhase = position < clock.day_duration_seconds ? 'morning' : 'night';
    secondsUntilNextPhase = currentPhase === 'morning'
      ? clock.day_duration_seconds - position
      : total - position;
  }

  res.json({
    character,
    isFirstLogin,
    node,
    connections,
    npcs:          npcs || [],
    activeQuests:  quests || [],
    clock: {
      ...clock,
      currentPhase,
      secondsUntilNextPhase: Math.floor(secondsUntilNextPhase)
    },
    inventory:     inventory || [],
    onlinePlayers
  });
});

// PUT /characters/:characterId/heartbeat
router.put('/:characterId/heartbeat', async (req, res) => {
  const { characterId } = req.params;

  const { data: character } = await supabase
    .from('characters')
    .select('id')
    .eq('id', characterId)
    .eq('account_id', req.userId)
    .single();

  if (!character) {
    return res.status(404).json({ error: 'Personagem não encontrado.' });
  }

  await supabase
    .from('character_sessions')
    .update({ last_active: new Date().toISOString() })
    .eq('character_id', characterId);

  res.json({ ok: true });
});

// PUT /characters/:characterId/offline
router.put('/:characterId/offline', async (req, res) => {
  const { characterId } = req.params;

  // Valida que o personagem pertence à conta autenticada antes de alterar a sessão.
  const { data: character } = await supabase
    .from('characters')
    .select('id')
    .eq('id', characterId)
    .eq('account_id', req.userId)
    .single();

  if (!character) {
    return res.status(404).json({ error: 'Personagem não encontrado.' });
  }

  await supabase
    .from('character_sessions')
    .update({ is_online: false })
    .eq('character_id', characterId);

  res.json({ ok: true });
});

// POST /characters/:characterId/skills/allocate
// Distribui pontos de perícia disponíveis (campo/combate). Body:
// { field: { <slug>: deltaPts }, combat: { <slug>: deltaPts } }
router.post('/:characterId/skills/allocate', async (req, res) => {
 try {
  const { characterId } = req.params;
  const alloc = req.body || { field: {}, combat: {} };

  // Propriedade + atributos (para requisito e pontos disponíveis)
  const { data: character } = await supabase
    .from('characters')
    .select('id, character_attributes (*), character_skills (*)')
    .eq('id', characterId)
    .eq('account_id', req.userId)
    .single();

  if (!character) {
    return res.status(404).json({ error: 'Personagem não encontrado.' });
  }

  const attrs = character.character_attributes || {};
  const available = {
    field:  attrs.field_skill_points  ?? 0,
    combat: attrs.combat_skill_points ?? 0,
  };

  const currentLevels = {};
  for (const s of character.character_skills || []) {
    currentLevels[s.skill_name] = s.level;
  }

  const { data: catalog } = await supabase
    .from('skills_catalog')
    .select('slug, name, skill_type, base_attr, base_attr_alt, requires_training, attr_mg_req');

  const validation = validateAllocation({
    catalog: catalog || [],
    attributes: attrs,
    currentLevels,
    alloc,
    available,
  });

  if (!validation.ok) {
    return res.status(400).json({ error: validation.error });
  }

  if (validation.applied.length === 0) {
    return res.status(400).json({ error: 'Nenhum ponto distribuído.' });
  }

  // Aplica cada perícia (upsert por character_id + skill_name).
  const catalogBySlug = {};
  for (const row of catalog || []) catalogBySlug[row.slug] = row;

  for (const a of validation.applied) {
    await supabase
      .from('character_skills')
      .upsert({
        character_id: characterId,
        skill_name:   a.slug,
        skill_type:   catalogBySlug[a.slug].skill_type,
        level:        a.newLevel,
      }, { onConflict: 'character_id,skill_name' });
  }

  // Debita os pontos gastos.
  await supabase
    .from('character_attributes')
    .update({
      field_skill_points:  available.field  - validation.spent.field,
      combat_skill_points: available.combat - validation.spent.combat,
    })
    .eq('character_id', characterId);

  res.json({
    ok: true,
    remaining: {
      field:  available.field  - validation.spent.field,
      combat: available.combat - validation.spent.combat,
    },
    applied: validation.applied,
  });
 } catch (err) {
   console.error('[allocate] EXCEPTION:', err && err.message);
   res.status(500).json({ error: 'Erro ao distribuir perícias.' });
 }
});

// POST /characters/:characterId/attributes/allocate
// Distribui pontos de atributo disponíveis (points_available). Body:
// { strength?, agility?, resistance?, intellect?, perception?, sanity? } (deltas >= 0).
// Recalcula os derivados = fórmula(novos atributos) + level_bonus (preserva o
// bônus de progressão). Não cura HP/estamina aqui (só o level-up cura).
const ATTR_KEYS = ['strength', 'agility', 'resistance', 'intellect', 'perception', 'sanity'];
router.post('/:characterId/attributes/allocate', async (req, res) => {
  try {
    const { characterId } = req.params;
    const deltas = req.body || {};

    const { data: character } = await supabase
      .from('characters')
      .select('id, character_attributes (*), character_derived (*)')
      .eq('id', characterId)
      .eq('account_id', req.userId)
      .single();
    if (!character) return res.status(404).json({ error: 'Personagem não encontrado.' });

    const attrs = Array.isArray(character.character_attributes)
      ? character.character_attributes[0] : character.character_attributes;
    const derived = Array.isArray(character.character_derived)
      ? character.character_derived[0] : character.character_derived;

    // Valida deltas: inteiros >= 0, soma <= points_available, resultado <= 21.
    let totalSpent = 0;
    const newAttrs = { ...attrs };
    for (const key of ATTR_KEYS) {
      const d = Math.floor(Number(deltas[key] || 0));
      if (!Number.isFinite(d) || d < 0) {
        return res.status(400).json({ error: `Delta inválido para ${key}.` });
      }
      if (d > 0) {
        const next = (attrs[key] || 0) + d;
        if (next > 21) return res.status(400).json({ error: `${key} excederia o máximo (21).` });
        newAttrs[key] = next;
        totalSpent += d;
      }
    }

    const available = attrs.points_available || 0;
    if (totalSpent === 0) return res.status(400).json({ error: 'Nenhum ponto distribuído.' });
    if (totalSpent > available) {
      return res.status(400).json({ error: 'Pontos insuficientes.' });
    }

    // Recalcula derivados = fórmula(novos atributos) + level_bonus (preservado).
    const base = calculateDerived(newAttrs);
    const withBonus = applyLevelBonus(base, derived?.level_bonus || {});

    // Preserva HP/estamina atuais (não cura), mas respeita o novo teto.
    const hpCurrent = Math.min(derived?.hp_current ?? withBonus.hp_max, withBonus.hp_max);
    const stCurrent = Math.min(derived?.stamina_current ?? withBonus.stamina_max, withBonus.stamina_max);

    // Grava atributos base + pontos restantes.
    await supabase.from('character_attributes').update({
      strength: newAttrs.strength, agility: newAttrs.agility, resistance: newAttrs.resistance,
      intellect: newAttrs.intellect, perception: newAttrs.perception, sanity: newAttrs.sanity,
      points_available: available - totalSpent,
    }).eq('character_id', characterId);

    // Grava derivados recalculados.
    await supabase.from('character_derived').update({
      hp_max: withBonus.hp_max, hp_current: hpCurrent,
      stamina_max: withBonus.stamina_max, stamina_current: stCurrent,
      accuracy: withBonus.accuracy, attack_melee: withBonus.attack_melee,
      attack_ranged: withBonus.attack_ranged, defense: withBonus.defense,
      evasion: withBonus.evasion, speed: withBonus.speed,
      crit_chance: withBonus.crit_chance, crit_damage: withBonus.crit_damage,
      mental_resistance: withBonus.mental_resistance, mist_resistance: withBonus.mist_resistance,
      observation: withBonus.observation, carry_capacity: withBonus.carry_capacity,
    }).eq('character_id', characterId);

    res.json({ ok: true, remaining: available - totalSpent });
  } catch (err) {
    console.error('[attr-allocate] EXCEPTION:', err && err.message);
    res.status(500).json({ error: 'Erro ao distribuir atributos.' });
  }
});

// POST /characters/:characterId/save-point
// Salva o nó atual como ponto de respawn. Só funciona em nós 'settlement'.
// Guarda histórico dos últimos 10 pontos (mais recente primeiro), sem duplicar
// o mesmo nó em sequência.
const MAX_RESPAWN_POINTS = 10;
router.post('/:characterId/save-point', async (req, res) => {
  try {
    const { characterId } = req.params;

    const { data: character } = await supabase
      .from('characters')
      .select('id, current_node_id, respawn_points')
      .eq('id', characterId)
      .eq('account_id', req.userId)
      .single();
    if (!character) return res.status(404).json({ error: 'Personagem não encontrado.' });

    const nodeId = character.current_node_id;
    if (!nodeId) return res.status(400).json({ error: 'Personagem não está em um nó.' });

    // Só é possível salvar em assentamentos.
    const { data: node } = await supabase
      .from('world_nodes')
      .select('id, name, node_type')
      .eq('id', nodeId)
      .single();
    if (!node || node.node_type !== 'settlement') {
      return res.status(400).json({ error: 'Só é possível salvar o progresso em um assentamento.' });
    }

    // Monta o novo histórico: remove ocorrência anterior deste nó, coloca no topo,
    // limita a MAX_RESPAWN_POINTS.
    const prev = Array.isArray(character.respawn_points) ? character.respawn_points : [];
    const withoutDup = prev.filter((p) => p.node_id !== nodeId);
    const updated = [{ node_id: nodeId, saved_at: new Date().toISOString() }, ...withoutDup]
      .slice(0, MAX_RESPAWN_POINTS);

    await supabase.from('characters').update({ respawn_points: updated }).eq('id', characterId);

    res.json({ ok: true, savedNode: node.name, respawnPoints: updated });
  } catch (err) {
    console.error('[save-point] EXCEPTION:', err && err.message);
    res.status(500).json({ error: 'Erro ao salvar o ponto de respawn.' });
  }
});

// POST /characters/:characterId/move
// Bug 2 corrigido — busca stamina separadamente para evitar
// problema de estrutura objeto vs array na relação do Supabase
router.post('/:characterId/move', async (req, res) => {
  const { characterId } = req.params;
  const { toNodeId }    = req.body;

  if (!toNodeId) {
    return res.status(400).json({ error: 'Destino não informado.' });
  }

  // Busca personagem sem tentar fazer join de derivados
  const { data: character, error } = await supabase
    .from('characters')
    .select('id, current_node_id')
    .eq('id', characterId)
    .eq('account_id', req.userId)
    .single();

  if (error || !character) {
    return res.status(404).json({ error: 'Personagem não encontrado.' });
  }

  // Busca estamina em query separada — evita ambiguidade de objeto vs array
  const { data: derivedData, error: derivedError } = await supabase
    .from('character_derived')
    .select('stamina_current, stamina_max')
    .eq('character_id', characterId)
    .single();

  if (derivedError || !derivedData) {
    return res.status(500).json({ error: 'Erro ao buscar estamina do personagem.' });
  }

  // Verifica se a conexão existe saindo do nó atual
  const { data: connection, error: connError } = await supabase
    .from('node_connections')
    .select('id, travel_cost, is_visible')
    .eq('from_node_id', character.current_node_id)
    .eq('to_node_id', toNodeId)
    .single();

  if (connError || !connection) {
    return res.status(400).json({ error: 'Caminho inválido.' });
  }

  // Se não é visível, verifica se o personagem já descobriu
  if (!connection.is_visible) {
    const { data: discovered } = await supabase
      .from('character_discovered_nodes')
      .select('node_id')
      .eq('character_id', characterId)
      .eq('node_id', toNodeId)
      .single();

    if (!discovered) {
      return res.status(403).json({ error: 'Você não conhece este caminho.' });
    }
  }

  const staminaCurrent = derivedData.stamina_current ?? 0;
  const travelCost     = connection.travel_cost;

  // Custo 0 passa sempre (zonas seguras)
  if (travelCost > 0 && staminaCurrent < travelCost) {
    return res.status(400).json({
      error: `Estamina insuficiente. Necessário: ${travelCost}, disponível: ${staminaCurrent}.`
    });
  }

  const newStamina = Math.max(0, staminaCurrent - travelCost);

  await Promise.all([
    supabase
      .from('character_derived')
      .update({ stamina_current: newStamina })
      .eq('character_id', characterId),
    supabase
      .from('characters')
      .update({ current_node_id: toNodeId })
      .eq('id', characterId)
  ]);

  // Registra descoberta se for a primeira vez
  const { data: alreadyDiscovered } = await supabase
    .from('character_discovered_nodes')
    .select('node_id')
    .eq('character_id', characterId)
    .eq('node_id', toNodeId)
    .single();

  if (!alreadyDiscovered) {
    await supabase
      .from('character_discovered_nodes')
      .insert({
        character_id:  characterId,
        node_id:       toNodeId,
        discovered_at: new Date().toISOString()
      });
  }

  await supabase
    .from('character_sessions')
    .update({ node_id: toNodeId, last_active: new Date().toISOString() })
    .eq('character_id', characterId);

  const { data: destNode } = await supabase
    .from('world_nodes')
    .select('node_type, encounter_rate')
    .eq('id', toNodeId)
    .single();

  if (destNode?.node_type === 'settlement') {
    await supabase
      .from('characters')
      .update({ last_settlement_id: toNodeId })
      .eq('id', characterId);
  }

  // Encontro ao mover (Sub-parte E) — atrás de flag, desligado por padrão.
  // Se ligado e o destino tem taxa > 0 e spawns ativos, rola o encontro. Em vez
  // de criar a sessão aqui (a lógica vive em /combat/hunt), sinalizamos no retorno
  // e o cliente inicia o combate pelo mesmo fluxo da caçada.
  let encounter = false;
  const encountersOn = String(process.env.ENCOUNTERS_ON_MOVE || '').toLowerCase() === 'true';
  if (encountersOn && destNode && Number(destNode.encounter_rate) > 0) {
    const { count } = await supabase
      .from('node_spawns')
      .select('id', { count: 'exact', head: true })
      .eq('node_id', toNodeId)
      .eq('is_active', true);
    if (count && count > 0 && Math.random() < Number(destNode.encounter_rate)) {
      encounter = true;
    }
  }

  res.json({
    success:     true,
    newNodeId:   toNodeId,
    staminaLeft: newStamina,
    travelCost,
    encounter
  });
});

module.exports = router;