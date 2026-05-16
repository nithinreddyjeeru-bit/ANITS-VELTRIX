"use client";

import Link from "next/link";
import { useNotifications } from "@/lib/hooks/useNotifications";

export function NotificationsList() {
  const { notifications, unread, loading, markAllRead, markRead } = useNotifications();

  return (
    <section style={{ padding: "40px clamp(16px, 4vw, 40px) 100px", maxWidth: "900px", margin: "0 auto" }}>
      <div className="notif-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", gap: "16px" }}>
        <h2 className="font-bangers dash-title">
          ALERTS {unread > 0 ? `(${unread} NEW)` : ""}
        </h2>
        {unread > 0 && (
          <button type="button" className="btn btn-green mark-btn" onClick={markAllRead}>
            MARK ALL READ
          </button>
        )}
      </div>

      {loading ? (
        <p className="font-bangers" style={{ fontSize: "2rem", textAlign: "center" }}>SYNCING FEED...</p>
      ) : notifications.length === 0 ? (
        <div className="brutal-card" style={{ padding: "60px", textAlign: "center" }}>
          <p className="font-space" style={{ opacity: 0.6 }}>No notifications yet. Register for an event to get started.</p>
        </div>
      ) : (
        <div className="notif-feed" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {notifications.map((n) => (
            <div
              key={n.id}
              className="brutal-card notif-card"
              style={{
                padding: "20px",
                background: n.is_read ? "white" : "var(--cream)",
                borderLeft: n.is_read ? undefined : "6px solid var(--pink)",
                position: "relative"
              }}
            >
              <div className="notif-body-wrap" style={{ display: "flex", justifyContent: "space-between", gap: "20px" }}>
                <div style={{ flex: 1 }}>
                  <b className="font-bangers notif-title">{n.title}</b>
                  <p className="font-space notif-body">{n.body}</p>
                  <span className="font-space notif-date">
                    {new Date(n.created_at).toLocaleString()}
                  </span>
                </div>
                <div className="notif-actions" style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
                  {n.link && (
                    <Link href={n.link} className="btn action-btn">
                      OPEN
                    </Link>
                  )}
                  {!n.is_read && (
                    <button type="button" className="btn btn-pink action-btn" onClick={() => markRead(n.id)}>
                      READ
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <style jsx>{`
        .dash-title { font-size: clamp(1.8rem, 5vw, 2.5rem); }
        .notif-title { font-size: 1.3rem; line-height: 1.2; }
        .notif-body { margin-top: 6px; opacity: 0.75; font-size: 0.95rem; line-height: 1.5; }
        .notif-date { font-size: 0.75rem; opacity: 0.5; margin-top: 8px; display: block; }
        .action-btn { font-size: 0.85rem; padding: 8px 14px; }

        @media (max-width: 640px) {
          .notif-header { flex-direction: column; align-items: flex-start; }
          .mark-btn { width: 100%; justify-content: center; }
          .notif-body-wrap { flex-direction: column; }
          .notif-actions { width: 100%; margin-top: 10px; }
          .action-btn { flex: 1; justify-content: center; }
        }
      `}</style>
    </section>
  );
}
