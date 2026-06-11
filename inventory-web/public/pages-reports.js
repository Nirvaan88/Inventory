/* ================================================
   PAGES: Reports & Challan
   ================================================ */

// ======== ITEM STOCK REPORT ========
registerPage('report-stock', async () => {
  return `${pageHeader('Item Stock Report', 'fa-warehouse', 'Reports / Item Stock')}
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
      <thead><tr><th>Item Name</th><th>Category</th><th>Division</th><th>UOM</th><th>Stock</th><th>Reorder Level</th><th>Reorder Qty</th><th>Sell Price</th><th>Status</th></tr></thead>
      <tbody id="tbl-stock-body"><tr class="empty-row"><td colspan="9">Click "Run Report" to load data.</td></tr></tbody>
    </table></div>
  </div></div>`;
});
window._pageBinders['report-stock'] = async () => {
  const divs = await api('/api/divisions');
  const sel = $('#rpt-stock-div');
  divs.forEach(d => sel.innerHTML += `<option value="${d.DivisionID}">${d.DivisionName}</option>`);
  const runReport = async () => {
    const divId = sel.value;
    const data = await api('/api/reports/item-stock' + (divId ? `?divisionId=${divId}` : ''));
    const tbody = $('#tbl-stock-body');
    tbody.innerHTML = data.length ? data.map(d => `<tr>
      <td><strong>${d.ItemName}</strong></td>
      <td>${d.CategoryName||'-'}</td><td>${d.DivisionName||'-'}</td>
      <td>${d.UOM||'-'}</td>
      <td><span class="badge ${(d.Stock||0)<=(d.ReorderLevel||0)?'badge-danger':'badge-success'}">${d.Stock||0}</span></td>
      <td>${d.ReorderLevel||0}</td><td>${d.ReorderQty||0}</td>
      <td>₹${fmtNum(d.SellPrice)}</td>
      <td>${(d.Stock||0)<=(d.ReorderLevel||0)?'<span class="badge badge-danger">Low Stock</span>':'<span class="badge badge-success">OK</span>'}</td>
    </tr>`).join('') : `<tr class="empty-row"><td colspan="9">No data.</td></tr>`;
  };
  $('#btn-stock-run').onclick = runReport;
  $('#btn-stock-export').onclick = () => exportTableCSV('tbl-stock-report', 'item_stock_report.csv');
  await runReport();
};

