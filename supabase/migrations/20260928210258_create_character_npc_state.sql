-- Spec 4 — Diálogos. Estado de confiança/relação de cada personagem com cada NPC.
-- Ver .kiro/specs/dialogos/design.md §1.2.
-- trust 0..100 governa quais respostas o NPC libera (min_confidence). Por ora, o
-- valor inicial e 100 (tudo liberado); os MECANISMOS que alteram trust (quests,
-- reputacao de faccao, escolhas) sao 🔮 (fora deste spec).

CREATE TABLE IF NOT EXISTS "public"."character_npc_state" (
  "character_id" "uuid" NOT NULL,
  "npc_id"       "uuid" NOT NULL,
  "trust"        integer NOT NULL DEFAULT 100,
  "flags"        "jsonb" NOT NULL DEFAULT '{}'::"jsonb",
  "updated_at"   timestamp with time zone NOT NULL DEFAULT "now"(),
  CONSTRAINT "character_npc_state_pkey" PRIMARY KEY ("character_id", "npc_id"),
  CONSTRAINT "character_npc_state_trust_chk" CHECK ("trust" >= 0 AND "trust" <= 100)
);
ALTER TABLE "public"."character_npc_state" OWNER TO "postgres";

ALTER TABLE ONLY "public"."character_npc_state"
  ADD CONSTRAINT "character_npc_state_character_id_fkey"
  FOREIGN KEY ("character_id") REFERENCES "public"."characters"("id") ON DELETE CASCADE;
ALTER TABLE ONLY "public"."character_npc_state"
  ADD CONSTRAINT "character_npc_state_npc_id_fkey"
  FOREIGN KEY ("npc_id") REFERENCES "public"."npcs"("id") ON DELETE CASCADE;

ALTER TABLE "public"."character_npc_state" ENABLE ROW LEVEL SECURITY;

-- O jogador só vê o próprio estado (mesmo padrão de character_inventory).
CREATE POLICY "Users can view own npc state"
  ON "public"."character_npc_state" FOR SELECT
  USING (("character_id" IN ( SELECT "characters"."id"
     FROM "public"."characters"
    WHERE ("characters"."account_id" = "auth"."uid"()))));

GRANT ALL ON TABLE "public"."character_npc_state" TO "anon";
GRANT ALL ON TABLE "public"."character_npc_state" TO "authenticated";
GRANT ALL ON TABLE "public"."character_npc_state" TO "service_role";
