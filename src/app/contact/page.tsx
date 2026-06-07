import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Us — VELTRIX",
  description: "Get in touch with the VELTRIX team at ANITS.",
};

const contacts = [
  {
    icon: "📧",
    label: "General Support",
    value: "support@veltrix.universe",
    href: "mailto:support@veltrix.universe",
    color: "var(--pink)",
  },
  {
    icon: "🔒",
    label: "Privacy Enquiries",
    value: "privacy@veltrix.universe",
    href: "mailto:privacy@veltrix.universe",
    color: "var(--green)",
  },
  {
    icon: "💸",
    label: "Refund Requests",
    value: "refunds@veltrix.universe",
    href: "mailto:refunds@veltrix.universe",
    color: "var(--orange, #ff8800)",
  },
  {
    icon: "⚖",
    label: "Legal",
    value: "legal@veltrix.universe",
    href: "mailto:legal@veltrix.universe",
    color: "var(--purple, #9b59b6)",
  },
];

const faqs = [
  {
    q: "I haven't received my verification email.",
    a: "Check your spam folder first. If it's not there, try signing out and signing back in — the platform will resend the verification link. Still no luck? Email support@veltrix.universe with your roll number.",
  },
  {
    q: "My certificate isn't showing up after an event.",
    a: "Certificates are generated within 24–48 hours of event completion. If it has been longer, contact the event coordinator or email support with your registration ID.",
  },
  {
    q: "I registered twice for the same event by mistake.",
    a: "Email refunds@veltrix.universe with your registration IDs and we'll cancel the duplicate and process a refund if applicable.",
  },
  {
    q: "How do I report inappropriate content or behaviour?",
    a: "Use the 'Report' button on any event or profile page, or email support@veltrix.universe directly. We take all reports seriously.",
  },
];

export default function ContactPage() {
  return (
    <>
      {/* Hero */}
      <div
        style={{
          background: "var(--black)",
          color: "white",
          padding: "80px var(--side-padding) 60px",
          borderBottom: "var(--border)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0, left: 0, right: 0, bottom: 0,
            background: "radial-gradient(ellipse at 50% 50%, rgba(255,0,102,0.07) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />
        <p className="font-space" style={{ color: "var(--green)", letterSpacing: "3px", fontSize: "0.85rem", marginBottom: "12px" }}>
          📡 REACH OUT
        </p>
        <h1 className="font-bangers" style={{ fontSize: "clamp(2.5rem, 6vw, 5rem)", color: "white", lineHeight: 1, marginBottom: "20px" }}>
          Contact <span style={{ color: "var(--pink)" }}>Us</span>
        </h1>
        <p className="font-space" style={{ opacity: 0.6, fontSize: "0.95rem", maxWidth: "600px" }}>
          We're here to help. Reach out via the channels below and we'll get back to you within 2 business days.
        </p>
      </div>

      {/* Contact Cards */}
      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "60px var(--side-padding) 0" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "24px", marginBottom: "80px" }}>
          {contacts.map((c) => (
            <a
              key={c.label}
              href={c.href}
              style={{
                background: "var(--black)",
                border: `3px solid ${c.color}`,
                color: "white",
                padding: "28px 24px",
                textDecoration: "none",
                display: "block",
                transition: "transform 0.2s, box-shadow 0.2s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(-4px)";
                (e.currentTarget as HTMLAnchorElement).style.boxShadow = `0 12px 40px ${c.color}33`;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(0)";
                (e.currentTarget as HTMLAnchorElement).style.boxShadow = "none";
              }}
            >
              <div style={{ fontSize: "2rem", marginBottom: "12px" }}>{c.icon}</div>
              <div className="font-bebas" style={{ color: c.color, letterSpacing: "2px", fontSize: "1rem", marginBottom: "8px" }}>{c.label}</div>
              <div className="font-space" style={{ fontSize: "0.85rem", opacity: 0.7, wordBreak: "break-all" }}>{c.value}</div>
            </a>
          ))}
        </div>

        {/* Address */}
        <div
          style={{
            background: "var(--black)",
            border: "var(--border)",
            padding: "40px",
            marginBottom: "80px",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: "40px",
          }}
        >
          <div>
            <h2 className="font-bebas" style={{ color: "var(--green)", fontSize: "1.3rem", letterSpacing: "2px", marginBottom: "12px" }}>
              📍 Our Location
            </h2>
            <p className="font-space" style={{ opacity: 0.7, lineHeight: "1.8", fontSize: "0.95rem" }}>
              Anil Neerukonda Institute of Technology and Sciences (ANITS)<br />
              Sangivalasa, Bheemunipatnam Mandal<br />
              Visakhapatnam, Andhra Pradesh<br />
              India — 531 163
            </p>
          </div>
          <div>
            <h2 className="font-bebas" style={{ color: "var(--green)", fontSize: "1.3rem", letterSpacing: "2px", marginBottom: "12px" }}>
              🕐 Response Times
            </h2>
            <p className="font-space" style={{ opacity: 0.7, lineHeight: "1.8", fontSize: "0.95rem" }}>
              General Support: within 2 business days<br />
              Refund Requests: within 5 business days<br />
              Privacy Requests: within 7 business days<br />
              Legal Enquiries: within 10 business days
            </p>
          </div>
        </div>

        {/* FAQ */}
        <h2 className="font-bangers" style={{ fontSize: "2.5rem", color: "var(--pink)", marginBottom: "32px" }}>
          Frequently Asked Questions
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "24px", marginBottom: "100px" }}>
          {faqs.map((f) => (
            <div
              key={f.q}
              style={{ borderLeft: "4px solid var(--green)", paddingLeft: "24px" }}
            >
              <p className="font-bebas" style={{ fontSize: "1.1rem", color: "white", letterSpacing: "1px", marginBottom: "8px" }}>
                {f.q}
              </p>
              <p className="font-space" style={{ opacity: 0.7, lineHeight: "1.7", fontSize: "0.9rem" }}>
                {f.a}
              </p>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
