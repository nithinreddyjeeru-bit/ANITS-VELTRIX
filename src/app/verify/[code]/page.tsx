"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { motion } from "framer-motion";
import { ShieldCheck, ShieldX, Award } from "lucide-react";

interface VerifiedCert {
  holder_name: string;
  title: string;
  event_title: string | null;
  issued_at: string;
}

export default function VerifyCertificatePage() {
  const { code } = useParams<{ code: string }>();
  const [loading, setLoading] = useState(true);
  const [cert, setCert] = useState<VerifiedCert | null>(null);

  useEffect(() => {
    const run = async () => {
      const { data } = await supabase.rpc("verify_certificate", { code });
      setCert((data && data[0]) || null);
      setLoading(false);
    };
    if (code) run();
  }, [code]);

  return (
    <div style={{ minHeight: "80vh", display: "flex", justifyContent: "center", alignItems: "center", padding: "40px 20px" }}>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        className="brutal-card" style={{ maxWidth: "520px", width: "100%", padding: "40px", background: "white", border: "4px solid black", boxShadow: "10px 10px 0 black", textAlign: "center" }}>
        {loading ? (
          <p className="font-bangers" style={{ fontSize: "2rem" }}>VERIFYING...</p>
        ) : cert ? (
          <>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: "16px" }}>
              <ShieldCheck size={64} color="var(--green)" />
            </div>
            <div className="sticker bg-green" style={{ marginBottom: "20px" }}>✓ AUTHENTIC CERTIFICATE</div>
            <Award size={32} style={{ margin: "0 auto 12px" }} />
            <h1 className="font-bangers" style={{ fontSize: "2rem", lineHeight: 1.1 }}>{cert.title}</h1>
            <p className="font-space" style={{ marginTop: "16px", fontSize: "1.1rem" }}>
              Issued to <strong>{cert.holder_name}</strong>
            </p>
            {cert.event_title && (
              <p className="font-space" style={{ opacity: 0.7 }}>for <strong>{cert.event_title}</strong></p>
            )}
            <p className="font-bebas" style={{ opacity: 0.5, marginTop: "12px", letterSpacing: "1px" }}>
              ISSUED {new Date(cert.issued_at).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
            </p>
            <p className="font-space" style={{ opacity: 0.4, fontSize: "0.75rem", marginTop: "16px" }}>
              VERIFY CODE: {String(code).toUpperCase()}
            </p>
          </>
        ) : (
          <>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: "16px" }}>
              <ShieldX size={64} color="var(--pink)" />
            </div>
            <div className="sticker bg-pink" style={{ marginBottom: "20px", color: "white" }}>✗ NOT FOUND</div>
            <h1 className="font-bangers" style={{ fontSize: "2rem" }}>INVALID CERTIFICATE</h1>
            <p className="font-space" style={{ opacity: 0.7, marginTop: "12px" }}>
              No certificate matches code <strong>{String(code).toUpperCase()}</strong>. It may be mistyped or revoked.
            </p>
          </>
        )}
        <Link href="/" className="btn btn-black" style={{ marginTop: "28px", justifyContent: "center" }}>BACK TO VELTRIX</Link>
      </motion.div>
    </div>
  );
}
