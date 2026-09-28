// NPC vendedor (economia básica) — cria/atualiza o comerciante de Ironfall,
// marca is_vendor e semeia suas falas de diálogo. REST-only, idempotente.
//
// Uso (na pasta backend):
//   $env:NODE_EXTRA_CA_CERTS = "C:\Users\Roberval\.krakovia-certs\avast-root.pem"
//   node scripts/seed-vendor.js

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

const VENDOR = {
  name: 'Josef Marchenko',
  node_key: 'ironfall_central',
  description: 'Comerciante rechonchudo de sorriso fácil e olho de raposa. Compra quase tudo e vende o essencial. O primeiro balcão de Ironfall.',
};

const DIALOGUE = {
  SAUDACAO: ['Bem-vindo, bem-vindo! Ouro na mão? Eu tenho a solução.', 'Ah, um cliente! Sente-se, olhe a mercadoria.', 'Entre, entre. Aqui tudo tem preço — justo, quase sempre.'],
  SOBRE_NPC: ['Josef Marchenko, ao seu dispor. Compro o que você acha, vendo o que você precisa.', 'Sou comerciante. O único honesto de Ironfall, dizem — os outros que sumiram.'],
  COMERCIO: ['Claro! Traga o que quer vender ou veja o que tenho à venda. Use o botão da loja.', 'Negócios? Minha especialidade. Abra a loja e vamos conversar em números.'],
  NEVOA: ['A névoa? Péssima para os negócios. Some com meus fornecedores. E com os clientes.', 'Enquanto houver quem volte da borda com sucata, eu lucro. Torço para que voltem.'],
  KRAKOVIA: ['Dizem que lá dentro há tesouros. Eu digo: traga um e conversamos sobre o preço.', 'Krakovia... o maior mercado que já existiu, agora um cofre trancado por pesadelos.'],
  FACCAO: ['Vendo para legionário, cultista e clérigo igual. Ouro não tem facção.', 'Não tomo partido. Tomo comissão.'],
  RUMORES: ['Ouvi que sucata boa anda cara. Se você trouxer, pago bem.', 'Dizem que há moedas antigas caindo dos bandidos. Essas eu compro pelo valor cheio, sabia?'],
  MISSAO: ['Trabalho? Meu trabalho é comprar e vender. O seu é me trazer coisa boa.', 'Não dou tarefas, dou preços. Volte com mercadoria.'],
  OBSCENO: ['Ora! Guarde esse linguajar — não baixo o preço nem subo o tom.', 'Hehe, com essa boca não vai conseguir desconto, amigo.'],
  DESPEDIDA: ['Volte sempre! E traga ouro.', 'Bons negócios. Ou pelo menos, negócios.'],
  DESCONHECIDO: ['Não entendi — mas se for sobre preço, estou ouvindo.', 'Hã? Fale a língua do comércio: o que compra, o que vende?'],
};

async function main() {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
    console.error('Faltam SUPABASE_URL / SUPABASE_SERVICE_KEY.'); process.exit(1);
  }
  const { data: node } = await supabase.from('world_nodes').select('id, name').eq('description_key', VENDOR.node_key).single();
  if (!node) { console.error('Nó de Ironfall não encontrado.'); process.exit(1); }

  // Upsert por (name, node_id).
  let npcId;
  const { data: existing } = await supabase.from('npcs').select('id').eq('node_id', node.id).eq('name', VENDOR.name).maybeSingle();
  if (existing) {
    await supabase.from('npcs').update({ description: VENDOR.description, is_vendor: true, is_quest_giver: false }).eq('id', existing.id);
    npcId = existing.id;
    console.log(`Vendedor atualizado: ${VENDOR.name}`);
  } else {
    const { data: ins } = await supabase.from('npcs')
      .insert({ name: VENDOR.name, node_id: node.id, description: VENDOR.description, is_vendor: true, is_quest_giver: false })
      .select('id').single();
    npcId = ins.id;
    console.log(`Vendedor criado: ${VENDOR.name} em ${node.name}`);
  }

  // Diálogo (pt): limpa e recria.
  await supabase.from('npc_dialogue').delete().eq('npc_id', npcId).eq('locale', 'pt');
  const rows = Object.entries(DIALOGUE).map(([intent, variants], i) => ({
    npc_id: npcId, locale: 'pt', intent, variants, min_confidence: 0, sort_order: i,
  }));
  const { error } = await supabase.from('npc_dialogue').insert(rows);
  if (error) { console.error('Erro no diálogo:', error.message); process.exit(1); }
  console.log(`Diálogo do vendedor: ${rows.length} intencoes.`);
}
main();
