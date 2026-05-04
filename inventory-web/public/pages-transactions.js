/* ================================================
   PAGES: Transactions – Purchase Inward, Issue Items,
          Issue Return, Orders, Pending Reports
   ================================================ */

// ======== PURCHASE INWARD ========
registerPage('purchase-inward', async () => {
  return `${pageHeader('Purchase Inward', 'fa-arrow-down-to-bracket', 'Transactions / Purchase Inward',
    `<button class="btn btn-primary" id="btn-new-inward"><i class="fas fa-plus"></i> New Inward</button>`)}
  <div class="card">
    <div class="search-bar">
      <div class="search-input-wrap"><i class="fas fa-search"></i><input type="text" id="inward-search" placeholder="Search by Inward ID or Order No..."></div>
      <button class="btn btn-secondary" id="btn-inward-search"><i class="fas fa-magnifying-glass"></i> Search</button>
    </div>
    <div class="table-wrapper"><table>
      <thead><tr><th>Inward ID</th><th>Date</th><th>Vendor</th><th>Invoice No</th><th>DC No</th><th>Status</th><th>Actions</th></tr></thead>
      <tbody id="tbl-inward-body"><tr class="empty-row"><td colspan="7">Loading...</td></tr></tbody>
    </table></div>
  </div></div>`;
});
window._pageBinders['purchase-inward'] = async () => {
  await loadInward();
  $('#btn-new-inward').onclick = () => showInwardModal();
  $('#btn-inward-search').onclick = () => {
    const val = $('#inward-search').value.trim();
    if (!isNaN(val) && val) loadInward(val, null);
    else loadInward(null, val);
  };
};
async function loadInward(inwardId, orderNo) {
  let url = '/api/inward';
  if (inwardId) url += `?inwardId=${inwardId}`;
  else if (orderNo) url += `?orderNo=${encodeURIComponent(orderNo)}`;
  const data = await api(url);
  const tbody = $('#tbl-inward-body'); if (!tbody) return;
  tbody.innerHTML = data.length ? data.map(d => `<tr>
    <td>${d.InwardID}</td><td>${fmtDate(d.InwardDate)}</td>
    <td>${d.VendorName||'-'}</td><td>${d.InvoiceNumber||'-'}</td>
    <td>${d.DCNumber||'-'}</td>
    <td><span class="badge badge-success">Saved</span></td>
    <td><button class="btn btn-info btn-sm" onclick="viewInwardDetails(${d.InwardID})"><i class="fas fa-eye"></i> Details</button></td>
  </tr>`).join('') : `<tr class="empty-row"><td colspan="7">No records found.</td></tr>`;
}
window.viewInwardDetails = async (id) => {
  const items = await api(`/api/inward/${id}/items`);
  const total = items.reduce((s, i) => s + (+i.Amount||0), 0);
  const totalQty = items.reduce((s, i) => s + (+i.Qty||0), 0);
  const ov = modalHtml(`Inward #${id} – Item Details`, `
    <div class="table-wrapper"><table>
      <thead><tr><th>Item Name</th><th>Qty</th><th>Rate</th><th>Amount</th></tr></thead>
      <tbody>
        ${items.map(i => `<tr><td>${i.ItemName||i.ItemID}</td><td>${i.Qty}</td><td>₹${fmtNum(i.Rate)}</td><td>₹${fmtNum(i.Amount)}</td></tr>`).join('')}
        <tr class="totals-row"><td><strong>TOTAL</strong></td><td><strong>${totalQty}</strong></td><td></td><td><strong>₹${fmtNum(total)}</strong></td></tr>
      </tbody>
    </table></div>`, 'modal-lg');
};
window.showInwardModal = async () => {
  const [vendors, items, divs] = await Promise.all([api('/api/vendors'), api('/api/items'), api('/api/divisions')]);
  let lines = [];
  const ov = modalHtml('New Purchase Inward', `
    <div class="form-row cols-3">
      <div class="form-field"><label>Vendor *</label>
        <select id="iw-vendor"><option value="">-- Select --</option>${vendors.map(v=>`<option value="${v.VendorID}">${v.VendorName}</option>`).join('')}</select>
      </div>
      <div class="form-field"><label>Inward Date *</label><input type="date" id="iw-date" value="${new Date().toISOString().split('T')[0]}"/></div>
      <div class="form-field"><label>Division</label>
        <select id="iw-div"><option value="">--</option>${divs.map(d=>`<option value="${d.DivisionID}">${d.DivisionName}</option>`).join('')}</select>
      </div>
    </div>
    <div class="form-row cols-4">
      <div class="form-field"><label>Invoice No</label><input type="text" id="iw-inv"/></div>
      <div class="form-field"><label>DC Number</label><input type="text" id="iw-dc"/></div>
      <div class="form-field"><label>DC Qty</label><input type="number" id="iw-dcqty"/></div>
      <div class="form-field"><label>Order No</label><input type="text" id="iw-order"/></div>
    </div>
    <div class="form-row cols-3">
      <div class="form-field"><label>Return Mode</label>
        <select id="iw-retmode"><option value="">--</option><option>Courier</option><option>Hand</option></select>
      </div>
      <div class="form-field"><label>Item Status</label>
        <select id="iw-status"><option value="">--</option><option>New</option><option>Repaired</option><option>Damaged</option></select>
      </div>
      <div class="form-field"><label>Person Name</label><input type="text" id="iw-person"/></div>
    </div>
    <div class="form-field" style="margin-bottom:12px"><label>Reason</label><input type="text" id="iw-reason"/></div>
    <hr class="section-divider"/>
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
      <div class="section-label" style="margin:0">Item Lines</div>
      <button class="btn btn-secondary btn-sm" id="btn-add-iw-line"><i class="fas fa-plus"></i> Add Item</button>
    </div>
    <div class="items-table-container"><table>
      <thead><tr><th>Item</th><th>Qty</th><th>Rate</th><th>Amount</th><th></th></tr></thead>
      <tbody id="iw-lines-body"></tbody>
      <tfoot><tr class="totals-row"><td><strong>Total</strong></td><td id="iw-total-qty">0</td><td></td><td id="iw-total-amt">₹0.00</td><td></td></tr></tfoot>
    </table></div>
    <div class="modal-footer" style="padding:16px 0 0">
      <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
      <button class="btn btn-primary" id="biw"><i class="fas fa-floppy-disk"></i> Save Inward</button>
    </div>`, 'modal-xl');

  const renderIWLines = () => {
    $('#iw-lines-body', ov).innerHTML = lines.map((l, i) => `
      <tr>
        <td><select class="iw-item-sel" data-i="${i}"><option value="">--</option>${items.map(it => `<option value="${it.Itemid}" ${it.Itemid==l.ItemID?'selected':''}>${it.ItemName}</option>`).join('')}</select></td>
        <td><input type="number" class="iw-qty" data-i="${i}" value="${l.Qty||1}" min="1"/></td>
        <td><input type="number" class="iw-rate" data-i="${i}" value="${l.Rate||0}" step="0.01"/></td>
        <td class="iw-amt-cell">${fmtNum((l.Qty||1)*(l.Rate||0))}</td>
        <td><button class="btn btn-danger btn-icon" onclick="removeIWLine(${i})"><i class="fas fa-xmark"></i></button></td>
      </tr>`).join('');
    $$('.iw-item-sel', ov).forEach(s => s.onchange = () => { lines[+s.dataset.i].ItemID = s.value; });
    $$('.iw-qty', ov).forEach(inp => inp.oninput = () => { lines[+inp.dataset.i].Qty = +inp.value; updateIWTotals(); renderIWLines(); });
    $$('.iw-rate', ov).forEach(inp => inp.oninput = () => { lines[+inp.dataset.i].Rate = +inp.value; updateIWTotals(); renderIWLines(); });
    updateIWTotals();
  };
  const updateIWTotals = () => {
    const totalQty = lines.reduce((s,l) => s+(+l.Qty||0), 0);
    const totalAmt = lines.reduce((s,l) => s+(+l.Qty||0)*(+l.Rate||0), 0);
    const tq = $('#iw-total-qty', ov), ta = $('#iw-total-amt', ov);
    if (tq) tq.textContent = totalQty;
    if (ta) ta.textContent = '₹'+fmtNum(totalAmt);
  };
  window.removeIWLine = (i) => { lines.splice(i, 1); renderIWLines(); };
  $('#btn-add-iw-line', ov).onclick = () => { lines.push({ ItemID: '', Qty: 1, Rate: 0 }); renderIWLines(); };
  $('#biw', ov).onclick = async () => {
    const b = {
      VendorID: $('#iw-vendor', ov).value, InwardDate: $('#iw-date', ov).value,
      DivisionID: $('#iw-div', ov).value || null, InvoiceNumber: $('#iw-inv', ov).value,
      DCNumber: $('#iw-dc', ov).value, DCQty: $('#iw-dcqty', ov).value,
      OrderNo: $('#iw-order', ov).value, ReturnMode: $('#iw-retmode', ov).value,
      ItemStatus: $('#iw-status', ov).value, PersonName: $('#iw-person', ov).value,
      Reason: $('#iw-reason', ov).value,
      items: lines.filter(l => l.ItemID).map(l => ({ ItemID: l.ItemID, Qty: l.Qty, Rate: l.Rate, Amount: (+l.Qty)*(+l.Rate) }))
    };
    if (!b.VendorID) return showToast('Vendor required', 'error');
    if (!b.items.length) return showToast('Add at least one item', 'error');
    try { await api('/api/inward', { method: 'POST', body: b }); ov.remove(); showToast('Inward saved! Stock updated.'); await loadInward(); } catch (e) { showToast(e.message, 'error'); }
  };
};