// ======== TRANSACTIONS REPORT ========
registerPage('report-transactions', async () => {
  return `${pageHeader('Transactions Report', 'fa-receipt', 'Reports / Transactions')}
  <div class="report-filters">
    <div class="form-field"><label>From Date</label><input type="date" id="rpt-tx-from"/></div>
    <div class="form-field"><label>To Date</label><input type="date" id="rpt-tx-to"/></div>
    <div class="form-field"><label>Type</label>
      <select id="rpt-tx-type">
        <option value="">All</option><option value="inward">Inward</option><option value="issue">Issue</option>
      </select>
    </div>
    <button class="btn btn-primary" id="btn-tx-run"><i class="fas fa-play"></i> Run</button>
    <button class="btn btn-secondary" id="btn-tx-export"><i class="fas fa-file-excel"></i> CSV</button>
  </div>
  <div class="tabs">
    <div class="tab active" id="tx-tab-inward">Inward</div>
    <div class="tab" id="tx-tab-issue">Issue</div>
  </div>
  <div id="tx-content-inward">
    <div class="card"><div class="table-wrapper"><table id="tbl-tx-inward">
      <thead><tr><th>Date</th><th>Vendor</th><th>Item</th><th>Qty</th><th>Rate</th><th>Amount</th></tr></thead>
      <tbody id="tbl-tx-inward-body"><tr class="empty-row"><td colspan="6">Run report to load data.</td></tr></tbody>
    </table></div></div>
  </div>
  <div id="tx-content-issue" style="display:none">
    <div class="card"><div class="table-wrapper"><table id="tbl-tx-issue">
      <thead><tr><th>Date</th><th>Dealer</th><th>Item</th><th>Qty</th><th>Rate</th><th>Amount</th></tr></thead>
      <tbody id="tbl-tx-issue-body"><tr class="empty-row"><td colspan="6">Run report to load data.</td></tr></tbody>
    </table></div></div>
  </div></div>`;
});
window._pageBinders['report-transactions'] = async () => {
  const today = new Date().toISOString().split('T')[0];
  const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
  $('#rpt-tx-from').value = firstOfMonth;
  $('#rpt-tx-to').value = today;

  const runTx = async () => {
    const params = new URLSearchParams({ fromDate: $('#rpt-tx-from').value, toDate: $('#rpt-tx-to').value, type: $('#rpt-tx-type').value });
    const data = await api('/api/reports/transactions?' + params);
    const ib = $('#tbl-tx-inward-body'), isb = $('#tbl-tx-issue-body');
    if (data.inward) ib.innerHTML = data.inward.length ? data.inward.map(d=>`<tr><td>${fmtDate(d.TxDate)}</td><td>${d.VendorName||'-'}</td><td>${d.ItemName}</td><td>${d.Qty}</td><td>₹${fmtNum(d.Rate)}</td><td>₹${fmtNum(d.Amount)}</td></tr>`).join('') : `<tr class="empty-row"><td colspan="6">No data.</td></tr>`;
    if (data.issue) isb.innerHTML = data.issue.length ? data.issue.map(d=>`<tr><td>${fmtDate(d.TxDate)}</td><td>${d.DealerCompanyName||'-'}</td><td>${d.ItemName}</td><td>${d.Qty}</td><td>₹${fmtNum(d.Rate)}</td><td>₹${fmtNum(d.Amount)}</td></tr>`).join('') : `<tr class="empty-row"><td colspan="6">No data.</td></tr>`;
  };
  $('#btn-tx-run').onclick = runTx;
  $('#btn-tx-export').onclick = () => {
    const activeTab = $('#tx-tab-inward').classList.contains('active') ? 'tbl-tx-inward' : 'tbl-tx-issue';
    exportTableCSV(activeTab, 'transactions_report.csv');
  };
  ['#tx-tab-inward', '#tx-tab-issue'].forEach(sel => {
    $(sel).onclick = () => {
      ['#tx-tab-inward', '#tx-tab-issue'].forEach(s => $(s).classList.remove('active'));
      $(sel).classList.add('active');
      $('#tx-content-inward').style.display = sel === '#tx-tab-inward' ? '' : 'none';
      $('#tx-content-issue').style.display  = sel === '#tx-tab-issue' ? '' : 'none';
    };
  });
};

// ======== INWARD PRICING REPORT ========
registerPage('report-inward-pricing', async () => {
  return `${pageHeader('Inward Pricing Report', 'fa-indian-rupee-sign', 'Reports / Inward Pricing')}
  <div class="report-filters">
    <div class="form-field"><label>From Date</label><input type="date" id="rpt-ip-from"/></div>
    <div class="form-field"><label>To Date</label><input type="date" id="rpt-ip-to"/></div>
    <button class="btn btn-primary" id="btn-ip-run"><i class="fas fa-play"></i> Run</button>
    <button class="btn btn-secondary" id="btn-ip-export"><i class="fas fa-file-excel"></i> CSV</button>
  </div>
  <div class="card"><div class="table-wrapper"><table id="tbl-ip-report">
    <thead><tr><th>Date</th><th>Vendor</th><th>Invoice No</th><th>Item</th><th>Qty</th><th>Rate</th><th>Amount</th></tr></thead>
    <tbody id="tbl-ip-body"><tr class="empty-row"><td colspan="7">Run report to load data.</td></tr></tbody>
  </table></div></div></div>`;
});
window._pageBinders['report-inward-pricing'] = () => {
  const today = new Date().toISOString().split('T')[0];
  $('#rpt-ip-from').value = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
  $('#rpt-ip-to').value = today;
  const run = async () => {
    const p = new URLSearchParams({ fromDate: $('#rpt-ip-from').value, toDate: $('#rpt-ip-to').value });
    const data = await api('/api/reports/inward-pricing?' + p);
    const tbody = $('#tbl-ip-body');
    tbody.innerHTML = data.length ? data.map(d=>`<tr><td>${fmtDate(d.InwardDate)}</td><td>${d.VendorName||'-'}</td><td>${d.InvoiceNumber||'-'}</td><td>${d.ItemName}</td><td>${d.Qty}</td><td>₹${fmtNum(d.Rate)}</td><td>₹${fmtNum(d.Amount)}</td></tr>`).join('') : `<tr class="empty-row"><td colspan="7">No data.</td></tr>`;
  };
  $('#btn-ip-run').onclick = run;
  $('#btn-ip-export').onclick = () => exportTableCSV('tbl-ip-report', 'inward_pricing_report.csv');
};

