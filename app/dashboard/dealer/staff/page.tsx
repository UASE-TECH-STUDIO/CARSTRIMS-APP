"use client";
import { useEffect, useState, useRef } from "react";
import api from "@/lib/api";

// ALL permissions grouped by section
const PERM_GROUPS = [
  {
    group: "Inventory",
    color: "#F47B20",
    perms: [
      { id:"view_inventory",  label:"View Inventory",   desc:"Can see all cars in the dealership" },
      { id:"add_cars",        label:"Add Vehicles",      desc:"Can add new cars to inventory" },
      { id:"edit_cars",       label:"Edit Vehicles",     desc:"Can edit car details and photos" },
      { id:"delete_cars",     label:"Delete Vehicles",   desc:"Can delete cars from inventory" },
    ],
  },
  {
    group: "Sales",
    color: "#16A34A",
    perms: [
      { id:"view_sales",      label:"View Sales",        desc:"Can see all sales records" },
      { id:"record_sales",    label:"Record Sales",      desc:"Can record new vehicle sales" },
    ],
  },
  {
    group: "Documents",
    color: "#3B8BD4",
    perms: [
      { id:"view_invoices",   label:"View Invoices & Receipts",  desc:"Can view generated documents" },
      { id:"generate_invoices",label:"Generate Invoices/Receipts", desc:"Can generate and print documents" },
      { id:"edit_documents",  label:"Edit Documents",    desc:"Can edit fields before printing" },
    ],
  },
  {
    group: "Reports",
    color: "#7B68EE",
    perms: [
      { id:"view_reports",    label:"View Reports",      desc:"Can see financial reports" },
      { id:"generate_reports",label:"Generate Reports",  desc:"Can generate and download reports" },
    ],
  },
  {
    group: "Appointments",
    color: "#D97706",
    perms: [
      { id:"view_appointments",   label:"View Appointments",   desc:"Can see all appointments" },
      { id:"manage_appointments", label:"Manage Appointments", desc:"Can confirm/decline appointments" },
    ],
  },
  {
    group: "Requests",
    color: "#EC4899",
    perms: [
      { id:"view_requests",   label:"View Requests",    desc:"Can see customer vehicle requests" },
      { id:"manage_requests", label:"Manage Requests",  desc:"Can respond to vehicle requests" },
    ],
  },
  {
    group: "Expenses",
    color: "#DC2626",
    perms: [
      { id:"view_expenses",   label:"View Expenses",    desc:"Can see expense records" },
      { id:"manage_expenses", label:"Manage Expenses",  desc:"Can add and edit expenses" },
    ],
  },
  {
    group: "Movements",
    color: "#0891B2",
    perms: [
      { id:"view_movements",   label:"View Movements",  desc:"Can see vehicle movement logs" },
      { id:"manage_movements", label:"Log Movements",   desc:"Can log and request movements" },
    ],
  },
  {
    group: "Partners",
    color: "#8B5CF6",
    perms: [
      { id:"view_partners",   label:"View Partners",    desc:"Can see partner information" },
      { id:"manage_partners", label:"Manage Partners",  desc:"Can approve/reject partners and assign cars" },
    ],
  },
  {
    group: "CCTV",
    color: "#525252",
    perms: [
      { id:"view_cctv",       label:"View CCTV",        desc:"Can access CCTV section" },
    ],
  },
  {
    group: "Staff Management",
    color: "#1A1A1A",
    perms: [
      { id:"view_staff",      label:"View Staff",       desc:"Can see staff list" },
      { id:"create_staff",    label:"Create Staff",     desc:"Can create new staff accounts" },
      { id:"edit_staff",      label:"Edit Staff",       desc:"Can edit staff details" },
      { id:"suspend_staff",   label:"Suspend Staff",    desc:"Can suspend/reactivate staff" },
    ],
  },
];

// Preset role templates
const PRESETS = [
  { label:"Sales Agent",    perms:["view_inventory","view_sales","record_sales","view_invoices","generate_invoices","view_appointments","manage_appointments"] },
  { label:"Car Manager",    perms:["view_inventory","add_cars","edit_cars","delete_cars","view_sales","view_reports"] },
  { label:"Full Access",    perms:PERM_GROUPS.flatMap(g=>g.perms.map(p=>p.id)) },
  { label:"View Only",      perms:["view_inventory","view_sales","view_reports","view_appointments","view_requests","view_movements","view_partners"] },
  { label:"Receptionist",   perms:["view_inventory","view_appointments","manage_appointments","view_requests","view_invoices","generate_invoices"] },
];

