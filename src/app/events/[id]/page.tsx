"use client";
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
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
import { TeamPortal } from "@/components/TeamPortal";
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
    hero: "linear-gradient(180deg, #1a1a1a 0%, #050505 100%)", 
    accent: "#ffffff", 
    secondary: "#00FF9D",
    glow: "rgba(255, 255, 255, 0.2)"
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
        .select("id, created_at, profiles(id, name)")
        .eq("event_id", id)
        .order("created_at", { ascending: false });
      
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
    <div className="event-detail-page" style={{ background: "#F5F5F5", minHeight: "100vh" }}>
      <div className="dynamic-bg" style={{ opacity: 0.2 }} />

      {/* COMPACT HERO */}
      <section style={{ 
        padding: "60px 60px 80px", 
        background: theme.hero, 
        color: "white", 
        position: "relative",
        borderBottom: "6px solid black",
        overflow: "hidden"
      }}>
        <FloatingVisuals />
        <div style={{ maxWidth: "1400px", margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 400px", gap: "60px", alignItems: "center", position: "relative", zIndex: 1 }}>
          <div>
            <Link href="/events" className="font-bebas" style={{ color: theme.accent, display: "flex", alignItems: "center", gap: "8px", textDecoration: "none", marginBottom: "24px" }}>
              <ArrowLeft size={18} /> BACK TO LISTING
            </Link>
            <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
              <span className="sticker" style={{ background: "var(--pink)", color: "white", fontSize: "0.8rem" }}>LIVE ARENA</span>
              <span className="sticker" style={{ background: theme.secondary, color: "black", fontSize: "0.8rem" }}>{event.category}</span>
            </div>
            <h1 className="font-bangers" style={{ fontSize: "clamp(3rem, 6vw, 5.5rem)", lineHeight: 0.9, textShadow: `5px 5px 0 ${theme.accent}, 10px 10px 0 black` }}>
              {event.title}
            </h1>
            <div style={{ marginTop: "32px", display: "flex", gap: "24px", opacity: 0.9 }} className="font-space">
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}><Calendar size={20} color={theme.accent} /> {new Date(event.event_date).toLocaleDateString()}</div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}><MapPin size={20} color={theme.accent} /> {event.venue || "Arena"}</div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--green)" }}><Zap size={20} fill="currentColor" /> +{event.xp_reward} XP</div>
            </div>
          </div>

          <motion.div whileHover={{ scale: 1.02 }} style={{ 
            background: "white", color: "black", borderRadius: "24px", padding: "32px", border: "5px solid black", boxShadow: `15px 15px 0 ${theme.accent}`, position: "relative", overflow: "hidden" 
          }}>
            <div className="holographic-pass" />
            <div className="scan-line" style={{ background: theme.glow }} />
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "30px" }}>
              <span className="font-bangers" style={{ opacity: 0.4 }}>VELTRIX PASS</span>
              <CategoryIcon size={32} color={theme.accent} />
            </div>
            <div style={{ textAlign: "center", marginBottom: "30px" }}>
              <h2 className="font-bangers" style={{ fontSize: "1.8rem" }}>{event.title}</h2>
              <div className="font-bebas" style={{ fontSize: "0.9rem", opacity: 0.5 }}>#VX-{id.slice(0, 6).toUpperCase()}</div>
            </div>
            <div style={{ borderTop: "2px dashed #ccc", paddingTop: "20px", display: "flex", justifyContent: "space-between" }}>
              <div className="font-bebas">SEAT: {regCount + 101}</div>
              <div className="font-bebas">XP: {event.xp_reward}</div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* STICKY QUICK NAV */}
      <nav style={{ 
        position: "sticky", top: "0", background: "white", borderBottom: "4px solid black", zIndex: 100, padding: "0 60px"
      }}>
        <div style={{ maxWidth: "1400px", margin: "0 auto", display: "flex", gap: "40px" }}>
          {["OVERVIEW", "TIMELINE", "REWARDS", "FAQ"].map(tab => (
            <button key={tab} 
              onClick={() => {
                setActiveTab(tab.toLowerCase());
                document.getElementById(tab.toLowerCase())?.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }}
              style={{ 
                padding: "20px 0", border: "none", background: "none", cursor: "pointer", position: "relative",
                fontFamily: "Bebas Neue", fontSize: "1.2rem", color: activeTab === tab.toLowerCase() ? theme.accent : "black"
              }}>
              {tab}
              {activeTab === tab.toLowerCase() && <div style={{ position: "absolute", bottom: "-4px", left: 0, right: 0, height: "4px", background: theme.accent }} />}
            </button>
          ))}
        </div>
      </nav>

      {/* CONTENT GRID */}
      <main style={{ maxWidth: "1400px", margin: "0 auto", padding: "60px", display: "grid", gridTemplateColumns: "1fr 400px", gap: "60px", alignItems: "start" }}>
        
        {/* LEFT COLUMN — THE STORY */}
        <div style={{ display: "flex", flexDirection: "column", gap: "80px" }}>
          
          <section id="overview">
            <div className="sticker" style={{ background: "white", marginBottom: "24px" }}>THE CHALLENGE</div>
            <p className="font-space" style={{ fontSize: "1.3rem", lineHeight: 1.6, opacity: 0.8 }}>
              {event.description || "Mission brief is currently encrypted. Check back soon."}
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginTop: "40px" }}>
              <div className="brutal-card" style={{ padding: "30px", background: "white" }}>
                <Rocket size={32} color={theme.accent} style={{ marginBottom: "16px" }} />
                <h4 className="font-bangers">OBJECTIVE</h4>
                <p className="font-space" style={{ opacity: 0.7 }}>Master the arena and collect the maximum rewards.</p>
              </div>
              <div className="brutal-card" style={{ padding: "30px", background: "white" }}>
                <Info size={32} color={theme.secondary} style={{ marginBottom: "16px" }} />
                <h4 className="font-bangers">ELIGIBILITY</h4>
                <p className="font-space" style={{ opacity: 0.7 }}>All warriors with a valid registration number.</p>
              </div>
            </div>
          </section>

          <section id="timeline">
            <div className="sticker" style={{ background: "#00F2FF", color: "black", marginBottom: "24px" }}>PROGRESSION</div>
            <h2 className="font-bangers" style={{ fontSize: "3rem", marginBottom: "30px" }}>BATTLE PHASES</h2>
            <BattleTimeline />
          </section>

          <section id="rewards">
            <div className="brutal-card" style={{ background: "black", color: "white", padding: "60px", textAlign: "center", boxShadow: `20px 20px 0 ${theme.accent}`, border: "5px solid white" }}>
              <div style={{ background: theme.accent, width: "80px", height: "80px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 30px" }}>
                <Award size={48} color="black" />
              </div>
              <h2 className="font-bangers" style={{ fontSize: "3.5rem", color: theme.secondary }}>MISSION REWARDS</h2>
              <div style={{ display: "flex", justifyContent: "center", gap: "40px", margin: "40px 0" }}>
                <div><div className="font-bangers" style={{ fontSize: "4rem" }}>+{event.xp_reward}</div><div className="font-bebas">XP</div></div>
                <div style={{ width: "2px", background: "rgba(255,255,255,0.2)" }} />
                <div><div className="font-bangers" style={{ fontSize: "4rem" }}>1</div><div className="font-bebas">BADGE</div></div>
              </div>
              <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
                <span className="sticker" style={{ background: "white", color: "black" }}>CERTIFICATE</span>
                <span className="sticker" style={{ background: theme.accent, color: "white" }}>RANK UP</span>
              </div>
            </div>
          </section>

          <section id="faq">
             <div className="sticker" style={{ background: "var(--pink)", color: "white", marginBottom: "24px" }}>INTEL / FAQ</div>
             <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                {[
                  ["Is team registration mandatory?", "No, you can join as an individual or part of a squad."],
                  ["When will I get my XP?", "XP is automatically credited after attendance scan."],
                  ["Can I cancel my registration?", "Yes, up to 24 hours before the event commencement."]
                ].map(([q, a], i) => (
                  <div key={i} className="brutal-card" style={{ padding: "24px", background: "white" }}>
                    <div className="font-bangers" style={{ fontSize: "1.2rem", display: "flex", alignItems: "center", gap: "10px" }}>
                      <HelpCircle size={18} color={theme.accent} /> {q}
                    </div>
                    <p className="font-space" style={{ marginTop: "10px", opacity: 0.7 }}>{a}</p>
                  </div>
                ))}
             </div>
          </section>
        </div>

        {/* RIGHT COLUMN — STICKY ACTION PANEL */}
        <aside style={{ position: "sticky", top: "100px", display: "flex", flexDirection: "column", gap: "30px" }}>
          
          <div className="brutal-card" style={{ background: "white", padding: "40px", border: "5px solid black", boxShadow: "12px 12px 0 black" }}>
            {!isPast && (
              <div style={{ textAlign: "center", marginBottom: "30px" }}>
                <div className="font-bebas" style={{ opacity: 0.5, marginBottom: "10px" }}>ARENA CLOSES IN</div>
                <Countdown targetDate={event.event_date} color={theme.accent} />
              </div>
            )}

            <div style={{ marginBottom: "30px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                <span className="font-bangers">{regCount} ENROLLED</span>
                <span className="font-bebas" style={{ opacity: 0.5 }}>MAX: {event.max_seats}</span>
              </div>
              <div style={{ height: "14px", background: "#f0f0f0", border: "3px solid black", borderRadius: "8px", overflow: "hidden" }}>
                <motion.div initial={{ width: 0 }} animate={{ width: `${fillPct}%` }} style={{ height: "100%", background: fillPct > 85 ? "var(--pink)" : "var(--green)" }} />
              </div>
              <div className="font-space" style={{ fontSize: "0.85rem", marginTop: "10px", fontWeight: "bold" }}>
                {isFull ? "⚠️ ARENA FULL" : `⚡ ${event.max_seats - regCount} SPOTS LEFT`}
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {isPast ? (
                <button disabled className="btn" style={{ width: "100%", opacity: 0.5 }}>BATTLE ENDED</button>
              ) : isRegistered ? (
                <Link href={`/events/${id}/register`} className="btn" style={{ width: "100%", background: "var(--green)", color: "black" }}>VIEW PASS →</Link>
              ) : (
                <Link href={`/events/${id}/register`} className="btn" style={{ width: "100%", background: "var(--green)", color: "black", fontSize: "1.4rem" }}>REGISTER NOW</Link>
              )}
              <div style={{ display: "flex", gap: "10px" }}>
                <button onClick={toggleBookmark} className="btn" style={{ flex: 1, background: "white" }}>{isBookmarked ? <BookmarkCheck /> : <Bookmark />}</button>
                <button className="btn" style={{ flex: 1, background: "white" }}><Share2 /></button>
              </div>
            </div>

            {/* PARTICIPANTS STRIP */}
            <div style={{ marginTop: "30px", padding: "15px", background: "#f9f9f9", borderRadius: "12px", display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ display: "flex" }}>
                {participants.slice(0, 4).map((p, i) => (
                  <div key={i} style={{ width: "30px", height: "30px", borderRadius: "50%", border: "2px solid black", marginLeft: i === 0 ? 0 : "-10px", background: "white", overflow: "hidden" }}>
                    <img src={`https://api.dicebear.com/7.x/pixel-art/svg?seed=${p.id}`} alt="" />
                  </div>
                ))}
              </div>
              <span className="font-space" style={{ fontSize: "0.8rem", opacity: 0.6 }}>Join {regCount}+ others</span>
            </div>
          </div>

          <div className="brutal-card" style={{ padding: "24px", background: "white", border: "5px solid black" }}>
            <h4 className="font-bangers" style={{ marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px" }}><Flame size={18} color="var(--pink)" /> LIVE FEED</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {activities.length > 0 ? activities.map((act, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: "10px", paddingBottom: "10px", borderBottom: i === activities.length - 1 ? "none" : "1px solid #eee" }}>
                  <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--green)" }} />
                  <span className="font-space" style={{ fontSize: "0.85rem", opacity: 0.7 }}>{act}</span>
                </div>
              )) : <p className="font-space" style={{ fontSize: "0.8rem", opacity: 0.5 }}>Awaiting active signals...</p>}
            </div>
          </div>
        </aside>
      </main>

      {/* RELATED EVENTS CAROUSEL */}
      {relatedEvents.length > 0 && (
        <section style={{ padding: "80px 60px", background: "black", color: "white" }}>
          <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "end", marginBottom: "40px" }}>
              <h2 className="font-bangers" style={{ fontSize: "3rem" }}>OTHER BATTLES</h2>
              <Link href="/events" className="btn" style={{ background: "white", color: "black" }}>VIEW ALL</Link>
            </div>
            <div style={{ display: "flex", gap: "24px", overflowX: "auto", paddingBottom: "20px" }} className="no-scrollbar">
              {relatedEvents.map(ev => (
                <Link key={ev.id} href={`/events/${ev.id}`} style={{ textDecoration: "none", color: "inherit", minWidth: "300px" }}>
                  <div className="brutal-card" style={{ background: "white", color: "black", padding: "20px" }}>
                    <div style={{ height: "150px", background: "#eee", borderRadius: "12px", marginBottom: "15px", overflow: "hidden" }}>
                      {ev.banner_url ? <img src={ev.banner_url} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <div style={{ height: "100%", background: "#f0f0f0" }} />}
                    </div>
                    <h3 className="font-bangers">{ev.title}</h3>
                    <div className="font-space" style={{ opacity: 0.5, fontSize: "0.8rem", marginTop: "10px" }}>{new Date(ev.event_date).toDateString()}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* MOBILE STICKY BAR */}
      <div className="mobile-only" style={{ 
        position: "fixed", bottom: 0, left: 0, right: 0, background: "white", borderTop: "4px solid black", padding: "16px", zIndex: 1000, display: "flex", justifyContent: "space-between", alignItems: "center"
      }}>
        <div><div className="font-bangers" style={{ color: "var(--pink)" }}>+{event.xp_reward} XP</div><div className="font-bebas" style={{ fontSize: "0.8rem" }}>MISSION REWARD</div></div>
        {isRegistered ? (
          <Link href={`/events/${id}/register`} className="btn" style={{ background: "var(--green)" }}>VIEW PASS</Link>
        ) : (
          <Link href={`/events/${id}/register`} className="btn" style={{ background: "var(--green)" }}>REGISTER NOW</Link>
        )}
      </div>

      <style jsx>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        @media (max-width: 1024px) {
          main { grid-template-columns: 1fr !important; }
          aside { position: static !important; }
        }
        @media (min-width: 769px) { .mobile-only { display: none !important; } }
      `}</style>
    </div>
  );
}
