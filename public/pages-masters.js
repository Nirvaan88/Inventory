/* ================================================
   PAGES: Dashboard + All Master Pages
   ================================================ */

// -------- HELPERS: Generic CRUD table --------
function pageHeader(title, icon, breadcrumb, btnHtml = '') {
  return `<div class="content-header">
    <div><h2><i class="fas ${icon}" style="color:var(--accent);margin-right:8px"></i>${title}</h2>
    <div class="breadcrumb">${breadcrumb}</div></div>
    <div class="btn-bar">${btnHtml}</div>
  </div><div class="content-body">`;
}

function simpleMasterPage(title, icon, breadcrumb, colDefs, addBtnId, tableId) {
  return `${pageHeader(title, icon, breadcrumb,
    `<button class="btn btn-primary" id="${addBtnId}"><i class="fas fa-plus"></i> Add New</button>`)}
  <div class="card">
    <div class="search-bar">
      <div class="search-input-wrap"><i class="fas fa-search"></i>
        <input type="text" id="tbl-search-${tableId}" placeholder="Search...">
      </div>
    </div>
    <div class="table-wrapper">
      <table id="${tableId}">
        <thead><tr>${colDefs.map(c => `<th>${c.label}</th>`).join('')}<th>Actions</th></tr></thead>
        <tbody id="${tableId}-body"><tr class="empty-row"><td colspan="${colDefs.length + 1}">Loading...</td></tr></tbody>
      </table>
    </div>
  </div></div>`;
}

function bindTableSearch(inputId, tbodyId) {
  const inp = $(`#${inputId}`);
  if (!inp) return;
  inp.oninput = () => {
    const q = inp.value.toLowerCase();
    $$(`#${tbodyId} tr:not(.empty-row)`).forEach(tr => {
      tr.style.display = tr.textContent.toLowerCase().includes(q) ? '' : 'none';
    });
  };
}

// -------- DASHBOARD --------
registerPage('dashboard', async () => {
  const [items, vendors, dealers, issues, inward, deadStock] = await Promise.all([
    api('/api/items').catch(() => []),
    api('/api/vendors').catch(() => []),
    api('/api/dealers').catch(() => []),
    api('/api/issues').catch(() => []),
    api('/api/inward').catch(() => []),
    api('/api/dead-stock?days=90').catch(() => []),
  ]);

  const lowStock = (items || []).filter(i => (i.Stock || 0) <= (i.ReorderLevel || 0));
  const ds = deadStock || [];
  const dsValue = ds.reduce((s, i) => s + (Number(i.LockedValue) || 0), 0);
  const fmtCur = n => '₹' + Number(n).toLocaleString('en-IN', { maximumFractionDigits: 0 });
  const isSuperAdmin = (State.user && State.user.roleName && ['super admin', 'superadmin'].includes(State.user.roleName.toLowerCase()));


  return `${pageHeader('Dashboard', 'fa-chart-pie', 'Home / Dashboard')}
  <div class="stats-grid">
    <div class="stat-card"><div class="stat-icon gold"><i class="fas fa-box"></i></div>
      <div><div class="stat-value">${(items || []).length}</div><div class="stat-label">Total Items</div></div></div>
    <div class="stat-card"><div class="stat-icon blue"><i class="fas fa-truck"></i></div>
      <div><div class="stat-value">${(vendors || []).length}</div><div class="stat-label">Vendors</div></div></div>
    <div class="stat-card"><div class="stat-icon green"><i class="fas fa-store"></i></div>
      <div><div class="stat-value">${(dealers || []).length}</div><div class="stat-label">Dealers</div></div></div>
    <div class="stat-card"><div class="stat-icon red"><i class="fas fa-arrow-up-from-bracket"></i></div>
      <div><div class="stat-value">${(issues || []).length}</div><div class="stat-label">Issue Transactions</div></div></div>
    <div class="stat-card"><div class="stat-icon purple"><i class="fas fa-box-open"></i></div>
      <div><div class="stat-value">${(inward || []).length}</div><div class="stat-label">Inward Transactions</div></div></div>
    <div class="stat-card"><div class="stat-icon red"><i class="fas fa-triangle-exclamation"></i></div>
      <div><div class="stat-value">${lowStock.length}</div><div class="stat-label">Low Stock Items</div></div></div>
    ${isSuperAdmin ? `
<!-- Dead Stock stat card -->
    <div class="stat-card" style="cursor:pointer;border-color:${ds.length ? 'rgba(139,92,246,.35)' : 'var(--border)'}"
         onclick="document.getElementById('dash-dead-stock-section')?.scrollIntoView({behavior:'smooth'})"
         title="View Dead Stock Details">
      <div class="stat-icon" style="background:rgba(139,92,246,.15);color:#7c3aed">
        <i class="fas fa-skull"></i>
      </div>
      <div>
        <div class="stat-value" style="color:${ds.length ? '#7c3aed' : 'var(--text-primary)'}">${ds.length}</div>
        <div class="stat-label">Dead Stock Items</div>
        ${ds.length ? `<div style="font-size:10.5px;color:#7c3aed;margin-top:2px;font-weight:600">${fmtCur(dsValue)} locked</div>` : ''}
      </div>
    </div>
` : ''}
  </div>

  ${lowStock.length > 0 ? `
  <div class="card">
    <div class="card-title"><i class="fas fa-triangle-exclamation"></i> Low Stock Alert</div>
    <div class="table-wrapper"><table>
      <thead><tr><th>Item Name</th><th>Stock</th><th>Reorder Level</th><th>Reorder Qty</th></tr></thead>
      <tbody>
        ${lowStock.map(i => `<tr>
          <td>${i.ItemName}</td>
          <td><span class="badge badge-danger">${i.Stock || 0}</span></td>
          <td>${i.ReorderLevel || 0}</td>
          <td>${i.ReorderQty || 0}</td>
        </tr>`).join('')}
      </tbody>
    </table></div>
  </div>` : ''}

  <!-- ── Dead Stock Widget ─────────────────────────────────────────── -->
  ${isSuperAdmin && ds.length > 0 ? `
  <div class="card" id="dash-dead-stock-section"
       style="border-color:rgba(139,92,246,.25);background:var(--bg-card)">
    <!-- Header -->
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;flex-wrap:wrap;gap:10px">
      <div style="display:flex;align-items:center;gap:10px">
        <div style="width:38px;height:38px;background:rgba(139,92,246,.15);border-radius:9px;
                    display:flex;align-items:center;justify-content:center;font-size:17px;color:#7c3aed">
          <i class="fas fa-skull"></i>
        </div>
        <div>
          <div style="font-weight:700;font-size:14px;color:var(--text-primary)">
            Dead Stock Alert
            <span style="margin-left:8px;padding:2px 9px;background:rgba(139,92,246,.15);
                         color:#7c3aed;border-radius:10px;font-size:11px">${ds.length} items</span>
          </div>
          <div style="font-size:11.5px;color:var(--text-muted);margin-top:2px">
            Items with stock &gt; 0 but <strong>no issues in the last 90 days</strong>
          </div>
        </div>
      </div>
      <!-- Total locked value badge -->
      <div style="background:rgba(139,92,246,.1);border:1px solid rgba(139,92,246,.25);
                  border-radius:10px;padding:10px 18px;text-align:center">
        <div style="font-size:10px;color:var(--text-muted);text-transform:uppercase;letter-spacing:.8px">Total Capital Locked</div>
        <div style="font-size:22px;font-weight:800;color:#7c3aed">${fmtCur(dsValue)}</div>
      </div>
    </div>

    <!-- Table (top 10 on dashboard) -->
    <div class="table-wrapper">
      <table>
        <thead><tr>
          <th>#</th>
          <th>Item Name</th>
          <th>Category</th>
          <th>Division</th>
          <th style="text-align:right">Stock</th>
          <th>UOM</th>
          <th style="text-align:right">Sell Price</th>
          <th style="text-align:right">Locked Value</th>
          <th style="text-align:center">Last Issued</th>
          <th style="text-align:center">Days Idle</th>
        </tr></thead>
        <tbody>
          ${ds.slice(0, 10).map((r, i) => {
            const lastDate = r.LastIssueDate
              ? new Date(r.LastIssueDate).toLocaleDateString('en-IN')
              : '<em style="color:var(--text-muted)">Never</em>';
            const idle = r.DaysSinceLastIssue != null ? r.DaysSinceLastIssue : '∞';
            const urgency = r.DaysSinceLastIssue == null || r.DaysSinceLastIssue > 365
              ? 'color:#ef4444' : r.DaysSinceLastIssue > 180 ? 'color:#f97316' : 'color:#7c3aed';
            return `<tr>
              <td style="color:var(--text-muted);font-size:12px">${i + 1}</td>
              <td style="font-weight:600">${r.ItemName || '-'}</td>
              <td><span style="padding:2px 8px;background:rgba(168,85,247,.1);color:#a855f7;border-radius:8px;font-size:11.5px">${r.CategoryName || '-'}</span></td>
              <td>${r.DivisionName || '-'}</td>
              <td style="text-align:right;font-weight:700">${r.Stock}</td>
              <td style="color:var(--text-muted);font-size:12px">${r.UOM || '-'}</td>
              <td style="text-align:right">${fmtCur(r.SellPrice)}</td>
              <td style="text-align:right;font-weight:700;color:#7c3aed">${fmtCur(r.LockedValue)}</td>
              <td style="text-align:center;font-size:12px">${lastDate}</td>
              <td style="text-align:center;font-weight:700;${urgency}">${idle}d</td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>
    ${ds.length > 10 ? `
    <div style="text-align:center;margin-top:12px">
      <button class="btn btn-secondary btn-sm" onclick="navigateTo('dead-stock')">
        <i class="fas fa-arrow-right"></i> View All ${ds.length} Dead Stock Items
      </button>
    </div>` : ''}
  </div>` : `
  <div class="card" style="border-color:rgba(139,92,246,.15)">
    <div style="display:flex;align-items:center;gap:12px;padding:8px 0">
      <div style="width:38px;height:38px;background:rgba(34,197,94,.12);border-radius:9px;
                  display:flex;align-items:center;justify-content:center;font-size:17px;color:#16a34a">
        <i class="fas fa-circle-check"></i>
      </div>
      <div>
        <div style="font-weight:600;color:var(--text-primary)">No Dead Stock</div>
        <div style="font-size:12px;color:var(--text-muted)">All stocked items have been issued within the last 90 days.</div>
      </div>
    </div>
  </div>`}
  </div>`;
});

// ======== DIVISION MASTER (Full-Featured) ========

registerPage('divisions', () => {
  return `${pageHeader('Division Master', 'fa-layer-group', 'Masters / Division',
    `<button class="btn btn-primary" id="btn-add-division"><i class="fas fa-plus"></i>  Add New</button>`)}
  <div class="card">
    <div class="search-bar">
      <div class="search-input-wrap">
        <i class="fas fa-search"></i>
        <input type="text" id="div-search" placeholder="Search division...">
      </div>
    </div>
    <div class="table-wrapper">
      <table id="tbl-div-main">
        <thead>
          <tr>
            <th style="width:42px;text-align:center">
              <input type="checkbox" id="div-select-all" title="Select all" style="width:16px;height:16px;cursor:pointer;accent-color:var(--accent)">
            </th>
            <th style="width:120px">Division ID</th>
            <th>Division Name</th>
            <th style="width:100px">Actions</th>
          </tr>
        </thead>
        <tbody id="tbl-div-body">
          <tr class="empty-row"><td colspan="4"><div class="spinner" style="margin:0 auto"></div></td></tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- Floating bulk-action bar (hidden by default) -->
  <div id="div-bulk-bar" style="
    display:none; position:fixed; bottom:28px; left:50%; transform:translateX(-50%);
    background:var(--bg-card); border:1px solid var(--accent); border-radius:12px;
    padding:12px 24px; z-index:500; box-shadow:0 8px 32px rgba(0,0,0,0.5);
    display:none; align-items:center; gap:16px; min-width:360px;">
    <span id="div-sel-count" style="color:var(--accent);font-weight:600;font-size:14px"></span>
    <div style="flex:1"></div>
    <button class="btn btn-success" id="btn-div-bulk-export">
      <i class="fas fa-file-excel"></i> Export XLSX
    </button>
    <button class="btn btn-danger" id="btn-div-bulk-delete">
      <i class="fas fa-trash"></i> Delete Selected
    </button>
    <button class="btn btn-secondary btn-sm" id="btn-div-bulk-cancel" title="Cancel">
      <i class="fas fa-xmark"></i>
    </button>
  </div>
  </div>`;
});

window._pageBinders = window._pageBinders || {};
window._pageBinders['divisions'] = async () => {
  await loadDivisions();

  // Search filter
  $('#div-search').oninput = () => {
    const q = $('#div-search').value.toLowerCase();
    $$('#tbl-div-body tr:not(.empty-row)').forEach(tr => {
      tr.style.display = tr.textContent.toLowerCase().includes(q) ? '' : 'none';
    });
  };

  // Add New button
  $('#btn-add-division').onclick = () => showAddDivisionModal();

  // Select-all checkbox in header
  $('#div-select-all').onchange = (e) => {
    $$('.div-row-chk').filter(c => c.closest('tr').style.display !== 'none')
      .forEach(c => { c.checked = e.target.checked; updateDivBulkBar(); });
  };

  // Bulk bar buttons
  $('#btn-div-bulk-cancel').onclick = () => {
    $$('.div-row-chk').forEach(c => c.checked = false);
    $('#div-select-all').checked = false;
    updateDivBulkBar();
  };
  $('#btn-div-bulk-export').onclick = () => bulkExportDivisions();
  $('#btn-div-bulk-delete').onclick = () => bulkDeleteDivisions();
};

// Load and render division table
async function loadDivisions() {
  const tbody = $('#tbl-div-body');
  if (!tbody) return;
  tbody.innerHTML = `<tr class="empty-row"><td colspan="4"><div class="spinner" style="margin:0 auto"></div></td></tr>`;

  let data;
  try {
    data = await api('/api/divisions?active=1');
  } catch (e) {
    tbody.innerHTML = `<tr class="empty-row"><td colspan="4" style="color:var(--danger)">
      <i class="fas fa-circle-xmark"></i> Failed to load: ${e.message}</td></tr>`;
    return;
  }

  if (!data.length) {
    tbody.innerHTML = `<tr class="empty-row"><td colspan="4">No divisions found.</td></tr>`;
    return;
  }

  const _isAdmin = (State.user && State.user.roleName && State.user.roleName.toLowerCase().includes('admin') && !State.user.roleName.toLowerCase().includes('super'));
  const isSuperAdmin = (State.user && State.user.roleName && State.user.roleName.toLowerCase().includes('super'));

  tbody.innerHTML = data.map(d => {
    return `\n    <tr data-id="${d.DivisionId}" class="div-row">
      <td style="text-align:center">
        <input type="checkbox" class="div-row-chk" data-id="${d.DivisionId}"
          style="width:16px;height:16px;cursor:pointer;accent-color:var(--accent)">
      </td>
      <td class="div-cell-id" style="color:var(--text-secondary);font-size:13px">${d.DivisionId}</td>
      <td>
        <span class="div-name-cell" data-id="${d.DivisionId}" data-name="${(d.DivisionName || '').replace(/"/g, '&quot;')}"
          style="cursor:pointer;color:var(--text-primary);text-decoration:underline dotted;text-underline-offset:3px"
          title="Click to edit">${d.DivisionName}</span>
      </td>
      <td>
        <button class="btn btn-danger btn-sm"
          onclick="deleteDivision(${d.DivisionId})"
          title="Delete this division">
          <i class="fas fa-trash"></i>
        </button>
      </td>
    </tr>`;
  }).join('');

  // Attach checkbox listeners after rendering
  $$('.div-row-chk').forEach(chk => {
    chk.onchange = () => { updateDivBulkBar(); syncSelectAll(); };
  });

  // Attach click-to-edit on name/id cells
  $$('.div-name-cell').forEach(cell => {
    cell.onclick = () => showEditDivisionInline(
      parseInt(cell.dataset.id), cell.dataset.name, cell
    );
  });
}

// Sync select-all header checkbox
function syncSelectAll() {
  const all = $$('.div-row-chk');
  const checked = all.filter(c => c.checked);
  const sa = $('#div-select-all');
  if (!sa) return;
  sa.checked = all.length > 0 && checked.length === all.length;
  sa.indeterminate = checked.length > 0 && checked.length < all.length;
}

// Show / hide bulk action bar
function updateDivBulkBar() {
  const checked = $$('.div-row-chk:checked');
  const bar = $('#div-bulk-bar');
  if (!bar) return;
  if (checked.length > 0) {
    bar.style.display = 'flex';
    $('#div-sel-count').textContent = `${checked.length} row${checked.length > 1 ? 's' : ''} selected`;
  } else {
    bar.style.display = 'none';
  }
}

// Inline edit modal &#8212; opens when clicking on Division Name or Division ID cell
function showEditDivisionInline(id, currentName, anchorCell) {
  // Remove any existing inline editor
  const existing = $('#div-inline-editor');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'div-inline-editor';
  overlay.innerHTML = `
    <div class="modal" style="max-width:420px;animation:slideUp 0.2s ease">
      <div class="modal-header">
        <h3><i class="fas fa-pen-to-square"></i> Edit Division</h3>
        <button class="btn-close-modal" onclick="document.getElementById('div-inline-editor').remove()">
          <i class="fas fa-xmark"></i>
        </button>
      </div>
      <div class="modal-body">
        <div class="form-field" style="margin-bottom:16px">
          <label>Division ID <span style="color:var(--text-muted);font-size:11px">(auto, not editable)</span></label>
          <input type="text" value="${id}" readonly
            style="background:var(--bg-dark);border:1px solid var(--border);border-radius:6px;
                   padding:9px 12px;color:var(--text-muted);width:100%;cursor:not-allowed;opacity:0.7"/>
        </div>
        <div class="form-field">
          <label>Division Name <span style="color:var(--danger)">*</span></label>
          <input type="text" id="div-edit-name" value="${currentName}"
            style="background:var(--bg-dark);border:1px solid var(--border);border-radius:6px;
                   padding:9px 12px;color:var(--text-primary);width:100%;font-size:14px"
            placeholder="Enter division name" autofocus/>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="document.getElementById('div-inline-editor').remove()">
          Cancel
        </button>
        <button class="btn btn-primary" id="btn-div-inline-save">
          <i class="fas fa-floppy-disk"></i> Save
        </button>
      </div>
    </div>`;
  document.body.appendChild(overlay);

  // Focus and select all text
  const inp = $('#div-edit-name');
  inp.focus(); inp.select();

  // Save on Enter key
  inp.onkeydown = (e) => { if (e.key === 'Enter') doSaveDiv(); };

  // Save button
  document.getElementById('btn-div-inline-save').onclick = doSaveDiv;

  // Click outside to close
  overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };

  async function doSaveDiv() {
    const name = inp.value.trim();
    if (!name) return showToast('Division name cannot be empty', 'error');
    try {
      await api(`/api/divisions/${id}`, { method: 'PUT', body: { DivisionName: name } });
      overlay.remove();
      showToast('Division updated successfully!', 'success');
      await loadDivisions();
    } catch (e) { showToast(e.message, 'error'); }
  }
}

// Add New Division modal (shows auto-increment ID preview)
async function showAddDivisionModal() {
  // Get next auto-increment ID preview (max + 1)
  let nextId = '&#8212;';
  try {
    const data = await api('/api/divisions?active=1');
    if (data.length) nextId = Math.max(...data.map(d => d.DivisionId)) + 1;
    else nextId = 1;
  } catch (_) { }

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal" style="max-width:420px;animation:slideUp 0.2s ease">
      <div class="modal-header">
        <h3><i class="fas fa-plus-circle"></i> Add New Division</h3>
        <button class="btn-close-modal" onclick="this.closest('.modal-overlay').remove()">
          <i class="fas fa-xmark"></i>
        </button>
      </div>
      <div class="modal-body">
        <div class="form-field" style="margin-bottom:16px">
          <label>Division ID <span style="color:var(--text-muted);font-size:11px">(auto-assigned)</span></label>
          <input type="text" value="~${nextId}" readonly
            style="background:var(--bg-dark);border:1px dashed var(--border);border-radius:6px;
                   padding:9px 12px;color:var(--text-muted);width:100%;cursor:not-allowed;
                   font-style:italic;opacity:0.7"/>
        </div>
        <div class="form-field">
          <label>Division Name <span style="color:var(--danger)">*</span></label>
          <input type="text" id="new-div-name" autofocus
            style="background:var(--bg-dark);border:1px solid var(--border);border-radius:6px;
                   padding:9px 12px;color:var(--text-primary);width:100%;font-size:14px"
            placeholder="e.g. Franchise, Kisna Admin..."/>
        </div>
        <p style="font-size:12px;color:var(--text-muted);margin-top:10px">
          <i class="fas fa-circle-info" style="color:var(--info)"></i>
          Division ID is auto-incremented by the database and cannot be set manually.
        </p>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
        <button class="btn btn-primary" id="btn-div-add-save">
          <i class="fas fa-plus"></i> Add Division
        </button>
      </div>
    </div>`;
  document.body.appendChild(overlay);

  const inp = $('#new-div-name', overlay);
  inp.focus();
  inp.onkeydown = e => { if (e.key === 'Enter') doAdd(); };
  overlay.onclick = e => { if (e.target === overlay) overlay.remove(); };
  overlay.querySelector('#btn-div-add-save').onclick = doAdd;
  overlay.querySelector('.btn-close-modal').onclick = () => overlay.remove();

  async function doAdd() {
    const name = inp.value.trim();
    if (!name) return showToast('Division name is required', 'error');
    try {
      await api('/api/divisions', { method: 'POST', body: { DivisionName: name } });
      overlay.remove();
      showToast('Division added successfully!', 'success');
      await loadDivisions();
    } catch (e) { showToast(e.message, 'error'); }
  }
}

// Single Delete
window.deleteDivision = async (id) => {
  if (!await confirm(`Delete Division ID ${id}? This action cannot be undone.`)) return;
  try {
    await api(`/api/divisions/${id}`, { method: 'DELETE' });
    showToast('Division deleted successfully!', 'success');
    await loadDivisions();
    updateDivBulkBar();
  } catch (e) { showToast(e.message, 'error'); }
};

// Bulk Delete selected rows
async function bulkDeleteDivisions() {
  const ids = $$('.div-row-chk:checked').map(c => parseInt(c.dataset.id));
  if (!ids.length) return;
  if (!await confirm(`Delete ${ids.length} selected division(s)? This cannot be undone.`)) return;
  try {
    await api('/api/divisions/bulk-delete', { method: 'POST', body: { ids } });
    showToast(`${ids.length} division(s) deleted!`, 'success');
    $('#div-select-all').checked = false;
    await loadDivisions();
    updateDivBulkBar();
  } catch (e) { showToast(e.message, 'error'); }
}

// Bulk Export selected rows to XLSX
async function bulkExportDivisions() {
  const ids = $$('.div-row-chk:checked').map(c => parseInt(c.dataset.id));
  try {
    // Use server-side export endpoint
    const res = await fetch('/api/divisions/export-xlsx', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ ids })
    });
    if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `divisions_export_${new Date().toISOString().split('T')[0]}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`Exported ${ids.length} division(s) to XLSX!`, 'success');
  } catch (e) { showToast('Export failed: ' + e.message, 'error'); }
}

// ======== DEPARTMENT MASTER (Full-Featured) ========

registerPage('departments', () => {
  return `${pageHeader('Department Master', 'fa-building', 'Masters / Department',
    `<button class="btn btn-primary" id="btn-add-dept"><i class="fas fa-plus"></i>  Add New</button>`)}
  <div class="card">
    <div class="search-bar">
      <div class="search-input-wrap">
        <i class="fas fa-search"></i>
        <input type="text" id="dept-search" placeholder="Search department...">
      </div>
    </div>
    <div class="table-wrapper">
      <table id="tbl-dept-main">
        <thead>
          <tr>
            <th style="width:42px;text-align:center">
              <input type="checkbox" id="dept-select-all" title="Select all"
                style="width:16px;height:16px;cursor:pointer;accent-color:var(--accent)">
            </th>
            <th style="width:160px">Department ID</th>
            <th>Department Name</th>
            <th style="width:100px">Actions</th>
          </tr>
        </thead>
        <tbody id="tbl-dept-body">
          <tr class="empty-row"><td colspan="4"><div class="spinner" style="margin:0 auto"></div></td></tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- Floating bulk-action bar -->
  <div id="dept-bulk-bar" style="
    display:none; position:fixed; bottom:28px; left:50%; transform:translateX(-50%);
    background:var(--bg-card); border:1px solid var(--accent); border-radius:12px;
    padding:12px 24px; z-index:500; box-shadow:0 8px 32px rgba(0,0,0,0.5);
    align-items:center; gap:16px; min-width:380px;">
    <span id="dept-sel-count" style="color:var(--accent);font-weight:600;font-size:14px"></span>
    <div style="flex:1"></div>
    <button class="btn btn-success" id="btn-dept-bulk-export">
      <i class="fas fa-file-excel"></i> Export XLSX
    </button>
    <button class="btn btn-danger" id="btn-dept-bulk-delete">
      <i class="fas fa-trash"></i> Delete Selected
    </button>
    <button class="btn btn-secondary btn-sm" id="btn-dept-bulk-cancel" title="Cancel">
      <i class="fas fa-xmark"></i>
    </button>
  </div>
  </div>`;
});

window._pageBinders['departments'] = async () => {
  await loadDepartments();

  // Search filter
  $('#dept-search').oninput = () => {
    const q = $('#dept-search').value.toLowerCase();
    $$('#tbl-dept-body tr:not(.empty-row)').forEach(tr => {
      tr.style.display = tr.textContent.toLowerCase().includes(q) ? '' : 'none';
    });
  };

  // Add New
  $('#btn-add-dept').onclick = () => showAddDeptModal();

  // Select-all checkbox
  $('#dept-select-all').onchange = (e) => {
    $$('.dept-row-chk').filter(c => c.closest('tr').style.display !== 'none')
      .forEach(c => { c.checked = e.target.checked; updateDeptBulkBar(); });
  };

  // Bulk bar buttons
  $('#btn-dept-bulk-cancel').onclick = () => {
    $$('.dept-row-chk').forEach(c => c.checked = false);
    $('#dept-select-all').checked = false;
    updateDeptBulkBar();
  };
  $('#btn-dept-bulk-export').onclick = () => bulkExportDepts();
  $('#btn-dept-bulk-delete').onclick = () => bulkDeleteDepts();
};

// Load and render department table
async function loadDepartments() {
  const tbody = $('#tbl-dept-body');
  if (!tbody) return;
  tbody.innerHTML = `<tr class="empty-row"><td colspan="4"><div class="spinner" style="margin:0 auto"></div></td></tr>`;

  let data;
  try {
    data = await api('/api/departments');
  } catch (e) {
    tbody.innerHTML = `<tr class="empty-row"><td colspan="4" style="color:var(--danger)">
      <i class="fas fa-circle-xmark"></i> Failed to load: ${e.message}</td></tr>`;
    return;
  }

  if (!data.length) {
    tbody.innerHTML = `<tr class="empty-row"><td colspan="4">No departments found.</td></tr>`;
    return;
  }

  tbody.innerHTML = data.map(d => {
    return `
    <tr data-id="${d.DepId}" class="dept-row">
      <td style="text-align:center">
        <input type="checkbox" class="dept-row-chk" data-id="${d.DepId}"
          style="width:16px;height:16px;cursor:pointer;accent-color:var(--accent)">
      </td>
      <td style="color:var(--text-secondary);font-size:13px">${d.DepId}</td>
      <td>
        <span class="dept-name-cell"
          data-id="${d.DepId}"
          data-name="${(d.DepName || '').replace(/"/g, '&quot;')}"
          style="cursor:pointer;color:var(--text-primary);text-decoration:underline dotted;text-underline-offset:3px"
          title="Click to edit">${d.DepName}</span>
      </td>
      <td>
        <button class="btn btn-danger btn-sm" onclick="deleteDept(${d.DepId})" title="Delete">
          <i class="fas fa-trash"></i>
        </button>
      </td>
    </tr>`;
  }).join('');

  // Attach checkbox listeners
  $$('.dept-row-chk').forEach(chk => {
    chk.onchange = () => { updateDeptBulkBar(); syncDeptSelectAll(); };
  });

  // Attach click-to-edit on name cells
  $$('.dept-name-cell').forEach(cell => {
    cell.onclick = () => showEditDeptInline(parseInt(cell.dataset.id), cell.dataset.name);
  });
}

function syncDeptSelectAll() {
  const all = $$('.dept-row-chk');
  const checked = all.filter(c => c.checked);
  const sa = $('#dept-select-all');
  if (!sa) return;
  sa.checked = all.length > 0 && checked.length === all.length;
  sa.indeterminate = checked.length > 0 && checked.length < all.length;
}

function updateDeptBulkBar() {
  const checked = $$('.dept-row-chk:checked');
  const bar = $('#dept-bulk-bar');
  if (!bar) return;
  if (checked.length > 0) {
    bar.style.display = 'flex';
    $('#dept-sel-count').textContent = `${checked.length} row${checked.length > 1 ? 's' : ''} selected`;
  } else {
    bar.style.display = 'none';
  }
}

// Inline edit modal &#8212; click on Department Name
function showEditDeptInline(id, currentName) {
  const existing = $('#dept-inline-editor');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'dept-inline-editor';
  overlay.innerHTML = `
    <div class="modal" style="max-width:420px;animation:slideUp 0.2s ease">
      <div class="modal-header">
        <h3><i class="fas fa-pen-to-square"></i> Edit Department</h3>
        <button class="btn-close-modal" onclick="document.getElementById('dept-inline-editor').remove()">
          <i class="fas fa-xmark"></i>
        </button>
      </div>
      <div class="modal-body">
        <div class="form-field" style="margin-bottom:16px">
          <label>Department ID <span style="color:var(--text-muted);font-size:11px">(auto, not editable)</span></label>
          <input type="text" value="${id}" readonly
            style="background:var(--bg-dark);border:1px solid var(--border);border-radius:6px;
                   padding:9px 12px;color:var(--text-muted);width:100%;cursor:not-allowed;opacity:0.7"/>
        </div>
        <div class="form-field">
          <label>Department Name <span style="color:var(--danger)">*</span></label>
          <input type="text" id="dept-edit-name" value="${currentName}"
            style="background:var(--bg-dark);border:1px solid var(--border);border-radius:6px;
                   padding:9px 12px;color:var(--text-primary);width:100%;font-size:14px"
            placeholder="Enter department name" autofocus/>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="document.getElementById('dept-inline-editor').remove()">Cancel</button>
        <button class="btn btn-primary" id="btn-dept-inline-save">
          <i class="fas fa-floppy-disk"></i> Save
        </button>
      </div>
    </div>`;
  document.body.appendChild(overlay);

  const inp = $('#dept-edit-name');
  inp.focus(); inp.select();
  inp.onkeydown = e => { if (e.key === 'Enter') doSaveDept(); };
  document.getElementById('btn-dept-inline-save').onclick = doSaveDept;
  overlay.onclick = e => { if (e.target === overlay) overlay.remove(); };

  async function doSaveDept() {
    const name = inp.value.trim();
    if (!name) return showToast('Department name cannot be empty', 'error');
    try {
      await api(`/api/departments/${id}`, { method: 'PUT', body: { DepName: name } });
      overlay.remove();
      showToast('Department updated successfully!', 'success');
      await loadDepartments();
    } catch (e) { showToast(e.message, 'error'); }
  }
}

// Add New Department modal
async function showAddDeptModal() {
  let nextId = '&#8212;';
  try {
    const data = await api('/api/departments');
    if (data.length) nextId = Math.max(...data.map(d => d.DepId)) + 1;
    else nextId = 1;
  } catch (_) { }

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal" style="max-width:420px;animation:slideUp 0.2s ease">
      <div class="modal-header">
        <h3><i class="fas fa-plus-circle"></i> Add New Department</h3>
        <button class="btn-close-modal" onclick="this.closest('.modal-overlay').remove()">
          <i class="fas fa-xmark"></i>
        </button>
      </div>
      <div class="modal-body">
        <div class="form-field" style="margin-bottom:16px">
          <label>Department ID <span style="color:var(--text-muted);font-size:11px">(auto-assigned)</span></label>
          <input type="text" value="~${nextId}" readonly
            style="background:var(--bg-dark);border:1px dashed var(--border);border-radius:6px;
                   padding:9px 12px;color:var(--text-muted);width:100%;cursor:not-allowed;
                   font-style:italic;opacity:0.7"/>
        </div>
        <div class="form-field">
          <label>Department Name <span style="color:var(--danger)">*</span></label>
          <input type="text" id="new-dept-name" autofocus
            style="background:var(--bg-dark);border:1px solid var(--border);border-radius:6px;
                   padding:9px 12px;color:var(--text-primary);width:100%;font-size:14px"
            placeholder="e.g. Sales, Operations, HR..."/>
        </div>
        <p style="font-size:12px;color:var(--text-muted);margin-top:10px">
          <i class="fas fa-circle-info" style="color:var(--info)"></i>
          Department ID is auto-incremented by the database and cannot be set manually.
        </p>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
        <button class="btn btn-primary" id="btn-dept-add-save">
          <i class="fas fa-plus"></i> Add Department
        </button>
      </div>
    </div>`;
  document.body.appendChild(overlay);

  const inp = $('#new-dept-name', overlay);
  inp.focus();
  inp.onkeydown = e => { if (e.key === 'Enter') doAdd(); };
  overlay.onclick = e => { if (e.target === overlay) overlay.remove(); };
  overlay.querySelector('#btn-dept-add-save').onclick = doAdd;
  overlay.querySelector('.btn-close-modal').onclick = () => overlay.remove();

  async function doAdd() {
    const name = inp.value.trim();
    if (!name) return showToast('Department name is required', 'error');
    try {
      await api('/api/departments', { method: 'POST', body: { DepName: name } });
      overlay.remove();
      showToast('Department added successfully!', 'success');
      await loadDepartments();
    } catch (e) { showToast(e.message, 'error'); }
  }
}

