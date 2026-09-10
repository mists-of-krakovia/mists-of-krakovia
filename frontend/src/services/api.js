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

  create: (name, characterClass, attributes) =>
    api.post('/characters', { name, characterClass, attributes }),

  enter: (characterId) =>
    api.post(`/characters/${characterId}/enter`)
};

// Mundo
export const worldService = {
  getClock: () =>
    api.get('/world/clock'),

  getNode: (nodeId) =>
    api.get(`/world/nodes/${nodeId}`)
};

export default api;