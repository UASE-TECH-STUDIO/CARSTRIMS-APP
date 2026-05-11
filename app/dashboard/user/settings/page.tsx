"use client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function UserSettingsRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace("/dashboard/user/profile"); }, []);
  return null;
}
