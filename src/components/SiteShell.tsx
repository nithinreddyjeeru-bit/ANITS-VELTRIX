"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useVeltrix } from "@/lib/store";
import { motion } from "framer-motion";
import { Search, LogIn, UserPlus } from "lucide-react";
import { dashboardPathForRole } from "@/lib/auth-redirect";
import { supabase } from "@/lib/supabase";
import VeltrixLogo from "./VeltrixLogo";

type TickerItem = {
  label: string;
  href?: string;
};

function formatTickerDate(value: string) {
  return new Date(value).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
}

export default function SiteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoaded, signOut } = useVeltrix();
  const [scrollProgress, setScrollProgress] = useState(0);
  const [searchQ, setSearchQ] = useState("");
  const [tickerItems, setTickerItems] = useState<TickerItem[]>([]);
  const isHome = pathname === "/";
  const isLoggedIn = !!user;
  const dashHref = user ? dashboardPathForRole(user.role) : "/dashboard/student";

  useEffect(() => {
    const handleScroll = () => {
      const total = document.documentElement.scrollHeight - window.innerHeight;
      if (total > 0) setScrollProgress((window.scrollY / total) * 100);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadTicker = async () => {
      const now = new Date().toISOString();
      const [announcementsRes, eventsRes, registrationsRes] = await Promise.all([
        supabase
          .from("announcements")
          .select("title")
          .eq("is_global", true)
          .order("created_at", { ascending: false })
          .limit(3),
        supabase
          .from("events")
          .select("id, title, event_date, status")
          .in("status", ["upcoming", "live"])
          .gte("event_date", now)
          .order("event_date", { ascending: true })
          .limit(4),
        supabase
          .from("registrations")
          .select("*", { count: "exact", head: true }),
      ]);

      if (!isMounted) return;

      const items: TickerItem[] = [];

      for (const announcement of announcementsRes.data || []) {
        items.push({ label: announcement.title, href: "/notifications" });
      }

      for (const event of eventsRes.data || []) {
        const prefix = event.status === "live" ? "LIVE NOW" : "REGISTRATIONS OPEN";
        items.push({
          label: `${prefix}: ${event.title} - ${formatTickerDate(event.event_date)}`,
          href: `/events/${event.id}`,
        });
      }

      if ((registrationsRes.count || 0) > 0) {
        items.push({ label: `${registrationsRes.count} registrations across campus`, href: "/events" });
      }

      setTickerItems(items);
    };

    loadTicker();
    const channel = supabase
      .channel("site-ticker-live")
      .on("postgres_changes" as any, { event: "*", schema: "public", table: "events" }, loadTicker)
      .on("postgres_changes" as any, { event: "*", schema: "public", table: "announcements" }, loadTicker)
      .on("postgres_changes" as any, { event: "*", schema: "public", table: "registrations" }, loadTicker)
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel).catch(() => {});
    };
  }, []);

  if (!isLoaded) return (
    <div className="loading-screen">
      <motion.span
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ repeat: Infinity, repeatType: "reverse", duration: 0.6 }}
      >
        ⚡ VELTRIX LOADING...
      </motion.span>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Scroll Progress */}
      <div className="progress-bar" style={{ width: `${scrollProgress}%` }} />

      {/* News Ticker */}
      <div className="marquee-wrap">
        <div className="marquee-inner">
          {(tickerItems.length > 0 ? [...tickerItems, ...tickerItems] : [{ label: "No live campus updates yet" }, { label: "Create an event or announcement to publish it here" }]).map((item, index) => (
            item.href ? (
              <Link key={`${item.label}-${index}`} href={item.href} className="ticker-link">
                * {item.label}
              </Link>
            ) : (
              <span key={`${item.label}-${index}`}>* {item.label}</span>
            )
          ))}
        </div>
      </div>

      {/* Navbar */}
      <nav className="navbar">
        <Link href="/" style={{ textDecoration: "none" }}>
          <VeltrixLogo />
        </Link>

        {/* Nav Links */}
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", alignItems: "center" }}>
          {(isLoggedIn
            ? [
                ["DASHBOARD", dashHref],
                ["EVENTS", "/events"],
                ["CLUBS", "/clubs"],
                ["LEADERBOARD", "/leaderboard"],
                ["ABOUT", "/about"],
              ]
            : [
                ["HOME", "/"],
                ["EVENTS", "/events"],
                ["CLUBS", "/clubs"],
                ["LEADERBOARD", "/leaderboard"],
                ["ABOUT", "/about"],
              ]
          ).map(([label, href]) => (
            <Link
              key={href}
              href={href}
              className={`nav-a ${pathname === href || (label === "DASHBOARD" && pathname.startsWith("/dashboard")) ? "nav-active" : ""}`}
              style={{ padding: "6px 14px" }}
            >
              {label}
            </Link>
          ))}
        </div>

        {/* Auth actions */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const q = searchQ.trim();
              if (q) router.push(`/events?q=${encodeURIComponent(q)}`);
              else router.push("/events");
            }}
            style={{ display: "flex", alignItems: "center", gap: "6px" }}
          >
            <input
              value={searchQ}
              onChange={(e) => setSearchQ(e.target.value)}
              placeholder="Search…"
              className="font-space"
              style={{
                width: "120px",
                maxWidth: "22vw",
                padding: "8px 10px",
                border: "3px solid white",
                background: "rgba(0,0,0,0.25)",
                color: "white",
                fontSize: "0.85rem",
              }}
            />
            <button
              type="submit"
              className="btn"
              style={{ padding: "8px 10px", minWidth: "auto" }}
              aria-label="Search events"
            >
              <Search size={18} />
            </button>
          </form>
          {isLoggedIn ? (
            <>
              <Link href="/notifications" className="btn" style={{ fontSize: "0.95rem", padding: "8px 16px" }}>
                ALERTS
              </Link>
              <button type="button" onClick={() => signOut()} className="btn btn-pink" style={{ fontSize: "0.95rem", padding: "8px 16px" }}>
                OUT
              </button>
            </>
          ) : (
            <>
              <Link href="/auth" className="btn btn-green" style={{ fontSize: "0.95rem", padding: "8px 16px" }}>
                <LogIn size={16} /> LOGIN
              </Link>
              <Link href="/auth" className="btn" style={{ fontSize: "0.95rem", padding: "8px 16px" }}>
                <UserPlus size={16} /> SIGN UP
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <motion.main
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        style={{ flex: 1 }}
      >
        {children}
      </motion.main>

      {/* Footer */}
      {!isHome && (
        <footer style={{ background: "var(--black)", color: "white", padding: "80px 60px 40px", marginTop: "100px", position: "relative" }}>
          <div className="zigzag-bar" style={{ position: "absolute", top: 0, left: 0, right: 0 }} />

          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: "60px", maxWidth: "1400px", margin: "0 auto" }}>
            <div>
              <div className="font-bangers" style={{ fontSize: "3rem", color: "var(--pink)" }}>VELTRIX</div>
              <div className="font-bebas" style={{ color: "var(--green)", fontSize: "1rem", letterSpacing: "3px", marginBottom: "16px" }}>CAMPUS UNIVERSE</div>
              <p className="font-space" style={{ opacity: 0.5, lineHeight: 1.6, fontSize: "0.95rem" }}>
                The ultimate futuristic comic-book campus universe. Built for the next generation of innovators at ANITS.
              </p>
            </div>

            {[
              { title: "UNIVERSE", links: ["Battle Arena", "Club Houses", "Hall of Fame", "The Forge"] },
              { title: "COMMUNITY", links: ["Leaderboards", "Certificates", "XP System", "Teams"] },
              { title: "LEGAL", links: ["Privacy Policy", "Terms of Use", "Contact Us", "About"] },
            ].map((col) => (
              <div key={col.title}>
                <h4 className="font-bebas" style={{ fontSize: "1.3rem", color: "var(--green)", marginBottom: "20px", letterSpacing: "2px" }}>{col.title}</h4>
                <ul className="font-space" style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "10px" }}>
                  {col.links.map((l) => (
                    <li key={l} style={{ opacity: 0.5, fontSize: "0.95rem", cursor: "pointer", transition: "opacity 0.2s" }}
                      onMouseEnter={e => (e.currentTarget.style.opacity = "1")}
                      onMouseLeave={e => (e.currentTarget.style.opacity = "0.5")}
                    >{l}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div style={{ borderTop: "1px solid #222", marginTop: "60px", paddingTop: "24px", display: "flex", justifyContent: "space-between", opacity: 0.35 }} className="font-space">
            <p style={{ fontSize: "0.85rem" }}>© 2026 VELTRIX UNIVERSE · ANITS · ALL RIGHTS RESERVED</p>
            <div style={{ display: "flex", gap: "30px", fontSize: "0.85rem" }}>
              <span>PRIVACY.EXE</span>
              <span>TERMS.CMD</span>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}
