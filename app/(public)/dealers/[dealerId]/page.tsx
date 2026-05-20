"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api"; 
import FollowButton from "@/components/ui/FollowButton"; 

export default function DealerPublicProfile({ params }: { params: { dealerId: string } }) {
  const { dealerId } = params;
  const [dealer, setDealer] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!dealerId) return;
    
    // Load main dealer profile information
    api.get(`/api/v1/public/dealers/${dealerId}`)
      .then(r => setDealer(r.data))
      .catch(()=>{})
      .finally(()=>setLoading(false));
  }, [dealerId]);

  if (loading) return <div className="p-8 text-center text-gray-500">Loading...</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900">{dealer?.name || "Dealer Profile"}</h1>
      
      <div className="mt-4">
        {/* The component manages follow state, counts, and API interaction internally */}
        <FollowButton dealerId={dealerId} />
      </div>
    </div>
  );
}
