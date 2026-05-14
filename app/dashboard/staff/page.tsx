"use client";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/api";
import Link from "next/link";

const PERM_LABELS: Record<string,string> = {
  view_inventory:"View Inventory", add_cars:"Add Cars", edit_cars:"Edit Cars",
  delete_cars:"Delete Cars", view_sales:"View Sales", record_sales:"Record Sales",
  view_staff:"View Staff", create_staff:"Create Staff",
  view_partners:"View Partners", view_movements:"View Movements",
  manage_movements:"Log Movements", view_cctv:"View CCTV",
  view_reports:"View Reports",
};

const PERM_ROUTES: Record<string,string> = {
  view_inventory:"/dashboard/staff/inventory",
  add_cars:"/dashboard/staff/inventory",
  edit_cars:"/dashboard/staff/inventory",
  delete_cars:"/dashboard/staff/inventory",
  view_sales:"/dashboard/staff/sales",
  record_sales:"/dashboard/staff/sales",
  view_staff:"/dashboard/staff/staff",
  create_staff:"/dashboard/staff/staff",
  view_partners:"/dashboard/staff/partners",
  view_movements:"/dashboard/staff/movements",
  manage_movements:"/dashboard/staff/movements",
  view_cctv:"/dashboard/staff/cctv",
  view_reports:"/dashboard/staff/reports",
};

const PERM_ICONS: Record<string,string> = {
  view_inventory:"▣", add_cars:"➕", edit_cars:"✏️", delete_cars:"🗑",
  view_sales:"◈", record_sales:"💳", view_staff:"◎", create_staff:"👤",
  view_partners:"⊕", view_movements:"↺", manage_movements:"🔄",
  view_cctv:"◑", view_reports:"▤",
};

