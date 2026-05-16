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
    <div style={{ padding: "clamp(20px, 5vw, 60px) clamp(16px, 4vw, 40px) 100px", maxWidth: "1200px", margin: "0 auto" }}>
      <div style={{ textAlign: "center", marginBottom: "40px" }}>
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200 }}>
          <Trophy size={48} color="var(--pink)" style={{ marginBottom: "16px" }} />
        </motion.div>
        <h1 className="font-bangers" style={{ fontSize: "clamp(3rem, 10vw, 5rem)", lineHeight: 1 }}>HALL OF FAME</h1>
        <p className="font-space" style={{ opacity: 0.85, marginTop: "12px", fontSize: "1.1rem", fontWeight: 500, maxWidth: "600px", margin: "12px auto 0" }}>
          The top contenders in the Veltrix Universe. Earn XP by registering and attending events.
        </p>
      </div>

      {myRank && (
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
          className="brutal-card my-rank-card" style={{ background: "var(--black)", color: "white", marginBottom: "40px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div className="font-bebas" style={{ opacity: 0.85, letterSpacing: "2px", fontSize: "0.9rem" }}>YOUR CURRENT STANDING</div>
            <div className="font-bangers rank-val" style={{ color: "var(--green)" }}>RANK #{myRank.rank}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div className="font-bangers xp-val">{myRank.xp} XP</div>
            <div className="font-space" style={{ opacity: 0.7, fontSize: "0.9rem" }}>Level {myRank.level}</div>
          </div>
        </motion.div>
      )}

      {/* Top 3 Podium */}
      {filteredEntries.length >= 3 && (
        <div className="podium-container">
          {/* Rank 2 */}
          <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}
            className="brutal-card card-blue podium-item rank-2">
            <div className="rank-badge">#2</div>
            <div className="font-bangers podium-name">{filteredEntries[1].name}</div>
            <div className="font-bebas podium-xp">{filteredEntries[1].xp} XP</div>
          </motion.div>
          {/* Rank 1 */}
          <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}
            className="brutal-card card-pink podium-item rank-1">
            <div className="rank-badge gold">#1</div>
            <Star className="podium-star" fill="var(--green)" stroke="var(--black)" strokeWidth={2} />
            <div className="font-bangers podium-name primary">{filteredEntries[0].name}</div>
            <div className="font-bebas podium-xp primary">{filteredEntries[0].xp} XP</div>
          </motion.div>
          {/* Rank 3 */}
          <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}
            className="brutal-card card-green podium-item rank-3">
            <div className="rank-badge">#3</div>
            <div className="font-bangers podium-name">{filteredEntries[2].name}</div>
            <div className="font-bebas podium-xp">{filteredEntries[2].xp} XP</div>
          </motion.div>
        </div>
      )}

      {/* List */}
      <div className="brutal-card leaderboard-list" style={{ padding: "0", background: "white" }}>
        {filteredEntries.slice(3).map((entry, idx) => (
          <div key={entry.id} className="list-item" style={{ borderBottom: idx === filteredEntries.length - 4 ? "none" : "2px solid var(--black)" }}>
            <div className="font-bangers rank-num">#{entry.rank}</div>
            <div style={{ flex: 1 }}>
              <div className="font-bangers name-text">{entry.name}</div>
              <div className="font-space level-text">Level {entry.level} {entry.department ? `· ${entry.department}` : ""}</div>
            </div>
            <div className="font-bangers xp-num">
              <Zap size={18} fill="currentColor" /> {entry.xp}
            </div>
          </div>
        ))}
      </div>

      <style jsx>{`
        .my-rank-card { padding: 30px; }
        .rank-val { font-size: 2.8rem; }
        .xp-val { font-size: 1.8rem; }

        .podium-container { 
          display: flex; justify-content: center; align-items: flex-end; gap: 20px; 
          margin-bottom: 80px; height: 320px; 
        }
        .podium-item { 
          display: flex; flexDirection: column; alignItems: center; justifyContent: center; 
          textAlign: center; position: relative; 
        }
        .rank-2 { width: 180px; height: 200px; }
        .rank-1 { width: 220px; height: 280px; z-index: 10; }
        .rank-3 { width: 180px; height: 160px; }
        
        .rank-badge { position: absolute; top: -20px; background: white; color: black; padding: 4px 12px; border: 2px solid black; font-family: 'Bangers'; font-size: 1.4rem; }
        .rank-badge.gold { top: -25px; background: var(--green); font-size: 1.8rem; padding: 4px 16px; }
        
        .podium-name { font-size: 1.6rem; line-height: 1.1; }
        .podium-name.primary { font-size: 2.2rem; }
        .podium-xp { margin-top: 8px; opacity: 0.8; font-size: 0.9rem; }
        .podium-xp.primary { font-size: 1.1rem; }
        .podium-star { margin-bottom: 12px; width: 36px; height: 36px; }

        .list-item { display: flex; align-items: center; padding: 16px 20px; }
        .rank-num { font-size: 1.6rem; width: 50px; color: var(--pink); }
        .name-text { font-size: 1.3rem; }
        .level-text { font-size: 0.8rem; opacity: 0.6; }
        .xp-num { font-size: 1.6rem; color: var(--green); display: flex; alignItems: center; gap: 6px; }

        @media (max-width: 768px) {
          .podium-container { flex-direction: column; height: auto; align-items: stretch; gap: 30px; }
          .podium-item { width: 100% !important; height: auto !important; padding: 30px 20px; }
          .rank-1 { order: 1; }
          .rank-2 { order: 2; }
          .rank-3 { order: 3; }
          .rank-badge { top: 12px; right: 12px; left: auto; }
          .rank-badge.gold { top: 12px; right: 12px; }
          .my-rank-card { padding: 20px; }
          .rank-val { font-size: 2.2rem; }
          .xp-val { font-size: 1.5rem; }
        }
      `}</style>
    </div>
    </div>
  );
}
