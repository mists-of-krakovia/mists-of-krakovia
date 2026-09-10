


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."character_class" AS ENUM (
    'vagante_nevoas',
    'arauto_conclave',
    'exilado_ferro',
    'confessor_veu',
    'cronista_ruinas'
);


ALTER TYPE "public"."character_class" OWNER TO "postgres";


CREATE TYPE "public"."combat_actor" AS ENUM (
    'player',
    'enemy'
);


ALTER TYPE "public"."combat_actor" OWNER TO "postgres";


CREATE TYPE "public"."combat_status" AS ENUM (
    'active',
    'player_won',
    'player_lost',
    'fled'
);


ALTER TYPE "public"."combat_status" OWNER TO "postgres";


CREATE TYPE "public"."cycle_phase" AS ENUM (
    'morning',
    'night'
);


ALTER TYPE "public"."cycle_phase" OWNER TO "postgres";


CREATE TYPE "public"."document_category" AS ENUM (
    'personal',
    'official',
    'religious',
    'technical',
    'unknown'
);


ALTER TYPE "public"."document_category" OWNER TO "postgres";


CREATE TYPE "public"."effect_type" AS ENUM (
    'buff',
    'debuff',
    'neutral'
);


ALTER TYPE "public"."effect_type" OWNER TO "postgres";


CREATE TYPE "public"."exploration_type" AS ENUM (
    'general_search',
    'specific_collect',
    'advance',
    'hunt_manual',
    'hunt_auto'
);


ALTER TYPE "public"."exploration_type" OWNER TO "postgres";


CREATE TYPE "public"."item_rarity" AS ENUM (
    'common',
    'uncommon',
    'rare',
    'unique'
);


ALTER TYPE "public"."item_rarity" OWNER TO "postgres";


CREATE TYPE "public"."item_type" AS ENUM (
    'weapon',
    'armor',
    'consumable',
    'quest_item',
    'document',
    'cosmetic',
    'resource'
);


ALTER TYPE "public"."item_type" OWNER TO "postgres";


CREATE TYPE "public"."node_type" AS ENUM (
    'settlement',
    'field',
    'mist',
    'passage',
    'secret'
);


ALTER TYPE "public"."node_type" OWNER TO "postgres";


CREATE TYPE "public"."quest_status" AS ENUM (
    'active',
    'completed',
    'failed'
);


ALTER TYPE "public"."quest_status" OWNER TO "postgres";


CREATE TYPE "public"."skill_type" AS ENUM (
    'field',
    'combat',
    'production'
);


ALTER TYPE "public"."skill_type" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  INSERT INTO public.accounts (id, username, created_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', 'Jogador'),
    NOW()
  );
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."rls_auto_enable"() RETURNS "event_trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog'
    AS $$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$$;


ALTER FUNCTION "public"."rls_auto_enable"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."accounts" (
    "id" "uuid" NOT NULL,
    "username" character varying(30) NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "last_login" timestamp with time zone
);


ALTER TABLE "public"."accounts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."character_attributes" (
    "character_id" "uuid" NOT NULL,
    "strength" integer DEFAULT 5 NOT NULL,
    "agility" integer DEFAULT 5 NOT NULL,
    "resistance" integer DEFAULT 5 NOT NULL,
    "intellect" integer DEFAULT 5 NOT NULL,
    "perception" integer DEFAULT 5 NOT NULL,
    "sanity" integer DEFAULT 0 NOT NULL,
    "points_available" integer DEFAULT 5 NOT NULL,
    CONSTRAINT "character_attributes_agility_check" CHECK ((("agility" >= 1) AND ("agility" <= 21))),
    CONSTRAINT "character_attributes_intellect_check" CHECK ((("intellect" >= 1) AND ("intellect" <= 21))),
    CONSTRAINT "character_attributes_perception_check" CHECK ((("perception" >= 1) AND ("perception" <= 21))),
    CONSTRAINT "character_attributes_resistance_check" CHECK ((("resistance" >= 1) AND ("resistance" <= 21))),
    CONSTRAINT "character_attributes_sanity_check" CHECK ((("sanity" >= 1) AND ("sanity" <= 21))),
    CONSTRAINT "character_attributes_strength_check" CHECK ((("strength" >= 1) AND ("strength" <= 21)))
);


