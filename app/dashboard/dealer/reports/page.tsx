"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import CarFinancialReport from "@/components/dealer/CarFinancialReport";

export default function ReportsPage() {
  const [data, setData]         = useState<any>(null);
  const [dealer, setDealer]     = useState<any>(null);
  const [loading, setLoading]   = useState(true);
  const [reportCarId, setReportCarId] = useState<string|null>(null);

  useEffect(() => {
    Promise.all([
      api.get("/api/v1/dealers/me/reports"),
      api.get("/api/v1/dealers/me"),
    ]).then(([rRep, rDealer]) => {
      setData(rRep.data);
      setDealer(rDealer.data);
    }).catch(()=>{}).finally(()=>setLoading(false));
  }, []);

  const fmt = (n:number) => `₦${(n||0).toLocaleString()}`;
  const now  = new Date().toLocaleString("en-NG");

  /* ── Shared HTML header for exports ── */
  const dealerHeader = (dealer:any) => `
    <div style="display:flex;align-items:center;gap:16px;margin-bottom:20px;padding-bottom:16px;border-bottom:3px solid #F47B20">
      ${dealer?.logo?`<img src="${dealer.logo}" style="width:64px;height:64px;object-fit:cover;border-radius:10px;border:2px solid #E5E5E5" alt="Logo"/>`:""}
      <div>
        <div style="font-family:Georgia,serif;font-size:1.4rem;font-weight:700;color:#1A1A1A">${dealer?.companyName||"CARSTRIMS Dealer"}</div>
        ${dealer?.address?`<div style="font-size:0.8rem;color:#737373">${dealer.address}</div>`:""}
        ${dealer?.city||dealer?.state?`<div style="font-size:0.8rem;color:#737373">${[dealer.city,dealer.state].filter(Boolean).join(", ")}</div>`:""}
        ${dealer?.phone?`<div style="font-size:0.78rem;color:#737373">Tel: ${dealer.phone}</div>`:""}
        ${dealer?.email?`<div style="font-size:0.78rem;color:#737373">Email: ${dealer.email}</div>`:""}
      </div>
    </div>`;

  /* ── PDF export ── */
  const exportPDF = () => {
    if (!data) return;
    const s = data.summary;
    const html = `<!DOCTYPE html><html><head><title>Financial Report — ${dealer?.companyName||"Dealer"}</title><style>
      *{box-sizing:border-box}body{font-family:Arial,sans-serif;margin:0;padding:24px;color:#1A1A1A;max-width:960px;margin:0 auto}
      .title{font-size:1.25rem;color:#F47B20;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;margin-bottom:4px}
      .meta{color:#888;font-size:0.78rem;margin-bottom:20px}
      .section{font-size:0.78rem;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#888;margin:20px 0 8px;padding-bottom:6px;border-bottom:1.5px solid #E5E5E5}
      .grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:16px}
      .card{border-radius:8px;padding:12px;border:1px solid}
      .card.orange{background:#FFF7ED;border-color:#F47B20}.card.red{background:#FEF2F2;border-color:#FCA5A5}.card.green{background:#F0FDF4;border-color:#86EFAC}.card.blue{background:#EFF6FF;border-color:#BFDBFE}
      .cv{font-size:1.35rem;font-weight:700;color:#F47B20}.card.red .cv{color:#DC2626}.card.green .cv{color:#16A34A}.card.blue .cv{color:#3B8BD4}
      .cl{font-size:0.68rem;color:#888;margin-top:3px;text-transform:uppercase;letter-spacing:0.06em}
      table{width:100%;border-collapse:collapse;margin-bottom:16px;font-size:0.8rem}
      th{background:#1A1A1A;color:#fff;padding:7px 10px;text-align:left;font-size:0.72rem;letter-spacing:0.06em}
      td{padding:7px 10px;border-bottom:1px solid #F0F0F0}tr:nth-child(even) td{background:#FAFAFA}
      .total-row td{background:#F5F5F5;font-weight:700;border-top:2px solid #1A1A1A}
      .sig{margin-top:40px;display:grid;grid-template-columns:1fr 1fr;gap:40px}
      .sig-line{border-top:1.5px solid #1A1A1A;padding-top:6px;font-size:0.72rem;color:#888;margin-top:40px}
      .footer{margin-top:24px;font-size:0.68rem;color:#888;text-align:center;border-top:1px solid #E5E5E5;padding-top:12px}
      @media print{body{padding:12px}@page{margin:1cm}}
    </style></head><body>
      ${dealerHeader(dealer)}
      <div class="title">FINANCIAL STATEMENT</div>
      <div class="meta">Period: All time &nbsp;|&nbsp; Generated: ${now}</div>

      <div class="section">INCOME STATEMENT</div>
      <div class="grid">
        <div class="card orange"><div class="cv">${fmt(s?.totalRevenue||0)}</div><div class="cl">Total Revenue</div></div>
        <div class="card red"><div class="cv">${fmt(s?.totalExpenses||0)}</div><div class="cl">Total Expenses</div></div>
        <div class="card ${((s?.totalRevenue||0)-(s?.totalExpenses||0))>=0?"green":"red"}"><div class="cv">${fmt((s?.totalRevenue||0)-(s?.totalExpenses||0))}</div><div class="cl">Net Income (Rev − Exp)</div></div>
        <div class="card orange"><div class="cv">${fmt(s?.totalProfit||0)}</div><div class="cl">Gross Profit (from sales)</div></div>
        <div class="card blue"><div class="cv">${s?.totalSales||0}</div><div class="cl">Transactions</div></div>
        <div class="card blue"><div class="cv">${s?.soldCars||0} / ${s?.totalCars||0}</div><div class="cl">Cars Sold / Listed</div></div>
      </div>

      <div class="section">MONTHLY REVENUE & PROFIT (LAST 6 MONTHS)</div>
      <table><thead><tr><th>Month</th><th>Revenue</th><th>Cost of Goods</th><th>Gross Profit</th><th>Margin %</th><th>Sales Count</th></tr></thead>
      <tbody>${(data.monthlySales||[]).map((m:any)=>{
        const margin=m.revenue>0?Math.round((m.profit/m.revenue)*100):0;
        const cogs=m.revenue-m.profit;
        return `<tr><td>${m.month}</td><td style="color:#F47B20;font-weight:600">${fmt(m.revenue)}</td><td style="color:#DC2626">${fmt(cogs)}</td><td style="color:#16A34A;font-weight:600">${fmt(m.profit)}</td><td>${margin}%</td><td>${m.count}</td></tr>`;
      }).join("")}
      <tr class="total-row"><td>TOTAL</td><td>${fmt((data.monthlySales||[]).reduce((a:number,m:any)=>a+m.revenue,0))}</td><td>${fmt((data.monthlySales||[]).reduce((a:number,m:any)=>a+(m.revenue-m.profit),0))}</td><td>${fmt((data.monthlySales||[]).reduce((a:number,m:any)=>a+m.profit,0))}</td><td>—</td><td>${(data.monthlySales||[]).reduce((a:number,m:any)=>a+m.count,0)}</td></tr>
      </tbody></table>

      <div class="section">TOP BRANDS SOLD</div>
      <table><thead><tr><th>Rank</th><th>Brand</th><th>Units Sold</th><th>Revenue</th><th>Share %</th></tr></thead>
      <tbody>${(data.topBrands||[]).map((b:any,i:number)=>{
        const share=s?.totalRevenue>0?Math.round((b.revenue/s.totalRevenue)*100):0;
        return `<tr><td>#${i+1}</td><td><strong>${b.brand}</strong></td><td>${b.count}</td><td style="color:#F47B20;font-weight:600">${fmt(b.revenue)}</td><td>${share}%</td></tr>`;
      }).join("")}</tbody></table>

      <div class="section">EXPENSES BY CATEGORY</div>
      <table><thead><tr><th>Category</th><th>Entries</th><th>Total Amount</th></tr></thead>
      <tbody>${(data.expensesByCategory||[]).map((e:any)=>`<tr><td style="text-transform:capitalize">${e.category?.replace(/_/g," ")}</td><td>${e.count}</td><td style="color:#DC2626;font-weight:600">${fmt(e.total)}</td></tr>`).join("")}
      <tr class="total-row"><td>TOTAL EXPENSES</td><td>${(data.expensesByCategory||[]).reduce((a:number,e:any)=>a+e.count,0)}</td><td style="color:#DC2626">${fmt(s?.totalExpenses||0)}</td></tr>
      </tbody></table>

      <div class="section">PAYMENT METHODS</div>
      <table><thead><tr><th>Method</th><th>Transactions</th><th>Total</th></tr></thead>
      <tbody>${(data.paymentBreakdown||[]).map((p:any)=>`<tr><td style="text-transform:capitalize">${p.method?.replace(/_/g," ")}</td><td>${p.count}</td><td style="font-weight:600">${fmt(p.total)}</td></tr>`).join("")}</tbody></table>

      ${dealer?.signature?`<div class="sig"><div><img src="${dealer.signature}" style="height:50px;object-fit:contain;display:block;margin-bottom:6px"/><div class="sig-line">${dealer?.companyName||""} · Authorised Signatory</div></div><div><div class="sig-line" style="margin-top:40px">Date & Stamp</div></div></div>`:""}

      <div class="footer">${dealer?.companyName||"CARSTRIMS"} · Dealer ID: ${dealer?.dealerId||""} · Report generated ${now} · Powered by UASE TECH STUDIO</div>
      <script>window.onload=()=>window.print()<\/script>
    </body></html>`;
    const win=window.open("","_blank");
    if(win){win.document.write(html);win.document.close();}
  };

  /* ── CSV/Excel export ── */
  const exportCSV = () => {
    if (!data) return;
    const s = data.summary;
    const rows: any[][] = [
      [`Financial Report — ${dealer?.companyName||"Dealer"}`],
      [`Generated: ${now}`],
      [`Dealer ID: ${dealer?.dealerId||""}`],
      [],
      ["INCOME STATEMENT"],
      ["Metric","Value"],
      ["Total Revenue", s?.totalRevenue||0],
      ["Total Expenses", s?.totalExpenses||0],
      ["Net Income (Revenue - Expenses)", (s?.totalRevenue||0)-(s?.totalExpenses||0)],
      ["Gross Profit (from sales)", s?.totalProfit||0],
      ["Total Sales / Transactions", s?.totalSales||0],
      ["Cars Sold", s?.soldCars||0],
      ["Cars Listed", s?.totalCars||0],
      [],
      ["MONTHLY BREAKDOWN"],
      ["Month","Revenue","Cost of Goods","Gross Profit","Margin %","Count"],
      ...(data.monthlySales||[]).map((m:any)=>{
        const margin=m.revenue>0?Math.round((m.profit/m.revenue)*100):0;
        return [m.month, m.revenue, m.revenue-m.profit, m.profit, `${margin}%`, m.count];
      }),
      [],
      ["TOP BRANDS"],
      ["Rank","Brand","Units Sold","Revenue"],
      ...(data.topBrands||[]).map((b:any,i:number)=>[`#${i+1}`,b.brand,b.count,b.revenue]),
      [],
      ["EXPENSES BY CATEGORY"],
      ["Category","Entries","Total"],
      ...(data.expensesByCategory||[]).map((e:any)=>[e.category,e.count,e.total]),
      [],
      ["PAYMENT METHODS"],
      ["Method","Transactions","Total"],
      ...(data.paymentBreakdown||[]).map((p:any)=>[p.method?.replace(/_/g," "),p.count,p.total]),
    ];
    const csv=rows.map(r=>r.map((c:any)=>`"${String(c||"").replace(/"/g,'""')}"`).join(",")).join("\n");
    const blob=new Blob([csv],{type:"text/csv;charset=utf-8;"});
    const a=document.createElement("a");a.href=URL.createObjectURL(blob);
    a.download=`financial-report-${Date.now()}.csv`;a.click();URL.revokeObjectURL(a.href);
  };

  if (loading) return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"50vh"}}>
      <div style={{width:"28px",height:"28px",border:"2.5px solid #E5E5E5",borderTopColor:"#F47B20",borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (!data) return <div style={{padding:"2rem",color:"#888"}}>Could not load reports. Make sure you have sales data.</div>;

  const s = data.summary;
  const maxMonthRev = Math.max(...(data.monthlySales||[]).map((m:any)=>m.revenue), 1);
  const netIncome = (s?.totalRevenue||0) - (s?.totalExpenses||0);

  return (
    <>
      {reportCarId&&<CarFinancialReport carId={reportCarId} onClose={()=>setReportCarId(null)}/>}

    <div className="reports-page">
      {/* Header with dealer info */}
      <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:"1rem",flexWrap:"wrap"}}>
        <div style={{display:"flex",alignItems:"center",gap:"1rem",flexWrap:"wrap"}}>
          {dealer?.logo&&(
            <div style={{width:"56px",height:"56px",borderRadius:"10px",overflow:"hidden",border:"2px solid rgba(244,123,32,0.3)",flexShrink:0}}>
              <img src={dealer.logo} alt="" style={{width:"100%",height:"100%",objectFit:"cover",display:"block"}}/>
            </div>
          )}
          <div>
            <h2 className="page-heading">{dealer?.companyName||"Reports & Analytics"}</h2>
            <p className="page-sub">Financial Statement · {[dealer?.city,dealer?.state].filter(Boolean).join(", ")||"Complete overview"}</p>
          </div>
        </div>
        <div style={{display:"flex",gap:"0.5rem",flexWrap:"wrap"}}>
          <button className="btn-export" onClick={exportCSV} style={{background:"#F0FDF4",color:"#16A34A",border:"1.5px solid #86EFAC"}}>⬇ CSV / Excel</button>
          <button className="btn-export" onClick={exportPDF}>⬇ PDF Report</button>
        </div>
      </div>

      {/* Income Statement */}
      <div className="section-title">INCOME STATEMENT</div>
      <div className="summary-grid">
        {[
          {label:"Total Revenue",      val:fmt(s?.totalRevenue||0),   cls:"accent"},
          {label:"Cost of Goods Sold", val:fmt((s?.totalRevenue||0)-(s?.totalProfit||0)), cls:"red"},
          {label:"Gross Profit",       val:fmt(s?.totalProfit||0),    cls:"green"},
          {label:"Total Expenses",     val:fmt(s?.totalExpenses||0),  cls:"red"},
          {label:"Net Income",         val:fmt(netIncome),            cls:netIncome>=0?"green":"red"},
          {label:"Total Transactions", val:s?.totalSales||0,          cls:""},
          {label:"Cars Sold / Listed", val:`${s?.soldCars||0} / ${s?.totalCars||0}`, cls:""},
          {label:"Staff",              val:s?.totalStaff||0,          cls:""},
        ].map(card=>(
          <div key={card.label} className={`sum-card ${card.cls}`}>
            <div className="sc-val">{card.val}</div>
            <div className="sc-label">{card.label}</div>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="chart-card">
        <div className="section-title">MONTHLY REVENUE & PROFIT</div>
        <div className="bar-chart">
          {(data.monthlySales||[]).map((m:any,i:number)=>(
            <div key={i} className="bar-col">
              <div className="bar-pair">
                <div className="bar rev-bar" style={{height:`${Math.max(6,(m.revenue/maxMonthRev)*160)}px`}} title={fmt(m.revenue)}/>
                <div className="bar profit-bar" style={{height:`${Math.max(3,(m.profit/maxMonthRev)*160)}px`}} title={fmt(m.profit)}/>
              </div>
              <div className="bar-label">{m.month}</div>
              <div className="bar-count">{m.count} sold</div>
            </div>
          ))}
        </div>
        <div className="chart-legend">
          <span className="legend-item"><span className="legend-dot rev"/>Revenue</span>
          <span className="legend-item"><span className="legend-dot profit"/>Profit</span>
        </div>
      </div>

      <div className="two-col">
        <div className="list-card">
          <div className="section-title">TOP BRANDS SOLD</div>
          {!data.topBrands?.length?<div className="no-data">No sales data yet</div>
          :data.topBrands?.map((b:any,i:number)=>(
            <div key={i} className="list-row">
              <span className="list-rank">#{i+1}</span>
              <span className="list-name">{b.brand}</span>
              <span className="list-count">{b.count} sold</span>
              <span className="list-val">{fmt(b.revenue)}</span>
            </div>
          ))}
        </div>
        <div className="list-card">
          <div className="section-title">PAYMENT METHODS</div>
          {!data.paymentBreakdown?.length?<div className="no-data">No payment data</div>
          :data.paymentBreakdown?.map((p:any,i:number)=>(
            <div key={i} className="list-row">
              <span className="list-name" style={{textTransform:"capitalize"}}>{p.method?.replace(/_/g," ")}</span>
              <span className="list-count">{p.count} txn</span>
              <span className="list-val">{fmt(p.total)}</span>
            </div>
          ))}
        </div>
        <div className="list-card">
          <div className="section-title">EXPENSES BY CATEGORY</div>
          {!data.expensesByCategory?.length?<div className="no-data">No expenses recorded</div>
          :data.expensesByCategory?.map((e:any,i:number)=>(
            <div key={i} className="list-row">
              <span className="list-name" style={{textTransform:"capitalize"}}>{e.category?.replace(/_/g," ")}</span>
              <span className="list-count">{e.count} entries</span>
              <span className="list-val red-val">{fmt(e.total)}</span>
            </div>
          ))}
        </div>
        <div className="list-card">
          <div className="section-title">STAFF PERFORMANCE</div>
          {!data.staffPerformance?.length?<div className="no-data">No staff sales recorded</div>
          :data.staffPerformance?.map((st:any,i:number)=>(
            <div key={i} className="list-row">
              <span className="list-rank">#{i+1}</span>
              <span className="list-name">{st.name}</span>
              <span className="list-count">{st.sales} sales</span>
              <span className="list-val">{fmt(st.revenue)}</span>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .reports-page{display:flex;flex-direction:column;gap:1.5rem}
        .page-heading{font-family:var(--font-display);font-size:1.5rem;letter-spacing:0.05em;color:#1A1A1A;line-height:1;margin:0}
        .page-sub{font-size:0.8rem;color:#888;margin-top:0.3rem}
        .btn-export{background:#F47B20;color:#fff;border:none;border-radius:6px;padding:0.65rem 1.25rem;font-family:var(--font-display);font-size:0.875rem;letter-spacing:0.08em;cursor:pointer;transition:all 0.2s;white-space:nowrap}
        .btn-export:hover{opacity:0.85;transform:translateY(-1px)}
        .section-title{font-size:0.7rem;font-weight:600;letter-spacing:0.15em;text-transform:uppercase;color:#888}
        .summary-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(155px,1fr));gap:1rem}
        .sum-card{background:#fff;border:1.5px solid #E5E5E5;border-radius:10px;padding:1rem 1.1rem;display:flex;flex-direction:column;gap:0.3rem;transition:border-color 0.2s}
        .sum-card.accent{border-color:#F47B20;background:#FFF7ED}
        .sum-card.red{border-color:rgba(220,38,38,0.35);background:#FEF2F2}
        .sum-card.green{border-color:rgba(22,163,74,0.35);background:#F0FDF4}
        .sc-val{font-family:var(--font-display);font-size:1.45rem;color:#F47B20;line-height:1}
        .sum-card.red .sc-val{color:#DC2626}.sum-card.green .sc-val{color:#16A34A}
        .sc-label{font-size:0.65rem;color:#888;text-transform:uppercase;letter-spacing:0.06em;line-height:1.3}
        .chart-card{background:#fff;border:1.5px solid #E5E5E5;border-radius:10px;padding:1.25rem;display:flex;flex-direction:column;gap:1rem}
        .bar-chart{display:flex;align-items:flex-end;gap:1rem;height:185px;overflow-x:auto;padding-bottom:0.5rem}
        .bar-col{display:flex;flex-direction:column;align-items:center;gap:4px;min-width:60px}
        .bar-pair{display:flex;align-items:flex-end;gap:3px;height:160px}
        .bar{border-radius:3px 3px 0 0;cursor:pointer;transition:opacity 0.2s}.bar:hover{opacity:0.8}
        .rev-bar{background:#F47B20;min-width:18px}.profit-bar{background:#16A34A;min-width:14px}
        .bar-label{font-size:0.7rem;color:#888;text-align:center}.bar-count{font-size:0.62rem;color:#AAA;text-align:center}
        .chart-legend{display:flex;gap:1.5rem}
        .legend-item{display:flex;align-items:center;gap:0.4rem;font-size:0.78rem;color:#666}
        .legend-dot{width:10px;height:10px;border-radius:2px}
        .legend-dot.rev{background:#F47B20}.legend-dot.profit{background:#16A34A}
        .two-col{display:grid;grid-template-columns:1fr 1fr;gap:1.25rem}
        .list-card{background:#fff;border:1.5px solid #E5E5E5;border-radius:10px;padding:1.25rem;display:flex;flex-direction:column;gap:0.75rem}
        .list-row{display:flex;align-items:center;gap:0.75rem;padding:0.5rem 0;border-bottom:1px solid #F0F0F0}
        .list-row:last-child{border-bottom:none}
        .list-rank{font-family:var(--font-display);font-size:0.9rem;color:#F47B20;min-width:24px}
        .list-name{flex:1;font-size:0.825rem;color:#1A1A1A}
        .list-count{font-size:0.75rem;color:#888;white-space:nowrap}
        .list-val{font-size:0.825rem;font-weight:600;color:#F47B20;min-width:90px;text-align:right;white-space:nowrap}
        .red-val{color:#DC2626}.no-data{font-size:0.825rem;color:#AAA;text-align:center;padding:1rem}
        @media(max-width:900px){.two-col{grid-template-columns:1fr}}
        @media(max-width:640px){.summary-grid{grid-template-columns:1fr 1fr}.bar-chart{gap:0.5rem}}
        @media(max-width:480px){.summary-grid{grid-template-columns:1fr}}
      `}</style>
    </div>
    </>
  );
}
