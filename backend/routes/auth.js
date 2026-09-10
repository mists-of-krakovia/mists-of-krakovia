const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');
const { supabase } = require('../server');

// Cliente dedicado ao fluxo de login. É service_role (precisa do admin API para
// criar usuário), mas fica ISOLADO do cliente de dados: quando faz
// signInWithPassword, apenas ESTE cliente passa a carregar a sessão do usuário,
// sem afetar o `supabase` compartilhado usado pelas queries com RLS ignorada.
const authClient = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

// Registro de novo usuário
// POST /auth/register
// Body: { email, password, username }
router.post('/register', async (req, res) => {
  const { email, password, username } = req.body;

  if (!email || !password || !username) {
    return res.status(400).json({ error: 'Email, senha e username são obrigatórios.' });
  }

  if (username.length < 3 || username.length > 30) {
    return res.status(400).json({ error: 'Username deve ter entre 3 e 30 caracteres.' });
  }

  // Verifica se o username já existe
  const { data: existing } = await supabase
    .from('accounts')
    .select('id')
    .eq('username', username)
    .single();

  if (existing) {
    return res.status(400).json({ error: 'Este username já está em uso.' });
  }

  // Cria o usuário no Supabase Auth (cliente de auth isolado)
  const { data, error } = await authClient.auth.admin.createUser({
    email,
    password,
    user_metadata: { username },
    email_confirm: true // no alpha, confirma automaticamente
  });

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  // Atualiza o username na tabela accounts
  // (o trigger já criou a linha, só atualizamos o username)
  await supabase
    .from('accounts')
    .update({ username })
    .eq('id', data.user.id);

  res.status(201).json({
    message: 'Conta criada com sucesso.',
    userId: data.user.id
  });
});

// Login
// POST /auth/login
// Body: { email, password }
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email e senha são obrigatórios.' });
  }

  const { data, error } = await authClient.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    return res.status(401).json({ error: 'Email ou senha incorretos.' });
  }

  // Atualiza last_login
  await supabase
    .from('accounts')
    .update({ last_login: new Date().toISOString() })
    .eq('id', data.user.id);

  res.json({
    token: data.session.access_token,
    userId: data.user.id,
    username: data.user.user_metadata.username
  });
});

module.exports = router;