// Economia básica — backlog (Volume IV). Preços e estoque do vendedor.
// Sem tabela nova: o estoque de venda é config em código; a compra do jogador
// (vender itens) aceita qualquer item com base_value > 0.
//
// Regras de preço:
//   VENDER (jogador -> NPC): recebe floor(base_value * SELL_RATE) por unidade.
//     moeda_antiga é dinheiro pré-Cataclisma: paga base_value CHEIO (rate 1.0).
//   COMPRAR (NPC -> jogador): paga floor(base_value * BUY_MARKUP) por unidade,
//     apenas itens do estoque do vendedor.

const SELL_RATE = 0.5;    // o jogador recebe 50% do valor base ao vender
const BUY_MARKUP = 1.5;   // o jogador paga 150% do valor base ao comprar

// Estoque do vendedor (consumíveis úteis no começo). Slugs devem existir em items.
const VENDOR_STOCK = [
  'pocao_cura', 'frasco_veneno', 'granada_quimica', 'granada_gas',
];

// Preço de venda (jogador vende um item e recebe currency).
function sellPrice(item, quantity = 1) {
  if (!item) return 0;
  const base = item.base_value || 0;
  const rate = item.slug === 'moeda_antiga' ? 1.0 : SELL_RATE;
  return Math.max(0, Math.floor(base * rate) * Math.max(1, quantity));
}

// Preço de compra (jogador compra um item do estoque e paga currency).
function buyPrice(item, quantity = 1) {
  if (!item) return 0;
  const base = item.base_value || 0;
  return Math.max(0, Math.ceil(base * BUY_MARKUP) * Math.max(1, quantity));
}

function isInStock(slug) {
  return VENDOR_STOCK.includes(slug);
}

module.exports = { SELL_RATE, BUY_MARKUP, VENDOR_STOCK, sellPrice, buyPrice, isInStock };
