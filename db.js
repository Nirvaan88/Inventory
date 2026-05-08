/**
 * db.js — SQL Server connection using msnodesqlv8 driver
 * Supports Windows Authentication (Trusted Connection / Integrated Security)
 */
const sql = require('mssql/msnodesqlv8');

// Windows Authentication connection string (Trusted_Connection=yes)
const config = {
  connectionString:
    'Driver={ODBC Driver 17 for SQL Server};' +
    'Server=KSNLPT642;' +
    'Database=Inventorybkp;' +
    'Trusted_Connection=yes;',
  options: {
    enableArithAbort: true,
    trustServerCertificate: true,
    connectTimeout: 30000,
    requestTimeout: 60000,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

let pool = null;

async function getPool() {
  if (pool && pool.connected) return pool;
  try {
    pool = await sql.connect(config);
    console.log('✅ Database connected (Windows Auth via ODBC Driver 17)');
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
