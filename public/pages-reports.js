<<<<<<< HEAD
/* ================================================
=======
﻿/* ================================================
>>>>>>> 676f6c8848f01887d27394222d0b75be2d5763f2
   PAGES: Reports  (Challan / Stock / Inventory)
   ================================================ */

// ========================================================
// CHALLAN REPORT &#8594; Issue Items Challan
// ========================================================
let _chalIssues = [], _chalHeader = null, _chalDetail = [], _chalSelIssue = null;
let _chalSortDir = -1; // -1 = newest first (desc), 1 = oldest first (asc)

registerPage('challan', async () => {
  return `${pageHeader('Issue Items Challan', 'fa-file-lines', 'Reports / Challan Report / Issue Items Challan')}
  <div class="card">
    <!-- Filter Bar -->
    <div class="report-filters" style="align-items:flex-end">
      <div class="form-field">
        <label>Division</label>
        <select id="chl-div"><option value="">-- Select Division --</option></select>
      </div>
      <button class="btn btn-primary" id="btn-chl-load" style="height:36px">
        <i class="fas fa-search"></i> View Report
      </button>
    </div>

    <!-- Issues grid (hidden until View Report) -->
    <div id="chl-grid-wrap" style="display:none;margin-top:20px">
      <!-- Search bar (shown above the report results) -->
      <div class="search-bar" style="margin-bottom:12px">
        <div class="search-input-wrap">
          <i class="fas fa-search"></i>
          <input type="text" id="chl-search"
            placeholder="Search Issue ID, Dealer, Request Mode, Dist Code...">
        </div>
      </div>
      <div class="table-wrapper" style="max-height:320px;overflow-y:auto">
        <table style="width:100%;border-collapse:collapse;font-size:12.5px">
          <thead>
            <tr style="background:#1a3e8e;color:#fff;position:sticky;top:0">
              <th id="chl-th-issueid" onclick="window._chalToggleSort()" style="padding:7px 10px;border:1px solid #2a5aba;text-align:center;cursor:pointer;user-select:none" title="Click to sort">Issue ID &#9660;</th>
              <th style="padding:7px 10px;border:1px solid #2a5aba;text-align:center">Request ID</th>
              <th style="padding:7px 10px;border:1px solid #2a5aba">Request Mode</th>
              <th style="padding:7px 10px;border:1px solid #2a5aba">Dealer Company Name</th>
              <th style="padding:7px 10px;border:1px solid #2a5aba;text-align:center">Deliver Mode</th>
              <th style="padding:7px 10px;border:1px solid #2a5aba;text-align:center">Issue Date</th>
              <th style="padding:7px 10px;border:1px solid #2a5aba;text-align:center">Dist Code</th>
            </tr>
          </thead>
          <tbody id="chl-tbody">
            <tr><td colspan="7" style="text-align:center;padding:16px;color:#999">Click "View Report" to load issues.</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>`;
});

window._pageBinders['challan'] = async () => {
  _chalIssues = []; _chalHeader = null; _chalDetail = []; _chalSelIssue = null;
  // Load divisions
  let divs = [];
  try { divs = await api('/api/divisions'); } catch (_) { }
  const divSel = $('#chl-div');
  if (divSel) divs.filter(d => (d.Status || d.status || 'Y') === 'Y').forEach(d =>
    divSel.insertAdjacentHTML('beforeend', `<option value="${d.DivisionId || d.DivisionID}">${d.DivisionName}</option>`));

  $('#btn-chl-load').onclick = () => _chalLoadIssues();
};

async function _chalLoadIssues() {
  const divId = $('#chl-div')?.value;
  if (!divId) return showToast('Please select a Division first.', 'error');
  const btn = $('#btn-chl-load');
  if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading&#8230;'; }
  try {
    _chalIssues = await api(`/api/challan/issues?divisionId=${divId}`);
  } catch (e) {
    showToast('Failed to load: ' + e.message, 'error');
    _chalIssues = [];
  } finally {
    if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-search"></i> View Report'; }
  }
  _chalSortDir = -1; // reset to newest-first on each fresh load
  const wrap = $('#chl-grid-wrap');
  if (wrap) wrap.style.display = 'block';
  // Close any open challan modal
  const om = document.getElementById('chl-modal-overlay');
  if (om) om.remove();
  _chalRenderGrid();
  // Reset + wire search bar
  const searchEl = $('#chl-search');
  if (searchEl) {
    searchEl.value = '';
    searchEl.oninput = () => {
      const q = searchEl.value.toLowerCase();
      $$('#chl-tbody tr').forEach(tr => {
        tr.style.display = !q || tr.textContent.toLowerCase().includes(q) ? '' : 'none';
      });
    };
  }
}

function _chalRenderGrid() {
  const tbody = $('#chl-tbody');
  if (!tbody) return;
  if (!_chalIssues.length) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:20px;color:#999">No Courier issues found for selected division.</td></tr>`;
    return;
  }
  // Sort by issueid
  const sorted = [..._chalIssues].sort((a, b) => _chalSortDir * (Number(b.issueid) - Number(a.issueid)));
  // Update header arrow indicator
  const th = document.getElementById('chl-th-issueid');
  if (th) th.innerHTML = `Issue ID <span style="font-size:10px">${_chalSortDir === -1 ? '&#9660;' : '&#9650;'}</span>`;

  tbody.innerHTML = sorted.map((r, i) => {
    const bg = i % 2 === 0 ? '#fff' : '#f5f7ff';
    let dt = '-';
    try { dt = r.IssueDate ? new Date(r.IssueDate).toLocaleDateString('en-IN') + ' ' + new Date(r.IssueDate).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '-'; } catch (_) { }
    // Find original index for click handler
    const origIdx = _chalIssues.indexOf(r);
    return `<tr data-idx="${origIdx}" style="background:${bg};cursor:pointer" class="chl-row"
      onmouseover="this.style.background='#dbe8ff'" onmouseout="this.style.background='${bg}'"
      onclick="window._chalSelectRow(${origIdx})">
      <td style="padding:5px 10px;border:1px solid #e0e0e0;text-align:center;color:#1a56db;font-weight:600">${r.issueid || r.IssueId}</td>
      <td style="padding:5px 10px;border:1px solid #e0e0e0;text-align:center;color:#1a1a1a">${r.requestid || '-'}</td>
      <td style="padding:5px 10px;border:1px solid #e0e0e0;color:#1a1a1a">${r.RequestMode || '-'}</td>
      <td style="padding:5px 10px;border:1px solid #e0e0e0;color:#1a1a1a">${r.DealerCompanyName || '-'}</td>
      <td style="padding:5px 10px;border:1px solid #e0e0e0;text-align:center;color:#1a1a1a">${r.DeliverMode || '-'}</td>
      <td style="padding:5px 10px;border:1px solid #e0e0e0;text-align:center;color:#1a1a1a">${dt}</td>
      <td style="padding:5px 10px;border:1px solid #e0e0e0;text-align:center;color:#1a1a1a">${r.DistCode || '-'}</td>
    </tr>`;
  }).join('');
}

window._chalToggleSort = () => {
  _chalSortDir = _chalSortDir === -1 ? 1 : -1;
  _chalRenderGrid();
};

window._chalSelectRow = async (idx) => {
  const issue = _chalIssues[idx];
  if (!issue) return;
  _chalSelIssue = issue;

  // Highlight selected row
  const sorted = [..._chalIssues].sort((a, b) => _chalSortDir * (Number(b.issueid) - Number(a.issueid)));
  $$('.chl-row').forEach((tr, i) => {
    const orig = sorted[i];
    const isSel = orig && orig.issueid === issue.issueid;
    tr.style.background = isSel ? '#c8d8ff' : (i % 2 === 0 ? '#fff' : '#f5f7ff');
  });

  // ── Build / reuse modal overlay ──────────────────────────────────────────
  let modal = document.getElementById('chl-modal-overlay');
  if (modal) modal.remove();
  modal = document.createElement('div');
  modal.id = 'chl-modal-overlay';
  modal.style.cssText = [
    'position:fixed;top:0;left:0;width:100%;height:100%;',
    'background:rgba(0,0,0,.6);z-index:9999;',
    'display:flex;align-items:center;justify-content:center;'
  ].join('');

  const issDate = issue.IssueDate
    ? new Date(issue.IssueDate).toLocaleDateString('en-IN')
    : '';

  modal.innerHTML = `
    <div id="chl-modal-box"
      style="background:#2a2a2a;width:92vw;max-width:1000px;height:90vh;
             border-radius:10px;display:flex;flex-direction:column;
             box-shadow:0 24px 80px rgba(0,0,0,.7);overflow:hidden;animation:slideUp .2s ease">

      <!-- ── Modal header ── -->
      <div style="background:linear-gradient(135deg,#1a3e8e,#2a5aba);color:#fff;
                  padding:12px 18px;display:flex;align-items:center;
                  justify-content:space-between;flex-shrink:0;gap:12px">
        <div style="display:flex;align-items:center;gap:12px;min-width:0">
          <i class="fas fa-file-lines" style="font-size:18px;opacity:.85"></i>
          <div style="min-width:0">
            <div style="font-weight:700;font-size:14px">Challan Preview</div>
            <div style="font-size:11px;opacity:.75;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
              Issue #${issue.issueid}
              ${issue.DealerCompanyName ? '&nbsp;&bull;&nbsp;' + issue.DealerCompanyName : ''}
              ${issDate ? '&nbsp;&bull;&nbsp;' + issDate : ''}
            </div>
          </div>
        </div>
        <div style="display:flex;gap:8px;align-items:center;flex-shrink:0">
<<<<<<< HEAD
          <span style="background:rgba(255,215,0,.18);border:1px solid rgba(255,215,0,.4);color:#ffd580;
            padding:3px 10px;border-radius:20px;font-size:11px;font-weight:600;letter-spacing:.5px"
            title="All fields in the challan are editable. Changes stay local — not saved to DB.">
            <i class="fas fa-pen-to-square" style="font-size:10px"></i> Editable Preview
          </span>
=======
>>>>>>> 676f6c8848f01887d27394222d0b75be2d5763f2
          <button onclick="window._chalExport()"
            style="background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.25);
                   color:#fff;padding:5px 14px;border-radius:6px;cursor:pointer;
                   font-size:12px;display:flex;align-items:center;gap:5px;transition:background .15s"
            onmouseover="this.style.background='rgba(255,255,255,.22)'"
            onmouseout="this.style.background='rgba(255,255,255,.12)'">
            <i class="fas fa-file-export" style="color:#ffd580"></i> Export
          </button>
          <button onclick="window._chalPrint()"
            style="background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.25);
                   color:#fff;padding:5px 14px;border-radius:6px;cursor:pointer;
                   font-size:12px;display:flex;align-items:center;gap:5px;transition:background .15s"
            onmouseover="this.style.background='rgba(255,255,255,.22)'"
            onmouseout="this.style.background='rgba(255,255,255,.12)'">
            <i class="fas fa-print" style="color:#90caf9"></i> Print
          </button>
          <button id="chl-modal-close"
            style="background:rgba(220,38,38,.25);border:1px solid rgba(220,38,38,.4);
                   color:#fff;padding:5px 11px;border-radius:6px;cursor:pointer;
                   font-size:14px;line-height:1;transition:background .15s"
            onmouseover="this.style.background='rgba(220,38,38,.5)'"
            onmouseout="this.style.background='rgba(220,38,38,.25)'">
            <i class="fas fa-xmark"></i>
          </button>
        </div>
      </div>

      <!-- ── Scrollable challan area ── -->
      <div style="flex:1;overflow:auto;background:#6a6a6a;padding:28px 24px">
        <div id="chl-report-page"
          style="background:#fff;width:794px;margin:0 auto;
                 font-family:Arial,sans-serif;font-size:11.5px;
                 box-shadow:0 6px 30px rgba(0,0,0,.45)">
          <div style="padding:60px;text-align:center;color:#888">
            <i class="fas fa-spinner fa-spin fa-2x"></i><br><br>Generating Challan&#8230;
          </div>
        </div>
      </div>
    </div>`;

  document.body.appendChild(modal);

  // Close on backdrop click
  modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
  // Close button
  document.getElementById('chl-modal-close').addEventListener('click', () => modal.remove());
  // Close on ESC
  const escHandler = e => { if (e.key === 'Escape') { modal.remove(); document.removeEventListener('keydown', escHandler); } };
  document.addEventListener('keydown', escHandler);

  // ── Load data & render ─────────────────────────────────────────────────
  try {
    const [header, detail] = await Promise.all([
      api(`/api/challan/header?issueId=${issue.issueid}&deliverMode=${issue.DeliverMode || 'Courier'}&distCode=${issue.DistCode || ''}`),
      api(`/api/challan/detail?issueId=${issue.issueid}`)
    ]);
    _chalHeader = header;
    _chalDetail = detail;
    _chalRender();
    // Archive in background (fire and forget)
    if (header) api('/api/challan/header/save', { method: 'POST', body: header }).catch(() => { });
    if (detail && detail.length)
      api('/api/challan/detail/save', { method: 'POST', body: { issueId: issue.issueid, rows: detail } }).catch(() => { });
  } catch (e) {
    const page = document.getElementById('chl-report-page');
    if (page) page.innerHTML = `<div style="padding:40px;text-align:center;color:#c0392b"><i class="fas fa-times-circle"></i> Failed: ${e.message}</div>`;
  }
};

