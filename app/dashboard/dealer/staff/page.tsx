"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import PasswordInput from "@/components/ui/PasswordInput";
import { rowsToExcelBlob, renderHtmlStringToPdfBlob, renderHtmlStringToJpgBlob, downloadBlob, shareBlob } from "@/lib/documentExport";
import { useToast } from "@/store/toastStore";

const PERM_GROUPS = [
  { group:"Inventory",        color:"#F47B20", perms:[
    { id:"view_inventory",    label:"View Inventory",           desc:"See all cars in inventory" },
    { id:"add_cars",          label:"Add Vehicles",             desc:"Add new cars to inventory" },
    { id:"edit_cars",         label:"Edit Vehicles",            desc:"Edit car details and photos" },
    { id:"delete_cars",       label:"Delete Vehicles",          desc:"Remove cars from inventory" },
  ]},
  { group:"Sales",            color:"#16A34A", perms:[
    { id:"view_sales",        label:"View Sales",               desc:"See all sales records" },
    { id:"record_sales",      label:"Record Sales",             desc:"Record new vehicle sales" },
  ]},
  { group:"Documents",        color:"#3B8BD4", perms:[
    { id:"view_invoices",     label:"View Invoices & Receipts", desc:"View generated documents" },
    { id:"generate_invoices", label:"Generate Invoices",        desc:"Generate and print documents" },
    { id:"edit_documents",    label:"Edit Documents",           desc:"Edit invoice fields before printing" },
  ]},
  { group:"Reports",          color:"#7B68EE", perms:[
    { id:"view_reports",      label:"View Reports",             desc:"See financial reports" },
    { id:"generate_reports",  label:"Generate Reports",         desc:"Generate and download reports" },
  ]},
  { group:"Appointments",     color:"#D97706", perms:[
    { id:"view_appointments",   label:"View Appointments",      desc:"See all appointments" },
    { id:"manage_appointments", label:"Manage Appointments",    desc:"Confirm, decline, reschedule" },
  ]},
  { group:"Requests",         color:"#EC4899", perms:[
    { id:"view_requests",     label:"View Requests",            desc:"See customer vehicle requests" },
    { id:"manage_requests",   label:"Respond to Requests",      desc:"Accept, counter, decline requests" },
  ]},
  { group:"Expenses",         color:"#DC2626", perms:[
    { id:"view_expenses",     label:"View Expenses",            desc:"See expense records" },
    { id:"manage_expenses",   label:"Manage Expenses",          desc:"Add and edit expenses" },
  ]},
  { group:"Movements",        color:"#0891B2", perms:[
    { id:"view_movements",    label:"View Movements",           desc:"See vehicle movement logs" },
    { id:"manage_movements",  label:"Log Movements",            desc:"Log movements and request approvals" },
  ]},
  { group:"Partners",         color:"#8B5CF6", perms:[
    { id:"view_partners",     label:"View Partners",            desc:"See partner information" },
    { id:"manage_partners",   label:"Manage Partners",          desc:"Approve/reject partners, assign cars" },
  ]},
  { group:"Messages",         color:"#F59E0B", perms:[
    { id:"view_messages",     label:"View Messages",            desc:"Read dealer messages" },
    { id:"send_messages",     label:"Reply to Messages",        desc:"Send messages on behalf of dealer" },
  ]},
  { group:"CCTV",             color:"#525252", perms:[
    { id:"view_cctv",         label:"View CCTV",                desc:"Access CCTV section" },
  ]},
  { group:"Staff Management", color:"#1A1A1A", perms:[
    { id:"view_staff",        label:"View Staff",               desc:"See the staff list" },
    { id:"create_staff",      label:"Create Staff",             desc:"Create new staff accounts" },
    { id:"edit_staff",        label:"Edit Staff Details",       desc:"Update staff info and permissions" },
    { id:"suspend_staff",     label:"Suspend / Reactivate",     desc:"Suspend or reactivate staff" },
  ]},
];

const ALL_PERMS = PERM_GROUPS.flatMap(g => g.perms.map(p => p.id));

const PRESETS = [
  { label:"Sales Agent",  color:"#16A34A", perms:["view_inventory","view_sales","record_sales","view_invoices","generate_invoices","view_appointments","manage_appointments","view_requests","view_messages","send_messages"] },
  { label:"Vehicle Manager",  color:"#F47B20", perms:["view_inventory","add_cars","edit_cars","delete_cars","view_sales","view_reports","generate_reports","view_movements","manage_movements"] },
  { label:"Receptionist", color:"#D97706", perms:["view_inventory","view_appointments","manage_appointments","view_requests","manage_requests","view_invoices","generate_invoices","view_messages","send_messages"] },
  { label:"Finance",      color:"#7B68EE", perms:["view_sales","view_reports","generate_reports","view_expenses","manage_expenses","view_invoices","generate_invoices","edit_documents"] },
  { label:"Full Access",  color:"#1A1A1A", perms:ALL_PERMS },
  { label:"View Only",    color:"#737373", perms:["view_inventory","view_sales","view_reports","view_appointments","view_requests","view_movements","view_partners","view_messages"] },
];

