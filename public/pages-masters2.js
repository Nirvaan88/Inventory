<<<<<<< HEAD
/* ================================================
   PAGES: Item Master, Vendor, Dealer, User, Login, Kit, Mapping
   ================================================ */

// -------- ITEM MASTER --------
// Full-featured Item Master is now in pages-masters.js - do not re-register here.
// registerPage('items', ...) REMOVED to avoid overriding the correct version.
/*
  return `${pageHeader('Item Master', 'fa-box', 'Masters / Item',
    `<button class="btn btn-primary" id="btn-add-item"><i class="fas fa-plus"></i> Add Item</button>`)}
  <div class="card">
    <div class="search-bar">
      <div class="search-input-wrap"><i class="fas fa-search"></i><input type="text" id="item-search" placeholder="Search items..."></div>
    </div>
    <div class="table-wrapper"><table id="tbl-items">
      <thead><tr><th>Item Name</th><th>Category</th><th>Division</th><th>Sell Price</th><th>Stock</th><th>Reorder Lvl</th><th>UOM</th><th>Actions</th></tr></thead>
      <tbody id="tbl-items-body"><tr class="empty-row"><td colspan="8">Loading...</td></tr></tbody>
    </table></div>
  </div></div>`;
});
window._pageBinders['items'] = async () => {
  await loadItems();
  bindTableSearch('item-search', 'tbl-items-body');
  $('#btn-add-item').onclick = () => showItemModal();
};
async function loadItems() {
  const data = await api('/api/items');
  const tbody = $('#tbl-items-body'); if (!tbody) return;
  tbody.innerHTML = data.length ? data.map(d => `<tr>
    <td><strong>${d.ItemName}</strong></td>
    <td>${d.CategoryName||'-'}</td><td>${d.DivisionName||'-'}</td>
    <td>&#8377;${fmtNum(d.SellPrice)}</td>
    <td><span class="badge ${(d.Stock||0) <= (d.ReorderLevel||0) ? 'badge-danger' : 'badge-success'}">${d.Stock||0}</span></td>
    <td>${d.ReorderLevel||0}</td><td>${d.UOM||'-'}</td>
    <td><div class="btn-bar">
      <button class="btn btn-info btn-sm" onclick="showItemModal(${d.Itemid})"><i class="fas fa-pen"></i></button>
      <button class="btn btn-danger btn-sm" onclick="deleteItem(${d.Itemid})"><i class="fas fa-trash"></i></button>
    </div></td></tr>`).join('') : `<tr class="empty-row"><td colspan="8">No items found.</td></tr>`;
}
window.showItemModal = async (id) => {
  const [cats, divs] = await Promise.all([api('/api/categories'), api('/api/divisions')]);
  let rec = {};
  if (id) { const data = await api('/api/items'); rec = data.find(d => d.Itemid === id) || {}; }
  const ov = modalHtml(id ? 'Edit Item' : 'Add Item', `
    <div class="form-row cols-2">
      <div class="form-field"><label>Item Name *</label><input type="text" id="it-name" value="${rec.ItemName||''}"/></div>
      <div class="form-field"><label>Category *</label>
        <select id="it-cat">${cats.map(c => `<option value="${c.CategoryId}" ${c.CategoryId==rec.CategoryId?'selected':''}>${c.CategoryName}</option>`).join('')}</select>
      </div>
    </div>
    <div class="form-row cols-2">
      <div class="form-field"><label>Division</label>
        <select id="it-div"><option value="">-- Select --</option>${divs.map(d => `<option value="${d.DivisionID}" ${d.DivisionID==rec.DivisionID?'selected':''}>${d.DivisionName}</option>`).join('')}</select>
      </div>
      <div class="form-field"><label>Sell Price</label><input type="number" id="it-price" value="${rec.SellPrice||0}" step="0.01"/></div>
    </div>
    <div class="form-row cols-3">
      <div class="form-field"><label>Stock</label><input type="number" id="it-stock" value="${rec.Stock||0}"/></div>
      <div class="form-field"><label>Reorder Level</label><input type="number" id="it-reorder" value="${rec.ReorderLevel||0}"/></div>
      <div class="form-field"><label>Reorder Qty</label><input type="number" id="it-reorderqty" value="${rec.ReorderQty||0}"/></div>
    </div>
    <div class="form-row cols-2">
      <div class="form-field"><label>UOM</label>
        <select id="it-uom">
          ${['PCS','KG','MTR','LTR','BOX','SET'].map(u => `<option ${u==rec.UOM?'selected':''}>${u}</option>`).join('')}
        </select>
      </div>
      <div class="form-field"><label>Priority</label>
        <select id="it-priority">
          ${['High','Medium','Low'].map(p => `<option ${p==rec.Priority?'selected':''}>${p}</option>`).join('')}
        </select>
      </div>
    </div>
    <div class="modal-footer" style="padding:16px 0 0">
      <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
      <button class="btn btn-primary" id="bit"><i class="fas fa-floppy-disk"></i> Save</button>
    </div>`, 'modal-lg');
  $('#bit', ov).onclick = async () => {
    const b = {
      ItemName: $('#it-name', ov).value.trim(), CategoryId: $('#it-cat', ov).value,
      DivisionID: $('#it-div', ov).value || null, SellPrice: $('#it-price', ov).value,
      Stock: $('#it-stock', ov).value, ReorderLevel: $('#it-reorder', ov).value,
      ReorderQty: $('#it-reorderqty', ov).value, UOM: $('#it-uom', ov).value,
      Priority: $('#it-priority', ov).value
    };
    if (!b.ItemName) return showToast('Item name required', 'error');
    try {
      if (id) await api(`/api/items/${id}`, { method: 'PUT', body: b });
      else await api('/api/items', { method: 'POST', body: b });
      ov.remove(); showToast('Item saved!'); await loadItems();
    } catch (e) { showToast(e.message, 'error'); }
  };
};
window.deleteItem = async (id) => { if (!await confirm('Delete this item?')) return; try { await api(`/api/items/${id}`, { method: 'DELETE' }); showToast('Deleted!'); await loadItems(); } catch (e) { showToast(e.message, 'error'); } };
*/


// -------- VENDOR MASTER (Full-Featured) --------
let _vendorStates = [], _vendorCities = [];

registerPage('vendors', () => {
  return `${pageHeader('Vendor Details', 'fa-truck', 'Masters / Vendor Details',
    `<button class="btn btn-primary" id="btn-add-vendor"><i class="fas fa-plus"></i>  Add New</button>`)}
  <div class="card">
    <div class="search-bar">
      <div class="search-input-wrap">
        <i class="fas fa-search"></i>
        <input type="text" id="vendor-search" placeholder="Search vendor name, company, GST, city...">
      </div>
      <select id="vendor-state-filter"
        style="background:var(--bg-dark);border:1px solid var(--border);border-radius:6px;
               padding:8px 14px;color:var(--text-primary);font-size:13.5px;cursor:pointer;min-width:170px">
        <option value="">All States</option>
      </select>
    </div>
    <div class="table-wrapper" style="overflow-x:auto">
      <table id="tbl-vendor-main" style="min-width:1800px;table-layout:fixed">
        <colgroup>
          <col style="width:42px">
          <col style="width:80px">
          <col style="width:160px">
          <col style="width:120px">
          <col style="width:180px">
          <col style="width:180px">
          <col style="width:130px">
          <col style="width:130px">
          <col style="width:90px">
          <col style="width:170px">
          <col style="width:140px">
          <col style="width:140px">
          <col style="width:160px">
          <col style="width:150px">
          <col style="width:155px">
          <col style="width:160px">
          <col style="width:190px">
          <col style="width:78px">
          <col style="width:110px">
          <col style="width:90px">
        </colgroup>
        <thead>
          <tr>
            <th class="col-sticky" style="width:42px;text-align:center;left:0;z-index:3">
              <input type="checkbox" id="vendor-select-all" title="Select all"
                style="width:16px;height:16px;cursor:pointer;accent-color:var(--accent)">
            </th>
            <th class="col-sticky" style="width:80px;left:42px;z-index:3">Vendor ID</th>
            <th class="col-sticky" style="width:160px;left:122px;z-index:3">Vendor Name</th>
            <th>Mob.</th>
            <th>Address 1</th>
            <th>Address 2</th>
            <th>State</th>
            <th>City</th>
            <th>Pin</th>
            <th>Company Name</th>
            <th>PAN</th>
            <th>Aadhar No</th>
            <th>GST No</th>
            <th>Bank Name</th>
            <th>Bank Acc No</th>
            <th>IFSC Code</th>
            <th style="min-width:170px">Vendor Email</th>
            <th style="width:78px">Status</th>
            <th style="width:110px">AI Score</th>
            <th class="col-sticky-right" style="width:90px;right:0;z-index:3">Actions</th>
          </tr>
        </thead>
        <tbody id="tbl-vendor-body">
          <tr class="empty-row"><td colspan="20"><div class="spinner" style="margin:0 auto"></div></td></tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- Sticky column CSS injected once -->
  <style id="vendor-sticky-css">
    #tbl-vendor-main .col-sticky { position: sticky; background: var(--bg-card); }
    #tbl-vendor-main .col-sticky-right { position: sticky; background: var(--bg-card); }
    #tbl-vendor-main tbody tr:hover td.col-sticky,
    #tbl-vendor-main tbody tr:hover td.col-sticky-right { background: var(--row-hover, rgba(212,175,55,0.06)); }
  </style>

  <!-- Floating bulk-action bar -->
  <div id="vendor-bulk-bar" style="
    display:none; position:fixed; bottom:28px; left:50%; transform:translateX(-50%);
    background:var(--bg-card); border:1px solid var(--accent); border-radius:12px;
    padding:12px 24px; z-index:500; box-shadow:0 8px 32px rgba(0,0,0,0.5);
    align-items:center; gap:16px; min-width:380px;">
    <span id="vendor-sel-count" style="color:var(--accent);font-weight:600;font-size:14px"></span>
    <div style="flex:1"></div>
    <button class="btn btn-success" id="btn-vendor-bulk-export"><i class="fas fa-file-excel"></i> Export XLSX</button>
    <button class="btn btn-danger"  id="btn-vendor-bulk-delete"><i class="fas fa-trash"></i> Delete Selected</button>
    <button class="btn btn-secondary btn-sm" id="btn-vendor-bulk-cancel" title="Cancel"><i class="fas fa-xmark"></i></button>
  </div>
  </div>`;
});

window._pageBinders['vendors'] = async () => {
  try {
    [_vendorStates, _vendorCities] = await Promise.all([
      api('/api/states'), api('/api/cities')
    ]);
  } catch (_) {}

  await loadVendors();
  // Load scorecards in background, inject badges when ready
  _injectVendorScores();

  const stateFilter = $('#vendor-state-filter');
  _vendorStates.forEach(s => {
    const o = document.createElement('option');
    o.value = s.StateID; o.textContent = s.State;
    stateFilter?.appendChild(o);
  });

  $('#vendor-search').oninput  = applyVendorFilters;
  stateFilter.onchange         = applyVendorFilters;
  $('#btn-add-vendor').onclick  = () => showAddVendorModal();
  $('#vendor-select-all').onchange = (e) => {
    $$('.vendor-row-chk').filter(c => c.closest('tr').style.display !== 'none')
      .forEach(c => { c.checked = e.target.checked; updateVendorBulkBar(); });
  };
  $('#btn-vendor-bulk-cancel').onclick = () => {
    $$('.vendor-row-chk').forEach(c => c.checked = false);
    $('#vendor-select-all').checked = false;
    updateVendorBulkBar();
  };
  $('#btn-vendor-bulk-export').onclick = () => bulkExportVendors();
  $('#btn-vendor-bulk-delete').onclick  = () => bulkDeleteVendors();
};

function applyVendorFilters() {
  const q       = ($('#vendor-search')?.value || '').toLowerCase();
  const stateId = $('#vendor-state-filter')?.value || '';
  $$('#tbl-vendor-body tr:not(.empty-row)').forEach(tr => {
    const matchText  = !q || tr.textContent.toLowerCase().includes(q);
    const matchState = !stateId || tr.dataset.stateId === stateId;
    tr.style.display = (matchText && matchState) ? '' : 'none';
  });
}

async function loadVendors() {
  const tbody = $('#tbl-vendor-body');
  if (!tbody) return;
  tbody.innerHTML = `<tr class="empty-row"><td colspan="20"><div class="spinner" style="margin:0 auto"></div></td></tr>`;
  let data;
  try { data = await api('/api/vendors?activeOnly=1'); }
  catch (e) {
    tbody.innerHTML = `<tr class="empty-row"><td colspan="19" style="color:var(--danger)">
      <i class="fas fa-circle-xmark"></i> Failed to load: ${e.message}</td></tr>`;
    return;
  }
  if (!data.length) {
    tbody.innerHTML = `<tr class="empty-row"><td colspan="19">No active vendors found.</td></tr>`;
    return;
  }

  tbody.innerHTML = data.map(d => `
    <tr data-id="${d.vendorid}" data-state-id="${d.StateID || ''}" class="vendor-row">
      <td class="col-sticky" style="left:0;text-align:center">
        <input type="checkbox" class="vendor-row-chk" data-id="${d.vendorid}"
          style="width:16px;height:16px;cursor:pointer;accent-color:var(--accent)">
      </td>
      <td class="col-sticky" style="left:42px;color:var(--text-secondary);font-size:13px">${d.vendorid}</td>
      <td class="col-sticky" style="left:122px">
        <span class="vendor-edit-cell" data-id="${d.vendorid}"
          style="cursor:pointer;text-decoration:underline dotted;text-underline-offset:3px;font-weight:500"
          title="Click to edit">${d.Name || '-'}</span>
      </td>
      <td style="font-size:13px">${d.Mob || '-'}</td>
      <td style="font-size:12px;color:var(--text-secondary)">${d.Addr1 || '-'}</td>
      <td style="font-size:12px;color:var(--text-secondary)">${d.Addr2 || '-'}</td>
      <td style="font-size:13px">${d.StateName || '-'}</td>
      <td style="font-size:13px">${d.CityName || '-'}</td>
      <td style="font-size:13px">${d.Pin || '-'}</td>
      <td style="font-size:13px">${d.CompanyName || '-'}</td>
      <td style="font-size:12px;font-family:monospace">${d.PAN || '-'}</td>
      <td style="font-size:12px;font-family:monospace">${d.AadharNo || '-'}</td>
      <td style="font-size:12px;font-family:monospace;color:var(--accent)">${d.GstNo || '-'}</td>
      <td style="font-size:13px">${d.BankName || '-'}</td>
      <td style="font-size:12px;font-family:monospace">${d.BankAccNo || '-'}</td>
      <td style="font-size:12px;font-family:monospace">${d.IFSCCode || '-'}</td>
      <td style="font-size:13px;color:var(--accent)">${d.VendorEmail || '-'}</td>
      <td>
        ${d.Status === 'Y'
          ? `<span style="background:rgba(22,163,74,.15);color:#16a34a;border-radius:20px;padding:2px 9px;font-size:11.5px;font-weight:600">Active</span>`
          : `<span style="background:rgba(220,38,38,.12);color:#dc2626;border-radius:20px;padding:2px 9px;font-size:11.5px;font-weight:600">Inactive</span>`}
      </td>
      <td class="vendor-score-cell" data-vid="${d.vendorid}"
          style="text-align:center;cursor:pointer" title="View Performance Scorecard"
          onclick="window._showVendorScorecardModal(${d.vendorid})">
        <span style="font-size:11px;color:var(--text-muted)">Loading…</span>
      </td>
      <td class="col-sticky-right" style="right:0">
        <button class="btn btn-danger btn-sm" onclick="deleteVendor(${d.vendorid})" title="Delete">
          <i class="fas fa-trash"></i>
        </button>
      </td>
    </tr>`).join('');

  $$('.vendor-row-chk').forEach(chk => {
    chk.onchange = () => { updateVendorBulkBar(); syncVendorSelectAll(); };
  });
  $$('.vendor-edit-cell').forEach(cell => {
    cell.onclick = () => {
      const row = data.find(d => d.vendorid === parseInt(cell.dataset.id));
      if (row) showEditVendorInline(row);
    };
  });
}

/* ═══════════════════════════════════════════════════════════════════
   VENDOR PERFORMANCE SCORECARD — AI Scoring Engine
═══════════════════════════════════════════════════════════════════ */

// Compute 0-100 score from raw metrics
function _computeVendorScore(d) {
  let score = 0;
  const parts = [];

  // 1. Delivery Speed (30 pts)
  if (d.AvgLeadDays >= 0) {
    const ld = d.AvgLeadDays;
    const pts = ld <= 3 ? 30 : ld <= 7 ? 25 : ld <= 14 ? 18 : ld <= 30 ? 10 : 5;
    score += pts;
    parts.push({ label: 'Delivery Speed', value: `Avg ${Math.round(ld)}d lead time`, pts, max: 30 });
  } else {
    score += 15; // neutral — no data
    parts.push({ label: 'Delivery Speed', value: 'No order-inward match yet', pts: 15, max: 30, neutral: true });
  }

  // 2. Qty Accuracy (35 pts)
  if (d.AvgAccuracyPct >= 0) {
    const acc = d.AvgAccuracyPct;
    const pts = acc >= 95 ? 35 : acc >= 85 ? 28 : acc >= 70 ? 18 : acc >= 50 ? 10 : 3;
    score += pts;
    parts.push({ label: 'Quantity Accuracy', value: `${Math.round(acc)}% of ordered qty received`, pts, max: 35 });
  } else {
    score += 25; // neutral
    parts.push({ label: 'Quantity Accuracy', value: 'No matched order/inward data', pts: 25, max: 35, neutral: true });
  }

  // 3. Return Rate (25 pts)
  if (d.ReturnRatePct >= 0) {
    const rr = d.ReturnRatePct;
    const pts = rr === 0 ? 25 : rr <= 2 ? 20 : rr <= 5 ? 14 : rr <= 10 ? 7 : 2;
    score += pts;
    parts.push({ label: 'Return Rate', value: `${rr.toFixed(1)}% of inward lines returned`, pts, max: 25 });
  } else {
    score += 20; // neutral
    parts.push({ label: 'Return Rate', value: 'No inward data yet', pts: 20, max: 25, neutral: true });
  }

  // 4. Order Frequency (10 pts)
  const to = d.TotalOrders || 0;
  const pts4 = to >= 10 ? 10 : to >= 5 ? 7 : to >= 2 ? 4 : to >= 1 ? 2 : 0;
  score += pts4;
  parts.push({ label: 'Order Frequency', value: `${to} order${to !== 1 ? 's' : ''} placed`, pts: pts4, max: 10 });

  // Grade
  const grade = score >= 85 ? { label: 'Excellent',     color: '#16a34a', icon: '🌟' }
              : score >= 70 ? { label: 'Reliable',       color: '#2563eb', icon: '✅' }
              : score >= 50 ? { label: 'Average',        color: '#d97706', icon: '🟡' }
              : score >= 30 ? { label: 'Below Average',  color: '#f97316', icon: '🟠' }
              :               { label: 'Poor',           color: '#dc2626', icon: '🔴' };

  return { score, parts, grade };
}

