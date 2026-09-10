import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import { authService } from '../services/api';
import './Login.css';

export default function Login() {
  const navigate        = useNavigate();
  const { login }       = useGame();

  const [mode, setMode]       = useState('login'); // 'login' | 'register'
  const [email, setEmail]     = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data } = await authService.login(email, password);
      login({ userId: data.userId, username: data.username }, data.token);
      navigate('/characters');
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao fazer login.');
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await authService.register(email, password, username);
      // Após registrar, faz login automaticamente
      const { data } = await authService.login(email, password);
      login({ userId: data.userId, username: data.username }, data.token);
      navigate('/characters');
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao criar conta.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">

        <div className="login-header">
          <h1 className="login-title">MISTS OF KRAKOVIA</h1>
          <p className="login-tagline font-narrative">
            O que está além da névoa é sua decisão descobrir.
          </p>
        </div>

        <div className="login-tabs">
          <button
            className={mode === 'login' ? 'tab active' : 'tab'}
            onClick={() => { setMode('login'); setError(''); }}
          >
            Entrar
          </button>
          <button
            className={mode === 'register' ? 'tab active' : 'tab'}
            onClick={() => { setMode('register'); setError(''); }}
          >
            Criar Conta
          </button>
        </div>

        <form onSubmit={mode === 'login' ? handleLogin : handleRegister}>

          {mode === 'register' && (
            <div className="field">
              <label>Nome de usuário</label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Entre 3 e 30 caracteres"
                maxLength={30}
                required
              />
            </div>
          )}

          <div className="field">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="seu@email.com"
              required
            />
          </div>

          <div className="field">
            <label>Senha</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              minLength={6}
              required
            />
          </div>

          {error && (
            <p className="login-error">{error}</p>
          )}

          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
          >
            {loading
              ? 'Aguarde...'
              : mode === 'login' ? 'Entrar' : 'Criar Conta'
            }
          </button>

        </form>
      </div>
    </div>
  );
}