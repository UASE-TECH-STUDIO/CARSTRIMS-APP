"use client";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import api from "@/lib/api";
import { renderElementToPdfBlob, renderElementToJpgBlob, renderHtmlStringToPdfBlob, renderHtmlStringToJpgBlob, rowsToExcelBlob, downloadBlob, shareBlob } from "@/lib/documentExport";
import { useToast } from "@/store/toastStore";
import { useConfirm } from "@/store/confirmStore";

export default function PartnersPage() {
  const [partners, setPartners]     = useState<any[]>([]);
  const [loading, setLoading]       = useState(true);
  const [showDetail, setShowDetail] = useState<any>(null);
  const [detailData, setDetailData] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [filter, setFilter]         = useState("all");
  // Assign car state
  const [showAssign, setShowAssign] = useState(false);
  const assignedVehiclesRef = useRef<HTMLDivElement>(null);
  const [availCars, setAvailCars]   = useState<any[]>([]);
  const [carsLoading, setCarsLoading] = useState(false);
  const [carSearch, setCarSearch]   = useState("");
  const [assigning, setAssigning]   = useState<string|null>(null);
  const [assignMsg, setAssignMsg]   = useState("");
  // Remove car from partner
  const [removing, setRemoving]     = useState<string|null>(null);

  const fetchPartners = async () => {
    setLoading(true);
    try {
      const params: any = { limit: 50 };
      if (filter !== "all") params.status = filter;
      const res = await api.get("/api/v1/partners/", { params });
      setPartners(res.data.partners || res.data || []);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetchPartners(); }, [filter]);

  const openDetail = async (partner: any) => {
    setShowDetail(partner);
    setDetailData(null);
    setShowAssign(false);
    setAssignMsg("");
    setDetailLoading(true);
    try {
      const res = await api.get(`/api/v1/partners/${partner._id || partner.linkId}/detail`);
      setDetailData(res.data);
    } catch { setDetailData(null); }
    finally { setDetailLoading(false); }
  };

  const refreshDetail = async () => {
    if (!showDetail) return;
    try {
      const res = await api.get(`/api/v1/partners/${showDetail._id || showDetail.linkId}/detail`);
      setDetailData(res.data);
      // Also refresh the partner in list to update car count
      fetchPartners();
    } catch {}
  };

  const loadAvailableCars = async () => {
    setCarsLoading(true);
    try {
      const res = await api.get("/api/v1/cars/", { params: { status: "available", limit: 100 } });
      setAvailCars(res.data.cars || res.data || []);
    } catch { setAvailCars([]); }
    finally { setCarsLoading(false); }
  };

  const openAssign = () => {
    setShowAssign(true);
    setCarSearch("");
    setAssignMsg("");
    loadAvailableCars();
  };

  const assignCar = async (carId: string) => {
    if (!showDetail) return;
    setAssigning(carId);
    setAssignMsg("");
    try {
      const linkId = showDetail._id || showDetail.linkId;
      await api.post(`/api/v1/partners/${linkId}/assign-car`, { carId });
      setAssignMsg(`Vehicle ${carId} assigned successfully!`);
      await refreshDetail();
    } catch (e: any) {
      setAssignMsg(e.response?.data?.detail || "Failed to assign vehicle");
    } finally { setAssigning(null); }
  };

  const handleAction = async (linkId: string, action: string, data?: any) => {
    try {
      if (action === "approve") {
        await api.post(`/api/v1/partners/${linkId}/approve`);
        // Keep the detail view open and reload it in place so the
        // "Assign Vehicles" section appears immediately — previously
        // this closed the whole modal, and the dealer had to realize
        // they needed to re-open the same partner from the list to see it.
        await refreshDetail();
        setShowDetail((prev: any) => prev ? { ...prev, status: "approved" } : prev);
        fetchPartners();
        return;
      }
      else if (action === "reject") await api.post(`/api/v1/partners/${linkId}/reject`, data);
      else if (action === "remove") {
        if (!(await askConfirm({ message: "Remove this partner permanently?", danger: true }))) return;
        await api.delete(`/api/v1/partners/${linkId}`);
      }
      setShowDetail(null); setDetailData(null);
      fetchPartners();
    } catch (e: any) { showToast(e.response?.data?.detail || "Action failed", "error"); }
  };

  const fmt = (n: number) => `NGN ${(n||0).toLocaleString()}`;
  const STATUS_C: Record<string,string> = {
    approved:"#16A34A", pending:"#D97706", rejected:"#DC2626", removed:"#888"
  };

  // Filter available cars by search and exclude already assigned
  const assignedIds = detailData?.cars?.map((c:any) => c.carId) || [];
  const filteredCars = availCars.filter(c => {
    const alreadyAssigned = assignedIds.includes(c.carId);
    if (alreadyAssigned) return false;
    if (!carSearch) return true;
    const q = carSearch.toLowerCase();
    return [c.brand,c.model,c.year,c.carId,c.color].some(v=>String(v||"").toLowerCase().includes(q));
  });

  // detailData.link.status is freshly fetched from the single-partner
  // /detail endpoint every time the modal opens or refreshes — more
  // reliable than showDetail.status, which comes from the list fetch
  // and can go stale (this was the actual cause of the "Assign Vehicle"
  // button sometimes not appearing for partners that were genuinely
  // already approved).
  const effectiveStatus = detailData?.link?.status || showDetail?.status;
  const exportRef = useRef<HTMLDivElement>(null);
  const showToast = useToast();
  const askConfirm = useConfirm();
  const [exportBusy, setExportBusy] = useState<"" | "download" | "share">("");
  const [exportPicker, setExportPicker] = useState<"download" | "share" | "">("");
  const [listExportBusy, setListExportBusy] = useState<"" | "pdf" | "jpg" | "excel">("");
  const [showListExportPicker, setShowListExportPicker] = useState(false);

  const partnerExportRows = () => (detailData?.cars || []).map((c: any) => ({
    Vehicle: `${c.brand} ${c.model} ${c.year}`,
    "Vehicle ID": c.carId,
    Status: c.status,
    "Selling Price (NGN)": c.sellingPrice || 0,
    "Total Expenses (NGN)": c.totalExpenses || 0,
    "Sold To": c.saleRecord?.buyerName || "",
    "Sale Price (NGN)": c.saleRecord?.sellingPrice || "",
  }));

  const exportFilename = () => `carstrims-partner-${(showDetail?.partnerName||"partner").toLowerCase().replace(/[^a-z0-9]/g,"-")}-${Date.now()}`;

  const handleExportDownload = async (format: "pdf" | "jpg" | "excel") => {
    setExportPicker(""); setExportBusy("download");
    try {
      if (format === "excel") {
        const blob = rowsToExcelBlob(partnerExportRows(), "Assigned Vehicles");
        await downloadBlob(blob, `${exportFilename()}.xlsx`);
      } else {
        if (!exportRef.current) throw new Error("Nothing to export yet");
        const blob = format === "jpg" ? await renderElementToJpgBlob(exportRef.current) : await renderElementToPdfBlob(exportRef.current, "Partner History");
        await downloadBlob(blob, `${exportFilename()}.${format}`);
      }
      showToast("Downloaded", "success");
    } catch (e: any) { showToast(e?.message || "Download failed", "error"); }
    finally { setExportBusy(""); }
  };

  const handleExportShare = async (format: "pdf" | "jpg") => {
    setExportPicker(""); setExportBusy("share");
    try {
      if (!exportRef.current) throw new Error("Nothing to export yet");
      const blob = format === "jpg" ? await renderElementToJpgBlob(exportRef.current) : await renderElementToPdfBlob(exportRef.current, "Partner History");
      await shareBlob(blob, `${exportFilename()}.${format}`, "Partner History");
    } catch (e: any) { showToast(e?.message || "Share failed", "error"); }
    finally { setExportBusy(""); }
  };

  // Full partners LIST export (all partners, respecting the current
  // filter tab) - distinct from the per-partner detail export above,
  // which only exports one partner's assigned vehicle history.
  const buildPartnersListHtml = () => {
    const now = new Date().toLocaleString("en-NG");
    return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
      *{box-sizing:border-box}body{font-family:Arial,sans-serif;padding:28px 32px;color:#1A1A1A;font-size:12px}
      h1{font-size:18px;margin:0 0 4px} .sub{color:#737373;font-size:11px;margin-bottom:16px}
      table{width:100%;border-collapse:collapse}
      th{background:#1A1A1A;color:#fff;text-align:left;padding:8px 10px;font-size:10px;letter-spacing:0.05em;text-transform:uppercase}
      td{padding:7px 10px;border-bottom:1px solid #E5E5E5;font-size:11px}
      tr:nth-child(even) td{background:#FAFAFA}
      .footer{margin-top:16px;font-size:9px;color:#A3A3A3;text-align:center}
      </style></head><body>
      <h1>Partners${filter!=="all"?` — ${filter}`:""}</h1>
      <div class="sub">${partners.length} partner${partners.length!==1?"s":""} &bull; Generated ${now}</div>
      <table><thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Status</th><th>Vehicles Assigned</th></tr></thead>
      <tbody>${partners.map((p: any) => `<tr><td>${p.partnerName||""}</td><td>${p.partnerEmail||""}</td><td>${p.partnerPhone||""}</td><td>${p.status||""}</td><td>${p.carIds?.length||0}</td></tr>`).join("")}</tbody>
      </table>
      <div class="footer">Powered by CARSTRIMS &mdash; UASE TECH STUDIO</div>
      </body></html>`;
  };

  const handleListExport = async (format: "pdf" | "jpg" | "excel") => {
    setShowListExportPicker(false);
    setListExportBusy(format);
    try {
      const filename = `carstrims-partners-${filter}-${Date.now()}`;
      if (format === "excel") {
        const blob = rowsToExcelBlob(partners.map((p: any) => ({
          Name: p.partnerName || "", Email: p.partnerEmail || "", Phone: p.partnerPhone || "",
          Status: p.status || "", "Vehicles Assigned": p.carIds?.length || 0,
        })), "Partners");
        await downloadBlob(blob, `${filename}.xlsx`);
      } else {
        const html = buildPartnersListHtml();
        const blob = format === "jpg" ? await renderHtmlStringToJpgBlob(html) : await renderHtmlStringToPdfBlob(html, "Partners");
        await downloadBlob(blob, `${filename}.${format}`);
      }
      showToast("Downloaded", "success");
    } catch (e: any) {
      showToast(e?.message || "Export failed", "error");
    } finally {
      setListExportBusy("");
    }
  };

  return (
    <div style={{display:"flex",flexDirection:"column",gap:"1.5rem"}}>
      {/* Header */}
      <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",flexWrap:"wrap",gap:"0.75rem"}}>
        <div>
          <h2 style={{fontFamily:"var(--font-display)",fontSize:"1.5rem",letterSpacing:"0.05em",color:"#1A1A1A",lineHeight:1}}>Partners</h2>
          <p style={{fontSize:"0.8rem",color:"#888",marginTop:"0.3rem"}}>{partners.length} partner{partners.length!==1?"s":""}</p>
        </div>
        <div style={{position:"relative"}}>
          <button onClick={()=>setShowListExportPicker(v=>!v)} disabled={listExportBusy!==""}
            style={{background:"#F5F5F5",color:"#525252",border:"1.5px solid #E5E5E5",borderRadius:"8px",
              padding:"0.55rem 0.9rem",fontSize:"0.8rem",cursor:"pointer",fontWeight:600}}>
            {listExportBusy?"Exporting…":"Export"}
          </button>
          {showListExportPicker && (
            <div style={{position:"absolute",top:"calc(100% + 6px)",right:0,zIndex:30,background:"#fff",border:"1.5px solid #E5E5E5",borderRadius:"10px",boxShadow:"0 8px 24px rgba(0,0,0,0.15)",overflow:"hidden",minWidth:"120px",maxWidth:"calc(100vw - 2rem)"}}>
              <button onClick={()=>handleListExport("pdf")} style={{display:"block",width:"100%",textAlign:"left" as const,padding:"0.6rem 0.9rem",background:"none",border:"none",cursor:"pointer",fontSize:"0.8rem",fontWeight:600}}>as PDF</button>
              <button onClick={()=>handleListExport("jpg")} style={{display:"block",width:"100%",textAlign:"left" as const,padding:"0.6rem 0.9rem",background:"none",border:"none",borderTop:"1px solid #F5F5F5",cursor:"pointer",fontSize:"0.8rem",fontWeight:600}}>as JPG Image</button>
              <button onClick={()=>handleListExport("excel")} style={{display:"block",width:"100%",textAlign:"left" as const,padding:"0.6rem 0.9rem",background:"none",border:"none",borderTop:"1px solid #F5F5F5",cursor:"pointer",fontSize:"0.8rem",fontWeight:600}}>as Excel</button>
            </div>
          )}
        </div>
      </div>

      {/* Filter tabs */}
      <div style={{display:"flex",gap:"0.375rem",flexWrap:"wrap"}}>
        {["all","pending","approved","rejected"].map(s=>(
          <button key={s} onClick={()=>setFilter(s)}
            style={{background:filter===s?"#F47B20":"transparent",color:filter===s?"#fff":"#888",border:`1.5px solid ${filter===s?"#F47B20":"#DDD"}`,borderRadius:"20px",padding:"0.3rem 0.875rem",fontSize:"0.75rem",cursor:"pointer",fontFamily:"var(--font-body)",textTransform:"capitalize" as const,transition:"all 0.2s"}}>
            {s==="all"?"All":s}
          </button>
        ))}
      </div>

      {/* Partners list */}
      {loading ? (
        <div style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"200px"}}>
          <div style={{width:"28px",height:"28px",border:"2.5px solid #E5E5E5",borderTopColor:"#F47B20",borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      ) : partners.length===0 ? (
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:"0.875rem",padding:"3rem",textAlign:"center",border:"1.5px dashed #E5E5E5",borderRadius:"12px",background:"#FAFAFA"}}>
          <div style={{fontSize:"3rem"}}>&#x1F91D;</div>
          <h3 style={{fontFamily:"var(--font-display)",fontSize:"1.1rem",color:"#1A1A1A"}}>No partners yet</h3>
          <p style={{color:"#888",fontSize:"0.875rem"}}>Partners who request to link with your dealership appear here</p>
        </div>
      ) : (
        <div style={{display:"flex",flexDirection:"column",gap:"0.75rem"}}>
          {partners.map(p=>(
            <div key={p._id} onClick={()=>openDetail(p)}
              style={{background:"#fff",border:"1.5px solid #E5E5E5",borderRadius:"10px",padding:"1rem 1.25rem",display:"flex",alignItems:"center",justifyContent:"space-between",gap:"1rem",cursor:"pointer",transition:"all 0.2s",flexWrap:"wrap"}}
              onMouseOver={e=>{(e.currentTarget as HTMLElement).style.borderColor="#F47B20";(e.currentTarget as HTMLElement).style.background="#FFFAF7";}}
              onMouseOut={e=>{(e.currentTarget as HTMLElement).style.borderColor="#E5E5E5";(e.currentTarget as HTMLElement).style.background="#fff";}}>
              <div style={{display:"flex",alignItems:"center",gap:"0.875rem"}}>
                <div style={{width:"44px",height:"44px",borderRadius:"50%",background:"#F47B20",color:"#fff",fontFamily:"var(--font-display)",fontSize:"1.2rem",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                  {p.partnerName?.charAt(0)||"P"}
                </div>
                <div>
                  <div style={{fontWeight:700,fontSize:"0.9rem",color:"#1A1A1A"}}>{p.partnerName||p.partnerEmail||"Partner"}</div>
                  <div style={{fontSize:"0.75rem",color:"#888"}}>{p.partnerEmail||""}</div>
                  <div style={{fontSize:"0.72rem",color:"#AAA"}}>{p.partnerPhone||""}</div>
                </div>
              </div>
              <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:"0.4rem",flexShrink:0}}>
                <span style={{padding:"0.2rem 0.65rem",borderRadius:"20px",fontSize:"0.7rem",fontWeight:700,textTransform:"capitalize" as const,color:STATUS_C[p.status]||"#888",border:`1px solid ${(STATUS_C[p.status]||"#888")}44`,background:`${(STATUS_C[p.status]||"#888")}11`}}>
                  {p.status}
                </span>
                <div style={{fontSize:"0.72rem",color:"#888"}}>{p.carIds?.length||0} vehicles assigned</div>
                <div style={{fontSize:"0.72rem",color:"#F47B20",fontWeight:600}}>View Details &gt;</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* PARTNER DETAIL MODAL */}
      {showDetail && (
        <div onClick={()=>{setShowDetail(null);setDetailData(null);setShowAssign(false);}}
          style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.4)",backdropFilter:"blur(4px)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:"1rem"}}>
          <div onClick={e=>e.stopPropagation()}
            style={{background:"#fff",borderRadius:"14px",width:"100%",maxWidth:"780px",maxHeight:"92vh",overflow:"hidden",display:"flex",flexDirection:"column",boxShadow:"0 20px 60px rgba(0,0,0,0.15)"}}>

            {/* Modal header */}
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"1rem 1.25rem",borderBottom:"1px solid #E5E5E5",background:"#fff",position:"sticky",top:0,zIndex:10,gap:"0.75rem",flexWrap:"wrap" as const}}>
              <h3 style={{fontFamily:"var(--font-display)",fontSize:"0.95rem",letterSpacing:"0.08em",color:"#1A1A1A"}}>
                PARTNER: {showDetail.partnerName||showDetail.partnerEmail||"DETAILS"}
              </h3>
              <div style={{display:"flex",alignItems:"center",gap:"0.5rem"}}>
                {detailData && (
                  <>
                    <div style={{position:"relative"}}>
                      <button onClick={()=>setExportPicker(exportPicker==="download"?"":"download")} disabled={exportBusy!==""}
                        style={{background:"#1A1A1A",color:"#fff",border:"none",borderRadius:"7px",padding:"0.4rem 0.75rem",fontSize:"0.72rem",cursor:"pointer",fontWeight:600,opacity:exportBusy?0.7:1}}>
                        {exportBusy==="download"?"Exporting…":"Export"}
                      </button>
                      {exportPicker==="download" && (
                        <div style={{position:"absolute",top:"calc(100% + 6px)",right:0,zIndex:30,background:"#fff",border:"1.5px solid #E5E5E5",borderRadius:"10px",boxShadow:"0 8px 24px rgba(0,0,0,0.18)",overflow:"hidden",minWidth:"120px",maxWidth:"calc(100vw - 2rem)"}}>
                          <button onClick={()=>handleExportDownload("pdf")} style={{display:"block",width:"100%",textAlign:"left" as const,padding:"0.55rem 0.8rem",background:"none",border:"none",cursor:"pointer",fontSize:"0.75rem",fontWeight:600}}>as PDF</button>
                          <button onClick={()=>handleExportDownload("jpg")} style={{display:"block",width:"100%",textAlign:"left" as const,padding:"0.55rem 0.8rem",background:"none",border:"none",borderTop:"1px solid #F5F5F5",cursor:"pointer",fontSize:"0.75rem",fontWeight:600}}>as JPG Image</button>
                          <button onClick={()=>handleExportDownload("excel")} style={{display:"block",width:"100%",textAlign:"left" as const,padding:"0.55rem 0.8rem",background:"none",border:"none",borderTop:"1px solid #F5F5F5",cursor:"pointer",fontSize:"0.75rem",fontWeight:600}}>as Excel</button>
                        </div>
                      )}
                    </div>
                    <div style={{position:"relative"}}>
                      <button onClick={()=>setExportPicker(exportPicker==="share"?"":"share")} disabled={exportBusy!==""}
                        style={{background:"#F5F5F5",color:"#525252",border:"1.5px solid #E5E5E5",borderRadius:"7px",padding:"0.4rem 0.75rem",fontSize:"0.72rem",cursor:"pointer",fontWeight:600,opacity:exportBusy?0.7:1}}>
                        {exportBusy==="share"?"Sharing…":"Share"}
                      </button>
                      {exportPicker==="share" && (
                        <div style={{position:"absolute",top:"calc(100% + 6px)",right:0,zIndex:30,background:"#fff",border:"1.5px solid #E5E5E5",borderRadius:"10px",boxShadow:"0 8px 24px rgba(0,0,0,0.18)",overflow:"hidden",minWidth:"120px",maxWidth:"calc(100vw - 2rem)"}}>
                          <button onClick={()=>handleExportShare("pdf")} style={{display:"block",width:"100%",textAlign:"left" as const,padding:"0.55rem 0.8rem",background:"none",border:"none",cursor:"pointer",fontSize:"0.75rem",fontWeight:600}}>as PDF</button>
                          <button onClick={()=>handleExportShare("jpg")} style={{display:"block",width:"100%",textAlign:"left" as const,padding:"0.55rem 0.8rem",background:"none",border:"none",borderTop:"1px solid #F5F5F5",cursor:"pointer",fontSize:"0.75rem",fontWeight:600}}>as JPG Image</button>
                        </div>
                      )}
                    </div>
                  </>
                )}
                <button onClick={()=>{setShowDetail(null);setDetailData(null);setShowAssign(false);}}
                  style={{background:"none",border:"none",color:"#AAA",fontSize:"1.1rem",cursor:"pointer",width:"32px",height:"32px",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center"}}
                  onMouseOver={e=>(e.currentTarget.style.background="#F5F5F5")}
                  onMouseOut={e=>(e.currentTarget.style.background="none")}>
                  X
                </button>
              </div>
            </div>

            {/* Modal body */}
            <div ref={exportRef} style={{overflowY:"auto",WebkitOverflowScrolling:"touch",padding:"1.25rem",display:"flex",flexDirection:"column",gap:"1.25rem",flex:1,minHeight:0}}>
              {detailLoading ? (
                <div style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"200px"}}>
                  <div style={{width:"28px",height:"28px",border:"2.5px solid #E5E5E5",borderTopColor:"#F47B20",borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>
                </div>
              ) : detailData ? (
                <>
                  {/* Partner info */}
                  <div style={{background:"#FAFAFA",borderRadius:"10px",padding:"1rem",display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))",gap:"0.625rem",flexShrink:0}}>
                    {[
                      ["Name",detailData.partner?.fullName||showDetail.partnerName],
                      ["Email",detailData.partner?.email||showDetail.partnerEmail],
                      ["Phone",detailData.partner?.phone||showDetail.partnerPhone],
                      ["Status",effectiveStatus],
                      ["Vehicles Assigned",detailData.totalCars ?? 0],
                      ["Vehicles Sold",detailData.carsSold ?? 0],
                    ].map(([l,v])=>{
                      const clickable = l === "Vehicles Assigned" && Number(v) > 0;
                      return (
                        <div key={String(l)} onClick={clickable ? () => assignedVehiclesRef.current?.scrollIntoView({behavior:"smooth", block:"center"}) : undefined}
                          style={{background:"#fff",border:`1px solid ${clickable?"#F47B20":"#F0F0F0"}`,borderRadius:"7px",padding:"0.625rem",cursor:clickable?"pointer":"default"}}
                          onMouseOver={clickable?(e)=>(e.currentTarget.style.background="#FFF7ED"):undefined}
                          onMouseOut={clickable?(e)=>(e.currentTarget.style.background="#fff"):undefined}>
                          <div style={{fontSize:"0.62rem",textTransform:"uppercase" as const,letterSpacing:"0.06em",color:"#AAA",marginBottom:"0.2rem"}}>{l}</div>
                          <div style={{fontSize:"0.875rem",color:clickable?"#F47B20":"#1A1A1A",fontWeight:600}}>
                            {String(v ?? "")}{clickable ? " — view below ↓" : ""}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Assign vehicles section - only for approved partners */}
                  {effectiveStatus==="approved" && (
                    <div style={{border:"1.5px solid #E5E5E5",borderRadius:"12px",overflow:"hidden",flexShrink:0}}>
                      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0.875rem 1rem",background:"#F5F5F5",borderBottom:"1px solid #E5E5E5"}}>
                        <div style={{fontFamily:"var(--font-display)",fontSize:"0.72rem",letterSpacing:"0.1em",color:"#525252"}}>
                          ASSIGN VEHICLES TO PARTNER
                        </div>
                        <button onClick={()=>{setShowAssign(!showAssign);if(!showAssign){setCarSearch("");loadAvailableCars();}}}
                          style={{background:showAssign?"#F5F5F5":"#F47B20",color:showAssign?"#525252":"#fff",border:showAssign?"1.5px solid #E5E5E5":"none",borderRadius:"7px",padding:"0.4rem 0.875rem",fontSize:"0.75rem",cursor:"pointer",fontFamily:"var(--font-display)",letterSpacing:"0.06em",fontWeight:700}}>
                          {showAssign?"Cancel":"+ Assign Vehicle"}
                        </button>
                      </div>

                      {showAssign && (
                        <div style={{padding:"1rem",display:"flex",flexDirection:"column",gap:"0.875rem"}}>
                          {assignMsg && (
                            <div style={{background:assignMsg.includes("success")?"#F0FDF4":"#FEF2F2",border:`1px solid ${assignMsg.includes("success")?"#86EFAC":"#FECACA"}`,borderRadius:"7px",padding:"0.625rem 0.875rem",fontSize:"0.8rem",color:assignMsg.includes("success")?"#15803D":"#DC2626",fontWeight:600}}>
                              {assignMsg}
                            </div>
                          )}

                          <input
                            placeholder="Search by brand, model, year, vehicle ID..."
                            value={carSearch}
                            onChange={e=>setCarSearch(e.target.value)}
                            style={{width:"100%",background:"#F5F5F5",border:"1.5px solid #E5E5E5",borderRadius:"8px",padding:"0.625rem 0.875rem",fontSize:"0.875rem",fontFamily:"var(--font-body)",outline:"none",boxSizing:"border-box" as const}}
                            onFocus={e=>e.target.style.borderColor="#F47B20"}
                            onBlur={e=>e.target.style.borderColor="#E5E5E5"}
                          />

                          {carsLoading ? (
                            <div style={{textAlign:"center",padding:"1.5rem",color:"#888",fontSize:"0.85rem"}}>Loading available vehicles...</div>
                          ) : filteredCars.length===0 ? (
                            <div style={{textAlign:"center",padding:"1.5rem",color:"#A3A3A3",fontSize:"0.82rem"}}>
                              {availCars.length===0 ? "No available vehicles in inventory" : "No vehicles match your search"}
                            </div>
                          ) : (
                            <div style={{maxHeight:"320px",overflowY:"auto",WebkitOverflowScrolling:"touch",display:"flex",flexDirection:"column",gap:"0.5rem",paddingRight:"0.25rem"}}>
                              {filteredCars.map(c=>(
                                <div key={c.carId}
                                  style={{display:"flex",alignItems:"center",gap:"0.75rem",padding:"0.625rem 0.875rem",background:"#FAFAFA",borderRadius:"8px",border:"1px solid #F0F0F0",transition:"all 0.15s"}}
                                  onMouseOver={e=>{(e.currentTarget as HTMLElement).style.borderColor="#F47B20";(e.currentTarget as HTMLElement).style.background="#FFF7ED";}}
                                  onMouseOut={e=>{(e.currentTarget as HTMLElement).style.borderColor="#F0F0F0";(e.currentTarget as HTMLElement).style.background="#FAFAFA";}}>
                                  {/* Vehicle image */}
                                  <div style={{width:"52px",height:"40px",borderRadius:"5px",overflow:"hidden",background:"#E5E5E5",flexShrink:0}}>
                                    {c.images?.[0]
                                      ?<img src={c.images[0]} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                                      :<div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100%",fontSize:"1.1rem",opacity:0.4}}>&#x1F697;</div>
                                    }
                                  </div>
                                  {/* Vehicle info */}
                                  <div style={{flex:1,minWidth:0}}>
                                    <div style={{fontWeight:700,fontSize:"0.85rem",color:"#1A1A1A"}}>{c.brand} {c.model} {c.year}</div>
                                    <div style={{fontSize:"0.7rem",color:"#888",display:"flex",gap:"0.5rem",flexWrap:"wrap" as const}}>
                                      <span style={{fontFamily:"monospace",background:"#F5F5F5",padding:"0.05rem 0.3rem",borderRadius:"3px"}}>{c.carId}</span>
                                      {c.color&&<span>{c.color}</span>}
                                      {c.transmission&&<span>{c.transmission}</span>}
                                    </div>
                                  </div>
                                  <div style={{textAlign:"right",flexShrink:0}}>
                                    <div style={{fontSize:"0.82rem",color:"#F47B20",fontWeight:700}}>NGN {(c.sellingPrice||0).toLocaleString()}</div>
                                    <button
                                      onClick={()=>assignCar(c.carId)}
                                      disabled={assigning===c.carId}
                                      style={{marginTop:"0.25rem",background:"#F47B20",color:"#fff",border:"none",borderRadius:"5px",padding:"0.3rem 0.75rem",fontSize:"0.7rem",cursor:"pointer",fontFamily:"var(--font-display)",letterSpacing:"0.06em",opacity:assigning===c.carId?0.6:1,fontWeight:700}}>
                                      {assigning===c.carId?"...":"Assign"}
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Assigned vehicles list */}
                  {detailData.cars?.length > 0 && (
                    <div ref={assignedVehiclesRef} style={{border:"1.5px solid #E5E5E5",borderRadius:"12px",overflow:"hidden",flexShrink:0}}>
                      <div style={{padding:"0.875rem 1rem",background:"#F5F5F5",borderBottom:"1px solid #E5E5E5",fontFamily:"var(--font-display)",fontSize:"0.72rem",letterSpacing:"0.1em",color:"#525252"}}>
                        ASSIGNED VEHICLES ({detailData.cars.length})
                      </div>
                      <div style={{display:"flex",flexDirection:"column",gap:0}}>
                        {detailData.cars.map((c:any,i:number)=>(
                          <Link key={c._id||c.carId} href={`/cars/${c.carId}`}
                            style={{display:"flex",alignItems:"center",gap:"0.75rem",padding:"0.75rem 1rem",borderBottom:i<detailData.cars.length-1?"1px solid #F5F5F5":"none",textDecoration:"none",color:"inherit",cursor:"pointer"}}
                            onMouseOver={e=>(e.currentTarget.style.background="#FAFAFA")}
                            onMouseOut={e=>(e.currentTarget.style.background="transparent")}>
                            <div style={{width:"48px",height:"36px",borderRadius:"5px",overflow:"hidden",background:"#F5F5F5",flexShrink:0}}>
                              {c.images?.[0]?<img src={c.images[0]} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:<span style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100%",fontSize:"1rem",opacity:0.3}}>&#x1F697;</span>}
                            </div>
                            <div style={{flex:1,minWidth:0}}>
                              <div style={{fontWeight:700,fontSize:"0.83rem",color:"#1A1A1A"}}>{c.brand} {c.model} {c.year}</div>
                              <div style={{fontSize:"0.68rem",color:"#888"}}>{c.carId}{c.totalExpenses>0 ? ` · NGN ${Number(c.totalExpenses).toLocaleString()} in expenses` : ""}</div>
                              {c.saleRecord && (
                                <div style={{fontSize:"0.68rem",color:"#15803D",marginTop:"0.1rem"}}>Sold · NGN {Number(c.saleRecord.sellingPrice||0).toLocaleString()}{c.saleRecord.buyerName?` to ${c.saleRecord.buyerName}`:""}</div>
                              )}
                            </div>
                            <div style={{textAlign:"right",flexShrink:0}}>
                              <div style={{fontSize:"0.8rem",color:"#F47B20",fontWeight:700}}>NGN {(c.sellingPrice||0).toLocaleString()}</div>
                              <span style={{fontSize:"0.65rem",padding:"0.1rem 0.35rem",borderRadius:"4px",background:c.status==="available"?"#F0FDF4":c.status==="sold"?"#FEF2F2":"#F5F5F5",color:c.status==="available"?"#15803D":c.status==="sold"?"#DC2626":"#737373",fontWeight:600}}>
                                {c.status}
                              </span>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recent movements for this partner's assigned vehicles */}
                  {detailData.recentMovements?.length > 0 && (
                    <div style={{border:"1.5px solid #E5E5E5",borderRadius:"12px",overflow:"hidden",flexShrink:0}}>
                      <div style={{padding:"0.875rem 1rem",background:"#F5F5F5",borderBottom:"1px solid #E5E5E5",fontFamily:"var(--font-display)",fontSize:"0.72rem",letterSpacing:"0.1em",color:"#525252"}}>
                        RECENT MOVEMENTS ({detailData.recentMovements.length})
                      </div>
                      <div style={{display:"flex",flexDirection:"column",gap:0,maxHeight:"260px",overflowY:"auto",WebkitOverflowScrolling:"touch" as any}}>
                        {detailData.recentMovements.map((m:any,i:number)=>(
                          <div key={m._id||i} style={{padding:"0.75rem 1rem",borderBottom:i<detailData.recentMovements.length-1?"1px solid #F5F5F5":"none"}}>
                            <div style={{display:"flex",justifyContent:"space-between",gap:"0.5rem"}}>
                              <div style={{fontSize:"0.8rem",fontWeight:600,color:"#1A1A1A"}}>{m.type||m.action||"Movement"} · {m.carId}</div>
                              <div style={{fontSize:"0.68rem",color:"#AAA",flexShrink:0}}>{m.createdAt?new Date(m.createdAt).toLocaleDateString("en-NG",{day:"numeric",month:"short"}):""}</div>
                            </div>
                            {m.notes && <div style={{fontSize:"0.72rem",color:"#737373",marginTop:"0.15rem"}}>{m.notes}</div>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Revenue summary */}
                  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(130px,1fr))",gap:"0.75rem",flexShrink:0}}>
                    {[
                      {label:"Total Revenue",val:fmt(detailData.totalRevenue)},
                      {label:"Total Profit",val:fmt(detailData.totalProfit)},
                      {label:"Total Sales",val:detailData.totalSales||0},
                    ].map(s=>(
                      <div key={s.label} style={{background:"#FFF7ED",border:"1.5px solid rgba(244,123,32,0.2)",borderRadius:"9px",padding:"0.875rem",textAlign:"center"}}>
                        <div style={{fontFamily:"var(--font-display)",fontSize:"1.1rem",color:"#F47B20",lineHeight:1}}>{String(s.val)}</div>
                        <div style={{fontSize:"0.65rem",color:"#737373",textTransform:"uppercase" as const,letterSpacing:"0.06em",marginTop:"0.25rem"}}>{s.label}</div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div style={{textAlign:"center",padding:"3rem",color:"#888",fontSize:"0.875rem"}}>Could not load partner details.</div>
              )}
            </div>

            {/* Footer actions */}
            <div style={{display:"flex",gap:"0.75rem",justifyContent:"flex-end",padding:"0.875rem 1.25rem",borderTop:"1px solid #E5E5E5",background:"#FAFAFA",flexWrap:"wrap"}}>
              {effectiveStatus==="pending" && (
                <>
                  <button onClick={()=>handleAction(showDetail._id||showDetail.linkId,"approve")}
                    style={{background:"#16A34A",color:"#fff",border:"none",borderRadius:"7px",padding:"0.6rem 1.25rem",fontFamily:"var(--font-display)",fontSize:"0.82rem",cursor:"pointer",letterSpacing:"0.06em",fontWeight:700}}>
                    Approve Partner
                  </button>
                  <button onClick={()=>handleAction(showDetail._id||showDetail.linkId,"reject",{reason:"Rejected by dealer"})}
                    style={{background:"#DC2626",color:"#fff",border:"none",borderRadius:"7px",padding:"0.6rem 1.25rem",fontFamily:"var(--font-display)",fontSize:"0.82rem",cursor:"pointer",letterSpacing:"0.06em",fontWeight:700}}>
                    Reject
                  </button>
                </>
              )}
              {effectiveStatus==="approved" && (
                <button onClick={()=>handleAction(showDetail._id||showDetail.linkId,"remove")}
                  style={{background:"#DC2626",color:"#fff",border:"none",borderRadius:"7px",padding:"0.6rem 1.25rem",fontFamily:"var(--font-display)",fontSize:"0.82rem",cursor:"pointer",letterSpacing:"0.06em",fontWeight:700}}>
                  Remove Partner
                </button>
              )}
              <button onClick={()=>{setShowDetail(null);setDetailData(null);setShowAssign(false);}}
                style={{background:"#fff",color:"#525252",border:"1.5px solid #E5E5E5",borderRadius:"7px",padding:"0.6rem 1.25rem",fontFamily:"var(--font-body)",fontSize:"0.875rem",cursor:"pointer",fontWeight:600}}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}