// Fetch scorecards and inject badges into vendor rows
async function _injectVendorScores() {
  let cards;
  try { cards = await api('/api/vendor-scorecard'); }
  catch (_) { return; }

  window._vendorScoreMap = {};
  cards.forEach(c => { window._vendorScoreMap[c.VendorId] = c; });

  $$('.vendor-score-cell').forEach(cell => {
    const vid = parseInt(cell.dataset.vid);
    const raw = window._vendorScoreMap[vid];
    if (!raw) {
      cell.innerHTML = '<span style="color:var(--text-muted);font-size:11px">—</span>';
      return;
    }
    const { score, grade } = _computeVendorScore(raw);
    cell.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:center;gap:5px">
        <div style="width:34px;height:34px;border-radius:50%;border:2px solid ${grade.color};
                    display:flex;align-items:center;justify-content:center;
                    font-size:11px;font-weight:800;color:${grade.color}">
          ${score}
        </div>
        <div style="font-size:10px;color:${grade.color};font-weight:600;line-height:1.2">
          ${grade.label}
        </div>
      </div>`;
  });
}

// Show detailed scorecard modal for a vendor
window._showVendorScorecardModal = (vendorId) => {
  const raw = window._vendorScoreMap?.[vendorId];
  const ov  = document.createElement('div');
  ov.className = 'modal-overlay';

  if (!raw) {
    ov.innerHTML = `<div class="modal" style="max-width:420px">
      <div class="modal-header"><h3><i class="fas fa-star"></i> Vendor Scorecard</h3>
        <button class="btn-close-modal" onclick="this.closest('.modal-overlay').remove()"><i class="fas fa-xmark"></i></button>
      </div>
      <div class="modal-body"><p style="color:var(--text-muted)">Score data not available. Visit Vendor Details to run analysis.</p></div>
    </div>`;
    document.body.appendChild(ov);
    ov.onclick = e => { if (e.target === ov) ov.remove(); };
    return;
  }

  const { score, parts, grade } = _computeVendorScore(raw);
  const circleOffset = Math.round(251 - (score / 100) * 251); // 2πr ≈ 251 for r=40

  ov.innerHTML = `
    <div class="modal" style="max-width:520px;animation:slideUp .22s ease">
      <div class="modal-header" style="background:linear-gradient(135deg,rgba(${grade.color === '#16a34a' ? '22,163,74' : grade.color === '#2563eb' ? '37,99,235' : '217,119,6'},.1),transparent)">
        <h3 style="gap:8px">
          <i class="fas fa-star-half-stroke" style="color:${grade.color}"></i>
          Vendor Performance Scorecard
        </h3>
        <button class="btn-close-modal" onclick="this.closest('.modal-overlay').remove()">
          <i class="fas fa-xmark"></i>
        </button>
      </div>
      <div class="modal-body">
        <!-- Vendor name + score meter -->
        <div style="display:flex;align-items:center;gap:20px;margin-bottom:20px;flex-wrap:wrap">
          <div style="flex:1;min-width:180px">
            <div style="font-weight:700;font-size:15px;color:var(--text-primary)">${raw.VendorName || 'Vendor'}</div>
            ${raw.CompanyName ? `<div style="font-size:12px;color:var(--text-muted)">${raw.CompanyName}</div>` : ''}
            <div style="margin-top:10px;display:flex;align-items:center;gap:8px">
              <span style="font-size:22px">${grade.icon}</span>
              <span style="font-size:14px;font-weight:700;color:${grade.color}">${grade.label}</span>
            </div>
            <div style="margin-top:6px;font-size:11.5px;color:var(--text-muted)">
              ${raw.TotalOrders} order${raw.TotalOrders !== 1 ? 's' : ''} &bull;
              ${raw.InwardCount} inward${raw.InwardCount !== 1 ? 's' : ''}
            </div>
          </div>
          <!-- Circular score meter -->
          <div style="flex-shrink:0;position:relative;width:90px;height:90px">
            <svg width="90" height="90" viewBox="0 0 90 90">
              <circle cx="45" cy="45" r="40" fill="none" stroke="var(--border)" stroke-width="8"/>
              <circle cx="45" cy="45" r="40" fill="none" stroke="${grade.color}" stroke-width="8"
                stroke-dasharray="251" stroke-dashoffset="${circleOffset}"
                stroke-linecap="round" transform="rotate(-90 45 45)"
                style="transition:stroke-dashoffset .6s ease"/>
            </svg>
            <div style="position:absolute;inset:0;display:flex;flex-direction:column;
                        align-items:center;justify-content:center">
              <div style="font-size:22px;font-weight:800;color:${grade.color}">${score}</div>
              <div style="font-size:9px;color:var(--text-muted);letter-spacing:.5px">/ 100</div>
            </div>
          </div>
        </div>

        <!-- Signal breakdown cards -->
        <div style="display:grid;gap:8px">
          ${parts.map(p => {
            const pct = Math.round(p.pts / p.max * 100);
            const barColor = p.neutral ? '#94a3b8' : p.pts / p.max >= 0.8 ? '#16a34a' : p.pts / p.max >= 0.5 ? '#d97706' : '#dc2626';
            return `
            <div style="background:var(--bg-dark);border-radius:8px;padding:10px 14px;
                        border:1px solid var(--border)">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
                <div style="font-size:12px;font-weight:600;color:var(--text-primary)">${p.label}</div>
                <div style="font-size:12px;font-weight:700;color:${barColor}">${p.pts}/${p.max}</div>
              </div>
              <div style="height:5px;background:var(--border);border-radius:3px;overflow:hidden">
                <div style="height:100%;width:${pct}%;background:${barColor};border-radius:3px;transition:width .5s ease"></div>
              </div>
              <div style="font-size:11px;color:var(--text-muted);margin-top:4px">${p.value}${p.neutral ? ' (using neutral baseline)' : ''}</div>
            </div>`;
          }).join('')}
        </div>

        <!-- Recommendation -->
        <div style="margin-top:14px;padding:10px 14px;background:rgba(201,162,39,.06);
                    border:1px solid rgba(201,162,39,.2);border-radius:8px;font-size:12px;
                    color:var(--text-secondary);line-height:1.6">
          <i class="fas fa-lightbulb" style="color:var(--accent);margin-right:6px"></i>
          <strong style="color:var(--text-primary)">AI Insight: </strong>
          ${score >= 85 ? 'This vendor is performing excellently. Consider prioritising them for future orders.' :
            score >= 70 ? 'This vendor is reliable. Small improvements in delivery speed or quantity accuracy could push them to excellent.' :
            score >= 50 ? 'Average performance. Review return rates and delivery consistency before placing large orders.' :
            score >= 30 ? 'Below average. Consider discussing performance with the vendor or exploring alternatives.' :
            'Poor performance detected. Strongly recommend evaluating alternative vendors for this category.'}
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Close</button>
        <button class="btn btn-primary btn-sm" onclick="navigateTo('vendor-scorecard');this.closest('.modal-overlay').remove()">
          <i class="fas fa-chart-bar"></i> Full Scorecard Report
        </button>
      </div>
    </div>`;

  document.body.appendChild(ov);
  ov.onclick = e => { if (e.target === ov) ov.remove(); };
};

function syncVendorSelectAll() {
  const all = $$('.vendor-row-chk'), checked = all.filter(c => c.checked);
  const sa = $('#vendor-select-all'); if (!sa) return;
  sa.checked = all.length > 0 && checked.length === all.length;
  sa.indeterminate = checked.length > 0 && checked.length < all.length;
}

function updateVendorBulkBar() {
  const checked = $$('.vendor-row-chk:checked');
  const bar = $('#vendor-bulk-bar'); if (!bar) return;
  if (checked.length > 0) {
    bar.style.display = 'flex';
    $('#vendor-sel-count').textContent = `${checked.length} vendor${checked.length > 1 ? 's' : ''} selected`;
  } else { bar.style.display = 'none'; }
}

// Helpers
function vSelStyle() {
  return `style="background:var(--bg-dark);border:1px solid var(--border);border-radius:6px;
          padding:9px 12px;color:var(--text-primary);width:100%;font-size:14px;cursor:pointer"`;
}
function vInpStyle() {
  return `style="background:var(--bg-dark);border:1px solid var(--border);border-radius:6px;
          padding:9px 12px;color:var(--text-primary);width:100%;font-size:14px"`;
}
function vStateOptions(selectedId) {
  const hasSel = selectedId != null && selectedId !== '';
  return _vendorStates.map(s =>
    `<option value="${s.StateID}" ${hasSel && s.StateID == selectedId ? 'selected' : ''}>${s.State}</option>`
  ).join('');
}
function vCityOptions(selectedId, stateId='') {
  const hasSel = selectedId != null && selectedId !== '';
  const pool = stateId
    ? _vendorCities.filter(c => c.StateID == stateId)
    : _vendorCities;
  return pool.map(c =>
    `<option value="${c.CityID}" ${hasSel && c.CityID == selectedId ? 'selected' : ''}>${c.City}</option>`
  ).join('');
}
function _bindVndStateCityFilter(ov) {
  const stateEl = ov.querySelector('#vnd-state');
  const cityEl  = ov.querySelector('#vnd-city');
  if (!stateEl || !cityEl) return;
  stateEl.onchange = () => {
    const sid = stateEl.value;
    cityEl.innerHTML = `<option value="">- Select -</option>${vCityOptions('', sid)}`;
  };
}

function vendorModalBody(rec = {}) {
  return `
    <div class="form-field" style="margin-bottom:14px">
      <label>Vendor ID <span style="color:var(--text-muted);font-size:11px">(auto-assigned)</span></label>
      <input type="text" value="${rec.vendorid || '~auto'}" readonly
        style="background:var(--bg-dark);border:1px dashed var(--border);border-radius:6px;
               padding:9px 12px;color:var(--text-muted);width:100%;cursor:not-allowed;font-style:italic;opacity:0.7"/>
    </div>
    <div class="form-row cols-2" style="gap:12px;margin-bottom:14px">
      <div class="form-field">
        <label>Vendor Name <span style="color:var(--danger)">*</span></label>
        <input type="text" id="vnd-name" value="${rec.Name || ''}" ${vInpStyle()} placeholder="e.g. Mr. Ujjawal"/>
      </div>
      <div class="form-field">
        <label>Mobile</label>
        <input type="text" id="vnd-mob" value="${rec.Mob || ''}" ${vInpStyle()} placeholder="10-digit mobile"/>
      </div>
    </div>
    <div class="form-row cols-2" style="gap:12px;margin-bottom:14px">
      <div class="form-field">
        <label>Address 1</label>
        <input type="text" id="vnd-addr1" value="${rec.Addr1 || ''}" ${vInpStyle()}/>
      </div>
      <div class="form-field">
        <label>Address 2</label>
        <input type="text" id="vnd-addr2" value="${rec.Addr2 || ''}" ${vInpStyle()}/>
      </div>
    </div>
    <div class="form-row cols-3" style="gap:12px;margin-bottom:14px">
      <div class="form-field">
        <label>State</label>
        <select id="vnd-state" ${vSelStyle()}>
          <option value="">- Select -</option>
          ${vStateOptions(rec.StateID)}
        </select>
      </div>
      <div class="form-field">
        <label>City</label>
        <select id="vnd-city" ${vSelStyle()}>
          <option value="">- Select -</option>
          ${vCityOptions(rec.CityID, rec.StateID)}
        </select>
      </div>
      <div class="form-field">
        <label>Pin</label>
        <input type="text" id="vnd-pin" value="${rec.Pin || ''}" ${vInpStyle()} placeholder="6-digit"/>
      </div>
    </div>
    <div class="form-row cols-2" style="gap:12px;margin-bottom:14px">
      <div class="form-field">
        <label>Company Name</label>
        <input type="text" id="vnd-company" value="${rec.CompanyName || ''}" ${vInpStyle()}/>
      </div>
      <div class="form-field">
        <label>PAN</label>
        <input type="text" id="vnd-pan" value="${rec.PAN || ''}" ${vInpStyle()} placeholder="ABCDE1234F"/>
      </div>
    </div>
    <div class="form-row cols-2" style="gap:12px;margin-bottom:14px">
      <div class="form-field">
        <label>Aadhar No</label>
        <input type="text" id="vnd-aadhar" value="${rec.AadharNo || ''}" ${vInpStyle()}/>
      </div>
      <div class="form-field">
        <label>GST No</label>
        <input type="text" id="vnd-gst" value="${rec.GstNo || ''}" ${vInpStyle()} placeholder="15-char GST"/>
      </div>
    </div>
    <div class="form-row cols-3" style="gap:12px">
      <div class="form-field">
        <label>Bank Name</label>
        <input type="text" id="vnd-bank" value="${rec.BankName || ''}" ${vInpStyle()}/>
      </div>
      <div class="form-field">
        <label>Bank Acc No</label>
        <input type="text" id="vnd-bankac" value="${rec.BankAccNo || ''}" ${vInpStyle()}/>
      </div>
      <div class="form-field">
        <label>IFSC Code</label>
        <input type="text" id="vnd-ifsc" value="${rec.IFSCCode || ''}" ${vInpStyle()} placeholder="SBIN0001234"/>
      </div>
    </div>
    <div class="form-row cols-1" style="gap:12px;margin-top:14px">
      <div class="form-field">
        <label>Vendor Email ID</label>
        <input type="email" id="vnd-email" value="${rec.VendorEmail || ''}" ${vInpStyle()} placeholder="vendor@example.com"/>
      </div>
    </div>`;
}

function collectVendorForm(overlay) {
  return {
    Name:       overlay.querySelector('#vnd-name').value.trim(),
    Mob:        overlay.querySelector('#vnd-mob').value.trim(),
    Addr1:      overlay.querySelector('#vnd-addr1').value.trim(),
    Addr2:      overlay.querySelector('#vnd-addr2').value.trim(),
    StateID:    overlay.querySelector('#vnd-state').value,
    CityID:     overlay.querySelector('#vnd-city').value,
    Pin:        overlay.querySelector('#vnd-pin').value.trim(),
    CompanyName:overlay.querySelector('#vnd-company').value.trim(),
    PAN:        overlay.querySelector('#vnd-pan').value.trim(),
    AadharNo:   overlay.querySelector('#vnd-aadhar').value.trim(),
    GstNo:      overlay.querySelector('#vnd-gst').value.trim(),
    BankName:   overlay.querySelector('#vnd-bank').value.trim(),
    BankAccNo:  overlay.querySelector('#vnd-bankac').value.trim(),
    IFSCCode:   overlay.querySelector('#vnd-ifsc').value.trim(),
    VendorEmail:overlay.querySelector('#vnd-email').value.trim()
  };
}

// Inline Edit (opens on Vendor Name click)
function showEditVendorInline(rec) {
  const existing = $('#vendor-inline-editor'); if (existing) existing.remove();
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'vendor-inline-editor';
  overlay.innerHTML = `
    <div class="modal" style="max-width:680px;animation:slideUp 0.2s ease">
      <div class="modal-header">
        <h3><i class="fas fa-pen-to-square"></i> Edit Vendor</h3>
        <button class="btn-close-modal" onclick="document.getElementById('vendor-inline-editor').remove()">
          <i class="fas fa-xmark"></i></button>
      </div>
      <div class="modal-body">${vendorModalBody(rec)}</div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="document.getElementById('vendor-inline-editor').remove()">Cancel</button>
        <button class="btn btn-primary" id="btn-vendor-inline-save"><i class="fas fa-floppy-disk"></i> Save</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);
  overlay.onclick = e => { if (e.target === overlay) overlay.remove(); };
  _bindVndStateCityFilter(overlay);
  document.getElementById('btn-vendor-inline-save').onclick = async () => {
    const b = collectVendorForm(overlay);
    if (!b.Name) return showToast('Vendor Name is required', 'error');
    try {
      await api(`/api/vendors/${rec.vendorid}`, { method: 'PUT', body: b });
      overlay.remove(); showToast('Vendor updated!', 'success'); await loadVendors();
    } catch (e) { showToast(e.message, 'error'); }
  };
  overlay.querySelector('#vnd-name').focus();
}

// Add New Modal
async function showAddVendorModal() {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal" style="max-width:680px;animation:slideUp 0.2s ease">
      <div class="modal-header">
        <h3><i class="fas fa-plus-circle"></i> Add Vendor</h3>
        <button class="btn-close-modal" onclick="this.closest('.modal-overlay').remove()">
          <i class="fas fa-xmark"></i></button>
      </div>
      <div class="modal-body">${vendorModalBody()}</div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
        <button class="btn btn-primary" id="btn-vendor-add-save"><i class="fas fa-plus"></i> Add Vendor</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);
  overlay.onclick = e => { if (e.target === overlay) overlay.remove(); };
  overlay.querySelector('.btn-close-modal').onclick = () => overlay.remove();
  _bindVndStateCityFilter(overlay);
  overlay.querySelector('#vnd-name').focus();
  overlay.querySelector('#btn-vendor-add-save').onclick = async () => {
    const b = collectVendorForm(overlay);
    if (!b.Name) return showToast('Vendor Name is required', 'error');
    try {
      await api('/api/vendors', { method: 'POST', body: b });
      overlay.remove(); showToast('Vendor added!', 'success'); await loadVendors();
    } catch (e) { showToast(e.message, 'error'); }
  };
}

// Single Delete
window.deleteVendor = async (id) => {
  if (!await confirm(`Delete Vendor ID ${id}? This cannot be undone.`)) return;
  try {
    await api(`/api/vendors/${id}`, { method: 'DELETE' });
    showToast('Vendor deleted!', 'success'); await loadVendors(); updateVendorBulkBar();
  } catch (e) { showToast(e.message, 'error'); }
};

// Bulk Delete
async function bulkDeleteVendors() {
  const ids = $$('.vendor-row-chk:checked').map(c => parseInt(c.dataset.id));
  if (!ids.length) return;
  if (!await confirm(`Delete ${ids.length} vendor(s)? This cannot be undone.`)) return;
  try {
    await api('/api/vendors/bulk-delete', { method: 'POST', body: { ids } });
    showToast(`${ids.length} vendor(s) deleted!`, 'success');
    $('#vendor-select-all').checked = false; await loadVendors(); updateVendorBulkBar();
  } catch (e) { showToast(e.message, 'error'); }
}

// Bulk Export XLSX
async function bulkExportVendors() {
  const ids = $$('.vendor-row-chk:checked').map(c => parseInt(c.dataset.id));
  try {
    const res = await fetch('/api/vendors/export-xlsx', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      credentials: 'include', body: JSON.stringify({ ids })
    });
    if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vendor_details_${new Date().toISOString().split('T')[0]}.xlsx`;
    a.click(); URL.revokeObjectURL(url);
    showToast(`Exported ${ids.length} vendor(s) to XLSX!`, 'success');
  } catch (e) { showToast('Export failed: ' + e.message, 'error'); }
}


// ======== DEALER MASTER ========

const _DEALER_STATES = ['Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat','Haryana','Himachal Pradesh','Jammu & Kashmir','Jharkhand','Karnataka','Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Orissa','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal'];
const _DEALER_CITIES = ['Agartala','Agra','Ahmedabad','Aizwal','Ajmer','Alibaug','Allahabad','Alleppey','Almora','Alsisar','Alwar','Ambala','Amla','Amritsar','Anand','Anini','Ankleshwar','Ashtamudi','Auli','Aurangabad','Baddi','Badrinath','Balasinor','Balrampur','Bambora','Bamenq','Bandhavgarh','Bandipur','Bangalore','Barbil','Bareilly','Behror','Belgaum','Berhampur','Betalghat','Bhandardara','Bharatpur','Bharuch','Bhavangadh','Bhavnagar','Bhilai','Bhimtal','Bhopal','Bhubaneshwar','Bhuj','Bikaner','Binsar','Bodhgaya','Bundi','Calicut','Canannore','Chail','Chamba','Chandigarh','Chennai','Chikmagalur','Chiplun','Chitrakoot','Chittorgarh','Coimbatore','Coonoor','Coorg','Corbett National Park','Cuttack','Dabhosa','Dalhousie','Dandeli','Dapoli','Darjeeling','Dausa','Dehradun','Dharamshala','Dibrugarh','Digha','Dimapur','Dive Agar','Dooars','Durgapur','Durshet','Dwarka','Faridabad','Firozabad','Ganapatipule','Gandhidham','Gandhinagar','Gangotri','Gangtok','Garhmukteshwar','Garhwal','Gaya','Goa','Gokharna','Gondal','Gorakhpur','Gulmarg','Gurgaon','Guruvayoor','Guwahati','Gwalior','Halebid','Hampi','Hansi','Haridwar','Hassan','Hospet','Hosur','Hubli','Hyderabad','Idukki','Igatpuri','Imphal','Indore','Jabalpur','Jaipur','Jairampur','Jaisalmer','Jalandhar','Jalgaon','Jambugodha','Jammu','Jamnagar','Jamshedpur','Jawhar','Jhansi','Jodhpur','Jojawar','Jorhat','Junagadh','Kabini','Kalimpong','Kanatal','Kanchipuram','Kanha','Kanpur','Kanyakumari','Kargil','Karjat','Karnal','Karur','Karwar','Kasargod','Kasauli','Kashid','Kashipur','Katra','Kausani','Kaza','Kaziranga','Kedarnath','Khajjiar','Khajuraho','Khandala','Khimsar','Kiphire','Kochin','Kodaikanal','Kohima','Kolhapur','Kolkata','Kollam','Kota','Kotagiri','Kottayam','Kovalam','Kufri','Kullu','Kumarakom','Kumbakonam','Kumbalgarh','Kumily','Kurseong','Kushinagar','Lachung','Leh','Lonavala','Lothal','Lucknow','Ludhiana','Madurai','Mahabaleshwar','Mahabalipuram','Malappuram','Malpe','Malshej Ghat','Malvan','Manali','Mandavi','Mandawa','Mandormoni','Manesar','Mangalore','Manmad','Mararri','Marchula','Matheran','Mathura','Mcleodganj','Miao','Mipi','Mohali','Mokokchung','Moradabad','Morbi','Mount Abu','Mukteshwar','Mumbai','Mundra','Munnar','Murud Janjira','Mussoorie','Mysore','Nadukani','Nagapattinam','Nagarhole','Nagaur Fort','Nagothane','Nagpur','Nahan','Nainital','Naldhera','Nanded','Napne','Nasik','Navi Mumbai','Neral','Nilgiri','Noida','Ooty','Orchha','Osian','Pachmarhi','Pahalgam','Pakke-Kessanq','Palampur','Palanpur','Pali','Palitana','Pallakad','Panchgani','Panchkula','Panhala','Panna','Pantnagar','Panvel','Parwanoo','Pathankot','Patiala','Patna','Patnitop','Pelling','Pench','Peren','Phagwara','Phalodi','Phek','Pinjore','Pondicherry','Poovar','Porbandar','Poshina','Pragpur','Pune','Puri','Puskhar','Puttaparthi','Rai Bareilly','Raichak','Raipur','Rajahmundry','Rajasthan','Rajgir','Rajkot','Rajpipla','Rajsamand','Ram Nagar','Rameshwaram','Ramgarh','Ranakpur','Ranchi','Ranikhet','Ranny','Ranthambore','Ratnagiri','Ravangla','Rishikesh','Rishyap','Rohetgarh','Rourkela','Rupa','Sajan','Salem','Saputara','Sasan Gir','Sattal','Sawai Madhopur','Sawantwadi','Secunderabad','Seppa','Sharavanbelgola','Shillong','Shimla','Shimlipal','Shirdi','Shivanasamudra','Siana','Siliguri','Sinqchunq','Sivaganga District','Solan','Soma','Sonauli','Srinagar','Sunderban','Surat','Tanjore','Tapola','Tarapith','Thane','Thekkady','Thembanq','Thiruvananthapuram','Thirvannamalai','Thrissur','Tiruchirapalli','Tirupati','Tirupur','Tuensang','Udaipur','Udhampur','Udupi','Ujjain','Uttarakhand','Uttarkashi','Vadodara','Vagamon','Vapi','Varanasi','Varkala','Velankanni','Vellore','Veraval','Vijayawada','Vikramgadh','Vishakapatnam','Wakro','Wankaner','Wayanad','Wokha','Yamunotri','Yercaud','Yuksom','Zemithanq','Zunheboto'];

function _dlStateOpts(sel) { return `<option value="">- Select State -</option>${_DEALER_STATES.map(s=>`<option value="${s}" ${s===sel?'selected':''}>${s}</option>`).join('')}`; }
function _dlCityOpts(sel)  { return `<option value="">- Select City -</option>${_DEALER_CITIES.map(c=>`<option value="${c}" ${c===sel?'selected':''}>${c}</option>`).join('')}`; }
function _dlCourierOpts(couriers, selId) { return `<option value="">- Select -</option>${couriers.map(c=>`<option value="${c.CourierId}" ${c.CourierId==selId?'selected':''}>${c.Name}</option>`).join('')}`; }
function _dlDivOpts(divs, selId) { return `<option value="">- Select -</option>${divs.map(d=>{const id=d.DivisionId||d.DivisionID;return `<option value="${id}" ${id==selId?'selected':''}>${d.DivisionName}</option>`}).join('')}`; }
function _dlSelStyle() { return `style="background:var(--bg-dark);border:1px solid var(--border);border-radius:6px;padding:9px 12px;color:var(--text-primary);width:100%;font-size:13.5px;cursor:pointer"`; }
function _dlInStyle() { return `style="background:var(--bg-dark);border:1px solid var(--border);border-radius:6px;padding:9px 12px;color:var(--text-primary);width:100%;font-size:13.5px"`; }

registerPage('dealers', () => {
  const sticky = `position:sticky;background:var(--bg-card);z-index:2`;
  return `${pageHeader('Dealer Master','fa-store','Masters / Dealer',
    `<button class="btn btn-success" id="btn-sync-franchise" title="Fetch latest stores from Taqtics API">
       <i class="fas fa-rotate"></i> Sync Franchise Stores
     </button>
     <button class="btn btn-primary" id="btn-add-dealer"><i class="fas fa-plus"></i> Add New</button>`)}
  <div class="card">
    <div class="search-bar" style="display:flex;align-items:center;gap:12px;flex-wrap:wrap">
      <div class="search-input-wrap" style="flex:1"><i class="fas fa-search"></i>
        <input type="text" id="dealer-search" placeholder="Search by company name...">
      </div>
      <label style="display:flex;align-items:center;gap:7px;cursor:pointer;font-size:13px;color:var(--text-secondary);white-space:nowrap;user-select:none">
        <input type="checkbox" id="dl-show-inactive" style="width:15px;height:15px;accent-color:var(--accent);cursor:pointer">
        Show Inactive
      </label>
    </div>
    <div class="table-wrapper" style="overflow-x:auto">
      <table id="tbl-dealer-main" style="min-width:2400px;border-collapse:collapse">
        <thead><tr>
          <th style="${sticky};left:0;width:42px;text-align:center">
            <input type="checkbox" id="dealer-select-all" style="width:16px;height:16px;cursor:pointer;accent-color:var(--accent)" title="Select all records across all pages">
          </th>
          <th style="${sticky};left:42px;width:80px">Dealer ID</th>
          <th style="${sticky};left:122px;width:170px">Contact Person</th>
          <th style="${sticky};left:292px;width:170px">Company Name</th>
          <th style="width:160px">Address 1</th>
          <th style="width:140px">Address 2</th>
          <th style="width:140px">Address 3</th>
          <th style="width:110px">Mob.</th>
          <th style="width:130px">GST No</th>
          <th style="width:160px">Place of Sales Promo.</th>
          <th style="width:130px">State</th>
          <th style="width:120px">City</th>
          <th style="width:80px">Pin</th>
          <th style="width:100px">Tel No</th>
          <th style="width:160px">Email</th>
          <th style="width:110px">Dealer Type</th>
          <th style="width:110px">PAN</th>
          <th style="width:130px">Aadhar No</th>
          <th style="width:130px">Bank Name</th>
          <th style="width:130px">Bank Acc No</th>
          <th style="width:110px">IFSC Code</th>
          <th style="width:90px" title="Click any badge to toggle status">Status ⚡</th>
          <th style="${sticky};right:0;width:90px;text-align:center">Actions</th>
        </tr></thead>
        <tbody id="tbl-dealer-body">
          <tr class="empty-row"><td colspan="23"><div class="spinner" style="margin:0 auto"></div></td></tr>
        </tbody>
      </table>
    </div>
    <!-- Pagination -->
    <div id="dealer-pagination" style="display:flex;align-items:center;justify-content:space-between;padding:14px 6px 4px;flex-wrap:wrap;gap:8px"></div>
  </div>

  <!-- Bulk bar -->
  <div id="dealer-bulk-bar" style="display:none;position:fixed;bottom:28px;left:50%;transform:translateX(-50%);
    background:var(--bg-card);border:1px solid var(--accent);border-radius:12px;padding:12px 24px;
    z-index:500;box-shadow:0 8px 32px rgba(0,0,0,.5);align-items:center;gap:16px;min-width:380px">
    <span id="dealer-sel-count" style="color:var(--accent);font-weight:600;font-size:14px"></span>
    <div style="flex:1"></div>
    <button class="btn btn-success" id="btn-dealer-bulk-export"><i class="fas fa-file-excel"></i> Export XLSX</button>
    <button class="btn btn-danger"  id="btn-dealer-bulk-delete"><i class="fas fa-trash"></i> Delete Selected</button>
    <button class="btn btn-secondary btn-sm" id="btn-dealer-bulk-cancel"><i class="fas fa-xmark"></i></button>
  </div>
  </div>`;
});

// ---- Dealer state ----

let _dealerCouriers = [], _dealerDivs = [];
let _dlPage = 1, _dlPageSize = 25, _dlTotal = 0, _dlSearch = '';
let _dlSelectedIds = new Set(); // tracks selection across pages
let _dlShowInactive = false;    // when true, also shows Status='N' dealers

window._pageBinders['dealers'] = async () => {
  _dlPage = 1; _dlSearch = ''; _dlShowInactive = false; _dlSelectedIds.clear();
  try {
    [_dealerCouriers, _dealerDivs] = await Promise.all([
      api('/api/couriers'),
      api('/api/divisions?active=1')
    ]);
  } catch(_){}
  await loadDealers(1);

  // Server-side search with debounce
  let _dlSearchTimer;
  $('#dealer-search').oninput = () => {
    clearTimeout(_dlSearchTimer);
    _dlSearchTimer = setTimeout(() => {
      _dlSearch = $('#dealer-search').value.trim();
      _dlSelectedIds.clear();
      loadDealers(1);
    }, 350);
  };

  // Show Inactive toggle
  $('#dl-show-inactive').onchange = (e) => {
    _dlShowInactive = e.target.checked;
    _dlSelectedIds.clear();
    loadDealers(1);
  };

  // Sync Franchise Stores
  $('#btn-sync-franchise').onclick = async () => {
    const btn = $('#btn-sync-franchise');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-rotate fa-spin"></i> Syncing...';
    try {
      const result = await api('/api/dealers/sync-franchise', { method: 'POST' });
      showToast(result.message || 'Sync complete!', 'success');
      await loadDealers(1);
    } catch(e) {
      showToast('Sync failed: ' + e.message, 'error');
    } finally {
      btn.disabled = false;
      btn.innerHTML = '<i class="fas fa-rotate"></i> Sync Franchise Stores';
    }
  };

  // Select ALL across pages
  $('#dealer-select-all').onchange = async (e) => {
    if (e.target.checked) {
      e.target.disabled = true;
      showToast('Selecting all dealers...', 'info');
      try {
        const params = new URLSearchParams();
        if (_dlSearch) params.set('search', _dlSearch);
        if (_dlShowInactive) params.set('showInactive', '1');
        const all = await api('/api/dealers?' + params.toString());
        all.forEach(d => _dlSelectedIds.add(d.DealerID));
        $$('.dl-row-chk').forEach(c => c.checked = true);
      } catch(_){}
      e.target.disabled = false;
    } else {
      _dlSelectedIds.clear();
      $$('.dl-row-chk').forEach(c => c.checked = false);
    }
    updateDealerBulkBar();
  };

  $('#btn-add-dealer').onclick = () => showAddDealerModal();
  $('#btn-dealer-bulk-export').onclick = () => bulkExportDealers();
  $('#btn-dealer-bulk-delete').onclick  = () => bulkDeleteDealers();
  $('#btn-dealer-bulk-cancel').onclick  = () => {
    _dlSelectedIds.clear();
    $$('.dl-row-chk').forEach(c => c.checked = false);
    const sa = $('#dealer-select-all'); if (sa) { sa.checked = false; sa.indeterminate = false; }
    updateDealerBulkBar();
  };
};


async function loadDealers(page) {
  if (page !== undefined) _dlPage = page;
  const tbody = $('#tbl-dealer-body'); if (!tbody) return;
  tbody.innerHTML = `<tr class="empty-row"><td colspan="23"><div class="spinner" style="margin:0 auto"></div></td></tr>`;

  try {
    const params = new URLSearchParams({ page: _dlPage, pageSize: _dlPageSize });
    if (_dlSearch) params.set('search', _dlSearch);
    if (_dlShowInactive) params.set('showInactive', '1');
    const result = await api('/api/dealers?' + params.toString());
    _dlTotal = result.total;
    const data  = result.data;

    if (!data.length) {
      tbody.innerHTML = `<tr class="empty-row"><td colspan="23">No dealers found.</td></tr>`;
      renderDealerPagination();
      return;
    }

    const sticky = `position:sticky;background:var(--bg-card);z-index:1`;
    // Clickable status badge — click to toggle Active/Inactive
    const statusBadge = d => {
      const isActive = d.Status === 'Y';
      return `<span class="dl-status-badge"
        data-id="${d.DealerID}" data-status="${d.Status}"
        title="Click to ${isActive ? 'deactivate' : 'activate'} this dealer"
        style="cursor:pointer;border-radius:20px;padding:3px 11px;font-size:11.5px;font-weight:600;
               transition:opacity 0.15s;
               ${isActive
                 ? 'background:rgba(22,163,74,.15);color:#16a34a'
                 : 'background:rgba(220,38,38,.12);color:#dc2626'}"
        onmouseover="this.style.opacity='0.7'" onmouseout="this.style.opacity='1'">
        <i class="fas fa-${isActive ? 'circle-check' : 'circle-xmark'}" style="font-size:10px"></i>
        ${isActive ? 'Active' : 'Inactive'}
      </span>`;
    };

    tbody.innerHTML = data.map(d => `
      <tr data-id="${d.DealerID}" class="dl-row">
        <td style="${sticky};left:0;text-align:center">
          <input type="checkbox" class="dl-row-chk" data-id="${d.DealerID}"
            style="width:16px;height:16px;cursor:pointer;accent-color:var(--accent)"
            ${_dlSelectedIds.has(d.DealerID) ? 'checked' : ''}>
        </td>
        <td style="${sticky};left:42px;color:var(--text-secondary);font-size:13px">${d.DealerID}</td>
        <td style="${sticky};left:122px">
          <span class="dl-edit-cell" data-id="${d.DealerID}"
            style="cursor:pointer;text-decoration:underline dotted;text-underline-offset:3px" title="Click to edit">
            ${d.ContactPersonName||'-'}</span></td>
        <td style="${sticky};left:292px">
          <span class="dl-edit-cell" data-id="${d.DealerID}"
            style="cursor:pointer;text-decoration:underline dotted;text-underline-offset:3px;font-weight:600" title="Click to edit">
            ${d.DealerCompanyName||'-'}</span></td>
        <td style="font-size:13px">${d.Addr1||''}</td>
        <td style="font-size:13px">${d.Addr2||''}</td>
        <td style="font-size:13px">${d.Addr3||''}</td>
        <td>${d.Mobile||'-'}</td>
        <td style="font-size:12px">${d.GST||'-'}</td>
        <td style="font-size:12px">${d.PlaceOfSalesPromotion||'-'}</td>
        <td><span style="background:var(--accent-soft);color:var(--accent);border-radius:20px;padding:2px 8px;font-size:12px">${d.State||'-'}</span></td>
        <td>${d.City||'-'}</td>
        <td>${d.Pin||'-'}</td>
        <td>${d.TelNo||'-'}</td>
        <td style="font-size:12px">${d.Email||'-'}</td>
        <td>${d.DealerType||'-'}</td>
        <td style="font-size:12px">${d.PAN||'-'}</td>
        <td style="font-size:12px">${d.AadharNo||'-'}</td>
        <td>${d.BankName||'-'}</td>
        <td style="font-size:12px">${d.BankAccNo||'-'}</td>
        <td style="font-size:12px">${d.IFSCCode||'-'}</td>
        <td>${statusBadge(d)}</td>
        <td style="${sticky};right:0;text-align:center">
          <button class="btn btn-danger btn-sm" onclick="deleteDealer(${d.DealerID})" title="Delete"><i class="fas fa-trash"></i></button>
        </td>
      </tr>`).join('');

    // Bind row checkboxes
    $$('.dl-row-chk').forEach(chk => {
      chk.onchange = () => {
        const id = parseInt(chk.dataset.id);
        if (chk.checked) _dlSelectedIds.add(id);
        else _dlSelectedIds.delete(id);
        syncDealerSelectAll(data);
        updateDealerBulkBar();
      };
    });

    // Bind edit cells
    $$('.dl-edit-cell').forEach(cell => {
      cell.onclick = () => {
        const row = data.find(d => d.DealerID === parseInt(cell.dataset.id));
        if (row) showEditDealerModal(row);
      };
    });

    // Bind clickable status badges
    $$('.dl-status-badge').forEach(badge => {
      badge.onclick = () => {
        const id     = parseInt(badge.dataset.id);
        const status = badge.dataset.status;
        toggleDealerStatus(id, status);
      };
    });

    renderDealerPagination();
    syncDealerSelectAll(data);
    updateDealerBulkBar();
  } catch(e) {
    tbody.innerHTML = `<tr class="empty-row"><td colspan="23" style="color:var(--danger)"><i class="fas fa-circle-xmark"></i> Failed: ${e.message}</td></tr>`;
  }
}

function renderDealerPagination() {
  const container = $('#dealer-pagination'); if (!container) return;
  const totalPages = Math.ceil(_dlTotal / _dlPageSize);
  const from = Math.min((_dlPage - 1) * _dlPageSize + 1, _dlTotal);
  const to   = Math.min(_dlPage * _dlPageSize, _dlTotal);

  let html = `<span style="font-size:13px;color:var(--text-secondary)">
    Showing <b>${from}&#8211;${to}</b> of <b>${_dlTotal}</b> dealers</span>
    <div style="display:flex;gap:4px;align-items:center">`;

  const pgBtn = (label, pg, disabled) =>
    `<button class="btn btn-sm btn-secondary" ${disabled?'disabled':''} onclick="loadDealers(${pg})" style="min-width:32px">${label}</button>`;

  html += pgBtn('<i class="fas fa-angles-left"></i>', 1, _dlPage <= 1);
  html += pgBtn('<i class="fas fa-angle-left"></i>',  _dlPage - 1, _dlPage <= 1);

  const start = Math.max(1, _dlPage - 2);
  const end   = Math.min(totalPages, start + 4);
  for (let p = start; p <= end; p++) {
    html += `<button class="btn btn-sm ${p === _dlPage ? 'btn-primary' : 'btn-secondary'}"
      onclick="loadDealers(${p})" style="min-width:36px">${p}</button>`;
  }

  html += pgBtn('<i class="fas fa-angle-right"></i>',  _dlPage + 1, _dlPage >= totalPages);
  html += pgBtn('<i class="fas fa-angles-right"></i>', totalPages,  _dlPage >= totalPages);
  html += '</div>';
  container.innerHTML = html;
}

function syncDealerSelectAll(currentData) {
  const sa = $('#dealer-select-all'); if (!sa) return;
  const currentIds = (currentData || []).map(d => d.DealerID);
  const allSel  = currentIds.length > 0 && currentIds.every(id => _dlSelectedIds.has(id));
  const someSel = currentIds.some(id => _dlSelectedIds.has(id));
  sa.checked = allSel;
  sa.indeterminate = someSel && !allSel;
}

function updateDealerBulkBar() {
  const n = _dlSelectedIds.size;
  const bar = $('#dealer-bulk-bar'); if (!bar) return;
  if (n > 0) { bar.style.display = 'flex'; $('#dealer-sel-count').textContent = `${n} dealer${n > 1 ? 's' : ''} selected`; }
  else { bar.style.display = 'none'; }
}

window.deleteDealer = async (id) => {
  if (!await confirm(`Delete Dealer #${id}? This cannot be undone.`)) return;
  try {
    await api(`/api/dealers/${id}`, { method:'DELETE' });
    _dlSelectedIds.delete(id);
    showToast('Dealer deleted!','success');
    await loadDealers();
    updateDealerBulkBar();
  } catch(e) { showToast(e.message,'error'); }
};

// Toggle Active / Inactive status by clicking the badge
window.toggleDealerStatus = async (id, currentStatus) => {
  const newStatus = currentStatus === 'Y' ? 'N' : 'Y';
  const action    = newStatus === 'Y' ? 'Activate' : 'Deactivate';
  if (!await confirm(`${action} Dealer #${id}?`)) return;
  try {
    await api(`/api/dealers/${id}/status`, { method: 'PATCH', body: { Status: newStatus } });
    showToast(`Dealer #${id} ${newStatus === 'Y' ? 'activated' : 'deactivated'}!`, 'success');
    await loadDealers();
  } catch(e) { showToast(e.message, 'error'); }
};


async function bulkDeleteDealers() {
  const ids = [..._dlSelectedIds];
  if (!ids.length) return;
  if (!await confirm(`Delete ${ids.length} dealer(s)? This cannot be undone.`)) return;
  try {
    await api('/api/dealers/bulk-delete', { method:'POST', body:{ids} });
    showToast(`${ids.length} dealer(s) deleted!`,'success');
    _dlSelectedIds.clear();
    const sa = $('#dealer-select-all'); if (sa) { sa.checked = false; sa.indeterminate = false; }
    await loadDealers(1);
    updateDealerBulkBar();
  } catch(e) { showToast(e.message,'error'); }
}

async function bulkExportDealers() {
  const ids = [..._dlSelectedIds];
  try {
    const res = await fetch('/api/dealers/export-xlsx', {
      method:'POST', headers:{'Content-Type':'application/json'},
      credentials:'include', body:JSON.stringify({ ids })
    });
    if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dealer_master_${new Date().toISOString().split('T')[0]}.xlsx`;
    a.click(); URL.revokeObjectURL(url);
    showToast(`Exported ${ids.length || 'all'} dealer(s) to XLSX!`,'success');
  } catch(e) { showToast('Export failed: '+e.message,'error'); }
}

function _dlModalBody(rec = {}) {
  const si = _dlInStyle(), ss = _dlSelStyle();
  return `
    <div class="form-field" style="margin-bottom:12px">
      <label>Dealer ID <span style="color:var(--text-muted);font-size:11px">(auto)</span></label>
      <input type="text" value="${rec.DealerID||'~auto'}" readonly ${si} style="opacity:0.6;cursor:not-allowed;font-style:italic;background:var(--bg-dark);border:1px dashed var(--border);border-radius:6px;padding:9px 12px;color:var(--text-muted);width:100%"/>
    </div>
    <div class="form-row cols-2" style="gap:12px;margin-bottom:12px">
      <div class="form-field"><label>Division <span style="color:var(--danger)">*</span></label>
        <select id="dl-div" ${ss}>${_dlDivOpts(_dealerDivs, rec.DivisionId)}</select></div>
      <div class="form-field"><label>Contact Person <span style="color:var(--danger)">*</span></label>
        <input type="text" id="dl-cp" value="${rec.ContactPersonName||''}" ${si}/></div>
    </div>
    <div class="form-row cols-2" style="gap:12px;margin-bottom:12px">
      <div class="form-field"><label>Mob.</label><input type="text" id="dl-mob" value="${rec.Mobile||''}" ${si}/></div>
      <div class="form-field"><label>Tel No</label><input type="text" id="dl-tel" value="${rec.TelNo||''}" ${si}/></div>
    </div>
    <div class="form-row cols-3" style="gap:12px;margin-bottom:12px">
      <div class="form-field"><label>Address 1</label><input type="text" id="dl-a1" value="${rec.Addr1||''}" ${si}/></div>
      <div class="form-field"><label>Address 2</label><input type="text" id="dl-a2" value="${rec.Addr2||''}" ${si}/></div>
      <div class="form-field"><label>Address 3</label><input type="text" id="dl-a3" value="${rec.Addr3||''}" ${si}/></div>
    </div>
    <div class="form-row cols-3" style="gap:12px;margin-bottom:12px">
      <div class="form-field"><label>State</label><select id="dl-state" ${ss}>${_dlStateOpts(rec.State)}</select></div>
      <div class="form-field"><label>City</label><select id="dl-city" ${ss}>${_dlCityOpts(rec.City)}</select></div>
      <div class="form-field"><label>Pin</label><input type="text" id="dl-pin" value="${rec.Pin||''}" ${si}/></div>
    </div>
    <div class="form-row cols-2" style="gap:12px;margin-bottom:12px">
      <div class="form-field"><label>Dealer Type</label><input type="text" id="dl-type" value="${rec.DealerType||''}" ${si}/></div>
      <div class="form-field"><label>Company Name <span style="color:var(--danger)">*</span></label>
        <input type="text" id="dl-company" value="${rec.DealerCompanyName||''}" ${si}/></div>
    </div>
    <div class="form-row cols-2" style="gap:12px;margin-bottom:12px">
      <div class="form-field"><label>Dist. Code <span style="color:var(--danger)">*</span></label>
        <input type="text" id="dl-dist" value="${rec.DistCode||''}" ${si}/></div>
      <div class="form-field"><label>Email</label><input type="email" id="dl-email" value="${rec.Email||''}" ${si}/></div>
    </div>
    <div class="form-row cols-3" style="gap:12px;margin-bottom:12px">
      <div class="form-field"><label>PAN</label><input type="text" id="dl-pan" value="${rec.PAN||''}" ${si}/></div>
      <div class="form-field"><label>Aadhar No</label><input type="text" id="dl-aadhar" value="${rec.AadharNo||''}" ${si}/></div>
      <div class="form-field"><label>GST No</label><input type="text" id="dl-gst" value="${rec.GST||''}" ${si}/></div>
    </div>
    <div class="form-field" style="margin-bottom:12px">
      <label>Place of Sales Promotion</label><input type="text" id="dl-place" value="${rec.PlaceOfSalesPromotion||''}" ${si}/>
    </div>
    <div class="form-row cols-3" style="gap:12px;margin-bottom:12px">
      <div class="form-field"><label>Bank Name</label><input type="text" id="dl-bank" value="${rec.BankName||''}" ${si}/></div>
      <div class="form-field"><label>Bank Acc No</label><input type="text" id="dl-bankac" value="${rec.BankAccNo||''}" ${si}/></div>
      <div class="form-field"><label>IFSC Code</label><input type="text" id="dl-ifsc" value="${rec.IFSCCode||''}" ${si}/></div>
    </div>
    <div class="form-field">
      <label>Courier Name</label>
      <select id="dl-courier" ${ss}>${_dlCourierOpts(_dealerCouriers, rec.CourierId)}</select>
    </div>`;
}
function _collectDlForm(ov) {
  return {
    DivisionId: ov.querySelector('#dl-div').value || null,
    ContactPersonName: ov.querySelector('#dl-cp').value.trim(),
    Mobile: ov.querySelector('#dl-mob').value,
    TelNo: ov.querySelector('#dl-tel').value,
    Addr1: ov.querySelector('#dl-a1').value,
    Addr2: ov.querySelector('#dl-a2').value,
    Addr3: ov.querySelector('#dl-a3').value,
    State: ov.querySelector('#dl-state').value,
    City: ov.querySelector('#dl-city').value,
    Pin: ov.querySelector('#dl-pin').value,
    DealerType: ov.querySelector('#dl-type').value,
    DealerCompanyName: ov.querySelector('#dl-company').value.trim(),
    DistCode: ov.querySelector('#dl-dist').value.trim(),
    Email: ov.querySelector('#dl-email').value,
    PAN: ov.querySelector('#dl-pan').value,
    AadharNo: ov.querySelector('#dl-aadhar').value,
    GST: ov.querySelector('#dl-gst').value,
    PlaceOfSalesPromotion: ov.querySelector('#dl-place').value,
    BankName: ov.querySelector('#dl-bank').value,
    BankAccNo: ov.querySelector('#dl-bankac').value,
    IFSCCode: ov.querySelector('#dl-ifsc').value,
    CourierId: ov.querySelector('#dl-courier').value || null,
  };
}

async function showAddDealerModal() {
  const ov = document.createElement('div');
  ov.className = 'modal-overlay';
  ov.innerHTML = `
    <div class="modal" style="max-width:700px;animation:slideUp 0.2s ease">
      <div class="modal-header">
        <h3><i class="fas fa-plus-circle"></i> Add Dealer</h3>
        <button class="btn-close-modal" onclick="this.closest('.modal-overlay').remove()"><i class="fas fa-xmark"></i></button>
      </div>
      <div class="modal-body" style="max-height:65vh;overflow-y:auto">${_dlModalBody()}</div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
        <button class="btn btn-primary" id="btn-dl-add-save"><i class="fas fa-user-plus"></i> Add Dealer</button>
      </div>
    </div>`;
  document.body.appendChild(ov);
  ov.onclick = e => { if (e.target === ov) ov.remove(); };
  ov.querySelector('#btn-dl-add-save').onclick = async () => {
    const b = _collectDlForm(ov);
    if (!b.ContactPersonName) return showToast('Contact Person is required', 'error');
    if (!b.DealerCompanyName) return showToast('Company Name is required', 'error');
    if (!b.DistCode) return showToast('Dist. Code is required', 'error');
    if (!b.DivisionId) return showToast('Division is required', 'error');
    try {
      await api('/api/dealers', { method:'POST', body: b });
      ov.remove(); showToast('Dealer added successfully!', 'success'); await loadDealers();
    } catch(e) { showToast(e.message, 'error'); }
  };
}

function showEditDealerModal(rec) {
  const existing = $('#dl-edit-modal'); if (existing) existing.remove();
  const ov = document.createElement('div');
  ov.className = 'modal-overlay'; ov.id = 'dl-edit-modal';
  ov.innerHTML = `
    <div class="modal" style="max-width:700px;animation:slideUp 0.2s ease">
      <div class="modal-header">
        <h3><i class="fas fa-pen-to-square"></i> Edit Dealer #${rec.DealerID}</h3>
        <button class="btn-close-modal" onclick="document.getElementById('dl-edit-modal').remove()"><i class="fas fa-xmark"></i></button>
      </div>
      <div class="modal-body" style="max-height:65vh;overflow-y:auto">${_dlModalBody(rec)}</div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="document.getElementById('dl-edit-modal').remove()">Cancel</button>
        <button class="btn btn-primary" id="btn-dl-edit-save"><i class="fas fa-floppy-disk"></i> Save</button>
      </div>
    </div>`;
  document.body.appendChild(ov);
  ov.onclick = e => { if (e.target === ov) ov.remove(); };
  ov.querySelector('#btn-dl-edit-save').onclick = async () => {
    const b = _collectDlForm(ov);
    if (!b.ContactPersonName) return showToast('Contact Person is required', 'error');
    if (!b.DealerCompanyName) return showToast('Company Name is required', 'error');
    try {
      await api(`/api/dealers/${rec.DealerID}`, { method:'PUT', body: b });
      ov.remove(); showToast('Dealer updated!', 'success'); await loadDealers();
    } catch(e) { showToast(e.message, 'error'); }
  };
}

// ======== USER MASTER (Full-Featured) ========
registerPage('user-master', () => {
  return `${pageHeader('User Master', 'fa-users-gear', 'Masters / User Master',
    `<button class="btn btn-primary" id="btn-add-user"><i class="fas fa-plus"></i> Add New</button>`)}
  <div class="card">
    <div class="search-bar">
      <div class="search-input-wrap"><i class="fas fa-search"></i>
        <input type="text" id="um-search" placeholder="Search user ID, employee, email...">
      </div>
    </div>
    <div class="table-wrapper">
      <table id="tbl-um-main">
        <thead><tr>
          <th style="width:42px;text-align:center">
            <input type="checkbox" id="um-select-all"
              style="width:16px;height:16px;cursor:pointer;accent-color:var(--accent)">
          </th>
          <th style="width:75px">User ID</th>
          <th style="width:110px">Employee ID</th>
          <th>Email ID</th>
          <th style="width:140px">Mobile No.</th>
          <th style="width:90px;text-align:center">Status</th>
          <th style="width:90px;text-align:center">Actions</th>
        </tr></thead>
        <tbody id="tbl-um-body">
          <tr class="empty-row"><td colspan="7"><div class="spinner" style="margin:0 auto"></div></td></tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- Bulk bar -->
  <div id="um-bulk-bar" style="display:none;position:fixed;bottom:28px;left:50%;transform:translateX(-50%);
    background:var(--bg-card);border:1px solid var(--accent);border-radius:12px;padding:12px 24px;
    z-index:500;box-shadow:0 8px 32px rgba(0,0,0,.5);align-items:center;gap:16px;min-width:380px">
    <span id="um-sel-count" style="color:var(--accent);font-weight:600;font-size:14px"></span>
    <div style="flex:1"></div>
    <button class="btn btn-success" id="btn-um-bulk-export"><i class="fas fa-file-excel"></i> Export XLSX</button>
    <button class="btn btn-danger"  id="btn-um-bulk-delete"><i class="fas fa-trash"></i> Delete Selected</button>
    <button class="btn btn-secondary btn-sm" id="btn-um-bulk-cancel"><i class="fas fa-xmark"></i></button>
  </div>
  </div>`;
});

window._pageBinders['user-master'] = async () => {
  await loadUsers();
  $('#um-search').oninput = () => {
    const q = ($('#um-search')?.value || '').toLowerCase();
    $$('#tbl-um-body tr:not(.empty-row)').forEach(tr => {
      tr.style.display = !q || tr.textContent.toLowerCase().includes(q) ? '' : 'none';
    });
  };
  $('#um-select-all').onchange = e => {
    $$('.um-row-chk').forEach(c => { c.checked = e.target.checked; }); updateUmBulkBar();
  };
  $('#btn-add-user').onclick = () => showAddUserModal();
  $('#btn-um-bulk-cancel').onclick = () => {
    $$('.um-row-chk').forEach(c => c.checked = false);
    $('#um-select-all').checked = false; updateUmBulkBar();
  };
  $('#btn-um-bulk-export').onclick = () => bulkExportUsers();
  $('#btn-um-bulk-delete').onclick  = () => bulkDeleteUsers();
};

function syncUmSelectAll() {
  const all = $$('.um-row-chk'), checked = all.filter(c => c.checked);
  const sa = $('#um-select-all'); if (!sa) return;
  sa.checked = all.length > 0 && checked.length === all.length;
  sa.indeterminate = checked.length > 0 && checked.length < all.length;
}
function updateUmBulkBar() {
  const checked = $$('.um-row-chk:checked');
  const bar = $('#um-bulk-bar'); if (!bar) return;
  if (checked.length > 0) {
    bar.style.display = 'flex';
    $('#um-sel-count').textContent = `${checked.length} row${checked.length > 1 ? 's' : ''} selected`;
  } else { bar.style.display = 'none'; }
}

async function loadUsers() {
  const tbody = $('#tbl-um-body'); if (!tbody) return;
  tbody.innerHTML = `<tr class="empty-row"><td colspan="7"><div class="spinner" style="margin:0 auto"></div></td></tr>`;
  let data;
  try { data = await api('/api/users'); }
  catch (e) {
    tbody.innerHTML = `<tr class="empty-row"><td colspan="7" style="color:var(--danger)">
      <i class="fas fa-circle-xmark"></i> Failed: ${e.message}</td></tr>`;
    return;
  }
  if (!data.length) { tbody.innerHTML = `<tr class="empty-row"><td colspan="7">No users found.</td></tr>`; return; }

  const statusBadge = s => s === 'Y'
    ? `<span class="badge badge-success">Active</span>`
    : `<span class="badge badge-danger">Inactive</span>`;

  tbody.innerHTML = data.map(d => `
    <tr data-id="${d.UserID}" class="um-row">
      <td style="text-align:center">
        <input type="checkbox" class="um-row-chk" data-id="${d.UserID}"
          style="width:16px;height:16px;cursor:pointer;accent-color:var(--accent)">
      </td>
      <td style="color:var(--text-secondary);font-size:13px">${d.UserID}</td>
      <td>
        <span class="um-edit-cell" data-id="${d.UserID}"
          style="cursor:pointer;text-decoration:underline dotted;text-underline-offset:3px;font-weight:600"
          title="Click to edit">${d.EmployeeID || '-'}</span>
      </td>
      <td style="font-size:13px">${d.EmailId || '-'}</td>
      <td style="font-size:13px;font-family:monospace">${d.MobileNo || '-'}</td>
      <td style="text-align:center">${statusBadge(d.Status)}</td>
      <td style="text-align:center">
        <button class="btn btn-danger btn-sm" onclick="deleteUser(${d.UserID})" title="Delete">
          <i class="fas fa-trash"></i></button>
      </td>
    </tr>`).join('');

  $$('.um-row-chk').forEach(chk => {
    chk.onchange = () => { updateUmBulkBar(); syncUmSelectAll(); };
  });
  $$('.um-edit-cell').forEach(cell => {
    cell.onclick = () => {
      const row = data.find(d => d.UserID === parseInt(cell.dataset.id));
      if (row) showEditUserModal(row);
    };
  });
}

/* ---- helpers ---- */
function _umIS() {
  return `style="background:var(--bg-dark);border:1px solid var(--border);border-radius:6px;
          padding:8px 12px;color:var(--text-primary);width:100%;font-size:13.5px"`;
}
function _umSS() {
  return `style="background:var(--bg-dark);border:1px solid var(--border);border-radius:6px;
          padding:8px 12px;color:var(--text-primary);width:100%;font-size:13.5px;cursor:pointer"`;
}

async function showAddUserModal() {
  const si = _umIS();
  const ov = document.createElement('div');
  ov.className = 'modal-overlay';
  ov.innerHTML = `
    <div class="modal" style="max-width:520px;animation:slideUp 0.2s ease">
      <div class="modal-header">
        <h3><i class="fas fa-user-plus"></i> Add User</h3>
        <button class="btn-close-modal" onclick="this.closest('.modal-overlay').remove()">
          <i class="fas fa-xmark"></i></button>
      </div>
      <div class="modal-body">
        <div class="form-field" style="margin-bottom:14px">
          <label>User ID <span style="color:var(--text-muted);font-size:11px">(auto)</span></label>
          <input type="text" value="~auto" readonly
            style="background:var(--bg-dark);border:1px dashed var(--border);border-radius:6px;
                   padding:8px 12px;color:var(--text-muted);width:100%;cursor:not-allowed;opacity:0.65;font-style:italic"/>
        </div>
        <div class="form-row cols-2" style="gap:12px;margin-bottom:12px">
          <div class="form-field"><label>Employee ID <span style="color:var(--danger)">*</span></label>
            <input type="text" id="um-a-empid" ${si}/></div>
          <div class="form-field"><label>Username <span style="color:var(--danger)">*</span></label>
            <input type="text" id="um-a-uname" ${si}/></div>
        </div>
        <div class="form-row cols-2" style="gap:12px;margin-bottom:4px">
          <div class="form-field"><label>Mobile No.</label>
            <input type="text" id="um-a-mob" ${si}/></div>
          <div class="form-field"><label>Email ID</label>
            <input type="email" id="um-a-email" ${si}/></div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
        <button class="btn btn-primary" id="btn-um-add-save">
          <i class="fas fa-user-plus"></i> Add User</button>
      </div>
    </div>`;
  document.body.appendChild(ov);
  ov.onclick = e => { if (e.target === ov) ov.remove(); };
  ov.querySelector('#btn-um-add-save').onclick = async () => {
    const b = {
      EmployeeID: ov.querySelector('#um-a-empid').value.trim(),
      UserName:   ov.querySelector('#um-a-uname').value.trim(),
      MobileNo:   ov.querySelector('#um-a-mob').value.trim(),
      EmailId:    ov.querySelector('#um-a-email').value.trim()
    };
    if (!b.EmployeeID) return showToast('Employee ID is required', 'error');
    if (!b.UserName)   return showToast('Username is required', 'error');
    try {
      await api('/api/users', { method: 'POST', body: b });
      ov.remove(); showToast('User added!', 'success'); await loadUsers();
    } catch (e) { showToast(e.message, 'error'); }
  };
}

function showEditUserModal(rec) {
  const existing = $('#um-edit-modal'); if (existing) existing.remove();
  const si = _umIS(), ss = _umSS();
  const ov = document.createElement('div');
  ov.className = 'modal-overlay'; ov.id = 'um-edit-modal';
  ov.innerHTML = `
    <div class="modal" style="max-width:520px;animation:slideUp 0.2s ease">
      <div class="modal-header">
        <h3><i class="fas fa-pen-to-square"></i> Edit User #${rec.UserID}</h3>
        <button class="btn-close-modal" onclick="document.getElementById('um-edit-modal').remove()">
          <i class="fas fa-xmark"></i></button>
      </div>
      <div class="modal-body">
        <div class="form-field" style="margin-bottom:14px">
          <label>User ID <span style="color:var(--text-muted);font-size:11px">(auto)</span></label>
          <input type="text" value="${rec.UserID}" readonly
            style="background:var(--bg-dark);border:1px dashed var(--border);border-radius:6px;
                   padding:8px 12px;color:var(--text-muted);width:100%;cursor:not-allowed;opacity:0.65;font-style:italic"/>
        </div>
        <div class="form-row cols-2" style="gap:12px;margin-bottom:12px">
          <div class="form-field"><label>Employee ID</label>
            <input type="text" id="um-e-empid" value="${rec.EmployeeID||''}" ${si}/></div>
          <div class="form-field"><label>Username</label>
            <input type="text" id="um-e-uname" value="${rec.UserName||''}" ${si}/></div>
        </div>
        <div class="form-row cols-2" style="gap:12px;margin-bottom:12px">
          <div class="form-field"><label>Mobile No.</label>
            <input type="text" id="um-e-mob" value="${rec.MobileNo||''}" ${si}/></div>
          <div class="form-field"><label>Email ID</label>
            <input type="email" id="um-e-email" value="${rec.EmailId||''}" ${si}/></div>
        </div>
        <div class="form-field" style="margin-bottom:4px">
          <label>Status</label>
          <select id="um-e-status" ${ss}>
            <option value="Y" ${rec.Status==='Y'?'selected':''}>Active</option>
            <option value="N" ${rec.Status==='N'?'selected':''}>Inactive</option>
          </select>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="document.getElementById('um-edit-modal').remove()">Cancel</button>
        <button class="btn btn-primary" id="btn-um-edit-save">
          <i class="fas fa-floppy-disk"></i> Save</button>
      </div>
    </div>`;
  document.body.appendChild(ov);
  ov.onclick = e => { if (e.target === ov) ov.remove(); };
  ov.querySelector('#btn-um-edit-save').onclick = async () => {
    const b = {
      EmployeeID: ov.querySelector('#um-e-empid').value.trim(),
      UserName:   ov.querySelector('#um-e-uname').value.trim(),
      MobileNo:   ov.querySelector('#um-e-mob').value.trim(),
      EmailId:    ov.querySelector('#um-e-email').value.trim(),
      Status:     ov.querySelector('#um-e-status').value
    };
    try {
      await api(`/api/users/${rec.UserID}`, { method: 'PUT', body: b });
      ov.remove(); showToast('User updated!', 'success'); await loadUsers();
    } catch (e) { showToast(e.message, 'error'); }
  };
}

window.deleteUser = async (id) => {
  if (!await confirm(`Delete User #${id}? This cannot be undone.`)) return;
  try {
    await api(`/api/users/${id}`, { method: 'DELETE' });
    showToast('User deleted!', 'success'); await loadUsers(); updateUmBulkBar();
  } catch (e) { showToast(e.message, 'error'); }
};

async function bulkDeleteUsers() {
  const ids = $$('.um-row-chk:checked').map(c => parseInt(c.dataset.id));
  if (!ids.length) return;
  if (!await confirm(`Delete ${ids.length} user(s)? This cannot be undone.`)) return;
  try {
    await api('/api/users/bulk-delete', { method: 'POST', body: { ids } });
    showToast(`${ids.length} user(s) deleted!`, 'success');
    $('#um-select-all').checked = false; await loadUsers(); updateUmBulkBar();
  } catch (e) { showToast(e.message, 'error'); }
}

async function bulkExportUsers() {
  const ids = $$('.um-row-chk:checked').map(c => parseInt(c.dataset.id));
  try {
    const res = await fetch('/api/users/export-xlsx', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      credentials: 'include', body: JSON.stringify({ ids })
    });
    if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `user_master_${new Date().toISOString().split('T')[0]}.xlsx`;
    a.click(); URL.revokeObjectURL(url);
    showToast(`Exported ${ids.length || 'all'} user(s)!`, 'success');
  } catch (e) { showToast('Export failed: ' + e.message, 'error'); }
}


// ======== LOGIN MASTER (Full-Featured) ========

const _LM_QUESTIONS = [
  'Your Favourite Color',
  'Your Last Name',
  'Your Mobile Number',
  'Your Favourite Cricketer',
  'Your State Name'
];

registerPage('login-master', () => {
  return `${pageHeader('Login Master', 'fa-key', 'Masters / Login Master',
    `<button class="btn btn-primary" id="btn-add-login"><i class="fas fa-plus"></i> Add New</button>`)}
  <div class="card">
    <div class="search-bar">
      <div class="search-input-wrap"><i class="fas fa-search"></i>
        <input type="text" id="lm-search" placeholder="Search login ID, name...">
      </div>
    </div>
    <div class="table-wrapper">
      <table id="tbl-lm-main">
        <thead><tr>
          <th style="width:42px;text-align:center">
            <input type="checkbox" id="lm-select-all"
              style="width:16px;height:16px;cursor:pointer;accent-color:var(--accent)">
          </th>
          <th style="width:65px">ID</th>
          <th style="width:160px">Login ID</th>
          <th style="width:140px">Password</th>
          <th style="width:160px">Name</th>
          <th>Security Question</th>
          <th style="width:110px;text-align:center">Actions</th>
        </tr></thead>
        <tbody id="tbl-lm-body">
          <tr class="empty-row"><td colspan="7"><div class="spinner" style="margin:0 auto"></div></td></tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- Bulk bar -->
  <div id="lm-bulk-bar" style="display:none;position:fixed;bottom:28px;left:50%;transform:translateX(-50%);
    background:var(--bg-card);border:1px solid var(--accent);border-radius:12px;padding:12px 24px;
    z-index:500;box-shadow:0 8px 32px rgba(0,0,0,.5);align-items:center;gap:16px;min-width:380px">
    <span id="lm-sel-count" style="color:var(--accent);font-weight:600;font-size:14px"></span>
    <div style="flex:1"></div>
    <button class="btn btn-success" id="btn-lm-bulk-export"><i class="fas fa-file-excel"></i> Export XLSX</button>
    <button class="btn btn-danger"  id="btn-lm-bulk-delete"><i class="fas fa-trash"></i> Delete Selected</button>
    <button class="btn btn-secondary btn-sm" id="btn-lm-bulk-cancel"><i class="fas fa-xmark"></i></button>
  </div>
  </div>`;
});

window._pageBinders['login-master'] = async () => {
  await loadLogins();
  $('#lm-search').oninput = () => {
    const q = ($('#lm-search')?.value || '').toLowerCase();
    $$('#tbl-lm-body tr:not(.empty-row)').forEach(tr => {
      tr.style.display = !q || tr.textContent.toLowerCase().includes(q) ? '' : 'none';
    });
  };
  $('#lm-select-all').onchange = e => {
    $$('.lm-row-chk').forEach(c => { c.checked = e.target.checked; }); updateLmBulkBar();
  };
  $('#btn-add-login').onclick = () => showAddLoginModal();
  $('#btn-lm-bulk-cancel').onclick = () => {
    $$('.lm-row-chk').forEach(c => c.checked = false);
    $('#lm-select-all').checked = false; updateLmBulkBar();
  };
  $('#btn-lm-bulk-export').onclick = () => bulkExportLogins();
  $('#btn-lm-bulk-delete').onclick  = () => bulkDeleteLogins();
};

function syncLmSelectAll() {
  const all = $$('.lm-row-chk'), checked = all.filter(c => c.checked);
  const sa = $('#lm-select-all'); if (!sa) return;
  sa.checked = all.length > 0 && checked.length === all.length;
  sa.indeterminate = checked.length > 0 && checked.length < all.length;
}
function updateLmBulkBar() {
  const checked = $$('.lm-row-chk:checked');
  const bar = $('#lm-bulk-bar'); if (!bar) return;
  if (checked.length > 0) {
    bar.style.display = 'flex';
    $('#lm-sel-count').textContent = `${checked.length} row${checked.length > 1 ? 's' : ''} selected`;
  } else { bar.style.display = 'none'; }
}

async function loadLogins() {
  const tbody = $('#tbl-lm-body'); if (!tbody) return;
  tbody.innerHTML = `<tr class="empty-row"><td colspan="7"><div class="spinner" style="margin:0 auto"></div></td></tr>`;
  let data;
  try { data = await api('/api/logins'); }
  catch (e) {
    tbody.innerHTML = `<tr class="empty-row"><td colspan="7" style="color:var(--danger)">
      <i class="fas fa-circle-xmark"></i> Failed: ${e.message}</td></tr>`;
    return;
  }
  if (!data.length) { tbody.innerHTML = `<tr class="empty-row"><td colspan="7">No login records found.</td></tr>`; return; }

  tbody.innerHTML = data.map(d => `
    <tr data-id="${d.ID}" class="lm-row">
      <td style="text-align:center">
        <input type="checkbox" class="lm-row-chk" data-id="${d.ID}"
          style="width:16px;height:16px;cursor:pointer;accent-color:var(--accent)">
      </td>
      <td style="color:var(--text-secondary);font-size:13px">${d.ID}</td>
      <td>
        <span class="lm-edit-cell" data-id="${d.ID}"
          style="cursor:pointer;text-decoration:underline dotted;text-underline-offset:3px;font-weight:600"
          title="Click to edit">${d.LoginID || '-'}</span>
      </td>
      <td>
        <span style="font-family:monospace;letter-spacing:3px;opacity:0.7">
          ${'&#8226;'.repeat(Math.min(8, (d.Password||'').length || 6))}
        </span>
      </td>
      <td>${d.Name || '-'}</td>
      <td style="font-size:12px;color:var(--text-secondary)">${d.SecurityQtn || '-'}</td>
      <td style="text-align:center">
        <div style="display:flex;gap:6px;justify-content:center">
          <button class="btn btn-danger btn-sm" onclick="deleteLogin(${d.ID})" title="Delete">
            <i class="fas fa-trash"></i></button>
          <button class="btn btn-warning btn-sm" onclick="showForgotPasswordModal('${(d.LoginID||'').replace(/'/g,"\\'")}', '${(d.SecurityQtn||'').replace(/'/g,"\\'")}', ${d.ID})"
            title="Forgot / Reset Password" style="color:#000">
            <i class="fas fa-key"></i></button>
        </div>
      </td>
    </tr>`).join('');

  $$('.lm-row-chk').forEach(chk => {
    chk.onchange = () => { updateLmBulkBar(); syncLmSelectAll(); };
  });
  $$('.lm-edit-cell').forEach(cell => {
    cell.onclick = () => {
      const row = data.find(d => d.ID === parseInt(cell.dataset.id));
      if (row) showEditLoginModal(row);
    };
  });
}

/* ---- helpers ---- */
function _lmIS() {
  return `style="background:var(--bg-dark);border:1px solid var(--border);border-radius:6px;
          padding:8px 12px;color:var(--text-primary);width:100%;font-size:13.5px"`;
}
function _lmSS() {
  return `style="background:var(--bg-dark);border:1px solid var(--border);border-radius:6px;
          padding:8px 12px;color:var(--text-primary);width:100%;font-size:13.5px;cursor:pointer"`;
}
function _lmQuestionOpts(sel = '') {
  return `<option value="">- Select Question -</option>` +
    _LM_QUESTIONS.map(q => `<option value="${q}" ${q === sel ? 'selected' : ''}>${q}</option>`).join('');
}
function _lmModalBody(rec = {}, isEdit = false) {
  const si = _lmIS(), ss = _lmSS();
  return `
    <div class="form-field" style="margin-bottom:14px">
      <label>ID <span style="color:var(--text-muted);font-size:11px">(auto)</span></label>
      <input type="text" value="${rec.ID || '~auto'}" readonly
        style="background:var(--bg-dark);border:1px dashed var(--border);border-radius:6px;
               padding:8px 12px;color:var(--text-muted);width:100%;cursor:not-allowed;opacity:0.65;font-style:italic"/>
    </div>
    <div class="form-row cols-2" style="gap:12px;margin-bottom:12px">
      <div class="form-field"><label>Login ID <span style="color:var(--danger)">*</span></label>
        <input type="text" id="lm-f-lid" value="${rec.LoginID||''}" ${si}/></div>
      <div class="form-field"><label>Password <span style="color:var(--danger)">*</span></label>
        <input type="password" id="lm-f-pwd" value="${isEdit ? (rec.Password||'') : ''}" ${si}
          placeholder="${isEdit ? 'Leave blank to keep current' : 'Enter password'}"/></div>
    </div>
    <div class="form-field" style="margin-bottom:12px">
      <label>Name</label>
      <input type="text" id="lm-f-name" value="${rec.Name||''}" ${si}/>
    </div>
    <div class="form-row cols-2" style="gap:12px;margin-bottom:4px">
      <div class="form-field"><label>Security Question</label>
        <select id="lm-f-sqtn" ${ss}>${_lmQuestionOpts(rec.SecurityQtn||'')}</select></div>
      <div class="form-field"><label>Answer</label>
        <input type="text" id="lm-f-ans" value="${rec.Answer||''}" ${si}/></div>
    </div>`;
}

async function showAddLoginModal() {
  const ov = document.createElement('div');
  ov.className = 'modal-overlay';
  ov.innerHTML = `
    <div class="modal" style="max-width:560px;animation:slideUp 0.2s ease">
      <div class="modal-header">
        <h3><i class="fas fa-plus-circle"></i> Add Login</h3>
        <button class="btn-close-modal" onclick="this.closest('.modal-overlay').remove()">
          <i class="fas fa-xmark"></i></button>
      </div>
      <div class="modal-body" style="max-height:65vh;overflow-y:auto">${_lmModalBody()}</div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
        <button class="btn btn-primary" id="btn-lm-add-save">
          <i class="fas fa-key"></i> Add Login</button>
      </div>
    </div>`;
  document.body.appendChild(ov);
  ov.onclick = e => { if (e.target === ov) ov.remove(); };
  ov.querySelector('#btn-lm-add-save').onclick = async () => {
    const b = {
      LoginID:     ov.querySelector('#lm-f-lid').value.trim(),
      Password:    ov.querySelector('#lm-f-pwd').value.trim(),
      Name:        ov.querySelector('#lm-f-name').value.trim(),
      SecurityQtn: ov.querySelector('#lm-f-sqtn').value,
      Answer:      ov.querySelector('#lm-f-ans').value.trim()
    };
    if (!b.LoginID)  return showToast('Login ID is required', 'error');
    if (!b.Password) return showToast('Password is required', 'error');
    try {
      await api('/api/logins', { method: 'POST', body: b });
      ov.remove(); showToast('Login added!', 'success'); await loadLogins();
    } catch (e) { showToast(e.message, 'error'); }
  };
}

function showEditLoginModal(rec) {
  const existing = $('#lm-edit-modal'); if (existing) existing.remove();
  const ov = document.createElement('div');
  ov.className = 'modal-overlay'; ov.id = 'lm-edit-modal';
  ov.innerHTML = `
    <div class="modal" style="max-width:560px;animation:slideUp 0.2s ease">
      <div class="modal-header">
        <h3><i class="fas fa-pen-to-square"></i> Edit Login #${rec.ID}</h3>
        <button class="btn-close-modal" onclick="document.getElementById('lm-edit-modal').remove()">
          <i class="fas fa-xmark"></i></button>
      </div>
      <div class="modal-body" style="max-height:65vh;overflow-y:auto">${_lmModalBody(rec, true)}</div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="document.getElementById('lm-edit-modal').remove()">Cancel</button>
        <button class="btn btn-primary" id="btn-lm-edit-save">
          <i class="fas fa-floppy-disk"></i> Save</button>
      </div>
    </div>`;
  document.body.appendChild(ov);
  ov.onclick = e => { if (e.target === ov) ov.remove(); };
  ov.querySelector('#btn-lm-edit-save').onclick = async () => {
    const pwd = ov.querySelector('#lm-f-pwd').value.trim();
    const b = {
      LoginID:     ov.querySelector('#lm-f-lid').value.trim(),
      Password:    pwd || rec.Password,
      Name:        ov.querySelector('#lm-f-name').value.trim(),
      SecurityQtn: ov.querySelector('#lm-f-sqtn').value,
      Answer:      ov.querySelector('#lm-f-ans').value.trim()
    };
    if (!b.LoginID) return showToast('Login ID is required', 'error');
    try {
      await api(`/api/logins/${rec.ID}`, { method: 'PUT', body: b });
      ov.remove(); showToast('Login updated!', 'success'); await loadLogins();
    } catch (e) { showToast(e.message, 'error'); }
  };
}

window.showForgotPasswordModal = (loginId = '', secQtn = '', rowId) => {
  const existing = $('#lm-forgot-modal'); if (existing) existing.remove();
  const si = _lmIS(), ss = _lmSS();
  let step = 1; // 1=validate, 2=new password
  const ov = document.createElement('div');
  ov.className = 'modal-overlay'; ov.id = 'lm-forgot-modal';
  ov.innerHTML = `
    <div class="modal" style="max-width:480px;animation:slideUp 0.2s ease">
      <div class="modal-header" style="background:linear-gradient(135deg,#b45309,#92400e)">
        <h3 style="color:#fef3c7"><i class="fas fa-unlock-keyhole"></i> Forgot / Reset Password</h3>
        <button class="btn-close-modal" onclick="document.getElementById('lm-forgot-modal').remove()">
          <i class="fas fa-xmark"></i></button>
      </div>
      <div class="modal-body">
        <!-- Step 1: Validate -->
        <div id="lm-fp-step1">
          <p style="color:var(--text-secondary);font-size:13px;margin-bottom:16px">
            Enter your Login ID, select the security question and provide the correct answer to reset your password.</p>
          <div class="form-field" style="margin-bottom:12px">
            <label>Login ID <span style="color:var(--danger)">*</span></label>
            <input type="text" id="lm-fp-lid" value="${loginId}" ${si}/>
          </div>
          <div class="form-field" style="margin-bottom:12px">
            <label>Security Question <span style="color:var(--danger)">*</span></label>
            <select id="lm-fp-sqtn" ${ss}>${_lmQuestionOpts(secQtn)}</select>
          </div>
          <div class="form-field" style="margin-bottom:4px">
            <label>Answer <span style="color:var(--danger)">*</span></label>
            <input type="text" id="lm-fp-ans" ${si} placeholder="Your answer"/>
          </div>
          <div id="lm-fp-err" style="color:var(--danger);font-size:12px;margin-top:8px;min-height:18px"></div>
        </div>
        <!-- Step 2: New Password (hidden initially) -->
        <div id="lm-fp-step2" style="display:none">
          <p style="color:var(--accent);font-size:13px;margin-bottom:16px">
            <i class="fas fa-circle-check"></i> Identity verified! Enter your new password below.</p>
          <div class="form-field" style="margin-bottom:12px">
            <label>New Password <span style="color:var(--danger)">*</span></label>
            <input type="password" id="lm-fp-newpwd" ${si} placeholder="Enter new password"/>
          </div>
          <div class="form-field" style="margin-bottom:4px">
            <label>Confirm New Password <span style="color:var(--danger)">*</span></label>
            <input type="password" id="lm-fp-cfmpwd" ${si} placeholder="Confirm new password"/>
          </div>
          <div id="lm-fp-err2" style="color:var(--danger);font-size:12px;margin-top:8px;min-height:18px"></div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="document.getElementById('lm-forgot-modal').remove()">Cancel</button>
        <button class="btn btn-warning" id="btn-lm-fp-verify" style="color:#000">
          <i class="fas fa-shield-halved"></i> Verify</button>
        <button class="btn btn-primary" id="btn-lm-fp-reset" style="display:none">
          <i class="fas fa-lock"></i> Reset Password</button>
      </div>
    </div>`;
  document.body.appendChild(ov);
  ov.onclick = e => { if (e.target === ov) ov.remove(); };

  // Step 1: Verify
  ov.querySelector('#btn-lm-fp-verify').onclick = async () => {
    const LoginID     = ov.querySelector('#lm-fp-lid').value.trim();
    const SecurityQtn = ov.querySelector('#lm-fp-sqtn').value;
    const Answer      = ov.querySelector('#lm-fp-ans').value.trim();
    const errEl       = ov.querySelector('#lm-fp-err');
    errEl.textContent = '';
    if (!LoginID)     return (errEl.textContent = 'Login ID is required.');
    if (!SecurityQtn) return (errEl.textContent = 'Select a security question.');
    if (!Answer)      return (errEl.textContent = 'Answer is required.');
    try {
      // Validate only (NewPassword empty = validate mode)
      const r = await api('/api/logins/forgot-password', {
        method: 'POST', body: { LoginID, SecurityQtn, Answer, NewPassword: '__VALIDATE_ONLY__' }
      });
      // If no error, proceed to step 2
      ov.querySelector('#lm-fp-step1').style.display = 'none';
      ov.querySelector('#lm-fp-step2').style.display = '';
      ov.querySelector('#btn-lm-fp-verify').style.display = 'none';
      ov.querySelector('#btn-lm-fp-reset').style.display  = '';
      ov.querySelector('#lm-fp-newpwd').focus();
    } catch (e) {
      errEl.textContent = e.message || 'Verification failed.';
    }
  };

  // Step 2: Reset
  ov.querySelector('#btn-lm-fp-reset').onclick = async () => {
    const LoginID     = ov.querySelector('#lm-fp-lid').value.trim();
    const SecurityQtn = ov.querySelector('#lm-fp-sqtn').value;
    const Answer      = ov.querySelector('#lm-fp-ans').value.trim();
    const NewPassword = ov.querySelector('#lm-fp-newpwd').value.trim();
    const CfmPassword = ov.querySelector('#lm-fp-cfmpwd').value.trim();
    const errEl       = ov.querySelector('#lm-fp-err2');
    errEl.textContent = '';
    if (!NewPassword)              return (errEl.textContent = 'Enter a new password.');
    if (NewPassword !== CfmPassword) return (errEl.textContent = 'Passwords do not match.');
    try {
      await api('/api/logins/forgot-password', {
        method: 'POST', body: { LoginID, SecurityQtn, Answer, NewPassword }
      });
      ov.remove();
      showToast('Password reset successfully!', 'success');
      await loadLogins();
    } catch (e) { errEl.textContent = e.message || 'Reset failed.'; }
  };
};

window.deleteLogin = async (id) => {
  if (!await confirm(`Delete Login #${id}? This cannot be undone.`)) return;
  try {
    await api(`/api/logins/${id}`, { method: 'DELETE' });
    showToast('Login deleted!', 'success'); await loadLogins(); updateLmBulkBar();
  } catch (e) { showToast(e.message, 'error'); }
};

async function bulkDeleteLogins() {
  const ids = $$('.lm-row-chk:checked').map(c => parseInt(c.dataset.id));
  if (!ids.length) return;
  if (!await confirm(`Delete ${ids.length} login record(s)? This cannot be undone.`)) return;
  try {
    await api('/api/logins/bulk-delete', { method: 'POST', body: { ids } });
    showToast(`${ids.length} login(s) deleted!`, 'success');
    $('#lm-select-all').checked = false; await loadLogins(); updateLmBulkBar();
  } catch (e) { showToast(e.message, 'error'); }
}

async function bulkExportLogins() {
  const ids = $$('.lm-row-chk:checked').map(c => parseInt(c.dataset.id));
  try {
    const res = await fetch('/api/logins/export-xlsx', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      credentials: 'include', body: JSON.stringify({ ids })
    });
    if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `login_master_${new Date().toISOString().split('T')[0]}.xlsx`;
    a.click(); URL.revokeObjectURL(url);
    showToast(`Exported ${ids.length || 'all'} record(s)!`, 'success');
  } catch (e) { showToast('Export failed: ' + e.message, 'error'); }
}