ALTER TABLE "public"."character_attributes" OWNER TO "postgres";


COMMENT ON COLUMN "public"."character_attributes"."sanity" IS 'Não usado diretamente. Sanidade é calculada nos derivados via INT + PER.';



CREATE TABLE IF NOT EXISTS "public"."character_derived" (
    "character_id" "uuid" NOT NULL,
    "hp_max" integer NOT NULL,
    "hp_current" integer NOT NULL,
    "stamina_max" integer NOT NULL,
    "stamina_current" integer NOT NULL,
    "accuracy" integer NOT NULL,
    "attack_melee" integer NOT NULL,
    "attack_ranged" integer NOT NULL,
    "defense" integer NOT NULL,
    "evasion" integer NOT NULL,
    "speed" integer NOT NULL,
    "crit_chance" numeric(5,2) NOT NULL,
    "crit_damage" numeric(5,2) NOT NULL,
    "mental_resistance" integer NOT NULL,
    "mist_resistance" integer NOT NULL,
    "observation" integer NOT NULL,
    "carry_capacity" integer NOT NULL,
    "mist_exposure" integer DEFAULT 0 NOT NULL,
    CONSTRAINT "character_derived_mist_exposure_check" CHECK ((("mist_exposure" >= 0) AND ("mist_exposure" <= 100)))
);


ALTER TABLE "public"."character_derived" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."character_discovered_nodes" (
    "character_id" "uuid" NOT NULL,
    "node_id" "uuid" NOT NULL,
    "discovered_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."character_discovered_nodes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."character_documents" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "character_id" "uuid" NOT NULL,
    "document_slug" character varying(100) NOT NULL,
    "title" character varying(200) NOT NULL,
    "category" "public"."document_category" NOT NULL,
    "content" "text" NOT NULL,
    "acquired_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "node_id" "uuid"
);


ALTER TABLE "public"."character_documents" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."character_inventory" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "character_id" "uuid" NOT NULL,
    "item_id" "uuid" NOT NULL,
    "quantity" integer DEFAULT 1 NOT NULL,
    "durability" integer,
    "is_equipped" boolean DEFAULT false NOT NULL,
    "equipped_slot" character varying(50),
    "acquired_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."character_inventory" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."character_quests" (
    "character_id" "uuid" NOT NULL,
    "quest_id" "uuid" NOT NULL,
    "status" "public"."quest_status" NOT NULL,
    "current_step" integer DEFAULT 0 NOT NULL,
    "started_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "completed_at" timestamp with time zone,
    "notes" "text"
);


ALTER TABLE "public"."character_quests" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."character_sessions" (
    "character_id" "uuid" NOT NULL,
    "node_id" "uuid",
    "last_active" timestamp with time zone DEFAULT "now"(),
    "is_online" boolean DEFAULT true
);


ALTER TABLE "public"."character_sessions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."character_skills" (
    "character_id" "uuid" NOT NULL,
    "skill_name" character varying(50) NOT NULL,
    "skill_type" "public"."skill_type" NOT NULL,
    "level" integer DEFAULT 0 NOT NULL,
    "xp" integer DEFAULT 0 NOT NULL
);


ALTER TABLE "public"."character_skills" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."character_status_effects" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "character_id" "uuid" NOT NULL,
    "effect_name" character varying(50) NOT NULL,
    "effect_type" "public"."effect_type" NOT NULL,
    "value" integer NOT NULL,
    "expires_at" timestamp with time zone,
    "source" character varying(100)
);


ALTER TABLE "public"."character_status_effects" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."characters" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "account_id" "uuid" NOT NULL,
    "name" character varying(20) NOT NULL,
    "class" "public"."character_class" NOT NULL,
    "level" integer DEFAULT 1 NOT NULL,
    "xp" integer DEFAULT 0 NOT NULL,
    "xp_to_next" integer DEFAULT 100 NOT NULL,
    "avatar" character varying(50),
    "current_node_id" "uuid",
    "last_settlement_id" "uuid",
    "is_active" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "first_login" boolean DEFAULT true
);


