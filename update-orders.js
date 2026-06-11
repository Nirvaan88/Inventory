const fs = require('fs');
let code = fs.readFileSync('server.js', 'utf8');

const helperCode = `
async function _sendOrderEmail(orderId, isUpdate = false) {
  try {
    const metaRes = await query(
      \`SELECT o.[OrderNumber], o.[OrderDate], v.[Name] AS VendorName, v.[VendorEmail], v.[CompanyName], d.[DivisionName]
       FROM [Order] o
       LEFT JOIN [Vendor] v ON o.[Vendorid] = v.[vendorid]
       LEFT JOIN [Division] d ON o.[DivisionId] = d.[DivisionId]
       WHERE o.[OrderID] = @oid\`,
      { oid: orderId }
    );
    const meta = metaRes.recordset[0] || {};
    const vendorName = meta.VendorName || 'N/A';
    const divName = meta.DivisionName || 'N/A';
    const OrderNumber = meta.OrderNumber || '';
    const OrderDate = meta.OrderDate;

    const itemsRes = await query(
      \`SELECT c.[CategoryName], i.[ItemName], oi.[TotalQty]
       FROM [OrderItem] oi
       LEFT JOIN [Item] i ON oi.[ItemId] = i.[itemid]
       LEFT JOIN [Category] c ON oi.[CategoryId] = c.[CategoryId]
       WHERE oi.[OrderID] = @oid
       ORDER BY oi.[OrderItemId]\`,
      { oid: orderId }
    );
    const emailItems = itemsRes.recordset || [];

    const orderDateFmt = OrderDate
      ? new Date(OrderDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })
      : new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });

    const itemRows = emailItems.map((it, idx) => \`
      <tr style="background:\${idx % 2 === 0 ? '#ffffff' : '#f8f9ff'}">
        <td style="padding:11px 16px;border-bottom:1px solid #e8eaf0;color:#444;font-size:13px">\${it.CategoryName || '—'}</td>
        <td style="padding:11px 16px;border-bottom:1px solid #e8eaf0;font-weight:600;color:#1a1a2e;font-size:13px">\${it.ItemName || '—'}</td>
        <td style="padding:11px 16px;border-bottom:1px solid #e8eaf0;text-align:center;font-weight:700;color:#b8860b;font-size:14px">\${it.TotalQty}</td>
      </tr>\`).join('');

    const htmlBody = \`<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#f0f2f5;font-family:Arial,Helvetica,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f2f5;padding:32px 0">
    <tr><td align="center">
      <table width="620" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.10)">
        <tr>
          <td style="background:linear-gradient(135deg,#1a1a2e 0%,#16213e 60%,#0f3460 100%);padding:32px 36px;text-align:center">
            <div style="font-size:11px;letter-spacing:3px;color:#c9a227;text-transform:uppercase;margin-bottom:8px">KISNA Diamond Jewellery</div>
            <div style="font-size:26px;font-weight:800;color:#ffffff;letter-spacing:1px">✦ \${isUpdate ? 'Updated ' : ''}Purchase Order</div>
            \${isUpdate ? '<div style="margin-top:6px;font-size:13px;color:#f87171;font-weight:600">This order has been modified</div>' : ''}
            <div style="margin-top:10px;display:inline-block;background:rgba(201,162,39,0.18);border:1px solid #c9a227;border-radius:20px;padding:5px 20px;color:#c9a227;font-size:13px;font-weight:600;letter-spacing:1px">
              Order ID&nbsp;&nbsp;#\${orderId}\${OrderNumber ? '&nbsp;&nbsp;|&nbsp;&nbsp;' + OrderNumber : ''}
            </div>
          </td>
        </tr>
        <tr>
          <td style="padding:28px 36px 8px">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td width="50%" style="padding-bottom:18px;vertical-align:top">
                  <div style="font-size:10px;letter-spacing:2px;color:#999;text-transform:uppercase;margin-bottom:5px">Order Date</div>
                  <div style="font-size:15px;font-weight:700;color:#1a1a2e">\${orderDateFmt}</div>
                </td>
                <td width="50%" style="padding-bottom:18px;vertical-align:top">
                  <div style="font-size:10px;letter-spacing:2px;color:#999;text-transform:uppercase;margin-bottom:5px">Division</div>
                  <div style="font-size:15px;font-weight:700;color:#1a1a2e">\${divName}</div>
                </td>
              </tr>
              <tr>
                <td width="50%" style="padding-bottom:18px;vertical-align:top">
                  <div style="font-size:10px;letter-spacing:2px;color:#999;text-transform:uppercase;margin-bottom:5px">Vendor</div>
                  <div style="font-size:15px;font-weight:700;color:#1a1a2e">\${vendorName}</div>
                  \${meta.CompanyName ? \`<div style="font-size:12px;color:#777;margin-top:3px">\${meta.CompanyName}</div>\` : ''}
                </td>
                <td width="50%" style="padding-bottom:18px;vertical-align:top">
                  <div style="font-size:10px;letter-spacing:2px;color:#999;text-transform:uppercase;margin-bottom:5px">Order Number</div>
                  <div style="font-size:15px;font-weight:700;color:#1a1a2e">\${OrderNumber || '<span style="color:#bbb;font-weight:400;font-style:italic">—</span>'}</div>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr><td style="padding:0 36px"><div style="height:2px;background:linear-gradient(90deg,#c9a227,#f5e6a3,#c9a227);border-radius:2px"></div></td></tr>
        <tr>
          <td style="padding:24px 36px 8px">
            <div style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#c9a227;font-weight:700;margin-bottom:14px">■ Items Ordered</div>
            <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border-radius:8px;overflow:hidden;border:1px solid #e8eaf0">
              <thead>
                <tr style="background:#1a1a2e">
                  <th style="padding:12px 16px;text-align:left;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#c9a227;font-weight:700;width:30%">Category</th>
                  <th style="padding:12px 16px;text-align:left;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#c9a227;font-weight:700">Item Name</th>
                  <th style="padding:12px 16px;text-align:center;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#c9a227;font-weight:700;width:80px">Qty</th>
                </tr>
              </thead>
              <tbody>\${itemRows || \`<tr><td colspan="3" style="padding:16px;text-align:center;color:#aaa;font-style:italic">No items</td></tr>\`}</tbody>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:12px 36px 28px">
            <div style="background:#f8f9ff;border-radius:8px;padding:14px 18px;display:flex;align-items:center;border-left:4px solid #c9a227">
              <span style="font-size:13px;color:#555"><strong style="color:#1a1a2e">\${emailItems.length}</strong> item type\${emailItems.length !== 1 ? 's' : ''} &nbsp;|&nbsp; <strong style="color:#1a1a2e">\${emailItems.reduce((s, i) => s + (i.TotalQty || 0), 0)}</strong> total units ordered</span>
            </div>
          </td>
        </tr>
        <tr><td style="padding:0 36px"><div style="height:1px;background:#e8eaf0"></div></td></tr>
        <tr>
          <td style="padding:22px 36px;background:#fafafa;border-radius:0 0 12px 12px">
            <div style="font-size:11px;color:#999;text-align:center;line-height:1.7">
              This is an automated notification from <strong style="color:#1a1a2e">KISNA Inventory Management System</strong>.<br/>
              Please do not reply directly to this email.<br/>
              <span style="font-size:10px;color:#bbb;margin-top:6px;display:block">© \${new Date().getFullYear()} KISNA Diamond Jewellery — All rights reserved.</span>
            </div>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>\`;

    const vendorEmail = (meta.VendorEmail || '').trim();
    if (!vendorEmail) {
      console.warn(\`[Order Mail] No VendorEmail set for vendor "\${vendorName}" — email skipped for Order #\${orderId}\`);
    } else {
      await mailer.sendMail({
        from: '"KISNA Inventory" <dataanalysis5@kisna.com>',
        to: vendorEmail,
        cc: 'dataanalysis5@kisna.com',
        subject: \`\${isUpdate ? 'Updated ' : 'New '}Purchase Order #\${orderId}\${OrderNumber ? ' — ' + OrderNumber : ''} | \${divName} — \${vendorName}\`,
        html: htmlBody
      });
      console.log(\`[Order Mail] Sent for Order #\${orderId} to vendor: \${vendorEmail} (CC: dataanalysis5@kisna.com)\`);
    }
  } catch (mailErr) {
    console.error(\`[Order Mail] Failed for Order #\${orderId}:\`, mailErr.message);
  }
}
`

code = code.replace(/app\.post\('\/api\/orders'/g, helperCode + "\napp.post('/api/orders'");

// We need to match from `// ── Fire-and-forget order email` down to `})();` inside `app.post('/api/orders'`
const regexPost = /\/\/[ \-\—]*Fire-and-forget order email[ \-\—]*\n\s*\(async \(\) => \{[\s\S]*?\}\)\(\);/i;
code = code.replace(regexPost, `// ── Fire-and-forget order email ────────────────────────────────
    _sendOrderEmail(orderId, false);`);

const regexPut = /(app\.put\('\/api\/orders\/:orderId'[\s\S]*?)(res\.json\(\{ success: true \}\);)/i;
code = code.replace(regexPut, `$1// ── Fire-and-forget order email for update ─────────────────────
    _sendOrderEmail(orderId, true);
    $2`);

fs.writeFileSync('server.js', code, 'utf8');
console.log('Update script completed.');