// -------- KIT MASTER --------
let _kitDivs = [], _kitItems = [];

registerPage('kit-master', () => {
  return `${pageHeader('Kit Master', 'fa-cubes', 'Masters / Kit Master',
    `<button class="btn btn-primary" id="btn-add-kit"><i class="fas fa-plus"></i> Add New</button>`)}
  <div class="card">
    <div class="search-bar">
      <div class="search-input-wrap"><i class="fas fa-search"></i>
        <input type="text" id="kit-search" placeholder="Search kit, division, item...">
      </div>
      <select id="kit-div-filter"
        style="background:var(--bg-dark);border:1px solid var(--border);color:var(--text-primary);
               padding:9px 14px;border-radius:6px;font-size:13.5px;cursor:pointer;min-width:180px">
        <option value="">All Divisions</option>
      </select>
    </div>
    <div class="table-wrapper">
      <table id="tbl-kit-main" style="min-width:820px">
        <thead><tr>
          <th style="width:42px;text-align:center">
            <input type="checkbox" id="kit-select-all"
              style="width:16px;height:16px;cursor:pointer;accent-color:var(--accent)">
          </th>
          <th style="width:75px">Kit ID</th>
          <th style="width:150px">Division</th>
          <th style="width:190px">Kit Name</th>
          <th>Items (Name &#215; Qty)</th>
          <th style="width:90px;text-align:center">Actions</th>
        </tr></thead>
        <tbody id="tbl-kit-body">
          <tr class="empty-row"><td colspan="6"><div class="spinner" style="margin:0 auto"></div></td></tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- Bulk bar -->
  <div id="kit-bulk-bar" style="display:none;position:fixed;bottom:28px;left:50%;transform:translateX(-50%);
    background:var(--bg-card);border:1px solid var(--accent);border-radius:12px;padding:12px 24px;
    z-index:500;box-shadow:0 8px 32px rgba(0,0,0,.5);align-items:center;gap:16px;min-width:380px">
    <span id="kit-sel-count" style="color:var(--accent);font-weight:600;font-size:14px"></span>
    <div style="flex:1"></div>
    <button class="btn btn-success" id="btn-kit-bulk-export"><i class="fas fa-file-excel"></i> Export XLSX</button>
    <button class="btn btn-danger"  id="btn-kit-bulk-delete"><i class="fas fa-trash"></i> Delete Selected</button>
    <button class="btn btn-secondary btn-sm" id="btn-kit-bulk-cancel"><i class="fas fa-xmark"></i></button>
  </div>
  </div>`;
});

