/* ================================================
   PAGES: Item Master, Vendor, Dealer, User, Login, Kit, Mapping
   ================================================ */

// -------- ITEM MASTER --------
registerPage('items', async () => {
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
    <td>₹${fmtNum(d.SellPrice)}</td>
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

// -------- VENDOR MASTER --------
registerPage('vendors', async () => {
  return `${pageHeader('Vendor Details', 'fa-truck', 'Masters / Vendor',
    `<button class="btn btn-primary" id="btn-add-vendor"><i class="fas fa-plus"></i> Add Vendor</button>`)}
  <div class="card">
    <div class="search-bar"><div class="search-input-wrap"><i class="fas fa-search"></i><input type="text" id="vendor-search" placeholder="Search vendors..."></div></div>
    <div class="table-wrapper"><table>
      <thead><tr><th>Vendor Name</th><th>Company</th><th>Mobile</th><th>City</th><th>State</th><th>GST No</th><th>Actions</th></tr></thead>
      <tbody id="tbl-vendor-body"><tr class="empty-row"><td colspan="7">Loading...</td></tr></tbody>
    </table></div>
  </div></div>`;
});
window._pageBinders['vendors'] = async () => { await loadVendors(); bindTableSearch('vendor-search', 'tbl-vendor-body'); $('#btn-add-vendor').onclick = () => showVendorModal(); };
async function loadVendors() {
  const data = await api('/api/vendors');
  const tbody = $('#tbl-vendor-body'); if (!tbody) return;
  tbody.innerHTML = data.length ? data.map(d => `<tr>
    <td><strong>${d.VendorName||''}</strong></td><td>${d.CompanyName||'-'}</td>
    <td>${d.Mobile||'-'}</td><td>${d.CityName||'-'}</td><td>${d.StateName||'-'}</td>
    <td>${d.GSTNo||'-'}</td>
    <td><div class="btn-bar">
      <button class="btn btn-info btn-sm" onclick="showVendorModal(${d.VendorID})"><i class="fas fa-pen"></i></button>
      <button class="btn btn-danger btn-sm" onclick="deleteVendor(${d.VendorID})"><i class="fas fa-trash"></i></button>
    </div></td></tr>`).join('') : `<tr class="empty-row"><td colspan="7">No vendors.</td></tr>`;
}
window.showVendorModal = async (id) => {
  const [cities, states] = await Promise.all([api('/api/cities'), api('/api/states')]);
  let rec = {};
  if (id) { const data = await api('/api/vendors'); rec = data.find(d => d.VendorID === id) || {}; }
  const ov = modalHtml(id ? 'Edit Vendor' : 'Add Vendor', `
    <div class="form-row cols-2">
      <div class="form-field"><label>Vendor Name *</label><input type="text" id="vn-name" value="${rec.VendorName||''}"/></div>
      <div class="form-field"><label>Company Name</label><input type="text" id="vn-company" value="${rec.CompanyName||''}"/></div>
    </div>
    <div class="form-row cols-2">
      <div class="form-field"><label>Address 1</label><input type="text" id="vn-a1" value="${rec.Address1||''}"/></div>
      <div class="form-field"><label>Address 2</label><input type="text" id="vn-a2" value="${rec.Address2||''}"/></div>
    </div>
    <div class="form-row cols-3">
      <div class="form-field"><label>State</label>
        <select id="vn-state">${states.map(s => `<option value="${s.StateID}" ${s.StateID==rec.StateID?'selected':''}>${s.StateName}</option>`).join('')}</select>
      </div>
      <div class="form-field"><label>City</label>
        <select id="vn-city">${cities.map(c => `<option value="${c.CityID}" ${c.CityID==rec.CityID?'selected':''}>${c.CityName}</option>`).join('')}</select>
      </div>
      <div class="form-field"><label>Pin Code</label><input type="text" id="vn-pin" value="${rec.PinCode||''}"/></div>
    </div>
    <div class="form-row cols-3">
      <div class="form-field"><label>Mobile</label><input type="text" id="vn-mob" value="${rec.Mobile||''}"/></div>
      <div class="form-field"><label>GST No</label><input type="text" id="vn-gst" value="${rec.GSTNo||''}"/></div>
      <div class="form-field"><label>PAN No</label><input type="text" id="vn-pan" value="${rec.PANNo||''}"/></div>
    </div>
    <div class="form-row cols-3">
      <div class="form-field"><label>Aadhar No</label><input type="text" id="vn-aadhar" value="${rec.AadharNo||''}"/></div>
      <div class="form-field"><label>Bank Name</label><input type="text" id="vn-bank" value="${rec.BankName||''}"/></div>
      <div class="form-field"><label>Bank Acc No</label><input type="text" id="vn-bankac" value="${rec.BankAccNo||''}"/></div>
    </div>
    <div class="form-row cols-2">
      <div class="form-field"><label>IFSC Code</label><input type="text" id="vn-ifsc" value="${rec.IFSCCode||''}"/></div>
    </div>
    <div class="modal-footer" style="padding:16px 0 0">
      <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
      <button class="btn btn-primary" id="bvn"><i class="fas fa-floppy-disk"></i> Save</button>
    </div>`, 'modal-xl');
  $('#bvn', ov).onclick = async () => {
    const b = {
      VendorName: $('#vn-name', ov).value.trim(), CompanyName: $('#vn-company', ov).value.trim(),
      Address1: $('#vn-a1', ov).value, Address2: $('#vn-a2', ov).value,
      StateID: $('#vn-state', ov).value, CityID: $('#vn-city', ov).value, PinCode: $('#vn-pin', ov).value,
      Mobile: $('#vn-mob', ov).value, GSTNo: $('#vn-gst', ov).value, PANNo: $('#vn-pan', ov).value,
      AadharNo: $('#vn-aadhar', ov).value, BankName: $('#vn-bank', ov).value,
      BankAccNo: $('#vn-bankac', ov).value, IFSCCode: $('#vn-ifsc', ov).value
    };
    if (!b.VendorName) return showToast('Vendor name required', 'error');
    try {
      if (id) await api(`/api/vendors/${id}`, { method: 'PUT', body: b });
      else await api('/api/vendors', { method: 'POST', body: b });
      ov.remove(); showToast('Vendor saved!'); await loadVendors();
    } catch (e) { showToast(e.message, 'error'); }
  };
};
window.deleteVendor = async (id) => { if (!await confirm('Delete?')) return; try { await api(`/api/vendors/${id}`, { method: 'DELETE' }); showToast('Deleted!'); await loadVendors(); } catch (e) { showToast(e.message, 'error'); } };

// -------- DEALER MASTER --------
registerPage('dealers', async () => {
  return `${pageHeader('Dealer Master', 'fa-store', 'Masters / Dealer',
    `<button class="btn btn-primary" id="btn-add-dealer"><i class="fas fa-plus"></i> Add Dealer</button>`)}
  <div class="card">
    <div class="search-bar">
      <select id="dealer-search-by" style="background:var(--bg-dark);border:1px solid var(--border);color:var(--text-primary);padding:9px 12px;border-radius:6px">
        <option value="CompanyName">Company Name</option>
        <option value="PersonName">Contact Person</option>
        <option value="DealerID">Dealer ID</option>
      </select>
      <div class="search-input-wrap"><i class="fas fa-search"></i><input type="text" id="dealer-search-val" placeholder="Search dealers..."></div>
      <button class="btn btn-secondary" id="btn-dealer-search"><i class="fas fa-magnifying-glass"></i> Search</button>
    </div>
    <div class="table-wrapper"><table>
      <thead><tr><th>ID</th><th>Company Name</th><th>Contact Person</th><th>Mobile</th><th>City</th><th>State</th><th>Actions</th></tr></thead>
      <tbody id="tbl-dealer-body"><tr class="empty-row"><td colspan="7">Loading...</td></tr></tbody>
    </table></div>
  </div></div>`;
});
window._pageBinders['dealers'] = async () => {
  await loadDealers();
  $('#btn-dealer-search').onclick = () => loadDealers($('#dealer-search-val').value, $('#dealer-search-by').value);
  $('#dealer-search-val').onkeydown = e => { if (e.key === 'Enter') loadDealers($('#dealer-search-val').value, $('#dealer-search-by').value); };
  $('#btn-add-dealer').onclick = () => showDealerModal();
};
async function loadDealers(search = '', searchBy = 'CompanyName') {
  const params = search ? `?search=${encodeURIComponent(search)}&searchBy=${searchBy}` : '';
  const data = await api('/api/dealers' + params);
  const tbody = $('#tbl-dealer-body'); if (!tbody) return;
  tbody.innerHTML = data.length ? data.map(d => `<tr>
    <td>${d.DealerID}</td><td><strong>${d.DealerCompanyName||''}</strong></td>
    <td>${d.ContactPersonName||'-'}</td><td>${d.Mobile||'-'}</td>
    <td>${d.CityName||'-'}</td><td>${d.StateName||'-'}</td>
    <td><div class="btn-bar">
      <button class="btn btn-info btn-sm" onclick="showDealerModal(${d.DealerID})"><i class="fas fa-pen"></i></button>
      <button class="btn btn-danger btn-sm" onclick="deleteDealer(${d.DealerID})"><i class="fas fa-trash"></i></button>
    </div></td></tr>`).join('') : `<tr class="empty-row"><td colspan="7">No dealers found.</td></tr>`;
}
window.showDealerModal = async (id) => {
  const [cities, states, divs] = await Promise.all([api('/api/cities'), api('/api/states'), api('/api/divisions')]);
  let rec = {};
  if (id) rec = await api(`/api/dealers/${id}`) || {};
  const ov = modalHtml(id ? 'Edit Dealer' : 'Add Dealer', `
    <div class="form-row cols-2">
      <div class="form-field"><label>Company Name *</label><input type="text" id="dl-company" value="${rec.DealerCompanyName||''}"/></div>
      <div class="form-field"><label>Contact Person</label><input type="text" id="dl-contact" value="${rec.ContactPersonName||''}"/></div>
    </div>
    <div class="form-row cols-3">
      <div class="form-field"><label>Mobile</label><input type="text" id="dl-mob" value="${rec.Mobile||''}"/></div>
      <div class="form-field"><label>Tel No</label><input type="text" id="dl-tel" value="${rec.TelNo||''}"/></div>
      <div class="form-field"><label>Email</label><input type="email" id="dl-email" value="${rec.Email||''}"/></div>
    </div>
    <div class="form-row cols-3">
      <div class="form-field"><label>Address 1</label><input type="text" id="dl-a1" value="${rec.Address1||''}"/></div>
      <div class="form-field"><label>Address 2</label><input type="text" id="dl-a2" value="${rec.Address2||''}"/></div>
      <div class="form-field"><label>Address 3</label><input type="text" id="dl-a3" value="${rec.Address3||''}"/></div>
    </div>
    <div class="form-row cols-3">
      <div class="form-field"><label>State</label>
        <select id="dl-state"><option value="">--</option>${states.map(s=>`<option value="${s.StateID}" ${s.StateID==rec.StateID?'selected':''}>${s.StateName}</option>`).join('')}</select>
      </div>
      <div class="form-field"><label>City</label>
        <select id="dl-city"><option value="">--</option>${cities.map(c=>`<option value="${c.CityID}" ${c.CityID==rec.CityID?'selected':''}>${c.CityName}</option>`).join('')}</select>
      </div>
      <div class="form-field"><label>Pin Code</label><input type="text" id="dl-pin" value="${rec.PinCode||''}"/></div>
    </div>
    <div class="form-row cols-3">
      <div class="form-field"><label>GST No</label><input type="text" id="dl-gst" value="${rec.GSTNo||''}"/></div>
      <div class="form-field"><label>PAN No</label><input type="text" id="dl-pan" value="${rec.PANNo||''}"/></div>
      <div class="form-field"><label>Aadhar No</label><input type="text" id="dl-aadhar" value="${rec.AadharNo||''}"/></div>
    </div>
    <div class="form-row cols-3">
      <div class="form-field"><label>Bank Name</label><input type="text" id="dl-bank" value="${rec.BankName||''}"/></div>
      <div class="form-field"><label>Bank Acc No</label><input type="text" id="dl-bankac" value="${rec.BankAccNo||''}"/></div>
      <div class="form-field"><label>IFSC Code</label><input type="text" id="dl-ifsc" value="${rec.IFSCCode||''}"/></div>
    </div>
    <div class="form-row cols-3">
      <div class="form-field"><label>Dealer Type</label><input type="text" id="dl-type" value="${rec.DealerType||''}"/></div>
      <div class="form-field"><label>Place of Sales Promotion</label><input type="text" id="dl-place" value="${rec.PlaceOfSalesPromotion||''}"/></div>
      <div class="form-field"><label>Division</label>
        <select id="dl-div"><option value="">--</option>${divs.map(d=>`<option value="${d.DivisionID}" ${d.DivisionID==rec.DivisionID?'selected':''}>${d.DivisionName}</option>`).join('')}</select>
      </div>
    </div>
    <div class="modal-footer" style="padding:16px 0 0">
      <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
      <button class="btn btn-primary" id="bdl"><i class="fas fa-floppy-disk"></i> Save</button>
    </div>`, 'modal-xl');
  $('#bdl', ov).onclick = async () => {
    const b = {
      DealerCompanyName: $('#dl-company', ov).value.trim(), ContactPersonName: $('#dl-contact', ov).value.trim(),
      Mobile: $('#dl-mob', ov).value, TelNo: $('#dl-tel', ov).value, Email: $('#dl-email', ov).value,
      Address1: $('#dl-a1', ov).value, Address2: $('#dl-a2', ov).value, Address3: $('#dl-a3', ov).value,
      StateID: $('#dl-state', ov).value || null, CityID: $('#dl-city', ov).value || null,
      PinCode: $('#dl-pin', ov).value, GSTNo: $('#dl-gst', ov).value, PANNo: $('#dl-pan', ov).value,
      AadharNo: $('#dl-aadhar', ov).value, BankName: $('#dl-bank', ov).value,
      BankAccNo: $('#dl-bankac', ov).value, IFSCCode: $('#dl-ifsc', ov).value,
      DealerType: $('#dl-type', ov).value, PlaceOfSalesPromotion: $('#dl-place', ov).value,
      DivisionID: $('#dl-div', ov).value || null
    };
    if (!b.DealerCompanyName) return showToast('Company name required', 'error');
    try {
      if (id) await api(`/api/dealers/${id}`, { method: 'PUT', body: b });
      else await api('/api/dealers', { method: 'POST', body: b });
      ov.remove(); showToast('Dealer saved!'); await loadDealers();
    } catch (e) { showToast(e.message, 'error'); }
  };
};
window.deleteDealer = async (id) => { if (!await confirm('Delete this dealer?')) return; try { await api(`/api/dealers/${id}`, { method: 'DELETE' }); showToast('Deleted!'); await loadDealers(); } catch (e) { showToast(e.message, 'error'); } };

// -------- USER MASTER --------
registerPage('user-master', async () => {
  return simpleMasterPage('User Master', 'fa-users-gear', 'Masters / User Master',
    [{ label: 'Name' }, { label: 'Login ID' }, { label: 'Email' }], 'btn-add-user', 'tbl-user');
});
window._pageBinders['user-master'] = async () => { await loadUsers(); bindTableSearch('tbl-search-tbl-user', 'tbl-user-body'); $('#btn-add-user').onclick = () => showUserModal(); };
async function loadUsers() {
  const data = await api('/api/users');
  const tbody = $('#tbl-user-body'); if (!tbody) return;
  tbody.innerHTML = data.length ? data.map(d => `<tr>
    <td>${d.UserName}</td><td>${d.LoginID}</td><td>${d.Email||'-'}</td>
    <td><div class="btn-bar">
      <button class="btn btn-info btn-sm" onclick="showUserModal(${d.UserID})"><i class="fas fa-pen"></i></button>
      <button class="btn btn-danger btn-sm" onclick="deleteUser(${d.UserID})"><i class="fas fa-trash"></i></button>
    </div></td></tr>`).join('') : `<tr class="empty-row"><td colspan="4">No users.</td></tr>`;
}
window.showUserModal = async (id) => {
  let rec = {};
  if (id) { const data = await api('/api/users'); rec = data.find(d => d.UserID === id) || {}; }
  const ov = modalHtml(id ? 'Edit User' : 'Add User', `
    <div class="form-row cols-2">
      <div class="form-field"><label>User Name *</label><input type="text" id="um-name" value="${rec.UserName||''}"/></div>
      <div class="form-field"><label>Login ID *</label><input type="text" id="um-lid" value="${rec.LoginID||''}"/></div>
    </div>
    <div class="form-row cols-2">
      <div class="form-field"><label>${id ? 'New Password (blank=no change)' : 'Password *'}</label><input type="password" id="um-pwd"/></div>
      <div class="form-field"><label>Email</label><input type="email" id="um-email" value="${rec.Email||''}"/></div>
    </div>
    <div class="modal-footer" style="padding:16px 0 0">
      <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
      <button class="btn btn-primary" id="bum"><i class="fas fa-floppy-disk"></i> Save</button>
    </div>`);
  $('#bum', ov).onclick = async () => {
    const b = { UserName: $('#um-name', ov).value.trim(), LoginID: $('#um-lid', ov).value.trim(), Password: $('#um-pwd', ov).value.trim(), Email: $('#um-email', ov).value.trim() };
    if (!b.UserName || !b.LoginID) return showToast('Name and Login ID required', 'error');
    try {
      if (id) await api(`/api/users/${id}`, { method: 'PUT', body: b });
      else await api('/api/users', { method: 'POST', body: b });
      ov.remove(); showToast('Saved!'); await loadUsers();
    } catch (e) { showToast(e.message, 'error'); }
  };
};
window.deleteUser = async (id) => { if (!await confirm('Delete?')) return; try { await api(`/api/users/${id}`, { method: 'DELETE' }); showToast('Deleted!'); await loadUsers(); } catch (e) { showToast(e.message, 'error'); } };

// -------- LOGIN MASTER --------
registerPage('login-master', async () => {
  return `${pageHeader('Login Master', 'fa-key', 'Masters / Login Master',
    `<button class="btn btn-primary" id="btn-add-login"><i class="fas fa-plus"></i> Add Login</button>`)}
  <div class="card">
    <div class="table-wrapper"><table>
      <thead><tr><th>Login ID</th><th>User Name</th><th>Status</th><th>Actions</th></tr></thead>
      <tbody id="tbl-login-body"><tr class="empty-row"><td colspan="4">Loading...</td></tr></tbody>
    </table></div>
  </div></div>`;
});
window._pageBinders['login-master'] = async () => { await loadLogins(); $('#btn-add-login').onclick = () => showLoginModal(); };
async function loadLogins() {
  const data = await api('/api/logins');
  const tbody = $('#tbl-login-body'); if (!tbody) return;
  tbody.innerHTML = data.length ? data.map(d => `<tr>
    <td>${d.LoginID}</td><td>${d.UserName||'-'}</td>
    <td><span class="badge ${d.Status==='Y' ? 'badge-success' : 'badge-danger'}">${d.Status==='Y' ? 'Active' : 'Inactive'}</span></td>
    <td><div class="btn-bar">
      <button class="btn btn-info btn-sm" onclick="showLoginModal('${d.LoginID}')"><i class="fas fa-pen"></i></button>
      <button class="btn btn-danger btn-sm" onclick="deleteLogin('${d.LoginID}')"><i class="fas fa-trash"></i></button>
    </div></td></tr>`).join('') : `<tr class="empty-row"><td colspan="4">No logins.</td></tr>`;
}
window.showLoginModal = async (id) => {
  let rec = {};
  if (id) { const data = await api('/api/logins'); rec = data.find(d => d.LoginID === id) || {}; }
  const ov = modalHtml(id ? 'Edit Login' : 'Add Login', `
    <div class="form-row cols-2">
      <div class="form-field"><label>Login ID *</label><input type="text" id="lm-lid" value="${rec.LoginID||''}" ${id ? 'readonly' : ''}/></div>
      <div class="form-field"><label>Password *</label><input type="password" id="lm-pwd"/></div>
    </div>
    <div class="form-field"><label>Status</label>
      <select id="lm-status"><option value="Y" ${rec.Status==='Y'?'selected':''}>Active</option><option value="N" ${rec.Status==='N'?'selected':''}>Inactive</option></select>
    </div>
    <div class="modal-footer" style="padding:16px 0 0">
      <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
      <button class="btn btn-primary" id="blm"><i class="fas fa-floppy-disk"></i> Save</button>
    </div>`);
  $('#blm', ov).onclick = async () => {
    const b = { Password: $('#lm-pwd', ov).value.trim(), Status: $('#lm-status', ov).value };
    const lid = $('#lm-lid', ov).value.trim();
    try {
      if (id) await api(`/api/logins/${id}`, { method: 'PUT', body: b });
      else await api('/api/logins', { method: 'POST', body: { LoginID: lid, ...b } });
      ov.remove(); showToast('Saved!'); await loadLogins();
    } catch (e) { showToast(e.message, 'error'); }
  };
};
window.deleteLogin = async (id) => { if (!await confirm('Delete login?')) return; try { await api(`/api/logins/${id}`, { method: 'DELETE' }); showToast('Deleted!'); await loadLogins(); } catch (e) { showToast(e.message, 'error'); } };

// -------- ITEM-VENDOR MAPPING --------
registerPage('item-vendor-map', async () => {
  return `${pageHeader('Item–Vendor Mapping', 'fa-link', 'Masters / Item–Vendor Mapping',
    `<button class="btn btn-primary" id="btn-add-ivm"><i class="fas fa-plus"></i> Add Mapping</button>`)}
  <div class="card">
    <div class="table-wrapper"><table>
      <thead><tr><th>Item Name</th><th>Vendor Name</th><th>Actions</th></tr></thead>
      <tbody id="tbl-ivm-body"><tr class="empty-row"><td colspan="3">Loading...</td></tr></tbody>
    </table></div>
  </div></div>`;
});
window._pageBinders['item-vendor-map'] = async () => { await loadIVM(); $('#btn-add-ivm').onclick = () => showIVMModal(); };
async function loadIVM() {
  const data = await api('/api/item-vendor-mapping');
  const tbody = $('#tbl-ivm-body'); if (!tbody) return;
  tbody.innerHTML = data.length ? data.map(d => `<tr>
    <td>${d.ItemName||'-'}</td><td>${d.VendorName||'-'}</td>
    <td><button class="btn btn-danger btn-sm" onclick="deleteIVM(${d.MappingID})"><i class="fas fa-trash"></i></button></td>
  </tr>`).join('') : `<tr class="empty-row"><td colspan="3">No mappings.</td></tr>`;
}
window.showIVMModal = async () => {
  const [items, vendors] = await Promise.all([api('/api/items'), api('/api/vendors')]);
  const ov = modalHtml('Add Item–Vendor Mapping', `
    <div class="form-row cols-2">
      <div class="form-field"><label>Item *</label>
        <select id="ivm-item"><option value="">-- Select --</option>${items.map(i => `<option value="${i.Itemid}">${i.ItemName}</option>`).join('')}</select>
      </div>
      <div class="form-field"><label>Vendor *</label>
        <select id="ivm-vendor"><option value="">-- Select --</option>${vendors.map(v => `<option value="${v.VendorID}">${v.VendorName}</option>`).join('')}</select>
      </div>
    </div>
    <div class="modal-footer" style="padding:16px 0 0">
      <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
      <button class="btn btn-primary" id="bivm"><i class="fas fa-floppy-disk"></i> Save</button>
    </div>`);
  $('#bivm', ov).onclick = async () => {
    const ItemID = $('#ivm-item', ov).value, VendorID = $('#ivm-vendor', ov).value;
    if (!ItemID || !VendorID) return showToast('Select item and vendor', 'error');
    try { await api('/api/item-vendor-mapping', { method: 'POST', body: { ItemID, VendorID } }); ov.remove(); showToast('Saved!'); await loadIVM(); } catch (e) { showToast(e.message, 'error'); }
  };
};
window.deleteIVM = async (id) => { if (!await confirm('Remove mapping?')) return; try { await api(`/api/item-vendor-mapping/${id}`, { method: 'DELETE' }); showToast('Removed!'); await loadIVM(); } catch (e) { showToast(e.message, 'error'); } };

// -------- KIT MASTER --------
registerPage('kit-master', async () => {
  return `${pageHeader('Kit Master', 'fa-cubes', 'Masters / Kit Master',
    `<button class="btn btn-primary" id="btn-add-kit"><i class="fas fa-plus"></i> Add Kit</button>`)}
  <div class="card">
    <div class="table-wrapper"><table>
      <thead><tr><th>Kit ID</th><th>Kit Name</th><th>Actions</th></tr></thead>
      <tbody id="tbl-kit-body"><tr class="empty-row"><td colspan="3">Loading...</td></tr></tbody>
    </table></div>
  </div></div>`;
});
window._pageBinders['kit-master'] = async () => { await loadKits(); $('#btn-add-kit').onclick = () => showKitModal(); };
async function loadKits() {
  const data = await api('/api/kits');
  const tbody = $('#tbl-kit-body'); if (!tbody) return;
  tbody.innerHTML = data.length ? data.map(d => `<tr>
    <td>${d.KitID}</td><td>${d.KitName}</td>
    <td><button class="btn btn-info btn-sm" onclick="viewKitDetails(${d.KitID},'${d.KitName}')"><i class="fas fa-eye"></i> Details</button></td>
  </tr>`).join('') : `<tr class="empty-row"><td colspan="3">No kits.</td></tr>`;
}
window.viewKitDetails = async (id, name) => {
  const data = await api(`/api/kits/${id}/details`);
  const ov = modalHtml(`Kit: ${name}`, `
    <div class="table-wrapper"><table>
      <thead><tr><th>Item Name</th><th>Qty</th></tr></thead>
      <tbody>${data.length ? data.map(d => `<tr><td>${d.ItemName||d.ItemID}</td><td>${d.Qty}</td></tr>`).join('') : '<tr class="empty-row"><td colspan="2">No items in this kit.</td></tr>'}</tbody>
    </table></div>`);
};
window.showKitModal = async () => {
  const items = await api('/api/items');
  let lines = [{ ItemID: '', Qty: 1 }];
  const ov = modalHtml('Add Kit', `
    <div class="form-field" style="margin-bottom:16px"><label>Kit Name *</label><input type="text" id="kit-name"/></div>
    <div class="section-label">Items in Kit</div>
    <div id="kit-lines"></div>
    <button class="btn btn-secondary" id="btn-add-kit-line"><i class="fas fa-plus"></i> Add Item Row</button>
    <div class="modal-footer" style="padding:16px 0 0">
      <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
      <button class="btn btn-primary" id="bkit"><i class="fas fa-floppy-disk"></i> Save Kit</button>
    </div>`, 'modal-lg');
  const renderLines = () => {
    $('#kit-lines', ov).innerHTML = lines.map((l, i) => `
      <div class="form-row cols-2" style="margin-bottom:8px">
        <select class="kit-item-sel" style="background:var(--bg-dark);border:1px solid var(--border);color:var(--text-primary);padding:9px;border-radius:6px" data-i="${i}">
          <option value="">-- Select Item --</option>${items.map(it => `<option value="${it.Itemid}" ${it.Itemid==l.ItemID?'selected':''}>${it.ItemName}</option>`).join('')}
        </select>
        <input type="number" class="kit-qty-inp" data-i="${i}" value="${l.Qty||1}" style="background:var(--bg-dark);border:1px solid var(--border);color:var(--text-primary);padding:9px;border-radius:6px;width:100%"/>
      </div>`).join('');
    $$('.kit-item-sel', ov).forEach(s => s.onchange = e => { lines[+s.dataset.i].ItemID = s.value; });
    $$('.kit-qty-inp', ov).forEach(inp => inp.oninput = e => { lines[+inp.dataset.i].Qty = inp.value; });
  };
  renderLines();
  $('#btn-add-kit-line', ov).onclick = () => { lines.push({ ItemID: '', Qty: 1 }); renderLines(); };
  $('#bkit', ov).onclick = async () => {
    const KitName = $('#kit-name', ov).value.trim();
    if (!KitName) return showToast('Kit name required', 'error');
    const validLines = lines.filter(l => l.ItemID);
    try { await api('/api/kits', { method: 'POST', body: { KitName, items: validLines } }); ov.remove(); showToast('Kit saved!'); await loadKits(); } catch (e) { showToast(e.message, 'error'); }
  };
};
