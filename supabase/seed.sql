-- ─── Seed — Mists of Krakóvia ─────────────────────────────────────────
-- Dados iniciais do mundo (idempotentes). Aplicado por `supabase db reset`
-- (local) e executável no remoto quando necessário.
-- ──────────────────────────────────────────────────────────────────────

-- Catálogo de Perícias (Volume III). Perícia != Habilidade de classe.
-- base_attr: strength|agility|resistance|intellect|perception|sanity
-- attr_mg_req: requisito de Modificador Grande (letra) do atributo base (0 = nenhum)
-- description: fiel ao Volume III.
INSERT INTO "public"."skills_catalog"
  ("slug","name","skill_type","base_attr","base_attr_alt","requires_training","attr_mg_req","sort_order","description")
VALUES
  -- Perícias de Campo (11)
  ('engenharia','Engenharia','field','intellect',NULL,false,0,10,
   'Projeto, construção, reparo e modificação de dispositivos mecânicos e elétricos: máquinas a vapor, artilharia, fechaduras industriais e autômatos. Conserta equipamento, monta armadilhas e constrói estruturas improvisadas.'),
  ('alquimia','Alquimia','field','intellect',NULL,true,0,11,
   'Criação de substâncias químicas e manipulação de Ætherium bruto: venenos, antídotos, granadas, gases de névoa, estimulantes. A qualidade depende dos ingredientes. Requer treinamento mínimo.'),
  ('medicina','Medicina','field','intellect',NULL,true,0,12,
   'Tratamento de ferimentos, doenças e exposição à névoa: primeiros socorros avançados, cirurgia de campo, remoção de Ætherium, próteses. Requer treinamento mínimo.'),
  ('sobrevivencia','Sobrevivência','field','resistance',NULL,false,0,13,
   'Operação em ambientes hostis sem suporte: forragear, montar acampamento na névoa, rastrear, navegar sem bússola e identificar perigos ambientais antes de enfrentá-los.'),
  ('furtividade','Furtividade','field','agility',NULL,false,0,14,
   'Movimento sem detecção visual ou auditiva: marcha silenciosa, ocultação em sombras e névoa, seguir alvos e infiltrar posições vigiadas. Em combate, potencializa ataques surpresa.'),
  ('negociacao','Negociação','field','perception',NULL,false,0,15,
   'Persuasão, intimidação, barganha e leitura de intenções: obter informação de NPCs relutantes, fechar bons acordos, acalmar tensões e identificar mentiras.'),
  ('investigacao','Investigação','field','perception',NULL,false,0,16,
   'Detecção e análise ativa de detalhes: encontrar pistas ocultas, decifrar documentos danificados, identificar armadilhas e reconstruir eventos por evidências. Complementa a Observação.'),
  ('religiao','Religião','field','sanity',NULL,false,0,17,
   'Doutrinas, rituais e hierarquia da Igreja do Véu Prateado e dos cultos: interpretar textos sagrados, identificar relíquias, realizar rituais de purificação e detectar influência do Ætherium.'),
  ('destreza_manual','Destreza Manual','field','agility',NULL,false,0,18,
   'Precisão em tarefas físicas finas: arrombar fechaduras, desarmar armadilhas, abrir cofres e mecanismos, e ajustar equipamento delicado em condições adversas.'),
  ('arqueologia','Arqueologia','field','perception',NULL,false,0,19,
   'Identificação, datação e interpretação de artefatos e ruínas pré-Cataclisma: reconhecer objetos krakovianos, datar estruturas, decifrar inscrições e prever instabilidade estrutural.'),
  ('lideranca','Liderança','field','perception',NULL,false,0,20,
   'Coordenação de grupos, moral e organização tática: emboscadas e formações, manter a moral em situações críticas e gerenciar reputação com facções em nome de um grupo.'),

  -- Perícias de Combate (11)
  ('armas_brancas_leves','Armas Brancas Leves','combat','agility',NULL,false,2,30,
   'Facas, adagas, espadas curtas, machados de mão e cacetes. Armas rápidas e de baixa manutenção, eficazes em espaços fechados. Priorizam velocidade sobre dano bruto.'),
  ('armas_brancas_pesadas','Armas Brancas Pesadas','combat','strength',NULL,false,3,31,
   'Espadas longas, machados de duas mãos, maças, lanças e alabardas. Exigem força e espaço para manejar. Alto dano, baixa velocidade.'),
  ('armas_fogo_leves','Armas de Fogo Leves','combat','perception',NULL,false,2,33,
   'Pistolas, revólveres e espingardas de cano curto. Alta mobilidade, recarga rápida e alcance médio. Eficazes em combate próximo à distância.'),
  ('armas_fogo_pesadas','Armas de Fogo Pesadas','combat','perception',NULL,false,3,34,
   'Rifles de precisão, espingardas de combate e carabinas industriais. Exigem posicionamento e preparação. Alto dano à distância.'),
  ('artilharia_campo','Artilharia de Campo','combat','intellect','strength',false,3,35,
   'Canhões portáteis, morteiros de vapor e lançadores de pressão. Equipamento pesado de dano em área, com tempo de preparação elevado.'),
  ('dispositivos_combate','Dispositivos de Combate','combat','intellect',NULL,false,2,36,
   'Granadas químicas, bombas de vapor, armadilhas ativadas em combate e lançadores de névoa. Fabricados com Alquimia ou Engenharia; esta perícia define a eficiência de uso.'),
  ('armaduras_leves','Armaduras Leves','combat','agility',NULL,false,0,37,
   'Roupas reforçadas, couro tratado e coletes de malha. Baixa penalidade de evasão e custo. Inclui trajes de proteção contra névoa de menor grau.'),
  ('armaduras_pesadas','Armaduras Pesadas','combat','resistance',NULL,false,3,38,
   'Couraças, armaduras de placas industriais e trajes blindados. Alta defesa, com penalidade significativa de evasão e velocidade. Inclui trajes de alto grau contra névoa.'),
  ('escudos_bloqueio','Escudos e Bloqueio','combat','resistance',NULL,false,2,39,
   'Escudos improvisados, anteparos metálicos e coberturas portáteis. Define a eficácia da ação de Bloqueio: quanto dano é mitigado e a chance de bloqueio completo.'),
  ('medicina_combate','Medicina de Combate','combat','intellect',NULL,false,2,40,
   'Uso de kits médicos, estimulantes e estabilização em batalha. Sem ela, usar um kit em combate consome a ação inteira e restaura metade; com ela, cresce a eficiência.'),
  ('combate_desarmado','Combate Desarmado','combat','agility','strength',false,0,41,
   'Socos, chutes, agarramentos e luta corpo a corpo sem arma. Menos dano que armas dedicadas, mas sempre disponível. Níveis altos incluem imobilizações e arremessos.')
