"use client";

import { useState } from "react";
import { useEventTeams } from "@/lib/hooks/useTeams";

export function TeamPortal({
  eventId,
  maxSize,
  isRegistered,
}: {
  eventId: string;
  maxSize: number;
  isRegistered: boolean;
}) {
  const { teams, myTeam, loading, createTeam, joinTeam, leaveTeam } = useEventTeams(eventId);
  const [squadName, setSquadName] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  if (!isRegistered) {
    return (
      <div className="brutal-card" style={{ marginTop: "24px", padding: "24px" }}>
        <h3 className="font-bangers" style={{ fontSize: "1.5rem" }}>SQUAD FORMATION</h3>
        <p className="font-space" style={{ marginTop: "8px", opacity: 0.7 }}>
          Register for this event first, then create or join a squad.
        </p>
      </div>
    );
  }

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setMsg("");
    try {
      await fn();
    } catch (e: unknown) {
      setMsg(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="brutal-card" style={{ marginTop: "24px", padding: "24px" }}>
      <h3 className="font-bangers" style={{ fontSize: "1.8rem" }}>SQUAD FORMATION</h3>
      <p className="font-space" style={{ fontSize: "0.9rem", opacity: 0.65, marginTop: "6px" }}>
        Max {maxSize} fighters per squad · synced live
      </p>

      {loading ? (
        <p className="font-bebas" style={{ marginTop: "16px" }}>LOADING SQUADS...</p>
      ) : myTeam ? (
        <div style={{ marginTop: "20px" }}>
          <span className="tag tag-green">{myTeam.name}</span>
          <div style={{ marginTop: "12px", display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {myTeam.members.map((m) => (
              <span key={m.id} className="tag" style={{ background: "var(--black)", color: "white" }}>
                {m.profile?.name || "Member"} {m.role === "leader" ? "★" : ""}
              </span>
            ))}
          </div>
          <p className="font-space" style={{ marginTop: "8px", fontSize: "0.85rem", opacity: 0.6 }}>
            {myTeam.member_count}/{myTeam.max_size} members
          </p>
          <button
            type="button"
            className="btn btn-pink"
            style={{ marginTop: "16px", width: "100%", justifyContent: "center" }}
            disabled={busy}
            onClick={() => run(leaveTeam)}
          >
            LEAVE SQUAD
          </button>
        </div>
      ) : (
        <>
          <div style={{ marginTop: "20px", display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <input
              className="brutal-card font-space"
              placeholder="Your squad name..."
              value={squadName}
              onChange={(e) => setSquadName(e.target.value)}
              style={{ flex: 1, minWidth: "180px", padding: "12px" }}
            />
            <button
              type="button"
              className="btn btn-green"
              disabled={busy || !squadName.trim()}
              onClick={() =>
                run(async () => {
                  await createTeam(squadName, maxSize);
                  setSquadName("");
                })
              }
            >
              CREATE SQUAD
            </button>
          </div>

          {teams.filter((t) => t.member_count < t.max_size).length > 0 && (
            <div style={{ marginTop: "28px" }}>
              <h4 className="font-bebas" style={{ letterSpacing: "2px", marginBottom: "12px" }}>JOIN OPEN SQUAD</h4>
              {teams
                .filter((t) => t.member_count < t.max_size)
                .map((t) => (
                  <div
                    key={t.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "12px",
                      border: "2px solid var(--black)",
                      marginBottom: "8px",
                      background: "var(--cream)",
                    }}
                  >
                    <div>
                      <b className="font-bangers">{t.name}</b>
                      <span className="font-space" style={{ marginLeft: "10px", fontSize: "0.8rem", opacity: 0.6 }}>
                        {t.member_count}/{t.max_size}
                      </span>
                    </div>
                    <button
                      type="button"
                      className="btn"
                      style={{ padding: "6px 14px", fontSize: "0.85rem" }}
                      disabled={busy}
                      onClick={() => run(async () => joinTeam(t.id))}
                    >
                      JOIN
                    </button>
                  </div>
                ))}
            </div>
          )}
        </>
      )}

      {msg && (
        <p className="font-space" style={{ color: "var(--pink)", marginTop: "12px", fontSize: "0.9rem" }}>
          {msg}
        </p>
      )}
    </div>
  );
}
