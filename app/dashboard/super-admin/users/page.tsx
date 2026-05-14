"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";

const ROLES = ["all","DEALER_ADMIN","DEALER_STAFF","PARTNER_USER","PUBLIC_USER","SYSTEM_ADMIN"];
const ROLE_COLORS: Record<string,string> = {
  SYSTEM_ADMIN:"#E05252",DEALER_ADMIN:"#C9A84C",DEALER_STAFF:"#1D9E75",
  PARTNER_USER:"#3B8BD4",PUBLIC_USER:"#888",
};
const STATUS_COLORS: Record<string,string> = {
  active:"#16A34A",suspended:"#DC2626",deleted:"#888",pending:"#F47B20",
  awaiting_approval:"#F47B20",rejected:"#888",
};

const genPassword = () => {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$";
  let pw = ""; for (let i=0;i<12;i++) pw+=chars[Math.floor(Math.random()*chars.length)];
  return pw;
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [skip, setSkip] = useState(0);
  const [actionModal, setActionModal] = useState<{type:string;user:any}|null>(null);
  const [actionNote, setActionNote] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [resetResult, setResetResult] = useState<{password:string;user:any}|null>(null);
  const [msg, setMsg] = useState("");
  const LIMIT = 20;

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params: any = { skip, limit:LIMIT };
      if (search) params.search = search;
      if (roleFilter !== "all") params.role = roleFilter;
      const res = await api.get("/api/v1/admin/users", { params });
      setUsers(res.data.users); setTotal(res.data.total);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetchUsers(); }, [search, roleFilter, skip]);

  const showMsg = (text: string) => { setMsg(text); setTimeout(()=>setMsg(""), 5000); };

  const handleAction = async () => {
    if (!actionModal) return;
    setActionLoading(true);
    try {
      const id = actionModal.user._id;
      if (actionModal.type==="suspend") {
        await api.post(`/api/v1/admin/users/${id}/suspend`, { reason: actionNote });
        showMsg(`${actionModal.user.fullName} suspended.`);
      } else if (actionModal.type==="unsuspend") {
        await api.post(`/api/v1/admin/users/${id}/unsuspend`);
        showMsg(`${actionModal.user.fullName} reactivated.`);
      } else if (actionModal.type==="warn") {
        await api.post(`/api/v1/admin/users/${id}/warn`, { reason: actionNote });
        showMsg(`Warning sent to ${actionModal.user.fullName}.`);
      } else if (actionModal.type==="delete") {
        await api.delete(`/api/v1/admin/users/${id}`);
        showMsg(`${actionModal.user.fullName} deleted.`);
      } else if (actionModal.type==="reset") {
        const newPassword = genPassword();
        await api.post(`/api/v1/admin/users/${id}/reset-password`, { newPassword });
        setResetResult({ password:newPassword, user:actionModal.user });
      }
      setActionModal(null); setActionNote("");
      fetchUsers();
    } catch (err:any) {
      showMsg("Action failed: " + (err.response?.data?.detail || "Unknown error"));
    } finally { setActionLoading(false); }
  };

  const fmtDate = (iso: string) => iso ? new Date(iso).toLocaleDateString("en-NG") : "-";

  return (
    <div style={{display:"flex",flexDirection:"column",gap:"1.5rem",fontFamily:"var(--font-body)"}}>
      <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:"1rem",flexWrap:"wrap"}}>
        <div>
          <h2 style={{fontFamily:"var(--font-display)",fontSize:"1.6rem",letterSpacing:"0.05em",color:"#1A1A1A",lineHeight:1}}>All Users</h2>
          <p style={{fontSize:"0.8rem",color:"#737373",marginTop:"0.3rem"}}>{total} registered user{total!==1?"s":""}</p>
        </div>
      </div>

      {msg&&(
        <div style={{background:"#F0FDF4",border:"1px solid #86EFAC",color:"#15803D",padding:"0.75rem 1rem",borderRadius:"8px",fontSize:"0.875rem",display:"flex",justifyContent:"space-between"}}>
          <span>{msg}</span><button onClick={()=>setMsg("")} style={{background:"none",border:"none",color:"inherit",cursor:"pointer"}}>✕</button>
        </div>
      )}

      {/* Reset result modal */}
      {resetResult&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:"1rem"}}>
          <div style={{background:"#fff",borderRadius:"12px",padding:"1.75rem",maxWidth:"440px",width:"100%",display:"flex",flexDirection:"column",gap:"1.25rem",boxShadow:"0 16px 48px rgba(0,0,0,0.2)"}}>
            <h3 style={{fontFamily:"var(--font-display)",fontSize:"1.1rem",color:"#1A1A1A",letterSpacing:"0.08em"}}>PASSWORD RESET</h3>
            <p style={{fontSize:"0.875rem",color:"#737373"}}>New password for <strong>{resetResult.user.fullName}</strong>:</p>
            <div style={{background:"#F5F5F5",border:"1.5px solid #E5E5E5",borderRadius:"8px",padding:"1rem",display:"flex",alignItems:"center",justifyContent:"space-between",gap:"1rem"}}>
              <code style={{fontFamily:"monospace",fontSize:"1.1rem",color:"#1A1A1A",letterSpacing:"0.08em"}}>{resetResult.password}</code>
              <button onClick={()=>{navigator.clipboard.writeText(resetResult.password);alert("Copied!");}} style={{background:"#F47B20",color:"#fff",border:"none",borderRadius:"6px",padding:"0.4rem 0.875rem",fontSize:"0.75rem",cursor:"pointer",whiteSpace:"nowrap"}}>Copy</button>
            </div>
            <p style={{fontSize:"0.78rem",color:"#737373",lineHeight:1.5}}>Share this with the user. They should change it after logging in. A notification has been sent to them.</p>
            <button onClick={()=>setResetResult(null)} style={{background:"#F5F5F5",border:"1.5px solid #E5E5E5",color:"#525252",borderRadius:"8px",padding:"0.75rem",fontSize:"0.875rem",cursor:"pointer"}}>Done</button>
          </div>
        </div>
      )}

      {/* Action modal */}
      {actionModal&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:"1rem"}}>
          <div style={{background:"#fff",borderRadius:"12px",padding:"1.5rem",maxWidth:"440px",width:"100%",display:"flex",flexDirection:"column",gap:"1.25rem",boxShadow:"0 16px 48px rgba(0,0,0,0.2)"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <h3 style={{fontFamily:"var(--font-display)",fontSize:"1rem",letterSpacing:"0.08em",color:"#1A1A1A"}}>
                {actionModal.type==="suspend"?"⛔ SUSPEND USER":actionModal.type==="unsuspend"?"✅ REACTIVATE USER":actionModal.type==="warn"?"⚠️ WARN USER":actionModal.type==="delete"?"🗑 DELETE USER":"🔑 RESET PASSWORD"}
              </h3>
              <button onClick={()=>setActionModal(null)} style={{background:"none",border:"none",cursor:"pointer",fontSize:"1rem",color:"#737373"}}>✕</button>
            </div>
            <div style={{background:"#F5F5F5",borderRadius:"6px",padding:"0.75rem",display:"flex",flexDirection:"column",gap:"0.2rem"}}>
              <strong style={{fontSize:"0.875rem",color:"#1A1A1A"}}>{actionModal.user.fullName}</strong>
              <span style={{fontSize:"0.78rem",color:"#737373"}}>{actionModal.user.email} · {actionModal.user.role?.replace(/_/g," ")}</span>
            </div>
            {["suspend","warn"].includes(actionModal.type)&&(
              <div style={{display:"flex",flexDirection:"column",gap:"0.4rem"}}>
                <label style={{fontSize:"0.7rem",fontWeight:600,letterSpacing:"0.1em",textTransform:"uppercase" as const,color:"#525252"}}>{actionModal.type==="warn"?"Warning Message":"Reason for Suspension"}</label>
                <textarea style={{background:"#F5F5F5",border:"1.5px solid #E5E5E5",borderRadius:"8px",padding:"0.75rem",color:"#1A1A1A",fontSize:"0.875rem",fontFamily:"var(--font-body)",outline:"none",width:"100%",minHeight:"80px",resize:"vertical" as const,boxSizing:"border-box" as const}}
                  placeholder={actionModal.type==="warn"?"Write your warning to this user...":"Reason for suspension..."}
                  value={actionNote} onChange={e=>setActionNote(e.target.value)}/>
              </div>
            )}
            {actionModal.type==="delete"&&(
              <div style={{background:"#FEF2F2",border:"1px solid #FCA5A5",borderRadius:"8px",padding:"0.75rem",fontSize:"0.825rem",color:"#DC2626",lineHeight:1.5}}>
                ⚠️ This will mark the account as deleted. The user will not be able to log in.
              </div>
            )}
            <div style={{display:"flex",gap:"0.75rem"}}>
              <button onClick={()=>setActionModal(null)} style={{flex:1,background:"#F5F5F5",border:"1.5px solid #E5E5E5",color:"#525252",borderRadius:"8px",padding:"0.875rem",fontSize:"0.875rem",cursor:"pointer",fontFamily:"var(--font-body)"}}>Cancel</button>
              <button onClick={handleAction} disabled={actionLoading}
                style={{flex:1,background:actionModal.type==="delete"?"#DC2626":actionModal.type==="unsuspend"?"#16A34A":"#F47B20",color:"#fff",border:"none",borderRadius:"8px",padding:"0.875rem",fontFamily:"var(--font-display)",fontSize:"0.875rem",letterSpacing:"0.06em",cursor:"pointer",opacity:actionLoading?0.6:1}}>
                {actionLoading?"Working...":"Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div style={{display:"flex",gap:"0.75rem",alignItems:"center",flexWrap:"wrap"}}>
        <input placeholder="Search name, email, username..." value={search} onChange={e=>{setSearch(e.target.value);setSkip(0);}}
          style={{background:"#fff",border:"1.5px solid #E5E5E5",borderRadius:"8px",padding:"0.65rem 1rem",color:"#1A1A1A",fontSize:"0.875rem",fontFamily:"var(--font-body)",outline:"none",width:"280px"}}/>
        <div style={{display:"flex",gap:"0.3rem",flexWrap:"wrap"}}>
          {ROLES.map(r=>(
            <button key={r} onClick={()=>{setRoleFilter(r);setSkip(0);}}
              style={{background:roleFilter===r?"#1A1A1A":"transparent",border:`1px solid ${roleFilter===r?"#1A1A1A":"#E5E5E5"}`,borderRadius:"20px",padding:"0.3rem 0.75rem",fontSize:"0.72rem",cursor:"pointer",color:roleFilter===r?"#fff":"#737373",fontFamily:"var(--font-body)",textTransform:"capitalize" as const,transition:"all 0.2s"}}>
              {r==="all"?"All":r.replace(/_/g," ")}
            </button>
          ))}
        </div>
      </div>

      {loading?(
        <div style={{display:"flex",justifyContent:"center",padding:"3rem"}}>
          <div style={{width:"28px",height:"28px",border:"2.5px solid #E5E5E5",borderTopColor:"#F47B20",borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      ):users.length===0?(
        <div style={{padding:"3rem",textAlign:"center",border:"1.5px dashed #E5E5E5",borderRadius:"12px",color:"#737373"}}>No users found</div>
      ):(
        <div style={{overflowX:"auto",border:"1.5px solid #E5E5E5",borderRadius:"10px",background:"#fff"}}>
          <table style={{width:"100%",borderCollapse:"collapse",minWidth:"800px"}}>
            <thead>
              <tr style={{background:"#F5F5F5"}}>
                {["User","Role","Contact","Status","Joined","Actions"].map(h=>(
                  <th key={h} style={{padding:"0.75rem 1rem",textAlign:"left",fontSize:"0.68rem",fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase" as const,color:"#737373",borderBottom:"1.5px solid #E5E5E5"}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map(u=>(
                <tr key={u._id} style={{borderBottom:"1px solid #F5F5F5"}}>
                  <td style={{padding:"0.875rem 1rem",verticalAlign:"top"}}>
                    <div style={{fontWeight:600,fontSize:"0.875rem",color:"#1A1A1A"}}>{u.fullName||"—"}</div>
                    <div style={{fontSize:"0.72rem",color:"#A3A3A3",fontFamily:"monospace"}}>@{u.username||"-"}</div>
                    <div style={{fontSize:"0.75rem",color:"#737373"}}>{u.email}</div>
                  </td>
                  <td style={{padding:"0.875rem 1rem",verticalAlign:"top"}}>
                    <span style={{padding:"0.2rem 0.6rem",borderRadius:"20px",fontSize:"0.68rem",fontWeight:500,textTransform:"capitalize" as const,border:"1px solid",color:ROLE_COLORS[u.role]||"#888",borderColor:(ROLE_COLORS[u.role]||"#888")+"44",background:(ROLE_COLORS[u.role]||"#888")+"11"}}>
                      {u.role?.replace(/_/g," ")}
                    </span>
                  </td>
                  <td style={{padding:"0.875rem 1rem",verticalAlign:"top"}}>
                    <div style={{display:"flex",gap:"0.3rem",marginBottom:"0.2rem"}}>
                      {u.phone&&<a href={`tel:${u.phone}`} style={{fontSize:"0.9rem",textDecoration:"none"}}>📞</a>}
                      {u.email&&<a href={`mailto:${u.email}`} style={{fontSize:"0.9rem",textDecoration:"none"}}>✉️</a>}
                      {(u.whatsapp||u.phone)&&<a href={`https://wa.me/${(u.whatsapp||u.phone).replace(/[^0-9]/g,"")}`} target="_blank" rel="noreferrer" style={{fontSize:"0.9rem",textDecoration:"none"}}>💬</a>}
                    </div>
                    <div style={{fontSize:"0.75rem",color:"#737373"}}>{u.phone||"-"}</div>
                  </td>
                  <td style={{padding:"0.875rem 1rem",verticalAlign:"top"}}>
                    <span style={{padding:"0.2rem 0.6rem",borderRadius:"20px",fontSize:"0.68rem",fontWeight:500,border:"1px solid",color:STATUS_COLORS[u.status]||"#888",borderColor:(STATUS_COLORS[u.status]||"#888")+"44",background:(STATUS_COLORS[u.status]||"#888")+"11"}}>
                      {u.status}
                    </span>
                  </td>
                  <td style={{padding:"0.875rem 1rem",fontSize:"0.75rem",color:"#737373",whiteSpace:"nowrap" as const,verticalAlign:"top"}}>{fmtDate(u.createdAt)}</td>
                  <td style={{padding:"0.875rem 1rem",verticalAlign:"top"}}>
                    <div style={{display:"flex",flexDirection:"column",gap:"0.3rem",minWidth:"90px"}}>
                      {u.status==="suspended"?(
                        <button onClick={()=>{setActionModal({type:"unsuspend",user:u});setActionNote("");}}
                          style={{background:"transparent",border:"1px solid #E5E5E5",borderRadius:"4px",padding:"0.25rem 0.5rem",fontSize:"0.72rem",cursor:"pointer",color:"#737373",fontFamily:"var(--font-body)",textAlign:"left" as const,transition:"all 0.2s"}}>
                          ✅ Reactivate
                        </button>
                      ):(
                        <button onClick={()=>{setActionModal({type:"suspend",user:u});setActionNote("");}}
                          style={{background:"transparent",border:"1px solid #E5E5E5",borderRadius:"4px",padding:"0.25rem 0.5rem",fontSize:"0.72rem",cursor:"pointer",color:"#737373",fontFamily:"var(--font-body)",textAlign:"left" as const,transition:"all 0.2s"}}>
                          ⛔ Suspend
                        </button>
                      )}
                      <button onClick={()=>{setActionModal({type:"warn",user:u});setActionNote("");}}
                        style={{background:"transparent",border:"1px solid #E5E5E5",borderRadius:"4px",padding:"0.25rem 0.5rem",fontSize:"0.72rem",cursor:"pointer",color:"#737373",fontFamily:"var(--font-body)",textAlign:"left" as const}}>
                        ⚠️ Warn
                      </button>
                      <button onClick={()=>setActionModal({type:"reset",user:u})}
                        style={{background:"transparent",border:"1px solid #E5E5E5",borderRadius:"4px",padding:"0.25rem 0.5rem",fontSize:"0.72rem",cursor:"pointer",color:"#737373",fontFamily:"var(--font-body)",textAlign:"left" as const}}>
                        🔑 Reset PW
                      </button>
                      <button onClick={()=>setActionModal({type:"delete",user:u})}
                        style={{background:"transparent",border:"1px solid #E5E5E5",borderRadius:"4px",padding:"0.25rem 0.5rem",fontSize:"0.72rem",cursor:"pointer",color:"#DC2626",fontFamily:"var(--font-body)",textAlign:"left" as const}}>
                        🗑 Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div style={{display:"flex",alignItems:"center",gap:"1rem",justifyContent:"center"}}>
        <button onClick={()=>setSkip(Math.max(0,skip-LIMIT))} disabled={skip===0}
          style={{background:"#fff",border:"1.5px solid #E5E5E5",color:"#737373",padding:"0.5rem 1rem",borderRadius:"6px",cursor:"pointer",fontSize:"0.825rem",fontFamily:"var(--font-body)",opacity:skip===0?0.4:1}}>← Prev</button>
        <span style={{fontSize:"0.825rem",color:"#737373",fontFamily:"monospace"}}>{Math.floor(skip/LIMIT)+1} / {Math.max(1,Math.ceil(total/LIMIT))}</span>
        <button onClick={()=>setSkip(skip+LIMIT)} disabled={skip+LIMIT>=total}
          style={{background:"#fff",border:"1.5px solid #E5E5E5",color:"#737373",padding:"0.5rem 1rem",borderRadius:"6px",cursor:"pointer",fontSize:"0.825rem",fontFamily:"var(--font-body)",opacity:skip+LIMIT>=total?0.4:1}}>Next →</button>
      </div>
    </div>
  );
}
