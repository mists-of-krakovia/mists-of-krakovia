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

  allocateSkills: (characterId, alloc) =>
    api.post(`/characters/${characterId}/skills/allocate`, alloc),

  // Distribui pontos de atributo. deltas: { strength?, agility?, ... } (>= 0).
  allocateAttributes: (characterId, deltas) =>
    api.post(`/characters/${characterId}/attributes/allocate`, deltas),

  // Salva o nó atual como ponto de respawn (só em settlement).
  savePoint: (characterId) =>
    api.post(`/characters/${characterId}/save-point`)
};

// Perícias
export const skillService = {
  getCatalog: () =>
    api.get('/skills/catalog')
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

  // Tentativa de fuga.
  flee: (sessionId) =>
    api.post(`/combat/${sessionId}/flee`)
};

export default api;