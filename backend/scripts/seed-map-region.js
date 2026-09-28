// Mapa da região inicial (ironfall_region) — nós, conexões e spawns.
// Fonte: docs/md/mapa-regiao-inicial.md. REST-only, idempotente.
//
// O QUE FAZ (não-destrutivo fora da região):
//  1. Upsert dos nós por description_key (reaproveita os 5 existentes).
//  2. Reconstrói as conexões ENTRE nós da região (apaga só as que ligam nós desta
//     região e recria conforme o documento). Conexões bidirecionais.
//  3. Reconstrói os node_spawns dos nós da região (apaga os dos nós da região e
//     recria por nó, incluindo os covis de boss).
//
// Uso (na pasta backend):
//   $env:NODE_EXTRA_CA_CERTS = "C:\Users\Roberval\.krakovia-certs\avast-root.pem"
//   node scripts/seed-map-region.js

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

const REGION = 'ironfall_region';

// ── Nós (description_key é a chave estável) ───────────────────────────────────
// tipo: settlement|field|passage|secret. enc = encounter_rate.
const NODES = [
  // Assentamentos
  { key: 'ironfall_central', name: 'Ironfall — Distrito Central', type: 'settlement', safe: true, secret: false, enc: 0,
    desc: 'A cidade grande da região: forjas, muros e o cheiro de carvão. Ponto de partida de todo errante.' },
  { key: 'rostok_settlement', name: 'Rostok', type: 'settlement', safe: true, secret: false, enc: 0,
    desc: 'Vila de tratadores e sucateiros a leste de Ironfall. Cheira a couro e óleo. Segura, modesta, prática.' },
  { key: 'vila_cinzal', name: 'Vila Cinzal', type: 'settlement', safe: true, secret: false, enc: 0,
    desc: 'Vila agrícola a oeste, à sombra do Bosque Retorcido. Planta na cinza o que a cinza deixa. Segura.' },
  { key: 'posto_belograd', name: 'Posto Belograd', type: 'settlement', safe: true, secret: false, enc: 0,
    desc: 'O assentamento mais ao norte, na BORDA DA NÉVOA. Daqui se vê o borrão amarelo de perto, e o frio não é só do vento. É o limiar para o que há além — o Posto de Contenção ainda não deixa ninguém passar.' },

  // Exploração (12)
  { key: 'ironfall_gate', name: 'Portão da Encosta', type: 'passage', safe: false, secret: false, enc: 0.10,
    desc: 'A saída sul de Ironfall, uma encosta de pedra e mato seco. O primeiro pedaço de mundo aberto que um novato pisa.' },
  { key: 'campos_de_cinza', name: 'Campos de Cinza', type: 'field', safe: false, secret: false, enc: 0.20,
    desc: 'Campos abertos cobertos de cinza fina que range sob as botas. Fauna comum e algum saqueador de passagem.' },
  { key: 'cinzas_forest', name: 'Floresta das Cinzas', type: 'field', safe: false, secret: false, enc: 0.25,
    desc: 'Árvores retorcidas e cinzentas, silêncio pesado. Algo se move entre os troncos — e há quem diga que a mata esconde uma passagem.' },
  { key: 'estrada_pedagio', name: 'Estrada do Pedágio', type: 'passage', safe: false, secret: false, enc: 0.20,
    desc: 'A estrada de terra que liga Ironfall a Rostok. Bandidos cobram "pedágio" nas curvas cegas.' },
  { key: 'poco_dos_ratos', name: 'Poço dos Ratos', type: 'field', safe: false, secret: false, enc: 0.30,
    desc: 'Um poço seco e as galerias em volta, infestados de ratos. No fundo, algo bem maior os comanda.' },
  { key: 'suburbio_afogado', name: 'Subúrbio Afogado', type: 'field', safe: false, secret: false, enc: 0.30,
    desc: 'Ruínas de subúrbio meio submersas em água parada e lodo. Teias, mãos pálidas na névoa rasa.' },
  { key: 'bosque_retorcido', name: 'Bosque Retorcido', type: 'field', safe: false, secret: false, enc: 0.30,
    desc: 'Mata densa de galhos petrificados a oeste. A alcateia da borda ronda a clareira central.' },
  { key: 'ferro_velho', name: 'Ferro-Velho', type: 'field', safe: false, secret: false, enc: 0.25,
    desc: 'Um cemitério de máquinas pré-Cataclisma. Autômatos meio vivos ainda cumprem ordens. Uma torre queimada se ergue atrás da sucata.' },
  { key: 'pedreira_morta', name: 'Pedreira Morta', type: 'field', safe: false, secret: false, enc: 0.30,
    desc: 'Pedreira abandonada de paredes altas. Ursos esfolados e bandidos veteranos disputam o buraco.' },
  { key: 'charco_palido', name: 'Charco Pálido', type: 'field', safe: false, secret: false, enc: 0.35,
    desc: 'Pântano pálido onde a névoa começa a encostar no chão. Carne reptante e cultistas da Fumaça rezam no lodo.' },
  { key: 'trilha_contencao', name: 'Trilha da Contenção', type: 'passage', safe: false, secret: false, enc: 0.35,
    desc: 'A trilha que sobe rumo ao Posto de Contenção, já na sombra da névoa. Coisas transfiguradas espreitam; uma fenda se abre no paredão.' },
  { key: 'campo_cinzas_alto', name: 'Campo de Cinzas Alto', type: 'field', safe: false, secret: false, enc: 0.40,
    desc: 'O planalto de cinza mais ao norte, quase na borda. O ar arde. Aberrações de véu fino vagam aqui — o fim da região inicial.' },

  // Secretos (3)
  { key: 'bell_cave', name: 'Gruta dos Sinos', type: 'secret', safe: false, secret: true, enc: 0,
    desc: 'Uma gruta escondida atrás da Floresta das Cinzas, onde ecoam sinos que ninguém toca. A Irmandade da Fumaça se reúne no fundo.' },
  { key: 'burnt_tower', name: 'Torre Queimada', type: 'secret', safe: false, secret: true, enc: 0,
    desc: 'Uma torre calcinada oculta no Ferro-Velho. No topo, um capataz de aço que nunca desligou monta guarda.' },
  { key: 'fenda_reator', name: 'Fenda do Reator', type: 'secret', safe: false, secret: true, enc: 0,
    desc: 'Uma fenda na rocha da Trilha da Contenção, exalando frio cristalino. No escuro, algo observa antes de atacar. O limiar do que vem depois.' },
];

