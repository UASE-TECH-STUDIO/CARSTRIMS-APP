"use client";

import { useEffect, useState, useRef } from "react";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/api";

export default function UserProfilePage() {
  const auth = useAuthStore();
  const user = auth?.user || null;

  const [me, setMe] = useState<any>(null);

  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    whatsapp: "",
    address: "",
    city: "",
    state: "",
  });

  const [saving, setSaving] = useState(false);

  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const [uploading, setUploading] = useState(false);

  const fileRef = useRef<HTMLInputElement | null>(null);

  const loadMe = async () => {
    try {
      const r = await api.get("/api/v1/auth/me");

      const data = r?.data || {};

      setMe(data);

      setForm({
        fullName: data.fullName || "",
        phone: data.phone || "",
        whatsapp: data.whatsapp || "",
        address: data.address || "",
        city: data.city || "",
        state: data.state || "",
      });
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadMe();
  }, []);

  const showMsg = (m: string) => {
    setMsg(m);
    setErr("");

    setTimeout(() => {
      setMsg("");
    }, 3000);
  };

  const showErr = (m: string) => {
    setErr(m);
    setMsg("");
  };

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    setSaving(true);

    try {
      await api.patch("/api/v1/users/profile", form);

      showMsg("Profile updated successfully");

      loadMe();
    } catch (e: any) {
      showErr(
        e?.response?.data?.detail || "Failed to update profile"
      );
    } finally {
      setSaving(false);
    }
  };

  const uploadPhoto = async (file: File) => {
    try {
      setUploading(true);

      const fd = new FormData();

      fd.append("file", file);

      await api.post(
        "/api/v1/upload/profile/picture",
        fd,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      showMsg("Photo uploaded");

      loadMe();
    } catch (e: any) {
      showErr(
        e?.response?.data?.detail || "Upload failed"
      );
    } finally {
      setUploading(false);
    }
  };

  const initials =
    (me?.fullName || user?.fullName || "U")
      .charAt(0)
      .toUpperCase();

  return (
    <div className="profile-page">
      <h2 className="title">My Profile</h2>

      {msg && (
        <div className="success">
          {msg}
        </div>
      )}

      {err && (
        <div className="error">
          {err}
        </div>
      )}

      <div className="card">

        <div className="avatar-wrap">

          {me?.profilePicture ? (
            <img
              src={me.profilePicture}
              alt="profile"
              className="avatar"
            />
          ) : (
            <div className="avatar placeholder">
              {initials}
            </div>
          )}

        </div>

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={(e) => {
            const file = e.target.files?.[0];

            if (file) {
              uploadPhoto(file);
            }
          }}
        />

        <button
          className="btn"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? "Uploading..." : "Upload Photo"}
        </button>

        <form onSubmit={saveProfile} className="form">

          <input
            className="input"
            placeholder="Full Name"
            value={form.fullName}
            onChange={(e) =>
              setForm({
                ...form,
                fullName: e.target.value,
              })
            }
          />

          <input
            className="input"
            placeholder="Phone"
            value={form.phone}
            onChange={(e) =>
              setForm({
                ...form,
                phone: e.target.value,
              })
            }
          />

          <input
            className="input"
            placeholder="WhatsApp"
            value={form.whatsapp}
            onChange={(e) =>
              setForm({
                ...form,
                whatsapp: e.target.value,
              })
            }
          />

          <input
            className="input"
            placeholder="Address"
            value={form.address}
            onChange={(e) =>
              setForm({
                ...form,
                address: e.target.value,
              })
            }
          />

          <input
            className="input"
            placeholder="City"
            value={form.city}
            onChange={(e) =>
              setForm({
                ...form,
                city: e.target.value,
              })
            }
          />

          <input
            className="input"
            placeholder="State"
            value={form.state}
            onChange={(e) =>
              setForm({
                ...form,
                state: e.target.value,
              })
            }
          />

          <input
            className="input"
            value={user?.email || ""}
            disabled
          />

          <button
            type="submit"
            className="btn"
            disabled={saving}
          >
            {saving ? "Saving..." : "Save Profile"}
          </button>

        </form>

      </div>

      <style>{`
        .profile-page{
          padding:1rem;
          display:flex;
          flex-direction:column;
          gap:1rem;
        }

        .title{
          font-size:1.5rem;
          font-weight:700;
        }

        .card{
          background:#fff;
          border:1px solid #E5E5E5;
          border-radius:12px;
          padding:1rem;
          display:flex;
          flex-direction:column;
          gap:1rem;
        }

        .avatar-wrap{
          display:flex;
          justify-content:center;
        }

        .avatar{
          width:90px;
          height:90px;
          border-radius:50%;
          object-fit:cover;
        }

        .placeholder{
          background:#F47B20;
          color:#fff;
          display:flex;
          align-items:center;
          justify-content:center;
          font-size:2rem;
          font-weight:bold;
        }

        .form{
          display:flex;
          flex-direction:column;
          gap:0.75rem;
        }

        .input{
          width:100%;
          padding:0.8rem;
          border-radius:8px;
          border:1px solid #DDD;
          background:#F9F9F9;
        }

        .btn{
          background:#F47B20;
          color:#fff;
          border:none;
          border-radius:8px;
          padding:0.8rem 1rem;
          cursor:pointer;
        }

        .success{
          background:#DCFCE7;
          color:#166534;
          padding:0.75rem;
          border-radius:8px;
        }

        .error{
          background:#FEE2E2;
          color:#991B1B;
          padding:0.75rem;
          border-radius:8px;
        }
      `}</style>
    </div>
  );
}