const express = require('express');
const session = require('express-session');
const FileStore = require('session-file-store')(session); // persistent session store
const path = require('path');
const XLSX = require('xlsx');
const nodemailer = require('nodemailer');
const puppeteer  = require('puppeteer');
const { query, execSP, sql, getPool } = require('./db');

// â”€â”€ Zoho Mail transporter â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const mailer = nodemailer.createTransport({
  host: 'smtp.zoho.in',
  port: 587,
  secure: false,          // STARTTLS
  auth: {
    user: 'dataanalysis5@kisna.com',
    pass: 'cBhivMSFFNLq'  // Zoho App Password
  }
});

//Challan HTML builder (server-side mirror of the frontend template) 
function _buildChallanHtml(h, rows, trackId, courierLink) {
  const totalPcs    = rows.reduce((s, r) => s + (Number(r.Pcs)    || 0), 0);
  const totalAmount = rows.reduce((s, r) => s + (Number(r.Amount) || 0), 0);
  const fmtDate = v => {
    if (!v) return '';
    const s = String(v);
    if (/^\d{2}[-/]\d{2}[-/]\d{4}$/.test(s)) return s.replace(/-/g, '/');
    try { const d = new Date(s); if (!isNaN(d)) return d.toLocaleDateString('en-IN'); } catch (_) {}
    return s;
  };
  const challanDate = fmtDate(h.ChallanDate);
  const productRows = rows.map(r => `
    <tr>
      <td style="padding:5px 8px;border:1px solid #ccc;text-align:center;font-weight:bold">${r.SrlNo || r.srlno || ''}</td>
      <td style="padding:5px 8px;border:1px solid #ccc;font-weight:bold">${r.ProdDesc || '-'}</td>
      <td style="padding:5px 8px;border:1px solid #ccc;text-align:center;font-weight:bold">${r.Pcs || 0}</td>
      <td style="padding:5px 8px;border:1px solid #ccc;text-align:right;font-weight:bold">${Number(r.Amount || 0).toFixed(0)}</td>
    </tr>`).join('');
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
    @page { size:A4; margin:10mm 12mm 8mm 12mm; }
    *  { box-sizing:border-box; }
    html,body { height:100%; margin:0; font-family:Arial,sans-serif; font-size:11px; color:#000; }
    table.outer { width:100%; min-height:240mm; height:100%;
                  border:2px solid #333; border-collapse:collapse; }
    table.outer td,table.outer th { font-size:11px; }
    .spacer td { height:100%; }
  </style></head><body>
  <table class="outer">
    <tr><td colspan="2" style="padding:10px 14px 8px;border-bottom:1px solid #999">
      <table style="width:100%;border-collapse:collapse"><tr>
        <td style="width:20%"></td>
        <td style="text-align:center;padding:4px 0">
          <div style="font-size:15px;font-weight:bold;letter-spacing:1px">DELIVERY CHALLAN</div>
          <div style="font-size:11px;font-style:italic">(Goods sent for Sales Promotion)</div>
        </td>
        <td style="width:20%"></td>
      </tr></table>
    </td></tr>
    <tr>
      <td style="width:50%;padding:9px 12px;vertical-align:top;border-right:1px solid #aaa;border-bottom:1px solid #aaa;line-height:1.7">
        From,${h.FromCompanyName||''}<br>${h.FromAddr1||''}<br>${h.FromAddr2||''}<br>${h.FromAddr3||''}<br>
        State:${h.FromState||''}<br>Contact No-${h.FromContactNo||''}<br>GST No.${h.FromGSTNo||''}<br>PAN:${h.FromPAN||''}
      </td>
      <td style="width:50%;padding:9px 12px;vertical-align:top;border-bottom:1px solid #aaa;line-height:1.7">
        To,<br>${h.ToCompanyName||''}<br>${h.ToPersonName||''}<br>${h.ToAddr1||''} ${h.ToAddr2||''}<br>
        ${h.ToAddr3||''}<br>Contact No-${h.ToContactNo||''}<br>GST No.${h.ToGSTNo||''}
      </td>
    </tr>
    <tr>
      <td style="padding:8px 12px;border-right:1px solid #aaa;border-bottom:1px solid #aaa">Challan No:&nbsp;&nbsp;<strong>${h.ChallanNo||''}</strong></td>
      <td style="padding:8px 12px;border-bottom:1px solid #aaa">Place Of Sales Promotion<br><strong>${h.PlaceOfSalesPromotion||''}</strong></td>
    </tr>
    <tr>
      <td style="padding:8px 12px;border-right:1px solid #aaa;border-bottom:1px solid #aaa">Date&nbsp;:&nbsp;<strong>${challanDate}</strong></td>
      <td style="padding:8px 12px;border-bottom:1px solid #aaa">Transportation By:&nbsp;<strong>${h.TransportationBy||''}</strong>${trackId ? '&nbsp;&nbsp;&nbsp;Track ID-' + trackId : ''}${courierLink ? `<br><span style="font-size:10px">Courier Tracking Link: <a href="${courierLink}">${courierLink}</a></span>` : ''}</td>
    </tr>
    <tr><td colspan="2" style="padding:0;border-bottom:1px solid #aaa">
      <table style="width:100%;border-collapse:collapse">
        <thead><tr style="background:#f5f5f5">
          <th style="width:60px;padding:7px 8px;border-right:1px solid #ccc;text-align:center;font-weight:bold">Sr No</th>
          <th style="padding:7px 8px;border-right:1px solid #ccc;text-align:left;font-weight:bold">Product Description</th>
          <th style="width:70px;padding:7px 8px;border-right:1px solid #ccc;text-align:center;font-weight:bold">Pcs</th>
          <th style="width:90px;padding:7px 8px;text-align:right;font-weight:bold">Amount</th>
        </tr></thead>
        <tbody>
          ${productRows}
          <tr><td style="border:1px solid #e0e0e0"></td>
            <td style="padding:5px 8px;border:1px solid #e0e0e0;font-weight:bold">( For Sales Promotion No Commercial Value )</td>
            <td style="border:1px solid #e0e0e0"></td><td style="border:1px solid #e0e0e0"></td></tr>
          <tr style="font-weight:bold">
            <td style="padding:6px 8px;border:1px solid #ccc"></td>
            <td style="padding:6px 8px;border:1px solid #ccc">Total</td>
            <td style="padding:6px 8px;border:1px solid #ccc;text-align:center">${totalPcs}</td>
            <td style="padding:6px 8px;border:1px solid #ccc;text-align:right">${totalAmount.toFixed(0)}</td>
          </tr>
        </tbody>
      </table>
    </td></tr>
    <tr class="spacer"><td colspan="2" style="border-bottom:1px solid #aaa"></td></tr>
    <tr><td colspan="2" style="padding:8px 12px;border-bottom:1px solid #aaa;font-size:10.5px;line-height:1.5">
      Declaration- Good here in mention are sent for Sales Promotion no commercial value and the same shall be processed / manufacture and return with in one year from the date of this document
    </td></tr>
    <tr><td colspan="2" style="padding:8px 12px;border-bottom:1px solid #aaa;font-size:10.5px;line-height:1.5">
      Declaration: (1) We declare that this Delivery Challan shows the actual price of the goods described and that all particulars are true and correct. (2) The diamonds herein invoiced have been purchased from legitimate sources not involved in funding conflict and in compliance with the United Nations Resolutions. The seller hereby guarantees that these diamonds are conflict free, based on personal knowledge and/or written guarantees provided by the supplier of these diamonds. (3) The diamonds invoiced are exclusively of natural origin and untreated based on personal knowledge and/or written guarantees
    </td></tr>
    <tr>
      <td style="padding:8px 12px;border-right:1px solid #aaa;border-bottom:1px solid #aaa;font-size:10.5px;vertical-align:top">CIN No &nbsp; ${h.CINNo||''}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #aaa;font-size:10.5px;vertical-align:top">Certified that the particulars given above are true and correct</td>
    </tr>
    <tr>
      <td style="padding:20px 12px 14px;border-right:1px solid #aaa;text-align:center;vertical-align:bottom;font-size:10.5px">
        <div style="border-top:1px solid #555;width:180px;margin:0 auto 6px"></div>
        <strong>Receivers signature and date</strong>
      </td>
      <td style="padding:12px 12px 14px;text-align:right;vertical-align:bottom;font-size:10.5px">
        <div style="font-weight:bold;font-size:11px;margin-bottom:60px">H. K. Jewels Pvt. Ltd. (Mumbai)</div>
        <div style="border-top:1px solid #555;width:180px;margin:0 0 6px auto"></div>
        <strong>Authorised signatory</strong>
      </td>
    </tr>
  </table></body></html>`;
}

// â”€â”€ Generate challan PDF buffer using puppeteer â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
async function _generateChallanPdf(issueId, deliverMode, distCode, trackId, courierLink) {
  const [headerR, detailR] = await Promise.all([
    query('EXEC [dbo].[sp_GetHeaderDataChallan] @intIssueID, @strDeliverMode, @strDistCode',
      { intIssueID: parseInt(issueId), strDeliverMode: deliverMode || 'Courier', strDistCode: distCode || '' }),
    query('EXEC [dbo].[sp_GetDetailDataChallan] @intIssueID', { intIssueID: parseInt(issueId) })
  ]);
  const h    = headerR.recordset[0] || {};
  const rows = detailR.recordset    || [];
  const html = _buildChallanHtml(h, rows, trackId, courierLink);
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'], headless: true });
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    return await page.pdf({ format: 'A4', printBackground: true });
  } finally {
    await browser.close();
  }
}

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public'), {
  setHeaders: (res, filePath) => {
    if (/\.(js|mjs)$/i.test(filePath)) {
      res.setHeader('Content-Type', 'text/javascript; charset=utf-8');
    } else if (/\.css$/i.test(filePath)) {
      res.setHeader('Content-Type', 'text/css; charset=utf-8');
    } else if (/\.html?$/i.test(filePath)) {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
    }
  }
}));

// IS_PROD: true when NODE_ENV=production OR FORCE_HTTPS=true
// Set either of these env vars on your deployed server â€” no code changes needed.
const IS_PROD = process.env.NODE_ENV === 'production' ||
                process.env.FORCE_HTTPS === 'true';

// Trust reverse proxies only in production (nginx, IIS, AWS LB etc.)
if (IS_PROD) app.set('trust proxy', 1);

// â”€â”€ Session store: file-based (survives restarts) with MemoryStore fallback â”€â”€
const SESSION_DIR = path.join(__dirname, 'sessions');
const fs = require('fs');
// Guarantee the directory exists before FileStore tries to use it
try { fs.mkdirSync(SESSION_DIR, { recursive: true }); } catch (_) {}

let sessionStore;
try {
  sessionStore = new FileStore({
    path:    SESSION_DIR,
    ttl:     8 * 60 * 60,  // 8 hours in seconds
    retries: 1,
    logFn:   () => {}       // silence noisy logs
  });
  console.log('âœ… Session store: file-based (./sessions/)');
} catch (e) {
  console.warn('âš ï¸  FileStore failed, falling back to MemoryStore:', e.message);
  sessionStore = undefined; // express-session uses MemoryStore when store is undefined
}

app.use(session({
  secret:           process.env.SESSION_SECRET || 'inventory-kisna-secret-2024',
  resave:           false,
  saveUninitialized: false,
  store:            sessionStore,
  cookie: {
    maxAge:   8 * 60 * 60 * 1000, // 8 hours
    httpOnly: true,
    secure:   IS_PROD,  // HTTPS-only cookie in production
    sameSite: 'lax'    // works for all same-domain deployments
  }
}));

// Auth middleware
function requireAuth(req, res, next) {
  if (req.session && req.session.user) return next();
  return res.status(401).json({ error: 'Unauthorized' });
}

// Helper: returns the date string as-is (YYYY-MM-DD).
// The SQL queries combine this with GETDATE()'s time (SQL Server = IST),
// so we never rely on JavaScript's timezone (AWS Node.js runs in UTC).
function _withCurrentTime(dateStr) {
  return dateStr || null;
}
// SQL expression to use in queries (replaces @date):
// CAST(@date AS DATETIME) + CAST(CAST(GETDATE() AS TIME) AS DATETIME)
// â†’ user's selected date  +  current IST time from SQL Server

// =================== AUTH ROUTES ===================
app.post('/api/login', async (req, res) => {
  const { loginId, password } = req.body;
  if (!loginId || !password)
    return res.status(400).json({ error: 'Missing credentials' });

  // Admin bypass
  if (loginId === 'admin' && password === 'admin') {
    req.session.user = { loginId: 'admin', isAdmin: true };
    // session.save() guarantees the session is written before we respond.
    // Without this, some stores (and MemoryStore under load) respond before
    // the session is actually persisted, so the very next request sees no session.
    return req.session.save(err => {
      if (err) return res.status(500).json({ error: 'Session save failed' });
      res.json({ success: true, user: { loginId: 'admin', isAdmin: true } });
    });
  }

  try {
    const result = await query(
      `SELECT * FROM Login WITH (NOLOCK) WHERE LoginID = @lid AND Password = @pwd AND status = 'Y'`,
      { lid: loginId, pwd: password }
    );
    if (result.recordset.length === 0)
      return res.status(401).json({ error: 'Invalid Login ID and Password!' });

    const user = result.recordset[0];
    req.session.user = { loginId: user.LoginID, name: user.UserName || loginId };
    req.session.save(err => {
      if (err) {
        console.error('Session save error:', err);
        return res.status(500).json({ error: 'Session could not be saved. Please try again.' });
      }
      res.json({ success: true, user: req.session.user });
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Database error: ' + err.message });
  }
});

app.post('/api/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

app.get('/api/session', (req, res) => {
  if (req.session && req.session.user) {
    res.json({ loggedIn: true, user: req.session.user });
  } else {
    res.json({ loggedIn: false });
  }
});

// =================== MASTERS ===================

// Division
app.get('/api/divisions', requireAuth, async (req, res) => {
  try {
    let sql = 'SELECT DivisionId, DivisionName, Status, AddedBy, AddedDate, ModifyBy, ModifyDate FROM Division';
    if (req.query.active === '1') sql += " WHERE Status = 'Y'";
    sql += ' ORDER BY DivisionId';
    const r = await query(sql);
    res.json(r.recordset);
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.post('/api/divisions', requireAuth, async (req, res) => {
  const { DivisionName } = req.body;
  const user = req.session.user?.loginId || 'admin';
  try {
    const r = await query(
      `INSERT INTO Division (DivisionName, Status, AddedBy, AddedDate) OUTPUT INSERTED.DivisionId VALUES (@name, 'Y', @user, GETDATE())`,
      { name: DivisionName, user }
    );
    res.json({ success: true, DivisionId: r.recordset[0].DivisionId });
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.put('/api/divisions/:id', requireAuth, async (req, res) => {
  const { DivisionName } = req.body;
  const user = req.session.user?.loginId || 'admin';
  try {
    await query(
      'UPDATE Division SET DivisionName = @name, ModifyBy = @user, ModifyDate = GETDATE() WHERE DivisionId = @id',
      { name: DivisionName, user, id: parseInt(req.params.id) }
    );
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.delete('/api/divisions/:id', requireAuth, async (req, res) => {
  try {
    await query('DELETE FROM Division WHERE DivisionId = @id', { id: parseInt(req.params.id) });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.post('/api/divisions/bulk-delete', requireAuth, async (req, res) => {
  const { ids } = req.body;
  if (!ids || !ids.length) return res.status(400).json({ error: 'No IDs provided' });
  try {
    const placeholders = ids.map((_, i) => `@id${i}`).join(',');
    const params = {};
    ids.forEach((id, i) => { params[`id${i}`] = parseInt(id); });
    await query(`DELETE FROM Division WHERE DivisionId IN (${placeholders})`, params);
    res.json({ success: true, deleted: ids.length });
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.post('/api/divisions/export-xlsx', requireAuth, async (req, res) => {
  const { ids } = req.body;
  try {
    let r;
    if (ids && ids.length) {
      const placeholders = ids.map((_, i) => `@id${i}`).join(',');
      const params = {};
      ids.forEach((id, i) => { params[`id${i}`] = parseInt(id); });
      r = await query(`SELECT DivisionId, DivisionName, Status, AddedBy, AddedDate, ModifyBy, ModifyDate FROM Division WHERE DivisionId IN (${placeholders}) ORDER BY DivisionId`, params);
    } else {
      r = await query('SELECT DivisionId, DivisionName, Status, AddedBy, AddedDate, ModifyBy, ModifyDate FROM Division ORDER BY DivisionId');
    }
    const ws = XLSX.utils.json_to_sheet(r.recordset);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Divisions');
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Disposition', 'attachment; filename="divisions.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buf);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Department
app.get('/api/departments', requireAuth, async (req, res) => {
  try {
    const r = await query('SELECT DepId, DepName, Status, AddedBy, AddedDate, ModifyBy, ModifyDate FROM Department ORDER BY DepId');
    res.json(r.recordset);
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.post('/api/departments', requireAuth, async (req, res) => {
  const { DepName } = req.body;
  const user = req.session.user?.loginId || 'admin';
  try {
    const r = await query(
      `INSERT INTO Department (DepName, Status, AddedBy, AddedDate) OUTPUT INSERTED.DepId VALUES (@name, 'Y', @user, GETDATE())`,
      { name: DepName, user }
    );
    res.json({ success: true, DepId: r.recordset[0].DepId });
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.put('/api/departments/:id', requireAuth, async (req, res) => {
  const { DepName } = req.body;
  const user = req.session.user?.loginId || 'admin';
  try {
    await query(
      'UPDATE Department SET DepName = @name, ModifyBy = @user, ModifyDate = GETDATE() WHERE DepId = @id',
      { name: DepName, user, id: parseInt(req.params.id) }
    );
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.delete('/api/departments/:id', requireAuth, async (req, res) => {
  try {
    await query('DELETE FROM Department WHERE DepId = @id', { id: parseInt(req.params.id) });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.post('/api/departments/bulk-delete', requireAuth, async (req, res) => {
  const { ids } = req.body;
  if (!ids || !ids.length) return res.status(400).json({ error: 'No IDs provided' });
  try {
    const placeholders = ids.map((_, i) => `@id${i}`).join(',');
    const params = {};
    ids.forEach((id, i) => { params[`id${i}`] = parseInt(id); });
    await query(`DELETE FROM Department WHERE DepId IN (${placeholders})`, params);
    res.json({ success: true, deleted: ids.length });
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.post('/api/departments/export-xlsx', requireAuth, async (req, res) => {
  const { ids } = req.body;
  try {
    let r;
    if (ids && ids.length) {
      const placeholders = ids.map((_, i) => `@id${i}`).join(',');
      const params = {};
      ids.forEach((id, i) => { params[`id${i}`] = parseInt(id); });
      r = await query(`SELECT DepId, DepName, Status, AddedBy, AddedDate, ModifyBy, ModifyDate FROM Department WHERE DepId IN (${placeholders}) ORDER BY DepId`, params);
    } else {
      r = await query('SELECT DepId, DepName, Status, AddedBy, AddedDate, ModifyBy, ModifyDate FROM Department ORDER BY DepId');
    }
    const ws = XLSX.utils.json_to_sheet(r.recordset);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Departments');
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Disposition', 'attachment; filename="departments.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buf);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Category
app.get('/api/categories', requireAuth, async (req, res) => {
  try {
    const r = await query(`
      SELECT c.CategoryId, c.CategoryName, c.DivisionId, c.Status,
             c.AddedBy, c.AddedDate, c.ModifyBy, c.ModifyDate,
             d.DivisionName
      FROM Category c
      LEFT JOIN Division d ON c.DivisionId = d.DivisionId
      ORDER BY c.CategoryId`);
    res.json(r.recordset);
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.post('/api/categories', requireAuth, async (req, res) => {
  const { CategoryName, DivisionId } = req.body;
  const user = req.session.user?.loginId || 'admin';
  try {
    const r = await query(
      `INSERT INTO Category (CategoryName, DivisionId, Status, AddedBy, AddedDate)
       OUTPUT INSERTED.CategoryId
       VALUES (@name, @divId, 'Y', @user, GETDATE())`,
      { name: CategoryName, divId: parseInt(DivisionId), user }
    );
    res.json({ success: true, CategoryId: r.recordset[0].CategoryId });
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.put('/api/categories/:id', requireAuth, async (req, res) => {
  const { CategoryName, DivisionId } = req.body;
  const user = req.session.user?.loginId || 'admin';
  try {
    await query(
      `UPDATE Category SET CategoryName = @name, DivisionId = @divId,
       ModifyBy = @user, ModifyDate = GETDATE() WHERE CategoryId = @id`,
      { name: CategoryName, divId: parseInt(DivisionId), user, id: parseInt(req.params.id) }
    );
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.delete('/api/categories/:id', requireAuth, async (req, res) => {
  try {
    await query('DELETE FROM Category WHERE CategoryId = @id', { id: parseInt(req.params.id) });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.post('/api/categories/bulk-delete', requireAuth, async (req, res) => {
  const { ids } = req.body;
  if (!ids || !ids.length) return res.status(400).json({ error: 'No IDs provided' });
  try {
    const placeholders = ids.map((_, i) => `@id${i}`).join(',');
    const params = {};
    ids.forEach((id, i) => { params[`id${i}`] = parseInt(id); });
    await query(`DELETE FROM Category WHERE CategoryId IN (${placeholders})`, params);
    res.json({ success: true, deleted: ids.length });
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.post('/api/categories/export-xlsx', requireAuth, async (req, res) => {
  const { ids } = req.body;
  try {
    let r;
    const base = `SELECT c.CategoryId, c.CategoryName, d.DivisionName, c.Status,
                  c.AddedBy, c.AddedDate, c.ModifyBy, c.ModifyDate
                  FROM Category c LEFT JOIN Division d ON c.DivisionId = d.DivisionId`;
    if (ids && ids.length) {
      const placeholders = ids.map((_, i) => `@id${i}`).join(',');
      const params = {};
      ids.forEach((id, i) => { params[`id${i}`] = parseInt(id); });
      r = await query(`${base} WHERE c.CategoryId IN (${placeholders}) ORDER BY c.CategoryId`, params);
    } else {
      r = await query(`${base} ORDER BY c.CategoryId`);
    }
    const ws = XLSX.utils.json_to_sheet(r.recordset);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Categories');
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Disposition', 'attachment; filename="categories.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buf);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// State
app.get('/api/states', requireAuth, async (req, res) => {
  try {
    const r = await query('SELECT StateID, [State], Status, AddedBy, AddedDate, ModifyBy, ModifyDate FROM [State] ORDER BY StateID');
    res.json(r.recordset);
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.post('/api/states', requireAuth, async (req, res) => {
  const { StateName } = req.body;
  const user = req.session.user?.loginId || 'admin';
  try {
    const r = await query(
      `INSERT INTO [State] ([State], Status, AddedBy, AddedDate) OUTPUT INSERTED.StateID VALUES (@name, 'Y', @user, GETDATE())`,
      { name: StateName, user }
    );
    res.json({ success: true, StateID: r.recordset[0].StateID });
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.put('/api/states/:id', requireAuth, async (req, res) => {
  const { StateName } = req.body;
  const user = req.session.user?.loginId || 'admin';
  try {
    await query(
      'UPDATE [State] SET [State] = @name, ModifyBy = @user, ModifyDate = GETDATE() WHERE StateID = @id',
      { name: StateName, user, id: parseInt(req.params.id) }
    );
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.delete('/api/states/:id', requireAuth, async (req, res) => {
  try {
    await query('DELETE FROM [State] WHERE StateID = @id', { id: parseInt(req.params.id) });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.post('/api/states/bulk-delete', requireAuth, async (req, res) => {
  const { ids } = req.body;
  if (!ids || !ids.length) return res.status(400).json({ error: 'No IDs provided' });
  try {
    const placeholders = ids.map((_, i) => `@id${i}`).join(',');
    const params = {};
    ids.forEach((id, i) => { params[`id${i}`] = parseInt(id); });
    await query(`DELETE FROM [State] WHERE StateID IN (${placeholders})`, params);
    res.json({ success: true, deleted: ids.length });
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.post('/api/states/export-xlsx', requireAuth, async (req, res) => {
  const { ids } = req.body;
  try {
    let r;
    if (ids && ids.length) {
      const placeholders = ids.map((_, i) => `@id${i}`).join(',');
      const params = {};
      ids.forEach((id, i) => { params[`id${i}`] = parseInt(id); });
      r = await query(`SELECT StateID, [State], Status, AddedBy, AddedDate FROM [State] WHERE StateID IN (${placeholders}) ORDER BY StateID`, params);
    } else {
      r = await query('SELECT StateID, [State], Status, AddedBy, AddedDate FROM [State] ORDER BY StateID');
    }
    const ws = XLSX.utils.json_to_sheet(r.recordset);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'States');
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Disposition', 'attachment; filename="states.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buf);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// City
app.get('/api/cities', requireAuth, async (req, res) => {
  try {
    const r = await query(`
      SELECT c.CityID, c.[City], c.StateID, c.Status,
             c.AddedBy, c.AddedDate, c.ModifyBy, c.ModifyDate,
             s.[State] AS StateName
      FROM [City] c
      LEFT JOIN [State] s ON c.StateID = s.StateID
      ORDER BY c.CityID`);
    res.json(r.recordset);
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.post('/api/cities', requireAuth, async (req, res) => {
  const { CityName, StateID } = req.body;
  const user = req.session.user?.loginId || 'admin';
  try {
    const r = await query(
      `INSERT INTO [City] ([City], StateID, Status, AddedBy, AddedDate)
       OUTPUT INSERTED.CityID
       VALUES (@name, @stateId, 'Y', @user, GETDATE())`,
      { name: CityName, stateId: parseInt(StateID), user }
    );
    res.json({ success: true, CityID: r.recordset[0].CityID });
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.put('/api/cities/:id', requireAuth, async (req, res) => {
  const { CityName, StateID } = req.body;
  const user = req.session.user?.loginId || 'admin';
  try {
    await query(
      `UPDATE [City] SET [City] = @name, StateID = @stateId,
       ModifyBy = @user, ModifyDate = GETDATE() WHERE CityID = @id`,
      { name: CityName, stateId: parseInt(StateID), user, id: parseInt(req.params.id) }
    );
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.delete('/api/cities/:id', requireAuth, async (req, res) => {
  try {
    await query('DELETE FROM [City] WHERE CityID = @id', { id: parseInt(req.params.id) });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.post('/api/cities/bulk-delete', requireAuth, async (req, res) => {
  const { ids } = req.body;
  if (!ids || !ids.length) return res.status(400).json({ error: 'No IDs provided' });
  try {
    const placeholders = ids.map((_, i) => `@id${i}`).join(',');
    const params = {};
    ids.forEach((id, i) => { params[`id${i}`] = parseInt(id); });
    await query(`DELETE FROM [City] WHERE CityID IN (${placeholders})`, params);
    res.json({ success: true, deleted: ids.length });
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.post('/api/cities/export-xlsx', requireAuth, async (req, res) => {
  const { ids } = req.body;
  try {
    let r;
    const base = `SELECT c.CityID, c.[City], s.[State] AS StateName, c.Status, c.AddedBy, c.AddedDate
                  FROM [City] c LEFT JOIN [State] s ON c.StateID = s.StateID`;
    if (ids && ids.length) {
      const placeholders = ids.map((_, i) => `@id${i}`).join(',');
      const params = {};
      ids.forEach((id, i) => { params[`id${i}`] = parseInt(id); });
      r = await query(`${base} WHERE c.CityID IN (${placeholders}) ORDER BY c.CityID`, params);
    } else {
      r = await query(`${base} ORDER BY c.CityID`);
    }
    const ws = XLSX.utils.json_to_sheet(r.recordset);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Cities');
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Disposition', 'attachment; filename="cities.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buf);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Item Master
app.get('/api/items', requireAuth, async (req, res) => {
  try {
    const r = await query(`
      SELECT i.[itemid], i.[ItemName], i.[CategoryId], i.[DivisionId],
             i.[UOM], i.[Stock], i.[SellPrice], i.[ReorderLevel], i.[ReorderQty],
             i.[priority], i.[ItemCode], i.[FFlag],
             i.[Status], i.[AddedBy], i.[AddedDate], i.[ModifyBy], i.[ModifyDate],
             c.[CategoryName],
             d.[DivisionName]
      FROM [Item] i
      LEFT JOIN [Category] c ON i.[CategoryId] = c.[CategoryId]
      LEFT JOIN [Division] d ON i.[DivisionId] = d.[DivisionId]
      ORDER BY i.[itemid]`);
    res.json(r.recordset);
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.post('/api/items', requireAuth, async (req, res) => {
  const { ItemName, CategoryId, DivisionId, SellPrice, ReorderLevel, ReorderQty, Stock, UOM, priority } = req.body;
  const user = req.session.user?.loginId || 'admin';
  try {
    const r = await query(
      `INSERT INTO [Item] ([ItemName],[CategoryId],[DivisionId],[SellPrice],[ReorderLevel],[ReorderQty],[Stock],[UOM],[priority],[Status],[AddedBy],[AddedDate])
       OUTPUT INSERTED.[itemid]
       VALUES (@name,@catId,@divId,@sellPrice,@reorderLevel,@reorderQty,@stock,@uom,@priority,'Y',@user,GETDATE())`,
      {
        name: ItemName, catId: parseInt(CategoryId), divId: parseInt(DivisionId),
        sellPrice: parseFloat(SellPrice) || 0, reorderLevel: parseFloat(ReorderLevel) || 0,
        reorderQty: parseFloat(ReorderQty) || 0, stock: parseFloat(Stock) || 0,
        uom: UOM, priority: priority || 'M', user
      }
    );
    res.json({ success: true, itemid: r.recordset[0].itemid });
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.put('/api/items/:id', requireAuth, async (req, res) => {
  const { ItemName, CategoryId, DivisionId, SellPrice, ReorderLevel, ReorderQty, Stock, UOM, priority } = req.body;
  const user = req.session.user?.loginId || 'admin';
  try {
    await query(
      `UPDATE [Item] SET [ItemName]=@name,[CategoryId]=@catId,[DivisionId]=@divId,
       [SellPrice]=@sellPrice,[ReorderLevel]=@reorderLevel,[ReorderQty]=@reorderQty,
       [Stock]=@stock,[UOM]=@uom,[priority]=@priority,[ModifyBy]=@user,[ModifyDate]=GETDATE()
       WHERE [itemid]=@id`,
      {
        name: ItemName, catId: parseInt(CategoryId), divId: parseInt(DivisionId),
        sellPrice: parseFloat(SellPrice) || 0, reorderLevel: parseFloat(ReorderLevel) || 0,
        reorderQty: parseFloat(ReorderQty) || 0, stock: parseFloat(Stock) || 0,
        uom: UOM, priority: priority || 'M', user, id: parseInt(req.params.id)
      }
    );
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.delete('/api/items/:id', requireAuth, async (req, res) => {
  try {
    await query('DELETE FROM [Item] WHERE [itemid]=@id', { id: parseInt(req.params.id) });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.post('/api/items/bulk-delete', requireAuth, async (req, res) => {
  const { ids } = req.body;
  if (!ids || !ids.length) return res.status(400).json({ error: 'No IDs provided' });
  try {
    const placeholders = ids.map((_, i) => `@id${i}`).join(',');
    const params = {};
    ids.forEach((id, i) => { params[`id${i}`] = parseInt(id); });
    await query(`DELETE FROM [Item] WHERE [itemid] IN (${placeholders})`, params);
    res.json({ success: true, deleted: ids.length });
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.post('/api/items/export-xlsx', requireAuth, async (req, res) => {
  const { ids } = req.body;
  try {
    let r;
    const base = `SELECT i.[itemid],d.[DivisionName],c.[CategoryName],i.[ItemName],
                         i.[UOM],i.[Stock],i.[SellPrice],i.[ReorderLevel],i.[ReorderQty],i.[priority],i.[Status]
                  FROM [Item] i
                  LEFT JOIN [Category] c ON i.[CategoryId]=c.[CategoryId]
                  LEFT JOIN [Division] d ON i.[DivisionId]=d.[DivisionId]`;
    if (ids && ids.length) {
      const placeholders = ids.map((_, i) => `@id${i}`).join(',');
      const params = {};
      ids.forEach((id, i) => { params[`id${i}`] = parseInt(id); });
      r = await query(`${base} WHERE i.[itemid] IN (${placeholders}) ORDER BY i.[itemid]`, params);
    } else {
      r = await query(`${base} ORDER BY i.[itemid]`);
    }
    const ws = XLSX.utils.json_to_sheet(r.recordset);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'ItemMaster');
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Disposition', 'attachment; filename="item_master.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buf);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Vendor Master
app.get('/api/vendors', requireAuth, async (req, res) => {
  try {
    const whereClause = req.query.activeOnly === '1' ? "WHERE v.[Status] = 'Y'" : '';
    const r = await query(`
      SELECT v.[vendorid], v.[Name], v.[Mob], v.[Addr1], v.[Addr2],
             v.[Pin], v.[CompanyName], v.[PAN], v.[AadharNo], v.[GstNo],
             v.[BankName], v.[BankAccNo], v.[IFSCCode],
             v.[VendorEmail],
             v.[Status], v.[AddedBy], v.[AddedDate], v.[ModifyBy], v.[DateModify],
             v.[StateID], v.[CityID],
             s.[State] AS StateName,
             c.[City]  AS CityName
      FROM [Vendor] v
      LEFT JOIN [State] s ON v.[StateID] = s.[StateId]
      LEFT JOIN [City]  c ON v.[CityID]  = c.[CityId]
      ${whereClause}
      ORDER BY v.[vendorid]`);
    res.json(r.recordset);
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.post('/api/vendors', requireAuth, async (req, res) => {
  const { Name, Mob, Addr1, Addr2, CityID, StateID, Pin, CompanyName, GstNo, PAN, AadharNo, BankName, BankAccNo, IFSCCode, VendorEmail } = req.body;
  const user = req.session.user?.loginId || 'admin';
  try {
    const r = await query(
      `INSERT INTO [Vendor] ([Name],[Mob],[Addr1],[Addr2],[CityID],[StateID],[Pin],[CompanyName],[GstNo],[PAN],[AadharNo],[BankName],[BankAccNo],[IFSCCode],[VendorEmail],[Status],[AddedBy],[AddedDate])
       OUTPUT INSERTED.[vendorid]
       VALUES (@name,@mob,@addr1,@addr2,@cityId,@stateId,@pin,@company,@gst,@pan,@aadhar,@bank,@bankAcc,@ifsc,@vemail,'Y',@user,GETDATE())`,
      {
        name: Name || '', mob: Mob || '', addr1: Addr1 || '', addr2: Addr2 || '',
        cityId: CityID ? parseInt(CityID) : null, stateId: StateID ? parseInt(StateID) : null,
        pin: Pin || '', company: CompanyName || '', gst: GstNo || '', pan: PAN || '',
        aadhar: AadharNo || '', bank: BankName || '', bankAcc: BankAccNo || '', ifsc: IFSCCode || '',
        vemail: VendorEmail || '', user
      }
    );
    res.json({ success: true, vendorid: r.recordset[0].vendorid });
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.put('/api/vendors/:id', requireAuth, async (req, res) => {
  const { Name, Mob, Addr1, Addr2, CityID, StateID, Pin, CompanyName, GstNo, PAN, AadharNo, BankName, BankAccNo, IFSCCode, VendorEmail } = req.body;
  const user = req.session.user?.loginId || 'admin';
  try {
    await query(
      `UPDATE [Vendor] SET [Name]=@name,[Mob]=@mob,[Addr1]=@addr1,[Addr2]=@addr2,
       [CityID]=@cityId,[StateID]=@stateId,[Pin]=@pin,[CompanyName]=@company,
       [GstNo]=@gst,[PAN]=@pan,[AadharNo]=@aadhar,[BankName]=@bank,
       [BankAccNo]=@bankAcc,[IFSCCode]=@ifsc,[VendorEmail]=@vemail,
       [ModifyBy]=@user,[DateModify]=GETDATE()
       WHERE [vendorid]=@id`,
      {
        name: Name || '', mob: Mob || '', addr1: Addr1 || '', addr2: Addr2 || '',
        cityId: CityID ? parseInt(CityID) : null, stateId: StateID ? parseInt(StateID) : null,
        pin: Pin || '', company: CompanyName || '', gst: GstNo || '', pan: PAN || '',
        aadhar: AadharNo || '', bank: BankName || '', bankAcc: BankAccNo || '',
        ifsc: IFSCCode || '', vemail: VendorEmail || '', user, id: parseInt(req.params.id)
      }
    );
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.delete('/api/vendors/:id', requireAuth, async (req, res) => {
  try {
    await query('DELETE FROM [Vendor] WHERE [vendorid]=@id', { id: parseInt(req.params.id) });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.post('/api/vendors/bulk-delete', requireAuth, async (req, res) => {
  const { ids } = req.body;
  if (!ids || !ids.length) return res.status(400).json({ error: 'No IDs provided' });
  try {
    const placeholders = ids.map((_, i) => `@id${i}`).join(',');
    const params = {};
    ids.forEach((id, i) => { params[`id${i}`] = parseInt(id); });
    await query(`DELETE FROM [Vendor] WHERE [vendorid] IN (${placeholders})`, params);
    res.json({ success: true, deleted: ids.length });
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.post('/api/vendors/export-xlsx', requireAuth, async (req, res) => {
  const { ids } = req.body;
  try {
    let r;
    const base = `SELECT v.[vendorid],v.[Name],v.[Mob],v.[Addr1],v.[Addr2],
                         s.[State] AS StateName,c.[City] AS CityName,v.[Pin],
                         v.[CompanyName],v.[PAN],v.[AadharNo],v.[GstNo],
                         v.[BankName],v.[BankAccNo],v.[IFSCCode],v.[Status]
                  FROM [Vendor] v
                  LEFT JOIN [State] s ON v.[StateID]=s.[StateId]
                  LEFT JOIN [City]  c ON v.[CityID]=c.[CityId]`;
    if (ids && ids.length) {
      const placeholders = ids.map((_, i) => `@id${i}`).join(',');
      const params = {};
      ids.forEach((id, i) => { params[`id${i}`] = parseInt(id); });
      r = await query(`${base} WHERE v.[vendorid] IN (${placeholders}) ORDER BY v.[vendorid]`, params);
    } else {
      r = await query(`${base} ORDER BY v.[vendorid]`);
    }
    const ws = XLSX.utils.json_to_sheet(r.recordset);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'VendorDetails');
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Disposition', 'attachment; filename="vendor_details.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buf);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Dealer Master
app.get('/api/dealers', requireAuth, async (req, res) => {
  try {
    const { search, searchBy, page, pageSize, showInactive } = req.query;
    const pg = Math.max(1, parseInt(page) || 1);
    const ps = Math.min(200, Math.max(1, parseInt(pageSize) || 25));
    const offset = (pg - 1) * ps;

    // Always filter Active-only unless showInactive=1 is explicitly requested
    const conditions = showInactive === '1' ? [] : [`dm.[Status]='Y'`];
    const params = {};
    if (search) {
      if (searchBy === 'DealerID') {
        conditions.push(`dm.[DealerID]=@search`);
        params.search = parseInt(search);
      } else {
        conditions.push(`dm.[DealerCompanyName] LIKE @search`);
        params.search = `%${search}%`;
      }
    }
    const baseWhere = conditions.length ? ` WHERE ${conditions.join(' AND ')}` : '';

    const selectCols = `dm.[DealerID], dm.[DealerCompanyName], dm.[ContactPersonName],
             dm.[Addr1], dm.[Addr2], dm.[Addr3], dm.[Mobile], dm.[GST],
             dm.[PlaceOfSalesPromotion], dm.[State], dm.[City], dm.[Pin],
             dm.[TelNo], dm.[Email], dm.[DealerType], dm.[PAN], dm.[AadharNo],
             dm.[BankName], dm.[BankAccNo], dm.[IFSCCode], dm.[Status],
             dm.[DistCode], dm.[CourierId], dm.[DivisionId],
             dm.[AddedBy], dm.[AddedDate], dm.[ModifyBy], dm.[ModifyDate],
             c.[Name] AS CourierName, d.[DivisionName]`;
    const joins = `FROM [DealerMaster] dm
      LEFT JOIN [Courier]  c ON dm.[CourierId]  = c.[CourierId]
      LEFT JOIN [Division] d ON dm.[DivisionId] = d.[DivisionId]`;

    if (page) {
      const dataSql  = `SELECT ${selectCols} ${joins}${baseWhere} ORDER BY dm.[DealerID] OFFSET ${offset} ROWS FETCH NEXT ${ps} ROWS ONLY`;
      const countSql = `SELECT COUNT(*) AS total FROM [DealerMaster] dm${baseWhere}`;
      const [dataR, countR] = await Promise.all([query(dataSql, params), query(countSql, params)]);
      return res.json({ data: dataR.recordset, total: countR.recordset[0].total, page: pg, pageSize: ps });
    } else {
      const sql = `SELECT ${selectCols} ${joins}${baseWhere} ORDER BY dm.[DealerID]`;
      const r = await query(sql, params);
      return res.json(r.recordset);
    }
  } catch (e) { res.status(500).json({ error: e.message }); }
});


// â”€â”€ Vendor Performance Scorecard â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// GET /api/vendor-scorecard
// Returns per-vendor metrics: AvgLeadDays, AvgAccuracyPct, ReturnRatePct, TotalOrders
app.get('/api/vendor-scorecard', requireAuth, async (req, res) => {
  try {
    const r = await query(`
      WITH
      /* 1. Delivery speed: avg days from OrderDate â†’ InwardDate */
      DeliveryStats AS (
        SELECT o.[Vendorid] AS VendorId,
          AVG(CAST(DATEDIFF(day, o.[OrderDate], iw.[InwardDate]) AS FLOAT)) AS AvgLeadDays,
          COUNT(DISTINCT iw.[InwardId]) AS InwardCount
        FROM [Order] o
        INNER JOIN [Inward] iw ON iw.[OrderNumber] = o.[OrderNumber]
        WHERE o.[Status] = 'Y'
        GROUP BY o.[Vendorid]
      ),
      /* 2. Quantity accuracy: ordered qty vs received qty per matched item */
      QtyAccuracy AS (
        SELECT o.[Vendorid] AS VendorId,
          AVG(CASE
            WHEN oi.[TotalQty] > 0
              THEN CAST(ii.[TotalQty] AS FLOAT) / CAST(oi.[TotalQty] AS FLOAT) * 100
            ELSE NULL
          END) AS AvgAccuracyPct
        FROM [Order] o
        INNER JOIN [OrderItem]  oi ON oi.[OrderID]  = o.[OrderID]
        INNER JOIN [Inward]     iw ON iw.[OrderNumber] = o.[OrderNumber]
        INNER JOIN [InwardItem] ii ON ii.[InwardId] = iw.[InwardId]
                                   AND ii.[ItemId]  = oi.[ItemId]
        WHERE o.[Status] = 'Y'
        GROUP BY o.[Vendorid]
      ),
      /* 3. Return rate: InwardReturnItem lines / InwardItem lines */
      ReturnStats AS (
        SELECT iw.[VendorId],
          COUNT(DISTINCT irt.[InwardId] + CAST(irt.[ItemId] AS NVARCHAR)) AS ReturnLines,
          COUNT(DISTINCT ii.[InwardItemId])                                AS TotalLines
        FROM [Inward] iw
        LEFT JOIN [InwardItem]       ii  ON ii.[InwardId]  = iw.[InwardId]
        LEFT JOIN [InwardReturnItem] irt ON irt.[InwardId] = iw.[InwardId]
        WHERE iw.[VendorId] IS NOT NULL
        GROUP BY iw.[VendorId]
      ),
      /* 4. Order frequency */
      FreqStats AS (
        SELECT [Vendorid] AS VendorId, COUNT(DISTINCT [OrderID]) AS TotalOrders
        FROM [Order] WHERE [Status] = 'Y'
        GROUP BY [Vendorid]
      )
      SELECT
        v.[vendorid]    AS VendorId,
        v.[Name]        AS VendorName,
        v.[CompanyName],
        ISNULL(d.AvgLeadDays,    -1)  AS AvgLeadDays,
        ISNULL(d.InwardCount,     0)  AS InwardCount,
        ISNULL(q.AvgAccuracyPct, -1)  AS AvgAccuracyPct,
        ISNULL(r.ReturnLines,     0)  AS ReturnLines,
        ISNULL(r.TotalLines,      0)  AS TotalLines,
        CASE WHEN r.TotalLines > 0
             THEN CAST(r.ReturnLines AS FLOAT) / r.TotalLines * 100
             ELSE -1 END              AS ReturnRatePct,
        ISNULL(f.TotalOrders,     0)  AS TotalOrders
      FROM [Vendor] v
      LEFT JOIN DeliveryStats d ON d.VendorId = v.[vendorid]
      LEFT JOIN QtyAccuracy   q ON q.VendorId = v.[vendorid]
      LEFT JOIN ReturnStats   r ON r.VendorId = v.[vendorid]
      LEFT JOIN FreqStats     f ON f.VendorId = v.[vendorid]
      WHERE (v.[Status] IS NULL OR v.[Status] = 'Y')
      ORDER BY v.[Name]
    `);
    res.json(r.recordset || []);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// =================== TRANSACTIONS ===================

// Purchase Inward
app.get('/api/inward', requireAuth, async (req, res) => {
  try {
    const { inwardId, orderNo, divisionId, fromDate, toDate } = req.query;
    const params = {};
    const conditions = [];
    if (inwardId)   { conditions.push('i.[InwardId] = @inwardId'); params.inwardId = inwardId; }
    else if (orderNo) { conditions.push('i.[OrderNumber] LIKE @orderNo'); params.orderNo = '%' + orderNo + '%'; }
    if (divisionId && divisionId !== '0') { conditions.push('i.[DivisionId] = @divId'); params.divId = divisionId; }
    if (fromDate)   { conditions.push('CAST(i.[InwardDate] AS DATE) >= @fromDate'); params.fromDate = fromDate; }
    if (toDate)     { conditions.push('CAST(i.[InwardDate] AS DATE) <= @toDate');   params.toDate   = toDate; }
    const whereClause = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
    const q = `
      SELECT i.*,
             v.[Name]        AS VendorName,
             v.[CompanyName] AS VendorCompanyName,
             d.[DivisionName],
             /* EligibleAmt: ALL status='Y' items (incl. RP/SP partial amounts) */
             ISNULL((SELECT SUM(ii.[TotalAmt]) FROM [InwardItem] ii
                     WHERE ii.[InwardId]=i.[InwardId] AND ii.[status]='Y'),0) AS EligibleAmt,
             /* NewEligibleAmt: status='Y' items NOT yet accounted in any ASII */
             ISNULL((SELECT SUM(ii.[TotalAmt]) FROM [InwardItem] ii
                     WHERE ii.[InwardId]=i.[InwardId] AND ii.[status]='Y'
                     AND ii.[InwardItemId] NOT IN (
                       SELECT asii.[InwardItemId] FROM [ApprovalSheetInwardItem] asii
                       WHERE  asii.[InwardId]=i.[InwardId]
                     )),0) AS NewEligibleAmt,
             /* AspCount: how many distinct ASPs this inward has been included in */
             (SELECT COUNT(DISTINCT asii.[ApprovalSheetId])
              FROM [ApprovalSheetInwardItem] asii
              WHERE asii.[InwardId]=i.[InwardId]) AS AspCount,
             /* HasNewResolved: 1 if there are status='Y' InwardItems NOT yet in any ASII */
             CASE WHEN EXISTS(
               SELECT 1 FROM [InwardItem] ii
               WHERE ii.[InwardId]=i.[InwardId] AND ii.[status]='Y'
               AND ii.[InwardItemId] NOT IN (
                 SELECT asii.[InwardItemId] FROM [ApprovalSheetInwardItem] asii
                 WHERE  asii.[InwardId]=i.[InwardId]
               )
             ) THEN 1 ELSE 0 END AS HasNewResolved,
             /* UnresolvedCount: InwardReturnItem rows still pending (deleted on resolution) */
             (SELECT COUNT(*) FROM [InwardReturnItem] iri
              WHERE iri.[InwardId]=i.[InwardId] AND iri.[status]='Y') AS UnresolvedCount,
             /* HasMixedItems: has pending RP/SP items (for amber highlight when no ASP yet) */
             CASE WHEN EXISTS(SELECT 1 FROM [InwardReturnItem] iri
                              WHERE iri.[InwardId]=i.[InwardId] AND iri.[status]='Y')
                  THEN 1 ELSE 0 END AS HasMixedItems
      FROM   [Inward] i
      LEFT JOIN [Vendor]   v ON i.[VendorId]   = v.[vendorid]
      LEFT JOIN [Division] d ON i.[DivisionId] = d.[DivisionId]
      ${whereClause}
      ORDER BY i.[InwardId] DESC`;
    const r = await query(q, params);
    res.json(r.recordset);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/inward/:id/items', requireAuth, async (req, res) => {
  try {
    const r = await query(`
      SELECT ii.*, i.ItemName, c.CategoryName
      FROM [InwardItem] ii
      LEFT JOIN [Item]     i ON ii.[ItemId]     = i.[Itemid]
      LEFT JOIN [Category] c ON ii.[CategoryId] = c.[CategoryId]
      WHERE ii.[InwardId] = @id`, { id: req.params.id });
    res.json(r.recordset);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Items filtered by vendor (and optionally by division) via ItemVendorMapping
app.get('/api/inward/items-by-vendor', requireAuth, async (req, res) => {
  const { vendorId, divisionId } = req.query;
  try {
    let q = `
      SELECT ivm.[ItemId], i.[ItemName], i.[CategoryId], c.[CategoryName],
             ivm.[PriceRs] AS DefaultRate, ivm.[DivisionID]
      FROM [ItemVendorMapping] ivm
      INNER JOIN [Item]     i ON ivm.[ItemId]   = i.[Itemid]
      INNER JOIN [Category] c ON i.[CategoryId] = c.[CategoryId]
      WHERE ivm.[Status] = 'Y'
        AND i.[Status]   = 'Y'
        AND c.[Status]   = 'Y'`;
    const params = {};
    if (vendorId)   { q += ' AND ivm.[VendorId]   = @vid'; params.vid = parseInt(vendorId); }
    if (divisionId) { q += ' AND ivm.[DivisionID] = @did'; params.did = parseInt(divisionId); }
    q += ' ORDER BY i.[ItemName]';
    const r = await query(q, params);
    res.json(r.recordset);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Items filtered by division + vendor for Order Items modal
app.get('/api/orders/items-by-div-vendor', requireAuth, async (req, res) => {
  const { divisionId, vendorId } = req.query;
  try {
    let q = `
      SELECT DISTINCT ivm.[ItemId] AS Itemid, i.[ItemName], i.[CategoryId], c.[CategoryName],
             ivm.[DivisionID]
      FROM [ItemVendorMapping] ivm
      INNER JOIN [Item]     i ON ivm.[ItemId]   = i.[Itemid]
      INNER JOIN [Category] c ON i.[CategoryId] = c.[CategoryId]
      WHERE ivm.[Status] = 'Y'
        AND i.[Status]   = 'Y'
        AND c.[Status]   = 'Y'`;
    const params = {};
    if (divisionId) { q += ' AND ivm.[DivisionID] = @did'; params.did = parseInt(divisionId); }
    if (vendorId)   { q += ' AND ivm.[VendorId]   = @vid'; params.vid = parseInt(vendorId); }
    q += ' ORDER BY i.[ItemName]';
    const r = await query(q, params);
    res.json(r.recordset);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Map frontend ItemStatus labels â†’ DB ItemFlag codes
const IW_FLAG = {
  'Complete': 'C',
  'Return Complete': 'RC',
  'Return Pending': 'RP',
  'Scrap Complete': 'SC',
  'Scrap Pending': 'SP'
};

// Helper: insert one inward item; status is always 'Y'
// isEdit=true â†’ also sets ModifyBy/ModifyDate (row was re-inserted during a PUT)
async function _insertInwardItem(inwardId, it, user, isEdit = false) {
  const qty = parseInt(it.TotalQty) || 0;
  const dcq = parseInt(it.DCQty) || 0;
  const rate = parseFloat(it.Rate) || 0;
  const amt = qty * rate;
  try {
    if (isEdit) {
      await query(
        `INSERT INTO [InwardItem]([InwardId],[CategoryId],[ItemId],[DCQty],[TotalQty],
           [rate],[TotalAmt],[status],[AddedBy],[AddedDate],[ModifyBy],[ModifyDate])
         VALUES(@iid,@cat,@itmid,@dcq,@qty,@rate,@amt,'Y',@user,GETDATE(),@muser,GETDATE())`,
        {
          iid: inwardId, cat: it.CategoryId || null, itmid: it.ItemId || null,
          dcq, qty, rate, amt, user, muser: user
        });
    } else {
      await query(
        `INSERT INTO [InwardItem]([InwardId],[CategoryId],[ItemId],[DCQty],[TotalQty],
           [rate],[TotalAmt],[status],[AddedBy],[AddedDate])
         VALUES(@iid,@cat,@itmid,@dcq,@qty,@rate,@amt,'Y',@user,GETDATE())`,
        {
          iid: inwardId, cat: it.CategoryId || null, itmid: it.ItemId || null,
          dcq, qty, rate, amt, user
        });
    }
  } catch (_) {
    // Fallback without optional columns
    await query(
      `INSERT INTO [InwardItem]([InwardId],[ItemId],[TotalQty],[rate],[TotalAmt],[AddedBy],[AddedDate])
       VALUES(@iid,@itmid,@qty,@rate,@amt,@user,GETDATE())`,
      { iid: inwardId, itmid: it.ItemId || null, qty, rate, amt, user });
  }
  // Increment stock
  if (qty > 0 && it.ItemId) {
    await query('UPDATE [Item] SET [Stock] = ISNULL([Stock],0) + @qty WHERE [Itemid] = @itmid',
      { qty, itmid: it.ItemId });
  }
  return { qty, dcq, rate, amt, flag: IW_FLAG[it.ItemStatus] || 'C' };
}

// Helper: after all items saved, check for RP/SP and write InwardReturnItem
// isEdit=true â†’ also sets ModifyBy/ModifyDate on return item rows
async function _handleReturnItems(inwardId, savedItems, user, isEdit = false) {
  const needsReturn = savedItems.some(s => s.flag === 'RP' || s.flag === 'SP');
  if (!needsReturn) return;

  // Mark the Inward record as Open
  await query(`UPDATE [Inward] SET [InwardFlag]='Open' WHERE [InwardId]=@iid`, { iid: inwardId });

  // Clean any previous InwardReturnItem entries (idempotent on PUT)
  await query(`DELETE FROM [InwardReturnItem] WHERE [InwardId]=@iid`, { iid: inwardId });

  // Insert ONLY RP and SP items; pending qty = DCQty - TotalQty
  const returnItems = savedItems.filter(s => s.flag === 'RP' || s.flag === 'SP');
  for (const s of returnItems) {

    const pendingQty = Math.max(0, s.dcq - s.qty);
    try {
      const retCols = isEdit
        ? `[InwardId],[CategoryId],[ItemId],[DCQty],[TotalQty],[ItemFlag],
            [status],[Reason],[ReturnMode],[PersonName],[CourierName],[ReturnDate],[ReturnDocNo],
            [AddedBy],[AddedDate],[ModifyBy],[ModifyDate]`
        : `[InwardId],[CategoryId],[ItemId],[DCQty],[TotalQty],[ItemFlag],
            [status],[Reason],[ReturnMode],[PersonName],[CourierName],[ReturnDate],[ReturnDocNo],
            [AddedBy],[AddedDate]`;
      const retVals = isEdit
        ? `@iid,@cat,@itmid,@dcq,@rqty,@flag,'Y',@reason,@rmode,@pname,@cname,@rdate,@rdoc,@user,GETDATE(),@user,GETDATE()`
        : `@iid,@cat,@itmid,@dcq,@rqty,@flag,'Y',@reason,@rmode,@pname,@cname,@rdate,@rdoc,@user,GETDATE()`;
      await query(
        `INSERT INTO [InwardReturnItem] (${retCols}) VALUES(${retVals})`,
        {
          iid: inwardId, cat: s.CategoryId || null, itmid: s.ItemId || null,
          dcq: s.dcq, rqty: pendingQty, flag: s.flag,
          reason: s.Reason || null, rmode: s.ReturnMode || null,
          pname: s.PersonName || null, cname: s.CourierName || null,
          rdate: s.ReturnDate || null, rdoc: s.TrackId || null,
          user
        });
    } catch (e2) {
      // Minimal fallback if some columns don't exist yet
      await query(
        `INSERT INTO [InwardReturnItem]([InwardId],[ItemId],[DCQty],[TotalQty],[ItemFlag],[status],[AddedBy],[AddedDate])
         VALUES(@iid,@itmid,@dcq,@rqty,@flag,'Y',@user,GETDATE())`,
        { iid: inwardId, itmid: s.ItemId || null, dcq: s.dcq, rqty: pendingQty, flag: s.flag, user });
    }
  }
}

app.post('/api/inward', requireAuth, async (req, res) => {
  const { VendorId, DivisionId, OrderNumber, DCNumber, InvoiceNumber,
    InwardDate, items } = req.body;
  const user = req.session.user?.loginId || 'admin';
  try {
    // Insert Inward header (InwardFlag stays NULL until return items found)
    const r = await query(
      `INSERT INTO [Inward]([OrderNumber],[DCNumber],[InvoiceNumber],[InwardDate],
         [VendorId],[DivisionId],[Status],[AddedBy],[AddedDate])
       OUTPUT INSERTED.[InwardId]
       VALUES(@onum,@dcnum,@invnum,CAST(@date AS DATETIME)+CAST(CAST(GETDATE() AS TIME) AS DATETIME),@vid,@did,'Y',@user,GETDATE())`,
      {
        onum: OrderNumber || '', dcnum: DCNumber || '', invnum: InvoiceNumber || '',
        date: _withCurrentTime(InwardDate),
        vid: VendorId || null, did: DivisionId || null, user
      });
    const inwardId = r.recordset[0].InwardId;

    // Insert each item â†’ status 'Y', map ItemStatus to flag code
    const savedItems = [];
    for (const it of (items || [])) {
      const s = await _insertInwardItem(inwardId, it, user);
      savedItems.push({ ...it, ...s });   // merge original it fields + computed qty/dcq/flag
    }

    // If any RP or SP â†’ fill InwardReturnItem + set InwardFlag='Open'
    await _handleReturnItems(inwardId, savedItems, user);

    res.json({ success: true, InwardId: inwardId });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/inward/:inwardId', requireAuth, async (req, res) => {
  const inwardId = parseInt(req.params.inwardId);
  const { VendorId, DivisionId, OrderNumber, DCNumber, InvoiceNumber,
    InwardDate, items } = req.body;
  const user = req.session.user?.loginId || 'admin';
  try {
    // Update Inward header
    await query(
      `UPDATE [Inward] SET [OrderNumber]=@onum,[DCNumber]=@dcnum,[InvoiceNumber]=@invnum,
         [InwardDate]=CAST(@date AS DATETIME)+CAST(CAST(GETDATE() AS TIME) AS DATETIME),[VendorId]=@vid,[DivisionId]=@did,[InwardFlag]=NULL,
         [ModifyBy]=@user,[ModifyDate]=GETDATE()
       WHERE [InwardId]=@iid`,
      {
        onum: OrderNumber || '', dcnum: DCNumber || '', invnum: InvoiceNumber || '',
        date: _withCurrentTime(InwardDate), vid: VendorId || null, did: DivisionId || null,
        user, iid: inwardId
      });

    // Reverse old stock
    const oldItems = await query(
      `SELECT [ItemId],[TotalQty] FROM [InwardItem] WHERE [InwardId]=@iid`, { iid: inwardId });
    for (const old of (oldItems.recordset || [])) {
      await query('UPDATE [Item] SET [Stock] = ISNULL([Stock],0) - @qty WHERE [Itemid] = @itmid',
        { qty: old.TotalQty || 0, itmid: old.ItemId });
    }

    // Delete old item rows
    await query(`DELETE FROM [InwardItem] WHERE [InwardId]=@iid`, { iid: inwardId });

    // Re-insert all items
    const savedItems = [];
    for (const it of (items || [])) {
      const s = await _insertInwardItem(inwardId, it, user, true); // isEdit=true
      savedItems.push({ ...it, ...s });
    }

    // Re-evaluate return items
    await _handleReturnItems(inwardId, savedItems, user, true); // isEdit=true

    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/inward/:inwardId', requireAuth, async (req, res) => {
  const inwardId = parseInt(req.params.inwardId);
  try {
    // Reverse stock
    const oldItems = await query(
      `SELECT [ItemId],[TotalQty] FROM [InwardItem] WHERE [InwardId]=@iid`, { iid: inwardId });
    for (const old of (oldItems.recordset || [])) {
      await query('UPDATE [Item] SET [Stock] = ISNULL([Stock],0) - @qty WHERE [Itemid] = @itmid',
        { qty: old.TotalQty || 0, itmid: old.ItemId });
    }
    await query(`DELETE FROM [InwardReturnItem] WHERE [InwardId]=@iid`, { iid: inwardId });
    await query(`DELETE FROM [InwardItem]       WHERE [InwardId]=@iid`, { iid: inwardId });
    await query(`DELETE FROM [Inward]           WHERE [InwardId]=@iid`, { iid: inwardId });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/dealers/:id', requireAuth, async (req, res) => {
  try {
    const r = await query('SELECT * FROM [DealerMaster] WHERE [DealerID]=@id', { id: parseInt(req.params.id) });
    res.json(r.recordset[0] || null);
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.post('/api/dealers', requireAuth, async (req, res) => {
  const f = req.body;
  const user = req.session.user?.loginId || 'admin';
  try {
    const r = await query(
      `INSERT INTO [DealerMaster]
         ([DealerCompanyName],[ContactPersonName],[Addr1],[Addr2],[Addr3],
          [Mobile],[TelNo],[Email],[State],[City],[Pin],[GST],[PAN],[AadharNo],
          [BankName],[BankAccNo],[IFSCCode],[DealerType],[PlaceOfSalesPromotion],
          [DistCode],[DivisionId],[CourierId],[Status],[AddedBy],[AddedDate])
       OUTPUT INSERTED.[DealerID]
       VALUES
         (@company,@cp,@a1,@a2,@a3,@mob,@tel,@email,@state,@city,@pin,
          @gst,@pan,@aadhar,@bank,@bankac,@ifsc,@type,@place,@dist,
          @divId,@courierId,'Y',@user,GETDATE())`,
      {
        company: f.DealerCompanyName || '', cp: f.ContactPersonName || '',
        a1: f.Addr1 || '', a2: f.Addr2 || '', a3: f.Addr3 || '',
        mob: f.Mobile || '', tel: f.TelNo || '', email: f.Email || '',
        state: f.State || '', city: f.City || '', pin: f.Pin || '',
        gst: f.GST || '', pan: f.PAN || '', aadhar: f.AadharNo || '',
        bank: f.BankName || '', bankac: f.BankAccNo || '', ifsc: f.IFSCCode || '',
        type: f.DealerType || '', place: f.PlaceOfSalesPromotion || '',
        dist: f.DistCode || '',
        divId: f.DivisionId ? parseInt(f.DivisionId) : null,
        courierId: f.CourierId ? parseInt(f.CourierId) : null,
        user
      }
    );
    res.json({ success: true, DealerID: r.recordset[0].DealerID });
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.put('/api/dealers/:id', requireAuth, async (req, res) => {
  const f = req.body;
  const user = req.session.user?.loginId || 'admin';
  try {
    await query(
      `UPDATE [DealerMaster] SET
         [DealerCompanyName]=@company,[ContactPersonName]=@cp,
         [Addr1]=@a1,[Addr2]=@a2,[Addr3]=@a3,
         [Mobile]=@mob,[TelNo]=@tel,[Email]=@email,
         [State]=@state,[City]=@city,[Pin]=@pin,
         [GST]=@gst,[PAN]=@pan,[AadharNo]=@aadhar,
         [BankName]=@bank,[BankAccNo]=@bankac,[IFSCCode]=@ifsc,
         [DealerType]=@type,[PlaceOfSalesPromotion]=@place,
         [DistCode]=@dist,[DivisionId]=@divId,[CourierId]=@courierId,
         [ModifyBy]=@user,[ModifyDate]=GETDATE()
       WHERE [DealerID]=@id`,
      {
        company: f.DealerCompanyName || '', cp: f.ContactPersonName || '',
        a1: f.Addr1 || '', a2: f.Addr2 || '', a3: f.Addr3 || '',
        mob: f.Mobile || '', tel: f.TelNo || '', email: f.Email || '',
        state: f.State || '', city: f.City || '', pin: f.Pin || '',
        gst: f.GST || '', pan: f.PAN || '', aadhar: f.AadharNo || '',
        bank: f.BankName || '', bankac: f.BankAccNo || '', ifsc: f.IFSCCode || '',
        type: f.DealerType || '', place: f.PlaceOfSalesPromotion || '',
        dist: f.DistCode || '',
        divId: f.DivisionId ? parseInt(f.DivisionId) : null,
        courierId: f.CourierId ? parseInt(f.CourierId) : null,
        user, id: parseInt(req.params.id)
      }
    );
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.delete('/api/dealers/:id', requireAuth, async (req, res) => {
  try {
    await query('DELETE FROM [DealerMaster] WHERE [DealerID]=@id', { id: parseInt(req.params.id) });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.post('/api/dealers/bulk-delete', requireAuth, async (req, res) => {
  const { ids } = req.body;
  if (!ids || !ids.length) return res.status(400).json({ error: 'No IDs provided' });
  try {
    const placeholders = ids.map((_, i) => `@id${i}`).join(',');
    const params = {};
    ids.forEach((id, i) => { params[`id${i}`] = parseInt(id); });
    await query(`DELETE FROM [DealerMaster] WHERE [DealerID] IN (${placeholders})`, params);
    res.json({ success: true, deleted: ids.length });
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.post('/api/dealers/export-xlsx', requireAuth, async (req, res) => {
  const { ids } = req.body;
  try {
    const base = `
      SELECT dm.[DealerID],dm.[DealerCompanyName],dm.[ContactPersonName],
             dm.[Addr1],dm.[Addr2],dm.[Addr3],dm.[Mobile],dm.[GST],
             dm.[PlaceOfSalesPromotion],dm.[State],dm.[City],dm.[Pin],
             dm.[TelNo],dm.[Email],dm.[DealerType],dm.[PAN],dm.[AadharNo],
             dm.[BankName],dm.[BankAccNo],dm.[IFSCCode],dm.[Status],dm.[DistCode],
             c.[Name] AS CourierName, d.[DivisionName]
      FROM [DealerMaster] dm
      LEFT JOIN [Courier]  c ON dm.[CourierId]=c.[CourierId]
      LEFT JOIN [Division] d ON dm.[DivisionId]=d.[DivisionId]`;
    let r;
    if (ids && ids.length) {
      const placeholders = ids.map((_, i) => `@id${i}`).join(',');
      const params = {};
      ids.forEach((id, i) => { params[`id${i}`] = parseInt(id); });
      r = await query(`${base} WHERE dm.[DealerID] IN (${placeholders}) ORDER BY dm.[DealerID]`, params);
    } else {
      r = await query(`${base} ORDER BY dm.[DealerID]`);
    }
    const ws = XLSX.utils.json_to_sheet(r.recordset);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'DealerMaster');
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Disposition', 'attachment; filename="dealer_master.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buf);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// â”€â”€ Toggle Dealer Status â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
app.patch('/api/dealers/:id/status', requireAuth, async (req, res) => {
  const id = parseInt(req.params.id);
  const { Status } = req.body;
  const user = req.session.user?.loginId || 'admin';
  if (!['Y', 'N'].includes(Status))
    return res.status(400).json({ error: 'Status must be Y or N' });
  try {
    await query(
      `UPDATE [DealerMaster] SET [Status]=@status,[ModifyBy]=@user,[ModifyDate]=GETDATE() WHERE [DealerID]=@id`,
      { status: Status, user, id }
    );
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// â”€â”€ Sync Franchise Stores from Taqtics API â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// POST /api/dealers/sync-franchise
// Field mapping: storeNameâ†’DealerCompanyName, addressâ†’Addr1, areaâ†’City,
//   city(API)â†’State, entityIdâ†’DistCode (upsert key), tags[AOM]â†’ContactPersonName
app.post('/api/dealers/sync-franchise', requireAuth, async (req, res) => {
  try {
    // 1. Find Franchise DivisionId from Division Master
    const divRes = await query(
      `SELECT TOP 1 [DivisionId] FROM [Division] WHERE [DivisionName] LIKE @name`,
      { name: '%Franchise%' }
    );
    if (!divRes.recordset.length)
      return res.status(400).json({ error: 'Franchise division not found. Please create a Division named "Franchise" in Division Master first.' });
    const franchiseDivId = divRes.recordset[0].DivisionId;

    // 2. Call external Taqtics API
    const apiUrl   = process.env.TAQTICS_API_URL        || 'https://kisna.taqtics.co/v1/external/store';
    const apiToken = process.env.TAQTICS_ACCESS_TOKEN   || '';
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept':       'application/json',
        'Access-token': apiToken,
      }
    });
    if (!response.ok)
      throw new Error(`Taqtics API responded with ${response.status}: ${response.statusText}`);

    const raw    = await response.json();
    // Handle different possible response shapes
    const stores = Array.isArray(raw) ? raw : (raw.data || raw.stores || raw.results || []);
    if (!stores.length)
      return res.json({ success: true, message: 'API returned 0 stores.', inserted: 0, updated: 0 });

    const user = req.session.user?.loginId || 'admin';
    let inserted = 0, updated = 0, skipped = 0;

    for (const store of stores) {
      const tags     = store.tags || {};
      const distCode = (store.entityId || '').toString().trim();
      if (!distCode) { skipped++; continue; } // skip if no entityId

      // â”€â”€ Map API fields â†’ DB columns (truncated to column limits) â”€â”€â”€â”€â”€â”€â”€â”€â”€
      const _t = (s, n) => (s || '').trim().substring(0, n); // safe truncate

      const company       = _t(store.storeName,          100); // nvarchar(100)
      const addr1         = _t(store.address,            100); // nvarchar(100) â€” addresses can exceed 100 chars
      const city          = _t(store.area,               100); // area = actual city e.g. "Azamgarh"
      const state         = _t(store.city,               100); // city in API = State e.g. "Uttar Pradesh"
      const mobile        = _t(tags['Store-Contact-No'],  20); // phone numbers max ~15 digits
      const email         = _t(tags['Store-E-Mail-Id'],  100); // nvarchar(100)
      const contactPerson = _t(tags['AOM'],              100); // nvarchar(100)
      const zone          = _t(tags['Zone'],             100); // nvarchar(100)

      // â”€â”€ Upsert using DistCode as the unique key â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
      const existRes = await query(
        `SELECT [DealerID] FROM [DealerMaster] WHERE [DistCode]=@dc`,
        { dc: distCode }
      );

      if (existRes.recordset.length > 0) {
        // UPDATE â€” refresh store details but PRESERVE Status & financial fields
        const existId = existRes.recordset[0].DealerID;
        await query(
          `UPDATE [DealerMaster] SET
             [DealerCompanyName]=@company,[ContactPersonName]=@cp,
             [Addr1]=@addr1,[City]=@city,[State]=@state,
             [Mobile]=@mob,[Email]=@email,
             [PlaceOfSalesPromotion]=@zone,[DivisionId]=@divId,
             [ModifyBy]=@user,[ModifyDate]=GETDATE()
           WHERE [DealerID]=@id`,
          { company, cp: contactPerson, addr1, city, state,
            mob: mobile, email, zone, divId: franchiseDivId, user, id: existId }
        );
        updated++;
      } else {
        // INSERT â€” new store, Status='Y' by default
        await query(
          `INSERT INTO [DealerMaster]
             ([DealerCompanyName],[ContactPersonName],[Addr1],[City],[State],
              [Mobile],[Email],[PlaceOfSalesPromotion],[DistCode],[DivisionId],
              [Status],[AddedBy],[AddedDate])
           VALUES
             (@company,@cp,@addr1,@city,@state,
              @mob,@email,@zone,@dc,@divId,
              'Y',@user,GETDATE())`,
          { company, cp: contactPerson, addr1, city, state,
            mob: mobile, email, zone, dc: distCode, divId: franchiseDivId, user }
        );
        inserted++;
      }
    }

    res.json({
      success: true,
      message: `Sync complete: ${inserted} new store${inserted!==1?'s':''} added, ${updated} updated${skipped?', '+skipped+' skipped (no entityId)':''}.`,
      inserted, updated, skipped, total: stores.length
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── Sync Kisna Stores from SIS API ──────────────────────────────────────
// POST /api/dealers/sync-kisna
// Step 1: POST /api/Auth/login  → get JWT token
// Step 2: GET  /api/UserData/user-data with header x-jwt-token
// Upsert key: EntityId → DistCode
app.post('/api/dealers/sync-kisna', requireAuth, async (req, res) => {
  try {
    // 1. Resolve Kisna DivisionId (hardcoded as 1, but verified against DB for safety)
    const divRes = await query(
      `SELECT TOP 1 [DivisionId] FROM [Division] WHERE [DivisionId]=1 OR [DivisionName] LIKE @name`,
      { name: '%Kisna%' }
    );
    if (!divRes.recordset.length)
      return res.status(400).json({ error: 'Kisna division not found. Please ensure a Division with DivisionId=1 or named "Kisna" exists.' });
    const kisnaDivId = divRes.recordset[0].DivisionId;

    const baseUrl  = process.env.SIS_API_URL      || 'http://13.203.149.8:6002';
    const sisUser  = process.env.SIS_USERNAME     || 'admin';
    const sisPass  = process.env.SIS_PASSWORD     || 'Admin@123';

    // 2. Login to get JWT token
    const loginRes = await fetch(`${baseUrl}/api/Auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'text/plain' },
      body: JSON.stringify({ UserName: sisUser, Password: sisPass })
    });
    if (!loginRes.ok)
      throw new Error(`SIS login failed: ${loginRes.status} ${loginRes.statusText}`);
    const loginData = await loginRes.json();
    if (!loginData.Success || !loginData.Token)
      throw new Error(`SIS login rejected: ${loginData.Message || 'No token returned'}`);
    const token = loginData.Token;

    // 3. Fetch store data using the JWT token
    const dataRes = await fetch(`${baseUrl}/api/UserData/user-data`, {
      method: 'GET',
      headers: { 'Accept': 'text/plain', 'x-jwt-token': token }
    });
    if (!dataRes.ok)
      throw new Error(`SIS data fetch failed: ${dataRes.status} ${dataRes.statusText}`);
    const raw    = await dataRes.json();
    const stores = raw.Data || raw.data || [];
    if (!stores.length)
      return res.json({ success: true, message: 'SIS API returned 0 stores.', inserted: 0, updated: 0 });

    const user = req.session.user?.loginId || 'admin';
    let inserted = 0, updated = 0, skipped = 0;

    for (const store of stores) {
      const tags     = store.Tags || store.tags || {};
      const distCode = (store.EntityId || '').toString().trim();
      if (!distCode) { skipped++; continue; } // skip if no EntityId

      // ── Map SIS API fields → DB columns (truncated to column limits) ─────────
      const _t = (s, n) => (s || '').toString().trim().substring(0, n);

      const company           = _t(store.DealerCompanyName,   100); // nvarchar(100)
      const contactPerson     = _t(store.ContactPersonName,   100); // nvarchar(100)
      const addr1             = _t(store.Address,             100); // nvarchar(100)
      const addr2             = _t(store.Area,                100); // nvarchar(100)
      const city              = _t(store.City,                100); // nvarchar(100)
      const state             = _t(store.State,               100); // nvarchar(100)
      const pin               = _t(store.Pin,                   6); // nvarchar(6)  — PIN codes are 6 digits
      const mobile            = _t(tags['Store-Contact-No'],  100); // nvarchar(100)
      const telNo             = _t(store.TelNo || tags['TelNo'], 100); // nvarchar(100)
      const email             = _t(tags['Store-E-Mail-Id'],   100); // nvarchar(100)
      const gst               = _t(store.GST,                  15); // nvarchar(15)  — GST is 15 chars
      const placeOfSalesPromo = _t(store.PlaceOfSalesPromotion, 100); // nvarchar(100)
      const dealerType        = _t(store.DealerType,           100); // nvarchar(100)
      const dataContactTitle  = _t(store.DataContactTitle,      50); // nvarchar(50)
      const storeCode         = _t(store.StoreCode,             50); // unused in INSERT but kept for reference
      // Store-Status: 'Active' → 'Y', 'InActive' (or anything else) → 'N'
      const storeStatus       = (tags['Store-Status'] || '').trim().toLowerCase() === 'active' ? 'Y' : 'N';

      // ── Upsert using EntityId (= DistCode) as the unique key ─────────────
      const existRes = await query(
        `SELECT [DealerID] FROM [DealerMaster] WHERE [DistCode]=@dc`,
        { dc: distCode }
      );

      if (existRes.recordset.length > 0) {
        // UPDATE — refresh store details AND sync Status from API
        const existId = existRes.recordset[0].DealerID;
        await query(
          `UPDATE [DealerMaster] SET
             [DealerCompanyName]=@company, [ContactPersonName]=@cp,
             [Addr1]=@addr1, [Addr2]=@addr2,
             [City]=@city, [State]=@state, [Pin]=@pin,
             [Mobile]=@mob, [TelNo]=@tel, [Email]=@email,
             [GST]=@gst, [PlaceOfSalesPromotion]=@promo,
             [DealerType]=@dtype, [DataContactTitle]=@dct,
             [Status]=@status,
             [DivisionId]=@divId,
             [ModifyBy]=@user, [ModifyDate]=GETDATE()
           WHERE [DealerID]=@id`,
          { company, cp: contactPerson, addr1, addr2, city, state, pin,
            mob: mobile, tel: telNo, email, gst, promo: placeOfSalesPromo,
            dtype: dealerType, dct: dataContactTitle,
            status: storeStatus, divId: kisnaDivId, user, id: existId }
        );
        updated++;
      } else {
        // INSERT — Status driven by Store-Status tag from API, DivisionId=1 (Kisna)
        await query(
          `INSERT INTO [DealerMaster]
             ([DealerCompanyName],[ContactPersonName],[Addr1],[Addr2],
              [City],[State],[Pin],[Mobile],[TelNo],[Email],
              [GST],[PlaceOfSalesPromotion],[DealerType],[DataContactTitle],
              [DistCode],[DivisionId],[Status],[AddedBy],[AddedDate])
           VALUES
             (@company,@cp,@addr1,@addr2,
              @city,@state,@pin,@mob,@tel,@email,
              @gst,@promo,@dtype,@dct,
              @dc,@divId,@status,@user,GETDATE())`,
          { company, cp: contactPerson, addr1, addr2, city, state, pin,
            mob: mobile, tel: telNo, email, gst, promo: placeOfSalesPromo,
            dtype: dealerType, dct: dataContactTitle,
            dc: distCode, divId: kisnaDivId, status: storeStatus, user }
        );
        inserted++;
      }
    }

    res.json({
      success: true,
      message: `Kisna sync complete: ${inserted} new store${inserted!==1?'s':''} added, ${updated} updated${skipped?', '+skipped+' skipped (no EntityId)':''}.`,
      inserted, updated, skipped, total: stores.length
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/couriers', requireAuth, async (req, res) => {
  try {
    const r = await query(`
      SELECT c.[CourierId], c.[Name], c.[Mob], c.[Addr1], c.[Addr2],
             c.[City], c.[State], c.[Pin], c.[PAN], c.[AadharNo],
             c.[GstNo], c.[BankName], c.[BankAccNo], c.[IFSCCode],
             c.[Status], c.[StateID], c.[CityID], c.[CourierLink],
             c.[AddedBy], c.[AddedDate], c.[ModifyBy], c.[ModifyDate],
             s.[State] AS StateName,
             ct.[City] AS CityName
      FROM [Courier] c
      LEFT JOIN [State] s ON c.[StateID] = s.[StateID]
      LEFT JOIN [City]  ct ON c.[CityID] = ct.[CityID]
      ORDER BY c.[CourierId]`);
    res.json(r.recordset);
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.post('/api/couriers', requireAuth, async (req, res) => {
  const f = req.body;
  const user = req.session.user?.loginId || 'admin';
  try {
    const r = await query(
      `INSERT INTO [Courier]
         ([Name],[Mob],[Addr1],[Addr2],[City],[State],[Pin],[PAN],
          [AadharNo],[GstNo],[BankName],[BankAccNo],[IFSCCode],
          [StateID],[CityID],[CourierLink],[Status],[AddedBy],[AddedDate])
       OUTPUT INSERTED.[CourierId]
       VALUES
         (@name,@mob,@a1,@a2,@city,@state,@pin,@pan,
          @aadhar,@gst,@bank,@bankac,@ifsc,
          @stateId,@cityId,@courierLink,'Y',@user,GETDATE())`,
      {
        name: f.Name || '', mob: f.Mob || '', a1: f.Addr1 || '', a2: f.Addr2 || '',
        city: f.City || '', state: f.State || '', pin: f.Pin || '', pan: f.PAN || '',
        aadhar: f.AadharNo || '', gst: f.GstNo || '', bank: f.BankName || '',
        bankac: f.BankAccNo || '', ifsc: f.IFSCCode || '',
        stateId: f.StateID ? parseInt(f.StateID) : null,
        cityId: f.CityID ? parseInt(f.CityID) : null,
        courierLink: f.CourierLink || null,
        user
      }
    );
    res.json({ success: true, CourierId: r.recordset[0].CourierId });
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.put('/api/couriers/:id', requireAuth, async (req, res) => {
  const f = req.body;
  const user = req.session.user?.loginId || 'admin';
  try {
    await query(
      `UPDATE [Courier] SET
         [Name]=@name,[Mob]=@mob,[Addr1]=@a1,[Addr2]=@a2,
         [City]=@city,[State]=@state,[Pin]=@pin,[PAN]=@pan,
         [AadharNo]=@aadhar,[GstNo]=@gst,[BankName]=@bank,
         [BankAccNo]=@bankac,[IFSCCode]=@ifsc,
         [StateID]=@stateId,[CityID]=@cityId,[CourierLink]=@courierLink,
         [ModifyBy]=@user,[ModifyDate]=GETDATE()
       WHERE [CourierId]=@id`,
      {
        name: f.Name || '', mob: f.Mob || '', a1: f.Addr1 || '', a2: f.Addr2 || '',
        city: f.City || '', state: f.State || '', pin: f.Pin || '', pan: f.PAN || '',
        aadhar: f.AadharNo || '', gst: f.GstNo || '', bank: f.BankName || '',
        bankac: f.BankAccNo || '', ifsc: f.IFSCCode || '',
        stateId: f.StateID ? parseInt(f.StateID) : null,
        cityId: f.CityID ? parseInt(f.CityID) : null,
        courierLink: f.CourierLink || null,
        user, id: parseInt(req.params.id)
      }
    );
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.delete('/api/couriers/:id', requireAuth, async (req, res) => {
  try {
    await query('DELETE FROM [Courier] WHERE [CourierId]=@id', { id: parseInt(req.params.id) });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.post('/api/couriers/bulk-delete', requireAuth, async (req, res) => {
  const { ids } = req.body;
  if (!ids || !ids.length) return res.status(400).json({ error: 'No IDs provided' });
  try {
    const ph = ids.map((_, i) => `@id${i}`).join(',');
    const params = {}; ids.forEach((id, i) => { params[`id${i}`] = parseInt(id); });
    await query(`DELETE FROM [Courier] WHERE [CourierId] IN (${ph})`, params);
    res.json({ success: true, deleted: ids.length });
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.post('/api/couriers/export-xlsx', requireAuth, async (req, res) => {
  const { ids } = req.body;
  try {
    const base = `
      SELECT c.[CourierId],c.[Name],c.[Mob],c.[Addr1],c.[Addr2],
             c.[City],c.[State],c.[Pin],c.[PAN],c.[AadharNo],
             c.[GstNo],c.[BankName],c.[BankAccNo],c.[IFSCCode],
             c.[StateID],c.[CityID],c.[Status]
      FROM [Courier] c`;
    let r;
    if (ids && ids.length) {
      const ph = ids.map((_, i) => `@id${i}`).join(',');
      const params = {}; ids.forEach((id, i) => { params[`id${i}`] = parseInt(id); });
      r = await query(`${base} WHERE c.[CourierId] IN (${ph}) ORDER BY c.[CourierId]`, params);
    } else { r = await query(`${base} ORDER BY c.[CourierId]`); }
    const ws = XLSX.utils.json_to_sheet(r.recordset);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Couriers');
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Disposition', 'attachment; filename="couriers.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buf);
  } catch (e) { res.status(500).json({ error: e.message }); }
});


// User Master
// User Master â€” full CRUD + bulk ops
app.get('/api/users', requireAuth, async (req, res) => {
  try {
    const r = await query(`
      SELECT [UserID],[EmployeeID],[EmailId],[MobileNo],[Status],
             [UserName],[FirstName],[MiddleName],[LastName],[Gender],
             [AddressLine1],[AddressLine2],[City],[State],[Zip],[Country],[MaritalStatus],
             [AddedBy],[AddedDate],[ModifyBy],[ModifyDate]
      FROM [UserMaster] ORDER BY [UserID]`);
    res.json(r.recordset);
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.post('/api/users', requireAuth, async (req, res) => {
  const { EmployeeID, UserName, MobileNo, EmailId } = req.body;
  const user = req.session.user?.loginId || 'admin';
  try {
    const r = await query(
      `INSERT INTO [UserMaster]([EmployeeID],[UserName],[MobileNo],[EmailId],[Status],[AddedBy],[AddedDate])
       OUTPUT INSERTED.[UserID]
       VALUES(@empId,@uname,@mob,@email,'Y',@user,GETDATE())`,
      { empId: EmployeeID || '', uname: UserName || '', mob: MobileNo || '', email: EmailId || '', user });
    res.json({ success: true, UserID: r.recordset[0].UserID });
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.put('/api/users/:id', requireAuth, async (req, res) => {
  const { EmployeeID, UserName, MobileNo, EmailId, Status } = req.body;
  const user = req.session.user?.loginId || 'admin';
  try {
    await query(
      `UPDATE [UserMaster] SET [EmployeeID]=@empId,[UserName]=@uname,
       [MobileNo]=@mob,[EmailId]=@email,[Status]=@status,
       [ModifyBy]=@user,[ModifyDate]=GETDATE() WHERE [UserID]=@id`,
      {
        empId: EmployeeID || '', uname: UserName || '', mob: MobileNo || '',
        email: EmailId || '', status: Status || 'Y', user, id: parseInt(req.params.id)
      });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.delete('/api/users/:id', requireAuth, async (req, res) => {
  try {
    await query('DELETE FROM [UserMaster] WHERE [UserID]=@id', { id: parseInt(req.params.id) });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.post('/api/users/bulk-delete', requireAuth, async (req, res) => {
  const { ids } = req.body;
  if (!ids || !ids.length) return res.status(400).json({ error: 'No IDs provided' });
  try {
    const ph = ids.map((_, i) => `@id${i}`).join(',');
    const params = {}; ids.forEach((id, i) => { params[`id${i}`] = parseInt(id); });
    await query(`DELETE FROM [UserMaster] WHERE [UserID] IN (${ph})`, params);
    res.json({ success: true, deleted: ids.length });
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.post('/api/users/export-xlsx', requireAuth, async (req, res) => {
  const { ids } = req.body;
  try {
    const base = `SELECT [UserID],[EmployeeID],[UserName],[EmailId],[MobileNo],[Status] FROM [UserMaster]`;
    let r;
    if (ids && ids.length) {
      const ph = ids.map((_, i) => `@id${i}`).join(',');
      const params = {}; ids.forEach((id, i) => { params[`id${i}`] = parseInt(id); });
      r = await query(`${base} WHERE [UserID] IN (${ph}) ORDER BY [UserID]`, params);
    } else { r = await query(`${base} ORDER BY [UserID]`); }
    const ws = XLSX.utils.json_to_sheet(r.recordset);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'UserMaster');
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Disposition', 'attachment; filename="user_master.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buf);
  } catch (e) { res.status(500).json({ error: e.message }); }
});


// Login Master â€” full CRUD + forgot-password + bulk ops
app.get('/api/logins', requireAuth, async (req, res) => {
  try {
    const r = await query(`
      SELECT [ID],[LoginID],[Password],[Name],[SecurityQtn],[Answer],[Status],
             [AddedBy],[AddedDate],[ModifyBy],[ModifyDate]
      FROM [Login] ORDER BY [ID]`);
    res.json(r.recordset);
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.post('/api/logins', requireAuth, async (req, res) => {
  const { LoginID, Password, Name, SecurityQtn, Answer } = req.body;
  const user = req.session.user?.loginId || 'admin';
  try {
    const r = await query(
      `INSERT INTO [Login]([LoginID],[Password],[Name],[SecurityQtn],[Answer],[Status],[AddedBy],[AddedDate])
       OUTPUT INSERTED.[ID]
       VALUES(@lid,@pwd,@name,@sqtn,@ans,'Y',@user,GETDATE())`,
      { lid: LoginID || '', pwd: Password || '', name: Name || '', sqtn: SecurityQtn || '', ans: Answer || '', user });
    res.json({ success: true, ID: r.recordset[0].ID });
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.put('/api/logins/:id', requireAuth, async (req, res) => {
  const { LoginID, Password, Name, SecurityQtn, Answer } = req.body;
  const user = req.session.user?.loginId || 'admin';
  try {
    await query(
      `UPDATE [Login] SET [LoginID]=@lid,[Password]=@pwd,[Name]=@name,
       [SecurityQtn]=@sqtn,[Answer]=@ans,[ModifyBy]=@user,[ModifyDate]=GETDATE()
       WHERE [ID]=@id`,
      { lid: LoginID || '', pwd: Password || '', name: Name || '', sqtn: SecurityQtn || '', ans: Answer || '', user, id: parseInt(req.params.id) });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.delete('/api/logins/:id', requireAuth, async (req, res) => {
  try {
    await query('DELETE FROM [Login] WHERE [ID]=@id', { id: parseInt(req.params.id) });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});
// Forgot Password â€” validate LoginID + SecurityQtn + Answer, then update Password
app.post('/api/logins/forgot-password', requireAuth, async (req, res) => {
  const { LoginID, SecurityQtn, Answer, NewPassword } = req.body;
  try {
    const r = await query(
      `SELECT [ID] FROM [Login] WHERE [LoginID]=@lid AND [SecurityQtn]=@sqtn AND [Answer]=@ans`,
      { lid: LoginID, sqtn: SecurityQtn, ans: Answer });
    if (!r.recordset.length) return res.status(400).json({ error: 'Login ID, Security Question or Answer is incorrect.' });
    await query(
      `UPDATE [Login] SET [Password]=@pwd,[ModifyDate]=GETDATE() WHERE [LoginID]=@lid`,
      { pwd: NewPassword, lid: LoginID });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.post('/api/logins/bulk-delete', requireAuth, async (req, res) => {
  const { ids } = req.body;
  if (!ids || !ids.length) return res.status(400).json({ error: 'No IDs provided' });
  try {
    const ph = ids.map((_, i) => `@id${i}`).join(',');
    const params = {}; ids.forEach((id, i) => { params[`id${i}`] = parseInt(id); });
    await query(`DELETE FROM [Login] WHERE [ID] IN (${ph})`, params);
    res.json({ success: true, deleted: ids.length });
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.post('/api/logins/export-xlsx', requireAuth, async (req, res) => {
  const { ids } = req.body;
  try {
    const base = `SELECT [ID],[LoginID],[Name],[SecurityQtn],[Status] FROM [Login]`;
    let r;
    if (ids && ids.length) {
      const ph = ids.map((_, i) => `@id${i}`).join(',');
      const params = {}; ids.forEach((id, i) => { params[`id${i}`] = parseInt(id); });
      r = await query(`${base} WHERE [ID] IN (${ph}) ORDER BY [ID]`, params);
    } else { r = await query(`${base} ORDER BY [ID]`); }
    const ws = XLSX.utils.json_to_sheet(r.recordset);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'LoginMaster');
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Disposition', 'attachment; filename="login_master.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buf);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Kit Master â€” Kit-level grouped API
app.get('/api/kit-details', requireAuth, async (req, res) => {
  try {
    // Get all kits with division info
    const kits = await query(`
      SELECT km.[KitID], km.[KitName], km.[DivisionId], km.[Status],
             d.[DivisionName]
      FROM [KitMaster] km
      LEFT JOIN [Division] d ON km.[DivisionId] = d.[DivisionId]
      ORDER BY km.[KitID]`);
    // Get all detail rows with item names
    const details = await query(`
      SELECT kd.[KitMasterDetailID], kd.[KitID], kd.[ItemID], kd.[ItemQty], i.[ItemName]
      FROM [KitMasterDetail] kd
      LEFT JOIN [Item] i ON kd.[ItemID] = i.[itemid]
      ORDER BY kd.[KitID], kd.[KitMasterDetailID]`);
    // Group details by KitID
    const detMap = {};
    details.recordset.forEach(r => {
      if (!detMap[r.KitID]) detMap[r.KitID] = [];
      detMap[r.KitID].push({ KitMasterDetailID: r.KitMasterDetailID, ItemID: r.ItemID, ItemName: r.ItemName, ItemQty: Math.round(r.ItemQty || 0) });
    });
    const result = kits.recordset.map(k => ({ ...k, Items: detMap[k.KitID] || [] }));
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.post('/api/kit-details', requireAuth, async (req, res) => {
  const { DivisionId, KitName, items } = req.body; // items = [{ItemId, ItemQty}]
  const user = req.session.user?.loginId || 'admin';
  if (!items || !items.length) return res.status(400).json({ error: 'At least 1 item required' });
  try {
    const ins = await query(
      `INSERT INTO [KitMaster]([KitName],[DivisionId],[Status],[AddedBy],[AddedDate])
       OUTPUT INSERTED.[KitID]
       VALUES (@name,@divId,'Y',@user,GETDATE())`,
      { name: KitName, divId: parseInt(DivisionId), user });
    const kitId = ins.recordset[0].KitID;
    for (const item of items) {
      await query(
        `INSERT INTO [KitMasterDetail]([KitID],[ItemID],[ItemQty],[Status],[AddedBy],[AddedDate])
         VALUES (@kitId,@itemId,@itemQty,'Y',@user,GETDATE())`,
        { kitId, itemId: parseInt(item.ItemId), itemQty: Math.round(parseFloat(item.ItemQty) || 1), user });
    }
    res.json({ success: true, KitID: kitId });
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.put('/api/kit-details/:kitId', requireAuth, async (req, res) => {
  const { DivisionId, KitName, items } = req.body; // items = [{ItemId, ItemQty}]
  const user = req.session.user?.loginId || 'admin';
  const kitId = parseInt(req.params.kitId);
  if (!items || !items.length) return res.status(400).json({ error: 'At least 1 item required' });
  try {
    await query(
      `UPDATE [KitMaster] SET [KitName]=@name,[DivisionId]=@divId,[ModifyBy]=@user,[ModifyDate]=GETDATE()
       WHERE [KitID]=@kitId`,
      { name: KitName, divId: parseInt(DivisionId), user, kitId });
    await query('DELETE FROM [KitMasterDetail] WHERE [KitID]=@kitId', { kitId });
    for (const item of items) {
      await query(
        `INSERT INTO [KitMasterDetail]([KitID],[ItemID],[ItemQty],[Status],[AddedBy],[AddedDate])
         VALUES (@kitId,@itemId,@itemQty,'Y',@user,GETDATE())`,
        { kitId, itemId: parseInt(item.ItemId), itemQty: Math.round(parseFloat(item.ItemQty) || 1), user });
    }
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.delete('/api/kit-details/:kitId', requireAuth, async (req, res) => {
  const kitId = parseInt(req.params.kitId);
  try {
    await query('DELETE FROM [KitMasterDetail] WHERE [KitID]=@kitId', { kitId });
    await query('DELETE FROM [KitMaster] WHERE [KitID]=@kitId', { kitId });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.post('/api/kit-details/bulk-delete', requireAuth, async (req, res) => {
  const { kitIds } = req.body;
  if (!kitIds || !kitIds.length) return res.status(400).json({ error: 'No Kit IDs provided' });
  try {
    const ph = kitIds.map((_, i) => `@id${i}`).join(',');
    const params = {}; kitIds.forEach((id, i) => { params[`id${i}`] = parseInt(id); });
    await query(`DELETE FROM [KitMasterDetail] WHERE [KitID] IN (${ph})`, params);
    await query(`DELETE FROM [KitMaster] WHERE [KitID] IN (${ph})`, params);
    res.json({ success: true, deleted: kitIds.length });
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.post('/api/kit-details/export-xlsx', requireAuth, async (req, res) => {
  const { kitIds } = req.body;
  try {
    const base = `
      SELECT km.[KitID], km.[KitName], d.[DivisionName], i.[ItemName],
             CAST(kd.[ItemQty] AS INT) AS ItemQty, km.[Status]
      FROM [KitMasterDetail] kd
      LEFT JOIN [KitMaster] km ON kd.[KitID]=km.[KitID]
      LEFT JOIN [Division]  d  ON km.[DivisionId]=d.[DivisionId]
      LEFT JOIN [Item]      i  ON kd.[ItemID]=i.[itemid]`;
    let r;
    if (kitIds && kitIds.length) {
      const ph = kitIds.map((_, i) => `@id${i}`).join(',');
      const params = {}; kitIds.forEach((id, i) => { params[`id${i}`] = parseInt(id); });
      r = await query(`${base} WHERE km.[KitID] IN (${ph}) ORDER BY km.[KitID]`, params);
    } else { r = await query(`${base} ORDER BY km.[KitID]`); }
    const ws = XLSX.utils.json_to_sheet(r.recordset);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'KitMaster');
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Disposition', 'attachment; filename="kit_master.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buf);
  } catch (e) { res.status(500).json({ error: e.message }); }
});
// Items-Vendor Mapping
app.get('/api/item-vendor-mapping', requireAuth, async (req, res) => {
  try {
    const r = await query(`
      SELECT ivm.[ID], ivm.[ItemId], ivm.[VendorId], ivm.[DivisionID],
             ivm.[Remark], ivm.[PriceRs], ivm.[GST], ivm.[Status],
             ivm.[AddedBy], ivm.[AddedDate], ivm.[ModifyBy], ivm.[ModifyDate],
             i.[ItemName],
             v.[Name] AS VendorName,
             d.[DivisionName]
      FROM [ItemVendorMapping] ivm
      LEFT JOIN [Item]     i ON ivm.[ItemId]     = i.[Itemid]
      LEFT JOIN [Vendor]   v ON ivm.[VendorId]   = v.[VendorId]
      LEFT JOIN [Division] d ON ivm.[DivisionID] = d.[DivisionID]
      ORDER BY ivm.[ID]`);
    res.json(r.recordset);
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.post('/api/item-vendor-mapping', requireAuth, async (req, res) => {
  const { ItemId, VendorId, DivisionID, PriceRs, GST, Remark } = req.body;
  const user = req.session.user?.loginId || 'admin';
  try {
    const r = await query(
      `INSERT INTO [ItemVendorMapping] ([ItemId],[VendorId],[DivisionID],[PriceRs],[GST],[Remark],[Status],[AddedBy],[AddedDate])
       OUTPUT INSERTED.[ID]
       VALUES (@itemId,@vendorId,@divId,@price,@gst,@remark,'Y',@user,GETDATE())`,
      {
        itemId: parseInt(ItemId), vendorId: parseInt(VendorId), divId: parseInt(DivisionID),
        price: parseFloat(PriceRs) || 0, gst: parseFloat(GST) || 0,
        remark: Remark || '', user
      }
    );
    res.json({ success: true, ID: r.recordset[0].ID });
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.put('/api/item-vendor-mapping/:id', requireAuth, async (req, res) => {
  const { ItemId, VendorId, DivisionID, PriceRs, GST, Remark } = req.body;
  const user = req.session.user?.loginId || 'admin';
  try {
    await query(
      `UPDATE [ItemVendorMapping] SET
         [ItemId]=@itemId, [VendorId]=@vendorId, [DivisionID]=@divId,
         [PriceRs]=@price, [GST]=@gst, [Remark]=@remark,
         [ModifyBy]=@user, [ModifyDate]=GETDATE()
       WHERE [ID]=@id`,
      {
        itemId: parseInt(ItemId), vendorId: parseInt(VendorId), divId: parseInt(DivisionID),
        price: parseFloat(PriceRs) || 0, gst: parseFloat(GST) || 0,
        remark: Remark || '', user, id: parseInt(req.params.id)
      }
    );
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.delete('/api/item-vendor-mapping/:id', requireAuth, async (req, res) => {
  try {
    await query('DELETE FROM [ItemVendorMapping] WHERE [ID]=@id', { id: parseInt(req.params.id) });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.post('/api/item-vendor-mapping/bulk-delete', requireAuth, async (req, res) => {
  const { ids } = req.body;
  if (!ids || !ids.length) return res.status(400).json({ error: 'No IDs provided' });
  try {
    const placeholders = ids.map((_, i) => `@id${i}`).join(',');
    const params = {};
    ids.forEach((id, i) => { params[`id${i}`] = parseInt(id); });
    await query(`DELETE FROM [ItemVendorMapping] WHERE [ID] IN (${placeholders})`, params);
    res.json({ success: true, deleted: ids.length });
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.post('/api/item-vendor-mapping/export-xlsx', requireAuth, async (req, res) => {
  const { ids } = req.body;
  try {
    let r;
    const base = `SELECT ivm.[ID],i.[ItemName],v.[Name] AS VendorName,d.[DivisionName],
                         ivm.[PriceRs],ivm.[GST],ivm.[Remark],ivm.[Status],ivm.[AddedBy],ivm.[AddedDate]
                  FROM [ItemVendorMapping] ivm
                  LEFT JOIN [Item] i ON ivm.[ItemId]=i.[Itemid]
                  LEFT JOIN [Vendor] v ON ivm.[VendorId]=v.[VendorId]
                  LEFT JOIN [Division] d ON ivm.[DivisionID]=d.[DivisionID]`;
    if (ids && ids.length) {
      const placeholders = ids.map((_, i) => `@id${i}`).join(',');
      const params = {};
      ids.forEach((id, i) => { params[`id${i}`] = parseInt(id); });
      r = await query(`${base} WHERE ivm.[ID] IN (${placeholders}) ORDER BY ivm.[ID]`, params);
    } else {
      r = await query(`${base} ORDER BY ivm.[ID]`);
    }
    const ws = XLSX.utils.json_to_sheet(r.recordset);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'ItemVendorMapping');
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Disposition', 'attachment; filename="item_vendor_mapping.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buf);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Kisna Region State
app.get('/api/kisna-region-states', requireAuth, async (req, res) => {
  try {
    const r = await query('SELECT [ID], [Region], [State], [StateCode], [Status], [AddedBy], [AddedDate], [ModifyBy], [ModifyDate] FROM [KisnaRegionState] ORDER BY [ID]');
    res.json(r.recordset);
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.post('/api/kisna-region-states', requireAuth, async (req, res) => {
  const { Region, State, StateCode } = req.body;
  const user = req.session.user?.loginId || 'admin';
  try {
    const r = await query(
      `INSERT INTO [KisnaRegionState] ([Region], [State], [StateCode], [Status], [AddedBy], [AddedDate])
       OUTPUT INSERTED.[ID]
       VALUES (@region, @state, @stateCode, 'Y', @user, GETDATE())`,
      { region: Region, state: State, stateCode: StateCode, user }
    );
    res.json({ success: true, ID: r.recordset[0].ID });
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.put('/api/kisna-region-states/:id', requireAuth, async (req, res) => {
  const { Region, State, StateCode } = req.body;
  const user = req.session.user?.loginId || 'admin';
  try {
    await query(
      `UPDATE [KisnaRegionState] SET [Region]=@region, [State]=@state, [StateCode]=@stateCode,
       [ModifyBy]=@user, [ModifyDate]=GETDATE() WHERE [ID]=@id`,
      { region: Region, state: State, stateCode: StateCode, user, id: parseInt(req.params.id) }
    );
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.delete('/api/kisna-region-states/:id', requireAuth, async (req, res) => {
  try {
    await query('DELETE FROM [KisnaRegionState] WHERE [ID]=@id', { id: parseInt(req.params.id) });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.post('/api/kisna-region-states/bulk-delete', requireAuth, async (req, res) => {
  const { ids } = req.body;
  if (!ids || !ids.length) return res.status(400).json({ error: 'No IDs provided' });
  try {
    const placeholders = ids.map((_, i) => `@id${i}`).join(',');
    const params = {};
    ids.forEach((id, i) => { params[`id${i}`] = parseInt(id); });
    await query(`DELETE FROM [KisnaRegionState] WHERE [ID] IN (${placeholders})`, params);
    res.json({ success: true, deleted: ids.length });
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.post('/api/kisna-region-states/export-xlsx', requireAuth, async (req, res) => {
  const { ids } = req.body;
  try {
    let r;
    const base = 'SELECT [ID],[Region],[State],[StateCode],[Status],[AddedBy],[AddedDate] FROM [KisnaRegionState]';
    if (ids && ids.length) {
      const placeholders = ids.map((_, i) => `@id${i}`).join(',');
      const params = {};
      ids.forEach((id, i) => { params[`id${i}`] = parseInt(id); });
      r = await query(`${base} WHERE [ID] IN (${placeholders}) ORDER BY [ID]`, params);
    } else {
      r = await query(`${base} ORDER BY [ID]`);
    }
    const ws = XLSX.utils.json_to_sheet(r.recordset);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'KisnaRegionState');
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Disposition', 'attachment; filename="kisna_region_state.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buf);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Category / Item Category Code
app.get('/api/category-codes', requireAuth, async (req, res) => {
  try {
    const r = await query('SELECT [ID], [ItemCategory], [Category], [Status], [AddedBy], [AddedDate], [ModifyBy], [ModifyDate] FROM [CategoryCode] ORDER BY [ID]');
    res.json(r.recordset);
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.post('/api/category-codes', requireAuth, async (req, res) => {
  const { ItemCategory, Category } = req.body;
  const user = req.session.user?.loginId || 'admin';
  try {
    const r = await query(
      `INSERT INTO [CategoryCode] ([ItemCategory], [Category], [Status], [AddedBy], [AddedDate])
       OUTPUT INSERTED.[ID]
       VALUES (@itemCat, @cat, 'Y', @user, GETDATE())`,
      { itemCat: ItemCategory, cat: Category, user }
    );
    res.json({ success: true, ID: r.recordset[0].ID });
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.put('/api/category-codes/:id', requireAuth, async (req, res) => {
  const { ItemCategory, Category } = req.body;
  const user = req.session.user?.loginId || 'admin';
  try {
    await query(
      `UPDATE [CategoryCode] SET [ItemCategory]=@itemCat, [Category]=@cat,
       [ModifyBy]=@user, [ModifyDate]=GETDATE() WHERE [ID]=@id`,
      { itemCat: ItemCategory, cat: Category, user, id: parseInt(req.params.id) }
    );
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.delete('/api/category-codes/:id', requireAuth, async (req, res) => {
  try {
    await query('DELETE FROM [CategoryCode] WHERE [ID]=@id', { id: parseInt(req.params.id) });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.post('/api/category-codes/bulk-delete', requireAuth, async (req, res) => {
  const { ids } = req.body;
  if (!ids || !ids.length) return res.status(400).json({ error: 'No IDs provided' });
  try {
    const placeholders = ids.map((_, i) => `@id${i}`).join(',');
    const params = {};
    ids.forEach((id, i) => { params[`id${i}`] = parseInt(id); });
    await query(`DELETE FROM [CategoryCode] WHERE [ID] IN (${placeholders})`, params);
    res.json({ success: true, deleted: ids.length });
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.post('/api/category-codes/export-xlsx', requireAuth, async (req, res) => {
  const { ids } = req.body;
  try {
    let r;
    const base = 'SELECT [ID],[ItemCategory],[Category],[Status],[AddedBy],[AddedDate] FROM [CategoryCode]';
    if (ids && ids.length) {
      const placeholders = ids.map((_, i) => `@id${i}`).join(',');
      const params = {};
      ids.forEach((id, i) => { params[`id${i}`] = parseInt(id); });
      r = await query(`${base} WHERE [ID] IN (${placeholders}) ORDER BY [ID]`, params);
    } else {
      r = await query(`${base} ORDER BY [ID]`);
    }
    const ws = XLSX.utils.json_to_sheet(r.recordset);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'CategoryCode');
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Disposition', 'attachment; filename="category_item_codes.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buf);
  } catch (e) { res.status(500).json({ error: e.message }); }
});





// =================== ISSUE ITEMS â€“ FULL CRUD ===================

// GET all dealers (with optional divisionId filter)
app.get('/api/dealers', requireAuth, async (req, res) => {
  try {
    const { divisionId, search } = req.query;
    let q = `SELECT [DealerID],[DealerCompanyName],[ContactPersonName],[DistCode],
                    [DivisionId],[Mobile1]
             FROM [DealerMaster] WHERE [Status]='Y'`;
    const params = {};
    if (divisionId) { q += ' AND [DivisionId]=@did'; params.did = parseInt(divisionId); }
    if (search) {
      q += ` AND ([DealerCompanyName] LIKE @s OR [DistCode] LIKE @s OR [ContactPersonName] LIKE @s)`;
      params.s = '%' + search + '%';
    }
    q += ' ORDER BY [DealerCompanyName]';
    const r = await query(q, params);
    res.json(r.recordset);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET items filtered by DivisionID
app.get('/api/items-by-division', requireAuth, async (req, res) => {
  try {
    const { divisionId } = req.query;
    let q = `SELECT [Itemid],[ItemName],[Stock],[ReorderLevel],
                    ISNULL([Stock],0)-ISNULL([ReorderLevel],0) AS AvailableQty
             FROM [Item] WHERE [Status]='Y'`;
    const params = {};
    if (divisionId) { q += ' AND [DivisionID]=@did'; params.did = parseInt(divisionId); }
    q += ' ORDER BY [ItemName]';
    const r = await query(q, params);
    res.json(r.recordset);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET all issues with full joins
app.get('/api/issues', requireAuth, async (req, res) => {
  try {
    const r = await query(`
      SELECT iss.[IssueId], iss.[RequestMode], iss.[RequestByEmpName], iss.[DepName],
             iss.[IssueDate], iss.[IsIssueClose], iss.[DeliverMode],
             iss.[DeliverByPersonName], iss.[CourierName], iss.[TrackId],
             iss.[CourierPersonMob], iss.[CourierPersonLocation], iss.[IssueNote],
             iss.[DivisionId], iss.[DistCode], iss.[Status], iss.[AddedBy], iss.[AddedDate],
             iss.[RequestId],
             d.[DivisionName],
             dm.[DealerCompanyName], dm.[ContactPersonName]
      FROM [Issue] iss
      LEFT JOIN [Division]    d  ON iss.[DivisionId]          = d.[DivisionId]
      LEFT JOIN [DealerMaster] dm ON iss.[DistCode]           = dm.[DistCode]
      ORDER BY iss.[IssueId] DESC`);
    res.json(r.recordset);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET items for one issue
app.get('/api/issues/:id/items', requireAuth, async (req, res) => {
  try {
    const r = await query(`
      SELECT ii.[IssueItemId], ii.[IssueId], ii.[ItemId], ii.[RequestQty],
             ii.[IssueQty], ii.[PendingQty], ii.[ItemFlag], ii.[Status],
             ii.[RequestId], i.[ItemName],
             ISNULL(i.[Stock],0)-ISNULL(i.[ReorderLevel],0) AS AvailableQty
      FROM [IssueItem] ii
      LEFT JOIN [Item] i ON ii.[ItemId] = i.[Itemid]
      WHERE ii.[IssueId]=@id AND ii.[Status]='Y'`,
      { id: parseInt(req.params.id) });
    res.json(r.recordset);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST â€“ create new issue
app.post('/api/issues', requireAuth, async (req, res) => {
  const { RequestMode, DivisionId, DistCode, RequestedForDealerID, RequestByEmpName, DepName, IssueDate,
    DeliverMode, DeliverByPersonName, CourierId, CourierName, TrackId,
    CourierPersonMob, CourierPersonLocation, IssueNote, items } = req.body;
  const user = req.session.user?.loginId || 'admin';
  try {
    // Calculate IsIssueClose: if all items have IssueQty >= RequestQty â†’ Close
    const allComplete = (items || []).every(it => (parseInt(it.IssueQty) || 0) >= (parseInt(it.RequestQty) || 0));
    const isClose = allComplete ? 'Close' : 'Open';

    // Get next RequestId (max + 1)
    const reqIdRes = await query(`SELECT ISNULL(MAX([RequestId]),0)+1 AS nextId FROM [Issue]`);
    const requestId = reqIdRes.recordset[0]?.nextId || 1;

    const r = await query(
      `INSERT INTO [Issue]([RequestMode],[RequestByEmpName],[DepName],[IssueDate],
         [DeliverMode],[DeliverByPersonName],[CourierId],[CourierName],[TrackId],
         [CourierPersonMob],[CourierPersonLocation],[IssueNote],
         [IsIssueClose],[DivisionId],[DistCode],[RequestedForDealerID],[Status],[AddedBy],[AddedDate],[RequestId])
       OUTPUT INSERTED.[IssueId]
       VALUES(@rmode,@reqby,@dep,CAST(@date AS DATETIME)+CAST(CAST(GETDATE() AS TIME) AS DATETIME),
              @delmode,@delperson,@cid,@cname,@tid,
              @cmob,@cloc,@note,
              @close,@did,@dist,@dealid,'Y',@user,GETDATE(),@reqid)`,
      {
        rmode: RequestMode || null, reqby: RequestByEmpName || null, dep: DepName || null,
        date: IssueDate,
        delmode: DeliverMode || null, delperson: DeliverByPersonName || null,
        cid: CourierId ? parseInt(CourierId) : null,
        cname: CourierName || null, tid: TrackId || null,
        cmob: CourierPersonMob || null, cloc: CourierPersonLocation || null,
        note: IssueNote || null, close: isClose,
        did: DivisionId || null, dist: DistCode || null,
        dealid: RequestedForDealerID ? parseInt(RequestedForDealerID) : null,
        user, reqid: requestId
      });
    const issueId = r.recordset[0].IssueId;

    // Insert IssueItem rows
    let srlNo = 1;
    for (const it of (items || [])) {
      const reqQty = parseInt(it.RequestQty) || 0;
      const issueQty = parseInt(it.IssueQty) || 0;
      const pendQty = Math.max(0, reqQty - issueQty);
      const flag = pendQty === 0 ? 'C' : 'P';
      try {
        await query(
          `INSERT INTO [IssueItem]([IssueId],[ItemId],[RequestQty],[IssueQty],
             [PendingQty],[ItemFlag],[Status],[AddedBy],[AddedDate],[RequestId])
           VALUES(@iid,@itmid,@rqty,@iqty,@pqty,@flag,'Y',@user,GETDATE(),@reqid)`,
          {
            iid: issueId, itmid: it.ItemId || null, rqty: reqQty, iqty: issueQty,
            pqty: pendQty, flag, user, reqid: requestId
          });
      } catch (_) { }
      // Decrement stock
      if (issueQty > 0 && it.ItemId) {
        await query('UPDATE [Item] SET [Stock]=ISNULL([Stock],0)-@qty WHERE [Itemid]=@itmid',
          { qty: issueQty, itmid: it.ItemId });
      }
      srlNo++;
    }
    res.json({ success: true, IssueId: issueId });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// PUT â€“ update track ID only
app.put('/api/issues/:id/track', requireAuth, async (req, res) => {
  const id = parseInt(req.params.id);
  const { TrackId } = req.body;
  const user = req.session.user?.loginId || 'admin';
  try {
    await query(
      `UPDATE [Issue] SET [TrackId]=@tid,[ModifyBy]=@user,[ModifyDate]=GETDATE() WHERE [IssueId]=@id`,
      { tid: TrackId || null, user, id });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// PUT â€“ update track ID AND send delivery email
app.put('/api/issues/:id/track-and-email', requireAuth, async (req, res) => {
  const id = parseInt(req.params.id);
  const { TrackId, challanHtml } = req.body;
  const user = req.session.user?.loginId || 'admin';
  try {
    // 1. Update TrackId
    await query(
      `UPDATE [Issue] SET [TrackId]=@tid,[ModifyBy]=@user,[ModifyDate]=GETDATE() WHERE [IssueId]=@id`,
      { tid: TrackId || null, user, id });

    // 2. Fetch issue header + courier tracking link + deliver mode (needed for challan)
    const issR = await query(`
      SELECT iss.[IssueId], iss.[CourierName], iss.[IssueDate], iss.[DistCode],
             iss.[DeliverMode], c.[CourierLink]
      FROM   [Issue] iss
      LEFT JOIN [Courier] c ON iss.[CourierId] = c.[CourierId]
      WHERE iss.[IssueId] = @id`, { id });
    const iss = issR.recordset[0];
    if (!iss) return res.status(404).json({ error: 'Issue not found' });

    // 3. Fetch dealer info via DistCode
    const dealerR = await query(`
      SELECT dm.[DealerCompanyName], dm.[ContactPersonName],
             dm.[Addr1], dm.[Addr2], dm.[Addr3], dm.[City], dm.[Pin], dm.[Email]
      FROM   [DealerMaster] dm
      WHERE  dm.[DistCode] = @dc`, { dc: iss.DistCode });
    const dealer = dealerR.recordset[0] || {};

    // 4. Fetch issue items (SrlNo via ROW_NUMBER)
    const itemsR = await query(`
      SELECT ROW_NUMBER() OVER(ORDER BY ii.[ItemId]) AS SrlNo,
             i.[ItemName]   AS ProductDescription,
             ii.[IssueQty]  AS Pcs
      FROM   [IssueItem] ii
      JOIN   [Item] i ON ii.[ItemId] = i.[itemid]
      WHERE  ii.[IssueId] = @id AND ii.[Status] = 'Y'`, { id });
    const items = itemsR.recordset;
    const totalPcs = items.reduce((s, r) => s + (Number(r.Pcs) || 0), 0);

    // 5. Format datetimes  (DD-MM-YYYY HH:MM:SS)
    const fmtDT = (d) => {
      if (!d) return '';
      const dt = new Date(d);
      const p = n => String(n).padStart(2, '0');
      return `${p(dt.getDate())}-${p(dt.getMonth() + 1)}-${dt.getFullYear()} ${p(dt.getHours())}:${p(dt.getMinutes())}:${p(dt.getSeconds())}`;
    };
    const currentDT = fmtDT(new Date());
    const issueDT = fmtDT(iss.IssueDate);

    // 6. Build items table rows
    const itemRows = items.map(r => `
      <tr>
        <td style="padding:4px 8px;border:1px solid #ccc;text-align:center">${r.SrlNo}.</td>
        <td style="padding:4px 8px;border:1px solid #ccc">${r.ProductDescription}</td>
        <td style="padding:4px 8px;border:1px solid #ccc;text-align:center">${r.Pcs}</td>
      </tr>`).join('');
    const addrParts = [dealer.Addr1, dealer.Addr2, dealer.Addr3].filter(Boolean);

    // 7. Build HTML body
    const htmlBody = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"></head>
<body style="font-family:Arial,sans-serif;font-size:13px;color:#000;line-height:1.7">
  <p>Dear sir,</p>
  <p>Following are the list of Items Sending.</p>

  <table border="1" cellpadding="5" cellspacing="0" style="border-collapse:collapse;font-size:12px;min-width:320px">
    <thead>
      <tr style="background:#f0f0f0;font-weight:bold">
        <th style="padding:5px 10px;border:1px solid #ccc">SrlNo</th>
        <th style="padding:5px 10px;border:1px solid #ccc">Product Description</th>
        <th style="padding:5px 10px;border:1px solid #ccc">Pcs</th>
      </tr>
    </thead>
    <tbody>
      ${itemRows}
      <tr style="font-weight:bold">
        <td style="padding:4px 8px;border:1px solid #ccc"></td>
        <td style="padding:4px 8px;border:1px solid #ccc">Total</td>
        <td style="padding:4px 8px;border:1px solid #ccc;text-align:center">${totalPcs}</td>
      </tr>
    </tbody>
  </table>

  <br>
  <p style="margin:2px 0"><strong>Courier Name :</strong> ${iss.CourierName || ''}</p>
  <p style="margin:2px 0"><strong>Track ID :</strong> ${TrackId || ''}</p>
  ${iss.CourierLink ? `<p style="margin:2px 0"><strong>Courier Tracking Link :</strong> <a href="${iss.CourierLink}" style="color:#1a56db">${iss.CourierLink}</a></p>` : ''}
  <p style="margin:2px 0"><strong>Date :</strong> ${currentDT}</p>
  <p style="margin:2px 0"><strong>Items Issue Date :</strong> ${issueDT}</p>

  <br>
  <p style="margin:2px 0">To,</p>
  <p style="margin:2px 0"><strong>${dealer.DealerCompanyName || ''}</strong></p>
  <p style="margin:2px 0">${dealer.ContactPersonName || ''}</p>
  ${addrParts.map(a => `<p style="margin:2px 0">${a}</p>`).join('')}
  ${dealer.City || dealer.Pin ? `<p style="margin:2px 0">${[dealer.City, dealer.Pin].filter(Boolean).join(' - ')}</p>` : ''}

  <br>
  <p style="margin:2px 0">From,</p>
  <p style="margin:2px 0"><strong>H.K. Jewels Pvt. Ltd.</strong></p>
  <p style="margin:2px 0">1701-A,The Capital Building,&apos;B&apos; Wing, 17th Floor,</p>
  <p style="margin:2px 0">Bandra - Kurla Complex, Bandra (East)</p>
  <p style="margin:2px 0">Mumbai 400051</p>

  <br>
  <p>Please find attached Challan Copy.</p>
  <p>Note: *** This is an automated email alert to help you keep track of your product transactions. Hence, please do not reply to this email.</p>
  <p>Regards,<br><strong>Team Kisna</strong></p>
</body></html>`;

    // 8. Generate challan PDF and send email
    let pdfAttachment = null;
    try {
      let pdfBuf;
      if (challanHtml) {
        // Use the edited HTML the user saw in the preview
        const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'], headless: true });
        try {
          const pg = await browser.newPage();
          // Wrap captured challan snippet in a full A4 print document
          const fullHtml = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
            @page { size:A4; margin:10mm 12mm 8mm 12mm; }
            *{box-sizing:border-box} html,body{height:100%;margin:0;font-family:Arial,sans-serif;font-size:11px;color:#000}
            table{border-collapse:collapse} [contenteditable]{outline:none!important;box-shadow:none!important}
            .chl-outer-table{height:100%;min-height:240mm;width:100%;border:2px solid #333;border-collapse:collapse}
            .chl-blank-row td{height:100%}
          </style></head><body>${challanHtml}</body></html>`;
          await pg.setContent(fullHtml, { waitUntil: 'networkidle0' });
          pdfBuf = await pg.pdf({ format: 'A4', printBackground: true });
        } finally { await browser.close(); }
      } else {
        pdfBuf = await _generateChallanPdf(id, iss.DeliverMode, iss.DistCode, TrackId, iss.CourierLink);
      }
      pdfAttachment = { filename: `Delivery_Challan_Issue_${id}.pdf`, content: pdfBuf, contentType: 'application/pdf' };
    } catch (pdfErr) {
      console.error('Challan PDF generation failed (email will still send):', pdfErr.message);
    }

    const toEmail = 'dataanalysis5@kisna.com';
    await mailer.sendMail({
      from: '"KISNA Inventory" <dataanalysis5@kisna.com>',
      to: toEmail,
      subject: 'Delivery Details for your Goods',
      html: htmlBody,
      ...(pdfAttachment ? { attachments: [pdfAttachment] } : {})
    });

    res.json({ success: true });
  } catch (e) {
    console.error('track-and-email error:', e);
    res.status(500).json({ error: e.message });
  }
});

// DELETE â€“ reverse stock and delete
app.delete('/api/issues/:id', requireAuth, async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    const oldItems = await query(
      `SELECT [ItemId],[IssueQty] FROM [IssueItem] WHERE [IssueId]=@id AND [Status]='Y'`, { id });
    for (const old of (oldItems.recordset || [])) {
      await query('UPDATE [Item] SET [Stock]=ISNULL([Stock],0)+@qty WHERE [Itemid]=@itmid',
        { qty: old.IssueQty || 0, itmid: old.ItemId });
    }
    await query(`DELETE FROM [IssueItem] WHERE [IssueId]=@id`, { id });
    await query(`DELETE FROM [Issue]     WHERE [IssueId]=@id`, { id });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});



// =================== ISSUE RETURN ===================

// GET all returns (with division derived via IssueReturnItem â†’ Item â†’ Division)
app.get('/api/issue-returns', requireAuth, async (req, res) => {
  try {
    const { divisionId } = req.query;
    let q = `
      SELECT DISTINCT ir.[ReturnId], ir.[ReturnMode], ir.[PersonName],
             ir.[CourierName], ir.[ReturnDate], ir.[ReturnDocNo],
             ir.[Status], ir.[AddedBy], ir.[AddedDate]
      FROM [IssueReturn] ir
      INNER JOIN [IssueReturnItem] iri ON ir.[ReturnId] = iri.[ReturnId]
      INNER JOIN [Item] i ON iri.[ItemId] = i.[Itemid]
      WHERE ir.[Status]='Y'`;
    const params = {};
    if (divisionId) { q += ' AND i.[DivisionID]=@did'; params.did = parseInt(divisionId); }
    q += ' ORDER BY ir.[ReturnDate] DESC';
    const r = await query(q, params);
    res.json(r.recordset);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET items for one return
app.get('/api/issue-returns/:id/items', requireAuth, async (req, res) => {
  try {
    const r = await query(`
      SELECT iri.[IssueReturnItemId], iri.[ReturnId], iri.[ItemId],
             iri.[ReturnQty], iri.[ItemFlag], iri.[Reason], iri.[Remark], iri.[Status],
             i.[ItemName]
      FROM [IssueReturnItem] iri
      LEFT JOIN [Item] i ON iri.[ItemId] = i.[Itemid]
      WHERE iri.[ReturnId]=@id AND iri.[Status]='Y'`,
      { id: parseInt(req.params.id) });
    res.json(r.recordset);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST create new Issue Return
app.post('/api/issue-returns', requireAuth, async (req, res) => {
  const { ReturnMode, PersonName, CourierName, ReturnDate, ReturnDocNo, items } = req.body;
  const user = req.session.user?.loginId || 'admin';
  try {
    const r = await query(
      `INSERT INTO [IssueReturn]([ReturnMode],[PersonName],[CourierName],[ReturnDate],[ReturnDocNo],[Status],[AddedBy],[AddedDate])
       OUTPUT INSERTED.[ReturnId]
       VALUES(@rmode,@pname,@cname,CAST(@rdate AS DATETIME)+CAST(CAST(GETDATE() AS TIME) AS DATETIME),@rdoc,'Y',@user,GETDATE())`,
      {
        rmode: ReturnMode || null, pname: PersonName || null, cname: CourierName || null,
        rdate: ReturnDate || null,
        rdoc: ReturnDocNo || null, user
      });
    const returnId = r.recordset[0].ReturnId;

    for (const it of (items || [])) {
      try {
        await query(
          `INSERT INTO [IssueReturnItem]([ReturnId],[ItemId],[ReturnQty],[ItemFlag],[Reason],[Remark],[Status],[AddedBy],[AddedDate])
           VALUES(@rid,@itmid,@qty,@flag,@reason,@remark,'Y',@user,GETDATE())`,
          {
            rid: returnId, itmid: it.ItemId || null, qty: parseInt(it.ReturnQty) || 0,
            flag: it.ItemFlag || 'C', reason: it.Reason || null,
            remark: it.Remark || null, user
          });
      } catch (_) { }
      // Restore stock
      if (it.ItemId && parseInt(it.ReturnQty) > 0) {
        await query(
          'UPDATE [Item] SET [Stock]=ISNULL([Stock],0)+@qty WHERE [Itemid]=@itmid',
          { qty: parseInt(it.ReturnQty), itmid: it.ItemId });
      }
    }
    res.json({ success: true, ReturnId: returnId });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// â”€â”€ Dead Stock Identifier â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// GET /api/dead-stock?days=90
// Returns items with Stock > 0 but zero issues in the last N days (default 90).
// "Never issued" items (NULL LastIssueDate) are also included.
app.get('/api/dead-stock', requireAuth, async (req, res) => {
  try {
    const days = Math.max(1, parseInt(req.query.days) || 90);
    const r = await query(`
      WITH LastIssue AS (
        SELECT ii.[ItemId], MAX(i.[IssueDate]) AS LastIssueDate
        FROM   [IssueItem] ii
        JOIN   [Issue]     i  ON ii.[IssueId]  = i.[IssueId]
        WHERE  i.[status] = 'Y'
        GROUP BY ii.[ItemId]
      )
      SELECT
        it.[itemid]         AS ItemId,
        it.[ItemName],
        it.[Stock],
        ISNULL(it.[SellPrice], 0)                            AS SellPrice,
        it.[Stock] * ISNULL(it.[SellPrice], 0)               AS LockedValue,
        it.[UOM],
        it.[ReorderLevel],
        c.[CategoryName],
        d.[DivisionName],
        li.[LastIssueDate],
        CASE
          WHEN li.[LastIssueDate] IS NULL THEN NULL
          ELSE DATEDIFF(day, li.[LastIssueDate], GETDATE())
        END AS DaysSinceLastIssue
      FROM  [Item]     it
      LEFT JOIN  LastIssue li ON it.[itemid]     = li.[ItemId]
      LEFT JOIN  [Category] c ON it.[CategoryId] = c.[CategoryId]
      LEFT JOIN  [Division] d ON it.[DivisionId] = d.[DivisionId]
      WHERE it.[Stock] > 0
        AND (it.[Status] IS NULL OR it.[Status] = 'Y')
        AND (
          li.[LastIssueDate] IS NULL
          OR DATEDIFF(day, li.[LastIssueDate], GETDATE()) >= @days
        )
      ORDER BY (it.[Stock] * ISNULL(it.[SellPrice], 0)) DESC
    `, { days });
    res.json(r.recordset || []);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// â”€â”€ Smart Order Suggestions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// GET /api/orders/suggestions
// Analyses past order history to find items due for reorder based on:
//   â€¢ Average quantity ordered  â€¢ Average gap between orders (days)
//   â€¢ Most-frequently-used vendor   â€¢ Days since last order
app.get('/api/orders/suggestions', requireAuth, async (req, res) => {
  try {
    const r = await query(`
      WITH OrderGaps AS (
        SELECT
          oi.[ItemId],
          i.[ItemName],
          o.[OrderDate],
          o.[Vendorid]              AS VendorId,
          v.[Name]                  AS VendorName,
          oi.[TotalQty],
          LAG(o.[OrderDate]) OVER (
            PARTITION BY oi.[ItemId] ORDER BY o.[OrderDate]
          )                         AS PrevOrderDate
        FROM [OrderItem] oi
        JOIN  [Order]  o ON oi.[OrderID] = o.[OrderID]
        JOIN  [Item]   i ON oi.[ItemId]  = i.[itemid]
        LEFT JOIN [Vendor] v ON o.[Vendorid] = v.[vendorid]
        WHERE o.[Status] = 'Y' AND oi.[Status] = 'Y'
      ),
      ItemStats AS (
        SELECT
          ItemId, ItemName,
          AVG(CAST(TotalQty    AS FLOAT)) AS AvgQty,
          AVG(CAST(DATEDIFF(day, PrevOrderDate, OrderDate) AS FLOAT)) AS AvgGapDays,
          MAX(OrderDate)       AS LastOrderDate,
          COUNT(*)             AS GapCount
        FROM OrderGaps
        WHERE PrevOrderDate IS NOT NULL
        GROUP BY ItemId, ItemName
        HAVING COUNT(*) >= 1
      ),
      VendorMode AS (
        SELECT
          oi.[ItemId],
          o.[Vendorid]  AS VendorId,
          v.[Name]      AS VendorName,
          COUNT(*)      AS UseCount,
          ROW_NUMBER() OVER (
            PARTITION BY oi.[ItemId] ORDER BY COUNT(*) DESC
          ) AS rn
        FROM [OrderItem] oi
        JOIN  [Order]  o ON oi.[OrderID] = o.[OrderID]
        LEFT JOIN [Vendor] v ON o.[Vendorid] = v.[vendorid]
        WHERE o.[Status] = 'Y' AND oi.[Status] = 'Y'
        GROUP BY oi.[ItemId], o.[Vendorid], v.[Name]
      )
      SELECT TOP 20
        s.ItemId,
        s.ItemName,
        ROUND(s.AvgQty,     0) AS SuggestedQty,
        ROUND(s.AvgGapDays, 0) AS AvgGapDays,
        s.LastOrderDate,
        s.GapCount + 1         AS TotalOrders,
        DATEDIFF(day, s.LastOrderDate, GETDATE()) AS DaysSinceLast,
        DATEDIFF(day, s.LastOrderDate, GETDATE()) - ROUND(s.AvgGapDays, 0) AS DaysOverdue,
        vm.VendorId,
        vm.VendorName
      FROM ItemStats s
      LEFT JOIN VendorMode vm ON s.ItemId = vm.ItemId AND vm.rn = 1
      WHERE DATEDIFF(day, s.LastOrderDate, GETDATE()) >= s.AvgGapDays * 0.8
      ORDER BY (DATEDIFF(day, s.LastOrderDate, GETDATE()) - ROUND(s.AvgGapDays, 0)) DESC
    `);
    res.json(r.recordset || []);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Order Items â€” full grouped CRUD + bulk ops
app.get('/api/orders', requireAuth, async (req, res) => {
  try {
    // Fetch all orders
    const orders = await query(`
      SELECT o.[OrderID], o.[OrderNumber], o.[OrderDate], o.[DivisionId], o.[Status],
             v.[Name] AS VendorName, v.[vendorid] AS VendorId,
             d.[DivisionName]
      FROM [Order] o
      LEFT JOIN [Vendor]   v ON o.[Vendorid]   = v.[vendorid]
      LEFT JOIN [Division] d ON o.[DivisionId] = d.[DivisionId]
      ORDER BY o.[OrderID] DESC`);

    // Fetch all order items
    const items = await query(`
      SELECT oi.[OrderItemId], oi.[OrderID], oi.[CategoryId], oi.[ItemId],
             oi.[TotalQty], oi.[Rate], oi.[TotalAmt],
             i.[ItemName],
             c.[CategoryName]
      FROM [OrderItem] oi
      LEFT JOIN [Item]     i ON oi.[ItemId]     = i.[itemid]
      LEFT JOIN [Category] c ON oi.[CategoryId] = c.[CategoryId]`);

    // Group items under each order
    const itemMap = {};
    (items.recordset || []).forEach(it => {
      if (!itemMap[it.OrderID]) itemMap[it.OrderID] = [];
      itemMap[it.OrderID].push(it);
    });

    const result = (orders.recordset || []).map(o => ({
      ...o,
      Items: itemMap[o.OrderID] || []
    }));
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});


async function _sendOrderEmail(orderId, isUpdate = false) {
  try {
    const metaRes = await query(
      `SELECT o.[OrderNumber], o.[OrderDate], v.[Name] AS VendorName, v.[VendorEmail], v.[CompanyName], d.[DivisionName]
       FROM [Order] o
       LEFT JOIN [Vendor] v ON o.[Vendorid] = v.[vendorid]
       LEFT JOIN [Division] d ON o.[DivisionId] = d.[DivisionId]
       WHERE o.[OrderID] = @oid`,
      { oid: orderId }
    );
    const meta = metaRes.recordset[0] || {};
    const vendorName = meta.VendorName || 'N/A';
    const divName = meta.DivisionName || 'N/A';
    const OrderNumber = meta.OrderNumber || '';
    const OrderDate = meta.OrderDate;

    const itemsRes = await query(
      `SELECT c.[CategoryName], i.[ItemName], oi.[TotalQty]
       FROM [OrderItem] oi
       LEFT JOIN [Item] i ON oi.[ItemId] = i.[itemid]
       LEFT JOIN [Category] c ON oi.[CategoryId] = c.[CategoryId]
       WHERE oi.[OrderID] = @oid
       ORDER BY oi.[OrderItemId]`,
      { oid: orderId }
    );
    const emailItems = itemsRes.recordset || [];

    const orderDateFmt = OrderDate
      ? new Date(OrderDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })
      : new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });

    const itemRows = emailItems.map((it, idx) => `
      <tr style="background:${idx % 2 === 0 ? '#ffffff' : '#f8f9ff'}">
        <td style="padding:11px 16px;border-bottom:1px solid #e8eaf0;color:#444;font-size:13px">${it.CategoryName || '—'}</td>
        <td style="padding:11px 16px;border-bottom:1px solid #e8eaf0;font-weight:600;color:#1a1a2e;font-size:13px">${it.ItemName || '—'}</td>
        <td style="padding:11px 16px;border-bottom:1px solid #e8eaf0;text-align:center;font-weight:700;color:#b8860b;font-size:14px">${it.TotalQty}</td>
      </tr>`).join('');

    const htmlBody = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#f0f2f5;font-family:Arial,Helvetica,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f2f5;padding:32px 0">
    <tr><td align="center">
      <table width="620" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.10)">
        <tr>
          <td style="background:linear-gradient(135deg,#1a1a2e 0%,#16213e 60%,#0f3460 100%);padding:32px 36px;text-align:center">
            <div style="font-size:11px;letter-spacing:3px;color:#c9a227;text-transform:uppercase;margin-bottom:8px">KISNA Diamond Jewellery</div>
            <div style="font-size:26px;font-weight:800;color:#ffffff;letter-spacing:1px">✦ ${isUpdate ? 'Updated ' : ''}Purchase Order</div>
            ${isUpdate ? '<div style="margin-top:6px;font-size:13px;color:#f87171;font-weight:600">This order has been modified</div>' : ''}
            <div style="margin-top:10px;display:inline-block;background:rgba(201,162,39,0.18);border:1px solid #c9a227;border-radius:20px;padding:5px 20px;color:#c9a227;font-size:13px;font-weight:600;letter-spacing:1px">
              Order ID&nbsp;&nbsp;#${orderId}${OrderNumber ? '&nbsp;&nbsp;|&nbsp;&nbsp;' + OrderNumber : ''}
            </div>
          </td>
        </tr>
        <tr>
          <td style="padding:28px 36px 8px">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td width="50%" style="padding-bottom:18px;vertical-align:top">
                  <div style="font-size:10px;letter-spacing:2px;color:#999;text-transform:uppercase;margin-bottom:5px">Order Date</div>
                  <div style="font-size:15px;font-weight:700;color:#1a1a2e">${orderDateFmt}</div>
                </td>
                <td width="50%" style="padding-bottom:18px;vertical-align:top">
                  <div style="font-size:10px;letter-spacing:2px;color:#999;text-transform:uppercase;margin-bottom:5px">Division</div>
                  <div style="font-size:15px;font-weight:700;color:#1a1a2e">${divName}</div>
                </td>
              </tr>
              <tr>
                <td width="50%" style="padding-bottom:18px;vertical-align:top">
                  <div style="font-size:10px;letter-spacing:2px;color:#999;text-transform:uppercase;margin-bottom:5px">Vendor</div>
                  <div style="font-size:15px;font-weight:700;color:#1a1a2e">${vendorName}</div>
                  ${meta.CompanyName ? `<div style="font-size:12px;color:#777;margin-top:3px">${meta.CompanyName}</div>` : ''}
                </td>
                <td width="50%" style="padding-bottom:18px;vertical-align:top">
                  <div style="font-size:10px;letter-spacing:2px;color:#999;text-transform:uppercase;margin-bottom:5px">Order Number</div>
                  <div style="font-size:15px;font-weight:700;color:#1a1a2e">${OrderNumber || '<span style="color:#bbb;font-weight:400;font-style:italic">—</span>'}</div>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr><td style="padding:0 36px"><div style="height:2px;background:linear-gradient(90deg,#c9a227,#f5e6a3,#c9a227);border-radius:2px"></div></td></tr>
        <tr>
          <td style="padding:24px 36px 8px">
            <div style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#c9a227;font-weight:700;margin-bottom:14px">■ Items Ordered</div>
            <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border-radius:8px;overflow:hidden;border:1px solid #e8eaf0">
              <thead>
                <tr style="background:#1a1a2e">
                  <th style="padding:12px 16px;text-align:left;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#c9a227;font-weight:700;width:30%">Category</th>
                  <th style="padding:12px 16px;text-align:left;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#c9a227;font-weight:700">Item Name</th>
                  <th style="padding:12px 16px;text-align:center;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#c9a227;font-weight:700;width:80px">Qty</th>
                </tr>
              </thead>
              <tbody>${itemRows || `<tr><td colspan="3" style="padding:16px;text-align:center;color:#aaa;font-style:italic">No items</td></tr>`}</tbody>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:12px 36px 28px">
            <div style="background:#f8f9ff;border-radius:8px;padding:14px 18px;display:flex;align-items:center;border-left:4px solid #c9a227">
              <span style="font-size:13px;color:#555"><strong style="color:#1a1a2e">${emailItems.length}</strong> item type${emailItems.length !== 1 ? 's' : ''} &nbsp;|&nbsp; <strong style="color:#1a1a2e">${emailItems.reduce((s, i) => s + (i.TotalQty || 0), 0)}</strong> total units ordered</span>
            </div>
          </td>
        </tr>
        <tr><td style="padding:0 36px"><div style="height:1px;background:#e8eaf0"></div></td></tr>
        <tr>
          <td style="padding:22px 36px;background:#fafafa;border-radius:0 0 12px 12px">
            <div style="font-size:11px;color:#999;text-align:center;line-height:1.7">
              This is an automated notification from <strong style="color:#1a1a2e">KISNA Inventory Management System</strong>.<br/>
              Please do not reply directly to this email.<br/>
              <span style="font-size:10px;color:#bbb;margin-top:6px;display:block">© ${new Date().getFullYear()} KISNA Diamond Jewellery — All rights reserved.</span>
            </div>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

    const vendorEmail = (meta.VendorEmail || '').trim();
    if (!vendorEmail) {
      console.warn(`[Order Mail] No VendorEmail set for vendor "${vendorName}" — email skipped for Order #${orderId}`);
    } else {
      await mailer.sendMail({
        from: '"KISNA Inventory" <dataanalysis5@kisna.com>',
        to: vendorEmail,
        cc: 'dataanalysis5@kisna.com',
        subject: `${isUpdate ? 'Updated ' : 'New '}Purchase Order #${orderId}${OrderNumber ? ' — ' + OrderNumber : ''} | ${divName} — ${vendorName}`,
        html: htmlBody
      });
      console.log(`[Order Mail] Sent for Order #${orderId} to vendor: ${vendorEmail} (CC: dataanalysis5@kisna.com)`);
    }
  } catch (mailErr) {
    console.error(`[Order Mail] Failed for Order #${orderId}:`, mailErr.message);
  }
}

app.post('/api/orders', requireAuth, async (req, res) => {
  const { OrderNumber, OrderDate, Vendorid, DivisionId, items } = req.body;
  const user = req.session.user?.loginId || 'admin';
  try {
    const r = await query(
      `INSERT INTO [Order]([OrderNumber],[OrderDate],[Vendorid],[DivisionId],[Status],[AddedBy],[AddedDate])
       OUTPUT INSERTED.[OrderID]
       VALUES(@num,CAST(@date AS DATETIME)+CAST(CAST(GETDATE() AS TIME) AS DATETIME),@vid,@did,'Y',@user,GETDATE())`,
      {
        num: OrderNumber || '', date: OrderDate,
        vid: Vendorid || null, did: DivisionId || null, user
      });
    const orderId = r.recordset[0].OrderID;
    for (const it of (items || [])) {
      const qty = parseInt(it.TotalQty) || 0;
      const rate = parseFloat(it.Rate) || 0;
      await query(
        `INSERT INTO [OrderItem]([OrderID],[CategoryId],[ItemId],[TotalQty],[Rate],[TotalAmt],[Status],[AddedBy],[AddedDate])
         VALUES(@oid,@cat,@iid,@qty,@rate,@amt,'Y',@user,GETDATE())`,
        {
          oid: orderId, cat: it.CategoryId || null, iid: it.ItemId || null,
          qty, rate, amt: qty * rate, user
        });
    }
    res.json({ success: true, OrderID: orderId });

    // ── Fire-and-forget order email ────────────────────────────────
    _sendOrderEmail(orderId, false);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/orders/:orderId', requireAuth, async (req, res) => {
  const { OrderDate, Vendorid, DivisionId, items } = req.body;
  const user = req.session.user?.loginId || 'admin';
  const orderId = parseInt(req.params.orderId);
  try {
    await query(
      `UPDATE [Order] SET [OrderDate]=CAST(@date AS DATETIME)+CAST(CAST(GETDATE() AS TIME) AS DATETIME),[Vendorid]=@vid,[DivisionId]=@did,
       [ModifyBy]=@user,[ModifyDate]=GETDATE() WHERE [OrderID]=@oid`,
      { date: OrderDate || null, vid: Vendorid || null, did: DivisionId || null, user, oid: orderId });
    // Replace all items
    await query(`DELETE FROM [OrderItem] WHERE [OrderID]=@oid`, { oid: orderId });
    for (const it of (items || [])) {
      const qty = parseInt(it.TotalQty) || 0;
      const rate = parseFloat(it.Rate) || 0;
      await query(
        `INSERT INTO [OrderItem]([OrderID],[CategoryId],[ItemId],[TotalQty],[Rate],[TotalAmt],[Status],[AddedBy],[AddedDate],[ModifyBy],[ModifyDate])
         VALUES(@oid,@cat,@iid,@qty,@rate,@amt,'Y',@user,GETDATE(),@user,GETDATE())`,
        {
          oid: orderId, cat: it.CategoryId || null, iid: it.ItemId || null,
          qty, rate, amt: qty * rate, user
        });
    }
    // ── Fire-and-forget order email for update ─────────────────────
    _sendOrderEmail(orderId, true);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/orders/:orderId', requireAuth, async (req, res) => {
  const oid = parseInt(req.params.orderId);
  try {
    await query(`DELETE FROM [OrderItem] WHERE [OrderID]=@oid`, { oid });
    await query(`DELETE FROM [Order] WHERE [OrderID]=@oid`, { oid });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/orders/bulk-delete', requireAuth, async (req, res) => {
  const { ids } = req.body;
  if (!ids || !ids.length) return res.status(400).json({ error: 'No IDs provided' });
  try {
    const ph = ids.map((_, i) => `@id${i}`).join(',');
    const params = {}; ids.forEach((id, i) => { params[`id${i}`] = parseInt(id); });
    await query(`DELETE FROM [OrderItem] WHERE [OrderID] IN (${ph})`, params);
    await query(`DELETE FROM [Order]     WHERE [OrderID] IN (${ph})`, params);
    res.json({ success: true, deleted: ids.length });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/orders/export-xlsx', requireAuth, async (req, res) => {
  const { ids } = req.body;
  try {
    const base = `
      SELECT o.[OrderID], o.[OrderNumber], CONVERT(varchar,o.[OrderDate],23) AS OrderDate,
             v.[Name] AS VendorName, d.[DivisionName],
             c.[CategoryName], i.[ItemName],
             oi.[TotalQty], oi.[Rate], oi.[TotalAmt]
      FROM [Order] o
      LEFT JOIN [Vendor]    v  ON o.[Vendorid]   = v.[vendorid]
      LEFT JOIN [Division]  d  ON o.[DivisionId] = d.[DivisionId]
      LEFT JOIN [OrderItem] oi ON o.[OrderID]    = oi.[OrderID]
      LEFT JOIN [Item]      i  ON oi.[ItemId]    = i.[itemid]
      LEFT JOIN [Category]  c  ON oi.[CategoryId]= c.[CategoryId]`;
    let r;
    if (ids && ids.length) {
      const ph = ids.map((_, i) => `@id${i}`).join(',');
      const params = {}; ids.forEach((id, i) => { params[`id${i}`] = parseInt(id); });
      r = await query(`${base} WHERE o.[OrderID] IN (${ph}) ORDER BY o.[OrderID]`, params);
    } else { r = await query(`${base} ORDER BY o.[OrderID]`); }
    const ws = XLSX.utils.json_to_sheet(r.recordset);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Orders');
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Disposition', 'attachment; filename="order_items.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buf);
  } catch (e) { res.status(500).json({ error: e.message }); }
});


// =================== REPORTS ===================

// Item Stock Report
app.get('/api/reports/item-stock', requireAuth, async (req, res) => {
  try {
    const { divisionId } = req.query;
    let q = `SELECT i.*, c.CategoryName, d.DivisionName FROM Item i 
      LEFT JOIN Category c ON i.CategoryId = c.CategoryId 
      LEFT JOIN Division d ON i.DivisionID = d.DivisionID`;
    const params = {};
    if (divisionId) { q += ' WHERE i.DivisionID = @divId'; params.divId = divisionId; }
    q += ' ORDER BY i.ItemName';
    const r = await query(q, params);
    res.json(r.recordset);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// View Items Stock â€” calls sp_ViewItemsStock then optionally filters by DivisionId
app.get('/api/reports/sp-view-items-stock', requireAuth, async (req, res) => {
  try {
    const { divisionId } = req.query;
    const r = await query('EXEC [dbo].[sp_ViewItemsStock]');
    let rows = r.recordset;
    if (divisionId) {
      // Filter by joining against Item's DivisionID (SP doesn't expose it, so re-query with division)
      const divRows = await query(
        `SELECT i.[Itemid] FROM [Item] i WHERE i.[DivisionID]=@did AND i.[status]='Y'`,
        { did: parseInt(divisionId) });
      const divItemIds = new Set(divRows.recordset.map(x => x.Itemid));
      rows = rows.filter(row => divItemIds.has(row.itemid));
    }
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/reports/email-stock-report
// Sends an HTML summary + CSV attachment to dataanalysis5@kisna.com
app.post('/api/reports/email-stock-report', requireAuth, async (req, res) => {
  try {
    const { divisionId, divisionName } = req.body;

    // 1. Fetch stock data (same logic as GET)
    const r = await query('EXEC [dbo].[sp_ViewItemsStock]');
    let rows = r.recordset;
    if (divisionId) {
      const divRows = await query(
        `SELECT i.[Itemid] FROM [Item] i WHERE i.[DivisionID]=@did AND i.[status]='Y'`,
        { did: parseInt(divisionId) });
      const ids = new Set(divRows.recordset.map(x => x.Itemid));
      rows = rows.filter(row => ids.has(row.itemid));
    }

    const totalItems = rows.length;
    const totalStock = rows.reduce((s, r) => s + (Number(r.Stock) || 0), 0);
    const lowStockCount = rows.filter(r => (Number(r.Stock) || 0) <= (Number(r.ReorderLevel) || 0)).length;
    const now = new Date();
    const pad = n => String(n).padStart(2, '0');
    const dateStr = `${pad(now.getDate())}-${pad(now.getMonth() + 1)}-${now.getFullYear()}`;
    const timeStr = `${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
    const divLabel = divisionName || 'All Divisions';

    // 2. Build CSV content
    const csvHeader = 'Sr No,Item Name,Category Name,Reorder Level,Stock,UOM,Sell Price\n';
    const csvRows = rows.map((r, i) =>
      `${i + 1},"${(r.ItemName || '').replace(/"/g, '""')}","${(r.categoryname || r.CategoryName || '').replace(/"/g, '""')}",${r.ReorderLevel || 0},${r.Stock || 0},"${r.uom || r.UOM || ''}",${Number(r.SellPrice || 0).toFixed(2)}`
    ).join('\n');
    const csvContent = csvHeader + csvRows;
    const csvFilename = `View_Items_Stock_${dateStr}_${timeStr}.csv`;

    // 3. Build HTML email body
    const rowsHtml = rows.slice(0, 20).map((r, i) => {
      const low = (Number(r.Stock) || 0) <= (Number(r.ReorderLevel) || 0);
      return `<tr style="background:${i % 2 === 0 ? '#f9f9f9' : '#fff'};${low ? 'color:#c0392b;font-weight:600;' : ''}">
        <td style="padding:5px 10px;border:1px solid #ddd;text-align:center">${i + 1}</td>
        <td style="padding:5px 10px;border:1px solid #ddd">${r.ItemName || '-'}</td>
        <td style="padding:5px 10px;border:1px solid #ddd">${r.categoryname || r.CategoryName || '-'}</td>
        <td style="padding:5px 10px;border:1px solid #ddd;text-align:center">${r.ReorderLevel || 0}</td>
        <td style="padding:5px 10px;border:1px solid #ddd;text-align:center">${r.Stock || 0}</td>
        <td style="padding:5px 10px;border:1px solid #ddd;text-align:center">${r.uom || r.UOM || '-'}</td>
        <td style="padding:5px 10px;border:1px solid #ddd;text-align:right">${Number(r.SellPrice || 0).toFixed(2)}</td>
      </tr>`;
    }).join('');

    const htmlBody = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"/></head>
<body style="font-family:Arial,sans-serif;font-size:13px;color:#333;margin:0;padding:0">
  <div style="max-width:700px;margin:0 auto;border:1px solid #ddd;border-radius:8px;overflow:hidden">
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#c9a227,#e6c048);padding:20px 28px">
      <h2 style="margin:0;color:#1a1a1a;font-size:20px;letter-spacing:1px">KISNA Inventory</h2>
      <p style="margin:4px 0 0;color:#4a3800;font-size:13px">Items Stock Report</p>
    </div>
    <!-- Summary cards -->
    <div style="display:flex;gap:0;border-bottom:1px solid #eee">
      <div style="flex:1;padding:18px 22px;border-right:1px solid #eee;text-align:center">
        <div style="font-size:28px;font-weight:700;color:#2a5aba">${totalItems}</div>
        <div style="font-size:11px;color:#888;margin-top:3px">TOTAL ITEMS</div>
      </div>
      <div style="flex:1;padding:18px 22px;border-right:1px solid #eee;text-align:center">
        <div style="font-size:28px;font-weight:700;color:#2ea043">${totalStock.toLocaleString('en-IN')}</div>
        <div style="font-size:11px;color:#888;margin-top:3px">TOTAL STOCK QTY</div>
      </div>
      <div style="flex:1;padding:18px 22px;text-align:center">
        <div style="font-size:28px;font-weight:700;color:${lowStockCount > 0 ? '#c0392b' : '#2ea043'}">${lowStockCount}</div>
        <div style="font-size:11px;color:#888;margin-top:3px">LOW STOCK ITEMS</div>
      </div>
    </div>
    <!-- Meta -->
    <div style="padding:14px 22px;background:#fafafa;border-bottom:1px solid #eee;font-size:12px;color:#555">
      <strong>Division:</strong> ${divLabel} &nbsp;&nbsp;|
      <strong> Generated:</strong> ${now.toLocaleDateString('en-IN')} ${now.toLocaleTimeString('en-IN')}
    </div>
    <!-- Preview table (first 20 rows) -->
    <div style="padding:20px 22px">
      <p style="margin:0 0 10px;font-size:12px;color:#666">Showing first 20 items below. Full report is attached as CSV.</p>
      <table style="width:100%;border-collapse:collapse;font-size:12px">
        <thead>
          <tr style="background:#1a3e8e;color:#fff">
            <th style="padding:7px 10px;border:1px solid #2a5aba;text-align:center">Sr No</th>
            <th style="padding:7px 10px;border:1px solid #2a5aba;text-align:left">Item Name</th>
            <th style="padding:7px 10px;border:1px solid #2a5aba;text-align:left">Category</th>
            <th style="padding:7px 10px;border:1px solid #2a5aba">Reorder Level</th>
            <th style="padding:7px 10px;border:1px solid #2a5aba">Stock</th>
            <th style="padding:7px 10px;border:1px solid #2a5aba">UOM</th>
            <th style="padding:7px 10px;border:1px solid #2a5aba;text-align:right">Sell Price</th>
          </tr>
        </thead>
        <tbody>${rowsHtml}</tbody>
      </table>
      ${totalItems > 20 ? `<p style="font-size:11px;color:#888;margin:8px 0 0">â€¦ and ${totalItems - 20} more items in the attached CSV file.</p>` : ''}
    </div>
    <!-- Footer -->
    <div style="padding:14px 22px;background:#f5f5f5;border-top:1px solid #eee;font-size:11px;color:#999;text-align:center">
      This is an automated report from KISNA Inventory Management System.
    </div>
  </div>
</body>
</html>`;

    // 4. Send email
    await mailer.sendMail({
      from: '"KISNA Inventory" <dataanalysis5@kisna.com>',
      to: 'dataanalysis5@kisna.com',
      subject: `Items Stock Report â€“ ${divLabel} â€“ ${dateStr}`,
      html: htmlBody,
      attachments: [{
        filename: csvFilename,
        content: Buffer.from(csvContent, 'utf-8'),
        contentType: 'text/csv'
      }]
    });

    res.json({ success: true, totalItems, totalStock, lowStockCount, csvFilename });
  } catch (e) {
    console.error('Email error:', e);
    res.status(500).json({ error: e.message });
  }
});

// â”€â”€ CHALLAN REPORT ROUTES â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// GET /api/challan/issues?divisionId=1
app.get('/api/challan/issues', requireAuth, async (req, res) => {
  try {
    const { divisionId } = req.query;
    if (!divisionId) return res.status(400).json({ error: 'divisionId required' });
    const r = await query(
      `SELECT i.issueid, i.requestid, i.RequestMode,
              D.DealerID AS RequestedBy, D.DealerCompanyName,
              I.DeliverMode, I.IssueDate, I.DistCode
       FROM Issue I
       LEFT JOIN DealerMaster D ON i.requestedfordealerid = D.DealerID
       WHERE i.status = 'Y' AND i.DeliverMode = 'Courier'
         AND (I.DivisionId = @did OR D.DivisionID = @did)
       ORDER BY i.IssueDate DESC`,
      { did: parseInt(divisionId) }
    );
    res.json(r.recordset);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/challan/header?issueId=X&deliverMode=Y&distCode=Z
app.get('/api/challan/header', requireAuth, async (req, res) => {
  try {
    const { issueId, deliverMode, distCode } = req.query;
    const r = await query(
      'EXEC [dbo].[sp_GetHeaderDataChallan] @intIssueID, @strDeliverMode, @strDistCode',
      { intIssueID: parseInt(issueId), strDeliverMode: deliverMode || 'Courier', strDistCode: distCode || '' }
    );
    res.json(r.recordset[0] || null);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/challan/header/save  â€” archives once per IssueId
app.post('/api/challan/header/save', requireAuth, async (req, res) => {
  try {
    const d = req.body;
    const chk = await query('SELECT TOP 1 IssueId FROM tbl_ChallanHeader WHERE IssueId=@id', { id: parseInt(d.IssueId) });
    if (!chk.recordset.length) {
      await query(
        `EXEC [dbo].[sp_SaveChallanHeader]
          @FromCompanyName,@FromAddr1,@FromAddr2,@FromAddr3,@FromState,
          @FromGSTNo,@FromPAN,@ToCompanyName,@ToPersonName,
          @ToAddr1,@ToAddr2,@ToAddr3,@ToContactNo,@ToGSTNo,
          @ChallanNo,@PlaceOfSalesPromotion,@ChallanDate,
          @TransportationBy,@CINNo,@IssueId,@FromContactNo`,
        {
          FromCompanyName: d.FromCompanyName || '', FromAddr1: d.FromAddr1 || '',
          FromAddr2: d.FromAddr2 || '', FromAddr3: d.FromAddr3 || '',
          FromState: d.FromState || '', FromGSTNo: d.FromGSTNo || '',
          FromPAN: d.FromPAN || '', ToCompanyName: d.ToCompanyName || '',
          ToPersonName: d.ToPersonName || '', ToAddr1: d.ToAddr1 || '',
          ToAddr2: d.ToAddr2 || '', ToAddr3: d.ToAddr3 || '',
          ToContactNo: d.ToContactNo || '', ToGSTNo: d.ToGSTNo || '',
          ChallanNo: String(d.ChallanNo || ''), PlaceOfSalesPromotion: d.PlaceOfSalesPromotion || '',
          ChallanDate: new Date(), TransportationBy: d.TransportationBy || '',
          CINNo: d.CINNo || '', IssueId: parseInt(d.IssueId),
          FromContactNo: d.FromContactNo || ''
        }
      );
    }
    res.json({ success: true });
  } catch (e) { console.error('Save challan header:', e.message); res.status(500).json({ error: e.message }); }
});

// GET /api/challan/detail?issueId=X
app.get('/api/challan/detail', requireAuth, async (req, res) => {
  try {
    const { issueId } = req.query;
    const r = await query(
      'EXEC [dbo].[sp_GetDetailDataChallan] @intIssueID',
      { intIssueID: parseInt(issueId) }
    );
    res.json(r.recordset);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/challan/detail/save  â€” archives product rows once per IssueId
app.post('/api/challan/detail/save', requireAuth, async (req, res) => {
  try {
    const { issueId, rows } = req.body;
    const chk = await query('SELECT TOP 1 IssueId FROM tbl_ChallanProductDesc WHERE IssueId=@id', { id: parseInt(issueId) });
    if (!chk.recordset.length && rows && rows.length) {
      for (const row of rows) {
        await query(
          'EXEC [dbo].[sp_SaveChallanProductDesc] @srlno,@ProdDesc,@Pcs,@Rate,@Amount,@IssueId',
          {
            srlno: Number(row.SrlNo || row.srlno || 0),
            ProdDesc: row.ProdDesc || '',
            Pcs: Number(row.Pcs || 0),
            Rate: Number(row.Rate || 0),
            Amount: Number(row.Amount || 0),
            IssueId: parseInt(issueId)
          }
        );
      }
    }
    res.json({ success: true });
  } catch (e) { console.error('Save challan detail:', e.message); res.status(500).json({ error: e.message }); }
});

// Transactions Report
app.get('/api/reports/transactions', requireAuth, async (req, res) => {
  try {
    const { fromDate, toDate, type } = req.query;
    let data = {};
    if (!type || type === 'inward') {
      const r = await query(`SELECT 'Inward' as TxType, i.InwardDate as TxDate, v.VendorName, ii.Qty, ii.Rate, ii.Amount, it.ItemName
        FROM Inward i JOIN InwardItem ii ON i.InwardID=ii.InwardID JOIN Item it ON ii.ItemID=it.Itemid LEFT JOIN Vendor v ON i.VendorID=v.VendorID
        WHERE (@from IS NULL OR i.InwardDate >= @from) AND (@to IS NULL OR i.InwardDate <= @to)`,
        { from: fromDate || null, to: toDate || null });
      data.inward = r.recordset;
    }
    if (!type || type === 'issue') {
      const r = await query(`SELECT 'Issue' as TxType, i.IssueDate as TxDate, d.DealerCompanyName, ii.Qty, ii.Rate, ii.Amount, it.ItemName
        FROM Issue i JOIN IssueItem ii ON i.IssueID=ii.IssueID JOIN Item it ON ii.ItemID=it.Itemid LEFT JOIN DealerMaster d ON i.DealerID=d.DealerID
        WHERE (@from IS NULL OR i.IssueDate >= @from) AND (@to IS NULL OR i.IssueDate <= @to)`,
        { from: fromDate || null, to: toDate || null });
      data.issue = r.recordset;
    }
    res.json(data);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Inward Pricing Report
app.get('/api/reports/inward-pricing', requireAuth, async (req, res) => {
  try {
    const { fromDate, toDate } = req.query;
    const r = await query(`SELECT i.InwardDate, v.VendorName, it.ItemName, ii.Qty, ii.Rate, ii.Amount, i.InvoiceNumber
      FROM Inward i JOIN InwardItem ii ON i.InwardID=ii.InwardID JOIN Item it ON ii.ItemID=it.Itemid LEFT JOIN Vendor v ON i.VendorID=v.VendorID
      WHERE (@from IS NULL OR i.InwardDate >= @from) AND (@to IS NULL OR i.InwardDate <= @to)
      ORDER BY i.InwardDate`,
      { from: fromDate || null, to: toDate || null });
    res.json(r.recordset);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// View Items Stock (Division-wise)
app.get('/api/reports/stock-division-wise', requireAuth, async (req, res) => {
  try {
    const r = await query(`SELECT i.ItemName, d.DivisionName, i.Stock, i.ReorderLevel, i.ReorderQty, c.CategoryName 
      FROM Item i LEFT JOIN Division d ON i.DivisionID=d.DivisionID LEFT JOIN Category c ON i.CategoryId=c.CategoryId ORDER BY d.DivisionName, i.ItemName`);
    res.json(r.recordset);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ---- Inward Return Pending Management ----
app.get('/api/inward-return-pending', requireAuth, async (req, res) => {
  try {
    const { divisionId, flag, dcNo } = req.query;
    let q = `
      SELECT iri.[InwardReturnItemId], iri.[InwardId], iri.[CategoryId], iri.[ItemId],
             iri.[DCQty], iri.[TotalQty], iri.[ItemFlag], iri.[Reason],
             iri.[ReturnMode], iri.[PersonName], iri.[CourierName],
             iri.[ReturnDate], iri.[ReturnDocNo], iri.[status],
             iw.[OrderNumber], iw.[DCNumber], iw.[InvoiceNumber], iw.[InwardDate],
             iw.[VendorId], iw.[InwardFlag], iw.[DivisionId],
             v.[Name]          AS VendorName,
             c.[CategoryName],
             i.[ItemName],
             d.[DivisionName]
      FROM [InwardReturnItem] iri
      JOIN  [Inward]   iw ON iri.[InwardId]   = iw.[InwardId]
      LEFT JOIN [Vendor]   v  ON iw.[VendorId]   = v.[vendorid]
      LEFT JOIN [Category] c  ON iri.[CategoryId] = c.[CategoryId]
      LEFT JOIN [Item]     i  ON iri.[ItemId]     = i.[Itemid]
      LEFT JOIN [Division] d  ON iw.[DivisionId]  = d.[DivisionId]
      WHERE iri.[ItemFlag] IN ('RP','SP') AND iri.[status]='Y'`;
    const params = {};
    if (divisionId) { q += ' AND iw.[DivisionId]=@did'; params.did = parseInt(divisionId); }
    if (flag === 'RP') { q += " AND iri.[ItemFlag]='RP'"; }
    else if (flag === 'SP') { q += " AND iri.[ItemFlag]='SP'"; }
    if (dcNo) { q += ' AND iw.[DCNumber] LIKE @dcno'; params.dcno = '%' + dcNo + '%'; }
    q += ' ORDER BY iri.[InwardReturnItemId] DESC';
    const r = await query(q, params);
    res.json(r.recordset);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/inward-return-pending/:id', requireAuth, async (req, res) => {
  const id = parseInt(req.params.id);
  const { updateStatus, returnMode, personName, courierName, returnDate, trackId } = req.body;
  const user = req.session.user?.loginId || 'admin';
  try {
    // Load the InwardReturnItem record
    const iriRes = await query(
      `SELECT * FROM [InwardReturnItem] WHERE [InwardReturnItemId]=@id`, { id });
    const iri = iriRes.recordset[0];
    if (!iri) return res.status(404).json({ error: 'Record not found' });

    if (updateStatus === 'Return Complete') {
      // SP â†’ Scrap Complete (SC);  RP â†’ Return Complete (RC)
      const resolvedFlag = iri.ItemFlag === 'SP' ? 'SC' : 'RC';
      await query(
        `UPDATE [InwardReturnItem]
         SET [ItemFlag]=@flag,[ReturnMode]=@rmode,[PersonName]=@pname,
             [CourierName]=@cname,[ReturnDate]=@rdate,[ReturnDocNo]=@rdoc,
             [ModifyBy]=@user,[ModifyDate]=GETDATE()
         WHERE [InwardReturnItemId]=@id`,
        {
          flag: resolvedFlag, rmode: returnMode || null, pname: personName || null, cname: courierName || null,
          rdate: returnDate || null, rdoc: trackId || null, user, id
        });

    } else if (updateStatus === 'Complete') {
      // Find rate from existing InwardItem with same InwardId + CategoryId + ItemId
      const rRes = await query(
        `SELECT TOP 1 [rate] FROM [InwardItem]
         WHERE [InwardId]=@iid AND [CategoryId]=@cat AND [ItemId]=@itmid`,
        { iid: iri.InwardId, cat: iri.CategoryId, itmid: iri.ItemId });
      const rate = rRes.recordset[0]?.rate || 0;
      const totalAmt = (iri.TotalQty || 0) * rate;

      // Insert new InwardItem entry (returned goods now received)
      try {
        await query(
          `INSERT INTO [InwardItem]([InwardId],[CategoryId],[ItemId],[DCQty],[TotalQty],
             [rate],[TotalAmt],[status],[AddedBy],[AddedDate])
           VALUES(@iid,@cat,@itmid,@dcq,@qty,@rate,@amt,'Y',@user,GETDATE())`,
          {
            iid: iri.InwardId, cat: iri.CategoryId, itmid: iri.ItemId,
            dcq: iri.DCQty, qty: iri.TotalQty, rate, amt: totalAmt, user
          });
      } catch (_) {
        await query(
          `INSERT INTO [InwardItem]([InwardId],[ItemId],[TotalQty],[rate],[TotalAmt],[AddedBy],[AddedDate])
           VALUES(@iid,@itmid,@qty,@rate,@amt,@user,GETDATE())`,
          {
            iid: iri.InwardId, itmid: iri.ItemId,
            qty: iri.TotalQty, rate, amt: totalAmt, user
          });
      }
      // Increment stock
      if ((iri.TotalQty || 0) > 0 && iri.ItemId) {
        await query('UPDATE [Item] SET [Stock]=ISNULL([Stock],0)+@qty WHERE [Itemid]=@itmid',
          { qty: iri.TotalQty, itmid: iri.ItemId });
      }
      // Delete the resolved InwardReturnItem
      await query(`DELETE FROM [InwardReturnItem] WHERE [InwardReturnItemId]=@id`, { id });
    }

    // Close the Inward if no more RP/SP remain for this InwardId
    const rem = await query(
      `SELECT COUNT(*) AS cnt FROM [InwardReturnItem]
       WHERE [InwardId]=@iid AND [ItemFlag] IN ('RP','SP') AND [status]='Y'`,
      { iid: iri.InwardId });
    if ((rem.recordset[0]?.cnt || 0) === 0) {
      await query(`UPDATE [Inward] SET [InwardFlag]='Close' WHERE [InwardId]=@iid`,
        { iid: iri.InwardId });
    }
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});




// =================== RETURN ISSUES PENDING ===================

// GET IssueReturnItem rows with ItemFlag='RP', filtered by division
app.get('/api/return-issues-pending', requireAuth, async (req, res) => {
  try {
    const { divisionId } = req.query;
    let q = `
      SELECT iri.[IssueReturnItemId], iri.[ReturnId], iri.[ItemId],
             iri.[ReturnQty], iri.[ItemFlag], iri.[Reason], iri.[Remark],
             ir.[ReturnMode], ir.[PersonName], ir.[CourierName],
             ir.[ReturnDate], ir.[ReturnDocNo],
             i.[ItemName], i.[DivisionID]
      FROM [IssueReturnItem] iri
      INNER JOIN [IssueReturn] ir ON iri.[ReturnId] = ir.[ReturnId]
      INNER JOIN [Item] i ON iri.[ItemId] = i.[Itemid]
      WHERE iri.[ItemFlag]='RP'
        AND iri.[Status]='Y'
        AND ir.[Status]='Y'`;
    const params = {};
    if (divisionId) {
      q += ' AND i.[DivisionID]=@did';
      params.did = parseInt(divisionId);
    }
    q += ' ORDER BY iri.[IssueReturnItemId] DESC';
    const r = await query(q, params);
    res.json(r.recordset);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST resolve a Return Issues Pending entry
app.post('/api/return-issues-pending/resolve', requireAuth, async (req, res) => {
  const { IssueReturnItemId, UpdateStatusAs,
    Reason, OtherReason, Remark,
    VendorId, ReturnMode, PersonName,
    CourierName, ReturnDate, ReturnDocNo } = req.body;
  const user = req.session.user?.loginId || 'admin';

  if (!IssueReturnItemId) return res.status(400).json({ error: 'IssueReturnItemId required' });
  if (!UpdateStatusAs) return res.status(400).json({ error: 'UpdateStatusAs required' });

  // Map UI value â†’ ItemFlag
  const flagMap = { 'Return Complete': 'RC', 'Scrap Complete': 'SC', 'Complete': 'C' };
  const newFlag = flagMap[UpdateStatusAs];
  if (!newFlag) return res.status(400).json({ error: 'Invalid UpdateStatusAs value' });

  const finalReason = Reason === 'Other' ? (OtherReason || 'Other') : (Reason || null);

  try {
    // Fetch current IssueReturnItem row for ReturnId + ItemId
    const rowRes = await query(
      `SELECT [ReturnId],[ItemId],[ReturnQty] FROM [IssueReturnItem] WHERE [IssueReturnItemId]=@id`,
      { id: parseInt(IssueReturnItemId) });
    const row = rowRes.recordset[0];
    if (!row) return res.status(404).json({ error: 'IssueReturnItem not found' });

    // Update IssueReturnItem â†’ new ItemFlag
    await query(
      `UPDATE [IssueReturnItem]
       SET [ItemFlag]=@flag, [Reason]=@reason, [Remark]=@remark,
           [ModifyBy]=@user, [ModifyDate]=GETDATE()
       WHERE [IssueReturnItemId]=@id`,
      {
        flag: newFlag, reason: finalReason, remark: Remark || null,
        user, id: parseInt(IssueReturnItemId)
      });

    // If Return Complete â†’ also insert into IssueReturnItemToVendor
    if (newFlag === 'RC') {
      // Sanitise: courier fields must be NULL when ReturnMode is 'Hand'
      const isHandMode = (ReturnMode || '').toLowerCase() === 'hand';
      const safeCourierName = isHandMode ? null : (CourierName || null);
      const safeReturnDate = isHandMode ? null : (ReturnDate || null);
      const safeReturnDocNo = isHandMode ? null : (ReturnDocNo || null);

      await query(
        `INSERT INTO [IssueReturnItemToVendor](
           [ReturnId],[ItemId],[ReturnQty],[ItemFlag],[ReturnMode],
           [PersonName],[CourierName],[ReturnDate],[ReturnDocNo],
           [VendorId],[Reason],[Remark],[IssueReturnItemId],
           [Status],[AddedBy],[AddedDate])
         VALUES(@rid,@itmid,@qty,'RC',@rmode,
                @pname,@cname,@rdate,@rdoc,
                @vid,@reason,@remark,@irid,
                'Y',@user,GETDATE())`,
        {
          rid: row.ReturnId, itmid: row.ItemId, qty: row.ReturnQty,
          rmode: ReturnMode || null, pname: PersonName || null,
          cname: safeCourierName,
          rdate: safeReturnDate,
          rdoc: safeReturnDocNo,
          vid: VendorId ? parseInt(VendorId) : null,
          reason: finalReason, remark: Remark || null,
          irid: parseInt(IssueReturnItemId), user
        });
    }

    // If Complete â†’ restore stock (add ReturnQty back to Item.Stock)
    if (newFlag === 'C') {
      await query(
        'UPDATE [Item] SET [Stock]=ISNULL([Stock],0)+@qty WHERE [Itemid]=@itmid',
        { qty: row.ReturnQty, itmid: row.ItemId });
    }

    res.json({ success: true, newFlag });
  } catch (e) { res.status(500).json({ error: e.message }); }
});


// =================== ISSUE PENDING ITEMS ===================

// GET open issues (IsIssueClose='Open'), filtered by divisionId and optionally itemId
app.get('/api/issue-pending', requireAuth, async (req, res) => {
  try {
    const { divisionId, itemId } = req.query;
    let q = `
      SELECT DISTINCT iss.[IssueId], iss.[RequestId], iss.[RequestByEmpId],
             iss.[IsIssueClose], iss.[RequestMode], iss.[DivisionId],
             iss.[IssueDate], iss.[DistCode],
             iss.[DeliverMode], iss.[DeliverByPersonName],
             iss.[CourierId], iss.[CourierName],
             iss.[CourierPersonMob], iss.[CourierPersonLocation]
      FROM [Issue] iss
      INNER JOIN [IssueItem] ii ON iss.[IssueId] = ii.[IssueId]
      WHERE iss.[IsIssueClose]='Open'
        AND iss.[Status]='Y'
        AND ii.[ItemFlag]='P'
        AND ii.[Status]='Y'`;
    const params = {};
    if (divisionId) { q += ' AND iss.[DivisionId]=@did'; params.did = parseInt(divisionId); }
    if (itemId) { q += ' AND ii.[ItemId]=@iid'; params.iid = parseInt(itemId); }
    q += ' ORDER BY iss.[IssueId] DESC';
    const r = await query(q, params);
    res.json(r.recordset);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET pending items (ItemFlag='P') for one issue
app.get('/api/issue-pending/:issueId/items', requireAuth, async (req, res) => {
  try {
    const r = await query(`
      SELECT ii.[IssueItemId], ii.[IssueId], ii.[ItemId], ii.[RequestQty],
             ii.[IssueQty], ii.[PendingQty], ii.[ItemFlag], ii.[RequestId],
             i.[ItemName]
      FROM [IssueItem] ii
      LEFT JOIN [Item] i ON ii.[ItemId] = i.[Itemid]
      WHERE ii.[IssueId]=@id AND ii.[ItemFlag]='P' AND ii.[Status]='Y'`,
      { id: parseInt(req.params.issueId) });
    res.json(r.recordset);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST resolve selected pending items
app.post('/api/issue-pending/resolve', requireAuth, async (req, res) => {
  const { selectedItemIds, oldIssueId,
    IssueDate, DeliverMode, DeliverByPersonName,
    CourierId, CourierName, TrackId,
    CourierPersonMob, CourierPersonLocation, IssueNote,
    DivisionId, DistCode, RequestedForDealerID, RequestMode,
    RequestByEmpName, DepName } = req.body;
  const user = req.session.user?.loginId || 'admin';

  if (!selectedItemIds?.length) return res.status(400).json({ error: 'No items selected' });
  if (!oldIssueId) return res.status(400).json({ error: 'oldIssueId required' });

  try {
    // Fetch the pending IssueItem rows
    const idsPlaceholder = selectedItemIds.map((_, i) => `@id${i}`).join(',');
    const idParams = {};
    selectedItemIds.forEach((id, i) => { idParams[`id${i}`] = parseInt(id); });

    const oldItemsRes = await query(
      `SELECT [IssueItemId],[ItemId],[PendingQty],[RequestId]
       FROM [IssueItem]
       WHERE [IssueItemId] IN (${idsPlaceholder}) AND [Status]='Y'`, idParams);
    const oldItems = oldItemsRes.recordset;
    if (!oldItems.length) return res.status(404).json({ error: 'Items not found' });

    // Get RequestId from old Issue
    const oldIssueRes = await query(
      `SELECT [RequestId] FROM [Issue] WHERE [IssueId]=@id`, { id: parseInt(oldIssueId) });
    const oldRequestId = oldIssueRes.recordset[0]?.RequestId || 0;

    // --- Create new Issue ---
    const newIssueRes = await query(
      `INSERT INTO [Issue]([RequestMode],[RequestByEmpName],[DepName],[IssueDate],
         [DeliverMode],[DeliverByPersonName],[CourierId],[CourierName],[TrackId],
         [CourierPersonMob],[CourierPersonLocation],[IssueNote],
         [IsIssueClose],[DivisionId],[DistCode],[RequestedForDealerID],
         [Status],[AddedBy],[AddedDate],[RequestId])
       OUTPUT INSERTED.[IssueId]
       VALUES(@rmode,@reqby,@dep,@date,
              @delmode,@delperson,@cid,@cname,@tid,
              @cmob,@cloc,@note,
              'Close',@did,@dist,@dealid,
              'Y',@user,GETDATE(),@reqid)`,
      {
        rmode: RequestMode || null, reqby: RequestByEmpName || null, dep: DepName || null,
        date: IssueDate || new Date().toISOString().split('T')[0],
        delmode: DeliverMode || null, delperson: DeliverByPersonName || null,
        cid: CourierId ? parseInt(CourierId) : null,
        cname: CourierName || null, tid: TrackId || null,
        cmob: CourierPersonMob || null, cloc: CourierPersonLocation || null,
        note: IssueNote || null,
        did: DivisionId || null, dist: DistCode || null,
        dealid: RequestedForDealerID ? parseInt(RequestedForDealerID) : null,
        user, reqid: oldRequestId
      });
    const newIssueId = newIssueRes.recordset[0].IssueId;

    // --- For each selected item ---
    for (const oldItem of oldItems) {
      const pendQty = parseInt(oldItem.PendingQty) || 0;

      // Insert new IssueItem (IssueQty = pendQty, PendingQty = 0, ItemFlag = 'C')
      try {
        await query(
          `INSERT INTO [IssueItem]([IssueId],[ItemId],[RequestQty],[IssueQty],
             [PendingQty],[ItemFlag],[Status],[AddedBy],[AddedDate],[RequestId])
           VALUES(@nid,@itmid,@rqty,@iqty,0,'C','Y',@user,GETDATE(),@reqid)`,
          {
            nid: newIssueId, itmid: oldItem.ItemId,
            rqty: pendQty, iqty: pendQty,
            user, reqid: oldRequestId
          });
      } catch (_) { }

      // Decrement stock
      await query(
        'UPDATE [Item] SET [Stock]=ISNULL([Stock],0)-@qty WHERE [Itemid]=@itmid',
        { qty: pendQty, itmid: oldItem.ItemId });

      // Update old IssueItem â†’ ItemFlag = 'C'
      await query(
        `UPDATE [IssueItem] SET [ItemFlag]='C',[ModifyBy]=@user,[ModifyDate]=GETDATE()
         WHERE [IssueItemId]=@id`,
        { user, id: oldItem.IssueItemId });
    }

    // Check if ALL items in old Issue are now 'C'
    const remainRes = await query(
      `SELECT COUNT(*) AS cnt FROM [IssueItem]
       WHERE [IssueId]=@id AND [ItemFlag]='P' AND [Status]='Y'`,
      { id: parseInt(oldIssueId) });
    const stillPending = remainRes.recordset[0]?.cnt || 0;
    if (stillPending === 0) {
      await query(
        `UPDATE [Issue] SET [IsIssueClose]='Close',[ModifyBy]=@user,[ModifyDate]=GETDATE()
         WHERE [IssueId]=@id`,
        { user, id: parseInt(oldIssueId) });
    }

    res.json({ success: true, newIssueId });
  } catch (e) { res.status(500).json({ error: e.message }); }
});



// â”€â”€ Inventory Report: Inward â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
app.get('/api/inventory-report/inward', async (req, res) => {
  const { divisionId, fromDate, toDate, dateMode } = req.query;
  const divId = parseInt(divisionId) || 0;
  const params = {};
  let divWhere = divId > 0 ? 'mst.DivisionId = @divId' : 'mst.DivisionId IN (1,2)';
  if (divId > 0) params.divId = divId;
  let dateWhere = '';
  if (dateMode === 'range' && fromDate && toDate) {
    dateWhere = ' AND CAST(mst.InwardDate AS DATE) >= @fromDate AND CAST(mst.InwardDate AS DATE) <= @toDate';
    params.fromDate = fromDate;
    params.toDate = toDate;
  }
  const sql = `
    SELECT mst.OrderNumber, mst.DCNumber, mst.InvoiceNumber,
           FORMAT(mst.InwardDate,'dd-MM-yyyy') AS InwardDate,
           v.[CompanyName] AS VendorName, c.CategoryName, i.ItemName,
           dtl.TotalQty, dtl.DCQty
    FROM   Inventorybkp.dbo.Inward mst
    JOIN   Inventorybkp.dbo.InwardItem dtl ON mst.InwardId  = dtl.InwardId
    JOIN   Inventorybkp.dbo.Vendor     v   ON mst.VendorId   = v.VendorId
    JOIN   Inventorybkp.dbo.Category   c   ON dtl.CategoryId = c.CategoryId
    JOIN   Inventorybkp.dbo.Item       i   ON dtl.ItemId     = i.ItemId
    WHERE  i.status = 'Y' AND ${divWhere}${dateWhere}
    ORDER BY mst.InwardDate DESC`;
  try {
    const result = await query(sql, params);
    res.json(result.recordset);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── Approval Sheet: auto-create DB tables ───────────────────────────────
async function _ensureApprovalSheetTables() {
  try {
    await query(`IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='ApprovalSheet' AND xtype='U')
      CREATE TABLE [ApprovalSheet] (
        [ApprovalSheetId]  INT IDENTITY(1,1) PRIMARY KEY,
        [RefNo]            NVARCHAR(100) NOT NULL DEFAULT '',
        [VendorId]         INT           NULL,
        [DivisionId]       INT           NULL,
        [CreatedBy]        NVARCHAR(100) NOT NULL DEFAULT 'admin',
        [CreatedDate]      DATETIME      DEFAULT GETDATE(),
        [PdfPath]          NVARCHAR(500) NULL,
        [Status]           NVARCHAR(10)  DEFAULT 'Y'
      )`, {});
    await query(`IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='ApprovalSheetInward' AND xtype='U')
      CREATE TABLE [ApprovalSheetInward] (
        [Id]               INT IDENTITY(1,1) PRIMARY KEY,
        [ApprovalSheetId]  INT NOT NULL,
        [InwardId]         INT NOT NULL,
        [SrNo]             INT NOT NULL DEFAULT 1
      )`, {});
    // NEW: Per-item tracking table — links specific InwardItems to each ASP
    await query(`IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='ApprovalSheetInwardItem' AND xtype='U')
      CREATE TABLE [ApprovalSheetInwardItem] (
        [Id]              INT IDENTITY(1,1) PRIMARY KEY,
        [ApprovalSheetId] INT NOT NULL,
        [InwardId]        INT NOT NULL,
        [InwardItemId]    INT NOT NULL,
        [TotalAmt]        DECIMAL(18,2) NOT NULL DEFAULT 0
      )`, {});
    // Backfill: for existing ApprovalSheetInward rows that have no ASII entries,
    // seed them with items where status='Y' AND DCQty=TotalQty (old logic = "complete" items).
    // Idempotent — safe to run every startup.
    await query(`
      INSERT INTO [ApprovalSheetInwardItem]([ApprovalSheetId],[InwardId],[InwardItemId],[TotalAmt])
      SELECT asi.[ApprovalSheetId], asi.[InwardId], ii.[InwardItemId], ii.[TotalAmt]
      FROM   [ApprovalSheetInward] asi
      JOIN   [InwardItem] ii ON ii.[InwardId]=asi.[InwardId]
                             AND ii.[status]='Y'
                             AND ii.[DCQty]=ii.[TotalQty]
      WHERE  NOT EXISTS (
        SELECT 1 FROM [ApprovalSheetInwardItem] asii
        WHERE  asii.[ApprovalSheetId]=asi.[ApprovalSheetId]
          AND  asii.[InwardItemId]=ii.[InwardItemId]
      )`, {});
    console.log('[ApprovalSheet] Tables ensured.');
  } catch (e) {
    console.warn('[ApprovalSheet] Table setup warning:', e.message);
  }
}

// ─── GET /api/approval-sheets  (list all) ───────────────────────────────
app.get('/api/approval-sheets', requireAuth, async (req, res) => {
  try {
    const r = await query(`
      SELECT a.*, v.[Name] AS VendorName, v.[CompanyName] AS VendorCompanyName, d.[DivisionName],
             (SELECT COUNT(*) FROM [ApprovalSheetInward] asi WHERE asi.[ApprovalSheetId]=a.[ApprovalSheetId]) AS InwardCount
      FROM [ApprovalSheet] a
      LEFT JOIN [Vendor]   v ON a.[VendorId]   = v.[vendorid]
      LEFT JOIN [Division] d ON a.[DivisionId] = d.[DivisionId]
      WHERE a.[Status]='Y'
      ORDER BY a.[ApprovalSheetId] DESC`, {});
    res.json(r.recordset);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── GET /api/approval-sheets/:id  (single sheet with inwards) ──────────
app.get('/api/approval-sheets/:id', requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const sheetR = await query(`
      SELECT a.*, v.[Name] AS VendorName, v.[CompanyName] AS VendorCompanyName, d.[DivisionName]
      FROM [ApprovalSheet] a
      LEFT JOIN [Vendor]   v ON a.[VendorId]   = v.[vendorid]
      LEFT JOIN [Division] d ON a.[DivisionId] = d.[DivisionId]
      WHERE a.[ApprovalSheetId]=@id`, { id });
    if (!sheetR.recordset.length) return res.status(404).json({ error: 'Not found' });
    const inwardsR = await query(`
      SELECT asi.[SrNo], asi.[InwardId], i.[OrderNumber], i.[DCNumber], i.[InvoiceNumber],
             FORMAT(i.[InwardDate],'dd-MM-yyyy') AS InwardDate,
             ISNULL((SELECT SUM(asii2.[TotalAmt]) FROM [ApprovalSheetInwardItem] asii2
                     WHERE asii2.[ApprovalSheetId]=asi.[ApprovalSheetId]
                       AND asii2.[InwardId]=asi.[InwardId]),0) AS EligibleAmt
      FROM [ApprovalSheetInward] asi
      JOIN [Inward] i ON i.[InwardId]=asi.[InwardId]
      WHERE asi.[ApprovalSheetId]=@id
      ORDER BY asi.[SrNo]`, { id });
    // Per-item rows for the A4 sub-row layout
    const itemsR = await query(`
      SELECT asii.[InwardId], ii.[InwardItemId], asii.[TotalAmt],
             ii.[TotalQty], ii.[DCQty],
             FORMAT(ii.[AddedDate],'dd-MM-yyyy') AS ItemDate,
             i.[InvoiceNumber]
      FROM [ApprovalSheetInwardItem] asii
      JOIN [InwardItem] ii ON ii.[InwardItemId]=asii.[InwardItemId]
      JOIN [Inward]     i  ON i.[InwardId]=asii.[InwardId]
      WHERE asii.[ApprovalSheetId]=@id
      ORDER BY asii.[InwardId], ii.[AddedDate], ii.[InwardItemId]`, { id });
    // Group items by InwardId
    const itemsByInward = {};
    for (const it of itemsR.recordset) {
      if (!itemsByInward[it.InwardId]) itemsByInward[it.InwardId] = [];
      itemsByInward[it.InwardId].push(it);
    }
    const inwardsWithItems = inwardsR.recordset.map(iw => ({
      ...iw, items: itemsByInward[iw.InwardId] || []
    }));
    res.json({ sheet: sheetR.recordset[0], inwards: inwardsWithItems });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── POST /api/approval-sheets  (create / supplementary) ───────────────
app.post('/api/approval-sheets', requireAuth, async (req, res) => {
  const { inwardIds, refNo } = req.body;
  const user = req.session.user?.loginId || 'admin';
  if (!inwardIds || !inwardIds.length) return res.status(400).json({ error: 'No inwards selected' });
  try {
    // Validate each inward: block truly-disabled ones (in ASP with no new items)
    for (const inwardId of inwardIds) {
      const stateR = await query(`
        SELECT
          (SELECT COUNT(DISTINCT asii.[ApprovalSheetId]) FROM [ApprovalSheetInwardItem] asii
           WHERE asii.[InwardId]=@iid) AS AspCount,
          CASE WHEN EXISTS(
            SELECT 1 FROM [InwardItem] ii
            WHERE ii.[InwardId]=@iid AND ii.[status]='Y'
            AND ii.[InwardItemId] NOT IN (
              SELECT asii.[InwardItemId] FROM [ApprovalSheetInwardItem] asii
              WHERE asii.[InwardId]=@iid
            )
          ) THEN 1 ELSE 0 END AS HasNewResolved`, { iid: inwardId });
      const { AspCount, HasNewResolved } = stateR.recordset[0];
      if (AspCount > 0 && HasNewResolved === 0) {
        return res.status(400).json({
          error: `Inward ${inwardId} is fully accounted for — no new resolved items to include.`
        });
      }
    }
    // Validate: all same vendor
    const vendorCheck = await query(
      `SELECT DISTINCT [VendorId] FROM [Inward] WHERE [InwardId] IN (${inwardIds.map((_,i)=>'@id'+i).join(',')})`,
      Object.fromEntries(inwardIds.map((id,i)=>['id'+i, id])));
    if (vendorCheck.recordset.length > 1) {
      return res.status(400).json({ error: 'All selected inwards must belong to the same vendor.' });
    }
    const vendorId  = vendorCheck.recordset[0]?.VendorId || null;
    const divR      = await query(`SELECT TOP 1 [DivisionId] FROM [Inward] WHERE [InwardId]=@id`, { id: inwardIds[0] });
    const divisionId = divR.recordset[0]?.DivisionId || null;
    // Create ApprovalSheet header
    const sheetR = await query(
      `INSERT INTO [ApprovalSheet]([RefNo],[VendorId],[DivisionId],[CreatedBy],[CreatedDate])
       OUTPUT INSERTED.[ApprovalSheetId]
       VALUES(@refNo,@vid,@did,@user,GETDATE())`,
      { refNo: refNo || '', vid: vendorId, did: divisionId, user });
    const sheetId = sheetR.recordset[0].ApprovalSheetId;
    // Insert ApprovalSheetInward + per-item ASII rows for each inward
    for (let i = 0; i < inwardIds.length; i++) {
      const inwardId = inwardIds[i];
      await query(
        `INSERT INTO [ApprovalSheetInward]([ApprovalSheetId],[InwardId],[SrNo]) VALUES(@sid,@iid,@srno)`,
        { sid: sheetId, iid: inwardId, srno: i + 1 });
      // Find status='Y' InwardItems NOT yet tracked in any ASII for this inward
      const newItemsR = await query(`
        SELECT ii.[InwardItemId], ii.[TotalAmt]
        FROM   [InwardItem] ii
        WHERE  ii.[InwardId]=@iid AND ii.[status]='Y'
        AND    ii.[InwardItemId] NOT IN (
          SELECT asii.[InwardItemId] FROM [ApprovalSheetInwardItem] asii
          WHERE  asii.[InwardId]=@iid
        )`, { iid: inwardId });
      for (const item of newItemsR.recordset) {
        await query(
          `INSERT INTO [ApprovalSheetInwardItem]([ApprovalSheetId],[InwardId],[InwardItemId],[TotalAmt])
           VALUES(@sid,@iid,@itemId,@amt)`,
          { sid: sheetId, iid: inwardId, itemId: item.InwardItemId, amt: item.TotalAmt });
      }
    }
    res.json({ success: true, ApprovalSheetId: sheetId });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── GET /api/inward/:id/approval-sheets  (all ASPs for one inward) ──────
app.get('/api/inward/:id/approval-sheets', requireAuth, async (req, res) => {
  try {
    const inwardId = parseInt(req.params.id);
    const r = await query(`
      SELECT a.[ApprovalSheetId], a.[RefNo],
             FORMAT(a.[CreatedDate],'dd-MM-yyyy HH:mm') AS CreatedDate,
             a.[PdfPath],
             ISNULL(SUM(asii.[TotalAmt]),0) AS TotalAmt,
             COUNT(asii.[Id])               AS ItemCount
      FROM   [ApprovalSheet] a
      JOIN   [ApprovalSheetInwardItem] asii ON asii.[ApprovalSheetId]=a.[ApprovalSheetId]
      WHERE  asii.[InwardId]=@iid
      GROUP  BY a.[ApprovalSheetId], a.[RefNo], a.[CreatedDate], a.[PdfPath]
      ORDER  BY a.[ApprovalSheetId] ASC`, { iid: inwardId });
    res.json(r.recordset);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── POST /api/approval-sheets/:id/export-pdf  (generate + save PDF) ────
app.post('/api/approval-sheets/:id/export-pdf', requireAuth, async (req, res) => {
  const id = parseInt(req.params.id);
  const { htmlContent } = req.body;
  if (!htmlContent) return res.status(400).json({ error: 'htmlContent required' });
  try {
    const fullHtml = `<!DOCTYPE html><html><head>
      <meta charset="UTF-8">
      <style>
        @page { size: A4; margin: 10mm; }
        body { margin: 0; padding: 0; font-family: Arial, sans-serif; font-size: 11px; }
        * { box-sizing: border-box; }
        [contenteditable] { outline: none; }
      </style>
    </head><body>${htmlContent}</body></html>`;
    const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'], headless: 'new' });
    const page = await browser.newPage();
    await page.setContent(fullHtml, { waitUntil: 'networkidle0' });
    const pdfBuf = await page.pdf({ format: 'A4', printBackground: true });
    await browser.close();
    // Save to disk
    const fname = `ASP-${id}-${Date.now()}.pdf`;
    const fpath = path.join(__dirname, 'public', 'approvals', fname);
    require('fs').writeFileSync(fpath, pdfBuf);
    // Update PdfPath in DB
    await query(`UPDATE [ApprovalSheet] SET [PdfPath]=@p WHERE [ApprovalSheetId]=@id`,
                { p: '/approvals/' + fname, id });
    // Stream as download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fname}"`);
    res.send(pdfBuf);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── GET /api/approval-sheets/:id/pdf  (re-download saved PDF) ──────────
app.get('/api/approval-sheets/:id/pdf', requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const r = await query(`SELECT [PdfPath] FROM [ApprovalSheet] WHERE [ApprovalSheetId]=@id`, { id });
    if (!r.recordset.length || !r.recordset[0].PdfPath) return res.status(404).json({ error: 'No PDF saved' });
    const fpath = path.join(__dirname, 'public', r.recordset[0].PdfPath);
    if (!require('fs').existsSync(fpath)) return res.status(404).json({ error: 'PDF file not found on disk' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="approval-${id}.pdf"`);
    res.sendFile(fpath);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── Inventory Report: Outward ──────────────────────────────────────────
app.get('/api/inventory-report/outward', async (req, res) => {
  const { divisionId, fromDate, toDate, dateMode } = req.query;
  const divId = parseInt(divisionId) || 0;
  const params = {};
  let divWhere = divId > 0 ? 'mst.DivisionId = @divId' : 'mst.DivisionId IN (1,2)';
  if (divId > 0) params.divId = divId;
  let dateWhere = '';
  if (dateMode === 'range' && fromDate && toDate) {
    dateWhere = ' AND CAST(mst.IssueDate AS DATE) >= @fromDate AND CAST(mst.IssueDate AS DATE) <= @toDate';
    params.fromDate = fromDate;
    params.toDate = toDate;
  }
  const sql = `
    SELECT mst.IssueId AS ChallanNo, dlr.DistCode, dlr.DealerCompanyName, dlr.ContactPersonName,
           dlr.Addr1, dlr.Addr2, dlr.Addr3, dlr.Mobile, dlr.GST,
           dlr.PlaceOfSalesPromotion, mst.RequestMode, mst.DeliverMode,
           mst.DeliverByPersonName, mst.CourierName, mst.TrackId,
           mst.CourierPersonMob, mst.CourierPersonLocation,
           mst.IssueNote, i.ItemName, dtl.RequestQty, dtl.IssueQty,
           FORMAT(mst.IssueDate,'dd-MM-yyyy') AS IssueDate
    FROM   Inventorybkp.dbo.Issue      mst
    JOIN   Inventorybkp.dbo.IssueItem  dtl ON mst.IssueId          = dtl.IssueId
    JOIN   Inventorybkp.dbo.Item       i   ON dtl.ItemId            = i.ItemId
    JOIN   Inventorybkp.dbo.DealerMaster dlr ON mst.RequestedForDealerID = dlr.DealerID
    WHERE  i.status = 'Y' AND ${divWhere}${dateWhere}
    ORDER BY mst.IssueDate DESC`;
  try {
    const result = await query(sql, params);
    res.json(result.recordset);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Catch-all for SPA
app.get('/{*path}', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// â”€â”€ Global error handler â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Catches any unhandled Express errors and returns JSON (never an HTML page).
// Without this, Express sends a default HTML 500 that the api() function
// can't parse â†’ body becomes {} â†’ data.error=undefined â†’ "Request failed".
app.use((err, req, res, next) => {
  console.error('[GlobalError]', req.method, req.path, err.message);
  // Guard: if response was already sent (e.g. session EPERM race on Windows), just log and stop.
  if (res.headersSent) return next(err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Inventory Web App running at http://localhost:${PORT}`);
  _ensureApprovalSheetTables();
});

