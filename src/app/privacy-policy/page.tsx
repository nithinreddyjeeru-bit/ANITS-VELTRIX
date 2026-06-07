import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — VELTRIX",
  description: "How VELTRIX collects, uses, and protects your personal data.",
};

const sections = [
  {
    title: "1. Information We Collect",
    body: `When you register on VELTRIX, we collect your name, college email address, roll number, department, and year of study. During event registration we may also collect team details and preferences. Usage data such as pages visited, events browsed, and XP earned is automatically recorded to improve the platform.`,
  },
  {
    title: "2. How We Use Your Information",
    body: `Your data is used to operate the VELTRIX platform — managing your account, processing event registrations, issuing certificates, and displaying leaderboard rankings. We may send transactional emails (registration confirmations, event reminders, and certificate issuance) using the email address you provide. We do not use your data for third-party advertising.`,
  },
  {
    title: "3. Data Sharing",
    body: `We do not sell or rent your personal information to any third party. Event coordinators and club administrators can see the list of registered participants for events they manage. Your name and XP score are visible on public leaderboards; you can opt out from your profile settings.`,
  },
  {
    title: "4. Cookies & Local Storage",
    body: `VELTRIX uses browser local storage to persist your session and preferences. We do not use tracking cookies for advertising purposes. Analytics data is collected in aggregate and is not tied to personally identifiable information.`,
  },
  {
    title: "5. Data Retention",
    body: `Your account data is retained for as long as your account is active. Certificates and participation records are retained indefinitely as part of your academic activity history. You may request deletion of your account and associated data by contacting us at the address below.`,
  },
  {
    title: "6. Security",
    body: `All data is stored on Supabase-managed infrastructure with row-level security policies. Passwords are never stored in plain text. While we implement industry-standard security measures, no system is completely invulnerable and we encourage you to use a strong, unique password.`,
  },
  {
    title: "7. Your Rights",
    body: `You have the right to access, correct, or request deletion of your personal data. To exercise these rights, email us at privacy@veltrix.universe with your registered email address. We will respond within 7 business days.`,
  },
  {
    title: "8. Changes to This Policy",
    body: `We may update this Privacy Policy from time to time. Any significant changes will be communicated via a platform notification. Continued use of VELTRIX after changes constitutes your acceptance of the updated policy.`,
  },
  {
    title: "9. Contact",
    body: `For privacy-related inquiries, contact: privacy@veltrix.universe\nANITS Campus, Visakhapatnam, Andhra Pradesh, India — 531 163`,
  },
];

export default function PrivacyPolicy() {
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
            background: "radial-gradient(ellipse at 70% 50%, rgba(255,0,102,0.08) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />
        <p className="font-space" style={{ color: "var(--green)", letterSpacing: "3px", fontSize: "0.85rem", marginBottom: "12px" }}>
          ⚖ LEGAL DOCS
        </p>
        <h1 className="font-bangers" style={{ fontSize: "clamp(2.5rem, 6vw, 5rem)", color: "white", lineHeight: 1, marginBottom: "20px" }}>
          Privacy <span style={{ color: "var(--pink)" }}>Policy</span>
        </h1>
        <p className="font-space" style={{ opacity: 0.6, fontSize: "0.95rem", maxWidth: "600px" }}>
          Last updated: June 2026 · Effective for all VELTRIX accounts at ANITS
        </p>
      </div>

      {/* Body */}
      <div style={{ maxWidth: "820px", margin: "0 auto", padding: "60px var(--side-padding) 100px" }}>
        <p className="font-space" style={{ lineHeight: "1.8", fontSize: "1rem", marginBottom: "48px", opacity: 0.75 }}>
          VELTRIX ("we", "us", or "our") is committed to protecting your privacy. This policy explains what information
          we collect, how we use it, and the choices you have. By using the VELTRIX platform, you agree to the practices
          described below.
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
