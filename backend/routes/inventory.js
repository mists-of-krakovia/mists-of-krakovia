// Rotas de inventário (fora de combate) — Spec 3, Sub-parte C.
// Ver .kiro/specs/inventario/design.md §3.3.
//
//   POST /characters/:characterId/inventory/equip    { inventoryId }
//   POST /characters/:characterId/inventory/unequip  { inventoryId }
//   POST /characters/:characterId/inventory/use       { inventoryId }
//   POST /characters/:characterId/inventory/discard    { inventoryId, quantity? }
//
// Equipamento NÃO é persistido em character_derived (camada on-the-fly). Aqui só
// mexemos em character_inventory (is_equipped/equipped_slot/quantity) e, no 'use'
// de consumível fora de combate, em character_derived (cura).

const express = require('express');
const router = express.Router();
const { supabase } = require('../server');
const { authenticateToken } = require('../services/auth');
const equipment = require('../services/equipment');

router.use(authenticateToken);

// Slots físicos de equipamento. Acessório tem dois; o item declara 'accessory'
// (genérico) e resolvemos para o primeiro accessory_N livre.
const ACCESSORY_SLOTS = ['accessory_1', 'accessory_2'];

// Confirma que o personagem pertence ao usuário. Retorna o personagem (id,
// class) + attributes + skills, ou null.
async function ownedCharacter(characterId, userId) {
  const { data } = await supabase
    .from('characters')
    .select('id, class, character_attributes (*), character_skills (*)')
    .eq('id', characterId)
    .eq('account_id', userId)
    .single();
  return data || null;
}

// Carrega uma linha de inventário do personagem (com o item embutido).
async function loadInventoryRow(inventoryId, characterId) {
  const { data } = await supabase
    .from('character_inventory')
    .select(`
      id, character_id, item_id, quantity, is_equipped, equipped_slot,
      items ( slug, name, item_type, is_equippable, equipment_slot, stats, requirements )
    `)
    .eq('id', inventoryId)
    .eq('character_id', characterId)
    .single();
  return data || null;
}

// Mapa slug -> nível de perícia do personagem.
function skillLevelsOf(character) {
  const out = {};
  for (const s of character.character_skills || []) out[s.skill_name] = s.level;
  return out;
}

function attrsOf(character) {
  return Array.isArray(character.character_attributes)
    ? character.character_attributes[0] : character.character_attributes;
}

// ─── POST equip ───────────────────────────────────────────────────────────────
router.post('/:characterId/inventory/equip', async (req, res) => {
  try {
    const { characterId } = req.params;
    const { inventoryId } = req.body;
    if (!inventoryId) return res.status(400).json({ error: 'inventoryId obrigatório.' });

    const character = await ownedCharacter(characterId, req.userId);
    if (!character) return res.status(404).json({ error: 'Personagem não encontrado.' });

    const row = await loadInventoryRow(inventoryId, characterId);
    if (!row) return res.status(404).json({ error: 'Item não encontrado no inventário.' });

    const item = row.items;
    const check = equipment.canEquip(item, attrsOf(character), skillLevelsOf(character));
    if (!check.ok) return res.status(400).json({ error: check.reason });

    if (row.is_equipped) return res.status(400).json({ error: 'Item já está equipado.' });

    // Resolve o slot de destino.
    let targetSlot = item.equipment_slot;
    if (item.equipment_slot === 'accessory') {
      // Descobre quais slots de acessório estão ocupados.
      const { data: equipped } = await supabase
        .from('character_inventory')
        .select('equipped_slot')
        .eq('character_id', characterId)
        .eq('is_equipped', true)
        .in('equipped_slot', ACCESSORY_SLOTS);
      const used = new Set((equipped || []).map((e) => e.equipped_slot));
      targetSlot = ACCESSORY_SLOTS.find((s) => !used.has(s)) || ACCESSORY_SLOTS[0];
    }

    // Se já há item nesse slot, desequipa o anterior (volta pra mochila).
    const { data: current } = await supabase
      .from('character_inventory')
      .select('id')
      .eq('character_id', characterId)
      .eq('is_equipped', true)
      .eq('equipped_slot', targetSlot);
    for (const c of current || []) {
      await supabase.from('character_inventory')
        .update({ is_equipped: false, equipped_slot: null })
        .eq('id', c.id);
    }

    // Equipa o novo.
    await supabase.from('character_inventory')
      .update({ is_equipped: true, equipped_slot: targetSlot })
      .eq('id', row.id);

    res.json({ ok: true, equippedSlot: targetSlot });
  } catch (err) {
    console.error('[inventory/equip] EXCEPTION:', err && err.message);
    res.status(500).json({ error: 'Erro ao equipar o item.' });
  }
});

