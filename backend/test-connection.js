require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function testConnection() {
  console.log('Testando conexão com o Supabase...');
  console.log('URL:', process.env.SUPABASE_URL);

  const { data, error } = await supabase
    .from('world_clock')
    .select('*')
    .limit(1);

  if (error) {
    console.error('Erro na conexão:', error.message);
    return;
  }

  console.log('Conexão bem-sucedida!');
  console.log('Dados do relógio do mundo:', data);
}

testConnection();