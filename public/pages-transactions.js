/* ================================================
   PAGES: Transactions &#8211; Purchase Inward, Issue Items,
          Issue Return, Orders, Pending Reports
   ================================================ */

// ======== PURCHASE INWARD (Full Entry Form) ========

let _iwDivs = [], _iwVendors = [], _iwCouriers = [], _iwVendorItems = [], _iwCurrentDivId = '';
let _iwLines = [];   // array of item objects currently being built
let _iwEditId = null; // if editing existing inward
let _iwEditingIndex = null; // index of preview row being edited (null = add mode)

const _IW_INPUT = `style="background:var(--bg-dark);border:1px solid var(--border);border-radius:6px;padding:6px 10px;color:var(--text-primary);width:100%;font-size:13px"`;
const _IW_SELECT = `style="background:var(--bg-dark);border:1px solid var(--border);border-radius:6px;padding:6px 10px;color:var(--text-primary);width:100%;font-size:13px;cursor:pointer"`;
const _IW_LABEL = `style="font-size:11.5px;font-weight:600;color:var(--text-muted);margin-bottom:4px;display:block"`;
const _IW_FIELD = `style="display:flex;flex-direction:column"`;

registerPage('purchase-inward', () => {
  const today = new Date().toISOString().split('T')[0];
  return `
  <div style="padding:0">
    <div style="background:var(--bg-card);padding:20px 28px 16px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between">
      <div>
        <h2 style="margin:0;font-size:18px;font-weight:700;color:var(--text-primary);display:flex;align-items:center;gap:10px">
          <i class="fas fa-box-open" style="color:var(--accent)"></i> Purchase Inward Entry
        </h2>
        <div style="font-size:12px;color:var(--text-muted);margin-top:3px">Transactions / Purchase Inward Entry</div>
      </div>
      <button class="btn btn-secondary" id="btn-iw-view-records" style="font-size:13px">
        <i class="fas fa-table-list"></i> View Records</button>
    </div>

    <div class="card" style="padding:20px 24px">
      <!-- Section 1: Inward Details -->
      <div style="font-size:12px;font-weight:700;color:var(--accent);letter-spacing:1px;text-transform:uppercase;margin-bottom:14px;padding-bottom:6px;border-bottom:1px solid var(--border)">
        <i class="fas fa-circle-info" style="margin-right:6px"></i>Inward Details
      </div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-bottom:16px">
        <div ${_IW_FIELD}><label ${_IW_LABEL}>Division <span style="color:var(--danger)">*</span></label>
          <select id="iw-div" ${_IW_SELECT}><option value="">&#8212; Select &#8212;</option></select></div>
        <div ${_IW_FIELD}><label ${_IW_LABEL}>Order Number</label>
          <div style="display:flex;gap:6px">
            <input type="text" id="iw-order-num" ${_IW_INPUT} placeholder="e.g. ORD129"/>
            <button class="btn btn-secondary btn-sm" id="btn-iw-load-order" title="Load items from this order" style="white-space:nowrap;padding:6px 10px"><i class="fas fa-download"></i></button>
          </div>
        </div>
        <div ${_IW_FIELD}><label ${_IW_LABEL}>DC Number (Delivery Challan)</label>
          <input type="text" id="iw-dc-num" ${_IW_INPUT}/></div>
        <div ${_IW_FIELD}><label ${_IW_LABEL}>Invoice Number</label>
          <input type="text" id="iw-inv-num" ${_IW_INPUT}/></div>
        <div ${_IW_FIELD}><label ${_IW_LABEL}>Inward Date</label>
          <input type="date" id="iw-date" value="${today}" ${_IW_INPUT}/></div>
        <div ${_IW_FIELD}><label ${_IW_LABEL}>Vendor Name <span style="color:var(--danger)">*</span></label>
          <div style="display:flex;gap:6px;align-items:center">
            <select id="iw-vendor" ${_IW_SELECT} style="flex:1"><option value="">&#8212; Select Vendor &#8212;</option></select>
            <button type="button" onclick="window._iwOpenVendorSearch()" title="Search Vendor"
              style="padding:6px 10px;background:var(--accent);border:none;border-radius:6px;color:#fff;cursor:pointer;flex-shrink:0;font-size:13px">
              <i class="fas fa-magnifying-glass"></i></button>
          </div></div>
      </div>

      <!-- Section 2: Item Entry Row -->
      <div style="font-size:12px;font-weight:700;color:var(--accent);letter-spacing:1px;text-transform:uppercase;margin-bottom:14px;padding-bottom:6px;border-bottom:1px solid var(--border)">
        <i class="fas fa-box" style="margin-right:6px"></i>Item Entry
      </div>
      <div id="iw-item-panel">
        <!-- Rendered by _iwRenderItemPanel() -->
      </div>

      <!-- Add Row buttons -->
      <div style="display:flex;gap:10px;margin:16px 0">
        <button class="btn btn-success btn-sm" id="btn-iw-add-row">
          ${_iwEditingIndex !== null ? '<i class=\"fas fa-pen-to-square\"></i> Update Item' : '<i class=\"fas fa-plus\"></i> Add Item to List'}</button>
        <button class="btn btn-danger btn-sm" id="btn-iw-clear-row">
          <i class="fas fa-rotate-left"></i> Clear Form</button>
      </div>

      <!-- Preview Table -->
      <div style="font-size:12px;font-weight:700;color:var(--accent);letter-spacing:1px;text-transform:uppercase;margin-bottom:10px;padding-bottom:6px;border-bottom:1px solid var(--border)">
        <i class="fas fa-list" style="margin-right:6px"></i>Items Preview
      </div>
      <div style="overflow-x:auto;max-height:260px;overflow-y:auto;border:1px solid var(--border);border-radius:8px">
        <table id="tbl-iw-preview" style="width:100%;border-collapse:collapse;min-width:1000px;font-size:12px">
          <thead style="background:var(--bg-dark);position:sticky;top:0;z-index:2">
            <tr>
              <th style="padding:8px;text-align:center;width:36px">#</th>
              <th style="padding:8px;text-align:left">Category</th>
              <th style="padding:8px;text-align:left">Item Name</th>
              <th style="padding:8px;text-align:center">DC Qty</th>
              <th style="padding:8px;text-align:center">Item Qty</th>
              <th style="padding:8px;text-align:center">Rate</th>
              <th style="padding:8px;text-align:right">Total Amt</th>
              <th style="padding:8px;text-align:center">Item Status</th>
              <th style="padding:8px;text-align:left">Reason</th>
              <th style="padding:8px;text-align:center">Return Mode</th>
              <th style="padding:8px;text-align:left">Person / Courier</th>
              <th style="padding:8px;text-align:center">Return Date</th>
              <th style="padding:8px;text-align:center">Track ID</th>
              <th style="padding:8px;text-align:center;width:40px"></th>
            </tr>
          </thead>
          <tbody id="tbl-iw-preview-body">
            <tr class="empty-row"><td colspan="14" style="padding:20px;text-align:center;color:var(--text-muted)">
              No items added yet. Fill in the form above and click "Add Item to List".</td></tr>
          </tbody>
        </table>
      </div>

      <!-- Action Buttons -->
      <div style="display:flex;gap:12px;justify-content:flex-end;margin-top:20px;padding-top:16px;border-top:1px solid var(--border)">
        <button class="btn btn-secondary" id="btn-iw-cancel">
          <i class="fas fa-xmark"></i> Cancel / Reset</button>
        <button class="btn btn-primary" id="btn-iw-save">
          <i class="fas fa-floppy-disk"></i> Save Inward</button>
      </div>
    </div>
  </div>`;
});

window._pageBinders['purchase-inward'] = async () => {
  _iwLines = []; _iwEditId = null;
  // Load reference data
  try {
    [_iwDivs, _iwVendors, _iwCouriers] = await Promise.all([
      api('/api/divisions?active=1'), api('/api/vendors?activeOnly=1'), api('/api/couriers')
    ]);
  } catch (_) { }
  _iwCurrentDivId = '';
  // Populate Division dropdown
  const divSel = $('#iw-div');
  if (divSel) _iwDivs.forEach(d => divSel.insertAdjacentHTML('beforeend',
    `<option value="${d.DivisionId || d.DivisionID}">${d.DivisionName}</option>`));
  // Populate Vendor dropdown
  const venSel = $('#iw-vendor');
  if (venSel) _iwVendors.forEach(v => venSel.insertAdjacentHTML('beforeend',
    `<option value="${v.vendorid || v.VendorID}" data-company="${v.CompanyName || ""}">${(v.Name || v.VendorName) + (v.CompanyName ? " (" + v.CompanyName + ")" : "")}</option>`));

  // Division change â†’ reset lines if any, then re-fetch items for new div+vendor
  if (divSel) divSel.onchange = async () => {
    const newDivId = divSel.value;
    if (_iwLines.length > 0) {
      if (!await confirm('Changing the Division will clear all added items. Continue?')) {
        divSel.value = _iwCurrentDivId; // revert
        return;
      }
      _iwLines = []; _iwRenderPreview();
    }
    _iwCurrentDivId = newDivId;
    const vid = venSel?.value || '';
    try {
      const p = new URLSearchParams();
      if (vid) p.set('vendorId', vid);
      if (newDivId) p.set('divisionId', newDivId);
      _iwVendorItems = (vid || newDivId) ? await api('/api/inward/items-by-vendor?' + p) : [];
    } catch (_) { _iwVendorItems = []; }
    _iwRenderItemPanel();
  };

  // Vendor change â†’ load items filtered by vendor + current division
  if (venSel) venSel.onchange = async () => {
    const vid = venSel.value;
    const divId = divSel?.value || '';
    if (!vid) { _iwVendorItems = []; _iwRenderItemPanel(); return; }
    try {
      const p = new URLSearchParams({ vendorId: vid });
      if (divId) p.set('divisionId', divId);
      _iwVendorItems = await api('/api/inward/items-by-vendor?' + p);
    } catch (_) { _iwVendorItems = []; }
    _iwRenderItemPanel();
  };
  _iwRenderItemPanel();
  // Load Order button
  $('#btn-iw-load-order').onclick = () => _iwLoadFromOrder();
  // Add item to list
  $('#btn-iw-add-row').onclick = () => _iwAddLineToPreview();
  // Clear row
  $('#btn-iw-clear-row').onclick = () => _iwRenderItemPanel();
  // Save
  $('#btn-iw-save').onclick = () => _iwSave();
  // Cancel/Reset
  $('#btn-iw-cancel').onclick = () => {
    _iwLines = []; _iwEditingIndex = null; _iwEditId = null;
    // Re-enable all Inward Detail fields
    ['#iw-vendor', '#iw-div', '#iw-order-num', '#iw-dc-num', '#iw-inv-num', '#iw-date'].forEach(sel => {
      const el = $(sel); if (!el) return;
      el.disabled = false; el.style.opacity = '1'; el.style.cursor = '';
    });
    const saveBtnC = $('#btn-iw-save');
    if (saveBtnC) { saveBtnC.disabled = false; saveBtnC.style.opacity = '1'; saveBtnC.title = ''; }
    _iwRenderPreview(); _iwRenderItemPanel();
    ['#iw-order-num', '#iw-dc-num', '#iw-inv-num'].forEach(id => { const el = $(id); if (el) el.value = ''; });
    const dSel = $('#iw-date'); if (dSel) dSel.value = new Date().toISOString().split('T')[0];
    const dvSel = $('#iw-div'); if (dvSel) dvSel.value = '';
  };
  // View Records
  $('#btn-iw-view-records').onclick = () => _iwShowRecords();
  _iwRenderPreview();
};

/* ---- Item Entry Panel ---- */
function _iwRenderItemPanel() {
  const panel = $('#iw-item-panel'); if (!panel) return;
  // View Records mode â€” lock the Item Entry section entirely
  if (_iwEditId !== null) {
    panel.innerHTML = `<div style="display:flex;align-items:center;gap:12px;padding:18px 16px;
        background:rgba(100,100,100,.07);border-radius:8px;border:1px dashed var(--border)">
      <i class="fas fa-lock" style="color:var(--text-muted);font-size:20px"></i>
      <div>
        <div style="font-weight:600;color:var(--text-primary);font-size:13px">Item Entry Disabled</div>
        <div style="font-size:12px;color:var(--text-muted);margin-top:2px">
          This inward has already been saved. Items cannot be modified from the view mode.
        </div>
      </div>
    </div>`;
    return;
  }
  const itemOpts = _iwVendorItems.length
    ? _iwVendorItems.map(i => `<option value="${i.ItemId}"
        data-cat="${i.CategoryId}" data-catname="${i.CategoryName || ''}"
        data-rate="${i.DefaultRate || 0}">${i.ItemName}</option>`).join('')
    : `<option value="">&#8212; Select vendor first &#8212;</option>`;

  panel.innerHTML = `
    <div style="display:grid;grid-template-columns:2fr 1fr 1fr 1fr 1.2fr;gap:10px;margin-bottom:10px;align-items:start">
      <div ${_IW_FIELD}><label ${_IW_LABEL}>Item Name <span style="color:var(--danger)">*</span></label>
        <select id="iwf-item" ${_IW_SELECT}>
          <option value="">&#8212; Select Item &#8212;</option>${itemOpts}</select></div>
      <div ${_IW_FIELD}><label ${_IW_LABEL}>DC Qty <span style="color:var(--danger)">*</span></label>
        <input type="text" inputmode="numeric" id="iwf-dcqty" value="0" ${_IW_INPUT}/></div>
      <div ${_IW_FIELD}><label ${_IW_LABEL}>Item Qty <span style="color:var(--danger)">*</span></label>
        <input type="text" inputmode="numeric" id="iwf-qty" value="0" ${_IW_INPUT}/>
        <div id="iwf-qty-err" style="color:var(--danger);font-size:11px;margin-top:2px;min-height:14px"></div></div>
      <div ${_IW_FIELD}><label ${_IW_LABEL}>Rate/Qty</label>
        <input type="text" inputmode="decimal" id="iwf-rate" value="0" ${_IW_INPUT}/></div>
      <div ${_IW_FIELD}><label ${_IW_LABEL}>Total Amount</label>
        <input type="text" id="iwf-amt" readonly value="0.00"
          style="background:var(--bg-dark);border:1px dashed var(--border);border-radius:6px;padding:6px 10px;color:var(--accent);width:100%;font-size:13px;cursor:default"/></div>
    </div>
    <div style="display:grid;grid-template-columns:1.5fr 1.5fr 1fr;gap:10px;margin-bottom:10px;align-items:start">
      <div ${_IW_FIELD}><label ${_IW_LABEL}>Item Status <span style="color:var(--danger)">*</span></label>
        <select id="iwf-status" ${_IW_SELECT}>
          <option value="">&mdash; Select &mdash;</option>
          <option value="Complete">Complete</option>
          <option value="Return Complete">Return Complete</option>
          <option value="Return Pending">Return Pending</option>
          <option value="Scrap Complete">Scrap Complete</option>
          <option value="Scrap Pending">Scrap Pending</option>
        </select></div>
      <div ${_IW_FIELD} id="iwf-reason-wrap"><label ${_IW_LABEL}>Reason for Return</label>
        <div style="display:flex;gap:6px">
          <select id="iwf-reason" ${_IW_SELECT} disabled style="opacity:.5">
            <option value="">&#8212; Select &#8212;</option>
            <option value="Wrong Materials">Wrong Materials</option>
            <option value="Found damaged at destination">Found damaged at destination</option>
            <option value="Return to Stock">Return to Stock</option>
            <option value="Scrap">Scrap</option>
            <option value="Other">Other</option>
          </select>
          <input type="text" id="iwf-reason-other" ${_IW_INPUT} placeholder="Specify..." style="display:none;width:0;padding:6px 8px"/>
        </div>
      </div>
      <div ${_IW_FIELD}><label ${_IW_LABEL}>Return Mode <span style="color:var(--danger)" id="iwf-rmode-star" style="display:none">*</span></label>
        <select id="iwf-rmode" ${_IW_SELECT} disabled style="opacity:.5">
          <option value="">&#8212; Select &#8212;</option>
          <option value="Hand">Hand</option>
          <option value="Courier">Courier</option>
        </select></div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1.5fr 1fr 1fr;gap:10px;align-items:end" id="iwf-extra">
      <div ${_IW_FIELD}><label ${_IW_LABEL}>Person Name <span style="color:var(--danger)" id="iwf-pname-star" style="display:none">*</span></label>
        <input type="text" id="iwf-pname" ${_IW_INPUT} disabled style="opacity:.5"/></div>
      <div ${_IW_FIELD}><label ${_IW_LABEL}>Courier Name <span style="color:var(--danger)">*</span></label>
        <select id="iwf-courier" ${_IW_SELECT} disabled style="opacity:.5">
          <option value="">&#8212; Select Courier &#8212;</option>
          ${_iwCouriers.map(c => `<option value="${c.CourierID || c.CourierId}">${c.Name || c.CourierName}</option>`).join('')}
        </select></div>
      <div ${_IW_FIELD}><label ${_IW_LABEL}>Return Date</label>
        <input type="date" id="iwf-retdate" value="${new Date().toISOString().split('T')[0]}"
          ${_IW_INPUT} disabled style="opacity:.5"/></div>
      <div ${_IW_FIELD}><label ${_IW_LABEL}>Track ID</label>
        <input type="text" id="iwf-trackid" ${_IW_INPUT} disabled style="opacity:.5"/></div>
    </div>`;

  // Auto-calc total amount
  const _iwRecalcAmt = () => {
    const q = parseFloat($('#iwf-qty')?.value) || 0;
    const r = parseFloat($('#iwf-rate')?.value) || 0;
    const a = $('#iwf-amt'); if (a) a.value = (q * r).toFixed(2);
  };
  // Item Qty â‰¤ DC Qty â€” real-time inline validation
  const _iwValidateItemQty = () => {
    const dc = parseInt($('#iwf-dcqty')?.value) || 0;
    const q = parseInt($('#iwf-qty')?.value) || 0;
    const qEl = $('#iwf-qty'); if (!qEl) return;
    const errEl = document.getElementById('iwf-qty-err'); // pre-placed in template
    const hasErr = q > 0 && dc > 0 && q > dc;
    if (errEl) errEl.textContent = hasErr ? `Cannot exceed DC Qty (${dc})` : '';
    qEl.style.borderColor = hasErr ? 'var(--danger)' : '';
    const addBtn = $('#btn-iw-add-row');
    if (addBtn) addBtn.disabled = hasErr;
  };
  const qtyEl = $('#iwf-qty');
  const dcQtyEl = $('#iwf-dcqty');
  if (qtyEl) qtyEl.oninput = () => { _iwRecalcAmt(); _iwValidateItemQty(); };
  if (dcQtyEl) dcQtyEl.oninput = () => _iwValidateItemQty();
  $('#iwf-rate')?.addEventListener('input', _iwRecalcAmt);
  // Auto-fill rate when item selected
  const itemSel = $('#iwf-item');
  if (itemSel) itemSel.onchange = () => {
    const opt = itemSel.selectedOptions[0];
    const rate = opt?.dataset?.rate || 0;
    const rateEl = $('#iwf-rate'); if (rateEl) { rateEl.value = rate; rateEl.dispatchEvent(new Event('input')); }
  };
  // Item Status change &#8594; conditional logic
  const statSel = $('#iwf-status');
  if (statSel) statSel.onchange = () => _iwApplyStatusLogic();
  // Return Mode change &#8594; conditional
  const rmodeSel = $('#iwf-rmode');
  if (rmodeSel) rmodeSel.onchange = () => _iwApplyReturnModeLogic();
  // Reason &#8594; show Other textbox
  const reasonSel = $('#iwf-reason');
  if (reasonSel) reasonSel.onchange = () => {
    const otherBox = $('#iwf-reason-other');
    if (!otherBox) return;
    if (reasonSel.value === 'Other') { otherBox.style.display = ''; otherBox.style.width = '140px'; }
    else { otherBox.style.display = 'none'; otherBox.style.width = '0'; }
  };
  _iwApplyStatusLogic();
}

function _iwSetField(id, enabled) {
  const el = $(id); if (!el) return;
  el.disabled = !enabled;
  el.style.opacity = enabled ? '1' : '0.45';
}
function _iwApplyStatusLogic() {
  const stat = $('#iwf-status')?.value || '';
  const enable = stat !== 'Complete' && stat !== '';
  _iwSetField('#iwf-reason', enable);
  if (!enable) { const r = $('#iwf-reason'); if (r) r.value = ''; const ro = $('#iwf-reason-other'); if (ro) { ro.style.display = 'none'; ro.value = ''; } }

  const enableRet = stat === 'Return Complete';
  _iwSetField('#iwf-rmode', enableRet);
  if (!enableRet) { const r = $('#iwf-rmode'); if (r) r.value = ''; }
  // When not Return Complete &#8594; courier/person disabled
  if (!enableRet) {
    ['#iwf-pname', '#iwf-courier', '#iwf-retdate', '#iwf-trackid'].forEach(id => _iwSetField(id, false));
  } else { _iwApplyReturnModeLogic(); }
}
function _iwApplyReturnModeLogic() {
  const mode = $('#iwf-rmode')?.value || '';
  const isHand = mode === 'Hand', isCourier = mode === 'Courier';
  _iwSetField('#iwf-pname', isHand);
  ['#iwf-courier', '#iwf-retdate', '#iwf-trackid'].forEach(id => _iwSetField(id, isCourier));
  if (!isHand) { const p = $('#iwf-pname'); if (p) p.value = ''; }
  if (!isCourier) { ['#iwf-courier', '#iwf-trackid'].forEach(id => { const el = $(id); if (el) el.value = ''; }); }
}

/* ---- Collect current form row and add to lines ---- */
function _iwAddLineToPreview() {
  const itemSel = $('#iwf-item');
  if (!itemSel || !itemSel.value) return showToast('Select an item', 'error');
  const isEditMode = _iwEditingIndex !== null;
  const dcqty = parseInt($('#iwf-dcqty')?.value) || 0;
  const qty = parseInt($('#iwf-qty')?.value) || 0;
  if (dcqty <= 0) return showToast('DC Qty must be > 0', 'error');
  if (qty <= 0) return showToast('Item Qty must be > 0', 'error');
  if (qty > dcqty) return showToast(`Item Qty (${qty}) cannot exceed DC Qty (${dcqty})`, 'error');

  const opt = itemSel.selectedOptions[0];
  const rate = parseFloat($('#iwf-rate')?.value) || 0;
  const stat = $('#iwf-status')?.value || '';
  if (!stat) return showToast('Please select an Item Status', 'error');
  const reason = stat !== 'Complete' ? ($('#iwf-reason')?.value || '') : '';
  const reasonOther = reason === 'Other' ? ($('#iwf-reason-other')?.value || '') : '';
  const rmode = stat === 'Return Complete' ? ($('#iwf-rmode')?.value || '') : '';
  const pname = rmode === 'Hand' ? ($('#iwf-pname')?.value || '') : '';
  const courierEl = $('#iwf-courier');
  const courierName = rmode === 'Courier'
    ? (courierEl?.selectedOptions[0]?.text || '') : '';
  const courierId = rmode === 'Courier' ? courierEl?.value || '' : '';
  const retDate = rmode === 'Courier' ? ($('#iwf-retdate')?.value || '') : '';
  const trackId = rmode === 'Courier' ? ($('#iwf-trackid')?.value || '') : '';

  const lineObj = {
    ItemId: itemSel.value, ItemName: opt.text,
    CategoryId: opt.dataset.cat, CategoryName: opt.dataset.catname,
    DCQty: dcqty, TotalQty: qty, Rate: rate, TotalAmt: qty * rate,
    ItemStatus: stat, Reason: reasonOther || reason,
    ReturnMode: rmode, PersonName: pname,
    CourierName: courierName, CourierId: courierId,
    ReturnDate: retDate, TrackId: trackId
  };
  if (isEditMode) {
    // Preserve the locked fields from the original line
    lineObj.ItemId = _iwLines[_iwEditingIndex].ItemId;
    lineObj.ItemName = _iwLines[_iwEditingIndex].ItemName;
    lineObj.CategoryId = _iwLines[_iwEditingIndex].CategoryId;
    lineObj.CategoryName = _iwLines[_iwEditingIndex].CategoryName;
    lineObj.DCQty = _iwLines[_iwEditingIndex].DCQty;
    _iwLines[_iwEditingIndex] = lineObj;
    _iwEditingIndex = null;
    // Re-enable Vendor
    const vendEl = $('#iw-vendor');
    if (vendEl) { vendEl.disabled = false; vendEl.style.opacity = '1'; }
    _iwRenderPreview();
    _iwRenderItemPanel();
    showToast('Item updated in list', 'success');
  } else {
    _iwLines.push(lineObj);
    _iwRenderPreview();
    _iwRenderItemPanel();
    showToast('Item added to list', 'success');
  }
}

/* ---- Render Preview Table ---- */
function _iwRenderPreview() {
  const tbody = $('#tbl-iw-preview-body'); if (!tbody) return;
  if (!_iwLines.length) {
    tbody.innerHTML = `<tr class="empty-row"><td colspan="14" style="padding:20px;text-align:center;color:var(--text-muted)">
      No items added yet. Fill in the form above and click "Add Item to List".</td></tr>`;
    return;
  }
  tbody.innerHTML = _iwLines.map((l, i) => {
    const rowBg = _iwEditingIndex === i ? 'background:rgba(99,102,241,.12);' : '';
    // View Records mode â†’ read-only rows (locked)
    if (_iwEditId !== null) {
      return `<tr style="border-bottom:1px solid var(--border);background:rgba(100,100,100,.04)">
      <td style="padding:6px 8px;text-align:center;color:var(--text-muted)">${i + 1}</td>
      <td style="padding:6px 8px">${l.CategoryName || '&#8212;'}</td>
      <td style="padding:6px 8px;font-weight:600">${l.ItemName}</td>
      <td style="padding:6px 8px;text-align:center">${l.DCQty}</td>
      <td style="padding:6px 8px;text-align:center">${l.TotalQty}</td>
      <td style="padding:6px 8px;text-align:center">&#8377;${l.Rate}</td>
      <td style="padding:6px 8px;text-align:right;color:var(--accent);font-weight:600">&#8377;${fmtNum(l.TotalAmt)}</td>
      <td style="padding:6px 8px;text-align:center">
        <span style="padding:2px 8px;border-radius:10px;font-size:11px;background:${_iwStatusColor(l.ItemStatus)}">${l.ItemStatus}</span>
      </td>
      <td style="padding:6px 8px;font-size:11px">${l.Reason || '&#8212;'}</td>
      <td style="padding:6px 8px;text-align:center;font-size:11px">${l.ReturnMode || '&#8212;'}</td>
      <td style="padding:6px 8px;font-size:11px">${l.PersonName || l.CourierName || '&#8212;'}</td>
      <td style="padding:6px 8px;text-align:center;font-size:11px">${l.ReturnDate || '&#8212;'}</td>
      <td style="padding:6px 8px;font-size:11px">${l.TrackId || '&#8212;'}</td>
      <td style="padding:6px 8px;text-align:center">
        <i class="fas fa-lock" style="color:var(--text-muted);font-size:12px" title="Inwarded â€” read only"></i>
      </td>
    </tr>`;
    }
    return `
    <tr style="border-bottom:1px solid var(--border);cursor:pointer;${rowBg}transition:background .15s"
        onclick="window._iwSelectPreviewRow(${i})">
      <td style="padding:6px 8px;text-align:center;color:var(--text-muted)">${i + 1}</td>
      <td style="padding:6px 8px">${l.CategoryName || '&#8212;'}</td>
      <td style="padding:6px 8px;font-weight:600">${l.ItemName}</td>
      <td style="padding:6px 8px;text-align:center">${l.DCQty}</td>
      <td style="padding:6px 8px;text-align:center">${l.TotalQty}</td>
      <td style="padding:6px 8px;text-align:center">&#8377;${l.Rate}</td>
      <td style="padding:6px 8px;text-align:right;color:var(--accent);font-weight:600">&#8377;${fmtNum(l.TotalAmt)}</td>
      <td style="padding:6px 8px;text-align:center">
        <span style="padding:2px 8px;border-radius:10px;font-size:11px;background:${_iwStatusColor(l.ItemStatus)}">${l.ItemStatus}</span>
      </td>
      <td style="padding:6px 8px;font-size:11px">${l.Reason || '&#8212;'}</td>
      <td style="padding:6px 8px;text-align:center;font-size:11px">${l.ReturnMode || '&#8212;'}</td>
      <td style="padding:6px 8px;font-size:11px">${l.PersonName || l.CourierName || '&#8212;'}</td>
      <td style="padding:6px 8px;text-align:center;font-size:11px">${l.ReturnDate || '&#8212;'}</td>
      <td style="padding:6px 8px;font-size:11px">${l.TrackId || '&#8212;'}</td>
      <td style="padding:6px 8px;text-align:center;white-space:nowrap">
        <button class="btn btn-secondary btn-icon btn-sm" title="Edit"
          onclick="event.stopPropagation();window._iwSelectPreviewRow(${i})" style="margin-right:4px">
          <i class="fas fa-pen-to-square"></i></button>
        <button class="btn btn-danger btn-icon btn-sm" title="Remove"
          onclick="event.stopPropagation();window._iwRemoveLine(${i})">
          <i class="fas fa-minus"></i></button></td>
    </tr>`;
  }).join('');
}
window._iwRemoveLine = (i) => {
  if (_iwEditingIndex === i) { _iwEditingIndex = null; }
  else if (_iwEditingIndex !== null && _iwEditingIndex > i) { _iwEditingIndex--; }
  _iwLines.splice(i, 1);
  _iwRenderPreview();
  if (_iwEditingIndex === null) _iwRenderItemPanel();
};

/* ---- Select a preview row for editing (Issues #2, #3) ---- */

