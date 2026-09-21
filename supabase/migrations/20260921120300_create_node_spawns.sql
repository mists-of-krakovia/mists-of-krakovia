-- Spec 2 — Combate. Sub-parte A. Tabela de ligação nó<->inimigo: a mecânica de
-- spawn mora na relação (tipo, peso, quantidade, condições).
-- Ver .kiro/specs/combate/design.md §1.6.

CREATE TABLE IF NOT EXISTS "public"."node_spawns" (
  "id"               "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
  "node_id"          "uuid" NOT NULL,
  "enemy_slug"       character varying(100) NOT NULL,
  "spawn_type"       "public"."spawn_type" NOT NULL DEFAULT 'random',
  "weight"           integer NOT NULL DEFAULT 100,     -- peso relativo no sorteio
  "min_count"        integer NOT NULL DEFAULT 1,       -- prepara party de inimigos
  "max_count"        integer NOT NULL DEFAULT 1,
  "spawn_conditions" "jsonb" NOT NULL DEFAULT '{}'::"jsonb",  -- {weather,time,chance,...}
  "is_active"        boolean NOT NULL DEFAULT true,
  CONSTRAINT "node_spawns_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "node_spawns_count_chk" CHECK ("min_count" >= 1 AND "max_count" >= "min_count")
);
ALTER TABLE "public"."node_spawns" OWNER TO "postgres";

ALTER TABLE ONLY "public"."node_spawns"
  ADD CONSTRAINT "node_spawns_node_id_fkey"
  FOREIGN KEY ("node_id") REFERENCES "public"."world_nodes"("id") ON DELETE CASCADE;
ALTER TABLE ONLY "public"."node_spawns"
  ADD CONSTRAINT "node_spawns_enemy_slug_fkey"
  FOREIGN KEY ("enemy_slug") REFERENCES "public"."enemy_catalog"("slug");

CREATE INDEX IF NOT EXISTS "node_spawns_node_idx"
  ON "public"."node_spawns" ("node_id");

ALTER TABLE "public"."node_spawns" ENABLE ROW LEVEL SECURITY;

-- Leitura pública (o cliente pode querer prever encontros; conteúdo do mundo).
CREATE POLICY "Node spawns are viewable by everyone"
  ON "public"."node_spawns" FOR SELECT USING (true);

GRANT ALL ON TABLE "public"."node_spawns" TO "anon";
GRANT ALL ON TABLE "public"."node_spawns" TO "authenticated";
GRANT ALL ON TABLE "public"."node_spawns" TO "service_role";