ALTER TABLE "public"."characters" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."combat_sessions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "character_id" "uuid" NOT NULL,
    "node_id" "uuid" NOT NULL,
    "enemy_slug" character varying(100) NOT NULL,
    "enemy_hp_current" integer NOT NULL,
    "enemy_hp_max" integer NOT NULL,
    "status" "public"."combat_status" DEFAULT 'active'::"public"."combat_status" NOT NULL,
    "turn_order" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "started_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "ended_at" timestamp with time zone
);


ALTER TABLE "public"."combat_sessions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."combat_turns" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "session_id" "uuid" NOT NULL,
    "turn_number" integer NOT NULL,
    "actor" "public"."combat_actor" NOT NULL,
    "action_type" character varying(50) NOT NULL,
    "target" "public"."combat_actor" NOT NULL,
    "result" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "hp_after_player" integer NOT NULL,
    "hp_after_enemy" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."combat_turns" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."dialogue_nodes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tree_id" "uuid" NOT NULL,
    "stage" integer DEFAULT 0 NOT NULL,
    "condition" character varying(200),
    "text" "text" NOT NULL
);


ALTER TABLE "public"."dialogue_nodes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."dialogue_options" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "dialogue_node_id" "uuid" NOT NULL,
    "text" character varying(200) NOT NULL,
    "next_node_id" "uuid",
    "action" character varying(200),
    "condition" character varying(200)
);


ALTER TABLE "public"."dialogue_options" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."dialogue_trees" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "npc_id" "uuid"
);


ALTER TABLE "public"."dialogue_trees" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."exploration_attempts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "character_id" "uuid" NOT NULL,
    "node_id" "uuid" NOT NULL,
    "attempt_type" "public"."exploration_type" NOT NULL,
    "roll_result" integer NOT NULL,
    "perception_modifier" integer DEFAULT 0 NOT NULL,
    "quest_modifier" integer DEFAULT 0 NOT NULL,
    "outcome" character varying(200) NOT NULL,
    "stamina_cost" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."exploration_attempts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "slug" character varying(100) NOT NULL,
    "name" character varying(100) NOT NULL,
    "item_type" "public"."item_type" NOT NULL,
    "description" "text",
    "is_equippable" boolean DEFAULT false NOT NULL,
    "equipment_slot" character varying(50),
    "weight" numeric(10,2) DEFAULT 0 NOT NULL,
    "stats" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "requirements" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "is_tradeable" boolean DEFAULT true NOT NULL,
    "rarity" "public"."item_rarity" DEFAULT 'common'::"public"."item_rarity" NOT NULL
);


ALTER TABLE "public"."items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."node_connections" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "from_node_id" "uuid" NOT NULL,
    "to_node_id" "uuid" NOT NULL,
    "travel_cost" integer DEFAULT 0 NOT NULL,
    "is_visible" boolean DEFAULT true NOT NULL,
    "direction_label" character varying(50) NOT NULL
);


ALTER TABLE "public"."node_connections" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."npcs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" character varying(100) NOT NULL,
    "node_id" "uuid" NOT NULL,
    "description" "text",
    "dialogue_tree_id" "uuid",
    "is_quest_giver" boolean DEFAULT false NOT NULL,
    "schedule" "jsonb"
);


ALTER TABLE "public"."npcs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."quest_steps" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "quest_id" "uuid" NOT NULL,
    "step_order" integer NOT NULL,
    "description" "text" NOT NULL,
    "completion_condition" character varying(200) NOT NULL
);


ALTER TABLE "public"."quest_steps" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."quests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "slug" character varying(100) NOT NULL,
    "title" character varying(100) NOT NULL,
    "description" "text",
    "giver_npc_id" "uuid",
    "reward_xp" integer DEFAULT 0 NOT NULL,
    "reward_items" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL
);


ALTER TABLE "public"."quests" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."world_clock" (
    "id" integer NOT NULL,
    "time_now" timestamp with time zone NOT NULL,
    "cycle_phase" "public"."cycle_phase" NOT NULL,
    "cycle_start" timestamp with time zone NOT NULL,
    "day_duration_seconds" integer DEFAULT 900 NOT NULL,
    "night_duration_seconds" integer DEFAULT 900 NOT NULL,
    "current_weather" character varying(50) DEFAULT 'clear'::character varying,
    CONSTRAINT "world_clock_id_check" CHECK (("id" = 1))
);