/* ---- Vendor Search Modal (opens on search button click) ---- */
window._iwOpenVendorSearch = () => {
  const existing = document.getElementById('iw-vendor-search-modal');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = 'iw-vendor-search-modal';
  overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,.55);z-index:9999;display:flex;align-items:center;justify-content:center';
  overlay.innerHTML = `
    <div style="background:var(--bg-card);border-radius:12px;padding:24px;width:520px;max-width:96vw;
                box-shadow:0 20px 60px rgba(0,0,0,.4);animation:slideUp .2s ease">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
        <h3 style="margin:0;font-size:16px;font-weight:700;color:var(--text-primary)">
          <i class="fas fa-magnifying-glass" style="color:var(--accent);margin-right:8px"></i>Search Vendor
        </h3>
        <button onclick="document.getElementById('iw-vendor-search-modal').remove()"
          style="background:none;border:none;color:var(--text-muted);font-size:18px;cursor:pointer;padding:2px 6px">
          <i class="fas fa-xmark"></i>
        </button>
      </div>
      <input type="text" id="iw-vnd-srch" placeholder="Search by Vendor Name or Company Name..."
        style="width:100%;box-sizing:border-box;padding:9px 12px;border:1px solid var(--border);border-radius:8px;
               background:var(--bg-dark);color:var(--text-primary);font-size:13px;margin-bottom:12px"/>
      <div id="iw-vnd-list" style="max-height:340px;overflow-y:auto;border:1px solid var(--border);border-radius:8px">
        <div style="padding:18px;text-align:center;color:var(--text-muted);font-size:13px">Loadingâ€¦</div>
      </div>
    </div>`;

  document.body.appendChild(overlay);
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });

  const listEl = document.getElementById('iw-vnd-list');
  const searchEl = document.getElementById('iw-vnd-srch');
  const vendors = _iwVendors || [];

  const renderList = (q) => {
    const lq = q.toLowerCase();
    const filtered = q ? vendors.filter(v =>
      (v.Name || '').toLowerCase().includes(lq) ||
      (v.CompanyName || '').toLowerCase().includes(lq)
    ) : vendors;

    if (!filtered.length) {
      listEl.innerHTML = '<div style="padding:18px;text-align:center;color:var(--text-muted);font-size:13px">No vendors match your search.</div>';
      return;
    }
    listEl.innerHTML = filtered.map(v => `
      <div class="iw-vnd-item" data-id="${v.vendorid || v.VendorID}"
        style="padding:10px 14px;cursor:pointer;border-bottom:1px solid var(--border);transition:background .12s"
        onmouseover="this.style.background='var(--bg-hover)'" onmouseout="this.style.background=''">
        <div style="font-weight:600;color:var(--text-primary);font-size:13px">${v.Name || '-'}</div>
        ${v.CompanyName ? `<div style="font-size:11px;color:var(--text-muted);margin-top:2px">${v.CompanyName}</div>` : ''}
      </div>`).join('');

    document.querySelectorAll('.iw-vnd-item').forEach(el => {
      el.onclick = () => {
        const vendSel = document.getElementById('iw-vendor');
        if (vendSel) {
          vendSel.value = el.dataset.id;
          vendSel.dispatchEvent(new Event('change'));
        }
        overlay.remove();
      };
    });
  };

  renderList('');
  searchEl.oninput = () => renderList(searchEl.value.trim());
  setTimeout(() => searchEl.focus(), 80);
};

window._iwSelectPreviewRow = (i) => {
  // Locked in View-Records mode â€” inwarded items must not be modified
  if (_iwEditId !== null) {
    showToast('This record has already been inwarded and cannot be edited.', 'warning');
    return;
  }
  const l = _iwLines[i]; if (!l) return;
  _iwEditingIndex = i;
  _iwRenderItemPanel(); // regenerates form with "Update Item" button label

  const itemSel = $('#iwf-item');
  if (itemSel) {
    if (!itemSel.querySelector('[value="' + l.ItemId + '"]')) {
      const op = document.createElement('option');
      op.value = l.ItemId; op.text = l.ItemName;
      op.dataset.cat = l.CategoryId || ''; op.dataset.catname = l.CategoryName || '';
      const vi = _iwVendorItems.find(v => String(v.ItemId) === String(l.ItemId));
      op.dataset.rate = vi ? (vi.DefaultRate || 0) : (l.Rate || 0);
      itemSel.appendChild(op);
    }
    itemSel.value = l.ItemId;
    itemSel.disabled = true; itemSel.style.opacity = '0.65'; itemSel.style.cursor = 'not-allowed';
  }

  const dcEl = $('#iwf-dcqty');
  if (dcEl) { dcEl.value = l.DCQty; dcEl.disabled = true; dcEl.style.opacity = '0.65'; }

  const qEl = $('#iwf-qty'); if (qEl) qEl.value = l.TotalQty;

  const vi = _iwVendorItems.find(v => String(v.ItemId) === String(l.ItemId));
  const rate = l.Rate > 0 ? l.Rate : (vi ? (vi.DefaultRate || 0) : 0);
  const rateEl = $('#iwf-rate');
  if (rateEl) { rateEl.value = rate; rateEl.dispatchEvent(new Event('input')); }

  const statEl = $('#iwf-status');
  if (statEl) { statEl.value = l.ItemStatus || 'Complete'; statEl.dispatchEvent(new Event('change')); }

  if ($('#iw-order-num') && $('#iw-order-num').value && $('#iw-order-num').value.trim()) {
    const vendEl = $('#iw-vendor');
    if (vendEl) { vendEl.disabled = true; vendEl.style.opacity = '0.65'; }
  }
  _iwRenderPreview();
  showToast('Editing row ' + (i + 1) + ': ' + l.ItemName, 'info');
};
function _iwStatusColor(s) {
  if (!s || s === 'Complete') return 'rgba(34,197,94,.18)';
  if (s.startsWith('Return')) return 'rgba(245,158,11,.18)';
  return 'rgba(239,68,68,.18)';
}

/* ---- Load items from a saved Order ---- */
async function _iwLoadFromOrder() {
  const onum = $('#iw-order-num')?.value?.trim();
  if (!onum) return showToast('Enter an Order Number first', 'error');
  try {
    const orders = await api(`/api/orders`);
    const order = orders.find(o => o.OrderNumber === onum);
    if (!order) return showToast(`No order found for "${onum}"`, 'error');
    const vidEl = $('#iw-vendor'); if (vidEl && order.VendorId) vidEl.value = order.VendorId;
    const didEl = $('#iw-div'); if (didEl && order.DivisionId) didEl.value = order.DivisionId;
    // Load vendor items
    if (order.VendorId) {
      _iwVendorItems = await api(`/api/inward/items-by-vendor?vendorId=${order.VendorId}`);
    }
    // Add all order items as preview lines
    _iwLines = (order.Items || []).filter(it => it.ItemId).map(it => {
      const vi = _iwVendorItems.find(v => String(v.ItemId) === String(it.ItemId));
      const rate = (it.Rate && it.Rate > 0) ? it.Rate : (vi ? (vi.DefaultRate || 0) : 0);
      return {
        ItemId: String(it.ItemId), ItemName: it.ItemName || '',
        CategoryId: String(it.CategoryId || ''), CategoryName: it.CategoryName || '',
        DCQty: it.TotalQty || 0, TotalQty: it.TotalQty || 0,
        Rate: rate, TotalAmt: (it.TotalQty || 0) * rate,
        ItemStatus: 'Complete', Reason: '', ReturnMode: '', PersonName: '',
        CourierName: '', CourierId: '', ReturnDate: '', TrackId: ''
      };
    });
    // Lock Vendor Name when loading from Order
    const vendEl = $('#iw-vendor');
    if (vendEl) { vendEl.disabled = true; vendEl.style.opacity = '0.65'; }
    _iwRenderPreview();
    _iwRenderItemPanel();
    showToast(`Loaded ${_iwLines.length} item(s) from order "${onum}"`, 'success');
  } catch (e) { showToast('Failed to load order: ' + e.message, 'error'); }
}

/* ---- Save ---- */
async function _iwSave() {
  const divId = $('#iw-div')?.value;
  const vendId = $('#iw-vendor')?.value;
  if (!divId) return showToast('Division is required', 'error');
  if (!vendId) return showToast('Vendor is required', 'error');
  if (!_iwLines.length) return showToast('Add at least one item', 'error');
  const body = {
    DivisionId: divId,
    VendorId: vendId,
    OrderNumber: $('#iw-order-num')?.value?.trim() || '',
    DCNumber: $('#iw-dc-num')?.value?.trim() || '',
    InvoiceNumber: $('#iw-inv-num')?.value?.trim() || '',
    InwardDate: $('#iw-date')?.value || new Date().toISOString().split('T')[0],
    items: _iwLines.map(l => ({
      CategoryId: l.CategoryId || null, ItemId: l.ItemId || null,
      DCQty: l.DCQty, TotalQty: l.TotalQty, Rate: l.Rate, TotalAmt: l.TotalAmt,
      ItemStatus: l.ItemStatus, Reason: l.Reason, ReturnMode: l.ReturnMode,
      PersonName: l.PersonName, CourierName: l.CourierName, CourierId: l.CourierId,
      ReturnDate: l.ReturnDate, TrackId: l.TrackId
    }))
  };
  try {
    if (_iwEditId) {
      await api(`/api/inward/${_iwEditId}`, { method: 'PUT', body });
      showToast('Inward updated!', 'success');
    } else {
      await api('/api/inward', { method: 'POST', body });
      showToast('Inward saved! Stock updated.', 'success');
    }
    _iwLines = []; _iwEditId = null; _iwRenderPreview(); _iwRenderItemPanel();
    ['#iw-order-num', '#iw-dc-num', '#iw-inv-num'].forEach(id => { const el = $(id); if (el) el.value = ''; });
    const dSel = $('#iw-date'); if (dSel) dSel.value = new Date().toISOString().split('T')[0];
  } catch (e) { showToast('Save failed: ' + e.message, 'error'); }
}

/* ---- View Records Modal ---- */
async function _iwShowRecords() {
  const ov = document.createElement('div');
  ov.className = 'modal-overlay'; ov.id = 'iw-records-modal';
  ov.innerHTML = `
    <div class="modal" style="max-width:980px;animation:slideUp 0.2s ease">
      <div class="modal-header">
        <h3><i class="fas fa-table-list"></i> Purchase Inward Records</h3>
        <div style="display:flex;gap:8px;align-items:center">
          <button class="btn btn-sm" id="iw-rec-asp-btn" style="font-size:12.5px;background:#fef9c3;color:#92400e;border:1px solid #fde68a;border-radius:6px;padding:5px 13px;cursor:pointer;font-weight:600">
            <i class="fas fa-file-invoice"></i> Approval Sheet</button>
          <button class="btn-close-modal" onclick="document.getElementById('iw-records-modal').remove()">
            <i class="fas fa-xmark"></i></button>
        </div>
      </div>
      <div class="modal-body">
        <div class="search-bar" style="margin-bottom:12px">
          <div class="search-input-wrap"><i class="fas fa-search"></i>
            <input type="text" id="iw-rec-search" placeholder="Search by Inward ID, Order No, DC No, Vendor..."/>
          </div>
        </div>
        <div style="overflow-x:auto;max-height:500px;overflow-y:auto">
          <table style="width:100%;border-collapse:collapse;min-width:780px;font-size:13px" id="tbl-iw-records">
            <thead style="background:var(--bg-dark);position:sticky;top:0;z-index:2">
              <tr>
                <th style="padding:10px 12px;text-align:left">Inward ID</th>
                <th style="padding:10px 12px;text-align:left">Order Number</th>
                <th style="padding:10px 12px;text-align:left">DC Number</th>
                <th style="padding:10px 12px;text-align:left">Invoice Number</th>
                <th style="padding:10px 12px;text-align:left">Inward Date</th>
                <th style="padding:10px 12px;text-align:left">Vendor Name</th>
                <th style="padding:10px 12px;text-align:left">Division</th>
                <th style="padding:10px 12px;text-align:center;min-width:60px">ASP</th>
              </tr>
            </thead>
            <tbody id="tbl-iw-rec-body">
              <tr class="empty-row"><td colspan="8" style="padding:20px;text-align:center">
                <div class="spinner" style="margin:0 auto"></div></td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>`;
  document.body.appendChild(ov);
  ov.onclick = e => { if (e.target === ov) ov.remove(); };

  // Wire the pale-yellow Approval Sheet button — close modal and open full-screen
  document.getElementById('iw-rec-asp-btn').onclick = () => {
    ov.remove();
    _iwShowApprovalSheet();
  };

  try {
    const data = await api('/api/inward');
    const tbody = document.getElementById('tbl-iw-rec-body');
    if (!tbody) return;
    if (!data.length) {
      tbody.innerHTML = `<tr class="empty-row"><td colspan="8" style="padding:20px;text-align:center">No records found.</td></tr>`;
    } else {
      tbody.innerHTML = data.map(d => {
        // Plain rows — no highlights in View Records
        const aspCell = d.AspCount > 0
          ? `<td style="padding:8px 12px;text-align:center">
               <span title="${d.AspCount} approval sheet(s) — click to view"
                 style="cursor:pointer;color:#d97706;font-size:15px;position:relative"
                 onclick="_iwPickApprovalSheet(${d.InwardId})">
                 <i class="fas fa-file-invoice"></i>
                 ${d.AspCount > 1 ? `<sup style="font-size:10px;color:#d97706;font-weight:700;margin-left:2px">${d.AspCount}</sup>` : ''}
               </span>
             </td>`
          : `<td style="padding:8px 12px;text-align:center;color:var(--text-muted)">—</td>`;
        return `
          <tr style="border-bottom:1px solid var(--border);cursor:pointer"
            title="Double-click to load for edit"
            ondblclick="_iwLoadRecordForEdit(${d.InwardId})">
            <td style="padding:8px 12px;font-weight:600;color:var(--accent)">${d.InwardId}</td>
            <td style="padding:8px 12px">${d.OrderNumber || '&#8212;'}</td>
            <td style="padding:8px 12px">${d.DCNumber || '&#8212;'}</td>
            <td style="padding:8px 12px">${d.InvoiceNumber || '&#8212;'}</td>
            <td style="padding:8px 12px">${fmtDate(d.InwardDate)}</td>
            <td style="padding:8px 12px">${d.VendorName || '&#8212;'}</td>
            <td style="padding:8px 12px">${d.DivisionName || '&#8212;'}</td>
            ${aspCell}
          </tr>`;
      }).join('');
    }
    // Search filter
    const searchEl = document.getElementById('iw-rec-search');
    if (searchEl) searchEl.oninput = () => {
      const q = searchEl.value.toLowerCase();
      (tbody.querySelectorAll('tr:not(.empty-row)') || []).forEach(tr => {
        tr.style.display = !q || tr.textContent.toLowerCase().includes(q) ? '' : 'none';
      });
    };
  } catch (e) {
    const tb = document.getElementById('tbl-iw-rec-body');
    if (tb) tb.innerHTML = `<tr class="empty-row"><td colspan="8" style="color:var(--danger);padding:20px;text-align:center">
      Failed: ${e.message}</td></tr>`;
  }
}


/* ---- View Existing Approval Sheet (from ASP icon in records) ---- */
window._iwViewApprovalSheet = async (sheetId) => {
  try {
    const { sheet, inwards } = await api(`/api/approval-sheets/${sheetId}`);
    const ts = new Date(sheet.CreatedDate);
    const tsStr = ts.toLocaleDateString('en-IN') + ' ' + ts.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    const ov = document.createElement('div');
    ov.className = 'modal-overlay'; ov.id = 'asp-view-modal';
    ov.innerHTML = `
      <div class="modal" style="max-width:860px;animation:slideUp 0.2s ease">
        <div class="modal-header">
          <h3><i class="fas fa-file-invoice"></i> Approval Sheet ${sheet.RefNo ? '— ' + sheet.RefNo : ''}</h3>
          <div style="display:flex;gap:8px;align-items:center">
            <button class="btn btn-primary btn-sm" onclick="_iwDownloadAspPdf(${sheetId})">
              <i class="fas fa-download"></i> Download PDF</button>
            <button class="btn-close-modal" onclick="document.getElementById('asp-view-modal').remove()">
              <i class="fas fa-xmark"></i></button>
          </div>
        </div>
        <div class="modal-body" style="max-height:80vh;overflow-y:auto;padding:0">
          <div id="asp-view-content" style="padding:10px;background:#fff">
            ${_iwBuildApprovalHtml(sheet, inwards, tsStr, false)}
          </div>
        </div>
      </div>`;
    document.body.appendChild(ov);
    ov.onclick = e => { if (e.target === ov) ov.remove(); };
  } catch (e) { showToast('Failed to load approval sheet: ' + e.message, 'error'); }
};

window._iwDownloadAspPdf = async (sheetId) => {
  try {
    showToast('Downloading PDF...', 'info');
    const res = await fetch(`/api/approval-sheets/${sheetId}/pdf`, { credentials: 'include' });
    if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
    const blob = await res.blob();
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `approval-sheet-${sheetId}.pdf`; a.click(); URL.revokeObjectURL(a.href);
  } catch (e) { showToast('Download failed: ' + e.message, 'error'); }
};

