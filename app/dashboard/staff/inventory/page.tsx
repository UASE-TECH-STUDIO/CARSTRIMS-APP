"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";

export default function StaffInventoryPage() {
  const [cars, setCars] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [perms, setPerms] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [denied, setDenied] = useState(false);

  useEffect(() => {
    api.get("/api/v1/staff/me").then((r) => {
      const p = r.data.permissions || [];
      setPerms(p);
      if (!p.includes("view_inventory") && !p.includes("add_cars") && !p.includes("edit_cars")) {
        setDenied(true);
        setLoading(false);
        return;
      }
      loadCars();
    }).catch(() => { setLoading(false); });
  }, []);

  const loadCars = async (s = "", st = "all") => {
    setLoading(true);
    try {
      const params: any = { limit: 30 };
      if (s) params.search = s;
      if (st !== "all") params.status = st;
      const res = await api.get("/api/v1/cars/", { params });
      setCars(res.data.cars || []);
      setTotal(res.data.total || 0);
    } catch (_) {}
    finally { setLoading(false); }
  };

  const STATUS_COLORS: Record<string,string> = {
    available:"#16A34A", sold:"#737373", reserved:"#F47B20",
    out_for_inspection:"#2563EB", in_repair:"#DC2626",
  };

  if (denied) return (
    <div style={{display:"flex", flexDirection:"column", alignItems:"center", gap:"1rem", padding:"3rem", textAlign:"center", background:"#fff", border:"1.5px solid #E5E5E5", borderRadius:"12px"}}>
      <div style={{fontSize:"2rem", fontWeight:700, color:"#DC2626"}}>Access Denied</div>
      <p style={{color:"#737373", fontSize:"0.875rem"}}>You do not have permission to view inventory. Contact your dealer admin.</p>
    </div>
  );

  return (
    <div style={{display:"flex", flexDirection:"column", gap:"1.5rem"}}>
      <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:"1rem"}}>
        <div>
          <h2 style={{fontFamily:"var(--font-display)", fontSize:"1.6rem", color:"#1A1A1A", letterSpacing:"0.04em"}}>Inventory</h2>
          <p style={{fontSize:"0.8rem", color:"#737373", marginTop:"0.2rem"}}>{total} vehicles in dealership</p>
        </div>
        {perms.includes("add_cars") && (
          <a href="/dashboard/dealer/cars" style={{background:"#F47B20", color:"#fff", border:"none", borderRadius:"8px", padding:"0.65rem 1.25rem", fontFamily:"var(--font-display)", fontSize:"0.875rem", letterSpacing:"0.08em", textDecoration:"none"}}>
            + Add Car
          </a>
        )}
      </div>

      {/* Filters */}
      <div style={{display:"flex", gap:"0.75rem", flexWrap:"wrap"}}>
        <input
          style={{flex:1, minWidth:"200px", background:"#fff", border:"1.5px solid #E5E5E5", borderRadius:"8px", padding:"0.6rem 1rem", color:"#1A1A1A", fontSize:"0.875rem", outline:"none"}}
          placeholder="Search by brand, model, ID..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); loadCars(e.target.value, statusFilter); }}
        />
        {["all","available","sold","reserved","out_for_inspection","in_repair"].map((s) => (
          <button key={s} onClick={() => { setStatusFilter(s); loadCars(search, s); }}
            style={{
              background:statusFilter===s ? "#F47B20" : "#fff",
              color:statusFilter===s ? "#fff" : "#737373",
              border:statusFilter===s ? "1.5px solid #F47B20" : "1.5px solid #E5E5E5",
              borderRadius:"20px", padding:"0.35rem 0.875rem", fontSize:"0.75rem",
              cursor:"pointer", textTransform:"capitalize", whiteSpace:"nowrap",
              fontFamily:"var(--font-body)",
            }}>
            {s === "all" ? "All" : s.replace(/_/g," ")}
          </button>
        ))}
      </div>

      {/* Cars list */}
      {loading ? (
        <div style={{display:"flex", justifyContent:"center", padding:"3rem"}}>
          <div style={{width:"28px", height:"28px", border:"2.5px solid #E5E5E5", borderTopColor:"#F47B20", borderRadius:"50%", animation:"spin 0.8s linear infinite"}} />
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      ) : cars.length === 0 ? (
        <div style={{padding:"3rem", textAlign:"center", background:"#fff", border:"1.5px solid #E5E5E5", borderRadius:"12px"}}>
          <div style={{fontSize:"0.875rem", color:"#737373"}}>No cars found</div>
        </div>
      ) : (
        <div style={{display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))", gap:"1rem"}}>
          {cars.map((c: any) => (
            <div key={c._id} style={{background:"#fff", border:"1.5px solid #E5E5E5", borderRadius:"12px", overflow:"hidden"}}>
              <div style={{height:"160px", background:"#F5F5F5", position:"relative", overflow:"hidden", display:"flex", alignItems:"center", justifyContent:"center"}}>
                {c.images?.[0] ? (
                  <img src={c.images[0]} alt="" style={{width:"100%", height:"100%", objectFit:"cover"}} />
                ) : (
                  <div style={{fontSize:"0.875rem", color:"#A3A3A3"}}>No image</div>
                )}
                <div style={{
                  position:"absolute", top:"0.5rem", left:"0.5rem",
                  background:STATUS_COLORS[c.status] || "#737373", color:"#fff",
                  fontSize:"0.62rem", fontWeight:600, padding:"0.2rem 0.6rem",
                  borderRadius:"20px", textTransform:"capitalize",
                }}>
                  {c.status?.replace(/_/g," ")}
                </div>
              </div>
              <div style={{padding:"1rem", display:"flex", flexDirection:"column", gap:"0.3rem"}}>
                <div style={{fontWeight:700, fontSize:"0.9rem", color:"#1A1A1A"}}>{c.brand} {c.model} {c.year}</div>
                <div style={{fontFamily:"var(--font-mono)", fontSize:"0.68rem", color:"#A3A3A3"}}>{c.carId}</div>
                <div style={{fontSize:"0.78rem", color:"#737373", textTransform:"capitalize"}}>{c.color} &middot; {c.transmission} &middot; {c.fuelType}</div>
                <div style={{fontFamily:"var(--font-display)", fontSize:"1.1rem", color:"#F47B20", marginTop:"0.25rem"}}>
                  NGN {(c.sellingPrice||0).toLocaleString()}
                </div>
                {perms.includes("edit_cars") && (
                  <a href={`/dashboard/dealer/cars?edit=${c.carId}`}
                    style={{marginTop:"0.5rem", fontSize:"0.78rem", color:"#F47B20", border:"1px solid rgba(244,123,32,0.3)", borderRadius:"5px", padding:"0.3rem 0.75rem", textAlign:"center", textDecoration:"none", background:"#FFF7ED"}}>
                    Edit Car
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}