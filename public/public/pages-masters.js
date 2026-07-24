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
  const [items, vendors, dealers, issues, inward] = await Promise.all([
    api('/api/items').catch(() => []),
    api('/api/vendors').catch(() => []),
    api('/api/dealers').catch(() => []),
    api('/api/issues').catch(() => []),
    api('/api/inward').catch(() => []),
  ]);

  const lowStock = (items || []).filter(i => (i.Stock || 0) <= (i.ReorderLevel || 0));

  return `${pageHeader('Dashboard', 'fa-chart-pie', 'Home / Dashboard')}
  <div class="stats-grid">
    <div class="stat-card"><div class="stat-icon gold"><i class="fas fa-box"></i></div>
      <div><div class="stat-value">${(items||[]).length}</div><div class="stat-label">Total Items</div></div></div>
    <div class="stat-card"><div class="stat-icon blue"><i class="fas fa-truck"></i></div>
      <div><div class="stat-value">${(vendors||[]).length}</div><div class="stat-label">Vendors</div></div></div>
    <div class="stat-card"><div class="stat-icon green"><i class="fas fa-store"></i></div>
      <div><div class="stat-value">${(dealers||[]).length}</div><div class="stat-label">Dealers</div></div></div>
    <div class="stat-card"><div class="stat-icon red"><i class="fas fa-arrow-up-from-bracket"></i></div>
      <div><div class="stat-value">${(issues||[]).length}</div><div class="stat-label">Issue Transactions</div></div></div>
    <div class="stat-card"><div class="stat-icon purple"><i class="fas fa-arrow-down-to-bracket"></i></div>
      <div><div class="stat-value">${(inward||[]).length}</div><div class="stat-label">Inward Transactions</div></div></div>
    <div class="stat-card"><div class="stat-icon red"><i class="fas fa-triangle-exclamation"></i></div>
      <div><div class="stat-value">${lowStock.length}</div><div class="stat-label">Low Stock Items</div></div></div>
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
  </div>`;
});

// -------- DIVISION --------
registerPage('divisions', async () => {
  return simpleMasterPage('Division Master', 'fa-layer-group', 'Masters / Division',
    [{ label: 'Division Name' }], 'btn-add-division', 'tbl-division');
});

window._pageBinders = window._pageBinders || {};
window._pageBinders['divisions'] = async () => {
  await loadDivisions();
  bindTableSearch('tbl-search-tbl-division', 'tbl-division-body');
  $('#btn-add-division').onclick = () => showDivisionModal();
};

async function loadDivisions() {
  const data = await api('/api/divisions');
  const tbody = $('#tbl-division-body');
  if (!tbody) return;
  tbody.innerHTML = data.length ? data.map(d => `
    <tr data-id="${d.DivisionID}">
      <td>${d.DivisionName}</td>
      <td>
        <div class="btn-bar">
          <button class="btn btn-info btn-sm" onclick="showDivisionModal(${d.DivisionID},'${d.DivisionName.replace(/'/g,"\\'")}')"><i class="fas fa-pen"></i></button>
          <button class="btn btn-danger btn-sm" onclick="deleteDivision(${d.DivisionID})"><i class="fas fa-trash"></i></button>
        </div>
      </td>
    </tr>`).join('') : `<tr class="empty-row"><td colspan="2">No divisions found.</td></tr>`;
}

window.showDivisionModal = (id, name = '') => {
  const overlay = modalHtml(id ? 'Edit Division' : 'Add Division', `
    <div class="form-field"><label>Division Name *</label>
      <input type="text" id="div-name" value="${name}" placeholder="Enter division name" /></div>
    <div class="modal-footer" style="padding:16px 0 0">
      <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
      <button class="btn btn-primary" id="btn-save-div"><i class="fas fa-floppy-disk"></i> Save</button>
    </div>`);
  $('#btn-save-div', overlay).onclick = async () => {
    const DivisionName = $('#div-name', overlay).value.trim();
    if (!DivisionName) return showToast('Division name is required', 'error');
    try {
      if (id) await api(`/api/divisions/${id}`, { method: 'PUT', body: { DivisionName } });
      else await api('/api/divisions', { method: 'POST', body: { DivisionName } });
      overlay.remove(); showToast('Division saved!'); await loadDivisions();
    } catch (e) { showToast(e.message, 'error'); }
  };
};
window.deleteDivision = async (id) => {
  if (!await confirm('Delete this division?')) return;
  try { await api(`/api/divisions/${id}`, { method: 'DELETE' }); showToast('Deleted!'); await loadDivisions(); }
  catch (e) { showToast(e.message, 'error'); }
};