// ─── Multi-ASP Picker ─────────────────────────────────────────────────────
// Called from View Records ASP column. If 1 sheet → opens directly.
// If multiple → shows a picker modal listing all sheets for this inward.
window._iwPickApprovalSheet = async (inwardId) => {
  try {
    const sheets = await api(`/api/inward/${inwardId}/approval-sheets`);
    if (!sheets.length) return showToast('No approval sheets found for this inward', 'error');
    if (sheets.length === 1) return _iwViewApprovalSheet(sheets[0].ApprovalSheetId);
    // Multiple sheets — show picker
    const existing = document.getElementById('asp-pick-modal');
    if (existing) existing.remove();
    const ov = document.createElement('div');
    ov.className = 'modal-overlay'; ov.id = 'asp-pick-modal';
    ov.innerHTML = `
      <div class="modal" style="max-width:620px;animation:slideUp 0.2s ease">
        <div class="modal-header">
          <h3><i class="fas fa-file-invoice"></i> Select Approval Sheet</h3>
          <button class="btn-close-modal" onclick="document.getElementById('asp-pick-modal').remove()">
            <i class="fas fa-xmark"></i></button>
        </div>
        <div class="modal-body">
          <p style="font-size:13px;color:var(--text-muted);margin-bottom:14px">
            Inward <strong>#${inwardId}</strong> has been included in
            <strong>${sheets.length} approval sheets</strong>. Select one to view:
          </p>
          <table style="width:100%;border-collapse:collapse;font-size:13px">
            <thead>
              <tr style="background:var(--bg-dark)">
                <th style="padding:9px 10px;text-align:left">Sheet #</th>
                <th style="padding:9px 10px;text-align:left">Ref No</th>
                <th style="padding:9px 10px;text-align:left">Date</th>
                <th style="padding:9px 10px;text-align:right">Amount</th>
                <th style="padding:9px 10px;text-align:center">Action</th>
              </tr>
            </thead>
            <tbody>
              ${sheets.map((s, i) => `
                <tr style="border-bottom:1px solid var(--border);${i%2===0?'background:var(--bg-card)':''}">
                  <td style="padding:9px 10px;font-weight:700;color:var(--accent)">ASP-${s.ApprovalSheetId}</td>
                  <td style="padding:9px 10px">${s.RefNo || '—'}</td>
                  <td style="padding:9px 10px">${s.CreatedDate}</td>
                  <td style="padding:9px 10px;text-align:right;font-weight:600">
                    ₹ ${Number(s.TotalAmt||0).toLocaleString('en-IN',{maximumFractionDigits:2})}</td>
                  <td style="padding:9px 10px;text-align:center">
                    <button class="btn btn-sm btn-primary" style="font-size:12px;padding:5px 12px"
                      onclick="document.getElementById('asp-pick-modal').remove();_iwViewApprovalSheet(${s.ApprovalSheetId})">
                      <i class="fas fa-eye"></i> View
                    </button>
                  </td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>`;
    document.body.appendChild(ov);
    ov.onclick = e => { if (e.target === ov) ov.remove(); };
  } catch (e) { showToast('Failed to load approval sheets: ' + e.message, 'error'); }
};


let _aspAllData = [], _aspDivisions = [], _aspCurrentSheetId = null;

async function _iwShowApprovalSheet() {
  // Load divisions for filter
  try { _aspDivisions = await api('/api/divisions?active=1'); } catch(_) { _aspDivisions = []; }

  const ov = document.createElement('div');
  ov.id = 'asp-fullscreen';
  ov.style.cssText = 'position:fixed;inset:0;background:var(--bg-dark);z-index:1000;display:flex;flex-direction:column;overflow:hidden';
  ov.innerHTML = `
    <!-- Top bar -->
    <div style="background:var(--bg-card);border-bottom:1px solid var(--border);padding:14px 24px;display:flex;align-items:center;gap:16px;flex-shrink:0">
      <div>
        <h2 style="margin:0;font-size:17px;font-weight:700;color:var(--text-primary);display:flex;align-items:center;gap:9px">
          <i class="fas fa-file-invoice" style="color:#7c3aed"></i> Approval Sheet
        </h2>
        <div style="font-size:11.5px;color:var(--text-muted);margin-top:2px">(Purchase Inward Records)</div>
      </div>
      <div style="flex:1"></div>
      <button class="btn btn-secondary btn-sm" onclick="document.getElementById('asp-fullscreen').remove()">
        <i class="fas fa-xmark"></i> Close</button>
    </div>

    <!-- Main layout: left list + right preview -->
    <div style="display:flex;flex:1;overflow:hidden">

      <!-- LEFT PANEL: filterable inward records -->
      <div style="width:52%;border-right:1px solid var(--border);display:flex;flex-direction:column;overflow:hidden">
        <!-- Filters -->
        <div style="padding:14px 16px;background:var(--bg-card);border-bottom:1px solid var(--border);flex-shrink:0">
          <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
            <div style="display:flex;flex-direction:column;gap:3px">
              <label style="font-size:11px;color:var(--text-muted);font-weight:600">From Date</label>
              <input type="date" id="asp-from-date" style="background:var(--bg-dark);border:1px solid var(--border);border-radius:6px;padding:6px 10px;color:var(--text-primary);font-size:13px">
            </div>
            <div style="display:flex;flex-direction:column;gap:3px">
              <label style="font-size:11px;color:var(--text-muted);font-weight:600">To Date</label>
              <input type="date" id="asp-to-date" style="background:var(--bg-dark);border:1px solid var(--border);border-radius:6px;padding:6px 10px;color:var(--text-primary);font-size:13px">
            </div>
            <div style="display:flex;flex-direction:column;gap:3px;flex:1;min-width:130px">
              <label style="font-size:11px;color:var(--text-muted);font-weight:600">Division</label>
              <select id="asp-div-filter" style="background:var(--bg-dark);border:1px solid var(--border);border-radius:6px;padding:6px 10px;color:var(--text-primary);font-size:13px;cursor:pointer">
                <option value="">All Divisions</option>
                ${_aspDivisions.map(d=>`<option value="${d.DivisionId||d.DivisionID}">${d.DivisionName}</option>`).join('')}
              </select>
            </div>
            <button class="btn btn-secondary btn-sm" id="asp-apply-filter" style="margin-top:18px">
              <i class="fas fa-filter"></i> Apply</button>
            <button class="btn btn-secondary btn-sm" id="asp-clear-filter" style="margin-top:18px">
              <i class="fas fa-rotate-left"></i></button>
          </div>
        </div>

        <!-- Legend + select all -->
        <div style="padding:8px 14px;background:var(--bg-card);border-bottom:1px solid var(--border);display:flex;align-items:center;gap:12px;flex-shrink:0">
          <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:13px">
            <input type="checkbox" id="asp-chk-all" style="width:15px;height:15px;cursor:pointer;accent-color:#7c3aed"> Select All
          </label>
          <span style="font-size:11.5px;color:var(--text-muted);flex:1">
            <span style="display:inline-block;width:10px;height:10px;background:#fce7f3;border:1px solid #f9a8d4;border-radius:2px;vertical-align:middle"></span> In Sheet &nbsp;
            <span style="display:inline-block;width:10px;height:10px;background:#fef3c7;border:1px solid #fbbf24;border-radius:2px;vertical-align:middle"></span> Mixed Items
          </span>
          <span id="asp-sel-count" style="font-size:12px;font-weight:600;color:#7c3aed"></span>
        </div>

        <!-- Table -->
        <div style="flex:1;overflow-y:auto">
          <table style="width:100%;border-collapse:collapse;font-size:12.5px">
            <thead style="background:var(--bg-dark);position:sticky;top:0;z-index:2">
              <tr>
                <th style="padding:9px 10px;width:36px;text-align:center"></th>
                <th style="padding:9px 10px;text-align:left">ID</th>
                <th style="padding:9px 10px;text-align:left">Invoice No</th>
                <th style="padding:9px 10px;text-align:left">Date</th>
                <th style="padding:9px 10px;text-align:left">Vendor</th>
                <th style="padding:9px 10px;text-align:left">Division</th>
                <th style="padding:9px 10px;text-align:right">Amt (₹)</th>
              </tr>
            </thead>
            <tbody id="asp-tbl-body">
              <tr><td colspan="7" style="padding:20px;text-align:center"><div class="spinner" style="margin:0 auto"></div></td></tr>
            </tbody>
          </table>
        </div>

        <!-- Bottom action bar -->
        <div style="padding:12px 16px;background:var(--bg-card);border-top:1px solid var(--border);flex-shrink:0">
          <button class="btn" id="asp-create-btn" style="background:#fef9c3;color:#92400e;border:1px solid #fde68a;width:100%;font-size:14px;font-weight:600;padding:10px;border-radius:7px;cursor:pointer;opacity:0.5;transition:opacity 0.2s" disabled>
            <i class="fas fa-file-invoice"></i> Create Approval Sheet →
          </button>
        </div>
      </div>

      <!-- RIGHT PANEL: A4 format preview -->
      <div id="asp-right-panel" style="flex:1;overflow-y:auto;background:#e5e7eb;display:flex;flex-direction:column;align-items:center;padding:20px 16px 80px">
        <div style="color:var(--text-muted);text-align:center;margin-top:60px;font-size:15px;opacity:0.5">
          <i class="fas fa-file-invoice" style="font-size:48px;display:block;margin-bottom:14px"></i>
          Select inward records and click<br><strong>"Create Approval Sheet"</strong><br>to generate the format
        </div>
      </div>

    </div>`;
  document.body.appendChild(ov);

  // Load data
  await _aspLoadRecords();

  // Bind filters
  $('#asp-apply-filter').onclick = () => _aspLoadRecords();
  $('#asp-clear-filter').onclick = () => {
    $('#asp-from-date').value = ''; $('#asp-to-date').value = ''; $('#asp-div-filter').value = '';
    _aspLoadRecords();
  };

  // Select all handler
  $('#asp-chk-all').onchange = (e) => {
    $$('#asp-tbl-body .asp-row-chk:not(:disabled)').forEach(c => { c.checked = e.target.checked; });
    _aspUpdateSelCount();
  };

  // Create button
  $('#asp-create-btn').onclick = () => _aspDoCreate();
}

async function _aspLoadRecords() {
  const tbody = $('#asp-tbl-body'); if (!tbody) return;
  tbody.innerHTML = `<tr><td colspan="7" style="padding:20px;text-align:center"><div class="spinner" style="margin:0 auto"></div></td></tr>`;

  const fromDate = $('#asp-from-date')?.value || '';
  const toDate   = $('#asp-to-date')?.value   || '';
  const divId    = $('#asp-div-filter')?.value || '';

  // Highlights only show when a filter is actively applied
  const filterActive = !!(fromDate || toDate || divId);

  const params = new URLSearchParams();
  if (fromDate) params.set('fromDate', fromDate);
  if (toDate)   params.set('toDate', toDate);
  if (divId)    params.set('divisionId', divId);

  try {
    _aspAllData = await api('/api/inward?' + params.toString());
    const sa = $('#asp-chk-all'); if (sa) sa.checked = false;
    _aspRenderTable(filterActive);
  } catch (e) {
    tbody.innerHTML = `<tr><td colspan="7" style="padding:20px;text-align:center;color:var(--danger)">Failed: ${e.message}</td></tr>`;
  }
}

function _aspRenderTable(filterActive) {
  const tbody = $('#asp-tbl-body'); if (!tbody) return;
  if (!_aspAllData.length) {
    tbody.innerHTML = `<tr><td colspan="7" style="padding:20px;text-align:center;color:var(--text-muted)">No records found for this filter.</td></tr>`;
    _aspUpdateSelCount();
    return;
  }
  tbody.innerHTML = _aspAllData.map(d => {
    // ── State machine ──────────────────────────────────────────────────────
    const isSoftDisabled = d.AspCount > 0 && !d.HasNewResolved;  // pink, checkbox DISABLED
    const isReEnabled    = d.AspCount > 0 &&  d.HasNewResolved;  // pink, checkbox ENABLED
    const hasMixed       = d.HasMixedItems == 1 && d.AspCount === 0; // amber, eligible

    // Highlight only when a filter is actively applied
    const rowBg = filterActive
      ? (isSoftDisabled || isReEnabled) ? 'background:#fce7f3'
      : hasMixed                        ? 'background:#fef3c7'
      : ''
      : '';

    // Hover tooltip
    let hoverTitle = '';
    if (isSoftDisabled) {
      hoverTitle = d.UnresolvedCount > 0
        ? `${d.UnresolvedCount} RP/SP item(s) still pending — will be re-enabled ${d.UnresolvedCount} more time(s) after resolution`
        : 'All items fully accounted for in previous approval sheet(s)';
    } else if (isReEnabled) {
      hoverTitle = 'Resolution detected — select to create a supplementary approval sheet for the newly resolved items';
    } else if (hasMixed) {
      hoverTitle = `Has ${d.UnresolvedCount} unresolved RP/SP item(s) — partial amounts will be included in the approval sheet`;
    }

    // Amount: show only the NEW (unaccounted) amount for re-enabled rows
    const dispAmt = isReEnabled ? (d.NewEligibleAmt || 0) : (d.EligibleAmt || 0);
    const amt     = Number(dispAmt).toLocaleString('en-IN', { maximumFractionDigits: 2 });
    const amtTag  = isReEnabled ? `<span style="font-size:10px;color:#9f1239" title="Supplementary amount for newly resolved items only">NEW</span> ` : '';

    return `<tr style="border-bottom:1px solid var(--border);${rowBg}" class="asp-data-row" data-id="${d.InwardId}" title="${hoverTitle}">
      <td style="padding:7px 10px;text-align:center">
        <input type="checkbox" class="asp-row-chk" data-id="${d.InwardId}"
          style="width:14px;height:14px;cursor:pointer;accent-color:#7c3aed"
          ${isSoftDisabled ? 'disabled title="Already fully accounted for — awaiting further resolution"' : ''}>
      </td>
      <td style="padding:7px 10px;font-weight:600;color:var(--accent)">${d.InwardId}</td>
      <td style="padding:7px 10px">${d.InvoiceNumber||'—'}</td>
      <td style="padding:7px 10px">${fmtDate(d.InwardDate)}</td>
      <td style="padding:7px 10px">${d.VendorName||'—'}</td>
      <td style="padding:7px 10px">${d.DivisionName||'—'}</td>
      <td style="padding:7px 10px;text-align:right;font-weight:600">${dispAmt > 0 ? amtTag + '₹ '+amt : '—'}</td>
    </tr>`;
  }).join('');


  // Bind row checkboxes
  $$('#asp-tbl-body .asp-row-chk').forEach(chk => {
    chk.onchange = () => _aspUpdateSelCount();
  });
  _aspUpdateSelCount();
}

function _aspUpdateSelCount() {
  const checked = $$('#asp-tbl-body .asp-row-chk:checked');
  const count   = checked.length;
  const sc = $('#asp-sel-count'); if (sc) sc.textContent = count ? `${count} selected` : '';
  const btn = $('#asp-create-btn');
  if (btn) { btn.disabled = (count === 0); btn.style.opacity = count === 0 ? '0.5' : '1'; }
  // Sync select-all
  const all  = $$('#asp-tbl-body .asp-row-chk:not(:disabled)');
  const sa   = $('#asp-chk-all'); if (!sa) return;
  sa.checked = all.length > 0 && all.every(c => c.checked);
  sa.indeterminate = count > 0 && !sa.checked;
}

async function _aspDoCreate() {
  const checked = $$('#asp-tbl-body .asp-row-chk:checked');
  if (!checked.length) return;

  const selectedIds = checked.map(c => parseInt(c.dataset.id));
  const count = selectedIds.length;

  // Confirmation dialog
  const ok = await confirm(`Create an approval sheet for ${count} selected inward entr${count > 1 ? 'ies' : 'y'}?`);
  if (!ok) return;

  // Validate: same vendor (client-side pre-check)
  const vendors = [...new Set(selectedIds.map(id => {
    const d = _aspAllData.find(r => r.InwardId === id);
    return d?.VendorId;
  }).filter(Boolean))];
  if (vendors.length > 1) {
    showToast('All selected inwards must belong to the same vendor. Please check your selection.', 'error');
    return;
  }

  // Build the sheet via API (validates server-side too)
  try {
    const result = await api('/api/approval-sheets', {
      method: 'POST',
      body: { inwardIds: selectedIds, refNo: '' }
    });
    _aspCurrentSheetId = result.ApprovalSheetId;

    // Get the full sheet details to build the preview
    const { sheet, inwards } = await api(`/api/approval-sheets/${_aspCurrentSheetId}`);

    // Build timestamp
    const now = new Date();
    const tsStr = now.toLocaleDateString('en-IN') + ' ' + now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

    // Render A4 in right panel
    const rightPanel = $('#asp-right-panel');
    rightPanel.innerHTML = `
      <div style="width:210mm;min-height:297mm;background:#fff;box-shadow:0 4px 24px rgba(0,0,0,0.18);padding:12mm 14mm;position:relative;font-family:Arial,sans-serif" id="asp-a4-preview">
        ${_iwBuildApprovalHtml(sheet, inwards, tsStr, true)}
      </div>
      <div style="position:fixed;bottom:0;right:0;width:48%;background:var(--bg-card);border-top:1px solid var(--border);padding:12px 20px;display:flex;align-items:center;gap:12px;z-index:10">
        <div style="font-size:12px;color:var(--text-muted);flex:1"><i class="fas fa-pencil" style="color:#7c3aed"></i> You can edit any field in the form above before exporting.</div>
        <button class="btn btn-primary" id="asp-save-export-btn" style="background:linear-gradient(135deg,#059669,#047857)">
          <i class="fas fa-file-pdf"></i> Save &amp; Export PDF
        </button>
      </div>`;

    // Bind Save & Export
    $('#asp-save-export-btn').onclick = () => _aspSaveExport(sheet);

    // Refresh the left table — newly-used inwards will now be highlighted (if filter active)
    await _aspLoadRecords();

    showToast('Approval sheet created! Review and export below.', 'success');
  } catch (e) {
    showToast(e.message, 'error');
  }
}

async function _aspSaveExport(sheet) {
  const preview = $('#asp-a4-preview');
  if (!preview) return;
  const btn = $('#asp-save-export-btn');
  if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating...'; }
  try {
    const htmlContent = preview.innerHTML;
    const res = await fetch(`/api/approval-sheets/${_aspCurrentSheetId}/export-pdf`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ htmlContent })
    });
    if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
    const blob = await res.blob();
    const ts   = new Date().toISOString().replace(/[:T]/g, '-').slice(0, 16);
    const a    = document.createElement('a');
    a.href     = URL.createObjectURL(blob);
    a.download = `ApprovalSheet-${sheet.RefNo || _aspCurrentSheetId}-${ts}.pdf`;
    a.click(); URL.revokeObjectURL(a.href);
    showToast('PDF saved & exported successfully!', 'success');
  } catch (e) {
    showToast('Export failed: ' + e.message, 'error');
  } finally {
    if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-file-pdf"></i> Save &amp; Export PDF'; }
  }
}

/* ---- A4 Approval Sheet HTML Builder ---- */
function _iwBuildApprovalHtml(sheet, inwards, timestamp, editable) {
  const ce = editable ? ' contenteditable="true"' : '';
  const fmtAmt = v => Number(v||0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // Division detection
  const divName = (sheet.DivisionName || '').toLowerCase();
  const isFranchise = divName.includes('franchise');
  // Default (incl. Kisna) uses Kisna signatories

  const vendorName = sheet.VendorCompanyName || sheet.VendorName || '';

  // Initiated by column pre-fill: Prathamesh Kajave for Franchise, blank for Kisna
  const initiatedBy = isFranchise ? 'Prathamesh Kajave' : '';


  // Build a flat list of all items across all inwards.
  // Each InwardItem becomes its own sub-row within the single stacked table row.
  // iw.items[] comes from the API (per-item data with ItemDate & TotalAmt per resolved item).
  const allRows = [];
  inwards.forEach((iw, iwIdx) => {
    const itemList = (iw.items && iw.items.length) ? iw.items : [{ ItemDate: iw.InwardDate, TotalAmt: iw.EligibleAmt }];
    itemList.forEach((item, itemIdx) => {
      allRows.push({
        srNo:     itemIdx === 0 ? String(iw.SrNo || iwIdx + 1) : '',
        date:     item.ItemDate || iw.InwardDate || '',
        baCode:   '',
        vendor:   (iwIdx === 0 && itemIdx === 0) ? vendorName : '',
        invoice:  itemIdx === 0 ? (iw.InvoiceNumber || '') : '',
        amount:   item.TotalAmt != null ? item.TotalAmt : (iw.EligibleAmt || 0),
        initiated:(iwIdx === 0 && itemIdx === 0) ? initiatedBy : '',
      });
    });
  });

  const nRows = allRows.length;
  const stack = (vals) =>
    vals.map((v, i) =>
      `<div style="padding:9px 10px;${i < nRows - 1 ? 'border-bottom:1px dashed #ccc;' : ''}">${v}&nbsp;</div>`
    ).join('');

  const cs = 'border:1px solid #000;padding:0;vertical-align:top;font-size:12px';

  const tableRow = `
    <tr>
      <td style="${cs};text-align:center"${ce}>${stack(allRows.map(r => r.srNo))}</td>
      <td style="${cs};text-align:center"${ce}>${stack(allRows.map(r => r.date))}</td>
      <td style="${cs};text-align:center"${ce}>${stack(allRows.map(() => ''))}</td>
      <td style="${cs}"${ce}>${stack(allRows.map(r => r.vendor))}</td>
      <td style="${cs}"${ce}>${stack(allRows.map(r => r.invoice))}</td>
      <td style="${cs};text-align:right"${ce}>${stack(allRows.map(r => fmtAmt(r.amount)))}</td>
      <td style="${cs};text-align:center"${ce}>${stack(allRows.map(r => r.initiated))}</td>
    </tr>`;


  // Signatory rows: 6-column layout, blank spacer rows between each
  const sigRow = (role, name) => `
    <tr>
      <td style="border:1px solid #000;padding:14px 12px;width:18%;font-weight:bold;font-size:12px">${role}</td>
      <td style="border:1px solid #000;padding:14px 12px;width:28%;text-align:center;font-weight:bold;font-size:12px"${ce}>${name}</td>
      <td style="border:1px solid #000;padding:14px 12px;width:8%;text-align:center;font-size:12px">Sign</td>
      <td style="border:1px solid #000;padding:14px 12px;width:25%"${ce}></td>
      <td style="border:1px solid #000;padding:14px 12px;width:8%;text-align:center;font-size:12px">Date</td>
      <td style="border:1px solid #000;padding:14px 12px;width:13%"${ce}></td>
    </tr>
    <tr><td colspan="6" style="padding:5px;border:none">&nbsp;</td></tr>`;

  let signatoryRows;
  if (isFranchise) {
    signatoryRows =
      sigRow('Prepared by',  'Prathamesh Kajave') +
      sigRow('Checked by',   'Harsh Shah') +
      sigRow('Authorized by','Parag Shah') +
      sigRow('Received by',  '');
  } else {
    // Kisna (and any other division)
    signatoryRows =
      sigRow('Prepared by',  'Pramod Dulan') +
      sigRow('Checked by',   'Jangbahadur Yadav') +
      sigRow('Authorized by','Sanjay Bhavani') +
      sigRow('Authorized by','Parag Shah');
  }

  return `
    <div style="font-family:Arial,sans-serif;color:#000;line-height:1.5">
      <!-- Timestamp top-right -->
      <div style="text-align:right;font-size:9px;color:#666;margin-bottom:6px">Generated: ${timestamp}</div>

      <!-- Company Header -->
      <div style="text-align:center;margin-bottom:28px">
        <div style="font-weight:bold;font-size:15px;margin-bottom:6px">H K JEWELS PVT.LTD.</div>
        <div style="font-size:13px;margin-bottom:4px">1701, THE CAPITAL, 17<sup>TH</sup> FLOOR, B WING, BANDRA KURLA COMPLEX</div>
        <div style="font-size:13px;font-weight:bold;margin-bottom:18px">BANDRA (EAST) MUMBAI – 400 051</div>
        <div style="font-size:14px;font-weight:600;margin-bottom:22px">Approval Sheet for Payment</div>
        <div style="font-size:28px;font-weight:bold;margin-top:4px">Ref No:&nbsp;<span style="min-width:80px;display:inline-block;${editable?'border-bottom:2px solid #000;':''}"${ce}>${sheet.RefNo||''}</span></div>
      </div>

      <!-- Main data table -->
      <table style="width:100%;border-collapse:collapse;margin-bottom:14px;font-size:12px">
        <thead>
          <tr>
            <th style="border:1px solid #000;padding:12px 8px;width:8%;text-align:center">Sr No</th>
            <th style="border:1px solid #000;padding:12px 8px;width:12%;text-align:center">Date</th>
            <th style="border:1px solid #000;padding:12px 8px;width:10%;text-align:center">BA Code</th>
            <th style="border:1px solid #000;padding:12px 8px;width:28%;text-align:center">Name of the vendor</th>
            <th style="border:1px solid #000;padding:12px 8px;width:15%;text-align:center">Invoice No</th>
            <th style="border:1px solid #000;padding:12px 8px;width:12%;text-align:center">Amount</th>
            <th style="border:1px solid #000;padding:12px 8px;width:15%;text-align:center">Initiated by</th>
          </tr>
        </thead>
        <tbody>${tableRow}</tbody>
      </table>

      <!-- Blank spacer -->
      <div style="height:14px"></div>

      <!-- Description -->
      <table style="width:100%;border-collapse:collapse;margin-bottom:0;font-size:12px">
        <tr>
          <td style="border:1px solid #000;padding:14px;width:24%;font-weight:bold;vertical-align:top">Description :-</td>
          <td style="border:1px solid #000;padding:14px;height:90px;vertical-align:top"${ce}></td>
        </tr>
      </table>

      <!-- Blank spacer -->
      <div style="height:14px"></div>

      <!-- City / State / Types -->
      <table style="width:100%;border-collapse:collapse;margin-bottom:0;font-size:12px">
        <tr>
          <td style="border:1px solid #000;padding:14px;width:10%;font-weight:bold">City</td>
          <td style="border:1px solid #000;padding:14px;width:22%"${ce}></td>
          <td style="border:1px solid #000;padding:14px;width:10%;font-weight:bold;text-align:center">State</td>
          <td style="border:1px solid #000;padding:14px;width:22%"${ce}></td>
          <td style="border:1px solid #000;padding:14px;width:18%;font-weight:bold;text-align:center">Types of Expense</td>
          <td style="border:1px solid #000;padding:14px;width:18%"${ce}></td>
        </tr>
      </table>

      <!-- Blank spacer -->
      <div style="height:14px"></div>

      <!-- Signatory rows -->
      <table style="width:100%;border-collapse:collapse;margin-bottom:0;font-size:12px">
        ${signatoryRows}

        <!-- Blank spacer row before Date -->
        <tr><td colspan="6" style="padding:3px;border:none">&nbsp;</td></tr>

        <!-- Date row -->
        <tr>
          <td style="border:1px solid #000;padding:14px;width:18%;font-weight:bold;font-size:12px">Date</td>
          <td colspan="5" style="border:1px solid #000;padding:14px;font-size:13px">
            &nbsp;&nbsp;/____/
          </td>
        </tr>

        <!-- Final blank row -->
        <tr>
          <td colspan="6" style="border:1px solid #000;padding:24px">&nbsp;</td>
        </tr>
      </table>
    </div>`;
}


window._iwLoadRecordForEdit = async (id) => {
  const modal = document.getElementById('iw-records-modal');
  if (modal) modal.remove();
  try {
    const [record, items] = await Promise.all([
      api(`/api/inward?inwardId=${id}`),
      api(`/api/inward/${id}/items`)
    ]);
    const r = Array.isArray(record) ? record[0] : record;
    if (!r) return showToast('Record not found', 'error');
    _iwEditId = id;
    const dvSel = $('#iw-div'); if (dvSel && r.DivisionId) dvSel.value = r.DivisionId;
    const oEl = $('#iw-order-num'); if (oEl) oEl.value = r.OrderNumber || '';
    const dcEl = $('#iw-dc-num'); if (dcEl) dcEl.value = r.DCNumber || '';
    const invEl = $('#iw-inv-num'); if (invEl) invEl.value = r.InvoiceNumber || '';
    const dtEl = $('#iw-date'); if (dtEl) dtEl.value = r.InwardDate ? new Date(r.InwardDate).toISOString().split('T')[0] : '';
    const vEl = $('#iw-vendor'); if (vEl && r.VendorId) {
      vEl.value = r.VendorId;
      _iwVendorItems = await api(`/api/inward/items-by-vendor?vendorId=${r.VendorId}`);
    }
    _iwLines = (items || []).map(it => ({
      ItemId: String(it.ItemId || ''), ItemName: it.ItemName || '',
      CategoryId: String(it.CategoryId || ''), CategoryName: it.CategoryName || '',
      DCQty: it.DCQty || 0, TotalQty: it.TotalQty || 0,
      Rate: it.rate || 0, TotalAmt: it.TotalAmt || 0,
      ItemStatus: it.status || 'Complete', Reason: '', ReturnMode: '', PersonName: '',
      CourierName: '', CourierId: '', ReturnDate: '', TrackId: ''
    }));
    _iwRenderPreview(); _iwRenderItemPanel();
    // Lock all Inward Detail inputs â€” view mode only
    ['#iw-vendor', '#iw-div', '#iw-order-num', '#iw-dc-num', '#iw-inv-num', '#iw-date'].forEach(sel => {
      const el = $(sel); if (!el) return;
      el.disabled = true; el.style.opacity = '0.6'; el.style.cursor = 'not-allowed';
    });
    const saveBtnV = $('#btn-iw-save');
    if (saveBtnV) { saveBtnV.disabled = true; saveBtnV.style.opacity = '0.4'; saveBtnV.title = 'View mode â€” cannot save'; }
    showToast(`Loaded Inward #${id} for editing`, 'success');
  } catch (e) { showToast('Failed to load: ' + e.message, 'error'); }
};


// ======== ISSUE ITEMS &#8211; FULL PAGE ========

let _issDivs = [], _issDealers = [], _issCouriers = [], _issItems = [];
let _issLines = [], _issEditId = null, _issCurrentDistCode = null, _issCurrentDealerID = null;
const _I = id => `style="background:var(--bg-dark);border:1px solid var(--border);border-radius:6px;padding:6px 10px;color:var(--text-primary);width:100%;font-size:13px${id ? ';' + id : ''}"`;
const _S = () => `style="background:var(--bg-dark);border:1px solid var(--border);border-radius:6px;padding:6px 10px;color:var(--text-primary);width:100%;font-size:13px;cursor:pointer"`;
const _RO = () => `style="background:var(--bg-dark);border:1px dashed var(--border);border-radius:6px;padding:6px 10px;color:var(--text-muted);width:100%;font-size:13px;cursor:default"`;
const _L = () => `style="font-size:11.5px;font-weight:600;color:var(--text-muted);margin-bottom:4px;display:block"`;
const _F = () => `style="display:flex;flex-direction:column"`;

registerPage('issue-items', () => {
  const today = new Date().toISOString().split('T')[0];
  return `
  <div style="padding:0">
    <div style="background:var(--bg-card);padding:20px 28px 16px;border-bottom:1px solid var(--border)">
      <h2 style="margin:0;font-size:18px;font-weight:700;color:var(--text-primary);display:flex;align-items:center;gap:10px">
        <i class="fas fa-arrow-up-from-bracket" style="color:var(--accent)"></i> Issue Items
      </h2>
      <div style="font-size:12px;color:var(--text-muted);margin-top:3px">Transactions / Issue Items</div>
    </div>

    <div class="card" style="padding:20px 24px">

      <!-- Section 1: Issue Details -->
      <div style="font-size:12px;font-weight:700;color:var(--accent);letter-spacing:1px;text-transform:uppercase;margin-bottom:14px;padding-bottom:6px;border-bottom:1px solid var(--border)">
        <i class="fas fa-circle-info" style="margin-right:6px"></i>Issue Details
      </div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-bottom:16px">
        <div ${_F()}><label ${_L()}>Request Mode <span style="color:var(--danger)">*</span></label>
          <select id="iss-rmode" ${_S()}>
            <option value="">&#8212; Select &#8212;</option>
            <option value="Email">Email</option>
            <option value="Verbal">Verbal</option>
            <option value="WhatsApp">WhatsApp</option>
          </select></div>

        <div ${_F()}><label ${_L()}>Division <span style="color:var(--danger)">*</span></label>
          <select id="iss-div" ${_S()}><option value="">&#8212; Select Division &#8212;</option></select></div>

        <div ${_F()}><label ${_L()}>Distributor Name <span style="color:var(--danger)">*</span></label>
          <div style="display:flex;gap:6px">
            <select id="iss-dist" ${_S()} style="flex:1">
              <option value="">&#8212; Select Division first &#8212;</option>
            </select>
            <button id="btn-iss-dist-search" class="btn btn-secondary btn-sm" style="white-space:nowrap;padding:6px 10px" title="Search Distributor">
              <i class="fas fa-search"></i> Search</button>
          </div></div>

        <div ${_F()}><label ${_L()}>Request By</label>
          <input type="text" id="iss-reqby" ${_I()}/></div>

        <div ${_F()}><label ${_L()}>Department</label>
          <input type="text" id="iss-dep" ${_I()}/></div>

        <div ${_F()}><label ${_L()}>Issue Date <span style="color:var(--danger)">*</span></label>
          <input type="date" id="iss-date" value="${today}" ${_I()}/></div>
      </div>

      <!-- Section 2: Item Entry Row -->
      <div style="font-size:12px;font-weight:700;color:var(--accent);letter-spacing:1px;text-transform:uppercase;margin-bottom:14px;padding-bottom:6px;border-bottom:1px solid var(--border)">
        <i class="fas fa-box" style="margin-right:6px"></i>Item Entry
      </div>
      <div style="display:grid;grid-template-columns:2fr 1fr 1fr 1fr auto auto;gap:10px;align-items:end;margin-bottom:16px">
        <div ${_F()}><label ${_L()}>Item <span style="color:var(--danger)">*</span></label>
          <select id="iss-item-sel" ${_S()}><option value="">&#8212; Select Division & Distributor first &#8212;</option></select></div>
        <div ${_F()}><label ${_L()}>Available Qty</label>
          <input type="text" id="iss-avail" readonly ${_RO()} placeholder="&#8212;"/></div>
        <div ${_F()}><label ${_L()}>Requested Qty</label>
          <input type="number" id="iss-reqqty" min="0" value="0" ${_I()}/></div>
        <div ${_F()}><label ${_L()}>Issue Qty <span style="color:var(--danger)">*</span></label>
          <input type="number" id="iss-issqty" min="0" value="0" ${_I()}/></div>
        <button class="btn btn-success btn-sm" id="btn-iss-add" style="align-self:end;padding:7px 14px" title="Add item">
          <i class="fas fa-plus"></i></button>
        <button class="btn btn-danger btn-sm" id="btn-iss-clear-row" style="align-self:end;padding:7px 14px" title="Clear row">
          <i class="fas fa-minus"></i></button>
      </div>

      <!-- Preview Table -->
      <div style="overflow-x:auto;max-height:240px;overflow-y:auto;border:1px solid var(--border);border-radius:8px;margin-bottom:20px">
        <table style="width:100%;border-collapse:collapse;min-width:700px;font-size:12px">
          <thead style="background:var(--bg-dark);position:sticky;top:0;z-index:2">
            <tr>
              <th style="padding:8px;text-align:center;width:30px">&#x2713;</th>
              <th style="padding:8px;text-align:center">SrlNo</th>
              <th style="padding:8px;text-align:left">Item Name</th>
              <th style="padding:8px;text-align:center">Req. Qty</th>
              <th style="padding:8px;text-align:center">Issue Qty</th>
              <th style="padding:8px;text-align:center">Pending Qty</th>
              <th style="padding:8px;text-align:center">ItemFlag</th>
              <th style="padding:8px;text-align:center;width:40px"></th>
            </tr>
          </thead>
          <tbody id="tbl-iss-preview">
            <tr class="empty-row"><td colspan="8" style="padding:20px;text-align:center;color:var(--text-muted)">
              No items added. Choose item above and click +.</td></tr>
          </tbody>
        </table>
      </div>

      <!-- Divider -->
      <div style="border-top:2px dashed var(--border);margin:18px 0"></div>

      <!-- Section 3: Status & Delivery -->
      <div style="font-size:12px;font-weight:700;color:var(--accent);letter-spacing:1px;text-transform:uppercase;margin-bottom:14px;padding-bottom:6px;border-bottom:1px solid var(--border)">
        <i class="fas fa-truck" style="margin-right:6px"></i>Delivery Details
      </div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-bottom:14px">
        <div ${_F()}><label ${_L()}>Issue Status</label>
          <input type="text" id="iss-status-disp" readonly ${_RO()} value="Open"/></div>
        <div ${_F()}><label ${_L()}>Deliver Mode <span style="color:var(--danger)">*</span></label>
          <select id="iss-delmode" ${_S()}>
            <option value="">&#8212; Select &#8212;</option>
            <option value="Hand">Hand</option>
            <option value="Courier">Courier</option>
          </select></div>
        <div ${_F()}><label ${_L()}>Person Name <span style="color:var(--danger)" id="iss-pname-star">*</span></label>
          <input type="text" id="iss-pname" ${_I()} disabled style="opacity:.45"/></div>
      </div>
      <div style="font-size:12px;font-weight:600;color:var(--text-muted);margin-bottom:8px">Courier Details</div>
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:14px">
        <div ${_F()}><label ${_L()}>Courier Name <span style="color:var(--danger)">*</span></label>
          <select id="iss-courier" ${_S()} disabled style="opacity:.45">
            <option value="">&#8212; Select Courier &#8212;</option>
          </select></div>
        <div ${_F()}><label ${_L()}>Mobile Number</label>
          <input type="text" id="iss-cmob" ${_I()} disabled style="opacity:.45"/></div>
        <div ${_F()}><label ${_L()}>Track Id</label>
          <input type="text" id="iss-tid" ${_I()} disabled style="opacity:.45"/></div>
        <div ${_F()}><label ${_L()}>Location</label>
          <input type="text" id="iss-cloc" ${_I()} disabled style="opacity:.45"/></div>
      </div>
      <div ${_F()} style="margin-bottom:20px"><label ${_L()}>Issue Note</label>
        <textarea id="iss-note" rows="2" ${_I('resize:none')}></textarea></div>

      <!-- Buttons -->
      <div style="display:flex;gap:12px;padding-top:16px;border-top:1px solid var(--border)">
        <button class="btn btn-success" id="btn-iss-save">
          <i class="fas fa-floppy-disk"></i> Save Issue</button>
        <button class="btn btn-secondary" id="btn-iss-track">
          <i class="fas fa-location-dot"></i> Update Track ID</button>
        <button class="btn btn-danger" id="btn-iss-close" style="margin-left:auto">
          <i class="fas fa-xmark"></i> Close Form</button>
      </div>
    </div>
  </div>`;
});

window._pageBinders['issue-items'] = async () => {
  _issLines = []; _issEditId = null; _issCurrentDistCode = null; _issCurrentDealerID = null;
  try {
    [_issDivs, _issCouriers] = await Promise.all([
      api('/api/divisions?active=1'), api('/api/couriers')
    ]);
  } catch (_) { }

  // Divisions
  const divSel = $('#iss-div');
  if (divSel) _issDivs.forEach(d =>
    divSel.insertAdjacentHTML('beforeend',
      `<option value="${d.DivisionId || d.DivisionID}">${d.DivisionName}</option>`));

  // Couriers
  const courierSel = $('#iss-courier');
  if (courierSel) _issCouriers.forEach(c =>
    courierSel.insertAdjacentHTML('beforeend',
      `<option value="${c.CourierID || c.CourierId}">${c.Name || c.CourierName}</option>`));
  // Courier change â†’ update Mobile Number
  if (courierSel) courierSel.onchange = () => {
    const cid = courierSel.value;
    const courier = _issCouriers.find(c => String(c.CourierID || c.CourierId) === cid);
    const mobEl = $('#iss-cmob');
    if (mobEl && courier) mobEl.value = courier.Mob || '';
  };

  // Division change &#8594; reload dealers + items
  if (divSel) divSel.onchange = async () => {
    const vid = divSel.value;
    _issDealers = []; _issItems = [];
    const distSel = $('#iss-dist');
    if (distSel) { distSel.innerHTML = '<option value="">&#8212; Select Distributor &#8212;</option>'; }
    const itemSel = $('#iss-item-sel');
    if (itemSel) { itemSel.innerHTML = '<option value="">&#8212; Select Distributor first &#8212;</option>'; }
    if (!vid) return;
    try {
      [_issDealers, _issItems] = await Promise.all([
        api(`/api/dealers?divisionId=${vid}`),
        api(`/api/items-by-division?divisionId=${vid}`)
      ]);
    } catch (_) { }
    if (distSel) _issDealers.forEach(d =>
      distSel.insertAdjacentHTML('beforeend',
        `<option value="${d.DistCode}">${d.DistCode} &#8211; ${d.DealerCompanyName}</option>`));
    _issPopulateItems();
  };

  // Distrib change &#8594; update items + auto-fill Deliver Mode & Courier from dealer
  const distSel = $('#iss-dist');
  if (distSel) distSel.onchange = () => {
    _issCurrentDistCode = distSel.value || null;
    // Also store the corresponding DealerID
    const dealer = _issDealers.find(d => d.DistCode === distSel.value);
    _issCurrentDealerID = dealer ? (dealer.DealerID || null) : null;
    _issPopulateItems();
    // Auto-set Deliver Mode to Courier and populate courier from dealer's default
    if (distSel.value) {
      const delModeEl = $('#iss-delmode');
      if (delModeEl) { delModeEl.value = 'Courier'; _issApplyDelMode(); }
    }
  };

  // Distributor search button
  $('#btn-iss-dist-search').onclick = () => _issShowDistSearch();

  // Item selection -> show available qty, reset qty fields + re-validate
  const itemSel = $('#iss-item-sel');
  if (itemSel) itemSel.onchange = () => {
    const it = _issItems.find(i => String(i.Itemid) === itemSel.value);
    const avail = $('#iss-avail');
    if (avail) avail.value = it ? Math.max(0, it.AvailableQty || 0) : '';
    // Reset qtys when item changes
    const r = $('#iss-reqqty'); if (r) r.value = '0';
    const is2 = $('#iss-issqty'); if (is2) is2.value = '0';
    _issValidateQtys();
  };

  // Real-time qty validation
  const rqEl = $('#iss-reqqty');
  const iqEl = $('#iss-issqty');
  if (rqEl) rqEl.oninput = _issValidateQtys;
  if (iqEl) iqEl.oninput = _issValidateQtys;

  // Clear row
  $('#btn-iss-clear-row').onclick = () => {
    const s = $('#iss-item-sel'); if (s) s.value = '';
    const a = $('#iss-avail'); if (a) a.value = '';
    const r = $('#iss-reqqty'); if (r) r.value = '0';
    const i = $('#iss-issqty'); if (i) i.value = '0';
  };

  // Add item
  $('#btn-iss-add').onclick = () => _issAddLine();

  // Deliver mode conditional
  $('#iss-delmode').onchange = () => _issApplyDelMode();

  // Save / Track / Close
  $('#btn-iss-save').onclick = () => _issSave();
  $('#btn-iss-track').onclick = () => _issUpdateTrack();
  $('#btn-iss-close').onclick = () => _issReset();

  _issRenderPreview();
};

function _issPopulateItems() {
  const itemSel = $('#iss-item-sel');
  if (!itemSel) return;
  itemSel.innerHTML = `<option value="">&#8212; Select Item &#8212;</option>`;
  _issItems.forEach(it =>
    itemSel.insertAdjacentHTML('beforeend',
      `<option value="${it.Itemid}">${it.ItemName}</option>`));
  const avail = $('#iss-avail'); if (avail) avail.value = '';
}

