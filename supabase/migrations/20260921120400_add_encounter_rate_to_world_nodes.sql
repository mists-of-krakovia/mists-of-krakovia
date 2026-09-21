-- Spec 2 — Combate. Sub-parte A. Taxa base de encontro ao mover, por nó.
-- Governa o spawn ao mover (fica atrás de flag no backend). Ver design.md §1.7.

ALTER TABLE "public"."world_nodes"
  ADD COLUMN IF NOT EXISTS "encounter_rate" numeric(4,3) NOT NULL DEFAULT 0;

-- Backfill por tipo de nó (calibrável depois, nó a nó):
--   passage (rotas/estradas): 0.10 | field (zona inicial/campos): 0.25
--   mist: 0.40 | settlement: 0 (seguro) | secret: 0
UPDATE "public"."world_nodes" SET "encounter_rate" = 0.10 WHERE "node_type" = 'passage';
UPDATE "public"."world_nodes" SET "encounter_rate" = 0.25 WHERE "node_type" = 'field';
UPDATE "public"."world_nodes" SET "encounter_rate" = 0.40 WHERE "node_type" = 'mist';
UPDATE "public"."world_nodes" SET "encounter_rate" = 0    WHERE "node_type" IN ('settlement', 'secret');
