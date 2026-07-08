/* =============================================
   KISNA INVENTORY &#8211; Single Page Application
   ============================================= */

// -------- STATE --------
const State = {
  user: null,
  currentPage: 'dashboard',
  data: {}
};

// -------- RBAC HELPERS --------
// These must be defined FIRST — all page files reference them on load.
function isSuperAdmin() {
  const role = (State.user?.roleName || '').trim().toLowerCase().replace(/\s+/g, '');
  return role === 'superadmin';
}
function isAdmin() {
  const role = (State.user?.roleName || '').trim().toLowerCase().replace(/\s+/g, '');
  return role === 'admin';
}

function $(sel, ctx = document) { return ctx.querySelector(sel); }
function $$(sel, ctx = document) { return [...ctx.querySelectorAll(sel)]; }

function api(path, opts = {}) {
  return fetch(path, {
    headers: { 'Content-Type': 'application/json', ...opts.headers },
    credentials: 'include',
    ...opts,
    body: opts.body ? JSON.stringify(opts.body) : undefined
  }).then(async r => {
    const data = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(data.error || 'Request failed');
    return data;
  });
}

function showToast(msg, type = 'success') {
  let container = $('#toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  const icons = { success: 'fa-circle-check', error: 'fa-circle-xmark', info: 'fa-circle-info' };
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.innerHTML = `<i class="fas ${icons[type] || icons.info}"></i><span>${msg}</span>`;
  container.appendChild(t);
  setTimeout(() => t.remove(), 3700);
}

function confirm(msg) {
  return new Promise(resolve => {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal" style="max-width:380px">
        <div class="modal-header"><h3><i class="fas fa-triangle-exclamation"></i> Confirm</h3></div>
        <div class="modal-body"><p style="color:var(--text-secondary)">${msg}</p></div>
        <div class="modal-footer">
          <button class="btn btn-secondary" id="cfn-cancel">Cancel</button>
          <button class="btn btn-danger" id="cfn-ok">Confirm</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    $('#cfn-cancel', overlay).onclick = () => { overlay.remove(); resolve(false); };
    $('#cfn-ok', overlay).onclick = () => { overlay.remove(); resolve(true); };
    overlay.onclick = e => { if (e.target === overlay) { overlay.remove(); resolve(false); } };
  });
}

function modalHtml(title, bodyHtml, size = '') {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal ${size}">
      <div class="modal-header">
        <h3><i class="fas fa-pen-to-square"></i> ${title}</h3>
        <button class="btn-close-modal"><i class="fas fa-xmark"></i></button>
      </div>
      <div class="modal-body">${bodyHtml}</div>
    </div>`;
  document.body.appendChild(overlay);
  overlay.querySelector('.btn-close-modal').onclick = () => overlay.remove();
  overlay.onclick = e => { if (e.target === overlay) overlay.remove(); };
  return overlay;
}

function fmtDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-IN');
}
function fmtNum(n) { return Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 }); }

// ──────────────────────────────────────────────────────────────────────────────
// Shared Bulk Upload Modal
// Usage: showBulkUploadModal({ title, apiPath, templateCols, templateFile, onSuccess })
// ──────────────────────────────────────────────────────────────────────────────
function showBulkUploadModal({ title, apiPath, templateCols, templateFile, onSuccess }) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal" style="max-width:500px;animation:slideUp 0.2s ease">
      <div class="modal-header">
        <h3><i class="fas fa-file-arrow-up"></i> ${title} — Bulk Upload</h3>
        <button class="btn-close-modal" onclick="this.closest('.modal-overlay').remove()">
          <i class="fas fa-xmark"></i></button>
      </div>
      <div class="modal-body">
        <!-- Step 1: Download template -->
        <div style="background:var(--bg-dark);border:1px solid var(--border);border-radius:8px;padding:14px;margin-bottom:16px">
          <div style="font-size:13px;font-weight:600;color:var(--text-primary);margin-bottom:8px">
            <i class="fas fa-circle-info" style="color:var(--info)"></i> Step 1 — Download Template
          </div>
          <p style="font-size:12px;color:var(--text-secondary);margin:0 0 10px">
            Download the Excel template, fill in your data, then upload it below.
            <br><strong>Required columns:</strong> ${templateCols.join(', ')}
          </p>
          <button id="btn-dl-template" class="btn btn-secondary" style="font-size:12px">
            <i class="fas fa-download"></i> Download Template
          </button>
        </div>
        <!-- Step 2: Upload file -->
        <div style="background:var(--bg-dark);border:1px solid var(--border);border-radius:8px;padding:14px">
          <div style="font-size:13px;font-weight:600;color:var(--text-primary);margin-bottom:8px">
            <i class="fas fa-upload" style="color:var(--accent)"></i> Step 2 — Upload Filled Excel
          </div>
          <label id="bulk-drop-zone" style="display:flex;flex-direction:column;align-items:center;
            justify-content:center;border:2px dashed var(--border);border-radius:8px;padding:28px 12px;
            cursor:pointer;gap:8px;transition:border-color .2s" for="bulk-file-input">
            <i class="fas fa-file-excel" style="font-size:32px;color:#1f7244"></i>
            <span style="font-size:13px;color:var(--text-secondary)">Click to choose or drag & drop an Excel file</span>
            <span id="bulk-file-name" style="font-size:12px;color:var(--accent);font-weight:600"></span>
          </label>
          <input type="file" id="bulk-file-input" accept=".xlsx,.xls" style="display:none">
        </div>
        <!-- Result area -->
        <div id="bulk-result" style="display:none;margin-top:14px;padding:12px;border-radius:8px;font-size:13px"></div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
        <button id="btn-bulk-upload-submit" class="btn btn-primary" disabled>
          <i class="fas fa-upload"></i> Upload & Import
        </button>
      </div>
    </div>`;
  document.body.appendChild(overlay);
  overlay.onclick = e => { if (e.target === overlay) overlay.remove(); };

  // Template download
  overlay.querySelector('#btn-dl-template').onclick = () => {
    if (!window.XLSX) { showToast('SheetJS not loaded', 'error'); return; }
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([templateCols]);
    XLSX.utils.book_append_sheet(wb, ws, 'Template');
    XLSX.writeFile(wb, templateFile);
    showToast('Template downloaded!', 'success');
  };

  // File picker
  const fileInput = overlay.querySelector('#bulk-file-input');
  const fileNameEl = overlay.querySelector('#bulk-file-name');
  const submitBtn  = overlay.querySelector('#btn-bulk-upload-submit');
  const dropZone   = overlay.querySelector('#bulk-drop-zone');
  const resultEl   = overlay.querySelector('#bulk-result');

  fileInput.onchange = () => {
    if (fileInput.files[0]) {
      fileNameEl.textContent = fileInput.files[0].name;
      submitBtn.disabled = false;
      dropZone.style.borderColor = 'var(--accent)';
    }
  };

  // Drag & drop
  dropZone.ondragover  = e => { e.preventDefault(); dropZone.style.borderColor = 'var(--accent)'; };
  dropZone.ondragleave = () => { dropZone.style.borderColor = 'var(--border)'; };
  dropZone.ondrop = e => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f && (f.name.endsWith('.xlsx') || f.name.endsWith('.xls'))) {
      fileInput.files = e.dataTransfer.files;
      fileNameEl.textContent = f.name;
      submitBtn.disabled = false;
      dropZone.style.borderColor = 'var(--accent)';
    } else {
      showToast('Please drop an Excel (.xlsx/.xls) file', 'error');
    }
  };

  // Upload
  submitBtn.onclick = async () => {
    const file = fileInput.files[0];
    if (!file) return;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading...';
    resultEl.style.display = 'none';

    // Parse with SheetJS client-side
    const reader = new FileReader();
    reader.onload = async e => {
      try {
        const wb = XLSX.read(e.target.result, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(ws, { defval: '' });
        if (!rows.length) throw new Error('No data rows found in the file');

        const result = await api(apiPath, { method: 'POST', body: { rows } });
        const msg = `✅ Imported ${result.inserted || 0} record(s) successfully` +
          (result.skipped ? ` · ${result.skipped} skipped` : '') +
          (result.errors?.length ? ` · ${result.errors.length} error(s)` : '');
        resultEl.style.display = 'block';
        resultEl.style.background = 'rgba(34,197,94,.1)';
        resultEl.style.border = '1px solid var(--success)';
        resultEl.style.color = 'var(--success)';
        resultEl.innerHTML = `<i class="fas fa-circle-check"></i> ${msg}`;
        if (result.errors?.length) {
          resultEl.innerHTML += `<ul style="margin:8px 0 0;padding-left:18px;color:var(--danger);font-size:11px">` +
            result.errors.slice(0, 5).map(e => `<li>${e}</li>`).join('') +
            (result.errors.length > 5 ? `<li>...and ${result.errors.length - 5} more</li>` : '') + `</ul>`;
        }
        showToast(`${result.inserted || 0} records imported!`, 'success');
        if (onSuccess) await onSuccess();
      } catch (err) {
        resultEl.style.display = 'block';
        resultEl.style.background = 'rgba(239,68,68,.1)';
        resultEl.style.border = '1px solid var(--danger)';
        resultEl.style.color = 'var(--danger)';
        resultEl.innerHTML = `<i class="fas fa-circle-xmark"></i> ${err.message}`;
        showToast('Upload failed: ' + err.message, 'error');
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-upload"></i> Upload & Import';
      }
    };
    reader.readAsArrayBuffer(file);
  };
}

