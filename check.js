const { query, sql } = require('./db.js');
async function check() {
  try {
    const s = await query('SELECT TOP 1 * FROM State');
    console.log('State columns:', Object.keys(s.recordset[0] || {}));
    const c = await query('SELECT TOP 1 * FROM City');
    console.log('City columns:', Object.keys(c.recordset[0] || {}));
  } catch(e) { console.error('Error:', e.message); }
  finally { process.exit(0); }
}
check();