// ======== ISSUE ITEMS ========
registerPage('issue-items', async () => {
  return `${pageHeader('Issue Items', 'fa-arrow-up-from-bracket', 'Transactions / Issue Items',
    `<button class="btn btn-primary" id="btn-new-issue"><i class="fas fa-plus"></i> New Issue</button>`)}
  <div class="card">
    <div class="table-wrapper"><table>
      <thead><tr><th>Issue ID</th><th>Date</th><th>Dealer</th><th>Courier</th><th>Docket No</th><th>Actions</th></tr></thead>
      <tbody id="tbl-issue-body"><tr class="empty-row"><td colspan="6">Loading...</td></tr></tbody>
    </table></div>
  </div></div>`;
});
window._pageBinders['issue-items'] = async () => { await loadIssues(); $('#btn-new-issue').onclick = () => showIssueModal(); };
async function loadIssues() {
  const data = await api('/api/issues');
  const tbody = $('#tbl-issue-body'); if (!tbody) return;
  tbody.innerHTML = data.length ? data.map(d => `<tr>
    <td>${d.IssueID}</td><td>${fmtDate(d.IssueDate)}</td>
    <td>${d.DealerCompanyName||'-'}</td><td>${d.CourierID||'-'}</td><td>${d.CourierDocketNo||'-'}</td>
    <td><button class="btn btn-info btn-sm" onclick="viewIssueDetails(${d.IssueID})"><i class="fas fa-eye"></i> Details</button></td>
  </tr>`).join('') : `<tr class="empty-row"><td colspan="6">No issues found.</td></tr>`;
}
window.viewIssueDetails = async (id) => {
  const items = await api(`/api/issues/${id}/items`);
  const total = items.reduce((s,i)=>s+(+i.Amount||0), 0);
  modalHtml(`Issue #${id} – Details`, `
    <div class="table-wrapper"><table>
      <thead><tr><th>Item</th><th>Qty</th><th>Rate</th><th>Amount</th></tr></thead>
      <tbody>
        ${items.map(i=>`<tr><td>${i.ItemName}</td><td>${i.Qty}</td><td>₹${fmtNum(i.Rate)}</td><td>₹${fmtNum(i.Amount)}</td></tr>`).join('')}
        <tr class="totals-row"><td>TOTAL</td><td>${items.reduce((s,i)=>s+(+i.Qty||0),0)}</td><td></td><td>₹${fmtNum(total)}</td></tr>
      </tbody>
    </table></div>`, 'modal-lg');
};
window.showIssueModal = async () => {
  const [dealers, items, divs, couriers] = await Promise.all([api('/api/dealers'), api('/api/items'), api('/api/divisions'), api('/api/couriers')]);
  let lines = [];
  const ov = modalHtml('New Issue', `
    <div class="form-row cols-2">
      <div class="form-field"><label>Dealer *</label>
        <select id="iss-dealer"><option value="">--</option>${dealers.map(d=>`<option value="${d.DealerID}">${d.DealerCompanyName}</option>`).join('')}</select>
      </div>
      <div class="form-field"><label>Issue Date *</label><input type="date" id="iss-date" value="${new Date().toISOString().split('T')[0]}"/></div>
    </div>
    <div class="form-row cols-3">
      <div class="form-field"><label>Courier</label>
        <select id="iss-courier"><option value="">--</option>${couriers.map(c=>`<option value="${c.CourierID}">${c.CourierName}</option>`).join('')}</select>
      </div>
      <div class="form-field"><label>Docket No</label><input type="text" id="iss-docket"/></div>
      <div class="form-field"><label>Division</label>
        <select id="iss-div"><option value="">--</option>${divs.map(d=>`<option value="${d.DivisionID}">${d.DivisionName}</option>`).join('')}</select>
      </div>
    </div>
    <hr class="section-divider"/>
    <div style="display:flex;justify-content:space-between;margin-bottom:10px">
      <div class="section-label" style="margin:0">Items to Issue</div>
      <button class="btn btn-secondary btn-sm" id="btn-add-iss-line"><i class="fas fa-plus"></i> Add Item</button>
    </div>
    <div class="items-table-container"><table>
      <thead><tr><th>Item</th><th>Available</th><th>Qty</th><th>Rate</th><th>Amount</th><th></th></tr></thead>
      <tbody id="iss-lines-body"></tbody>
      <tfoot><tr class="totals-row"><td>Total</td><td></td><td id="iss-tqty">0</td><td></td><td id="iss-tamt">₹0.00</td><td></td></tr></tfoot>
    </table></div>
    <div class="modal-footer" style="padding:16px 0 0">
      <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
      <button class="btn btn-primary" id="biss"><i class="fas fa-floppy-disk"></i> Save Issue</button>
    </div>`, 'modal-xl');
  const renderIssLines = () => {
    $('#iss-lines-body', ov).innerHTML = lines.map((l, i) => {
      const item = items.find(it => it.Itemid == l.ItemID);
      return `<tr>
        <td><select class="iss-item-sel" data-i="${i}"><option value="">--</option>${items.map(it=>`<option value="${it.Itemid}" ${it.Itemid==l.ItemID?'selected':''}>${it.ItemName}</option>`).join('')}</select></td>
        <td><span class="badge ${(item?.Stock||0)>0?'badge-success':'badge-danger'}">${item?.Stock||0}</span></td>
        <td><input type="number" class="iss-qty" data-i="${i}" value="${l.Qty||1}" min="1"/></td>
        <td><input type="number" class="iss-rate" data-i="${i}" value="${l.Rate||item?.SellPrice||0}" step="0.01"/></td>
        <td>₹${fmtNum((l.Qty||1)*(l.Rate||0))}</td>
        <td><button class="btn btn-danger btn-icon" onclick="removeIssLine(${i})"><i class="fas fa-xmark"></i></button></td>
      </tr>`;
    }).join('');
    $$('.iss-item-sel', ov).forEach(s => s.onchange = () => { lines[+s.dataset.i].ItemID = s.value; const it = items.find(x=>x.Itemid==s.value); lines[+s.dataset.i].Rate = it?.SellPrice||0; renderIssLines(); });
    $$('.iss-qty', ov).forEach(inp => inp.oninput = () => { lines[+inp.dataset.i].Qty = +inp.value; updateIssTotals(); renderIssLines(); });
    $$('.iss-rate', ov).forEach(inp => inp.oninput = () => { lines[+inp.dataset.i].Rate = +inp.value; updateIssTotals(); renderIssLines(); });
    updateIssTotals();
  };
  const updateIssTotals = () => {
    const tq = lines.reduce((s,l)=>s+(+l.Qty||0),0), ta = lines.reduce((s,l)=>s+(+l.Qty||0)*(+l.Rate||0),0);
    const tqel = $('#iss-tqty', ov), tael = $('#iss-tamt', ov);
    if (tqel) tqel.textContent = tq; if (tael) tael.textContent = '₹'+fmtNum(ta);
  };
  window.removeIssLine = (i) => { lines.splice(i,1); renderIssLines(); };
  $('#btn-add-iss-line', ov).onclick = () => { lines.push({ ItemID:'', Qty:1, Rate:0 }); renderIssLines(); };
  $('#biss', ov).onclick = async () => {
    const b = {
      DealerID: $('#iss-dealer', ov).value, IssueDate: $('#iss-date', ov).value,
      CourierID: $('#iss-courier', ov).value || null, CourierDocketNo: $('#iss-docket', ov).value,
      DivisionID: $('#iss-div', ov).value || null,
      items: lines.filter(l=>l.ItemID).map(l=>({ ItemID:l.ItemID, Qty:l.Qty, Rate:l.Rate, Amount:(+l.Qty)*(+l.Rate) }))
    };
    if (!b.DealerID) return showToast('Dealer required','error');
    if (!b.items.length) return showToast('Add at least one item','error');
    try { await api('/api/issues', { method:'POST', body:b }); ov.remove(); showToast('Issue saved! Stock deducted.'); await loadIssues(); } catch (e) { showToast(e.message,'error'); }
  };
};

