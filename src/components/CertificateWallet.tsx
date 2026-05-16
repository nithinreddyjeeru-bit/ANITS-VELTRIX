"use client";

import Link from "next/link";
import { useCertificates } from "@/lib/hooks/useAdmin";
import { dashboardPathForRole } from "@/lib/auth-redirect";
import { useVeltrix } from "@/lib/store";

export function CertificateWallet() {
  const { user } = useVeltrix();
  const { certificates, loading } = useCertificates(user?.id);
  const dash = user ? dashboardPathForRole(user.role) : "/dashboard/student";

  return (
    <section style={{ padding: "40px 60px 100px" }}>
      <div className="brutal-card" style={{ marginBottom: "40px" }}>
        <h1 className="font-bangers" style={{ fontSize: "3rem" }}>THE VAULT</h1>
        <p className="font-space" style={{ opacity: 0.7, marginTop: "12px" }}>Verified certificates from completed events.</p>
        <div style={{ display: "flex", gap: "12px", marginTop: "20px", flexWrap: "wrap" }}>
          <Link href={dash} className="btn btn-green">BACK TO DASH</Link>
          <Link href="/events" className="btn">EARN MORE</Link>
        </div>
      </div>

      {loading ? (
        <p className="font-bangers" style={{ fontSize: "2rem" }}>LOADING VAULT...</p>
      ) : certificates.length === 0 ? (
        <div className="brutal-card card-pink" style={{ textAlign: "center", padding: "60px", color: "white" }}>
          <h2 className="font-bangers" style={{ fontSize: "2.5rem" }}>NO TROPHIES YET</h2>
          <p className="font-space" style={{ marginTop: "12px" }}>Attend events to unlock certificates.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "30px" }}>
          {certificates.map((cert: any) => (
            <article key={cert.id} className="brutal-card">
              <span className="tag tag-green">{cert.event?.category || "EVENT"}</span>
              <h3 className="font-bangers" style={{ fontSize: "1.6rem", marginTop: "12px" }}>{cert.title}</h3>
              <p className="font-space" style={{ fontSize: "0.85rem", opacity: 0.6 }}>
                {cert.event?.title} · {new Date(cert.issued_at).toLocaleDateString()}
              </p>
              <p className="font-bebas" style={{ marginTop: "8px", fontSize: "0.8rem", opacity: 0.5 }}>
                VERIFY: {cert.verify_code}
              </p>
              {cert.file_url ? (
                <a href={cert.file_url} target="_blank" rel="noreferrer" className="btn btn-black" style={{ width: "100%", marginTop: "16px", justifyContent: "center" }}>
                  DOWNLOAD PDF
                </a>
              ) : (
                <div className="btn" style={{ width: "100%", marginTop: "16px", justifyContent: "center", opacity: 0.5 }}>PDF PENDING</div>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
