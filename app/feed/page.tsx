"use client";
import FeedFooter from "@/components/layout/FeedFooter";
import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

const BRANDS = ["Toyota","Honda","Mercedes","BMW","Lexus","Ford","Hyundai","Kia","Chevrolet","Audi","Land Rover","Jeep","Volkswagen","Nissan","Mazda","Peugeot","Mitsubishi","Subaru","Volvo","Porsche"];
const CONDITIONS = ["brand_new","foreign_used","locally_used"];
const TRANSMISSIONS = ["automatic","manual","semi-automatic"];
const FUEL_TYPES = ["petrol","diesel","electric","hybrid","gas"];
const PRICE_RANGES = [
  { label:"Under 1M", min:0, max:1000000 },
  { label:"1M - 3M", min:1000000, max:3000000 },
  { label:"3M - 5M", min:3000000, max:5000000 },
  { label:"5M - 10M", min:5000000, max:10000000 },
  { label:"10M - 20M", min:10000000, max:20000000 },
  { label:"Above 20M", min:20000000, max:0 },
];
const STATES_NG = ["Abuja","Lagos","Kano","Rivers","Oyo","Kaduna","Anambra","Enugu","Delta","Ogun","Imo","Ondo","Kwara","Benue","Edo","Ekiti","Cross River"];
const YEARS = Array.from({ length:20 }, (_, i) => String(new Date().getFullYear() - i));
const STATUS_COLORS: Record<string,string> = { available:"#16A34A", sold:"#737373", reserved:"#D97706", out_for_inspection:"#525252" };

interface Car {
  _id:string; carId:string; brand:string; model:string; year:number;
  color:string; sellingPrice:number; promoPrice?:number; status:string;
  images:string[]; viewCount:number; likeCount:number;
  city?:string; state?:string; transmission?:string; fuelType?:string;
  dealerName?:string; dealerLogo?:string; condition?:string;
}

