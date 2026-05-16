import { PageHero, UtilityCards, FlowStrip } from "@/components/VeltrixUI";
import { features } from "@/lib/veltrix-data";

const COLORS = ["var(--green)", "var(--pink)", "var(--blue)", "var(--orange)", "var(--purple)"];

export default function AboutPage() {
  return (
    <>
      <PageHero
        kicker="About us"
        title="The event universe for ANITS."
        accentWord="ANITS."
        copy="VELTRIX brings events, clubs, certificates, leaderboards, and student identity into one clean campus platform."
        action={{ label: "Browse events", href: "/events" }}
        secondaryAction={{ label: "Join a club", href: "/clubs" }}
      />
      <div className="section-band">HOW IT WORKS — 4 STEPS</div>
      <FlowStrip />
      <UtilityCards
        items={features.map((item, i) => ({
          title: item.title,
          copy: item.copy,
          icon: item.icon,
          color: COLORS[i % COLORS.length],
          href: item.title.toLowerCase().includes("leader") ? "/leaderboard" : "/events",
        }))}
      />
    </>
  );
}
