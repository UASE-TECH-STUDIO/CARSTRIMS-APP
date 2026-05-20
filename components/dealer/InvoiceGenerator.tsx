"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import DocumentViewer from "@/components/shared/DocumentViewer";

interface Props {
  transactionId: string;
  onClose: () => void;
}

export default function InvoiceGenerator({ transactionId, onClose }: Props) {
  const [doc, setDoc]         = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  useEffect(() => {
    api.get(`/api/v1/inventory/sales/${transactionId}/receipt`)
      .then(r => setDoc(r.data))
      .catch(e => setError(e.response?.data?.detail || "Could not load receipt. The sale may not have a completed receipt yet."))
      .finally(() => setLoading(false));
  }, [transactionId]);

  if (loading) return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:9100}}>
      <div style={{background:"#fff",borderRadius:"12px",padding:"2rem 2.5rem",textAlign:"center",display:"flex",flexDirection:"column",alignItems:"center",gap:"1rem"}}>
        <div style={{width:"32px",height:"32px",border:"3px solid #E5E5E5",borderTopColor:"#F47B20",borderRadius:"50%",animation:"spin .8s linear infinite"}}/>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <div style={{fontFamily:"var(--font-display)",fontSize:"0.875rem",letterSpacing:"0.08em",color:"#F47B20"}}>Loading document...</div>
      </div>
    </div>
  );

  if (error || !doc) return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:9100,padding:"1rem"}}>
      <div style={{background:"#fff",borderRadius:"12px",padding:"2rem",maxWidth:"400px",width:"100%",textAlign:"center",display:"flex",flexDirection:"column",gap:"1rem"}}>
        <div style={{fontSize:"2rem"}}>⚠</div>
        <div style={{fontFamily:"var(--font-display)",fontSize:"0.95rem",color:"#1A1A1A"}}>Receipt Not Available</div>
        <div style={{fontSize:"0.875rem",color:"#737373",lineHeight:1.6}}>{error||"No receipt data found for this transaction."}</div>
        <button onClick={onClose} style={{background:"#F47B20",color:"#fff",border:"none",borderRadius:"8px",padding:"0.75rem 1.5rem",fontFamily:"var(--font-display)",fontSize:"0.875rem",cursor:"pointer"}}>Close</button>
      </div>
    </div>
  );

  // Render the receipt through the same DocumentViewer used on the cars page
  return <DocumentViewer doc={doc} onClose={onClose}/>;
}
