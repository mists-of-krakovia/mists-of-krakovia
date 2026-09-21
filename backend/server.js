require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3001;

// Configurações básicas
app.use(cors());
app.use(express.json());

// Cliente Supabase com a service key (acesso total, ignora RLS — só no backend).
// persistSession/autoRefreshToken desligados: este cliente é exclusivo de
// operações de banco e NUNCA deve ser usado para login de usuário. Se um
// cliente service_role fizer signInWithPassword, ele passa a enviar o token do
// usuário (role authenticated) nas queries seguintes e a RLS volta a valer —
// foi a causa do erro 42501 na criação de personagem.
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

// Exporta o supabase para usar nos outros arquivos
module.exports = { supabase };

// Rota de health check — confirma que o servidor está vivo
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Servidor Mists of Krakovia rodando.' });
});

// Importa as rotas (vamos criar em seguida)
const authRoutes = require('./routes/auth');
const characterRoutes = require('./routes/characters');
const worldRoutes = require('./routes/world');
const skillRoutes = require('./routes/skills');
const combatRoutes = require('./routes/combat');

app.use('/auth', authRoutes);
app.use('/characters', characterRoutes);
app.use('/world', worldRoutes);
app.use('/skills', skillRoutes);
app.use('/combat', combatRoutes);

// Inicia o servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});