// ── Conexões bidirecionais (por description_key). vis=false -> secreta ────────
// [a, b, custo, dirLabelAB, dirLabelBA, visible]
const LINKS = [
  // Sul (tutorial)
  ['ironfall_central', 'ironfall_gate', 0, 'Portão da Encosta (sul)', 'Voltar para Ironfall', true],
  ['ironfall_gate', 'campos_de_cinza', 8, 'Campos de Cinza', 'Subir de volta ao Portão', true],
  // Oeste (Vila Cinzal)
  ['ironfall_central', 'cinzas_forest', 15, 'Floresta das Cinzas (oeste)', 'Voltar para Ironfall', true],
  ['cinzas_forest', 'campos_de_cinza', 10, 'Campos de Cinza', 'Entrar na Floresta', true],
  ['campos_de_cinza', 'bosque_retorcido', 12, 'Bosque Retorcido (oeste)', 'Voltar aos Campos', true],
  ['bosque_retorcido', 'vila_cinzal', 10, 'Vila Cinzal', 'Entrar no Bosque', true],
  // Leste (Rostok)
  ['ironfall_central', 'estrada_pedagio', 12, 'Estrada do Pedágio (leste)', 'Voltar para Ironfall', true],
  ['estrada_pedagio', 'rostok_settlement', 10, 'Rostok', 'Pegar a estrada', true],
  ['estrada_pedagio', 'poco_dos_ratos', 12, 'Poço dos Ratos', 'Voltar à estrada', true],
  ['poco_dos_ratos', 'suburbio_afogado', 12, 'Subúrbio Afogado', 'Voltar ao Poço', true],
  // Norte (borda / Belograd)
  ['ironfall_central', 'ferro_velho', 15, 'Ferro-Velho (norte)', 'Voltar para Ironfall', true],
  ['ferro_velho', 'pedreira_morta', 14, 'Pedreira Morta', 'Voltar ao Ferro-Velho', true],
  ['ironfall_central', 'charco_palido', 16, 'Charco Pálido (norte)', 'Voltar para Ironfall', true],
  ['charco_palido', 'trilha_contencao', 16, 'Trilha da Contenção', 'Descer ao Charco', true],
  ['trilha_contencao', 'campo_cinzas_alto', 18, 'Campo de Cinzas Alto', 'Descer a Trilha', true],
  ['campo_cinzas_alto', 'posto_belograd', 20, 'Posto Belograd (borda)', 'Descer o planalto', true],
  // Secretas (invisíveis até descobrir)
  ['cinzas_forest', 'bell_cave', 10, 'Passagem oculta...', 'Sair da Gruta', false],
  ['ferro_velho', 'burnt_tower', 10, 'Passagem oculta...', 'Descer da Torre', false],
  ['trilha_contencao', 'fenda_reator', 12, 'Passagem oculta...', 'Sair da Fenda', false],
];

