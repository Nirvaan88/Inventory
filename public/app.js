/* =============================================
   KISNA INVENTORY &#8211; Single Page Application
   ============================================= */

// -------- STATE --------
window.isSuperAdmin = function() { return (State.user?.roleName || '').toLowerCase() === 'super admin'; };
window.isAdmin = function() { return (State.user?.roleName || '').toLowerCase() === 'admin'; };

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
      <div style="display:flex; gap:8px; margin-left:auto;">
        <button id="btn-alerts-toggle" class="sidebar-theme-btn"
                onclick="showAlertsModal()" title="Alerts" style="position:relative; margin-left:0; color: #a1a1aa;">
          <i class="fas fa-bell"></i>
          <span id="alert-badge" style="position:absolute; top:-2px; right:-2px; background:var(--danger); color:#fff; font-size:9px; border-radius:50%; padding:1px 4px; display:none;">0</span>
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
      <div class="nav-item" data-page="user-master"><i class="fas fa-users-gear"></i> User Master</div>
      <div class="nav-item" data-page="role-master"><i class="fas fa-user-cog"></i> Role Master</div>

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
    // TODO: Later the user will specify what exactly to hide.
    // For now, show everything to Admin.
    
    // $$('.nav-item[data-page="role-master"], .nav-item[data-page="user-master"]').forEach(el => el.style.display = 'none');
    // $$('.nav-subsection-title').forEach(el => { if(el.textContent.includes('AI Insights')) el.style.display = 'none'; });
    // $$('.nav-item[data-page="dead-stock"], .nav-item[data-page="vendor-scorecard"]').forEach(el => el.style.display = 'none');
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
      <div class="form-group" style="position:relative;">
        <label for="loginPwd">Password</label>
        <input type="password" id="loginPwd" placeholder="Enter your password" autocomplete="current-password" style="padding-right:36px;" />
        <i class="fas fa-eye" id="toggle-pwd" style="position:absolute; right:12px; bottom:13px; cursor:pointer; color:var(--text-muted);" title="Toggle Password Visibility"></i>
      </div>
      <div style="text-align: right; margin-bottom: 16px;">
        <a href="#" id="btn-forgot-pwd" style="font-size: 13px; color: var(--accent); text-decoration: none;">Forgot Password?</a>
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
  
  $('#toggle-pwd').onclick = function() {
    const pwdInput = $('#loginPwd');
    if (pwdInput.type === 'password') {
      pwdInput.type = 'text';
      this.className = 'fas fa-eye-slash';
    } else {
      pwdInput.type = 'password';
      this.className = 'fas fa-eye';
    }
  };
  
  $('#btn-forgot-pwd').onclick = (e) => {
    e.preventDefault();
    showForgotPasswordModal();
  };
}

// -------- INIT --------
(async function init() {
  applyTheme(_themeMode()); // apply before any UI renders
  try {
    const s = await api('/api/session');
    if (s.loggedIn) { State.user = s.user; renderLayout(); _refreshAlertBadge(); }
    else renderLogin();
  } catch { renderLogin(); }
})();