ON CONFLICT ("slug") DO UPDATE SET
  "name"              = EXCLUDED."name",
  "skill_type"        = EXCLUDED."skill_type",
  "base_attr"         = EXCLUDED."base_attr",
  "base_attr_alt"     = EXCLUDED."base_attr_alt",
  "requires_training" = EXCLUDED."requires_training",
  "attr_mg_req"       = EXCLUDED."attr_mg_req",
  "sort_order"        = EXCLUDED."sort_order",
  "description"       = EXCLUDED."description";

-- Garante que a perícia industrial não permaneça no catálogo.
DELETE FROM "public"."skills_catalog" WHERE "slug" = 'armas_brancas_industriais';

-- ─── Spec 2 — Combate: catálogo de inimigos iniciais ──────────────────
-- Monstros do primeiro mapa (região de Ironfall). XP inicial 15-25.
-- Atributos deliberadamente modestos (inimigos "só atacar", IA simples).
-- Balanceamento fino será feito caso a caso conforme o bestiário crescer.
-- Referência de derivados: docs/mists_of_krakovia_gameplay_v1.pdf (Volume III).
INSERT INTO "public"."enemy_catalog"
  ("slug","name","level","hp_max","attack","defense","speed","accuracy","evasion",
   "crit_chance","crit_damage","mist_resistance","xp_reward","ai_profile",
   "attack_types","is_rare","description")
