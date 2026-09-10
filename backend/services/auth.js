const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Middleware que valida o token em rotas protegidas
async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // formato: "Bearer TOKEN"

  if (!token) {
    return res.status(401).json({ error: 'Token não fornecido.' });
  }

  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    return res.status(401).json({ error: 'Token inválido ou expirado.' });
  }

  req.userId = data.user.id;
  next();
}

module.exports = { authenticateToken };