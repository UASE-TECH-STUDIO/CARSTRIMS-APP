"use client";

interface Props {
  selectedBrand: string; setSelectedBrand: (v: string) => void;
  fCondition: string; setFCondition: (v: string) => void;
  fTransmission: string; setFTransmission: (v: string) => void;
  fFuel: string; setFFuel: (v: string) => void;
  fState: string; setFState: (v: string) => void;
  fColor: string; setFColor: (v: string) => void;
  fYearFrom: string; setFYearFrom: (v: string) => void;
  fYearTo: string; setFYearTo: (v: string) => void;
  fMinPrice: string; setFMinPrice: (v: string) => void;
  fMaxPrice: string; setFMaxPrice: (v: string) => void;
  fStatus: string; setFStatus: (v: string) => void;
  onClose: () => void;
  onClear: () => void;
}

const BRANDS = ["Toyota","Honda","Mercedes","BMW","Lexus","Ford","Hyundai","Kia","Chevrolet","Audi","Land Rover","Jeep","Volkswagen","Nissan","Mazda","Peugeot","Mitsubishi","Subaru","Volvo","Porsche"];
const CONDITIONS = [{v:"brand new",l:"Brand New"},{v:"foreign used",l:"Foreign Used"},{v:"locally used",l:"Locally Used"},{v:"salvage",l:"Salvage"}];
const TRANSMISSIONS = ["automatic","manual","semi-automatic"];
const FUEL_TYPES = ["petrol","diesel","electric","hybrid","gas"];
const COLORS = ["Black","White","Silver","Grey","Red","Blue","Green","Gold","Brown","Wine"];
const STATES_NG = ["Abuja","Lagos","Kano","Rivers","Oyo","Kaduna","Anambra","Enugu","Delta","Ogun","Imo","Ondo","Kwara","Benue","Edo","Ekiti","Cross River"];
const YEARS = Array.from({ length: 20 }, (_, i) => String(new Date().getFullYear() - i));

/**
 * The manual/structured filter picker — matches everything a Jiji-
 * style car filter panel has (brand, price range, year range,
 * condition, transmission, fuel, color, location, status), for anyone
 * who'd rather click than type or speak.
 *
 * Positioning is deliberately conservative: max-width capped relative
 * to the viewport on every breakpoint (not just one), scrolls
 * internally rather than growing past the screen, and re-centers on
 * very small screens instead of anchoring to the search box edge —
 * this app has had a real off-screen-dropdown bug before, so this is
 * written defensively against that specific failure mode.
 */