VALUES
  -- Rebalanceados (ajuste pós-teste): mais HP/ataque e velocidade alta o
  -- suficiente para NÃO conceder ação dupla automática ao jogador inicial.
  ('rato_da_bruma','Rato da Bruma',1,34,12,3,12,14,9,
   4,150,0,15,'attacker_simple','["quick"]',false,
   'Roedor mutado pela névoa, rápido e covarde. Ataca em rajadas curtas. O primeiro perigo que qualquer errante encontra fora dos muros de Ironfall.'),
  ('vagante_corrompido','Vagante Corrompido',2,52,18,7,13,16,7,
   6,150,2,20,'attacker_simple','["quick","strong"]',false,
   'Um explorador que ficou tempo demais na névoa. Ainda empunha a arma que trouxe, mas já não há mente por trás dos golpes.'),
  ('sabujo_de_ferro','Sabujo de Ferro',3,80,26,12,14,17,5,
   8,160,3,25,'attacker_simple','["quick","strong"]',false,
   'Autômato de guarda pré-Cataclisma, meio enferrujado, ainda cumprindo uma ordem esquecida. Golpes pesados e implacáveis.')
ON CONFLICT ("slug") DO UPDATE SET
  "name"            = EXCLUDED."name",
  "level"           = EXCLUDED."level",
  "hp_max"          = EXCLUDED."hp_max",
  "attack"          = EXCLUDED."attack",
  "defense"         = EXCLUDED."defense",
  "speed"           = EXCLUDED."speed",
  "accuracy"        = EXCLUDED."accuracy",
  "evasion"         = EXCLUDED."evasion",
  "crit_chance"     = EXCLUDED."crit_chance",
  "crit_damage"     = EXCLUDED."crit_damage",
  "mist_resistance" = EXCLUDED."mist_resistance",
  "xp_reward"       = EXCLUDED."xp_reward",
  "ai_profile"      = EXCLUDED."ai_profile",
  "attack_types"    = EXCLUDED."attack_types",
  "is_rare"         = EXCLUDED."is_rare",
  "description"     = EXCLUDED."description";

-- ─── Spec 2 — Combate: spawns nos nós iniciais ────────────────────────
-- Os nós do mundo são criados no remoto (não versionados como dados), então
-- associamos os spawns por TIPO de nó, não por UUID fixo. Assim o seed é
-- idempotente e funciona contra qualquer conjunto de nós existente.
-- Regra inicial: campos (field) e passagens (passage) da região de Ironfall
-- podem gerar os monstros iniciais. Idempotência garantida pela limpeza prévia.
DELETE FROM "public"."node_spawns"
  WHERE "enemy_slug" IN ('rato_da_bruma','vagante_corrompido','sabujo_de_ferro');

-- Rato da Bruma: comum em campos (peso alto).
INSERT INTO "public"."node_spawns" ("node_id","enemy_slug","spawn_type","weight","min_count","max_count")
SELECT "id",'rato_da_bruma','random',120,1,1
  FROM "public"."world_nodes" WHERE "node_type" IN ('field','passage');

-- Vagante Corrompido: menos comum, campos e névoa.
INSERT INTO "public"."node_spawns" ("node_id","enemy_slug","spawn_type","weight","min_count","max_count")
SELECT "id",'vagante_corrompido','random',60,1,1
  FROM "public"."world_nodes" WHERE "node_type" IN ('field','mist');

-- Sabujo de Ferro: raro nos campos iniciais, mais presente em névoa.
INSERT INTO "public"."node_spawns" ("node_id","enemy_slug","spawn_type","weight","min_count","max_count")
SELECT "id",'sabujo_de_ferro','random',30,1,1
  FROM "public"."world_nodes" WHERE "node_type" IN ('field','mist');