window._pageBinders['kit-master'] = async () => {
  try {
    [_kitDivs, _kitItems] = await Promise.all([api('/api/divisions'), api('/api/items')]);
  } catch (_) {}

  await loadKits();

  const divFilter = $('#kit-div-filter');
  if (divFilter) {
    _kitDivs.forEach(d => {
      const o = document.createElement('option');
      o.value = d.DivisionId || d.DivisionID; o.textContent = d.DivisionName;
      divFilter.appendChild(o);
    });
    divFilter.onchange = applyKitFilters;
  }
  $('#kit-search').oninput = applyKitFilters;
  $('#btn-add-kit').onclick = () => showAddKitModal();
  $('#kit-select-all').onchange = e => {
    $$('.kit-row-chk').forEach(c => { c.checked = e.target.checked; }); updateKitBulkBar();
  };
  $('#btn-kit-bulk-cancel').onclick = () => {
    $$('.kit-row-chk').forEach(c => c.checked = false);
    $('#kit-select-all').checked = false; updateKitBulkBar();
  };
  $('#btn-kit-bulk-export').onclick = () => bulkExportKits();
  $('#btn-kit-bulk-delete').onclick  = () => bulkDeleteKits();
};

function applyKitFilters() {
  const q = ($('#kit-search')?.value || '').toLowerCase();
  const divId = $('#kit-div-filter')?.value || '';
  $$('#tbl-kit-body tr:not(.empty-row)').forEach(tr => {
    const matchText = !q || tr.textContent.toLowerCase().includes(q);
    const matchDiv  = !divId || tr.dataset.divId === divId;
    tr.style.display = (matchText && matchDiv) ? '' : 'none';
  });
}

async function loadKits() {
  const tbody = $('#tbl-kit-body'); if (!tbody) return;
  tbody.innerHTML = `<tr class="empty-row"><td colspan="6"><div class="spinner" style="margin:0 auto"></div></td></tr>`;
  let data;
  try { data = await api('/api/kit-details'); }
  catch (e) {
    tbody.innerHTML = `<tr class="empty-row"><td colspan="6" style="color:var(--danger)">
      <i class="fas fa-circle-xmark"></i> Failed: ${e.message}</td></tr>`;
    return;
  }
  if (!data.length) { tbody.innerHTML = `<tr class="empty-row"><td colspan="6">No kits found.</td></tr>`; return; }

  tbody.innerHTML = data.map(kit => {
    const itemPills = kit.Items && kit.Items.length
      ? kit.Items.map(it =>
          `<span style="display:inline-block;background:var(--bg-dark);border:1px solid var(--border);
            border-radius:20px;padding:2px 10px;font-size:12px;margin:2px 3px;white-space:nowrap">
            ${it.ItemName || '?'} &times; <strong>${it.ItemQty}</strong></span>`
        ).join('')
      : '<span style="color:var(--text-muted);font-size:12px">No items</span>';

    return `<tr data-id="${kit.KitID}" data-div-id="${kit.DivisionId||''}" class="kit-row">
      <td style="text-align:center">
        <input type="checkbox" class="kit-row-chk" data-id="${kit.KitID}"
          style="width:16px;height:16px;cursor:pointer;accent-color:var(--accent)">
      </td>
      <td style="color:var(--text-secondary);font-size:13px">${kit.KitID}</td>
      <td>
        <span style="background:var(--accent-soft);color:var(--accent);border-radius:20px;
          padding:3px 10px;font-size:12px;font-weight:600">
          ${kit.DivisionName || '<span style="color:var(--text-muted)">-</span>'}
        </span>
      </td>
      <td style="font-weight:600">
        <span class="kit-edit-cell" data-id="${kit.KitID}"
          style="cursor:pointer;text-decoration:underline dotted;text-underline-offset:3px"
          title="Click to edit">${kit.KitName || '-'}</span>
      </td>
      <td style="max-width:400px">${itemPills}</td>
      <td style="text-align:center">
        <button class="btn btn-danger btn-sm" onclick="deleteKit(${kit.KitID})" title="Delete Kit">
          <i class="fas fa-trash"></i>
        </button>
      </td>
    </tr>`;
  }).join('');

  $$('.kit-row-chk').forEach(chk => {
    chk.onchange = () => { updateKitBulkBar(); syncKitSelectAll(); };
  });
  $$('.kit-edit-cell').forEach(cell => {
    cell.onclick = () => {
      const kit = data.find(k => k.KitID === parseInt(cell.dataset.id));
      if (kit) showEditKitModal(kit);
    };
  });
}

function syncKitSelectAll() {
  const all = $$('.kit-row-chk'), checked = all.filter(c => c.checked);
  const sa = $('#kit-select-all'); if (!sa) return;
  sa.checked = all.length > 0 && checked.length === all.length;
  sa.indeterminate = checked.length > 0 && checked.length < all.length;
}
function updateKitBulkBar() {
  const checked = $$('.kit-row-chk:checked');
  const bar = $('#kit-bulk-bar'); if (!bar) return;
  if (checked.length > 0) {
    bar.style.display = 'flex';
    $('#kit-sel-count').textContent = `${checked.length} kit${checked.length > 1 ? 's' : ''} selected`;
  } else { bar.style.display = 'none'; }
}

/* ---- helpers for modal ---- */
function _kitSS() {
  return `style="background:var(--bg-dark);border:1px solid var(--border);border-radius:6px;
          padding:8px 11px;color:var(--text-primary);flex:1;font-size:13.5px;cursor:pointer"`;
}
function _kitIS() {
  return `style="background:var(--bg-dark);border:1px solid var(--border);border-radius:6px;
          padding:8px 11px;color:var(--text-primary);width:90px;font-size:13.5px;text-align:center"`;
}
function _kitDivOpts(selId) {
  return `<option value="">- Division -</option>${_kitDivs.map(d => {
    const id = d.DivisionId || d.DivisionID;
    return `<option value="${id}" ${id == selId ? 'selected' : ''}>${d.DivisionName}</option>`;
  }).join('')}`;
}
function _kitItemOpts(selId) {
  return `<option value="">- Item -</option>${_kitItems.map(i => {
    const id = i.itemid || i.Itemid;
    return `<option value="${id}" ${id == selId ? 'selected' : ''}>${i.ItemName}</option>`;
  }).join('')}`;
}

function _buildKitItemRow(i, item = {}) {
  return `<div class="kit-line" data-i="${i}"
    style="display:flex;align-items:center;gap:8px;margin-bottom:8px;padding:6px 10px;
           background:var(--bg-dark);border-radius:8px;border:1px solid var(--border)">
    <select class="kit-line-item" data-i="${i}" ${_kitSS()}>
      ${_kitItemOpts(item.ItemID || item.ItemId || '')}
    </select>
    <input type="number" class="kit-line-qty" data-i="${i}" value="${item.ItemQty || 1}"
      min="1" step="1" ${_kitIS()} placeholder="Qty" title="Quantity"/>
    <button type="button" class="kit-line-remove btn btn-danger btn-sm" data-i="${i}"
      style="padding:6px 10px;flex-shrink:0" title="Remove row">
      <i class="fas fa-minus"></i></button>
  </div>`;
}

function _renderKitLines(container, lines) {
  container.innerHTML = lines.map((item, i) => _buildKitItemRow(i, item)).join('');
  container.querySelectorAll('.kit-line-remove').forEach(btn => {
    btn.onclick = () => {
      if (container.querySelectorAll('.kit-line').length <= 1) {
        return showToast('At least 1 item is required', 'error');
      }
      btn.closest('.kit-line').remove();
    };
  });
}

function _collectKitLines(container) {
  return Array.from(container.querySelectorAll('.kit-line')).map(row => ({
    ItemId: row.querySelector('.kit-line-item').value,
    ItemQty: Math.max(1, parseInt(row.querySelector('.kit-line-qty').value) || 1)
  }));
}

function _kitModalBody(kit = {}) {
  const initLines = (kit.Items && kit.Items.length) ? kit.Items : [{}];
  const lineHtml = initLines.map((item, i) => _buildKitItemRow(i, item)).join('');
  return `
    <div class="form-field" style="margin-bottom:14px">
      <label>Kit ID <span style="color:var(--text-muted);font-size:11px">(auto-assigned)</span></label>
      <input type="text" value="${kit.KitID || '~auto'}" readonly
        style="background:var(--bg-dark);border:1px dashed var(--border);border-radius:6px;
               padding:8px 12px;color:var(--text-muted);width:100%;cursor:not-allowed;opacity:0.65;font-style:italic"/>
    </div>
    <div class="form-row cols-2" style="gap:12px;margin-bottom:14px">
      <div class="form-field">
        <label>Division <span style="color:var(--danger)">*</span></label>
        <select id="kit-modal-div"
          style="background:var(--bg-dark);border:1px solid var(--border);border-radius:6px;
                 padding:8px 12px;color:var(--text-primary);width:100%;font-size:14px;cursor:pointer">
          ${_kitDivOpts(kit.DivisionId)}
        </select>
      </div>
      <div class="form-field">
        <label>Kit Name <span style="color:var(--danger)">*</span></label>
        <input type="text" id="kit-modal-name" value="${kit.KitName || ''}"
          style="background:var(--bg-dark);border:1px solid var(--border);border-radius:6px;
                 padding:8px 12px;color:var(--text-primary);width:100%;font-size:14px"
          placeholder="Enter kit name"/>
      </div>
    </div>
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
      <label style="font-weight:600;font-size:13.5px"><i class="fas fa-box-open" style="margin-right:6px;color:var(--accent)"></i>Items in this Kit</label>
      <button type="button" id="btn-kit-add-line" class="btn btn-secondary btn-sm">
        <i class="fas fa-plus"></i> Add Item Row</button>
    </div>
    <div id="kit-lines-container">${lineHtml}</div>`;
}

async function showAddKitModal() {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal" style="max-width:560px;animation:slideUp 0.2s ease">
      <div class="modal-header">
        <h3><i class="fas fa-cubes"></i> Make a Kit</h3>
        <button class="btn-close-modal" onclick="this.closest('.modal-overlay').remove()">
          <i class="fas fa-xmark"></i></button>
      </div>
      <div class="modal-body" style="max-height:65vh;overflow-y:auto">${_kitModalBody()}</div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
        <button class="btn btn-primary" id="btn-kit-add-save">
          <i class="fas fa-cubes"></i> Make the Kit</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);
  overlay.onclick = e => { if (e.target === overlay) overlay.remove(); };

  const container = overlay.querySelector('#kit-lines-container');
  // Attach remove handlers
  container.querySelectorAll('.kit-line-remove').forEach(btn => {
    btn.onclick = () => {
      if (container.querySelectorAll('.kit-line').length <= 1)
        return showToast('At least 1 item is required', 'error');
      btn.closest('.kit-line').remove();
    };
  });
  overlay.querySelector('#btn-kit-add-line').onclick = () => {
    const idx = container.querySelectorAll('.kit-line').length;
    const div = document.createElement('div');
    div.innerHTML = _buildKitItemRow(idx);
    const newRow = div.firstElementChild;
    newRow.querySelector('.kit-line-remove').onclick = () => {
      if (container.querySelectorAll('.kit-line').length <= 1)
        return showToast('At least 1 item is required', 'error');
      newRow.remove();
    };
    container.appendChild(newRow);
  };
  overlay.querySelector('#btn-kit-add-save').onclick = async () => {
    const DivisionId = overlay.querySelector('#kit-modal-div').value;
    const KitName    = overlay.querySelector('#kit-modal-name').value.trim();
    const items      = _collectKitLines(container);
    if (!DivisionId) return showToast('Select a Division', 'error');
    if (!KitName)    return showToast('Kit Name is required', 'error');
    if (items.some(it => !it.ItemId)) return showToast('Select an Item for each row', 'error');
    try {
      await api('/api/kit-details', { method: 'POST', body: { DivisionId, KitName, items } });
      overlay.remove(); showToast('Kit created!', 'success'); await loadKits();
    } catch (e) { showToast(e.message, 'error'); }
  };
}

function showEditKitModal(kit) {
  const existing = $('#kit-edit-modal'); if (existing) existing.remove();
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay'; overlay.id = 'kit-edit-modal';
  overlay.innerHTML = `
    <div class="modal" style="max-width:560px;animation:slideUp 0.2s ease">
      <div class="modal-header">
        <h3><i class="fas fa-pen-to-square"></i> Edit Kit #${kit.KitID}</h3>
        <button class="btn-close-modal" onclick="document.getElementById('kit-edit-modal').remove()">
          <i class="fas fa-xmark"></i></button>
      </div>
      <div class="modal-body" style="max-height:65vh;overflow-y:auto">${_kitModalBody(kit)}</div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="document.getElementById('kit-edit-modal').remove()">Cancel</button>
        <button class="btn btn-primary" id="btn-kit-edit-save">
          <i class="fas fa-floppy-disk"></i> Save</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);
  overlay.onclick = e => { if (e.target === overlay) overlay.remove(); };

  const container = overlay.querySelector('#kit-lines-container');
  container.querySelectorAll('.kit-line-remove').forEach(btn => {
    btn.onclick = () => {
      if (container.querySelectorAll('.kit-line').length <= 1)
        return showToast('At least 1 item is required', 'error');
      btn.closest('.kit-line').remove();
    };
  });
  overlay.querySelector('#btn-kit-add-line').onclick = () => {
    const idx = container.querySelectorAll('.kit-line').length;
    const div = document.createElement('div');
    div.innerHTML = _buildKitItemRow(idx);
    const newRow = div.firstElementChild;
    newRow.querySelector('.kit-line-remove').onclick = () => {
      if (container.querySelectorAll('.kit-line').length <= 1)
        return showToast('At least 1 item is required', 'error');
      newRow.remove();
    };
    container.appendChild(newRow);
  };
  overlay.querySelector('#btn-kit-edit-save').onclick = async () => {
    const DivisionId = overlay.querySelector('#kit-modal-div').value;
    const KitName    = overlay.querySelector('#kit-modal-name').value.trim();
    const items      = _collectKitLines(container);
    if (!DivisionId) return showToast('Select a Division', 'error');
    if (!KitName)    return showToast('Kit Name is required', 'error');
    if (items.some(it => !it.ItemId)) return showToast('Select an Item for each row', 'error');
    try {
      await api(`/api/kit-details/${kit.KitID}`, { method: 'PUT', body: { DivisionId, KitName, items } });
      overlay.remove(); showToast('Kit updated!', 'success'); await loadKits();
    } catch (e) { showToast(e.message, 'error'); }
  };
}

window.deleteKit = async (kitId) => {
  if (!await confirm(`Delete Kit #${kitId} and all its items? This cannot be undone.`)) return;
  try {
    await api(`/api/kit-details/${kitId}`, { method: 'DELETE' });
    showToast('Kit deleted!', 'success'); await loadKits(); updateKitBulkBar();
  } catch (e) { showToast(e.message, 'error'); }
};

