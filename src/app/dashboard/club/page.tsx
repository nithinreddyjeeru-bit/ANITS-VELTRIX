"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { Event, Profile } from "@/lib/types";
import { AdminAttendanceScanner } from "@/components/AdminAttendanceScanner";
import { AdminCertificateIssuer } from "@/components/AdminCertificateIssuer";
import { deleteEvent } from "@/lib/hooks/useEvents";
import { Calendar, CheckCircle, FileBadge, LogOut, Plus, Trash2 } from "lucide-react";

function CreatorStat({ label, value, icon }: { label: string; value: string | number; icon: React.ReactNode }) {
  return (
    <div className="brutal-card" style={{ padding: "24px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>{icon}</div>
      <div className="font-bangers" style={{ fontSize: "2.4rem", lineHeight: 1 }}>{value}</div>
      <div className="font-bebas" style={{ opacity: 0.65, letterSpacing: "2px" }}>{label}</div>
    </div>
  );
}

export default function ClubAdminDashboard() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [attendanceCount, setAttendanceCount] = useState(0);
  const [certificateCount, setCertificateCount] = useState(0);
  const [activePanel, setActivePanel] = useState<"events" | "attendance" | "certificates">("events");
  const [showScanner, setShowScanner] = useState(false);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/auth");
        return;
      }
      const { data: p } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      if (!p || p.role !== "club_admin") {
        router.push("/dashboard/student");
        return;
      }
      setProfile(p);

      const { data: ownEvents } = await supabase
        .from("events")
        .select("*")
        .eq("created_by", user.id)
        .order("event_date", { ascending: false });
      setEvents(ownEvents || []);

      const ownEventIds = (ownEvents || []).map((event) => event.id);
      if (ownEventIds.length > 0) {
        const [attendanceRes, certsRes] = await Promise.all([
          supabase.from("attendance").select("*", { count: "exact", head: true }).in("event_id", ownEventIds),
          supabase.from("certificates").select("*", { count: "exact", head: true }).in("event_id", ownEventIds),
        ]);
        setAttendanceCount(attendanceRes.count || 0);
        setCertificateCount(certsRes.count || 0);
      }
    };
    init();
  }, [router]);

  const removeOwnEvent = async (id: string) => {
    if (!confirm("Delete this event?")) return;
    await deleteEvent(id);
    setEvents((prev) => prev.filter((event) => event.id !== id));
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  if (!profile) {
    return <p className="font-bangers" style={{ padding: "80px", textAlign: "center" }}>LOADING CLUB PANEL...</p>;
  }

  return (
    <div style={{ padding: "40px 60px 100px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "40px", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <div className="sticker">CLUB COMMAND</div>
          <h1 className="font-bangers" style={{ fontSize: "4rem", lineHeight: 1 }}>{profile.name}</h1>
          <p className="font-bebas" style={{ opacity: 0.6, letterSpacing: "3px" }}>CLUB ADMIN ACCESS</p>
        </div>
        <button type="button" onClick={signOut} className="btn btn-pink">
          <LogOut size={16} /> SIGN OUT
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "20px", marginBottom: "32px" }}>
        <CreatorStat label="OWN EVENTS" value={events.length} icon={<Calendar size={28} />} />
        <CreatorStat label="ATTENDANCE MARKED" value={attendanceCount} icon={<CheckCircle size={28} />} />
        <CreatorStat label="CERTIFICATES ISSUED" value={certificateCount} icon={<FileBadge size={28} />} />
      </div>

      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "28px" }}>
        <Link href="/dashboard/clubs/create" className="btn btn-green"><Plus size={18} /> CREATE EVENT</Link>
        <button type="button" className="btn btn-blue" onClick={() => setShowScanner(true)}>SCAN ATTENDANCE</button>
        {(["events", "certificates"] as const).map((panel) => (
          <button
            key={panel}
            type="button"
            className="btn"
            style={{ background: activePanel === panel ? "var(--black)" : "white", color: activePanel === panel ? "white" : "var(--black)" }}
            onClick={() => setActivePanel(panel)}
          >
            {panel.toUpperCase()}
          </button>
        ))}
        <Link href="/events" className="btn">BROWSE ALL EVENTS</Link>
        <Link href="/clubs" className="btn">BROWSE CLUBS</Link>
      </div>

      {activePanel === "events" && (
        <div className="brutal-card" style={{ overflow: "auto" }}>
          <h2 className="font-bangers" style={{ fontSize: "2rem", marginBottom: "18px" }}>YOUR EVENTS</h2>
          {events.length === 0 ? (
            <p className="font-space" style={{ opacity: 0.65 }}>No events created yet.</p>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr className="font-bangers" style={{ borderBottom: "3px solid var(--black)" }}>
                  <th style={{ padding: "12px", textAlign: "left" }}>TITLE</th>
                  <th style={{ padding: "12px", textAlign: "left" }}>DATE</th>
                  <th style={{ padding: "12px", textAlign: "left" }}>STATUS</th>
                  <th style={{ padding: "12px" }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {events.map((event) => (
                  <tr key={event.id} className="font-space" style={{ borderBottom: "1px solid #ddd" }}>
                    <td style={{ padding: "12px" }}><Link href={`/events/${event.id}`}>{event.title}</Link></td>
                    <td style={{ padding: "12px", opacity: 0.7 }}>{new Date(event.event_date).toLocaleDateString()}</td>
                    <td style={{ padding: "12px" }}>{event.status}</td>
                    <td style={{ padding: "12px", textAlign: "center" }}>
                      <button type="button" className="btn btn-pink" style={{ padding: "4px 10px", fontSize: "0.8rem" }} onClick={() => removeOwnEvent(event.id)}>
                        <Trash2 size={14} /> DELETE
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {activePanel === "certificates" && <AdminCertificateIssuer eventOwnerId={profile.id} />}

      {showScanner && <AdminAttendanceScanner eventOwnerId={profile.id} onClose={() => setShowScanner(false)} />}
    </div>
  );
}