// ======== STOCK DIVISION-WISE ========
registerPage('report-stock-division', async () => {
  const data = await api('/api/reports/stock-division-wise').catch(()=>[]);
  // Group by division
  const byDiv = {};
  data.forEach(d => {
    const k = d.DivisionName || 'Unassigned';
    if (!byDiv[k]) byDiv[k] = [];
    byDiv[k].push(d);
  });
  return `${pageHeader('Stock Division-Wise', 'fa-chart-bar', 'Reports / Stock Division-Wise',
    `<button class="btn btn-secondary" onclick="exportTableCSV('tbl-div-stock','stock_division_wise.csv')"><i class="fas fa-file-excel"></i> Export CSV</button>`)}
  <div class="card"><div class="table-wrapper"><table id="tbl-div-stock">
    <thead><tr><th>Division</th><th>Item Name</th><th>Category</th><th>Stock</th><th>Reorder Level</th><th>Status</th></tr></thead>
    <tbody>
      ${Object.entries(byDiv).map(([div, items]) =>
        items.map((d, i) => `<tr>
          ${i === 0 ? `<td rowspan="${items.length}"><strong>${div}</strong></td>` : ''}
          <td>${d.ItemName}</td><td>${d.CategoryName||'-'}</td>
          <td><span class="badge ${(d.Stock||0)<=(d.ReorderLevel||0)?'badge-danger':'badge-success'}">${d.Stock||0}</span></td>
          <td>${d.ReorderLevel||0}</td>
          <td>${(d.Stock||0)<=(d.ReorderLevel||0)?'<span class="badge badge-danger">Low</span>':'<span class="badge badge-success">Good</span>'}</td>
        </tr>`).join('')
      ).join('')}
      ${!data.length ? '<tr class="empty-row"><td colspan="6">No data.</td></tr>' : ''}
    </tbody>
  </table></div></div></div>`;
});

