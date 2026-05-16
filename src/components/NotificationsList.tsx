"use client";

import Link from "next/link";
import { useNotifications } from "@/lib/hooks/useNotifications";

export function NotificationsList() {
  const { notifications, unread, loading, markAllRead, markRead } = useNotifications();

  return (
    <section style={{ padding: "40px 60px 100px", maxWidth: "900px", margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "12px" }}>
        <h2 className="font-bangers" style={{ fontSize: "2rem" }}>
          ALERTS {unread > 0 ? `(${unread} NEW)` : ""}
        </h2>
        {unread > 0 && (
          <button type="button" className="btn btn-green" onClick={markAllRead}>
            MARK ALL READ
          </button>
        )}
      </div>

      {loading ? (
        <p className="font-bangers">SYNCING FEED...</p>
      ) : notifications.length === 0 ? (
        <div className="brutal-card" style={{ padding: "60px", textAlign: "center" }}>
          <p className="font-space" style={{ opacity: 0.6 }}>No notifications yet. Register for an event to get started.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {notifications.map((n) => (
            <div
              key={n.id}
              className="brutal-card"
              style={{
                padding: "20px",
                background: n.is_read ? "white" : "var(--cream)",
                borderLeft: n.is_read ? undefined : "6px solid var(--pink)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: "16px", flexWrap: "wrap" }}>
                <div>
                  <b className="font-bangers" style={{ fontSize: "1.2rem" }}>{n.title}</b>
                  <p className="font-space" style={{ marginTop: "6px", opacity: 0.75 }}>{n.body}</p>
                  <span className="font-space" style={{ fontSize: "0.75rem", opacity: 0.5 }}>
                    {new Date(n.created_at).toLocaleString()}
                  </span>
                </div>
                <div style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
                  {n.link && (
                    <Link href={n.link} className="btn" style={{ fontSize: "0.85rem", padding: "6px 12px" }}>
                      OPEN
                    </Link>
                  )}
                  {!n.is_read && (
                    <button type="button" className="btn btn-pink" style={{ fontSize: "0.85rem", padding: "6px 12px" }} onClick={() => markRead(n.id)}>
                      READ
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