async function bulkDeleteKits() {
  const kitIds = $$('.kit-row-chk:checked').map(c => parseInt(c.dataset.id));
  if (!kitIds.length) return;
  if (!await confirm(`Delete ${kitIds.length} kit(s) and all their items? This cannot be undone.`)) return;
  try {
    await api('/api/kit-details/bulk-delete', { method: 'POST', body: { kitIds } });
    showToast(`${kitIds.length} kit(s) deleted!`, 'success');
    $('#kit-select-all').checked = false; await loadKits(); updateKitBulkBar();
  } catch (e) { showToast(e.message, 'error'); }
}

async function bulkExportKits() {
  const kitIds = $$('.kit-row-chk:checked').map(c => parseInt(c.dataset.id));
  try {
    const res = await fetch('/api/kit-details/export-xlsx', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      credentials: 'include', body: JSON.stringify({ kitIds })
    });
    if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `kit_master_${new Date().toISOString().split('T')[0]}.xlsx`;
    a.click(); URL.revokeObjectURL(url);
    showToast(`Exported ${kitIds.length || 'all'} kit(s) to XLSX!`, 'success');
  } catch (e) { showToast('Export failed: ' + e.message, 'error'); }
}


=======
/* ================================================
   PAGES: Item Master, Vendor, Dealer, User, Login, Kit, Mapping
   ================================================ */

// -------- ITEM MASTER --------
// Full-featured Item Master is now in pages-masters.js - do not re-register here.
// registerPage('items', ...) REMOVED to avoid overriding the correct version.
/*
  return `${pageHeader('Item Master', 'fa-box', 'Masters / Item',
    `<button class="btn btn-primary" id="btn-add-item"><i class="fas fa-plus"></i> Add Item</button>`)}
  <div class="card">
    <div class="search-bar">
      <div class="search-input-wrap"><i class="fas fa-search"></i><input type="text" id="item-search" placeholder="Search items..."></div>
    </div>
    <div class="table-wrapper"><table id="tbl-items">
      <thead><tr><th>Item Name</th><th>Category</th><th>Division</th><th>Sell Price</th><th>Stock</th><th>Reorder Lvl</th><th>UOM</th><th>Actions</th></tr></thead>
      <tbody id="tbl-items-body"><tr class="empty-row"><td colspan="8">Loading...</td></tr></tbody>
    </table></div>
  </div></div>`;
});
window._pageBinders['items'] = async () => {
  await loadItems();
  bindTableSearch('item-search', 'tbl-items-body');
  $('#btn-add-item').onclick = () => showItemModal();
};
async function loadItems() {
  const data = await api('/api/items');
  const tbody = $('#tbl-items-body'); if (!tbody) return;
  tbody.innerHTML = data.length ? data.map(d => `<tr>
    <td><strong>${d.ItemName}</strong></td>
    <td>${d.CategoryName||'-'}</td><td>${d.DivisionName||'-'}</td>
    <td>&#8377;${fmtNum(d.SellPrice)}</td>
    <td><span class="badge ${(d.Stock||0) <= (d.ReorderLevel||0) ? 'badge-danger' : 'badge-success'}">${d.Stock||0}</span></td>
    <td>${d.ReorderLevel||0}</td><td>${d.UOM||'-'}</td>
    <td><div class="btn-bar">
      <button class="btn btn-info btn-sm" onclick="showItemModal(${d.Itemid})"><i class="fas fa-pen"></i></button>
      <button class="btn btn-danger btn-sm" onclick="deleteItem(${d.Itemid})"><i class="fas fa-trash"></i></button>
    </div></td></tr>`).join('') : `<tr class="empty-row"><td colspan="8">No items found.</td></tr>`;
}
window.showItemModal = async (id) => {
  const [cats, divs] = await Promise.all([api('/api/categories'), api('/api/divisions')]);
  let rec = {};
  if (id) { const data = await api('/api/items'); rec = data.find(d => d.Itemid === id) || {}; }
  const ov = modalHtml(id ? 'Edit Item' : 'Add Item', `
    <div class="form-row cols-2">
      <div class="form-field"><label>Item Name *</label><input type="text" id="it-name" value="${rec.ItemName||''}"/></div>
      <div class="form-field"><label>Category *</label>
        <select id="it-cat">${cats.map(c => `<option value="${c.CategoryId}" ${c.CategoryId==rec.CategoryId?'selected':''}>${c.CategoryName}</option>`).join('')}</select>
      </div>
    </div>
    <div class="form-row cols-2">
      <div class="form-field"><label>Division</label>
        <select id="it-div"><option value="">-- Select --</option>${divs.map(d => `<option value="${d.DivisionID}" ${d.DivisionID==rec.DivisionID?'selected':''}>${d.DivisionName}</option>`).join('')}</select>
      </div>
      <div class="form-field"><label>Sell Price</label><input type="number" id="it-price" value="${rec.SellPrice||0}" step="0.01"/></div>
    </div>
    <div class="form-row cols-3">
      <div class="form-field"><label>Stock</label><input type="number" id="it-stock" value="${rec.Stock||0}"/></div>
      <div class="form-field"><label>Reorder Level</label><input type="number" id="it-reorder" value="${rec.ReorderLevel||0}"/></div>
      <div class="form-field"><label>Reorder Qty</label><input type="number" id="it-reorderqty" value="${rec.ReorderQty||0}"/></div>
    </div>
    <div class="form-row cols-2">
      <div class="form-field"><label>UOM</label>
        <select id="it-uom">
          ${['PCS','KG','MTR','LTR','BOX','SET'].map(u => `<option ${u==rec.UOM?'selected':''}>${u}</option>`).join('')}
        </select>
      </div>
      <div class="form-field"><label>Priority</label>
        <select id="it-priority">
          ${['High','Medium','Low'].map(p => `<option ${p==rec.Priority?'selected':''}>${p}</option>`).join('')}
        </select>
      </div>
    </div>
    <div class="modal-footer" style="padding:16px 0 0">
      <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
      <button class="btn btn-primary" id="bit"><i class="fas fa-floppy-disk"></i> Save</button>
    </div>`, 'modal-lg');
  $('#bit', ov).onclick = async () => {
    const b = {
      ItemName: $('#it-name', ov).value.trim(), CategoryId: $('#it-cat', ov).value,
      DivisionID: $('#it-div', ov).value || null, SellPrice: $('#it-price', ov).value,
      Stock: $('#it-stock', ov).value, ReorderLevel: $('#it-reorder', ov).value,
      ReorderQty: $('#it-reorderqty', ov).value, UOM: $('#it-uom', ov).value,
      Priority: $('#it-priority', ov).value
    };
    if (!b.ItemName) return showToast('Item name required', 'error');
    try {
      if (id) await api(`/api/items/${id}`, { method: 'PUT', body: b });
      else await api('/api/items', { method: 'POST', body: b });
      ov.remove(); showToast('Item saved!'); await loadItems();
    } catch (e) { showToast(e.message, 'error'); }
  };
};
window.deleteItem = async (id) => { if (!await confirm('Delete this item?')) return; try { await api(`/api/items/${id}`, { method: 'DELETE' }); showToast('Deleted!'); await loadItems(); } catch (e) { showToast(e.message, 'error'); } };
*/


// -------- VENDOR MASTER (Full-Featured) --------
let _vendorStates = [], _vendorCities = [];

registerPage('vendors', () => {
  return `${pageHeader('Vendor Details', 'fa-truck', 'Masters / Vendor Details',
    `<button class="btn btn-primary" id="btn-add-vendor"><i class="fas fa-plus"></i>  Add New</button>`)}
  <div class="card">
    <div class="search-bar">
      <div class="search-input-wrap">
        <i class="fas fa-search"></i>
        <input type="text" id="vendor-search" placeholder="Search vendor name, company, GST, city...">
      </div>
      <select id="vendor-state-filter"
        style="background:var(--bg-dark);border:1px solid var(--border);border-radius:6px;
               padding:8px 14px;color:var(--text-primary);font-size:13.5px;cursor:pointer;min-width:170px">
        <option value="">All States</option>
      </select>
    </div>
    <div class="table-wrapper" style="overflow-x:auto">
      <table id="tbl-vendor-main" style="min-width:1800px;table-layout:fixed">
        <colgroup>
          <col style="width:42px">
          <col style="width:80px">
          <col style="width:160px">
          <col style="width:120px">
          <col style="width:180px">
          <col style="width:180px">
          <col style="width:130px">
          <col style="width:130px">
          <col style="width:90px">
          <col style="width:170px">
          <col style="width:140px">
          <col style="width:140px">
          <col style="width:160px">
          <col style="width:150px">
          <col style="width:155px">
          <col style="width:160px">
          <col style="width:190px">
          <col style="width:78px">
          <col style="width:110px">
          <col style="width:90px">
        </colgroup>
        <thead>
          <tr>
            <th class="col-sticky" style="width:42px;text-align:center;left:0;z-index:3">
              <input type="checkbox" id="vendor-select-all" title="Select all"
                style="width:16px;height:16px;cursor:pointer;accent-color:var(--accent)">
            </th>
            <th class="col-sticky" style="width:80px;left:42px;z-index:3">Vendor ID</th>
            <th class="col-sticky" style="width:160px;left:122px;z-index:3">Vendor Name</th>
            <th>Mob.</th>
            <th>Address 1</th>
            <th>Address 2</th>
            <th>State</th>
            <th>City</th>
            <th>Pin</th>
            <th>Company Name</th>
            <th>PAN</th>
            <th>Aadhar No</th>
            <th>GST No</th>
            <th>Bank Name</th>
            <th>Bank Acc No</th>
            <th>IFSC Code</th>
            <th style="min-width:170px">Vendor Email</th>
            <th style="width:78px">Status</th>
            <th style="width:110px">AI Score</th>
            <th class="col-sticky-right" style="width:90px;right:0;z-index:3">Actions</th>
          </tr>
        </thead>
        <tbody id="tbl-vendor-body">
          <tr class="empty-row"><td colspan="20"><div class="spinner" style="margin:0 auto"></div></td></tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- Sticky column CSS injected once -->
  <style id="vendor-sticky-css">
    #tbl-vendor-main .col-sticky { position: sticky; background: var(--bg-card); }
    #tbl-vendor-main .col-sticky-right { position: sticky; background: var(--bg-card); }
    #tbl-vendor-main tbody tr:hover td.col-sticky,
    #tbl-vendor-main tbody tr:hover td.col-sticky-right { background: var(--row-hover, rgba(212,175,55,0.06)); }
  </style>

  <!-- Floating bulk-action bar -->
  <div id="vendor-bulk-bar" style="
    display:none; position:fixed; bottom:28px; left:50%; transform:translateX(-50%);
    background:var(--bg-card); border:1px solid var(--accent); border-radius:12px;
    padding:12px 24px; z-index:500; box-shadow:0 8px 32px rgba(0,0,0,0.5);
    align-items:center; gap:16px; min-width:380px;">
    <span id="vendor-sel-count" style="color:var(--accent);font-weight:600;font-size:14px"></span>
    <div style="flex:1"></div>
    <button class="btn btn-success" id="btn-vendor-bulk-export"><i class="fas fa-file-excel"></i> Export XLSX</button>
    <button class="btn btn-danger"  id="btn-vendor-bulk-delete"><i class="fas fa-trash"></i> Delete Selected</button>
    <button class="btn btn-secondary btn-sm" id="btn-vendor-bulk-cancel" title="Cancel"><i class="fas fa-xmark"></i></button>
  </div>
  </div>`;
});

window._pageBinders['vendors'] = async () => {
  try {
    [_vendorStates, _vendorCities] = await Promise.all([
      api('/api/states'), api('/api/cities')
    ]);
  } catch (_) {}

  await loadVendors();
  // Load scorecards in background, inject badges when ready
  _injectVendorScores();

  const stateFilter = $('#vendor-state-filter');
  _vendorStates.forEach(s => {
    const o = document.createElement('option');
    o.value = s.StateID; o.textContent = s.State;
    stateFilter?.appendChild(o);
  });

  $('#vendor-search').oninput  = applyVendorFilters;
  stateFilter.onchange         = applyVendorFilters;
  $('#btn-add-vendor').onclick  = () => showAddVendorModal();
  $('#vendor-select-all').onchange = (e) => {
    $$('.vendor-row-chk').forEach(c => { c.checked = e.target.checked; updateVendorBulkBar(); });
  };
  $('#btn-vendor-bulk-cancel').onclick = () => {
    $$('.vendor-row-chk').forEach(c => c.checked = false);
    $('#vendor-select-all').checked = false;
    updateVendorBulkBar();
  };
  $('#btn-vendor-bulk-export').onclick = () => bulkExportVendors();
  $('#btn-vendor-bulk-delete').onclick  = () => bulkDeleteVendors();
};

function applyVendorFilters() {
  const q       = ($('#vendor-search')?.value || '').toLowerCase();
  const stateId = $('#vendor-state-filter')?.value || '';
  $$('#tbl-vendor-body tr:not(.empty-row)').forEach(tr => {
    const matchText  = !q || tr.textContent.toLowerCase().includes(q);
    const matchState = !stateId || tr.dataset.stateId === stateId;
    tr.style.display = (matchText && matchState) ? '' : 'none';
  });
}

async function loadVendors() {
  const tbody = $('#tbl-vendor-body');
  if (!tbody) return;
  tbody.innerHTML = `<tr class="empty-row"><td colspan="20"><div class="spinner" style="margin:0 auto"></div></td></tr>`;
  let data;
  try { data = await api('/api/vendors?activeOnly=1'); }
  catch (e) {
    tbody.innerHTML = `<tr class="empty-row"><td colspan="19" style="color:var(--danger)">
      <i class="fas fa-circle-xmark"></i> Failed to load: ${e.message}</td></tr>`;
    return;
  }
  if (!data.length) {
    tbody.innerHTML = `<tr class="empty-row"><td colspan="19">No active vendors found.</td></tr>`;
    return;
  }

  tbody.innerHTML = data.map(d => `
    <tr data-id="${d.vendorid}" data-state-id="${d.StateID || ''}" class="vendor-row">
      <td class="col-sticky" style="left:0;text-align:center">
        <input type="checkbox" class="vendor-row-chk" data-id="${d.vendorid}"
          style="width:16px;height:16px;cursor:pointer;accent-color:var(--accent)">
      </td>
      <td class="col-sticky" style="left:42px;color:var(--text-secondary);font-size:13px">${d.vendorid}</td>
      <td class="col-sticky" style="left:122px">
        <span class="vendor-edit-cell" data-id="${d.vendorid}"
          style="cursor:pointer;text-decoration:underline dotted;text-underline-offset:3px;font-weight:500"
          title="Click to edit">${d.Name || '-'}</span>
      </td>
      <td style="font-size:13px">${d.Mob || '-'}</td>
      <td style="font-size:12px;color:var(--text-secondary)">${d.Addr1 || '-'}</td>
      <td style="font-size:12px;color:var(--text-secondary)">${d.Addr2 || '-'}</td>
      <td style="font-size:13px">${d.StateName || '-'}</td>
      <td style="font-size:13px">${d.CityName || '-'}</td>
      <td style="font-size:13px">${d.Pin || '-'}</td>
      <td style="font-size:13px">${d.CompanyName || '-'}</td>
      <td style="font-size:12px;font-family:monospace">${d.PAN || '-'}</td>
      <td style="font-size:12px;font-family:monospace">${d.AadharNo || '-'}</td>
      <td style="font-size:12px;font-family:monospace;color:var(--accent)">${d.GstNo || '-'}</td>
      <td style="font-size:13px">${d.BankName || '-'}</td>
      <td style="font-size:12px;font-family:monospace">${d.BankAccNo || '-'}</td>
      <td style="font-size:12px;font-family:monospace">${d.IFSCCode || '-'}</td>
      <td style="font-size:13px;color:var(--accent)">${d.VendorEmail || '-'}</td>
      <td>
        ${d.Status === 'Y'
          ? `<span style="background:rgba(22,163,74,.15);color:#16a34a;border-radius:20px;padding:2px 9px;font-size:11.5px;font-weight:600">Active</span>`
          : `<span style="background:rgba(220,38,38,.12);color:#dc2626;border-radius:20px;padding:2px 9px;font-size:11.5px;font-weight:600">Inactive</span>`}
      </td>
      <td class="vendor-score-cell" data-vid="${d.vendorid}"
          style="text-align:center;cursor:pointer" title="View Performance Scorecard"
          onclick="window._showVendorScorecardModal(${d.vendorid})">
        <span style="font-size:11px;color:var(--text-muted)">Loading…</span>
      </td>
      <td class="col-sticky-right" style="right:0">
        <button class="btn btn-danger btn-sm" onclick="deleteVendor(${d.vendorid})" title="Delete">
          <i class="fas fa-trash"></i>
        </button>
      </td>
    </tr>`).join('');

  $$('.vendor-row-chk').forEach(chk => {
    chk.onchange = () => { updateVendorBulkBar(); syncVendorSelectAll(); };
  });
  $$('.vendor-edit-cell').forEach(cell => {
    cell.onclick = () => {
      const row = data.find(d => d.vendorid === parseInt(cell.dataset.id));
      if (row) showEditVendorInline(row);
    };
  });
}

/* ═══════════════════════════════════════════════════════════════════
   VENDOR PERFORMANCE SCORECARD — AI Scoring Engine
═══════════════════════════════════════════════════════════════════ */

// Compute 0-100 score from raw metrics
function _computeVendorScore(d) {
  let score = 0;
  const parts = [];

  // 1. Delivery Speed (30 pts)
  if (d.AvgLeadDays >= 0) {
    const ld = d.AvgLeadDays;
    const pts = ld <= 3 ? 30 : ld <= 7 ? 25 : ld <= 14 ? 18 : ld <= 30 ? 10 : 5;
    score += pts;
    parts.push({ label: 'Delivery Speed', value: `Avg ${Math.round(ld)}d lead time`, pts, max: 30 });
  } else {
    score += 15; // neutral — no data
    parts.push({ label: 'Delivery Speed', value: 'No order-inward match yet', pts: 15, max: 30, neutral: true });
  }

  // 2. Qty Accuracy (35 pts)
  if (d.AvgAccuracyPct >= 0) {
    const acc = d.AvgAccuracyPct;
    const pts = acc >= 95 ? 35 : acc >= 85 ? 28 : acc >= 70 ? 18 : acc >= 50 ? 10 : 3;
    score += pts;
    parts.push({ label: 'Quantity Accuracy', value: `${Math.round(acc)}% of ordered qty received`, pts, max: 35 });
  } else {
    score += 25; // neutral
    parts.push({ label: 'Quantity Accuracy', value: 'No matched order/inward data', pts: 25, max: 35, neutral: true });
  }

  // 3. Return Rate (25 pts)
  if (d.ReturnRatePct >= 0) {
    const rr = d.ReturnRatePct;
    const pts = rr === 0 ? 25 : rr <= 2 ? 20 : rr <= 5 ? 14 : rr <= 10 ? 7 : 2;
    score += pts;
    parts.push({ label: 'Return Rate', value: `${rr.toFixed(1)}% of inward lines returned`, pts, max: 25 });
  } else {
    score += 20; // neutral
    parts.push({ label: 'Return Rate', value: 'No inward data yet', pts: 20, max: 25, neutral: true });
  }

  // 4. Order Frequency (10 pts)
  const to = d.TotalOrders || 0;
  const pts4 = to >= 10 ? 10 : to >= 5 ? 7 : to >= 2 ? 4 : to >= 1 ? 2 : 0;
  score += pts4;
  parts.push({ label: 'Order Frequency', value: `${to} order${to !== 1 ? 's' : ''} placed`, pts: pts4, max: 10 });

  // Grade
  const grade = score >= 85 ? { label: 'Excellent',     color: '#16a34a', icon: '🌟' }
              : score >= 70 ? { label: 'Reliable',       color: '#2563eb', icon: '✅' }
              : score >= 50 ? { label: 'Average',        color: '#d97706', icon: '🟡' }
              : score >= 30 ? { label: 'Below Average',  color: '#f97316', icon: '🟠' }
              :               { label: 'Poor',           color: '#dc2626', icon: '🔴' };

  return { score, parts, grade };
}

