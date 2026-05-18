"use client";
import { useState, useEffect } from "react";
import api from "@/lib/api";

export default function NotificationSettings() {
  const [permission, setPermission]   = useState<NotificationPermission|"unsupported">("default");
  const [locationPerm, setLocationPerm] = useState<PermissionState>("prompt");
  const [sound, setSound]             = useState(true);
  const [dnd, setDnd]                 = useState(false);
  const [subscribed, setSubscribed]   = useState(false);
  const [loading, setLoading]         = useState(false);
  const [msg, setMsg]                 = useState("");

  useEffect(() => {
    // Load prefs from localStorage
    try {
      const p = JSON.parse(localStorage.getItem("notif_prefs")||"{}");
      setSound(p.sound !== false);
      setDnd(p.dnd === true);
    } catch {}

    // Check notification permission
    if (!("Notification" in window)) { setPermission("unsupported"); return; }
    setPermission(Notification.permission);

    // Check location permission
    if (navigator.permissions) {
      navigator.permissions.query({name:"geolocation"}).then(r=>{
        setLocationPerm(r.state);
        r.onchange = () => setLocationPerm(r.state);
      }).catch(()=>{});
    }

    // Check if already subscribed
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.ready.then(reg => {
        reg.pushManager.getSubscription().then(sub => setSubscribed(!!sub));
      }).catch(()=>{});
    }
  }, []);

  const savePrefs = (updates: Record<string,any>) => {
    try {
      const current = JSON.parse(localStorage.getItem("notif_prefs")||"{}");
      localStorage.setItem("notif_prefs", JSON.stringify({...current,...updates}));
    } catch {}
  };

  const requestNotifications = async () => {
    if (!("Notification" in window)) { setMsg("Push notifications not supported in this browser."); return; }
    setLoading(true);
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      if (result === "granted") {
        await subscribeToWebPush();
        setMsg("✅ Notifications enabled!");
      } else if (result === "denied") {
        setMsg("Notifications blocked. Please allow them in your browser settings.");
      }
    } catch (e) { setMsg("Could not request notification permission."); }
    finally { setLoading(false); }
  };

  const subscribeToWebPush = async () => {
    if (!("serviceWorker" in navigator)) return;
    try {
      const reg = await navigator.serviceWorker.ready;
      // Get VAPID key from backend
      let vapidKey = "";
      try {
        const vRes = await api.get("/api/v1/push/vapid-public-key");
        vapidKey = vRes.data.publicKey || "";
      } catch {}

      if (!vapidKey) { console.log("[Push] No VAPID key configured — skipping subscribe"); return; }

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });
      await api.post("/api/v1/push/subscribe", sub.toJSON());
      setSubscribed(true);
    } catch (e) { console.error("[Push] Subscribe failed:", e); }
  };

  const unsubscribeFromPush = async () => {
    if (!("serviceWorker" in navigator)) return;
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await api.post("/api/v1/push/unsubscribe", { endpoint: sub.endpoint }).catch(()=>{});
        await sub.unsubscribe();
      }
      setSubscribed(false);
      setMsg("Notifications disabled.");
    } catch {}
  };

  const requestLocation = () => {
    if (!navigator.geolocation) { setMsg("Location not supported."); return; }
    navigator.geolocation.getCurrentPosition(
      pos => {
        setLocationPerm("granted");
        setMsg(`✅ Location access granted (${pos.coords.latitude.toFixed(3)}, ${pos.coords.longitude.toFixed(3)})`);
      },
      err => {
        setLocationPerm("denied");
        setMsg("Location denied. Enable it in your browser settings.");
      }
    );
  };

  const toggleSound = () => {
    const next = !sound; setSound(next); savePrefs({sound:next});
    setMsg(next ? "🔔 Notification sound enabled" : "🔕 Notification sound muted");
  };

  const toggleDnd = () => {
    const next = !dnd; setDnd(next); savePrefs({dnd:next});
    setMsg(next ? "🌙 Do Not Disturb: on — notifications will be silent" : "🔔 DND off — notifications restored");
  };

  const S = (on: boolean) => ({
    toggle: { width:"44px", height:"24px", borderRadius:"12px", border:"none", cursor:"pointer",
      position:"relative" as const, transition:"background 0.25s", background:on?"#F47B20":"#D4D4D4", flexShrink:0, padding:0 },
    knob: { position:"absolute" as const, top:"2px", left: on ? "22px" : "2px", width:"20px", height:"20px",
      borderRadius:"50%", background:"#fff", boxShadow:"0 1px 4px rgba(0,0,0,0.2)", transition:"left 0.25s" },
  });

  return (
    <div style={{display:"flex",flexDirection:"column",gap:"1rem"}}>
      {msg && (
        <div style={{background:"#F5F5F5",border:"1px solid #E5E5E5",borderRadius:"8px",padding:"0.75rem 1rem",fontSize:"0.8rem",color:"#525252",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <span>{msg}</span><button onClick={()=>setMsg("")} style={{background:"none",border:"none",cursor:"pointer",color:"#A3A3A3"}}>✕</button>
        </div>
      )}

      {/* Push Notifications */}
      <div style={{background:"#fff",border:"1.5px solid #E5E5E5",borderRadius:"10px",padding:"1.25rem",display:"flex",flexDirection:"column",gap:"1rem"}}>
        <div style={{fontSize:"0.68rem",fontWeight:700,letterSpacing:"0.15em",textTransform:"uppercase" as const,color:"#737373"}}>Push Notifications</div>

        {permission === "unsupported" && (
          <div style={{background:"#FFF7ED",border:"1px solid rgba(244,123,32,0.3)",borderRadius:"6px",padding:"0.75rem",fontSize:"0.8rem",color:"#C4621A"}}>
            Push notifications are not supported in this browser.
          </div>
        )}

        {permission === "denied" && (
          <div style={{background:"#FEF2F2",border:"1px solid #FCA5A5",borderRadius:"6px",padding:"0.75rem",fontSize:"0.8rem",color:"#DC2626",lineHeight:1.5}}>
            🚫 Notifications are blocked. Go to your browser Settings → Site Settings → Notifications → Allow for this site.
          </div>
        )}

        {permission === "default" && (
          <div>
            <p style={{fontSize:"0.8rem",color:"#525252",lineHeight:1.5,marginBottom:"0.75rem"}}>
              Allow CARSTRIMS to send you push notifications for messages, new listings from dealers you follow, and important updates.
            </p>
            <button onClick={requestNotifications} disabled={loading}
              style={{background:"#F47B20",color:"#fff",border:"none",borderRadius:"8px",padding:"0.75rem 1.5rem",fontFamily:"var(--font-display)",fontSize:"0.875rem",letterSpacing:"0.08em",cursor:"pointer",opacity:loading?0.6:1}}>
              {loading?"Requesting...":"🔔 Enable Push Notifications"}
            </button>
          </div>
        )}

        {permission === "granted" && (
          <div style={{display:"flex",flexDirection:"column",gap:"0.75rem"}}>
            <div style={{display:"flex",alignItems:"center",gap:"0.75rem",padding:"0.75rem",background:"#F0FDF4",borderRadius:"8px",border:"1px solid #86EFAC"}}>
              <span style={{fontSize:"1.1rem"}}>✅</span>
              <div style={{flex:1}}>
                <div style={{fontSize:"0.875rem",fontWeight:600,color:"#15803D"}}>Notifications Enabled</div>
                <div style={{fontSize:"0.72rem",color:"#737373"}}>{subscribed?"Subscribed to push notifications":"Click below to subscribe"}</div>
              </div>
              {subscribed ? (
                <button onClick={unsubscribeFromPush}
                  style={{background:"#FEF2F2",border:"1px solid #FCA5A5",color:"#DC2626",borderRadius:"6px",padding:"0.4rem 0.75rem",fontSize:"0.72rem",cursor:"pointer",fontFamily:"var(--font-body)",whiteSpace:"nowrap"}}>
                  Disable
                </button>
              ) : (
                <button onClick={subscribeToWebPush}
                  style={{background:"#F47B20",color:"#fff",border:"none",borderRadius:"6px",padding:"0.4rem 0.75rem",fontSize:"0.72rem",cursor:"pointer",fontFamily:"var(--font-display)",whiteSpace:"nowrap"}}>
                  Subscribe
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Sound + DND */}
      <div style={{background:"#fff",border:"1.5px solid #E5E5E5",borderRadius:"10px",padding:"1.25rem",display:"flex",flexDirection:"column",gap:"0.875rem"}}>
        <div style={{fontSize:"0.68rem",fontWeight:700,letterSpacing:"0.15em",textTransform:"uppercase" as const,color:"#737373"}}>Notification Preferences</div>
        {[
          { key:"sound", label:"Notification Sound", desc:"Play audio when a notification arrives", on:sound, toggle:toggleSound },
          { key:"dnd", label:"Do Not Disturb (DND)", desc:"Silence all notification sounds — still receive in-app notifications", on:dnd, toggle:toggleDnd },
        ].map(item=>(
          <div key={item.key} style={{display:"flex",alignItems:"center",gap:"1rem",justifyContent:"space-between",padding:"0.625rem 0",borderBottom:"1px solid #F5F5F5"}}>
            <div style={{flex:1}}>
              <div style={{fontSize:"0.875rem",fontWeight:500,color:"#1A1A1A"}}>{item.label}</div>
              <div style={{fontSize:"0.72rem",color:"#A3A3A3",marginTop:"0.15rem",lineHeight:1.4}}>{item.desc}</div>
            </div>
            <button style={S(item.on).toggle} onClick={item.toggle}>
              <div style={S(item.on).knob}/>
            </button>
          </div>
        ))}
      </div>

      {/* Location */}
      <div style={{background:"#fff",border:"1.5px solid #E5E5E5",borderRadius:"10px",padding:"1.25rem",display:"flex",flexDirection:"column",gap:"0.875rem"}}>
        <div style={{fontSize:"0.68rem",fontWeight:700,letterSpacing:"0.15em",textTransform:"uppercase" as const,color:"#737373"}}>Location Access</div>
        <div style={{fontSize:"0.8rem",color:"#525252",lineHeight:1.5}}>
          Location is used to show vehicles near you and improve search results. It is never stored or shared.
        </div>
        {locationPerm === "granted" ? (
          <div style={{background:"#F0FDF4",border:"1px solid #86EFAC",borderRadius:"8px",padding:"0.75rem",fontSize:"0.8rem",color:"#15803D",display:"flex",alignItems:"center",gap:"0.5rem"}}>
            ✅ Location access granted
          </div>
        ) : locationPerm === "denied" ? (
          <div style={{background:"#FEF2F2",border:"1px solid #FCA5A5",borderRadius:"8px",padding:"0.75rem",fontSize:"0.8rem",color:"#DC2626",lineHeight:1.5}}>
            🚫 Location blocked. Enable it in your browser settings → Site Settings → Location.
          </div>
        ) : (
          <button onClick={requestLocation}
            style={{background:"#1A1A1A",color:"#fff",border:"none",borderRadius:"8px",padding:"0.75rem 1.5rem",fontFamily:"var(--font-display)",fontSize:"0.875rem",letterSpacing:"0.08em",cursor:"pointer",alignSelf:"flex-start",transition:"background 0.2s"}}
            onMouseOver={e=>(e.currentTarget.style.background="#F47B20")}
            onMouseOut={e=>(e.currentTarget.style.background="#1A1A1A")}>
            📍 Allow Location Access
          </button>
        )}
      </div>
    </div>
  );
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)));
}
