// Bestiário da região inicial — inimigos + bosses.
// Fonte: docs/md/bestiario-zona-inicial.md. REST-only, idempotente (upsert por slug).
// crit_damage guardado em % (ex.: 150), como no enemy_catalog existente.
//
// Uso (na pasta backend):
//   $env:NODE_EXTRA_CA_CERTS = "C:\Users\Roberval\.krakovia-certs\avast-root.pem"
//   node scripts/seed-bestiary-enemies.js

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

// Helper: e = enemy. attack_types e loot como arrays/jsonb.
function e(slug, name, level, hp, atk, def, spd, acc, eva, crit, mist, xp, types, rare, loot, description) {
  return {
    slug, name, level, hp_max: hp, attack: atk, defense: def, speed: spd,
    accuracy: acc, evasion: eva, crit_chance: crit, crit_damage: 150 + 0, // sobrescrito abaixo quando != 150
    mist_resistance: mist, xp_reward: xp, ai_profile: 'attacker_simple',
    attack_types: types, is_rare: rare, loot_table: loot, description,
    abilities: [],
  };
}
const L = (item_slug, chance, min, max) => ({ item_slug, chance, min, max });

// crit_damage custom por inimigo (quando != 150). Aplico depois para nao poluir o helper.
const CD = {}; // slug -> crit_damage%

// Perfil de IA e habilidades de inimigo (Sub-parte 3). Aplicados apos montar a lista.
// ai_profile: 'attacker_simple' (default) | 'defensive' | 'caster'.
// abilities: [{ slug, name, cooldown, effect }] resolvidas por combat.resolveEnemyAbility.
//   effect.type: 'scaled_attack' | 'attack_status' | 'self_heal' | 'self_buff'.
const AI = {
  // Casters (usam habilidade ~60% do turno quando fora de cooldown).
  farmaceutico_renegado: { ai_profile: 'caster', abilities: [
    { slug: 'jato_corrosivo', name: 'Jato Corrosivo', cooldown: 2,
      effect: { type: 'attack_status', mult: 1.2, status: { kind: 'poison', name: 'Veneno', turns: 3, damage: 8 }, statusChance: 0.8 } },
  ] },
  atirador_emboscado: { ai_profile: 'caster', abilities: [
    { slug: 'tiro_certeiro', name: 'Tiro Certeiro', cooldown: 2, effect: { type: 'scaled_attack', mult: 1.6 } },
  ] },
  vigia_ocular: { ai_profile: 'caster', abilities: [
    { slug: 'feixe_ocular', name: 'Feixe Ocular', cooldown: 2,
      effect: { type: 'attack_status', mult: 1.3, status: { kind: 'stun', name: 'Ofuscado', turns: 1 }, statusChance: 0.4 } },
  ] },
  aranha_da_teia_cinza: { ai_profile: 'caster', abilities: [
    { slug: 'picada_peconhenta', name: 'Picada Peçonhenta', cooldown: 2,
      effect: { type: 'attack_status', mult: 1.0, status: { kind: 'poison', name: 'Peçonha', turns: 3, damage: 5 }, statusChance: 0.7 } },
  ] },
  // Defensivos (assumem postura com HP baixo).
  desertor_da_legiao: { ai_profile: 'defensive', abilities: [] },
  colosso_enferrujado: { ai_profile: 'defensive', abilities: [] },
  urso_esfolado: { ai_profile: 'defensive', abilities: [] },

  // Bosses — cada um com um perfil e habilidade coerentes.
  boss_matriarca_dos_ratos: { ai_profile: 'defensive', abilities: [
    { slug: 'chamado_da_ninhada', name: 'Chamado da Ninhada', cooldown: 3, effect: { type: 'self_buff', mods: { attack_melee: 10, defense: 6 }, turns: 2 } },
  ] },
  boss_capataz_ferrugem: { ai_profile: 'defensive', abilities: [
    { slug: 'reforco_hidraulico', name: 'Reforço Hidráulico', cooldown: 3, effect: { type: 'self_buff', mods: { defense: 20 }, turns: 2 } },
  ] },
  boss_profeta_da_fumaca: { ai_profile: 'caster', abilities: [
    { slug: 'nuvem_da_fumaca', name: 'Nuvem da Fumaça', cooldown: 3,
      effect: { type: 'attack_status', mult: 1.4, status: { kind: 'poison', name: 'Fumaça', turns: 3, damage: 12 }, statusChance: 0.9 } },
    { slug: 'comunhao', name: 'Comunhão', cooldown: 4, effect: { type: 'self_heal', pct: 0.15, self: true } },
  ] },
  boss_alfa_da_alcateia: { ai_profile: 'caster', abilities: [
    { slug: 'investida_feroz', name: 'Investida Feroz', cooldown: 2, effect: { type: 'scaled_attack', mult: 1.9 } },
  ] },
  boss_coisa_da_borda: { ai_profile: 'caster', abilities: [
    { slug: 'toque_da_borda', name: 'Toque da Borda', cooldown: 3,
      effect: { type: 'attack_status', mult: 1.5, status: { kind: 'stun', name: 'Paralisia', turns: 1 }, statusChance: 0.5 } },
    { slug: 'regenerar', name: 'Regenerar', cooldown: 4, effect: { type: 'self_heal', pct: 0.12, self: true } },
  ] },
};