export default function StaffOverviewPage() {
  const { user } = useAuthStore();
  const [staff,  setStaff]  = useState<any>(null);
  const [dealer, setDealer] = useState<any>(null);
  const [cars,   setCars]   = useState<any[]>([]);
  const [sales,  setSales]  = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        // 1. Load staff profile (has permissions + dealerId)
        const staffRes = await api.get("/api/v1/staff/me");
        const s = staffRes.data;
        setStaff(s);

        // 2. Load the dealer this staff belongs to
        const dealerRes = await api.get("/api/v1/staff/me/dealer");
        setDealer(dealerRes.data);

        const perms: string[] = s.permissions || [];

        // 3. Load inventory preview if permitted
        if (perms.some(p => ["view_inventory","add_cars","edit_cars"].includes(p))) {
          try {
            const carsRes = await api.get("/api/v1/cars/", { params: { limit: 5, skip: 0 } });
            setCars(carsRes.data?.cars || []);
          } catch {}
        }

        // 4. Load sales preview if permitted
        if (perms.includes("view_sales") || perms.includes("record_sales")) {
          try {
            const salesRes = await api.get("/api/v1/dealers/me/sales", { params: { limit: 5 } });
            setSales(salesRes.data?.sales || []);
          } catch {}
        }
      } catch (e) {
        console.error("Staff overview load error:", e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"50vh"}}>
      <div style={{width:"28px",height:"28px",border:"2.5px solid #E5E5E5",borderTopColor:"#1D9E75",borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  const perms: string[] = staff?.permissions || [];
  const fmt = (n: number) => `₦${(n||0).toLocaleString()}`;
  const fmtDate = (iso: string) => iso ? new Date(iso).toLocaleDateString("en-NG",{day:"numeric",month:"short",year:"numeric"}) : "-";

  // Deduplicate quick action routes
  const seen = new Set<string>();
  const quickActions = perms
    .filter(p => PERM_ROUTES[p])
    .filter(p => {
      const route = PERM_ROUTES[p];
      if (seen.has(route)) return false;
      seen.add(route);
      return true;
    });

  return (
    <div style={{display:"flex",flexDirection:"column",gap:"1.5rem",fontFamily:"var(--font-body)"}}>

      {/* Welcome banner */}
      <div style={{background:"#F0FDF9",border:"1.5px solid rgba(29,158,117,0.25)",borderRadius:"12px",padding:"1.25rem 1.5rem",display:"flex",alignItems:"center",gap:"1rem",flexWrap:"wrap"}}>
        <div style={{width:"52px",height:"52px",borderRadius:"50%",background:"#1D9E75",color:"#fff",fontFamily:"var(--font-display)",fontSize:"1.5rem",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
          {user?.fullName?.charAt(0).toUpperCase()}
        </div>
        <div>
          <div style={{fontFamily:"var(--font-display)",fontSize:"1.5rem",color:"#1A1A1A",letterSpacing:"0.04em",lineHeight:1}}>
            Welcome, {user?.fullName?.split(" ")[0]}
          </div>
          <div style={{fontSize:"0.8rem",color:"#737373",marginTop:"0.25rem"}}>
            {staff?.position || "Staff Member"} · {staff?.staffId || "-"}
          </div>
        </div>
      </div>

      {/* Dealer info */}
      {dealer?.companyName && (
        <div style={{background:"#fff",border:"1.5px solid #E5E5E5",borderRadius:"12px",padding:"1.25rem"}}>
          <div style={{fontSize:"0.68rem",fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",color:"#A3A3A3",marginBottom:"0.875rem"}}>YOUR DEALERSHIP</div>
          <div style={{display:"flex",alignItems:"center",gap:"1rem",flexWrap:"wrap"}}>
            <div style={{width:"48px",height:"48px",borderRadius:"8px",background:"#FFF7ED",border:"1.5px solid rgba(244,123,32,0.25)",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"var(--font-display)",fontSize:"1.3rem",color:"#F47B20",overflow:"hidden",flexShrink:0}}>
              {dealer.logo ? <img src={dealer.logo} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/> : dealer.companyName?.charAt(0)}
            </div>
            <div style={{flex:1}}>
              <div style={{fontSize:"1rem",fontWeight:700,color:"#1A1A1A"}}>{dealer.companyName}</div>
              <div style={{fontSize:"0.78rem",color:"#737373"}}>{dealer.ownerName} · {[dealer.city,dealer.state].filter(Boolean).join(", ")||"—"}</div>
            </div>
            <div style={{textAlign:"right"}}>
              <div style={{fontSize:"0.65rem",fontFamily:"monospace",color:"#A3A3A3"}}>{dealer.dealerId}</div>
              <div style={{fontSize:"0.72rem",color:"#F47B20",fontWeight:600,textTransform:"capitalize",marginTop:"0.2rem"}}>{dealer.status}</div>
            </div>
          </div>

          {/* Dealer stats */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"0.75rem",marginTop:"1rem"}}>
            {[
              {l:"Cars Listed", v:dealer.totalCarsListed||0},
              {l:"Cars Sold",   v:dealer.totalCarsSold||0},
              {l:"Revenue",     v:fmt(dealer.totalRevenue||0)},
            ].map(s => (
              <div key={s.l} style={{background:"#F5F5F5",borderRadius:"8px",padding:"0.75rem",textAlign:"center"}}>
                <div style={{fontFamily:"var(--font-display)",fontSize:"1.3rem",color:"#F47B20"}}>{s.v}</div>
                <div style={{fontSize:"0.65rem",color:"#737373",textTransform:"uppercase",letterSpacing:"0.06em",marginTop:"0.2rem"}}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No permissions state */}
      {perms.length === 0 ? (
        <div style={{background:"#fff",border:"1.5px solid #E5E5E5",borderRadius:"12px",padding:"3rem",display:"flex",flexDirection:"column",alignItems:"center",gap:"1rem",textAlign:"center"}}>
          <div style={{fontSize:"2.5rem"}}>🔒</div>
          <div style={{fontFamily:"var(--font-display)",fontSize:"1.1rem",color:"#1A1A1A",letterSpacing:"0.04em"}}>No Permissions Assigned</div>
          <p style={{fontSize:"0.875rem",color:"#737373",maxWidth:"380px",lineHeight:1.6}}>
            Your account has no permissions yet. Contact your dealer admin — they can assign your permissions from the Staff Management page in their dashboard.
          </p>
        </div>
      ) : (
        <>
          {/* Your permissions */}
          <div style={{background:"#fff",border:"1.5px solid #E5E5E5",borderRadius:"12px",padding:"1.25rem"}}>
            <div style={{fontSize:"0.68rem",fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",color:"#A3A3A3",marginBottom:"0.875rem"}}>YOUR PERMISSIONS</div>
            <div style={{display:"flex",flexWrap:"wrap",gap:"0.5rem"}}>
              {perms.map(p => (
                <div key={p} style={{display:"flex",alignItems:"center",gap:"0.4rem",padding:"0.35rem 0.75rem",background:"#F0FDF9",border:"1px solid rgba(29,158,117,0.25)",borderRadius:"20px"}}>
                  <span style={{fontSize:"0.875rem"}}>{PERM_ICONS[p]||"•"}</span>
                  <span style={{fontSize:"0.75rem",color:"#1D9E75",fontWeight:500}}>{PERM_LABELS[p]||p.replace(/_/g," ")}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick access actions */}
          {quickActions.length > 0 && (
            <div style={{background:"#fff",border:"1.5px solid #E5E5E5",borderRadius:"12px",padding:"1.25rem"}}>
              <div style={{fontSize:"0.68rem",fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",color:"#A3A3A3",marginBottom:"0.875rem"}}>QUICK ACCESS</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))",gap:"0.75rem"}}>
                {quickActions.map(p => {
                  const route = PERM_ROUTES[p];
                  const label = PERM_LABELS[p] || p.replace(/_/g," ");
                  return (
                    <Link key={p} href={route}
                      style={{background:"#F5F5F5",border:"1.5px solid #E5E5E5",borderRadius:"10px",padding:"1rem 0.875rem",display:"flex",flexDirection:"column",alignItems:"center",gap:"0.5rem",textDecoration:"none",transition:"all 0.2s"}}
                      onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.borderColor="#1D9E75";(e.currentTarget as HTMLElement).style.background="#F0FDF9"}}
                      onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.borderColor="#E5E5E5";(e.currentTarget as HTMLElement).style.background="#F5F5F5"}}>
                      <span style={{fontSize:"1.4rem"}}>{PERM_ICONS[p]||"▣"}</span>
                      <span style={{fontSize:"0.72rem",fontWeight:600,color:"#525252",textAlign:"center",lineHeight:1.3}}>{label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* Recent inventory */}
          {cars.length > 0 && (
            <div style={{background:"#fff",border:"1.5px solid #E5E5E5",borderRadius:"12px",padding:"1.25rem"}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"0.875rem"}}>
                <div style={{fontSize:"0.68rem",fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",color:"#A3A3A3"}}>RECENT INVENTORY</div>
                <Link href="/dashboard/staff/inventory" style={{fontSize:"0.78rem",color:"#1D9E75",textDecoration:"none"}}>View all →</Link>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:"0"}}>
                {cars.map(c => (
                  <div key={c._id} style={{display:"flex",alignItems:"center",gap:"0.75rem",padding:"0.75rem 0",borderBottom:"1px solid #F5F5F5"}}>
                    <div style={{width:"48px",height:"36px",borderRadius:"6px",overflow:"hidden",background:"#F5F5F5",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center"}}>
                      {c.images?.[0] ? <img src={c.images[0]} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/> : <span style={{fontSize:"1.1rem"}}>🚗</span>}
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:"0.85rem",fontWeight:600,color:"#1A1A1A",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{c.brand} {c.model} {c.year}</div>
                      <div style={{fontSize:"0.68rem",color:"#A3A3A3",fontFamily:"monospace"}}>{c.carId}</div>
                    </div>
                    <div style={{textAlign:"right",flexShrink:0}}>
                      <div style={{fontSize:"0.85rem",fontWeight:700,color:"#F47B20"}}>{fmt(c.sellingPrice)}</div>
                      <div style={{fontSize:"0.65rem",color:"#737373",textTransform:"capitalize"}}>{c.status}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent sales */}
          {sales.length > 0 && (
            <div style={{background:"#fff",border:"1.5px solid #E5E5E5",borderRadius:"12px",padding:"1.25rem"}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"0.875rem"}}>
                <div style={{fontSize:"0.68rem",fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",color:"#A3A3A3"}}>RECENT SALES</div>
                <Link href="/dashboard/staff/sales" style={{fontSize:"0.78rem",color:"#1D9E75",textDecoration:"none"}}>View all →</Link>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:"0"}}>
                {sales.map((s: any) => (
                  <div key={s._id} style={{display:"flex",alignItems:"center",gap:"0.75rem",padding:"0.75rem 0",borderBottom:"1px solid #F5F5F5"}}>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:"0.85rem",fontWeight:600,color:"#1A1A1A"}}>{s.carBrand||s.brand} {s.carModel||s.model} {s.carYear||s.year}</div>
                      <div style={{fontSize:"0.75rem",color:"#737373"}}>{s.buyerName||"Walk-in"} · {fmtDate(s.soldAt)}</div>
                    </div>
                    <div style={{fontFamily:"var(--font-display)",fontSize:"1rem",color:"#F47B20",flexShrink:0}}>
                      {fmt(s.sellingPrice)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
