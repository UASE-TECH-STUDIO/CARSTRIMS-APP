import { useState, useEffect } from "react";
import api from "@/lib/api"; // Adjust based on your exact import path
import FollowBtn from "@/components/shared/FollowBtn"; // Adjust based on your exact import path

export default function DealerPublicProfile({ params }: { params: { dealerId: string } }) {
  const { dealerId } = params;
  const [dealer, setDealer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Fix the state that drives followerCount and isFollowing — load from status endpoint
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
    
    // Load following status from dedicated endpoint (authoritative)
    api.get(`/api/v1/follows/status/${dealerId}`)
      .then(r => { setIsFollowing(r.data.following||false); setFollowerCount(r.data.followerCount||0); })
      .catch(()=>{});
  }, [dealerId]);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">{dealer?.name || "Dealer Profile"}</h1>
      <p className="text-gray-600">{followerCount} Followers</p>
      
      {/* Fix FollowBtn usage — pass following prop and update count on change */}
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
