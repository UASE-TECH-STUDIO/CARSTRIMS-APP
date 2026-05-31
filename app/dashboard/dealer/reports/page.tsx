"use client";
import { useEffect, useState, useCallback } from "react";
import api from "@/lib/api";
import CarFinancialReport from "@/components/dealer/CarFinancialReport";

//  Period presets 
const PERIODS = [
  { id:"all",     label:"All Time" },
  { id:"today",   label:"Today" },
  { id:"week",    label:"This Week" },
  { id:"month",   label:"This Month" },
  { id:"quarter", label:"This Quarter" },
  { id:"year",    label:"This Year" },
  { id:"custom",  label:"Custom Range" },
];

//  Report types (what to include in the exported PDF) 
const REPORT_TYPES = [
  { id:"full",        label:"Full Financial Report" },
  { id:"sales",       label:"Sales Only" },
  { id:"expenses",    label:"Expenses Only" },
  { id:"monthly",     label:"Monthly Breakdown" },
  { id:"brands",      label:"Top Brands" },
];

export default function ReportsPage() {
  const [data, setData]       = useState<any>(null);
  const [dealer, setDealer]   = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [reportCarId, setReportCarId] = useState<string|null>(null);

  // Filter state
  const [period,    setPeriod]    = useState("all");
  const [dateFrom,  setDateFrom]  = useState("");
  const [dateTo,    setDateTo]    = useState("");
  const [reportType,setReportType]= useState("full");
  const [applying,  setApplying]  = useState(false);

  const fetchReports = useCallback(async (p = period, df = dateFrom, dt = dateTo) => {
    setApplying(true);
    try {
      const params: any = {};
      if (p !== "all" && p !== "custom") params.period = p;
      if (p === "custom" && df) params.dateFrom = df;
      if (p === "custom" && dt) params.dateTo   = dt;

      const [rRep, rDealer] = await Promise.all([
        api.get("/api/v1/dealers/me/reports", { params }),
        api.get("/api/v1/dealers/me"),
      ]);
      setData(rRep.data);
      setDealer(rDealer.data);
    } catch {} finally { setLoading(false); setApplying(false); }
  }, [period, dateFrom, dateTo]);

  useEffect(() => { fetchReports("all"); }, []);

  const applyFilter = () => fetchReports(period, dateFrom, dateTo);

  const fmt  = (n: number) => `${(n||0).toLocaleString()}`;
  const fmtN = (n: number) => `NGN ${(n||0).toLocaleString()}`;
  const now  = new Date().toLocaleString("en-NG");

  const periodLabel = () => {
    if (period === "custom" && dateFrom && dateTo)
      return `${dateFrom} to ${dateTo}`;
    if (period === "custom" && dateFrom) return `From ${dateFrom}`;
    return PERIODS.find(p => p.id === period)?.label || "All Time";
  };

  //  PDF Export 
  const exportPDF = () => {
    if (!data) return;
    const s = data.summary;
    const netIncome = (s?.totalRevenue||0) - (s?.totalExpenses||0);
    const cogs      = (s?.totalRevenue||0) - (s?.totalProfit||0);

    const dealerHead = `
      <div style="display:flex;align-items:center;gap:16px;margin-bottom:16px;padding-bottom:14px;border-bottom:3px solid #F47B20">
        ${dealer?.logo?`<img src="${dealer.logo}" style="width:60px;height:60px;object-fit:cover;border-radius:9px;border:2px solid #E5E5E5"/>`:``}
        <div>
          <div style="font-size:1.3rem;font-weight:700;color:#1A1A1A">${dealer?.companyName||"CARSTRIMS"}</div>
          ${[dealer?.address,dealer?.city,dealer?.state].filter(Boolean).map(v=>`<div style="font-size:0.78rem;color:#737373">${v}</div>`).join("")}
          ${dealer?.phone?`<div style="font-size:0.78rem;color:#737373">Tel: ${dealer.phone}</div>`:""}
          ${dealer?.email?`<div style="font-size:0.78rem;color:#737373">${dealer.email}</div>`:""}
        </div>
      </div>`;

    const incomeSection = `
      <div class="section">INCOME STATEMENT</div>
      <div class="grid6">
        <div class="card orange"><div class="cv">${fmtN(s?.totalRevenue||0)}</div><div class="cl">Revenue</div></div>
        <div class="card red"><div class="cv">${fmtN(cogs)}</div><div class="cl">Cost of Goods</div></div>
        <div class="card green"><div class="cv">${fmtN(s?.totalProfit||0)}</div><div class="cl">Gross Profit</div></div>
        <div class="card red"><div class="cv">${fmtN(s?.totalExpenses||0)}</div><div class="cl">Expenses</div></div>
        <div class="card ${netIncome>=0?"green":"red"}"><div class="cv">${fmtN(netIncome)}</div><div class="cl">Net Income</div></div>
        <div class="card blue"><div class="cv">${s?.soldCars||0} / ${s?.totalCars||0}</div><div class="cl">Vehicles Sold / Listed</div></div>
      </div>`;

    const monthlySection = `
      <div class="section">MONTHLY BREAKDOWN</div>
      <table><thead><tr>
        <th>Month</th><th>Revenue</th><th>Cost of Goods</th><th>Gross Profit</th>
        <th>Expenses</th><th>Net Income</th><th>Margin %</th><th>Sales</th>
      </tr></thead><tbody>
        ${(data.monthlySales||[]).map((m:any)=>{
          const c=m.revenue-m.profit, ni=m.profit-(m.expenses||0);
          const margin=m.revenue>0?Math.round((ni/m.revenue)*100):0;
          return `<tr><td>${m.month}</td><td class="orange">${fmtN(m.revenue)}</td><td class="red">${fmtN(c)}</td><td class="green">${fmtN(m.profit)}</td><td class="red">${fmtN(m.expenses||0)}</td><td class="${ni>=0?"green":"red"}">${fmtN(ni)}</td><td>${margin}%</td><td>${m.count}</td></tr>`;
        }).join("")}
        <tr class="total-row"><td>TOTAL</td>
          <td>${fmtN((data.monthlySales||[]).reduce((a:number,m:any)=>a+m.revenue,0))}</td>
          <td>${fmtN((data.monthlySales||[]).reduce((a:number,m:any)=>a+(m.revenue-m.profit),0))}</td>
          <td>${fmtN((data.monthlySales||[]).reduce((a:number,m:any)=>a+m.profit,0))}</td>
          <td>${fmtN((data.monthlySales||[]).reduce((a:number,m:any)=>a+(m.expenses||0),0))}</td>
          <td>${fmtN((data.monthlySales||[]).reduce((a:number,m:any)=>a+(m.profit-(m.expenses||0)),0))}</td>
          <td></td><td>${(data.monthlySales||[]).reduce((a:number,m:any)=>a+m.count,0)}</td>
        </tr>
      </tbody></table>`;

    const brandsSection = `
      <div class="section">TOP BRANDS SOLD</div>
      <table><thead><tr><th>Rank</th><th>Brand</th><th>Units</th><th>Revenue</th><th>Share %</th></tr></thead><tbody>
        ${(data.topBrands||[]).map((b:any,i:number)=>{
          const share = s?.totalRevenue>0 ? Math.round((b.revenue/s.totalRevenue)*100) : 0;
          return `<tr><td>#${i+1}</td><td><strong>${b.brand}</strong></td><td>${b.count}</td><td class="orange">${fmtN(b.revenue)}</td><td>${share}%</td></tr>`;
        }).join("")}
      </tbody></table>`;

    const expensesSection = `
      <div class="section">EXPENSES BY CATEGORY</div>
      <table><thead><tr><th>Category</th><th>Entries</th><th>Total</th></tr></thead><tbody>
        ${(data.expensesByCategory||[]).map((e:any)=>`<tr><td style="text-transform:capitalize">${e.category?.replace(/_/g," ")}</td><td>${e.count}</td><td class="red">${fmtN(e.total)}</td></tr>`).join("")}
        <tr class="total-row"><td>TOTAL</td><td>${(data.expensesByCategory||[]).reduce((a:number,e:any)=>a+e.count,0)}</td><td class="red">${fmtN(s?.totalExpenses||0)}</td></tr>
      </tbody></table>`;

    const paymentSection = `
      <div class="section">PAYMENT METHODS</div>
      <table><thead><tr><th>Method</th><th>Transactions</th><th>Total</th></tr></thead><tbody>
        ${(data.paymentBreakdown||[]).map((p:any)=>`<tr><td style="text-transform:capitalize">${p.method?.replace(/_/g," ")}</td><td>${p.count}</td><td class="orange">${fmtN(p.total)}</td></tr>`).join("")}
      </tbody></table>`;

    const sections: Record<string,string> = {
      full:     incomeSection + monthlySection + brandsSection + expensesSection + paymentSection,
      sales:    incomeSection + brandsSection + paymentSection,
      expenses: expensesSection,
      monthly:  monthlySection,
      brands:   brandsSection,
    };

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
    <title>${REPORT_TYPES.find(r=>r.id===reportType)?.label} - ${dealer?.companyName||"Dealer"}</title>
    <style>
      *{box-sizing:border-box}body{font-family:Arial,sans-serif;margin:0;padding:24px;color:#1A1A1A;max-width:960px;margin:0 auto;font-size:0.85rem}
      .section{font-size:0.72rem;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#888;margin:20px 0 8px;padding-bottom:5px;border-bottom:1.5px solid #E5E5E5}
      .grid6{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:16px}
      .card{border-radius:8px;padding:12px;border:1px solid}
      .card.orange{background:#FFF7ED;border-color:#F47B20}
      .card.red{background:#FEF2F2;border-color:#FCA5A5}
      .card.green{background:#F0FDF4;border-color:#86EFAC}
      .card.blue{background:#EFF6FF;border-color:#BFDBFE}
      .cv{font-size:1.25rem;font-weight:700;color:#F47B20}
      .card.red .cv{color:#DC2626}.card.green .cv{color:#16A34A}.card.blue .cv{color:#3B8BD4}
      .cl{font-size:0.65rem;color:#888;margin-top:3px;text-transform:uppercase;letter-spacing:0.06em}
      table{width:100%;border-collapse:collapse;margin-bottom:16px;font-size:0.78rem}
      th{background:#1A1A1A;color:#fff;padding:7px 10px;text-align:left;font-size:0.7rem;letter-spacing:0.06em}
      td{padding:7px 10px;border-bottom:1px solid #F0F0F0}
      tr:nth-child(even) td{background:#FAFAFA}
      .total-row td{background:#F5F5F5;font-weight:700;border-top:2px solid #1A1A1A}
      .orange{color:#F47B20;font-weight:600}.red{color:#DC2626;font-weight:600}.green{color:#16A34A;font-weight:600}
      .sig-row{display:grid;grid-template-columns:1fr 1fr;gap:40px;margin-top:40px;border-top:1px solid #E5E5E5;padding-top:16px}
      .sig-line{height:40px;border-bottom:1px solid #1A1A1A;margin-bottom:6px}
      .footer{margin-top:24px;font-size:0.68rem;color:#888;text-align:center;border-top:1px solid #E5E5E5;padding-top:12px}
      @media print{@page{margin:1cm}body{padding:0}}
    </style></head><body>
      ${dealerHead}
      <div style="margin-bottom:16px">
        <div style="font-size:1.1rem;font-weight:700;color:#F47B20;letter-spacing:0.12em;text-transform:uppercase">
          ${REPORT_TYPES.find(r=>r.id===reportType)?.label||"Financial Report"}
        </div>
        <div style="font-size:0.78rem;color:#888;margin-top:3px">
          Period: ${periodLabel()} &nbsp;|&nbsp; Generated: ${now}
        </div>
      </div>
      ${sections[reportType] || sections.full}
      ${dealer?.signature?`
        <div class="sig-row">
          <div><img src="${dealer.signature}" style="height:48px;object-fit:contain;display:block;mix-blend-mode:multiply;margin-bottom:6px"/><div class="sig-line"></div><div style="font-size:0.75rem;color:#888">${dealer?.companyName}  Authorised Signatory</div></div>
          <div><div class="sig-line" style="margin-top:48px"></div><div style="font-size:0.75rem;color:#888">Date &amp; Stamp</div></div>
        </div>`:""}
      <div class="footer">${dealer?.companyName||"CARSTRIMS"} | Dealer ID: ${dealer?.dealerId||""} | Report generated ${now} | Powered by UASE TECH STUDIO</div>
      <script>window.onload=()=>window.print()<\/script>
    </body></html>`;

    const win = window.open("","_blank");
    if (win) { win.document.write(html); win.document.close(); }
  };

  //  CSV Export 
  const exportCSV = () => {
    if (!data) return;
    const s  = data.summary;
    const ni = (s?.totalRevenue||0) - (s?.totalExpenses||0);
    const rows: any[][] = [
      [`${REPORT_TYPES.find(r=>r.id===reportType)?.label||"Financial Report"} - ${dealer?.companyName||""}`],
      [`Period: ${periodLabel()}`],
      [`Generated: ${now}`],
      [],
      ["INCOME STATEMENT"],
      ["Revenue",                 s?.totalRevenue||0],
      ["Cost of Goods Sold",      (s?.totalRevenue||0)-(s?.totalProfit||0)],
      ["Gross Profit",            s?.totalProfit||0],
      ["Total Expenses",          s?.totalExpenses||0],
      ["Net Income",              ni],
      ["Vehicles Sold",           s?.soldCars||0],
      ["Vehicles Listed",         s?.totalCars||0],
      [],
      ["MONTHLY BREAKDOWN"],
      ["Month","Revenue","Cost of Goods","Gross Profit","Expenses","Net Income","Margin %","Sales"],
      ...(data.monthlySales||[]).map((m:any)=>{
        const ni2 = m.profit-(m.expenses||0);
        const margin = m.revenue>0?Math.round((ni2/m.revenue)*100):0;
        return [m.month, m.revenue, m.revenue-m.profit, m.profit, m.expenses||0, ni2, `${margin}%`, m.count];
      }),
      [],
      ["TOP BRANDS"],
      ["Rank","Brand","Units Sold","Revenue"],
      ...(data.topBrands||[]).map((b:any,i:number)=>[`#${i+1}`,b.brand,b.count,b.revenue]),
      [],
      ["EXPENSES BY CATEGORY"],
      ["Category","Entries","Total"],
      ...(data.expensesByCategory||[]).map((e:any)=>[e.category?.replace(/_/g," "),e.count,e.total]),
      [],
      ["PAYMENT METHODS"],
      ["Method","Transactions","Total"],
      ...(data.paymentBreakdown||[]).map((p:any)=>[p.method?.replace(/_/g," "),p.count,p.total]),
    ];
    const csv = "\uFEFF" + rows.map(r=>r.map((c:any)=>`"${String(c||"").replace(/"/g,'""')}"`).join(",")).join("\n");
    const blob = new Blob([csv],{type:"text/csv;charset=utf-8;"});
    const a    = document.createElement("a");
    a.href     = URL.createObjectURL(blob);
    a.download = `report-${reportType}-${period}-${Date.now()}.csv`;
    a.click(); URL.revokeObjectURL(a.href);
  };

  if (loading) return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"50vh"}}>
      <div style={{width:"28px",height:"28px",border:"2.5px solid #E5E5E5",borderTopColor:"#F47B20",borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
  if (!data) return <div style={{padding:"2rem",color:"#888"}}>Could not load reports.</div>;

  const s        = data.summary;
  const netIncome = (s?.totalRevenue||0) - (s?.totalExpenses||0);
  const maxRev    = Math.max(...(data.monthlySales||[]).map((m:any)=>m.revenue), 1);

  return (
    <>
      {reportCarId&&<CarFinancialReport carId={reportCarId} onClose={()=>setReportCarId(null)}/>}

      <div className="reports-page">

        {/*  Header  */}
        <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:"1rem",flexWrap:"wrap"}}>
          <div style={{display:"flex",alignItems:"center",gap:"1rem"}}>
            {dealer?.logo&&(
              <div style={{width:"52px",height:"52px",borderRadius:"9px",overflow:"hidden",border:"2px solid rgba(244,123,32,0.3)",flexShrink:0}}>
                <img src={dealer.logo} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
              </div>
            )}
            <div>
              <h2 className="page-heading">{dealer?.companyName||"Reports & Analytics"}</h2>
              <p className="page-sub">{periodLabel()} &bull; {new Date().toLocaleDateString("en-NG",{day:"numeric",month:"long",year:"numeric"})}</p>
            </div>
          </div>
          <div style={{display:"flex",gap:"0.5rem",flexWrap:"wrap"}}>
            <button className="btn-export" onClick={exportCSV} style={{background:"#F0FDF4",color:"#16A34A",border:"1.5px solid #86EFAC"}}>CSV</button>
            <button className="btn-export" onClick={exportPDF}>PDF / Print</button>
          </div>
        </div>

        {/*  Report Filter Panel  */}
        <div style={{background:"#fff",border:"1.5px solid #E5E5E5",borderRadius:"12px",padding:"1.25rem",display:"flex",flexDirection:"column",gap:"1rem"}}>
          <div style={{fontFamily:"var(--font-display)",fontSize:"0.72rem",letterSpacing:"0.12em",color:"#525252"}}>
            REPORT SETTINGS
          </div>

          {/* Report type + Period on one row */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0.875rem",flexWrap:"wrap"}}>
            {/* Report type */}
            <div>
              <div style={{fontSize:"0.68rem",fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase" as const,color:"#A3A3A3",marginBottom:"0.375rem"}}>Report Type</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:"0.375rem"}}>
                {REPORT_TYPES.map(r=>(
                  <button key={r.id} onClick={()=>setReportType(r.id)}
                    style={{padding:"0.35rem 0.75rem",borderRadius:"20px",border:`1.5px solid ${reportType===r.id?"#F47B20":"#E5E5E5"}`,background:reportType===r.id?"#FFF7ED":"#fff",color:reportType===r.id?"#C4621A":"#737373",fontSize:"0.75rem",cursor:"pointer",fontWeight:reportType===r.id?700:400,transition:"all 0.15s",whiteSpace:"nowrap" as const}}>
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Period */}
            <div>
              <div style={{fontSize:"0.68rem",fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase" as const,color:"#A3A3A3",marginBottom:"0.375rem"}}>Time Period</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:"0.375rem"}}>
                {PERIODS.map(p=>(
                  <button key={p.id} onClick={()=>setPeriod(p.id)}
                    style={{padding:"0.35rem 0.75rem",borderRadius:"20px",border:`1.5px solid ${period===p.id?"#1A1A1A":"#E5E5E5"}`,background:period===p.id?"#1A1A1A":"#fff",color:period===p.id?"#fff":"#737373",fontSize:"0.75rem",cursor:"pointer",fontWeight:period===p.id?700:400,transition:"all 0.15s",whiteSpace:"nowrap" as const}}>
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Custom date range */}
          {period === "custom" && (
            <div style={{display:"flex",gap:"0.75rem",alignItems:"center",flexWrap:"wrap"}}>
              <div>
                <div style={{fontSize:"0.65rem",color:"#A3A3A3",fontWeight:700,textTransform:"uppercase" as const,letterSpacing:"0.06em",marginBottom:"0.25rem"}}>From</div>
                <input type="date" value={dateFrom} onChange={e=>setDateFrom(e.target.value)}
                  style={{background:"#F5F5F5",border:"1.5px solid #E5E5E5",borderRadius:"7px",padding:"0.5rem 0.75rem",fontSize:"0.875rem",fontFamily:"var(--font-body)",outline:"none",cursor:"pointer"}}
                  onFocus={e=>e.target.style.borderColor="#F47B20"} onBlur={e=>e.target.style.borderColor="#E5E5E5"}/>
              </div>
              <div>
                <div style={{fontSize:"0.65rem",color:"#A3A3A3",fontWeight:700,textTransform:"uppercase" as const,letterSpacing:"0.06em",marginBottom:"0.25rem"}}>To</div>
                <input type="date" value={dateTo} onChange={e=>setDateTo(e.target.value)}
                  style={{background:"#F5F5F5",border:"1.5px solid #E5E5E5",borderRadius:"7px",padding:"0.5rem 0.75rem",fontSize:"0.875rem",fontFamily:"var(--font-body)",outline:"none",cursor:"pointer"}}
                  onFocus={e=>e.target.style.borderColor="#F47B20"} onBlur={e=>e.target.style.borderColor="#E5E5E5"}/>
              </div>
            </div>
          )}

          {/* Apply button */}
          <div style={{display:"flex",gap:"0.625rem",alignItems:"center"}}>
            <button onClick={applyFilter} disabled={applying}
              style={{background:"#F47B20",color:"#fff",border:"none",borderRadius:"8px",padding:"0.6rem 1.5rem",fontFamily:"var(--font-display)",fontSize:"0.85rem",letterSpacing:"0.08em",cursor:"pointer",fontWeight:700,opacity:applying?0.6:1,transition:"opacity 0.2s"}}>
              {applying ? "Loading..." : "Apply & Generate"}
            </button>
            {period !== "all" && (
              <span style={{fontSize:"0.75rem",color:"#A3A3A3"}}>
                Showing: <strong style={{color:"#F47B20"}}>{periodLabel()}</strong>
              </span>
            )}
          </div>
        </div>

        {/*  Income Statement  */}
        <div className="section-title">INCOME STATEMENT &mdash; {periodLabel().toUpperCase()}</div>
        <div className="summary-grid">
          {[
            {label:"Total Revenue",      val:fmtN(s?.totalRevenue||0),              cls:"accent"},
            {label:"Cost of Goods Sold", val:fmtN((s?.totalRevenue||0)-(s?.totalProfit||0)), cls:"red"},
            {label:"Gross Profit",       val:fmtN(s?.totalProfit||0),               cls:"green"},
            {label:"Total Expenses",     val:fmtN(s?.totalExpenses||0),             cls:"red"},
            {label:"Net Income",         val:fmtN(netIncome),                       cls:netIncome>=0?"green":"red"},
            {label:"Vehicles Sold / Listed", val:`${s?.soldCars||0} / ${s?.totalCars||0}`, cls:""},
          ].map(card=>(
            <div key={card.label} className={`sum-card ${card.cls}`}>
              <div className="sc-val">{card.val}</div>
              <div className="sc-label">{card.label}</div>
            </div>
          ))}
        </div>

        {/*  Bar Chart  */}
        <div className="chart-card">
          <div className="section-title">MONTHLY REVENUE &amp; PROFIT</div>
          {(data.monthlySales||[]).length === 0 ? (
            <div className="no-data">No data for this period</div>
          ) : (
            <>
              <div className="bar-chart">
                {(data.monthlySales||[]).map((m:any,i:number)=>(
                  <div key={i} className="bar-col">
                    <div className="bar-pair">
                      <div className="bar rev-bar" style={{height:`${Math.max(6,(m.revenue/maxRev)*160)}px`}} title={fmtN(m.revenue)}/>
                      <div className="bar profit-bar" style={{height:`${Math.max(3,(m.profit/maxRev)*160)}px`}} title={fmtN(m.profit)}/>
                    </div>
                    <div className="bar-label">{m.month}</div>
                    <div className="bar-count">{m.count} sold</div>
                  </div>
                ))}
              </div>
              <div className="chart-legend">
                <span className="legend-item"><span className="legend-dot rev"/>Revenue</span>
                <span className="legend-item"><span className="legend-dot profit"/>Gross Profit</span>
              </div>
            </>
          )}
        </div>

        {/*  Monthly table  */}
        {(data.monthlySales||[]).length > 0 && (
          <div className="list-card" style={{overflowX:"auto"}}>
            <div className="section-title">MONTHLY BREAKDOWN TABLE</div>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:"0.8rem",marginTop:"0.5rem"}}>
              <thead>
                <tr style={{background:"#1A1A1A",color:"#fff"}}>
                  {["Month","Revenue","Cost of Goods","Gross Profit","Expenses","Net Income","Margin %","Sales"].map(h=>(
                    <th key={h} style={{padding:"7px 10px",textAlign:"left",fontSize:"0.68rem",letterSpacing:"0.06em",fontWeight:600,whiteSpace:"nowrap"}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(data.monthlySales||[]).map((m:any,i:number)=>{
                  const cogs = m.revenue - m.profit;
                  const ni   = m.profit - (m.expenses||0);
                  const margin = m.revenue > 0 ? Math.round((ni/m.revenue)*100) : 0;
                  return (
                    <tr key={i} style={{borderBottom:"1px solid #F0F0F0",background:i%2===0?"#fff":"#FAFAFA"}}>
                      <td style={{padding:"7px 10px",fontWeight:600}}>{m.month}</td>
                      <td style={{padding:"7px 10px",color:"#F47B20",fontWeight:600}}>{fmtN(m.revenue)}</td>
                      <td style={{padding:"7px 10px",color:"#DC2626"}}>{fmtN(cogs)}</td>
                      <td style={{padding:"7px 10px",color:"#16A34A",fontWeight:600}}>{fmtN(m.profit)}</td>
                      <td style={{padding:"7px 10px",color:"#DC2626"}}>{fmtN(m.expenses||0)}</td>
                      <td style={{padding:"7px 10px",color:ni>=0?"#16A34A":"#DC2626",fontWeight:600}}>{fmtN(ni)}</td>
                      <td style={{padding:"7px 10px"}}>{margin}%</td>
                      <td style={{padding:"7px 10px"}}>{m.count}</td>
                    </tr>
                  );
                })}
                <tr style={{background:"#F5F5F5",fontWeight:700,borderTop:"2px solid #1A1A1A"}}>
                  <td style={{padding:"7px 10px"}}>TOTAL</td>
                  <td style={{padding:"7px 10px",color:"#F47B20"}}>{fmtN((data.monthlySales||[]).reduce((a:number,m:any)=>a+m.revenue,0))}</td>
                  <td style={{padding:"7px 10px",color:"#DC2626"}}>{fmtN((data.monthlySales||[]).reduce((a:number,m:any)=>a+(m.revenue-m.profit),0))}</td>
                  <td style={{padding:"7px 10px",color:"#16A34A"}}>{fmtN((data.monthlySales||[]).reduce((a:number,m:any)=>a+m.profit,0))}</td>
                  <td style={{padding:"7px 10px",color:"#DC2626"}}>{fmtN((data.monthlySales||[]).reduce((a:number,m:any)=>a+(m.expenses||0),0))}</td>
                  <td style={{padding:"7px 10px"}}>{fmtN((data.monthlySales||[]).reduce((a:number,m:any)=>a+(m.profit-(m.expenses||0)),0))}</td>
                  <td style={{padding:"7px 10px"}}></td>
                  <td style={{padding:"7px 10px"}}>{(data.monthlySales||[]).reduce((a:number,m:any)=>a+m.count,0)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/*  2-col lists  */}
        <div className="two-col">
          <div className="list-card">
            <div className="section-title">TOP BRANDS SOLD</div>
            {!data.topBrands?.length
              ? <div className="no-data">No sales in this period</div>
              : data.topBrands.map((b:any,i:number)=>(
                <div key={i} className="list-row">
                  <span className="list-rank">#{i+1}</span>
                  <span className="list-name">{b.brand}</span>
                  <span className="list-count">{b.count} sold</span>
                  <span className="list-val">{fmtN(b.revenue)}</span>
                </div>
              ))
            }
          </div>
          <div className="list-card">
            <div className="section-title">PAYMENT METHODS</div>
            {!data.paymentBreakdown?.length
              ? <div className="no-data">No payment data</div>
              : data.paymentBreakdown.map((p:any,i:number)=>(
                <div key={i} className="list-row">
                  <span className="list-name" style={{textTransform:"capitalize"}}>{p.method?.replace(/_/g," ")}</span>
                  <span className="list-count">{p.count} txn</span>
                  <span className="list-val">{fmtN(p.total)}</span>
                </div>
              ))
            }
          </div>
          <div className="list-card">
            <div className="section-title">EXPENSES BY CATEGORY</div>
            {!data.expensesByCategory?.length
              ? <div className="no-data">No expenses in this period</div>
              : data.expensesByCategory.map((e:any,i:number)=>(
                <div key={i} className="list-row">
                  <span className="list-name" style={{textTransform:"capitalize"}}>{e.category?.replace(/_/g," ")}</span>
                  <span className="list-count">{e.count} entries</span>
                  <span className="list-val red-val">{fmtN(e.total)}</span>
                </div>
              ))
            }
          </div>
          <div className="list-card">
            <div className="section-title">STAFF PERFORMANCE</div>
            {!data.staffPerformance?.length
              ? <div className="no-data">No staff sales in this period</div>
              : data.staffPerformance.map((st:any,i:number)=>(
                <div key={i} className="list-row">
                  <span className="list-rank">#{i+1}</span>
                  <span className="list-name">{st.name}</span>
                  <span className="list-count">{st.sales} sales</span>
                  <span className="list-val">{fmtN(st.revenue)}</span>
                </div>
              ))
            }
          </div>
        </div>

        <style>{`
          .reports-page{display:flex;flex-direction:column;gap:1.5rem}
          .page-heading{font-family:var(--font-display);font-size:1.5rem;letter-spacing:0.05em;color:#1A1A1A;line-height:1;margin:0}
          .page-sub{font-size:0.8rem;color:#888;margin-top:0.3rem}
          .btn-export{background:#F47B20;color:#fff;border:none;border-radius:6px;padding:0.65rem 1.25rem;font-family:var(--font-display);font-size:0.875rem;letter-spacing:0.08em;cursor:pointer;transition:all 0.2s;white-space:nowrap}
          .btn-export:hover{opacity:0.85}
          .section-title{font-size:0.7rem;font-weight:600;letter-spacing:0.15em;text-transform:uppercase;color:#888}
          .summary-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(155px,1fr));gap:1rem}
          .sum-card{background:#fff;border:1.5px solid #E5E5E5;border-radius:10px;padding:1rem 1.1rem;display:flex;flex-direction:column;gap:0.3rem}
          .sum-card.accent{border-color:#F47B20;background:#FFF7ED}
          .sum-card.red{border-color:rgba(220,38,38,0.35);background:#FEF2F2}
          .sum-card.green{border-color:rgba(22,163,74,0.35);background:#F0FDF4}
          .sc-val{font-family:var(--font-display);font-size:1.3rem;color:#F47B20;line-height:1}
          .sum-card.red .sc-val{color:#DC2626}.sum-card.green .sc-val{color:#16A34A}
          .sc-label{font-size:0.62rem;color:#888;text-transform:uppercase;letter-spacing:0.06em;line-height:1.3}
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
          @media(max-width:640px){.summary-grid{grid-template-columns:1fr 1fr}}
          @media(max-width:480px){.summary-grid{grid-template-columns:1fr}}
        `}</style>
      </div>
    </>
  );
}