-- ─── Spec 2 — Sub-parte B: catálogo de habilidades de classe (nv1-3) ──────
-- Volume V. Habilidades ativas (com cooldown) e passivas de nível 1-3.
-- O campo effect.type é despachado pelo motor (services/abilities.js).
-- Habilidades que consomem item funcionam sem checar inventário por ora.
INSERT INTO "public"."abilities_catalog"
  ("slug","class_key","name","kind","unlock_level","req_skill","req_skill_level",
   "cooldown_base","is_ultimate","is_passive","target","effect","description","sort_order")
VALUES
  -- ── Vagante das Névoas ──────────────────────────────────────────────
  ('navalha_veloz','vagante_nevoas','Navalha Veloz','offensive',1,'armas_brancas_leves',1,
   3,false,false,'enemy',
   '{"type":"multi_attack","hits":2,"secondRatio":0.7,"secondCritBonus":10}',
   'Dois golpes rápidos com arma leve. O segundo aproveita a abertura do primeiro.',10),
  ('passo_silencioso','vagante_nevoas','Passo Silencioso','mobility',1,NULL,0,
   3,false,false,'self',
   '{"type":"stealth","evasionBonus":30,"turns":2}',
   'Movimento furtivo: entra em estado de esquiva elevada e prepara uma emboscada.',11),
  ('emboscada','vagante_nevoas','Emboscada','offensive',3,'armas_brancas_leves',3,
   4,false,false,'enemy',
   '{"type":"heavy_attack","damageMult":2.0,"ignoreDefense":0.3,"requiresStealth":true}',
   'Ataque devastador a partir de posição furtiva. Requer estar em furtividade.',12),

  -- ── Arauto do Conclave ──────────────────────────────────────────────
  ('granada_quimica','arauto_conclave','Granada Química','offensive',1,'dispositivos_combate',1,
   3,false,false,'enemy',
   '{"type":"scaled_attack","attr":"intellect","mult":2.5,"req_item":"granada_quimica","applies":[{"kind":"buff","name":"Exposição","mods":{},"turns":3}]}',
   'Granada de dano em área com composto de névoa. Exige e consome granada_quimica.',20),
  ('armadilha_pressao','arauto_conclave','Armadilha de Pressão','control',1,'engenharia',0,
   2,false,false,'enemy',
   '{"type":"scaled_attack","attr":"intellect","mult":3,"applies":[{"kind":"buff","name":"Lentidão","mods":{"speed":-5},"turns":2}]}',
   'Implanta uma armadilha que detona no inimigo, reduzindo sua velocidade.',21),
  ('tiro_de_precisao','arauto_conclave','Tiro de Precisão','offensive',3,'armas_fogo_leves',2,
   4,false,false,'enemy',
   '{"type":"attack_effect","damageMult":1.3,"ranged":true,"status":{"kind":"stun","name":"Derrubado","turns":1}}',
   'Disparo calculado que derruba o alvo por um turno.',22),

  -- ── Exilado de Ferro ────────────────────────────────────────────────
  ('golpe_pesado','exilado_ferro','Golpe Pesado','offensive',1,NULL,0,
   3,false,false,'enemy',
   '{"type":"heavy_attack","damageMult":2.2,"ignoreDefense":0.25,"attrBonus":"strength","speedPenalty":3}',
   'Golpe único devastador que ignora parte da defesa. Reduz sua velocidade.',30),
  ('provocacao','exilado_ferro','Provocação','control',1,NULL,0,
   4,false,false,'self',
   '{"type":"self_buff","mods":{"defense":10},"turns":2,"taunt":true}',
   'Grito de guerra: força inimigos a focar em você e aumenta sua defesa.',31),
  ('golpe_de_escudo','exilado_ferro','Golpe de Escudo','offensive',3,'escudos_bloqueio',3,
   4,false,false,'enemy',
   '{"type":"attack_effect","damageMult":1.0,"attrBonus":"strength","status":{"kind":"stun","name":"Atordoado","turns":1}}',
   'Golpe com o escudo que causa dano e atordoa o alvo por um turno.',32),

  -- ── Confessor do Véu ────────────────────────────────────────────────
  ('ataque_envenenado','confessor_veu','Ataque Envenenado','offensive',1,NULL,0,
   3,false,false,'enemy',
   '{"type":"poison_attack","attr":"intellect","poisonMult":1.5,"turns":3,"req_item":"frasco_veneno"}',
   'Aplica veneno na arma: dano imediato + dano contínuo por 3 turnos. Exige e consome frasco_veneno.',40),
  ('pocao_em_area','confessor_veu','Poção em Área','support',1,'medicina_combate',1,
   3,false,false,'self',
   '{"type":"heal","attr":"intellect","mult":4,"req_item":"pocao_cura"}',
   'Cura em área. Sozinho, cura a si mesmo. Exige e consome pocao_cura.',41),
  ('gas_paralisante','confessor_veu','Gás Paralisante','control',3,NULL,0,
   4,false,false,'enemy',
   '{"type":"attack_effect","damageMult":1.0,"attr":"intellect","attrMult":2,"req_item":"granada_gas","status":{"kind":"stun","name":"Paralisado","turns":1}}',
   'Composto que causa dano e paralisa o alvo por um turno. Exige e consome granada_gas.',42),

  -- ── Cronista das Ruínas ─────────────────────────────────────────────
  ('tiro_rapido','cronista_ruinas','Tiro Rápido','offensive',1,'armas_fogo_leves',1,
   2,false,false,'enemy',
   '{"type":"simple_attack","damageMult":0.9,"accuracyBonus":10,"ranged":true}',
   'Disparo rápido, levemente mais fraco mas com maior chance de acerto.',50),
  ('ponto_fraco','cronista_ruinas','Ponto Fraco','offensive',1,NULL,0,
   3,false,false,'self',
   '{"type":"next_attack_buff","damageMult":1.3,"ignoreDefense":0.2}',
   'Marca a vulnerabilidade do alvo: o próximo ataque causa mais dano e ignora parte da defesa.',51),
  ('improviso_tatico','cronista_ruinas','Improviso Tático','offensive',3,NULL,0,
   4,false,false,'enemy',
   '{"type":"attack_effect","damageMult":1.0,"attr":"perception","attrMult":2,"status":{"kind":"stun","name":"Atordoado","turns":1},"statusChance":0.5,"ranged":true}',
   'Usa o ambiente como arma: dano e chance de atordoar.',52),

  -- ── Passivas de combate nv1 (efeito mecânico) ───────────────────────
  ('lamina_afiada','vagante_nevoas','Lâmina Afiada','passive',1,NULL,0,
   0,false,true,'none',
   '{"type":"passive","mods":{"crit_chance":8}}',
   'Armas leves são mais letais nas suas mãos: +8% de chance de crítico.',60),
  ('precisao_natural','cronista_ruinas','Precisão Natural','passive',1,NULL,0,
   0,false,true,'none',
   '{"type":"passive","mods":{"crit_chance":5,"accuracy":3}}',
   'Pensa antes de agir: +5% crítico e +acerto.',61),
  ('pele_de_aco','exilado_ferro','Pele de Aço','passive',1,NULL,0,
   0,false,true,'none',
   '{"type":"passive_defense_res","factor":0.5}',
   'Anos de armadura endureceram o corpo: defesa passiva adicional (MP_RES x 0.5).',62),
  ('maos_que_curam','confessor_veu','Mãos que Curam','passive',1,NULL,0,
   0,false,true,'none',
   '{"type":"passive_heal_bonus","pct":0.4}',
   'Poções e kits rendem +40% de cura nas suas mãos.',63),
  ('olhos_de_engenheiro','arauto_conclave','Olhos de Engenheiro','passive',1,NULL,0,
   0,false,true,'none',
   '{"type":"passive_info"}',
   'Vê mecanismos e dispositivos onde outros veem ruínas. (Preparado; efeito de exploração futuro.)',64),

  -- ── Passivas de nv1 com gatilho (implementadas onde possível) ───────
  ('instinto_de_fuga','vagante_nevoas','Instinto de Fuga','passive',1,NULL,0,
   0,false,true,'none',
   '{"type":"passive_trigger_lowhp","hpThreshold":0.3,"mods":{"evasion":10,"speed":2}}',
   'Com PV baixo (<30%), velocidade e evasão aumentam automaticamente.',65),
  ('veterano_de_campo','exilado_ferro','Veterano de Campo','passive',1,NULL,0,
   0,false,true,'none',
   '{"type":"passive_trigger_lowhp_heal","hpThreshold":0.15,"healPct":0.10}',
   'Com PV crítico (<15%), recupera 10% do PV máximo uma vez por combate.',66),
  ('olhar_clinico','cronista_ruinas','Olhar Clínico','passive',1,NULL,0,
   0,false,true,'none',
   '{"type":"passive_reveal"}',
   'No início do combate, revela os atributos dos inimigos. (Preparado.)',67)
