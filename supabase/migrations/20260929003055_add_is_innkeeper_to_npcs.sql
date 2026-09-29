-- Pousada: NPC que oferece descanso (cura HP + estamina) por um custo baixo.
-- Aditivo, default false.

ALTER TABLE "public"."npcs"
  ADD COLUMN IF NOT EXISTS "is_innkeeper" boolean NOT NULL DEFAULT false;
