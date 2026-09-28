// Seed dos itens do MVP — Spec 3 (Inventário), Sub-parte A.
// Ver .kiro/specs/inventario/design.md §1.1 e supabase/seed.sql (fonte canônica).
//
// Por que um script Node em vez de `db push --include-seed`:
//   - `db push` não roda seed nesta máquina (histórico do projeto) e não há psql.
//   - Usa só a REST API do Supabase (supabase-js), sem abrir porta — não dispara o
//     comportamento do Avast que mata node.exe que escuta porta.
//   - Idempotente: upsert por `slug`.
//
// Uso (na pasta backend):
//   $env:NODE_EXTRA_CA_CERTS = "C:\Users\Roberval\.krakovia-certs\avast-root.pem"
//   node scripts/seed-items.js
//
// Requer backend/.env com SUPABASE_URL e SUPABASE_SERVICE_KEY.

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Mesmo conjunto do supabase/seed.sql (mantê-los em sincronia). MVP: só
// common/uncommon. stats = bônus direto a derivados; requirements = str_mg / skill.
const ITEMS = [
  // Armas brancas leves
  { slug: 'faca_enferrujada', name: 'Faca Enferrujada', item_type: 'weapon',
    description: 'Uma lâmina curta e gasta, mas ainda corta. O primeiro recurso de quem sai dos muros.',
    is_equippable: true, equipment_slot: 'main_hand', weight: 0.6,
    stats: { attack_melee: 3, accuracy: 1 }, requirements: {},
    is_tradeable: true, rarity: 'common', base_value: 5, is_stackable: false },
  { slug: 'adaga_afiada', name: 'Adaga Afiada', item_type: 'weapon',
    description: 'Bem cuidada e balanceada. Rápida nas mãos certas.',
    is_equippable: true, equipment_slot: 'main_hand', weight: 0.7,
    stats: { attack_melee: 5, accuracy: 2, crit_chance: 2 },
    requirements: { skill: 'armas_brancas_leves', level: 1 },
    is_tradeable: true, rarity: 'uncommon', base_value: 24, is_stackable: false },

  // Armas brancas pesadas
  { slug: 'marreta_industrial', name: 'Marreta Industrial', item_type: 'weapon',
    description: 'Peso bruto de aço. Lenta, mas cada golpe conta.',
    is_equippable: true, equipment_slot: 'main_hand', weight: 3.2,
    stats: { attack_melee: 8 },
    requirements: { str_mg: 3, skill: 'armas_brancas_pesadas', level: 1 },
    is_tradeable: true, rarity: 'uncommon', base_value: 30, is_stackable: false },

  // Armas de fogo leves
  { slug: 'pistola_ferrugem', name: 'Pistola Enferrujada', item_type: 'weapon',
    description: 'Revólver velho de tambor emperrado. Ainda dispara, na maioria das vezes.',
    is_equippable: true, equipment_slot: 'main_hand', weight: 1.1,
    stats: { attack_ranged: 4, accuracy: 1 }, requirements: {},
    is_tradeable: true, rarity: 'common', base_value: 8, is_stackable: false },
  { slug: 'revolver_guarda', name: 'Revólver da Guarda', item_type: 'weapon',
    description: 'Arma padrão da Guarda de Ironfall. Confiável e precisa.',
    is_equippable: true, equipment_slot: 'main_hand', weight: 1.2,
    stats: { attack_ranged: 6, accuracy: 3 },
    requirements: { skill: 'armas_fogo_leves', level: 1 },
    is_tradeable: true, rarity: 'uncommon', base_value: 28, is_stackable: false },

  // Armaduras leves por slot
  { slug: 'capuz_couro', name: 'Capuz de Couro', item_type: 'armor',
    description: 'Couro tratado que cobre a cabeça. Proteção modesta, pouco peso.',
    is_equippable: true, equipment_slot: 'head', weight: 0.5,
    stats: { defense: 1 }, requirements: {},
    is_tradeable: true, rarity: 'common', base_value: 6, is_stackable: false },
  { slug: 'colete_couro', name: 'Colete de Couro', item_type: 'armor',
    description: 'Peitoral de couro reforçado. Básico, mas segura um golpe.',
    is_equippable: true, equipment_slot: 'chest', weight: 2.0,
    stats: { defense: 2, hp_max: 3 }, requirements: {},
    is_tradeable: true, rarity: 'common', base_value: 12, is_stackable: false },
  { slug: 'luvas_couro', name: 'Luvas de Couro', item_type: 'armor',
    description: 'Protegem as mãos sem atrapalhar o punho.',
    is_equippable: true, equipment_slot: 'hands', weight: 0.3,
    stats: { defense: 1 }, requirements: {},
    is_tradeable: true, rarity: 'common', base_value: 5, is_stackable: false },
  { slug: 'calcas_reforcadas', name: 'Calças Reforçadas', item_type: 'armor',
    description: 'Tecido grosso com placas de couro nas coxas.',
    is_equippable: true, equipment_slot: 'legs', weight: 1.0,
    stats: { defense: 1 }, requirements: {},
    is_tradeable: true, rarity: 'common', base_value: 7, is_stackable: false },
  { slug: 'colete_malha', name: 'Colete de Malha', item_type: 'armor',
    description: 'Malha metálica leve sob o tecido. Boa defesa sem travar o movimento.',
    is_equippable: true, equipment_slot: 'chest', weight: 3.5,
    stats: { defense: 4, hp_max: 6 },
    requirements: { skill: 'armaduras_leves', level: 1 },
    is_tradeable: true, rarity: 'uncommon', base_value: 34, is_stackable: false },

  // Armadura pesada
  { slug: 'peitoral_placas', name: 'Peitoral de Placas', item_type: 'armor',
    description: 'Placas industriais rebitadas. Muita defesa, muito peso.',
    is_equippable: true, equipment_slot: 'chest', weight: 9.0,
    stats: { defense: 7, hp_max: 10 },
    requirements: { str_mg: 3, skill: 'armaduras_pesadas', level: 1 },
    is_tradeable: true, rarity: 'uncommon', base_value: 48, is_stackable: false },

  // Escudo
  { slug: 'escudo_madeira', name: 'Escudo de Madeira', item_type: 'armor',
    description: 'Tábuas reforçadas com um aro de ferro. Melhora o bloqueio.',
    is_equippable: true, equipment_slot: 'off_hand', weight: 2.5,
    stats: { defense: 2 }, requirements: {},
    is_tradeable: true, rarity: 'common', base_value: 10, is_stackable: false },

  // Acessórios (slot genérico 'accessory'; a rota resolve accessory_1/2)
  { slug: 'amuleto_osso', name: 'Amuleto de Osso', item_type: 'armor',
    description: 'Talismã tosco que dizem afastar a névoa. Talvez seja só superstição.',
    is_equippable: true, equipment_slot: 'accessory', weight: 0.2,
    stats: { mist_resistance: 3 }, requirements: {},
    is_tradeable: true, rarity: 'common', base_value: 9, is_stackable: false },
  { slug: 'anel_precisao', name: 'Anel de Precisão', item_type: 'armor',
    description: 'Anel de artesão que firma a mira.',
    is_equippable: true, equipment_slot: 'accessory', weight: 0.1,
    stats: { accuracy: 2, crit_chance: 1 }, requirements: {},
    is_tradeable: true, rarity: 'uncommon', base_value: 22, is_stackable: false },

  // Consumíveis
  { slug: 'pocao_cura', name: 'Poção de Cura', item_type: 'consumable',
    description: 'Elixir vermelho que fecha ferimentos. Restaura PV.',
    is_equippable: false, equipment_slot: null, weight: 0.3,
    stats: { heal: 30 }, requirements: {},
    is_tradeable: true, rarity: 'common', base_value: 10, is_stackable: true },
  { slug: 'frasco_veneno', name: 'Frasco de Veneno', item_type: 'consumable',
    description: 'Composto corrosivo para untar a lâmina. Consumido pela habilidade Ataque Envenenado.',
    is_equippable: false, equipment_slot: null, weight: 0.2,
    stats: {}, requirements: {},
    is_tradeable: true, rarity: 'common', base_value: 8, is_stackable: true },
  { slug: 'granada_quimica', name: 'Granada Química', item_type: 'consumable',
    description: 'Cápsula instável de névoa comprimida. Consumida pela habilidade Granada Química.',
    is_equippable: false, equipment_slot: null, weight: 0.5,
    stats: {}, requirements: {},
    is_tradeable: true, rarity: 'uncommon', base_value: 18, is_stackable: true },
  { slug: 'granada_gas', name: 'Granada de Gás', item_type: 'consumable',
    description: 'Dispersa um gás paralisante. Consumida pela habilidade Gás Paralisante.',
    is_equippable: false, equipment_slot: null, weight: 0.5,
    stats: {}, requirements: {},
    is_tradeable: true, rarity: 'uncommon', base_value: 20, is_stackable: true },

  // Recursos (drop de loot; matéria-prima para produção futura)
  { slug: 'sucata_metal', name: 'Sucata de Metal', item_type: 'resource',
    description: 'Fragmentos de metal enferrujado. Úteis para reparos e fabricação.',
    is_equippable: false, equipment_slot: null, weight: 0.4,
    stats: {}, requirements: {},
    is_tradeable: true, rarity: 'common', base_value: 2, is_stackable: true },
  { slug: 'essencia_nevoa', name: 'Essência de Névoa', item_type: 'resource',
    description: 'Um resíduo brilhante e frio deixado por criaturas corrompidas.',
    is_equippable: false, equipment_slot: null, weight: 0.1,
    stats: {}, requirements: {},
    is_tradeable: true, rarity: 'uncommon', base_value: 14, is_stackable: true },
];

async function main() {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
    console.error('Faltam SUPABASE_URL / SUPABASE_SERVICE_KEY no backend/.env.');
    process.exit(1);
  }

  console.log(`Semeando ${ITEMS.length} itens (upsert por slug)...`);
  const { data, error } = await supabase
    .from('items')
    .upsert(ITEMS, { onConflict: 'slug' })
    .select('slug');

  if (error) {
    console.error('Erro ao semear itens:', error.message);
    process.exit(1);
  }

  console.log(`OK: ${data.length} itens gravados.`);

  // Verificação de contagem por raridade.
  const { data: all } = await supabase.from('items').select('rarity');
  const byRarity = (all || []).reduce((acc, r) => {
    acc[r.rarity] = (acc[r.rarity] || 0) + 1;
    return acc;
  }, {});
  console.log('Itens por raridade no banco:', byRarity);
}

main();
