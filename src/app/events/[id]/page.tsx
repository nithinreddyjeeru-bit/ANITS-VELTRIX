"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
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
  Bot
} from "lucide-react";
import { TeamPortal } from "@/components/TeamPortal";
import { getCategoryIcon } from "@/lib/category-icons";

// ============================================================
// COMPONENTS
// ============================================================

function Countdown({ targetDate }: { targetDate: string }) {
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
    <div style={{ display: "flex", gap: "8px", justifyContent: "center", padding: "10px 0" }}>
      {[["d", "DAYS"], ["h", "HRS"], ["m", "MIN"], ["s", "SEC"]].map(([k, label]) => (
        <div key={label} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
          <motion.div 
            key={timeLeft[k as keyof typeof timeLeft]}
            initial={{ scale: 0.9, opacity: 0.8 }}
            animate={{ scale: 1, opacity: 1 }}
            style={{ 
              background: "var(--black)",
              border: "2px solid var(--green)",
              borderRadius: "8px",
              padding: "8px 4px",
              minWidth: "54px",
              boxShadow: "3px 3px 0 var(--green)"
            }}
          >
            <div className="font-bangers" style={{ fontSize: "2rem", lineHeight: 1, color: "var(--green)" }}>
              {String((timeLeft as any)[k]).padStart(2, "0")}
            </div>
          </motion.div>
          <div className="font-bebas" style={{ fontSize: "0.65rem", opacity: 0.8, letterSpacing: "1px", color: "var(--green)" }}>{label}</div>
        </div>
      ))}
    </div>
  );
}