// Real-time quantity validation for Issue Items
function _issValidateQtys() {
  const availVal = parseFloat($('#iss-avail')?.value) || 0;
  const reqQty = parseInt($('#iss-reqqty')?.value) || 0;
  const issQty = parseInt($('#iss-issqty')?.value) || 0;

  let reqErr = '', issErr = '';
  if (reqQty > 0 && reqQty > availVal)
    reqErr = `Cannot exceed Available Qty (${availVal})`;
  if (issQty > 0 && issQty > reqQty)
    issErr = `Cannot exceed Requested Qty (${reqQty})`;

  // Inline error for Requested Qty input
  const reqInput = $('#iss-reqqty');
  if (reqInput) {
    reqInput.style.borderColor = reqErr ? 'var(--danger)' : '';
    let errEl = document.getElementById('iss-reqqty-err');
    if (!errEl) {
      errEl = document.createElement('div');
      errEl.id = 'iss-reqqty-err';
      errEl.style.cssText = 'color:var(--danger);font-size:11px;position:absolute;bottom:-16px;left:0;white-space:nowrap;z-index:5';
      if (reqInput.parentElement) {
        reqInput.parentElement.style.position = 'relative';
        reqInput.parentElement.appendChild(errEl);
      }
    }
    errEl.textContent = reqErr;
  }

  // Inline error for Issue Qty input
  const issInput = $('#iss-issqty');
  if (issInput) {
    issInput.style.borderColor = issErr ? 'var(--danger)' : '';
    let errEl = document.getElementById('iss-issqty-err');
    if (!errEl) {
      errEl = document.createElement('div');
      errEl.id = 'iss-issqty-err';
      errEl.style.cssText = 'color:var(--danger);font-size:11px;position:absolute;bottom:-16px;left:0;white-space:nowrap;z-index:5';
      if (issInput.parentElement) {
        issInput.parentElement.style.position = 'relative';
        issInput.parentElement.appendChild(errEl);
      }
    }
    errEl.textContent = issErr;
  }

  // Disable + button while any validation error exists
  const addBtn = $('#btn-iss-add');
  if (addBtn) addBtn.disabled = !!(reqErr || issErr);
}

function _issAddLine() {
  const itemSel = $('#iss-item-sel');
  if (!itemSel?.value) return showToast('Select an item first', 'error');
  const availVal = parseFloat($('#iss-avail')?.value) || 0;
  const reqQty = parseInt($('#iss-reqqty')?.value) || 0;
  const issQty = parseInt($('#iss-issqty')?.value) || 0;

  if (reqQty <= 0) return showToast('Requested Qty must be greater than 0', 'error');
  if (reqQty > availVal) return showToast(`Requested Qty (${reqQty}) cannot exceed Available Qty (${availVal})`, 'error');
  if (issQty <= 0) return showToast('Issue Qty must be greater than 0', 'error');
  if (issQty > reqQty) return showToast(`Issue Qty (${issQty}) cannot exceed Requested Qty (${reqQty})`, 'error');

  const it = _issItems.find(i => String(i.Itemid) === itemSel.value);
  const pendQty = Math.max(0, reqQty - issQty);
  const flag = pendQty === 0 ? 'C' : 'P';
  _issLines.push({
    ItemId: itemSel.value, ItemName: it?.ItemName || '',
    RequestQty: reqQty, IssueQty: issQty, PendingQty: pendQty, ItemFlag: flag,
    AvailableQty: it?.AvailableQty || 0
  });
  _issRenderPreview();
  // Reset row
  itemSel.value = '';
  const a = $('#iss-avail'); if (a) a.value = '';
  const r = $('#iss-reqqty'); if (r) r.value = '0';
  const is2 = $('#iss-issqty'); if (is2) is2.value = '0';
  _issValidateQtys(); // reset error state
  showToast('Item added', 'success');
}

function _issRenderPreview() {
  const tbody = $('#tbl-iss-preview'); if (!tbody) return;
  // Recalc status
  const allC = _issLines.length > 0 && _issLines.every(l => l.ItemFlag === 'C');
  const statusEl = $('#iss-status-disp');
  if (statusEl) statusEl.value = allC ? 'Close' : 'Open';

  if (!_issLines.length) {
    tbody.innerHTML = `<tr class="empty-row"><td colspan="8" style="padding:20px;text-align:center;color:var(--text-muted)">
      No items added. Choose item above and click +.</td></tr>`;
    return;
  }
  tbody.innerHTML = _issLines.map((l, i) => `
    <tr style="border-bottom:1px solid var(--border)">
      <td style="padding:6px;text-align:center"><input type="checkbox" class="iss-chk" data-i="${i}"/></td>
      <td style="padding:6px;text-align:center;color:var(--text-muted)">${i + 1}</td>
      <td style="padding:6px;font-weight:600">${l.ItemName}</td>
      <td style="padding:6px;text-align:center">${l.RequestQty}</td>
      <td style="padding:6px;text-align:center">${l.IssueQty}</td>
      <td style="padding:6px;text-align:center;color:${l.PendingQty > 0 ? 'var(--warning)' : 'var(--success)'}">${l.PendingQty}</td>
      <td style="padding:6px;text-align:center">
        <span style="padding:2px 8px;border-radius:10px;font-size:11px;background:${l.ItemFlag === 'C' ? 'rgba(34,197,94,.18)' : 'rgba(245,158,11,.18)'};color:${l.ItemFlag === 'C' ? '#4ade80' : '#fbbf24'}">${l.ItemFlag}</span>
      </td>
      <td style="padding:6px;text-align:center">
        <button class="btn btn-danger btn-icon btn-sm" onclick="window._issRemoveLine(${i})"><i class="fas fa-minus"></i></button>
      </td>
    </tr>`).join('');
}
window._issRemoveLine = (i) => { _issLines.splice(i, 1); _issRenderPreview(); };

function _issSetField(id, enabled) {
  const el = $(id); if (!el) return;
  el.disabled = !enabled; el.style.opacity = enabled ? '1' : '0.45';
}
function _issApplyDelMode() {
  const mode = $('#iss-delmode')?.value || '';
  const isHand = mode === 'Hand', isCourier = mode === 'Courier';
  _issSetField('#iss-pname', isHand);
  ['#iss-courier', '#iss-cmob', '#iss-tid', '#iss-cloc'].forEach(id => _issSetField(id, isCourier));
  if (!isHand) { const p = $('#iss-pname'); if (p) p.value = ''; }
  if (!isCourier) {
    ['#iss-courier', '#iss-cmob', '#iss-tid', '#iss-cloc'].forEach(id => { const el = $(id); if (el) el.value = ''; });
  } else {
    // When Courier is selected, auto-populate courier & mobile from the selected distributor
    _issAutoFillCourierFromDealer();
  }
}

// Auto-select the distributor's default courier and populate its mobile number
function _issAutoFillCourierFromDealer() {
  const dealer = _issDealers.find(d => d.DistCode === _issCurrentDistCode);
  if (!dealer || !dealer.CourierId) return;
  const courierId = String(dealer.CourierId);
  const courier   = _issCouriers.find(c => String(c.CourierID || c.CourierId) === courierId);
  // Auto-select in the courier dropdown
  const courierSel = $('#iss-courier');
  if (courierSel) courierSel.value = courierId;
  // Auto-fill mobile
  const mobEl = $('#iss-cmob');
  if (mobEl && courier) mobEl.value = courier.Mob || '';
}

function _issReset() {
  _issLines = []; _issEditId = null; _issCurrentDistCode = null; _issCurrentDealerID = null;
  ['#iss-rmode', '#iss-div', '#iss-dist', '#iss-item-sel', '#iss-delmode', '#iss-courier']
    .forEach(id => { const el = $(id); if (el) el.value = ''; });
  ['#iss-reqby', '#iss-dep', '#iss-avail', '#iss-pname', '#iss-cmob', '#iss-tid', '#iss-cloc', '#iss-note']
    .forEach(id => { const el = $(id); if (el) el.value = ''; });
  const d = $('#iss-date'); if (d) d.value = new Date().toISOString().split('T')[0];
  const r = $('#iss-reqqty'); if (r) r.value = '0';
  const i = $('#iss-issqty'); if (i) i.value = '0';
  ['#iss-pname', '#iss-courier', '#iss-cmob', '#iss-tid', '#iss-cloc'].forEach(id => _issSetField(id, false));
  _issRenderPreview();
  showToast('Form reset', 'info');
}

async function _issSave() {
  const rmode = $('#iss-rmode')?.value;
  const divId = $('#iss-div')?.value;
  const dist = $('#iss-dist')?.value || _issCurrentDistCode;
  const date = $('#iss-date')?.value;
  const delMode = $('#iss-delmode')?.value;
  if (!rmode) return showToast('Request Mode is required', 'error');
  if (!divId) return showToast('Division is required', 'error');
  if (!dist) return showToast('Distributor Name is required', 'error');
  if (!date) return showToast('Issue Date is required', 'error');
  if (!delMode) return showToast('Deliver Mode is required', 'error');
  if (!_issLines.length) return showToast('Add at least one item', 'error');
  if (delMode === 'Hand' && !$('#iss-pname')?.value?.trim()) return showToast('Person Name is required', 'error');
  if (delMode === 'Courier' && !$('#iss-courier')?.value) return showToast('Courier Name is required', 'error');

  const body = {
    RequestMode: rmode, DivisionId: divId, DistCode: dist,
    RequestedForDealerID: _issCurrentDealerID || null,
    RequestByEmpName: $('#iss-reqby')?.value?.trim() || null,
    DepName: $('#iss-dep')?.value?.trim() || null,
    IssueDate: date, DeliverMode: delMode,
    DeliverByPersonName: $('#iss-pname')?.value?.trim() || null,
    CourierId: delMode === 'Courier' ? ($('#iss-courier')?.value || null) : null,
    CourierName: delMode === 'Courier' ? ($('#iss-courier')?.selectedOptions[0]?.text || null) : null,
    TrackId: $('#iss-tid')?.value?.trim() || null,
    CourierPersonMob: $('#iss-cmob')?.value?.trim() || null,
    CourierPersonLocation: $('#iss-cloc')?.value?.trim() || null,
    IssueNote: $('#iss-note')?.value?.trim() || null,
    items: _issLines.map(l => ({
      ItemId: l.ItemId, RequestQty: l.RequestQty, IssueQty: l.IssueQty
    }))
  };
  try {
    if (_issEditId) {
      await api(`/api/issues/${_issEditId}`, { method: 'PUT', body });
      showToast('Issue updated!', 'success');
    } else {
      const res = await api('/api/issues', { method: 'POST', body });
      showToast(`Issue #${res.IssueId} saved! Stock deducted.`, 'success');
      _issReset();   // auto-reset form after successful save
    }
  } catch (e) { showToast('Save failed: ' + e.message, 'error'); }
}

async function _issUpdateTrack() {
  document.getElementById('iss-track-modal')?.remove();

  const ov = document.createElement('div');
  ov.className = 'modal-overlay'; ov.id = 'iss-track-modal';
  ov.style.cssText = 'z-index:9998';
  ov.innerHTML = `
    <div class="modal" style="max-width:1700px;width:99vw;height:94vh;display:flex;flex-direction:column;padding:0">
      <!-- Header -->
      <div class="modal-header" style="flex-shrink:0;border-radius:12px 12px 0 0">
        <h3><i class="fas fa-location-dot"></i>&nbsp; Update Track ID</h3>
        <button class="btn-close-modal" onclick="document.getElementById('iss-track-modal').remove()">
          <i class="fas fa-xmark"></i></button>
      </div>
      <!-- Two-column body -->
      <div style="display:flex;flex:1;overflow:hidden;border-radius:0 0 12px 12px">

        <!-- LEFT: Issue list + form -->
        <div style="width:480px;flex-shrink:0;display:flex;flex-direction:column;border-right:1px solid var(--border)">
          <div style="overflow:auto;flex:1">
            <table style="width:100%;border-collapse:collapse;font-size:11.5px">
              <thead style="background:var(--bg-dark);position:sticky;top:0;color:var(--text-primary)">
                <tr>
                  <th style="padding:7px 9px;text-align:left">Issue ID</th>
                  <th style="padding:7px 9px;text-align:left">Dealer</th>
                  <th style="padding:7px 9px;text-align:left">Courier</th>
                  <th style="padding:7px 9px;text-align:left">Mode</th>
                  <th style="padding:7px 9px;text-align:left">Track ID</th>
                </tr>
              </thead>
              <tbody id="iss-track-tbody">
                <tr><td colspan="5" style="padding:40px;text-align:center">
                  <div class="spinner" style="margin:0 auto"></div></td></tr>
              </tbody>
            </table>
          </div>
          <!-- Form -->
          <div style="padding:14px 16px;border-top:1px solid var(--border);flex-shrink:0">
            <div style="display:flex;gap:10px;align-items:flex-end;flex-wrap:wrap;margin-bottom:10px">
              <div>
                <label style="display:block;font-size:11px;font-weight:600;margin-bottom:4px;color:var(--text-secondary)">Issue ID</label>
                <input type="text" id="trk-issue-id" readonly
                  style="width:90px;padding:6px 9px;border:1px solid var(--border);border-radius:4px;background:var(--bg-secondary);color:var(--text-muted);font-size:12px"
                  placeholder="Click a rowâ€¦"/>
              </div>
              <div style="flex:1">
                <label style="display:block;font-size:11px;font-weight:600;margin-bottom:4px;color:var(--text-secondary)">
                  Track ID <span style="color:var(--danger)">*</span>
                </label>
                <input type="text" id="trk-track-id"
                  style="width:100%;padding:6px 9px;border:1px solid var(--border);border-radius:4px;font-size:12px"
                  placeholder="Enter Track IDâ€¦"/>
              </div>
            </div>
            <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
              <button id="btn-trk-update" class="btn btn-success" style="padding:7px 18px;font-size:12px">
                <i class="fas fa-paper-plane"></i>&nbsp; Update &amp; Send Mail
              </button>
              <button id="btn-trk-only" class="btn btn-secondary" style="padding:7px 14px;font-size:12px">
                <i class="fas fa-floppy-disk"></i>&nbsp; Update Only
              </button>
            </div>
            <div id="trk-status-msg" style="font-size:11px;color:var(--text-muted);margin-top:6px"></div>
          </div>
        </div>

        <!-- RIGHT: Editable challan preview -->
        <div style="flex:1;display:flex;flex-direction:column;overflow:hidden;background:var(--bg-secondary)">
          <!-- Preview toolbar -->
          <div style="padding:8px 16px;background:var(--bg-card);border-bottom:1px solid var(--border);
                      display:flex;align-items:center;gap:10px;flex-shrink:0">
            <span style="font-weight:600;font-size:13px;color:var(--text-primary)">
              <i class="fas fa-file-contract" style="color:var(--accent)"></i>&nbsp; Challan Preview
            </span>
            <span style="background:rgba(255,215,0,.18);border:1px solid rgba(255,215,0,.4);color:#ffd580;
              padding:2px 9px;border-radius:20px;font-size:11px;font-weight:600"
              title="Click any challan field to edit. Changes are local only.">
              <i class="fas fa-pen-to-square" style="font-size:10px"></i> Editable Preview
            </span>
            <div style="margin-left:auto;display:flex;gap:6px">
              <button id="btn-trk-export" class="btn btn-secondary" style="padding:4px 12px;font-size:11px">
                <i class="fas fa-file-pdf"></i> Export
              </button>
              <button id="btn-trk-print" class="btn btn-secondary" style="padding:4px 12px;font-size:11px">
                <i class="fas fa-print"></i> Print
              </button>
            </div>
          </div>
          <!-- Challan area -->
          <div style="flex:1;overflow:auto;padding:20px">
            <div id="trk-chal-wrap" style="background:#fff;width:794px;margin:0 auto;
                 box-shadow:0 2px 18px rgba(0,0,0,.18);border-radius:2px;min-height:400px">
              <div id="chl-report-page" style="padding:8px">
                <div style="padding:60px;text-align:center;color:var(--text-muted)">
                  <i class="fas fa-arrow-left" style="font-size:22px;margin-bottom:10px;display:block"></i>
                  Click an issue row to load its Challan preview
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>`;
  document.body.appendChild(ov);
  ov.onclick = e => { if (e.target === ov) ov.remove(); };

  let _trkSelId = null, _trkSelDistCode = '', _trkSelDeliverMode = '';

  // -- Load issues grid --------------------------------------------------
  try {
    const issues = await api('/api/issues');
    const tbody = document.getElementById('iss-track-tbody');
    if (!tbody) return;
    if (!issues.length) {
      tbody.innerHTML = `<tr><td colspan="5" style="padding:30px;text-align:center;color:var(--text-muted)">No issues found.</td></tr>`;
    } else {
      tbody.innerHTML = issues.map((r, i) => {
        const bg = i % 2 === 0 ? 'var(--bg-card)' : 'var(--bg-secondary)';
        return `<tr data-id="${r.IssueId}" data-tid="${r.TrackId || ''}"
            data-dc="${r.DistCode || ''}" data-dm="${r.DeliverMode || 'Courier'}" data-bg="${bg}"
            class="trk-row" style="cursor:pointer;background:${bg}">
          <td style="padding:5px 9px;font-weight:600;color:var(--accent)">${r.IssueId}</td>
          <td style="padding:5px 9px;font-size:11px">${r.DealerCompanyName || 'â€”'}</td>
          <td style="padding:5px 9px;font-size:11px">${r.CourierName || 'â€”'}</td>
          <td style="padding:5px 9px;font-size:11px">${r.DeliverMode || 'â€”'}</td>
          <td style="padding:5px 9px;font-size:11px">${r.TrackId || 'â€”'}</td>
        </tr>`;
      }).join('');

      tbody.querySelectorAll('.trk-row').forEach(row => {
        const origBg = row.dataset.bg;
        row.onmouseover = () => { if (row.dataset.selected !== '1') row.style.background = 'var(--hover-bg)'; };
        row.onmouseout  = () => { if (row.dataset.selected !== '1') row.style.background = origBg; };
        row.onclick = async () => {
          tbody.querySelectorAll('.trk-row').forEach(r => { r.dataset.selected = '0'; r.style.background = r.dataset.bg; });
          row.dataset.selected = '1';
          row.style.background = 'rgba(var(--accent-rgb,42,90,186),.18)';
          _trkSelId = row.dataset.id;
          _trkSelDistCode    = row.dataset.dc;
          _trkSelDeliverMode = row.dataset.dm || 'Courier';

          const idEl = document.getElementById('trk-issue-id');
          const tidEl = document.getElementById('trk-track-id');
          if (idEl) idEl.value = _trkSelId;
          if (tidEl) { tidEl.value = row.dataset.tid !== 'â€”' ? row.dataset.tid : ''; }
          document.getElementById('trk-status-msg').textContent = `Issue #${_trkSelId} selected.`;

          // Load challan preview
          const page = document.getElementById('chl-report-page');
          if (page) page.innerHTML = `<div style="padding:40px;text-align:center"><div class="spinner" style="margin:0 auto"></div></div>`;
          try {
            const [h, rows] = await Promise.all([
              api(`/api/challan/header?issueId=${_trkSelId}&deliverMode=${_trkSelDeliverMode}&distCode=${encodeURIComponent(_trkSelDistCode)}`),
              api(`/api/challan/detail?issueId=${_trkSelId}`)
            ]);
            if (typeof _chalHeader !== 'undefined') {
              _chalHeader = h || {};
              _chalDetail = rows || [];
              _chalRender();
            }
          } catch(ce) {
            const p = document.getElementById('chl-report-page');
            if (p) p.innerHTML = `<div style="padding:30px;color:#c0392b">Failed to load challan: ${ce.message}</div>`;
          }
        };
      });
    }
  } catch (e) { showToast('Failed to load issues: ' + e.message, 'error'); }

  // -- Live-update Transportation By cell when Track ID input changes ------
  const tidInput = document.getElementById('trk-track-id');
  if (tidInput) {
    tidInput.addEventListener('input', () => {
      const td = document.getElementById('chl-transport-td');
      if (!td) return;
      const h = window._chalLastH || {};
      const tid = tidInput.value.trim();
      td.innerHTML = `Transportation By:&nbsp;&nbsp;&nbsp;<strong>${h.TransportationBy || ''}</strong>`
        + (tid ? `&nbsp;&nbsp;&nbsp;Track ID-${tid}` : '')
        + (h.CourierLink ? `<br><span style="font-size:10px">Courier Tracking Link: ${h.CourierLink}</span>` : '');
    });
  }

  // -- Export / Print buttons (delegate to report functions) ---------------
  document.getElementById('btn-trk-export')?.addEventListener('click', () => {
    if (typeof window._chalExport === 'function') window._chalExport();
    else showToast('Load a challan first', 'error');
  });
  document.getElementById('btn-trk-print')?.addEventListener('click', () => {
    if (typeof window._chalPrint === 'function') window._chalPrint();
    else showToast('Load a challan first', 'error');
  });

  // -- Helper: capture current (possibly edited) challan HTML --------------
  const _captureChallanHtml = () => {
    const page = document.getElementById('chl-report-page');
    if (!page) return null;
    const hasContent = page.querySelector('table');
    if (!hasContent) return null;
    return page.innerHTML.replace(/ contenteditable="true"/g, '');
  };

  // -- Update & Send Mail --------------------------------------------------
  const btnUpd = document.getElementById('btn-trk-update');
  if (btnUpd) btnUpd.onclick = async () => {
    if (!_trkSelId) return showToast('Please click an issue row first', 'error');
    const tid = document.getElementById('trk-track-id')?.value?.trim();
    if (!tid) return showToast('Please enter a Track ID', 'error');
    const challanHtml = _captureChallanHtml();
    btnUpd.disabled = true;
    btnUpd.innerHTML = '<i class="fas fa-spinner fa-spin"></i>&nbsp; Sendingâ€¦';
    const msg = document.getElementById('trk-status-msg');
    try {
      await api(`/api/issues/${_trkSelId}/track-and-email`, {
        method: 'PUT', body: { TrackId: tid, challanHtml }
      });
      if (msg) msg.textContent = `âœ… Track ID updated & email sent for Issue #${_trkSelId}`;
      showToast(`Track ID updated & email sent for Issue #${_trkSelId}`, 'success');
      const updRow = document.querySelector(`#iss-track-tbody .trk-row[data-id="${_trkSelId}"]`);
      if (updRow) { updRow.dataset.tid = tid; updRow.cells[4].textContent = tid; }
      _trkSelId = null;
      document.getElementById('trk-issue-id').value = '';
      document.getElementById('trk-track-id').value = '';
    } catch (e) {
      showToast('Failed: ' + e.message, 'error');
      if (msg) msg.textContent = `âŒ Error: ${e.message}`;
    } finally {
      btnUpd.disabled = false;
      btnUpd.innerHTML = '<i class="fas fa-paper-plane"></i>&nbsp; Update &amp; Send Mail';
    }
  };

  // -- Update Only (no email) ----------------------------------------------
  const btnOnly = document.getElementById('btn-trk-only');
  if (btnOnly) btnOnly.onclick = async () => {
    if (!_trkSelId) return showToast('Please click an issue row first', 'error');
    const tid = document.getElementById('trk-track-id')?.value?.trim();
    if (!tid) return showToast('Please enter a Track ID', 'error');
    btnOnly.disabled = true;
    btnOnly.innerHTML = '<i class="fas fa-spinner fa-spin"></i>&nbsp; Savingâ€¦';
    const msg = document.getElementById('trk-status-msg');
    try {
      await api(`/api/issues/${_trkSelId}/track`, { method: 'PUT', body: { TrackId: tid } });
      if (msg) msg.textContent = `âœ… Track ID updated for Issue #${_trkSelId} (no email sent)`;
      showToast(`Track ID updated for Issue #${_trkSelId}`, 'success');
      const updRow = document.querySelector(`#iss-track-tbody .trk-row[data-id="${_trkSelId}"]`);
      if (updRow) { updRow.dataset.tid = tid; updRow.cells[4].textContent = tid; }
    } catch (e) {
      showToast('Failed: ' + e.message, 'error');
      if (msg) msg.textContent = `âŒ Error: ${e.message}`;
    } finally {
      btnOnly.disabled = false;
      btnOnly.innerHTML = '<i class="fas fa-floppy-disk"></i>&nbsp; Update Only';
    }
  };
}



function _issShowDistSearch() {
  const divId = $('#iss-div')?.value;
  const ov = document.createElement('div');
  ov.className = 'modal-overlay'; ov.id = 'iss-dist-modal';
  ov.innerHTML = `
    <div class="modal" style="max-width:740px">
      <div class="modal-header">
        <h3><i class="fas fa-search"></i> Search Distributor</h3>
        <button class="btn-close-modal" onclick="document.getElementById('iss-dist-modal').remove()">
          <i class="fas fa-xmark"></i></button>
      </div>
      <div class="modal-body">
        <div class="search-bar" style="margin-bottom:12px">
          <div class="search-input-wrap"><i class="fas fa-search"></i>
            <input type="text" id="dist-srch-inp" placeholder="Search by Dist Code, Company or Contact..."/></div>
        </div>
        <div style="overflow-x:auto;max-height:420px;overflow-y:auto">
          <table style="width:100%;border-collapse:collapse;font-size:13px">
            <thead style="background:var(--bg-dark);position:sticky;top:0">
              <tr>
                <th style="padding:9px 12px;text-align:left">Dist. Code</th>
                <th style="padding:9px 12px;text-align:left">Dealer Company Name</th>
                <th style="padding:9px 12px;text-align:left">Contact Person</th>
              </tr>
            </thead>
            <tbody id="dist-srch-body">
              <tr class="empty-row"><td colspan="3" style="padding:20px;text-align:center">
                <div class="spinner" style="margin:0 auto"></div></td></tr>
            </tbody>
          </table>
        </div>
        <p style="font-size:11px;color:var(--text-muted);margin-top:8px;text-align:right">
          Click on a row to select</p>
      </div>
    </div>`;
  document.body.appendChild(ov);
  ov.onclick = e => { if (e.target === ov) ov.remove(); };

  const render = (list) => {
    const tb = document.getElementById('dist-srch-body'); if (!tb) return;
    if (!list.length) {
      tb.innerHTML = `<tr class="empty-row"><td colspan="3" style="padding:20px;text-align:center">No results.</td></tr>`; return;
    }
    tb.innerHTML = list.map(d => `
      <tr style="border-bottom:1px solid var(--border);cursor:pointer" class="dist-row"
          data-dist="${d.DistCode || ''}"
          data-name="${(d.DealerCompanyName || '').replace(/"/g, '&quot;')}"
          data-dealerid="${d.DealerID || ''}">
        <td style="padding:8px 12px;font-weight:600">${d.DistCode || '&#8212;'}</td>
        <td style="padding:8px 12px">${d.DealerCompanyName || '&#8212;'}</td>
        <td style="padding:8px 12px">${d.ContactPersonName || '&#8212;'}</td>
      </tr>`).join('');
    // Bind rows after render &#8212; pass DistCode, CompanyName, DealerID
    const modal = document.getElementById('iss-dist-modal');
    if (modal) modal.querySelectorAll('.dist-row').forEach(row =>
      row.onclick = () => window._issSelectDist(row.dataset.dist, row.dataset.name, row.dataset.dealerid));
  };

  let cached = divId
    ? _issDealers  // already loaded for this division
    : [];
  if (!divId) {
    api('/api/dealers').then(data => { cached = data; render(data); }).catch();
  } else { render(cached); }

  const inp = document.getElementById('dist-srch-inp');
  if (inp) inp.oninput = () => {
    const q = inp.value.toLowerCase();
    render(!q ? cached : cached.filter(d =>
      (d.DistCode || '').toLowerCase().includes(q) ||
      (d.DealerCompanyName || '').toLowerCase().includes(q) ||
      (d.ContactPersonName || '').toLowerCase().includes(q)));
  };
}
window._issSelectDist = (distCode, companyName, dealerId) => {
  const modal = document.getElementById('iss-dist-modal');
  if (modal) modal.remove();
  _issCurrentDistCode = distCode;
  _issCurrentDealerID = dealerId || null;
  // Update dropdown selection if the option exists
  const distSel = $('#iss-dist');
  if (distSel) {
    let found = false;
    for (const opt of distSel.options) {
      if (opt.value === distCode) { distSel.value = distCode; found = true; break; }
    }
    if (!found) {
      distSel.insertAdjacentHTML('beforeend',
        `<option value="${distCode}" selected>${distCode} &#8211; ${companyName}</option>`);
      distSel.value = distCode;
    }
  }
  _issPopulateItems();
  showToast(`Selected: ${distCode} &#8211; ${companyName}`, 'success');
};


// ======== ISSUE RETURN ========

let _irDivs = [], _irItems = [], _irCouriers = [], _irLines = [];

