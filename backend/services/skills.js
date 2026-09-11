// Lógica de perícias (skills). Perícia != Habilidade de classe.
// Referência: docs/mists_of_krakovia_gameplay_v1.pdf (Volume III).

const { mgOf } = require('./character');

// Perícias de combate iniciais por classe, em nível 2 (Volume III / V).
const INITIAL_SKILLS_BY_CLASS = {
  vagante_nevoas:  ['armas_brancas_leves', 'armas_fogo_leves', 'armaduras_leves'],
  arauto_conclave: ['dispositivos_combate', 'armaduras_leves', 'medicina_combate'],
  exilado_ferro:   ['armas_brancas_pesadas', 'armaduras_pesadas', 'escudos_bloqueio'],
  confessor_veu:   ['medicina_combate', 'armaduras_leves', 'armas_brancas_leves'],
  cronista_ruinas: ['armas_fogo_leves', 'armaduras_leves', 'combate_desarmado'],
};

const INITIAL_SKILL_LEVEL = 2;
const MAX_SKILL_LEVEL = 10;
const INITIAL_COMBAT_POINTS = 3;

// Pontos de perícia de campo iniciais: 1 + MG do Intelecto.
function initialFieldPoints(intellectValue) {
  return 1 + mgOf(intellectValue);
}

// Verifica se os atributos atendem o requisito de MG de uma perícia do catálogo.
// Perícias híbridas (base_attr_alt) passam se QUALQUER um dos atributos atende.
function meetsAttrRequirement(catalogRow, attributes) {
  const req = catalogRow.attr_mg_req || 0;
  if (req <= 0) return true;
  const a = mgOf(attributes[catalogRow.base_attr] ?? 0);
  const b = catalogRow.base_attr_alt ? mgOf(attributes[catalogRow.base_attr_alt] ?? 0) : 0;
  return Math.max(a, b) >= req;
}

// Índice slug -> linha do catálogo.
function indexCatalog(catalog) {
  const byslug = {};
  for (const row of catalog) byslug[row.slug] = row;
  return byslug;
}

/**
 * Valida uma alocação de pontos de perícia.
 *
 * @param catalog  linhas de skills_catalog
 * @param attributes  atributos FINAIS do personagem (valores 1..21)
 * @param currentLevels  mapa slug -> nível atual (para respeitar teto e iniciais)
 * @param alloc  { field: { slug: pts }, combat: { slug: pts } } (deltas >= 0)
 * @param available  { field: n, combat: n } pontos disponíveis
 * @returns { ok, error, applied: [{slug, skill_type, delta, newLevel}], spent:{field,combat} }
 */
function validateAllocation({ catalog, attributes, currentLevels, alloc, available }) {
  const byslug = indexCatalog(catalog);
  const applied = [];
  const spent = { field: 0, combat: 0 };

  for (const type of ['field', 'combat']) {
    const group = alloc?.[type] || {};
    for (const [slug, rawPts] of Object.entries(group)) {
      const pts = Number(rawPts) || 0;
      if (pts === 0) continue;
      if (!Number.isInteger(pts) || pts < 0) {
        return { ok: false, error: `Pontos inválidos para ${slug}.` };
      }
      const row = byslug[slug];
      if (!row) return { ok: false, error: `Perícia desconhecida: ${slug}.` };
      if (row.skill_type !== type) {
        return { ok: false, error: `Perícia ${slug} não é do tipo ${type}.` };
      }
      if (!meetsAttrRequirement(row, attributes)) {
        return { ok: false, error: `Requisito de atributo não atendido para ${row.name}.` };
      }
      const current = currentLevels?.[slug] ?? 0;
      const newLevel = current + pts;
      if (newLevel > MAX_SKILL_LEVEL) {
        return { ok: false, error: `${row.name} excede o nível máximo (${MAX_SKILL_LEVEL}).` };
      }
      spent[type] += pts;
      applied.push({ slug, skill_type: type, delta: pts, newLevel });
    }
  }

  if (spent.field > (available?.field ?? 0)) {
    return { ok: false, error: 'Pontos de perícia de campo insuficientes.' };
  }
  if (spent.combat > (available?.combat ?? 0)) {
    return { ok: false, error: 'Pontos de perícia de combate insuficientes.' };
  }

  return { ok: true, applied, spent };
}

module.exports = {
  INITIAL_SKILLS_BY_CLASS,
  INITIAL_SKILL_LEVEL,
  MAX_SKILL_LEVEL,
  INITIAL_COMBAT_POINTS,
  initialFieldPoints,
  meetsAttrRequirement,
  validateAllocation,
  indexCatalog,
};
