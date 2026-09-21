-- Spec 2 — Combate por Turnos + Progressão. Sub-parte A (motor de turnos).
-- ENUMs de combate: preparar o banco para combate multi-combatente (party).
-- Ver .kiro/specs/combate/design.md §1.1.
-- Referência: docs/mists_of_krakovia_gameplay_v1.pdf (Volume III — Combate),
--             docs/mists_of_krakovia_classes_v2.pdf (Volume V — Classes).

-- Lado do combatente numa sessão.
DO $$ BEGIN
  CREATE TYPE "public"."combat_side" AS ENUM ('ally', 'enemy');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Tipo de spawn na ligação nó<->inimigo (node_spawns).
DO $$ BEGIN
  CREATE TYPE "public"."spawn_type" AS ENUM ('random', 'conditional', 'guaranteed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Perfil de IA do inimigo. Só 'attacker_simple' usado nesta entrega.
DO $$ BEGIN
  CREATE TYPE "public"."enemy_ai" AS ENUM ('attacker_simple', 'defensive', 'caster');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TYPE "public"."combat_side" OWNER TO "postgres";
ALTER TYPE "public"."spawn_type"  OWNER TO "postgres";
ALTER TYPE "public"."enemy_ai"    OWNER TO "postgres";

-- combat_status: era 1x1 ('active','player_won','player_lost','fled').
-- Generalizar para party. As tabelas de combate serão recriadas (vazias) na
-- migration seguinte, então trocamos o tipo com segurança recriando o enum.
-- combat_actor ('player','enemy') deixa de ser usado (combat_turns passa a
-- referenciar combat_participants.id) e é dropado.

-- Remove policies/tabelas que dependem dos tipos antigos antes de dropá-los.
-- (As tabelas são recriadas na migration recreate_combat_tables.)
DROP TABLE IF EXISTS "public"."combat_turns" CASCADE;
DROP TABLE IF EXISTS "public"."combat_sessions" CASCADE;

DROP TYPE IF EXISTS "public"."combat_status" CASCADE;
DROP TYPE IF EXISTS "public"."combat_actor" CASCADE;

CREATE TYPE "public"."combat_status" AS ENUM (
  'active', 'allies_won', 'enemies_won', 'fled', 'abandoned'
);
ALTER TYPE "public"."combat_status" OWNER TO "postgres";
