/**
 * db.js — Unified connection for LOCAL and DEPLOYED environments
 *
 * LOCAL  (your office Windows PC):
 *   Uses Windows Authentication via msnodesqlv8 + ODBC Driver 17
 *   Set nothing — this is the default
 *
 * DEPLOYED (AWS / Linux server):
 *   Uses SQL Server Authentication (username + password)
 *   Set these environment variables on the server:
 *     DB_MODE=sql
 *     DB_HOST=172.16.100.225   (your SQL Server IP)
 *     DB_USER=sa
 *     DB_PASS=Admin@123
 *     DB_NAME=Inventorybkp
 *
 *   On Windows cmd:    set DB_MODE=sql && node server.js
 *   On Linux/pm2:      DB_MODE=sql pm2 start server.js
 */
 
const DB_MODE = process.env.DB_MODE || 'windows'; // 'windows' = local, 'sql' = deployed
 
let sql, config;
 
if (DB_MODE === 'sql') {
  // ── Deployed / SQL Server Auth ──────────────────────────────────────────
  sql = require('mssql');
  config = {
    user:     process.env.DB_USER   || 'sa',
    password: process.env.DB_PASS || 'Kisna@123Strong',
    server: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME   || 'Inventorybkp',
    port:     parseInt(process.env.DB_PORT) || 1433,
    options: {
      encrypt:                false,
      trustServerCertificate: true,
      enableArithAbort:       true,
      connectTimeout:         30000,
      requestTimeout:         60000,
    },
    pool: {
      max:              10,
      min:              0,
      idleTimeoutMillis: 30000,
    },
  };
  console.log(`🔗 DB Mode: SQL Auth → ${config.server}/${config.database}`);
 
} else {
  // ── Local / Windows Auth (msnodesqlv8 + ODBC Driver 17) ─────────────────
  sql = require('mssql/msnodesqlv8');
  config = {
    connectionString:
      'Driver={ODBC Driver 17 for SQL Server};' +
      `Server=${process.env.DB_SERVER || 'KSNLPT642'};` +
      `Database=${process.env.DB_NAME || 'Inventorybkp'};` +
      'Trusted_Connection=yes;',
    options: {
      enableArithAbort:       true,
      trustServerCertificate: true,
      connectTimeout:         30000,
      requestTimeout:         60000,
    },
    pool: {
      max:              10,
      min:              0,
      idleTimeoutMillis: 30000,
    },
  };
  console.log('🔗 DB Mode: Windows Auth (local)');
}
 
let pool = null;
 
async function getPool() {
  if (pool && pool.connected) return pool;
  try {
    pool = await sql.connect(config);
    console.log('✅ Database connected successfully');
    return pool;
  } catch (err) {
    pool = null;
    console.error('❌ DB Connection Error:', err.message);
    throw new Error('Database connection failed: ' + err.message);
  }
}
 
async function query(sqlText, params = {}) {
  const db = await getPool();
  const request = db.request();
  for (const [key, val] of Object.entries(params)) {
    if (val === null || val === undefined) {
      request.input(key, sql.NVarChar, null);
    } else {
      request.input(key, val);
    }
  }
  return request.query(sqlText);
}
 
async function execSP(spName, params = {}) {
  const db = await getPool();
  const request = db.request();
  for (const [key, val] of Object.entries(params)) {
    request.input(key, val);
  }
  return request.execute(spName);
}
 
module.exports = { getPool, query, execSP, sql };