// Single Delete
window.deleteDept = async (id) => {
  if (!await confirm(`Delete Department ID ${id}? This action cannot be undone.`)) return;
  try {
    await api(`/api/departments/${id}`, { method: 'DELETE' });
    showToast('Department deleted successfully!', 'success');
    await loadDepartments();
    updateDeptBulkBar();
  } catch (e) { showToast(e.message, 'error'); }
};

// Bulk Delete
async function bulkDeleteDepts() {
  const ids = $$('.dept-row-chk:checked').map(c => parseInt(c.dataset.id));
  if (!ids.length) return;
  if (!await confirm(`Delete ${ids.length} selected department(s)? This cannot be undone.`)) return;
  try {
    await api('/api/departments/bulk-delete', { method: 'POST', body: { ids } });
    showToast(`${ids.length} department(s) deleted!`, 'success');
    $('#dept-select-all').checked = false;
    await loadDepartments();
    updateDeptBulkBar();
  } catch (e) { showToast(e.message, 'error'); }
}

// Bulk Export XLSX
async function bulkExportDepts() {
  const ids = $$('.dept-row-chk:checked').map(c => parseInt(c.dataset.id));
  try {
    const res = await fetch('/api/departments/export-xlsx', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ ids })
    });
    if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `departments_export_${new Date().toISOString().split('T')[0]}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`Exported ${ids.length} department(s) to XLSX!`, 'success');
  } catch (e) { showToast('Export failed: ' + e.message, 'error'); }
}

// ======== PRODUCT CATEGORY MASTER (Full-Featured) ========

registerPage('categories', () => {
  return `${pageHeader('Product Category', 'fa-tags', 'Masters / Category',
    (State.user && ['super admin', 'superadmin'].includes(State.user.roleName?.toLowerCase()))
      ? `<button class="btn btn-success" id="btn-cat-bulk-upload" style="margin-right:8px"><i class="fas fa-file-arrow-up"></i>  Upload Excel</button><button class="btn btn-primary" id="btn-add-cat"><i class="fas fa-plus"></i>  Add New</button>`
      : `<button class="btn btn-primary" id="btn-add-cat"><i class="fas fa-plus"></i>  Add New</button>`)}
  <div class="card">
    <div class="search-bar">
      <div class="search-input-wrap">
        <i class="fas fa-search"></i>
        <input type="text" id="cat-search" placeholder="Search category...">
      </div>
      <!-- Division filter dropdown -->
      <select id="cat-div-filter"
        style="background:var(--bg-dark);border:1px solid var(--border);border-radius:6px;
               padding:8px 14px;color:var(--text-primary);font-size:13.5px;cursor:pointer;min-width:180px">
        <option value="">All Divisions</option>
      </select>
    </div>
    <div class="table-wrapper">
      <table id="tbl-cat-main">
        <thead>
          <tr>
            <th style="width:42px;text-align:center">
              <input type="checkbox" id="cat-select-all" title="Select all"
                style="width:16px;height:16px;cursor:pointer;accent-color:var(--accent)">
            </th>
            <th style="width:130px">Category ID</th>
            <th>Category Name</th>
            <th style="width:200px">Division</th>
            <th style="width:100px">Actions</th>
          </tr>
        </thead>
        <tbody id="tbl-cat-body">
          <tr class="empty-row"><td colspan="5"><div class="spinner" style="margin:0 auto"></div></td></tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- Floating bulk-action bar -->
  <div id="cat-bulk-bar" style="
    display:none; position:fixed; bottom:28px; left:50%; transform:translateX(-50%);
    background:var(--bg-card); border:1px solid var(--accent); border-radius:12px;
    padding:12px 24px; z-index:500; box-shadow:0 8px 32px rgba(0,0,0,0.5);
    align-items:center; gap:16px; min-width:380px;">
    <span id="cat-sel-count" style="color:var(--accent);font-weight:600;font-size:14px"></span>
    <div style="flex:1"></div>
    <button class="btn btn-success" id="btn-cat-bulk-export">
      <i class="fas fa-file-excel"></i> Export XLSX
    </button>
    <button class="btn btn-danger" id="btn-cat-bulk-delete">
      <i class="fas fa-trash"></i> Delete Selected
    </button>
    <button class="btn btn-secondary btn-sm" id="btn-cat-bulk-cancel" title="Cancel">
      <i class="fas fa-xmark"></i>
    </button>
  </div>
  </div>`;
});

// Cache for divisions list (shared across modals)
let _catDivisions = [];

window._pageBinders['categories'] = async () => {
  // Pre-load divisions for dropdowns
  try { _catDivisions = await api('/api/divisions?active=1'); } catch (_) { _catDivisions = []; }

  await loadCategories();

  // Populate Division filter dropdown
  const filterSel = $('#cat-div-filter');
  if (filterSel) {
    _catDivisions.forEach(d => {
      const opt = document.createElement('option');
      opt.value = d.DivisionId;
      opt.textContent = d.DivisionName;
      filterSel.appendChild(opt);
    });
    filterSel.onchange = applyCatFilters;
  }

  // Search filter
  $('#cat-search').oninput = applyCatFilters;

  // Add New
  $('#btn-add-cat').onclick = () => showAddCatModal();
  if ($('#btn-cat-bulk-upload')) {
    $('#btn-cat-bulk-upload').onclick = () => showBulkUploadModal({
      title: 'Product Category',
      apiPath: '/api/categories/bulk-upload',
      templateCols: ['Category Name', 'Division Name'],
      templateFile: 'product_category_template.xlsx',
      onSuccess: loadCategories
    });
  }

  // Select-all checkbox
  $('#cat-select-all').onchange = (e) => {
    $$('.cat-row-chk').filter(c => c.closest('tr').style.display !== 'none')
      .forEach(c => { c.checked = e.target.checked; updateCatBulkBar(); });
  };

  // Bulk bar buttons
  $('#btn-cat-bulk-cancel').onclick = () => {
    $$('.cat-row-chk').forEach(c => c.checked = false);
    $('#cat-select-all').checked = false;
    updateCatBulkBar();
  };
  $('#btn-cat-bulk-export').onclick = () => bulkExportCats();
  $('#btn-cat-bulk-delete').onclick = () => bulkDeleteCats();
};

function applyCatFilters() {
  const q = ($('#cat-search')?.value || '').toLowerCase();
  const divId = $('#cat-div-filter')?.value || '';
  $$('#tbl-cat-body tr:not(.empty-row)').forEach(tr => {
    const matchText  = !q || tr.textContent.toLowerCase().includes(q);
    const matchDiv   = !divId || tr.dataset.divId === divId;
    tr.style.display = (matchText && matchDiv) ? '' : 'none';
  });
}

// Load and render categories table
async function loadCategories() {
  const tbody = $('#tbl-cat-body');
  if (!tbody) return;
  tbody.innerHTML = `<tr class="empty-row"><td colspan="5"><div class="spinner" style="margin:0 auto"></div></td></tr>`;

  let data;
  try {
    data = await api('/api/categories');
  } catch (e) {
    tbody.innerHTML = `<tr class="empty-row"><td colspan="5" style="color:var(--danger)">
      <i class="fas fa-circle-xmark"></i> Failed to load: ${e.message}</td></tr>`;
    return;
  }

  if (!data.length) {
    tbody.innerHTML = `<tr class="empty-row"><td colspan="5">No categories found.</td></tr>`;
    return;
  }

  tbody.innerHTML = data.map(d => {
    return `
    <tr data-id="${d.CategoryId}" data-div-id="${d.DivisionId || ''}" class="cat-row">
      <td style="text-align:center">
        <input type="checkbox" class="cat-row-chk" data-id="${d.CategoryId}"
          style="width:16px;height:16px;cursor:pointer;accent-color:var(--accent)">
      </td>
      <td style="color:var(--text-secondary);font-size:13px">${d.CategoryId}</td>
      <td>
        <span class="cat-name-cell"
          data-id="${d.CategoryId}"
          data-name="${(d.CategoryName || '').replace(/"/g, '&quot;')}"
          data-div-id="${d.DivisionId || ''}"
          style="cursor:pointer;color:var(--text-primary);text-decoration:underline dotted;text-underline-offset:3px"
          title="Click to edit">${d.CategoryName}</span>
      </td>
      <td>
        <span style="
          display:inline-flex;align-items:center;gap:6px;
          background:var(--accent-soft);color:var(--accent);
          border-radius:20px;padding:3px 10px;font-size:12px;font-weight:600">
          <i class="fas fa-layer-group" style="font-size:10px"></i>
          ${d.DivisionName || '<span style="color:var(--text-muted);font-style:italic">&#8212;</span>'}
        </span>
      </td>
      <td>
        <button class="btn btn-danger btn-sm" onclick="deleteCat(${d.CategoryId})" title="Delete">
          <i class="fas fa-trash"></i>
        </button>
      </td>
    </tr>`;
  }).join('');

  // Attach checkbox listeners
  $$('.cat-row-chk').forEach(chk => {
    chk.onchange = () => { updateCatBulkBar(); syncCatSelectAll(); };
  });

  // Attach click-to-edit on name cells
  $$('.cat-name-cell').forEach(cell => {
    cell.onclick = () => showEditCatInline(
      parseInt(cell.dataset.id),
      cell.dataset.name,
      parseInt(cell.dataset.divId) || null
    );
  });
}

function syncCatSelectAll() {
  const all = $$('.cat-row-chk');
  const checked = all.filter(c => c.checked);
  const sa = $('#cat-select-all');
  if (!sa) return;
  sa.checked = all.length > 0 && checked.length === all.length;
  sa.indeterminate = checked.length > 0 && checked.length < all.length;
}

function updateCatBulkBar() {
  const checked = $$('.cat-row-chk:checked');
  const bar = $('#cat-bulk-bar');
  if (!bar) return;
  if (checked.length > 0) {
    bar.style.display = 'flex';
    $('#cat-sel-count').textContent = `${checked.length} row${checked.length > 1 ? 's' : ''} selected`;
  } else {
    bar.style.display = 'none';
  }
}

// Build a Division options HTML string
function buildDivOptions(selectedId) {
  return _catDivisions.map(d =>
    `<option value="${d.DivisionId}" ${d.DivisionId === selectedId ? 'selected' : ''}>${d.DivisionName}</option>`
  ).join('');
}

// Inline edit modal &#8212; click on Category Name
function showEditCatInline(id, currentName, currentDivId) {
  const existing = $('#cat-inline-editor');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'cat-inline-editor';
  overlay.innerHTML = `
    <div class="modal" style="max-width:460px;animation:slideUp 0.2s ease">
      <div class="modal-header">
        <h3><i class="fas fa-pen-to-square"></i> Edit Category</h3>
        <button class="btn-close-modal" onclick="document.getElementById('cat-inline-editor').remove()">
          <i class="fas fa-xmark"></i>
        </button>
      </div>
      <div class="modal-body">
        <div class="form-field" style="margin-bottom:16px">
          <label>Category ID <span style="color:var(--text-muted);font-size:11px">(auto, not editable)</span></label>
          <input type="text" value="${id}" readonly
            style="background:var(--bg-dark);border:1px solid var(--border);border-radius:6px;
                   padding:9px 12px;color:var(--text-muted);width:100%;cursor:not-allowed;opacity:0.7"/>
        </div>
        <div class="form-field" style="margin-bottom:16px">
          <label>Category Name <span style="color:var(--danger)">*</span></label>
          <input type="text" id="cat-edit-name" value="${currentName}"
            style="background:var(--bg-dark);border:1px solid var(--border);border-radius:6px;
                   padding:9px 12px;color:var(--text-primary);width:100%;font-size:14px"
            placeholder="Enter category name" autofocus/>
        </div>
        <div class="form-field">
          <label>Division <span style="color:var(--danger)">*</span></label>
          <select id="cat-edit-div"
            style="background:var(--bg-dark);border:1px solid var(--border);border-radius:6px;
                   padding:9px 12px;color:var(--text-primary);width:100%;font-size:14px;cursor:pointer">
            <option value="">&#8212; Select Division &#8212;</option>
            ${buildDivOptions(currentDivId)}
          </select>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="document.getElementById('cat-inline-editor').remove()">Cancel</button>
        <button class="btn btn-primary" id="btn-cat-inline-save">
          <i class="fas fa-floppy-disk"></i> Save
        </button>
      </div>
    </div>`;
  document.body.appendChild(overlay);

  const nameInp = $('#cat-edit-name');
  nameInp.focus(); nameInp.select();
  nameInp.onkeydown = e => { if (e.key === 'Enter') doSaveCat(); };
  document.getElementById('btn-cat-inline-save').onclick = doSaveCat;
  overlay.onclick = e => { if (e.target === overlay) overlay.remove(); };

  async function doSaveCat() {
    const name = nameInp.value.trim();
    const divId = $('#cat-edit-div').value;
    if (!name) return showToast('Category name cannot be empty', 'error');
    if (!divId) return showToast('Please select a Division', 'error');
    try {
      await api(`/api/categories/${id}`, { method: 'PUT', body: { CategoryName: name, DivisionId: divId } });
      overlay.remove();
      showToast('Category updated successfully!', 'success');
      await loadCategories();
    } catch (e) { showToast(e.message, 'error'); }
  }
}

// Add New Category modal
async function showAddCatModal() {
  let nextId = '&#8212;';
  try {
    const data = await api('/api/categories');
    nextId = data.length ? Math.max(...data.map(d => d.CategoryId)) + 1 : 1;
  } catch (_) { }

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal" style="max-width:460px;animation:slideUp 0.2s ease">
      <div class="modal-header">
        <h3><i class="fas fa-plus-circle"></i> Add New Category</h3>
        <button class="btn-close-modal" onclick="this.closest('.modal-overlay').remove()">
          <i class="fas fa-xmark"></i>
        </button>
      </div>
      <div class="modal-body">
        <div class="form-field" style="margin-bottom:16px">
          <label>Category ID <span style="color:var(--text-muted);font-size:11px">(auto-assigned)</span></label>
          <input type="text" value="~${nextId}" readonly
            style="background:var(--bg-dark);border:1px dashed var(--border);border-radius:6px;
                   padding:9px 12px;color:var(--text-muted);width:100%;cursor:not-allowed;
                   font-style:italic;opacity:0.7"/>
        </div>
        <div class="form-field" style="margin-bottom:16px">
          <label>Category Name <span style="color:var(--danger)">*</span></label>
          <input type="text" id="new-cat-name" autofocus
            style="background:var(--bg-dark);border:1px solid var(--border);border-radius:6px;
                   padding:9px 12px;color:var(--text-primary);width:100%;font-size:14px"
            placeholder="e.g. Stationary, Jewellery Box..."/>
        </div>
        <div class="form-field">
          <label>Division <span style="color:var(--danger)">*</span></label>
          <select id="new-cat-div"
            style="background:var(--bg-dark);border:1px solid var(--border);border-radius:6px;
                   padding:9px 12px;color:var(--text-primary);width:100%;font-size:14px;cursor:pointer">
            <option value="">&#8212; Select Division &#8212;</option>
            ${buildDivOptions(null)}
          </select>
        </div>
        <p style="font-size:12px;color:var(--text-muted);margin-top:10px">
          <i class="fas fa-circle-info" style="color:var(--info)"></i>
          Category ID is auto-incremented by the database and cannot be set manually.
        </p>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
        <button class="btn btn-primary" id="btn-cat-add-save">
          <i class="fas fa-plus"></i> Add Category
        </button>
      </div>
    </div>`;
  document.body.appendChild(overlay);

  const nameInp = $('#new-cat-name', overlay);
  nameInp.focus();
  nameInp.onkeydown = e => { if (e.key === 'Enter') doAdd(); };
  overlay.onclick = e => { if (e.target === overlay) overlay.remove(); };
  overlay.querySelector('#btn-cat-add-save').onclick = doAdd;
  overlay.querySelector('.btn-close-modal').onclick = () => overlay.remove();

  async function doAdd() {
    const name = nameInp.value.trim();
    const divId = overlay.querySelector('#new-cat-div').value;
    if (!name) return showToast('Category name is required', 'error');
    if (!divId) return showToast('Please select a Division', 'error');
    try {
      await api('/api/categories', { method: 'POST', body: { CategoryName: name, DivisionId: divId } });
      overlay.remove();
      showToast('Category added successfully!', 'success');
      await loadCategories();
    } catch (e) { showToast(e.message, 'error'); }
  }
}

