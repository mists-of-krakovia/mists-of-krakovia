-- Spec 2 — Combate. Sub-parte A. Catálogo de inimigos (fonte única, data-driven).
-- Base do futuro bestiário in-game. Ver .kiro/specs/combate/design.md §1.2.
-- Referência: docs/mists_of_krakovia_gameplay_v1.pdf (Volume III — Derivados).

CREATE TABLE IF NOT EXISTS "public"."enemy_catalog" (
  "slug"             character varying(100) NOT NULL,
  "name"             character varying(100) NOT NULL,
  "level"            integer NOT NULL DEFAULT 1,
  "hp_max"           integer NOT NULL,
  "attack"           integer NOT NULL,                 -- Ataque base do inimigo
  "defense"          integer NOT NULL DEFAULT 0,
  "speed"            integer NOT NULL DEFAULT 0,        -- iniciativa / ações adicionais
  "accuracy"         integer NOT NULL DEFAULT 0,
  "evasion"          integer NOT NULL DEFAULT 0,
  "crit_chance"      numeric(5,2) NOT NULL DEFAULT 3,
  "crit_damage"      numeric(5,2) NOT NULL DEFAULT 150,
  "mist_resistance"  integer NOT NULL DEFAULT 0,
  "xp_reward"        integer NOT NULL,                 -- XP ao derrotar (15-25 iniciais)
  "ai_profile"       "public"."enemy_ai" NOT NULL DEFAULT 'attacker_simple',
  "attack_types"     "jsonb" NOT NULL DEFAULT '["quick","strong"]'::"jsonb",
  "abilities"        "jsonb" NOT NULL DEFAULT '[]'::"jsonb",   -- inerte p/ iniciais
  "is_rare"          boolean NOT NULL DEFAULT false,           -- reservado bestiário
  "spawn_conditions" "jsonb" NOT NULL DEFAULT '{}'::"jsonb",   -- reservado
  "loot_table"       "jsonb" NOT NULL DEFAULT '[]'::"jsonb",   -- reservado (fora deste spec)
  "description"      "text",
  CONSTRAINT "enemy_catalog_pkey" PRIMARY KEY ("slug")
);
ALTER TABLE "public"."enemy_catalog" OWNER TO "postgres";

-- Agora que enemy_catalog existe, liga combat_participants.enemy_slug a ela.
ALTER TABLE ONLY "public"."combat_participants"
  ADD CONSTRAINT "combat_participants_enemy_slug_fkey"
  FOREIGN KEY ("enemy_slug") REFERENCES "public"."enemy_catalog"("slug");

ALTER TABLE "public"."enemy_catalog" ENABLE ROW LEVEL SECURITY;

-- Catálogo é conteúdo público do mundo (mesmo padrão de skills_catalog/items).
CREATE POLICY "Enemy catalog is viewable by everyone"
  ON "public"."enemy_catalog" FOR SELECT USING (true);

GRANT ALL ON TABLE "public"."enemy_catalog" TO "anon";
GRANT ALL ON TABLE "public"."enemy_catalog" TO "authenticated";
GRANT ALL ON TABLE "public"."enemy_catalog" TO "service_role";
