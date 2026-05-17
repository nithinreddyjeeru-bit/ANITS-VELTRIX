"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { Profile, Registration } from "@/lib/types";
import { dashboardPathForRole } from "@/lib/auth-redirect";
import TeamLobby from "@/components/TeamLobby";
import QRCode from "qrcode";
import { 
  Zap, Trophy, Calendar, Award, Bookmark, Bell, Settings, 
  ChevronRight, ArrowLeft, Clock, CreditCard, QrCode, 
  ShieldCheck, CheckCircle, Flame, Star, MessageSquare, MapPin
} from "lucide-react";

function StatCard({ label, value, icon, color }: { label: string; value: string | number; icon: React.ReactNode; color: string }) {
  return (
    <motion.div whileHover={{ y: -4 }} className="brutal-card" style={{ background: color, color: ["var(--green)", "var(--blue)"].includes(color) ? "var(--black)" : "white" }}>
      <div style={{ fontSize: "2.5rem", marginBottom: "8px" }}>{icon}</div>
      <div className="font-bangers" style={{ fontSize: "3rem", lineHeight: 1 }}>{value}</div>
      <div className="font-bebas" style={{ fontSize: "1rem", opacity: 0.7, letterSpacing: "2px", marginTop: "4px" }}>{label}</div>
    </motion.div>
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

  // Selected registration for the expanded Mission Control Room
  const [selectedReg, setSelectedReg] = useState<any | null>(null);
  const [expandedQrUrl, setExpandedQrUrl] = useState("");
  const [payingRegId, setPayingRegId] = useState<string | null>(null);
  const [countdownString, setCountdownString] = useState("");

  useEffect(() => {
    fetchDashboardData();

    // Realtime notifications
    const channel = (supabase.channel("student-notifs") as any)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications" },
        (payload: any) => { 
          setNotifications(prev => [payload.new, ...prev]); 
          setUnread(prev => prev + 1); 
        })
      .subscribe();

    return () => { 
      supabase.removeChannel(channel).catch(console.error); 
    };
  }, [router]);

  // Countdown timer for active selected mission
  useEffect(() => {
    if (!selectedReg?.event?.event_date) return;

    const timer = setInterval(() => {
      const target = new Date(selectedReg.event.event_date).getTime();
      const now = new Date().getTime();
      const difference = target - now;

      if (difference <= 0) {
        setCountdownString("MISSION IS LIVE! ⚡");
        clearInterval(timer);
      } else {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const mins = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        setCountdownString(`${days}d ${hours}h ${mins}m left`);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [selectedReg]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
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

      // Refresh currently selected registration details to capture updates
      if (selectedReg) {
        const refreshed = (regsRes.data || []).find(r => r.id === selectedReg.id);
        if (refreshed) {
          setSelectedReg(refreshed);
          if (refreshed.qr_token) {
            generateQR(refreshed.qr_token, refreshed.event_id);
          }
        }
      }

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

  const handleSelectRegistration = async (reg: any) => {
    setSelectedReg(reg);
    if (reg.qr_token) {
      await generateQR(reg.qr_token, reg.event_id);
    }
  };

  const generateQR = async (token: string, eventId: string) => {
    const qrData = JSON.stringify({ token, event_id: eventId, app: "veltrix" });
    const url = await QRCode.toDataURL(qrData, { 
      width: 250, 
      margin: 2, 
      color: { dark: "#0B0B0B", light: "#FFF6E3" } 
    });
    setExpandedQrUrl(url);
  };

  const handleCompleteDelayedPayment = async (regId: string) => {
    try {
      setPayingRegId(regId);
      
      // Simulate Razorpay sandbox delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      // 1. Generate unique QR Token for them now!
      const secureQrToken = Math.random().toString(36).substring(2, 10).toUpperCase();

      // 2. Update registration to Paid & Confirmed
      const { error } = await supabase
        .from("registrations")
        .update({
          status: "confirmed",
          payment_status: "paid",
          qr_token: secureQrToken
        })
        .eq("id", regId);

      if (error) throw error;

      await fetchDashboardData();

      // 3. Trigger Notification
      await supabase.from("notifications").insert({
        user_id: profile?.id,
        title: "💳 Payment Confirmed!",
        body: `Your payment was successfully processed. Your secure QR pass is now active!`,
        type: "success",
        link: "/dashboard"
      });

    } catch (err) {
      console.error("Payment error:", err);
    } finally {
      setPayingRegId(null);
    }
  };

  const markAllRead = async () => {
    if (!profile) return;
    await supabase.from("notifications").update({ is_read: true }).eq("user_id", profile.id).eq("is_read", false);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnread(0);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "#FFCC00"; // Yellow
      case "approved": return "#00FFFF"; // Blue
      case "paid":
      case "confirmed": return "#39FF14"; // Green
      case "attended": return "#1A1A1A"; // Dark Grey
      case "certified": return "#FFE600"; // Star Gold
      default: return "#EAEAEA";
    }
  };

  const xpProgress = profile ? ((profile.xp % 1000) / 1000) * 100 : 0;

  if (loading && !selectedReg) return (
    <div style={{ padding: "80px", display: "flex", justifyContent: "center" }}>
      <motion.div className="font-bangers" style={{ fontSize: "3rem" }}
        animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1 }}>
        SYNCING COMMS NETWORK...
      </motion.div>
    </div>
  );

  if (!profile) return (
    <div style={{ padding: "60px", minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div className="brutal-card card-pink" style={{ textAlign: "center", maxWidth: "500px", padding: "40px" }}>
        <h1 className="font-bangers" style={{ fontSize: "3rem" }}>PROFILE CORRUPTED</h1>
        <button onClick={signOut} className="btn btn-black">REBOOT SYSTEM</button>
      </div>
    </div>
  );

  return (
    <div className="dashboard-container font-space">
      {/* HEADER SECTION */}
      {!selectedReg && (
        <div className="dash-header">
          <div className="left-meta">
            <div className="sticker bg-pink">OPERATIVE LOGGED</div>
            <h1 className="font-bangers dash-title">{profile.name?.toUpperCase()}</h1>
            <div className="font-bebas branch-tag">
              {profile.department || "VELTRIX SYSTEM"} · SQUAD RANK LEVEL {profile.level ?? 1}
            </div>
            
            {/* XP PROGRESS BAR */}
            <div className="xp-metric-container">
              <div className="xp-row">
                <span className="font-bebas">{profile.xp ?? 0} CURRENT XP</span>
                <span className="font-bebas">LEVEL {(profile.level ?? 1) + 1}: {(profile.level ?? 1) * 1000} XP</span>
              </div>
              <div className="xp-bar brutal-card">
                <motion.div 
                  initial={{ width: 0 }} 
                  animate={{ width: `${xpProgress}%` }} 
                  transition={{ duration: 1, delay: 0.5 }}
                  className="xp-bar-fill" 
                />
              </div>
            </div>
          </div>

          <div className="action-buttons-group">
            <Link href="/settings" className="btn settings-btn" aria-label="Settings">
              <Settings size={18} />
            </Link>
            <button onClick={signOut} className="btn btn-pink font-bebas out-btn">
              DISCONNECT
            </button>
          </div>
        </div>
      )}

      {/* STATS OVERVIEW SECTION */}
      {!selectedReg && (
        <div className="stats-grid">
          <StatCard label="COMBAT XP" value={(profile.xp ?? 0).toLocaleString()} icon={<Zap size={28} />} color="var(--green)" />
          <StatCard label="LEADERBOARD RANK" value={myRank ? `#${myRank}` : "—"} icon={<Trophy size={28} />} color="var(--black)" />
          <StatCard label="MISSIONS JOINED" value={registrations.length} icon={<Calendar size={28} />} color="var(--pink)" />
          <StatCard label="DIGITAL TROPHIES" value={certificates.length} icon={<Award size={28} />} color="var(--blue)" />
        </div>
      )}

      <AnimatePresence mode="wait">
        {selectedReg ? (
          /* MISSION CONTROL ROOM PANEL (EXPANDED WORKSPACE) */
          <motion.div 
            key="control-room"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="mission-control-room font-space"
          >
            <button className="btn btn-black font-bebas back-squad-btn" onClick={() => setSelectedReg(null)}>
              <ArrowLeft size={16} /> BACK TO SQUAD LIST
            </button>

            <div className="control-room-grid">
              
              {/* Left Column: Mission Meta & QR pass */}
              <div className="mission-meta-column brutal-card">
                <div className="sticker bg-pink font-bebas">MISSION DOSSIER</div>
                <h2 className="font-bangers event-title-card">{selectedReg.event?.title}</h2>
                
                <div className="countdown-clock brutal-card font-bebas">
                  <Clock size={20} /> {countdownString}
                </div>

                <div className="meta-details-list">
                  <div className="meta-item"><Calendar size={18} /> {new Date(selectedReg.event?.event_date).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}</div>
                  <div className="meta-item"><MapPin size={18} /> {selectedReg.event?.venue || "VENUE TBD"}</div>
                  <div className="meta-item">
                    <strong>PASS STATUS:</strong>
                    <span 
                      className="status-pill font-bebas" 
                      style={{ 
                        background: getStatusColor(selectedReg.status),
                        color: selectedReg.status === "attended" ? "var(--green)" : "black"
                      }}
                    >
                      {selectedReg.status.toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* DELAYED MEMBER PAYMENT TRIGGER */}
                {selectedReg.status === "approved" && selectedReg.payment_status === "pending" && (
                  <div className="delayed-payment-panel brutal-card bg-cream">
                    <h3 className="font-bebas warning-title"><CreditCard /> PAYMENT PENDING</h3>
                    <p>Your request to join the squad was approved! Please complete the transaction to activate your entry pass.</p>
                    <button 
                      className="btn btn-green pay-btn font-bebas"
                      onClick={() => handleCompleteDelayedPayment(selectedReg.id)}
                      disabled={payingRegId !== null}
                    >
                      {payingRegId === selectedReg.id ? "AUTHORIZING STRIPE CHECKOUT..." : "PROCEED TO PAY ₹ 150.00"}
                    </button>
                  </div>
                )}

                {/* TICKET QR GATEWAY */}
                {selectedReg.qr_token && selectedReg.status !== "pending" && (
                  <div className="lobby-qr-holder brutal-card bg-cream">
                    <div className="sticker bg-black text-white" style={{ marginBottom: "12px" }}><QrCode size={14} /> SECURE ENTRY TICKET</div>
                    <img src={expandedQrUrl} alt="Secure QR Pass" />
                    <span className="font-bebas qr-pass-id">PASS ID: {selectedReg.qr_token.toUpperCase()}</span>
                  </div>
                )}

                {selectedReg.status === "pending" && (
                  <div className="lobby-awaiting-card brutal-card">
                    <Flame className="spin-slow" />
                    <h3 className="font-bebas">AWAITING SQUAD CLEARANCE</h3>
                    <p>The Team Lead is currently reviewing your profile registration credentials. Comms lobby chat is locked.</p>
                  </div>
                )}
              </div>

              {/* Right Column: Teammates & Comms (TeamLobby component) */}
              <div className="comms-lobby-column">
                {selectedReg.team_id ? (
                  selectedReg.status !== "pending" ? (
                    <TeamLobby 
                      teamId={selectedReg.team_id} 
                      userId={profile.id} 
                      isLead={selectedReg.event?.created_by === profile.id}
                      onLeaveOrDisband={() => setSelectedReg(null)}
                    />
                  ) : (
                    <div className="brutal-card locked-lobby-message font-space">
                      💬 Lobby Transmission is offline. Await squad approval.
                    </div>
                  )
                ) : (
                  <div className="brutal-card solo-lobby-details">
                    <h3 className="font-bebas solo-title"><Star /> SOLO INFILTRATION DETECTED</h3>
                    <p>You have registered for this mission as a solo operative. No teammates or comms lobby are active.</p>
                    <div className="sticker bg-green">+{selectedReg.event?.xp_reward} XP pending verified check-in</div>
                  </div>
                )}
              </div>

            </div>
          </motion.div>
        ) : (
          /* STANDARD TAB NAVIGATION PANEL */
          <motion.div 
            key="standard-dashboard"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {/* Tab Navigation */}
            <div className="tabs-container no-scrollbar">
              {[
                { key: "events", label: `MISSIONS (${registrations.length})`, icon: <Calendar size={14} /> },
                { key: "certificates", label: `TROPHIES (${certificates.length})`, icon: <Award size={14} /> },
                { key: "bookmarks", label: `BOOKMARKS (${bookmarks.length})`, icon: <Bookmark size={14} /> },
                { key: "notifications", label: `TRANSMISSIONS ${unread > 0 ? `(${unread})` : ""}`, icon: <Bell size={14} /> },
              ].map(tab => (
                <button 
                  key={tab.key} 
                  onClick={() => setActiveTab(tab.key as any)}
                  className="btn tab-nav-btn" 
                  style={{
                    background: activeTab === tab.key ? "var(--black)" : "white",
                    color: activeTab === tab.key ? "white" : "var(--black)",
                  }}
                >
                  {tab.icon} {tab.label}
                </button>
              ))}
            </div>

            {/* TAB FEED CONTENT */}
            <div className="tab-feed-content">
              
              {/* 1. EVENTS / REGISTRATIONS TAB */}
              {activeTab === "events" && (
                <div className="events-tab-feed">
                  {registrations.length === 0 ? (
                    <div className="brutal-card empty-feed">
                      <div className="big-emoji">⚔️</div>
                      <div className="font-bangers empty-feed-heading">NO ACTIVE MISSIONS</div>
                      <p>Claim your first quest in the event list to level up and earn XP!</p>
                      <Link href="/events" className="btn btn-green">EXPLORE MISSION DIRECTORY →</Link>
                    </div>
                  ) : (
                    <div className="registrations-list-feed">
                      {registrations.map(reg => {
                        const isPast = new Date(reg.event?.event_date) < new Date();
                        return (
                          <div 
                            key={reg.id} 
                            onClick={() => handleSelectRegistration(reg)}
                            className="registration-card-wrapper"
                          >
                            <motion.div whileHover={{ x: 6 }} className="brutal-card registration-row-card">
                              <div className="row-left-content">
                                <span className="font-bebas event-item-cat">{reg.event?.category}</span>
                                <h3 className="font-bangers event-item-title">{reg.event?.title}</h3>
                                <div className="event-item-desc-text">
                                  {new Date(reg.event?.event_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} · {reg.event?.venue || "TBD"}
                                </div>
                                <div className="tags-row" style={{ marginTop: "10px", display: "flex", gap: "10px" }}>
                                  <span 
                                    className="status-pill font-bebas" 
                                    style={{ 
                                      background: getStatusColor(reg.status),
                                      color: reg.status === "attended" ? "var(--green)" : "black"
                                    }}
                                  >
                                    {reg.status.toUpperCase()}
                                  </span>
                                  {reg.team_id && (
                                    <span className="status-pill squad-pill font-bebas">SQUAD JOINED</span>
                                  )}
                                  {isPast && reg.status !== "attended" && (
                                    <span className="status-pill past-pill font-bebas">EXPIRED</span>
                                  )}
                                </div>
                              </div>
                              <div className="row-right-content">
                                <div className="font-bangers reward-xp">+{reg.event?.xp_reward} XP</div>
                                <div className="enter-lobby-button font-bebas">ENTER LOBBY <ChevronRight size={16} /></div>
                              </div>
                            </motion.div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* 2. CERTIFICATES TAB */}
              {activeTab === "certificates" && (
                <div className="certs-tab-feed">
                  {certificates.length === 0 ? (
                    <div className="brutal-card empty-feed">
                      <div className="big-emoji">🏅</div>
                      <div className="font-bangers empty-feed-heading">NO TROPHIES YET</div>
                      <p>Attend registered missions and scan code at check-in to secure certificates!</p>
                    </div>
                  ) : (
                    <div className="certificates-grid">
                      {certificates.map((cert: any) => (
                        <motion.div key={cert.id} whileHover={{ y: -4 }} className="brutal-card cert-card-brutal">
                          <div className="sticker bg-green font-bebas">{cert.event?.category}</div>
                          <h3 className="font-bangers cert-card-title">{cert.title}</h3>
                          <div className="cert-card-date">
                            Issued: {new Date(cert.issued_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                          </div>
                          <div className="cert-card-action-row">
                            {cert.file_url ? (
                              <a href={cert.file_url} target="_blank" rel="noopener noreferrer" className="btn btn-green">
                                DOWNLOAD CERT
                              </a>
                            ) : (
                              <span className="btn pending-btn font-bebas">AWAITING GENERATION</span>
                            )}
                            <span className="font-bebas cert-verify-tag">
                              VERIFY CODE: {cert.verify_code?.toUpperCase()}
                            </span>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* 3. BOOKMARKS TAB */}
              {activeTab === "bookmarks" && (
                <div className="bookmarks-tab-feed">
                  {bookmarks.length === 0 ? (
                    <div className="brutal-card empty-feed">
                      <div className="big-emoji">🔖</div>
                      <div className="font-bangers empty-feed-heading">NOTHING SAVED YET</div>
                      <Link href="/events" className="btn btn-black">SEARCH CAMPAIGNS →</Link>
                    </div>
                  ) : (
                    <div className="bookmarks-grid">
                      {bookmarks.map((bm: any) => bm.event && (
                        <Link key={bm.id} href={`/events/${bm.event.id}`} style={{ textDecoration: "none" }}>
                          <motion.div whileHover={{ y: -4 }} className="brutal-card bookmark-card-brutal">
                            <div className="sticker bg-pink font-bebas">{bm.event.category}</div>
                            <h3 className="font-bangers bookmark-card-title">{bm.event.title}</h3>
                            <div className="bookmark-card-details">
                              {new Date(bm.event.event_date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })} · +{bm.event.xp_reward} XP
                            </div>
                          </motion.div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* 4. NOTIFICATIONS TAB */}
              {activeTab === "notifications" && (
                <div className="notifications-tab-feed">
                  <div className="notifications-action-bar">
                    <span className="font-bebas total-unread-count">{unread} UNREAD TRANSMISSIONS</span>
                    {unread > 0 && <button onClick={markAllRead} className="btn font-bebas mark-read-btn">MARK ALL READ</button>}
                  </div>
                  {notifications.length === 0 ? (
                    <div className="brutal-card empty-feed">
                      <div className="font-bangers empty-feed-heading">NO TRANSMISSIONS</div>
                      <p>All frequencies clear.</p>
                    </div>
                  ) : (
                    <div className="notifications-list-feed">
                      {notifications.map((n: any) => (
                        <motion.div 
                          key={n.id} 
                          whileHover={{ x: 4 }}
                          className={`brutal-card notification-row-card ${n.is_read ? "" : "unread"}`}
                          style={{
                            borderLeftColor: n.type === "success" ? "var(--green)" : n.type === "warning" ? "var(--yellow)" : "var(--pink)"
                          }}
                        >
                          <div className="notif-inner">
                            <div className="notif-text-info">
                              <h4 className="font-bebas notif-card-title">{n.title}</h4>
                              <p className="notif-card-body">{n.body}</p>
                            </div>
                            <span className="notif-card-date">
                              {new Date(n.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                            </span>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              )}

            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <style jsx>{`
        .dashboard-container {
          padding: 60px clamp(16px, 4vw, 40px) 100px;
          max-width: 1200px;
          margin: 0 auto;
        }
        .brutal-card {
          background: white;
          border: 4px solid #000;
          box-shadow: 8px 8px 0px #000;
          padding: 24px;
        }
        
        /* HEADER */
        .dash-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 45px;
          gap: 30px;
        }
        .dash-title {
          font-size: clamp(2.5rem, 6vw, 4rem);
          margin: 10px 0 5px 0;
          line-height: 0.95;
        }
        .branch-tag {
          font-size: 1.15rem;
          opacity: 0.75;
          letter-spacing: 2px;
        }
        .xp-metric-container {
          margin-top: 20px;
          max-width: 400px;
        }
        .xp-row {
          display: flex;
          justify-content: space-between;
          font-size: 0.9rem;
          margin-bottom: 6px;
          font-weight: bold;
        }
        .xp-bar {
          height: 14px;
          border: 3px solid #000;
          box-shadow: 2px 2px 0px #000;
          padding: 0;
          background: #EAEAEA;
          overflow: hidden;
        }
        .xp-bar-fill {
          height: 100%;
          background: var(--green, #39FF14);
        }
        .action-buttons-group {
          display: flex;
          gap: 10px;
        }
        .out-btn {
          font-size: 0.9rem;
          padding: 8px 16px;
        }

        /* STATS */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 24px;
          margin-bottom: 50px;
        }

        /* TABS NAV */
        .tabs-container {
          display: flex;
          gap: 10px;
          margin-bottom: 30px;
          overflow-x: auto;
          padding-bottom: 8px;
        }
        .tab-nav-btn {
          font-size: 0.9rem;
          padding: 10px 18px;
          display: flex;
          align-items: center;
          gap: 8px;
          white-space: nowrap;
          border: 3px solid #000;
          box-shadow: 4px 4px 0px #000;
          cursor: pointer;
        }

        /* TAB FEED CONTENTS */
        .tab-feed-content {
          margin-top: 20px;
        }
        .empty-feed {
          text-align: center;
          padding: 80px;
        }
        .big-emoji {
          font-size: 4rem;
          margin-bottom: 16px;
        }
        .empty-feed-heading {
          font-size: 2.2rem;
          margin-bottom: 12px;
        }
        
        /* REGISTRATION ROWS LIST */
        .registrations-list-feed {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .registration-card-wrapper {
          cursor: pointer;
        }
        .registration-row-card {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border: 3px solid #000;
          box-shadow: 5px 5px 0px #000;
          transition: transform 0.2s;
        }
        .registration-row-card:hover {
          transform: translate(-3px, -3px);
          box-shadow: 8px 8px 0px #000;
        }
        .event-item-cat {
          background: #EAEAEA;
          border: 1px solid #000;
          padding: 2px 8px;
          font-size: 0.75rem;
          font-weight: bold;
        }
        .event-item-title {
          font-size: 1.8rem;
          margin: 6px 0;
          line-height: 1;
        }
        .event-item-desc-text {
          font-size: 0.9rem;
          opacity: 0.7;
        }
        .status-pill {
          border: 2px solid #000;
          padding: 2px 8px;
          font-size: 0.75rem;
          font-weight: bold;
        }
        .squad-pill {
          background: var(--yellow, #FFE600);
        }
        .past-pill {
          background: #D5D5D5;
          opacity: 0.6;
        }
        .row-right-content {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 10px;
        }
        .reward-xp {
          font-size: 1.4rem;
          color: var(--green, #39FF14);
        }
        .enter-lobby-button {
          font-size: 0.9rem;
          font-weight: bold;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        /* MISSION EXPANDED CONTROL ROOM */
        .back-squad-btn {
          margin-bottom: 24px;
        }
        .control-room-grid {
          display: grid;
          grid-template-columns: 1.1fr 1.3fr;
          gap: 30px;
        }
        .mission-meta-column {
          display: flex;
          flex-direction: column;
        }
        .event-title-card {
          font-size: 2.6rem;
          margin: 12px 0 16px 0;
          line-height: 1;
        }
        .countdown-clock {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: var(--yellow, #FFE600);
          color: black;
          font-size: 1.4rem;
          font-weight: bold;
          padding: 12px;
          border-color: #000;
          margin-bottom: 20px;
          box-shadow: 4px 4px 0px #000;
        }
        .meta-details-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 24px;
        }
        .meta-item {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 1.1rem;
        }
        .delayed-payment-panel {
          border-color: var(--pink, #FF007F);
          background: #FFF0F5;
          margin-top: 15px;
        }
        .warning-title {
          color: var(--pink, #FF007F);
          font-size: 1.5rem;
          margin: 0 0 6px 0;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .pay-btn {
          width: 100%;
          padding: 14px;
          font-size: 1.25rem;
          margin-top: 15px;
        }
        .lobby-qr-holder {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 16px;
          margin-top: 20px;
          border: 3px solid #000;
        }
        .lobby-qr-holder img {
          width: 180px;
          height: 180px;
          border: 2px solid #000;
          background: white;
        }
        .qr-pass-id {
          font-size: 0.75rem;
          opacity: 0.5;
          margin-top: 8px;
          letter-spacing: 1px;
        }
        .lobby-awaiting-card {
          border-color: var(--yellow, #FFE600);
          background: #FFFCEB;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-top: 20px;
        }
        .lobby-awaiting-card h3 {
          font-size: 1.4rem;
          margin: 10px 0 5px 0;
        }
        .locked-lobby-message {
          text-align: center;
          padding: 50px;
          opacity: 0.65;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .solo-lobby-details {
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          min-height: 300px;
        }
        .solo-title {
          font-size: 1.8rem;
          margin-top: 0;
          margin-bottom: 12px;
          color: var(--pink, #FF007F);
          display: flex;
          align-items: center;
          gap: 8px;
        }

        /* DIGITAL TROPHIES GRID */
        .certificates-grid, .bookmarks-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 24px;
        }
        .cert-card-brutal {
          background: var(--black, #0B0B0B);
          color: white;
        }
        .cert-card-title {
          font-size: 1.8rem;
          line-height: 1;
          margin: 12px 0 6px 0;
        }
        .cert-card-date {
          font-size: 0.85rem;
          opacity: 0.75;
          margin-bottom: 20px;
        }
        .cert-card-action-row {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .cert-verify-tag {
          font-size: 0.75rem;
          opacity: 0.4;
        }
        .pending-btn {
          opacity: 0.6;
          cursor: not-allowed;
          background: #333;
          color: white;
          border-color: #333;
        }
        
        /* BOOKMARKS */
        .bookmark-card-brutal {
          transition: transform 0.2s;
        }
        .bookmark-card-brutal:hover {
          transform: translateY(-4px);
        }
        .bookmark-card-title {
          font-size: 1.7rem;
          margin: 12px 0 6px 0;
          line-height: 1;
        }
        .bookmark-card-details {
          font-size: 0.9rem;
          opacity: 0.8;
        }

        /* NOTIFICATIONS & TRANSMISSIONS */
        .notifications-action-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }
        .total-unread-count {
          font-size: 1.25rem;
          font-weight: bold;
        }
        .notifications-list-feed {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .notification-row-card {
          padding: 16px 20px;
          border-left-width: 8px;
          transition: transform 0.2s;
        }
        .notification-row-card.unread {
          background: #FFFCEB;
        }
        .notification-row-card:hover {
          transform: translateX(4px);
        }
        .notif-inner {
          display: flex;
          justify-content: space-between;
          align-items: start;
        }
        .notif-card-title {
          font-size: 1.2rem;
          margin: 0 0 4px 0;
        }
        .notif-card-body {
          margin: 0;
          font-size: 0.9rem;
          opacity: 0.8;
        }
        .notif-card-date {
          font-size: 0.8rem;
          opacity: 0.5;
          margin-left: 15px;
          white-space: nowrap;
        }

        @media (max-width: 991px) {
          .control-room-grid {
            grid-template-columns: 1fr;
          }
        }
        @media (max-width: 768px) {
          .dash-header {
            flex-direction: column;
            gap: 20px;
          }
          .stats-grid {
            grid-template-columns: 1fr 1fr;
          }
          .registration-row-card {
            flex-direction: column;
            align-items: flex-start;
            gap: 20px;
          }
          .row-right-content {
            width: 100%;
            align-items: flex-start;
            flex-direction: row;
            justify-content: space-between;
          }
        }
        @media (max-width: 480px) {
          .stats-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
