
const fs = require('fs');
let t = fs.readFileSync('public/pages-transactions.js', 'utf8');
t = t.replace(/\r\n/g, '\n');

// ── 1. Change vendor select option text to "Name (CompanyName)" ──────────────
const OLD_VEN_OPT = '`<option value="${v.vendorid || v.VendorID}">${v.Name || v.VendorName}</option>`';
const NEW_VEN_OPT = '`<option value="${v.vendorid || v.VendorID}" data-company="${v.CompanyName || ""}">${(v.Name || v.VendorName) + (v.CompanyName ? " (" + v.CompanyName + ")" : "")}</option>`';

if (t.includes(OLD_VEN_OPT)) { t = t.replace(OLD_VEN_OPT, NEW_VEN_OPT); console.log('OK: vendor option format updated'); }
else { console.error('NOT FOUND: vendor option'); const idx = t.indexOf('v.VendorName}'); console.log('context:', JSON.stringify(t.substring(idx-60,idx+40))); }

// ── 2. Replace the plain vendor <select> in the HTML with select + search btn ─
const OLD_VEND_DIV = '<div ${_IW_FIELD}><label ${_IW_LABEL}>Vendor Name <span style="color:var(--danger)">*</span></label>\n          <select id="iw-vendor" ${_IW_SELECT}><option value="">&#8212; Select Vendor &#8212;</option></select></div>';

const NEW_VEND_DIV = `<div \${_IW_FIELD}><label \${_IW_LABEL}>Vendor Name <span style="color:var(--danger)">*</span></label>
          <div style="display:flex;gap:6px;align-items:center">
            <select id="iw-vendor" \${_IW_SELECT} style="flex:1"><option value="">&#8212; Select Vendor &#8212;</option></select>
            <button type="button" onclick="window._iwOpenVendorSearch()" title="Search Vendor"
              style="padding:6px 10px;background:var(--accent);border:none;border-radius:6px;color:#fff;cursor:pointer;flex-shrink:0;font-size:13px">
              <i class="fas fa-magnifying-glass"></i></button>
          </div></div>`;

if (t.includes(OLD_VEND_DIV)) { t = t.replace(OLD_VEND_DIV, NEW_VEND_DIV); console.log('OK: vendor select + search button'); }
else { console.error('NOT FOUND: vendor div'); const idx = t.indexOf('iw-vendor'); console.log('context:', JSON.stringify(t.substring(idx-20,idx+120))); }

// ── 3. Inject _iwOpenVendorSearch function after the _iwSelectPreviewRow block ─
const INJECT_AFTER = 'window._iwSelectPreviewRow = (i) => {';
const idx = t.indexOf(INJECT_AFTER);
const VENDOR_SEARCH_FN = `
/* ---- Vendor Search Modal (opens on search button click) ---- */
window._iwOpenVendorSearch = () => {
  const existing = document.getElementById('iw-vendor-search-modal');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = 'iw-vendor-search-modal';
  overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,.55);z-index:9999;display:flex;align-items:center;justify-content:center';
  overlay.innerHTML = \`
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
        <div style="padding:18px;text-align:center;color:var(--text-muted);font-size:13px">Loading…</div>
      </div>
    </div>\`;

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
    listEl.innerHTML = filtered.map(v => \`
      <div class="iw-vnd-item" data-id="\${v.vendorid || v.VendorID}"
        style="padding:10px 14px;cursor:pointer;border-bottom:1px solid var(--border);transition:background .12s"
        onmouseover="this.style.background='var(--bg-hover)'" onmouseout="this.style.background=''">
        <div style="font-weight:600;color:var(--text-primary);font-size:13px">\${v.Name || '-'}</div>
        \${v.CompanyName ? \`<div style="font-size:11px;color:var(--text-muted);margin-top:2px">\${v.CompanyName}</div>\` : ''}
      </div>\`).join('');

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

`;

if (idx > -1) {
  t = t.slice(0, idx) + VENDOR_SEARCH_FN + t.slice(idx);
  console.log('OK: _iwOpenVendorSearch injected');
} else {
  console.error('NOT FOUND: inject point for _iwOpenVendorSearch');
}

fs.writeFileSync('public/pages-transactions.js', t);
console.log('DONE pages-transactions.js');
