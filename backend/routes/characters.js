const express = require('express');
const router = express.Router();
const { supabase } = require('../server');
const { calculateDerived } = require('../services/character');
const { authenticateToken } = require('../services/auth');

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

  await supabase
    .from('character_attributes')
    .insert({ character_id: character.id, ...finalAttributes });

  const derived = calculateDerived(finalAttributes);
  await supabase
    .from('character_derived')
    .insert({ character_id: character.id, ...derived });

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
    .select('node_type')
    .eq('id', toNodeId)
    .single();

  if (destNode?.node_type === 'settlement') {
    await supabase
      .from('characters')
      .update({ last_settlement_id: toNodeId })
      .eq('id', characterId);
  }

  res.json({
    success:     true,
    newNodeId:   toNodeId,
    staminaLeft: newStamina,
    travelCost
  });
});

module.exports = router;