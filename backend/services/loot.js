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

// Concede o loot ao personagem. STUB por ora: quando o sistema de itens existir,
// aqui fará upsert em character_inventory (resolvendo item_slug -> item_id).
// Retorna os drops concedidos (para o payload de recompensa).
async function grantLoot(/* supabase, characterId, */ drops) {
  // TODO(spec de itens): inserir/upsert em character_inventory.
  // Enquanto isso, apenas repassa os drops (loop pronto, concessão inerte).
  return drops;
}

module.exports = { rollLoot, grantLoot };
