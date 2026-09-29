import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;


// Instância base do axios
const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' }
});

// Interceptor — adiciona o token automaticamente em toda requisição
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('krakovia_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth
export const authService = {
  register: (email, password, username) =>
    api.post('/auth/register', { email, password, username }),

  login: (email, password) =>
    api.post('/auth/login', { email, password })
};

// Personagens
export const characterService = {
  
  move: (characterId, toNodeId) =>
    api.post(`/characters/${characterId}/move`, { toNodeId }),	

  heartbeat: (characterId) =>
    api.put(`/characters/${characterId}/heartbeat`),

  goOffline: (characterId) =>
    api.put(`/characters/${characterId}/offline`),


  list: () =>
    api.get('/characters'),

  create: (name, characterClass, attributes, skills) =>
    api.post('/characters', { name, characterClass, attributes, skills }),

  enter: (characterId) =>
    api.post(`/characters/${characterId}/enter`),

  remove: (characterId) =>
    api.delete(`/characters/${characterId}`),

  allocateSkills: (characterId, alloc) =>
    api.post(`/characters/${characterId}/skills/allocate`, alloc),

  // Distribui pontos de atributo. deltas: { strength?, agility?, ... } (>= 0).
  allocateAttributes: (characterId, deltas) =>
    api.post(`/characters/${characterId}/attributes/allocate`, deltas),

  // Salva o nó atual como ponto de respawn (só em settlement).
  savePoint: (characterId) =>
    api.post(`/characters/${characterId}/save-point`),

  // Explorar área: procura uma passagem secreta no nó atual (chance por
  // Percepção + perícia Investigação).
  explore: (characterId) =>
    api.post(`/characters/${characterId}/explore`),

  // Habilidades de classe do personagem (desbloqueadas + futuras).
  abilities: (characterId) =>
    api.get(`/characters/${characterId}/abilities`)
};

// Perícias
export const skillService = {
  getCatalog: () =>
    api.get('/skills/catalog')
};

// NPCs / Diálogo / Comércio
export const npcService = {
  // Conversa: o jogador digita e o NPC responde (motor de palavras-chave).
  talk: (npcId, characterId, text, locale = 'pt') =>
    api.post(`/npcs/${npcId}/talk`, { characterId, text, locale }),

  // Loja (vendedor): estoque + saldo.
  shop: (npcId, characterId) =>
    api.get(`/npcs/${npcId}/shop`, { params: { characterId } }),

  // Vender item do inventário ao NPC.
  sell: (npcId, characterId, inventoryId, quantity = 1) =>
    api.post(`/npcs/${npcId}/sell`, { characterId, inventoryId, quantity }),

  // Comprar item do estoque do NPC.
  buy: (npcId, characterId, itemSlug, quantity = 1) =>
    api.post(`/npcs/${npcId}/buy`, { characterId, itemSlug, quantity }),

  // Descansar na pousada (cura HP + estamina por custo baixo).
  rest: (npcId, characterId) =>
    api.post(`/npcs/${npcId}/rest`, { characterId })
};

// Inventário (ações fora de combate)
export const inventoryService = {
  equip: (characterId, inventoryId) =>
    api.post(`/characters/${characterId}/inventory/equip`, { inventoryId }),

  unequip: (characterId, inventoryId) =>
    api.post(`/characters/${characterId}/inventory/unequip`, { inventoryId }),

  use: (characterId, inventoryId) =>
    api.post(`/characters/${characterId}/inventory/use`, { inventoryId }),

  discard: (characterId, inventoryId, quantity) =>
    api.post(`/characters/${characterId}/inventory/discard`, { inventoryId, quantity })
};

// Mundo
export const worldService = {
  getClock: () =>
    api.get('/world/clock'),

  getNode: (nodeId) =>
    api.get(`/world/nodes/${nodeId}`)
};

// Combate
export const combatService = {
  // Caçar: inicia um combate a partir do nó atual do personagem.
  hunt: (characterId) =>
    api.post('/combat/hunt', { characterId }),

  // Estado atual de uma sessão.
  get: (sessionId) =>
    api.get(`/combat/${sessionId}`),

  // Ação do jogador. action: 'attack' | 'pass' | 'ability'.
  // type: 'quick'|'strong' (para attack); abilitySlug (para ability).
  action: (sessionId, action, targetId, type, abilitySlug) =>
    api.post(`/combat/${sessionId}/action`, { action, targetId, type, abilitySlug }),

  // Resposta ao prompt de reação. reaction: 'block' | 'dodge' | 'pass'.
  react: (sessionId, reaction) =>
    api.post(`/combat/${sessionId}/react`, { reaction }),

  // Usar um item consumível durante o combate.
  useItem: (sessionId, inventoryId) =>
    api.post(`/combat/${sessionId}/item`, { inventoryId }),

  // Tentativa de fuga.
  flee: (sessionId) =>
    api.post(`/combat/${sessionId}/flee`)
};

export default api;