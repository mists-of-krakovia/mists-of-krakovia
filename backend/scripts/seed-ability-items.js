// Custo de item das habilidades — Spec 3 (Inventário), Sub-parte E.
// Ver .kiro/specs/inventario/design.md §3.5. Adiciona effect.req_item às 4
// habilidades que consomem item. Idempotente (lê effect atual e faz merge).
// REST-only (sem abrir porta).
//
// Uso (na pasta backend):
//   $env:NODE_EXTRA_CA_CERTS = "C:\Users\Roberval\.krakovia-certs\avast-root.pem"
//   node scripts/seed-ability-items.js

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// slug da habilidade -> slug do item consumido.
const REQ_ITEM = {
  granada_quimica:   'granada_quimica',
  ataque_envenenado: 'frasco_veneno',
  pocao_em_area:     'pocao_cura',
  gas_paralisante:   'granada_gas',
};

async function main() {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
    console.error('Faltam SUPABASE_URL / SUPABASE_SERVICE_KEY no backend/.env.');
    process.exit(1);
  }

  for (const [abilitySlug, itemSlug] of Object.entries(REQ_ITEM)) {
    const { data: row, error: readErr } = await supabase
      .from('abilities_catalog').select('slug, effect').eq('slug', abilitySlug).single();
    if (readErr || !row) {
      console.error(`Habilidade nao encontrada: ${abilitySlug} (${readErr?.message || 'ausente'})`);
      process.exit(1);
    }
    const effect = { ...(row.effect || {}), req_item: itemSlug };
    const { error: upErr } = await supabase
      .from('abilities_catalog').update({ effect }).eq('slug', abilitySlug);
    if (upErr) {
      console.error(`Erro ao atualizar ${abilitySlug}:`, upErr.message);
      process.exit(1);
    }
    console.log(`OK: ${abilitySlug} -> req_item=${itemSlug}`);
  }
  console.log('req_item semeado nas habilidades.');
}

main();
