"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";

export function AdminAttendanceScanner({
  onClose,
  eventOwnerId,
}: {
  onClose: () => void;
  eventOwnerId?: string;
}) {
  const [status, setStatus] = useState<string>("Point camera at student QR code");
  const [success, setSuccess] = useState(false);
  const scannerRef = useRef<{ clear: () => Promise<void> | void } | null>(null);
  const clearingRef = useRef(false);

  const clearScanner = async () => {
    if (!scannerRef.current || clearingRef.current) return;
    clearingRef.current = true;
    const scanner = scannerRef.current;
    scannerRef.current = null;
    try {
      await scanner.clear();
    } catch {
      /* html5-qrcode can throw if it is already stopping; safe to ignore. */
    } finally {
      clearingRef.current = false;
    }
  };

  useEffect(() => {
    let cancelled = false;

    const start = async () => {
      const { Html5QrcodeScanner } = await import("html5-qrcode");
      if (cancelled) return;

      const instance = new Html5QrcodeScanner("admin-qr-reader", { fps: 8, qrbox: 250 }, false);
      scannerRef.current = instance;

      instance.render(
        async (decodedText: string) => {
          try {
            const payload = JSON.parse(decodedText) as { token?: string; event_id?: string; app?: string };
            if (!payload.token || payload.app !== "veltrix") {
              setStatus("Invalid Veltrix QR");
              return;
            }

            const { data: reg } = await supabase
              .from("registrations")
              .select("user_id, event_id, event:events(created_by)")
              .eq("qr_token", payload.token)
              .single();

            if (!reg) {
              setStatus("Registration not found");
              return;
            }

            const event = Array.isArray(reg.event) ? reg.event[0] : reg.event;
            if (eventOwnerId && event?.created_by !== eventOwnerId) {
              setStatus("This QR belongs to another creator's event");
              return;
            }

            const { data: { user } } = await supabase.auth.getUser();
            const { error } = await supabase.from("attendance").insert({
              user_id: reg.user_id,
              event_id: reg.event_id,
              scanned_by: user?.id,
            });

            if (error) {
              if (error.code === "23505") setStatus("Already checked in");
              else setStatus(error.message);
              return;
            }

            setSuccess(true);
            setStatus("Attendance marked! XP awarded via database trigger.");
            await clearScanner();
          } catch {
            setStatus("Could not read QR data");
          }
        },
        () => {}
      );
    };

    start();
    return () => {
      cancelled = true;
      void clearScanner();
    };
  }, [eventOwnerId]);

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
      <div className="brutal-card" style={{ maxWidth: "520px", width: "100%", padding: "32px", background: "var(--cream)" }}>
        <h2 className="font-bangers" style={{ fontSize: "2rem" }}>SCAN ATTENDANCE</h2>
        <p className="font-space" style={{ marginTop: "8px", opacity: 0.7 }}>{status}</p>
        <div id="admin-qr-reader" style={{ marginTop: "20px", display: success ? "none" : "block" }} />
        <button
          type="button"
          className="btn btn-pink"
          style={{ width: "100%", marginTop: "20px", justifyContent: "center" }}
          onClick={async () => {
            await clearScanner();
            onClose();
          }}
        >
          CLOSE
        </button>
      </div>
    </div>
  );
}