function FloatingVisuals() {
  const items = [
    { icon: Zap, label: "LIVE", color: "var(--green)", top: "10%", left: "5%" },
    { icon: Bot, label: "ROBOTICS", color: "var(--blue)", top: "60%", left: "8%" },
    { icon: Trophy, label: "XP", color: "var(--pink)", top: "15%", right: "10%" },
    { icon: Ticket, label: "QR PASS", color: "var(--orange)", top: "70%", right: "12%" },
  ];

  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden", zIndex: 0 }}>
      {items.map((item, i) => (
        <motion.div
          key={i}
          animate={{ 
            y: [0, -20, 0],
            rotate: [i % 2 === 0 ? -5 : 5, i % 2 === 0 ? 5 : -5],
            scale: [1, 1.05, 1]
          }}
          transition={{ duration: 3 + i, repeat: Infinity, ease: "easeInOut" }}
          style={{ 
            position: "absolute",
            top: item.top,
            left: item.left,
            right: item.right,
            zIndex: 1
          }}
        >
          <div className="sticker" style={{ background: item.color, transform: "rotate(var(--r))", fontSize: "0.8rem", padding: "4px 10px", display: "flex", alignItems: "center", gap: "6px" }}>
            <item.icon size={14} /> {item.label}
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function TimelineItem({ title, date, active, last }: { title: string, date: string, active?: boolean, last?: boolean }) {
  return (
    <div style={{ display: "flex", gap: "24px", position: "relative", paddingBottom: last ? 0 : "40px" }}>
      {!last && <div className="timeline-line" style={{ background: active ? "var(--green)" : "black" }} />}
      <div className="timeline-dot" style={{ background: active ? "var(--green)" : "white" }} />
      <div style={{ flex: 1 }}>
        <h4 className="font-bebas" style={{ fontSize: "1.2rem", color: active ? "var(--black)" : "#999" }}>{title}</h4>
        <p className="font-space" style={{ fontSize: "0.9rem", opacity: 0.6 }}>{date}</p>
      </div>
    </div>
  );
}

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

  useEffect(() => {
    const init = async () => {
      const { data: ev } = await supabase.from("events").select("*").eq("id", id).maybeSingle();
      if (!ev) { setLoading(false); return; }
      setEvent(ev);

      // Get registrations with profile data
      const { data: regs, count } = await supabase
        .from("registrations")
        .select("id, created_at, profiles(id, name)")
        .eq("event_id", id)
        .order("created_at", { ascending: false });
      
      setRegCount(count || 0);
      
      if (regs) {
        const p = regs.map((r: any) => ({ name: r.profiles.name, id: r.profiles.id }));
        setParticipants(p);
        
        const act = regs.slice(0, 5).map((r: any) => `${r.profiles.name} joined the battle`);
        setActivities(act.length > 0 ? act : ["Be the first to join this mission!"]);
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        const { data: reg } = await supabase.from("registrations").select("id").eq("event_id", id).eq("user_id", user.id).maybeSingle();
        setIsRegistered(!!reg);
        const { data: bm } = await supabase.from("bookmarks").select("id").eq("event_id", id).eq("user_id", user.id).maybeSingle();
        setIsBookmarked(!!bm);
      }

      const { data: related } = await supabase.from("events").select("*")
        .eq("category", ev.category).neq("id", id).limit(4);
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

  if (loading) return (
    <div className="funk-loading">
      <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 1 }}>
        SYNCING WITH ARENA...
      </motion.div>
    </div>
  );

  if (!event) return (
    <div style={{ padding: "100px 60px", textAlign: "center" }}>
      <div className="brutal-card card-pink" style={{ display: "inline-block", padding: "60px" }}>
        <div className="font-bangers" style={{ fontSize: "4rem" }}>404: EVENT NOT FOUND</div>
        <Link href="/events" className="btn btn-black" style={{ marginTop: "24px" }}>← BACK TO ARENA</Link>
      </div>
    </div>
  );

  const isFull = regCount >= event.max_seats;
  const isPast = new Date(event.event_date) < new Date();
  const fillPct = Math.min((regCount / event.max_seats) * 100, 100);
  const theme = CAT_THEMES[event.category] || CAT_THEMES.General;
  const CategoryIcon = getCategoryIcon(event.category);

  return (
    <div className="event-detail-page" style={{ position: "relative", background: "#f8f8f8" }}>
      <div className="dynamic-bg" style={{ opacity: 0.3 }} />
      
      {/* HERO SECTION */}
      <section style={{ 
        padding: "100px 60px 140px", 
        background: theme.hero, 
        color: "white", 
        position: "relative",
        borderBottom: "8px solid var(--black)",
        overflow: "hidden"
      }}>
        <FloatingVisuals />
        
        <div style={{ maxWidth: "1400px", margin: "0 auto", display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: "80px", alignItems: "center", position: "relative", zIndex: 5 }}>
          <div>
             <Link href="/events" style={{ display: "inline-flex", alignItems: "center", gap: "8px", textDecoration: "none", color: theme.accent, marginBottom: "40px" }} className="font-bebas">
              <ArrowLeft size={20} /> BACK TO LISTING
            </Link>
            
            <div style={{ display: "flex", gap: "12px", marginBottom: "32px" }}>
               <motion.span animate={{ scale: [1, 1.05, 1] }} transition={{ repeat: Infinity, duration: 2 }} className="sticker sticker-pink" style={{ fontSize: "1rem", boxShadow: "4px 4px 0 #000" }}>🔥 HOT EVENT</motion.span>
               <span className="sticker" style={{ background: theme.secondary, color: "black", fontSize: "1rem", boxShadow: "4px 4px 0 #000" }}>✨ XP BOOST</span>
            </div>

            <h1 className="font-bangers" style={{ 
              fontSize: "clamp(3.5rem, 8vw, 7.5rem)", 
              lineHeight: 0.8, 
              textTransform: "uppercase", 
              color: "#fff",
              textShadow: `6px 6px 0 ${theme.accent}, 12px 12px 0 #000`
            }}>
              {event.title}
            </h1>

            <div className="event-detail-meta" style={{ marginTop: "48px", display: "flex", gap: "40px", opacity: 0.9 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}><Calendar size={28} color={theme.secondary} /> <span className="font-space" style={{ fontSize: "1.1rem" }}>{new Date(event.event_date).toLocaleDateString("en-IN", { day: 'numeric', month: 'long', year: 'numeric' })}</span></div>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}><MapPin size={28} color={theme.secondary} /> <span className="font-space" style={{ fontSize: "1.1rem" }}>{event.venue || "Campus Arena"}</span></div>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", color: "#00FF9D" }} className="glow-xp"><Zap size={28} fill="currentColor" /> <span className="font-bangers" style={{ fontSize: "1.8rem" }}>+{event.xp_reward} XP</span></div>
            </div>
          </div>

          {/* PREMIUM EVENT PASS */}
          <div style={{ perspective: "1200px" }}>
            <motion.div 
              whileHover={{ rotateY: 12, rotateX: -8, scale: 1.02 }}
              style={{ 
                background: "white",
                color: "black",
                borderRadius: "32px",
                padding: "48px",
                border: "6px solid black",
                boxShadow: `24px 24px 0 ${theme.accent}`,
                position: "relative",
                overflow: "hidden"
              }}
            >
              <div className="holographic-pass" />
              <div className="scan-line" style={{ background: theme.glow, boxShadow: `0 0 15px ${theme.accent}` }} />
              
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "40px" }}>
                <span className="font-bangers" style={{ fontSize: "1.8rem", letterSpacing: "2px" }}>VELTRIX ARENA</span>
                <div style={{ background: "var(--black)", color: "white", padding: "6px 16px", borderRadius: "10px", fontFamily: "Bebas Neue", fontSize: "1rem" }}>LEGENDARY PASS</div>
              </div>

              <div style={{ textAlign: "center", marginBottom: "40px" }}>
                 <div style={{ 
                   width: "140px", 
                   height: "140px", 
                   background: "#f0f0f0", 
                   border: "4px solid black", 
                   borderRadius: "24px", 
                   margin: "0 auto 20px", 
                   display: "flex", 
                   alignItems: "center", 
                   justifyContent: "center",
                   boxShadow: "6px 6px 0 black"
                 }}>
                    <CategoryIcon size={80} color={theme.accent} />
                 </div>
                 <h2 className="font-bangers" style={{ fontSize: "2.4rem", marginBottom: "8px" }}>{event.title}</h2>
                 <p className="font-space" style={{ opacity: 0.6, fontSize: "0.9rem" }}>SECURED MISSION ACCESS · QR ENCRYPTED</p>
              </div>

              <div style={{ borderTop: "4px dashed #ddd", paddingTop: "32px", display: "flex", justifyContent: "space-between" }}>
                 <div>
                    <div className="font-bebas" style={{ opacity: 0.5, fontSize: "1rem" }}>SEAT ALLOCATION</div>
                    <div className="font-bangers" style={{ fontSize: "1.6rem" }}>#{regCount + 101}</div>
                 </div>
                 <div style={{ textAlign: "right" }}>
                    <div className="font-bebas" style={{ opacity: 0.5, fontSize: "1rem" }}>MISSION ID</div>
                    <div className="font-bangers" style={{ fontSize: "1.6rem" }}>VX-{event.id.slice(0, 5).toUpperCase()}</div>
                 </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* QUICK STATS BAND */}
      <section style={{ background: theme.secondary, borderBottom: "6px solid black", padding: "30px 60px" }}>
         <div style={{ maxWidth: "1400px", margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
               <Users size={40} />
               <div>
                  <div className="font-bangers" style={{ fontSize: "1.8rem" }}>{regCount} WARRIORS JOINED</div>
                  <div className="font-space" style={{ fontSize: "0.9rem", fontWeight: "bold" }}>{event.max_seats - regCount} slots remaining in the arena</div>
               </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
               <TrendingUp size={40} />
               <div className="font-bangers" style={{ fontSize: "1.8rem" }}>TRENDING IN {event.category.toUpperCase()}</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
               <Target size={40} />
               <div className="font-bangers" style={{ fontSize: "1.8rem" }}>MISSION XP: +{event.xp_reward}</div>
            </div>
         </div>
      </section>

      {/* MAIN GRID */}
      <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "100px 60px", display: "grid", gridTemplateColumns: "1.15fr 0.85fr", gap: "80px" }}>
        
        {/* LEFT COLUMN */}
        <div style={{ display: "flex", flexDirection: "column", gap: "80px" }}>
          
          {/* OVERVIEW SECTION */}
          <section>
            <div className="sticker" style={{ background: "white", marginBottom: "32px", fontSize: "1.2rem" }}>MISSION BRIEFING</div>
            <h2 className="font-bangers" style={{ fontSize: "4rem", marginBottom: "40px" }}>THE CHALLENGE</h2>
            
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "32px", marginBottom: "48px" }}>
               <div className="brutal-card" style={{ padding: "32px", background: "white", boxShadow: "8px 8px 0 black" }}>
                  <Rocket size={32} color="#bc00ff" style={{ marginBottom: "16px" }} />
                  <h4 className="font-bebas" style={{ fontSize: "1.8rem" }}>OBJECTIVE</h4>
                  <p className="font-space" style={{ fontSize: "1rem", lineHeight: 1.5, opacity: 0.8 }}>Complete all tasks within the given timeline to achieve absolute victory.</p>
               </div>
               <div className="brutal-card" style={{ padding: "32px", background: "white", boxShadow: "8px 8px 0 black" }}>
                  <Flame size={32} color="#FFD700" style={{ marginBottom: "16px" }} />
                  <h4 className="font-bebas" style={{ fontSize: "1.8rem" }}>REQUIREMENTS</h4>
                  <p className="font-space" style={{ fontSize: "1rem", lineHeight: 1.5, opacity: 0.8 }}>Bring your laptop, basic knowledge, and zero distractions.</p>
               </div>
            </div>

            <p className="font-space" style={{ fontSize: "1.3rem", lineHeight: 1.7, opacity: 0.9 }}>
              {event.description || "Mission details are currently classified. Stay tuned for the full reveal."}
            </p>
          </section>

          {/* TIMELINE SECTION */}
          <section>
            <div className="sticker" style={{ background: "#00F2FF", color: "black", marginBottom: "32px", fontSize: "1.2rem" }}>BATTLE TIMELINE</div>
            <h2 className="font-bangers" style={{ fontSize: "4rem", marginBottom: "48px" }}>MISSION PHASES</h2>
            <div style={{ paddingLeft: "20px" }}>
              <TimelineItem title="Registration Phase" date="Now Open" active />
              <TimelineItem title="Strategy & Team Formation" date="2 days before launch" active />
              <TimelineItem title="Mission Commencement" date={new Date(event.event_date).toDateString()} />
              <TimelineItem title="Debrief & XP Distribution" date="Post-event immediate" />
              <TimelineItem title="Victory Certificates" date="24h after completion" last />
            </div>
          </section>

          {/* REWARDS SECTION */}
          <section>
             <div className="brutal-card" style={{ 
               background: "var(--black)", 
               color: "white", 
               padding: "64px", 
               textAlign: "center", 
               boxShadow: `20px 20px 0 ${theme.accent}`,
               border: "6px solid white" 
             }}>
                <div style={{ 
                  background: theme.secondary, 
                  width: "100px", 
                  height: "100px", 
                  borderRadius: "50%", 
                  border: "5px solid white", 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "center", 
                  margin: "-10px auto 32px", 
                  color: "black",
                  boxShadow: `0 0 20px ${theme.glow}`
                }}>
                   <Award size={56} />
                </div>
                <h2 className="font-bangers" style={{ fontSize: "4rem", color: theme.secondary, textShadow: "4px 4px 0 #000" }}>MISSION REWARDS</h2>
                <div style={{ display: "flex", justifyContent: "center", gap: "60px", margin: "48px 0" }}>
                   <div>
                      <div className="font-bangers" style={{ fontSize: "4.5rem", color: "#00FF9D" }}>+{event.xp_reward}</div>
                      <div className="font-bebas" style={{ opacity: 0.7, fontSize: "1.2rem" }}>TOTAL XP</div>
                   </div>
                   <div style={{ width: "3px", background: "white", opacity: 0.1 }} />
                   <div>
                      <div className="font-bangers" style={{ fontSize: "4.5rem", color: theme.accent }}>1</div>
                      <div className="font-bebas" style={{ opacity: 0.7, fontSize: "1.2rem" }}>ACHIEVEMENT</div>
                   </div>
                </div>
                <div style={{ display: "flex", gap: "20px", justifyContent: "center" }}>
                   <div className="sticker" style={{ background: "white", color: "black", transform: "rotate(-2deg)", padding: "10px 20px" }}>📜 MASTER CERTIFICATE</div>
                   <div className="sticker" style={{ background: theme.accent, color: "white", transform: "rotate(3deg)", padding: "10px 20px" }}>⚡ ARENA RANK-UP</div>
                </div>
             </div>
          </section>
        </div>

        {/* RIGHT COLUMN */}
        <div style={{ display: "flex", flexDirection: "column", gap: "60px" }}>
           
          {/* REGISTRATION PANEL */}
          <div className="brutal-card" style={{ 
            background: "white", 
            padding: "48px", 
            position: "sticky", 
            top: "120px",
            border: "6px solid black",
            boxShadow: "15px 15px 0 black"
          }}>
            {!isPast && (
               <div style={{ marginBottom: "40px", textAlign: "center" }}>
                  <div className="font-bebas" style={{ letterSpacing: "3px", opacity: 0.5, marginBottom: "12px", fontSize: "1.1rem" }}>ARENA DOORS CLOSE IN</div>
                  <Countdown targetDate={event.event_date} />
               </div>
            )}

            <div style={{ marginBottom: "40px" }}>
               <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
                  <span className="font-bangers" style={{ fontSize: "1.3rem" }}>{regCount} ENROLLED</span>
                  <span className="font-bebas" style={{ opacity: 0.5, fontSize: "1.1rem" }}>LIMIT: {event.max_seats}</span>
               </div>
               <div style={{ height: "18px", background: "#f0f0f0", border: "3px solid black", borderRadius: "10px", overflow: "hidden" }}>
                  <motion.div initial={{ width: 0 }} animate={{ width: `${fillPct}%` }} style={{ height: "100%", background: fillPct > 85 ? "#bc00ff" : "#00FF9D" }} />
               </div>
               <div className="font-space" style={{ fontSize: "1rem", marginTop: "16px", color: fillPct > 85 ? "#bc00ff" : "black", fontWeight: "bold" }}>
                  {isFull ? "⚠️ Arena is completely full!" : `⚡ Only ${event.max_seats - regCount} slots left!`}
               </div>
            </div>

            {/* AVATARS OF PARTICIPANTS (REAL DATA) */}
            <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "40px", padding: "20px", background: "#f9f9f9", border: "2px solid #eee", borderRadius: "16px" }}>
               <div style={{ display: "flex", marginRight: "12px" }}>
                  {participants.slice(0, 5).map((p, i) => (
                    <div key={p.id} style={{ 
                      width: "40px", 
                      height: "40px", 
                      borderRadius: "50%", 
                      border: "3px solid black", 
                      marginLeft: i === 0 ? 0 : "-15px", 
                      background: "white", 
                      overflow: "hidden",
                      zIndex: 5 - i
                    }}>
                       <img src={`https://api.dicebear.com/7.x/pixel-art/svg?seed=${p.id}`} alt={p.name} />
                    </div>
                  ))}
               </div>
               <div className="font-space" style={{ fontSize: "0.9rem", opacity: 0.7, lineHeight: 1.3 }}>
                  {participants.length > 0 ? (
                    <><b>{participants[0].name}</b> and {participants.length - 1}+ others joined</>
                  ) : (
                    <>Be the first to join!</>
                  )}
               </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {isPast ? (
                <button disabled className="btn" style={{ width: "100%", background: "#ddd", color: "#888", border: "3px solid #ccc" }}>BATTLE COMPLETED</button>
              ) : isRegistered ? (
                <Link href={`/events/${id}/register`} className="btn" style={{ width: "100%", background: "#00FF9D", color: "black" }}>
                  ✓ IN THE ARENA (VIEW PASS)
                </Link>
              ) : isFull ? (
                <button disabled className="btn" style={{ width: "100%", background: "#f0f0f0", color: "#bbb" }}>ARENA FULL</button>
              ) : !userId ? (
                <Link href="/auth" className="btn" style={{ width: "100%", background: "#bc00ff", color: "white" }}>LOGIN TO ENTER ARENA</Link>
              ) : (
                <Link href={`/events/${id}/register`} className="btn" style={{ width: "100%", background: "#00FF9D", color: "black", fontSize: "1.6rem" }}>
                  ENTER ARENA ⚡
                </Link>
              )}
              
              <div style={{ display: "flex", gap: "16px" }}>
                <button onClick={toggleBookmark} className="btn" style={{ flex: 1, background: "white", padding: "12px" }}>
                  {isBookmarked ? <BookmarkCheck color="#bc00ff" /> : <Bookmark />} {isBookmarked ? "SAVED" : "SAVE"}
                </button>
                <button onClick={() => navigator.share?.({ title: event.title, url: window.location.href })} className="btn" style={{ flex: 1, background: "white", padding: "12px" }}>
                  <Share2 /> SHARE
                </button>
              </div>
            </div>
          </div>

          {/* LIVE ACTIVITY (REAL DATA) */}
          <div className="brutal-card" style={{ padding: "32px", background: "white", border: "5px solid black" }}>
             <h4 className="font-bangers" style={{ fontSize: "1.6rem", marginBottom: "28px", display: "flex", alignItems: "center", gap: "12px" }}>
                <Flame size={24} color="#bc00ff" /> REAL-TIME ACTIVITY
             </h4>
             <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                {activities.map((act, i) => (
                  <div key={i} style={{ 
                    display: "flex", 
                    alignItems: "center", 
                    gap: "14px", 
                    borderBottom: i === activities.length - 1 ? "none" : "2px solid #f0f0f0", 
                    paddingBottom: "16px" 
                  }}>
                    <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#00FF9D", boxShadow: "0 0 10px #00FF9D" }} />
                    <span className="font-space" style={{ fontSize: "0.95rem", opacity: 0.8 }}>{act}</span>
                  </div>
                ))}
             </div>
          </div>

          {/* TEAM PORTAL */}
          {event.is_team_event && (
             <TeamPortal eventId={id} maxSize={event.team_size || 4} isRegistered={isRegistered} />
          )}

        </div>
      </div>


      {/* SIMILAR EVENTS SECTION */}
      {relatedEvents.length > 0 && (
        <section style={{ padding: "80px 60px", background: "var(--black)", color: "white" }}>
           <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "end", marginBottom: "48px" }}>
                 <div>
                    <div className="sticker sticker-pink" style={{ marginBottom: "16px" }}>MORE ADVENTURES</div>
                    <h2 className="font-bangers" style={{ fontSize: "3.5rem" }}>YOU MAY ALSO LIKE</h2>
                 </div>
                 <Link href="/events" className="btn" style={{ background: "white", color: "black" }}>VIEW ALL BATTLES <ChevronRight /></Link>
              </div>

              <div style={{ display: "flex", gap: "32px", overflowX: "auto", paddingBottom: "20px" }}>
                 {relatedEvents.map(ev => (
                   <Link key={ev.id} href={`/events/${ev.id}`} style={{ textDecoration: "none", color: "inherit", minWidth: "320px" }}>
                      <div className="brutal-card" style={{ background: "white", color: "black", padding: "20px", height: "100%" }}>
                         <div style={{ height: "160px", background: "#eee", borderRadius: "12px", marginBottom: "16px", overflow: "hidden" }}>
                            {ev.banner_url ? <img src={ev.banner_url} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", opacity: 0.1 }}><CategoryIcon size={48} /></div>}
                         </div>
                         <h3 className="font-bangers" style={{ fontSize: "1.5rem" }}>{ev.title}</h3>
                         <div style={{ display: "flex", justifyContent: "space-between", marginTop: "12px" }}>
                            <span className="font-space" style={{ fontSize: "0.85rem", opacity: 0.6 }}>{new Date(ev.event_date).toDateString()}</span>
                            <span className="font-bangers" style={{ color: "var(--pink)" }}>+{ev.xp_reward} XP</span>
                         </div>
                      </div>
                   </Link>
                 ))}
              </div>
           </div>
        </section>
      )}

      {/* MOBILE STICKY CTA */}
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, padding: "16px", background: "rgba(255,255,255,0.9)", backdropFilter: "blur(10px)", borderTop: "3px solid black", zIndex: 1000, display: "flex", gap: "12px" }} className="mobile-only">
         <button className="btn" style={{ flex: 1, background: "white" }}><Bookmark /></button>
         {isRegistered ? (
           <Link href={`/events/${id}/register`} className="btn btn-green" style={{ flex: 4 }}>VIEW PASS</Link>
         ) : (
           <Link href={`/events/${id}/register`} className="btn btn-green" style={{ flex: 4 }}>REGISTER NOW</Link>
         )}
      </div>

      <style jsx>{`
        .event-detail-page {
          background: var(--cream);
          min-height: 100vh;
        }
        @media (min-width: 769px) {
          .mobile-only { display: none; }
        }
        @media (max-width: 768px) {
          .mobile-only { display: flex; }
        }
      `}</style>
    </div>
  );
}
