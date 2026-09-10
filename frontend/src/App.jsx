import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { GameProvider, useGame } from './context/GameContext';
import Login from './pages/Login';
import Characters from './pages/Characters';
import Game from './pages/Game';


function Protected({ children }) {
  const { user, loading } = useGame();
  if (loading) return null;
  return user ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <GameProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login"      element={<Login />} />
          <Route path="/characters" element={<Protected><Characters /></Protected>} />
          <Route path="/game" 	    element={<Protected><Game /></Protected>} />
          <Route path="*"           element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </GameProvider>
  );
}