// Single Delete
window.deleteCat = async (id) => {
  if (!await confirm(`Delete Category ID ${id}? This action cannot be undone.`)) return;
  try {
    await api(`/api/categories/${id}`, { method: 'DELETE' });
    showToast('Category deleted successfully!', 'success');
    await loadCategories();
    updateCatBulkBar();
  } catch (e) { showToast(e.message, 'error'); }
};

// Bulk Delete
async function bulkDeleteCats() {
  const ids = $$('.cat-row-chk:checked').map(c => parseInt(c.dataset.id));
  if (!ids.length) return;
  if (!await confirm(`Delete ${ids.length} selected categor${ids.length > 1 ? 'ies' : 'y'}? This cannot be undone.`)) return;
  try {
    await api('/api/categories/bulk-delete', { method: 'POST', body: { ids } });
    showToast(`${ids.length} categor${ids.length > 1 ? 'ies' : 'y'} deleted!`, 'success');
    $('#cat-select-all').checked = false;
    await loadCategories();
    updateCatBulkBar();
  } catch (e) { showToast(e.message, 'error'); }
}

// Bulk Export XLSX
async function bulkExportCats() {
  const ids = $$('.cat-row-chk:checked').map(c => parseInt(c.dataset.id));
  try {
    const res = await fetch('/api/categories/export-xlsx', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ ids })
    });
    if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `categories_export_${new Date().toISOString().split('T')[0]}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`Exported ${ids.length} categor${ids.length > 1 ? 'ies' : 'y'} to XLSX!`, 'success');
  } catch (e) { showToast('Export failed: ' + e.message, 'error'); }
}

// ======== STATE MASTER (Full-Featured) ========

registerPage('states', () => {
  return `${pageHeader('State Master', 'fa-map-marked-alt', 'Masters / State',
    `<button class="btn btn-primary" id="btn-add-state"><i class="fas fa-plus"></i>  Add New</button>`)}
  <div class="card">
    <div class="search-bar">
      <div class="search-input-wrap">
        <i class="fas fa-search"></i>
        <input type="text" id="state-search" placeholder="Search state...">
      </div>
    </div>
    <div class="table-wrapper">
      <table id="tbl-state-main">
        <thead>
          <tr>
            <th style="width:42px;text-align:center">
              <input type="checkbox" id="state-select-all" title="Select all"
                style="width:16px;height:16px;cursor:pointer;accent-color:var(--accent)">
            </th>
            <th style="width:140px">State ID</th>
            <th>State Name</th>
            <th style="width:100px">Actions</th>
          </tr>
        </thead>
        <tbody id="tbl-state-body">
          <tr class="empty-row"><td colspan="4"><div class="spinner" style="margin:0 auto"></div></td></tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- Floating bulk-action bar -->
  <div id="state-bulk-bar" style="
    display:none; position:fixed; bottom:28px; left:50%; transform:translateX(-50%);
    background:var(--bg-card); border:1px solid var(--accent); border-radius:12px;
    padding:12px 24px; z-index:500; box-shadow:0 8px 32px rgba(0,0,0,0.5);
    align-items:center; gap:16px; min-width:380px;">
    <span id="state-sel-count" style="color:var(--accent);font-weight:600;font-size:14px"></span>
    <div style="flex:1"></div>
    <button class="btn btn-success" id="btn-state-bulk-export">
      <i class="fas fa-file-excel"></i> Export XLSX
    </button>
    <button class="btn btn-danger" id="btn-state-bulk-delete">
      <i class="fas fa-trash"></i> Delete Selected
    </button>
    <button class="btn btn-secondary btn-sm" id="btn-state-bulk-cancel" title="Cancel">
      <i class="fas fa-xmark"></i>
    </button>
  </div>
  </div>`;
});

window._pageBinders['states'] = async () => {
  await loadStates();

  // Search
  $('#state-search').oninput = () => {
    const q = $('#state-search').value.toLowerCase();
    $$('#tbl-state-body tr:not(.empty-row)').forEach(tr => {
      tr.style.display = tr.textContent.toLowerCase().includes(q) ? '' : 'none';
    });
  };

  // Add New
  $('#btn-add-state').onclick = () => showAddStateModal();

  // Select-all
  $('#state-select-all').onchange = (e) => {
    $$('.state-row-chk').filter(c => c.closest('tr').style.display !== 'none')
      .forEach(c => { c.checked = e.target.checked; updateStateBulkBar(); });
  };

  // Bulk bar buttons
  $('#btn-state-bulk-cancel').onclick = () => {
    $$('.state-row-chk').forEach(c => c.checked = false);
    $('#state-select-all').checked = false;
    updateStateBulkBar();
  };
  $('#btn-state-bulk-export').onclick = () => bulkExportStates();
  $('#btn-state-bulk-delete').onclick = () => bulkDeleteStates();
};

// Load and render states table
async function loadStates() {
  const tbody = $('#tbl-state-body');
  if (!tbody) return;
  tbody.innerHTML = `<tr class="empty-row"><td colspan="4"><div class="spinner" style="margin:0 auto"></div></td></tr>`;

  let data;
  try {
    data = await api('/api/states');
  } catch (e) {
    tbody.innerHTML = `<tr class="empty-row"><td colspan="4" style="color:var(--danger)">
      <i class="fas fa-circle-xmark"></i> Failed to load: ${e.message}</td></tr>`;
    return;
  }

  if (!data.length) {
    tbody.innerHTML = `<tr class="empty-row"><td colspan="4">No states found.</td></tr>`;
    return;
  }

  // DB column for state name is "State" (not "StateName")
  tbody.innerHTML = data.map(d => {
    return `
    <tr data-id="${d.StateID}" class="state-row">
      <td style="text-align:center">
        <input type="checkbox" class="state-row-chk" data-id="${d.StateID}"
          style="width:16px;height:16px;cursor:pointer;accent-color:var(--accent)">
      </td>
      <td style="color:var(--text-secondary);font-size:13px">${d.StateID}</td>
      <td>
        <span class="state-name-cell"
          data-id="${d.StateID}"
          data-name="${(d.State || '').replace(/"/g, '&quot;')}"
          style="cursor:pointer;color:var(--text-primary);text-decoration:underline dotted;text-underline-offset:3px"
          title="Click to edit">${d.State}</span>
      </td>
      <td>
        <button class="btn btn-danger btn-sm" onclick="deleteState(${d.StateID})" title="Delete">
          <i class="fas fa-trash"></i>
        </button>
      </td>
    </tr>`;
  }).join('');

  // Checkbox listeners
  $$('.state-row-chk').forEach(chk => {
    chk.onchange = () => { updateStateBulkBar(); syncStateSelectAll(); };
  });

  // Click-to-edit on name cells
  $$('.state-name-cell').forEach(cell => {
    cell.onclick = () => showEditStateInline(parseInt(cell.dataset.id), cell.dataset.name);
  });
}

function syncStateSelectAll() {
  const all = $$('.state-row-chk');
  const checked = all.filter(c => c.checked);
  const sa = $('#state-select-all');
  if (!sa) return;
  sa.checked = all.length > 0 && checked.length === all.length;
  sa.indeterminate = checked.length > 0 && checked.length < all.length;
}

function updateStateBulkBar() {
  const checked = $$('.state-row-chk:checked');
  const bar = $('#state-bulk-bar');
  if (!bar) return;
  if (checked.length > 0) {
    bar.style.display = 'flex';
    $('#state-sel-count').textContent = `${checked.length} row${checked.length > 1 ? 's' : ''} selected`;
  } else {
    bar.style.display = 'none';
  }
}

// Inline edit modal &#8212; click on State Name
function showEditStateInline(id, currentName) {
  const existing = $('#state-inline-editor');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'state-inline-editor';
  overlay.innerHTML = `
    <div class="modal" style="max-width:420px;animation:slideUp 0.2s ease">
      <div class="modal-header">
        <h3><i class="fas fa-pen-to-square"></i> Edit State</h3>
        <button class="btn-close-modal" onclick="document.getElementById('state-inline-editor').remove()">
          <i class="fas fa-xmark"></i>
        </button>
      </div>
      <div class="modal-body">
        <div class="form-field" style="margin-bottom:16px">
          <label>State ID <span style="color:var(--text-muted);font-size:11px">(auto, not editable)</span></label>
          <input type="text" value="${id}" readonly
            style="background:var(--bg-dark);border:1px solid var(--border);border-radius:6px;
                   padding:9px 12px;color:var(--text-muted);width:100%;cursor:not-allowed;opacity:0.7"/>
        </div>
        <div class="form-field">
          <label>State Name <span style="color:var(--danger)">*</span></label>
          <input type="text" id="state-edit-name" value="${currentName}"
            style="background:var(--bg-dark);border:1px solid var(--border);border-radius:6px;
                   padding:9px 12px;color:var(--text-primary);width:100%;font-size:14px"
            placeholder="Enter state name" autofocus/>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="document.getElementById('state-inline-editor').remove()">Cancel</button>
        <button class="btn btn-primary" id="btn-state-inline-save">
          <i class="fas fa-floppy-disk"></i> Save
        </button>
      </div>
    </div>`;
  document.body.appendChild(overlay);

  const inp = $('#state-edit-name');
  inp.focus(); inp.select();
  inp.onkeydown = e => { if (e.key === 'Enter') doSaveState(); };
  document.getElementById('btn-state-inline-save').onclick = doSaveState;
  overlay.onclick = e => { if (e.target === overlay) overlay.remove(); };

  async function doSaveState() {
    const name = inp.value.trim();
    if (!name) return showToast('State name cannot be empty', 'error');
    try {
      await api(`/api/states/${id}`, { method: 'PUT', body: { StateName: name } });
      overlay.remove();
      showToast('State updated successfully!', 'success');
      await loadStates();
    } catch (e) { showToast(e.message, 'error'); }
  }
}

// Add New State modal
async function showAddStateModal() {
  let nextId = '&#8212;';
  try {
    const data = await api('/api/states');
    nextId = data.length ? Math.max(...data.map(d => d.StateID)) + 1 : 1;
  } catch (_) { }

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal" style="max-width:420px;animation:slideUp 0.2s ease">
      <div class="modal-header">
        <h3><i class="fas fa-plus-circle"></i> Add New State</h3>
        <button class="btn-close-modal" onclick="this.closest('.modal-overlay').remove()">
          <i class="fas fa-xmark"></i>
        </button>
      </div>
      <div class="modal-body">
        <div class="form-field" style="margin-bottom:16px">
          <label>State ID <span style="color:var(--text-muted);font-size:11px">(auto-assigned)</span></label>
          <input type="text" value="~${nextId}" readonly
            style="background:var(--bg-dark);border:1px dashed var(--border);border-radius:6px;
                   padding:9px 12px;color:var(--text-muted);width:100%;cursor:not-allowed;
                   font-style:italic;opacity:0.7"/>
        </div>
        <div class="form-field">
          <label>State Name <span style="color:var(--danger)">*</span></label>
          <input type="text" id="new-state-name" autofocus
            style="background:var(--bg-dark);border:1px solid var(--border);border-radius:6px;
                   padding:9px 12px;color:var(--text-primary);width:100%;font-size:14px"
            placeholder="e.g. Maharashtra, Gujarat..."/>
        </div>
        <p style="font-size:12px;color:var(--text-muted);margin-top:10px">
          <i class="fas fa-circle-info" style="color:var(--info)"></i>
          State ID is auto-incremented by the database and cannot be set manually.
        </p>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
        <button class="btn btn-primary" id="btn-state-add-save">
          <i class="fas fa-plus"></i> Add State
        </button>
      </div>
    </div>`;
  document.body.appendChild(overlay);

  const inp = $('#new-state-name', overlay);
  inp.focus();
  inp.onkeydown = e => { if (e.key === 'Enter') doAdd(); };
  overlay.onclick = e => { if (e.target === overlay) overlay.remove(); };
  overlay.querySelector('#btn-state-add-save').onclick = doAdd;
  overlay.querySelector('.btn-close-modal').onclick = () => overlay.remove();

  async function doAdd() {
    const name = inp.value.trim();
    if (!name) return showToast('State name is required', 'error');
    try {
      await api('/api/states', { method: 'POST', body: { StateName: name } });
      overlay.remove();
      showToast('State added successfully!', 'success');
      await loadStates();
    } catch (e) { showToast(e.message, 'error'); }
  }
}

// Single Delete
window.deleteState = async (id) => {
  if (!await confirm(`Delete State ID ${id}? This action cannot be undone.`)) return;
  try {
    await api(`/api/states/${id}`, { method: 'DELETE' });
    showToast('State deleted successfully!', 'success');
    await loadStates();
    updateStateBulkBar();
  } catch (e) { showToast(e.message, 'error'); }
};

// Bulk Delete
async function bulkDeleteStates() {
  const ids = $$('.state-row-chk:checked').map(c => parseInt(c.dataset.id));
  if (!ids.length) return;
  if (!await confirm(`Delete ${ids.length} selected state(s)? This cannot be undone.`)) return;
  try {
    await api('/api/states/bulk-delete', { method: 'POST', body: { ids } });
    showToast(`${ids.length} state(s) deleted!`, 'success');
    $('#state-select-all').checked = false;
    await loadStates();
    updateStateBulkBar();
  } catch (e) { showToast(e.message, 'error'); }
}

