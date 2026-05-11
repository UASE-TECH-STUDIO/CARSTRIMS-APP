"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RootPage() {
  const router = useRouter();
  useEffect(() => { router.replace("/feed"); }, [router]);
  return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"100vh",background:"#F5F5F5"}}>
      <div style={{fontFamily:"Bebas Neue, sans-serif",fontSize:"1.5rem",letterSpacing:"0.2em",color:"#F47B20"}}>CARSTRIMS</div>
    </div>
  );
}