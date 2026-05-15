import pg from 'pg';
import 'dotenv/config';

const { Pool } = pg;

const pool = new Pool({
  host: process.env.DB_HOST,
  // Cambiamos el puerto por defecto al 6543 que es el del Pooler
  port: Number(process.env.DB_PORT) || 6543, 
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  // Forzamos el SSL con rejectUnauthorized: false directamente
  ssl: {
    rejectUnauthorized: false
  },
  max: 10,
  idleTimeoutMillis: 30000,
  // Aumentamos de 2000ms a 10000ms (10 segundos)
  connectionTimeoutMillis: 10000, 
});

// Prueba de conexión
pool.connect()
  .then((client) => {
    console.log('Conectado a PostgreSQL - Supabase');
    client.release();
  })
  .catch((err) => {
    console.error('Error de conexión a PostgreSQL:', err.message);
    // Si sigue fallando por timeout, revisa tu conexión a internet
    process.exit(1);
  });

export { pool };
export default pool;