// Bulk Export XLSX
async function bulkExportStates() {
  const ids = $$('.state-row-chk:checked').map(c => parseInt(c.dataset.id));
  try {
    const res = await fetch('/api/states/export-xlsx', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ ids })
    });
    if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `states_export_${new Date().toISOString().split('T')[0]}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`Exported ${ids.length} state(s) to XLSX!`, 'success');
  } catch (e) { showToast('Export failed: ' + e.message, 'error'); }
}

// ======== CITY MASTER (Full-Featured) ========

let _cityStates = []; // cached state list for dropdowns

registerPage('cities', () => {
  return `${pageHeader('City Master', 'fa-city', 'Masters / City',
    `<button class="btn btn-primary" id="btn-add-city"><i class="fas fa-plus"></i>  Add New</button>`)}
  <div class="card">
    <div class="search-bar">
      <div class="search-input-wrap">
        <i class="fas fa-search"></i>
        <input type="text" id="city-search" placeholder="Search city...">
      </div>
      <!-- State filter dropdown -->
      <select id="city-state-filter"
        style="background:var(--bg-dark);border:1px solid var(--border);border-radius:6px;
               padding:8px 14px;color:var(--text-primary);font-size:13.5px;cursor:pointer;min-width:200px">
        <option value="">All States</option>
      </select>
    </div>
    <div class="table-wrapper">
      <table id="tbl-city-main">
        <thead>
          <tr>
            <th style="width:42px;text-align:center">
              <input type="checkbox" id="city-select-all" title="Select all"
                style="width:16px;height:16px;cursor:pointer;accent-color:var(--accent)">
            </th>
            <th style="width:110px">City ID</th>
            <th style="width:220px">State</th>
            <th>City</th>
            <th style="width:100px">Actions</th>
          </tr>
        </thead>
        <tbody id="tbl-city-body">
          <tr class="empty-row"><td colspan="5"><div class="spinner" style="margin:0 auto"></div></td></tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- Floating bulk-action bar -->
  <div id="city-bulk-bar" style="
    display:none; position:fixed; bottom:28px; left:50%; transform:translateX(-50%);
    background:var(--bg-card); border:1px solid var(--accent); border-radius:12px;
    padding:12px 24px; z-index:500; box-shadow:0 8px 32px rgba(0,0,0,0.5);
    align-items:center; gap:16px; min-width:380px;">
    <span id="city-sel-count" style="color:var(--accent);font-weight:600;font-size:14px"></span>
    <div style="flex:1"></div>
    <button class="btn btn-success" id="btn-city-bulk-export">
      <i class="fas fa-file-excel"></i> Export XLSX
    </button>
    <button class="btn btn-danger" id="btn-city-bulk-delete">
      <i class="fas fa-trash"></i> Delete Selected
    </button>
    <button class="btn btn-secondary btn-sm" id="btn-city-bulk-cancel" title="Cancel">
      <i class="fas fa-xmark"></i>
    </button>
  </div>
  </div>`;
});

window._pageBinders['cities'] = async () => {
  // Pre-load states for dropdowns + filter
  try { _cityStates = await api('/api/states'); } catch (_) { _cityStates = []; }

  await loadCities();

  // Populate State filter dropdown
  const filterSel = $('#city-state-filter');
  if (filterSel) {
    _cityStates.forEach(s => {
      const opt = document.createElement('option');
      opt.value = s.StateID;
      opt.textContent = s.State;
      filterSel.appendChild(opt);
    });
    filterSel.onchange = applyCityFilters;
  }

  // Search
  $('#city-search').oninput = applyCityFilters;

  // Add New
  $('#btn-add-city').onclick = () => showAddCityModal();

  // Select-all
  $('#city-select-all').onchange = (e) => {
    $$('.city-row-chk').filter(c => c.closest('tr').style.display !== 'none')
      .forEach(c => { c.checked = e.target.checked; updateCityBulkBar(); });
  };

  // Bulk bar
  $('#btn-city-bulk-cancel').onclick = () => {
    $$('.city-row-chk').forEach(c => c.checked = false);
    $('#city-select-all').checked = false;
    updateCityBulkBar();
  };
  $('#btn-city-bulk-export').onclick = () => bulkExportCities();
  $('#btn-city-bulk-delete').onclick = () => bulkDeleteCities();
};

function applyCityFilters() {
  const q = ($('#city-search')?.value || '').toLowerCase();
  const stateId = $('#city-state-filter')?.value || '';
  $$('#tbl-city-body tr:not(.empty-row)').forEach(tr => {
    const matchText  = !q || tr.textContent.toLowerCase().includes(q);
    const matchState = !stateId || tr.dataset.stateId === stateId;
    tr.style.display = (matchText && matchState) ? '' : 'none';
  });
}

// Load and render cities table
async function loadCities() {
  const tbody = $('#tbl-city-body');
  if (!tbody) return;
  tbody.innerHTML = `<tr class="empty-row"><td colspan="5"><div class="spinner" style="margin:0 auto"></div></td></tr>`;

  let data;
  try {
    data = await api('/api/cities');
  } catch (e) {
    tbody.innerHTML = `<tr class="empty-row"><td colspan="5" style="color:var(--danger)">
      <i class="fas fa-circle-xmark"></i> Failed to load: ${e.message}</td></tr>`;
    return;
  }

  if (!data.length) {
    tbody.innerHTML = `<tr class="empty-row"><td colspan="5">No cities found.</td></tr>`;
    return;
  }

  // DB column for city name is "City" (not "CityName")
  tbody.innerHTML = data.map(d => {
    return `
    <tr data-id="${d.CityID}" data-state-id="${d.StateID || ''}" class="city-row">
      <td style="text-align:center">
        <input type="checkbox" class="city-row-chk" data-id="${d.CityID}"
          style="width:16px;height:16px;cursor:pointer;accent-color:var(--accent)">
      </td>
      <td style="color:var(--text-secondary);font-size:13px">${d.CityID}</td>
      <td>
        <span style="
          display:inline-flex;align-items:center;gap:6px;
          background:var(--accent-soft);color:var(--accent);
          border-radius:20px;padding:3px 10px;font-size:12px;font-weight:600">
          <i class="fas fa-map-marked-alt" style="font-size:10px"></i>
          ${d.StateName || '<span style="color:var(--text-muted);font-style:italic">&#8212;</span>'}
        </span>
      </td>
      <td>
        <span class="city-name-cell"
          data-id="${d.CityID}"
          data-name="${(d.City || '').replace(/"/g, '&quot;')}"
          data-state-id="${d.StateID || ''}"
          style="cursor:pointer;color:var(--text-primary);text-decoration:underline dotted;text-underline-offset:3px"
          title="Click to edit">${d.City}</span>
      </td>
      <td>
        <button class="btn btn-danger btn-sm" onclick="deleteCity(${d.CityID})" title="Delete">
          <i class="fas fa-trash"></i>
        </button>
      </td>
    </tr>`;
  }).join('');

  // Checkbox listeners
  $$('.city-row-chk').forEach(chk => {
    chk.onchange = () => { updateCityBulkBar(); syncCitySelectAll(); };
  });

  // Click-to-edit on city name cells
  $$('.city-name-cell').forEach(cell => {
    cell.onclick = () => showEditCityInline(
      parseInt(cell.dataset.id),
      cell.dataset.name,
      parseInt(cell.dataset.stateId) || null
    );
  });
}

function syncCitySelectAll() {
  const all = $$('.city-row-chk');
  const checked = all.filter(c => c.checked);
  const sa = $('#city-select-all');
  if (!sa) return;
  sa.checked = all.length > 0 && checked.length === all.length;
  sa.indeterminate = checked.length > 0 && checked.length < all.length;
}

function updateCityBulkBar() {
  const checked = $$('.city-row-chk:checked');
  const bar = $('#city-bulk-bar');
  if (!bar) return;
  if (checked.length > 0) {
    bar.style.display = 'flex';
    $('#city-sel-count').textContent = `${checked.length} row${checked.length > 1 ? 's' : ''} selected`;
  } else {
    bar.style.display = 'none';
  }
}

// Build State <option> HTML
function buildStateOptions(selectedId) {
  return _cityStates.map(s =>
    `<option value="${s.StateID}" ${s.StateID === selectedId ? 'selected' : ''}>${s.State}</option>`
  ).join('');
}

// Inline edit modal &#8212; click on City name
function showEditCityInline(id, currentName, currentStateId) {
  const existing = $('#city-inline-editor');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'city-inline-editor';
  overlay.innerHTML = `
    <div class="modal" style="max-width:460px;animation:slideUp 0.2s ease">
      <div class="modal-header">
        <h3><i class="fas fa-pen-to-square"></i> Edit City</h3>
        <button class="btn-close-modal" onclick="document.getElementById('city-inline-editor').remove()">
          <i class="fas fa-xmark"></i>
        </button>
      </div>
      <div class="modal-body">
        <div class="form-field" style="margin-bottom:16px">
          <label>City ID <span style="color:var(--text-muted);font-size:11px">(auto, not editable)</span></label>
          <input type="text" value="${id}" readonly
            style="background:var(--bg-dark);border:1px solid var(--border);border-radius:6px;
                   padding:9px 12px;color:var(--text-muted);width:100%;cursor:not-allowed;opacity:0.7"/>
        </div>
        <div class="form-field" style="margin-bottom:16px">
          <label>State <span style="color:var(--danger)">*</span></label>
          <select id="city-edit-state"
            style="background:var(--bg-dark);border:1px solid var(--border);border-radius:6px;
                   padding:9px 12px;color:var(--text-primary);width:100%;font-size:14px;cursor:pointer">
            <option value="">&#8212; Select State &#8212;</option>
            ${buildStateOptions(currentStateId)}
          </select>
        </div>
        <div class="form-field">
          <label>City Name <span style="color:var(--danger)">*</span></label>
          <input type="text" id="city-edit-name" value="${currentName}"
            style="background:var(--bg-dark);border:1px solid var(--border);border-radius:6px;
                   padding:9px 12px;color:var(--text-primary);width:100%;font-size:14px"
            placeholder="Enter city name" autofocus/>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="document.getElementById('city-inline-editor').remove()">Cancel</button>
        <button class="btn btn-primary" id="btn-city-inline-save">
          <i class="fas fa-floppy-disk"></i> Save
        </button>
      </div>
    </div>`;
  document.body.appendChild(overlay);

  const nameInp = $('#city-edit-name');
  nameInp.focus(); nameInp.select();
  nameInp.onkeydown = e => { if (e.key === 'Enter') doSaveCity(); };
  document.getElementById('btn-city-inline-save').onclick = doSaveCity;
  overlay.onclick = e => { if (e.target === overlay) overlay.remove(); };

  async function doSaveCity() {
    const name = nameInp.value.trim();
    const stateId = $('#city-edit-state').value;
    if (!name) return showToast('City name cannot be empty', 'error');
    if (!stateId) return showToast('Please select a State', 'error');
    try {
      await api(`/api/cities/${id}`, { method: 'PUT', body: { CityName: name, StateID: stateId } });
      overlay.remove();
      showToast('City updated successfully!', 'success');
      await loadCities();
    } catch (e) { showToast(e.message, 'error'); }
  }
}

// Add New City modal
async function showAddCityModal() {
  let nextId = '&#8212;';
  try {
    const data = await api('/api/cities');
    nextId = data.length ? Math.max(...data.map(d => d.CityID)) + 1 : 1;
  } catch (_) { }

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal" style="max-width:460px;animation:slideUp 0.2s ease">
      <div class="modal-header">
        <h3><i class="fas fa-plus-circle"></i> Add New City</h3>
        <button class="btn-close-modal" onclick="this.closest('.modal-overlay').remove()">
          <i class="fas fa-xmark"></i>
        </button>
      </div>
      <div class="modal-body">
        <div class="form-field" style="margin-bottom:16px">
          <label>City ID <span style="color:var(--text-muted);font-size:11px">(auto-assigned)</span></label>
          <input type="text" value="~${nextId}" readonly
            style="background:var(--bg-dark);border:1px dashed var(--border);border-radius:6px;
                   padding:9px 12px;color:var(--text-muted);width:100%;cursor:not-allowed;
                   font-style:italic;opacity:0.7"/>
        </div>
        <div class="form-field" style="margin-bottom:16px">
          <label>State <span style="color:var(--danger)">*</span></label>
          <select id="new-city-state"
            style="background:var(--bg-dark);border:1px solid var(--border);border-radius:6px;
                   padding:9px 12px;color:var(--text-primary);width:100%;font-size:14px;cursor:pointer">
            <option value="">&#8212; Select State &#8212;</option>
            ${buildStateOptions(null)}
          </select>
        </div>
        <div class="form-field">
          <label>City Name <span style="color:var(--danger)">*</span></label>
          <input type="text" id="new-city-name" autofocus
            style="background:var(--bg-dark);border:1px solid var(--border);border-radius:6px;
                   padding:9px 12px;color:var(--text-primary);width:100%;font-size:14px"
            placeholder="e.g. Puttaparthi, Rajamundry..."/>
        </div>
        <p style="font-size:12px;color:var(--text-muted);margin-top:10px">
          <i class="fas fa-circle-info" style="color:var(--info)"></i>
          City ID is auto-incremented by the database and cannot be set manually.
        </p>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
        <button class="btn btn-primary" id="btn-city-add-save">
          <i class="fas fa-plus"></i> Add City
        </button>
      </div>
    </div>`;
  document.body.appendChild(overlay);

  const nameInp = $('#new-city-name', overlay);
  nameInp.focus();
  nameInp.onkeydown = e => { if (e.key === 'Enter') doAdd(); };
  overlay.onclick = e => { if (e.target === overlay) overlay.remove(); };
  overlay.querySelector('#btn-city-add-save').onclick = doAdd;
  overlay.querySelector('.btn-close-modal').onclick = () => overlay.remove();

  async function doAdd() {
    const name = nameInp.value.trim();
    const stateId = overlay.querySelector('#new-city-state').value;
    if (!name) return showToast('City name is required', 'error');
    if (!stateId) return showToast('Please select a State', 'error');
    try {
      await api('/api/cities', { method: 'POST', body: { CityName: name, StateID: stateId } });
      overlay.remove();
      showToast('City added successfully!', 'success');
      await loadCities();
    } catch (e) { showToast(e.message, 'error'); }
  }
}

// Single Delete
window.deleteCity = async (id) => {
  if (!await confirm(`Delete City ID ${id}? This action cannot be undone.`)) return;
  try {
    await api(`/api/cities/${id}`, { method: 'DELETE' });
    showToast('City deleted successfully!', 'success');
    await loadCities();
    updateCityBulkBar();
  } catch (e) { showToast(e.message, 'error'); }
};

// Bulk Delete
async function bulkDeleteCities() {
  const ids = $$('.city-row-chk:checked').map(c => parseInt(c.dataset.id));
  if (!ids.length) return;
  if (!await confirm(`Delete ${ids.length} selected cit${ids.length > 1 ? 'ies' : 'y'}? This cannot be undone.`)) return;
  try {
    await api('/api/cities/bulk-delete', { method: 'POST', body: { ids } });
    showToast(`${ids.length} cit${ids.length > 1 ? 'ies' : 'y'} deleted!`, 'success');
    $('#city-select-all').checked = false;
    await loadCities();
    updateCityBulkBar();
  } catch (e) { showToast(e.message, 'error'); }
}

// Bulk Export XLSX
async function bulkExportCities() {
  const ids = $$('.city-row-chk:checked').map(c => parseInt(c.dataset.id));
  try {
    const res = await fetch('/api/cities/export-xlsx', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ ids })
    });
    if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cities_export_${new Date().toISOString().split('T')[0]}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`Exported ${ids.length} cit${ids.length > 1 ? 'ies' : 'y'} to XLSX!`, 'success');
  } catch (e) { showToast('Export failed: ' + e.message, 'error'); }
}

// ======== COURIER DETAILS (Full-Featured 18-Column) ========

let _crStates = [], _crCities = [];

registerPage('couriers', () => {
  const stickyL = `position:sticky;background:var(--bg-card);z-index:2`;
  return `${pageHeader('Courier Details', 'fa-motorcycle', 'Masters / Courier Details',
    `<button class="btn btn-primary" id="btn-add-courier"><i class="fas fa-plus"></i> Add New</button>`)}
  <div class="card">
    <div class="search-bar">
      <div class="search-input-wrap"><i class="fas fa-search"></i>
        <input type="text" id="courier-search" placeholder="Search courier, city, state...">
      </div>
    </div>
    <div class="table-wrapper" style="overflow-x:auto">
      <table id="tbl-courier-main" style="min-width:2200px;border-collapse:collapse">
        <thead><tr>
          <th style="${stickyL};left:0;width:42px;text-align:center">
            <input type="checkbox" id="courier-select-all"
              style="width:16px;height:16px;cursor:pointer;accent-color:var(--accent)">
          </th>
          <th style="${stickyL};left:42px;width:85px">Courier ID</th>
          <th style="${stickyL};left:127px;width:180px">Courier Name</th>
          <th style="width:120px">Mob</th>
          <th style="width:160px">Address 1</th>
          <th style="width:160px">Address 2</th>
          <th style="width:130px">State</th>
          <th style="width:130px">City</th>
          <th style="width:80px">Pin</th>
          <th style="width:120px">PAN</th>
          <th style="width:140px">Aadhar No</th>
          <th style="width:150px">GST No</th>
          <th style="width:150px">Bank Name</th>
          <th style="width:160px">Bank Acc No</th>
          <th style="width:120px">IFSC Code</th>
          <th style="width:80px">State ID</th>
          <th style="width:80px">City ID</th>
          <th style="width:200px">Courier Link</th>
          <th style="${stickyL};right:0;width:90px;text-align:center">Actions</th>
        </tr></thead>
        <tbody id="tbl-courier-body">
          <tr class="empty-row"><td colspan="19"><div class="spinner" style="margin:0 auto"></div></td></tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- Bulk bar -->
  <div id="courier-bulk-bar" style="display:none;position:fixed;bottom:28px;left:50%;transform:translateX(-50%);
    background:var(--bg-card);border:1px solid var(--accent);border-radius:12px;padding:12px 24px;
    z-index:500;box-shadow:0 8px 32px rgba(0,0,0,.5);align-items:center;gap:16px;min-width:380px">
    <span id="courier-sel-count" style="color:var(--accent);font-weight:600;font-size:14px"></span>
    <div style="flex:1"></div>
    <button class="btn btn-success" id="btn-courier-bulk-export"><i class="fas fa-file-excel"></i> Export XLSX</button>
    <button class="btn btn-danger"  id="btn-courier-bulk-delete"><i class="fas fa-trash"></i> Delete Selected</button>
    <button class="btn btn-secondary btn-sm" id="btn-courier-bulk-cancel"><i class="fas fa-xmark"></i></button>
  </div>
  </div>`;
});

window._pageBinders['couriers'] = async () => {
  try {
    [_crStates, _crCities] = await Promise.all([api('/api/states'), api('/api/cities')]);
  } catch(_) {}
  await loadCouriers();
  $('#courier-search').oninput = () => {
    const q = ($('#courier-search')?.value || '').toLowerCase();
    $$('#tbl-courier-body tr:not(.empty-row)').forEach(tr => {
      tr.style.display = !q || tr.textContent.toLowerCase().includes(q) ? '' : 'none';
    });
  };
  $('#courier-select-all').onchange = e => {
    $$('.cr-row-chk').filter(c => c.closest('tr').style.display !== 'none')
      .forEach(c => { c.checked = e.target.checked; }); updateCourierBulkBar();
  };
  $('#btn-add-courier').onclick = () => showAddCourierModal();
  $('#btn-courier-bulk-cancel').onclick = () => {
    $$('.cr-row-chk').forEach(c => c.checked = false);
    $('#courier-select-all').checked = false; updateCourierBulkBar();
  };
  $('#btn-courier-bulk-export').onclick = () => bulkExportCouriers();
  $('#btn-courier-bulk-delete').onclick  = () => bulkDeleteCouriers();
};

function syncCourierSelectAll() {
  const all = $$('.cr-row-chk'), checked = all.filter(c => c.checked);
  const sa = $('#courier-select-all'); if (!sa) return;
  sa.checked = all.length > 0 && checked.length === all.length;
  sa.indeterminate = checked.length > 0 && checked.length < all.length;
}
function updateCourierBulkBar() {
  const checked = $$('.cr-row-chk:checked');
  const bar = $('#courier-bulk-bar'); if (!bar) return;
  if (checked.length > 0) {
    bar.style.display = 'flex';
    $('#courier-sel-count').textContent = `${checked.length} row${checked.length > 1 ? 's' : ''} selected`;
  } else { bar.style.display = 'none'; }
}

async function loadCouriers() {
  const tbody = $('#tbl-courier-body'); if (!tbody) return;
  tbody.innerHTML = `<tr class="empty-row"><td colspan="19"><div class="spinner" style="margin:0 auto"></div></td></tr>`;
  let data;
  try { data = await api('/api/couriers'); }
  catch(e) {
    tbody.innerHTML = `<tr class="empty-row"><td colspan="19" style="color:var(--danger)">
      <i class="fas fa-circle-xmark"></i> Failed: ${e.message}</td></tr>`;
    return;
  }
  if (!data.length) { tbody.innerHTML = `<tr class="empty-row"><td colspan="19">No couriers found.</td></tr>`; return; }

  const stickyL = `position:sticky;background:var(--bg-card);z-index:1`;
  tbody.innerHTML = data.map(d => {
    return `
    <tr data-id="${d.CourierId}" class="cr-row">
      <td style="${stickyL};left:0;text-align:center">
        <input type="checkbox" class="cr-row-chk" data-id="${d.CourierId}"
          style="width:16px;height:16px;cursor:pointer;accent-color:var(--accent)">
      </td>
      <td style="${stickyL};left:42px;color:var(--text-secondary);font-size:13px">${d.CourierId}</td>
      <td style="${stickyL};left:127px">
        <span class="cr-edit-cell" data-id="${d.CourierId}"
          style="cursor:pointer;text-decoration:underline dotted;text-underline-offset:3px;font-weight:600"
          title="Click to edit">${d.Name || '&mdash;'}</span>
      </td>
      <td>${d.Mob || '&mdash;'}</td>
      <td style="font-size:12px">${d.Addr1 || '&mdash;'}</td>
      <td style="font-size:12px">${d.Addr2 || '&mdash;'}</td>
      <td>${d.StateName || d.State || '&mdash;'}</td>
      <td>${d.CityName  || d.City  || '&mdash;'}</td>
      <td>${d.Pin || '&mdash;'}</td>
      <td style="font-size:12px">${d.PAN || '&mdash;'}</td>
      <td style="font-size:12px">${d.AadharNo || '&mdash;'}</td>
      <td style="font-size:12px">${d.GstNo || '&mdash;'}</td>
      <td>${d.BankName || '&mdash;'}</td>
      <td style="font-size:12px">${d.BankAccNo || '&mdash;'}</td>
      <td style="font-size:12px">${d.IFSCCode || '&mdash;'}</td>
      <td style="color:var(--text-secondary);font-size:12px">${d.StateID || '&mdash;'}</td>
      <td style="color:var(--text-secondary);font-size:12px">${d.CityID || '&mdash;'}</td>
      <td style="font-size:12px;max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
        ${d.CourierLink
          ? `<a href="${d.CourierLink}" target="_blank" rel="noopener"
               style="color:var(--accent);text-decoration:underline">${d.CourierLink}</a>`
          : '&mdash;'}
      </td>
      <td style="${stickyL};right:0;text-align:center">
        <button class="btn btn-danger btn-sm" onclick="deleteCourier(${d.CourierId})" title="Delete">
          <i class="fas fa-trash"></i></button>
      </td>
    </tr>`;
  }).join('');

  $$('.cr-row-chk').forEach(chk => {
    chk.onchange = () => { updateCourierBulkBar(); syncCourierSelectAll(); };
  });
  $$('.cr-edit-cell').forEach(cell => {
    cell.onclick = () => {
      const row = data.find(d => d.CourierId === parseInt(cell.dataset.id));
      if (row) showEditCourierModal(row);
    };
  });
}