// ── Spawns por nó (description_key -> [ [enemy_slug, weight, min, max, type], ... ]) ──
const SPAWNS = {
  ironfall_gate: [['rato_de_esgoto',120,1,1], ['corvo_carnical',90,1,1], ['rato_da_bruma',100,1,1]],
  campos_de_cinza: [['cao_vira_lata_faminto',100,1,1], ['corvo_carnical',70,1,1], ['saqueador_esfarrapado',80,1,1]],
  cinzas_forest: [['rato_da_bruma',120,1,1], ['javali_das_cinzas',70,1,1], ['corvo_de_tres_olhos',20,1,1]],
  estrada_pedagio: [['bandido_de_estrada',110,1,1], ['saqueador_esfarrapado',80,1,1], ['sentinela_tombada',40,1,1]],
  poco_dos_ratos: [['rato_da_bruma_alfa',60,1,1], ['rato_de_esgoto',120,1,1], ['coletor_de_sucata',60,1,1]],
  suburbio_afogado: [['aranha_da_teia_cinza',90,1,1], ['homem_da_bruma',70,1,1], ['carne_reptante',50,1,1]],
  bosque_retorcido: [['veado_espectral',40,1,1], ['sabujo_da_borda',90,1,1], ['enxame_de_mariposas',70,1,1]],
  ferro_velho: [['automato_de_carga',90,1,1], ['coletor_de_sucata',80,1,1], ['vigia_ocular',50,1,1]],
  pedreira_morta: [['urso_esfolado',70,1,1], ['saqueador_veterano',80,1,1], ['vigia_ocular',60,1,1]],
  charco_palido: [['carne_reptante',80,1,1], ['cultista_da_fumaca',80,1,1], ['farmaceutico_renegado',30,1,1]],
  trilha_contencao: [['cultista_transfigurado',60,1,1], ['colosso_enferrujado',30,1,1], ['aberracao_de_veu_fino',40,1,1]],
  campo_cinzas_alto: [['aberracao_de_veu_fino',70,1,1], ['ninho_ambulante',30,1,1], ['colosso_enferrujado',40,1,1]],
};

// Bosses: nó-covil -> enemy_slug. Entram como spawn de peso único no nó (type guaranteed).
const BOSS_LAIRS = {
  poco_dos_ratos: 'boss_matriarca_dos_ratos', // boss no fundo do poço (mesmo nó de exploração)
  bosque_retorcido: 'boss_alfa_da_alcateia',  // clareira do bosque
  burnt_tower: 'boss_capataz_ferrugem',       // secreto
  bell_cave: 'boss_profeta_da_fumaca',        // secreto
  fenda_reator: 'boss_coisa_da_borda',        // secreto
};

