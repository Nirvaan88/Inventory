/* =============================================
   KISNA IMS — Activity Logs Page
   Visible to Super Admin only
   ============================================= */

registerPage('activity-logs', () => {
  return `${pageHeader('Activity Logs', 'fa-clock-rotate-left', 'Overview / Activity Logs')}
  <div class="card" style="margin-bottom:16px">
    <div style="display:flex;flex-wrap:wrap;gap:12px;align-items:flex-end">
      <!-- Search -->
      <div class="search-input-wrap" style="flex:1;min-width:200px">
        <i class="fas fa-search"></i>
        <input type="text" id="log-search" placeholder="Search description..." style="min-width:180px">
      </div>
      <!-- Module filter -->
      <div style="display:flex;flex-direction:column;gap:4px">
        <label style="font-size:11px;color:var(--text-secondary);font-weight:600;text-transform:uppercase;letter-spacing:.5px">Module</label>
        <select id="log-filter-module" style="background:var(--bg-dark);border:1px solid var(--border);border-radius:8px;padding:8px 12px;color:var(--text-primary);font-size:13px;min-width:160px">
          <option value="">All Modules</option>
        </select>
      </div>
      <!-- Action filter -->
      <div style="display:flex;flex-direction:column;gap:4px">
        <label style="font-size:11px;color:var(--text-secondary);font-weight:600;text-transform:uppercase;letter-spacing:.5px">Action</label>
        <select id="log-filter-action" style="background:var(--bg-dark);border:1px solid var(--border);border-radius:8px;padding:8px 12px;color:var(--text-primary);font-size:13px;min-width:130px">
          <option value="">All Actions</option>
          <option value="LOGIN">Login</option>
          <option value="LOGOUT">Logout</option>
          <option value="CREATE">Create</option>
          <option value="UPDATE">Update</option>
          <option value="DELETE">Delete</option>
          <option value="APPROVE">Approve</option>
          <option value="EXPORT">Export</option>
        </select>
      </div>
      <!-- User filter -->
      <div style="display:flex;flex-direction:column;gap:4px">
        <label style="font-size:11px;color:var(--text-secondary);font-weight:600;text-transform:uppercase;letter-spacing:.5px">User</label>
        <input type="text" id="log-filter-user" placeholder="Username..." style="background:var(--bg-dark);border:1px solid var(--border);border-radius:8px;padding:8px 12px;color:var(--text-primary);font-size:13px;min-width:120px">
      </div>
      <!-- Date From -->
      <div style="display:flex;flex-direction:column;gap:4px">
        <label style="font-size:11px;color:var(--text-secondary);font-weight:600;text-transform:uppercase;letter-spacing:.5px">From</label>
        <input type="date" id="log-filter-from" style="background:var(--bg-dark);border:1px solid var(--border);border-radius:8px;padding:8px 12px;color:var(--text-primary);font-size:13px">
      </div>
      <!-- Date To -->
      <div style="display:flex;flex-direction:column;gap:4px">
        <label style="font-size:11px;color:var(--text-secondary);font-weight:600;text-transform:uppercase;letter-spacing:.5px">To</label>
        <input type="date" id="log-filter-to" style="background:var(--bg-dark);border:1px solid var(--border);border-radius:8px;padding:8px 12px;color:var(--text-primary);font-size:13px">
      </div>
      <!-- Buttons -->
      <div style="display:flex;gap:8px;padding-bottom:1px">
        <button class="btn btn-primary" id="btn-log-search" style="height:38px;padding:0 18px">
          <i class="fas fa-search"></i> Search
        </button>
        <button class="btn btn-secondary" id="btn-log-reset" style="height:38px;padding:0 14px" title="Reset filters">
          <i class="fas fa-rotate"></i> Reset
        </button>
        <button class="btn btn-secondary" id="btn-log-export" style="height:38px;padding:0 14px" title="Export to Excel">
          <i class="fas fa-file-excel"></i> Export
        </button>
      </div>
    </div>
  </div>

  <!-- Summary bar -->
  <div id="log-summary-bar" style="display:flex;gap:20px;margin-bottom:12px;font-size:13px;color:var(--text-secondary)">
    <span id="log-total-info"></span>
  </div>

  <div class="card" style="padding:0;overflow:hidden">
    <div class="table-wrapper">
      <table id="tbl-logs" style="min-width:900px">
        <thead>
          <tr>
            <th style="width:50px;text-align:center">#</th>
            <th style="width:160px">Timestamp</th>
            <th style="width:110px">User</th>
            <th style="width:100px">Role</th>
            <th style="width:90px;text-align:center">Action</th>
            <th style="width:160px">Module</th>
            <th>Description</th>
            <th style="width:110px">IP Address</th>
          </tr>
        </thead>
        <tbody id="tbl-logs-body">
          <tr class="empty-row"><td colspan="8"><div class="spinner" style="margin:0 auto"></div></td></tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- Pagination -->
  <div id="log-pagination" style="display:flex;align-items:center;justify-content:center;gap:10px;margin-top:16px;font-size:13px"></div>`;
});

