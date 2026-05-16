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

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

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

  const navLinks = isLoggedIn
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
      ];

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
      <nav className="navbar" style={{ position: "relative" }}>
        <Link href="/" style={{ textDecoration: "none" }} onClick={() => setMobileMenuOpen(false)}>
          <VeltrixLogo />
        </Link>

        {/* Desktop Nav Links */}
        <div className="desktop-nav" style={{ display: "flex", gap: "6px", alignItems: "center" }}>
          {navLinks.map(([label, href]) => (
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

        {/* Auth actions & Mobile Toggle */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const q = searchQ.trim();
              if (q) router.push(`/events?q=${encodeURIComponent(q)}`);
              else router.push("/events");
            }}
            className="desktop-nav"
            style={{ display: "flex", alignItems: "center", gap: "6px" }}
          >
            <input
              value={searchQ}
              onChange={(e) => setSearchQ(e.target.value)}
              placeholder="Search…"
              className="font-space"
              style={{
                width: "120px",
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

          <div className="desktop-nav" style={{ display: "flex", gap: "10px" }}>
            {isLoggedIn ? (
              <>
                <Link href="/notifications" className="btn" style={{ fontSize: "0.9rem", padding: "8px 14px" }}>
                  ALERTS
                </Link>
                <button type="button" onClick={() => signOut()} className="btn btn-pink" style={{ fontSize: "0.9rem", padding: "8px 14px" }}>
                  OUT
                </button>
              </>
            ) : (
              <>
                <Link href="/auth" className="btn btn-green" style={{ fontSize: "0.9rem", padding: "8px 14px" }}>
                  LOGIN
                </Link>
                <Link href="/auth" className="btn" style={{ fontSize: "0.9rem", padding: "8px 14px" }}>
                  SIGN UP
                </Link>
              </>
            )}
          </div>

          <button 
            className="mobile-toggle btn" 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{ padding: "8px 12px", minWidth: "auto" }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: "4px", width: "20px" }}>
              <div style={{ height: "3px", background: "white", width: "100%" }} />
              <div style={{ height: "3px", background: "white", width: "100%" }} />
              <div style={{ height: "3px", background: "white", width: "100%" }} />
            </div>
          </button>
        </div>

        {/* Mobile Menu Overlay */}
        {mobileMenuOpen && (
          <div style={{ 
            position: "fixed", top: "115px", left: 0, right: 0, bottom: 0, 
            background: "var(--black)", zIndex: 1000, padding: "40px 20px",
            display: "flex", flexDirection: "column", gap: "20px"
          }}>
            {navLinks.map(([label, href]) => (
              <Link key={href} href={href} className="font-bangers" style={{ fontSize: "2rem", color: "white", textDecoration: "none" }}>
                {label}
              </Link>
            ))}
            <div style={{ height: "2px", background: "rgba(255,255,255,0.1)", margin: "10px 0" }} />
            {isLoggedIn ? (
              <div style={{ display: "flex", gap: "10px" }}>
                <Link href="/notifications" className="btn" style={{ flex: 1 }}>ALERTS</Link>
                <button onClick={() => signOut()} className="btn btn-pink" style={{ flex: 1 }}>LOGOUT</button>
              </div>
            ) : (
              <div style={{ display: "flex", gap: "10px" }}>
                <Link href="/auth" className="btn btn-green" style={{ flex: 1 }}>LOGIN</Link>
                <Link href="/auth" className="btn" style={{ flex: 1 }}>SIGN UP</Link>
              </div>
            )}
          </div>
        )}
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
        <footer className="site-footer">
          <div className="zigzag-bar" style={{ position: "absolute", top: 0, left: 0, right: 0 }} />

          <div className="footer-grid">
            <div className="footer-brand">
              <div className="font-bangers brand-text">VELTRIX</div>
              <div className="font-bebas sub-brand">CAMPUS UNIVERSE</div>
              <p className="font-space brand-desc">
                The ultimate futuristic comic-book campus universe. Built for the next generation of innovators at ANITS.
              </p>
            </div>

            {[
              { title: "UNIVERSE", links: ["Battle Arena", "Club Houses", "Hall of Fame", "The Forge"] },
              { title: "COMMUNITY", links: ["Leaderboards", "Certificates", "XP System", "Teams"] },
              { title: "LEGAL", links: ["Privacy Policy", "Terms of Use", "Contact Us", "About"] },
            ].map((col) => (
              <div key={col.title} className="footer-col">
                <h4 className="font-bebas col-title">{col.title}</h4>
                <ul className="font-space footer-links">
                  {col.links.map((l) => (
                    <li key={l} className="footer-li">{l}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="footer-bottom font-space">
            <p className="copy-text">© 2026 VELTRIX UNIVERSE · ANITS · ALL RIGHTS RESERVED</p>
            <div className="legal-links">
              <span>PRIVACY.EXE</span>
              <span>TERMS.CMD</span>
            </div>
          </div>
        </footer>
      )}

      <style jsx>{`
        .site-footer { background: var(--black); color: white; padding: 80px 60px 40px; marginTop: 100px; position: relative; }
        .footer-grid { display: grid; gridTemplateColumns: 2fr 1fr 1fr 1fr; gap: 60px; maxWidth: 1400px; margin: 0 auto; }
        .brand-text { fontSize: 3.5rem; color: var(--pink); }
        .sub-brand { color: var(--green); fontSize: 1rem; letterSpacing: 3px; marginBottom: 16px; }
        .brand-desc { opacity: 0.5; lineHeight: 1.6; fontSize: 0.95rem; }
        .col-title { fontSize: 1.3rem; color: var(--green); marginBottom: 20px; letterSpacing: 2px; }
        .footer-links { listStyle: none; display: flex; flexDirection: column; gap: 10px; padding: 0; }
        .footer-li { opacity: 0.5; fontSize: 0.95rem; cursor: pointer; transition: opacity 0.2s; }
        .footer-li:hover { opacity: 1; }
        .footer-bottom { borderTop: 1px solid #222; marginTop: 60px; paddingTop: 24px; display: flex; justifyContent: space-between; opacity: 0.35; fontSize: 0.85rem; }
        .legal-links { display: flex; gap: 30px; }

        @media (max-width: 1024px) {
          .desktop-nav { display: none !important; }
          .mobile-toggle { display: block !important; }
          .footer-grid { gridTemplateColumns: 1fr 1fr; gap: 40px; }
          .site-footer { padding: 60px 20px 40px; }
        }

        @media (max-width: 640px) {
          .footer-grid { gridTemplateColumns: 1fr; }
          .footer-bottom { flexDirection: column; gap: 20px; textAlign: center; }
          .legal-links { justifyContent: center; }
          .brand-text { fontSize: 2.5rem; }
        }

        @media (min-width: 1025px) {
          .mobile-toggle { display: none !important; }
        }
      `}</style>
    </div>
  );
}
