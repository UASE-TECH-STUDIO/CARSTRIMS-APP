"use client";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/api";
import Link from "next/link";

const PERM_ROUTES: Record<string,string> = {
  view_inventory:"/dashboard/staff/inventory",
  add_cars:"/dashboard/staff/inventory",
  edit_cars:"/dashboard/staff/inventory",
  view_sales:"/dashboard/staff/sales",
  record_sales:"/dashboard/staff/sales",
  view_movements:"/dashboard/staff/movements",
  manage_movements:"/dashboard/staff/movements",
  view_cctv:"/dashboard/staff/cctv",
  view_reports:"/dashboard/staff/reports",
  view_partners:"/dashboard/staff/partners",
};

export default function StaffOverviewPage() {
  const { user } = useAuthStore();
  const [staffInfo, setStaffInfo] = useState<any>(null);
  const [dealer, setDealer] = useState<any>(null);
  const [recentCars, setRecentCars] = useState<any[]>([]);
  const [recentSales, setRecentSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const staffRes = await api.get("/api/v1/staff/me");
        const s = staffRes.data;
        setStaffInfo(s);

        // Load dealer info and permitted data in parallel
        const promises: Promise<any>[] = [
          api.get("/api/v1/dealers/me").catch(() => ({ data: null })),
        ];
        if (s.permissions?.includes("view_inventory") || s.permissions?.includes("add_cars")) {
          promises.push(api.get("/api/v1/cars/?limit=5").catch(() => ({ data: { cars: [] } })));
        }
        if (s.permissions?.includes("view_sales")) {
          promises.push(api.get("/api/v1/dealers/me/sales?limit=5").catch(() => ({ data: { sales: [] } })));
        }

        const results = await Promise.all(promises);
        if (results[0]?.data) setDealer(results[0].data);
        if (results[1]?.data?.cars) setRecentCars(results[1].data.cars);
        if (results[2]?.data?.sales) setRecentSales(results[2].data.sales);
      } catch (_) {}
      finally { setLoading(false); }
    };
    load();
  }, []);

  if (loading) return (
    <div style={{display:"flex", alignItems:"center", justifyContent:"center", minHeight:"50vh"}}>
      <div style={{width:"28px", height:"28px", border:"2.5px solid #E5E5E5", borderTopColor:"#F47B20", borderRadius:"50%", animation:"spin 0.8s linear infinite"}} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  const perms = staffInfo?.permissions || [];

  const cardStyle: React.CSSProperties = {
    background:"#fff", border:"1.5px solid #E5E5E5", borderRadius:"12px", padding:"1.25rem",
    display:"flex", flexDirection:"column", gap:"1rem",
  };

  const fmtDate = (iso: string) => iso ? new Date(iso).toLocaleDateString("en-NG", {day:"numeric",month:"short",year:"numeric"}) : "-";
  const fmt = (n: number) => `NGN ${(n||0).toLocaleString()}`;

  return (
    <div style={{display:"flex", flexDirection:"column", gap:"1.5rem"}}>

      {/* Welcome */}
      <div style={{...cardStyle, background:"#FFF7ED", border:"1.5px solid rgba(244,123,32,0.25)"}}>
        <div style={{display:"flex", alignItems:"center", gap:"1rem"}}>
          <div style={{
            width:"52px", height:"52px", borderRadius:"50%",
            background:"#F47B20", color:"#fff",
            fontFamily:"var(--font-display)", fontSize:"1.5rem",
            display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0,
          }}>
            {user?.fullName?.charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={{fontFamily:"var(--font-display)", fontSize:"1.5rem", color:"#1A1A1A", letterSpacing:"0.04em", lineHeight:1}}>
              Welcome, {user?.fullName?.split(" ")[0]}
            </div>
            <div style={{fontSize:"0.825rem", color:"#737373", marginTop:"0.25rem"}}>
              {staffInfo?.position || "Staff Member"} &middot; {staffInfo?.staffId || "-"}
            </div>
          </div>
        </div>
      </div>

      {/* Dealer company info */}
      {dealer && (
        <div style={cardStyle}>
          <div style={{fontSize:"0.72rem", fontWeight:600, letterSpacing:"0.12em", textTransform:"uppercase", color:"#A3A3A3"}}>YOUR DEALERSHIP</div>
          <div style={{display:"flex", alignItems:"center", gap:"1rem"}}>
            <div style={{
              width:"48px", height:"48px", borderRadius:"8px",
              background:"#FFF7ED", border:"1.5px solid rgba(244,123,32,0.25)",
              display:"flex", alignItems:"center", justifyContent:"center",
              fontFamily:"var(--font-display)", fontSize:"1.3rem", color:"#F47B20",
              overflow:"hidden", flexShrink:0,
            }}>
              {dealer.logo ? <img src={dealer.logo} alt="" style={{width:"100%", height:"100%", objectFit:"cover"}} /> : dealer.companyName?.charAt(0)}
            </div>
            <div>
              <div style={{fontSize:"1rem", fontWeight:700, color:"#1A1A1A"}}>{dealer.companyName}</div>
              <div style={{fontSize:"0.78rem", color:"#737373"}}>{dealer.ownerName} &middot; {dealer.city || "-"}, {dealer.state || "-"}</div>
            </div>
            <div style={{marginLeft:"auto", textAlign:"right"}}>
              <div style={{fontSize:"0.68rem", fontFamily:"var(--font-mono)", color:"#A3A3A3"}}>{dealer.dealerId}</div>
              <div style={{fontSize:"0.72rem", color:"#F47B20", fontWeight:600, marginTop:"0.2rem", textTransform:"capitalize"}}>{dealer.status}</div>
            </div>
          </div>
          <div style={{display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"0.75rem"}}>
            {[
              {l:"Cars Listed", v:dealer.totalCarsListed || 0},
              {l:"Cars Sold", v:dealer.totalCarsSold || 0},
              {l:"Revenue", v:fmt(dealer.totalRevenue || 0)},
            ].map((s) => (
              <div key={s.l} style={{background:"#F5F5F5", borderRadius:"8px", padding:"0.75rem", textAlign:"center"}}>
                <div style={{fontFamily:"var(--font-display)", fontSize:"1.4rem", color:"#F47B20"}}>{s.v}</div>
                <div style={{fontSize:"0.68rem", color:"#737373", textTransform:"uppercase", letterSpacing:"0.06em"}}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No permissions */}
      {perms.length === 0 ? (
        <div style={{...cardStyle, alignItems:"center", textAlign:"center", padding:"3rem"}}>
          <div style={{fontSize:"0.875rem", color:"#1A1A1A", fontWeight:600}}>No permissions assigned yet</div>
          <div style={{fontSize:"0.825rem", color:"#737373", maxWidth:"360px", lineHeight:"1.6"}}>
            Contact your dealer admin to assign you permissions. They can manage this from their Staff Management page.
          </div>
        </div>
      ) : (
        <>
          {/* Permissions */}
          <div style={cardStyle}>
            <div style={{fontSize:"0.72rem", fontWeight:600, letterSpacing:"0.12em", textTransform:"uppercase", color:"#A3A3A3"}}>YOUR PERMISSIONS</div>
            <div style={{display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))", gap:"0.5rem"}}>
              {perms.map((p: string) => (
                <div key={p} style={{
                  display:"flex", alignItems:"center", gap:"0.5rem",
                  padding:"0.5rem 0.75rem", background:"#FFF7ED",
                  border:"1px solid rgba(244,123,32,0.25)", borderRadius:"6px",
                }}>
                  <span style={{width:"6px", height:"6px", borderRadius:"50%", background:"#F47B20", flexShrink:0}} />
                  <span style={{fontSize:"0.78rem", color:"#F47B20", textTransform:"capitalize"}}>{p.replace(/_/g," ")}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick access */}
          <div style={cardStyle}>
            <div style={{fontSize:"0.72rem", fontWeight:600, letterSpacing:"0.12em", textTransform:"uppercase", color:"#A3A3A3"}}>QUICK ACCESS</div>
            <div style={{display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))", gap:"0.75rem"}}>
              {perms.map((p: string) => {
                const route = PERM_ROUTES[p];
                if (!route) return null;
                const labels: Record<string,string> = {
                  view_inventory:"View Inventory", add_cars:"Add Car", edit_cars:"Edit Cars",
                  view_sales:"View Sales", record_sales:"Record Sale", view_movements:"Movements",
                  manage_movements:"Log Movement", view_cctv:"CCTV", view_reports:"Reports",
                  view_partners:"Partners",
                };
                if (!labels[p]) return null;
                return (
                  <Link key={p} href={route} style={{
                    background:"#F5F5F5", border:"1.5px solid #E5E5E5", borderRadius:"10px",
                    padding:"1rem", display:"flex", flexDirection:"column",
                    alignItems:"center", gap:"0.4rem", textDecoration:"none",
                    transition:"all 0.2s",
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor="#F47B20"; (e.currentTarget as HTMLElement).style.background="#FFF7ED"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor="#E5E5E5"; (e.currentTarget as HTMLElement).style.background="#F5F5F5"; }}>
                    <div style={{fontSize:"0.78rem", fontWeight:600, color:"#525252", textAlign:"center"}}>{labels[p]}</div>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Recent inventory */}
          {recentCars.length > 0 && (
            <div style={cardStyle}>
              <div style={{display:"flex", alignItems:"center", justifyContent:"space-between"}}>
                <div style={{fontSize:"0.72rem", fontWeight:600, letterSpacing:"0.12em", textTransform:"uppercase", color:"#A3A3A3"}}>RECENT INVENTORY</div>
                <Link href="/dashboard/staff/inventory" style={{fontSize:"0.78rem", color:"#F47B20", textDecoration:"none"}}>View all</Link>
              </div>
              <div style={{display:"flex", flexDirection:"column", gap:"0.5rem"}}>
                {recentCars.map((c: any) => (
                  <div key={c._id} style={{display:"flex", alignItems:"center", gap:"0.75rem", padding:"0.625rem 0", borderBottom:"1px solid #F5F5F5"}}>
                    <div style={{width:"44px", height:"34px", borderRadius:"6px", overflow:"hidden", background:"#F5F5F5", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, fontSize:"1rem"}}>
                      {c.images?.[0] ? <img src={c.images[0]} alt="" style={{width:"100%", height:"100%", objectFit:"cover"}} /> : "Car"}
                    </div>
                    <div style={{flex:1}}>
                      <div style={{fontSize:"0.85rem", fontWeight:500, color:"#1A1A1A"}}>{c.brand} {c.model} {c.year}</div>
                      <div style={{fontFamily:"var(--font-mono)", fontSize:"0.68rem", color:"#A3A3A3"}}>{c.carId}</div>
                    </div>
                    <div style={{textAlign:"right"}}>
                      <div style={{fontSize:"0.85rem", fontWeight:600, color:"#F47B20"}}>NGN {(c.sellingPrice||0).toLocaleString()}</div>
                      <div style={{fontSize:"0.68rem", color:"#737373", textTransform:"capitalize"}}>{c.status}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent sales */}
          {recentSales.length > 0 && (
            <div style={cardStyle}>
              <div style={{display:"flex", alignItems:"center", justifyContent:"space-between"}}>
                <div style={{fontSize:"0.72rem", fontWeight:600, letterSpacing:"0.12em", textTransform:"uppercase", color:"#A3A3A3"}}>RECENT SALES</div>
                <Link href="/dashboard/staff/sales" style={{fontSize:"0.78rem", color:"#F47B20", textDecoration:"none"}}>View all</Link>
              </div>
              <div style={{display:"flex", flexDirection:"column", gap:"0.5rem"}}>
                {recentSales.map((s: any) => (
                  <div key={s._id} style={{display:"flex", alignItems:"center", gap:"0.75rem", padding:"0.625rem 0", borderBottom:"1px solid #F5F5F5"}}>
                    <div style={{flex:1}}>
                      <div style={{fontSize:"0.85rem", fontWeight:500, color:"#1A1A1A"}}>{s.carBrand} {s.carModel} {s.carYear}</div>
                      <div style={{fontSize:"0.72rem", color:"#737373"}}>{s.buyerName || "Walk-in"} &middot; {fmtDate(s.soldAt)}</div>
                    </div>
                    <div style={{fontFamily:"var(--font-display)", fontSize:"1rem", color:"#F47B20"}}>
                      NGN {(s.sellingPrice||0).toLocaleString()}
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