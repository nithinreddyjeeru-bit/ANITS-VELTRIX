"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { updateEvent } from "@/lib/hooks/useEvents";
import type { Event, Profile } from "@/lib/types";
import { ArrowLeft } from "lucide-react";

const CATEGORIES = ["Tech", "Robotics", "Design", "Gaming", "Cultural", "Workshop", "Sports", "General"];
const DIFFICULTIES = ["Beginner", "Intermediate", "Advanced", "Pro"];
const STATUSES = ["draft", "upcoming", "live", "completed", "cancelled"];

export default function EditEventPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [denied, setDenied] = useState(false);
  const [form, setForm] = useState<Partial<Event>>({});

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/auth"); return; }

      const { data: p } = await supabase.from("profiles").select("*").eq("id", user.id).single<Profile>();
      const { data: ev } = await supabase.from("events").select("*").eq("id", id).single<Event>();
      if (!ev) { setError("Event not found"); setLoading(false); return; }

      // Ownership guard: only the creator or an admin may edit.
      const isOwner = ev.created_by === user.id;
      const isAdmin = p?.role === "admin";
      if (!isOwner && !isAdmin) { setDenied(true); setLoading(false); return; }

      setForm({
        title: ev.title, description: ev.description, category: ev.category,
        venue: ev.venue, mode: ev.mode, difficulty: ev.difficulty,
        event_date: ev.event_date ? ev.event_date.slice(0, 16) : "",
        max_seats: ev.max_seats, xp_reward: ev.xp_reward, prize_pool: ev.prize_pool,
        rules: ev.rules, contact_info: ev.contact_info, status: ev.status,
        is_team_event: ev.is_team_event, team_size: ev.team_size,
      });
      setLoading(false);
    };
    if (id) init();
  }, [id, router]);

  const set = (k: keyof Event, v: any) => setForm((prev) => ({ ...prev, [k]: v }));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await updateEvent(id, {
        ...form,
        event_date: form.event_date ? new Date(form.event_date).toISOString() : undefined,
        max_seats: Number(form.max_seats),
        xp_reward: Number(form.xp_reward),
        team_size: Number(form.team_size),
      });
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Failed to save");
      setSaving(false);
    }
  };

  if (loading) return <p className="font-bangers" style={{ padding: "80px", textAlign: "center" }}>LOADING EVENT...</p>;
  if (denied) return (
    <div style={{ padding: "80px", textAlign: "center" }}>
      <h1 className="font-bangers" style={{ fontSize: "2.5rem" }}>ACCESS DENIED</h1>
      <p className="font-space" style={{ opacity: 0.7 }}>You can only edit events you created.</p>
      <Link href="/dashboard" className="btn btn-black" style={{ marginTop: "16px" }}>BACK TO DASHBOARD</Link>
    </div>
  );

  const label: React.CSSProperties = { display: "flex", flexDirection: "column", gap: "6px", fontWeight: "bold" };
  const input: React.CSSProperties = { padding: "12px", border: "3px solid black", boxShadow: "3px 3px 0 black", fontFamily: "inherit" };

  return (
    <div style={{ maxWidth: "760px", margin: "0 auto", padding: "40px 20px 100px" }}>
      <Link href="/dashboard" className="font-bebas" style={{ display: "inline-flex", alignItems: "center", gap: "6px", textDecoration: "none", color: "black", marginBottom: "20px" }}>
        <ArrowLeft size={16} /> BACK TO DASHBOARD
      </Link>
      <h1 className="font-bangers" style={{ fontSize: "3rem", marginBottom: "24px" }}>EDIT EVENT</h1>

      <form onSubmit={handleSave} className="brutal-card" style={{ display: "flex", flexDirection: "column", gap: "18px", padding: "30px", background: "white", border: "4px solid black", boxShadow: "8px 8px 0 black" }}>
        <label className="font-space" style={label}><span className="font-bebas">TITLE</span>
          <input style={input} value={form.title || ""} onChange={(e) => set("title", e.target.value)} required /></label>

        <label className="font-space" style={label}><span className="font-bebas">DESCRIPTION</span>
          <textarea style={{ ...input, minHeight: "90px" }} value={form.description || ""} onChange={(e) => set("description", e.target.value)} /></label>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          <label className="font-space" style={label}><span className="font-bebas">CATEGORY</span>
            <select style={input} value={form.category || ""} onChange={(e) => set("category", e.target.value)}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select></label>
          <label className="font-space" style={label}><span className="font-bebas">DIFFICULTY</span>
            <select style={input} value={form.difficulty || ""} onChange={(e) => set("difficulty", e.target.value as any)}>
              {DIFFICULTIES.map((d) => <option key={d} value={d}>{d}</option>)}
            </select></label>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          <label className="font-space" style={label}><span className="font-bebas">VENUE</span>
            <input style={input} value={form.venue || ""} onChange={(e) => set("venue", e.target.value)} /></label>
          <label className="font-space" style={label}><span className="font-bebas">MODE</span>
            <select style={input} value={form.mode || "offline"} onChange={(e) => set("mode", e.target.value as any)}>
              <option value="offline">Offline</option><option value="online">Online</option>
            </select></label>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          <label className="font-space" style={label}><span className="font-bebas">EVENT DATE</span>
            <input style={input} type="datetime-local" value={form.event_date || ""} onChange={(e) => set("event_date", e.target.value)} required /></label>
          <label className="font-space" style={label}><span className="font-bebas">STATUS</span>
            <select style={input} value={form.status || "upcoming"} onChange={(e) => set("status", e.target.value as any)}>
              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select></label>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          <label className="font-space" style={label}><span className="font-bebas">MAX SEATS</span>
            <input style={input} type="number" min={1} value={form.max_seats ?? 100} onChange={(e) => set("max_seats", e.target.value)} /></label>
          <label className="font-space" style={label}><span className="font-bebas">XP REWARD</span>
            <input style={input} type="number" min={0} value={form.xp_reward ?? 100} onChange={(e) => set("xp_reward", e.target.value)} /></label>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", alignItems: "end" }}>
          <label className="font-space" style={{ ...label, flexDirection: "row", alignItems: "center", gap: "10px" }}>
            <input type="checkbox" checked={!!form.is_team_event} onChange={(e) => set("is_team_event", e.target.checked)} />
            <span className="font-bebas">TEAM EVENT</span>
          </label>
          {form.is_team_event && (
            <label className="font-space" style={label}><span className="font-bebas">TEAM SIZE</span>
              <input style={input} type="number" min={2} value={form.team_size ?? 4} onChange={(e) => set("team_size", e.target.value)} /></label>
          )}
        </div>

        <label className="font-space" style={label}><span className="font-bebas">PRIZE POOL (optional)</span>
          <input style={input} value={form.prize_pool || ""} onChange={(e) => set("prize_pool", e.target.value)} placeholder="₹50,000" /></label>

        <label className="font-space" style={label}><span className="font-bebas">RULES (optional)</span>
          <textarea style={{ ...input, minHeight: "70px" }} value={form.rules || ""} onChange={(e) => set("rules", e.target.value)} /></label>

        <label className="font-space" style={label}><span className="font-bebas">CONTACT INFO (optional)</span>
          <input style={input} value={form.contact_info || ""} onChange={(e) => set("contact_info", e.target.value)} /></label>

        {error && <div className="sticker" style={{ background: "var(--pink)", color: "white", textAlign: "center" }}>{error}</div>}

        <button type="submit" className="btn btn-green" disabled={saving} style={{ padding: "16px", justifyContent: "center", fontSize: "1.3rem" }}>
          {saving ? "SAVING..." : "SAVE CHANGES"}
        </button>
      </form>
    </div>
  );
}
