-- Spec 2 — Combate/Progressão (ajuste pós-teste). Bônus de derivados ganho por
-- subir de nível, guardado SEPARADO da fórmula base (design decisão A).
-- O derivado final exibido = fórmula(atributos) + level_bonus. Guardar separado
-- evita que a redistribuição de atributos (que recalcula os derivados) apague o
-- ganho de progressão. O jogador vê só o total.
-- Ver .kiro/specs/combate/design.md §2.5.

ALTER TABLE "public"."character_derived"
  ADD COLUMN IF NOT EXISTS "level_bonus" "jsonb" NOT NULL DEFAULT '{}'::"jsonb";

-- Chaves esperadas em level_bonus (todas inteiras, acumuladas por nível):
--   hp_max, attack_melee, attack_ranged, defense, speed, stamina_max,
--   accuracy, evasion, mental_resistance, carry_capacity