ALTER TABLE "public"."world_clock" OWNER TO "postgres";


COMMENT ON COLUMN "public"."world_clock"."current_weather" IS 'clear | rain | heavy_rain | fog | storm | snow';



CREATE TABLE IF NOT EXISTS "public"."world_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "node_id" "uuid",
    "event_type" character varying(50) NOT NULL,
    "started_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "expires_at" timestamp with time zone,
    "data" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL
);


ALTER TABLE "public"."world_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."world_nodes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" character varying(100) NOT NULL,
    "description_key" character varying(100) NOT NULL,
    "node_type" "public"."node_type" NOT NULL,
    "region" character varying(50) NOT NULL,
    "parent_node_id" "uuid",
    "is_safe_zone" boolean DEFAULT false NOT NULL,
    "is_secret" boolean DEFAULT false NOT NULL,
    "unlock_condition" character varying(200),
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."world_nodes" OWNER TO "postgres";


ALTER TABLE ONLY "public"."accounts"
    ADD CONSTRAINT "accounts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."accounts"
    ADD CONSTRAINT "accounts_username_key" UNIQUE ("username");



ALTER TABLE ONLY "public"."character_attributes"
    ADD CONSTRAINT "character_attributes_pkey" PRIMARY KEY ("character_id");



ALTER TABLE ONLY "public"."character_derived"
    ADD CONSTRAINT "character_derived_pkey" PRIMARY KEY ("character_id");



ALTER TABLE ONLY "public"."character_discovered_nodes"
    ADD CONSTRAINT "character_discovered_nodes_pkey" PRIMARY KEY ("character_id", "node_id");



ALTER TABLE ONLY "public"."character_documents"
    ADD CONSTRAINT "character_documents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."character_inventory"
    ADD CONSTRAINT "character_inventory_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."character_quests"
    ADD CONSTRAINT "character_quests_pkey" PRIMARY KEY ("character_id", "quest_id");



ALTER TABLE ONLY "public"."character_sessions"
    ADD CONSTRAINT "character_sessions_pkey" PRIMARY KEY ("character_id");



ALTER TABLE ONLY "public"."character_skills"
    ADD CONSTRAINT "character_skills_pkey" PRIMARY KEY ("character_id", "skill_name");



ALTER TABLE ONLY "public"."character_status_effects"
    ADD CONSTRAINT "character_status_effects_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."characters"
    ADD CONSTRAINT "characters_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."combat_sessions"
    ADD CONSTRAINT "combat_sessions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."combat_turns"
    ADD CONSTRAINT "combat_turns_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."dialogue_nodes"
    ADD CONSTRAINT "dialogue_nodes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."dialogue_options"
    ADD CONSTRAINT "dialogue_options_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."dialogue_trees"
    ADD CONSTRAINT "dialogue_trees_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."exploration_attempts"
    ADD CONSTRAINT "exploration_attempts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."items"
    ADD CONSTRAINT "items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."items"
    ADD CONSTRAINT "items_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."node_connections"
    ADD CONSTRAINT "node_connections_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."npcs"
    ADD CONSTRAINT "npcs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."quest_steps"
    ADD CONSTRAINT "quest_steps_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."quests"
    ADD CONSTRAINT "quests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."quests"
    ADD CONSTRAINT "quests_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."world_clock"
    ADD CONSTRAINT "world_clock_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."world_events"
    ADD CONSTRAINT "world_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."world_nodes"
    ADD CONSTRAINT "world_nodes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."accounts"
    ADD CONSTRAINT "accounts_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."character_attributes"
    ADD CONSTRAINT "character_attributes_character_id_fkey" FOREIGN KEY ("character_id") REFERENCES "public"."characters"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."character_derived"
    ADD CONSTRAINT "character_derived_character_id_fkey" FOREIGN KEY ("character_id") REFERENCES "public"."characters"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."character_discovered_nodes"
    ADD CONSTRAINT "character_discovered_nodes_character_id_fkey" FOREIGN KEY ("character_id") REFERENCES "public"."characters"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."character_discovered_nodes"
    ADD CONSTRAINT "character_discovered_nodes_node_id_fkey" FOREIGN KEY ("node_id") REFERENCES "public"."world_nodes"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."character_documents"
    ADD CONSTRAINT "character_documents_character_id_fkey" FOREIGN KEY ("character_id") REFERENCES "public"."characters"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."character_documents"
    ADD CONSTRAINT "character_documents_node_id_fkey" FOREIGN KEY ("node_id") REFERENCES "public"."world_nodes"("id");



