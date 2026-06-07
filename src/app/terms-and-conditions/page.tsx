import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms and Conditions — VELTRIX",
  description: "Terms governing the use of the VELTRIX campus events platform.",
};

const sections = [
  {
    title: "1. Acceptance of Terms",
    body: `By creating an account or using any part of the VELTRIX platform, you agree to be bound by these Terms and Conditions. If you do not agree, please do not use VELTRIX. These terms apply to all visitors, registered users, event coordinators, and club administrators.`,
  },
  {
    title: "2. Eligibility",
    body: `VELTRIX is intended for enrolled students, faculty, and staff of Anil Neerukonda Institute of Technology and Sciences (ANITS). You must register with a valid institutional email address. Misrepresenting your identity or affiliation is grounds for immediate account suspension.`,
  },
  {
    title: "3. User Accounts",
    body: `You are responsible for maintaining the confidentiality of your account credentials. You agree to notify us immediately at support@veltrix.universe if you suspect any unauthorised access to your account. VELTRIX is not liable for any loss or damage arising from your failure to protect your credentials.`,
  },
  {
    title: "4. Event Registration",
    body: `Registering for an event through VELTRIX constitutes a commitment to participate. Cancellations are subject to the Refund Policy of this platform. Coordinators reserve the right to disqualify participants for misconduct, rule violations, or providing false information during registration.`,
  },
  {
    title: "5. Certificates and XP",
    body: `Certificates issued through VELTRIX are linked to verified participation records. Attempting to fraudulently claim participation, XP, or certificates will result in permanent account termination and may be reported to college authorities. Certificates are digitally generated and carry a unique verification code.`,
  },
  {
    title: "6. User Conduct",
    body: `You agree not to use VELTRIX to: (a) upload harmful, defamatory, or illegal content; (b) harass other users; (c) circumvent access controls or security mechanisms; (d) engage in automated scraping or data harvesting; or (e) impersonate another person or organisation.`,
  },
  {
    title: "7. Intellectual Property",
    body: `All content on VELTRIX, including the logo, design system, and platform code, is the intellectual property of the VELTRIX development team and ANITS. You may not reproduce or redistribute platform materials without explicit written permission.`,
  },
  {
    title: "8. Limitation of Liability",
    body: `VELTRIX is provided "as is" without warranties of any kind. We do not guarantee uninterrupted availability. To the maximum extent permitted by law, VELTRIX and ANITS are not liable for any indirect, incidental, or consequential damages arising from your use of the platform.`,
  },
  {
    title: "9. Modifications",
    body: `We reserve the right to modify these terms at any time. Changes will be communicated via platform notification. Continued use after modifications constitutes acceptance of the revised terms.`,
  },
  {
    title: "10. Governing Law",
    body: `These terms are governed by the laws of India. Any dispute arising from your use of VELTRIX shall be subject to the exclusive jurisdiction of courts in Visakhapatnam, Andhra Pradesh.`,
  },
  {
    title: "11. Contact",
    body: `For questions regarding these terms, contact: legal@veltrix.universe\nANITS Campus, Visakhapatnam, Andhra Pradesh, India — 531 163`,
  },
];

export default function TermsAndConditions() {
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
            background: "radial-gradient(ellipse at 30% 60%, rgba(0,255,136,0.07) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />
        <p className="font-space" style={{ color: "var(--green)", letterSpacing: "3px", fontSize: "0.85rem", marginBottom: "12px" }}>
          ⚖ LEGAL DOCS
        </p>
        <h1 className="font-bangers" style={{ fontSize: "clamp(2.5rem, 6vw, 5rem)", color: "white", lineHeight: 1, marginBottom: "20px" }}>
          Terms &amp; <span style={{ color: "var(--green)" }}>Conditions</span>
        </h1>
        <p className="font-space" style={{ opacity: 0.6, fontSize: "0.95rem", maxWidth: "600px" }}>
          Last updated: June 2026 · Applies to all VELTRIX users at ANITS
        </p>
      </div>

      {/* Body */}
      <div style={{ maxWidth: "820px", margin: "0 auto", padding: "60px var(--side-padding) 100px" }}>
        <p className="font-space" style={{ lineHeight: "1.8", fontSize: "1rem", marginBottom: "48px", opacity: 0.75 }}>
          Please read these Terms and Conditions carefully before using the VELTRIX platform. These terms constitute
          a legally binding agreement between you and the VELTRIX team at ANITS.
        </p>

        {sections.map((sec) => (
          <div key={sec.title} style={{ marginBottom: "40px" }}>
            <h2 className="font-bebas" style={{ fontSize: "1.4rem", color: "var(--green)", letterSpacing: "2px", marginBottom: "12px" }}>
              {sec.title}
            </h2>
            <p className="font-space" style={{ lineHeight: "1.8", opacity: 0.75, whiteSpace: "pre-line" }}>
              {sec.body}
            </p>
          </div>
        ))}
      </div>
    </>
  );
}
