
const fs = require('fs');
let t = fs.readFileSync('public/pages-transactions.js', 'utf8');
t = t.replace(/\r\n/g, '\n'); // normalize CRLF->LF

// ── 1. Replace _iwRenderPreview rows + _iwRemoveLine + add _iwSelectPreviewRow ─
const OLD_REMOVE = `window._iwRemoveLine = (i) => { _iwLines.splice(i, 1); _iwRenderPreview(); };`;
const NEW_REMOVE = `window._iwRemoveLine = (i) => {
  if (_iwEditingIndex === i) { _iwEditingIndex = null; }
  else if (_iwEditingIndex !== null && _iwEditingIndex > i) { _iwEditingIndex--; }
  _iwLines.splice(i, 1);
  _iwRenderPreview();
  if (_iwEditingIndex === null) _iwRenderItemPanel();
};

/* ---- Select a preview row for editing (Issues #2, #3) ---- */
window._iwSelectPreviewRow = (i) => {
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
};`;

if (t.includes(OLD_REMOVE)) {
  t = t.replace(OLD_REMOVE, NEW_REMOVE);
  console.log('OK: _iwRemoveLine replaced + _iwSelectPreviewRow added');
} else {
  console.error('NOT FOUND: _iwRemoveLine');
}

// ── 2. Make preview rows clickable ────────────────────────────────────────────
// Find the map block and add onclick + edit button
// Replace the static <tr> start with clickable version
const OLD_TR = `  tbody.innerHTML = _iwLines.map((l, i) => \`
    <tr style="border-bottom:1px solid var(--border)">`;
const NEW_TR = `  tbody.innerHTML = _iwLines.map((l, i) => {
    const rowBg = _iwEditingIndex === i ? 'background:rgba(99,102,241,.12);' : '';
    return \`
    <tr style="border-bottom:1px solid var(--border);cursor:pointer;\${rowBg}transition:background .15s"
        onclick="window._iwSelectPreviewRow(\${i})">`;

if (t.includes(OLD_TR)) {
  t = t.replace(OLD_TR, NEW_TR);
  console.log('OK: TR open replaced');
} else {
  console.error('NOT FOUND: TR open');
}

// Replace remove button cell + closing tag
const OLD_BTN = `      <td style="padding:6px 8px;text-align:center">
        <button class="btn btn-danger btn-icon btn-sm" onclick="_iwRemoveLine(\${i})" title="Remove">
          <i class="fas fa-minus"></i></button></td>
    </tr>\`).join('');`;
const NEW_BTN = `      <td style="padding:6px 8px;text-align:center;white-space:nowrap">
        <button class="btn btn-secondary btn-icon btn-sm" title="Edit"
          onclick="event.stopPropagation();window._iwSelectPreviewRow(\${i})" style="margin-right:4px">
          <i class="fas fa-pen-to-square"></i></button>
        <button class="btn btn-danger btn-icon btn-sm" title="Remove"
          onclick="event.stopPropagation();window._iwRemoveLine(\${i})">
          <i class="fas fa-minus"></i></button></td>
    </tr>\`;
  }).join('');`;

if (t.includes(OLD_BTN)) {
  t = t.replace(OLD_BTN, NEW_BTN);
  console.log('OK: Button cell replaced');
} else {
  console.error('NOT FOUND: Button cell');
}

// ── 3. Fix rate in _iwLoadFromOrder ──────────────────────────────────────────
const OLD_RATE = `    _iwLines = (order.Items || []).filter(it => it.ItemId).map(it => ({
      ItemId: String(it.ItemId), ItemName: it.ItemName || '',
      CategoryId: String(it.CategoryId || ''), CategoryName: it.CategoryName || '',
      DCQty: it.TotalQty || 0, TotalQty: it.TotalQty || 0,
      Rate: it.Rate || 0, TotalAmt: it.TotalAmt || 0,
      ItemStatus: 'Complete', Reason: '', ReturnMode: '', PersonName: '',
      CourierName: '', CourierId: '', ReturnDate: '', TrackId: ''
    }));`;
const NEW_RATE = `    _iwLines = (order.Items || []).filter(it => it.ItemId).map(it => {
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
    if (vendEl) { vendEl.disabled = true; vendEl.style.opacity = '0.65'; }`;

if (t.includes(OLD_RATE)) {
  t = t.replace(OLD_RATE, NEW_RATE);
  console.log('OK: Rate fix in _iwLoadFromOrder');
} else {
  console.error('NOT FOUND: _iwLoadFromOrder rate block');
}

// ── 4. Update _iwAddLineToPreview to handle Edit mode (Issue #4) ─────────────
const OLD_ADD_TOP = `function _iwAddLineToPreview() {
  const itemSel = $('#iwf-item');
  if (!itemSel || !itemSel.value) return showToast('Select an item', 'error');`;
