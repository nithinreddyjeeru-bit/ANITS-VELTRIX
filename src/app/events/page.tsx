"use client";
import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { Event } from "@/lib/types";
import { Zap, Users, Search, Bookmark, BookmarkCheck, ArrowRight, Calendar, MapPin, Clock3 } from "lucide-react";
import { getCategoryIcon } from "@/lib/category-icons";

const CATEGORIES = ["All", "Tech", "Robotics", "Design", "Cultural", "Sports", "Workshop", "General"];

const CAT_COLORS: Record<string, string> = {
  Tech: "var(--blue)", Robotics: "var(--orange)", Design: "var(--pink)",
  Cultural: "var(--purple)", Sports: "var(--green)", Workshop: "var(--blue)",
  General: "var(--black)", All: "var(--black)",
};

function Skeleton() {
  return (
    <div className="skeleton-grid">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="skeleton-card">
          <div className="skeleton-block" style={{ height: "8px" }} />
          <div className="skeleton-block" style={{ height: "184px" }} />
          <div style={{ padding: "22px", display: "flex", flexDirection: "column", gap: "12px" }}>
            <div className="skeleton-block" style={{ height: "20px", width: "40%", border: "2px solid #ddd" }} />
            <div className="skeleton-block" style={{ height: "30px", width: "85%" }} />
            <div className="skeleton-block" style={{ height: "14px", width: "100%" }} />
            <div className="skeleton-block" style={{ height: "14px", width: "70%" }} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginTop: "8px" }}>
              <div className="skeleton-block" style={{ height: "44px" }} />
              <div className="skeleton-block" style={{ height: "44px" }} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function EventCard({ event, bookmarked, onBookmark, userId }: {
  event: Event; bookmarked: boolean; onBookmark: (id: string) => void; userId?: string;
}) {
  const [regCount, setRegCount] = useState(0);
  const catColor = CAT_COLORS[event.category] || "var(--black)";
  const daysLeft = Math.ceil((new Date(event.event_date).getTime() - Date.now()) / 86400000);

  useEffect(() => {
    supabase.from("registrations").select("*", { count: "exact", head: true })
      .eq("event_id", event.id)
      .then(({ count }) => setRegCount(count || 0));
  }, [event.id]);

  const CatIcon = getCategoryIcon(event.category);
  const fillPct = Math.min((regCount / event.max_seats) * 100, 100);

  const isPast = new Date(event.event_date) < new Date();
  const isFull = regCount >= event.max_seats;

  return (
    <motion.div whileHover={{ y: -5 }} transition={{ type: "spring", stiffness: 320, damping: 22 }}>
      <article className="poster-card event-card-v2">
        <div className="poster-top" style={{ background: catColor }} />
        <div
          className="poster-art"
          style={{ background: `color-mix(in srgb, ${catColor} 14%, white)` }}
        >
          {event.banner_url ? (
            <Image src={event.banner_url} alt={event.title} fill style={{ objectFit: "cover" }} unoptimized />
          ) : (
            <div className="cat-icon-wrap">
              <CatIcon size={36} strokeWidth={2.25} />
            </div>
          )}
          {!event.banner_url && <span className="cat-icon-label">{event.category}</span>}
          {/* Status badge */}
          <div style={{
            position: "absolute", top: "12px", left: "12px",
            background: event.status === "live" ? "var(--pink)" : event.status === "completed" ? "#666" : catColor,
            color: "white", fontFamily: "Bebas Neue, sans-serif", fontSize: "0.8rem",
            padding: "3px 10px", border: "2px solid var(--black)"
          }}>
            {event.status === "upcoming" && daysLeft <= 7 ? `${daysLeft}D LEFT` : event.status.toUpperCase()}
          </div>
          {/* XP badge */}
          <div style={{
            position: "absolute", top: "12px", right: "12px",
            background: "var(--green)", color: "var(--black)",
            fontFamily: "Bangers, system-ui", fontSize: "1rem",
            padding: "3px 10px", border: "2px solid var(--black)"
          }}>
            +{event.xp_reward} XP
          </div>
          {/* Bookmark */}
          {userId && (
            <button
              onClick={(e) => { e.preventDefault(); onBookmark(event.id); }}
              style={{
                position: "absolute", bottom: "12px", right: "12px",
                background: bookmarked ? "var(--black)" : "white",
                color: bookmarked ? "white" : "var(--black)",
                border: "2px solid var(--black)", padding: "6px", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center"
              }}
            >
              {bookmarked ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
            </button>
          )}
        </div>

        <div className="poster-body">
          <div className="event-card-head">
            <span className="tag" style={{ background: catColor + "22", borderColor: catColor, fontSize: "0.75rem" }}>
              {event.category}
            </span>
            {event.is_team_event && (
              <span className="tag" style={{ fontSize: "0.75rem" }}>TEAM EVENT</span>
            )}
          </div>

          <h3 className="font-bangers event-card-title">
            {event.title}
          </h3>
          <p className="font-space event-card-copy">
            {event.description}
          </p>

          <div className="event-meta-grid">
            <span className="font-space">
              <Calendar size={14} /> {new Date(event.event_date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
            </span>
            {event.venue && (
              <span className="font-space">
                <MapPin size={14} /> {event.venue}
              </span>
            )}
            <span className="font-space">
              <Users size={14} /> {regCount}/{event.max_seats}
            </span>
            <span className="font-space">
              <Clock3 size={14} /> {daysLeft > 0 ? `${daysLeft} days` : event.status}
            </span>
          </div>

          {/* Progress bar */}
          <div style={{ background: "#eee", height: "6px", border: "1px solid var(--black)", marginBottom: "20px" }}>
            <div style={{ height: "100%", background: catColor, width: `${fillPct}%`, transition: "width 0.4s" }} />
          </div>

          <div className="event-card-actions">
            <Link href={`/events/${event.id}`} className="poster-cta secondary">
              Details <ArrowRight size={16} />
            </Link>
            <Link
              href={userId && !isPast && !isFull ? `/events/${event.id}/register` : `/events/${event.id}`}
              className="poster-cta primary"
            >
              {isPast ? "Ended" : isFull ? "Full" : "Register"}
            </Link>
          </div>
        </div>
      </article>
    </motion.div>
  );
}

export default function EventsPage() {
  const searchParams = useSearchParams();
  const qParam = searchParams.get("q")?.trim() ?? "";

  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState(qParam);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set());
  const [userId, setUserId] = useState<string | undefined>(undefined);
  const [page, setPage] = useState(1);
  const PER_PAGE = 9;

  // Sync URL ?q= to search bar
  useEffect(() => {
    if (qParam) setSearch(qParam);
  }, [qParam]);
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  // Auth check
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserId(user?.id);
      if (user) {
        supabase.from("bookmarks").select("event_id").eq("user_id", user.id)
          .then(({ data }) => setBookmarks(new Set(data?.map(b => b.event_id) || [])));
      }
    });
  }, []);

  // Fetch events
  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let query = supabase.from("events").select("*").order("event_date", { ascending: true });
      if (category !== "All") query = query.eq("category", category);
      if (debouncedSearch) query = query.ilike("title", `%${debouncedSearch}%`);

      const { data, error: err } = await query;
      if (err) throw err;
      setEvents(data || []);
      setPage(1);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [category, debouncedSearch]);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  const toggleBookmark = async (eventId: string) => {
    if (!userId) { window.location.href = "/auth"; return; }
    const isBookmarked = bookmarks.has(eventId);
    if (isBookmarked) {
      await supabase.from("bookmarks").delete().eq("event_id", eventId).eq("user_id", userId);
      setBookmarks(prev => { const n = new Set(prev); n.delete(eventId); return n; });
    } else {
      await supabase.from("bookmarks").insert({ user_id: userId, event_id: eventId });
      setBookmarks(prev => new Set([...prev, eventId]));
    }
  };

  const paginatedEvents = events.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const totalPages = Math.ceil(events.length / PER_PAGE);

  return (
    <div className="events-page">
      {/* HERO */}
      <section className="events-hero">
        <div>
          <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
            className="sticker sticker-pink" style={{ marginBottom: "18px" }}>
            EVENT ARENA
          </motion.div>
          <motion.h1 initial={{ y: 18, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }} className="events-title">
            Explore campus events
          </motion.h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
            className="font-space events-subtitle">
            Find workshops, battles, fests, and club missions. Register fast, show your QR at the venue, and earn XP after attendance.
          </motion.p>
        </div>
        <aside className="events-hero-panel">
          <span className="font-bebas">LIVE COUNT</span>
          <strong className="font-bangers">{events.length}</strong>
          <p className="font-space">events available right now</p>
        </aside>
      </section>

      {/* FILTER + SEARCH BAR */}
      <section className="events-toolbar">
        <div className="events-toolbar-row">
          {/* Category pills */}
          <div className="category-scroll no-scrollbar" style={{ display: "flex", gap: "10px", overflowX: "auto", paddingBottom: "5px", flex: 1 }}>
            {CATEGORIES.map(cat => (
              <button key={cat} onClick={() => setCategory(cat)}
                className="btn" style={{
                  fontSize: "0.85rem", padding: "6px 14px",
                  background: category === cat ? "var(--green)" : "white",
                  color: "var(--black)",
                  whiteSpace: "nowrap"
                }}>
                {cat}
              </button>
            ))}
          </div>
          {/* Search */}
          <div className="search-wrap" style={{ position: "relative", flex: "1 1 300px" }}>
            <Search style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "white", opacity: 0.5 }} size={18} />
            <input
              className="font-space"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search events..."
              style={{
                width: "100%", padding: "12px 16px 12px 44px",
                background: "transparent", border: "3px solid white",
                color: "white", outline: "none", fontSize: "1rem"
              }}
            />
          </div>
        </div>
      </section>

      <style jsx>{`
        @media (max-width: 768px) {
          .events-toolbar-row { flex-direction: column; align-items: stretch; }
          .category-scroll { order: 2; width: 100%; }
          .search-wrap { order: 1; width: 100%; min-width: 100% !important; }
        }
      `}</style>

      {/* EVENT GRID */}
      {loading ? (
        <Skeleton />
      ) : error ? (
        <div className="brutal-card card-pink" style={{ textAlign: "center", padding: "60px" }}>
          <div className="font-bangers" style={{ fontSize: "3rem" }}>OOPS! SOMETHING BROKE</div>
          <p className="font-space" style={{ marginTop: "16px", opacity: 0.8 }}>{error}</p>
          <button onClick={fetchEvents} className="btn" style={{ marginTop: "24px" }}>RETRY</button>
        </div>
      ) : events.length === 0 ? (
        <div className="brutal-card" style={{ textAlign: "center", padding: "80px" }}>
          <Zap size={48} strokeWidth={2} style={{ margin: "0 auto", opacity: 0.5 }} />
          <div className="font-bangers" style={{ fontSize: "3rem", marginTop: "20px" }}>NO BATTLES FOUND</div>
          <p className="font-space" style={{ opacity: 0.6, marginTop: "12px" }}>Try a different category or search term</p>
          <button onClick={() => { setCategory("All"); setSearch(""); }} className="btn btn-green" style={{ marginTop: "24px" }}>
            CLEAR FILTERS
          </button>
        </div>
      ) : (
        <>
          <div style={{ marginBottom: "22px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span className="font-bebas" style={{ fontSize: "1.5rem", opacity: 0.6 }}>
              {events.length} EVENT{events.length !== 1 ? "S" : ""} FOUND
            </span>
          </div>
          <div className="events-grid">
            {paginatedEvents.map((ev, i) => (
              <motion.div key={ev.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}>
                <EventCard event={ev} bookmarked={bookmarks.has(ev.id)} onBookmark={toggleBookmark} userId={userId} />
              </motion.div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: "flex", gap: "12px", justifyContent: "center", marginTop: "60px" }}>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="btn" style={{ opacity: page === 1 ? 0.4 : 1 }}>← PREV</button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => setPage(p)}
                  className="btn" style={{ background: p === page ? "var(--black)" : "white", color: p === page ? "white" : "var(--black)" }}>
                  {p}
                </button>
              ))}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="btn" style={{ opacity: page === totalPages ? 0.4 : 1 }}>NEXT →</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
