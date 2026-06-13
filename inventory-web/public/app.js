/* =============================================
   KISNA INVENTORY – Single Page Application
   ============================================= */

// -------- STATE --------
const State = {
  user: null,
  currentPage: 'dashboard',
  data: {}
};

// -------- UTILS --------
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

// -------- ROUTER --------
const pages = {};
function registerPage(name, fn) { pages[name] = fn; }

function navigateTo(page) {
  State.currentPage = page;
  $$('.nav-item').forEach(el => el.classList.toggle('active', el.dataset.page === page));
  const area = $('#content-area');
  if (!area) return;
  area.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
  Promise.resolve(pages[page] ? pages[page]() : renderNotFound())
    .then(html => { area.innerHTML = html || ''; bindPage(page); })
    .catch(err => { area.innerHTML = `<div class="content-body"><div class="card" style="color:var(--danger)">${err.message}</div></div>`; });
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
    <div id="main-layout">
      ${renderSidebar()}
      <div id="content-area"></div>
    </div>
    <div id="toast-container" class="toast-container"></div>`;
  bindSidebar();
  navigateTo('dashboard');
}

function renderSidebar() {
  const initials = (State.user?.loginId || 'U').substring(0, 2).toUpperCase();
  return `
  <aside id="sidebar">
    <div class="sidebar-header">
      <div class="logo-icon"><i class="fas fa-gem"></i></div>
      <div><div class="brand-name">KISNA</div><div class="brand-sub">Inventory System</div></div>
    </div>
    <nav class="sidebar-nav">
      <div class="nav-section-title">Overview</div>
      <div class="nav-item active" data-page="dashboard"><i class="fas fa-chart-pie"></i> Dashboard</div>

      <div class="nav-section-title">Masters</div>
      <div class="nav-item" data-page="divisions"><i class="fas fa-layer-group"></i> Division</div>
      <div class="nav-item" data-page="departments"><i class="fas fa-building"></i> Department</div>
      <div class="nav-item" data-page="categories"><i class="fas fa-tags"></i> Product Category</div>
      <div class="nav-item" data-page="states"><i class="fas fa-map"></i> State / City</div>
      <div class="nav-item" data-page="items"><i class="fas fa-box"></i> Item Master</div>
      <div class="nav-item" data-page="vendors"><i class="fas fa-truck"></i> Vendor Details</div>
      <div class="nav-item" data-page="dealers"><i class="fas fa-store"></i> Dealer Master</div>
      <div class="nav-item" data-page="couriers"><i class="fas fa-motorcycle"></i> Courier Details</div>
      <div class="nav-item" data-page="kit-master"><i class="fas fa-cubes"></i> Kit Master</div>
      <div class="nav-item" data-page="item-vendor-map"><i class="fas fa-link"></i> Item–Vendor Mapping</div>
      <div class="nav-item" data-page="kisna-region"><i class="fas fa-globe-asia"></i> Kisna Region State</div>
      <div class="nav-item" data-page="login-master"><i class="fas fa-key"></i> Login Master</div>
      <div class="nav-item" data-page="user-master"><i class="fas fa-users-gear"></i> User Master</div>

      <div class="nav-section-title">Transactions</div>
      <div class="nav-item" data-page="purchase-inward"><i class="fas fa-arrow-down-to-bracket"></i> Purchase Inward</div>
      <div class="nav-item" data-page="issue-items"><i class="fas fa-arrow-up-from-bracket"></i> Issue Items</div>
      <div class="nav-item" data-page="issue-return"><i class="fas fa-rotate-left"></i> Issue Return</div>
      <div class="nav-item" data-page="orders"><i class="fas fa-file-invoice"></i> Order Items</div>
      <div class="nav-item" data-page="inward-return-pending"><i class="fas fa-clock-rotate-left"></i> Inward Return Pending</div>
      <div class="nav-item" data-page="issue-return-pending"><i class="fas fa-triangle-exclamation"></i> Return Issue Pending</div>
      <div class="nav-item" data-page="issue-pending"><i class="fas fa-hourglass-half"></i> Issue Pending Items</div>

      <div class="nav-section-title">Reports</div>
      <div class="nav-item" data-page="report-stock"><i class="fas fa-warehouse"></i> Item Stock Report</div>
      <div class="nav-item" data-page="report-transactions"><i class="fas fa-receipt"></i> Transactions Report</div>
      <div class="nav-item" data-page="report-inward-pricing"><i class="fas fa-indian-rupee-sign"></i> Inward Pricing</div>
      <div class="nav-item" data-page="report-stock-division"><i class="fas fa-chart-bar"></i> Stock Division-Wise</div>
      <div class="nav-item" data-page="challan"><i class="fas fa-file-lines"></i> Generate Challan</div>
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

function bindSidebar() {
  $$('.nav-item').forEach(el => {
    el.onclick = () => navigateTo(el.dataset.page);
  });
  $('#btn-logout').onclick = async () => {
    await api('/api/logout', { method: 'POST' });
    State.user = null;
    renderLogin();
  };
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
  try {
    const s = await api('/api/session');
    if (s.loggedIn) { State.user = s.user; renderLayout(); }
    else renderLogin();
  } catch { renderLogin(); }
})();
