-- Spec 2 — Fluxo de derrota (ajuste pós-teste). Ponto(s) de respawn salvos
-- explicitamente pelo jogador (botão "Salvar" na cidade).
-- Guardamos o HISTÓRICO dos últimos 10 pontos salvos (mais recente primeiro)
-- em jsonb: [{ "node_id": "...", "saved_at": "ISO" }, ...].
-- O respawn usa o mais recente (índice 0). Se vazio, respawn em Ironfall.

ALTER TABLE "public"."characters"
  ADD COLUMN IF NOT EXISTS "respawn_points" "jsonb" NOT NULL DEFAULT '[]'::"jsonb";
