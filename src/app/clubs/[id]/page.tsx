"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { PageHero } from "@/components/VeltrixUI";
import { useClubMembership } from "@/lib/hooks/useClubs";
import type { Club, Event, Announcement } from "@/lib/types";

export default function ClubDetailsPage(props: { params: Promise<{ id: string }> }) {
  const { id } = use(props.params);
  const router = useRouter();
  const [club, setClub] = useState<Club | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [joinError, setJoinError] = useState("");
  const { isMember, loading: memberLoading, toggleMembership } = useClubMembership(id);

  useEffect(() => {
    const load = async () => {
      const { data: c } = await supabase.from("clubs").select("*").eq("id", id).single();
      setClub(c);

      const { data: ev } = await supabase
        .from("events")
        .select("*")
        .eq("club_id", id)
        .order("event_date", { ascending: true });
      setEvents(ev || []);

      const { data: annc } = await supabase
        .from("announcements")
        .select("*")
        .eq("club_id", id)
        .order("created_at", { ascending: false })
        .limit(10);
      setAnnouncements(annc || []);
      setLoading(false);
    };
    load();
  }, [id]);

  const handleJoin = async () => {
    setJoinError("");
    try {
      await toggleMembership();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Please log in first";
      setJoinError(msg);
      if (msg.toLowerCase().includes("login")) router.push("/auth");
    }
  };

  if (loading) {
    return <p className="font-bangers" style={{ padding: "80px", textAlign: "center", fontSize: "2rem" }}>LOADING CREW...</p>;
  }

  if (!club) {
    return (
      <div style={{ padding: "80px", textAlign: "center" }}>
        <p className="font-bangers" style={{ fontSize: "3rem" }}>CLUB NOT FOUND</p>
        <Link href="/clubs" className="btn btn-black" style={{ marginTop: "24px" }}>← BACK</Link>
      </div>
    );
  }

  return (
    <>
      <PageHero
        kicker="Club profile"
        title={club.name}
        copy={club.description || "Campus crew on Veltrix."}
        secondaryAction={{ label: "Back to Clubs", href: "/clubs" }}
      />

      <section style={{ padding: "0 60px 100px", display: "grid", gridTemplateColumns: "1fr 340px", gap: "40px", alignItems: "start" }}>
        <div>
          <div className="brutal-card" style={{ marginBottom: "32px" }}>
            <h2 className="font-bangers" style={{ fontSize: "2rem" }}>CLUB EVENTS</h2>
            {events.length === 0 ? (
              <p className="font-space" style={{ marginTop: "12px", opacity: 0.6 }}>No events linked yet.</p>
            ) : (
              <div style={{ marginTop: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
                {events.map((ev) => (
                  <Link key={ev.id} href={`/events/${ev.id}`} className="brutal-card" style={{ padding: "16px", textDecoration: "none", color: "inherit", display: "block" }}>
                    <b className="font-bangers">{ev.title}</b>
                    <span className="font-space" style={{ fontSize: "0.85rem", opacity: 0.6, marginLeft: "12px" }}>
                      {new Date(ev.event_date).toLocaleDateString()} · +{ev.xp_reward} XP
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="brutal-card">
            <h2 className="font-bangers" style={{ fontSize: "2rem" }}>ANNOUNCEMENTS</h2>
            {announcements.length === 0 ? (
              <p className="font-space" style={{ marginTop: "12px", opacity: 0.6 }}>No posts yet.</p>
            ) : (
              announcements.map((a) => (
                <div key={a.id} style={{ marginTop: "16px", paddingTop: "16px", borderTop: "2px solid #ddd" }}>
                  <b className="font-bebas">{a.title}</b>
                  <p className="font-space" style={{ fontSize: "0.9rem", opacity: 0.75 }}>{a.body}</p>
                </div>
              ))
            )}
          </div>
        </div>

        <aside className="brutal-card" style={{ position: "sticky", top: "100px" }}>
          <span className="tag tag-green">{club.category}</span>
          <p className="font-bangers" style={{ fontSize: "2.5rem", marginTop: "12px", lineHeight: 1 }}>{club.member_count}</p>
          <p className="font-bebas" style={{ opacity: 0.6, letterSpacing: "2px" }}>MEMBERS</p>
          <button
            type="button"
            className={`btn ${isMember ? "btn-pink" : "btn-green"}`}
            style={{ width: "100%", marginTop: "24px", justifyContent: "center" }}
            disabled={memberLoading}
            onClick={handleJoin}
          >
            {memberLoading ? "..." : isMember ? "LEAVE CLUB" : "JOIN CLUB"}
          </button>
          {joinError && <p className="font-space" style={{ color: "var(--pink)", marginTop: "12px", fontSize: "0.85rem" }}>{joinError}</p>}
        </aside>
      </section>
    </>
  );
}
