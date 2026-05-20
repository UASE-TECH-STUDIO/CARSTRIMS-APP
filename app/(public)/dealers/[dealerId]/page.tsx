"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api"; 
import FollowBtn from "@/components/shared/FollowBtn"; 

export default function DealerPublicProfile({ params }: { params: { dealerId: string } }) {
  const { dealerId } = params;
  const [dealer, setDealer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [followerCount, setFollowerCount] = useState(0);
  const [isFollowing, setIsFollowing]   = useState(false);
  const [followers, setFollowers] = useState<any[]>([]);
  const [showFollowers, setShowFollowers] = useState(false);
  const [lightbox, setLightbox]   = useState<string|null>(null);
  const [startMsg, setStartMsg]   = useState(false);

  useEffect(() => {
    if (!dealerId) return;
    api.get(`/api/v1/public/dealers/${dealerId}`)
      .then(r => { setDealer(r.data); setFollowerCount(r.data.followerCount||0); })
      .catch(()=>{})
      .finally(()=>setLoading(false));
    
    api.get(`/api/v1/follows/status/${dealerId}`)
      .then(r => { setIsFollowing(r.data.following||false); setFollowerCount(r.data.followerCount||0); })
      .catch(()=>{});
  }, [dealerId]);

  if (loading) return <div className="p-8 text-center text-gray-500">Loading...</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900">{dealer?.name || "Dealer Profile"}</h1>
      <p className="text-gray-600">{followerCount} Followers</p>
      
      <div className="mt-4">
        <FollowBtn 
          dealerId={dealerId} 
          following={isFollowing} 
          onChange={(f)=>{ setIsFollowing(f); setFollowerCount(c=>f?c+1:Math.max(0,c-1)); }}
        />
      </div>
    </div>
  );
}
