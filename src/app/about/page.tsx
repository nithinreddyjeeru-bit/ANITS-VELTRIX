import type { Metadata } from "next";
import Link from "next/link";
import { PageHero, UtilityCards, FlowStrip } from "@/components/VeltrixUI";
import { features } from "@/lib/veltrix-data";

export const metadata: Metadata = {
  title: "About — VELTRIX",
  description: "Learn about VELTRIX, the campus events universe built for ANITS students.",
};

const COLORS = ["var(--green)", "var(--pink)", "var(--blue)", "var(--orange)", "var(--purple)"];

const stats = [
  { value: "500+", label: "Students Registered" },
  { value: "30+", label: "Events Hosted" },
  { value: "12+", label: "Active Clubs" },
  { value: "1000+", label: "Certificates Issued" },
];

const team = [
  { name: "VELTRIX Dev Team", role: "Platform Engineering", emoji: "⚡" },
  { name: "ANITS Student Council", role: "Governance & Policy", emoji: "🏛" },
  { name: "Club Coordinators", role: "Event Management", emoji: "🎯" },
  { name: "Faculty Advisors", role: "Academic Oversight", emoji: "🎓" },
];

const values = [
  {
    icon: "🚀",
    title: "Student-First",
    body: "Every feature on VELTRIX is built with students in mind — from quick registration flows to auto-generated certificates.",
  },
  {
    icon: "🔓",
    title: "Transparent",
    body: "Open leaderboards, public event records, and verifiable certificates ensure nothing happens behind closed doors.",
  },
  {
    icon: "⚡",
    title: "Fast & Reliable",
    body: "Real-time updates, live event tickers, and instant notifications powered by Supabase keep you in the loop 24/7.",
  },
  {
    icon: "🌱",
    title: "Built to Grow",
    body: "VELTRIX is designed to scale — from department-level hackathons to inter-college mega events.",
  },
];

export default function AboutPage() {
  return (
    <>
      <PageHero
        kicker="About us"
        title="The event universe for ANITS."
        accentWord="ANITS."
        copy="VELTRIX brings events, clubs, certificates, leaderboards, and student identity into one clean campus platform. No more scattered WhatsApp groups. No more missed opportunities."
        action={{ label: "Browse events", href: "/events" }}
        secondaryAction={{ label: "Join a club", href: "/clubs" }}
      />

      {/* Stats */}
      <div style={{ background: "var(--black)", padding: "60px var(--side-padding)", borderTop: "var(--border)", borderBottom: "var(--border)" }}>
        <div style={{ maxWidth: "900px", margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "40px", textAlign: "center" }}>
          {stats.map((s) => (
            <div key={s.label}>
              <div className="font-bangers" style={{ fontSize: "3rem", color: "var(--pink)", lineHeight: 1 }}>{s.value}</div>
              <div className="font-space" style={{ color: "white", opacity: 0.6, fontSize: "0.85rem", marginTop: "8px", letterSpacing: "1px" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Mission */}
      <div style={{ maxWidth: "860px", margin: "0 auto", padding: "80px var(--side-padding)" }}>
        <p className="font-space" style={{ color: "var(--green)", letterSpacing: "3px", fontSize: "0.85rem", marginBottom: "16px" }}>
          🎯 OUR MISSION
        </p>
        <h2 className="font-bangers" style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)", lineHeight: 1.1, marginBottom: "24px" }}>
          Making campus life impossible to miss.
        </h2>
        <p className="font-space" style={{ opacity: 0.7, lineHeight: "1.8", fontSize: "1rem", marginBottom: "20px" }}>
          ANITS is full of talented students running brilliant events — hackathons, cultural fests, tech talks, sports tournaments,
          and more. But too often these events go unnoticed, under-attended, or unrecorded. VELTRIX exists to fix that.
        </p>
        <p className="font-space" style={{ opacity: 0.7, lineHeight: "1.8", fontSize: "1rem" }}>
          We give organisers a powerful platform to create, promote, and manage events. We give students a single dashboard
          to discover, register, and collect proof of their participation. And we give the institution a live pulse of
          campus activity.
        </p>
      </div>

      {/* How It Works */}
      <div className="section-band">HOW IT WORKS — 4 STEPS</div>
      <FlowStrip />

      {/* Values */}
      <div style={{ background: "var(--black)", borderTop: "var(--border)", borderBottom: "var(--border)", padding: "80px var(--side-padding)" }}>
        <div style={{ maxWidth: "960px", margin: "0 auto" }}>
          <p className="font-space" style={{ color: "var(--green)", letterSpacing: "3px", fontSize: "0.85rem", marginBottom: "16px" }}>
            💡 OUR VALUES
          </p>
          <h2 className="font-bangers" style={{ fontSize: "clamp(2rem, 5vw, 3rem)", marginBottom: "48px" }}>
            What drives every decision.
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "28px" }}>
            {values.map((v) => (
              <div
                key={v.title}
                style={{ border: "var(--border)", padding: "32px 24px" }}
              >
                <div style={{ fontSize: "2rem", marginBottom: "16px" }}>{v.icon}</div>
                <h3 className="font-bebas" style={{ color: "var(--pink)", fontSize: "1.2rem", letterSpacing: "2px", marginBottom: "12px" }}>
                  {v.title}
                </h3>
                <p className="font-space" style={{ opacity: 0.65, fontSize: "0.9rem", lineHeight: "1.7" }}>
                  {v.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Features */}
      <UtilityCards
        items={features.map((item, i) => ({
          title: item.title,
          copy: item.copy,
          icon: item.icon,
          color: COLORS[i % COLORS.length],
          href: item.title.toLowerCase().includes("leader") ? "/leaderboard" : "/events",
        }))}
      />

      {/* Team */}
      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "80px var(--side-padding)" }}>
        <p className="font-space" style={{ color: "var(--green)", letterSpacing: "3px", fontSize: "0.85rem", marginBottom: "16px" }}>
          👥 THE TEAM
        </p>
        <h2 className="font-bangers" style={{ fontSize: "clamp(2rem, 5vw, 3rem)", marginBottom: "40px" }}>
          People behind VELTRIX.
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "24px" }}>
          {team.map((t) => (
            <div
              key={t.name}
              style={{
                background: "var(--black)",
                border: "var(--border)",
                padding: "32px 24px",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: "2.5rem", marginBottom: "16px" }}>{t.emoji}</div>
              <div className="font-bebas" style={{ fontSize: "1rem", color: "white", letterSpacing: "1px", marginBottom: "8px" }}>
                {t.name}
              </div>
              <div className="font-space" style={{ fontSize: "0.8rem", opacity: 0.5, letterSpacing: "1px" }}>
                {t.role}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div
        style={{
          background: "var(--black)",
          borderTop: "var(--border)",
          padding: "80px var(--side-padding)",
          textAlign: "center",
        }}
      >
        <h2 className="font-bangers" style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)", color: "white", marginBottom: "16px" }}>
          Ready to join the <span style={{ color: "var(--pink)" }}>universe?</span>
        </h2>
        <p className="font-space" style={{ opacity: 0.6, marginBottom: "32px", fontSize: "1rem" }}>
          Create your account, discover events, and start earning XP today.
        </p>
        <div style={{ display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/auth" className="btn btn-green" style={{ fontSize: "1rem", padding: "14px 32px" }}>
            GET STARTED
          </Link>
          <Link href="/events" className="btn" style={{ fontSize: "1rem", padding: "14px 32px" }}>
            BROWSE EVENTS
          </Link>
        </div>
      </div>
    </>
  );
}
