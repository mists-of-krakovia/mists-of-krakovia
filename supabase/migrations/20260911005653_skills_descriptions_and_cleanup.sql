-- Perícias: adiciona coluna de descrição e remove "Armas Brancas Industriais"
-- (decisão: substituída/absorvida por Armas Brancas Leves).

ALTER TABLE "public"."skills_catalog"
  ADD COLUMN IF NOT EXISTS "description" text;

-- Remove a perícia industrial do catálogo e quaisquer instâncias em personagens.
DELETE FROM "public"."character_skills" WHERE "skill_name" = 'armas_brancas_industriais';
DELETE FROM "public"."skills_catalog"   WHERE "slug" = 'armas_brancas_industriais';
