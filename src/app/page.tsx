"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AuthWorkflow } from "@/components/AuthWorkflow";
import { useVeltrix } from "@/lib/store";
import { motion } from "framer-motion";

const fadeUp = { initial: { opacity: 0, y: 30 }, animate: { opacity: 1, y: 0 } };

export default function Home() {
  const { user, isLoaded } = useVeltrix();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && user) {
      const path =
        user.role === "admin"
          ? "/dashboard/admin"
          : user.role === "club_admin"
            ? "/dashboard/club"
            : "/dashboard/student";
      router.replace(path);
    }
  }, [user, isLoaded, router]);

  if (!isLoaded) return (
    <div className="loading-screen">
      <motion.span
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        transition={{ repeat: Infinity, repeatType: "reverse", duration: 0.5 }}
      >
        ⚡ INITIALIZING VELTRIX...
      </motion.span>
    </div>
  );

  if (user) return (
    <div className="loading-screen">
      <motion.span
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        transition={{ repeat: Infinity, repeatType: "reverse", duration: 0.5 }}
      >
        ⚡ REDIRECTING TO ARENA...
      </motion.span>
    </div>
  );

  return (
    <div className="home-shell">
      <div className="home-grid">

        {/* ── LEFT: HERO ── */}
        <div className="home-hero-panel">
          {/* dot grid bg */}
          <div style={{
            position: "absolute", inset: 0,
            backgroundImage: "radial-gradient(circle, #ffffff12 1px, transparent 1px)",
            backgroundSize: "24px 24px", pointerEvents: "none"
          }} />

          <motion.div {...fadeUp} transition={{ duration: 0.5 }}
            style={{
              display: "inline-block", alignSelf: "flex-start",
              background: "var(--green)", color: "var(--black)",
              fontFamily: "Bebas Neue, sans-serif", fontSize: "0.95rem",
              letterSpacing: "3px", padding: "6px 16px",
              border: "2px solid var(--green)", marginBottom: "40px"
            }}
          >
            ANITS CAMPUS PLATFORM 2026
          </motion.div>

          <motion.h1
            {...fadeUp} transition={{ duration: 0.5, delay: 0.1 }}
            style={{
              fontFamily: "Bangers, system-ui",
              fontSize: "clamp(4rem, 9vw, 8rem)",
              lineHeight: 0.88,
              textTransform: "uppercase",
              letterSpacing: "2px",
            }}
          >
            WHERE<br />
            <span style={{ color: "var(--pink)", WebkitTextStroke: "2px var(--pink)" }}>CAMPUS</span><br />
            LEGENDS<br />
            <span style={{ color: "var(--green)" }}>RISE.</span>
          </motion.h1>

          <motion.p
            {...fadeUp} transition={{ duration: 0.5, delay: 0.2 }}
            className="font-space"
            style={{ marginTop: "40px", opacity: 0.6, fontSize: "1.1rem", lineHeight: 1.6, maxWidth: "420px" }}
          >
            Join hackathons, workshops, robotics battles, and cultural fests.
            Earn XP, claim certificates, and rise to the top of the leaderboard.
          </motion.p>

          <motion.div
            {...fadeUp} transition={{ duration: 0.5, delay: 0.3 }}
            style={{ display: "flex", gap: "12px", marginTop: "50px", flexWrap: "wrap" }}
          >
            {[
              { label: "🎟 EVENTS", bg: "var(--pink)", color: "white", r: "-3deg" },
              { label: "🏆 RANK UP", bg: "var(--green)", color: "var(--black)", r: "4deg" },
              { label: "⚡ EARN XP", bg: "var(--blue)", color: "var(--black)", r: "-2deg" },
            ].map(s => (
              <div key={s.label} style={{
                background: s.bg, color: s.color, fontFamily: "Bangers, system-ui",
                fontSize: "1.1rem", padding: "8px 18px", border: "3px solid white",
                boxShadow: "4px 4px 0 white", transform: `rotate(${s.r})`,
                letterSpacing: "1px"
              }}>
                {s.label}
              </div>
            ))}
          </motion.div>

          <motion.div
            {...fadeUp} transition={{ duration: 0.5, delay: 0.4 }}
            className="home-stat-row"
          >
            {[["350+", "TEAMS JOINED"], ["50+", "EVENTS LIVE"], ["10K+", "XP EARNED"]].map(([val, label]) => (
              <div key={label}>
                <div className="font-bangers" style={{ fontSize: "2.5rem", color: "var(--green)" }}>{val}</div>
                <div className="font-bebas" style={{ fontSize: "0.85rem", opacity: 0.5, letterSpacing: "2px" }}>{label}</div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* ── RIGHT: AUTH FORM ── */}
        <div className="home-auth-panel">
          <motion.div
            initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            style={{ width: "100%", maxWidth: "460px" }}
          >
            {/* Card */}
            <div className="home-auth-card">
              {/* corner sticker */}
              <div style={{
                position: "absolute", top: "-16px", right: "-16px",
                background: "var(--pink)", color: "white",
                fontFamily: "Bangers, system-ui", fontSize: "1rem",
                padding: "6px 14px", border: "3px solid var(--black)",
                boxShadow: "3px 3px 0 var(--black)", transform: "rotate(5deg)",
                letterSpacing: "1px"
              }}>
                JOIN NOW!
              </div>

              <h2 className="font-bangers" style={{ fontSize: "2.8rem", marginBottom: "8px", lineHeight: 1 }}>
                IDENTIFY YOURSELF
              </h2>
              <p className="font-space" style={{ opacity: 0.5, fontSize: "0.9rem", marginBottom: "36px" }}>
                Sign in or create your campus account below
              </p>

              <AuthWorkflow />
            </div>
          </motion.div>
        </div>

      </div>
    </div>
  );
}
