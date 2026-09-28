// Loot de combate — Spec 2 (loop de recompensa preparado).
// A concessão real de itens (inserir em character_inventory) depende do sistema de
// itens/equipamento, que está FORA do escopo desta entrega. Aqui montamos o loop:
// rolar a loot_table dos inimigos derrotados e retornar os drops. Como loot_table
// está vazia por ora, o resultado é [] — mas o gancho está pronto para ligar.
//
// Formato esperado de enemy_catalog.loot_table (jsonb), quando preenchido:
//   [{ "item_slug": "faca_enferrujada", "chance": 0.25, "min": 1, "max": 1 }, ...]

function rng(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Rola o loot dos inimigos derrotados.
//   enemyRows: linhas de enemy_catalog envolvidas (com loot_table).
//   defeatedSlugs: slugs dos inimigos derrotados.
// Retorna [{ item_slug, quantity }] — vazio enquanto loot_table não for populada.
function rollLoot(enemyRows, defeatedSlugs) {
  const drops = [];
  for (const slug of defeatedSlugs) {
    const enemy = enemyRows.find((e) => e.slug === slug);
    const table = (enemy && enemy.loot_table) || [];
    for (const entry of table) {
      const chance = entry.chance ?? 0;
      if (Math.random() < chance) {
        const qty = rng(entry.min ?? 1, entry.max ?? 1);
        if (qty > 0) drops.push({ item_slug: entry.item_slug, quantity: qty });
      }
    }
  }
  return drops;
}

// Concede o loot ao personagem — Spec 3 (Inventário), Sub-parte B.
// Resolve item_slug -> item (id, name, rarity, is_stackable) e grava em
// character_inventory: stackáveis empilham (lê linha existente na mochila e soma
// quantity; senão insere); equipáveis criam 1 linha por unidade. Empilhamento é
// controlado aqui (não há índice único — ver design §1.2).
//   supabase: cliente service_role.  characterId: dono do loot.
//   drops: [{ item_slug, quantity }] vindo de rollLoot.
// Retorna [{ item_slug, quantity, name, rarity }] para o payload de recompensa.
async function grantLoot(supabase, characterId, drops) {
  if (!drops || drops.length === 0) return [];

  // Resolve os itens dos slugs dropados (uma query).
  const slugs = [...new Set(drops.map((d) => d.item_slug))];
  const { data: items, error } = await supabase
    .from('items')
    .select('id, slug, name, rarity, is_stackable')
    .in('slug', slugs);
  if (error) {
    console.error('[grantLoot] erro ao resolver itens:', error.message);
    return [];
  }
  const bySlug = {};
  for (const it of items || []) bySlug[it.slug] = it;

  const granted = [];
  for (const drop of drops) {
    const item = bySlug[drop.item_slug];
    if (!item) {
      // slug de loot sem item correspondente no catálogo: ignora com aviso.
      console.warn(`[grantLoot] item_slug sem item no catálogo: ${drop.item_slug}`);
      continue;
    }
    const qty = Math.max(1, drop.quantity || 1);

    if (item.is_stackable) {
      // Empilha: procura a linha não equipada existente e soma; senão insere.
      const { data: existing } = await supabase
        .from('character_inventory')
        .select('id, quantity')
        .eq('character_id', characterId)
        .eq('item_id', item.id)
        .eq('is_equipped', false)
        .maybeSingle();
      if (existing) {
        await supabase
          .from('character_inventory')
          .update({ quantity: (existing.quantity || 0) + qty })
          .eq('id', existing.id);
      } else {
        await supabase.from('character_inventory').insert({
          character_id: characterId, item_id: item.id, quantity: qty, is_equipped: false,
        });
      }
    } else {
      // Equipável/não empilhável: 1 linha por unidade.
      const rows = Array.from({ length: qty }, () => ({
        character_id: characterId, item_id: item.id, quantity: 1, is_equipped: false,
      }));
      await supabase.from('character_inventory').insert(rows);
    }

    granted.push({ item_slug: item.slug, quantity: qty, name: item.name, rarity: item.rarity });
  }
  return granted;
}

module.exports = { rollLoot, grantLoot };
