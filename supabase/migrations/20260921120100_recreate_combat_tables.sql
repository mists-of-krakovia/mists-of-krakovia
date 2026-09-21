-- Spec 2 — Combate. Sub-parte A. Recria as tabelas de combate no modelo
-- multi-combatente (party/multi-alvo). Ver .kiro/specs/combate/design.md §1.3-1.5.
-- As tabelas antigas (1x1) foram dropadas na migration combat_enums (estavam
-- vazias: combate nunca rodou).

-- ============================================================
-- combat_sessions — a sessão de combate (sem campos 1x1)
-- ============================================================
CREATE TABLE IF NOT EXISTS "public"."combat_sessions" (
  "id"           "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
  "node_id"      "uuid" NOT NULL,
  "initiator_id" "uuid",                     -- dono/iniciador da sessão (conveniência)
  "status"       "public"."combat_status" DEFAULT 'active'::"public"."combat_status" NOT NULL,
  "round_number" integer NOT NULL DEFAULT 1,
  "turn_order"   "jsonb"  NOT NULL DEFAULT '[]'::"jsonb",  -- [participant_id, ...] por iniciativa
  "active_index" integer  NOT NULL DEFAULT 0,              -- posição atual em turn_order
  "pending"      "jsonb"  NOT NULL DEFAULT '{}'::"jsonb",  -- sincronização de reação pendente
  "started_at"   timestamp with time zone DEFAULT "now"() NOT NULL,
  "ended_at"     timestamp with time zone,
  CONSTRAINT "combat_sessions_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "public"."combat_sessions" OWNER TO "postgres";

ALTER TABLE ONLY "public"."combat_sessions"
  ADD CONSTRAINT "combat_sessions_node_id_fkey"
  FOREIGN KEY ("node_id") REFERENCES "public"."world_nodes"("id");
ALTER TABLE ONLY "public"."combat_sessions"
  ADD CONSTRAINT "combat_sessions_initiator_id_fkey"
  FOREIGN KEY ("initiator_id") REFERENCES "public"."characters"("id") ON DELETE CASCADE;

-- ============================================================
-- combat_participants — quem está no combate (jogador ou inimigo)
-- É o que habilita party/multi-alvo.
-- ============================================================
CREATE TABLE IF NOT EXISTS "public"."combat_participants" (
  "id"            "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
  "session_id"    "uuid" NOT NULL,
  "side"          "public"."combat_side" NOT NULL,      -- 'ally' | 'enemy'
  "character_id"  "uuid",                                -- preenchido se for jogador
  "enemy_slug"    character varying(100),                -- referencia enemy_catalog se for inimigo
  "display_name"  character varying(100) NOT NULL,
  "level"         integer NOT NULL DEFAULT 1,
  "hp_max"        integer NOT NULL,
  "hp_current"    integer NOT NULL,
  "stats"         "jsonb"  NOT NULL DEFAULT '{}'::"jsonb",  -- snapshot dos derivados no início
  "effects"      "jsonb"  NOT NULL DEFAULT '[]'::"jsonb",  -- efeitos temporários DO combate
  "cooldowns"     "jsonb"  NOT NULL DEFAULT '{}'::"jsonb",  -- {ability_slug: turns_remaining}
  "initiative"    integer NOT NULL DEFAULT 0,             -- Velocidade p/ ordenar
  "extra_actions" integer NOT NULL DEFAULT 0,             -- ações adicionais por Velocidade
  "reaction_used" boolean NOT NULL DEFAULT false,         -- gasta ao reagir; reseta na ação
  "is_defeated"   boolean NOT NULL DEFAULT false,
  "slot"          integer NOT NULL DEFAULT 0,             -- ordem/posição estável
  CONSTRAINT "combat_participants_pkey" PRIMARY KEY ("id"),
  -- exatamente um de character_id / enemy_slug preenchido
  CONSTRAINT "combat_participants_identity_chk" CHECK (
    ("character_id" IS NOT NULL AND "enemy_slug" IS NULL) OR
    ("character_id" IS NULL AND "enemy_slug" IS NOT NULL)
  )
);
ALTER TABLE "public"."combat_participants" OWNER TO "postgres";

ALTER TABLE ONLY "public"."combat_participants"
  ADD CONSTRAINT "combat_participants_session_id_fkey"
  FOREIGN KEY ("session_id") REFERENCES "public"."combat_sessions"("id") ON DELETE CASCADE;
ALTER TABLE ONLY "public"."combat_participants"
  ADD CONSTRAINT "combat_participants_character_id_fkey"
  FOREIGN KEY ("character_id") REFERENCES "public"."characters"("id") ON DELETE CASCADE;
-- FK de enemy_slug -> enemy_catalog é adicionada na migration create_enemy_catalog.

CREATE INDEX IF NOT EXISTS "combat_participants_session_idx"
  ON "public"."combat_participants" ("session_id");

-- ============================================================
-- combat_turns — log de turnos referenciando participantes
-- ============================================================
CREATE TABLE IF NOT EXISTS "public"."combat_turns" (
  "id"           "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
  "session_id"   "uuid" NOT NULL,
  "round_number" integer NOT NULL,
  "turn_number"  integer NOT NULL,
  "actor_id"     "uuid" NOT NULL,
  "target_id"    "uuid",
  "action_type"  character varying(50) NOT NULL,   -- attack_quick|attack_strong|ability|flee|pass|react_block|react_dodge|counter
  "result"       "jsonb" NOT NULL DEFAULT '{}'::"jsonb",
  "created_at"   timestamp with time zone DEFAULT "now"() NOT NULL,
  CONSTRAINT "combat_turns_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "public"."combat_turns" OWNER TO "postgres";

ALTER TABLE ONLY "public"."combat_turns"
  ADD CONSTRAINT "combat_turns_session_id_fkey"
  FOREIGN KEY ("session_id") REFERENCES "public"."combat_sessions"("id") ON DELETE CASCADE;
ALTER TABLE ONLY "public"."combat_turns"
  ADD CONSTRAINT "combat_turns_actor_id_fkey"
  FOREIGN KEY ("actor_id") REFERENCES "public"."combat_participants"("id") ON DELETE CASCADE;
ALTER TABLE ONLY "public"."combat_turns"
  ADD CONSTRAINT "combat_turns_target_id_fkey"
  FOREIGN KEY ("target_id") REFERENCES "public"."combat_participants"("id") ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS "combat_turns_session_idx"
  ON "public"."combat_turns" ("session_id");

-- ============================================================
-- RLS — o jogador lê o que é seu; escrita só via service_role (backend).
-- ============================================================
ALTER TABLE "public"."combat_sessions"     ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."combat_participants" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."combat_turns"        ENABLE ROW LEVEL SECURITY;

-- Sessão visível se o jogador participa dela.
CREATE POLICY "Users can view own combat sessions"
  ON "public"."combat_sessions" FOR SELECT USING (
    "id" IN (
      SELECT "cp"."session_id" FROM "public"."combat_participants" "cp"
      WHERE "cp"."character_id" IN (
        SELECT "characters"."id" FROM "public"."characters"
        WHERE "characters"."account_id" = "auth"."uid"()
      )
    )
  );

CREATE POLICY "Users can view own combat participants"
  ON "public"."combat_participants" FOR SELECT USING (
    "session_id" IN (
      SELECT "cp"."session_id" FROM "public"."combat_participants" "cp"
      WHERE "cp"."character_id" IN (
        SELECT "characters"."id" FROM "public"."characters"
        WHERE "characters"."account_id" = "auth"."uid"()
      )
    )
  );

CREATE POLICY "Users can view own combat turns"
  ON "public"."combat_turns" FOR SELECT USING (
    "session_id" IN (
      SELECT "cp"."session_id" FROM "public"."combat_participants" "cp"
      WHERE "cp"."character_id" IN (
        SELECT "characters"."id" FROM "public"."characters"
        WHERE "characters"."account_id" = "auth"."uid"()
      )
    )
  );

GRANT ALL ON TABLE "public"."combat_sessions"     TO "anon";
GRANT ALL ON TABLE "public"."combat_sessions"     TO "authenticated";
GRANT ALL ON TABLE "public"."combat_sessions"     TO "service_role";
GRANT ALL ON TABLE "public"."combat_participants" TO "anon";
GRANT ALL ON TABLE "public"."combat_participants" TO "authenticated";
GRANT ALL ON TABLE "public"."combat_participants" TO "service_role";
GRANT ALL ON TABLE "public"."combat_turns"        TO "anon";
GRANT ALL ON TABLE "public"."combat_turns"        TO "authenticated";
GRANT ALL ON TABLE "public"."combat_turns"        TO "service_role";
