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