// Fetch scorecards and inject badges into vendor rows
async function _injectVendorScores() {
  let cards;
  try { cards = await api('/api/vendor-scorecard'); }
  catch (_) { return; }

  window._vendorScoreMap = {};
  cards.forEach(c => { window._vendorScoreMap[c.VendorId] = c; });

  $$('.vendor-score-cell').forEach(cell => {
    const vid = parseInt(cell.dataset.vid);
    const raw = window._vendorScoreMap[vid];
    if (!raw) {
      cell.innerHTML = '<span style="color:var(--text-muted);font-size:11px">—</span>';
      return;
    }
    const { score, grade } = _computeVendorScore(raw);
    cell.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:center;gap:5px">
        <div style="width:34px;height:34px;border-radius:50%;border:2px solid ${grade.color};
                    display:flex;align-items:center;justify-content:center;
                    font-size:11px;font-weight:800;color:${grade.color}">
          ${score}
        </div>
        <div style="font-size:10px;color:${grade.color};font-weight:600;line-height:1.2">
          ${grade.label}
        </div>
      </div>`;
  });
}

// Show detailed scorecard modal for a vendor
window._showVendorScorecardModal = (vendorId) => {
  const raw = window._vendorScoreMap?.[vendorId];
  const ov  = document.createElement('div');
  ov.className = 'modal-overlay';

  if (!raw) {
    ov.innerHTML = `<div class="modal" style="max-width:420px">
      <div class="modal-header"><h3><i class="fas fa-star"></i> Vendor Scorecard</h3>
        <button class="btn-close-modal" onclick="this.closest('.modal-overlay').remove()"><i class="fas fa-xmark"></i></button>
      </div>
      <div class="modal-body"><p style="color:var(--text-muted)">Score data not available. Visit Vendor Details to run analysis.</p></div>
    </div>`;
    document.body.appendChild(ov);
    ov.onclick = e => { if (e.target === ov) ov.remove(); };
    return;
  }

  const { score, parts, grade } = _computeVendorScore(raw);
  const circleOffset = Math.round(251 - (score / 100) * 251); // 2πr ≈ 251 for r=40

  ov.innerHTML = `
    <div class="modal" style="max-width:520px;animation:slideUp .22s ease">
      <div class="modal-header" style="background:linear-gradient(135deg,rgba(${grade.color === '#16a34a' ? '22,163,74' : grade.color === '#2563eb' ? '37,99,235' : '217,119,6'},.1),transparent)">
        <h3 style="gap:8px">
          <i class="fas fa-star-half-stroke" style="color:${grade.color}"></i>
          Vendor Performance Scorecard
        </h3>
        <button class="btn-close-modal" onclick="this.closest('.modal-overlay').remove()">
          <i class="fas fa-xmark"></i>
        </button>
      </div>
      <div class="modal-body">
        <!-- Vendor name + score meter -->
        <div style="display:flex;align-items:center;gap:20px;margin-bottom:20px;flex-wrap:wrap">
          <div style="flex:1;min-width:180px">
            <div style="font-weight:700;font-size:15px;color:var(--text-primary)">${raw.VendorName || 'Vendor'}</div>
            ${raw.CompanyName ? `<div style="font-size:12px;color:var(--text-muted)">${raw.CompanyName}</div>` : ''}
            <div style="margin-top:10px;display:flex;align-items:center;gap:8px">
              <span style="font-size:22px">${grade.icon}</span>
              <span style="font-size:14px;font-weight:700;color:${grade.color}">${grade.label}</span>
            </div>
            <div style="margin-top:6px;font-size:11.5px;color:var(--text-muted)">
              ${raw.TotalOrders} order${raw.TotalOrders !== 1 ? 's' : ''} &bull;
              ${raw.InwardCount} inward${raw.InwardCount !== 1 ? 's' : ''}
            </div>
          </div>
          <!-- Circular score meter -->
          <div style="flex-shrink:0;position:relative;width:90px;height:90px">
            <svg width="90" height="90" viewBox="0 0 90 90">
              <circle cx="45" cy="45" r="40" fill="none" stroke="var(--border)" stroke-width="8"/>
              <circle cx="45" cy="45" r="40" fill="none" stroke="${grade.color}" stroke-width="8"
                stroke-dasharray="251" stroke-dashoffset="${circleOffset}"
                stroke-linecap="round" transform="rotate(-90 45 45)"
                style="transition:stroke-dashoffset .6s ease"/>
            </svg>
            <div style="position:absolute;inset:0;display:flex;flex-direction:column;
                        align-items:center;justify-content:center">
              <div style="font-size:22px;font-weight:800;color:${grade.color}">${score}</div>
              <div style="font-size:9px;color:var(--text-muted);letter-spacing:.5px">/ 100</div>
            </div>
          </div>
        </div>

        <!-- Signal breakdown cards -->
        <div style="display:grid;gap:8px">
          ${parts.map(p => {
            const pct = Math.round(p.pts / p.max * 100);
            const barColor = p.neutral ? '#94a3b8' : p.pts / p.max >= 0.8 ? '#16a34a' : p.pts / p.max >= 0.5 ? '#d97706' : '#dc2626';
            return `
            <div style="background:var(--bg-dark);border-radius:8px;padding:10px 14px;
                        border:1px solid var(--border)">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
                <div style="font-size:12px;font-weight:600;color:var(--text-primary)">${p.label}</div>
                <div style="font-size:12px;font-weight:700;color:${barColor}">${p.pts}/${p.max}</div>
              </div>
              <div style="height:5px;background:var(--border);border-radius:3px;overflow:hidden">
                <div style="height:100%;width:${pct}%;background:${barColor};border-radius:3px;transition:width .5s ease"></div>
              </div>
              <div style="font-size:11px;color:var(--text-muted);margin-top:4px">${p.value}${p.neutral ? ' (using neutral baseline)' : ''}</div>
            </div>`;
          }).join('')}
        </div>

        <!-- Recommendation -->
        <div style="margin-top:14px;padding:10px 14px;background:rgba(201,162,39,.06);
                    border:1px solid rgba(201,162,39,.2);border-radius:8px;font-size:12px;
                    color:var(--text-secondary);line-height:1.6">
          <i class="fas fa-lightbulb" style="color:var(--accent);margin-right:6px"></i>
          <strong style="color:var(--text-primary)">AI Insight: </strong>
          ${score >= 85 ? 'This vendor is performing excellently. Consider prioritising them for future orders.' :
            score >= 70 ? 'This vendor is reliable. Small improvements in delivery speed or quantity accuracy could push them to excellent.' :
            score >= 50 ? 'Average performance. Review return rates and delivery consistency before placing large orders.' :
            score >= 30 ? 'Below average. Consider discussing performance with the vendor or exploring alternatives.' :
            'Poor performance detected. Strongly recommend evaluating alternative vendors for this category.'}
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Close</button>
        <button class="btn btn-primary btn-sm" onclick="navigateTo('vendor-scorecard');this.closest('.modal-overlay').remove()">
          <i class="fas fa-chart-bar"></i> Full Scorecard Report
        </button>
      </div>
    </div>`;

  document.body.appendChild(ov);
  ov.onclick = e => { if (e.target === ov) ov.remove(); };
};

function syncVendorSelectAll() {
  const all = $$('.vendor-row-chk'), checked = all.filter(c => c.checked);
  const sa = $('#vendor-select-all'); if (!sa) return;
  sa.checked = all.length > 0 && checked.length === all.length;
  sa.indeterminate = checked.length > 0 && checked.length < all.length;
}

function updateVendorBulkBar() {
  const checked = $$('.vendor-row-chk:checked');
  const bar = $('#vendor-bulk-bar'); if (!bar) return;
  if (checked.length > 0) {
    bar.style.display = 'flex';
    $('#vendor-sel-count').textContent = `${checked.length} vendor${checked.length > 1 ? 's' : ''} selected`;
  } else { bar.style.display = 'none'; }
}

// Helpers
function vSelStyle() {
  return `style="background:var(--bg-dark);border:1px solid var(--border);border-radius:6px;
          padding:9px 12px;color:var(--text-primary);width:100%;font-size:14px;cursor:pointer"`;
}
function vInpStyle() {
  return `style="background:var(--bg-dark);border:1px solid var(--border);border-radius:6px;
          padding:9px 12px;color:var(--text-primary);width:100%;font-size:14px"`;
}
function vStateOptions(selectedId) {
  const hasSel = selectedId != null && selectedId !== '';
  return _vendorStates.map(s =>
    `<option value="${s.StateID}" ${hasSel && s.StateID == selectedId ? 'selected' : ''}>${s.State}</option>`
  ).join('');
}
function vCityOptions(selectedId, stateId='') {
  const hasSel = selectedId != null && selectedId !== '';
  const pool = stateId
    ? _vendorCities.filter(c => c.StateID == stateId)
    : _vendorCities;
  return pool.map(c =>
    `<option value="${c.CityID}" ${hasSel && c.CityID == selectedId ? 'selected' : ''}>${c.City}</option>`
  ).join('');
}
function _bindVndStateCityFilter(ov) {
  const stateEl = ov.querySelector('#vnd-state');
  const cityEl  = ov.querySelector('#vnd-city');
  if (!stateEl || !cityEl) return;
  stateEl.onchange = () => {
    const sid = stateEl.value;
    cityEl.innerHTML = `<option value="">- Select -</option>${vCityOptions('', sid)}`;
  };
}

function vendorModalBody(rec = {}) {
  return `
    <div class="form-field" style="margin-bottom:14px">
      <label>Vendor ID <span style="color:var(--text-muted);font-size:11px">(auto-assigned)</span></label>
      <input type="text" value="${rec.vendorid || '~auto'}" readonly
        style="background:var(--bg-dark);border:1px dashed var(--border);border-radius:6px;
               padding:9px 12px;color:var(--text-muted);width:100%;cursor:not-allowed;font-style:italic;opacity:0.7"/>
    </div>
    <div class="form-row cols-2" style="gap:12px;margin-bottom:14px">
      <div class="form-field">
        <label>Vendor Name <span style="color:var(--danger)">*</span></label>
        <input type="text" id="vnd-name" value="${rec.Name || ''}" ${vInpStyle()} placeholder="e.g. Mr. Ujjawal"/>
      </div>
      <div class="form-field">
        <label>Mobile</label>
        <input type="text" id="vnd-mob" value="${rec.Mob || ''}" ${vInpStyle()} placeholder="10-digit mobile"/>
      </div>
    </div>
    <div class="form-row cols-2" style="gap:12px;margin-bottom:14px">
      <div class="form-field">
        <label>Address 1</label>
        <input type="text" id="vnd-addr1" value="${rec.Addr1 || ''}" ${vInpStyle()}/>
      </div>
      <div class="form-field">
        <label>Address 2</label>
        <input type="text" id="vnd-addr2" value="${rec.Addr2 || ''}" ${vInpStyle()}/>
      </div>
    </div>
    <div class="form-row cols-3" style="gap:12px;margin-bottom:14px">
      <div class="form-field">
        <label>State</label>
        <select id="vnd-state" ${vSelStyle()}>
          <option value="">- Select -</option>
          ${vStateOptions(rec.StateID)}
        </select>
      </div>
      <div class="form-field">
        <label>City</label>
        <select id="vnd-city" ${vSelStyle()}>
          <option value="">- Select -</option>
          ${vCityOptions(rec.CityID, rec.StateID)}
        </select>
      </div>
      <div class="form-field">
        <label>Pin</label>
        <input type="text" id="vnd-pin" value="${rec.Pin || ''}" ${vInpStyle()} placeholder="6-digit"/>
      </div>
    </div>
    <div class="form-row cols-2" style="gap:12px;margin-bottom:14px">
      <div class="form-field">
        <label>Company Name</label>
        <input type="text" id="vnd-company" value="${rec.CompanyName || ''}" ${vInpStyle()}/>
      </div>
      <div class="form-field">
        <label>PAN</label>
        <input type="text" id="vnd-pan" value="${rec.PAN || ''}" ${vInpStyle()} placeholder="ABCDE1234F"/>
      </div>
    </div>
    <div class="form-row cols-2" style="gap:12px;margin-bottom:14px">
      <div class="form-field">
        <label>Aadhar No</label>
        <input type="text" id="vnd-aadhar" value="${rec.AadharNo || ''}" ${vInpStyle()}/>
      </div>
      <div class="form-field">
        <label>GST No</label>
        <input type="text" id="vnd-gst" value="${rec.GstNo || ''}" ${vInpStyle()} placeholder="15-char GST"/>
      </div>
    </div>
    <div class="form-row cols-3" style="gap:12px">
      <div class="form-field">
        <label>Bank Name</label>
        <input type="text" id="vnd-bank" value="${rec.BankName || ''}" ${vInpStyle()}/>
      </div>
      <div class="form-field">
        <label>Bank Acc No</label>
        <input type="text" id="vnd-bankac" value="${rec.BankAccNo || ''}" ${vInpStyle()}/>
      </div>
      <div class="form-field">
        <label>IFSC Code</label>
        <input type="text" id="vnd-ifsc" value="${rec.IFSCCode || ''}" ${vInpStyle()} placeholder="SBIN0001234"/>
      </div>
    </div>
    <div class="form-row cols-1" style="gap:12px;margin-top:14px">
      <div class="form-field">
        <label>Vendor Email ID</label>
        <input type="email" id="vnd-email" value="${rec.VendorEmail || ''}" ${vInpStyle()} placeholder="vendor@example.com"/>
      </div>
    </div>`;
}

function collectVendorForm(overlay) {
  return {
    Name:       overlay.querySelector('#vnd-name').value.trim(),
    Mob:        overlay.querySelector('#vnd-mob').value.trim(),
    Addr1:      overlay.querySelector('#vnd-addr1').value.trim(),
    Addr2:      overlay.querySelector('#vnd-addr2').value.trim(),
    StateID:    overlay.querySelector('#vnd-state').value,
    CityID:     overlay.querySelector('#vnd-city').value,
    Pin:        overlay.querySelector('#vnd-pin').value.trim(),
    CompanyName:overlay.querySelector('#vnd-company').value.trim(),
    PAN:        overlay.querySelector('#vnd-pan').value.trim(),
    AadharNo:   overlay.querySelector('#vnd-aadhar').value.trim(),
    GstNo:      overlay.querySelector('#vnd-gst').value.trim(),
    BankName:   overlay.querySelector('#vnd-bank').value.trim(),
    BankAccNo:  overlay.querySelector('#vnd-bankac').value.trim(),
    IFSCCode:   overlay.querySelector('#vnd-ifsc').value.trim(),
    VendorEmail:overlay.querySelector('#vnd-email').value.trim()
  };
}

// Inline Edit (opens on Vendor Name click)
function showEditVendorInline(rec) {
  const existing = $('#vendor-inline-editor'); if (existing) existing.remove();
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'vendor-inline-editor';
  overlay.innerHTML = `
    <div class="modal" style="max-width:680px;animation:slideUp 0.2s ease">
      <div class="modal-header">
        <h3><i class="fas fa-pen-to-square"></i> Edit Vendor</h3>
        <button class="btn-close-modal" onclick="document.getElementById('vendor-inline-editor').remove()">
          <i class="fas fa-xmark"></i></button>
      </div>
      <div class="modal-body">${vendorModalBody(rec)}</div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="document.getElementById('vendor-inline-editor').remove()">Cancel</button>
        <button class="btn btn-primary" id="btn-vendor-inline-save"><i class="fas fa-floppy-disk"></i> Save</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);
  overlay.onclick = e => { if (e.target === overlay) overlay.remove(); };
  _bindVndStateCityFilter(overlay);
  document.getElementById('btn-vendor-inline-save').onclick = async () => {
    const b = collectVendorForm(overlay);
    if (!b.Name) return showToast('Vendor Name is required', 'error');
    try {
      await api(`/api/vendors/${rec.vendorid}`, { method: 'PUT', body: b });
      overlay.remove(); showToast('Vendor updated!', 'success'); await loadVendors();
    } catch (e) { showToast(e.message, 'error'); }
  };
  overlay.querySelector('#vnd-name').focus();
}

// Add New Modal
async function showAddVendorModal() {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal" style="max-width:680px;animation:slideUp 0.2s ease">
      <div class="modal-header">
        <h3><i class="fas fa-plus-circle"></i> Add Vendor</h3>
        <button class="btn-close-modal" onclick="this.closest('.modal-overlay').remove()">
          <i class="fas fa-xmark"></i></button>
      </div>
      <div class="modal-body">${vendorModalBody()}</div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
        <button class="btn btn-primary" id="btn-vendor-add-save"><i class="fas fa-plus"></i> Add Vendor</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);
  overlay.onclick = e => { if (e.target === overlay) overlay.remove(); };
  overlay.querySelector('.btn-close-modal').onclick = () => overlay.remove();
  _bindVndStateCityFilter(overlay);
  overlay.querySelector('#vnd-name').focus();
  overlay.querySelector('#btn-vendor-add-save').onclick = async () => {
    const b = collectVendorForm(overlay);
    if (!b.Name) return showToast('Vendor Name is required', 'error');
    try {
      await api('/api/vendors', { method: 'POST', body: b });
      overlay.remove(); showToast('Vendor added!', 'success'); await loadVendors();
    } catch (e) { showToast(e.message, 'error'); }
  };
}

// Single Delete
window.deleteVendor = async (id) => {
  if (!await confirm(`Delete Vendor ID ${id}? This cannot be undone.`)) return;
  try {
    await api(`/api/vendors/${id}`, { method: 'DELETE' });
    showToast('Vendor deleted!', 'success'); await loadVendors(); updateVendorBulkBar();
  } catch (e) { showToast(e.message, 'error'); }
};

// Bulk Delete
async function bulkDeleteVendors() {
  const ids = $$('.vendor-row-chk:checked').map(c => parseInt(c.dataset.id));
  if (!ids.length) return;
  if (!await confirm(`Delete ${ids.length} vendor(s)? This cannot be undone.`)) return;
  try {
    await api('/api/vendors/bulk-delete', { method: 'POST', body: { ids } });
    showToast(`${ids.length} vendor(s) deleted!`, 'success');
    $('#vendor-select-all').checked = false; await loadVendors(); updateVendorBulkBar();
  } catch (e) { showToast(e.message, 'error'); }
}

// Bulk Export XLSX
async function bulkExportVendors() {
  const ids = $$('.vendor-row-chk:checked').map(c => parseInt(c.dataset.id));
  try {
    const res = await fetch('/api/vendors/export-xlsx', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      credentials: 'include', body: JSON.stringify({ ids })
    });
    if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vendor_details_${new Date().toISOString().split('T')[0]}.xlsx`;
    a.click(); URL.revokeObjectURL(url);
    showToast(`Exported ${ids.length} vendor(s) to XLSX!`, 'success');
  } catch (e) { showToast('Export failed: ' + e.message, 'error'); }
}


// ======== DEALER MASTER ========

const _DEALER_STATES = ['Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat','Haryana','Himachal Pradesh','Jammu & Kashmir','Jharkhand','Karnataka','Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Orissa','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal'];
const _DEALER_CITIES = ['Agartala','Agra','Ahmedabad','Aizwal','Ajmer','Alibaug','Allahabad','Alleppey','Almora','Alsisar','Alwar','Ambala','Amla','Amritsar','Anand','Anini','Ankleshwar','Ashtamudi','Auli','Aurangabad','Baddi','Badrinath','Balasinor','Balrampur','Bambora','Bamenq','Bandhavgarh','Bandipur','Bangalore','Barbil','Bareilly','Behror','Belgaum','Berhampur','Betalghat','Bhandardara','Bharatpur','Bharuch','Bhavangadh','Bhavnagar','Bhilai','Bhimtal','Bhopal','Bhubaneshwar','Bhuj','Bikaner','Binsar','Bodhgaya','Bundi','Calicut','Canannore','Chail','Chamba','Chandigarh','Chennai','Chikmagalur','Chiplun','Chitrakoot','Chittorgarh','Coimbatore','Coonoor','Coorg','Corbett National Park','Cuttack','Dabhosa','Dalhousie','Dandeli','Dapoli','Darjeeling','Dausa','Dehradun','Dharamshala','Dibrugarh','Digha','Dimapur','Dive Agar','Dooars','Durgapur','Durshet','Dwarka','Faridabad','Firozabad','Ganapatipule','Gandhidham','Gandhinagar','Gangotri','Gangtok','Garhmukteshwar','Garhwal','Gaya','Goa','Gokharna','Gondal','Gorakhpur','Gulmarg','Gurgaon','Guruvayoor','Guwahati','Gwalior','Halebid','Hampi','Hansi','Haridwar','Hassan','Hospet','Hosur','Hubli','Hyderabad','Idukki','Igatpuri','Imphal','Indore','Jabalpur','Jaipur','Jairampur','Jaisalmer','Jalandhar','Jalgaon','Jambugodha','Jammu','Jamnagar','Jamshedpur','Jawhar','Jhansi','Jodhpur','Jojawar','Jorhat','Junagadh','Kabini','Kalimpong','Kanatal','Kanchipuram','Kanha','Kanpur','Kanyakumari','Kargil','Karjat','Karnal','Karur','Karwar','Kasargod','Kasauli','Kashid','Kashipur','Katra','Kausani','Kaza','Kaziranga','Kedarnath','Khajjiar','Khajuraho','Khandala','Khimsar','Kiphire','Kochin','Kodaikanal','Kohima','Kolhapur','Kolkata','Kollam','Kota','Kotagiri','Kottayam','Kovalam','Kufri','Kullu','Kumarakom','Kumbakonam','Kumbalgarh','Kumily','Kurseong','Kushinagar','Lachung','Leh','Lonavala','Lothal','Lucknow','Ludhiana','Madurai','Mahabaleshwar','Mahabalipuram','Malappuram','Malpe','Malshej Ghat','Malvan','Manali','Mandavi','Mandawa','Mandormoni','Manesar','Mangalore','Manmad','Mararri','Marchula','Matheran','Mathura','Mcleodganj','Miao','Mipi','Mohali','Mokokchung','Moradabad','Morbi','Mount Abu','Mukteshwar','Mumbai','Mundra','Munnar','Murud Janjira','Mussoorie','Mysore','Nadukani','Nagapattinam','Nagarhole','Nagaur Fort','Nagothane','Nagpur','Nahan','Nainital','Naldhera','Nanded','Napne','Nasik','Navi Mumbai','Neral','Nilgiri','Noida','Ooty','Orchha','Osian','Pachmarhi','Pahalgam','Pakke-Kessanq','Palampur','Palanpur','Pali','Palitana','Pallakad','Panchgani','Panchkula','Panhala','Panna','Pantnagar','Panvel','Parwanoo','Pathankot','Patiala','Patna','Patnitop','Pelling','Pench','Peren','Phagwara','Phalodi','Phek','Pinjore','Pondicherry','Poovar','Porbandar','Poshina','Pragpur','Pune','Puri','Puskhar','Puttaparthi','Rai Bareilly','Raichak','Raipur','Rajahmundry','Rajasthan','Rajgir','Rajkot','Rajpipla','Rajsamand','Ram Nagar','Rameshwaram','Ramgarh','Ranakpur','Ranchi','Ranikhet','Ranny','Ranthambore','Ratnagiri','Ravangla','Rishikesh','Rishyap','Rohetgarh','Rourkela','Rupa','Sajan','Salem','Saputara','Sasan Gir','Sattal','Sawai Madhopur','Sawantwadi','Secunderabad','Seppa','Sharavanbelgola','Shillong','Shimla','Shimlipal','Shirdi','Shivanasamudra','Siana','Siliguri','Sinqchunq','Sivaganga District','Solan','Soma','Sonauli','Srinagar','Sunderban','Surat','Tanjore','Tapola','Tarapith','Thane','Thekkady','Thembanq','Thiruvananthapuram','Thirvannamalai','Thrissur','Tiruchirapalli','Tirupati','Tirupur','Tuensang','Udaipur','Udhampur','Udupi','Ujjain','Uttarakhand','Uttarkashi','Vadodara','Vagamon','Vapi','Varanasi','Varkala','Velankanni','Vellore','Veraval','Vijayawada','Vikramgadh','Vishakapatnam','Wakro','Wankaner','Wayanad','Wokha','Yamunotri','Yercaud','Yuksom','Zemithanq','Zunheboto'];

function _dlStateOpts(sel) { return `<option value="">- Select State -</option>${_DEALER_STATES.map(s=>`<option value="${s}" ${s===sel?'selected':''}>${s}</option>`).join('')}`; }
function _dlCityOpts(sel)  { return `<option value="">- Select City -</option>${_DEALER_CITIES.map(c=>`<option value="${c}" ${c===sel?'selected':''}>${c}</option>`).join('')}`; }
function _dlCourierOpts(couriers, selId) { return `<option value="">- Select -</option>${couriers.map(c=>`<option value="${c.CourierId}" ${c.CourierId==selId?'selected':''}>${c.Name}</option>`).join('')}`; }
function _dlDivOpts(divs, selId) { return `<option value="">- Select -</option>${divs.map(d=>{const id=d.DivisionId||d.DivisionID;return `<option value="${id}" ${id==selId?'selected':''}>${d.DivisionName}</option>`}).join('')}`; }
function _dlSelStyle() { return `style="background:var(--bg-dark);border:1px solid var(--border);border-radius:6px;padding:9px 12px;color:var(--text-primary);width:100%;font-size:13.5px;cursor:pointer"`; }
function _dlInStyle() { return `style="background:var(--bg-dark);border:1px solid var(--border);border-radius:6px;padding:9px 12px;color:var(--text-primary);width:100%;font-size:13.5px"`; }

registerPage('dealers', () => {
  const sticky = `position:sticky;background:var(--bg-card);z-index:2`;
  return `${pageHeader('Dealer Master','fa-store','Masters / Dealer',
    `<button class="btn btn-primary" id="btn-add-dealer"><i class="fas fa-plus"></i> Add New</button>`)}
  <div class="card">
    <div class="search-bar">
      <div class="search-input-wrap"><i class="fas fa-search"></i>
        <input type="text" id="dealer-search" placeholder="Search by company name...">
      </div>
    </div>
    <div class="table-wrapper" style="overflow-x:auto">
      <table id="tbl-dealer-main" style="min-width:2400px;border-collapse:collapse">
        <thead><tr>
          <th style="${sticky};left:0;width:42px;text-align:center">
            <input type="checkbox" id="dealer-select-all" style="width:16px;height:16px;cursor:pointer;accent-color:var(--accent)" title="Select all records across all pages">
          </th>
          <th style="${sticky};left:42px;width:80px">Dealer ID</th>
          <th style="${sticky};left:122px;width:170px">Contact Person</th>
          <th style="${sticky};left:292px;width:170px">Company Name</th>
          <th style="width:160px">Address 1</th>
          <th style="width:140px">Address 2</th>
          <th style="width:140px">Address 3</th>
          <th style="width:110px">Mob.</th>
          <th style="width:130px">GST No</th>
          <th style="width:160px">Place of Sales Promo.</th>
          <th style="width:130px">State</th>
          <th style="width:120px">City</th>
          <th style="width:80px">Pin</th>
          <th style="width:100px">Tel No</th>
          <th style="width:160px">Email</th>
          <th style="width:110px">Dealer Type</th>
          <th style="width:110px">PAN</th>
          <th style="width:130px">Aadhar No</th>
          <th style="width:130px">Bank Name</th>
          <th style="width:130px">Bank Acc No</th>
          <th style="width:110px">IFSC Code</th>
          <th style="width:70px">Status</th>
          <th style="${sticky};right:0;width:90px;text-align:center">Actions</th>
        </tr></thead>
        <tbody id="tbl-dealer-body">
          <tr class="empty-row"><td colspan="23"><div class="spinner" style="margin:0 auto"></div></td></tr>
        </tbody>
      </table>
    </div>
    <!-- Pagination -->
    <div id="dealer-pagination" style="display:flex;align-items:center;justify-content:space-between;padding:14px 6px 4px;flex-wrap:wrap;gap:8px"></div>
  </div>

  <!-- Bulk bar -->
  <div id="dealer-bulk-bar" style="display:none;position:fixed;bottom:28px;left:50%;transform:translateX(-50%);
    background:var(--bg-card);border:1px solid var(--accent);border-radius:12px;padding:12px 24px;
    z-index:500;box-shadow:0 8px 32px rgba(0,0,0,.5);align-items:center;gap:16px;min-width:380px">
    <span id="dealer-sel-count" style="color:var(--accent);font-weight:600;font-size:14px"></span>
    <div style="flex:1"></div>
    <button class="btn btn-success" id="btn-dealer-bulk-export"><i class="fas fa-file-excel"></i> Export XLSX</button>
    <button class="btn btn-danger"  id="btn-dealer-bulk-delete"><i class="fas fa-trash"></i> Delete Selected</button>
    <button class="btn btn-secondary btn-sm" id="btn-dealer-bulk-cancel"><i class="fas fa-xmark"></i></button>
  </div>
  </div>`;
});

// ---- Dealer state ----
let _dealerCouriers = [], _dealerDivs = [];
let _dlPage = 1, _dlPageSize = 25, _dlTotal = 0, _dlSearch = '';
let _dlSelectedIds = new Set(); // tracks selection across pages

window._pageBinders['dealers'] = async () => {
  _dlPage = 1; _dlSearch = ''; _dlSelectedIds.clear();
  try {
    [_dealerCouriers, _dealerDivs] = await Promise.all([
      api('/api/couriers'),
      api('/api/divisions?active=1')
    ]);
  } catch(_){}
  await loadDealers(1);

  // Server-side search with debounce
  let _dlSearchTimer;
  $('#dealer-search').oninput = () => {
    clearTimeout(_dlSearchTimer);
    _dlSearchTimer = setTimeout(() => {
      _dlSearch = $('#dealer-search').value.trim();
      _dlSelectedIds.clear();
      loadDealers(1);
    }, 350);
  };

  // Select ALL across pages
  $('#dealer-select-all').onchange = async (e) => {
    if (e.target.checked) {
      e.target.disabled = true;
      showToast('Selecting all dealers...', 'info');
      try {
        const params = new URLSearchParams();
        if (_dlSearch) params.set('search', _dlSearch);
        const all = await api('/api/dealers?' + params.toString());
        all.forEach(d => _dlSelectedIds.add(d.DealerID));
        $$('.dl-row-chk').forEach(c => c.checked = true);
      } catch(_){}
      e.target.disabled = false;
    } else {
      _dlSelectedIds.clear();
      $$('.dl-row-chk').forEach(c => c.checked = false);
    }
    updateDealerBulkBar();
  };

  $('#btn-add-dealer').onclick = () => showAddDealerModal();
  $('#btn-dealer-bulk-export').onclick = () => bulkExportDealers();
  $('#btn-dealer-bulk-delete').onclick  = () => bulkDeleteDealers();
  $('#btn-dealer-bulk-cancel').onclick  = () => {
    _dlSelectedIds.clear();
    $$('.dl-row-chk').forEach(c => c.checked = false);
    const sa = $('#dealer-select-all'); if (sa) { sa.checked = false; sa.indeterminate = false; }
    updateDealerBulkBar();
  };
};

async function loadDealers(page) {
  if (page !== undefined) _dlPage = page;
  const tbody = $('#tbl-dealer-body'); if (!tbody) return;
  tbody.innerHTML = `<tr class="empty-row"><td colspan="23"><div class="spinner" style="margin:0 auto"></div></td></tr>`;

  try {
    const params = new URLSearchParams({ page: _dlPage, pageSize: _dlPageSize });
    if (_dlSearch) params.set('search', _dlSearch);
    const result = await api('/api/dealers?' + params.toString());
    _dlTotal = result.total;
    const data  = result.data;

    if (!data.length) {
      tbody.innerHTML = `<tr class="empty-row"><td colspan="23">No dealers found.</td></tr>`;
      renderDealerPagination();
      return;
    }

    const sticky = `position:sticky;background:var(--bg-card);z-index:1`;
    const statusBadge = s => s === 'Y'
      ? `<span style="background:rgba(22,163,74,.15);color:#16a34a;border-radius:20px;padding:2px 10px;font-size:11.5px;font-weight:600">Active</span>`
      : `<span style="background:rgba(220,38,38,.12);color:#dc2626;border-radius:20px;padding:2px 10px;font-size:11.5px;font-weight:600">Inactive</span>`;

    tbody.innerHTML = data.map(d => `
      <tr data-id="${d.DealerID}" class="dl-row">
        <td style="${sticky};left:0;text-align:center">
          <input type="checkbox" class="dl-row-chk" data-id="${d.DealerID}"
            style="width:16px;height:16px;cursor:pointer;accent-color:var(--accent)"
            ${_dlSelectedIds.has(d.DealerID) ? 'checked' : ''}>
        </td>
        <td style="${sticky};left:42px;color:var(--text-secondary);font-size:13px">${d.DealerID}</td>
        <td style="${sticky};left:122px">
          <span class="dl-edit-cell" data-id="${d.DealerID}"
            style="cursor:pointer;text-decoration:underline dotted;text-underline-offset:3px" title="Click to edit">
            ${d.ContactPersonName||'-'}</span></td>
        <td style="${sticky};left:292px">
          <span class="dl-edit-cell" data-id="${d.DealerID}"
            style="cursor:pointer;text-decoration:underline dotted;text-underline-offset:3px;font-weight:600" title="Click to edit">
            ${d.DealerCompanyName||'-'}</span></td>
        <td style="font-size:13px">${d.Addr1||''}</td>
        <td style="font-size:13px">${d.Addr2||''}</td>
        <td style="font-size:13px">${d.Addr3||''}</td>
        <td>${d.Mobile||'-'}</td>
        <td style="font-size:12px">${d.GST||'-'}</td>
        <td style="font-size:12px">${d.PlaceOfSalesPromotion||'-'}</td>
        <td><span style="background:var(--accent-soft);color:var(--accent);border-radius:20px;padding:2px 8px;font-size:12px">${d.State||'-'}</span></td>
        <td>${d.City||'-'}</td>
        <td>${d.Pin||'-'}</td>
        <td>${d.TelNo||'-'}</td>
        <td style="font-size:12px">${d.Email||'-'}</td>
        <td>${d.DealerType||'-'}</td>
        <td style="font-size:12px">${d.PAN||'-'}</td>
        <td style="font-size:12px">${d.AadharNo||'-'}</td>
        <td>${d.BankName||'-'}</td>
        <td style="font-size:12px">${d.BankAccNo||'-'}</td>
        <td style="font-size:12px">${d.IFSCCode||'-'}</td>
        <td>${statusBadge(d.Status)}</td>
        <td style="${sticky};right:0;text-align:center">
          <button class="btn btn-danger btn-sm" onclick="deleteDealer(${d.DealerID})" title="Delete"><i class="fas fa-trash"></i></button>
        </td>
      </tr>`).join('');

    // Bind row checkboxes
    $$('.dl-row-chk').forEach(chk => {
      chk.onchange = () => {
        const id = parseInt(chk.dataset.id);
        if (chk.checked) _dlSelectedIds.add(id);
        else _dlSelectedIds.delete(id);
        syncDealerSelectAll(data);
        updateDealerBulkBar();
      };
    });

    // Bind edit cells
    $$('.dl-edit-cell').forEach(cell => {
      cell.onclick = () => {
        const row = data.find(d => d.DealerID === parseInt(cell.dataset.id));
        if (row) showEditDealerModal(row);
      };
    });

    renderDealerPagination();
    syncDealerSelectAll(data);
    updateDealerBulkBar();
  } catch(e) {
    tbody.innerHTML = `<tr class="empty-row"><td colspan="23" style="color:var(--danger)"><i class="fas fa-circle-xmark"></i> Failed: ${e.message}</td></tr>`;
  }
}

function renderDealerPagination() {
  const container = $('#dealer-pagination'); if (!container) return;
  const totalPages = Math.ceil(_dlTotal / _dlPageSize);
  const from = Math.min((_dlPage - 1) * _dlPageSize + 1, _dlTotal);
  const to   = Math.min(_dlPage * _dlPageSize, _dlTotal);

  let html = `<span style="font-size:13px;color:var(--text-secondary)">
    Showing <b>${from}&#8211;${to}</b> of <b>${_dlTotal}</b> dealers</span>
    <div style="display:flex;gap:4px;align-items:center">`;

  const pgBtn = (label, pg, disabled) =>
    `<button class="btn btn-sm btn-secondary" ${disabled?'disabled':''} onclick="loadDealers(${pg})" style="min-width:32px">${label}</button>`;

  html += pgBtn('<i class="fas fa-angles-left"></i>', 1, _dlPage <= 1);
  html += pgBtn('<i class="fas fa-angle-left"></i>',  _dlPage - 1, _dlPage <= 1);

  const start = Math.max(1, _dlPage - 2);
  const end   = Math.min(totalPages, start + 4);
  for (let p = start; p <= end; p++) {
    html += `<button class="btn btn-sm ${p === _dlPage ? 'btn-primary' : 'btn-secondary'}"
      onclick="loadDealers(${p})" style="min-width:36px">${p}</button>`;
  }

  html += pgBtn('<i class="fas fa-angle-right"></i>',  _dlPage + 1, _dlPage >= totalPages);
  html += pgBtn('<i class="fas fa-angles-right"></i>', totalPages,  _dlPage >= totalPages);
  html += '</div>';
  container.innerHTML = html;
}

function syncDealerSelectAll(currentData) {
  const sa = $('#dealer-select-all'); if (!sa) return;
  const currentIds = (currentData || []).map(d => d.DealerID);
  const allSel  = currentIds.length > 0 && currentIds.every(id => _dlSelectedIds.has(id));
  const someSel = currentIds.some(id => _dlSelectedIds.has(id));
  sa.checked = allSel;
  sa.indeterminate = someSel && !allSel;
}

function updateDealerBulkBar() {
  const n = _dlSelectedIds.size;
  const bar = $('#dealer-bulk-bar'); if (!bar) return;
  if (n > 0) { bar.style.display = 'flex'; $('#dealer-sel-count').textContent = `${n} dealer${n > 1 ? 's' : ''} selected`; }
  else { bar.style.display = 'none'; }
}

window.deleteDealer = async (id) => {
  if (!await confirm(`Delete Dealer #${id}? This cannot be undone.`)) return;
  try {
    await api(`/api/dealers/${id}`, { method:'DELETE' });
    _dlSelectedIds.delete(id);
    showToast('Dealer deleted!','success');
    await loadDealers();
    updateDealerBulkBar();
  } catch(e) { showToast(e.message,'error'); }
};

async function bulkDeleteDealers() {
  const ids = [..._dlSelectedIds];
  if (!ids.length) return;
  if (!await confirm(`Delete ${ids.length} dealer(s)? This cannot be undone.`)) return;
  try {
    await api('/api/dealers/bulk-delete', { method:'POST', body:{ids} });
    showToast(`${ids.length} dealer(s) deleted!`,'success');
    _dlSelectedIds.clear();
    const sa = $('#dealer-select-all'); if (sa) { sa.checked = false; sa.indeterminate = false; }
    await loadDealers(1);
    updateDealerBulkBar();
  } catch(e) { showToast(e.message,'error'); }
}

async function bulkExportDealers() {
  const ids = [..._dlSelectedIds];
  try {
    const res = await fetch('/api/dealers/export-xlsx', {
      method:'POST', headers:{'Content-Type':'application/json'},
      credentials:'include', body:JSON.stringify({ ids })
    });
    if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dealer_master_${new Date().toISOString().split('T')[0]}.xlsx`;
    a.click(); URL.revokeObjectURL(url);
    showToast(`Exported ${ids.length || 'all'} dealer(s) to XLSX!`,'success');
  } catch(e) { showToast('Export failed: '+e.message,'error'); }
}

function _dlModalBody(rec = {}) {
  const si = _dlInStyle(), ss = _dlSelStyle();
  return `
    <div class="form-field" style="margin-bottom:12px">
      <label>Dealer ID <span style="color:var(--text-muted);font-size:11px">(auto)</span></label>
      <input type="text" value="${rec.DealerID||'~auto'}" readonly ${si} style="opacity:0.6;cursor:not-allowed;font-style:italic;background:var(--bg-dark);border:1px dashed var(--border);border-radius:6px;padding:9px 12px;color:var(--text-muted);width:100%"/>
    </div>
    <div class="form-row cols-2" style="gap:12px;margin-bottom:12px">
      <div class="form-field"><label>Division <span style="color:var(--danger)">*</span></label>
        <select id="dl-div" ${ss}>${_dlDivOpts(_dealerDivs, rec.DivisionId)}</select></div>
      <div class="form-field"><label>Contact Person <span style="color:var(--danger)">*</span></label>
        <input type="text" id="dl-cp" value="${rec.ContactPersonName||''}" ${si}/></div>
    </div>
    <div class="form-row cols-2" style="gap:12px;margin-bottom:12px">
      <div class="form-field"><label>Mob.</label><input type="text" id="dl-mob" value="${rec.Mobile||''}" ${si}/></div>
      <div class="form-field"><label>Tel No</label><input type="text" id="dl-tel" value="${rec.TelNo||''}" ${si}/></div>
    </div>
    <div class="form-row cols-3" style="gap:12px;margin-bottom:12px">
      <div class="form-field"><label>Address 1</label><input type="text" id="dl-a1" value="${rec.Addr1||''}" ${si}/></div>
      <div class="form-field"><label>Address 2</label><input type="text" id="dl-a2" value="${rec.Addr2||''}" ${si}/></div>
      <div class="form-field"><label>Address 3</label><input type="text" id="dl-a3" value="${rec.Addr3||''}" ${si}/></div>
    </div>
    <div class="form-row cols-3" style="gap:12px;margin-bottom:12px">
      <div class="form-field"><label>State</label><select id="dl-state" ${ss}>${_dlStateOpts(rec.State)}</select></div>
      <div class="form-field"><label>City</label><select id="dl-city" ${ss}>${_dlCityOpts(rec.City)}</select></div>
      <div class="form-field"><label>Pin</label><input type="text" id="dl-pin" value="${rec.Pin||''}" ${si}/></div>
    </div>
    <div class="form-row cols-2" style="gap:12px;margin-bottom:12px">
      <div class="form-field"><label>Dealer Type</label><input type="text" id="dl-type" value="${rec.DealerType||''}" ${si}/></div>
      <div class="form-field"><label>Company Name <span style="color:var(--danger)">*</span></label>
        <input type="text" id="dl-company" value="${rec.DealerCompanyName||''}" ${si}/></div>
    </div>
    <div class="form-row cols-2" style="gap:12px;margin-bottom:12px">
      <div class="form-field"><label>Dist. Code <span style="color:var(--danger)">*</span></label>
        <input type="text" id="dl-dist" value="${rec.DistCode||''}" ${si}/></div>
      <div class="form-field"><label>Email</label><input type="email" id="dl-email" value="${rec.Email||''}" ${si}/></div>
    </div>
    <div class="form-row cols-3" style="gap:12px;margin-bottom:12px">
      <div class="form-field"><label>PAN</label><input type="text" id="dl-pan" value="${rec.PAN||''}" ${si}/></div>
      <div class="form-field"><label>Aadhar No</label><input type="text" id="dl-aadhar" value="${rec.AadharNo||''}" ${si}/></div>
      <div class="form-field"><label>GST No</label><input type="text" id="dl-gst" value="${rec.GST||''}" ${si}/></div>
    </div>
    <div class="form-field" style="margin-bottom:12px">
      <label>Place of Sales Promotion</label><input type="text" id="dl-place" value="${rec.PlaceOfSalesPromotion||''}" ${si}/>
    </div>
    <div class="form-row cols-3" style="gap:12px;margin-bottom:12px">
      <div class="form-field"><label>Bank Name</label><input type="text" id="dl-bank" value="${rec.BankName||''}" ${si}/></div>
      <div class="form-field"><label>Bank Acc No</label><input type="text" id="dl-bankac" value="${rec.BankAccNo||''}" ${si}/></div>
      <div class="form-field"><label>IFSC Code</label><input type="text" id="dl-ifsc" value="${rec.IFSCCode||''}" ${si}/></div>
    </div>
    <div class="form-field">
      <label>Courier Name</label>
      <select id="dl-courier" ${ss}>${_dlCourierOpts(_dealerCouriers, rec.CourierId)}</select>
    </div>`;
}
function _collectDlForm(ov) {
  return {
    DivisionId: ov.querySelector('#dl-div').value || null,
    ContactPersonName: ov.querySelector('#dl-cp').value.trim(),
    Mobile: ov.querySelector('#dl-mob').value,
    TelNo: ov.querySelector('#dl-tel').value,
    Addr1: ov.querySelector('#dl-a1').value,
    Addr2: ov.querySelector('#dl-a2').value,
    Addr3: ov.querySelector('#dl-a3').value,
    State: ov.querySelector('#dl-state').value,
    City: ov.querySelector('#dl-city').value,
    Pin: ov.querySelector('#dl-pin').value,
    DealerType: ov.querySelector('#dl-type').value,
    DealerCompanyName: ov.querySelector('#dl-company').value.trim(),
    DistCode: ov.querySelector('#dl-dist').value.trim(),
    Email: ov.querySelector('#dl-email').value,
    PAN: ov.querySelector('#dl-pan').value,
    AadharNo: ov.querySelector('#dl-aadhar').value,
    GST: ov.querySelector('#dl-gst').value,
    PlaceOfSalesPromotion: ov.querySelector('#dl-place').value,
    BankName: ov.querySelector('#dl-bank').value,
    BankAccNo: ov.querySelector('#dl-bankac').value,
    IFSCCode: ov.querySelector('#dl-ifsc').value,
    CourierId: ov.querySelector('#dl-courier').value || null,
  };
}

async function showAddDealerModal() {
  const ov = document.createElement('div');
  ov.className = 'modal-overlay';
  ov.innerHTML = `
    <div class="modal" style="max-width:700px;animation:slideUp 0.2s ease">
      <div class="modal-header">
        <h3><i class="fas fa-plus-circle"></i> Add Dealer</h3>
        <button class="btn-close-modal" onclick="this.closest('.modal-overlay').remove()"><i class="fas fa-xmark"></i></button>
      </div>
      <div class="modal-body" style="max-height:65vh;overflow-y:auto">${_dlModalBody()}</div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
        <button class="btn btn-primary" id="btn-dl-add-save"><i class="fas fa-user-plus"></i> Add Dealer</button>
      </div>
    </div>`;
  document.body.appendChild(ov);
  ov.onclick = e => { if (e.target === ov) ov.remove(); };
  ov.querySelector('#btn-dl-add-save').onclick = async () => {
    const b = _collectDlForm(ov);
    if (!b.ContactPersonName) return showToast('Contact Person is required', 'error');
    if (!b.DealerCompanyName) return showToast('Company Name is required', 'error');
    if (!b.DistCode) return showToast('Dist. Code is required', 'error');
    if (!b.DivisionId) return showToast('Division is required', 'error');
    try {
      await api('/api/dealers', { method:'POST', body: b });
      ov.remove(); showToast('Dealer added successfully!', 'success'); await loadDealers();
    } catch(e) { showToast(e.message, 'error'); }
  };
}

function showEditDealerModal(rec) {
  const existing = $('#dl-edit-modal'); if (existing) existing.remove();
  const ov = document.createElement('div');
  ov.className = 'modal-overlay'; ov.id = 'dl-edit-modal';
  ov.innerHTML = `
    <div class="modal" style="max-width:700px;animation:slideUp 0.2s ease">
      <div class="modal-header">
        <h3><i class="fas fa-pen-to-square"></i> Edit Dealer #${rec.DealerID}</h3>
        <button class="btn-close-modal" onclick="document.getElementById('dl-edit-modal').remove()"><i class="fas fa-xmark"></i></button>
      </div>
      <div class="modal-body" style="max-height:65vh;overflow-y:auto">${_dlModalBody(rec)}</div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="document.getElementById('dl-edit-modal').remove()">Cancel</button>
        <button class="btn btn-primary" id="btn-dl-edit-save"><i class="fas fa-floppy-disk"></i> Save</button>
      </div>
    </div>`;
  document.body.appendChild(ov);
  ov.onclick = e => { if (e.target === ov) ov.remove(); };
  ov.querySelector('#btn-dl-edit-save').onclick = async () => {
    const b = _collectDlForm(ov);
    if (!b.ContactPersonName) return showToast('Contact Person is required', 'error');
    if (!b.DealerCompanyName) return showToast('Company Name is required', 'error');
    try {
      await api(`/api/dealers/${rec.DealerID}`, { method:'PUT', body: b });
      ov.remove(); showToast('Dealer updated!', 'success'); await loadDealers();
    } catch(e) { showToast(e.message, 'error'); }
  };
}

// ======== USER MASTER (Full-Featured) ========
registerPage('user-master', () => {
  return `${pageHeader('User Master', 'fa-users-gear', 'Masters / User Master',
    `<button class="btn btn-primary" id="btn-add-user"><i class="fas fa-plus"></i> Add New</button>`)}
  <div class="card">
    <div class="search-bar">
      <div class="search-input-wrap"><i class="fas fa-search"></i>
        <input type="text" id="um-search" placeholder="Search user ID, employee, email...">
      </div>
    </div>
    <div class="table-wrapper">
      <table id="tbl-um-main">
        <thead><tr>
          <th style="width:42px;text-align:center">
            <input type="checkbox" id="um-select-all"
              style="width:16px;height:16px;cursor:pointer;accent-color:var(--accent)">
          </th>
          <th style="width:75px">User ID</th>
          <th style="width:110px">Employee ID</th>
          <th>Email ID</th>
          <th style="width:140px">Mobile No.</th>
          <th style="width:90px;text-align:center">Status</th>
          <th style="width:90px;text-align:center">Actions</th>
        </tr></thead>
        <tbody id="tbl-um-body">
          <tr class="empty-row"><td colspan="7"><div class="spinner" style="margin:0 auto"></div></td></tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- Bulk bar -->
  <div id="um-bulk-bar" style="display:none;position:fixed;bottom:28px;left:50%;transform:translateX(-50%);
    background:var(--bg-card);border:1px solid var(--accent);border-radius:12px;padding:12px 24px;
    z-index:500;box-shadow:0 8px 32px rgba(0,0,0,.5);align-items:center;gap:16px;min-width:380px">
    <span id="um-sel-count" style="color:var(--accent);font-weight:600;font-size:14px"></span>
    <div style="flex:1"></div>
    <button class="btn btn-success" id="btn-um-bulk-export"><i class="fas fa-file-excel"></i> Export XLSX</button>
    <button class="btn btn-danger"  id="btn-um-bulk-delete"><i class="fas fa-trash"></i> Delete Selected</button>
    <button class="btn btn-secondary btn-sm" id="btn-um-bulk-cancel"><i class="fas fa-xmark"></i></button>
  </div>
  </div>`;
});

window._pageBinders['user-master'] = async () => {
  await loadUsers();
  $('#um-search').oninput = () => {
    const q = ($('#um-search')?.value || '').toLowerCase();
    $$('#tbl-um-body tr:not(.empty-row)').forEach(tr => {
      tr.style.display = !q || tr.textContent.toLowerCase().includes(q) ? '' : 'none';
    });
  };
  $('#um-select-all').onchange = e => {
    $$('.um-row-chk').forEach(c => { c.checked = e.target.checked; }); updateUmBulkBar();
  };
  $('#btn-add-user').onclick = () => showAddUserModal();
  $('#btn-um-bulk-cancel').onclick = () => {
    $$('.um-row-chk').forEach(c => c.checked = false);
    $('#um-select-all').checked = false; updateUmBulkBar();
  };
  $('#btn-um-bulk-export').onclick = () => bulkExportUsers();
  $('#btn-um-bulk-delete').onclick  = () => bulkDeleteUsers();
};

function syncUmSelectAll() {
  const all = $$('.um-row-chk'), checked = all.filter(c => c.checked);
  const sa = $('#um-select-all'); if (!sa) return;
  sa.checked = all.length > 0 && checked.length === all.length;
  sa.indeterminate = checked.length > 0 && checked.length < all.length;
}
function updateUmBulkBar() {
  const checked = $$('.um-row-chk:checked');
  const bar = $('#um-bulk-bar'); if (!bar) return;
  if (checked.length > 0) {
    bar.style.display = 'flex';
    $('#um-sel-count').textContent = `${checked.length} row${checked.length > 1 ? 's' : ''} selected`;
  } else { bar.style.display = 'none'; }
}

async function loadUsers() {
  const tbody = $('#tbl-um-body'); if (!tbody) return;
  tbody.innerHTML = `<tr class="empty-row"><td colspan="7"><div class="spinner" style="margin:0 auto"></div></td></tr>`;
  let data;
  try { data = await api('/api/users'); }
  catch (e) {
    tbody.innerHTML = `<tr class="empty-row"><td colspan="7" style="color:var(--danger)">
      <i class="fas fa-circle-xmark"></i> Failed: ${e.message}</td></tr>`;
    return;
  }
  if (!data.length) { tbody.innerHTML = `<tr class="empty-row"><td colspan="7">No users found.</td></tr>`; return; }

  const statusBadge = s => s === 'Y'
    ? `<span class="badge badge-success">Active</span>`
    : `<span class="badge badge-danger">Inactive</span>`;

  tbody.innerHTML = data.map(d => `
    <tr data-id="${d.UserID}" class="um-row">
      <td style="text-align:center">
        <input type="checkbox" class="um-row-chk" data-id="${d.UserID}"
          style="width:16px;height:16px;cursor:pointer;accent-color:var(--accent)">
      </td>
      <td style="color:var(--text-secondary);font-size:13px">${d.UserID}</td>
      <td>
        <span class="um-edit-cell" data-id="${d.UserID}"
          style="cursor:pointer;text-decoration:underline dotted;text-underline-offset:3px;font-weight:600"
          title="Click to edit">${d.EmployeeID || '-'}</span>
      </td>
      <td style="font-size:13px">${d.EmailId || '-'}</td>
      <td style="font-size:13px;font-family:monospace">${d.MobileNo || '-'}</td>
      <td style="text-align:center">${statusBadge(d.Status)}</td>
      <td style="text-align:center">
        <button class="btn btn-danger btn-sm" onclick="deleteUser(${d.UserID})" title="Delete">
          <i class="fas fa-trash"></i></button>
      </td>
    </tr>`).join('');

  $$('.um-row-chk').forEach(chk => {
    chk.onchange = () => { updateUmBulkBar(); syncUmSelectAll(); };
  });
  $$('.um-edit-cell').forEach(cell => {
    cell.onclick = () => {
      const row = data.find(d => d.UserID === parseInt(cell.dataset.id));
      if (row) showEditUserModal(row);
    };
  });
}

/* ---- helpers ---- */
function _umIS() {
  return `style="background:var(--bg-dark);border:1px solid var(--border);border-radius:6px;
          padding:8px 12px;color:var(--text-primary);width:100%;font-size:13.5px"`;
}
function _umSS() {
  return `style="background:var(--bg-dark);border:1px solid var(--border);border-radius:6px;
          padding:8px 12px;color:var(--text-primary);width:100%;font-size:13.5px;cursor:pointer"`;
}

async function showAddUserModal() {
  const si = _umIS();
  const ov = document.createElement('div');
  ov.className = 'modal-overlay';
  ov.innerHTML = `
    <div class="modal" style="max-width:520px;animation:slideUp 0.2s ease">
      <div class="modal-header">
        <h3><i class="fas fa-user-plus"></i> Add User</h3>
        <button class="btn-close-modal" onclick="this.closest('.modal-overlay').remove()">
          <i class="fas fa-xmark"></i></button>
      </div>
      <div class="modal-body">
        <div class="form-field" style="margin-bottom:14px">
          <label>User ID <span style="color:var(--text-muted);font-size:11px">(auto)</span></label>
          <input type="text" value="~auto" readonly
            style="background:var(--bg-dark);border:1px dashed var(--border);border-radius:6px;
                   padding:8px 12px;color:var(--text-muted);width:100%;cursor:not-allowed;opacity:0.65;font-style:italic"/>
        </div>
        <div class="form-row cols-2" style="gap:12px;margin-bottom:12px">
          <div class="form-field"><label>Employee ID <span style="color:var(--danger)">*</span></label>
            <input type="text" id="um-a-empid" ${si}/></div>
          <div class="form-field"><label>Username <span style="color:var(--danger)">*</span></label>
            <input type="text" id="um-a-uname" ${si}/></div>
        </div>
        <div class="form-row cols-2" style="gap:12px;margin-bottom:4px">
          <div class="form-field"><label>Mobile No.</label>
            <input type="text" id="um-a-mob" ${si}/></div>
          <div class="form-field"><label>Email ID</label>
            <input type="email" id="um-a-email" ${si}/></div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
        <button class="btn btn-primary" id="btn-um-add-save">
          <i class="fas fa-user-plus"></i> Add User</button>
      </div>
    </div>`;
  document.body.appendChild(ov);
  ov.onclick = e => { if (e.target === ov) ov.remove(); };
  ov.querySelector('#btn-um-add-save').onclick = async () => {
    const b = {
      EmployeeID: ov.querySelector('#um-a-empid').value.trim(),
      UserName:   ov.querySelector('#um-a-uname').value.trim(),
      MobileNo:   ov.querySelector('#um-a-mob').value.trim(),
      EmailId:    ov.querySelector('#um-a-email').value.trim()
    };
    if (!b.EmployeeID) return showToast('Employee ID is required', 'error');
    if (!b.UserName)   return showToast('Username is required', 'error');
    try {
      await api('/api/users', { method: 'POST', body: b });
      ov.remove(); showToast('User added!', 'success'); await loadUsers();
    } catch (e) { showToast(e.message, 'error'); }
  };
}

function showEditUserModal(rec) {
  const existing = $('#um-edit-modal'); if (existing) existing.remove();
  const si = _umIS(), ss = _umSS();
  const ov = document.createElement('div');
  ov.className = 'modal-overlay'; ov.id = 'um-edit-modal';
  ov.innerHTML = `
    <div class="modal" style="max-width:520px;animation:slideUp 0.2s ease">
      <div class="modal-header">
        <h3><i class="fas fa-pen-to-square"></i> Edit User #${rec.UserID}</h3>
        <button class="btn-close-modal" onclick="document.getElementById('um-edit-modal').remove()">
          <i class="fas fa-xmark"></i></button>
      </div>
      <div class="modal-body">
        <div class="form-field" style="margin-bottom:14px">
          <label>User ID <span style="color:var(--text-muted);font-size:11px">(auto)</span></label>
          <input type="text" value="${rec.UserID}" readonly
            style="background:var(--bg-dark);border:1px dashed var(--border);border-radius:6px;
                   padding:8px 12px;color:var(--text-muted);width:100%;cursor:not-allowed;opacity:0.65;font-style:italic"/>
        </div>
        <div class="form-row cols-2" style="gap:12px;margin-bottom:12px">
          <div class="form-field"><label>Employee ID</label>
            <input type="text" id="um-e-empid" value="${rec.EmployeeID||''}" ${si}/></div>
          <div class="form-field"><label>Username</label>
            <input type="text" id="um-e-uname" value="${rec.UserName||''}" ${si}/></div>
        </div>
        <div class="form-row cols-2" style="gap:12px;margin-bottom:12px">
          <div class="form-field"><label>Mobile No.</label>
            <input type="text" id="um-e-mob" value="${rec.MobileNo||''}" ${si}/></div>
          <div class="form-field"><label>Email ID</label>
            <input type="email" id="um-e-email" value="${rec.EmailId||''}" ${si}/></div>
        </div>
        <div class="form-field" style="margin-bottom:4px">
          <label>Status</label>
          <select id="um-e-status" ${ss}>
            <option value="Y" ${rec.Status==='Y'?'selected':''}>Active</option>
            <option value="N" ${rec.Status==='N'?'selected':''}>Inactive</option>
          </select>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="document.getElementById('um-edit-modal').remove()">Cancel</button>
        <button class="btn btn-primary" id="btn-um-edit-save">
          <i class="fas fa-floppy-disk"></i> Save</button>
      </div>
    </div>`;
  document.body.appendChild(ov);
  ov.onclick = e => { if (e.target === ov) ov.remove(); };
  ov.querySelector('#btn-um-edit-save').onclick = async () => {
    const b = {
      EmployeeID: ov.querySelector('#um-e-empid').value.trim(),
      UserName:   ov.querySelector('#um-e-uname').value.trim(),
      MobileNo:   ov.querySelector('#um-e-mob').value.trim(),
      EmailId:    ov.querySelector('#um-e-email').value.trim(),
      Status:     ov.querySelector('#um-e-status').value
    };
    try {
      await api(`/api/users/${rec.UserID}`, { method: 'PUT', body: b });
      ov.remove(); showToast('User updated!', 'success'); await loadUsers();
    } catch (e) { showToast(e.message, 'error'); }
  };
}

window.deleteUser = async (id) => {
  if (!await confirm(`Delete User #${id}? This cannot be undone.`)) return;
  try {
    await api(`/api/users/${id}`, { method: 'DELETE' });
    showToast('User deleted!', 'success'); await loadUsers(); updateUmBulkBar();
  } catch (e) { showToast(e.message, 'error'); }
};

async function bulkDeleteUsers() {
  const ids = $$('.um-row-chk:checked').map(c => parseInt(c.dataset.id));
  if (!ids.length) return;
  if (!await confirm(`Delete ${ids.length} user(s)? This cannot be undone.`)) return;
  try {
    await api('/api/users/bulk-delete', { method: 'POST', body: { ids } });
    showToast(`${ids.length} user(s) deleted!`, 'success');
    $('#um-select-all').checked = false; await loadUsers(); updateUmBulkBar();
  } catch (e) { showToast(e.message, 'error'); }
}

async function bulkExportUsers() {
  const ids = $$('.um-row-chk:checked').map(c => parseInt(c.dataset.id));
  try {
    const res = await fetch('/api/users/export-xlsx', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      credentials: 'include', body: JSON.stringify({ ids })
    });
    if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `user_master_${new Date().toISOString().split('T')[0]}.xlsx`;
    a.click(); URL.revokeObjectURL(url);
    showToast(`Exported ${ids.length || 'all'} user(s)!`, 'success');
  } catch (e) { showToast('Export failed: ' + e.message, 'error'); }
}


// ======== LOGIN MASTER (Full-Featured) ========

const _LM_QUESTIONS = [
  'Your Favourite Color',
  'Your Last Name',
  'Your Mobile Number',
  'Your Favourite Cricketer',
  'Your State Name'
];

registerPage('login-master', () => {
  return `${pageHeader('Login Master', 'fa-key', 'Masters / Login Master',
    `<button class="btn btn-primary" id="btn-add-login"><i class="fas fa-plus"></i> Add New</button>`)}
  <div class="card">
    <div class="search-bar">
      <div class="search-input-wrap"><i class="fas fa-search"></i>
        <input type="text" id="lm-search" placeholder="Search login ID, name...">
      </div>
    </div>
    <div class="table-wrapper">
      <table id="tbl-lm-main">
        <thead><tr>
          <th style="width:42px;text-align:center">
            <input type="checkbox" id="lm-select-all"
              style="width:16px;height:16px;cursor:pointer;accent-color:var(--accent)">
          </th>
          <th style="width:65px">ID</th>
          <th style="width:160px">Login ID</th>
          <th style="width:140px">Password</th>
          <th style="width:160px">Name</th>
          <th>Security Question</th>
          <th style="width:110px;text-align:center">Actions</th>
        </tr></thead>
        <tbody id="tbl-lm-body">
          <tr class="empty-row"><td colspan="7"><div class="spinner" style="margin:0 auto"></div></td></tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- Bulk bar -->
  <div id="lm-bulk-bar" style="display:none;position:fixed;bottom:28px;left:50%;transform:translateX(-50%);
    background:var(--bg-card);border:1px solid var(--accent);border-radius:12px;padding:12px 24px;
    z-index:500;box-shadow:0 8px 32px rgba(0,0,0,.5);align-items:center;gap:16px;min-width:380px">
    <span id="lm-sel-count" style="color:var(--accent);font-weight:600;font-size:14px"></span>
    <div style="flex:1"></div>
    <button class="btn btn-success" id="btn-lm-bulk-export"><i class="fas fa-file-excel"></i> Export XLSX</button>
    <button class="btn btn-danger"  id="btn-lm-bulk-delete"><i class="fas fa-trash"></i> Delete Selected</button>
    <button class="btn btn-secondary btn-sm" id="btn-lm-bulk-cancel"><i class="fas fa-xmark"></i></button>
  </div>
  </div>`;
});

window._pageBinders['login-master'] = async () => {
  await loadLogins();
  $('#lm-search').oninput = () => {
    const q = ($('#lm-search')?.value || '').toLowerCase();
    $$('#tbl-lm-body tr:not(.empty-row)').forEach(tr => {
      tr.style.display = !q || tr.textContent.toLowerCase().includes(q) ? '' : 'none';
    });
  };
  $('#lm-select-all').onchange = e => {
    $$('.lm-row-chk').forEach(c => { c.checked = e.target.checked; }); updateLmBulkBar();
  };
  $('#btn-add-login').onclick = () => showAddLoginModal();
  $('#btn-lm-bulk-cancel').onclick = () => {
    $$('.lm-row-chk').forEach(c => c.checked = false);
    $('#lm-select-all').checked = false; updateLmBulkBar();
  };
  $('#btn-lm-bulk-export').onclick = () => bulkExportLogins();
  $('#btn-lm-bulk-delete').onclick  = () => bulkDeleteLogins();
};

function syncLmSelectAll() {
  const all = $$('.lm-row-chk'), checked = all.filter(c => c.checked);
  const sa = $('#lm-select-all'); if (!sa) return;
  sa.checked = all.length > 0 && checked.length === all.length;
  sa.indeterminate = checked.length > 0 && checked.length < all.length;
}
function updateLmBulkBar() {
  const checked = $$('.lm-row-chk:checked');
  const bar = $('#lm-bulk-bar'); if (!bar) return;
  if (checked.length > 0) {
    bar.style.display = 'flex';
    $('#lm-sel-count').textContent = `${checked.length} row${checked.length > 1 ? 's' : ''} selected`;
  } else { bar.style.display = 'none'; }
}

async function loadLogins() {
  const tbody = $('#tbl-lm-body'); if (!tbody) return;
  tbody.innerHTML = `<tr class="empty-row"><td colspan="7"><div class="spinner" style="margin:0 auto"></div></td></tr>`;
  let data;
  try { data = await api('/api/logins'); }
  catch (e) {
    tbody.innerHTML = `<tr class="empty-row"><td colspan="7" style="color:var(--danger)">
      <i class="fas fa-circle-xmark"></i> Failed: ${e.message}</td></tr>`;
    return;
  }
  if (!data.length) { tbody.innerHTML = `<tr class="empty-row"><td colspan="7">No login records found.</td></tr>`; return; }

  tbody.innerHTML = data.map(d => `
    <tr data-id="${d.ID}" class="lm-row">
      <td style="text-align:center">
        <input type="checkbox" class="lm-row-chk" data-id="${d.ID}"
          style="width:16px;height:16px;cursor:pointer;accent-color:var(--accent)">
      </td>
      <td style="color:var(--text-secondary);font-size:13px">${d.ID}</td>
      <td>
        <span class="lm-edit-cell" data-id="${d.ID}"
          style="cursor:pointer;text-decoration:underline dotted;text-underline-offset:3px;font-weight:600"
          title="Click to edit">${d.LoginID || '-'}</span>
      </td>
      <td>
        <span style="font-family:monospace;letter-spacing:3px;opacity:0.7">
          ${'&#8226;'.repeat(Math.min(8, (d.Password||'').length || 6))}
        </span>
      </td>
      <td>${d.Name || '-'}</td>
      <td style="font-size:12px;color:var(--text-secondary)">${d.SecurityQtn || '-'}</td>
      <td style="text-align:center">
        <div style="display:flex;gap:6px;justify-content:center">
          <button class="btn btn-danger btn-sm" onclick="deleteLogin(${d.ID})" title="Delete">
            <i class="fas fa-trash"></i></button>
          <button class="btn btn-warning btn-sm" onclick="showForgotPasswordModal('${(d.LoginID||'').replace(/'/g,"\\'")}', '${(d.SecurityQtn||'').replace(/'/g,"\\'")}', ${d.ID})"
            title="Forgot / Reset Password" style="color:#000">
            <i class="fas fa-key"></i></button>
        </div>
      </td>
    </tr>`).join('');

  $$('.lm-row-chk').forEach(chk => {
    chk.onchange = () => { updateLmBulkBar(); syncLmSelectAll(); };
  });
  $$('.lm-edit-cell').forEach(cell => {
    cell.onclick = () => {
      const row = data.find(d => d.ID === parseInt(cell.dataset.id));
      if (row) showEditLoginModal(row);
    };
  });
}

/* ---- helpers ---- */
function _lmIS() {
  return `style="background:var(--bg-dark);border:1px solid var(--border);border-radius:6px;
          padding:8px 12px;color:var(--text-primary);width:100%;font-size:13.5px"`;
}
function _lmSS() {
  return `style="background:var(--bg-dark);border:1px solid var(--border);border-radius:6px;
          padding:8px 12px;color:var(--text-primary);width:100%;font-size:13.5px;cursor:pointer"`;
}
function _lmQuestionOpts(sel = '') {
  return `<option value="">- Select Question -</option>` +
    _LM_QUESTIONS.map(q => `<option value="${q}" ${q === sel ? 'selected' : ''}>${q}</option>`).join('');
}
function _lmModalBody(rec = {}, isEdit = false) {
  const si = _lmIS(), ss = _lmSS();
  return `
    <div class="form-field" style="margin-bottom:14px">
      <label>ID <span style="color:var(--text-muted);font-size:11px">(auto)</span></label>
      <input type="text" value="${rec.ID || '~auto'}" readonly
        style="background:var(--bg-dark);border:1px dashed var(--border);border-radius:6px;
               padding:8px 12px;color:var(--text-muted);width:100%;cursor:not-allowed;opacity:0.65;font-style:italic"/>
    </div>
    <div class="form-row cols-2" style="gap:12px;margin-bottom:12px">
      <div class="form-field"><label>Login ID <span style="color:var(--danger)">*</span></label>
        <input type="text" id="lm-f-lid" value="${rec.LoginID||''}" ${si}/></div>
      <div class="form-field"><label>Password <span style="color:var(--danger)">*</span></label>
        <input type="password" id="lm-f-pwd" value="${isEdit ? (rec.Password||'') : ''}" ${si}
          placeholder="${isEdit ? 'Leave blank to keep current' : 'Enter password'}"/></div>
    </div>
    <div class="form-field" style="margin-bottom:12px">
      <label>Name</label>
      <input type="text" id="lm-f-name" value="${rec.Name||''}" ${si}/>
    </div>
    <div class="form-row cols-2" style="gap:12px;margin-bottom:4px">
      <div class="form-field"><label>Security Question</label>
        <select id="lm-f-sqtn" ${ss}>${_lmQuestionOpts(rec.SecurityQtn||'')}</select></div>
      <div class="form-field"><label>Answer</label>
        <input type="text" id="lm-f-ans" value="${rec.Answer||''}" ${si}/></div>
    </div>`;
}

async function showAddLoginModal() {
  const ov = document.createElement('div');
  ov.className = 'modal-overlay';
  ov.innerHTML = `
    <div class="modal" style="max-width:560px;animation:slideUp 0.2s ease">
      <div class="modal-header">
        <h3><i class="fas fa-plus-circle"></i> Add Login</h3>
        <button class="btn-close-modal" onclick="this.closest('.modal-overlay').remove()">
          <i class="fas fa-xmark"></i></button>
      </div>
      <div class="modal-body" style="max-height:65vh;overflow-y:auto">${_lmModalBody()}</div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
        <button class="btn btn-primary" id="btn-lm-add-save">
          <i class="fas fa-key"></i> Add Login</button>
      </div>
    </div>`;
  document.body.appendChild(ov);
  ov.onclick = e => { if (e.target === ov) ov.remove(); };
  ov.querySelector('#btn-lm-add-save').onclick = async () => {
    const b = {
      LoginID:     ov.querySelector('#lm-f-lid').value.trim(),
      Password:    ov.querySelector('#lm-f-pwd').value.trim(),
      Name:        ov.querySelector('#lm-f-name').value.trim(),
      SecurityQtn: ov.querySelector('#lm-f-sqtn').value,
      Answer:      ov.querySelector('#lm-f-ans').value.trim()
    };
    if (!b.LoginID)  return showToast('Login ID is required', 'error');
    if (!b.Password) return showToast('Password is required', 'error');
    try {
      await api('/api/logins', { method: 'POST', body: b });
      ov.remove(); showToast('Login added!', 'success'); await loadLogins();
    } catch (e) { showToast(e.message, 'error'); }
  };
}

function showEditLoginModal(rec) {
  const existing = $('#lm-edit-modal'); if (existing) existing.remove();
  const ov = document.createElement('div');
  ov.className = 'modal-overlay'; ov.id = 'lm-edit-modal';
  ov.innerHTML = `
    <div class="modal" style="max-width:560px;animation:slideUp 0.2s ease">
      <div class="modal-header">
        <h3><i class="fas fa-pen-to-square"></i> Edit Login #${rec.ID}</h3>
        <button class="btn-close-modal" onclick="document.getElementById('lm-edit-modal').remove()">
          <i class="fas fa-xmark"></i></button>
      </div>
      <div class="modal-body" style="max-height:65vh;overflow-y:auto">${_lmModalBody(rec, true)}</div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="document.getElementById('lm-edit-modal').remove()">Cancel</button>
        <button class="btn btn-primary" id="btn-lm-edit-save">
          <i class="fas fa-floppy-disk"></i> Save</button>
      </div>
    </div>`;
  document.body.appendChild(ov);
  ov.onclick = e => { if (e.target === ov) ov.remove(); };
  ov.querySelector('#btn-lm-edit-save').onclick = async () => {
    const pwd = ov.querySelector('#lm-f-pwd').value.trim();
    const b = {
      LoginID:     ov.querySelector('#lm-f-lid').value.trim(),
      Password:    pwd || rec.Password,
      Name:        ov.querySelector('#lm-f-name').value.trim(),
      SecurityQtn: ov.querySelector('#lm-f-sqtn').value,
      Answer:      ov.querySelector('#lm-f-ans').value.trim()
    };
    if (!b.LoginID) return showToast('Login ID is required', 'error');
    try {
      await api(`/api/logins/${rec.ID}`, { method: 'PUT', body: b });
      ov.remove(); showToast('Login updated!', 'success'); await loadLogins();
    } catch (e) { showToast(e.message, 'error'); }
  };
}

window.showForgotPasswordModal = (loginId = '', secQtn = '', rowId) => {
  const existing = $('#lm-forgot-modal'); if (existing) existing.remove();
  const si = _lmIS(), ss = _lmSS();
  let step = 1; // 1=validate, 2=new password
  const ov = document.createElement('div');
  ov.className = 'modal-overlay'; ov.id = 'lm-forgot-modal';
  ov.innerHTML = `
    <div class="modal" style="max-width:480px;animation:slideUp 0.2s ease">
      <div class="modal-header" style="background:linear-gradient(135deg,#b45309,#92400e)">
        <h3 style="color:#fef3c7"><i class="fas fa-unlock-keyhole"></i> Forgot / Reset Password</h3>
        <button class="btn-close-modal" onclick="document.getElementById('lm-forgot-modal').remove()">
          <i class="fas fa-xmark"></i></button>
      </div>
      <div class="modal-body">
        <!-- Step 1: Validate -->
        <div id="lm-fp-step1">
          <p style="color:var(--text-secondary);font-size:13px;margin-bottom:16px">
            Enter your Login ID, select the security question and provide the correct answer to reset your password.</p>
          <div class="form-field" style="margin-bottom:12px">
            <label>Login ID <span style="color:var(--danger)">*</span></label>
            <input type="text" id="lm-fp-lid" value="${loginId}" ${si}/>
          </div>
          <div class="form-field" style="margin-bottom:12px">
            <label>Security Question <span style="color:var(--danger)">*</span></label>
            <select id="lm-fp-sqtn" ${ss}>${_lmQuestionOpts(secQtn)}</select>
          </div>
          <div class="form-field" style="margin-bottom:4px">
            <label>Answer <span style="color:var(--danger)">*</span></label>
            <input type="text" id="lm-fp-ans" ${si} placeholder="Your answer"/>
          </div>
          <div id="lm-fp-err" style="color:var(--danger);font-size:12px;margin-top:8px;min-height:18px"></div>
        </div>
        <!-- Step 2: New Password (hidden initially) -->
        <div id="lm-fp-step2" style="display:none">
          <p style="color:var(--accent);font-size:13px;margin-bottom:16px">
            <i class="fas fa-circle-check"></i> Identity verified! Enter your new password below.</p>
          <div class="form-field" style="margin-bottom:12px">
            <label>New Password <span style="color:var(--danger)">*</span></label>
            <input type="password" id="lm-fp-newpwd" ${si} placeholder="Enter new password"/>
          </div>
          <div class="form-field" style="margin-bottom:4px">
            <label>Confirm New Password <span style="color:var(--danger)">*</span></label>
            <input type="password" id="lm-fp-cfmpwd" ${si} placeholder="Confirm new password"/>
          </div>
          <div id="lm-fp-err2" style="color:var(--danger);font-size:12px;margin-top:8px;min-height:18px"></div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="document.getElementById('lm-forgot-modal').remove()">Cancel</button>
        <button class="btn btn-warning" id="btn-lm-fp-verify" style="color:#000">
          <i class="fas fa-shield-halved"></i> Verify</button>
        <button class="btn btn-primary" id="btn-lm-fp-reset" style="display:none">
          <i class="fas fa-lock"></i> Reset Password</button>
      </div>
    </div>`;
  document.body.appendChild(ov);
  ov.onclick = e => { if (e.target === ov) ov.remove(); };

  // Step 1: Verify
  ov.querySelector('#btn-lm-fp-verify').onclick = async () => {
    const LoginID     = ov.querySelector('#lm-fp-lid').value.trim();
    const SecurityQtn = ov.querySelector('#lm-fp-sqtn').value;
    const Answer      = ov.querySelector('#lm-fp-ans').value.trim();
    const errEl       = ov.querySelector('#lm-fp-err');
    errEl.textContent = '';
    if (!LoginID)     return (errEl.textContent = 'Login ID is required.');
    if (!SecurityQtn) return (errEl.textContent = 'Select a security question.');
    if (!Answer)      return (errEl.textContent = 'Answer is required.');
    try {
      // Validate only (NewPassword empty = validate mode)
      const r = await api('/api/logins/forgot-password', {
        method: 'POST', body: { LoginID, SecurityQtn, Answer, NewPassword: '__VALIDATE_ONLY__' }
      });
      // If no error, proceed to step 2
      ov.querySelector('#lm-fp-step1').style.display = 'none';
      ov.querySelector('#lm-fp-step2').style.display = '';
      ov.querySelector('#btn-lm-fp-verify').style.display = 'none';
      ov.querySelector('#btn-lm-fp-reset').style.display  = '';
      ov.querySelector('#lm-fp-newpwd').focus();
    } catch (e) {
      errEl.textContent = e.message || 'Verification failed.';
    }
  };

  // Step 2: Reset
  ov.querySelector('#btn-lm-fp-reset').onclick = async () => {
    const LoginID     = ov.querySelector('#lm-fp-lid').value.trim();
    const SecurityQtn = ov.querySelector('#lm-fp-sqtn').value;
    const Answer      = ov.querySelector('#lm-fp-ans').value.trim();
    const NewPassword = ov.querySelector('#lm-fp-newpwd').value.trim();
    const CfmPassword = ov.querySelector('#lm-fp-cfmpwd').value.trim();
    const errEl       = ov.querySelector('#lm-fp-err2');
    errEl.textContent = '';
    if (!NewPassword)              return (errEl.textContent = 'Enter a new password.');
    if (NewPassword !== CfmPassword) return (errEl.textContent = 'Passwords do not match.');
    try {
      await api('/api/logins/forgot-password', {
        method: 'POST', body: { LoginID, SecurityQtn, Answer, NewPassword }
      });
      ov.remove();
      showToast('Password reset successfully!', 'success');
      await loadLogins();
    } catch (e) { errEl.textContent = e.message || 'Reset failed.'; }
  };
};

window.deleteLogin = async (id) => {
  if (!await confirm(`Delete Login #${id}? This cannot be undone.`)) return;
  try {
    await api(`/api/logins/${id}`, { method: 'DELETE' });
    showToast('Login deleted!', 'success'); await loadLogins(); updateLmBulkBar();
  } catch (e) { showToast(e.message, 'error'); }
};

async function bulkDeleteLogins() {
  const ids = $$('.lm-row-chk:checked').map(c => parseInt(c.dataset.id));
  if (!ids.length) return;
  if (!await confirm(`Delete ${ids.length} login record(s)? This cannot be undone.`)) return;
  try {
    await api('/api/logins/bulk-delete', { method: 'POST', body: { ids } });
    showToast(`${ids.length} login(s) deleted!`, 'success');
    $('#lm-select-all').checked = false; await loadLogins(); updateLmBulkBar();
  } catch (e) { showToast(e.message, 'error'); }
}

async function bulkExportLogins() {
  const ids = $$('.lm-row-chk:checked').map(c => parseInt(c.dataset.id));
  try {
    const res = await fetch('/api/logins/export-xlsx', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      credentials: 'include', body: JSON.stringify({ ids })
    });
    if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `login_master_${new Date().toISOString().split('T')[0]}.xlsx`;
    a.click(); URL.revokeObjectURL(url);
    showToast(`Exported ${ids.length || 'all'} record(s)!`, 'success');
  } catch (e) { showToast('Export failed: ' + e.message, 'error'); }
}




