
const fs = require('fs');
let t = fs.readFileSync('public/pages-transactions.js', 'utf8');
t = t.replace(/\r\n/g, '\n');

// ── 1. Guard _iwSelectPreviewRow so it bails if we are in View Records mode ──
const OLD_SELECT_TOP = `window._iwSelectPreviewRow = (i) => {
  const l = _iwLines[i]; if (!l) return;
  _iwEditingIndex = i;
  _iwRenderItemPanel(); // regenerates form with "Update Item" button label`;

const NEW_SELECT_TOP = `window._iwSelectPreviewRow = (i) => {
  // Locked in View-Records mode — inwarded items must not be modified
  if (_iwEditId !== null) {
    showToast('This record has already been inwarded and cannot be edited.', 'warning');
    return;
  }
  const l = _iwLines[i]; if (!l) return;
  _iwEditingIndex = i;
  _iwRenderItemPanel(); // regenerates form with "Update Item" button label`;

if (t.includes(OLD_SELECT_TOP)) {
  t = t.replace(OLD_SELECT_TOP, NEW_SELECT_TOP);
  console.log('OK: _iwSelectPreviewRow guard added');
} else {
  console.error('NOT FOUND: _iwSelectPreviewRow top');
}

// ── 2. Make preview rows read-only when _iwEditId is set (View Records mode) ─
// The row template has onclick and two buttons. When _iwEditId != null we
// want: no cursor, no onclick, no edit/remove buttons, just a lock icon.
const OLD_ROW_OPEN = `    return \`<tr style="border-bottom:1px solid var(--border);cursor:pointer;\${rowBg}transition:background .15s"
        onclick="window._iwSelectPreviewRow(\${i})">`;

const NEW_ROW_OPEN = `    // View Records mode → read-only rows (no click, no edit/remove)
    if (_iwEditId !== null) {
      return \`<tr style="border-bottom:1px solid var(--border);background:rgba(100,100,100,.04)">
      <td style="padding:6px 8px;text-align:center;color:var(--text-muted)">\${i + 1}</td>
      <td style="padding:6px 8px">\${l.CategoryName || '&#8212;'}</td>
      <td style="padding:6px 8px;font-weight:600">\${l.ItemName}</td>
      <td style="padding:6px 8px;text-align:center">\${l.DCQty}</td>
      <td style="padding:6px 8px;text-align:center">\${l.TotalQty}</td>
      <td style="padding:6px 8px;text-align:center">&#8377;\${l.Rate}</td>
      <td style="padding:6px 8px;text-align:right;color:var(--accent);font-weight:600">&#8377;\${fmtNum(l.TotalAmt)}</td>
      <td style="padding:6px 8px;text-align:center">
        <span style="padding:2px 8px;border-radius:10px;font-size:11px;background:\${_iwStatusColor(l.ItemStatus)}">\${l.ItemStatus}</span>
      </td>
      <td style="padding:6px 8px;font-size:11px">\${l.Reason || '&#8212;'}</td>
      <td style="padding:6px 8px;text-align:center;font-size:11px">\${l.ReturnMode || '&#8212;'}</td>
      <td style="padding:6px 8px;font-size:11px">\${l.PersonName || l.CourierName || '&#8212;'}</td>
      <td style="padding:6px 8px;text-align:center;font-size:11px">\${l.ReturnDate || '&#8212;'}</td>
      <td style="padding:6px 8px;font-size:11px">\${l.TrackId || '&#8212;'}</td>
      <td style="padding:6px 8px;text-align:center">
        <i class="fas fa-lock" style="color:var(--text-muted);font-size:12px" title="Inwarded — read only"></i>
      </td>
    </tr>\`;
    }
    return \`<tr style="border-bottom:1px solid var(--border);cursor:pointer;\${rowBg}transition:background .15s"
        onclick="window._iwSelectPreviewRow(\${i})">`;

if (t.includes(OLD_ROW_OPEN)) {
  t = t.replace(OLD_ROW_OPEN, NEW_ROW_OPEN);
  console.log('OK: Preview row read-only branch added');
} else {
  console.error('NOT FOUND: row open template');
}

// ── 3. Show a "locked" notice in the Item Entry panel when _iwEditId is set ─
// _iwRenderItemPanel renders the panel HTML. We just need to detect view mode
// and show a notice instead of the form.
const OLD_PANEL_START = `function _iwRenderItemPanel() {
  const panel = $('#iw-item-panel'); if (!panel) return;`;

const NEW_PANEL_START = `function _iwRenderItemPanel() {
  const panel = $('#iw-item-panel'); if (!panel) return;
  // View Records mode — lock the Item Entry section entirely
  if (_iwEditId !== null) {
    panel.innerHTML = \`<div style="display:flex;align-items:center;gap:12px;padding:18px 16px;
        background:rgba(100,100,100,.07);border-radius:8px;border:1px dashed var(--border)">
      <i class="fas fa-lock" style="color:var(--text-muted);font-size:20px"></i>
      <div>
        <div style="font-weight:600;color:var(--text-primary);font-size:13px">Item Entry Disabled</div>
        <div style="font-size:12px;color:var(--text-muted);margin-top:2px">
          This inward has already been saved. Items cannot be modified from the view mode.
          
        </div>
      </div>
    </div>\`;
    return;
  }`;

if (t.includes(OLD_PANEL_START)) {
  t = t.replace(OLD_PANEL_START, NEW_PANEL_START);
  console.log('OK: _iwRenderItemPanel locked notice added');
} else {
  console.error('NOT FOUND: _iwRenderItemPanel start');
}

// ── 4. Disable Inward Details fields when in View Records mode ───────────────
// Find where the inward page binders are set up and disable detail fields
// when _iwEditId is loaded from View Records.
// The function that loads an existing inward for viewing is the one that
// sets _iwEditId. Find it and ensure it also calls _disableInwardDetailsForView().

// First, let's find the load-from-view-records function. It likely does:
// _iwEditId = inward.InwardId; or similar
// We'll add a helper that gets called after populating from View Records.

// Find where _iwEditId is set from view records mode — search for the pattern
const idx1 = t.indexOf('_iwEditId =');
const idx2 = t.indexOf("_iwEditId=");
console.log('_iwEditId = at:', idx1, 'context:', idx1 > -1 ? JSON.stringify(t.substring(idx1 - 20, idx1 + 80)) : 'N/A');
console.log('_iwEditId= at:', idx2, 'context:', idx2 > -1 ? JSON.stringify(t.substring(idx2 - 20, idx2 + 80)) : 'N/A');

fs.writeFileSync('public/pages-transactions.js', t);
console.log('DONE');
