require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3001;

// Configurações básicas
app.use(cors());
app.use(express.json());

// Cliente Supabase com a service key (acesso total, só no backend)
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
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

app.use('/auth', authRoutes);
app.use('/characters', characterRoutes);
app.use('/world', worldRoutes);

// Inicia o servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});