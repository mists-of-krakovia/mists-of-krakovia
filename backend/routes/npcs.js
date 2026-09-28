// Rotas de NPC / diálogo — Spec 4 (Diálogos). Ver design.md §3.
//
//   GET  /npcs/:npcId               -> dados públicos do NPC
//   POST /npcs/:npcId/talk          -> conversa (motor de palavras-chave)
//        body: { characterId, text, locale? }
//        resp: { intent, reply, npcName }

const express = require('express');
const router = express.Router();
const { supabase } = require('../server');
const { authenticateToken } = require('../services/auth');
const dialogue = require('../services/dialogue');

router.use(authenticateToken);

// GET /npcs/:npcId — dados públicos.
router.get('/:npcId', async (req, res) => {
  const { data: npc } = await supabase
    .from('npcs').select('id, name, description, node_id, is_quest_giver')
    .eq('id', req.params.npcId).maybeSingle();
  if (!npc) return res.status(404).json({ error: 'NPC não encontrado.' });
  res.json(npc);
});

// POST /npcs/:npcId/talk — o jogador digita; o NPC responde.
router.post('/:npcId/talk', async (req, res) => {
  try {
    const { npcId } = req.params;
    const { characterId, text, locale } = req.body;
    if (!characterId) return res.status(400).json({ error: 'characterId obrigatório.' });
    if (typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({ error: 'Diga algo ao NPC.' });
    }
    if (text.length > 300) return res.status(400).json({ error: 'Mensagem longa demais.' });

    // Propriedade do personagem.
    const { data: character } = await supabase
      .from('characters').select('id, current_node_id').eq('id', characterId)
      .eq('account_id', req.userId).maybeSingle();
    if (!character) return res.status(404).json({ error: 'Personagem não encontrado.' });

    // NPC existe? (opcional: exigir que esteja no mesmo nó do personagem)
    const { data: npc } = await supabase
      .from('npcs').select('id, name, node_id').eq('id', npcId).maybeSingle();
    if (!npc) return res.status(404).json({ error: 'NPC não encontrado.' });
    if (npc.node_id !== character.current_node_id) {
      return res.status(400).json({ error: 'Este NPC não está aqui.' });
    }

    // Estado de confiança: cria sob demanda (trust inicial = default da tabela, 100).
    let trust = 100;
    const { data: state } = await supabase
      .from('character_npc_state').select('trust')
      .eq('character_id', characterId).eq('npc_id', npcId).maybeSingle();
    if (state) {
      trust = state.trust;
    } else {
      await supabase.from('character_npc_state')
        .insert({ character_id: characterId, npc_id: npcId });
    }

    // Detecta intenção e escolhe resposta.
    const loc = (locale === 'en' ? 'en' : 'pt');
    const intent = dialogue.detectIntent(text, loc);
    const { data: rows } = await supabase
      .from('npc_dialogue').select('intent, variants, min_confidence')
      .eq('npc_id', npcId).eq('locale', loc);
    const reply = dialogue.pickReply(rows || [], intent, trust);

    res.json({ intent, reply, npcName: npc.name });
  } catch (err) {
    console.error('[npcs/talk] EXCEPTION:', err && err.message);
    res.status(500).json({ error: 'Erro ao conversar com o NPC.' });
  }
});

module.exports = router;