// -------- THEME --------
function _themeMode() { return localStorage.getItem('kisna-theme') || 'light'; }

function applyTheme(mode) {
  document.documentElement.setAttribute('data-theme', mode === 'dark' ? 'dark' : '');
  localStorage.setItem('kisna-theme', mode);
  const btn = document.getElementById('btn-theme-toggle');
  if (!btn) return;
  if (mode === 'dark') {
    btn.innerHTML = '<i class="fas fa-moon"></i>';
    btn.title = 'Switch to Light Mode';
    btn.classList.remove('is-light');
    btn.classList.add('is-dark');
  } else {
    btn.innerHTML = '<i class="fas fa-sun"></i>';
    btn.title = 'Switch to Dark Mode';
    btn.classList.remove('is-dark');
    btn.classList.add('is-light');
  }
}

function toggleTheme() {
  applyTheme(_themeMode() === 'dark' ? 'light' : 'dark');
}

// -------- ROUTER --------
const pages = {};
function registerPage(name, fn) { pages[name] = fn; }

function navigateTo(page) {
  State.currentPage = page;
  $$('.nav-item').forEach(el => el.classList.toggle('active', el.dataset.page === page));
  const area = $('#content-area');
  if (!area) return;
  area.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
  const pageFn = pages[page];
  if (!pageFn) {
    area.innerHTML = `<div class="content-body"><div class="card"><p style="color:var(--text-secondary)">Page "<strong>${page}</strong>" not found.</p></div></div>`;
    return;
  }
  Promise.resolve(pageFn())
    .then(html => {
      if (html == null || html === '') {
        console.warn('[navigateTo] Page "' + page + '" returned empty HTML');
        area.innerHTML = '<div class="content-body"><div class="card"><p>Page returned empty content.</p></div></div>';
      } else {
        area.innerHTML = html;
        bindPage(page);
      }
    })
    .catch(err => {
      console.error('[navigateTo] Error in page "' + page + '":', err);
      area.innerHTML = `<div class="content-body"><div class="card" style="color:var(--danger)"><i class="fas fa-circle-xmark" style="margin-right:8px"></i><strong>Error loading page:</strong> ${err.message}</div></div>`;
    });
}