/* ---- modal helpers ---- */
function _crSS() {
  return `style="background:var(--bg-dark);border:1px solid var(--border);border-radius:6px;
          padding:8px 12px;color:var(--text-primary);width:100%;font-size:13.5px;cursor:pointer"`;
}
function _crIS() {
  return `style="background:var(--bg-dark);border:1px solid var(--border);border-radius:6px;
          padding:8px 12px;color:var(--text-primary);width:100%;font-size:13.5px"`;
}
function _crStateOpts(selId) {
  return `<option value="">&#8212; Select State &#8212;</option>${_crStates.map(s =>
    `<option value="${s.StateID}" ${s.StateID == selId ? 'selected' : ''}>${s.State}</option>`).join('')}`;
}
function _crCityOpts(selId, selStateId) {
  const filtered = selStateId ? _crCities.filter(c => c.StateId == selStateId || c.StateID == selStateId) : _crCities;
  return `<option value="">&#8212; Select City &#8212;</option>${filtered.map(c =>
    `<option value="${c.CityID}" ${c.CityID == selId ? 'selected' : ''}>${c.City}</option>`).join('')}`;
}

function _crModalBody(rec = {}) {
  const si = _crIS(), ss = _crSS();
  return `
    <div class="form-field" style="margin-bottom:14px">
      <label>Courier ID <span style="color:var(--text-muted);font-size:11px">(auto)</span></label>
      <input type="text" value="${rec.CourierId || '~auto'}" readonly
        style="background:var(--bg-dark);border:1px dashed var(--border);border-radius:6px;
               padding:8px 12px;color:var(--text-muted);width:100%;cursor:not-allowed;opacity:0.65;font-style:italic"/>
    </div>
    <div class="form-row cols-2" style="gap:12px;margin-bottom:12px">
      <div class="form-field"><label>Courier Name <span style="color:var(--danger)">*</span></label>
        <input type="text" id="cr-name" value="${rec.Name||''}" ${si} placeholder="e.g. BlueDart"/></div>
      <div class="form-field"><label>Mob</label>
        <input type="tel" id="cr-mob" value="${rec.Mob||''}" ${si} placeholder="10-digit mobile"/></div>
    </div>
    <div class="form-row cols-2" style="gap:12px;margin-bottom:12px">
      <div class="form-field"><label>Address 1</label>
        <input type="text" id="cr-a1" value="${rec.Addr1||''}" ${si}/></div>
      <div class="form-field"><label>Address 2</label>
        <input type="text" id="cr-a2" value="${rec.Addr2||''}" ${si}/></div>
    </div>
    <div class="form-row cols-3" style="gap:12px;margin-bottom:12px">
      <div class="form-field"><label>State</label>
        <select id="cr-state" ${ss}>${_crStateOpts(rec.StateID)}</select></div>
      <div class="form-field"><label>City</label>
        <select id="cr-city" ${ss}>${_crCityOpts(rec.CityID, rec.StateID)}</select></div>
      <div class="form-field"><label>Pin</label>
        <input type="number" id="cr-pin" value="${rec.Pin||''}" ${si} placeholder="6-digit" min="0" step="1"/></div>
    </div>
    <div class="form-row cols-3" style="gap:12px;margin-bottom:12px">
      <div class="form-field"><label>PAN</label>
        <input type="text" id="cr-pan" value="${rec.PAN||''}" ${si} placeholder="ABCDE1234F"/></div>
      <div class="form-field"><label>Aadhar No</label>
        <input type="number" id="cr-aadhar" value="${rec.AadharNo||''}" ${si} placeholder="12-digit" min="0" step="1"/></div>
      <div class="form-field"><label>GST No</label>
        <input type="text" id="cr-gst" value="${rec.GstNo||''}" ${si} placeholder="15-char GST"/></div>
    </div>
    <div class="form-row cols-3" style="gap:12px;margin-bottom:4px">
      <div class="form-field"><label>Bank Name</label>
        <input type="text" id="cr-bank" value="${rec.BankName||''}" ${si}/></div>
      <div class="form-field"><label>Bank Acc No</label>
        <input type="number" id="cr-bankac" value="${rec.BankAccNo||''}" ${si} min="0" step="1"/></div>
      <div class="form-field"><label>IFSC Code</label>
        <input type="text" id="cr-ifsc" value="${rec.IFSCCode||''}" ${si} placeholder="SBIN0001234"/></div>
    </div>
    <div class="form-field" style="margin-top:10px">
      <label>Courier Link <span style="color:var(--text-muted);font-size:11px">(optional)</span></label>
      <input type="text" id="cr-link" value="${rec.CourierLink||''}" ${si}
        placeholder="https://track.courier.com/..."/>
    </div>`;
}

function _collectCrForm(ov) {
  const stateId = ov.querySelector('#cr-state').value;
  const cityId  = ov.querySelector('#cr-city').value;
  const stateRec = _crStates.find(s => s.StateID == stateId);
  const cityRec  = _crCities.find(c => c.CityID  == cityId);
  return {
    Name:        ov.querySelector('#cr-name').value.trim(),
    Mob:         ov.querySelector('#cr-mob').value.trim(),
    Addr1:       ov.querySelector('#cr-a1').value.trim(),
    Addr2:       ov.querySelector('#cr-a2').value.trim(),
    State:       stateRec ? stateRec.State : '',
    City:        cityRec  ? cityRec.City   : '',
    Pin:         ov.querySelector('#cr-pin').value.trim(),
    PAN:         ov.querySelector('#cr-pan').value.trim(),
    AadharNo:    ov.querySelector('#cr-aadhar').value.trim(),
    GstNo:       ov.querySelector('#cr-gst').value.trim(),
    BankName:    ov.querySelector('#cr-bank').value.trim(),
    BankAccNo:   ov.querySelector('#cr-bankac').value.trim(),
    IFSCCode:    ov.querySelector('#cr-ifsc').value.trim(),
    StateID:     stateId || null,
    CityID:      cityId  || null,
    CourierLink: ov.querySelector('#cr-link')?.value.trim() || null,
  };
}

function _bindCrStateCityFilter(ov) {
  const stateEl = ov.querySelector('#cr-state');
  const cityEl  = ov.querySelector('#cr-city');
  if (!stateEl || !cityEl) return;
  stateEl.onchange = () => {
    const sid = stateEl.value;
    cityEl.innerHTML = _crCityOpts('', sid);
  };
}

async function showAddCourierModal() {
  const ov = document.createElement('div');
  ov.className = 'modal-overlay';
  ov.innerHTML = `
    <div class="modal" style="max-width:640px;animation:slideUp 0.2s ease">
      <div class="modal-header">
        <h3><i class="fas fa-plus-circle"></i> Add Courier</h3>
        <button class="btn-close-modal" onclick="this.closest('.modal-overlay').remove()">
          <i class="fas fa-xmark"></i></button>
      </div>
      <div class="modal-body" style="max-height:65vh;overflow-y:auto">${_crModalBody()}</div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
        <button class="btn btn-primary" id="btn-cr-add-save">
          <i class="fas fa-motorcycle"></i> Add Courier Details</button>
      </div>
    </div>`;
  document.body.appendChild(ov);
  ov.onclick = e => { if (e.target === ov) ov.remove(); };
  _bindCrStateCityFilter(ov);
  ov.querySelector('#btn-cr-add-save').onclick = async () => {
    const b = _collectCrForm(ov);
    if (!b.Name) return showToast('Courier Name is required', 'error');
    try {
      await api('/api/couriers', { method: 'POST', body: b });
      ov.remove(); showToast('Courier added!', 'success'); await loadCouriers();
    } catch(e) { showToast(e.message, 'error'); }
  };
}

function showEditCourierModal(rec) {
  const existing = $('#cr-edit-modal'); if (existing) existing.remove();
  const ov = document.createElement('div');
  ov.className = 'modal-overlay'; ov.id = 'cr-edit-modal';
  ov.innerHTML = `
    <div class="modal" style="max-width:640px;animation:slideUp 0.2s ease">
      <div class="modal-header">
        <h3><i class="fas fa-pen-to-square"></i> Edit Courier #${rec.CourierId}</h3>
        <button class="btn-close-modal" onclick="document.getElementById('cr-edit-modal').remove()">
          <i class="fas fa-xmark"></i></button>
      </div>
      <div class="modal-body" style="max-height:65vh;overflow-y:auto">${_crModalBody(rec)}</div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="document.getElementById('cr-edit-modal').remove()">Cancel</button>
        <button class="btn btn-primary" id="btn-cr-edit-save">
          <i class="fas fa-floppy-disk"></i> Save</button>
      </div>
    </div>`;
  document.body.appendChild(ov);
  ov.onclick = e => { if (e.target === ov) ov.remove(); };
  _bindCrStateCityFilter(ov);
  ov.querySelector('#btn-cr-edit-save').onclick = async () => {
    const b = _collectCrForm(ov);
    if (!b.Name) return showToast('Courier Name is required', 'error');
    try {
      await api(`/api/couriers/${rec.CourierId}`, { method: 'PUT', body: b });
      ov.remove(); showToast('Courier updated!', 'success'); await loadCouriers();
    } catch(e) { showToast(e.message, 'error'); }
  };
}

window.deleteCourier = async (id) => {
  if (!await confirm(`Delete Courier #${id}? This cannot be undone.`)) return;
  try {
    await api(`/api/couriers/${id}`, { method: 'DELETE' });
    showToast('Courier deleted!', 'success'); await loadCouriers(); updateCourierBulkBar();
  } catch(e) { showToast(e.message, 'error'); }
};

async function bulkDeleteCouriers() {
  const ids = $$('.cr-row-chk:checked').map(c => parseInt(c.dataset.id));
  if (!ids.length) return;
  if (!await confirm(`Delete ${ids.length} courier(s)? This cannot be undone.`)) return;
  try {
    await api('/api/couriers/bulk-delete', { method: 'POST', body: { ids } });
    showToast(`${ids.length} courier(s) deleted!`, 'success');
    $('#courier-select-all').checked = false; await loadCouriers(); updateCourierBulkBar();
  } catch(e) { showToast(e.message, 'error'); }
}

async function bulkExportCouriers() {
  const ids = $$('.cr-row-chk:checked').map(c => parseInt(c.dataset.id));
  try {
    const res = await fetch('/api/couriers/export-xlsx', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      credentials: 'include', body: JSON.stringify({ ids })
    });
    if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `couriers_${new Date().toISOString().split('T')[0]}.xlsx`;
    a.click(); URL.revokeObjectURL(url);
    showToast(`Exported ${ids.length || 'all'} courier(s) to XLSX!`, 'success');
  } catch(e) { showToast('Export failed: ' + e.message, 'error'); }
}


// ======== KISNA REGION STATE MASTER (Full-Featured) ========

registerPage('kisna-region', () => {
  return `${pageHeader('Kisna Region State', 'fa-globe-asia', 'Masters / Kisna Region State',
    `<button class="btn btn-primary" id="btn-add-krs"><i class="fas fa-plus"></i>  Add New</button>`)}
  <div class="card">
    <div class="search-bar">
      <div class="search-input-wrap">
        <i class="fas fa-search"></i>
        <input type="text" id="krs-search" placeholder="Search region, state, code...">
      </div>
    </div>
    <div class="table-wrapper">
      <table id="tbl-krs-main">
        <thead>
          <tr>
            <th style="width:42px;text-align:center">
              <input type="checkbox" id="krs-select-all" title="Select all"
                style="width:16px;height:16px;cursor:pointer;accent-color:var(--accent)">
            </th>
            <th style="width:80px">ID</th>
            <th style="width:160px">Region</th>
            <th>State</th>
            <th style="width:140px">State Code</th>
            <th style="width:100px">Actions</th>
          </tr>
        </thead>
        <tbody id="tbl-krs-body">
          <tr class="empty-row"><td colspan="6"><div class="spinner" style="margin:0 auto"></div></td></tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- Floating bulk-action bar -->
  <div id="krs-bulk-bar" style="
    display:none; position:fixed; bottom:28px; left:50%; transform:translateX(-50%);
    background:var(--bg-card); border:1px solid var(--accent); border-radius:12px;
    padding:12px 24px; z-index:500; box-shadow:0 8px 32px rgba(0,0,0,0.5);
    align-items:center; gap:16px; min-width:380px;">
    <span id="krs-sel-count" style="color:var(--accent);font-weight:600;font-size:14px"></span>
    <div style="flex:1"></div>
    <button class="btn btn-success" id="btn-krs-bulk-export">
      <i class="fas fa-file-excel"></i> Export XLSX
    </button>
    <button class="btn btn-danger" id="btn-krs-bulk-delete">
      <i class="fas fa-trash"></i> Delete Selected
    </button>
    <button class="btn btn-secondary btn-sm" id="btn-krs-bulk-cancel" title="Cancel">
      <i class="fas fa-xmark"></i>
    </button>
  </div>
  </div>`;
});

window._pageBinders['kisna-region'] = async () => {
  await loadKRS();

  // Search
  $('#krs-search').oninput = () => {
    const q = $('#krs-search').value.toLowerCase();
    $$('#tbl-krs-body tr:not(.empty-row)').forEach(tr => {
      tr.style.display = tr.textContent.toLowerCase().includes(q) ? '' : 'none';
    });
  };

  // Add New
  $('#btn-add-krs').onclick = () => showAddKRSModal();

  // Select-all
  $('#krs-select-all').onchange = (e) => {
    $$('.krs-row-chk').filter(c => c.closest('tr').style.display !== 'none')
      .forEach(c => { c.checked = e.target.checked; updateKRSBulkBar(); });
  };

  // Bulk bar
  $('#btn-krs-bulk-cancel').onclick = () => {
    $$('.krs-row-chk').forEach(c => c.checked = false);
    $('#krs-select-all').checked = false;
    updateKRSBulkBar();
  };
  $('#btn-krs-bulk-export').onclick = () => bulkExportKRS();
  $('#btn-krs-bulk-delete').onclick  = () => bulkDeleteKRS();
};

async function loadKRS() {
  const tbody = $('#tbl-krs-body');
  if (!tbody) return;
  tbody.innerHTML = `<tr class="empty-row"><td colspan="6"><div class="spinner" style="margin:0 auto"></div></td></tr>`;

  let data;
  try {
    data = await api('/api/kisna-region-states');
  } catch (e) {
    tbody.innerHTML = `<tr class="empty-row"><td colspan="6" style="color:var(--danger)">
      <i class="fas fa-circle-xmark"></i> Failed to load: ${e.message}</td></tr>`;
    return;
  }

  if (!data.length) {
    tbody.innerHTML = `<tr class="empty-row"><td colspan="6">No records found.</td></tr>`;
    return;
  }

  tbody.innerHTML = data.map(d => {
    return `
    <tr data-id="${d.ID}" class="krs-row">
      <td style="text-align:center">
        <input type="checkbox" class="krs-row-chk" data-id="${d.ID}"
          style="width:16px;height:16px;cursor:pointer;accent-color:var(--accent)">
      </td>
      <td style="color:var(--text-secondary);font-size:13px">${d.ID}</td>
      <td>
        <span class="krs-region-cell"
          data-id="${d.ID}"
          data-region="${(d.Region || '').replace(/"/g, '&quot;')}"
          data-state="${(d.State || '').replace(/"/g, '&quot;')}"
          data-code="${(d.StateCode || '').replace(/"/g, '&quot;')}"
          style="cursor:pointer;color:var(--text-primary);text-decoration:underline dotted;text-underline-offset:3px"
          title="Click to edit">${d.Region || ''}</span>
      </td>
      <td>${d.State || ''}</td>
      <td>
        <span style="
          display:inline-flex;align-items:center;gap:6px;
          background:var(--accent-soft);color:var(--accent);
          border-radius:20px;padding:3px 10px;font-size:12px;font-weight:600">
          ${d.StateCode || '<span style="color:var(--text-muted);font-style:italic">&#8212;</span>'}
        </span>
      </td>
      <td>
        <button class="btn btn-danger btn-sm" onclick="deleteKRS(${d.ID})" title="Delete">
          <i class="fas fa-trash"></i>
        </button>
      </td>
    </tr>`;
  }).join('');

  // Checkbox listeners
  $$('.krs-row-chk').forEach(chk => {
    chk.onchange = () => { updateKRSBulkBar(); syncKRSSelectAll(); };
  });

  // Click-to-edit
  $$('.krs-region-cell').forEach(cell => {
    cell.onclick = () => showEditKRSInline(
      parseInt(cell.dataset.id),
      cell.dataset.region,
      cell.dataset.state,
      cell.dataset.code
    );
  });
}

function syncKRSSelectAll() {
  const all = $$('.krs-row-chk');
  const checked = all.filter(c => c.checked);
  const sa = $('#krs-select-all');
  if (!sa) return;
  sa.checked = all.length > 0 && checked.length === all.length;
  sa.indeterminate = checked.length > 0 && checked.length < all.length;
}

function updateKRSBulkBar() {
  const checked = $$('.krs-row-chk:checked');
  const bar = $('#krs-bulk-bar');
  if (!bar) return;
  if (checked.length > 0) {
    bar.style.display = 'flex';
    $('#krs-sel-count').textContent = `${checked.length} row${checked.length > 1 ? 's' : ''} selected`;
  } else {
    bar.style.display = 'none';
  }
}

// Inline edit modal
function showEditKRSInline(id, curRegion, curState, curCode) {
  const existing = $('#krs-inline-editor');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'krs-inline-editor';
  overlay.innerHTML = `
    <div class="modal" style="max-width:480px;animation:slideUp 0.2s ease">
      <div class="modal-header">
        <h3><i class="fas fa-pen-to-square"></i> Edit Kisna Region State</h3>
        <button class="btn-close-modal" onclick="document.getElementById('krs-inline-editor').remove()">
          <i class="fas fa-xmark"></i>
        </button>
      </div>
      <div class="modal-body">
        <div class="form-field" style="margin-bottom:16px">
          <label>ID <span style="color:var(--text-muted);font-size:11px">(auto, not editable)</span></label>
          <input type="text" value="${id}" readonly
            style="background:var(--bg-dark);border:1px solid var(--border);border-radius:6px;
                   padding:9px 12px;color:var(--text-muted);width:100%;cursor:not-allowed;opacity:0.7"/>
        </div>
        <div class="form-field" style="margin-bottom:16px">
          <label>Region <span style="color:var(--danger)">*</span></label>
          <input type="text" id="krs-edit-region" value="${curRegion}"
            style="background:var(--bg-dark);border:1px solid var(--border);border-radius:6px;
                   padding:9px 12px;color:var(--text-primary);width:100%;font-size:14px"
            placeholder="e.g. North-1A" autofocus/>
        </div>
        <div class="form-field" style="margin-bottom:16px">
          <label>State <span style="color:var(--danger)">*</span></label>
          <input type="text" id="krs-edit-state" value="${curState}"
            style="background:var(--bg-dark);border:1px solid var(--border);border-radius:6px;
                   padding:9px 12px;color:var(--text-primary);width:100%;font-size:14px"
            placeholder="e.g. Delhi, Haryana"/>
        </div>
        <div class="form-field">
          <label>State Code <span style="color:var(--danger)">*</span></label>
          <input type="text" id="krs-edit-code" value="${curCode}"
            style="background:var(--bg-dark);border:1px solid var(--border);border-radius:6px;
                   padding:9px 12px;color:var(--text-primary);width:100%;font-size:14px"
            placeholder="e.g. DL-A, HR"/>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="document.getElementById('krs-inline-editor').remove()">Cancel</button>
        <button class="btn btn-primary" id="btn-krs-inline-save">
          <i class="fas fa-floppy-disk"></i> Save
        </button>
      </div>
    </div>`;
  document.body.appendChild(overlay);

  const regionInp = $('#krs-edit-region');
  regionInp.focus();
  document.getElementById('btn-krs-inline-save').onclick = doSave;
  overlay.onclick = e => { if (e.target === overlay) overlay.remove(); };

  async function doSave() {
    const Region    = regionInp.value.trim();
    const State     = $('#krs-edit-state').value.trim();
    const StateCode = $('#krs-edit-code').value.trim();
    if (!Region)    return showToast('Region cannot be empty', 'error');
    if (!State)     return showToast('State cannot be empty', 'error');
    if (!StateCode) return showToast('State Code cannot be empty', 'error');
    try {
      await api(`/api/kisna-region-states/${id}`, { method: 'PUT', body: { Region, State, StateCode } });
      overlay.remove();
      showToast('Record updated successfully!', 'success');
      await loadKRS();
    } catch (e) { showToast(e.message, 'error'); }
  }
}

