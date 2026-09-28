// Seed do loot_table dos inimigos iniciais — Spec 3 (Inventário), Sub-parte B.
// Ver .kiro/specs/inventario/design.md §1.3. Mantém sincronia com supabase/seed.sql.
// REST-only (sem abrir porta). Idempotente (UPDATE por slug).
//
// Uso (na pasta backend):
//   $env:NODE_EXTRA_CA_CERTS = "C:\Users\Roberval\.krakovia-certs\avast-root.pem"
//   node scripts/seed-loot.js

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// slug do inimigo -> loot_table (formato consumido por services/loot.js).
const LOOT = {
  rato_da_bruma: [
    { item_slug: 'sucata_metal', chance: 0.5, min: 1, max: 2 },
    { item_slug: 'pocao_cura', chance: 0.15, min: 1, max: 1 },
  ],
  vagante_corrompido: [
    { item_slug: 'sucata_metal', chance: 0.5, min: 1, max: 2 },
    { item_slug: 'essencia_nevoa', chance: 0.35, min: 1, max: 1 },
    { item_slug: 'frasco_veneno', chance: 0.2, min: 1, max: 1 },
    { item_slug: 'faca_enferrujada', chance: 0.08, min: 1, max: 1 },
  ],
  sabujo_de_ferro: [
    { item_slug: 'sucata_metal', chance: 0.7, min: 2, max: 4 },
    { item_slug: 'essencia_nevoa', chance: 0.4, min: 1, max: 2 },
    { item_slug: 'granada_quimica', chance: 0.15, min: 1, max: 1 },
    { item_slug: 'escudo_madeira', chance: 0.1, min: 1, max: 1 },
  ],
};

async function main() {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
    console.error('Faltam SUPABASE_URL / SUPABASE_SERVICE_KEY no backend/.env.');
    process.exit(1);
  }

  for (const [slug, table] of Object.entries(LOOT)) {
    const { error } = await supabase
      .from('enemy_catalog')
      .update({ loot_table: table })
      .eq('slug', slug);
    if (error) {
      console.error(`Erro ao atualizar loot de ${slug}:`, error.message);
      process.exit(1);
    }
    console.log(`OK: loot_table de ${slug} (${table.length} entradas).`);
  }
  console.log('Loot semeado.');
}

main();
