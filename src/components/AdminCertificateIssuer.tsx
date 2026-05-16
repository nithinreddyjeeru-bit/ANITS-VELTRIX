"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { issueCertificateWithFile } from "@/lib/hooks/useAdmin";

export function AdminCertificateIssuer({ eventOwnerId }: { eventOwnerId?: string }) {
  const [events, setEvents] = useState<{ id: string; title: string }[]>([]);
  const [attendees, setAttendees] = useState<{ user_id: string; name: string; email: string }[]>([]);
  const [eventId, setEventId] = useState("");
  const [userId, setUserId] = useState("");
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    let query = supabase
      .from("events")
      .select("id, title")
      .order("event_date", { ascending: false });

    if (eventOwnerId) query = query.eq("created_by", eventOwnerId);

    query.then(({ data }) => setEvents(data || []));
  }, [eventOwnerId]);

  useEffect(() => {
    if (!eventId) {
      setAttendees([]);
      return;
    }
    supabase
      .from("attendance")
      .select("user_id, profile:profiles(name, email)")
      .eq("event_id", eventId)
      .then(({ data }) => {
        const list =
          data?.map((row: { user_id: string; profile: { name: string; email: string } | { name: string; email: string }[] | null }) => {
            const p = Array.isArray(row.profile) ? row.profile[0] : row.profile;
            return {
              user_id: row.user_id,
              name: p?.name || "Student",
              email: p?.email || "",
            };
          }) || [];
        setAttendees(list);
      });
  }, [eventId]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventId || !userId || !title.trim()) return;
    setBusy(true);
    setMsg("");
    try {
      await issueCertificateWithFile(userId, eventId, title.trim(), file || undefined);
      setMsg("Certificate issued and student notified!");
      setTitle("");
      setFile(null);
    } catch (err: unknown) {
      setMsg(err instanceof Error ? err.message : "Failed to issue certificate");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="brutal-card" style={{ padding: "32px", maxWidth: "640px" }}>
      <h2 className="font-bangers" style={{ fontSize: "2rem", marginBottom: "20px" }}>ISSUE CERTIFICATE</h2>
      <p className="font-space" style={{ opacity: 0.65, marginBottom: "20px", fontSize: "0.9rem" }}>
        Select a completed event and attended student. Upload a PDF to store in Supabase Storage.
      </p>

      <label className="font-bebas" style={{ display: "block", marginBottom: "16px" }}>
        EVENT (COMPLETED)
        <select className="brutal-card" style={{ width: "100%", marginTop: "8px", padding: "10px" }} value={eventId} onChange={(e) => { setEventId(e.target.value); setUserId(""); }}>
          <option value="">Select event...</option>
          {events.map((ev) => (
            <option key={ev.id} value={ev.id}>{ev.title}</option>
          ))}
        </select>
      </label>

      <label className="font-bebas" style={{ display: "block", marginBottom: "16px" }}>
        STUDENT (ATTENDED)
        <select className="brutal-card" style={{ width: "100%", marginTop: "8px", padding: "10px" }} value={userId} onChange={(e) => setUserId(e.target.value)} disabled={!eventId}>
          <option value="">Select student...</option>
          {attendees.map((a) => (
            <option key={a.user_id} value={a.user_id}>{a.name} — {a.email}</option>
          ))}
        </select>
      </label>

      <label className="font-bebas" style={{ display: "block", marginBottom: "16px" }}>
        CERTIFICATE TITLE
        <input className="brutal-card" style={{ width: "100%", marginTop: "8px", padding: "10px" }} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Code Wars 2026 — Participant" required />
      </label>

      <label className="font-bebas" style={{ display: "block", marginBottom: "20px" }}>
        PDF FILE (OPTIONAL)
        <input type="file" accept="application/pdf" style={{ marginTop: "8px", display: "block" }} onChange={(e) => setFile(e.target.files?.[0] || null)} />
      </label>

      {msg && <div className="sticker" style={{ marginBottom: "16px" }}>{msg}</div>}

      <button type="submit" className="btn btn-green" style={{ width: "100%", justifyContent: "center" }} disabled={busy || !userId}>
        {busy ? "ISSUING..." : "ISSUE CERTIFICATE"}
      </button>
    </form>
  );
}