ON CONFLICT ("slug") DO UPDATE SET
  "class_key"       = EXCLUDED."class_key",
  "name"            = EXCLUDED."name",
  "kind"            = EXCLUDED."kind",
  "unlock_level"    = EXCLUDED."unlock_level",
  "req_skill"       = EXCLUDED."req_skill",
  "req_skill_level" = EXCLUDED."req_skill_level",
  "cooldown_base"   = EXCLUDED."cooldown_base",
  "is_ultimate"     = EXCLUDED."is_ultimate",
  "is_passive"      = EXCLUDED."is_passive",
  "target"          = EXCLUDED."target",
  "effect"          = EXCLUDED."effect",
  "description"     = EXCLUDED."description",
  "sort_order"      = EXCLUDED."sort_order";

-- ─── Spec 3 — Inventário: catálogo de itens iniciais (MVP) ────────────────
-- Ver .kiro/specs/inventario/design.md §1.1. Apenas raridades common/uncommon.
-- Convenções:
--   stats (jsonb): bônus DIRETO a derivados (chaves = colunas de character_derived).
--     Equipamento normal SÓ SOMA (nunca reduz; reduções são de itens Corrompidos 🔮).
--   requirements (jsonb): { "str_mg": N } (Modificador Grande mínimo) e/ou
--     { "skill": "<slug>", "level": N } (perícia mínima).
--   is_stackable: consumíveis e recursos = true; equipáveis = false.
--   equipment_slot p/ acessório = 'accessory' (a rota de equipar resolve
--     accessory_1/accessory_2). Armas em 'main_hand'; escudo em 'off_hand'.
--   base_value: valor base para economia futura (sem compra/venda agora).
INSERT INTO "public"."items"
  ("slug","name","item_type","description","is_equippable","equipment_slot",
   "weight","stats","requirements","is_tradeable","rarity","base_value",
   "is_stackable")