const emptyForm = {
  fullName:"", email:"", phone:"", whatsapp:"", position:"", address:"",
  password:"", permissions:[] as string[],
};

export default function StaffManagementPage() {
  const [staff,    setStaff]    = useState<any[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [showNew,  setShowNew]  = useState(false);
  const [editing,  setEditing]  = useState<any>(null);
  const [viewing,  setViewing]  = useState<any>(null);
  const [form,     setForm]     = useState({...emptyForm});
  const [saving,   setSaving]   = useState(false);
  const [msg,      setMsg]      = useState("");
  const [search,   setSearch]   = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const r = await api.get("/api/v1/staff/");
      setStaff(r.data.staff || r.data || []);
    } catch {} finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const togglePerm = (id: string) => {
    setForm(f => ({
      ...f,
      permissions: f.permissions.includes(id)
        ? f.permissions.filter(p => p !== id)
        : [...f.permissions, id],
    }));
  };

  const applyPreset = (perms: string[]) => {
    setForm(f => ({ ...f, permissions: perms }));
  };

  const selectAll = () => setForm(f => ({ ...f, permissions: PERM_GROUPS.flatMap(g => g.perms.map(p => p.id)) }));
  const clearAll  = () => setForm(f => ({ ...f, permissions: [] }));

  const submitNew = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true); setMsg("");
    try {
      await api.post("/api/v1/staff/", {
        ...form,
        password: form.password || "Staff@1234",
      });
      setMsg("Staff account created! They can now log in.");
      setShowNew(false); setForm({...emptyForm}); load();
    } catch(err:any) { setMsg("Error: " + (err.response?.data?.detail || "Failed")); }
    finally { setSaving(false); }
  };

  const submitEdit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true); setMsg("");
    try {
      await api.patch(`/api/v1/staff/${editing._id || editing.staffId}`, {
        fullName: form.fullName, phone: form.phone,
        whatsapp: form.whatsapp, position: form.position, address: form.address,
      });
      await api.patch(`/api/v1/staff/${editing._id || editing.staffId}/permissions`, {
        permissions: form.permissions,
      });
      setMsg("Staff updated successfully.");
      setEditing(null); setForm({...emptyForm}); load();
    } catch(err:any) { setMsg("Error: " + (err.response?.data?.detail || "Failed")); }
    finally { setSaving(false); }
  };

  const toggleSuspend = async (s: any) => {
    if (!confirm(`${s.status === "active" ? "Suspend" : "Reactivate"} ${s.fullName}?`)) return;
    try {
      await api.post(`/api/v1/staff/${s._id || s.staffId}/toggle-suspend`);
      load();
    } catch(e:any) { alert(e.response?.data?.detail || "Failed"); }
  };

  const openEdit = (s: any) => {
    setEditing(s);
    setForm({ ...emptyForm, fullName:s.fullName||"", phone:s.phone||"", whatsapp:s.whatsapp||"",
              position:s.position||"", address:s.address||"", email:s.email||"",
              permissions:s.permissions||[], password:"" });
    setMsg("");
  };

  const filtered = staff.filter(s =>
    !search || s.fullName?.toLowerCase().includes(search.toLowerCase()) ||
    s.email?.toLowerCase().includes(search.toLowerCase()) ||
    s.position?.toLowerCase().includes(search.toLowerCase())
  );

  const fmtDate = (iso:any) => iso ? new Date(iso).toLocaleDateString("en-NG",{day:"numeric",month:"short",year:"numeric"}) : "";

  const fi: React.CSSProperties = { width:"100%",background:"#F5F5F5",border:"1.5px solid #E5E5E5",borderRadius:"8px",padding:"0.65rem 0.875rem",fontSize:"0.875rem",fontFamily:"var(--font-body)",outline:"none",boxSizing:"border-box" };
  const lbl: React.CSSProperties = { fontSize:"0.68rem",fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase" as const,color:"#525252",display:"block",marginBottom:"0.3rem" };

  // Permission form section
  const PermForm = () => (
    <div style={{display:"flex",flexDirection:"column",gap:"0.875rem"}}>
      {/* Presets */}
      <div>
        <label style={lbl}>Quick Role Presets</label>
        <div style={{display:"flex",gap:"0.375rem",flexWrap:"wrap"}}>
          {PRESETS.map(p=>(
            <button key={p.label} type="button" onClick={()=>applyPreset(p.perms)}
              style={{background:"#F5F5F5",border:"1.5px solid #E5E5E5",color:"#525252",borderRadius:"20px",padding:"0.3rem 0.75rem",fontSize:"0.72rem",cursor:"pointer",fontWeight:600,transition:"all 0.15s"}}
              onMouseOver={e=>{(e.currentTarget as HTMLElement).style.borderColor="#F47B20";(e.currentTarget as HTMLElement).style.color="#F47B20";}}
              onMouseOut={e=>{(e.currentTarget as HTMLElement).style.borderColor="#E5E5E5";(e.currentTarget as HTMLElement).style.color="#525252";}}>
              {p.label}
            </button>
          ))}
          <button type="button" onClick={selectAll} style={{background:"#1A1A1A",color:"#fff",border:"none",borderRadius:"20px",padding:"0.3rem 0.75rem",fontSize:"0.72rem",cursor:"pointer",fontWeight:700}}>All</button>
          <button type="button" onClick={clearAll} style={{background:"#FEF2F2",color:"#DC2626",border:"1px solid #FECACA",borderRadius:"20px",padding:"0.3rem 0.75rem",fontSize:"0.72rem",cursor:"pointer",fontWeight:600}}>Clear</button>
        </div>
      </div>

      {/* Permission groups */}
      {PERM_GROUPS.map(group=>(
        <div key={group.group} style={{border:"1.5px solid #E5E5E5",borderRadius:"10px",overflow:"hidden"}}>
          <div style={{padding:"0.6rem 0.875rem",background:"#F5F5F5",display:"flex",alignItems:"center",gap:"0.5rem",borderBottom:"1px solid #E5E5E5"}}>
            <div style={{width:"8px",height:"8px",borderRadius:"50%",background:group.color,flexShrink:0}}/>
            <span style={{fontFamily:"var(--font-display)",fontSize:"0.7rem",letterSpacing:"0.1em",color:"#1A1A1A",fontWeight:700}}>{group.group.toUpperCase()}</span>
            <span style={{fontSize:"0.65rem",color:"#A3A3A3",marginLeft:"auto"}}>
              {form.permissions.filter(p=>group.perms.map(x=>x.id).includes(p)).length}/{group.perms.length} selected
            </span>
          </div>
          <div style={{padding:"0.625rem",display:"flex",flexDirection:"column",gap:"0.375rem"}}>
            {group.perms.map(perm=>{
              const checked = form.permissions.includes(perm.id);
              return (
                <label key={perm.id} onClick={()=>togglePerm(perm.id)}
                  style={{display:"flex",alignItems:"flex-start",gap:"0.625rem",padding:"0.5rem 0.625rem",borderRadius:"7px",cursor:"pointer",background:checked?`${group.color}0F`:"transparent",border:`1px solid ${checked?group.color+"44":"transparent"}`,transition:"all 0.15s"}}>
                  <div style={{width:"18px",height:"18px",borderRadius:"4px",border:`2px solid ${checked?group.color:"#D4D4D4"}`,background:checked?group.color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:"1px",transition:"all 0.15s"}}>
                    {checked&&<svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                  </div>
                  <div>
                    <div style={{fontSize:"0.825rem",fontWeight:checked?700:400,color:checked?"#1A1A1A":"#525252"}}>{perm.label}</div>
                    <div style={{fontSize:"0.68rem",color:"#A3A3A3",marginTop:"1px"}}>{perm.desc}</div>
                  </div>
                </label>
              );
            })}
          </div>
        </div>
      ))}

      <div style={{background:"#F0FDF4",border:"1px solid #86EFAC",borderRadius:"8px",padding:"0.625rem 0.875rem",fontSize:"0.78rem",color:"#15803D",fontWeight:600}}>
        {form.permissions.length} permission{form.permissions.length!==1?"s":""} selected
      </div>
    </div>
  );

  return (
    <div style={{display:"flex",flexDirection:"column",gap:"1.5rem"}}>

      {/* Header */}
      <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",flexWrap:"wrap",gap:"0.75rem"}}>
        <div>
          <h2 style={{fontFamily:"var(--font-display)",fontSize:"1.5rem",letterSpacing:"0.05em",color:"#1A1A1A",lineHeight:1}}>Staff Management</h2>
          <p style={{fontSize:"0.8rem",color:"#888",marginTop:"0.3rem"}}>{staff.length} staff member{staff.length!==1?"s":""} in your team</p>
        </div>
        <button onClick={()=>{setShowNew(true);setMsg("");setForm({...emptyForm});}}
          style={{background:"#F47B20",color:"#fff",border:"none",borderRadius:"8px",padding:"0.7rem 1.25rem",fontFamily:"var(--font-display)",fontSize:"0.875rem",letterSpacing:"0.08em",cursor:"pointer"}}>
          + Add Staff Member
        </button>
      </div>

      {msg&&<div style={{background:msg.startsWith("Error")?"#FEF2F2":"#F0FDF4",border:"1px solid",borderColor:msg.startsWith("Error")?"#FECACA":"#86EFAC",borderRadius:"8px",padding:"0.75rem 1rem",fontSize:"0.85rem",color:msg.startsWith("Error")?"#DC2626":"#15803D",fontWeight:600}}>{msg}</div>}

      {/* Search */}
      <input placeholder="Search staff by name, email or position..."
        value={search} onChange={e=>setSearch(e.target.value)}
        style={{...fi,padding:"0.75rem 1rem",fontSize:"0.9rem"}}/>

      {/* Staff list */}
      {loading?(
        <div style={{display:"flex",justifyContent:"center",padding:"3rem"}}>
          <div style={{width:"28px",height:"28px",border:"2.5px solid #E5E5E5",borderTopColor:"#F47B20",borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      ):filtered.length===0?(
        <div style={{padding:"3rem",textAlign:"center",border:"1.5px dashed #E5E5E5",borderRadius:"12px",background:"#fff"}}>
          <div style={{fontSize:"2.5rem",marginBottom:"0.75rem"}}>&#x1F465;</div>
          <h3 style={{fontFamily:"var(--font-display)",fontSize:"1.1rem",color:"#1A1A1A"}}>No staff yet</h3>
          <p style={{color:"#888",fontSize:"0.875rem",marginTop:"0.5rem"}}>Add your first staff member to start delegating work</p>
        </div>
      ):(
        <div style={{display:"flex",flexDirection:"column",gap:"0.875rem"}}>
          {filtered.map(s=>(
            <div key={s._id||s.staffId} style={{background:"#fff",border:"1.5px solid #E5E5E5",borderRadius:"12px",padding:"1rem 1.25rem",display:"flex",alignItems:"flex-start",gap:"1rem",flexWrap:"wrap"}}>

              {/* Avatar */}
              <div style={{width:"48px",height:"48px",borderRadius:"50%",background:"#FFF7ED",border:"2px solid #F47B20",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"1.2rem",color:"#F47B20",flexShrink:0,overflow:"hidden"}}>
                {s.profilePicture?<img src={s.profilePicture} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                  :<span style={{fontFamily:"var(--font-display)"}}>{s.fullName?.charAt(0)?.toUpperCase()||"S"}</span>
                }
              </div>

              {/* Info */}
              <div style={{flex:1,minWidth:"160px"}}>
                <div style={{display:"flex",alignItems:"center",gap:"0.5rem",flexWrap:"wrap",marginBottom:"0.25rem"}}>
                  <span style={{fontWeight:700,fontSize:"0.95rem",color:"#1A1A1A"}}>{s.fullName}</span>
                  <span style={{background:s.status==="active"?"#F0FDF4":"#FEF2F2",color:s.status==="active"?"#16A34A":"#DC2626",border:`1px solid ${s.status==="active"?"#86EFAC":"#FECACA"}`,borderRadius:"20px",padding:"0.12rem 0.5rem",fontSize:"0.67rem",fontWeight:700}}>
                    {s.status}
                  </span>
                </div>
                <div style={{fontSize:"0.78rem",color:"#737373"}}>{s.position} &bull; {s.email}</div>
                <div style={{fontSize:"0.72rem",color:"#A3A3A3",marginTop:"0.15rem"}}>{s.phone} &bull; Joined {fmtDate(s.createdAt)}</div>
                {/* Permission badges */}
                <div style={{display:"flex",gap:"0.25rem",flexWrap:"wrap",marginTop:"0.5rem"}}>
                  {PERM_GROUPS.map(g=>{
                    const count = (s.permissions||[]).filter((p:string)=>g.perms.map(x=>x.id).includes(p)).length;
                    if (count===0) return null;
                    return <span key={g.group} style={{background:`${g.color}15`,color:g.color,border:`1px solid ${g.color}33`,borderRadius:"20px",padding:"0.1rem 0.45rem",fontSize:"0.63rem",fontWeight:600}}>{g.group} ({count})</span>;
                  })}
                  {(s.permissions||[]).length===0&&<span style={{fontSize:"0.7rem",color:"#A3A3A3",fontStyle:"italic"}}>No permissions assigned</span>}
                </div>
              </div>

              {/* Actions */}
              <div style={{display:"flex",gap:"0.375rem",flexShrink:0,flexWrap:"wrap"}}>
                <button onClick={()=>setViewing(s)} style={{background:"#F5F5F5",border:"1.5px solid #E5E5E5",color:"#525252",borderRadius:"7px",padding:"0.4rem 0.75rem",fontSize:"0.75rem",cursor:"pointer",fontWeight:600}}>View</button>
                <button onClick={()=>openEdit(s)} style={{background:"#FFF7ED",border:"1.5px solid rgba(244,123,32,0.3)",color:"#C4621A",borderRadius:"7px",padding:"0.4rem 0.75rem",fontSize:"0.75rem",cursor:"pointer",fontWeight:600}}>Edit</button>
                <button onClick={()=>toggleSuspend(s)} style={{background:s.status==="active"?"#FEF2F2":"#F0FDF4",border:`1px solid ${s.status==="active"?"#FECACA":"#86EFAC"}`,color:s.status==="active"?"#DC2626":"#16A34A",borderRadius:"7px",padding:"0.4rem 0.75rem",fontSize:"0.75rem",cursor:"pointer",fontWeight:600}}>
                  {s.status==="active"?"Suspend":"Reactivate"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/*  ADD/EDIT MODAL  */}
      {(showNew||editing)&&(
        <div onClick={()=>{setShowNew(false);setEditing(null);setMsg("");}} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",display:"flex",alignItems:"flex-end",justifyContent:"center",zIndex:1000}}>
          <div onClick={e=>e.stopPropagation()} style={{background:"#F0F0F0",width:"100%",maxWidth:"700px",height:"95vh",borderRadius:"16px 16px 0 0",overflow:"hidden",display:"flex",flexDirection:"column"}}>

            <div style={{padding:"1rem 1.25rem",background:"#1A1A1A",flexShrink:0}}>
              <div style={{fontFamily:"var(--font-display)",fontSize:"0.9rem",letterSpacing:"0.08em",color:"#F47B20"}}>
                {editing?"EDIT STAFF MEMBER":"ADD NEW STAFF MEMBER"}
              </div>
              <div style={{fontSize:"0.72rem",color:"rgba(255,255,255,0.5)",marginTop:"0.15rem"}}>
                {editing?"Update details and permissions":"Create login credentials and set access permissions"}
              </div>
            </div>

            <form onSubmit={editing?submitEdit:submitNew} style={{overflowY:"auto",flex:1,padding:"1.25rem",display:"flex",flexDirection:"column",gap:"1rem"}}>

              {msg&&<div style={{background:msg.startsWith("Error")?"#FEF2F2":"#F0FDF4",border:"1px solid",borderColor:msg.startsWith("Error")?"#FECACA":"#86EFAC",borderRadius:"8px",padding:"0.75rem 1rem",fontSize:"0.85rem",color:msg.startsWith("Error")?"#DC2626":"#15803D",fontWeight:600}}>{msg}</div>}

              {/* Personal Details */}
              <div style={{background:"#fff",borderRadius:"10px",border:"1px solid #E5E5E5",overflow:"hidden"}}>
                <div style={{padding:"0.75rem 1rem",background:"#1A1A1A",fontFamily:"var(--font-display)",fontSize:"0.7rem",letterSpacing:"0.12em",color:"#F47B20",fontWeight:700}}>PERSONAL DETAILS</div>
                <div style={{padding:"1rem",display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0.875rem"}}>
                  <div><label style={lbl} htmlFor="sf-name">Full Name *</label>
                    <input id="sf-name" style={fi} value={form.fullName} onChange={e=>setForm({...form,fullName:e.target.value})} placeholder="Full name" required/>
                  </div>
                  {!editing&&<div><label style={lbl} htmlFor="sf-email">Email *</label>
                    <input id="sf-email" type="email" style={fi} value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder="Login email" required/>
                  </div>}
                  {editing&&<div><label style={lbl}>Email</label><div style={{...fi,color:"#A3A3A3",cursor:"not-allowed",background:"#FAFAFA"}}>{form.email}</div></div>}
                  <div><label style={lbl} htmlFor="sf-phone">Phone *</label>
                    <input id="sf-phone" style={fi} value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} placeholder="Phone number" required/>
                  </div>
                  <div><label style={lbl} htmlFor="sf-wa">WhatsApp</label>
                    <input id="sf-wa" style={fi} value={form.whatsapp} onChange={e=>setForm({...form,whatsapp:e.target.value})} placeholder="WhatsApp number"/>
                  </div>
                  <div><label style={lbl} htmlFor="sf-pos">Position / Title *</label>
                    <input id="sf-pos" style={fi} value={form.position} onChange={e=>setForm({...form,position:e.target.value})} placeholder="e.g. Sales Executive" required/>
                  </div>
                  {!editing&&<div><label style={lbl} htmlFor="sf-pw">Password</label>
                    <input id="sf-pw" type="password" style={fi} value={form.password} onChange={e=>setForm({...form,password:e.target.value})} placeholder="Leave blank for Staff@1234"/>
                  </div>}
                  <div style={{gridColumn:"1/-1"}}><label style={lbl} htmlFor="sf-addr">Address</label>
                    <input id="sf-addr" style={fi} value={form.address} onChange={e=>setForm({...form,address:e.target.value})} placeholder="Home address"/>
                  </div>
                </div>
              </div>

              {/* Permissions */}
              <div style={{background:"#fff",borderRadius:"10px",border:"1px solid #E5E5E5",overflow:"hidden"}}>
                <div style={{padding:"0.75rem 1rem",background:"#1A1A1A",fontFamily:"var(--font-display)",fontSize:"0.7rem",letterSpacing:"0.12em",color:"#F47B20",fontWeight:700}}>ACCESS PERMISSIONS</div>
                <div style={{padding:"1rem"}}>
                  <PermForm/>
                </div>
              </div>

              {/* Submit */}
              <div style={{display:"flex",gap:"0.75rem",position:"sticky",bottom:0,background:"#F0F0F0",paddingTop:"0.5rem",paddingBottom:"0.25rem"}}>
                <button type="button" onClick={()=>{setShowNew(false);setEditing(null);setMsg("");}}
                  style={{flex:1,background:"#F5F5F5",border:"1.5px solid #E5E5E5",color:"#525252",borderRadius:"10px",padding:"0.875rem",fontSize:"0.9rem",cursor:"pointer"}}>
                  Cancel
                </button>
                <button type="submit" disabled={saving}
                  style={{flex:2,background:saving?"#D4D4D4":"#F47B20",color:"#fff",border:"none",borderRadius:"10px",padding:"0.875rem",fontFamily:"var(--font-display)",fontSize:"0.95rem",letterSpacing:"0.1em",cursor:saving?"not-allowed":"pointer",fontWeight:700}}>
                  {saving?"Saving...":(editing?"SAVE CHANGES":"CREATE STAFF ACCOUNT")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/*  VIEW DETAIL MODAL  */}
      {viewing&&(
        <div onClick={()=>setViewing(null)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:"1rem"}}>
          <div onClick={e=>e.stopPropagation()} style={{background:"#fff",borderRadius:"14px",width:"100%",maxWidth:"560px",maxHeight:"90vh",overflow:"hidden",display:"flex",flexDirection:"column",boxShadow:"0 20px 60px rgba(0,0,0,0.18)"}}>
            <div style={{padding:"1rem 1.25rem",background:"#1A1A1A",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <div style={{fontFamily:"var(--font-display)",fontSize:"0.9rem",letterSpacing:"0.08em",color:"#F47B20"}}>STAFF DETAILS</div>
              <button onClick={()=>setViewing(null)} style={{background:"rgba(255,255,255,0.15)",border:"none",color:"#fff",borderRadius:"50%",width:"30px",height:"30px",cursor:"pointer",fontSize:"0.875rem"}}>X</button>
            </div>
            <div style={{overflowY:"auto",flex:1,padding:"1.25rem",display:"flex",flexDirection:"column",gap:"1rem"}}>
              {/* Profile */}
              <div style={{display:"flex",gap:"1rem",alignItems:"center"}}>
                <div style={{width:"60px",height:"60px",borderRadius:"50%",background:"#FFF7ED",border:"2px solid #F47B20",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"1.5rem",color:"#F47B20",flexShrink:0,overflow:"hidden"}}>
                  {viewing.profilePicture?<img src={viewing.profilePicture} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                    :<span style={{fontFamily:"var(--font-display)"}}>{viewing.fullName?.charAt(0)?.toUpperCase()}</span>
                  }
                </div>
                <div>
                  <div style={{fontFamily:"var(--font-display)",fontSize:"1.1rem",color:"#1A1A1A"}}>{viewing.fullName}</div>
                  <div style={{fontSize:"0.78rem",color:"#737373"}}>{viewing.position} &bull; {viewing.email}</div>
                  <span style={{background:viewing.status==="active"?"#F0FDF4":"#FEF2F2",color:viewing.status==="active"?"#16A34A":"#DC2626",borderRadius:"20px",padding:"0.15rem 0.625rem",fontSize:"0.7rem",fontWeight:700}}>
                    {viewing.status}
                  </span>
                </div>
              </div>
              {/* Details */}
              {[["Phone",viewing.phone],["WhatsApp",viewing.whatsapp],["Staff ID",viewing.staffId],["Joined",fmtDate(viewing.createdAt)]].map(([l,v])=>v?(
                <div key={l as string} style={{display:"flex",gap:"0.5rem",padding:"0.5rem 0",borderBottom:"1px solid #F5F5F5"}}>
                  <div style={{minWidth:"100px",fontSize:"0.7rem",fontWeight:700,textTransform:"uppercase" as const,letterSpacing:"0.06em",color:"#A3A3A3"}}>{l}</div>
                  <div style={{fontSize:"0.875rem",color:"#1A1A1A"}}>{v}</div>
                </div>
              ):null)}
              {/* Permissions */}
              <div>
                <div style={{fontSize:"0.68rem",fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase" as const,color:"#A3A3A3",marginBottom:"0.75rem"}}>
                  Permissions ({(viewing.permissions||[]).length})
                </div>
                {PERM_GROUPS.map(g=>{
                  const granted = (viewing.permissions||[]).filter((p:string)=>g.perms.map(x=>x.id).includes(p));
                  if (!granted.length) return null;
                  return (
                    <div key={g.group} style={{marginBottom:"0.625rem"}}>
                      <div style={{fontSize:"0.7rem",fontWeight:700,color:g.color,marginBottom:"0.3rem"}}>{g.group}</div>
                      <div style={{display:"flex",gap:"0.25rem",flexWrap:"wrap"}}>
                        {granted.map((p:string)=>{
                          const pm = g.perms.find(x=>x.id===p);
                          return <span key={p} style={{background:`${g.color}15`,color:g.color,borderRadius:"20px",padding:"0.2rem 0.625rem",fontSize:"0.72rem",fontWeight:600}}>{pm?.label||p}</span>;
                        })}
                      </div>
                    </div>
                  );
                })}
                {!(viewing.permissions||[]).length&&<p style={{color:"#A3A3A3",fontSize:"0.85rem"}}>No permissions assigned</p>}
              </div>
              {/* Actions */}
              <div style={{display:"flex",gap:"0.5rem"}}>
                <button onClick={()=>{setViewing(null);openEdit(viewing);}} style={{flex:1,background:"#F47B20",color:"#fff",border:"none",borderRadius:"8px",padding:"0.75rem",fontFamily:"var(--font-display)",fontSize:"0.82rem",cursor:"pointer",fontWeight:700}}>Edit Permissions</button>
                <button onClick={()=>{setViewing(null);toggleSuspend(viewing);}} style={{flex:1,background:viewing.status==="active"?"#FEF2F2":"#F0FDF4",border:`1px solid ${viewing.status==="active"?"#FECACA":"#86EFAC"}`,color:viewing.status==="active"?"#DC2626":"#16A34A",borderRadius:"8px",padding:"0.75rem",fontSize:"0.82rem",cursor:"pointer",fontWeight:600}}>
                  {viewing.status==="active"?"Suspend":"Reactivate"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