// ======== CHALLAN ========
registerPage('challan', async () => {
  return `${pageHeader('Generate Challan', 'fa-file-lines', 'Reports / Challan')}
  <div class="card">
    <div class="report-filters">
      <div class="form-field"><label>Dealer</label>
        <select id="ch-dealer"><option value="">-- All --</option></select>
      </div>
      <div class="form-field"><label>From Date</label><input type="date" id="ch-from"/></div>
      <div class="form-field"><label>To Date</label><input type="date" id="ch-to"/></div>
      <button class="btn btn-primary" id="btn-ch-run"><i class="fas fa-search"></i> Load Issues</button>
    </div>
    <div class="table-wrapper"><table id="tbl-challan">
      <thead><tr><th><input type="checkbox" id="ch-select-all"/></th><th>Issue ID</th><th>Date</th><th>Dealer</th><th>Courier</th><th>Docket No</th></tr></thead>
      <tbody id="tbl-challan-body"><tr class="empty-row"><td colspan="6">Load issues first.</td></tr></tbody>
    </table></div>
    <div style="margin-top:16px" class="btn-bar">
      <button class="btn btn-primary" id="btn-gen-challan"><i class="fas fa-print"></i> Generate & Print Challan</button>
    </div>
  </div></div>`;
});
window._pageBinders['challan'] = async () => {
  const dealers = await api('/api/dealers');
  const sel = $('#ch-dealer');
  dealers.forEach(d => sel.innerHTML += `<option value="${d.DealerID}">${d.DealerCompanyName}</option>`);
  const today = new Date().toISOString().split('T')[0];
  $('#ch-from').value = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
  $('#ch-to').value = today;

  let allIssues = [];
  $('#btn-ch-run').onclick = async () => {
    allIssues = await api('/api/issues');
    const dealer = $('#ch-dealer').value;
    const from = new Date($('#ch-from').value);
    const to = new Date($('#ch-to').value);
    const filtered = allIssues.filter(i => {
      const d = new Date(i.IssueDate);
      return (!dealer || i.DealerID == dealer) && d >= from && d <= to;
    });
    const tbody = $('#tbl-challan-body');
    tbody.innerHTML = filtered.length ? filtered.map(d => `<tr>
      <td><input type="checkbox" class="ch-chk" data-id="${d.IssueID}"/></td>
      <td>${d.IssueID}</td><td>${fmtDate(d.IssueDate)}</td>
      <td>${d.DealerCompanyName||'-'}</td><td>${d.CourierID||'-'}</td><td>${d.CourierDocketNo||'-'}</td>
    </tr>`).join('') : `<tr class="empty-row"><td colspan="6">No issues in range.</td></tr>`;
    $('#ch-select-all').onchange = e => { $$('.ch-chk').forEach(c => c.checked = e.target.checked); };
  };
  $('#btn-gen-challan').onclick = async () => {
    const selected = $$('.ch-chk:checked').map(c => c.dataset.id);
    if (!selected.length) return showToast('Select at least one issue', 'error');
    const issueData = await Promise.all(selected.map(id => Promise.all([
      Promise.resolve(allIssues.find(i => i.IssueID == id)),
      api(`/api/issues/${id}/items`)
    ])));
    printChallan(issueData);
  };
};

function printChallan(issueData) {
  const win = window.open('', '_blank');
  const body = issueData.map(([issue, items]) => `
    <div style="page-break-after:always;padding:20px;font-family:Arial;border:1px solid #ccc;margin-bottom:20px">
      <div style="text-align:center;margin-bottom:16px">
        <h2 style="margin:0;color:#c9a227">KISNA INVENTORY</h2>
        <h3 style="margin:4px 0">DELIVERY CHALLAN</h3>
        <p style="color:#666">Issue ID: #${issue.IssueID} | Date: ${fmtDate(issue.IssueDate)}</p>
      </div>
      <div style="display:flex;gap:20px;margin-bottom:16px">
        <div><strong>To:</strong><br>${issue.DealerCompanyName||'--'}</div>
        <div><strong>Courier:</strong> ${issue.CourierID||'--'}<br><strong>Docket No:</strong> ${issue.CourierDocketNo||'--'}</div>
      </div>
      <table border="1" style="width:100%;border-collapse:collapse">
        <thead><tr style="background:#f5f5f5"><th style="padding:8px">Item</th><th>Qty</th><th>Rate</th><th>Amount</th></tr></thead>
        <tbody>
          ${items.map(i=>`<tr><td style="padding:6px">${i.ItemName}</td><td>${i.Qty}</td><td>₹${fmtNum(i.Rate)}</td><td>₹${fmtNum(i.Amount)}</td></tr>`).join('')}
          <tr style="font-weight:bold;background:#fffbe6">
            <td style="padding:6px">TOTAL</td>
            <td>${items.reduce((s,i)=>s+(+i.Qty||0),0)}</td>
            <td></td>
            <td>₹${fmtNum(items.reduce((s,i)=>s+(+i.Amount||0),0))}</td>
          </tr>
        </tbody>
      </table>
      <div style="margin-top:32px;display:flex;justify-content:space-between">
        <div>Received by: _________________</div>
        <div>Authorised Signatory: _________________</div>
      </div>
    </div>`).join('');
  win.document.write(`<html><head><title>Challans</title></head><body>${body}</body></html>`);
  win.document.close();
  win.print();
}

// ======== EXPORT CSV UTILITY ========
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
