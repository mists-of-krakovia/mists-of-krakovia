-- Spec 2 — Sub-parte B. Catálogo de habilidades de classe (Volume V).
-- Habilidade != Perícia: habilidades são poderes de classe com cooldown,
-- desbloqueados por nível e com requisito de perícia. Ver design.md §2.6.
-- Fonte: docs/mists_of_krakovia_classes_v2.pdf (Volume V).

CREATE TABLE IF NOT EXISTS "public"."abilities_catalog" (
  "slug"          character varying(60) NOT NULL,
  "class_key"     "public"."character_class" NOT NULL,
  "name"          character varying(100) NOT NULL,
  "kind"          character varying(20) NOT NULL,   -- offensive|control|support|mobility|reactive|passive
  "unlock_level"  integer NOT NULL DEFAULT 1,
  "req_skill"     character varying(50),            -- slug de perícia requerida (opcional)
  "req_skill_level" integer NOT NULL DEFAULT 0,
  "cooldown_base" integer NOT NULL DEFAULT 0,       -- turnos (0 = passiva)
  "is_ultimate"   boolean NOT NULL DEFAULT false,
  "is_passive"    boolean NOT NULL DEFAULT false,
  "target"        character varying(20) NOT NULL DEFAULT 'enemy', -- enemy|self|ally|none
  "effect"        "jsonb" NOT NULL DEFAULT '{}'::"jsonb",  -- parâmetros resolvidos pelo motor
  "description"   "text",
  "sort_order"    integer NOT NULL DEFAULT 0,
  CONSTRAINT "abilities_catalog_pkey" PRIMARY KEY ("slug")
);
ALTER TABLE "public"."abilities_catalog" OWNER TO "postgres";

ALTER TABLE "public"."abilities_catalog" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Abilities catalog is viewable by everyone"
  ON "public"."abilities_catalog" FOR SELECT USING (true);

GRANT ALL ON TABLE "public"."abilities_catalog" TO "anon";
GRANT ALL ON TABLE "public"."abilities_catalog" TO "authenticated";
GRANT ALL ON TABLE "public"."abilities_catalog" TO "service_role";

CREATE INDEX IF NOT EXISTS "abilities_catalog_class_idx"
  ON "public"."abilities_catalog" ("class_key");
