"use client";

import Link from "next/link";
import { motion } from "framer-motion";

const registrationSteps = [
  { label: "Discover event", bg: "var(--green)" },
  { label: "Register & get QR", bg: "var(--pink)" },
  { label: "Attend & earn XP", bg: "var(--blue)" },
  { label: "Claim certificate", bg: "var(--orange)" },
];

const MISSION_COLORS = ["var(--green)", "var(--pink)", "var(--blue)", "var(--orange)", "var(--purple)"];

export { AuthWorkflow } from "./AuthWorkflow";
export { CertificateWallet } from "./CertificateWallet";
export { NotificationsList } from "./NotificationsList";
export { EventCreationForm } from "./EventCreationForm";

export function FeatureBand({
  features,
}: {
  features: { icon: string; title: string; copy: string }[];
}) {
  return (
    <section className="mission-grid">
      {features.map((feature, i) => (
        <motion.div
          key={feature.title}
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.05 }}
        >
          <Link
            className="mission-card"
            href={feature.title.toLowerCase().includes("cert") ? "/certificates" : "/events"}
            style={{ "--mc-accent": MISSION_COLORS[i % MISSION_COLORS.length] } as React.CSSProperties}
          >
            <span className="mc-icon">{feature.icon}</span>
            <h3>{feature.title}</h3>
            <p>{feature.copy}</p>
            <span className="mc-go">Enter →</span>
          </Link>
        </motion.div>
      ))}
    </section>
  );
}

export function PageHero({
  kicker,
  title,
  copy,
  action,
  secondaryAction,
  accentWord,
}: {
  kicker: string;
  title: string;
  copy: string;
  accentWord?: string;
  action?: { label: string; href?: string; onClick?: () => void };
  secondaryAction?: { label: string; href?: string; onClick?: () => void };
}) {
  const words = title.split(" ");
  const accent = accentWord ?? words[words.length - 1];
  const lead = accentWord ? words.join(" ").replace(accentWord, "").trim() || title : words.slice(0, -1).join(" ") || title;
  const showAccent = accent && lead !== title;

  return (
    <section className="page-hero">
      <div className="halftone" />
      <motion.div
        className="page-hero-inner page-hero-grid"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div>
          <span className="hero-kicker">{kicker}</span>
          <h1 className="page-hero-title">
            {showAccent ? (
              <>
                {lead}
                <span className="accent">{accent}</span>
              </>
            ) : (
              title
            )}
          </h1>
        </div>
        <div>
          <p className="hero-copy">{copy}</p>
          {(action || secondaryAction) && (
            <div className="hero-actions-row">
              {action &&
                (action.href ? (
                  <Link className="funk-btn lime" href={action.href}>
                    {action.label}
                  </Link>
                ) : (
                  <button className="funk-btn lime" type="button" onClick={action.onClick}>
                    {action.label}
                  </button>
                ))}
              {secondaryAction &&
                (secondaryAction.href ? (
                  <Link className="funk-btn black" href={secondaryAction.href}>
                    {secondaryAction.label}
                  </Link>
                ) : (
                  <button className="funk-btn black" type="button" onClick={secondaryAction.onClick}>
                    {secondaryAction.label}
                  </button>
                ))}
            </div>
          )}
        </div>
      </motion.div>
    </section>
  );
}

export function UtilityCards({
  items,
}: {
  items: { title: string; copy: string; color?: string; href?: string; icon?: string }[];
}) {
  return (
    <section className="mission-grid">
      {items.map((item, i) => {
        const card = (
          <article
            className="mission-card"
            style={{ "--mc-accent": item.color ?? MISSION_COLORS[i % MISSION_COLORS.length] } as React.CSSProperties}
          >
            <span className="mc-icon">{item.icon ?? String(i + 1).padStart(2, "0")}</span>
            <h3>{item.title}</h3>
            <p>{item.copy}</p>
            <span className="mc-go">Explore →</span>
          </article>
        );
        return item.href ? (
          <Link key={item.title} href={item.href} style={{ textDecoration: "none", color: "inherit" }}>
            {card}
          </Link>
        ) : (
          <div key={item.title}>{card}</div>
        );
      })}
    </section>
  );
}

export function FlowStrip() {
  return (
    <section className="flow-strip">
      {registrationSteps.map((step, index) => (
        <div
          className="flow-step"
          key={step.label}
          style={{ "--step-bg": step.bg } as React.CSSProperties}
        >
          <span>0{index + 1}</span>
          <b>{step.label}</b>
        </div>
      ))}
    </section>
  );
}

export function LiveMarquee() {
  const items = [
    "Registrations open — Code Wars 2026",
    "New leaderboard rewards",
    "Certificate wallet updated",
    "ANITS Veltrix Season 1",
  ];

  return (
    <section className="funk-marquee">
      <motion.div animate={{ x: [0, -800] }} transition={{ repeat: Infinity, duration: 24, ease: "linear" }}>
        {[...items, ...items].map((item, index) => (
          <span key={`${item}-${index}`}>{item}</span>
        ))}
      </motion.div>
    </section>
  );
}
