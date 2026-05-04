/* ═══════════════════════════════════════════════════════════════════
   VENDOR SCORECARD — Full Report Page  (loaded via separate script tag)
═══════════════════════════════════════════════════════════════════ */
registerPage('vendor-scorecard', () => `
  <div style="padding:0">
    <div style="background:var(--bg-card);padding:20px 28px 16px;border-bottom:1px solid var(--border);
                display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px">
      <div>
        <h2 style="margin:0;font-size:18px;font-weight:700;color:var(--text-primary);display:flex;align-items:center;gap:10px">
          <i class="fas fa-star-half-stroke" style="color:var(--accent)"></i> Vendor Performance Scorecard
          <span style="font-size:11px;padding:3px 9px;background:rgba(201,162,39,.12);color:var(--accent);border-radius:10px;font-weight:600">AI Insight</span>
        </h2>
        <div style="font-size:12px;color:var(--text-muted);margin-top:3px">Reports / AI Insights / Vendor Performance Scorecard</div>
      </div>
      <button class="btn btn-success btn-sm" id="btn-vs-export"><i class="fas fa-file-csv"></i> Export CSV</button>
    </div>
    <div id="vs-summary" style="margin:18px 28px 0"></div>
    <div style="margin:16px 28px 0;background:var(--bg-card);border:1px solid var(--border);border-radius:10px;padding:14px 18px;display:flex;gap:14px;flex-wrap:wrap;align-items:flex-end">
      <div style="flex:2;min-width:200px;display:flex;flex-direction:column;gap:5px">
        <label style="font-size:11px;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:.6px">Search</label>
        <div style="position:relative">
          <i class="fas fa-search" style="position:absolute;left:11px;top:50%;transform:translateY(-50%);color:var(--text-muted);font-size:13px"></i>
          <input type="text" id="vs-search" placeholder="Vendor name or company..."
            style="width:100%;padding:8px 12px 8px 34px;background:var(--bg-dark);border:1px solid var(--border);border-radius:6px;color:var(--text-primary);font-size:13px"/>
        </div>
      </div>
      <div style="min-width:160px;display:flex;flex-direction:column;gap:5px">
        <label style="font-size:11px;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:.6px">Grade</label>
        <select id="vs-grade-filter" style="background:var(--bg-dark);border:1px solid var(--border);border-radius:6px;padding:8px 12px;color:var(--text-primary);font-size:13px;cursor:pointer">
          <option value="">All Grades</option>
          <option value="Excellent">🌟 Excellent (85+)</option>
          <option value="Reliable">&#x2705; Reliable (70-84)</option>
          <option value="Average">🟡 Average (50-69)</option>
          <option value="Below Average">🟠 Below Average (30-49)</option>
          <option value="Poor">🔴 Poor (&lt;30)</option>
        </select>
      </div>
      <div style="min-width:180px;display:flex;flex-direction:column;gap:5px">
        <label style="font-size:11px;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:.6px">Sort By</label>
        <select id="vs-sort" style="background:var(--bg-dark);border:1px solid var(--border);border-radius:6px;padding:8px 12px;color:var(--text-primary);font-size:13px;cursor:pointer">
          <option value="score-desc">Score (Best first)</option>
          <option value="score-asc">Score (Worst first)</option>
          <option value="name-asc">Name A-Z</option>
          <option value="orders-desc">Most Orders</option>
        </select>
      </div>
    </div>
    <div style="margin:16px 28px 28px">
      <div class="card" style="padding:0;overflow:hidden">
        <div class="table-wrapper" id="vs-table-wrap">
          <div style="padding:48px;text-align:center">
            <div class="spinner" style="margin:0 auto"></div>
            <div style="margin-top:12px;color:var(--text-muted);font-size:13px">Loading vendor scorecards...</div>
          </div>
        </div>
      </div>
    </div>
  </div>
`);

