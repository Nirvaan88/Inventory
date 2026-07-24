const fs = require('fs');
const path = 'c:/Dikshant/Kisna_IMS/public/pages-masters2.js';
let txt = fs.readFileSync(path, 'utf8');

// The file currently has a corrupted top. We need to:
// 1. Find the end of the old commented-out block — the */ marker followed by vendor table content
// 2. Replace everything from the start up to the vendor table-wrapper div

// Find where the real vendor page content starts (the table-wrapper div)
const tableWrapperIdx = txt.indexOf('<div class="table-wrapper" style="overflow-x:auto">');
if (tableWrapperIdx === -1) {
  console.error('Could not find table-wrapper div');
  process.exit(1);
}

// The correct header that should precede the table-wrapper
const correctHeader = `/* ================================================
   PAGES: Item Master, Vendor, Dealer, User, Login, Kit, Mapping
   ================================================ */

// -------- ITEM MASTER --------
// Full-featured Item Master is now in pages-masters.js - do not re-register here.
// registerPage('items', ...) REMOVED to avoid overriding the correct version.

// -------- VENDOR MASTER (Full-Featured) --------
let _vendorStates = [], _vendorCities = [];

registerPage('vendors', () => {
  return \`\${pageHeader('Vendor Details', 'fa-truck', 'Masters / Vendor Details',
    \`<button class="btn btn-success" id="btn-vendor-bulk-upload" style="margin-right:8px"><i class="fas fa-file-arrow-up"></i>  Upload Excel</button><button class="btn btn-primary" id="btn-add-vendor"><i class="fas fa-plus"></i>  Add New</button>\`)}
  <div class="card">
    <div class="search-bar">
      <div class="search-input-wrap">
        <i class="fas fa-search"></i>
        <input type="text" id="vendor-search" placeholder="Search vendor name, company, GST, city...">
      </div>
      <select id="vendor-state-filter"
        style="background:var(--bg-dark);border:1px solid var(--border);border-radius:6px;
               padding:8px 14px;color:var(--text-primary);font-size:13.5px;cursor:pointer;min-width:170px">
        <option value="">All States</option>
      </select>
    </div>
    `;

const fixedTxt = correctHeader + txt.substring(tableWrapperIdx);
fs.writeFileSync(path, fixedTxt);
console.log('Fixed! New file starts with:');
console.log(fixedTxt.substring(0, 200));
