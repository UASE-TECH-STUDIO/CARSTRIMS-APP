"use client";
import { useState, useEffect } from "react";
import api from "@/lib/api";

interface Car {
  carId: string;
  brand: string;
  model: string;
  year: number;
  color?: string;
  vin?: string;
  purchasePrice?: number;
  sellingPrice?: number;
  images?: string[];
  status?: string;
}

interface Props {
  car?: Car | null;              // pre-filled if opened from inventory card
  onClose: () => void;
  onSold: (txn: any) => void;
}

export default function MarkSoldModal({ car: initialCar, onClose, onSold }: Props) {
  const [car, setCar]           = useState<Car | null>(initialCar || null);
  const [carSearch, setCarSearch] = useState(initialCar ? `${initialCar.brand} ${initialCar.model} ${initialCar.year} — ${initialCar.carId}` : "");
  const [carResults, setCarResults] = useState<Car[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loadingCars, setLoadingCars] = useState(false);
  const [form, setForm] = useState({
    sellingPrice: initialCar?.sellingPrice?.toString() || "",
    purchasePrice: initialCar?.purchasePrice?.toString() || "",
    buyerName: "", buyerPhone: "", buyerEmail: "",
    paymentMethod: "cash", notes: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  // Search cars when typing in car search box
  useEffect(() => {
    if (initialCar) return; // skip if car was pre-filled
    if (carSearch.length < 1) { setCarResults([]); return; }
    const t = setTimeout(async () => {
      setLoadingCars(true);
      try {
        const r = await api.get("/api/v1/cars/", { params: { search: carSearch, status: "available", limit: 20 } });
        const cars = r.data?.cars || r.data || [];
        setCarResults(Array.isArray(cars) ? cars : []);
        setShowDropdown(true);
      } catch { setCarResults([]); }
      finally { setLoadingCars(false); }
    }, 300);
    return () => clearTimeout(t);
  }, [carSearch, initialCar]);

  const selectCar = (c: Car) => {
    setCar(c);
    setCarSearch(`${c.brand} ${c.model} ${c.year} — ${c.carId}`);
    setCarResults([]);
    setShowDropdown(false);
    setForm(f => ({
      ...f,
      sellingPrice: c.sellingPrice?.toString() || "",
      purchasePrice: c.purchasePrice?.toString() || "",
    }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!car) { setError("Please select a car first."); return; }
    setError(""); setLoading(true);
    try {
      const res = await api.post(`/api/v1/cars/${car.carId}/mark-sold`, {
        sellingPrice: parseFloat(form.sellingPrice),
        purchasePrice: form.purchasePrice ? parseFloat(form.purchasePrice) : undefined,
        buyerName: form.buyerName || undefined,
        buyerPhone: form.buyerPhone || undefined,
        buyerEmail: form.buyerEmail || undefined,
        paymentMethod: form.paymentMethod,
        notes: form.notes || undefined,
      });
      onSold(res.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to record sale. Please try again.");
    } finally { setLoading(false); }
  };

  const profit = form.sellingPrice && form.purchasePrice
    ? parseFloat(form.sellingPrice || "0") - parseFloat(form.purchasePrice || "0")
    : null;

  const inp: React.CSSProperties = {background:"#F5F5F5",border:"1.5px solid #E5E5E5",borderRadius:"8px",padding:"0.75rem 1rem",color:"#1A1A1A",fontSize:"0.9rem",fontFamily:"var(--font-body)",outline:"none",width:"100%",boxSizing:"border-box" as const,transition:"border-color 0.2s"};
  const lbl: React.CSSProperties = {fontSize:"0.7rem",fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase" as const,color:"#525252"};

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.55)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:"1rem",overflowY:"auto"}}>
      <div style={{background:"#fff",borderRadius:"16px",width:"100%",maxWidth:"540px",maxHeight:"90vh",overflowY:"auto",boxShadow:"0 16px 48px rgba(0,0,0,0.2)"}}>
        {/* Header */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"1.25rem 1.5rem",background:"#1A1A1A",borderRadius:"16px 16px 0 0"}}>
          <div>
            <div style={{fontFamily:"var(--font-display)",fontSize:"1rem",letterSpacing:"0.1em",color:"#F47B20"}}>RECORD SALE / MARK SOLD</div>
            <div style={{fontSize:"0.75rem",color:"#A3A3A3",marginTop:"0.2rem"}}>{car ? `${car.brand} ${car.model} ${car.year} · ${car.carId}` : "Search and select a car below"}</div>
          </div>
          <button onClick={onClose} style={{background:"rgba(255,255,255,0.12)",border:"none",color:"#fff",width:"32px",height:"32px",borderRadius:"50%",cursor:"pointer",fontSize:"1rem"}}>✕</button>
        </div>

        {/* Car context (if pre-filled from inventory) */}
        {car && car.images?.[0] && (
          <div style={{display:"flex",alignItems:"center",gap:"0.875rem",padding:"0.875rem 1.5rem",background:"#FFF7ED",borderBottom:"1px solid rgba(244,123,32,0.15)"}}>
            <img src={car.images[0]} alt="" style={{width:"60px",height:"46px",objectFit:"cover",borderRadius:"6px",flexShrink:0}}/>
            <div>
              <div style={{fontWeight:700,fontSize:"0.95rem",color:"#1A1A1A"}}>{car.brand} {car.model} {car.year}</div>
              <div style={{fontSize:"0.75rem",color:"#737373"}}>{[car.color, car.vin && `VIN: ${car.vin}`].filter(Boolean).join(" · ")}</div>
            </div>
          </div>
        )}

        <form onSubmit={submit} style={{padding:"1.5rem",display:"flex",flexDirection:"column",gap:"1rem"}}>
          {error && <div style={{background:"#FEF2F2",border:"1px solid #FCA5A5",color:"#DC2626",padding:"0.75rem",borderRadius:"8px",fontSize:"0.875rem"}}>{error}</div>}

          {/* Car search (only shown when not pre-filled from inventory) */}
          {!initialCar && (
            <div style={{display:"flex",flexDirection:"column",gap:"0.4rem",position:"relative"}}>
              <label style={lbl}>Search Car by ID, Brand or Model *</label>
              <div style={{position:"relative"}}>
                <input style={{...inp, paddingRight:"2.5rem"}}
                  placeholder="e.g. Toyota, CAR-XXXX, Camry..."
                  value={carSearch}
                  onChange={e => { setCarSearch(e.target.value); setCar(null); setShowDropdown(true); }}
                  onFocus={() => carResults.length > 0 && setShowDropdown(true)}
                  onFocus={(ev) => { ev.target.style.borderColor = "#F47B20"; setShowDropdown(true); }}
                  onBlur={ev => { ev.target.style.borderColor="#E5E5E5"; setTimeout(()=>setShowDropdown(false),200); }}
                />
                {loadingCars && <div style={{position:"absolute",right:"0.75rem",top:"50%",transform:"translateY(-50%)",width:"16px",height:"16px",border:"2px solid #E5E5E5",borderTopColor:"#F47B20",borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>}
                <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
              </div>
              {showDropdown && carResults.length > 0 && (
                <div style={{position:"absolute",top:"calc(100% + 2px)",left:0,right:0,background:"#fff",border:"1.5px solid #E5E5E5",borderRadius:"10px",zIndex:100,maxHeight:"200px",overflowY:"auto",boxShadow:"0 8px 24px rgba(0,0,0,0.12)"}}>
                  {carResults.map((c) => (
                    <div key={c.carId} onMouseDown={() => selectCar(c)}
                      style={{display:"flex",alignItems:"center",gap:"0.75rem",padding:"0.625rem 0.875rem",cursor:"pointer",borderBottom:"1px solid #F5F5F5",transition:"background 0.15s"}}
                      onMouseOver={e=>e.currentTarget.style.background="#FFF7ED"}
                      onMouseOut={e=>e.currentTarget.style.background=""}>
                      {c.images?.[0] && <img src={c.images[0]} alt="" style={{width:"44px",height:"34px",objectFit:"cover",borderRadius:"4px",flexShrink:0,border:"1px solid #E5E5E5"}}/>}
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontWeight:700,fontSize:"0.85rem",color:"#1A1A1A"}}>{c.brand} {c.model} {c.year}</div>
                        <div style={{display:"flex",gap:"0.5rem",alignItems:"center",marginTop:"0.1rem",flexWrap:"wrap"}}>
                          <span style={{fontSize:"0.68rem",fontFamily:"monospace",background:"#F5F5F5",padding:"0.1rem 0.35rem",borderRadius:"3px",color:"#525252"}}>{c.carId}</span>
                          {c.color && <span style={{fontSize:"0.68rem",color:"#A3A3A3"}}>{c.color}</span>}
                          {c.sellingPrice && <span style={{fontSize:"0.75rem",color:"#F47B20",fontFamily:"var(--font-display)",fontWeight:700}}>₦{c.sellingPrice.toLocaleString()}</span>}
                        </div>
                      </div>
                      <span style={{fontSize:"0.7rem",color:"#F47B20",flexShrink:0}}>Select →</span>
                    </div>
                  ))}
                </div>
              )}
              {showDropdown && carSearch.length > 1 && carResults.length === 0 && !loadingCars && (
                <div style={{position:"absolute",top:"calc(100% + 2px)",left:0,right:0,background:"#fff",border:"1.5px solid #E5E5E5",borderRadius:"8px",zIndex:100,padding:"1rem",textAlign:"center",fontSize:"0.825rem",color:"#A3A3A3",boxShadow:"0 8px 24px rgba(0,0,0,0.1)"}}>No available cars found matching "{carSearch}"</div>
              )}
              {car && (
                <div style={{background:"#F0FDF4",border:"1px solid #86EFAC",borderRadius:"6px",padding:"0.5rem 0.875rem",fontSize:"0.78rem",color:"#15803D",fontWeight:600,display:"flex",alignItems:"center",gap:"0.4rem"}}>
                  ✓ Selected: {car.brand} {car.model} {car.year} ({car.carId})
                  <button type="button" onClick={()=>{setCar(null);setCarSearch("");}} style={{background:"none",border:"none",color:"#DC2626",cursor:"pointer",marginLeft:"auto",fontSize:"0.8rem"}}>✕ Change</button>
                </div>
              )}
            </div>
          )}

          {/* Prices */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"1rem"}}>
            <div style={{display:"flex",flexDirection:"column",gap:"0.4rem"}}>
              <label style={lbl}>Selling Price (₦) *</label>
              <input style={inp} type="number" min="0" step="1000" placeholder="e.g. 5000000"
                value={form.sellingPrice} onChange={e=>setForm({...form,sellingPrice:e.target.value})} required
                onFocus={ev=>ev.target.style.borderColor="#F47B20"} onBlur={ev=>ev.target.style.borderColor="#E5E5E5"}/>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:"0.4rem"}}>
              <label style={lbl}>Cost / Purchase Price (₦)</label>
              <input style={inp} type="number" min="0" step="1000" placeholder="Auto-filled if set"
                value={form.purchasePrice} onChange={e=>setForm({...form,purchasePrice:e.target.value})}
                onFocus={ev=>ev.target.style.borderColor="#F47B20"} onBlur={ev=>ev.target.style.borderColor="#E5E5E5"}/>
            </div>
          </div>

          {/* Payment */}
          <div style={{display:"flex",flexDirection:"column",gap:"0.4rem"}}>
            <label style={lbl}>Payment Method *</label>
            <select style={{...inp,cursor:"pointer"}} value={form.paymentMethod} onChange={e=>setForm({...form,paymentMethod:e.target.value})}>
              {[["cash","Cash"],["bank_transfer","Bank Transfer"],["card","Card / POS"],["installment","Installment"],["other","Other"]].map(([v,l])=><option key={v} value={v}>{l}</option>)}
            </select>
          </div>

          {/* Buyer details */}
          <div style={{background:"#F5F5F5",borderRadius:"10px",padding:"1rem",display:"flex",flexDirection:"column",gap:"0.75rem"}}>
            <div style={{fontSize:"0.68rem",fontWeight:700,letterSpacing:"0.12em",color:"#A3A3A3",textTransform:"uppercase" as const}}>Buyer Details (Optional)</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0.75rem"}}>
              <div style={{display:"flex",flexDirection:"column",gap:"0.4rem"}}>
                <label style={lbl}>Buyer Name</label>
                <input style={{...inp,background:"#fff"}} placeholder="Full name" value={form.buyerName} onChange={e=>setForm({...form,buyerName:e.target.value})} onFocus={ev=>ev.target.style.borderColor="#F47B20"} onBlur={ev=>ev.target.style.borderColor="#E5E5E5"}/>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:"0.4rem"}}>
                <label style={lbl}>Buyer Phone</label>
                <input style={{...inp,background:"#fff"}} placeholder="+234..." value={form.buyerPhone} onChange={e=>setForm({...form,buyerPhone:e.target.value})} onFocus={ev=>ev.target.style.borderColor="#F47B20"} onBlur={ev=>ev.target.style.borderColor="#E5E5E5"}/>
              </div>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:"0.4rem"}}>
              <label style={lbl}>Buyer Email</label>
              <input style={{...inp,background:"#fff"}} type="email" placeholder="buyer@email.com" value={form.buyerEmail} onChange={e=>setForm({...form,buyerEmail:e.target.value})} onFocus={ev=>ev.target.style.borderColor="#F47B20"} onBlur={ev=>ev.target.style.borderColor="#E5E5E5"}/>
            </div>
          </div>

          {/* Notes */}
          <div style={{display:"flex",flexDirection:"column",gap:"0.4rem"}}>
            <label style={lbl}>Notes / Remarks</label>
            <textarea style={{...inp,minHeight:"70px",resize:"vertical" as const}} placeholder="Any notes about this sale..." value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} onFocus={ev=>ev.target.style.borderColor="#F47B20"} onBlur={ev=>ev.target.style.borderColor="#E5E5E5"}/>
          </div>

          {/* Profit preview */}
          {profit !== null && (
            <div style={{background:profit >= 0 ? "#F0FDF4" : "#FEF2F2",border:`1px solid ${profit >= 0 ? "#86EFAC" : "#FCA5A5"}`,borderRadius:"8px",padding:"0.875rem",display:"flex",gap:"1.25rem",flexWrap:"wrap"}}>
              {[
                ["Selling Price", `₦${parseFloat(form.sellingPrice||"0").toLocaleString()}`, "#F47B20"],
                ["Cost Price",    `₦${parseFloat(form.purchasePrice||"0").toLocaleString()}`, "#737373"],
                ["Gross Profit",  `₦${profit.toLocaleString()}`, profit >= 0 ? "#16A34A" : "#DC2626"],
              ].map(([l,v,c]) => (
                <div key={l} style={{flex:1,minWidth:"100px"}}>
                  <div style={{fontSize:"0.65rem",color:"#737373",fontWeight:600,textTransform:"uppercase" as const,letterSpacing:"0.06em"}}>{l}</div>
                  <div style={{fontSize:"1rem",fontWeight:700,color:c as string,fontFamily:"var(--font-display)"}}>{v}</div>
                </div>
              ))}
            </div>
          )}

          <div style={{display:"flex",gap:"0.75rem",marginTop:"0.5rem"}}>
            <button type="button" onClick={onClose}
              style={{flex:1,background:"#F5F5F5",border:"1.5px solid #E5E5E5",color:"#525252",borderRadius:"10px",padding:"0.875rem",fontFamily:"var(--font-body)",fontSize:"0.9rem",cursor:"pointer",fontWeight:600}}>
              Cancel
            </button>
            <button type="submit" disabled={loading || !form.sellingPrice || !car}
              style={{flex:2,background:loading||!form.sellingPrice||!car?"#D4D4D4":"#F47B20",color:"#fff",border:"none",borderRadius:"10px",padding:"0.875rem",fontFamily:"var(--font-display)",fontSize:"0.95rem",letterSpacing:"0.1em",cursor:loading||!form.sellingPrice||!car?"not-allowed":"pointer",transition:"background 0.2s",fontWeight:700}}>
              {loading ? "Recording sale..." : "CONFIRM SALE ✓"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
