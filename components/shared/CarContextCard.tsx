"use client";
import Link from "next/link";

interface Props {
  car: {
    carId: string;
    brand: string;
    model: string;
    year: number;
    sellingPrice?: number;
    images?: string[];
    status?: string;
    color?: string;
    condition?: string;
  };
  onClose?: () => void;
  compact?: boolean;
}

export default function CarContextCard({ car, onClose, compact }: Props) {
  const fmt = (n?: number) => n ? `₦${n.toLocaleString()}` : "";

  if (compact) return (
    <Link href={`/cars/${car.carId}`}
      style={{display:"flex",alignItems:"center",gap:"0.625rem",background:"rgba(244,123,32,0.06)",border:"1.5px solid rgba(244,123,32,0.2)",borderRadius:"10px",padding:"0.625rem 0.75rem",textDecoration:"none",transition:"background 0.15s",overflow:"hidden",minWidth:0}}
      onMouseOver={e=>(e.currentTarget.style.background="rgba(244,123,32,0.12)")}
      onMouseOut={e=>(e.currentTarget.style.background="rgba(244,123,32,0.06)")}>
      {car.images?.[0] && (
        <img src={car.images[0]} alt="" style={{width:"40px",height:"32px",objectFit:"cover",borderRadius:"6px",flexShrink:0,border:"1px solid rgba(244,123,32,0.2)"}} />
      )}
      <div style={{minWidth:0,flex:1}}>
        <div style={{fontSize:"0.78rem",fontWeight:700,color:"#C4621A",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{car.brand} {car.model} {car.year}</div>
        {car.sellingPrice && <div style={{fontSize:"0.7rem",color:"#F47B20",fontWeight:600,fontFamily:"var(--font-display)"}}>{fmt(car.sellingPrice)}</div>}
      </div>
      <span style={{fontSize:"0.65rem",color:"#F47B20",flexShrink:0}}>View →</span>
    </Link>
  );

  return (
    <div style={{background:"#FFF7ED",border:"1.5px solid rgba(244,123,32,0.25)",borderRadius:"12px",overflow:"hidden",marginBottom:"0.75rem"}}>
      <div style={{display:"flex",alignItems:"stretch",gap:0}}>
        {car.images?.[0] && (
          <Link href={`/cars/${car.carId}`} style={{flexShrink:0}}>
            <img src={car.images[0]} alt="" style={{width:"90px",height:"80px",objectFit:"cover",display:"block"}} />
          </Link>
        )}
        <div style={{flex:1,padding:"0.75rem 0.875rem",display:"flex",flexDirection:"column",justifyContent:"center",gap:"0.2rem",minWidth:0}}>
          <div style={{fontSize:"0.65rem",fontWeight:800,letterSpacing:"0.12em",textTransform:"uppercase",color:"#F47B20"}}>Enquiry about</div>
          <Link href={`/cars/${car.carId}`} style={{textDecoration:"none"}}>
            <div style={{fontSize:"0.95rem",fontWeight:700,color:"#1A1A1A",lineHeight:1.2}}>{car.brand} {car.model} {car.year}</div>
          </Link>
          <div style={{fontSize:"0.75rem",color:"#737373",textTransform:"capitalize"}}>{[car.color,car.condition].filter(Boolean).join(" · ")}</div>
          {car.sellingPrice && <div style={{fontFamily:"var(--font-display)",fontSize:"1rem",color:"#F47B20",marginTop:"0.1rem"}}>{fmt(car.sellingPrice)}</div>}
        </div>
        <div style={{display:"flex",flexDirection:"column",justifyContent:"space-between",padding:"0.5rem",flexShrink:0,alignItems:"flex-end"}}>
          {onClose && <button onClick={onClose} style={{background:"none",border:"none",color:"#A3A3A3",cursor:"pointer",fontSize:"0.9rem",lineHeight:1}}>✕</button>}
          <Link href={`/cars/${car.carId}`} style={{fontSize:"0.7rem",color:"#F47B20",textDecoration:"none",fontWeight:700,display:"flex",alignItems:"center",gap:"0.2rem",marginTop:"auto"}}>
            View car →
          </Link>
        </div>
      </div>
    </div>
  );
}
