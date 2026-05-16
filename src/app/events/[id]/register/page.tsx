"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { Event } from "@/lib/types";
import { CheckCircle, ArrowLeft, Calendar, MapPin, QrCode, ShieldCheck, Ticket } from "lucide-react";
import QRCode from "qrcode";

export default function RegisterPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState<"confirm" | "success">("confirm");
  const [qrToken, setQrToken] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [error, setError] = useState("");
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/auth"); return; }
      setUserId(user.id);

      const { data: ev } = await supabase.from("events").select("*").eq("id", id).single();
      setEvent(ev);

      // Check already registered
      const { data: existing } = await supabase.from("registrations").select("qr_token")
        .eq("event_id", id).eq("user_id", user.id).single();
      if (existing) {
        setQrToken(existing.qr_token);
        generateQR(existing.qr_token);
        setStep("success");
      }
      setLoading(false);
    };
    if (id) init();
  }, [id, router]);

  const generateQR = async (token: string) => {
    const qrData = JSON.stringify({ token, event_id: id, app: "veltrix" });
    const url = await QRCode.toDataURL(qrData, { width: 300, margin: 2, color: { dark: "#0B0B0B", light: "#FFF6E3" } });
    setQrDataUrl(url);
  };

  const handleRegister = async () => {
    if (!userId || !event) return;
    setSubmitting(true);
    setError("");
    try {
      // Check capacity
      const { count } = await supabase.from("registrations").select("*", { count: "exact", head: true }).eq("event_id", id);
      if ((count || 0) >= event.max_seats) throw new Error("This event is full!");

      // Insert registration
      const { data: reg, error: regErr } = await supabase
        .from("registrations")
        .insert({ user_id: userId, event_id: id })
        .select("qr_token")
        .single();
      if (regErr) throw regErr;

      // Generate QR
      const token = reg.qr_token;
      setQrToken(token);
      await generateQR(token);

      // Create notification
      await supabase.from("notifications").insert({
        user_id: userId,
        title: `Registered for ${event.title}!`,
        body: `Your spot is confirmed. Show your QR code at the venue to mark attendance and earn XP.`,
        type: "success",
        link: `/events/${id}`
      });

      setStep("success");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div style={{ padding: "80px", textAlign: "center" }}>
      <motion.div className="font-bangers" style={{ fontSize: "3rem" }}
        animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1 }}>
        LOADING...
      </motion.div>
    </div>
  );

  return (
    <div className="register-page">
      <AnimatePresence mode="wait">
        {step === "confirm" && (
          <motion.div key="confirm" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
            className="register-shell">
            <section className="register-summary">
              <Link href={`/events/${id}`} className="font-bebas register-back"><ArrowLeft size={16} /> BACK TO EVENT</Link>
              <div className="sticker sticker-pink" style={{ marginBottom: "18px" }}>CONFIRM ENTRY</div>
              <h1 className="font-bangers">Lock in your spot</h1>
              <p className="font-space">Review your event pass details before we generate your QR code.</p>

              <div className="register-benefits">
                <span><Ticket size={18} /> Confirmed seat</span>
                <span><QrCode size={18} /> QR entry pass</span>
                <span><ShieldCheck size={18} /> Attendance verified XP</span>
              </div>
            </section>

            <section className="brutal-card register-confirm-card">
              <div className="font-bebas" style={{ opacity: 0.55, letterSpacing: "2px" }}>REGISTERING FOR</div>
              <div className="font-bangers" style={{ fontSize: "2.4rem", lineHeight: 1, marginTop: "8px" }}>{event?.title}</div>
              <div className="register-event-meta">
                <span><Calendar size={16} /> {new Date(event?.event_date || "").toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}</span>
                {event?.venue && <span><MapPin size={16} /> {event.venue}</span>}
              </div>
              <div className="register-reward-row">
                <div className="sticker" style={{ fontSize: "1rem" }}>+{event?.xp_reward} XP after attendance</div>
              </div>

              {error && (
                <div className="brutal-card card-pink" style={{ padding: "16px", marginBottom: "20px", color: "white" }}>
                  <span className="font-bebas">{error}</span>
                </div>
              )}

              <motion.button
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={handleRegister} disabled={submitting}
                className="btn btn-green" style={{ width: "100%", justifyContent: "center", padding: "18px", fontSize: "1.3rem" }}>
                {submitting ? (
                  <motion.span animate={{ opacity: [1, 0.4, 1] }} transition={{ repeat: Infinity, duration: 0.8 }}>
                    REGISTERING...
                  </motion.span>
                ) : "GENERATE MY EVENT PASS"}
              </motion.button>
            </section>
          </motion.div>
        )}

        {step === "success" && (
          <motion.div key="success" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
            className="brutal-card registration-pass" style={{ textAlign: "center" }}>

            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
              style={{ marginBottom: "24px", display: "flex", justifyContent: "center" }}>
              <CheckCircle size={80} color="var(--green)" strokeWidth={2} />
            </motion.div>

            <div className="sticker" style={{ marginBottom: "20px" }}>EVENT PASS READY</div>
            <h1 className="font-bangers" style={{ fontSize: "3.5rem", lineHeight: 1, marginBottom: "8px" }}>
              REGISTRATION CONFIRMED
            </h1>
            <p className="font-space" style={{ opacity: 0.6, marginBottom: "32px" }}>
              Show this QR code at the venue entrance. Keep this pass handy.
            </p>

            {/* QR Code */}
            {qrDataUrl && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
                style={{ display: "inline-block", border: "var(--border)", boxShadow: "var(--shadow)", padding: "20px", background: "var(--cream)", marginBottom: "24px" }}>
                <img src={qrDataUrl} alt="QR Code" style={{ width: "240px", height: "240px", display: "block" }} />
                <div className="font-bebas" style={{ fontSize: "0.75rem", opacity: 0.5, marginTop: "8px", letterSpacing: "2px" }}>
                  TOKEN: {qrToken?.slice(0, 8).toUpperCase()}...
                </div>
              </motion.div>
            )}

            <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
              <a href={qrDataUrl} download={`veltrix-qr-${id}.png`} className="btn btn-black" style={{ fontSize: "0.9rem" }}>
                DOWNLOAD QR
              </a>
              <Link href="/dashboard/student" className="btn btn-green" style={{ fontSize: "0.9rem" }}>
                VIEW DASHBOARD →
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