function _chalRender() {
  const h = _chalHeader || {};
  const rows = _chalDetail || [];
<<<<<<< HEAD
  const totalPcs    = rows.reduce((s, r) => s + (Number(r.Pcs)    || 0), 0);
  const totalAmount = rows.reduce((s, r) => s + (Number(r.Amount) || 0), 0);
  let challanDateStr = _chalFmtDate(h.ChallanDate);

  // Editable helper: adds contenteditable + subtle hover/focus styling
  const _CE = `contenteditable="true"`;

  const productRows = rows.map(r => `
    <tr style="background:#fff">
      <td ${_CE} style="padding:5px 8px;border:1px solid #ccc;text-align:center;color:#000;font-weight:bold;outline:none;cursor:text">${r.SrlNo || r.srlno || ''}</td>
      <td ${_CE} style="padding:5px 8px;border:1px solid #ccc;color:#000;font-weight:bold;outline:none;cursor:text">${r.ProdDesc || '-'}</td>
      <td ${_CE} style="padding:5px 8px;border:1px solid #ccc;text-align:center;color:#000;font-weight:bold;outline:none;cursor:text">${r.Pcs || 0}</td>
      <td ${_CE} style="padding:5px 8px;border:1px solid #ccc;text-align:right;color:#000;font-weight:bold;outline:none;cursor:text">${Number(r.Amount || 0).toFixed(0)}</td>
=======
  const totalPcs = rows.reduce((s, r) => s + (Number(r.Pcs) || 0), 0);
  const totalAmount = rows.reduce((s, r) => s + (Number(r.Amount) || 0), 0);
  // Format ChallanDate &#8211; SP returns DD-MM-YYYY (SQL style 105); ISO dates also handled
  let challanDateStr = _chalFmtDate(h.ChallanDate);

  const productRows = rows.map(r => `
    <tr style="background:#fff">
      <td style="padding:5px 8px;border:1px solid #ccc;text-align:center;background:#fff;color:#000;font-weight:bold">${r.SrlNo || r.srlno || ''}</td>
      <td style="padding:5px 8px;border:1px solid #ccc;background:#fff;color:#000;font-weight:bold">${r.ProdDesc || '-'}</td>
      <td style="padding:5px 8px;border:1px solid #ccc;text-align:center;background:#fff;color:#000;font-weight:bold">${r.Pcs || 0}</td>
      <td style="padding:5px 8px;border:1px solid #ccc;text-align:right;background:#fff;color:#000;font-weight:bold">${Number(r.Amount || 0).toFixed(0)}</td>
>>>>>>> 676f6c8848f01887d27394222d0b75be2d5763f2
    </tr>`).join('');

  const page = $('#chl-report-page');
  if (!page) return;
  page.innerHTML = `
<<<<<<< HEAD
  <style>
    #chl-report-page [contenteditable]:hover  { background:rgba(26,86,219,.04) !important; }
    #chl-report-page [contenteditable]:focus  { background:rgba(26,86,219,.07) !important; box-shadow:inset 0 0 0 1px rgba(26,86,219,.25); }
    @media print { #chl-report-page [contenteditable] { outline:none!important; box-shadow:none!important; background:inherit!important; } }
  </style>
  <table class="chl-outer-table" style="width:100%;border:2px solid #333;border-collapse:collapse;font-size:11.5px;font-family:Arial,sans-serif">
    <!-- Title Row -->
=======
  <table style="width:100%;border:2px solid #333;border-collapse:collapse;font-size:11.5px;font-family:Arial,sans-serif">
    <!-- -- Title Row -- -->
>>>>>>> 676f6c8848f01887d27394222d0b75be2d5763f2
    <tr>
      <td colspan="2" style="padding:10px 14px 8px;border-bottom:1px solid #999">
        <table style="width:100%;border-collapse:collapse">
          <tr>
            <td style="width:20%"></td>
            <td style="text-align:center;vertical-align:middle;padding:4px 0">
              <div style="font-size:15px;font-weight:bold;letter-spacing:1px;color:#1a1a1a">DELIVERY CHALLAN</div>
              <div style="font-size:11px;font-style:italic;color:#444">(Goods sent for Sales Promotion)</div>
            </td>
            <td style="width:20%;text-align:right;vertical-align:middle">
              <img src="/kisna-logo.png" alt="KISNA" style="max-width:110px;max-height:60px;object-fit:contain">
            </td>
          </tr>
        </table>
      </td>
    </tr>
<<<<<<< HEAD
    <!-- From / To -->
    <tr>
      <td ${_CE} style="width:50%;padding:9px 12px;vertical-align:top;border-right:1px solid #aaa;border-bottom:1px solid #aaa;color:#1a1a1a;line-height:1.7;outline:none;cursor:text">
=======
    <!-- -- From / To -- -->
    <tr>
      <td style="width:50%;padding:9px 12px;vertical-align:top;border-right:1px solid #aaa;border-bottom:1px solid #aaa;color:#1a1a1a;line-height:1.7">
>>>>>>> 676f6c8848f01887d27394222d0b75be2d5763f2
        From,${h.FromCompanyName || ''}<br>
        ${h.FromAddr1 || ''}<br>
        ${h.FromAddr2 || ''}<br>
        ${h.FromAddr3 || ''}<br>
        State:${h.FromState || ''}<br>
        Contact No-${h.FromContactNo || ''}<br>
        GST No.${h.FromGSTNo || ''}<br>
        PAN:${h.FromPAN || ''}
      </td>
<<<<<<< HEAD
      <td ${_CE} style="width:50%;padding:9px 12px;vertical-align:top;border-bottom:1px solid #aaa;color:#1a1a1a;line-height:1.7;outline:none;cursor:text">
=======
      <td style="width:50%;padding:9px 12px;vertical-align:top;border-bottom:1px solid #aaa;color:#1a1a1a;line-height:1.7">
>>>>>>> 676f6c8848f01887d27394222d0b75be2d5763f2
        To,<br>
        ${h.ToCompanyName || ''}<br>
        ${h.ToPersonName || ''}<br>
        ${h.ToAddr1 || ''} ${h.ToAddr2 || ''}<br>
        ${h.ToAddr3 || ''}<br>
        Contact No-${h.ToContactNo || ''}<br>
        GST No.${h.ToGSTNo || ''}
      </td>
    </tr>
<<<<<<< HEAD
    <!-- Challan No / Place of Sales Promotion -->
    <tr>
      <td ${_CE} style="padding:8px 12px;border-right:1px solid #aaa;border-bottom:1px solid #aaa;color:#1a1a1a;outline:none;cursor:text">
        Challan No:&nbsp;&nbsp;&nbsp;<strong>${h.ChallanNo || ''}</strong>
      </td>
      <td ${_CE} style="padding:8px 12px;border-bottom:1px solid #aaa;color:#1a1a1a;outline:none;cursor:text">
=======
    <!-- -- Challan No / Place of Sales Promotion -- -->
    <tr>
      <td style="padding:8px 12px;border-right:1px solid #aaa;border-bottom:1px solid #aaa;color:#1a1a1a">
        Challan No:&nbsp;&nbsp;&nbsp;<strong>${h.ChallanNo || ''}</strong>
      </td>
      <td style="padding:8px 12px;border-bottom:1px solid #aaa;color:#1a1a1a">
>>>>>>> 676f6c8848f01887d27394222d0b75be2d5763f2
        Place Of Sales Promotion<br>
        <strong>${h.PlaceOfSalesPromotion || ''}</strong>
      </td>
    </tr>
<<<<<<< HEAD
    <!-- Date / Transportation By -->
    <tr>
      <td ${_CE} style="padding:8px 12px;border-right:1px solid #aaa;border-bottom:1px solid #aaa;color:#1a1a1a;outline:none;cursor:text">
        Date&nbsp;&nbsp;&nbsp;:&nbsp;&nbsp;&nbsp;<strong>${challanDateStr}</strong>
      </td>
      <td id="chl-transport-td" ${_CE} style="padding:8px 12px;border-bottom:1px solid #aaa;color:#1a1a1a;outline:none;cursor:text">
        Transportation By:&nbsp;&nbsp;&nbsp;<strong>${h.TransportationBy || ''}</strong>
        ${h.trackid ? `&nbsp;&nbsp;&nbsp;Track ID-${h.trackid}` : ''}
        ${h.CourierLink ? `<br><span style="font-size:10px">Courier Tracking Link: ${h.CourierLink}</span>` : ''}
      </td>
    </tr>
    <!-- Product Description Table -->
=======
    <!-- -- Date / Transportation By -- -->
    <tr>
      <td style="padding:8px 12px;border-right:1px solid #aaa;border-bottom:1px solid #aaa;color:#1a1a1a">
        Date&nbsp;&nbsp;&nbsp;:&nbsp;&nbsp;&nbsp;<strong>${challanDateStr}</strong>
      </td>
      <td style="padding:8px 12px;border-bottom:1px solid #aaa;color:#1a1a1a">
        Transportation By:&nbsp;&nbsp;&nbsp;<strong>${h.TransportationBy || ''}</strong>
        ${h.trackid ? `&nbsp;&nbsp;&nbsp;${h.trackid}` : ''}
        ${h.CourierLink ? `<br><span style="font-size:10px">${h.CourierLink}</span>` : ''}
      </td>
    </tr>
    <!-- -- Product Description Table -- -->
>>>>>>> 676f6c8848f01887d27394222d0b75be2d5763f2
    <tr>
      <td colspan="2" style="padding:0;border-bottom:1px solid #aaa;background:#fff">
        <table style="width:100%;border-collapse:collapse;background:#fff">
          <thead>
            <tr style="background:#f5f5f5;border-bottom:1px solid #aaa">
              <th style="width:60px;padding:7px 8px;border-right:1px solid #ccc;text-align:center;font-size:11.5px;color:#000;background:#f5f5f5;font-weight:bold">Sr No</th>
              <th style="padding:7px 8px;border-right:1px solid #ccc;text-align:left;font-size:11.5px;color:#000;background:#f5f5f5;font-weight:bold">Product Description</th>
              <th style="width:70px;padding:7px 8px;border-right:1px solid #ccc;text-align:center;font-size:11.5px;color:#000;background:#f5f5f5;font-weight:bold">Pcs</th>
              <th style="width:90px;padding:7px 8px;text-align:right;font-size:11.5px;color:#000;background:#f5f5f5;font-weight:bold">Amount</th>
            </tr>
          </thead>
          <tbody style="background:#fff">
            ${productRows}
            <!-- "For Sales Promotion No Commercial Value" line -->
            <tr style="border-top:1px solid #e0e0e0;background:#fff">
              <td style="padding:5px 8px;border:1px solid #e0e0e0;background:#fff"></td>
<<<<<<< HEAD
              <td ${_CE} style="padding:5px 8px;border:1px solid #e0e0e0;font-weight:bold;color:#000;background:#fff;outline:none;cursor:text">
=======
              <td style="padding:5px 8px;border:1px solid #e0e0e0;font-weight:bold;color:#000;background:#fff">
>>>>>>> 676f6c8848f01887d27394222d0b75be2d5763f2
                ( For Sales Promotion No Commercial Value )
              </td>
              <td style="border:1px solid #e0e0e0;background:#fff"></td>
              <td style="border:1px solid #e0e0e0;background:#fff"></td>
            </tr>
            <!-- Total row -->
            <tr style="border-top:1px solid #aaa;font-weight:bold;background:#fff">
              <td style="padding:6px 8px;border:1px solid #ccc;background:#fff"></td>
              <td style="padding:6px 8px;border:1px solid #ccc;color:#000;background:#fff;font-weight:bold">Total</td>
<<<<<<< HEAD
              <td ${_CE} style="padding:6px 8px;border:1px solid #ccc;text-align:center;color:#000;background:#fff;font-weight:bold;outline:none;cursor:text">${totalPcs}</td>
              <td ${_CE} style="padding:6px 8px;border:1px solid #ccc;text-align:right;color:#000;background:#fff;font-weight:bold;outline:none;cursor:text">${totalAmount.toFixed(0)}</td>
=======
              <td style="padding:6px 8px;border:1px solid #ccc;text-align:center;color:#000;background:#fff;font-weight:bold">${totalPcs}</td>
              <td style="padding:6px 8px;border:1px solid #ccc;text-align:right;color:#000;background:#fff;font-weight:bold">${totalAmount.toFixed(0)}</td>
>>>>>>> 676f6c8848f01887d27394222d0b75be2d5763f2
            </tr>
          </tbody>
        </table>
      </td>
    </tr>
<<<<<<< HEAD
    <!-- Large empty space (fills remaining page height) -->
    <tr class="chl-blank-row"><td colspan="2" style="border-bottom:1px solid #aaa"></td></tr>
    <!-- Declaration 1 -->
    <tr>
      <td ${_CE} colspan="2" style="padding:8px 12px;border-bottom:1px solid #aaa;font-size:10.5px;color:#1a1a1a;line-height:1.5;outline:none;cursor:text">
=======
    <!-- -- Large empty space (for transport/receiver use) -- -->
    <tr><td colspan="2" style="height:180px;border-bottom:1px solid #aaa"></td></tr>
    <!-- -- Declaration 1 -- -->
    <tr>
      <td colspan="2" style="padding:8px 12px;border-bottom:1px solid #aaa;font-size:10.5px;color:#1a1a1a;line-height:1.5">
>>>>>>> 676f6c8848f01887d27394222d0b75be2d5763f2
        Declaration- Good here in mention are sent for Sales Promotion no commercial value and the same shall be processed
        / manufacture and return with in one year from the date of this document
      </td>
    </tr>
<<<<<<< HEAD
    <!-- Declaration 2 -->
    <tr>
      <td ${_CE} colspan="2" style="padding:8px 12px;border-bottom:1px solid #aaa;font-size:10.5px;color:#1a1a1a;line-height:1.5;outline:none;cursor:text">
=======
    <!-- -- Declaration 2 -- -->
    <tr>
      <td colspan="2" style="padding:8px 12px;border-bottom:1px solid #aaa;font-size:10.5px;color:#1a1a1a;line-height:1.5">
>>>>>>> 676f6c8848f01887d27394222d0b75be2d5763f2
        Declaration: (1) We declare that this Delivery Challan shows the actual price of the goods described and that all
        particulars are true and correct. (2) The diamonds herein invoiced have been purchased from legitimate sources not
        involved in funding conflict and in compliance with the United Nations Resolutions. The seller hereby guarantees that
        these diamonds are conflict free, based on personal knowledge and/or written guarantees provided by the supplier of
        these diamonds. (3) The diamonds invoiced are exclusively of natural origin and untreated based on personal knowledge
        and/or written guarantees
      </td>
    </tr>
<<<<<<< HEAD
    <!-- CIN No / Certified -->
    <tr>
      <td ${_CE} style="padding:8px 12px;border-right:1px solid #aaa;border-bottom:1px solid #aaa;font-size:10.5px;color:#1a1a1a;vertical-align:top;outline:none;cursor:text">
=======
    <!-- -- CIN No / Certified -- -->
    <tr>
      <td style="padding:8px 12px;border-right:1px solid #aaa;border-bottom:1px solid #aaa;font-size:10.5px;color:#1a1a1a;vertical-align:top">
>>>>>>> 676f6c8848f01887d27394222d0b75be2d5763f2
        CIN No &nbsp;&nbsp; ${h.CINNo || ''}
      </td>
      <td style="padding:8px 12px;border-bottom:1px solid #aaa;font-size:10.5px;color:#1a1a1a;vertical-align:top">
        Certified that the particulars given above are true and correct
      </td>
    </tr>
<<<<<<< HEAD
    <!-- Signatures -->
=======
    <!-- -- Signatures -- -->
>>>>>>> 676f6c8848f01887d27394222d0b75be2d5763f2
    <tr>
      <td style="padding:20px 12px 14px;border-right:1px solid #aaa;text-align:center;vertical-align:bottom;font-size:10.5px;color:#1a1a1a">
        <div style="border-top:1px solid #555;width:180px;margin:0 auto 6px"></div>
        <strong>Receivers signature and date</strong>
      </td>
      <td style="padding:12px 12px 14px;text-align:right;vertical-align:bottom;font-size:10.5px;color:#1a1a1a">
        <div style="font-weight:bold;font-size:11px;color:#1a1a1a;margin-bottom:60px">H. K. Jewels Pvt. Ltd. (Mumbai)</div>
        <div style="border-top:1px solid #555;width:180px;margin:0 0 6px auto"></div>
        <strong>Authorised signatory</strong>
      </td>
    </tr>
  </table>`;
<<<<<<< HEAD
  window._chalLastH = h;  // expose header for cross-page live-update
}


=======
}

>>>>>>> 676f6c8848f01887d27394222d0b75be2d5763f2
// -- Challan filename helper ------------------------------------------
function _chalFilename(ext) {
  const now = new Date(), pad = n => String(n).padStart(2, '0');
  const dt = `${pad(now.getDate())}-${pad(now.getMonth() + 1)}-${now.getFullYear()}_${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
  return `Issue_Items_Challan_${dt}.${ext}`;
}

// -- Date format helper &#8211; handles DD-MM-YYYY (SQL style 105) AND ISO strings --
function _chalFmtDate(val) {
  if (!val) return '';
  const s = String(val);
  // DD-MM-YYYY or DD/MM/YYYY already formatted by SQL CONVERT style 105
  if (/^\d{2}[-/]\d{2}[-/]\d{4}$/.test(s)) return s.replace(/-/g, '/');
  // ISO / DB datetime string
  try { const d = new Date(s); if (!isNaN(d)) return d.toLocaleDateString('en-IN'); } catch (_) { }
  return s;
}
window._chalExport = () => {
  if (!_chalDetail.length) return showToast('No challan loaded', 'error');
  const old = document.getElementById('chl-export-dlg');
  if (old) old.remove();
  const overlay = document.createElement('div');
  overlay.id = 'chl-export-dlg';
<<<<<<< HEAD
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:10000;display:flex;align-items:center;justify-content:center';
=======
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:9000;display:flex;align-items:center;justify-content:center';
>>>>>>> 676f6c8848f01887d27394222d0b75be2d5763f2
  overlay.innerHTML = `
    <div style="background:#f0f0f0;border:2px solid #aaa;border-radius:4px;width:420px;font-family:Arial,sans-serif;font-size:13px;box-shadow:0 8px 32px rgba(0,0,0,.4)">
      <div style="background:linear-gradient(to bottom,#2a5aba,#1a3e8e);color:#fff;padding:8px 14px;font-weight:bold;font-size:14px;display:flex;justify-content:space-between;align-items:center">
        <span><i class="fas fa-file-pdf" style="margin-right:6px;color:#ff6b6b"></i>Export as PDF</span>
        <span id="chl-exp-close" style="cursor:pointer;font-size:18px;line-height:1">&times;</span>
      </div>
      <div style="padding:18px 18px 14px">
        <div style="margin-bottom:16px">
          <label style="display:block;margin-bottom:4px;font-weight:600">File name:</label>
          <input id="chl-exp-name" type="text" value="${_chalFilename('pdf').replace(/\.pdf$/, '')}"
            style="width:100%;padding:6px 8px;border:1px solid #999;font-size:13px;box-sizing:border-box"/>
          <div style="font-size:11px;color:#666;margin-top:3px">Save as type: PDF (*.pdf)</div>
        </div>
        <div style="display:flex;justify-content:flex-end;gap:10px">
          <button id="chl-exp-save" style="background:#2a5aba;color:#fff;border:none;padding:7px 24px;font-size:13px;cursor:pointer;border-radius:2px">Export PDF</button>
          <button id="chl-exp-cancel" style="background:#d0d0d0;color:#333;border:1px solid #aaa;padding:7px 16px;font-size:13px;cursor:pointer;border-radius:2px">Cancel</button>
        </div>
      </div>
    </div>`;
  document.body.appendChild(overlay);
  document.getElementById('chl-exp-close').onclick = () => overlay.remove();
  document.getElementById('chl-exp-cancel').onclick = () => overlay.remove();
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
  document.getElementById('chl-exp-save').onclick = () => {
    const rawName = document.getElementById('chl-exp-name').value.trim() || _chalFilename('pdf').replace(/\.pdf$/, '');
    overlay.remove();
    _chalPrintWindow(true, rawName + '.pdf');
  };
};

<<<<<<< HEAD
// -- Print / PDF window: captures live (possibly edited) DOM --
function _chalPrintWindow(isPdf = false, pdfFilename = '') {
  const page = document.getElementById('chl-report-page');
  if (!page) return showToast('No challan loaded', 'error');

  // Capture live HTML; strip contenteditable so Chromium renders td borders correctly in print
  const capturedHTML = page.innerHTML.replace(/ contenteditable="true"/g, '');
  const docTitle = pdfFilename || _chalFilename('pdf').replace(/\.pdf$/, '');
  const origin   = location.origin;
=======
// -- Print / PDF window -----------------------------------------------
function _chalPrintWindow(isPdf = false, pdfFilename = '') {
  if (!_chalHeader) return showToast('No challan loaded', 'error');
  const h = _chalHeader || {};
  const rows = _chalDetail || [];
  const totalPcs = rows.reduce((s, r) => s + (Number(r.Pcs) || 0), 0);
  const totalAmount = rows.reduce((s, r) => s + (Number(r.Amount) || 0), 0);
  const docTitle = pdfFilename || _chalFilename('pdf').replace(/\.pdf$/, '');
  let challanDateStr = _chalFmtDate(h.ChallanDate);

  const productRows = rows.map(r => `
    <tr>
      <td style="padding:4px 7px;border:1px solid #ccc;text-align:center">${r.SrlNo || r.srlno || ''}</td>
      <td style="padding:4px 7px;border:1px solid #ccc;color:#1a56db">${r.ProdDesc || '-'}</td>
      <td style="padding:4px 7px;border:1px solid #ccc;text-align:center">${r.Pcs || 0}</td>
      <td style="padding:4px 7px;border:1px solid #ccc;text-align:right;color:#c0392b">${Number(r.Amount || 0).toFixed(0)}</td>
    </tr>`).join('');
>>>>>>> 676f6c8848f01887d27394222d0b75be2d5763f2

  const win = window.open('', '_blank', 'width=920,height=750');
  win.document.write(`<!DOCTYPE html><html><head>
    <title>${docTitle}</title>
    <style>
<<<<<<< HEAD
      @page { margin: 0; size: A4; }
      * { box-sizing: border-box; }
      html, body { height: 100%; margin: 0; }
      body { font-family:Arial,sans-serif;font-size:11px;color:#000;padding:10mm 12mm 8mm 12mm; }
      img[src^="/kisna"] { content:url("${origin}/kisna-logo.png") }
      /* Outer table stretches to full A4 content height so the footer sits at the bottom */
      .chl-outer-table { height: 100%; min-height: 240mm; width: 100%;
                         border: 2px solid #333; border-collapse: collapse; }
      /* The blank spacer row auto-expands to push the footer down */
      .chl-blank-row td { height: 100%; }
      /* Ensure all table cells retain their borders in print */
      table { border-collapse: collapse; }
      .no-print { background:#f0f4ff;border-bottom:1px solid #ccd;padding:10px;text-align:center;margin-bottom:14px }
      @media print {
        .no-print { display: none }
      }
=======
      @page { margin: 0; }
      *{box-sizing:border-box}
      body{font-family:Arial,sans-serif;font-size:11px;color:#000;margin:0;padding:10mm 12mm 8mm 12mm}
      .no-print{background:#f0f4ff;border-bottom:1px solid #ccd;padding:10px;text-align:center;margin-bottom:14px}
      @media print{.no-print{display:none}}
      table.outer{width:100%;border:2px solid #333;border-collapse:collapse}
      table.outer td,table.outer th{font-size:10.5px}
      .prod th{background:#f0f0f0;font-weight:bold;padding:5px 7px;border:1px solid #aaa;text-align:left}
      .prod td{padding:4px 7px;border:1px solid #ccc;vertical-align:middle}
>>>>>>> 676f6c8848f01887d27394222d0b75be2d5763f2
    </style>
  </head><body>
    <div class="no-print">
      <button onclick="window.print()" style="padding:6px 22px;background:#2a5aba;color:#fff;border:none;font-size:13px;cursor:pointer;border-radius:3px">&#128438; Print / Save as PDF</button>
      <button onclick="window.close()" style="margin-left:10px;padding:6px 16px;background:#ccc;color:#333;border:none;font-size:13px;cursor:pointer;border-radius:3px">Close</button>
    </div>
<<<<<<< HEAD
    ${capturedHTML}
  </body></html>`);
  win.document.close();
  if (isPdf) { setTimeout(() => { win.focus(); win.print(); }, 800); }
}

window._chalPrint = () => _chalPrintWindow(false);




=======
    <table class="outer">
      <tr>
        <td colspan="2" style="padding:10px 14px 8px;border-bottom:1px solid #999">
          <table style="width:100%;border-collapse:collapse"><tr>
            <td style="width:20%"></td>
            <td style="text-align:center">
              <div style="font-size:15px;font-weight:bold;letter-spacing:1px">DELIVERY CHALLAN</div>
              <div style="font-size:10px;font-style:italic">(Goods sent for Sales Promotion)</div>
            </td>
            <td style="width:20%;text-align:right;vertical-align:middle">
              <img src="${location.origin}/kisna-logo.png" alt="KISNA" style="max-width:110px;max-height:60px;object-fit:contain">
            </td>
          </tr></table>
        </td>
      </tr>
      <tr>
        <td style="width:50%;padding:8px 11px;vertical-align:top;border-right:1px solid #aaa;border-bottom:1px solid #aaa;line-height:1.65">
          From,${h.FromCompanyName || ''}<br>${h.FromAddr1 || ''}<br>${h.FromAddr2 || ''}<br>${h.FromAddr3 || ''}<br>
          State:${h.FromState || ''}<br>Contact No-${h.FromContactNo || ''}<br>GST No.${h.FromGSTNo || ''}<br>PAN:${h.FromPAN || ''}
        </td>
        <td style="width:50%;padding:8px 11px;vertical-align:top;border-bottom:1px solid #aaa;line-height:1.65">
          To,<br>${h.ToCompanyName || ''}<br>${h.ToPersonName || ''}<br>${h.ToAddr1 || ''} ${h.ToAddr2 || ''}<br>
          ${h.ToAddr3 || ''}<br>Contact No-${h.ToContactNo || ''}<br>GST No.${h.ToGSTNo || ''}
        </td>
      </tr>
      <tr>
        <td style="padding:7px 11px;border-right:1px solid #aaa;border-bottom:1px solid #aaa">Challan No:&nbsp;&nbsp;&nbsp;<strong>${h.ChallanNo || ''}</strong></td>
        <td style="padding:7px 11px;border-bottom:1px solid #aaa">Place Of Sales Promotion<br><strong>${h.PlaceOfSalesPromotion || ''}</strong></td>
      </tr>
      <tr>
        <td style="padding:7px 11px;border-right:1px solid #aaa;border-bottom:1px solid #aaa">Date&nbsp;&nbsp;&nbsp;:&nbsp;&nbsp;&nbsp;<strong>${challanDateStr}</strong></td>
        <td style="padding:7px 11px;border-bottom:1px solid #aaa">Transportation By:&nbsp;&nbsp;&nbsp;<strong>${h.TransportationBy || ''}</strong>${h.trackid ? '&nbsp;&nbsp;' + h.trackid : ''}</td>
      </tr>
      <tr>
        <td colspan="2" style="padding:0;border-bottom:1px solid #aaa">
          <table class="prod" style="width:100%;border-collapse:collapse">
            <thead>
              <tr style="border-bottom:1px solid #aaa">
                <th style="width:52px;border-right:1px solid #aaa;text-align:center">Sr No</th>
                <th style="border-right:1px solid #aaa;text-align:left">Product Description</th>
                <th style="width:65px;border-right:1px solid #aaa;text-align:center">Pcs</th>
                <th style="width:80px;text-align:right">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${productRows}
              <tr style="border-top:1px solid #ddd">
                <td></td>
                <td style="font-weight:bold;padding:5px 7px;border:1px solid #ccc">( For Sales Promotion No Commercial Value )</td>
                <td style="border:1px solid #ccc"></td><td style="border:1px solid #ccc"></td>
              </tr>
              <tr style="border-top:1px solid #aaa;font-weight:bold">
                <td style="padding:5px 7px;border:1px solid #ccc"></td>
                <td style="padding:5px 7px;border:1px solid #ccc">Total</td>
                <td style="padding:5px 7px;border:1px solid #ccc;text-align:center">${totalPcs}</td>
                <td style="padding:5px 7px;border:1px solid #ccc;text-align:right">${totalAmount.toFixed(0)}</td>
              </tr>
            </tbody>
          </table>
        </td>
      </tr>
      <tr><td colspan="2" style="height:160px;border-bottom:1px solid #aaa"></td></tr>
      <tr>
        <td colspan="2" style="padding:7px 11px;border-bottom:1px solid #aaa;font-size:10px;line-height:1.5">
          Declaration- Good here in mention are sent for Sales Promotion no commercial value and the same shall be processed / manufacture and return with in one year from the date of this document
        </td>
      </tr>
      <tr>
        <td colspan="2" style="padding:7px 11px;border-bottom:1px solid #aaa;font-size:10px;line-height:1.5">
          Declaration: (1) We declare that this Delivery Challan shows the actual price of the goods described and that all particulars are true and correct. (2) The diamonds herein invoiced have been purchased from legitimate sources not involved in funding conflict and in compliance with the United Nations Resolutions. The seller hereby guarantees that these diamonds are conflict free, based on personal knowledge and/or written guarantees provided by the supplier of these diamonds. (3) The diamonds invoiced are exclusively of natural origin and untreated based on personal knowledge and/or written guarantees
        </td>
      </tr>
      <tr>
        <td style="padding:7px 11px;border-right:1px solid #aaa;border-bottom:1px solid #aaa;font-size:10px;vertical-align:top">
          CIN No &nbsp;&nbsp; ${h.CINNo || ''}
        </td>
        <td style="padding:7px 11px;border-bottom:1px solid #aaa;font-size:10px;vertical-align:top">
          Certified that the particulars given above are true and correct
          
        </td>
      </tr>
      <tr>
        <td style="padding:20px 11px 12px;border-right:1px solid #aaa;text-align:center;vertical-align:bottom;font-size:10px">
          <div style="border-top:1px solid #555;width:170px;margin:0 auto 5px"></div>
          <strong>Receivers signature and date</strong>
        </td>
        <td style="padding:12px 11px 12px;text-align:right;vertical-align:bottom;font-size:10px">
          <div style="font-weight:bold;font-size:10.5px;margin-bottom:60px">H. K. Jewels Pvt. Ltd. (Mumbai)</div>
          <div style="border-top:1px solid #555;width:170px;margin:0 0 5px auto"></div>
          <strong>Authorised signatory</strong>
        </td>
      </tr>
    </table>
  </body></html>`);
  win.document.close();
  if (isPdf) { setTimeout(() => win.print(), 600); }
}
window._chalPrint = () => _chalPrintWindow(false);


>>>>>>> 676f6c8848f01887d27394222d0b75be2d5763f2
// ========================================================
// STOCK REPORT &#8594; View Items Stock
// ========================================================

let _visData = [], _visZoom = 100, _visPage = 1, _visPerPage = 25, _visFindTerm = '';

registerPage('view-items-stock', () => {
  return `
  <div style="padding:0">
    <div style="background:var(--bg-card);padding:20px 28px 16px;border-bottom:1px solid var(--border)">
      <h2 style="margin:0;font-size:18px;font-weight:700;color:var(--text-primary);display:flex;align-items:center;gap:10px">
        <i class="fas fa-eye" style="color:var(--accent)"></i> View Items Stock
      </h2>
      <div style="font-size:12px;color:var(--text-muted);margin-top:3px">Reports / Stock Report / View Items Stock</div>
    </div>
    <div class="card" style="padding:20px 24px">

      <!-- Filter row -->
      <div style="display:flex;align-items:flex-end;gap:14px;margin-bottom:18px;flex-wrap:wrap">
        <div style="display:flex;flex-direction:column;min-width:220px">
          <label style="font-size:11.5px;font-weight:600;color:var(--text-muted);margin-bottom:4px">
            Division <span style="color:var(--danger)">*</span></label>
          <select id="vis-div" style="background:var(--bg-dark);border:1px solid var(--border);border-radius:6px;padding:6px 10px;color:var(--text-primary);font-size:13px;cursor:pointer">
            <option value="">- All Divisions -</option>
          </select>
        </div>
        <button class="btn btn-primary" id="btn-vis-display" style="height:34px">
          <i class="fas fa-play"></i> Display Report</button>
        <button class="btn btn-secondary" id="btn-vis-email" style="height:34px">
          <i class="fas fa-envelope"></i> Email to Admin</button>
      </div>

      <!-- Crystal Reports-style Toolbar -->
      <div id="vis-toolbar" style="display:none;background:#e8e8e8;border:1px solid #c0c0c0;border-radius:4px 4px 0 0;padding:4px 8px;display:flex;align-items:center;gap:4px;flex-wrap:wrap">
        <!-- Export -->
        <button title="Export to CSV" onclick="window._visExport()" style="background:#d4d0c8;border:1px solid #808080;border-radius:2px;padding:3px 7px;cursor:pointer;font-size:12px;display:flex;align-items:center;gap:4px">
          <i class="fas fa-file-export" style="color:#2d6a4f;font-size:13px"></i> Export</button>
        <!-- Print -->
        <button title="Print" onclick="window._visPrint()" style="background:#d4d0c8;border:1px solid #808080;border-radius:2px;padding:3px 7px;cursor:pointer;font-size:12px;display:flex;align-items:center;gap:4px">
          <i class="fas fa-print" style="color:#333;font-size:13px"></i> Print</button>

        <div style="width:1px;height:20px;background:#999;margin:0 4px"></div>

        <!-- Page navigation -->
        <button title="First Page" onclick="window._visGoPage(1)" style="background:#d4d0c8;border:1px solid #808080;border-radius:2px;padding:3px 6px;cursor:pointer">
          <i class="fas fa-angles-left" style="font-size:11px"></i></button>
        <button title="Previous Page" onclick="window._visGoPage(_visPage-1)" style="background:#d4d0c8;border:1px solid #808080;border-radius:2px;padding:3px 6px;cursor:pointer">
          <i class="fas fa-angle-left" style="font-size:11px"></i></button>
        <span style="font-size:12px;display:flex;align-items:center;gap:4px;margin:0 2px">
          Page <input id="vis-page-input" type="number" min="1" value="1"
            style="width:46px;text-align:center;border:1px inset #999;background:#fff;font-size:12px;padding:1px 3px"
            onchange="window._visGoPage(+this.value)"/>
          <span style="color:#555">/ <span id="vis-total-pages">1</span></span>
        </span>
        <button title="Next Page" onclick="window._visGoPage(_visPage+1)" style="background:#d4d0c8;border:1px solid #808080;border-radius:2px;padding:3px 6px;cursor:pointer">
          <i class="fas fa-angle-right" style="font-size:11px"></i></button>
        <button title="Last Page" onclick="window._visGoPage(Math.ceil(_visData.length/_visPerPage))" style="background:#d4d0c8;border:1px solid #808080;border-radius:2px;padding:3px 6px;cursor:pointer">
          <i class="fas fa-angles-right" style="font-size:11px"></i></button>

        <div style="width:1px;height:20px;background:#999;margin:0 4px"></div>

        <!-- Find Text -->
        <i class="fas fa-magnifying-glass" style="font-size:12px;color:#444"></i>
        <input id="vis-find" type="text" placeholder="Find text&#8230;"
          style="border:1px inset #999;background:#fff;font-size:12px;padding:2px 5px;width:120px"
          oninput="window._visFind(this.value)"/>

        <div style="width:1px;height:20px;background:#999;margin:0 4px"></div>

        <!-- Zoom -->
        <button title="Zoom Out" onclick="window._visZoomAct(-10)" style="background:#d4d0c8;border:1px solid #808080;border-radius:2px;padding:3px 6px;cursor:pointer">
          <i class="fas fa-magnifying-glass-minus" style="font-size:11px"></i></button>
        <span id="vis-zoom-lbl" style="font-size:12px;min-width:38px;text-align:center">100%</span>
        <button title="Zoom In" onclick="window._visZoomAct(10)" style="background:#d4d0c8;border:1px solid #808080;border-radius:2px;padding:3px 6px;cursor:pointer">
          <i class="fas fa-magnifying-glass-plus" style="font-size:11px"></i></button>
      </div>

      <!-- Status bar (like Crystal Reports) -->
      <div id="vis-statusbar" style="display:none;background:#d4d0c8;border:1px solid #c0c0c0;border-top:none;padding:2px 8px;font-size:11px;color:#333;display:flex;justify-content:space-between">
        <span id="vis-status-page">Current Page No.: 1</span>
        <span id="vis-status-total">Total Page No.: 1</span>
        <span id="vis-status-zoom">Zoom Factor: 100%</span>
      </div>

      <!-- Report view area -->
      <div id="vis-report-wrap" style="display:none;background:#808080;padding:24px;min-height:400px;border:1px solid #c0c0c0;border-top:none;overflow:auto">
        <div id="vis-report-scale" style="transform-origin:top center;transition:transform .2s">
          <div id="vis-report-page" style="background:#fff;width:760px;margin:0 auto;padding:32px;font-family:Arial,sans-serif;font-size:12px;box-shadow:0 4px 18px rgba(0,0,0,.35)">
            <div style="text-align:center;margin-bottom:18px">
              <div style="font-size:16px;font-weight:bold;letter-spacing:1px;color:#1a1a1a">Items Stock</div>
            </div>
            <table id="vis-rpt-table" style="width:100%;border-collapse:collapse;font-size:11.5px">
              <thead id="vis-rpt-head">
                <tr style="background:#f0f0f0;border-top:2px solid #333;border-bottom:1px solid #333">
                  <th style="padding:5px 8px;text-align:center;width:50px;border:1px solid #ccc">Srl No</th>
                  <th style="padding:5px 8px;text-align:left;border:1px solid #ccc">Item Name</th>
                  <th style="padding:5px 8px;text-align:left;border:1px solid #ccc">Category Name</th>
                  <th style="padding:5px 8px;text-align:center;border:1px solid #ccc">Reorder Level</th>
                  <th style="padding:5px 8px;text-align:center;border:1px solid #ccc">Stock</th>
                  <th style="padding:5px 8px;text-align:center;border:1px solid #ccc">UOM</th>
                  <th style="padding:5px 8px;text-align:right;border:1px solid #ccc">Sell Price</th>
                </tr>
              </thead>
              <tbody id="vis-rpt-body">
                <tr><td colspan="7" style="text-align:center;padding:20px;color:#999">Click "Display Report" to load data.</td></tr>
              </tbody>
            </table>
            <div id="vis-rpt-footer" style="display:none;margin-top:10px;border-top:2px solid #333;padding-top:6px;display:flex;justify-content:flex-end;gap:20px;color:#1a1a1a">
              <strong style="font-size:12px;color:#1a1a1a">Total =&gt;&gt;</strong>
              <span id="vis-total-stock" style="font-size:12px;font-weight:bold;color:#1a1a1a;border:1px solid #333;padding:2px 10px;min-width:70px;text-align:center"></span>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty placeholder when no data yet -->
      <div id="vis-empty" style="padding:40px;text-align:center;color:var(--text-muted);font-size:13px">
        <i class="fas fa-chart-bar" style="font-size:40px;opacity:.2;display:block;margin-bottom:10px"></i>
        Select a Division and click <strong>Display Report</strong> to generate the stock report.
      </div>
    </div>
  </div>`;
});

window._pageBinders['view-items-stock'] = async () => {
  _visData = []; _visZoom = 100; _visPage = 1; _visFindTerm = '';

  // Load divisions (status='Y' only)
  let divs = [];
  try { divs = await api('/api/divisions'); } catch (_) { }
  const divSel = $('#vis-div');
  if (divSel) divs.filter(d => (d.Status || d.status || 'Y') === 'Y').forEach(d =>
    divSel.insertAdjacentHTML('beforeend', `<option value="${d.DivisionId || d.DivisionID}">${d.DivisionName}</option>`));

  $('#btn-vis-display').onclick = () => _visDisplay();
  $('#btn-vis-email').onclick = () => _visEmail();
};

async function _visDisplay() {
  const divId = $('#vis-div')?.value || '';
  try {
    let url = '/api/reports/sp-view-items-stock';
    if (divId) url += `?divisionId=${divId}`;
    _visData = await api(url);
  } catch (e) { showToast('Failed to load: ' + e.message, 'error'); return; }
  _visPage = 1; _visFindTerm = '';
  const findEl = $('#vis-find'); if (findEl) findEl.value = '';

  // Show toolbar, status bar, report area; hide empty placeholder
  const toolbar = $('#vis-toolbar'); if (toolbar) toolbar.style.display = 'flex';
  const sb = $('#vis-statusbar'); if (sb) sb.style.display = 'flex';
  const wrap = $('#vis-report-wrap'); if (wrap) wrap.style.display = 'block';
  const empty = $('#vis-empty'); if (empty) empty.style.display = 'none';

  _visRender();
}

function _visFilter() {
  if (!_visFindTerm) return _visData;
  const t = _visFindTerm.toLowerCase();
  return _visData.filter(r =>
    (r.ItemName || '').toLowerCase().includes(t) ||
    (r.categoryname || r.CategoryName || '').toLowerCase().includes(t));
}

function _visRender() {
  const filtered = _visFilter();
  const totalPages = Math.max(1, Math.ceil(filtered.length / _visPerPage));
  if (_visPage > totalPages) _visPage = totalPages;
  if (_visPage < 1) _visPage = 1;

  const start = (_visPage - 1) * _visPerPage;
  const pageRows = filtered.slice(start, start + _visPerPage);

  const tbody = $('#vis-rpt-body');
  if (!tbody) return;
  tbody.innerHTML = pageRows.length ? pageRows.map((r, i) => {
    const srNo = start + i + 1;
    const lowStock = (r.Stock || 0) <= (r.ReorderLevel || 0);
    // Explicit dark colors + underline on every TD to prevent dark-theme CSS bleed on white background
    const rowBg = lowStock ? '' : i % 2 === 0 ? 'background:#fafafa;' : '';
    const txtCol = lowStock ? 'color:#c0392b;' : 'color:#1a1a1a;';
    const txtDeco = lowStock ? 'text-decoration:underline;' : '';
    const base = `${rowBg}${txtCol}${txtDeco}`;
    return `<tr>
      <td style="${base}padding:4px 8px;text-align:center;border:1px solid #e0e0e0">${srNo}</td>
      <td style="${base}padding:4px 8px;border:1px solid #e0e0e0;color:${lowStock ? '#c0392b' : '#1a56db'}">${r.ItemName || '-'}</td>
      <td style="${base}padding:4px 8px;border:1px solid #e0e0e0">${r.categoryname || r.CategoryName || '-'}</td>
      <td style="${base}padding:4px 8px;text-align:center;border:1px solid #e0e0e0">${r.ReorderLevel || 0}</td>
      <td style="${base}padding:4px 8px;text-align:center;border:1px solid #e0e0e0;font-weight:600">${r.Stock || 0}</td>
      <td style="${base}padding:4px 8px;text-align:center;border:1px solid #e0e0e0">${r.uom || r.UOM || '-'}</td>
      <td style="${base}padding:4px 8px;text-align:right;border:1px solid #e0e0e0">${Number(r.SellPrice || 0).toFixed(2)}</td>
    </tr>`;
  }).join('') : `<tr><td colspan="7" style="text-align:center;padding:20px;color:#999">No records found.</td></tr>`;

  // Total stock across ALL data (not just current page)
  const totalStock = $('#vis-total-stock');
  if (totalStock) totalStock.textContent = filtered.reduce((s, r) => s + (+r.Stock || 0), 0).toLocaleString('en-IN');
  const footer = $('#vis-rpt-footer'); if (footer) footer.style.display = 'flex';

  // Update page nav
  const tp = $('#vis-total-pages'); if (tp) tp.textContent = totalPages;
  const pi = $('#vis-page-input'); if (pi) pi.value = _visPage;
  if (pi) pi.max = totalPages;

  // Status bar
  const sPage = $('#vis-status-page'); if (sPage) sPage.textContent = `Current Page No.: ${_visPage}`;
  const sTotal = $('#vis-status-total'); if (sTotal) sTotal.textContent = `Total Page No.: ${totalPages}`;
  const sZoom = $('#vis-status-zoom'); if (sZoom) sZoom.textContent = `Zoom Factor: ${_visZoom}%`;
}

window._visGoPage = (n) => {
  const totalPages = Math.max(1, Math.ceil(_visFilter().length / _visPerPage));
  _visPage = Math.max(1, Math.min(n, totalPages));
  _visRender();
};
window._visFind = (term) => {
  _visFindTerm = term.trim();
  _visPage = 1;
  _visRender();
};
window._visZoomAct = (delta) => {
  _visZoom = Math.max(50, Math.min(200, _visZoom + delta));
  const lbl = $('#vis-zoom-lbl'); if (lbl) lbl.textContent = _visZoom + '%';
  const scale = $('#vis-report-scale');
  if (scale) scale.style.transform = `scale(${_visZoom / 100})`;
  const sZoom = $('#vis-status-zoom'); if (sZoom) sZoom.textContent = `Zoom Factor: ${_visZoom}%`;
};
// ---- Helper: generate dated filename ----
function _visFilename(ext) {
  const now = new Date();
  const pad = n => String(n).padStart(2, '0');
  const dt = `${pad(now.getDate())}-${pad(now.getMonth() + 1)}-${now.getFullYear()}_${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
  return `View_Items_Stock_${dt}.${ext}`;
}

// ---- Export: show Crystal Reports-style format dialog ----
window._visExport = () => {
  if (!_visData.length) return showToast('No data to export', 'error');
  // Remove existing dialog if any
  const old = document.getElementById('vis-export-dlg');
  if (old) old.remove();

  const overlay = document.createElement('div');
  overlay.id = 'vis-export-dlg';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:9000;display:flex;align-items:center;justify-content:center';
  overlay.innerHTML = `
    <div style="background:#f0f0f0;border:2px solid #aaa;border-radius:4px;width:460px;font-family:Arial,sans-serif;font-size:13px;box-shadow:0 8px 32px rgba(0,0,0,.4)">
      <div style="background:linear-gradient(to bottom,#2a5aba,#1a3e8e);color:#fff;padding:8px 14px;font-weight:bold;font-size:14px;display:flex;justify-content:space-between;align-items:center">
        <span>Export Report</span>
        <span id="vis-exp-close" style="cursor:pointer;font-size:18px;line-height:1">&times;</span>
      </div>
      <div style="padding:18px 18px 12px">
        <div style="margin-bottom:14px">
          <label style="display:block;margin-bottom:4px;font-weight:600">File name:</label>
          <input id="vis-exp-name" type="text" value="${_visFilename('pdf').replace(/\.pdf$/, '')}"
            style="width:100%;padding:5px 8px;border:1px solid #999;font-size:13px;box-sizing:border-box"/>
        </div>
        <div style="margin-bottom:18px">
          <label style="display:block;margin-bottom:4px;font-weight:600">Save as type:</label>
          <select id="vis-exp-type" style="width:100%;padding:5px 8px;border:1px solid #999;font-size:13px">
            <option value="pdf">PDF (*.pdf)</option>
            <option value="csv">Character Separated Values (CSV) (*.csv)</option>
            <option value="xml">XML (*.xml)</option>
            <option value="rtf">Rich Text Format (RTF) (*.rtf)</option>
          </select>
        </div>
        <div style="display:flex;justify-content:flex-end;gap:10px">
          <button id="vis-exp-save" style="background:#2a5aba;color:#fff;border:none;padding:6px 22px;font-size:13px;cursor:pointer;border-radius:2px">Save</button>
          <button id="vis-exp-cancel" style="background:#d0d0d0;color:#333;border:1px solid #aaa;padding:6px 16px;font-size:13px;cursor:pointer;border-radius:2px">Cancel</button>
        </div>
      </div>
    </div>`;
  document.body.appendChild(overlay);
  document.getElementById('vis-exp-close').onclick = () => overlay.remove();
  document.getElementById('vis-exp-cancel').onclick = () => overlay.remove();
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });

  document.getElementById('vis-exp-save').onclick = async () => {
    const fmt = document.getElementById('vis-exp-type').value;
    const rawName = document.getElementById('vis-exp-name').value.trim() || _visFilename(fmt).replace(/\.\w+$/, '');
    const filename = `${rawName}.${fmt}`;
    const filtered = _visFilter();
    overlay.remove();

    if (fmt === 'pdf') {
      // PDF &#8594; open sealed print window with ALL rows, user prints/saves as PDF
      _visPrintAll(true, filename);
      return;
    }

    let content = '', mime = '';
    if (fmt === 'csv') {
      const hdr = ['Sr No', 'Item Name', 'Category Name', 'Reorder Level', 'Stock', 'UOM', 'Sell Price'];
      const rows = filtered.map((r, i) => [i + 1, r.ItemName || '', r.categoryname || r.CategoryName || '', r.ReorderLevel || 0, r.Stock || 0, r.uom || r.UOM || '', Number(r.SellPrice || 0).toFixed(2)]);
      content = [hdr, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
      mime = 'text/csv';
    } else if (fmt === 'xlsx') {
      // Excel-compatible HTML table saved as .xlsx - red+underline for low stock rows
      const hdr = ['Sr No', 'Item Name', 'Category Name', 'Reorder Level', 'Stock', 'UOM', 'Sell Price'];
      const xlsRows = filtered.map((r, i) => {
        const low = (Number(r.Stock) || 0) <= (Number(r.ReorderLevel) || 0);
        const cs = low ? ' style="color:#c0392b;text-decoration:underline;font-weight:bold"' : '';
        return `<tr>
          <td${cs}>${i + 1}</td>
          <td${cs}>${r.ItemName || ''}</td>
          <td${cs}>${r.categoryname || r.CategoryName || ''}</td>
          <td${cs}>${r.ReorderLevel || 0}</td>
          <td${cs}>${r.Stock || 0}</td>
          <td${cs}>${r.uom || r.UOM || ''}</td>
          <td${cs}>${Number(r.SellPrice || 0).toFixed(2)}</td>
        </tr>`;
      }).join('');
      const thStyle = 'style="background:#1a3e8e;color:#fff;padding:5px 8px;border:1px solid #2a5aba"';
      content = `<html><head><meta charset="UTF-8"></head><body>
        <table border="1" style="border-collapse:collapse;font-family:Arial;font-size:11px">
          <thead><tr>${hdr.map(h => `<th ${thStyle}>${h}</th>`).join('')}</tr></thead>
          <tbody>${xlsRows}</tbody>
        </table>
      </body></html>`;
      mime = 'application/vnd.ms-excel';
    } else if (fmt === 'xml') {
      const rows = filtered.map((r, i) => `  <Item><SrNo>${i + 1}</SrNo><ItemName>${(r.ItemName || '').replace(/&/g, '&amp;')}</ItemName><CategoryName>${(r.categoryname || r.CategoryName || '').replace(/&/g, '&amp;')}</CategoryName><ReorderLevel>${r.ReorderLevel || 0}</ReorderLevel><Stock>${r.Stock || 0}</Stock><UOM>${r.uom || r.UOM || ''}</UOM><SellPrice>${Number(r.SellPrice || 0).toFixed(2)}</SellPrice></Item>`);
      content = `<?xml version="1.0" encoding="UTF-8"?>\n<ItemsStock>\n${rows.join('\n')}\n</ItemsStock>`;
      mime = 'application/xml';
    } else if (fmt === 'rtf') {
      const hdr = 'Sr No\tItem Name\tCategory\tReorder Level\tStock\tUOM\tSell Price';
      const rows = filtered.map((r, i) => `${i + 1}\t${r.ItemName || ''}\t${r.categoryname || r.CategoryName || ''}\t${r.ReorderLevel || 0}\t${r.Stock || 0}\t${r.uom || r.UOM || ''}\t${Number(r.SellPrice || 0).toFixed(2)}`).join('\n');
      content = `{\\rtf1\\ansi\\deff0 {\\fonttbl {\\f0 Arial;}}\\f0\\fs20 Items Stock\\par\\par ${hdr}\\par ${rows}}`;
      mime = 'application/rtf';
    }

    // Use showSaveFilePicker if available (Chrome/Edge &#8594; native OS Save dialog)
    if (window.showSaveFilePicker) {
      const mimeMap = { csv: 'text/csv', xlsx: 'application/vnd.ms-excel', xml: 'application/xml', rtf: 'application/rtf' };
      const extMap = { csv: ['.csv'], xlsx: ['.xlsx'], xml: ['.xml'], rtf: ['.rtf'] };
      try {
        const fh = await window.showSaveFilePicker({
          suggestedName: filename,
          types: [{ description: fmt.toUpperCase() + ' file', accept: { [mimeMap[fmt]]: extMap[fmt] } }]
        });
        const writ = await fh.createWritable();
        await writ.write(new Blob([content], { type: mime }));
        await writ.close();
        showToast(`Exported as ${filename}`);
      } catch (e) { if (e.name !== 'AbortError') showToast('Export cancelled', 'info'); }
    } else {
      // Fallback: auto-download
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([content], { type: mime }));
      a.download = filename; a.click();
      showToast(`Downloaded ${filename}`);
    }
  };
};

// ---- Print / PDF: ALL items seamlessly, single title, red+underline low-stock ----
function _visPrintAll(isPdfExport = false, pdfFilename = '') {
  const filtered = _visFilter();
  if (!filtered.length) return showToast('No data to print', 'error');
  const divName = $('#vis-div')?.selectedOptions[0]?.text || 'All Divisions';
  const totalStock = filtered.reduce((s, r) => s + (+r.Stock || 0), 0).toLocaleString('en-IN');
  const now = new Date();
  // Use supplied pdf filename or generate fresh one
  const docTitle = pdfFilename || _visFilename('pdf').replace(/\.pdf$/, '');

  const rows = filtered.map((r, i) => {
    const lowStock = (r.Stock || 0) <= (r.ReorderLevel || 0);
    // RED colour + underline for low stock &#8594; visible in colour print/PDF; underline alone works in B&W
    const rowStyle = lowStock
      ? 'color:#c0392b;text-decoration:underline;'
      : i % 2 === 0 ? 'background:#f8f8f8;' : '';
    return `<tr style="${rowStyle}">
      <td style="text-align:center">${i + 1}</td>
      <td>${r.ItemName || '-'}</td>
      <td>${r.categoryname || r.CategoryName || '-'}</td>
      <td style="text-align:center">${r.ReorderLevel || 0}</td>
      <td style="text-align:center;font-weight:600">${r.Stock || 0}</td>
      <td style="text-align:center">${r.uom || r.UOM || '-'}</td>
      <td style="text-align:right">${Number(r.SellPrice || 0).toFixed(2)}</td>
    </tr>`;
  }).join('');

  const win = window.open('', '_blank', 'width=900,height=700');
  win.document.write(`<!DOCTYPE html><html><head>
    <title>${docTitle}</title>
    <style>
      /* @page margin:0 suppresses browser-default header (URL) and footer (about:blank / date)
         so the page title and generated date appear only once - inside our own content */
      @page { margin: 0; }
      *{box-sizing:border-box}
      body{font-family:Arial,sans-serif;font-size:11px;color:#000;margin:0;padding:14mm 14mm 10mm 14mm}
      h2{text-align:center;font-size:15px;margin-bottom:3px;letter-spacing:1px}
      .sub{text-align:center;font-size:10px;color:#555;margin-bottom:14px}
      table{width:100%;border-collapse:collapse;page-break-inside:auto}
      tr{page-break-inside:avoid;page-break-after:auto}
      th{background:#e0e0e0;font-weight:bold;padding:5px 7px;border:1px solid #aaa;font-size:11px;text-align:left;color:#000}
      td{padding:4px 7px;border:1px solid #ccc;font-size:10.5px;vertical-align:middle}
      td:first-child,td:nth-child(4),td:nth-child(5),td:nth-child(6){text-align:center}
      td:last-child{text-align:right}
      .footer-row{margin-top:8px;display:flex;justify-content:flex-end;gap:16px;font-weight:bold;font-size:11px;border-top:2px solid #333;padding-top:5px;color:#000}
      .footer-box{border:1px solid #333;padding:2px 14px;min-width:80px;text-align:center}
      .no-print{background:#f0f4ff;border-bottom:1px solid #ccd;padding:10px;text-align:center;margin-bottom:16px}
      @media print{ .no-print{display:none} }
    </style>
  </head>
  <body>
    <div class="no-print">
      <button onclick="window.print()" style="padding:6px 22px;background:#2a5aba;color:#fff;border:none;font-size:13px;cursor:pointer;border-radius:3px">&#128438; Print / Save as PDF</button>
      <button onclick="window.close()" style="margin-left:10px;padding:6px 16px;background:#ccc;color:#333;border:none;font-size:13px;cursor:pointer;border-radius:3px">Close</button>
      <span style="margin-left:18px;font-size:11px;color:#555">Tip: In print dialog uncheck "Headers and footers" if you see duplicates.</span>
    </div>
    <h2>Items Stock</h2>
    <p class="sub">Division: ${divName} &nbsp;|&nbsp; Generated: ${now.toLocaleDateString('en-IN')} ${now.toLocaleTimeString('en-IN')}</p>
    <table>
      <thead>
        <tr>
          <th style="width:46px">Srl No</th><th>Item Name</th><th>Category Name</th>
          <th style="width:90px">Reorder Level</th><th style="width:60px">Stock</th>
          <th style="width:55px">UOM</th><th style="width:72px">Sell Price</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    <div class="footer-row">
      <span>Total &raquo;</span>
      <span class="footer-box">${totalStock}</span>
    </div>
  </body></html>`);
  win.document.close();
  if (isPdfExport) { setTimeout(() => win.print(), 600); }
};
window._visPrint = () => _visPrintAll(false);

window._visEmail = async () => {
  const divEl = $('#vis-div');
  const divId = divEl?.value || null;
  const divName = divEl?.selectedOptions[0]?.text || 'All Divisions';

  const btn = $('#btn-vis-email');
  if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending&#8230;'; }
  showToast('Sending report to dataanalysis5@kisna.com&#8230;', 'info');

  try {
    const res = await api('/api/reports/email-stock-report', {
      method: 'POST',
      body: { divisionId: divId ? parseInt(divId) : null, divisionName: divName }
    });
    showToast(
      `&#x2705; Email sent! Items: ${res.totalItems} | Total Stock: ${Number(res.totalStock).toLocaleString('en-IN')} | Low Stock: ${res.lowStockCount} | CSV: ${res.csvFilename}`,
      'success'
    );
  } catch (e) {
    showToast('Failed to send email: ' + e.message, 'error');
  } finally {
    if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-envelope"></i> Email to Admin'; }
  }
};

// ========================================================
// STOCK REPORT &#8594; Item Stock Report (existing, preserved)
// ========================================================
registerPage('report-stock', async () => {
  return `${pageHeader('Item Stock Report', 'fa-chart-bar', 'Reports / Stock Report / Item Stock Report')}
  <div class="report-filters">
    <div class="form-field">
      <label>Division</label>
      <select id="rpt-stock-div"><option value="">All Divisions</option></select>
    </div>
    <button class="btn btn-primary" id="btn-stock-run"><i class="fas fa-play"></i> Run Report</button>
    <button class="btn btn-secondary" id="btn-stock-export"><i class="fas fa-file-excel"></i> Export CSV</button>
  </div>
  <div class="card">
    <div class="table-wrapper"><table id="tbl-stock-report">
      <thead><tr><th>Sr No</th><th>Item Name</th><th>Category</th><th>Division</th><th>UOM</th><th>Stock</th><th>Reorder Level</th><th>Sell Price</th><th>Status</th></tr></thead>
      <tbody id="tbl-stock-body"><tr class="empty-row"><td colspan="9">Click "Run Report" to load data.</td></tr></tbody>
    </table></div>
  </div></div>`;
});
window._pageBinders['report-stock'] = async () => {
  const divs = await api('/api/divisions');
  const sel = $('#rpt-stock-div');
  divs.forEach(d => sel.innerHTML += `<option value="${d.DivisionID || d.DivisionId}">${d.DivisionName}</option>`);
  const runReport = async () => {
    const divId = sel.value;
    const data = await api('/api/reports/item-stock' + (divId ? `?divisionId=${divId}` : ''));
    const tbody = $('#tbl-stock-body');
    tbody.innerHTML = data.length ? data.map((d, i) => `<tr>
      <td style="text-align:center">${i + 1}</td>
      <td><strong>${d.ItemName}</strong></td>
      <td>${d.CategoryName || '-'}</td><td>${d.DivisionName || '-'}</td>
      <td>${d.uom || d.UOM || '-'}</td>
      <td><span class="badge ${(d.Stock || 0) <= (d.ReorderLevel || 0) ? 'badge-danger' : 'badge-success'}">${d.Stock || 0}</span></td>
      <td>${d.ReorderLevel || 0}</td>
      <td>&#8377;${fmtNum(d.SellPrice)}</td>
      <td>${(d.Stock || 0) <= (d.ReorderLevel || 0) ? '<span class="badge badge-danger">Low Stock</span>' : '<span class="badge badge-success">OK</span>'}</td>
    </tr>`).join('') : `<tr class="empty-row"><td colspan="9">No data.</td></tr>`;
  };
  $('#btn-stock-run').onclick = runReport;
  $('#btn-stock-export').onclick = () => exportTableCSV('tbl-stock-report', 'item_stock_report.csv');
  await runReport();
};

// ========================================================
// INVENTORY REPORT
// ========================================================
let _invData = [], _invType = '', _invSortCol = -1, _invSortDir = 1;

const _invInwardCols = ['OrderNumber', 'DCNumber', 'InvoiceNumber', 'InwardDate', 'VendorName', 'CategoryName', 'ItemName', 'TotalQty', 'DCQty'];
const _invInwardHdrs = ['Order No', 'DC Number', 'Invoice Number', 'Inward Date', 'Vendor', 'Category', 'Item Name', 'Total Qty', 'DC Qty'];
<<<<<<< HEAD
const _invOutwardCols = ['ChallanNo', 'DistCode', 'DealerCompanyName', 'ContactPersonName', 'Addr1', 'Addr2', 'Addr3', 'Mobile', 'GST', 'PlaceOfSalesPromotion', 'RequestMode', 'DeliverMode', 'DeliverByPersonName', 'CourierName', 'TrackId', 'CourierPersonMob', 'CourierPersonLocation', 'IssueNote', 'ItemName', 'RequestQty', 'IssueQty', 'IssueDate'];
const _invOutwardHdrs = ['Challan No', 'Distinct Code', 'Dealer Company', 'Contact Person', 'Addr 1', 'Addr 2', 'Addr 3', 'Mobile', 'GST', 'Place of Sales Promotion', 'Request Mode', 'Deliver Mode', 'Deliver By', 'Courier Name', 'Track ID', 'Courier Mob', 'Courier Location', 'Issue Note', 'Item Name', 'Req Qty', 'Issue Qty', 'Issue Date'];
=======
const _invOutwardCols = ['ChallanNo', 'DealerCompanyName', 'ContactPersonName', 'Addr1', 'Addr2', 'Addr3', 'Mobile', 'GST', 'PlaceOfSalesPromotion', 'RequestMode', 'DeliverMode', 'DeliverByPersonName', 'CourierName', 'TrackId', 'CourierPersonMob', 'CourierPersonLocation', 'IssueNote', 'ItemName', 'RequestQty', 'IssueQty', 'IssueDate'];
const _invOutwardHdrs = ['Challan No', 'Dealer Company', 'Contact Person', 'Addr 1', 'Addr 2', 'Addr 3', 'Mobile', 'GST', 'Place of Sales Promotion', 'Request Mode', 'Deliver Mode', 'Deliver By', 'Courier Name', 'Track ID', 'Courier Mob', 'Courier Location', 'Issue Note', 'Item Name', 'Req Qty', 'Issue Qty', 'Issue Date'];
>>>>>>> 676f6c8848f01887d27394222d0b75be2d5763f2

registerPage('inventory-report', async () => {
  return `${pageHeader('Inventory Report', 'fa-clipboard-list', 'Reports / Inventory Report')}
  <div class="card">
    <!-- Row 1: Division -->
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;flex-wrap:wrap">
      <label style="font-weight:600;white-space:nowrap">Division: <span style="color:#e74c3c">*</span></label>
      <select id="inv-div" style="min-width:180px;padding:5px 8px;border:1px solid #ccc;border-radius:3px;font-size:13px">
        <option value="0">All</option>
      </select>
    </div>

    <!-- Row 2: Date mode -->
    <div style="display:flex;align-items:center;gap:16px;margin-bottom:14px;flex-wrap:wrap">
      <label style="display:flex;align-items:center;gap:5px;font-size:13px;cursor:pointer">
        <input type="radio" name="inv-date-mode" id="inv-date-all" value="all" checked> All
      </label>
      <label style="display:flex;align-items:center;gap:5px;font-size:13px;cursor:pointer">
        <input type="radio" name="inv-date-mode" id="inv-date-range" value="range"> Select Date Range
      </label>
      <div id="inv-date-fields" style="display:flex;align-items:center;gap:8px;opacity:0.4;pointer-events:none">
        <label style="font-size:13px;white-space:nowrap">From Date:</label>
        <input type="date" id="inv-from" style="padding:4px 7px;border:1px solid #ccc;border-radius:3px;font-size:13px">
        <label style="font-size:13px;white-space:nowrap">To Date:</label>
        <input type="date" id="inv-to" style="padding:4px 7px;border:1px solid #ccc;border-radius:3px;font-size:13px">
      </div>
    </div>

    <!-- Row 3: Action buttons -->
    <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
      <button id="btn-inward-display" class="btn btn-primary" style="padding:6px 20px;font-size:13px">
        <i class="fas fa-arrow-down" style="color:#4caf50"></i> Display Inward
      </button>
      <button id="btn-outward-display" class="btn btn-primary" style="padding:6px 20px;font-size:13px">
        <i class="fas fa-arrow-up" style="color:#ff9800"></i> Display Outward
      </button>
      <div style="margin-left:auto;display:flex;gap:8px;align-items:center">
        <!-- Export dropdown -->
        <div style="position:relative">
          <button id="btn-inv-export" class="btn btn-secondary" style="padding:6px 16px;font-size:13px">
            <i class="fas fa-file-export" style="color:#1d6f42"></i> Export <i class="fas fa-caret-down" style="font-size:11px"></i>
          </button>
          <div id="inv-export-menu" style="display:none;position:absolute;right:0;top:110%;background:#fff;border:1px solid #ccc;box-shadow:0 4px 14px rgba(0,0,0,.18);z-index:500;min-width:150px;border-radius:3px">
            <div onclick="window._invExportFmt('csv')" style="padding:9px 16px;cursor:pointer;font-size:13px;display:flex;align-items:center;gap:8px" onmouseover="this.style.background='#f0f4ff'" onmouseout="this.style.background='#fff'">
              <i class="fas fa-file-csv" style="color:#1d6f42"></i> CSV (*.csv)
            </div>
            <div onclick="window._invExportFmt('pdf')" style="padding:9px 16px;cursor:pointer;font-size:13px;display:flex;align-items:center;gap:8px;border-top:1px solid #eee" onmouseover="this.style.background='#f0f4ff'" onmouseout="this.style.background='#fff'">
              <i class="fas fa-file-pdf" style="color:#e74c3c"></i> PDF (*.pdf)
            </div>
          </div>
        </div>
        <button id="btn-inv-reset" class="btn btn-secondary" style="padding:6px 16px;font-size:13px">
          <i class="fas fa-rotate-left"></i> Reset
        </button>
      </div>
    </div>
  </div>

  <!-- Preview in separate section -->
  <div id="inv-preview-wrap" style="display:none;margin-top:16px">
    <div class="card">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
        <div style="font-size:13px;font-weight:600;color:var(--text-primary)" id="inv-preview-label"></div>
        <div style="font-size:12px;color:#888" id="inv-row-count"></div>
      </div>
      <div class="table-wrapper" style="max-height:460px;overflow:auto">
        <table id="tbl-inv-report" style="width:100%;border-collapse:collapse;font-size:12px">
          <thead id="inv-thead" style="background:#1a3e8e;color:#fff;position:sticky;top:0"></thead>
          <tbody id="inv-tbody"><tr><td colspan="10" style="text-align:center;padding:20px;color:#999">Select filters and click Display Inward or Display Outward.</td></tr></tbody>
        </table>
      </div>
    </div>
  </div>`;
});

window._pageBinders['inventory-report'] = async () => {
  _invData = []; _invType = ''; _invSortCol = -1; _invSortDir = 1;

  // Load divisions (Status='Y')
  try {
    const divs = await api('/api/divisions');
    const sel = $('#inv-div');
    divs.filter(d => (d.Status || d.status || 'Y') === 'Y').forEach(d =>
      sel.insertAdjacentHTML('beforeend', `<option value="${d.DivisionId || d.DivisionID}">${d.DivisionName}</option>`));
  } catch (_) { }

  // Default dates (today)
  const today = new Date().toISOString().split('T')[0];
  $('#inv-from').value = today;
  $('#inv-to').value = today;

  // Radio toggle
  $$('input[name="inv-date-mode"]').forEach(r => {
    r.onchange = () => {
      const isRange = $('#inv-date-range').checked;
      const df = $('#inv-date-fields');
      df.style.opacity = isRange ? '1' : '0.4';
      df.style.pointerEvents = isRange ? 'auto' : 'none';
    };
  });

  // Display buttons
  $('#btn-inward-display').onclick = () => _invLoad('inward');
  $('#btn-outward-display').onclick = () => _invLoad('outward');

  // Export dropdown toggle
  $('#btn-inv-export').onclick = (e) => {
    e.stopPropagation();
    const menu = $('#inv-export-menu');
    if (!menu) return;
    const open = menu.style.display === 'block';
    menu.style.display = open ? 'none' : 'block';
    if (!open) {
      const close = (ev) => { if (!ev.target.closest('#btn-inv-export') && !ev.target.closest('#inv-export-menu')) { menu.style.display = 'none'; document.removeEventListener('click', close); } };
      setTimeout(() => document.addEventListener('click', close), 0);
    }
  };

  // Reset
  $('#btn-inv-reset').onclick = () => {
    $('#inv-div').value = '0';
    $('#inv-date-all').checked = true;
    $('#inv-date-range').checked = false;
    const df = $('#inv-date-fields');
    df.style.opacity = '0.4'; df.style.pointerEvents = 'none';
    $('#inv-from').value = today; $('#inv-to').value = today;
    _invData = []; _invType = '';
    const wrap = $('#inv-preview-wrap'); if (wrap) wrap.style.display = 'none';
    const menu = $('#inv-export-menu'); if (menu) menu.style.display = 'none';
  };
};

async function _invLoad(type) {
  const divId = $('#inv-div').value || '0';
  const dateMode = $('#inv-date-range').checked ? 'range' : 'all';
  const fromDate = $('#inv-from').value;
  const toDate = $('#inv-to').value;

  if (dateMode === 'range' && (!fromDate || !toDate)) {
    return showToast('Please select both From Date and To Date.', 'error');
  }

  const btn = type === 'inward' ? $('#btn-inward-display') : $('#btn-outward-display');
  if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading&#8230;'; }

  try {
    const params = new URLSearchParams({ divisionId: divId, dateMode, fromDate, toDate });
    _invData = await api(`/api/inventory-report/${type}?${params}`);
    _invType = type;
    _invSortCol = -1; _invSortDir = 1;
    _invRenderTable();
    const wrap = $('#inv-preview-wrap');
    if (wrap) wrap.style.display = 'block';
    const lbl = $('#inv-preview-label');
    if (lbl) lbl.textContent = `Showing ${type === 'inward' ? 'Inward' : 'Outward'} Entries - ${_invData.length} record(s)`;
    const cnt = $('#inv-row-count');
    if (cnt) cnt.textContent = `Total records: ${_invData.length}`;
  } catch (e) {
    showToast('Failed: ' + e.message, 'error');
  } finally {
    const label = type === 'inward' ? '<i class="fas fa-arrow-down" style="color:#4caf50"></i> Display Inward'
      : '<i class="fas fa-arrow-up" style="color:#ff9800"></i> Display Outward';
    if (btn) { btn.disabled = false; btn.innerHTML = label; }
  }
}

function _invRenderTable() {
  const cols = _invType === 'inward' ? _invInwardCols : _invOutwardCols;
  const hdrs = _invType === 'inward' ? _invInwardHdrs : _invOutwardHdrs;

  // Sort data
  let rows = [..._invData];
  if (_invSortCol >= 0) {
    const key = cols[_invSortCol];
    rows.sort((a, b) => {
      const av = a[key] ?? '', bv = b[key] ?? '';
      return _invSortDir * (isNaN(av) || isNaN(bv)
        ? String(av).localeCompare(String(bv))
        : Number(av) - Number(bv));
    });
  }

  // Header
  const thead = $('#inv-thead');
  if (thead) thead.innerHTML = `<tr>${hdrs.map((h, i) => `
    <th onclick="window._invSort(${i})" style="padding:7px 9px;border:1px solid #2a5aba;text-align:left;cursor:pointer;user-select:none;white-space:nowrap">
      ${h} ${_invSortCol === i ? (_invSortDir === 1 ? '&#9650;' : '&#9660;') : ''}
    </th>`).join('')}</tr>`;

  // Body
  const tbody = $('#inv-tbody');
  if (!tbody) return;
  if (!rows.length) {
    tbody.innerHTML = `<tr><td colspan="${cols.length}" style="text-align:center;padding:20px;color:#999">No records found.</td></tr>`;
    return;
  }
  tbody.innerHTML = rows.map((r, i) => {
    const bg = i % 2 === 0 ? '#fff' : '#f7f9ff';
    return `<tr style="background:${bg}">${cols.map(c =>
      `<td style="padding:5px 9px;border:1px solid #e0e0e0;color:#1a1a1a;white-space:nowrap;background:${bg}">${r[c] ?? '-'}</td>`
    ).join('')}</tr>`;
  }).join('');
}

window._invSort = (colIdx) => {
  if (_invSortCol === colIdx) _invSortDir = -_invSortDir;
  else { _invSortCol = colIdx; _invSortDir = 1; }
  _invRenderTable();
};

// Export dropdown actions
window._invExportFmt = (fmt) => {
  const menu = $('#inv-export-menu');
  if (menu) menu.style.display = 'none';
  if (!_invData.length) return showToast('No records to export!', 'error');

  const cols = _invType === 'inward' ? _invInwardCols : _invOutwardCols;
  const hdrs = _invType === 'inward' ? _invInwardHdrs : _invOutwardHdrs;
  const now = new Date(), pad = n => String(n).padStart(2, '0');
  const ts = `${pad(now.getDate())}-${pad(now.getMonth() + 1)}-${now.getFullYear()}_${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
  const base = `Inventory_Report_${_invType === 'inward' ? 'Inward' : 'Outward'}_${ts}`;

  if (fmt === 'csv') {
    const header = hdrs.map(h => `"${h}"`).join(',');
    const rows = _invData.map(r => cols.map(c => `"${(r[c] ?? '').toString().replace(/"/g, '""')}"`).join(','));
    const csv = [header, ...rows].join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = base + '.csv';
    a.click();
    showToast(`Exported: ${base}.csv`);

  } else if (fmt === 'pdf') {
    const thS = 'background:#1a3e8e;color:#fff;padding:5px 8px;border:1px solid #2a5aba;font-size:10px;white-space:nowrap';
    const hRow = `<tr>${hdrs.map(h => `<th style="${thS}">${h}</th>`).join('')}</tr>`;
    const bRows = _invData.map((r, i) => {
      const bg = i % 2 === 0 ? '#fff' : '#f5f7ff';
      return `<tr style="background:${bg}">${cols.map(c => `<td style="padding:4px 8px;border:1px solid #ddd;font-size:10px;white-space:nowrap;background:${bg};color:#000">${r[c] ?? ''}</td>`).join('')}</tr>`;
    }).join('');
    const title = `Inventory Report &#8211; ${_invType === 'inward' ? 'Inward' : 'Outward'} Entries`;
    const win = window.open('', '_blank', 'width=1200,height=800');
    win.document.write(`<!DOCTYPE html><html><head><title>${base}</title>
      <style>@page{margin:0}body{font-family:Arial,sans-serif;margin:0;padding:8mm 10mm;font-size:10px}
      .no-print{background:#f0f4ff;border-bottom:1px solid #ccd;padding:8px;text-align:center;margin-bottom:12px}
      @media print{.no-print{display:none}}table{border-collapse:collapse;width:100%}</style>
    </head><body>
    <div class="no-print">
      <button onclick="window.print()" style="padding:6px 22px;background:#2a5aba;color:#fff;border:none;font-size:13px;cursor:pointer;border-radius:3px">&#128438; Print / Save as PDF</button>
      <button onclick="window.close()" style="margin-left:10px;padding:6px 16px;background:#ccc;border:none;font-size:13px;cursor:pointer;border-radius:3px">Close</button>
    </div>
    <h3 style="text-align:center;margin-bottom:12px">${title}</h3>
    <table><thead>${hRow}</thead><tbody>${bRows}</tbody></table>
    </body></html>`);
    win.document.close();
  }
};