ALTER TABLE ONLY "public"."character_inventory"
    ADD CONSTRAINT "character_inventory_character_id_fkey" FOREIGN KEY ("character_id") REFERENCES "public"."characters"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."character_inventory"
    ADD CONSTRAINT "character_inventory_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id");



ALTER TABLE ONLY "public"."character_quests"
    ADD CONSTRAINT "character_quests_character_id_fkey" FOREIGN KEY ("character_id") REFERENCES "public"."characters"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."character_quests"
    ADD CONSTRAINT "character_quests_quest_id_fkey" FOREIGN KEY ("quest_id") REFERENCES "public"."quests"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."character_sessions"
    ADD CONSTRAINT "character_sessions_character_id_fkey" FOREIGN KEY ("character_id") REFERENCES "public"."characters"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."character_sessions"
    ADD CONSTRAINT "character_sessions_node_id_fkey" FOREIGN KEY ("node_id") REFERENCES "public"."world_nodes"("id");



ALTER TABLE ONLY "public"."character_skills"
    ADD CONSTRAINT "character_skills_character_id_fkey" FOREIGN KEY ("character_id") REFERENCES "public"."characters"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."character_status_effects"
    ADD CONSTRAINT "character_status_effects_character_id_fkey" FOREIGN KEY ("character_id") REFERENCES "public"."characters"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."characters"
    ADD CONSTRAINT "characters_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."combat_sessions"
    ADD CONSTRAINT "combat_sessions_character_id_fkey" FOREIGN KEY ("character_id") REFERENCES "public"."characters"("id");



ALTER TABLE ONLY "public"."combat_sessions"
    ADD CONSTRAINT "combat_sessions_node_id_fkey" FOREIGN KEY ("node_id") REFERENCES "public"."world_nodes"("id");



ALTER TABLE ONLY "public"."combat_turns"
    ADD CONSTRAINT "combat_turns_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."combat_sessions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."dialogue_nodes"
    ADD CONSTRAINT "dialogue_nodes_tree_id_fkey" FOREIGN KEY ("tree_id") REFERENCES "public"."dialogue_trees"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."dialogue_options"
    ADD CONSTRAINT "dialogue_options_dialogue_node_id_fkey" FOREIGN KEY ("dialogue_node_id") REFERENCES "public"."dialogue_nodes"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."dialogue_options"
    ADD CONSTRAINT "dialogue_options_next_node_id_fkey" FOREIGN KEY ("next_node_id") REFERENCES "public"."dialogue_nodes"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."exploration_attempts"
    ADD CONSTRAINT "exploration_attempts_character_id_fkey" FOREIGN KEY ("character_id") REFERENCES "public"."characters"("id");



ALTER TABLE ONLY "public"."exploration_attempts"
    ADD CONSTRAINT "exploration_attempts_node_id_fkey" FOREIGN KEY ("node_id") REFERENCES "public"."world_nodes"("id");



ALTER TABLE ONLY "public"."characters"
    ADD CONSTRAINT "fk_character_current_node" FOREIGN KEY ("current_node_id") REFERENCES "public"."world_nodes"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."characters"
    ADD CONSTRAINT "fk_character_last_settlement" FOREIGN KEY ("last_settlement_id") REFERENCES "public"."world_nodes"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."dialogue_trees"
    ADD CONSTRAINT "fk_dialogue_tree_npc" FOREIGN KEY ("npc_id") REFERENCES "public"."npcs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."npcs"
    ADD CONSTRAINT "fk_npc_dialogue_tree" FOREIGN KEY ("dialogue_tree_id") REFERENCES "public"."dialogue_trees"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."node_connections"
    ADD CONSTRAINT "node_connections_from_node_id_fkey" FOREIGN KEY ("from_node_id") REFERENCES "public"."world_nodes"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."node_connections"
    ADD CONSTRAINT "node_connections_to_node_id_fkey" FOREIGN KEY ("to_node_id") REFERENCES "public"."world_nodes"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."npcs"
    ADD CONSTRAINT "npcs_node_id_fkey" FOREIGN KEY ("node_id") REFERENCES "public"."world_nodes"("id");