window._pageBinders = window._pageBinders || {};
window._pageBinders['vendor-scorecard'] = async () => {
  let _vsRaw = [], _vsScored = [];

  async function loadVS() {
    try { _vsRaw = await api('/api/vendor-scorecard'); }
    catch (e) {
      const w = document.getElementById('vs-table-wrap');
      if (w) w.innerHTML = `<div style="padding:32px;text-align:center;color:var(--danger)">${e.message}</div>`;
      return;
    }
    _vsScored = _vsRaw.map(d => {
      const computed = _computeVendorScore(d);
      return Object.assign({}, d, computed);
    });
    renderVS();
  }

  function renderVS() {
    const q      = (document.getElementById('vs-search')?.value || '').toLowerCase();
    const gradeF = document.getElementById('vs-grade-filter')?.value || '';
    const sort   = document.getElementById('vs-sort')?.value || 'score-desc';
    const wrap   = document.getElementById('vs-table-wrap');
    const sumEl  = document.getElementById('vs-summary');
    if (!wrap) return;

    let rows = _vsScored.filter(r =>
      (!q || (r.VendorName||'').toLowerCase().includes(q)||(r.CompanyName||'').toLowerCase().includes(q)) &&
      (!gradeF || r.grade.label === gradeF)
    );
    if (sort === 'score-asc')        rows.sort((a,b) => a.score - b.score);
    else if (sort === 'name-asc')    rows.sort((a,b) => (a.VendorName||'').localeCompare(b.VendorName||''));
    else if (sort === 'orders-desc') rows.sort((a,b) => b.TotalOrders - a.TotalOrders);
    else rows.sort((a,b) => b.score - a.score);

    if (sumEl) {
      const avg = rows.length ? Math.round(rows.reduce((s,r)=>s+r.score,0)/rows.length) : 0;
      const excellent = rows.filter(r=>r.score>=85).length;
      const poor = rows.filter(r=>r.score<30).length;
      sumEl.innerHTML = `<div style="display:flex;gap:14px;flex-wrap:wrap">
        <div style="flex:1;min-width:130px;background:var(--bg-card);border:1px solid var(--border);border-radius:10px;padding:12px 16px">
          <div style="font-size:10px;color:var(--text-muted);text-transform:uppercase;letter-spacing:.8px">Vendors</div>
          <div style="font-size:24px;font-weight:800;color:var(--text-primary)">${rows.length}</div>
        </div>
        <div style="flex:1;min-width:130px;background:var(--bg-card);border:1px solid var(--border);border-radius:10px;padding:12px 16px">
          <div style="font-size:10px;color:var(--text-muted);text-transform:uppercase;letter-spacing:.8px">Avg Score</div>
          <div style="font-size:24px;font-weight:800;color:var(--accent)">${avg}/100</div>
        </div>
        <div style="flex:1;min-width:130px;background:rgba(22,163,74,.08);border:1px solid rgba(22,163,74,.2);border-radius:10px;padding:12px 16px">
          <div style="font-size:10px;color:#16a34a;text-transform:uppercase;letter-spacing:.8px">Excellent</div>
          <div style="font-size:24px;font-weight:800;color:#16a34a">${excellent}</div>
        </div>
        <div style="flex:1;min-width:130px;background:rgba(220,38,38,.06);border:1px solid rgba(220,38,38,.2);border-radius:10px;padding:12px 16px">
          <div style="font-size:10px;color:#dc2626;text-transform:uppercase;letter-spacing:.8px">Poor</div>
          <div style="font-size:24px;font-weight:800;color:#dc2626">${poor}</div>
        </div>
      </div>`;
    }

    if (!rows.length) {
      wrap.innerHTML = `<div style="padding:48px;text-align:center;color:var(--text-muted)">No vendors match the selected filters.</div>`;
      return;
    }

    wrap.innerHTML = `<table id="vs-table">
      <thead><tr>
        <th style="width:36px">#</th>
        <th style="width:80px;text-align:center">Score</th>
        <th>Vendor Name</th>
        <th>Company</th>
        <th style="text-align:center">Grade</th>
        <th style="text-align:center">Delivery</th>
        <th style="text-align:center">Qty Acc.</th>
        <th style="text-align:center">Return Rate</th>
        <th style="text-align:center">Orders</th>
        <th style="text-align:center">Details</th>
      </tr></thead>
      <tbody>
        ${rows.map((r, i) => {
          const arc = 125.6, off = Math.round(arc - (r.score/100)*arc);
          const leadStr = r.AvgLeadDays >= 0 ? Math.round(r.AvgLeadDays)+'d' : '\u2014';
          const accStr  = r.AvgAccuracyPct >= 0 ? Math.round(r.AvgAccuracyPct)+'%' : '\u2014';
          const retStr  = r.ReturnRatePct >= 0 ? r.ReturnRatePct.toFixed(1)+'%' : '\u2014';
          const leadC = r.AvgLeadDays >= 0 ? (r.AvgLeadDays<=7?'#16a34a':r.AvgLeadDays>14?'#dc2626':'var(--text-primary)') : 'var(--text-muted)';
          const accC  = r.AvgAccuracyPct >= 0 ? (r.AvgAccuracyPct>=95?'#16a34a':r.AvgAccuracyPct<70?'#dc2626':'var(--text-primary)') : 'var(--text-muted)';
          const retC  = r.ReturnRatePct >= 0 ? (r.ReturnRatePct===0?'#16a34a':r.ReturnRatePct>5?'#dc2626':'var(--text-primary)') : 'var(--text-muted)';
          return `<tr>
            <td style="color:var(--text-muted);font-size:12px">${i+1}</td>
            <td style="text-align:center;padding:6px 8px">
              <div style="position:relative;width:44px;height:44px;margin:0 auto">
                <svg width="44" height="44" viewBox="0 0 44 44">
                  <circle cx="22" cy="22" r="18" fill="none" stroke="var(--border)" stroke-width="4"/>
                  <circle cx="22" cy="22" r="18" fill="none" stroke="${r.grade.color}" stroke-width="4"
                    stroke-dasharray="${arc}" stroke-dashoffset="${off}"
                    stroke-linecap="round" transform="rotate(-90 22 22)"/>
                </svg>
                <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;
                            font-size:10px;font-weight:800;color:${r.grade.color}">${r.score}</div>
              </div>
            </td>
            <td style="font-weight:600">${r.VendorName||'-'}</td>
            <td style="color:var(--text-secondary);font-size:12px">${r.CompanyName||'-'}</td>
            <td style="text-align:center">
              <span style="padding:2px 9px;background:${r.grade.color}22;color:${r.grade.color};
                           border-radius:20px;font-size:11.5px;font-weight:700">${r.grade.icon} ${r.grade.label}</span>
            </td>
            <td style="text-align:center;font-weight:600;color:${leadC}">${leadStr}</td>
            <td style="text-align:center;font-weight:600;color:${accC}">${accStr}</td>
            <td style="text-align:center;font-weight:600;color:${retC}">${retStr}</td>
            <td style="text-align:center">${r.TotalOrders}</td>
            <td style="text-align:center">
              <button class="btn btn-secondary btn-sm"
                      onclick="window._showVendorScorecardModal(${r.VendorId})"
                      style="font-size:11px;padding:4px 10px">
                <i class="fas fa-eye"></i>
              </button>
            </td>
          </tr>`;
        }).join('')}
      </tbody>
    </table>`;
  }

  document.getElementById('vs-search').oninput        = renderVS;
  document.getElementById('vs-grade-filter').onchange = renderVS;
  document.getElementById('vs-sort').onchange         = renderVS;

  document.getElementById('btn-vs-export').onclick = () => {
    if (!_vsScored.length) { showToast('No data to export', 'info'); return; }
    const q = (document.getElementById('vs-search')?.value||'').toLowerCase();
    const gradeF = document.getElementById('vs-grade-filter')?.value||'';
    const rows = _vsScored.filter(r =>
      (!q||(r.VendorName||'').toLowerCase().includes(q)||(r.CompanyName||'').toLowerCase().includes(q)) &&
      (!gradeF||r.grade.label===gradeF)
    );
    const hdr = ['Vendor ID','Vendor Name','Company','Score','Grade','Avg Lead Days','Qty Accuracy %','Return Rate %','Total Orders','Inward Count'];
    const csv = [hdr,...rows.map(r=>[
      r.VendorId,r.VendorName,r.CompanyName,r.score,r.grade.label,
      r.AvgLeadDays>=0?Math.round(r.AvgLeadDays):'N/A',
      r.AvgAccuracyPct>=0?Math.round(r.AvgAccuracyPct):'N/A',
      r.ReturnRatePct>=0?r.ReturnRatePct.toFixed(1):'N/A',
      r.TotalOrders,r.InwardCount
    ])].map(row=>row.map(v=>`"${String(v||'').replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob = new Blob([csv],{type:'text/csv'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `vendor-scorecard-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    showToast('CSV exported!');
  };

  await loadVS();
};
