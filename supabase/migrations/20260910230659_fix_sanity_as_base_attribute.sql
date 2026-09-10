-- Sanidade passa a ser o 6º atributo base (decisão de design confirmada).
--
-- Antes: sanity tinha DEFAULT 0, o que violava o próprio CHECK (sanity >= 1),
-- e um comentário dizia que era derivada de INT + PER. Agora Sanidade é um
-- atributo base investível como os demais: valor base 5 (grau E), 1..21.
--
-- Referência: docs/mists_of_krakovia_gameplay_v1.pdf (Volume III — Atributos Base)
-- e docs/mists_of_krakovia_classes_v2.pdf (Confessor do Véu — Sanidade primária).

ALTER TABLE "public"."character_attributes"
  ALTER COLUMN "sanity" SET DEFAULT 5;

COMMENT ON COLUMN "public"."character_attributes"."sanity" IS
  'Atributo base (6º). Escala 1..21 (grau F- a S+). Base para Resistência Mental (MP_SAN x 3) e Resistência à Névoa (MP_SAN x 2).';