// -------- DEPARTMENT --------
registerPage('departments', async () => {
  return simpleMasterPage('Department Master', 'fa-building', 'Masters / Department',
    [{ label: 'Department Name' }], 'btn-add-dept', 'tbl-dept');
});
window._pageBinders['departments'] = async () => {
  await loadDepartments();
  bindTableSearch('tbl-search-tbl-dept', 'tbl-dept-body');
  $('#btn-add-dept').onclick = () => showDeptModal();
};
async function loadDepartments() {
  const data = await api('/api/departments');
  const tbody = $('#tbl-dept-body');
  if (!tbody) return;
  tbody.innerHTML = data.length ? data.map(d => `
    <tr><td>${d.DepartmentName}</td>
    <td><div class="btn-bar">
      <button class="btn btn-info btn-sm" onclick="showDeptModal(${d.DepartmentID},'${d.DepartmentName.replace(/'/g,"\\'")}')"><i class="fas fa-pen"></i></button>
      <button class="btn btn-danger btn-sm" onclick="deleteDept(${d.DepartmentID})"><i class="fas fa-trash"></i></button>
    </div></td></tr>`).join('') : `<tr class="empty-row"><td colspan="2">No departments found.</td></tr>`;
}
window.showDeptModal = (id, name = '') => {
  const ov = modalHtml(id ? 'Edit Department' : 'Add Department', `
    <div class="form-field"><label>Department Name *</label>
      <input type="text" id="dept-name" value="${name}" placeholder="Enter department name" /></div>
    <div class="modal-footer" style="padding:16px 0 0">
      <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
      <button class="btn btn-primary" id="btn-save-dept"><i class="fas fa-floppy-disk"></i> Save</button>
    </div>`);
  $('#btn-save-dept', ov).onclick = async () => {
    const DepartmentName = $('#dept-name', ov).value.trim();
    if (!DepartmentName) return showToast('Name required', 'error');
    try {
      if (id) await api(`/api/departments/${id}`, { method: 'PUT', body: { DepartmentName } });
      else await api('/api/departments', { method: 'POST', body: { DepartmentName } });
      ov.remove(); showToast('Saved!'); await loadDepartments();
    } catch (e) { showToast(e.message, 'error'); }
  };
};
window.deleteDept = async (id) => {
  if (!await confirm('Delete this department?')) return;
  try { await api(`/api/departments/${id}`, { method: 'DELETE' }); showToast('Deleted!'); await loadDepartments(); }
  catch (e) { showToast(e.message, 'error'); }
};

