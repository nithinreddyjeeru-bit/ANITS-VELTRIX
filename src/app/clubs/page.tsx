"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { PageHero } from "@/components/VeltrixUI";
import { useClubs } from "@/lib/hooks/useClubs";
import { Users, ArrowRight } from "lucide-react";

export default function ClubsPage() {
  const [search, setSearch] = useState("");
  const { clubs, loading, error } = useClubs(search || undefined);

  return (
    <>
      <PageHero
        kicker="Club zone"
        title="Join crews that make campus louder."
        copy="Coding, robotics, dance, esports, and culture clubs — live from Supabase."
      />

      <section style={{ padding: "0 60px 100px" }}>
        <div className="brutal-card" style={{ padding: "24px", marginBottom: "40px", display: "flex", gap: "16px", flexWrap: "wrap", alignItems: "center" }}>
          <input
            className="font-space"
            placeholder="Search clubs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ flex: 1, minWidth: "200px", padding: "12px", border: "3px solid var(--black)" }}
          />
          <span className="font-bebas" style={{ opacity: 0.6 }}>{clubs.length} CREWS</span>
        </div>

        {loading ? (
          <p className="font-bangers" style={{ fontSize: "2rem" }}>LOADING CLUBS...</p>
        ) : error ? (
          <div className="brutal-card card-pink" style={{ padding: "40px" }}>{error}</div>
        ) : clubs.length === 0 ? (
          <div className="brutal-card" style={{ padding: "60px", textAlign: "center" }}>
            <p className="font-bangers" style={{ fontSize: "2rem" }}>NO CLUBS FOUND</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "32px" }}>
            {clubs.map((club, i) => (
              <motion.div key={club.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <Link href={`/clubs/${club.id}`} style={{ textDecoration: "none", color: "inherit" }}>
                  <article className="brutal-card" style={{ padding: "28px", height: "100%" }}>
                    <span className="tag">{club.category || "General"}</span>
                    <h3 className="font-bangers" style={{ fontSize: "2rem", marginTop: "12px", lineHeight: 1 }}>{club.name}</h3>
                    <p className="font-space" style={{ marginTop: "10px", opacity: 0.75, fontSize: "0.9rem", lineHeight: 1.5 }}>
                      {club.description || "Join the crew."}
                    </p>
                    <div style={{ marginTop: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span className="font-space" style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.85rem" }}>
                        <Users size={16} /> {club.member_count} members
                      </span>
                      <span className="font-bebas" style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        JOIN <ArrowRight size={16} />
                      </span>
                    </div>
                  </article>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