ALTER TABLE ONLY "public"."quest_steps"
    ADD CONSTRAINT "quest_steps_quest_id_fkey" FOREIGN KEY ("quest_id") REFERENCES "public"."quests"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."quests"
    ADD CONSTRAINT "quests_giver_npc_id_fkey" FOREIGN KEY ("giver_npc_id") REFERENCES "public"."npcs"("id");



ALTER TABLE ONLY "public"."world_events"
    ADD CONSTRAINT "world_events_node_id_fkey" FOREIGN KEY ("node_id") REFERENCES "public"."world_nodes"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."world_nodes"
    ADD CONSTRAINT "world_nodes_parent_node_id_fkey" FOREIGN KEY ("parent_node_id") REFERENCES "public"."world_nodes"("id") ON DELETE SET NULL;



CREATE POLICY "Authenticated users can view sessions" ON "public"."character_sessions" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Dialogue nodes are viewable by everyone" ON "public"."dialogue_nodes" FOR SELECT USING (true);



CREATE POLICY "Dialogue options are viewable by everyone" ON "public"."dialogue_options" FOR SELECT USING (true);



CREATE POLICY "Dialogue trees are viewable by everyone" ON "public"."dialogue_trees" FOR SELECT USING (true);



CREATE POLICY "Items are viewable by everyone" ON "public"."items" FOR SELECT USING (true);



CREATE POLICY "NPCs are viewable by everyone" ON "public"."npcs" FOR SELECT USING (true);



CREATE POLICY "Node connections are viewable by everyone" ON "public"."node_connections" FOR SELECT USING (true);



CREATE POLICY "Quest steps are viewable by everyone" ON "public"."quest_steps" FOR SELECT USING (true);



CREATE POLICY "Quests are viewable by everyone" ON "public"."quests" FOR SELECT USING (true);



CREATE POLICY "Service role has full access to sessions" ON "public"."character_sessions" USING (true) WITH CHECK (true);



CREATE POLICY "Users can manage own session" ON "public"."character_sessions" USING (("character_id" IN ( SELECT "characters"."id"
   FROM "public"."characters"
  WHERE ("characters"."account_id" = "auth"."uid"()))));



CREATE POLICY "Users can update own account" ON "public"."accounts" FOR UPDATE USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can update own quest notes" ON "public"."character_quests" FOR UPDATE USING (("character_id" IN ( SELECT "characters"."id"
   FROM "public"."characters"
  WHERE ("characters"."account_id" = "auth"."uid"()))));



CREATE POLICY "Users can view own account" ON "public"."accounts" FOR SELECT USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can view own character attributes" ON "public"."character_attributes" FOR SELECT USING (("character_id" IN ( SELECT "characters"."id"
   FROM "public"."characters"
  WHERE ("characters"."account_id" = "auth"."uid"()))));



CREATE POLICY "Users can view own character derived" ON "public"."character_derived" FOR SELECT USING (("character_id" IN ( SELECT "characters"."id"
   FROM "public"."characters"
  WHERE ("characters"."account_id" = "auth"."uid"()))));



CREATE POLICY "Users can view own character skills" ON "public"."character_skills" FOR SELECT USING (("character_id" IN ( SELECT "characters"."id"
   FROM "public"."characters"
  WHERE ("characters"."account_id" = "auth"."uid"()))));



CREATE POLICY "Users can view own characters" ON "public"."characters" FOR SELECT USING (("account_id" = "auth"."uid"()));



CREATE POLICY "Users can view own combat sessions" ON "public"."combat_sessions" FOR SELECT USING (("character_id" IN ( SELECT "characters"."id"
   FROM "public"."characters"
  WHERE ("characters"."account_id" = "auth"."uid"()))));



CREATE POLICY "Users can view own combat turns" ON "public"."combat_turns" FOR SELECT USING (("session_id" IN ( SELECT "combat_sessions"."id"
   FROM "public"."combat_sessions"
  WHERE ("combat_sessions"."character_id" IN ( SELECT "characters"."id"
           FROM "public"."characters"
          WHERE ("characters"."account_id" = "auth"."uid"()))))));



