"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { uploadAvatar } from "@/lib/storage";
import { useVeltrix } from "@/lib/store";
import type { Profile } from "@/lib/types";

export function ProfileSettingsForm() {
  const router = useRouter();
  const { user, refreshProfile } = useVeltrix();
  const [form, setForm] = useState({
    name: "",
    department: "",
    year: 1,
    bio: "",
    avatar_url: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const load = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        router.push("/auth");
        return;
      }
      const { data } = await supabase.from("profiles").select("*").eq("id", authUser.id).single();
      if (data) {
        setForm({
          name: data.name || "",
          department: data.department || "",
          year: data.year || 1,
          bio: data.bio || "",
          avatar_url: data.avatar_url || "",
        });
      }
      setLoading(false);
    };
    load();
  }, [router]);

  const handleAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setSaving(true);
    try {
      const url = await uploadAvatar(user.id, file);
      setForm((f) => ({ ...f, avatar_url: url }));
      await supabase.from("profiles").update({ avatar_url: url, updated_at: new Date().toISOString() }).eq("id", user.id);
      await refreshProfile();
      setMessage("Avatar updated!");
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : "Avatar upload failed");
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setMessage("");
    const { error } = await supabase
      .from("profiles")
      .update({
        name: form.name,
        department: form.department,
        year: form.year,
        bio: form.bio,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (error) setMessage(error.message);
    else {
      setMessage("Profile saved to Supabase!");
      await refreshProfile();
    }
    setSaving(false);
  };

  if (loading) {
    return <p className="font-bangers" style={{ padding: "60px", textAlign: "center", fontSize: "2rem" }}>LOADING...</p>;
  }

  return (
    <form onSubmit={handleSave} style={{ maxWidth: "600px", margin: "0 auto", padding: "0 clamp(16px, 4vw, 40px) 100px" }}>
      <div className="brutal-card settings-card" style={{ padding: "clamp(24px, 5vw, 40px)", display: "flex", flexDirection: "column", gap: "24px" }}>
        <h2 className="font-bangers" style={{ fontSize: "2rem" }}>EDIT PROFILE</h2>

        <div className="avatar-section" style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <div
            className="avatar-preview"
            style={{
              width: 80,
              height: 80,
              flexShrink: 0,
              border: "3px solid var(--black)",
              background: form.avatar_url ? `url(${form.avatar_url}) center/cover` : "var(--green)",
            }}
          />
          <label className="btn font-bebas" style={{ cursor: "pointer", fontSize: "0.9rem", padding: "8px 16px" }}>
            UPLOAD PHOTO
            <input type="file" accept="image/*" hidden onChange={handleAvatar} />
          </label>
        </div>

        <div className="form-fields" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <label className="font-bebas field-label">
            DISPLAY NAME
            <input className="brutal-card settings-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </label>
          <label className="font-bebas field-label">
            DEPARTMENT
            <input className="brutal-card settings-input" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} placeholder="e.g. CSE" />
          </label>
          <label className="font-bebas field-label">
            YEAR
            <select className="brutal-card settings-input" value={form.year} onChange={(e) => setForm({ ...form, year: Number(e.target.value) })}>
              {[1, 2, 3, 4].map((y) => (
                <option key={y} value={y}>Year {y}</option>
              ))}
            </select>
          </label>
          <label className="font-bebas field-label">
            BIO
            <textarea className="brutal-card settings-input" style={{ minHeight: "100px" }} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
          </label>
        </div>

        {message && <div className="sticker" style={{ textAlign: "center" }}>{message}</div>}

        <button type="submit" className="btn btn-green save-btn" style={{ justifyContent: "center", padding: "16px", fontSize: "1.2rem" }} disabled={saving}>
          {saving ? "SAVING..." : "SAVE PROFILE"}
        </button>
      </div>

      <style jsx>{`
        .field-label { display: flex; flex-direction: column; gap: 8px; font-size: 1.1rem; }
        .settings-input { width: 100%; padding: 14px; border: 3px solid black; }

        @media (max-width: 480px) {
          .avatar-section { flex-direction: column; align-items: flex-start; gap: 12px; }
          .save-btn { font-size: 1rem; padding: 12px; }
          .settings-card { padding: 20px; }
        }
      `}</style>
    </form>
  );
}