export default function FeedPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const [cars, setCars] = useState<Car[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const skipRef = useRef(0);

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("");
  const [showFilter, setShowFilter] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  const [fStatus, setFStatus] = useState("available");
  const [fPrice, setFPrice] = useState("");
  const [fCondition, setFCondition] = useState("");
  const [fTransmission, setFTransmission] = useState("");
  const [fFuel, setFFuel] = useState("");
  const [fState, setFState] = useState("");
  const [fYearFrom, setFYearFrom] = useState("");
  const [fYearTo, setFYearTo] = useState("");
  const [fMinPrice, setFMinPrice] = useState("");
  const [fMaxPrice, setFMaxPrice] = useState("");
  const [fColor, setFColor] = useState("");

  const [userLikes, setUserLikes] = useState<string[]>([]);
  const [userFavs, setUserFavs] = useState<string[]>([]);
  const [showScan, setShowScan] = useState(false);
  const [scanInput, setScanInput] = useState("");

  const LIMIT = 20;

  const activeFilters = [
    fStatus !== "available" ? fStatus : "",
    fPrice, fCondition, fTransmission, fFuel, fState,
    fYearFrom || fYearTo ? `${fYearFrom||"?"}-${fYearTo||"?"}` : "",
    fMinPrice || fMaxPrice ? "custom price" : "",
    fColor,
  ].filter(Boolean);

  const buildParams = useCallback((skip = 0) => {
    const p: any = { skip, limit: LIMIT };
    if (search) p.search = search;
    if (selectedBrand) p.brand = selectedBrand;
    if (fState) p.city = fState;
    if (fStatus && fStatus !== "all") p.status = fStatus;
    if (fCondition) p.condition = fCondition;
    if (fTransmission) p.transmission = fTransmission;
    if (fFuel) p.fuel_type = fFuel;
    if (fYearFrom) p.year_from = fYearFrom;
    if (fYearTo) p.year_to = fYearTo;
    if (fColor) p.color = fColor;
    if (fPrice) {
      const range = PRICE_RANGES.find((r) => r.label === fPrice);
      if (range) { if (range.min) p.min_price = range.min; if (range.max) p.max_price = range.max; }
    } else {
      if (fMinPrice) p.min_price = Number(fMinPrice);
      if (fMaxPrice) p.max_price = Number(fMaxPrice);
    }
    return p;
  }, [search, selectedBrand, fStatus, fCondition, fTransmission, fFuel, fState, fYearFrom, fYearTo, fColor, fPrice, fMinPrice, fMaxPrice]);

  const fetchCars = useCallback(async (reset = false) => {
    if (reset) { setLoading(true); skipRef.current = 0; }
    else setLoadingMore(true);
    try {
      const res = await api.get("/api/v1/public/cars", { params: buildParams(reset ? 0 : skipRef.current) });
      const newCars = res.data.cars || [];
      setTotal(res.data.total || 0);
      if (reset) { setCars(newCars); skipRef.current = LIMIT; }
      else { setCars((p) => [...p, ...newCars]); skipRef.current += LIMIT; }
    } catch { } finally { setLoading(false); setLoadingMore(false); }
  }, [buildParams]);

  useEffect(() => { fetchCars(true); }, [search, selectedBrand, fStatus, fCondition, fTransmission, fFuel, fState, fYearFrom, fYearTo, fColor, fPrice, fMinPrice, fMaxPrice]);
  useEffect(() => {
    if (isAuthenticated) {
      api.get("/api/v1/users/likes").then((r) => setUserLikes(r.data || [])).catch(() => {});
      api.get("/api/v1/users/favorites").then((r) => setUserFavs((r.data||[]).map((f:any) => f.carId))).catch(() => {});
    }
  }, [isAuthenticated]);

  // Close filter dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setShowFilter(false);
      }
    };
    if (showFilter) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showFilter]);

  const handleLike = async (e: React.MouseEvent, carId: string) => {
    e.preventDefault(); e.stopPropagation();
    if (!isAuthenticated) {
      // Allow guest likes visually
      setCars((p) => p.map((c) => c.carId === carId ? {...c, likeCount: c.likeCount+1} : c));
      return;
    }
    try {
      const res = await api.post(`/api/v1/public/cars/${carId}/like`);
      if (res.data.liked) {
        setUserLikes((p) => [...p, carId]);
        setCars((p) => p.map((c) => c.carId === carId ? {...c, likeCount:c.likeCount+1} : c));
      } else {
        setUserLikes((p) => p.filter((id) => id !== carId));
        setCars((p) => p.map((c) => c.carId === carId ? {...c, likeCount:Math.max(0,c.likeCount-1)} : c));
      }
    } catch { }
  };

  const handleFav = async (e: React.MouseEvent, carId: string) => {
    e.preventDefault(); e.stopPropagation();
    if (!isAuthenticated) { router.push("/auth/login"); return; }
    try {
      if (userFavs.includes(carId)) {
        await api.delete(`/api/v1/public/cars/${carId}/favorite`);
        setUserFavs((p) => p.filter((id) => id !== carId));
      } else {
        await api.post(`/api/v1/public/cars/${carId}/favorite`);
        setUserFavs((p) => [...p, carId]);
      }
    } catch { }
  };

  const handleShare = async (e: React.MouseEvent, car: Car) => {
    e.preventDefault(); e.stopPropagation();
    const url = `${window.location.origin}/cars/${car.carId}`;
    if (navigator.share) navigator.share({ title:`${car.brand} ${car.model}`, url });
    else { await navigator.clipboard.writeText(url); alert("Link copied!"); }
  };

  const clearAll = () => {
    setSearch(""); setSearchInput(""); setSelectedBrand("");
    setFStatus("available"); setFPrice(""); setFCondition(""); setFTransmission("");
    setFFuel(""); setFState(""); setFYearFrom(""); setFYearTo("");
    setFMinPrice(""); setFMaxPrice(""); setFColor("");
  };

  const handleScan = () => {
    if (!scanInput.trim()) return;
    const input = scanInput.trim().toUpperCase();
    if (input.startsWith("DLR-")) router.push(`/dealers/${input}`);
    else if (input.includes("/DEALERS/")) {
      const id = input.split("/DEALERS/")[1]?.split(/[?#]/)[0];
      if (id) router.push(`/dealers/${id}`);
    } else router.push(`/dealers/${input}`);
    setShowScan(false); setScanInput("");
  };

  const openCamera = async () => {
    setShowScan(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video:{facingMode:"environment"} });
      const ov = document.createElement("div");
      ov.style.cssText = "position:fixed;inset:0;background:rgba(23,23,23,0.95);z-index:9999;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1.5rem";
      const vid = document.createElement("video"); vid.srcObject = stream; vid.play();
      vid.style.cssText = "width:90vw;max-width:420px;border-radius:16px;border:3px solid #F47B20";
      const lbl = document.createElement("p"); lbl.innerText = "Point camera at dealer QR code";
      lbl.style.cssText = "color:#E5E5E5;font-size:1rem;font-family:sans-serif;text-align:center";
      const close = document.createElement("button");
      close.innerText = "Close Camera";
      close.style.cssText = "background:#F47B20;color:#fff;border:none;padding:0.75rem 2rem;border-radius:50px;font-size:1rem;cursor:pointer";
      close.onclick = () => { stream.getTracks().forEach((t) => t.stop()); document.body.removeChild(ov); };
      ov.appendChild(lbl); ov.appendChild(vid); ov.appendChild(close);
      document.body.appendChild(ov);
      if ("BarcodeDetector" in window) {
        const det = new (window as any).BarcodeDetector({ formats:["qr_code"] });
        const scan = async () => {
          try {
            const codes = await det.detect(vid);
            if (codes.length > 0) {
              const raw = codes[0].rawValue;
              stream.getTracks().forEach((t) => t.stop());
              document.body.removeChild(ov);
              if (raw.includes("/dealers/")) router.push(`/dealers/${raw.split("/dealers/")[1]?.split(/[?#]/)[0]}`);
              else if (raw.toUpperCase().startsWith("DLR-")) router.push(`/dealers/${raw.toUpperCase()}`);
              else { setScanInput(raw); setShowScan(true); }
              return;
            }
          } catch { }
          requestAnimationFrame(scan);
        };
        vid.onloadedmetadata = () => requestAnimationFrame(scan);
      }
    } catch { setShowScan(true); }
  };

  const fmt = (n: number) => "N" + (n||0).toLocaleString();
  const myDash = user?.role === "SYSTEM_ADMIN" ? "/dashboard/super-admin" : user?.role === "DEALER_ADMIN" ? "/dashboard/dealer" : user?.role === "PARTNER_USER" ? "/dashboard/partner" : user?.role === "DEALER_STAFF" ? "/dashboard/staff" : "/dashboard/user";

  return (
    <div className="feed">
      {/* TOPBAR */}
      <header className="feed-topbar">
        <Link href="/feed" className="feed-brand">CARSTRIMS</Link>

        <form className="search-form" onSubmit={(e) => { e.preventDefault(); setSearch(searchInput); }}>
          <div className="search-box">
            <span className="s-icon">S</span>
            <input className="search-input" placeholder="Search brand, model, year..."
              value={searchInput} onChange={(e) => setSearchInput(e.target.value)} />
            {searchInput && <button type="button" className="s-clear" onClick={() => { setSearchInput(""); setSearch(""); }}>X</button>}
          </div>

          {/* FILTER DROPDOWN */}
          <div className="filter-wrap" ref={filterRef}>
            <button type="button" className={`filter-btn ${showFilter?"open":""}`} onClick={() => setShowFilter(!showFilter)}>
              Filter
              {activeFilters.length > 0 && <span className="filter-badge">{activeFilters.length}</span>}
            </button>

            {showFilter && (
              <div className="filter-dropdown">
                <div className="fd-inner">
                  <div className="fd-section">
                    <div className="fd-label">Status</div>
                    <div className="fd-pills">
                      {["available","sold","all"].map((s) => (
                        <button key={s} type="button" className={`fd-pill ${fStatus===s?"active":""}`} onClick={() => setFStatus(s)}>{s}</button>
                      ))}
                    </div>
                  </div>

                  <div className="fd-section">
                    <div className="fd-label">Price Range</div>
                    <div className="fd-pills">
                      {PRICE_RANGES.map((r) => (
                        <button key={r.label} type="button" className={`fd-pill ${fPrice===r.label?"active":""}`}
                          onClick={() => { setFPrice(fPrice===r.label?"":r.label); setFMinPrice(""); setFMaxPrice(""); }}>
                          {r.label}
                        </button>
                      ))}
                    </div>
                    <div className="fd-row">
                      <input type="number" className="fd-input" placeholder="Min N" value={fMinPrice} onChange={(e) => { setFMinPrice(e.target.value); setFPrice(""); }} />
                      <span className="fd-dash">to</span>
                      <input type="number" className="fd-input" placeholder="Max N" value={fMaxPrice} onChange={(e) => { setFMaxPrice(e.target.value); setFPrice(""); }} />
                    </div>
                  </div>

                  <div className="fd-section">
                    <div className="fd-label">Condition</div>
                    <div className="fd-pills">
                      {CONDITIONS.map((c) => (
                        <button key={c} type="button" className={`fd-pill ${fCondition===c?"active":""}`}
                          onClick={() => setFCondition(fCondition===c?"":c)}>{c.replace(/_/g," ")}</button>
                      ))}
                    </div>
                  </div>

                  <div className="fd-two-col">
                    <div className="fd-section">
                      <div className="fd-label">Transmission</div>
                      <div className="fd-pills">
                        {TRANSMISSIONS.map((t) => (
                          <button key={t} type="button" className={`fd-pill ${fTransmission===t?"active":""}`}
                            onClick={() => setFTransmission(fTransmission===t?"":t)}>{t}</button>
                        ))}
                      </div>
                    </div>
                    <div className="fd-section">
                      <div className="fd-label">Fuel Type</div>
                      <div className="fd-pills">
                        {FUEL_TYPES.map((f) => (
                          <button key={f} type="button" className={`fd-pill ${fFuel===f?"active":""}`}
                            onClick={() => setFFuel(fFuel===f?"":f)}>{f}</button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="fd-section">
                    <div className="fd-label">State / Location</div>
                    <div className="fd-pills">
                      {STATES_NG.map((s) => (
                        <button key={s} type="button" className={`fd-pill ${fState===s?"active":""}`}
                          onClick={() => setFState(fState===s?"":s)}>{s}</button>
                      ))}
                    </div>
                  </div>

                  <div className="fd-section">
                    <div className="fd-label">Year Range</div>
                    <div className="fd-row">
                      <select className="fd-input fd-select" value={fYearFrom} onChange={(e) => setFYearFrom(e.target.value)}>
                        <option value="">From year</option>
                        {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                      </select>
                      <span className="fd-dash">to</span>
                      <select className="fd-input fd-select" value={fYearTo} onChange={(e) => setFYearTo(e.target.value)}>
                        <option value="">To year</option>
                        {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="fd-section">
                    <div className="fd-label">Color</div>
                    <input className="fd-input fd-color" placeholder="e.g. Black, White, Red..." value={fColor} onChange={(e) => setFColor(e.target.value)} />
                  </div>
                </div>

                <div className="fd-footer">
                  <button type="button" className="fd-clear" onClick={clearAll}>Clear All</button>
                  <button type="button" className="fd-apply" onClick={() => setShowFilter(false)}>Apply Filters</button>
                </div>
              </div>
            )}
          </div>
        </form>

        <div className="topbar-right">
            {isAuthenticated ? (
            <Link href={myDash} className="dash-btn">My Dashboard</Link>
          ) : (
            <div className="auth-btns">
              <Link href="/auth/login" className="login-btn">Login</Link>
              <Link href="/auth/register" className="register-btn">Register</Link>
            </div>
          )}
        </div>
      </header>

      {/* ACTIVE FILTER TAGS */}
      {activeFilters.length > 0 && (
        <div className="active-bar">
          <span className="ab-label">Filtered:</span>
          {selectedBrand && <span className="af-tag">{selectedBrand} <button onClick={() => setSelectedBrand("")}>x</button></span>}
          {fStatus !== "available" && <span className="af-tag">{fStatus} <button onClick={() => setFStatus("available")}>x</button></span>}
          {fPrice && <span className="af-tag">N{fPrice} <button onClick={() => setFPrice("")}>x</button></span>}
          {fCondition && <span className="af-tag">{fCondition.replace(/_/g," ")} <button onClick={() => setFCondition("")}>x</button></span>}
          {fState && <span className="af-tag">{fState} <button onClick={() => setFState("")}>x</button></span>}
          {fTransmission && <span className="af-tag">{fTransmission} <button onClick={() => setFTransmission("")}>x</button></span>}
          {fFuel && <span className="af-tag">{fFuel} <button onClick={() => setFFuel("")}>x</button></span>}
          {fColor && <span className="af-tag">{fColor} <button onClick={() => setFColor("")}>x</button></span>}
          <button className="ab-clear" onClick={clearAll}>Clear all</button>
        </div>
      )}

      {/* BRAND TABS */}
      <div className="brand-scroll">
        <div className="brand-tabs">
          <button className={`btab ${!selectedBrand?"active":""}`} onClick={() => setSelectedBrand("")}>All Cars</button>
          {BRANDS.map((b) => (
            <button key={b} className={`btab ${selectedBrand===b?"active":""}`} onClick={() => setSelectedBrand(selectedBrand===b?"":b)}>{b}</button>
          ))}
        </div>
      </div>

      {/* FEED INFO */}
      <div className="feed-info">
        <span className="feed-count">{total.toLocaleString()} cars found</span>
        {!isAuthenticated && <span className="guest-note">Login to save favorites and post comments</span>}
      </div>

      {/* GRID */}
      {loading ? (
        <div className="cars-grid">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="car-skel">
              <div className="sk-img" />
              <div className="sk-body">
                <div className="sk-line w80" /><div className="sk-line" /><div className="sk-line w40" />
              </div>
            </div>
          ))}
        </div>
      ) : cars.length === 0 ? (
        <div className="empty">
          <div className="empty-icon">[ ]</div>
          <h3>No cars found</h3>
          <p>Try adjusting your search or removing some filters</p>
          <button className="fd-clear" onClick={clearAll}>Clear All Filters</button>
        </div>
      ) : (
        <>
          <div className="cars-grid">
            {cars.map((car) => (
              <Link key={car._id} href={`/cars/${car.carId}`} className="car-card">
                <div className="car-img-wrap">
                  {car.images?.[0]
                    ? <img src={car.images[0]} alt="" loading="lazy" />
                    : <div className="car-ph">No Image</div>
                  }
                  <div className="car-status-tag" style={{background:STATUS_COLORS[car.status]||"#737373"}}>
                    {car.status.replace(/_/g," ")}
                  </div>
                  {car.promoPrice && car.promoPrice < car.sellingPrice && (
                    <div className="promo-tag">PROMO</div>
                  )}
                  <div className="card-actions">
                    <button className={`ca-btn ${userLikes.includes(car.carId)?"liked":""}`}
                      onClick={(e) => handleLike(e, car.carId)}>
                      {userLikes.includes(car.carId) ? "LIKED" : "LIKE"} {car.likeCount||0}
                    </button>
                    <button className={`ca-btn ${userFavs.includes(car.carId)?"faved":""}`}
                      onClick={(e) => handleFav(e, car.carId)}>
                      {userFavs.includes(car.carId) ? "SAVED" : "SAVE"}
                    </button>
                    <button className="ca-btn" onClick={(e) => handleShare(e, car)}>SHARE</button>
                  </div>
                </div>

                {car.dealerName && (
                  <div className="dealer-strip">
                    <div className="ds-logo">{car.dealerLogo?<img src={car.dealerLogo} alt=""/>:car.dealerName?.charAt(0)||"D"}</div>
                    <span className="ds-name">{car.dealerName}</span>
                    {car.state && <span className="ds-loc">{car.state}</span>}
                  </div>
                )}

                <div className="car-info">
                  <div className="car-name">{car.brand} {car.model}</div>
                  <div className="car-sub">{car.year}{car.color?` - ${car.color}`:""}{car.transmission?` - ${car.transmission}`:""}</div>
                  {car.city && <div className="car-loc">{car.city}{car.state?`, ${car.state}`:""}</div>}
                  <div className="price-row">
                    <span className="car-price">{fmt(car.sellingPrice)}</span>
                    {car.promoPrice && car.promoPrice < car.sellingPrice && (
                      <span className="car-promo">{fmt(car.promoPrice)}</span>
                    )}
                  </div>
                  <div className="card-footer">
                    <span className="view-ct">Views: {car.viewCount||0}</span>
                    <span className="view-deal">View Deal</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          {skipRef.current < total && (
            <div className="lm-wrap">
              <button className="lm-btn" onClick={() => fetchCars(false)} disabled={loadingMore}>
                {loadingMore ? "Loading..." : `Load More (${total - cars.length} remaining)`}
              </button>
            </div>
          )}
        </>
      )}

      <FeedFooter onScan={() => setShowScan(true)} />
      {/* QR SCAN MODAL */}
      {showScan && (
        <div className="scan-overlay" onClick={() => setShowScan(false)}>
          <div className="scan-modal" onClick={(e) => e.stopPropagation()}>
            <div className="scan-head">
              <h3 className="scan-title">SCAN DEALER QR</h3>
              <button className="scan-x" onClick={() => setShowScan(false)}>X</button>
            </div>
            <div className="scan-body">
              <div className="scan-big-icon">[ QR ]</div>
              <p className="scan-desc">Enter a Dealer ID or paste a dealer link below</p>
              <input className="scan-input" placeholder="e.g. DLR-XXXXXXXX"
                value={scanInput} onChange={(e) => setScanInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleScan()} autoFocus />
              <button className="scan-go" onClick={handleScan} disabled={!scanInput.trim()}>
                Go to Dealer Page
              </button>
              <button className="scan-cam" onClick={openCamera}>
                Open Camera to Scan QR Code
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        * { box-sizing:border-box; }
        .feed { min-height:100vh; background:#F5F5F5; display:flex; flex-direction:column; font-family:var(--font-body); }

        /* -- TOPBAR --------------------------- */
        .feed-topbar {
          height:60px; background:#fff; border-bottom:1.5px solid #E5E5E5;
          display:flex; align-items:center; gap:0.875rem; padding:0 1.25rem;
          position:sticky; top:0; z-index:200; box-shadow:0 2px 8px rgba(0,0,0,0.05);
        }
        .feed-brand {
          font-family:var(--font-display); font-size:1.2rem; letter-spacing:0.2em;
          color:#F47B20; text-decoration:none; flex-shrink:0;
        }
        .search-form { display:flex; align-items:center; gap:0.5rem; flex:1; min-width:0; position:relative; }
        .search-box {
          flex:1; display:flex; align-items:center; background:#F5F5F5;
          border:1.5px solid #E5E5E5; border-radius:8px; overflow:hidden; transition:border-color 0.2s;
        }
        .search-box:focus-within { border-color:#F47B20; background:#fff; }
        .s-icon { padding:0 0.75rem; font-size:0.75rem; font-weight:700; color:#A3A3A3; flex-shrink:0; letter-spacing:0.05em; }
        .search-input { flex:1; background:transparent; border:none; padding:0.625rem 0.5rem; color:#171717; font-size:0.875rem; font-family:var(--font-body); outline:none; min-width:0; }
        .search-input::placeholder { color:#A3A3A3; }
        .s-clear { background:none; border:none; color:#A3A3A3; cursor:pointer; padding:0 0.5rem; font-size:0.75rem; font-weight:700; }

        /* Filter dropdown */
        .filter-wrap { position:relative; flex-shrink:0; }
        .filter-btn {
          display:flex; align-items:center; gap:0.375rem;
          background:#fff; border:1.5px solid #E5E5E5; border-radius:8px;
          padding:0.55rem 0.875rem; color:#525252; font-size:0.825rem; cursor:pointer;
          transition:all 0.2s; white-space:nowrap; font-family:var(--font-body);
        }
        .filter-btn:hover, .filter-btn.open { border-color:#F47B20; color:#F47B20; background:#FFF7ED; }
        .filter-badge {
          background:#F47B20; color:#fff; border-radius:50%;
          width:18px; height:18px; display:flex; align-items:center; justify-content:center;
          font-size:0.65rem; font-weight:700;
        }

        /* Dropdown panel */
        .filter-dropdown {
          position:absolute; top:calc(100% + 8px); right:0; width:480px; max-width:96vw;
          background:#fff; border:1.5px solid #E5E5E5; border-radius:12px;
          box-shadow:0 16px 48px rgba(0,0,0,0.14); z-index:300; overflow:hidden;
        }
        .fd-inner { padding:1.25rem; display:flex; flex-direction:column; gap:1rem; max-height:70vh; overflow-y:auto; }
        .fd-section { display:flex; flex-direction:column; gap:0.5rem; }
        .fd-label { font-size:0.65rem; font-weight:700; letter-spacing:0.12em; text-transform:uppercase; color:#737373; }
        .fd-pills { display:flex; flex-wrap:wrap; gap:0.3rem; }
        .fd-pill {
          background:#F5F5F5; border:1.5px solid #E5E5E5; border-radius:20px;
          padding:0.25rem 0.75rem; font-size:0.75rem; cursor:pointer;
          font-family:var(--font-body); color:#525252; transition:all 0.15s;
          text-transform:capitalize; white-space:nowrap;
        }
        .fd-pill:hover { border-color:#F47B20; color:#F47B20; background:#FFF7ED; }
        .fd-pill.active { background:#F47B20; color:#fff; border-color:#F47B20; }
        .fd-two-col { display:grid; grid-template-columns:1fr 1fr; gap:1rem; }
        .fd-row { display:flex; align-items:center; gap:0.5rem; margin-top:0.35rem; }
        .fd-input {
          background:#F5F5F5; border:1.5px solid #E5E5E5; border-radius:6px;
          padding:0.5rem 0.75rem; color:#171717; font-size:0.825rem;
          font-family:var(--font-body); outline:none; transition:border-color 0.2s; flex:1;
        }
        .fd-input:focus { border-color:#F47B20; background:#fff; }
        .fd-select { cursor:pointer; }
        .fd-color { width:100%; margin-top:0.35rem; }
        .fd-dash { font-size:0.75rem; color:#A3A3A3; white-space:nowrap; flex-shrink:0; }
        .fd-footer {
          display:flex; gap:0.75rem; padding:1rem 1.25rem;
          border-top:1.5px solid #E5E5E5; background:#FAFAFA;
        }
        .fd-clear {
          background:#fff; border:1.5px solid #E5E5E5; color:#737373;
          border-radius:6px; padding:0.6rem 1.25rem; font-size:0.825rem;
          cursor:pointer; font-family:var(--font-body); transition:all 0.2s;
        }
        .fd-clear:hover { border-color:#DC2626; color:#DC2626; }
        .fd-apply {
          flex:1; background:#F47B20; color:#fff; border:none; border-radius:6px;
          padding:0.6rem 1.25rem; font-family:var(--font-display); font-size:0.875rem;
          letter-spacing:0.08em; cursor:pointer; transition:background 0.2s;
        }
        .fd-apply:hover { background:#FF9340; }

        /* TOPBAR RIGHT */
        .topbar-right { display:flex; align-items:center; gap:0.5rem; flex-shrink:0; }
        .scan-btn {
          background:#F5F5F5; border:1.5px solid #E5E5E5; border-radius:8px;
          padding:0.5rem 0.875rem; color:#525252; font-size:0.78rem; cursor:pointer;
          transition:all 0.2s; white-space:nowrap; font-family:var(--font-body); font-weight:600;
        }
        .scan-btn:hover { border-color:#F47B20; color:#F47B20; background:#FFF7ED; }
        .dash-btn {
          background:#F47B20;color:#fff;border:none;border-radius:6px;
          padding:0.4rem 0.75rem;font-family:var(--font-display);font-size:0.72rem;
          letter-spacing:0.04em;cursor:pointer;text-decoration:none;white-space:nowrap;transition:background 0.2s;
        }
        .dash-btn:hover { background:#FF9340; }
        .auth-btns { display:flex; gap:0.375rem; }
        .login-btn {
          font-size:0.78rem; color:#525252; text-decoration:none;
          padding:0.45rem 0.75rem; border:1.5px solid #E5E5E5; border-radius:8px; transition:all 0.2s;
        }
        .login-btn:hover { border-color:#F47B20; color:#F47B20; }
        .register-btn {
          font-size:0.78rem; color:#fff; background:#F47B20; text-decoration:none;
          padding:0.45rem 0.875rem; border-radius:8px; font-family:var(--font-display);
          letter-spacing:0.05em; white-space:nowrap; transition:background 0.2s;
        }
        .register-btn:hover { background:#FF9340; }
        .logout-topbar { background:#F5F5F5; border:1.5px solid #E5E5E5; color:#737373; border-radius:7px; padding:0.4rem 0.55rem; font-size:0.7rem; font-weight:700; cursor:pointer; font-family:var(--font-body); transition:all 0.2s; white-space:nowrap; }
        .logout-topbar:hover { border-color:#DC2626; color:#DC2626; background:#FEF2F2; }

        /* ACTIVE FILTER BAR */
        .active-bar {
          display:flex; align-items:center; gap:0.5rem; flex-wrap:wrap;
          padding:0.625rem 1.25rem; background:#FFF7ED; border-bottom:1px solid rgba(244,123,32,0.2);
        }
        .ab-label { font-size:0.7rem; color:#C4621A; font-weight:600; letter-spacing:0.08em; text-transform:uppercase; flex-shrink:0; }
        .af-tag {
          display:flex; align-items:center; gap:0.3rem;
          background:#fff; border:1px solid #F47B20; color:#F47B20;
          border-radius:20px; padding:0.18rem 0.6rem; font-size:0.72rem;
        }
        .af-tag button { background:none; border:none; cursor:pointer; color:#F47B20; font-size:0.65rem; line-height:1; padding:0; }
        .ab-clear { background:transparent; border:none; color:#DC2626; font-size:0.72rem; cursor:pointer; font-family:var(--font-body); margin-left:auto; white-space:nowrap; }

        /* BRAND TABS */
        .brand-scroll { overflow-x:auto; border-bottom:1.5px solid #E5E5E5; background:#fff; }
        .brand-scroll::-webkit-scrollbar { height:0; }
        .brand-tabs { display:flex; gap:0.2rem; padding:0.5rem 1.25rem; min-width:max-content; }
        .btab {
          background:transparent; border:none; border-radius:20px;
          padding:0.3rem 0.875rem; color:#737373; font-size:0.78rem; cursor:pointer;
          font-family:var(--font-body); white-space:nowrap; transition:all 0.2s;
        }
        .btab:hover { background:#F5F5F5; color:#171717; }
        .btab.active { background:#F47B20; color:#fff; font-weight:600; }

        /* FEED INFO */
        .feed-info { display:flex; align-items:center; justify-content:space-between; padding:0.75rem 1.25rem; flex-wrap:wrap; gap:0.5rem; }
        .feed-count { font-size:0.825rem; color:#737373; font-weight:500; }
        .guest-note { font-size:0.72rem; color:#A3A3A3; }

        /* CARS GRID */
        .cars-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(250px,1fr)); gap:1rem; padding:0 1.25rem 1.5rem; }

        .car-card {
          background:#fff; border:1.5px solid #E5E5E5; border-radius:12px;
          overflow:hidden; text-decoration:none; display:flex; flex-direction:column;
          transition:all 0.2s; position:relative;
        }
        .car-card:hover { border-color:#F47B20; transform:translateY(-3px); box-shadow:0 8px 28px rgba(244,123,32,0.1); }

        .car-img-wrap { position:relative; height:185px; background:#E5E5E5; overflow:hidden; display:flex; align-items:center; justify-content:center; }
        .car-img-wrap img { width:100%; height:100%; object-fit:cover; transition:transform 0.3s; }
        .car-card:hover .car-img-wrap img { transform:scale(1.04); }
        .car-ph { font-size:0.8rem; font-weight:600; color:#A3A3A3; letter-spacing:0.1em; }

        .car-status-tag {
          position:absolute; top:0.5rem; left:0.5rem;
          padding:0.2rem 0.625rem; border-radius:20px;
          font-size:0.6rem; font-weight:700; text-transform:capitalize; color:#fff;
        }
        .promo-tag {
          position:absolute; top:0.5rem; right:0.5rem;
          background:#DC2626; color:#fff; padding:0.2rem 0.5rem;
          border-radius:4px; font-size:0.6rem; font-weight:700; letter-spacing:0.08em;
        }
        .card-actions {
          position:absolute; bottom:0; left:0; right:0;
          display:flex; gap:0.25rem; padding:0.5rem;
          background:linear-gradient(transparent,rgba(23,23,23,0.6));
          opacity:0; transition:opacity 0.2s;
        }
        .car-card:hover .card-actions { opacity:1; }
        .ca-btn {
          flex:1; background:rgba(23,23,23,0.55); backdrop-filter:blur(4px); border:none;
          border-radius:5px; padding:0.3rem; font-size:0.65rem; font-weight:700;
          cursor:pointer; color:#fff; transition:background 0.15s; text-align:center;
          letter-spacing:0.04em; font-family:var(--font-body);
        }
        .ca-btn:hover { background:rgba(23,23,23,0.8); }
        .ca-btn.liked { background:rgba(220,38,38,0.75); }
        .ca-btn.faved { background:rgba(244,123,32,0.75); }

        .dealer-strip {
          display:flex; align-items:center; gap:0.4rem;
          padding:0.4rem 0.875rem; background:#F5F5F5;
          border-bottom:1px solid #E5E5E5;
        }
        .ds-logo {
          width:18px; height:18px; border-radius:3px; background:#E5E5E5;
          color:#737373; font-size:0.6rem; font-weight:700;
          display:flex; align-items:center; justify-content:center; overflow:hidden; flex-shrink:0;
        }
        .ds-logo img { width:100%; height:100%; object-fit:cover; }
        .ds-name { font-size:0.7rem; color:#737373; flex:1; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .ds-loc { font-size:0.65rem; color:#A3A3A3; white-space:nowrap; }

        .car-info { padding:0.875rem; display:flex; flex-direction:column; gap:0.28rem; flex:1; }
        .car-name { font-weight:700; font-size:0.9rem; color:#171717; }
        .car-sub { font-size:0.7rem; color:#737373; text-transform:capitalize; }
        .car-loc { font-size:0.68rem; color:#A3A3A3; }
        .price-row { display:flex; align-items:baseline; gap:0.5rem; margin-top:0.2rem; }
        .car-price { font-family:var(--font-display); font-size:1.2rem; color:#F47B20; letter-spacing:0.02em; }
        .car-promo { font-size:0.78rem; color:#16A34A; font-weight:600; }
        .card-footer {
          display:flex; align-items:center; justify-content:space-between;
          margin-top:0.4rem; padding-top:0.4rem; border-top:1px solid #F0F0F0;
        }
        .view-ct { font-size:0.65rem; color:#A3A3A3; }
        .view-deal { font-size:0.72rem; color:#F47B20; font-weight:600; }

        /* SKELETON */
        .car-skel { background:#fff; border:1.5px solid #E5E5E5; border-radius:12px; overflow:hidden; }
        .sk-img { height:185px; animation:shimmer 1.5s infinite; background:linear-gradient(90deg,#F0F0F0 25%,#E5E5E5 50%,#F0F0F0 75%); background-size:400% 100%; }
        .sk-body { padding:0.875rem; display:flex; flex-direction:column; gap:0.5rem; }
        .sk-line { height:11px; border-radius:4px; animation:shimmer 1.5s infinite; background:linear-gradient(90deg,#F0F0F0 25%,#E5E5E5 50%,#F0F0F0 75%); background-size:400% 100%; }
        .sk-line.w80 { width:80%; } .sk-line.w40 { width:40%; }
        @keyframes shimmer { 0%{background-position:400% 0} 100%{background-position:-400% 0} }

        /* EMPTY */
        .empty { display:flex; flex-direction:column; align-items:center; gap:1rem; padding:4rem; text-align:center; }
        .empty-icon { font-size:2rem; font-weight:700; color:#D4D4D4; letter-spacing:0.1em; }
        .empty h3 { font-family:var(--font-display); font-size:1.3rem; color:#171717; }
        .empty p { color:#737373; font-size:0.875rem; }

        /* LOAD MORE */
        .lm-wrap { display:flex; justify-content:center; padding:1.5rem; }
        .lm-btn {
          background:#fff; border:1.5px solid #E5E5E5; color:#737373;
          border-radius:8px; padding:0.875rem 2.5rem; font-size:0.875rem;
          cursor:pointer; transition:all 0.2s; font-family:var(--font-body);
        }
        .lm-btn:hover { border-color:#F47B20; color:#F47B20; }
        .lm-btn:disabled { opacity:0.5; cursor:not-allowed; }

        /* -- COMBINED FOOTER -------------------- */
        .combined-footer {
          background:#fff; border-top:1.5px solid #E5E5E5;
          margin-top:auto;
        }

        /* Nav row */
        .cf-nav {
          display:flex; align-items:center; justify-content:space-around;
          height:62px; border-bottom:1px solid #E5E5E5;
        }
        .cf-item {
          display:flex; flex-direction:column; align-items:center; gap:0.2rem;
          text-decoration:none; background:none; border:none; cursor:pointer;
          font-family:var(--font-body); color:#A3A3A3; min-width:80px;
          transition:color 0.2s; padding:0.5rem;
        }
        .cf-item:hover, .cf-item.active { color:#F47B20; }
        .cf-icon-wrap {
          width:38px; height:38px; border-radius:50%; display:flex; align-items:center;
          justify-content:center; transition:all 0.2s;
        }
        .cf-icon-wrap.home { background:#F5F5F5; }
        .cf-icon-wrap.account { background:#F5F5F5; }
        .cf-icon-wrap.qr {
          background:#F47B20; margin-top:-18px;
          box-shadow:0 4px 16px rgba(244,123,32,0.35); width:46px; height:46px;
        }
        .cf-item:hover .cf-icon-wrap.home,
        .cf-item:hover .cf-icon-wrap.account { background:#FFF7ED; }
        .cf-icon-text { font-size:0.55rem; font-weight:800; letter-spacing:0.08em; color:#737373; }
        .cf-icon-wrap.qr .cf-icon-text { color:#fff; font-size:0.6rem; }
        .cf-item.active .cf-icon-text { color:#F47B20; }
        .cf-label { font-size:0.58rem; letter-spacing:0.04em; text-transform:uppercase; font-weight:600; }

        /* Info row */
        .cf-info {
          display:flex; align-items:center; justify-content:space-between;
          padding:0.6rem 1.25rem; background:#F5F5F5; flex-wrap:wrap; gap:0.5rem;
        }
        .cf-brand { font-family:var(--font-display); font-size:0.8rem; letter-spacing:0.15em; color:#F47B20; flex-shrink:0; }
        .cf-links { display:flex; align-items:center; gap:1rem; flex-wrap:wrap; flex:1; justify-content:center; }
        .cf-link { font-size:0.72rem; color:#737373; text-decoration:none; white-space:nowrap; transition:color 0.2s; }
        .cf-link:hover { color:#F47B20; }
        .cf-dev { font-size:0.68rem; color:#A3A3A3; flex-shrink:0; }

        /* SCAN MODAL */
        .scan-overlay { position:fixed; inset:0; background:rgba(23,23,23,0.65); backdrop-filter:blur(6px); display:flex; align-items:center; justify-content:center; z-index:1000; padding:1rem; }
        .scan-modal { background:#fff; border-radius:16px; width:100%; max-width:400px; overflow:hidden; box-shadow:0 24px 64px rgba(0,0,0,0.2); }
        .scan-head { display:flex; align-items:center; justify-content:space-between; padding:1.25rem 1.5rem; border-bottom:1.5px solid #E5E5E5; }
        .scan-title { font-family:var(--font-display); font-size:1rem; letter-spacing:0.12em; color:#171717; }
        .scan-x { background:none; border:none; color:#A3A3A3; font-size:0.875rem; font-weight:700; cursor:pointer; font-family:var(--font-body); }
        .scan-body { padding:1.5rem; display:flex; flex-direction:column; align-items:center; gap:1rem; }
        .scan-big-icon { font-size:0.875rem; font-weight:800; color:#E5E5E5; letter-spacing:0.15em; padding:1.5rem; background:#F5F5F5; border-radius:12px; border:3px dashed #E5E5E5; }
        .scan-desc { font-size:0.875rem; color:#737373; text-align:center; max-width:280px; line-height:1.5; }
        .scan-input {
          width:100%; background:#F5F5F5; border:1.5px solid #E5E5E5; border-radius:8px;
          padding:0.875rem 1rem; color:#171717; font-size:0.9rem; font-family:var(--font-mono);
          outline:none; transition:border-color 0.2s; text-align:center; letter-spacing:0.06em;
        }
        .scan-input:focus { border-color:#F47B20; background:#fff; }
        .scan-input::placeholder { font-family:var(--font-body); letter-spacing:0; color:#A3A3A3; font-size:0.825rem; }
        .scan-go {
          width:100%; background:#F47B20; color:#fff; border:none; border-radius:8px;
          padding:0.875rem; font-family:var(--font-display); font-size:0.95rem;
          letter-spacing:0.08em; cursor:pointer; transition:background 0.2s;
        }
        .scan-go:hover { background:#FF9340; }
        .scan-go:disabled { opacity:0.5; cursor:not-allowed; }
        .scan-cam {
          width:100%; background:#F5F5F5; border:1.5px solid #E5E5E5; color:#525252;
          border-radius:8px; padding:0.75rem; font-family:var(--font-body);
          font-size:0.875rem; cursor:pointer; transition:all 0.2s;
        }
        .scan-cam:hover { border-color:#F47B20; color:#F47B20; background:#FFF7ED; }

        @media(max-width:640px) {
          .feed-topbar { padding:0 0.75rem; gap:0.4rem; height:54px; }
          .feed-brand { font-size:0.95rem; letter-spacing:0.12em; }
          .search-box { min-width:0; }
          .auth-btns { display:none; }
          .scan-btn { display:none; }
          .cars-grid { grid-template-columns:repeat(auto-fill,minmax(155px,1fr)); gap:0.65rem; padding:0 0.75rem 1rem; }
          .car-img-wrap { height:135px; }
          .guest-note { display:none; }
          .filter-dropdown { width:calc(100vw - 1.5rem); right:-0.5rem; }
        }
          .auth-btns { display:none; }
          .scan-btn { padding:0.5rem 0.625rem; font-size:0.7rem; }
          .cars-grid { grid-template-columns:repeat(auto-fill,minmax(160px,1fr)); gap:0.75rem; padding:0 0.875rem 1rem; }
          .car-img-wrap { height:140px; }
          .filter-dropdown { width:96vw; right:-0.875rem; }
          .cf-links { gap:0.625rem; }
          .cf-link { font-size:0.65rem; }
          .guest-note { display:none; }
        }
      `}</style>
    </div>
  );
}