const ENEMIES = [
  // ── Fauna comum ─────────────────────────────────────────────────────
  e('rato_de_esgoto', 'Rato de Esgoto', 1, 30, 10, 2, 11, 13, 8, 4, 0, 12, ['quick'], false,
    [L('sucata_metal',0.3,1,1), L('osso_roido',0.25,1,1)],
    'Rato grande e sarnento dos canos de Ironfall, dentes amarelos e cauda pelada. Não é da névoa — é só fome e sujeira. Ataca em número.'),
  e('corvo_carnical', 'Corvo Carniçal', 1, 26, 11, 2, 15, 15, 12, 6, 0, 13, ['quick'], false,
    [L('pena_negra',0.5,1,2)],
    'Corvo grande de olhos vidrados que ronda os campos de cinza. Rápido, difícil de acertar, bica os olhos. Mau agouro nas histórias locais.'),
  e('cao_vira_lata_faminto', 'Cão Vira-Lata Faminto', 2, 48, 16, 5, 12, 14, 8, 5, 0, 18, ['quick','strong'], false,
    [L('pelugem_rasgada',0.4,1,1), L('dente_afiado',0.2,1,1)],
    'Cão de rua esquelético, pelo em tufos, rosnado constante. Anda em matilha pequena. Convencional — mas a fome o torna perigoso.'),
  e('javali_das_cinzas', 'Javali das Cinzas', 3, 82, 25, 12, 9, 13, 5, 5, 1, 26, ['quick','strong'], false,
    [L('couro_de_besta',0.5,1,1), L('carne_mutada',0.2,1,1)],
    'Javali corpulento coberto de cinza seca, presas tortas. Investe em linha reta e é difícil de derrubar. Carne dura, levemente alterada.'),
  e('corvo_de_tres_olhos', 'Corvo de Três Olhos', 3, 70, 24, 9, 16, 18, 14, 9, 2, 28, ['quick'], true,
    [L('pena_negra',0.6,1,2), L('cristal_opaco',0.05,1,1)],
    'Corvo raro com um terceiro olho leitoso na testa — primeiro sinal da borda da névoa na fauna. Prevê golpes; esquiva alto. Presságio entre os locais.'),

  // ── Fauna alterada leve ─────────────────────────────────────────────
  e('rato_da_bruma_alfa', 'Rato da Bruma Alfa', 2, 55, 19, 6, 13, 15, 9, 6, 2, 22, ['quick','strong'], true,
    [L('carne_mutada',0.3,1,1), L('dente_afiado',0.3,1,2), L('essencia_nevoa',0.15,1,1)],
    'O rato que cresceu demais — do tamanho de um cão, pelo em placas endurecidas e olhos que brilham fraco. Lidera ninhadas de rato_da_bruma.'),
  e('sabujo_da_borda', 'Sabujo da Borda', 4, 100, 31, 14, 15, 17, 10, 7, 3, 34, ['quick','strong'], false,
    [L('couro_de_besta',0.5,1,1), L('garra_curva',0.3,1,1), L('essencia_nevoa',0.2,1,1)],
    'Cão grande deformado pela exposição — costelas expostas, mandíbula aberta demais, pele com bolhas cristalizadas. Caça em dupla. Uiva antes de atacar.'),
  e('aranha_da_teia_cinza', 'Aranha da Teia Cinza', 4, 92, 30, 13, 17, 18, 15, 8, 2, 36, ['quick'], false,
    [L('frasco_veneno',0.25,1,1), L('pelugem_rasgada',0.3,1,1)],
    'Aranha do tamanho de um gato, abdômen inchado de fluido esverdeado. Tece nas ruínas de subúrbio. Peçonhenta.'),
  e('veado_espectral', 'Veado Espectral', 5, 125, 38, 18, 20, 19, 18, 9, 3, 44, ['quick','strong'], true,
    [L('couro_de_besta',0.5,1,2), L('cristal_opaco',0.08,1,1), L('essencia_nevoa',0.3,1,1)],
    'Cervo pálido, quase translúcido, com chifres que parecem galhos petrificados. Move-se rápido e some entre a névoa baixa. Belo e errado.'),
  e('urso_esfolado', 'Urso Esfolado', 6, 175, 52, 28, 11, 16, 6, 6, 3, 66, ['quick','strong'], false,
    [L('couro_de_besta',0.7,1,2), L('carne_mutada',0.4,1,2), L('garra_curva',0.4,1,1)],
    'Urso enorme cuja pele se soltou em partes, expondo músculo cristalizado. Lento, mas cada golpe derruba. Guarda território com fúria.'),
  e('enxame_de_mariposas', 'Enxame de Mariposas', 5, 110, 40, 14, 22, 20, 20, 10, 4, 46, ['quick'], false,
    [L('pelugem_rasgada',0.4,1,2), L('essencia_nevoa',0.25,1,1)],
    'Nuvem densa de mariposas cinzentas de asas com padrão de olho. Individualmente inofensivas; em enxame, cobrem o rosto e sufocam. Difícil de acertar.'),

  // ── Humanos ─────────────────────────────────────────────────────────
  e('saqueador_esfarrapado', 'Saqueador Esfarrapado', 2, 50, 17, 6, 12, 15, 9, 5, 1, 20, ['quick'], false,
    [L('faca_enferrujada',0.2,1,1), L('panos_imundos',0.4,1,1), L('moeda_antiga',0.3,1,3)],
    'Homem magro de casaco furado e faca cega, olhos nervosos. Rouba por necessidade, foge se puder. O primeiro humano hostil que o jogador encontra.'),
  e('bandido_de_estrada', 'Bandido de Estrada', 3, 78, 26, 11, 13, 16, 10, 6, 1, 27, ['quick','strong'], false,
    [L('faca_enferrujada',0.25,1,1), L('couro_de_besta',0.2,1,1), L('moeda_antiga',0.4,2,5)],
    'Salteador de couro remendado com um facão e um sorriso ruim. Trabalha em duplas nas passagens. Exige "pedágio" antes de atacar.'),
  e('atirador_emboscado', 'Atirador Emboscado', 4, 90, 33, 12, 16, 20, 12, 10, 1, 38, ['quick'], false,
    [L('pistola_ferrugem',0.15,1,1), L('fiacao_de_cobre',0.3,1,2), L('moeda_antiga',0.4,2,6)],
    'Bandido com uma pistola de tambor emperrado, escondido atrás de escombros. Acerta de longe, frágil no corpo a corpo. Alta precisão.'),
  e('desertor_da_legiao', 'Desertor da Legião', 5, 135, 42, 22, 13, 18, 9, 7, 2, 50, ['quick','strong'], false,
    [L('escudo_madeira',0.2,1,1), L('calcas_reforcadas',0.15,1,1), L('moeda_antiga',0.5,3,8)],
    'Ex-soldado da Legião dos Exilados em armadura de placas surrada, disciplina ainda visível nos golpes. Bloqueia bem. Amargurado, não fala muito.'),
  e('cultista_da_fumaca', 'Cultista da Fumaça', 5, 120, 40, 16, 15, 18, 12, 8, 6, 52, ['quick','strong'], false,
    [L('marca_da_fumaca',0.3,1,1), L('frasco_veneno',0.2,1,1), L('carne_mutada',0.25,1,1)],
    'Adepto iniciante da Irmandade da Fumaça Negra, rosto coberto por pano enegrecido, braço já começando a cristalizar. Busca a mutação de bom grado.'),
  e('saqueador_veterano', 'Saqueador Veterano', 6, 165, 50, 26, 14, 19, 11, 8, 2, 62, ['quick','strong'], false,
    [L('pistola_ferrugem',0.2,1,1), L('colete_couro',0.2,1,1), L('moeda_antiga',0.6,4,10)],
    'Chefe de bando curtido, cheio de cicatrizes, com uma arma decente roubada. Comanda saqueadores menores. Calculista.'),
  e('farmaceutico_renegado', 'Farmacêutico Renegado', 7, 190, 58, 30, 16, 21, 13, 9, 4, 78, ['quick','strong'], true,
    [L('granada_quimica',0.2,1,1), L('frasco_veneno',0.4,1,2), L('pocao_cura',0.3,1,1)],
    'Ex-alquimista do Conclave expulso por experimentos proibidos, avental manchado e frascos ao cinto. Joga compostos corrosivos. Perigoso à distância.'),

  // ── Autômatos ───────────────────────────────────────────────────────
  e('sentinela_tombada', 'Sentinela Tombada', 3, 85, 24, 16, 7, 14, 3, 4, 0, 28, ['strong'], false,
    [L('engrenagem_enferrujada',0.6,1,2), L('sucata_metal',0.7,2,4)],
    'Torreta bípede caída de lado, ainda girando o torso para mirar. Lenta e sem evasão, mas o golpe é pesado. Range metálico a cada movimento.'),
  e('automato_de_carga', 'Autômato de Carga', 5, 150, 39, 26, 8, 15, 3, 4, 0, 48, ['quick','strong'], false,
    [L('engrenagem_enferrujada',0.5,1,2), L('oleo_espesso',0.4,1,2), L('sucata_metal',0.8,2,5)],
    'Autômato industrial de transporte, braços hidráulicos que ainda esmagam. Blindado e lento. Cumpre uma rota de entrega que não existe mais.'),
  e('vigia_ocular', 'Vigia Ocular', 6, 145, 48, 22, 17, 22, 10, 11, 0, 60, ['quick'], false,
    [L('fiacao_de_cobre',0.5,1,2), L('nucleo_apagado',0.15,1,1), L('sucata_metal',0.6,1,3)],
    'Esfera flutuante presa a um trilho quebrado, lente vermelha que ainda varre a área. Dispara feixes curtos e certeiros. Alta precisão, frágil.'),
  e('colosso_enferrujado', 'Colosso Enferrujado', 8, 250, 70, 44, 7, 17, 3, 5, 0, 110, ['strong'], true,
    [L('nucleo_apagado',0.4,1,1), L('engrenagem_enferrujada',0.7,2,4), L('sucata_metal',0.9,3,6)],
    'Autômato de assédio do tamanho de uma casa, meio soterrado, um braço-canhão travado. Um único passo faz o chão tremer. Devastador, lentíssimo.'),
  e('coletor_de_sucata', 'Coletor de Sucata', 4, 98, 30, 20, 10, 15, 5, 4, 0, 36, ['quick'], false,
    [L('sucata_metal',0.9,3,6), L('engrenagem_enferrujada',0.5,1,2), L('moeda_antiga',0.2,1,4)],
    'Pequeno autômato de faxina que ainda "recolhe" tudo que se mexe, incluindo pessoas. Braços de pinça. Cheio de sucata acumulada.'),

  // ── Mutados leves ───────────────────────────────────────────────────
  e('homem_da_bruma', 'Homem da Bruma', 4, 105, 32, 15, 14, 16, 11, 6, 7, 40, ['quick','strong'], false,
    [L('carne_mutada',0.4,1,2), L('panos_imundos',0.3,1,1), L('cristal_opaco',0.08,1,1)],
    'O que sobra de um Vagante que não voltou a tempo: pele acinzentada, olhos brancos, movimentos hesitantes. Ainda veste farrapos. Melancólico e hostil.'),
  e('carne_reptante', 'Carne Reptante', 5, 130, 41, 17, 10, 15, 7, 6, 8, 50, ['quick'], false,
    [L('carne_mutada',0.6,1,3), L('cristal_opaco',0.1,1,1), L('essencia_nevoa',0.3,1,2)],
    'Massa de tecido fundido que já foi mais de um animal, rastejando sobre membros a mais. Lenta, resiliente, repugnante. Cresce onde a névoa toca.'),
  e('cultista_transfigurado', 'Cultista Transfigurado', 7, 200, 60, 30, 15, 19, 12, 9, 12, 82, ['quick','strong'], true,
    [L('marca_da_fumaca',0.5,1,1), L('cristal_opaco',0.2,1,1), L('carne_mutada',0.4,1,2)],
    'Cultista da Fumaça Negra em estágio avançado — braço virou garra cristalina, meio rosto endurecido. Orgulhoso da transformação. Fanático e forte.'),
  e('aberracao_de_veu_fino', 'Aberração de Véu Fino', 8, 235, 68, 34, 18, 20, 15, 10, 15, 105, ['quick','strong'], true,
    [L('cristal_opaco',0.3,1,2), L('essencia_nevoa',0.5,1,3), L('carne_mutada',0.5,1,2)],
    'Criatura sem forma fixa que só existe direito perto da borda — bordas que tremeluzem, membros que aparecem e somem. O primeiro monstro que parece "de verdade" da névoa.'),
  e('ninho_ambulante', 'Ninho Ambulante', 9, 300, 82, 40, 12, 19, 8, 8, 14, 145, ['quick','strong'], true,
    [L('carne_mutada',0.7,2,4), L('cristal_opaco',0.3,1,2), L('essencia_nevoa',0.6,2,4)],
    'Hospedeiro mutado coberto de casulos que pulsam; solta crias menores. Lento, altíssimo HP.'),

  // ── Bosses (nv10) ───────────────────────────────────────────────────
  e('boss_matriarca_dos_ratos', 'A Mãe dos Canos', 10, 400, 96, 56, 16, 22, 10, 8, 5, 210, ['quick','strong'], true,
    [L('presa_da_matriarca',0.35,1,1), L('couro_de_besta',1.0,2,3), L('essencia_nevoa',0.8,2,4), L('dente_afiado',1.0,3,5), L('colete_couro',0.5,1,1), L('cristal_opaco',0.3,1,1)],
    'Rata monstruosa do tamanho de um cavalo, ventre inchado, dezenas de filhotes agarrados ao dorso. Rainha dos esgotos e ruínas de Ironfall.'),
  e('boss_capataz_ferrugem', 'O Capataz', 10, 520, 100, 75, 8, 18, 3, 5, 0, 240, ['strong'], true,
    [L('martelo_do_capataz',0.35,1,1), L('nucleo_apagado',1.0,1,2), L('engrenagem_enferrujada',1.0,3,6), L('sucata_metal',1.0,5,10), L('oleo_espesso',0.8,2,4), L('escudo_madeira',0.4,1,1)],
    'O maior autômato de guarda da região, um capataz de fábrica pré-Cataclisma que nunca desligou. Blindagem grossa, martelo hidráulico. Lento, quase imbatível de frente — mas burro.'),
  e('boss_profeta_da_fumaca', 'O Primeiro Convertido', 10, 430, 104, 52, 17, 22, 14, 11, 20, 260, ['quick','strong'], true,
    [L('cutelo_ritual',0.35,1,1), L('marca_da_fumaca',1.0,1,1), L('cristal_opaco',0.6,1,2), L('carne_mutada',0.8,2,3), L('granada_quimica',0.4,1,2), L('frasco_veneno',0.5,1,2)],
    'Líder da célula da Irmandade da Fumaça Negra em Ironfall; meio corpo já cristalizado, voz dupla. Prega a mutação como salvação.'),
  e('boss_alfa_da_alcateia', 'Presságio', 10, 390, 110, 50, 24, 24, 20, 14, 8, 250, ['quick','strong'], true,
    [L('rifle_do_cacador',0.35,1,1), L('couro_de_besta',1.0,2,4), L('garra_curva',1.0,2,3), L('cristal_opaco',0.4,1,1), L('essencia_nevoa',0.7,2,4)],
    'O maior dos sabujos da borda, líder de alcateia, pelo branco de cinza e olhos que brilham. Rápido e letal, ataca em investidas.'),
  e('boss_coisa_da_borda', 'O Que Espia de Volta', 10, 470, 106, 58, 19, 21, 16, 10, 25, 300, ['quick','strong'], true,
    [L('projetor_de_esporos',0.35,1,1), L('cristal_opaco',1.0,2,3), L('essencia_nevoa',1.0,3,5), L('carne_mutada',0.8,2,4), L('nucleo_apagado',0.2,1,1)],
    'A aberração mais forte que ousa chegar à borda — massa instável de carne, olhos e cristal que parece observar o jogador antes de atacar. O boss que anuncia a Primeira Camada.'),
];