// Add New modal
async function showAddKRSModal() {
  let nextId = '&#8212;';
  try {
    const data = await api('/api/kisna-region-states');
    nextId = data.length ? Math.max(...data.map(d => d.ID)) + 1 : 1;
  } catch (_) { }

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal" style="max-width:480px;animation:slideUp 0.2s ease">
      <div class="modal-header">
        <h3><i class="fas fa-plus-circle"></i> Add Kisna Region State</h3>
        <button class="btn-close-modal" onclick="this.closest('.modal-overlay').remove()">
          <i class="fas fa-xmark"></i>
        </button>
      </div>
      <div class="modal-body">
        <div class="form-field" style="margin-bottom:16px">
          <label>ID <span style="color:var(--text-muted);font-size:11px">(auto-assigned)</span></label>
          <input type="text" value="~${nextId}" readonly
            style="background:var(--bg-dark);border:1px dashed var(--border);border-radius:6px;
                   padding:9px 12px;color:var(--text-muted);width:100%;cursor:not-allowed;
                   font-style:italic;opacity:0.7"/>
        </div>
        <div class="form-field" style="margin-bottom:16px">
          <label>Region <span style="color:var(--danger)">*</span></label>
          <input type="text" id="new-krs-region" autofocus
            style="background:var(--bg-dark);border:1px solid var(--border);border-radius:6px;
                   padding:9px 12px;color:var(--text-primary);width:100%;font-size:14px"
            placeholder="e.g. North-1A, West-1"/>
        </div>
        <div class="form-field" style="margin-bottom:16px">
          <label>State <span style="color:var(--danger)">*</span></label>
          <input type="text" id="new-krs-state"
            style="background:var(--bg-dark);border:1px solid var(--border);border-radius:6px;
                   padding:9px 12px;color:var(--text-primary);width:100%;font-size:14px"
            placeholder="e.g. Delhi, Maharashtra-A"/>
        </div>
        <div class="form-field">
          <label>State Code <span style="color:var(--danger)">*</span></label>
          <input type="text" id="new-krs-code"
            style="background:var(--bg-dark);border:1px solid var(--border);border-radius:6px;
                   padding:9px 12px;color:var(--text-primary);width:100%;font-size:14px"
            placeholder="e.g. DL-A, MH-A"/>
        </div>
        <p style="font-size:12px;color:var(--text-muted);margin-top:10px">
          <i class="fas fa-circle-info" style="color:var(--info)"></i>
          ID is auto-incremented by the database and cannot be set manually.
        </p>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
        <button class="btn btn-primary" id="btn-krs-add-save">
          <i class="fas fa-plus"></i> Add
        </button>
      </div>
    </div>`;
  document.body.appendChild(overlay);

  overlay.onclick = e => { if (e.target === overlay) overlay.remove(); };
  overlay.querySelector('.btn-close-modal').onclick = () => overlay.remove();
  overlay.querySelector('#btn-krs-add-save').onclick = doAdd;

  async function doAdd() {
    const Region    = overlay.querySelector('#new-krs-region').value.trim();
    const State     = overlay.querySelector('#new-krs-state').value.trim();
    const StateCode = overlay.querySelector('#new-krs-code').value.trim();
    if (!Region)    return showToast('Region is required', 'error');
    if (!State)     return showToast('State is required', 'error');
    if (!StateCode) return showToast('State Code is required', 'error');
    try {
      await api('/api/kisna-region-states', { method: 'POST', body: { Region, State, StateCode } });
      overlay.remove();
      showToast('Record added successfully!', 'success');
      await loadKRS();
    } catch (e) { showToast(e.message, 'error'); }
  }
}

// Single Delete
window.deleteKRS = async (id) => {
  if (!await confirm(`Delete ID ${id}? This action cannot be undone.`)) return;
  try {
    await api(`/api/kisna-region-states/${id}`, { method: 'DELETE' });
    showToast('Record deleted!', 'success');
    await loadKRS();
    updateKRSBulkBar();
  } catch (e) { showToast(e.message, 'error'); }
};

// Bulk Delete
async function bulkDeleteKRS() {
  const ids = $$('.krs-row-chk:checked').map(c => parseInt(c.dataset.id));
  if (!ids.length) return;
  if (!await confirm(`Delete ${ids.length} selected record(s)? This cannot be undone.`)) return;
  try {
    await api('/api/kisna-region-states/bulk-delete', { method: 'POST', body: { ids } });
    showToast(`${ids.length} record(s) deleted!`, 'success');
    $('#krs-select-all').checked = false;
    await loadKRS();
    updateKRSBulkBar();
  } catch (e) { showToast(e.message, 'error'); }
}

// Bulk Export XLSX
async function bulkExportKRS() {
  const ids = $$('.krs-row-chk:checked').map(c => parseInt(c.dataset.id));
  try {
    const res = await fetch('/api/kisna-region-states/export-xlsx', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ ids })
    });
    if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kisna_region_state_${new Date().toISOString().split('T')[0]}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`Exported ${ids.length} record(s) to XLSX!`, 'success');
  } catch (e) { showToast('Export failed: ' + e.message, 'error'); }
}

// ======== CATEGORY / ITEM CATEGORY CODE MASTER ========

registerPage('category-codes', () => {
  return `${pageHeader('Category / Item Category Code', 'fa-barcode', 'Masters / Category & Item Code',
    `<button class="btn btn-primary" id="btn-add-catcode"><i class="fas fa-plus"></i>  Add New</button>`)}
  <div class="card">
    <div class="search-bar">
      <div class="search-input-wrap">
        <i class="fas fa-search"></i>
        <input type="text" id="catcode-search" placeholder="Search category code, item category...">
      </div>
    </div>
    <div class="table-wrapper">
      <table id="tbl-catcode-main">
        <thead>
          <tr>
            <th style="width:42px;text-align:center">
              <input type="checkbox" id="catcode-select-all" title="Select all"
                style="width:16px;height:16px;cursor:pointer;accent-color:var(--accent)">
            </th>
            <th style="width:80px">ID</th>
            <th>Item Category Code</th>
            <th style="width:200px">Category Code</th>
            <th style="width:100px">Actions</th>
          </tr>
        </thead>
        <tbody id="tbl-catcode-body">
          <tr class="empty-row"><td colspan="5"><div class="spinner" style="margin:0 auto"></div></td></tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- Floating bulk-action bar -->
  <div id="catcode-bulk-bar" style="
    display:none; position:fixed; bottom:28px; left:50%; transform:translateX(-50%);
    background:var(--bg-card); border:1px solid var(--accent); border-radius:12px;
    padding:12px 24px; z-index:500; box-shadow:0 8px 32px rgba(0,0,0,0.5);
    align-items:center; gap:16px; min-width:380px;">
    <span id="catcode-sel-count" style="color:var(--accent);font-weight:600;font-size:14px"></span>
    <div style="flex:1"></div>
    <button class="btn btn-success" id="btn-catcode-bulk-export">
      <i class="fas fa-file-excel"></i> Export XLSX
    </button>
    <button class="btn btn-danger" id="btn-catcode-bulk-delete">
      <i class="fas fa-trash"></i> Delete Selected
    </button>
    <button class="btn btn-secondary btn-sm" id="btn-catcode-bulk-cancel" title="Cancel">
      <i class="fas fa-xmark"></i>
    </button>
  </div>
  </div>`;
});

window._pageBinders['category-codes'] = async () => {
  await loadCatCodes();

  // Search
  $('#catcode-search').oninput = () => {
    const q = $('#catcode-search').value.toLowerCase();
    $$('#tbl-catcode-body tr:not(.empty-row)').forEach(tr => {
      tr.style.display = tr.textContent.toLowerCase().includes(q) ? '' : 'none';
    });
  };

  // Add New
  $('#btn-add-catcode').onclick = () => showAddCatCodeModal();

  // Select-all
  $('#catcode-select-all').onchange = (e) => {
    $$('.catcode-row-chk').filter(c => c.closest('tr').style.display !== 'none')
      .forEach(c => { c.checked = e.target.checked; updateCatCodeBulkBar(); });
  };

  // Bulk bar
  $('#btn-catcode-bulk-cancel').onclick = () => {
    $$('.catcode-row-chk').forEach(c => c.checked = false);
    $('#catcode-select-all').checked = false;
    updateCatCodeBulkBar();
  };
  $('#btn-catcode-bulk-export').onclick = () => bulkExportCatCodes();
  $('#btn-catcode-bulk-delete').onclick  = () => bulkDeleteCatCodes();
};

async function loadCatCodes() {
  const tbody = $('#tbl-catcode-body');
  if (!tbody) return;
  tbody.innerHTML = `<tr class="empty-row"><td colspan="5"><div class="spinner" style="margin:0 auto"></div></td></tr>`;

  let data;
  try {
    data = await api('/api/category-codes');
  } catch (e) {
    tbody.innerHTML = `<tr class="empty-row"><td colspan="5" style="color:var(--danger)">
      <i class="fas fa-circle-xmark"></i> Failed to load: ${e.message}</td></tr>`;
    return;
  }

  if (!data.length) {
    tbody.innerHTML = `<tr class="empty-row"><td colspan="5">No records found.</td></tr>`;
    return;
  }

  tbody.innerHTML = data.map(d => {
    return `
    <tr data-id="${d.ID}" class="catcode-row">
      <td style="text-align:center">
        <input type="checkbox" class="catcode-row-chk" data-id="${d.ID}"
          style="width:16px;height:16px;cursor:pointer;accent-color:var(--accent)">
      </td>
      <td style="color:var(--text-secondary);font-size:13px">${d.ID}</td>
      <td>
        <span class="catcode-itemcat-cell"
          data-id="${d.ID}"
          data-itemcat="${(d.ItemCategory || '').replace(/"/g, '&quot;')}"
          data-cat="${(d.Category || '').replace(/"/g, '&quot;')}"
          style="cursor:pointer;color:var(--text-primary);text-decoration:underline dotted;text-underline-offset:3px"
          title="Click to edit">${d.ItemCategory || ''}</span>
      </td>
      <td>
        <span style="
          display:inline-flex;align-items:center;gap:6px;
          background:var(--accent-soft);color:var(--accent);
          border-radius:20px;padding:3px 10px;font-size:12px;font-weight:600">
          ${d.Category || '<span style="color:var(--text-muted);font-style:italic">&#8212;</span>'}
        </span>
      </td>
      <td>
        <button class="btn btn-danger btn-sm" onclick="deleteCatCode(${d.ID})" title="Delete">
          <i class="fas fa-trash"></i>
        </button>
      </td>
    </tr>`;
  }).join('');

  // Checkbox listeners
  $$('.catcode-row-chk').forEach(chk => {
    chk.onchange = () => { updateCatCodeBulkBar(); syncCatCodeSelectAll(); };
  });

  // Click-to-edit on Item Category cell
  $$('.catcode-itemcat-cell').forEach(cell => {
    cell.onclick = () => showEditCatCodeInline(
      parseInt(cell.dataset.id),
      cell.dataset.itemcat,
      cell.dataset.cat
    );
  });
}

function syncCatCodeSelectAll() {
  const all = $$('.catcode-row-chk');
  const checked = all.filter(c => c.checked);
  const sa = $('#catcode-select-all');
  if (!sa) return;
  sa.checked = all.length > 0 && checked.length === all.length;
  sa.indeterminate = checked.length > 0 && checked.length < all.length;
}

function updateCatCodeBulkBar() {
  const checked = $$('.catcode-row-chk:checked');
  const bar = $('#catcode-bulk-bar');
  if (!bar) return;
  if (checked.length > 0) {
    bar.style.display = 'flex';
    $('#catcode-sel-count').textContent = `${checked.length} row${checked.length > 1 ? 's' : ''} selected`;
  } else {
    bar.style.display = 'none';
  }
}

// Inline edit modal &#8212; click on Item Category Code
function showEditCatCodeInline(id, curItemCat, curCat) {
  const existing = $('#catcode-inline-editor');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'catcode-inline-editor';
  overlay.innerHTML = `
    <div class="modal" style="max-width:460px;animation:slideUp 0.2s ease">
      <div class="modal-header">
        <h3><i class="fas fa-pen-to-square"></i> Edit Category / Item Code</h3>
        <button class="btn-close-modal" onclick="document.getElementById('catcode-inline-editor').remove()">
          <i class="fas fa-xmark"></i>
        </button>
      </div>
      <div class="modal-body">
        <div class="form-field" style="margin-bottom:16px">
          <label>ID <span style="color:var(--text-muted);font-size:11px">(auto, not editable)</span></label>
          <input type="text" value="${id}" readonly
            style="background:var(--bg-dark);border:1px solid var(--border);border-radius:6px;
                   padding:9px 12px;color:var(--text-muted);width:100%;cursor:not-allowed;opacity:0.7"/>
        </div>
        <div class="form-field" style="margin-bottom:16px">
          <label>Item Category Code <span style="color:var(--danger)">*</span></label>
          <input type="text" id="catcode-edit-itemcat" value="${curItemCat}"
            style="background:var(--bg-dark);border:1px solid var(--border);border-radius:6px;
                   padding:9px 12px;color:var(--text-primary);width:100%;font-size:14px"
            placeholder="e.g. MRG, NRG, RNG" autofocus/>
        </div>
        <div class="form-field">
          <label>Category Code <span style="color:var(--danger)">*</span></label>
          <input type="text" id="catcode-edit-cat" value="${curCat}"
            style="background:var(--bg-dark);border:1px solid var(--border);border-radius:6px;
                   padding:9px 12px;color:var(--text-primary);width:100%;font-size:14px"
            placeholder="e.g. R, NP, LPS"/>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="document.getElementById('catcode-inline-editor').remove()">Cancel</button>
        <button class="btn btn-primary" id="btn-catcode-inline-save">
          <i class="fas fa-floppy-disk"></i> Save
        </button>
      </div>
    </div>`;
  document.body.appendChild(overlay);

  const itemCatInp = $('#catcode-edit-itemcat');
  itemCatInp.focus();
  document.getElementById('btn-catcode-inline-save').onclick = doSave;
  overlay.onclick = e => { if (e.target === overlay) overlay.remove(); };

  async function doSave() {
    const ItemCategory = itemCatInp.value.trim();
    const Category     = $('#catcode-edit-cat').value.trim();
    if (!ItemCategory) return showToast('Item Category Code cannot be empty', 'error');
    if (!Category)     return showToast('Category Code cannot be empty', 'error');
    try {
      await api(`/api/category-codes/${id}`, { method: 'PUT', body: { ItemCategory, Category } });
      overlay.remove();
      showToast('Record updated successfully!', 'success');
      await loadCatCodes();
    } catch (e) { showToast(e.message, 'error'); }
  }
}

// Add New modal
async function showAddCatCodeModal() {
  let nextId = '&#8212;';
  try {
    const data = await api('/api/category-codes');
    nextId = data.length ? Math.max(...data.map(d => d.ID)) + 1 : 1;
  } catch (_) { }

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal" style="max-width:460px;animation:slideUp 0.2s ease">
      <div class="modal-header">
        <h3><i class="fas fa-plus-circle"></i> Add Category / Item Code</h3>
        <button class="btn-close-modal" onclick="this.closest('.modal-overlay').remove()">
          <i class="fas fa-xmark"></i>
        </button>
      </div>
      <div class="modal-body">
        <div class="form-field" style="margin-bottom:16px">
          <label>ID <span style="color:var(--text-muted);font-size:11px">(auto-assigned)</span></label>
          <input type="text" value="~${nextId}" readonly
            style="background:var(--bg-dark);border:1px dashed var(--border);border-radius:6px;
                   padding:9px 12px;color:var(--text-muted);width:100%;cursor:not-allowed;
                   font-style:italic;opacity:0.7"/>
        </div>
        <div class="form-field" style="margin-bottom:16px">
          <label>Item Category Code <span style="color:var(--danger)">*</span></label>
          <input type="text" id="new-catcode-itemcat" autofocus
            style="background:var(--bg-dark);border:1px solid var(--border);border-radius:6px;
                   padding:9px 12px;color:var(--text-primary);width:100%;font-size:14px"
            placeholder="e.g. MRG, NRG, RNG"/>
        </div>
        <div class="form-field">
          <label>Category Code <span style="color:var(--danger)">*</span></label>
          <input type="text" id="new-catcode-cat"
            style="background:var(--bg-dark);border:1px solid var(--border);border-radius:6px;
                   padding:9px 12px;color:var(--text-primary);width:100%;font-size:14px"
            placeholder="e.g. R, NP, LPS"/>
        </div>
        <p style="font-size:12px;color:var(--text-muted);margin-top:10px">
          <i class="fas fa-circle-info" style="color:var(--info)"></i>
          ID is auto-incremented by the database and cannot be set manually.
        </p>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
        <button class="btn btn-primary" id="btn-catcode-add-save">
          <i class="fas fa-plus"></i> Add Code
        </button>
      </div>
    </div>`;
  document.body.appendChild(overlay);

  overlay.onclick = e => { if (e.target === overlay) overlay.remove(); };
  overlay.querySelector('.btn-close-modal').onclick = () => overlay.remove();
  overlay.querySelector('#btn-catcode-add-save').onclick = doAdd;

  async function doAdd() {
    const ItemCategory = overlay.querySelector('#new-catcode-itemcat').value.trim();
    const Category     = overlay.querySelector('#new-catcode-cat').value.trim();
    if (!ItemCategory) return showToast('Item Category Code is required', 'error');
    if (!Category)     return showToast('Category Code is required', 'error');
    try {
      await api('/api/category-codes', { method: 'POST', body: { ItemCategory, Category } });
      overlay.remove();
      showToast('Code added successfully!', 'success');
      await loadCatCodes();
    } catch (e) { showToast(e.message, 'error'); }
  }
}

// Single Delete
window.deleteCatCode = async (id) => {
  if (!await confirm(`Delete ID ${id}? This action cannot be undone.`)) return;
  try {
    await api(`/api/category-codes/${id}`, { method: 'DELETE' });
    showToast('Record deleted!', 'success');
    await loadCatCodes();
    updateCatCodeBulkBar();
  } catch (e) { showToast(e.message, 'error'); }
};

// Bulk Delete
async function bulkDeleteCatCodes() {
  const ids = $$('.catcode-row-chk:checked').map(c => parseInt(c.dataset.id));
  if (!ids.length) return;
  if (!await confirm(`Delete ${ids.length} selected record(s)? This cannot be undone.`)) return;
  try {
    await api('/api/category-codes/bulk-delete', { method: 'POST', body: { ids } });
    showToast(`${ids.length} record(s) deleted!`, 'success');
    $('#catcode-select-all').checked = false;
    await loadCatCodes();
    updateCatCodeBulkBar();
  } catch (e) { showToast(e.message, 'error'); }
}

