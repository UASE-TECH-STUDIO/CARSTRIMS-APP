"use client";

import FormattedNumberInput from "@/components/ui/FormattedNumberInput";
import CustomSelect from "@/components/ui/CustomSelect";

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
  fMaxMileage: string; setFMaxMileage: (v: string) => void;
  fPromoOnly: boolean; setFPromoOnly: (v: boolean) => void;
  fVehicleType: string; setFVehicleType: (v: string) => void;
  fSort: string; setFSort: (v: string) => void;
  onClose: () => void;
  onClear: () => void;
}

const VEHICLE_TYPES = [{v:"car",l:"Car"},{v:"motorcycle",l:"Motorcycle"},{v:"tricycle",l:"Tricycle"},{v:"truck",l:"Truck"},{v:"bus",l:"Bus"},{v:"van",l:"Van"}];
const BRANDS = ["Toyota","Honda","Mercedes","BMW","Lexus","Ford","Hyundai","Kia","Chevrolet","Audi","Land Rover","Jeep","Volkswagen","Nissan","Mazda","Peugeot","Mitsubishi","Subaru","Volvo","Porsche"];
const CONDITIONS = [{v:"brand new",l:"Brand New"},{v:"foreign used",l:"Foreign Used"},{v:"locally used",l:"Locally Used"},{v:"salvage",l:"Salvage"}];
const TRANSMISSIONS = ["automatic","manual","semi-automatic"];
const FUEL_TYPES = ["petrol","diesel","electric","hybrid","gas"];
const COLORS = ["Black","White","Silver","Grey","Red","Blue","Green","Gold","Brown","Wine"];
const STATES_NG = ["Abuja","Lagos","Kano","Rivers","Oyo","Kaduna","Anambra","Enugu","Delta","Ogun","Imo","Ondo","Kwara","Benue","Edo","Ekiti","Cross River"];
const YEARS = Array.from({ length: 20 }, (_, i) => String(new Date().getFullYear() - i));
const SORT_OPTIONS = [
  {v:"score",l:"Recommended first"},
  {v:"newest",l:"Newest first"},
  {v:"price_asc",l:"Lowest price first"},
  {v:"price_desc",l:"Highest price first"},
];

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
    fMaxMileage, setFMaxMileage, fPromoOnly, setFPromoOnly,
    fVehicleType, setFVehicleType, fSort, setFSort,
  } = props;

  return (
    <div className="ffd-panel" onClick={(e) => e.stopPropagation()}>
      <div className="ffd-header">
        <span>Filter Vehicles</span>
        <button type="button" className="ffd-close" onClick={onClose} aria-label="Close filters">✕</button>
      </div>

      <div className="ffd-body">
        <div className="ffd-group">
          <label className="ffd-label">Vehicle Type</label>
          <div className="ffd-pills">
            {VEHICLE_TYPES.map((t) => (
              <button key={t.v} type="button" className={`ffd-pill ${fVehicleType === t.v ? "active" : ""}`}
                onClick={() => setFVehicleType(fVehicleType === t.v ? "" : t.v)}>{t.l}</button>
            ))}
          </div>
        </div>

        <div className="ffd-group">
          <label className="ffd-label">Sort By</label>
          <CustomSelect value={fSort} onChange={setFSort} options={SORT_OPTIONS.map((s) => ({value: s.v, label: s.l}))} />
        </div>

        <div className="ffd-group">
          <label className="ffd-label">Brand</label>
          <CustomSelect value={selectedBrand} onChange={setSelectedBrand} placeholder="Any brand" options={BRANDS.map((b) => ({value: b, label: b}))} />
        </div>

        <div className="ffd-group">
          <label className="ffd-label">Price Range (NGN)</label>
          <div className="ffd-row">
            <FormattedNumberInput className="ffd-input" placeholder="Min" value={fMinPrice} onChange={setFMinPrice} />
            <span className="ffd-sep">–</span>
            <FormattedNumberInput className="ffd-input" placeholder="Max" value={fMaxPrice} onChange={setFMaxPrice} />
          </div>
        </div>

        <div className="ffd-group">
          <label className="ffd-label">Year</label>
          <div className="ffd-row">
            <CustomSelect value={fYearFrom} onChange={setFYearFrom} placeholder="From" options={YEARS.map((y) => ({value: y, label: y}))} />
            <span className="ffd-sep">–</span>
            <CustomSelect value={fYearTo} onChange={setFYearTo} placeholder="To" options={YEARS.map((y) => ({value: y, label: y}))} />
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
          <CustomSelect value={fState} onChange={setFState} placeholder="Any state" options={STATES_NG.map((s) => ({value: s, label: s}))} />
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

        <div className="ffd-group">
          <label className="ffd-label">Max Mileage (km)</label>
          <FormattedNumberInput className="ffd-input" placeholder="e.g. 80,000" value={fMaxMileage} onChange={setFMaxMileage} />
        </div>

        <div className="ffd-group">
          <button type="button" className={`ffd-promo-toggle ${fPromoOnly ? "active" : ""}`} onClick={() => setFPromoOnly(!fPromoOnly)}>
            <span className="ffd-promo-check">{fPromoOnly ? "✓" : ""}</span>
            Promo cars only
          </button>
        </div>
      </div>

      <div className="ffd-footer">
        <button type="button" className="ffd-clear" onClick={onClear}>Clear All</button>
        <button type="button" className="ffd-apply" onClick={onClose}>Show Results</button>
      </div>

      <style jsx>{`
        .ffd-panel {
          position: absolute; top: calc(100% + 8px); left: 0;
          width: 100%; max-width: min(480px, 96vw);
          background: #fff; border: 1.5px solid #E5E5E5; border-radius: 14px;
          box-shadow: 0 16px 40px rgba(0,0,0,0.18); overflow: hidden; z-index: 70;
        }
        .ffd-header { display: flex; align-items: center; justify-content: space-between; padding: 0.875rem 1.1rem; border-bottom: 1px solid #F0F0F0; font-family: var(--font-display, inherit); font-size: 0.95rem; font-weight: 700; color: #1A1A1A; }
        .ffd-close { background: none; border: none; font-size: 1rem; color: #A3A3A3; cursor: pointer; padding: 0.25rem; }
        .ffd-body { max-height: min(60vh, 480px); overflow-y: auto; -webkit-overflow-scrolling: touch; padding: 1rem 1.1rem; display: flex; flex-direction: column; gap: 1.1rem; }
        .ffd-group { display: flex; flex-direction: column; gap: 0.45rem; }
        .ffd-label { font-size: 0.72rem; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: #737373; }
        .ffd-select { border: 1.5px solid #E5E5E5; border-radius: 8px; padding: 0.75rem 0.85rem; font-size: 0.95rem; background: #fff; color: #1A1A1A; width: 100%; min-height: 46px; }
        .ffd-input { border: 1.5px solid #E5E5E5; border-radius: 8px; padding: 0.75rem 0.85rem; font-size: 0.95rem; width: 100%; min-width: 0; min-height: 46px; }
        .ffd-row { display: flex; align-items: center; gap: 0.5rem; }
        .ffd-row .ffd-input, .ffd-row .ffd-select { min-width: 90px; }
        .ffd-sep { color: #A3A3A3; flex-shrink: 0; }
        .ffd-pills { display: flex; flex-wrap: wrap; gap: 0.4rem; }
        .ffd-pill { background: #F5F5F5; border: 1.5px solid #E5E5E5; border-radius: 20px; padding: 0.4rem 0.8rem; font-size: 0.8rem; color: #525252; cursor: pointer; text-transform: capitalize; }
        .ffd-pill.active { background: #F47B20; border-color: #F47B20; color: #fff; font-weight: 600; }
        .ffd-promo-toggle {
          display: flex; align-items: center; gap: 0.6rem; background: #F5F5F5; border: 1.5px solid #E5E5E5;
          border-radius: 8px; padding: 0.6rem 0.8rem; font-size: 0.85rem; color: #525252; cursor: pointer; width: 100%; text-align: left;
        }
        .ffd-promo-toggle.active { background: #FFF7ED; border-color: #F47B20; color: #F47B20; font-weight: 600; }
        .ffd-promo-check {
          width: 18px; height: 18px; border: 1.5px solid #E5E5E5; border-radius: 4px; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center; font-size: 0.7rem; background: #fff;
        }
        .ffd-promo-toggle.active .ffd-promo-check { background: #F47B20; border-color: #F47B20; color: #fff; }
        .ffd-footer { display: flex; gap: 0.6rem; padding: 0.9rem 1.1rem; border-top: 1px solid #F0F0F0; }
        .ffd-clear { flex: 1; background: #F5F5F5; border: 1.5px solid #E5E5E5; border-radius: 8px; padding: 0.7rem; font-size: 0.85rem; font-weight: 600; color: #525252; cursor: pointer; }
        .ffd-apply { flex: 1; background: #F47B20; border: none; border-radius: 8px; padding: 0.7rem; font-size: 0.85rem; font-weight: 700; color: #fff; cursor: pointer; }

        @media (max-width: 640px) {
          .ffd-panel { max-width: calc(100vw - 1rem); left: 50%; transform: translateX(-50%); }
          .ffd-body { padding: 1.1rem 1.2rem; gap: 1.3rem; }
          .ffd-label { font-size: 0.76rem; }
          .ffd-select, .ffd-input { font-size: 1rem; padding: 0.8rem 0.9rem; min-height: 48px; }
          .ffd-pill { padding: 0.55rem 1rem; font-size: 0.85rem; }
          .ffd-row { gap: 0.6rem; }
          .ffd-clear, .ffd-apply { padding: 0.85rem; font-size: 0.9rem; }
        }
      `}</style>
    </div>
  );
}