export default function FeedFilterDropdown(props: Props) {
  const {
    selectedBrand, setSelectedBrand, fCondition, setFCondition, fTransmission, setFTransmission,
    fFuel, setFFuel, fState, setFState, fColor, setFColor, fYearFrom, setFYearFrom,
    fYearTo, setFYearTo, fMinPrice, setFMinPrice, fMaxPrice, setFMaxPrice,
    fStatus, setFStatus, onClose, onClear,
  } = props;

  return (
    <div className="ffd-panel" onClick={(e) => e.stopPropagation()}>
      <div className="ffd-header">
        <span>Filter Cars</span>
        <button type="button" className="ffd-close" onClick={onClose} aria-label="Close filters">✕</button>
      </div>

      <div className="ffd-body">
        <div className="ffd-group">
          <label className="ffd-label">Brand</label>
          <select className="ffd-select" value={selectedBrand} onChange={(e) => setSelectedBrand(e.target.value)}>
            <option value="">Any brand</option>
            {BRANDS.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>

        <div className="ffd-group">
          <label className="ffd-label">Price Range (NGN)</label>
          <div className="ffd-row">
            <input className="ffd-input" type="number" placeholder="Min" value={fMinPrice} onChange={(e) => setFMinPrice(e.target.value)} />
            <span className="ffd-sep">–</span>
            <input className="ffd-input" type="number" placeholder="Max" value={fMaxPrice} onChange={(e) => setFMaxPrice(e.target.value)} />
          </div>
        </div>

        <div className="ffd-group">
          <label className="ffd-label">Year</label>
          <div className="ffd-row">
            <select className="ffd-select" value={fYearFrom} onChange={(e) => setFYearFrom(e.target.value)}>
              <option value="">From</option>
              {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
            <span className="ffd-sep">–</span>
            <select className="ffd-select" value={fYearTo} onChange={(e) => setFYearTo(e.target.value)}>
              <option value="">To</option>
              {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>

        <div className="ffd-group">
          <label className="ffd-label">Condition</label>
          <div className="ffd-pills">
            {CONDITIONS.map((c) => (
              <button key={c.v} type="button" className={`ffd-pill ${fCondition === c.v ? "active" : ""}`}
                onClick={() => setFCondition(fCondition === c.v ? "" : c.v)}>{c.l}</button>
            ))}
          </div>
        </div>

        <div className="ffd-group">
          <label className="ffd-label">Transmission</label>
          <div className="ffd-pills">
            {TRANSMISSIONS.map((t) => (
              <button key={t} type="button" className={`ffd-pill ${fTransmission === t ? "active" : ""}`}
                onClick={() => setFTransmission(fTransmission === t ? "" : t)}>{t}</button>
            ))}
          </div>
        </div>

        <div className="ffd-group">
          <label className="ffd-label">Fuel Type</label>
          <div className="ffd-pills">
            {FUEL_TYPES.map((f) => (
              <button key={f} type="button" className={`ffd-pill ${fFuel === f ? "active" : ""}`}
                onClick={() => setFFuel(fFuel === f ? "" : f)}>{f}</button>
            ))}
          </div>
        </div>

        <div className="ffd-group">
          <label className="ffd-label">Color</label>
          <div className="ffd-pills">
            {COLORS.map((c) => (
              <button key={c} type="button" className={`ffd-pill ${fColor === c ? "active" : ""}`}
                onClick={() => setFColor(fColor === c ? "" : c)}>{c}</button>
            ))}
          </div>
        </div>

        <div className="ffd-group">
          <label className="ffd-label">Location</label>
          <select className="ffd-select" value={fState} onChange={(e) => setFState(e.target.value)}>
            <option value="">Any state</option>
            {STATES_NG.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div className="ffd-group">
          <label className="ffd-label">Status</label>
          <div className="ffd-pills">
            {["available","sold"].map((s) => (
              <button key={s} type="button" className={`ffd-pill ${fStatus === s ? "active" : ""}`}
                onClick={() => setFStatus(fStatus === s ? "available" : s)}>{s}</button>
            ))}
          </div>
        </div>
      </div>

      <div className="ffd-footer">
        <button type="button" className="ffd-clear" onClick={onClear}>Clear All</button>
        <button type="button" className="ffd-apply" onClick={onClose}>Show Results</button>
      </div>

      <style jsx>{`
        .ffd-panel {
          position: absolute; top: calc(100% + 8px); left: 0;
          width: 100%; max-width: min(420px, 94vw);
          background: #fff; border: 1.5px solid #E5E5E5; border-radius: 14px;
          box-shadow: 0 16px 40px rgba(0,0,0,0.18); overflow: hidden; z-index: 70;
        }
        .ffd-header { display: flex; align-items: center; justify-content: space-between; padding: 0.875rem 1.1rem; border-bottom: 1px solid #F0F0F0; font-family: var(--font-display, inherit); font-size: 0.95rem; font-weight: 700; color: #1A1A1A; }
        .ffd-close { background: none; border: none; font-size: 1rem; color: #A3A3A3; cursor: pointer; padding: 0.25rem; }
        .ffd-body { max-height: min(60vh, 480px); overflow-y: auto; -webkit-overflow-scrolling: touch; padding: 1rem 1.1rem; display: flex; flex-direction: column; gap: 1.1rem; }
        .ffd-group { display: flex; flex-direction: column; gap: 0.45rem; }
        .ffd-label { font-size: 0.72rem; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: #737373; }
        .ffd-select { border: 1.5px solid #E5E5E5; border-radius: 8px; padding: 0.55rem 0.7rem; font-size: 0.88rem; background: #fff; color: #1A1A1A; width: 100%; }
        .ffd-input { border: 1.5px solid #E5E5E5; border-radius: 8px; padding: 0.55rem 0.7rem; font-size: 0.88rem; width: 100%; min-width: 0; }
        .ffd-row { display: flex; align-items: center; gap: 0.5rem; }
        .ffd-sep { color: #A3A3A3; flex-shrink: 0; }
        .ffd-pills { display: flex; flex-wrap: wrap; gap: 0.4rem; }
        .ffd-pill { background: #F5F5F5; border: 1.5px solid #E5E5E5; border-radius: 20px; padding: 0.4rem 0.8rem; font-size: 0.8rem; color: #525252; cursor: pointer; text-transform: capitalize; }
        .ffd-pill.active { background: #F47B20; border-color: #F47B20; color: #fff; font-weight: 600; }
        .ffd-footer { display: flex; gap: 0.6rem; padding: 0.9rem 1.1rem; border-top: 1px solid #F0F0F0; }
        .ffd-clear { flex: 1; background: #F5F5F5; border: 1.5px solid #E5E5E5; border-radius: 8px; padding: 0.7rem; font-size: 0.85rem; font-weight: 600; color: #525252; cursor: pointer; }
        .ffd-apply { flex: 1; background: #F47B20; border: none; border-radius: 8px; padding: 0.7rem; font-size: 0.85rem; font-weight: 700; color: #fff; cursor: pointer; }

        @media (max-width: 640px) {
          .ffd-panel { max-width: calc(100vw - 1.5rem); left: 50%; transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}
