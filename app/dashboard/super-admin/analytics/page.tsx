"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";

export default function AdminAnalyticsPage() {
  const [stats, setStats] = useState<any>(null);
  const [growth, setGrowth] = useState<any[]>([]);
  const [topDealers, setTopDealers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(()=>{
    const fetchAll = async () => {
      setLoading(true); setErr("");
      try {
        const [sRes, gRes, tRes] = await Promise.all([
          api.get("/api/v1/admin/stats"),
          api.get("/api/v1/admin/growth"),
          api.get("/api/v1/admin/top-dealers?limit=10"),
        ]);
        setStats(sRes.data);
        setGrowth(Array.isArray(gRes.data)?gRes.data:[]);
        setTopDealers(Array.isArray(tRes.data)?tRes.data:[]);
      } catch(e:any) {
        setErr("Failed to load analytics: "+(e.response?.data?.detail||e.message));
      } finally { setLoading(false); }
    };
    fetchAll();
  },[]);

  const fmt = (n: number) => `₦${(n||0).toLocaleString()}`;
  const maxRev = Math.max(...growth.map(g=>g.revenue||0),1);
  const maxDealers = Math.max(...growth.map(g=>g.newDealers||0),1);
  const maxUsers = Math.max(...growth.map(g=>g.newUsers||0),1);

  if (loading) return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"60vh",flexDirection:"column",gap:"1rem"}}>
      <div style={{width:"32px",height:"32px",border:"3px solid #E5E5E5",borderTopColor:"#F47B20",borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{fontSize:"0.825rem",color:"#737373"}}>Loading analytics...</div>
    </div>
  );

  if (err) return (
    <div style={{padding:"2rem",background:"#FEF2F2",border:"1px solid #FCA5A5",borderRadius:"12px",color:"#DC2626",fontSize:"0.875rem"}}>
      {err}<br/><button onClick={()=>window.location.reload()} style={{marginTop:"0.75rem",background:"#DC2626",color:"#fff",border:"none",borderRadius:"6px",padding:"0.5rem 1rem",cursor:"pointer",fontFamily:"var(--font-body)"}}>Retry</button>
    </div>
  );

  const statCards = [
    {label:"Total Dealers",value:stats?.dealers?.total||0,sub:`${stats?.dealers?.active||0} active`,color:"#F47B20",icon:"🏢"},
    {label:"Pending Approval",value:stats?.dealers?.pending||0,sub:"Awaiting review",color:"#D97706",icon:"⏳"},
    {label:"Suspended",value:stats?.dealers?.suspended||0,sub:"Restricted accounts",color:"#DC2626",icon:"⛔"},
    {label:"Total Users",value:stats?.users?.total||0,sub:`${stats?.users?.staff||0} staff`,color:"#3B8BD4",icon:"👥"},
    {label:"Total Cars",value:stats?.inventory?.totalCars||0,sub:`${stats?.inventory?.totalSold||0} sold`,color:"#7C3AED",icon:"🚗"},
    {label:"All-time Revenue",value:fmt(stats?.revenue?.allTime||0),sub:`${stats?.revenue?.totalTransactions||0} transactions`,color:"#16A34A",icon:"💰"},
    {label:"This Month Revenue",value:fmt(stats?.revenue?.thisMonth||0),sub:`${stats?.revenue?.monthTransactions||0} sales this month`,color:"#F47B20",icon:"📈"},
    {label:"New Dealers (Month)",value:stats?.dealers?.thisMonth||0,sub:"Registered this month",color:"#1D9E75",icon:"✨"},
  ];

  return (
    <div style={{display:"flex",flexDirection:"column",gap:"1.75rem",fontFamily:"var(--font-body)"}}>
      <div>
        <h2 style={{fontFamily:"var(--font-display)",fontSize:"1.6rem",letterSpacing:"0.05em",color:"#1A1A1A",lineHeight:1}}>Platform Analytics</h2>
        <p style={{fontSize:"0.8rem",color:"#737373",marginTop:"0.3rem"}}>Live platform performance overview</p>
      </div>

      {/* Stat cards */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))",gap:"1rem"}}>
        {statCards.map(s=>(
          <div key={s.label} style={{background:"#fff",border:"1.5px solid #E5E5E5",borderRadius:"10px",padding:"1.1rem 1.25rem",display:"flex",flexDirection:"column",gap:"0.4rem",position:"relative",overflow:"hidden"}}>
            <div style={{display:"flex",alignItems:"center",gap:"0.5rem"}}>
              <span style={{fontSize:"1rem"}}>{s.icon}</span>
              <span style={{fontSize:"0.68rem",fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase" as const,color:"#737373"}}>{s.label}</span>
            </div>
            <div style={{fontFamily:"var(--font-display)",fontSize:"1.8rem",letterSpacing:"0.02em",color:s.color,lineHeight:1}}>{s.value}</div>
            <div style={{fontSize:"0.72rem",color:"#A3A3A3"}}>{s.sub}</div>
            <div style={{position:"absolute",top:0,left:0,width:"3px",height:"100%",background:s.color,opacity:0.4}}/>
          </div>
        ))}
      </div>

      {/* Revenue chart */}
      {growth.length>0&&(
        <div style={{background:"#fff",border:"1.5px solid #E5E5E5",borderRadius:"12px",padding:"1.5rem"}}>
          <div style={{fontFamily:"var(--font-display)",fontSize:"0.78rem",letterSpacing:"0.15em",color:"#737373",marginBottom:"1.25rem"}}>MONTHLY REVENUE (6 MONTHS)</div>
          {growth.every(g=>g.revenue===0)?(
            <div style={{textAlign:"center",padding:"2rem",color:"#A3A3A3",fontSize:"0.875rem"}}>No sales data yet. Revenue will appear here as cars are sold.</div>
          ):(
            <div style={{display:"flex",alignItems:"flex-end",gap:"12px",height:"180px",paddingBottom:"1.5rem",overflowX:"auto"}}>
              {growth.map((g,i)=>(
                <div key={i} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:"4px",minWidth:"52px",position:"relative",flex:1}}>
                  <div style={{fontSize:"0.68rem",color:"#1A1A1A",fontWeight:600,position:"absolute",bottom:"calc(100% + 2px)",whiteSpace:"nowrap",fontSize:"0.62rem"}}>{g.revenue>0?`₦${(g.revenue/1000).toFixed(0)}k`:""}</div>
                  <div style={{background:"rgba(244,123,32,0.6)",borderRadius:"4px 4px 0 0",width:"100%",minHeight:"4px",transition:"height 0.3s",height:`${Math.max(4,(g.revenue/maxRev)*150)}px`}}/>
                  <div style={{fontSize:"0.7rem",color:"#737373",marginTop:"2px"}}>{g.month}</div>
                  {g.sales>0&&<div style={{fontSize:"0.6rem",color:"#A3A3A3"}}>{g.sales} sales</div>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Dealer + User registrations */}
      {growth.length>0&&(
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"1.25rem"}}>
          <div style={{background:"#fff",border:"1.5px solid #E5E5E5",borderRadius:"12px",padding:"1.5rem"}}>
            <div style={{fontFamily:"var(--font-display)",fontSize:"0.78rem",letterSpacing:"0.15em",color:"#737373",marginBottom:"1.25rem"}}>NEW DEALER REGISTRATIONS</div>
            {growth.every(g=>g.newDealers===0)?(
              <div style={{textAlign:"center",padding:"1.5rem",color:"#A3A3A3",fontSize:"0.825rem"}}>No registrations in this period yet.</div>
            ):(
              <div style={{display:"flex",alignItems:"flex-end",gap:"8px",height:"120px",paddingBottom:"1.25rem"}}>
                {growth.map((g,i)=>(
                  <div key={i} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:"3px",flex:1,minWidth:"36px"}}>
                    {g.newDealers>0&&<div style={{fontSize:"0.6rem",color:"#D97706",fontWeight:600}}>{g.newDealers}</div>}
                    <div style={{background:"rgba(201,168,76,0.6)",borderRadius:"3px 3px 0 0",width:"100%",minHeight:"3px",height:`${Math.max(3,(g.newDealers/maxDealers)*100)}px`}}/>
                    <div style={{fontSize:"0.65rem",color:"#737373"}}>{g.month}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div style={{background:"#fff",border:"1.5px solid #E5E5E5",borderRadius:"12px",padding:"1.5rem"}}>
            <div style={{fontFamily:"var(--font-display)",fontSize:"0.78rem",letterSpacing:"0.15em",color:"#737373",marginBottom:"1.25rem"}}>NEW USER REGISTRATIONS</div>
            {growth.every(g=>g.newUsers===0)?(
              <div style={{textAlign:"center",padding:"1.5rem",color:"#A3A3A3",fontSize:"0.825rem"}}>No registrations in this period yet.</div>
            ):(
              <div style={{display:"flex",alignItems:"flex-end",gap:"8px",height:"120px",paddingBottom:"1.25rem"}}>
                {growth.map((g,i)=>(
                  <div key={i} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:"3px",flex:1,minWidth:"36px"}}>
                    {g.newUsers>0&&<div style={{fontSize:"0.6rem",color:"#3B8BD4",fontWeight:600}}>{g.newUsers}</div>}
                    <div style={{background:"rgba(59,139,212,0.6)",borderRadius:"3px 3px 0 0",width:"100%",minHeight:"3px",height:`${Math.max(3,(g.newUsers/maxUsers)*100)}px`}}/>
                    <div style={{fontSize:"0.65rem",color:"#737373"}}>{g.month}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Dealer breakdown */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"1.25rem"}}>
        <div style={{background:"#fff",border:"1.5px solid #E5E5E5",borderRadius:"12px",padding:"1.5rem",display:"flex",flexDirection:"column",gap:"0.75rem"}}>
          <div style={{fontFamily:"var(--font-display)",fontSize:"0.78rem",letterSpacing:"0.15em",color:"#737373"}}>DEALER BREAKDOWN</div>
          {[
            {label:"Approved / Active",val:stats?.dealers?.active||0,color:"#16A34A"},
            {label:"Awaiting Approval",val:stats?.dealers?.pending||0,color:"#D97706"},
            {label:"Suspended",val:stats?.dealers?.suspended||0,color:"#DC2626"},
            {label:"Total Dealers",val:stats?.dealers?.total||0,color:"#1A1A1A"},
          ].map(b=>(
            <div key={b.label} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0.625rem 0",borderBottom:"1px solid #F5F5F5"}}>
              <span style={{fontSize:"0.825rem",color:"#737373"}}>{b.label}</span>
              <span style={{fontFamily:"var(--font-display)",fontSize:"1.4rem",color:b.color,letterSpacing:"0.02em"}}>{b.val}</span>
            </div>
          ))}
        </div>
        <div style={{background:"#fff",border:"1.5px solid #E5E5E5",borderRadius:"12px",padding:"1.5rem",display:"flex",flexDirection:"column",gap:"0.75rem"}}>
          <div style={{fontFamily:"var(--font-display)",fontSize:"0.78rem",letterSpacing:"0.15em",color:"#737373"}}>REVENUE SUMMARY</div>
          {[
            {label:"All-time Revenue",val:fmt(stats?.revenue?.allTime||0),color:"#16A34A"},
            {label:"This Month",val:fmt(stats?.revenue?.thisMonth||0),color:"#F47B20"},
            {label:"Total Transactions",val:(stats?.revenue?.totalTransactions||0).toString(),color:"#3B8BD4"},
            {label:"Cars Sold",val:(stats?.inventory?.totalSold||0).toString(),color:"#7C3AED"},
          ].map(b=>(
            <div key={b.label} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0.625rem 0",borderBottom:"1px solid #F5F5F5"}}>
              <span style={{fontSize:"0.825rem",color:"#737373"}}>{b.label}</span>
              <span style={{fontFamily:"var(--font-display)",fontSize:"1.2rem",color:b.color,letterSpacing:"0.02em"}}>{b.val}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Top dealers */}
      {topDealers.length>0&&(
        <div style={{background:"#fff",border:"1.5px solid #E5E5E5",borderRadius:"12px",padding:"1.5rem"}}>
          <div style={{fontFamily:"var(--font-display)",fontSize:"0.78rem",letterSpacing:"0.15em",color:"#737373",marginBottom:"1.25rem"}}>TOP 10 DEALERS BY SALES</div>
          <div style={{overflowX:"auto"}}>
            <table style={{width:"100%",borderCollapse:"collapse",minWidth:"600px"}}>
              <thead>
                <tr>
                  {["#","Company","Location","Cars Sold","Revenue","Status"].map(h=>(
                    <th key={h} style={{padding:"0.65rem 0.875rem",textAlign:"left",fontSize:"0.68rem",fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase" as const,color:"#737373",borderBottom:"1.5px solid #E5E5E5"}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {topDealers.map(d=>(
                  <tr key={d._id} style={{borderBottom:"1px solid #F5F5F5"}}>
                    <td style={{padding:"0.75rem 0.875rem",fontFamily:"monospace",fontSize:"0.75rem",color:"#F47B20",fontWeight:700}}>#{d.rank}</td>
                    <td style={{padding:"0.75rem 0.875rem"}}>
                      <div style={{fontWeight:500,fontSize:"0.875rem",color:"#1A1A1A"}}>{d.companyName}</div>
                      <div style={{fontSize:"0.68rem",color:"#A3A3A3",fontFamily:"monospace"}}>{d.dealerId}</div>
                    </td>
                    <td style={{padding:"0.75rem 0.875rem",fontSize:"0.8rem",color:"#737373"}}>{d.city||"—"}, {d.state||"—"}</td>
                    <td style={{padding:"0.75rem 0.875rem",textAlign:"center",fontFamily:"monospace",fontSize:"0.875rem"}}>{d.totalCarsSold||0}</td>
                    <td style={{padding:"0.75rem 0.875rem",color:"#16A34A",fontWeight:500,fontSize:"0.875rem"}}>{fmt(d.totalRevenue||0)}</td>
                    <td style={{padding:"0.75rem 0.875rem"}}>
                      <span style={{padding:"0.2rem 0.5rem",borderRadius:"20px",fontSize:"0.65rem",textTransform:"capitalize" as const,border:"1px solid #E5E5E5",color:"#737373"}}>{d.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {topDealers.length===0&&!loading&&(
        <div style={{background:"#fff",border:"1.5px solid #E5E5E5",borderRadius:"12px",padding:"2rem",textAlign:"center",color:"#A3A3A3",fontSize:"0.875rem"}}>
          Top dealers table will appear here once dealers have recorded sales.
        </div>
      )}

      <style>{`@media(max-width:768px){div[style*="grid-template-columns:1fr 1fr"]{grid-template-columns:1fr!important}}`}</style>
    </div>
  );
}