// -------- CATEGORY --------
registerPage('categories', async () => {
  return simpleMasterPage('Product Category', 'fa-tags', 'Masters / Category',
    [{ label: 'Category Name' }, { label: 'Category Code' }], 'btn-add-cat', 'tbl-cat');
});
window._pageBinders['categories'] = async () => {
  await loadCategories();
  bindTableSearch('tbl-search-tbl-cat', 'tbl-cat-body');
  $('#btn-add-cat').onclick = () => showCatModal();
};
async function loadCategories() {
  const data = await api('/api/categories');
  const tbody = $('#tbl-cat-body');
  if (!tbody) return;
  tbody.innerHTML = data.length ? data.map(d => `
    <tr><td>${d.CategoryName}</td><td>${d.CategoryCode || ''}</td>
    <td><div class="btn-bar">
      <button class="btn btn-info btn-sm" onclick="showCatModal(${d.CategoryId},'${(d.CategoryName||'').replace(/'/g,"\\'")}','${(d.CategoryCode||'').replace(/'/g,"\\'")}')"><i class="fas fa-pen"></i></button>
      <button class="btn btn-danger btn-sm" onclick="deleteCat(${d.CategoryId})"><i class="fas fa-trash"></i></button>
    </div></td></tr>`).join('') : `<tr class="empty-row"><td colspan="3">No categories found.</td></tr>`;
}
window.showCatModal = (id, name = '', code = '') => {
  const ov = modalHtml(id ? 'Edit Category' : 'Add Category', `
    <div class="form-row cols-2">
      <div class="form-field"><label>Category Name *</label><input type="text" id="cat-name" value="${name}"/></div>
      <div class="form-field"><label>Category Code</label><input type="text" id="cat-code" value="${code}"/></div>
    </div>
    <div class="modal-footer" style="padding:16px 0 0">
      <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
      <button class="btn btn-primary" id="btn-save-cat"><i class="fas fa-floppy-disk"></i> Save</button>
    </div>`);
  $('#btn-save-cat', ov).onclick = async () => {
    const CategoryName = $('#cat-name', ov).value.trim();
    const CategoryCode = $('#cat-code', ov).value.trim();
    if (!CategoryName) return showToast('Name required', 'error');
    try {
      if (id) await api(`/api/categories/${id}`, { method: 'PUT', body: { CategoryName, CategoryCode } });
      else await api('/api/categories', { method: 'POST', body: { CategoryName, CategoryCode } });
      ov.remove(); showToast('Saved!'); await loadCategories();
    } catch (e) { showToast(e.message, 'error'); }
  };
};
window.deleteCat = async (id) => {
  if (!await confirm('Delete this category?')) return;
  try { await api(`/api/categories/${id}`, { method: 'DELETE' }); showToast('Deleted!'); await loadCategories(); }
  catch (e) { showToast(e.message, 'error'); }
};

