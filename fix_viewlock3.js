
const fs = require('fs');
let t = fs.readFileSync('public/pages-transactions.js', 'utf8');
t = t.replace(/\r\n/g, '\n');

// ── 1. After loading from View Records, disable all Inward Detail fields ────
const OLD_AFTER_LOAD = `    _iwRenderPreview(); _iwRenderItemPanel();
    showToast(\`Loaded Inward #\${id} for`;

const NEW_AFTER_LOAD = `    _iwRenderPreview(); _iwRenderItemPanel();
    // Lock all Inward Detail inputs — view mode only
    ['#iw-vendor','#iw-div','#iw-order-num','#iw-dc-num','#iw-inv-num','#iw-date'].forEach(sel => {
      const el = $(sel); if (!el) return;
      el.disabled = true; el.style.opacity = '0.6'; el.style.cursor = 'not-allowed';
    });
    const saveBtnV = $('#btn-iw-save');
    if (saveBtnV) { saveBtnV.disabled = true; saveBtnV.style.opacity = '0.4'; saveBtnV.title = 'View mode — cannot save'; }
    showToast(\`Loaded Inward #\${id} for`;

if (t.includes(OLD_AFTER_LOAD)) {
  t = t.replace(OLD_AFTER_LOAD, NEW_AFTER_LOAD);
  console.log('OK: Inward Details disabled after View Records load');
} else {
  console.error('NOT FOUND: after-load render line');
}

// ── 2. Cancel handler — also reset _iwEditId and re-enable Inward Details ──
const OLD_CANCEL = `  $('#btn-iw-cancel').onclick = () => {
    _iwLines = []; _iwEditingIndex = null;
    const vendEl = $('#iw-vendor');
    if (vendEl) { vendEl.disabled = false; vendEl.style.opacity = '1'; vendEl.value = ''; }
    _iwRenderPreview(); _iwRenderItemPanel();
    ['#iw-order-num', '#iw-dc-num', '#iw-inv-num'].forEach(id => { const el = $(id); if (el) el.value = ''; });
    const dSel = $('#iw-date'); if (dSel) dSel.value = new Date().toISOString().split('T')[0];
    const dvSel = $('#iw-div'); if (dvSel) dvSel.value = '';
  };`;

const NEW_CANCEL = `  $('#btn-iw-cancel').onclick = () => {
    _iwLines = []; _iwEditingIndex = null; _iwEditId = null;
    // Re-enable all Inward Detail fields
    ['#iw-vendor','#iw-div','#iw-order-num','#iw-dc-num','#iw-inv-num','#iw-date'].forEach(sel => {
      const el = $(sel); if (!el) return;
      el.disabled = false; el.style.opacity = '1'; el.style.cursor = '';
    });
    const saveBtnC = $('#btn-iw-save');
    if (saveBtnC) { saveBtnC.disabled = false; saveBtnC.style.opacity = '1'; saveBtnC.title = ''; }
    _iwRenderPreview(); _iwRenderItemPanel();
    ['#iw-order-num', '#iw-dc-num', '#iw-inv-num'].forEach(id => { const el = $(id); if (el) el.value = ''; });
    const dSel = $('#iw-date'); if (dSel) dSel.value = new Date().toISOString().split('T')[0];
    const dvSel = $('#iw-div'); if (dvSel) dvSel.value = '';
  };`;

if (t.includes(OLD_CANCEL)) {
  t = t.replace(OLD_CANCEL, NEW_CANCEL);
  console.log('OK: Cancel handler updated — _iwEditId reset + fields re-enabled');
} else {
  console.error('NOT FOUND: Cancel handler');
}

fs.writeFileSync('public/pages-transactions.js', t);
console.log('DONE');
