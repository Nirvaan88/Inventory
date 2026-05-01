
const fs = require('fs');
let t = fs.readFileSync('public/pages-transactions.js', 'utf8');
t = t.replace(/\r\n/g, '\n');

// The actual row open in the file (after previous fix) is:
const OLD_ROW = `    return \`
    <tr style="border-bottom:1px solid var(--border);cursor:pointer;\${rowBg}transition:background .15s"
        onclick="window._iwSelectPreviewRow(\${i})">`;

const NEW_ROW = `    // View Records mode → read-only rows (locked)
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
    return \`
    <tr style="border-bottom:1px solid var(--border);cursor:pointer;\${rowBg}transition:background .15s"
        onclick="window._iwSelectPreviewRow(\${i})">`;

if (t.includes(OLD_ROW)) {
  t = t.replace(OLD_ROW, NEW_ROW);
  console.log('OK: Read-only branch injected into preview row template');
} else {
  console.error('NOT FOUND: row open template — dumping context around cursor:pointer');
  const idx = t.indexOf('cursor:pointer;');
  console.log(JSON.stringify(t.substring(idx - 100, idx + 300)));
}

// ── Also disable Vendor + Inward Detail fields on loading from View Records ──
// Find where _iwEditId gets set when a view-records row is clicked.
// Pattern: look for where _iwEditId is assigned a non-null value (e.g. inward.InwardId)
const matches = [];
let pos = 0;
while (true) {
  const idx = t.indexOf('_iwEditId =', pos);
  if (idx === -1) break;
  matches.push({ idx, ctx: t.substring(idx - 30, idx + 120) });
  pos = idx + 1;
}
console.log('All _iwEditId assignments:');
matches.forEach((m, i) => console.log(i, JSON.stringify(m.ctx)));

fs.writeFileSync('public/pages-transactions.js', t);
console.log('DONE');