// ── State ──────────────────────────────────────────────────────────────────────
let _logPage = 1;
let _logData = null;

// ── Action badge colors ────────────────────────────────────────────────────────
function _logActionBadge(action) {
  const cfg = {
    CREATE:   { bg: 'rgba(34,197,94,.15)',  color: '#16a34a', icon: 'fa-plus-circle' },
    UPDATE:   { bg: 'rgba(59,130,246,.15)', color: '#2563eb', icon: 'fa-pen' },
    DELETE:   { bg: 'rgba(239,68,68,.15)',  color: '#dc2626', icon: 'fa-trash' },
    APPROVE:  { bg: 'rgba(139,92,246,.15)', color: '#7c3aed', icon: 'fa-check-circle' },
    EXPORT:   { bg: 'rgba(245,158,11,.15)', color: '#d97706', icon: 'fa-file-export' },
    LOGIN:    { bg: 'rgba(20,184,166,.15)', color: '#0d9488', icon: 'fa-right-to-bracket' },
    LOGOUT:   { bg: 'rgba(107,114,128,.15)',color: '#6b7280', icon: 'fa-right-from-bracket' },
  };
  const c = cfg[action] || { bg: 'rgba(107,114,128,.12)', color: 'var(--text-secondary)', icon: 'fa-circle-info' };
  return `<span style="display:inline-flex;align-items:center;gap:5px;background:${c.bg};color:${c.color};
    border-radius:20px;padding:3px 10px;font-size:11px;font-weight:700;letter-spacing:.4px">
    <i class="fas ${c.icon}"></i> ${action}
  </span>`;
}

// ── Load logs ─────────────────────────────────────────────────────────────────
async function loadActivityLogs(page = 1) {
  _logPage = page;
  const tbody = $('#tbl-logs-body');
  if (!tbody) return;
  tbody.innerHTML = `<tr class="empty-row"><td colspan="8"><div class="spinner" style="margin:0 auto"></div></td></tr>`;

  const params = new URLSearchParams();
  params.set('page', page);
  params.set('limit', 50);

  const mod    = $('#log-filter-module')?.value;
  const action = $('#log-filter-action')?.value;
  const user   = $('#log-filter-user')?.value?.trim();
  const from   = $('#log-filter-from')?.value;
  const to     = $('#log-filter-to')?.value;
  const search = $('#log-search')?.value?.trim();

  if (mod)    params.set('module', mod);
  if (action) params.set('action', action);
  if (user)   params.set('user', user);
  if (from)   params.set('from', from);
  if (to)     params.set('to', to);
  if (search) params.set('search', search);

  try {
    const data = await api(`/api/activity-logs?${params.toString()}`);
    _logData = data;

    // Populate module dropdown (only on first load or reset)
    const sel = $('#log-filter-module');
    if (sel && data.modules && sel.options.length <= 1) {
      data.modules.forEach(m => {
        const o = document.createElement('option');
        o.value = m; o.textContent = m;
        sel.appendChild(o);
      });
    }

    // Summary bar
    const summary = $('#log-total-info');
    if (summary) {
      const total = data.total ?? 0;
      const from  = ((page - 1) * 50) + 1;
      const to    = Math.min(page * 50, total);
      summary.textContent = total > 0
        ? `Showing ${from}–${to} of ${total.toLocaleString()} log entries`
        : 'No log entries found';
    }

    if (!data.logs || !data.logs.length) {
      tbody.innerHTML = `<tr class="empty-row"><td colspan="8" style="text-align:center;padding:30px">No logs found for the selected filters.</td></tr>`;
      renderLogPagination(data);
      return;
    }

    tbody.innerHTML = data.logs.map((log, idx) => {
      const rowNum = (page - 1) * 50 + idx + 1;
      return `<tr>
        <td style="text-align:center;color:var(--text-secondary);font-size:12px">${rowNum}</td>
        <td style="font-size:12px;color:var(--text-secondary);white-space:nowrap">${log.LoggedAt}</td>
        <td style="font-weight:600;font-size:13px">${log.UserName || '—'}</td>
        <td style="font-size:12px;color:var(--text-secondary)">${log.RoleName || '—'}</td>
        <td style="text-align:center">${_logActionBadge(log.Action)}</td>
        <td style="font-size:13px">${log.Module || '—'}</td>
        <td style="font-size:13px;color:var(--text-primary)">${log.Description || '—'}</td>
        <td style="font-size:11px;color:var(--text-muted);font-family:monospace">${log.IPAddress || '—'}</td>
      </tr>`;
    }).join('');

    renderLogPagination(data);
  } catch (e) {
    tbody.innerHTML = `<tr class="empty-row"><td colspan="8" style="color:var(--danger);text-align:center;padding:20px">
      <i class="fas fa-circle-xmark"></i> Failed to load logs: ${e.message}</td></tr>`;
  }
}