function showForgotPasswordModal() {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal" style="max-width:400px;animation:slideUp 0.2s ease">
      <div class="modal-header">
        <h3><i class="fas fa-key" style="color:var(--accent);margin-right:8px"></i> Forgot Password</h3>
        <button class="btn-close-modal" onclick="this.closest('.modal-overlay').remove()"><i class="fas fa-xmark"></i></button>
      </div>
      <div class="modal-body" id="fp-body">
        <div class="form-field" style="margin-bottom:14px">
          <label>User Name <span style="color:var(--danger)">*</span></label>
          <input type="text" id="fp-username" placeholder="Enter your User Name" style="background:var(--bg-dark);border:1px solid var(--border);border-radius:6px;padding:8px 12px;color:var(--text-primary);width:100%;">
        </div>
        <button class="btn btn-primary" id="btn-fp-next" style="width:100%">Next <i class="fas fa-arrow-right"></i></button>
        <div id="fp-err" style="color:var(--danger);font-size:13px;margin-top:10px;text-align:center"></div>
      </div>
    </div>`;
  document.body.appendChild(overlay);

  let currentUserName = '';
  let securityQtn = '';

  $('#btn-fp-next', overlay).onclick = async () => {
    const un = $('#fp-username', overlay).value.trim();
    if (!un) return ($('#fp-err', overlay).textContent = 'User Name is required');
    $('#fp-err', overlay).textContent = '';
    const btn = $('#btn-fp-next', overlay);
    const orig = btn.innerHTML;
    btn.innerHTML = '<div class="spinner" style="width:16px;height:16px;margin:0 auto"></div>';
    try {
      const res = await fetch('/api/users/forgot-password/init', { method: 'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({UserName: un})});
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      currentUserName = un;
      securityQtn = data.SecurityQtn || '';
      $('#fp-body', overlay).innerHTML = `
        <div style="font-size:13px;margin-bottom:16px;color:var(--text-secondary)">User: <strong>${currentUserName}</strong></div>
        <div class="form-field" style="margin-bottom:14px">
          <label>Security Question</label>
          <input type="text" value="${securityQtn}" disabled style="background:var(--bg-dark);border:1px dashed var(--border);border-radius:6px;padding:8px 12px;color:var(--text-muted);width:100%;">
        </div>
        <div class="form-field" style="margin-bottom:14px">
          <label>Your Answer <span style="color:var(--danger)">*</span></label>
          <input type="text" id="fp-answer" placeholder="Enter your answer" style="background:var(--bg-dark);border:1px solid var(--border);border-radius:6px;padding:8px 12px;color:var(--text-primary);width:100%;">
        </div>
        <button class="btn btn-primary" id="btn-fp-verify" style="width:100%">Verify Answer <i class="fas fa-check"></i></button>
        <div id="fp-err" style="color:var(--danger);font-size:13px;margin-top:10px;text-align:center"></div>`;
      $('#btn-fp-verify', overlay).onclick = async () => {
        const ans = $('#fp-answer', overlay).value.trim();
        if (!ans) return ($('#fp-err', overlay).textContent = 'Answer is required');
        try {
          const vRes = await fetch('/api/users/forgot-password/verify', { method: 'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({UserName: currentUserName, SecurityQtn: securityQtn, Answer: ans})});
          const vData = await vRes.json();
          if (!vRes.ok) throw new Error(vData.error || 'Invalid answer');
          $('#fp-body', overlay).innerHTML = `
            <div class="form-field" style="margin-bottom:14px">
              <label>New Password <span style="color:var(--danger)">*</span></label>
              <input type="password" id="fp-new-pwd" placeholder="Enter new password" style="background:var(--bg-dark);border:1px solid var(--border);border-radius:6px;padding:8px 12px;color:var(--text-primary);width:100%;">
            </div>
            <div class="form-field" style="margin-bottom:14px">
              <label>Confirm Password <span style="color:var(--danger)">*</span></label>
              <input type="password" id="fp-confirm-pwd" placeholder="Confirm new password" style="background:var(--bg-dark);border:1px solid var(--border);border-radius:6px;padding:8px 12px;color:var(--text-primary);width:100%;">
            </div>
            <button class="btn btn-success" id="btn-fp-reset" style="width:100%">Reset Password <i class="fas fa-save"></i></button>
            <div id="fp-err" style="color:var(--danger);font-size:13px;margin-top:10px;text-align:center"></div>`;
          $('#btn-fp-reset', overlay).onclick = async () => {
            const np = $('#fp-new-pwd', overlay).value.trim();
            const cp = $('#fp-confirm-pwd', overlay).value.trim();
            if (!np || !cp) return ($('#fp-err', overlay).textContent = 'Both fields required');
            if (np !== cp) return ($('#fp-err', overlay).textContent = 'Passwords do not match');
            try {
              const rRes = await fetch('/api/users/forgot-password/reset', { method: 'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({UserName: currentUserName, NewPassword: np})});
              if (!rRes.ok) throw new Error('Reset failed');
              overlay.remove();
              showToast('Password reset successfully! Please login.', 'success');
            } catch (ee) { $('#fp-err', overlay).textContent = ee.message; }
          };
        } catch (e) { $('#fp-err', overlay).textContent = e.message; }
      };
    } catch (e) {
      btn.innerHTML = orig;
      $('#fp-err', overlay).textContent = e.message;
    }
  };
}

window.showAlertsModal = () => {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal" style="max-width:500px; animation:slideUp 0.2s ease;">
      <div class="modal-header">
        <h3><i class="fas fa-bell" style="color:var(--accent); margin-right:8px;"></i> Alerts & Pending Approvals</h3>
        <button class="btn-close-modal" onclick="this.closest('.modal-overlay').remove()"><i class="fas fa-xmark"></i></button>
      </div>
      <div class="modal-body">
        <div style="text-align:center; padding: 2rem; color: var(--text-secondary)">
          <i class="fas fa-inbox" style="font-size:2rem; margin-bottom:12px; opacity:0.5;"></i>
          <p>No alerts or pending approvals currently.</p>
        </div>
      </div>
    </div>`;
  document.body.appendChild(overlay);
};