VALUES
  -- ── Armas brancas leves (AGI / armas_brancas_leves) ──────────────────
  ('faca_enferrujada','Faca Enferrujada','weapon',
   'Uma lâmina curta e gasta, mas ainda corta. O primeiro recurso de quem sai dos muros.',
   true,'main_hand',0.6,
   '{"attack_melee":3,"accuracy":1}','{}',true,'common',5,false),
  ('adaga_afiada','Adaga Afiada','weapon',
   'Bem cuidada e balanceada. Rápida nas mãos certas.',
   true,'main_hand',0.7,
   '{"attack_melee":5,"accuracy":2,"crit_chance":2}',
   '{"skill":"armas_brancas_leves","level":1}',true,'uncommon',24,false),

  -- ── Armas brancas pesadas (FOR / armas_brancas_pesadas) ──────────────
  ('marreta_industrial','Marreta Industrial','weapon',
   'Peso bruto de aço. Lenta, mas cada golpe conta.',
   true,'main_hand',3.2,
   '{"attack_melee":8}','{"str_mg":3,"skill":"armas_brancas_pesadas","level":1}',
   true,'uncommon',30,false),

  -- ── Armas de fogo leves (PER / armas_fogo_leves) ─────────────────────
  ('pistola_ferrugem','Pistola Enferrujada','weapon',
   'Revólver velho de tambor emperrado. Ainda dispara, na maioria das vezes.',
   true,'main_hand',1.1,
   '{"attack_ranged":4,"accuracy":1}','{}',true,'common',8,false),
  ('revolver_guarda','Revólver da Guarda','weapon',
   'Arma padrão da Guarda de Ironfall. Confiável e precisa.',
   true,'main_hand',1.2,
   '{"attack_ranged":6,"accuracy":3}','{"skill":"armas_fogo_leves","level":1}',
   true,'uncommon',28,false),

  -- ── Armaduras leves (AGI / armaduras_leves) por slot ─────────────────
  ('capuz_couro','Capuz de Couro','armor',
   'Couro tratado que cobre a cabeça. Proteção modesta, pouco peso.',
   true,'head',0.5,
   '{"defense":1}','{}',true,'common',6,false),
  ('colete_couro','Colete de Couro','armor',
   'Peitoral de couro reforçado. Básico, mas segura um golpe.',
   true,'chest',2.0,
   '{"defense":2,"hp_max":3}','{}',true,'common',12,false),
  ('luvas_couro','Luvas de Couro','armor',
   'Protegem as mãos sem atrapalhar o punho.',
   true,'hands',0.3,
   '{"defense":1}','{}',true,'common',5,false),
  ('calcas_reforcadas','Calças Reforçadas','armor',
   'Tecido grosso com placas de couro nas coxas.',
   true,'legs',1.0,
   '{"defense":1}','{}',true,'common',7,false),
  ('colete_malha','Colete de Malha','armor',
   'Malha metálica leve sob o tecido. Boa defesa sem travar o movimento.',
   true,'chest',3.5,
   '{"defense":4,"hp_max":6}','{"skill":"armaduras_leves","level":1}',
   true,'uncommon',34,false),

  -- ── Armaduras pesadas (RES / armaduras_pesadas) ──────────────────────
  ('peitoral_placas','Peitoral de Placas','armor',
   'Placas industriais rebitadas. Muita defesa, muito peso.',
   true,'chest',9.0,
   '{"defense":7,"hp_max":10}','{"str_mg":3,"skill":"armaduras_pesadas","level":1}',
   true,'uncommon',48,false),

  -- ── Escudo (off_hand / escudos_bloqueio) ─────────────────────────────
  ('escudo_madeira','Escudo de Madeira','armor',
   'Tábuas reforçadas com um aro de ferro. Melhora o bloqueio.',
   true,'off_hand',2.5,
   '{"defense":2}','{}',true,'common',10,false),

  -- ── Acessórios ───────────────────────────────────────────────────────
  ('amuleto_osso','Amuleto de Osso','armor',
   'Talismã tosco que dizem afastar a névoa. Talvez seja só superstição.',
   true,'accessory',0.2,
   '{"mist_resistance":3}','{}',true,'common',9,false),
  ('anel_precisao','Anel de Precisão','armor',
   'Anel de artesão que firma a mira.',
   true,'accessory',0.1,
   '{"accuracy":2,"crit_chance":1}','{}',true,'uncommon',22,false),

  -- ── Consumíveis (usados fora e dentro do combate) ────────────────────
  ('pocao_cura','Poção de Cura','consumable',
   'Elixir vermelho que fecha ferimentos. Restaura PV.',
   false,NULL,0.3,
   '{"heal":30}','{}',true,'common',10,true),
  ('frasco_veneno','Frasco de Veneno','consumable',
   'Composto corrosivo para untar a lâmina. Consumido pela habilidade Ataque Envenenado.',
   false,NULL,0.2,
   '{}','{}',true,'common',8,true),
  ('granada_quimica','Granada Química','consumable',
   'Cápsula instável de névoa comprimida. Consumida pela habilidade Granada Química.',
   false,NULL,0.5,
   '{}','{}',true,'uncommon',18,true),
  ('granada_gas','Granada de Gás','consumable',
   'Dispersa um gás paralisante. Consumida pela habilidade Gás Paralisante.',
   false,NULL,0.5,
   '{}','{}',true,'uncommon',20,true),

  -- ── Recursos (drop de loot; matéria-prima para produção futura) ──────
  ('sucata_metal','Sucata de Metal','resource',
   'Fragmentos de metal enferrujado. Úteis para reparos e fabricação.',
   false,NULL,0.4,
   '{}','{}',true,'common',2,true),
  ('essencia_nevoa','Essência de Névoa','resource',
   'Um resíduo brilhante e frio deixado por criaturas corrompidas.',
   false,NULL,0.1,
   '{}','{}',true,'uncommon',14,true)