CREATE POLICY "Users can view own discovered nodes" ON "public"."character_discovered_nodes" FOR SELECT USING (("character_id" IN ( SELECT "characters"."id"
   FROM "public"."characters"
  WHERE ("characters"."account_id" = "auth"."uid"()))));



CREATE POLICY "Users can view own documents" ON "public"."character_documents" FOR SELECT USING (("character_id" IN ( SELECT "characters"."id"
   FROM "public"."characters"
  WHERE ("characters"."account_id" = "auth"."uid"()))));



CREATE POLICY "Users can view own exploration attempts" ON "public"."exploration_attempts" FOR SELECT USING (("character_id" IN ( SELECT "characters"."id"
   FROM "public"."characters"
  WHERE ("characters"."account_id" = "auth"."uid"()))));



CREATE POLICY "Users can view own inventory" ON "public"."character_inventory" FOR SELECT USING (("character_id" IN ( SELECT "characters"."id"
   FROM "public"."characters"
  WHERE ("characters"."account_id" = "auth"."uid"()))));



CREATE POLICY "Users can view own quests" ON "public"."character_quests" FOR SELECT USING (("character_id" IN ( SELECT "characters"."id"
   FROM "public"."characters"
  WHERE ("characters"."account_id" = "auth"."uid"()))));



CREATE POLICY "Users can view own status effects" ON "public"."character_status_effects" FOR SELECT USING (("character_id" IN ( SELECT "characters"."id"
   FROM "public"."characters"
  WHERE ("characters"."account_id" = "auth"."uid"()))));



CREATE POLICY "World clock is viewable by everyone" ON "public"."world_clock" FOR SELECT USING (true);



CREATE POLICY "World events are viewable by everyone" ON "public"."world_events" FOR SELECT USING (true);



CREATE POLICY "World nodes are viewable by everyone" ON "public"."world_nodes" FOR SELECT USING (true);



ALTER TABLE "public"."accounts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."character_attributes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."character_derived" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."character_discovered_nodes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."character_documents" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."character_inventory" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."character_quests" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."character_sessions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."character_skills" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."character_status_effects" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."characters" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."combat_sessions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."combat_turns" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."dialogue_nodes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."dialogue_options" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."dialogue_trees" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."exploration_attempts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."node_connections" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."npcs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."quest_steps" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."quests" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."world_clock" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."world_events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."world_nodes" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";






















































































































































GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "anon";
GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "service_role";


















GRANT ALL ON TABLE "public"."accounts" TO "anon";
GRANT ALL ON TABLE "public"."accounts" TO "authenticated";
GRANT ALL ON TABLE "public"."accounts" TO "service_role";



GRANT ALL ON TABLE "public"."character_attributes" TO "anon";
GRANT ALL ON TABLE "public"."character_attributes" TO "authenticated";
GRANT ALL ON TABLE "public"."character_attributes" TO "service_role";



GRANT ALL ON TABLE "public"."character_derived" TO "anon";
GRANT ALL ON TABLE "public"."character_derived" TO "authenticated";
GRANT ALL ON TABLE "public"."character_derived" TO "service_role";



GRANT ALL ON TABLE "public"."character_discovered_nodes" TO "anon";
GRANT ALL ON TABLE "public"."character_discovered_nodes" TO "authenticated";
GRANT ALL ON TABLE "public"."character_discovered_nodes" TO "service_role";



GRANT ALL ON TABLE "public"."character_documents" TO "anon";
GRANT ALL ON TABLE "public"."character_documents" TO "authenticated";
GRANT ALL ON TABLE "public"."character_documents" TO "service_role";



GRANT ALL ON TABLE "public"."character_inventory" TO "anon";
GRANT ALL ON TABLE "public"."character_inventory" TO "authenticated";
GRANT ALL ON TABLE "public"."character_inventory" TO "service_role";



GRANT ALL ON TABLE "public"."character_quests" TO "anon";
GRANT ALL ON TABLE "public"."character_quests" TO "authenticated";
GRANT ALL ON TABLE "public"."character_quests" TO "service_role";



