"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import api from "@/lib/api";

const STATUS_COLOR: Record<string,string> = {
  available:"#16A34A", sold:"#888", reserved:"#D97706",
  out_for_inspection:"#3B8BD4", in_repair:"#DC2626",
};

export default function StaffInventoryPage() {
  const router  = useRouter();
  const [cars, setCars]       = useState<any[]>([]);
  const [total, setTotal]     = useState(0);
  const [loading, setLoading] = useState(true);
  const [perms, setPerms]     = useState<string[]>([]);
  const [search, setSearch]   = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [skip, setSkip]       = useState(0);
  const LIMIT = 24;

  const load = async () => {
    setLoading(true);
    try {
      const staffRes = await api.get("/api/v1/staff/me");
      const staffPerms: string[] = staffRes.data?.permissions || [];
      setPerms(staffPerms);

      const canSee = staffPerms.some(p =>
        ["view_inventory","add_cars","edit_cars","delete_cars"].includes(p)
      );
      if (!canSee) { setLoading(false); return; }

      // GET /api/v1/cars/ — the backend now resolves dealerId from the
      // staff JWT automatically (DEALER_STAFF role lookup via staff_accounts)
      const params: any = { skip, limit: LIMIT };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;

      const res = await api.get("/api/v1/cars/", { params });
      setCars(res.data.cars || []);
      setTotal(res.data.total || 0);
    } catch(e) {
      console.error("Staff inventory:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [search, statusFilter, skip]);

  const canAdd    = perms.includes("add_cars");
  const canEdit   = perms.includes("edit_cars");
  const canDelete = perms.includes("delete_cars");
  const canView   = perms.some(p => ["view_inventory","add_cars","edit_cars"].includes(p));
  const fmt = (n:number) => `₦${(n||0).toLocaleString()}`;

  if (!loading && !canView) return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:"1rem",padding:"4rem",textAlign:"center"}}>
      <div style={{fontSize:"2.5rem"}}>🔒</div>
      <h3 style={{fontFamily:"var(--font-display)",color:"#1A1A1A"}}>Access Restricted</h3>
      <p style={{color:"#737373",fontSize:"0.875rem"}}>You need <strong>view_inventory</strong> permission.</p>
    </div>
  );

  return (
    <div style={{display:"flex",flexDirection:"column",gap:"1.25rem",fontFamily:"var(--font-body)"}}>
      <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:"1rem",flexWrap:"wrap"}}>
        <div>
          <h2 style={{fontFamily:"var(--font-display)",fontSize:"1.5rem",letterSpacing:"0.04em",color:"#1A1A1A",lineHeight:1}}>
            Vehicles & Inventory
          </h2>
          <p style={{fontSize:"0.8rem",color:"#737373",marginTop:"0.3rem"}}>
            {loading ? "Loading..." : `${total} vehicle${total!==1?"s":""} in inventory`}
          </p>
        </div>
        {canAdd && (
          <Link href="/dashboard/staff/inventory/add"
            style={{background:"#F47B20",color:"#fff",border:"none",borderRadius:"8px",padding:"0.7rem 1.25rem",fontFamily:"var(--font-display)",fontSize:"0.875rem",letterSpacing:"0.06em",cursor:"pointer",textDecoration:"none",display:"inline-flex",alignItems:"center",gap:"0.5rem"}}>
            ➕ Add Vehicle
          </Link>
        )}
      </div>

      {/* Search + filters */}
      <div style={{display:"flex",gap:"0.75rem",flexWrap:"wrap",alignItems:"center"}}>
        <input placeholder="Search brand, model, ID..."
          value={search} onChange={e=>{setSearch(e.target.value);setSkip(0);}}
          style={{flex:1,minWidth:"180px",background:"#fff",border:"1.5px solid #E5E5E5",borderRadius:"8px",padding:"0.625rem 1rem",fontSize:"0.875rem",fontFamily:"var(--font-body)",outline:"none",color:"#1A1A1A"}}/>
        <div style={{display:"flex",gap:"0.3rem",flexWrap:"wrap"}}>
          {["","available","reserved","sold"].map(s=>(
            <button key={s} onClick={()=>{setStatusFilter(s);setSkip(0);}}
              style={{background:statusFilter===s?"#1A1A1A":"transparent",border:`1px solid ${statusFilter===s?"#1A1A1A":"#E5E5E5"}`,borderRadius:"20px",padding:"0.3rem 0.75rem",fontSize:"0.75rem",cursor:"pointer",color:statusFilter===s?"#fff":"#737373",fontFamily:"var(--font-body)",transition:"all 0.2s"}}>
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
      ) : cars.length===0 ? (
        <div style={{padding:"3rem",textAlign:"center",border:"1.5px dashed #E5E5E5",borderRadius:"12px",background:"#fff",display:"flex",flexDirection:"column",alignItems:"center",gap:"1rem"}}>
          <div style={{fontSize:"2.5rem"}}>🚗</div>
          <div style={{fontFamily:"var(--font-display)",fontSize:"1rem",color:"#1A1A1A"}}>
            {search||statusFilter?"No vehicles match your filters":"No vehicles in inventory yet"}
          </div>
          {canAdd && !search && !statusFilter && (
            <Link href="/dashboard/staff/inventory/add"
              style={{background:"#F47B20",color:"#fff",borderRadius:"8px",padding:"0.75rem 1.5rem",fontFamily:"var(--font-display)",fontSize:"0.875rem",letterSpacing:"0.06em",textDecoration:"none"}}>
              Add First Vehicle
            </Link>
          )}
        </div>
      ) : (
        <>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(235px,1fr))",gap:"1rem"}}>
            {cars.map(car=>(
              <div key={car._id}
                style={{background:"#fff",border:"1.5px solid #E5E5E5",borderRadius:"12px",overflow:"hidden",transition:"all 0.2s",cursor:"pointer"}}
                onMouseEnter={e=>(e.currentTarget as HTMLElement).style.borderColor="#1D9E75"}
                onMouseLeave={e=>(e.currentTarget as HTMLElement).style.borderColor="#E5E5E5"}
                onClick={()=>router.push(`/cars/${car.carId}`)}>
                <div style={{height:"160px",background:"#F5F5F5",position:"relative",overflow:"hidden"}}>
                  {car.images?.[0]
                    ? <img src={car.images[0]} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                    : <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100%",fontSize:"2rem",opacity:0.3}}>🚗</div>
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
                  <div style={{fontFamily:"var(--font-display)",fontSize:"1.1rem",color:"#F47B20",marginTop:"0.5rem"}}>{fmt(car.sellingPrice)}</div>
                  <div style={{display:"flex",gap:"0.5rem",marginTop:"0.75rem"}} onClick={e=>e.stopPropagation()}>
                    <Link href={`/cars/${car.carId}`} target="_blank"
                      style={{flex:1,background:"#F0FDF9",color:"#1D9E75",border:"1px solid rgba(29,158,117,0.3)",borderRadius:"6px",padding:"0.45rem",fontSize:"0.78rem",textAlign:"center",textDecoration:"none"}}>
                      View
                    </Link>
                    {canEdit && (
                      <Link href={`/dashboard/staff/inventory/${car.carId}`}
                        style={{flex:1,background:"#FFF7ED",color:"#F47B20",border:"1px solid rgba(244,123,32,0.3)",borderRadius:"6px",padding:"0.45rem",fontSize:"0.78rem",textAlign:"center",textDecoration:"none"}}>
                        Edit
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {total > LIMIT && (
            <div style={{display:"flex",alignItems:"center",gap:"1rem",justifyContent:"center",paddingTop:"0.5rem"}}>
              <button onClick={()=>setSkip(Math.max(0,skip-LIMIT))} disabled={skip===0}
                style={{background:"#fff",border:"1.5px solid #E5E5E5",color:"#737373",padding:"0.5rem 1rem",borderRadius:"6px",cursor:"pointer",fontSize:"0.825rem",opacity:skip===0?0.4:1}}>
                ← Prev
              </button>
              <span style={{fontSize:"0.825rem",color:"#737373",fontFamily:"monospace"}}>
                {Math.floor(skip/LIMIT)+1} / {Math.max(1,Math.ceil(total/LIMIT))}
              </span>
              <button onClick={()=>setSkip(skip+LIMIT)} disabled={skip+LIMIT>=total}
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
