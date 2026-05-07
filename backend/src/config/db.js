import mysql from 'mysql2/promise';
import 'dotenv/config';

const pool = mysql.createPool({
  host:               process.env.DB_HOST     || 'localhost',
  port:               Number(process.env.DB_PORT) || 3306,
  user:               process.env.DB_USER     || 'root',
  password:           process.env.DB_PASSWORD || '',
  database:           process.env.DB_NAME     || 'lumina_db',
  waitForConnections: true,
  connectionLimit:    10,
  queueLimit:         0,
  timezone:           '+00:00',
});

// Verifica la conexión al iniciar
pool.getConnection()
  .then(conn => {
    console.log('✅ Conectado a MySQL — lumina_db');
    conn.release();
  })
  .catch(err => {
    console.error('❌ Error de conexión a MySQL:', err.message);
    process.exit(1);
  });

export default pool;
