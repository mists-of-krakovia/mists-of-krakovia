import { createContext, useContext, useState } from 'react';

const GameContext = createContext(null);

// Lê e faz parse seguro de um item do localStorage (null se ausente/corrompido).
function readStored(key, { json = false } = {}) {
  try {
    const raw = localStorage.getItem(key);
    if (raw == null) return null;
    return json ? JSON.parse(raw) : raw;
  } catch {
    return null;
  }
}

export function GameProvider({ children }) {
  // Inicialização preguiçosa: lê a sessão salva uma única vez, sem useEffect
  // (evita setState dentro de effect e o flicker de "loading").
  const [token, setToken]         = useState(() => readStored('krakovia_token'));
  const [user, setUser]           = useState(() => readStored('krakovia_user', { json: true }));
  const [character, setCharacter] = useState(() => readStored('krakovia_character', { json: true }));

  // A restauração da sessão é síncrona (lazy initializers acima), então nunca
  // há um estado de "carregando" inicial. Mantido no contexto por compatibilidade
  // com quem consome `loading` (ex.: <Protected> em App.jsx).
  const loading = false;

  function login(userData, userToken) {
    setUser(userData);
    setToken(userToken);
    localStorage.setItem('krakovia_token', userToken);
    localStorage.setItem('krakovia_user', JSON.stringify(userData));
  }

  function logout() {
    setUser(null);
    setToken(null);
    setCharacter(null);
    localStorage.removeItem('krakovia_token');
    localStorage.removeItem('krakovia_user');
    localStorage.removeItem('krakovia_character');
  }

  function selectCharacter(char) {
    setCharacter(char);
    localStorage.setItem('krakovia_character', JSON.stringify(char));
  }

  return (
    <GameContext.Provider value={{
      user, token, character,
      loading, login, logout, selectCharacter
    }}>
      {children}
    </GameContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useGame() {
  return useContext(GameContext);
}
