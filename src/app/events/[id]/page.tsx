"use client";
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { Event } from "@/lib/types";
import { 
  Calendar, 
  MapPin, 
  Users, 
  Zap, 
  ArrowLeft, 
  Bookmark, 
  BookmarkCheck, 
  Share2, 
  Clock3, 
  Trophy, 
  Ticket, 
  ShieldCheck, 
  Tags, 
  UserPlus,
  Rocket,
  Award,
  Globe,
  Flame,
  MessageSquare,
  ChevronRight,
  TrendingUp,
  Target,
  Sparkles,
  Bot,
  ChevronLeft,
  Info,
  HelpCircle
} from "lucide-react";
import { getCategoryIcon } from "@/lib/category-icons";

// ============================================================
// THEME & CONSTANTS
// ============================================================

const CAT_THEMES: Record<string, { hero: string, accent: string, secondary: string, glow: string }> = {
  Tech: { 
    hero: "linear-gradient(180deg, #021a32 0%, #050505 100%)", 
    accent: "#00F2FF", 
    secondary: "#FFD700",
    glow: "rgba(0, 242, 255, 0.4)"
  },
  Gaming: { 
    hero: "linear-gradient(180deg, #1a0232 0%, #050505 100%)", 
    accent: "#00FF9D", 
    secondary: "#bc00ff",
    glow: "rgba(0, 255, 157, 0.4)"
  },
  Coding: { 
    hero: "linear-gradient(180deg, #022010 0%, #050505 100%)", 
    accent: "#00FF9D", 
    secondary: "#FFD700",
    glow: "rgba(0, 255, 157, 0.4)"
  },
  Design: { 
    hero: "linear-gradient(180deg, #32022a 0%, #050505 100%)", 
    accent: "#bc00ff", 
    secondary: "#FFD700",
    glow: "rgba(188, 0, 255, 0.4)"
  },
  Robotics: { 
    hero: "linear-gradient(180deg, #321402 0%, #050505 100%)", 
    accent: "#FF4D00", 
    secondary: "#00FF9D",
    glow: "rgba(255, 77, 0, 0.4)"
  },
  Cultural: { 
    hero: "linear-gradient(180deg, #1a0232 0%, #050505 100%)", 
    accent: "#FF007A", 
    secondary: "#FFD700",
    glow: "rgba(255, 0, 122, 0.4)"
  },
  Sports: { 
    hero: "linear-gradient(180deg, #023214 0%, #050505 100%)", 
    accent: "#00FF9D", 
    secondary: "#FFFFFF",
    glow: "rgba(0, 255, 157, 0.4)"
  },
  Workshop: { 
    hero: "linear-gradient(180deg, #022a32 0%, #050505 100%)", 
    accent: "#00A3FF", 
    secondary: "#FFD700",
    glow: "rgba(0, 163, 255, 0.4)"
  },
  General: { 
    hero: "linear-gradient(180deg, #222 0%, #050505 100%)", 
    accent: "#00FF9D", 
    secondary: "#FFD700",
    glow: "rgba(0, 255, 157, 0.2)"
  }
};

// ============================================================
// SUB-COMPONENTS
// ============================================================