// ─── POST unequip ───────────────────────────────────────────────────────────
router.post('/:characterId/inventory/unequip', async (req, res) => {
  try {
    const { characterId } = req.params;
    const { inventoryId } = req.body;
    if (!inventoryId) return res.status(400).json({ error: 'inventoryId obrigatório.' });

    const character = await ownedCharacter(characterId, req.userId);
    if (!character) return res.status(404).json({ error: 'Personagem não encontrado.' });

    const row = await loadInventoryRow(inventoryId, characterId);
    if (!row) return res.status(404).json({ error: 'Item não encontrado no inventário.' });
    if (!row.is_equipped) return res.status(400).json({ error: 'Item não está equipado.' });

    await supabase.from('character_inventory')
      .update({ is_equipped: false, equipped_slot: null })
      .eq('id', row.id);

    res.json({ ok: true });
  } catch (err) {
    console.error('[inventory/unequip] EXCEPTION:', err && err.message);
    res.status(500).json({ error: 'Erro ao desequipar o item.' });
  }
});

// ─── POST use (consumível fora de combate) ────────────────────────────────────
router.post('/:characterId/inventory/use', async (req, res) => {
  try {
    const { characterId } = req.params;
    const { inventoryId } = req.body;
    if (!inventoryId) return res.status(400).json({ error: 'inventoryId obrigatório.' });

    const character = await ownedCharacter(characterId, req.userId);
    if (!character) return res.status(404).json({ error: 'Personagem não encontrado.' });

    const row = await loadInventoryRow(inventoryId, characterId);
    if (!row) return res.status(404).json({ error: 'Item não encontrado no inventário.' });

    const item = row.items;
    if (item.item_type !== 'consumable') {
      return res.status(400).json({ error: 'Este item não é consumível.' });
    }

    const effect = item.stats || {};
    const applied = {};

    // Cura fora de combate (ex.: Poção de Cura). Respeita o teto atual (base+nível;
    // a camada de equipamento afeta hp_max no combate/exibição, mas o hp_current
    // persistido é limitado pelo hp_max de character_derived).
    if (effect.heal) {
      const { data: derived } = await supabase
        .from('character_derived')
        .select('hp_current, hp_max')
        .eq('character_id', characterId)
        .single();
      if (derived) {
        const newHp = Math.min(derived.hp_max, (derived.hp_current || 0) + effect.heal);
        await supabase.from('character_derived')
          .update({ hp_current: newHp }).eq('character_id', characterId);
        applied.heal = newHp - (derived.hp_current || 0);
        applied.hp_current = newHp;
      }
    } else {
      // Consumíveis sem efeito fora de combate (frasco de veneno, granadas) só
      // fazem sentido em combate (Sub-parte E).
      return res.status(400).json({ error: 'Este item só tem efeito em combate.' });
    }

    // Decrementa a quantidade; remove a linha se zerar.
    const newQty = (row.quantity || 1) - 1;
    if (newQty <= 0) {
      await supabase.from('character_inventory').delete().eq('id', row.id);
    } else {
      await supabase.from('character_inventory').update({ quantity: newQty }).eq('id', row.id);
    }

    res.json({ ok: true, applied, remaining: Math.max(0, newQty) });
  } catch (err) {
    console.error('[inventory/use] EXCEPTION:', err && err.message);
    res.status(500).json({ error: 'Erro ao usar o item.' });
  }
});

// ─── POST discard ─────────────────────────────────────────────────────────────
router.post('/:characterId/inventory/discard', async (req, res) => {
  try {
    const { characterId } = req.params;
    const { inventoryId, quantity } = req.body;
    if (!inventoryId) return res.status(400).json({ error: 'inventoryId obrigatório.' });

    const character = await ownedCharacter(characterId, req.userId);
    if (!character) return res.status(404).json({ error: 'Personagem não encontrado.' });

    const row = await loadInventoryRow(inventoryId, characterId);
    if (!row) return res.status(404).json({ error: 'Item não encontrado no inventário.' });

    // Descartar quantidade parcial (para stackáveis) ou tudo (default).
    const dropQty = quantity && quantity > 0 ? Math.min(quantity, row.quantity || 1) : (row.quantity || 1);
    const newQty = (row.quantity || 1) - dropQty;

    if (newQty <= 0) {
      await supabase.from('character_inventory').delete().eq('id', row.id);
    } else {
      await supabase.from('character_inventory').update({ quantity: newQty }).eq('id', row.id);
    }

    res.json({ ok: true, discarded: dropQty, remaining: Math.max(0, newQty) });
  } catch (err) {
    console.error('[inventory/discard] EXCEPTION:', err && err.message);
    res.status(500).json({ error: 'Erro ao descartar o item.' });
  }
});

module.exports = router;