// crit_damage custom (bosses com valores diferentes de 150).
Object.assign(CD, {
  javali_das_cinzas: 155, corvo_de_tres_olhos: 155, sabujo_da_borda: 155,
  aranha_da_teia_cinza: 155, veado_espectral: 160, urso_esfolado: 160,
  enxame_de_mariposas: 155, atirador_emboscado: 160, desertor_da_legiao: 160,
  cultista_da_fumaca: 160, saqueador_veterano: 160, farmaceutico_renegado: 165,
  vigia_ocular: 165, colosso_enferrujado: 160, homem_da_bruma: 155,
  carne_reptante: 155, cultista_transfigurado: 165, aberracao_de_veu_fino: 165,
  ninho_ambulante: 165,
  boss_matriarca_dos_ratos: 170, boss_capataz_ferrugem: 165, boss_profeta_da_fumaca: 175,
  boss_alfa_da_alcateia: 180, boss_coisa_da_borda: 175,
});
for (const en of ENEMIES) { if (CD[en.slug]) en.crit_damage = CD[en.slug]; }
// Aplica perfis de IA e habilidades de inimigo (Sub-parte 3).
for (const en of ENEMIES) {
  const cfg = AI[en.slug];
  if (cfg) {
    if (cfg.ai_profile) en.ai_profile = cfg.ai_profile;
    if (cfg.abilities) en.abilities = cfg.abilities;
  }
}

async function main() {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
    console.error('Faltam SUPABASE_URL / SUPABASE_SERVICE_KEY no backend/.env.');
    process.exit(1);
  }
  console.log(`Semeando ${ENEMIES.length} inimigos do bestiário (upsert por slug)...`);
  const { data, error } = await supabase.from('enemy_catalog').upsert(ENEMIES, { onConflict: 'slug' }).select('slug, level, is_rare');
  if (error) { console.error('Erro:', error.message); process.exit(1); }
  console.log(`OK: ${data.length} inimigos gravados.`);
  const bosses = data.filter((d) => d.slug.startsWith('boss_'));
  console.log(`Bosses (nv10): ${bosses.length} -> ${bosses.map((b) => b.slug).join(', ')}`);
  const byLevel = data.reduce((a, r) => { a[r.level] = (a[r.level] || 0) + 1; return a; }, {});
  console.log('Por nível:', byLevel);
}
main();
