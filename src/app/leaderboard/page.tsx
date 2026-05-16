"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLeaderboard } from "@/lib/hooks/useLeaderboard";
import { Trophy, Medal, Star, Zap } from "lucide-react";

export default function LeaderboardPage() {
  const { entries, loading, myRank } = useLeaderboard(100);
  const [filter, setFilter] = useState("all");

  const filteredEntries = filter === "all" ? entries : entries.filter(e => e.department.toLowerCase() === filter.toLowerCase());

  if (loading) return (
    <div style={{ padding: "100px", textAlign: "center" }}>
      <motion.div className="font-bangers" style={{ fontSize: "4rem", opacity: 0.85 }} animate={{ opacity: [0.6, 1, 0.6] }} transition={{ repeat: Infinity, duration: 1.5 }}>
        CALCULATING RANKS...
      </motion.div>
    </div>
  );

  return (
    <div style={{ padding: "60px", maxWidth: "1200px", margin: "0 auto", paddingBottom: "100px" }}>
      <div style={{ textAlign: "center", marginBottom: "60px" }}>
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200 }}>
          <Trophy size={64} color="var(--pink)" style={{ marginBottom: "20px" }} />
        </motion.div>
        <h1 className="font-bangers" style={{ fontSize: "5rem", lineHeight: 1 }}>HALL OF FAME</h1>
        <p className="font-space" style={{ opacity: 0.85, marginTop: "12px", fontSize: "1.2rem", fontWeight: 500 }}>
          The top contenders in the Veltrix Universe. Earn XP by registering and attending events.
        </p>
      </div>

      {myRank && (
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
          className="brutal-card" style={{ background: "var(--black)", color: "white", marginBottom: "40px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div className="font-bebas" style={{ opacity: 0.85, letterSpacing: "2px" }}>YOUR CURRENT STANDING</div>
            <div className="font-bangers" style={{ fontSize: "3rem", lineHeight: 1.2, color: "var(--green)" }}>RANK #{myRank.rank}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div className="font-bangers" style={{ fontSize: "2rem" }}>{myRank.xp} XP</div>
            <div className="font-space" style={{ opacity: 0.7 }}>Level {myRank.level}</div>
          </div>
        </motion.div>
      )}

      {/* Top 3 Podium */}
      {filteredEntries.length >= 3 && (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "flex-end", gap: "20px", marginBottom: "60px", height: "300px" }}>
          {/* Rank 2 */}
          <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}
            className="brutal-card card-blue" style={{ width: "200px", height: "200px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", position: "relative" }}>
            <div style={{ position: "absolute", top: "-20px", background: "white", color: "var(--black)", padding: "4px 12px", border: "2px solid var(--black)", fontFamily: "Bangers", fontSize: "1.5rem" }}>#2</div>
            <div className="font-bangers" style={{ fontSize: "2rem", lineHeight: 1.1 }}>{filteredEntries[1].name}</div>
            <div className="font-bebas" style={{ marginTop: "8px", opacity: 0.8 }}>{filteredEntries[1].xp} XP</div>
          </motion.div>
          {/* Rank 1 */}
          <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}
            className="brutal-card card-pink" style={{ width: "220px", height: "260px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", position: "relative", zIndex: 10 }}>
            <div style={{ position: "absolute", top: "-25px", background: "var(--green)", color: "var(--black)", padding: "4px 16px", border: "2px solid var(--black)", fontFamily: "Bangers", fontSize: "2rem" }}>#1</div>
            <Star size={40} fill="var(--green)" stroke="var(--black)" strokeWidth={2} style={{ marginBottom: "12px" }} />
            <div className="font-bangers" style={{ fontSize: "2.5rem", lineHeight: 1.1 }}>{filteredEntries[0].name}</div>
            <div className="font-bebas" style={{ marginTop: "8px", opacity: 0.8, fontSize: "1.2rem" }}>{filteredEntries[0].xp} XP</div>
          </motion.div>
          {/* Rank 3 */}
          <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}
            className="brutal-card card-green" style={{ width: "200px", height: "160px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", position: "relative" }}>
            <div style={{ position: "absolute", top: "-20px", background: "white", color: "var(--black)", padding: "4px 12px", border: "2px solid var(--black)", fontFamily: "Bangers", fontSize: "1.5rem" }}>#3</div>
            <div className="font-bangers" style={{ fontSize: "1.8rem", lineHeight: 1.1 }}>{filteredEntries[2].name}</div>
            <div className="font-bebas" style={{ marginTop: "8px", opacity: 0.8 }}>{filteredEntries[2].xp} XP</div>
          </motion.div>
        </div>
      )}

      {/* List */}
      <div className="brutal-card" style={{ padding: "0" }}>
        {filteredEntries.slice(3).map((entry, idx) => (
          <div key={entry.id} style={{ display: "flex", alignItems: "center", padding: "20px 30px", borderBottom: idx === filteredEntries.length - 4 ? "none" : "2px solid var(--black)" }}>
            <div className="font-bangers" style={{ fontSize: "2rem", width: "60px", color: "var(--pink)" }}>#{entry.rank}</div>
            <div style={{ flex: 1 }}>
              <div className="font-bangers" style={{ fontSize: "1.5rem" }}>{entry.name}</div>
              <div className="font-space" style={{ fontSize: "0.85rem", opacity: 0.6 }}>Level {entry.level} {entry.department ? `· ${entry.department}` : ""}</div>
            </div>
            <div className="font-bangers" style={{ fontSize: "2rem", color: "var(--green)", display: "flex", alignItems: "center", gap: "8px" }}>
              <Zap size={24} fill="currentColor" /> {entry.xp}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
