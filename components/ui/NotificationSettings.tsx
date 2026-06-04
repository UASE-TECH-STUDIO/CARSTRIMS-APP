"use client";
import { useState, useEffect } from "react";
import api from "@/lib/api";

const VAPID_KEY =
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
  "BH0r2Dd_OpixbO8ASpLrGDp_VRMJxFxEiQrf4cicFkW49x_CemB-NvDJ7UNVcZafE3Y56N67nMfYbciuD4h-4vY";

function b64ToUint8(b64: string): Uint8Array {
  const pad  = "=".repeat((4 - b64.length % 4) % 4);
  const base = (b64 + pad).replace(/-/g, "+").replace(/_/g, "/");
  return Uint8Array.from([...atob(base)].map(c => c.charCodeAt(0)));
}

type Sound  = "music"|"beep"|"none";
type Flavor = "success"|"error"|"info";

export default function NotificationSettings() {
  const [perm,     setPerm]     = useState("loading");
  const [subbed,   setSubbed]   = useState(false);
  const [sound,    setSound]    = useState<Sound>("music");
  const [dnd,      setDnd]      = useState(false);
  const [banner,   setBanner]   = useState<{msg:string;f:Flavor}|null>(null);
  const [busy,     setBusy]     = useState(false);
  const [locPerm,  setLocPerm]  = useState("prompt");

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const p = JSON.parse(localStorage.getItem("notif_prefs")||"{}");
      setSound(p.soundType || (p.sound===false?"beep":"music"));
      setDnd(!!p.dnd);
    } catch {}
    if (!("Notification" in window)) { setPerm("unsupported"); return; }
    setPerm(Notification.permission);
    if ("serviceWorker" in navigator)
      navigator.serviceWorker.ready
        .then(r => r.pushManager.getSubscription().then(s => setSubbed(!!s)))
        .catch(()=>{});
    if (navigator.permissions)
      navigator.permissions.query({name:"geolocation"})
        .then(r => { setLocPerm(r.state); r.onchange=()=>setLocPerm(r.state); })
        .catch(()=>{});
  }, []);

  const save = (u: Record<string,any>) => {
    try { localStorage.setItem("notif_prefs", JSON.stringify({...JSON.parse(localStorage.getItem("notif_prefs")||"{}"), ...u})); }
    catch {}
  };

  const flash = (msg: string, f: Flavor="info") => {
    setBanner({msg,f}); setTimeout(()=>setBanner(null), 4500);
  };

  const playPreview = (s: Sound) => {
    if (s==="none") return;
    if (s==="music") {
      try { const a=new Audio("/audio.mp3"); a.volume=0.7; a.play().catch(()=>{}); } catch {} return;
    }
    try {
      const ctx=new ((window as any).AudioContext||(window as any).webkitAudioContext)();
      const osc=ctx.createOscillator(), g=ctx.createGain();
      osc.connect(g); g.connect(ctx.destination);
      osc.frequency.value=880;
      g.gain.setValueAtTime(0.3,ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+0.35);
      osc.start(); osc.stop(ctx.currentTime+0.35);
    } catch {}
  };

  const subscribe = async () => {
    if (!("serviceWorker" in navigator)) return false;
    try {
      const reg = await navigator.serviceWorker.ready;
      let key = VAPID_KEY;
      try { const r=await api.get("/api/v1/push/vapid-public-key"); if(r.data?.publicKey) key=r.data.publicKey; } catch {}
      const sub = await reg.pushManager.subscribe({userVisibleOnly:true, applicationServerKey:b64ToUint8(key)});
      await api.post("/api/v1/push/subscribe", sub.toJSON());
      setSubbed(true); return true;
    } catch(e) { console.error("[Push]",e); return false; }
  };

  const unsubscribe = async () => {
    try {
      const reg=await navigator.serviceWorker.ready, sub=await reg.pushManager.getSubscription();
      if (sub) { await api.post("/api/v1/push/unsubscribe",{endpoint:sub.endpoint}).catch(()=>{}); await sub.unsubscribe(); }
      setSubbed(false);
    } catch {}
  };

  const enablePush = async () => {
    if (!("Notification" in window)) { flash("Push not supported in this browser.","error"); return; }
    setBusy(true);
    try {
      let p = Notification.permission;
      if (p==="default") { p=await Notification.requestPermission(); setPerm(p); }
      if (p==="denied") { flash("Notifications are blocked. Click the lock icon in your browser address bar, set Notifications to Allow, then refresh.","error"); return; }
      const ok = await subscribe();
      if (ok) {
        save({pushOn:true});
        flash("Push notifications enabled on this device!","success");
        const reg=await navigator.serviceWorker.ready;
        reg.showNotification("CARSTRIMS Notifications Active", {
          body:"You will receive alerts even when the app is closed.",
          icon:"/icon-192.png", badge:"/icon-72.png",
        });
      } else {
        flash("Could not subscribe. Make sure VAPID keys are set in Render, then try Refresh.","error");
      }
    } catch(e:any) { flash("Error: "+(e.message||"unknown"),"error"); }
    finally { setBusy(false); }
  };

  const disablePush = async () => {
    setBusy(true);
    try { await unsubscribe(); save({pushOn:false}); flash("Push notifications disabled on this device.","info"); }
    catch {} finally { setBusy(false); }
  };

  const refreshPush = async () => {
    setBusy(true);
    try {
      await unsubscribe();
      const ok = await subscribe();
      flash(ok?"Subscription refreshed! Push is active again.":"Refresh failed  try Enable.","info");
    } catch {} finally { setBusy(false); }
  };

  const changeSound = (s: Sound) => {
    setSound(s); save({soundType:s, sound:s!=="none"});
    const m: Record<Sound,string> = {music:"Sound set to music (audio.mp3)",beep:"Sound set to beep tone",none:"Sound muted"};
    flash(m[s],"info");
    if (s!=="none") playPreview(s);
  };

  const toggleDnd = () => {
    const n=!dnd; setDnd(n); save({dnd:n});
    flash(n?"Do Not Disturb ON  sounds silenced":"Do Not Disturb OFF  sounds restored","info");
  };

  const askLocation = () => {
    if (!navigator.geolocation) { flash("Location not supported.","error"); return; }
    navigator.geolocation.getCurrentPosition(
      () => { setLocPerm("granted"); flash("Location access granted.","success"); },
      () => { setLocPerm("denied");  flash("Location blocked. Enable in browser Settings.","error"); }
    );
  };

  const Tog = (on: boolean, col="#F47B20") => ({
    btn: {width:"48px",height:"26px",borderRadius:"13px",border:"none",
      cursor:busy?"not-allowed":"pointer",position:"relative" as const,
      transition:"background .25s",background:on?col:"#D4D4D4",
      flexShrink:0 as const,padding:0,opacity:busy?.5:1} as React.CSSProperties,
    dot: {position:"absolute" as const,top:"3px",left:on?"25px":"3px",
      width:"20px",height:"20px",borderRadius:"50%",background:"#fff",
      boxShadow:"0 1px 4px rgba(0,0,0,.22)",transition:"left .25s"} as React.CSSProperties,
  });

  const BC = {
    success:{bg:"#F0FDF4",bd:"#86EFAC",c:"#15803D"},
    error:  {bg:"#FEF2F2",bd:"#FCA5A5",c:"#DC2626"},
    info:   {bg:"#EFF6FF",bd:"#BFDBFE",c:"#1D4ED8"},
  };

  const card: React.CSSProperties = {
    background:"#fff",border:"1.5px solid #E5E5E5",borderRadius:"10px",
    padding:"1.25rem",display:"flex",flexDirection:"column",gap:"0.1rem",
    marginBottom:"0",
  };
  const secTitle: React.CSSProperties = {
    fontSize:"0.65rem",fontWeight:700,letterSpacing:"0.15em",
    textTransform:"uppercase" as const,color:"#737373",marginBottom:"0.75rem",
  };
  const row: React.CSSProperties = {
    display:"flex",alignItems:"center",gap:"1rem",justifyContent:"space-between",
    padding:"0.75rem 0",borderBottom:"1px solid #F5F5F5",
  };
  const rowLabel: React.CSSProperties = {fontSize:"0.875rem",fontWeight:500,color:"#1A1A1A"};
  const rowDesc: React.CSSProperties = {fontSize:"0.7rem",color:"#A3A3A3",marginTop:"0.15rem",lineHeight:1.4};

  const SmBtn = ({label,onClick,bg="#F5F5F5",col="#525252",bd="1.5px solid #E5E5E5"}:
    {label:string;onClick:()=>void;bg?:string;col?:string;bd?:string}) => (
    <button onClick={onClick} disabled={busy}
      style={{background:bg,color:col,border:bd,borderRadius:"7px",
        padding:"0.35rem 0.875rem",fontSize:"0.78rem",cursor:busy?"not-allowed":"pointer",
        fontWeight:600,whiteSpace:"nowrap" as const,opacity:busy?.5:1,
        fontFamily:"var(--font-body)",transition:"all .15s"}}>
      {label}
    </button>
  );

  return (
    <div style={{display:"flex",flexDirection:"column",gap:"1rem"}}>

      {banner&&(
        <div style={{background:BC[banner.f].bg,border:`1px solid ${BC[banner.f].bd}`,
          borderRadius:"8px",padding:"0.75rem 1rem",fontSize:"0.82rem",
          color:BC[banner.f].c,fontWeight:500,lineHeight:1.5,
          display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:"0.5rem"}}>
          <span>{banner.msg}</span>
          <button onClick={()=>setBanner(null)}
            style={{background:"none",border:"none",cursor:"pointer",color:"inherit",fontSize:"1rem"}}>x</button>
        </div>
      )}

      {/* PUSH */}
      <div style={card}>
        <div style={secTitle}>Push Notifications</div>

        {perm==="loading"&&<div style={{fontSize:"0.8rem",color:"#A3A3A3",padding:"0.5rem 0"}}>Checking permission...</div>}

        {perm==="unsupported"&&(
          <div style={{background:"#FFF7ED",border:"1px solid rgba(244,123,32,.3)",borderRadius:"7px",
            padding:"0.875rem",fontSize:"0.82rem",color:"#C4621A",lineHeight:1.5}}>
            Push notifications not supported in this browser. Use Chrome, Edge, or Firefox.
          </div>
        )}

        {perm==="denied"&&(
          <div style={{background:"#FEF2F2",border:"1px solid #FECACA",borderRadius:"7px",
            padding:"0.875rem",fontSize:"0.82rem",color:"#DC2626",lineHeight:1.6}}>
            <strong>Notifications are blocked.</strong><br/>
            Click the lock icon in your browser address bar &rarr; Notifications &rarr; Allow &rarr; then refresh this page.
          </div>
        )}

        {(perm==="default"||perm==="granted")&&(<>
          <div style={{fontSize:"0.78rem",color:"#737373",lineHeight:1.5,marginBottom:"0.625rem"}}>
            Receive instant alerts on this device for messages, requests, appointments and all activity  even when the app is closed.
          </div>

          <div style={{display:"flex",alignItems:"center",gap:"0.875rem",padding:"0.875rem",
            background:subbed?"#F0FDF4":"#F9F9F9",
            border:`1.5px solid ${subbed?"#86EFAC":"#E5E5E5"}`,borderRadius:"9px",marginBottom:"0.5rem"}}>
            <div style={{width:"10px",height:"10px",borderRadius:"50%",flexShrink:0,
              background:subbed?"#16A34A":"#D4D4D4"}}/>
            <div style={{flex:1}}>
              <div style={{fontSize:"0.875rem",fontWeight:600,color:subbed?"#15803D":"#525252"}}>
                {subbed?"Active on this device":"Not active on this device"}
              </div>
              <div style={{fontSize:"0.7rem",color:"#737373",marginTop:"0.1rem"}}>
                {subbed?"Push alerts will arrive even when app is closed"
                  :perm==="default"?"Tap Enable to allow notifications on this device"
                  :"Tap Enable to start receiving push alerts"}
              </div>
            </div>
          </div>

          <div style={row}>
            <div><div style={rowLabel}>Push on this device</div>
              <div style={rowDesc}>Subscribe or unsubscribe this browser/device</div>
            </div>
            <div style={{display:"flex",gap:"0.5rem"}}>
              {subbed
                ? <SmBtn label="Disable" onClick={disablePush} bg="#FEF2F2" col="#DC2626" bd="1px solid #FECACA"/>
                : <SmBtn label="Enable"  onClick={enablePush}  bg="#F47B20" col="#fff"    bd="none"/>
              }
            </div>
          </div>

          {perm==="granted"&&(
            <div style={row}>
              <div>
                <div style={rowLabel}>Refresh subscription</div>
                <div style={rowDesc}>Push stopped working after a key change or browser update? Tap Refresh.</div>
              </div>
              <SmBtn label="Refresh" onClick={refreshPush}/>
            </div>
          )}
        </>)}
      </div>

      {/* SOUND */}
      <div style={card}>
        <div style={secTitle}>Notification Sound</div>

        <div style={row}>
          <div>
            <div style={rowLabel}>Alert Sound</div>
            <div style={rowDesc}>What plays when a push notification arrives</div>
          </div>
          <div style={{display:"flex",gap:"0.375rem"}}>
            {(["music","beep","none"] as Sound[]).map(s=>(
              <button key={s} onClick={()=>changeSound(s)}
                style={{background:sound===s?"#F47B20":"#F5F5F5",
                  color:sound===s?"#fff":"#525252",
                  border:`1.5px solid ${sound===s?"#F47B20":"#E5E5E5"}`,
                  borderRadius:"7px",padding:"0.35rem 0.65rem",fontSize:"0.73rem",
                  cursor:"pointer",fontWeight:sound===s?700:400,transition:"all .15s",
                  whiteSpace:"nowrap" as const}}>
                {s==="music"?"Music":s==="beep"?"Beep":"Silent"}
              </button>
            ))}
          </div>
        </div>

        {sound!=="none"&&(
          <div style={row}>
            <div>
              <div style={rowLabel}>{sound==="music"?"Music  audio.mp3":"System Beep"}</div>
              <div style={rowDesc}>{sound==="music"?"Your custom notification tune":"Built-in tone"}</div>
            </div>
            <SmBtn label="Preview" onClick={()=>playPreview(sound)}/>
          </div>
        )}

        <div style={{...row,borderBottom:"none"}}>
          <div>
            <div style={rowLabel}>Do Not Disturb</div>
            <div style={rowDesc}>Mute sounds temporarily. Push alerts still arrive silently.</div>
          </div>
          <button style={Tog(dnd,"#1A1A1A").btn} onClick={toggleDnd}>
            <div style={Tog(dnd,"#1A1A1A").dot}/>
          </button>
        </div>
      </div>

      {/* LOCATION */}
      <div style={card}>
        <div style={secTitle}>Location Access</div>
        <div style={{fontSize:"0.78rem",color:"#737373",lineHeight:1.5,marginBottom:"0.625rem"}}>
          Used to show vehicles near you. Never stored or shared.
        </div>
        {locPerm==="granted"
          ? <div style={{background:"#F0FDF4",border:"1px solid #86EFAC",borderRadius:"7px",padding:"0.75rem",fontSize:"0.82rem",color:"#15803D"}}>Location access granted</div>
          : locPerm==="denied"
          ? <div style={{background:"#FEF2F2",border:"1px solid #FECACA",borderRadius:"7px",padding:"0.875rem",fontSize:"0.82rem",color:"#DC2626",lineHeight:1.5}}>
              Location blocked. Enable in browser Settings &rarr; Site Settings &rarr; Location &rarr; Allow carstrims.com
            </div>
          : <button onClick={askLocation}
              style={{background:"#1A1A1A",color:"#fff",border:"none",borderRadius:"8px",
                padding:"0.75rem 1.5rem",fontFamily:"var(--font-display)",fontSize:"0.875rem",
                letterSpacing:"0.08em",cursor:"pointer",alignSelf:"flex-start" as const}}
              onMouseOver={e=>(e.currentTarget.style.background="#F47B20")}
              onMouseOut={e=>(e.currentTarget.style.background="#1A1A1A")}>
              Allow Location Access
            </button>
        }
      </div>

    </div>
  );
}
