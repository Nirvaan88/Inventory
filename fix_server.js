
const fs = require('fs');
let t = fs.readFileSync('server.js', 'utf8');
t = t.replace(/\r\n/g, '\n');

const OLD_PUT = `app.put('/api/orders/:orderId', requireAuth, async (req, res) => {
  const { OrderDate, Vendorid, DivisionId, items } = req.body;
  const user = req.session.user?.loginId || 'admin';
  const orderId = parseInt(req.params.orderId);
  try {
    await query(
      \`UPDATE [Order] SET [OrderDate]=@date,[Vendorid]=@vid,[DivisionId]=@did,
       [ModifyBy]=@user,[ModifyDate]=GETDATE() WHERE [OrderID]=@oid\`,
      { date: OrderDate || null, vid: Vendorid || null, did: DivisionId || null, user, oid: orderId });
    // Replace all items
    await query(\`DELETE FROM [OrderItem] WHERE [OrderID]=@oid\`, { oid: orderId });
    for (const it of (items || [])) {
      const qty = parseInt(it.TotalQty) || 0;
      const rate = parseFloat(it.Rate) || 0;
      await query(
        \`INSERT INTO [OrderItem]([OrderID],[CategoryId],[ItemId],[TotalQty],[Rate],[TotalAmt],[Status],[AddedBy],[AddedDate])
         VALUES(@oid,@cat,@iid,@qty,@rate,@amt,'Y',@user,GETDATE())\`,
        {
          oid: orderId, cat: it.CategoryId || null, iid: it.ItemId || null,
          qty, rate, amt: qty * rate, user
        });
    }
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});`;