// ========================================================
// EXPORT CSV UTILITY
// ========================================================
window.exportTableCSV = (tableId, filename) => {
  const table = $(`#${tableId}`);
  if (!table) return showToast('Table not found', 'error');
  const rows = [...table.querySelectorAll('tr')];
  const csv = rows.map(r => [...r.querySelectorAll('th, td')].map(c => `"${c.textContent.trim().replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
  showToast('Exported!');
};

/* ═══════════════════════════════════════════════════════════════════
   DEAD STOCK IDENTIFIER — Full Report Page
   AI-powered: Items with Stock > 0 but zero issues in last N days
═══════════════════════════════════════════════════════════════════ */

registerPage('dead-stock', () => `
  <div style="padding:0">
    <div style="background:var(--bg-card);padding:20px 28px 16px;border-bottom:1px solid var(--border);
                display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px">
      <div>
        <h2 style="margin:0;font-size:18px;font-weight:700;color:var(--text-primary);display:flex;align-items:center;gap:10px">
          <i class="fas fa-skull" style="color:#7c3aed"></i> Dead Stock Identifier
          <span style="font-size:11px;padding:3px 9px;background:rgba(139,92,246,.12);color:#7c3aed;
                       border-radius:10px;font-weight:600">AI Insight</span>
        </h2>
        <div style="font-size:12px;color:var(--text-muted);margin-top:3px">
          Reports / AI Insights / Dead Stock Identifier
        </div>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <button class="btn btn-success btn-sm" id="btn-ds-export">
          <i class="fas fa-file-csv"></i> Export CSV
        </button>
      </div>
    </div>

    <!-- Summary Banner (populated after load) -->
    <div id="ds-summary-banner" style="display:none;margin:20px 28px 0;padding:16px 20px;
         border-radius:12px;background:linear-gradient(135deg,rgba(139,92,246,.1),rgba(99,102,241,.08));
         border:1px solid rgba(139,92,246,.25)">
    </div>

    <!-- Filters -->
    <div style="margin:16px 28px 0;background:var(--bg-card);border:1px solid var(--border);
                border-radius:10px;padding:14px 18px;display:flex;gap:14px;flex-wrap:wrap;align-items:flex-end">
      <div style="display:flex;flex-direction:column;gap:5px;min-width:160px">
        <label style="font-size:11px;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:.6px">
          Idle Since (days)
        </label>
        <select id="ds-days-filter" style="background:var(--bg-dark);border:1px solid var(--border);
          border-radius:6px;padding:8px 12px;color:var(--text-primary);font-size:13px;cursor:pointer">
          <option value="90">90 days</option>
          <option value="180">180 days</option>
          <option value="365">1 Year</option>
          <option value="9999">All (Never Issued too)</option>
        </select>
      </div>
      <div style="display:flex;flex-direction:column;gap:5px;flex:1;min-width:160px">
        <label style="font-size:11px;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:.6px">
          Division
        </label>
        <select id="ds-div-filter" style="background:var(--bg-dark);border:1px solid var(--border);
          border-radius:6px;padding:8px 12px;color:var(--text-primary);font-size:13px;cursor:pointer">
          <option value="">All Divisions</option>
        </select>
      </div>
      <div style="display:flex;flex-direction:column;gap:5px;flex:2;min-width:200px">
        <label style="font-size:11px;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:.6px">
          Search
        </label>
        <div style="position:relative">
          <i class="fas fa-search" style="position:absolute;left:11px;top:50%;transform:translateY(-50%);color:var(--text-muted);font-size:13px"></i>
          <input type="text" id="ds-search" placeholder="Item name, category..."
            style="width:100%;padding:8px 12px 8px 34px;background:var(--bg-dark);border:1px solid var(--border);
                   border-radius:6px;color:var(--text-primary);font-size:13px"/>
        </div>
      </div>
      <button class="btn btn-primary btn-sm" id="btn-ds-run" style="align-self:flex-end">
        <i class="fas fa-magnifying-glass-chart"></i> Analyse
      </button>
    </div>

    <!-- Table area -->
    <div style="margin:16px 28px 28px">
      <div class="card" style="padding:0;overflow:hidden">
        <div class="table-wrapper" id="ds-table-wrap">
          <div style="padding:48px;text-align:center;color:var(--text-muted)">
            <i class="fas fa-skull" style="font-size:32px;margin-bottom:12px;color:rgba(139,92,246,.4);display:block"></i>
            Click <strong>Analyse</strong> to identify dead stock items.
          </div>
        </div>
      </div>
    </div>
  </div>
`);

window._pageBinders = window._pageBinders || {};
window._pageBinders['dead-stock'] = async () => {
  let _dsData = [];

  async function loadDS() {
    const days = document.getElementById('ds-days-filter')?.value || 90;
    const wrap = document.getElementById('ds-table-wrap');
    if (wrap) wrap.innerHTML = `<div style="padding:48px;text-align:center"><div class="spinner" style="margin:0 auto"></div><div style="margin-top:12px;color:var(--text-muted);font-size:13px">Analysing stock movements…</div></div>`;

    try {
      _dsData = await api('/api/dead-stock?days=' + days);
    } catch (e) {
      if (wrap) wrap.innerHTML = `<div style="padding:32px;text-align:center;color:var(--danger)">${e.message}</div>`;
      return;
    }

    // Populate division filter
    const divSel = document.getElementById('ds-div-filter');
    if (divSel) {
      const divs = [...new Set(_dsData.map(r => r.DivisionName).filter(Boolean))].sort();
      const cur = divSel.value;
      divSel.innerHTML = '<option value="">All Divisions</option>' +
        divs.map(d => `<option value="${d}" ${d === cur ? 'selected' : ''}>${d}</option>`).join('');
    }

    renderDS();
  }

  function renderDS() {
    const q = (document.getElementById('ds-search')?.value || '').toLowerCase();
    const divF = document.getElementById('ds-div-filter')?.value || '';
    const wrap = document.getElementById('ds-table-wrap');
    const banner = document.getElementById('ds-summary-banner');
    if (!wrap) return;

    const filtered = _dsData.filter(r =>
      (!divF || r.DivisionName === divF) &&
      (!q || (r.ItemName || '').toLowerCase().includes(q) || (r.CategoryName || '').toLowerCase().includes(q))
    );

    const totalLocked = filtered.reduce((s, r) => s + (Number(r.LockedValue) || 0), 0);
    const fmtCur = n => '₹' + Number(n).toLocaleString('en-IN', { maximumFractionDigits: 0 });
    const neverIssued = filtered.filter(r => !r.LastIssueDate).length;
    const over365 = filtered.filter(r => r.DaysSinceLastIssue > 365).length;

    // Summary banner
    if (banner) {
      banner.style.display = 'flex';
      banner.style.flexWrap = 'wrap';
      banner.style.gap = '24px';
      banner.style.alignItems = 'center';
      banner.innerHTML = `
        <div style="flex:1;min-width:180px">
          <div style="font-size:11px;color:var(--text-muted);text-transform:uppercase;letter-spacing:.8px">Total Dead Items</div>
          <div style="font-size:28px;font-weight:800;color:#7c3aed">${filtered.length}</div>
        </div>
        <div style="flex:1;min-width:180px">
          <div style="font-size:11px;color:var(--text-muted);text-transform:uppercase;letter-spacing:.8px">Capital Locked</div>
          <div style="font-size:28px;font-weight:800;color:#7c3aed">${fmtCur(totalLocked)}</div>
        </div>
        <div style="flex:1;min-width:160px">
          <div style="font-size:11px;color:var(--text-muted);text-transform:uppercase;letter-spacing:.8px">Never Issued</div>
          <div style="font-size:24px;font-weight:700;color:#ef4444">${neverIssued}</div>
        </div>
        <div style="flex:1;min-width:160px">
          <div style="font-size:11px;color:var(--text-muted);text-transform:uppercase;letter-spacing:.8px">Idle &gt; 1 Year</div>
          <div style="font-size:24px;font-weight:700;color:#f97316">${over365}</div>
        </div>
        <div style="font-size:11.5px;color:var(--text-muted);width:100%;border-top:1px solid rgba(139,92,246,.15);padding-top:10px;margin-top:4px">
          <i class="fas fa-lightbulb" style="color:#7c3aed;margin-right:6px"></i>
          <strong style="color:var(--text-primary)">Recommendation:</strong>
          Consider returning excess to vendors, or re-routing these items to high-demand sections/divisions to unlock capital.
        </div>`;
    }

    if (!filtered.length) {
      wrap.innerHTML = `<div style="padding:48px;text-align:center;color:var(--text-muted)">
        <i class="fas fa-circle-check" style="font-size:32px;color:#22c55e;margin-bottom:12px;display:block"></i>
        No dead stock found for the selected filters.
      </div>`;
      return;
    }

    wrap.innerHTML = `
      <table id="ds-table">
        <thead><tr>
          <th style="width:36px">#</th>
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
          ${filtered.map((r, i) => {
      const lastDate = r.LastIssueDate
        ? new Date(r.LastIssueDate).toLocaleDateString('en-IN')
        : '<em style="color:#ef4444;font-style:normal;font-weight:600">Never</em>';
      const idle = r.DaysSinceLastIssue != null ? r.DaysSinceLastIssue : '∞';
      const idleColor = r.DaysSinceLastIssue == null || r.DaysSinceLastIssue > 365
        ? '#ef4444'
        : r.DaysSinceLastIssue > 180 ? '#f97316' : '#7c3aed';
      const rowBg = r.DaysSinceLastIssue == null || r.DaysSinceLastIssue > 365
        ? 'rgba(239,68,68,.03)' : '';
      return `<tr style="background:${rowBg}">
              <td style="color:var(--text-muted);font-size:12px">${i + 1}</td>
              <td style="font-weight:600">${r.ItemName || '-'}</td>
              <td><span style="padding:2px 8px;background:rgba(168,85,247,.1);color:#a855f7;
                               border-radius:8px;font-size:11.5px">${r.CategoryName || '-'}</span></td>
              <td style="color:var(--text-secondary)">${r.DivisionName || '-'}</td>
              <td style="text-align:right;font-weight:700">${r.Stock}</td>
              <td style="color:var(--text-muted);font-size:12px">${r.UOM || '-'}</td>
              <td style="text-align:right">${fmtCur(r.SellPrice)}</td>
              <td style="text-align:right;font-weight:700;color:#7c3aed">${fmtCur(r.LockedValue)}</td>
              <td style="text-align:center;font-size:12px">${lastDate}</td>
              <td style="text-align:center;font-weight:800;color:${idleColor}">${idle}d</td>
            </tr>`;
    }).join('')}
          <!-- Totals row -->
          <tr style="background:rgba(139,92,246,.06);font-weight:700;border-top:2px solid rgba(139,92,246,.2)">
            <td colspan="7" style="text-align:right;color:var(--text-secondary);font-size:12px">
              TOTAL LOCKED CAPITAL (${filtered.length} items)
            </td>
            <td style="text-align:right;color:#7c3aed;font-size:15px">${fmtCur(totalLocked)}</td>
            <td colspan="2"></td>
          </tr>
        </tbody>
      </table>`;
  }

  // Wire up controls
  document.getElementById('btn-ds-run').onclick = loadDS;
  document.getElementById('ds-days-filter').onchange = () => { if (_dsData.length) renderDS(); };
  document.getElementById('ds-div-filter').onchange = renderDS;
  document.getElementById('ds-search').oninput = renderDS;

  // Export CSV
  document.getElementById('btn-ds-export').onclick = () => {
    if (!_dsData.length) { showToast('Run analysis first', 'info'); return; }
    const q = (document.getElementById('ds-search')?.value || '').toLowerCase();
    const divF = document.getElementById('ds-div-filter')?.value || '';
    const rows = _dsData.filter(r =>
      (!divF || r.DivisionName === divF) &&
      (!q || (r.ItemName || '').toLowerCase().includes(q) || (r.CategoryName || '').toLowerCase().includes(q))
    );
    const header = ['Item ID', 'Item Name', 'Category', 'Division', 'Stock', 'UOM', 'Sell Price', 'Locked Value', 'Last Issue Date', 'Days Idle'];
    const csv = [header, ...rows.map(r => [
      r.ItemId, r.ItemName, r.CategoryName, r.DivisionName, r.Stock, r.UOM,
      r.SellPrice, r.LockedValue,
      r.LastIssueDate ? new Date(r.LastIssueDate).toLocaleDateString('en-IN') : 'Never',
      r.DaysSinceLastIssue ?? 'Never Issued'
    ])].map(row => row.map(v => `"${String(v || '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `dead-stock-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    showToast('CSV exported!');
  };

  // Auto-run on open
  await loadDS();
};
