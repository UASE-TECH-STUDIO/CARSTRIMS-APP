"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import Link from "next/link";

export default function StaffInventoryPage() {
  const router = useRouter();
  const [cars, setCars]       = useState<any[]>([]);
  const [total, setTotal]     = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState("");
  const [status, setStatus]   = useState("");
  const [skip, setSkip]       = useState(0);
  const [perms, setPerms]     = useState<string[]>([]);
  const [msg, setMsg]         = useState("");
  const LIMIT = 20;

  const load = async () => {
    setLoading(true);
    try {
      // Get staff info to check permissions
      const staffRes = await api.get("/api/v1/staff/me");
      const staffPerms: string[] = staffRes.data?.permissions || [];
      setPerms(staffPerms);

      if (!staffPerms.includes("view_inventory") && !staffPerms.includes("add_cars") && !staffPerms.includes("edit_cars")) {
        setLoading(false);
        return;
      }

      // Fetch cars using the dealer car route — staff token is accepted
      const params: any = { skip, limit: LIMIT };
      if (search) params.search = search;
      if (status) params.status = status;

      const res = await api.get("/api/v1/cars/", { params });
      setCars(res.data.cars || []);
      setTotal(res.data.total || 0);
    } catch (e) {
      console.error("Inventory load error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [search, status, skip]);

  const fmt = (n: number) => `₦${(n||0).toLocaleString()}`;
  const canAdd  = perms.includes("add_cars");
  const canEdit = perms.includes("edit_cars");
  const canView = perms.includes("view_inventory") || canAdd || canEdit;

  const STATUS_COLOR: Record<string,string> = {
    available:"#16A34A", sold:"#888", reserved:"#D97706", out_for_inspection:"#3B8BD4",
  };

  if (!loading && !canView) return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:"1rem",padding:"4rem",textAlign:"center"}}>
      <div style={{fontSize:"2rem"}}>🔒</div>
      <h3 style={{fontFamily:"var(--font-display)",color:"#1A1A1A"}}>Access Restricted</h3>
      <p style={{color:"#737373",fontSize:"0.875rem"}}>You need the <strong>view_inventory</strong> permission to access this section.</p>
      <p style={{color:"#A3A3A3",fontSize:"0.8rem"}}>Contact your dealer admin to grant you access.</p>
    </div>
  );

  return (
    <div style={{display:"flex",flexDirection:"column",gap:"1.25rem",fontFamily:"var(--font-body)"}}>
      <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:"1rem",flexWrap:"wrap"}}>
        <div>
          <h2 style={{fontFamily:"var(--font-display)",fontSize:"1.5rem",letterSpacing:"0.04em",color:"#1A1A1A",lineHeight:1}}>
            Cars & Inventory
          </h2>
          <p style={{fontSize:"0.8rem",color:"#737373",marginTop:"0.3rem"}}>
            {loading ? "Loading..." : `${total} vehicle${total!==1?"s":""} in inventory`}
          </p>
        </div>
        {canAdd && (
          <Link href="/dashboard/staff/inventory/add"
            style={{background:"#F47B20",color:"#fff",border:"none",borderRadius:"8px",padding:"0.7rem 1.25rem",fontFamily:"var(--font-display)",fontSize:"0.875rem",letterSpacing:"0.06em",cursor:"pointer",textDecoration:"none",display:"inline-flex",alignItems:"center",gap:"0.5rem"}}>
            ➕ Add Car
          </Link>
        )}
      </div>

      {msg && (
        <div style={{background:"#F0FDF4",border:"1px solid #86EFAC",color:"#15803D",padding:"0.75rem 1rem",borderRadius:"8px",fontSize:"0.875rem"}}>
          {msg}
        </div>
      )}

      {/* Filters */}
      <div style={{display:"flex",gap:"0.75rem",flexWrap:"wrap",alignItems:"center"}}>
        <input
          placeholder="Search brand, model, carId..."
          value={search}
          onChange={e => { setSearch(e.target.value); setSkip(0); }}
          style={{background:"#fff",border:"1.5px solid #E5E5E5",borderRadius:"8px",padding:"0.625rem 1rem",fontSize:"0.875rem",outline:"none",fontFamily:"var(--font-body)",width:"260px"}}
        />
        <div style={{display:"flex",gap:"0.3rem"}}>
          {["","available","sold","reserved"].map(s => (
            <button key={s} onClick={() => { setStatus(s); setSkip(0); }}
              style={{background:status===s?"#1A1A1A":"transparent",border:`1px solid ${status===s?"#1A1A1A":"#E5E5E5"}`,borderRadius:"20px",padding:"0.3rem 0.75rem",fontSize:"0.75rem",cursor:"pointer",color:status===s?"#fff":"#737373",fontFamily:"var(--font-body)",transition:"all 0.2s"}}>
              {s||"All"}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{display:"flex",justifyContent:"center",padding:"3rem"}}>
          <div style={{width:"28px",height:"28px",border:"2.5px solid #E5E5E5",borderTopColor:"#1D9E75",borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      ) : cars.length === 0 ? (
        <div style={{padding:"3rem",textAlign:"center",border:"1.5px dashed #E5E5E5",borderRadius:"12px",color:"#737373",background:"#fff"}}>
          {search || status ? "No cars match your filters" : "No cars in inventory yet"}
          {canAdd && !search && !status && (
            <div style={{marginTop:"1rem"}}>
              <Link href="/dashboard/staff/inventory/add"
                style={{background:"#F47B20",color:"#fff",border:"none",borderRadius:"8px",padding:"0.7rem 1.5rem",fontFamily:"var(--font-display)",fontSize:"0.875rem",letterSpacing:"0.06em",cursor:"pointer",textDecoration:"none"}}>
                Add First Car
              </Link>
            </div>
          )}
        </div>
      ) : (
        <>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))",gap:"1rem"}}>
            {cars.map(car => (
              <div key={car._id} style={{background:"#fff",border:"1.5px solid #E5E5E5",borderRadius:"12px",overflow:"hidden",transition:"all 0.2s"}}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor="#1D9E75"}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor="#E5E5E5"}>
                <div style={{height:"160px",background:"#F5F5F5",position:"relative",overflow:"hidden"}}>
                  {car.images?.[0]
                    ? <img src={car.images[0]} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                    : <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100%",fontSize:"2rem"}}>🚗</div>
                  }
                  <div style={{position:"absolute",top:"0.5rem",left:"0.5rem",background:STATUS_COLOR[car.status]||"#888",color:"#fff",padding:"0.18rem 0.6rem",borderRadius:"20px",fontSize:"0.65rem",fontWeight:700,textTransform:"capitalize"}}>
                    {car.status}
                  </div>
                  <div style={{position:"absolute",top:"0.5rem",right:"0.5rem",background:"rgba(0,0,0,0.5)",color:"#fff",padding:"0.18rem 0.5rem",borderRadius:"4px",fontSize:"0.6rem",fontFamily:"monospace"}}>
                    {car.carId}
                  </div>
                </div>
                <div style={{padding:"0.875rem"}}>
                  <div style={{fontWeight:700,fontSize:"0.9rem",color:"#1A1A1A"}}>{car.brand} {car.model} {car.year}</div>
                  <div style={{fontSize:"0.75rem",color:"#737373",textTransform:"capitalize",marginTop:"0.2rem"}}>
                    {[car.color,car.transmission,car.condition].filter(Boolean).join(" · ")}
                  </div>
                  <div style={{fontFamily:"var(--font-display)",fontSize:"1.1rem",color:"#F47B20",marginTop:"0.5rem"}}>
                    {fmt(car.sellingPrice)}
                  </div>
                  {canEdit && (
                    <div style={{display:"flex",gap:"0.5rem",marginTop:"0.75rem"}}>
                      <Link href={`/dashboard/staff/inventory/${car.carId}`}
                        style={{flex:1,background:"#F0FDF9",color:"#1D9E75",border:"1px solid rgba(29,158,117,0.3)",borderRadius:"6px",padding:"0.5rem",fontSize:"0.78rem",textAlign:"center",textDecoration:"none",transition:"all 0.2s"}}>
                        Edit Car
                      </Link>
                      <Link href={`/cars/${car.carId}`} target="_blank"
                        style={{background:"#F5F5F5",border:"1px solid #E5E5E5",color:"#737373",borderRadius:"6px",padding:"0.5rem 0.625rem",fontSize:"0.78rem",textDecoration:"none"}}>
                        View
                      </Link>
                    </div>
                  )}
                  {!canEdit && (
                    <Link href={`/cars/${car.carId}`} target="_blank"
                      style={{display:"block",marginTop:"0.75rem",background:"#F5F5F5",border:"1px solid #E5E5E5",color:"#737373",borderRadius:"6px",padding:"0.5rem",fontSize:"0.78rem",textAlign:"center",textDecoration:"none"}}>
                      View Details
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {total > LIMIT && (
            <div style={{display:"flex",alignItems:"center",gap:"1rem",justifyContent:"center",paddingTop:"0.5rem"}}>
              <button onClick={() => setSkip(Math.max(0, skip-LIMIT))} disabled={skip===0}
                style={{background:"#fff",border:"1.5px solid #E5E5E5",color:"#737373",padding:"0.5rem 1rem",borderRadius:"6px",cursor:"pointer",fontSize:"0.825rem",opacity:skip===0?0.4:1}}>
                ← Prev
              </button>
              <span style={{fontSize:"0.825rem",color:"#737373",fontFamily:"monospace"}}>
                {Math.floor(skip/LIMIT)+1} / {Math.max(1,Math.ceil(total/LIMIT))}
              </span>
              <button onClick={() => setSkip(skip+LIMIT)} disabled={skip+LIMIT>=total}
                style={{background:"#fff",border:"1.5px solid #E5E5E5",color:"#737373",padding:"0.5rem 1rem",borderRadius:"6px",cursor:"pointer",fontSize:"0.825rem",opacity:skip+LIMIT>=total?0.4:1}}>
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
