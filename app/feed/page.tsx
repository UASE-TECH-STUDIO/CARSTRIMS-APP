"use client";
import FeedFooter from "@/components/layout/FeedFooter";
import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import GlobalSearchModal from "@/components/shared/GlobalSearchModal";
import { useToast } from "@/store/toastStore";
import { useConfirm } from "@/store/confirmStore";
import { useVoiceInput } from "@/lib/useVoiceInput";
import { correctVoiceTranscript } from "@/lib/voiceCarCorrection";
import FeedFilterDropdown from "@/components/shared/FeedFilterDropdown";
import ShareMenu from "@/components/shared/ShareMenu";
import CustomSelect from "@/components/ui/CustomSelect";

const SORT_OPTIONS = [
  {value:"score",label:"Recommended"},
  {value:"newest",label:"Newest first"},
  {value:"price_asc",label:"Lowest price"},
  {value:"price_desc",label:"Highest price"},
];

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
const STATES_NG = ["Abia","Abuja","Adamawa","Akwa Ibom","Anambra","Bauchi","Bayelsa","Benue","Borno","Cross River","Delta","Ebonyi","Edo","Ekiti","Enugu","Gombe","Imo","Jigawa","Kaduna","Kano","Katsina","Kebbi","Kogi","Kwara","Lagos","Nasarawa","Niger","Ogun","Ondo","Osun","Oyo","Plateau","Rivers","Sokoto","Taraba","Yobe","Zamfara"];
const YEARS = Array.from({ length: new Date().getFullYear() - 1979 }, (_, i) => String(new Date().getFullYear() - i));
const STATUS_COLORS: Record<string,string> = { available:"#16A34A", sold:"#737373", reserved:"#D97706", out_for_inspection:"#525252" };

interface Car {
  _id:string; carId:string; brand:string; model:string; year:number;
  color:string; sellingPrice:number; promoPrice?:number; status:string;
  images:string[]; viewCount:number; likeCount:number; commentCount?:number;
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
  // One random seed per fresh visit to this page — stays the same while
  // scrolling/paginating (so the feed doesn't repeat or skip cars as
  // more load), but a genuinely new one is generated every time the
  // feed is freshly opened (component remount) or explicitly refreshed,
  // so the order feels different each time, like Instagram/TikTok.
  const feedSeedRef = useRef<string>(Math.random().toString(36).slice(2) + Date.now().toString(36));

  const [searchInput, setSearchInput] = useState("");
  // Search box enlarge: a simple click-to-toggle between compact
  // (44px, single line) and enlarged (a fixed, generous height so
  // long typed/spoken text is fully visible) - explicitly NOT a drag
  // gesture, since dragging could push the box off-screen and was
  // fiddly to use precisely. Content inside is completely unaffected
  // by the toggle either way - only the box's own height changes.
  const [searchEnlarged, setSearchEnlarged] = useState(false);
  const searchBoxHeight = searchEnlarged ? 140 : 44;
  const filterBtnRef = useRef<HTMLButtonElement>(null);
  const micBtnRef = useRef<HTMLButtonElement>(null);
  const resizeHandleRef = useRef<HTMLDivElement>(null);
  const [hintPositions, setHintPositions] = useState<{filter:number; mic:number; resize:number} | null>(null);
  const [understoodFilters, setUnderstoodFilters] = useState<{type:string; label:string; matchedText:string}[]>([]);
  // Shows fresh every time the feed is genuinely opened/returned to
  // (component remount), and dismisses only for the current viewing
  // session when the person actually starts using the search — never
  // permanently hidden, since a returning/new user benefits from the
  // reminder each time, not just once ever.
  const [showSearchHint, setShowSearchHint] = useState(true);
  const dismissSearchHint = () => setShowSearchHint(false);