registerPage('issue-return', () => {
  const today = new Date().toISOString().split('T')[0];
  return `
  <div style="padding:0">
    <div style="background:var(--bg-card);padding:20px 28px 16px;border-bottom:1px solid var(--border)">
      <h2 style="margin:0;font-size:18px;font-weight:700;color:var(--text-primary);display:flex;align-items:center;gap:10px">
        <i class="fas fa-rotate-left" style="color:var(--accent)"></i> Return Issue Item
      </h2>
      <div style="font-size:12px;color:var(--text-muted);margin-top:3px">Transactions / Return Issue Item</div>
    </div>
    <div class="card" style="padding:20px 24px">

      <!-- Header fields row 1 -->
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px;margin-bottom:14px">
        <div style="display:flex;flex-direction:column">
          <label style="font-size:11.5px;font-weight:600;color:var(--text-muted);margin-bottom:4px">
            Division <span style="color:var(--danger)">*</span></label>
          <select id="ir-div" style="background:var(--bg-dark);border:1px solid var(--border);border-radius:6px;padding:6px 10px;color:var(--text-primary);font-size:13px;cursor:pointer">
            <option value="">&#8212; Select Division &#8212;</option>
          </select>
        </div>
        <div style="display:flex;flex-direction:column">
          <label style="font-size:11.5px;font-weight:600;color:var(--text-muted);margin-bottom:4px">
            Return Mode <span style="color:var(--danger)">*</span></label>
          <select id="ir-rmode" style="background:var(--bg-dark);border:1px solid var(--border);border-radius:6px;padding:6px 10px;color:var(--text-primary);font-size:13px;cursor:pointer">
            <option value="">&#8212; Select &#8212;</option>
            <option value="Hand">Hand</option>
            <option value="Courier">Courier</option>
          </select>
        </div>
        <div style="display:flex;flex-direction:column">
          <label style="font-size:11.5px;font-weight:600;color:var(--text-muted);margin-bottom:4px">
            Return Date <span style="color:var(--danger)">*</span></label>
          <input type="date" id="ir-rdate" value="${today}"
            style="background:var(--bg-dark);border:1px solid var(--border);border-radius:6px;padding:6px 10px;color:var(--text-primary);font-size:13px"/>
        </div>
      </div>

      <!-- Header fields row 2: Person Name / Courier fields -->
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px;margin-bottom:8px">
        <div style="display:flex;flex-direction:column">
          <label style="font-size:11.5px;font-weight:600;color:var(--text-muted);margin-bottom:4px">
            Person Name <span style="color:var(--danger)">*</span></label>
          <input type="text" id="ir-pname" disabled
            style="background:var(--bg-dark);border:1px solid var(--border);border-radius:6px;padding:6px 10px;color:var(--text-primary);font-size:13px;opacity:.45"/>
        </div>
        <div style="display:flex;flex-direction:column">
          <label style="font-size:11.5px;font-weight:600;color:var(--text-muted);margin-bottom:4px">
            Courier Name <span style="color:var(--danger)">*</span></label>
          <select id="ir-courier" disabled
            style="background:var(--bg-dark);border:1px solid var(--border);border-radius:6px;padding:6px 10px;color:var(--text-primary);font-size:13px;opacity:.45;cursor:pointer">
            <option value="">&#8212; Select Courier &#8212;</option>
          </select>
        </div>
        <div style="display:flex;flex-direction:column">
          <label style="font-size:11.5px;font-weight:600;color:var(--text-muted);margin-bottom:4px">
            Track Id <span style="color:var(--danger)">*</span></label>
          <input type="text" id="ir-trackid" disabled
            style="background:var(--bg-dark);border:1px solid var(--border);border-radius:6px;padding:6px 10px;color:var(--text-primary);font-size:13px;opacity:.45"/>
        </div>
      </div>

      <!-- Divider -->
      <div style="border-top:2px dashed var(--border);margin:16px 0"></div>

      <!-- Item entry fields -->
      <div style="font-size:12px;font-weight:700;color:var(--accent);letter-spacing:1px;text-transform:uppercase;margin-bottom:14px">
        <i class="fas fa-box-open" style="margin-right:6px"></i>Add Return Item
      </div>
      <div style="display:grid;grid-template-columns:2fr 1fr 1fr 2fr 2fr;gap:12px;margin-bottom:12px;align-items:end">
        <div style="display:flex;flex-direction:column">
          <label style="font-size:11.5px;font-weight:600;color:var(--text-muted);margin-bottom:4px">
            Return Item <span style="color:var(--danger)">*</span></label>
          <select id="ir-item-sel" style="background:var(--bg-dark);border:1px solid var(--border);border-radius:6px;padding:6px 10px;color:var(--text-primary);font-size:13px;cursor:pointer">
            <option value="">&#8212; Select Item &#8212;</option>
          </select>
        </div>
        <div style="display:flex;flex-direction:column">
          <label style="font-size:11.5px;font-weight:600;color:var(--text-muted);margin-bottom:4px">Return Qty</label>
          <input type="number" id="ir-rqty" min="1" value="1"
            style="background:var(--bg-dark);border:1px solid var(--border);border-radius:6px;padding:6px 10px;color:var(--text-primary);font-size:13px"/>
        </div>
        <div style="display:flex;flex-direction:column">
          <label style="font-size:11.5px;font-weight:600;color:var(--text-muted);margin-bottom:4px">Item Status</label>
          <select id="ir-istatus" style="background:var(--bg-dark);border:1px solid var(--border);border-radius:6px;padding:6px 10px;color:var(--text-primary);font-size:13px;cursor:pointer">
            <option value="C">Complete</option>
            <option value="RP">Return Pending</option>
          </select>
        </div>
        <div style="display:flex;flex-direction:column">
          <label style="font-size:11.5px;font-weight:600;color:var(--text-muted);margin-bottom:4px">Reason</label>
          <select id="ir-reason" style="background:var(--bg-dark);border:1px solid var(--border);border-radius:6px;padding:6px 10px;color:var(--text-primary);font-size:13px;cursor:pointer">
            <option value="">&#8212; Select Reason &#8212;</option>
            <option value="Wrong Materials">Wrong Materials</option>
            <option value="Found damaged at destination">Found damaged at destination</option>
            <option value="Return to Stock">Return to Stock</option>
            <option value="Scrap">Scrap</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <div style="display:flex;flex-direction:column">
          <label style="font-size:11.5px;font-weight:600;color:var(--text-muted);margin-bottom:4px">Remark</label>
          <input type="text" id="ir-remark"
            style="background:var(--bg-dark);border:1px solid var(--border);border-radius:6px;padding:6px 10px;color:var(--text-primary);font-size:13px"/>
        </div>
      </div>
      <div style="margin-bottom:16px">
        <button class="btn btn-secondary" id="btn-ir-add-item" style="font-size:13px">
          <i class="fas fa-plus"></i> Add Item</button>
        <span id="ir-add-err" style="font-size:12px;color:var(--danger);margin-left:12px"></span>
      </div>

      <!-- Preview table -->
      <div style="border:1px solid var(--border);border-radius:8px;overflow:auto;margin-bottom:20px;max-height:300px">
        <table style="width:100%;border-collapse:collapse;font-size:12px">
          <thead style="background:var(--bg-dark);position:sticky;top:0">
            <tr>
              <th style="padding:8px 10px;width:34px">
                <input type="checkbox" id="ir-chk-all" title="Select all"/></th>
              <th style="padding:8px 10px;text-align:center">Sr No.</th>
              <th style="padding:8px 10px;text-align:left">Item Name</th>
              <th style="padding:8px 10px;text-align:center">Return Qty</th>
              <th style="padding:8px 10px;text-align:center">Item Flag</th>
              <th style="padding:8px 10px;text-align:left">Reason</th>
              <th style="padding:8px 10px;text-align:left">Remark</th>
              <th style="padding:8px 10px;text-align:center">Del</th>
            </tr>
          </thead>
          <tbody id="ir-preview-body">
            <tr class="empty-row"><td colspan="8" style="padding:18px;text-align:center;color:var(--text-muted)">No items added yet.</td></tr>
          </tbody>
        </table>
      </div>

      <!-- Buttons -->
      <div style="display:flex;gap:12px;padding-top:14px;border-top:1px solid var(--border)">
        <button class="btn btn-success" id="btn-ir-save">
          <i class="fas fa-floppy-disk"></i> Save Issue Return</button>
        <button class="btn btn-danger" id="btn-ir-close" style="margin-left:auto">
          <i class="fas fa-xmark"></i> Close Form</button>
      </div>
    </div>
  </div>`;
});

window._pageBinders['issue-return'] = async () => {
  _irDivs = []; _irItems = []; _irCouriers = []; _irLines = [];
  try {
    [_irDivs, _irCouriers] = await Promise.all([api('/api/divisions?active=1'), api('/api/couriers')]);
  } catch (_) { }

  // Divisions
  const divSel = $('#ir-div');
  if (divSel) _irDivs.forEach(d =>
    divSel.insertAdjacentHTML('beforeend',
      `<option value="${d.DivisionId || d.DivisionID}">${d.DivisionName}</option>`));

  // Couriers
  const courierSel = $('#ir-courier');
  if (courierSel) _irCouriers.forEach(c =>
    courierSel.insertAdjacentHTML('beforeend',
      `<option value="${c.CourierID || c.CourierId}">${c.Name || c.CourierName}</option>`));

  // Division &#8594; filter items
  divSel.onchange = async () => {
    _irItems = [];
    const itemSel = $('#ir-item-sel');
    itemSel.innerHTML = '<option value="">&#8212; Select Item &#8212;</option>';
    const vid = divSel.value;
    if (vid) {
      try { _irItems = await api(`/api/items-by-division?divisionId=${vid}`); } catch (_) { }
      _irItems.forEach(it =>
        itemSel.insertAdjacentHTML('beforeend',
          `<option value="${it.Itemid}">${it.ItemName}</option>`));
    }
  };

  // Return Mode &#8594; conditional fields
  $('#ir-rmode').onchange = () => _irApplyMode();

  // Select-all
  $('#ir-chk-all').onchange = function () {
    document.querySelectorAll('.ir-line-chk').forEach(c => c.checked = this.checked);
  };

  // Add item
  $('#btn-ir-add-item').onclick = () => _irAddLine();

  // Save / Close
  $('#btn-ir-save').onclick = () => _irSave();
  $('#btn-ir-close').onclick = () => _irReset();
};

function _irSetField(id, enabled) {
  const el = $(id); if (!el) return;
  el.disabled = !enabled; el.style.opacity = enabled ? '1' : '0.45';
}
function _irApplyMode() {
  const mode = $('#ir-rmode')?.value || '';
  const isHand = mode === 'Hand', isCourier = mode === 'Courier';
  _irSetField('#ir-pname', isHand);
  _irSetField('#ir-courier', isCourier);
  _irSetField('#ir-trackid', isCourier);
  if (!isHand) { const p = $('#ir-pname'); if (p) p.value = ''; }
  if (!isCourier) { ['#ir-courier', '#ir-trackid'].forEach(id => { const el = $(id); if (el) el.value = ''; }); }
}

function _irAddLine() {
  const itemSel = $('#ir-item-sel');
  const errEl = $('#ir-add-err');
  if (!itemSel?.value) { if (errEl) errEl.textContent = 'Select a Return Item.'; return; }
  if (errEl) errEl.textContent = '';
  const itemName = itemSel.selectedOptions[0]?.text || '';
  const qty = parseInt($('#ir-rqty')?.value) || 1;
  const statusSel = $('#ir-istatus');
  const flag = statusSel?.value || 'C';
  const flagLabel = statusSel?.selectedOptions[0]?.text || 'Complete';
  const reason = $('#ir-reason')?.value || '';
  const remark = $('#ir-remark')?.value?.trim() || '';
  _irLines.push({
    ItemId: itemSel.value, ItemName: itemName, ReturnQty: qty,
    ItemFlag: flag, ItemFlagLabel: flagLabel, Reason: reason, Remark: remark
  });
  _irRenderPreview();
  // Clear item entry fields (keep division/mode/date intact)
  itemSel.value = ''; $('#ir-rqty').value = '1';
  if ($('#ir-reason')) $('#ir-reason').value = '';
  if ($('#ir-remark')) $('#ir-remark').value = '';
}

function _irRenderPreview() {
  const tbody = $('#ir-preview-body'); if (!tbody) return;
  if (!_irLines.length) {
    tbody.innerHTML = '<tr class="empty-row"><td colspan="8" style="padding:18px;text-align:center;color:var(--text-muted)">No items added yet.</td></tr>';
    return;
  }
  tbody.innerHTML = _irLines.map((l, i) => `
    <tr style="border-bottom:1px solid var(--border)">
      <td style="padding:6px 10px;text-align:center">
        <input type="checkbox" class="ir-line-chk" data-i="${i}"/></td>
      <td style="padding:6px 10px;text-align:center;color:var(--text-muted)">${i + 1}</td>
      <td style="padding:6px 10px;font-weight:600">${l.ItemName}</td>
      <td style="padding:6px 10px;text-align:center">${l.ReturnQty}</td>
      <td style="padding:6px 10px;text-align:center">
        <span style="padding:2px 8px;border-radius:10px;font-size:11px;background:${l.ItemFlag === 'C' ? 'rgba(34,197,94,.15)' : 'rgba(245,158,11,.15)'};color:${l.ItemFlag === 'C' ? '#22c55e' : '#fbbf24'}">
          ${l.ItemFlag}</span></td>
      <td style="padding:6px 10px">${l.Reason || '&#8212;'}</td>
      <td style="padding:6px 10px">${l.Remark || '&#8212;'}</td>
      <td style="padding:6px 10px;text-align:center">
        <button class="btn btn-danger btn-icon" onclick="window._irDelLine(${i})">
          <i class="fas fa-xmark"></i></button></td>
    </tr>`).join('');
  $('#ir-chk-all').checked = false;
}
window._irDelLine = (i) => {
  const chks = [...document.querySelectorAll('.ir-line-chk:checked')].map(c => +c.dataset.i);
  const toRemove = chks.includes(i) ? chks : [i];
  _irLines = _irLines.filter((_, idx) => !toRemove.includes(idx));
  _irRenderPreview();
};

function _irReset() {
  _irLines = [];
  ['#ir-div', '#ir-rmode', '#ir-courier', '#ir-item-sel', '#ir-reason', '#ir-istatus']
    .forEach(id => { const el = $(id); if (el) el.value = ''; });
  ['#ir-pname', '#ir-trackid', '#ir-remark'].forEach(id => { const el = $(id); if (el) el.value = ''; });
  const d = $('#ir-rdate'); if (d) d.value = new Date().toISOString().split('T')[0];
  const r = $('#ir-rqty'); if (r) r.value = '1';
  ['#ir-pname', '#ir-courier', '#ir-trackid'].forEach(id => _irSetField(id, false));
  // Reset item dropdown
  const itemSel = $('#ir-item-sel');
  if (itemSel) itemSel.innerHTML = '<option value="">&#8212; Select Item &#8212;</option>';
  _irRenderPreview();
  showToast('Form reset', 'info');
}

async function _irSave() {
  const rmode = $('#ir-rmode')?.value;
  const rdate = $('#ir-rdate')?.value;
  if (!$('#ir-div')?.value) return showToast('Division is required', 'error');
  if (!rmode) return showToast('Return Mode is required', 'error');
  if (!rdate) return showToast('Return Date is required', 'error');
  if (rmode === 'Hand' && !$('#ir-pname')?.value?.trim()) return showToast('Person Name is required', 'error');
  if (rmode === 'Courier' && !$('#ir-courier')?.value) return showToast('Courier Name is required', 'error');
  if (rmode === 'Courier' && !$('#ir-trackid')?.value?.trim()) return showToast('Track Id is required', 'error');
  if (!_irLines.length) return showToast('Add at least one return item', 'error');

  const body = {
    ReturnMode: rmode,
    PersonName: rmode === 'Hand' ? ($('#ir-pname')?.value?.trim() || null) : null,
    CourierName: rmode === 'Courier' ? ($('#ir-courier')?.selectedOptions[0]?.text || null) : null,
    ReturnDate: rdate,
    ReturnDocNo: rmode === 'Courier' ? ($('#ir-trackid')?.value?.trim() || null) : null,
    items: _irLines.map(l => ({
      ItemId: l.ItemId, ReturnQty: l.ReturnQty, ItemFlag: l.ItemFlag,
      Reason: l.Reason || null, Remark: l.Remark || null
    }))
  };
  try {
    const res = await api('/api/issue-returns', { method: 'POST', body });
    showToast(`Issue Return #${res.ReturnId} saved! Stock restored.`, 'success');
    _irReset();
  } catch (e) { showToast('Save failed: ' + e.message, 'error'); }
}



// ======== ORDER ITEMS (Full-Featured) ========

let _ordDivs = [], _ordVendors = [], _ordCats = [], _ordItems = [];

registerPage('orders', () => {
  return `${pageHeader('Order Items', 'fa-file-invoice', 'Transactions / Order Items',
    `<button class="btn btn-primary" id="btn-add-order"><i class="fas fa-plus"></i> Add New Order</button>`)}

  <!-- â”€â”€ Smart Suggestions Banner â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ -->
  <div id="ord-suggest-wrap" style="margin-bottom:16px">
    <div style="display:flex;align-items:center;justify-content:space-between;
                background:linear-gradient(135deg,rgba(168,85,247,.08),rgba(99,102,241,.08));
                border:1px solid rgba(168,85,247,.25);border-radius:12px;
                padding:12px 18px;cursor:pointer;user-select:none"
         onclick="window._ordToggleSuggestions()">
      <div style="display:flex;align-items:center;gap:10px">
        <span style="font-size:18px">&#129302;</span>
        <div>
          <div style="font-weight:700;color:var(--text-primary);font-size:13.5px">
            Smart Order Suggestions
            <span id="ord-sugg-badge" style="display:none;margin-left:8px;padding:2px 8px;
              background:rgba(220,38,38,.15);color:#f87171;border-radius:10px;font-size:11px;font-weight:600"></span>
          </div>
          <div style="font-size:11.5px;color:var(--text-muted);margin-top:1px">
            AI-powered reorder reminders based on your order history
          </div>
        </div>
      </div>
      <div style="display:flex;align-items:center;gap:8px">
        <span id="ord-sugg-loading" style="font-size:11px;color:var(--text-muted)"></span>
        <i id="ord-sugg-chevron" class="fas fa-chevron-down"
           style="color:var(--accent);transition:transform .25s"></i>
      </div>
    </div>
    <!-- Cards area -->
    <div id="ord-suggest-cards"
         style="display:none;margin-top:10px;display:none">
    </div>
  </div>

  <div class="card">
    <div class="search-bar">
      <div class="search-input-wrap"><i class="fas fa-search"></i>
        <input type="text" id="ord-search" placeholder="Search order number, vendor, category...">
      </div>
    </div>
    <div class="table-wrapper">
      <table id="tbl-ord-main">
        <thead><tr>
          <th style="width:42px;text-align:center">
            <input type="checkbox" id="ord-select-all"
              style="width:16px;height:16px;cursor:pointer;accent-color:var(--accent)">
          </th>
          <th style="width:140px">Order Number</th>
          <th style="width:160px">Category</th>
          <th style="width:120px">Division</th>
          <th>Items (ID &#183; Name &#8211; Qty - Rate)</th>
          <th style="width:80px;text-align:center">Actions</th>
        </tr></thead>
        <tbody id="tbl-ord-body">
          <tr class="empty-row"><td colspan="6"><div class="spinner" style="margin:0 auto"></div></td></tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- Bulk bar -->
  <div id="ord-bulk-bar" style="display:none;position:fixed;bottom:28px;left:50%;transform:translateX(-50%);
    background:var(--bg-card);border:1px solid var(--accent);border-radius:12px;padding:12px 24px;
    z-index:500;box-shadow:0 8px 32px rgba(0,0,0,.5);align-items:center;gap:16px;min-width:380px">
    <span id="ord-sel-count" style="color:var(--accent);font-weight:600;font-size:14px"></span>
    <div style="flex:1"></div>
    <button class="btn btn-success" id="btn-ord-bulk-export"><i class="fas fa-file-excel"></i> Export XLSX</button>
    <button class="btn btn-danger"  id="btn-ord-bulk-delete"><i class="fas fa-trash"></i> Delete Selected</button>
    <button class="btn btn-secondary btn-sm" id="btn-ord-bulk-cancel"><i class="fas fa-xmark"></i></button>
  </div>
  </div>`;
});

window._pageBinders['orders'] = async () => {
  try {
    [_ordDivs, _ordVendors] = await Promise.all([
      api('/api/divisions?active=1'), api('/api/vendors?activeOnly=1')
    ]);
    _ordCats = []; _ordItems = [];
  } catch (_) { }
  await loadOrders();
  // Load suggestions in background
  _ordLoadSuggestions();
  $('#ord-search').oninput = () => {
    const q = ($('#ord-search')?.value || '').toLowerCase();
    $$('#tbl-ord-body tr:not(.empty-row)').forEach(tr => {
      tr.style.display = !q || tr.textContent.toLowerCase().includes(q) ? '' : 'none';
    });
  };
  $('#ord-select-all').onchange = e => {
    $$('.ord-row-chk').forEach(c => { c.checked = e.target.checked; }); updateOrdBulkBar();
  };
  $('#btn-add-order').onclick = () => showAddOrderModal();
  $('#btn-ord-bulk-cancel').onclick = () => {
    $$('.ord-row-chk').forEach(c => c.checked = false);
    $('#ord-select-all').checked = false; updateOrdBulkBar();
  };
  $('#btn-ord-bulk-export').onclick = () => bulkExportOrders();
  $('#btn-ord-bulk-delete').onclick = () => bulkDeleteOrders();
};

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   SMART ORDER SUGGESTIONS
   â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   Pattern-based reorder reminders derived from dbo.Order + dbo.OrderItem
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
let _ordSuggestionsOpen = false;

async function _ordLoadSuggestions() {
  const loadEl = $('#ord-sugg-loading');
  if (loadEl) loadEl.textContent = 'Analysing historyâ€¦';
  try {
    const data = await api('/api/orders/suggestions');
    if (loadEl) loadEl.textContent = '';
    const badge = $('#ord-sugg-badge');
    if (badge && data.length) {
      badge.textContent = `${data.length} item${data.length > 1 ? 's' : ''} due`;
      badge.style.display = 'inline';
    }
    _ordRenderSuggestions(data);
  } catch (e) {
    if (loadEl) loadEl.textContent = 'Could not load suggestions';
  }
}

window._ordToggleSuggestions = () => {
  const cards = $('#ord-suggest-cards');
  const chevron = $('#ord-sugg-chevron');
  if (!cards) return;
  _ordSuggestionsOpen = !_ordSuggestionsOpen;
  cards.style.display = _ordSuggestionsOpen ? 'block' : 'none';
  if (chevron) chevron.style.transform = _ordSuggestionsOpen ? 'rotate(180deg)' : 'rotate(0deg)';
};

function _ordRenderSuggestions(data) {
  const wrap = $('#ord-suggest-cards');
  if (!wrap) return;
  if (!data.length) {
    wrap.innerHTML = `
      <div style="padding:20px;text-align:center;color:var(--text-muted);font-size:13px;
                  background:var(--bg-card);border-radius:10px;border:1px solid var(--border)">
        <i class="fas fa-circle-check" style="color:#22c55e;margin-right:6px"></i>
        All items are on track â€” no reorders due right now.
      </div>`;
    return;
  }

  wrap.innerHTML = `
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(290px,1fr));gap:12px">
      ${data.map((s, idx) => {
        const overdue = Number(s.DaysOverdue);
        const isUrgent = overdue >= 0;
        const isApproaching = overdue < 0 && overdue >= -7;
        const badgeColor = isUrgent
          ? 'background:rgba(220,38,38,.15);color:#f87171'
          : 'background:rgba(251,146,60,.12);color:#fb923c';
        const badgeText = isUrgent
          ? (overdue === 0 ? 'Due today' : `${overdue}d overdue`)
          : `Due in ${Math.abs(overdue)}d`;
        const lastDate = s.LastOrderDate
          ? new Date(s.LastOrderDate).toLocaleDateString('en-IN')
          : 'â€”';
        return `
        <div style="background:var(--bg-card);border:1px solid ${isUrgent ? 'rgba(220,38,38,.3)' : 'rgba(168,85,247,.2)'};
                    border-radius:12px;padding:16px;position:relative;overflow:hidden;
                    transition:transform .15s,box-shadow .15s"
             onmouseover="this.style.transform='translateY(-2px)';this.style.boxShadow='0 8px 24px rgba(0,0,0,.2)'"
             onmouseout="this.style.transform='';this.style.boxShadow=''">
          <!-- Accent strip -->
          <div style="position:absolute;top:0;left:0;width:4px;height:100%;
                      background:${isUrgent ? '#ef4444' : '#a855f7'};border-radius:3px 0 0 3px"></div>
          <div style="padding-left:8px">
            <!-- Header row -->
            <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px">
              <div style="font-weight:700;font-size:13px;color:var(--text-primary);line-height:1.3"
                   title="Item ID: ${s.ItemId}">${s.ItemName}</div>
              <span style="${badgeColor};padding:2px 8px;border-radius:10px;
                            font-size:10.5px;font-weight:600;white-space:nowrap;margin-left:8px">${badgeText}</span>
            </div>
            <!-- Stats grid -->
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:12px">
              <div style="background:var(--bg-dark);border-radius:6px;padding:7px 10px">
                <div style="font-size:10px;color:var(--text-muted);margin-bottom:2px">Suggested Qty</div>
                <div style="font-size:16px;font-weight:700;color:var(--accent)">${s.SuggestedQty}</div>
              </div>
              <div style="background:var(--bg-dark);border-radius:6px;padding:7px 10px">
                <div style="font-size:10px;color:var(--text-muted);margin-bottom:2px">Avg Cycle</div>
                <div style="font-size:16px;font-weight:700;color:#a78bfa">${s.AvgGapDays}d</div>
              </div>
            </div>
            <!-- Vendor row -->
            <div style="font-size:11.5px;color:var(--text-secondary);margin-bottom:4px">
              <i class="fas fa-truck" style="color:var(--text-muted);margin-right:5px"></i>
              ${s.VendorName || '<em style="color:var(--text-muted)">No vendor data</em>'}
            </div>
            <!-- Last order row -->
            <div style="font-size:11px;color:var(--text-muted);margin-bottom:12px">
              <i class="fas fa-clock" style="margin-right:4px"></i>
              Last ordered: ${lastDate}
              &nbsp;&bull;&nbsp; ${s.TotalOrders} order${s.TotalOrders > 1 ? 's' : ''} on record
            </div>
            <!-- CTA button -->
            <button onclick="window._ordSuggestionQuickOrder(${JSON.stringify(s).replace(/"/g, '&quot;')})"
              style="width:100%;padding:8px;border:none;border-radius:8px;
                     background:${isUrgent ? 'rgba(239,68,68,.15)' : 'rgba(168,85,247,.15)'};
                     color:${isUrgent ? '#f87171' : '#c084fc'};
                     font-size:12.5px;font-weight:600;cursor:pointer;transition:background .15s"
              onmouseover="this.style.background='${isUrgent ? 'rgba(239,68,68,.28)' : 'rgba(168,85,247,.28)'}'" 
              onmouseout="this.style.background='${isUrgent ? 'rgba(239,68,68,.15)' : 'rgba(168,85,247,.15)'}'">
              <i class="fas fa-cart-plus" style="margin-right:6px"></i>Order Now
            </button>
          </div>
        </div>`;
      }).join('')}
    </div>`;
}

/* Quick Order modal â€” opens pre-filled from a suggestion card */
window._ordSuggestionQuickOrder = (s) => {
  // If s came as HTML-encoded JSON string, decode it
  if (typeof s === 'string') { try { s = JSON.parse(s); } catch (_) { return; } }

  const ov = document.createElement('div');
  ov.className = 'modal-overlay';
  // Build vendor options
  const vendorOpts = _ordVendors.map(v =>
    `<option value="${v.vendorid || v.VendorID}" ${(v.vendorid || v.VendorID) == s.VendorId ? 'selected' : ''}>
       ${v.Name}${v.CompanyName ? ' (' + v.CompanyName + ')' : ''}
     </option>`).join('');
  // Build division options
  const divOpts = _ordDivs.map(d =>
    `<option value="${d.DivisionId || d.DivisionID}">${d.DivisionName}</option>`).join('');

  ov.innerHTML = `
    <div class="modal" style="max-width:480px;animation:slideUp .2s ease">
      <div class="modal-header" style="background:linear-gradient(135deg,rgba(168,85,247,.12),rgba(99,102,241,.12))">
        <h3 style="display:flex;align-items:center;gap:10px">
          <span style="font-size:20px">&#129302;</span>
          Quick Order from Suggestion
        </h3>
        <button class="btn-close-modal" onclick="this.closest('.modal-overlay').remove()">
          <i class="fas fa-xmark"></i>
        </button>
      </div>
      <div class="modal-body">
        <!-- AI Insight ribbon -->
        <div style="background:rgba(168,85,247,.08);border:1px solid rgba(168,85,247,.2);
                    border-radius:8px;padding:10px 14px;margin-bottom:18px;font-size:12px;
                    color:var(--text-secondary);line-height:1.6">
          <i class="fas fa-brain" style="color:#a855f7;margin-right:6px"></i>
          <strong style="color:var(--text-primary)">${s.ItemName}</strong> is ordered approximately
          every <strong>${s.AvgGapDays} days</strong>. Based on ${s.TotalOrders} historical orders,
          the suggested quantity is <strong>${s.SuggestedQty} units</strong>.
          ${Number(s.DaysOverdue) >= 0
            ? `<span style="color:#f87171"> This item is <strong>${s.DaysOverdue === 0 ? 'due today' : s.DaysOverdue + ' days overdue'}</strong>.</span>`
            : `<span style="color:#fb923c"> Due in <strong>${Math.abs(Number(s.DaysOverdue))} days</strong>.</span>`
          }
        </div>
        <div class="form-row cols-2" style="gap:12px;margin-bottom:14px">
          <div class="form-field">
            <label>Division</label>
            <select id="qo-div" style="background:var(--bg-dark);border:1px solid var(--border);
              border-radius:6px;padding:8px 12px;color:var(--text-primary);width:100%;font-size:13px">
              <option value="">â€” Select â€”</option>${divOpts}
            </select>
          </div>
          <div class="form-field">
            <label>Vendor</label>
            <select id="qo-vendor" style="background:var(--bg-dark);border:1px solid var(--border);
              border-radius:6px;padding:8px 12px;color:var(--text-primary);width:100%;font-size:13px">
              <option value="">â€” Select â€”</option>${vendorOpts}
            </select>
          </div>
        </div>
        <div class="form-row cols-2" style="gap:12px;margin-bottom:14px">
          <div class="form-field">
            <label>Item</label>
            <input type="text" value="${s.ItemName}" readonly
              style="background:var(--bg-dark);border:1px solid var(--border);border-radius:6px;
                     padding:8px 12px;color:var(--text-muted);width:100%;font-size:13px;cursor:not-allowed"/>
            <input type="hidden" id="qo-itemid" value="${s.ItemId}"/>
          </div>
          <div class="form-field">
            <label>Quantity <span style="color:var(--text-muted);font-size:10.5px">(suggested: ${s.SuggestedQty})</span></label>
            <input type="number" id="qo-qty" value="${s.SuggestedQty}" min="1"
              style="background:var(--bg-dark);border:1px solid var(--border);border-radius:6px;
                     padding:8px 12px;color:var(--text-primary);width:100%;font-size:13px"/>
          </div>
        </div>
        <div class="form-row cols-2" style="gap:12px">
          <div class="form-field">
            <label>Rate (â‚¹) <span style="color:var(--text-muted);font-size:10.5px">(optional)</span></label>
            <input type="number" id="qo-rate" value="0" min="0" step="0.01"
              style="background:var(--bg-dark);border:1px solid var(--border);border-radius:6px;
                     padding:8px 12px;color:var(--text-primary);width:100%;font-size:13px"/>
          </div>
          <div class="form-field">
            <label>Order Date</label>
            <input type="date" id="qo-date" value="${new Date().toISOString().split('T')[0]}"
              style="background:var(--bg-dark);border:1px solid var(--border);border-radius:6px;
                     padding:8px 12px;color:var(--text-primary);width:100%;font-size:13px"/>
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
        <button class="btn btn-primary" id="btn-qo-place">
          <i class="fas fa-paper-plane"></i> Place Order
        </button>
      </div>
    </div>`;

  document.body.appendChild(ov);
  ov.onclick = e => { if (e.target === ov) ov.remove(); };

  document.getElementById('btn-qo-place').onclick = async () => {
    const divId = document.getElementById('qo-div').value;
    const vendId = document.getElementById('qo-vendor').value;
    const qty   = parseInt(document.getElementById('qo-qty').value) || 0;
    const rate  = parseFloat(document.getElementById('qo-rate').value) || 0;
    const odate = document.getElementById('qo-date').value;
    const itemId = document.getElementById('qo-itemid').value;

    if (!divId)  return showToast('Please select a Division', 'error');
    if (!vendId) return showToast('Please select a Vendor', 'error');
    if (qty < 1) return showToast('Quantity must be at least 1', 'error');

    const btn = document.getElementById('btn-qo-place');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Placingâ€¦';

    // Auto-generate order number
    const now = new Date();
    const pad = n => String(n).padStart(2,'0');
    const onum = `ORD-${now.getFullYear()}${pad(now.getMonth()+1)}${pad(now.getDate())}-${Math.floor(Math.random()*900+100)}`;

    try {
      await api('/api/orders', {
        method: 'POST',
        body: {
          OrderNumber: onum,
          OrderDate:   odate,
          Vendorid:    vendId,
          DivisionId:  divId,
          items: [{ ItemId: itemId, CategoryId: null, TotalQty: qty, Rate: rate }]
        }
      });
      ov.remove();
      showToast(`Order ${onum} placed successfully!`, 'success');
      await loadOrders(); // refresh the table
    } catch (e) {
      showToast('Failed: ' + e.message, 'error');
    } finally {
      btn.disabled = false;
      btn.innerHTML = '<i class="fas fa-paper-plane"></i> Place Order';
    }
  };
};