// -------- STATE / CITY --------
registerPage('states', async () => {
  return `${pageHeader('State & City Master', 'fa-map', 'Masters / State & City')}
  <div class="tabs">
    <div class="tab active" id="tab-states">States</div>
    <div class="tab" id="tab-cities">Cities</div>
  </div>
  <div id="tab-content-states">
    <div class="card">
      <div class="btn-bar" style="margin-bottom:16px">
        <div class="search-input-wrap"><i class="fas fa-search"></i><input type="text" id="state-search" placeholder="Search state..."></div>
        <button class="btn btn-primary" id="btn-add-state"><i class="fas fa-plus"></i> Add State</button>
      </div>
      <div class="table-wrapper"><table id="tbl-state">
        <thead><tr><th>State Name</th><th>Actions</th></tr></thead>
        <tbody id="tbl-state-body"><tr class="empty-row"><td colspan="2">Loading...</td></tr></tbody>
      </table></div>
    </div>
  </div>
  <div id="tab-content-cities" style="display:none">
    <div class="card">
      <div class="btn-bar" style="margin-bottom:16px">
        <div class="search-input-wrap"><i class="fas fa-search"></i><input type="text" id="city-search" placeholder="Search city..."></div>
        <button class="btn btn-primary" id="btn-add-city"><i class="fas fa-plus"></i> Add City</button>
      </div>
      <div class="table-wrapper"><table id="tbl-city">
        <thead><tr><th>City Name</th><th>State</th><th>Actions</th></tr></thead>
        <tbody id="tbl-city-body"><tr class="empty-row"><td colspan="3">Loading...</td></tr></tbody>
      </table></div>
    </div>
  </div></div>`;
});
window._pageBinders['states'] = async () => {
  await loadStates(); await loadCities();
  const tabStates = $('#tab-states'), tabCities = $('#tab-cities');
  tabStates.onclick = () => { tabStates.classList.add('active'); tabCities.classList.remove('active'); $('#tab-content-states').style.display=''; $('#tab-content-cities').style.display='none'; };
  tabCities.onclick = () => { tabCities.classList.add('active'); tabStates.classList.remove('active'); $('#tab-content-cities').style.display=''; $('#tab-content-states').style.display='none'; };
  $('#btn-add-state').onclick = () => showStateModal();
  $('#btn-add-city').onclick = () => showCityModal();
  bindTableSearch('state-search', 'tbl-state-body');
  bindTableSearch('city-search', 'tbl-city-body');
};
async function loadStates() {
  const data = await api('/api/states');
  const tbody = $('#tbl-state-body'); if (!tbody) return;
  tbody.innerHTML = data.length ? data.map(d => `<tr>
    <td>${d.StateName}</td>
    <td><div class="btn-bar">
      <button class="btn btn-info btn-sm" onclick="showStateModal(${d.StateID},'${(d.StateName||'').replace(/'/g,"\\'")}')"><i class="fas fa-pen"></i></button>
      <button class="btn btn-danger btn-sm" onclick="deleteState(${d.StateID})"><i class="fas fa-trash"></i></button>
    </div></td></tr>`).join('') : `<tr class="empty-row"><td colspan="2">No states.</td></tr>`;
}
async function loadCities() {
  const data = await api('/api/cities');
  const tbody = $('#tbl-city-body'); if (!tbody) return;
  tbody.innerHTML = data.length ? data.map(d => `<tr>
    <td>${d.CityName}</td><td>${d.StateName||''}</td>
    <td><div class="btn-bar">
      <button class="btn btn-info btn-sm" onclick="showCityModal(${d.CityID},'${(d.CityName||'').replace(/'/g,"\\'")}',${d.StateID||0})"><i class="fas fa-pen"></i></button>
      <button class="btn btn-danger btn-sm" onclick="deleteCity(${d.CityID})"><i class="fas fa-trash"></i></button>
    </div></td></tr>`).join('') : `<tr class="empty-row"><td colspan="3">No cities.</td></tr>`;
}
window.showStateModal = (id, name = '') => {
  const ov = modalHtml(id ? 'Edit State' : 'Add State', `
    <div class="form-field"><label>State Name *</label><input type="text" id="state-name" value="${name}"/></div>
    <div class="modal-footer" style="padding:16px 0 0">
      <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
      <button class="btn btn-primary" id="bss"><i class="fas fa-floppy-disk"></i> Save</button>
    </div>`);
  $('#bss', ov).onclick = async () => {
    const StateName = $('#state-name', ov).value.trim();
    if (!StateName) return showToast('Required', 'error');
    try { if (id) await api(`/api/states/${id}`, { method: 'PUT', body: { StateName } }); else await api('/api/states', { method: 'POST', body: { StateName } }); ov.remove(); showToast('Saved!'); await loadStates(); } catch (e) { showToast(e.message, 'error'); }
  };
};
window.deleteState = async (id) => { if (!await confirm('Delete?')) return; try { await api(`/api/states/${id}`, { method: 'DELETE' }); showToast('Deleted!'); await loadStates(); } catch (e) { showToast(e.message, 'error'); } };
window.showCityModal = async (id, name = '', stateId = 0) => {
  const states = await api('/api/states');
  const ov = modalHtml(id ? 'Edit City' : 'Add City', `
    <div class="form-row cols-2">
      <div class="form-field"><label>City Name *</label><input type="text" id="city-name" value="${name}"/></div>
      <div class="form-field"><label>State *</label>
        <select id="city-state">${states.map(s => `<option value="${s.StateID}" ${s.StateID == stateId ? 'selected' : ''}>${s.StateName}</option>`).join('')}</select>
      </div>
    </div>
    <div class="modal-footer" style="padding:16px 0 0">
      <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
      <button class="btn btn-primary" id="bcs"><i class="fas fa-floppy-disk"></i> Save</button>
    </div>`);
  $('#bcs', ov).onclick = async () => {
    const CityName = $('#city-name', ov).value.trim();
    const StateID = $('#city-state', ov).value;
    if (!CityName) return showToast('Required', 'error');
    try { if (id) await api(`/api/cities/${id}`, { method: 'PUT', body: { CityName, StateID } }); else await api('/api/cities', { method: 'POST', body: { CityName, StateID } }); ov.remove(); showToast('Saved!'); await loadCities(); } catch (e) { showToast(e.message, 'error'); }
  };
};
window.deleteCity = async (id) => { if (!await confirm('Delete?')) return; try { await api(`/api/cities/${id}`, { method: 'DELETE' }); showToast('Deleted!'); await loadCities(); } catch (e) { showToast(e.message, 'error'); } };

