const express = require('express');
const router = express.Router();
const { supabase } = require('../server');
const { authenticateToken } = require('../services/auth');

router.use(authenticateToken);

// GET /skills/catalog — catálogo de perícias (conteúdo público do mundo)
router.get('/catalog', async (req, res) => {
  const { data, error } = await supabase
    .from('skills_catalog')
    .select('slug, name, skill_type, base_attr, base_attr_alt, requires_training, attr_mg_req, sort_order, description')
    .order('sort_order', { ascending: true });

  if (error) {
    return res.status(500).json({ error: 'Erro ao buscar catálogo de perícias.' });
  }

  res.json(data || []);
});

module.exports = router;