function syncOrdSelectAll() {
  const all = $$('.ord-row-chk'), checked = all.filter(c => c.checked);
  const sa = $('#ord-select-all'); if (!sa) return;
  sa.checked = all.length > 0 && checked.length === all.length;
  sa.indeterminate = checked.length > 0 && checked.length < all.length;
}
function updateOrdBulkBar() {
  const checked = $$('.ord-row-chk:checked');
  const bar = $('#ord-bulk-bar'); if (!bar) return;
  if (checked.length > 0) {
    bar.style.display = 'flex';
    $('#ord-sel-count').textContent = `${checked.length} order${checked.length > 1 ? 's' : ''} selected`;
  } else { bar.style.display = 'none'; }
}

async function loadOrders() {
  const tbody = $('#tbl-ord-body'); if (!tbody) return;
  tbody.innerHTML = `<tr class="empty-row"><td colspan="6"><div class="spinner" style="margin:0 auto"></div></td></tr>`;
  let data;
  try { data = await api('/api/orders'); }
  catch (e) {
    tbody.innerHTML = `<tr class="empty-row"><td colspan="6" style="color:var(--danger)">
      <i class="fas fa-circle-xmark"></i> Failed: ${e.message}</td></tr>`;
    return;
  }
  if (!data.length) { tbody.innerHTML = `<tr class="empty-row"><td colspan="6">No orders found.</td></tr>`; return; }

  tbody.innerHTML = data.map(d => {
    const items = d.Items || [];
    // Unique categories as pills
    const cats = [...new Map(items.filter(it => it.CategoryName).map(it => [it.CategoryId, it.CategoryName])).values()];
    const catPills = cats.map(c =>
      `<span style="display:inline-block;padding:2px 8px;background:rgba(168,85,247,.15);
        color:#c084fc;border-radius:10px;font-size:11px;margin:1px">${c}</span>`).join('');
    // Item pills: (ItemId) ItemName â€“ Qty
    const itemPills = items.map(it =>
      `<span style="display:inline-block;padding:3px 9px;background:rgba(99,102,241,.12);
        color:#818cf8;border-radius:10px;font-size:11px;margin:1px;white-space:nowrap">
        (${it.ItemId}) ${it.ItemName || '?'} &ndash; ${it.TotalQty}</span>`).join('');
    return `
    <tr data-id="${d.OrderID}" class="ord-row">
      <td style="text-align:center">
        <input type="checkbox" class="ord-row-chk" data-id="${d.OrderID}"
          style="width:16px;height:16px;cursor:pointer;accent-color:var(--accent)">
      </td>
      <td>
        <span class="ord-edit-cell" data-id="${d.OrderID}"
          style="cursor:pointer;text-decoration:underline dotted;text-underline-offset:3px;font-weight:600"
          title="Click to edit">${d.OrderNumber || '&mdash;'}</span>
      </td>
      <td>${catPills || '<span style="color:var(--text-muted);font-size:12px">&mdash;</span>'}</td>
      <td>
        ${d.DivisionName
        ? `<span style="display:inline-block;padding:3px 10px;background:rgba(234,179,8,.12);
              color:#fbbf24;border-radius:10px;font-size:12px">${d.DivisionName}</span>`
        : '<span style="color:var(--text-muted);font-size:12px">&mdash;</span>'}
      </td>
      <td>${itemPills || '<span style="color:var(--text-muted);font-size:12px">No items</span>'}</td>
      <td style="text-align:center">
        <button class="btn btn-danger btn-sm" onclick="deleteOrder(${d.OrderID})" title="Delete">
          <i class="fas fa-trash"></i></button>
      </td>
    </tr>`;
  }).join('');

  $$('.ord-row-chk').forEach(chk => {
    chk.onchange = () => { updateOrdBulkBar(); syncOrdSelectAll(); };
  });
  $$('.ord-edit-cell').forEach(cell => {
    cell.onclick = () => {
      const row = data.find(d => d.OrderID === parseInt(cell.dataset.id));
      if (row) showEditOrderModal(row);
    };
  });
}

/* ---- inline helpers ---- */
function _ordIS() {
  return `style="background:var(--bg-dark);border:1px solid var(--border);border-radius:6px;
          padding:8px 12px;color:var(--text-primary);width:100%;font-size:13.5px"`;
}
function _ordSS() {
  return `style="background:var(--bg-dark);border:1px solid var(--border);border-radius:6px;
          padding:8px 12px;color:var(--text-primary);width:100%;font-size:13.5px;cursor:pointer"`;
}
function _ordDivOpts(sel = '') {
  return `<option value="">&#8212; Select Division &#8212;</option>` +
    _ordDivs.map(d => `<option value="${d.DivisionId || d.DivisionID}" ${(d.DivisionId || d.DivisionID) == sel ? 'selected' : ''}>${d.DivisionName}</option>`).join('');
}
function _ordVendorOpts(sel = '') {
  return `<option value="">&#8212; Select Vendor &#8212;</option>` +
    _ordVendors.map(v => `<option value="${v.vendorid || v.VendorID}" ${(v.vendorid || v.VendorID) == sel ? 'selected' : ''}>${v.Name || v.VendorName}</option>`).join('');
}
function _ordCatOpts(sel = '', cats) {
  const pool = cats || _ordCats;
  return `<option value="">&mdash; Category &mdash;</option>` +
    pool.map(c => `<option value="${c.CategoryId}" ${c.CategoryId == sel ? 'selected' : ''}>${c.CategoryName}</option>`).join('');
}
function _ordItemOpts(sel = '', catId = '', items) {
  const pool = (items || _ordItems).filter(i => !catId || String(i.CategoryId) === String(catId));
  if (!pool.length && catId)
    return `<option value="">&mdash; No items for this category &mdash;</option>`;
  return `<option value="">&mdash; Item &mdash;</option>` +
    pool.map(i => `<option value="${i.Itemid || i.itemid || i.ItemId}" ${(i.Itemid || i.itemid || i.ItemId) == sel ? 'selected' : ''}>${i.ItemName}</option>`).join('');
}

function _buildOrdItemRow(line, idx, cats, items) {
  const ss = _ordSS(), si = _ordIS();
  const qty = line.TotalQty || 1;
  return `
    <tr data-ord-row="${idx}">
      <td style="padding:4px 6px"><select class="ord-line-cat" data-i="${idx}" ${ss}>${_ordCatOpts(line.CategoryId, cats)}</select></td>
      <td style="padding:4px 6px"><select class="ord-line-item" data-i="${idx}" ${ss}>${_ordItemOpts(line.ItemId, line.CategoryId, items)}</select></td>
      <td style="padding:4px 6px"><input type="number" class="ord-line-qty" data-i="${idx}"
        value="${qty}" min="1" step="1" ${si} style="width:80px"/></td>
      <td style="padding:4px 6px;text-align:center">
        <button class="btn btn-danger btn-icon btn-sm ord-line-remove" data-i="${idx}" title="Remove">
          <i class="fas fa-minus"></i></button>
      </td>
    </tr>`;
}

function _bindOrdLineEvents(ov, lines, cats, items) {
  $$('.ord-line-qty', ov).forEach(inp => {
    inp.oninput = () => {
      const i = +inp.dataset.i;
      if (inp.classList.contains('ord-line-qty')) lines[i].TotalQty = parseInt(inp.value) || 0;
    };
  });
  $$('.ord-line-cat', ov).forEach(s => {
    s.onchange = () => {
      const i = +s.dataset.i;
      lines[i].CategoryId = s.value;
      lines[i].ItemId = '';
      const itemSel = ov.querySelector(`.ord-line-item[data-i="${i}"]`);
      if (itemSel) {
        itemSel.innerHTML = _ordItemOpts('', s.value, items);
        itemSel.onchange = () => { lines[i].ItemId = itemSel.value; };
      }
    };
  });
  $$('.ord-line-item', ov).forEach(s => {
    s.onchange = () => { lines[+s.dataset.i].ItemId = s.value; };
  });
  $$('.ord-line-remove', ov).forEach(btn => {
    btn.onclick = () => {
      const i = +btn.dataset.i;
      if (lines.length <= 1) return showToast('Minimum 1 item required', 'error');
      lines.splice(i, 1);
      _renderOrdLines(ov, lines, cats, items);
    };
  });
}

function _renderOrdLines(ov, lines, cats, items) {
  const tbody = ov.querySelector('#ord-lines-body');
  if (!tbody) return;
  tbody.innerHTML = lines.map((l, i) => _buildOrdItemRow(l, i, cats, items)).join('');
  _bindOrdLineEvents(ov, lines, cats, items);
}

function _ordModalHeader(title, orderNum = '', divSel = '', vendorSel = '', dateSel = '', numReadonly = false) {
  const ss = _ordSS(), si = _ordIS();
  const today = new Date().toISOString().split('T')[0];
  return `
    <div class="form-row cols-2" style="gap:12px;margin-bottom:12px">
      <div class="form-field"><label>Division <span style="color:var(--danger)">*</span></label>
        <select id="ord-f-div" ${ss}>${_ordDivOpts(divSel)}</select></div>
      <div class="form-field"><label>Order Number ${numReadonly ? '<span style="color:var(--text-muted);font-size:11px">(not editable)</span>' : ''}</label>
        <input type="text" id="ord-f-num" value="${orderNum}" ${numReadonly ? 'readonly style="background:var(--bg-dark);border:1px dashed var(--border);border-radius:6px;padding:8px 12px;color:var(--text-muted);width:100%;cursor:not-allowed;opacity:0.65;font-style:italic"' : si}/></div>
    </div>
    <div class="form-row cols-2" style="gap:12px;margin-bottom:16px">
      <div class="form-field"><label>Order Date</label>
        <input type="date" id="ord-f-date" value="${dateSel || today}" ${si}/></div>
      <div class="form-field"><label>Vendor <span style="color:var(--danger)">*</span></label>
        <select id="ord-f-vendor" ${ss}>${_ordVendorOpts(vendorSel)}</select></div>
    </div>
    <div style="border-top:1px solid var(--border);padding-top:14px;margin-bottom:10px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
        <span style="font-weight:600;color:var(--text-primary);font-size:14px">
          <i class="fas fa-boxes-stacked" style="color:var(--accent);margin-right:6px"></i>Items in this Order
        </span>
        <button class="btn btn-secondary btn-sm" id="btn-add-ord-line" type="button">
          <i class="fas fa-plus"></i> Add Item Row</button>
      </div>
      <div style="overflow-x:auto;max-height:260px;overflow-y:auto">
        <table style="width:100%;border-collapse:collapse;min-width:580px">
          <thead>
            <tr style="background:var(--bg-dark)">
              <th style="padding:6px 8px;font-size:12px;text-align:left;width:170px">Category</th>
              <th style="padding:6px 8px;font-size:12px;text-align:left">Item</th>
              <th style="padding:6px 8px;font-size:12px;text-align:left;width:90px">Qty</th>
              <th style="width:40px"></th>
            </tr>
          </thead>
          <tbody id="ord-lines-body"></tbody>
        </table>
      </div>
    </div>`;
}

async function showAddOrderModal() {
  let ordModalItems = [], ordModalCats = [];
  const lines = [{ CategoryId: '', ItemId: '', TotalQty: 1 }];
  const ov = document.createElement('div');
  ov.className = 'modal-overlay';
  ov.innerHTML = `
    <div class="modal" style="max-width:700px;animation:slideUp 0.2s ease">
      <div class="modal-header">
        <h3><i class="fas fa-plus-circle"></i> Add New Order</h3>
        <button class="btn-close-modal" onclick="this.closest('.modal-overlay').remove()">
          <i class="fas fa-xmark"></i></button>
      </div>
      <div class="modal-body" style="max-height:72vh;overflow-y:auto">
        ${_ordModalHeader('Add New Order')}
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
        <button class="btn btn-primary" id="btn-ord-add-save">
          <i class="fas fa-file-invoice"></i> Place Order</button>
      </div>
    </div>`;
  document.body.appendChild(ov);
  ov.onclick = e => { if (e.target === ov) ov.remove(); };

  // helper: fetch filtered items when div+vendor change
  async function refreshOrdItems() {
    const divId = ov.querySelector('#ord-f-div')?.value || '';
    const vendorId = ov.querySelector('#ord-f-vendor')?.value || '';
    if (!divId || !vendorId) {
      ordModalItems = []; ordModalCats = [];
      _renderOrdLines(ov, lines, ordModalCats, ordModalItems);
      return;
    }
    try {
      const data = await api(`/api/orders/items-by-div-vendor?divisionId=${divId}&vendorId=${vendorId}`);
      ordModalItems = data;
      // Derive unique categories from the fetched items
      const catMap = new Map();
      data.forEach(i => { if (i.CategoryId && !catMap.has(i.CategoryId)) catMap.set(i.CategoryId, { CategoryId: i.CategoryId, CategoryName: i.CategoryName }); });
      ordModalCats = [...catMap.values()];
      // Reset lines when selection changes
      lines.length = 0; lines.push({ CategoryId: '', ItemId: '', TotalQty: 1 });
    } catch (e) { showToast('Failed to load items: ' + e.message, 'error'); }
    _renderOrdLines(ov, lines, ordModalCats, ordModalItems);
  }

  ov.querySelector('#ord-f-div').onchange = refreshOrdItems;
  ov.querySelector('#ord-f-vendor').onchange = refreshOrdItems;

  _renderOrdLines(ov, lines, ordModalCats, ordModalItems);
  ov.querySelector('#btn-add-ord-line').onclick = () => {
    lines.push({ CategoryId: '', ItemId: '', TotalQty: 1 });
    _renderOrdLines(ov, lines, ordModalCats, ordModalItems);
  };
  ov.querySelector('#btn-ord-add-save').onclick = async () => {
    const b = {
      DivisionId: ov.querySelector('#ord-f-div').value,
      OrderNumber: ov.querySelector('#ord-f-num').value.trim(),
      OrderDate: ov.querySelector('#ord-f-date').value,
      Vendorid: ov.querySelector('#ord-f-vendor').value,
      items: lines.map(l => ({
        CategoryId: l.CategoryId || null, ItemId: l.ItemId || null,
        TotalQty: parseInt(l.TotalQty) || 0, Rate: 0, TotalAmt: 0
      }))
    };
    if (!b.DivisionId) return showToast('Division is required', 'error');
    if (!b.Vendorid) return showToast('Vendor is required', 'error');
    const incompleteLines = b.items.filter(i => !i.CategoryId || !i.ItemId || !(parseInt(i.TotalQty) > 0));
    if (b.items.length === 0 || incompleteLines.length === b.items.length)
      return showToast('Add at least one item with Category, Item and Qty filled', 'error');
    if (incompleteLines.length > 0)
      return showToast('Every item row must have Category, Item and Qty selected', 'error');
    try {
      await api('/api/orders', { method: 'POST', body: b });
      ov.remove(); showToast('Order placed!', 'success'); await loadOrders();
    } catch (e) { showToast(e.message, 'error'); }
  };
}

function showEditOrderModal(rec) {
  const existing = $('#ord-edit-modal'); if (existing) existing.remove();
  let ordModalItems = [], ordModalCats = [];
  const lines = (rec.Items || []).length
    ? rec.Items.map(it => ({ ...it, TotalQty: it.TotalQty || 1 }))
    : [{ CategoryId: '', ItemId: '', TotalQty: 1 }];

  const dateStr = rec.OrderDate ? new Date(rec.OrderDate).toISOString().split('T')[0] : '';
  const ov = document.createElement('div');
  ov.className = 'modal-overlay'; ov.id = 'ord-edit-modal';
  ov.innerHTML = `
    <div class="modal" style="max-width:700px;animation:slideUp 0.2s ease">
      <div class="modal-header">
        <h3><i class="fas fa-pen-to-square"></i> Edit Order &mdash; ${rec.OrderNumber || '#' + rec.OrderID}</h3>
        <button class="btn-close-modal" onclick="document.getElementById('ord-edit-modal').remove()">
          <i class="fas fa-xmark"></i></button>
      </div>
      <div class="modal-body" style="max-height:72vh;overflow-y:auto">
        ${_ordModalHeader('', rec.OrderNumber || '', rec.DivisionId, rec.VendorId, dateStr, true)}
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="document.getElementById('ord-edit-modal').remove()">Cancel</button>
        <button class="btn btn-primary" id="btn-ord-edit-save">
          <i class="fas fa-floppy-disk"></i> Save Order</button>
      </div>
    </div>`;
  document.body.appendChild(ov);
  ov.onclick = e => { if (e.target === ov) ov.remove(); };

  // helper: fetch filtered items when div+vendor change
  async function refreshOrdItems() {
    const divId = ov.querySelector('#ord-f-div')?.value || '';
    const vendorId = ov.querySelector('#ord-f-vendor')?.value || '';
    if (!divId || !vendorId) {
      ordModalItems = []; ordModalCats = [];
      _renderOrdLines(ov, lines, ordModalCats, ordModalItems);
      return;
    }
    try {
      const data = await api(`/api/orders/items-by-div-vendor?divisionId=${divId}&vendorId=${vendorId}`);
      ordModalItems = data;
      const catMap = new Map();
      data.forEach(i => { if (i.CategoryId && !catMap.has(i.CategoryId)) catMap.set(i.CategoryId, { CategoryId: i.CategoryId, CategoryName: i.CategoryName }); });
      ordModalCats = [...catMap.values()];
    } catch (e) { showToast('Failed to load items: ' + e.message, 'error'); }
    _renderOrdLines(ov, lines, ordModalCats, ordModalItems);
  }

  // Pre-load items if existing div+vendor are already set
  ov.querySelector('#ord-f-div').onchange = refreshOrdItems;
  ov.querySelector('#ord-f-vendor').onchange = refreshOrdItems;
  if (rec.DivisionId && rec.VendorId) refreshOrdItems();
  else _renderOrdLines(ov, lines, ordModalCats, ordModalItems);

  ov.querySelector('#btn-add-ord-line').onclick = () => {
    lines.push({ CategoryId: '', ItemId: '', TotalQty: 1 });
    _renderOrdLines(ov, lines, ordModalCats, ordModalItems);
  };
  ov.querySelector('#btn-ord-edit-save').onclick = async () => {
    const b = {
      DivisionId: ov.querySelector('#ord-f-div').value,
      OrderDate: ov.querySelector('#ord-f-date').value,
      Vendorid: ov.querySelector('#ord-f-vendor').value,
      items: lines.map(l => ({
        CategoryId: l.CategoryId || null, ItemId: l.ItemId || null,
        TotalQty: parseInt(l.TotalQty) || 0, Rate: 0, TotalAmt: 0
      }))
    };
    if (!b.Vendorid) return showToast('Vendor is required', 'error');
    if (b.items.every(i => !i.ItemId)) return showToast('Add at least one item', 'error');
    try {
      await api(`/api/orders/${rec.OrderID}`, { method: 'PUT', body: b });
      ov.remove(); showToast('Order updated!', 'success'); await loadOrders();
    } catch (e) { showToast(e.message, 'error'); }
  };
}

window.deleteOrder = async (id) => {
  if (!await confirm(`Delete Order #${id} and all its items? This cannot be undone.`)) return;
  try {
    await api(`/api/orders/${id}`, { method: 'DELETE' });
    showToast('Order deleted!', 'success'); await loadOrders(); updateOrdBulkBar();
  } catch (e) { showToast(e.message, 'error'); }
};

async function bulkDeleteOrders() {
  const ids = $$('.ord-row-chk:checked').map(c => parseInt(c.dataset.id));
  if (!ids.length) return;
  if (!await confirm(`Delete ${ids.length} order(s) and all their items? This cannot be undone.`)) return;
  try {
    await api('/api/orders/bulk-delete', { method: 'POST', body: { ids } });
    showToast(`${ids.length} order(s) deleted!`, 'success');
    $('#ord-select-all').checked = false; await loadOrders(); updateOrdBulkBar();
  } catch (e) { showToast(e.message, 'error'); }
}

async function bulkExportOrders() {
  const ids = $$('.ord-row-chk:checked').map(c => parseInt(c.dataset.id));
  try {
    const res = await fetch('/api/orders/export-xlsx', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      credentials: 'include', body: JSON.stringify({ ids })
    });
    if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `order_items_${new Date().toISOString().split('T')[0]}.xlsx`;
    a.click(); URL.revokeObjectURL(url);
    showToast(`Exported ${ids.length || 'all'} order(s)!`, 'success');
  } catch (e) { showToast('Export failed: ' + e.message, 'error'); }
}



// ======== PENDING PAGES ========
// ======== PURCHASE &#8211; INWARD RETURN PENDING ========

let _irpDivs = [], _irpCouriers = [], _irpSelected = null, _irpFilter = 'RP';
const _IRP_I = `style="background:var(--bg-dark);border:1px solid var(--border);border-radius:6px;padding:6px 10px;color:var(--text-primary);width:100%;font-size:13px"`;
const _IRP_S = `style="background:var(--bg-dark);border:1px solid var(--border);border-radius:6px;padding:6px 10px;color:var(--text-primary);width:100%;font-size:13px;cursor:pointer"`;
const _IRP_RO = `style="background:var(--bg-dark);border:1px dashed var(--border);border-radius:6px;padding:6px 10px;color:var(--text-muted);width:100%;font-size:13px;cursor:default"`;
const _IRP_LBL = `style="font-size:11.5px;font-weight:600;color:var(--text-muted);margin-bottom:4px;display:block"`;
const _IRP_F = `style="display:flex;flex-direction:column"`;

registerPage('inward-return-pending', () => {
  const today = new Date().toISOString().split('T')[0];
  return `
  <div style="padding:0">
    <!-- Header -->
    <div style="background:var(--bg-card);padding:20px 28px 16px;border-bottom:1px solid var(--border)">
      <h2 style="margin:0;font-size:18px;font-weight:700;color:var(--text-primary);display:flex;align-items:center;gap:10px">
        <i class="fas fa-clock-rotate-left" style="color:var(--accent)"></i>
        Purchase &#8212; Inward Return Pending
      </h2>
      <div style="font-size:12px;color:var(--text-muted);margin-top:3px">Transactions / Purchase &mdash; Inward Return Pending</div>
    </div>

    <div class="card" style="padding:20px 24px">

      <!-- Filter Row -->
      <div style="display:flex;align-items:center;flex-wrap:wrap;gap:14px;margin-bottom:18px;padding-bottom:14px;border-bottom:1px solid var(--border)">
        <div ${_IRP_F} style="min-width:200px">
          <label ${_IRP_LBL}>Division</label>
          <select id="irp-div" ${_IRP_S}><option value="">&#8212; All Divisions &#8212;</option></select>
        </div>
        <div style="display:flex;gap:8px;align-items:flex-end;padding-top:20px">
          <button id="btn-irp-rp" class="btn btn-primary btn-sm" style="min-width:160px">
            <i class="fas fa-rotate-left"></i> Return Pending Cases</button>
          <button id="btn-irp-sp" class="btn btn-secondary btn-sm" style="min-width:160px">
            <i class="fas fa-trash-can"></i> Scrap Pending Cases</button>
        </div>
        <div style="display:flex;gap:6px;align-items:flex-end;padding-top:20px;margin-left:auto">
          <input type="text" id="irp-dc-input" ${_IRP_I}
            placeholder="Enter DC No." style="width:180px"/>
          <button id="btn-irp-dc-search" class="btn btn-secondary btn-sm" style="white-space:nowrap">
            <i class="fas fa-search"></i> Search DC</button>
        </div>
      </div>

      <!-- Preview Table -->
      <div style="font-size:12px;font-weight:700;color:var(--accent);letter-spacing:1px;text-transform:uppercase;margin-bottom:10px">
        <i class="fas fa-table-list" style="margin-right:6px"></i>
        <span id="irp-table-label">Return Pending Cases</span>
      </div>
      <div style="overflow-x:auto;max-height:240px;overflow-y:auto;border:1px solid var(--border);border-radius:8px;margin-bottom:20px">
        <table style="width:100%;border-collapse:collapse;min-width:1100px;font-size:12px">
          <thead style="background:var(--bg-dark);position:sticky;top:0;z-index:2">
            <tr>
              <th style="padding:8px 10px;text-align:left">InwardReturnItemId</th>
              <th style="padding:8px 10px;text-align:left">InwardId</th>
              <th style="padding:8px 10px;text-align:left">Order No.</th>
              <th style="padding:8px 10px;text-align:left">DC Number</th>
              <th style="padding:8px 10px;text-align:left">Invoice No.</th>
              <th style="padding:8px 10px;text-align:left">Inward Date</th>
              <th style="padding:8px 10px;text-align:left">Vendor</th>
              <th style="padding:8px 10px;text-align:left">Category</th>
              <th style="padding:8px 10px;text-align:left">Item Name</th>
              <th style="padding:8px 10px;text-align:center">DC Qty</th>
              <th style="padding:8px 10px;text-align:center">Total Qty</th>
              <th style="padding:8px 10px;text-align:center">Flag</th>
              <th style="padding:8px 10px;text-align:left">Reason</th>
            </tr>
          </thead>
          <tbody id="tbl-irp-body">
            <tr class="empty-row"><td colspan="13" style="padding:20px;text-align:center;color:var(--text-muted)">
              Click a filter button or search a DC No. to load cases.</td></tr>
          </tbody>
        </table>
      </div>

      <!-- Auto-populated Detail Section -->
      <div style="font-size:12px;font-weight:700;color:var(--accent);letter-spacing:1px;text-transform:uppercase;margin-bottom:14px;padding-bottom:6px;border-bottom:1px solid var(--border)">
        <i class="fas fa-circle-info" style="margin-right:6px"></i>Selected Inward Details
        <span style="font-size:11px;color:var(--text-muted);margin-left:8px;font-weight:400;text-transform:none">(read-only &#8212; auto-populated)</span>
      </div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:16px" id="irp-detail-grid">
        <div ${_IRP_F}><label ${_IRP_LBL}>Order No.</label>
          <input type="text" id="irp-f-ordernum" readonly ${_IRP_RO}/></div>
        <div ${_IRP_F}><label ${_IRP_LBL}>DC No.</label>
          <input type="text" id="irp-f-dcnum" readonly ${_IRP_RO}/></div>
        <div ${_IRP_F}><label ${_IRP_LBL}>Invoice No.</label>
          <input type="text" id="irp-f-invnum" readonly ${_IRP_RO}/></div>
        <div ${_IRP_F}><label ${_IRP_LBL}>Inward Date</label>
          <input type="text" id="irp-f-date" readonly ${_IRP_RO}/></div>
        <div ${_IRP_F}><label ${_IRP_LBL}>Vendor Name</label>
          <input type="text" id="irp-f-vendor" readonly ${_IRP_RO}/></div>
        <div ${_IRP_F}><label ${_IRP_LBL}>Category</label>
          <input type="text" id="irp-f-cat" readonly ${_IRP_RO}/></div>
        <div ${_IRP_F}><label ${_IRP_LBL}>Item</label>
          <input type="text" id="irp-f-item" readonly ${_IRP_RO}/></div>
        <div ${_IRP_F}><label ${_IRP_LBL}>DC Qty</label>
          <input type="text" id="irp-f-dcqty" readonly ${_IRP_RO}/></div>
        <div ${_IRP_F}><label ${_IRP_LBL}>Item Qty</label>
          <input type="text" id="irp-f-qty" readonly ${_IRP_RO}/></div>
        <div ${_IRP_F}><label ${_IRP_LBL}>Item Status</label>
          <input type="text" id="irp-f-status" readonly ${_IRP_RO}/></div>
        <div ${_IRP_F}><label ${_IRP_LBL}>Reason for Return</label>
          <input type="text" id="irp-f-reason" readonly ${_IRP_RO}/></div>
      </div>

      <!-- Divider -->
      <div style="border-top:2px dashed var(--border);margin:18px 0"></div>

      <!-- Action Section -->
      <div style="font-size:12px;font-weight:700;color:var(--accent);letter-spacing:1px;text-transform:uppercase;margin-bottom:14px;padding-bottom:6px;border-bottom:1px solid var(--border)">
        <i class="fas fa-pen-to-square" style="margin-right:6px"></i>Update Resolution
      </div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:12px">
        <div ${_IRP_F}><label ${_IRP_LBL}>Update Status As <span style="color:var(--danger)">*</span></label>
          <select id="irp-update-stat" ${_IRP_S}>
            <option value="">&#8212; Select &#8212;</option>
            <option value="Complete">Complete</option>
            <option value="Return Complete">Return Complete</option>
          </select></div>
        <div ${_IRP_F}><label ${_IRP_LBL}>Return Mode <span style="color:var(--danger)" id="irp-rmode-star">*</span></label>
          <select id="irp-rmode" ${_IRP_S} disabled style="opacity:.45">
            <option value="">&#8212; Select &#8212;</option>
            <option value="Hand">Hand</option>
            <option value="Courier">Courier</option>
          </select></div>
        <div ${_IRP_F}><label ${_IRP_LBL}>Person Name <span style="color:var(--danger)" id="irp-pname-star">*</span></label>
          <input type="text" id="irp-pname" ${_IRP_I} disabled style="opacity:.45"/></div>
      </div>
      <div style="font-size:12px;font-weight:600;color:var(--text-muted);margin-bottom:8px;letter-spacing:0.5px">
        Courier Details</div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:20px">
        <div ${_IRP_F}><label ${_IRP_LBL}>Courier Name <span style="color:var(--danger)">*</span></label>
          <select id="irp-courier" ${_IRP_S} disabled style="opacity:.45">
            <option value="">&#8212; Select Courier &#8212;</option>
          </select></div>
        <div ${_IRP_F}><label ${_IRP_LBL}>Return Date <span style="color:var(--danger)">*</span></label>
          <input type="date" id="irp-retdate" value="${today}" ${_IRP_I} disabled style="opacity:.45"/></div>
        <div ${_IRP_F}><label ${_IRP_LBL}>Track Id <span style="color:var(--danger)">*</span></label>
          <input type="text" id="irp-trackid" ${_IRP_I} disabled style="opacity:.45"/></div>
      </div>

      <!-- Buttons -->
      <div style="display:flex;gap:12px;justify-content:flex-end;padding-top:16px;border-top:1px solid var(--border)">
        <button class="btn btn-secondary" id="btn-irp-close">
          <i class="fas fa-xmark"></i> Close Form</button>
        <button class="btn btn-primary" id="btn-irp-save">
          <i class="fas fa-floppy-disk"></i> Save</button>
      </div>
    </div>
  </div>`;
});