// -------- KIT MASTER --------
let _kitDivs = [], _kitItems = [];

registerPage('kit-master', () => {
  return `${pageHeader('Kit Master', 'fa-cubes', 'Masters / Kit Master',
    `<button class="btn btn-primary" id="btn-add-kit"><i class="fas fa-plus"></i> Add New</button>`)}
  <div class="card">
    <div class="search-bar">
      <div class="search-input-wrap"><i class="fas fa-search"></i>
        <input type="text" id="kit-search" placeholder="Search kit, division, item...">
      </div>
      <select id="kit-div-filter"
        style="background:var(--bg-dark);border:1px solid var(--border);color:var(--text-primary);
               padding:9px 14px;border-radius:6px;font-size:13.5px;cursor:pointer;min-width:180px">
        <option value="">All Divisions</option>
      </select>
    </div>
    <div class="table-wrapper">
      <table id="tbl-kit-main" style="min-width:820px">
        <thead><tr>
          <th style="width:42px;text-align:center">
            <input type="checkbox" id="kit-select-all"
              style="width:16px;height:16px;cursor:pointer;accent-color:var(--accent)">
          </th>
          <th style="width:75px">Kit ID</th>
          <th style="width:150px">Division</th>
          <th style="width:190px">Kit Name</th>
          <th>Items (Name &#215; Qty)</th>
          <th style="width:90px;text-align:center">Actions</th>
        </tr></thead>
        <tbody id="tbl-kit-body">
          <tr class="empty-row"><td colspan="6"><div class="spinner" style="margin:0 auto"></div></td></tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- Bulk bar -->
  <div id="kit-bulk-bar" style="display:none;position:fixed;bottom:28px;left:50%;transform:translateX(-50%);
    background:var(--bg-card);border:1px solid var(--accent);border-radius:12px;padding:12px 24px;
    z-index:500;box-shadow:0 8px 32px rgba(0,0,0,.5);align-items:center;gap:16px;min-width:380px">
    <span id="kit-sel-count" style="color:var(--accent);font-weight:600;font-size:14px"></span>
    <div style="flex:1"></div>
    <button class="btn btn-success" id="btn-kit-bulk-export"><i class="fas fa-file-excel"></i> Export XLSX</button>
    <button class="btn btn-danger"  id="btn-kit-bulk-delete"><i class="fas fa-trash"></i> Delete Selected</button>
    <button class="btn btn-secondary btn-sm" id="btn-kit-bulk-cancel"><i class="fas fa-xmark"></i></button>
  </div>
  </div>`;
});

