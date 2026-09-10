const express = require('express');
const router = express.Router();
const { supabase } = require('../server');

// Estado atual do relógio do mundo
// GET /world/clock
router.get('/clock', async (req, res) => {
  const { data, error } = await supabase
    .from('world_clock')
    .select('*')
    .single();

  if (error) {
    return res.status(500).json({ error: 'Erro ao buscar relógio do mundo.' });
  }

  // Calcula a fase atual baseada no tempo real
  const now = new Date();
  const cycleStart = new Date(data.cycle_start);
  const elapsed = (now - cycleStart) / 1000; // segundos desde o início do ciclo
  const cycleDuration = data.day_duration_seconds + data.night_duration_seconds;
  const positionInCycle = elapsed % cycleDuration;

  const currentPhase = positionInCycle < data.day_duration_seconds
    ? 'morning'
    : 'night';

  const secondsUntilNextPhase = currentPhase === 'morning'
    ? data.day_duration_seconds - positionInCycle
    : cycleDuration - positionInCycle;

  res.json({
    currentPhase,
    secondsUntilNextPhase: Math.floor(secondsUntilNextPhase),
    dayDurationSeconds: data.day_duration_seconds,
    nightDurationSeconds: data.night_duration_seconds
  });
});

// Detalhes de um nó específico
// GET /world/nodes/:nodeId
router.get('/nodes/:nodeId', async (req, res) => {
  const { nodeId } = req.params;

  const { data: node, error } = await supabase
    .from('world_nodes')
    .select('*')
    .eq('id', nodeId)
    .single();

  if (error || !node) {
    return res.status(404).json({ error: 'Local não encontrado.' });
  }

  // Busca as saídas visíveis deste nó
  const { data: connections } = await supabase
    .from('node_connections')
    .select(`
      id,
      travel_cost,
      is_visible,
      direction_label,
      to_node_id,
      world_nodes!node_connections_to_node_id_fkey (
        name,
        node_type,
        is_safe_zone
      )
    `)
    .eq('from_node_id', nodeId)
    .eq('is_visible', true);

  // Busca NPCs presentes
  const { data: npcs } = await supabase
    .from('npcs')
    .select('id, name, description, is_quest_giver')
    .eq('node_id', nodeId);

  // Busca eventos ativos neste nó
  const { data: events } = await supabase
    .from('world_events')
    .select('*')
    .or(`node_id.eq.${nodeId},node_id.is.null`)
    .or('expires_at.is.null,expires_at.gt.' + new Date().toISOString());

  res.json({
    node,
    connections: connections || [],
    npcs: npcs || [],
    events: events || []
  });
});

module.exports = router;