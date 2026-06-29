const sql = require('mssql');

const config = {
  server: 'KSNLPT642',
  database: 'Inventorybkp',
  options: {
    trustedConnection: true,
    trustServerCertificate: true,
    enableArithAbort: true,
    encrypt: false,
  },
  authentication: {
    type: 'ntlm',
    options: {
      userName: '',
      password: '',
      domain: '',
    }
  }
};

// Alternative config using Windows Authentication via connection string
const configAlt = {
  server: 'KSNLPT642',
  database: 'Inventorybkp',
  driver: 'msnodesqlv8',
  options: {
    trustedConnection: true,
    trustServerCertificate: true,
    enableArithAbort: true,
    encrypt: false,
  },
};

let pool = null;

async function getPool() {
  if (!pool) {
    try {
      pool = await sql.connect({
        server: 'KSNLPT642',
        database: 'Inventorybkp',
        options: {
          trustedConnection: true,
          trustServerCertificate: true,
          enableArithAbort: true,
          encrypt: false,
          integratedSecurity: true
        },
      });
    } catch (err) {
      console.error('DB Connection Error:', err.message);
      throw err;
    }
  }
  return pool;
}

async function query(sqlText, params = {}) {
  const db = await getPool();
  const request = db.request();
  for (const [key, val] of Object.entries(params)) {
    request.input(key, val);
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