async function main() {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
    console.error('Faltam SUPABASE_URL / SUPABASE_SERVICE_KEY.'); process.exit(1);
  }

  // 1) Upsert dos nós.
  const rows = NODES.map((n) => ({
    name: n.name, description_key: n.key, node_type: n.type, region: REGION,
    is_safe_zone: n.safe, is_secret: n.secret, encounter_rate: n.enc,
  }));
  // Upsert manual por description_key (não há unique constraint garantida): busca id.
  const { data: existing } = await supabase.from('world_nodes').select('id, description_key').eq('region', REGION);
  const idByKey = Object.fromEntries((existing || []).map((r) => [r.description_key, r.id]));
  for (const n of NODES) {
    const payload = {
      name: n.name, description_key: n.key, node_type: n.type, region: REGION,
      is_safe_zone: n.safe, is_secret: n.secret, encounter_rate: n.enc,
    };
    if (idByKey[n.key]) {
      await supabase.from('world_nodes').update(payload).eq('id', idByKey[n.key]);
    } else {
      const { data: ins } = await supabase.from('world_nodes').insert(payload).select('id').single();
      if (ins) idByKey[n.key] = ins.id;
    }
  }
  console.log(`Nós da região: ${Object.keys(idByKey).length}`);

  // Também atualiza a description dos nós existentes fora do conjunto? Não: só região.
  // (descrição textual fica no cliente/na narração; o schema não tem coluna description
  //  em world_nodes — o texto acima é para o documento/narração.)

  const regionNodeIds = new Set(NODES.map((n) => idByKey[n.key]).filter(Boolean));

  // 2) Reconstrói conexões ENTRE nós da região.
  //    Apaga conexões cujo from OU to pertence à região (limpa layout antigo).
  const idList = [...regionNodeIds];
  await supabase.from('node_connections').delete().in('from_node_id', idList);
  await supabase.from('node_connections').delete().in('to_node_id', idList);

  const connRows = [];
  for (const [a, b, cost, dirAB, dirBA, vis] of LINKS) {
    const fa = idByKey[a], fb = idByKey[b];
    if (!fa || !fb) { console.warn(`Link ignorado (nó ausente): ${a} <-> ${b}`); continue; }
    // Sentido de ida A->B: usa 'vis' (invisível quando é passagem secreta).
    connRows.push({ from_node_id: fa, to_node_id: fb, travel_cost: cost, is_visible: vis, direction_label: dirAB });
    // Sentido de volta B->A: SEMPRE visível — quando o jogador está em B, ele já o
    // descobriu e precisa poder sair (vale inclusive para nós secretos).
    connRows.push({ from_node_id: fb, to_node_id: fa, travel_cost: cost, is_visible: true, direction_label: dirBA });
  }
  const { error: cErr } = await supabase.from('node_connections').insert(connRows);
  if (cErr) { console.error('Erro conexões:', cErr.message); process.exit(1); }
  console.log(`Conexões criadas: ${connRows.length}`);

  // 3) Reconstrói spawns dos nós da região.
  await supabase.from('node_spawns').delete().in('node_id', idList);
  const spawnRows = [];
  for (const [key, list] of Object.entries(SPAWNS)) {
    if (!list) continue;
    const nodeId = idByKey[key];
    if (!nodeId) continue;
    for (const [slug, weight, min, max] of list) {
      spawnRows.push({ node_id: nodeId, enemy_slug: slug, spawn_type: 'random', weight, min_count: min, max_count: max, is_active: true });
    }
  }
  // Bosses (guaranteed) nos covis.
  for (const [key, slug] of Object.entries(BOSS_LAIRS)) {
    const nodeId = idByKey[key];
    if (!nodeId) { console.warn(`Covil sem nó: ${key}`); continue; }
    spawnRows.push({ node_id: nodeId, enemy_slug: slug, spawn_type: 'guaranteed', weight: 1, min_count: 1, max_count: 1, is_active: true });
  }
  const { error: sErr } = await supabase.from('node_spawns').insert(spawnRows);
  if (sErr) { console.error('Erro spawns:', sErr.message); process.exit(1); }
  console.log(`Spawns criados: ${spawnRows.length} (incl. ${Object.keys(BOSS_LAIRS).length} covis de boss)`);

  console.log('\nMapa da região semeado com sucesso.');
}
main();
