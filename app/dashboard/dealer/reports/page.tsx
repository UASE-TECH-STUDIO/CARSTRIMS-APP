"use client";
import { useEffect, useState, useCallback } from "react";
import api from "@/lib/api";
import CarFinancialReport from "@/components/dealer/CarFinancialReport";
import { renderHtmlStringToPdfBlob, renderHtmlStringToJpgBlob, downloadBlob, shareBlob } from "@/lib/documentExport";
import { useToast } from "@/store/toastStore";

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

//  Report types 
const REPORT_TYPES = [
  { id:"full",        label:"Full Financial Report" },
  { id:"sales",       label:"Sales Only" },
  { id:"expenses",    label:"Expenses Only" },
  { id:"monthly",     label:"Monthly Breakdown" },
  { id:"brands",      label:"Top Brands" },
];

export default function ReportsPage() {
  const showToast = useToast();
  const [data, setData]       = useState<any>(null);
  const [dealer, setDealer]   = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [reportCarId, setReportCarId] = useState<string|null>(null);

  const [period,     setPeriod]     = useState("all");
  const [dateFrom,   setDateFrom]   = useState("");
  const [dateTo,     setDateTo]     = useState("");
  const [reportType, setReportType] = useState("full");
  const [applying,   setApplying]   = useState(false);

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
    if (period === "custom" && dateFrom && dateTo) return `${dateFrom} to ${dateTo}`;
    if (period === "custom" && dateFrom) return `From ${dateFrom}`;
    return PERIODS.find(p => p.id === period)?.label || "All Time";
  };

  // ── CORRECT margin: Net Profit ÷ Revenue (not Gross ÷ Revenue)
  // Net Profit = Revenue − COGS − Expenses = Gross Profit − Expenses
  const calcNetProfit  = (s: any) => (s?.totalProfit||0) - (s?.totalExpenses||0);
  const calcNetMargin  = (s: any) => {
    const rev = s?.totalRevenue || 0;
    const net = calcNetProfit(s);
    return rev > 0 ? Math.round((net / rev) * 100) : 0;
  };
  const calcGrossMargin = (s: any) => {
    const rev = s?.totalRevenue || 0;
    const gp  = s?.totalProfit  || 0;
    return rev > 0 ? Math.round((gp / rev) * 100) : 0;
  };

  //  Report HTML (used for both PDF and JPG export) 
  const buildReportHtml = (): string => {
    if (!data) return "";
    const s        = data.summary;
    const cogs     = (s?.totalRevenue||0) - (s?.totalProfit||0);
    const netProfit = calcNetProfit(s);
    const netMargin = calcNetMargin(s);
    const grossMargin = calcGrossMargin(s);

    const dealerHead = `
      <div style="display:flex;align-items:center;gap:16px;margin-bottom:16px;padding-bottom:14px;border-bottom:3px solid #F47B20">
        ${dealer?.logo ? `<img src="${dealer.logo}" style="width:60px;height:60px;object-fit:cover;border-radius:9px;border:2px solid #E5E5E5"/>` : ``}
        <div>
          <div style="font-size:1.3rem;font-weight:700;color:#1A1A1A">${dealer?.companyName||"CARSTRIMS"}</div>
          ${[dealer?.address,dealer?.city,dealer?.state].filter(Boolean).map(v=>`<div style="font-size:0.78rem;color:#737373">${v}</div>`).join("")}
          ${dealer?.phone  ? `<div style="font-size:0.78rem;color:#737373">Tel: ${dealer.phone}</div>`  : ""}
          ${dealer?.email  ? `<div style="font-size:0.78rem;color:#737373">${dealer.email}</div>`       : ""}
          ${dealer?.dealerId ? `<div style="font-size:0.72rem;color:#A3A3A3">Dealer ID: ${dealer.dealerId}</div>` : ""}
        </div>
      </div>`;

    // ── Income Statement — mirrors CarFinancialReport structure ──────────────
    const incomeSection = `
      <div class="section">INCOME STATEMENT</div>
      <div class="grid3">
        <div class="card orange"><div class="cv">${fmtN(s?.totalRevenue||0)}</div><div class="cl">Total Revenue</div></div>
        <div class="card red">  <div class="cv">${fmtN(cogs)}</div>            <div class="cl">Cost of Goods Sold (COGS)</div></div>
        <div class="card green"><div class="cv">${fmtN(s?.totalProfit||0)}</div><div class="cl">Gross Profit</div></div>
      </div>
      <div class="grid3" style="margin-top:8px">
        <div class="card red">  <div class="cv">${fmtN(s?.totalExpenses||0)}</div><div class="cl">Total Expenses</div></div>
        <div class="card ${netProfit>=0?"green":"red"}"><div class="cv">${fmtN(netProfit)}</div><div class="cl">Net Profit (After Expenses)</div></div>
        <div class="card blue"><div class="cv">${s?.soldCars||0} / ${s?.totalCars||0}</div><div class="cl">Vehicles Sold / Listed</div></div>
      </div>

      <div class="section" style="margin-top:14px">PROFITABILITY RATIOS</div>
      <table><thead><tr>
        <th>Metric</th><th>Formula</th><th class="r">Value</th>
      </tr></thead><tbody>
        <tr><td>Gross Profit Margin</td><td style="color:#737373;font-size:0.72rem">Gross Profit ÷ Revenue × 100</td><td class="r green">${grossMargin}%</td></tr>
        <tr><td><strong>Net Profit Margin</strong></td><td style="color:#737373;font-size:0.72rem"><strong>Net Profit ÷ Revenue × 100</strong></td><td class="r ${netMargin>=0?"green":"red"}"><strong>${netMargin}%</strong></td></tr>
        <tr><td>Return on Sales</td><td style="color:#737373;font-size:0.72rem">Net Profit ÷ Revenue × 100</td><td class="r ${netMargin>=0?"green":"red"}">${netMargin}%</td></tr>
      </tbody></table>`;

    // ── Monthly breakdown — matches per-car report table style ───────────────
    const monthlySection = `
      <div class="section">MONTHLY BREAKDOWN</div>
      <table><thead><tr>
        <th>Month</th><th>Revenue</th><th>COGS</th><th>Gross Profit</th>
        <th>Gross %</th><th>Expenses</th><th>Net Profit</th><th>Net %</th><th>Sales</th>
      </tr></thead><tbody>
        ${(data.monthlySales||[]).map((m:any) => {
          const mCogs     = m.revenue - m.profit;
          const mNet      = m.profit - (m.expenses||0);
          const mGrossPct = m.revenue > 0 ? Math.round((m.profit / m.revenue) * 100) : 0;
          const mNetPct   = m.revenue > 0 ? Math.round((mNet     / m.revenue) * 100) : 0;
          return `<tr>
            <td>${m.month}</td>
            <td class="orange">${fmtN(m.revenue)}</td>
            <td class="red">${fmtN(mCogs)}</td>
            <td class="green">${fmtN(m.profit)}</td>
            <td>${mGrossPct}%</td>
            <td class="red">${fmtN(m.expenses||0)}</td>
            <td class="${mNet>=0?"green":"red"}">${fmtN(mNet)}</td>
            <td class="${mNetPct>=0?"green":"red"}">${mNetPct}%</td>
            <td>${m.count}</td>
          </tr>`;
        }).join("")}
        <tr class="total-row">
          <td>TOTAL</td>
          <td>${fmtN((data.monthlySales||[]).reduce((a:number,m:any)=>a+m.revenue,0))}</td>
          <td>${fmtN((data.monthlySales||[]).reduce((a:number,m:any)=>a+(m.revenue-m.profit),0))}</td>
          <td>${fmtN((data.monthlySales||[]).reduce((a:number,m:any)=>a+m.profit,0))}</td>
          <td></td>
          <td>${fmtN((data.monthlySales||[]).reduce((a:number,m:any)=>a+(m.expenses||0),0))}</td>
          <td>${fmtN((data.monthlySales||[]).reduce((a:number,m:any)=>a+(m.profit-(m.expenses||0)),0))}</td>
          <td></td>
          <td>${(data.monthlySales||[]).reduce((a:number,m:any)=>a+m.count,0)}</td>
        </tr>
      </tbody></table>`;

    // ── Brands ───────────────────────────────────────────────────────────────
    const brandsSection = `
      <div class="section">TOP BRANDS SOLD</div>
      <table><thead><tr>
        <th>Rank</th><th>Brand</th><th>Units Sold</th><th>Revenue</th><th>Revenue Share</th>
      </tr></thead><tbody>
        ${(data.topBrands||[]).map((b:any, i:number) => {
          const share = s?.totalRevenue > 0 ? Math.round((b.revenue/s.totalRevenue)*100) : 0;
          return `<tr>
            <td><strong>#${i+1}</strong></td>
            <td><strong>${b.brand}</strong></td>
            <td>${b.count}</td>
            <td class="orange">${fmtN(b.revenue)}</td>
            <td>${share}%</td>
          </tr>`;
        }).join("")}
      </tbody></table>`;

    // ── Expenses ─────────────────────────────────────────────────────────────
    const expensesSection = `
      <div class="section">EXPENSES BY CATEGORY</div>
      <table><thead><tr>
        <th>Category</th><th>Entries</th><th class="r">Total</th><th class="r">% of Expenses</th>
      </tr></thead><tbody>
        ${(data.expensesByCategory||[]).map((e:any) => {
          const pct = s?.totalExpenses > 0 ? Math.round((e.total/s.totalExpenses)*100) : 0;
          return `<tr>
            <td style="text-transform:capitalize">${e.category?.replace(/_/g," ")}</td>
            <td>${e.count}</td>
            <td class="r red">${fmtN(e.total)}</td>
            <td class="r">${pct}%</td>
          </tr>`;
        }).join("")}
        <tr class="total-row">
          <td>TOTAL</td>
          <td>${(data.expensesByCategory||[]).reduce((a:number,e:any)=>a+e.count,0)}</td>
          <td class="r red">${fmtN(s?.totalExpenses||0)}</td>
          <td class="r">100%</td>
        </tr>
      </tbody></table>`;

    // ── Payment methods ───────────────────────────────────────────────────────
    const paymentSection = `
      <div class="section">PAYMENT METHODS</div>
      <table><thead><tr>
        <th>Method</th><th>Transactions</th><th class="r">Total</th>
      </tr></thead><tbody>
        ${(data.paymentBreakdown||[]).map((p:any) => `
          <tr>
            <td style="text-transform:capitalize">${p.method?.replace(/_/g," ")}</td>
            <td>${p.count}</td>
            <td class="r orange">${fmtN(p.total)}</td>
          </tr>`).join("")}
      </tbody></table>`;

    // ── Staff ─────────────────────────────────────────────────────────────────
    const staffSection = data.staffPerformance?.length ? `
      <div class="section">STAFF PERFORMANCE</div>
      <table><thead><tr>
        <th>Rank</th><th>Name</th><th>Sales</th><th class="r">Revenue</th>
      </tr></thead><tbody>
        ${data.staffPerformance.map((st:any, i:number) => `
          <tr>
            <td>#${i+1}</td><td>${st.name}</td><td>${st.sales}</td>
            <td class="r orange">${fmtN(st.revenue)}</td>
          </tr>`).join("")}
      </tbody></table>` : "";

    const sections: Record<string,string> = {
      full:     incomeSection + monthlySection + brandsSection + expensesSection + paymentSection + staffSection,
      sales:    incomeSection + brandsSection + paymentSection,
      expenses: expensesSection,
      monthly:  monthlySection,
      brands:   brandsSection,
    };

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
    <title>${REPORT_TYPES.find(r=>r.id===reportType)?.label} — ${dealer?.companyName||"Dealer"}</title>
    <style>
      *{box-sizing:border-box}
      body{font-family:Arial,sans-serif;margin:0;padding:24px;color:#1A1A1A;max-width:960px;margin:0 auto;font-size:0.85rem}
      .section{font-size:0.7rem;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#888;margin:20px 0 8px;padding-bottom:5px;border-bottom:1.5px solid #E5E5E5}
      .grid3{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:8px}
      .card{border-radius:8px;padding:12px 14px;border:1px solid}
      .card.orange{background:#FFF7ED;border-color:#F47B20}
      .card.red{background:#FEF2F2;border-color:#FCA5A5}
      .card.green{background:#F0FDF4;border-color:#86EFAC}
      .card.blue{background:#EFF6FF;border-color:#BFDBFE}
      .cv{font-size:1.2rem;font-weight:700;color:#F47B20}
      .card.red .cv{color:#DC2626}.card.green .cv{color:#16A34A}.card.blue .cv{color:#3B8BD4}
      .cl{font-size:0.62rem;color:#888;margin-top:3px;text-transform:uppercase;letter-spacing:0.06em}
      table{width:100%;border-collapse:collapse;margin-bottom:16px;font-size:0.78rem}
      th{background:#1A1A1A;color:#fff;padding:7px 10px;text-align:left;font-size:0.68rem;letter-spacing:0.06em;font-weight:600}
      th.r,td.r{text-align:right}
      td{padding:7px 10px;border-bottom:1px solid #F0F0F0;vertical-align:top}
      tr:nth-child(even) td{background:#FAFAFA}
      .total-row td{background:#F5F5F5;font-weight:700;border-top:2px solid #1A1A1A}
      .orange{color:#F47B20;font-weight:600}
      .red{color:#DC2626;font-weight:600}
      .green{color:#16A34A;font-weight:600}
      .sig-row{display:grid;grid-template-columns:1fr 1fr;gap:40px;margin-top:40px;border-top:1px solid #E5E5E5;padding-top:16px}
      .sig-line{height:48px;border-bottom:1px solid #1A1A1A;margin-bottom:6px}
      .footer{margin-top:24px;font-size:0.68rem;color:#888;text-align:center;border-top:1px solid #E5E5E5;padding-top:12px}
      @media print{@page{margin:1cm}body{padding:0}}
    </style></head><body>
      ${dealerHead}
      <div style="margin-bottom:16px">
        <div style="font-size:1.1rem;font-weight:700;color:#F47B20;letter-spacing:0.08em;text-transform:uppercase">
          ${REPORT_TYPES.find(r=>r.id===reportType)?.label||"Financial Report"}
        </div>
        <div style="font-size:0.78rem;color:#888;margin-top:3px">
          Period: ${periodLabel()} &nbsp;|&nbsp; Generated: ${now}
        </div>
      </div>
      ${sections[reportType] || sections.full}
      ${dealer?.signature ? `
        <div class="sig-row">
          <div>
            <img src="${dealer.signature}" style="height:48px;object-fit:contain;display:block;mix-blend-mode:multiply;margin-bottom:6px"/>
            <div class="sig-line"></div>
            <div style="font-size:0.75rem;color:#888">${dealer?.companyName} — Authorised Signatory</div>
          </div>
          <div>
            <div class="sig-line" style="margin-top:48px"></div>
            <div style="font-size:0.75rem;color:#888">Date &amp; Stamp</div>
          </div>
        </div>` : ""}
      <div class="footer">
        ${dealer?.companyName||"CARSTRIMS"} | Dealer ID: ${dealer?.dealerId||""} |
        Report generated ${now} | Powered by UASE TECH STUDIO
      </div>
    </body></html>`;
    return html;
  };

  const [exportBusy, setExportBusy] = useState<"" | "pdf" | "jpg" | "share">("");
  const [showExportPicker, setShowExportPicker] = useState<"download" | "share" | "">("");
  const reportExportFilename = () => `carstrims-report-${reportType}-${period}-${Date.now()}`;

  const handleReportDownload = async (format: "pdf" | "jpg") => {
    setShowExportPicker(""); setExportBusy(format);
    try {
      const html = buildReportHtml();
      const blob = format === "jpg" ? await renderHtmlStringToJpgBlob(html) : await renderHtmlStringToPdfBlob(html, "Financial Report");
      await downloadBlob(blob, `${reportExportFilename()}.${format}`);
    } catch (e: any) { showToast(e?.message || "Export failed", "error"); }
    finally { setExportBusy(""); }
  };

  const handleReportShare = async (format: "pdf" | "jpg") => {
    setShowExportPicker(""); setExportBusy("share");
    try {
      const html = buildReportHtml();
      const blob = format === "jpg" ? await renderHtmlStringToJpgBlob(html) : await renderHtmlStringToPdfBlob(html, "Financial Report");
      await shareBlob(blob, `${reportExportFilename()}.${format}`, "Financial Report");
    } catch (e: any) { showToast(e?.message || "Share failed", "error"); }
    finally { setExportBusy(""); }
  };


  // ── CSV Export ──────────────────────────────────────────────────────────────
  const exportCSV = () => {
    if (!data) return;
    const s        = data.summary;
    const netProfit = calcNetProfit(s);
    const netMargin = calcNetMargin(s);
    const grossMargin = calcGrossMargin(s);

    const rows: any[][] = [
      [`${REPORT_TYPES.find(r=>r.id===reportType)?.label||"Financial Report"} — ${dealer?.companyName||""}`],
      [`Period: ${periodLabel()}`],
      [`Generated: ${now}`],
      [],
      ["INCOME STATEMENT"],
      ["Total Revenue",              s?.totalRevenue||0],
      ["Cost of Goods Sold (COGS)",  (s?.totalRevenue||0)-(s?.totalProfit||0)],
      ["Gross Profit",               s?.totalProfit||0],
      [`Gross Profit Margin`,        `${grossMargin}%`],
      ["Total Expenses",             s?.totalExpenses||0],
      ["Net Profit (After Expenses)", netProfit],
      ["Net Profit Margin",          `${netMargin}%`],
      ["Vehicles Sold",              s?.soldCars||0],
      ["Vehicles Listed",            s?.totalCars||0],
      [],
      ["MONTHLY BREAKDOWN"],
      ["Month","Revenue","COGS","Gross Profit","Gross %","Expenses","Net Profit","Net %","Sales"],
      ...(data.monthlySales||[]).map((m:any) => {
        const mNet     = m.profit-(m.expenses||0);
        const mGrossPct = m.revenue > 0 ? Math.round((m.profit/m.revenue)*100) : 0;
        const mNetPct  = m.revenue > 0 ? Math.round((mNet/m.revenue)*100) : 0;
        return [m.month, m.revenue, m.revenue-m.profit, m.profit,
                `${mGrossPct}%`, m.expenses||0, mNet, `${mNetPct}%`, m.count];
      }),
      [],
      ["TOP BRANDS"],
      ["Rank","Brand","Units Sold","Revenue"],
      ...(data.topBrands||[]).map((b:any,i:number)=>[`#${i+1}`,b.brand,b.count,b.revenue]),
      [],
      ["EXPENSES BY CATEGORY"],
      ["Category","Entries","Total","% of Expenses"],
      ...(data.expensesByCategory||[]).map((e:any) => {
        const pct = s?.totalExpenses > 0 ? Math.round((e.total/s.totalExpenses)*100) : 0;
        return [e.category?.replace(/_/g," "), e.count, e.total, `${pct}%`];
      }),
      [],
      ["PAYMENT METHODS"],
      ["Method","Transactions","Total"],
      ...(data.paymentBreakdown||[]).map((p:any)=>[p.method?.replace(/_/g," "),p.count,p.total]),
    ];

    if (data.staffPerformance?.length) {
      rows.push([],["STAFF PERFORMANCE"],["Rank","Name","Sales","Revenue"]);
      data.staffPerformance.forEach((st:any,i:number)=>rows.push([`#${i+1}`,st.name,st.sales,st.revenue]));
    }

    const csv  = "\uFEFF" + rows.map(r=>r.map((c:any)=>`"${String(c||"").replace(/"/g,'""')}"`).join(",")).join("\n");
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

  const s          = data.summary;
  const netProfit  = calcNetProfit(s);
  const netMargin  = calcNetMargin(s);
  const grossMargin = calcGrossMargin(s);
  const maxRev     = Math.max(...(data.monthlySales||[]).map((m:any)=>m.revenue), 1);

  return (
    <>
      {reportCarId && <CarFinancialReport carId={reportCarId} onClose={()=>setReportCarId(null)}/>}

      <div className="reports-page">

        {/* Header */}
        <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:"1rem",flexWrap:"wrap"}}>
          <div style={{display:"flex",alignItems:"center",gap:"1rem"}}>
            {dealer?.logo && (
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
            <div style={{position:"relative"}}>
              <button className="btn-export" onClick={()=>setShowExportPicker(showExportPicker==="download"?"":"download")} disabled={exportBusy!==""}>
                {exportBusy==="pdf"||exportBusy==="jpg" ? "Exporting…" : "Download"}
              </button>
              {showExportPicker==="download" && (
                <div style={{position:"absolute",top:"calc(100% + 6px)",right:0,zIndex:30,background:"#fff",border:"1.5px solid #E5E5E5",borderRadius:"10px",boxShadow:"0 8px 24px rgba(0,0,0,0.15)",overflow:"hidden",minWidth:"130px",maxWidth:"calc(100vw - 2rem)"}}>
                  <button onClick={()=>handleReportDownload("pdf")} style={{display:"block",width:"100%",textAlign:"left" as const,padding:"0.6rem 0.9rem",background:"none",border:"none",cursor:"pointer",fontSize:"0.8rem",fontWeight:600}}>as PDF</button>
                  <button onClick={()=>handleReportDownload("jpg")} style={{display:"block",width:"100%",textAlign:"left" as const,padding:"0.6rem 0.9rem",background:"none",border:"none",borderTop:"1px solid #F5F5F5",cursor:"pointer",fontSize:"0.8rem",fontWeight:600}}>as JPG Image</button>
                  <button onClick={()=>{setShowExportPicker("");exportCSV();}} style={{display:"block",width:"100%",textAlign:"left" as const,padding:"0.6rem 0.9rem",background:"none",border:"none",borderTop:"1px solid #F5F5F5",cursor:"pointer",fontSize:"0.8rem",fontWeight:600}}>as Excel / CSV</button>
                </div>
              )}
            </div>
            <div style={{position:"relative"}}>
              <button className="btn-export" onClick={()=>setShowExportPicker(showExportPicker==="share"?"":"share")} disabled={exportBusy!==""} style={{background:"#FFF7ED",color:"#F47B20",border:"1.5px solid #FED7AA"}}>
                {exportBusy==="share" ? "Sharing…" : "Share"}
              </button>
              {showExportPicker==="share" && (
                <div style={{position:"absolute",top:"calc(100% + 6px)",right:0,zIndex:30,background:"#fff",border:"1.5px solid #E5E5E5",borderRadius:"10px",boxShadow:"0 8px 24px rgba(0,0,0,0.15)",overflow:"hidden",minWidth:"130px",maxWidth:"calc(100vw - 2rem)"}}>
                  <button onClick={()=>handleReportShare("pdf")} style={{display:"block",width:"100%",textAlign:"left" as const,padding:"0.6rem 0.9rem",background:"none",border:"none",cursor:"pointer",fontSize:"0.8rem",fontWeight:600}}>as PDF</button>
                  <button onClick={()=>handleReportShare("jpg")} style={{display:"block",width:"100%",textAlign:"left" as const,padding:"0.6rem 0.9rem",background:"none",border:"none",borderTop:"1px solid #F5F5F5",cursor:"pointer",fontSize:"0.8rem",fontWeight:600}}>as JPG Image</button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Filter Panel */}
        <div style={{background:"#fff",border:"1.5px solid #E5E5E5",borderRadius:"12px",padding:"1.25rem",display:"flex",flexDirection:"column",gap:"1rem"}}>
          <div style={{fontFamily:"var(--font-display)",fontSize:"0.72rem",letterSpacing:"0.12em",color:"#525252"}}>REPORT SETTINGS</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0.875rem",flexWrap:"wrap"}}>
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
          {period === "custom" && (
            <div style={{display:"flex",gap:"0.75rem",alignItems:"center",flexWrap:"wrap"}}>
              <div>
                <div style={{fontSize:"0.65rem",color:"#A3A3A3",fontWeight:700,textTransform:"uppercase" as const,letterSpacing:"0.06em",marginBottom:"0.25rem"}}>From</div>
                <input type="date" value={dateFrom} onChange={e=>setDateFrom(e.target.value)}
                  style={{background:"#F5F5F5",border:"1.5px solid #E5E5E5",borderRadius:"7px",padding:"0.5rem 0.75rem",fontSize:"0.875rem",outline:"none",cursor:"pointer"}}
                  onFocus={e=>e.target.style.borderColor="#F47B20"} onBlur={e=>e.target.style.borderColor="#E5E5E5"}/>
              </div>
              <div>
                <div style={{fontSize:"0.65rem",color:"#A3A3A3",fontWeight:700,textTransform:"uppercase" as const,letterSpacing:"0.06em",marginBottom:"0.25rem"}}>To</div>
                <input type="date" value={dateTo} onChange={e=>setDateTo(e.target.value)}
                  style={{background:"#F5F5F5",border:"1.5px solid #E5E5E5",borderRadius:"7px",padding:"0.5rem 0.75rem",fontSize:"0.875rem",outline:"none",cursor:"pointer"}}
                  onFocus={e=>e.target.style.borderColor="#F47B20"} onBlur={e=>e.target.style.borderColor="#E5E5E5"}/>
              </div>
            </div>
          )}
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

        {/* ── INCOME STATEMENT ── */}
        <div className="section-title">INCOME STATEMENT — {periodLabel().toUpperCase()}</div>

        {/* Row 1: Revenue flow */}
        <div className="summary-grid">
          {[
            { label:"Total Revenue",            val:fmtN(s?.totalRevenue||0),                                    cls:"accent",  sub:"Gross sales" },
            { label:"Cost of Goods Sold (COGS)", val:fmtN((s?.totalRevenue||0)-(s?.totalProfit||0)),             cls:"red",     sub:"Purchase cost of vehicles sold" },
            { label:"Gross Profit",              val:fmtN(s?.totalProfit||0),                                    cls:"green",   sub:`${grossMargin}% gross margin` },
            { label:"Total Expenses",            val:fmtN(s?.totalExpenses||0),                                  cls:"red",     sub:"Operational costs" },
            { label:"Net Profit",                val:fmtN(netProfit),                                            cls:netProfit>=0?"green":"red", sub:`${netMargin}% net margin` },
            { label:"Vehicles Sold / Listed",    val:`${s?.soldCars||0} / ${s?.totalCars||0}`,                   cls:"",        sub:"Inventory turnover" },
          ].map(card=>(
            <div key={card.label} className={`sum-card ${card.cls}`}>
              <div className="sc-val">{card.val}</div>
              <div className="sc-label">{card.label}</div>
              {card.sub && <div className="sc-sub">{card.sub}</div>}
            </div>
          ))}
        </div>

        {/* Margin callout */}
        <div style={{display:"flex",gap:"0.75rem",flexWrap:"wrap"}}>
          <div style={{flex:1,minWidth:"160px",background:"#F0FDF4",border:"1.5px solid #86EFAC",borderRadius:"10px",padding:"0.875rem 1rem"}}>
            <div style={{fontSize:"0.62rem",color:"#A3A3A3",fontWeight:700,textTransform:"uppercase" as const,letterSpacing:"0.06em",marginBottom:"0.25rem"}}>Gross Profit Margin</div>
            <div style={{fontFamily:"var(--font-display)",fontSize:"1.5rem",color:"#16A34A"}}>{grossMargin}%</div>
            <div style={{fontSize:"0.7rem",color:"#737373",marginTop:"2px"}}>Gross Profit ÷ Revenue</div>
          </div>
          <div style={{flex:1,minWidth:"160px",background:netMargin>=0?"#F0FDF4":"#FEF2F2",border:`1.5px solid ${netMargin>=0?"#86EFAC":"#FCA5A5"}`,borderRadius:"10px",padding:"0.875rem 1rem"}}>
            <div style={{fontSize:"0.62rem",color:"#A3A3A3",fontWeight:700,textTransform:"uppercase" as const,letterSpacing:"0.06em",marginBottom:"0.25rem"}}>Net Profit Margin</div>
            <div style={{fontFamily:"var(--font-display)",fontSize:"1.5rem",color:netMargin>=0?"#16A34A":"#DC2626"}}>{netMargin}%</div>
            <div style={{fontSize:"0.7rem",color:"#737373",marginTop:"2px"}}>Net Profit ÷ Revenue — includes all expenses</div>
          </div>
          <div style={{flex:1,minWidth:"160px",background:"#EFF6FF",border:"1.5px solid #BFDBFE",borderRadius:"10px",padding:"0.875rem 1rem"}}>
            <div style={{fontSize:"0.62rem",color:"#A3A3A3",fontWeight:700,textTransform:"uppercase" as const,letterSpacing:"0.06em",marginBottom:"0.25rem"}}>Avg. Profit Per Vehicle</div>
            <div style={{fontFamily:"var(--font-display)",fontSize:"1.5rem",color:"#3B8BD4"}}>
              {s?.soldCars > 0 ? fmtN(Math.round(netProfit / s.soldCars)) : "NGN 0"}
            </div>
            <div style={{fontSize:"0.7rem",color:"#737373",marginTop:"2px"}}>Net Profit ÷ Vehicles Sold</div>
          </div>
        </div>

        {/* Bar Chart */}
        <div className="chart-card">
          <div className="section-title">MONTHLY REVENUE &amp; NET PROFIT</div>
          {(data.monthlySales||[]).length === 0 ? (
            <div className="no-data">No data for this period</div>
          ) : (
            <>
              <div className="bar-chart">
                {(data.monthlySales||[]).map((m:any,i:number)=>{
                  const mNet = m.profit - (m.expenses||0);
                  return (
                    <div key={i} className="bar-col">
                      <div className="bar-pair">
                        <div className="bar rev-bar"    style={{height:`${Math.max(6,(m.revenue/maxRev)*160)}px`}} title={fmtN(m.revenue)}/>
                        <div className="bar net-bar"    style={{height:`${Math.max(3,(Math.max(0,mNet)/maxRev)*160)}px`}} title={fmtN(mNet)}/>
                      </div>
                      <div className="bar-label">{m.month}</div>
                      <div className="bar-count">{m.count} sold</div>
                    </div>
                  );
                })}
              </div>
              <div className="chart-legend">
                <span className="legend-item"><span className="legend-dot rev"/>Revenue</span>
                <span className="legend-item"><span className="legend-dot net"/>Net Profit</span>
              </div>
            </>
          )}
        </div>

        {/* Monthly table */}
        {(data.monthlySales||[]).length > 0 && (
          <div className="list-card" style={{overflowX:"auto"}}>
            <div className="section-title">MONTHLY BREAKDOWN TABLE</div>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:"0.8rem",marginTop:"0.5rem"}}>
              <thead>
                <tr style={{background:"#1A1A1A",color:"#fff"}}>
                  {["Month","Revenue","COGS","Gross Profit","Gross %","Expenses","Net Profit","Net %","Sales"].map(h=>(
                    <th key={h} style={{padding:"7px 10px",textAlign:"left",fontSize:"0.68rem",letterSpacing:"0.06em",fontWeight:600,whiteSpace:"nowrap"}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(data.monthlySales||[]).map((m:any,i:number)=>{
                  const cogs      = m.revenue - m.profit;
                  const mNet      = m.profit - (m.expenses||0);
                  const mGrossPct = m.revenue > 0 ? Math.round((m.profit / m.revenue) * 100) : 0;
                  const mNetPct   = m.revenue > 0 ? Math.round((mNet    / m.revenue) * 100) : 0;
                  return (
                    <tr key={i} style={{borderBottom:"1px solid #F0F0F0",background:i%2===0?"#fff":"#FAFAFA"}}>
                      <td style={{padding:"7px 10px",fontWeight:600}}>{m.month}</td>
                      <td style={{padding:"7px 10px",color:"#F47B20",fontWeight:600}}>{fmtN(m.revenue)}</td>
                      <td style={{padding:"7px 10px",color:"#DC2626"}}>{fmtN(cogs)}</td>
                      <td style={{padding:"7px 10px",color:"#16A34A",fontWeight:600}}>{fmtN(m.profit)}</td>
                      <td style={{padding:"7px 10px",color:"#737373"}}>{mGrossPct}%</td>
                      <td style={{padding:"7px 10px",color:"#DC2626"}}>{fmtN(m.expenses||0)}</td>
                      <td style={{padding:"7px 10px",color:mNet>=0?"#16A34A":"#DC2626",fontWeight:600}}>{fmtN(mNet)}</td>
                      <td style={{padding:"7px 10px",color:mNetPct>=0?"#16A34A":"#DC2626",fontWeight:600}}>{mNetPct}%</td>
                      <td style={{padding:"7px 10px"}}>{m.count}</td>
                    </tr>
                  );
                })}
                <tr style={{background:"#F5F5F5",fontWeight:700,borderTop:"2px solid #1A1A1A"}}>
                  <td style={{padding:"7px 10px"}}>TOTAL</td>
                  <td style={{padding:"7px 10px",color:"#F47B20"}}>{fmtN((data.monthlySales||[]).reduce((a:number,m:any)=>a+m.revenue,0))}</td>
                  <td style={{padding:"7px 10px",color:"#DC2626"}}>{fmtN((data.monthlySales||[]).reduce((a:number,m:any)=>a+(m.revenue-m.profit),0))}</td>
                  <td style={{padding:"7px 10px",color:"#16A34A"}}>{fmtN((data.monthlySales||[]).reduce((a:number,m:any)=>a+m.profit,0))}</td>
                  <td style={{padding:"7px 10px"}}></td>
                  <td style={{padding:"7px 10px",color:"#DC2626"}}>{fmtN((data.monthlySales||[]).reduce((a:number,m:any)=>a+(m.expenses||0),0))}</td>
                  <td style={{padding:"7px 10px",color:"#16A34A"}}>{fmtN((data.monthlySales||[]).reduce((a:number,m:any)=>a+(m.profit-(m.expenses||0)),0))}</td>
                  <td style={{padding:"7px 10px"}}></td>
                  <td style={{padding:"7px 10px"}}>{(data.monthlySales||[]).reduce((a:number,m:any)=>a+m.count,0)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* 2-col cards */}
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
              : data.expensesByCategory.map((e:any,i:number)=>{
                  const pct = s?.totalExpenses > 0 ? Math.round((e.total/s.totalExpenses)*100) : 0;
                  return (
                    <div key={i} className="list-row">
                      <span className="list-name" style={{textTransform:"capitalize"}}>{e.category?.replace(/_/g," ")}</span>
                      <span className="list-count">{e.count} entries</span>
                      <span className="list-val red-val">{fmtN(e.total)}</span>
                      <span style={{fontSize:"0.72rem",color:"#A3A3A3",marginLeft:"0.25rem"}}>{pct}%</span>
                    </div>
                  );
                })
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
          .sum-card{background:#fff;border:1.5px solid #E5E5E5;border-radius:10px;padding:1rem 1.1rem;display:flex;flex-direction:column;gap:0.2rem}
          .sum-card.accent{border-color:#F47B20;background:#FFF7ED}
          .sum-card.red{border-color:rgba(220,38,38,0.35);background:#FEF2F2}
          .sum-card.green{border-color:rgba(22,163,74,0.35);background:#F0FDF4}
          .sc-val{font-family:var(--font-display);font-size:1.3rem;color:#F47B20;line-height:1}
          .sum-card.red .sc-val{color:#DC2626}.sum-card.green .sc-val{color:#16A34A}
          .sc-label{font-size:0.62rem;color:#888;text-transform:uppercase;letter-spacing:0.06em;line-height:1.3}
          .sc-sub{font-size:0.6rem;color:#B0B0B0;margin-top:1px}
          .chart-card{background:#fff;border:1.5px solid #E5E5E5;border-radius:10px;padding:1.25rem;display:flex;flex-direction:column;gap:1rem}
          .bar-chart{display:flex;align-items:flex-end;gap:1rem;height:185px;overflow-x:auto;padding-bottom:0.5rem}
          .bar-col{display:flex;flex-direction:column;align-items:center;gap:4px;min-width:60px}
          .bar-pair{display:flex;align-items:flex-end;gap:3px;height:160px}
          .bar{border-radius:3px 3px 0 0;cursor:pointer;transition:opacity 0.2s}.bar:hover{opacity:0.8}
          .rev-bar{background:#F47B20;min-width:18px}
          .net-bar{background:#16A34A;min-width:14px}
          .bar-label{font-size:0.7rem;color:#888;text-align:center}.bar-count{font-size:0.62rem;color:#AAA;text-align:center}
          .chart-legend{display:flex;gap:1.5rem}
          .legend-item{display:flex;align-items:center;gap:0.4rem;font-size:0.78rem;color:#666}
          .legend-dot{width:10px;height:10px;border-radius:2px}
          .legend-dot.rev{background:#F47B20}.legend-dot.net{background:#16A34A}
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