function bindPage(page) {
  if (window._pageBinders && window._pageBinders[page]) window._pageBinders[page]();
}

function renderNotFound() {
  return `<div class="content-body"><div class="card"><p>Page not found.</p></div></div>`;
}

// -------- LAYOUT --------
function renderLayout() {
  const app = $('#app');
  app.innerHTML = `
    <button id="sidebar-toggle" title="Toggle sidebar" aria-label="Toggle sidebar">
      <i class="fas fa-gem"></i>
    </button>
    <div id="sidebar-backdrop"></div>
    <div id="main-layout">
      ${renderSidebar()}
      <div id="content-area"></div>
    </div>
    <div id="toast-container" class="toast-container"></div>`;
  bindSidebar();
  applyTheme(_themeMode());
  // Restore desktop collapsed preference
  if (window.innerWidth > 768 && localStorage.getItem('kisna-sidebar') === 'closed') {
    document.getElementById('sidebar').classList.add('collapsed');
    document.getElementById('main-layout').classList.add('sidebar-collapsed');
  }
  navigateTo('dashboard');
  // Load alerts badge on login
  setTimeout(() => window.refreshAlertBadge && window.refreshAlertBadge(), 1000);
}

function renderSidebar() {
  const initials = (State.user?.loginId || 'U').substring(0, 2).toUpperCase();
  return `
  <aside id="sidebar">
    <div class="sidebar-header">
      <div class="sidebar-brand">
        <div class="brand-name">KISNA</div>
        <div class="brand-sub">Inventory System</div>
      </div>
      <div style="display:flex;gap:8px;margin-left:auto;">
        <button id="btn-alerts-toggle" class="sidebar-theme-btn"
                onclick="showAlertsModal()" title="Alerts" style="position:relative;color:#a1a1aa;">
          <i class="fas fa-bell"></i>
          <span id="alert-badge" style="position:absolute;top:-2px;right:-2px;background:var(--danger);color:#fff;font-size:9px;border-radius:50%;padding:1px 4px;display:none;">0</span>
        </button>
        <button id="btn-theme-toggle" class="sidebar-theme-btn is-light"
                onclick="toggleTheme()" title="Switch to Dark Mode" style="margin-left:0;">
          <i class="fas fa-sun"></i>
        </button>
      </div>
    </div>
    <nav class="sidebar-nav">
      <div class="nav-section-title">Overview</div>
      <div class="nav-item active" data-page="dashboard"><i class="fas fa-chart-pie"></i> Dashboard</div>
      <div class="nav-item superadmin-only" data-page="activity-logs"><i class="fas fa-clock-rotate-left"></i> Activity Logs</div>

      <div class="nav-section-title">Masters</div>
      <div class="nav-item" data-page="divisions"><i class="fas fa-layer-group"></i> Division</div>
      <div class="nav-item" data-page="departments"><i class="fas fa-building"></i> Department</div>
      <div class="nav-item" data-page="categories"><i class="fas fa-tags"></i> Product Category</div>
      <div class="nav-item" data-page="states"><i class="fas fa-map-marked-alt"></i> State</div>
      <div class="nav-item" data-page="cities"><i class="fas fa-city"></i> City</div>
      <div class="nav-item" data-page="kisna-region"><i class="fas fa-globe-asia"></i> Kisna Region State</div>
      <div class="nav-item" data-page="category-codes"><i class="fas fa-barcode"></i> Category / Item Code</div>
      <div class="nav-item" data-page="items"><i class="fas fa-box"></i> Item Master</div>
      <div class="nav-item" data-page="vendors"><i class="fas fa-truck"></i> Vendor Details</div>
      <div class="nav-item" data-page="dealers"><i class="fas fa-store"></i> Dealer Master</div>
      <div class="nav-item" data-page="couriers"><i class="fas fa-motorcycle"></i> Courier Details</div>
      <div class="nav-item" data-page="kit-master"><i class="fas fa-cubes"></i> Kit Master</div>
      <div class="nav-item" data-page="item-vendor-map"><i class="fas fa-link"></i> Item&#8211;Vendor Mapping</div>
      <div class="nav-item" data-page="role-master"><i class="fas fa-key"></i> Role Master</div>
      <div class="nav-item" data-page="user-master"><i class="fas fa-users-gear"></i> User Master</div>

      <div class="nav-section-title">Transactions</div>
      <div class="nav-item" data-page="orders"><i class="fas fa-file-invoice"></i> Order Items</div>
      <hr class="nav-divider"/>
      <div class="nav-item" data-page="purchase-inward"><i class="fas fa-box-open"></i> Purchase Inward</div>
      <div class="nav-item" data-page="inward-return-pending"><i class="fas fa-clock-rotate-left"></i> Inward Return Pending</div>
      <hr class="nav-divider"/>
      <div class="nav-item" data-page="issue-items"><i class="fas fa-arrow-up-from-bracket"></i> Issue Items</div>
      <div class="nav-item" data-page="issue-pending"><i class="fas fa-hourglass-half"></i> Issue Pending Items</div>
      <hr class="nav-divider"/>
      <div class="nav-item" data-page="issue-return"><i class="fas fa-rotate-left"></i> Return Issue Item</div>
      <div class="nav-item" data-page="issue-return-pending"><i class="fas fa-triangle-exclamation"></i> Return Issues Pending</div>

      <div class="nav-section-title">Reports</div>

      <div class="nav-subsection-title"><i class="fas fa-file-invoice" style="margin-right:5px"></i>Challan Report</div>
      <div class="nav-item nav-item-sub" data-page="challan"><i class="fas fa-file-lines"></i> Issue Items Challan</div>

      <div class="nav-subsection-title"><i class="fas fa-warehouse" style="margin-right:5px"></i>Stock Report</div>
      <div class="nav-item nav-item-sub" data-page="view-items-stock"><i class="fas fa-eye"></i> View Items Stock</div>
      <div class="nav-item nav-item-sub" data-page="report-stock"><i class="fas fa-chart-bar"></i> Item Stock Report</div>

      <div class="nav-subsection-title"><i class="fas fa-boxes-stacked" style="margin-right:5px"></i>Inventory Report</div>
      <div class="nav-item nav-item-sub" data-page="inventory-report"><i class="fas fa-clipboard-list"></i> Inventory Report</div>

      <div class="nav-subsection-title"><i class="fas fa-skull" style="margin-right:5px;color:#7c3aed"></i>AI Insights</div>
      <div class="nav-item nav-item-sub" data-page="dead-stock"><i class="fas fa-skull"></i> Dead Stock Identifier</div>
      <div class="nav-item nav-item-sub" data-page="vendor-scorecard"><i class="fas fa-star-half-stroke"></i> Vendor Scorecard</div>
    </nav>
    <div class="sidebar-footer">
      <div class="user-info">
        <div class="user-avatar">${initials}</div>
        <div><div class="user-name">${State.user?.loginId || 'User'}</div><div class="user-role">Inventory Admin</div></div>
        <button class="btn-logout" id="btn-logout" title="Logout"><i class="fas fa-right-from-bracket"></i></button>
      </div>
    </div>
  </aside>`;
}

