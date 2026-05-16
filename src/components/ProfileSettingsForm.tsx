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
    <form onSubmit={handleSave} style={{ maxWidth: "560px", margin: "0 auto", padding: "0 60px 80px" }}>
      <div className="brutal-card" style={{ padding: "40px", display: "flex", flexDirection: "column", gap: "20px" }}>
        <h2 className="font-bangers" style={{ fontSize: "2rem" }}>EDIT PROFILE</h2>

        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <div
            style={{
              width: 80,
              height: 80,
              border: "3px solid var(--black)",
              background: form.avatar_url ? `url(${form.avatar_url}) center/cover` : "var(--green)",
            }}
          />
          <label className="btn font-bebas" style={{ cursor: "pointer" }}>
            UPLOAD PHOTO
            <input type="file" accept="image/*" hidden onChange={handleAvatar} />
          </label>
        </div>

        <label className="font-bebas">
          DISPLAY NAME
          <input className="brutal-card" style={{ width: "100%", marginTop: "8px", padding: "12px" }} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        </label>
        <label className="font-bebas">
          DEPARTMENT
          <input className="brutal-card" style={{ width: "100%", marginTop: "8px", padding: "12px" }} value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} placeholder="e.g. CSE" />
        </label>
        <label className="font-bebas">
          YEAR
          <select className="brutal-card" style={{ width: "100%", marginTop: "8px", padding: "12px" }} value={form.year} onChange={(e) => setForm({ ...form, year: Number(e.target.value) })}>
            {[1, 2, 3, 4].map((y) => (
              <option key={y} value={y}>Year {y}</option>
            ))}
          </select>
        </label>
        <label className="font-bebas">
          BIO
          <textarea className="brutal-card" style={{ width: "100%", marginTop: "8px", padding: "12px", minHeight: "90px" }} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
        </label>

        {message && <div className="sticker">{message}</div>}

        <button type="submit" className="btn btn-green" style={{ justifyContent: "center", padding: "14px" }} disabled={saving}>
          {saving ? "SAVING..." : "SAVE PROFILE"}
        </button>
      </div>
    </form>
  );
}
