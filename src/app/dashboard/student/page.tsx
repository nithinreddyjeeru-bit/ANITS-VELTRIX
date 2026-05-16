"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { Profile } from "@/lib/types";
import { dashboardPathForRole } from "@/lib/auth-redirect";
import { Zap, Trophy, Calendar, Award, Bookmark, Bell, Settings, LogOut, ChevronRight, Star } from "lucide-react";

function StatCard({ label, value, icon, color }: { label: string; value: string | number; icon: React.ReactNode; color: string }) {
  return (
    <motion.div whileHover={{ y: -4 }} className="brutal-card" style={{ background: color, color: ["var(--green)", "var(--blue)"].includes(color) ? "var(--black)" : "white" }}>
      <div style={{ fontSize: "2.5rem", marginBottom: "8px" }}>{icon}</div>
      <div className="font-bangers" style={{ fontSize: "3rem", lineHeight: 1 }}>{value}</div>
      <div className="font-bebas" style={{ fontSize: "1rem", opacity: 0.7, letterSpacing: "2px", marginTop: "4px" }}>{label}</div>
    </motion.div>
  );
}

function RegistrationCard({ reg }: { reg: any }) {
  const event = reg.event;
  if (!event) return null;
  const isPast = new Date(event.event_date) < new Date();
  return (
    <Link href={`/events/${event.id}`} style={{ textDecoration: "none", display: "block" }}>
      <motion.div whileHover={{ x: 6 }} className="brutal-card" style={{ padding: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div className="font-bangers" style={{ fontSize: "1.4rem" }}>{event.title}</div>
          <div className="font-space" style={{ fontSize: "0.85rem", opacity: 0.6, marginTop: "4px" }}>
            {new Date(event.event_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} · {event.venue || "TBD"}
          </div>
          <div style={{ marginTop: "8px", display: "flex", gap: "8px" }}>
            <span className="tag" style={{
              background: reg.status === "attended" ? "var(--green)" : reg.status === "cancelled" ? "var(--pink)" : "var(--blue)",
              color: reg.status === "attended" ? "var(--black)" : "white",
              borderColor: "transparent", fontSize: "0.75rem"
            }}>
              {reg.status.toUpperCase()}
            </span>
            {isPast && reg.status !== "attended" && (
              <span className="tag" style={{ fontSize: "0.75rem", opacity: 0.6 }}>ENDED</span>
            )}
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "8px" }}>
          <div className="font-bangers" style={{ fontSize: "1.2rem", color: "var(--green)" }}>+{event.xp_reward} XP</div>
          <ChevronRight size={20} style={{ opacity: 0.4 }} />
        </div>
      </motion.div>
    </Link>
  );
}

export default function StudentDashboard() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [certificates, setCertificates] = useState<any[]>([]);
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unread, setUnread] = useState(0);
  const [myRank, setMyRank] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"events" | "certificates" | "bookmarks" | "notifications">("events");

  useEffect(() => {
    const init = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { router.push("/"); return; }

        const [profileRes, regsRes, certsRes, bmsRes, notifsRes] = await Promise.all([
          supabase.from("profiles").select("*").eq("id", user.id).single(),
          supabase.from("registrations").select("*, event:events(*)").eq("user_id", user.id).order("registered_at", { ascending: false }),
          supabase.from("certificates").select("*, event:events(*)").eq("user_id", user.id).order("issued_at", { ascending: false }),
          supabase.from("bookmarks").select("*, event:events(*)").eq("user_id", user.id),
          supabase.from("notifications").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20)
        ]);

        if (profileRes.data) {
          if (profileRes.data.role !== "student") {
            router.replace(dashboardPathForRole(profileRes.data.role));
            return;
          }
          setProfile(profileRes.data);
        }
        setRegistrations(regsRes.data || []);
        setCertificates(certsRes.data || []);
        setBookmarks(bmsRes.data || []);
        setNotifications(notifsRes.data || []);
        setUnread((notifsRes.data || []).filter((n: any) => !n.is_read).length);

        // Rank calculation
        const { data: leaderboard } = await supabase.from("profiles").select("id, xp").order("xp", { ascending: false });
        if (leaderboard) {
          const idx = leaderboard.findIndex(p => p.id === user.id);
          setMyRank(idx >= 0 ? idx + 1 : null);
        }
      } catch (err) {
        console.error("Dashboard Init Error:", err);
      } finally {
        setLoading(false);
      }
    };
    init();

    // Realtime notifications
    const channel = (supabase.channel("student-notifs") as any)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications" },
        (payload: any) => { setNotifications(prev => [payload.new, ...prev]); setUnread(prev => prev + 1); })
      .subscribe();
    return () => { supabase.removeChannel(channel).catch(console.error); };
  }, [router]);

  const markAllRead = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("notifications").update({ is_read: true }).eq("user_id", user.id).eq("is_read", false);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnread(0);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  const xpToNextLevel = profile ? (profile.level * 1000) - profile.xp : 1000;
  const xpProgress = profile ? ((profile.xp % 1000) / 1000) * 100 : 0;

  if (loading) return (
    <div style={{ padding: "80px", display: "flex", justifyContent: "center" }}>
      <motion.div className="font-bangers" style={{ fontSize: "3rem" }}
        animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1 }}>
        LOADING YOUR UNIVERSE...
      </motion.div>
    </div>
  );

  if (!profile) return (
    <div style={{ padding: "clamp(20px, 5vw, 60px)", minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <motion.div className="brutal-card card-pink" style={{ textAlign: "center", maxWidth: "500px", padding: "40px" }}
        initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
        <div style={{ fontSize: "4rem", marginBottom: "16px" }}>⚠️</div>
        <h1 className="font-bangers" style={{ fontSize: "3rem", lineHeight: 1 }}>PROFILE MISSING</h1>
        <p className="font-space" style={{ opacity: 0.9, marginTop: "12px", marginBottom: "24px" }}>
          We couldn't find your student profile. This usually happens if you signed up before the database was fully set up.
        </p>
        <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
          <button onClick={signOut} className="btn btn-black">SIGN OUT & TRY AGAIN</button>
        </div>
      </motion.div>
    </div>
  );

  return (
    <div style={{ padding: "clamp(20px, 5vw, 60px) clamp(20px, 4vw, 40px) 100px" }}>
      {/* Header */}
      <div className="dash-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "50px", gap: "24px" }}>
        <div style={{ flex: 1 }}>
          <div className="sticker" style={{ marginBottom: "16px" }}>WELCOME BACK</div>
          <h1 className="font-bangers dash-title" style={{ lineHeight: 1 }}>
            {profile.name?.toUpperCase() || "STUDENT"}
          </h1>
          <div className="font-bebas" style={{ fontSize: "1.1rem", opacity: 0.85, letterSpacing: "3px", marginTop: "4px" }}>
            {profile.department || "VELTRIX STUDENT"} · LEVEL {profile.level ?? 1}
          </div>
          {/* XP bar */}
          <div style={{ marginTop: "20px", maxWidth: "400px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
              <span className="font-bebas" style={{ fontSize: "0.85rem", opacity: 0.85 }}>{profile.xp ?? 0} XP</span>
              <span className="font-bebas" style={{ fontSize: "0.85rem", opacity: 0.85 }}>LVL {(profile.level ?? 1) + 1}: {(profile.level ?? 1) * 1000} XP</span>
            </div>
            <div style={{ background: "#ddd", height: "8px", border: "2px solid var(--black)", borderRadius: "4px", overflow: "hidden" }}>
              <motion.div initial={{ width: 0 }} animate={{ width: `${xpProgress}%` }} transition={{ duration: 1, delay: 0.5 }}
                style={{ height: "100%", background: "var(--green)" }} />
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <Link href="/settings" className="btn" style={{ padding: "10px" }} aria-label="Settings"><Settings size={18} /></Link>
          <button onClick={signOut} className="btn btn-pink" style={{ padding: "8px 16px", fontSize: "0.85rem" }}>
            OUT
          </button>
        </div>
      </div>

      {/* Stats grid */}
      <div className="stats-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px", marginBottom: "40px" }}>
        <StatCard label="XP POINTS" value={(profile.xp ?? 0).toLocaleString()} icon={<Zap size={28} />} color="var(--green)" />
        <StatCard label="GLOBAL RANK" value={myRank ? `#${myRank}` : "—"} icon={<Trophy size={28} />} color="var(--black)" />
        <StatCard label="EVENTS JOINED" value={registrations.length} icon={<Calendar size={28} />} color="var(--pink)" />
        <StatCard label="CERTIFICATES" value={certificates.length} icon={<Award size={28} />} color="var(--blue)" />
      </div>

      {/* Tab Navigation */}
      <div className="tabs-container no-scrollbar" style={{ display: "flex", gap: "8px", marginBottom: "32px", overflowX: "auto", paddingBottom: "8px" }}>
        {[
          { key: "events", label: `EVENTS (${registrations.length})`, icon: <Calendar size={14} /> },
          { key: "certificates", label: `CERTS (${certificates.length})`, icon: <Award size={14} /> },
          { key: "bookmarks", label: `SAVED (${bookmarks.length})`, icon: <Bookmark size={14} /> },
          { key: "notifications", label: `ALERTS ${unread > 0 ? `(${unread})` : ""}`, icon: <Bell size={14} /> },
        ].map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key as any)}
            className="btn" style={{
              fontSize: "0.85rem", padding: "8px 16px",
              background: activeTab === tab.key ? "var(--black)" : "white",
              color: activeTab === tab.key ? "white" : "var(--black)",
              display: "flex", alignItems: "center", gap: "8px",
              whiteSpace: "nowrap"
            }}>
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      <style jsx>{`
        .dash-title { font-size: clamp(2.5rem, 6vw, 4.5rem); }
        @media (max-width: 768px) {
          .dash-header { flex-direction: column; }
          .stats-grid { grid-template-columns: 1fr 1fr; }
        }
        @media (max-width: 480px) {
          .stats-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      {/* Tab content */}
      {activeTab === "events" && (
        <div>
          {registrations.length === 0 ? (
            <div className="brutal-card" style={{ textAlign: "center", padding: "80px" }}>
              <div style={{ fontSize: "4rem" }}>⚔️</div>
              <div className="font-bangers" style={{ fontSize: "2.5rem", marginTop: "16px" }}>NO BATTLES YET</div>
              <p className="font-space" style={{ opacity: 0.6, marginTop: "8px" }}>Find your first event and register to start earning XP</p>
              <Link href="/events" className="btn btn-green" style={{ marginTop: "24px" }}>EXPLORE ARENA →</Link>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {registrations.map(reg => <RegistrationCard key={reg.id} reg={reg} />)}
            </div>
          )}
        </div>
      )}

      {activeTab === "certificates" && (
        <div>
          {certificates.length === 0 ? (
            <div className="brutal-card" style={{ textAlign: "center", padding: "80px" }}>
              <div style={{ fontSize: "4rem" }}>🏅</div>
              <div className="font-bangers" style={{ fontSize: "2.5rem", marginTop: "16px" }}>NO TROPHIES YET</div>
              <p className="font-space" style={{ opacity: 0.6, marginTop: "8px" }}>Attend events to earn certificates</p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "24px" }}>
              {certificates.map((cert: any) => (
                <motion.div key={cert.id} whileHover={{ y: -4 }} className="brutal-card" style={{ background: "var(--black)", color: "white" }}>
                  <div className="sticker" style={{ marginBottom: "16px", background: "var(--green)", color: "var(--black)" }}>{cert.event?.category}</div>
                  <div className="font-bangers" style={{ fontSize: "1.8rem", lineHeight: 1, marginBottom: "8px" }}>{cert.title}</div>
                  <div className="font-space" style={{ opacity: 0.85, fontSize: "0.85rem" }}>
                    Issued: {new Date(cert.issued_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </div>
                  <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
                    {cert.file_url ? (
                      <a href={cert.file_url} target="_blank" rel="noopener noreferrer" className="btn btn-green" style={{ fontSize: "0.85rem", padding: "8px 16px" }}>
                        DOWNLOAD
                      </a>
                    ) : (
                      <span className="btn" style={{ fontSize: "0.85rem", padding: "8px 16px", opacity: 0.5, cursor: "not-allowed" }}>PENDING</span>
                    )}
                    <span className="font-bebas" style={{ fontSize: "0.75rem", opacity: 0.4, alignSelf: "center" }}>
                      CODE: {cert.verify_code?.toUpperCase()}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "bookmarks" && (
        <div>
          {bookmarks.length === 0 ? (
            <div className="brutal-card" style={{ textAlign: "center", padding: "80px" }}>
              <div style={{ fontSize: "4rem" }}>🔖</div>
              <div className="font-bangers" style={{ fontSize: "2.5rem", marginTop: "16px" }}>NOTHING SAVED YET</div>
              <Link href="/events" className="btn btn-black" style={{ marginTop: "24px" }}>BROWSE EVENTS</Link>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "24px" }}>
              {bookmarks.map((bm: any) => bm.event && (
                <Link key={bm.id} href={`/events/${bm.event.id}`} style={{ textDecoration: "none" }}>
                  <motion.div whileHover={{ y: -4 }} className="brutal-card">
                    <div className="tag tag-green" style={{ marginBottom: "12px" }}>{bm.event.category}</div>
                    <div className="font-bangers" style={{ fontSize: "1.6rem" }}>{bm.event.title}</div>
                    <div className="font-space" style={{ opacity: 0.85, fontSize: "0.85rem", marginTop: "8px" }}>
                      {new Date(bm.event.event_date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })} · +{bm.event.xp_reward} XP
                    </div>
                  </motion.div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "notifications" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <span className="font-bebas" style={{ fontSize: "1.2rem", opacity: 0.85 }}>{unread} UNREAD</span>
            {unread > 0 && <button onClick={markAllRead} className="btn" style={{ fontSize: "0.85rem", padding: "6px 16px" }}>MARK ALL READ</button>}
          </div>
          {notifications.length === 0 ? (
            <div className="brutal-card" style={{ textAlign: "center", padding: "60px" }}>
              <div className="font-bangers" style={{ fontSize: "2.5rem" }}>ALL CLEAR</div>
              <p className="font-space" style={{ opacity: 0.85, marginTop: "8px" }}>No notifications yet</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {notifications.map((n: any) => (
                <motion.div key={n.id} whileHover={{ x: 4 }}
                  className="brutal-card" style={{
                    padding: "20px",
                    borderLeft: `6px solid ${n.type === "success" ? "var(--green)" : n.type === "error" ? "var(--pink)" : "var(--blue)"}`,
                    background: n.is_read ? "white" : "var(--cream)",
                  }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                    <div>
                      <div className="font-bebas" style={{ fontSize: "1.1rem" }}>{n.title}</div>
                      <div className="font-space" style={{ fontSize: "0.85rem", opacity: 0.9, marginTop: "4px" }}>{n.body}</div>
                    </div>
                    <div className="font-space" style={{ fontSize: "0.75rem", opacity: 0.7, whiteSpace: "nowrap", marginLeft: "12px" }}>
                      {new Date(n.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                    </div>
                  </div>
                  {!n.is_read && (
                    <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--pink)", position: "absolute", top: "20px", right: "20px" }} />
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