ON CONFLICT ("slug") DO UPDATE SET
  "name"          = EXCLUDED."name",
  "item_type"     = EXCLUDED."item_type",
  "description"   = EXCLUDED."description",
  "is_equippable" = EXCLUDED."is_equippable",
  "equipment_slot"= EXCLUDED."equipment_slot",
  "weight"        = EXCLUDED."weight",
  "stats"         = EXCLUDED."stats",
  "requirements"  = EXCLUDED."requirements",
  "is_tradeable"  = EXCLUDED."is_tradeable",
  "rarity"        = EXCLUDED."rarity",
  "base_value"    = EXCLUDED."base_value",
  "is_stackable"  = EXCLUDED."is_stackable";

-- ─── Spec 3 — Inventário: loot_table dos inimigos iniciais ────────────────
-- Ver .kiro/specs/inventario/design.md §1.3 / §3.2. Formato consumido por
-- services/loot.js: [{ "item_slug", "chance"(0..1), "min", "max" }].
-- Slugs referenciam itens semeados acima. Drops modestos (MVP): recursos comuns,
-- consumíveis ocasionais, equipamento comum raro de cair.
UPDATE "public"."enemy_catalog" SET "loot_table" = '[
  {"item_slug":"sucata_metal","chance":0.5,"min":1,"max":2},
  {"item_slug":"pocao_cura","chance":0.15,"min":1,"max":1}
]'::jsonb WHERE "slug" = 'rato_da_bruma';

