-- Spec 3 — Inventário. Sub-parte A. Novas colunas em items.
-- Ver .kiro/specs/inventario/design.md §1.1.
--
-- base_value    : valor base para a economia futura (moeda/loja 🔮). Sem venda agora.
-- is_stackable  : consumíveis/recursos empilham em character_inventory; equipáveis não.
-- is_corrupted  : 🔮 flag de item Corrompido (mecânica de camadas avançadas). Inerte.
-- corruption    : 🔮 penalidades/mutação do item Corrompido. Inerte no MVP.
--                 Ex. futuro: { "mods": { "evasion": -4 }, "mutation_per_turn": 1 }

ALTER TABLE "public"."items"
  ADD COLUMN IF NOT EXISTS "base_value"   integer NOT NULL DEFAULT 0;

ALTER TABLE "public"."items"
  ADD COLUMN IF NOT EXISTS "is_stackable" boolean NOT NULL DEFAULT false;

ALTER TABLE "public"."items"
  ADD COLUMN IF NOT EXISTS "is_corrupted" boolean NOT NULL DEFAULT false;

ALTER TABLE "public"."items"
  ADD COLUMN IF NOT EXISTS "corruption"   "jsonb" NOT NULL DEFAULT '{}'::"jsonb";