// Bulk Export XLSX
async function bulkExportCatCodes() {
  const ids = $$('.catcode-row-chk:checked').map(c => parseInt(c.dataset.id));
  try {
    const res = await fetch('/api/category-codes/export-xlsx', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ ids })
    });
    if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `category_item_codes_${new Date().toISOString().split('T')[0]}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`Exported ${ids.length} record(s) to XLSX!`, 'success');
  } catch (e) { showToast('Export failed: ' + e.message, 'error'); }
}

// ======== ITEM-VENDOR MAPPING MASTER ========

// Cached lookup data for dropdowns
let _ivmDivisions = [], _ivmItems = [], _ivmVendors = [];

registerPage('item-vendor-map', () => {
  return `${pageHeader('Item&#8211;Vendor Mapping', 'fa-link', 'Masters / Item&#8211;Vendor Mapping',
    (State.user && ['super admin', 'superadmin'].includes(State.user.roleName?.toLowerCase()))
      ? `<button class="btn btn-success" id="btn-ivm-bulk-upload" style="margin-right:8px"><i class="fas fa-file-arrow-up"></i>  Upload Excel</button><button class="btn btn-primary" id="btn-add-ivm"><i class="fas fa-plus"></i>  Add New</button>`
      : `<button class="btn btn-primary" id="btn-add-ivm"><i class="fas fa-plus"></i>  Add New</button>`)}
  <div class="card">
    <div class="search-bar">
      <div class="search-input-wrap">
        <i class="fas fa-search"></i>
        <input type="text" id="ivm-search" placeholder="Search item, vendor, division, remark...">
      </div>
      <select id="ivm-div-filter"
        style="background:var(--bg-dark);border:1px solid var(--border);border-radius:6px;
               padding:8px 14px;color:var(--text-primary);font-size:13.5px;cursor:pointer;min-width:180px">
        <option value="">All Divisions</option>
      </select>
    </div>
    <div class="table-wrapper">
      <table id="tbl-ivm-main" style="min-width:1100px">
        <thead>
          <tr>
            <th style="width:42px;text-align:center">
              <input type="checkbox" id="ivm-select-all" title="Select all"
                style="width:16px;height:16px;cursor:pointer;accent-color:var(--accent)">
            </th>
            <th style="width:70px">ID</th>
            <th style="width:160px">Division</th>
            <th style="width:200px">Item Name</th>
            <th style="width:200px">Vendor Name</th>
            ${!isAdmin() ? '<th style="width:90px">Rs.</th><th style="width:80px">GST(%)</th><th style="width:110px">Total (₹)</th>' : ''}
            <th>Remark</th>
            <th style="width:130px">Actions</th>
          </tr>
        </thead>
        <tbody id="tbl-ivm-body">
          <tr class="empty-row"><td colspan="10"><div class="spinner" style="margin:0 auto"></div></td></tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- Floating bulk-action bar -->
  <div id="ivm-bulk-bar" style="
    display:none; position:fixed; bottom:28px; left:50%; transform:translateX(-50%);
    background:var(--bg-card); border:1px solid var(--accent); border-radius:12px;
    padding:12px 24px; z-index:500; box-shadow:0 8px 32px rgba(0,0,0,0.5);
    align-items:center; gap:16px; min-width:380px;">
    <span id="ivm-sel-count" style="color:var(--accent);font-weight:600;font-size:14px"></span>
    <div style="flex:1"></div>
    <button class="btn btn-success" id="btn-ivm-bulk-export"><i class="fas fa-file-excel"></i> Export XLSX</button>
    <button class="btn btn-danger"  id="btn-ivm-bulk-delete"><i class="fas fa-trash"></i> Delete Selected</button>
    <button class="btn btn-secondary btn-sm" id="btn-ivm-bulk-cancel" title="Cancel"><i class="fas fa-xmark"></i></button>
  </div>
  </div>`;
});

window._pageBinders['item-vendor-map'] = async () => {
  // Pre-load lookup data
  try { [_ivmDivisions, _ivmItems, _ivmVendors] = await Promise.all([
    api('/api/divisions?active=1'), api('/api/items'), api('/api/vendors')
  ]); } catch (_) {}

  await loadIVM();

  // Populate division filter
  const divFilter = $('#ivm-div-filter');
  if (divFilter) {
    _ivmDivisions.forEach(d => {
      const o = document.createElement('option');
      o.value = d.DivisionId || d.DivisionID; o.textContent = d.DivisionName;
      divFilter.appendChild(o);
    });
    divFilter.onchange = applyIVMFilters;
  }

  $('#ivm-search').oninput = applyIVMFilters;
  $('#btn-add-ivm').onclick  = () => showAddIVMModal();
  if ($('#btn-ivm-bulk-upload')) {
    $('#btn-ivm-bulk-upload').onclick = () => showBulkUploadModal({
      title: 'Item\u2013Vendor Mapping',
      apiPath: '/api/item-vendor-mapping/bulk-upload',
      templateCols: ['Division Name', 'Item Name', 'Vendor Name', 'Price Rs', 'GST %', 'Remark'],
      templateFile: 'ivm_bulk_template.xlsx',
      onSuccess: loadIVM
    });
  }
  $('#ivm-select-all').onchange = (e) => {
    $$('.ivm-row-chk').filter(c => c.closest('tr').style.display !== 'none')
      .forEach(c => { c.checked = e.target.checked; updateIVMBulkBar(); });
  };
  $('#btn-ivm-bulk-cancel').onclick = () => {
    $$('.ivm-row-chk').forEach(c => c.checked = false);
    $('#ivm-select-all').checked = false;
    updateIVMBulkBar();
  };
  $('#btn-ivm-bulk-export').onclick = () => bulkExportIVM();
  $('#btn-ivm-bulk-delete').onclick  = () => bulkDeleteIVM();
};

function applyIVMFilters() {
  const q = ($('#ivm-search')?.value || '').toLowerCase();
  const divId = $('#ivm-div-filter')?.value || '';
  $$('#tbl-ivm-body tr:not(.empty-row)').forEach(tr => {
    const matchText = !q || tr.textContent.toLowerCase().includes(q);
    const matchDiv  = !divId || tr.dataset.divId === divId;
    tr.style.display = (matchText && matchDiv) ? '' : 'none';
  });
}

async function loadIVM() {
  const tbody = $('#tbl-ivm-body');
  if (!tbody) return;
  tbody.innerHTML = `<tr class="empty-row"><td colspan="10"><div class="spinner" style="margin:0 auto"></div></td></tr>`;

  let data;
  try { data = await api('/api/item-vendor-mapping'); }
  catch (e) {
    tbody.innerHTML = `<tr class="empty-row"><td colspan="9" style="color:var(--danger)">
      <i class="fas fa-circle-xmark"></i> Failed to load: ${e.message}</td></tr>`;
    return;
  }

  if (!data.length) {
    tbody.innerHTML = `<tr class="empty-row"><td colspan="10">No mappings found.</td></tr>`;
    return;
  }

  tbody.innerHTML = data.map(d => {
    const _isPending = d.ApprovalStatus === 'PENDING';
    const _rowStyle = _isPending
      ? 'opacity:0.5;filter:grayscale(0.25);background:rgba(249,115,22,0.05);cursor:default;'
      : '';
    const _rowTitle = _isPending
      ? 'Approval is pending. Once a Super Admin approves this mapping, it will be active and usable in transactions.'
      : '';
    const priceColsAdmin = !isAdmin();
    return `
    <tr data-id="${d.ID}" data-div-id="${d.DivisionID || ''}" class="ivm-row" style="${_rowStyle}" title="${_rowTitle}">
      <td style="text-align:center">
        <input type="checkbox" class="ivm-row-chk" data-id="${d.ID}"
          style="width:16px;height:16px;cursor:pointer;accent-color:var(--accent)">
      </td>
      <td style="color:var(--text-secondary);font-size:13px">${d.ID}${_isPending ? '<br><span style="font-size:9px;color:#f97316;font-weight:700;letter-spacing:0.5px">⏳ PENDING</span>' : ''}</td>
      <td>
        <span style="background:var(--accent-soft);color:var(--accent);border-radius:20px;
          padding:3px 10px;font-size:12px;font-weight:600">
          ${d.DivisionName || '<span style="color:var(--text-muted)">&#8212;</span>'}
        </span>
      </td>
      <td>
        <span class="ivm-edit-cell" data-id="${d.ID}"
          style="cursor:pointer;text-decoration:underline dotted;text-underline-offset:3px"
          title="Click to edit">${d.ItemName || '&#8212;'}</span>
      </td>
      <td style="color:var(--text-secondary)">${d.VendorName || '&#8212;'}</td>
      ${priceColsAdmin ? `
      <td style="font-weight:600;color:var(--accent)">
        ${d.PriceRs != null ? '&#8377; ' + parseFloat(d.PriceRs).toFixed(2) : '&#8212;'}
      </td>
      <td>${d.GST != null ? Math.round(parseFloat(d.GST)) + '%' : '&#8212;'}</td>
      <td style="font-weight:600;color:var(--success)">
        ${d.Total != null ? '&#8377; ' + parseFloat(d.Total).toFixed(2) : (d.PriceRs != null ? '&#8377; ' + (parseFloat(d.PriceRs) + parseFloat(d.PriceRs) * (parseFloat(d.GST)||0) / 100).toFixed(2) : '&#8212;')}
      </td>` : ''}
      <td style="font-size:13px;color:var(--text-secondary)">${d.Remark || ''}</td>
      <td>
        ${_isPending && isSuperAdmin() ? `<button class="btn btn-success btn-sm" onclick="showApproveIVMModal(${d.ID})" title="Approve" style="margin-right:4px"><i class="fas fa-check"></i> Approve</button>` : ''}
        <button class="btn btn-danger btn-sm" onclick="deleteIVM(${d.ID})" title="Delete">
          <i class="fas fa-trash"></i>
        </button>
      </td>
    </tr>`;
  }).join('');

  $$(`.ivm-row-chk`).forEach(chk => {
    chk.onchange = () => { updateIVMBulkBar(); syncIVMSelectAll(); };
  });
  $$(`.ivm-edit-cell`).forEach(cell => {
    cell.onclick = () => {
      const row = data.find(d => d.ID === parseInt(cell.dataset.id));
      if (row) showEditIVMInline(row);
    };
  });
}

function syncIVMSelectAll() {
  const all = $$('.ivm-row-chk'), checked = all.filter(c => c.checked);
  const sa = $('#ivm-select-all'); if (!sa) return;
  sa.checked = all.length > 0 && checked.length === all.length;
  sa.indeterminate = checked.length > 0 && checked.length < all.length;
}

function updateIVMBulkBar() {
  const checked = $$('.ivm-row-chk:checked');
  const bar = $('#ivm-bulk-bar'); if (!bar) return;
  if (checked.length > 0) {
    bar.style.display = 'flex';
    $('#ivm-sel-count').textContent = `${checked.length} row${checked.length > 1 ? 's' : ''} selected`;
  } else { bar.style.display = 'none'; }
}

// Helper: build dropdown HTML
function ivmSelectStyle() {
  return `style="background:var(--bg-dark);border:1px solid var(--border);border-radius:6px;
          padding:9px 12px;color:var(--text-primary);width:100%;font-size:14px;cursor:pointer"`;
}
function ivmDivOptions(selectedId) {
  return _ivmDivisions.map(d => {
    const id = d.DivisionId || d.DivisionID;
    return `<option value="${id}" ${id == selectedId ? 'selected' : ''}>${d.DivisionName}</option>`;
  }).join('');
}
function ivmItemOptions(selectedId) {
  return _ivmItems.map(i => {
    const iid = i.Itemid || i.itemid || i.ItemId;
    const sel = (selectedId != null && selectedId !== '' && iid == selectedId) ? 'selected' : '';
    return `<option value="${iid}" ${sel}>${i.ItemName}</option>`;
  }).join('');
}
function ivmVendorOptions(selectedId) {
  return _ivmVendors.map(v => {
    const vid  = v.vendorid || v.VendorId || v.VendorID;
    const name = v.Name || v.VendorName;
    const sel  = (selectedId != null && selectedId !== '' && vid == selectedId) ? 'selected' : '';
    return `<option value="${vid}" ${sel}>${name}</option>`;
  }).join('');
}

// showPriceFields: controls whether Rs/GST/Total are shown (false for admin editing an approved record)
function ivmModalBody(rec = {}, showPriceFields = true) {
  const priceSection = showPriceFields ? `
    <div class="form-row cols-2" style="gap:12px;margin-bottom:14px">
      <div class="form-field">
        <label>Rs. (Price)</label>
        <input type="number" id="ivm-modal-price" value="${rec.PriceRs ?? ''}" min="0" step="0.01"
          style="background:var(--bg-dark);border:1px solid var(--border);border-radius:6px;
                 padding:9px 12px;color:var(--text-primary);width:100%;font-size:14px"
          placeholder="0.00"/>
      </div>
      <div class="form-field">
        <label>GST (%)</label>
        <input type="number" id="ivm-modal-gst" value="${rec.GST != null ? Math.round(parseFloat(rec.GST)) : ''}" min="0" step="1"
          style="background:var(--bg-dark);border:1px solid var(--border);border-radius:6px;
                 padding:9px 12px;color:var(--text-primary);width:100%;font-size:14px"
          placeholder="0"/>
      </div>
    </div>
    <div class="form-field" style="margin-bottom:14px">
      <label>Total <span style="color:var(--text-muted);font-size:11px">(auto-calculated)</span></label>
      <input type="text" id="ivm-modal-total" readonly
        style="background:var(--bg-dark);border:1px dashed var(--accent);border-radius:6px;
               padding:9px 12px;color:var(--accent);width:100%;font-size:14px;font-weight:700;
               cursor:not-allowed"
        value="${rec.Total != null ? parseFloat(rec.Total).toFixed(2) : (rec.PriceRs != null ? (parseFloat(rec.PriceRs) + parseFloat(rec.PriceRs)*(parseFloat(rec.GST)||0)/100).toFixed(2) : '')}" placeholder="0.00"/>
    </div>` : `
    <!-- Hidden price inputs to keep collect logic consistent -->
    <input type="hidden" id="ivm-modal-price" value="${rec.PriceRs ?? 0}"/>
    <input type="hidden" id="ivm-modal-gst" value="${rec.GST ?? 0}"/>
    <input type="hidden" id="ivm-modal-total" value="${rec.Total ?? 0}"/>`;

  return `
    <div class="form-field" style="margin-bottom:14px">
      <label>ID <span style="color:var(--text-muted);font-size:11px">(auto-assigned)</span></label>
      <input type="text" value="${rec.ID ? rec.ID : '~auto'}" readonly
        style="background:var(--bg-dark);border:1px dashed var(--border);border-radius:6px;
               padding:9px 12px;color:var(--text-muted);width:100%;cursor:not-allowed;font-style:italic;opacity:0.7"/>
    </div>
    <div class="form-row cols-2" style="gap:12px;margin-bottom:14px">
      <div class="form-field">
        <label>Division <span style="color:var(--danger)">*</span></label>
        <select id="ivm-modal-div" ${ivmSelectStyle()}>
          <option value="">&#8212; Select &#8212;</option>
          ${ivmDivOptions(rec.DivisionID)}
        </select>
      </div>
      <div class="form-field">
        <label>Item Name <span style="color:var(--danger)">*</span></label>
        <select id="ivm-modal-item" ${ivmSelectStyle()}>
          <option value="">&#8212; Select &#8212;</option>
          ${ivmItemOptions(rec.ItemId)}
        </select>
      </div>
    </div>
    <div class="form-field" style="margin-bottom:14px">
      <label>Vendor Name <span style="color:var(--danger)">*</span></label>
      <select id="ivm-modal-vendor" ${ivmSelectStyle()}>
        <option value="">&#8212; Select &#8212;</option>
        ${ivmVendorOptions(rec.VendorId)}
      </select>
    </div>
    ${priceSection}
    <div class="form-field">
      <label>Remark</label>
      <input type="text" id="ivm-modal-remark" value="${rec.Remark || ''}"
        style="background:var(--bg-dark);border:1px solid var(--border);border-radius:6px;
               padding:9px 12px;color:var(--text-primary);width:100%;font-size:14px"
        placeholder="Optional note..."/>
    </div>`;
}

function collectIVMForm(overlay) {
  return {
    DivisionID: overlay.querySelector('#ivm-modal-div').value,
    ItemId:     overlay.querySelector('#ivm-modal-item').value,
    VendorId:   overlay.querySelector('#ivm-modal-vendor').value,
    PriceRs:    overlay.querySelector('#ivm-modal-price').value,
    GST:        overlay.querySelector('#ivm-modal-gst').value,
    Remark:     overlay.querySelector('#ivm-modal-remark').value.trim()
  };
}

// Auto-calc helper: wires Price + GST → Total inside a modal overlay
function _bindIVMTotalCalc(overlay) {
  const priceEl = overlay.querySelector('#ivm-modal-price');
  const gstEl   = overlay.querySelector('#ivm-modal-gst');
  const totalEl = overlay.querySelector('#ivm-modal-total');
  if (!priceEl || !gstEl || !totalEl) return;
  function recalc() {
    const price = parseFloat(priceEl.value) || 0;
    const gst   = parseInt(gstEl.value)     || 0;
    const total = price + (price * gst / 100);
    totalEl.value = price > 0 ? total.toFixed(2) : '';
  }
  priceEl.addEventListener('input', recalc);
  gstEl.addEventListener('input', recalc);
  recalc(); // run immediately to show pre-filled total in edit mode
}

// Inline edit modal
function showEditIVMInline(rec) {
  const existing = $('#ivm-inline-editor'); if (existing) existing.remove();
  // Price fields visibility: ONLY Super Admins can see/edit Rs, GST, Total.
  // Admins can NEVER see price fields in edit mode, regardless of pending status.
  // If an admin needs to change price, they must ask a Super Admin directly.
  const showPriceFields = isSuperAdmin();
  // Show warning to admin if editing an approved (non-pending) record
  const willGoPending = isAdmin() && (rec.ApprovalStatus !== 'PENDING');
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'ivm-inline-editor';
  overlay.innerHTML = `
    <div class="modal" style="max-width:560px;animation:slideUp 0.2s ease">
      <div class="modal-header">
        <h3><i class="fas fa-pen-to-square"></i> Edit Item&#8211;Vendor Mapping</h3>
        <button class="btn-close-modal" onclick="document.getElementById('ivm-inline-editor').remove()">
          <i class="fas fa-xmark"></i></button>
      </div>
      <div class="modal-body">
        ${willGoPending ? `<div style="background:rgba(249,115,22,0.1);border:1px solid rgba(249,115,22,0.4);border-radius:8px;padding:10px 14px;margin-bottom:14px;font-size:12.5px;color:#f97316;">
          <i class="fas fa-triangle-exclamation"></i>&nbsp;<strong>Note:</strong> Saving this edit will <strong>disable this mapping</strong> and submit it for Super Admin approval. It will not appear in any transactions until approved.
        </div>` : ''}
        ${ivmModalBody(rec, showPriceFields)}
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="document.getElementById('ivm-inline-editor').remove()">Cancel</button>
        <button class="btn btn-primary" id="btn-ivm-inline-save"><i class="fas fa-floppy-disk"></i> Save</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);
  overlay.onclick = e => { if (e.target === overlay) overlay.remove(); };
  if (showPriceFields) _bindIVMTotalCalc(overlay);
  document.getElementById('btn-ivm-inline-save').onclick = async () => {
    const b = collectIVMForm(overlay);
    if (!b.DivisionID) return showToast('Select a Division', 'error');
    if (!b.ItemId)     return showToast('Select an Item', 'error');
    if (!b.VendorId)   return showToast('Select a Vendor', 'error');
    try {
      await api(`/api/item-vendor-mapping/${rec.ID}`, { method: 'PUT', body: b });
      overlay.remove();
      if (willGoPending) {
        showToast('Mapping saved and sent for Super Admin approval. It is now disabled until approved.', 'info');
      } else if (isAdmin() && rec.ApprovalStatus === 'PENDING') {
        showToast('Mapping updated! Another approval request has been sent to Super Admin.', 'info');
      } else {
        showToast('Mapping updated!', 'success');
      }
      await loadIVM();
    } catch (e) { showToast(e.message, 'error'); }
  };
}

// Add New modal
async function showAddIVMModal() {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal" style="max-width:560px;animation:slideUp 0.2s ease">
      <div class="modal-header">
        <h3><i class="fas fa-plus-circle"></i> Map Item to Vendor</h3>
        <button class="btn-close-modal" onclick="this.closest('.modal-overlay').remove()">
          <i class="fas fa-xmark"></i></button>
      </div>
      <div class="modal-body">${ivmModalBody()}</div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
        <button class="btn btn-primary" id="btn-ivm-add-save"><i class="fas fa-link"></i> Map</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);
  overlay.onclick = e => { if (e.target === overlay) overlay.remove(); };
  overlay.querySelector('.btn-close-modal').onclick = () => overlay.remove();
  _bindIVMTotalCalc(overlay);
  overlay.querySelector('#btn-ivm-add-save').onclick = async () => {
    const b = collectIVMForm(overlay);
    if (!b.DivisionID) return showToast('Select a Division', 'error');
    if (!b.ItemId)     return showToast('Select an Item', 'error');
    if (!b.VendorId)   return showToast('Select a Vendor', 'error');
    try {
      await api('/api/item-vendor-mapping', { method: 'POST', body: b });
      overlay.remove(); showToast('Mapping added!', 'success'); await loadIVM();
    } catch (e) { showToast(e.message, 'error'); }
  };
}

// Single Delete
window.deleteIVM = async (id) => {
  if (!await confirm(`Delete Mapping ID ${id}? This action cannot be undone.`)) return;
  try {
    await api(`/api/item-vendor-mapping/${id}`, { method: 'DELETE' });
    showToast('Mapping deleted!', 'success'); await loadIVM(); updateIVMBulkBar();
  } catch (e) { showToast(e.message, 'error'); }
};

// Bulk Delete
async function bulkDeleteIVM() {
  const ids = $$('.ivm-row-chk:checked').map(c => parseInt(c.dataset.id));
  if (!ids.length) return;
  if (!await confirm(`Delete ${ids.length} mapping(s)? This cannot be undone.`)) return;
  try {
    await api('/api/item-vendor-mapping/bulk-delete', { method: 'POST', body: { ids } });
    showToast(`${ids.length} mapping(s) deleted!`, 'success');
    $('#ivm-select-all').checked = false; await loadIVM(); updateIVMBulkBar();
  } catch (e) { showToast(e.message, 'error'); }
}

// Bulk Export XLSX
async function bulkExportIVM() {
  const ids = $$('.ivm-row-chk:checked').map(c => parseInt(c.dataset.id));
  try {
    const res = await fetch('/api/item-vendor-mapping/export-xlsx', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      credentials: 'include', body: JSON.stringify({ ids })
    });
    if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `item_vendor_mapping_${new Date().toISOString().split('T')[0]}.xlsx`;
    a.click(); URL.revokeObjectURL(url);
    showToast(`Exported ${ids.length} mapping(s) to XLSX!`, 'success');
  } catch (e) { showToast('Export failed: ' + e.message, 'error'); }
}

// Super Admin: Approve a pending IVM entry
window.showApproveIVMModal = async (id) => {
  // Load the current record data
  let data;
  try { data = await api('/api/item-vendor-mapping'); }
  catch (e) { return showToast('Could not load mapping data', 'error'); }
  const rec = data.find(d => d.ID === id);
  if (!rec) return showToast('Mapping not found', 'error');

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'ivm-approve-modal';
  overlay.innerHTML = `
    <div class="modal" style="max-width:560px;animation:slideUp 0.2s ease">
      <div class="modal-header">
        <h3><i class="fas fa-check-circle" style="color:var(--success)"></i> Approve IVM Mapping #${id}</h3>
        <button class="btn-close-modal" onclick="document.getElementById('ivm-approve-modal').remove()">
          <i class="fas fa-xmark"></i></button>
      </div>
      <div class="modal-body">
        <div style="background:rgba(249,115,22,0.1);border:1px solid rgba(249,115,22,0.3);border-radius:8px;padding:12px;margin-bottom:16px;font-size:13px;color:#f97316;">
          <i class="fas fa-triangle-exclamation"></i> This mapping is pending approval. Review and approve below.
          <br><strong>Requested by:</strong> ${rec.LastRequestedBy || 'Unknown'}
        </div>
        ${ivmModalBody(rec, true)}
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="document.getElementById('ivm-approve-modal').remove()">Cancel</button>
        <button class="btn btn-success" id="btn-ivm-approve-confirm"><i class="fas fa-check"></i> Approve &amp; Enable</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);
  overlay.onclick = e => { if (e.target === overlay) overlay.remove(); };
  _bindIVMTotalCalc(overlay);
  document.getElementById('btn-ivm-approve-confirm').onclick = async () => {
    const b = collectIVMForm(overlay);
    if (!b.DivisionID || !b.ItemId || !b.VendorId) return showToast('All fields required', 'error');
    try {
      await api(`/api/item-vendor-mapping/${id}/approve`, { method: 'PUT', body: b });
      overlay.remove();
      showToast(`Mapping #${id} approved and enabled!`, 'success');
      await loadIVM();
    } catch (e) { showToast(e.message, 'error'); }
  };
};

