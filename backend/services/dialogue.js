// Motor de diálogo por palavras-chave + intenção — Spec 4 (Diálogos).
// Ver .kiro/specs/dialogos/design.md §2. Funções puras (sem rede).
//
// Fluxo: normalize(entrada) -> detectIntent (casa palavras-chave do léxico, com
// tolerância a erros de digitação por Levenshtein) -> pickReply (sorteia uma
// variação da resposta do NPC para aquela intenção, respeitando a confiança).

const { LEXICON, INTENT_PRIORITY } = require('./dialogueLexicon');

// Fallback global quando o NPC não tem resposta nem para DESCONHECIDO.
const GLOBAL_FALLBACK = 'O NPC apenas encara você em silêncio.';
const LEV_MIN_LEN = 4;   // só aplica tolerância de digitação a tokens >= 4 letras
const LEV_MAX_DIST = 2;  // distância de Levenshtein máxima para casar

// ─── Normalização ─────────────────────────────────────────────────────────────
// minúsculas, remove acentos (NFD + strip diacríticos), remove pontuação, colapsa
// espaços. Determinística e igual para o léxico e para a entrada do jogador.
function normalize(text) {
  if (!text) return '';
  return String(text)
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // remove acentos
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')                     // remove pontuação/símbolos
    .replace(/\s+/g, ' ')
    .trim();
}

// ─── Levenshtein (iterativo, O(n*m)) ────────────────────────────────────────────
function levenshtein(a, b) {
  if (a === b) return 0;
  const al = a.length, bl = b.length;
  if (al === 0) return bl;
  if (bl === 0) return al;
  let prev = new Array(bl + 1);
  for (let j = 0; j <= bl; j++) prev[j] = j;
  for (let i = 1; i <= al; i++) {
    let cur = [i];
    for (let j = 1; j <= bl; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost);
    }
    prev = cur;
  }
  return prev[bl];
}

// Um token do jogador casa uma palavra de keyword? (igualdade, ou Levenshtein<=2
// para tokens longos — tolera erro de digitação sem confundir palavras curtas).
// `fuzzy=false` desabilita a tolerância (usado por OBSCENO, para não gerar falsos
// positivos: "fala"~"foda", "nevoa" perto de palavrões, etc.).
function tokenMatches(inputToken, keyToken, fuzzy = true) {
  if (inputToken === keyToken) return true;
  if (fuzzy && inputToken.length >= LEV_MIN_LEN && keyToken.length >= LEV_MIN_LEN) {
    return levenshtein(inputToken, keyToken) <= LEV_MAX_DIST;
  }
  return false;
}

// A keyword (que pode ser multi-palavra, ex.: "bom dia") aparece na entrada?
// Para keyword de 1 palavra: algum token da entrada casa. Para multi-palavra:
// a sequência de tokens aparece consecutiva (cada par casando com tolerância).
function keywordInInput(inputTokens, keyword, fuzzy = true) {
  const keyTokens = keyword.split(' ');
  if (keyTokens.length === 1) {
    return inputTokens.some((t) => tokenMatches(t, keyTokens[0], fuzzy));
  }
  // multi-palavra: procura subsequência consecutiva
  for (let i = 0; i + keyTokens.length <= inputTokens.length; i++) {
    let ok = true;
    for (let k = 0; k < keyTokens.length; k++) {
      if (!tokenMatches(inputTokens[i + k], keyTokens[k], fuzzy)) { ok = false; break; }
    }
    if (ok) return true;
  }
  return false;
}

// ─── Detecção de intenção ───────────────────────────────────────────────────────
// Retorna a intenção (string). Conta evidências por intenção; OBSCENO domina;
// desempate por INTENT_PRIORITY; zero evidência -> 'DESCONHECIDO'.
function detectIntent(text, locale = 'pt') {
  const lex = LEXICON[locale] || LEXICON.pt || {};
  const norm = normalize(text);
  if (!norm) return 'DESCONHECIDO';
  const inputTokens = norm.split(' ');

  const scores = {};
  for (const intent of Object.keys(lex)) {
    // OBSCENO casa por igualdade exata (sem tolerância): palavrões são curtos e a
    // fuzziness geraria falsos positivos (ex.: "fala"~"foda", "nevoa" perto de xingamentos).
    const fuzzy = intent !== 'OBSCENO';
    let score = 0;
    for (const kw of lex[intent]) {
      if (keywordInInput(inputTokens, kw, fuzzy)) {
        // keywords multi-palavra valem mais (mais específicas).
        score += kw.includes(' ') ? 2 : 1;
      }
    }
    if (score > 0) scores[intent] = score;
  }

  if (Object.keys(scores).length === 0) return 'DESCONHECIDO';
  // OBSCENO tem prioridade absoluta se pontuou.
  if (scores.OBSCENO) return 'OBSCENO';

  // Intenções "genéricas" (conversa fiada) cedem a qualquer intenção "de tópico"
  // concreta que também tenha pontuado. Ex.: "o que sabe sobre krakovia" -> KRAKOVIA
  // (tópico), não RUMORES (genérico), mesmo que RUMORES tenha score maior.
  const GENERIC = new Set(['RUMORES', 'SAUDACAO', 'DESPEDIDA']);
  const topicScores = {};
  for (const intent of Object.keys(scores)) {
    if (!GENERIC.has(intent)) topicScores[intent] = scores[intent];
  }
  const pool = Object.keys(topicScores).length > 0 ? topicScores : scores;

  // maior score dentro do pool; empate resolvido por INTENT_PRIORITY.
  let best = null, bestScore = -1;
  for (const intent of Object.keys(pool)) {
    const s = pool[intent];
    if (s > bestScore) { best = intent; bestScore = s; }
    else if (s === bestScore) {
      const pi = INTENT_PRIORITY.indexOf(intent);
      const pb = INTENT_PRIORITY.indexOf(best);
      if (pi !== -1 && (pb === -1 || pi < pb)) best = intent;
    }
  }
  return best || 'DESCONHECIDO';
}

// ─── Escolha da resposta ─────────────────────────────────────────────────────────
// dialogueRows: linhas de npc_dialogue do NPC (no locale). intent: intenção detectada.
// trust: confiança do personagem (0..100). Retorna uma string de resposta.
// Regra: junta as variants das linhas da intenção com min_confidence <= trust;
// sorteia uma. Se a intenção não tem resposta elegível, cai para DESCONHECIDO do
// NPC; se nem isso, GLOBAL_FALLBACK.
function pickReply(dialogueRows, intent, trust = 100) {
  const eligible = (rows, wantIntent) => {
    const variants = [];
    for (const r of rows || []) {
      if (r.intent !== wantIntent) continue;
      if ((r.min_confidence || 0) > trust) continue;
      for (const v of r.variants || []) variants.push(v);
    }
    return variants;
  };

  let variants = eligible(dialogueRows, intent);
  if (variants.length === 0 && intent !== 'DESCONHECIDO') {
    variants = eligible(dialogueRows, 'DESCONHECIDO');
  }
  if (variants.length === 0) return GLOBAL_FALLBACK;
  return variants[Math.floor(Math.random() * variants.length)];
}

module.exports = {
  normalize, levenshtein, detectIntent, pickReply,
  GLOBAL_FALLBACK,
};