window._pageBinders['inward-return-pending'] = async () => {
  _irpSelected = null; _irpFilter = '';
  // Load reference data
  try {
    [_irpDivs, _irpCouriers] = await Promise.all([
      api('/api/divisions?active=1'), api('/api/couriers')
    ]);
  } catch (_) { }

  // Divisions
  const divSel = $('#irp-div');
  if (divSel) _irpDivs.forEach(d =>
    divSel.insertAdjacentHTML('beforeend',
      `<option value="${d.DivisionId || d.DivisionID}">${d.DivisionName}</option>`));
  divSel.onchange = () => { if (_irpFilter) _irpLoadCases(); };

  // Courier options
  const courierSel = $('#irp-courier');
  if (courierSel) _irpCouriers.forEach(c =>
    courierSel.insertAdjacentHTML('beforeend',
      `<option value="${c.CourierID || c.CourierId}">${c.Name || c.CourierName}</option>`));

  // Toggle buttons
  $('#btn-irp-rp').onclick = () => { _irpFilter = 'RP'; _irpUpdateToggle(); _irpLoadCases(); };
  $('#btn-irp-sp').onclick = () => { _irpFilter = 'SP'; _irpUpdateToggle(); _irpLoadCases(); };

  // DC search
  $('#btn-irp-dc-search').onclick = () => _irpSearchDC();
  $('#irp-dc-input').onkeydown = e => { if (e.key === 'Enter') _irpSearchDC(); };

  // Update Status conditional
  $('#irp-update-stat').onchange = () => _irpApplyStatusLogic();
  $('#irp-rmode').onchange = () => _irpApplyReturnModeLogic();

  // Save
  $('#btn-irp-save').onclick = () => _irpSave();
  $('#btn-irp-close').onclick = () => {
    // Full reset
    _irpSelected = null;
    _irpFilter = '';
    _irpUpdateToggle();
    _irpClearDetails();
    _irpApplyStatusLogic();
    const us = $('#irp-update-stat'); if (us) us.value = '';
    const rmode = $('#irp-rmode'); if (rmode) rmode.value = '';
    const div = $('#irp-div'); if (div) div.value = '';
    const dc = $('#irp-dc-input'); if (dc) dc.value = '';
    // Reset preview table to initial state
    const tb = $('#tbl-irp-body');
    if (tb) tb.innerHTML = `<tr class="empty-row"><td colspan="13" style="padding:20px;text-align:center;color:var(--text-muted)">
      Click a filter button or search a DC No. to load cases.</td></tr>`;
    const lbl = $('#irp-table-label'); if (lbl) lbl.textContent = 'Pending Cases';
  };

  // No auto-load on open &#8212; wait for user to select a filter
  _irpUpdateToggle();
};

function _irpUpdateToggle() {
  const rpBtn = $('#btn-irp-rp'), spBtn = $('#btn-irp-sp');
  if (!rpBtn || !spBtn) return;
  if (_irpFilter === 'RP') {
    rpBtn.className = 'btn btn-primary btn-sm'; spBtn.className = 'btn btn-secondary btn-sm';
    const lbl = $('#irp-table-label'); if (lbl) lbl.textContent = 'Return Pending Cases';
  } else if (_irpFilter === 'SP') {
    spBtn.className = 'btn btn-primary btn-sm'; rpBtn.className = 'btn btn-secondary btn-sm';
    const lbl = $('#irp-table-label'); if (lbl) lbl.textContent = 'Scrap Pending Cases';
  } else {
    // No selection &#8212; both buttons secondary
    rpBtn.className = 'btn btn-secondary btn-sm'; spBtn.className = 'btn btn-secondary btn-sm';
    const lbl = $('#irp-table-label'); if (lbl) lbl.textContent = 'Pending Cases';
  }
}

async function _irpLoadCases(dcNo = '') {
  const tbody = $('#tbl-irp-body'); if (!tbody) return;
  tbody.innerHTML = `<tr class="empty-row"><td colspan="13" style="padding:20px;text-align:center">
    <div class="spinner" style="margin:0 auto"></div></td></tr>`;
  try {
    const div = $('#irp-div')?.value || '';
    let url = `/api/inward-return-pending?flag=${_irpFilter}`;
    if (div) url += `&divisionId=${div}`;
    if (dcNo) url += `&dcNo=${encodeURIComponent(dcNo)}`;
    const data = await api(url);
    if (!data.length) {
      tbody.innerHTML = `<tr class="empty-row"><td colspan="13" style="padding:20px;text-align:center;color:var(--text-muted)">
        No ${_irpFilter === 'RP' ? 'Return' : 'Scrap'} Pending cases found.</td></tr>`;
      return;
    }
    tbody.innerHTML = data.map(d => `
      <tr style="border-bottom:1px solid var(--border);cursor:pointer"
          data-id="${d.InwardReturnItemId}" class="irp-preview-row">
        <td style="padding:7px 10px;font-weight:600;color:var(--accent)">${d.InwardReturnItemId}</td>
        <td style="padding:7px 10px">${d.InwardId}</td>
        <td style="padding:7px 10px">${d.OrderNumber || '&#8212;'}</td>
        <td style="padding:7px 10px">${d.DCNumber || '&#8212;'}</td>
        <td style="padding:7px 10px">${d.InvoiceNumber || '&#8212;'}</td>
        <td style="padding:7px 10px">${fmtDate(d.InwardDate)}</td>
        <td style="padding:7px 10px">${d.VendorName || '&#8212;'}</td>
        <td style="padding:7px 10px">${d.CategoryName || '&#8212;'}</td>
        <td style="padding:7px 10px;font-weight:600">${d.ItemName || '&#8212;'}</td>
        <td style="padding:7px 10px;text-align:center">${d.DCQty}</td>
        <td style="padding:7px 10px;text-align:center">${d.TotalQty}</td>
        <td style="padding:7px 10px;text-align:center">
          <span style="padding:2px 8px;border-radius:10px;font-size:11px;background:rgba(245,158,11,.18);color:#fbbf24">${d.ItemFlag}</span>
        </td>
        <td style="padding:7px 10px;font-size:11px">${d.Reason || '&#8212;'}</td>
      </tr>`).join('');

    // Bind row click &#8594; populate detail section
    $$('.irp-preview-row').forEach(row => {
      row.onclick = () => {
        $$('.irp-preview-row').forEach(r => r.style.background = '');
        row.style.background = 'rgba(99,102,241,.12)';
        const rec = data.find(d => d.InwardReturnItemId === parseInt(row.dataset.id));
        if (rec) _irpPopulateDetails(rec);
      };
    });
  } catch (e) {
    const tb = $('#tbl-irp-body');
    if (tb) tb.innerHTML = `<tr class="empty-row"><td colspan="13" style="color:var(--danger);padding:20px;text-align:center">
      Failed: ${e.message}</td></tr>`;
  }
}

function _irpSearchDC() {
  const val = ($('#irp-dc-input')?.value || '').trim();
  if (!val) return showToast('Enter a DC No. first', 'error');
  _irpFilter = 'RP'; // search will show both RP & SP via dcNo param without flag
  // Temporarily remove flag filter when searching by DC
  const tbody = $('#tbl-irp-body'); if (!tbody) return;
  tbody.innerHTML = `<tr class="empty-row"><td colspan="13" style="padding:20px;text-align:center">
    <div class="spinner" style="margin:0 auto"></div></td></tr>`;
  const div = $('#irp-div')?.value || '';
  let url = `/api/inward-return-pending?dcNo=${encodeURIComponent(val)}`;
  if (div) url += `&divisionId=${div}`;
  api(url).then(data => {
    const lbl = $('#irp-table-label'); if (lbl) lbl.textContent = `DC Search: "${val}"`;
    if (!data.length) {
      tbody.innerHTML = `<tr class="empty-row"><td colspan="13" style="padding:20px;text-align:center;color:var(--text-muted)">
        No pending cases for DC No. "${val}".</td></tr>`; return;
    }
    tbody.innerHTML = data.map(d => `
      <tr style="border-bottom:1px solid var(--border);cursor:pointer"
          data-id="${d.InwardReturnItemId}" class="irp-preview-row">
        <td style="padding:7px 10px;font-weight:600;color:var(--accent)">${d.InwardReturnItemId}</td>
        <td style="padding:7px 10px">${d.InwardId}</td>
        <td style="padding:7px 10px">${d.OrderNumber || '&#8212;'}</td>
        <td style="padding:7px 10px">${d.DCNumber || '&#8212;'}</td>
        <td style="padding:7px 10px">${d.InvoiceNumber || '&#8212;'}</td>
        <td style="padding:7px 10px">${fmtDate(d.InwardDate)}</td>
        <td style="padding:7px 10px">${d.VendorName || '&#8212;'}</td>
        <td style="padding:7px 10px">${d.CategoryName || '&#8212;'}</td>
        <td style="padding:7px 10px;font-weight:600">${d.ItemName || '&#8212;'}</td>
        <td style="padding:7px 10px;text-align:center">${d.DCQty}</td>
        <td style="padding:7px 10px;text-align:center">${d.TotalQty}</td>
        <td style="padding:7px 10px;text-align:center">
          <span style="padding:2px 8px;border-radius:10px;font-size:11px;background:rgba(245,158,11,.18);color:#fbbf24">${d.ItemFlag}</span>
        </td>
        <td style="padding:7px 10px;font-size:11px">${d.Reason || '&#8212;'}</td>
      </tr>`).join('');
    $$('.irp-preview-row').forEach(row => {
      row.onclick = () => {
        $$('.irp-preview-row').forEach(r => r.style.background = '');
        row.style.background = 'rgba(99,102,241,.12)';
        const rec = data.find(d => d.InwardReturnItemId === parseInt(row.dataset.id));
        if (rec) _irpPopulateDetails(rec);
      };
    });
  }).catch(e => {
    const tb = $('#tbl-irp-body');
    if (tb) tb.innerHTML = `<tr class="empty-row"><td colspan="13" style="color:var(--danger);padding:20px;text-align:center">Failed: ${e.message}</td></tr>`;
  });
}

function _irpPopulateDetails(d) {
  _irpSelected = d;
  const set = (id, val) => { const el = $(id); if (el) el.value = val || ''; };
  set('#irp-f-ordernum', d.OrderNumber);
  set('#irp-f-dcnum', d.DCNumber);
  set('#irp-f-invnum', d.InvoiceNumber);
  set('#irp-f-date', d.InwardDate ? fmtDate(d.InwardDate) : '');
  set('#irp-f-vendor', d.VendorName);
  set('#irp-f-cat', d.CategoryName);
  set('#irp-f-item', d.ItemName);
  set('#irp-f-dcqty', d.DCQty);
  set('#irp-f-qty', d.TotalQty);
  set('#irp-f-status', d.ItemFlag === 'RP' ? 'Return Pending' : 'Scrap Pending');
  set('#irp-f-reason', d.Reason);
  // Reset action section
  const us = $('#irp-update-stat'); if (us) us.value = '';
  _irpApplyStatusLogic();
}

function _irpClearDetails() {
  ['#irp-f-ordernum', '#irp-f-dcnum', '#irp-f-invnum', '#irp-f-date',
    '#irp-f-vendor', '#irp-f-cat', '#irp-f-item', '#irp-f-dcqty',
    '#irp-f-qty', '#irp-f-status', '#irp-f-reason'].forEach(id => { const el = $(id); if (el) el.value = ''; });
}

function _irpSetField(id, enabled) {
  const el = $(id); if (!el) return;
  el.disabled = !enabled; el.style.opacity = enabled ? '1' : '0.45';
}
function _irpApplyStatusLogic() {
  const stat = $('#irp-update-stat')?.value || '';
  const isRC = stat === 'Return Complete';
  _irpSetField('#irp-rmode', isRC);
  if (!isRC) {
    const r = $('#irp-rmode'); if (r) r.value = '';
    ['#irp-pname', '#irp-courier', '#irp-retdate', '#irp-trackid'].forEach(id => _irpSetField(id, false));
  }
  else _irpApplyReturnModeLogic();
}
function _irpApplyReturnModeLogic() {
  const mode = $('#irp-rmode')?.value || '';
  const isHand = mode === 'Hand', isCourier = mode === 'Courier';
  _irpSetField('#irp-pname', isHand);
  ['#irp-courier', '#irp-retdate', '#irp-trackid'].forEach(id => _irpSetField(id, isCourier));
  if (!isHand) { const p = $('#irp-pname'); if (p) p.value = ''; }
  if (!isCourier) { ['#irp-courier', '#irp-trackid'].forEach(id => { const el = $(id); if (el) el.value = ''; }); }
}

async function _irpSave() {
  if (!_irpSelected) return showToast('Select a case from the table first', 'error');
  const stat = $('#irp-update-stat')?.value;
  if (!stat) return showToast('Update Status As is required', 'error');

  let body = { updateStatus: stat };
  if (stat === 'Return Complete') {
    const rmode = $('#irp-rmode')?.value;
    if (!rmode) return showToast('Return Mode is required', 'error');
    body.returnMode = rmode;
    if (rmode === 'Hand') {
      const pname = $('#irp-pname')?.value?.trim();
      if (!pname) return showToast('Person Name is required', 'error');
      body.personName = pname;
    } else if (rmode === 'Courier') {
      const cname = $('#irp-courier')?.value;
      const rdate = $('#irp-retdate')?.value;
      const tid = $('#irp-trackid')?.value?.trim();
      if (!cname) return showToast('Courier Name is required', 'error');
      if (!rdate) return showToast('Return Date is required', 'error');
      if (!tid) return showToast('Track Id is required', 'error');
      body.courierName = $('#irp-courier')?.selectedOptions[0]?.text || '';
      body.returnDate = rdate;
      body.trackId = tid;
    }
  }
  try {
    await api(`/api/inward-return-pending/${_irpSelected.InwardReturnItemId}`,
      { method: 'PUT', body });
    showToast(`Case resolved as ${stat}! Inward updated.`, 'success');
    _irpSelected = null;
    _irpClearDetails();
    const us = $('#irp-update-stat'); if (us) us.value = '';
    _irpApplyStatusLogic();
    _irpLoadCases(); // refresh table
  } catch (e) { showToast('Save failed: ' + e.message, 'error'); }
}



// ======== RETURN ISSUES PENDING &#8211; FULL PAGE ========

let _ripDivs = [], _ripCouriers = [], _ripVendors = [], _ripData = [], _ripSelected = null;

registerPage('issue-return-pending', () => {
  const today = new Date().toISOString().split('T')[0];
  return `
  <div style="padding:0">
    <div style="background:var(--bg-card);padding:20px 28px 16px;border-bottom:1px solid var(--border)">
      <h2 style="margin:0;font-size:18px;font-weight:700;color:var(--text-primary);display:flex;align-items:center;gap:10px">
        <i class="fas fa-triangle-exclamation" style="color:var(--accent)"></i> Return Issues Pending
      </h2>
      <div style="font-size:12px;color:var(--text-muted);margin-top:3px">Transactions / Return Issues Pending</div>
    </div>
    <div class="card" style="padding:20px 24px">

      <!-- Division filter -->
      <div style="display:grid;grid-template-columns:280px 1fr;gap:14px;margin-bottom:18px;align-items:end">
        <div style="display:flex;flex-direction:column">
          <label style="font-size:11.5px;font-weight:600;color:var(--text-muted);margin-bottom:4px">
            Division <span style="color:var(--danger)">*</span></label>
          <select id="rip-div" style="background:var(--bg-dark);border:1px solid var(--border);border-radius:6px;padding:6px 10px;color:var(--text-primary);font-size:13px;cursor:pointer">
            <option value="">&#8212; Select Division &#8212;</option>
          </select>
        </div>
        <div></div>
      </div>

      <!-- Preview table -->
      <div style="font-size:11px;font-weight:700;color:var(--accent);text-transform:uppercase;letter-spacing:.8px;margin-bottom:8px">
        <i class="fas fa-list" style="margin-right:5px"></i>Return Pending Entries
      </div>
      <div style="border:1px solid var(--border);border-radius:8px;overflow:auto;max-height:260px;margin-bottom:20px">
        <table style="width:100%;border-collapse:collapse;font-size:12px">
          <thead style="background:var(--bg-dark);position:sticky;top:0">
            <tr>
              <th style="padding:7px 10px;text-align:left">IssueReturnItemId</th>
              <th style="padding:7px 10px;text-align:left">ReturnId</th>
              <th style="padding:7px 10px;text-align:left">ReturnMode</th>
              <th style="padding:7px 10px;text-align:left">PersonName</th>
              <th style="padding:7px 10px;text-align:left">CourierName</th>
              <th style="padding:7px 10px;text-align:left">ReturnDocNo</th>
              <th style="padding:7px 10px;text-align:left">ReturnDate</th>
              <th style="padding:7px 10px;text-align:left">ItemName</th>
              <th style="padding:7px 10px;text-align:center">ReturnQty</th>
            </tr>
          </thead>
          <tbody id="tbl-rip-body">
            <tr class="empty-row"><td colspan="9" style="padding:18px;text-align:center;color:var(--text-muted)">
              Select a Division to load pending entries.</td></tr>
          </tbody>
        </table>
      </div>

      <!-- Divider -->
      <div style="border-top:2px dashed var(--border);margin:16px 0"></div>

      <!-- Non-editable detail panel -->
      <div style="font-size:12px;font-weight:700;color:var(--accent);letter-spacing:1px;text-transform:uppercase;margin-bottom:14px">
        <i class="fas fa-circle-info" style="margin-right:6px"></i>Selected Entry Details
        <span id="rip-sel-badge" style="background:rgba(165,180,252,.15);color:#a5b4fc;padding:2px 8px;border-radius:10px;font-size:10px;font-weight:500;margin-left:8px"></span>
      </div>
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:16px">
        ${['rip-d-rmode:Return Mode', 'rip-d-pname:Person Name', 'rip-d-rdate:Return Date', 'rip-d-item:Return Item'].map(s => {
    const [id, lbl] = s.split(':');
    return `<div style="display:flex;flex-direction:column">
            <label style="font-size:11.5px;font-weight:600;color:var(--text-muted);margin-bottom:4px">${lbl}</label>
            <input type="text" id="${id}" readonly style="background:var(--bg-dark);border:1px dashed var(--border);border-radius:6px;padding:6px 10px;color:var(--text-muted);font-size:13px"/>
          </div>`;
  }).join('')}
      </div>
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:20px">
        ${['rip-d-cname:Courier Name', 'rip-d-trackid:Track Id', 'rip-d-rqty:Return Qty', 'rip-d-istatus:Item Status'].map(s => {
    const [id, lbl] = s.split(':');
    return `<div style="display:flex;flex-direction:column">
            <label style="font-size:11.5px;font-weight:600;color:var(--text-muted);margin-bottom:4px">${lbl}</label>
            <input type="text" id="${id}" readonly style="background:var(--bg-dark);border:1px dashed var(--border);border-radius:6px;padding:6px 10px;color:var(--text-muted);font-size:13px"/>
          </div>`;
  }).join('')}
      </div>

      <!-- Divider -->
      <div style="border-top:2px dashed var(--border);margin:16px 0"></div>

      <!-- Resolution form -->
      <div style="font-size:12px;font-weight:700;color:var(--accent);letter-spacing:1px;text-transform:uppercase;margin-bottom:14px">
        <i class="fas fa-pen-to-square" style="margin-right:6px"></i>Update Resolution
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px;margin-bottom:14px">
        <!-- Update Status As -->
        <div style="display:flex;flex-direction:column">
          <label style="font-size:11.5px;font-weight:600;color:var(--text-muted);margin-bottom:4px">
            Update Status As <span style="color:var(--danger)">*</span></label>
          <select id="rip-ustatus" style="background:var(--bg-dark);border:1px solid var(--border);border-radius:6px;padding:6px 10px;color:var(--text-primary);font-size:13px;cursor:pointer">
            <option value="">&#8212; Select &#8212;</option>
            <option value="Return Complete">Return Complete</option>
            <option value="Scrap Complete">Scrap Complete</option>
            <option value="Complete">Complete</option>
          </select>
        </div>
        <!-- Reason (label changes dynamically) -->
        <div style="display:flex;flex-direction:column">
          <label id="rip-reason-lbl" style="font-size:11.5px;font-weight:600;color:var(--text-muted);margin-bottom:4px">Reason for &#8212;</label>
          <select id="rip-reason" disabled style="background:var(--bg-dark);border:1px solid var(--border);border-radius:6px;padding:6px 10px;color:var(--text-primary);font-size:13px;opacity:.45;cursor:pointer">
            <option value="">&#8212; Select Reason &#8212;</option>
            <option value="Wrong Materials">Wrong Materials</option>
            <option value="Found damaged at destination">Found damaged at destination</option>
            <option value="Return to Stock">Return to Stock</option>
            <option value="Scrap">Scrap</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <!-- Other reason text (hidden by default) -->
        <div style="display:flex;flex-direction:column" id="rip-other-wrap" style="display:none">
          <label style="font-size:11.5px;font-weight:600;color:var(--text-muted);margin-bottom:4px">Other Reason</label>
          <input type="text" id="rip-other-reason" disabled
            style="background:var(--bg-dark);border:1px solid var(--border);border-radius:6px;padding:6px 10px;color:var(--text-primary);font-size:13px;opacity:.45"/>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px">
        <!-- Remark -->
        <div style="display:flex;flex-direction:column">
          <label style="font-size:11.5px;font-weight:600;color:var(--text-muted);margin-bottom:4px">Remark</label>
          <input type="text" id="rip-remark" disabled
            style="background:var(--bg-dark);border:1px solid var(--border);border-radius:6px;padding:6px 10px;color:var(--text-primary);font-size:13px;opacity:.45"/>
        </div>
        <!-- Vendor Name -->
        <div style="display:flex;flex-direction:column">
          <label style="font-size:11.5px;font-weight:600;color:var(--text-muted);margin-bottom:4px">
            Vendor Name <span style="color:var(--danger)" id="rip-vendor-star">*</span></label>
          <select id="rip-vendor" disabled
            style="background:var(--bg-dark);border:1px solid var(--border);border-radius:6px;padding:6px 10px;color:var(--text-primary);font-size:13px;opacity:.45;cursor:pointer">
            <option value="">&#8212; Select Vendor &#8212;</option>
          </select>
        </div>
      </div>
      <!-- Delivery section (for Return Complete only) -->
      <div style="font-size:12px;font-weight:600;color:var(--text-muted);margin-bottom:8px" id="rip-del-label">Courier / Delivery Details</div>
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:20px">
        <div style="display:flex;flex-direction:column">
          <label style="font-size:11.5px;font-weight:600;color:var(--text-muted);margin-bottom:4px">Return Mode</label>
          <select id="rip-rmode" disabled
            style="background:var(--bg-dark);border:1px solid var(--border);border-radius:6px;padding:6px 10px;color:var(--text-primary);font-size:13px;opacity:.45;cursor:pointer">
            <option value="">&#8212; Select &#8212;</option>
            <option value="Hand">Hand</option>
            <option value="Courier">Courier</option>
          </select>
        </div>
        <div style="display:flex;flex-direction:column">
          <label style="font-size:11.5px;font-weight:600;color:var(--text-muted);margin-bottom:4px">Person Name</label>
          <input type="text" id="rip-pname" disabled
            style="background:var(--bg-dark);border:1px solid var(--border);border-radius:6px;padding:6px 10px;color:var(--text-primary);font-size:13px;opacity:.45"/>
        </div>
        <div style="display:flex;flex-direction:column">
          <label style="font-size:11.5px;font-weight:600;color:var(--text-muted);margin-bottom:4px">
            Courier Name <span style="color:var(--danger)">*</span></label>
          <select id="rip-courier" disabled
            style="background:var(--bg-dark);border:1px solid var(--border);border-radius:6px;padding:6px 10px;color:var(--text-primary);font-size:13px;opacity:.45;cursor:pointer">
            <option value="">&#8212; Select Courier &#8212;</option>
          </select>
        </div>
        <div style="display:flex;flex-direction:column">
          <label style="font-size:11.5px;font-weight:600;color:var(--text-muted);margin-bottom:4px">
            Return Date <span style="color:var(--danger)">*</span></label>
          <input type="date" id="rip-rdate" value="${today}" disabled
            style="background:var(--bg-dark);border:1px solid var(--border);border-radius:6px;padding:6px 10px;color:var(--text-primary);font-size:13px;opacity:.45"/>
        </div>
        <div style="display:flex;flex-direction:column;grid-column:span 2">
          <label style="font-size:11.5px;font-weight:600;color:var(--text-muted);margin-bottom:4px">
            Track Id <span style="color:var(--danger)">*</span></label>
          <input type="text" id="rip-trackid" disabled
            style="background:var(--bg-dark);border:1px solid var(--border);border-radius:6px;padding:6px 10px;color:var(--text-primary);font-size:13px;opacity:.45"/>
        </div>
      </div>

      <!-- Buttons -->
      <div style="display:flex;gap:12px;padding-top:14px;border-top:1px solid var(--border)">
        <button class="btn btn-success" id="btn-rip-save">
          <i class="fas fa-floppy-disk"></i> Save</button>
        <button class="btn btn-danger" id="btn-rip-close" style="margin-left:auto">
          <i class="fas fa-xmark"></i> Close Form</button>
      </div>
    </div>
  </div>`;
});

window._pageBinders['issue-return-pending'] = async () => {
  _ripDivs = []; _ripCouriers = []; _ripVendors = []; _ripData = []; _ripSelected = null;
  try {
    [_ripDivs, _ripCouriers, _ripVendors] = await Promise.all([
      api('/api/divisions?active=1'), api('/api/couriers'), api('/api/vendors')]);
  } catch (_) { }

  const divSel = $('#rip-div');
  if (divSel) _ripDivs.forEach(d =>
    divSel.insertAdjacentHTML('beforeend', `<option value="${d.DivisionId || d.DivisionID}">${d.DivisionName}</option>`));

  const courierSel = $('#rip-courier');
  if (courierSel) _ripCouriers.forEach(c =>
    courierSel.insertAdjacentHTML('beforeend', `<option value="${c.CourierID || c.CourierId}">${c.Name || c.CourierName}</option>`));

  const vendorSel = $('#rip-vendor');
  if (vendorSel) _ripVendors.forEach(v =>
    vendorSel.insertAdjacentHTML('beforeend', `<option value="${v.VendorId || v.VendorID}">${v.Name || v.VendorName}</option>`));

  divSel.onchange = () => _ripLoadData();

  $('#rip-ustatus').onchange = () => _ripApplyStatus();
  $('#rip-reason').onchange = () => _ripApplyReason();
  $('#rip-rmode').onchange = () => _ripApplyDelMode();
  $('#btn-rip-save').onclick = () => _ripSave();
  $('#btn-rip-close').onclick = () => _ripReset();
};

async function _ripLoadData() {
  const divId = $('#rip-div')?.value || '';
  let url = '/api/return-issues-pending';
  if (divId) url += `?divisionId=${divId}`;
  try { _ripData = await api(url); } catch (_) { _ripData = []; }
  _ripRenderTable();
  _ripClearDetail();
  _ripSelected = null;
}

function _ripRenderTable() {
  const tbody = $('#tbl-rip-body'); if (!tbody) return;
  if (!_ripData.length) {
    tbody.innerHTML = `<tr class="empty-row"><td colspan="9" style="padding:18px;text-align:center;color:var(--text-muted)">No Return Pending entries found.</td></tr>`;
    return;
  }
  tbody.innerHTML = _ripData.map(d => `
    <tr class="rip-row" data-id="${d.IssueReturnItemId}"
        style="cursor:pointer;border-bottom:1px solid var(--border);transition:background .15s">
      <td style="padding:7px 10px;font-weight:700;color:var(--accent)">${d.IssueReturnItemId}</td>
      <td style="padding:7px 10px">${d.ReturnId}</td>
      <td style="padding:7px 10px">${d.ReturnMode || '&#8212;'}</td>
      <td style="padding:7px 10px">${d.PersonName || '&#8212;'}</td>
      <td style="padding:7px 10px">${d.CourierName || '&#8212;'}</td>
      <td style="padding:7px 10px">${d.ReturnDocNo || '&#8212;'}</td>
      <td style="padding:7px 10px">${fmtDate(d.ReturnDate)}</td>
      <td style="padding:7px 10px;font-weight:600">${d.ItemName || '&#8212;'}</td>
      <td style="padding:7px 10px;text-align:center;color:var(--warning);font-weight:700">${d.ReturnQty}</td>
    </tr>`).join('');
  tbody.querySelectorAll('.rip-row').forEach(row => {
    row.onmouseenter = () => { if (String(row.dataset.id) !== String(_ripSelected?.IssueReturnItemId)) row.style.background = 'var(--bg-hover)'; };
    row.onmouseleave = () => { if (String(row.dataset.id) !== String(_ripSelected?.IssueReturnItemId)) row.style.background = ''; };
    row.onclick = () => _ripSelectRow(_ripData.find(d => String(d.IssueReturnItemId) === row.dataset.id), row);
  });
}