UPDATE "public"."enemy_catalog" SET "loot_table" = '[
  {"item_slug":"sucata_metal","chance":0.5,"min":1,"max":2},
  {"item_slug":"essencia_nevoa","chance":0.35,"min":1,"max":1},
  {"item_slug":"frasco_veneno","chance":0.2,"min":1,"max":1},
  {"item_slug":"faca_enferrujada","chance":0.08,"min":1,"max":1}
]'::jsonb WHERE "slug" = 'vagante_corrompido';

UPDATE "public"."enemy_catalog" SET "loot_table" = '[
  {"item_slug":"sucata_metal","chance":0.7,"min":2,"max":4},
  {"item_slug":"essencia_nevoa","chance":0.4,"min":1,"max":2},
  {"item_slug":"granada_quimica","chance":0.15,"min":1,"max":1},
  {"item_slug":"escudo_madeira","chance":0.1,"min":1,"max":1}
]'::jsonb WHERE "slug" = 'sabujo_de_ferro';

-- ─── Bestiário da região inicial (Spec de conteúdo) ───────────────────────
-- O bestiário ampliado (16 materiais + 5 armas épicas de boss + 33 inimigos,
-- incluindo 5 bosses nv10) e suas loot_table são semeados por scripts Node
-- idempotentes (REST), NÃO por este arquivo, para evitar duplicar centenas de
-- linhas e por consistência com o fluxo da máquina (db push não roda seed):
--   backend/scripts/seed-bestiary-items.js    (itens: materiais + armas épicas)
--   backend/scripts/seed-bestiary-enemies.js  (enemy_catalog: monstros + bosses)
-- Fonte de verdade do conteúdo (atributos, drops, descrições):
--   docs/md/bestiario-zona-inicial.md
-- O mapa da região inicial (19 nós: 4 assentamentos + 12 exploração + 3 secretos),
-- suas conexões e os node_spawns (distribuição de monstros/bosses por nó) são
-- semeados por outro script Node idempotente:
--   backend/scripts/seed-map-region.js   (world_nodes + node_connections + node_spawns)
-- Fonte de verdade do mapa: docs/md/mapa-regiao-inicial.md
-- Esse script RECONSTRÓI conexões/spawns dos nós da região (idempotente) e
-- reaproveita os nós existentes por description_key.
