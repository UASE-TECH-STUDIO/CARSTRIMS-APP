"use client";
import { useState as _useState } from "react";
import CarFinancialReport from "@/components/dealer/CarFinancialReport";
import { useEffect, useState } from "react";
import api from "@/lib/api";

export default function ReportsPage() {
  const [data, setData] = useState<any>(null);
  const [reportCarId, setReportCarId] = useState<string|null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/api/v1/dealers/me/reports")
      .then((r) => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const fmt = (n: number) => `₦${(n||0).toLocaleString()}`;

  const exportReport = () => {
    if (!data) return;
    const s = data.summary;
    const html = `
      <html><head><title>Financial Report — CARSTRIMS</title>
      <style>
        body{font-family:sans-serif;padding:2rem;color:#1A1A1A;max-width:900px;margin:0 auto}
        h1{font-size:1.75rem;color:#F47B20;margin-bottom:0.25rem}
        .meta{color:#888;font-size:0.875rem;margin-bottom:2rem}
        h2{font-size:1rem;letter-spacing:0.1em;text-transform:uppercase;color:#888;margin:2rem 0 0.75rem;border-bottom:1px solid #E5E5E5;padding-bottom:0.5rem}
        .summary-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:1rem;margin-bottom:1.5rem}
        .sum-card{background:#FFF7ED;border:1px solid #F47B20;border-radius:8px;padding:1rem}
        .sum-val{font-size:1.5rem;font-weight:700;color:#F47B20}
        .sum-label{font-size:0.75rem;color:#888;margin-top:0.25rem}
        table{width:100%;border-collapse:collapse;margin-bottom:1.5rem}
        th{background:#F47B20;color:#fff;padding:0.5rem 0.875rem;text-align:left;font-size:0.8rem}
        td{padding:0.5rem 0.875rem;border-bottom:1px solid #F0F0F0;font-size:0.825rem}
        .footer{margin-top:2rem;font-size:0.75rem;color:#888;text-align:center;border-top:1px solid #E5E5E5;padding-top:1rem}
      </style></head>
      <body>
        <h1>CARSTRIMS Financial Report</h1>
        <div class="meta">Generated ${new Date().toLocaleString("en-NG")} · Powered by UASE TECH STUDIO</div>

        <h2>Financial Summary</h2>
        <div class="summary-grid">
          <div class="sum-card"><div class="sum-val">${fmt(s?.totalRevenue||0)}</div><div class="sum-label">Total Revenue</div></div>
          <div class="sum-card"><div class="sum-val">${fmt(s?.totalProfit||0)}</div><div class="sum-label">Gross Profit</div></div>
          <div class="sum-card"><div class="sum-val">${fmt((s?.totalRevenue||0)-(s?.totalExpenses||0))}</div><div class="sum-label">Net (Revenue - Expenses)</div></div>
          <div class="sum-card"><div class="sum-val">${fmt(s?.totalExpenses||0)}</div><div class="sum-label">Total Expenses</div></div>
          <div class="sum-card"><div class="sum-val">${s?.totalSales||0}</div><div class="sum-label">Total Sales</div></div>
          <div class="sum-card"><div class="sum-val">${s?.soldCars||0} / ${s?.totalCars||0}</div><div class="sum-label">Cars Sold / Listed</div></div>
        </div>

        <h2>Monthly Sales (Last 6 Months)</h2>
        <table><thead><tr><th>Month</th><th>Revenue</th><th>Profit</th><th>Sales Count</th></tr></thead>
        <tbody>${(data.monthlySales||[]).map((m: any) =>
          `<tr><td>${m.month}</td><td>${fmt(m.revenue)}</td><td>${fmt(m.profit)}</td><td>${m.count}</td></tr>`
        ).join("")}</tbody></table>

        <h2>Top Brands Sold</h2>
        <table><thead><tr><th>Brand</th><th>Units Sold</th><th>Revenue</th></tr></thead>
        <tbody>${(data.topBrands||[]).map((b: any) =>
          `<tr><td>${b.brand}</td><td>${b.count}</td><td>${fmt(b.revenue)}</td></tr>`
        ).join("")}</tbody></table>

        <h2>Expenses by Category</h2>
        <table><thead><tr><th>Category</th><th>Count</th><th>Total</th></tr></thead>
        <tbody>${(data.expensesByCategory||[]).map((e: any) =>
          `<tr><td>${e.category}</td><td>${e.count}</td><td>${fmt(e.total)}</td></tr>`
        ).join("")}</tbody></table>

        <div class="footer">CARSTRIMS © 2026 · Developed by UASE TECH STUDIO</div>
      </body></html>
    `;
    const win = window.open("", "_blank");
    if (win) { win.document.write(html); win.document.close(); win.print(); }
  };

  if (loading) return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"50vh"}}>
      <div style={{width:"28px",height:"28px",border:"2.5px solid #E5E5E5",borderTopColor:"#F47B20",borderRadius:"50%",animation:"spin 0.8s linear infinite"}} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (!data) return <div style={{padding:"2rem",color:"#888"}}>Could not load reports. Make sure you have sales data.</div>;

  const s = data.summary;
  const maxMonthRev = Math.max(...(data.monthlySales||[]).map((m: any) => m.revenue), 1);

  return (
    <>
      {reportCarId && <CarFinancialReport carId={reportCarId} onClose={() => setReportCarId(null)} />}
    <div className="reports-page">
      <div className="page-header">
        <div>
          <h2 className="page-heading">Reports & Analytics</h2>
          <p className="page-sub">Complete financial overview</p>
        </div>
        <button className="btn-export" onClick={exportReport}>⬇ Export PDF Report</button>
      </div>

      {/* Financial Summary */}
      <div className="section-title">FINANCIAL SUMMARY</div>
      <div className="summary-grid">
        {[
          { label:"Total Revenue", val:fmt(s?.totalRevenue||0), icon:"💰", accent:true },
          { label:"Gross Profit", val:fmt(s?.totalProfit||0), icon:"📈", accent:true },
          { label:"Net (Rev − Exp)", val:fmt((s?.totalRevenue||0)-(s?.totalExpenses||0)), icon:"✅", accent:true },
          { label:"Total Expenses", val:fmt(s?.totalExpenses||0), icon:"📋", red:true },
          { label:"Total Sales", val:s?.totalSales||0, icon:"🏷️" },
          { label:"Cars Sold", val:`${s?.soldCars||0} / ${s?.totalCars||0}`, icon:"🚗" },
          { label:"Staff", val:s?.totalStaff||0, icon:"👥" },
          { label:"Partners", val:s?.totalPartners||0, icon:"🤝" },
        ].map((card) => (
          <div key={card.label} className={`sum-card ${card.accent?"accent":""} ${card.red?"red":""}`}>
            <div className="sc-icon">{card.icon}</div>
            <div className="sc-val">{card.val}</div>
            <div className="sc-label">{card.label}</div>
          </div>
        ))}
      </div>

      {/* Monthly Chart */}
      <div className="chart-card">
        <div className="section-title">MONTHLY REVENUE & PROFIT (LAST 6 MONTHS)</div>
        <div className="bar-chart">
          {(data.monthlySales||[]).map((m: any, i: number) => (
            <div key={i} className="bar-col">
              <div className="bar-pair">
                <div className="bar rev-bar" style={{height:`${Math.max(6,(m.revenue/maxMonthRev)*160)}px`}} title={fmt(m.revenue)} />
                <div className="bar profit-bar" style={{height:`${Math.max(3,(m.profit/maxMonthRev)*160)}px`}} title={fmt(m.profit)} />
              </div>
              <div className="bar-label">{m.month}</div>
              <div className="bar-count">{m.count} sold</div>
            </div>
          ))}
        </div>
        <div className="chart-legend">
          <span className="legend-item"><span className="legend-dot rev" />Revenue</span>
          <span className="legend-item"><span className="legend-dot profit" />Profit</span>
        </div>
      </div>

      <div className="two-col">
        {/* Top Brands */}
        <div className="list-card">
          <div className="section-title">TOP BRANDS SOLD</div>
          {data.topBrands?.length === 0
            ? <div className="no-data">No sales data yet</div>
            : data.topBrands?.map((b: any, i: number) => (
              <div key={i} className="list-row">
                <span className="list-rank">#{i+1}</span>
                <span className="list-name">{b.brand}</span>
                <span className="list-count">{b.count} sold</span>
                <span className="list-val">{fmt(b.revenue)}</span>
              </div>
            ))
          }
        </div>

        {/* Payment Breakdown */}
        <div className="list-card">
          <div className="section-title">PAYMENT BREAKDOWN</div>
          {data.paymentBreakdown?.length === 0
            ? <div className="no-data">No payment data yet</div>
            : data.paymentBreakdown?.map((p: any, i: number) => (
              <div key={i} className="list-row">
                <span className="list-name" style={{textTransform:"capitalize"}}>{p.method?.replace("_"," ")}</span>
                <span className="list-count">{p.count} transactions</span>
                <span className="list-val">{fmt(p.total)}</span>
              </div>
            ))
          }
        </div>

        {/* Expenses by Category */}
        <div className="list-card">
          <div className="section-title">EXPENSES BY CATEGORY</div>
          {data.expensesByCategory?.length === 0
            ? <div className="no-data">No expenses recorded</div>
            : data.expensesByCategory?.map((e: any, i: number) => (
              <div key={i} className="list-row">
                <span className="list-name" style={{textTransform:"capitalize"}}>{e.category?.replace("_"," ")}</span>
                <span className="list-count">{e.count} entries</span>
                <span className="list-val red-val">{fmt(e.total)}</span>
              </div>
            ))
          }
        </div>

        {/* Staff Performance */}
        <div className="list-card">
          <div className="section-title">STAFF PERFORMANCE</div>
          {data.staffPerformance?.length === 0
            ? <div className="no-data">No staff sales recorded</div>
            : data.staffPerformance?.map((st: any, i: number) => (
              <div key={i} className="list-row">
                <span className="list-rank">#{i+1}</span>
                <span className="list-name">{st.name}</span>
                <span className="list-count">{st.sales} sales</span>
                <span className="list-val">{fmt(st.revenue)}</span>
              </div>
            ))
          }
        </div>
      </div>

      <style>{`
        .reports-page{display:flex;flex-direction:column;gap:1.5rem}
        .page-header{display:flex;align-items:flex-start;justify-content:space-between;gap:1rem;flex-wrap:wrap}
        .page-heading{font-family:var(--font-display);font-size:1.6rem;letter-spacing:0.05em;color:#1A1A1A;line-height:1}
        .page-sub{font-size:0.8rem;color:#888;margin-top:0.3rem}
        .btn-export{background:#F47B20;color:#fff;border:none;border-radius:6px;padding:0.65rem 1.25rem;font-family:var(--font-display);font-size:0.875rem;letter-spacing:0.08em;cursor:pointer;transition:background 0.2s;white-space:nowrap}
        .btn-export:hover{background:#FF9340}
        .section-title{font-size:0.7rem;font-weight:600;letter-spacing:0.15em;text-transform:uppercase;color:#888}
        .summary-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:1rem}
        .sum-card{background:#fff;border:1.5px solid #E5E5E5;border-radius:10px;padding:1rem 1.25rem;display:flex;flex-direction:column;gap:0.3rem;transition:border-color 0.2s}
        .sum-card.accent{border-color:#F47B20;background:#FFF7ED}
        .sum-card.red{border-color:rgba(220,38,38,0.3);background:#FEF2F2}
        .sc-icon{font-size:1.1rem}
        .sc-val{font-family:var(--font-display);font-size:1.5rem;color:#F47B20;line-height:1}
        .sum-card.red .sc-val{color:#DC2626}
        .sc-label{font-size:0.68rem;color:#888;text-transform:uppercase;letter-spacing:0.06em}
        .chart-card{background:#fff;border:1.5px solid #E5E5E5;border-radius:10px;padding:1.25rem;display:flex;flex-direction:column;gap:1rem}
        .bar-chart{display:flex;align-items:flex-end;gap:1rem;height:185px;overflow-x:auto;padding-bottom:0.5rem}
        .bar-col{display:flex;flex-direction:column;align-items:center;gap:4px;min-width:60px}
        .bar-pair{display:flex;align-items:flex-end;gap:3px;height:160px}
        .bar{border-radius:3px 3px 0 0;min-width:16px;cursor:pointer;transition:opacity 0.2s}
        .bar:hover{opacity:0.8}
        .rev-bar{background:#F47B20;min-width:18px}
        .profit-bar{background:#16A34A;min-width:14px}
        .bar-label{font-size:0.7rem;color:#888;text-align:center}
        .bar-count{font-size:0.62rem;color:#AAA;text-align:center}
        .chart-legend{display:flex;gap:1.5rem}
        .legend-item{display:flex;align-items:center;gap:0.4rem;font-size:0.78rem;color:#666}
        .legend-dot{width:10px;height:10px;border-radius:2px}
        .legend-dot.rev{background:#F47B20}
        .legend-dot.profit{background:#16A34A}
        .two-col{display:grid;grid-template-columns:1fr 1fr;gap:1.25rem}
        .list-card{background:#fff;border:1.5px solid #E5E5E5;border-radius:10px;padding:1.25rem;display:flex;flex-direction:column;gap:0.75rem}
        .list-row{display:flex;align-items:center;gap:0.75rem;padding:0.5rem 0;border-bottom:1px solid #F0F0F0}
        .list-row:last-child{border-bottom:none}
        .list-rank{font-family:var(--font-display);font-size:0.9rem;color:#F47B20;min-width:24px}
        .list-name{flex:1;font-size:0.825rem;color:#1A1A1A}
        .list-count{font-size:0.75rem;color:#888;white-space:nowrap}
        .list-val{font-size:0.825rem;font-weight:600;color:#F47B20;min-width:90px;text-align:right;white-space:nowrap}
        .red-val{color:#DC2626}
        .no-data{font-size:0.825rem;color:#AAA;text-align:center;padding:1rem}
        @media(max-width:900px){.two-col{grid-template-columns:1fr}}
        @media(max-width:640px){
  .summary-grid{grid-template-columns:1fr 1fr}
  .bar-chart{gap:0.5rem}
  .two-col{grid-template-columns:1fr}
  .sc-val{font-size:1.2rem}
}
@media(max-width:480px){
  .summary-grid{grid-template-columns:1fr}
  .page-header{flex-direction:column;align-items:flex-start}
  .btn-export{align-self:flex-start}
}
      `}</style>
    </div>
    </>
  );
}

