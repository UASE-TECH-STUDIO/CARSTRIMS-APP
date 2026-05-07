
"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import Link from "next/link";

import api from "@/lib/api";

import { useAuthStore, getRoleRedirect, UserRole } from "@/store/authStore";



export default function LoginPage() {

  const router = useRouter();

  const setUser = useAuthStore((s) => s.setUser);

  const [form, setForm] = useState({ email: "", password: "" });

  const [error, setError] = useState("");

  const [loading, setLoading] = useState(false);



  const handleSubmit = async (e: React.FormEvent) => {

    e.preventDefault(); setError(""); setLoading(true);

    try {

      const res = await api.post("/api/v1/auth/login", form);

      const d = res.data;

      setUser({ userId:d.userId, fullName:d.fullName, email:d.email, role:d.role as UserRole, dealerId:d.dealerId, accessToken:d.accessToken, refreshToken:d.refreshToken });

      router.push(getRoleRedirect(d.role, d.dealerId));

    } catch (err: any) {

      setError(err.response?.data?.detail || "Invalid email or password.");

    } finally { setLoading(false); }

  };



  return (

    <div className="auth-root">

      {/* LEFT PANEL — Grey */}

      <div className="auth-left">

        <div className="al-top">

          <div className="al-brand">◈ CARSTRIMS</div>

          <div className="al-tagline">Premium Car Dealer Platform</div>

        </div>

        <div className="al-middle">

          <h1 className="al-title">THE SMARTER WAY TO BUY &amp; SELL CARS</h1>

          <p className="al-sub">Connect with verified dealers. Browse thousands of vehicles. Track every deal from listing to sale.</p>

          <div className="al-stats">

            <div className="als"><span className="als-num">6</span><span className="als-label">User Roles</span></div>

            <div className="als"><span className="als-num">∞</span><span className="als-label">Inventory</span></div>

            <div className="als"><span className="als-num">24/7</span><span className="als-label">Live Monitoring</span></div>

          </div>

        </div>

        <div className="al-bottom">

          <div className="al-dev">Developed by <strong>UASE TECH STUDIO</strong> for CARSTRIMS 2026</div>

        </div>

      </div>



      {/* RIGHT PANEL — White */}

      <div className="auth-right">

        <div className="auth-card">

          <div className="ac-header">

            <h2 className="ac-title">Welcome back</h2>

            <p className="ac-sub">Sign in to your CARSTRIMS account</p>

          </div>

          {error && <div className="auth-error">{error}</div>}

          <form onSubmit={handleSubmit} className="auth-form">

            <div className="field">

              <label className="fl">Email address</label>

              <input type="email" className="fi" placeholder="you@example.com"

                value={form.email} onChange={(e) => setForm({...form,email:e.target.value})} required />

            </div>

            <div className="field">

              <label className="fl">Password</label>

              <input type="password" className="fi" placeholder="Enter your password"

                value={form.password} onChange={(e) => setForm({...form,password:e.target.value})} required />

              <Link href="/auth/forgot-password" className="forgot-link">Forgot password?</Link>

            </div>

            <button type="submit" className="auth-btn" disabled={loading}>

              {loading ? "Signing in..." : "SIGN IN"}

            </button>

          </form>

          <p className="auth-switch">

            Don&apos;t have an account?{" "}

            <Link href="/auth/register" className="switch-link">Create one free</Link>

          </p>

          <Link href="/feed" className="back-feed">← Browse cars without signing in</Link>

        </div>

      </div>



      <style>{`

        .auth-root{display:flex;min-height:100vh;font-family:var(--font-body)}



        /* LEFT — Grey */

        .auth-left{

          width:42%;background:linear-gradient(160deg,#E5E5E5 0%,#D4D4D4 50%,#C8C8C8 100%);

          padding:3rem;display:flex;flex-direction:column;justify-content:space-between;

          position:relative;overflow:hidden;

        }

        .auth-left::before{

          content:"◈";position:absolute;bottom:-40px;right:-40px;font-family:var(--font-display);

          font-size:280px;color:rgba(244,123,32,0.08);line-height:1;pointer-events:none;

        }

        .auth-left::after{

          content:"";position:absolute;top:-60px;left:-60px;width:200px;height:200px;

          border-radius:50%;background:radial-gradient(circle,rgba(244,123,32,0.12),transparent);

          pointer-events:none;

        }

        .al-top{position:relative;z-index:1}

        .al-brand{font-family:var(--font-display);font-size:1.5rem;letter-spacing:0.2em;color:#F47B20}

        .al-tagline{font-size:0.78rem;color:#737373;margin-top:0.25rem;letter-spacing:0.08em}

        .al-middle{position:relative;z-index:1;flex:1;display:flex;flex-direction:column;justify-content:center;padding:3rem 0}

        .al-title{

          font-family:var(--font-display);font-size:clamp(1.8rem,3vw,3rem);

          line-height:1.05;color:#171717;margin-bottom:1.25rem;

        }

        .al-sub{font-size:0.9rem;color:#525252;line-height:1.65;max-width:360px}

        .al-stats{display:flex;gap:2.5rem;margin-top:2rem;padding-top:1.5rem;border-top:1px solid rgba(0,0,0,0.1)}

        .als{display:flex;flex-direction:column;gap:0.2rem}

        .als-num{font-family:var(--font-display);font-size:2rem;color:#F47B20;line-height:1}

        .als-label{font-size:0.68rem;color:#737373;letter-spacing:0.1em;text-transform:uppercase}

        .al-bottom{position:relative;z-index:1}

        .al-dev{font-size:0.7rem;color:#A3A3A3}

        .al-dev strong{color:#F47B20}



        /* RIGHT — White */

        .auth-right{flex:1;background:#F5F5F5;display:flex;align-items:center;justify-content:center;padding:2rem}

        .auth-card{

          width:100%;max-width:420px;background:#fff;border-radius:16px;

          padding:2.5rem;box-shadow:0 4px 24px rgba(0,0,0,0.08);

          display:flex;flex-direction:column;gap:1.75rem;

        }

        .ac-header{display:flex;flex-direction:column;gap:0.4rem}

        .ac-title{font-family:var(--font-display);font-size:2rem;letter-spacing:0.04em;color:#171717}

        .ac-sub{font-size:0.875rem;color:#737373}

        .auth-error{background:#FEF2F2;border:1px solid #FCA5A5;color:#DC2626;padding:0.75rem 1rem;border-radius:8px;font-size:0.875rem}

        .auth-form{display:flex;flex-direction:column;gap:1.25rem}

        .field{display:flex;flex-direction:column;gap:0.45rem}

        .fl{font-size:0.72rem;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#525252}

        .fi{

          background:#F5F5F5;border:1.5px solid #E5E5E5;border-radius:8px;

          padding:0.875rem 1rem;color:#171717;font-size:0.95rem;font-family:var(--font-body);

          outline:none;transition:all 0.2s;width:100%;

        }

        .fi:focus{border-color:#F47B20;background:#fff;box-shadow:0 0 0 3px rgba(244,123,32,0.1)}

        .fi::placeholder{color:#A3A3A3}

        .forgot-link{font-size:0.78rem;color:#F47B20;text-decoration:none;text-align:right}

        .forgot-link:hover{opacity:0.7}

        .auth-btn{

          background:#F47B20;color:#fff;border:none;border-radius:8px;padding:1rem;

          font-family:var(--font-display);font-size:1rem;letter-spacing:0.15em;

          cursor:pointer;transition:background 0.2s;margin-top:0.25rem;

        }

        .auth-btn:hover{background:#FF9340}

        .auth-btn:disabled{opacity:0.6;cursor:not-allowed}

        .auth-switch{font-size:0.875rem;color:#737373;text-align:center}

        .switch-link{color:#F47B20;text-decoration:none;font-weight:600}

        .back-feed{font-size:0.78rem;color:#A3A3A3;text-decoration:none;text-align:center;transition:color 0.2s}

        .back-feed:hover{color:#F47B20}

        @media(max-width:768px){.auth-left{display:none}.auth-right{background:#fff;padding:1.5rem}.auth-card{box-shadow:none;padding:1.5rem}}

      `}</style>

    </div>

  );

}