function _applyRBACSidebar() {
  if (isAdmin()) {
    // Hide AI Insights section for Admin
    $$('.nav-subsection-title').forEach(el => {
      if (el.textContent.trim().includes('AI Insights')) el.style.display = 'none';
    });
    $$('.nav-item[data-page="dead-stock"], .nav-item[data-page="vendor-scorecard"]').forEach(el => el.style.display = 'none');
    $$('.nav-item[data-page="role-master"], .nav-item[data-page="user-master"]').forEach(el => el.style.display = 'none');
    // Hide Super Admin-only items (Activity Logs)
    $$('.superadmin-only').forEach(el => el.style.display = 'none');

    // Hide dead stock sections on dashboard
    setTimeout(() => {
      const dsStat = $$('.stat-card').find(el => el.textContent.includes('Dead Stock'));
      if (dsStat) dsStat.style.display = 'none';
      const dsAlert = $('#dash-dead-stock-section');
      if (dsAlert) dsAlert.style.display = 'none';
    }, 100);
  }
}

function bindSidebar() {
  _applyRBACSidebar();
  $$('.nav-item').forEach(el => {
    el.onclick = () => {
      navigateTo(el.dataset.page);
      if (window.innerWidth <= 768) _closeSidebar();
    };
  });
  $('#btn-logout').onclick = async () => {
    await api('/api/logout', { method: 'POST' });
    State.user = null;
    renderLogin();
  };
  document.getElementById('sidebar-toggle').onclick = () => {
    if (window.innerWidth <= 768) _toggleMobileSidebar();
    else _toggleDesktopSidebar();
  };
  document.getElementById('sidebar-backdrop').onclick = _closeSidebar;
}
function _toggleDesktopSidebar() {
  const sb = document.getElementById('sidebar');
  const ml = document.getElementById('main-layout');
  const collapsed = sb.classList.toggle('collapsed');
  ml.classList.toggle('sidebar-collapsed', collapsed);
  localStorage.setItem('kisna-sidebar', collapsed ? 'closed' : 'open');
}
function _toggleMobileSidebar() {
  const sb = document.getElementById('sidebar');
  const bd = document.getElementById('sidebar-backdrop');
  const open = sb.classList.toggle('open');
  bd.classList.toggle('show', open);
}
function _closeSidebar() {
  const sb = document.getElementById('sidebar');
  const bd = document.getElementById('sidebar-backdrop');
  sb.classList.remove('open');
  bd.classList.remove('show');
}

