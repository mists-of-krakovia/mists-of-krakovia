-- Pontos de perícia disponíveis para distribuir (na criação e por progressão).
-- Campo: 1 + MG_INT por nível; Combate: 3 na criação + 1/nível (Volume III).
-- Distribuídos na página de Perícias in-game.

ALTER TABLE "public"."character_attributes"
  ADD COLUMN IF NOT EXISTS "field_skill_points" integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "combat_skill_points" integer NOT NULL DEFAULT 0;
