"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";

interface Props {
  value: string;
  onSelect: (car: any) => void;
  placeholder?: string;
}

export default function CarIdSearch({ value, onSelect, placeholder }: Props) {
  const [q, setQ]             = useState(value || "");
  const [results, setResults] = useState<any[]>([]);
  const [open, setOpen]       = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => { setQ(value); }, [value]);

  useEffect(() => {
    if (q.length < 1) { setResults([]); return; }
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const r = await api.get("/api/v1/cars/", { params: { search: q, limit: 20 } });
        setResults(r.data?.cars || r.data || []);
        setOpen(true);
      } catch { setResults([]); }
      finally { setLoading(false); }
    }, 280);
    return () => clearTimeout(t);
  }, [q]);

  const sel = (c: any) => { onSelect(c); setQ(`${c.brand} ${c.model} ${c.year} — ${c.carId}`); setResults([]); setOpen(false); };

  const inp: React.CSSProperties = {background:"#F5F5F5",border:"1.5px solid #E5E5E5",borderRadius:"8px",padding:"0.75rem 1rem",color:"#1A1A1A",fontSize:"0.9rem",fontFamily:"var(--font-body)",outline:"none",width:"100%",boxSizing:"border-box" as const,transition:"border-color 0.2s",paddingRight:"2rem"};

  return (
    <div style={{position:"relative"}}>
      <input style={inp} value={q}
        placeholder={placeholder || "Search by Car ID, brand or model..."}
        onChange={e => { setQ(e.target.value); setOpen(true); }}
        onFocus={ev => { ev.target.style.borderColor="#F47B20"; setOpen(results.length > 0); }}
        onBlur={ev  => { ev.target.style.borderColor="#E5E5E5"; setTimeout(()=>setOpen(false), 200); }}
      />
      {loading && <div style={{position:"absolute",right:"0.75rem",top:"50%",transform:"translateY(-50%)",width:"14px",height:"14px",border:"2px solid #E5E5E5",borderTopColor:"#F47B20",borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>}
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      {open && results.length > 0 && (
        <div style={{position:"absolute",top:"calc(100% + 3px)",left:0,right:0,background:"#fff",border:"1.5px solid #E5E5E5",borderRadius:"10px",zIndex:200,maxHeight:"220px",overflowY:"auto",boxShadow:"0 8px 24px rgba(0,0,0,0.12)"}}>
          {results.map(c => (
            <div key={c.carId} onMouseDown={() => sel(c)}
              style={{display:"flex",alignItems:"center",gap:"0.75rem",padding:"0.625rem 0.875rem",cursor:"pointer",borderBottom:"1px solid #F5F5F5",transition:"background 0.15s"}}
              onMouseOver={e=>e.currentTarget.style.background="#FFF7ED"}
              onMouseOut={e=>e.currentTarget.style.background=""}>
              {c.images?.[0] && <img src={c.images[0]} alt="" style={{width:"44px",height:"34px",objectFit:"cover",borderRadius:"4px",flexShrink:0,border:"1px solid #E5E5E5"}}/>}
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontWeight:700,fontSize:"0.85rem",color:"#1A1A1A"}}>{c.brand} {c.model} {c.year}</div>
                <div style={{display:"flex",gap:"0.4rem",marginTop:"0.1rem",alignItems:"center",flexWrap:"wrap"}}>
                  <code style={{fontSize:"0.68rem",background:"#F0F0F0",padding:"0.1rem 0.35rem",borderRadius:"3px",color:"#525252"}}>{c.carId}</code>
                  {c.color && <span style={{fontSize:"0.68rem",color:"#A3A3A3"}}>{c.color}</span>}
                  {c.vin && <span style={{fontSize:"0.65rem",color:"#A3A3A3"}}>VIN:{c.vin}</span>}
                </div>
              </div>
              <span style={{fontFamily:"var(--font-display)",fontSize:"0.82rem",color:"#F47B20",fontWeight:700,flexShrink:0}}>₦{(c.sellingPrice||0).toLocaleString()}</span>
            </div>
          ))}
        </div>
      )}
      {open && q.length > 0 && results.length === 0 && !loading && (
        <div style={{position:"absolute",top:"calc(100% + 3px)",left:0,right:0,background:"#fff",border:"1.5px solid #E5E5E5",borderRadius:"8px",zIndex:200,padding:"1rem",textAlign:"center",fontSize:"0.825rem",color:"#A3A3A3",boxShadow:"0 8px 16px rgba(0,0,0,0.08)"}}>
          No cars found for "{q}"
        </div>
      )}
    </div>
  );
}