// Super Admin: Approve a pending Item Master entry
window.showApproveItemModal = async (id) => {
  let allItems;
  try { allItems = await api('/api/items'); }
  catch (e) { return showToast('Could not load item data', 'error'); }
  const rec = allItems.find(d => d.itemid === id);
  if (!rec) return showToast('Item not found', 'error');

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'item-approve-modal';
  overlay.innerHTML = `
    <div class="modal" style="max-width:560px;animation:slideUp 0.2s ease">
      <div class="modal-header">
        <h3><i class="fas fa-check-circle" style="color:var(--success)"></i> Approve Item #${id}</h3>
        <button class="btn-close-modal" onclick="document.getElementById('item-approve-modal').remove()">
          <i class="fas fa-xmark"></i></button>
      </div>
      <div class="modal-body">
        <div style="background:rgba(249,115,22,0.1);border:1px solid rgba(249,115,22,0.3);border-radius:8px;padding:12px;margin-bottom:16px;font-size:13px;color:#f97316;">
          <i class="fas fa-triangle-exclamation"></i> This item is pending approval. Review and approve below.
          <br><strong>Requested by:</strong> ${rec.LastRequestedBy || 'Unknown'}
        </div>
        ${itemModalBody(rec)}
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="document.getElementById('item-approve-modal').remove()">Cancel</button>
        <button class="btn btn-success" id="btn-item-approve-confirm"><i class="fas fa-check"></i> Approve &amp; Enable</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);
  overlay.onclick = e => { if (e.target === overlay) overlay.remove(); };
  document.getElementById('btn-item-approve-confirm').onclick = async () => {
    const b = collectItemForm(overlay);
    if (!b.ItemName) return showToast('Item Name is required', 'error');
    try {
      await api(`/api/items/${id}/approve`, { method: 'PUT', body: b });
      overlay.remove();
      showToast(`Item #${id} approved and enabled!`, 'success');
      await loadItems();
    } catch (e) { showToast(e.message, 'error'); }
  };
};

// ======== ITEM MASTER ========

const UOM_OPTIONS = ['Pcs', 'Quantity', 'Litre', 'Dozen', 'Kg'];
const PRIORITY_OPTIONS = [
  { val: 'H', label: 'High (H)' },
  { val: 'M', label: 'Medium (M)' },
  { val: 'L', label: 'Low (L)' }
];

let _itemDivisions = [], _itemCategories = [];

registerPage('items', () => {
  return `${pageHeader('Item Master', 'fa-box', 'Masters / Item Master',
    (State.user && ['super admin', 'superadmin'].includes(State.user.roleName?.toLowerCase()))
      ? `<button class="btn btn-success" id="btn-item-bulk-upload" style="margin-right:8px"><i class="fas fa-file-arrow-up"></i>  Upload Excel</button><button class="btn btn-primary" id="btn-add-item"><i class="fas fa-plus"></i>  Add New</button>`
      : `<button class="btn btn-primary" id="btn-add-item"><i class="fas fa-plus"></i>  Add New</button>`)}
  <div class="card">
    <div class="search-bar">
      <div class="search-input-wrap">
        <i class="fas fa-search"></i>
        <input type="text" id="item-search" placeholder="Search item name, category, division...">
      </div>
      <select id="item-div-filter"
        style="background:var(--bg-dark);border:1px solid var(--border);border-radius:6px;
               padding:8px 14px;color:var(--text-primary);font-size:13.5px;cursor:pointer;min-width:170px">
        <option value="">All Divisions</option>
      </select>
      <select id="item-cat-filter"
        style="background:var(--bg-dark);border:1px solid var(--border);border-radius:6px;
               padding:8px 14px;color:var(--text-primary);font-size:13.5px;cursor:pointer;min-width:180px">
        <option value="">All Categories</option>
      </select>
    </div>
    <div class="table-wrapper">
      <table id="tbl-item-main" style="min-width:1180px">
        <thead>
          <tr>
            <th style="width:42px;text-align:center">
              <input type="checkbox" id="item-select-all" title="Select all"
                style="width:16px;height:16px;cursor:pointer;accent-color:var(--accent)">
            </th>
            <th style="width:70px">Item ID</th>
            <th style="width:130px">Division</th>
            <th style="width:150px">Category</th>
            <th>Item Name</th>
            <th style="width:90px">UOM</th>
            <th style="width:100px">Stock</th>
            <th style="width:100px">Reorder Lvl</th>
            <th style="width:100px">Reorder Qty</th>
            <th style="width:90px">Priority</th>
            <th style="width:90px">Actions</th>
          </tr>
        </thead>
        <tbody id="tbl-item-body">
          <tr class="empty-row"><td colspan="11"><div class="spinner" style="margin:0 auto"></div></td></tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- Floating bulk-action bar -->
  <div id="item-bulk-bar" style="
    display:none; position:fixed; bottom:28px; left:50%; transform:translateX(-50%);
    background:var(--bg-card); border:1px solid var(--accent); border-radius:12px;
    padding:12px 24px; z-index:500; box-shadow:0 8px 32px rgba(0,0,0,0.5);
    align-items:center; gap:16px; min-width:380px;">
    <span id="item-sel-count" style="color:var(--accent);font-weight:600;font-size:14px"></span>
    <div style="flex:1"></div>
    <button class="btn btn-success" id="btn-item-bulk-export"><i class="fas fa-file-excel"></i> Export XLSX</button>
    <button class="btn btn-danger"  id="btn-item-bulk-delete"><i class="fas fa-trash"></i> Delete Selected</button>
    <button class="btn btn-secondary btn-sm" id="btn-item-bulk-cancel" title="Cancel"><i class="fas fa-xmark"></i></button>
  </div>
  </div>`;
});

window._pageBinders['items'] = async () => {
  try {
    [_itemDivisions, _itemCategories] = await Promise.all([
      api('/api/divisions?active=1'), api('/api/categories')
    ]);
  } catch (_) {}

  await loadItems();

  // Populate filter dropdowns
  const divFilter = $('#item-div-filter');
  _itemDivisions.forEach(d => {
    const o = document.createElement('option');
    o.value = d.DivisionId || d.DivisionID; o.textContent = d.DivisionName;
    divFilter?.appendChild(o);
  });

  const catFilter = $('#item-cat-filter');
  _itemCategories.forEach(c => {
    const o = document.createElement('option');
    o.value = c.CategoryId; o.textContent = c.CategoryName;
    catFilter?.appendChild(o);
  });

  $('#item-search').oninput   = applyItemFilters;
  divFilter.onchange          = applyItemFilters;
  catFilter.onchange          = applyItemFilters;
  $('#btn-add-item').onclick  = () => showAddItemModal();
  if ($('#btn-item-bulk-upload')) {
    $('#btn-item-bulk-upload').onclick = () => showBulkUploadModal({
      title: 'Item Master',
      apiPath: '/api/items/bulk-upload',
      templateCols: ['Item Name', 'Category Name', 'Division Name', 'UOM', 'Stock', 'Reorder Level', 'Reorder Qty', 'Item Code'],
      templateFile: 'item_master_template.xlsx',
      onSuccess: loadItems
    });
  }
  $('#item-select-all').onchange = (e) => {
    $$('.item-row-chk').filter(c => c.closest('tr').style.display !== 'none')
      .forEach(c => { c.checked = e.target.checked; updateItemBulkBar(); });
  };
  $('#btn-item-bulk-cancel').onclick = () => {
    $$('.item-row-chk').forEach(c => c.checked = false);
    $('#item-select-all').checked = false;
    updateItemBulkBar();
  };
  $('#btn-item-bulk-export').onclick = () => bulkExportItems();
  $('#btn-item-bulk-delete').onclick  = () => bulkDeleteItems();
};

function applyItemFilters() {
  const q     = ($('#item-search')?.value || '').toLowerCase();
  const divId = $('#item-div-filter')?.value || '';
  const catId = $('#item-cat-filter')?.value || '';
  $$('#tbl-item-body tr:not(.empty-row)').forEach(tr => {
    const matchText = !q || tr.textContent.toLowerCase().includes(q);
    const matchDiv  = !divId || tr.dataset.divId === divId;
    const matchCat  = !catId || tr.dataset.catId === catId;
    tr.style.display = (matchText && matchDiv && matchCat) ? '' : 'none';
  });
}

async function loadItems() {
  const tbody = $('#tbl-item-body');
  if (!tbody) return;
  tbody.innerHTML = `<tr class="empty-row"><td colspan="11"><div class="spinner" style="margin:0 auto"></div></td></tr>`;

  let data;
  try { data = await api('/api/items'); }
  catch (e) {
    tbody.innerHTML = `<tr class="empty-row"><td colspan="11" style="color:var(--danger)">
      <i class="fas fa-circle-xmark"></i> Failed to load: ${e.message}</td></tr>`;
    return;
  }

  if (!data.length) {
    tbody.innerHTML = `<tr class="empty-row"><td colspan="11">No items found.</td></tr>`;
    return;
  }

  const priorityLabel = { H: '&#x1F534; High', M: '&#x1F7E1; Medium', L: '&#x1F7E2; Low' };

  tbody.innerHTML = data.map(d => {
    const _isPending = d.ApprovalStatus === 'PENDING';
    const _rowStyle = _isPending ? 'opacity:0.5;filter:grayscale(0.3);background:rgba(249,115,22,0.04);' : '';
    return `
    <tr data-id="${d.itemid}" data-div-id="${d.DivisionId || ''}" data-cat-id="${d.CategoryId || ''}" class="item-row" style="${_rowStyle}">
      <td style="text-align:center">
        <input type="checkbox" class="item-row-chk" data-id="${d.itemid}"
          style="width:16px;height:16px;cursor:pointer;accent-color:var(--accent)">
      </td>
      <td style="color:var(--text-secondary);font-size:13px">${d.itemid}${_isPending ? '<br><span style="font-size:9px;color:#f97316;font-weight:700;letter-spacing:0.5px">⏳ PENDING</span>' : ''}</td>
      <td>
        <span style="background:var(--accent-soft);color:var(--accent);border-radius:20px;
          padding:3px 9px;font-size:12px;font-weight:600">
          ${d.DivisionName || '<span style="color:var(--text-muted)">&#8212;</span>'}
        </span>
      </td>
      <td style="font-size:13px;color:var(--text-secondary)">${d.CategoryName || '&#8212;'}</td>
      <td>
        <span class="item-edit-cell" data-id="${d.itemid}"
          style="cursor:pointer;text-decoration:underline dotted;text-underline-offset:3px;font-weight:500"
          title="Click to edit">${d.ItemName || '&#8212;'}</span>
      </td>
      <td style="font-size:13px">${d.UOM || '&#8212;'}</td>
      <td style="font-weight:600;color:var(--accent)">
        ${d.Stock != null ? d.Stock : '&#8212;'}
      </td>
      <td style="font-size:13px">${d.ReorderLevel ?? '&#8212;'}</td>
      <td style="font-size:13px">${d.ReorderQty ?? '&#8212;'}</td>
      <td style="font-size:12px">${priorityLabel[d.priority] || d.priority || '&#8212;'}</td>
      <td>
        ${_isPending && isSuperAdmin ? `<button class="btn btn-success btn-sm" onclick="showApproveItemModal(${d.itemid})" title="Approve"><i class="fas fa-check"></i> Approve</button>` : ''}
        <button class="btn btn-danger btn-sm" onclick="deleteItem(${d.itemid})" title="Delete">
          <i class="fas fa-trash"></i>
        </button>
      </td>
    </tr>`;
  }).join('');

  $$('.item-row-chk').forEach(chk => {
    chk.onchange = () => { updateItemBulkBar(); syncItemSelectAll(); };
  });
  $$('.item-edit-cell').forEach(cell => {
    cell.onclick = () => {
      const row = data.find(d => d.itemid === parseInt(cell.dataset.id));
      if (row) showEditItemInline(row);
    };
  });
}

function syncItemSelectAll() {
  const all = $$('.item-row-chk'), checked = all.filter(c => c.checked);
  const sa = $('#item-select-all'); if (!sa) return;
  sa.checked = all.length > 0 && checked.length === all.length;
  sa.indeterminate = checked.length > 0 && checked.length < all.length;
}

function updateItemBulkBar() {
  const checked = $$('.item-row-chk:checked');
  const bar = $('#item-bulk-bar'); if (!bar) return;
  if (checked.length > 0) {
    bar.style.display = 'flex';
    $('#item-sel-count').textContent = `${checked.length} item${checked.length > 1 ? 's' : ''} selected`;
  } else { bar.style.display = 'none'; }
}

// Helpers
function itemSelStyle() {
  return `style="background:var(--bg-dark);border:1px solid var(--border);border-radius:6px;
          padding:9px 12px;color:var(--text-primary);width:100%;font-size:14px;cursor:pointer"`;
}
function itemDivOptions(selectedId) {
  return _itemDivisions.map(d => {
    const id = d.DivisionId || d.DivisionID;
    return `<option value="${id}" ${id == selectedId ? 'selected' : ''}>${d.DivisionName}</option>`;
  }).join('');
}
function itemCatOptions(selectedId) {
  return _itemCategories.map(c =>
    `<option value="${c.CategoryId}" ${c.CategoryId == selectedId ? 'selected' : ''}>${c.CategoryName}</option>`
  ).join('');
}
function itemUOMOptions(selected) {
  return UOM_OPTIONS.map(u => `<option value="${u}" ${u === selected ? 'selected' : ''}>${u}</option>`).join('');
}
function itemPriorityOptions(selected) {
  return PRIORITY_OPTIONS.map(p =>
    `<option value="${p.val}" ${p.val === selected ? 'selected' : ''}>${p.label}</option>`
  ).join('');
}

function itemModalBody(rec = {}) {
  return `
    <div class="form-field" style="margin-bottom:14px">
      <label>Item ID <span style="color:var(--text-muted);font-size:11px">(auto-assigned)</span></label>
      <input type="text" value="${rec.itemid || '~auto'}" readonly
        style="background:var(--bg-dark);border:1px dashed var(--border);border-radius:6px;
               padding:9px 12px;color:var(--text-muted);width:100%;cursor:not-allowed;font-style:italic;opacity:0.7"/>
    </div>
    <div class="form-row cols-2" style="gap:12px;margin-bottom:14px">
      <div class="form-field">
        <label>Division <span style="color:var(--danger)">*</span></label>
        <select id="item-modal-div" ${itemSelStyle()}>
          <option value="">&#8212; Select &#8212;</option>
          ${itemDivOptions(rec.DivisionId)}
        </select>
      </div>
      <div class="form-field">
        <label>Category <span style="color:var(--danger)">*</span></label>
        <select id="item-modal-cat" ${itemSelStyle()}>
          <option value="">&#8212; Select &#8212;</option>
          ${itemCatOptions(rec.CategoryId, rec.DivisionId)}
        </select>
      </div>
    </div>
    <div class="form-field" style="margin-bottom:14px">
      <label>Item Name <span style="color:var(--danger)">*</span></label>
      <input type="text" id="item-modal-name" value="${rec.ItemName || ''}"
        style="background:var(--bg-dark);border:1px solid var(--border);border-radius:6px;
               padding:9px 12px;color:var(--text-primary);width:100%;font-size:14px"
        placeholder="e.g. Ring Box, EPS Box..."/>
    </div>
    <div class="form-row cols-2" style="gap:12px;margin-bottom:14px">
      <div class="form-field">
        <label>Stock</label>
        <input type="number" id="item-modal-stock" value="${rec.Stock ?? ''}" min="0"
          style="background:var(--bg-dark);border:1px solid var(--border);border-radius:6px;
                 padding:9px 12px;color:var(--text-primary);width:100%;font-size:14px"
          placeholder="0"/>
      </div>
      <div class="form-field">
        <label>Unit of Measurement <span style="color:var(--danger)">*</span></label>
        <select id="item-modal-uom" ${itemSelStyle()}>
          <option value="">&#8212; Select &#8212;</option>
          ${itemUOMOptions(rec.UOM)}
        </select>
      </div>
    </div>
    <div class="form-row cols-2" style="gap:12px;margin-bottom:14px">
      
      <div class="form-field">
        <label>Reorder Level</label>
        <input type="number" id="item-modal-rlevel" value="${rec.ReorderLevel ?? ''}" min="0"
          style="background:var(--bg-dark);border:1px solid var(--border);border-radius:6px;
                 padding:9px 12px;color:var(--text-primary);width:100%;font-size:14px"
          placeholder="0"/>
      </div>
      <div class="form-field">
        <label>Reorder Qty</label>
        <input type="number" id="item-modal-rqty" value="${rec.ReorderQty ?? ''}" min="0"
          style="background:var(--bg-dark);border:1px solid var(--border);border-radius:6px;
                 padding:9px 12px;color:var(--text-primary);width:100%;font-size:14px"
          placeholder="0"/>
      </div>
    </div>
    <div class="form-field">
      <label>Priority</label>
      <select id="item-modal-priority" ${itemSelStyle()}>
        ${itemPriorityOptions(rec.priority || 'M')}
      </select>
    </div>`;
}

function collectItemForm(overlay) {
  return {
    DivisionId:   overlay.querySelector('#item-modal-div').value,
    CategoryId:   overlay.querySelector('#item-modal-cat').value,
    ItemName:     overlay.querySelector('#item-modal-name').value.trim(),
    Stock:        overlay.querySelector('#item-modal-stock').value,
    UOM:          overlay.querySelector('#item-modal-uom').value,
    
    ReorderLevel: overlay.querySelector('#item-modal-rlevel').value,
    ReorderQty:   overlay.querySelector('#item-modal-rqty').value,
    priority:     overlay.querySelector('#item-modal-priority').value
  };
}

// Inline edit modal (opens on click of Item Name)
function showEditItemInline(rec) {
  const existing = $('#item-inline-editor'); if (existing) existing.remove();
  // Admin editing ANY existing item (even approved) will set it PENDING
  const willGoPending = isAdmin() && (rec.ApprovalStatus !== 'PENDING');
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'item-inline-editor';
  overlay.innerHTML = `
    <div class="modal" style="max-width:600px;animation:slideUp 0.2s ease">
      <div class="modal-header">
        <h3><i class="fas fa-pen-to-square"></i> Edit Item</h3>
        <button class="btn-close-modal" onclick="document.getElementById('item-inline-editor').remove()">
          <i class="fas fa-xmark"></i></button>
      </div>
      <div class="modal-body">
        ${willGoPending ? `<div style="background:rgba(249,115,22,0.1);border:1px solid rgba(249,115,22,0.4);border-radius:8px;padding:10px 14px;margin-bottom:14px;font-size:12.5px;color:#f97316;">
          <i class="fas fa-triangle-exclamation"></i>&nbsp;<strong>Note:</strong> Saving this edit will <strong>disable this item</strong> and submit it for Super Admin approval. It will not appear in any transactions until approved.
        </div>` : ''}
        ${itemModalBody(rec)}
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="document.getElementById('item-inline-editor').remove()">Cancel</button>
        <button class="btn btn-primary" id="btn-item-inline-save"><i class="fas fa-floppy-disk"></i> Save</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);
  overlay.onclick = e => { if (e.target === overlay) overlay.remove(); };
  document.getElementById('btn-item-inline-save').onclick = async () => {
    const b = collectItemForm(overlay);
    if (!b.DivisionId)  return showToast('Select a Division', 'error');
    if (!b.CategoryId)  return showToast('Select a Category', 'error');
    if (!b.ItemName)    return showToast('Item Name is required', 'error');
    if (!b.UOM)         return showToast('Select Unit of Measurement', 'error');
    try {
      await api(`/api/items/${rec.itemid}`, { method: 'PUT', body: b });
      overlay.remove();
      if (willGoPending) {
        showToast('Item saved and sent for Super Admin approval. It is now disabled until approved.', 'info');
      } else {
        showToast('Item updated!', 'success');
      }
      await loadItems();
    } catch (e) { showToast(e.message, 'error'); }
  };
  overlay.querySelector('#item-modal-name').focus();
}

// Add New modal
async function showAddItemModal() {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal" style="max-width:600px;animation:slideUp 0.2s ease">
      <div class="modal-header">
        <h3><i class="fas fa-plus-circle"></i> Add Item</h3>
        <button class="btn-close-modal" onclick="this.closest('.modal-overlay').remove()">
          <i class="fas fa-xmark"></i></button>
      </div>
      <div class="modal-body">${itemModalBody()}</div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
        <button class="btn btn-primary" id="btn-item-add-save"><i class="fas fa-plus"></i> Add Item</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);
  overlay.onclick = e => { if (e.target === overlay) overlay.remove(); };
  overlay.querySelector('.btn-close-modal').onclick = () => overlay.remove();
  overlay.querySelector('#item-modal-name').focus();
  overlay.querySelector('#btn-item-add-save').onclick = async () => {
    const b = collectItemForm(overlay);
    if (!b.DivisionId)  return showToast('Select a Division', 'error');
    if (!b.CategoryId)  return showToast('Select a Category', 'error');
    if (!b.ItemName)    return showToast('Item Name is required', 'error');
    if (!b.UOM)         return showToast('Select Unit of Measurement', 'error');
    try {
      await api('/api/items', { method: 'POST', body: b });
      overlay.remove(); showToast('Item added!', 'success'); await loadItems();
    } catch (e) { showToast(e.message, 'error'); }
  };
}

// Single Delete
window.deleteItem = async (id) => {
  if (!await confirm(`Delete Item ID ${id}? This cannot be undone.`)) return;
  try {
    await api(`/api/items/${id}`, { method: 'DELETE' });
    showToast('Item deleted!', 'success'); await loadItems(); updateItemBulkBar();
  } catch (e) { showToast(e.message, 'error'); }
};

// Bulk Delete
async function bulkDeleteItems() {
  const ids = $$('.item-row-chk:checked').map(c => parseInt(c.dataset.id));
  if (!ids.length) return;
  if (!await confirm(`Delete ${ids.length} item(s)? This cannot be undone.`)) return;
  try {
    await api('/api/items/bulk-delete', { method: 'POST', body: { ids } });
    showToast(`${ids.length} item(s) deleted!`, 'success');
    $('#item-select-all').checked = false; await loadItems(); updateItemBulkBar();
  } catch (e) { showToast(e.message, 'error'); }
}

// Bulk Export XLSX
async function bulkExportItems() {
  const ids = $$('.item-row-chk:checked').map(c => parseInt(c.dataset.id));
  try {
    const res = await fetch('/api/items/export-xlsx', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      credentials: 'include', body: JSON.stringify({ ids })
    });
    if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `item_master_${new Date().toISOString().split('T')[0]}.xlsx`;
    a.click(); URL.revokeObjectURL(url);
    showToast(`Exported ${ids.length} item(s) to XLSX!`, 'success');
  } catch (e) { showToast('Export failed: ' + e.message, 'error'); }
}

