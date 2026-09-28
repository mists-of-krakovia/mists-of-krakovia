// Itens do bestiário — materiais de loot + 5 armas épicas de boss.
// Fonte: docs/md/bestiario-zona-inicial.md (secoes 2, 8-B, 9). REST-only, idempotente.
//
// Uso (na pasta backend):
//   $env:NODE_EXTRA_CA_CERTS = "C:\Users\Roberval\.krakovia-certs\avast-root.pem"
//   node scripts/seed-bestiary-items.js

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

// Materiais/recursos de loot (resource; stackaveis; sem stats).
const mat = (slug, name, rarity, base_value, weight, description) => ({
  slug, name, item_type: 'resource', description,
  is_equippable: false, equipment_slot: null, weight,
  stats: {}, requirements: {}, is_tradeable: true, rarity, base_value, is_stackable: true,
});

// Arma épica (weapon; main_hand; nao stackavel; requisito de pericia).
const epic = (slug, name, base_value, weight, stats, requirements, description) => ({
  slug, name, item_type: 'weapon', description,
  is_equippable: true, equipment_slot: 'main_hand', weight,
  stats, requirements, is_tradeable: true, rarity: 'epic', base_value, is_stackable: false,
});

const ITEMS = [
  // ── Materiais de fauna ──────────────────────────────────────────────
  mat('couro_de_besta', 'Couro de Besta', 'common', 4, 0.6, 'Pele curtida de fauna alterada. Matéria-prima de armaduras leves.'),
  mat('dente_afiado', 'Dente Afiado', 'common', 3, 0.1, 'Dente pontiagudo de predador. Usado em armas improvisadas.'),
  mat('pelugem_rasgada', 'Pelagem Rasgada', 'common', 2, 0.2, 'Tufos de pelo emaranhado. Serve de estofo e isolamento.'),
  mat('pena_negra', 'Pena Negra', 'common', 2, 0.05, 'Pena de corvo da cinza, brilho oleoso. Curiosidade e material leve.'),
  mat('garra_curva', 'Garra Curva', 'uncommon', 6, 0.15, 'Garra recurva e dura. Ponta natural para lâminas e ferramentas.'),
  mat('osso_roido', 'Osso Roído', 'common', 1, 0.2, 'Osso descartado, marcas de dente. Pouco valor, muito comum.'),
  mat('carne_mutada', 'Carne Mutada', 'uncommon', 5, 0.5, 'Tecido alterado pela borda da névoa. Instável; alquimistas pagam por ela.'),

  // ── Componentes de autômato ─────────────────────────────────────────
  mat('engrenagem_enferrujada', 'Engrenagem Enferrujada', 'common', 4, 0.4, 'Peça pré-Cataclisma comida pela ferrugem. Base de reparos.'),
  mat('oleo_espesso', 'Óleo Espesso', 'common', 3, 0.3, 'Lubrificante viscoso escorrido de máquinas antigas.'),
  mat('nucleo_apagado', 'Núcleo Apagado', 'rare', 22, 0.3, 'O núcleo de controle de um autômato, já sem energia. Raro e cobiçado pelo Conclave.'),
  mat('fiacao_de_cobre', 'Fiação de Cobre', 'common', 3, 0.2, 'Fios de cobre recuperados de circuitos antigos.'),

  // ── Diversos / facção ───────────────────────────────────────────────
  mat('panos_imundos', 'Panos Imundos', 'common', 1, 0.3, 'Trapos encardidos. Quase sem valor, mas servem de bandagem improvisada.'),
  mat('moeda_antiga', 'Moeda Antiga', 'common', 1, 0.02, 'Moeda krakoviana pré-Cataclisma. Sem curso legal — ainda. (Base da economia futura.)'),
  mat('frasco_vazio', 'Frasco Vazio', 'common', 2, 0.1, 'Recipiente de vidro reutilizável para alquimia e medicina.'),
  mat('raizes_retorcidas', 'Raízes Retorcidas', 'common', 2, 0.3, 'Raízes endurecidas da vegetação da cinza. Fibra e material herbal.'),
  mat('cristal_opaco', 'Cristal Opaco', 'rare', 28, 0.15, 'Fragmento fraco de Ætherium, sem brilho. O primeiro contato do jogador com o mineral que move o mundo.'),
  mat('marca_da_fumaca', 'Marca da Fumaça', 'uncommon', 10, 0.05, 'Talismã enegrecido da Irmandade da Fumaça Negra. Item de facção.'),

  // ── Armas épicas de boss (uma por classe) ───────────────────────────
  epic('presa_da_matriarca', 'Presa da Matriarca', 90, 0.7,
    { attack_melee: 9, accuracy: 4, crit_chance: 6, speed: 2 },
    { skill: 'armas_brancas_leves', level: 3 },
    'Adaga curva feita de uma presa da rata-mãe, ainda quente. Leve, cruel, rápida. A lâmina de quem anda na frente. (Vagante das Névoas)'),
  epic('martelo_do_capataz', 'Martelo do Capataz', 110, 5.0,
    { attack_melee: 16, defense: 4, crit_damage: 15 },
    { str_mg: 4, skill: 'armas_brancas_pesadas', level: 3 },
    'A marreta hidráulica arrancada do braço do autômato-capataz, reaproveitada como arma de duas mãos. Pesada como uma sentença. (Exilado de Ferro)'),
  epic('cutelo_ritual', 'Cutelo Ritual', 95, 0.9,
    { attack_melee: 8, accuracy: 3, hp_max: 12, mist_resistance: 4 },
    { skill: 'armas_brancas_leves', level: 3 },
    'A lâmina cerimonial da Irmandade, meio cristalizada; corta e protege quem crê. Confortável nas mãos de um Confessor. (Confessor do Véu)'),
  epic('rifle_do_cacador', 'Rifle do Caçador', 105, 1.6,
    { attack_ranged: 14, accuracy: 6, crit_chance: 5 },
    { per_mg: 4, skill: 'armas_fogo_leves', level: 3 },
    'Cano longo, mira fina, feito para o tiro certo à distância. O rifle que abateu o alfa — ou que o alfa guardava. (Cronista das Ruínas)'),
  epic('projetor_de_esporos', 'Projetor de Esporos', 100, 1.3,
    { attack_ranged: 12, accuracy: 4, observation: 3, crit_chance: 4 },
    { int_mg: 3, skill: 'dispositivos_combate', level: 3 },
    'Dispositivo do Conclave adaptado a partir da própria Coisa da Borda: dispara uma nuvem de esporos cristalinos. Arma técnica. (Arauto do Conclave)'),
];

async function main() {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
    console.error('Faltam SUPABASE_URL / SUPABASE_SERVICE_KEY no backend/.env.');
    process.exit(1);
  }
  console.log(`Semeando ${ITEMS.length} itens do bestiário (upsert por slug)...`);
  const { data, error } = await supabase.from('items').upsert(ITEMS, { onConflict: 'slug' }).select('slug, rarity, item_type');
  if (error) { console.error('Erro:', error.message); process.exit(1); }
  console.log(`OK: ${data.length} itens gravados.`);
  const byType = data.reduce((a, r) => { a[r.item_type] = (a[r.item_type] || 0) + 1; return a; }, {});
  const byRar = data.reduce((a, r) => { a[r.rarity] = (a[r.rarity] || 0) + 1; return a; }, {});
  console.log('Por tipo:', byType, '| Por raridade:', byRar);
}
main();
