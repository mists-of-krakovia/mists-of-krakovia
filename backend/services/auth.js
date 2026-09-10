const { createClient } = require('@supabase/supabase-js');

// Cliente exclusivo para validar tokens (getUser). Sem persistir sessão, para
// não interferir com o cliente de dados service_role.
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

// Middleware que valida o token em rotas protegidas
async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // formato: "Bearer TOKEN"

  if (!token) {
    return res.status(401).json({ error: 'Token não fornecido.' });
  }

  let data, error;
  try {
    ({ data, error } = await supabase.auth.getUser(token));
  } catch {
    return res.status(401).json({ error: 'Falha ao validar token.' });
  }

  if (error || !data.user) {
    return res.status(401).json({ error: 'Token inválido ou expirado.' });
  }

  req.userId = data.user.id;
  next();
}

module.exports = { authenticateToken };