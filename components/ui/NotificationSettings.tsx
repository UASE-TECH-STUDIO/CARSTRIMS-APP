"use client";
import { useState, useEffect } from "react";
import { useNotifications } from "@/hooks/useNotifications";

export default function NotificationSettings() {
  const { getPrefs, savePrefs, requestPermission } = useNotifications();
  const [prefs, setPrefs] = useState({ systemNotif: true, sound: true });
  const [permission, setPermission] = useState("default");

  useEffect(() => {
    setPrefs(getPrefs());
    if ("Notification" in window) setPermission(Notification.permission);
  }, []);

  const toggle = (key: "systemNotif" | "sound") => {
    const next = { ...prefs, [key]: !prefs[key] };
    setPrefs(next);
    savePrefs(next);
  };

  const enable = async () => {
    await requestPermission();
    if ("Notification" in window) setPermission(Notification.permission);
  };

  return (
    <div className="notif-settings">
      <div className="ns-title">NOTIFICATION PREFERENCES</div>

      {permission === "denied" && (
        <div className="ns-warn">
          Notifications are blocked in your browser. Go to browser Settings to allow them.
        </div>
      )}

      {permission === "default" && (
        <button className="ns-enable-btn" onClick={enable}>
          Enable Browser Notifications
        </button>
      )}

      <div className="ns-item">
        <div className="ns-info">
          <div className="ns-label">Device Notifications</div>
          <div className="ns-desc">Show notifications on your device even when app is not open</div>
        </div>
        <button
          className={`ns-toggle ${prefs.systemNotif ? "on" : "off"}`}
          onClick={() => toggle("systemNotif")}
        >
          <div className="ns-knob" />
        </button>
      </div>

      <div className="ns-item">
        <div className="ns-info">
          <div className="ns-label">Notification Sound</div>
          <div className="ns-desc">Play audio alert when a notification arrives (DND mode when off)</div>
        </div>
        <button
          className={`ns-toggle ${prefs.sound ? "on" : "off"}`}
          onClick={() => toggle("sound")}
        >
          <div className="ns-knob" />
        </button>
      </div>

      <div className="ns-status">
        Status: {permission === "granted" ? "Notifications enabled" : permission === "denied" ? "Blocked" : "Not yet enabled"}
      </div>

      <style>{`
        .notif-settings{display:flex;flex-direction:column;gap:1rem;padding:1.25rem;background:#fff;border:1.5px solid #E5E5E5;border-radius:10px}
        .ns-title{font-size:0.65rem;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;color:#737373}
        .ns-warn{background:#FEF2F2;border:1px solid #FCA5A5;color:#DC2626;padding:0.75rem;border-radius:6px;font-size:0.8rem;line-height:1.4}
        .ns-enable-btn{background:#F47B20;color:#fff;border:none;border-radius:6px;padding:0.65rem 1.25rem;font-family:var(--font-display);font-size:0.825rem;letter-spacing:0.08em;cursor:pointer;align-self:flex-start}
        .ns-item{display:flex;align-items:center;gap:1rem;justify-content:space-between;padding:0.75rem 0;border-bottom:1px solid #F5F5F5}
        .ns-item:last-of-type{border-bottom:none}
        .ns-info{flex:1}
        .ns-label{font-size:0.875rem;font-weight:500;color:#1A1A1A}
        .ns-desc{font-size:0.72rem;color:#A3A3A3;margin-top:0.2rem;line-height:1.4}
        .ns-toggle{width:44px;height:24px;border-radius:12px;border:none;cursor:pointer;position:relative;transition:background 0.25s;flex-shrink:0;padding:0}
        .ns-toggle.on{background:#F47B20}
        .ns-toggle.off{background:#D4D4D4}
        .ns-knob{position:absolute;top:2px;width:20px;height:20px;border-radius:50%;background:#fff;box-shadow:0 1px 4px rgba(0,0,0,0.2);transition:left 0.25s}
        .ns-toggle.on .ns-knob{left:22px}
        .ns-toggle.off .ns-knob{left:2px}
        .ns-status{font-size:0.72rem;color:#A3A3A3;font-style:italic}
      `}</style>
    </div>
  );
}
