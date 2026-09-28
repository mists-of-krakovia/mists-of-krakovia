-- Spec 4 — Diálogos. Respostas de NPC por intenção e locale (motor de
-- palavras-chave). Ver .kiro/specs/dialogos/design.md §1.1.
-- As tabelas de árvore (dialogue_trees/nodes/options) NÃO são usadas por este
-- sistema — ficam reservadas para cenas roteirizadas futuras.

CREATE TABLE IF NOT EXISTS "public"."npc_dialogue" (
  "id"             "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
  "npc_id"         "uuid" NOT NULL,
  "locale"         character varying(5) NOT NULL DEFAULT 'pt',
  "intent"         character varying(20) NOT NULL,
  "variants"       "jsonb" NOT NULL DEFAULT '[]'::"jsonb",
  "min_confidence" integer NOT NULL DEFAULT 0,
  "sort_order"     integer NOT NULL DEFAULT 0,
  CONSTRAINT "npc_dialogue_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "npc_dialogue_uniq" UNIQUE ("npc_id", "locale", "intent", "sort_order")
);
ALTER TABLE "public"."npc_dialogue" OWNER TO "postgres";

ALTER TABLE ONLY "public"."npc_dialogue"
  ADD CONSTRAINT "npc_dialogue_npc_id_fkey"
  FOREIGN KEY ("npc_id") REFERENCES "public"."npcs"("id") ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS "npc_dialogue_npc_idx" ON "public"."npc_dialogue" ("npc_id");

ALTER TABLE "public"."npc_dialogue" ENABLE ROW LEVEL SECURITY;

-- Conteúdo público do mundo (mesmo padrão de enemy_catalog/items/skills_catalog).
CREATE POLICY "NPC dialogue is viewable by everyone"
  ON "public"."npc_dialogue" FOR SELECT USING (true);

GRANT ALL ON TABLE "public"."npc_dialogue" TO "anon";
GRANT ALL ON TABLE "public"."npc_dialogue" TO "authenticated";
GRANT ALL ON TABLE "public"."npc_dialogue" TO "service_role";