GRANT ALL ON TABLE "public"."character_sessions" TO "anon";
GRANT ALL ON TABLE "public"."character_sessions" TO "authenticated";
GRANT ALL ON TABLE "public"."character_sessions" TO "service_role";



GRANT ALL ON TABLE "public"."character_skills" TO "anon";
GRANT ALL ON TABLE "public"."character_skills" TO "authenticated";
GRANT ALL ON TABLE "public"."character_skills" TO "service_role";



GRANT ALL ON TABLE "public"."character_status_effects" TO "anon";
GRANT ALL ON TABLE "public"."character_status_effects" TO "authenticated";
GRANT ALL ON TABLE "public"."character_status_effects" TO "service_role";



GRANT ALL ON TABLE "public"."characters" TO "anon";
GRANT ALL ON TABLE "public"."characters" TO "authenticated";
GRANT ALL ON TABLE "public"."characters" TO "service_role";



GRANT ALL ON TABLE "public"."combat_sessions" TO "anon";
GRANT ALL ON TABLE "public"."combat_sessions" TO "authenticated";
GRANT ALL ON TABLE "public"."combat_sessions" TO "service_role";



GRANT ALL ON TABLE "public"."combat_turns" TO "anon";
GRANT ALL ON TABLE "public"."combat_turns" TO "authenticated";
GRANT ALL ON TABLE "public"."combat_turns" TO "service_role";



GRANT ALL ON TABLE "public"."dialogue_nodes" TO "anon";
GRANT ALL ON TABLE "public"."dialogue_nodes" TO "authenticated";
GRANT ALL ON TABLE "public"."dialogue_nodes" TO "service_role";



GRANT ALL ON TABLE "public"."dialogue_options" TO "anon";
GRANT ALL ON TABLE "public"."dialogue_options" TO "authenticated";
GRANT ALL ON TABLE "public"."dialogue_options" TO "service_role";



GRANT ALL ON TABLE "public"."dialogue_trees" TO "anon";
GRANT ALL ON TABLE "public"."dialogue_trees" TO "authenticated";
GRANT ALL ON TABLE "public"."dialogue_trees" TO "service_role";



GRANT ALL ON TABLE "public"."exploration_attempts" TO "anon";
GRANT ALL ON TABLE "public"."exploration_attempts" TO "authenticated";
GRANT ALL ON TABLE "public"."exploration_attempts" TO "service_role";



GRANT ALL ON TABLE "public"."items" TO "anon";
GRANT ALL ON TABLE "public"."items" TO "authenticated";
GRANT ALL ON TABLE "public"."items" TO "service_role";



GRANT ALL ON TABLE "public"."node_connections" TO "anon";
GRANT ALL ON TABLE "public"."node_connections" TO "authenticated";
GRANT ALL ON TABLE "public"."node_connections" TO "service_role";



GRANT ALL ON TABLE "public"."npcs" TO "anon";
GRANT ALL ON TABLE "public"."npcs" TO "authenticated";
GRANT ALL ON TABLE "public"."npcs" TO "service_role";



GRANT ALL ON TABLE "public"."quest_steps" TO "anon";
GRANT ALL ON TABLE "public"."quest_steps" TO "authenticated";
GRANT ALL ON TABLE "public"."quest_steps" TO "service_role";



GRANT ALL ON TABLE "public"."quests" TO "anon";
GRANT ALL ON TABLE "public"."quests" TO "authenticated";
GRANT ALL ON TABLE "public"."quests" TO "service_role";



GRANT ALL ON TABLE "public"."world_clock" TO "anon";
GRANT ALL ON TABLE "public"."world_clock" TO "authenticated";
GRANT ALL ON TABLE "public"."world_clock" TO "service_role";



GRANT ALL ON TABLE "public"."world_events" TO "anon";
GRANT ALL ON TABLE "public"."world_events" TO "authenticated";
GRANT ALL ON TABLE "public"."world_events" TO "service_role";



GRANT ALL ON TABLE "public"."world_nodes" TO "anon";
GRANT ALL ON TABLE "public"."world_nodes" TO "authenticated";
GRANT ALL ON TABLE "public"."world_nodes" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";



































drop extension if exists "pg_net";

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


