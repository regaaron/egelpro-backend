const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  port: process.env.DB_PORT,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test de conexión
(async () => {
  try {
    const connection = await pool.getConnection();
    console.log('Connected to the database successfully.');
    connection.release(); // liberamos la conexión de vuelta al pool
  } catch (err) {
    console.error('Error connecting to the database:', err.message);
  }
})();

module.exports = pool;
