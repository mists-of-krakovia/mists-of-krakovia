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

// ─── Economia: vendedor ────────────────────────────────────────────────────────
const economy = require('../services/economy');

// Confirma que o NPC é vendedor e está no nó do personagem. Retorna { npc, character }
// ou lança um objeto { status, error }.
async function loadVendorContext(npcId, characterId, userId) {
  const { data: character } = await supabase
    .from('characters').select('id, current_node_id, currency')
    .eq('id', characterId).eq('account_id', userId).maybeSingle();
  if (!character) throw { status: 404, error: 'Personagem não encontrado.' };
  const { data: npc } = await supabase
    .from('npcs').select('id, name, node_id, is_vendor').eq('id', npcId).maybeSingle();
  if (!npc) throw { status: 404, error: 'NPC não encontrado.' };
  if (!npc.is_vendor) throw { status: 400, error: 'Este NPC não comercia.' };
  if (npc.node_id !== character.current_node_id) throw { status: 400, error: 'Este vendedor não está aqui.' };
  return { npc, character };
}

// GET /npcs/:npcId/shop — estoque à venda (com preço de compra) + saldo do jogador.
router.get('/:npcId/shop', async (req, res) => {
  try {
    const { characterId } = req.query;
    if (!characterId) return res.status(400).json({ error: 'characterId obrigatório.' });
    const { npc, character } = await loadVendorContext(req.params.npcId, characterId, req.userId);

    const { data: items } = await supabase
      .from('items').select('slug, name, item_type, description, base_value, rarity')
      .in('slug', economy.VENDOR_STOCK);
    const stock = (items || []).map((it) => ({
      slug: it.slug, name: it.name, item_type: it.item_type, description: it.description,
      rarity: it.rarity, price: economy.buyPrice(it, 1),
    }));
    res.json({ vendorName: npc.name, currency: character.currency, stock });
  } catch (e) {
    if (e.status) return res.status(e.status).json({ error: e.error });
    console.error('[npcs/shop] EXCEPTION:', e && e.message);
    res.status(500).json({ error: 'Erro ao abrir a loja.' });
  }
});

// POST /npcs/:npcId/sell { characterId, inventoryId, quantity? } — jogador vende.
router.post('/:npcId/sell', async (req, res) => {
  try {
    const { characterId, inventoryId, quantity } = req.body;
    if (!characterId || !inventoryId) return res.status(400).json({ error: 'Dados incompletos.' });
    const { character } = await loadVendorContext(req.params.npcId, characterId, req.userId);

    const { data: row } = await supabase
      .from('character_inventory')
      .select('id, quantity, is_equipped, items ( slug, name, base_value )')
      .eq('id', inventoryId).eq('character_id', characterId).maybeSingle();
    if (!row) return res.status(404).json({ error: 'Item não encontrado no inventário.' });
    if (row.is_equipped) return res.status(400).json({ error: 'Desequipe o item antes de vender.' });
    const item = row.items || {};
    if ((item.base_value || 0) <= 0) return res.status(400).json({ error: 'Este item não tem valor de venda.' });

    const qty = Math.max(1, Math.min(quantity || 1, row.quantity || 1));
    const gain = economy.sellPrice(item, qty);

    // Debita as unidades vendidas; credita currency.
    const newQty = (row.quantity || 1) - qty;
    if (newQty <= 0) await supabase.from('character_inventory').delete().eq('id', row.id);
    else await supabase.from('character_inventory').update({ quantity: newQty }).eq('id', row.id);

    const newCurrency = (character.currency || 0) + gain;
    await supabase.from('characters').update({ currency: newCurrency }).eq('id', characterId);

    res.json({ ok: true, sold: qty, gain, currency: newCurrency, itemName: item.name });
  } catch (e) {
    if (e.status) return res.status(e.status).json({ error: e.error });
    console.error('[npcs/sell] EXCEPTION:', e && e.message);
    res.status(500).json({ error: 'Erro ao vender.' });
  }
});

// POST /npcs/:npcId/buy { characterId, itemSlug, quantity? } — jogador compra.
router.post('/:npcId/buy', async (req, res) => {
  try {
    const { characterId, itemSlug, quantity } = req.body;
    if (!characterId || !itemSlug) return res.status(400).json({ error: 'Dados incompletos.' });
    if (!economy.isInStock(itemSlug)) return res.status(400).json({ error: 'Item fora de estoque.' });
    const { character } = await loadVendorContext(req.params.npcId, characterId, req.userId);

    const { data: item } = await supabase
      .from('items').select('id, slug, name, base_value, is_stackable').eq('slug', itemSlug).maybeSingle();
    if (!item) return res.status(404).json({ error: 'Item inexistente.' });

    const qty = Math.max(1, quantity || 1);
    const cost = economy.buyPrice(item, qty);
    if ((character.currency || 0) < cost) {
      return res.status(400).json({ error: `Moeda insuficiente. Custa ${cost}, você tem ${character.currency || 0}.` });
    }

    // Credita o item (empilha stackável; senão N linhas) e debita currency.
    if (item.is_stackable) {
      const { data: existing } = await supabase
        .from('character_inventory').select('id, quantity')
        .eq('character_id', characterId).eq('item_id', item.id).eq('is_equipped', false).maybeSingle();
      if (existing) {
        await supabase.from('character_inventory')
          .update({ quantity: (existing.quantity || 0) + qty }).eq('id', existing.id);
      } else {
        await supabase.from('character_inventory')
          .insert({ character_id: characterId, item_id: item.id, quantity: qty, is_equipped: false });
      }
    } else {
      const rows = Array.from({ length: qty }, () => ({
        character_id: characterId, item_id: item.id, quantity: 1, is_equipped: false }));
      await supabase.from('character_inventory').insert(rows);
    }

    const newCurrency = (character.currency || 0) - cost;
    await supabase.from('characters').update({ currency: newCurrency }).eq('id', characterId);

    res.json({ ok: true, bought: qty, cost, currency: newCurrency, itemName: item.name });
  } catch (e) {
    if (e.status) return res.status(e.status).json({ error: e.error });
    console.error('[npcs/buy] EXCEPTION:', e && e.message);
    res.status(500).json({ error: 'Erro ao comprar.' });
  }
});

module.exports = router;