  useEffect(() => {
    if (!showSearchHint) return;
    const measure = () => {
      const formRect = searchWrapRef.current?.getBoundingClientRect();
      const filterRect = filterBtnRef.current?.getBoundingClientRect();
      const micRect = micBtnRef.current?.getBoundingClientRect();
      const resizeRect = resizeHandleRef.current?.getBoundingClientRect();
      if (!formRect || !filterRect || !micRect || !resizeRect) return;
      setHintPositions({
        filter: filterRect.left + filterRect.width / 2 - formRect.left,
        mic: micRect.left + micRect.width / 2 - formRect.left,
        resize: resizeRect.left + resizeRect.width / 2 - formRect.left,
      });
    };
    // A short delay ensures the buttons have actually painted with
    // their real widths before measuring — measuring on the very same
    // tick as mount can catch elements still at their pre-layout size.
    const t = setTimeout(measure, 50);
    window.addEventListener("resize", measure);
    return () => { clearTimeout(t); window.removeEventListener("resize", measure); };
  }, [showSearchHint]);
  const { listening, supported: voiceSupported, lastError: voiceError, start: startVoice, stop: stopVoice } = useVoiceInput((transcript) => {
    setSearchInput(correctVoiceTranscript(transcript));
  });
  const [search, setSearch] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("");
  const [showFilter, setShowFilter] = useState(false);
  const [showGlobalSearch, setShowGlobalSearch] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  // Unified search: as the user types, cars filter live via the existing
  // `search` state (now smart-parsed on the backend for year/condition/
  // fuel/transmission/state/status keywords), AND matching dealers/
  // people show in a small dropdown right under the search box —
  // replacing the separate "search everything" icon button.
  const [peopleResults, setPeopleResults] = useState<{dealers?:any[]; users?:any[]}>({});
  const [showPeopleDropdown, setShowPeopleDropdown] = useState(false);
  const peopleDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchWrapRef = useRef<HTMLDivElement>(null);

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
  const [fMaxMileage, setFMaxMileage] = useState("");
  const [fPromoOnly, setFPromoOnly] = useState(false);
  const [fVehicleType, setFVehicleType] = useState("");
  const [fSort, setFSort] = useState("score");

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
    const p: any = { skip, limit: LIMIT, sort: fSort, seed: feedSeedRef.current };
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
    if (fMaxMileage) p.max_mileage = Number(fMaxMileage);
    if (fPromoOnly) p.promo_only = true;
    if (fVehicleType) p.vehicle_type = fVehicleType;
    if (fPrice) {
      const range = PRICE_RANGES.find((r) => r.label === fPrice);
      if (range) { if (range.min) p.min_price = range.min; if (range.max) p.max_price = range.max; }
    } else {
      if (fMinPrice) p.min_price = Number(fMinPrice);
      if (fMaxPrice) p.max_price = Number(fMaxPrice);
    }
    return p;
  }, [search, selectedBrand, fStatus, fCondition, fTransmission, fFuel, fState, fYearFrom, fYearTo, fColor, fPrice, fMinPrice, fMaxPrice, fMaxMileage, fPromoOnly, fVehicleType, fSort]);

  const fetchCars = useCallback(async (reset = false, silent = false) => {
    if (reset && !silent) { setLoading(true); }
    if (reset) skipRef.current = 0;
    if (!reset) setLoadingMore(true);
    try {
      const res = await api.get("/api/v1/public/cars", { params: buildParams(reset ? 0 : skipRef.current) });
      const newCars = res.data.cars || [];
      setTotal(res.data.total || 0);
      if (reset) setUnderstoodFilters(res.data.understoodFilters || []);
      // For a silent background refresh, only swap the list once the new
      // data has actually arrived — the old cars stay on screen the whole
      // time, so there's no flash/reset and scroll position isn't disturbed.
      if (reset) { setCars(newCars); skipRef.current = LIMIT; }
      else { setCars((p) => [...p, ...newCars]); skipRef.current += LIMIT; }
    } catch { } finally { setLoading(false); setLoadingMore(false); }
  }, [buildParams]);

  // Pull-to-refresh: only activates when scrolled to the very top,
  // pulling down gives a damped/resistant drag feel, and releasing
  // past the threshold generates a fresh feed seed (new order, same
  // as opening the app fresh) and re-fetches — also brings the search
  // hint back, matching "let that notice box come back after each
  // refresh."
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const pullStartY = useRef<number | null>(null);
  const PULL_THRESHOLD = 64;

  const handlePullTouchStart = (e: React.TouchEvent) => {
    if (window.scrollY <= 0) pullStartY.current = e.touches[0].clientY;
  };
  const handlePullTouchMove = (e: React.TouchEvent) => {
    if (pullStartY.current === null || refreshing) return;
    const delta = e.touches[0].clientY - pullStartY.current;
    if (delta > 0 && window.scrollY <= 0) {
      setPullDistance(Math.min(90, delta * 0.5));
    } else {
      pullStartY.current = null;
      setPullDistance(0);
    }
  };
  const handlePullTouchEnd = async () => {
    if (pullStartY.current === null) return;
    const shouldRefresh = pullDistance >= PULL_THRESHOLD;
    pullStartY.current = null;
    setPullDistance(0);
    if (shouldRefresh) {
      setRefreshing(true);
      feedSeedRef.current = Math.random().toString(36).slice(2) + Date.now().toString(36);
      setShowSearchHint(true);
      await fetchCars(true);
      setRefreshing(false);
    }
  };

  // Live search-as-you-type for the car feed (debounced), in addition
  // to the existing on-submit behavior — so typing "camry 2019 used"
  // filters the grid without needing to press Enter.
  const carSearchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (carSearchDebounceRef.current) clearTimeout(carSearchDebounceRef.current);
    carSearchDebounceRef.current = setTimeout(() => setSearch(searchInput), 450);
    return () => { if (carSearchDebounceRef.current) clearTimeout(carSearchDebounceRef.current); };
  }, [searchInput]);

  useEffect(() => { fetchCars(true); }, [search, selectedBrand, fStatus, fCondition, fTransmission, fFuel, fState, fYearFrom, fYearTo, fColor, fPrice, fMinPrice, fMaxPrice, fMaxMileage, fPromoOnly, fVehicleType, fSort]);

  // Debounced dealer/people lookup for the unified search box — shows
  // as a small dropdown under the search input, alongside the car
  // results filtering live in the grid below.
  useEffect(() => {
    if (peopleDebounceRef.current) clearTimeout(peopleDebounceRef.current);
    if (!searchInput.trim()) { setPeopleResults({}); setShowPeopleDropdown(false); return; }
    peopleDebounceRef.current = setTimeout(async () => {
      try {
        const res = await api.get("/api/v1/public/search", { params: { q: searchInput.trim(), types: "dealers,users" } });
        setPeopleResults(res.data || {});
        setShowPeopleDropdown(true);
      } catch { setPeopleResults({}); }
    }, 400);
    return () => { if (peopleDebounceRef.current) clearTimeout(peopleDebounceRef.current); };
  }, [searchInput]);

  // Close the people dropdown on outside click.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (searchWrapRef.current && !searchWrapRef.current.contains(e.target as Node)) setShowPeopleDropdown(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  // Keep a session-scoped ordered list of car IDs so the car detail page
  // can support swiping to the next/previous car in the SAME order the
  // user was browsing, without needing to come back to the feed first.
  useEffect(() => {
    if (!cars.length) return;
    try {
      sessionStorage.setItem("carstrims:car-list", JSON.stringify(cars.map((c: any) => c.carId)));
    } catch {}
  }, [cars]);

  // Silently refresh in the background when the user comes back to the
  // page (e.g. app resumed from background, or switched tabs). This does
  // NOT show the loading skeleton and does NOT clear the existing list
  // first — the current view stays visible the whole time, and only
  // swaps in new data once it's actually arrived. Throttled to avoid
  // re-fetching on every quick app-switch, which matters a lot on slow
  // connections.
  const lastRefreshRef = useRef(Date.now());
  const MIN_REFRESH_INTERVAL_MS = 45_000;
  useEffect(() => {
    const maybeSilentRefresh = () => {
      const now = Date.now();
      if (now - lastRefreshRef.current < MIN_REFRESH_INTERVAL_MS) return;
      lastRefreshRef.current = now;
      feedSeedRef.current = Math.random().toString(36).slice(2) + Date.now().toString(36);
      fetchCars(true, true);
    };
    const onFocus = () => maybeSilentRefresh();
    const onVisibility = () => { if (document.visibilityState === "visible") maybeSilentRefresh(); };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [fetchCars]);
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
    if (!isAuthenticated) { router.push("/login"); return; }
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

  const showToast = useToast();
  const askConfirm = useConfirm();
  const isAdmin = user?.role === "SYSTEM_ADMIN";

  const [shareCar, setShareCar] = useState<Car | null>(null);
  const [commentBoxFor, setCommentBoxFor] = useState<string | null>(null);
  const [commentDraft, setCommentDraft] = useState("");
  const [postingComment, setPostingComment] = useState(false);

  const handleShare = (e: React.MouseEvent, car: Car) => {
    e.preventDefault(); e.stopPropagation();
    setShareCar(car);
  };

  const handleToggleCommentBox = (e: React.MouseEvent, carId: string) => {
    e.preventDefault(); e.stopPropagation();
    if (commentBoxFor === carId) {
      setCommentBoxFor(null);
    } else {
      setCommentBoxFor(carId);
      setCommentDraft("");
    }
  };

  const handlePostQuickComment = async (e: React.MouseEvent, carId: string) => {
    e.preventDefault(); e.stopPropagation();
    if (!isAuthenticated) { router.push("/login"); return; }
    if (!commentDraft.trim()) return;
    setPostingComment(true);
    try {
      await api.post(`/api/v1/public/cars/${carId}/comments`, { text: commentDraft });
      setCars(p => p.map(c => c.carId === carId ? { ...c, commentCount: (c.commentCount || 0) + 1 } : c));
      setCommentDraft("");
      setCommentBoxFor(null);
      showToast("Comment posted", "success");
    } catch (err: any) {
      showToast(err?.response?.data?.detail || "Couldn't post comment", "error");
    } finally {
      setPostingComment(false);
    }
  };

  const handleAdminDelete = async (e: React.MouseEvent, car: Car) => {
    e.preventDefault(); e.stopPropagation();
    if (!(await askConfirm({ message: `Remove "${car.brand} ${car.model}" from the platform?`, danger: true }))) return;
    try {
      await api.delete(`/api/v1/cars/${car.carId}`);
      setCars((prev) => prev.filter((c) => c.carId !== car.carId));
      showToast("Vehicle removed", "success");
    } catch (err: any) {
      showToast(err?.response?.data?.detail || "Delete failed", "error");
    }
  };

  const clearAll = () => {
    setSearch(""); setSearchInput(""); setSelectedBrand("");
    setFStatus("available"); setFPrice(""); setFCondition(""); setFTransmission("");
    setFFuel(""); setFState(""); setFYearFrom(""); setFYearTo("");
    setFMinPrice(""); setFMaxPrice(""); setFColor("");
    setFMaxMileage(""); setFPromoOnly(false); setFVehicleType(""); setFSort("score");
  };

  // Removes just ONE understood filter chip. For regex-matched chips
  // (which include the exact original text span via matchedText),
  // strips just that piece out of the search box and lets it re-search.
  // AI-derived chips don't have a literal text span to strip (the AI
  // understood the INTENT, not a copy-pasteable substring), so those
  // clear the whole search box instead — an honest, simple fallback
  // rather than guessing at partial removal.
  const removeUnderstoodFilter = (chip: { matchedText: string }) => {
    if (!chip.matchedText) { setSearchInput(""); setSearch(""); return; }
    setSearchInput((prev) => {
      const idx = prev.toLowerCase().indexOf(chip.matchedText.toLowerCase());
      if (idx === -1) return prev;
      return (prev.slice(0, idx) + prev.slice(idx + chip.matchedText.length)).replace(/\s+/g, " ").trim();
    });
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
    <div className="feed" onTouchStart={handlePullTouchStart} onTouchMove={handlePullTouchMove} onTouchEnd={handlePullTouchEnd}>
      {(pullDistance > 0 || refreshing) && (
        <div className="pull-indicator" style={{ height: refreshing ? 48 : pullDistance }}>
          <div className={`pull-spinner ${refreshing || pullDistance >= 64 ? "pull-spinner-ready" : ""}`} />
        </div>
      )}
      {/* TOPBAR */}
      <header className="feed-topbar">
        <Link href="/feed" className="feed-brand">CARSTRIMS</Link>

        <form ref={searchWrapRef} className="search-form" style={{position:"relative"}} onSubmit={(e) => { e.preventDefault(); setSearch(searchInput); setShowPeopleDropdown(false); }}>
          <div
            className="search-box"
            style={{
              alignItems: searchBoxHeight > 44 ? "flex-start" : "center",
              position: searchBoxHeight > 44 ? "absolute" : "static",
              top: searchBoxHeight > 44 ? 0 : undefined,
              left: searchBoxHeight > 44 ? 0 : undefined,
              right: searchBoxHeight > 44 ? 0 : undefined,
              zIndex: searchBoxHeight > 44 ? 80 : undefined,
              boxShadow: searchBoxHeight > 44 ? "0 12px 28px rgba(0,0,0,0.18)" : undefined,
            }}
          >
            <button ref={filterBtnRef} type="button" className="s-filter-btn" title="Filters" aria-label="Open filters"
              onClick={(e) => { e.stopPropagation(); setShowFilter((v) => !v); }}>F</button>
            <textarea
              className="search-input"
              placeholder="Type or say what you want: camry 2019 used black 3m to 5m..."
              value={searchInput}
              rows={1}
              style={{height: searchBoxHeight}}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  setSearch(searchInput);
                  setShowPeopleDropdown(false);
                }
              }}
              onFocus={() => {
                if (showSearchHint) dismissSearchHint();
                if ((peopleResults.dealers?.length||0)+(peopleResults.users?.length||0) > 0) setShowPeopleDropdown(true);
              }}
            />
            {searchInput && <button type="button" className="s-clear" onClick={() => { setSearchInput(""); setSearch(""); setShowPeopleDropdown(false); }}>✕</button>}
            <button
              ref={micBtnRef}
              type="button"
              className={`s-mic ${listening ? "s-mic-active" : ""}`}
              title={listening ? "Listening… tap to stop" : "Search by voice"}
              onClick={(e) => {
                e.stopPropagation();
                if (listening) { stopVoice(); return; }
                if (voiceSupported === false) {
                  // Only plugin-not-bundled is a genuinely permanent
                  // block (nothing fixes this except a fresh app
                  // build) - everything else is retry-able, so this
                  // only ever blocks for that one specific case now.
                  showToast("Voice search needs a fresh app build to work — this version is missing a required update.", "error");
                  return;
                }
                if (voiceError) {
                  // A previous attempt hit a retry-able issue -
                  // briefly explain what happened, then still let
                  // this tap proceed as the retry rather than
                  // blocking it outright.
                  const messages: Record<string, string> = {
                    "device-unavailable": "Couldn't reach the speech service just now, trying again…",
                    "permission-denied": "Microphone permission was denied — enable it in your device's app settings, then try again.",
                    "runtime-error": "That attempt hit a hiccup, trying again…",
                  };
                  showToast(messages[voiceError] || "Trying voice search again…", "error");
                }
                startVoice();
              }}
            >
              {listening ? "●" : "🎤"}
            </button>
            <button
              ref={resizeHandleRef}
              type="button"
              className="search-resize-handle"
              title={searchEnlarged ? "Click to shrink back" : "Click to enlarge"}
              onClick={(e) => { e.stopPropagation(); setSearchEnlarged((v) => !v); }}
            >{searchEnlarged ? "⌃" : "⌄"}</button>
          </div>

          {showFilter && (
            <div ref={filterRef}>
              <FeedFilterDropdown
                selectedBrand={selectedBrand} setSelectedBrand={setSelectedBrand}
                fCondition={fCondition} setFCondition={setFCondition}
                fTransmission={fTransmission} setFTransmission={setFTransmission}
                fFuel={fFuel} setFFuel={setFFuel}
                fState={fState} setFState={setFState}
                fColor={fColor} setFColor={setFColor}
                fYearFrom={fYearFrom} setFYearFrom={setFYearFrom}
                fYearTo={fYearTo} setFYearTo={setFYearTo}
                fMinPrice={fMinPrice} setFMinPrice={setFMinPrice}
                fMaxPrice={fMaxPrice} setFMaxPrice={setFMaxPrice}
                fStatus={fStatus} setFStatus={setFStatus}
                fMaxMileage={fMaxMileage} setFMaxMileage={setFMaxMileage}
                fPromoOnly={fPromoOnly} setFPromoOnly={setFPromoOnly}
                fVehicleType={fVehicleType} setFVehicleType={setFVehicleType}
                fSort={fSort} setFSort={setFSort}
                onClose={() => setShowFilter(false)}
                onClear={clearAll}
              />
            </div>
          )}

          {/* Inline dealers/people matches — same box now covers cars
              (filtered live in the grid below) AND people/dealers,
              replacing the old separate "search everything" button and
              the separate filter dropdown (typing recognizes year,
              condition, fuel, transmission, state, and status keywords
              automatically — see the backend's smart search parsing). */}
          {showPeopleDropdown && ((peopleResults.dealers?.length||0)+(peopleResults.users?.length||0) > 0) && (
            <div className="people-dropdown">
              {!!peopleResults.dealers?.length && (
                <div className="pd-section">
                  <div className="pd-label">Dealers</div>
                  {peopleResults.dealers.map((d:any) => (
                    <Link key={d.dealerId||d._id} href={`/dealers/${d.dealerId||d._id}`} className="pd-row" onClick={()=>setShowPeopleDropdown(false)}>
                      <div className="pd-avatar">{d.logo?<img src={d.logo} alt=""/>:<span>{d.companyName?.charAt(0)||"D"}</span>}</div>
                      <div className="pd-text"><div className="pd-title">{d.companyName}</div><div className="pd-sub">{d.city||"Dealer"}</div></div>
                    </Link>
                  ))}
                </div>
              )}
              {!!peopleResults.users?.length && (
                <div className="pd-section">
                  <div className="pd-label">People</div>
                  {peopleResults.users.map((u:any) => (
                    <Link key={u.userId||u._id} href={`/users/${u.userId||u._id}`} className="pd-row" onClick={()=>setShowPeopleDropdown(false)}>
                      <div className="pd-avatar">{u.avatar?<img src={u.avatar} alt=""/>:<span>{u.fullName?.charAt(0)||"?"}</span>}</div>
                      <div className="pd-text"><div className="pd-title">{u.fullName}</div><div className="pd-sub">{u.role==="DEALER_ADMIN"?"Dealer":u.role==="PARTNER_USER"?"Partner":"User"}</div></div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          {showSearchHint && hintPositions && (
            <div className="search-hint-group">
              <button type="button" className="search-hint-dismiss" onClick={dismissSearchHint} aria-label="Dismiss">✕</button>

              <div className="hint-item" style={{left: hintPositions.filter, transform: "translateX(-50%)"}}>
                <div className="hint-arrow">↑</div>
                <div className="hint-bubble">Filter</div>
              </div>

              <div className="hint-item hint-item-type">
                <div className="hint-arrow">↑</div>
                <div className="hint-bubble">Type or explain what you want — we'll find it</div>
              </div>

              <div className="hint-item" style={{left: hintPositions.mic, transform: "translateX(-50%)"}}>
                <div className="hint-arrow">↑</div>
                <div className="hint-bubble">Or speak</div>
              </div>

              <div className="hint-item hint-item-enlarge">
                <div className="hint-bubble">Click here to enlarge</div>
                <div className="hint-arrow hint-arrow-down">↘</div>
              </div>
            </div>
          )}
        </form>

        <div className="topbar-right">
            {isAuthenticated ? (
            <Link href={myDash} className="dash-btn">My Dashboard</Link>
          ) : (
            <div className="auth-btns">
              <Link href="/login" className="login-btn">Login</Link>
              <Link href="/register" className="register-btn">Register</Link>
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
          <button className="ab-add" onClick={() => setShowFilter(true)}>+ Add More Filter</button>
          <button className="ab-clear" onClick={clearAll}>Clear all</button>
        </div>
      )}

      {/* WHAT THE SEARCH/VOICE UNDERSTOOD — itemized, adjustable, like Jiji.
          Clicking a chip's label opens the manual filter dropdown so it
          can be fine-tuned there; the x removes it directly. Same
          Clear all / Add More Filter pair as the structured filter bar,
          for consistency between the two. */}
      {understoodFilters.length > 0 && (
        <div className="active-bar">
          <span className="ab-label">Understood:</span>
          {understoodFilters.map((f, i) => (
            <span key={i} className="af-tag">
              <span onClick={() => setShowFilter(true)} style={{cursor:"pointer"}}>{f.label}</span>
              <button onClick={() => removeUnderstoodFilter(f)}>x</button>
            </span>
          ))}
          <button className="ab-add" onClick={() => setShowFilter(true)}>+ Add More Filter</button>
          <button className="ab-clear" onClick={clearAll}>Clear all</button>
        </div>
      )}

      {/* BRAND TABS */}
      <div className="brand-scroll">
        <div className="brand-tabs">
          <button className={`btab ${!selectedBrand?"active":""}`} onClick={() => setSelectedBrand("")}>All Vehicles</button>
          {BRANDS.map((b) => (
            <button key={b} className={`btab ${selectedBrand===b?"active":""}`} onClick={() => setSelectedBrand(selectedBrand===b?"":b)}>{b}</button>
          ))}
        </div>
      </div>

      {/* FEED INFO */}
      <div className="feed-info">
        <span className="feed-count">{total.toLocaleString()} vehicles found</span>
        <div className="feed-info-controls">
          <div style={{width:"148px"}}>
            <CustomSelect value={fSort} onChange={setFSort} options={SORT_OPTIONS} />
          </div>
          <button type="button" className="feed-filter-btn" onClick={() => setShowFilter((v) => !v)}>
            Filter
          </button>
        </div>
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
          <h3>No vehicles found</h3>
          <p>Try adjusting your search or removing some filters</p>
          <button className="fd-clear" onClick={clearAll}>Clear All Filters</button>
        </div>
      ) : (
        <>
          <div className="cars-grid">
            {cars.map((car) => (
              <div key={car._id} className="car-card">
              <Link href={`/cars/${car.carId}`} className="car-card-link">
                <div className="car-img-wrap">
                  {car.images?.[0]
                    ? <img src={car.images[0]} alt="" loading="lazy"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                          const ph = e.currentTarget.nextElementSibling as HTMLElement | null;
                          if (ph) ph.style.display = "block";
                        }} />
                    : null
                  }
                  <div className="car-ph" style={{display: car.images?.[0] ? "none" : "block"}}>No Image</div>
                  <div className="car-status-tag" style={{background:STATUS_COLORS[car.status]||"#737373"}}>
                    {car.status.replace(/_/g," ")}
                  </div>
                  {car.promoPrice > 0 && car.promoPrice < car.sellingPrice && (
                    <div className="promo-tag">PROMO</div>
                  )}
                  {isAdmin && (
                    <div className="card-actions">
                      <button className="ca-btn ca-admin-del" onClick={(e) => handleAdminDelete(e, car)}>DELETE</button>
                    </div>
                  )}
                </div>

                {car.dealerName && (
                  <div className="dealer-strip">
                    <div className="ds-logo">{car.dealerLogo?<img src={car.dealerLogo} alt=""/>:car.dealerName?.charAt(0)||"D"}</div>
                    <span className="ds-name">{car.dealerName}</span>
                    {car.state && <span className="ds-loc">{car.state}</span>}
                  </div>
                )}

                <div className="car-info">
                  <div className="car-info-top">
                    <div className="car-info-main">
                      <div className="car-name">{car.brand} {car.model}</div>
                      <div className="car-sub">{car.year}{car.color?` - ${car.color}`:""}{car.transmission?` - ${car.transmission}`:""}</div>
                      {car.city && <div className="car-loc">{car.city}{car.state?`, ${car.state}`:""}</div>}
                      <div className="price-row">
                        <span className="car-price">{fmt(car.sellingPrice)}</span>
                        {car.promoPrice > 0 && car.promoPrice < car.sellingPrice && (
                          <span className="car-promo">{fmt(car.promoPrice)}</span>
                        )}
                      </div>
                    </div>
                    <div className="card-vactions">
                      <button className={`va-btn ${userLikes.includes(car.carId)?"liked":""}`} onClick={(e) => handleLike(e, car.carId)}>
                        <span className="va-icon">{userLikes.includes(car.carId) ? "♥" : "♡"}</span>
                        <span className="va-count">{car.likeCount||0}</span>
                      </button>
                      <button className="va-btn" onClick={(e) => handleToggleCommentBox(e, car.carId)}>
                        <span className="va-icon">💬</span>
                        <span className="va-count">{car.commentCount||0}</span>
                      </button>
                      <button className="va-btn" onClick={(e) => handleShare(e, car)}>
                        <span className="va-icon">⤴</span>
                      </button>
                      <button className={`va-btn ${userFavs.includes(car.carId)?"faved":""}`} onClick={(e) => handleFav(e, car.carId)}>
                        <span className="va-icon">{userFavs.includes(car.carId) ? "🔖" : "☆"}</span>
                      </button>
                    </div>
                  </div>
                  <div className="card-footer">
                    <span className="view-ct">Views: {car.viewCount||0}</span>
                    <span className="view-deal">View Deal</span>
                  </div>
                </div>
              </Link>
              </div>
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

      {commentBoxFor && (() => {
        const targetCar = cars.find(c => c.carId === commentBoxFor);
        if (!targetCar) return null;
        return (
          <div className="cmt-backdrop" onClick={() => setCommentBoxFor(null)}>
            <div className="cmt-sheet" onClick={(e) => e.stopPropagation()}>
              <div className="cmt-handle" />
              <div className="cmt-title">{targetCar.brand} {targetCar.model}</div>
              <textarea
                className="cmt-textarea"
                placeholder={isAuthenticated ? "Write a comment..." : "Log in to comment"}
                value={commentDraft}
                disabled={!isAuthenticated || postingComment}
                onChange={(e) => setCommentDraft(e.target.value)}
                autoFocus
                rows={4}
              />
              <Link href={`/cars/${targetCar.carId}?scrollTo=comments`} className="cmt-view-link">
                View {targetCar.commentCount ? `${targetCar.commentCount} ` : ""}comments
              </Link>
              <div className="cmt-actions">
                <button className="cmt-cancel" onClick={() => setCommentBoxFor(null)}>Cancel</button>
                {isAuthenticated ? (
                  <button className="cmt-post" disabled={!commentDraft.trim() || postingComment} onClick={(e) => handlePostQuickComment(e, targetCar.carId)}>
                    {postingComment ? "Posting..." : "Post"}
                  </button>
                ) : (
                  <button className="cmt-post" onClick={() => router.push("/login")}>Log In</button>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {shareCar && (
        <ShareMenu
          url={`${window.location.origin}/cars/${shareCar.carId}`}
          title={`${shareCar.brand} ${shareCar.model}`}
          onClose={() => setShareCar(null)}
        />
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
        .feed { min-height:100vh; min-height:100dvh; background:#F5F5F5; display:flex; flex-direction:column; font-family:var(--font-body); padding-bottom:calc(60px + var(--sab, env(safe-area-inset-bottom,0px))); }

        /* -- TOPBAR --------------------------- */
        .pull-indicator {
          display: flex; align-items: center; justify-content: center; overflow: hidden;
          transition: height 0.2s ease; background: #FAFAFA;
        }
        .pull-spinner {
          width: 24px; height: 24px; border: 2.5px solid #E5E5E5; border-top-color: #A3A3A3;
          border-radius: 50%; animation: pull-spin 0.8s linear infinite; transition: border-top-color 0.2s;
        }
        .pull-spinner-ready { border-top-color: #F47B20; }
        @keyframes pull-spin { to { transform: rotate(360deg); } }

        .feed-topbar {
          height:60px; background:#fff; border-bottom:1.5px solid #E5E5E5;
          display:flex; align-items:center; gap:0.875rem; padding:0 1.25rem;
          position:sticky; top:0; z-index:200; box-shadow:0 2px 8px rgba(0,0,0,0.05);
        }
        .feed-brand {
          font-family:var(--font-display); font-size:1.2rem; letter-spacing:0.2em;
          color:#F47B20; text-decoration:none; flex-shrink:0;
        }
        .search-hint-group {
          position:absolute; top:calc(100% + 4px); left:0; right:0; z-index:60; pointer-events:none;
        }
        .search-hint-dismiss {
          position:absolute; top:-2px; right:0; background:#1A1A1A; color:#fff; border:none; border-radius:50%;
          width:20px; height:20px; font-size:0.6rem; cursor:pointer; pointer-events:auto; z-index:61;
        }
        .hint-item { position:absolute; display:flex; flex-direction:column; align-items:center; pointer-events:none; }
        .hint-item-type { left:50%; transform:translateX(-50%); }
        .hint-item-enlarge {
          top:-3.6rem; right:2%; left:auto; align-items:flex-end;
        }
        .hint-arrow-down { animation:search-hint-bounce-down 1.1s ease-in-out infinite; }
        @keyframes search-hint-bounce-down { 0%,100%{transform:translateY(0);} 50%{transform:translateY(5px);} }
        .hint-arrow { font-size:1.15rem; color:#F47B20; line-height:1; animation:search-hint-bounce 1.1s ease-in-out infinite; }
        .hint-bubble {
          background:#1A1A1A; color:#fff; font-size:0.68rem; font-weight:600; padding:0.4rem 0.65rem;
          border-radius:7px; white-space:nowrap; box-shadow:0 6px 16px rgba(0,0,0,0.25); margin-top:2px;
        }
        @keyframes search-hint-bounce { 0%,100%{transform:translateY(0);} 50%{transform:translateY(-5px);} }
        @media(max-width:640px) {
          .hint-item-type .hint-bubble { white-space:normal; max-width:44vw; text-align:center; }
          .hint-bubble { font-size:0.62rem; padding:0.32rem 0.5rem; }
        }
        .search-form { display:flex; align-items:center; gap:0.5rem; flex:1; min-width:0; position:relative; }
        .people-dropdown {
          position:absolute; top:calc(100% + 8px); left:0; right:0; z-index:60;
          background:#fff; border:1.5px solid #E5E5E5; border-radius:12px;
          box-shadow:0 12px 32px rgba(0,0,0,0.14); overflow:hidden; overflow-y:auto;
          max-height:60vh; -webkit-overflow-scrolling:touch;
          width:100%; max-width:min(480px, 96vw);
        }
        .pd-section { padding:0.4rem 0; }
        .pd-section + .pd-section { border-top:1px solid #F5F5F5; }
        .pd-label { font-size:0.65rem; font-weight:800; letter-spacing:0.1em; text-transform:uppercase; color:#A3A3A3; padding:0.4rem 1rem; }
        .pd-row { display:flex; align-items:center; gap:0.625rem; padding:0.5rem 1rem; text-decoration:none; color:inherit; }
        .pd-row:hover { background:#FAFAFA; }
        .pd-avatar { width:36px; height:36px; border-radius:50%; overflow:hidden; flex-shrink:0; background:#FFF7ED; color:#F47B20; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:0.85rem; font-family:var(--font-display); }
        .pd-avatar img { width:100%; height:100%; object-fit:cover; }
        .pd-text { min-width:0; }
        .pd-title { font-size:0.85rem; font-weight:600; color:#1A1A1A; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .pd-sub { font-size:0.72rem; color:#888; }
        @media(max-width:640px) { .people-dropdown { max-width:calc(100vw - 1.5rem); left:-0.5rem; right:auto; } }
        .search-box {
          flex:1; display:flex; align-items:center; background:#F5F5F5; position:relative;
          border:1.5px solid #E5E5E5; border-radius:10px; overflow:hidden; transition:border-color 0.2s, box-shadow 0.2s;
        }
        .search-box:focus-within { border-color:#F47B20; background:#fff; box-shadow:0 0 0 3px rgba(244,123,32,0.12); }
        .search-resize-handle {
          position:absolute; bottom:1px; right:1px; width:22px; height:20px; cursor:pointer;
          display:flex; align-items:center; justify-content:center; font-size:0.85rem; color:#737373;
          background:#F5F5F5; line-height:1; border:none; padding:0; border-radius:4px; z-index:2;
        }
        .search-resize-handle:hover { color:#F47B20; }
        .s-filter-btn {
          background:#1A1A1A; color:#fff; border:none; font-family:var(--font-display); font-weight:700;
          font-size:0.85rem; letter-spacing:0.02em; padding:0.7rem 0.9rem; cursor:pointer; flex-shrink:0; align-self:stretch;
        }
        .s-filter-btn:hover { background:#F47B20; }
        .search-input { flex:1; background:transparent; border:none; padding:0.75rem 1.4rem 0.75rem 0.65rem; color:#171717; font-size:0.95rem; font-family:var(--font-body); outline:none; min-width:0; resize:none; overflow-y:auto; line-height:1.4; }
        .search-input::placeholder { color:#A3A3A3; }
        .s-clear { background:none; border:none; color:#A3A3A3; cursor:pointer; padding:0 0.5rem; font-size:0.85rem; font-weight:700; flex-shrink:0; }
        .s-mic { background:none; border:none; cursor:pointer; padding:0 0.75rem; font-size:1.05rem; line-height:1; flex-shrink:0; color:#737373; }
        .s-mic-active { color:#DC2626; animation:s-mic-pulse 1.1s ease-in-out infinite; }
        @keyframes s-mic-pulse { 0%,100%{opacity:1;transform:scale(1);} 50%{opacity:0.55;transform:scale(1.15);} }

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
          padding:0.75rem 1.25rem; background:#FFF7ED; border-bottom:1px solid rgba(244,123,32,0.2);
        }
        .ab-label { font-size:0.78rem; color:#C4621A; font-weight:700; letter-spacing:0.06em; text-transform:uppercase; flex-shrink:0; }
        .af-tag {
          display:flex; align-items:center; gap:0.35rem;
          background:#fff; border:1.5px solid #F47B20; color:#F47B20;
          border-radius:20px; padding:0.3rem 0.75rem; font-size:0.85rem; font-weight:500;
        }
        .af-tag button { background:none; border:none; cursor:pointer; color:#F47B20; font-size:0.78rem; line-height:1; padding:0; font-weight:700; }
        .ab-add { background:#fff; border:1.5px solid #F47B20; color:#F47B20; font-size:0.8rem; font-weight:600; cursor:pointer; font-family:var(--font-body); white-space:nowrap; border-radius:20px; padding:0.3rem 0.75rem; margin-left:auto; }
        .ab-clear { background:transparent; border:none; color:#DC2626; font-size:0.82rem; font-weight:600; cursor:pointer; font-family:var(--font-body); white-space:nowrap; }

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
        .feed-info-controls { display:flex; align-items:center; gap:0.5rem; margin-left:auto; }
        .feed-filter-btn { padding:0.45rem 0.9rem; border-radius:8px; border:1.5px solid #E5E5E5; background:#fff; color:#525252; font-size:0.8rem; font-weight:600; cursor:pointer; white-space:nowrap; }
        .guest-note { font-size:0.72rem; color:#A3A3A3; }

        /* CARS GRID */
        .cars-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(250px,1fr)); gap:1rem; padding:0 1.25rem 1.5rem; }

        .car-card {
          background:#fff; border:1.5px solid #E5E5E5; border-radius:12px;
          overflow:hidden; transition:all 0.2s; position:relative;
        }
        .car-card:hover { border-color:#F47B20; transform:translateY(-3px); box-shadow:0 8px 28px rgba(244,123,32,0.1); }
        .car-card-link { display:flex; flex-direction:column; text-decoration:none; color:inherit; }

        .cmt-backdrop { position:fixed; inset:0; background:rgba(0,0,0,0.5); z-index:1200; display:flex; align-items:flex-end; }
        .cmt-sheet { width:100%; background:#fff; border-radius:16px 16px 0 0; padding:0.75rem 1.25rem calc(1rem + var(--sab, 0px)); }
        .cmt-handle { width:36px; height:4px; background:#E5E5E5; border-radius:2px; margin:0 auto 0.75rem; }
        .cmt-title { font-size:0.85rem; font-weight:700; color:#1A1A1A; margin-bottom:0.75rem; }
        .cmt-textarea {
          width:100%; border:1.5px solid #E5E5E5; border-radius:10px; padding:0.7rem 0.85rem;
          font-size:0.88rem; font-family:var(--font-body); outline:none; resize:none;
          box-sizing:border-box;
        }
        .cmt-textarea:focus { border-color:#F47B20; }
        .cmt-view-link { display:inline-block; font-size:0.75rem; color:#F47B20; font-weight:600; text-decoration:none; margin-top:0.6rem; }
        .cmt-actions { display:flex; gap:0.6rem; margin-top:0.9rem; }
        .cmt-cancel {
          flex:1; padding:0.75rem; border-radius:10px; border:1.5px solid #E5E5E5;
          background:#F5F5F5; color:#525252; font-weight:700; font-size:0.85rem;
          cursor:pointer; font-family:var(--font-body);
        }
        .cmt-post {
          flex:1; padding:0.75rem; border-radius:10px; border:none;
          background:#F47B20; color:#fff; font-weight:700; font-size:0.85rem;
          cursor:pointer; font-family:var(--font-body);
        }
        .cmt-post:disabled { opacity:0.5; cursor:not-allowed; }

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
        }
        .ca-btn {
          flex:1; background:rgba(23,23,23,0.55); backdrop-filter:blur(4px); border:none;
          border-radius:5px; padding:0.3rem; font-size:0.65rem; font-weight:700;
          cursor:pointer; color:#fff; transition:background 0.15s; text-align:center;
          letter-spacing:0.04em; font-family:var(--font-body);
        }
        .ca-btn:hover { background:rgba(23,23,23,0.8); }
        .ca-admin-del { background:rgba(220,38,38,0.9)!important; }

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
        .car-info-top { display:flex; align-items:flex-start; justify-content:space-between; gap:0.5rem; }
        .car-info-main { display:flex; flex-direction:column; gap:0.28rem; min-width:0; flex:1; }
        .car-name { font-weight:700; font-size:0.9rem; color:#171717; }
        .car-sub { font-size:0.7rem; color:#737373; text-transform:capitalize; }
        .car-loc { font-size:0.68rem; color:#A3A3A3; }
        .price-row { display:flex; align-items:baseline; gap:0.5rem; margin-top:0.2rem; }
        .car-price { font-family:var(--font-display); font-size:1.2rem; color:#F47B20; letter-spacing:0.02em; }
        .car-promo { font-size:0.78rem; color:#16A34A; font-weight:600; }
        .card-vactions { display:flex; flex-direction:column; align-items:center; gap:0.5rem; flex-shrink:0; }
        .va-btn {
          display:flex; flex-direction:column; align-items:center; gap:0.1rem;
          background:none; border:none; cursor:pointer; padding:0.2rem; color:#A3A3A3;
          font-family:var(--font-body); line-height:1; min-width:32px; min-height:32px;
          justify-content:center;
        }
        .va-btn.va-static { cursor:default; }
        .va-icon { font-size:1.35rem; }
        .va-btn.liked .va-icon { color:#DC2626; }
        .va-btn.faved .va-icon { color:#F47B20; }
        .va-count { font-size:0.68rem; font-weight:700; color:#737373; }
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

        @media(max-width:400px) {
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