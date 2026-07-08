/* ================================================
   PAGES: Item Master, Vendor, Dealer, User, Login, Kit, Mapping
   ================================================ */

// -------- ITEM MASTER --------
// Full-featured Item Master is now in pages-masters.js - do not re-register here.
// registerPage('items', ...) REMOVED to avoid overriding the correct version.

// -------- VENDOR MASTER (Full-Featured) --------
let _vendorStates = [], _vendorCities = [];

registerPage('vendors', () => {
  return `${pageHeader('Vendor Details', 'fa-truck', 'Masters / Vendor Details',
    `<button class="btn btn-success" id="btn-vendor-bulk-upload" style="margin-right:8px"><i class="fas fa-file-arrow-up"></i>  Upload Excel</button><button class="btn btn-primary" id="btn-add-vendor"><i class="fas fa-plus"></i>  Add New</button>`)}
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
  if ($('#btn-vendor-bulk-upload')) {
    $('#btn-vendor-bulk-upload').onclick = () => showBulkUploadModal({
      title: 'Vendor Details',
      apiPath: '/api/vendors/bulk-upload',
      templateCols: ['Vendor Name', 'Mobile', 'Company Name', 'GST No', 'PAN', 'Address 1', 'Address 2', 'State', 'City', 'Pin', 'Bank Name', 'Bank Acc No', 'IFSC Code', 'Vendor Email'],
      templateFile: 'vendor_bulk_template.xlsx',
      onSuccess: loadVendors
    });
  }
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

  const getCurrentMode = window._addTabSwitcher ? window._addTabSwitcher(overlay) : () => 'single';
  
  let doBulkUpload = null;
  if (window._handleBulkUploadLogic) {
    doBulkUpload = window._handleBulkUploadLogic(
      overlay, 
      '/api/vendors/bulk-upload', 
      async () => await loadVendors(),
      ['Vendor Name', 'Mobile', 'Address 1', 'Address 2', 'State', 'City', 'Pin', 'Company Name', 'PAN', 'Aadhar No', 'GST No', 'Bank Name', 'Bank Acc No', 'IFSC Code', 'Vendor Email'],
      'vendor_details_bulk_template.xlsx'
    );
  }

  overlay.onclick = e => { if (e.target === overlay) overlay.remove(); };
  overlay.querySelector('.btn-close-modal').onclick = () => overlay.remove();
  _bindVndStateCityFilter(overlay);
  overlay.querySelector('#vnd-name').focus();
  overlay.querySelector('#btn-vendor-add-save').onclick = async () => {
    if (getCurrentMode() === 'bulk' && doBulkUpload) {
      doBulkUpload();
    } else {
      const b = collectVendorForm(overlay);
      if (!b.Name) return showToast('Vendor Name is required', 'error');
      try {
        await api('/api/vendors', { method: 'POST', body: b });
        overlay.remove(); showToast('Vendor added!', 'success'); await loadVendors();
      } catch (e) { showToast(e.message, 'error'); }
    }
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
     <button class="btn btn-info" id="btn-sync-kisna" title="Fetch latest Kisna stores from SIS API" style="background:linear-gradient(135deg,#0ea5e9,#0284c7);border:none">
       <i class="fas fa-rotate"></i> Sync Kisna Stores
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

  // Sync Kisna Stores (SIS API — 2-step JWT auth)
  $('#btn-sync-kisna').onclick = async () => {
    const btn = $('#btn-sync-kisna');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-rotate fa-spin"></i> Syncing...';
    try {
      const result = await api('/api/dealers/sync-kisna', { method: 'POST' });
      showToast(result.message || 'Kisna sync complete!', 'success');
      await loadDealers(1);
    } catch(e) {
      showToast('Kisna sync failed: ' + e.message, 'error');
    } finally {
      btn.disabled = false;
      btn.innerHTML = '<i class="fas fa-rotate"></i> Sync Kisna Stores';
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


// ======== USER MASTER ========
registerPage('user-master', () => {
  return `${pageHeader('User Master', 'fa-users', 'Masters / User Master',
    '<button class="btn btn-primary" id="btn-add-user"><i class="fas fa-user-plus"></i> Add User</button>')}
  <div class="card">
    <div class="search-bar">
      <div class="search-input-wrap">
        <i class="fas fa-search"></i>
        <input type="text" id="user-search" placeholder="Search Users...">
      </div>
    </div>
    <div class="table-wrapper">
      <table id="tbl-user" style="min-width:1100px">
        <thead>
          <tr>
            <th style="width:42px;text-align:center">
              <input type="checkbox" id="user-select-all" title="Select all" style="width:16px;height:16px;cursor:pointer;accent-color:var(--accent)">
            </th>
            <th style="width:70px">ID</th>
            <th style="width:120px">Employee ID</th>
            <th style="width:180px">Role</th>
            <th>UserName</th>
            <th style="width:120px">Status</th>
            <th style="width:100px;text-align:center">Actions</th>
          </tr>
        </thead>
        <tbody id="tbl-user-body">
          <tr class="empty-row"><td colspan="7"><div class="spinner" style="margin:0 auto"></div></td></tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- Floating bulk-action bar -->
  <div id="user-bulk-bar" style="display:none; position:fixed; bottom:28px; left:50%; transform:translateX(-50%); background:var(--bg-card); border:1px solid var(--accent); border-radius:12px; padding:12px 24px; z-index:500; box-shadow:0 8px 32px rgba(0,0,0,0.5); align-items:center; gap:16px; min-width:380px;">
    <span id="user-sel-count" style="color:var(--accent);font-weight:600;font-size:14px"></span>
    <div style="flex:1"></div>
    <button class="btn btn-success" id="btn-user-bulk-export"><i class="fas fa-file-excel"></i> Export XLSX</button>
    <button class="btn btn-danger" id="btn-user-bulk-delete"><i class="fas fa-trash"></i> Delete Selected</button>
    <button class="btn btn-secondary btn-sm" id="btn-user-bulk-cancel" title="Cancel"><i class="fas fa-xmark"></i></button>
  </div>`;
});

window._pageBinders['user-master'] = async () => {
  await loadUsers();
  bindTableSearch('user-search', 'tbl-user-body');
  
  $('#btn-add-user').onclick = () => showUserModal();
  
  $('#user-select-all').onchange = (e) => {
    $$('.user-row-chk').forEach(c => c.checked = e.target.checked);
    updateUserBulkBar();
  };

  $('#btn-user-bulk-cancel').onclick = () => {
    $$('.user-row-chk').forEach(c => c.checked = false);
    $('#user-select-all').checked = false;
    updateUserBulkBar();
  };

  $('#btn-user-bulk-export').onclick = exportUsersXLSX;
  $('#btn-user-bulk-delete').onclick = bulkDeleteUsers;
};

function updateUserBulkBar() {
  const count = $$('.user-row-chk:checked').length;
  const bar = $('#user-bulk-bar');
  if (count > 0) {
    $('#user-sel-count').innerHTML = count + ' users selected';
    bar.style.display = 'flex';
  } else {
    bar.style.display = 'none';
  }
}

function syncUserSelectAll() {
  const total = $$('.user-row-chk').length;
  const count = $$('.user-row-chk:checked').length;
  $('#user-select-all').checked = (total > 0 && count === total);
}

async function loadUsers() {
  const tbody = $('#tbl-user-body');
  try {
    const res = await api('/api/users');
    if (!res || !res.length) {
      tbody.innerHTML = `<tr class="empty-row"><td colspan="7">No Users Found</td></tr>`;
      return;
    }
    
    // Sort logic handled in backend
    window._userData = res; // cache for editing
    
    tbody.innerHTML = res.map(u => {
      const active = (u.Status == 1 || u.Status === '1' || u.Status === 'Y' || u.Status === 'Active') 
        ? `<span style="background:var(--success-soft);color:var(--success);border-radius:20px;padding:3px 10px;font-size:12px;font-weight:600">Active</span>` 
        : `<span style="background:var(--danger-soft);color:var(--danger);border-radius:20px;padding:3px 10px;font-size:12px;font-weight:600">Inactive</span>`;
      return `
      <tr>
        <td style="text-align:center">
          <input type="checkbox" class="user-row-chk" value="${u.UserID}"
            style="width:16px;height:16px;cursor:pointer;accent-color:var(--accent)">
        </td>
        <td style="color:var(--text-secondary);font-size:13px">${u.UserID}</td>
        <td>${u.EmployeeID || '&#8212;'}</td>
        <td>
          <span style="background:var(--accent-soft);color:var(--accent);border-radius:20px;padding:3px 10px;font-size:12px;font-weight:600">
            ${u.RoleName || '&#8212;'}
          </span>
        </td>
        <td>
          <span class="user-edit-cell" data-id="${u.UserID}" style="cursor:pointer;text-decoration:underline dotted;text-underline-offset:3px" title="Click to edit">
            ${u.UserName || '&#8212;'}
          </span>
        </td>
        <td>${active}</td>
        <td style="text-align:center">
          <button class="btn btn-secondary btn-sm" onclick="showInternalForgotPassword('${u.UserName}')" title="Forgot Password" style="margin-right:4px;">
            <i class="fas fa-key"></i>
          </button>
          <button class="btn btn-danger btn-sm" onclick="deleteUser(${u.UserID})" title="Delete">
            <i class="fas fa-trash"></i>
          </button>
        </td>
      </tr>`;
    }).join('');

    $$('.user-row-chk').forEach(chk => { chk.onchange = () => { updateUserBulkBar(); syncUserSelectAll(); }; });
    $$('.user-edit-cell').forEach(cell => {
      cell.onclick = () => {
        const user = window._userData.find(x => x.UserID == cell.dataset.id);
        if (user) showUserModal(user);
      };
    });
  } catch (e) {
    tbody.innerHTML = `<tr class="empty-row"><td colspan="7" style="color:var(--danger)">Failed to load: ${e.message}</td></tr>`;
  }
}

async function showUserModal(rec = null) {
  const isEdit = !!rec;
  // Fetch roles
  let rolesHtml = '<option value="">-- Select Role --</option>';
  try {
    const roles = await api('/api/roles');
    rolesHtml += roles.map(r => `<option value="${r.ID}" ${rec && rec.RoleID == r.ID ? 'selected' : ''}>${r.Role}</option>`).join('');
  } catch(e){}

  const isSuperAdmin = (State.user && State.user.roleName && State.user.roleName.toLowerCase() === 'super admin');
  
  // Conditionally show password field: Always for Add New. Only for Super Admin if Editing.
  const showPasswordField = (!isEdit) || isSuperAdmin;
  const pwdFieldHtml = showPasswordField ? `
    <div class="form-field">
      <label>Password <span style="color:var(--danger)">*</span></label>
      <div style="position:relative">
        <input type="password" id="user-pwd" value="${!isEdit ? '' : ''}" placeholder="${isEdit ? '(Leave blank to keep unchanged)' : ''}" style="background:var(--bg-dark);border:1px solid var(--border);border-radius:6px;padding:8px 12px;color:var(--text-primary);width:100%;">
        <i class="fas fa-eye" id="toggle-user-pwd" style="position:absolute;right:10px;top:10px;cursor:pointer;color:var(--text-muted)"></i>
      </div>
    </div>
  ` : '';

  const qList = ['Your Favourite Color', 'Your Last Name', 'Your Mobile Number', 'Your Favourite Cricketer', 'Your State Name'];
  const sqHtml = qList.map(q => `<option value="${q}" ${rec && rec.SecurityQtn === q ? 'selected' : ''}>${q}</option>`).join('');

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal" style="max-width:750px;animation:slideUp 0.2s ease">
      <div class="modal-header">
        <h3><i class="fas fa-user-edit" style="color:var(--accent);margin-right:8px"></i> ${isEdit ? 'Edit User' : 'Add User'}</h3>
        <button class="btn-close-modal" onclick="this.closest('.modal-overlay').remove()"><i class="fas fa-xmark"></i></button>
      </div>
      <div class="modal-body" style="max-height:70vh;overflow-y:auto;display:flex;flex-direction:column;gap:16px;padding-right:8px">
        
        <div class="form-row cols-2" style="gap:16px">
          <div class="form-field">
            <label>User ID <span style="color:var(--text-muted);font-size:11px">(AUTO-ASSIGNED)</span></label>
            <input type="text" value="${rec ? rec.UserID : '~auto'}" disabled style="background:var(--bg-dark);border:1px dashed var(--border);border-radius:6px;padding:8px 12px;color:var(--text-muted);width:100%;font-style:italic;cursor:not-allowed">
          </div>
          <div class="form-field">
            <label>Employee ID</label>
            <input type="text" id="user-empid" value="${rec ? (rec.EmployeeID||'') : ''}" style="background:var(--bg-dark);border:1px solid var(--border);border-radius:6px;padding:8px 12px;color:var(--text-primary);width:100%;">
          </div>
        </div>

        <div class="form-row cols-2" style="gap:16px">
          <div class="form-field">
            <label>Role <span style="color:var(--danger)">*</span></label>
            <select id="user-role" style="background:var(--bg-dark);border:1px solid var(--border);border-radius:6px;padding:8px 12px;color:var(--text-primary);width:100%;cursor:pointer;">
              ${rolesHtml}
            </select>
          </div>
          <div class="form-field">
            <label>User Name <span style="color:var(--danger)">*</span></label>
            <input type="text" id="user-un" value="${rec ? (rec.UserName||'') : ''}" style="background:var(--bg-dark);border:1px solid var(--border);border-radius:6px;padding:8px 12px;color:var(--text-primary);width:100%;">
          </div>
        </div>

        <div class="form-row cols-2" style="gap:16px">
          ${pwdFieldHtml}
          <div class="form-field">
            <label>Name <span style="color:var(--danger)">*</span></label>
            <input type="text" id="user-name" value="${rec ? (rec.Name||'') : ''}" style="background:var(--bg-dark);border:1px solid var(--border);border-radius:6px;padding:8px 12px;color:var(--text-primary);width:100%;">
          </div>
        </div>

        <div class="form-row cols-2" style="gap:16px">
          <div class="form-field">
            <label>Security Question <span style="color:var(--danger)">*</span></label>
            <select id="user-sq" style="background:var(--bg-dark);border:1px solid var(--border);border-radius:6px;padding:8px 12px;color:var(--text-primary);width:100%;cursor:pointer;">
              <option value="">-- Select Question --</option>
              ${sqHtml}
            </select>
          </div>
          <div class="form-field">
            <label>Answer <span style="color:var(--danger)">*</span></label>
            <input type="text" id="user-ans" value="${rec ? (rec.Answer||'') : ''}" style="background:var(--bg-dark);border:1px solid var(--border);border-radius:6px;padding:8px 12px;color:var(--text-primary);width:100%;">
          </div>
        </div>

        <div class="form-row cols-2" style="gap:16px">
          <div class="form-field">
            <label>Email ID <span style="color:var(--danger)">*</span></label>
            <input type="email" id="user-email" value="${rec ? (rec.EmailId||'') : ''}" style="background:var(--bg-dark);border:1px solid var(--border);border-radius:6px;padding:8px 12px;color:var(--text-primary);width:100%;">
          </div>
          <div class="form-field">
            <label>Mobile No <span style="color:var(--danger)">*</span></label>
            <input type="text" id="user-mob" maxlength="10" value="${rec ? (rec.MobileNo||'') : ''}" style="background:var(--bg-dark);border:1px solid var(--border);border-radius:6px;padding:8px 12px;color:var(--text-primary);width:100%;">
          </div>
        </div>

        <div class="form-row cols-2" style="gap:16px">
          <div class="form-field">
            <label>Gender</label>
            <select id="user-gen" style="background:var(--bg-dark);border:1px solid var(--border);border-radius:6px;padding:8px 12px;color:var(--text-primary);width:100%;cursor:pointer;">
              <option value="">-- Select --</option>
              <option value="Male" ${rec && rec.Gender==='Male'?'selected':''}>Male</option>
              <option value="Female" ${rec && rec.Gender==='Female'?'selected':''}>Female</option>
              <option value="Other" ${rec && rec.Gender==='Other'?'selected':''}>Other</option>
            </select>
          </div>
          <div class="form-field">
            <label>Marital Status</label>
            <select id="user-mar" style="background:var(--bg-dark);border:1px solid var(--border);border-radius:6px;padding:8px 12px;color:var(--text-primary);width:100%;cursor:pointer;">
              <option value="">-- Select --</option>
              <option value="Single" ${rec && rec.MaritalStatus==='Single'?'selected':''}>Single</option>
              <option value="Married" ${rec && rec.MaritalStatus==='Married'?'selected':''}>Married</option>
              <option value="Divorced" ${rec && rec.MaritalStatus==='Divorced'?'selected':''}>Divorced</option>
            </select>
          </div>
        </div>

        <div class="form-field">
          <label>Address</label>
          <input type="text" id="user-addr" value="${rec ? (rec.Address||'') : ''}" style="background:var(--bg-dark);border:1px solid var(--border);border-radius:6px;padding:8px 12px;color:var(--text-primary);width:100%;">
        </div>

        <div class="form-row cols-2" style="gap:16px">
          <div class="form-field">
            <label>City</label>
            <input type="text" id="user-city" value="${rec ? (rec.City||'') : ''}" style="background:var(--bg-dark);border:1px solid var(--border);border-radius:6px;padding:8px 12px;color:var(--text-primary);width:100%;">
          </div>
          <div class="form-field">
            <label>State</label>
            <input type="text" id="user-st" value="${rec ? (rec.State||'') : ''}" style="background:var(--bg-dark);border:1px solid var(--border);border-radius:6px;padding:8px 12px;color:var(--text-primary);width:100%;">
          </div>
        </div>

        <div class="form-row cols-2" style="gap:16px">
          <div class="form-field">
            <label>PIN Code</label>
            <input type="text" id="user-pin" value="${rec ? (rec.pin||'') : ''}" style="background:var(--bg-dark);border:1px solid var(--border);border-radius:6px;padding:8px 12px;color:var(--text-primary);width:100%;">
          </div>
          <div class="form-field">
            <label>Country</label>
            <input type="text" id="user-coun" value="${rec ? (rec.Country||'') : ''}" style="background:var(--bg-dark);border:1px solid var(--border);border-radius:6px;padding:8px 12px;color:var(--text-primary);width:100%;">
          </div>
        </div>

        <div class="form-row cols-2" style="gap:16px">
          <div class="form-field">
            <label>Status <span style="color:var(--danger)">*</span></label>
            <select id="user-status" style="background:var(--bg-dark);border:1px solid var(--border);border-radius:6px;padding:8px 12px;color:var(--text-primary);width:100%;cursor:pointer;">
              <option value="1" ${(rec && (rec.Status==1 || rec.Status==='Y' || rec.Status==='1' || rec.Status==='Active')) ? 'selected' : (!rec ? 'selected' : '')}>Active</option>
              <option value="0" ${(rec && (rec.Status==0 || rec.Status==='0' || rec.Status==='Inactive')) ? 'selected' : ''}>Inactive</option>
            </select>
          </div>
        </div>

      </div>
      <div class="modal-footer" style="padding-top:16px;">
        <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
        <button class="btn btn-primary" id="btn-save-user" style="min-width:110px;"><i class="fas fa-save"></i> ${isEdit ? 'Update User' : 'Save User'}</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);

  if (showPasswordField) {
    $('#toggle-user-pwd', overlay).onclick = function() {
      const el = $('#user-pwd', overlay);
      if (el.type === 'password') { el.type = 'text'; this.className = 'fas fa-eye-slash'; }
      else { el.type = 'password'; this.className = 'fas fa-eye'; }
    };
  }

  $('#btn-save-user', overlay).onclick = async () => {
    const payload = {
      EmployeeID: $('#user-empid', overlay).value.trim(),
      RoleID: $('#user-role', overlay).value,
      UserName: $('#user-un', overlay).value.trim(),
      Name: $('#user-name', overlay).value.trim(),
      SecurityQtn: $('#user-sq', overlay).value,
      Answer: $('#user-ans', overlay).value.trim(),
      EmailId: $('#user-email', overlay).value.trim(),
      MobileNo: $('#user-mob', overlay).value.trim(),
      Gender: $('#user-gen', overlay).value,
      MaritalStatus: $('#user-mar', overlay).value,
      Address: $('#user-addr', overlay).value.trim(),
      City: $('#user-city', overlay).value.trim(),
      State: $('#user-st', overlay).value.trim(),
      Pin: $('#user-pin', overlay).value.trim(),
      Country: $('#user-coun', overlay).value.trim(),
      Status: $('#user-status', overlay).value
    };

    if (showPasswordField) {
      payload.Password = $('#user-pwd', overlay).value.trim();
    }

    if (!payload.RoleID || !payload.UserName || !payload.Name || !payload.SecurityQtn || !payload.Answer || !payload.EmailId || !payload.MobileNo) {
      return alert('Please fill all mandatory fields!');
    }
    if (!isEdit && (!payload.Password || payload.Password.length === 0)) {
      return alert('Password is required for a new user!');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(payload.EmailId)) return alert('Please enter a valid email address!');
    const mobileRegex = /^\d{10}$/;
    if (!mobileRegex.test(payload.MobileNo)) return alert('Mobile number must be exactly 10 digits!');


    try {
      const btn = $('#btn-save-user', overlay);
      const originalText = btn.innerHTML;
      btn.innerHTML = '<div class="spinner" style="width:16px;height:16px"></div> Saving...';
      btn.disabled = true;

      const url = isEdit ? '/api/users/' + rec.UserID : '/api/users';
      const res = await api(url, { method: isEdit ? 'PUT' : 'POST', body: payload });
      if (res.success) {
        overlay.remove();
        loadUsers();
      } else {
        alert(res.error || 'Failed to save user');
        btn.innerHTML = originalText;
        btn.disabled = false;
      }
    } catch (e) { alert(e.message); }
  };
}

async function deleteUser(id) {
  if (!await confirm('Are you sure you want to delete this user?')) return;

  try {
    const res = await api('/api/users/' + id, { method: 'DELETE' });
    if (res.success) loadUsers();
    else alert(res.error || 'Delete failed');
  } catch (e) { alert(e.message); }
}

async function exportUsersXLSX() {
  const checked = $$('.user-row-chk:checked');
  const ids = Array.from(checked).map(c => c.value);
  if (!ids.length) return;
  
  try {
    const res = await fetch('/api/users/export-xlsx', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + (localStorage.getItem('token') || '') },
      body: JSON.stringify({ ids })
    });
    if (!res.ok) throw new Error('Export failed');
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'user_master.xlsx';
    a.click();
    window.URL.revokeObjectURL(url);
  } catch (e) {
    alert(e.message);
  }
}

async function bulkDeleteUsers() {
  const checked = $$('.user-row-chk:checked');
  const ids = Array.from(checked).map(c => c.value);
  if (!ids.length) return;

  if (!await confirm(`Delete ${ids.length} selected users?`)) return;

  try {
    const res = await api('/api/users/bulk-delete', { method: 'POST', body: { ids } });
    if (res.success) {
      $('#user-select-all').checked = false;
      updateUserBulkBar();
      loadUsers();
    } else {
      alert(res.error || 'Bulk delete failed');
    }
  } catch (e) {
    alert(e.message);
  }
}

function showInternalForgotPassword(un) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal" style="max-width:400px;animation:slideUp 0.2s ease">
      <div class="modal-header">
        <h3><i class="fas fa-key" style="color:var(--accent);margin-right:8px"></i> Forgot Password</h3>
        <button class="btn-close-modal" onclick="this.closest('.modal-overlay').remove()"><i class="fas fa-xmark"></i></button>
      </div>
      <div class="modal-body" id="ifp-body">
        <div style="text-align:center;margin-bottom:16px"><div class="spinner"></div></div>
      </div>
    </div>`;
  document.body.appendChild(overlay);

  let securityQtn = '';

  fetch('/api/users/forgot-password/init', { method: 'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({UserName: un}) })
  .then(r => r.json())
  .then(data => {
    if (data.error) throw new Error(data.error);
    securityQtn = data.SecurityQtn || 'Your Favourite Color';
    
    $('#ifp-body', overlay).innerHTML = `
      <div style="font-size:13px;margin-bottom:16px;color:var(--text-secondary)">
        User: <strong>${un}</strong>
      </div>
      <div class="form-field" style="margin-bottom:14px">
        <label>Security Question</label>
        <input type="text" value="${securityQtn}" disabled style="background:var(--bg-dark);border:1px dashed var(--border);border-radius:6px;padding:8px 12px;color:var(--text-muted);width:100%;">
      </div>
      <div class="form-field" style="margin-bottom:14px">
        <label>Your Answer <span style="color:var(--danger)">*</span></label>
        <input type="text" id="ifp-answer" placeholder="Enter your answer" style="background:var(--bg-dark);border:1px solid var(--border);border-radius:6px;padding:8px 12px;color:var(--text-primary);width:100%;">
      </div>
      <button class="btn btn-primary" id="btn-ifp-verify" style="width:100%">Verify Answer <i class="fas fa-check"></i></button>
      <div id="ifp-err" style="color:var(--danger);font-size:13px;margin-top:10px;text-align:center"></div>
    `;

    $('#btn-ifp-verify', overlay).onclick = async () => {
      const ans = $('#ifp-answer', overlay).value.trim();
      if (!ans) return $('#ifp-err', overlay).textContent = 'Answer is required';
      try {
        const vRes = await fetch('/api/users/forgot-password/verify', { method: 'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({UserName: un, SecurityQtn: securityQtn, Answer: ans})});
        const vData = await vRes.json();
        if (!vRes.ok) throw new Error(vData.error || 'Invalid answer');
        
        // Move to Step 3
        $('#ifp-body', overlay).innerHTML = `
          <div class="form-field" style="margin-bottom:14px">
            <label>New Password <span style="color:var(--danger)">*</span></label>
            <input type="password" id="ifp-new-pwd" placeholder="Enter new password" style="background:var(--bg-dark);border:1px solid var(--border);border-radius:6px;padding:8px 12px;color:var(--text-primary);width:100%;">
          </div>
          <div class="form-field" style="margin-bottom:14px">
            <label>Confirm Password <span style="color:var(--danger)">*</span></label>
            <input type="password" id="ifp-confirm-pwd" placeholder="Confirm new password" style="background:var(--bg-dark);border:1px solid var(--border);border-radius:6px;padding:8px 12px;color:var(--text-primary);width:100%;">
          </div>
          <button class="btn btn-success" id="btn-ifp-reset" style="width:100%">Reset Password <i class="fas fa-save"></i></button>
          <div id="ifp-err" style="color:var(--danger);font-size:13px;margin-top:10px;text-align:center"></div>
        `;
        
        $('#btn-ifp-reset', overlay).onclick = async () => {
          const np = $('#ifp-new-pwd', overlay).value.trim();
          const cp = $('#ifp-confirm-pwd', overlay).value.trim();
          if (!np || !cp) return $('#ifp-err', overlay).textContent = 'Both fields required';
          if (np !== cp) return $('#ifp-err', overlay).textContent = 'Passwords do not match';
          
          try {
            const rRes = await fetch('/api/users/forgot-password/reset', { method: 'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({UserName: un, NewPassword: np})});
            if (!rRes.ok) throw new Error('Reset failed');
            overlay.remove();
            showToast('Password reset successfully!', 'success');
          } catch (ee) { $('#ifp-err', overlay).textContent = ee.message; }
        };
      } catch (e) { $('#ifp-err', overlay).textContent = e.message; }
    };
  })
  .catch(err => {
    $('#ifp-body', overlay).innerHTML = `<div style="color:var(--danger);text-align:center">${err.message}</div>`;
  });
}


registerPage('role-master', () => {
  return `${pageHeader('Role Master', 'fa-key', 'Masters / Role Master',
    '<button class="btn btn-primary" onclick="showRoleModal()"><i class="fas fa-plus"></i> Add New</button>'
  )}
  <div class="table-container" style="margin-top:20px;">
    <div id="role-bulk-bar" style="display:none; padding:10px 15px; background:var(--primary-light); border-radius:8px; margin-bottom:15px; align-items:center; justify-content:space-between;">
      <span style="font-weight:600; color:var(--primary-dark)"><span id="role-sel-count">0</span> roles selected</span>
      <div>
        <button class="btn btn-danger btn-sm" onclick="deleteRolesBulk()"><i class="fas fa-trash"></i> Delete Selected</button>
        <button class="btn btn-secondary btn-sm" onclick="exportRoles()"><i class="fas fa-file-excel"></i> Export Selected</button>
      </div>
    </div>
    <div style="display:flex; justify-content:flex-end; margin-bottom:10px;">
        <button class="btn btn-secondary btn-sm" onclick="exportRoles(true)" title="Export All"><i class="fas fa-file-excel"></i> Export All</button>
    </div>
    <table>
      <thead>
        <tr>
          <th style="width:40px;text-align:center"><input type="checkbox" id="role-select-all" onchange="syncRoleSelectAll(this)" style="width:16px;height:16px;cursor:pointer;accent-color:var(--accent)"></th>
          <th>ID</th>
          <th>Role</th>
          <th>Mapped Users</th>
          <th>Status</th>
          <th style="text-align:center">Actions</th>
        </tr>
      </thead>
      <tbody id="tbl-role-body">
        <tr><td colspan="6" style="text-align:center;padding:20px"><i class="fas fa-spinner fa-spin"></i> Loading...</td></tr>
      </tbody>
    </table>
  </div>`;
});

window._pageBinders['role-master'] = async () => {
  await loadRoles();
};

function syncRoleSelectAll(masterChk) {
  const isChecked = masterChk.checked;
  $$('.role-row-chk').forEach(chk => chk.checked = isChecked);
  updateRoleBulkBar();
}

function updateRoleBulkBar() {
  const count = $$('.role-row-chk:checked').length;
  const bar = $('#role-bulk-bar');
  if (count > 0) {
    bar.style.display = 'flex';
    $('#role-sel-count').innerText = count;
  } else {
    bar.style.display = 'none';
  }
  const total = $$('.role-row-chk').length;
  $('#role-select-all').checked = (total > 0 && count === total);
}

async function loadRoles() {
  const tbody = $('#tbl-role-body');
  try {
    const res = await api('/api/roles');
    if (!res || !res.length) {
      tbody.innerHTML = '<tr class="empty-row"><td colspan="6">No Roles Found</td></tr>';
      return;
    }
    
    window._roleData = res;
    
    tbody.innerHTML = res.map(r => {
      const active = (r.Status == 1 || r.Status === '1' || r.Status === 'Y' || r.Status === 'Active') 
        ? '<span style="background:var(--success-soft);color:var(--success);border-radius:20px;padding:3px 10px;font-size:12px;font-weight:600">Active</span>' 
        : '<span style="background:var(--danger-soft);color:var(--danger);border-radius:20px;padding:3px 10px;font-size:12px;font-weight:600">Inactive</span>';
      return `
      <tr>
        <td style="text-align:center">
          <input type="checkbox" class="role-row-chk" value="${r.ID}" style="width:16px;height:16px;cursor:pointer;accent-color:var(--accent)">
        </td>
        <td style="color:var(--text-secondary);font-size:13px">${r.ID}</td>
        <td>
          <span class="role-edit-cell" data-id="${r.ID}" style="cursor:pointer;text-decoration:underline dotted;text-underline-offset:3px" title="Click to edit">
            ${r.Role || '&#8212;'}
          </span>
        </td>
        <td style="font-size:13px;color:var(--text-secondary);max-width:300px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${r.MappedUsers || ''}">${r.MappedUsers || '<i style="color:#aaa">None</i>'}</td>
        <td>${active}</td>
        <td style="text-align:center">
          <button class="btn btn-danger btn-sm" onclick="deleteRole(${r.ID})" title="Delete">
            <i class="fas fa-trash"></i>
          </button>
        </td>
      </tr>`;
    }).join('');

    $$('.role-row-chk').forEach(chk => { chk.onchange = () => { updateRoleBulkBar(); syncRoleSelectAll(); }; });
    $$('.role-edit-cell').forEach(cell => {
      cell.onclick = () => {
        const role = window._roleData.find(x => x.ID == cell.dataset.id);
        if (role) showRoleModal(role);
      };
    });
  } catch (e) {
    tbody.innerHTML = `<tr class="empty-row"><td colspan="6" style="color:var(--danger)">Failed to load: ${e.message}</td></tr>`;
  }
}

async function showRoleModal(rec = null) {
  const isEdit = !!rec;
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal-content" style="max-width:500px;">
      <div class="modal-header">
        <h3>${isEdit ? 'Edit Role' : 'Add New Role'}</h3>
        <button class="btn-close" onclick="this.closest('.modal-overlay').remove()"><i class="fas fa-times"></i></button>
      </div>
      <div class="modal-body">
        <div class="form-group" style="display:grid;grid-template-columns:1fr;gap:15px;">
          <div class="form-field">
            <label>Role Name <span style="color:var(--danger)">*</span></label>
            <input type="text" id="role-name" value="${isEdit ? (rec.Role || '') : ''}" placeholder="e.g. Manager" style="background:var(--bg-dark);border:1px solid var(--border);border-radius:6px;padding:8px 12px;color:var(--text-primary);width:100%;">
          </div>
          <div class="form-field">
            <label>Status <span style="color:var(--danger)">*</span></label>
            <select id="role-status" style="background:var(--bg-dark);border:1px solid var(--border);border-radius:6px;padding:8px 12px;color:var(--text-primary);width:100%;">
              <option value="1" ${isEdit && (rec.Status == 1 || rec.Status === '1' || rec.Status === 'Y') ? 'selected' : ''}>Active</option>
              <option value="0" ${isEdit && (rec.Status == 0 || rec.Status === '0' || rec.Status === 'N') ? 'selected' : ''}>Inactive</option>
            </select>
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
        <button class="btn btn-primary" id="btn-save-role">
          <i class="fas fa-save"></i> Save
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  $('#btn-save-role').onclick = async () => {
    const Role = $('#role-name').value.trim();
    const Status = $('#role-status').value;
    
    if (!Role) return showToast('Role Name is required.', 'error');
    
    const payload = { Role, Status };
    const btn = $('#btn-save-role');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
    try {
      const url = isEdit ? `/api/roles/${rec.ID}` : '/api/roles';
      const method = isEdit ? 'PUT' : 'POST';
      await api(url, { method, body: JSON.stringify(payload) });
      showToast('Saved successfully!', 'success');
      overlay.remove();
      loadRoles();
    } catch (e) {
      showToast(e.message, 'error');
      btn.disabled = false;
      btn.innerHTML = '<i class="fas fa-save"></i> Save';
    }
  };
}

async function deleteRole(id) {
  if (!confirm('Are you sure you want to delete this Role?')) return;
  try {
    await api(`/api/roles/${id}`, { method: 'DELETE' });
    showToast('Deleted successfully', 'success');
    loadRoles();
    updateRoleBulkBar();
  } catch (e) {
    showToast(e.message, 'error');
  }
}

async function deleteRolesBulk() {
  const chks = $$('.role-row-chk:checked');
  if (!chks.length) return;
  if (!confirm(`Delete ${chks.length} roles?`)) return;
  
  const ids = Array.from(chks).map(c => c.value);
  try {
    await api('/api/roles/bulk-delete', { method: 'POST', body: JSON.stringify({ ids }) });
    showToast('Deleted successfully', 'success');
    loadRoles();
    updateRoleBulkBar();
  } catch (e) {
    showToast(e.message, 'error');
  }
}

async function exportRoles(all = false) {
  let body = {};
  if (!all) {
    const chks = $$('.role-row-chk:checked');
    if (!chks.length) return showToast('No roles selected to export', 'error');
    body.ids = Array.from(chks).map(c => c.value);
  }
  try {
    const res = await fetch('/api/roles/export-xlsx', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + localStorage.getItem('token')
      },
      body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error('Export failed');
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'role_master.xlsx';
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  } catch (e) {
    showToast(e.message, 'error');
  }
}


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


// ======== ROLE MASTER ========
registerPage('role-master', () => {
  return `${pageHeader('Role Master', 'fa-user-cog', 'Masters / Role Master',
    '<button class="btn btn-primary" id="btn-add-role"><i class="fas fa-plus"></i> Add New</button>')}
  <div class="card">
    <div class="search-bar">
      <div class="search-input-wrap">
        <i class="fas fa-search"></i>
        <input type="text" id="role-search" placeholder="Search Roles...">
      </div>
    </div>
    <div class="table-wrapper">
      <table id="tbl-role" style="min-width:1000px">
        <thead>
          <tr>
            <th style="width:42px;text-align:center">
              <input type="checkbox" id="role-select-all" title="Select all" style="width:16px;height:16px;cursor:pointer;accent-color:var(--accent)">
            </th>
            <th style="width:70px">ID</th>
            <th style="width:250px">Role</th>
            <th>Mapped Users</th>
            <th style="width:120px">Status</th>
            <th style="width:100px">Actions</th>
          </tr>
        </thead>
        <tbody id="tbl-role-body">
          <tr class="empty-row"><td colspan="6"><div class="spinner" style="margin:0 auto"></div></td></tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- Floating bulk-action bar -->
  <div id="role-bulk-bar" style="display:none; position:fixed; bottom:28px; left:50%; transform:translateX(-50%); background:var(--bg-card); border:1px solid var(--accent); border-radius:12px; padding:12px 24px; z-index:500; box-shadow:0 8px 32px rgba(0,0,0,0.5); align-items:center; gap:16px; min-width:380px;">
    <span id="role-sel-count" style="color:var(--accent);font-weight:600;font-size:14px"></span>
    <div style="flex:1"></div>
    <button class="btn btn-success" id="btn-role-bulk-export"><i class="fas fa-file-excel"></i> Export XLSX</button>
    <button class="btn btn-danger" id="btn-role-bulk-delete"><i class="fas fa-trash"></i> Delete Selected</button>
    <button class="btn btn-secondary btn-sm" id="btn-role-bulk-cancel" title="Cancel"><i class="fas fa-xmark"></i></button>
  </div>`;
});

window._pageBinders['role-master'] = async () => {
  await loadRoles();
  bindTableSearch('role-search', 'tbl-role-body');
  
  $('#btn-add-role').onclick = () => showRoleModal();
  
  $('#role-select-all').onchange = (e) => {
    $$('.role-row-chk').forEach(c => c.checked = e.target.checked);
    updateRoleBulkBar();
  };

  $('#btn-role-bulk-cancel').onclick = () => {
    $$('.role-row-chk').forEach(c => c.checked = false);
    $('#role-select-all').checked = false;
    updateRoleBulkBar();
  };

  $('#btn-role-bulk-export').onclick = exportRolesXLSX;
  $('#btn-role-bulk-delete').onclick = bulkDeleteRoles;
};

function updateRoleBulkBar() {
  const count = $$('.role-row-chk:checked').length;
  const bar = $('#role-bulk-bar');
  if (count > 0) {
    $('#role-sel-count').innerHTML = count + ' roles selected';
    bar.style.display = 'flex';
  } else {
    bar.style.display = 'none';
  }
}

function syncRoleSelectAll() {
  const total = $$('.role-row-chk').length;
  const count = $$('.role-row-chk:checked').length;
  $('#role-select-all').checked = (total > 0 && count === total);
}

async function loadRoles() {
  const tbody = $('#tbl-role-body');
  try {
    const res = await api('/api/roles');
    if (!res || !res.length) {
      tbody.innerHTML = `<tr class="empty-row"><td colspan="6">No Roles Found</td></tr>`;
      return;
    }
    tbody.innerHTML = res.map(r => {
      const active = (r.Status == 1 || r.Status === 'Y') 
        ? `<span style="background:var(--success-soft);color:var(--success);border-radius:20px;padding:3px 10px;font-size:12px;font-weight:600">Active</span>` 
        : `<span style="background:var(--danger-soft);color:var(--danger);border-radius:20px;padding:3px 10px;font-size:12px;font-weight:600">Inactive</span>`;
      return `
      <tr>
        <td style="text-align:center">
          <input type="checkbox" class="role-row-chk" value="${r.ID}"
            style="width:16px;height:16px;cursor:pointer;accent-color:var(--accent)">
        </td>
        <td style="color:var(--text-secondary);font-size:13px">${r.ID}</td>
        <td style="font-weight:500">${r.Role || ''}</td>
        <td style="color:var(--text-secondary)">${r.MappedUsers || '&#8212;'}</td>
        <td>${active}</td>
        <td>
          <button class="btn btn-danger btn-sm" onclick="deleteRole(${r.ID})" title="Delete">
            <i class="fas fa-trash"></i>
          </button>
        </td>
      </tr>`;
    }).join('');

    $$('.role-row-chk').forEach(chk => {
      chk.onchange = () => { updateRoleBulkBar(); syncRoleSelectAll(); };
    });
  } catch (e) {
    tbody.innerHTML = `<tr class="empty-row"><td colspan="6" style="color:var(--danger)">Failed to load: ${e.message}</td></tr>`;
  }
}

function showRoleModal() {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal" style="max-width:420px;animation:slideUp 0.2s ease">
      <div class="modal-header">
        <h3><i class="fas fa-plus-circle" style="color:var(--accent);margin-right:8px"></i> Add Role</h3>
        <button class="btn-close-modal" onclick="this.closest('.modal-overlay').remove()"><i class="fas fa-xmark"></i></button>
      </div>
      <div class="modal-body">
        <div class="form-field" style="margin-bottom:14px">
          <label>ID <span style="color:var(--text-muted);font-size:11px">(auto-assigned)</span></label>
          <input type="text" value="~auto" disabled 
            style="background:var(--bg-dark);border:1px dashed var(--border);border-radius:6px;padding:9px 12px;color:var(--text-muted);width:100%;cursor:not-allowed;font-style:italic;opacity:0.7">
        </div>
        <div class="form-field" style="margin-bottom:14px">
          <label>Role <span style="color:var(--danger)">*</span></label>
          <input type="text" id="role-name" 
            style="background:var(--bg-dark);border:1px solid var(--border);border-radius:6px;padding:8px 12px;color:var(--text-primary);width:100%;">
        </div>
        <div class="form-field" style="margin-bottom:14px">
          <label>Status</label>
          <select id="role-status" style="background:var(--bg-dark);border:1px solid var(--border);border-radius:6px;padding:8px 12px;color:var(--text-primary);width:100%;cursor:pointer;">
            <option value="1" selected>Active</option>
            <option value="0">Inactive</option>
          </select>
        </div>
      </div>
      <div class="modal-footer" style="padding-top:16px;">
        <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
        <button class="btn btn-primary" id="btn-save-role" style="min-width:100px;"><i class="fas fa-save"></i> Save Role</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);

  $('#btn-save-role', overlay).onclick = async () => {
    const role = $('#role-name', overlay).value.trim();
    const status = $('#role-status', overlay).value;
    if (!role) return alert('Role is required');

    try {
      const btn = $('#btn-save-role', overlay);
      const originalText = btn.innerHTML;
      btn.innerHTML = '<div class="spinner" style="width:16px;height:16px"></div> Saving...';
      btn.disabled = true;

      const res = await api('/api/roles', { method: 'POST', body: { Role: role, Status: status } });
      if (res.success) {
        overlay.remove();
        loadRoles();
      } else {
        alert(res.error || 'Failed to add role');
        btn.innerHTML = originalText;
        btn.disabled = false;
      }
    } catch (e) { alert(e.message); }
  };
}

async function deleteRole(id) {
  if (!confirm('Are you sure you want to delete this role? (1/3)')) return;
  if (!confirm('This action cannot be undone! Delete? (2/3)')) return;
  if (!confirm('FINAL WARNING: Delete role? (3/3)')) return;

  try {
    const res = await api('/api/roles/' + id, { method: 'DELETE' });
    if (res.success) {
      loadRoles();
    } else {
      alert(res.error || 'Delete failed');
    }
  } catch (e) { alert(e.message); }
}

async function exportRolesXLSX() {
  const checked = $$('.role-row-chk:checked');
  const ids = Array.from(checked).map(c => c.value);
  if (!ids.length) return;
  
  try {
    const res = await fetch('/api/roles/export-xlsx', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + (localStorage.getItem('token') || '') },
      body: JSON.stringify({ ids })
    });
    if (!res.ok) throw new Error('Export failed');
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'role_master.xlsx';
    a.click();
    window.URL.revokeObjectURL(url);
  } catch (e) {
    alert(e.message);
  }
}

async function bulkDeleteRoles() {
  const checked = $$('.role-row-chk:checked');
  const ids = Array.from(checked).map(c => c.value);
  if (!ids.length) return;

  if (!confirm(`Delete ${ids.length} selected roles?`)) return;

  try {
    const res = await api('/api/roles/bulk-delete', {
      method: 'POST',
      body: { ids }
    });
    if (res.success) {
      $('#role-select-all').checked = false;
      updateRoleBulkBar();
      loadRoles();
    } else {
      alert(res.error || 'Bulk delete failed');
    }
  } catch (e) {
    alert(e.message);
  }
}
