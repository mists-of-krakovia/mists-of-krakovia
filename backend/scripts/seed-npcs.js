// NPCs da região inicial — Spec 4 (Diálogos), Sub-parte A.
// Fonte: docs/md/npcs-regiao-inicial.md. REST-only, idempotente.
// Cria/atualiza 8 NPCs (2 por assentamento). Ironfall reaproveita Maren Vosk por
// nome+nó. Ligação por description_key do assentamento.
//
// Uso (na pasta backend):
//   $env:NODE_EXTRA_CA_CERTS = "C:\Users\Roberval\.krakovia-certs\avast-root.pem"
//   node scripts/seed-npcs.js

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

// NPCs por assentamento (description_key -> lista de { name, description }).
const NPCS = {
  ironfall_central: [
    { name: 'Maren Vosk', description: 'Informante cansada; leva e traz recados por Ironfall. Fala seco e prático.' },
    { name: 'Tomas Grieg', description: 'Ferreiro enorme e caloroso; orgulhoso do ofício, desconfia da névoa.' },
  ],
  rostok_settlement: [
    { name: 'Iva Renko', description: 'Tratadora de bestas jovem e calejada; gosta mais de animais que de gente.' },
    { name: 'Petrov Sluka', description: 'Sucateiro velho de um olho leitoso; fala em rodeios e adora uma história.' },
  ],
  vila_cinzal: [
    { name: 'Irmã Aldona', description: 'Clériga serena da Igreja do Véu Prateado; cuida dos que a névoa tocou.' },
    { name: 'Old Bohdan', description: 'Lavrador de cinza teimoso e resmungão, mas honesto.' },
  ],
  posto_belograd: [
    { name: 'Osip Drenkov', description: 'Sargento veterano da Legião; guarda a porta da névoa. Fala em ordens curtas.' },
    { name: 'Lena Marchuk', description: 'Batedora nervosa da borda; fala rápido e baixo, sempre olhando o norte.' },
  ],
};

async function main() {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
    console.error('Faltam SUPABASE_URL / SUPABASE_SERVICE_KEY.'); process.exit(1);
  }
  let created = 0, updated = 0;
  for (const [nodeKey, list] of Object.entries(NPCS)) {
    const { data: node } = await supabase.from('world_nodes').select('id, name').eq('description_key', nodeKey).single();
    if (!node) { console.warn(`Nó ausente: ${nodeKey}`); continue; }
    for (const npc of list) {
      // Idempotente por (name, node_id): busca existente.
      const { data: existing } = await supabase
        .from('npcs').select('id').eq('node_id', node.id).eq('name', npc.name).maybeSingle();
      if (existing) {
        await supabase.from('npcs').update({ description: npc.description, is_quest_giver: false }).eq('id', existing.id);
        updated++;
      } else {
        await supabase.from('npcs').insert({ name: npc.name, node_id: node.id, description: npc.description, is_quest_giver: false });
        created++;
      }
    }
    console.log(`${node.name}: ${list.map((n) => n.name).join(', ')}`);
  }
  console.log(`\nNPCs criados: ${created}, atualizados: ${updated}.`);
}
main();
