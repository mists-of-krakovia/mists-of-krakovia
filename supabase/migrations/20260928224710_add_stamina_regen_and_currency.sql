-- Backlog: regeneração de estamina + economia básica.
-- Ver docs/md/volume-iii (estamina) e volume-iv (economia).
--
-- stamina_updated_at: marca temporal usada para calcular a regeneração de estamina
--   baseada em tempo decorrido (sem cron). Default now() para personagens novos;
--   para os existentes, o backfill usa now() (começam a regenerar a partir de agora).
-- currency: moeda de jogo do personagem (economia). moeda_antiga continua sendo um
--   ITEM (tesouro), convertido em currency ao vender no NPC vendedor.

ALTER TABLE "public"."characters"
  ADD COLUMN IF NOT EXISTS "stamina_updated_at" timestamp with time zone NOT NULL DEFAULT "now"();

ALTER TABLE "public"."characters"
  ADD COLUMN IF NOT EXISTS "currency" integer NOT NULL DEFAULT 0;
