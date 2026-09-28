-- Economia básica: marca NPCs vendedores. Ver docs/md/volume-iv (economia).
-- Aditivo, default false (NPCs existentes não são vendedores).

ALTER TABLE "public"."npcs"
  ADD COLUMN IF NOT EXISTS "is_vendor" boolean NOT NULL DEFAULT false;