// -------- LOGIN --------
function renderLogin() {
  $('#app').innerHTML = `
  <div id="login-page">
    <div class="login-card">
      <div class="login-logo">
        <div class="brand-icon"><i class="fas fa-gem"></i></div>
        <h1>KISNA IMS</h1>
        <p>Inventory Management System</p>
      </div>
      <div class="form-group">
        <label for="loginId">Login ID</label>
        <input type="text" id="loginId" placeholder="Enter your login ID" autocomplete="username" />
      </div>
      <div class="form-group">
        <label for="loginPwd">Password</label>
        <input type="password" id="loginPwd" placeholder="Enter your password" autocomplete="current-password" />
      </div>
      <button class="btn-login" id="btn-do-login"><i class="fas fa-right-to-bracket"></i> Login</button>
      <div class="login-error" id="login-err"></div>
    </div>
  </div>`;

  const doLogin = async () => {
    const loginId = $('#loginId').value.trim();
    const password = $('#loginPwd').value.trim();
    if (!loginId || !password) { $('#login-err').textContent = 'Please enter login ID and password.'; return; }
    try {
      const r = await api('/api/login', { method: 'POST', body: { loginId, password } });
      State.user = r.user;
      renderLayout();
    } catch (e) {
      $('#login-err').textContent = e.message;
    }
  };
  $('#btn-do-login').onclick = doLogin;
  $('#loginPwd').onkeydown = e => { if (e.key === 'Enter') doLogin(); };
}