// -------- COURIER --------
registerPage('couriers', async () => {
  return simpleMasterPage('Courier Details', 'fa-motorcycle', 'Masters / Courier',
    [{ label: 'Courier Name' }, { label: 'Contact No' }, { label: 'Address' }], 'btn-add-courier', 'tbl-courier');
});
window._pageBinders['couriers'] = async () => { await loadCouriers(); bindTableSearch('tbl-search-tbl-courier', 'tbl-courier-body'); $('#btn-add-courier').onclick = () => showCourierModal(); };
async function loadCouriers() {
  const data = await api('/api/couriers');
  const tbody = $('#tbl-courier-body'); if (!tbody) return;
  tbody.innerHTML = data.length ? data.map(d => `<tr>
    <td>${d.CourierName}</td><td>${d.ContactNo||''}</td><td>${d.Address||''}</td>
    <td><div class="btn-bar">
      <button class="btn btn-info btn-sm" onclick="showCourierModal(${d.CourierID})"><i class="fas fa-pen"></i></button>
      <button class="btn btn-danger btn-sm" onclick="deleteCourier(${d.CourierID})"><i class="fas fa-trash"></i></button>
    </div></td></tr>`).join('') : `<tr class="empty-row"><td colspan="4">No couriers found.</td></tr>`;
}
window.showCourierModal = async (id) => {
  let rec = {};
  if (id) { const data = await api('/api/couriers'); rec = data.find(d => d.CourierID === id) || {}; }
  const ov = modalHtml(id ? 'Edit Courier' : 'Add Courier', `
    <div class="form-row cols-2">
      <div class="form-field"><label>Courier Name *</label><input type="text" id="cr-name" value="${rec.CourierName||''}"/></div>
      <div class="form-field"><label>Contact No</label><input type="text" id="cr-contact" value="${rec.ContactNo||''}"/></div>
    </div>
    <div class="form-field"><label>Address</label><textarea id="cr-addr">${rec.Address||''}</textarea></div>
    <div class="modal-footer" style="padding:16px 0 0">
      <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
      <button class="btn btn-primary" id="bcr"><i class="fas fa-floppy-disk"></i> Save</button>
    </div>`);
  $('#bcr', ov).onclick = async () => {
    const b = { CourierName: $('#cr-name', ov).value.trim(), ContactNo: $('#cr-contact', ov).value.trim(), Address: $('#cr-addr', ov).value.trim() };
    if (!b.CourierName) return showToast('Name required', 'error');
    try { if (id) await api(`/api/couriers/${id}`, { method: 'PUT', body: b }); else await api('/api/couriers', { method: 'POST', body: b }); ov.remove(); showToast('Saved!'); await loadCouriers(); } catch (e) { showToast(e.message, 'error'); }
  };
};
window.deleteCourier = async (id) => { if (!await confirm('Delete?')) return; try { await api(`/api/couriers/${id}`, { method: 'DELETE' }); showToast('Deleted!'); await loadCouriers(); } catch (e) { showToast(e.message, 'error'); } };

// -------- KISNA REGION STATE --------
registerPage('kisna-region', async () => {
  const data = await api('/api/kisna-region-states');
  return `${pageHeader('Kisna Region State', 'fa-globe-asia', 'Masters / Kisna Region State')}
  <div class="card">
    <div class="table-wrapper"><table>
      <thead><tr><th>ID</th><th>Region</th><th>State</th></tr></thead>
      <tbody>${data.length ? data.map(d => `<tr><td>${d.ID||d.KisnaRegionStateID||''}</td><td>${d.Region||''}</td><td>${d.State||d.StateName||''}</td></tr>`).join('') : '<tr class="empty-row"><td colspan="3">No data found.</td></tr>'}</tbody>
    </table></div>
  </div></div>`;
});
