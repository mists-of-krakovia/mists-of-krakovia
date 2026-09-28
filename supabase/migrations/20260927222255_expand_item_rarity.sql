-- Spec 3 — Inventário. Sub-parte A. Expansão do enum de raridade.
-- Ver .kiro/specs/inventario/design.md §1.4.
--
-- Raridade influencia a qualidade dos atributos do equipamento. Escala final:
--   common, uncommon, rare, epic, legendary
-- Regras de obtenção (Volume IV, Parte VI-B):
--   common/uncommon/rare -> drop e/ou fabricação
--   epic      -> drop de boss + fabricação (item nomeado)
--   legendary -> só fabricação (item nomeado)
-- MVP semeia apenas common/uncommon.
--
-- Nota: o enum já tinha 'unique' (do schema inicial). Postgres não remove valor de
-- enum sem recriar o tipo; 'unique' fica ÓRFÃO (não usado). ADD VALUE é aditivo e
-- não pode rodar dentro de bloco transacional que já use o valor — statements
-- separados, idempotentes.

ALTER TYPE "public"."item_rarity" ADD VALUE IF NOT EXISTS 'epic'      AFTER 'rare';
ALTER TYPE "public"."item_rarity" ADD VALUE IF NOT EXISTS 'legendary' AFTER 'epic';
