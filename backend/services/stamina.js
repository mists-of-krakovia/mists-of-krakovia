// Regeneração de estamina baseada em tempo — backlog (Volume III/IV).
// Sem cron: o ganho é calculado a partir do tempo decorrido desde
// characters.stamina_updated_at, na taxa do nó ONDE o personagem estava.
//
// Taxas (por minuto), fiéis ao design/PDF:
//   descansando em zona segura (settlement/safe) : 5
//   fora da névoa (field/passage/secret)         : 1
//   dentro da névoa (mist)                        : 0.5
// O ganho é acumulado em fração e só a parte inteira é aplicada; o resto se
// perde no arredondamento (aceitável — recalcula sempre a partir do timestamp).

const REGEN_PER_MIN = { rest: 5, field: 1, mist: 0.5 };

// Determina a taxa (por minuto) para um nó.
function regenRateForNode(node) {
  if (!node) return REGEN_PER_MIN.field;
  if (node.is_safe_zone || node.node_type === 'settlement') return REGEN_PER_MIN.rest;
  if (node.node_type === 'mist') return REGEN_PER_MIN.mist;
  return REGEN_PER_MIN.field;
}

// Calcula a estamina regenerada.
//   current, max: estamina atual e máxima.
//   updatedAtISO: timestamp da última atualização (characters.stamina_updated_at).
//   node: nó atual (para a taxa). nowMs: instante atual (injetável para teste).
// Retorna { stamina, regened, minutes } — stamina já limitada ao máximo.
function computeRegen(current, max, updatedAtISO, node, nowMs = Date.now()) {
  const cur = Math.max(0, current || 0);
  const cap = Math.max(0, max || 0);
  if (cur >= cap) return { stamina: cap, regened: 0, minutes: 0 };

  const last = updatedAtISO ? new Date(updatedAtISO).getTime() : nowMs;
  const elapsedMs = Math.max(0, nowMs - last);
  const minutes = elapsedMs / 60000;
  if (minutes <= 0) return { stamina: cur, regened: 0, minutes: 0 };

  const rate = regenRateForNode(node);
  const gain = Math.floor(minutes * rate);
  if (gain <= 0) return { stamina: cur, regened: 0, minutes };

  const next = Math.min(cap, cur + gain);
  return { stamina: next, regened: next - cur, minutes };
}

module.exports = { computeRegen, regenRateForNode, REGEN_PER_MIN };
