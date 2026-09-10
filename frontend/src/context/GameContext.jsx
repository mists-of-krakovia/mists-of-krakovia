import { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/api';

const GameContext = createContext(null);

export function GameProvider({ children }) {
  const [user, setUser]           = useState(null);
  const [token, setToken]         = useState(null);
  const [character, setCharacter] = useState(null);
  const [loading, setLoading]     = useState(true);

  // Ao iniciar, verifica se há sessão salva
  useEffect(() => {
    const savedToken = localStorage.getItem('krakovia_token');
    const savedUser  = localStorage.getItem('krakovia_user');
	const savedCharacter = localStorage.getItem('krakovia_character');

    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
      if (savedCharacter) {                                            // linha nova
        setCharacter(JSON.parse(savedCharacter));                      // linha nova
      }                                                                // linha nova
  }

    setLoading(false);
  }, []);

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

export function useGame() {
  return useContext(GameContext);
}