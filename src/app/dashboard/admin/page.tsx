"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { Profile } from "@/lib/types";
import { useAdminStats, useAllUsers, useAuditLogs, sendAnnouncement } from "@/lib/hooks/useAdmin";
import { deleteEvent } from "@/lib/hooks/useEvents";
import { AdminAttendanceScanner } from "@/components/AdminAttendanceScanner";
import { AdminCertificateIssuer } from "@/components/AdminCertificateIssuer";
import { useToast } from "@/components/Toast";
import { Users, Calendar, Award, LogOut, CheckCircle, Shield } from "lucide-react";

function StatCard({ label, value, icon, color }: { label: string; value: string | number; icon: React.ReactNode; color: string }) {
  return (
    <div className="brutal-card" style={{ background: color, color: ["var(--green)", "var(--blue)"].includes(color) ? "var(--black)" : "white" }}>
      <div style={{ fontSize: "2.5rem", marginBottom: "8px" }}>{icon}</div>
      <div className="font-bangers" style={{ fontSize: "3rem", lineHeight: 1 }}>{value}</div>
      <div className="font-bebas" style={{ fontSize: "1rem", opacity: 0.7, letterSpacing: "2px", marginTop: "4px" }}>{label}</div>
    </div>
  );
}

export default function AdminDashboard() {
  const router = useRouter();
  const toaster = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "users" | "events" | "certs" | "logs">("overview");
  const [showScanner, setShowScanner] = useState(false);
  const [events, setEvents] = useState<any[]>([]);
  const [anncTitle, setAnncTitle] = useState("");
  const [anncBody, setAnncBody] = useState("");
  const { stats, loading: statsLoading } = useAdminStats();
  const { users, updateRole, toggleBan } = useAllUsers();
  const { logs } = useAuditLogs();

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/"); return; }

      const { data: p } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      if (!p || p.role !== "admin") {
        router.push("/dashboard/student");
        return;
      }
      setProfile(p);

      const { data: ev } = await supabase.from("events").select("*").order("event_date", { ascending: false });
      setEvents(ev || []);
    };
    init();
  }, [router]);

  const refreshEvents = async () => {
    const { data } = await supabase.from("events").select("*").order("event_date", { ascending: false });
    setEvents(data || []);
  };

  const handleAnnouncement = async () => {
    if (!profile || !anncTitle.trim() || !anncBody.trim()) {
      toaster.warning("Missing details", "Add a title and message before posting.");
      return;
    }
    try {
      await sendAnnouncement(anncTitle, anncBody, profile.id, true);
      setAnncTitle("");
      setAnncBody("");
      toaster.success("Announcement posted", "Every student will see it on the ticker.");
    } catch (e: any) {
      toaster.error("Could not post", e.message);
    }
  };

  const handleDeleteEvent = async (id: string, title: string) => {
    const ok = await toaster.confirm({
      title: "Delete this event?",
      body: `"${title}" and its registrations will be removed. This can't be undone.`,
      confirmLabel: "DELETE",
      danger: true,
    });
    if (!ok) return;
    try {
      await deleteEvent(id);
      await refreshEvents();
      toaster.success("Event deleted");
    } catch (e: any) {
      toaster.error("Delete failed", e.message);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  if (!profile || statsLoading) return (
    <div style={{ padding: "80px", display: "flex", justifyContent: "center" }}>
      <motion.div className="font-bangers" style={{ fontSize: "3rem" }}
        animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1 }}>
        INITIALIZING ADMIN OVERRIDE...
      </motion.div>
    </div>
  );

  return (
    <div style={{ padding: "40px 60px 100px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "50px" }}>
        <div>
          <div className="sticker sticker-pink" style={{ marginBottom: "16px" }}>SYSTEM OVERRIDE</div>
          <h1 className="font-bangers" style={{ fontSize: "clamp(2.5rem, 6vw, 5rem)", lineHeight: 1 }}>
            COMMAND CENTER
          </h1>
          <div className="font-bebas" style={{ fontSize: "1.2rem", opacity: 0.5, letterSpacing: "3px", marginTop: "4px", display: "flex", alignItems: "center", gap: "8px" }}>
            <Shield size={18} /> {profile.role.replace("_", " ").toUpperCase()} ACCESS
          </div>
        </div>
        <button onClick={signOut} className="btn btn-black" style={{ padding: "10px 20px" }}>
          <LogOut size={16} /> SIGN OUT
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "24px", marginBottom: "50px" }}>
        <StatCard label="TOTAL STUDENTS" value={stats.total_students} icon={<Users size={32} />} color="var(--blue)" />
        <StatCard label="TOTAL REGISTRATIONS" value={stats.total_registrations} icon={<CheckCircle size={32} />} color="var(--green)" />
        <StatCard label="ACTIVE EVENTS" value={stats.total_events} icon={<Calendar size={32} />} color="var(--pink)" />
        <StatCard label="CERTIFICATES ISSUED" value={stats.total_certificates} icon={<Award size={32} />} color="var(--black)" />
      </div>

      <div style={{ display: "flex", gap: "8px", marginBottom: "32px", flexWrap: "wrap" }}>
        {[
          { key: "overview", label: "OVERVIEW" },
          { key: "users", label: "USER MANAGEMENT" },
          { key: "events", label: "EVENT CONTROL" },
          { key: "certs", label: "CERTIFICATES" },
          { key: "logs", label: "AUDIT LOGS" },
        ].map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key as any)}
            className="btn" style={{
              fontSize: "0.9rem", padding: "8px 18px",
              background: activeTab === tab.key ? "var(--black)" : "white",
              color: activeTab === tab.key ? "white" : "var(--black)"
            }}>
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "overview" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "40px" }}>
          <div className="brutal-card">
            <h2 className="font-bangers" style={{ fontSize: "2rem", marginBottom: "20px" }}>QUICK ACTIONS</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <Link href="/dashboard/clubs/create" className="btn btn-green" style={{ width: "100%", justifyContent: "center" }}>CREATE NEW EVENT</Link>
              <button type="button" className="btn btn-blue" style={{ width: "100%", justifyContent: "center" }} onClick={() => setShowScanner(true)}>SCAN ATTENDANCE QR</button>
            </div>
            <div style={{ marginTop: "24px" }}>
              <h3 className="font-bebas" style={{ marginBottom: "8px" }}>GLOBAL ANNOUNCEMENT</h3>
              <input className="brutal-card" placeholder="Title" value={anncTitle} onChange={(e) => setAnncTitle(e.target.value)} style={{ width: "100%", padding: "10px", marginBottom: "8px" }} />
              <textarea className="brutal-card" placeholder="Message" value={anncBody} onChange={(e) => setAnncBody(e.target.value)} style={{ width: "100%", padding: "10px", minHeight: "80px" }} />
              <button type="button" className="btn btn-pink" style={{ width: "100%", marginTop: "8px", justifyContent: "center" }} onClick={handleAnnouncement}>POST ANNOUNCEMENT</button>
            </div>
          </div>
          <div className="brutal-card" style={{ background: "var(--black)", color: "white" }}>
             <h2 className="font-bangers" style={{ fontSize: "2rem", marginBottom: "20px" }}>SYSTEM STATUS</h2>
             <div className="font-space" style={{ opacity: 0.8, lineHeight: 1.8 }}>
               <div style={{ display: "flex", justifyContent: "space-between" }}><span>Database Sync:</span><span style={{ color: "var(--green)" }}>ONLINE</span></div>
               <div style={{ display: "flex", justifyContent: "space-between" }}><span>Realtime Subscriptions:</span><span style={{ color: "var(--green)" }}>ACTIVE</span></div>
               <div style={{ display: "flex", justifyContent: "space-between" }}><span>Supabase Storage:</span><span style={{ color: "var(--green)" }}>ONLINE</span></div>
             </div>
          </div>
        </div>
      )}

      {activeTab === "users" && (
        <div className="brutal-card" style={{ overflow: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr className="font-bangers" style={{ fontSize: "1.2rem", borderBottom: "3px solid var(--black)" }}>
                <th style={{ padding: "12px" }}>NAME</th>
                <th style={{ padding: "12px" }}>EMAIL</th>
                <th style={{ padding: "12px" }}>ROLE</th>
                <th style={{ padding: "12px" }}>XP</th>
                <th style={{ padding: "12px" }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} style={{ borderBottom: "1px solid #ccc" }} className="font-space">
                  <td style={{ padding: "12px", fontWeight: "bold" }}>
                    {u.name} {u.is_banned && <span className="tag tag-pink" style={{ fontSize: "0.6rem", marginLeft: "8px" }}>BANNED</span>}
                  </td>
                  <td style={{ padding: "12px", opacity: 0.7 }}>{u.email}</td>
                  <td style={{ padding: "12px" }}>
                    <select
                      value={u.role}
                      onChange={(e) => {
                        const role = e.target.value as any;
                        updateRole(u.id, role)
                          .then(() => toaster.success("Role updated", `${u.name} is now ${role.replace("_", " ")}.`))
                          .catch((err) => toaster.error("Update failed", err.message));
                      }}
                      style={{ padding: "4px", border: "2px solid var(--black)", fontFamily: "inherit", background: u.role === "admin" ? "var(--pink)" : "white" }}
                      disabled={u.id === profile.id}
                    >
                      <option value="student">Student</option>
                      <option value="club_admin">Club Admin</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td style={{ padding: "12px", color: "var(--green)", fontWeight: "bold" }}>{u.xp}</td>
                  <td style={{ padding: "12px" }}>
                    <button
                      onClick={() =>
                        toggleBan(u.id, u.is_banned)
                          .then(() => toaster.success(u.is_banned ? "User unbanned" : "User banned", u.name))
                          .catch((err) => toaster.error("Action failed", err.message))
                      }
                      disabled={u.id === profile.id}
                      className="btn" style={{ padding: "4px 8px", fontSize: "0.8rem", background: u.is_banned ? "var(--green)" : "var(--pink)" }}
                    >
                      {u.is_banned ? "UNBAN" : "BAN"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === "events" && (
        <div className="brutal-card" style={{ overflow: "auto" }}>
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
              {events.map((ev) => (
                <tr key={ev.id} className="font-space" style={{ borderBottom: "1px solid #ddd" }}>
                  <td style={{ padding: "12px" }}><Link href={`/events/${ev.id}`}>{ev.title}</Link></td>
                  <td style={{ padding: "12px", opacity: 0.7 }}>{new Date(ev.event_date).toLocaleDateString()}</td>
                  <td style={{ padding: "12px" }}>{ev.status}</td>
                  <td style={{ padding: "12px", display: "flex", gap: "8px" }}>
                    <Link href={`/dashboard/events/${ev.id}/edit`} className="btn" style={{ padding: "4px 10px", fontSize: "0.8rem" }}>EDIT</Link>
                    <button type="button" className="btn btn-pink" style={{ padding: "4px 10px", fontSize: "0.8rem" }} onClick={() => handleDeleteEvent(ev.id, ev.title)}>DELETE</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === "certs" && <AdminCertificateIssuer />}

      {activeTab === "logs" && (
        <div className="brutal-card" style={{ background: "var(--cream)" }}>
          <h2 className="font-bangers" style={{ fontSize: "2rem", marginBottom: "20px" }}>SECURITY LOGS</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {logs.length === 0 ? <p className="font-space">No recent admin actions recorded.</p> : null}
            {logs.map(log => (
              <div key={log.id} style={{ padding: "12px", border: "2px solid var(--black)", background: "white", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <span className="font-bebas" style={{ fontSize: "1.1rem", marginRight: "12px" }}>{log.action_type}</span>
                  <span className="font-space" style={{ fontSize: "0.85rem", opacity: 0.7 }}>{log.details}</span>
                </div>
                <span className="font-space" style={{ fontSize: "0.75rem", opacity: 0.5 }}>
                  {new Date(log.created_at).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {showScanner && <AdminAttendanceScanner onClose={() => setShowScanner(false)} />}
    </div>
  );
}
