-- Catálogo de perícias do jogo (fonte única, data-driven).
-- Perícias (skills) != Habilidades de classe. Ver .kiro/specs/pericias.
-- Referência: docs/mists_of_krakovia_gameplay_v1.pdf (Volume III — Perícias).

CREATE TABLE IF NOT EXISTS "public"."skills_catalog" (
  "slug"              character varying(50) NOT NULL,
  "name"              character varying(100) NOT NULL,
  "skill_type"        "public"."skill_type" NOT NULL,   -- 'field' | 'combat'
  "base_attr"         character varying(20) NOT NULL,   -- strength|agility|resistance|intellect|perception|sanity
  "base_attr_alt"     character varying(20),             -- 2º atributo p/ perícias híbridas (ex.: FOR/AGI)
  "requires_training" boolean NOT NULL DEFAULT false,    -- perícias de campo marcadas com '*'
  "attr_mg_req"       integer NOT NULL DEFAULT 0,        -- requisito de MG do atributo base (0 = nenhum)
  "sort_order"        integer NOT NULL DEFAULT 0,
  CONSTRAINT "skills_catalog_pkey" PRIMARY KEY ("slug")
);

ALTER TABLE "public"."skills_catalog" OWNER TO "postgres";

ALTER TABLE "public"."skills_catalog" ENABLE ROW LEVEL SECURITY;

-- Catálogo é conteúdo público do mundo: leitura liberada (mesmo padrão de items/npcs).
CREATE POLICY "Skills catalog is viewable by everyone"
  ON "public"."skills_catalog" FOR SELECT USING (true);

GRANT ALL ON TABLE "public"."skills_catalog" TO "anon";
GRANT ALL ON TABLE "public"."skills_catalog" TO "authenticated";
GRANT ALL ON TABLE "public"."skills_catalog" TO "service_role";
