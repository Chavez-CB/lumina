import pg from 'pg';
import { createClient } from '@supabase/supabase-js'; // Importamos el cliente de Supabase
import 'dotenv/config';

const { Pool } = pg;

// ─── CONFIGURACIÓN DE POSTGRESQL (POOL) ────────────────────────────────────
const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 6543,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: {
    rejectUnauthorized: false
  },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

// ─── CONFIGURACIÓN DE SUPABASE STORAGE ──────────────────────────────────────
// Necesitas SUPABASE_URL y SUPABASE_ANON_KEY en tu .env
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn('⚠️ Advertencia: SUPABASE_URL o SUPABASE_ANON_KEY no definidos en .env');
}

const supabase = createClient(supabaseUrl, supabaseKey);

// ─── PRUEBA DE CONEXIÓN A LA DB ─────────────────────────────────────────────
pool.connect()
  .then((client) => {
    console.log('✅ Conectado a PostgreSQL - Supabase (Pooler)');
    client.release();
  })
  .catch((err) => {
    console.error('❌ Error de conexión a PostgreSQL:', err.message);
    process.exit(1);
  });

// Exportamos ambos: el pool para queries y supabase para archivos
export { pool, supabase };
export default pool;