function Countdown({ targetDate, color }: { targetDate: string, color: string }) {
  const [timeLeft, setTimeLeft] = useState({ d: 0, h: 0, m: 0, s: 0 });

  useEffect(() => {
    const tick = () => {
      const diff = new Date(targetDate).getTime() - Date.now();
      if (diff <= 0) { setTimeLeft({ d: 0, h: 0, m: 0, s: 0 }); return; }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft({ d, h, m, s });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [targetDate]);

  return (
    <div style={{ display: "flex", gap: "6px", justifyContent: "center" }}>
      {[["d", "D"], ["h", "H"], ["m", "M"], ["s", "S"]].map(([k, label]) => (
        <div key={label} style={{ textAlign: "center" }}>
          <div className="font-bangers" style={{ fontSize: "1.8rem", lineHeight: 1, color }}>
            {String((timeLeft as any)[k]).padStart(2, "0")}
          </div>
          <div className="font-bebas" style={{ fontSize: "0.6rem", opacity: 0.6 }}>{label}</div>
        </div>
      ))}
    </div>
  );
}

function FloatingVisuals() {
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden", zIndex: 0 }}>
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        style={{ position: "absolute", top: "-100px", right: "-100px", width: "400px", height: "400px", border: "1px dashed rgba(255,255,255,0.1)", borderRadius: "50%" }} />
      <motion.div animate={{ rotate: -360 }} transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
        style={{ position: "absolute", bottom: "-150px", left: "-150px", width: "500px", height: "500px", border: "1px dashed rgba(255,255,255,0.05)", borderRadius: "50%" }} />
    </div>
  );
}

function BattleTimeline() {
  const steps = ["REGISTER", "TEAM UP", "BATTLE", "RESULTS", "REWARDS"];
  return (
    <div style={{ display: "flex", justifyContent: "space-between", position: "relative", padding: "20px 0" }}>
      <div style={{ position: "absolute", top: "45%", left: "5%", right: "5%", height: "4px", background: "black", zIndex: 0 }} />
      {steps.map((step, i) => (
        <div key={step} style={{ position: "relative", zIndex: 1, textAlign: "center" }}>
          <div style={{ width: "40px", height: "40px", background: i === 0 ? "var(--green)" : "white", border: "3px solid black", borderRadius: "50%", margin: "0 auto 10px", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "4px 4px 0 black" }}>
            <span className="font-bangers" style={{ fontSize: "1.2rem" }}>{i + 1}</span>
          </div>
          <span className="font-bebas" style={{ fontSize: "0.8rem", opacity: 0.7 }}>{step}</span>
        </div>
      ))}
    </div>
  );
}

// ============================================================
// PAGE
// ============================================================

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [regCount, setRegCount] = useState(0);
  const [isRegistered, setIsRegistered] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [relatedEvents, setRelatedEvents] = useState<Event[]>([]);
  const [activities, setActivities] = useState<string[]>([]);
  const [participants, setParticipants] = useState<{name: string, id: string}[]>([]);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    const init = async () => {
      const { data: ev } = await supabase.from("events").select("*").eq("id", id).maybeSingle();
      if (!ev) { setLoading(false); return; }
      setEvent(ev);

      const { data: regs, count } = await supabase
        .from("registrations")
        .select("id, registered_at, profiles(id, name)", { count: "exact" })
        .eq("event_id", id)
        .order("registered_at", { ascending: false });
      
      setRegCount(count || 0);
      
      if (regs) {
        setParticipants(regs.map((r: any) => ({ name: r.profiles.name, id: r.profiles.id })));
        setActivities(regs.slice(0, 5).map((r: any) => `${r.profiles.name} joined the battle`));
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        const { data: reg } = await supabase.from("registrations").select("id").eq("event_id", id).eq("user_id", user.id).maybeSingle();
        setIsRegistered(!!reg);
        const { data: bm } = await supabase.from("bookmarks").select("id").eq("event_id", id).eq("user_id", user.id).maybeSingle();
        setIsBookmarked(!!bm);
      }

      const { data: related } = await supabase.from("events").select("*").neq("id", id).limit(6);
      setRelatedEvents(related || []);
      setLoading(false);
    };
    if (id) init();
  }, [id]);

  const toggleBookmark = async () => {
    if (!userId) { router.push("/auth"); return; }
    if (isBookmarked) {
      await supabase.from("bookmarks").delete().eq("event_id", id).eq("user_id", userId);
      setIsBookmarked(false);
    } else {
      await supabase.from("bookmarks").insert({ user_id: userId, event_id: id });
      setIsBookmarked(true);
    }
  };

  if (loading) return <div className="funk-loading">ENGAGING BATTLE DRIVE...</div>;
  if (!event) return <div style={{ padding: "100px", textAlign: "center" }}><h1 className="font-bangers">ERROR 404: AREA COMPROMISED</h1></div>;

  const theme = CAT_THEMES[event.category] || CAT_THEMES.General;
  const isFull = regCount >= event.max_seats;
  const fillPct = Math.min((regCount / event.max_seats) * 100, 100);
  const isPast = new Date(event.event_date) < new Date();
  const CategoryIcon = getCategoryIcon(event.category);

  return (
    <div className="event-detail-page" style={{ 
      background: "#F5F5F5", 
      minHeight: "100vh",
      "--theme-accent": theme.accent,
      "--theme-secondary": theme.secondary,
      "--theme-glow": theme.glow
    } as React.CSSProperties}>
      <div className="dynamic-bg" style={{ opacity: 0.2 }} />

      {/* COMPACT HERO */}
      <section className="hero-section" style={{ 
        color: "white", 
        position: "relative",
        borderBottom: "6px solid black",
        overflow: "hidden",
        minHeight: "400px"
      }}>
        {event.banner_url ? (
          <Image src={event.banner_url} alt={event.title} fill style={{ objectFit: "cover", opacity: 0.4 }} unoptimized />
        ) : (
          <div style={{ position: "absolute", inset: 0, background: theme.hero, opacity: 0.8 }} />
        )}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, transparent, rgba(0,0,0,0.8))" }} />
        
        <FloatingVisuals />
        <div className="hero-container" style={{ maxWidth: "1400px", margin: "0 auto", position: "relative", zIndex: 1 }}>
          <div className="hero-content">
            <Link href="/events" className="font-bebas back-link" style={{ color: theme.accent, display: "flex", alignItems: "center", gap: "8px", textDecoration: "none", marginBottom: "24px" }}>
              <ArrowLeft size={18} /> BACK TO LISTING
            </Link>
            <div style={{ display: "flex", gap: "10px", marginBottom: "20px", flexWrap: "wrap" }}>
              <span className="sticker" style={{ background: "var(--pink)", color: "white", fontSize: "0.75rem" }}>LIVE ARENA</span>
              <span className="sticker" style={{ background: theme.secondary, color: "black", fontSize: "0.75rem" }}>{event.category}</span>
              <span className="sticker" style={{ background: "white", color: "black", fontSize: "0.75rem" }}>{event.difficulty}</span>
            </div>
            <h1 className="font-bangers event-title" style={{ lineHeight: 0.9 }}>
              {event.title}
            </h1>
            <div className="hero-meta font-space" style={{ marginTop: "32px", display: "flex", flexWrap: "wrap", gap: "20px", opacity: 0.9 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}><Calendar size={20} color={theme.accent} /> {new Date(event.event_date).toLocaleDateString()}</div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}><MapPin size={20} color={theme.accent} /> {event.venue || "Arena"}</div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#00FF9D" }}><Zap size={20} fill="currentColor" /> +{event.xp_reward} XP</div>
            </div>
          </div>

          <motion.div whileHover={{ scale: 1.02 }} className="hero-pass-card" style={{ 
            background: "white", color: "black", borderRadius: "24px", padding: "32px", border: "5px solid black", boxShadow: `12px 12px 0 ${theme.accent}`, position: "relative", overflow: "hidden" 
          }}>
            <div className="holographic-pass" />
            <div className="scan-line" style={{ background: theme.glow }} />
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "24px" }}>
              <span className="font-bangers" style={{ opacity: 0.4, fontSize: "0.8rem" }}>VELTRIX PASS</span>
              <CategoryIcon size={24} color={theme.accent} />
            </div>
            <div style={{ textAlign: "center", marginBottom: "24px" }}>
              <h2 className="font-bangers" style={{ fontSize: "1.5rem" }}>{event.title}</h2>
              <div className="font-bebas" style={{ fontSize: "0.8rem", opacity: 0.5 }}>#VX-{id.slice(0, 6).toUpperCase()}</div>
            </div>
            <div style={{ borderTop: "2px dashed #ccc", paddingTop: "16px", display: "flex", justifyContent: "space-between", fontSize: "0.9rem" }}>
              <div className="font-bebas">SEAT: {regCount + 101}</div>
              <div className="font-bebas">MISSION READY</div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* STICKY QUICK NAV */}
      <nav className="sticky-nav" style={{ 
        position: "sticky", top: "0", background: "white", borderBottom: "4px solid black", zIndex: 100
      }}>
        <div style={{ maxWidth: "1400px", margin: "0 auto", display: "flex", gap: "24px", overflowX: "auto", padding: "0 20px" }} className="no-scrollbar">
          {[
            { id: "overview", label: "OVERVIEW" },
            ...(event.rules ? [{ id: "rules", label: "RULES" }] : []),
            { id: "timeline", label: "TIMELINE" },
            { id: "rewards", label: "REWARDS" },
            ...(event.contact_info ? [{ id: "contact", label: "SUPPORT" }] : [])
          ].map(tab => (
            <button key={tab.id} 
              onClick={() => {
                setActiveTab(tab.id);
                document.getElementById(tab.id)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }}
              style={{ 
                padding: "16px 0", border: "none", background: "none", cursor: "pointer", position: "relative",
                fontFamily: "Bebas Neue", fontSize: "1rem", color: activeTab === tab.id ? theme.accent : "black",
                whiteSpace: "nowrap"
              }}>
              {tab.label}
              {activeTab === tab.id && <div style={{ position: "absolute", bottom: "-4px", left: 0, right: 0, height: "4px", background: theme.accent }} />}
            </button>
          ))}
        </div>
      </nav>

      {/* CONTENT GRID */}
      <main className="main-content" style={{ maxWidth: "1400px", margin: "0 auto", display: "grid", alignItems: "start" }}>
        
        {/* LEFT COLUMN — THE STORY */}
        <div className="story-column" style={{ display: "flex", flexDirection: "column" }}>
          
          <section id="overview">
            <div className="sticker" style={{ background: "white", marginBottom: "20px" }}>THE CHALLENGE</div>
            <p className="font-space description-text">
              {event.description || "Mission brief is currently encrypted. Check back soon."}
            </p>
            <div className="info-cards" style={{ display: "grid", gap: "20px", marginTop: "32px" }}>
              <div className="brutal-card" style={{ padding: "24px", background: "white" }}>
                <Rocket size={28} color={theme.accent} style={{ marginBottom: "12px" }} />
                <h4 className="font-bangers">MODE</h4>
                <p className="font-space" style={{ opacity: 0.7, textTransform: "uppercase", fontSize: "0.9rem" }}>{event.mode} BATTLE</p>
              </div>
              <div className="brutal-card" style={{ padding: "24px", background: "white" }}>
                <ShieldCheck size={28} color={theme.secondary} style={{ marginBottom: "12px" }} />
                <h4 className="font-bangers">DIFFICULTY</h4>
                <p className="font-space" style={{ opacity: 0.7, textTransform: "uppercase", fontSize: "0.9rem" }}>{event.difficulty} LEVEL</p>
              </div>
            </div>
          </section>

          {event.rules && (
            <section id="rules">
              <div className="sticker" style={{ background: "#FFD700", color: "black", marginBottom: "20px" }}>ARENA RULES</div>
              <div className="brutal-card" style={{ padding: "24px", background: "white", whiteSpace: "pre-wrap" }}>
                <p className="font-space" style={{ fontSize: "1rem", lineHeight: 1.6, opacity: 0.8 }}>
                  {event.rules}
                </p>
              </div>
            </section>
          )}

          <section id="timeline">
            <div className="sticker" style={{ background: "#00F2FF", color: "black", marginBottom: "20px" }}>PROGRESSION</div>
            <h2 className="font-bangers" style={{ fontSize: "2.5rem", marginBottom: "24px" }}>BATTLE PHASES</h2>
            <div style={{ overflowX: "auto", padding: "10px" }} className="timeline-container no-scrollbar">
               <BattleTimeline />
            </div>
          </section>

          <section id="rewards">
            <div className="brutal-card rewards-card" style={{ background: "black", color: "white", textAlign: "center", border: "5px solid white" }}>
              <div className="reward-icon" style={{ background: theme.accent, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
                <Award size={40} color="black" />
              </div>
              <h2 className="font-bangers reward-title">
                {event.prize_pool ? "PRIZE POOL" : "MISSION REWARDS"}
              </h2>
              {event.prize_pool && (
                <div className="font-bangers prize-pool-text" style={{ color: "white", margin: "16px 0", textShadow: `0 0 20px ${theme.glow}` }}>
                  {event.prize_pool}
                </div>
              )}
              <div className="reward-stats" style={{ display: "flex", justifyContent: "center", gap: "32px", margin: "32px 0" }}>
                <div><div className="font-bangers stat-val">+{event.xp_reward}</div><div className="font-bebas">XP</div></div>
                <div style={{ width: "2px", background: "rgba(255,255,255,0.2)" }} />
                <div><div className="font-bangers stat-val">1</div><div className="font-bebas">ACHIEVEMENT</div></div>
              </div>
            </div>
          </section>

          {event.contact_info && (
            <section id="contact">
               <div className="sticker" style={{ background: theme.accent, color: "black", marginBottom: "20px" }}>SUPPORT / INTEL</div>
               <div className="brutal-card" style={{ padding: "24px", background: "white" }}>
                  <div className="font-bebas" style={{ opacity: 0.5, marginBottom: "8px", fontSize: "0.8rem" }}>CONTACT COORDINATORS</div>
                  <p className="font-space" style={{ fontSize: "1rem" }}>{event.contact_info}</p>
               </div>
            </section>
          )}
        </div>

        {/* RIGHT COLUMN — STICKY ACTION PANEL */}
        <aside className="action-sidebar" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          
          <div className="brutal-card action-card" style={{ background: "white", padding: "32px", border: "5px solid black", boxShadow: "10px 10px 0 black" }}>
            {!isPast && (
              <div style={{ textAlign: "center", marginBottom: "24px" }}>
                <div className="font-bebas" style={{ opacity: 0.5, marginBottom: "8px", fontSize: "0.9rem" }}>ARENA CLOSES IN</div>
                <Countdown targetDate={event.event_date} color={theme.accent} />
              </div>
            )}

            <div style={{ marginBottom: "24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "0.9rem" }}>
                <span className="font-bangers">{regCount} ENROLLED</span>
                <span className="font-bebas" style={{ opacity: 0.5 }}>MAX: {event.max_seats}</span>
              </div>
              <div style={{ height: "12px", background: "#f0f0f0", border: "3px solid black", borderRadius: "6px", overflow: "hidden" }}>
                <motion.div initial={{ width: 0 }} animate={{ width: `${fillPct}%` }} style={{ height: "100%", background: fillPct > 85 ? "var(--pink)" : "var(--green)" }} />
              </div>
              <div className="font-space" style={{ fontSize: "0.8rem", marginTop: "10px", fontWeight: "bold" }}>
                {isFull ? "⚠️ ARENA FULL" : `⚡ ${event.max_seats - regCount} SPOTS LEFT`}
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {isPast ? (
                <button disabled className="btn" style={{ width: "100%", opacity: 0.5 }}>BATTLE ENDED</button>
              ) : isRegistered ? (
                <Link href={`/events/${id}/register`} className="btn" style={{ width: "100%", background: "var(--green)", color: "black", textAlign: "center" }}>VIEW PASS →</Link>
              ) : (
                <Link href={`/events/${id}/register`} className="btn" style={{ width: "100%", background: "var(--green)", color: "black", fontSize: "1.2rem", textAlign: "center" }}>REGISTER NOW</Link>
              )}
              <div style={{ display: "flex", gap: "10px" }}>
                <button onClick={toggleBookmark} className="btn" style={{ flex: 1, background: "white", padding: "10px" }}>{isBookmarked ? <BookmarkCheck /> : <Bookmark />}</button>
                <button className="btn" style={{ flex: 1, background: "white", padding: "10px" }}><Share2 /></button>
              </div>
            </div>

            {/* PARTICIPANTS STRIP */}
            <div style={{ marginTop: "24px", padding: "12px", background: "#f9f9f9", borderRadius: "10px", display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{ display: "flex" }}>
                {participants.slice(0, 4).map((p, i) => (
                  <div key={i} style={{ width: "24px", height: "24px", borderRadius: "50%", border: "1.5px solid black", marginLeft: i === 0 ? 0 : "-8px", background: "white", overflow: "hidden" }}>
                    <Image src={`https://api.dicebear.com/7.x/pixel-art/svg?seed=${p.id}`} alt={p.name} width={40} height={40} unoptimized />
                  </div>
                ))}
              </div>
              <span className="font-space" style={{ fontSize: "0.75rem", opacity: 0.6 }}>Join {regCount}+ others</span>
            </div>
          </div>

          <div className="brutal-card live-feed-card" style={{ padding: "20px", background: "white", border: "4px solid black" }}>
            <h4 className="font-bangers" style={{ marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px", fontSize: "1rem" }}><Flame size={16} color="var(--pink)" /> LIVE FEED</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {activities.length > 0 ? activities.map((act, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: "8px", paddingBottom: "8px", borderBottom: i === activities.length - 1 ? "none" : "1px solid #eee" }}>
                  <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: "var(--green)" }} />
                  <span className="font-space" style={{ fontSize: "0.8rem", opacity: 0.7 }}>{act}</span>
                </div>
              )) : <p className="font-space" style={{ fontSize: "0.75rem", opacity: 0.5 }}>Awaiting active signals...</p>}
            </div>
          </div>
        </aside>
      </main>

      {/* RELATED EVENTS CAROUSEL */}
      {relatedEvents.length > 0 && (
        <section className="related-section" style={{ background: "black", color: "white" }}>
          <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
            <div className="related-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "end", marginBottom: "32px" }}>
              <h2 className="font-bangers" style={{ fontSize: "2rem" }}>OTHER BATTLES</h2>
              <Link href="/events" className="btn" style={{ background: "white", color: "black", padding: "8px 16px", fontSize: "0.9rem" }}>VIEW ALL</Link>
            </div>
            <div style={{ display: "flex", gap: "20px", overflowX: "auto", paddingBottom: "15px" }} className="no-scrollbar">
              {relatedEvents.map(ev => (
                <Link key={ev.id} href={`/events/${ev.id}`} style={{ textDecoration: "none", color: "inherit", minWidth: "260px" }}>
                  <div className="brutal-card" style={{ background: "white", color: "black", padding: "16px" }}>
                    <div style={{ height: "130px", background: "#eee", borderRadius: "10px", marginBottom: "12px", overflow: "hidden", position: "relative" }}>
                      {ev.banner_url ? <Image src={ev.banner_url} alt={ev.title} fill style={{ objectFit: "cover" }} unoptimized /> : <div style={{ height: "100%", background: "#f0f0f0" }} />}
                    </div>
                    <h3 className="font-bangers" style={{ fontSize: "1.2rem" }}>{ev.title}</h3>
                    <div className="font-space" style={{ opacity: 0.5, fontSize: "0.75rem", marginTop: "8px" }}>{new Date(ev.event_date).toDateString()}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* MOBILE STICKY BAR */}
      <div className="mobile-only sticky-cta" style={{ 
        position: "fixed", bottom: 0, left: 0, right: 0, background: "white", borderTop: "4px solid black", padding: "12px 20px", zIndex: 1000, display: "flex", justifyContent: "space-between", alignItems: "center"
      }}>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div className="font-bangers" style={{ color: "var(--pink)", fontSize: "1.1rem" }}>+{event.xp_reward} XP</div>
          <div className="font-bebas" style={{ fontSize: "0.7rem", opacity: 0.6 }}>REWARD</div>
        </div>
        {isRegistered ? (
          <Link href={`/events/${id}/register`} className="btn" style={{ background: "var(--green)", padding: "10px 24px" }}>VIEW PASS</Link>
        ) : (
          <Link href={`/events/${id}/register`} className="btn" style={{ background: "var(--green)", padding: "10px 24px" }}>REGISTER NOW</Link>
        )}
      </div>

      <style jsx>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        
        .hero-section { padding: 80px var(--side-padding) 100px; }
        .hero-container { display: grid; grid-template-columns: 1fr 360px; gap: 60px; align-items: center; }
        .event-title { font-size: clamp(3rem, 6vw, 5.5rem); text-shadow: 5px 5px 0 var(--theme-accent), 10px 10px 0 black; }
        
        .main-content { grid-template-columns: 1fr 360px; gap: 60px; padding: 60px var(--side-padding); }
        .story-column { gap: 60px; }
        .description-text { font-size: 1.2rem; line-height: 1.6; opacity: 0.8; }
        .info-cards { grid-template-columns: 1fr 1fr; }
        .rewards-card { padding: 48px; box-shadow: 15px 15px 0 var(--theme-accent); }
        .reward-icon { width: 70px; height: 70px; }
        .reward-title { font-size: 3rem; color: var(--theme-secondary); }
        .prize-pool-text { font-size: 4rem; }
        .stat-val { font-size: 3.5rem; }
        
        .action-sidebar { position: sticky; top: 100px; }
        .related-section { padding: 60px var(--side-padding); }

        @media (max-width: 1100px) {
          .hero-container { grid-template-columns: 1fr; gap: 40px; }
          .main-content { grid-template-columns: 1fr; gap: 40px; padding: 40px 20px; }
          .action-sidebar { position: static; }
          .hero-pass-card { max-width: 400px; }
        }

        @media (max-width: 768px) {
          .hero-section { padding: 60px 20px 80px; }
          .event-title { font-size: 2.8rem; text-shadow: 4px 4px 0 var(--theme-accent), 8px 8px 0 black; }
          .hero-meta { gap: 15px; font-size: 0.9rem; }
          .description-text { font-size: 1.1rem; }
          .info-cards { grid-template-columns: 1fr; }
          .rewards-card { padding: 32px 20px; }
          .reward-title { font-size: 2rem; }
          .prize-pool-text { font-size: 2.8rem; }
          .stat-val { font-size: 2.5rem; }
          .related-section { padding: 40px 20px; }
          .main-content { padding-bottom: 100px; }
        }

        @media (min-width: 769px) { .mobile-only { display: none !important; } }
      `}</style>
    </div>
  );
}
