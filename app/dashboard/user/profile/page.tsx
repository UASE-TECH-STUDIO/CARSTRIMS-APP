"use client";

import { useEffect, useRef, useState } from "react";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

export default function CustomerProfilePage() {
  const { user } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const fileRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState<any>(null);

  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    whatsapp: "",
    city: "",
    state: "",
    bio: "",
    instagram: "",
    facebook: "",
    twitter: "",
    tiktok: "",
    website: "",
  });

  const [pwForm, setPwForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const loadProfile = async () => {
    try {
      const res = await api.get("/api/v1/users/me");

      setProfile(res.data);

      setForm({
        fullName: res.data.fullName || "",
        phone: res.data.phone || "",
        whatsapp: res.data.whatsapp || "",
        city: res.data.city || "",
        state: res.data.state || "",
        bio: res.data.bio || "",
        instagram: res.data.instagram || "",
        facebook: res.data.facebook || "",
        twitter: res.data.twitter || "",
        tiktok: res.data.tiktok || "",
        website: res.data.website || "",
      });
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      await api.patch("/api/v1/users/me", form);

      setSuccess("Profile updated successfully!");

      loadProfile();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (pwForm.newPassword.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setPwSaving(true);
    setError("");
    setSuccess("");

    try {
      await api.post("/api/v1/auth/change-password", {
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword,
      });

      setSuccess("Password changed successfully!");

      setPwForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed");
    } finally {
      setPwSaving(false);
    }
  };

  const uploadAvatar = async (file: File) => {
    setUploading(true);

    const fd = new FormData();

    fd.append("file", file);

    try {
      await api.post("/api/v1/upload/avatar", fd, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setSuccess("Profile photo updated!");

      loadProfile();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-wrap">
        <div className="spinner" />

        <style>{`
          .loading-wrap{
            min-height:300px;
            display:flex;
            align-items:center;
            justify-content:center;
          }

          .spinner{
            width:30px;
            height:30px;
            border-radius:50%;
            border:3px solid #E5E5E5;
            border-top-color:#F47B20;
            animation:spin .8s linear infinite;
          }

          @keyframes spin{
            to{transform:rotate(360deg)}
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="profile-top">
        <div className="profile-main">
          <div
            className="profile-avatar-wrap"
            onClick={() => fileRef.current?.click()}
          >
            {uploading ? (
              <div className="avatar-loading">Uploading...</div>
            ) : profile?.avatar ? (
              <img
                src={profile.avatar}
                alt="avatar"
                className="profile-avatar"
              />
            ) : (
              <div className="profile-avatar-placeholder">
                {profile?.fullName?.charAt(0) || "U"}
              </div>
            )}

            <div className="avatar-overlay">
              Change Photo
            </div>
          </div>

          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            style={{ display: "none" }}
            onChange={(e) => {
              const file = e.target.files?.[0];

              if (file) uploadAvatar(file);
            }}
          />

          <div className="profile-meta">
            <h1>{profile?.fullName}</h1>

            <p>
              {profile?.city || "Unknown City"},{" "}
              {profile?.state || "Unknown State"}
            </p>

            <div className="profile-badges">
              <span className="badge verified">
                Verified Buyer
              </span>

              <span className="badge user-id">
                {user?.userId}
              </span>
            </div>
          </div>
        </div>
      </div>

      {success && (
        <div className="success-banner">
          ✅ {success}

          <button onClick={() => setSuccess("")}>
            ✕
          </button>
        </div>
      )}

      {error && (
        <div className="error-banner">
          ❌ {error}

          <button onClick={() => setError("")}>
            ✕
          </button>
        </div>
      )}

      <div className="settings-grid">
        {/* PERSONAL INFO */}
        <div className="settings-card wide">
          <h3 className="card-title">
            PERSONAL INFORMATION
          </h3>

          <form onSubmit={saveProfile} className="settings-form">
            <div className="form-row">
              <div className="field">
                <label className="fl">
                  Full Name
                </label>

                <input
                  className="fi"
                  value={form.fullName}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      fullName: e.target.value,
                    })
                  }
                />
              </div>

              <div className="field">
                <label className="fl">
                  Phone
                </label>

                <input
                  className="fi"
                  value={form.phone}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      phone: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            <div className="form-row">
              <div className="field">
                <label className="fl">
                  WhatsApp
                </label>

                <input
                  className="fi"
                  value={form.whatsapp}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      whatsapp: e.target.value,
                    })
                  }
                />
              </div>

              <div className="field">
                <label className="fl">
                  City
                </label>

                <input
                  className="fi"
                  value={form.city}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      city: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            <div className="field">
              <label className="fl">
                State
              </label>

              <input
                className="fi"
                value={form.state}
                onChange={(e) =>
                  setForm({
                    ...form,
                    state: e.target.value,
                  })
                }
              />
            </div>

            <div className="field">
              <label className="fl">
                Bio
              </label>

              <textarea
                rows={4}
                className="fi fi-ta"
                value={form.bio}
                onChange={(e) =>
                  setForm({
                    ...form,
                    bio: e.target.value,
                  })
                }
              />
            </div>

            <div className="section-divider">
              SOCIAL LINKS
            </div>

            <div className="form-row">
              <div className="field">
                <label className="fl">
                  Instagram
                </label>

                <input
                  className="fi"
                  value={form.instagram}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      instagram: e.target.value,
                    })
                  }
                />
              </div>

              <div className="field">
                <label className="fl">
                  Facebook
                </label>

                <input
                  className="fi"
                  value={form.facebook}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      facebook: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            <div className="form-row">
              <div className="field">
                <label className="fl">
                  Twitter / X
                </label>

                <input
                  className="fi"
                  value={form.twitter}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      twitter: e.target.value,
                    })
                  }
                />
              </div>

              <div className="field">
                <label className="fl">
                  TikTok
                </label>

                <input
                  className="fi"
                  value={form.tiktok}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      tiktok: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            <div className="field">
              <label className="fl">
                Website
              </label>

              <input
                className="fi"
                value={form.website}
                onChange={(e) =>
                  setForm({
                    ...form,
                    website: e.target.value,
                  })
                }
              />
            </div>

            <button
              type="submit"
              className="save-btn"
              disabled={saving}
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </form>
        </div>

        {/* CHANGE PASSWORD */}
        <div className="settings-card">
          <h3 className="card-title">
            CHANGE PASSWORD
          </h3>

          <form
            onSubmit={changePassword}
            className="settings-form"
          >
            <div className="field">
              <label className="fl">
                Current Password
              </label>

              <input
                type="password"
                className="fi"
                value={pwForm.currentPassword}
                onChange={(e) =>
                  setPwForm({
                    ...pwForm,
                    currentPassword: e.target.value,
                  })
                }
              />
            </div>

            <div className="field">
              <label className="fl">
                New Password
              </label>

              <input
                type="password"
                className="fi"
                value={pwForm.newPassword}
                onChange={(e) =>
                  setPwForm({
                    ...pwForm,
                    newPassword: e.target.value,
                  })
                }
              />
            </div>

            <div className="field">
              <label className="fl">
                Confirm Password
              </label>

              <input
                type="password"
                className="fi"
                value={pwForm.confirmPassword}
                onChange={(e) =>
                  setPwForm({
                    ...pwForm,
                    confirmPassword: e.target.value,
                  })
                }
              />
            </div>

            <button
              className="save-btn"
              disabled={pwSaving}
            >
              {pwSaving
                ? "Changing..."
                : "Change Password"}
            </button>
          </form>
        </div>

        {/* ACCOUNT INFO */}
        <div className="settings-card">
          <h3 className="card-title">
            ACCOUNT INFORMATION
          </h3>

          <div className="info-list">
            <div className="info-row">
              <span className="il">Email</span>

              <span className="iv">
                {user?.email}
              </span>
            </div>

            <div className="info-row">
              <span className="il">Role</span>

              <span className="iv">
                Customer / Buyer
              </span>
            </div>

            <div className="info-row">
              <span className="il">User ID</span>

              <span className="iv mono">
                {user?.userId}
              </span>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .profile-page{
          display:flex;
          flex-direction:column;
          gap:1.5rem;
        }

        .profile-top{
          background:#fff;
          border:1.5px solid #E5E5E5;
          border-radius:12px;
          padding:1.5rem;
        }

        .profile-main{
          display:flex;
          align-items:center;
          gap:1.25rem;
          flex-wrap:wrap;
        }

        .profile-avatar-wrap{
          width:100px;
          height:100px;
          border-radius:50%;
          overflow:hidden;
          position:relative;
          cursor:pointer;
          border:4px solid #F47B20;
          background:#FFF7ED;
        }

        .profile-avatar{
          width:100%;
          height:100%;
          object-fit:cover;
        }

        .profile-avatar-placeholder{
          width:100%;
          height:100%;
          display:flex;
          align-items:center;
          justify-content:center;
          font-size:2rem;
          font-weight:bold;
          color:#F47B20;
        }

        .avatar-loading{
          display:flex;
          align-items:center;
          justify-content:center;
          width:100%;
          height:100%;
          font-size:0.7rem;
          color:#F47B20;
        }

        .avatar-overlay{
          position:absolute;
          inset:0;
          background:rgba(0,0,0,.5);
          color:#fff;
          font-size:.7rem;
          display:flex;
          align-items:center;
          justify-content:center;
          opacity:0;
          transition:.2s;
        }

        .profile-avatar-wrap:hover .avatar-overlay{
          opacity:1;
        }

        .profile-meta h1{
          margin:0;
          font-size:1.5rem;
        }

        .profile-meta p{
          color:#777;
          margin-top:.3rem;
        }

        .profile-badges{
          display:flex;
          gap:.75rem;
          margin-top:.75rem;
          flex-wrap:wrap;
        }

        .badge{
          padding:.35rem .75rem;
          border-radius:999px;
          font-size:.75rem;
        }

        .verified{
          background:#DCFCE7;
          color:#166534;
        }

        .user-id{
          background:#F5F5F5;
          font-family:monospace;
        }

        .success-banner,
        .error-banner{
          padding:.9rem 1rem;
          border-radius:8px;
          display:flex;
          justify-content:space-between;
          align-items:center;
        }

        .success-banner{
          background:#FFF7ED;
          border:1px solid #F47B20;
          color:#C4621A;
        }

        .error-banner{
          background:#FEF2F2;
          border:1px solid #FCA5A5;
          color:#DC2626;
        }

        .success-banner button,
        .error-banner button{
          background:none;
          border:none;
          cursor:pointer;
          color:inherit;
        }

        .settings-grid{
          display:grid;
          grid-template-columns:repeat(auto-fill,minmax(320px,1fr));
          gap:1.25rem;
        }

        .settings-card{
          background:#fff;
          border:1.5px solid #E5E5E5;
          border-radius:10px;
          padding:1.5rem;
          display:flex;
          flex-direction:column;
          gap:1rem;
        }

        .wide{
          grid-column:1/-1;
        }

        .card-title{
          font-size:.78rem;
          letter-spacing:.15em;
          color:#888;
        }

        .settings-form{
          display:flex;
          flex-direction:column;
          gap:.9rem;
        }

        .form-row{
          display:grid;
          grid-template-columns:1fr 1fr;
          gap:.9rem;
        }

        .field{
          display:flex;
          flex-direction:column;
          gap:.4rem;
        }

        .fl{
          font-size:.68rem;
          font-weight:600;
          letter-spacing:.1em;
          text-transform:uppercase;
          color:#888;
        }

        .fi{
          background:#F5F5F5;
          border:1.5px solid #DDD;
          border-radius:6px;
          padding:.75rem;
          font-size:.875rem;
          outline:none;
          transition:.2s;
        }

        .fi:focus{
          border-color:#F47B20;
          background:#fff;
        }

        .fi-ta{
          resize:vertical;
          min-height:90px;
        }

        .section-divider{
          border-top:1px solid #E5E5E5;
          border-bottom:1px solid #E5E5E5;
          padding:.7rem 0;
          text-align:center;
          font-size:.7rem;
          letter-spacing:.15em;
          color:#AAA;
        }

        .save-btn{
          background:#F47B20;
          color:#fff;
          border:none;
          border-radius:6px;
          padding:.85rem 1.5rem;
          cursor:pointer;
          font-size:.9rem;
        }

        .save-btn:hover{
          background:#FF9340;
        }

        .save-btn:disabled{
          opacity:.6;
          cursor:not-allowed;
        }

        .info-list{
          display:flex;
          flex-direction:column;
          gap:.5rem;
        }

        .info-row{
          display:flex;
          justify-content:space-between;
          padding:.6rem 0;
          border-bottom:1px solid #F0F0F0;
        }

        .info-row:last-child{
          border-bottom:none;
        }

        .il{
          color:#888;
          font-size:.8rem;
        }

        .iv{
          font-size:.82rem;
        }

        .mono{
          font-family:monospace;
        }

        @media(max-width:640px){
          .form-row{
            grid-template-columns:1fr;
          }
        }
      `}</style>
    </div>
  );
}