window._pageBinders['kit-master'] = async () => {
  try {
    [_kitDivs, _kitItems] = await Promise.all([api('/api/divisions'), api('/api/items')]);
  } catch (_) {}

  await loadKits();

  const divFilter = $('#kit-div-filter');
  if (divFilter) {
    _kitDivs.forEach(d => {
      const o = document.createElement('option');
      o.value = d.DivisionId || d.DivisionID; o.textContent = d.DivisionName;
      divFilter.appendChild(o);
    });
    divFilter.onchange = applyKitFilters;
  }
  $('#kit-search').oninput = applyKitFilters;
  $('#btn-add-kit').onclick = () => showAddKitModal();
  $('#kit-select-all').onchange = e => {
    $$('.kit-row-chk').forEach(c => { c.checked = e.target.checked; }); updateKitBulkBar();
  };
  $('#btn-kit-bulk-cancel').onclick = () => {
    $$('.kit-row-chk').forEach(c => c.checked = false);
    $('#kit-select-all').checked = false; updateKitBulkBar();
  };
  $('#btn-kit-bulk-export').onclick = () => bulkExportKits();
  $('#btn-kit-bulk-delete').onclick  = () => bulkDeleteKits();
};

function applyKitFilters() {
  const q = ($('#kit-search')?.value || '').toLowerCase();
  const divId = $('#kit-div-filter')?.value || '';
  $$('#tbl-kit-body tr:not(.empty-row)').forEach(tr => {
    const matchText = !q || tr.textContent.toLowerCase().includes(q);
    const matchDiv  = !divId || tr.dataset.divId === divId;
    tr.style.display = (matchText && matchDiv) ? '' : 'none';
  });
}

async function loadKits() {
  const tbody = $('#tbl-kit-body'); if (!tbody) return;
  tbody.innerHTML = `<tr class="empty-row"><td colspan="6"><div class="spinner" style="margin:0 auto"></div></td></tr>`;
  let data;
  try { data = await api('/api/kit-details'); }
  catch (e) {
    tbody.innerHTML = `<tr class="empty-row"><td colspan="6" style="color:var(--danger)">
      <i class="fas fa-circle-xmark"></i> Failed: ${e.message}</td></tr>`;
    return;
  }
  if (!data.length) { tbody.innerHTML = `<tr class="empty-row"><td colspan="6">No kits found.</td></tr>`; return; }

  tbody.innerHTML = data.map(kit => {
    const itemPills = kit.Items && kit.Items.length
      ? kit.Items.map(it =>
          `<span style="display:inline-block;background:var(--bg-dark);border:1px solid var(--border);
            border-radius:20px;padding:2px 10px;font-size:12px;margin:2px 3px;white-space:nowrap">
            ${it.ItemName || '?'} &times; <strong>${it.ItemQty}</strong></span>`
        ).join('')
      : '<span style="color:var(--text-muted);font-size:12px">No items</span>';

    return `<tr data-id="${kit.KitID}" data-div-id="${kit.DivisionId||''}" class="kit-row">
      <td style="text-align:center">
        <input type="checkbox" class="kit-row-chk" data-id="${kit.KitID}"
          style="width:16px;height:16px;cursor:pointer;accent-color:var(--accent)">
      </td>
      <td style="color:var(--text-secondary);font-size:13px">${kit.KitID}</td>
      <td>
        <span style="background:var(--accent-soft);color:var(--accent);border-radius:20px;
          padding:3px 10px;font-size:12px;font-weight:600">
          ${kit.DivisionName || '<span style="color:var(--text-muted)">-</span>'}
        </span>
      </td>
      <td style="font-weight:600">
        <span class="kit-edit-cell" data-id="${kit.KitID}"
          style="cursor:pointer;text-decoration:underline dotted;text-underline-offset:3px"
          title="Click to edit">${kit.KitName || '-'}</span>
      </td>
      <td style="max-width:400px">${itemPills}</td>
      <td style="text-align:center">
        <button class="btn btn-danger btn-sm" onclick="deleteKit(${kit.KitID})" title="Delete Kit">
          <i class="fas fa-trash"></i>
        </button>
      </td>
    </tr>`;
  }).join('');

  $$('.kit-row-chk').forEach(chk => {
    chk.onchange = () => { updateKitBulkBar(); syncKitSelectAll(); };
  });
  $$('.kit-edit-cell').forEach(cell => {
    cell.onclick = () => {
      const kit = data.find(k => k.KitID === parseInt(cell.dataset.id));
      if (kit) showEditKitModal(kit);
    };
  });
}

function syncKitSelectAll() {
  const all = $$('.kit-row-chk'), checked = all.filter(c => c.checked);
  const sa = $('#kit-select-all'); if (!sa) return;
  sa.checked = all.length > 0 && checked.length === all.length;
  sa.indeterminate = checked.length > 0 && checked.length < all.length;
}
function updateKitBulkBar() {
  const checked = $$('.kit-row-chk:checked');
  const bar = $('#kit-bulk-bar'); if (!bar) return;
  if (checked.length > 0) {
    bar.style.display = 'flex';
    $('#kit-sel-count').textContent = `${checked.length} kit${checked.length > 1 ? 's' : ''} selected`;
  } else { bar.style.display = 'none'; }
}

/* ---- helpers for modal ---- */
function _kitSS() {
  return `style="background:var(--bg-dark);border:1px solid var(--border);border-radius:6px;
          padding:8px 11px;color:var(--text-primary);flex:1;font-size:13.5px;cursor:pointer"`;
}
function _kitIS() {
  return `style="background:var(--bg-dark);border:1px solid var(--border);border-radius:6px;
          padding:8px 11px;color:var(--text-primary);width:90px;font-size:13.5px;text-align:center"`;
}
function _kitDivOpts(selId) {
  return `<option value="">- Division -</option>${_kitDivs.map(d => {
    const id = d.DivisionId || d.DivisionID;
    return `<option value="${id}" ${id == selId ? 'selected' : ''}>${d.DivisionName}</option>`;
  }).join('')}`;
}
function _kitItemOpts(selId) {
  return `<option value="">- Item -</option>${_kitItems.map(i => {
    const id = i.itemid || i.Itemid;
    return `<option value="${id}" ${id == selId ? 'selected' : ''}>${i.ItemName}</option>`;
  }).join('')}`;
}

function _buildKitItemRow(i, item = {}) {
  return `<div class="kit-line" data-i="${i}"
    style="display:flex;align-items:center;gap:8px;margin-bottom:8px;padding:6px 10px;
           background:var(--bg-dark);border-radius:8px;border:1px solid var(--border)">
    <select class="kit-line-item" data-i="${i}" ${_kitSS()}>
      ${_kitItemOpts(item.ItemID || item.ItemId || '')}
    </select>
    <input type="number" class="kit-line-qty" data-i="${i}" value="${item.ItemQty || 1}"
      min="1" step="1" ${_kitIS()} placeholder="Qty" title="Quantity"/>
    <button type="button" class="kit-line-remove btn btn-danger btn-sm" data-i="${i}"
      style="padding:6px 10px;flex-shrink:0" title="Remove row">
      <i class="fas fa-minus"></i></button>
  </div>`;
}

function _renderKitLines(container, lines) {
  container.innerHTML = lines.map((item, i) => _buildKitItemRow(i, item)).join('');
  container.querySelectorAll('.kit-line-remove').forEach(btn => {
    btn.onclick = () => {
      if (container.querySelectorAll('.kit-line').length <= 1) {
        return showToast('At least 1 item is required', 'error');
      }
      btn.closest('.kit-line').remove();
    };
  });
}

function _collectKitLines(container) {
  return Array.from(container.querySelectorAll('.kit-line')).map(row => ({
    ItemId: row.querySelector('.kit-line-item').value,
    ItemQty: Math.max(1, parseInt(row.querySelector('.kit-line-qty').value) || 1)
  }));
}

function _kitModalBody(kit = {}) {
  const initLines = (kit.Items && kit.Items.length) ? kit.Items : [{}];
  const lineHtml = initLines.map((item, i) => _buildKitItemRow(i, item)).join('');
  return `
    <div class="form-field" style="margin-bottom:14px">
      <label>Kit ID <span style="color:var(--text-muted);font-size:11px">(auto-assigned)</span></label>
      <input type="text" value="${kit.KitID || '~auto'}" readonly
        style="background:var(--bg-dark);border:1px dashed var(--border);border-radius:6px;
               padding:8px 12px;color:var(--text-muted);width:100%;cursor:not-allowed;opacity:0.65;font-style:italic"/>
    </div>
    <div class="form-row cols-2" style="gap:12px;margin-bottom:14px">
      <div class="form-field">
        <label>Division <span style="color:var(--danger)">*</span></label>
        <select id="kit-modal-div"
          style="background:var(--bg-dark);border:1px solid var(--border);border-radius:6px;
                 padding:8px 12px;color:var(--text-primary);width:100%;font-size:14px;cursor:pointer">
          ${_kitDivOpts(kit.DivisionId)}
        </select>
      </div>
      <div class="form-field">
        <label>Kit Name <span style="color:var(--danger)">*</span></label>
        <input type="text" id="kit-modal-name" value="${kit.KitName || ''}"
          style="background:var(--bg-dark);border:1px solid var(--border);border-radius:6px;
                 padding:8px 12px;color:var(--text-primary);width:100%;font-size:14px"
          placeholder="Enter kit name"/>
      </div>
    </div>
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
      <label style="font-weight:600;font-size:13.5px"><i class="fas fa-box-open" style="margin-right:6px;color:var(--accent)"></i>Items in this Kit</label>
      <button type="button" id="btn-kit-add-line" class="btn btn-secondary btn-sm">
        <i class="fas fa-plus"></i> Add Item Row</button>
    </div>
    <div id="kit-lines-container">${lineHtml}</div>`;
}

async function showAddKitModal() {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal" style="max-width:560px;animation:slideUp 0.2s ease">
      <div class="modal-header">
        <h3><i class="fas fa-cubes"></i> Make a Kit</h3>
        <button class="btn-close-modal" onclick="this.closest('.modal-overlay').remove()">
          <i class="fas fa-xmark"></i></button>
      </div>
      <div class="modal-body" style="max-height:65vh;overflow-y:auto">${_kitModalBody()}</div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
        <button class="btn btn-primary" id="btn-kit-add-save">
          <i class="fas fa-cubes"></i> Make the Kit</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);
  overlay.onclick = e => { if (e.target === overlay) overlay.remove(); };

  const container = overlay.querySelector('#kit-lines-container');
  // Attach remove handlers
  container.querySelectorAll('.kit-line-remove').forEach(btn => {
    btn.onclick = () => {
      if (container.querySelectorAll('.kit-line').length <= 1)
        return showToast('At least 1 item is required', 'error');
      btn.closest('.kit-line').remove();
    };
  });
  overlay.querySelector('#btn-kit-add-line').onclick = () => {
    const idx = container.querySelectorAll('.kit-line').length;
    const div = document.createElement('div');
    div.innerHTML = _buildKitItemRow(idx);
    const newRow = div.firstElementChild;
    newRow.querySelector('.kit-line-remove').onclick = () => {
      if (container.querySelectorAll('.kit-line').length <= 1)
        return showToast('At least 1 item is required', 'error');
      newRow.remove();
    };
    container.appendChild(newRow);
  };
  overlay.querySelector('#btn-kit-add-save').onclick = async () => {
    const DivisionId = overlay.querySelector('#kit-modal-div').value;
    const KitName    = overlay.querySelector('#kit-modal-name').value.trim();
    const items      = _collectKitLines(container);
    if (!DivisionId) return showToast('Select a Division', 'error');
    if (!KitName)    return showToast('Kit Name is required', 'error');
    if (items.some(it => !it.ItemId)) return showToast('Select an Item for each row', 'error');
    try {
      await api('/api/kit-details', { method: 'POST', body: { DivisionId, KitName, items } });
      overlay.remove(); showToast('Kit created!', 'success'); await loadKits();
    } catch (e) { showToast(e.message, 'error'); }
  };
}

function showEditKitModal(kit) {
  const existing = $('#kit-edit-modal'); if (existing) existing.remove();
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay'; overlay.id = 'kit-edit-modal';
  overlay.innerHTML = `
    <div class="modal" style="max-width:560px;animation:slideUp 0.2s ease">
      <div class="modal-header">
        <h3><i class="fas fa-pen-to-square"></i> Edit Kit #${kit.KitID}</h3>
        <button class="btn-close-modal" onclick="document.getElementById('kit-edit-modal').remove()">
          <i class="fas fa-xmark"></i></button>
      </div>
      <div class="modal-body" style="max-height:65vh;overflow-y:auto">${_kitModalBody(kit)}</div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="document.getElementById('kit-edit-modal').remove()">Cancel</button>
        <button class="btn btn-primary" id="btn-kit-edit-save">
          <i class="fas fa-floppy-disk"></i> Save</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);
  overlay.onclick = e => { if (e.target === overlay) overlay.remove(); };

  const container = overlay.querySelector('#kit-lines-container');
  container.querySelectorAll('.kit-line-remove').forEach(btn => {
    btn.onclick = () => {
      if (container.querySelectorAll('.kit-line').length <= 1)
        return showToast('At least 1 item is required', 'error');
      btn.closest('.kit-line').remove();
    };
  });
  overlay.querySelector('#btn-kit-add-line').onclick = () => {
    const idx = container.querySelectorAll('.kit-line').length;
    const div = document.createElement('div');
    div.innerHTML = _buildKitItemRow(idx);
    const newRow = div.firstElementChild;
    newRow.querySelector('.kit-line-remove').onclick = () => {
      if (container.querySelectorAll('.kit-line').length <= 1)
        return showToast('At least 1 item is required', 'error');
      newRow.remove();
    };
    container.appendChild(newRow);
  };
  overlay.querySelector('#btn-kit-edit-save').onclick = async () => {
    const DivisionId = overlay.querySelector('#kit-modal-div').value;
    const KitName    = overlay.querySelector('#kit-modal-name').value.trim();
    const items      = _collectKitLines(container);
    if (!DivisionId) return showToast('Select a Division', 'error');
    if (!KitName)    return showToast('Kit Name is required', 'error');
    if (items.some(it => !it.ItemId)) return showToast('Select an Item for each row', 'error');
    try {
      await api(`/api/kit-details/${kit.KitID}`, { method: 'PUT', body: { DivisionId, KitName, items } });
      overlay.remove(); showToast('Kit updated!', 'success'); await loadKits();
    } catch (e) { showToast(e.message, 'error'); }
  };
}

window.deleteKit = async (kitId) => {
  if (!await confirm(`Delete Kit #${kitId} and all its items? This cannot be undone.`)) return;
  try {
    await api(`/api/kit-details/${kitId}`, { method: 'DELETE' });
    showToast('Kit deleted!', 'success'); await loadKits(); updateKitBulkBar();
  } catch (e) { showToast(e.message, 'error'); }
};

async function bulkDeleteKits() {
  const kitIds = $$('.kit-row-chk:checked').map(c => parseInt(c.dataset.id));
  if (!kitIds.length) return;
  if (!await confirm(`Delete ${kitIds.length} kit(s) and all their items? This cannot be undone.`)) return;
  try {
    await api('/api/kit-details/bulk-delete', { method: 'POST', body: { kitIds } });
    showToast(`${kitIds.length} kit(s) deleted!`, 'success');
    $('#kit-select-all').checked = false; await loadKits(); updateKitBulkBar();
  } catch (e) { showToast(e.message, 'error'); }
}

async function bulkExportKits() {
  const kitIds = $$('.kit-row-chk:checked').map(c => parseInt(c.dataset.id));
  try {
    const res = await fetch('/api/kit-details/export-xlsx', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      credentials: 'include', body: JSON.stringify({ kitIds })
    });
    if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `kit_master_${new Date().toISOString().split('T')[0]}.xlsx`;
    a.click(); URL.revokeObjectURL(url);
    showToast(`Exported ${kitIds.length || 'all'} kit(s) to XLSX!`, 'success');
  } catch (e) { showToast('Export failed: ' + e.message, 'error'); }
}


>>>>>>> 676f6c8848f01887d27394222d0b75be2d5763f2
