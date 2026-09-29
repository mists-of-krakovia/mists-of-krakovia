// NPC pousada (descanso a custo baixo) — cria/atualiza a estalajadeira de Ironfall,
// marca is_innkeeper e semeia falas. REST-only, idempotente.
//
// Uso (na pasta backend):
//   $env:NODE_EXTRA_CA_CERTS = "C:\Users\Roberval\.krakovia-certs\avast-root.pem"
//   node scripts/seed-innkeeper.js

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

const INN = {
  name: 'Dona Yelena',
  node_key: 'ironfall_central',
  description: 'Estalajadeira de braços fortes e sopa quente. A Pousada da Bigorna Fria é o lugar mais seguro de Ironfall para fechar os olhos.',
};

const DIALOGUE = {
  SAUDACAO: ['Entre, entre! Uma cama quente espera por você.', 'Bem-vindo à Bigorna Fria. Precisa descansar?', 'Ah, um rosto cansado. Tenho o remédio: uma boa noite de sono.'],
  SOBRE_NPC: ['Dona Yelena, dona desta pousada. Cuido de quem volta da estrada.', 'Toco a Bigorna Fria desde que meu marido não voltou da névoa. A casa segue de pé.'],
  COMERCIO: ['Não vendo mercadoria, mas vendo descanso. Use o botão de descansar.', 'Aqui se compra sono e sopa. O resto é com o Josef, lá no mercado.'],
  NEVOA: ['Não fale da névoa sob o meu teto. Aqui a gente esquece dela por uma noite.', 'Muita gente entra na névoa. Nem todos voltam para pagar a conta.'],
  KRAKOVIA: ['Dizem que Krakovia tinha estalagens de mármore. A minha é de madeira e ferro, mas o sono é igual.', 'Cidade grande, camas grandes. Aqui a cama é pequena, mas é sua por uma noite.'],
  FACCAO: ['Legionário, clérigo, cultista — todos dormem igual na minha pousada. Só peço que paguem.', 'Não tomo partido. Tomo a conta no fim da estadia.'],
  RUMORES: ['Os hóspedes falam demais quando bebem. Ouço coisas do Ferro-Velho, do Poço...', 'Um errante disse ter visto uma torre na sucata. Depois bebeu mais e não voltou.'],
  MISSAO: ['Trabalho? O meu é te manter inteiro. Descanse e siga em frente.', 'Não dou tarefas, dou cama. Volte quando precisar recuperar as forças.'],
  OBSCENO: ['Olha a boca dentro da minha pousada! Isto aqui é uma casa de família.', 'Fala assim de novo e durma na rua, ouviu?'],
  DESPEDIDA: ['Descanse bem! Volte quando as pernas pesarem.', 'Boa estrada. E cuidado com a névoa.'],
  DESCONHECIDO: ['Não entendi, querido. Mas se é cansaço, isso eu resolvo.', 'Hã? Fale mais devagar, acabei de acordar.'],
};

async function main() {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
    console.error('Faltam SUPABASE_URL / SUPABASE_SERVICE_KEY.'); process.exit(1);
  }
  const { data: node } = await supabase.from('world_nodes').select('id, name').eq('description_key', INN.node_key).single();
  if (!node) { console.error('Nó de Ironfall não encontrado.'); process.exit(1); }

  let npcId;
  const { data: existing } = await supabase.from('npcs').select('id').eq('node_id', node.id).eq('name', INN.name).maybeSingle();
  if (existing) {
    await supabase.from('npcs').update({ description: INN.description, is_innkeeper: true, is_quest_giver: false }).eq('id', existing.id);
    npcId = existing.id; console.log(`Pousada atualizada: ${INN.name}`);
  } else {
    const { data: ins } = await supabase.from('npcs')
      .insert({ name: INN.name, node_id: node.id, description: INN.description, is_innkeeper: true, is_quest_giver: false })
      .select('id').single();
    npcId = ins.id; console.log(`Pousada criada: ${INN.name} em ${node.name}`);
  }

  await supabase.from('npc_dialogue').delete().eq('npc_id', npcId).eq('locale', 'pt');
  const rows = Object.entries(DIALOGUE).map(([intent, variants], i) => ({
    npc_id: npcId, locale: 'pt', intent, variants, min_confidence: 0, sort_order: i,
  }));
  const { error } = await supabase.from('npc_dialogue').insert(rows);
  if (error) { console.error('Erro no diálogo:', error.message); process.exit(1); }
  console.log(`Diálogo da pousada: ${rows.length} intencoes.`);
}
main();
