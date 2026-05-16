"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { Event } from "@/lib/types";
import { Calendar, MapPin, Users, Zap, ArrowLeft, Bookmark, BookmarkCheck, Share2, Clock3, Trophy, Ticket, ShieldCheck, Tags, UserPlus } from "lucide-react";
import { TeamPortal } from "@/components/TeamPortal";
import { getCategoryIcon } from "@/lib/category-icons";

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
    <div style={{ display: "flex", gap: "12px", justifyContent: "center", marginTop: "20px" }}>
      {[["d", "DAYS"], ["h", "HRS"], ["m", "MIN"], ["s", "SEC"]].map(([k, label]) => (
        <div key={label} style={{ textAlign: "center" }}>
          <div className="font-bangers" style={{ fontSize: "3rem", lineHeight: 1, color: "var(--green)" }}>
            {String((timeLeft as any)[k]).padStart(2, "0")}
          </div>
          <div className="font-bebas" style={{ fontSize: "0.8rem", opacity: 0.6, letterSpacing: "2px" }}>{label}</div>
        </div>
      ))}
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

function formatEventDate(date: string, options?: Intl.DateTimeFormatOptions) {
  return new Date(date).toLocaleDateString("en-IN", options ?? { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

function formatEventTime(date: string) {
  return new Date(date).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
}

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

  useEffect(() => {
    const init = async () => {
      // Get event
      const { data: ev } = await supabase.from("events").select("*").eq("id", id).single();
      setEvent(ev);

      // Get registration count
      const { count } = await supabase.from("registrations").select("*", { count: "exact", head: true }).eq("event_id", id);
      setRegCount(count || 0);

      // Auth
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        const { data: reg } = await supabase.from("registrations").select("id").eq("event_id", id).eq("user_id", user.id).single();
        setIsRegistered(!!reg);
        const { data: bm } = await supabase.from("bookmarks").select("id").eq("event_id", id).eq("user_id", user.id).single();
        setIsBookmarked(!!bm);
      }

      // Related events
      if (ev) {
        const { data: related } = await supabase.from("events").select("*")
          .eq("category", ev.category).neq("id", id).limit(3);
        setRelatedEvents(related || []);
      }
      setLoading(false);
    };
    if (id) init();
  }, [id]);

  // Realtime reg count
  useEffect(() => {
    if (!id) return;
    const ch = (supabase.channel(`reg-count-${id}`) as any)
      .on("postgres_changes", { event: "*", schema: "public", table: "registrations", filter: `event_id=eq.${id}` },
        () => supabase.from("registrations").select("*", { count: "exact", head: true }).eq("event_id", id).then(({ count }) => setRegCount(count || 0)))
      .subscribe();
    return () => { supabase.removeChannel(ch).catch(console.error); };
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
    <div style={{ padding: "60px", display: "flex", justifyContent: "center" }}>
      <motion.div className="font-bangers" style={{ fontSize: "3rem" }}
        animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1.5 }}>
        LOADING EVENT...
      </motion.div>
    </div>
  );

  if (!event) return (
    <div style={{ padding: "60px", textAlign: "center" }}>
      <div className="brutal-card card-pink" style={{ display: "inline-block", padding: "60px" }}>
        <div className="font-bangers" style={{ fontSize: "4rem" }}>EVENT NOT FOUND</div>
        <Link href="/events" className="btn btn-black" style={{ marginTop: "24px" }}>← BACK TO ARENA</Link>
      </div>
    </div>
  );

  const isFull = regCount >= event.max_seats;
  const isPast = new Date(event.event_date) < new Date();
  const fillPct = Math.min((regCount / event.max_seats) * 100, 100);
  const spotsLeft = Math.max(event.max_seats - regCount, 0);
  const categoryColor = CAT_COLORS[event.category] || "var(--green)";
  const CategoryIcon = getCategoryIcon(event.category);
  const endLabel = event.end_date ? formatEventTime(event.end_date) : "Until completion";
  const detailStats = [
    { icon: Calendar, label: "Date", value: formatEventDate(event.event_date, { day: "numeric", month: "long", year: "numeric" }) },
    { icon: Clock3, label: "Time", value: `${formatEventTime(event.event_date)} - ${endLabel}` },
    { icon: MapPin, label: "Venue", value: event.venue || "Venue will be announced" },
    { icon: Users, label: "Seats left", value: isFull ? "Full" : `${spotsLeft} of ${event.max_seats}` },
  ];

  return (
    <div className="event-detail-page">
      {/* Breadcrumb */}
      <Link href="/events" style={{ display: "inline-flex", alignItems: "center", gap: "8px", textDecoration: "none", opacity: 0.6, marginBottom: "40px" }}
        className="font-bebas">
        <ArrowLeft size={18} /> BACK TO ARENA
      </Link>

      <section className="event-showcase">
        <div className="event-showcase-copy">
          <div style={{ display: "flex", gap: "10px", marginBottom: "18px", flexWrap: "wrap" }}>
            <span className="tag" style={{ background: categoryColor, color: event.category === "Sports" || event.category === "Tech" ? "var(--black)" : "white" }}>
              {event.category}
            </span>
            <span className="tag" style={{ background: event.status === "live" ? "var(--pink)" : "white", color: event.status === "live" ? "white" : "var(--black)" }}>
              {event.status.toUpperCase()}
            </span>
            {event.is_team_event && <span className="tag tag-blue">TEAM EVENT ({event.team_size} MAX)</span>}
          </div>

          <h1 className="font-bangers event-detail-title">
            {event.title}
          </h1>

          <div className="event-detail-meta">
            <span className="font-space"><Calendar size={18} /> {formatEventDate(event.event_date)}</span>
            {event.venue && <span className="font-space"><MapPin size={18} /> {event.venue}</span>}
            <span className="font-space"><Users size={18} /> {regCount}/{event.max_seats} registered</span>
            <span className="font-space event-xp-line"><Zap size={18} fill="currentColor" /> +{event.xp_reward} XP</span>
          </div>
        </div>

        <div className="event-banner-frame" style={{ ["--event-accent" as string]: categoryColor }}>
          {event.banner_url ? (
            <img src={event.banner_url} alt={event.title} />
          ) : (
            <div className="event-generated-banner">
              <div className="event-banner-icon"><CategoryIcon size={68} strokeWidth={2.2} /></div>
              <div>
                <span className="font-bebas">VELTRIX EVENT PASS</span>
                <strong className="font-bangers">{event.title}</strong>
                <p className="font-space">{event.category} · {formatEventDate(event.event_date, { day: "numeric", month: "short" })} · {event.venue || "Campus"}</p>
              </div>
            </div>
          )}
        </div>
      </section>

      <div className="event-detail-grid">
        {/* LEFT — Main content */}
        <div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="event-info-grid">
              {detailStats.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="event-info-card">
                    <Icon size={21} />
                    <span className="font-bebas">{item.label}</span>
                    <strong className="font-space">{item.value}</strong>
                  </div>
                );
              })}
            </div>

            {/* Description */}
            <div className="brutal-card event-about-card">
              <div className="event-section-kicker"><Ticket size={18} /> EVENT OVERVIEW</div>
              <h2 className="font-bangers" style={{ fontSize: "2.35rem", marginBottom: "16px" }}>ABOUT THIS BATTLE</h2>
              <p className="font-space event-detail-copy">
                {event.description || "More details coming soon. Stay tuned for updates!"}
              </p>
            </div>

            <div className="event-detail-panels">
              <div className="event-detail-panel">
                <div className="event-section-kicker"><Trophy size={18} /> REWARDS</div>
                <h3 className="font-bangers">What you unlock</h3>
                <p className="font-space">Attend the event, get scanned by the organizer, and collect XP on your profile.</p>
                <strong className="font-bangers">+{event.xp_reward} XP</strong>
              </div>
              <div className="event-detail-panel">
                <div className="event-section-kicker"><ShieldCheck size={18} /> CHECK-IN</div>
                <h3 className="font-bangers">Entry process</h3>
                <p className="font-space">Register once, show your generated QR pass at the venue, and attendance gets verified there.</p>
              </div>
              <div className="event-detail-panel">
                <div className="event-section-kicker"><UserPlus size={18} /> FORMAT</div>
                <h3 className="font-bangers">{event.is_team_event ? "Team battle" : "Solo entry"}</h3>
                <p className="font-space">
                  {event.is_team_event ? `Create or join a team with up to ${event.team_size || 4} members after registration.` : "Individual registration is enabled for this event."}
                </p>
              </div>
            </div>

            {/* Tags */}
            {event.tags?.length > 0 && (
              <div className="event-tags-block">
                <div className="event-section-kicker"><Tags size={18} /> TAGS</div>
                {event.tags.map(tag => (
                  <span key={tag} className="tag" style={{ background: "var(--black)", color: "white", borderColor: "var(--black)" }}>#{tag}</span>
                ))}
              </div>
            )}

            {event.is_team_event && (
              <TeamPortal eventId={id} maxSize={event.team_size || 4} isRegistered={isRegistered} />
            )}
          </motion.div>
        </div>

        {/* RIGHT — Registration card */}
        <motion.aside initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
          {/* Countdown */}
          {!isPast && (
            <div className="brutal-card card-black" style={{ color: "white", marginBottom: "24px", textAlign: "center" }}>
              <div className="font-bebas" style={{ letterSpacing: "3px", opacity: 0.6, marginBottom: "4px" }}>BATTLE STARTS IN</div>
              <Countdown targetDate={event.event_date} />
            </div>
          )}

          {/* Register card */}
          <div className="brutal-card event-register-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "20px" }}>
              <div>
                <div className="font-bangers" style={{ fontSize: "2.5rem", lineHeight: 1 }}>+{event.xp_reward} XP</div>
                <div className="font-space" style={{ opacity: 0.6, fontSize: "0.85rem" }}>upon completion</div>
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <button onClick={toggleBookmark} className="btn" style={{ padding: "8px", fontSize: "1rem" }}>
                  {isBookmarked ? <BookmarkCheck size={20} /> : <Bookmark size={20} />}
                </button>
                <button onClick={() => navigator.share?.({ title: event.title, url: window.location.href })}
                  className="btn" style={{ padding: "8px" }}>
                  <Share2 size={20} />
                </button>
              </div>
            </div>

            {/* Capacity bar */}
            <div style={{ marginBottom: "24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                <span className="font-bebas" style={{ fontSize: "0.9rem" }}>{regCount} REGISTERED</span>
                <span className="font-bebas" style={{ fontSize: "0.9rem", opacity: 0.5 }}>{event.max_seats} MAX</span>
              </div>
              <div style={{ background: "#eee", height: "8px", border: "1px solid var(--black)" }}>
                <div style={{ height: "100%", background: fillPct > 80 ? "var(--pink)" : "var(--green)", width: `${fillPct}%`, transition: "width 0.5s" }} />
              </div>
              {isFull && <p className="font-bebas" style={{ color: "var(--pink)", marginTop: "6px" }}>ARENA IS FULL</p>}
            </div>

            {/* Action button */}
            <div className="registration-checklist">
              <span>QR pass generated after registration</span>
              <span>XP awarded after attendance scan</span>
              <span>Certificate unlocked by organizer</span>
            </div>

            {isPast ? (
              <div className="btn" style={{ width: "100%", justifyContent: "center", background: "#ccc", cursor: "not-allowed" }}>EVENT ENDED</div>
            ) : isRegistered ? (
              <div>
                <div className="btn btn-green" style={{ width: "100%", justifyContent: "center", cursor: "default" }}>
                  ✓ YOU'RE IN THE ARENA
                </div>
                <Link href={`/events/${id}/register`} className="btn" style={{ width: "100%", justifyContent: "center", marginTop: "10px", fontSize: "0.9rem" }}>
                  VIEW YOUR QR CODE →
                </Link>
              </div>
            ) : isFull ? (
              <div className="btn" style={{ width: "100%", justifyContent: "center", background: "#eee", cursor: "not-allowed" }}>ARENA FULL</div>
            ) : !userId ? (
              <Link href="/auth" className="btn btn-pink" style={{ width: "100%", justifyContent: "center" }}>
                LOGIN TO REGISTER
              </Link>
            ) : (
              <Link href={`/events/${id}/register`} className="btn btn-green" style={{ width: "100%", justifyContent: "center", fontSize: "1.1rem" }}>
                REGISTER NOW ⚡
              </Link>
            )}
          </div>

          {/* Related events */}
          {relatedEvents.length > 0 && (
            <div style={{ marginTop: "30px" }}>
              <h3 className="font-bangers" style={{ fontSize: "1.5rem", marginBottom: "16px" }}>MORE BATTLES</h3>
              {relatedEvents.map(ev => (
                <Link key={ev.id} href={`/events/${ev.id}`} style={{ textDecoration: "none", display: "block", marginBottom: "12px" }}>
                  <div className="brutal-card" style={{ padding: "16px", transition: "transform 0.15s" }}
                    onMouseEnter={e => (e.currentTarget.style.transform = "translate(-2px,-2px)")}
                    onMouseLeave={e => (e.currentTarget.style.transform = "")}>
                    <div className="font-bangers" style={{ fontSize: "1.1rem" }}>{ev.title}</div>
                    <div className="font-space" style={{ fontSize: "0.8rem", opacity: 0.6, marginTop: "4px" }}>
                      {new Date(ev.event_date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })} · +{ev.xp_reward} XP
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </motion.aside>
      </div>
    </div>
  );
}