// ── Pagination ────────────────────────────────────────────────────────────────
function renderLogPagination(data) {
  const pg = $('#log-pagination');
  if (!pg) return;
  if (data.pages <= 1) { pg.innerHTML = ''; return; }

  const { page, pages } = data;
  let html = '';

  html += `<button class="btn btn-secondary" style="padding:5px 12px;font-size:12px" ${page <= 1 ? 'disabled' : ''}
    onclick="loadActivityLogs(${page - 1})"><i class="fas fa-chevron-left"></i></button>`;

  const start = Math.max(1, page - 2);
  const end   = Math.min(pages, page + 2);

  if (start > 1) html += `<button class="btn btn-secondary" style="padding:5px 12px;font-size:12px" onclick="loadActivityLogs(1)">1</button>
    ${start > 2 ? '<span style="color:var(--text-secondary)">…</span>' : ''}`;

  for (let p = start; p <= end; p++) {
    html += `<button class="btn ${p === page ? 'btn-primary' : 'btn-secondary'}" style="padding:5px 12px;font-size:12px"
      onclick="loadActivityLogs(${p})">${p}</button>`;
  }

  if (end < pages) {
    html += `${end < pages - 1 ? '<span style="color:var(--text-secondary)">…</span>' : ''}
    <button class="btn btn-secondary" style="padding:5px 12px;font-size:12px" onclick="loadActivityLogs(${pages})">${pages}</button>`;
  }

  html += `<button class="btn btn-secondary" style="padding:5px 12px;font-size:12px" ${page >= pages ? 'disabled' : ''}
    onclick="loadActivityLogs(${page + 1})"><i class="fas fa-chevron-right"></i></button>`;

  html += `<span style="color:var(--text-secondary);margin-left:6px">Page ${page} of ${pages}</span>`;
  pg.innerHTML = html;
}

// ── Wire events after DOM is ready ────────────────────────────────────────────
(function _wireActivityLogs() {
  const interval = setInterval(() => {
    if (!$('#tbl-logs-body')) return; // page not yet rendered
    clearInterval(interval);

    // Bind search/filter buttons
    $('#btn-log-search')?.addEventListener('click', () => loadActivityLogs(1));
    $('#btn-log-reset')?.addEventListener('click', () => {
      $('#log-filter-module').value = '';
      $('#log-filter-action').value = '';
      $('#log-filter-user').value = '';
      $('#log-filter-from').value = '';
      $('#log-filter-to').value = '';
      $('#log-search').value = '';
      // Clear module options (except "All")
      const sel = $('#log-filter-module');
      while (sel.options.length > 1) sel.remove(1);
      loadActivityLogs(1);
    });
    $('#log-search')?.addEventListener('keydown', e => { if (e.key === 'Enter') loadActivityLogs(1); });

    // Export
    $('#btn-log-export')?.addEventListener('click', async () => {
      if (!_logData || !_logData.logs) return;
      try {
        // Fetch all matching logs for export (no pagination)
        const params = new URLSearchParams({ page: 1, limit: 9999 });
        const mod    = $('#log-filter-module')?.value;
        const action = $('#log-filter-action')?.value;
        const user   = $('#log-filter-user')?.value?.trim();
        const from   = $('#log-filter-from')?.value;
        const to     = $('#log-filter-to')?.value;
        const search = $('#log-search')?.value?.trim();
        if (mod)    params.set('module', mod);
        if (action) params.set('action', action);
        if (user)   params.set('user', user);
        if (from)   params.set('from', from);
        if (to)     params.set('to', to);
        if (search) params.set('search', search);
        const data = await api(`/api/activity-logs?${params.toString()}`);
        if (!data.logs || !data.logs.length) return showToast('No data to export.', 'info');
        const rows = data.logs.map(l => ({
          '#': l.LogID, Timestamp: l.LoggedAt, User: l.UserName, Role: l.RoleName,
          Action: l.Action, Module: l.Module, Description: l.Description, IP: l.IPAddress
        }));
        // Use XLSX from backend – simple CSV fallback
        const headers = Object.keys(rows[0]);
        const csvLines = [headers.join(','), ...rows.map(r => headers.map(h => `"${(r[h]||'').toString().replace(/"/g,'""')}"`).join(','))];
        const blob = new Blob([csvLines.join('\n')], { type: 'text/csv' });
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href = url;
        a.download = `activity_logs_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        showToast(`Exported ${rows.length} log entries.`, 'success');
      } catch(e) { showToast('Export failed: ' + e.message, 'error'); }
    });

    // Initial load
    loadActivityLogs(1);
  }, 100);
})();
