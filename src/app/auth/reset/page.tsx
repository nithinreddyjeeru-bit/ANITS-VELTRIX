"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { motion } from "framer-motion";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // Supabase appends a recovery session to the URL hash; wait for it to land.
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      setMessage("Error: Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setMessage("Error: Passwords do not match.");
      return;
    }
    setLoading(true);
    setMessage("");
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setMessage(`Error: ${error.message}`);
      setLoading(false);
      return;
    }
    setMessage("Password updated! Redirecting to login...");
    setTimeout(() => router.replace("/auth"), 1800);
  };

  return (
    <div style={{ display: "flex", justifyContent: "center", padding: "clamp(40px, 8vw, 80px) 20px" }}>
      <div className="card" style={{ width: "100%", maxWidth: "480px", background: "white", padding: "40px", border: "4px solid black", boxShadow: "8px 8px 0 black" }}>
        <h1 className="font-bangers" style={{ fontSize: "2.4rem", marginBottom: "8px" }}>RESET PASSWORD</h1>
        <p className="font-space" style={{ opacity: 0.7, marginBottom: "24px" }}>
          Choose a new password to re-enter the universe.
        </p>

        {!ready ? (
          <p className="font-bebas" style={{ opacity: 0.6 }}>VALIDATING RESET LINK...</p>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <label className="font-space" style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <span className="font-bebas">NEW PASSWORD</span>
              <input className="brutal-card" type="password" value={password} minLength={6} required
                onChange={(e) => setPassword(e.target.value)}
                style={{ padding: "14px", border: "3px solid black" }} placeholder="••••••••" disabled={loading} />
            </label>
            <label className="font-space" style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <span className="font-bebas">CONFIRM PASSWORD</span>
              <input className="brutal-card" type="password" value={confirm} minLength={6} required
                onChange={(e) => setConfirm(e.target.value)}
                style={{ padding: "14px", border: "3px solid black" }} placeholder="••••••••" disabled={loading} />
            </label>
            <button type="submit" className="btn btn-green" disabled={loading}
              style={{ padding: "16px", justifyContent: "center", fontSize: "1.3rem" }}>
              {loading ? "UPDATING..." : "UPDATE PASSWORD"}
            </button>
          </form>
        )}

        {message && (
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="sticker"
            style={{ marginTop: "20px", textAlign: "center", background: message.includes("Error") ? "var(--pink)" : "var(--green)", color: message.includes("Error") ? "white" : "black" }}>
            {message}
          </motion.div>
        )}
      </div>
    </div>
  );
}