// -------- INIT --------
(async function init() {
  applyTheme(_themeMode()); // apply before any UI renders
  try {
    const s = await api('/api/session');
    if (s.loggedIn) { State.user = s.user; renderLayout(); }
    else renderLogin();
  } catch { renderLogin(); }
})();

// ─── ALERTS & NOTIFICATIONS SYSTEM ───────────────────────────────────────────
window._alertCache = { total: 0, pendingItems: [], pendingIVM: [], approvedItems: [], approvedIVM: [] };

window.refreshAlertBadge = async () => { await window._refreshAlertBadge(); };

window._refreshAlertBadge = async () => {
  try {
    const data = await api('/api/alerts');
    window._alertCache = data;
    const count = data.total || 0;
    const badge = document.getElementById('alert-badge');
    if (badge) {
      badge.textContent = count;
      badge.style.display = count > 0 ? 'inline' : 'none';
    }
  } catch (_) { /* silently fail */ }
};

window.showAlertsModal = async () => {
  await window._refreshAlertBadge();
  const d = window._alertCache;
  const sa = isSuperAdmin();
  let bodyHtml = '';

  if (sa) {
    const items = d.pendingItems || [];
    const ivm   = d.pendingIVM   || [];
    if (!items.length && !ivm.length) {
      bodyHtml = '<div style="text-align:center;padding:2rem;color:var(--text-secondary)"><i class="fas fa-inbox" style="font-size:2rem;margin-bottom:12px;opacity:.5"></i><p>No pending approvals.</p></div>';
    } else {
      if (items.length) {
        bodyHtml += '<div style="padding:8px 14px;font-size:11px;font-weight:700;letter-spacing:.6px;color:#f97316;background:rgba(249,115,22,.07);border-bottom:1px solid var(--border)">PENDING ITEMS (' + items.length + ')</div>';
        bodyHtml += items.map(function(r) {
          return '<div style="padding:12px 14px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;cursor:pointer" onclick="handleAlertClick(' + r.itemid + ',\'Item\')">' +
            '<div><div style="font-weight:600;margin-bottom:2px">' + (r.ItemName || 'Item #' + r.itemid) + '</div>' +
            '<div style="font-size:12px;color:var(--text-secondary)">By <strong>' + r.LastRequestedBy + '</strong></div></div>' +
            '<span style="font-size:11px;color:#f97316;white-space:nowrap;margin-left:12px"><i class="fas fa-chevron-right"></i> Review</span></div>';
        }).join('');
      }
      if (ivm.length) {
        bodyHtml += '<div style="padding:8px 14px;font-size:11px;font-weight:700;letter-spacing:.6px;color:#f97316;background:rgba(249,115,22,.07);border-bottom:1px solid var(--border)">PENDING IVM ENTRIES (' + ivm.length + ')</div>';
        bodyHtml += ivm.map(function(r) {
          return '<div style="padding:12px 14px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;cursor:pointer" onclick="handleAlertClick(' + r.ID + ',\'IVM\')">' +
            '<div><div style="font-weight:600;margin-bottom:2px">' + (r.ItemName || 'Item') + ' &harr; ' + (r.VendorName || 'Vendor') + '</div>' +
            '<div style="font-size:12px;color:var(--text-secondary)">By <strong>' + r.LastRequestedBy + '</strong></div></div>' +
            '<span style="font-size:11px;color:#f97316;white-space:nowrap;margin-left:12px"><i class="fas fa-chevron-right"></i> Review</span></div>';
        }).join('');
      }
    }
  } else {
    const ai = d.approvedItems || [];
    const av = d.approvedIVM   || [];
    if (!ai.length && !av.length) {
      bodyHtml = '<div style="text-align:center;padding:2rem;color:var(--text-secondary)"><i class="fas fa-check-circle" style="font-size:2rem;margin-bottom:12px;opacity:.5;color:#22c55e"></i><p>No new notifications.</p></div>';
    } else {
      if (ai.length) {
        bodyHtml += '<div style="padding:8px 14px;font-size:11px;font-weight:700;letter-spacing:.6px;color:#22c55e;background:rgba(34,197,94,.07);border-bottom:1px solid var(--border)">APPROVED ITEMS (' + ai.length + ')</div>';
        bodyHtml += ai.map(function(r) {
          return '<div style="padding:12px 14px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;cursor:pointer" onclick="handleAlertClick(' + r.itemid + ',\'Item\')">' +
            '<div><div style="font-weight:600;margin-bottom:2px">&#x2705; ' + (r.ItemName || 'Item #' + r.itemid) + '</div>' +
            '<div style="font-size:12px;color:var(--text-secondary)">Approved &amp; Activated by Super Admin</div></div>' +
            '<span style="font-size:11px;color:#22c55e;white-space:nowrap;margin-left:12px">View &rarr;</span></div>';
        }).join('');
      }
      if (av.length) {
        bodyHtml += '<div style="padding:8px 14px;font-size:11px;font-weight:700;letter-spacing:.6px;color:#22c55e;background:rgba(34,197,94,.07);border-bottom:1px solid var(--border)">APPROVED IVM ENTRIES (' + av.length + ')</div>';
        bodyHtml += av.map(function(r) {
          return '<div style="padding:12px 14px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;cursor:pointer" onclick="handleAlertClick(' + r.ID + ',\'IVM\')">' +
            '<div><div style="font-weight:600;margin-bottom:2px">&#x2705; ' + (r.ItemName || 'Item') + ' &harr; ' + (r.VendorName || 'Vendor') + '</div>' +
            '<div style="font-size:12px;color:var(--text-secondary)">Approved &amp; Activated by Super Admin</div></div>' +
            '<span style="font-size:11px;color:#22c55e;white-space:nowrap;margin-left:12px">View &rarr;</span></div>';
        }).join('');
      }
    }
  }

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML =
    '<div class="modal" style="max-width:520px;animation:slideUp 0.2s ease">' +
    '<div class="modal-header"><h3><i class="fas fa-bell" style="color:var(--accent);margin-right:8px"></i>' +
    (sa ? 'Pending Approvals' : 'Notifications') + '</h3>' +
    '<button class="btn-close-modal" onclick="this.closest(\'.modal-overlay\').remove()"><i class="fas fa-xmark"></i></button></div>' +
    '<div class="modal-body" style="padding:0;max-height:460px;overflow-y:auto">' + bodyHtml + '</div></div>';
  document.body.appendChild(overlay);
  overlay.onclick = function(e) { if (e.target === overlay) overlay.remove(); };

  // Auto-dismiss Admin's notifications on open
  if (!sa) {
    var ai = d.approvedItems || [];
    var av = d.approvedIVM   || [];
    var itemIds = ai.map(function(r) { return r.itemid; });
    var ivmIds  = av.map(function(r) { return r.ID; });
    if (itemIds.length || ivmIds.length) {
      api('/api/alerts/dismiss', { method: 'POST', body: { itemIds: itemIds, ivmIds: ivmIds } })
        .then(function() { window._refreshAlertBadge(); }).catch(function() {});
    }
  }
};

window.handleAlertClick = function(id, type) {
  var ov = document.querySelector('.modal-overlay');
  if (ov) ov.remove();
  if (type === 'Item') {
    navigateTo('items');
    setTimeout(function() {
      var search = document.getElementById('item-search');
      if (search) { search.value = id; search.dispatchEvent(new Event('input')); }
    }, 600);
  } else {
    navigateTo('item-vendor-map');
    setTimeout(function() {
      var search = document.getElementById('map-search') || document.getElementById('ivm-search');
      if (search) { search.value = id; search.dispatchEvent(new Event('input')); }
    }, 600);
  }
};

// Auto-refresh alerts every 60 seconds
setInterval(function() { if (window.refreshAlertBadge) window.refreshAlertBadge(); }, 60000);
