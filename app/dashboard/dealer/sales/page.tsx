"use client";
import { useEffect, useRef, useState } from "react";
import api from "@/lib/api";
import InvoiceGenerator from "@/components/dealer/InvoiceGenerator";
import CarFinancialReport from "@/components/dealer/CarFinancialReport";
import CarIdSearch from "@/components/dealer/CarIdSearch";

const PAYMENT_COLORS:Record<string,string>={cash:"#16A34A",bank_transfer:"#F47B20",card:"#3B8BD4",installment:"#DC2626"};

interface Sale {
  _id:string; transactionId:string; carId:string;
  carBrand?:string; carModel?:string; carYear?:number;
  sellingPrice:number; purchasePrice:number; profit:number;
  paymentMethod:string; buyerName?:string; buyerPhone?:string;
  notes?:string; soldAt:string; isEdited?:boolean; isManual?:boolean;
  editHistory?:any[];
}

const emptyManual={
  carBrand:"",carModel:"",carYear:new Date().getFullYear(),
  sellingPrice:"",purchasePrice:"",buyerName:"",buyerPhone:"",buyerEmail:"",
  paymentMethod:"cash",notes:"",carId:"",
};

export default function SalesPage() {
  const [sales,setSales]   = useState<Sale[]>([]);
  const [total,setTotal]   = useState(0);
  const [summary,setSummary] = useState<any>(null);
  const [loading,setLoading] = useState(true);
  const [search,setSearch] = useState("");
  const [skip,setSkip]     = useState(0);
  const [showManual,setShowManual]   = useState(false);
  const [showEdit,setShowEdit]       = useState<Sale|null>(null);
  const [showHistory,setShowHistory] = useState<Sale|null>(null);
  const [manualForm,setManualForm]   = useState(emptyManual);
  const [editForm,setEditForm]       = useState({sellingPrice:"",buyerName:"",buyerPhone:"",paymentMethod:"cash",notes:"",editReason:""});
  const [submitting,setSubmitting]   = useState(false);
  const [error,setError]   = useState("");
  const [invoiceTxn,setInvoiceTxn]   = useState<string|null>(null);
  const [reportCarId,setReportCarId] = useState<string|null>(null);
  const LIMIT=20;

  const fetchSales=async()=>{
    setLoading(true);
    try {
      const params:any={skip,limit:LIMIT};
      if(search)params.search=search;
      const res=await api.get("/api/v1/inventory/sales",{params});
      setSales(res.data.sales||[]); setTotal(res.data.total||0); setSummary(res.data.summary||null);
    } catch {} finally{setLoading(false);}
  };

  useEffect(()=>{fetchSales();},[search,skip]);

  const handleManualSale=async(e:React.FormEvent)=>{
    e.preventDefault();setSubmitting(true);setError("");
    try {
      await api.post("/api/v1/inventory/sales/manual",{
        ...manualForm,
        carYear:manualForm.carYear?Number(manualForm.carYear):undefined,
        sellingPrice:Number(manualForm.sellingPrice),
        purchasePrice:manualForm.purchasePrice?Number(manualForm.purchasePrice):0,
      });
      setShowManual(false);setManualForm(emptyManual);fetchSales();
    } catch(err:any){setError(err.response?.data?.detail||"Failed");}
    finally{setSubmitting(false);}
  };

  const handleEditSale=async(e:React.FormEvent)=>{
    e.preventDefault();if(!showEdit)return;
    setSubmitting(true);setError("");
    try{
      await api.patch(`/api/v1/inventory/sales/${showEdit.transactionId}`,{...editForm,sellingPrice:editForm.sellingPrice?Number(editForm.sellingPrice):undefined});
      setShowEdit(null);fetchSales();
    } catch(err:any){setError(err.response?.data?.detail||"Failed");}
    finally{setSubmitting(false);}
  };

  const handleRevert=async(txId:string)=>{
    if(!confirm("Revert to previous values?"))return;
    try{await api.post(`/api/v1/inventory/sales/${txId}/revert`);fetchSales();}
    catch(err:any){alert(err.response?.data?.detail||"Failed");}
  };

  /* ── Exports ── */
  const exportCSV=()=>{
    const rows=[
      ["TXN ID","Car","Brand","Model","Selling Price","Purchase Price","Profit","Buyer","Buyer Phone","Payment","Date","Edited","Manual"],
      ...sales.map(s=>[s.transactionId,s.carId,s.carBrand||"",s.carModel||"",s.sellingPrice,s.purchasePrice||0,s.profit,s.buyerName||"",s.buyerPhone||"",s.paymentMethod,s.soldAt?new Date(s.soldAt).toLocaleDateString():"",s.isEdited?"Yes":"No",s.isManual?"Yes":"No"]),
    ];
    const csv=rows.map(r=>r.map(c=>`"${String(c||"").replace(/"/g,'""')}"`).join(",")).join("\n");
    const blob=new Blob([csv],{type:"text/csv"});
    const a=document.createElement("a");a.href=URL.createObjectURL(blob);
    a.download=`sales-${Date.now()}.csv`;a.click();URL.revokeObjectURL(a.href);
  };

  const exportPDF=()=>{
    if(!summary)return;
    const fmt=(n:number)=>`₦${(n||0).toLocaleString()}`;
    const fmtD=(iso:string)=>iso?new Date(iso).toLocaleDateString("en-NG",{day:"numeric",month:"short",year:"numeric"}):"—";
    const html=`<!DOCTYPE html><html><head><title>Sales Report</title><style>
      *{box-sizing:border-box}body{font-family:Arial,sans-serif;margin:0;padding:24px;color:#1A1A1A;max-width:960px;margin:0 auto}
      h1{font-size:1.5rem;color:#F47B20;margin:0 0 4px}
      .meta{color:#888;font-size:0.8rem;margin-bottom:24px}
      .grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:24px}
      .card{background:#FFF7ED;border:1px solid #F47B20;border-radius:8px;padding:12px}
      .cv{font-size:1.4rem;font-weight:700;color:#F47B20}
      .cl{font-size:0.7rem;color:#888;margin-top:2px;text-transform:uppercase}
      h2{font-size:0.85rem;text-transform:uppercase;letter-spacing:0.1em;color:#888;border-bottom:1px solid #E5E5E5;padding-bottom:6px;margin:20px 0 8px}
      table{width:100%;border-collapse:collapse;font-size:0.8rem}
      th{background:#1A1A1A;color:#fff;padding:6px 10px;text-align:left;font-size:0.72rem;letter-spacing:0.05em}
      td{padding:6px 10px;border-bottom:1px solid #F0F0F0}tr:hover td{background:#FFFAF5}
      .footer{margin-top:24px;font-size:0.7rem;color:#888;text-align:center;border-top:1px solid #E5E5E5;padding-top:12px}
      @media print{body{padding:12px}}
    </style></head><body>
      <h1>Sales Log Report</h1>
      <div class="meta">Generated ${new Date().toLocaleString("en-NG")} · CARSTRIMS by UASE TECH STUDIO</div>
      <div class="grid">
        <div class="card"><div class="cv">${summary.totalSales||0}</div><div class="cl">Total Sales</div></div>
        <div class="card"><div class="cv">${fmt(summary.totalRevenue||0)}</div><div class="cl">Revenue</div></div>
        <div class="card"><div class="cv">${fmt(summary.totalProfit||0)}</div><div class="cl">Gross Profit</div></div>
        <div class="card"><div class="cv">${fmt(summary.totalNetProfit||0)}</div><div class="cl">Net Profit</div></div>
      </div>
      <h2>All Transactions (${total})</h2>
      <table><thead><tr><th>TXN ID</th><th>Car</th><th>Buyer</th><th>Price</th><th>Profit</th><th>Payment</th><th>Date</th></tr></thead>
      <tbody>${sales.map(s=>`<tr><td style="font-family:monospace;font-size:0.7rem">${s.transactionId}</td><td>${s.carBrand||""} ${s.carModel||""}<br><span style="font-size:0.68rem;color:#AAA">${s.carId}</span></td><td>${s.buyerName||"—"}</td><td style="font-weight:600">${fmt(s.sellingPrice)}</td><td style="color:#16A34A;font-weight:600">+${fmt(s.profit)}</td><td style="text-transform:capitalize">${s.paymentMethod?.replace(/_/g," ")}</td><td style="color:#888">${fmtD(s.soldAt)}</td></tr>`).join("")}</tbody>
      </table>
      <div class="footer">CARSTRIMS Sales Report · Powered by UASE TECH STUDIO</div>
      <script>window.onload=()=>window.print()<\/script>
    </body></html>`;
    const win=window.open("","_blank");
    if(win){win.document.write(html);win.document.close();}
  };

  const fmt=(n:number)=>`₦${(n||0).toLocaleString()}`;
  const fmtDate=(iso:string)=>iso?new Date(iso).toLocaleDateString("en-NG",{day:"numeric",month:"short",year:"numeric"}):"—";

  return (
    <>
      {invoiceTxn&&<InvoiceGenerator transactionId={invoiceTxn} onClose={()=>setInvoiceTxn(null)}/>}
      {reportCarId&&<CarFinancialReport carId={reportCarId} onClose={()=>setReportCarId(null)}/>}

    <div className="sales-page">
      <div className="page-header">
        <div>
          <h2 className="page-heading">Sales Log</h2>
          <p className="page-sub">{total} transaction{total!==1?"s":""}</p>
        </div>
        <div className="header-btns">
          <button className="btn-outline" onClick={exportCSV}>⬇ CSV / Excel</button>
          <button className="btn-outline" onClick={exportPDF} style={{borderColor:"#F47B20",color:"#F47B20"}}>⬇ PDF</button>
          <button className="btn-primary" onClick={()=>{setShowManual(true);setError("");}}>+ Add Sale</button>
        </div>
      </div>

      {summary&&(
        <div className="summary-row">
          {[{label:"Total Sales",value:summary.totalSales||0,fmt:false},{label:"Revenue",value:summary.totalRevenue||0,fmt:true},{label:"Gross Profit",value:summary.totalProfit||0,fmt:true},{label:"Net Profit",value:summary.totalNetProfit||0,fmt:true}].map(s=>(
            <div key={s.label} className="sum-card">
              <div className="sum-label">{s.label}</div>
              <div className="sum-value">{s.fmt?fmt(s.value as number):s.value}</div>
            </div>
          ))}
        </div>
      )}

      <div className="filters">
        <input className="search-input" placeholder="Search TXN ID, car, buyer…" value={search} onChange={e=>{setSearch(e.target.value);setSkip(0);}}/>
      </div>

      {loading?<div className="loading"><div className="spinner"/></div>
      :sales.length===0?(
        <div className="empty"><div className="ei">💰</div><h3>No sales yet</h3><p>Sales recorded when cars are marked as sold or manually added here</p></div>
      ):(
        <>
          <div className="table-wrap">
            <table className="sales-table">
              <thead><tr><th>Transaction</th><th>Car</th><th>Buyer</th><th>Price</th><th>Profit</th><th>Payment</th><th>Date</th><th>Actions</th></tr></thead>
              <tbody>
                {sales.map(s=>(
                  <tr key={s._id}>
                    <td>
                      <div className="txn-id">{s.transactionId}</div>
                      {s.isEdited&&<div className="edited-badge">edited</div>}
                      {s.isManual&&<div className="manual-badge">manual</div>}
                    </td>
                    <td><div className="car-cell">{s.carBrand||""} {s.carModel||""}</div><div className="car-id-cell">{s.carId}</div></td>
                    <td><div className="buyer-name">{s.buyerName||"—"}</div>{s.buyerPhone&&<div className="buyer-phone">{s.buyerPhone}</div>}</td>
                    <td className="price-cell">{fmt(s.sellingPrice)}</td>
                    <td className="profit-cell">+{fmt(s.profit)}</td>
                    <td><span className="pay-badge" style={{background:(PAYMENT_COLORS[s.paymentMethod]||"#888")+"18",color:PAYMENT_COLORS[s.paymentMethod]||"#888",border:`1px solid ${(PAYMENT_COLORS[s.paymentMethod]||"#888")}44`}}>{s.paymentMethod?.replace(/_/g," ")}</span></td>
                    <td className="date-cell">{fmtDate(s.soldAt)}</td>
                    <td>
                      <div className="row-actions">
                        <button className="act-btn receipt-btn" onClick={()=>setInvoiceTxn(s.transactionId)} title="Receipt / Invoice / Proforma">📄 Receipt</button>
                        {s.carId&&<button className="act-btn report-btn" onClick={()=>setReportCarId(s.carId)} title="Car Financial Report">📊 Report</button>}
                        <button className="act-btn" onClick={()=>{setShowEdit(s);setEditForm({sellingPrice:String(s.sellingPrice),buyerName:s.buyerName||"",buyerPhone:s.buyerPhone||"",paymentMethod:s.paymentMethod||"cash",notes:s.notes||"",editReason:""});setError("");}}>Edit</button>
                        {s.isEdited&&<button className="act-btn revert" onClick={()=>handleRevert(s.transactionId)}>Revert</button>}
                        {s.editHistory&&s.editHistory.length>0&&<button className="act-btn history" onClick={()=>setShowHistory(s)}>History</button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="pagination">
            <button className="pg-btn" onClick={()=>setSkip(Math.max(0,skip-LIMIT))} disabled={skip===0}>← Prev</button>
            <span className="pg-info">{Math.floor(skip/LIMIT)+1} / {Math.max(1,Math.ceil(total/LIMIT))}</span>
            <button className="pg-btn" onClick={()=>setSkip(skip+LIMIT)} disabled={skip+LIMIT>=total}>Next →</button>
          </div>
        </>
      )}

      {/* MANUAL SALE MODAL */}
      {showManual&&(
        <div className="modal-overlay" onClick={()=>setShowManual(false)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-header"><h3 className="modal-title">ADD MANUAL SALE</h3><button className="modal-close" onClick={()=>setShowManual(false)}>✕</button></div>
            {error&&<div className="form-error">{error}</div>}
            <form onSubmit={handleManualSale} className="modal-form">
              {/* Car ID search — auto-fills details */}
              <div className="field" style={{gridColumn:"1/-1"}}>
                <label className="fl">Search Car from Inventory (auto-fills details)</label>
                <CarIdSearch
                  value={manualForm.carId?`${manualForm.carBrand} ${manualForm.carModel} — ${manualForm.carId}`:""}
                  placeholder="Type Car ID, brand or model to pick from listed cars…"
                  onSelect={(car:any)=>setManualForm(f=>({...f,carId:car.carId,carBrand:car.brand||f.carBrand,carModel:car.model||f.carModel,carYear:car.year||f.carYear,sellingPrice:car.sellingPrice?.toString()||f.sellingPrice,purchasePrice:car.purchasePrice?.toString()||f.purchasePrice}))}
                />
                {manualForm.carId&&<div style={{fontSize:"0.72rem",color:"#16A34A",marginTop:"0.3rem",fontWeight:600}}>✓ Car ID: {manualForm.carId}</div>}
              </div>
              <div className="form-row">
                <div className="field"><label className="fl">Brand *</label><input className="fi" placeholder="Toyota" value={manualForm.carBrand} onChange={e=>setManualForm({...manualForm,carBrand:e.target.value})} required/></div>
                <div className="field"><label className="fl">Model *</label><input className="fi" placeholder="Camry" value={manualForm.carModel} onChange={e=>setManualForm({...manualForm,carModel:e.target.value})} required/></div>
              </div>
              <div className="form-row">
                <div className="field"><label className="fl">Year</label><input type="number" className="fi" value={manualForm.carYear} onChange={e=>setManualForm({...manualForm,carYear:e.target.value as any})}/></div>
              </div>
              <div className="form-row">
                <div className="field"><label className="fl">Selling Price (₦) *</label><input type="number" className="fi" value={manualForm.sellingPrice} onChange={e=>setManualForm({...manualForm,sellingPrice:e.target.value})} required/></div>
                <div className="field"><label className="fl">Purchase / Cost Price (₦)</label><input type="number" className="fi" value={manualForm.purchasePrice} onChange={e=>setManualForm({...manualForm,purchasePrice:e.target.value})} placeholder="For profit calculation"/></div>
              </div>
              <div className="form-row">
                <div className="field"><label className="fl">Buyer Name</label><input className="fi" value={manualForm.buyerName} onChange={e=>setManualForm({...manualForm,buyerName:e.target.value})}/></div>
                <div className="field"><label className="fl">Buyer Phone</label><input className="fi" value={manualForm.buyerPhone} onChange={e=>setManualForm({...manualForm,buyerPhone:e.target.value})}/></div>
              </div>
              <div className="field"><label className="fl">Buyer Email</label><input type="email" className="fi" value={manualForm.buyerEmail} onChange={e=>setManualForm({...manualForm,buyerEmail:e.target.value})}/></div>
              <div className="field"><label className="fl">Payment Method</label>
                <select className="fi" value={manualForm.paymentMethod} onChange={e=>setManualForm({...manualForm,paymentMethod:e.target.value})}>
                  <option value="cash">Cash</option><option value="bank_transfer">Bank Transfer</option>
                  <option value="card">Card / POS</option><option value="installment">Installment</option><option value="other">Other</option>
                </select>
              </div>
              <div className="field"><label className="fl">Notes / Remarks</label><textarea className="fi fi-ta" rows={2} value={manualForm.notes} onChange={e=>setManualForm({...manualForm,notes:e.target.value})}/></div>
              {manualForm.sellingPrice&&manualForm.purchasePrice&&(
                <div className="profit-preview">
                  Gross Profit: <strong>₦{(Number(manualForm.sellingPrice)-Number(manualForm.purchasePrice)).toLocaleString()}</strong>
                  &nbsp;|&nbsp; Margin: <strong>{manualForm.sellingPrice?Math.round(((Number(manualForm.sellingPrice)-Number(manualForm.purchasePrice))/Number(manualForm.sellingPrice))*100):0}%</strong>
                </div>
              )}
              <div className="modal-footer">
                <button type="button" className="btn-outline" onClick={()=>setShowManual(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={submitting}>{submitting?"Adding…":"Add Sale"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {showEdit&&(
        <div className="modal-overlay" onClick={()=>setShowEdit(null)}>
          <div className="modal modal-sm" onClick={e=>e.stopPropagation()}>
            <div className="modal-header"><h3 className="modal-title">EDIT SALE</h3><button className="modal-close" onClick={()=>setShowEdit(null)}>✕</button></div>
            <div className="edit-info">{showEdit.transactionId}{showEdit.isEdited?" · edited":""}</div>
            {error&&<div className="form-error">{error}</div>}
            <form onSubmit={handleEditSale} className="modal-form">
              <div className="field"><label className="fl">Selling Price (₦)</label><input type="number" className="fi" value={editForm.sellingPrice} onChange={e=>setEditForm({...editForm,sellingPrice:e.target.value})}/></div>
              <div className="form-row">
                <div className="field"><label className="fl">Buyer Name</label><input className="fi" value={editForm.buyerName} onChange={e=>setEditForm({...editForm,buyerName:e.target.value})}/></div>
                <div className="field"><label className="fl">Buyer Phone</label><input className="fi" value={editForm.buyerPhone} onChange={e=>setEditForm({...editForm,buyerPhone:e.target.value})}/></div>
              </div>
              <div className="field"><label className="fl">Payment Method</label>
                <select className="fi" value={editForm.paymentMethod} onChange={e=>setEditForm({...editForm,paymentMethod:e.target.value})}>
                  <option value="cash">Cash</option><option value="bank_transfer">Bank Transfer</option><option value="card">Card</option><option value="installment">Installment</option>
                </select>
              </div>
              <div className="field"><label className="fl">Notes</label><textarea className="fi fi-ta" rows={2} value={editForm.notes} onChange={e=>setEditForm({...editForm,notes:e.target.value})}/></div>
              <div className="field"><label className="fl">Reason for Edit *</label><input className="fi" placeholder="Why are you editing this sale?" value={editForm.editReason} onChange={e=>setEditForm({...editForm,editReason:e.target.value})} required/></div>
              <div className="modal-footer">
                <button type="button" className="btn-outline" onClick={()=>setShowEdit(null)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={submitting}>{submitting?"Saving…":"Save Edit"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* HISTORY MODAL */}
      {showHistory&&(
        <div className="modal-overlay" onClick={()=>setShowHistory(null)}>
          <div className="modal modal-sm" onClick={e=>e.stopPropagation()}>
            <div className="modal-header"><h3 className="modal-title">EDIT HISTORY — {showHistory.transactionId}</h3><button className="modal-close" onClick={()=>setShowHistory(null)}>✕</button></div>
            <div className="history-list">
              {!showHistory.editHistory?.length?<div className="no-history">No edit history</div>
              :showHistory.editHistory?.map((h:any,i:number)=>(
                <div key={i} className="history-item">
                  <div className="hi-time">{new Date(h.editedAt).toLocaleString("en-NG")}</div>
                  <div className="hi-reason">Reason: {h.reason}</div>
                  <div className="hi-prev">Previous: ₦{(h.previous?.sellingPrice||0).toLocaleString()}{h.previous?.buyerName?` · ${h.previous.buyerName}`:""}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <style>{`
        .sales-page{display:flex;flex-direction:column;gap:1.5rem}
        .page-header{display:flex;align-items:flex-start;justify-content:space-between;gap:1rem;flex-wrap:wrap}
        .page-heading{font-family:var(--font-display);font-size:1.6rem;letter-spacing:0.05em;color:#1A1A1A;line-height:1}
        .page-sub{font-size:0.8rem;color:#888;margin-top:0.3rem}
        .header-btns{display:flex;gap:0.5rem;flex-wrap:wrap}
        .btn-primary{background:#F47B20;color:#fff;border:none;border-radius:6px;padding:0.65rem 1.25rem;font-family:var(--font-display);font-size:0.875rem;letter-spacing:0.08em;cursor:pointer;white-space:nowrap;transition:background 0.2s}
        .btn-primary:hover{background:#FF9340}.btn-primary:disabled{opacity:0.6;cursor:not-allowed}
        .btn-outline{background:#fff;color:#666;border:1.5px solid #DDD;border-radius:6px;padding:0.65rem 1.25rem;font-family:var(--font-body);font-size:0.875rem;cursor:pointer;transition:all 0.2s;white-space:nowrap}
        .btn-outline:hover{border-color:#F47B20;color:#F47B20}
        .summary-row{display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:1rem}
        .sum-card{background:#fff;border:1.5px solid #E5E5E5;border-radius:10px;padding:1.1rem 1.25rem;display:flex;flex-direction:column;gap:0.4rem}
        .sum-label{font-size:0.7rem;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#888}
        .sum-value{font-family:var(--font-display);font-size:1.6rem;color:#F47B20;line-height:1}
        .filters{display:flex;gap:1rem;flex-wrap:wrap}
        .search-input{background:#fff;border:1.5px solid #DDD;border-radius:6px;padding:0.65rem 1rem;color:#1A1A1A;font-size:0.875rem;font-family:var(--font-body);outline:none;transition:border-color 0.2s;flex:1;min-width:200px}
        .search-input:focus{border-color:#F47B20}
        .loading{display:flex;align-items:center;justify-content:center;min-height:200px}
        .spinner{width:28px;height:28px;border:2.5px solid #E5E5E5;border-top-color:#F47B20;border-radius:50%;animation:spin 0.8s linear infinite}
        @keyframes spin{to{transform:rotate(360deg)}}
        .empty{display:flex;flex-direction:column;align-items:center;gap:0.875rem;padding:3rem;text-align:center;border:1.5px dashed #E5E5E5;border-radius:12px;background:#FAFAFA}
        .ei{font-size:3rem}.empty h3{font-family:var(--font-display);font-size:1.2rem;color:#1A1A1A}.empty p{color:#888;font-size:0.875rem}
        .table-wrap{overflow-x:auto;border:1.5px solid #E5E5E5;border-radius:10px;background:#fff}
        .sales-table{width:100%;border-collapse:collapse;min-width:820px}
        .sales-table th{padding:0.75rem 1rem;text-align:left;font-size:0.68rem;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#888;background:#FAFAFA;border-bottom:1.5px solid #E5E5E5}
        .sales-table td{padding:0.75rem 1rem;border-bottom:1px solid #F0F0F0;font-size:0.825rem;color:#1A1A1A;vertical-align:middle}
        .sales-table tr:last-child td{border-bottom:none}.sales-table tr:hover td{background:#FFFAF5}
        .txn-id{font-family:var(--font-mono);font-size:0.72rem;color:#888}
        .edited-badge,.manual-badge{display:inline-block;font-size:0.6rem;padding:0.1rem 0.4rem;border-radius:3px;margin-top:0.15rem;font-weight:600}
        .edited-badge{background:#FFF7ED;color:#F47B20;border:1px solid #F47B20}
        .manual-badge{background:#F0FDF4;color:#16A34A;border:1px solid #16A34A}
        .car-cell{font-weight:500;font-size:0.875rem}.car-id-cell{font-family:var(--font-mono);font-size:0.68rem;color:#AAA}
        .buyer-name{font-weight:500}.buyer-phone{font-size:0.75rem;color:#888}
        .price-cell{font-weight:600;color:#1A1A1A}.profit-cell{color:#16A34A;font-weight:600}
        .pay-badge{padding:0.2rem 0.55rem;border-radius:20px;font-size:0.68rem;font-weight:500;text-transform:capitalize}
        .date-cell{color:#888;font-size:0.78rem;white-space:nowrap}
        .row-actions{display:flex;gap:0.25rem;flex-wrap:wrap}
        .act-btn{background:#F5F5F5;border:1px solid #DDD;border-radius:4px;padding:0.25rem 0.5rem;font-size:0.7rem;cursor:pointer;font-family:var(--font-body);color:#666;transition:all 0.2s;white-space:nowrap}
        .act-btn:hover{border-color:#F47B20;color:#F47B20;background:#FFF7ED}
        .receipt-btn{background:#FFF7ED;border-color:rgba(244,123,32,0.4);color:#C4621A;font-weight:600}
        .receipt-btn:hover{background:#F47B20!important;color:#fff!important;border-color:#F47B20!important}
        .report-btn:hover{border-color:#3B8BD4!important;color:#3B8BD4!important;background:#EFF6FF!important}
        .act-btn.revert:hover{border-color:#DC2626;color:#DC2626;background:#FEF2F2}
        .act-btn.history:hover{border-color:#3B8BD4;color:#3B8BD4;background:#EFF6FF}
        .pagination{display:flex;align-items:center;gap:1rem;justify-content:center;flex-wrap:wrap}
        .pg-btn{background:#fff;border:1.5px solid #DDD;color:#666;padding:0.5rem 1rem;border-radius:6px;cursor:pointer;font-size:0.825rem;font-family:var(--font-body);transition:all 0.2s}
        .pg-btn:hover:not(:disabled){border-color:#F47B20;color:#F47B20}.pg-btn:disabled{opacity:0.4;cursor:not-allowed}
        .pg-info{font-size:0.825rem;color:#888;font-family:var(--font-mono)}
        .modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.35);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;z-index:1000;padding:1rem;overflow-y:auto}
        .modal{background:#fff;border-radius:12px;width:100%;max-width:580px;max-height:90vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,0.15)}
        .modal-sm{max-width:460px}
        .modal-header{display:flex;align-items:center;justify-content:space-between;padding:1.25rem 1.5rem;border-bottom:1px solid #E5E5E5;position:sticky;top:0;background:#fff;z-index:1}
        .modal-title{font-family:var(--font-display);font-size:1rem;letter-spacing:0.1em;color:#1A1A1A}
        .modal-close{background:none;border:none;color:#AAA;font-size:1rem;cursor:pointer}
        .edit-info{padding:0.5rem 1.5rem;font-family:var(--font-mono);font-size:0.75rem;color:#888;border-bottom:1px solid #F0F0F0;background:#FAFAFA}
        .form-error{margin:0.75rem 1.5rem 0;background:#FEF2F2;border:1px solid #FCA5A5;color:#DC2626;padding:0.65rem 1rem;border-radius:6px;font-size:0.825rem}
        .modal-form{padding:1.25rem 1.5rem;display:flex;flex-direction:column;gap:1rem}
        .form-row{display:grid;grid-template-columns:1fr 1fr;gap:1rem}
        .field{display:flex;flex-direction:column;gap:0.4rem}
        .fl{font-size:0.7rem;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#888}
        .fi{background:#F5F5F5;border:1.5px solid #DDD;border-radius:6px;padding:0.7rem;color:#1A1A1A;font-size:0.875rem;font-family:var(--font-body);outline:none;transition:border-color 0.2s;width:100%;box-sizing:border-box}
        .fi:focus{border-color:#F47B20;background:#fff}.fi-ta{resize:vertical;min-height:70px}
        .profit-preview{background:#F0FDF4;border:1px solid #BBF7D0;border-radius:6px;padding:0.65rem 1rem;font-size:0.825rem;color:#166534}
        .profit-preview strong{font-family:var(--font-display);font-size:1rem}
        .modal-footer{display:flex;gap:0.75rem;justify-content:flex-end;padding-top:0.5rem;border-top:1px solid #E5E5E5}
        .history-list{padding:1.25rem 1.5rem;display:flex;flex-direction:column;gap:0.875rem}
        .history-item{background:#FAFAFA;border:1px solid #E5E5E5;border-radius:8px;padding:0.875rem;display:flex;flex-direction:column;gap:0.3rem}
        .hi-time{font-family:var(--font-mono);font-size:0.72rem;color:#888}
        .hi-reason{font-size:0.825rem;color:#F47B20;font-weight:500}
        .hi-prev{font-size:0.78rem;color:#666}
        .no-history{padding:1rem;text-align:center;color:#AAA;font-size:0.875rem}
        @media(max-width:640px){.form-row{grid-template-columns:1fr}.header-btns{flex-wrap:wrap}}
      `}</style>
    </div>
    </>
  );
}
