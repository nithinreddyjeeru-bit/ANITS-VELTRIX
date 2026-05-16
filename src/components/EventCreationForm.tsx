"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useVeltrix } from "@/lib/store";
import { createEvent } from "@/lib/hooks/useEvents";

const CATEGORIES = ["Tech", "Robotics", "Design", "Cultural", "Sports", "Workshop", "General"];

export function EventCreationForm() {
  const { user } = useVeltrix();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "Tech",
    venue: "",
    event_date: "",
    max_seats: 100,
    xp_reward: 100,
    is_team_event: false,
    team_size: 4,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      router.push("/auth");
      return;
    }
    if (!["admin", "club_admin"].includes(user.role)) {
      setError("Only admins and event creators can publish events.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await createEvent({
        title: form.title,
        description: form.description,
        category: form.category,
        venue: form.venue,
        event_date: new Date(form.event_date).toISOString(),
        max_seats: form.max_seats,
        xp_reward: form.xp_reward,
        is_team_event: form.is_team_event,
        team_size: form.team_size,
        status: "upcoming",
        created_by: user.id,
      });
      setSuccess(true);
      setTimeout(() => router.push("/events"), 1500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create event");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section style={{ padding: "40px 60px 100px", maxWidth: "720px", margin: "0 auto" }}>
      <form onSubmit={handleSubmit} className="brutal-card" style={{ padding: "40px", display: "flex", flexDirection: "column", gap: "20px" }}>
        <h2 className="font-bangers" style={{ fontSize: "2.5rem" }}>LAUNCH EVENT</h2>
        <p className="font-space" style={{ opacity: 0.6 }}>Synced to Supabase — visible to all students instantly.</p>

        <label className="font-bebas">
          TITLE
          <input className="brutal-card" style={{ width: "100%", marginTop: "8px", padding: "12px" }} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
        </label>
        <label className="font-bebas">
          DESCRIPTION
          <textarea className="brutal-card" style={{ width: "100%", marginTop: "8px", padding: "12px", minHeight: "100px" }} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
        </label>
        <label className="font-bebas">
          CATEGORY
          <select className="brutal-card" style={{ width: "100%", marginTop: "8px", padding: "12px" }} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </label>
        <label className="font-bebas">
          VENUE
          <input className="brutal-card" style={{ width: "100%", marginTop: "8px", padding: "12px" }} value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} />
        </label>
        <label className="font-bebas">
          DATE & TIME
          <input type="datetime-local" className="brutal-card" style={{ width: "100%", marginTop: "8px", padding: "12px" }} value={form.event_date} onChange={(e) => setForm({ ...form, event_date: e.target.value })} required />
        </label>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          <label className="font-bebas">
            MAX SEATS
            <input type="number" min={1} className="brutal-card" style={{ width: "100%", marginTop: "8px", padding: "12px" }} value={form.max_seats} onChange={(e) => setForm({ ...form, max_seats: Number(e.target.value) })} />
          </label>
          <label className="font-bebas">
            XP REWARD
            <input type="number" min={0} className="brutal-card" style={{ width: "100%", marginTop: "8px", padding: "12px" }} value={form.xp_reward} onChange={(e) => setForm({ ...form, xp_reward: Number(e.target.value) })} />
          </label>
        </div>
        <label style={{ display: "flex", alignItems: "center", gap: "10px" }} className="font-space">
          <input type="checkbox" checked={form.is_team_event} onChange={(e) => setForm({ ...form, is_team_event: e.target.checked })} />
          Team event
        </label>

        {error && <div className="sticker sticker-pink">{error}</div>}
        {success && <div className="sticker">EVENT LIVE! Redirecting...</div>}

        <button type="submit" className="btn btn-green" style={{ justifyContent: "center", padding: "16px" }} disabled={loading}>
          {loading ? "PUBLISHING..." : "PUBLISH EVENT"}
        </button>
      </form>
    </section>
  );
}
