"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import Link from "next/link";

export default function SuperAdminUserDetail() {
  const params = useParams();
  const router = useRouter();
  const userId = params?.userId as string;

  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"profile"|"documents"|"dealer"|"activity">("profile");
  const [preview, setPreview] = useState<{src:string,type:"image"|"pdf"}|null>(null);
  const [suspending, setSuspending] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (!userId) return;
    api.get(`/api/v1/admin/users/${userId}/profile`)
      .then(r => setProfile(r.data))
      .catch(() => setMsg("Failed to load user profile"))
      .finally(() => setLoading(false));
  }, [userId]);

  const fmt = (v:any) => !v ? "N/A" : v;
  const fmtDate = (d:any) => !d ? "N/A" : new Date(d).toLocaleDateString("en-NG",{day:"numeric",month:"short",year:"numeric"});
  const fmtPrice = (n:number) => `NGN ${(n||0).toLocaleString()}`;

  const suspend = async () => {
    if (!confirm("Suspend this user?")) return;
    setSuspending(true);
    try {
      await api.post(`/api/v1/admin/users/${userId}/suspend`, { reason:"Suspended by admin" });
      setProfile((p:any) => ({...p, status:"suspended"}));
      setMsg("User suspended");
    } catch { setMsg("Failed to suspend"); } finally { setSuspending(false); }
  };

  const unsuspend = async () => {
    setSuspending(true);
    try {
      await api.post(`/api/v1/admin/users/${userId}/unsuspend`);
      setProfile((p:any) => ({...p, status:"active"}));
      setMsg("User reactivated");
    } catch { setMsg("Failed to reactivate"); } finally { setSuspending(false); }
  };

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(profile, null, 2)], {type:"application/json"});
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
    a.download = `${profile?.fullName?.replace(/\s+/g,"_")||userId}_CARSTRIMS.json`;
    a.click();
  };

  const exportCSV = () => {
    const d = profile;
    if (!d) return;
    const rows = [
      ["Field","Value"],
      ["Full Name", d.fullName||""],
      ["Email", d.email||""],
      ["Phone", d.phone||""],
      ["WhatsApp", d.whatsapp||""],
      ["Role", d.role||""],
      ["Status", d.status||""],
      ["City", d.city||""],
      ["State", d.state||""],
      ["Joined", fmtDate(d.createdAt)],
      ["Dealer Name", d.dealer?.companyName||""],
      ["Dealer Status", d.dealer?.status||""],
      ["Is Registered Business", d.dealer?.isRegisteredBusiness!=null ? String(d.dealer.isRegisteredBusiness) : ""],
      ["Dealer Address", d.dealer?.address||""],
      ["Total Cars", d.recentCars?.length||0],
    ];
    const csv = "\uFEFF" + rows.map(r => r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], {type:"text/csv"});
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
    a.download = `${d.fullName?.replace(/\s+/g,"_")||userId}_CARSTRIMS.csv`;
    a.click();
  };

  const DocView = ({url,label,isPdf}:{url:string,label:string,isPdf?:boolean}) => {
    if (!url) return (
      <div style={{border:"1.5px dashed #E5E5E5",borderRadius:"10px",padding:"1.5rem",textAlign:"center",color:"#A3A3A3",fontSize:"0.8rem",background:"#FAFAFA"}}>
        {label} not uploaded
      </div>
    );
    return (
      <div style={{border:"1.5px solid #E5E5E5",borderRadius:"10px",overflow:"hidden",background:"#fff"}}>
        <div style={{padding:"0.625rem 0.875rem",background:"#F5F5F5",borderBottom:"1px solid #E5E5E5",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <span style={{fontSize:"0.75rem",fontWeight:700,color:"#525252"}}>{label}</span>
          <div style={{display:"flex",gap:"0.5rem"}}>
            <button onClick={()=>setPreview({src:url,type:isPdf?"pdf":"image"})}
              style={{background:"#F47B20",color:"#fff",border:"none",borderRadius:"5px",padding:"0.3rem 0.6rem",fontSize:"0.7rem",cursor:"pointer",fontWeight:600}}>
              View
            </button>
            <a href={url} download target="_blank" rel="noreferrer"
              style={{background:"#1A1A1A",color:"#fff",borderRadius:"5px",padding:"0.3rem 0.6rem",fontSize:"0.7rem",textDecoration:"none",fontWeight:600}}>
              Download
            </a>
          </div>
        </div>
        {!isPdf && (
          <div style={{height:"140px",overflow:"hidden",cursor:"zoom-in"}} onClick={()=>setPreview({src:url,type:"image"})}>
            <img src={url} alt={label} style={{width:"100%",height:"100%",objectFit:"cover"}}/>
          </div>
        )}
        {isPdf && (
          <div style={{padding:"1rem",textAlign:"center",fontSize:"0.8rem",color:"#737373"}}>
            PDF Document - click View or Download to open
          </div>
        )}
      </div>
    );
  };

  const InfoRow = ({label,value}:{label:string,value:any}) => (
    <div style={{display:"flex",gap:"0.5rem",padding:"0.625rem 0",borderBottom:"1px solid #F5F5F5",flexWrap:"wrap"}}>
      <div style={{minWidth:"160px",fontSize:"0.75rem",color:"#A3A3A3",fontWeight:600,textTransform:"uppercase" as const,letterSpacing:"0.06em",paddingTop:"0.1rem"}}>{label}</div>
      <div style={{flex:1,fontSize:"0.875rem",color:"#1A1A1A",wordBreak:"break-all" as const}}>{fmt(value)}</div>
    </div>
  );

  const ROLE_COLOR: Record<string,string> = {
    DEALER_ADMIN:"#F47B20", DEALER_STAFF:"#D97706", PARTNER_USER:"#7B68EE",
    SYSTEM_ADMIN:"#DC2626", PUBLIC_USER:"#16A34A",
  };
  const STATUS_COLOR: Record<string,string> = {
    active:"#16A34A", approved:"#16A34A", suspended:"#DC2626",
    awaiting_approval:"#D97706", pending:"#D97706", rejected:"#DC2626",
  };

  if (loading) return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"400px",flexDirection:"column",gap:"1rem"}}>
      <div style={{fontFamily:"var(--font-display)",fontSize:"1rem",color:"#F47B20",letterSpacing:"0.15em"}}>LOADING</div>
      <div style={{width:"28px",height:"28px",border:"2.5px solid #E5E5E5",borderTopColor:"#F47B20",borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (!profile) return (
    <div style={{padding:"2rem",textAlign:"center",color:"#737373"}}>
      {msg || "User not found"}
      <br/><button onClick={()=>router.back()} style={{marginTop:"1rem",background:"#F47B20",color:"#fff",border:"none",borderRadius:"8px",padding:"0.625rem 1.25rem",cursor:"pointer"}}>Go Back</button>
    </div>
  );

  const isDealer = profile.role==="DEALER_ADMIN"||profile.role==="DEALER_STAFF";
  const dealer = profile.dealer;

  return (
    <div style={{maxWidth:"900px",margin:"0 auto",padding:"1.5rem",fontFamily:"var(--font-body)"}}>

      {/* Lightbox */}
      {preview && (
        <div onClick={()=>setPreview(null)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.92)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center"}}>
          <button onClick={()=>setPreview(null)} style={{position:"absolute",top:"1rem",right:"1rem",background:"rgba(255,255,255,0.15)",border:"none",color:"#fff",fontSize:"1.3rem",width:"40px",height:"40px",borderRadius:"50%",cursor:"pointer"}}>x</button>
          {preview.type==="image"
            ? <img src={preview.src} alt="" onClick={e=>e.stopPropagation()} style={{maxWidth:"90vw",maxHeight:"88vh",objectFit:"contain",borderRadius:"8px"}}/>
            : <iframe src={preview.src} onClick={(e:any)=>e.stopPropagation()} style={{width:"88vw",height:"88vh",border:"none",borderRadius:"8px"}}/>
          }
        </div>
      )}

      {/* Header */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"1.25rem",flexWrap:"wrap",gap:"0.75rem"}}>
        <button onClick={()=>router.back()} style={{background:"none",border:"none",color:"#525252",cursor:"pointer",fontWeight:600,fontSize:"0.9rem"}}>Back</button>
        <div style={{display:"flex",gap:"0.625rem",flexWrap:"wrap"}}>
          <button onClick={exportCSV} style={{background:"#F5F5F5",border:"1.5px solid #E5E5E5",color:"#525252",borderRadius:"8px",padding:"0.5rem 1rem",fontSize:"0.8rem",cursor:"pointer",fontWeight:600}}>Export CSV</button>
          <button onClick={exportJSON} style={{background:"#F5F5F5",border:"1.5px solid #E5E5E5",color:"#525252",borderRadius:"8px",padding:"0.5rem 1rem",fontSize:"0.8rem",cursor:"pointer",fontWeight:600}}>Export JSON</button>
          {profile.status==="suspended"
            ? <button onClick={unsuspend} disabled={suspending} style={{background:"#16A34A",color:"#fff",border:"none",borderRadius:"8px",padding:"0.5rem 1rem",fontSize:"0.8rem",cursor:"pointer",fontWeight:600}}>Reactivate</button>
            : <button onClick={suspend} disabled={suspending} style={{background:"#DC2626",color:"#fff",border:"none",borderRadius:"8px",padding:"0.5rem 1rem",fontSize:"0.8rem",cursor:"pointer",fontWeight:600}}>Suspend</button>
          }
        </div>
      </div>

      {msg && <div style={{background:"#F0FDF4",border:"1px solid #86EFAC",borderRadius:"8px",padding:"0.75rem 1rem",marginBottom:"1rem",fontSize:"0.875rem",color:"#15803D"}}>{msg}</div>}

      {/* User card */}
      <div style={{background:"#fff",border:"1.5px solid #E5E5E5",borderRadius:"14px",padding:"1.5rem",marginBottom:"1.25rem",display:"flex",gap:"1.25rem",flexWrap:"wrap",alignItems:"flex-start"}}>
        <div style={{width:"80px",height:"80px",borderRadius:"50%",overflow:"hidden",background:"#FFF7ED",border:"2.5px solid #F47B20",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"2rem",color:"#F47B20",flexShrink:0}}>
          {(profile.avatar||profile.profilePicture)
            ? <img src={profile.avatar||profile.profilePicture} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
            : <span>{profile.fullName?.charAt(0)||"?"}</span>
          }
        </div>
        <div style={{flex:1,minWidth:"200px"}}>
          <div style={{display:"flex",alignItems:"center",gap:"0.75rem",flexWrap:"wrap",marginBottom:"0.4rem"}}>
            <h1 style={{fontFamily:"var(--font-display)",fontSize:"1.5rem",color:"#1A1A1A",margin:0,letterSpacing:"0.03em"}}>{profile.fullName}</h1>
            <span style={{background:`${ROLE_COLOR[profile.role]||"#737373"}18`,color:ROLE_COLOR[profile.role]||"#737373",border:`1.5px solid ${ROLE_COLOR[profile.role]||"#737373"}40`,borderRadius:"20px",padding:"0.2rem 0.75rem",fontSize:"0.7rem",fontWeight:700,letterSpacing:"0.08em"}}>
              {profile.role?.replace(/_/g," ")}
            </span>
            <span style={{background:`${STATUS_COLOR[profile.status]||"#737373"}18`,color:STATUS_COLOR[profile.status]||"#737373",border:`1.5px solid ${STATUS_COLOR[profile.status]||"#737373"}40`,borderRadius:"20px",padding:"0.2rem 0.75rem",fontSize:"0.7rem",fontWeight:700}}>
              {profile.status||"unknown"}
            </span>
          </div>
          <div style={{fontSize:"0.875rem",color:"#737373"}}>{profile.email}</div>
          <div style={{fontSize:"0.8rem",color:"#A3A3A3",marginTop:"0.2rem"}}>Joined {fmtDate(profile.createdAt)}</div>
          <div style={{marginTop:"0.75rem",display:"flex",gap:"0.5rem",flexWrap:"wrap"}}>
            <Link href={`/users/${userId}`} target="_blank" style={{fontSize:"0.75rem",color:"#F47B20",textDecoration:"none",fontWeight:600,background:"#FFF7ED",border:"1px solid rgba(244,123,32,0.3)",borderRadius:"6px",padding:"0.25rem 0.625rem"}}>View Public Profile</Link>
            {isDealer && dealer && (
              <Link href={`/dealers/${dealer.dealerId}`} target="_blank" style={{fontSize:"0.75rem",color:"#1A1A1A",textDecoration:"none",fontWeight:600,background:"#F5F5F5",border:"1px solid #E5E5E5",borderRadius:"6px",padding:"0.25rem 0.625rem"}}>View Dealer Profile</Link>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{display:"flex",gap:"0.25rem",marginBottom:"1.25rem",background:"#F5F5F5",padding:"0.25rem",borderRadius:"10px",flexWrap:"wrap"}}>
        {(["profile","documents","dealer","activity"] as const).map(t => (
          <button key={t} onClick={()=>setTab(t)}
            style={{flex:1,minWidth:"80px",padding:"0.625rem",borderRadius:"8px",border:"none",background:tab===t?"#fff":"transparent",color:tab===t?"#F47B20":"#737373",fontFamily:"var(--font-display)",fontSize:"0.72rem",letterSpacing:"0.08em",textTransform:"uppercase" as const,cursor:"pointer",fontWeight:tab===t?700:400,transition:"all 0.15s",boxShadow:tab===t?"0 1px 4px rgba(0,0,0,0.08)":"none"}}>
            {t}
          </button>
        ))}
      </div>

      {/* Profile Tab */}
      {tab==="profile" && (
        <div style={{background:"#fff",border:"1.5px solid #E5E5E5",borderRadius:"14px",padding:"1.25rem"}}>
          <div style={{fontSize:"0.68rem",fontWeight:800,letterSpacing:"0.18em",color:"#A3A3A3",textTransform:"uppercase" as const,marginBottom:"0.75rem"}}>Personal Information</div>
          <InfoRow label="Full Name" value={profile.fullName}/>
          <InfoRow label="Email" value={profile.email}/>
          <InfoRow label="Phone" value={profile.phone}/>
          <InfoRow label="WhatsApp" value={profile.whatsapp}/>
          <InfoRow label="Role" value={profile.role?.replace(/_/g," ")}/>
          <InfoRow label="Status" value={profile.status}/>
          <InfoRow label="City" value={profile.city}/>
          <InfoRow label="State" value={profile.state}/>
          <InfoRow label="Bio" value={profile.bio}/>
          <InfoRow label="Instagram" value={profile.instagram}/>
          <InfoRow label="Twitter" value={profile.twitter}/>
          <InfoRow label="Facebook" value={profile.facebook}/>
          <InfoRow label="TikTok" value={profile.tiktok}/>
          <InfoRow label="Website" value={profile.website}/>
          <InfoRow label="Joined" value={fmtDate(profile.createdAt)}/>
          <InfoRow label="Last Updated" value={fmtDate(profile.updatedAt)}/>
        </div>
      )}

      {/* Documents Tab */}
      {tab==="documents" && (
        <div style={{display:"flex",flexDirection:"column",gap:"1.25rem"}}>
          <div style={{background:"#fff",border:"1.5px solid #E5E5E5",borderRadius:"14px",padding:"1.25rem"}}>
            <div style={{fontSize:"0.68rem",fontWeight:800,letterSpacing:"0.18em",color:"#A3A3A3",textTransform:"uppercase" as const,marginBottom:"1rem"}}>Identity & Business Documents</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:"1rem"}}>
              <DocView url={dealer?.passportPhoto||profile.passportPhoto} label="Passport Photo"/>
              <DocView url={dealer?.logo||profile.logo} label="Business Logo"/>
              <DocView url={dealer?.idCardUrl||profile.idCardUrl} label="ID Card" isPdf={(dealer?.idCardUrl||profile.idCardUrl)?.toLowerCase().includes(".pdf")}/>
              <DocView
                url={(dealer?.isRegisteredBusiness===false) ? "" : (dealer?.cacUrl||profile.cacUrl)}
                label="CAC Document"
                isPdf={(dealer?.cacUrl||profile.cacUrl)?.toLowerCase().includes(".pdf")}
              />
            </div>
            {/* isRegisteredBusiness notice */}
            {dealer && dealer.isRegisteredBusiness===false && (
              <div style={{marginTop:"1rem",background:"#FFF7ED",border:"1.5px solid rgba(244,123,32,0.4)",borderRadius:"10px",padding:"0.875rem 1rem",display:"flex",alignItems:"center",gap:"0.75rem"}}>
                <div style={{width:"10px",height:"10px",borderRadius:"50%",background:"#F47B20",flexShrink:0}}/>
                <div>
                  <div style={{fontWeight:700,fontSize:"0.875rem",color:"#C4621A"}}>Not a Registered Business</div>
                  <div style={{fontSize:"0.78rem",color:"#737373",marginTop:"0.2rem"}}>This dealer indicated their business is NOT registered with CAC during setup. No CAC document is expected.</div>
                </div>
              </div>
            )}
            {dealer && dealer.isRegisteredBusiness===true && !dealer.cacUrl && (
              <div style={{marginTop:"1rem",background:"#FEF2F2",border:"1.5px solid #FECACA",borderRadius:"10px",padding:"0.875rem 1rem",display:"flex",alignItems:"center",gap:"0.75rem"}}>
                <div style={{width:"10px",height:"10px",borderRadius:"50%",background:"#DC2626",flexShrink:0}}/>
                <div>
                  <div style={{fontWeight:700,fontSize:"0.875rem",color:"#DC2626"}}>CAC Document Missing</div>
                  <div style={{fontSize:"0.78rem",color:"#737373",marginTop:"0.2rem"}}>This dealer said they are CAC-registered but did not upload a CAC document.</div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Dealer Tab */}
      {tab==="dealer" && (
        <div style={{display:"flex",flexDirection:"column",gap:"1.25rem"}}>
          {!isDealer || !dealer ? (
            <div style={{background:"#fff",border:"1.5px solid #E5E5E5",borderRadius:"14px",padding:"3rem",textAlign:"center",color:"#A3A3A3",fontSize:"0.875rem"}}>
              No dealer profile associated with this user
            </div>
          ) : (
            <>
              <div style={{background:"#fff",border:"1.5px solid #E5E5E5",borderRadius:"14px",padding:"1.25rem"}}>
                <div style={{fontSize:"0.68rem",fontWeight:800,letterSpacing:"0.18em",color:"#A3A3A3",textTransform:"uppercase" as const,marginBottom:"0.75rem"}}>Dealership Information</div>
                <InfoRow label="Company Name" value={dealer.companyName}/>
                <InfoRow label="Dealer ID" value={dealer.dealerId}/>
                <InfoRow label="Status" value={dealer.status}/>
                <InfoRow label="Is CAC Registered" value={dealer.isRegisteredBusiness===true?"YES - Registered":dealer.isRegisteredBusiness===false?"NO - Not Registered":"Not specified"}/>
                <InfoRow label="Address" value={dealer.address}/>
                <InfoRow label="City" value={dealer.city}/>
                <InfoRow label="State" value={dealer.state}/>
                <InfoRow label="Phone" value={dealer.phone}/>
                <InfoRow label="WhatsApp" value={dealer.whatsapp}/>
                <InfoRow label="Email" value={dealer.email}/>
                <InfoRow label="Description" value={dealer.description}/>
                <InfoRow label="Setup Date" value={fmtDate(dealer.createdAt)}/>
                <InfoRow label="Approved At" value={fmtDate(dealer.approvedAt)}/>
              </div>

              {/* Recent Cars */}
              {profile.recentCars?.length > 0 && (
                <div style={{background:"#fff",border:"1.5px solid #E5E5E5",borderRadius:"14px",padding:"1.25rem"}}>
                  <div style={{fontSize:"0.68rem",fontWeight:800,letterSpacing:"0.18em",color:"#A3A3A3",textTransform:"uppercase" as const,marginBottom:"0.875rem"}}>
                    Listed Vehicles ({profile.recentCars.length})
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:"0.75rem"}}>
                    {profile.recentCars.map((c:any) => (
                      <Link key={c._id} href={`/cars/${c.carId}`} target="_blank"
                        style={{textDecoration:"none",border:"1.5px solid #E5E5E5",borderRadius:"10px",overflow:"hidden",background:"#FAFAFA",display:"flex",flexDirection:"column"}}>
                        <div style={{height:"100px",background:"#F5F5F5",overflow:"hidden"}}>
                          {c.images?.[0] && <img src={c.images[0]} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>}
                        </div>
                        <div style={{padding:"0.625rem"}}>
                          <div style={{fontWeight:700,fontSize:"0.8rem",color:"#1A1A1A"}}>{c.brand} {c.model} {c.year}</div>
                          <div style={{fontSize:"0.72rem",color:"#737373"}}>{fmtPrice(c.sellingPrice)}</div>
                          <div style={{fontSize:"0.65rem",marginTop:"0.2rem",padding:"0.15rem 0.4rem",borderRadius:"4px",background:c.status==="available"?"#F0FDF4":"#F5F5F5",color:c.status==="available"?"#15803D":"#737373",display:"inline-block",fontWeight:600}}>{c.status}</div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Activity Tab */}
      {tab==="activity" && (
        <div style={{display:"flex",flexDirection:"column",gap:"1rem"}}>
          {/* Appointments */}
          <div style={{background:"#fff",border:"1.5px solid #E5E5E5",borderRadius:"14px",padding:"1.25rem"}}>
            <div style={{fontSize:"0.68rem",fontWeight:800,letterSpacing:"0.18em",color:"#A3A3A3",textTransform:"uppercase" as const,marginBottom:"0.75rem"}}>
              Appointments ({profile.appointments?.length||0})
            </div>
            {!profile.appointments?.length ? (
              <div style={{color:"#A3A3A3",fontSize:"0.875rem",padding:"1rem 0"}}>No appointments</div>
            ) : profile.appointments.map((a:any) => (
              <div key={a._id} style={{padding:"0.75rem 0",borderBottom:"1px solid #F5F5F5",display:"flex",gap:"0.75rem",flexWrap:"wrap",justifyContent:"space-between"}}>
                <div>
                  <div style={{fontWeight:600,fontSize:"0.875rem",color:"#1A1A1A"}}>{a.type||"Appointment"}</div>
                  <div style={{fontSize:"0.78rem",color:"#737373"}}>{fmtDate(a.scheduledAt||a.createdAt)}</div>
                </div>
                <span style={{fontSize:"0.72rem",padding:"0.2rem 0.625rem",borderRadius:"20px",background:"#F5F5F5",color:"#525252",fontWeight:600,height:"fit-content"}}>{a.status||"pending"}</span>
              </div>
            ))}
          </div>

          {/* Vehicle Requests */}
          <div style={{background:"#fff",border:"1.5px solid #E5E5E5",borderRadius:"14px",padding:"1.25rem"}}>
            <div style={{fontSize:"0.68rem",fontWeight:800,letterSpacing:"0.18em",color:"#A3A3A3",textTransform:"uppercase" as const,marginBottom:"0.75rem"}}>
              Vehicle Requests ({profile.vehicleRequests?.length||0})
            </div>
            {!profile.vehicleRequests?.length ? (
              <div style={{color:"#A3A3A3",fontSize:"0.875rem",padding:"1rem 0"}}>No vehicle requests</div>
            ) : profile.vehicleRequests.map((r:any) => (
              <div key={r._id} style={{padding:"0.75rem 0",borderBottom:"1px solid #F5F5F5",display:"flex",gap:"0.75rem",flexWrap:"wrap",justifyContent:"space-between"}}>
                <div>
                  <div style={{fontWeight:600,fontSize:"0.875rem",color:"#1A1A1A"}}>{r.brand} {r.model} {r.year}</div>
                  <div style={{fontSize:"0.78rem",color:"#737373"}}>{fmtDate(r.createdAt)}</div>
                </div>
                <span style={{fontSize:"0.72rem",padding:"0.2rem 0.625rem",borderRadius:"20px",background:"#F5F5F5",color:"#525252",fontWeight:600,height:"fit-content"}}>{r.status||"pending"}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}