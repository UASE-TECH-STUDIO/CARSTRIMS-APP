"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";

export default function UserPublicProfile({ params }: { params: { userId: string } }) {
  const { userId } = params;
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    
    // Try userId directly — backend accepts both MongoDB _id and USR-XXXX strings
    api.get(`/api/v1/public/users/${userId}`)
      .then(r => setProfile(r.data))
      .catch(async () => {
        // If the API drops a 404/error, cleanly set profile to null for graceful fallback rendering
        setProfile(null);
      })
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading profile...</div>;
  }

  if (!profile) {
    return (
      <div className="p-8 text-center max-w-md mx-auto mt-12 border border-gray-200 rounded-xl bg-white shadow-sm">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Profile Not Found</h2>
        <p className="text-gray-500 text-sm">The user profile you are looking for does not exist or has been removed.</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900">{profile.name || "User Profile"}</h1>
        <p className="text-sm text-gray-500 mt-1">Member since {profile.createdAt ? new Date(profile.createdAt).toLocaleDateString() : "N/A"}</p>
        
        {/* Add more profile layout items here as needed */}
      </div>
    </div>
  );
}