const NEW_PUT = `app.put('/api/orders/:orderId', requireAuth, async (req, res) => {
  const { OrderDate, Vendorid, DivisionId, items } = req.body;
  const user = req.session.user?.loginId || 'admin';
  const orderId = parseInt(req.params.orderId);
  try {
    // ── Snapshot BEFORE state for change-email ─────────────────────────────
    const beforeRes = await query(
      \`SELECT o.[OrderNumber],
              oi.[ItemId], oi.[TotalQty], i.[ItemName], c.[CategoryName]
       FROM   [Order] o
       LEFT JOIN [OrderItem] oi ON oi.[OrderID]    = o.[OrderID]
       LEFT JOIN [Item]       i ON i.[itemid]       = oi.[ItemId]
       LEFT JOIN [Category]   c ON c.[CategoryId]   = oi.[CategoryId]
       WHERE  o.[OrderID] = @oid\`,
      { oid: orderId }
    );
    const beforeRows   = beforeRes.recordset || [];
    const OrderNumber  = beforeRows[0]?.OrderNumber || '';

    // ── Update header ──────────────────────────────────────────────────────
    await query(
      \`UPDATE [Order] SET [OrderDate]=@date,[Vendorid]=@vid,[DivisionId]=@did,
       [ModifyBy]=@user,[ModifyDate]=GETDATE() WHERE [OrderID]=@oid\`,
      { date: OrderDate || null, vid: Vendorid || null, did: DivisionId || null, user, oid: orderId });

    // ── Replace items ──────────────────────────────────────────────────────
    await query(\`DELETE FROM [OrderItem] WHERE [OrderID]=@oid\`, { oid: orderId });
    for (const it of (items || [])) {
      const qty  = parseInt(it.TotalQty)  || 0;
      const rate = parseFloat(it.Rate)    || 0;
      await query(
        \`INSERT INTO [OrderItem]([OrderID],[CategoryId],[ItemId],[TotalQty],[Rate],[TotalAmt],[Status],[AddedBy],[AddedDate])
         VALUES(@oid,@cat,@iid,@qty,@rate,@amt,'Y',@user,GETDATE())\`,
        { oid: orderId, cat: it.CategoryId || null, iid: it.ItemId || null, qty, rate, amt: qty * rate, user });
    }
    res.json({ success: true });

    // ── Fire-and-forget ORDER UPDATED email ────────────────────────────────
    (async () => {
      try {
        const metaRes = await query(
          \`SELECT v.[Name] AS VendorName, v.[VendorEmail], d.[DivisionName]
           FROM   [Vendor] v CROSS JOIN [Division] d
           WHERE  v.[vendorid] = @vid AND d.[DivisionId] = @did\`,
          { vid: Vendorid || null, did: DivisionId || null }
        );
        const meta       = metaRes.recordset[0] || {};
        const vendorName = meta.VendorName   || 'N/A';
        const divName    = meta.DivisionName || 'N/A';

        // Fetch new items with names after insert
        const afterRes = await query(
          \`SELECT oi.[ItemId], oi.[TotalQty], i.[ItemName], c.[CategoryName]
           FROM   [OrderItem] oi
           LEFT JOIN [Item]     i ON i.[itemid]     = oi.[ItemId]
           LEFT JOIN [Category] c ON c.[CategoryId] = oi.[CategoryId]
           WHERE  oi.[OrderID] = @oid ORDER BY oi.[OrderItemId]\`,
          { oid: orderId }
        );
        const newRows = afterRes.recordset || [];

        // ── Build diff ─────────────────────────────────────────────────────
        const beforeMap = new Map();
        beforeRows.filter(r => r.ItemId).forEach(r => beforeMap.set(String(r.ItemId), r));
        const newMap = new Map();
        newRows.filter(r => r.ItemId).forEach(r => newMap.set(String(r.ItemId), r));

        const added    = newRows.filter(r  => r.ItemId && !beforeMap.has(String(r.ItemId)));
        const removed  = beforeRows.filter(r => r.ItemId && !newMap.has(String(r.ItemId)));
        const modified = newRows.filter(r  => {
          const b = beforeMap.get(String(r.ItemId));
          return b && b.TotalQty !== r.TotalQty;
        });

        const changeRows = [
          ...added.map(r   => \`<tr style="background:#f0fff4"><td colspan="3" style="padding:9px 16px;color:#16a34a;font-size:12px;border-bottom:1px solid #dcfce7"><b>&#43; ADDED:</b> \${r.ItemName} &mdash; Qty: \${r.TotalQty}</td></tr>\`),
          ...removed.map(r => \`<tr style="background:#fff1f2"><td colspan="3" style="padding:9px 16px;color:#dc2626;font-size:12px;border-bottom:1px solid #fee2e2"><b>&minus; REMOVED:</b> \${r.ItemName} &mdash; Was: \${r.TotalQty}</td></tr>\`),
          ...modified.map(r => { const b = beforeMap.get(String(r.ItemId)); return \`<tr style="background:#fffbeb"><td colspan="3" style="padding:9px 16px;color:#b45309;font-size:12px;border-bottom:1px solid #fef3c7"><b>&#9998; CHANGED:</b> \${r.ItemName} &mdash; \${b.TotalQty} &#8594; \${r.TotalQty}</td></tr>\`; })
        ].join('');
        const hasChanges = added.length || removed.length || modified.length;

        const orderDateFmt = OrderDate
          ? new Date(OrderDate).toLocaleDateString('en-IN', { day:'2-digit', month:'long', year:'numeric' })
          : new Date().toLocaleDateString('en-IN', { day:'2-digit', month:'long', year:'numeric' });

        const itemRows = newRows.map((it, idx) => \`
          <tr style="background:\${idx % 2 === 0 ? '#ffffff' : '#f8f9ff'}">
            <td style="padding:11px 16px;border-bottom:1px solid #e8eaf0;color:#444;font-size:13px">\${it.CategoryName || '&mdash;'}</td>
            <td style="padding:11px 16px;border-bottom:1px solid #e8eaf0;font-weight:600;color:#1a1a2e;font-size:13px">\${it.ItemName || '&mdash;'}</td>
            <td style="padding:11px 16px;border-bottom:1px solid #e8eaf0;text-align:center;font-weight:700;color:#b8860b;font-size:14px">\${it.TotalQty}</td>
          </tr>\`).join('');

        const htmlBody = \`<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#f0f2f5;font-family:Arial,Helvetica,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f2f5;padding:32px 0">
<tr><td align="center">
<table width="620" cellpadding="0" cellspacing="0"
       style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.10)">
  <!-- Header -->
  <tr><td style="background:linear-gradient(135deg,#1a1a2e 0%,#16213e 60%,#7c2d12 100%);padding:32px 36px;text-align:center">
    <div style="font-size:11px;letter-spacing:3px;color:#c9a227;text-transform:uppercase;margin-bottom:8px">KISNA Diamond Jewellery</div>
    <div style="font-size:26px;font-weight:800;color:#ffffff;letter-spacing:1px">&#9998; Order Updated</div>
    <div style="margin-top:10px;display:inline-block;background:rgba(201,162,39,0.18);border:1px solid #c9a227;border-radius:20px;padding:5px 20px;color:#c9a227;font-size:13px;font-weight:600;letter-spacing:1px">
      Order ID&nbsp;&nbsp;#\${orderId}\${OrderNumber ? '&nbsp;&nbsp;|&nbsp;&nbsp;' + OrderNumber : ''}
    </div><br/>
    <div style="margin-top:8px;display:inline-block;background:rgba(239,68,68,0.18);border:1px solid #ef4444;border-radius:20px;padding:4px 16px;color:#fca5a5;font-size:11px;font-weight:600;letter-spacing:1px">
      MODIFIED &mdash; \${new Date().toLocaleDateString('en-IN',{day:'2-digit',month:'long',year:'numeric'})}
    </div>
  </td></tr>
  <!-- Meta -->
  <tr><td style="padding:28px 36px 8px">
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td width="50%" style="padding-bottom:18px;vertical-align:top">
          <div style="font-size:10px;letter-spacing:2px;color:#999;text-transform:uppercase;margin-bottom:5px">Order Date</div>
          <div style="font-size:15px;font-weight:700;color:#1a1a2e">\${orderDateFmt}</div>
        </td>
        <td width="50%" style="padding-bottom:18px;vertical-align:top">
          <div style="font-size:10px;letter-spacing:2px;color:#999;text-transform:uppercase;margin-bottom:5px">Vendor</div>
          <div style="font-size:15px;font-weight:700;color:#1a1a2e">\${vendorName}</div>
        </td>
      </tr>
      <tr>
        <td width="50%" style="vertical-align:top">
          <div style="font-size:10px;letter-spacing:2px;color:#999;text-transform:uppercase;margin-bottom:5px">Division</div>
          <div style="font-size:15px;font-weight:700;color:#1a1a2e">\${divName}</div>
        </td>
        <td width="50%" style="vertical-align:top">
          <div style="font-size:10px;letter-spacing:2px;color:#999;text-transform:uppercase;margin-bottom:5px">Modified By</div>
          <div style="font-size:15px;font-weight:700;color:#1a1a2e">\${user}</div>
        </td>
      </tr>
    </table>
  </td></tr>
  <!-- Divider -->
  <tr><td style="padding:0 36px"><div style="height:2px;background:linear-gradient(90deg,#c9a227,#f5e6a3,#c9a227);border-radius:2px"></div></td></tr>
  \${hasChanges ? \`
  <!-- What Changed -->
  <tr><td style="padding:20px 36px 8px">
    <div style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#ef4444;font-weight:700;margin-bottom:14px">&#9632; What Changed</div>
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border-radius:8px;overflow:hidden;border:1px solid #e8eaf0">
      <tbody>\${changeRows}</tbody>
    </table>
  </td></tr>
  <tr><td style="padding:0 36px"><div style="height:1px;background:#e8eaf0"></div></td></tr>
  \` : ''}
  <!-- Current Items -->
  <tr><td style="padding:20px 36px 8px">
    <div style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#c9a227;font-weight:700;margin-bottom:14px">&#9632; Current Items (Updated)</div>
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border-radius:8px;overflow:hidden;border:1px solid #e8eaf0">
      <thead><tr style="background:#1a1a2e">
        <th style="padding:12px 16px;text-align:left;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#c9a227;font-weight:700;width:30%">Category</th>
        <th style="padding:12px 16px;text-align:left;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#c9a227;font-weight:700">Item Name</th>
        <th style="padding:12px 16px;text-align:center;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#c9a227;font-weight:700;width:80px">Qty</th>
      </tr></thead>
      <tbody>\${itemRows || '<tr><td colspan="3" style="padding:16px;text-align:center;color:#aaa;font-style:italic">No items</td></tr>'}</tbody>
    </table>
  </td></tr>
  <!-- Summary -->
  <tr><td style="padding:12px 36px 28px">
    <div style="background:#f8f9ff;border-radius:8px;padding:14px 18px;border-left:4px solid #c9a227">
      <span style="font-size:13px;color:#555">
        <strong style="color:#1a1a2e">\${newRows.length}</strong> item type\${newRows.length !== 1 ? 's' : ''} &nbsp;|&nbsp;
        <strong style="color:#1a1a2e">\${newRows.reduce((s,i)=>s+(i.TotalQty||0),0)}</strong> total units
      </span>
    </div>
  </td></tr>
  <tr><td style="padding:0 36px"><div style="height:1px;background:#e8eaf0"></div></td></tr>
  <!-- Footer -->
  <tr><td style="padding:22px 36px;background:#fafafa;border-radius:0 0 12px 12px">
    <div style="font-size:11px;color:#999;text-align:center;line-height:1.7">
      This is an automated notification from <strong style="color:#1a1a2e">KISNA Inventory Management System</strong>.<br/>
      Please do not reply directly to this email.<br/>
      <span style="font-size:10px;color:#bbb;margin-top:6px;display:block">&#169; \${new Date().getFullYear()} KISNA Diamond Jewellery &mdash; All rights reserved.</span>
    </div>
  </td></tr>
</table>
</td></tr></table>
</body></html>\`;

        const vendorEmail = (meta.VendorEmail || '').trim();
        if (!vendorEmail) {
          console.warn(\`[Order Update Mail] No VendorEmail for vendor "\${vendorName}" — skipped for Order #\${orderId}\`);
        } else {
          await mailer.sendMail({
            from   : '"KISNA Inventory" <dataanalysis5@kisna.com>',
            to     : vendorEmail,
            cc     : 'dataanalysis5@kisna.com',
            subject: \`[UPDATED] Purchase Order #\${orderId}\${OrderNumber ? ' — ' + OrderNumber : ''} | \${divName} — \${vendorName}\`,
            html   : htmlBody
          });
          console.log(\`[Order Update Mail] Sent for Order #\${orderId} to vendor: \${vendorEmail}\`);
        }
      } catch (mailErr) {
        console.error(\`[Order Update Mail] Failed for Order #\${orderId}:\`, mailErr.message);
      }
    })();
  } catch (e) { res.status(500).json({ error: e.message }); }
});`;

if (t.includes(OLD_PUT)) {
  t = t.replace(OLD_PUT, NEW_PUT);
  console.log('OK: PUT /api/orders updated with email notification');
} else {
  console.error('NOT FOUND: PUT /api/orders');
}

fs.writeFileSync('server.js', t);
console.log('DONE');