const NEW_ADD_TOP = `function _iwAddLineToPreview() {
  const itemSel = $('#iwf-item');
  if (!itemSel || !itemSel.value) return showToast('Select an item', 'error');
  const isEditMode = _iwEditingIndex !== null;`;

if (t.includes(OLD_ADD_TOP)) {
  t = t.replace(OLD_ADD_TOP, NEW_ADD_TOP);
  console.log('OK: _iwAddLineToPreview top patched');
} else {
  console.error('NOT FOUND: _iwAddLineToPreview top');
}

// After building the object, intercept push to do update instead
const OLD_PUSH = `  _iwLines.push({
    ItemId: itemSel.value, ItemName: opt.text,
    CategoryId: opt.dataset.cat, CategoryName: opt.dataset.catname,
    DCQty: dcqty, TotalQty: qty, Rate: rate, TotalAmt: qty * rate,
    ItemStatus: stat, Reason: reasonOther || reason,
    ReturnMode: rmode, PersonName: pname,
    CourierName: courierName, CourierId: courierId,
    ReturnDate: retDate, TrackId: trackId
  });
  _iwRenderPreview();
  _iwRenderItemPanel(); // reset form row
  showToast('Item added to list', 'success');`;
const NEW_PUSH = `  const lineObj = {
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
  }`;

if (t.includes(OLD_PUSH)) {
  t = t.replace(OLD_PUSH, NEW_PUSH);
  console.log('OK: _iwAddLineToPreview push/update replaced');
} else {
  console.error('NOT FOUND: push block');
}

// ── 5. Cancel button also resets edit mode + re-enables vendor ────────────────
const OLD_CANCEL = `  $('#btn-iw-cancel').onclick = () => {
    _iwLines = []; _iwRenderPreview(); _iwRenderItemPanel();
    ['#iw-order-num', '#iw-dc-num', '#iw-inv-num'].forEach(id => { const el = $(id); if (el) el.value = ''; });
    const dSel = $('#iw-date'); if (dSel) dSel.value = new Date().toISOString().split('T')[0];
    const vSel = $('#iw-vendor'); if (vSel) vSel.value = '';
    const dvSel = $('#iw-div'); if (dvSel) dvSel.value = '';
  };`;
const NEW_CANCEL = `  $('#btn-iw-cancel').onclick = () => {
    _iwLines = []; _iwEditingIndex = null;
    const vendEl = $('#iw-vendor');
    if (vendEl) { vendEl.disabled = false; vendEl.style.opacity = '1'; vendEl.value = ''; }
    _iwRenderPreview(); _iwRenderItemPanel();
    ['#iw-order-num', '#iw-dc-num', '#iw-inv-num'].forEach(id => { const el = $(id); if (el) el.value = ''; });
    const dSel = $('#iw-date'); if (dSel) dSel.value = new Date().toISOString().split('T')[0];
    const dvSel = $('#iw-div'); if (dvSel) dvSel.value = '';
  };`;

if (t.includes(OLD_CANCEL)) {
  t = t.replace(OLD_CANCEL, NEW_CANCEL);
  console.log('OK: Cancel handler updated');
} else {
  console.error('NOT FOUND: Cancel handler');
}

// ── 6. _iwRenderItemPanel button label based on edit mode ─────────────────────
// The button is rendered inside _iwRenderItemPanel's HTML. We need to find it.
// Looking for the Add Item to List button
const OLD_BTN_LBL = `id="btn-iw-add-row"`;
// We need to change the button HTML to reflect the edit mode. The button is at the bottom.
// Find the Add Item button and make its label dynamic
const OLD_ADD_BTN = `<button class="btn btn-primary btn-sm" id="btn-iw-add-row">
          <i class="fas fa-plus"></i> Add Item to List</button>`;
const NEW_ADD_BTN = `<button class="btn btn-primary btn-sm" id="btn-iw-add-row">
          \${_iwEditingIndex !== null ? '<i class=\\"fas fa-pen-to-square\\"></i> Update Item' : '<i class=\\"fas fa-plus\\"></i> Add Item to List'}</button>`;

if (t.includes(OLD_ADD_BTN)) {
  t = t.replace(OLD_ADD_BTN, NEW_ADD_BTN);
  console.log('OK: Add button label dynamic');
} else {
  // Try alternate search
  const idx = t.indexOf('btn-iw-add-row');
  console.log('btn-iw-add-row at index:', idx);
  console.log('Context:', t.substring(idx - 10, idx + 120));
}

fs.writeFileSync('public/pages-transactions.js', t);
console.log('DONE - file written');