// ======== ISSUE RETURN ========
registerPage('issue-return', async () => {
  return `${pageHeader('Issue Return', 'fa-rotate-left', 'Transactions / Issue Return',
    `<button class="btn btn-primary" id="btn-new-return"><i class="fas fa-plus"></i> New Return</button>`)}
  <div class="card">
    <div class="table-wrapper"><table>
      <thead><tr><th>Return ID</th><th>Return Date</th><th>Dealer</th><th>Issue ID</th><th>Actions</th></tr></thead>
      <tbody id="tbl-iret-body"><tr class="empty-row"><td colspan="5">Loading...</td></tr></tbody>
    </table></div>
  </div></div>`;
});
window._pageBinders['issue-return'] = async () => { await loadIssueReturns(); $('#btn-new-return').onclick = () => showIssueReturnModal(); };
async function loadIssueReturns() {
  const data = await api('/api/issue-returns');
  const tbody = $('#tbl-iret-body'); if (!tbody) return;
  tbody.innerHTML = data.length ? data.map(d => `<tr>
    <td>${d.IssueReturnID}</td><td>${fmtDate(d.ReturnDate)}</td>
    <td>${d.DealerCompanyName||'-'}</td><td>${d.IssueID||'-'}</td>
    <td><button class="btn btn-info btn-sm" onclick="viewReturnDetails(${d.IssueReturnID})"><i class="fas fa-eye"></i> Details</button></td>
  </tr>`).join('') : `<tr class="empty-row"><td colspan="5">No returns found.</td></tr>`;
}
window.viewReturnDetails = async (id) => {
  const items = await api(`/api/issue-returns/${id}/items`);
  modalHtml(`Return #${id} – Details`, `
    <div class="table-wrapper"><table>
      <thead><tr><th>Item</th><th>Qty</th><th>Rate</th><th>Amount</th></tr></thead>
      <tbody>${items.map(i=>`<tr><td>${i.ItemName}</td><td>${i.Qty}</td><td>₹${fmtNum(i.Rate)}</td><td>₹${fmtNum(i.Amount)}</td></tr>`).join('')}</tbody>
    </table></div>`, 'modal-lg');
};
window.showIssueReturnModal = async () => {
  const [dealers, allItems, issues] = await Promise.all([api('/api/dealers'), api('/api/items'), api('/api/issues')]);
  let lines = [];
  const ov = modalHtml('New Issue Return', `
    <div class="form-row cols-3">
      <div class="form-field"><label>Dealer *</label>
        <select id="ir-dealer"><option value="">--</option>${dealers.map(d=>`<option value="${d.DealerID}">${d.DealerCompanyName}</option>`).join('')}</select>
      </div>
      <div class="form-field"><label>Return Date *</label><input type="date" id="ir-date" value="${new Date().toISOString().split('T')[0]}"/></div>
      <div class="form-field"><label>Against Issue ID</label>
        <select id="ir-issue"><option value="">--</option>${issues.map(i=>`<option value="${i.IssueID}">Issue #${i.IssueID} (${fmtDate(i.IssueDate)})</option>`).join('')}</select>
      </div>
    </div>
    <hr class="section-divider"/>
    <div style="display:flex;justify-content:space-between;margin-bottom:10px">
      <div class="section-label" style="margin:0">Return Items</div>
      <button class="btn btn-secondary btn-sm" id="btn-add-ir-line"><i class="fas fa-plus"></i> Add Item</button>
    </div>
    <div class="items-table-container"><table>
      <thead><tr><th>Item</th><th>Qty</th><th>Rate</th><th>Amount</th><th></th></tr></thead>
      <tbody id="ir-lines-body"></tbody>
    </table></div>
    <div class="modal-footer" style="padding:16px 0 0">
      <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
      <button class="btn btn-primary" id="birr"><i class="fas fa-floppy-disk"></i> Save Return</button>
    </div>`, 'modal-xl');
  const renderIRLines = () => {
    $('#ir-lines-body', ov).innerHTML = lines.map((l, i) => `<tr>
      <td><select class="ir-item-sel" data-i="${i}"><option value="">--</option>${allItems.map(it=>`<option value="${it.Itemid}" ${it.Itemid==l.ItemID?'selected':''}>${it.ItemName}</option>`).join('')}</select></td>
      <td><input type="number" class="ir-qty" data-i="${i}" value="${l.Qty||1}"/></td>
      <td><input type="number" class="ir-rate" data-i="${i}" value="${l.Rate||0}" step="0.01"/></td>
      <td>₹${fmtNum((l.Qty||1)*(l.Rate||0))}</td>
      <td><button class="btn btn-danger btn-icon" onclick="removeIRLine(${i})"><i class="fas fa-xmark"></i></button></td>
    </tr>`).join('');
    $$('.ir-item-sel', ov).forEach(s => s.onchange = () => { lines[+s.dataset.i].ItemID = s.value; });
    $$('.ir-qty', ov).forEach(inp => inp.oninput = () => { lines[+inp.dataset.i].Qty = +inp.value; renderIRLines(); });
    $$('.ir-rate', ov).forEach(inp => inp.oninput = () => { lines[+inp.dataset.i].Rate = +inp.value; renderIRLines(); });
  };
  window.removeIRLine = (i) => { lines.splice(i,1); renderIRLines(); };
  $('#btn-add-ir-line', ov).onclick = () => { lines.push({ ItemID:'', Qty:1, Rate:0 }); renderIRLines(); };
  $('#birr', ov).onclick = async () => {
    const b = {
      DealerID: $('#ir-dealer', ov).value, ReturnDate: $('#ir-date', ov).value,
      IssueID: $('#ir-issue', ov).value || null,
      items: lines.filter(l=>l.ItemID).map(l=>({ ItemID:l.ItemID, Qty:l.Qty, Rate:l.Rate, Amount:(+l.Qty)*(+l.Rate) }))
    };
    if (!b.DealerID) return showToast('Dealer required','error');
    try { await api('/api/issue-returns', { method:'POST', body:b }); ov.remove(); showToast('Return saved! Stock restored.'); await loadIssueReturns(); } catch (e) { showToast(e.message,'error'); }
  };
};

// ======== ORDER ITEMS ========
registerPage('orders', async () => {
  return `${pageHeader('Order Items', 'fa-file-invoice', 'Transactions / Order Items',
    `<button class="btn btn-primary" id="btn-new-order"><i class="fas fa-plus"></i> New Order</button>`)}
  <div class="card">
    <div class="table-wrapper"><table>
      <thead><tr><th>Order ID</th><th>Order Date</th><th>Vendor</th><th>Division</th><th>Actions</th></tr></thead>
      <tbody id="tbl-order-body"><tr class="empty-row"><td colspan="5">Loading...</td></tr></tbody>
    </table></div>
  </div></div>`;
});
window._pageBinders['orders'] = async () => { await loadOrders(); $('#btn-new-order').onclick = () => showOrderModal(); };
async function loadOrders() {
  const data = await api('/api/orders');
  const tbody = $('#tbl-order-body'); if (!tbody) return;
  tbody.innerHTML = data.length ? data.map(d => `<tr>
    <td>${d.OrderID}</td><td>${fmtDate(d.OrderDate)}</td>
    <td>${d.VendorName||'-'}</td><td>${d.DivisionID||'-'}</td>
    <td><button class="btn btn-info btn-sm" onclick="viewOrderDetails(${d.OrderID})"><i class="fas fa-eye"></i> Details</button></td>
  </tr>`).join('') : `<tr class="empty-row"><td colspan="5">No orders.</td></tr>`;
}
window.viewOrderDetails = async (id) => {
  const items = await api(`/api/orders/${id}/items`);
  modalHtml(`Order #${id} – Items`, `
    <div class="table-wrapper"><table>
      <thead><tr><th>Item</th><th>Qty</th><th>Rate</th></tr></thead>
      <tbody>${items.map(i=>`<tr><td>${i.ItemName}</td><td>${i.Qty}</td><td>₹${fmtNum(i.Rate)}</td></tr>`).join('')}</tbody>
    </table></div>`, 'modal-lg');
};
window.showOrderModal = async () => {
  const [vendors, items, divs] = await Promise.all([api('/api/vendors'), api('/api/items'), api('/api/divisions')]);
  let lines = [];
  const ov = modalHtml('New Order', `
    <div class="form-row cols-3">
      <div class="form-field"><label>Vendor *</label>
        <select id="ord-vendor"><option value="">--</option>${vendors.map(v=>`<option value="${v.VendorID}">${v.VendorName}</option>`).join('')}</select>
      </div>
      <div class="form-field"><label>Order Date *</label><input type="date" id="ord-date" value="${new Date().toISOString().split('T')[0]}"/></div>
      <div class="form-field"><label>Division</label>
        <select id="ord-div"><option value="">--</option>${divs.map(d=>`<option value="${d.DivisionID}">${d.DivisionName}</option>`).join('')}</select>
      </div>
    </div>
    <hr class="section-divider"/>
    <div style="display:flex;justify-content:space-between;margin-bottom:10px">
      <div class="section-label" style="margin:0">Order Items</div>
      <button class="btn btn-secondary btn-sm" id="btn-add-ord-line"><i class="fas fa-plus"></i> Add Item</button>
    </div>
    <div class="items-table-container"><table>
      <thead><tr><th>Item</th><th>Qty</th><th>Rate</th><th></th></tr></thead>
      <tbody id="ord-lines-body"></tbody>
    </table></div>
    <div class="modal-footer" style="padding:16px 0 0">
      <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
      <button class="btn btn-primary" id="bord"><i class="fas fa-floppy-disk"></i> Save Order</button>
    </div>`, 'modal-lg');
  const renderOrdLines = () => {
    $('#ord-lines-body', ov).innerHTML = lines.map((l, i) => `<tr>
      <td><select class="ord-item-sel" data-i="${i}"><option value="">--</option>${items.map(it=>`<option value="${it.Itemid}" ${it.Itemid==l.ItemID?'selected':''}>${it.ItemName}</option>`).join('')}</select></td>
      <td><input type="number" class="ord-qty" data-i="${i}" value="${l.Qty||1}"/></td>
      <td><input type="number" class="ord-rate" data-i="${i}" value="${l.Rate||0}" step="0.01"/></td>
      <td><button class="btn btn-danger btn-icon" onclick="removeOrdLine(${i})"><i class="fas fa-xmark"></i></button></td>
    </tr>`).join('');
    $$('.ord-item-sel', ov).forEach(s => s.onchange = () => { lines[+s.dataset.i].ItemID = s.value; });
    $$('.ord-qty', ov).forEach(inp => inp.oninput = () => { lines[+inp.dataset.i].Qty = +inp.value; });
    $$('.ord-rate', ov).forEach(inp => inp.oninput = () => { lines[+inp.dataset.i].Rate = +inp.value; });
  };
  window.removeOrdLine = (i) => { lines.splice(i,1); renderOrdLines(); };
  $('#btn-add-ord-line', ov).onclick = () => { lines.push({ ItemID:'', Qty:1, Rate:0 }); renderOrdLines(); };
  $('#bord', ov).onclick = async () => {
    const b = { VendorID: $('#ord-vendor', ov).value, OrderDate: $('#ord-date', ov).value, DivisionID: $('#ord-div', ov).value || null, items: lines.filter(l=>l.ItemID).map(l=>({ ItemID:l.ItemID, Qty:l.Qty, Rate:l.Rate })) };
    if (!b.VendorID) return showToast('Vendor required','error');
    try { await api('/api/orders', { method:'POST', body:b }); ov.remove(); showToast('Order saved!'); await loadOrders(); } catch (e) { showToast(e.message,'error'); }
  };
};

// ======== PENDING PAGES ========
registerPage('inward-return-pending', async () => {
  const data = await api('/api/reports/inward-return-pending').catch(()=>[]);
  return `${pageHeader('Inward Return Pending', 'fa-clock-rotate-left', 'Transactions / Inward Return Pending')}
  <div class="card"><div class="table-wrapper"><table>
    <thead><tr><th>Inward ID</th><th>Vendor</th><th>Inward Date</th><th>Item</th><th>Qty</th></tr></thead>
    <tbody>${data.length ? data.map(d=>`<tr><td>${d.InwardID}</td><td>${d.VendorName||'-'}</td><td>${fmtDate(d.InwardDate)}</td><td>${d.ItemName}</td><td>${d.Qty}</td></tr>`).join('') : '<tr class="empty-row"><td colspan="5">No pending returns.</td></tr>'}</tbody>
  </table></div></div></div>`;
});

registerPage('issue-return-pending', async () => {
  const data = await api('/api/reports/issue-return-pending').catch(()=>[]);
  return `${pageHeader('Return Issue Pending', 'fa-triangle-exclamation', 'Transactions / Return Issue Pending')}
  <div class="card"><div class="table-wrapper"><table>
    <thead><tr><th>Issue ID</th><th>Dealer</th><th>Issue Date</th><th>Item</th><th>Qty</th></tr></thead>
    <tbody>${data.length ? data.map(d=>`<tr><td>${d.IssueID}</td><td>${d.DealerCompanyName||'-'}</td><td>${fmtDate(d.IssueDate)}</td><td>${d.ItemName}</td><td>${d.Qty}</td></tr>`).join('') : '<tr class="empty-row"><td colspan="5">No pending items.</td></tr>'}</tbody>
  </table></div></div></div>`;
});

registerPage('issue-pending', async () => {
  const data = await api('/api/reports/issue-pending').catch(()=>[]);
  return `${pageHeader('Issue Pending Items', 'fa-hourglass-half', 'Transactions / Issue Pending')}
  <div class="card"><div class="table-wrapper"><table>
    <thead><tr><th>Order ID</th><th>Vendor</th><th>Order Date</th><th>Item</th><th>Order Qty</th><th>Issued Qty</th><th>Pending</th></tr></thead>
    <tbody>${data.length ? data.map(d=>`<tr><td>${d.OrderID}</td><td>${d.VendorName||'-'}</td><td>${fmtDate(d.OrderDate)}</td><td>${d.ItemName}</td><td>${d.Qty}</td><td>${d.IssuedQty||0}</td><td><span class="badge badge-warning">${(d.Qty||0)-(d.IssuedQty||0)}</span></td></tr>`).join('') : '<tr class="empty-row"><td colspan="7">No pending items.</td></tr>'}</tbody>
  </table></div></div></div>`;
});
