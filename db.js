const mysql = require('mysql2/promise');
const config = require('./config');

const isRailway = config.db.host !== "localhost";

const pool = mysql.createPool({
  host: config.db.host,
  user: config.db.user,
  password: config.db.password,
  database: config.db.database,
  port: config.db.port,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ssl: isRailway ? { rejectUnauthorized: true } : false
});

// Test de conexión
(async () => {
  try {
    const connection = await pool.getConnection();
    console.log("✅ Connected to MySQL:", config.db.host);
    connection.release();
  } catch (err) {
    console.error("❌ MySQL connection error:", err.message);
  }
})();

module.exports = pool;
