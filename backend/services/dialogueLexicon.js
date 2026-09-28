// Léxico de intenções por locale — Spec 4 (Diálogos).
// Ver .kiro/specs/dialogos/design.md §1.3.
//
// Dado versionado (não vai para o banco): são as palavras-chave que o motor usa
// para detectar a INTENÇÃO do que o jogador digitou. Organizado por locale para
// i18n: `pt` completo agora; `en` fica como estrutura vazia (plugável depois sem
// mexer no motor). As chaves já devem estar NORMALIZADAS (minúsculas, sem acento),
// pois o motor normaliza a entrada do jogador da mesma forma antes de casar.

const LEXICON = {
  pt: {
    // Prioridade alta: easter egg. Palavrões comuns (normalizados, sem acento).
    OBSCENO: [
      'merda', 'porra', 'caralho', 'buceta', 'foda', 'foder', 'fodase', 'fdp',
      'puta', 'puta que pariu', 'desgraca', 'cacete', 'cu', 'viado', 'vsf',
      'vai se foder', 'vai tomar no cu', 'arrombado', 'corno', 'piroca', 'bosta',
    ],
    SOBRE_NPC: [
      'quem e voce', 'quem es', 'seu nome', 'qual seu nome', 'o que faz',
      'o que voce faz', 'quem e', 'voce quem e', 'se apresente',
    ],
    MISSAO: [
      'missao', 'trabalho', 'tarefa', 'servico', 'ajuda', 'preciso de ajuda',
      'o que fazer', 'algo pra fazer', 'contrato', 'recompensa',
    ],
    COMERCIO: [
      'comprar', 'vender', 'loja', 'preco', 'mercadoria', 'negocio', 'troca',
      'trocar', 'comercio', 'mercado', 'quanto custa',
    ],
    FACCAO: [
      'legiao', 'conclave', 'igreja', 'veu', 'veu prateado', 'karamazov',
      'fumaca', 'fumaca negra', 'faccao', 'faccoes', 'herdeiros', 'irmandade',
    ],
    KRAKOVIA: [
      'krakovia', 'cidade', 'castelo', 'rei', 'passado', 'ruinas', 'coroa',
      'cidade grande', 'antiga cidade',
    ],
    NEVOA: [
      'nevoa', 'bruma', 'neblina', 'norte', 'a nevoa', 'fumaca fria', 'borda',
    ],
    RUMORES: [
      'noticia', 'noticias', 'rumor', 'rumores', 'novidade', 'novidades',
      'o que sabe', 'o que voce sabe', 'conte', 'fofoca', 'ouviu algo', 'segredo',
    ],
    SAUDACAO: [
      'oi', 'ola', 'bom dia', 'boa tarde', 'boa noite', 'e ai', 'eai', 'opa',
      'saudacoes', 'salve', 'hey',
    ],
    DESPEDIDA: [
      'tchau', 'adeus', 'ate logo', 'ate mais', 'falou', 'ate breve', 'xau',
      'ja vou', 'fui',
    ],
  },
  // 🔮 Inglês: estrutura pronta; preencher no futuro (o motor já aceita locale).
  en: {},
};

// Ordem de prioridade para desempate quando várias intenções pontuam igual.
// OBSCENO domina (easter egg); depois as mais específicas antes das genéricas.
const INTENT_PRIORITY = [
  'OBSCENO', 'SOBRE_NPC', 'MISSAO', 'COMERCIO', 'FACCAO', 'KRAKOVIA', 'NEVOA',
  'RUMORES', 'SAUDACAO', 'DESPEDIDA',
];

module.exports = { LEXICON, INTENT_PRIORITY };