//  Styles defined OUTSIDE component 
const INP: React.CSSProperties = {
  display:"block", width:"100%", background:"#fff",
  border:"2px solid #D4D4D4", borderRadius:"8px",
  padding:"11px 14px", fontSize:"15px",
  fontFamily:"Arial, sans-serif", outline:"none",
  boxSizing:"border-box", color:"#1A1A1A", marginTop:"5px",
};
const LBL: React.CSSProperties = {
  display:"block", fontSize:"11px", fontWeight:700,
  letterSpacing:"0.08em", textTransform:"uppercase" as const, color:"#525252",
};
const FIELD: React.CSSProperties = {
  display:"flex", flexDirection:"column", marginBottom:"16px",
};

export default function DealerStaffPage() {
  const [staff,    setStaff]    = useState<any[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [mode,     setMode]     = useState<"list"|"create"|"edit"|"view">("list");
  const [selected, setSelected] = useState<any>(null);
  const [msg,      setMsg]      = useState("");
  const [saving,   setSaving]   = useState(false);
  const [search,   setSearch]   = useState("");
  const [dealer,   setDealer]   = useState<any>(null);
  const showToast = useToast();
  const [exportBusy, setExportBusy] = useState<""|"pdf"|"jpg"|"excel">("");
  const [showExportPicker, setShowExportPicker] = useState(false);
  const [idCardBusy, setIdCardBusy] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  //  Every form field is its own useState  no shared object 
  const [fName,    setFName]    = useState("");
  const [fEmail,   setFEmail]   = useState("");
  const [fPhone,   setFPhone]   = useState("");
  const [fWa,      setFWa]      = useState("");
  const [fPos,     setFPos]     = useState("");
  const [fAddr,    setFAddr]    = useState("");
  const [fPw,      setFPw]      = useState("");
  const [fPerms,   setFPerms]   = useState<string[]>([]);

  const load = async () => {
    setLoading(true);
    try {
      const r = await api.get("/api/v1/staff/");
      setStaff(r.data.staff || r.data || []);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => {
    load();
    api.get("/api/v1/dealers/me").then(r => setDealer(r.data)).catch(() => {});
  }, []);

  const clearForm = () => {
    setFName(""); setFEmail(""); setFPhone(""); setFWa("");
    setFPos(""); setFAddr(""); setFPw(""); setFPerms([]);
  };

  const openCreate = () => { clearForm(); setSelected(null); setMsg(""); setMode("create"); };

  const openEdit = (s: any) => {
    setFName(s.fullName||""); setFEmail(s.email||""); setFPhone(s.phone||"");
    setFWa(s.whatsapp||""); setFPos(s.position||""); setFAddr(s.address||"");
    setFPw(""); setFPerms(s.permissions||[]);
    setSelected(s); setMsg(""); setMode("edit");
  };

  const back = () => { setMode("list"); setSelected(null); setMsg(""); };

  // ── Export staff list (Excel/PDF/JPG) ──────────────────────────
  const filteredStaff = () => staff.filter((s: any) =>
    !search || [s.fullName, s.email, s.position].some(v => (v || "").toLowerCase().includes(search.toLowerCase()))
  );

  const buildStaffListHtml = () => {
    const rows = filteredStaff();
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
      <h1>Staff — ${dealer?.companyName || "CARSTRIMS"}</h1>
      <div class="sub">${rows.length} staff member${rows.length !== 1 ? "s" : ""} &bull; Generated ${now}</div>
      <table><thead><tr><th>Name</th><th>Position</th><th>Email</th><th>Phone</th><th>Status</th><th>Staff ID</th></tr></thead>
      <tbody>${rows.map((s: any) => `<tr><td>${s.fullName || ""}</td><td>${s.position || ""}</td><td>${s.email || ""}</td><td>${s.phone || ""}</td><td>${s.status || ""}</td><td>${s.staffId || ""}</td></tr>`).join("")}</tbody>
      </table>
      <div class="footer">Powered by CARSTRIMS &mdash; UASE TECH STUDIO</div>
      </body></html>`;
  };

  const handleStaffExport = async (format: "pdf" | "jpg" | "excel") => {
    setShowExportPicker(false);
    setExportBusy(format);
    try {
      const filename = `carstrims-staff-${Date.now()}`;
      if (format === "excel") {
        const blob = rowsToExcelBlob(filteredStaff().map((s: any) => ({
          Name: s.fullName || "", Position: s.position || "", Email: s.email || "",
          Phone: s.phone || "", WhatsApp: s.whatsapp || "", Status: s.status || "",
          "Staff ID": s.staffId || "", Joined: fmtDate(s.createdAt),
        })), "Staff");
        await downloadBlob(blob, `${filename}.xlsx`);
      } else {
        const html = buildStaffListHtml();
        const blob = format === "jpg" ? await renderHtmlStringToJpgBlob(html) : await renderHtmlStringToPdfBlob(html, "Staff List");
        await downloadBlob(blob, `${filename}.${format}`);
      }
      showToast("Downloaded", "success");
    } catch (e: any) {
      showToast(e?.message || "Export failed", "error");
    } finally {
      setExportBusy("");
    }
  };

  // ── ID card generation ─────────────────────────────────────────
  const buildIdCardHtml = (s: any) => {
    return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
      *{box-sizing:border-box}body{font-family:Arial,sans-serif;padding:40px;background:#F5F5F5;display:flex;justify-content:center}
      .card{width:340px;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 8px 24px rgba(0,0,0,0.12);border:1px solid #E5E5E5}
      .band{background:#F47B20;padding:14px 18px;color:#fff}
      .brand{font-weight:900;font-size:14px;letter-spacing:0.08em}
      .company{font-size:9px;opacity:0.9;margin-top:1px}
      .body{padding:20px 18px;text-align:center}
      .photo{width:96px;height:96px;border-radius:50%;background:#FFF7ED;border:3px solid #F47B20;margin:0 auto 12px;display:flex;align-items:center;justify-content:center;font-size:36px;color:#F47B20;font-weight:700;overflow:hidden}
      .photo img{width:100%;height:100%;object-fit:cover}
      .name{font-size:17px;font-weight:800;color:#1A1A1A}
      .pos{font-size:12px;color:#F47B20;font-weight:700;margin-top:2px;text-transform:uppercase;letter-spacing:0.04em}
      .divider{height:1px;background:#E5E5E5;margin:14px 0}
      .row{display:flex;justify-content:space-between;font-size:10.5px;padding:4px 0;text-align:left}
      .rl{color:#A3A3A3;text-transform:uppercase;letter-spacing:0.05em;font-weight:700}
      .rv{color:#1A1A1A;font-weight:600}
      .footer{background:#1A1A1A;color:#fff;text-align:center;padding:7px;font-size:8px;letter-spacing:0.05em}
      </style></head><body>
      <div class="card">
        <div class="band"><div class="brand">CARSTRIMS</div><div class="company">${dealer?.companyName || ""}</div></div>
        <div class="body">
          <div class="photo">${s.profilePicture ? `<img src="${s.profilePicture}"/>` : (s.fullName || "?").charAt(0).toUpperCase()}</div>
          <div class="name">${s.fullName || ""}</div>
          <div class="pos">${s.position || "Staff"}</div>
          <div class="divider"></div>
          <div class="row"><span class="rl">Staff ID</span><span class="rv">${s.staffId || ""}</span></div>
          <div class="row"><span class="rl">Phone</span><span class="rv">${s.phone || ""}</span></div>
          <div class="row"><span class="rl">Email</span><span class="rv">${s.email || ""}</span></div>
        </div>
        <div class="footer">${dealer?.address || ""} ${dealer?.city ? "&bull; " + dealer.city : ""}</div>
      </div>
      </body></html>`;
  };

  const handleGenerateIdCard = async (s: any) => {
    setIdCardBusy(true);
    try {
      const blob = await renderHtmlStringToPdfBlob(buildIdCardHtml(s), `${s.fullName} - ID Card`);
      await downloadBlob(blob, `carstrims-id-card-${(s.fullName || "staff").toLowerCase().replace(/\s+/g, "-")}.pdf`);
      showToast("ID card downloaded", "success");
    } catch (e: any) {
      showToast(e?.message || "Could not generate ID card", "error");
    } finally {
      setIdCardBusy(false);
    }
  };

  // ── Delete staff account ───────────────────────────────────────
  const handleDeleteStaff = async (s: any) => {
    setDeleting(true);
    try {
      await api.delete(`/api/v1/staff/${s._id || s.staffId}`);
      showToast("Staff account removed", "success");
      setShowDeleteConfirm(false);
      back();
      load();
    } catch (e: any) {
      showToast(e?.response?.data?.detail || "Could not remove staff", "error");
    } finally {
      setDeleting(false);
    }
  };

  const togglePerm = (id: string) =>
    setFPerms(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

  const applyPreset = (perms: string[]) => setFPerms(perms);

  const submitCreate = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true); setMsg("");
    try {
      await api.post("/api/v1/staff/", {
        fullName:fName, email:fEmail, phone:fPhone, whatsapp:fWa,
        position:fPos, address:fAddr, password:fPw||"Staff@1234",
        permissions:fPerms,
      });
      setMsg("Staff account created! They can now log in with their email and password.");
      load(); back();
    } catch(e:any) { setMsg("Error: "+(e.response?.data?.detail||"Failed")); }
    finally { setSaving(false); }
  };

  const submitEdit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true); setMsg("");
    try {
      const sid = selected._id || selected.staffId;
      await api.patch(`/api/v1/staff/${sid}`, {
        fullName:fName, phone:fPhone, whatsapp:fWa, position:fPos, address:fAddr,
      });
      await api.patch(`/api/v1/staff/${sid}/permissions`, { permissions:fPerms });
      setMsg("Staff member updated successfully.");
      load(); back();
    } catch(e:any) { setMsg("Error: "+(e.response?.data?.detail||"Failed")); }
    finally { setSaving(false); }
  };

  const toggleSuspend = async (s: any) => {
    if (!confirm(`${s.status==="active"?"Suspend":"Reactivate"} ${s.fullName}?`)) return;
    try { await api.post(`/api/v1/staff/${s._id||s.staffId}/toggle-suspend`); load(); }
    catch(e:any) { alert(e.response?.data?.detail||"Failed"); }
  };

  const fmtDate = (iso: any) =>
    iso ? new Date(iso).toLocaleDateString("en-NG",{day:"numeric",month:"short",year:"numeric"}) : "";

  const filtered = staff.filter(s =>
    !search || [s.fullName,s.email,s.position].some(v =>
      v?.toLowerCase().includes(search.toLowerCase())
    )
  );

  const Msg = () => !msg ? null : (
    <div style={{background:msg.startsWith("Error")?"#FEF2F2":"#F0FDF4",
      border:`1px solid ${msg.startsWith("Error")?"#FCA5A5":"#86EFAC"}`,
      borderRadius:"8px",padding:"12px 16px",fontSize:"14px",
      color:msg.startsWith("Error")?"#DC2626":"#15803D",fontWeight:600}}>
      {msg}
    </div>
  );

  //  PERMISSIONS SECTION  inline render function (NOT a component) 
  const renderPerms = () => (
    <div style={{display:"flex",flexDirection:"column",gap:"10px"}}>
      {/* Presets */}
      <div>
        <div style={LBL}>Quick Role Presets</div>
        <div style={{display:"flex",gap:"6px",flexWrap:"wrap",marginTop:"6px"}}>
          {PRESETS.map(p => (
            <button key={p.label} type="button" onClick={() => applyPreset(p.perms)}
              style={{background:"#F5F5F5",border:"1.5px solid #E5E5E5",color:"#525252",
                borderRadius:"20px",padding:"5px 12px",fontSize:"12px",cursor:"pointer",fontWeight:600}}
              onMouseOver={e=>{(e.currentTarget as HTMLElement).style.background=p.color;(e.currentTarget as HTMLElement).style.color="#fff";}}
              onMouseOut={e=>{(e.currentTarget as HTMLElement).style.background="#F5F5F5";(e.currentTarget as HTMLElement).style.color="#525252";}}>
              {p.label}
            </button>
          ))}
          <button type="button" onClick={() => setFPerms(ALL_PERMS)}
            style={{background:"#1A1A1A",color:"#fff",border:"none",borderRadius:"20px",
              padding:"5px 12px",fontSize:"12px",cursor:"pointer",fontWeight:700}}>
            All
          </button>
          <button type="button" onClick={() => setFPerms([])}
            style={{background:"#FEF2F2",color:"#DC2626",border:"1px solid #FECACA",
              borderRadius:"20px",padding:"5px 12px",fontSize:"12px",cursor:"pointer",fontWeight:600}}>
            Clear
          </button>
        </div>
      </div>

      {/* Permission groups */}
      {PERM_GROUPS.map(group => (
        <div key={group.group} style={{border:"1.5px solid #E5E5E5",borderRadius:"10px",overflow:"hidden"}}>
          <div style={{padding:"8px 14px",background:"#F8F8F8",display:"flex",
            alignItems:"center",gap:"8px",borderBottom:"1px solid #EBEBEB"}}>
            <div style={{width:"8px",height:"8px",borderRadius:"50%",
              background:group.color,flexShrink:0}}/>
            <span style={{fontFamily:"var(--font-display)",fontSize:"11px",
              letterSpacing:"0.1em",color:"#1A1A1A",fontWeight:700}}>
              {group.group.toUpperCase()}
            </span>
            <span style={{fontSize:"10px",color:"#A3A3A3",marginLeft:"auto"}}>
              {fPerms.filter(p => group.perms.map(x=>x.id).includes(p)).length}/{group.perms.length} selected
            </span>
          </div>
          <div style={{padding:"8px",display:"flex",flexDirection:"column",gap:"3px"}}>
            {group.perms.map(perm => {
              const on = fPerms.includes(perm.id);
              return (
                <div key={perm.id} onClick={() => togglePerm(perm.id)}
                  style={{display:"flex",alignItems:"flex-start",gap:"10px",
                    padding:"8px 10px",borderRadius:"7px",cursor:"pointer",
                    background:on?`${group.color}12`:"transparent",
                    border:`1px solid ${on?group.color+"55":"transparent"}`,
                    transition:"all .15s"}}>
                  <div style={{width:"18px",height:"18px",borderRadius:"4px",
                    flexShrink:0,marginTop:"1px",
                    border:`2px solid ${on?group.color:"#CCC"}`,
                    background:on?group.color:"#fff",
                    display:"flex",alignItems:"center",justifyContent:"center",
                    transition:"all .15s"}}>
                    {on && <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                      <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.8"
                        strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>}
                  </div>
                  <div>
                    <div style={{fontSize:"14px",fontWeight:on?700:400,
                      color:on?"#1A1A1A":"#525252"}}>{perm.label}</div>
                    <div style={{fontSize:"11px",color:"#A3A3A3",marginTop:"1px"}}>{perm.desc}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      <div style={{background:"#F0FDF4",border:"1px solid #86EFAC",borderRadius:"8px",
        padding:"10px 14px",fontSize:"13px",color:"#15803D",fontWeight:600}}>
        {fPerms.length} of {ALL_PERMS.length} permissions selected
      </div>
    </div>
  );

  // 
  // LIST VIEW
  // 
  if (mode === "list") return (
    <div style={{display:"flex",flexDirection:"column",gap:"20px"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",
        flexWrap:"wrap",gap:"12px"}}>
        <div>
          <h2 style={{fontFamily:"var(--font-display)",fontSize:"1.5rem",
            letterSpacing:"0.05em",color:"#1A1A1A",margin:"0 0 4px"}}>
            Staff Management
          </h2>
          <p style={{fontSize:"13px",color:"#888",margin:0}}>
            {staff.length} team member{staff.length!==1?"s":""}  all actions are recorded under your dealership
          </p>
        </div>
        <div style={{display:"flex",gap:"0.5rem",alignItems:"center"}}>
          <div style={{position:"relative"}}>
            <button onClick={()=>setShowExportPicker(v=>!v)} disabled={exportBusy!==""}
              style={{background:"#F5F5F5",color:"#525252",border:"1.5px solid #E5E5E5",borderRadius:"8px",
                padding:"11px 16px",fontSize:"13px",cursor:"pointer",fontWeight:600}}>
              {exportBusy?"Exporting…":"Export"}
            </button>
            {showExportPicker && (
              <div style={{position:"absolute",top:"calc(100% + 6px)",right:0,zIndex:30,background:"#fff",border:"1.5px solid #E5E5E5",borderRadius:"10px",boxShadow:"0 8px 24px rgba(0,0,0,0.15)",overflow:"hidden",minWidth:"120px",maxWidth:"calc(100vw - 2rem)"}}>
                <button onClick={()=>handleStaffExport("pdf")} style={{display:"block",width:"100%",textAlign:"left" as const,padding:"0.6rem 0.9rem",background:"none",border:"none",cursor:"pointer",fontSize:"0.8rem",fontWeight:600}}>as PDF</button>
                <button onClick={()=>handleStaffExport("jpg")} style={{display:"block",width:"100%",textAlign:"left" as const,padding:"0.6rem 0.9rem",background:"none",border:"none",borderTop:"1px solid #F5F5F5",cursor:"pointer",fontSize:"0.8rem",fontWeight:600}}>as JPG Image</button>
                <button onClick={()=>handleStaffExport("excel")} style={{display:"block",width:"100%",textAlign:"left" as const,padding:"0.6rem 0.9rem",background:"none",border:"none",borderTop:"1px solid #F5F5F5",cursor:"pointer",fontSize:"0.8rem",fontWeight:600}}>as Excel</button>
              </div>
            )}
          </div>
          <button onClick={openCreate}
            style={{background:"#F47B20",color:"#fff",border:"none",borderRadius:"8px",
              padding:"11px 20px",fontFamily:"var(--font-display)",fontSize:"14px",
              letterSpacing:"0.08em",cursor:"pointer",fontWeight:700}}>
            + Add Staff Member
          </button>
        </div>
      </div>

      <Msg/>

      <input value={search} onChange={e=>setSearch(e.target.value)}
        placeholder="Search by name, email or position..."
        style={{...INP,marginTop:0,padding:"12px 16px",fontSize:"15px"}}/>

      {loading ? (
        <div style={{display:"flex",justifyContent:"center",padding:"3rem"}}>
          <div style={{width:"28px",height:"28px",border:"2.5px solid #E5E5E5",
            borderTopColor:"#F47B20",borderRadius:"50%",animation:"spin .8s linear infinite"}}/>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{padding:"3rem",textAlign:"center",border:"1.5px dashed #E5E5E5",
          borderRadius:"12px",background:"#fff"}}>
          <div style={{fontSize:"2.5rem",marginBottom:"12px"}}></div>
          <h3 style={{fontFamily:"var(--font-display)",fontSize:"1.1rem",color:"#1A1A1A",margin:"0 0 8px"}}>
            No staff yet
          </h3>
          <p style={{color:"#888",fontSize:"14px",margin:0}}>
            Add staff members to help manage your dealership.
            Everything they do will be recorded under your name.
          </p>
        </div>
      ) : (
        <div style={{display:"flex",flexDirection:"column",gap:"12px"}}>
          {filtered.map(s => (
            <div key={s._id||s.staffId}
              style={{background:"#fff",border:"1.5px solid #E5E5E5",borderRadius:"12px",
                padding:"16px 20px",display:"flex",alignItems:"flex-start",
                gap:"16px",flexWrap:"wrap"}}>
              <div style={{width:"50px",height:"50px",borderRadius:"50%",flexShrink:0,
                background:"#FFF7ED",border:"2px solid #F47B20",overflow:"hidden",
                display:"flex",alignItems:"center",justifyContent:"center",
                fontSize:"20px",color:"#F47B20",fontFamily:"var(--font-display)"}}>
                {s.profilePicture
                  ? <img src={s.profilePicture} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                  : s.fullName?.charAt(0)?.toUpperCase()||"S"}
              </div>
              <div style={{flex:1,minWidth:"160px"}}>
                <div style={{display:"flex",alignItems:"center",gap:"8px",flexWrap:"wrap",marginBottom:"4px"}}>
                  <span style={{fontWeight:700,fontSize:"15px",color:"#1A1A1A"}}>{s.fullName}</span>
                  <span style={{background:s.status==="active"?"#F0FDF4":"#FEF2F2",
                    color:s.status==="active"?"#16A34A":"#DC2626",
                    border:`1px solid ${s.status==="active"?"#86EFAC":"#FECACA"}`,
                    borderRadius:"20px",padding:"2px 8px",fontSize:"11px",fontWeight:700}}>
                    {s.status}
                  </span>
                </div>
                <div style={{fontSize:"13px",color:"#737373"}}>{s.position}  {s.email}</div>
                <div style={{fontSize:"12px",color:"#A3A3A3",marginTop:"2px"}}>
                  {s.phone}  Joined {fmtDate(s.createdAt)}
                </div>
                <div style={{display:"flex",gap:"4px",flexWrap:"wrap",marginTop:"8px"}}>
                  {PERM_GROUPS.map(g => {
                    const n = (s.permissions||[]).filter((p:string)=>g.perms.map(x=>x.id).includes(p)).length;
                    if (!n) return null;
                    return (
                      <span key={g.group} style={{background:`${g.color}18`,color:g.color,
                        border:`1px solid ${g.color}33`,borderRadius:"20px",
                        padding:"1px 7px",fontSize:"10px",fontWeight:600}}>
                        {g.group} ({n})
                      </span>
                    );
                  })}
                  {!(s.permissions||[]).length &&
                    <span style={{fontSize:"11px",color:"#A3A3A3",fontStyle:"italic"}}>No permissions assigned</span>}
                </div>
              </div>
              <div style={{display:"flex",gap:"6px",flexShrink:0,flexWrap:"wrap"}}>
                <button onClick={()=>setMode("view")||setSelected(s)}
                  style={{background:"#F5F5F5",border:"1.5px solid #E5E5E5",color:"#525252",
                    borderRadius:"7px",padding:"6px 12px",fontSize:"12px",cursor:"pointer",fontWeight:600}}>
                  View
                </button>
                <button onClick={()=>openEdit(s)}
                  style={{background:"#FFF7ED",border:"1.5px solid rgba(244,123,32,.3)",color:"#C4621A",
                    borderRadius:"7px",padding:"6px 12px",fontSize:"12px",cursor:"pointer",fontWeight:600}}>
                  Edit
                </button>
                <button onClick={()=>toggleSuspend(s)}
                  style={{background:s.status==="active"?"#FEF2F2":"#F0FDF4",
                    border:`1px solid ${s.status==="active"?"#FECACA":"#86EFAC"}`,
                    color:s.status==="active"?"#DC2626":"#16A34A",
                    borderRadius:"7px",padding:"6px 12px",fontSize:"12px",cursor:"pointer",fontWeight:600}}>
                  {s.status==="active"?"Suspend":"Reactivate"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // 
  // CREATE / EDIT FORM
  // 
  if (mode === "create" || mode === "edit") return (
    <div style={{display:"flex",flexDirection:"column",gap:"20px"}}>
      <div style={{display:"flex",alignItems:"center",gap:"12px"}}>
        <button onClick={back}
          style={{background:"#F5F5F5",border:"1.5px solid #E5E5E5",color:"#525252",
            borderRadius:"8px",padding:"8px 16px",fontSize:"13px",cursor:"pointer",fontWeight:600}}>
           Back
        </button>
        <div>
          <h2 style={{fontFamily:"var(--font-display)",fontSize:"1.4rem",
            letterSpacing:"0.05em",color:"#1A1A1A",margin:0}}>
            {mode==="create"?"Add New Staff Member":"Edit Staff Member"}
          </h2>
          {mode==="edit" && selected &&
            <p style={{fontSize:"13px",color:"#888",margin:"3px 0 0"}}>
              Editing: {selected.fullName}
            </p>}
        </div>
      </div>

      <Msg/>

      <div style={{background:"#EFF6FF",border:"1px solid #BFDBFE",borderRadius:"8px",
        padding:"12px 16px",fontSize:"13px",color:"#1D4ED8",lineHeight:1.6}}>
        <strong>How it works:</strong> Everything this staff member does is recorded under your dealership.
        Customers and partners always see your dealer name  only you see who on your team did each action.
      </div>

      <form onSubmit={mode==="create"?submitCreate:submitEdit}
        style={{display:"flex",flexDirection:"column",gap:"0"}}>

        {/* Personal details */}
        <div style={{background:"#fff",border:"1.5px solid #E5E5E5",borderRadius:"12px",
          overflow:"hidden",marginBottom:"16px"}}>
          <div style={{padding:"12px 20px",background:"#1A1A1A",fontFamily:"var(--font-display)",
            fontSize:"11px",letterSpacing:"0.12em",color:"#F47B20",fontWeight:700}}>
            PERSONAL DETAILS
          </div>
          <div style={{padding:"20px"}}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 16px"}}>

              <div style={FIELD}>
                <label htmlFor="sf-name" style={LBL}>Full Name *</label>
                <input id="sf-name" type="text" style={INP} required
                  value={fName} placeholder="Full name"
                  onChange={e => setFName(e.target.value)}/>
              </div>

              <div style={FIELD}>
                <label htmlFor="sf-email" style={LBL}>Email Address *</label>
                {mode==="create"
                  ? <input id="sf-email" type="email" style={INP} required
                      value={fEmail} placeholder="Login email"
                      onChange={e => setFEmail(e.target.value)}/>
                  : <div style={{...INP,color:"#A3A3A3",background:"#F9F9F9",marginTop:"5px"}}>{fEmail}</div>
                }
              </div>

              <div style={FIELD}>
                <label htmlFor="sf-phone" style={LBL}>Phone Number *</label>
                <input id="sf-phone" type="tel" style={INP} required
                  value={fPhone} placeholder="e.g. 0801 234 5678"
                  onChange={e => setFPhone(e.target.value)}/>
              </div>

              <div style={FIELD}>
                <label htmlFor="sf-wa" style={LBL}>WhatsApp Number</label>
                <input id="sf-wa" type="tel" style={INP}
                  value={fWa} placeholder="WhatsApp (if different)"
                  onChange={e => setFWa(e.target.value)}/>
              </div>

              <div style={FIELD}>
                <label htmlFor="sf-pos" style={LBL}>Job Title / Position *</label>
                <input id="sf-pos" type="text" style={INP} required
                  value={fPos} placeholder="e.g. Sales Executive"
                  onChange={e => setFPos(e.target.value)}/>
              </div>

              {mode==="create" &&
                <div style={FIELD}>
                  <label htmlFor="sf-pw" style={LBL}>Password</label>
                  <PasswordInput id="sf-pw" style={INP}
                    value={fPw} placeholder="Blank = Staff@1234"
                    onChange={e => setFPw(e.target.value)}/>
                </div>
              }

              <div style={{...FIELD, gridColumn:"1 / -1"}}>
                <label htmlFor="sf-addr" style={LBL}>Address</label>
                <input id="sf-addr" type="text" style={INP}
                  value={fAddr} placeholder="Street, City, State"
                  onChange={e => setFAddr(e.target.value)}/>
              </div>

            </div>
          </div>
        </div>

        {/* Permissions */}
        <div style={{background:"#fff",border:"1.5px solid #E5E5E5",borderRadius:"12px",
          overflow:"hidden",marginBottom:"16px"}}>
          <div style={{padding:"12px 20px",background:"#1A1A1A",fontFamily:"var(--font-display)",
            fontSize:"11px",letterSpacing:"0.12em",color:"#F47B20",fontWeight:700}}>
            ACCESS PERMISSIONS
          </div>
          <div style={{padding:"20px"}}>
            {renderPerms()}
          </div>
        </div>

        {/* Submit buttons */}
        <div style={{display:"flex",gap:"12px"}}>
          <button type="button" onClick={back}
            style={{flex:1,background:"#F5F5F5",border:"1.5px solid #E5E5E5",
              color:"#525252",borderRadius:"10px",padding:"14px",
              fontSize:"15px",cursor:"pointer"}}>
            Cancel
          </button>
          <button type="submit" disabled={saving}
            style={{flex:2,background:saving?"#D4D4D4":"#F47B20",color:"#fff",
              border:"none",borderRadius:"10px",padding:"14px",
              fontFamily:"var(--font-display)",fontSize:"15px",letterSpacing:"0.1em",
              cursor:saving?"not-allowed":"pointer",fontWeight:700}}>
            {saving?"Saving...":(mode==="create"?"CREATE STAFF ACCOUNT":"SAVE CHANGES")}
          </button>
        </div>
      </form>
    </div>
  );

  // 
  // VIEW DETAIL
  // 
  if (mode === "view" && selected) return (
    <div style={{display:"flex",flexDirection:"column",gap:"20px"}}>
      <div style={{display:"flex",alignItems:"center",gap:"12px"}}>
        <button onClick={back}
          style={{background:"#F5F5F5",border:"1.5px solid #E5E5E5",color:"#525252",
            borderRadius:"8px",padding:"8px 16px",fontSize:"13px",cursor:"pointer",fontWeight:600}}>
           Back
        </button>
        <h2 style={{fontFamily:"var(--font-display)",fontSize:"1.4rem",
          letterSpacing:"0.05em",color:"#1A1A1A",margin:0}}>Staff Details</h2>
      </div>

      <div style={{background:"#fff",border:"1.5px solid #E5E5E5",borderRadius:"12px",padding:"24px"}}>
        <div style={{display:"flex",gap:"16px",alignItems:"center",marginBottom:"20px",
          paddingBottom:"20px",borderBottom:"1px solid #F0F0F0"}}>
          <div style={{width:"64px",height:"64px",borderRadius:"50%",flexShrink:0,
            background:"#FFF7ED",border:"2px solid #F47B20",overflow:"hidden",
            display:"flex",alignItems:"center",justifyContent:"center",
            fontSize:"24px",color:"#F47B20",fontFamily:"var(--font-display)"}}>
            {selected.profilePicture
              ? <img src={selected.profilePicture} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
              : selected.fullName?.charAt(0)?.toUpperCase()}
          </div>
          <div style={{flex:1}}>
            <div style={{fontSize:"18px",fontWeight:700,color:"#1A1A1A"}}>{selected.fullName}</div>
            <div style={{fontSize:"13px",color:"#737373",marginTop:"2px"}}>
              {selected.position}  {selected.email}
            </div>
            <span style={{display:"inline-block",marginTop:"6px",
              background:selected.status==="active"?"#F0FDF4":"#FEF2F2",
              color:selected.status==="active"?"#16A34A":"#DC2626",
              borderRadius:"20px",padding:"3px 10px",fontSize:"11px",fontWeight:700}}>
              {selected.status}
            </span>
          </div>
          <div style={{display:"flex",gap:"8px",flexWrap:"wrap" as const}}>
            <button onClick={()=>openEdit(selected)}
              style={{background:"#F47B20",color:"#fff",border:"none",borderRadius:"8px",
                padding:"8px 16px",fontFamily:"var(--font-display)",
                fontSize:"13px",cursor:"pointer",fontWeight:700}}>
              Edit
            </button>
            <button onClick={()=>{back();toggleSuspend(selected);}}
              style={{background:selected.status==="active"?"#FEF2F2":"#F0FDF4",
                border:`1px solid ${selected.status==="active"?"#FECACA":"#86EFAC"}`,
                color:selected.status==="active"?"#DC2626":"#16A34A",
                borderRadius:"8px",padding:"8px 16px",fontSize:"13px",cursor:"pointer",fontWeight:600}}>
              {selected.status==="active"?"Suspend":"Reactivate"}
            </button>
            <button onClick={()=>handleGenerateIdCard(selected)} disabled={idCardBusy}
              style={{background:"#F5F5F5",border:"1px solid #E5E5E5",color:"#525252",
                borderRadius:"8px",padding:"8px 16px",fontSize:"13px",cursor:"pointer",fontWeight:600}}>
              {idCardBusy?"Generating…":"ID Card"}
            </button>
            <button onClick={()=>setShowDeleteConfirm(true)}
              style={{background:"#FEF2F2",border:"1px solid #FECACA",color:"#DC2626",
                borderRadius:"8px",padding:"8px 16px",fontSize:"13px",cursor:"pointer",fontWeight:600}}>
              Delete
            </button>
          </div>
        </div>

        {showDeleteConfirm && (
          <div style={{background:"#FEF2F2",border:"1.5px solid #FECACA",borderRadius:"10px",padding:"14px 16px",marginBottom:"20px"}}>
            <div style={{fontSize:"14px",fontWeight:700,color:"#DC2626",marginBottom:"4px"}}>Remove {selected.fullName}?</div>
            <p style={{fontSize:"12.5px",color:"#7F1D1D",lineHeight:1.5,margin:"0 0 12px"}}>
              This removes their account, login access, and their own notifications. Cars, sales, expenses, and other records they logged for your dealership stay exactly as they are.
            </p>
            <div style={{display:"flex",gap:"8px"}}>
              <button onClick={()=>handleDeleteStaff(selected)} disabled={deleting}
                style={{background:"#DC2626",color:"#fff",border:"none",borderRadius:"7px",padding:"8px 16px",fontSize:"13px",cursor:"pointer",fontWeight:700}}>
                {deleting?"Removing…":"Yes, Remove Staff"}
              </button>
              <button onClick={()=>setShowDeleteConfirm(false)}
                style={{background:"#fff",border:"1px solid #E5E5E5",color:"#525252",borderRadius:"7px",padding:"8px 16px",fontSize:"13px",cursor:"pointer",fontWeight:600}}>
                Cancel
              </button>
            </div>
          </div>
        )}

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px",marginBottom:"20px"}}>
          {[["Phone",selected.phone],["WhatsApp",selected.whatsapp],
            ["Staff ID",selected.staffId],["Joined",fmtDate(selected.createdAt)],
            ["Address",selected.address]].filter(([,v])=>v).map(([l,v])=>(
            <div key={l as string} style={{background:"#FAFAFA",border:"1px solid #F0F0F0",
              borderRadius:"8px",padding:"12px"}}>
              <div style={{fontSize:"10px",fontWeight:700,letterSpacing:"0.1em",
                textTransform:"uppercase" as const,color:"#A3A3A3",marginBottom:"4px"}}>{l}</div>
              <div style={{fontSize:"14px",color:"#1A1A1A",fontWeight:500}}>{v}</div>
            </div>
          ))}
        </div>

        <div style={{fontSize:"11px",fontWeight:700,letterSpacing:"0.12em",
          textTransform:"uppercase" as const,color:"#737373",marginBottom:"12px"}}>
          Permissions ({(selected.permissions||[]).length} of {ALL_PERMS.length})
        </div>
        {PERM_GROUPS.map(g => {
          const granted = (selected.permissions||[]).filter((p:string)=>g.perms.map(x=>x.id).includes(p));
          if (!granted.length) return null;
          return (
            <div key={g.group} style={{marginBottom:"10px"}}>
              <div style={{fontSize:"11px",fontWeight:700,color:g.color,marginBottom:"5px"}}>{g.group}</div>
              <div style={{display:"flex",gap:"5px",flexWrap:"wrap"}}>
                {granted.map((pid:string) => {
                  const pm = g.perms.find(x=>x.id===pid);
                  return <span key={pid} style={{background:`${g.color}15`,color:g.color,
                    borderRadius:"20px",padding:"3px 10px",fontSize:"12px",fontWeight:600}}>
                    {pm?.label||pid}
                  </span>;
                })}
              </div>
            </div>
          );
        })}
        {!(selected.permissions||[]).length &&
          <p style={{color:"#A3A3A3",fontSize:"14px"}}>No permissions assigned yet.</p>}
      </div>
    </div>
  );

  return null;
}
