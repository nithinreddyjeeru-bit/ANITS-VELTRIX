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

const CAT_COLORS: Record<string, string> = {
  Tech: "var(--blue)",
  Robotics: "var(--orange)",
  Design: "var(--pink)",
  Cultural: "var(--purple)",
  Sports: "var(--green)",
  Workshop: "var(--blue)",
  General: "var(--green)",
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

  // Mock participants
  const mockAvatars = ["/avatar1.png", "/avatar2.png", "/avatar3.png", "/avatar4.png", "/avatar5.png"];

  useEffect(() => {
    const init = async () => {
      const { data: ev } = await supabase.from("events").select("*").eq("id", id).maybeSingle();
      if (!ev) { setLoading(false); return; }
      setEvent(ev);

      const { count } = await supabase.from("registrations").select("*", { count: "exact", head: true }).eq("event_id", id);
      setRegCount(count || 0);

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
      
      setActivities([
        "Rahul (CSE) joined this battle",
        "Team 'Cyber Hawks' registered",
        "Anjali (ECE) bookmarked this",
        "AIML squad confirmed registration"
      ]);

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
  const categoryColor = CAT_COLORS[event.category] || "var(--green)";
  const CategoryIcon = getCategoryIcon(event.category);

  return (
    <div className="event-detail-page" style={{ position: "relative" }}>
      <div className="dynamic-bg" />
      
      {/* HERO SECTION */}
      <section style={{ 
        padding: "80px 60px 120px", 
        background: "var(--black)", 
        color: "white", 
        position: "relative",
        borderBottom: "6px solid var(--black)",
        overflow: "hidden"
      }}>
        <FloatingVisuals />
        
        <div style={{ maxWidth: "1400px", margin: "0 auto", display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: "60px", alignItems: "center", position: "relative", zIndex: 5 }}>
          <div>
             <Link href="/events" style={{ display: "inline-flex", alignItems: "center", gap: "8px", textDecoration: "none", color: "var(--green)", marginBottom: "32px" }} className="font-bebas">
              <ArrowLeft size={18} /> BACK TO LISTING
            </Link>
            
            <div style={{ display: "flex", gap: "12px", marginBottom: "24px" }}>
               <motion.span animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 2 }} className="sticker sticker-pink" style={{ fontSize: "0.9rem" }}>🔥 HOT EVENT</motion.span>
               <span className="sticker" style={{ background: "var(--blue)", color: "white", fontSize: "0.9rem" }}>✨ XP BOOST</span>
            </div>

            <h1 className="font-bangers" style={{ fontSize: "clamp(3rem, 7vw, 6.5rem)", lineHeight: 0.85, textTransform: "uppercase", textShadow: "8px 8px 0 var(--pink)" }}>
              {event.title}
            </h1>

            <div className="event-detail-meta" style={{ marginTop: "40px", display: "flex", gap: "32px", opacity: 0.8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}><Calendar size={24} /> <span className="font-space">{new Date(event.event_date).toLocaleDateString("en-IN", { day: 'numeric', month: 'long' })}</span></div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}><MapPin size={24} /> <span className="font-space">{event.venue || "Campus Arena"}</span></div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "var(--green)" }} className="glow-xp"><Zap size={24} fill="currentColor" /> <span className="font-bangers" style={{ fontSize: "1.5rem" }}>+{event.xp_reward} XP</span></div>
            </div>
          </div>

          {/* PREMIUM EVENT PASS */}
          <div style={{ perspective: "1000px" }}>
            <motion.div 
              whileHover={{ rotateY: 10, rotateX: -10 }}
              style={{ 
                background: "white",
                color: "black",
                borderRadius: "24px",
                padding: "40px",
                border: "4px solid black",
                boxShadow: "20px 20px 0 var(--pink)",
                position: "relative",
                overflow: "hidden"
              }}
            >
              <div className="holographic-pass" />
              <div className="scan-line" />
              
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "40px" }}>
                <span className="font-bangers" style={{ fontSize: "1.5rem", letterSpacing: "2px" }}>VELTRIX ARENA</span>
                <div style={{ background: "var(--black)", color: "white", padding: "4px 12px", borderRadius: "8px", fontFamily: "Bebas Neue" }}>LEGENDARY PASS</div>
              </div>

              <div style={{ textAlign: "center", marginBottom: "40px" }}>
                 <div style={{ width: "120px", height: "120px", background: "var(--cream)", border: "3px solid black", borderRadius: "16px", margin: "0 auto 16px", display: "flex", alignItems: "center", justifyContent: "center", opacity: 0.1 }}>
                    <CategoryIcon size={64} />
                 </div>
                 <h2 className="font-bangers" style={{ fontSize: "2rem" }}>{event.title}</h2>
                 <p className="font-space" style={{ opacity: 0.6 }}>VALID FOR 1 ENTRY · QR REQUIRED</p>
              </div>

              <div style={{ borderTop: "3px dashed #ddd", paddingTop: "24px", display: "flex", justifyContent: "space-between" }}>
                 <div>
                    <div className="font-bebas" style={{ opacity: 0.5 }}>SEAT NO.</div>
                    <div className="font-bangers" style={{ fontSize: "1.2rem" }}>{regCount + 101}</div>
                 </div>
                 <div style={{ textAlign: "right" }}>
                    <div className="font-bebas" style={{ opacity: 0.5 }}>ARENA REG.</div>
                    <div className="font-bangers" style={{ fontSize: "1.2rem" }}>#VX-{event.id.slice(0, 5).toUpperCase()}</div>
                 </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* QUICK STATS BAND */}
      <section style={{ background: "var(--green)", borderBottom: "4px solid black", padding: "24px 60px" }}>
         <div style={{ maxWidth: "1400px", margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
               <Users size={32} />
               <div>
                  <div className="font-bangers" style={{ fontSize: "1.4rem" }}>{regCount} WARRIORS JOINED</div>
                  <div className="font-space" style={{ fontSize: "0.8rem" }}>{event.max_seats - regCount} slots remaining in the arena</div>
               </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
               <TrendingUp size={32} />
               <div className="font-bangers" style={{ fontSize: "1.4rem" }}>TRENDING IN {event.category.toUpperCase()}</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
               <Target size={32} />
               <div className="font-bangers" style={{ fontSize: "1.4rem" }}>GOAL: +{event.xp_reward} XP</div>
            </div>
         </div>
      </section>

      {/* MAIN GRID */}
      <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "80px 60px", display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: "60px" }}>
        
        {/* LEFT COLUMN */}
        <div style={{ display: "flex", flexDirection: "column", gap: "60px" }}>
          
          {/* OVERVIEW SECTION */}
          <section>
            <div className="sticker" style={{ background: "white", marginBottom: "24px" }}>MISSION BRIEFING</div>
            <h2 className="font-bangers" style={{ fontSize: "3rem", marginBottom: "32px" }}>THE CHALLENGE</h2>
            
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "32px" }}>
               <div className="brutal-card" style={{ padding: "24px", background: "white" }}>
                  <Rocket size={24} style={{ marginBottom: "12px" }} />
                  <h4 className="font-bebas" style={{ fontSize: "1.4rem" }}>MISSION</h4>
                  <p className="font-space" style={{ fontSize: "0.95rem", opacity: 0.7 }}>Complete all tasks within the given timeline to achieve victory.</p>
               </div>
               <div className="brutal-card" style={{ padding: "24px", background: "white" }}>
                  <Flame size={24} style={{ marginBottom: "12px" }} />
                  <h4 className="font-bebas" style={{ fontSize: "1.4rem" }}>REQUIREMENTS</h4>
                  <p className="font-space" style={{ fontSize: "0.95rem", opacity: 0.7 }}>Bring your laptop, basic knowledge, and absolute focus.</p>
               </div>
            </div>

            <p className="font-space" style={{ fontSize: "1.15rem", lineHeight: 1.6, opacity: 0.8 }}>
              {event.description || "Mission details are currently classified. Stay tuned for the full reveal."}
            </p>
          </section>

          {/* TIMELINE SECTION */}
          <section>
            <div className="sticker sticker-blue" style={{ marginBottom: "24px" }}>BATTLE TIMELINE</div>
            <h2 className="font-bangers" style={{ fontSize: "3rem", marginBottom: "40px" }}>MISSION PHASES</h2>
            <div style={{ paddingLeft: "10px" }}>
              <TimelineItem title="Registration Opens" date="Active Now" active />
              <TimelineItem title="Team Formation Deadline" date="2 days before event" active />
              <TimelineItem title="Main Event / Battle Day" date={new Date(event.event_date).toDateString()} />
              <TimelineItem title="Results & XP Payout" date="Immediately after completion" />
              <TimelineItem title="Certificates Issued" date="Within 24 hours" last />
            </div>
          </section>

          {/* REWARDS SECTION */}
          <section>
             <div className="brutal-card" style={{ background: "var(--black)", color: "white", padding: "48px", textAlign: "center", boxShadow: "15px 15px 0 var(--green)" }}>
                <div style={{ background: "var(--green)", width: "80px", height: "80px", borderRadius: "50%", border: "4px solid white", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px", color: "black" }}>
                   <Award size={48} />
                </div>
                <h2 className="font-bangers" style={{ fontSize: "3rem", color: "var(--green)" }}>MISSION REWARDS</h2>
                <div style={{ display: "flex", justifyContent: "center", gap: "40px", margin: "40px 0" }}>
                   <div>
                      <div className="font-bangers" style={{ fontSize: "3.5rem" }}>+{event.xp_reward}</div>
                      <div className="font-bebas" style={{ opacity: 0.6 }}>TOTAL XP</div>
                   </div>
                   <div style={{ width: "2px", background: "white", opacity: 0.2 }} />
                   <div>
                      <div className="font-bangers" style={{ fontSize: "3.5rem" }}>1</div>
                      <div className="font-bebas" style={{ opacity: 0.6 }}>BADGE</div>
                   </div>
                </div>
                <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
                   <div className="sticker" style={{ background: "white", color: "black", transform: "rotate(-2deg)" }}>✨ MASTER CERTIFICATE</div>
                   <div className="sticker" style={{ background: "var(--blue)", color: "white", transform: "rotate(3deg)" }}>🏆 RANK BOOST</div>
                </div>
             </div>
          </section>
        </div>

        {/* RIGHT COLUMN */}
        <div style={{ display: "flex", flexDirection: "column", gap: "40px" }}>
           
          {/* REGISTRATION PANEL */}
          <div className="brutal-card" style={{ background: "white", padding: "40px", position: "sticky", top: "120px" }}>
            {!isPast && (
               <div style={{ marginBottom: "32px", textAlign: "center" }}>
                  <div className="font-bebas" style={{ letterSpacing: "2px", opacity: 0.6, marginBottom: "8px" }}>ARENA DOORS CLOSE IN</div>
                  <Countdown targetDate={event.event_date} />
               </div>
            )}

            <div style={{ marginBottom: "32px" }}>
               <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                  <span className="font-bebas" style={{ fontSize: "1.1rem" }}>{regCount} WARRIORS ENROLLED</span>
                  <span className="font-bebas" style={{ opacity: 0.5 }}>{event.max_seats} MAX</span>
               </div>
               <div style={{ height: "12px", background: "#eee", border: "2px solid black", borderRadius: "6px", overflow: "hidden" }}>
                  <motion.div initial={{ width: 0 }} animate={{ width: `${fillPct}%` }} style={{ height: "100%", background: fillPct > 85 ? "var(--pink)" : "var(--green)" }} />
               </div>
               <div className="font-space" style={{ fontSize: "0.85rem", marginTop: "12px", color: "var(--pink)", fontWeight: "bold" }}>
                  ⚠️ Only {event.max_seats - regCount} spots left!
               </div>
            </div>

            {/* AVATARS OF PARTICIPANTS */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "32px", padding: "16px", background: "var(--cream)", borderRadius: "12px" }}>
               <div style={{ display: "flex", marginRight: "8px" }}>
                  {mockAvatars.map((src, i) => (
                    <div key={i} style={{ width: "32px", height: "32px", borderRadius: "50%", border: "2px solid black", marginLeft: i === 0 ? 0 : "-12px", background: "white", overflow: "hidden" }}>
                       <img src={`https://api.dicebear.com/7.x/pixel-art/svg?seed=${i}`} alt="user" />
                    </div>
                  ))}
               </div>
               <span className="font-space" style={{ fontSize: "0.85rem", opacity: 0.7 }}>Join Rahul, Anjali & others</span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {isPast ? (
                <button disabled className="btn" style={{ width: "100%", background: "#ccc", cursor: "not-allowed" }}>BATTLE COMPLETED</button>
              ) : isRegistered ? (
                <Link href={`/events/${id}/register`} className="btn btn-green" style={{ width: "100%" }}>
                  ✓ IN THE ARENA (VIEW PASS)
                </Link>
              ) : isFull ? (
                <button disabled className="btn" style={{ width: "100%", background: "#eee", cursor: "not-allowed" }}>ARENA FULL</button>
              ) : !userId ? (
                <Link href="/auth" className="btn btn-pink" style={{ width: "100%" }}>LOGIN TO ENTER ARENA</Link>
              ) : (
                <Link href={`/events/${id}/register`} className="btn btn-green" style={{ width: "100%", fontSize: "1.4rem" }}>
                  ENTER THE ARENA ⚡
                </Link>
              )}
              
              <div style={{ display: "flex", gap: "12px" }}>
                <button onClick={toggleBookmark} className="btn" style={{ flex: 1, background: "white" }}>
                  {isBookmarked ? <BookmarkCheck /> : <Bookmark />} {isBookmarked ? "SAVED" : "SAVE"}
                </button>
                <button className="btn" style={{ flex: 1, background: "white" }}>
                  <Share2 /> SHARE
                </button>
              </div>
            </div>
          </div>

          {/* LIVE ACTIVITY */}
          <div className="brutal-card" style={{ padding: "24px", background: "white" }}>
             <h4 className="font-bangers" style={{ fontSize: "1.3rem", marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px" }}>
                <Flame size={18} color="var(--pink)" /> LIVE ACTIVITY
             </h4>
             <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {activities.map((act, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "start", gap: "12px", borderBottom: i === activities.length - 1 ? "none" : "1px solid #eee", paddingBottom: "12px" }}>
                    <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--green)", marginTop: "6px" }} />
                    <span className="font-space" style={{ fontSize: "0.85rem", opacity: 0.7 }}>{act}</span>
                  </div>
                ))}
             </div>
          </div>

          {/* TEAM PORTAL (Optional) */}
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
