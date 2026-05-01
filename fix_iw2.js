
const fs = require('fs');
let t = fs.readFileSync('public/pages-transactions.js', 'utf8');
t = t.replace(/\r\n/g, '\n');

// The button currently shows plain "Add Item to List" — make it dynamic
const OLD_ADDBTN = '<button class="btn btn-success btn-sm" id="btn-iw-add-row">\n          <i class="fas fa-plus"></i> Add Item to List</button>';
const NEW_ADDBTN = '<button class="btn btn-success btn-sm" id="btn-iw-add-row">\n          ${_iwEditingIndex !== null ? \'<i class=\\"fas fa-pen-to-square\\"></i> Update Item\' : \'<i class=\\"fas fa-plus\\"></i> Add Item to List\'}</button>';

if (t.includes(OLD_ADDBTN)) {
  t = t.replace(OLD_ADDBTN, NEW_ADDBTN);
  console.log('OK: Add button label made dynamic');
} else {
  console.error('NOT FOUND: Add button. Looking for context...');
  const idx = t.indexOf('btn-iw-add-row');
  if (idx > -1) console.log('Context:', JSON.stringify(t.substring(idx - 60, idx + 200)));
}

// Also add _iwSelectPreviewRow if not already there (check _iwRemoveLine area)
if (!t.includes('window._iwSelectPreviewRow')) {
  // Inject after _iwRemoveLine
  const AFTER = 'window._iwRemoveLine = (i) => {';
  const idx = t.indexOf(AFTER);
  if (idx > -1) {
    const selectFn = `\n\n/* ---- Select a preview row for editing ---- */
window._iwSelectPreviewRow = (i) => {
  const l = _iwLines[i]; if (!l) return;
  _iwEditingIndex = i;
  _iwRenderItemPanel();

  const itemSel = document.getElementById('iwf-item');
  if (itemSel) {
    if (!itemSel.querySelector('[value="' + l.ItemId + '"]')) {
      const op = document.createElement('option');
      op.value = l.ItemId; op.text = l.ItemName;
      op.dataset.cat = l.CategoryId || ''; op.dataset.catname = l.CategoryName || '';
      const vi = _iwVendorItems.find(function(v){ return String(v.ItemId) === String(l.ItemId); });
      op.dataset.rate = vi ? (vi.DefaultRate || 0) : (l.Rate || 0);
      itemSel.appendChild(op);
    }
    itemSel.value = l.ItemId;
    itemSel.disabled = true; itemSel.style.opacity = '0.65'; itemSel.style.cursor = 'not-allowed';
  }
  const dcEl = document.getElementById('iwf-dcqty');
  if (dcEl) { dcEl.value = l.DCQty; dcEl.disabled = true; dcEl.style.opacity = '0.65'; }

  const qEl = document.getElementById('iwf-qty'); if (qEl) qEl.value = l.TotalQty;

  const vi = _iwVendorItems.find(function(v){ return String(v.ItemId) === String(l.ItemId); });
  const rate = l.Rate > 0 ? l.Rate : (vi ? (vi.DefaultRate || 0) : 0);
  const rateEl = document.getElementById('iwf-rate');
  if (rateEl) { rateEl.value = rate; rateEl.dispatchEvent(new Event('input')); }

  const statEl = document.getElementById('iwf-status');
  if (statEl) { statEl.value = l.ItemStatus || 'Complete'; statEl.dispatchEvent(new Event('change')); }

  const onEl = document.getElementById('iw-order-num');
  if (onEl && onEl.value && onEl.value.trim()) {
    const vendEl = document.getElementById('iw-vendor');
    if (vendEl) { vendEl.disabled = true; vendEl.style.opacity = '0.65'; }
  }
  _iwRenderPreview();
  showToast('Editing row ' + (i + 1) + ': ' + l.ItemName, 'info');
};\n`;
    t = t.slice(0, idx) + selectFn + t.slice(idx);
    console.log('OK: _iwSelectPreviewRow injected');
  }
}

fs.writeFileSync('public/pages-transactions.js', t);
console.log('DONE');