function _ripHighlight(activeRow) {
  document.querySelectorAll('.rip-row').forEach(r =>
    r.style.background = r === activeRow ? 'rgba(99,102,241,.22)' : '');
}

function _ripSelectRow(item, row) {
  _ripSelected = item;
  _ripHighlight(row);
  const badge = $('#rip-sel-badge');
  if (badge) badge.textContent = `IssueReturnItemId #${item.IssueReturnItemId}`;
  // Fill read-only detail fields
  const set = (id, v) => { const el = $(id); if (el) el.value = v || ''; };
  set('#rip-d-rmode', item.ReturnMode);
  set('#rip-d-pname', item.PersonName);
  set('#rip-d-rdate', item.ReturnDate ? item.ReturnDate.toString().split('T')[0] : '');
  set('#rip-d-item', item.ItemName);
  set('#rip-d-cname', item.CourierName);
  set('#rip-d-trackid', item.ReturnDocNo);
  set('#rip-d-rqty', item.ReturnQty);
  set('#rip-d-istatus', item.ItemFlag || 'RP');
}

function _ripClearDetail() {
  ['#rip-d-rmode', '#rip-d-pname', '#rip-d-rdate', '#rip-d-item',
    '#rip-d-cname', '#rip-d-trackid', '#rip-d-rqty', '#rip-d-istatus']
    .forEach(id => { const el = $(id); if (el) el.value = ''; });
  const badge = $('#rip-sel-badge'); if (badge) badge.textContent = '';
}

function _ripSetF(id, enabled) {
  const el = $(id); if (!el) return;
  el.disabled = !enabled; el.style.opacity = enabled ? '1' : '0.45';
}

function _ripApplyStatus() {
  const status = $('#rip-ustatus')?.value || '';
  const isRC = status === 'Return Complete';
  const isSC = status === 'Scrap Complete';
  const isC = status === 'Complete';
  const hasStatus = isRC || isSC || isC;

  // Reason label
  const lbl = $('#rip-reason-lbl');
  if (lbl) lbl.textContent = isRC ? 'Reason for Return' : isSC ? 'Reason for Scrap' : isC ? 'Reason for Complete' : 'Reason for &#8212;';

  // Reason always enabled once a status is selected
  _ripSetF('#rip-reason', hasStatus);

  // Remark & Vendor: only for Return Complete
  _ripSetF('#rip-remark', isRC);
  _ripSetF('#rip-vendor', isRC);

  // Delivery section: only for Return Complete
  _ripSetF('#rip-rmode', isRC);
  if (!isRC) { _ripSetF('#rip-pname', false); _ripSetF('#rip-courier', false); _ripSetF('#rip-rdate', false); _ripSetF('#rip-trackid', false); }

  // Clear disabled fields
  if (!isRC) {
    ['#rip-remark', '#rip-vendor', '#rip-rmode', '#rip-pname', '#rip-courier', '#rip-trackid']
      .forEach(id => { const el = $(id); if (el) el.value = ''; });
  }
  if (!hasStatus) { const el = $('#rip-reason'); if (el) el.value = ''; }
  _ripApplyReason();
  if (isRC) _ripApplyDelMode();
}

function _ripApplyReason() {
  const reason = $('#rip-reason')?.value || '';
  const wrap = $('#rip-other-wrap');
  if (wrap) wrap.style.display = reason === 'Other' ? 'flex' : 'none';
  _ripSetF('#rip-other-reason', reason === 'Other');
}

function _ripApplyDelMode() {
  const mode = $('#rip-rmode')?.value || '';
  const isHand = mode === 'Hand', isCourier = mode === 'Courier';
  _ripSetF('#rip-pname', isHand);
  _ripSetF('#rip-courier', isCourier);
  _ripSetF('#rip-rdate', isCourier);
  _ripSetF('#rip-trackid', isCourier);
  if (!isHand) { const p = $('#rip-pname'); if (p) p.value = ''; }
  if (!isCourier) { ['#rip-courier', '#rip-rdate', '#rip-trackid'].forEach(id => { const el = $(id); if (el) el.value = ''; }); }
}

function _ripReset() {
  _ripSelected = null;
  ['#rip-div', '#rip-ustatus', '#rip-reason', '#rip-remark', '#rip-vendor', '#rip-rmode', '#rip-courier']
    .forEach(id => { const el = $(id); if (el) el.value = ''; });
  ['#rip-pname', '#rip-trackid', '#rip-other-reason'].forEach(id => { const el = $(id); if (el) el.value = ''; });
  const rdate = $('#rip-rdate'); if (rdate) rdate.value = new Date().toISOString().split('T')[0];
  const wrap = $('#rip-other-wrap'); if (wrap) wrap.style.display = 'none';
  ['#rip-reason', '#rip-remark', '#rip-vendor', '#rip-rmode', '#rip-pname', '#rip-courier', '#rip-rdate', '#rip-trackid', '#rip-other-reason']
    .forEach(id => _ripSetF(id, false));
  _ripClearDetail();
  _ripData = [];
  const tbody = $('#tbl-rip-body');
  if (tbody) tbody.innerHTML = `<tr class="empty-row"><td colspan="9" style="padding:18px;text-align:center;color:var(--text-muted)">Select a Division to load pending entries.</td></tr>`;
  showToast('Form reset', 'info');
}

async function _ripSave() {
  if (!_ripSelected) return showToast('Select a pending entry from the preview', 'error');
  const status = $('#rip-ustatus')?.value;
  if (!status) return showToast('Update Status As is required', 'error');
  const reason = $('#rip-reason')?.value;
  if (!reason) return showToast('Reason is required', 'error');
  const otherReason = $('#rip-other-reason')?.value?.trim();
  if (reason === 'Other' && !otherReason) return showToast('Enter the Other Reason', 'error');

  const isRC = status === 'Return Complete';
  if (isRC) {
    if (!$('#rip-vendor')?.value) return showToast('Vendor Name is required', 'error');
    const mode = $('#rip-rmode')?.value;
    if (!mode) return showToast('Return Mode is required', 'error');
    if (mode === 'Hand' && !$('#rip-pname')?.value?.trim()) return showToast('Person Name is required', 'error');
    if (mode === 'Courier' && !$('#rip-courier')?.value) return showToast('Courier Name is required', 'error');
    if (mode === 'Courier' && !$('#rip-trackid')?.value?.trim()) return showToast('Track Id is required', 'error');
  }

  const body = {
    IssueReturnItemId: _ripSelected.IssueReturnItemId,
    UpdateStatusAs: status,
    Reason: reason,
    OtherReason: otherReason || null,
    Remark: $('#rip-remark')?.value?.trim() || null,
    VendorId: isRC ? ($('#rip-vendor')?.value || null) : null,
    ReturnMode: isRC ? ($('#rip-rmode')?.value || null) : null,
    PersonName: isRC ? ($('#rip-pname')?.value?.trim() || null) : null,
    // Only send courier fields when mode is Courier &#8212; send null for Hand
    CourierName: (isRC && $('#rip-rmode')?.value === 'Courier') ? ($('#rip-courier')?.selectedOptions[0]?.text || null) : null,
    ReturnDate: (isRC && $('#rip-rmode')?.value === 'Courier') ? ($('#rip-rdate')?.value || null) : null,
    ReturnDocNo: (isRC && $('#rip-rmode')?.value === 'Courier') ? ($('#rip-trackid')?.value?.trim() || null) : null,
  };
  try {
    const res = await api('/api/return-issues-pending/resolve', { method: 'POST', body });
    showToast(`Status updated to ${res.newFlag}. Entry resolved.`, 'success');
    // Remove resolved entry from preview
    _ripData = _ripData.filter(d => String(d.IssueReturnItemId) !== String(_ripSelected.IssueReturnItemId));
    _ripSelected = null;
    _ripRenderTable();
    _ripClearDetail();
    // Reset resolution form
    ['#rip-ustatus', '#rip-reason', '#rip-remark', '#rip-vendor', '#rip-rmode', '#rip-courier'].forEach(id => { const el = $(id); if (el) el.value = ''; });
    ['#rip-pname', '#rip-trackid', '#rip-other-reason'].forEach(id => { const el = $(id); if (el) el.value = ''; });
    const wrap = $('#rip-other-wrap'); if (wrap) wrap.style.display = 'none';
    ['#rip-reason', '#rip-remark', '#rip-vendor', '#rip-rmode', '#rip-pname', '#rip-courier', '#rip-rdate', '#rip-trackid', '#rip-other-reason'].forEach(id => _ripSetF(id, false));
  } catch (e) { showToast('Save failed: ' + e.message, 'error'); }
}



// ======== ISSUE PENDING ITEMS &#8211; FULL PAGE ========

let _ipDivs = [], _ipItems = [], _ipCouriers = [], _ipSelectedIssue = null, _ipIssueData = null;

registerPage('issue-pending', () => {
  const today = new Date().toISOString().split('T')[0];
  return `
  <div style="padding:0">
    <div style="background:var(--bg-card);padding:20px 28px 16px;border-bottom:1px solid var(--border)">
      <h2 style="margin:0;font-size:18px;font-weight:700;color:var(--text-primary);display:flex;align-items:center;gap:10px">
        <i class="fas fa-hourglass-half" style="color:var(--accent)"></i> Issue Pending Items
      </h2>
      <div style="font-size:12px;color:var(--text-muted);margin-top:3px">Transactions / Issue Pending Items</div>
    </div>

    <div class="card" style="padding:20px 24px">

      <!-- Filter row -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:18px">
        <div style="display:flex;flex-direction:column">
          <label style="font-size:11.5px;font-weight:600;color:var(--text-muted);margin-bottom:4px">
            Division <span style="color:var(--danger)">*</span></label>
          <select id="ip-div" style="background:var(--bg-dark);border:1px solid var(--border);border-radius:6px;padding:6px 10px;color:var(--text-primary);font-size:13px;cursor:pointer">
            <option value="">&#8212; All Divisions &#8212;</option>
          </select>
        </div>
        <div style="display:flex;flex-direction:column">
          <label style="font-size:11.5px;font-weight:600;color:var(--text-muted);margin-bottom:4px">Search Item</label>
          <select id="ip-item" style="background:var(--bg-dark);border:1px solid var(--border);border-radius:6px;padding:6px 10px;color:var(--text-primary);font-size:13px;cursor:pointer">
            <option value="">&#8212; All Items &#8212;</option>
          </select>
        </div>
      </div>

      <!-- Dual-pane preview -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:18px">

        <!-- Left: Open Issues -->
        <div>
          <div style="font-size:11px;font-weight:700;color:var(--accent);text-transform:uppercase;letter-spacing:.8px;margin-bottom:8px">
            <i class="fas fa-list" style="margin-right:5px"></i>Open Issues
          </div>
          <div style="border:1px solid var(--border);border-radius:8px;overflow:auto;max-height:280px">
            <table style="width:100%;border-collapse:collapse;font-size:12px">
              <thead style="background:var(--bg-dark);position:sticky;top:0">
                <tr>
                  <th style="padding:7px 10px;text-align:left">IssueId</th>
                  <th style="padding:7px 10px;text-align:left">RequestId</th>
                  <th style="padding:7px 10px;text-align:left">Req. By EmpId</th>
                  <th style="padding:7px 10px;text-align:left">Status</th>
                  <th style="padding:7px 10px;text-align:left">Req. Mode</th>
                </tr>
              </thead>
              <tbody id="tbl-ip-issues">
                <tr class="empty-row"><td colspan="5" style="padding:18px;text-align:center;color:var(--text-muted)">
                  Select a Division to load issues.</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Right: Pending Items of selected Issue -->
        <div>
          <div style="font-size:11px;font-weight:700;color:var(--accent);text-transform:uppercase;letter-spacing:.8px;margin-bottom:8px">
            <i class="fas fa-boxes-stacked" style="margin-right:5px"></i>Pending Items
            <span id="ip-issue-badge" style="background:rgba(165,180,252,.15);color:#a5b4fc;padding:2px 8px;border-radius:10px;font-size:10px;margin-left:6px"></span>
          </div>
          <div style="border:1px solid var(--border);border-radius:8px;overflow:auto;max-height:280px">
            <table style="width:100%;border-collapse:collapse;font-size:12px">
              <thead style="background:var(--bg-dark);position:sticky;top:0">
                <tr>
                  <th style="padding:7px 10px;text-align:center;width:34px">
                    <input type="checkbox" id="ip-chk-all" title="Select all"/></th>
                  <th style="padding:7px 10px;text-align:center">SrlNo</th>
                  <th style="padding:7px 10px;text-align:left">Item Name</th>
                  <th style="padding:7px 10px;text-align:center">Pending Qty</th>
                </tr>
              </thead>
              <tbody id="tbl-ip-items">
                <tr class="empty-row"><td colspan="4" style="padding:18px;text-align:center;color:var(--text-muted)">
                  Click an Issue row to view its pending items.</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Divider -->
      <div style="border-top:2px dashed var(--border);margin:16px 0"></div>

      <!-- Delivery Details -->
      <div style="font-size:12px;font-weight:700;color:var(--accent);letter-spacing:1px;text-transform:uppercase;margin-bottom:14px;padding-bottom:6px;border-bottom:1px solid var(--border)">
        <i class="fas fa-truck" style="margin-right:6px"></i>Delivery Details
      </div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-bottom:14px">
        <div style="display:flex;flex-direction:column">
          <label style="font-size:11.5px;font-weight:600;color:var(--text-muted);margin-bottom:4px">
            Issue Date <span style="color:var(--danger)">*</span></label>
          <input type="date" id="ip-date" value="${today}"
            style="background:var(--bg-dark);border:1px solid var(--border);border-radius:6px;padding:6px 10px;color:var(--text-primary);font-size:13px"/>
        </div>
        <div style="display:flex;flex-direction:column">
          <label style="font-size:11.5px;font-weight:600;color:var(--text-muted);margin-bottom:4px">
            Deliver Mode <span style="color:var(--danger)">*</span></label>
          <select id="ip-delmode" style="background:var(--bg-dark);border:1px solid var(--border);border-radius:6px;padding:6px 10px;color:var(--text-primary);font-size:13px;cursor:pointer">
            <option value="">&#8212; Select &#8212;</option>
            <option value="Hand">Hand</option>
            <option value="Courier">Courier</option>
          </select>
        </div>
        <div style="display:flex;flex-direction:column">
          <label style="font-size:11.5px;font-weight:600;color:var(--text-muted);margin-bottom:4px">
            Person Name <span style="color:var(--danger)" id="ip-pname-star">*</span></label>
          <input type="text" id="ip-pname" disabled
            style="background:var(--bg-dark);border:1px solid var(--border);border-radius:6px;padding:6px 10px;color:var(--text-primary);font-size:13px;opacity:.45"/>
        </div>
      </div>
      <div style="font-size:12px;font-weight:600;color:var(--text-muted);margin-bottom:8px">Courier Details</div>
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:14px">
        <div style="display:flex;flex-direction:column">
          <label style="font-size:11.5px;font-weight:600;color:var(--text-muted);margin-bottom:4px">
            Courier Name <span style="color:var(--danger)">*</span></label>
          <select id="ip-courier" disabled
            style="background:var(--bg-dark);border:1px solid var(--border);border-radius:6px;padding:6px 10px;color:var(--text-primary);font-size:13px;opacity:.45">
            <option value="">&#8212; Select Courier &#8212;</option>
          </select>
        </div>
        <div style="display:flex;flex-direction:column">
          <label style="font-size:11.5px;font-weight:600;color:var(--text-muted);margin-bottom:4px">Mobile Number</label>
          <input type="text" id="ip-cmob" disabled
            style="background:var(--bg-dark);border:1px solid var(--border);border-radius:6px;padding:6px 10px;color:var(--text-primary);font-size:13px;opacity:.45"/>
        </div>
        <div style="display:flex;flex-direction:column">
          <label style="font-size:11.5px;font-weight:600;color:var(--text-muted);margin-bottom:4px">
            Track Id <span style="color:var(--danger)">*</span></label>
          <input type="text" id="ip-tid" disabled
            style="background:var(--bg-dark);border:1px solid var(--border);border-radius:6px;padding:6px 10px;color:var(--text-primary);font-size:13px;opacity:.45"/>
        </div>
        <div style="display:flex;flex-direction:column">
          <label style="font-size:11.5px;font-weight:600;color:var(--text-muted);margin-bottom:4px">Location</label>
          <input type="text" id="ip-cloc" disabled
            style="background:var(--bg-dark);border:1px solid var(--border);border-radius:6px;padding:6px 10px;color:var(--text-primary);font-size:13px;opacity:.45"/>
        </div>
      </div>
      <div style="display:flex;flex-direction:column;margin-bottom:20px">
        <label style="font-size:11.5px;font-weight:600;color:var(--text-muted);margin-bottom:4px">Issue Note</label>
        <textarea id="ip-note" rows="2"
          style="background:var(--bg-dark);border:1px solid var(--border);border-radius:6px;padding:6px 10px;color:var(--text-primary);font-size:13px;resize:none"></textarea>
      </div>

      <!-- Buttons -->
      <div style="display:flex;gap:12px;padding-top:14px;border-top:1px solid var(--border)">
        <button class="btn btn-success" id="btn-ip-save">
          <i class="fas fa-floppy-disk"></i> Save Pending Issue</button>
        <button class="btn btn-danger" id="btn-ip-close" style="margin-left:auto">
          <i class="fas fa-xmark"></i> Close Form</button>
      </div>
    </div>
  </div>`;
});

window._pageBinders['issue-pending'] = async () => {
  _ipDivs = []; _ipItems = []; _ipCouriers = []; _ipSelectedIssue = null; _ipIssueData = null;
  try {
    [_ipDivs, _ipCouriers] = await Promise.all([api('/api/divisions?active=1'), api('/api/couriers')]);
  } catch (_) { }

  // Divisions
  const divSel = $('#ip-div');
  if (divSel) _ipDivs.forEach(d =>
    divSel.insertAdjacentHTML('beforeend',
      `<option value="${d.DivisionId || d.DivisionID}">${d.DivisionName}</option>`));

  // Couriers
  const courierSel = $('#ip-courier');
  if (courierSel) _ipCouriers.forEach(c =>
    courierSel.insertAdjacentHTML('beforeend',
      `<option value="${c.CourierID || c.CourierId}">${c.Name || c.CourierName}</option>`));
  // Courier change â†’ update Mobile Number
  if (courierSel) courierSel.onchange = () => _ipAutoFillCourierMob();

  // Division &#8594; reload items + issues
  if (divSel) divSel.onchange = async () => {
    _ipSelectedIssue = null; _ipIssueData = null;
    _ipClearItems();
    const vid = divSel.value;
    // Reload items for Search Item dropdown
    _ipItems = [];
    const itemSel = $('#ip-item');
    if (itemSel) itemSel.innerHTML = '<option value="">&#8212; All Items &#8212;</option>';
    if (vid) {
      try { _ipItems = await api(`/api/items-by-division?divisionId=${vid}`); } catch (_) { }
      if (itemSel) _ipItems.forEach(it =>
        itemSel.insertAdjacentHTML('beforeend',
          `<option value="${it.Itemid}">${it.ItemName}</option>`));
    }
    await _ipLoadIssues();
  };

  // Item filter &#8594; reload issues
  $('#ip-item').onchange = () => _ipLoadIssues();

  // Select-all checkbox
  $('#ip-chk-all').onchange = function () {
    document.querySelectorAll('.ip-item-chk').forEach(c => c.checked = this.checked);
  };

  // Deliver mode
  $('#ip-delmode').onchange = () => _ipApplyDelMode();

  // Buttons
  $('#btn-ip-save').onclick = () => _ipSave();
  $('#btn-ip-close').onclick = () => _ipReset();
};

async function _ipLoadIssues() {
  const divId = $('#ip-div')?.value || '';
  const itemId = $('#ip-item')?.value || '';
  let url = '/api/issue-pending';
  const ps = [];
  if (divId) ps.push(`divisionId=${divId}`);
  if (itemId) ps.push(`itemId=${itemId}`);
  if (ps.length) url += '?' + ps.join('&');
  let data = [];
  try { data = await api(url); } catch (_) { }
  const tbody = $('#tbl-ip-issues'); if (!tbody) return;
  if (!data.length) {
    tbody.innerHTML = `<tr class="empty-row"><td colspan="5" style="padding:18px;text-align:center;color:var(--text-muted)">No open issues found.</td></tr>`;
    return;
  }
  tbody.innerHTML = data.map(d => `
    <tr class="ip-issue-row" data-id="${d.IssueId}"
        style="cursor:pointer;border-bottom:1px solid var(--border);transition:background .15s">
      <td style="padding:7px 10px;font-weight:700;color:var(--accent)">${d.IssueId}</td>
      <td style="padding:7px 10px">${d.RequestId || '&#8212;'}</td>
      <td style="padding:7px 10px">${d.RequestByEmpId || '&#8212;'}</td>
      <td style="padding:7px 10px">
        <span style="padding:2px 8px;border-radius:10px;font-size:11px;background:rgba(245,158,11,.18);color:#fbbf24">${d.IsIssueClose || 'Open'}</span>
      </td>
      <td style="padding:7px 10px">${d.RequestMode || '&#8212;'}</td>
    </tr>`).join('');
  // Row click
  tbody.querySelectorAll('.ip-issue-row').forEach(row => {
    row.onmouseenter = () => { if (row.dataset.id != _ipSelectedIssue) row.style.background = 'var(--bg-hover)'; };
    row.onmouseleave = () => { if (row.dataset.id != _ipSelectedIssue) row.style.background = ''; };
    row.onclick = () => _ipSelectIssue(data.find(d => String(d.IssueId) === row.dataset.id), row);
  });
}

function _ipHighlightRow(activeRow) {
  document.querySelectorAll('.ip-issue-row').forEach(r => {
    r.style.background = r === activeRow ? 'rgba(99,102,241,.22)' : '';
  });
}

async function _ipSelectIssue(issue, row) {
  _ipSelectedIssue = issue?.IssueId || null;
  _ipIssueData = issue;
  _ipHighlightRow(row);
  const badge = $('#ip-issue-badge');
  if (badge) badge.textContent = issue ? `Issue #${issue.IssueId}` : '';
  await _ipLoadPendingItems();
}

async function _ipLoadPendingItems() {
  const tbody = $('#tbl-ip-items'); if (!tbody) return;
  if (!_ipSelectedIssue) {
    tbody.innerHTML = `<tr class="empty-row"><td colspan="4" style="padding:18px;text-align:center;color:var(--text-muted)">Click an Issue row to view its pending items.</td></tr>`;
    return;
  }
  let items = [];
  try { items = await api(`/api/issue-pending/${_ipSelectedIssue}/items`); } catch (_) { }
  if (!items.length) {
    tbody.innerHTML = `<tr class="empty-row"><td colspan="4" style="padding:18px;text-align:center;color:var(--text-muted)">No pending items for this issue.</td></tr>`;
    return;
  }
  tbody.innerHTML = items.map((it, idx) => `
    <tr style="border-bottom:1px solid var(--border)">
      <td style="padding:6px 10px;text-align:center">
        <input type="checkbox" class="ip-item-chk" value="${it.IssueItemId}"/></td>
      <td style="padding:6px 10px;text-align:center;color:var(--text-muted)">${idx + 1}</td>
      <td style="padding:6px 10px;font-weight:600">${it.ItemName || '&#8212;'}</td>
      <td style="padding:6px 10px;text-align:center;color:var(--warning);font-weight:700">${it.PendingQty}</td>
    </tr>`).join('');
  // Re-wire select-all
  const chkAll = $('#ip-chk-all');
  if (chkAll) chkAll.checked = false;
  // When any item checkbox is first checked, auto-populate delivery details from original issue
  document.querySelectorAll('.ip-item-chk').forEach(chk => {
    chk.onchange = () => { if (chk.checked) _ipAutoFillDeliveryFromIssue(); };
  });
}

function _ipClearItems() {
  const tbody = $('#tbl-ip-items');
  if (tbody) tbody.innerHTML = `<tr class="empty-row"><td colspan="4" style="padding:18px;text-align:center;color:var(--text-muted)">Click an Issue row to view its pending items.</td></tr>`;
  const badge = $('#ip-issue-badge'); if (badge) badge.textContent = '';
}

function _ipSetField(id, enabled) {
  const el = $(id); if (!el) return;
  el.disabled = !enabled; el.style.opacity = enabled ? '1' : '0.45';
}
function _ipApplyDelMode() {
  const mode = $('#ip-delmode')?.value || '';
  const isHand = mode === 'Hand', isCourier = mode === 'Courier';
  _ipSetField('#ip-pname', isHand);
  ['#ip-courier', '#ip-cmob', '#ip-tid', '#ip-cloc'].forEach(id => _ipSetField(id, isCourier));
  if (!isHand) { const p = $('#ip-pname'); if (p) p.value = ''; }
  if (!isCourier) {
    ['#ip-courier', '#ip-cmob', '#ip-tid', '#ip-cloc'].forEach(id => { const el = $(id); if (el) el.value = ''; });
  } else {
    // When switching back to Courier, re-populate from the original issue's delivery details
    _ipAutoFillDeliveryFromIssue();
  }
}

// Auto-populate all Delivery Details fields from the original issue record
function _ipAutoFillDeliveryFromIssue() {
  if (!_ipIssueData) return;
  const { DeliverMode, DeliverByPersonName, CourierId, CourierPersonMob, CourierPersonLocation } = _ipIssueData;
  // Apply deliver mode
  const delModeEl = $('#ip-delmode');
  if (delModeEl && DeliverMode) delModeEl.value = DeliverMode;
  const isCourier = DeliverMode === 'Courier';
  const isHand    = DeliverMode === 'Hand';
  // Enable/disable fields
  _ipSetField('#ip-pname', isHand);
  ['#ip-courier', '#ip-cmob', '#ip-tid', '#ip-cloc'].forEach(id => _ipSetField(id, isCourier));
  // Fill Person Name
  const pnameEl = $('#ip-pname');
  if (pnameEl) pnameEl.value = DeliverByPersonName || '';
  // Fill Courier fields
  if (isCourier) {
    const courierId  = String(CourierId || '');
    const courierSel = $('#ip-courier');
    if (courierSel && courierId) courierSel.value = courierId;
    const mobEl = $('#ip-cmob');
    if (mobEl) mobEl.value = CourierPersonMob || '';
    const locEl = $('#ip-cloc');
    if (locEl) locEl.value = CourierPersonLocation || '';
  }
}

// When courier dropdown is manually changed, update Mobile Number from Courier master
function _ipAutoFillCourierMob() {
  const courierId = $('#ip-courier')?.value;
  const courier   = _ipCouriers.find(c => String(c.CourierID || c.CourierId) === courierId);
  const mobEl     = $('#ip-cmob');
  if (mobEl && courier) mobEl.value = courier.Mob || '';
}

function _ipReset() {
  _ipSelectedIssue = null; _ipIssueData = null;
  ['#ip-div', '#ip-item', '#ip-delmode', '#ip-courier'].forEach(id => { const el = $(id); if (el) el.value = ''; });
  ['#ip-pname', '#ip-cmob', '#ip-tid', '#ip-cloc', '#ip-note'].forEach(id => { const el = $(id); if (el) el.value = ''; });
  const d = $('#ip-date'); if (d) d.value = new Date().toISOString().split('T')[0];
  ['#ip-pname', '#ip-courier', '#ip-cmob', '#ip-tid', '#ip-cloc'].forEach(id => _ipSetField(id, false));
  _ipClearItems();
  const issuesTb = $('#tbl-ip-issues');
  if (issuesTb) issuesTb.innerHTML = `<tr class="empty-row"><td colspan="5" style="padding:18px;text-align:center;color:var(--text-muted)">Select a Division to load issues.</td></tr>`;
  _ipItems = [];
  const itemSel = $('#ip-item'); if (itemSel) itemSel.innerHTML = '<option value="">&#8212; All Items &#8212;</option>';
  showToast('Form reset', 'info');
}

async function _ipSave() {
  const selected = [...document.querySelectorAll('.ip-item-chk:checked')].map(c => c.value);
  if (!selected.length) return showToast('Select at least one pending item', 'error');
  if (!_ipSelectedIssue) return showToast('Select an Issue first', 'error');
  const delMode = $('#ip-delmode')?.value;
  if (!delMode) return showToast('Deliver Mode is required', 'error');
  if (delMode === 'Hand' && !$('#ip-pname')?.value?.trim()) return showToast('Person Name is required', 'error');
  if (delMode === 'Courier' && !$('#ip-courier')?.value) return showToast('Courier Name is required', 'error');

  const body = {
    selectedItemIds: selected,
    oldIssueId: _ipSelectedIssue,
    IssueDate: $('#ip-date')?.value || new Date().toISOString().split('T')[0],
    DeliverMode: delMode,
    DeliverByPersonName: $('#ip-pname')?.value?.trim() || null,
    CourierId: delMode === 'Courier' ? ($('#ip-courier')?.value || null) : null,
    CourierName: delMode === 'Courier' ? ($('#ip-courier')?.selectedOptions[0]?.text || null) : null,
    TrackId: $('#ip-tid')?.value?.trim() || null,
    CourierPersonMob: $('#ip-cmob')?.value?.trim() || null,
    CourierPersonLocation: $('#ip-cloc')?.value?.trim() || null,
    IssueNote: $('#ip-note')?.value?.trim() || null,
    // carry over header from the original issue
    DivisionId: _ipIssueData?.DivisionId || null,
    DistCode: _ipIssueData?.DistCode || null,
    RequestMode: _ipIssueData?.RequestMode || null,
  };
  try {
    const res = await api('/api/issue-pending/resolve', { method: 'POST', body });
    showToast(`Pending issue resolved! New Issue #${res.newIssueId} created.`, 'success');
    // Reload issue list then fully reset the form
    const savedDivId = $('#ip-div')?.value || '';
    _ipReset();
    // Restore division so user doesn't have to re-select it
    const divSel = $('#ip-div');
    if (divSel && savedDivId) {
      divSel.value = savedDivId;
      await _ipLoadIssues();
    }
  } catch (e) { showToast('Save failed: ' + e.message, 'error'); }
}


